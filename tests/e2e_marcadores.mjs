// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Marcadores (P65) pelo navegador, com cliques e teclas de verdade: Ctrl+M abre o cartão, grupo novo, Marcar; a
// fitinha aparece e leva ao ponto; na apresentação as fitinhas somem e a lista da mini-bandeja leva ao ponto; a aba
// Marcadores da galeria lista, busca, renomeia, muda de grupo arrastando, apaga com Desfazer e abre no ponto; e a
// galeria mudando um marcador com o quadro aberto não é desfeita pelo salvamento do editor.
// Edge sem janela, servidor com dados temporários; nada abre na tela.
//   node tests/e2e_marcadores.mjs
//   node tests/e2e_marcadores.mjs --raiz <pasta de outra versão> --versao-antiga
//     (só confere que o editor daquela versão salva o quadro sem perder o campo "marcadores")
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigo, entrarNoNavegador } from './acesso.mjs';
import { pastaTemporaria, pastaDeEvidencia } from './temporario.mjs';
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const iR = args.indexOf('--raiz');
const RAIZ = iR >= 0 ? resolve(args[iR + 1]) : join(dirname(fileURLToPath(import.meta.url)), '..');
const ANTIGA = args.includes('--versao-antiga');
// capturas da tela sem janela (cartão, fitinhas e aba da galeria), para conferir o desenho
const EVID = ANTIGA ? null : pastaDeEvidencia('e2e_marcadores');
const captura = async nome => { if (!EVID) return; await avaliar(`document.querySelector('[data-p]')?.click()`);   // o tour do perfil novo cobriria a tela
  const { data } = await cdp('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(EVID, nome + '.png'), Buffer.from(data, 'base64')); };
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };

const tmp = pastaTemporaria('giz-marc-'), DADOS = join(tmp, 'dados');
mkdirSync(DADOS, { recursive: true });
const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
let servidor, nav, ws, n = 0, token = '';
const pend = new Map(), erros = [];
const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { pend.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
    setTimeout(() => { if (pend.delete(id)) rej(new Error('sem resposta: ' + method)); }, 30000); }); };
const avaliar = async e => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result?.value; };
const ate = async (e, ms = 15000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await avaliar(e).catch(() => false)) return true; await espera(100); } return false; };
const tecla = async (key, code, vk, modifiers = 0) => { await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, modifiers });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, modifiers }); };
const digitar = t => cdp('Input.insertText', { text: t });
const mouse = (type, x, y) => cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
const clicar = sel => avaliar(`document.querySelector(${JSON.stringify(sel)}).click()`);
const api = async (metodo, rota, corpo) => { const r = await fetch(BASE + rota, { method: metodo, headers: { 'X-Lousa': token, 'Content-Type': 'application/json' },
  body: corpo ? JSON.stringify(corpo) : undefined }); return { status: r.status, corpo: await r.json().catch(() => null) }; };
// confere que a vista está no ponto marcado (centro na tela, mesma largura vista)
const noPonto = (mk) => avaliar(`(() => { const v = window.__lousa.S.view, c = document.getElementById('cv'), m = ${JSON.stringify(mk)};
  return Math.abs(m.cx * v.zoom + v.x - c.clientWidth / 2) < 3 && Math.abs(m.cy * v.zoom + v.y - c.clientHeight / 2) < 3 && Math.abs(c.clientWidth / v.zoom - m.w) < 2; })()`);

const L = { mode: 'pages', kind: 's169', w: 1280, h: 720, gap: 48, count: 4 };
const QUADRO = { version: 2, title: 'Termoquímica 2026', background: { color: '#ffffff', pattern: 'none' }, layout: L, view: null,
  items: [{ id: 't1', type: 'text', x: 80, y: 900, w: 400, text: 'Lei de Hess', color: '#000', size: 32 }] };

