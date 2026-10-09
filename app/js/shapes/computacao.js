// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Ciência da Computação (técnico e superior): estruturas de dados, algoritmos, arquitetura, SO, redes, BD, ES, teoria, IA e web.
import { T as T0, head } from './base.js';

// ====================== Utilidades locais ======================
const T = (x, y, s, z = 14) => T0(x, y, s, z); // texto local: padrão 14 px
const F = ' stroke-width="1.6"';
const DASH = ' stroke-dasharray="6 4"';
const DF = F + ' stroke-dasharray="5 4"';
const SOMB = ' fill="#C" fill-opacity="0.18"';
const CHEIO = ' fill="#C" fill-opacity="0.35" stroke="none"';
const n1 = v => Math.round(v * 10) / 10;
const TL = (x, y, s, z = 14) => T(x, y, s, z).replace('text-anchor="middle"', 'text-anchor="start"');
const TN = (x, y, s, z = 14) => T(x, y, s, z).replace('font-weight="600"', 'font-weight="400"');
const TNL = (x, y, s, z = 14) => TL(x, y, s, z).replace('font-weight="600"', 'font-weight="400"');
const R = (x, y, w, h, a = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${a}/>`;
const P = (d, a = '') => `<path d="${d}"${a}/>`;
const C = (x, y, r, a = '') => `<circle cx="${x}" cy="${y}" r="${r}"${a}/>`;
const E = (x, y, rx, ry, a = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"${a}/>`;
const ponto = (x, y, r = 3) => C(x, y, r, ' fill="#C"');
const caixa = (x, y, w, h, s, z = 14, a = '') => R(x, y, w, h, ' rx="3"' + a) + (s === '' ? '' : T(x + w / 2, y + h / 2, s, z));
const celulas = (x, y, w, h, vals, z = 14, marca = []) =>
  vals.map((v, i) => R(x + i * w, y, w, h, marca.includes(i) ? SOMB : '') + (v === '' ? '' : T(x + i * w + w / 2, y + h / 2, v, z))).join('');
// seta reta de (x1,y1) até a ponta em (x2,y2)
const seta = (x1, y1, x2, y2, a = '', L = 10) => {
  const t = Math.atan2(y2 - y1, x2 - x1);
  return P(`M${n1(x1)} ${n1(y1)} L${n1(x2 - Math.cos(t) * L * 0.6)} ${n1(y2 - Math.sin(t) * L * 0.6)}`, a) + head(n1(x2), n1(y2), n1(t * 180 / Math.PI), L);
};
const seta2 = (x1, y1, x2, y2, a = '', L = 10) => {
  const t = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(t) * L * 0.6, s = Math.sin(t) * L * 0.6;
  return P(`M${n1(x1 + c)} ${n1(y1 + s)} L${n1(x2 - c)} ${n1(y2 - s)}`, a) + head(n1(x2), n1(y2), n1(t * 180 / Math.PI), L) + head(n1(x1), n1(y1), n1(t * 180 / Math.PI + 180), L);
};
const no = (x, y, s, r = 16, z = 14, a = '') => C(x, y, r, a) + (s === '' ? '' : T(x, y, s, z));
// aresta entre dois nós circulares (aparada nos raios); opcional: dirigida, peso ao lado
const aresta = (A, B, o = {}) => {
  const ra = o.ra ?? 16, rb = o.rb ?? 16, dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
  const x1 = A[0] + ux * ra, y1 = A[1] + uy * ra, x2 = B[0] - ux * rb, y2 = B[1] - uy * rb;
  let s = o.dir ? seta(x1, y1, x2, y2, o.a || '') : P(`M${n1(x1)} ${n1(y1)} L${n1(x2)} ${n1(y2)}`, o.a || '');
  if (o.peso !== undefined) { const k = 12 * (o.lado || 1); s += T(n1((A[0] + B[0]) / 2 - uy * k), n1((A[1] + B[1]) / 2 + ux * k), o.peso, 14); }
  return s;
};
// autolaço acima de um estado (autômatos)
const laco = (x, y, r, rot) => {
  const sx = n1(x - r * 0.5), ex = n1(x + r * 0.5), sy = n1(y - r * 0.87), cy = n1(y - r * 2.6);
  return P(`M${sx} ${sy} C${n1(x - r * 1.2)} ${cy} ${n1(x + r * 1.2)} ${cy} ${ex} ${sy}`) +
    head(ex, sy, n1(Math.atan2(sy - cy, ex - (x + r * 1.2)) * 180 / Math.PI), 9) + (rot ? TN(x, n1(y - r * 2.17 - 10), rot) : '');
};
// transição curva entre dois estados (desvio `off` para a esquerda do sentido A→B)
const curva = (A, B, r, off, rot) => {
  const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy), nx = dy / d, ny = -dx / d;
  const cx = (A[0] + B[0]) / 2 + nx * off, cy = (A[1] + B[1]) / 2 + ny * off;
  const u = (px, py) => { const l = Math.hypot(cx - px, cy - py); return [(cx - px) / l, (cy - py) / l]; };
  const [ax, ay] = u(A[0], A[1]), [bx, by] = u(B[0], B[1]);
  const sx = A[0] + ax * r, sy = A[1] + ay * r, ex = B[0] + bx * r, ey = B[1] + by * r;
  return P(`M${n1(sx)} ${n1(sy)} Q${n1(cx)} ${n1(cy)} ${n1(ex + bx * 6)} ${n1(ey + by * 6)}`) + head(n1(ex), n1(ey), n1(Math.atan2(-by, -bx) * 180 / Math.PI), 9) +
    (rot ? TN(n1((A[0] + B[0]) / 2 + nx * (off / 2 + 11 * Math.sign(off))), n1((A[1] + B[1]) / 2 + ny * (off / 2 + 11 * Math.sign(off))), rot) : '');
};
// arco de círculo no sentido horário, de a0 a a1 (graus), com ponta no fim
const arco = (cx, cy, r, a0, a1, L = 10) => {
  const p = a => `${n1(cx + r * Math.cos(a * Math.PI / 180))} ${n1(cy + r * Math.sin(a * Math.PI / 180))}`;
  const [ex, ey] = p(a1).split(' ').map(Number);
  return P(`M${p(a0)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(a1 - 4)}`) + head(ex, ey, a1 + 90, L);
};
const pc = (x, y) => R(x - 14, y - 11, 28, 18, ' rx="2"') + P(`M${x} ${y + 7} V${y + 12} M${x - 8} ${y + 12} H${x + 8}`, F); // computador pequeno
const cil = (cx, y, w, h, s = '', z = 14) => {
  const rx = w / 2, ry = 6;
  return P(`M${cx - rx} ${y + ry} V${y + h - ry} A${rx} ${ry} 0 0 0 ${cx + rx} ${y + h - ry} V${y + ry}`) + E(cx, y + ry, rx, ry) + (s ? T(cx, y + h / 2 + 4, s, z) : '');
};
const nuvem = (cx, cy, k = 1, s = '') => {
  const q = v => n1(v * k);
  return P(`M${q(-36) + cx} ${q(18) + cy} a${q(18)} ${q(18)} 0 0 1 ${q(2)} ${q(-28)} a${q(22)} ${q(22)} 0 0 1 ${q(34)} ${q(-12)} a${q(20)} ${q(20)} 0 0 1 ${q(30)} ${q(14)} a${q(14)} ${q(14)} 0 0 1 ${q(6)} ${q(26)} Z`) +
    (s ? T(cx, n1(cy + 3 * k), s, 14) : '');
};
const servidor = (x, y, w, h) => R(x, y, w, h, ' rx="4"') + [0.28, 0.52, 0.76].map(f => P(`M${x + 8} ${n1(y + h * f)} H${x + w - 16}`, F) + ponto(x + w - 9, n1(y + h * f), 2.5)).join('');

// ====================== Estruturas de dados ======================
const vetor = celulas(11, 12, 38, 38, ['7', '2', '9', '4', '1', '5'], 16) + [0, 1, 2, 3, 4, 5].map(i => TN(30 + i * 38, 66, i)).join('');
const matriz = [0, 1, 2, 3].map(j => TN(66 + j * 40, 14, j)).join('') +
  [0, 1, 2].map(i => TN(28, 45 + i * 34, i) + celulas(46, 28 + i * 34, 40, 34, [['1', '2', '3', '4'], ['5', '6', '7', '8'], ['9', '0', '1', '2']][i], 16)).join('');
const noLista = (x, y, v) => R(x, y, 62, 34) + P(`M${x + 40} ${y} V${y + 34}`) + T(x + 20, y + 17, v, 16) + ponto(x + 51, y + 17);
const nulo = (x, y) => P(`M${x + 43} ${y + 31} L${x + 59} ${y + 3}`, F);
const noListaSo = R(6, 8, 84, 34) + P('M60 8 V42') + T(33, 25, 'dado') + ponto(75, 25) + seta(75, 25, 124, 25);
const lista = T(37, 11, 'início') + seta(37, 21, 37, 31, '', 8) + [6, 98, 190].map((x, i) => noLista(x, 32, ['3', '8', '5'][i])).join('') +
  seta(57, 49, 97, 49) + seta(149, 49, 189, 49) + nulo(190, 32);
