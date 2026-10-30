// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Bateria, A2: atualização DE VERDADE pelo Sobre, com o GitHub real. O Giz Livre instalado (versão mais antiga) tem de
// estar no ar na porta indicada. Abre a galeria num navegador sem janela (perfil temporário), clica em Sobre → Procurar
// versão nova → Baixar e instalar e espera a versão nova responder na mesma porta.
//   node tests/bateria/a2_atualizar_de_verdade.mjs <porta> <versão esperada>
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { codigo, entrarNoNavegador } from '../acesso.mjs';

const [PORTA, ESPERADA] = [process.argv[2] || '8765', process.argv[3]];
const BASE = `http://127.0.0.1:${PORTA}`;
const NAV = [process.env.GIZ_NAVEGADOR, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(c => c && existsSync(c));
const espera = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
let nav, ws, n = 0; const pend = new Map();
const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { pend.set(id, m => m.error ? rej(new Error(m.error.message)) : res(m.result)); setTimeout(() => rej(new Error('sem resposta ' + method)), 30000); }); };
const avaliar = async e => (await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.value;
async function esperarAte(expr, ms) { const fim = Date.now() + ms; while (Date.now() < fim) { try { const v = await avaliar(expr); if (v) return v; } catch {} await espera(500); } return null; }
const info = async () => { try { return await (await fetch(BASE + '/api/info')).json(); } catch { return null; } };

try {
  const antes = await info();
  if (!conferir('Giz Livre instalado no ar', !!antes)) throw new Error('nada na porta ' + PORTA);
  console.log(`  versão antes: ${antes.versao}`);
  const tmp = mkdtempSync(join(tmpdir(), 'giz-a2-')), pc = await portaLivre();
  nav = spawn(NAV, ['--headless=new', `--remote-debugging-port=${pc}`, `--user-data-dir=${join(tmp, 'perfil')}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore' });
  let alvo; for (let t = 0; t < 100 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${pc}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); } }
  ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { pend.get(m.id)?.(m); pend.delete(m.id); } };
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await entrarNoNavegador(cdp, BASE, (await codigo(BASE)));
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'window.close = () => {};' });
  await cdp('Page.navigate', { url: BASE + '/' });
  conferir('galeria abriu', !!await esperarAte(`!!document.getElementById('gAbout')`, 20000));
  await espera(3000);   // perfil novo: a primeira abertura mostra a escolha das áreas e o tour
  for (let i = 0; i < 3; i++) {
    await avaliar(`[...document.querySelectorAll('button')].find(b => ['Começar','Pular','Fechar'].includes(b.textContent.trim()) && b.closest('dialog[open], .tour, .pop'))?.click()`);
    await espera(800);
  }
  await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close()); document.getElementById('gAbout').click()`);
  conferir('Sobre abriu', !!await esperarAte(`!!document.querySelector('dialog[open] [data-atu]')`, 10000));
  await avaliar(`document.querySelector('dialog[open] [data-atu]').click()`);
  const achou = await esperarAte(`(() => { const s = document.querySelector('dialog[open] .sb-atu'); return s?.querySelector('[data-inst]') ? 'botao' : (s?.querySelector('.sb-erro, .sb-ok') ? s.innerText : ''); })()`, 60000);
  if (!conferir('GitHub respondeu com versão nova e o botão Baixar e instalar', achou === 'botao', achou)) throw new Error('sem botão');
  const notas = await avaliar(`document.querySelector('dialog[open] .sb-notas')?.innerHTML || ''`);
  conferir('notas formatadas (lista, sem **)', notas.includes('<li>') && !notas.includes('**'), notas.slice(0, 200));
  await avaliar(`document.querySelector('dialog[open] [data-inst]').click()`);
  const msg = await esperarAte(`(() => { const s = document.querySelector('dialog[open] .sb-atu'); return s?.querySelector('.sb-ok, .sb-erro') ? s.innerText : ''; })()`, 240000);
  conferir('chegou a "Instalando a versão", sem erro', /Instalando a versão/.test(msg || ''), msg);
  let depois = null; const fim = Date.now() + 240000;
  while (Date.now() < fim) { const i = await info(); if (i && i.versao !== antes.versao) { depois = i; break; } await espera(3000); }
  conferir(`a versão nova respondeu na mesma porta (${ESPERADA || 'nova'})`, !!depois && (!ESPERADA || depois.versao === ESPERADA), JSON.stringify(depois?.versao));
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally { try { ws?.close(); } catch {} nav?.kill(); }
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
