// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Biblioteca de formas técnicas: um arquivo por disciplina em ./shapes/ (formato e convenções em shapes/base.js).
// Cada grupo = { id, nome, secoes: [[nomeDaSeção, [[id, nome, largura, altura, corpo SVG], …]], …] }.
import fluxo from './shapes/fluxo.js';
import setas from './shapes/setas.js';
import quimica from './shapes/quimica.js';
import hidra from './shapes/hidraulica.js';
import eletrica from './shapes/eletrica.js';
import eletronica from './shapes/eletronica.js';
import renov from './shapes/renovaveis.js';
import saneamento from './shapes/saneamento.js';
import lab from './shapes/laboratorio.js';
import embarcados from './shapes/embarcados.js';
import estat from './shapes/estatistica.js';
import icones from './shapes/icones.js';

export const GROUPS = [fluxo, setas, quimica, hidra, saneamento, lab, eletrica, eletronica, embarcados, renov, estat, icones];
export const ALL_SHAPES = GROUPS.flatMap(g => g.secoes.flatMap(([, list]) => list));
const BY_ID = new Map(ALL_SHAPES.map(s => [s[0], s]));

// SVG pronto na cor `color` (traço 2,5 px na escala natural)
export function shapeSvg(id, color = '#1b1b1b') {
  const s = BY_ID.get(id);
  if (!s) return null;
  const [, , w, h, body] = s;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" stroke="#C" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
  return { svg: svg.replaceAll('#C', color), w, h };
}