const noDuplo = (x, y, v, ant, prox) => R(x, y, 72, 36) + P(`M${x + 18} ${y} V${y + 36} M${x + 54} ${y} V${y + 36}`) + T(x + 36, y + 18, v, 16) +
  (prox ? ponto(x + 63, y + 11, 2.6) : P(`M${x + 56} ${y + 34} L${x + 70} ${y + 2}`, F)) + (ant ? ponto(x + 9, y + 25, 2.6) : P(`M${x + 2} ${y + 34} L${x + 16} ${y + 2}`, F));
const listaDupla = T(40, 11, 'início') + seta(40, 21, 40, 33, '', 8) + T(230, 11, 'fim') + seta(230, 21, 230, 33, '', 8) +
  noDuplo(4, 34, '3', false, true) + noDuplo(99, 34, '8', true, true) + noDuplo(194, 34, '5', true, false) +
  seta(67, 45, 98, 45) + seta(162, 45, 193, 45) + seta(108, 59, 77, 59) + seta(203, 59, 172, 59);
const listaCircular = [6, 98, 190].map((x, i) => noLista(x, 14, ['3', '8', '5'][i])).join('') + seta(57, 31, 97, 31) + seta(149, 31, 189, 31) +
  P('M241 31 H262 V88 H37 V57') + head(37, 49, -90);
const pilha = P('M44 46 V190 H136 V46') + ['D', 'C', 'B', 'A'].map((s, i) => caixa(50, 52 + 34 * i, 80, 32, s, 16)).join('') +
  seta(72, 6, 72, 44) + T(36, 22, 'push') + seta(108, 44, 108, 6) + T(150, 22, 'pop') + seta(192, 68, 138, 68) + T(170, 54, 'topo');
const fila = celulas(45, 40, 36, 36, ['A', 'B', 'C', 'D', ''], 16) + seta(40, 58, 6, 58) + T(22, 26, 'sai') + seta(264, 58, 230, 58) + T(246, 26, 'entra') +
  TN(63, 92, 'início') + TN(171, 92, 'fim');
const deque = celulas(50, 28, 32, 36, ['A', 'B', 'C', 'D', 'E'], 16) + seta(44, 38, 6, 38) + seta(6, 54, 44, 54) + seta(216, 38, 254, 38) + seta(254, 54, 216, 54) +
  TN(28, 84, 'frente') + TN(234, 84, 'trás');
const noArvore = no(50, 26, 'x', 18, 16) + seta(38, 40, 18, 76) + seta(62, 40, 82, 76);
const arv = (Ps, rot, Es, r = 17, z = 15) => Es.map(([a, b]) => aresta(Ps[a], Ps[b], { ra: r, rb: r })).join('') + Ps.map((p, i) => no(p[0], p[1], rot[i], r, z)).join('');
const P7 = [[115, 22], [60, 72], [170, 72], [30, 124], [90, 124], [140, 124], [200, 124]], E7 = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
const arvoreBin = arv(P7, ['A', 'B', 'C', 'D', 'E', 'F', 'G'], E7);
const bst = arv(P7, ['8', '3', '10', '1', '6', '9', '14'], E7) + TN(115, 164, 'esq. &lt; raiz &lt; dir.');
const vHeap = ['90', '70', '80', '40', '50', '60', '30'];
const heap = arv([[125, 20], [70, 66], [180, 66], [38, 112], [102, 112], [148, 112], [212, 112]], vHeap, E7, 16, 14) +
  celulas(13, 144, 32, 30, vHeap) + [0, 1, 2, 3, 4, 5, 6].map(i => TN(29 + 32 * i, 188, i)).join('');
const trieP = [[120, 18], [60, 62], [180, 62], [60, 106], [150, 106], [210, 106], [30, 152], [90, 152]];
const trie = [[0, 1], [0, 2], [1, 3], [2, 4], [2, 5], [3, 6], [3, 7]].map(([a, b]) => aresta(trieP[a], trieP[b], { ra: a ? 15 : 10, rb: 15 })).join('') +
  C(120, 18, 10, ' fill="#C"') + trieP.slice(1).map((p, i) => no(p[0], p[1], ['c', 'p', 'a', 'é', 'ó', 'r', 's'][i], 15, 15) + (i > 2 ? C(p[0], p[1], 11.5, F) : '')).join('') +
  TN(120, 182, 'car, cas, pé, pó');
const hash = T(110, 14, 'h(k) = k mod 5') + [['15', '40'], ['21'], [], ['8', '33'], ['4']].map((ch, i) => {
  const y = 34 + 32 * i, c = y + 14;
  return TN(24, c, i) + R(44, y, 32, 28) + (ch.length ? ponto(60, c) + seta(60, c, 95, c) + caixa(96, y, 44, 28, ch[0]) + (ch[1] ? seta(140, c, 163, c) + caixa(164, y, 44, 28, ch[1]) : '') : P(`M46 ${y + 26} L74 ${y + 2}`, F));
}).join('');
const G = { A: [36, 40], B: [130, 22], C: [196, 80], D: [140, 128], E: [46, 118] };
const nosG = Object.entries(G).map(([k, p]) => no(p[0], p[1], k, 16, 15)).join('');
const grafoND = [['A', 'B'], ['A', 'E'], ['B', 'C'], ['B', 'D'], ['C', 'D'], ['E', 'D']].map(([a, b]) => aresta(G[a], G[b])).join('') + nosG;
const grafoD = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'B'], ['A', 'E'], ['E', 'D']].map(([a, b]) => aresta(G[a], G[b], { dir: true })).join('') + nosG;
const grafoP = [['A', 'B', '4', -1], ['A', 'E', '2', 1], ['B', 'C', '5', -1], ['B', 'D', '1', 1], ['C', 'D', '3', -1], ['E', 'D', '7', -1]]
  .map(([a, b, p, l]) => aresta(G[a], G[b], { peso: p, lado: l })).join('') + nosG;
const adjM = [[0, 1, 1, 0], [1, 0, 1, 1], [1, 1, 0, 0], [0, 1, 0, 0]];
const adjMatriz = ['A', 'B', 'C', 'D'].map((k, j) => T(56 + 36 * j, 15, k, 15) + T(20, 47 + 34 * j, k, 15)).join('') +
  adjM.map((row, i) => celulas(38, 30 + 34 * i, 36, 34, row.map(String), 15, row.flatMap((v, j) => v ? [j] : []))).join('');
const adjLista = [['A', ['B', 'C']], ['B', ['A', 'C', 'D']], ['C', ['A', 'B']], ['D', ['B']]].map(([v, viz], i) => {
  const y = 8 + 40 * i, c = y + 14;
  return caixa(8, y, 34, 28, v, 15, SOMB) + seta(42, c, 59, c) + viz.map((u, k) => caixa(60 + 52 * k, y, 34, 28, u, 15) + (k < viz.length - 1 ? seta(94 + 52 * k, c, 111 + 52 * k, c) : '')).join('');
}).join('');

// ====================== Algoritmos ======================
const troca = (x, y) => P(`M${x} ${y - 3} Q${x + 18} ${y - 24} ${x + 36} ${y - 3}`, F) + head(x, y - 3, 130.6, 8) + head(x + 36, y - 3, 49.4, 8);
const bolha = [[32, ['5', '1', '4', '2', '8'], 0], [88, ['1', '5', '4', '2', '8'], 1], [144, ['1', '4', '5', '2', '8'], 2]]
  .map(([y, v, i]) => celulas(35, y, 36, 30, v, 15, [i, i + 1]) + troca(53 + 36 * i, y)).join('');
const merge = celulas(57, 8, 34, 28, ['38', '27', '43', '3']) + celulas(24, 64, 34, 28, ['38', '27']) + celulas(158, 64, 34, 28, ['43', '3']) +
  celulas(24, 120, 34, 28, ['27', '38']) + celulas(158, 120, 34, 28, ['3', '43']) + celulas(57, 176, 34, 28, ['3', '27', '38', '43'], 14, [0, 1, 2, 3]) +
  seta(96, 38, 62, 62, F) + seta(154, 38, 188, 62, F) + seta(58, 94, 58, 118, F) + seta(192, 94, 192, 118, F) + seta(52, 150, 70, 174, F) + seta(198, 150, 180, 174, F) +
  TN(125, 50, 'divide') + TN(125, 106, 'ordena') + TN(125, 162, 'intercala');
const quick = T(226, 12, 'pivô') + celulas(18, 26, 32, 30, ['7', '2', '9', '4', '3', '8', '5'], 15, [6]) + seta(130, 62, 130, 82) +
  celulas(18, 86, 32, 30, ['2', '4', '3', '5', '7', '9', '8'], 15, [3]) + R(117, 89, 26, 24, ' rx="2"' + F) +
  P('M20 122 v6 h92 v-6', F) + T(66, 142, '&lt; 5') + P('M148 122 v6 h92 v-6', F) + T(194, 142, '&gt; 5');
