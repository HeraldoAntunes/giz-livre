// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// D10 (relato de 19/11/2026): "tive queda de velocidade quando abri aquele seletor de slides e movi para o início, ele
// não carregava os slides". Quadro sintético de N slides com imagens PNG distintas (como um pptx de verdade, ~1 MB
// cada), Edge sem janela, servidor com dados temporários. Abre no último slide, abre o painel de páginas, rola até o
// fim e volta ao início, e mede quanto tempo as miniaturas do topo levam para aparecer, quantas ficam em branco e
// quantas imagens inteiras ficam guardadas na página (memória).
//   node tests/e2e_painel_paginas.mjs [--slides 180] [--raiz <pasta de outra versão>] [--lento]
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { codigo, entrarNoNavegador } from './acesso.mjs';
import { pastaTemporaria, pastaDeEvidencia } from './temporario.mjs';

const args = process.argv.slice(2), iR = args.indexOf('--raiz');
const RAIZ = iR >= 0 ? resolve(args[iR + 1]) : join(dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };

// PNG de uma cor só (sem dependências)
function png(w, h, [r, g, b]) {
  const crc = buf => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    let x = 0xffffffff; for (const v of buf) x = t[(x ^ v) & 0xff] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
  const bloco = (tipo, dados) => { const l = Buffer.alloc(4); l.writeUInt32BE(dados.length); const td = Buffer.concat([Buffer.from(tipo), dados]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const linha = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3).map((_, i) => [r, g, b][i % 3])]);
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), bloco('IHDR', ihdr), bloco('IDAT', deflateSync(Buffer.concat(Array(h).fill(linha)))), bloco('IEND', Buffer.alloc(0))]);
}

const tmp = pastaTemporaria('giz-d10-'), DADOS = join(tmp, 'dados');
mkdirSync(DADOS, { recursive: true });
const procs = [];
const L = n => ({ mode: 'pages', kind: 's169', w: 1280, h: 720, gap: 48, count: n });
const passo = 720 + 48;

