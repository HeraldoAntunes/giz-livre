// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Pacote 1.18.0 (fila docs/FILA-GIZ-LIVRE.md), sem janela (Edge headless, servidor com dados temporários):
//   D2  o "+" da barra de páginas e o do painel põem a página em branco DEPOIS da atual (antes ia para o fim);
//       "Nova página no fim" continua no menu "…"
//   D1  abrir o quadro pelo marcador (aba Marcadores) leva à página do marcador, num quadro de 195 slides
//   D3  na apresentação, o Esc (e a saída da tela cheia pelo navegador) fecha primeiro a camada de cima (lupa…)
//   D5  "Mover quadros para a pasta": os sem pasta primeiro, os de outras pastas agrupados e recolhidos, busca e
//       confirmação antes de tirar um quadro de outra pasta
//   D6  "Grupo novo" (no quadro e na galeria) não apaga um grupo criado noutra janela nesse meio-tempo
//   D7  o cartão de marcador da galeria tem uma alça para arrastar com o dedo ou a caneta
//   A1  apresentação: "↩ Voltar ao slide N" depois de saltar por um marcador (pilha, como o voltar do navegador) e
//       "Marcar" de um toque
//   A2  no slide marcado, o "Marcar" vira "Desmarcar", com Desfazer
//   A3  Home e End vão à primeira e à última página; tocar no número abre "Ir para" (1, −10, +10, última, número)
//   A4  o aviso com Desfazer some no próximo toque fora dele (antes ficava até 8 s)
//   B1  numa tela de 900 x 700, a página enquadrada não fica embaixo das barras
//   B2  numa tela de 890 x 460, só com ícones, a barra do professor (direita) tem a largura de um ícone
//   G1  ocultar a faixa de formas da galeria, lembrando a escolha (volta em Exibir)
//   G2  tamanho dos cartões de quadros e pastas (P, M, G, GG)
//   G3  cor e ícone de cada pasta
//   D9  com ?caiu=1 (a janela recarregou a página depois de uma queda), aparece o aviso e a marca sai do endereço
//   D4  um aviso ao programa que falha (rede do Windows) não mostra "o programa foi fechado"; o aviso some quando volta
//   node tests/e2e_118.mjs [--raiz <pasta de outra versão>]
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

