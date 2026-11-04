// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Provas da 1.16.3 (ramo provas-1.16.3, D1 e D2), refeitas com o protocolo de depuração, sem Playwright:
//   D1  duas janelas do mesmo quadro: A só apresenta e troca de slide, B escreve e grava; A sai da apresentação e a
//       vista dela vai com a revisão velha (412). O que A escrever depois tem de ser gravado, sem perder o de B.
//   D2  o servidor é reaberto com a janela aberta (código novo); o slide que ainda não tinha aparecido falha com 401.
//       Quando a janela do programa entrega o cookie novo, o slide tem de aparecer em poucos segundos (antes, só na
//       próxima tentativa da imagem, até 30 s depois).
// Edge sem janela, servidor com dados temporários; nada abre na tela.
//   node tests/e2e_concorrencia_sessao.mjs [--raiz <pasta de outra versão>]
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigo, entrarNoNavegador } from './acesso.mjs';
import { pastaTemporaria } from './temporario.mjs';

const args = process.argv.slice(2), iR = args.indexOf('--raiz');
const RAIZ = iR >= 0 ? resolve(args[iR + 1]) : join(dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };

const tmp = pastaTemporaria('giz-conc-'), DADOS = join(tmp, 'dados');
mkdirSync(DADOS, { recursive: true });
const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
let servidor, token = '';
const navs = [];
const subirServidor = async () => {
  servidor = spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' });
  const antes = token; token = '';
  for (let t = 0; t < 150 && (!token || token === antes); t++) { try { token = await codigo(BASE, DADOS); } catch {} if (!token || token === antes) await espera(100); }
};
// uma aba do navegador, com o protocolo de depuração próprio
async function aba(alvo) {
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pend = new Map(), erros = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.id) { const f = pend.get(m.id); if (typeof f === 'function') f(m); pend.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
  const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => { pend.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
      setTimeout(() => { if (pend.delete(id)) rej(new Error('sem resposta: ' + method)); }, 30000); }); };
  const avaliar = async e => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result?.value; };
  const ate = async (e, ms = 15000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await avaliar(e).catch(() => false)) return true; await espera(100); } return false; };
  const tecla = async (key, code, vk) => { await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk }); };
  const traco = async (x, y) => { const m = (type, X, Y) => cdp('Input.dispatchMouseEvent', { type, x: X, y: Y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
    await m('mousePressed', x, y); for (let i = 1; i <= 8; i++) await m('mouseMoved', x + i * 15, y + i * 3); await m('mouseReleased', x + 120, y + 24); };
  await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Network.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  return { cdp, avaliar, ate, tecla, traco, erros };
}
const abrir = async (A, id) => {
  await A.cdp('Page.navigate', { url: `${BASE}/#/b/${id}` });
  await A.ate(`window.__lousa?.S?.id === ${JSON.stringify(id)}`, 30000); await espera(700);
  await A.avaliar(`document.querySelector('[data-p]')?.click(); document.querySelectorAll('dialog[open]').forEach(d => d.close())`);
};
const api = async (metodo, rota, corpo) => (await fetch(BASE + rota, { method: metodo, headers: { 'X-Lousa': token, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined })).json();
const tracosNoDisco = id => JSON.parse(readFileSync(join(DADOS, id + '.json'), 'utf8')).items.filter(i => i.type === 'stroke').length;

try {
  await subirServidor();
  // cada janela é um navegador sem janela, com o próprio perfil: uma aba em segundo plano teria os relógios e o
  // desenho quase parados, e o teste não mediria o programa
  const navegador = async nome => {
    const porta = await portaLivre();
    const p = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${join(tmp, 'perfil-' + nome)}`, '--no-first-run',
      '--no-default-browser-check', '--window-size=1280,720',
      // três navegadores ao mesmo tempo: o Windows marcava as janelas como cobertas e o navegador parava de desenhar
      '--disable-features=CalculateNativeWinOcclusion', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
      'about:blank'], { stdio: 'ignore' });
    navs.push(p);
    let alvo; for (let t = 0; t < 100 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); } }
    const a = await aba(alvo);
    await entrarNoNavegador(a.cdp, BASE, token);
    return a;
  };
  const A = await navegador('a');
  const L = { mode: 'pages', kind: 's169', w: 1280, h: 720, gap: 48, count: 8 };

  // ---------- D1 ----------
  console.log('D1: duas janelas do mesmo quadro');
  await api('PUT', '/api/boards/d1', { board: { version: 2, title: 'D1', background: { color: '#ffffff', pattern: 'none' }, layout: L, view: null, items: [] }, revision: 0, criar: true });
  const B = await navegador('b');
  await abrir(A, 'd1'); await abrir(B, 'd1');
  await A.avaliar(`document.getElementById('bPresent').click()`); await espera(900);
  await A.tecla('PageDown', 'PageDown', 34); await espera(300); await A.tecla('PageDown', 'PageDown', 34); await espera(300);
  await B.traco(300, 300);
  conferir('B escreve e grava', await B.ate(`document.getElementById('bStatus').textContent === 'Salvo'`, 15000) && tracosNoDisco('d1') === 1);
  await A.avaliar(`document.getElementById('ppExit').click()`); await espera(900);
  await espera(11500);   // a vista de A sai sozinha 10 s depois de parar fora da apresentação, com a revisão velha
  const estado = await A.avaliar(`({ st: document.getElementById('bStatus').textContent, erro: document.getElementById('bStatus').classList.contains('err'), itens: window.__lousa.S.items.filter(i => i.type === 'stroke').length })`);
  conferir('A não fica em conflito só pela vista (recebe o traço de B)', !estado.erro && estado.itens === 1, JSON.stringify(estado));
  await A.traco(400, 420);
  await A.ate(`document.getElementById('bStatus').textContent === 'Salvo'`, 15000); await espera(500);
  conferir('o que A escreve depois chega ao disco, com o de B', tracosNoDisco('d1') === 2, `${tracosNoDisco('d1')} traços no disco`);

  // D1b (Ordem 21 do Codex, achado 1): A muda só o título (sem tocar nos itens), com a revisão velha. Não é conflito só
  // de vista: a troca do título não pode sumir em silêncio
  await B.avaliar(`location.reload()`); await espera(500); await abrir(B, 'd1');
  await B.traco(500, 300);
  conferir('D1b: B grava mais um traço', await B.ate(`document.getElementById('bStatus').textContent === 'Salvo'`, 15000) && tracosNoDisco('d1') === 3);
  await A.avaliar(`(() => { const t = document.getElementById('bTitle'); t.value = 'Título novo de A'; t.dispatchEvent(new Event('change')); })()`);
  await espera(4000);
  const d1b = await A.avaliar(`({ titulo: window.__lousa.S.board.title, st: document.getElementById('bStatus').textContent, erro: document.getElementById('bStatus').classList.contains('err') })`);
  const tituloDisco = JSON.parse(readFileSync(join(DADOS, 'd1.json'), 'utf8')).title;
  conferir('D1b: o título novo de A não some em silêncio (fica na janela e no disco, ou A avisa do conflito)',
    d1b.titulo === 'Título novo de A' && (tituloDisco === 'Título novo de A' || d1b.erro), JSON.stringify({ ...d1b, tituloDisco }));

  // D1c: o mesmo com o fundo (cor e folha), pelo menu da folha, sem tocar nos itens
  await api('PUT', '/api/boards/d1c', { board: { version: 2, title: 'D1c', background: { color: '#ffffff', pattern: 'none' }, layout: L, view: null, items: [] }, revision: 0, criar: true });
  // janelas novas: a A do D1b pode ter ficado com o título por gravar, e recarregar pararia no aviso de sair da página
  const A2 = await navegador('a2'), B2 = await navegador('b2');
  await abrir(A2, 'd1c'); await abrir(B2, 'd1c');
  await B2.traco(300, 300);
  conferir('D1c: B grava um traço', await B2.ate(`document.getElementById('bStatus').textContent === 'Salvo'`, 15000) && tracosNoDisco('d1c') === 1);
  const fundo = await A2.avaliar(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('tPaper').click(); await w(300);
    const c = [...document.querySelectorAll('[data-c]')].find(x => x.dataset.c && x.dataset.c.toLowerCase() !== '#ffffff'); c.click(); await w(300);
    const p = [...document.querySelectorAll('[data-p]')].find(x => x.dataset.p && x.dataset.p !== 'none'); p.click(); await w(100);
    return { color: c.dataset.c, pattern: p.dataset.p }; })()`);
  await espera(4000);
  const d1c = await A2.avaliar(`({ bg: window.__lousa.S.board.background, erro: document.getElementById('bStatus').classList.contains('err') })`);
  const bgDisco = JSON.parse(readFileSync(join(DADOS, 'd1c.json'), 'utf8')).background || {};
  const bateFundo = b => b && b.color === fundo.color && b.pattern === fundo.pattern;
  conferir('D1c: a cor e a folha novas de A não somem em silêncio (ficam na janela e no disco, ou A avisa do conflito)',
    bateFundo(d1c.bg) && (bateFundo(bgDisco) || d1c.erro), JSON.stringify({ fundo, janela: d1c.bg, erro: d1c.erro, disco: bgDisco }));

  // ---------- D2 ----------
  console.log('D2: servidor reaberto com a janela aberta');
  const C = await navegador('c');   // outra janela: a A acabou de sair da tela cheia, que o navegador sem janela não desenha bem
  await C.cdp('Page.navigate', { url: BASE + '/' }); await C.ate('document.readyState === "complete"', 15000);
  await C.cdp('Page.bringToFront');   // sem isso, o navegador sem janela às vezes deixava a página oculta e sem desenhar
  const cor = i => [(i * 53 + 30) % 256, (i * 97 + 70) % 256, (i * 31 + 120) % 256];
  const srcs = await C.avaliar(`(async () => { const out = [];
    for (let i = 0; i < 8; i++) { const c = document.createElement('canvas'); c.width = 640; c.height = 360; const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, 640, 360); g.fillStyle = 'rgb(' + [(i * 53 + 30) % 256, (i * 97 + 70) % 256, (i * 31 + 120) % 256].join(',') + ')'; g.fillRect(220, 80, 200, 200);
      const b = await new Promise(r => c.toBlob(r, 'image/png'));
      out.push((await (await fetch('/api/assets', { method: 'POST', headers: { 'X-Lousa': ${JSON.stringify(token)}, 'Content-Type': 'image/png' }, body: b })).json()).url); }
    return out; })()`);
  const itens = srcs.map((src, k) => ({ id: 'i' + k, type: 'image', locked: true, x: 0, y: k * (L.h + L.gap), w: L.w, h: L.h, src }));
  await api('PUT', '/api/boards/d2', { board: { version: 2, title: 'D2', background: { color: '#ffffff', pattern: 'none' }, layout: L, view: null, items: itens }, revision: 0, criar: true });
  await abrir(C, 'd2'); await espera(800);   // sem apresentação: a tela cheia do navegador sem janela não é o caso medido
  const pixel = () => C.avaliar(`(() => { const c = document.getElementById('cv'); return [...c.getContext('2d').getImageData(c.width / 2 | 0, c.height / 2 | 0, 1, 1).data].slice(0, 3); })()`);
  const bate = (p, i) => p && cor(i).every((v, k) => Math.abs(v - p[k]) <= 6);
  let s1 = false; for (let t = 0; t < 100 && !s1; t++) { s1 = bate(await pixel(), 0); if (!s1) await espera(100); }
  conferir('slide 1 na tela', s1);
  // o servidor cai e volta com outro código; a página continua aberta, com o cookie velho
  servidor.kill(); await espera(800);
  await subirServidor();
  for (let k = 0; k < 4; k++) { await C.avaliar(`document.getElementById('pgNext').click()`); await espera(250); }   // o botão: as teclas dependiam do foco
  conferir('foi para a página 5', await C.avaliar(`document.getElementById('pgLabel').textContent.includes('5')`), await C.avaliar(`document.getElementById('pgLabel').textContent`));
  await espera(12000);   // passa das tentativas de 0, 0,5, 2,5 e 10,5 s: a próxima, sem a correção, seria só aos 40 s
  conferir('com o código velho, o slide novo não aparece (401)', !bate(await pixel(), 4));
  await C.cdp('Page.bringToFront');
  // a janela do programa entrega o cookie novo (como no teste janela_servidor_cai)
  await entrarNoNavegador(C.cdp, BASE, token);
  const t0 = Date.now(); let apareceu = false;
  while (Date.now() - t0 < 15000) { if (bate(await pixel(), 4)) { apareceu = true; break; } await espera(100); }
  const s = ((Date.now() - t0) / 1000).toFixed(1);
  if (!apareceu) {
    const v = await C.avaliar('document.visibilityState + " " + document.hasFocus()').catch(e => 'sem resposta: ' + e.message);
    const raf = await Promise.race([C.avaliar('new Promise(r => requestAnimationFrame(() => r("raf ok")))').catch(e => e.message), espera(3000).then(() => 'raf parado')]);
    const img = await C.avaliar(`import('/js/render.js').then(R => JSON.stringify(R.estadoDasImagens()))`).catch(e => e.message);
    console.log('    diagnóstico:', v, '|', raf, '|', img);
  }
  conferir('com o cookie novo, o slide aparece em até 6 s', apareceu && Date.now() - t0 < 6000, `${apareceu ? s + ' s' : 'não apareceu em 15 s'}`);
  conferir('nenhum erro na página', C.erros.length === 0, C.erros.slice(0, 3).join(' | '));
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally {
  try { await fetch(BASE + '/api/sair', { method: 'POST' }); } catch {}
  for (const p of navs) try { p.kill(); } catch {}
  try { servidor?.kill(); } catch {}
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
