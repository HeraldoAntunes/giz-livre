// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Quando gravar o quadro. O editor espera uma pausa de 500 ms na edição antes de gravar (não grava a cada traço), mas
// nunca mais de 3 s desde a primeira mudança ainda não gravada: escrevendo sem parar, o trabalho ia para o disco só na
// primeira pausa, e uma queda nesse meio tempo perdia tudo (auditoria externa de 29/10/2026, GL-M1).
export const PAUSA_MS = 500, PRAZO_MS = 3000;

/** Quantos ms esperar para gravar, agora, se a primeira mudança não gravada foi em `desde`. */
export function atrasoDeGravacao(agora, desde) {
  const falta = PRAZO_MS - (agora - desde);
  return Math.max(0, Math.min(PAUSA_MS, falta));
}