const buscaBin = T(130, 14, 'procura: 9') + celulas(10, 32, 30, 30, ['1', '3', '4', '7', '9', '11', '15', '20'], 14, [3]) +
  seta(25, 88, 25, 66) + TN(25, 101, 'ini') + seta(115, 88, 115, 66) + TN(115, 101, 'meio') + seta(235, 88, 235, 66) + TN(235, 101, 'fim');
const chamadas = [['f(4)', 147, 16], ['f(3)', 84, 64], ['f(2)', 210, 64], ['f(2)', 50, 112], ['f(1)', 118, 112], ['f(1)', 180, 112], ['f(0)', 240, 112], ['f(1)', 26, 160], ['f(0)', 76, 160]];
const recursao = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [3, 7], [3, 8]].map(([a, b]) => P(`M${chamadas[a][1]} ${chamadas[a][2] + 13} L${chamadas[b][1]} ${chamadas[b][2] - 13}`, F)).join('') +
  chamadas.map(([s, x, y]) => caixa(x - 22, y - 13, 44, 26, s)).join('');
const PB = [[115, 22], [55, 74], [115, 74], [175, 74], [30, 128], [80, 128], [195, 128]];
const buscaGrafo = (rot, leg) => aresta(PB[2], PB[3], { a: DF }) + arv(PB, rot, [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [3, 6]], 16, 15) + TN(115, 164, leg);
const bfs = buscaGrafo(['1', '2', '3', '4', '5', '6', '7'], 'por níveis (fila)');
const dfs = buscaGrafo(['1', '2', '5', '6', '3', '4', '7'], 'em profundidade (pilha)');
const DJ = { A: [28, 94], B: [112, 46], C: [112, 142], D: [214, 46], E: [214, 142] };
const dist = (x, y, v) => R(x - 13, y - 11, 26, 22, ' rx="4"' + F) + T(x, y, v, 14);
const dijkstra = [['A', 'B', '4', -1, 1], ['A', 'C', '2', 1], ['C', 'B', '1', 1], ['B', 'D', '5', -1], ['C', 'E', '5', 1], ['D', 'E', '3', -1, 1]]
  .map(([a, b, p, l, x]) => aresta(DJ[a], DJ[b], { peso: p, lado: l, a: x ? DF : ' stroke-width="3.2"' })).join('') +
  Object.entries(DJ).map(([k, p]) => no(p[0], p[1], k, 16, 15)).join('') +
  dist(28, 62, '0') + dist(112, 16, '3') + dist(214, 16, '8') + dist(112, 172, '2') + dist(214, 172, '7');
const curvaO = f => { let s = ''; for (let i = 0; i <= 40; i++) { const n = i / 4, c = Math.min(f(n), 40); s += `${i ? ' L' : 'M'}${n1(40 + 15 * n)} ${n1(170 - 150 * c / 40)}`; if (f(n) >= 40) break; } return P(s); };
const complexidade = P('M40 12 V170 H194') + head(40, 6, -90) + head(200, 170, 0) + TN(28, 14, 't') + TN(192, 188, 'n') +
  curvaO(() => 4) + curvaO(n => 3 * Math.log2(n + 1)) + curvaO(n => 2.2 * n) + curvaO(n => n * Math.log2(n + 1)) + curvaO(n => n * n) +
  TL(198, 155, 'O(1)') + TL(198, 131, 'O(log n)') + TL(198, 88, 'O(n)') + TL(198, 40, 'O(n log n)') + TL(142, 16, 'O(n²)');

// ====================== Arquitetura de computadores ======================
const vonNeumann = R(8, 6, 234, 74, ' rx="4"') + T(125, 19, 'CPU') + caixa(18, 32, 64, 38, 'UC') + caixa(93, 32, 64, 38, 'ULA') + caixa(168, 32, 64, 38, 'Reg.') +
  seta2(125, 82, 125, 108) + P('M16 112 H234', ' stroke-width="5"') + TN(125, 128, 'barramento') +
  seta2(59, 116, 59, 140) + seta2(191, 116, 191, 140) + caixa(14, 142, 90, 40, 'Memória') + caixa(146, 142, 90, 40, 'E/S');
const harvard = R(6, 6, 110, 48, ' rx="3"') + T(61, 21, 'Memória') + T(61, 39, 'instruções') + R(134, 6, 110, 48, ' rx="3"') + T(189, 21, 'Memória') + T(189, 39, 'dados') +
  caixa(85, 100, 80, 40, 'CPU') + seta2(61, 58, 100, 98) + seta2(189, 58, 150, 98);
const cpu = R(4, 4, 212, 162, ' rx="5"') + T(110, 18, 'CPU') + ['PC', 'IR', 'ACC', 'R1'].map((s, i) => caixa(14, 34 + 30 * i, 70, 26, s)).join('') +
  caixa(110, 34, 96, 40, 'UC') + P('M110 96 H144 L158 112 L172 96 H206 L188 150 H128 Z') + T(158, 134, 'ULA') +
  seta(86, 107, 115, 107) + seta(158, 76, 158, 96, DF) + seta(110, 62, 86, 62, DF);
const cicloInstr = caixa(62, 8, 96, 32, 'Busca') + caixa(124, 132, 90, 32, 'Decodifica') + caixa(6, 132, 90, 32, 'Executa') +
  seta(140, 42, 168, 130) + seta(122, 148, 98, 148) + seta(52, 130, 80, 42);
const pirY = [4, 54, 92, 130, 164, 196], pirX = y => n1(124 * (y - 4) / 192);
const piramideMem = P('M130 4 L254 196 H6 Z') + pirY.slice(1, 5).map(y => P(`M${n1(130 - pirX(y))} ${y} H${n1(130 + pirX(y))}`)).join('') +
  [['Reg.', 41], ['Cache', 74], ['RAM', 111], ['SSD', 147], ['HD / fita', 181]].map(([s, y]) => T(130, y, s)).join('');
const cache = caixa(6, 26, 58, 46, 'CPU') + caixa(106, 26, 58, 46, 'Cache') + caixa(206, 26, 58, 46, 'RAM') +
  seta2(66, 49, 104, 49) + seta2(166, 49, 204, 49, DF) + TN(85, 14, 'acerto') + TN(185, 14, 'falta') + TN(135, 86, 'L1 / L2 / L3');
const barramento = caixa(6, 14, 50, 44, 'CPU') + caixa(64, 14, 76, 44, 'Memória') + caixa(148, 14, 48, 44, 'E/S') +
  [104, 126, 148].map(y => P(`M6 ${y} H180`, y === 104 ? ' stroke-width="3.5"' : '')).join('') +
  TL(188, 104, 'dados') + TL(188, 126, 'endereços') + TL(188, 148, 'controle') +
  [31, 102, 172].map(x => P(`M${x} 58 V148`, F) + [104, 126, 148].map(y => ponto(x, y, 3.2)).join('')).join('');
const estagios = ['IF', 'ID', 'EX', 'MEM', 'WB'];
const pipeline = [0, 1, 2, 3, 4, 5, 6].map(c => TN(49 + 38 * c, 16, c + 1)).join('') + TN(14, 16, 't') +
  [0, 1, 2].map(i => T(14, 48 + 36 * i, 'i' + (i + 1)) + estagios.map((s, k) => caixa(30 + 38 * (i + k), 34 + 36 * i, 38, 28, s, 14, k === 2 ? SOMB : '')).join('')).join('');
const registrador = celulas(10, 30, 30, 32, ['1', '0', '1', '1', '0', '0', '1', '0'], 16) +
  [0, 1, 2, 3, 4, 5, 6, 7].map(i => TN(25 + 30 * i, 16, 7 - i) + TN(25 + 30 * i, 78, 2 ** (7 - i))).join('');

// ====================== Sistemas operacionais ======================
const estadosProc = E(50, 24, 44, 18) + T(50, 24, 'Novo') + E(222, 24, 48, 18) + T(222, 24, 'Terminado') + E(50, 94, 44, 18) + T(50, 94, 'Pronto') +
  E(222, 94, 48, 18) + T(222, 94, 'Executando') + E(136, 154, 50, 18) + T(136, 154, 'Bloqueado') +
  seta(50, 43, 50, 75) + seta(95, 87, 173, 87) + seta(173, 101, 95, 101) + seta(222, 75, 222, 43) + seta(204, 111, 166, 139) + seta(106, 139, 70, 111);
const gantt = [['P1', 0, 4], ['P2', 4, 7], ['P3', 7, 11], ['P1', 11, 15]].map(([s, a, b]) => caixa(10 + 16 * a, 18, 16 * (b - a), 36, s, 15, s === 'P2' ? SOMB : '')).join('') +
  [0, 4, 7, 11, 15].map(t => TN(10 + 16 * t, 70, t)).join('');
