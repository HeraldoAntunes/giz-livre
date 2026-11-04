// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Validação no Linux, de ponta a ponta, com o Playwright (sem janela). Só dados fictícios, numa pasta temporária.
// Rodar:  node tests/linux/e2e_linux.mjs [chromium|firefox]   (padrão: chromium)
//   RECARREGAR=1               na queda, clica em "Recarregar" na faixa antes de abrir o programa de novo (variante)
//   MANTER=1                   não apaga a pasta temporária no fim
//   PYTHON=caminho/do/python   (padrão: python3)
//   GIZ_FIREFOX=caminho        Firefox comum (não o do Playwright), dirigido pelo WebDriver BiDi
//   PLAYWRIGHT=caminho         pasta do pacote playwright, se não estiver instalado no projeto nem global
// Roteiro: criar quadro e desenhar; texto, fórmula LaTeX e forma; salvar, fechar e reabrir; exportar PDF; importar
// um backup ("Levar quadros", zip feito pelo próprio programa); matar o servidor no meio de uma gravação e reabrir.
// Desde a 1.16.0 nenhuma rota de dados responde sem o código da conta: o teste lê o código no arquivo de conexão
// (<dados>/.agente/conexao.json) e abre cada janela com uma chave de uso único (?k=), como o server.py faz no Linux.
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigo } from '../acesso.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const NAV = process.argv[2] || 'chromium';
const PY = process.env.PYTHON || 'python3';
const espera = ms => new Promise(r => setTimeout(r, ms));

function carregarPlaywright() {
  const req = createRequire(import.meta.url);
  const lugares = [process.env.PLAYWRIGHT, 'playwright'];
  try { lugares.push(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright')); } catch {}
  for (const l of lugares.filter(Boolean)) { try { return req(l); } catch {} }
  throw new Error('Playwright não encontrado (npm i -D playwright, ou PLAYWRIGHT=pasta)');
}

// ---------------- relatório ----------------
let ok = 0, falhas = 0;
const linhas = [];
function conferir(nome, cond, detalhe = '') {
  const l = cond ? `  ✓ ${nome}` : `  ✗ ${nome}${detalhe ? ': ' + detalhe : ''}`;
  cond ? ok++ : falhas++;
  linhas.push(l); console.log(l);
  return cond;
}
const etapa = t => { linhas.push('', t); console.log('\n' + t); };

// ---------------- servidor ----------------
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const pastaTmp = mkdtempSync(join(tmpdir(), 'giz-linux-'));
const DADOS = join(pastaTmp, 'quadros');
let PORTA, BASE, servidor, TOKEN;
// pedido ao servidor com o código da conta (como o Giz na Tela e o MCP fazem)
const api = (rota, op = {}) => fetch(BASE + rota, { ...op, headers: { 'X-Lousa': TOKEN, ...(op.headers || {}) } });
// chave de abertura de uso único, como a que o server.py põe no endereço da janela que abre
const chave = async () => (await (await api('/api/chave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json()).k;

async function subirServidor(dados = DADOS, porta = PORTA) {
  const proc = spawn(PY, [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(porta), '--dados', dados],
    { cwd: RAIZ, stdio: 'ignore', env: { ...process.env, GIZ_SEM_DIARIO: '1' } });
  const base = `http://127.0.0.1:${porta}`;
  for (let t = 0; t < 100; t++) {
    try {
      const c = JSON.parse(readFileSync(join(dados, '.agente', 'conexao.json'), 'utf8'));
      if (c.pid === proc.pid && c.porta === porta) {
        const token = await codigo(base, dados);
        const info = await (await fetch(base + '/api/info', { headers: { 'X-Lousa': token } })).json();
        return { proc, base, token, info };
      }
    } catch {}
    await espera(100);
  }
  proc.kill('SIGKILL');
  throw new Error('o servidor não abriu na porta ' + porta);
}
const quadroNoDisco = id => JSON.parse(readFileSync(join(DADOS, id + '.json'), 'utf8'));

// ---------------- navegador ----------------
const pw = carregarPlaywright();
async function abrirNavegador() {
  if (NAV === 'firefox') {
    const exe = process.env.GIZ_FIREFOX;
    // sem GIZ_FIREFOX: o Firefox do próprio Playwright
    return exe ? pw.firefox.launch({ channel: 'moz-firefox', executablePath: exe, headless: true }) : pw.firefox.launch({ headless: true });
  }
  return pw.chromium.launch({ headless: true, args: process.getuid?.() === 0 ? ['--no-sandbox'] : [] });
}

let browser;
const errosConsole = [];
async function novoContexto() {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true, locale: 'pt-BR' });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('lousa.abas', '{"ocultas":[],"escolhido":true}');   // pula "Quais áreas te interessam?"
      localStorage.setItem('lousa.ajuda', '{"tourVisto":true}');                 // pula o tour do quadro
    } catch {}
    delete window.showSaveFilePicker;   // "Guardar todos" baixa pelo <a download>, como no Firefox
  });
  return ctx;
}
// janela nova, aberta como o programa abre: endereço com a chave (?k=) que a página troca pelo cookie de acesso.
// `ctx`: o mesmo perfil do navegador (o Giz Livre aberto de novo no Linux usa o perfil do usuário, igual à anterior)
async function novaPagina(ctx = null, hash = '') {
  ctx ??= await novoContexto();
  const page = await ctx.newPage();
  page.on('pageerror', e => errosConsole.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errosConsole.push(m.text()); });
  await page.goto(`${BASE}/?k=${await chave()}${hash}`);
  return page;
}
const itens = page => page.evaluate(() => (window.__lousa?.S?.items || []).map(i => ({ type: i.type, kind: i.kind, text: i.text, latex: i.latex })));
const esperarSalvo = page => page.waitForFunction(() => document.getElementById('bStatus')?.textContent.trim() === 'Salvo', null, { timeout: 15000 });
async function desenhar(page, x, y, dx = 220, dy = 60) {
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy, { steps: 12 }); await page.mouse.move(x + dx, y, { steps: 12 });
  await page.mouse.up();
}

