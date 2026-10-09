// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Formas de Filosofia e Sociologia (prefixo 'fil-'): lógica, conhecimento, ética, métodos, sociologia; desenhos próprios.
import { T, head } from './base.js';

// Esquemas didáticos desenhados à mão (coordenadas próprias); sem retratos de pessoas reais nem obras de arte.

const f1 = v => +(+v).toFixed(1);
const t = (x, y, s, size = 15) => T(f1(x), f1(y), s, size);
const tl = (x, y, s, size = 15, anchor = 'start') => t(x, y, s, size).replace('text-anchor="middle"', `text-anchor="${anchor}"`);
const P = (d, extra = '') => `<path d="${d}"${extra}/>`;
const fino = d => P(d, ' stroke-width="1.6"');
const trac = d => P(d, ' stroke-width="1.6" stroke-dasharray="5 4"');
const rr = (x, y, w, h, rx = 6, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"${extra}/>`;
const circ = (cx, cy, r, extra = '') => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r}"${extra}/>`;
const dot = (cx, cy, r = 3.5) => circ(cx, cy, r, ' fill="#C" stroke="none"');
const sombra = ' fill="#C" fill-opacity=".28" stroke="none"';
const rad = a => a * Math.PI / 180;

// seta reta de (x1,y1) até a ponta em (x2,y2)
const seta = (x1, y1, x2, y2, extra = '', L = 11) => {
  const a = Math.atan2(y2 - y1, x2 - x1), d = Math.hypot(x2 - x1, y2 - y1), k = (d - L * 0.8) / d;
  return P(`M${f1(x1)},${f1(y1)} L${f1(x1 + (x2 - x1) * k)},${f1(y1 + (y2 - y1) * k)}`, extra) + head(f1(x2), f1(y2), a * 180 / Math.PI, L);
};
const seta2 = (x1, y1, x2, y2, extra = '', L = 11) => { // seta de duas pontas
  const a = Math.atan2(y2 - y1, x2 - x1), d = Math.hypot(x2 - x1, y2 - y1), k = L * 0.8 / d;
  return P(`M${f1(x1 + (x2 - x1) * k)},${f1(y1 + (y2 - y1) * k)} L${f1(x2 - (x2 - x1) * k)},${f1(y2 - (y2 - y1) * k)}`, extra) +
    head(f1(x2), f1(y2), a * 180 / Math.PI, L) + head(f1(x1), f1(y1), a * 180 / Math.PI + 180, L);
};
// arco em sentido horário (ângulos em graus, a1 > a0) com ponta no fim
const arcSeta = (cx, cy, r, a0, a1, L = 10, extra = '') => {
  const b = a1 - (L * 0.75 / r) * 180 / Math.PI;
  const p = a => [f1(cx + r * Math.cos(rad(a))), f1(cy + r * Math.sin(rad(a)))];
  const [x0, y0] = p(a0), [xb, yb] = p(b), [x1, y1] = p(a1);
  return P(`M${x0},${y0} A${r},${r} 0 ${b - a0 > 180 ? 1 : 0},1 ${xb},${yb}`, extra) + head(x1, y1, a1 + 90 - (L * 0.4 / r) * 180 / Math.PI, L);
};
// liga dois círculos (centro e raio) com linha ou seta, sem entrar neles
const ligar = (x1, y1, r1, x2, y2, r2, comSeta = true, extra = '') => {
  const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
  const a = [x1 + ux * r1, y1 + uy * r1], b = [x2 - ux * r2, y2 - uy * r2];
  return comSeta ? seta(a[0], a[1], b[0], b[1], extra, 10) : P(`M${f1(a[0])},${f1(a[1])} L${f1(b[0])},${f1(b[1])}`, extra);
};
// boneco de palito com os pés em (x, y)
const boneco = (x, y, s = 1, extra = ' stroke-width="1.8"') =>
  circ(x, y - 19 * s, f1(4 * s), extra) + P(`M${x},${f1(y - 15 * s)} V${f1(y - 7 * s)} M${f1(x - 5 * s)},${f1(y - 12 * s)} H${f1(x + 5 * s)} M${f1(x - 4 * s)},${y} L${x},${f1(y - 7 * s)} L${f1(x + 4 * s)},${y}`, extra);
// busto genérico (cabeça e ombros), base dos ombros em y
const busto = (cx, y, s = 1, extra = '') =>
  circ(cx, y - 30 * s, f1(9 * s), extra) + P(`M${f1(cx - 17 * s)},${y} Q${f1(cx - 17 * s)},${f1(y - 18 * s)} ${cx},${f1(y - 18 * s)} Q${f1(cx + 17 * s)},${f1(y - 18 * s)} ${f1(cx + 17 * s)},${y}`, extra);
const xis = (x, y, r = 6, w = 3) => P(`M${x - r},${y - r} L${x + r},${y + r} M${x + r},${y - r} L${x - r},${y + r}`, ` stroke-width="${w}"`);
const certo = (x, y, s = 1, w = 3) => P(`M${f1(x - 7 * s)},${y} L${f1(x - 2 * s)},${f1(y + 6 * s)} L${f1(x + 8 * s)},${f1(y - 7 * s)}`, ` stroke-width="${w}"`);
const portico = (x0, x1, yTopo, yBase, ncol, rotulo = '') => { // fachada clássica genérica
  const cx = (x0 + x1) / 2, w = x1 - x0;
  let s = P(`M${x0},${yTopo + 24} L${cx},${yTopo} L${x1},${yTopo + 24} Z`) + rr(x0 + 4, yTopo + 24, w - 8, 8, 1);
  for (let i = 0; i < ncol; i++) { const x = x0 + 14 + (w - 28) * i / (ncol - 1); s += rr(f1(x - 4), yTopo + 32, 8, yBase - yTopo - 38, 1); }
  s += P(`M${x0 + 2},${yBase - 6} H${x1 - 2} M${x0 - 4},${yBase} H${x1 + 4}`);
  return s + (rotulo ? t(cx, yTopo + 15, rotulo, 14) : '');
};

// ---------- Lógica ----------
const linhaPreencher = (y, x0 = 44) => P(`M${x0},${y} H232`, ' stroke-width="1.6" stroke-dasharray="5 4"');
const portanto = (x, y) => dot(x, y - 6, 2.6) + dot(x - 7, y + 5, 2.6) + dot(x + 7, y + 5, 2.6);
const silogismo = t(20, 22, 'P1', 16) + linhaPreencher(30) + t(20, 58, 'P2', 16) + linhaPreencher(66) +
  P('M8,84 H232') + portanto(20, 104) + linhaPreencher(112);
const silogismoEx = t(18, 20, 'P1', 14) + t(126, 20, 'Todo M é P', 17) + t(18, 50, 'P2', 14) + t(126, 50, 'Todo S é M', 17) +
  P('M8,68 H222') + portanto(18, 92) + t(126, 92, 'Todo S é P', 17);

const quadrado = (() => {
  const a = 56, b = 184, c = 56, d = 176;
  return P(`M${a},${c} H${b} M${a},${d} H${b}`) +
    P(`M${a},${c + 6} V${d - 14} M${b},${c + 6} V${d - 14}`) + head(a, d - 4, 90, 11) + head(b, d - 4, 90, 11) +
    trac('M61,60.7 L98,95.4 M142,136.6 L179,171.3 M179,60.7 L142,95.4 M98,136.6 L61,171.3') +
    dot(a, c, 4) + dot(b, c, 4) + dot(a, d, 4) + dot(b, d, 4) +
    t(32, 36, 'A', 24) + t(208, 36, 'E', 24) + t(32, 198, 'I', 24) + t(208, 198, 'O', 24) +
    t(120, 44, 'contrárias', 14) + t(120, 190, 'subcontrárias', 14) + t(120, 120, 'contraditórias', 14) +
    `<g transform="rotate(-90 42 116)">${t(42, 116, 'subalternas', 14)}</g><g transform="rotate(90 198 116)">${t(198, 116, 'subalternas', 14)}</g>`;
})();
const quadradoVazio = rr(6, 8, 90, 38) + rr(164, 8, 90, 38) + rr(6, 154, 90, 38) + rr(164, 154, 90, 38) +
  t(20, 27, 'A', 16) + t(178, 27, 'E', 16) + t(20, 173, 'I', 16) + t(178, 173, 'O', 16) +
  P('M96,27 H164 M96,173 H164 M51,46 V154 M209,46 V154') + trac('M96,46 L164,154 M164,46 L96,154');