const threads = R(4, 4, 232, 162, ' rx="6"') + T(120, 17, 'Processo') + caixa(12, 30, 70, 28, 'código') + caixa(85, 30, 70, 28, 'dados') + caixa(158, 30, 70, 28, 'arquivos') +
  [47, 120, 193].map(c => caixa(c - 32, 70, 64, 24, 'reg.', 14, F) + caixa(c - 32, 98, 64, 24, 'pilha', 14, F) +
    P(`M${c} 126 q8 6 0 12 q-8 6 0 12`) + head(c, 158, 90, 9)).join('');
const deadlock = no(50, 40, 'P1', 20, 15) + no(190, 130, 'P2', 20, 15) + caixa(170, 20, 40, 40, 'R1') + caixa(30, 110, 40, 40, 'R2') +
  seta(168, 40, 72, 40) + seta(50, 62, 50, 108) + seta(72, 130, 168, 130) + seta(190, 108, 190, 62) +
  TN(120, 26, 'detém') + TN(120, 146, 'detém') + TN(26, 85, 'pede') + TN(216, 85, 'pede') + T(120, 85, 'ciclo');
const frames = { 0: 'p1', 1: 'p3', 3: 'p0', 5: 'p2' }, mapa = [3, 0, 5, 1];
const paginacao = T(28, 14, 'lógica') + T(114, 14, 'tabela') + T(225, 12, 'física') +
  [0, 1, 2, 3].map(i => caixa(8, 30 + 30 * i, 40, 30, 'p' + i) + caixa(96, 30 + 30 * i, 36, 30, String(mapa[i]), 14, SOMB) + seta(48, 45 + 30 * i, 94, 45 + 30 * i, F) +
    seta(132, 45 + 30 * i, 198, 36 + 24 * mapa[i], F)).join('') +
  [0, 1, 2, 3, 4, 5].map(k => R(200, 24 + 24 * k, 50, 24) + (frames[k] ? T(225, 36 + 24 * k, frames[k]) : '') + TN(262, 36 + 24 * k, k)).join('');
const pasta = (x, y) => P(`M${x} ${y - 6} h6 l2 2 h8 v11 h-16 Z`, F);
const arqIc = (x, y) => P(`M${x + 2} ${y - 7} h8 l4 4 v10 h-12 Z`, F);
const itensArq = [[0, '/', 0], [1, 'bin', 0], [1, 'etc', 0], [1, 'home', 0], [2, 'aluno', 0], [3, 'aula.txt', 1], [3, 'foto.png', 1]];
const arvoreArq = itensArq.map(([l, s, f], k) => { const x = 10 + 24 * l, y = 16 + 26 * k; return (f ? arqIc(x, y) : pasta(x, y)) + TL(x + 22, y, s) + (l ? P(`M${x - 16} ${y} H${x - 3}`, F) : ''); }).join('') +
  P('M18 25 V94 M42 103 V120 M66 129 V172', F);
const procMem = R(20, 6, 90, 188) + P('M20 38 H110 M20 100 H110 M20 132 H110 M20 162 H110') + T(65, 22, 'pilha') + seta(65, 42, 65, 64, F, 8) + seta(65, 96, 65, 74, F, 8) +
  T(65, 116, 'heap') + T(65, 147, 'dados') + T(65, 178, 'código');

// ====================== Redes ======================
const osi = [['7', 'Aplicação'], ['6', 'Apresentação'], ['5', 'Sessão'], ['4', 'Transporte'], ['3', 'Rede'], ['2', 'Enlace'], ['1', 'Física']]
  .map(([n, s], i) => R(6, 6 + 32 * i, 188, 28, ' rx="3"') + P(`M36 ${6 + 32 * i} V${34 + 32 * i}`, F) + T(21, 20 + 32 * i, n) + T(115, 20 + 32 * i, s)).join('');
const tcpip = [['Aplicação', 'HTTP, DNS'], ['Transporte', 'TCP, UDP'], ['Internet', 'IP, ICMP'], ['Acesso à rede', 'Ethernet']]
  .map(([a, b], i) => caixa(6, 6 + 36 * i, 112, 32, a) + caixa(122, 6 + 36 * i, 102, 32, b, 14, F).replace('font-weight="600"', 'font-weight="400"')).join('');
const encaps = caixa(130, 8, 80, 28, 'dados') + caixa(88, 44, 42, 28, 'TCP', 14, SOMB) + caixa(130, 44, 80, 28, 'dados') +
  caixa(52, 80, 36, 28, 'IP', 14, SOMB) + caixa(88, 80, 42, 28, 'TCP') + caixa(130, 80, 80, 28, 'dados') +
  caixa(8, 116, 44, 28, 'Eth', 14, SOMB) + caixa(52, 116, 36, 28, 'IP') + caixa(88, 116, 42, 28, 'TCP') + caixa(130, 116, 80, 28, 'dados') + caixa(210, 116, 42, 28, 'FCS', 14, SOMB);
const topoBarra = P('M14 60 H226') + P('M14 50 V70 M226 50 V70', ' stroke-width="4"') +
  [[46, 24], [96, 100], [146, 24], [196, 100]].map(([x, y]) => pc(x, y) + P(y < 60 ? `M${x} 36 V60` : `M${x} 60 V89`, F)).join('');
const anelP = a => [90 + 62 * Math.cos(a * Math.PI / 180), 90 + 62 * Math.sin(a * Math.PI / 180)].map(n1);
const topoAnel = [0, 1, 2, 3, 4].map(k => { const a = -90 + 72 * k, [x0, y0] = anelP(a + 22), [x1, y1] = anelP(a + 50), [px, py] = anelP(a);
  return P(`M${x0} ${y0} A62 62 0 0 1 ${x1} ${y1}`) + pc(px, py); }).join('');
const swMini = (x, y) => R(x - 22, y - 11, 44, 22, ' rx="4"') + P(`M${x - 12} ${y - 4} H${x + 12} M${x + 12} ${y + 4} H${x - 12}`, F) + head(x + 14, y - 4, 0, 6) + head(x - 14, y + 4, 180, 6);
const topoArvore = swMini(120, 20) + swMini(60, 76) + swMini(180, 76) + P('M110 31 L68 65 M130 31 L172 65 M50 87 L30 117 M70 87 L90 117 M170 87 L150 117 M190 87 L210 117', F) +
  pc(30, 128) + pc(90, 128) + pc(150, 128) + pc(210, 128);
const roteador = C(55, 40, 30) + seta(55, 14, 55, 32) + seta(55, 66, 55, 48) + seta(46, 40, 29, 40) + seta(64, 40, 81, 40) + P('M6 40 H25 M85 40 H104');
const switchRede = R(10, 14, 110, 44, ' rx="6"') + seta(24, 28, 58, 28) + seta(72, 28, 106, 28) + seta(58, 44, 24, 44) + seta(106, 44, 72, 44) +
  P('M30 58 V70 M55 58 V70 M80 58 V70 M105 58 V70', F);
const servidorR = [8, 38, 68].map(y => R(10, y, 110, 26, ' rx="3"') + P(`M20 ${y + 9} H70 M20 ${y + 17} H70`, F) + ponto(98, y + 13, 3) + ponto(108, y + 13, 3)).join('');
const firewall = R(10, 10, 90, 68) + P('M10 27 H100 M10 44 H100 M10 61 H100') +
  P('M40 10 V27 M70 10 V27 M25 27 V44 M55 27 V44 M85 27 V44 M40 44 V61 M70 44 V61 M25 61 V78 M55 61 V78 M85 61 V78', F);
const clienteServ = pc(30, 26) + pc(30, 64) + pc(30, 102) + P('M44 24 H56 M44 62 H56 M44 100 H56 M56 24 V100', F) +
  seta(58, 50, 194, 50) + T(126, 36, 'requisição') + seta(194, 78, 58, 78) + T(126, 94, 'resposta') + servidor(198, 14, 52, 98);
const lan = nuvem(135, 30, 1.25, 'Internet') + P('M135 53 V70') + C(135, 84, 14) + P('M127 78 L143 90 M143 78 L127 90', F) + P('M135 98 V110') +
  caixa(97, 110, 76, 24, 'switch') + P('M110 134 L40 147 M135 134 V147 M160 134 L230 147', F) + pc(40, 158) + pc(135, 158) + pc(230, 158);
const handshake = caixa(10, 6, 80, 26, 'Cliente') + caixa(140, 6, 100, 26, 'Servidor') + P('M50 32 V174 M190 32 V174', DF) +
  seta(50, 56, 190, 80) + T(120, 55, 'SYN') + seta(190, 94, 50, 118) + T(120, 92, 'SYN-ACK') + seta(50, 130, 190, 154) + T(120, 129, 'ACK');
const dns = pc(30, 62) + TN(30, 92, 'cliente') + servidor(186, 26, 56, 72) + TN(214, 112, 'DNS') +
  seta(52, 50, 180, 50) + T(116, 36, 'exemplo.br ?') + seta(180, 78, 52, 78) + TN(116, 94, '203.0.113.7');
const ipv4 = T(134, 13, 'máscara /24') + celulas(10, 28, 62, 30, ['192', '168', '0', '10'], 16, [3]) +
  P('M12 64 v6 h182 v-6', F) + T(103, 84, 'rede') + P('M198 64 v6 h58 v-6', F) + T(227, 84, 'host');

