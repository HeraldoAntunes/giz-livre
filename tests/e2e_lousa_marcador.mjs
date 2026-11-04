// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Ordem 21 do Codex, achado 3: o arquivo .lousa levava o marcador com a miniatura como endereço da pasta de imagens
// deste PC (/assets/...), sem os bytes; no outro PC o cartão do marcador ficava sem imagem.
// Dois servidores com dados temporários fazem os dois PCs: exporta pelo código do programa no primeiro e importa pelo
// botão de importar da galeria no segundo. Edge sem janela; nada abre na tela.
//   node tests/e2e_lousa_marcador.mjs [--raiz <pasta de outra versão>]
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
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

const tmp = pastaTemporaria('giz-lousa-mk-');
const procs = [];
async function servidor(nome) {
  const dados = join(tmp, nome); mkdirSync(dados, { recursive: true });
  const porta = await portaLivre(), base = `http://127.0.0.1:${porta}`;
  procs.push(spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(porta), '--dados', dados], { stdio: 'ignore' }));
  let token = ''; for (let t = 0; t < 150 && !token; t++) { try { token = await codigo(base, dados); } catch { await espera(100); } }
  return { dados, base, token };
}
async function pagina(srv, nome) {
  const porta = await portaLivre();
  procs.push(spawn(EDGE, ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${join(tmp, 'perfil-' + nome)}`, '--no-first-run',
    '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' }));
  let alvo; for (let t = 0; t < 100 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); } }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pend = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => pend.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result))); };
  const avaliar = async e => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result?.value; };
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await entrarNoNavegador(cdp, srv.base, srv.token);
  await cdp('Page.navigate', { url: srv.base + '/' });
  for (let t = 0; t < 100 && !(await avaliar('document.readyState === "complete" && !!document.getElementById("gImportFile")').catch(() => false)); t++) await espera(100);
  await espera(500);
  return { avaliar };
}

try {
  const pc1 = await servidor('pc1'), pc2 = await servidor('pc2');
  const api = (srv, metodo, rota, corpo, tipo = 'application/json') => fetch(srv.base + rota, { method: metodo,
    headers: { 'X-Lousa': srv.token, 'Content-Type': tipo }, body: corpo });
  // uma PNG de verdade (1 x 1, vermelha) como miniatura do marcador, na pasta de imagens do PC 1
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==', 'base64');
  const mini = (await (await api(pc1, 'POST', '/api/assets', png, 'image/png')).json()).url;
  conferir('PC 1: a miniatura está na pasta de imagens', /^\/assets\/[0-9a-f]{40}\.png$/.test(mini || ''), mini);
  await api(pc1, 'PUT', '/api/boards/q', JSON.stringify({ board: { version: 2, title: 'Aula', background: { color: '#ffffff', pattern: 'none' },
    view: null, items: [{ id: 't1', type: 'text', x: 10, y: 10, text: 'oi' }] }, revision: 0, criar: true }));
  await api(pc1, 'POST', '/api/marcadores', JSON.stringify({ novos: [{ quadro: 'q', marcador: { id: 'mk1', nome: 'Lei de Hess', cx: 640, cy: 360, w: 1280, mini } }] }));

  // exporta como o menu "Exportar arquivo .lousa" da galeria faz (o mesmo código, sem o download)
  const P1 = await pagina(pc1, 'pc1');
  const lousa = await P1.avaliar(`(async () => { const ed = await import('/js/editor.js'), api = await import('/js/api.js');
    const data = await api.loadBoard('q'); delete data._rev;
    if (ed.embedBoard) await ed.embedBoard(data); else data.items = await ed.embedAssets(data.items);
    return JSON.stringify(data); })()`);
  const mk = JSON.parse(lousa).marcadores?.[0] || {};
  conferir('o .lousa leva o marcador', mk.id === 'mk1', JSON.stringify(mk).slice(0, 200));
  conferir('o .lousa leva os bytes da miniatura, não o endereço deste PC', /^data:image\/png[;,]/.test(mk.mini || ''), String(mk.mini).slice(0, 80));

  // importa no PC 2 pelo botão de importar da galeria
  const P2 = await pagina(pc2, 'pc2');
  await P2.avaliar(`(() => { const dt = new DataTransfer(); dt.items.add(new File([${JSON.stringify(lousa)}], 'Aula.lousa', { type: 'application/json' }));
    const i = document.getElementById('gImportFile'); i.files = dt.files; i.dispatchEvent(new Event('change')); })()`);
  let q2 = null;
  for (let t = 0; t < 100 && !q2; t++) { q2 = readdirSync(pc2.dados).find(f => f.endsWith('.json') && f !== 'preferencias.json' && JSON.parse(readFileSync(join(pc2.dados, f), 'utf8')).title === 'Aula'); if (!q2) await espera(100); }
  const b2 = q2 ? JSON.parse(readFileSync(join(pc2.dados, q2), 'utf8')) : {};
  const m2 = b2.marcadores?.[0] || {};
  conferir('PC 2: o quadro chegou com o marcador', m2.id === 'mk1', JSON.stringify(b2).slice(0, 200));
  const arq = typeof m2.mini === 'string' && /^\/assets\/[0-9a-f]{40}\.png$/.test(m2.mini) ? join(pc2.dados, 'assets', m2.mini.slice(8)) : '';
  conferir('PC 2: a miniatura está na pasta de imagens dele, com os mesmos bytes', !!arq && existsSync(arq) && readFileSync(arq).equals(png), String(m2.mini));
} catch (e) {
  falhas++; console.log('  ✗ parou:', e.message);
} finally {
  for (const p of procs) { try { p.kill(); } catch {} }
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
