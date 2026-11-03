// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Barra da apresentação e marca-texto pelo navegador (retorno da aula de 03/11/2026, P64 c a g), com cliques e teclas
// de verdade: folha em branco à vista (N), cor e espessura no mesmo botão, formas em três grupos (setas, formas,
// cota), marca-texto com intensidade e reto com Shift, setas que andam pouco com o quadro ampliado.
// Edge sem janela, servidor com dados temporários; nada abre na tela.
//   node tests/e2e_barra_apresentacao.mjs
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigo, entrarNoNavegador } from './acesso.mjs';
import { pastaTemporaria } from './temporario.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };

const tmp = pastaTemporaria('giz-barra-'), DADOS = join(tmp, 'dados');
const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
let servidor, nav, ws, n = 0;
const pend = new Map(), erros = [];
const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { pend.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
    setTimeout(() => { if (pend.delete(id)) rej(new Error('sem resposta: ' + method)); }, 30000); }); };
const avaliar = async e => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result?.value; };
const ate = async (e, ms = 15000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await avaliar(e).catch(() => false)) return true; await espera(100); } return false; };
const tecla = async (key, code, vk, modifiers = 0) => { await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, modifiers });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, modifiers }); };
const mouse = (type, x, y, modifiers = 0) => cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, modifiers });
const clicar = sel => avaliar(`document.querySelector(${JSON.stringify(sel)}).click()`);

