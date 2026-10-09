// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Nutrição (prefixo 'nut-'): alimentos, porções, nutrientes, metabolismo, avaliação, ciclos de vida, UAN e rotulagem. Desenho próprio.
import { T, head } from './base.js';

const f = n => (+n).toFixed(1);
const fino = (d, w = 1.6) => `<path stroke-width="${w}" d="${d}"/>`;
const trac = (d, w = 1.6) => `<path stroke-width="${w}" stroke-dasharray="5 4" d="${d}"/>`;
// texto alinhado à esquerda / à direita (o T da base é centralizado)
const TL = (x, y, s, size = 14) => T(x, y, s, size).replace('text-anchor="middle"', 'text-anchor="start"');
const TE = (x, y, s, size = 14) => T(x, y, s, size).replace('text-anchor="middle"', 'text-anchor="end"');
const pt = (cx, cy, r, ang) => { const a = ang * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
const hexa = (cx, cy, r, extra = '') => '<path' + extra + ' d="M' + [0, 1, 2, 3, 4, 5].map(i => pt(cx, cy, r, 30 + 60 * i).map(f).join(',')).join(' L') + ' Z"/>';
const lider = (x1, y1, x2, y2) => fino(`M${x1},${y1} L${x2},${y2}`, 1.3);

// --- alimentos ---
const feijao = (x, y, a) => `<path transform="translate(${x},${y}) rotate(${a})" d="M-17,0 C-17,-12 -6,-12 0,-7 C6,-12 17,-12 17,0 C17,11 -17,11 -17,0 Z"/><path stroke-width="1.4" transform="translate(${x},${y}) rotate(${a})" d="M-4,-3 Q0,-1 4,-3"/>`;
const cubo = (cx, y, a) => {
  const h = a / 2;
  return `<path d="M${cx},${y} L${cx + a},${y + h} V${y + h + a} L${cx},${y + a + a} L${cx - a},${y + h + a} V${y + h} Z"/>` + fino(`M${cx - a},${y + h} L${cx},${y + a} L${cx + a},${y + h} M${cx},${y + a} V${y + 2 * a}`);
};
const graosTrigo = (() => {
  let s = '';
  for (let i = 0; i < 4; i++) {
    const y = 24 + i * 15;
    s += `<ellipse cx="33" cy="${y}" rx="5.5" ry="9" transform="rotate(-30 33 ${y})"/><ellipse cx="47" cy="${y}" rx="5.5" ry="9" transform="rotate(30 47 ${y})"/>`;
  }
  return s + '<ellipse cx="40" cy="12" rx="5" ry="8"/>';
})();
const trigo = (dx = 0, dy = 0, k = 1) => `<g transform="translate(${dx},${dy}) scale(${k})"><path d="M40,20 V112"/>${graosTrigo}</g>`;
const gradeMilho = (() => { let d = ''; for (let y = 24; y <= 72; y += 8) d += `M18,${y} H42 `; for (const x of [24, 30, 36]) d += `M${x},18 V78 `; return fino(d, 1.3); })();

// --- medidas ---
const colher = (x, y, s) => `<ellipse cx="${f(x + 20 * s)}" cy="${y}" rx="${f(20 * s)}" ry="${f(11 * s)}"/><path d="M${f(x + 40 * s)},${f(y - 2 * s)} L${f(x + 104 * s)},${f(y - 4 * s)} Q${f(x + 109 * s)},${y} ${f(x + 104 * s)},${f(y + 4 * s)} L${f(x + 40 * s)},${f(y + 2 * s)}"/>`;

// --- nutrientes ---
const bloco = (id, nome, rot, icone) => [id, nome, 180, 60, `<rect x="4" y="4" width="172" height="52" rx="12"/>${icone}${T(114, 30, rot, 16)}`];
const vit = (id, nome, letra) => [id, nome, 80, 80, `<circle cx="40" cy="40" r="34"/>${fino('M10,32 H70', 1.3)}${T(40, 21, 'vit.', 15)}${T(40, 52, letra, letra.length > 1 ? 24 : 28)}`];
const mineral = (id, nome, simb, rot) => [id, nome, 80, 80, `<rect x="6" y="6" width="68" height="68" rx="6"/>${T(40, 34, simb, 28)}${T(40, 60, rot, 14)}`];
const zig = (x0, y0, ang, n, passo = 14, amp = 6) => {
  const a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), p = [];
  for (let i = 0; i <= n; i++) { const u = i * passo, v = (i % 2 ? -amp : amp); p.push([x0 + u * c - v * s, y0 + u * s + v * c]); }
  return p;
};
const linha = p => 'M' + p.map(q => q.map(f).join(',')).join(' L');
const glicoseAnel = (cx, cy, r) => { // hexágono com o "O" num vértice (traços interrompidos perto dele)
  const v = [0, 1, 2, 3, 4, 5].map(i => pt(cx, cy, r, -30 + 60 * i));
  const enc = (a, b, d) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L]; };
  const o = v[5], p1 = enc(o, v[0], 8), p2 = enc(o, v[4], 8);
  return `<path d="M${p1.map(f)} L${v[0].map(f)} L${v[1].map(f)} L${v[2].map(f)} L${v[3].map(f)} L${v[4].map(f)} L${p2.map(f)}"/>` + T(f(o[0]), f(o[1]), 'O', 16);
};

// --- corpo ---
const balanca = (inc, id, nome) => {
  const a = inc * Math.PI / 180, ex1 = 100 - 70 * Math.cos(a), ey1 = 40 + 70 * Math.sin(a), ex2 = 100 + 70 * Math.cos(a), ey2 = 40 - 70 * Math.sin(a);
  const prato = (x, y, rot) => `<path stroke-width="1.6" d="M${f(x)},${f(y)} L${f(x - 22)},${f(y + 40)} M${f(x)},${f(y)} L${f(x + 22)},${f(y + 40)}"/><path d="M${f(x - 26)},${f(y + 40)} Q${f(x)},${f(y + 62)} ${f(x + 26)},${f(y + 40)} Z"/>${T(f(x), f(y + 66), rot, 14)}`;
  return [id, nome, 200, 150, `<path d="M${f(ex1)},${f(ey1)} L${f(ex2)},${f(ey2)}"/><path d="M100,40 V136 M74,140 H126"/><path fill="#C" d="M92,30 L100,16 L108,30 Z"/><circle cx="100" cy="40" r="3.5" fill="#C"/>${prato(ex1, ey1, 'ingestão')}${prato(ex2, ey2, 'gasto')}`];
};
const eixos = (x0, y0, x1, y1) => `<path d="M${x0},${y1} V${y0} H${x1}"/>${head(x0, y1 - 4, -90, 10)}${head(x1 + 4, y0, 0, 10)}`;
const curvaPerc = (k, desl) => { let d = ''; for (let x = 40; x <= 200; x += 8) { const y = 150 - desl - k * (1 - Math.exp(-(x - 40) / 55)); d += (d ? ' L' : 'M') + x + ',' + f(y); } return d; };