const tabela = (x0, y0, cols, hHead, hRow, nRows) => { // grade de tabela: retângulo, divisões e cabeçalho reforçado
  const W = cols.reduce((a, b) => a + b, 0), H = hHead + hRow * nRows;
  let v = '', h = '', x = x0;
  for (let i = 0; i < cols.length - 1; i++) { x += cols[i]; v += `M${x},${y0} V${y0 + H} `; }
  for (let j = 1; j < nRows; j++) h += `M${x0},${y0 + hHead + j * hRow} H${x0 + W} `;
  return rr(x0, y0, W, H, 2) + P(v, ' stroke-width="1.8"') + fino(h) + P(`M${x0},${y0 + hHead} H${x0 + W}`);
};
const celulas = (x0, y0, cols, hHead, hRow, linhas, size = 15) => { // linhas: matriz de textos por linha (null = vazio)
  let s = '';
  linhas.forEach((ln, j) => { let x = x0; ln.forEach((v, i) => { if (v) s += t(x + cols[i] / 2, j === 0 ? y0 + hHead / 2 : y0 + hHead + (j - 0.5) * hRow, v, size); x += cols[i]; }); });
  return s;
};
const tv2 = (() => {
  const c = [40, 40, 64, 64];
  return tabela(6, 6, c, 28, 28, 4) + celulas(6, 6, c, 28, 28, [['p', 'q'], ['V', 'V'], ['V', 'F'], ['F', 'V'], ['F', 'F']], 16);
})();
const tv3 = (() => {
  const c = [34, 34, 34, 66, 66], L = [['p', 'q', 'r']];
  for (let i = 0; i < 8; i++) L.push([i < 4 ? 'V' : 'F', (i >> 1) % 2 ? 'F' : 'V', i % 2 ? 'F' : 'V']);
  return tabela(4, 4, c, 24, 21, 8) + celulas(4, 4, c, 24, 21, L, 14);
})();
const tvConect = (() => {
  const c = [36, 36, 36, 36, 36, 36, 36];
  return tabela(4, 4, c, 26, 28, 4) + celulas(4, 4, c, 26, 28, [
    ['p', 'q', '¬p', 'p∧q', 'p∨q', 'p→q', 'p↔q'],
    ['V', 'V', 'F', 'V', 'V', 'V', 'V'], ['V', 'F', 'F', 'F', 'V', 'F', 'F'],
    ['F', 'V', 'V', 'F', 'V', 'V', 'F'], ['F', 'F', 'V', 'F', 'F', 'V', 'V']], 14);
})();
const conectivo = (id, nome, sim, rot) => [id, nome, 100, 84, sim + t(50, 70, rot, 14)];
const W4 = ' stroke-width="4"';
const conectivos = [
  conectivo('fil-con-neg', 'Negação (¬, não)', P('M28,24 H70 V40', W4), 'não'),
  conectivo('fil-con-e', 'Conjunção (∧, e)', P('M32,48 L50,12 L68,48', W4), 'e'),
  conectivo('fil-con-ou', 'Disjunção (∨, ou)', P('M32,12 L50,48 L68,12', W4), 'ou'),
  conectivo('fil-con-implica', 'Condicional (→)', P('M20,30 H70', W4) + head(84, 30, 0, 16), 'se… então'),
  conectivo('fil-con-bicond', 'Bicondicional (↔)', P('M30,30 H70', W4) + head(86, 30, 0, 16) + head(14, 30, 180, 16), 'se e só se'),
  conectivo('fil-con-xor', 'Ou exclusivo (⊻)', P('M32,8 L50,40 L68,8 M32,50 H68', W4), 'ou exclusivo'),
];
const quantif = P('M24,10 L40,50 L56,10 M31.2,28 H48.8', W4) + P('M100,10 H124 V50 H100 M104,30 H124', W4) +
  t(40, 70, 'para todo', 14) + t(112, 70, 'existe', 14);

const venn3 = circ(74, 72, 46) + circ(126, 72, 46) + circ(100, 116, 46) + t(22, 28, 'S', 18) + t(178, 28, 'P', 18) + t(100, 176, 'M', 18);
const vennBase = (extra, rot) => circ(70, 58, 42) + circ(120, 58, 42) + extra + t(28, 14, 'S', 17) + t(162, 14, 'P', 17) + t(95, 122, rot, 15);
const vennA = vennBase(P('M95,24.25 A42,42 0 1,0 95,91.75 A42,42 0 0,1 95,24.25 Z', sombra), 'Todo S é P');
const vennE = vennBase(P('M95,24.25 A42,42 0 0,1 95,91.75 A42,42 0 0,1 95,24.25 Z', sombra), 'Nenhum S é P');
const vennI = vennBase(xis(95, 58, 7), 'Algum S é P');
const vennO = vennBase(xis(54, 58, 7), 'Algum S não é P');

const arvoreArg = rr(70, 6, 120, 34, 8, ' stroke-width="3"') + t(130, 23, 'Tese', 16) +
  rr(6, 150, 96, 34) + t(54, 167, 'Premissa 1', 14) + rr(112, 150, 96, 34) + t(160, 167, 'Premissa 2', 14) +
  P('M54,150 V122 H160 V150') + seta(107, 122, 107, 41) +
  rr(168, 76, 86, 34) + t(211, 93, 'Objeção', 14) + seta(206, 76, 180, 42, ' stroke-dasharray="5 4"') + xis(205, 56, 5, 2.5);
const dedInd = t(62, 12, 'Dedução', 15) + t(62, 34, 'geral', 14) + P('M22,46 H102 L62,108 Z') + seta(62, 54, 62, 96) + t(62, 124, 'particular', 14) +
  trac('M125,6 V132') +
  t(188, 12, 'Indução', 15) + t(188, 34, 'geral', 14) + P('M148,108 H228 L188,46 Z') + seta(188, 100, 188, 60) + t(188, 124, 'particulares', 14);

// ---------- Falácias (desenho em 180 de largura, nome embaixo) ----------
const falacia = (id, nome, corpo, rot) => [id, nome, 180, 112, `<g transform="translate(10 0)">${corpo}</g>` + t(90, 100, rot, 14)];
const falacias = [
  falacia('fil-fal-espantalho', 'Falácia do espantalho',
    P('M64,10 H96 M72,10 V2 H88 V10') + circ(80, 20, 10) + P('M44,40 H116', ' stroke-width="3"') +
    fino('M44,40 l-7,-5 M44,40 l-8,1 M44,40 l-6,6 M116,40 l7,-5 M116,40 l8,1 M116,40 l6,6') +
    P('M66,32 H94 L98,70 H62 Z M80,70 V86') + fino('M60,86 H100'), 'espantalho'),
  falacia('fil-fal-ad-hominem', 'Falácia ad hominem',
    rr(6, 8, 88, 38, 12) + P('M24,46 L20,58 L38,46') + t(50, 27, 'argumento', 14) +
    busto(132, 70, 1.1) + P('M14,74 Q70,96 110,62', ' stroke-width="2.5"') + head(116, 56, -50, 12), 'ad hominem'),
  falacia('fil-fal-circular', 'Raciocínio circular',
    arcSeta(80, 46, 32, -78, 78, 11) + arcSeta(80, 46, 32, 102, 258, 11) + t(80, 46, 'A', 22), 'raciocínio circular'),
  falacia('fil-fal-ladeira', 'Ladeira escorregadia',
    P('M14,86 H146 V22 Z') + circ(116, 26.5, 9) + seta(90, 36, 44, 58, '', 11) + t(24, 72, '!', 18), 'ladeira escorregadia'),
  falacia('fil-fal-dilema', 'Falso dilema',
    P('M80,86 V58') + seta(80, 58, 42, 22) + seta(80, 58, 118, 22) + trac('M80,58 V30') +
    t(30, 14, 'A', 16) + t(130, 14, 'B', 16) + t(80, 16, '?', 18), 'falso dilema'),
  falacia('fil-fal-autoridade', 'Apelo à autoridade',
    P('M66,14 L70,4 L75,11 L80,2 L85,11 L90,4 L94,14 Z', ' stroke-width="1.8"') + busto(80, 56, 1.05) + rr(56, 56, 48, 30, 2), 'apelo à autoridade'),
  falacia('fil-fal-generalizacao', 'Generalização apressada',
    busto(24, 66, 0.8) + seta(48, 48, 88, 48) +
    [104, 124, 144].map(x => [24, 48, 72].map(y => circ(x, y, 6, ' stroke-width="1.8"')).join('')).join(''), 'generalização apressada'),
  falacia('fil-fal-pista', 'Falsa pista (desvio)',
    trac('M10,74 H140') + head(152, 74, 0, 11) + P('M10,74 H54 Q84,74 98,46') + head(103, 37, -62, 12) +
    P('M106,28 Q124,12 142,28 Q124,44 106,28 Z M142,28 L156,18 V38 Z') + dot(116, 26, 2.2), 'falsa pista'),
  falacia('fil-fal-poshoc', 'Falsa causa (post hoc)',
    seta(8, 80, 154, 80) + circ(44, 50, 15) + t(44, 50, 'A', 16) + circ(116, 50, 15) + t(116, 50, 'B', 16) +
    P('M54,36 Q80,16 104,34') + head(108, 38, 40, 10) + t(80, 12, '?', 18), 'post hoc (falsa causa)'),
  falacia('fil-fal-maioria', 'Apelo à maioria',
    busto(34, 86, 0.75) + busto(57, 80, 0.75) + busto(80, 86, 0.75) + busto(103, 80, 0.75) + busto(126, 86, 0.75) +
    certo(80, 20, 1.4, 3.5), 'apelo à maioria'),
];

