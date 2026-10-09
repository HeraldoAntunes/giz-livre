// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Geografia (prefixo 'geo-'): desenhos próprios, à mão; contornos de continentes e do Brasil são SIMPLIFICADOS (poucos pontos, didáticos).
import { T, head } from './base.js';

const f = n => +(+n).toFixed(1);
const fino = (d, w = 1.6) => `<path stroke-width="${w}" d="${d}"/>`;
const trac = (d, w = 1.6, da = '5 4') => `<path stroke-width="${w}" stroke-dasharray="${da}" d="${d}"/>`;
const t14 = (x, y, s) => T(x, y, s, 14);
const TS = (x, y, s, size = 14) => T(x, y, s, size).replace('text-anchor="middle"', 'text-anchor="start"');
const cheio = d => `<path d="${d}" fill="#C" stroke-width="1.2"/>`;
const sombra = d => `<path d="${d}" fill="#C" fill-opacity=".22" stroke="none"/>`;
const ponto = (x, y, r = 3) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="#C" stroke="none"/>`;
// seta reta (ponta cheia); w = espessura
const seta = (x1, y1, x2, y2, w = 2.5, L) => {
  L = L ?? Math.max(10, 7 + 2 * w);
  const a = Math.atan2(y2 - y1, x2 - x1), ex = f(x2 - Math.cos(a) * L * 0.7), ey = f(y2 - Math.sin(a) * L * 0.7);
  return `<path${w !== 2.5 ? ` stroke-width="${w}"` : ''} d="M${f(x1)},${f(y1)} L${ex},${ey}"/>` + head(f(x2), f(y2), f(a * 180 / Math.PI), L);
};
// seta curva (quadrática)
const setaQ = (x1, y1, cx, cy, x2, y2, w = 2.5, L) => {
  L = L ?? Math.max(10, 7 + 2 * w);
  const a = Math.atan2(y2 - cy, x2 - cx), ex = f(x2 - Math.cos(a) * L * 0.7), ey = f(y2 - Math.sin(a) * L * 0.7);
  return `<path${w !== 2.5 ? ` stroke-width="${w}"` : ''} d="M${f(x1)},${f(y1)} Q${f(cx)},${f(cy)} ${ex},${ey}"/>` + head(f(x2), f(y2), f(a * 180 / Math.PI), L);
};
// curva suave por pontos (Catmull-Rom); k maior = mais próxima do polígono
const suave = (pts, fechado = true, k = 6) => {
  const n = pts.length, P = i => fechado ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < (fechado ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / k)},${f(p1[1] + (p2[1] - p0[1]) / k)} ${f(p2[0] - (p3[0] - p1[0]) / k)},${f(p2[1] - (p3[1] - p1[1]) / k)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + (fechado ? ' Z' : '');
};
const nuvem = (cx, cy, s = 1) => {
  const p = (x, y) => `${f(cx + x * s)},${f(cy + y * s)}`, r = v => f(v * s);
  return `<path d="M${p(-24, 10)} A${r(9)},${r(9)} 0 0,1 ${p(-18, -6)} A${r(13)},${r(13)} 0 0,1 ${p(6, -12)} A${r(10)},${r(10)} 0 0,1 ${p(22, -2)} A${r(8)},${r(8)} 0 0,1 ${p(22, 10)} Z"/>`;
};
const sol = (cx, cy, r = 9) => {
  let d = '';
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; d += `M${f(cx + (r + 3) * Math.cos(a))},${f(cy + (r + 3) * Math.sin(a))} L${f(cx + (r + 8) * Math.cos(a))},${f(cy + (r + 8) * Math.sin(a))} `; }
  return `<circle cx="${cx}" cy="${cy}" r="${r}"/>` + fino(d, 1.8);
};
const lua = (cx, cy, r = 10) => `<path d="M${cx + 3},${cy - r} A${r},${r} 0 1,0 ${cx + 3},${cy + r} A${f(r * 0.75)},${f(r * 0.75)} 0 0,1 ${cx + 3},${cy - r} Z"/>`;
const ondas = (x0, x1, y, a = 3, passo = 12) => {
  const h = passo / 2, n = Math.floor((x1 - x0) / h);
  let d = `M${x0},${y} q${h / 2},${-a} ${h},0`;
  for (let i = 1; i < n; i++) d += ` t${h},0`;
  return fino(d, 1.6);
};
const chuva = (x0, x1, y0, y1, passo = 8) => { let d = ''; for (let x = x0; x <= x1; x += passo) d += `M${x},${y0} L${x - 4},${y1} `; return fino(d, 1.5); };

// ---- vegetação ----
const arvore = (x, y, h, r) => `<path d="M${x},${y} V${f(y - h + 1.5 * r)}"/><ellipse cx="${x}" cy="${f(y - h + 0.75 * r)}" rx="${r}" ry="${f(0.75 * r)}"/>`;
const torta = (x, y, h) => fino(`M${x},${y} Q${x - 7},${f(y - h * 0.5)} ${x + 2},${f(y - h + 6)} M${f(x - 3.5)},${f(y - h * 0.45)} L${x - 9},${f(y - h * 0.6)}`, 2.2) + `<ellipse cx="${x + 2}" cy="${f(y - h + 2)}" rx="12" ry="4.5" stroke-width="1.8"/>`;
const seca = (x, y, h) => fino(`M${x},${y} V${f(y - h * 0.5)} L${f(x - h * 0.32)},${f(y - h)} M${x},${f(y - h * 0.5)} L${f(x + h * 0.28)},${f(y - h * 0.95)} M${x},${f(y - h * 0.5)} L${f(x + 2)},${f(y - h * 0.9)} M${f(x - h * 0.17)},${f(y - h * 0.77)} L${f(x - h * 0.34)},${f(y - h * 0.74)} M${f(x + h * 0.15)},${f(y - h * 0.74)} L${f(x + h * 0.32)},${f(y - h * 0.68)}`, 1.8);
const conifera = (x, y, h, w) => `<path d="M${x},${y} V${f(y - h * 0.15)}"/><path stroke-width="2" d="M${f(x - w / 2)},${f(y - h * 0.15)} L${f(x - w * 0.2)},${f(y - h * 0.47)} L${f(x - w * 0.36)},${f(y - h * 0.47)} L${x},${y - h} L${f(x + w * 0.36)},${f(y - h * 0.47)} L${f(x + w * 0.2)},${f(y - h * 0.47)} L${f(x + w / 2)},${f(y - h * 0.15)} Z"/>`;
const araucaria = (x, y, h) => fino(`M${x},${y} V${y - h + 7}`, 2.4) + fino(`M${x - 20},${y - h} Q${x},${y - h + 15} ${x + 20},${y - h} M${x - 20},${y - h} l-3,-5 M${x + 20},${y - h} l3,-5 M${x - 10},${y - h + 5} l-2,-6 M${x + 10},${y - h + 5} l2,-6 M${x},${y - h + 7} v-6 M${x - 12},${y - h + 20} Q${x},${y - h + 26} ${x + 12},${y - h + 20}`, 2);
const cacto = (x, y, h) => fino(`M${x},${y} V${y - h} M${x},${f(y - h * 0.45)} H${x - 8} V${f(y - h * 0.8)} M${x},${f(y - h * 0.6)} H${x + 8} V${f(y - h * 0.92)}`, 3.2);
const capim = (x, y, s = 1) => fino(`M${f(x - 4 * s)},${y} L${f(x - 6 * s)},${f(y - 7 * s)} M${x},${y} L${x},${f(y - 9 * s)} M${f(x + 4 * s)},${y} L${f(x + 6 * s)},${f(y - 7 * s)}`, 1.4);
const acacia = (x, y, h) => fino(`M${x},${y} V${f(y - h * 0.5)} L${x - 10},${y - h + 6} M${x},${f(y - h * 0.5)} L${x + 12},${y - h + 6}`, 2.2) + `<path stroke-width="2" d="M${x - 32},${y - h + 6} Q${x - 26},${y - h - 5} ${x},${y - h - 5} Q${x + 28},${y - h - 5} ${x + 34},${y - h + 6} Z"/>`;
const mangue = (x, y, h) => fino(`M${x},${y - 30} V${y - h + 10} M${x},${y - 30} Q${x - 10},${y - 26} ${x - 16},${y} M${x},${y - 30} Q${x - 3},${y - 18} ${x - 5},${y} M${x},${y - 30} Q${x + 4},${y - 18} ${x + 6},${y} M${x},${y - 30} Q${x + 12},${y - 26} ${x + 17},${y}`, 1.8) + `<ellipse cx="${x}" cy="${y - h + 5}" rx="18" ry="11"/>`;

// ---- cartografia ----
const rosa = (cx, cy, R, r2, ri) => {
  const P = (ang, r) => `${f(cx + r * Math.cos(ang * Math.PI / 180))},${f(cy + r * Math.sin(ang * Math.PI / 180))}`;
  const out = []; let ch = '';
  for (let k = 0; k < 8; k++) { const a = -90 + 45 * k, tip = P(a, k % 2 ? r2 : R), inn = P(a + 22.5, ri); out.push(tip, inn); ch += `M${cx},${cy} L${tip} L${inn} Z `; }
  return `<path d="M${out.join(' L')} Z"/>` + cheio(ch);
};

// ---- contornos simplificados (lon, lat), traçados à mão para fins didáticos ----
const AM_SUL = [[-77, 8.5], [-72, 12], [-63, 10.5], [-60, 8.5], [-52, 5], [-50, 0], [-44, -2.5], [-35, -5], [-39, -13], [-41, -22], [-48, -26], [-53, -34], [-57, -36], [-58, -38.5], [-62, -39], [-65, -42], [-68, -50], [-69, -52], [-68, -55], [-72, -54], [-75, -50], [-74, -42], [-73, -37], [-71, -30], [-70, -18], [-76, -14], [-81, -6], [-80, -2], [-79, 1], [-77.5, 4]];
const AM_NORTE = [[-77, 8.5], [-83, 10.5], [-83.5, 15], [-88, 16], [-88, 21.5], [-91, 18.7], [-94, 18.5], [-97.5, 22], [-97.5, 26], [-94, 29.5], [-89, 30], [-84, 30], [-82.5, 27.5], [-81, 25], [-80, 27], [-81, 31], [-76, 35], [-74, 40], [-70, 42], [-66, 44.5], [-61, 46], [-56, 52], [-61, 56], [-64, 60], [-78, 62.5], [-78, 58], [-80, 52], [-87, 55.5], [-94, 59], [-90, 64], [-82, 68], [-95, 68], [-110, 68], [-125, 70], [-140, 69.5], [-157, 71], [-166, 68], [-163, 64], [-166, 61], [-158, 58], [-163, 55], [-152, 58], [-146, 60.5], [-138, 59], [-131, 55], [-128, 51], [-124, 48], [-124, 42], [-122.5, 37.5], [-118, 34], [-117, 32.5], [-114, 27], [-110, 23], [-112.5, 28], [-114.5, 31.5], [-111, 27], [-106, 23], [-105, 20], [-100, 17], [-94, 16], [-92, 14.5], [-88, 13.3], [-86, 11.5], [-85.7, 10], [-83.5, 8.5], [-80, 7.3]];
const GROENLANDIA = [[-73, 78], [-60, 82], [-32, 83.5], [-20, 81], [-18, 75], [-22, 70], [-32, 68], [-40, 65], [-43, 60], [-48, 61], [-52, 65], [-54, 69], [-58, 75], [-68, 76.5]];
const AFRICA = [[-5.9, 35.8], [10, 37], [11, 33], [15, 32], [19, 30.5], [25, 32], [32.3, 31.3], [32.5, 29.9], [33.5, 27.5], [35.5, 23.8], [37.3, 21], [39, 16], [43.2, 11.6], [51.2, 11.8], [51, 10], [48, 5], [42, -1], [40, -5], [40, -11], [41, -15], [36, -19], [35, -24], [33, -26], [32.5, -28.5], [28, -33], [22, -34.5], [18.5, -34.3], [17.5, -30], [15, -27], [14.5, -23], [12, -17], [13.5, -11], [12.3, -6], [9, -1], [9.5, 4], [6, 4.3], [3, 6.3], [-2, 4.8], [-7.5, 4.4], [-11, 7], [-13, 9], [-17, 14.7], [-16, 19], [-17, 21], [-13, 27.5], [-9.8, 30], [-9.5, 32], [-6.8, 34]];
const MADAGASCAR = [[49.5, -12], [50.5, -15.5], [48, -25], [45, -25.5], [43.5, -22], [44.3, -16.5], [47, -14.5]];
const EUROPA = [[29, 41.2], [26.2, 40.6], [24, 38], [22, 36.5], [21, 39], [19.5, 41.5], [16, 43.5], [13.7, 45.6], [12.3, 45], [13.5, 43.5], [16, 41.5], [18.5, 40], [17, 39], [16, 38], [15.7, 40], [12.5, 41.8], [10.5, 43.5], [9, 44.4], [7, 43.6], [4, 43.5], [3.2, 42], [0, 39.5], [-0.8, 37.6], [-2, 36.7], [-5.6, 36], [-6.3, 36.8], [-8.9, 37], [-9.5, 38.8], [-8.8, 42.5], [-8, 43.7], [-1.8, 43.4], [-1.2, 46], [-4.5, 47.8], [-1.5, 48.7], [1.5, 50], [3, 51.2], [4.5, 52.5], [8.5, 53.5], [8, 56.8], [10.5, 57.7], [10.5, 56], [12, 54.5], [14, 54], [19.5, 54.5], [21, 56], [24, 57.5], [24, 59.4], [28, 59.8], [22.5, 60], [21.5, 61], [25, 65], [22, 65.8], [19, 63.5], [17, 61.5], [19, 59.5], [16.5, 56.5], [13, 55.5], [11, 59], [8, 58], [5.5, 59], [5, 62], [10, 64], [14, 67.5], [18, 69.5], [25, 71], [31, 70], [41, 67], [44, 68.5], [53, 68.5], [60, 69.5], [66, 69], [60, 62], [59, 55], [53, 51], [51.8, 47], [48, 45.5], [47, 44.5], [44, 43], [41.6, 41.6], [39.7, 43.6], [37.5, 44.8], [36.5, 45.3], [34, 44.4], [32.5, 45.4], [30.7, 46.5], [29.7, 45.2], [28, 43.2]];
const GRA_BRETANHA = [[-5.7, 50.1], [1.4, 51.2], [1.7, 52.7], [-0.2, 53.6], [-1.6, 55.6], [-2, 57.6], [-3.3, 58.6], [-5, 58.6], [-6, 56.8], [-4.8, 55], [-3, 54], [-4.6, 53.3], [-4.3, 52.2], [-5.2, 51.8], [-3, 51.4], [-4.5, 51]];
const IRLANDA = [[-6, 52.2], [-6, 54], [-7.5, 55.3], [-10, 54.2], [-10, 51.7], [-8, 51.6]];
const ISLANDIA = [[-24, 65.5], [-22, 66.4], [-15, 66.5], [-13.5, 65], [-18, 63.4], [-22, 63.8]];
const ASIA = [[66, 69], [73, 72], [80, 73], [87, 75], [104, 77.7], [113, 73.5], [130, 71], [140, 72.5], [150, 71], [160, 69.5], [170, 70], [180, 69], [180, 65], [178, 64.5], [173, 61], [163, 60], [163, 58], [156.5, 51], [156, 57], [150, 59.5], [142, 59], [137, 54], [140.5, 52], [142, 46], [138, 45], [135, 43], [131, 42.6], [129.5, 41], [129.4, 36], [126.5, 34.5], [126, 37.5], [125, 39.5], [121.5, 40], [119, 39], [117.5, 38.5], [122.5, 37.3], [120, 35], [121.8, 31], [122, 29.5], [119.5, 25.5], [116, 22.8], [113.5, 22.2], [110, 21], [108, 21.5], [106.5, 20], [106, 18], [108.8, 15], [109, 11.5], [105, 8.6], [105, 10.5], [103, 10.5], [100, 13.5], [99.5, 10], [100.5, 7], [103.5, 4], [103.5, 1.4], [101, 2.8], [100.3, 5.5], [98.5, 8], [98.3, 13], [97.7, 16.5], [94.5, 16], [94, 19], [92, 21.5], [90, 22], [86.5, 20.5], [85, 19.3], [80.3, 15.5], [80, 10.3], [77.5, 8], [76.5, 9.5], [73, 17], [72.8, 20.5], [70, 22.5], [68.5, 23.5], [66.5, 25.4], [61.5, 25.2], [57.5, 25.8], [57, 27], [54, 26.8], [51, 28.8], [50.5, 30], [48.5, 30], [48.5, 29.5], [50, 26.5], [51.5, 24.2], [54, 24.2], [56.3, 26.3], [56.5, 24.5], [59.8, 22.5], [55.5, 17.5], [52, 16], [45, 13], [43.3, 12.7], [42.5, 15.5], [39, 21.5], [36, 26.5], [35, 29.5], [34.3, 27.8], [32.5, 29.9], [32.3, 31.3], [34.5, 31.5], [35, 33], [35.9, 35.5], [36, 36.7], [34.5, 36.8], [32, 36.2], [30, 36.3], [28, 36.7], [27.2, 38.5], [26.2, 39.5], [26.6, 40.3], [29, 41.2], [31.5, 41.2], [35, 42], [38, 41], [41.6, 41.6], [44, 43], [47, 44.5], [47.5, 43], [49.5, 40.5], [49, 38.3], [51, 36.7], [54, 37], [53.5, 40], [52.8, 41.5], [51.5, 44.5], [53, 46.5], [51.8, 47], [53, 51], [59, 55], [60, 62]];
const JAPAO = [[130.2, 31.3], [131.5, 32.5], [132, 34], [135, 33.5], [137, 34.6], [140, 35], [141, 38], [141.5, 41.2], [140, 40.8], [139.8, 38.2], [137, 37], [133, 35.5], [130.9, 34.2], [129.7, 33]];
const HOKKAIDO = [[140, 41.8], [141, 43], [141.7, 45.4], [145.5, 43.3], [143.5, 42], [141, 42.5]];
const SRI_LANKA = [[80, 9.8], [81.8, 7.5], [81, 6], [80, 6.3]];
const SUMATRA = [[95.3, 5.5], [98, 4], [104, -1], [106, -5.8], [102, -4], [98.5, 0], [97, 2]];
const BORNEU = [[109, 1.5], [111, -3], [116, -4], [116.5, -1], [119, 1], [117.5, 4], [119, 5.3], [117, 7], [115, 5], [113, 3], [111, 1.8]];
const JAVA = [[105.5, -6.5], [108, -6.3], [112, -6.8], [114.5, -7.8], [110, -8.1], [106, -7.4]];
const LUZON = [[120, 18.5], [122.3, 18.5], [122, 16], [124, 13], [120.6, 14], [120, 16]];
const MINDANAO = [[122, 7], [125.5, 9.8], [126.5, 7], [125, 5.8], [122, 6.8]];
const AUSTRALIA = [[113.5, -22], [114, -26.5], [115, -34], [118, -35], [123, -34], [129, -31.6], [134, -32.5], [135.7, -35], [138, -35.6], [140, -37.8], [144, -38.3], [146.3, -39], [150, -37.5], [151.3, -33.8], [153.5, -28.5], [153, -25], [150.8, -22.5], [146, -18.9], [145.4, -14.5], [143.5, -14], [142.5, -10.7], [141.6, -12.8], [141.5, -17.5], [140.8, -17.4], [139, -17], [136, -15.5], [136.8, -12.2], [132.5, -11.5], [131, -12.2], [129.5, -15], [126.5, -14], [122.5, -17], [121, -19.5], [117, -20.6]];
const TASMANIA = [[144.7, -40.7], [148.3, -40.9], [148, -43.2], [146, -43.6], [145.2, -42.2]];
const NZ_NORTE = [[172.7, -34.4], [174.8, -36.8], [178.5, -37.7], [176.9, -39.6], [174.9, -41.4], [174.6, -39.9], [173.8, -39.2], [174.6, -36.8]];
const NZ_SUL = [[172.7, -40.5], [174.3, -41.7], [173, -43.9], [171.2, -44.4], [169, -46.6], [166.5, -46], [168, -44.2], [171, -42]];
const NOVA_GUINE = [[131, -1], [134, -3.5], [138, -1.5], [141, -2.6], [146, -5], [147.5, -6], [150.5, -10.5], [147, -10], [143, -9], [141, -9.2], [138.5, -8.3], [136, -4.5], [132.5, -4], [132, -2.5]];
const ANTARTIDA = [[-57, -63.3], [-62, -65], [-66, -68], [-68, -71], [-75, -73], [-90, -72.5], [-100, -73], [-110, -74.5], [-125, -74], [-140, -75], [-150, -77], [-158, -78], [-165, -78.3], [180, -78], [170, -77], [165, -74], [170, -71.5], [160, -69.5], [150, -68.5], [140, -66.7], [120, -66.5], [100, -66], [88, -66.5], [75, -69.5], [70, -68], [60, -67], [45, -67.5], [40, -69], [30, -70], [15, -70], [0, -70.5], [-10, -71], [-20, -74], [-30, -77], [-45, -78], [-60, -75], [-61, -70], [-60, -67], [-58, -64.5]];
// Brasil: contorno e divisas entre regiões, simplificados
const BRASIL = [[-51.6, 4.4], [-50.8, 2.5], [-50, 0.8], [-48.5, -1], [-46, -1.1], [-44.3, -2.5], [-41.8, -2.8], [-39.5, -2.9], [-37.3, -4.7], [-35.2, -5.4], [-34.8, -7.2], [-35.7, -9.5], [-37.2, -11], [-38.5, -13], [-39, -15], [-39.2, -17.5], [-39.7, -18.3], [-40.5, -21], [-41.9, -22.9], [-43.2, -23], [-45, -23.6], [-48, -25.2], [-48.6, -28.3], [-50, -29.5], [-51, -31], [-53.4, -33.7], [-56, -31], [-57.6, -30.2], [-56, -28.2], [-53.8, -27], [-54.6, -25.6], [-54.3, -24.1], [-55.7, -22.6], [-57.8, -22.1], [-58, -20], [-57.5, -18], [-58.3, -16.3], [-60, -15.5], [-60.5, -13.7], [-62, -13.5], [-65, -12], [-65.4, -9.7], [-69.5, -11], [-70.6, -11], [-70.5, -9.5], [-72.9, -9], [-73.9, -7.3], [-73, -4.5], [-70, -4.2], [-69.4, -1.1], [-70, -0.1], [-69.5, 1], [-66.8, 1.2], [-64, 2.3], [-64.5, 4], [-60.7, 5.2], [-59.5, 3.5], [-59.8, 1.3], [-58, 1.5], [-56, 1.9], [-54, 2.2]];
const DIVISAS_BR = [
  [[-46, -1.1], [-47.5, -5.5], [-46.5, -9], [-45.9, -10.5], [-46.2, -13]],                                   // Norte | Nordeste
  [[-46.2, -13], [-50.2, -12.8], [-50.5, -9.8], [-56.5, -9.3], [-58.3, -7.4], [-61.5, -8], [-60.5, -13.7]],   // Norte | Centro-Oeste
  [[-46.2, -13], [-45.9, -15.1]],                                                                            // Nordeste | Centro-Oeste
  [[-45.9, -15.1], [-44.2, -14.3], [-41.5, -15.2], [-40.2, -17.4], [-39.7, -18.3]],                           // Nordeste | Sudeste
  [[-45.9, -15.1], [-47.4, -16], [-48, -18.4], [-50.6, -19.6], [-51.1, -20.3], [-53, -22.6]],                 // Centro-Oeste | Sudeste
  [[-53, -22.6], [-54.3, -24.1]],                                                                            // Centro-Oeste | Sul
  [[-53, -22.6], [-50, -22.9], [-49.3, -24.6], [-48, -25.2]],                                                // Sudeste | Sul
];
// encaixa polígonos (lon, lat) numa caixa W×H com margem; proj = fator de encolhimento da longitude (cos da latitude média)
const encaixe = (polis, W, H, cosLat = 1, m = 5) => {
  const pr = ([lo, la]) => [lo * cosLat, -la];
  const todos = polis.flat().map(pr), xs = todos.map(p => p[0]), ys = todos.map(p => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), sx = Math.max(...xs) - x0, sy = Math.max(...ys) - y0;
  const s = Math.min((W - 2 * m) / sx, (H - 2 * m) / sy), ox = (W - sx * s) / 2, oy = (H - sy * s) / 2;
  return ll => { const [x, y] = pr(ll); return [ox + (x - x0) * s, oy + (y - y0) * s]; };
};
const contorno = (polis, W, H, cosLat = 1) => {
  const P = encaixe(polis, W, H, cosLat);
  return `<path stroke-width="2" d="${polis.map(pl => suave(pl.map(P), true, 10)).join(' ')}"/>`;
};

// ---- formas que repetem com pequenas variações ----
const piramide = (id, nome, larg) => {
  let s = '';
  larg.forEach((w, i) => { const y = 152 - 15 * (i + 1); s += `<rect x="${110 - w}" y="${y}" width="${w}" height="15" stroke-width="1.8"/><rect x="110" y="${y}" width="${w}" height="15" stroke-width="1.8"/>`; });
  return [id, nome, 220, 184, s + `<path d="M110,26 V158 M18,152 H202"/>` + t14(56, 14, 'Homens') + t14(164, 14, 'Mulheres') + t14(110, 166, '%')];
};
const brisa = dia => {
  const vai = dia ? 1 : -1;   // dia: brisa do mar para a terra junto ao chão
  return `<path d="M4,100 H110 L116,106 H216"/>` + fino('M10,108 L4,114 M30,108 L24,114 M50,108 L44,114 M70,108 L64,114 M90,108 L84,114', 1.4) + ondas(122, 214, 112) +
    (dia ? sol(28, 26, 9) : lua(28, 26, 10)) +
    (vai > 0 ? seta(186, 86, 66, 86) + seta(56, 82, 56, 42) + seta(66, 34, 176, 34) + seta(186, 40, 186, 80)
      : seta(66, 86, 186, 86) + seta(186, 82, 186, 42) + seta(176, 34, 66, 34) + seta(56, 40, 56, 80)) +
    t14(60, 124, 'terra') + t14(170, 124, 'mar');
};
const frente = tipo => {   // símbolos de frente (convenção de carta sinótica)
  let s = '<path d="M8,40 H212"/>';
  for (let i = 0; i < 5; i++) {
    const x = 30 + 40 * i, tri = `M${x - 10},40 L${x},26 L${x + 10},40 Z`, semi = `M${x - 10},40 A10,10 0 0,1 ${x + 10},40 Z`, semiB = `M${x - 10},40 A10,10 0 0,0 ${x + 10},40 Z`;
    if (tipo === 'fria') s += cheio(tri);
    else if (tipo === 'quente') s += cheio(semi);
    else if (tipo === 'estac') s += cheio(i % 2 ? semiB : tri);
    else s += cheio(i % 2 ? semi : tri);
  }
  return s;
};

// ---- formas maiores montadas por função ----
const curvasNivel = () => {
  const cx = 118, cy = 76, base = [110, 92, 100, 80, 104, 88, 98, 84];
  let s = '';
  [1, 0.75, 0.5, 0.25].forEach((k, j) => {
    const pts = base.map((r, i) => { const a = i * Math.PI / 4; return [cx + k * r * Math.cos(a), cy + 0.62 * k * r * Math.sin(a)]; });
    s += `<path stroke-width="${j ? 1.8 : 2.2}" d="${suave(pts)}"/>` + t14(f(j % 2 ? cx - k * 110 + 14 : cx + k * 110 - 14), cy, String(100 * (j + 1)));
  });
  return s + `<path d="M${cx - 4},${cy - 6} L${cx},${cy - 12} L${cx + 4},${cy - 6} Z" fill="#C" stroke-width="1"/>`;
};
const perfilTopo = () => {
  let s = '';
  [[70, 45], [70, 30], [70, 15], [150, 26], [150, 13]].forEach(([cx, rx]) => { s += `<ellipse cx="${cx}" cy="50" rx="${rx}" ry="${f(rx * 0.55)}" stroke-width="1.8"/>`; });
  s += fino('M14,50 H192', 1.4) + t14(7, 50, 'A') + t14(200, 50, 'B');
  const lv = k => 190 - 18 * k, xs = [[25, 1], [40, 2], [55, 3], [85, 3], [100, 2], [115, 1], [124, 1], [137, 2], [163, 2], [176, 1]];
  let d = ''; xs.forEach(([x, k]) => { d += `M${x},50 V${lv(k)} `; });
  s += trac(d, 1.1, '3 3');
  const prof = [[14, 185], [25, lv(1)], [40, lv(2)], [55, lv(3)], [70, lv(3.6)], [85, lv(3)], [100, lv(2)], [115, lv(1)], [119.5, lv(0.8)], [124, lv(1)], [137, lv(2)], [150, lv(2.5)], [163, lv(2)], [176, lv(1)], [192, 186]];
  return s + `<path d="${suave(prof, false)}"/>` + fino('M14,112 V194 H194', 1.6) + ['1', '2', '3'].map((n, i) => fino(`M11,${lv(i + 1)} H17`, 1.4)).join('');
};
const globoCoord = () => {
  const cx = 85, cy = 92, r = 70, fi = 35 * Math.PI / 180, px = f(cx + 40 * Math.cos(fi)), py = f(cy - r * Math.sin(fi));
  const ang = Math.atan2(py - cy, px - cx);
  return `<circle cx="${cx}" cy="${cy}" r="${r}"/>` + fino(`M${cx - r},${cy} H${cx + r}`, 2) + fino(`M${cx},${cy - r} V${cy + r}`, 1.6) +
    fino(`M${cx},${cy - r} A40,${r} 0 0,1 ${cx},${cy + r}`, 1.6) + trac(`M${cx},${cy} L${px},${py} M${cx},${cy} H${cx + 40}`, 1.4, '4 3') +
    fino(`M${cx + 22},${cy} A22,22 0 0,0 ${f(cx + 22 * Math.cos(ang))},${f(cy + 22 * Math.sin(ang))}`, 1.6) +
    ponto(px, py, 4) + ponto(cx, cy, 2.5) + T(px + 10, py - 12, 'P', 16) + T(cx + 32, cy - 13, 'φ', 16) +
    seta(cx + 2, cy + 12, cx + 40, cy + 12, 1.6, 8) + T(cx + 21, cy + 25, 'λ', 16) + t14(cx, 12, 'N') + t14(cx, 174, 'S');
};
const paralelos = () => {
  const cx = 66, cy = 82, r = 62, lin = [[66.56, 'Círc. Polar Ártico', 1], [23.44, 'Trópico de Câncer', 1], [0, 'Equador', 0], [-23.44, 'Trópico de Capricórnio', 1], [-66.56, 'Círc. Polar Antártico', 1]];
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  lin.forEach(([lat, nome, tr]) => {
    const dy = r * Math.sin(lat * Math.PI / 180), y = f(cy - dy), hw = f(Math.sqrt(r * r - dy * dy));
    s += tr ? trac(`M${f(cx - hw)},${y} H${f(cx + hw)}`, 1.6) : fino(`M${cx - r},${y} H${cx + r}`, 2.4);
    s += fino(`M${f(cx + hw + 3)},${y} H134`, 1) + TS(138, y, nome);
  });
  return s;
};
const zonasTermicas = () => {
  const cx = 88, cy = 90, r = 80, lat = [66.56, 23.44, -23.44, -66.56];
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  lat.forEach(l => { const dy = r * Math.sin(l * Math.PI / 180), hw = Math.sqrt(r * r - dy * dy); s += trac(`M${f(cx - hw)},${f(cy - dy)} H${f(cx + hw)}`, 1.6); });
  s += fino(`M${cx - r},${cy} H${cx + r}`, 1.2);
  const yb = l => cy - r * Math.sin(l * Math.PI / 180);
  const faixas = [[90, 66.56, 'Polar'], [66.56, 23.44, 'Temperada'], [23.44, -23.44, 'Tropical'], [-23.44, -66.56, 'Temperada'], [-66.56, -90, 'Polar']];
  faixas.forEach(([a, b, nome]) => {
    const ym = (yb(a) + yb(b)) / 2, ty = Math.max(12, Math.min(168, ym)), xm = cx + Math.sqrt(Math.max(0, r * r - (ym - cy) ** 2)) * 0.55;
    s += fino(`M${f(xm)},${f(ym)} L178,${f(ty)}`, 1) + ponto(xm, ym, 2) + TS(182, f(ty), nome);
  });
  return s;
};
const circulacao = () => {
  const cx = 80, cy = 110, r = 66;
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}"/>` + fino(`M${cx - r},${cy} H${cx + r}`, 1.8);
  [30, 60, -30, -60].forEach(l => { const dy = r * Math.sin(l * Math.PI / 180), hw = Math.sqrt(r * r - dy * dy); s += trac(`M${f(cx - hw)},${f(cy - dy)} H${f(cx + hw)}`, 1.3, '4 3'); });
  const celulas = [[15, 'H', 1], [45, 'F', 0], [75, 'P', 1]];
  for (const hemi of [1, -1]) for (const [lat, nome, hadley] of celulas) {
    const th = -hemi * lat, rad = th * Math.PI / 180, x = cx + 90 * Math.cos(rad), y = cy + 90 * Math.sin(rad), rot = th + 90, R = rot * Math.PI / 180;
    const hx = x - (-12) * Math.sin(R), hy = y + (-12) * Math.cos(R);
    const dir = hemi > 0 ? (hadley ? rot + 180 : rot) : (hadley ? rot : rot + 180);
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="18" ry="12" stroke-width="1.8" transform="rotate(${f(rot)} ${f(x)} ${f(y)})"/>` + head(f(hx), f(hy), f(dir), 9) + t14(f(x), f(y), nome);
  }
  return s;
};
const estacoes = () => {
  let s = `<ellipse cx="130" cy="80" rx="110" ry="52" stroke-width="1.6" stroke-dasharray="5 4"/>` + `<circle cx="130" cy="80" r="14" fill="#C" fill-opacity=".22"/>` + sol(130, 80, 14).replace(/<circle[^>]*\/>/, '');
  [[20, 80], [240, 80], [130, 28], [130, 132]].forEach(([x, y]) => {
    s += `<circle cx="${x}" cy="${y}" r="10" stroke-width="2"/>` + fino(`M${f(x - 6.3)},${f(y + 14.7)} L${f(x + 6.3)},${f(y - 14.7)}`, 1.6) + fino(`M${f(x - 9.2)},${f(y - 3.9)} L${f(x + 9.2)},${f(y + 3.9)}`, 1.2) +
      `<path d="M${x},${y - 10} A10,10 0 0,1 ${x},${y + 10} Z" fill="#C" fill-opacity=".35" stroke="none"/>`;
  });
  return s + head(207.8, 43.2, -154.7, 11) + head(52.2, 116.8, 25.3, 11);
};
const rotacao = () => {
  const cx = 140, cy = 66, r = 50;
  let hach = ''; for (let x = 148; x < cx + r; x += 8) { const h = Math.sqrt(r * r - (x - cx) ** 2); hach += `M${x},${f(cy - h)} V${f(cy + h)} `; }
  return sol(26, 66, 13) + seta(48, 40, 84, 40, 1.6, 9) + seta(48, 66, 84, 66, 1.6, 9) + seta(48, 92, 84, 92, 1.6, 9) +
    `<circle cx="${cx}" cy="${cy}" r="${r}"/>` + fino(`M${cx},${cy - r} V${cy + r}`, 1.6) + fino(hach, 1.2) + setaQ(112, 8, 140, -2, 170, 8, 1.8, 10) + t14(115, 66, 'dia') + t14(cx + 32, cy + 64, 'noite');
};
const aquiferoConf = () => {
  const sup = x => x < 60 ? 30 + (x - 4) * 14 / 56 : 44 + (x - 60) * 8 / 176, l2 = x => 38 + (x - 24) * 82 / 212, l3 = x => 62 + (x - 4) * 88 / 232;
  let s = `<path d="M4,30 L60,44 L236,52"/>` + `<path d="M24,${f(sup(24))} L236,${f(l2(236))}"/>` + `<path d="M4,62 L236,150"/>`;
  let hach = '', pts = '';
  for (let x = 72; x < 230; x += 12) { const a = sup(x) + 3, b = l2(x) - 3; if (b - a > 6) hach += `M${x},${f(a)} L${x + 5},${f(b)} `; }
  for (let x = 14; x < 232; x += 13) { const a = Math.max(l2(x), sup(x)), b = l3(x); for (let y = a + 6; y < b - 3; y += 9) if (Math.abs(x - 190) > 9) pts += ponto(x + ((y | 0) % 2) * 3, y, 1.4); }
  for (let x = 12; x < 236; x += 14) { const a = l3(x) + 4; hach += `M${x},${f(a + 8)} L${x + 6},${f(a)} `; }
  s += fino(hach, 1) + pts + trac('M18,32 L236,38', 1.6, '6 4') + fino('M186,34 V108 M194,34 V108', 2) + fino('M190,34 Q184,18 172,26 M190,34 Q196,18 208,26 M190,34 V18', 1.6) + chuva(16, 44, 6, 18, 7);
  return s;
};

const SECOES = [
  ['Cartografia', [
    ['geo-rosa-ventos', 'Rosa dos ventos', 140, 144, `<circle cx="70" cy="72" r="30" stroke-width="1.4"/>` + rosa(70, 72, 42, 24, 8) + T(70, 14, 'N', 18) + T(70, 131, 'S', 18) + T(128, 72, 'L', 18) + T(12, 72, 'O', 18)],
    ['geo-rosa-colaterais', 'Rosa dos ventos (colaterais)', 172, 172, `<circle cx="86" cy="86" r="36" stroke-width="1.4"/>` + rosa(86, 86, 50, 34, 9) + T(86, 17, 'N', 18) + T(86, 156, 'S', 18) + T(156, 86, 'L', 18) + T(16, 86, 'O', 18) + t14(130, 42, 'NE') + t14(130, 130, 'SE') + t14(42, 130, 'SO') + t14(42, 42, 'NO')],
    ['geo-norte', 'Seta do norte', 60, 96, `<path d="M30,30 L44,82 L30,71 L16,82 Z"/>` + cheio('M30,30 L30,71 L16,82 Z') + T(30, 15, 'N', 22)],
    ['geo-escala-grafica', 'Escala gráfica', 232, 56, `<rect x="20" y="30" width="180" height="10"/>` + cheio('M20,30 H65 V40 H20 Z M110,30 H155 V40 H110 Z') + fino('M65,30 V44 M110,30 V44 M155,30 V44 M20,30 V44 M200,30 V44', 1.6) + t14(20, 18, '0') + t14(65, 18, '1') + t14(110, 18, '2') + t14(155, 18, '3') + t14(204, 18, '4 km')],
    ['geo-escala-num', 'Escala numérica', 190, 56, `<rect x="6" y="8" width="178" height="40" rx="6"/>` + T(95, 28, '1 : 50 000', 22)],
    ['geo-legenda', 'Legenda (quadro)', 160, 150, `<rect x="4" y="4" width="152" height="142" rx="6"/>` + T(80, 21, 'Legenda', 16) + fino('M14,34 H146', 1.2) +
      cheio('M16,44 H34 V56 H16 Z') + trac('M16,78 H34', 2.5, '4 3') + ponto(25, 102, 5) + cheio('M25,120 L33,134 H17 Z') +
      trac('M46,56 H144 M46,82 H144 M46,108 H144 M46,134 H144', 1, '2 4')],
    ['geo-elementos-mapa', 'Elementos do mapa (moldura)', 232, 172, `<rect x="4" y="4" width="224" height="164"/>` + T(116, 19, 'Título', 16) + fino('M4,32 H228', 1.6) + `<rect x="12" y="40" width="148" height="120" stroke-width="1.8"/>` +
      `<path stroke-width="1.8" d="${suave([[40, 60], [80, 52], [120, 66], [140, 100], [118, 140], [76, 146], [46, 126], [30, 90]])}"/>` + fino('M60,96 Q86,84 110,104', 1.2) +
      `<path d="M194,46 L202,74 L194,68 L186,74 Z"/>` + cheio('M194,46 V68 L186,74 Z') + t14(194, 86, 'N') +
      `<rect x="172" y="98" width="46" height="36" stroke-width="1.4"/>` + cheio('M177,104 H185 V110 H177 Z') + fino('M189,107 H213 M189,118 H213 M189,128 H213', 1) + ponto(181, 118, 3) + fino('M177,128 H185', 2) +
      `<rect x="170" y="146" width="50" height="6" stroke-width="1.4"/>` + cheio('M170,146 H195 V152 H170 Z')],
    ['geo-grade-coord', 'Coordenadas (paralelos e meridianos)', 226, 162,
      fino('M44,14 H204 M44,44 H204 M44,104 H204 M44,134 H204', 1.3) + fino('M44,74 H204', 2.6) +
      fino('M44,14 V134 M84,14 V134 M164,14 V134 M204,14 V134', 1.3) + fino('M124,14 V134', 2.6) +
      t14(20, 14, '60°N') + t14(20, 44, '30°N') + t14(20, 74, '0°') + t14(20, 104, '30°S') + t14(20, 134, '60°S') +
      t14(44, 152, '90°O') + t14(84, 152, '45°O') + t14(124, 152, '0°') + t14(164, 152, '45°L') + t14(204, 152, '90°L') + ponto(164, 44, 4.5) + T(176, 33, 'P', 16)],
    ['geo-globo-coord', 'Latitude e longitude no globo', 170, 191, "<g transform=\"translate(0.00 2.50)\">" + (globoCoord()) + "</g>"],
    ['geo-paralelos', 'Paralelos principais (trópicos e círculos polares)', 300, 164, paralelos()],
    ['geo-fusos', 'Fusos horários (esquema)', 240, 112, `<rect x="12" y="28" width="216" height="58"/>` + trac('M36,28 V86 M60,28 V86 M84,28 V86 M108,28 V86 M132,28 V86 M156,28 V86 M180,28 V86 M204,28 V86', 1.3, '4 3') + fino('M120,24 V92', 2.6) +
      ['−4', '−3', '−2', '−1', '0', '+1', '+2', '+3', '+4'].map((h, i) => t14(24 + 24 * i, 16, h)).join('') + t14(120, 103, 'Greenwich') + seta(140, 58, 200, 58, 1.6, 9) + seta(100, 58, 40, 58, 1.6, 9)],
    ['geo-proj-cilindrica', 'Projeção cilíndrica', 150, 160, `<ellipse cx="75" cy="20" rx="52" ry="10"/><path d="M23,20 V140 M127,20 V140"/><path d="M23,140 A52,10 0 0,0 127,140"/>` + trac('M23,140 A52,10 0 0,1 127,140', 1.4) +
      `<circle cx="75" cy="80" r="52" stroke-width="2"/>` + fino('M23,80 A52,9 0 0,0 127,80', 1.4) + fino('M75,28 A20,52 0 0,0 75,132', 1.2)],
    ['geo-proj-conica', 'Projeção cônica', 160, 160, `<path d="M27.6,100 L80,8 L132.4,100"/><path d="M27.6,100 A52.4,9 0 0,0 132.4,100"/>` + trac('M27.6,100 A52.4,9 0 0,1 132.4,100', 1.4) +
      `<circle cx="80" cy="105" r="48" stroke-width="2"/>` + trac('M38.3,81 A41.7,7 0 0,0 121.7,81', 1.4, '4 3') + fino('M32,105 A48,9 0 0,0 128,105', 1.2)],
    ['geo-proj-plana', 'Projeção plana (azimutal)', 160, 150, `<path d="M14,48 L46,30 H146 L114,48 Z"/>` + `<circle cx="80" cy="92" r="52" stroke-width="2"/>` + ponto(80, 40, 3.5) + fino('M28,92 A52,10 0 0,0 132,92', 1.2) + trac('M80,92 L80,40', 1.2, '3 3')],
    ['geo-curvas-nivel', 'Curvas de nível', 236, 152, curvasNivel()],
    ['geo-perfil-topo', 'Perfil topográfico (a partir das curvas)', 208, 200, perfilTopo()],
    ['geo-orientacao-sol', 'Orientação aproximada pelo nascer do Sol', 200, 149, "<g transform=\"translate(0.00 0.00)\">" + (`<circle cx="100" cy="50" r="9"/><path d="M100,59 V96 M66,72 H134 M100,96 L88,120 M100,96 L112,120"/>` + sol(172, 66, 10) + seta(136, 72, 156, 72, 1.6, 8) +
      T(100, 22, 'N', 16) + T(100, 133, 'S', 16) + T(172, 98, 'L', 16) + T(30, 72, 'O', 16)) + "</g>"],
  ]],
  ['Estrutura e dinâmica da Terra', [
    ['geo-camadas-terra', 'Camadas da Terra', 294, 180, `<circle cx="88" cy="90" r="82"/><circle cx="88" cy="90" r="76" stroke-width="1.6"/><circle cx="88" cy="90" r="46" stroke-width="2"/><circle cx="88" cy="90" r="22" fill="#C" fill-opacity=".3"/>` +
      fino('M139,29.5 L184,30 M148,74 L184,66 M121,99 L184,104 M96,95 L184,140', 1) + ponto(139, 29.5, 2.5) + ponto(148, 74, 2.5) + ponto(121, 99, 2.5) + ponto(96, 95, 2.5) +
      TS(188, 30, 'Crosta') + TS(188, 66, 'Manto') + TS(188, 104, 'Núcleo externo') + TS(188, 140, 'Núcleo interno')],
    ['geo-lim-divergente', 'Limite divergente (dorsal)', 220, 130, `<path d="M8,64 H96 L106,54 V88 H8 Z"/><path d="M114,54 L124,64 H212 V88 H114 Z"/>` +
      `<path d="M106,54 H114 V88 H106 Z" fill="#C" fill-opacity=".3" stroke="none"/>` + seta(110, 124, 110, 58, 2.5) + setaQ(104, 112, 60, 116, 30, 98, 1.8) + setaQ(116, 112, 160, 116, 190, 98, 1.8) + seta(80, 40, 30, 40) + seta(140, 40, 190, 40)],
    ['geo-lim-convergente', 'Limite convergente (subducção)', 230, 140, trac('M6,62 H116', 1.4, '6 4') + `<path d="M6,74 H112 Q138,78 160,130 M6,92 H104 Q126,96 142,134 M6,74 V92"/>` +
      `<path d="M120,74 Q150,62 170,58 L181,34 H189 L200,58 H226 V100 H175 Q155,98 138,90"/>` + trac('M154,112 Q172,80 185,38', 1.6, '4 3') + fino('M185,30 Q180,20 186,12 M185,30 Q192,22 190,12', 1.6) +
      seta(30, 50, 80, 50) + seta(222, 82, 200, 82, 1.8, 9)],
    ['geo-lim-transformante', 'Limite transformante (planta)', 190, 120, `<rect x="10" y="12" width="170" height="96" stroke-width="2"/>` + fino('M56,12 V60 M64,12 V60 M126,60 V108 M134,60 V108', 1.6) + `<path stroke-width="3" d="M64,60 H126"/>` + trac('M10,60 H56 M134,60 H180', 1.4) +
      seta(40, 36, 100, 36) + seta(150, 84, 90, 84)],
    ['geo-vulcao', 'Vulcão (corte)', 170, 168, `<path d="M4,128 H18 L68,42 Q80,50 92,42 L142,128 H166"/>` + `<ellipse cx="80" cy="150" rx="36" ry="12" fill="#C" fill-opacity=".3"/>` + cheio('M76,140 L78,46 L82,46 L84,140 Z') +
      fino('M80,38 V12 M74,36 L62,16 M86,36 L98,16', 1.8) + `<path stroke-width="4" d="M70,50 Q60,72 52,96"/>` + trac('M4,142 H40 M120,142 H166', 1.2)],
    ['geo-terremoto', 'Terremoto: hipocentro e epicentro', 220, 150, `<path d="M4,40 H216"/>` + fino('M10,40 L4,48 M30,40 L24,48 M150,40 L144,48 M170,40 L164,48 M190,40 L184,48 M210,40 L204,48', 1.2) + `<path d="M22,40 V26 L32,18 L42,26 V40"/>` +
      `<circle cx="100" cy="110" r="14" stroke-width="1.4" stroke-dasharray="4 3"/><circle cx="100" cy="110" r="26" stroke-width="1.4" stroke-dasharray="4 3"/><circle cx="100" cy="110" r="38" stroke-width="1.4" stroke-dasharray="4 3"/>` +
      ponto(100, 110, 5) + ponto(100, 40, 5) + trac('M100,46 V104', 1.4, '2 3') + t14(100, 22, 'epicentro') + t14(176, 110, 'hipocentro')],
    ['geo-falha', 'Falha geológica (normal)', 210, 130, `<path d="M6,30 H101.8 L130,126 H6 Z"/><path d="M107.6,50 H204 V126 H130"/>` + fino('M6,58 H110 M6,86 H118.2 M6,110 H125.3 M115.9,78 H204 M124.1,106 H204', 1.4) +
      trac('M6,72 H114.1 M120,92 H204', 1.4) + seta(140, 64, 148, 92, 1.8, 9) + seta(96, 96, 88, 68, 1.8, 9)],
    ['geo-dobras', 'Dobras (anticlinal e sinclinal)', 230, 120, [40, 60, 80].map(b => { let d = ''; for (let x = 30; x <= 200; x += 5) d += (x === 30 ? 'M' : ' L') + `${x},${f(b - 16 * Math.sin(2 * Math.PI * (x - 30) / 170))}`; return `<path stroke-width="2" d="${d}"/>`; }).join('') +
      seta(4, 60, 26, 60) + seta(226, 60, 204, 60) + t14(72, 10, 'anticlinal') + t14(158, 110, 'sinclinal')],
    ['geo-ciclo-rochas', 'Ciclo das rochas', 230, 186, `<rect x="67" y="8" width="96" height="32" rx="8"/><rect x="10" y="144" width="92" height="32" rx="8"/><rect x="126" y="144" width="100" height="32" rx="8"/>` +
      T(115, 24, 'Magmática', 16) + T(56, 160, 'Sedimentar', 16) + T(176, 160, 'Metamórfica', 16) + setaQ(78, 44, 44, 86, 50, 138) + seta(104, 160, 122, 160) + setaQ(180, 138, 188, 86, 154, 44)],
    ['geo-perfil-solo', 'Perfil do solo (horizontes)', 160, 190, `<rect x="30" y="22" width="100" height="164"/>` + fino('M30,38 H130 M30,76 H130 M30,118 H130 M30,156 H130', 1.6) +
      [40, 56, 72, 88, 104, 120].map(x => capim(x, 22, 0.9)).join('') + T(14, 30, 'O', 16) + T(14, 57, 'A', 16) + T(14, 97, 'B', 16) + T(14, 137, 'C', 16) + T(14, 171, 'R', 16) +
      [[44, 52], [66, 62], [92, 50], [114, 64], [56, 68], [102, 58]].map(([x, y]) => ponto(x, y, 1.6)).join('') + fino('M40,92 h8 M70,100 h8 M100,90 h8 M52,108 h8 M88,110 h8 M114,102 h8', 1.2) +
      [[44, 130, 5], [70, 140, 6], [98, 128, 4], [116, 144, 5], [56, 148, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" stroke-width="1.4"/>`).join('') + fino('M30,170 H130 M60,156 V170 M100,156 V170 M45,170 V186 M85,170 V186 M118,170 V186', 1.4)],
  ]],
  ['Relevo', [
    ['geo-planalto', 'Planalto', 220, 110, `<path d="M4,100 H30 Q44,98 52,70 L58,42 Q62,34 72,34 H94 Q100,28 106,34 H150 Q160,34 164,42 L172,72 Q178,98 196,100 H216"/>` + fino('M60,54 H162 M56,74 H170', 1.2) + seta(80, 18, 70, 30, 1.4, 8) + seta(140, 18, 150, 30, 1.4, 8)],
    ['geo-planicie', 'Planície', 220, 110, `<path d="M4,50 Q30,48 50,76 Q60,86 80,86 H190"/>` + ondas(190, 216, 88) + [[90, 94], [110, 98], [130, 93], [150, 97], [170, 94], [100, 102], [140, 103]].map(([x, y]) => ponto(x, y, 1.6)).join('') +
      seta(100, 52, 100, 74, 1.4, 8) + seta(130, 52, 130, 74, 1.4, 8) + seta(160, 52, 160, 74, 1.4, 8)],
    ['geo-depressao', 'Depressão (relativa e absoluta)', 220, 106, `<path d="M4,30 H30 L44,48 H86 L100,30 H124 L140,78 H176 L190,30 H216"/>` + trac('M4,60 H216', 1.4) + t14(65, 96, 'relativa') + t14(158, 96, 'absoluta')],
    ['geo-cordilheira', 'Cadeia de montanhas (cordilheira)', 230, 110, `<path d="M4,104 L30,60 L44,72 L74,18 L96,50 L112,36 L136,74 L158,30 L180,58 L196,46 L226,104"/>` + fino('M66,30 L71,36 L76,30 L82,34 M152,40 L157,46 L162,40 L166,44 M27,66 L32,70 L36,66', 1.6)],
    ['geo-chapada', 'Chapada e morro-testemunho', 220, 110, `<path d="M4,100 H20 L34,92 L42,40 H120 L128,92 L140,100 H160 L166,94 L172,64 H186 L192,94 L198,100 H216"/>` + fino('M41,56 H122 M38,74 H124 M171,74 H187', 1.2)],
    ['geo-vale-v', 'Vale fluvial (em V)', 160, 120, `<path d="M6,14 L70,100 Q80,108 90,100 L154,14"/>` + `<path d="M72,102 Q80,106 88,102 Z" fill="#C" fill-opacity=".35" stroke-width="1.4"/>` + fino('M30,34 l6,8 M124,40 l-6,8 M48,62 l6,8 M108,66 l-6,8', 1.2)],
    ['geo-vale-u', 'Vale glacial (em U)', 170, 120, `<path d="M6,14 Q20,16 24,30 Q30,100 85,104 Q140,100 146,30 Q150,16 164,14"/>` + fino('M40,90 Q85,108 130,90', 1.2)],
    ['geo-canion', 'Cânion', 200, 130, `<path d="M4,24 H50 V44 H56 V70 H62 V104 L70,112 Q100,118 130,112 L138,104 V70 H144 V44 H150 V24 H196"/>` + fino('M4,44 H50 M4,70 H56 M4,104 H62 M150,44 H196 M144,70 H196 M138,104 H196', 1.2) +
      `<path d="M74,112 Q100,117 126,112 Z" fill="#C" fill-opacity=".35" stroke-width="1.4"/>`],
    ['geo-formas-relevo', 'Formas de relevo (perfil)', 280, 132, `<path d="M4,108 L18,96 L40,16 L58,72 L70,58 L78,48 H144 Q150,48 154,60 L162,94 H198 L206,84 H276"/>` + t14(40, 122, 'montanha') + t14(112, 122, 'planalto') + t14(182, 122, 'depressão') + t14(246, 122, 'planície')],
    ['geo-falesia', 'Falésia e praia', 200, 130, `<path d="M4,30 H90 L96,40 L92,62 L100,80 L98,100 L108,104 Q140,112 196,116"/>` + fino('M4,50 H94 M4,70 H96 M4,90 H99', 1.2) + ondas(112, 196, 100) + ondas(132, 196, 88)],
  ]],
  ['Clima e atmosfera', [
    ['geo-zonas-termicas', 'Zonas térmicas da Terra', 254, 180, zonasTermicas()],
    ['geo-frente-fria', 'Frente fria (símbolo)', 220, 50, frente('fria')],
    ['geo-frente-quente', 'Frente quente (símbolo)', 220, 50, frente('quente')],
    ['geo-frente-estacionaria', 'Frente estacionária (símbolo)', 220, 56, frente('estac')],
    ['geo-frente-oclusa', 'Frente oclusa (símbolo)', 220, 50, frente('oclusa')],
    ['geo-frente-corte', 'Frente fria (corte)', 230, 130, `<path d="M4,118 H226"/><path d="M110,118 Q118,80 150,40"/>` + seta(16, 104, 90, 104) + t14(50, 84, 'ar frio') + t14(192, 100, 'ar quente') +
      setaQ(180, 84, 160, 70, 150, 50, 1.8) + nuvem(140, 24, 1.2) + chuva(118, 138, 42, 56, 7)],
    ['geo-alta-baixa', 'Alta e baixa pressão', 230, 110, `<circle cx="60" cy="55" r="34"/><circle cx="170" cy="55" r="34"/>` + T(60, 56, 'A', 30) + T(170, 56, 'B', 30) +
      seta(98, 55, 110, 55, 2, 9) + seta(22, 55, 10, 55, 2, 9) + seta(60, 17, 60, 5, 2, 9) + seta(60, 93, 60, 105, 2, 9) +
      seta(120, 55, 132, 55, 2, 9) + seta(220, 55, 208, 55, 2, 9) + seta(170, 5, 170, 17, 2, 9) + seta(170, 105, 170, 93, 2, 9)],
    ['geo-circulacao', 'Circulação geral da atmosfera (células)', 200, 220, circulacao()],
    ['geo-chuva-orografica', 'Chuva orográfica (de relevo)', 232, 157, "<g transform=\"translate(1.00 0.00)\">" + (`<path d="M4,130 H40 L110,36 L130,30 L150,40 L214,130 H226"/>` + nuvem(76, 30, 1.1) + chuva(62, 90, 44, 60, 7) +
      setaQ(10, 116, 50, 106, 82, 64) + setaQ(152, 46, 180, 66, 206, 98, 1.8) + t14(62, 142, 'barlavento') + t14(182, 142, 'sotavento')) + "</g>"],
    ['geo-chuva-convectiva', 'Chuva convectiva', 170, 150, `<path d="M4,140 H166"/>` + sol(26, 26, 9) + nuvem(104, 40, 1.5) + chuva(116, 140, 60, 90, 8) +
      setaQ(70, 132, 62, 104, 76, 72, 1.8) + setaQ(96, 132, 104, 104, 92, 72, 1.8)],
    ['geo-climograma', 'Climograma (em branco)', 270, 186, `<path d="M40,22 V160 H240 V22"/>` + trac('M40,130 H240 M40,100 H240 M40,70 H240 M40,40 H240', 1, '2 4') +
      fino('M34,130 H40 M34,100 H40 M34,70 H40 M34,40 H40 M240,130 H246 M240,100 H246 M240,70 H246 M240,40 H246', 1.4) +
      'JFMAMJJASOND'.split('').map((m, i) => t14(f(40 + 200 * (i + 0.5) / 12), 174, m)).join('') + t14(40, 10, 'mm') + t14(240, 10, '°C')],
    ['geo-brisa-maritima', 'Brisa marítima (dia)', 222, 139, "<g transform=\"translate(1.00 0.00)\">" + (brisa(true)) + "</g>"],
    ['geo-brisa-terrestre', 'Brisa terrestre (noite)', 222, 139, "<g transform=\"translate(1.00 0.00)\">" + (brisa(false)) + "</g>"],
    ['geo-inversao-termica', 'Inversão térmica', 220, 150, `<path d="M4,140 H216"/>` + `<rect x="20" y="96" width="20" height="44"/><rect x="46" y="80" width="24" height="60"/><rect x="76" y="104" width="22" height="36"/><rect x="104" y="88" width="20" height="52"/>` +
      `<rect x="150" y="98" width="10" height="42"/>` + fino('M155,96 Q164,86 152,78 Q140,70 110,70 Q70,70 30,74', 2) + fino('M110,76 Q80,78 50,80', 1.2) +
      trac('M4,60 H216', 2, '8 5') + t14(176, 46, 'ar quente') + t14(186, 80, 'ar frio')],
    ['geo-ilha-calor', 'Ilha de calor urbana', 240, 140, `<path d="M8,64 Q50,62 70,48 Q100,20 120,20 Q140,20 170,48 Q190,62 232,64"/>` + t14(16, 46, '°C') + `<path d="M4,130 H236"/>` +
      `<rect x="82" y="88" width="16" height="42"/><rect x="100" y="70" width="18" height="60"/><rect x="120" y="80" width="16" height="50"/><rect x="138" y="96" width="16" height="34"/>` +
      arvore(26, 130, 30, 9) + arvore(48, 130, 26, 8) + arvore(194, 130, 28, 8) + arvore(216, 130, 30, 9)],
    ['geo-estacoes', 'Estações do ano (órbita)', 260, 160, estacoes()],
    ['geo-rotacao', 'Rotação: dia e noite', 200, 140, rotacao()],
  ]],
  ['Hidrografia', [
    ['geo-rio-perfil', 'Perfil longitudinal do rio', 251, 149, "<g transform=\"translate(0.00 0.50)\">" + (`<path d="M10,20 Q40,100 130,112 Q190,118 230,120"/>` + ponto(10, 20, 4) + TS(18, 14, 'nascente') + ondas(226, 248, 122, 2.5, 10) + t14(232, 104, 'foz') +
      trac('M70,20 V128 M160,20 V128', 1.2, '4 4') + t14(40, 134, 'alto') + t14(115, 134, 'médio') + t14(200, 134, 'baixo')) + "</g>"],
    ['geo-rio-planta', 'Rio: nascente, afluentes e foz', 240, 150, `<path d="M10,42 L28,14 L46,42"/>` + ponto(34, 34, 3.5) + `<path stroke-width="3" d="${suave([[34, 34], [52, 54], [80, 58], [100, 80], [130, 86], [160, 104], [204, 112]], false)}"/>` +
      `<path stroke-width="1.8" d="${suave([[112, 8], [104, 40], [112, 62], [100, 80]], false)}"/>` + `<path stroke-width="1.8" d="${suave([[60, 146], [90, 126], [120, 106], [130, 86]], false)}"/>` +
      `<path d="M206,4 Q196,70 214,146"/>` + ondas(212, 236, 60) + ondas(214, 236, 90) + t14(30, 58, 'nascente') + TS(118, 30, 'afluente') + t14(186, 132, 'foz')],
    ['geo-meandro', 'Meandros e lago em ferradura', 230, 130, `<path stroke-width="3.5" d="${suave([[4, 60], [30, 34], [60, 32], [80, 70], [110, 102], [140, 96], [156, 60], [176, 32], [204, 36], [226, 64]], false)}"/>` +
      `<path stroke-width="2.2" d="M92,26 Q118,-2 144,26 Q118,12 92,26 Z"/>` + [[56, 46], [64, 52], [140, 84], [148, 78], [192, 48]].map(([x, y]) => ponto(x, y, 1.6)).join('')],
    ['geo-aquifero-livre', 'Aquífero livre (lençol freático)', 230, 150, `<path d="M4,30 Q60,24 120,32 T226,30"/>` + trac('M4,70 Q60,64 120,70 T226,68', 2, '7 4') + cheio('M210,57 L222,57 L216,65 Z') +
      `<path d="M4,118 H226"/>` + fino(Array.from({ length: 16 }, (_, i) => `M${8 + 14 * i},146 L${18 + 14 * i},122`).join(' '), 1) +
      [82, 98, 110].flatMap(y => [12, 28, 72, 88, 104, 196, 212].map(x => ponto(x + (y % 2) * 4, y, 1.5))).join('') +
      fino('M50,18 V100 M62,18 V100', 2) + `<path d="M51,70 H61 V100 H51 Z" fill="#C" fill-opacity=".3" stroke="none"/>` + t14(150, 52, 'lençol freático') + t14(150, 96, 'aquífero')],
    ['geo-aquifero-confinado', 'Aquífero confinado (poço jorrante)', 240, 160, aquiferoConf()],
    ['geo-margens', 'Margens, montante e jusante', 230, 116, `<path d="M4,40 Q60,30 115,40 T226,40"/><path d="M4,80 Q60,70 115,80 T226,80"/>` + seta(72, 60, 164, 60, 2) + t14(36, 60, 'montante') + t14(198, 60, 'jusante') +
      t14(115, 20, 'margem esquerda') + t14(115, 102, 'margem direita')],
    ['geo-delta', 'Foz em delta', 220, 156, `<path d="M4,50 H60 Q40,110 50,128 Q80,146 110,140 Q140,146 170,128 Q180,110 160,50 H216"/>` + `<path stroke-width="3" d="M110,4 V52"/>` +
      fino('M110,52 Q80,80 54,124 M110,52 Q96,100 86,138 M110,52 V140 M110,52 Q126,100 136,138 M110,52 Q140,80 166,124', 1.8) + ondas(4, 44, 100) + ondas(178, 216, 100) + ondas(30, 190, 150, 3, 14)],
    ['geo-estuario', 'Foz em estuário', 220, 140, `<path d="M4,56 Q80,54 130,40 Q170,26 190,8"/><path d="M4,74 Q80,76 130,92 Q170,108 190,130"/>` + seta(150, 66, 186, 66, 1.8, 9) + seta(150, 66, 114, 66, 1.8, 9) + t14(150, 52, 'maré') +
      ondas(196, 216, 40) + ondas(196, 216, 70) + ondas(196, 216, 100)],
    ['geo-divisor-aguas', 'Divisor de águas (perfil)', 220, 124, `<path d="M4,110 Q50,106 80,60 L110,20 L140,60 Q170,106 216,110"/>` + trac('M110,8 V116', 1.4) + setaQ(102, 34, 80, 66, 50, 96, 1.8) + setaQ(118, 34, 140, 66, 170, 96, 1.8) +
      t14(36, 74, 'bacia A') + t14(184, 74, 'bacia B') + `<path d="M6,112 Q14,116 22,112 Z M198,112 Q206,116 214,112 Z" fill="#C" stroke-width="1"/>`],
    ['geo-leito-rio', 'Leito do rio (menor, maior e várzea)', 230, 120, `<path d="M4,20 Q20,22 30,40 L40,64 H80 L88,72 Q92,96 115,98 Q138,96 142,72 L150,64 H190 L200,40 Q210,22 226,20"/>` +
      `<path d="M89,78 H141 Q138,96 115,97 Q92,96 89,78 Z" fill="#C" fill-opacity=".3" stroke="none"/>` + trac('M34,52 H196', 1.6) + t14(115, 42, 'cheia') + t14(115, 110, 'leito menor') + t14(172, 78, 'várzea')],
    ['geo-cachoeira', 'Queda d’água (cachoeira)', 150, 140, `<path d="M4,40 H70 V120 H146"/>` + fino('M4,56 H70 M4,80 H70 M4,104 H70', 1.2) + fino('M4,34 H72 Q86,40 88,116 M72,40 Q80,60 80,116 M76,36 Q92,50 96,116', 1.6) +
      fino('M74,120 q4,-6 8,0 M92,120 q4,-6 8,0', 1.4) + trac('M100,114 H146', 1.6, '6 4')],
  ]],
  ['Vegetação e biomas', [
    ['geo-amazonia', 'Floresta Amazônica (perfil)', 170, 112, `<path d="M4,106 H166"/>` + arvore(20, 106, 62, 13) + arvore(46, 106, 74, 15) + arvore(74, 106, 56, 13) + arvore(98, 106, 96, 18) + arvore(126, 106, 66, 15) + arvore(150, 106, 54, 12)],
    ['geo-mata-atlantica', 'Mata Atlântica (encosta)', 170, 112, `<path d="M4,106 Q40,92 80,70 Q120,48 166,40"/>` + arvore(24, 98, 40, 11) + arvore(52, 88, 46, 12) + arvore(82, 70, 44, 12) + arvore(110, 56, 46, 12) + arvore(140, 46, 40, 11)],
    ['geo-cerrado', 'Cerrado', 170, 112, `<path d="M4,80 H166"/>` + torta(32, 80, 40) + torta(100, 80, 48) + torta(148, 80, 34) + [12, 54, 64, 76, 120, 130, 160].map(x => capim(x, 80)).join('') + trac('M100,82 V106 M100,90 L90,102 M100,92 L110,104', 1.4, '3 3')],
    ['geo-caatinga', 'Caatinga', 170, 112, `<path d="M4,104 H166"/>` + seca(30, 104, 50) + cacto(74, 104, 56) + seca(118, 104, 44) + cacto(152, 104, 38) + fino('M20,104 l6,4 M96,104 l-5,5 M134,104 l5,5', 1.2)],
    ['geo-pampa', 'Pampa (campos)', 170, 100, `<path d="M4,86 Q50,66 90,82 T166,76"/>` + [[14, 82], [30, 76], [46, 72], [62, 74], [78, 79], [96, 82], [114, 80], [130, 76], [148, 75], [160, 76]].map(([x, y]) => capim(x, y, 1.1)).join('') + arvore(122, 79, 34, 9)],
    ['geo-pantanal', 'Pantanal (planície alagável)', 170, 100, ondas(4, 70, 92) + ondas(100, 166, 92) + `<path d="M70,90 Q85,80 100,90"/>` + arvore(85, 86, 44, 12) + [20, 36, 120, 140, 156].map(x => capim(x, 86)).join('') + arvore(140, 84, 32, 9)],
    ['geo-manguezal', 'Manguezal', 170, 112, ondas(4, 166, 74) + `<path d="M4,104 H166"/>` + mangue(40, 104, 82) + mangue(110, 104, 92) + [[70, 96], [140, 98], [20, 98]].map(([x, y]) => ponto(x, y, 1.6)).join('')],
    ['geo-araucarias', 'Mata de Araucárias', 170, 112, `<path d="M4,106 H166"/>` + araucaria(36, 106, 84) + araucaria(96, 106, 96) + araucaria(146, 106, 72) + arvore(66, 106, 28, 9) + arvore(124, 106, 24, 8)],
    ['geo-taiga', 'Taiga (floresta boreal)', 170, 112, `<path d="M4,106 H166"/>` + conifera(22, 106, 64, 30) + conifera(54, 106, 84, 36) + conifera(88, 106, 70, 32) + conifera(120, 106, 90, 38) + conifera(150, 106, 62, 28)],
    ['geo-tundra', 'Tundra', 170, 112, `<path d="M4,68 Q40,62 80,68 T166,66"/>` + [[16, 66], [40, 64], [70, 67], [100, 68], [128, 66], [152, 65]].map(([x, y]) => capim(x, y, 0.8)).join('') + fino('M30,62 Q40,54 52,62 M110,64 Q122,56 136,64', 1.6) +
      trac('M4,88 H166', 1.6) + t14(85, 102, 'permafrost') + nuvem(140, 22, 0.8)],
    ['geo-savana', 'Savana', 170, 100, `<path d="M4,92 H166"/>` + acacia(52, 92, 50) + acacia(132, 92, 40) + [12, 26, 84, 96, 108, 160].map(x => capim(x, 92, 1.1)).join('')],
    ['geo-deserto', 'Deserto (dunas)', 170, 100, `<path d="M4,92 Q30,60 60,72 Q76,78 88,92 M70,92 Q100,52 136,66 Q156,74 166,92"/>` + `<path d="M4,92 H166"/>` + fino('M40,76 Q56,72 66,82 M110,70 Q128,64 140,76', 1.2) + sol(140, 24, 10)],
  ]],
  ['População e cidade', [
    piramide('geo-piramide-jovem', 'Pirâmide etária (jovem)', [80, 70, 60, 50, 40, 30, 20, 10]),
    piramide('geo-piramide-adulta', 'Pirâmide etária (adulta)', [56, 58, 60, 58, 54, 46, 34, 18]),
    piramide('geo-piramide-envelhecida', 'Pirâmide etária (envelhecida)', [40, 44, 48, 52, 54, 52, 44, 30]),
    ['geo-piramide-grade', 'Pirâmide etária (grade em branco)', 233, 183, "<g transform=\"translate(2.64 0.50)\">" + (fino(Array.from({ length: 9 }, (_, i) => `M40,${152 - 15 * i} H220`).join(' '), 1) + `<path d="M130,26 V158 M40,152 H220"/>` +
      ['0', '20', '40', '60', '80'].map((a, i) => t14(20, 152 - 30 * i, a)).join('') + t14(20, 14, 'idade') + t14(85, 14, 'Homens') + t14(175, 14, 'Mulheres') + t14(130, 168, '%')) + "</g>"],
    ['geo-transicao-demog', 'Transição demográfica', 260, 172, `<path d="M20,14 V140 H250"/>` + trac('M76,20 V140 M132,20 V140 M188,20 V140', 1.2, '4 4') + ['1', '2', '3', '4'].map((n, i) => t14([48, 104, 160, 219][i], 22, n)).join('') +
      `<path d="${suave([[22, 40], [76, 40], [110, 44], [150, 90], [188, 112], [248, 114]], false)}"/>` + `<path stroke-dasharray="7 4" d="${suave([[22, 50], [50, 40], [76, 50], [110, 96], [132, 108], [188, 118], [248, 120]], false)}"/>` +
      fino('M24,160 H44', 2.5) + TS(50, 160, 'natalidade') + `<path stroke-dasharray="7 4" d="M140,160 H160"/>` + TS(166, 160, 'mortalidade')],
    ['geo-migracao', 'Migração (origem e destino)', 230, 104, `<circle cx="34" cy="56" r="22"/><circle cx="196" cy="56" r="22"/>` + ponto(34, 56, 4) + ponto(196, 56, 4) + setaQ(60, 46, 115, 6, 168, 44, 3.2) + t14(34, 94, 'origem') + t14(196, 94, 'destino')],
    ['geo-rede-urbana', 'Rede urbana (hierarquia)', 230, 160, fino('M115,80 L50,40 M115,80 L190,46 M115,80 L120,136 M50,40 L22,24 M50,40 L30,66 M50,40 L74,14 M190,46 L212,22 M190,46 L214,76 M190,46 L160,22 M120,136 L86,146 M120,136 L156,146 M120,136 L150,114', 1.6) +
      `<circle cx="115" cy="80" r="14" fill="#C"/><circle cx="50" cy="40" r="9"/><circle cx="190" cy="46" r="9"/><circle cx="120" cy="136" r="9"/>` +
      [[22, 24], [30, 66], [74, 14], [212, 22], [214, 76], [160, 22], [86, 146], [156, 146], [150, 114]].map(([x, y]) => ponto(x, y, 4)).join('')],
    ['geo-zonas-cidade', 'Cidade em zonas concêntricas', 210, 210, [92, 68, 44, 20].map(r => `<circle cx="105" cy="105" r="${r}" stroke-width="${r === 20 ? 2.5 : 1.8}"/>`).join('') + t14(105, 105, '1') + t14(105, 73, '2') + t14(105, 49, '3') + t14(105, 25, '4')],
    ['geo-uso-solo', 'Uso do solo urbano (zoneamento)', 220, 160, [['R', 'R', 'C', 'V'], ['R', 'C', 'C', 'I'], ['V', 'R', 'I', 'I']].map((lin, j) => lin.map((z, i) => `<rect x="${10 + 52 * i}" y="${8 + 50 * j}" width="44" height="42" rx="3" stroke-width="1.8"/>` + T(32 + 52 * i, 29 + 50 * j, z, 18)).join('')).join('')],
    ['geo-conurbacao', 'Conurbação', 240, 112, `<path d="M4,100 H236"/>` + [[14, 70, 16], [32, 58, 18], [52, 76, 14], [68, 52, 18], [88, 66, 16], [106, 80, 12], [120, 74, 12], [134, 60, 16], [152, 70, 14], [168, 50, 18], [188, 64, 16], [206, 74, 14], [222, 62, 12]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${100 - y}" stroke-width="1.8"/>`).join('') +
      trac('M120,8 V106', 2, '6 4') + t14(60, 22, 'cidade A') + t14(180, 22, 'cidade B')],
    ['geo-exodo-rural', 'Êxodo rural (campo → cidade)', 252, 119, "<g transform=\"translate(1.00 0.00)\">" + (`<path d="M4,92 H246"/><path d="M10,92 V66 L28,52 L46,66 V92"/>` + fino('M54,92 L62,74 M66,92 L74,74 M78,92 L86,74', 1.4) + `<path d="M190,92 V50 H206 V92 M208,92 V36 H226 V92 M228,92 V60 H242 V92"/>` +
      seta(92, 60, 176, 60, 5) + t14(40, 104, 'campo') + t14(216, 104, 'cidade')) + "</g>"],
    ['geo-densidade', 'Densidade demográfica (baixa e alta)', 230, 110, `<rect x="10" y="4" width="90" height="84"/><rect x="130" y="4" width="90" height="84"/>` +
      [[30, 24], [72, 18], [52, 50], [24, 70], [84, 66], [62, 78]].map(([x, y]) => ponto(x, y, 3)).join('') +
      Array.from({ length: 36 }, (_, i) => ponto(140 + (i % 6) * 14 + ((i * 7) % 5), 14 + Math.floor(i / 6) * 13 + ((i * 3) % 4), 3)).join('') + t14(55, 100, 'baixa') + t14(175, 100, 'alta')],
  ]],
  ['Economia e circulação', [
    ['geo-setores', 'Setores da economia', 260, 112, `<rect x="6" y="6" width="76" height="76" rx="6"/><rect x="92" y="6" width="76" height="76" rx="6"/><rect x="178" y="6" width="76" height="76" rx="6"/>` +
      fino('M44,72 V24 M44,34 Q34,30 32,22 M44,34 Q54,30 56,22 M44,48 Q34,44 32,36 M44,48 Q54,44 56,36 M44,62 Q34,58 32,50 M44,62 Q54,58 56,50 M20,72 H68', 1.8) +
      `<path stroke-width="2" d="M102,72 V44 L116,34 V44 L130,34 V44 L144,34 V72 Z M148,72 V22 H158 V72"/>` + fino('M96,72 H164', 1.8) +
      `<path stroke-width="2" d="M190,40 H242 V72 H190 Z M188,40 L194,24 H238 L244,40 M204,72 V54 H218 V72"/>` + fino('M201,40 L205,24 M214,40 L216,24 M227,40 L227,24', 1.4) +
      t14(44, 98, 'primário') + t14(130, 98, 'secundário') + t14(216, 98, 'terciário')],
    ['geo-cadeia-produtiva', 'Cadeia produtiva', 356, 64, ['Extração', 'Indústria', 'Comércio', 'Consumo'].map((n, i) => `<rect x="${4 + 92 * i}" y="12" width="72" height="40" rx="6"/>` + t14(40 + 92 * i, 32, n)).join('') +
      [0, 1, 2].map(i => seta(78 + 92 * i, 32, 94 + 92 * i, 32, 2, 9)).join('')],
    ['geo-fluxos', 'Fluxos entre lugares (setas proporcionais)', 230, 150, setaQ(48, 36, 120, 4, 180, 26, 5) + setaQ(44, 50, 60, 100, 100, 122, 3) + setaQ(190, 40, 172, 92, 128, 124, 1.6) + seta(206, 124, 132, 128, 2.5) +
      `<circle cx="38" cy="40" r="10" fill="#C"/><circle cx="192" cy="30" r="8"/><circle cx="114" cy="128" r="12"/><circle cx="216" cy="124" r="6"/>`],
    ['geo-simbolos-transporte', 'Símbolos de mapa: transportes', 170, 172, `<path d="M10,18 H80 M10,26 H80"/>` + `<path d="M10,54 H80"/>` + fino('M16,49 V59 M28,49 V59 M40,49 V59 M52,49 V59 M64,49 V59 M76,49 V59', 1.6) +
      fino('M10,86 q5,-4 10,0 t10,0 t10,0 t10,0 t10,0 t10,0 t10,0', 2.2) +
      cheio('M64,118 L60,115.5 H50 L42,104 H37 L41,115.5 H30 L26,110 H23 L25,118 L23,126 H26 L30,120.5 H41 L37,132 H42 L50,120.5 H60 Z') +
      `<circle cx="45" cy="139" r="3"/><path d="M45,142 V164 M38,147 H52 M34,156 Q36,165 45,164 Q54,165 56,156"/>` +
      TS(92, 22, 'Rodovia') + TS(92, 54, 'Ferrovia') + TS(92, 86, 'Hidrovia') + TS(92, 118, 'Aeroporto') + TS(92, 152, 'Porto')],
    ['geo-trem', 'Trem (ferrovia)', 200, 82, `<path d="M10,58 V30 H44 V18 H70 V58 Z"/><rect x="50" y="24" width="14" height="12" stroke-width="1.6"/><path d="M14,30 V22 H24 V30"/><rect x="88" y="26" width="104" height="32"/>` + fino('M70,48 H88', 2) +
      [24, 54, 106, 174].map(x => `<circle cx="${x}" cy="63" r="7" stroke-width="2"/>`).join('') + `<path d="M4,72 H196"/>` + fino('M12,72 v6 M32,72 v6 M52,72 v6 M72,72 v6 M92,72 v6 M112,72 v6 M132,72 v6 M152,72 v6 M172,72 v6 M192,72 v6', 1.4)],
    ['geo-navio', 'Navio cargueiro', 200, 100, `<path d="M8,60 H192 L180,84 H24 Z"/><path d="M20,60 V30 H42 V60 M24,30 V22 H38 V30"/>` + fino('M24,38 H38', 1.4) +
      [[54, 2], [84, 3], [114, 3], [144, 2]].map(([x, n]) => Array.from({ length: n }, (_, j) => `<rect x="${x}" y="${60 - 12 * (j + 1)}" width="28" height="12" stroke-width="1.6"/>`).join('')).join('') + ondas(4, 196, 94)],
    ['geo-aviao', 'Avião', 160, 100, `<path d="M14,56 Q14,46 30,46 H120 Q146,46 152,56 Q146,64 120,64 H30 Q14,64 14,56 Z"/><path d="M30,46 L18,20 H30 L50,46"/><path d="M66,58 L94,92 H108 L96,58"/><path d="M70,50 L84,32 H94 L88,46"/>` +
      [60, 72, 84, 96, 108, 120].map(x => `<circle cx="${x}" cy="52" r="2" stroke-width="1.4"/>`).join('')],
    ['geo-pivo-central', 'Pivô central (vista aérea)', 200, 104, `<rect x="6" y="6" width="92" height="92" stroke-width="1.6"/><rect x="102" y="6" width="92" height="92" stroke-width="1.6"/>` +
      [52, 148].map(x => `<circle cx="${x}" cy="52" r="42"/><circle cx="${x}" cy="52" r="28" stroke-width="1.2" stroke-dasharray="3 4"/><circle cx="${x}" cy="52" r="14" stroke-width="1.2" stroke-dasharray="3 4"/>`).join('') + fino('M52,52 L82,22 M148,52 L118,82', 2.2) + ponto(52, 52, 3.5) + ponto(148, 52, 3.5)],
    ['geo-mineracao', 'Mineração a céu aberto (cava)', 230, 100, `<path d="M4,30 H40 L48,44 H60 L68,58 H80 L88,72 H100 L106,86 H134 L140,72 H152 L160,58 H172 L180,44 H192 L200,30 H226"/>` + fino('M110,94 L124,94 M100,98 H140', 1.2)],
    ['geo-globalizacao', 'Globalização (rede mundial)', 170, 170, `<circle cx="85" cy="85" r="64"/>` + fino('M21,85 A64,14 0 0,0 149,85 M85,21 A26,64 0 0,0 85,149', 1.2) +
      fino('M50,60 Q80,4 120,50 M120,50 Q170,80 130,112 M50,60 Q10,100 70,122 M70,122 Q100,150 130,112 M50,60 Q90,90 130,112', 1.8) + [[50, 60], [120, 50], [70, 122], [130, 112]].map(([x, y]) => ponto(x, y, 4.5)).join('')],
    ['geo-centro-periferia', 'Centro e periferia', 220, 150, `<circle cx="110" cy="75" r="30"/>` + t14(110, 75, 'centro') + [[30, 30], [190, 30], [30, 120], [190, 120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" stroke-width="2"/>` + t14(x, y, 'P')).join('') +
      seta(44, 36, 84, 58, 1.6, 9) + seta(176, 36, 136, 58, 1.6, 9) + seta(84, 92, 44, 114, 1.6, 9) + seta(136, 92, 176, 114, 1.6, 9)],
  ]],
  ['Contornos (simplificados)', [
    ['geo-brasil', 'Brasil (contorno simplificado)', 200, 200, contorno([BRASIL], 200, 200, 0.98)],
    ['geo-brasil-regioes', 'Brasil: regiões (simplificado)', 200, 200, (() => {
      const P = encaixe([BRASIL], 200, 200, 0.98);
      const rot = [['N', -61, -4], ['NE', -40.5, -8], ['CO', -53, -15.5], ['SE', -45, -20], ['S', -52, -28]];
      return `<path stroke-width="2.2" d="${suave(BRASIL.map(P), true, 10)}"/>` + DIVISAS_BR.map(l => `<path stroke-width="1.6" stroke-dasharray="5 3" d="${suave(l.map(P), false, 10)}"/>`).join('') +
        rot.map(([s, lo, la]) => { const [x, y] = P([lo, la]); return T(f(x), f(y), s, 16); }).join('');
    })()],
    ['geo-america-sul', 'América do Sul (simplificada)', 150, 200, contorno([AM_SUL], 150, 200, 0.94)],
    ['geo-america-norte', 'América do Norte e Central (simplificada)', 210, 200, contorno([AM_NORTE, GROENLANDIA], 210, 200, 0.6)],
    ['geo-africa', 'África (simplificada)', 180, 196, contorno([AFRICA, MADAGASCAR], 180, 196, 1)],
    ['geo-europa', 'Europa (simplificada)', 210, 180, contorno([EUROPA, GRA_BRETANHA, IRLANDA, ISLANDIA], 210, 180, 0.62)],
    ['geo-asia', 'Ásia (simplificada)', 240, 200, contorno([ASIA, JAPAO, HOKKAIDO, SRI_LANKA, SUMATRA, BORNEU, JAVA, LUZON, MINDANAO], 240, 200, 0.75)],
    ['geo-oceania', 'Oceania (simplificada)', 220, 170, contorno([AUSTRALIA, TASMANIA, NZ_NORTE, NZ_SUL, NOVA_GUINE], 220, 170, 0.9)],
    ['geo-antartida', 'Antártida (vista polar, simplificada)', 180, 180, (() => {
      const pts = ANTARTIDA.map(([lo, la]) => { const r = (90 + la) * 3.2, a = lo * Math.PI / 180; return [90 + r * Math.sin(a), 90 - r * Math.cos(a)]; });
      return `<path stroke-width="2" d="${suave(pts, true, 10)}"/>` + ponto(90, 90, 3) + trac('M90,4 V176 M4,90 H176', 1, '2 5');
    })()],
    ['geo-planisferio', 'Planisfério (continentes simplificados)', 300, 150, (() => {
      const i = ANTARTIDA.findIndex(p => p[0] === 180), ant = [...ANTARTIDA.slice(i), ...ANTARTIDA.slice(0, i), [-180, -78.2], [-180, -83], [180, -83]];
      const polis = [AM_SUL, AM_NORTE, GROENLANDIA, AFRICA, MADAGASCAR, EUROPA, GRA_BRETANHA, IRLANDA, ISLANDIA, ASIA, JAPAO, HOKKAIDO, SRI_LANKA, SUMATRA, BORNEU, JAVA, LUZON, MINDANAO, AUSTRALIA, TASMANIA, NZ_NORTE, NZ_SUL, NOVA_GUINE];
      const P = encaixe([...polis, ant, [[-180, 84], [180, -88]]], 300, 150, 1, 3);
      return `<path stroke-width="1.6" d="${polis.map(pl => suave(pl.map(P), true, 10)).join(' ')} M${ant.map(P).map(p => p.map(f).join(',')).join(' L')} Z"/>` +
        `<rect x="3" y="3" width="294" height="144" stroke-width="1.2"/>` + trac(`M3,${f(P([0, 0])[1])} H297`, 1, '4 4');
    })()],
  ]],
];

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "geo-escala-preencher",
        "Escala gráfica — preencher distâncias",
        440,
        150,
        "<text x=\"220\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Escala gráfica — unidade: ______</text><path d=\"M30 72 H410 M30 64 V80 M125 64 V80 M220 64 V80 M315 64 V80 M410 64 V80\"/><text x=\"30\" y=\"105\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">___</text><text x=\"125\" y=\"105\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">___</text><text x=\"220\" y=\"105\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">___</text><text x=\"315\" y=\"105\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">___</text><text x=\"410\" y=\"105\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">___</text>"
      ],
      [
        "geo-legenda-vazia",
        "Legenda cartográfica — preencher",
        500,
        224,
        "<text x=\"250\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Legenda cartográfica — preencher</text><rect x=\"10\" y=\"42\" width=\"480\" height=\"178\" rx=\"3\"/><text x=\"90\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Símbolo</text><text x=\"250\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Significado</text><path d=\"M170 42 V220\"/><text x=\"410\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Fonte</text><path d=\"M330 42 V220\"/><path d=\"M10 68 H490\"/><path d=\"M10 106 H490\"/><path d=\"M10 144 H490\"/><path d=\"M10 182 H490\"/>"
      ]
    ]
  ]
];

export default {
  id: 'geografia',
  nome: 'Geografia',
  destaques: ['geo-rosa-ventos', 'geo-norte', 'geo-escala-grafica', 'geo-legenda', 'geo-grade-coord', 'geo-paralelos', 'geo-curvas-nivel', 'geo-perfil-topo',
    'geo-camadas-terra', 'geo-vulcao', 'geo-formas-relevo', 'geo-zonas-termicas', 'geo-climograma', 'geo-piramide-jovem', 'geo-brasil-regioes', 'geo-planisferio'],
  secoes: [...AMPLIACAO_20261009, ...SECOES],
};