// --- pessoas (pictograma genérico) ---
const pessoa = (cx, y0, k = 1, extra = '') => {
  const p = (x, y) => `${f(cx + x * k)},${f(y0 + y * k)}`;
  return `<g stroke-linecap="round"><circle cx="${f(cx)}" cy="${f(y0 + 16 * k)}" r="${f(12 * k)}" fill="#C" stroke="none"/>` +
    `<path stroke-width="${f(20 * k)}" d="M${p(0, 46)} L${p(0, 96)}"/>` +
    `<path stroke-width="${f(8 * k)}" d="M${p(-13, 42)} L${p(-17, 96)} M${p(13, 42)} L${p(17, 96)}"/>` +
    `<path stroke-width="${f(10 * k)}" d="M${p(-6, 104)} L${p(-7, 172)} M${p(6, 104)} L${p(7, 172)}"/>${extra}</g>`;
};

// --- avaliação ---
const marcasVert = (x, y0, y1, passo) => { let d = ''; for (let y = y0, i = 0; y <= y1; y += passo, i++) d += `M${x},${y} H${x + (i % 2 ? 5 : 9)} `; return fino(d, 1.3); };
const marcasHor = (x0, x1, y, passo) => { let d = ''; for (let x = x0, i = 0; x <= x1; x += passo, i++) d += `M${x},${y} V${y + (i % 2 ? 5 : 9)} `; return fino(d, 1.3); };
const grade = (x0, y0, x1, y1, p) => { let d = ''; for (let x = x0 + p; x <= x1; x += p) d += `M${x},${y0} V${y1} `; for (let y = y1 - p; y >= y0; y -= p) d += `M${x0},${y} H${x1} `; return fino(d, 1); };