// ---------- Teoria do conhecimento ----------
const caverna = P('M14,150 V44 Q14,18 60,14 Q130,8 180,34 L246,8') + P('M214,150 V98 L268,52') + P('M6,150 H214') +
  trac('M24,74 L36,46 L48,74 Z M36,74 V96') + tl(18, 132, 'sombras', 14) +
  P('M78,123 L80,142 H62 V150', ' stroke-width="2"') + circ(80, 116, 7) + P('M106,123 L108,142 H90 V150', ' stroke-width="2"') + circ(108, 116, 7) +
  rr(136, 118, 8, 32, 1) + P('M140,118 V100 M132,100 L140,86 L148,100 Z', ' stroke-width="2"') +
  P('M180,150 Q174,134 184,122 Q184,134 190,130 Q188,118 196,108 Q204,126 198,138 Q204,134 204,126 Q212,142 200,150 Z') +
  fino('M174,150 L206,144 M174,144 L206,150') + t(190, 163, 'fogo', 14) +
  P('M186,112 L40,50', ' stroke-width="1.4" stroke-dasharray="3 4"') +
  t(222, 58, 'saída', 14) + seta(236, 44, 254, 28, '', 10) +
  circ(268, 16, 6) + fino('M268,4 V7 M280,16 H277 M259,16 H256 M276,8 l-2,2 M260,8 l2,2');

const linhaDiv = (() => {
  const ys = [12, 81, 124, 167, 194], x = 96;
  let s = P(`M${x},${ys[0]} V${ys[4]}`, ' stroke-width="3"') + P(ys.map(y => `M${x - 7},${y} H${x + 7}`).join(' '));
  const rot = ['intelecção (nóesis)', 'raciocínio (diánoia)', 'crença (pístis)', 'imaginação (eikasía)'];
  for (let i = 0; i < 4; i++) s += tl(106, (ys[i] + ys[i + 1]) / 2, rot[i], 14);
  s += P(`M84,14 H78 V${ys[2] - 2} H84 M84,${ys[2] + 2} H78 V${ys[4] - 2} H84`, ' stroke-width="1.8"');
  s += t(40, 58, 'inteligível', 14) + t(40, 78, '(epistéme)', 14) + t(40, 150, 'sensível', 14) + t(40, 170, '(dóxa)', 14);
  return s;
})();
const mundos = rr(6, 6, 228, 64, 10) + t(120, 20, 'mundo das ideias', 15) + circ(70, 48, 12) + P('M108,60 L120,36 L132,60 Z') + rr(160, 36, 24, 24, 0) +
  seta2(120, 72, 120, 94) +
  rr(6, 96, 228, 60, 10, ' stroke-dasharray="6 4"') + t(120, 110, 'mundo sensível', 15) +
  P('M58,136 Q60,122 72,124 Q84,126 82,138 Q78,150 68,148 Q56,146 58,136 Z M108,148 L122,124 L134,146 Q120,152 108,148 Z M160,126 L183,124 L186,148 L162,149 Z', ' stroke-width="2"');

const balanca = (cx, xL, xR, yTop = 30, yPrato = 82) => { // balança de dois pratos
  const prato = x => fino(`M${x},${yTop} L${x - 18},${yPrato} M${x},${yTop} L${x + 18},${yPrato}`) +
    P(`M${x - 22},${yPrato} H${x + 22} Q${x + 17},${yPrato + 14} ${x},${yPrato + 14} Q${x - 17},${yPrato + 14} ${x - 22},${yPrato} Z`);
  return circ(cx, yTop - 12, 5) + P(`M${xL},${yTop} H${xR}`, ' stroke-width="3"') + P(`M${cx - 7},${yTop + 6} L${cx},${yTop - 6} L${cx + 7},${yTop + 6} Z`) +
    P(`M${cx},${yTop + 6} V${yTop + 112} M${cx - 30},${yTop + 122} H${cx + 30} M${cx - 16},${yTop + 112} H${cx + 16}`) + prato(xL) + prato(xR);
};
const empRac = balanca(125, 50, 200) + t(50, 128, 'empirismo', 15) + t(50, 146, '(sentidos)', 14) + t(200, 128, 'racionalismo', 15) + t(200, 146, '(razão)', 14);
const tripe = circ(90, 80, 46) + circ(150, 80, 46) + circ(120, 128, 46) +
  t(46, 22, 'crença', 15) + t(194, 22, 'verdade', 15) + t(120, 188, 'justificação', 15) + t(120, 98, 'C', 17) + t(120, 210, 'C = conhecimento', 14);
const fontes = `<ellipse cx="125" cy="80" rx="58" ry="20"/>` + t(125, 80, 'conhecimento', 15) +
  t(46, 18, 'percepção', 14) + t(204, 18, 'memória', 14) + t(46, 142, 'testemunho', 14) + t(204, 142, 'razão', 14) +
  seta(56, 30, 92, 62) + seta(194, 30, 158, 62) + seta(56, 130, 92, 98) + seta(194, 130, 158, 98);
const sujObj = busto(36, 84, 1.2) + t(36, 100, 'sujeito', 14) +
  P('M180,48 L196,38 H226 V68 L210,78 M180,48 H210 V78 H180 Z M210,48 L226,38') + t(203, 100, 'objeto', 14) +
  seta(66, 46, 172, 46) + t(120, 32, 'conhece', 14) + seta(172, 72, 66, 72, ' stroke-dasharray="5 4"') + t(120, 86, 'aparece', 14);
const kant = (() => {
  const c = [80, 86, 86];
  return tabela(6, 6, c, 28, 50, 2) + P('M6,6 L86,34', ' stroke-width="1.4"') +
    t(129, 20, 'a priori', 14) + t(215, 20, 'a posteriori', 14) + t(46, 59, 'analítico', 14) + t(46, 109, 'sintético', 14);
})();
const correspondencia = rr(6, 32, 92, 40, 8) + t(52, 52, 'proposição', 14) + rr(150, 32, 84, 40, 8) + t(192, 52, 'fato', 15) +
  seta2(100, 52, 148, 52) + t(124, 18, 'verdade?', 14) + t(120, 90, '“a neve é branca” ↔ neve branca', 14);
const tabula = rr(10, 8, 130, 82, 4) + rr(20, 18, 110, 62, 2, ' stroke-width="1.6"') + t(75, 104, 'tábula rasa', 14);

// ---------- Ética e política ----------
const justica = balanca(85, 25, 145);
const espectro = seta2(10, 36, 250, 36, '', 13) + P('M40,28 V44 M130,26 V46 M220,28 V44') + fino('M85,31 V41 M175,31 V41') +
  t(40, 62, 'esquerda', 15) + t(130, 62, 'centro', 15) + t(220, 62, 'direita', 15);
const planoPol = seta2(115, 22, 115, 208) + seta2(22, 115, 208, 115) +
  t(115, 10, 'autoritário', 14) + t(115, 220, 'libertário', 14) + t(50, 132, 'esquerda', 14) + t(184, 132, 'direita', 14) +
  t(70, 70, 'I', 14) + t(160, 70, 'II', 14) + t(70, 160, 'III', 14) + t(160, 160, 'IV', 14);
