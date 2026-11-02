// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Pastas temporárias dos testes: saem quando o processo termina, também quando o teste falha (o "exit" do Node roda
// depois de exceção não tratada e de process.exit, e Ctrl+C passa por ele). Antes, cada teste só apagava no fim do
// caminho feliz, e a %TEMP% enchia o disco. GIZ_MANTER=1 guarda tudo para olhar. A evidência que um teste entrega
// (capturas, relatório) vai para build/evidencia/<nome>, dentro do projeto e fora da cópia pública, trocada a cada rodada.
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const criadas = [];

// a rodada inteira usa uma %TEMP% própria, herdada pelos filhos (servidor, Edge, PowerShell): o que eles deixam lá
// (o script do reconhecedor de escrita quando o servidor é morto, as pastas do Edge sem janela) sai junto no fim
const RODADA = mkdtempSync(join(tmpdir(), 'giz-rodada-'));
process.env.TEMP = process.env.TMP = RODADA;
criadas.push(RODADA);

process.on('exit', () => {
  if (process.env.GIZ_MANTER) return;
  for (const p of criadas) {
    try { rmSync(p, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); }
    catch { console.log('pasta temporária não apagada: ' + p); }
  }
});
for (const sinal of ['SIGINT', 'SIGTERM']) process.once(sinal, () => process.exit(130));

export function pastaTemporaria(prefixo) {
  const p = mkdtempSync(join(tmpdir(), prefixo));
  criadas.push(p);
  return p;
}

// pasta de nome fixo na %TEMP% (perfil de navegador reaproveitado): sai no fim também
export function apagarAoSair(p) { criadas.push(p); return p; }

export function pastaDeEvidencia(nome) {
  const p = join(RAIZ, 'build', 'evidencia', nome);
  rmSync(p, { recursive: true, force: true });
  mkdirSync(p, { recursive: true });
  return p;
}
