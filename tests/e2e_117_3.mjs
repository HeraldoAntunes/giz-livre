// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// 1.17.3, retorno da aula de 04/11/2026, sem janela (Edge headless, servidor com dados temporários):
//   B1  a borracha passando só sobre a página importada não apaga nada e avisa por quê (uma vez por quadro); sobre um
//       traço, apaga sem aviso
//   B2  "Trocar a imagem da página": troca só a imagem importada, no mesmo lugar da pilha; os traços continuam por cima
//       e o Ctrl+Z desfaz
//   P1  apresentação: a página atual, a anterior e as duas seguintes ficam decodificadas, e no máximo 8 guardadas
//   N1  barras laterais: automático com nomes em tela grande e só ícones em notebook; "com nomes" e "só ícones" fixos
//   C1  ponteiro da caneta: P, M, G e GG no menu da caneta, guardado nos ajustes
//   E1  apresentação: tocar de novo na cor ativa abre a espessura dela; a bolinha mostra o tamanho
//   M1  fitinhas: uma por página, com o número, sem se sobrepor e fora de cima da barra do professor
//   B3  (revisão da rc.1) trocar a imagem com "Escrever no rascunho" ligado: a página continua do quadro
//   M3  (revisão da rc.1) Apagar com Desfazer; Mudar de lugar não vale em outro quadro; Esc cancela o arraste
//   M2  lista por grupo: "Mover para o grupo…", arrastar pela alça e "Mudar de lugar no quadro", gravados (_mkv)
//   node tests/e2e_117_3.mjs [--raiz <pasta de outra versão>]
import { spawn } from 'node:child_process';
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

