// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Teste de carga com apresentações grandes (sem dependências). Mede importação, abertura, troca de página, rolagem,
// apresentação, caneta, gravação e reabertura em quadros de vários tamanhos.
// Rodar:  node tests/carga_slides.mjs --deck A.pptx [--deck B.pdf ...] [--tamanhos 50,100,200,400] [--lento] [--visivel] [--manter]
// Sobe um servidor do Giz Livre numa porta livre com dados temporários (nunca a 8765 do instalado nem a 8799 do
// navegador de teste), importa os arquivos pela própria galeria (Edge sem janela, protocolo de depuração), monta
// quadros de N slides com as imagens importadas e mede tudo. Fecha o servidor por /api/sair. Resultado em JSON e
// texto na pasta indicada no fim.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, mkdirSync, statSync, copyFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opc = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const DECKS = args.flatMap((a, i) => args[i - 1] === '--deck' ? [a] : []);
const TAMANHOS = (opc('--tamanhos') || '50,100,200,400').split(',').map(Number);
const VISIVEL = args.includes('--visivel'), MANTER = args.includes('--manter'), LENTO = args.includes('--lento');
const LARG = 1920, ALT = 1080;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));
const MBf = b => +(b / 1048576).toFixed(1);
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);

function portaLivre() {
  return new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
}

const pastaTmp = mkdtempSync(join(tmpdir(), 'giz-carga-'));
const DADOS = join(pastaTmp, 'dados'), SAIDA = join(pastaTmp, 'saida');
mkdirSync(DADOS); mkdirSync(SAIDA);
const PORTA = await portaLivre();
const BASE = `http://127.0.0.1:${PORTA}`;
const R = { inicio: new Date().toISOString(), porta: PORTA, janela: VISIVEL ? 'visível' : 'sem janela (headless)', lento: LENTO, tela: `${LARG}x${ALT}`, importacoes: [], quadros: [] };
let servidor, edge, token, amostrador;

// ---------------- memória ----------------
const PS = join(RAIZ, 'tests', 'carga_memoria.ps1');
const ARQ_AMOSTRAS = join(SAIDA, 'memoria.jsonl');
function memoria() {
  const r = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS, '-Edge', String(edge?.pid || 0), '-Servidor', String(servidor.pid)], { encoding: 'utf8' });
  try { const m = JSON.parse(r.stdout.trim()); return { edgeMB: MBf(m.edgePriv), edgeWSMB: MBf(m.edgeWS), edgeProc: m.edgeN, servidorMB: MBf(m.srvPriv), pptMB: MBf(m.pptPriv), loMB: MBf(m.loPriv) }; }
  catch { return { erro: r.stderr || r.stdout }; }
}
function picos(t0, t1) {
  if (!existsSync(ARQ_AMOSTRAS)) return null;
  const a = readFileSync(ARQ_AMOSTRAS, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l.replace(/^\uFEFF/, '')); } catch { return null; } })
    .filter(m => m && m.t >= t0 - 500 && m.t <= t1 + 500);
  if (!a.length) return null;
  const mx = k => MBf(Math.max(...a.map(m => m[k] || 0)));
  return { edgeMB: mx('edgePriv'), servidorMB: mx('srvPriv'), pptMB: mx('pptPriv'), loMB: mx('loPriv'), amostras: a.length };
}

