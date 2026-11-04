// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Provas da 1.17.0 (ramo público provas-1.17.0, docs/PROVAS-1.17.0.md), refeitas com o protocolo de depuração, sem
// Playwright, para rodar no Windows:
//   M1  o marcador acompanha a página ao inserir ou excluir uma página antes dele (e o Ctrl+Z o traz de volta)
//   E2  na apresentação, o R revela o escondido que está na tela, não o de outro slide
//   B1  a tecla N na apresentação de um quadro sem páginas não dá erro
// Edge sem janela, servidor com dados temporários; nada abre na tela.
//   node tests/e2e_provas_117.mjs [--raiz <pasta de outra versão>]
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

const tmp = pastaTemporaria('giz-provas117-'), DADOS = join(tmp, 'dados');
mkdirSync(DADOS, { recursive: true });
const procs = [];
const disco = id => JSON.parse(readFileSync(join(DADOS, id + '.json'), 'utf8'));
const L = n => ({ mode: 'pages', kind: 's169', w: 1280, h: 720, gap: 48, count: n });
const passo = 720 + 48;
const texto = (id, pg, t) => ({ id, type: 'text', x: 200, y: pg * passo + 300, w: 700, text: t, color: '#000000', size: 48 });
const deck = (n, extra = []) => ({ title: 'Aula fictícia', layout: L(n), items: [...Array.from({ length: n }, (_, k) => texto('t' + k, k, `Conteúdo da página ${k + 1}`)), ...extra] });
const marcador = (id, pg) => ({ id, nome: `Página ${pg + 1}`, cx: 640, cy: pg * passo + 360, w: 1280, pagina: pg + 1, criado: 1793880000000, ordem: pg + 1 });
const paginaDe = it => Math.floor((it.y + (it.h || 0) / 2) / passo);
const textoNoPonto = b => { const m = b.marcadores?.[0]; return m && b.items.find(i => i.type === 'text' && paginaDe(i) === paginaDe({ y: m.cy }))?.text; };

