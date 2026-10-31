// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Bateria, C4: sem internet. Sobe o GizLivre.exe com a saída para a internet apontada para um endereço morto (variável
// HTTPS_PROXY só deste processo; o Windows não é tocado), abre a galeria e um quadro num navegador sem janela, e clica
// em Procurar versão nova: tem de vir uma mensagem clara em poucos segundos, sem travar, e o resto continuar funcionando.
//   node tests/bateria/c4_sem_internet.mjs [caminho do GizLivre.exe]
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigo, entrarNoNavegador } from '../acesso.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EXE = process.argv[2] || join(RAIZ, 'build', 'dist', 'GizLivre', 'GizLivre.exe');
const NAV = [process.env.GIZ_NAVEGADOR, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(c => c && existsSync(c));
const espera = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const tmp = mkdtempSync(join(tmpdir(), 'giz-c4-')), DADOS = join(tmp, 'quadros'); mkdirSync(DADOS);
const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
let srv, nav, ws, n = 0; const pend = new Map();
const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { pend.set(id, m => m.error ? rej(new Error(m.error.message)) : res(m.result)); }); };
const avaliar = async e => (await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.value;
async function esperarAte(expr, ms) { const fim = Date.now() + ms; while (Date.now() < fim) { const v = await avaliar(expr); if (v) return v; await espera(300); } return null; }

try {
  console.log('C4: sem internet');
  // .py: o código-fonte (para conferir uma mudança antes do build)
  // .py com GIZ_PYTHON_C4: o servidor no Python embutido do pacote da janela própria (P60)
  srv = spawn(EXE.endsWith('.py') ? (process.env.GIZ_PYTHON_C4 || 'python') : EXE, [...(EXE.endsWith('.py') ? [EXE] : []), '--sem-janela', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore',
    env: { ...process.env, HTTPS_PROXY: 'http://127.0.0.1:9', HTTP_PROXY: 'http://127.0.0.1:9', NO_PROXY: '127.0.0.1,localhost' } });
  let token; for (let t = 0; t < 100 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(150); } }
  conferir('o programa abre sem internet', !!token);
  await fetch(BASE + '/api/boards/c4quadro', { method: 'PUT', headers: { 'X-Lousa': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: { title: 'C4', items: [] }, revision: 0 }) });
  const pc = await portaLivre();
  nav = spawn(NAV, ['--headless=new', `--remote-debugging-port=${pc}`, `--user-data-dir=${join(tmp, 'perfil')}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore' });
  let alvo; for (let t = 0; t < 100 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${pc}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); } }
  ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { { const f = pend.get(m.id); if (typeof f === 'function') f(m); } pend.delete(m.id); } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await entrarNoNavegador(cdp, BASE, token);
  await cdp('Page.navigate', { url: BASE + '/' });
  conferir('a galeria abre e lista o quadro', !!await esperarAte(`document.body.innerText.includes('C4')`, 20000));
  await espera(2500);
  for (let i = 0; i < 3; i++) { await avaliar(`[...document.querySelectorAll('button')].find(b => ['Começar','Pular','Fechar'].includes(b.textContent.trim()) && b.closest('dialog[open], .tour, .pop'))?.click()`); await espera(600); }
  await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close()); document.getElementById('gAbout').click()`);
  await esperarAte(`!!document.querySelector('dialog[open] [data-atu]')`, 10000);
  const t0 = Date.now();
  await avaliar(`document.querySelector('dialog[open] [data-atu]').click()`);
  const msg = await esperarAte(`(() => { const s = document.querySelector('dialog[open] .sb-atu'); return s?.querySelector('.sb-erro, .sb-ok, [data-inst]') ? s.innerText : ''; })()`, 40000);
  const seg = Math.round((Date.now() - t0) / 1000);
  console.log(`    mensagem (${seg} s): ${(msg || '').replace(/\s+/g, ' ').slice(0, 160)}`);
  conferir('Procurar versão nova responde com erro claro em até 20 s', !!msg && seg <= 20 && /internet|GitHub|conex|concluir|tentar/i.test(msg) && !/Instalando/.test(msg), msg);
  conferir('aparece "Tentar de novo" e o link da página de downloads', !!await avaliar(`[...document.querySelectorAll('dialog[open] button')].some(b => b.textContent.includes('Tentar de novo')) && !!document.querySelector('dialog[open] .sb-atu a')`));
  await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close()); location.hash = '#/b/c4quadro'`);
  conferir('o quadro abre normalmente depois disso', !!await esperarAte(`!!document.getElementById('bMenu') && location.hash.includes('c4quadro')`, 15000));
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally { try { ws?.close(); } catch {} nav?.kill(); srv?.kill(); }
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
