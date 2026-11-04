// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Provas da 1.17.0: procura defeitos nas novidades com o Chromium sem janela (Playwright) e o server.py de verdade,
// só com quadros sintéticos numa pasta temporária. Cada conferência é escrita como o comportamento ESPERADO: FALHOU
// quer dizer defeito (o passo a passo está em docs/PROVAS-1.17.0.md).
//   node tests/provas/v117.mjs [--so N1,M1,...]
//   PYTHON=caminho (padrão python3); PLAYWRIGHT=pasta do pacote, se não estiver global.
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = resolve(join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
const args = process.argv.slice(2);
const SO = (() => { const i = args.indexOf('--so'); return i >= 0 ? args[i + 1].split(',') : null; })();
const PY = process.env.PYTHON || 'python3';
const LARG = 1280, ALT = 800;
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

// ---------------- servidor ----------------
const tmp = mkdtempSync(join(tmpdir(), 'giz-prova-117-'));
const DADOS = join(tmp, 'quadros');
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
const servidor = spawn(PY, [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS],
  { stdio: 'ignore', env: { ...process.env, GIZ_SEM_DIARIO: '1' } });
let token = '';
for (let t = 0; t < 150 && !token; t++) {
  try { token = JSON.parse(readFileSync(join(DADOS, '.agente', 'conexao.json'), 'utf8')).token; await fetch(BASE + '/api/info'); }
  catch { token = ''; await espera(100); }
}
const api = async (metodo, rota, corpo) => {
  const r = await fetch(BASE + rota, { method: metodo, headers: { 'X-Lousa': token, 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo) });
  return { st: r.status, j: await r.json().catch(() => null) };
};
const disco = id => JSON.parse(readFileSync(join(DADOS, id + '.json'), 'utf8'));

// ---------------- quadros sintéticos ----------------
const L = n => ({ mode: 'pages', kind: 's169', w: 1280, h: 720, gap: 48, count: n });
const passo = 720 + 48;
const texto = (id, pg, t) => ({ id, type: 'text', x: 200, y: pg * passo + 300, w: 700, text: t, color: '#000000', size: 48 });
const notaDe = (id, pg, t) => ({ id, type: 'notaprof', x: 0, y: pg * passo + 1, w: 1, h: 1, texto: t });
async function criar(id, board) {
  const r = await api('PUT', `/api/boards/${id}`, { board: { version: 2, background: { color: '#ffffff', pattern: 'none' }, ...board }, revision: 0, criar: true });
  if (r.st !== 200) throw new Error(`criar ${id}: ${r.st} ${JSON.stringify(r.j)}`);
}
const deck = (n, extra = []) => ({ title: 'Aula fictícia', layout: L(n), items: [...Array.from({ length: n }, (_, k) => texto('t' + k, k, `Conteúdo da página ${k + 1}`)), ...extra] });

// ---------------- navegador ----------------
const browser = await chromium.launch({ headless: true, args: process.getuid?.() === 0 ? ['--no-sandbox'] : [] });
async function janela({ telas = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: LARG, height: ALT }, acceptDownloads: true });
  await ctx.addCookies([{ name: 'giz' + PORTA, value: token, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Strict' }]);
  await ctx.addInitScript(t => {
    try { localStorage.setItem('lousa.abas', '{"ocultas":[],"escolhido":true}'); localStorage.setItem('lousa.ajuda', '{"tourVisto":true}'); } catch {}
    if (t !== null) window.__gizTelasTeste = t;   // gancho do próprio programa para uma ou duas telas
  }, telas);
  const page = await ctx.newPage();
  page.erros = [];
  page.on('pageerror', e => page.erros.push(e.message));
  return { ctx, page };
}
async function abrir(page, id) {
  await page.goto(`${BASE}/#/b/${id}`);
  await page.waitForFunction(i => window.__lousa?.S?.id === i, id, { timeout: 20000 });
  await espera(900);
  await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
}
const itens = page => page.evaluate(() => window.__lousa.S.items);
const salvo = page => page.waitForFunction(() => document.getElementById('bStatus')?.textContent.trim() === 'Salvo', null, { timeout: 15000 }).catch(() => {});
const paginaAtual = page => page.evaluate(() => { const S = window.__lousa.S, Lx = S.board.layout;
  return Math.round((((document.getElementById('cv').clientHeight / 2) - S.view.y) / S.view.zoom) / (Lx.h + Lx.gap) - 0.5); });
const paginaDe = (it, Lx = L(1)) => Math.floor((it.y + (it.h || 0) / 2) / (Lx.h + Lx.gap));
async function menuPagina(page, acao) {
  await page.click('#pgMore'); await page.click(`#pop [data-a="${acao}"]`); await espera(300);
  const d = page.locator('dialog[open] [data-a="1"]');
  if (await d.count()) await d.click();
  await espera(300);
}
const cenario = async (cod, titulo, fn) => {
  if (SO && !SO.includes(cod)) return;
  console.log(`\n${cod}. ${titulo}`);
  try { await fn(); } catch (e) { conferir(`${cod}: o cenário rodou até o fim`, false, (e.stack || e.message).split('\n').slice(0, 2).join(' / ')); }
};

console.log(`Giz Livre ${VERSAO}, Chromium ${browser.version()}`);

// ============ notas do professor ============
await cenario('N1', 'Notas: escrever pelo painel e trocar de página', async () => {
  await criar('n1', deck(3));
  const { ctx, page } = await janela();
  await abrir(page, 'n1');
  await page.click('#pgNotas');
  await page.fill('#notasTexto', 'Lembrar: exemplo fictício A');
  await page.click('#pgNext'); await espera(500);
  await page.fill('#notasTexto', 'Lembrar: exemplo fictício B');
  await page.click('#notasFechar'); await salvo(page); await espera(800);
  const ns = disco('n1').items.filter(i => i.type === 'notaprof').map(i => [paginaDe(i), i.texto]);
  conferir('N1: as duas notas ficam no disco, cada uma na sua página', JSON.stringify(ns.sort()) === JSON.stringify([[0, 'Lembrar: exemplo fictício A'], [1, 'Lembrar: exemplo fictício B']]), JSON.stringify(ns));
  await page.keyboard.press('Control+a'); await espera(200);
  const sel = await page.evaluate(() => [...window.__lousa.sel].filter(id => window.__lousa.S.items.find(i => i.id === id)?.type === 'notaprof').length);
  conferir('N1: Ctrl+A não seleciona as notas (não dá para apagá-las sem ver)', sel === 0, `${sel} nota(s) na seleção`);
  // miniatura e PDF: desenho idêntico com e sem as notas
  const iguais = await page.evaluate(async () => {
    const PG = await import('/js/pages.js'), S = window.__lousa.S;
    const com = { ...S.board, items: S.items }, sem = { ...S.board, items: S.items.filter(i => i.type !== 'notaprof') };
    const a = (await PG.boardThumb(com)).toDataURL(), b = (await PG.boardThumb(sem)).toDataURL();
    const pa = (await PG.renderPage(com, 0, 1)).toDataURL(), pb = (await PG.renderPage(sem, 0, 1)).toDataURL();
    return [a === b, pa === pb];
  });
  conferir('N1: a miniatura e a página do PDF saem iguais com e sem as notas', iguais[0] && iguais[1], JSON.stringify(iguais));
  await ctx.close();
});

await cenario('N2', 'Notas acompanham a página: inserir, duplicar e excluir', async () => {
  await criar('n2', deck(3, [notaDe('na', 0, 'nota 1'), notaDe('nb', 1, 'nota 2'), notaDe('nc', 2, 'nota 3')]));
  const { ctx, page } = await janela();
  await abrir(page, 'n2');
  const mapa = async () => (await itens(page)).filter(i => i.type === 'notaprof').map(i => `${paginaDe(i) + 1}:${i.texto}`).sort().join(' ');
  await menuPagina(page, 'ins');   // nova página depois da página 1
  conferir('N2: inserir página depois da 1 leva as notas 2 e 3 junto', await mapa() === '1:nota 1 3:nota 2 4:nota 3', await mapa());
  await menuPagina(page, 'dup');   // a página atual é a nova (2), sem nota
  await page.keyboard.press('PageDown'); await espera(400);
  await menuPagina(page, 'dup');
  const m2 = await mapa();
  conferir('N2: duplicar uma página com nota copia a nota para a cópia', /:nota 2.*:nota 2/.test(m2), m2);
  await menuPagina(page, 'del');   // exclui a página 5, a cópia
  conferir('N2: excluir a página leva a nota dela junto', await mapa() === '1:nota 1 4:nota 2 5:nota 3', await mapa());
  await ctx.close();
});

await cenario('N3', 'Notas com uma tela e com duas', async () => {
  await criar('n3', deck(3, [notaDe('na', 0, 'nota da página 1'), notaDe('nb', 1, 'nota da página 2')]));
  {   // uma tela
    const { ctx, page } = await janela({ telas: false });
    await abrir(page, 'n3');
    let abriu = false; ctx.on('page', () => { abriu = true; });
    await page.click('#bPresent'); await espera(1200);
    const aviso = (await page.textContent('#toast').catch(() => '')) || '';
    conferir('N3: com uma tela, não abre a janela das notas e mostra o aviso', !abriu && /Win \+ P/.test(aviso), `janela aberta: ${abriu}; aviso: "${aviso.trim()}"`);
    await ctx.close();
  }
  {   // duas telas
    const { ctx, page } = await janela({ telas: true });
    await abrir(page, 'n3');
    const [notas] = await Promise.all([ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null), page.click('#bPresent')]);
    conferir('N3: com duas telas, a janela das notas abre', !!notas);
    if (notas) {
      await notas.waitForLoadState(); await espera(1200);
      const t1 = (await notas.textContent('#njTexto')).trim();
      conferir('N3: a janela mostra a nota da página 1', t1 === 'nota da página 1', `"${t1}"`);
      await notas.keyboard.press('ArrowRight'); await espera(900);
      const t2 = (await notas.textContent('#njTexto')).trim(), pg = await paginaAtual(page);
      conferir('N3: a seta na janela das notas passa o slide e a nota acompanha', pg === 1 && t2 === 'nota da página 2', `página ${pg + 1}; nota "${t2}"`);
      await page.keyboard.press('Escape'); await espera(1500);
      conferir('N3: ao sair da apresentação, a janela das notas fecha', notas.isClosed(), notas.isClosed() ? '' : `ainda aberta: "${(await notas.textContent('#njTitulo')).trim()}"`);
    }
    await ctx.close();
  }
});

// ============ marcadores ============
const marcador = (id, pg, extra = {}) => ({ id, nome: `Página ${pg + 1}`, cx: 640, cy: pg * passo + 360, w: 1280, pagina: pg + 1, criado: Date.now(), ordem: pg + 1, ...extra });
const textoNoPonto = (items, m, Lx) => items.find(i => i.type === 'text' && paginaDe(i, Lx) === paginaDe({ y: m.cy }, Lx))?.text;

await cenario('M1', 'Marcador depois de inserir ou excluir páginas', async () => {
  await criar('m1', deck(4));
  await api('POST', '/api/marcadores', { novos: [{ quadro: 'm1', marcador: marcador('mk3', 2) }] });
  const { ctx, page } = await janela();
  await abrir(page, 'm1');
  conferir('M1: no começo, o marcador "Página 3" aponta para o conteúdo da página 3', textoNoPonto(disco('m1').items, disco('m1').marcadores[0], L(4)) === 'Conteúdo da página 3');
  await menuPagina(page, 'ins'); await salvo(page); await espera(600);   // página nova depois da 1
  const b = disco('m1'), m = b.marcadores[0];
  conferir('M1: depois de inserir uma página antes dele, o marcador continua no conteúdo da página 3', textoNoPonto(b.items, m, b.layout) === 'Conteúdo da página 3',
    `aponta para "${textoNoPonto(b.items, m, b.layout) ?? '(página em branco)'}"; o nome e o número guardados seguem "${m.nome}", pág. ${m.pagina}`);
  await page.keyboard.press('PageDown'); await espera(300);
  await page.evaluate(() => window.__lousa.S && null);
  await ctx.close();
  // excluir a página do próprio marcador
  await criar('m1b', deck(4));
  await api('POST', '/api/marcadores', { novos: [{ quadro: 'm1b', marcador: marcador('mk2', 1) }] });
  const j2 = await janela();
  await abrir(j2.page, 'm1b');
  await j2.page.keyboard.press('PageDown'); await espera(500);
  await menuPagina(j2.page, 'del'); await salvo(j2.page); await espera(600);
  const b2 = disco('m1b');
  conferir('M1: excluir a página do marcador não deixa o marcador apontando para outra página', !b2.marcadores?.length || textoNoPonto(b2.items, b2.marcadores[0], b2.layout) !== 'Conteúdo da página 3',
    `o marcador "${b2.marcadores?.[0]?.nome}" agora aponta para "${b2.marcadores?.[0] && textoNoPonto(b2.items, b2.marcadores[0], b2.layout)}"`);
  await j2.ctx.close();
});

await cenario('M2', 'Marcadores na galeria: busca, renomear, apagar com Desfazer, arrastar', async () => {
  await criar('m2a', { ...deck(3), title: 'Física fictícia' });
  await criar('m2b', { ...deck(2), title: 'Química fictícia' });
  const grupos = [{ id: 'gA', nome: 'Revisão', cor: '#c50f1f', ordem: 1 }, { id: 'gB', nome: 'Prova', cor: '#0f6cbd', ordem: 2 }];
  await api('POST', '/api/marcadores', { grupos, novos: [
    { quadro: 'm2a', marcador: marcador('k1', 0, { nome: 'Página 1', grupo: 'gA', grupoNome: 'Revisão', cor: '#c50f1f' }) },
    { quadro: 'm2a', marcador: marcador('k2', 1, { nome: 'Exercício de ótica', grupo: 'gA', grupoNome: 'Revisão', cor: '#c50f1f' }) },
    { quadro: 'm2b', marcador: marcador('k3', 0, { nome: 'Tabela periódica' }) }] });
  const { ctx, page } = await janela();
  await page.goto(BASE + '/#/marcadores');
  await page.waitForSelector('.mk-card');
  const cartoes = async () => page.$$eval('.mk-card', cs => cs.map(c => c.querySelector('.mk-nm').textContent));
  await page.fill('#gSearch', 'otica'); await espera(300);
  conferir('M2: a busca sem acento acha "Exercício de ótica"', JSON.stringify(await cartoes()) === '["Exercício de ótica"]', JSON.stringify(await cartoes()));
  await page.fill('#gSearch', 'quimica'); await espera(300);
  conferir('M2: a busca pelo título do quadro acha o marcador dele', JSON.stringify(await cartoes()) === '["Tabela periódica"]', JSON.stringify(await cartoes()));
  await page.fill('#gSearch', ''); await espera(300);
  // renomear
  await page.click('.mk-card[data-mk="k3"] [data-a="nome"]');
  await page.fill('dialog[open] input', 'Tabela (renomeada)'); await page.click('dialog[open] [data-a="1"]'); await espera(700);
  conferir('M2: renomear grava o nome novo', disco('m2b').marcadores[0].nome === 'Tabela (renomeada)', disco('m2b').marcadores[0].nome);
  // apagar e Desfazer
  const antes = disco('m2a').marcadores.find(m => m.id === 'k2');
  await page.click('.mk-card[data-mk="k2"] [data-a="apagar"]'); await espera(700);
  const sumiu = !disco('m2a').marcadores.some(m => m.id === 'k2');
  await page.click('#toast button'); await espera(800);
  const voltou = disco('m2a').marcadores.find(m => m.id === 'k2');
  conferir('M2: apagar tira o marcador, e Desfazer o traz de volta igual (nome, grupo, ordem e ponto)', sumiu && voltou &&
    ['nome', 'grupo', 'ordem', 'cx', 'cy', 'w', 'pagina'].every(k => voltou[k] === antes[k]), JSON.stringify({ sumiu, voltou }));
  // arrastar o k3 (sem grupo) para o grupo Prova
  await page.dragAndDrop('.mk-card[data-mk="k3"]', '.mk-grupo[data-g="gB"]'); await espera(800);
  const k3 = disco('m2b').marcadores[0];
  conferir('M2: arrastar o cartão para o grupo Prova muda o grupo', k3.grupo === 'gB' && k3.grupoNome === 'Prova', JSON.stringify(k3));
  // arrastar para mudar a ordem dentro do grupo Revisão: k2 antes de k1
  await page.dragAndDrop('.mk-card[data-mk="k2"]', '.mk-card[data-mk="k1"]'); await espera(800);
  const ordem = await page.$$eval('.mk-grupo[data-g="gA"] .mk-card', cs => cs.map(c => c.dataset.mk));
  conferir('M2: arrastar k2 sobre k1 põe k2 antes', JSON.stringify(ordem) === '["k2","k1"]', JSON.stringify(ordem));
  conferir('M2: sem erros na página', !page.erros.length, page.erros.join(' | '));
  await ctx.close();
});

await cenario('M3', 'Quadro com muitos marcadores (500)', async () => {
  await criar('m3', deck(50));
  const novos = Array.from({ length: 500 }, (_, k) => ({ quadro: 'm3', marcador: marcador('x' + k, k % 50, { nome: `Marcador ${k + 1}`, ordem: k }) }));
  const r = await api('POST', '/api/marcadores', { novos });
  nota(`POST /api/marcadores com os 500 de uma vez (${JSON.stringify({ novos }).length} bytes): ${r.st} ${JSON.stringify(r.j)}`);
  const t0 = Date.now();
  for (let k = 0; k < 500; k += 100) await api('POST', '/api/marcadores', { novos: novos.slice(k, k + 100) });
  nota(`em 5 pedidos de 100: ${Date.now() - t0} ms; no disco: ${disco('m3').marcadores.length}`);
  const { ctx, page } = await janela();
  let t = Date.now(); await page.goto(BASE + '/#/marcadores'); await page.waitForSelector('.mk-card');
  const nCartoes = await page.$$eval('.mk-card', c => c.length);
  nota(`aba Marcadores com 500: ${nCartoes} cartões em ${Date.now() - t} ms`);
  t = Date.now(); await page.fill('#gSearch', 'Marcador 49'); await espera(50); const nb = await page.$$eval('.mk-card', c => c.length);
  nota(`busca "Marcador 49": ${nb} cartões, ${Date.now() - t} ms`);
  await abrir(page, 'm3');
  const fitas = await page.$$eval('#fitas .fita', f => f.length);
  const alturas = await page.$$eval('#fitas .fita', f => new Set(f.map(x => x.style.top)).size);
  nota(`no quadro: ${fitas} fitinhas, em ${alturas} alturas diferentes (cada fitinha ocupa a mesma borda)`);
  // a fitinha do meio ainda é clicável? (a de cima cobre as outras na mesma altura)
  const alcancaveis = await page.evaluate(() => [...document.querySelectorAll('#fitas .fita')].filter(f => {
    const r = f.getBoundingClientRect(); const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return el === f || f.contains(el);
  }).length);
  nota(`com 500 marcadores (10 por página): ${alcancaveis} de ${fitas} fitinhas alcançáveis pelo toque`);
  // o caso de uso: um marcador por página, num deck de 50 páginas (e de 20)
  for (const n of [20, 50, 100]) {
    const id = 'm3p' + n;
    await criar(id, deck(n));
    await api('POST', '/api/marcadores', { novos: Array.from({ length: n }, (_, k) => ({ quadro: id, marcador: marcador('y' + k, k) })) });
    await abrir(page, id);
    // quantos px de cada fitinha ficam à vista (não cobertos pela seguinte), medindo linha a linha
    const r = await page.evaluate(() => { const fs = [...document.querySelectorAll('#fitas .fita')];
      const vis = fs.map(f => { const b = f.getBoundingClientRect(); let v = 0;
        for (let y = Math.ceil(b.y); y < b.y + b.height; y++) { const el = document.elementFromPoint(b.x + b.width / 2, y); if (el === f || f.contains(el)) v++; } return v; });
      const h = fs[0]?.getBoundingClientRect().height;
      return { n: fs.length, menor: Math.min(...vis), alvo: vis.filter(v => v >= 24).length, altura: h, passo: fs.length > 1 ? fs[1].getBoundingClientRect().y - fs[0].getBoundingClientRect().y : 0 }; });
    conferir(`M3: deck de ${n} páginas com um marcador em cada: toda fitinha tem uma área de toque de pelo menos 24 px`, r.alvo === r.n,
      `${r.alvo} de ${r.n} com 24 px ou mais à vista; a menor tem ${r.menor} px à vista; cada fitinha tem ${r.altura?.toFixed(0)} px e a seguinte começa ${r.passo.toFixed(0)} px abaixo`);
  }
  await ctx.close();
});

await cenario('M4', 'Grupo com muitos marcadores (em vários quadros): arrastar e renomear o grupo', async () => {
  const grupos = [{ id: 'gG', nome: 'Revisão do ano', cor: '#107c10', ordem: 1 }];
  await api('POST', '/api/marcadores', { grupos });
  for (const q of ['m4a', 'm4b', 'm4c']) {
    await criar(q, deck(50));
    const novos = Array.from({ length: 400 }, (_, k) => ({ quadro: q, marcador: marcador(`${q}x${k}`, k % 50, { nome: `${q} ${k + 1}`, ordem: k, grupo: 'gG', grupoNome: 'Revisão do ano', cor: '#107c10' }) }));
    for (let k = 0; k < 400; k += 100) await api('POST', '/api/marcadores', { novos: novos.slice(k, k + 100) });
  }
  const { ctx, page } = await janela();
  await page.goto(BASE + '/#/marcadores'); await page.waitForSelector('.mk-card');
  nota(`grupo "Revisão do ano" com ${await page.$$eval('.mk-grupo[data-g="gG"] .mk-card', c => c.length)} marcadores, em 3 quadros`);
  const pedidos = [];
  page.on('response', async r => { if (r.url().endsWith('/api/marcadores') && r.request().method() === 'POST') pedidos.push({ st: r.status(), bytes: (r.request().postData() || '').length }); });
  const ordemAntes = disco('m4a').marcadores.find(m => m.id === 'm4ax5').ordem;
  await page.dragAndDrop('.mk-card[data-mk="m4ax5"]', '.mk-card[data-mk="m4ax0"]'); await espera(1500);
  const ordemDepois = disco('m4a').marcadores.find(m => m.id === 'm4ax5').ordem;
  const toast1 = ((await page.textContent('#toast').catch(() => '')) || '').trim();
  conferir('M4: arrastar um cartão dentro de um grupo grande muda a ordem', ordemDepois !== ordemAntes,
    `pedido: ${JSON.stringify(pedidos.at(-1))}; ordem ${ordemAntes} → ${ordemDepois}; aviso: "${toast1}"`);
  await page.click('.mk-grupo[data-g="gG"] [data-ga="nome"]');
  await page.fill('dialog[open] input', 'Revisão final'); await page.click('dialog[open] [data-a="1"]'); await espera(1500);
  const nomeNoDisco = disco('m4c').marcadores[0].grupoNome, toast2 = ((await page.textContent('#toast').catch(() => '')) || '').trim();
  conferir('M4: renomear um grupo grande muda o nome nos marcadores', nomeNoDisco === 'Revisão final',
    `pedido: ${JSON.stringify(pedidos.at(-1))}; grupoNome no disco: "${nomeNoDisco}"; aviso: "${toast2}"`);
  await ctx.close();
});

// ============ colar onde a caneta tocou, esconder, paradas ============
const png1 = 'iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAIAAABM5OhcAAAAeklEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8GqA8AAFXgYVqAAAAAElFTkSuQmCC';
async function colar(page, tipo) {
  await page.evaluate(async ({ tipo, b64 }) => {
    const dt = new DataTransfer();
    if (tipo === 'imagem') { const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); dt.items.add(new File([bin], 'colada.png', { type: 'image/png' })); }
    else dt.setData('text/plain', 'Texto colado fictício');
    document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, { tipo, b64: png1 });
  await espera(1200);
}
await cenario('C1', 'Colar onde a caneta tocou', async () => {
  await criar('c1', { title: 'Colar', items: [] });
  const { ctx, page } = await janela();
  await abrir(page, 'c1');
  await page.keyboard.press('v'); await page.mouse.click(300, 260); await espera(200);
  const mundo = await page.evaluate(() => { const v = window.__lousa.S.view, r = document.getElementById('ov').getBoundingClientRect(); return { x: (300 - r.x - v.x) / v.zoom, y: (260 - r.y - v.y) / v.zoom }; });
  await colar(page, 'imagem');
  const im = (await itens(page)).find(i => i.type === 'image');
  conferir('C1: a imagem colada fica com o canto onde a caneta tocou', im && Math.abs(im.x - mundo.x) < 2 && Math.abs(im.y - mundo.y) < 2, `toque em ${mundo.x.toFixed(0)},${mundo.y.toFixed(0)}; imagem em ${im?.x?.toFixed(0)},${im?.y?.toFixed(0)}`);
  // toque perto da borda direita: a imagem (200 px) passa da tela?
  await page.mouse.click(LARG - 300, 400); await espera(200);   // perto da borda, à esquerda da barra do professor
  await colar(page, 'imagem');
  const ims = (await itens(page)).filter(i => i.type === 'image'), ult = ims.at(-1);
  const fora = await page.evaluate(it => { const v = window.__lousa.S.view, W = document.getElementById('ov').clientWidth; return (it.x + it.w) * v.zoom + v.x - W; }, ult);
  nota(`toque a 300 px da borda direita: imagem de ${ult.w.toFixed(0)} px colada com o canto no toque; passa ${Math.max(0, fora).toFixed(0)} px para fora da tela`);
  // texto colado: no ponto também?
  await page.mouse.click(400, 500); await espera(200);
  const m2 = await page.evaluate(() => { const v = window.__lousa.S.view, r = document.getElementById('ov').getBoundingClientRect(); return { x: (400 - r.x - v.x) / v.zoom, y: (500 - r.y - v.y) / v.zoom }; });
  await colar(page, 'texto');
  const tx = (await itens(page)).find(i => i.type === 'text');
  conferir('C1: o texto colado também vai para onde a caneta tocou', tx && Math.abs(tx.x - m2.x) < 2 && Math.abs(tx.y - m2.y) < 60, `toque em ${m2.x.toFixed(0)},${m2.y.toFixed(0)}; texto em ${tx?.x?.toFixed(0)},${tx?.y?.toFixed(0)}`);
  await ctx.close();
});

await cenario('E1', 'Esconder até a aula e revelar', async () => {
  await criar('e1', { title: 'Esconder', items: [texto('a', 0, 'Pergunta fictícia'), { id: 'b', type: 'text', x: 200, y: 450, w: 700, text: 'Resposta escondida', color: '#000000', size: 48 }] });
  const { ctx, page } = await janela();
  await abrir(page, 'e1');
  await page.keyboard.press('v');
  const alvo = await page.evaluate(() => { const v = window.__lousa.S.view, r = document.getElementById('ov').getBoundingClientRect(); return { x: r.x + 400 * v.zoom + v.x, y: r.y + 470 * v.zoom + v.y }; });
  await page.mouse.click(alvo.x, alvo.y); await espera(300);
  await page.click('#selbar [data-sel="esconder"]'); await espera(400);
  const b = (await itens(page)).find(i => i.id === 'b');
  conferir('E1: o item escondido ganha a ordem de revelar', b?.revelar === 1, JSON.stringify(b?.revelar));
  await page.keyboard.press('Control+a'); await espera(200);
  conferir('E1: Ctrl+A não pega o escondido', !(await page.evaluate(() => window.__lousa.sel.has('b'))));
  await page.mouse.click(alvo.x, alvo.y); await espera(200);
  conferir('E1: tocar onde ele está não o seleciona', !(await page.evaluate(() => window.__lousa.sel.has('b'))));
  await salvo(page); await espera(600);
  conferir('E1: no disco, ele continua salvo e marcado', disco('e1').items.find(i => i.id === 'b')?.revelar === 1);
  await page.click('#bPresent'); await espera(800);
  await page.keyboard.press('r'); await espera(500);
  conferir('E1: R na apresentação revela', (await itens(page)).find(i => i.id === 'b')?.revelar == null);
  await page.keyboard.press('Escape'); await espera(600);
  await ctx.close();
});

await cenario('E2', 'Revelar na apresentação com escondidos em vários slides', async () => {
  // a resposta do slide 3 foi escondida antes da do slide 1 (o professor preparou o fim da aula primeiro)
  await criar('e2', deck(3, [{ ...texto('r3', 2, 'Resposta do slide 3'), y: 2 * passo + 500, revelar: 1 }, { ...texto('r1', 0, 'Resposta do slide 1'), y: 500, revelar: 2 }]));
  const { ctx, page } = await janela();
  await abrir(page, 'e2');
  await page.click('#bPresent'); await espera(900);
  const pg = await paginaAtual(page);
  await page.keyboard.press('r'); await espera(500);
  const it = await itens(page), r1 = it.find(i => i.id === 'r1'), r3 = it.find(i => i.id === 'r3');
  conferir('E2: no slide 1, R revela a resposta que está na tela (a do slide 1)', r1.revelar == null && r3.revelar != null,
    `na tela: slide ${pg + 1}; depois do R: resposta do slide 1 ${r1.revelar == null ? 'revelada' : 'ainda escondida'}, resposta do slide 3 ${r3.revelar == null ? 'REVELADA (fora da tela)' : 'escondida'}`);
  await page.keyboard.press('Escape'); await espera(500);
  await ctx.close();
});

await cenario('P1', 'Roteiro de paradas: ordem de leitura', async () => {
  const { paradas } = await import(pathToFileURL(join(RAIZ, 'app/js/paradas.js')).href);
  // três prints em escada: A e B na mesma linha, B e C na mesma linha, A abaixo de C
  const A = { id: 'A', type: 'image', x: 0, y: 80, w: 300, h: 100 }, B = { id: 'B', type: 'image', x: 500, y: 40, w: 300, h: 100 }, C = { id: 'C', type: 'image', x: 1000, y: 0, w: 300, h: 100 };
  const ordens = new Set([[A, B, C], [C, B, A], [B, A, C], [A, C, B], [B, C, A], [C, A, B]].map(p => paradas(p).map(i => i.id).join('')));
  conferir('P1: a ordem das paradas não depende da ordem em que as imagens foram postas no quadro', ordens.size === 1, `ordens obtidas: ${[...ordens].join(', ')}`);
  await criar('p1', { title: 'Paradas', items: [A, B, C].map(i => ({ ...i, src: 'data:image/png;base64,' + png1 })) });
  const { ctx, page } = await janela();
  await abrir(page, 'p1');
  const visto = [];
  for (let k = 0; k < 3; k++) {
    await page.click('#zParProx'); await espera(700);
    visto.push(await page.evaluate(() => { const v = window.__lousa.S.view, W = document.getElementById('ov').clientWidth, H = document.getElementById('ov').clientHeight;
      const cx = (W / 2 - v.x) / v.zoom, cy = (H / 2 - v.y) / v.zoom;
      return window.__lousa.S.items.find(i => cx >= i.x && cx <= i.x + i.w && cy >= i.y && cy <= i.y + i.h)?.id || '?'; }));
  }
  // o mesmo quadro depois de "Trazer para a frente" a imagem A (só muda a ordem de desenho, não o lugar)
  await page.keyboard.press('v');
  const ptA = await page.evaluate(() => { const v = window.__lousa.S.view, r = document.getElementById('ov').getBoundingClientRect(); return { x: r.x + 150 * v.zoom + v.x, y: r.y + 130 * v.zoom + v.y }; });
  await page.click('#zFit').catch(() => {}); await espera(500);
  const ptA2 = await page.evaluate(() => { const v = window.__lousa.S.view, r = document.getElementById('ov').getBoundingClientRect(); return { x: r.x + 150 * v.zoom + v.x, y: r.y + 130 * v.zoom + v.y }; });
  await page.mouse.click(ptA2.x, ptA2.y); await espera(300);
  await page.click('#selbar [data-sel="front"]'); await espera(300);
  await page.keyboard.press('Escape'); await salvo(page); await espera(500);
  await page.goto(BASE + '/#/'); await page.waitForSelector('#gallery:not([hidden])');
  await abrir(page, 'p1');   // reabre (passando pela galeria): o roteiro começa do zero
  const depois = [];
  nota(`roteiro calculado depois de trazer A para a frente: ${await page.evaluate(async () => (await import('/js/paradas.js')).paradas(window.__lousa.S.items).map(i => i.id).join(' → '))}; ordem dos itens: ${await page.evaluate(() => window.__lousa.S.items.map(i => i.id).join(','))}`);
  for (let k = 0; k < 3; k++) {
    await page.click('#zParProx'); await espera(700);
    nota(`  rótulo depois do ▶: ${(await page.textContent('#zParLbl')).trim()}`);
    depois.push(await page.evaluate(() => { const v = window.__lousa.S.view, W = document.getElementById('ov').clientWidth, H = document.getElementById('ov').clientHeight;
      const cx = (W / 2 - v.x) / v.zoom, cy = (H / 2 - v.y) / v.zoom;
      return window.__lousa.S.items.find(i => cx >= i.x && cx <= i.x + i.w && cy >= i.y && cy <= i.y + i.h)?.id || '?'; }));
  }
  conferir('P1: na tela, "Trazer para a frente" não muda o roteiro', depois.join('') === visto.join(''), `antes: ${visto.join(' → ')}; depois de trazer A para a frente: ${depois.join(' → ')}`);
  await ctx.close();
});

// ============ barra da apresentação, setas, marca-texto ============
await cenario('B1', 'Tecla N (Folha) na apresentação de um quadro sem páginas', async () => {
  await criar('b1', { title: 'Livre', items: [texto('a', 0, 'Quadro livre fictício')] });
  const { ctx, page } = await janela();
  await abrir(page, 'b1');
  await page.click('#bPresent'); await espera(800);
  await page.keyboard.press('n'); await espera(500);
  conferir('B1: N no quadro livre não dá erro', !page.erros.length, page.erros.join(' | '));
  await ctx.close();
});

await cenario('B2', 'Bolinha da apresentação: cor e espessura juntas', async () => {
  await criar('b2', deck(2));
  const { ctx, page } = await janela();
  await abrir(page, 'b2');
  await page.click('#bPresent'); await espera(800);
  await page.click('#ppColor'); await espera(300);
  await page.click('#pop [data-c="#e81224"]').catch(() => page.click('#pop [data-c]:nth-child(3)'));
  const cor = await page.$eval('#pop [data-c].on', b => b.dataset.c).catch(() => null);
  const larg = await page.$$eval('#pop [data-w]', bs => bs.map(b => +b.dataset.w));
  await page.click(`#pop [data-w="${larg.at(-1)}"]`); await espera(200);
  await page.mouse.click(LARG - 20, 20); await espera(300);
  await page.mouse.move(300, 300); await page.mouse.down(); await page.mouse.move(600, 340, { steps: 8 }); await page.mouse.up(); await espera(300);
  const s = (await itens(page)).filter(i => i.type === 'stroke').at(-1);
  const z = await page.evaluate(() => window.__lousa.S.view.zoom);
  conferir('B2: o traço sai com a cor e a espessura escolhidas', s && s.color === cor && Math.abs(s.width * z - larg.at(-1)) < 0.6,
    `escolhido ${cor}, ${larg.at(-1)} px; traço ${s?.color}, ${(s?.width * z).toFixed(2)} px na tela`);
  await ctx.close();
});

await cenario('B3', 'Setas com o quadro ampliado', async () => {
  await criar('b3', { title: 'Setas', items: [texto('a', 0, 'Quadro fictício')] });
  const { ctx, page } = await janela();
  await abrir(page, 'b3');
  const deslocar = async (zoom, shift) => {
    await page.evaluate(z => { const S = window.__lousa.S; S.view = { ...S.view, zoom: z }; }, zoom);
    const x0 = await page.evaluate(() => window.__lousa.S.view.x);
    await page.keyboard.press(shift ? 'Shift+ArrowLeft' : 'ArrowLeft'); await espera(250);
    return (await page.evaluate(() => window.__lousa.S.view.x)) - x0;
  };
  const r = {};
  for (const z of [1, 4]) for (const sh of [false, true]) r[`zoom ${z}${sh ? ' + Shift' : ''}`] = Math.round(await deslocar(z, sh));
  nota(`deslocamento da lousa por toque de seta (px de tela): ${JSON.stringify(r)}`);
  conferir('B3: com zoom 4 a seta anda menos que com zoom 1', Math.abs(r['zoom 4']) < Math.abs(r['zoom 1']));
  conferir('B3: com Shift anda mais', Math.abs(r['zoom 1 + Shift']) > Math.abs(r['zoom 1']));
  await ctx.close();
});

await cenario('H1', 'Marca-texto: intensidade e Shift para traço reto', async () => {
  await criar('h1', { title: 'Marca-texto', items: [] });
  const { ctx, page } = await janela();
  await abrir(page, 'h1');
  await page.click('#inkbar [data-tool="highlighter"]'); await espera(200);
  await page.keyboard.down('Shift');
  await page.mouse.move(200, 300); await page.mouse.down();
  for (let k = 1; k <= 20; k++) await page.mouse.move(200 + k * 20, 300 + Math.sin(k / 3) * 60);
  await page.mouse.up(); await page.keyboard.up('Shift'); await espera(300);
  const s = (await itens(page)).filter(i => i.type === 'stroke').at(-1);
  conferir('H1: com Shift segurado desde o começo, o traço é reto (2 pontos)', s?.tool === 'highlighter' && s.pts.length === 6, `${s?.tool}, ${s ? s.pts.length / 3 : 0} pontos`);
  // Shift apertado no meio do traço
  await page.mouse.move(200, 500); await page.mouse.down();
  for (let k = 1; k <= 10; k++) await page.mouse.move(200 + k * 20, 500 + Math.sin(k / 3) * 60);
  await page.keyboard.down('Shift');
  for (let k = 11; k <= 20; k++) await page.mouse.move(200 + k * 20, 500 + Math.sin(k / 3) * 60);
  await page.mouse.up(); await page.keyboard.up('Shift'); await espera(300);
  const s2 = (await itens(page)).filter(i => i.type === 'stroke').at(-1);
  nota(`Shift apertado no meio do traço: ${s2 ? s2.pts.length / 3 : 0} pontos`);
  conferir('H1: sem erros na página', !page.erros.length, page.erros.join(' | '));
  await ctx.close();
});

await browser.close().catch(() => {});
servidor.kill('SIGKILL');
await espera(300);
try { rmSync(tmp, { recursive: true, force: true }); } catch {}
console.log(`\n${ok} passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