const contrato = portico(70, 150, 8, 62, 4) + rr(84, 84, 52, 44, 3) + fino('M92,96 H128 M92,104 H128 M92,112 H116') + P('M106,122 q4,-6 8,0 t8,0', ' stroke-width="1.6"') +
  seta(110, 82, 110, 66) + busto(46, 178, 0.75) + busto(110, 178, 0.75) + busto(174, 178, 0.75) +
  seta(54, 152, 88, 130) + seta(110, 154, 110, 132) + seta(166, 152, 132, 130) + tl(144, 98, 'contrato', 14) + t(110, 190, 'indivíduos', 14);
const estadoNat = rr(4, 18, 76, 52, 8) + t(42, 34, 'estado de', 14) + t(42, 54, 'natureza', 14) + seta(80, 44, 100, 44) +
  rr(100, 18, 76, 52, 8) + t(138, 34, 'contrato', 14) + t(138, 54, 'social', 14) + seta(176, 44, 196, 44) +
  rr(196, 18, 76, 52, 8) + t(234, 34, 'sociedade', 14) + t(234, 54, 'civil', 14);
const necessidades = (() => {
  const hw = y => 110 * (y - 6) / 170;
  let s = P('M120,6 L230,176 H10 Z') + P([40, 74, 108, 142].map(y => `M${f1(120 - hw(y))},${y} H${f1(120 + hw(y))}`).join(' '), ' stroke-width="1.8"');
  s += t(120, 57, 'estima', 14) + t(120, 91, 'sociais', 14) + t(120, 125, 'segurança', 14) + t(120, 159, 'fisiológicas', 14);
  return s + fino('M128,24 H176') + tl(182, 24, 'realização', 14);
})();
const bonde = P('M6,96 H100 L150,60 H254 M100,96 L150,122 H254') + fino('M20,92 v8 M40,92 v8 M60,92 v8 M80,92 v8') +
  rr(18, 70, 46, 20, 3) + fino('M24,76 h10 v8 h-10 Z M42,76 h10 v8 h-10 Z') + circ(28, 93, 3.5) + circ(54, 93, 3.5) + P('M41,70 V62') +
  P('M94,128 L104,108', ' stroke-width="3"') + dot(104, 108, 3) + boneco(84, 134, 1) +
  [176, 192, 208, 224, 240].map(x => boneco(x, 58, 0.95)).join('') + boneco(214, 120, 0.95);
const agora = portico(30, 200, 6, 116, 5) + P('M24,124 H206') +
  busto(46, 148, 0.55) + busto(82, 146, 0.55) + busto(148, 146, 0.55) + busto(184, 148, 0.55);
const tresPoderes = P('M8,40 L135,6 L262,40 Z') + t(135, 28, 'Estado', 15) +
  [8, 94, 180].map((x, i) => rr(x, 48, 82, 98, 2) + fino(`M${x + 21},54 V84 M${x + 41},54 V84 M${x + 61},54 V84 M${x + 21},110 V140 M${x + 41},110 V140 M${x + 61},110 V140`) +
    t(x + 41, 97, ['Legislativo', 'Executivo', 'Judiciário'][i], 14)).join('') + rr(4, 146, 262, 10, 1);
const urna = rr(14, 48, 82, 54, 3) + P('M36,48 H74', ' stroke-width="4"') + rr(44, 12, 22, 30, 2) + certo(55, 28, 0.8, 2.2) + t(55, 76, 'voto', 16);
const eticas = rr(60, 4, 130, 44, 8) + t(125, 18, 'ética das virtudes', 14) + t(125, 36, '(caráter)', 14) +
  rr(4, 128, 112, 44, 8) + t(60, 142, 'deontologia', 14) + t(60, 160, '(dever)', 14) +
  rr(134, 128, 112, 44, 8) + t(190, 142, 'utilitarismo', 14) + t(190, 160, '(consequências)', 14) +
  circ(125, 90, 24) + t(125, 90, 'ação', 14) + P('M125,48 V66 M106,104 L74,128 M144,104 L176,128');
const meioTermo = P('M14,44 H246') + dot(30, 44, 5) + dot(230, 44, 5) + circ(130, 44, 7, ' fill="#C"') +
  t(30, 22, 'falta', 15) + t(130, 22, 'meio-termo', 15) + t(226, 22, 'excesso', 15) + t(30, 68, '(vício)', 14) + t(130, 68, '(virtude)', 14) + t(226, 68, '(vício)', 14);
const veu = P('M8,12 H172', ' stroke-width="3"') + [24, 48, 72, 96, 120, 144].map(x => fino(`M${x},12 Q${x + 7},48 ${x},80 Q${x - 7},104 ${x},122`)).join('') +
  t(36, 92, '?', 20) + t(84, 50, '?', 20) + t(132, 92, '?', 20);
const corrente = rr(6, 28, 42, 24, 12) + P('M36,36 H66 Q72,36 72,40 Q72,44 66,44 H36') +
  P('M124,36 H98 Q92,36 92,40 Q92,44 98,44 H124') + rr(112, 28, 42, 24, 12) +
  fino('M82,18 V26 M82,54 V62 M74,22 l3,5 M90,22 l-3,5 M74,58 l3,-5 M90,58 l-3,-5');

// ---------- Dialética e métodos ----------
const dialetica = rr(78, 8, 84, 34, 8, ' stroke-width="3"') + t(120, 25, 'síntese', 15) +
  rr(6, 124, 84, 34, 8) + t(48, 141, 'tese', 15) + rr(150, 124, 84, 34, 8) + t(192, 141, 'antítese', 15) +
  seta2(92, 141, 148, 141) + t(120, 124, 'conflito', 14) + seta(60, 122, 100, 46) + seta(180, 122, 140, 46);
const espiral = (() => {
  const N = [[26, 160, 'T'], [96, 160, 'A'], [61, 108, 'S'], [131, 108, 'A'], [96, 56, 'S'], [166, 56, 'A'], [131, 12, 'S']];
  let s = N.map(([x, y, l]) => circ(x, y, 13) + t(x, y, l, 15)).join('');
  s += ligar(26, 160, 13, 96, 160, 13, false, ' stroke-dasharray="4 3"');
  for (let k = 0; k < 3; k++) {
    const [a, b, c] = [N[2 * k], N[2 * k + 1], N[2 * k + 2]];
    s += ligar(a[0], a[1], 13, c[0], c[1], 13) + ligar(b[0], b[1], 13, c[0], c[1], 13);
    if (k < 2) s += ligar(c[0], c[1], 13, N[2 * k + 3][0], N[2 * k + 3][1], 13, false, ' stroke-dasharray="4 3"');
  }
  return s + tl(160, 108, 'S = nova tese', 14);
})();
const socratico = (() => {
  const cx = 120, cy = 112, R = 80, rot = ['pergunta', 'definição', 'exame', 'contradição', 'aporia'], g = [30, 22, 16, 30, 18];
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = -90 + 72 * i;
    s += t(cx + R * Math.cos(rad(a)), cy + R * Math.sin(rad(a)), rot[i], 14) + arcSeta(cx, cy, R, a + g[i], a + 72 - g[(i + 1) % 5], 10);
  }
  return s + t(cx, cy - 9, 'método', 14) + t(cx, cy + 9, 'socrático', 14);
})();
const duvida = rr(10, 8, 180, 34, 6) + t(100, 25, 'sentidos', 14) + xis(204, 25, 6) +
  rr(25, 48, 150, 34, 6) + t(100, 65, 'sonhos', 14) + xis(189, 65, 6) +
  rr(40, 88, 120, 34, 6) + t(100, 105, 'gênio maligno', 14) + xis(174, 105, 6) +
  seta(100, 124, 100, 152) + rr(20, 154, 160, 38, 19, ' stroke-width="3"') + t(100, 173, 'penso, logo existo', 15) + certo(200, 173, 1.1);
const arvoreCart = `<ellipse cx="48" cy="56" rx="38" ry="16"/><ellipse cx="115" cy="22" rx="38" ry="16"/><ellipse cx="182" cy="56" rx="38" ry="16"/>` +
  t(48, 56, 'medicina', 14) + t(115, 22, 'mecânica', 14) + t(182, 56, 'moral', 14) +
  P('M115,170 V100', ' stroke-width="6"') + P('M115,100 L72,70 M115,100 V38 M115,100 L158,70', ' stroke-width="3"') + tl(126, 134, 'física', 14) +
  P('M115,170 Q102,180 86,190 M115,170 V192 M115,170 Q128,180 144,190') + trac('M40,170 H190') + t(115, 206, 'metafísica', 14);
