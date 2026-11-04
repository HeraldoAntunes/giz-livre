// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Ordem 21 do Codex, suspeita: o Ctrl+V cola onde a caneta tocou por último (P61 C), e esse ponto era guardado para o
// programa inteiro. Tocar num canto do quadro A, abrir o B (sem recarregar a página) e colar sem tocar nele levava o
// texto para o canto do A. No quadro novo, sem toque nele, o colado tem de ir para o meio da tela.
// Edge sem janela, servidor com dados temporários; nada abre na tela.
//   node tests/e2e_colar_toque.mjs [--raiz <pasta de outra versão>]
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdirSync } from 'node:fs';
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

const tmp = pastaTemporaria('giz-colar-'), DADOS = join(tmp, 'dados');
mkdirSync(DADOS, { recursive: true });
const procs = [];
try {
  const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
  procs.push(spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' }));
  let token = ''; for (let t = 0; t < 150 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(100); } }
  const quadro = (id, titulo) => fetch(`${BASE}/api/boards/${id}`, { method: 'PUT', headers: { 'X-Lousa': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: { version: 2, title: titulo, background: { color: '#ffffff', pattern: 'none' }, view: { x: 0, y: 0, zoom: 1 }, items: [] }, revision: 0, criar: true }) });
  await quadro('qa', 'A'); await quadro('qb', 'B');

  const porta = await portaLivre();
  procs.push(spawn(EDGE, ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${join(tmp, 'perfil')}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' }));
  let alvo; for (let t = 0; t < 100 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); } }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pend = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => pend.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result))); };
  const avaliar = async e => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result?.value; };
  const ate = async (e, ms = 15000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await avaliar(e).catch(() => false)) return true; await espera(100); } return false; };
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await entrarNoNavegador(cdp, BASE, token);

  await cdp('Page.navigate', { url: `${BASE}/#/b/qa` });
  conferir('abre o quadro A', await ate(`window.__lousa?.S?.id === 'qa'`, 30000)); await espera(700);
  await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);
  // um toque da caneta (mouse) longe do meio da tela do A
  const m = (type, x, y) => cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
  await m('mousePressed', 380, 520); await m('mouseMoved', 384, 522); await m('mouseReleased', 384, 522); await espera(300);
  const colar = txt => avaliar(`(() => { const dt = new DataTransfer(); dt.setData('text/plain', ${JSON.stringify(txt)});
    document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true })); })()`);
  const colado = txt => avaliar(`(() => { const S = window.__lousa.S, t = S.items.find(i => i.type === 'text' && i.text === ${JSON.stringify(txt)});
    return t ? { x: t.x * S.view.zoom + S.view.x, y: t.y * S.view.zoom + S.view.y, w: innerWidth, h: innerHeight } : null; })()`);
  // controle: no próprio A, o colado vai para o canto tocado (P61 C); sem isso o teste de baixo não provaria nada
  await colar('colado no A'); await espera(300);
  const ca = await colado('colado no A');
  conferir('no A, o colado vai para onde a caneta tocou', ca && Math.abs(ca.x - 380) < 30 && Math.abs(ca.y - 520) < 30,
    JSON.stringify(ca));
  await espera(2500);   // grava o A antes de sair
  // volta à galeria e abre o B, como pelo programa (sem recarregar a página)
  await avaliar(`location.hash = '#/'`); await espera(800);
  await avaliar(`location.hash = '#/b/qb'`);
  conferir('abre o quadro B', await ate(`window.__lousa?.S?.id === 'qb'`, 15000)); await espera(700);
  await colar('colado no B'); await espera(300);
  const r = await colado('colado no B');
  conferir('o texto foi colado no B', !!r);
  // longe do canto tocado no A: perto do meio da tela (o texto começa no meio)
  conferir('sem toque no B, o colado vai para o meio da tela, não para o ponto tocado no A',
    r && Math.abs(r.x - r.w / 2) < 200 && Math.abs(r.y - r.h / 2) < 200, JSON.stringify(r));
} catch (e) {
  falhas++; console.log('  ✗ parou:', e.message);
} finally {
  for (const p of procs) { try { p.kill(); } catch {} }
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
