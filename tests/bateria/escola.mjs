// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Bateria "escola pública": projetor de 1024×768 e máquina lenta (processador 6× mais lento, emulado pelo navegador).
// Sobe o server.py numa porta livre com dados temporários, abre a galeria e um quadro com 30 páginas num navegador sem
// janela e confere: nada da interface fica fora da tela (nem barra de rolagem lateral), tempos de abertura aceitáveis,
// desenhar um traço continua respondendo. Capturas em <saída>.
//   node tests/bateria/escola.mjs [pasta de saída]      (GIZ_NAVEGADOR=<caminho> para outro navegador)
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigo, entrarNoNavegador } from '../acesso.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tmp = mkdtempSync(join(tmpdir(), 'giz-escola-')), DADOS = join(tmp, 'quadros'); mkdirSync(DADOS);
const SAIDA = process.argv[2] || join(tmp, 'saida'); mkdirSync(SAIDA, { recursive: true });
const NAV = [process.env.GIZ_NAVEGADOR, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(c => c && existsSync(c));
const [W, H] = (process.env.GIZ_TELA || '1024x768').split('x').map(Number), LENTO = 6;   // GIZ_TELA=1366x768 para outro tamanho
const espera = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
let srv, nav, ws, n = 0; const pend = new Map();
const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { pend.set(id, m => m.error ? rej(new Error(m.error.message)) : res(m.result)); }); };
const avaliar = async e => (await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.value;
async function esperarAte(expr, ms) { const fim = Date.now() + ms; while (Date.now() < fim) { const v = await avaliar(expr); if (v) return v; await espera(200); } return null; }
async function foto(nome) { const r = await cdp('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(SAIDA, nome + '.png'), Buffer.from(r.data, 'base64')); }
// elementos visíveis da interface que saem da tela (o quadro em si pode passar da tela: ele rola)
const FORA = `(() => { const fora = [], cobertos = [];
  for (const el of document.querySelectorAll('button, .ib, input, select, [data-sel]')) {
    const r = el.getBoundingClientRect(), st = getComputedStyle(el);
    if (!r.width || !r.height || st.visibility === 'hidden' || st.display === 'none' || el.closest('[hidden], dialog:not([open])')) continue;
    const nome = (el.title || el.getAttribute('aria-label') || el.textContent || el.id).toString().trim().slice(0, 40);
    // as canetas sobem um pouco acima da barra de propósito: conta só o que sai pelos lados ou por baixo
    // por baixo só conta nas barras fixas: a galeria e o conteúdo de uma barra que rola por dentro podem passar da tela
    const rolaveis = el.closest('.teachbar');
    if (r.right > innerWidth + 1 || r.left < -1 || (r.bottom > innerHeight + 1 && el.closest('.bar') && !rolaveis)) { fora.push(nome); continue; }
    if (rolaveis && (r.bottom > innerHeight || r.top < 0)) continue;
    if (r.bottom > innerHeight || r.top < 0) continue;   // meio fora da tela numa área que rola (galeria): não dá para medir
    if (rolaveis) { const rb = rolaveis.getBoundingClientRect(); if (r.top + r.height / 2 > rb.bottom || r.top + r.height / 2 < rb.top) continue; }
    const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    const topo = document.elementFromPoint(cx, cy);
    if (topo && !el.contains(topo) && !topo.contains(el) && !topo.closest('dialog[open], .tour')) cobertos.push(nome + ' (sob ' + (topo.id || String(topo.className.baseVal ?? topo.className)).slice(0, 30) + ')');
  }
  return { fora: [...new Set(fora)].slice(0, 15), cobertos: [...new Set(cobertos)].slice(0, 15),
           rolagemLateral: document.scrollingElement.scrollWidth > innerWidth + 1 }; })()`;

// perfil novo: a escolha das áreas e o tour de boas-vindas aparecem por cima (e o tour contorna a barra das canetas)
async function fecharBoasVindas() {
  for (let i = 0; i < 12; i++) {
    const clicou = await avaliar(`(() => { const b = [...document.querySelectorAll('button')].find(b => ['Começar','Pular'].includes(b.textContent.trim()) && b.offsetParent); if (b) { b.click(); return true; } return false; })()`);
    await espera(clicou ? 600 : 400);
  }
}

try {
  console.log(`Escola: tela ${W}×${H}, processador ${LENTO}× mais lento`);
  srv = spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' });
  let token; for (let t = 0; t < 100 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(150); } }
  const L = { mode: 'pages', kind: 'a4', count: 30, w: 794, h: 1123, gap: 48 };
  const itens = [];
  for (let p = 0; p < 30; p++) for (let k = 0; k < 20; k++)
    itens.push({ type: 'stroke', id: `s${p}_${k}`, color: '#1a1a1a', w: 3, pts: Array.from({ length: 40 }, (_, i) => [80 + i * 15, p * 1171 + 100 + k * 45 + (i % 3) * 4, 0.5]).flat() });
  await fetch(BASE + '/api/boards/escola30', { method: 'PUT', headers: { 'X-Lousa': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: { title: 'Aula de 30 páginas', layout: L, items: itens }, revision: 0 }) });
  const pc = await portaLivre();
  nav = spawn(NAV, ['--headless=new', `--remote-debugging-port=${pc}`, `--user-data-dir=${join(tmp, 'perfil')}`, '--no-first-run',
    '--no-default-browser-check', `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
  let alvo; for (let t = 0; t < 100 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${pc}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); } }
  ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { { const f = pend.get(m.id); if (typeof f === 'function') f(m); } pend.delete(m.id); } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await entrarNoNavegador(cdp, BASE, token);
  await cdp('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await cdp('Emulation.setCPUThrottlingRate', { rate: LENTO });

  let t0 = Date.now();
  await cdp('Page.navigate', { url: BASE + '/' });
  const galeria = await esperarAte(`document.body.innerText.includes('Aula de 30 páginas')`, 60000);
  const tGaleria = (Date.now() - t0) / 1000;
  conferir(`galeria abre em até 10 s na máquina lenta (${tGaleria.toFixed(1)} s)`, !!galeria && tGaleria <= 10);
  await espera(1500);
  await fecharBoasVindas();
  await foto(`galeria-${W}x${H}`);
  let f = await avaliar(FORA);
  conferir(`galeria: nenhum botão fora da tela de ${W}×${H} nem coberto, sem rolagem lateral`, !f.fora.length && !f.cobertos.length && !f.rolagemLateral, JSON.stringify(f));

  t0 = Date.now();
  await avaliar(`location.hash = '#/b/escola30'`);
  const aberto = await esperarAte(`!!document.getElementById('bMenu') && location.hash.includes('escola30')`, 60000);
  await espera(500);
  const tQuadro = (Date.now() - t0) / 1000;
  conferir(`quadro de 30 páginas e 600 traços abre em até 15 s na máquina lenta (${tQuadro.toFixed(1)} s)`, !!aberto && tQuadro <= 15);
  await fecharBoasVindas();
  await foto(`quadro-${W}x${H}`);
  f = await avaliar(FORA);
  conferir(`quadro: nenhum botão fora da tela de ${W}×${H} nem coberto por outra barra`, !f.fora.length && !f.cobertos.length && !f.rolagemLateral, JSON.stringify(f));

  // um traço com a máquina lenta: o editor tem de aceitar e salvar
  t0 = Date.now();
  const pts = [[400, 400], [450, 420], [500, 450], [560, 470], [620, 500]];
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: pts[0][0], y: pts[0][1], button: 'left', buttons: 1, clickCount: 1 });
  for (const [x, y] of pts.slice(1)) await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 620, y: 500, button: 'left', buttons: 0, clickCount: 1 });
  let salvo = false;
  for (let i = 0; i < 40 && !salvo; i++) { await espera(250); salvo = (await (await fetch(BASE + '/api/boards/escola30', { headers: { 'X-Lousa': token } })).json()).items.length > itens.length; }
  conferir(`um traço desenhado na máquina lenta é salvo (${((Date.now() - t0) / 1000).toFixed(1)} s)`, salvo);
  await foto('quadro-com-traco');
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally { try { ws?.close(); } catch {} nav?.kill(); srv?.kill(); }
console.log(`\n${ok} conferências passaram, ${falhas} falharam. Capturas em ${SAIDA}`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
