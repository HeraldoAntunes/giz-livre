// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Teste do pacote Linux: liga no Chromium que o launcher instalado abriu (sem janela, com porta de depuração) e, pela
// interface, cria um quadro, desenha, escreve um texto e espera "Salvo". Depois fecha a janela, como o professor faria.
// Rodar:  node tests/linux/pacote/quadro.mjs <porta-de-depuração> <nome-do-quadro>
// Imprime na última linha:  QUADRO <id>
// Não sobe servidor nem navegador: quem sobe é o launcher (ver testar-pacotes.sh e dentro.sh).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const PORTA_CDP = process.argv[2] || '9333';
const NOME = process.argv[3] || 'Teste do pacote';
const espera = ms => new Promise(r => setTimeout(r, ms));

function carregarPlaywright() {
  const req = createRequire(import.meta.url);
  const lugares = [process.env.PLAYWRIGHT, 'playwright'];
  try { lugares.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  for (const l of lugares.filter(Boolean)) { try { return req(l); } catch {} }
  throw new Error('Playwright não encontrado (npm i -D playwright, ou PLAYWRIGHT=pasta)');
}

let falhas = 0;
let page, ID;
// clicar numa ferramenta que já está escolhida abre os ajustes dela (ou a desliga): só clica se não estiver
const escolher = async sel => {
  if (!(await page.$eval(sel, e => e.classList.contains('active') || e.classList.contains('on')))) await page.click(sel);
};
function conferir(nome, cond, detalhe = '') {
  console.log(cond ? `  ✓ ${nome}` : `  ✗ ${nome}${detalhe ? ': ' + detalhe : ''}`);
  if (!cond) falhas++;
  return cond;
}

const pw = carregarPlaywright();
let browser;
for (let t = 0; t < 60 && !browser; t++) {
  try { browser = await pw.chromium.connectOverCDP(`http://127.0.0.1:${PORTA_CDP}`); } catch { await espera(500); }
}
if (!browser) { console.log('  ✗ o Chromium aberto pelo launcher não respondeu na porta ' + PORTA_CDP); process.exit(1); }
const ctx = browser.contexts()[0];
for (let t = 0; t < 60 && !page; t++) {
  page = ctx.pages().find(p => p.url().startsWith('http://127.0.0.1:'));
  if (!page) await espera(500);
}
if (!conferir('o launcher abriu o navegador no endereço do Giz Livre', !!page, ctx.pages().map(p => p.url()).join(', '))) process.exit(1);
console.log('    endereço: ' + page.url().replace(/k=[^&#]+/, 'k=…'));
const erros = [];
page.on('pageerror', e => erros.push(String(e.message || e)));
await page.setViewportSize({ width: 1400, height: 900 });

await page.waitForSelector('#gallery:not([hidden])', { timeout: 20000 });
conferir('a galeria abriu (a chave de abertura foi aceita)', true);
conferir('a chave de uso único saiu do endereço', !/[?&]k=/.test(page.url()), page.url());
// pula "Quais áreas te interessam?" e o tour, como os outros testes; recarregar mantém o acesso (cookie)
await page.evaluate(() => {
  localStorage.setItem('lousa.abas', '{"ocultas":[],"escolhido":true}');
  localStorage.setItem('lousa.ajuda', '{"tourVisto":true}');
});
await page.reload();
await page.waitForSelector('#gallery:not([hidden])', { timeout: 20000 });

try {
await page.click('#gNew');
await page.click('#pop [data-k="free"]');
await page.waitForSelector('#board:not([hidden])');
ID = (await page.evaluate(() => location.hash)).replace('#/b/', '');
conferir('quadro novo criado e aberto', /^[A-Za-z0-9_-]+$/.test(ID), ID);
await espera(600);
await page.keyboard.press('Escape');
await escolher('.pen[data-tool="pen0"]');   // caneta preta (a ferramenta da última vez fica guardada)
await page.mouse.move(400, 300); await page.mouse.down();
await page.mouse.move(510, 360, { steps: 12 }); await page.mouse.move(620, 300, { steps: 12 });
await page.mouse.up();
await escolher('#createbar [data-create="text"]');
await page.mouse.click(420, 520);
await page.waitForSelector('#textEdit:not([hidden])');
await page.keyboard.type(NOME);
await page.keyboard.press('Escape');
const itens = await page.evaluate(() => (window.__lousa?.S?.items || []).map(i => ({ type: i.type, text: i.text })));
conferir('traço de caneta no quadro', itens.some(i => i.type === 'stroke'));
conferir('texto no quadro', itens.some(i => i.type === 'text' && i.text === NOME));
const salvo = await page.waitForFunction(() => document.getElementById('bStatus')?.textContent.trim() === 'Salvo', null, { timeout: 15000 })
  .then(() => true, () => false);
conferir('a página mostra "Salvo"', salvo, await page.textContent('#bStatus').catch(() => ''));
conferir('sem erro de JavaScript na página', erros.length === 0, erros.join(' | '));
} catch (e) {
  conferir('roteiro na interface', false, String(e.message || e).split('\n')[0]);
  if (process.env.CAPTURA) await page.screenshot({ path: process.env.CAPTURA }).catch(() => {});
  await browser.close().catch(() => {});
  process.exit(1);
}

// fecha a janela: a página avisa o servidor, que se encerra sozinho uns segundos depois
await page.close({ runBeforeUnload: true });
await browser.close().catch(() => {});
console.log(`QUADRO ${ID}`);
process.exit(falhas ? 1 : 0);