// --- UAN e rótulo ---
const caixa = (x, y, w, h, rot, size = 14) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>${T(x + w / 2, y + h / 2, rot, size)}`;
const tigela = (cx, conteudo, rot) => `<path d="M${cx - 26},34 H${cx + 26} Q${cx + 24},62 ${cx},62 Q${cx - 24},62 ${cx - 26},34 Z"/>${conteudo}${T(cx, 76, rot, 14)}`;

// sistema digestório (coordenadas locais 150 × 240)
const DIGEST = '<ellipse cx="80" cy="14" rx="14" ry="7"/>' +
  '<path d="M76,21 V58 M84,21 V52"/>' +
  '<path d="M84,52 Q100,42 120,46 Q144,52 142,74 Q138,96 112,96 Q92,96 84,82 Q80,70 76,58"/>' +
  '<path d="M20,58 Q44,42 72,50 L72,72 Q50,92 24,86 Q14,72 20,58 Z"/>' +
  '<path d="M50,206 H36 V110 H144 V200 Q144,214 128,214 H100 V236 H86 V200 H130 V124 H50 Z"/>' +
  '<path stroke-width="2.2" d="M110,96 V136 H62 Q56,136 56,142 Q56,148 62,148 H118 Q124,148 124,154 Q124,160 118,160 H62 Q56,160 56,166 Q56,172 62,172 H118 Q124,172 124,178 Q124,184 118,184 H62 Q56,184 56,190 V198 H50"/>';

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "nut-refeicao-modelo",
        "Refeição — registro e contexto",
        560,
        224,
        "<text x=\"280\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Refeição — registro e contexto</text><rect x=\"10\" y=\"42\" width=\"540\" height=\"178\" rx=\"3\"/><text x=\"77.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Alimento</text><text x=\"212.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Porção/unid.</text><path d=\"M145 42 V220\"/><text x=\"347.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Preparo</text><path d=\"M280 42 V220\"/><text x=\"482.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Contexto</text><path d=\"M415 42 V220\"/><path d=\"M10 68 H550\"/><path d=\"M10 106 H550\"/><path d=\"M10 144 H550\"/><path d=\"M10 182 H550\"/>"
      ],
      [
        "nut-rotulo-comparar",
        "Rótulos — comparar bases iguais",
        580,
        224,
        "<text x=\"290\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Rótulos — comparar bases iguais</text><rect x=\"10\" y=\"42\" width=\"560\" height=\"178\" rx=\"3\"/><text x=\"80\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Produto</text><text x=\"220\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Base (g/mL)</text><path d=\"M150 42 V220\"/><text x=\"360\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Nutriente</text><path d=\"M290 42 V220\"/><text x=\"500\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Quantidade</text><path d=\"M430 42 V220\"/><path d=\"M10 68 H570\"/><path d=\"M10 106 H570\"/><path d=\"M10 144 H570\"/><path d=\"M10 182 H570\"/>"
      ]
    ]
  ]
];

export default {
  id: 'nutricao',
  nome: 'Nutrição',
  destaques: ['nut-prato-grupos', 'nut-piramide-consumo', 'nut-maca', 'nut-pao', 'nut-leite', 'nut-carboidrato', 'nut-proteina', 'nut-lipidio',
    'nut-digestorio', 'nut-balanco-equilibrio', 'nut-glicemia', 'nut-imc-faixas', 'nut-tabela-nutricional', 'nut-alerta-lupa', 'nut-colheres', 'nut-fluxo-producao'],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Alimentos', [
      ['nut-maca', 'Maçã', 80, 84, '<path d="M40,26 C28,16 8,20 8,46 C8,68 24,82 40,76 C56,82 72,68 72,46 C72,20 52,16 40,26 Z"/><path d="M40,26 Q40,14 45,6"/><path d="M43,17 Q54,6 64,12 Q54,22 43,17 Z"/>'],
      ['nut-banana', 'Banana', 100, 70, '<path d="M14,14 Q22,56 84,52 Q92,54 90,60 Q84,66 70,66 Q14,64 8,18 Z"/><path d="M14,14 L10,6 L16,4"/>' + fino('M18,26 Q30,52 72,58')],
      ['nut-laranja', 'Laranja', 80, 84, '<circle cx="40" cy="48" r="32"/><path d="M40,16 Q40,10 42,6"/><path d="M42,13 Q52,4 62,9 Q53,18 42,13 Z"/>' + fino('M28,40 h0.1 M50,34 h0.1 M56,54 h0.1 M32,62 h0.1 M44,50 h0.1', 3)],
      ['nut-uva', 'Cacho de uva', 80, 96, ['13,30', '31,30', '49,30', '67,30', '22,45', '40,45', '58,45', '31,60', '49,60', '40,75'].map(c => { const [x, y] = c.split(','); return `<circle cx="${x}" cy="${y}" r="9"/>`; }).join('') + '<path d="M40,21 V6"/><path d="M40,12 Q52,2 62,8 Q52,16 40,12 Z"/>'],
      ['nut-cenoura', 'Cenoura', 60, 100, '<path d="M17,32 Q30,28 43,32 L32,92 Q30,97 28,92 Z"/><path d="M30,30 L20,8 M30,30 L30,4 M30,30 L40,8"/>' + fino('M22,46 H28 M33,58 H38 M24,68 H30 M31,78 H35')],
      ['nut-tomate', 'Tomate', 80, 76, '<ellipse cx="40" cy="44" rx="33" ry="27"/><path stroke-width="2" d="M40,20 L30,14 M40,20 L50,14 M40,20 L27,24 M40,20 L53,24 M40,20 V8"/>'],
      ['nut-brocolis', 'Brócolis', 80, 90, '<path d="M20,52 C6,50 6,32 20,30 C20,16 36,10 42,18 C50,8 70,14 66,30 C78,32 76,52 62,52 Z"/><path d="M32,52 L34,86 H48 L50,52"/>' + fino('M41,70 L33,54 M41,70 L49,54 M30,36 h0.1 M46,30 h0.1 M56,40 h0.1 M38,44 h0.1', 2)],
      ['nut-alface', 'Folhas verdes (alface)', 90, 80, '<path d="M45,76 C10,70 4,30 22,14 C30,24 34,8 45,6 C56,8 60,24 68,14 C86,30 80,70 45,76 Z"/>' + fino('M45,76 V16 M45,60 L28,44 M45,60 L62,44 M45,42 L34,28 M45,42 L56,28')],
      ['nut-batata', 'Batata (tubérculo)', 90, 64, '<path d="M12,34 C10,14 40,8 60,12 C82,14 88,34 80,46 C72,60 30,62 16,52 Q11,44 12,34 Z"/>' + fino('M30,26 q3,3 6,0 M58,22 q3,3 6,0 M46,42 q3,3 6,0 M24,44 q3,3 6,0 M68,40 q3,3 6,0')],
      ['nut-feijao', 'Feijão (grãos)', 90, 64, feijao(26, 22, -12) + feijao(62, 24, 10) + feijao(44, 46, 4)],
      ['nut-arroz', 'Tigela de arroz', 90, 74, '<path d="M8,36 H82 Q80,64 45,66 Q10,64 8,36 Z"/><path d="M12,36 Q18,14 45,12 Q72,14 78,36"/><path d="M34,66 V70 H56 V66"/>' + fino('M26,26 l5,-2 M40,20 l5,1 M54,24 l5,2 M32,32 l5,0 M48,30 l5,-1 M62,32 l4,1 M20,33 l4,-1', 2.2)],
      ['nut-milho', 'Espiga de milho', 60, 100, '<ellipse cx="30" cy="48" rx="14" ry="34"/>' + gradeMilho + '<path d="M30,96 Q8,78 10,40 Q16,60 26,74 M30,96 Q52,78 50,40 Q44,60 34,74"/>'],
      ['nut-trigo', 'Trigo (cereal integral)', 80, 116, trigo()],
      ['nut-pao', 'Pão francês', 100, 60, '<path d="M8,40 Q8,14 50,12 Q92,14 92,40 Q92,50 50,50 Q8,50 8,40 Z"/><path stroke-width="2" d="M26,26 L36,36 M45,21 L55,33 M64,24 L72,33"/>'],
      ['nut-pao-forma', 'Pão de forma (fatia)', 80, 84, '<path d="M14,80 V36 C2,30 4,8 24,8 H56 C76,8 78,30 66,36 V80 Z"/>' + fino('M20,74 V40 C12,34 12,16 26,15 H54 C68,16 68,34 60,40 V74 Z')],
      ['nut-carne', 'Carne vermelha (bife)', 100, 70, '<path d="M10,36 C8,14 40,6 64,12 C90,18 96,40 84,54 C72,66 40,66 24,58 C12,52 10,44 10,36 Z"/>' + fino('M18,38 C18,22 42,16 62,20 C82,24 86,40 78,50') + '<circle cx="62" cy="34" r="6"/>'],
      ['nut-frango', 'Frango (coxa)', 90, 84, '<path d="M10,40 C8,16 34,6 50,22 C60,32 58,50 44,56 C28,62 12,54 10,40 Z"/><path d="M48,52 L66,68"/><circle cx="72" cy="66" r="5.5"/><circle cx="66" cy="74" r="5.5"/>' + fino('M22,30 Q30,22 40,24')],
      ['nut-peixe-prato', 'Peixe no prato', 110, 76, '<ellipse cx="55" cy="54" rx="50" ry="18"/>' + fino('M24,54 Q55,72 86,54') + '<path d="M22,40 Q48,18 78,38 Q48,56 22,40 Z"/><path d="M78,38 L96,26 V50 Z"/><circle cx="34" cy="37" r="2" fill="#C"/>' + fino('M50,30 Q54,38 50,46')],
      ['nut-ovo', 'Ovo (inteiro e frito)', 110, 72, '<path d="M30,6 C46,6 52,40 52,50 C52,62 42,68 30,68 C18,68 8,62 8,50 C8,40 14,6 30,6 Z"/><path d="M64,38 C60,20 80,12 92,20 C106,22 106,46 98,54 C90,66 68,62 64,50 Z"/><circle cx="83" cy="40" r="10"/>'],
      ['nut-leite', 'Leite (caixa e copo)', 100, 100, '<path d="M10,96 V34 L22,18 H50 L62,34 V96 Z M10,34 H62 M22,18 V8 H50 V18"/>' + T(36, 64, 'LEITE', 14) + '<path d="M70,50 H94 L90,96 H74 Z"/>' + trac('M72,62 H92')],
      ['nut-queijo', 'Queijo', 100, 70, '<path d="M8,34 L84,10 L92,34 Z M8,34 V62 H92 V34"/><circle cx="30" cy="48" r="5"/><circle cx="62" cy="52" r="6"/><circle cx="80" cy="44" r="3.5"/><circle cx="52" cy="26" r="3"/>'],
      ['nut-iogurte', 'Iogurte (pote)', 70, 84, '<path d="M10,22 H60 L54,78 H16 Z"/><path d="M6,22 H64 V16 H6 Z"/><path d="M50,16 Q60,6 66,10"/>' + trac('M13,44 H57')],
      ['nut-oleo', 'Óleo (garrafa)', 70, 110, '<path d="M28,4 H42 V14 L54,30 V104 H16 V30 L28,14 Z"/><rect x="20" y="52" width="30" height="30"/>' + T(35, 67, 'óleo', 14)],
      ['nut-abacate', 'Abacate (corte)', 70, 96, '<path d="M35,6 C46,6 50,24 56,40 C66,62 60,90 35,90 C10,90 4,62 14,40 C20,24 24,6 35,6 Z"/>' + fino('M35,14 C42,14 46,28 50,42 C58,62 54,82 35,82 C16,82 12,62 20,42 C24,28 28,14 35,14 Z') + '<circle cx="35" cy="60" r="12"/>'],
      ['nut-acucar', 'Açúcar (cubos)', 90, 76, cubo(30, 26, 20) + cubo(62, 6, 20) + fino('M78,58 l4,-4 M80,64 l6,0', 1.6)],
      ['nut-bala', 'Bala (doce)', 100, 56, '<ellipse cx="50" cy="28" rx="20" ry="14"/><path d="M30,28 L10,14 L14,28 L10,42 Z M70,28 L90,14 L86,28 L90,42 Z"/>' + fino('M42,18 Q38,28 42,38 M58,18 Q62,28 58,38')],
      ['nut-refrigerante', 'Refrigerante (copo com canudo)', 70, 104, '<path d="M12,30 H58 L52,100 H18 Z"/><path d="M40,30 L48,4 H56"/>' + fino('M14,44 H56') + '<circle cx="28" cy="62" r="3"/><circle cx="40" cy="76" r="2.5"/><circle cx="32" cy="88" r="2"/><circle cx="44" cy="56" r="2"/>'],
      ['nut-garrafa-agua', 'Garrafa de água', 60, 110, '<rect x="22" y="4" width="16" height="10" rx="2"/><path d="M24,14 V20 Q12,26 12,40 V100 Q12,106 18,106 H42 Q48,106 48,100 V40 Q48,26 36,20 V14"/><path d="M30,54 Q22,66 22,72 A8,8 0 0,0 38,72 Q38,66 30,54 Z"/>'],
      ['nut-sal', 'Sal (saleiro)', 60, 96, '<path d="M14,92 V40 Q14,30 22,26 H38 Q46,30 46,40 V92 Z"/><path d="M18,26 Q18,8 30,8 Q42,8 42,26"/>' + fino('M26,16 h0.1 M34,16 h0.1 M30,20 h0.1', 2.6) + T(30, 62, 'SAL', 14)],
      ['nut-salgadinho', 'Salgadinho (ultraprocessado)', 80, 100, '<path d="M12,12 H68 L64,20 Q70,56 64,88 L68,96 H12 L16,88 Q10,56 16,20 Z"/>' + fino('M12,12 L16,16 L20,12 L24,16 L28,12 L32,16 L36,12 L40,16 L44,12 L48,16 L52,12 L56,16 L60,12 L64,16 L68,12 M12,96 L16,92 L20,96 L24,92 L28,96 L32,92 L36,96 L40,92 L44,96 L48,92 L52,96 L56,92 L60,96 L64,92 L68,96') + '<path d="M28,48 Q40,36 54,48 Q48,66 34,64 Q24,60 28,48 Z"/>'],
    ]],
    ['Grupos e porções', [
      ['nut-prato-grupos', 'Prato dividido em grupos', 190, 190, '<circle cx="95" cy="95" r="88"/>' + fino('M95,95 m-76,0 a76,76 0 1,0 152,0 a76,76 0 1,0 -152,0') + '<path d="M95,19 V171 M95,95 H171"/>' + T(55, 95, 'Vegetais', 15) + T(132, 66, 'Cereais', 15) + T(132, 124, 'Proteínas', 15)],
      ['nut-prato-vazio', 'Prato dividido (em branco)', 190, 190, '<circle cx="95" cy="95" r="88"/>' + fino('M95,95 m-76,0 a76,76 0 1,0 152,0 a76,76 0 1,0 -152,0') + '<path d="M95,19 V171 M95,95 H171"/>'],
      ['nut-piramide', 'Pirâmide alimentar (em branco)', 200, 172, '<path d="M100,8 L194,164 H6 Z"/><path stroke-width="2" d="M76.5,47 H123.5 M53,86 H147 M29.5,125 H170.5"/>'],
      ['nut-piramide-consumo', 'Pirâmide: consumir mais × menos', 260, 172, '<path d="M100,8 L194,164 H6 Z"/><path stroke-width="2" d="M76.5,47 H123.5 M53,86 H147 M29.5,125 H170.5"/><path d="M220,150 V30"/>' + head(220, 22, -90, 12) + T(236, 12, 'menos', 14) + T(236, 162, 'mais', 14) + T(100, 145, 'base', 14)],
      ['nut-processamento', 'Grau de processamento (4 grupos)', 270, 164, [['In natura / minim. processado', 6], ['Ingrediente culinário', 46], ['Processado', 86], ['Ultraprocessado', 126]].map(([s, y], i) => `<circle cx="18" cy="${y + 15}" r="12"/>${T(18, y + 15, i + 1, 14)}${caixa(40, y, 224, 30, s)}`).join('')],
      ['nut-colher-sopa', 'Colher de sopa', 120, 36, colher(4, 18, 1.08)],
      ['nut-colheres', 'Colheres (sopa, sobremesa, chá)', 170, 96, colher(4, 18, 1) + colher(4, 50, 0.82) + colher(4, 80, 0.64) + TL(120, 18, 'sopa') + TL(100, 50, 'sobremesa') + TL(82, 80, 'chá')],
      ['nut-xicara', 'Xícara', 90, 74, '<path d="M10,14 H66 Q66,56 38,58 Q10,56 10,14 Z"/><path d="M65,22 Q84,22 82,36 Q80,46 61,44"/><path d="M4,62 Q43,74 82,62"/>'],
      ['nut-copo', 'Copo (americano)', 60, 92, '<path d="M8,6 H52 L45,86 H15 Z"/>' + fino('M19,6 L22,86 M30,6 V86 M41,6 L38,86') + trac('M10,26 H50')],
      ['nut-copo-medidor', 'Copo medidor (mL)', 100, 100, '<path d="M14,6 H70 L66,96 H18 Z M70,22 Q90,22 90,44 Q90,66 68,70"/>' + fino('M16,28 H30 M17,48 H30 M17,68 H30', 1.6) + TL(34, 28, '250', 14) + TL(34, 48, '150', 14) + TL(34, 68, '50', 14)],
      ['nut-concha', 'Concha', 70, 120, '<path d="M8,84 Q8,116 35,116 Q62,116 62,84 Z"/><path d="M35,84 V12 Q35,4 43,6"/>'],
      ['nut-prato-raso', 'Prato raso', 120, 46, '<ellipse cx="60" cy="20" rx="54" ry="14"/>' + fino('M60,22 m-32,0 a32,8 0 1,0 64,0 a32,8 0 1,0 -64,0') + '<path d="M8,24 Q14,36 60,38 Q106,36 112,24"/>'],
      ['nut-prato-fundo', 'Prato fundo', 120, 64, '<ellipse cx="60" cy="18" rx="54" ry="13"/>' + fino('M60,20 m-34,0 a34,7 0 1,0 68,0 a34,7 0 1,0 -68,0') + '<path d="M6,18 Q14,54 60,56 Q106,54 114,18"/><path d="M44,56 V60 H76 V56"/>'],
      ['nut-balanca-cozinha', 'Balança de cozinha', 110, 80, '<ellipse cx="55" cy="22" rx="44" ry="8"/><path d="M55,30 V40 M10,76 H100 L92,40 H18 Z"/><rect x="38" y="50" width="34" height="16" rx="2"/>' + T(55, 58, 'g', 14)],
    ]],
    ['Nutrientes', [
      bloco('nut-carboidrato', 'Carboidrato (bloco)', 'Carboidratos', hexa(30, 30, 15)),
      bloco('nut-proteina', 'Proteína (bloco)', 'Proteínas', '<circle cx="18" cy="38" r="6"/><circle cx="31" cy="22" r="6"/><circle cx="44" cy="38" r="6"/><path stroke-width="2" d="M21,33 L28,27 M34,27 L41,33"/>'),
      bloco('nut-lipidio', 'Lipídio (bloco)', 'Lipídios', '<path d="M30,12 Q16,30 16,36 A14,14 0 0,0 44,36 Q44,30 30,12 Z"/>'),
      ['nut-glicose', 'Glicose (anel)', 100, 96, glicoseAnel(50, 42, 30) + T(50, 86, 'glicose', 14)],
      ['nut-amido', 'Amido (cadeia de glicoses)', 210, 50, [28, 80, 132, 184].map(x => hexa(x, 25, 18)).join('') + '<path d="M44,25 H64 M96,25 H116 M148,25 H168"/>'],
      ['nut-aminoacido', 'Aminoácido (estrutura geral)', 170, 110, T(80, 55, 'C', 20) + T(80, 16, 'H', 18) + T(80, 94, 'R', 18) + T(30, 55, 'H₂N', 18) + T(132, 55, 'COOH', 18) + '<path d="M80,26 V44 M80,66 V84 M48,55 H70 M90,55 H106"/>'],
      ['nut-peptideo', 'Cadeia de aminoácidos (proteína)', 204, 64, (() => { const p = [18, 46, 74, 102, 130, 158, 186].map((x, i) => [x, i % 2 ? 42 : 22]); return p.slice(1).map((q, i) => { const [a, b] = [p[i], q], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L * 11, uy = (b[1] - a[1]) / L * 11; return `<path stroke-width="2" d="M${f(a[0] + ux)},${f(a[1] + uy)} L${f(b[0] - ux)},${f(b[1] - uy)}"/>`; }).join('') + p.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11"/>`).join(''); })()],
      ['nut-triglicerideo', 'Triglicerídeo (esquema)', 190, 120, '<rect x="6" y="6" width="34" height="108" rx="4"/><g transform="rotate(-90 23 60)">' + T(23, 60, 'glicerol', 14) + '</g>' + [24, 60, 96].map(y => `<path d="${linha(zig(40, y, 0, 10))}"/>`).join('')],
      ['nut-acidos-graxos', 'Ácido graxo saturado × insaturado', 210, 130, (() => {
        const s = zig(16, 28, 0, 12);
        const a = zig(16, 82, 0, 6), b = zig(a[6][0], a[6][1], -25, 5, 14, 6).map(([x, y]) => [x, y]);
        const k1 = a[5], k2 = a[6];
        const dx = k2[0] - k1[0], dy = k2[1] - k1[1], L = Math.hypot(dx, dy), nx = -dy / L * 4, ny = dx / L * 4;
        return `<path d="${linha(s)}"/>` + T(56, 50, 'saturado', 14) + `<path d="${linha(a)} ${linha(b.slice(1)).replace('M', 'L')}"/>` +
          fino(`M${f(k1[0] + nx)},${f(k1[1] + ny)} L${f(k2[0] + nx)},${f(k2[1] + ny)}`, 2) + T(70, 118, 'insaturado (dobra)', 14);
      })()],
      ['nut-fibra', 'Fibra alimentar', 120, 84, [14, 24, 34, 44, 54].map((y, i) => `<path stroke-width="2" d="M10,${y} C30,${y - 8} 50,${y + 8} 70,${y} S100,${y - 6 + i} 110,${y}"/>`).join('') + T(60, 74, 'fibras', 15)],
      ['nut-macro-pizza', 'Distribuição de macronutrientes', 120, 120, '<circle cx="60" cy="60" r="52"/><path d="M60,60 V8 M60,60 V112 M60,60 L10.5,76.1"/>' + T(88, 60, 'CHO', 15) + T(42, 86, 'PTN', 15) + T(36, 42, 'LIP', 15)],
      ['nut-kcal', 'Energia dos macronutrientes (kcal/g)', 220, 112, '<rect x="6" y="4" width="208" height="104" rx="6"/>' + fino('M6,30 H214 M6,56 H214 M6,82 H214 M124,4 V108') +
        [['Carboidrato', '4 kcal/g'], ['Proteína', '4 kcal/g'], ['Lipídio', '9 kcal/g'], ['Álcool', '7 kcal/g']].map(([a, b], i) => TL(14, 17 + 26 * i, a, 15) + T(169, 17 + 26 * i, b, 15)).join('')],
      vit('nut-vit-a', 'Vitamina A', 'A'),
      vit('nut-vit-c', 'Vitamina C', 'C'),
      vit('nut-vit-d', 'Vitamina D', 'D'),
      vit('nut-vit-b12', 'Vitamina B12', 'B12'),
      mineral('nut-min-ferro', 'Ferro (mineral)', 'Fe', 'ferro'),
      mineral('nut-min-calcio', 'Cálcio (mineral)', 'Ca', 'cálcio'),
      mineral('nut-min-sodio', 'Sódio (mineral)', 'Na', 'sódio'),
      mineral('nut-min-potassio', 'Potássio (mineral)', 'K', 'potássio'),
      mineral('nut-min-iodo', 'Iodo (mineral)', 'I', 'iodo'),
      mineral('nut-min-zinco', 'Zinco (mineral)', 'Zn', 'zinco'),
    ]],
    ['Corpo e metabolismo', [
      ['nut-digestorio', 'Sistema digestório (com nomes)', 322, 242, '<g transform="translate(82,0)">' + DIGEST + '</g>' +
        lider(178, 14, 230, 14) + TL(234, 14, 'boca') + lider(167, 34, 230, 38) + TL(234, 38, 'esôfago') + lider(224, 72, 230, 72) + TL(234, 72, 'estômago') +
        lider(202, 160, 230, 160) + TL(234, 160, 'int. delgado') + lider(182, 228, 230, 228) + TL(234, 228, 'reto') +
        lider(112, 70, 84, 70) + TE(80, 70, 'fígado') + lider(118, 160, 84, 160) + TE(80, 160, 'int. grosso')],
      ['nut-digestorio-branco', 'Sistema digestório (para rotular)', 150, 242, DIGEST],
      ['nut-absorcao', 'Absorção no intestino (vilosidades)', 220, 130, TL(6, 12, 'lúmen') + '<path d="M6,84 H19 ' + [30, 70, 110, 150, 190].map((c, i) => `${i ? `H${c - 11} ` : ''}V44 Q${c - 11},32 ${c},32 Q${c + 11},32 ${c + 11},44 V84 `).join('').replace(/^V/, 'V') + 'H214"/>' +
        [50, 90, 130, 170].map(x => `<circle cx="${x}" cy="30" r="3" fill="#C"/><path stroke-width="1.8" d="M${x},36 V62"/>` + head(x, 70, 90, 8)).join('') +
        [30, 70, 110, 150, 190].map(x => trac(`M${x},44 V96`, 1.4)).join('') + '<path d="M6,104 H206"/>' + head(214, 104, 0, 10) + T(110, 120, 'sangue / linfa', 14)],
      balanca(0, 'nut-balanco-equilibrio', 'Balanço energético (equilíbrio)'),
      balanca(12, 'nut-balanco-positivo', 'Balanço energético positivo (ganho)'),
      balanca(-12, 'nut-balanco-negativo', 'Balanço energético negativo (perda)'),
      ['nut-get', 'Gasto energético total (componentes)', 200, 166, '<rect x="20" y="8" width="56" height="150"/>' + fino('M20,48 H76 M20,64 H76') + '<path d="M84,8 H90 V48 H84 M84,48 H90 V64 H84 M84,64 H90 V158 H84"/>' +
        TL(98, 28, 'Atividade física') + TL(98, 56, 'ETA') + TL(98, 111, 'TMB') + T(48, 111, 'GET', 16)],
      ['nut-glicemia', 'Glicemia × tempo', 220, 156, eixos(30, 130, 210, 10) + '<path d="M30,100 C66,100 70,32 100,34 C130,36 140,98 196,98"/>' + trac('M30,100 H200', 1.3) + TL(38, 12, 'glicemia') + T(186, 146, 'tempo', 14)],
      ['nut-indice-glicemico', 'Índice glicêmico alto × baixo', 220, 156, eixos(30, 130, 210, 10) + '<path d="M30,104 C56,104 58,26 80,28 C104,30 104,110 140,112 H196"/>' + '<path stroke-dasharray="7 5" d="M30,104 C70,104 80,70 110,70 C140,70 160,96 196,98"/>' + TL(96, 30, 'IG alto') + TL(118, 60, 'IG baixo') + TL(38, 12, 'glicemia') + T(186, 146, 'tempo', 14)],
      ['nut-composicao', 'Composição corporal (2 compartimentos)', 190, 160, '<rect x="16" y="8" width="60" height="144"/><path d="M16,52 H76"/>' + '<path fill="#C" fill-opacity="0.25" stroke="none" d="M16,8 H76 V52 H16 Z"/>' + TL(86, 30, 'massa gorda') + TL(86, 102, 'massa magra')],
      ['nut-catabolismo', 'Catabolismo × anabolismo', 240, 110, '<path stroke-width="2" d="M22,55 H70"/><circle cx="22" cy="55" r="8"/><circle cx="38" cy="55" r="8"/><circle cx="54" cy="55" r="8"/><circle cx="70" cy="55" r="8"/>' +
        '<circle cx="176" cy="40" r="8"/><circle cx="210" cy="34" r="8"/><circle cx="190" cy="72" r="8"/><circle cx="222" cy="66" r="8"/>' +
        '<path d="M92,38 H150"/>' + head(158, 38, 0, 11) + '<path d="M158,74 H100"/>' + head(92, 74, 180, 11) + T(125, 22, 'catabolismo', 14) + T(125, 92, 'anabolismo', 14)],
    ]],
    ['Avaliação nutricional', [
      ['nut-fita-metrica', 'Fita métrica', 160, 70, '<circle cx="30" cy="40" r="24"/>' + fino('M30,40 m-14,0 a14,14 0 1,0 28,0 a14,14 0 1,0 -28,0') + '<circle cx="30" cy="40" r="3" fill="#C"/><path d="M30,16 H150 V32 H52"/><rect x="150" y="12" width="6" height="24" fill="#C"/>' + marcasHor(56, 146, 16, 6)],
      ['nut-balanca-digital', 'Balança digital (plataforma)', 100, 100, '<rect x="6" y="6" width="88" height="88" rx="14"/><rect x="30" y="14" width="40" height="20" rx="3"/>' + T(50, 24, 'kg', 14) + fino('M24,52 Q34,46 40,56 Q42,82 30,84 Q20,80 24,52 Z M76,52 Q66,46 60,56 Q58,82 70,84 Q80,80 76,52 Z')],
      ['nut-balanca-mecanica', 'Balança mecânica (adulto)', 100, 216, '<rect x="8" y="196" width="84" height="14" rx="3"/><path d="M56,196 V44 M64,196 V44"/><rect x="12" y="28" width="84" height="16" rx="2"/>' + marcasHor(18, 90, 28, 6) + '<rect x="40" y="22" width="8" height="12" fill="#C"/>'],
      ['nut-adipometro', 'Adipômetro (dobras cutâneas)', 150, 100, '<circle cx="36" cy="36" r="24"/>' + fino('M36,36 L48,22 M36,16 V20 M56,36 H52 M16,36 H20') + '<path d="M60,30 H136 V80 M56,50 L118,48 V80 M40,60 L28,96"/>' + fino('M92,94 Q110,94 116,82 Q127,66 138,82 Q141,92 147,94', 2)],
      ['nut-estadiometro', 'Estadiômetro', 100, 220, '<rect x="6" y="206" width="88" height="10" rx="2"/><rect x="60" y="8" width="12" height="198"/>' + marcasVert(60, 14, 200, 8) + '<rect x="22" y="62" width="64" height="8" rx="2"/>' + pessoa(36, 70, 0.78)],
      ['nut-infantometro', 'Infantômetro', 200, 66, '<rect x="6" y="40" width="188" height="20" rx="2"/><rect x="6" y="8" width="12" height="52"/><rect x="150" y="14" width="10" height="46"/>' + marcasHor(24, 186, 40, 8)],
      ['nut-grafico-crescimento', 'Gráfico de crescimento (em branco)', 230, 180, "<g transform=\"translate(0.00 3.00)\">" + (grade(30, 10, 210, 150, 20) + eixos(30, 150, 214, 6) + TL(36, 14, 'peso') + T(186, 162, 'idade', 14)) + "</g>"],
      ['nut-curvas-percentis', 'Curvas de percentis (esquemáticas)', 241, 180, "<g transform=\"translate(0.00 1.00)\">" + (eixos(30, 150, 210, 8) + `<path stroke-dasharray="7 5" d="${curvaPerc(110, 6)}"/><path d="${curvaPerc(84, 0)}"/><path stroke-dasharray="7 5" d="${curvaPerc(58, -4)}"/>` + TL(212, 39, 'P97') + TL(212, 70, 'P50') + TL(212, 98, 'P3') + T(184, 164, 'idade', 14)) + "</g>"],
      ['nut-imc-faixas', 'Faixas de IMC (barra)', 300, 84, '<rect x="6" y="8" width="288" height="44" rx="4"/><path d="M78,8 V60 M150,8 V60 M222,8 V60"/>' + T(42, 22, 'baixo', 14) + T(42, 38, 'peso', 14) + T(114, 30, 'eutrofia', 14) + T(186, 30, 'sobrepeso', 14) + T(258, 30, 'obesidade', 14) + T(78, 72, '18,5', 14) + T(150, 72, '25', 14) + T(222, 72, '30', 14)],
      ['nut-imc-formula', 'Fórmula do IMC', 200, 80, T(36, 40, 'IMC =', 18) + T(130, 22, 'peso (kg)', 16) + '<path d="M72,40 H188"/>' + T(130, 59, 'altura² (m²)', 16)],
      ['nut-cintura', 'Circunferência da cintura', 120, 150, '<path d="M48,6 V18 Q22,20 16,34 Q14,60 28,80 Q34,92 30,104 Q24,124 28,146 H92 Q96,124 90,104 Q86,92 92,80 Q106,60 104,34 Q98,20 72,18 V6"/><path stroke-dasharray="6 4" d="M60,92 m-34,0 a34,7 0 1,0 68,0 a34,7 0 1,0 -68,0"/>'],
      ['nut-braco', 'Circunferência do braço', 90, 130, '<path d="M28,6 Q18,40 22,80 Q24,104 30,124 M64,6 Q72,40 66,80 Q62,104 60,124"/><path stroke-dasharray="6 4" d="M44,58 m-24,0 a24,6 0 1,0 48,0 a24,6 0 1,0 -48,0"/>' + fino('M30,124 Q45,128 60,124')],
    ]],
    ['Ciclos de vida e dietoterapia', [
      ['nut-adulto', 'Adulto (silhueta)', 60, 186, pessoa(30, 4)],
      ['nut-gestante', 'Gestante (silhueta)', 70, 186, pessoa(30, 4, 1, '<ellipse cx="40" cy="84" rx="14" ry="17" fill="#C" stroke="none"/>')],
      ['nut-crianca', 'Criança (silhueta)', 46, 126, pessoa(23, 4, 0.68)],
      ['nut-idoso', 'Idoso com bengala (silhueta)', 80, 186, `<g transform="rotate(6 30 180)">${pessoa(30, 6)}</g><path stroke-width="3" d="M58,108 V182 M58,108 Q58,100 50,100"/>`],
      ['nut-bebe', 'Bebê (enrolado)', 100, 70, '<circle cx="24" cy="34" r="16"/><path d="M38,22 Q70,16 92,34 Q70,54 38,46"/>' + fino('M50,22 Q56,34 50,48 M66,22 Q72,34 66,50') + '<circle cx="19" cy="32" r="1.6" fill="#C"/><circle cx="29" cy="32" r="1.6" fill="#C"/>' + fino('M20,40 Q24,43 28,40')],
      ['nut-mamadeira', 'Mamadeira', 50, 120, '<path d="M20,22 Q20,6 25,4 Q30,6 30,22"/><rect x="12" y="22" width="26" height="10" rx="2"/><path d="M14,32 H36 V112 Q36,116 32,116 H18 Q14,116 14,112 Z"/>' + fino('M14,56 H22 M14,74 H22 M14,92 H22') + trac('M15,46 H35', 1.3)],
      ['nut-aleitamento', 'Aleitamento materno (ícone)', 120, 120, '<circle cx="72" cy="22" r="14" fill="#C" stroke="none"/><path d="M36,114 Q36,50 72,44 Q108,50 108,114"/><circle cx="56" cy="74" r="10" fill="#C" stroke="none"/><path stroke-width="7" d="M44,94 Q64,96 92,72"/><path d="M18,34 C10,26 14,18 20,22 C26,18 30,26 22,34 L20,36 Z"/>'],
      ['nut-sonda', 'Nutrição enteral (sonda nasoenteral)', 140, 180, '<rect x="6" y="4" width="30" height="40" rx="4"/>' + T(21, 24, 'D', 14) + '<path d="M21,44 V52 Q21,64 42,58"/>' +
        '<path d="M82,14 Q54,14 50,44 L42,56 L50,60 Q50,74 60,80 V100 M82,14 Q112,16 112,46 Q112,70 98,82 V100"/>' + trac('M48,58 Q66,64 72,92 V124', 1.8) +
        '<path d="M68,124 Q62,160 86,164 Q114,166 112,140 Q110,124 94,128 Q82,132 76,124"/>'],
      ['nut-frasco-enteral', 'Frasco de dieta enteral', 70, 146, '<path d="M35,4 V12"/><rect x="14" y="12" width="42" height="78" rx="6"/>' + T(35, 50, 'dieta', 14) + '<path d="M28,90 V98 H42 V90"/><rect x="30" y="98" width="10" height="20" rx="2"/>' + trac('M31,110 H39', 1.2) + '<path d="M35,118 V132 Q35,142 50,142"/>'],
      ['nut-bomba-infusao', 'Bomba de infusão (dieta)', 100, 118, '<rect x="10" y="18" width="80" height="80" rx="6"/><rect x="18" y="26" width="64" height="24" rx="2"/>' + T(50, 38, 'mL/h', 14) + '<circle cx="30" cy="68" r="6"/><circle cx="50" cy="68" r="6"/><circle cx="70" cy="68" r="6"/>' + '<path d="M50,4 V18 M50,98 V114"/>' + fino('M22,86 H78')],
      ['nut-consistencias', 'Consistências de dieta', 256, 91, "<g transform=\"translate(0.00 0.00)\">" + (tigela(34, fino('M12,40 q5,-3 10,0 t10,0 t10,0 t10,0'), 'líquida') + tigela(96, '<path d="M72,34 Q96,16 120,34"/>', 'pastosa') +
        tigela(158, '<path d="M134,34 Q140,22 150,24 Q158,16 166,24 Q178,22 182,34"/>', 'branda') + tigela(220, '<circle cx="206" cy="27" r="7"/><rect x="216" y="20" width="12" height="12" rx="2"/><path d="M232,32 L240,22"/>', 'geral')) + "</g>"],
    ]],
    ['Unidade de alimentação (UAN)', [
      ['nut-planta-uan', 'Cozinha industrial (planta baixa)', 288, 160, '<rect x="6" y="6" width="276" height="148"/><path d="M98,6 V154 M190,6 V154 M6,80 H282"/>' +
        T(52, 26, 'Recebimento', 14) + T(144, 26, 'Estoque', 14) + T(236, 26, 'Pré-preparo', 14) + T(226, 104, 'Cocção', 14) + T(144, 104, 'Distribuição', 14) + T(52, 104, 'Refeitório', 14) +
        '<path stroke-width="2" d="M80,56 H110 M172,56 H202 M266,46 V106 M208,132 H178 M116,132 H86"/>' + head(118, 56, 0, 10) + head(210, 56, 0, 10) + head(266, 114, 90, 10) + head(170, 132, 180, 10) + head(78, 132, 180, 10)],
      ['nut-fluxo-producao', 'Fluxo de produção de refeições', 180, 234, ['Recebimento', 'Armazenamento', 'Pré-preparo', 'Cocção (preparo)', 'Distribuição'].map((s, i) => caixa(10, 6 + 48 * i, 160, 28, s) + (i < 4 ? `<path d="M90,${34 + 48 * i} V${46 + 48 * i}"/>` + head(90, 54 + 48 * i, 90, 9) : '')).join('')],
      ['nut-bandeja', 'Bandeja (bandejão)', 160, 110, '<rect x="6" y="6" width="148" height="98" rx="10"/>' + fino('M18,14 H52 Q56,14 56,18 V42 Q56,46 52,46 H18 Q14,46 14,42 V18 Q14,14 18,14 Z M64,14 H92 Q96,14 96,18 V42 Q96,46 92,46 H64 Q60,46 60,42 V18 Q60,14 64,14 Z M18,52 H92 Q96,52 96,56 V92 Q96,96 92,96 H18 Q14,96 14,92 V56 Q14,52 18,52 Z', 2) + '<circle cx="125" cy="34" r="20"/>' + fino('M108,64 H142 Q146,64 146,68 V92 Q146,96 142,96 H108 Q104,96 104,92 V68 Q104,64 108,64 Z', 2)],
      ['nut-termometro-espeto', 'Termômetro de espeto (alimentos)', 60, 150, '<rect x="14" y="6" width="32" height="64" rx="8"/><rect x="19" y="14" width="22" height="22" rx="2"/>' + T(30, 25, '°C', 14) + '<circle cx="30" cy="52" r="6"/><path stroke-width="3" d="M30,70 V140 L30,146"/>'],
      ['nut-zona-perigo', 'Zona de perigo de temperatura', 180, 200, '<path d="M20,12 Q20,6 26,6 Q32,6 32,12 V162 A12,12 0 1,1 20,162 Z"/><circle cx="26" cy="172" r="7" fill="#C"/><path stroke-width="4" d="M26,164 V60"/>' +
        '<rect x="48" y="8" width="126" height="48" rx="4"/>' + T(111, 24, '&gt; 60 °C', 15) + T(111, 42, 'seguro (quente)', 14) +
        '<rect x="48" y="66" width="126" height="68" rx="4" stroke-width="4"/>' + T(111, 88, 'zona de perigo', 15) + T(111, 110, '5 a 60 °C', 15) +
        '<rect x="48" y="144" width="126" height="48" rx="4"/>' + T(111, 160, '&lt; 5 °C', 15) + T(111, 178, 'seguro (frio)', 14)],
      ['nut-caldeirao', 'Caldeirão (panela industrial)', 120, 92, '<path d="M18,34 H102 V82 Q102,88 96,88 H24 Q18,88 18,82 Z M18,44 H8 V56 H18 M102,44 H112 V56 H102 M14,34 Q60,6 106,34"/><circle cx="60" cy="16" r="4"/>'],
      ['nut-fogao', 'Fogão industrial', 140, 104, '<rect x="10" y="30" width="120" height="68" rx="3"/><path d="M14,30 V22 H62 V30 M78,30 V22 H126 V30 M26,22 V30 M38,22 V30 M50,22 V30 M90,22 V30 M102,22 V30 M114,22 V30"/>' +
        '<circle cx="28" cy="42" r="4"/><circle cx="54" cy="42" r="4"/><circle cx="86" cy="42" r="4"/><circle cx="112" cy="42" r="4"/><rect x="22" y="54" width="96" height="38" rx="2"/>' + fino('M34,62 H106')],
      ['nut-balcao-termico', 'Balcão térmico (distribuição)', 200, 100, '<rect x="10" y="48" width="180" height="32" rx="2"/><path d="M20,80 V96 M180,80 V96 M30,48 V14 M170,48 V14 M24,14 H176 M30,14 L18,32"/>' +
        fino('M32,48 L36,58 H60 L64,48 M74,48 L78,58 H102 L106,48 M116,48 L120,58 H144 L148,48') + trac('M48,40 q-4,-6 0,-12 M90,40 q-4,-6 0,-12 M132,40 q-4,-6 0,-12', 1.4)],
      ['nut-peps', 'PEPS (primeiro que entra, primeiro que sai)', 220, 96, T(110, 14, 'PEPS', 16) + '<path d="M40,72 H180"/>' + caixa(50, 36, 30, 34, '1', 15) + caixa(90, 36, 30, 34, '2', 15) + caixa(130, 36, 30, 34, '3', 15) +
        '<path d="M44,53 H14"/>' + head(8, 53, 180, 10) + '<path d="M214,53 H172"/>' + head(166, 53, 180, 10) + T(24, 82, 'sai', 14) + T(196, 82, 'entra', 14)],
    ]],
    ['Rotulagem', [
      ['nut-tabela-nutricional', 'Tabela de informação nutricional (em branco)', 290, 264, '<rect x="6" y="6" width="278" height="252"/>' + T(145, 21, 'Informação nutricional', 16) + '<path stroke-width="3.5" d="M6,36 H284"/>' + TL(14, 49, 'Porção: ____ g') +
        '<path d="M6,62 H284 M6,84 H284"/>' + T(173, 73, '100 g', 14) + T(220, 73, 'porção', 14) + T(264, 73, '%VD', 14) +
        fino('M150,62 V258 M196,62 V258 M244,62 V258') +
        ['Energia (kcal)', 'Carboidratos (g)', 'Açúcares (g)', 'Proteínas (g)', 'Gorduras tot. (g)', 'Gord. saturadas (g)', 'Fibras (g)', 'Sódio (mg)'].map((s, i) => TL(12, 95 + 22 * i, s) + (i < 7 ? fino(`M6,${106 + 22 * i} H284`, 1.2) : '')).join('')],
      ['nut-alerta-lupa', 'Alerta frontal (lupa genérica)', 140, 130, '<circle cx="60" cy="54" r="48"/><path stroke-width="9" d="M95,89 L128,122"/>' + T(60, 36, 'ALTO EM', 17) + '<path stroke-width="1.8" d="M26,62 H94 M30,82 H90"/>'],
      ['nut-ingredientes', 'Lista de ingredientes', 210, 110, '<rect x="6" y="6" width="198" height="98" rx="4"/>' + TL(14, 22, 'Ingredientes:', 15) + fino('M14,44 H196 M14,62 H196', 1.4) + TL(14, 86, 'Alérgicos:', 14) + fino('M92,92 H196', 1.4)],
      ['nut-validade', 'Validade e lote', 170, 70, '<rect x="6" y="6" width="158" height="58" rx="4"/>' + TL(14, 23, 'Val.: __/__/____') + TL(14, 47, 'Lote: ________')],
      ['nut-sem-gluten', 'Sem glúten', 100, 109, "<g transform=\"translate(0.00 0.00)\">" + ('<circle cx="50" cy="50" r="44"/>' + trigo(18, 14, 0.8) + '<path stroke-width="4" d="M19,19 L81,81"/>') + "</g>"],
      ['nut-embalagem', 'Embalagem (painel frontal)', 140, 180, '<rect x="10" y="6" width="120" height="168" rx="4"/>' + T(70, 30, 'Produto', 15) + fino('M18,44 H122') + '<rect x="20" y="56" width="58" height="46" rx="3" stroke-dasharray="5 4"/>' + T(49, 79, 'alerta', 14) + T(70, 158, 'Peso líq.: ___ g', 14)],
    ]],
  ],
};
