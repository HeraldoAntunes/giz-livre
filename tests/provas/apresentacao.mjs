// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Prova da gravação na apresentação (1.16.3): trocar de slide não grava; a vista fica pendente; imagem que falha tenta
// de novo em 0,5/2/8/30 s. Chromium sem janela pelo Playwright, server.py como processo separado, deck SINTÉTICO de
// slides com uma cor por slide no centro (dados fictícios em pasta temporária).
//   T1. Traço feito na apresentação chega ao disco a tempo, parado e trocando de slide sem parar.
//   T2. O programa cai na apresentação (servidor e navegador com SIGKILL) com a vista pendente.
//       A queda é o processo do navegador com SIGKILL junto com o servidor. Também: traço feito 300 ms antes da queda.
//   T3. Duas janelas no mesmo quadro: A apresenta (vista pendente), B escreve. A sai da apresentação, ou fecha.
//   T4. Imagem que falha: pedidos ao longo de 45 s com uma falhando sempre, e com todas falhando; CPU parada?;
//       volta sozinha quando o servidor volta a entregar? E com o servidor reaberto (código novo)?
// Rodar: node tests/provas/apresentacao.mjs [--raiz pasta-de-outra-versão] [--so T1,T2]
//   PYTHON=caminho (padrão python3); PLAYWRIGHT=pasta do pacote, se não estiver global.
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opc = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const RAIZ = resolve(opc('--raiz') || join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
const SO = (opc('--so') || 'T1,T2,T3,T4').split(',');
const PY = process.env.PYTHON || 'python3';
const N = 12, LARG = 1280, ALT = 720;
const espera = ms => new Promise(r => setTimeout(r, ms));
const VERSAO = (readFileSync(join(RAIZ, 'server.py'), 'utf8').match(/^VERSAO = "([^"]+)"/m) || [])[1];

function carregarPlaywright() {
  const req = createRequire(import.meta.url);
  const lugares = [process.env.PLAYWRIGHT, 'playwright'];
  try { lugares.push(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright')); } catch {}
  for (const l of lugares.filter(Boolean)) { try { return req(l); } catch {} }
  throw new Error('Playwright não encontrado');
}
const { chromium } = carregarPlaywright();

let ok = 0, falhas = 0;
const conferir = (nome, cond, detalhe = '') => {
  cond ? ok++ : falhas++;
  console.log(`  ${cond ? 'PASSOU' : 'FALHOU'}  ${nome}${detalhe ? '\n         ' + detalhe : ''}`);
  return cond;
};
const nota = t => console.log(`  (medido) ${t}`);

const tmp = mkdtempSync(join(tmpdir(), 'giz-prova-apres-'));
const DADOS = join(tmp, 'quadros');
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
let servidor, token;

async function subir() {
  servidor = spawn(PY, [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS],
    { stdio: 'ignore', env: { ...process.env, GIZ_SEM_DIARIO: '1' } });
  const antes = token;
  for (let t = 0; t < 150; t++) {
    try {
      const c = JSON.parse(readFileSync(join(DADOS, '.agente', 'conexao.json'), 'utf8'));
      if (c.token && c.token !== antes) { await fetch(BASE + '/api/info'); token = c.token; return; }
    } catch {}
    await espera(100);
  }
  throw new Error('o servidor não abriu');
}
const derrubarServidor = () => new Promise(r => { servidor.once('exit', r); servidor.kill('SIGKILL'); });
const api = (metodo, rota, corpo) => fetch(BASE + rota, { method: metodo, headers: { 'X-Lousa': token, 'Content-Type': 'application/json' },
  body: corpo === undefined ? undefined : JSON.stringify(corpo) });
const disco = id => JSON.parse(readFileSync(join(DADOS, id + '.json'), 'utf8'));
const tracosNoDisco = id => disco(id).items.filter(i => i.type === 'stroke').length;
const cor = i => [(i * 37 + 20) % 256, (i * 91 + 60) % 256, (i * 53 + 100) % 256];

const ARGS = process.getuid?.() === 0 ? ['--no-sandbox'] : [];
const browser = await chromium.launch({ headless: true, args: ARGS });
// janela num navegador só dela, para a queda: o processo leva SIGKILL (sem pagehide, sem gravação de emergência)
async function janelaQueCai() {
  const srv = await chromium.launchServer({ headless: true, args: ARGS });
  const b = await chromium.connect(srv.wsEndpoint());
  const j = await janela(b);
  j.matar = () => new Promise(r => { srv.process().once('exit', r); srv.process().kill('SIGKILL'); });
  return j;
}
async function janela(nav = browser) {
  const ctx = await nav.newContext({ viewport: { width: LARG, height: ALT } });
  await ctx.addCookies([{ name: 'giz' + PORTA, value: token, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Strict' }]);
  await ctx.addInitScript(() => {
    try { localStorage.setItem('lousa.abas', '{"ocultas":[],"escolhido":true}'); localStorage.setItem('lousa.ajuda', '{"tourVisto":true}'); } catch {}
  });
  const page = await ctx.newPage();
  page.pedidos = [];
  page.on('request', r => page.pedidos.push({ t: Date.now(), m: r.method(), u: r.url() }));
  page.on('response', r => { const p = page.pedidos.findLast(x => x.u === r.url() && x.st === undefined); if (p) p.st = r.status(); });
  return { ctx, page };
}
async function abrir(page, id) {
  await page.goto(`${BASE}/#/b/${id}`);
  await page.waitForFunction(i => window.__lousa?.S?.id === i, id, { timeout: 20000 });
  await espera(1200);
  await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
}
const pixel = page => page.evaluate(() => { const c = document.getElementById('cv');
  return [...c.getContext('2d').getImageData(c.width / 2 | 0, c.height / 2 | 0, 1, 1).data].slice(0, 3); });
const bate = (p, i) => cor(i).every((v, k) => Math.abs(v - p[k]) <= 6);
const slideNaTela = page => page.evaluate(() => { const S = window.__lousa.S, L = S.board.layout;
  return Math.round((((document.getElementById('cv').clientHeight / 2) - S.view.y) / S.view.zoom) / (L.h + L.gap) - 0.5); });
const slideDaVista = (v, L) => v ? Math.round((((ALT / 2) - v.y) / v.zoom) / (L.h + L.gap) - 0.5) : null;
async function apresentar(page) {
  await page.click('#bPresent');
  await page.waitForFunction(() => document.getElementById('board').classList.contains('present'));
  await espera(600);
}
async function irPara(page, alvo) {   // setas, como o professor
  for (let t = 0; t < 40; t++) {
    const s = await slideNaTela(page);
    if (s === alvo) return;
    await page.keyboard.press(s < alvo ? 'ArrowRight' : 'ArrowLeft');
    await espera(120);
  }
}
async function riscar(page, dy = 0) {
  // clicar na caneta já escolhida abre os ajustes dela por cima do quadro: só na primeira vez
  if (!page.caneta) { await page.click('#presentbar [data-pt="pen1"]'); page.caneta = true; await espera(150); }
  const x = 200, y = 160 + dy;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + 150, y + 30, { steps: 10 }); await page.mouse.move(x + 300, y, { steps: 10 }); await page.mouse.up();
}
async function esperarDisco(id, cond, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { if (cond(disco(id))) return Date.now() - t0; } catch {} await espera(50); }
  return null;
}

// ---------------- deck sintético ----------------
async function criarDeck(id) {
  const { ctx, page } = await janela();
  await page.goto(BASE + '/');
  const srcs = await page.evaluate(async ({ N, token }) => {
    const out = [];
    for (let i = 0; i < N; i++) {
      const c = document.createElement('canvas'); c.width = 640; c.height = 360;
      const g = c.getContext('2d'); g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, 640, 360);
      g.fillStyle = `rgb(${(i * 37 + 20) % 256},${(i * 91 + 60) % 256},${(i * 53 + 100) % 256})`; g.fillRect(220, 80, 200, 200);
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      const r = await fetch('/api/assets', { method: 'POST', headers: { 'X-Lousa': token, 'Content-Type': 'image/png' }, body: blob });
      out.push((await r.json()).url);
    }
    return out;
  }, { N, token });
  await ctx.close();
  const L = { mode: 'pages', kind: 's169', w: 1280, h: 720, gap: 48, count: N };
  const items = srcs.map((src, k) => ({ id: 's' + k, type: 'image', locked: true, x: 0, y: k * (L.h + L.gap), w: L.w, h: L.h, src }));
  const r = await api('PUT', `/api/boards/${id}`, { board: { version: 2, title: 'Apresentação fictícia', background: { color: '#ffffff', pattern: 'none' },
    layout: L, items }, revision: 0, criar: true });
  if (!r.ok) throw new Error('criar deck: ' + r.status);
  return srcs;
}

console.log(`Giz Livre ${VERSAO} (${RAIZ}), Chromium ${browser.version()}, ${N} slides`);
try {
  await subir();

  // ---------------- T1 ----------------
  if (SO.includes('T1')) {
    console.log('\nT1. Traço feito na apresentação chega ao disco a tempo');
    await criarDeck('t1');
    const { ctx, page } = await janela();
    await abrir(page, 't1'); await apresentar(page); await irPara(page, 3);
    const n0 = tracosNoDisco('t1');
    await riscar(page);
    let ms = await esperarDisco('t1', b => b.items.filter(i => i.type === 'stroke').length === n0 + 1);
    conferir('T1a: parado no slide, o traço chega ao disco em até 3,5 s', ms !== null && ms <= 3500, `${ms} ms`);
    await riscar(page, 60);
    const t0 = Date.now(); let trocas = 0, chegou = null;
    while (Date.now() - t0 < 8000 && chegou === null) {   // troca de slide a cada 150 ms enquanto espera
      await page.keyboard.press(trocas % 2 ? 'ArrowLeft' : 'ArrowRight'); trocas++;
      await espera(150);
      if (tracosNoDisco('t1') === n0 + 2) chegou = Date.now() - t0;
    }
    conferir('T1b: trocando de slide sem parar, o traço chega ao disco em até 3,5 s', chegou !== null && chegou <= 3500,
      `${chegou} ms, ${trocas} trocas no meio`);
    const puts = page.pedidos.filter(p => p.m === 'PUT' && p.u.endsWith('/api/boards/t1'));
    nota(`gravações do quadro (PUT /api/boards/t1) na T1: ${puts.length}, para 2 traços e ~${trocas + 3} trocas de slide`);
    await ctx.close();
  }

  // ---------------- T2 ----------------
  if (SO.includes('T2')) {
    console.log('\nT2. O programa cai na apresentação com a vista pendente');
    await criarDeck('t2');
    let { ctx, page, matar } = await janelaQueCai();
    await abrir(page, 't2'); await apresentar(page); await irPara(page, 2);
    await riscar(page);
    await esperarDisco('t2', b => b.items.some(i => i.type === 'stroke'));
    await espera(800);
    const L = disco('t2').layout, vistaGravada = slideDaVista(disco('t2').view, L);
    await irPara(page, 7);
    await espera(2000);
    const naTela = await slideNaTela(page);
    await Promise.all([derrubarServidor(), matar()]);
    const b = disco('t2');
    conferir('T2a: depois da queda, o traço feito na apresentação está no disco', b.items.filter(i => i.type === 'stroke').length === 1);
    nota(`slide na tela na hora da queda: ${naTela + 1}; slide da vista no disco: ${slideDaVista(b.view, L) + 1} (gravada com o traço: ${vistaGravada + 1})`);
    conferir('T2b: só a posição se perde (a vista no disco é a da última gravação, não a da tela)',
      slideDaVista(b.view, L) === vistaGravada);
    await subir();
    ({ ctx, page, matar } = await janelaQueCai());
    await abrir(page, 't2');
    const itens = await page.evaluate(() => window.__lousa.S.items.filter(i => i.type === 'stroke').length);
    conferir('T2c: reaberto, o quadro tem o traço', itens === 1, `slide em que reabriu: ${(await slideNaTela(page)) + 1}`);
    // traço 300 ms antes da queda (menos que a pausa de 500 ms da gravação)
    await apresentar(page); await irPara(page, 4);
    await riscar(page, 80);
    await espera(300);
    await Promise.all([derrubarServidor(), matar()]);
    nota(`traço feito 300 ms antes da queda: ${tracosNoDisco('t2') === 2 ? 'chegou ao disco' : 'perdido'} (a gravação espera 500 ms de pausa)`);
    await subir();
  }

  // ---------------- T3 ----------------
  if (SO.includes('T3')) {
    console.log('\nT3. Duas janelas: A apresenta com a vista pendente, B escreve');
    for (const fim of ['sai da apresentação', 'fecha a janela']) {
      const id = fim.startsWith('sai') ? 't3a' : 't3b';
      await criarDeck(id);
      const A = await janela(), B = await janela();
      await abrir(A.page, id); await abrir(B.page, id);
      await apresentar(A.page); await irPara(A.page, 6);
      await espera(3000);   // na 1.16.2 a troca gravava a vista 1,5 s depois
      const revAntesB = disco(id)._rev;
      // a caneta 1 já é a ferramenta de quem abre (clicar nela abriria os ajustes por cima do quadro)
      await B.page.mouse.move(600, 400); await B.page.mouse.down(); await B.page.mouse.move(900, 450, { steps: 10 }); await B.page.mouse.up();
      await espera(2500);
      const statusB = (await B.page.textContent('#bStatus')).trim();
      if (fim.startsWith('sai')) {
        await A.page.keyboard.press('Escape');
        await espera(12500);   // a vista sozinha vai 10 s depois, fora da apresentação
      } else {
        await A.ctx.close();
        await espera(1500);
      }
      const b = disco(id), tracosB = b.items.filter(i => i.type === 'stroke').length;
      const putsA = (A.page.pedidos || []).filter(p => p.m === 'PUT' && p.u.endsWith('/api/boards/' + id));
      const statusA = fim.startsWith('sai') ? (await A.page.textContent('#bStatus')).trim() : '(fechada)';
      conferir(`T3 (A ${fim}): o traço de B continua no disco, sem sobrescrita`, tracosB === 1,
        `revisão antes de B: ${revAntesB}, no fim: ${b._rev}; status de B depois de escrever: "${statusB}"; ` +
        `PUTs de A: ${putsA.map(p => p.st).join(', ') || 'nenhum'}; status de A: "${statusA}"`);
      if (fim.startsWith('sai')) {
        // A escreve depois disso: grava?
        await A.page.mouse.move(600, 250); await A.page.mouse.down(); await A.page.mouse.move(900, 280, { steps: 10 }); await A.page.mouse.up();
        await espera(3500);
        nota(`A escreve depois: traços no disco ${disco(id).items.filter(i => i.type === 'stroke').length} (1 = o de A não foi gravado); ` +
          `status de A: "${(await A.page.textContent('#bStatus')).trim()}"`);
        await A.ctx.close();
      }
      await B.ctx.close();
    }
  }

  // ---------------- T4 ----------------
  if (SO.includes('T4')) {
    console.log('\nT4. Imagem que falha: nova tentativa');
    const srcs = await criarDeck('t4');
    // uma falhando sempre, no slide que está na tela
    let { ctx, page } = await janela();
    const alvo = srcs[5].split('/').pop();
    let bloquear = true;
    await page.route('**/assets/*', r => (bloquear && r.request().url().endsWith(alvo)) ? r.abort('connectionreset') : r.continue());
    await abrir(page, 't4'); await apresentar(page); await irPara(page, 5);
    const cdp = await ctx.newCDPSession(page); await cdp.send('Performance.enable');
    const tarefa = async () => (await cdp.send('Performance.getMetrics')).metrics.find(m => m.name === 'TaskDuration').value;
    const t0 = Date.now(), c0 = await tarefa();
    await espera(45000);
    const cpu = (await tarefa()) - c0;
    const pedidosAlvo = page.pedidos.filter(p => p.u.endsWith(alvo) && p.t >= t0 - 2000);
    const tempos = pedidosAlvo.map(p => ((p.t - pedidosAlvo[0].t) / 1000).toFixed(1));
    conferir('T4a: uma imagem falhando sempre: poucos pedidos em 45 s (espaçados 0,5/2/8/30 s)', pedidosAlvo.length >= 3 && pedidosAlvo.length <= 7,
      `${pedidosAlvo.length} pedidos, em ${tempos.join(' s, ')} s`);
    conferir('T4b: sem laço: a página fica quase parada enquanto espera', cpu < 4.5, `${cpu.toFixed(2)} s de CPU da página em 45 s`);
    bloquear = false;
    const tv = Date.now(); let voltou = null;
    while (Date.now() - tv < 40000 && voltou === null) { if (bate(await pixel(page), 5)) voltou = Date.now() - tv; else await espera(200); }
    conferir('T4c: quando a imagem volta a vir, o slide aparece sozinho, sem fechar o quadro', voltou !== null, `${voltou} ms (a espera já estava em 30 s)`);
    await ctx.close();

    // todas falhando
    ({ ctx, page } = await janela());
    let todas = true;
    await page.route('**/assets/*', r => todas ? r.abort('connectionreset') : r.continue());
    await abrir(page, 't4'); await apresentar(page); await irPara(page, 2);
    const t1 = Date.now();
    await espera(45000);
    const todos = page.pedidos.filter(p => p.u.includes('/assets/') && p.t >= t1);
    const porImagem = {};
    todos.forEach(p => { porImagem[p.u.split('/').pop().slice(0, 8)] = (porImagem[p.u.split('/').pop().slice(0, 8)] || 0) + 1; });
    conferir(`T4d: todas as ${N} imagens falhando: pedidos limitados em 45 s`, todos.length <= N * 6,
      `${todos.length} pedidos, ${Object.keys(porImagem).length} imagens pedidas, no máximo ${Math.max(0, ...Object.values(porImagem))} por imagem`);
    todas = false;
    await ctx.close();

    // servidor reaberto no meio da aula: o código (cookie) da janela é o da sessão anterior
    ({ ctx, page } = await janela());
    await abrir(page, 't4'); await apresentar(page); await irPara(page, 8);
    await derrubarServidor();
    await page.evaluate(() => { for (const img of document.images) img.remove(); });
    await subir();
    // um slide que ainda não tinha sido mostrado, depois da reabertura
    await irPara(page, 10);
    const tr = Date.now(); let apareceu = null;
    while (Date.now() - tr < 45000 && apareceu === null) { if (bate(await pixel(page), 10)) apareceu = Date.now() - tr; else await espera(300); }
    const depois = page.pedidos.filter(p => p.u.includes('/assets/') && p.t >= tr);
    nota(`servidor reaberto (código novo): slide 11, nunca mostrado antes, ${apareceu !== null ? `apareceu em ${apareceu} ms` : 'não apareceu em 45 s'}; ` +
      `pedidos de imagem depois: ${depois.length}, respostas: ${[...new Set(depois.map(p => p.st))].join(', ')}; ` +
      `aviso de recarregar: ${await page.locator('#banner').isVisible().catch(() => false) ? 'sim' : 'não'}`);
    await ctx.close();
  }
} catch (e) {
  falhas++; console.log('  FALHOU  o teste parou: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' / '));
} finally {
  await browser.close().catch(() => {});
  servidor?.kill('SIGKILL');
  await espera(300);
  try { rmSync(tmp, { recursive: true, force: true }); } catch {}
}
console.log(`\n${ok} passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