try {
  const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
  procs.push(spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' }));
  let token = ''; for (let t = 0; t < 150 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(100); } }
  const api = (metodo, rota, corpo) => fetch(BASE + rota, { method: metodo, headers: { 'X-Lousa': token, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  const criar = (id, board) => api('PUT', `/api/boards/${id}`, { board: { version: 2, background: { color: '#ffffff', pattern: 'none' }, view: null, ...board }, revision: 0, criar: true });

  const porta = await portaLivre();
  procs.push(spawn(EDGE, ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${join(tmp, 'perfil')}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' }));
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
  const tecla = async (key, code, vk, modifiers = 0) => { await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, modifiers });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, modifiers }); };
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await entrarNoNavegador(cdp, BASE, token);
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('lousa.abas', '{"ocultas":[],"escolhido":true}'); localStorage.setItem('lousa.ajuda', '{"tourVisto":true}'); } catch {}` });
  // o Edge sem janela às vezes sai da tela cheia sozinho ~0,7 s depois de entrar, e o programa (certo) encerra a
  // apresentação; no PC, 3 de 5 rodadas do E2 caíram assim em 04/11. Sem tela cheia aqui, a apresentação fica.
  const semTelaCheia = `Element.prototype.requestFullscreen = function () { return Promise.resolve(); };`;
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: semTelaCheia }); await avaliar(semTelaCheia);   // a página já aberta também
  const abrir = async id => {
    await cdp('Page.navigate', { url: `${BASE}/#/b/${id}` });
    await ate(`window.__lousa?.S?.id === ${JSON.stringify(id)}`, 30000); await espera(900);
    await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);
  };
  const menuPagina = async acao => {
    await avaliar(`document.getElementById('pgMore').click()`); await espera(200);
    await avaliar(`document.querySelector('#pop [data-a="${acao}"]').click()`); await espera(300);
    await avaliar(`document.querySelector('dialog[open] [data-a="1"]')?.click()`); await espera(300);
  };
  const salvo = () => ate(`document.getElementById('bStatus').textContent.trim() === 'Salvo'`, 15000);
  const desfazer = () => tecla('z', 'KeyZ', 90, 2);

  // ---------- M1 ----------
  console.log('M1: marcador depois de inserir ou excluir páginas');
  await criar('m1', deck(4));
  await api('POST', '/api/marcadores', { novos: [{ quadro: 'm1', marcador: marcador('mk3', 2) }] });
  await abrir('m1');
  await menuPagina('ins'); await salvo(); await espera(800);   // página nova depois da 1
  let b = disco('m1');
  conferir('inserir uma página antes: o marcador continua no conteúdo da página 3', textoNoPonto(b) === 'Conteúdo da página 3', `aponta para "${textoNoPonto(b) ?? '(página em branco)'}"`);
  conferir('e o número e o nome sugerido acompanham (página 4)', b.marcadores?.[0]?.pagina === 4 && b.marcadores[0].nome === 'Página 4', JSON.stringify(b.marcadores?.[0]));
  await desfazer(); await espera(1200);
  b = disco('m1');
  conferir('Ctrl+Z: a página sai e o marcador volta ao lugar', b.layout.count === 4 && b.marcadores?.[0]?.cy === 2 * passo + 360 && b.marcadores[0].nome === 'Página 3', JSON.stringify({ count: b.layout.count, mk: b.marcadores?.[0] }));

  await criar('m1b', deck(4));
  await api('POST', '/api/marcadores', { novos: [{ quadro: 'm1b', marcador: marcador('mk2', 1) }] });
  await abrir('m1b');
  await tecla('PageDown', 'PageDown', 34); await espera(500);
  await menuPagina('del'); await salvo(); await espera(800);
  b = disco('m1b');
  conferir('excluir a página do marcador: ele não fica apontando para outra página', !b.marcadores?.length || textoNoPonto(b) !== 'Conteúdo da página 3',
    `"${b.marcadores?.[0]?.nome}" aponta para "${b.marcadores?.[0] && textoNoPonto(b)}"`);
  await desfazer(); await espera(1200);
  b = disco('m1b');
  conferir('Ctrl+Z: a página e o marcador voltam', b.layout.count === 4 && textoNoPonto(b) === 'Conteúdo da página 2', JSON.stringify({ count: b.layout.count, mk: b.marcadores?.[0] }));

  // ---------- E2 ----------
  console.log('E2: revelar na apresentação com escondidos em vários slides');
  // a resposta do slide 3 foi escondida antes da do slide 1
  await criar('e2', deck(3, [{ ...texto('r3', 2, 'Resposta do slide 3'), y: 2 * passo + 500, revelar: 1 }, { ...texto('r1', 0, 'Resposta do slide 1'), y: 500, revelar: 2 }]));
  await abrir('e2');
  await avaliar(`document.getElementById('bPresent').click()`); await espera(900);
  await tecla('r', 'KeyR', 82); await espera(500);
  const it = await avaliar(`window.__lousa.S.items.filter(i => i.id === 'r1' || i.id === 'r3').map(i => [i.id, i.revelar ?? null])`);
  const rv = Object.fromEntries(it);
  conferir('no slide 1, R revela a resposta do slide 1 e não a do slide 3', rv.r1 === null && rv.r3 !== null, JSON.stringify(rv));
  await tecla('Escape', 'Escape', 27); await espera(500);

  // ---------- B1 ----------
  console.log('B1: tecla N na apresentação de um quadro sem páginas');
  await criar('b1', { title: 'Livre', items: [texto('a', 0, 'Quadro livre fictício')] });
  await abrir('b1');
  await avaliar(`document.getElementById('bPresent').click()`); await espera(800);
  erros.length = 0;
  await tecla('n', 'KeyN', 78); await espera(500);
  conferir('N no quadro livre não dá erro na página', !erros.length, erros.join(' | '));
} catch (e) {
  falhas++; console.log('  ✗ parou:', e.message);
} finally {
  for (const p of procs) { try { p.kill(); } catch {} }
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