const metCart = P('M6,140 H74 V108 H142 V76 H210 V44 H278') + t(40, 128, 'evidência', 14) + t(108, 96, 'análise', 14) + t(176, 64, 'síntese', 14) + t(244, 32, 'enumeração', 14) +
  t(40, 152, '1', 14) + t(108, 124, '2', 14) + t(176, 92, '3', 14) + t(244, 60, '4', 14);
const popper = rr(6, 54, 76, 34, 8) + t(44, 71, 'hipótese', 14) + seta(82, 71, 104, 71) + rr(104, 54, 56, 34, 8) + t(132, 71, 'teste', 14) +
  seta(160, 62, 184, 34) + rr(176, 8, 80, 30, 8) + t(216, 23, 'refutada', 14) +
  seta(160, 80, 180, 104) + rr(164, 104, 96, 30, 8) + t(212, 119, 'corroborada', 14) + t(212, 146, '(provisória)', 14) +
  P('M164,124 H132 V92', ' stroke-dasharray="5 4"') + head(132, 90, -90, 10);
const hermeneutico = arcSeta(90, 72, 52, 208, 332, 11) + arcSeta(90, 72, 52, 28, 152, 11) + t(34, 72, 'partes', 15) + t(146, 72, 'todo', 15) + t(90, 140, 'círculo hermenêutico', 14);
const navalha = P('M60,20 H146 Q170,20 168,42 L162,56 H66 Q60,56 60,50 Z') + fino('M70,51 H158') +
  P('M60,34 Q36,30 10,38 Q4,44 12,48 Q36,48 60,44') + circ(60, 39, 3) + t(90, 74, 'navalha de Ockham', 14);
const epoche = P('M70,8 Q48,44 70,80 M150,8 Q172,44 150,80', ' stroke-width="3.5"') + circ(110, 44, 24) +
  fino('M86,44 H134 M110,20 V68') + `<ellipse cx="110" cy="44" rx="11" ry="24" stroke-width="1.6"/>` + t(110, 98, 'suspensão do juízo (epoché)', 14);

// ---------- Estética e existência ----------
const ampulheta = P('M10,8 H80 M10,122 H80', ' stroke-width="3.5"') + fino('M14,8 V122 M76,8 V122') +
  P('M22,14 C22,46 40,56 42,65 C40,74 22,84 22,116 H68 C68,84 50,74 48,65 C50,56 68,46 68,14 Z') +
  P('M30,38 H60 Q55,52 46,61 H44 Q35,52 30,38 Z', ' fill="#C" stroke="none"') + P('M28,116 Q45,92 62,116 Z', ' fill="#C" stroke="none"') + fino('M45,64 V110');
const mascara = (dx, dy, feliz) => {
  const X = v => f1(v + dx), Y = v => f1(v + dy);
  let s = P(`M${X(16)},${Y(24)} Q${X(52)},${Y(8)} ${X(88)},${Y(24)} Q${X(90)},${Y(72)} ${X(52)},${Y(112)} Q${X(14)},${Y(72)} ${X(16)},${Y(24)} Z`);
  if (feliz) s += P(`M${X(30)},${Y(50)} Q${X(38)},${Y(40)} ${X(46)},${Y(50)} M${X(58)},${Y(50)} Q${X(66)},${Y(40)} ${X(74)},${Y(50)}`, ' stroke-width="3"') +
    P(`M${X(32)},${Y(72)} Q${X(52)},${Y(98)} ${X(72)},${Y(72)} Q${X(52)},${Y(84)} ${X(32)},${Y(72)} Z`, ' fill="#C"');
  else s += P(`M${X(28)},${Y(42)} L${X(44)},${Y(36)} M${X(60)},${Y(36)} L${X(76)},${Y(42)}`, ' stroke-width="3"') +
    `<ellipse cx="${X(37)}" cy="${Y(52)}" rx="6" ry="4" fill="#C" stroke="none"/><ellipse cx="${X(67)}" cy="${Y(52)}" rx="6" ry="4" fill="#C" stroke="none"/>` +
    P(`M${X(32)},${Y(92)} Q${X(52)},${Y(66)} ${X(72)},${Y(92)} Q${X(52)},${Y(80)} ${X(32)},${Y(92)} Z`, ' fill="#C"');
  return s;
};
const mascaras = mascara(0, 2, true) + mascara(96, 12, false);
const labirinto = (() => { // labirinto perfeito 6×6 (busca em profundidade com semente fixa)
  const N = 6, c = 22, o = 8;
  let s = 7 >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const H = Array.from({ length: N + 1 }, () => Array(N).fill(true)), V = Array.from({ length: N }, () => Array(N + 1).fill(true));
  const vis = Array.from({ length: N }, () => Array(N).fill(false)), pilha = [[0, 0]]; vis[0][0] = true;
  while (pilha.length) {
    const [x, y] = pilha[pilha.length - 1];
    const viz = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !vis[b][a]);
    if (!viz.length) { pilha.pop(); continue; }
    const [a, b, dx, dy] = viz[Math.floor(r() * viz.length)];
    if (dx === 1) V[y][x + 1] = false; else if (dx === -1) V[y][x] = false; else if (dy === 1) H[y + 1][x] = false; else H[y][x] = false;
    vis[b][a] = true; pilha.push([a, b]);
  }
  H[0][0] = false; H[N][N - 1] = false;
  let d = '';
  for (let y = 0; y <= N; y++) for (let x = 0; x < N; x++) if (H[y][x]) d += `M${o + x * c},${o + y * c} h${c} `;
  for (let y = 0; y < N; y++) for (let x = 0; x <= N; x++) if (V[y][x]) d += `M${o + x * c},${o + y * c} v${c} `;
  return P(d) + dot(o + c / 2, 3, 3) + dot(o + (N - 0.5) * c, o + N * c + 5, 3);
})();
const espelho = `<ellipse cx="124" cy="58" rx="34" ry="46"/><ellipse cx="124" cy="58" rx="28" ry="40" stroke-width="1.4"/>` + P('M124,104 V128 M104,132 H144') +
  boneco(44, 130, 3, ' stroke-width="2.5"') + boneco(124, 88, 1.8, ' stroke-width="1.8" stroke-dasharray="3 3"');
const caveira = P('M20,58 Q18,12 55,10 Q92,12 90,58 Q90,72 78,76 V92 H32 V76 Q20,72 20,58 Z') +
  circ(40, 52, 10, ' fill="#C" stroke="none"') + circ(70, 52, 10, ' fill="#C" stroke="none"') + P('M55,62 L50,73 H60 Z', ' fill="#C"') +
  fino('M32,84 H78 M44,82 V92 M55,82 V92 M66,82 V92');
const encruzilhada = P('M65,10 V140 M40,140 H90') + P('M62,26 H22 L10,38 L22,50 H62 Z') + P('M68,62 H108 L120,74 L108,86 H68 Z') +
  t(38, 38, 'A', 16) + t(92, 74, 'B', 16);
const pedra = P('M10,130 H196 V30 Z') + circ(120.5, 47.9, 20) + circ(88, 45, 6) +
  P('M86,52 L70,74 L60,102 M70,74 L76,95 M84,55 L99,51 M82,59 L99,60', ' stroke-width="2.4"') +
  seta(150, 92, 178, 77, ' stroke-width="1.8"', 9);
const aureo = rr(6, 6, 210, 130, 0) + fino('M136,6 V136 M136,86 H216 M166,86 V136 M136,106 H166 M156,86 V106') +
  P('M6,136 A130,130 0 0,1 136,6 A80,80 0 0,1 216,86 A50,50 0 0,1 166,136 A30,30 0 0,1 136,106 A20,20 0 0,1 156,86');
const cavalete = P('M30,152 L62,8 M100,152 L68,8 M65,8 V152', ' stroke-width="2.2"') + rr(20, 28, 90, 66, 2) + P('M14,98 H116', ' stroke-width="3"') +
  fino('M28,86 L48,60 L62,76 L78,54 L102,86') + circ(92, 42, 5, ' stroke-width="1.6"');
const existencia = rr(6, 30, 98, 36, 8) + t(55, 48, 'existência', 15) + seta(106, 48, 144, 48) + t(125, 18, 'precede', 14) +
  rr(146, 30, 98, 36, 8) + t(195, 48, 'essência', 15) + t(125, 86, 'a pessoa se faz pelas escolhas', 14);

