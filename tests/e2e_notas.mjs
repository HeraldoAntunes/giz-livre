// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Notas do professor (P64 i) pelo navegador, com cliques e teclas de verdade: o painel Notas grava a nota da página
// que está na tela (item invisível, fora da seleção e do desenho, salvo no arquivo); com uma tela só, apresentar
// mostra só o aviso do Win + P; com duas telas (gancho __gizTelasTeste), abre a janela das notas, que acompanha a
// página, mostra a nota da próxima, passa o slide de volta e fica sabendo que a apresentação acabou.
// Edge sem janela, servidor com dados temporários; nada abre na tela.
//   node tests/e2e_notas.mjs [--raiz <pasta de outra versão>]   (no código da rc.3, para no primeiro passo)
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigo, entrarNoNavegador } from './acesso.mjs';
import { pastaTemporaria } from './temporario.mjs';

const iR = process.argv.indexOf('--raiz');
const RAIZ = iR > 0 ? resolve(process.argv[iR + 1]) : join(dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };

const tmp = pastaTemporaria('giz-notas-'), DADOS = join(tmp, 'dados');
mkdirSync(DADOS, { recursive: true });
const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
let servidor, nav, pc, token = '';
const erros = [];

// uma conexão de depuração por aba (a do quadro e a janela das notas)
async function conectar(alvo) {
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pend = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.id) { const f = pend.get(m.id); if (typeof f === 'function') f(m); pend.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
  const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => { pend.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
      setTimeout(() => { if (pend.delete(id)) rej(new Error('sem resposta: ' + method)); }, 30000); }); };
  // sem gesto: o window.open fora de um clique ou tecla é bloqueado (nuvem, estudo-notas-linux); a apresentação com duas
  // telas usa clique e tecla de verdade (Input.dispatch*), para provar que as notas abrem dentro do tratador
  const avaliar = async e => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result?.value; };
  const ate = async (e, ms = 15000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await avaliar(e).catch(() => false)) return true; await espera(100); } return false; };
  await cdp('Runtime.enable'); await cdp('Page.enable');
  return { ws, cdp, avaliar, ate };
}
const abas = async () => { try { return (await (await fetch(`http://127.0.0.1:${pc}/json/list`)).json()).filter(x => x.type === 'page'); } catch { return []; } };
const janelaDasNotas = async () => (await abas()).find(x => x.url.includes('#/notas/'));

const L = { mode: 'pages', kind: 's169', w: 1280, h: 720, gap: 48, count: 3 };
const QUADRO = { version: 2, title: 'Termoquímica 2026', background: { color: '#ffffff', pattern: 'none' }, layout: L, view: null,
  items: [{ id: 't1', type: 'text', x: 80, y: 900, w: 400, text: 'Lei de Hess', color: '#000', size: 32 }] };

