// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Validação no Linux: roda o tests/carga_apresentacao.mjs (apresentação longa indo e voltando) sem mexer nele. O
// original é do Windows: procura o Edge num caminho do Windows, sobe o servidor com "python" e mede a memória do Edge
// pelo PowerShell. Aqui uma cópia temporária troca só isso: o Chromium no lugar do Edge (com --no-sandbox quando roda
// como root), python3 (ou PYTHON=caminho) e a memória lida no /proc (soma de Private_Clean + Private_Dirty de
// /proc/<pid>/smaps_rollup na árvore de processos do Chromium, o equivalente à "memória privada" do Windows).
//   node tests/linux/carga_apresentacao_linux.mjs [--slides 200] [--trocas 300] [...]   (as opções do original)
//   CHROMIUM=caminho   (padrão: o Chromium do Playwright)
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

// memória privada da árvore de processos do navegador, pelo /proc (mesmo formato que o carga_memoria.ps1 devolve)
const memoriaLinux = `function memoriaEdge() {
  const filhos = new Map();
  for (const p of readdirSync('/proc').filter(n => /^\\d+$/.test(n))) {
    try { const pai = Number(readFileSync('/proc/' + p + '/stat', 'utf8').replace(/^.*\\) /s, '').split(' ')[1]);
      if (!filhos.has(pai)) filhos.set(pai, []); filhos.get(pai).push(Number(p)); } catch {}
  }
  const arvore = [edge.pid], fila = [edge.pid];
  while (fila.length) for (const f of filhos.get(fila.shift()) || []) { arvore.push(f); fila.push(f); }
  let priv = 0, n = 0;
  for (const p of arvore) {
    try { const s = readFileSync('/proc/' + p + '/smaps_rollup', 'utf8'); n++;
      for (const m of s.matchAll(/^Private_(?:Clean|Dirty):\\s+(\\d+) kB/gm)) priv += Number(m[1]) * 1024; } catch {}
  }
  return { edgeMB: MBf(priv), edgeProc: n };
}
async function heap()`;

let src = readFileSync(join(TESTS, 'carga_apresentacao.mjs'), 'utf8');
const trocas = [
  [/const EDGE = \[[\s\S]*?\]\.find\(existsSync\);/, `const EDGE = ${JSON.stringify(chrome)};`],
  [/const RAIZ = .*;/, `const RAIZ = ${JSON.stringify(RAIZ)};`],
  ["from './acesso.mjs'", `from ${JSON.stringify(pathToFileURL(join(TESTS, 'acesso.mjs')).href)}`],
  ["from './temporario.mjs'", `from ${JSON.stringify(pathToFileURL(join(TESTS, 'temporario.mjs')).href)}`],
  ["import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';",
    "import { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';"],
  ["servidor = spawn('python',", `servidor = spawn(${JSON.stringify(process.env.PYTHON || 'python3')},`],
  [/function memoriaEdge\(\) \{[\s\S]*?\n\}\nasync function heap\(\)/, memoriaLinux],
  ["['--headless=new', `--remote-debugging-port=${pc}`",
    process.getuid?.() === 0 ? "['--headless=new', '--no-sandbox', `--remote-debugging-port=${pc}`" : "['--headless=new', `--remote-debugging-port=${pc}`"],
];
for (const [de, para] of trocas) {
  const antes = src; src = src.replace(de, para);
  if (src === antes) { console.error('o carga_apresentacao.mjs mudou; não achei: ' + de); process.exit(2); }
}
const arq = join(mkdtempSync(join(tmpdir(), 'giz-carga-')), 'carga_apresentacao_linux.mjs');
writeFileSync(arq, src);
console.log(`(carga_apresentacao.mjs com ${chrome} no lugar do Edge, ${process.env.PYTHON || 'python3'} e memória pelo /proc)`);
await import(pathToFileURL(arq).href);