const tmp = pastaTemporaria('giz-118-'), DADOS = join(tmp, 'dados');
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
  const EVID = pastaDeEvidencia('e2e_118');
  const foto = async nome => writeFileSync(join(EVID, nome + '.png'), Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  const disco = id => JSON.parse(readFileSync(join(DADOS, id + '.json'), 'utf8'));
  const pagina = () => avaliar(`document.getElementById('pgLabel').textContent`);
  const pgImgs = () => avaliar(`window.__lousa.S.items.filter(i => i.type === 'image').map(i => [i.id, Math.round(i.y / ${passo})]).sort()`);
  const cores = [];
  for (let k = 0; k < 10; k++) cores.push(await subir([20 * k, 120, 200 - 15 * k]));

  // ---------- D2 ----------
  console.log('D2: página em branco nova vai para depois da atual');
  await criar('d2', { title: 'Dez slides fictícios', layout: L(10), items: cores.map((c, k) => paginaImg(k, c)) });
  await abrir('d2');
  for (let k = 0; k < 4; k++) { await avaliar(`document.getElementById('pgNext').click()`); await espera(250); }
  conferir('está na página 5', (await pagina()).startsWith('Página 5 '), await pagina());
  await avaliar(`document.getElementById('pgAdd').click()`); await espera(500);
  conferir('o "+" da barra insere uma página', (await avaliar('window.__lousa.S.board.layout.count')) === 11);
  conferir('e vai para a página 6, logo depois da atual', (await pagina()).startsWith('Página 6 de 11'), await pagina());
  const im = Object.fromEntries(await pgImgs());
  conferir('a página 6 nova está em branco e os slides de depois desceram uma', im.pg4 === 4 && im.pg5 === 6 && im.pg9 === 10 && !Object.values(im).includes(5), JSON.stringify(im));
  await tecla('z', 'KeyZ', 90, 2); await espera(400);
  conferir('Ctrl+Z tira a página nova', (await avaliar('window.__lousa.S.board.layout.count')) === 10);
  // painel de páginas: o "+" também insere depois da atual
  await avaliar(`document.getElementById('pgAll').click()`); await espera(500);
  const antesPp = +(await pagina()).match(/\d+/)[0];
  await avaliar(`document.getElementById('ppAdd').click()`); await espera(500);
  conferir('o "+" do painel também insere depois da atual', (await avaliar('window.__lousa.S.board.layout.count')) === 11 && (await pagina()).startsWith(`Página ${antesPp + 1} de 11`), await pagina());
  await avaliar(`document.getElementById('ppClose').click()`); await espera(200);
  // menu "…": a página no fim continua possível
  await avaliar(`document.getElementById('pgMore').click()`); await espera(300);
  const fim = await avaliar(`!![...document.querySelectorAll('#pop button')].find(b => b.textContent.includes('Nova página no fim'))`);
  conferir('o menu "…" tem "Nova página no fim"', fim);
  if (fim) { await avaliar(`[...document.querySelectorAll('#pop button')].find(b => b.textContent.includes('Nova página no fim')).click()`); await espera(500); }
  conferir('e ela vai para o fim', (await avaliar('window.__lousa.S.board.layout.count')) === 12 && (await pagina()).startsWith('Página 12 de 12'), await pagina());

  // ---------- D1 ----------
  console.log('D1: abrir pelo marcador leva à página do marcador');
  await criar('d1', { title: 'Aula fictícia de 195 slides', layout: L(195), view: { x: 0, y: -119 * passo * 0.7, zoom: 0.7 },
    items: Array.from({ length: 195 }, (_, k) => paginaImg(k, cores[k % 10])) });
  await api('POST', '/api/marcadores', { novos: [
    { quadro: 'd1', marcador: { id: 'k54', nome: 'Exemplo do slide 54', cx: 640, cy: 53 * passo + 360, w: 1480, pagina: 54, criado: 1793880000000, ordem: 1 } },
    { quadro: 'd1', marcador: { id: 'k150', nome: 'Exercício do slide 150', cx: 640, cy: 149 * passo + 200, w: 900, pagina: 150, criado: 1793880000001, ordem: 2 } }] });
  for (const [mk, pg] of [['k54', 54], ['k150', 150]]) {
    await cdp('Page.navigate', { url: `${BASE}/#/marcadores` }); await espera(1200);
    await cdp('Page.navigate', { url: `${BASE}/#/b/d1?m=${mk}` });
    await ate(`window.__lousa?.S?.id === 'd1'`, 30000); await espera(2500);
    await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);
    conferir(`o marcador do slide ${pg} abre o quadro na página ${pg}`, (await pagina()).startsWith(`Página ${pg} `), await pagina());
  }

  // ---------- D3 ----------
  console.log('D3: Esc fecha a camada de cima antes de sair da apresentação');
  await abrir('d2');
  const apresentando = () => avaliar(`document.getElementById('board').classList.contains('present')`);
  const lupa = () => avaliar(`!!document.getElementById('zLens')?.classList.contains('on')`);
  await avaliar(`document.getElementById('bPresent').click()`); await espera(700);
  conferir('a apresentação começou', await apresentando());
  await tecla('z', 'KeyZ', 90); await espera(300);
  conferir('a lupa abriu', await lupa());
  await tecla('Escape', 'Escape', 27); await espera(400);
  conferir('o 1º Esc fecha a lupa e a apresentação continua', !(await lupa()) && await apresentando());
  await tecla('Escape', 'Escape', 27); await espera(400);
  conferir('o 2º Esc sai da apresentação', !(await apresentando()));
  // o navegador tirou a tela cheia (o Esc dele) com a lupa aberta: fecha a lupa e continua apresentando
  await avaliar(`document.getElementById('bPresent').click()`); await espera(700);
  await tecla('z', 'KeyZ', 90); await espera(300);
  await avaliar(`document.dispatchEvent(new Event('fullscreenchange'))`); await espera(400);
  conferir('sair da tela cheia com a lupa aberta só fecha a lupa', !(await lupa()) && await apresentando());
  await avaliar(`document.dispatchEvent(new Event('fullscreenchange'))`); await espera(400);
  conferir('sem camada aberta, sair da tela cheia encerra a apresentação, como antes', !(await apresentando()));

  // ---------- D5 ----------
  console.log('D5: mover quadros para a pasta separa os que já estão em outra pasta');
  const pasta = async (id, f) => api('PUT', '/api/folder/' + id, { folder: f });
  for (const [id, t, f] of [['s1', 'Solto A', ''], ['s2', 'Solto B', ''], ['e1', 'Esgoto 1', 'SES'], ['e2', 'Esgoto 2', 'SES'], ['g1', 'Gás de biodigestor', 'Tecnologias de Biodigestores']]) {   // "Estatística" é a pasta nova, ainda vazia: é nela que aparece "Escolher quadros…"
    await criar(id, { title: t, layout: L(1), items: [] }); if (f) await pasta(id, f);
  }
  await cdp('Page.navigate', { url: `${BASE}/#/p/${encodeURIComponent('Estatística')}` }); await espera(1500);
  await avaliar(`document.getElementById('gPick').click()`); await espera(500);
  const grupos = await avaliar(`[...document.querySelectorAll('dialog.g-pick .g-pick-grupo')].map(g => ({ g: g.dataset.grupo, aberto: g.tagName !== 'DETAILS' || g.open, ids: [...g.querySelectorAll('input')].map(i => i.value) }))`);
  conferir('os sem pasta vêm primeiro, abertos', grupos[0]?.g === '' && grupos[0].aberto && grupos[0].ids.includes('s1') && grupos[0].ids.includes('s2') && !grupos[0].ids.some(i => /^[eg]\d/.test(i)), JSON.stringify(grupos));
  conferir('os de outras pastas ficam agrupados por pasta e recolhidos', grupos.length === 3 && grupos.slice(1).every(g => !g.aberto) && grupos.find(g => g.g === 'SES')?.ids.length === 2, JSON.stringify(grupos));
  await avaliar(`(() => { const d = document.querySelector('dialog.g-pick'); for (const v of ['s1', 'e1']) d.querySelector('input[value="' + v + '"]').click(); })()`); await espera(200);
  const rot = await avaliar(`document.querySelector('dialog.g-pick [data-a="1"]').textContent`);
  conferir('o botão avisa que um sai de outra pasta', rot.includes('Mover 2') && rot.includes('sai de outra pasta'), rot);
  await avaliar(`document.querySelector('dialog.g-pick [data-a="1"]').click()`); await espera(500);
  const pergunta = await avaliar(`[...document.querySelectorAll('dialog[open]')].map(d => d.textContent).join(' | ')`);
  conferir('antes de mover, pergunta se pode tirar de "SES"', pergunta.includes('Tirar de outra pasta') && pergunta.includes('"SES"'), pergunta);
  await avaliar(`[...document.querySelectorAll('dialog[open]')].at(-1).querySelector('[data-a="0"]').click()`); await espera(800);
  const pastas = async () => Object.fromEntries((await (await api('GET', '/api/boards')).json()).map(b => [b.id, b.folder || '']));
  conferir('Cancelar não move nada', (await pastas()).e1 === 'SES' && (await pastas()).s1 === '');
  await avaliar(`document.querySelector('dialog.g-pick .g-pick-busca').value = 'bio'; document.querySelector('dialog.g-pick .g-pick-busca').dispatchEvent(new Event('input'))`); await espera(200);
  const vis = await avaliar(`[...document.querySelectorAll('dialog.g-pick label')].filter(l => !l.hidden && l.offsetParent).map(l => l.querySelector('input').value)`);
  conferir('a busca acha pelo nome da pasta e abre o grupo', vis.join() === 'g1', JSON.stringify(vis));
  await avaliar(`document.querySelector('dialog.g-pick .g-pick-busca').value = ''; document.querySelector('dialog.g-pick .g-pick-busca').dispatchEvent(new Event('input'))`);
  await avaliar(`document.querySelector('dialog.g-pick [data-a="1"]').click()`); await espera(500);
  await avaliar(`[...document.querySelectorAll('dialog[open]')].at(-1).querySelector('[data-a="1"]').click()`); await espera(1500);
  const p2 = await pastas();
  conferir('confirmando, os dois vão para "Estatística"', p2.s1 === 'Estatística' && p2.e1 === 'Estatística' && p2.e2 === 'SES', JSON.stringify(p2));

  // ---------- D6 ----------
  console.log('D6: "Grupo novo" não apaga um grupo criado noutra janela');
  await criar('m6', { title: 'Aula com dois marcadores', layout: L(2), items: [] });
  await api('POST', '/api/marcadores', { novos: [
    { quadro: 'm6', marcador: { id: 'p1', nome: 'Primeiro', cx: 640, cy: 150, w: 1280, pagina: 1, criado: 1793880000000, ordem: 1 } },
    { quadro: 'm6', marcador: { id: 'p2', nome: 'Segundo', cx: 640, cy: 400, w: 1280, pagina: 1, criado: 1793880000001, ordem: 2 } }] });
  await avaliar('window.gizFechando = true').catch(() => {}); await cdp('Page.navigate', { url: 'about:blank' }); await espera(300);
  await abrir('m6');
  // outra janela (ou a galeria) cria um grupo depois que este quadro abriu
  await api('POST', '/api/marcadores', { gruposMudar: [{ id: 'gOutra', nome: 'Da outra janela', cor: '#107c10', ordem: 1 }] });
  await avaliar(`document.querySelector('#fitas .fita').click()`); await espera(500);
  await avaliar(`document.querySelector('#pop .mkl-linha[data-mk="p1"] .mk-mais').click()`); await espera(300);
  await avaliar(`[...document.querySelectorAll('#pop .menu button')].find(b => b.textContent.includes('Mover para o grupo')).click()`); await espera(300);
  await avaliar(`document.querySelector('#pop [data-g="+"]').click()`); await espera(400);
  await avaliar(`(() => { const d = [...document.querySelectorAll('dialog[open]')].at(-1); const i = d.querySelector('input'); i.value = 'Grupo desta janela'; i.dispatchEvent(new Event('input')); d.querySelector('[data-a="1"], button.primary').click(); })()`);
  await espera(1500);
  const gs = (await (await api('GET', '/api/marcadores')).json()).grupos.map(g => g.nome);
  conferir('os dois grupos ficam: o da outra janela e o novo', gs.includes('Da outra janela') && gs.includes('Grupo desta janela'), JSON.stringify(gs));
  const p1 = disco('m6').marcadores.find(m => m.id === 'p1');
  conferir('e o marcador foi para o grupo novo', !!p1?.grupo && p1.grupoNome === 'Grupo desta janela', JSON.stringify(p1));

  // ---------- D7 ----------
  console.log('D7: arrastar um cartão de marcador com o dedo, pela alça');
  await cdp('Page.navigate', { url: `${BASE}/#/marcadores` }); await espera(1500);
  const alca = await avaliar(`(() => { const a = document.querySelector('.mk-card[data-mk="p2"] .mk-alca'); return a ? getComputedStyle(a).touchAction : ''; })()`);
  conferir('o cartão tem uma alça que não deixa o navegador rolar no meio do arraste', alca === 'none', alca);
  const pos = await avaliar(`(() => { const a = document.querySelector('.mk-card[data-mk="p2"] .mk-alca').getBoundingClientRect(), g = document.querySelector('.mk-grupo[data-g="gOutra"]').getBoundingClientRect();
    return [a.x + a.width / 2, a.y + a.height / 2, g.x + 40, g.y + g.height / 2]; })()`);
  // o dedo: PointerEvents de toque (o Input.dispatchTouchEvent trava no Edge sem janela)
  await avaliar(`(async () => { const [x0, y0, x1, y1] = ${JSON.stringify(pos)}, a = document.querySelector('.mk-card[data-mk="p2"] .mk-alca');
    const ev = (t, x, y, alvo) => alvo.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, buttons: t === 'pointerup' ? 0 : 1 }));
    ev('pointerdown', x0, y0, a);
    for (let k = 1; k <= 8; k++) { ev('pointermove', x0 + (x1 - x0) * k / 8, y0 + (y1 - y0) * k / 8, window); await new Promise(r => setTimeout(r, 30)); }
    ev('pointerup', x1, y1, window); })()`);
  await espera(1500);
  conferir('soltar o cartão no grupo "Da outra janela" muda o grupo (gravado)', disco('m6').marcadores.find(m => m.id === 'p2')?.grupo === 'gOutra', JSON.stringify(disco('m6').marcadores.find(m => m.id === 'p2')));

  // ---------- A1 e A2 ----------
  console.log('A1: ir e voltar pelos marcadores na apresentação; A2: desmarcar no próprio slide');
  await avaliar('window.gizFechando = true').catch(() => {}); await cdp('Page.navigate', { url: 'about:blank' }); await espera(300);
  await abrir('d1');
  const slide = async () => +(await avaliar(`document.getElementById('ppLabel').textContent`)).split('/')[0];
  const voltar = () => avaliar(`(() => { const b = document.getElementById('ppVoltar'); return b.hidden ? '' : b.textContent.trim(); })()`);
  const pelaLista = async id => { await avaliar(`document.getElementById('ppMarcadores').click()`); await espera(400);
    await avaliar(`document.querySelector('#pop .mkl-linha[data-mk="${id}"] .mk-ir').click()`); await espera(900); };
  await avaliar(`document.getElementById('bPresent').click()`); await espera(800);
  for (let k = 0; k < 3; k++) { await tecla('PageDown', 'PageDown', 34); await espera(250); }
  const origem = await slide();
  conferir('sem salto, não há "Voltar"', !(await voltar()));
  await pelaLista('k54');
  conferir('o marcador leva ao slide 54', (await slide()) === 54, String(await slide()));
  conferir(`e aparece "Voltar ao slide ${origem}"`, (await voltar()).includes(`Voltar ao slide ${origem}`), await voltar());
  await pelaLista('k150');
  conferir('de 54 para 150: "Voltar ao slide 54"', (await slide()) === 150 && (await voltar()).includes('Voltar ao slide 54'), `${await slide()} ${await voltar()}`);
  await avaliar(`document.getElementById('ppVoltar').click()`); await espera(600);
  conferir('voltar leva ao 54 e oferece a origem', (await slide()) === 54 && (await voltar()).includes(`Voltar ao slide ${origem}`), `${await slide()} ${await voltar()}`);
  await avaliar(`document.getElementById('ppVoltar').click()`); await espera(600);
  conferir('voltar de novo leva à origem, e o botão sai', (await slide()) === origem && !(await voltar()), `${await slide()} ${await voltar()}`);
  await pelaLista('k54');
  await tecla('PageDown', 'PageDown', 34); await espera(400);
  conferir('mudar de página à mão tira o "Voltar"', !(await voltar()) && (await slide()) === 55);
  await tecla('PageUp', 'PageUp', 33); await espera(400);
  const rotulo = () => avaliar(`document.querySelector('#ppMarcar b').textContent`);
  conferir('A2: no slide marcado, o botão diz "Desmarcar"', (await rotulo()) === 'Desmarcar', await rotulo());
  await avaliar(`document.getElementById('ppMarcar').click()`); await espera(1200);
  conferir('um toque tira o marcador do slide 54 (gravado)', !disco('d1').marcadores.some(m => m.id === 'k54') && (await rotulo()) === 'Marcar', JSON.stringify(disco('d1').marcadores.map(m => m.id)));
  conferir('com "Desfazer" no aviso', await avaliar(`[...document.querySelectorAll('#toast button')].some(b => b.textContent.includes('Desfazer'))`));
  await avaliar(`document.getElementById('ppMarcar').click()`); await espera(1500);
  const novo = disco('d1').marcadores.find(m => m.id !== 'k150');
  conferir('A1: "Marcar" de um toque marca o slide 54 sem perguntar nada', !!novo && novo.pagina === 54 && !(await avaliar(`!document.getElementById('pop').hidden`)), JSON.stringify(novo));
  await tecla('Escape', 'Escape', 27); await espera(400);

  // ---------- A3 ----------
  console.log('A3: ir ao começo, ao fim e pular muitas páginas');
  await abrir('d1');
  await tecla('End', 'End', 35); await espera(400);
  conferir('End vai à última página', (await pagina()).startsWith('Página 195 de 195'), await pagina());
  await tecla('Home', 'Home', 36); await espera(400);
  conferir('Home vai à primeira', (await pagina()).startsWith('Página 1 de 195'), await pagina());
  await avaliar(`document.getElementById('pgLabel').click()`); await espera(300);
  await avaliar(`document.querySelector('#pop [data-d="10"]').click()`); await espera(400);
  conferir('tocar no número e em +10 pula dez páginas', (await pagina()).startsWith('Página 11 de 195'), await pagina());
  await avaliar(`document.getElementById('pgLabel').click()`); await espera(300);
  await avaliar(`document.querySelector('#pop .ir-pg input').value = '120'`);
  await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await espera(400);
  conferir('o número com Enter vai à página 120', (await pagina()).startsWith('Página 120 de 195'), await pagina());
  await avaliar(`document.getElementById('bPresent').click()`); await espera(800);
  await avaliar(`document.getElementById('ppLabel').click()`); await espera(300);
  await avaliar(`document.querySelector('#pop [data-p="195"]').click()`); await espera(500);
  conferir('na apresentação, o número também abre "Ir para" (última)', (await avaliar(`document.getElementById('ppLabel').textContent`)).startsWith('195 /'), await avaliar(`document.getElementById('ppLabel').textContent`));
  await tecla('Home', 'Home', 36); await espera(500);
  conferir('e Home volta ao primeiro slide', (await avaliar(`document.getElementById('ppLabel').textContent`)).startsWith('1 /'));
  await tecla('Escape', 'Escape', 27); await espera(400);

  // ---------- A4 ----------
  console.log('A4: o aviso de desfazer some ao continuar o trabalho');
  await abrir('d2');
  const avisoVis = () => avaliar(`!document.getElementById('toast').hidden`);
  const avisar = () => avaliar(`import('/js/ui.js').then(m => m.toast('Página excluída', 8000, { label: 'Desfazer', fn() {} }))`);
  await tecla('h', 'KeyH', 72); await espera(200);   // marca-texto: o toque no quadro não seleciona nada
  await avisar(); await espera(100);
  await mouse('mousePressed', 900, 500); await mouse('mouseReleased', 900, 500); await espera(150);
  conferir('o toque que veio junto com o aviso não o apaga', await avisoVis());
  await espera(800);
  await mouse('mousePressed', 905, 520); await mouse('mouseReleased', 905, 520); await espera(200);
  conferir('o próximo toque no quadro tira o aviso', !(await avisoVis()));
  await avisar(); await espera(800);
  await avaliar(`(() => { const r = document.querySelector('#toast .toast-btn').getBoundingClientRect(); window.__btn = [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  const [bx2, by2] = await avaliar('window.__btn');
  await mouse('mousePressed', bx2, by2);
  conferir('tocar no próprio aviso (Desfazer) não o tira antes da hora', await avisoVis());
  await mouse('mouseReleased', bx2, by2); await espera(200);

  // ---------- B1 e B2 ----------
  console.log('B1 e B2: barras em telas pequenas');
  await tela(900, 700);
  await avaliar('window.gizFechando = true').catch(() => {}); await cdp('Page.navigate', { url: 'about:blank' }); await espera(300);
  await abrir('d2');
  await avaliar(`(() => { const b = document.getElementById('teachbar'); if (b.hidden) document.querySelector('[data-a="teach"], #tTeach')?.click(); })()`);
  await avaliar(`document.getElementById('pgNext').click()`); await espera(600);
  const cruza = await avaliar(`(() => { const v = window.__lousa.S.view, L = window.__lousa.S.board.layout, i = +document.getElementById('pgLabel').textContent.split(' ')[1] - 1, y = i * (L.h + L.gap);
    const p = { l: v.x, t: y * v.zoom + v.y, r: L.w * v.zoom + v.x, b: (y + L.h) * v.zoom + v.y };
    return [...document.querySelectorAll('#board .bar')].filter(e => !e.hidden && e.offsetWidth && !e.classList.contains('selbar') && !e.classList.contains('presentbar'))
      .map(e => [e.id || e.className, e.getBoundingClientRect()]).filter(([, q]) => q.left < p.r - 1 && q.right > p.l + 1 && q.top < p.b - 1 && q.bottom > p.t + 1).map(([n]) => n); })()`);
  conferir('B1 (900 x 700): a página enquadrada não fica embaixo de nenhuma barra', Array.isArray(cruza) && !cruza.length, JSON.stringify(cruza));
  await tela(890, 460); await espera(400);
  const tb = await avaliar(`(() => { const b = document.getElementById('teachbar'); return b.hidden ? null : { w: Math.round(b.getBoundingClientRect().width), nomes: b.classList.contains('nomes'), ic: Math.round(b.querySelector('.cb, .ib')?.getBoundingClientRect().width || 0) }; })()`);
  conferir('B2: só com ícones, a barra da direita tem a largura de um ícone', tb && !tb.nomes && tb.w <= tb.ic + 20, JSON.stringify(tb));
  await tela(1920, 1080);

  // ---------- G1, G2 e G3 ----------
  console.log('G1 a G3: galeria (formas no topo, tamanho dos cartões, cor e ícone da pasta)');
  await avaliar('window.gizFechando = true').catch(() => {}); await cdp('Page.navigate', { url: 'about:blank' }); await espera(300);
  await cdp('Page.navigate', { url: `${BASE}/#/` }); await ate(`!!document.querySelector('#gGrid .card')`, 15000); await espera(600);
  const temFaixa = () => avaliar(`!!document.querySelector('#gGrid .g-vitrine')`);
  conferir('G1: a faixa de formas aparece de início', await temFaixa());
  await avaliar(`document.querySelector('#gGrid .gv-ocultar').click()`); await espera(400);
  conferir('G1: "Ocultar" tira a faixa', !(await temFaixa()));
  await cdp('Page.reload', {}); await ate(`!!document.querySelector('#gGrid .card')`, 15000); await espera(600);
  conferir('G1: e a escolha fica guardada (recarregando, continua oculta)', !(await temFaixa()));
  await avaliar(`document.getElementById('gExibir').click()`); await espera(300);
  await avaliar(`(() => { const c = document.querySelector('#pop [data-a="vitrine"]'); c.checked = true; c.dispatchEvent(new Event('change')); })()`); await espera(400);
  conferir('G1: em Exibir, a faixa volta', await temFaixa());
  await avaliar(`document.querySelector('#pop [data-tam="GG"]').click()`); await espera(400);
  const gg = await avaliar(`(() => { const c = document.querySelector('#gGrid .card[data-id] .thumb'); return { tam: document.getElementById('gGrid').dataset.tam, h: Math.round(c.getBoundingClientRect().height), w: Math.round(c.getBoundingClientRect().width) }; })()`);
  conferir('G2: o tamanho GG amplia os cartões', gg.tam === 'GG' && gg.h >= 240 && gg.w >= 400, JSON.stringify(gg));
  await avaliar(`document.querySelector('#pop [data-tam="P"]').click()`); await espera(400);
  const pp = await avaliar(`Math.round(document.querySelector('#gGrid .card[data-id] .thumb').getBoundingClientRect().height)`);
  conferir('G2: o tamanho P reduz', pp <= 110, String(pp));
  await avaliar(`document.querySelector('#pop [data-tam="M"]').click()`); await espera(300);
  await tecla('Escape', 'Escape', 27); await avaliar(`document.getElementById('pop').hidden = true`);
  await avaliar(`document.querySelector('.fcard[data-folder="SES"] .dots').click()`); await espera(300);
  await avaliar(`document.querySelector('#pop [data-a="aparencia"]').click()`); await espera(300);
  await avaliar(`document.querySelector('#pop [data-c="#107c10"]').click()`); await espera(300);
  await avaliar(`document.querySelector('.fcard[data-folder="SES"] .dots').click()`); await espera(300);
  await avaliar(`document.querySelector('#pop [data-a="aparencia"]').click()`); await espera(300);
  await avaliar(`document.querySelector('#pop [data-i="gota"]').click()`); await espera(300);
  const ses = await avaliar(`(() => { const i = document.querySelector('.fcard[data-folder="SES"] .ficon'); return { cor: getComputedStyle(i).color, gota: i.innerHTML.includes('M12 3s6 6.5') }; })()`);
  conferir('G3: a pasta "SES" fica verde e com o ícone da gota', ses.cor === 'rgb(16, 124, 16)' && ses.gota, JSON.stringify(ses));
  const outra = await avaliar(`document.querySelector('.fcard[data-folder="Tecnologias de Biodigestores"] .ficon').getAttribute('style')`);
  conferir('G3: as outras pastas continuam como eram', !outra, String(outra));

  // ---------- D4 ----------
  console.log('D4: um aviso ao programa que falha não diz que o programa fechou');
  // o aviso periódico (30 s) passa a 1,5 s; window.__pingFalha faz os próximos N avisos falharem como rede caída
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `window.__pingFalha = 0;
    const si = window.setInterval; window.setInterval = (f, ms, ...a) => si(f, ms === 30000 ? 1500 : ms, ...a);
    const fe = window.fetch; window.fetch = (u, o) => (String(u).includes('/api/ping') && window.__pingFalha > 0) ? (window.__pingFalha--, Promise.reject(new TypeError('Failed to fetch'))) : fe(u, o);` });
  await avaliar('window.gizFechando = true').catch(() => {}); await cdp('Page.navigate', { url: 'about:blank' }); await espera(300);   // só trocar o # não recarrega a página
  await abrir('d2');
  const aviso = () => avaliar(`(() => { const b = document.getElementById('banner'); return b && !b.hidden ? b.textContent : ''; })()`);
  await avaliar('window.__pingFalha = 1'); await espera(6000);
  conferir('uma falha só: nenhum aviso de programa fechado', !(await aviso()), await aviso());
  const log = () => { try { return readFileSync(join(tmp, 'giz-livre.log'), 'utf8'); } catch { return ''; } };
  conferir('e o programa registra a falha no giz-livre.log', log().includes('ficou sem resposta do programa'), log().slice(-300));
  await avaliar('window.__pingFalha = 6'); await espera(9000);
  conferir('três falhas seguidas: o aviso aparece', (await aviso()).includes('foi fechado'), await aviso());
  await avaliar('window.__pingFalha = 0'); await espera(4000);
  conferir('o programa volta a responder: o aviso some sozinho', !(await aviso()), await aviso());

  // ---------- D9 (b) ----------
  console.log('D9: a página reaberta depois de uma queda avisa e tira a marca do endereço');
  await avaliar('window.gizFechando = true').catch(() => {}); await cdp('Page.navigate', { url: 'about:blank' }); await espera(300);
  await cdp('Page.navigate', { url: `${BASE}/?caiu=1#/b/d2` });
  await ate(`window.__lousa?.S?.id === 'd2'`, 20000); await espera(800);
  const aviso9 = await avaliar(`(() => { const t = document.getElementById('toast'); return t && !t.hidden ? t.textContent : ''; })()`);
  conferir('aparece o aviso de que a página caiu e foi reaberta', aviso9.includes('caiu e foi reaberta'), aviso9);
  conferir('e a marca ?caiu=1 sai do endereço', !(await avaliar('location.search')).includes('caiu'), await avaliar('location.href'));

  conferir('nenhum erro na página', !erros.length, erros.join(' | '));
} catch (e) {
  falhas++; console.log('  ✗ parou:', e.message);
} finally {
  for (const p of procs) { try { p.kill(); } catch {} }
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