// ---------------- Edge ----------------
let ws, nCdp = 0;
const pendentes = new Map(), erros = [];
function cdp(method, params = {}, ms = 60000) {
  const id = ++nCdp;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pendentes.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
    setTimeout(() => { if (pendentes.delete(id)) rej(new Error('CDP sem resposta: ' + method)); }, ms);
  });
}
async function avaliar(expr, ms = 60000) {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, ms);
  if (r.exceptionDetails) throw new Error('página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result?.value;
}
async function esperarQue(expr, ms = 60000, passo = 100) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) { if (await avaliar(expr).catch(() => false)) return true; await espera(passo); }
  return false;
}
// roda antes dos scripts da página: buffer grande de tempos de recurso e o cronômetro de quadros
const BANCADA = `
performance.setResourceTimingBufferSize(1e6);
window.__carga = {
  ev: 0, quadros: [], lat: [], longas: [], ligado: false,
  iniciar() { this.quadros = []; this.lat = []; this.longas = []; this.ligado = true; let ult = performance.now();
    const laco = t => { if (!this.ligado) return; this.quadros.push(t - ult); ult = t;
      if (this.ev) { this.lat.push(t - this.ev); this.ev = 0; } requestAnimationFrame(laco); };
    requestAnimationFrame(laco); },
  parar() { this.ligado = false; const est = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y);
      const q = p => +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(1);
      return { n: a.length, media: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1), p50: q(.5), p95: q(.95), max: +s[s.length - 1].toFixed(1) }; };
    return { quadros: est(this.quadros), acimaDe50ms: this.quadros.filter(x => x > 50).length, acimaDe200ms: this.quadros.filter(x => x > 200).length,
      latenciaTraco: est(this.lat), tarefasLongas: this.longas.length, somaTarefasLongasMs: Math.round(this.longas.reduce((x, y) => x + y, 0)), maiorTarefaMs: Math.round(Math.max(0, ...this.longas)) }; },
  carregada(src) { return performance.getEntriesByName(new URL(src, location.href).href).length > 0; },
  quadrosDepois(n = 2) { return new Promise(r => { const f = k => k ? requestAnimationFrame(() => f(k - 1)) : r(); f(n); }); },
  assets() { return performance.getEntriesByType('resource').filter(e => e.name.includes('/assets/')).length; },
};
addEventListener('pointermove', e => { if (window.__carga.ligado && !window.__carga.ev) window.__carga.ev = e.timeStamp; }, true);
try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__carga.longas.push(e.duration); }).observe({ type: 'longtask', buffered: false }); } catch {}
`;
async function iniciarEdge() {
  const portaCdp = await portaLivre();
  edge = spawn(EDGE, [...(VISIVEL ? ['--window-position=0,0'] : ['--headless=new']), ...(LENTO ? ['--disable-gpu'] : []), `--remote-debugging-port=${portaCdp}`,
    `--user-data-dir=${join(pastaTmp, 'perfil-edge')}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    `--window-size=${LARG},${ALT}`, 'about:blank'], { stdio: 'ignore' });
  let alvo;
  for (let t = 0; t < 100 && !alvo; t++) {
    try { alvo = (await (await fetch(`http://127.0.0.1:${portaCdp}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); }
  }
  ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id) { pendentes.get(m.id)?.(m); pendentes.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') erros.push('exceção: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erros.push('console.error: ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' '));
  };
  await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Performance.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: LARG, height: ALT, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: BANCADA });
  // --lento imita um PC de sala modesto: processador 4 vezes mais lento e desenho sem a placa de vídeo
  if (LENTO) await cdp('Emulation.setCPUThrottlingRate', { rate: 4 });
}
async function heapMB() {
  const m = (await cdp('Performance.getMetrics')).metrics;
  return MBf(m.find(x => x.name === 'JSHeapUsedSize').value);
}
async function abrirUrl(url) {
  await cdp('Page.navigate', { url });
  await esperarQue('document.readyState === "complete"', 30000);
  // perfil novo: a escolha das áreas da primeira abertura cobre a galeria; aceita o padrão
  await avaliar(`[...document.querySelectorAll('button')].find(b => b.dataset.a === 'ok' && b.textContent.trim() === 'Começar')?.click()`);
}
const tecla = async (key, code, vk, extra = {}) => {
  await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, ...extra });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, ...extra });
};
const PGDN = () => tecla('PageDown', 'PageDown', 34), PGUP = () => tecla('PageUp', 'PageUp', 33);

// ---------------- servidor ----------------
async function iniciarServidor() {
  servidor = spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' });
  for (let t = 0; t < 100 && !token; t++) { try { token = (await (await fetch(BASE + '/api/info')).json()).token; } catch { await espera(100); } }
  if (!token) throw new Error('o servidor temporário não abriu');
}
const quadroArq = id => join(DADOS, id + '.json');
const lerQuadro = id => JSON.parse(readFileSync(quadroArq(id), 'utf8'));
const assetArq = src => join(DADOS, 'assets', basename(src));

