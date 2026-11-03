// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Marca-texto: intensidade (quanto a tinta cobre) e traço reto com Shift (retorno da aula de 03/11/2026, P64 f).
// Antes, a intensidade era fixa em 0,38; um traço sem o campo `op` continua assim.
export const OPACIDADE_PADRAO = 0.38;
export const INTENSIDADES = [[0.2, 'Clara'], [OPACIDADE_PADRAO, 'Média'], [0.6, 'Forte']];

/** Opacidade do traço de marca-texto: o `op` gravado, preso entre 0,1 e 0,8, ou a de sempre. */
export function opacidade(op) {
  return typeof op === 'number' && Number.isFinite(op) ? Math.min(0.8, Math.max(0.1, op)) : OPACIDADE_PADRAO;
}

/** Shift segurado: só o ponto de partida e o atual (x, y, pressão), um traço reto. */
export function reto(pts) {
  return pts.length <= 6 ? pts : [pts[0], pts[1], pts[2], pts[pts.length - 3], pts[pts.length - 2], pts[pts.length - 1]];
}
