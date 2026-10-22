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
import recursosHidricos from './shapes/recursoshidricos.js';
import topografia from './shapes/topografia.js';
import lab from './shapes/laboratorio.js';
import embarcados from './shapes/embarcados.js';
import estat from './shapes/estatistica.js';
import icones from './shapes/icones.js';
import carimbos from './shapes/carimbos.js';
import musica from './shapes/musica.js';
import sh_nutricao from './shapes/nutricao.js';
import sh_portugues from './shapes/portugues.js';
import sh_edfisica from './shapes/edfisica.js';
import sh_empreendedorismo from './shapes/empreendedorismo.js';
import sh_filosofia from './shapes/filosofia.js';
import sh_agronomia from './shapes/agronomia.js';
import sh_matematica from './shapes/matematica.js';
import sh_fisica from './shapes/fisica.js';
import sh_historia from './shapes/historia.js';
import sh_biologia from './shapes/biologia.js';
import sh_geografia from './shapes/geografia.js';
import sh_mecanica from './shapes/mecanica.js';
import sh_computacao from './shapes/computacao.js';
import sh_alimentos from './shapes/alimentos.js';

// ordem das abas: gerais, engenharias e técnicos, exatas, ciências e agrárias, saúde, humanas e linguagens, gestão
export const GROUPS = [fluxo, setas, icones, carimbos, quimica, lab, hidra, saneamento, recursosHidricos, topografia, renov, eletrica, eletronica, embarcados, sh_mecanica, sh_computacao, sh_matematica, estat, sh_fisica, sh_biologia, sh_agronomia, sh_alimentos, sh_nutricao, sh_edfisica, sh_portugues, sh_historia, sh_geografia, sh_filosofia, musica, sh_empreendedorismo];
export const ALL_SHAPES = GROUPS.flatMap(g => g.secoes.flatMap(([, list]) => list));
const BY_ID = new Map(ALL_SHAPES.map(s => [s[0], s]));
export const shapeById = id => BY_ID.get(id);

// SVG pronto na cor `color` (traço 2,5 px na escala natural)
// { semTexto }: sem os textos do desenho (rótulos, legendas), para exercícios de "complete o desenho"; o tamanho
// continua o da forma completa, para a troca não mexer na posição nem na escala do item.
const TEXTO = /<text\b[^>]*\/>|<text\b[^>]*>[\s\S]*?<\/text>/g;
export const temTexto = id => { const s = BY_ID.get(id); return !!s && /<text\b/.test(s[4]); };
export function shapeSvg(id, color = '#1b1b1b', { semTexto = false } = {}) {
  const s = BY_ID.get(id);
  if (!s) return null;
  const [, , w0, h0, corpo] = s, k = escalaNatural(s), w = w0 * k, h = h0 * k;
  const body = semTexto ? corpo.replace(TEXTO, '') : corpo;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w0} ${h0}" fill="none" stroke="#C" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
  return { svg: svg.replaceAll('#C', color), w, h };
}

// Formas com letra miúda (pinos de placas, escalas de vidraria) entram ampliadas, para a menor letra ter 10 px no
// quadro: aumentar só a letra encavalaria os rótulos, que ficam colados uns nos outros no desenho.
const ESCALA = new Map();
export function escalaNatural(s) {
  if (!ESCALA.has(s[0])) {
    const tams = [...s[4].matchAll(/font-size="([\d.]+)"/g)].map(m => +m[1]);
    const menor = tams.length ? Math.min(...tams) : Infinity;
    ESCALA.set(s[0], menor < 9 ? Math.round(10 / menor * 100) / 100 : 1);
  }
  return ESCALA.get(s[0]);
}
