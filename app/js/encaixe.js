// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Encaixe: ao mover ou aumentar o que está selecionado, o canto vai para a linha mais próxima da folha; ao girar,
// o ângulo para em passos fixos. Só contas, sem tela: o editor decide quando usar.
import { SIZE, ANCHORED } from './paper.js';

// lado da malha de cada folha, em px de mundo no tamanho M (o mesmo que a folha desenha)
const PASSO = { grid: 40, mm: 8, dots: 30, cartesian: 40, cartfine: 8 };
export const PASSO_LISO = 20;   // folhas sem malha: uma grade invisível, fina o bastante para alinhar

export const passoDaFolha = bg => PASSO[bg?.pattern] ? PASSO[bg.pattern] * (SIZE[bg.size] || 1) : PASSO_LISO;

// ponto por onde passam as linhas da folha (o mesmo que a folha usa ao se desenhar); `pagina` = retângulo da página
export function origemDaFolha(bg, pagina = null) {
  if (!pagina) return bg?.origin || { x: 0, y: 0 };
  if (bg?.pattern === 'notebook') return { x: pagina.x + 90, y: pagina.y + 64 };
  if (ANCHORED.has(bg?.pattern)) return { x: pagina.x + pagina.w / 2, y: pagina.y + pagina.h / 2 };
  return { x: pagina.x, y: pagina.y + 64 };
}

// valor mais próximo de o + n·passo
export const encaixar = (v, passo, o = 0) => o + Math.round((v - o) / passo) * passo;

// ângulo (radianos) preso a múltiplos de `graus`; 0 = livre
export function giroPreso(ang, graus) {
  if (!graus) return ang;
  const p = graus * Math.PI / 180;
  return Math.round(ang / p) * p;
}

// escala que leva o canto oposto (o + b·s) até a linha mais próxima, sem deixar a seleção sumir
export function escalaEncaixada(o, b, s, passo, origem = 0) {
  if (b < 1e-6) return s;
  const alvo = encaixar(o + b * s, passo, origem);
  return alvo > o ? (alvo - o) / b : s;
}