// ---------------- 1. importação pela galeria ----------------
async function importar(arquivo) {
  log('importando', basename(arquivo));
  await abrirUrl(BASE + '/#/');
  await esperarQue(`!!document.getElementById('gSlideFile')`);
  const antes = new Set(readdirSync(DADOS).filter(f => f.endsWith('.json')));
  const m0 = memoria();
  const { root } = await cdp('DOM.getDocument', { depth: 1 });
  const { nodeId } = await cdp('DOM.querySelector', { nodeId: root.nodeId, selector: '#gSlideFile' });
  const t0 = Date.now();
  await cdp('DOM.setFileInputFiles', { nodeId, files: [arquivo] });
  // o diálogo de escolha das páginas aparece quando a conversão termina (ou um aviso de erro)
  let dialogo = false, aviso = '';
  const fim = Date.now() + 15 * 60000;
  while (Date.now() < fim) {
    dialogo = await avaliar(`!!document.querySelector('dialog.pgpick[open]')`).catch(() => false);
    if (dialogo) break;
    aviso = await avaliar(`[...document.querySelectorAll('.toast, #toast')].map(e => e.textContent).join(' | ')`).catch(() => '');
    if (/Falha|demorou|não|erro|Para abrir/i.test(aviso) && !/Importando|Convertendo|Lendo/i.test(aviso)) break;
    await espera(250);
  }
  const tConv = Date.now();
  const res = { arquivo: basename(arquivo), tamanhoMB: MBf(statSync(arquivo).size), conversaoS: +((tConv - t0) / 1000).toFixed(1), memoriaAntes: m0 };
  if (!dialogo) { res.erro = aviso || 'o diálogo de páginas não apareceu'; res.picos = picos(t0, Date.now()); R.importacoes.push(res); log('  falhou:', res.erro); return null; }
  res.miniaturasNoDialogo = await avaliar(`document.querySelectorAll('dialog.pgpick img').length`);
  await espera(1500);
  res.memoriaComDialogo = memoria();
  const t1 = Date.now();
  await avaliar(`document.querySelector('dialog.pgpick [data-a="ok"]').click()`);
  await esperarQue(`location.hash.startsWith('#/b/') && !!window.__lousa?.S`, 5 * 60000, 200);
  const tAberto = Date.now();
  const id = await avaliar(`location.hash.slice(4)`);
  const b = lerQuadro(id);
  const srcs = b.items.filter(i => i.type === 'image').map(i => i.src);
  await esperarQue(`window.__carga.carregada(${JSON.stringify(srcs[0])})`, 30000);
  await avaliar('window.__carga.quadrosDepois(3)');
  res.gravarEAbrirS = +((tAberto - t1) / 1000).toFixed(1);
  res.paginas = b.layout.count;
  res.quadroJsonKB = Math.round(statSync(quadroArq(id)).size / 1024);
  const tam = srcs.map(s => statSync(assetArq(s)).size);
  res.imagens = { n: tam.length, totalMB: MBf(tam.reduce((x, y) => x + y, 0)), mediaKB: Math.round(tam.reduce((x, y) => x + y, 0) / tam.length / 1024), maiorKB: Math.round(Math.max(...tam) / 1024), formato: basename(srcs[0]).split('.').pop() };
  res.memoriaDepois = memoria();
  res.picos = picos(t0, Date.now());
  res.quadro = id;
  res.paginaPx = { w: b.layout.w, h: b.layout.h };
  R.importacoes.push(res);
  log(`  ${res.paginas} páginas; conversão ${res.conversaoS}s; imagens ${res.imagens.totalMB} MB`);
  return { id, itens: b.items.filter(i => i.type === 'image').map(i => ({ src: i.src, w: i.w, h: i.h })), layout: b.layout, novos: [...antes] };
}