const tmp = pastaTemporaria('giz-1173-'), DADOS = join(tmp, 'dados');
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
  await cdp('Runtime.enable'); await cdp('Page.enable');
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
  const EVID = pastaDeEvidencia('e2e_117_3');
  const foto = async nome => writeFileSync(join(EVID, nome + '.png'), Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  const toastTxt = () => avaliar(`(() => { const t = document.getElementById('toast'); return t && !t.hidden ? t.textContent : ''; })()`);

  // ---------- B1 ----------
  console.log('B1: borracha sobre a página importada');
  const azul = await subir([40, 90, 200]);
  await criar('b1', { title: 'Calendário fictício', layout: L(1), items: [paginaImg(0, azul),
    { id: 'tr', type: 'stroke', tool: 'highlighter', color: '#ffb900', width: 30, pts: [900, 500, 0.5, 1100, 500, 0.5] }] });
  await abrir('b1');
  await tecla('e', 'KeyE', 69); await espera(200);
  const [ax, ay] = await naTela(200, 200), [bx, by] = await naTela(400, 220);
  await arrastar([[ax, ay], [(ax + bx) / 2, (ay + by) / 2], [bx, by]]); await espera(300);
  const t1 = await toastTxt();
  conferir('passar só sobre a página não apaga nada e avisa que é a página importada', t1.includes('página importada')
    && (await avaliar('window.__lousa.S.items.length')) === 2, t1);
  await avaliar(`document.getElementById('toast').hidden = true`);
  await arrastar([[ax, ay + 10], [bx, by + 10]]); await espera(300);
  conferir('o aviso aparece uma vez só por quadro', !(await toastTxt()).includes('página importada'));
  const [cx, cy] = await naTela(950, 500), [dx, dy] = await naTela(1050, 500);
  await arrastar([[cx, cy - 20], [cx, cy + 20], [dx, dy - 20], [dx, dy + 20]]); await espera(300);
  conferir('sobre o traço do marca-texto, a borracha apaga', !(await avaliar(`window.__lousa.S.items.some(i => i.id === 'tr')`)));

  // ---------- B2 ----------
  console.log('B2: trocar a imagem da página');
  const vermelho = await subir([200, 30, 30]), verde = [30, 160, 60];
  await criar('b2', { title: 'Página com marcações', layout: L(2), items: [paginaImg(0, vermelho), paginaImg(1, vermelho),
    { id: 'tr2', type: 'stroke', tool: 'pen', color: '#000000', width: 4, pts: [100, 100, 0.5, 300, 300, 0.5] }] });
  await abrir('b2');
  await avaliar(`document.getElementById('pgMore').click()`); await espera(300);
  conferir('o menu da página tem "Trocar a imagem da página 1"', await avaliar(`!!document.querySelector('#pop [data-a="trocarImg"]')`));
  const arq = join(tmp, 'pagina-limpa.png'); writeFileSync(arq, png(64, 36, verde));
  await cdp('Page.setInterceptFileChooserDialog', { enabled: true });
  await avaliar(`document.querySelector('#pop [data-a="trocarImg"]').click()`);
  for (let t = 0; t < 50 && !escolhas.length; t++) await espera(100);
  conferir('abre a escolha de arquivo', escolhas.length === 1);
  if (escolhas.length) await cdp('DOM.setFileInputFiles', { files: [arq], backendNodeId: escolhas[0].backendNodeId });
  await cdp('Page.setInterceptFileChooserDialog', { enabled: false });
  const trocou = await ate(`window.__lousa.S.items[0].src !== ${JSON.stringify(vermelho)}`, 10000);
  const b2 = await avaliar(`window.__lousa.S.items.map(i => ({ id: i.id, type: i.type, locked: !!i.locked, src: i.src }))`);
  conferir('a imagem da página 1 foi trocada, no mesmo lugar da pilha (embaixo de tudo)', trocou && b2[0].type === 'image' && b2[0].locked && b2[1].src === vermelho, JSON.stringify(b2));
  conferir('o traço continua por cima', b2.at(-1).id === 'tr2' && b2.length === 3);
  await tecla('z', 'KeyZ', 90, 2); await espera(300);
  conferir('Ctrl+Z volta a imagem de antes', (await avaliar(`window.__lousa.S.items[0].src`)) === vermelho);

  // ---------- B3 ----------
  console.log('B3: trocar a imagem com "Escrever no rascunho" ligado');
  const cinza = await subir([120, 120, 120]);
  await criar('b3', { title: 'Página e rascunho', layout: L(1), items: [paginaImg(0, cinza),
    { id: 'r1', type: 'stroke', tool: 'pen', color: '#c50f1f', width: 4, pts: [100, 600, 0.5, 300, 650, 0.5], camada: 'rascunho' }] });
  await abrir('b3');
  if (await avaliar(`document.getElementById('rascbar').hidden`)) { await avaliar(`document.getElementById('tRascunho').click()`); await espera(300); }
  await avaliar(`document.querySelector('#rascbar [data-r="escrever"]').click()`); await espera(200);
  await avaliar(`document.getElementById('pgMore').click()`); await espera(300);
  escolhas.length = 0;
  const arq3 = join(tmp, 'pagina-nova.png'); writeFileSync(arq3, png(64, 36, [10, 140, 200]));
  await cdp('Page.setInterceptFileChooserDialog', { enabled: true });
  await avaliar(`document.querySelector('#pop [data-a="trocarImg"]').click()`);
  for (let k = 0; k < 50 && !escolhas.length; k++) await espera(100);
  if (escolhas.length) await cdp('DOM.setFileInputFiles', { files: [arq3], backendNodeId: escolhas[0].backendNodeId });
  await cdp('Page.setInterceptFileChooserDialog', { enabled: false });
  await ate(`window.__lousa.S.items.find(i => i.id === 'pg0')?.src !== ${JSON.stringify(cinza)}`, 10000);
  const pgB3 = await avaliar(`window.__lousa.S.items.find(i => i.type === 'image')`);
  conferir('a imagem nova fica no quadro, com o mesmo id, fora do rascunho', pgB3?.id === 'pg0' && !pgB3.camada && pgB3.src !== cinza, JSON.stringify(pgB3 && { id: pgB3.id, camada: pgB3.camada }));
  await avaliar(`document.querySelector('#rascbar [data-r="ver"]').click()`); await espera(200);
  conferir('ocultar o rascunho não some com a página', await avaliar(`window.__lousa.S.items.some(i => i.type === 'image' && !i.camada)`));
  await avaliar(`document.querySelector('#rascbar [data-r="ver"]').click()`); await espera(200);
  await avaliar(`document.querySelector('#rascbar [data-r="apagar"]').click()`); await espera(400);
  await avaliar(`[...document.querySelectorAll('dialog[open] button')].find(b => b.textContent.includes('Limpar rascunho'))?.click()`); await espera(400);
  const b3 = await avaliar(`window.__lousa.S.items.map(i => i.id)`);
  conferir('"Limpar rascunho" apaga só o rascunho: a página continua com a imagem', b3.includes('pg0') && !b3.includes('r1'), JSON.stringify(b3));

  // ---------- P1 ----------
  console.log('P1: slides vizinhos decodificados antes da troca');
  const cores = Array.from({ length: 14 }, (_, k) => [20 * k % 255, 120, 255 - 15 * k]);
  const srcs = []; for (const c of cores) srcs.push(await subir(c));
  await criar('p1', { title: 'Deck fictício', layout: L(14), items: srcs.map((s, k) => paginaImg(k, s)) });
  await abrir('p1');
  await avaliar(`document.getElementById('bPresent').click()`); await espera(800);
  await tecla('ArrowRight', 'ArrowRight', 39);
  conferir('na página 2, ficam decodificadas a 1, a 2, a 3 e a 4', await ate(`window.__lousa.bitmaps >= 4`, 8000), String(await avaliar('window.__lousa.bitmaps')));
  for (let k = 0; k < 10; k++) { await tecla('ArrowRight', 'ArrowRight', 39); await espera(120); }
  await espera(800);
  conferir('depois de 11 trocas, no máximo 8 guardadas', (await avaliar('window.__lousa.bitmaps')) <= 8, String(await avaliar('window.__lousa.bitmaps')));
  await tecla('Escape', 'Escape', 27); await espera(500);

  // ---------- N1 ----------
  console.log('N1: nomes nas barras laterais');
  const semNomes = `document.getElementById('createbar').classList.contains('sem-nomes')`;
  const largura = `document.getElementById('createbar').getBoundingClientRect().width`;
  await abrir('b1');
  conferir('automático, tela 1920x1080: com nomes', !(await avaliar(semNomes)));
  const l1 = await avaliar(largura);
  await tela(1366, 768); await espera(600);
  const l2 = await avaliar(largura);
  conferir('automático, notebook 1366x768: só ícones, barra mais estreita', (await avaliar(semNomes)) && l2 < l1 * 0.75, `${l1} → ${l2}`);
  conferir('a barra do professor também fica só com ícones', !(await avaliar(`document.getElementById('teachbar').classList.contains('nomes')`)));
  const cabe = await avaliar(`(() => { const r = document.getElementById('createbar').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })()`);
  conferir('a barra de criar cabe inteira na altura do notebook', cabe);
  await foto('notebook-so-icones');
  await avaliar(`document.getElementById('tTools').click()`); await espera(300);
  await avaliar(`document.querySelector('#pop [data-nb="nomes"]').click()`); await espera(400);
  conferir('"Com nomes" vale mesmo no notebook', !(await avaliar(semNomes)));
  await avaliar(`document.querySelector('#pop [data-nb="icones"]')?.click()`); await espera(300);
  await tela(1920, 1080); await espera(600);
  conferir('"Só ícones" vale mesmo em tela grande', await avaliar(semNomes));
  conferir('a escolha fica guardada nos ajustes', (await avaliar(`JSON.parse(localStorage.getItem('lousa.cfg')).barNomes`)) === 'icones');
  await avaliar(`document.querySelectorAll('#pop').forEach(p => p.hidden = true)`);

  // ---------- C1 ----------
  console.log('C1: tamanho do ponteiro da caneta');
  await tecla('1', 'Digit1', 49); await espera(200);
  await avaliar(`document.querySelector('.ink .pen.active, .ink [data-tool="pen0"]')?.click()`); await espera(400);
  await foto('menu-caneta');
  const botoes = await avaliar(`[...document.querySelectorAll('#pop [data-tp]')].map(b => b.textContent.trim())`);
  conferir('o menu da caneta mostra P, M, G e GG', JSON.stringify(botoes) === JSON.stringify(['P', 'M', 'G', 'GG']), JSON.stringify(botoes));
  const tamanhos = await avaliar(`[...document.querySelectorAll('#pop [data-tp] svg')].map(s => +s.getAttribute('width'))`);
  conferir('a prévia cresce de P a GG', tamanhos.length === 4 && tamanhos.every((w, k) => !k || w > tamanhos[k - 1]), JSON.stringify(tamanhos));
  await avaliar(`document.querySelector('#pop [data-tp="gg"]')?.click()`); await espera(200);
  conferir('GG fica guardado nos ajustes', (await avaliar(`JSON.parse(localStorage.getItem('lousa.cfg')).tablet.cursorTam`)) === 'gg');

  // ---------- E1 ----------
  console.log('E1: espessura direto na bolinha de cor (apresentação)');
  await abrir('p1');
  await avaliar(`document.getElementById('bPresent').click()`); await espera(800);
  const dot = `document.querySelector('#presentbar [data-pt="pen1"]')`;
  await avaliar(`${dot}.click()`); await espera(200);
  conferir('o primeiro toque só escolhe a cor', !(await avaliar(`!!document.querySelector('#pop:not([hidden]) .esp-cor')`)));
  const d0 = await avaliar(`${dot}.querySelector('i').getBoundingClientRect().width`);
  await avaliar(`${dot}.click()`); await espera(300);
  conferir('tocar de novo na cor ativa abre a espessura logo acima', await avaliar(`(() => { const p = document.querySelector('#pop:not([hidden]) .esp-cor'); if (!p) return false;
    return p.getBoundingClientRect().bottom <= ${dot}.getBoundingClientRect().top; })()`));
  await foto('espessura-na-cor');
  await avaliar(`document.querySelector('#pop .esp-bolas [data-w="12"]').click()`); await espera(300);
  conferir('a espessura escolhida vale para a caneta', (await avaliar(`JSON.parse(localStorage.getItem('lousa.cfg')).tools.pen1.width`)) === 12);
  conferir('a bolinha da cor cresce com a espessura', (await avaliar(`${dot}.querySelector('i').getBoundingClientRect().width`)) > d0);
  await tecla('Escape', 'Escape', 27); await espera(500);

  // ---------- M1 ----------
  console.log('M1: fitinhas dos marcadores');
  const disco = id => JSON.parse(readFileSync(join(DADOS, id + '.json'), 'utf8'));
  const mk = (id, nome, pg, k) => ({ quadro: 'm1', marcador: { id, nome, cx: 640, cy: pg * passo + 150 + k * 120, w: 1280, pagina: pg + 1, criado: 1793880000000 + k, ordem: k + 1 } });
  await criar('m1', { title: 'Aula com marcadores', layout: L(8), items: [] });
  await api('POST', '/api/marcadores', { grupos: [{ id: 'gA', nome: 'Aula 1', cor: '#0f6cbd', ordem: 1 }],
    novos: [mk('a1', 'Abertura', 0, 0), mk('e1', 'Exemplo 1', 2, 0), mk('e2', 'Exemplo 2', 2, 1), mk('e3', 'Exercício 3', 2, 2), mk('e4', 'Gráfico', 2, 3), mk('q4', 'Questão 4', 3, 0)] });
  await api('POST', '/api/marcadores', { alterar: [{ quadro: 'm1', id: 'e1', grupo: 'gA', grupoNome: 'Aula 1', cor: '#0f6cbd' }] });
  await abrir('m1');
  const fs = await avaliar(`[...document.querySelectorAll('#fitas .fita')].map(f => { const r = f.getBoundingClientRect(); return { ids: f.dataset.ids, n: f.querySelector('.fita-n')?.textContent || '', top: r.top, bottom: r.bottom, right: r.right }; })`);
  conferir('uma fita por página: 3 fitas para 6 marcadores, a da página 3 com o número 4', fs.length === 3 && fs.some(f => f.n === '4'), JSON.stringify(fs));
  conferir('nenhuma fita encosta na outra', fs.every((f, i) => !i || f.top >= fs[i - 1].bottom + 4), JSON.stringify(fs.map(f => [Math.round(f.top), Math.round(f.bottom)])));
  const tb = await avaliar(`document.getElementById('teachbar').getBoundingClientRect().left`);
  conferir('as fitas ficam à esquerda da barra do professor, não por cima', fs.every(f => f.right <= tb + 1), `${JSON.stringify(fs.map(f => f.right))} barra ${tb}`);
  await foto('fitas');

  // ---------- M2 ----------
  console.log('M2: lista por grupo, mover e mudar de lugar');
  const abreFitaVarios = async () => { await avaliar(`[...document.querySelectorAll('#fitas .fita')].find(f => f.querySelector('.fita-n'))?.click()`);
    await ate(`!!document.querySelector('#pop:not([hidden]) .mkl-linha')`, 5000); await espera(200); };
  const esperaDisco = async (f, ms = 6000) => { const fim = Date.now() + ms; while (Date.now() < fim) { const v = f(disco('m1')); if (v) return v; await espera(150); } return f(disco('m1')); };
  await abreFitaVarios();
  const linhas = () => avaliar(`[...document.querySelectorAll('#pop .mkl-linha')].map(l => l.dataset.mk)`);
  conferir('a fita com o número abre os 4 marcadores daquela página', JSON.stringify((await linhas()).sort()) === JSON.stringify(['e1', 'e2', 'e3', 'e4']), JSON.stringify(await linhas()));
  await foto('lista-da-pagina');
  await avaliar(`document.querySelector('#pop .mkl-linha[data-mk="e2"] .mk-mais').click()`); await espera(300);
  await avaliar(`[...document.querySelectorAll('#pop .menu button')].find(b => b.textContent.includes('Mover para o grupo')).click()`); await espera(300);
  await avaliar(`document.querySelector('#pop [data-g="gA"]').click()`);
  conferir('"Mover para o grupo…" põe "Exemplo 2" no grupo Aula 1 (gravado)', await esperaDisco(b => b.marcadores.find(m => m.id === 'e2')?.grupo === 'gA'));
  const mkv1 = disco('m1')._mkv;
  // arrastar pela alça: "Gráfico" (sem grupo) para antes de "Exemplo 1", no grupo Aula 1
  await espera(800);
  if (!(await avaliar(`!!document.querySelector('#pop:not([hidden]) .mk-lista2')`))) await abreFitaVarios();
  await avaliar(`document.querySelector('#pop .mkl-linha[data-mk="e4"]').scrollIntoView({ block: 'center' })`); await espera(200);
  await foto('antes-de-arrastar');
  const de = await avaliar(`(() => { const r = document.querySelector('#pop .mkl-linha[data-mk="e4"] .mk-alca').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  const para = await avaliar(`(() => { const r = document.querySelector('#pop .mkl-linha[data-mk="e1"]').getBoundingClientRect(); return [r.left + 60, r.top + 4]; })()`);
  console.log('    lista aberta:', await avaliar(`!!document.querySelector('#pop:not([hidden]) .mk-lista2')`), JSON.stringify(de), JSON.stringify(para));
  await mouse('mousePressed', ...de); for (let k = 1; k <= 8; k++) await mouse('mouseMoved', de[0], de[1] + (para[1] - de[1]) * k / 8); await mouse('mouseReleased', de[0], para[1]);
  const oa = await esperaDisco(b => { const o = b.marcadores.filter(m => m.grupo === 'gA').sort((x, y) => x.ordem - y.ordem).map(m => m.id); return o[0] === 'e4' ? o : null; });
  conferir('arrastar pela alça leva "Gráfico" para o grupo, antes de "Exemplo 1"', oa && oa[0] === 'e4' && oa.includes('e1') && oa.includes('e2'), JSON.stringify(oa));
  conferir('cada mudança sobe a versão dos marcadores', disco('m1')._mkv > mkv1, `${mkv1} → ${disco('m1')._mkv}`);
  // mudar de lugar: "Questão 4" (página 4) para a página 6
  await espera(600);
  await avaliar(`document.getElementById('pop').hidden = true`);
  await abreFitaVarios();
  await avaliar(`document.querySelector('#pop .mk-todos')?.click()`); await espera(900);
  await avaliar(`document.querySelector('#pop .mkl-linha[data-mk="q4"] .mk-mais').click()`); await espera(300);
  await foto('menu-do-marcador');
  await avaliar(`[...document.querySelectorAll('#pop .menu button')].find(b => b.textContent.includes('Mudar de lugar')).click()`); await espera(300);
  const [px, py] = await naTela(640, 5 * passo + 360);
  const visivel = px > 100 && px < 1500 && py > 80 && py < 1000;
  if (!visivel) { await avaliar(`(() => { const S = window.__lousa.S; S.view = { zoom: S.view.zoom, x: S.view.x, y: 540 - (${5 * passo + 360}) * S.view.zoom }; })()`); await espera(300); }
  const [qx, qy] = await naTela(640, 5 * passo + 360);
  await mouse('mousePressed', qx, qy); await mouse('mouseReleased', qx, qy);
  const q4 = await esperaDisco(b => { const m = b.marcadores.find(x => x.id === 'q4'); return m.pagina === 6 ? m : null; });
  conferir('"Mudar de lugar no quadro": o toque leva "Questão 4" para a página 6', q4 && Math.abs(q4.cy - (5 * passo + 360)) < 3, JSON.stringify(q4 || disco('m1').marcadores.find(x => x.id === 'q4')));
  conferir('o toque de mudar de lugar não desenha nada no quadro', (await avaliar('window.__lousa.S.items.length')) === 0);

  // ---------- M3 ----------
  console.log('M3: Apagar com Desfazer, Mudar de lugar e Esc no arraste');
  await avaliar(`document.getElementById('pop').hidden = true`); await espera(300);
  await abreFitaVarios();
  await avaliar(`document.querySelector('#pop .mk-todos')?.click()`); await ate(`!!document.querySelector('#pop:not([hidden]) .mkl-linha[data-mk="e3"]')`, 5000);
  await avaliar(`document.querySelector('#pop .mkl-linha[data-mk="e3"] .mk-mais').click()`); await espera(300);
  await avaliar(`[...document.querySelectorAll('#pop .menu button')].find(b => b.textContent.trim() === 'Apagar').click()`);
  conferir('Apagar tira o marcador (gravado)', await esperaDisco(b => !b.marcadores.some(m => m.id === 'e3')));
  conferir('e o aviso tem "Desfazer"', await ate(`[...document.querySelectorAll('#toast .toast-btn')].some(b => b.textContent === 'Desfazer')`, 3000));
  await avaliar(`[...document.querySelectorAll('#toast .toast-btn')].find(b => b.textContent === 'Desfazer').click()`);
  const e3 = await esperaDisco(b => b.marcadores.find(m => m.id === 'e3'));
  conferir('"Desfazer" traz o marcador de volta, com o mesmo nome e ponto', e3 && e3.nome === 'Exercício 3' && e3.cy === 2 * passo + 150 + 2 * 120, JSON.stringify(e3));
  // Esc no meio do arraste: cancela só o arraste
  await espera(600);
  if (!(await avaliar(`!!document.querySelector('#pop:not([hidden]) .mkl-linha[data-mk="a1"]')`))) {
    await abreFitaVarios(); await avaliar(`document.querySelector('#pop .mk-todos')?.click()`); await ate(`!!document.querySelector('#pop:not([hidden]) .mkl-linha[data-mk="a1"]')`, 5000);
  }
  const antesEsc = JSON.stringify(disco('m1').marcadores.map(m => [m.id, m.grupo || '', m.ordem]));
  const mkvEsc = disco('m1')._mkv;
  const de2 = await avaliar(`(() => { const r = document.querySelector('#pop .mkl-linha[data-mk="a1"] .mk-alca').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  const para2 = await avaliar(`(() => { const r = document.querySelector('#pop .mkl-linha[data-mk="e1"]').getBoundingClientRect(); return [r.left + 60, r.top + 4]; })()`);
  await mouse('mousePressed', ...de2); for (let k = 1; k <= 6; k++) await mouse('mouseMoved', de2[0], de2[1] + (para2[1] - de2[1]) * k / 6);
  await tecla('Escape', 'Escape', 27); await espera(200);
  await mouse('mouseReleased', de2[0], para2[1]); await espera(1500);
  conferir('Esc no meio do arraste não grava nada', JSON.stringify(disco('m1').marcadores.map(m => [m.id, m.grupo || '', m.ordem])) === antesEsc && disco('m1')._mkv === mkvEsc);
  conferir('e a lista continua aberta', await avaliar(`!!document.querySelector('#pop:not([hidden]) .mk-lista2')`));
  // Mudar de lugar e trocar de quadro: o toque no outro quadro não mexe no marcador
  await avaliar(`document.querySelector('#pop .mkl-linha[data-mk="a1"] .mk-mais').click()`); await espera(300);
  await avaliar(`[...document.querySelectorAll('#pop .menu button')].find(b => b.textContent.includes('Mudar de lugar')).click()`); await espera(300);
  const mkvLugar = disco('m1')._mkv, a1 = JSON.stringify(disco('m1').marcadores.find(m => m.id === 'a1'));
  await abrir('b1');
  const [ox, oy] = await naTela(600, 300);
  await mouse('mousePressed', ox, oy); await mouse('mouseReleased', ox, oy); await espera(1200);
  conferir('"Mudar de lugar" não vale noutro quadro: o marcador e a versão ficam iguais', disco('m1')._mkv === mkvLugar && JSON.stringify(disco('m1').marcadores.find(m => m.id === 'a1')) === a1);

  conferir('nenhum erro na página', !erros.length, erros.join(' | '));
} catch (e) {
  falhas++; console.log('  ✗ parou:', e.message);
} finally {
  for (const p of procs) { try { p.kill(); } catch {} }
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