try {
  const { mkdirSync } = await import('node:fs'); mkdirSync(DADOS, { recursive: true });
  servidor = spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' });
  let token = ''; for (let t = 0; t < 100 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(100); } }
  const pc = await portaLivre();
  nav = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${pc}`, `--user-data-dir=${join(tmp, 'perfil')}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1600,900', 'about:blank'], { stdio: 'ignore' });
  let alvo; for (let t = 0; t < 100 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${pc}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); } }
  ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.id) { const f = pend.get(m.id); if (typeof f === 'function') f(m); pend.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await entrarNoNavegador(cdp, BASE, token);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
  // quadro de 3 slides em branco
  const L = { mode: 'pages', kind: 's169', w: 1280, h: 720, gap: 48, count: 3 };
  const g = await fetch(`${BASE}/api/boards/barra`, { method: 'PUT', headers: { 'X-Lousa': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: { version: 2, title: 'Barra', background: { color: '#ffffff', pattern: 'none' }, layout: L, view: null, items: [] }, revision: 0, criar: true }) });
  conferir('quadro de teste criado', g.ok);
  await cdp('Page.navigate', { url: `${BASE}/#/b/barra` });
  conferir('editor abriu', await ate('window.__lousa?.S?.id === "barra"', 30000));
  await espera(800);
  await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);

  // h) imagem no rascunho: botão próprio na barra do rascunho; a imagem entra na camada do rascunho
  const { writeFileSync } = await import('node:fs');
  const PNG = join(tmp, 'figura.png');
  writeFileSync(PNG, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAF0lEQVR4nGP8z8BAEmAiTfmohlENVNMAAEq8AR/Cv3C0AAAAAElFTkSuQmCC', 'base64'));
  await clicar('#tRascunho'); await espera(300);
  const temBotao = await avaliar(`!!document.querySelector('#rascbar [data-r="imagem"]')`);
  conferir('barra do rascunho tem o botão Imagem', temBotao);
  if (temBotao) {
    await clicar('#rascbar [data-r="imagem"]');
    const { root } = await cdp('DOM.getDocument', { depth: 1 });
    const { nodeId } = await cdp('DOM.querySelector', { nodeId: root.nodeId, selector: '#imgFile' });
    const n1 = await avaliar('window.__lousa.S.items.length');
    await cdp('DOM.setFileInputFiles', { nodeId, files: [PNG] });
    await ate(`window.__lousa.S.items.length === ${n1 + 1}`, 10000);
    const im = await avaliar('window.__lousa.S.items.at(-1)');
    conferir('a imagem entrou no rascunho', im?.type === 'image' && im?.camada === 'rascunho', JSON.stringify(im && { type: im.type, camada: im.camada }));
    // a imagem comum (botão da barra Inserir) continua fora do rascunho
    await cdp('DOM.setFileInputFiles', { nodeId, files: [PNG] });
    await ate(`window.__lousa.S.items.length === ${n1 + 2}`, 10000);
    conferir('a imagem comum fica no quadro', !(await avaliar('window.__lousa.S.items.at(-1)'))?.camada);
  }

  // P61 C) Ctrl+V cola onde a caneta tocou por último (texto e imagem); se o ponto saiu da tela, no centro
  await avaliar('document.activeElement?.blur()');
  const colar = (tipo) => avaliar(`(async () => { const dt = new DataTransfer();
    if (${JSON.stringify(tipo)} === 'texto') dt.setData('text/plain', 'Equilíbrio');
    else { const b = await (await fetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAF0lEQVR4nGP8z8BAEmAiTfmohlENVNMAAEq8AR/Cv3C0AAAAAElFTkSuQmCC')).blob(); dt.items.add(new File([b], 'f.png', { type: 'image/png' })); }
    document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true })); })()`);
  await mouse('mousePressed', 400, 300); await mouse('mouseReleased', 400, 300); await espera(200);
  const alvoColar = await avaliar(`(() => { const v = window.__lousa.S.view; return { x: (400 - v.x) / v.zoom, y: (300 - v.y) / v.zoom }; })()`);
  const nc = await avaliar('window.__lousa.S.items.length');
  await colar('texto'); await ate(`window.__lousa.S.items.length > ${nc}`, 5000);
  const tx = await avaliar('window.__lousa.S.items.at(-1)');
  conferir('texto colado onde a caneta tocou', tx?.type === 'text' && Math.abs(tx.x - alvoColar.x) < 2 && Math.abs(tx.y - alvoColar.y) < 2, JSON.stringify(tx && { x: tx.x, y: tx.y, alvo: alvoColar }));
  await colar('imagem'); await ate(`window.__lousa.S.items.length > ${nc + 1}`, 10000);
  const ic = await avaliar('window.__lousa.S.items.at(-1)');
  conferir('imagem colada com o canto onde a caneta tocou', ic?.type === 'image' && Math.abs(ic.x - alvoColar.x) < 2 && Math.abs(ic.y - alvoColar.y) < 2, JSON.stringify(ic && { x: ic.x, y: ic.y }));
  await avaliar(`(() => { const S = window.__lousa.S; S.view = { ...S.view, x: S.view.x - 5000 }; })()`);   // rolou: o ponto saiu da tela
  await colar('texto'); await ate(`window.__lousa.S.items.length > ${nc + 2}`, 5000);
  const centro = await avaliar(`(() => { const S = window.__lousa.S, v = S.view, t = S.items.at(-1), c = document.getElementById('cv');
    return { dx: Math.abs(t.x - (c.clientWidth / 2 - v.x) / v.zoom), dy: Math.abs(t.y - (c.clientHeight / 2 - v.y) / v.zoom) }; })()`);
  conferir('ponto fora da tela: cola no centro', centro.dx < 2 && centro.dy < 2, JSON.stringify(centro));
  await avaliar(`(() => { const S = window.__lousa.S; S.view = { ...S.view, x: S.view.x + 5000 }; })()`);

  // P61 A) esconder até a aula: o texto colado some e o botão Revelar (1) aparece
  const idEsc = tx?.id;
  await avaliar(`(() => { const s = window.__lousa.sel; s.clear(); s.add(${JSON.stringify(idEsc)}); })()`);
  await clicar('#selbar [data-sel="esconder"]'); await espera(200);
  const esc = await avaliar(`(() => { const it = window.__lousa.S.items.find(i => i.id === ${JSON.stringify(idEsc)}), b = document.getElementById('tRevelar');
    return { revelar: it?.revelar, botao: !b.hidden && b.textContent.trim(), sel: window.__lousa.sel.size }; })()`);
  conferir('escondido até a aula, com o botão Revelar (1)', esc.revelar === 1 && esc.botao === 'Revelar (1)' && esc.sel === 0, JSON.stringify(esc));

  // c) setas fora da apresentação: com o quadro ampliado, o passo é pequeno (sem seleção: com ela, as setas a movem)
  await avaliar('document.activeElement?.blur()');   // o seletor de arquivo ficava com o foco e o editor ignora a tecla
  await avaliar('window.__lousa.sel.clear()');
  await avaliar(`(() => { const S = window.__lousa.S; S.view = { ...S.view, zoom: 4 }; })()`);
  const x0 = await avaliar('window.__lousa.S.view.x');
  await tecla('ArrowRight', 'ArrowRight', 39);
  const dx = Math.abs(await avaliar('window.__lousa.S.view.x') - x0);
  const estado = await avaliar(`JSON.stringify({ sel: window.__lousa.sel.size, foco: document.activeElement?.tagName + '#' + document.activeElement?.id, dialogo: !!document.querySelector('dialog[open]'), pop: !document.getElementById('pop').hidden })`);
  conferir('seta com zoom 4: anda pouco (menos de 5% da tela)', dx > 0 && dx < 0.05 * 900, `${dx.toFixed(1)} px ${estado}`);

  // apresentação
  await clicar('#bPresent'); await espera(1000);
  conferir('apresentação ligada', await avaliar(`document.getElementById('board').classList.contains('present')`));

  // d) folha em branco: botão à vista, com a tecla N na dica, e funcionando
  const blank = await avaliar(`(() => { const b = document.getElementById('ppBlank'); return { vis: !b.hidden && b.offsetWidth > 0, txt: b.textContent.trim(), dica: b.title }; })()`);
  conferir('botão Folha à vista com texto e a dica (N)', blank.vis && /Folha/.test(blank.txt) && /\(N\)/.test(blank.dica), JSON.stringify(blank));
  const p0 = await avaliar('window.__lousa.S.board.layout.count');
  await clicar('#ppBlank'); await espera(400);
  conferir('o botão Folha põe uma página', await avaliar('window.__lousa.S.board.layout.count') === p0 + 1);
  await tecla('n', 'KeyN', 78); await espera(400);
  conferir('a tecla N também', await avaliar('window.__lousa.S.board.layout.count') === p0 + 2);

  // e) cor e espessura no mesmo botão
  conferir('sem botão de espessura separado', await avaliar(`!document.getElementById('ppWidth')`));
  await clicar('#ppColor'); await espera(300);
  const pop = await avaliar(`(() => { const p = document.getElementById('pop'); return { aberto: !p.hidden, cores: p.querySelectorAll('[data-c]').length, larg: p.querySelectorAll('[data-w]').length }; })()`);
  conferir('a janelinha da cor tem cores e espessuras', pop.aberto && pop.cores > 3 && pop.larg > 3, JSON.stringify(pop));
  const w0 = await avaliar(`window.__lousa.S && JSON.parse(localStorage.getItem('lousa.cfg') || '{}')?.tools?.pen0?.width`);
  await avaliar(`[...document.querySelectorAll('#pop [data-w]')].at(-1).click()`); await espera(200);
  conferir('escolher a espessura ali não fecha a janelinha (dá para trocar a cor em seguida)', await avaliar(`!document.getElementById('pop').hidden`));
  await tecla('Escape', 'Escape', 27); await espera(200);
  if (!(await avaliar(`document.getElementById('board').classList.contains('present')`))) { await clicar('#bPresent'); await espera(800); }

  // g) formas em três grupos
  for (const [id, k] of [['ppSetas', 'arrow'], ['ppFormas', 'rect'], ['ppCotas', 'cota']]) {
    await avaliar(`document.getElementById('pop').hidden = true`);
    await clicar('#' + id); await espera(200);
    const st = await avaliar(`(() => { const b = document.getElementById(${JSON.stringify(id)}); return { vis: b.offsetWidth > 0, ativo: b.classList.contains('active'), k: b.dataset.k }; })()`);
    conferir(`botão ${id} à vista e ativa ${k}`, st.vis && st.ativo && st.k === k, JSON.stringify(st));
  }
  // a cota desenhada vira forma com as chamadas
  const n0 = await avaliar('window.__lousa.S.items.length');
  await mouse('mousePressed', 500, 450); for (let i = 1; i <= 10; i++) await mouse('mouseMoved', 500 + i * 30, 450); await mouse('mouseReleased', 800, 450);
  await espera(300);
  const cota = await avaliar('window.__lousa.S.items.at(-1)');
  conferir('cota desenhada no quadro', (await avaliar('window.__lousa.S.items.length')) === n0 + 1 && cota?.cota === true && cota?.both === true, JSON.stringify(cota));

  // f) marca-texto: intensidade na janelinha e Shift reto
  await avaliar(`document.getElementById('pop').hidden = true`);
  await clicar('#presentbar [data-pt="highlighter"]'); await espera(200);
  await clicar('#ppColor'); await espera(300);
  conferir('marca-texto: a janelinha tem a intensidade', await avaliar(`document.querySelectorAll('#pop [data-op]').length`) === 3);
  await avaliar(`document.querySelector('#pop [data-op="0.6"]').click()`); await espera(200);
  await avaliar(`document.getElementById('pop').hidden = true`);
  await mouse('mousePressed', 300, 300, 8);
  for (let i = 1; i <= 15; i++) await mouse('mouseMoved', 300 + i * 20, 300 + (i % 2 ? 25 : -25), 8);
  await mouse('mouseReleased', 600, 320, 8); await espera(300);
  const hl = await avaliar('window.__lousa.S.items.at(-1)');
  conferir('traço do marca-texto com a intensidade escolhida', hl?.tool === 'highlighter' && Math.abs(hl.op - 0.6) < 1e-9, JSON.stringify(hl && { op: hl.op, tool: hl.tool }));
  conferir('com Shift, o marca-texto sai reto (dois pontos)', hl?.pts?.length === 6, `${hl?.pts?.length / 3} pontos`);
  // P61 A) na apresentação: o botão Revelar está na mini-bandeja, e a tecla R revela o escondido
  conferir('Revelar (1) na mini-bandeja', await avaliar(`(() => { const b = document.getElementById('ppRevelar'); return !b.hidden && b.offsetWidth > 0 && b.textContent.trim() === 'Revelar (1)'; })()`));
  await avaliar('document.activeElement?.blur()');
  await tecla('r', 'KeyR', 82); await espera(200);
  const rev = await avaliar(`(() => { const it = window.__lousa.S.items.find(i => i.id === ${JSON.stringify(idEsc)}); return { campo: it && 'revelar' in it, botao: document.getElementById('ppRevelar').hidden }; })()`);
  conferir('a tecla R revela, e o botão some quando não há mais nada', rev.campo === false && rev.botao === true, JSON.stringify(rev));
  // P61 B) roteiro de paradas: fora da apresentação, ◀ ▶ na barra de zoom vão de imagem em imagem; uma escondida
  // até a aula é revelada ao chegar nela
  await tecla('Escape', 'Escape', 27); await espera(700);
  await avaliar(`(() => { const s = window.__lousa.sel; s.clear(); s.add(${JSON.stringify(ic?.id)}); })()`);
  await clicar('#selbar [data-sel="esconder"]'); await espera(200);
  const nPar = await avaliar(`window.__lousa.S.items.filter(i => i.type === 'image' && !i.locked && i.camada !== 'rascunho').length`);
  conferir('barra de zoom mostra o roteiro', await avaliar(`(() => { const b = document.getElementById('zParadas'); return !b.hidden && b.offsetWidth > 0; })()`));
  let chegou = false;
  for (let k = 0; k < nPar && !chegou; k++) {
    await clicar('#zParProx'); await espera(500);
    const it = await avaliar(`window.__lousa.S.items.find(i => i.id === ${JSON.stringify(ic?.id)})`);
    if (it && !('revelar' in it)) {
      const meio = await avaliar(`(() => { const v = window.__lousa.S.view, it = window.__lousa.S.items.find(i => i.id === ${JSON.stringify(ic?.id)}), c = document.getElementById('cv');
        return { dx: Math.abs((it.x + it.w / 2) * v.zoom + v.x - c.clientWidth / 2), dy: Math.abs((it.y + it.h / 2) * v.zoom + v.y - c.clientHeight / 2) }; })()`);
      chegou = meio.dx < 3 && meio.dy < 3;
      conferir('a parada escondida é revelada ao chegar, com a vista nela', chegou, JSON.stringify(meio));
    }
  }
  if (!chegou) conferir('a parada escondida é revelada ao chegar', false, `${nPar} paradas percorridas`);
  conferir('rótulo "Parada n de m"', /^Parada \d+ de \d+$/.test(await avaliar(`document.getElementById('zParLbl').textContent`)));
  conferir('nenhum erro na página', erros.length === 0, erros.slice(0, 3).join(' | '));
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally {
  try { await fetch(BASE + '/api/sair', { method: 'POST' }); } catch {}
  try { nav?.kill(); } catch {} try { servidor?.kill(); } catch {}
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