// ---------------- 2. quadros de N slides ----------------
function montarQuadro(n, fontes, L) {
  const itens = [];
  for (let k = 0; k < n; k++) {
    const f = fontes[k % fontes.length], y = k * (L.h + L.gap);
    const s = Math.min(L.w / f.w, L.h / f.h), w = f.w * s, h = f.h * s;
    itens.push({ id: 'c' + k.toString(36) + Math.random().toString(36).slice(2, 8), type: 'image', locked: true, x: (L.w - w) / 2, y: y + (L.h - h) / 2, w, h, src: f.src });
  }
  return { version: 2, title: `Carga ${n} slides`, background: { color: '#ffffff', pattern: 'none' }, layout: { ...L, count: n }, view: null, items: itens };
}
async function gravarQuadro(id, board) {
  const r = await fetch(BASE + '/api/boards/' + id, { method: 'PUT', headers: { 'X-Lousa': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: board.title, board, thumb: null, revision: 0 }) });
  if (!r.ok) throw new Error('gravar quadro: ' + r.status + ' ' + await r.text());
}

// abre o quadro do zero (página recarregada) e espera a primeira página aparecer
async function abrirQuadro(id, src0) {
  await abrirUrl('about:blank');
  const t0 = Date.now();
  await abrirUrl(`${BASE}/#/b/${id}`);
  await esperarQue(`window.__lousa?.S?.id === ${JSON.stringify(id)}`, 60000, 50);
  const tEditor = Date.now();
  // a página visível (o quadro reabre onde estava): o slide no centro da tela
  const src = await avaliar(`(() => { const S = window.__lousa.S, L = S.board.layout, v = S.view;
    const i = Math.max(0, Math.min(L.count - 1, Math.floor(((${ALT / 2} - v.y) / v.zoom) / (L.h + L.gap))));
    return S.items.filter(it => it.type === 'image')[i]?.src || ${JSON.stringify(src0)}; })()`);
  await esperarQue(`window.__carga.carregada(${JSON.stringify(src)})`, 60000, 50);
  await avaliar('window.__carga.quadrosDepois(2)');
  return { editorS: +((tEditor - t0) / 1000).toFixed(2), primeiraPaginaS: +((Date.now() - t0) / 1000).toFixed(2) };
}

// troca de página: tempo até a imagem da página nova estar baixada e dois quadros desenhados
async function passarPaginas(srcs, de, ate, apresentar) {
  const tempos = [];
  await avaliar('window.__carga.iniciar()');
  for (let i = de + 1; i <= ate; i++) {
    const t0 = Date.now();
    await PGDN();
    await esperarQue(`window.__carga.carregada(${JSON.stringify(srcs[i])})`, 30000, 10);
    await avaliar('window.__carga.quadrosDepois(2)');
    tempos.push(Date.now() - t0);
  }
  const quadros = await avaliar('window.__carga.parar()');
  const s = [...tempos].sort((a, b) => a - b);
  return { paginas: tempos.length, apresentacao: apresentar, mediaMs: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length), p95Ms: s[Math.floor(0.95 * s.length)], maxMs: s[s.length - 1], ...quadros };
}

// traço de caneta (pointerType pen) no meio da tela
async function traco(pontos = 160) {
  const x0 = LARG * 0.3, y0 = ALT * 0.45;
  const p = (type, x, y, extra = {}) => cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'pen', force: 0.5, ...extra });
  await avaliar('window.__carga.iniciar()');
  await p('mousePressed', x0, y0);
  for (let k = 1; k <= pontos; k++) {
    const x = x0 + k * 4, y = y0 + Math.sin(k / 8) * 60;
    await p('mouseMoved', x, y);
    await espera(8);
  }
  const tSolta = Date.now();
  await p('mouseReleased', x0 + pontos * 4, y0);
  await avaliar('window.__carga.quadrosDepois(3)');
  return { quadros: await avaliar('window.__carga.parar()'), tSolta };
}

async function rolar(passos, deltaY, ctrl = false) {
  await avaliar('window.__carga.iniciar()');
  const t0 = Date.now();
  for (let k = 0; k < passos; k++) {
    await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: LARG / 2, y: ALT / 2, deltaX: 0, deltaY, modifiers: ctrl ? 2 : 0 });
    await espera(16);
  }
  await avaliar('window.__carga.quadrosDepois(3)');
  return { passos, duracaoS: +((Date.now() - t0) / 1000).toFixed(1), ...(await avaliar('window.__carga.parar()')) };
}

