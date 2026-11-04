// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Achados da Ordem 25 do Codex na 1.17.1 (docs/codex/RELATORIOS.md), com o protocolo de depuração, sem Playwright:
//   F1  com o servidor lento, inserir duas páginas ou excluir e desfazer não deixa o marcador fora do lugar
//       (os pedidos dos marcadores vão em fila, um depois do outro)
//   L1  "Limpar tudo" não deixa marcador de página que não existe mais
//   V1  uma gravação do quadro lida antes de um marcador novo não o tira da tela (versão dos marcadores)
//   G1  (Ordem 26) a leitura do quadro de um conflito só de vista, atrasada, não tira um marcador novo da tela
//   R1  o R não gasta o escondido do rascunho oculto antes da resposta à vista
// Edge sem janela, servidor com dados temporários; nada abre na tela.
//   node tests/e2e_provas_ordem25.mjs [--raiz <pasta de outra versão>]
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

const tmp = pastaTemporaria('giz-ordem25-'), DADOS = join(tmp, 'dados');
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

  // atrasa só o 1º pedido dos marcadores (2,2 s), como um servidor ocupado
  const atrasarPrimeiro = () => avaliar(`window.__fetchOriginal = window.__fetchOriginal || window.fetch; window.__nMk = 0;
    window.fetch = async (...a) => { if (a[0] === '/api/marcadores' && a[1]?.method === 'POST' && ++window.__nMk === 1) await new Promise(r => setTimeout(r, 2200)); return window.__fetchOriginal(...a); };`);
  const semAtraso = () => avaliar(`if (window.__fetchOriginal) window.fetch = window.__fetchOriginal`);
  const marcar = (quadro, m) => api('POST', '/api/marcadores', { novos: [{ quadro, marcador: m }] });

  // ---------- F1 ----------
  console.log('F1: marcadores com o servidor lento');
  await criar('f1a', deck(4)); await marcar('f1a', marcador('mk3', 2));
  await abrir('f1a'); await atrasarPrimeiro();
  await menuPagina('ins'); await menuPagina('ins');
  await espera(4000); await salvo();
  let b = disco('f1a');
  const ui = await avaliar('window.__lousa.S.board.marcadores');
  conferir('duas páginas inseridas: o marcador fica no conteúdo da página 3, agora a 5',
    b.layout.count === 6 && textoNoPonto(b) === 'Conteúdo da página 3' && b.marcadores?.[0]?.pagina === 5, JSON.stringify({ paginas: b.layout.count, m: b.marcadores, texto: textoNoPonto(b) }));
  conferir('e a tela concorda com o arquivo', JSON.stringify(ui) === JSON.stringify(b.marcadores), JSON.stringify(ui));
  await semAtraso();

  await criar('f1b', deck(4)); await marcar('f1b', marcador('mk2', 1));
  await abrir('f1b'); await atrasarPrimeiro();
  await tecla('PageDown', 'PageDown', 34); await espera(500);
  await menuPagina('del'); await desfazer();
  await espera(4500); await salvo();
  b = disco('f1b');
  conferir('excluir a página do marcador e logo Ctrl+Z: a página e o marcador voltam',
    b.layout.count === 4 && b.marcadores?.some(m => m.id === 'mk2' && m.pagina === 2), JSON.stringify({ paginas: b.layout.count, m: b.marcadores }));
  await semAtraso();

  // ---------- L1 ----------
  console.log('L1: Limpar tudo com marcadores');
  await criar('l1', deck(4)); await marcar('l1', marcador('mk3', 2)); await marcar('l1', marcador('mk1', 0));
  await abrir('l1');
  await tecla('Delete', 'Delete', 46); await espera(400);
  await avaliar(`document.querySelector('dialog[open] .choices .danger').click()`);
  await espera(1500); await salvo();
  b = disco('l1');
  conferir('o quadro fica com uma página e sem o marcador da página 3', b.layout.count === 1 && !(b.marcadores || []).some(m => m.pagina > 1), JSON.stringify({ paginas: b.layout.count, m: b.marcadores }));
  conferir('o marcador da página 1 continua', (b.marcadores || []).some(m => m.id === 'mk1'), JSON.stringify(b.marcadores));
  await desfazer(); await espera(1500); await salvo();
  b = disco('l1');
  conferir('Ctrl+Z traz as páginas e o marcador da página 3', b.layout.count === 4 && (b.marcadores || []).some(m => m.id === 'mk3' && m.pagina === 3), JSON.stringify({ paginas: b.layout.count, m: b.marcadores }));

  // ---------- V1 ----------
  console.log('V1: gravação do quadro lida antes de um marcador novo, com a resposta atrasada');
  await criar('v1', deck(2)); await marcar('v1', marcador('mk1', 0));
  await abrir('v1');
  // o servidor grava o quadro na hora; só a resposta chega 2,5 s depois, quando o marcador novo já voltou
  await avaliar(`window.__fetchOriginal = window.__fetchOriginal || window.fetch; window.__putFeito = 0;
    window.fetch = async (...a) => { const r = await window.__fetchOriginal(...a);
      if (String(a[0]).startsWith('/api/boards/') && a[1]?.method === 'PUT') { window.__putFeito++; await new Promise(ok => setTimeout(ok, 2500)); }
      return r; };`);
  const mouse = (type, x, y) => cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
  await mouse('mousePressed', 600, 400); for (let k = 1; k <= 8; k++) await mouse('mouseMoved', 600 + k * 15, 400 + k * 4); await mouse('mouseReleased', 720, 432);
  conferir('a gravação do quadro chegou ao servidor', await ate(`window.__putFeito >= 1`, 10000));
  await tecla('m', 'KeyM', 77, 2); await espera(500);
  await avaliar(`document.querySelector('#pop .mk-nome').focus()`); await tecla('Enter', 'Enter', 13);
  const doisNaTela = `(window.__lousa.S.board.marcadores || []).length === 2`;
  conferir('o marcador novo aparece', await ate(doisNaTela, 5000));
  await espera(3000);
  conferir('a resposta atrasada da gravação não tira o marcador novo da tela', await avaliar(doisNaTela), JSON.stringify(await avaliar('window.__lousa.S.board.marcadores')));
  await semAtraso(); await salvo();
  conferir('e o arquivo também tem os dois', (disco('v1').marcadores || []).length === 2);

  // ---------- G1 (Ordem 26) ----------
  console.log('G1: duas janelas, conflito só de vista, com a leitura do quadro atrasada e um marcador novo no meio');
  await criar('g1', deck(3)); await marcar('g1', marcador('mk1', 0));
  await abrir('g1');
  // a "outra janela" grava conteúdo novo: esta fica com a revisão antiga
  { const q = await (await fetch(BASE + '/api/boards/g1', { headers: { 'X-Lousa': token } })).json();
    const r = await api('PUT', '/api/boards/g1', { board: { ...q, items: [...q.items, { ...texto('outra', 2, 'Escrito na outra janela'), x: 1000 }] }, revision: q._rev });
    conferir('a outra janela gravou', r.ok, String(r.status)); }
  // a leitura do quadro que a reconciliação faz é lida na hora, mas a resposta chega 3,5 s depois
  await avaliar(`window.__fetchOriginal = window.__fetchOriginal || window.fetch; window.__n412 = 0; window.__getAtrasado = 0;
    window.fetch = async (...a) => { const r = await window.__fetchOriginal(...a);
      if (a[0] === '/api/boards/g1' && a[1]?.method === 'PUT' && r.status === 412) window.__n412++;
      else if (a[0] === '/api/boards/g1' && !a[1]?.method && window.__n412) { await new Promise(ok => setTimeout(ok, 3500)); window.__getAtrasado++; }
      return r; };`);
  await tecla('PageDown', 'PageDown', 34); await espera(300);   // só a vista muda (página 2); grava sozinha em 10 s
  conferir('a gravação só da vista recebe o conflito (412)', await ate(`window.__n412 >= 1`, 15000));
  await tecla('m', 'KeyM', 77, 2); await espera(500);
  await avaliar(`document.querySelector('#pop .mk-nome').focus()`); await tecla('Enter', 'Enter', 13);
  conferir('o marcador novo aparece enquanto a leitura não volta', await ate(doisNaTela, 3000));
  const mkvAntes = await avaliar('window.__lousa.S.board._mkv || 0');
  conferir('a leitura atrasada chegou', await ate(`window.__getAtrasado >= 1`, 8000)); await espera(600);
  const g = await avaliar('({ n: (window.__lousa.S.board.marcadores || []).length, mkv: window.__lousa.S.board._mkv || 0, outra: window.__lousa.S.items.some(i => i.id === "outra") })');
  conferir('a leitura atrasada traz o que a outra janela gravou e não tira o marcador novo da tela', g.outra && g.n === 2 && g.mkv >= mkvAntes, JSON.stringify({ ...g, mkvAntes }));
  await semAtraso(); await salvo();
  await tecla('PageUp', 'PageUp', 33); await espera(400);
  await menuPagina('ins'); await espera(1500); await salvo();
  b = disco('g1');
  const novo = (b.marcadores || []).find(m => m.id !== 'mk1'), noPonto = novo && b.items.find(i => i.type === 'text' && paginaDe(i) === paginaDe({ y: novo.cy }))?.text;
  conferir('inserir uma página antes: o marcador novo segue o conteúdo da página 2, agora a 3',
    b.layout.count === 4 && novo?.pagina === 3 && noPonto === 'Conteúdo da página 2', JSON.stringify({ paginas: b.layout.count, m: b.marcadores, noPonto }));

  // ---------- R1 ----------
  console.log('R1: revelar com o rascunho oculto');
  await criar('r1', { ...deck(1, [{ ...texto('rasc', 0, 'Rascunho escondido'), camada: 'rascunho', revelar: 1 }, { ...texto('resp', 0, 'Resposta à vista'), y: 500, revelar: 2 }]), rascunhoOculto: true });
  await abrir('r1');
  await avaliar(`document.getElementById('bPresent').click()`); await espera(900);
  await tecla('r', 'KeyR', 82); await espera(500);
  const rv = Object.fromEntries(await avaliar(`window.__lousa.S.items.filter(i => i.id === 'rasc' || i.id === 'resp').map(i => [i.id, i.revelar ?? null])`));
  conferir('o R revela a resposta à vista, e o rascunho oculto continua escondido', rv.resp === null && rv.rasc === 1, JSON.stringify(rv));
  await tecla('Escape', 'Escape', 27); await espera(500);
} catch (e) {
  falhas++; console.log('  ✗ parou:', e.message);
} finally {
  for (const p of procs) { try { p.kill(); } catch {} }
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