// ====================== Banco de dados ======================
const erEntidade = R(6, 6, 118, 48) + T(65, 30, 'Entidade');
const erFraca = R(6, 6, 128, 54) + R(12, 12, 116, 42, F) + T(70, 33, 'Dependente');
const erAtributo = E(60, 28, 54, 22) + T(60, 28, 'atributo');
const erChave = E(60, 28, 54, 22) + T(60, 27, 'código') + P('M36 38 H84', F);
const erMulti = E(65, 30, 58, 24) + E(65, 30, 51, 18, F) + T(65, 30, 'telefone');
const erDerivado = E(60, 28, 54, 22, DASH) + T(60, 28, 'idade');
const erRelac = P('M65 4 L126 38 L65 72 L4 38 Z') + T(65, 38, 'possui');
const erExemplo = caixa(6, 56, 72, 36, 'Aluno') +
  P('M95 74 L135 48 L175 74 L135 100 Z') + T(135, 74, 'cursa') + caixa(188, 56, 78, 36, 'Disciplina') +
  P('M78 74 H95 M175 74 H188') + T(86, 62, 'N') + T(181, 62, 'M') +
  E(50, 20, 46, 15) + T(50, 20, 'matrícula') + P('M24 30 H76', F) + E(42, 128, 34, 15) + T(42, 128, 'nome') + P('M46 35 L42 56 M42 92 V113') +
  E(227, 20, 36, 15) + T(227, 20, 'código') + P('M206 30 H248', F) + E(227, 128, 34, 15) + T(227, 128, 'nome') + P('M227 35 V56 M227 92 V113');
const barraPG = x => y => P(`M${x} ${y - 9} V${y + 9}`), peG = y => P(`M190 ${y} L210 ${y - 10} M190 ${y} L210 ${y + 10}`), zeroPG = y => C(176, y, 6);
const peGalinha = [['um e só um', y => barraPG(186)(y) + barraPG(196)(y)], ['um ou muitos', y => barraPG(180)(y) + peG(y)],
  ['zero ou um', y => zeroPG(y) + barraPG(196)(y)], ['zero ou muitos', y => zeroPG(y) + peG(y)]]
  .map(([s, f], i) => { const y = 22 + 36 * i; return TNL(8, y, s) + P(i > 1 ? `M128 ${y} H170 M182 ${y} H210` : `M128 ${y} H210`) + f(y); }).join('');
const tabela = TL(8, 12, 'Aluno') + R(8, 24, 50, 28, SOMB) + T(33, 38, 'id') + R(58, 24, 110, 28, SOMB) + T(113, 38, 'nome') + R(168, 24, 90, 28, SOMB) + T(213, 38, 'curso') +
  P('M24 46 H42', F) + [['1', 'Ana', 'Redes'], ['2', 'Caio', 'Web'], ['3', 'Bia', 'Info']].map((r, i) =>
    R(8, 52 + 26 * i, 50, 26) + TN(33, 65 + 26 * i, r[0]) + R(58, 52 + 26 * i, 110, 26) + TN(113, 65 + 26 * i, r[1]) + R(168, 52 + 26 * i, 90, 26) + TN(213, 65 + 26 * i, r[2])).join('');
const entidadeT = (x, y, w, nome, campos) => caixa(x, y, w, 26, nome, 14, SOMB) + campos.map(([s, sub], i) => R(x, y + 26 + 26 * i, w, 26) + TNL(x + 8, y + 39 + 26 * i, s) +
  (sub ? P(`M${x + 8} ${y + 47 + 26 * i} H${x + 8 + sub}`, F) : '')).join('');
const chaveEstr = entidadeT(8, 8, 100, 'Curso', [['id', 14], ['nome']]) + entidadeT(150, 8, 112, 'Aluno', [['id', 14], ['nome'], ['curso_id FK']]) +
  P('M150 99 H128 V47 H118') + head(108, 47, 180);
const vennJ = (c, y, tipo, rot) => {
  const h = n1(Math.sqrt(22 * 22 - 13 * 13));
  const area = { INNER: P(`M${c} ${n1(y - h)} A22 22 0 0 1 ${c} ${n1(y + h)} A22 22 0 0 1 ${c} ${n1(y - h)} Z`, CHEIO), LEFT: C(c - 13, y, 22, CHEIO),
    RIGHT: C(c + 13, y, 22, CHEIO), FULL: P(`M${c} ${n1(y - h)} A22 22 0 1 0 ${c} ${n1(y + h)} A22 22 0 1 0 ${c} ${n1(y - h)} Z`, CHEIO) }[tipo];
  return area + C(c - 13, y, 22, F) + C(c + 13, y, 22, F) + T(c, y + 36, rot);
};
const joins = vennJ(68, 32, 'INNER', 'INNER') + vennJ(202, 32, 'LEFT', 'LEFT') + vennJ(68, 104, 'RIGHT', 'RIGHT') + vennJ(202, 104, 'FULL', 'FULL');

// ====================== Engenharia de software ======================
const cls = (x, y, w, nome) => R(x, y, w, 54) + P(`M${x} ${y + 24} H${x + w} M${x} ${y + 39} H${x + w}`, F) + T(x + w / 2, y + 12, nome);
const umlHeranca = cls(70, 6, 90, 'Animal') + cls(10, 110, 90, 'Cão') + cls(130, 110, 90, 'Gato') + P('M115 60 L105 78 H125 Z') + P('M115 78 V90 M55 90 H175 M55 90 V110 M175 90 V110');
const umlAssoc = cls(6, 12, 90, 'Aluno') + cls(174, 12, 90, 'Turma') + P('M96 39 H174') + TN(116, 26, '0..*') + TN(164, 26, '1') + T(135, 54, 'cursa');
const umlAgreg = cls(6, 12, 90, 'Time') + cls(174, 12, 90, 'Jogador') + P('M96 39 L108 31 L120 39 L108 47 Z') + P('M120 39 H174') + TN(108, 60, '1') + TN(162, 26, '*');
const umlComp = cls(6, 12, 90, 'Casa') + cls(174, 12, 90, 'Cômodo') + P('M96 39 L108 31 L120 39 L108 47 Z', ' fill="#C"') + P('M120 39 H174') + TN(108, 60, '1') + TN(162, 26, '1..*');
const umlInterface = R(60, 6, 110, 56) + P('M60 44 H170', F) + TN(115, 17, '«interface»') + T(115, 33, 'Forma') + cls(70, 110, 90, 'Círculo') +
  P('M115 110 V82', DASH) + P('M115 64 L105 82 H125 Z');
const casosUso = C(34, 74, 10) + P('M34 84 V114 M18 94 H50 M34 114 L22 136 M34 114 L46 136') + TN(34, 154, 'Aluno') +
  R(92, 6, 172, 176, ' rx="4"') + TN(178, 18, 'Sistema') +
  [['Matricular', 56], ['Ver notas', 106], ['Emitir boletim', 156]].map(([s, y]) => E(178, y, 70, 18) + T(178, y, s) + P(`M50 94 L108 ${y}`, F)).join('');
const sequencia = caixa(6, 6, 76, 28, ':Tela') + caixa(92, 6, 76, 28, ':Controle') + caixa(178, 6, 76, 28, ':Banco') + P('M44 34 V186 M130 34 V58 M130 158 V186 M216 34 V82 M216 122 V186', DF) +
  R(124, 58, 12, 100) + R(210, 82, 12, 40) + seta(44, 62, 123, 62) + TN(84, 50, 'salvar()') + seta(136, 86, 209, 86) + TN(173, 74, 'inserir()') +
  seta(209, 116, 137, 116, DASH) + TN(173, 104, 'ok') + seta(123, 150, 45, 150, DASH) + TN(84, 138, 'sucesso');
const cascata = ['Requisitos', 'Projeto', 'Implementação', 'Testes', 'Manutenção'].map((s, i) => caixa(6 + 38 * i, 8 + 36 * i, 104, 28, s) +
  (i < 4 ? P(`M${110 + 38 * i} ${22 + 36 * i} H${124 + 38 * i} V${38 + 36 * i}`) + head(124 + 38 * i, 44 + 36 * i, 90, 9) : '')).join('');
const espiralPts = (() => { const pts = []; for (let k = 0; k <= 108; k++) { const th = k * Math.PI / 18, r = 4 + 90 * th / (6 * Math.PI); pts.push([n1(115 + r * Math.cos(th - Math.PI / 2)), n1(116 + r * Math.sin(th - Math.PI / 2))]); } return pts; })();
const espiral = P('M115 14 V218 M12 116 H218', DF) + P('M' + espiralPts.slice(0, -2).map(p => p.join(' ')).join(' L')) +
  head(...espiralPts[espiralPts.length - 1], n1(Math.atan2(espiralPts[108][1] - espiralPts[105][1], espiralPts[108][0] - espiralPts[105][0]) * 180 / Math.PI)) +
  T(42, 14, 'Objetivos') + T(190, 14, 'Riscos') + T(174, 218, 'Desenvolver') + T(42, 218, 'Planejar');
