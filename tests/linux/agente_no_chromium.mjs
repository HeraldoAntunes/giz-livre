// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Validação no Linux: roda o tests/e2e_agente.mjs (agentes de IA pelo MCP) sem mexer nele. O teste original procura o
// Microsoft Edge num caminho do Windows; aqui uma cópia temporária troca só esse caminho pelo Chromium (com
// --no-sandbox quando roda como root) e aponta RAIZ e o acesso.mjs para este repositório.
//   node tests/linux/agente_no_chromium.mjs        (CHROMIUM=caminho; padrão: o Chromium do Playwright)
import { readFileSync, writeFileSync, mkdtempSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TESTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = join(TESTS, '..');
function acharChromium() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  for (const base of ['/opt/pw-browsers', join(process.env.HOME || '', '.cache', 'ms-playwright')]) {
    if (!existsSync(base)) continue;
    for (const d of readdirSync(base).filter(n => /^chromium-\d+$/.test(n)).sort().reverse()) {
      for (const sub of ['chrome-linux64/chrome', 'chrome-linux/chrome']) if (existsSync(join(base, d, sub))) return join(base, d, sub);
    }
  }
  return ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(existsSync);
}
const chrome = acharChromium();
if (!chrome) { console.error('Chromium não encontrado (CHROMIUM=caminho)'); process.exit(2); }
let src = readFileSync(join(TESTS, 'e2e_agente.mjs'), 'utf8');
const trocas = [
  [/const EDGE = \[[\s\S]*?\]\.find\(existsSync\);/, `const EDGE = ${JSON.stringify(chrome)};`],
  [/const RAIZ = .*;/, `const RAIZ = ${JSON.stringify(RAIZ)};`],
  ["from './acesso.mjs'", `from ${JSON.stringify(pathToFileURL(join(TESTS, 'acesso.mjs')).href)}`],
  // o Chromium daqui leva uns 5 s para abrir e responde /json/list vazio antes de ter a aba: o laço original só
  // espera quando a conexão falha, então esgota as 100 tentativas de uma vez; aqui ele espera também nesse caso
  [".find(x => x.type === 'page'); }", ".find(x => x.type === 'page'); if (!alvo) await espera(150); }"],
  ["['--headless=new']", process.getuid?.() === 0 ? "['--headless=new', '--no-sandbox']" : "['--headless=new']"],
];
for (const [de, para] of trocas) {
  const antes = src; src = src.replace(de, para);
  if (src === antes) { console.error('o e2e_agente.mjs mudou; não achei: ' + de); process.exit(2); }
}
const arq = join(mkdtempSync(join(tmpdir(), 'giz-agente-')), 'e2e_agente_linux.mjs');
writeFileSync(arq, src);
console.log(`(e2e_agente.mjs com ${chrome} no lugar do Edge)`);
await import(pathToFileURL(arq).href);