try {
  const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
  procs.push(spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' }));
  let token = ''; for (let t = 0; t < 150 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(100); } }
  const api = (metodo, rota, corpo, tipo = 'application/json') => fetch(BASE + rota, { method: metodo, headers: { 'X-Lousa': token, 'Content-Type': tipo }, body: tipo === 'application/json' ? JSON.stringify(corpo) : corpo });
  const subir = async cor => (await (await api('POST', '/api/assets', png(64, 36, cor), 'image/png')).json()).url;
  const criar = (id, board) => api('PUT', `/api/boards/${id}`, { board: { version: 2, background: { color: '#ffffff', pattern: 'none' }, view: null, ...board }, revision: 0, criar: true });
  const paginaImg = (k, src) => ({ id: 'pg' + k, type: 'image', locked: true, x: 0, y: k * passo, w: 1280, h: 720, src });

  const porta = await portaLivre();
  procs.push(spawn(EDGE, ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${join(tmp, 'perfil')}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1920,1080', 'about:blank'], { stdio: 'ignore' }));
  let alvo; for (let t = 0; t < 100 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); } }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pend = new Map(), erros = [], escolhas = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    if (m.method === 'Page.fileChooserOpened') escolhas.push(m.params);
    if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
  const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => pend.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result))); };
  const avaliar = async e => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result?.value; };
  const ate = async (e, ms = 15000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await avaliar(e).catch(() => false)) return true; await espera(100); } return false; };
  const tecla = async (key, code, vk, modifiers = 0) => { await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, modifiers });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, modifiers }); };
  const tela = (w, h) => cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Performance.enable');
  // o Edge sem janela esconde a aba (visibilityState hidden) e para o IntersectionObserver: a janela de verdade não
  await cdp('Emulation.setFocusEmulationEnabled', { enabled: true }); await cdp('Page.bringToFront');
  await tela(1920, 1080);
  await entrarNoNavegador(cdp, BASE, token);
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('lousa.abas', '{"ocultas":[],"escolhido":true}'); localStorage.setItem('lousa.ajuda', '{"tourVisto":true}'); } catch {}
    Element.prototype.requestFullscreen = function () { return Promise.resolve(); };` });
  const abrir = async id => {
    await cdp('Page.navigate', { url: `${BASE}/#/b/${id}` });
    await ate(`window.__lousa?.S?.id === ${JSON.stringify(id)}`, 30000); await espera(900);
    await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);
  };
  // ponto do mundo → tela
  const naTela = async (x, y) => avaliar(`(() => { const v = window.__lousa.S.view; return [${x} * v.zoom + v.x, ${y} * v.zoom + v.y]; })()`);
  const mouse = (type, x, y) => cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
  const arrastar = async (pts) => { await mouse('mousePressed', ...pts[0]); for (const p of pts.slice(1)) await mouse('mouseMoved', ...p); await mouse('mouseReleased', ...pts.at(-1)); };
  const EVID = pastaDeEvidencia('e2e_painel_paginas');
  const foto = async nome => writeFileSync(join(EVID, nome + '.png'), Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  const N = Number(args[args.indexOf('--slides') + 1]) || 180, LENTO = args.includes('--lento');
  if (LENTO) await cdp('Emulation.setCPUThrottlingRate', { rate: 4 });
  console.log(`gerando ${N} slides sintéticos`);
  await cdp('Page.navigate', { url: BASE + '/' }); await espera(1500);
  const srcs = await avaliar(`(async () => {
    const out = [];
    for (let i = 0; i < ${N}; i++) {
      const c = document.createElement('canvas'); c.width = 1600; c.height = 900;
      const g = c.getContext('2d');
      g.fillStyle = 'rgb(' + [(i * 37 + 20) % 200 + 30, (i * 91 + 60) % 200 + 30, (i * 53 + 100) % 200 + 30].join(',') + ')'; g.fillRect(0, 0, 1600, 900);
      const ruido = g.createImageData(420, 420);
      for (let p = 0; p < ruido.data.length; p++) ruido.data[p] = (p & 3) === 3 ? 255 : (Math.random() * 256) | 0;
      g.putImageData(ruido, 1100, 420);
      g.fillStyle = '#fff'; g.font = 'bold 90px Segoe UI'; g.fillText('Slide ' + (i + 1), 80, 160);
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      let r; for (let t = 0; t < 3 && !r; t++) { try { r = await fetch('/api/assets', { method: 'POST', headers: { 'X-Lousa': ${JSON.stringify(token)}, 'Content-Type': 'image/png' }, body: blob }); } catch { await new Promise(s => setTimeout(s, 400)); } }
      out.push((await r.json()).url);
    }
    return out; })()`);
  await criar('d10', { title: 'Quadro grande sintético', layout: L(N), view: { x: 0, y: -(N - 1) * passo * 0.7, zoom: 0.7 },
    items: srcs.map((s, k) => paginaImg(k, s)) });
  await abrir('d10');
  const R = {};
  // como numa aula: passa por todos os slides (a página guarda as imagens que viu)
  await tecla('Home', 'Home', 36); await espera(300);
  for (let k = 0; k < N; k++) { await tecla('PageDown', 'PageDown', 34); await espera(60); }
  await espera(1500);
  R.imagensDepoisDaAula = await avaliar(`window.__lousa?.imagens?.() ?? -1`);
  // memória de verdade dos processos do Edge deste teste (o perfil temporário está na linha de comando): as imagens
  // decodificadas ficam no processo da página, fora do heap do JavaScript
  try {
    R.edgeDepoisDaAulaMB = Math.round(Number(execFileSync('powershell', ['-NoProfile', '-Command', `(Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${tmp.replace(/'/g, "''")}*' } | Measure-Object -Property WorkingSetSize -Sum).Sum`], { encoding: 'utf8' }).trim()) / 1048576);
  } catch { R.edgeDepoisDaAulaMB = null; }
  R.heapDepoisDaAulaMB = Math.round((await cdp('Performance.getMetrics')).metrics?.find(m => m.name === 'JSHeapUsedSize')?.value / 1048576) || null;
  const t0 = Date.now();
  await cdp('Page.bringToFront');
  R.visivel = await avaliar('document.visibilityState');
  await avaliar(`document.getElementById('pgAll').click()`);
  // a miniatura de verdade não é a do lugar (cinza ou branca): o centro tem a cor do slide
  const desenhadas = (de, ate) => avaliar(`(() => { const cs = [...document.querySelectorAll('#ppList .pthumb')].slice(${de}, ${ate}).map(b => b.firstChild);
    return cs.filter(c => { try { const d = c.getContext('2d').getImageData(c.width / 4 | 0, c.height / 2 | 0, 1, 1).data; return !(d[0] > 235 && d[1] > 235 && d[2] > 235) && !(d[3] === 0); } catch { return false; } }).length; })()`);
  await ate(`document.querySelectorAll('#ppList .pthumb').length === ${N}`, 10000);
  // rola de uma vez até o fim e passa pelo meio depressa (como arrastar a barra), e volta ao início
  await avaliar(`document.getElementById('ppList').scrollTop = 1e9`); await espera(150);
  for (let k = 10; k >= 1; k--) { await avaliar(`(() => { const l = document.getElementById('ppList'); l.scrollTop = l.scrollHeight * ${k} / 11; })()`); await espera(120); }
  await avaliar(`document.getElementById('ppList').scrollTop = 0`);
  const tIni = Date.now();
  let ok8 = false;
  for (let t = 0; t < 600; t++) { if ((await desenhadas(0, 8)) >= 8) { ok8 = true; break; } await espera(100); }
  R.topoMs = ok8 ? Date.now() - tIni : null;
  await espera(4000);
  R.topoDesenhadas = await desenhadas(0, 8);
  R.imagensGuardadas = await avaliar(`window.__lousa?.imagens?.() ?? -1`);
  R.heapMB = Math.round((await cdp('Performance.getMetrics')).metrics?.find(m => m.name === 'JSHeapUsedSize')?.value / 1048576) || null;
  console.log('RESULTADO', JSON.stringify(R));
  writeFileSync(join(EVID, `resultado${LENTO ? '-lento' : ''}.json`), JSON.stringify({ N, ...R }, null, 1));
  conferir(`as 8 primeiras miniaturas aparecem depois de voltar ao início (${R.topoMs} ms)`, ok8 && R.topoMs < 8000, JSON.stringify(R));
  conferir('nenhuma das 8 fica em branco', R.topoDesenhadas === 8, String(R.topoDesenhadas));
  conferir('nenhum erro na página', !erros.length, erros.join(' | '));
} catch (e) {
  falhas++; console.log('  ✗ parou:', e.message);
} finally {
  for (const p of procs) { try { p.kill(); } catch {} }
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