const scrum = R(6, 46, 50, 70, ' rx="3"') + P('M14 62 H48 M14 78 H48 M14 94 H48 M14 108 H40', F) + TN(31, 128, 'backlog') +
  R(78, 60, 40, 44, ' rx="3"') + P('M85 74 H111 M85 86 H111', F) + TN(98, 120, 'sprint') +
  seta(58, 82, 76, 82) + seta(120, 82, 134, 82) + arco(170, 84, 32, -50, 245) + T(170, 76, '2–4') + TN(170, 94, 'sem.') +
  arco(170, 28, 13, -40, 250, 8) + TL(188, 20, 'diária') + seta(204, 84, 224, 84) + R(226, 66, 36, 34, ' rx="3"' + SOMB) + TN(244, 116, 'entrega');
const git = P('M33 86 H65 M83 86 H135 M153 86 H215') + P('M74 77 L106 46 M123 40 H165 M182 46 L216 79') +
  C(24, 86, 9) + C(74, 86, 9) + C(144, 86, 9) + C(224, 86, 9, ' fill="#C"') + C(114, 40, 9) + C(174, 40, 9) +
  TN(254, 86, 'main') + TN(222, 22, 'feature') + TN(74, 112, 'branch') + TN(224, 112, 'merge');
const camadas = caixa(10, 6, 200, 34, 'Apresentação') + seta2(110, 42, 110, 64, '', 8) + caixa(10, 66, 200, 34, 'Negócio') + seta2(110, 102, 110, 124, '', 8) + caixa(10, 126, 200, 34, 'Dados');
const mvc = caixa(70, 8, 90, 34, 'Modelo') + caixa(6, 120, 90, 34, 'Visão') + caixa(134, 120, 90, 34, 'Controle') +
  seta(172, 118, 138, 44) + seta(92, 44, 58, 118) + seta(98, 137, 132, 137);

// ====================== Teoria da computação ======================
const est = (x, y, s, fin) => C(x, y, 18) + (fin ? C(x, y, 14, F) : '') + T(x, y, s, 14);
const afd = seta(6, 84, 31, 84) + est(50, 84, 'q₀') + est(140, 84, 'q₁') + est(230, 84, 'q₂', true) +
  laco(50, 84, 18, 'b') + seta(68, 84, 122, 84) + TN(95, 72, 'a') + laco(140, 84, 18, 'a') + seta(158, 84, 212, 84) + TN(185, 72, 'b') +
  curva([230, 84], [50, 84], 18, 46, 'a');
const afn = seta(6, 84, 31, 84) + est(50, 84, 'q₀') + est(140, 84, 'q₁') + est(230, 84, 'q₂', true) +
  laco(50, 84, 18, 'a, b') + seta(68, 84, 122, 84) + TN(95, 72, 'a') + seta(158, 84, 212, 84) + TN(185, 72, 'ε');
const turing = caixa(72, 6, 70, 30, 'q₁', 16) + P('M107 36 V54', F) + P('M107 66 L99 54 H115 Z', ' fill="#C"') +
  celulas(9, 70, 28, 32, ['', '1', '0', '1', '1', '0', '', '', ''], 16, [3]) + P('M1 70 H9 M1 102 H9 M261 70 H269 M261 102 H269', DF) +
  seta2(76, 122, 138, 122) + TN(52, 122, 'esq.') + TN(164, 122, 'dir.');
const sint = [['E', 120, 16, 1], ['E', 46, 58, 1], ['+', 110, 58, 0], ['T', 186, 58, 1], ['T', 46, 100, 1], ['T', 146, 100, 1], ['*', 186, 100, 0], ['F', 226, 100, 1],
  ['F', 46, 142, 1], ['F', 146, 142, 1], ['c', 226, 142, 0], ['a', 46, 184, 0], ['b', 146, 184, 0]];
const arvSint = [[0, 1], [0, 2], [0, 3], [1, 4], [3, 5], [3, 6], [3, 7], [4, 8], [5, 9], [7, 10], [8, 11], [9, 12]]
  .map(([a, b]) => P(`M${sint[a][1]} ${sint[a][2] + 9} L${sint[b][1]} ${sint[b][2] - 9}`, F)).join('') +
  sint.map(([s, x, y, nt]) => nt ? T(x, y, s, 16) : TN(x, y, s, 16).replace('font-family', 'font-style="italic" font-family')).join('');
const chomsky = E(130, 92, 126, 84) + E(130, 110, 108, 66) + E(130, 130, 88, 46) + E(130, 152, 54, 24) +
  T(130, 26, 'Rec. enumeráveis') + T(130, 64, 'Sensíveis') + T(130, 104, 'Livres de contexto') + T(130, 152, 'Regulares');

// ====================== IA e ciência de dados ======================
const neuronio = [30, 75, 120].map((y, i) => T(16, y, 'x' + '₁₂₃'[i]) + aresta([30, y], [140, 75], { ra: 0, rb: 24, dir: true }) + TN(78, y === 75 ? 64 : n1(y + (75 - y) * 0.43 - 12), 'w' + '₁₂₃'[i])).join('') +
  C(140, 75, 24) + T(140, 75, 'Σ', 20) + T(140, 9, 'b') + seta(140, 18, 140, 50) + seta(164, 75, 182, 75) + caixa(184, 58, 36, 34, 'f', 16) + seta(220, 75, 242, 75) + T(252, 75, 'y');
const camadasNN = [[30, [45, 90, 135]], [130, [30, 70, 110, 150]], [230, [70, 110]]];
const redeNeural = camadasNN.slice(0, 2).map(([x, ys], l) => ys.map(y => camadasNN[l + 1][1].map(y2 => aresta([x, y], [camadasNN[l + 1][0], y2], { ra: 13, rb: 13, a: F })).join('')).join('')).join('') +
  camadasNN.map(([x, ys], l) => ys.map(y => C(x, y, 13, l === 1 ? SOMB : '')).join('')).join('') + TN(30, 178, 'entrada') + TN(130, 178, 'oculta') + TN(230, 178, 'saída');
const folha = (x, y, s) => R(x - 28, y - 14, 56, 28, ' rx="12"' + SOMB) + T(x, y, s);
const arvoreDecisao = caixa(80, 8, 80, 30, 'Chove?') + caixa(30, 72, 80, 30, 'Vento?') + folha(200, 87, 'Sai') + folha(36, 152, 'Fica') + folha(112, 152, 'Sai') +
  P('M100 38 L74 72 M140 38 L190 73 M56 102 L40 138 M84 102 L106 138', F) + TN(72, 50, 'sim') + TN(180, 50, 'não') + TN(32, 120, 'sim') + TN(112, 118, 'não');
const pipeDados = ['Coleta', 'Limpeza', 'Modelo', 'Painel'].map((s, i) => caixa(4 + 70 * i, 16, 58, 36, s, 14) + (i < 3 ? seta(62 + 70 * i, 34, 73 + 70 * i, 34, '', 8) : '')).join('');
const kmeans = P('M14 8 V160 H214') + [[60, 116], [150, 56], [176, 132]].map(([cx, cy]) => {
  const off = [[-12, -8], [10, -12], [-4, 12], [14, 6], [-16, 6], [4, -2]];
  return C(cx, cy, 28, DF) + off.map(([dx, dy]) => ponto(cx + dx, cy + dy, 3.5)).join('') + P(`M${cx - 6} ${cy - 6} L${cx + 6} ${cy + 6} M${cx + 6} ${cy - 6} L${cx - 6} ${cy + 6}`, ' stroke-width="3"');
}).join('');
const matrizConf = T(140, 12, 'previsto') + T(105, 32, 'P') + T(175, 32, 'N') + T(22, 94, 'real') + T(58, 69, 'P') + T(58, 119, 'N') +
  caixa(70, 44, 70, 50, 'VP', 16, SOMB) + caixa(140, 44, 70, 50, 'FN', 16) + caixa(70, 94, 70, 50, 'FP', 16) + caixa(140, 94, 70, 50, 'VN', 16, SOMB);
const treinoTeste = R(10, 30, 240, 34, ' rx="3"') + R(10, 30, 192, 34, ' rx="3"' + SOMB) + T(106, 16, 'treino') + T(226, 16, 'teste') + T(106, 47, '80%') + T(226, 47, '20%');
const sig = (() => { let s = ''; for (let i = 0; i <= 30; i++) { const t = -6 + 12 * i / 30; s += `${i ? ' L' : 'M'}${n1(12 + 106 * i / 30)} ${n1(86 - 60 / (1 + Math.exp(-t)))}`; } return s; })();
const ativacao = P('M10 86 H120 M65 92 V14') + P('M10 26 H120', DF) + P(sig) + P('M140 86 H250 M195 92 V14') + P('M140 86 H195 L245 36', ' stroke-width="3"') +
  TN(65, 108, 'sigmoide') + TN(195, 108, 'ReLU');

