// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// B4 (P-ABERTURA, 22/11/2026): modo Compacto das barras laterais, ao lado dos modos com nomes e só ícones.
// Edge sem janela, servidor com dados temporários. Confere a largura de 42 px, os nomes na dica, o triângulo dos botões
// com menu, a ferramenta ativa, a volta para "com nomes" sem nome quebrado no meio, e grava capturas em
// build/evidencia/barras-compacto.
//   node tests/e2e_barras_compacto.mjs [--raiz <pasta de outra versão>]
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
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

const tmp = pastaTemporaria('giz-compacto-'), DADOS = join(tmp, 'dados'), EVID = pastaDeEvidencia('barras-compacto');
mkdirSync(DADOS, { recursive: true });
const procs = [];
try {
  const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
  procs.push(spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' }));
  let token = ''; for (let t = 0; t < 150 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(100); } }
  await fetch(BASE + '/api/boards/aula1', { method: 'PUT', headers: { 'X-Lousa': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: { version: 2, title: 'Aula 1', background: { color: '#ffffff', pattern: 'grid' }, view: null, items: [] }, revision: 0, criar: true }) });

  const porta = await portaLivre();
  procs.push(spawn(EDGE, ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${join(tmp, 'perfil')}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1920,1080', 'about:blank'], { stdio: 'ignore' }));
  let alvo; for (let t = 0; t < 100 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); } }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pend = new Map(), erros = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
  const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => pend.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result))); };
  const avaliar = async e => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result?.value; };
  const ate = async (e, ms = 15000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await avaliar(e).catch(() => false)) return true; await espera(100); } return false; };
  const foto = async (nome, sel) => {
    const clip = sel ? await avaliar(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: r.width + 16, height: r.height + 16, scale: 1 }; })()`) : undefined;
    const r = await cdp('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) });
    writeFileSync(join(EVID, nome + '.png'), Buffer.from(r.data, 'base64'));
  };
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Emulation.setFocusEmulationEnabled', { enabled: true }); await cdp('Page.bringToFront');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await entrarNoNavegador(cdp, BASE, token);
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('lousa.abas', '{"ocultas":[],"escolhido":true}'); localStorage.setItem('lousa.ajuda', '{"tourVisto":true}');
    if (!localStorage.getItem('lousa.cfg')) localStorage.setItem('lousa.cfg', '{"teachBar":true,"teachSide":"dir","barNomes":"nomes"}'); } catch {}` });
  await cdp('Page.navigate', { url: `${BASE}/#/b/aula1` });
  await ate(`window.__lousa?.S?.id === 'aula1'`, 30000); await espera(900);
  await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);
  const larguras = () => avaliar(`({ criar: Math.round(createbar.getBoundingClientRect().width), desenho: Math.round(drawbar.getBoundingClientRect().width), prof: Math.round(teachbar.getBoundingClientRect().width) })`);

  console.log('Com nomes (como está)');
  const antes = await larguras();
  conferir('com nomes, as barras são largas', antes.criar > 60 && antes.prof > 60, JSON.stringify(antes));
  // nome nenhum quebrado em duas linhas nem cortado (pedido de 22/11: "Cronômetr/o" no esboço da B3)
  const quebrados = await avaliar(`[...document.querySelectorAll('#createbar .cb small, #drawbar .cb small, #teachbar .cb small')].filter(s => s.offsetWidth && (s.getClientRects().length > 1 || s.scrollWidth > s.clientWidth + 1 || s.offsetHeight > parseFloat(getComputedStyle(s).lineHeight) * 1.5)).map(s => s.textContent)`);
  conferir('nenhum nome quebrado ou cortado', !quebrados.length, quebrados.join(', '));
  await foto('1-com-nomes');

  console.log('Compacto (pelo menu das Ferramentas)');
  await avaliar(`document.getElementById('tTools').click()`); await espera(300);
  conferir('o menu oferece Compacto', await avaliar(`!!document.querySelector('#pop [data-nb="compacto"]')`));
  const seg = await avaliar(`[...document.querySelectorAll('#pop [data-nb]')].filter(b => b.scrollWidth > b.clientWidth + 1 || b.offsetHeight > 44).map(b => b.textContent)`);
  conferir('os quatro botões do seletor cabem numa linha, sem cortar', !seg.length, seg.join(', '));
  await foto('0-menu-ferramentas', '#pop');
  await avaliar(`document.querySelector('#pop [data-nb="compacto"]').click()`); await espera(300);
  await avaliar(`document.getElementById('pop').hidden = true`); await espera(300);
  const comp = await larguras();
  conferir('as três barras com 42 px', comp.criar === 42 && comp.desenho === 42 && comp.prof === 42, JSON.stringify(comp));
  conferir('sem nomes à vista', await avaliar(`[...document.querySelectorAll('#createbar small, #drawbar small, #teachbar small')].every(s => !s.offsetWidth)`));
  conferir('cada botão com o nome na dica', await avaliar(`[...document.querySelectorAll('#createbar .cb, #drawbar .cb, #teachbar [data-k]')].every(b => b.title.length > 2)`));
  conferir('triângulo só nos botões com menu (Nota, Formas)', await avaliar(`[...document.querySelectorAll('#createbar .cb')].filter(b => getComputedStyle(b, '::after').content !== 'none').map(b => b.dataset.create).join() === 'note,shapes'`));
  conferir('fundo neutro', await avaliar(`getComputedStyle(createbar).backgroundColor === 'rgb(243, 243, 243)'`));
  const ativa = await avaliar(`(() => { const b = document.querySelector('#drawbar .cb[data-k="arrow"]') || document.querySelector('#drawbar .cb[data-k]'); b.click(); return getComputedStyle(b).boxShadow; })()`);
  await espera(200);
  conferir('ferramenta ativa com o filete na cor de destaque', /inset/.test(await avaliar(`getComputedStyle(document.querySelector('#drawbar .cb.active')).boxShadow`)), ativa);
  conferir('a escolha fica guardada', await avaliar(`JSON.parse(localStorage.getItem('lousa.cfg')).barNomes === 'compacto'`));
  await foto('2-compacto');
  await foto('2-compacto-professor', '#teachbar');
  await foto('2-compacto-criar-e-desenho', '#createbar');
  await avaliar(`window.gizFechando = true; location.reload()`);
  await ate(`window.__lousa?.S?.id === 'aula1'`, 30000); await espera(900);
  conferir('reaberto, continua Compacto', (await larguras()).criar === 42);
  console.log('Volta para "com nomes"');
  await avaliar(`document.querySelector('#teachbar [data-nomes]').click()`); await espera(300);
  const volta = await larguras();
  conferir('Aa no Compacto mostra os nomes de novo', volta.criar > 60 && !(await avaliar(`document.getElementById('board').classList.contains('barras-compacto')`)), JSON.stringify(volta));

  conferir('nenhum erro na página', !erros.length, erros.join(' | '));
  ws.close();
} finally {
  for (const p of procs) try { p.kill(); } catch {}
}
console.log(`\n${ok} ok, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