try {
  servidor = spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' });
  for (let t = 0; t < 100 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(100); } }
  pc = await portaLivre();
  nav = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${pc}`, `--user-data-dir=${join(tmp, 'perfil')}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1600,900', 'about:blank'], { stdio: 'ignore' });
  let alvo; for (let t = 0; t < 100 && !alvo; t++) { alvo = (await abas())[0]; if (!alvo) await espera(150); }
  const Q = await conectar(alvo);
  const { cdp, avaliar, ate } = Q;
  const tecla = async (key, code, vk, modifiers = 0) => { await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, modifiers });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, modifiers }); };
  const digitar = t => cdp('Input.insertText', { text: t });
  const clicar = sel => avaliar(`document.querySelector(${JSON.stringify(sel)}).click()`);
  const api = async (metodo, rota, corpo) => { const r = await fetch(BASE + rota, { method: metodo, headers: { 'X-Lousa': token, 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined }); return { status: r.status, corpo: await r.json().catch(() => null) }; };
  const notas = () => avaliar(`window.__lousa.S.items.filter(i => i.type === 'notaprof').map(i => ({ texto: i.texto, y: i.y }))`);
  await entrarNoNavegador(cdp, BASE, token);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });

  conferir('quadro de teste criado', (await api('PUT', '/api/boards/termo', { board: QUADRO, revision: 0, criar: true })).status === 200);
  await cdp('Page.navigate', { url: `${BASE}/#/b/termo` });
  conferir('editor abriu', await ate('window.__lousa?.S?.id === "termo"', 30000));
  await espera(800);
  await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);

  // 1) painel Notas: a nota da página 1, depois a da página 2
  conferir('botão Notas na barra das páginas', await avaliar(`document.getElementById('pgNotas')?.offsetWidth > 0`));
  await clicar('#pgNotas'); await espera(200);
  conferir('o painel abre na página 1', await avaliar(`!document.getElementById('notasPanel').hidden && document.getElementById('notasTitulo').textContent === 'Notas da página 1'`));
  await avaliar(`document.getElementById('notasTexto').focus()`); await digitar('Nota um: perguntar sobre entalpia');
  await espera(1100);
  let nt = await notas();
  conferir('a nota vira um item invisível no topo da página 1', nt.length === 1 && nt[0].texto === 'Nota um: perguntar sobre entalpia' && nt[0].y >= 0 && nt[0].y < 720, JSON.stringify(nt));
  await avaliar('document.activeElement?.blur()');
  await tecla('a', 'KeyA', 65, 2); await espera(200);
  conferir('Ctrl+A não seleciona a nota (o texto do slide sim)', await avaliar(`[...window.__lousa.sel].join()`) === 't1');
  await avaliar('window.__lousa.sel.clear()'); await espera(100);   // com seleção, o PageDown não passa a página
  await tecla('PageDown', 'PageDown', 34); await espera(500);
  conferir('trocar de página troca a nota do painel', await avaliar(`document.getElementById('notasTitulo').textContent === 'Notas da página 2' && document.getElementById('notasTexto').value === ''`));
  await avaliar(`document.getElementById('notasTexto').focus()`); await digitar('Nota dois');
  await avaliar('document.activeElement?.blur()'); await espera(200);   // sair do campo grava na hora
  nt = await notas();
  conferir('a nota da página 2 também, sem mexer na 1', nt.length === 2 && nt.some(n => n.texto === 'Nota dois' && n.y > 720), JSON.stringify(nt));
  await ate(`document.getElementById('bStatus').textContent === 'Salvo'`, 15000); await espera(400);
  const arq = JSON.parse(readFileSync(join(DADOS, 'termo.json'), 'utf8'));
  conferir('as notas ficam salvas no arquivo do quadro', arq.items.filter(i => i.type === 'notaprof').length === 2);
  await clicar('#notasFechar');

  // 2) uma tela só (ou Duplicar): apresentar não abre janela, só o aviso
  await tecla('Home', 'Home', 36); await espera(300);
  await avaliar('window.__gizTelasTeste = false');
  await clicar('#bPresent'); await espera(1000);
  conferir('uma tela: o aviso do Win + P', await avaliar(`document.getElementById('toast').textContent.includes('Win + P')`),
    await avaliar(`document.getElementById('toast').textContent`));
  conferir('uma tela: nenhuma janela das notas aberta', !await janelaDasNotas());
  conferir('na mini-bandeja, o botão das notas (o quadro tem notas)', await avaliar(`document.getElementById('ppNotas').offsetWidth > 0`));
  conferir('o painel Notas não aparece na projeção', await avaliar(`getComputedStyle(document.getElementById('notasPanel')).display === 'none' || document.getElementById('notasPanel').hidden`));
  await clicar('#ppExit'); await espera(700);

  // 3) duas telas (Estender): a janela das notas abre e acompanha a apresentação
  await avaliar('window.__gizTelasTeste = true');
  for (let t = 0; t < 4 && !await avaliar(`document.getElementById('pgLabel').textContent === 'Página 1 de 3'`); t++) { await tecla('PageUp', 'PageUp', 33); await espera(400); }
  conferir('de volta à página 1 antes de apresentar', await avaliar(`document.getElementById('pgLabel').textContent === 'Página 1 de 3'`), await avaliar(`document.getElementById('pgLabel').textContent`));
  // o Edge sem janela não bloqueia popup sem gesto; o que se confere é que o window.open sai DENTRO do tratador do clique
  // ou da tecla (window.event é o próprio evento, e o gesto está ativo), e não depois de um await ou setTimeout
  await avaliar(`(() => { window.__aberturas = []; const o = window.open; window.open = function (...a) {
    window.__aberturas.push({ evento: window.event?.type || null, gesto: !!navigator.userActivation?.isActive }); return o.apply(this, a); }; })()`);
  // clique de verdade no botão Apresentar (mouse no centro dele)
  const centro = await avaliar(`(() => { const r = document.getElementById('bPresent').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  for (const type of ['mousePressed', 'mouseReleased']) await cdp('Input.dispatchMouseEvent', { type, x: centro.x, y: centro.y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
  let j = null; for (let t = 0; t < 60 && !j; t++) { j = await janelaDasNotas(); if (!j) await espera(150); }
  conferir('duas telas: a janela das notas abre', !!j, JSON.stringify((await abas()).map(a => a.url)));
  if (j) {
    const N = await conectar(j);
    await cdp('Page.bringToFront');   // a aba do quadro continua desenhando; a das notas só recebe mensagens
    conferir('ela mostra a nota da página 1 e a da próxima', await N.ate(`document.getElementById('njTexto').textContent === 'Nota um: perguntar sobre entalpia'
      && document.getElementById('njProx').textContent === 'Nota dois' && document.getElementById('njPagina').textContent === 'Página 1 de 3'`, 15000),
      await N.avaliar(`document.getElementById('notasJanela').innerText`));
    conferir('a janela das notas não mostra a galeria nem o quadro', await N.avaliar(`document.getElementById('gallery').hidden && document.getElementById('board').hidden && !document.getElementById('notasJanela').hidden`));
    await tecla('PageDown', 'PageDown', 34); await espera(300);
    conferir('passar o slide atualiza as notas', await N.ate(`document.getElementById('njPagina').textContent === 'Página 2 de 3' && document.getElementById('njTexto').textContent === 'Nota dois'
      && document.getElementById('njProx').textContent === 'Sem nota.'`, 10000));
    await N.avaliar(`document.getElementById('njAnterior').click()`);
    conferir('o Anterior da janela das notas volta o slide da apresentação', await ate(`document.getElementById('ppLabel').textContent === '1 / 3'`, 10000),
      await avaliar(`document.getElementById('ppLabel').textContent`));
    // rc.6: sair da apresentação fecha as notas e põe a marca no título (a janela própria traz a lousa de volta)
    const espiarTitulo = () => avaliar(`(() => { window.__titulos = []; new MutationObserver(() => window.__titulos.push(document.title))
      .observe(document.querySelector('title'), { childList: true, characterData: true, subtree: true }); })()`);
    await espiarTitulo();
    N.ws.close();
    await clicar('#ppExit');
    const ab = await avaliar('window.__aberturas');
    conferir('com o clique de verdade, as notas abrem dentro do tratador do clique, com gesto', ab.length === 1 && ab[0].evento === 'click' && ab[0].gesto, JSON.stringify(ab));
    let sumiu = false; for (let t = 0; t < 40 && !sumiu; t++) { sumiu = !await janelaDasNotas(); if (!sumiu) await espera(150); }
    conferir('Sair: a janela das notas fecha', sumiu);
    conferir('Sair: a marca do fim passa pelo título (o programa fecha as notas e traz a lousa de volta)',
      (await avaliar('window.__titulos')).includes('giz-livre:fim-apresentacao'), JSON.stringify(await avaliar('window.__titulos')));
    await espera(400);
    conferir('e o título da página volta', await avaliar(`document.title.endsWith('Giz Livre')`), await avaliar('document.title'));
    // F5 de verdade: também dentro do tratador da tecla; e sair pelo Esc
    await avaliar('document.activeElement?.blur()');
    await tecla('F5', 'F5', 116); await espera(800);
    const ab2 = await avaliar('window.__aberturas');
    conferir('com o F5 de verdade, também dentro do tratador da tecla, com gesto', ab2.length === 2 && ab2[1].evento === 'keydown' && ab2[1].gesto, JSON.stringify(ab2));
    conferir('as notas abrem de novo', !!await janelaDasNotas());
    await espiarTitulo();
    await tecla('Escape', 'Escape', 27); await espera(300);
    // com a tela cheia ligada, o Esc simulado não chega à página (o de verdade sai da tela cheia e da apresentação junto,
    // ver e2e_marcadores): o mesmo Esc entregue à página percorre o tratador da tecla
    if (await avaliar(`document.getElementById('board').classList.contains('present')`))
      await avaliar(`document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))`);
    sumiu = false; for (let t = 0; t < 40 && !sumiu; t++) { sumiu = !await janelaDasNotas(); if (!sumiu) await espera(150); }
    conferir('Esc: sai da apresentação e a janela das notas fecha', sumiu && !await avaliar(`document.getElementById('board').classList.contains('present')`));
    conferir('Esc: a marca do fim também passa pelo título', (await avaliar('window.__titulos')).includes('giz-livre:fim-apresentacao'));
  }
  conferir('nenhum erro na página', erros.length === 0, erros.slice(0, 3).join(' | '));
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally {
  try { await fetch(BASE + '/api/sair', { method: 'POST' }); } catch {}
  try { nav?.kill(); } catch {} try { servidor?.kill(); } catch {}
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