// ---------- Sociologia ----------
const pirSocial = P('M115,6 L224,164 H6 Z') + P('M79.1,58 H150.9 M41.8,112 H188.2', ' stroke-width="1.8"') +
  t(115, 42, 'elite', 14) + t(115, 88, 'classe média', 14) + t(115, 140, 'classes populares', 14);
const estratificacao = (() => {
  const n = [1, 3, 6, 10, 15];
  let s = '';
  for (let i = 0; i < 5; i++) {
    const y = 6 + i * 28;
    s += rr(36, y, 188, 28, 0, ' stroke-width="1.8"') + t(20, y + 14, 'ABCDE'[i], 15);
    for (let k = 0; k < n[i]; k++) s += circ(130 + (k - (n[i] - 1) / 2) * 12, y + 14, 4, ' stroke-width="1.6"');
  }
  return s;
})();
const classes = rr(6, 30, 84, 50, 8) + t(48, 55, 'capital', 15) + rr(150, 30, 84, 50, 8) + t(192, 55, 'trabalho', 15) +
  seta(94, 45, 146, 45) + seta(146, 65, 94, 65) + t(120, 16, 'conflito', 14) + t(120, 98, 'classes sociais', 14);
const mobilidade = P('M40,150 V10 M80,150 V10') + fino([20, 40, 60, 80, 100, 120, 140].map(y => `M40,${y} H80`).join(' ')) +
  boneco(60, 98, 1.4) + seta(112, 132, 112, 22) + seta(144, 22, 144, 132) + t(112, 146, 'sobe', 14) + t(144, 10, 'desce', 14);
const rede = (() => {
  const N = [[105, 80, 13], [30, 30, 9], [84, 18, 9], [164, 24, 9], [192, 84, 9], [160, 140, 9], [90, 142, 9], [24, 112, 9], [52, 74, 9]];
  const E = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 6], [0, 8], [1, 2], [1, 8], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [2, 3]];
  return E.map(([a, b]) => ligar(N[a][0], N[a][1], N[a][2], N[b][0], N[b][1], N[b][2], false, ' stroke-width="1.8"')).join('') +
    N.map(([x, y, r], i) => circ(x, y, r, i === 0 ? ' fill="#C" fill-opacity=".3"' : '')).join('');
})();
const fatoSocial = circ(125, 92, 40) + t(125, 82, 'fato', 15) + t(125, 102, 'social', 15) +
  rr(80, 4, 90, 28, 8) + t(125, 18, 'exterior', 14) + rr(4, 144, 92, 28, 8) + t(50, 158, 'coercitivo', 14) + rr(162, 144, 84, 28, 8) + t(204, 158, 'geral', 14) +
  P('M125,32 V52 M96,120 L70,144 M154,120 L186,144');
const inst = (id, nome, corpo, rot) => [id, nome, 110, 112, corpo + t(55, 102, rot, 14)];
const instituicoes = [
  inst('fil-inst-familia', 'Instituição: família', P('M16,48 L55,16 L94,48') + rr(26, 44, 58, 42, 1) +
    busto(42, 84, 0.55) + busto(55, 80, 0.7) + busto(68, 84, 0.55), 'família'),
  inst('fil-inst-educacao', 'Instituição: educação', P('M55,52 Q36,42 14,46 V82 Q36,78 55,88 Q74,78 96,82 V46 Q74,42 55,52 Z M55,52 V88') +
    P('M55,8 L86,20 L55,32 L24,20 Z') + P('M36,26 V36 Q55,44 74,36 V26') + fino('M86,20 V34'), 'educação'),
  inst('fil-inst-religiao', 'Instituição: religião', rr(46, 40, 18, 44, 2) + P('M55,40 V32') +
    P('M55,32 Q47,22 55,8 Q63,22 55,32 Z', ' fill="#C" fill-opacity=".3"') + P('M30,84 H80 L74,92 H36 Z') + fino('M30,22 l-6,-4 M80,22 l6,-4 M28,34 h-8 M82,34 h8'), 'religião'),
  inst('fil-inst-estado', 'Instituição: Estado', portico(16, 94, 6, 88, 4), 'Estado'),
  inst('fil-inst-economia', 'Instituição: economia (mercado)', P('M14,36 H96 L90,16 H20 Z') +
    P('M14,36 q6.8,8 13.7,0 q6.8,8 13.7,0 q6.8,8 13.7,0 q6.8,8 13.7,0 q6.8,8 13.7,0 q6.8,8 13.7,0', ' stroke-width="1.8"') +
    P('M20,40 V86 M90,40 V86') + rr(16, 62, 78, 24, 2) + circ(42, 74, 6, ' stroke-width="1.6"') + circ(58, 74, 6, ' stroke-width="1.6"') + circ(74, 74, 6, ' stroke-width="1.6"'), 'economia'),
  inst('fil-inst-midia', 'Instituição: mídia', rr(14, 26, 82, 54, 6) + rr(22, 33, 56, 40, 3, ' stroke-width="1.6"') +
    circ(87, 42, 3) + circ(87, 56, 3) + P('M40,6 L55,24 L70,6 M38,80 L32,90 M72,80 L78,90'), 'mídia'),
  inst('fil-inst-trabalho', 'Instituição: trabalho', (() => {
    let d = '';
    for (let i = 0; i < 8; i++) {
      const a = i * 45, p = (r, g) => `${f1(55 + r * Math.cos(rad(a + g)))},${f1(46 + r * Math.sin(rad(a + g)))}`;
      d += `${i ? 'L' : 'M'}${p(26, -16)} L${p(34, -9)} L${p(34, 9)} L${p(26, 16)} `;
    }
    return P(d + 'Z') + circ(55, 46, 10);
  })(), 'trabalho'),
];
const socializacao = circ(105, 105, 24) + circ(105, 105, 50) + circ(105, 105, 74) + circ(105, 105, 98) +
  t(105, 105, 'eu', 16) + t(105, 68, 'família', 14) + t(105, 43, 'escola', 14) + t(105, 19, 'sociedade', 14);
const indSoc = busto(36, 66, 1) + t(36, 86, 'indivíduo', 14) +
  busto(186, 62, 0.75) + busto(222, 62, 0.75) + busto(204, 70, 0.85) + t(204, 86, 'sociedade', 14) +
  P('M66,34 Q120,8 164,30') + head(172, 34, 25, 11) + P('M164,62 Q120,88 76,64') + head(68, 60, 205, 11) +
  t(120, 10, 'age sobre', 14) + t(120, 92, 'molda', 14);
const acaoSocial = t(125, 12, 'ação social', 15) + rr(6, 24, 238, 110, 4) + P('M125,24 V134 M6,79 H244', ' stroke-width="1.8"') +
  t(65, 44, 'racional', 14) + t(65, 62, '(fins)', 14) + t(184, 44, 'racional', 14) + t(184, 62, '(valores)', 14) +
  t(65, 106, 'afetiva', 14) + t(184, 106, 'tradicional', 14);
const solidariedade = [[40, 40], [62, 36], [84, 42], [46, 62], [70, 60], [92, 64], [56, 84], [80, 84]].map(([x, y]) => circ(x, y, 9, ' stroke-width="1.8"')).join('') +
  trac('M125,8 V104') +
  circ(160, 40, 12) + rr(198, 26, 26, 26, 2) + P('M168,96 L180,72 L192,96 Z') + rr(214, 76, 22, 22, 11, ' fill="#C" fill-opacity=".3"') +
  P('M172,40 H198 M164,51 L176,78 M211,52 L223,76 M192,88 H214', ' stroke-width="1.8"') +
  t(64, 116, 'mecânica', 14) + t(196, 116, 'orgânica', 14);

// ---------- Recursos ----------
const rolo = y => P(`M20,${y} H180 Q190,${y} 190,${y + 10} Q190,${y + 20} 180,${y + 20} H20 Q10,${y + 20} 10,${y + 10} Q10,${y} 20,${y} Z`) + circ(20, y + 10, 4, ' stroke-width="1.6"') + circ(180, y + 10, 4, ' stroke-width="1.6"');
const pergaminho = P('M26,32 V108 M174,32 V108') + rolo(12) + rolo(106) + fino('M42,50 H158 M42,64 H158 M42,78 H158 M42,92 H130');
const aspa = (x, y, s = 1) => circ(x, y, f1(6 * s), ' fill="#C" stroke="none"') + P(`M${f1(x - 5.5 * s)},${f1(y + 2 * s)} Q${f1(x - 7 * s)},${f1(y - 12 * s)} ${f1(x + 5 * s)},${f1(y - 18 * s)}`, ` stroke-width="${f1(3.5 * s)}"`);
const aspaFecha = (x, y, s = 1) => `<g transform="rotate(180 ${x} ${y})">${aspa(x, y, s)}</g>`;
const citacao = rr(6, 6, 218, 118, 8) + aspa(28, 38) + aspa(48, 38) + aspaFecha(182, 92) + aspaFecha(202, 92) +
  fino('M66,34 H204 M28,58 H204 M28,82 H164') + tl(28, 108, '— autor', 14);