// ====================== Desenvolvimento web ======================
const htmlSem = caixa(6, 6, 188, 30, 'header') + caixa(6, 42, 188, 24, 'nav', 14, SOMB) + caixa(6, 72, 128, 98, 'main') + caixa(140, 72, 54, 98, 'aside', 14, SOMB) + caixa(6, 176, 188, 28, 'footer');
const boxModel = R(4, 4, 252, 178, DASH) + TL(12, 16, 'margin') + R(26, 26, 208, 134) + R(46, 46, 168, 94) + TL(34, 36, 'border') + TL(54, 59, 'padding') +
  R(76, 72, 108, 44, SOMB) + T(130, 94, 'conteúdo');
const domN = [['html', 120, 18], ['head', 55, 70], ['body', 175, 70], ['title', 55, 122], ['h1', 125, 122], ['p', 175, 122], ['ul', 225, 122], ['li', 225, 170]];
const dom = [[0, 1], [0, 2], [1, 3], [2, 4], [2, 5], [2, 6], [6, 7]].map(([a, b]) => P(`M${domN[a][1]} ${domN[a][2] + 13} L${domN[b][1]} ${domN[b][2] - 13}`, F)).join('') +
  domN.map(([s, x, y]) => caixa(x - 23, y - 13, 46, 26, s, 14, s === 'html' ? SOMB : '')).join('');
const janela = (w, h) => R(6, 6, w, h, ' rx="6"') + P(`M6 28 H${w + 6}`) + C(18, 17, 3.5) + C(30, 17, 3.5) + C(42, 17, 3.5);
const wireframe = janela(208, 158) + R(56, 11, 150, 12, ' rx="6"' + F) + R(16, 38, 44, 20, F) + P('M120 48 H138 M148 48 H166 M176 48 H198', ' stroke-width="3"') +
  R(16, 66, 188, 48, F) + P('M16 66 L204 114 M204 66 L16 114', F) +
  [16, 82, 148].map(x => P(`M${x} 126 H${x + 56} M${x} 136 H${x + 56} M${x} 146 H${x + 40}`, F)).join('');
const navegador = janela(208, 138) + P('M6 52 H214') + seta(30, 40, 16, 40, F, 7) + seta(36, 40, 50, 40, F, 7) + R(62, 32, 146, 16, ' rx="8"' + F) + TNL(72, 40, 'exemplo.br');
const celular = R(8, 4, 94, 192, ' rx="14"') + P('M44 14 H66', F) + R(16, 24, 78, 152, F) + C(55, 186, 5, F) +
  R(22, 30, 66, 14, SOMB) + R(22, 50, 66, 40, F) + P('M22 50 L88 90 M88 50 L22 90', F) + P('M22 102 H88 M22 112 H88 M22 122 H74 M22 132 H88', F) + R(30, 146, 50, 18, ' rx="9"');
const responsivo = R(6, 14, 130, 86, ' rx="3"') + P('M71 100 V114 M50 116 H92') + R(14, 22, 114, 12, SOMB) + R(14, 40, 34, 52, F) + R(54, 40, 34, 52, F) + R(94, 40, 34, 52, F) +
  R(152, 30, 62, 88, ' rx="6"') + R(158, 38, 50, 10, SOMB) + R(158, 54, 22, 56, F) + R(186, 54, 22, 56, F) +
  R(226, 54, 38, 66, ' rx="6"') + R(231, 61, 28, 8, SOMB) + R(231, 74, 28, 16, F) + R(231, 94, 28, 18, F);
const http = pc(30, 70) + TN(30, 98, 'cliente') + servidor(212, 24, 50, 92) +
  seta(52, 52, 206, 52) + T(129, 38, 'GET /pagina') + seta(206, 88, 52, 88) + T(129, 104, '200 OK') + TN(129, 130, '404 = não encontrada');
const frontBack = caixa(6, 28, 78, 46, 'Front-end') + seta2(86, 51, 110, 51, '', 8) + caixa(112, 28, 78, 46, 'Back-end') + seta2(192, 51, 216, 51, '', 8) + cil(242, 24, 44, 54, 'BD') +
  TN(45, 92, 'interface') + TN(151, 92, 'regras') + TN(242, 92, 'dados');
const apiRest = pc(24, 86) + seta2(40, 86, 70, 86, '', 8) + R(72, 10, 140, 150, ' rx="4"') + T(142, 26, 'API REST') + P('M72 40 H212', F) +
  [['GET /alunos', 56], ['POST /alunos', 82], ['PUT /alunos/1', 108], ['DELETE /alunos/1', 134]].map(([s, y]) => TNL(80, y, s)).join('') +
  seta2(214, 86, 238, 86, '', 8) + cil(253, 60, 28, 52);
const formulario = R(6, 6, 188, 168, ' rx="4"') + T(100, 22, 'Cadastro') + TNL(18, 46, 'Nome') + R(18, 56, 164, 22, ' rx="3"' + F) +
  TNL(18, 94, 'E-mail') + R(18, 104, 164, 22, ' rx="3"' + F) + R(18, 140, 14, 14, ' rx="2"' + F) + P('M21 147 L24 151 L30 143', F) + R(110, 136, 72, 26, ' rx="13"' + SOMB) + T(146, 149, 'Enviar');
const flexbox = R(6, 26, 248, 70, ' rx="4"') + TNL(12, 14, 'container (flex)') + caixa(20, 40, 56, 42, '1', 16, SOMB) + caixa(86, 40, 56, 42, '2', 16, SOMB) + caixa(152, 40, 56, 42, '3', 16, SOMB) +
  seta(20, 112, 240, 112, F) + TN(130, 128, 'eixo principal');

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "cc-rastreamento-variaveis",
        "Rastreamento de algoritmo",
        540,
        262,
        "<text x=\"270\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Rastreamento de algoritmo</text><rect x=\"10\" y=\"42\" width=\"520\" height=\"216\" rx=\"3\"/><text x=\"75\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Passo</text><text x=\"205\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Variáveis</text><path d=\"M140 42 V258\"/><text x=\"335\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Condição</text><path d=\"M270 42 V258\"/><text x=\"465\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Saída</text><path d=\"M400 42 V258\"/><path d=\"M10 68 H530\"/><path d=\"M10 106 H530\"/><path d=\"M10 144 H530\"/><path d=\"M10 182 H530\"/><path d=\"M10 220 H530\"/>"
      ],
      [
        "cc-contrato-funcao",
        "Função — contrato preenchível",
        520,
        158,
        "<text x=\"260\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Função — contrato preenchível</text><rect x=\"10\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"85\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Entradas</text><path d=\"M162 73 L176 73\"/><path d=\"M169 69 L176 73 L169 77\"/><text x=\"85\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">tipo: ______</text><rect x=\"180\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"255\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Processamento</text><path d=\"M332 73 L346 73\"/><path d=\"M339 69 L346 73 L339 77\"/><text x=\"255\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">pré-condição: ___</text><rect x=\"350\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"425\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Retorno</text><text x=\"425\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">pós-condição: ___</text>"
      ]
    ]
  ]
];

