// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// F1 (pedido de 19/11/2026): números carimbados como no Giz na Tela. Edge sem janela, servidor com dados temporários.
// Sequência 1, 2, 3 na página; Recomeçar; estilos (tamanho, formato, fundo, cor); letras; contagem por página;
// gravar e reabrir; desfazer; mudar o estilo pela seleção; o carimbo no desenho da página (o que vira PDF e miniatura);
// e o item é uma imagem SVG com os dados ao lado (uma versão anterior mostra os números).
//   node tests/e2e_numeros.mjs [--raiz <pasta de outra versão>]
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

const tmp = pastaTemporaria('giz-f1-'), DADOS = join(tmp, 'dados');
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
  await cdp('Emulation.setFocusEmulationEnabled', { enabled: true }); await cdp('Page.bringToFront');   // o Edge sem janela às vezes esconde a aba
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
  const EVID = pastaDeEvidencia('e2e_numeros');
  const foto = async nome => writeFileSync(join(EVID, nome + '.png'), Buffer.from((await cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  const carimbos = () => avaliar(`window.__lousa.S.items.filter(i => i.carimbo).map(i => ({ n: i.carimbo.n, l: i.carimbo.letras, f: i.carimbo.forma, p: i.carimbo.preenchido, t: i.carimbo.tam, c: i.carimbo.cor, w: Math.round(i.w), x: Math.round(i.x + i.w / 2), y: Math.round(i.y + i.h / 2), src: i.src.slice(0, 26), type: i.type }))`);
  const tocar = async (wx, wy) => { const [x, y] = await naTela(wx, wy); await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); await espera(250); };
  const pop = () => avaliar(`document.getElementById('pop').hidden ? '' : document.getElementById('pop').textContent`);
  const clicarPop = sel => avaliar(`document.querySelector('#pop ${sel}').click()`);
  await criar('f1', { title: 'Números sintéticos', layout: L(2), items: [] });
  await abrir('f1');
  await avaliar(`document.getElementById('pgPrev').click()`); await espera(300);

  console.log('Sequência e recomeçar');
  await tecla('u', 'KeyU', 85); await espera(200);
  await tocar(200, 200); await tocar(400, 200); await tocar(600, 200);
  let cs = await carimbos();
  conferir('a tecla U e três toques põem 1, 2 e 3', cs.map(c => c.n).join() === '1,2,3' && cs.every(c => !c.l), JSON.stringify(cs));
  conferir('o carimbo é uma imagem SVG com os dados ao lado (uma versão anterior mostra o número)', cs.every(c => c.type === 'image' && c.src.startsWith('data:image/svg+xml')), JSON.stringify(cs[0]));
  conferir('fica centrado onde tocou', Math.abs(cs[0].x - 200) <= 1 && Math.abs(cs[0].y - 200) <= 1, JSON.stringify(cs[0]));
  // a barra do professor: tocar de novo em Números abre o estilo
  await avaliar(`document.querySelector('#teachbar [data-k="numero"]').click()`); await espera(300);
  conferir('com a ferramenta ativa, tocar em Números abre o estilo e mostra o próximo (4)', (await pop()).includes('Próximo: 4'), await pop());
  await clicarPop('[data-a="recomecar"]'); await espera(300);
  await tocar(800, 200);
  cs = await carimbos();
  conferir('Recomeçar: o próximo é 1', cs.at(-1).n === 1, JSON.stringify(cs.map(c => c.n)));
  await tocar(900, 200);
  conferir('e a sequência continua dali (2)', (await carimbos()).at(-1).n === 2);

  console.log('Estilos');
  await avaliar(`document.querySelector('#teachbar [data-k="numero"]').click()`); await espera(300);
  await clicarPop('[data-tam="GG"]'); await espera(200);
  await clicarPop('[data-forma="quadrado"]'); await espera(200);
  await clicarPop('[data-cheio="0"]'); await espera(200);
  await clicarPop('[data-cor="#107c10"]'); await espera(200);
  await tecla('Escape', 'Escape', 27); await espera(200);
  await tocar(300, 450);
  let c = (await carimbos()).at(-1);
  conferir('GG, quadrado, só contorno, verde', c.t === 'GG' && c.w === 92 && c.f === 'quadrado' && c.p === false && c.c === '#107c10', JSON.stringify(c));
  for (const [forma, cheio] of [['losango', '1'], ['nenhum', '1'], ['circulo', '0']]) {
    await avaliar(`document.querySelector('#teachbar [data-k="numero"]').click()`); await espera(250);
    await clicarPop(`[data-forma="${forma}"]`); await espera(150); await clicarPop(`[data-cheio="${cheio}"]`); await espera(150);
    await tecla('Escape', 'Escape', 27); await espera(150);
    await tocar(500 + (forma.length * 30), 450);
    c = (await carimbos()).at(-1);
    conferir(`formato ${forma}, ${cheio === '1' ? 'preenchido' : 'só contorno'}`, c.f === forma && c.p === (cheio === '1'), JSON.stringify(c));
  }
  conferir('o último estilo usado fica lembrado (nos ajustes)', await avaliar(`JSON.parse(localStorage.getItem('lousa.cfg') || '{}').carimbo?.forma === 'circulo'`));

  console.log('Letras e contagem por página');
  await avaliar(`document.querySelector('#teachbar [data-k="numero"]').click()`); await espera(250);
  await clicarPop('[data-letras="1"]'); await espera(200); await tecla('Escape', 'Escape', 27);
  await tocar(200, 620); await tocar(300, 620);
  cs = (await carimbos()).filter(c => c.l);
  conferir('A, B, C: a primeira letra da página é A e depois B', cs.map(c => c.n).join() === '1,2', JSON.stringify(cs));
  await avaliar(`document.querySelector('#teachbar [data-k="numero"]').click()`); await espera(250);
  await clicarPop('[data-letras="0"]'); await espera(200); await tecla('Escape', 'Escape', 27);
  await avaliar(`document.getElementById('pgNext').click()`); await espera(400);
  await tocar(200, passo + 200);
  c = (await carimbos()).at(-1);
  conferir('na página 2, a contagem começa do 1', c.n === 1 && c.y > passo, JSON.stringify(c));

  console.log('Desfazer, gravar e reabrir');
  const antes = (await carimbos()).length;
  await tecla('z', 'KeyZ', 90, 2); await espera(300);
  conferir('Ctrl+Z tira o último', (await carimbos()).length === antes - 1);
  await tecla('y', 'KeyY', 89, 2); await espera(300);
  await avaliar(`window.gizFechando = true`); await cdp('Page.navigate', { url: 'about:blank' }); await espera(1500);
  const disco = JSON.parse(readFileSync(join(DADOS, 'f1.json'), 'utf8')).items.filter(i => i.carimbo);
  conferir('gravados no disco, com os dados do carimbo', disco.length === antes && disco.every(i => i.type === 'image' && i.carimbo.n >= 1), String(disco.length));
  await abrir('f1');
  conferir('reaberto, os mesmos números', (await carimbos()).length === antes);

  console.log('Estilo pela seleção');
  await tecla('Escape', 'Escape', 27);
  await tecla('Home', 'Home', 36); await espera(400);
  await avaliar(`document.querySelector('#inkbar [data-tool="select"]')?.click()`); await espera(200);
  await tocar(200, 200); await espera(300);
  conferir('com um número selecionado, a barra da seleção mostra "Números"', await avaliar(`!document.querySelector('#selbar [data-sel="numero"]').hidden`));
  await avaliar(`document.querySelector('#selbar [data-sel="numero"]').click()`); await espera(300);
  await clicarPop('[data-tam="P"]'); await espera(300);
  c = (await carimbos()).find(c => c.n === 1 && !c.l && c.y < 300 && c.x < 260);
  conferir('o selecionado muda para P (no mesmo centro)', c?.t === 'P' && c.w === 32 && Math.abs(c.x - 200) <= 1, JSON.stringify(c));

  console.log('No desenho da página (PDF e miniatura)');
  const cor = await avaliar(`(async () => { const PG = await import('/js/pages.js'); const c = await PG.renderPage(window.__lousa.S.board.items ? window.__lousa.S.board : { ...window.__lousa.S.board, items: window.__lousa.S.items }, 0, 1);
    const b = { ...window.__lousa.S.board, items: window.__lousa.S.items }; const d = await PG.renderPage(b, 0, 1);
    const it = window.__lousa.S.items.find(i => i.carimbo && i.carimbo.tam === 'GG'); const px = d.getContext('2d').getImageData(Math.round(it.x + 3), Math.round(it.y + it.h / 2), 1, 1).data; return [...px].join(','); })()`);
  conferir('o carimbo sai no desenho da página (a borda verde)', /^\d+,1[0-4]\d,\d+,255$/.test(cor) && cor !== '255,255,255,255', cor);
  console.log('Esconder da barra fixa');
  await avaliar(`document.getElementById('tTools')?.click()`); await espera(300);
  await clicarPop('[data-mostra="numero"]'); await espera(300);
  conferir('Ferramentas → Na barra fixa: Números some da barra (e continua no menu)', !(await avaliar(`!!document.querySelector('#teachbar [data-k="numero"]')`)) && await avaliar(`!!document.querySelector('#pop [data-k="numero"]')`));
  await clicarPop('[data-mostra="numero"]'); await espera(300);
  conferir('e volta', await avaliar(`!!document.querySelector('#teachbar [data-k="numero"]')`));
  await tecla('Escape', 'Escape', 27);
  console.log('Sem a barra fixa (instalação nova)');
  await avaliar(`document.getElementById('tTools').click()`); await espera(300);
  await clicarPop('[data-fechar]'); await espera(400);
  conferir('barra fixa fechada', !(await avaliar(`!!document.querySelector('#teachbar:not([hidden]) [data-k="numero"]')`)));
  await tecla('Escape', 'Escape', 27); await avaliar(`document.getElementById('pop').hidden = true`);
  await tecla('u', 'KeyU', 85); await espera(200);
  await tecla('u', 'KeyU', 85); await espera(400);
  conferir('U com Números ativo abre o estilo', (await pop()).includes('Tamanho') && (await pop()).includes('Formato'), await pop());
  await tecla('Escape', 'Escape', 27); await avaliar(`document.getElementById('pop').hidden = true`); await espera(200);
  await avaliar(`document.getElementById('tTools').click()`); await espera(300);
  await clicarPop('[data-k="numero"]'); await espera(400);
  conferir('menu Ferramentas → Números, com a ferramenta ativa, abre o estilo (não desliga)', (await pop()).includes('Formato') && await avaliar(`document.querySelector('[data-a="recomecar"]') !== null`), await pop());
  await tecla('Escape', 'Escape', 27);
  conferir('nenhum erro na página', !erros.length, erros.join(' | '));
} catch (e) {
  falhas++; console.log('  ✗ parou:', e.message);
} finally {
  for (const p of procs) { try { p.kill(); } catch {} }
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