const mapaConc = rr(86, 6, 88, 32, 8, ' stroke-width="3"') + t(130, 22, 'conceito', 15) +
  P('M110,38 L42,130 M130,38 V130 M150,38 L218,130', ' stroke-width="1.8"') +
  rr(48, 74, 44, 18, 9, ' stroke-width="1.4" stroke-dasharray="3 3"') + rr(108, 74, 44, 18, 9, ' stroke-width="1.4" stroke-dasharray="3 3"') + rr(168, 74, 44, 18, 9, ' stroke-width="1.4" stroke-dasharray="3 3"') +
  rr(6, 130, 72, 32, 8) + rr(94, 130, 72, 32, 8) + rr(182, 130, 72, 32, 8);
const linhaPer = rr(6, 38, 74, 20, 0, sombra) + rr(146, 38, 50, 20, 0, sombra) + P('M6,38 H248 M6,58 H248 M6,38 V58 M80,38 V58 M146,38 V58 M196,38 V58') + head(258, 48, 0, 12) + P('M248,38 V58', ' stroke-width="1"') +
  t(43, 22, 'Antiga', 15) + t(104, 76, 'Medieval', 14) + t(171, 22, 'Moderna', 15) + t(204, 76, 'Contemporânea', 14);
const linhaVert = (() => {
  const ys = [10, 80, 140, 190, 236], nomes = ['Antiga', 'Medieval', 'Moderna', 'Contemporânea'], sec = ['séc. VI a.C.', 'séc. VI', 'séc. XV', 'séc. XIX', 'hoje'];
  let s = rr(90, 10, 16, 140, 0, sombra) + rr(90, 10, 16, 226, 0) + head(98, 248, 90, 12);
  for (let i = 0; i < 5; i++) s += P(`M84,${ys[i]} H112`, ' stroke-width="1.8"') + tl(80, ys[i], sec[i], 14, 'end');
  for (let i = 0; i < 4; i++) s += tl(118, (ys[i] + ys[i + 1]) / 2, nomes[i], 15);
  return s.replace(rr(90, 10, 16, 140, 0, sombra), rr(90, 10, 16, 70, 0, sombra) + rr(90, 140, 16, 50, 0, sombra));
})();
const pensando = busto(50, 140, 1.6) + circ(90, 60, 4) + circ(102, 46, 6) +
  P('M104,32 Q98,10 122,10 Q132,0 146,8 Q166,6 162,26 Q170,44 148,46 Q138,56 124,48 Q102,52 104,32 Z') + t(134, 28, '?', 24);
const coluna = rr(8, 8, 64, 8, 1) + circ(16, 24, 7) + circ(64, 24, 7) + dot(16, 24, 2) + dot(64, 24, 2) + P('M23,18 H57 Q57,30 40,30 Q23,30 23,18') +
  P('M20,32 V160 M60,32 V160') + fino('M30,36 V156 M40,36 V156 M50,36 V156') + rr(14, 160, 52, 8, 1) + rr(8, 168, 64, 8, 1);
const coruja = P('M55,18 Q92,18 92,70 Q92,112 55,116 Q18,112 18,70 Q18,18 55,18 Z') +
  P('M26,30 L22,8 L42,22 M84,30 L88,8 L68,22') + circ(40, 48, 13) + circ(70, 48, 13) + dot(40, 48, 5) + dot(70, 48, 5) +
  P('M50,62 L55,74 L60,62 Z', ' fill="#C"') + P('M26,70 Q30,98 46,108 M84,70 Q80,98 64,108') +
  fino('M46,84 l9,5 l9,-5 M46,96 l9,5 l9,-5') + P('M6,122 H104') + fino('M44,116 v6 M50,116 v6 M60,116 v6 M66,116 v6');
const lamparina = P('M24,62 Q22,40 62,40 Q94,40 108,50 L132,52 Q140,54 138,60 Q136,64 126,64 H30 Q24,64 24,62 Z') +
  `<ellipse cx="64" cy="45" rx="9" ry="3" stroke-width="1.6"/>` + P('M28,50 C10,50 8,28 22,28 C30,28 34,36 34,42') + P('M52,64 L48,74 H84 L80,64') +
  P('M136,50 Q128,38 136,18 Q144,38 136,50 Z', ' fill="#C" fill-opacity=".3"') +
  fino('M136,10 V4 M150,20 l6,-4 M122,20 l-6,-4 M152,34 h7 M120,34 h-7') + t(80, 92, 'luz da razão', 14);
const dialogo = rr(6, 8, 112, 54, 14) + P('M26,62 L18,80 L44,62') + fino('M22,28 H100 M22,44 H80') +
  rr(92, 62, 112, 54, 14) + P('M184,116 L194,128 L168,116') + fino('M110,82 H186 M110,98 H160');
const quadroConc = rr(6, 6, 228, 138, 6) + P('M6,36 H234') + tl(16, 21, 'Conceito:', 15) +
  tl(16, 60, 'definição', 14) + trac('M92,66 H224') + tl(16, 94, 'exemplo', 14) + trac('M84,100 H224') + tl(16, 128, 'contraexemplo', 14) + trac('M118,134 H224');
const comparativo = rr(6, 6, 228, 138, 4) + P('M120,6 V144 M6,34 H234') + t(63, 20, 'A', 16) + t(177, 20, 'B', 16) + fino('M6,62 H234 M6,90 H234 M6,118 H234');

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "fil-argumento-preencher",
        "Argumento — mapa preenchível",
        520,
        220,
        "<text x=\"260\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Premissas sustentam uma conclusão</text><rect x=\"15\" y=\"45\" width=\"185\" height=\"58\" rx=\"3\"/><rect x=\"15\" y=\"135\" width=\"185\" height=\"58\" rx=\"3\"/><rect x=\"315\" y=\"90\" width=\"190\" height=\"58\" rx=\"3\"/><text x=\"107\" y=\"67\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Premissa 1</text><text x=\"107\" y=\"89\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">___________</text><text x=\"107\" y=\"157\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Premissa 2</text><text x=\"107\" y=\"179\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">___________</text><path d=\"M202 74 H255 V119 M202 164 H255 V119\"/><path d=\"M255 119 L308 119 M301 115 L308 119 L301 123\"/><text x=\"410\" y=\"111\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Conclusão</text><text x=\"410\" y=\"133\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">___________</text>"
      ],
      [
        "fil-conceitos-distinguir",
        "Conceitos — comparação crítica",
        560,
        224,
        "<text x=\"280\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Conceitos — comparação crítica</text><rect x=\"10\" y=\"42\" width=\"540\" height=\"178\" rx=\"3\"/><text x=\"77.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Conceito</text><text x=\"212.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Definição</text><path d=\"M145 42 V220\"/><text x=\"347.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Exemplo</text><path d=\"M280 42 V220\"/><text x=\"482.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Limite</text><path d=\"M415 42 V220\"/><path d=\"M10 68 H550\"/><path d=\"M10 106 H550\"/><path d=\"M10 144 H550\"/><path d=\"M10 182 H550\"/>"
      ]
    ]
  ]
];