export default {
  id: 'computacao',
  nome: 'Ciência da Computação',
  destaques: ['cc-vetor', 'cc-lista', 'cc-pilha', 'cc-fila', 'cc-arvore-bin', 'cc-grafo-nd', 'cc-hash', 'cc-complexidade', 'cc-von-neumann',
    'cc-estados-proc', 'cc-osi', 'cc-cliente-servidor', 'cc-er-exemplo', 'cc-uml-heranca', 'cc-afd', 'cc-rede-neural'],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Estruturas de dados', [
      ['cc-vetor', 'Vetor com índices', 250, 80, vetor],
      ['cc-matriz', 'Matriz com índices', 212, 134, matriz],
      ['cc-no-lista', 'Nó de lista (dado | próx.)', 130, 50, noListaSo],
      ['cc-lista', 'Lista ligada simples', 260, 72, lista],
      ['cc-lista-dupla', 'Lista duplamente ligada', 270, 76, listaDupla],
      ['cc-lista-circular', 'Lista circular', 270, 96, listaCircular],
      ['cc-pilha', 'Pilha (LIFO)', 200, 196, pilha],
      ['cc-fila', 'Fila (FIFO)', 270, 104, fila],
      ['cc-deque', 'Deque (fila dupla)', 260, 96, deque],
      ['cc-no-arvore', 'Nó de árvore', 100, 84, noArvore],
      ['cc-arvore-bin', 'Árvore binária', 230, 146, arvoreBin],
      ['cc-bst', 'Árvore binária de busca', 230, 176, bst],
      ['cc-heap', 'Heap (árvore e vetor)', 250, 198, heap],
      ['cc-trie', 'Trie (árvore de prefixos)', 240, 192, trie],
      ['cc-hash', 'Tabela hash (encadeamento)', 214, 198, hash],
      ['cc-grafo-nd', 'Grafo não dirigido', 220, 150, grafoND],
      ['cc-grafo-d', 'Grafo dirigido (dígrafo)', 220, 150, grafoD],
      ['cc-grafo-pond', 'Grafo ponderado', 220, 150, grafoP],
      ['cc-adj-matriz', 'Matriz de adjacência', 188, 170, adjMatriz],
      ['cc-adj-lista', 'Lista de adjacência', 206, 162, adjLista],
    ]],
    ['Algoritmos', [
      ['cc-bolha', 'Ordenação por bolha (trocas)', 250, 180, bolha],
      ['cc-merge', 'Merge sort (divide e intercala)', 250, 210, merge],
      ['cc-quick', 'Quicksort (partição no pivô)', 260, 152, quick],
      ['cc-busca-bin', 'Busca binária', 260, 110, buscaBin],
      ['cc-recursao', 'Recursão (árvore de chamadas)', 266, 176, recursao],
      ['cc-bfs', 'Busca em largura (BFS)', 230, 174, bfs],
      ['cc-dfs', 'Busca em profundidade (DFS)', 230, 174, dfs],
      ['cc-dijkstra', 'Dijkstra (menor caminho)', 240, 186, dijkstra],
      ['cc-complexidade', 'Complexidade (curvas O)', 276, 203, "<g transform=\"translate(0.00 0.50)\">" + (complexidade) + "</g>"],
    ]],
    ['Arquitetura de computadores', [
      ['cc-von-neumann', 'Arquitetura de von Neumann', 250, 188, vonNeumann],
      ['cc-harvard', 'Arquitetura Harvard', 250, 146, harvard],
      ['cc-cpu', 'CPU (UC, ULA, registradores)', 220, 170, cpu],
      ['cc-ciclo-instrucao', 'Ciclo de instrução', 220, 170, cicloInstr],
      ['cc-piramide-mem', 'Hierarquia de memória', 260, 200, piramideMem],
      ['cc-cache', 'Memória cache', 270, 96, cache],
      ['cc-barramento', 'Barramento do sistema', 262, 163, "<g transform=\"translate(0.00 0.00)\">" + (barramento) + "</g>"],
      ['cc-pipeline', 'Pipeline de 5 estágios', 300, 140, pipeline],
      ['cc-registrador', 'Byte com pesos (binário)', 260, 90, registrador],
    ]],
    ['Sistemas operacionais', [
      ['cc-estados-proc', 'Estados de um processo', 274, 176, estadosProc],
      ['cc-gantt-cpu', 'Escalonamento (Gantt de CPU)', 260, 84, gantt],
      ['cc-threads', 'Processo com threads', 240, 170, threads],
      ['cc-deadlock', 'Deadlock (grafo de recursos)', 240, 160, deadlock],
      ['cc-paginacao', 'Paginação (tabela de páginas)', 272, 172, paginacao],
      ['cc-arvore-arq', 'Sistema de arquivos (árvore)', 180, 186, arvoreArq],
      ['cc-proc-memoria', 'Memória de um processo', 130, 200, procMem],
    ]],
    ['Redes', [
      ['cc-osi', 'Modelo OSI (7 camadas)', 200, 234, osi],
      ['cc-tcpip', 'Modelo TCP/IP', 230, 150, tcpip],
      ['cc-encapsulamento', 'Encapsulamento', 260, 150, encaps],
      ['cc-topo-barramento', 'Topologia em barramento', 240, 120, topoBarra],
      ['cc-topo-anel', 'Topologia em anel', 180, 180, topoAnel],
      ['cc-topo-arvore', 'Topologia em árvore', 240, 146, topoArvore],
      ['cc-roteador', 'Roteador (símbolo)', 110, 80, roteador],
      ['cc-switch', 'Switch (símbolo)', 130, 76, switchRede],
      ['cc-servidor', 'Servidor (rack)', 130, 100, servidorR],
      ['cc-firewall', 'Firewall', 110, 88, firewall],
      ['cc-cliente-servidor', 'Cliente-servidor', 256, 124, clienteServ],
      ['cc-lan', 'Rede local com Internet', 270, 184, "<g transform=\"translate(0.00 7.64)\">" + (lan) + "</g>"],
      ['cc-handshake', 'Handshake TCP (3 vias)', 250, 180, handshake],
      ['cc-dns', 'Consulta DNS', 256, 122, dns],
      ['cc-ipv4', 'Endereço IPv4 (rede e host)', 266, 96, ipv4],
    ]],
    ['Banco de dados', [
      ['cc-er-entidade', 'Entidade (ER)', 130, 60, erEntidade],
      ['cc-er-fraca', 'Entidade fraca (ER)', 140, 66, erFraca],
      ['cc-er-atributo', 'Atributo (ER)', 120, 56, erAtributo],
      ['cc-er-chave', 'Atributo chave (ER)', 120, 56, erChave],
      ['cc-er-multivalorado', 'Atributo multivalorado (ER)', 130, 60, erMulti],
      ['cc-er-derivado', 'Atributo derivado (ER)', 120, 56, erDerivado],
      ['cc-er-relacionamento', 'Relacionamento (ER)', 130, 76, erRelac],
      ['cc-er-exemplo', 'Diagrama ER (N:M)', 270, 148, erExemplo],
      ['cc-pe-galinha', 'Cardinalidade (pé de galinha)', 216, 150, peGalinha],
      ['cc-tabela', 'Tabela relacional (chave)', 266, 134, tabela],
      ['cc-chave-estrangeira', 'Chave estrangeira (2 tabelas)', 270, 120, chaveEstr],
      ['cc-joins', 'Junções SQL (Venn)', 270, 150, joins],
    ]],
    ['Engenharia de software', [
      ['cc-uml-heranca', 'Herança (UML)', 230, 168, umlHeranca],
      ['cc-uml-associacao', 'Associação (UML)', 270, 72, umlAssoc],
      ['cc-uml-agregacao', 'Agregação (UML)', 270, 72, umlAgreg],
      ['cc-uml-composicao', 'Composição (UML)', 270, 72, umlComp],
      ['cc-uml-interface', 'Interface e realização (UML)', 230, 168, umlInterface],
      ['cc-casos-uso', 'Diagrama de casos de uso', 270, 186, casosUso],
      ['cc-sequencia', 'Diagrama de sequência', 260, 190, sequencia],
      ['cc-cascata', 'Modelo cascata', 266, 186, cascata],
      ['cc-espiral', 'Modelo espiral', 232, 228, espiral],
      ['cc-scrum', 'Ciclo Scrum', 270, 140, scrum],
      ['cc-git', 'Git: branch e merge', 276, 122, git],
      ['cc-camadas', 'Arquitetura em 3 camadas', 220, 166, camadas],
      ['cc-mvc', 'MVC (modelo, visão, controle)', 230, 160, mvc],
    ]],
    ['Teoria da computação', [
      ['cc-afd', 'Autômato finito (AFD)', 270, 150, afd],
      ['cc-afn', 'Autômato com ε (AFN)', 270, 110, afn],
      ['cc-turing', 'Máquina de Turing', 270, 134, turing],
      ['cc-arvore-sintatica', 'Árvore sintática (a + b * c)', 244, 196, arvSint],
      ['cc-chomsky', 'Hierarquia de Chomsky', 260, 182, chomsky],
    ]],
    ['IA e ciência de dados', [
      ['cc-neuronio', 'Neurônio artificial', 264, 150, neuronio],
      ['cc-rede-neural', 'Rede neural (camadas)', 260, 188, redeNeural],
      ['cc-arvore-decisao', 'Árvore de decisão', 240, 172, arvoreDecisao],
      ['cc-pipeline-dados', 'Pipeline de dados', 276, 68, pipeDados],
      ['cc-kmeans', 'Agrupamento (k-means)', 220, 166, kmeans],
      ['cc-matriz-confusao', 'Matriz de confusão', 214, 150, matrizConf],
      ['cc-treino-teste', 'Divisão treino / teste', 260, 72, treinoTeste],
      ['cc-ativacao', 'Funções de ativação', 260, 123, "<g transform=\"translate(0.00 0.00)\">" + (ativacao) + "</g>"],
    ]],
    ['Desenvolvimento web', [
      ['cc-html-semantico', 'Estrutura de página (HTML)', 200, 210, htmlSem],
      ['cc-box-model', 'Modelo de caixa (CSS)', 260, 186, boxModel],
      ['cc-dom', 'Árvore DOM', 254, 188, dom],
      ['cc-wireframe', 'Wireframe de página', 220, 170, wireframe],
      ['cc-wireframe-celular', 'Wireframe de celular', 110, 200, celular],
      ['cc-navegador', 'Navegador (janela)', 220, 150, navegador],
      ['cc-responsivo', 'Layout responsivo', 270, 124, responsivo],
      ['cc-http', 'Requisição e resposta HTTP', 270, 140, http],
      ['cc-front-back', 'Front-end, back-end e BD', 270, 102, frontBack],
      ['cc-api-rest', 'API REST', 270, 168, apiRest],
      ['cc-formulario', 'Formulário', 200, 180, formulario],
      ['cc-flexbox', 'Flexbox (eixo principal)', 260, 143, "<g transform=\"translate(0.00 0.50)\">" + (flexbox) + "</g>"],
    ]],
  ],
};