async function medirQuadro(n, id, srcs) {
  log(`quadro de ${n} slides`);
  const q = { slides: n, imagensDistintas: new Set(srcs).size, quadroJsonKB: Math.round(statSync(quadroArq(id)).size / 1024), paginaH: lerQuadro(id).layout.h };
  q.imagensMB = MBf([...new Set(srcs)].reduce((s, x) => s + statSync(assetArq(x)).size, 0));
  q.abrir = await abrirQuadro(id, srcs[0]);
  q.abrir.assetsBaixados = await avaliar('window.__carga.assets()');
  q.memoriaAberto = { ...memoria(), heapMB: await heapMB() };
  log('  aberto', q.abrir);

  // editor: PageDown até a página do meio
  const meio = Math.floor(n / 2);
  q.trocaEditor = await passarPaginas(srcs, 0, meio, false);
  q.memoriaNoMeio = { ...memoria(), heapMB: await heapMB(), assetsBaixados: await avaliar('window.__carga.assets()') };
  log('  troca de página no editor', q.trocaEditor.mediaMs, 'ms');

  // caneta na página do meio e gravação
  const itens0 = await avaliar('window.__lousa.S.items.length');
  const tr = await traco();
  q.caneta = tr.quadros;
  q.caneta.tracoGravadoNaMemoria = (await avaliar('window.__lousa.S.items.length')) === itens0 + 1;
  await esperarQue(`document.getElementById('bStatus').textContent === 'Salvo'`, 30000, 20);
  q.gravarS = +((Date.now() - tr.tSolta) / 1000).toFixed(2);
  // a miniatura da galeria sai 4 s depois da gravação e lê todas as imagens do quadro
  await avaliar('window.__carga.iniciar()');
  const tMin = Date.now();
  await esperarQue(`window.__carga.assets() >= ${new Set(srcs).size} || false`, 4000 + 120000, 100);
  await espera(800);
  q.miniaturaGaleria = { assetsBaixados: await avaliar('window.__carga.assets()'), esperaS: +((Date.now() - tMin) / 1000).toFixed(1), ...(await avaliar('window.__carga.parar()')) };
  q.memoriaDepoisMiniatura = { ...memoria(), heapMB: await heapMB() };
  log('  caneta', q.caneta.latenciaTraco, 'miniatura', q.miniaturaGaleria.assetsBaixados, 'imagens');

  // apresentação: F5 e PageDown do meio até o fim
  await tecla('F5', 'F5', 116);
  await espera(800);
  q.apresentacaoAtiva = await avaliar(`document.getElementById('board').classList.contains('present')`);
  q.trocaApresentacao = await passarPaginas(srcs, meio, n - 1, true);
  q.memoriaFimApresentacao = { ...memoria(), heapMB: await heapMB() };
  log('  apresentação', q.trocaApresentacao.mediaMs, 'ms/página');
  await tecla('Escape', 'Escape', 27);
  await espera(800);

  // rolagem: volta ao começo pela roda do mouse; depois, quadro afastado (zoom mínimo) rolando para baixo
  const zoom = await avaliar('window.__lousa.S.view.zoom');
  const altura = n * (q.paginaH + 48) * zoom;
  q.rolagem = await rolar(Math.min(1500, Math.ceil(altura / 600)), -600);
  for (let k = 0; k < 30; k++) await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: LARG / 2, y: 100, deltaX: 0, deltaY: 400, modifiers: 2 });
  await avaliar('window.__carga.quadrosDepois(5)');
  const z2 = await avaliar('window.__lousa.S.view.zoom');
  q.rolagemAfastada = { zoom: +z2.toFixed(2), ...(await rolar(Math.min(1500, Math.ceil(n * (q.paginaH + 48) * z2 / 300)), 300)) };
  q.memoriaDepoisRolagem = { ...memoria(), heapMB: await heapMB() };
  log('  rolagem', q.rolagem.quadros, 'afastada', q.rolagemAfastada.quadros);
  await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Home', code: 'Home', windowsVirtualKeyCode: 36 });

  // painel "Ver todas as páginas": miniaturas de todas; e um traço com o painel aberto (ele se refaz inteiro)
  const tP = Date.now();
  await avaliar(`document.getElementById('pgAll').click()`);
  const painelOk = await esperarQue(`document.querySelectorAll('#ppList .pthumb').length >= ${n}`, 5 * 60000, 100);
  q.painelPaginas = { completo: painelOk, abrirS: +((Date.now() - tP) / 1000).toFixed(1) };
  await avaliar(`window.__carga.quadrosDepois(2)`);
  const tr2 = await traco(60);
  const tR = Date.now();
  await espera(700);   // o painel espera 600 ms antes de se refazer
  await esperarQue(`document.querySelectorAll('#ppList .pthumb').length >= ${n}`, 5 * 60000, 50);
  q.painelPaginas.refazerDepoisDoTracoS = +((Date.now() - tR) / 1000).toFixed(1);
  q.painelPaginas.caneta = tr2.quadros;
  q.memoriaPainel = { ...memoria(), heapMB: await heapMB() };
  log('  painel', q.painelPaginas.abrirS, 's; refazer', q.painelPaginas.refazerDepoisDoTracoS, 's');
  await avaliar(`document.getElementById('pgAll').click()`);
  await esperarQue(`document.getElementById('bStatus').textContent === 'Salvo'`, 30000, 50);

  // reabrir
  q.reabrir = await abrirQuadro(id, srcs[0]);
  const b = lerQuadro(id);
  q.reabrir.tracosNoArquivo = b.items.filter(i => i.type === 'stroke' || i.pts).length;
  q.memoriaReaberto = { ...memoria(), heapMB: await heapMB() };
  log('  reaberto', q.reabrir);
  R.quadros.push(q);
  writeFileSync(join(SAIDA, 'resultado.json'), JSON.stringify(R, null, 1));
}