export default {
  id: 'filosofia',
  nome: 'Filosofia e Sociologia',
  destaques: ['fil-silogismo', 'fil-quadrado-logico', 'fil-tv2', 'fil-tv-conectivos', 'fil-venn3-silog', 'fil-arvore-arg',
    'fil-caverna', 'fil-linha-dividida', 'fil-dialetica', 'fil-balanca-justica', 'fil-espectro', 'fil-piramide-social',
    'fil-rede-social', 'fil-citacao', 'fil-mapa-conceitual', 'fil-linha-periodos'],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Lógica', [
      ['fil-silogismo', 'Silogismo (para preencher)', 240, 124, silogismo],
      ['fil-silogismo-ex', 'Silogismo: exemplo (Todo M é P)', 230, 108, silogismoEx],
      ['fil-quadrado-logico', 'Quadrado tradicional — sujeito não vazio', 300, 260, '<g transform="translate(30 0)">' + quadrado + '</g>' + T(150, 246, 'Pressuposto: classe-sujeito não vazia.', 14)],
      ['fil-quadrado-vazio', 'Quadrado lógico (para preencher)', 260, 200, quadradoVazio],
      ['fil-tv2', 'Tabela-verdade (2 variáveis)', 220, 152, tv2],
      ['fil-tv3', 'Tabela-verdade (3 variáveis)', 242, 200, tv3],
      ['fil-tv-conectivos', 'Tabela dos conectivos', 260, 148, tvConect],
      ...conectivos,
      ['fil-quantificadores', 'Quantificadores (∀ ∃)', 160, 84, quantif],
      ['fil-venn3-silog', 'Venn do silogismo (S, M, P)', 200, 193, "<g transform=\"translate(0.00 0.00)\">" + (venn3) + "</g>"],
      ['fil-venn-a', 'Venn: Todo S é P (A)', 190, 134, vennA],
      ['fil-venn-e', 'Venn: Nenhum S é P (E)', 190, 134, vennE],
      ['fil-venn-i', 'Venn: Algum S é P (I)', 190, 134, vennI],
      ['fil-venn-o', 'Venn: Algum S não é P (O)', 190, 134, vennO],
      ['fil-arvore-arg', 'Árvore de argumento (tese, premissas, objeção)', 260, 190, arvoreArg],
      ['fil-deducao-inducao', 'Dedução × indução', 240, 134, dedInd],
    ]],
    ['Falácias', falacias],
    ['Teoria do conhecimento', [
      ['fil-caverna', 'Alegoria da caverna (esquema)', 284, 172, caverna],
      ['fil-linha-dividida', 'Linha dividida', 256, 204, linhaDiv],
      ['fil-dois-mundos', 'Mundo das ideias × mundo sensível', 240, 160, mundos],
      ['fil-emp-rac', 'Empirismo × racionalismo (balança)', 250, 156, empRac],
      ['fil-tripe', 'Crença, verdade e justificação', 240, 220, tripe],
      ['fil-fontes', 'Fontes do conhecimento', 250, 152, fontes],
      ['fil-sujeito-objeto', 'Sujeito e objeto', 240, 110, sujObj],
      ['fil-juizos', 'Juízos: analítico × sintético, a priori × a posteriori', 260, 140, kant],
      ['fil-correspondencia', 'Verdade como correspondência', 250, 100, correspondencia],
      ['fil-tabula-rasa', 'Tábula rasa', 150, 114, tabula],
    ]],
    ['Ética e política', [
      ['fil-balanca-justica', 'Balança da justiça', 170, 158, justica],
      ['fil-espectro', 'Espectro político', 260, 74, espectro],
      ['fil-plano-politico', 'Plano político (2 eixos)', 230, 230, planoPol],
      ['fil-contrato-social', 'Contrato social', 220, 205, "<g transform=\"translate(0.00 0.00)\">" + (contrato) + "</g>"],
      ['fil-estado-natureza', 'Estado de natureza → sociedade civil', 276, 86, estadoNat],
      ['fil-piramide-necessidades', 'Pirâmide de necessidades (5 níveis)', 270, 182, necessidades],
      ['fil-dilema-bonde', 'Dilema do bonde', 260, 140, bonde],
      ['fil-agora', 'Ágora (praça e pórtico)', 230, 154, agora],
      ['fil-tres-poderes', 'Três poderes', 270, 160, tresPoderes],
      ['fil-urna', 'Urna (voto)', 110, 108, urna],
      ['fil-eticas', 'Éticas normativas (virtude, dever, consequência)', 250, 176, eticas],
      ['fil-meio-termo', 'Meio-termo (virtude entre vícios)', 260, 80, meioTermo],
      ['fil-veu', 'Véu da ignorância', 180, 128, veu],
      ['fil-corrente', 'Corrente rompida (liberdade)', 160, 80, corrente],
    ]],
    ['Dialética e métodos', [
      ['fil-dialetica', 'Tese, antítese e síntese', 240, 164, dialetica],
      ['fil-dialetica-espiral', 'Dialética em espiral', 268, 176, espiral],
      ['fil-socratico', 'Método socrático (ciclo)', 240, 210, socratico],
      ['fil-duvida', 'Dúvida metódica', 216, 198, duvida],
      ['fil-arvore-cartesiana', 'Árvore do saber (raízes, tronco, galhos)', 230, 221, "<g transform=\"translate(0.00 0.00)\">" + (arvoreCart) + "</g>"],
      ['fil-metodo-regras', 'Método em 4 regras (escada)', 289, 167, "<g transform=\"translate(0.00 0.00)\">" + (metCart) + "</g>"],
      ['fil-falseabilidade', 'Falseabilidade (teste da hipótese)', 265, 161, "<g transform=\"translate(0.00 0.00)\">" + (popper) + "</g>"],
      ['fil-hermeneutico', 'Círculo hermenêutico', 180, 150, hermeneutico],
      ['fil-navalha', 'Navalha de Ockham', 180, 84, navalha],
      ['fil-epoche', 'Suspensão do juízo (epoché)', 220, 108, epoche],
    ]],
    ['Estética e existência', [
      ['fil-ampulheta', 'Ampulheta (tempo)', 90, 130, ampulheta],
      ['fil-mascaras', 'Máscaras do teatro', 200, 128, mascaras],
      ['fil-labirinto', 'Labirinto', 148, 148, labirinto],
      ['fil-espelho', 'Espelho (reflexo)', 170, 136, espelho],
      ['fil-caveira', 'Caveira (finitude)', 110, 100, caveira],
      ['fil-encruzilhada', 'Placa de escolha (encruzilhada)', 130, 148, encruzilhada],
      ['fil-pedra-morro', 'Pedra morro acima (absurdo)', 206, 136, pedra],
      ['fil-aureo', 'Retângulo áureo (proporção)', 222, 142, aureo],
      ['fil-cavalete', 'Cavalete com tela (obra)', 130, 158, cavalete],
      ['fil-existencia', 'Existência precede a essência', 250, 96, existencia],
    ]],
    ['Sociologia', [
      ['fil-piramide-social', 'Pirâmide social', 230, 170, pirSocial],
      ['fil-estratificacao', 'Estratificação (camadas)', 230, 152, estratificacao],
      ['fil-classes', 'Classes sociais (capital × trabalho)', 240, 108, classes],
      ['fil-mobilidade', 'Mobilidade social (escada)', 170, 156, mobilidade],
      ['fil-rede-social', 'Rede social (sociograma)', 204, 154, rede],
      ['fil-fato-social', 'Fato social (3 características)', 250, 176, fatoSocial],
      ...instituicoes,
      ['fil-socializacao', 'Socialização (círculos)', 210, 210, socializacao],
      ['fil-individuo-sociedade', 'Indivíduo ⇄ sociedade', 244, 111, "<g transform=\"translate(0.00 4.50)\">" + (indSoc) + "</g>"],
      ['fil-acao-social', 'Tipos de ação social', 250, 140, acaoSocial],
      ['fil-solidariedade', 'Solidariedade mecânica × orgânica', 250, 126, solidariedade],
    ]],
    ['Recursos de aula', [
      ['fil-pergaminho', 'Pergaminho', 200, 132, pergaminho],
      ['fil-citacao', 'Citação em moldura', 230, 130, citacao],
      ['fil-mapa-conceitual', 'Mapa conceitual', 260, 166, mapaConc],
      ['fil-linha-periodos', 'Linha do tempo: períodos da filosofia', 264, 90, linhaPer],
      ['fil-linha-periodos-vert', 'Períodos da filosofia (vertical, séculos)', 240, 254, linhaVert],
      ['fil-pensando', 'Busto pensando (?)', 170, 144, pensando],
      ['fil-coluna', 'Coluna grega', 80, 180, coluna],
      ['fil-coruja', 'Coruja (símbolo da filosofia)', 110, 128, coruja],
      ['fil-lamparina', 'Lamparina (luz da razão)', 160, 102, lamparina],
      ['fil-dialogo', 'Diálogo (dois balões)', 210, 132, dialogo],
      ['fil-quadro-conceito', 'Ficha de conceito', 240, 150, quadroConc],
      ['fil-comparativo', 'Quadro comparativo (A × B)', 240, 150, comparativo],
    ]],
  ],
};