try {
  servidor = spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' });
  for (let t = 0; t < 100 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(100); } }
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

  if (ANTIGA) {
    // a versão antiga abre um quadro com marcadores, o professor escreve, ela salva: o campo tem de continuar lá
    const mk = [{ id: 'mk1', nome: 'Lei de Hess', cx: 640, cy: 1128, w: 1280, grupo: 'g1', grupoNome: 'Termoquímica', cor: '#c50f1f' }];
    const g = await api('PUT', '/api/boards/antigo', { board: { ...QUADRO, marcadores: mk }, revision: 0 });
    conferir('quadro com marcadores gravado na versão antiga', g.status === 200, JSON.stringify(g.corpo));
    await cdp('Page.navigate', { url: `${BASE}/#/b/antigo` });
    conferir('editor da versão antiga abriu', await ate('window.__lousa?.S?.id === "antigo"', 30000));
    await espera(800);
    await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);
    await mouse('mousePressed', 600, 400); for (let i = 1; i <= 8; i++) await mouse('mouseMoved', 600 + i * 15, 400 + i * 4); await mouse('mouseReleased', 720, 432);
    await ate(`document.getElementById('bStatus').textContent === 'Salvo'`, 15000); await espera(500);
    const arq = JSON.parse(readFileSync(join(DADOS, 'antigo.json'), 'utf8'));
    conferir('a versão antiga salvou o traço', arq.items.some(i => i.type === 'stroke'));
    conferir('e manteve o campo "marcadores"', JSON.stringify(arq.marcadores) === JSON.stringify(mk), JSON.stringify(arq.marcadores));
    throw null;   // fim deste modo
  }

  conferir('quadro de teste criado', (await api('PUT', '/api/boards/termo', { board: QUADRO, revision: 0, criar: true })).status === 200);
  await cdp('Page.navigate', { url: `${BASE}/#/b/termo` });
  conferir('editor abriu', await ate('window.__lousa?.S?.id === "termo"', 30000));
  await espera(800);
  await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);
  conferir('botão Marcar à vista na barra de cima', await avaliar(`(() => { const b = document.getElementById('tMarcar'); return !!b && b.offsetWidth > 0 && /Marcar/.test(b.textContent); })()`));
  // vai à página 2 e marca com Ctrl+M
  await tecla('PageDown', 'PageDown', 34); await espera(500);
  await avaliar('document.activeElement?.blur()');
  await tecla('m', 'KeyM', 77, 2); await espera(500);
  const cartao = await avaliar(`(() => { const p = document.getElementById('pop'); return { aberto: !p.hidden && !!p.querySelector('.mk-cartao'), nome: p.querySelector('.mk-nome')?.value }; })()`);
  conferir('Ctrl+M abre o cartão com o nome sugerido (Página 2)', cartao.aberto && cartao.nome === 'Página 2', JSON.stringify(cartao));
  await avaliar(`document.querySelector('#pop [data-g="+"]').click()`); await espera(150);
  await avaliar(`document.querySelector('#pop .mk-novo').focus()`); await digitar('Termoquímica'); await tecla('Enter', 'Enter', 13); await espera(150);
  await avaliar(`(() => { const i = document.querySelector('#pop .mk-nome'); i.focus(); i.select(); })()`); await digitar('Lei de Hess: exemplo 2');
  await captura('1-cartao-de-marcar');
  const vistaMarcada = await avaliar(`(() => { const v = window.__lousa.S.view, c = document.getElementById('cv'); return { cx: (c.clientWidth / 2 - v.x) / v.zoom, cy: (c.clientHeight / 2 - v.y) / v.zoom, w: c.clientWidth / v.zoom }; })()`);
  await tecla('Enter', 'Enter', 13);
  await ate(`(window.__lousa.S.board.marcadores || []).length === 1`, 10000);
  const mk = await avaliar('window.__lousa.S.board.marcadores[0]');
  conferir('marcador criado com o nome, o grupo novo, a página e o ponto', mk?.nome === 'Lei de Hess: exemplo 2' && mk.grupoNome === 'Termoquímica' && mk.pagina === 2
    && Math.abs(mk.cx - vistaMarcada.cx) < 1 && Math.abs(mk.w - vistaMarcada.w) < 1, JSON.stringify(mk));
  conferir('com miniatura do ponto', /^\/assets\/[0-9a-f]{40}\.png$/.test(mk?.mini || ''));
  const fita = await avaliar(`(() => { const f = document.querySelector('#fitas .fita'); return f && { vis: !document.getElementById('fitas').hidden && f.offsetWidth > 0, dica: f.textContent.trim(), cor: getComputedStyle(f).backgroundColor }; })()`);
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1590, y: await avaliar(`(() => { const r = document.querySelector('#fitas .fita').getBoundingClientRect(); return r.top + r.height / 2; })()`) });
  await espera(200); await captura('2-fitinha-com-o-nome');
  conferir('a fitinha aparece na borda, com o nome e a cor do grupo', fita?.vis && fita.dica === 'Lei de Hess: exemplo 2 · Termoquímica' && fita.cor === 'rgb(197, 15, 31)', JSON.stringify(fita));

  // a fitinha leva ao ponto, com o voo
  await tecla('Home', 'Home', 36); await avaliar(`(() => { const S = window.__lousa.S; S.view = { ...S.view, x: S.view.x + 300, y: S.view.y + 2000, zoom: S.view.zoom * 0.5 }; })()`);
  await clicar('#fitas .fita'); await espera(250);
  const noMeio = await noPonto(mk);
  await espera(500);
  conferir('tocar na fitinha voa até o ponto (com animação, não um salto)', !noMeio && await noPonto(mk));

  // apresentação: fitinhas escondidas; Marcar e a lista na mini-bandeja
  await clicar('#bPresent'); await espera(1000);
  conferir('na apresentação, as fitinhas somem da tela', await avaliar(`(() => { const f = document.getElementById('fitas'); return f.hidden || getComputedStyle(f).display === 'none'; })()`));
  conferir('Marcar e a lista de marcadores na mini-bandeja', await avaliar(`['ppMarcar', 'ppMarcadores'].every(id => document.getElementById(id)?.offsetWidth > 0)`));
  await tecla('PageDown', 'PageDown', 34); await espera(500);
  await clicar('#ppMarcadores'); await espera(200);
  await avaliar(`document.querySelector('#pop .mk-lista [data-mk]').click()`); await espera(700);
  conferir('a lista da mini-bandeja leva ao ponto marcado', await noPonto(mk));
  // sai pelo botão da mini-bandeja: com a tela cheia ligada, o Esc simulado não chega à página (o de verdade sai da
  // tela cheia, e o programa sai junto da apresentação)
  await clicar('#ppExit'); await espera(700);
  conferir('ao sair da apresentação, as fitinhas voltam', await avaliar(`!document.getElementById('fitas').hidden`),
    await avaliar(`JSON.stringify({ present: document.getElementById('board').classList.contains('present'), n: (window.__lousa.S.board.marcadores || []).length, pop: !document.getElementById('pop').hidden })`));

  // a galeria muda o marcador com o quadro aberto; o editor salva a cópia antiga e não desfaz
  await api('POST', '/api/marcadores', { alterar: [{ quadro: 'termo', id: mk.id, nome: 'Nome dado na galeria' }] });
  await avaliar('document.activeElement?.blur()');
  await mouse('mousePressed', 500, 500); for (let i = 1; i <= 8; i++) await mouse('mouseMoved', 500 + i * 15, 500); await mouse('mouseReleased', 620, 500);
  await ate(`document.getElementById('bStatus').textContent === 'Salvo'`, 15000); await espera(300);
  const lista = (await api('GET', '/api/marcadores')).corpo.marcadores;
  conferir('salvar o quadro aberto não desfaz o nome dado na galeria', lista[0]?.nome === 'Nome dado na galeria', JSON.stringify(lista.map(m => m.nome)));
  conferir('e a fitinha do editor recebe o nome novo', await ate(`document.querySelector('#fitas .fita')?.textContent.includes('Nome dado na galeria')`, 5000));

  // um segundo marcador, sem grupo, pela API (outro quadro): a aba mostra os de todos os quadros
  await api('PUT', '/api/boards/outro', { board: { ...QUADRO, title: 'Revisão P1' }, revision: 0, criar: true });
  await api('POST', '/api/marcadores', { novos: [{ quadro: 'outro', marcador: { id: 'mk2', nome: 'Questão 3', cx: 640, cy: 360, w: 1280, criado: Date.now() } }] });

  // galeria: aba Marcadores
  await cdp('Page.navigate', { url: `${BASE}/#/` }); await ate(`!document.getElementById('gallery').hidden`, 15000); await espera(500);
  await espera(400); await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);   // perfil novo: a escolha das áreas
  conferir('aba Marcadores com a contagem', await ate(`document.getElementById('gMkN').textContent === '2'`, 5000));
  await clicar('#gAbaMarcadores'); await ate(`document.querySelectorAll('.mk-card').length === 2`, 10000);
  const sec = await avaliar(`[...document.querySelectorAll('.mk-grupo')].map(s => s.querySelector('.mk-ghead').textContent.trim().split('\\n')[0] + ':' + s.querySelectorAll('.mk-card').length)`);
  await espera(300); await captura('3-aba-marcadores');
  conferir('grupos em seções, com os marcadores de todos os quadros', JSON.stringify(sec) === JSON.stringify(['Termoquímica 1 marcador:1', 'Sem grupo 1 marcador:1']), JSON.stringify(sec));
  conferir('cartão com miniatura, nome, quadro e página', await avaliar(`(() => { const c = document.querySelector('.mk-card[data-q="termo"]'); return !!c.querySelector('img.mk-mini') && /Nome dado na galeria/.test(c.textContent) && /Termoquímica 2026 · pág\\. 2/.test(c.textContent); })()`));
  await avaliar(`(() => { const i = document.getElementById('gSearch'); i.value = 'questao'; i.dispatchEvent(new Event('input')); })()`); await espera(200);
  conferir('busca sem acento acha o marcador', await avaliar(`[...document.querySelectorAll('.mk-card')].map(c => c.dataset.mk).join()`) === 'mk2');
  await avaliar(`(() => { const i = document.getElementById('gSearch'); i.value = ''; i.dispatchEvent(new Event('input')); })()`); await espera(200);
  // renomear pelo cartão
  await avaliar(`document.querySelector('.mk-card[data-mk="mk2"] [data-a="nome"]').click()`); await ate(`!!document.querySelector('dialog[open] input')`, 5000);
  await avaliar(`(() => { const d = document.querySelector('dialog[open]'); d.querySelector('input').value = 'Questão 3: onde a turma errou'; d.querySelector('[data-a="1"]').click(); })()`);
  conferir('renomear pelo cartão', await ate(`document.querySelector('.mk-card[data-mk="mk2"]')?.textContent.includes('onde a turma errou')`, 5000));
  // arrastar o sem grupo para o grupo Termoquímica, antes do outro
  await avaliar(`(() => { const dt = new DataTransfer(), c = document.querySelector('.mk-card[data-mk="mk2"]'), alvo = document.querySelector('.mk-card[data-q="termo"]');
    c.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
    alvo.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true }));
    alvo.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    c.dispatchEvent(new DragEvent('dragend', { dataTransfer: dt, bubbles: true })); })()`);
  await ate(`document.querySelectorAll('.mk-grupo').length === 1`, 5000);
  const ordem = await avaliar(`[...document.querySelectorAll('.mk-grupo .mk-card')].map(c => c.dataset.mk).join()`);
  conferir('arrastar leva para o grupo e põe antes do cartão de destino', ordem === `mk2,${mk.id}`, ordem);
  // apagar com Desfazer
  await avaliar(`document.querySelector('.mk-card[data-mk="mk2"] [data-a="apagar"]').click()`);
  await ate(`document.querySelectorAll('.mk-card').length === 1`, 5000);
  conferir('apagar tira o marcador', (await api('GET', '/api/marcadores')).corpo.marcadores.length === 1);
  await avaliar(`document.querySelector('#toast .toast-btn').click()`);
  conferir('Desfazer devolve o marcador', await ate(`document.querySelectorAll('.mk-card').length === 2`, 5000));
  // abrir pelo cartão: o quadro abre e voa até o ponto
  await avaliar(`document.querySelector('.mk-card[data-q="termo"]').click()`);
  conferir('o cartão abre o quadro', await ate('window.__lousa?.S?.id === "termo"', 15000));
  await espera(900);
  conferir('e voa até o ponto marcado', await noPonto(mk));
  conferir('nenhum erro na página', erros.length === 0, erros.slice(0, 3).join(' | '));
} catch (e) { if (e) { falhas++; console.log('  ✗ parou: ' + e.message); } }
finally {
  try { await fetch(BASE + '/api/sair', { method: 'POST' }); } catch {}
  try { nav?.kill(); } catch {} try { servidor?.kill(); } catch {}
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