let page, ID;
try {
  PORTA = await portaLivre();
  ({ proc: servidor, base: BASE, token: TOKEN } = await subirServidor());
  browser = await abrirNavegador();
  const nomeNav = `${NAV} ${browser.version()}`;
  etapa(`Giz Livre no Linux: ${nomeNav}, Python do servidor: ${execSync(`${PY} --version`, { encoding: 'utf8' }).trim()}`);
  page = await novaPagina();

  // ---- 1. criar um quadro e desenhar ----
  etapa('1. Criar um quadro e desenhar');
  await page.waitForSelector('#gallery:not([hidden])');
  conferir('a chave de uso único saiu do endereço', !/[?&]k=/.test(page.url()), page.url());
  conferir('a galeria abriu', true);
  await page.click('#gNew');
  await page.click('#pop [data-k="free"]');
  await page.waitForSelector('#board:not([hidden])');
  ID = (await page.evaluate(() => location.hash)).replace('#/b/', '');
  conferir('quadro novo criado e aberto', /^[A-Za-z0-9_-]+$/.test(ID), ID);
  await espera(600);
  await desenhar(page, 400, 300);
  await desenhar(page, 400, 380, 260, -40);
  const tracos = (await itens(page)).filter(i => i.type === 'stroke').length;
  conferir('dois traços de caneta no quadro', tracos === 2, `${tracos} traços`);

  // ---- 2. texto, fórmula e forma ----
  etapa('2. Texto, fórmula LaTeX e forma');
  await page.click('#createbar [data-create="text"]');
  await page.mouse.click(420, 520);
  await page.waitForSelector('#textEdit:not([hidden])');
  await page.keyboard.type('Aula de teste: velocidade média');
  await page.keyboard.press('Escape');
  await espera(300);
  conferir('texto escrito', (await itens(page)).some(i => i.type === 'text' && i.text === 'Aula de teste: velocidade média'));

  await page.click('#teachbar [data-k="formula"]');   // botão "Fórmula" da barra do professor
  await page.waitForSelector('dialog.formula[open] #fxIn');
  await page.fill('dialog.formula #fxIn', 'v_m = \\frac{\\Delta s}{\\Delta t}');
  await espera(800);
  const erroFx = await page.textContent('dialog.formula #fxErr').catch(() => '');
  await page.click('dialog.formula [data-a="ok"]');
  await page.waitForFunction(() => (window.__lousa?.S?.items || []).some(i => i.latex), null, { timeout: 15000 }).catch(() => {});
  const fx = (await itens(page)).find(i => i.latex);
  conferir('fórmula LaTeX inserida como imagem', !!fx, `erro no diálogo: ${erroFx || 'nenhum'}`);

  await page.click('#drawbar [data-k="rect"]');
  await page.mouse.move(800, 300); await page.mouse.down();
  await page.mouse.move(950, 420, { steps: 10 }); await page.mouse.up();
  await page.keyboard.press('Escape');
  conferir('retângulo desenhado', (await itens(page)).some(i => i.type === 'shape' && i.kind === 'rect'));
  await page.click('#drawbar [data-k="ellipse"]');
  await page.mouse.move(800, 500); await page.mouse.down();
  await page.mouse.move(900, 580, { steps: 10 }); await page.mouse.up();
  await page.keyboard.press('Escape');
  conferir('elipse desenhada', (await itens(page)).some(i => i.type === 'shape' && i.kind === 'ellipse'));

  // ---- 3. salvar, fechar e reabrir ----
  etapa('3. Salvar, fechar e reabrir');
  await esperarSalvo(page);
  conferir('o quadro mostra "Salvo"', true);
  const noDisco = quadroNoDisco(ID).items || [];
  conferir('no disco: 2 traços, texto, fórmula e 2 formas',
    noDisco.filter(i => i.type === 'stroke').length === 2 && noDisco.some(i => i.type === 'text') && noDisco.some(i => i.latex) &&
    noDisco.filter(i => i.type === 'shape').length === 2, noDisco.map(i => i.type).join(','));
  await page.click('#bBack');
  await page.waitForSelector('#gallery:not([hidden])');
  await page.context().close();
  page = await novaPagina();                    // janela nova, como quem fecha e abre o programa
  await page.waitForSelector(`#gGrid .card[data-id="${ID}"]`);
  await page.click(`#gGrid .card[data-id="${ID}"] .meta`);
  await page.waitForSelector('#board:not([hidden])');
  await page.waitForFunction(() => (window.__lousa?.S?.items || []).length > 0);
  const reaberto = await itens(page);
  conferir('reaberto com os 6 itens', reaberto.length === 6, reaberto.map(i => i.type).join(','));
  const fxImg = reaberto.find(i => i.latex);
  const src = await page.evaluate(() => window.__lousa.S.items.find(i => i.latex)?.src);
  conferir('a imagem da fórmula volta do servidor', fxImg && (await api(src)).ok, src);
  conferir('sem o código, a imagem não sai do servidor', (await fetch(BASE + src)).status === 401);

  // ---- 4. exportar PDF ----
  etapa('4. Exportar PDF');
  await page.click('#bMenu');
  const [down] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#pop [data-a="pdf"]')]);
  const pdf = join(pastaTmp, 'exportado.pdf');
  await down.saveAs(pdf);
  const cab = readFileSync(pdf);
  conferir('PDF baixado', cab.subarray(0, 5).toString() === '%PDF-' && cab.length > 2000, `${down.suggestedFilename()}, ${cab.length} bytes`);

  // ---- 5. importar um backup ----
  etapa('5. Importar um backup (zip do "Levar quadros" feito em outra pasta)');
  const outra = await subirServidor(join(pastaTmp, 'outro-pc'), await portaLivre());
  const H = { 'X-Lousa': outra.token, 'Content-Type': 'application/json' };
  await fetch(outra.base + '/api/boards/backupficticio1', { method: 'PUT', headers: H, body: JSON.stringify({ revision: 0, board: {
    version: 2, title: 'Backup fictício: frações', background: { color: '#ffffff', pattern: 'none' },
    items: [{ id: 'a1', type: 'text', x: 20, y: 40, w: 300, text: '1/2 + 1/4 = 3/4', color: '#000000', size: 28 },
            { id: 'a2', type: 'stroke', tool: 'pen', color: '#1971c2', width: 3, pts: [0, 100, .5, 200, 120, .5] }] } }) });
  const zip = Buffer.from(await (await fetch(outra.base + '/api/pacote', { headers: { 'X-Lousa': outra.token } })).arrayBuffer());
  outra.proc.kill();
  const arqZip = join(pastaTmp, 'backup-ficticio.zip');
  writeFileSync(arqZip, zip);
  conferir('backup fictício gerado pelo próprio programa', zip.subarray(0, 2).toString() === 'PK', `${zip.length} bytes`);
  await page.click('#bBack');
  await page.waitForSelector('#gallery:not([hidden])');
  await page.click('#gLevar');
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('dialog[open] [data-a="trazer"]')]);
  await fc.setFiles(arqZip);
  await page.waitForSelector('dialog[open] .lv-saida :is(b, .lv-erro)', { timeout: 15000 }).catch(() => {});
  const saida = (await page.textContent('dialog[open] .lv-saida').catch(() => '')) || '';
  conferir('o diálogo diz que 1 quadro foi trazido', /1\s*quadro\(s\) trazido/.test(saida), saida.trim());
  await page.click('dialog[open] [data-a="fechar"]').catch(() => {});
  const lista = await (await api('/api/boards')).json();
  conferir('o quadro do backup aparece na lista', lista.some(q => q.title?.startsWith('Backup fictício')), lista.map(q => q.title).join(' | '));

  // "Guardar todos": o backup na direção contrária, pelo navegador
  await page.click('#gLevar');
  const [down2] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('dialog[open] [data-a="guardar"]')]);
  const zip2 = join(pastaTmp, 'guardado.zip');
  await down2.saveAs(zip2);
  conferir('"Guardar todos" baixa o zip', readFileSync(zip2).subarray(0, 2).toString() === 'PK', down2.suggestedFilename());
  await page.click('dialog[open] [data-a="fechar"]').catch(() => {});

  // ---- 6. matar o servidor no meio de uma gravação ----
  etapa('6. Matar o servidor no meio de uma gravação e reabrir');
  await page.click(`#gGrid .card[data-id="${ID}"] .meta`);
  await page.waitForSelector('#board:not([hidden])');
  await page.waitForFunction(() => (window.__lousa?.S?.items || []).length >= 6);
  const antes = quadroNoDisco(ID).items.length;
  // o servidor morre (SIGKILL, como falta de luz) assim que o PUT do quadro sai do navegador
  let morto = false;
  page.on('request', r => {
    if (!morto && r.method() === 'PUT' && r.url().endsWith('/api/boards/' + ID)) { morto = true; servidor.kill('SIGKILL'); }
  });
  await page.click('#inkbar [data-tool="pen0"]');   // depois da forma a ferramenta ficou em "selecionar"
  await desenhar(page, 300, 650, 300, 40);
  for (let t = 0; t < 50 && !morto; t++) await espera(100);
  conferir('o servidor foi morto durante a gravação', morto);
  await espera(1500);
  const status = (await page.textContent('#bStatus')).trim();
  conferir('a página avisa que não salvou', /erro|tentando/i.test(status) || await page.isVisible('#saveErr'), status);
  let integro = true, detalhe = '';
  try { detalhe = `${quadroNoDisco(ID).items.length} itens`; } catch (e) { integro = false; detalhe = e.message; }
  conferir('o arquivo do quadro continua inteiro (JSON válido)', integro, detalhe);
  conferir('o quadro no disco não perdeu nada do que já estava salvo', integro && quadroNoDisco(ID).items.length >= antes, detalhe);
  const tmps = readdirSync(DADOS).filter(n => n.endsWith('.tmp'));
  linhas.push(`    (temporários deixados na pasta: ${tmps.length ? tmps.join(', ') : 'nenhum'})`);

  // o servidor volta na mesma porta e pasta, mas sem janela nova (--sem-janela): no Linux não há a janela própria do
  // Windows para entregar o cookie novo; a página antiga só tem o cookie do servidor que morreu
  ({ proc: servidor, token: TOKEN } = await subirServidor());
  conferir('o servidor reabriu com a mesma pasta e a mesma porta', true);
  await espera(9000);   // a página tenta gravar de novo a cada 4 s
  const bannerA = await page.locator('#banner').isVisible().catch(() => false);
  const statusA = (await page.textContent('#bStatus')).trim();
  const textoA = bannerA ? (await page.textContent('#banner span').catch(() => '')).trim() : '';
  const depoisA = quadroNoDisco(ID).items.length;
  linhas.push(`    (servidor de volta sem janela nova: status "${statusA}", faixa: ${bannerA ? '"' + textoA + '"' : 'não'}, itens no disco: ${depoisA}, antes: ${antes})`);
  console.log(linhas.at(-1));

  if (process.env.RECARREGAR && bannerA) {
    // variante (RECARREGAR=1): o professor segue a faixa e clica em "Recarregar" antes de abrir o programa de novo
    let perguntou = '';
    page.once('dialog', d => { perguntou = d.type(); d.accept(); });   // "sair da página?": o professor confirma
    await page.click('#banner button');
    await espera(3000);
    const tela = await page.locator('#banner').isVisible() ? (await page.textContent('#banner span')).trim() : 'sem faixa';
    linhas.push(`    (RECARREGAR: o navegador perguntou antes de sair: ${perguntou || 'não'}; faixa depois de recarregar: "${tela}")`);
    console.log(linhas.at(-1));
  }
  // o que o professor faz no Linux: abre o Giz Livre de novo (./giz-livre.sh). O programa já está no ar, então abre
  // outra janela no mesmo navegador e perfil, com uma chave nova: a página troca a chave pelo cookie novo, que vale
  // também para a página antiga
  const outraJanela = await novaPagina(page.context());
  await outraJanela.waitForSelector('#gallery:not([hidden])');
  let depois = depoisA;
  for (let t = 0; t < 60 && depois !== antes + 1; t++) { await espera(250); depois = quadroNoDisco(ID).items.length; }
  await espera(500);
  const banner = await page.locator('#banner').isVisible().catch(() => false);
  const statusDepois = (await page.textContent('#bStatus')).trim();
  linhas.push(`    (depois de abrir outra janela: status "${statusDepois}", faixa de recarregar: ${banner ? 'sim' : 'não'}, itens no disco: ${depois})`);
  console.log(linhas.at(-1));
  conferir('o traço feito durante a queda chegou ao disco sem recarregar a página', depois === antes + 1,
    `itens no disco: ${depois} (esperado ${antes + 1}); status "${statusDepois}"`);
  conferir('a faixa de recarregar sumiu e o quadro mostra "Salvo"', !banner && statusDepois === 'Salvo', `faixa: ${banner}; status "${statusDepois}"`);
  await outraJanela.close();
  const p2 = await novaPagina(null, `#/b/${ID}`);
  await p2.waitForFunction(() => (window.__lousa?.S?.items || []).length > 0, null, { timeout: 15000 });
  const final = (await itens(p2)).length;
  conferir('reaberto depois da queda sem perder o quadro', final >= antes, `${final} itens (antes da queda: ${antes})`);
  conferir('nem o traço feito durante a queda se perdeu', final === antes + 1, `${final} itens, esperado ${antes + 1}`);

  const relevantes = errosConsole.filter(e => !/Failed to load resource|NetworkError|net::ERR|fetch|ECONNREFUSED|409|CONFLICT/i.test(e));
  conferir('console sem erros além dos da queda do servidor', relevantes.length === 0, relevantes.slice(0, 5).join(' | '));
} catch (e) {
  falhas++; const l = '  ✗ o teste parou: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' / ');
  linhas.push(l); console.log(l);
  try { await page?.screenshot({ path: join(pastaTmp, 'parou.png') }); linhas.push('    captura: ' + join(pastaTmp, 'parou.png')); } catch {}
} finally {
  try { await browser?.close(); } catch {}
  servidor?.kill('SIGKILL');
  await espera(300);
  if (!process.env.MANTER) try { rmSync(pastaTmp, { recursive: true, force: true }); } catch {}
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