// =====================================================================
try {
  await iniciarServidor();
  log('servidor na porta', PORTA, 'dados em', DADOS);
  await iniciarEdge();
  amostrador = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS, '-Edge', String(edge.pid), '-Servidor', String(servidor.pid), '-Saida', ARQ_AMOSTRAS, '-Intervalo', '700'], { stdio: 'ignore' });
  R.memoriaInicial = memoria();

  const importados = [];
  for (const d of DECKS) {
    const r = await importar(d).catch(e => { R.importacoes.push({ arquivo: basename(d), erro: e.message }); log('  erro', e.message); return null; });
    if (r) importados.push({ deck: basename(d), ...r });
    writeFileSync(join(SAIDA, 'resultado.json'), JSON.stringify(R, null, 1));
  }
  // fontes para os quadros de carga: slides de .pptx primeiro (sem repetir imagem), na ordem dos decks
  const fontes = [];
  const vistos = new Set();
  for (const im of [...importados.filter(i => /\.pptx?$/i.test(i.deck)), ...importados.filter(i => !/\.pptx?$/i.test(i.deck))]) for (const it of im.itens) if (!vistos.has(it.src)) { vistos.add(it.src); fontes.push(it); }
  R.fontesDistintas = fontes.length;
  if (fontes.length && TAMANHOS.length) {
    const L = (importados.find(i => /\.pptx?$/i.test(i.deck)) || importados[0]).layout;
    for (const n of TAMANHOS) {
      const id = 'carga' + n;
      const board = montarQuadro(n, fontes, L);
      await gravarQuadro(id, board);
      await medirQuadro(n, id, board.items.map(i => i.src)).catch(e => { R.quadros.push({ slides: n, erro: e.stack }); log('  erro', e.message); });
    }
  }
  R.errosDoConsole = erros;
} finally {
  R.fim = new Date().toISOString();
  writeFileSync(join(SAIDA, 'resultado.json'), JSON.stringify(R, null, 1));
  try { amostrador?.kill(); } catch {}
  try { ws?.close(); } catch {}
  try { edge?.kill(); } catch {}
  try { await fetch(BASE + '/api/sair', { method: 'POST', headers: { 'X-Lousa': token, 'Content-Type': 'application/json' }, body: '{}' }); } catch {}
  await espera(800);
  try { servidor?.kill(); } catch {}
  if (!MANTER) { await espera(1500); try { rmSync(join(pastaTmp, 'perfil-edge'), { recursive: true, force: true }); rmSync(DADOS, { recursive: true, force: true }); } catch {} }
  console.log('\nResultado em', join(SAIDA, 'resultado.json'));
}
