// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Bateria, C3 e C5: um quadro aberto com um traço ainda NÃO salvo, e a página congelada (como o Windows/Edge fazem com
// janela minimizada em economia de energia: nenhum timer roda, nenhum sinal chega ao programa) por N minutos.
// O programa não pode se encerrar; ao descongelar, o traço tem de ser salvo.
//   node tests/bateria/c3_congelado.mjs [minutos=15]      (GIZ_NAVEGADOR=<chrome.exe> para usar outro navegador)
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, existsSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigo, entrarNoNavegador } from '../acesso.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIN = Number(process.argv[2] || 15);
const NAV = [process.env.GIZ_NAVEGADOR, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(c => c && existsSync(c));
const espera = ms => new Promise(r => setTimeout(r, ms));
const hora = () => new Date().toLocaleTimeString('pt-BR');
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });

const tmp = mkdtempSync(join(tmpdir(), 'giz-c3-')), DADOS = join(tmp, 'quadros'); mkdirSync(DADOS);
const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
let srv, nav, ws, n = 0;
const pend = new Map();
const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { pend.set(id, m => m.error ? rej(new Error(m.error.message)) : res(m.result)); }); };
const avaliar = async e => (await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.value;
// só olha o processo: um pedido ao programa contaria como sinal de vida e esconderia o vigia
const vivo = async () => srv.exitCode === null && srv.signalCode === null;

try {
  console.log(`C3/C5: página congelada ${MIN} min com traço não salvo (${hora()})`);
  srv = spawn('python', [join(RAIZ, 'tests', 'bateria', 'servidor_sem_janela_com_vigia.py'), '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' });
  let token; for (let t = 0; t < 100 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(100); } }
  conferir('servidor com vigia no ar', !!token);
  await fetch(BASE + '/api/boards/c3quadro', { method: 'PUT', headers: { 'X-Lousa': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: { title: 'C3', items: [] }, revision: 0 }) });
  const pc = await portaLivre();
  nav = spawn(NAV, ['--headless=new', `--remote-debugging-port=${pc}`, `--user-data-dir=${join(tmp, 'perfil')}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore' });
  let alvo; for (let t = 0; t < 100 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${pc}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); } }
  ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { pend.get(m.id)?.(m); pend.delete(m.id); } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await entrarNoNavegador(cdp, BASE, token);
  await cdp('Page.navigate', { url: `${BASE}/#/b/c3quadro` });
  await espera(4000);
  await avaliar(`[...document.querySelectorAll('button')].find(b => ['Começar','Pular'].includes(b.textContent.trim()))?.click()`);
  await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);
  await espera(4000);   // primeiro ping (aos 3 s) já levou "quadro aberto"
  // traço com o mouse e congela logo em seguida, antes do salvamento (meio segundo depois)
  const xy = [[500, 400], [560, 430], [620, 470], [700, 500]];
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: xy[0][0], y: xy[0][1], button: 'left', buttons: 1, clickCount: 1 });
  for (const [x, y] of xy.slice(1)) await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 700, y: 500, button: 'left', buttons: 0, clickCount: 1 });
  await cdp('Page.setWebLifecycleState', { state: 'frozen' });
  const antes = JSON.parse(readFileSync(join(DADOS, 'c3quadro.json'), 'utf8')).items.length;
  conferir('o traço ainda não estava salvo quando a página congelou', antes === 0, `itens no arquivo: ${antes}`);
  for (let m = 1; m <= MIN; m++) {
    await espera(60000);
    if (!await vivo()) { conferir(`programa vivo depois de ${MIN} min congelado`, false, `encerrou no minuto ${m}`); break; }
    if (m === MIN) conferir(`programa vivo depois de ${MIN} min congelado (o vigia sozinho encerraria em 3 min)`, true);
  }
  await cdp('Page.setWebLifecycleState', { state: 'active' });
  await espera(5000);
  const depois = JSON.parse(readFileSync(join(DADOS, 'c3quadro.json'), 'utf8')).items.length;
  conferir('ao voltar, o traço foi salvo', depois === 1, `itens no arquivo: ${depois}`);
  const log = existsSync(join(tmp, 'giz-livre.log')) ? readFileSync(join(tmp, 'giz-livre.log'), 'utf8') : '';
  conferir('o registro anotou que havia quadro aberto e o programa continuou', /havia quadro aberto: o programa continua/.test(log), log);
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally { try { ws?.close(); } catch {} nav?.kill(); srv?.kill(); }
console.log(`\n${ok} conferências passaram, ${falhas} falharam (${hora()})`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
