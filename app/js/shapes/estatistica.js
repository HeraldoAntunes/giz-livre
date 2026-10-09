// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
import { T, head } from './base.js';

// prefixo dos ids: 'es-'
// Moldes de Estatística: eixos limpos e espaço para o professor escrever por cima.
// Curvas calculadas aqui mesmo (fórmulas das distribuições); nada copiado de outras bibliotecas.

const r1 = v => +v.toFixed(1);
const P = pts => 'M' + pts.map(p => `${r1(p[0])},${r1(p[1])}`).join(' L');
const path = (pts, extra = '') => `<path d="${P(pts)}"${extra}/>`;
const ln = (x1, y1, x2, y2, extra = '') => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"${extra}/>`;
const pt = (x, y, r = 3) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="#C" stroke="none"/>`;
const t = (x, y, s, size = 11) => T(r1(x), r1(y), s, size);
const fino = ' stroke-width="1.4"';
const tracejado = ' stroke-width="1.4" stroke-dasharray="4 3"';
const pontilhado = ' stroke-width="1.8" stroke-dasharray="1 4"';
const sombra = ' fill="#C" fill-opacity=".25" stroke="none"';

// eixos com setas: origem (ox, oy), fim do x em xe, topo do y em ye
const eixos = (ox, oy, xe, ye) => `<path d="M${ox},${oy} H${xe - 6} M${ox},${oy} V${ye + 6}"/>` + head(xe, oy, 0, 9) + head(ox, ye, -90, 9);

// amostra uma função f(u) em [a, b] e mapeia para a tela
const curva = (f, a, b, X, Y, n = 80) => {
  const out = [];
  for (let i = 0; i <= n; i++) { const u = a + (b - a) * i / n; out.push([X(u), Y(f(u))]); }
  return out;
};
const area = (pts, yb) => `<path d="${P([[pts[0][0], yb], ...pts, [pts[pts.length - 1][0], yb]])} Z"${sombra}/>`;

// gerador pseudoaleatório fixo (sempre o mesmo desenho)
const rng = seed => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const gauss = r => { let u = 0; for (let i = 0; i < 6; i++) u += r(); return (u - 3) / 0.707; };

// ---------- Eixos e grades ----------
const ticksX = (x0, x1, dx, y, h = 4) => { let s = ''; for (let x = x0; x <= x1 + 0.1; x += dx) s += `M${r1(x)},${y - h} V${y + h} `; return s; };
const ticksY = (y0, y1, dy, x, h = 4) => { let s = ''; for (let y = y0; y >= y1 - 0.1; y -= dy) s += `M${x - h},${r1(y)} H${x + h} `; return s; };

const eixo1q = (() => {
  const ox = 24, oy = 138;
  return eixos(ox, oy, 194, 6) + `<path d="${ticksX(44, 174, 20, oy)}${ticksY(118, 28, 20, ox)}"${fino}/>` +
    t(16, 148, '0') + t(190, 150, 'x', 13) + t(12, 10, 'y', 13);
})();

const eixo4q = (() => {
  const c = 100;
  let tk = '';
  for (let d = 20; d <= 80; d += 20) tk += `M${c + d},${c - 4} V${c + 4} M${c - d},${c - 4} V${c + 4} M${c - 4},${c + d} H${c + 4} M${c - 4},${c - d} H${c + 4} `;
  return `<path d="M6,${c} H190 M${c},194 V10"/>` + head(196, c, 0, 9) + head(c, 4, -90, 9) +
    `<path d="${tk}"${fino}/>` + t(188, 114, 'x', 13) + t(114, 10, 'y', 13) +
    t(150, 50, 'I', 13) + t(50, 50, 'II', 13) + t(50, 150, 'III', 13) + t(150, 150, 'IV', 13);
})();

const reta = (() => {
  let tk = '', lb = '';
  for (let i = -5; i <= 5; i++) { const x = 120 + i * 20; tk += `M${x},${i === 0 ? 18 : 20} V${i === 0 ? 32 : 30} `; lb += t(x, 42, i < 0 ? '−' + (-i) : String(i), 10); }
  return `<path d="M10,25 H230"/>` + head(236, 25, 0, 9) + head(4, 25, 180, 9) + `<path d="${tk}"${fino}/>` + lb;
})();

const grade = (() => {
  const ox = 22, oy = 140; let g = '';
  for (let x = ox + 15; x <= 172; x += 15) g += `M${x},${oy} V14 `;
  for (let y = oy - 15; y >= 14; y -= 15) g += `M${ox},${y} H172 `;
  return `<path d="${g}" stroke-width=".8"/>` + eixos(ox, oy, 186, 4);
})();

const papelNormal = (() => {
  const ps = [['1', -2.326], ['5', -1.645], ['10', -1.282], ['20', -0.842], ['30', -0.524], ['50', 0], ['70', 0.524], ['80', 0.842], ['90', 1.282], ['95', 1.645], ['99', 2.326]];
  const Y = z => 100 - z * 36;
  let h = '', lb = '', v = '';
  for (const [s, z] of ps) { h += `M40,${r1(Y(z))} H194 `; lb += t(24, Y(z), s, 10); }
  for (let x = 62; x < 194; x += 22) v += `M${x},6 V194 `;
  return `<rect x="40" y="6" width="154" height="188"/>` + `<path d="${h}${v}" stroke-width=".9"/>` +
    ln(40, Y(0), 194, Y(0), ' stroke-width="1.6"') + t(24, 196, '%', 10);
})();

const decadas = (a, b, n, ehX) => { // linhas de grade logarítmicas: n décadas entre a e b
  let fortes = '', fracas = '';
  for (let d = 0; d < n; d++) for (let k = 1; k <= 9; k++) {
    const p = a + (b - a) * (d + Math.log10(k)) / n;
    const seg = ehX ? `M${r1(p)},6 V176 ` : `M38,${r1(p)} H194 `;
    if (k === 1) fortes += seg; else fracas += seg;
  }
  return [fortes, fracas];
};
const semilog = (() => {
  const [f, g] = decadas(176, 6, 2, false);
  let v = ''; for (let x = 58; x < 194; x += 20) v += `M${x},6 V176 `;
  return `<rect x="38" y="6" width="156" height="170"/>` + `<path d="${g}${v}" stroke-width=".8"/>` + `<path d="${f}" stroke-width="1.6"/>` +
    t(24, 176, '1', 10) + t(24, 91, '10', 10) + t(22, 8, '100', 10);
})();
const loglog = (() => {
  const [fy, gy] = decadas(176, 6, 2, false);
  const [fx, gx] = decadas(38, 194, 2, true);
  return `<rect x="38" y="6" width="156" height="170"/>` + `<path d="${gy}${gx}" stroke-width=".8"/>` + `<path d="${fy}${fx}" stroke-width="1.6"/>` +
    t(24, 176, '1', 10) + t(24, 91, '10', 10) + t(22, 8, '100', 10) + t(38, 188, '1', 10) + t(116, 188, '10', 10) + t(190, 188, '100', 10);
})();

// ---------- Distribuições ----------
// normal: z em [-3.4, 3.4] → x de 14 a 206; base em y=104; pico 84 px
const NX = z => 110 + z * 192 / 6.8, NYB = 104, NY = v => NYB - 84 * v;
const fN = z => Math.exp(-z * z / 2);
const nPts = (a, b) => curva(fN, a, b, NX, NY, Math.max(8, Math.round((b - a) * 14)));
const nBase = `<path d="M6,${NYB} H214"/>` + path(nPts(-3.4, 3.4));

const normal = (() => {
  let v = '', tk = '';
  for (const z of [-2, -1, 1, 2]) v += ln(NX(z), NYB, NX(z), NY(fN(z)), tracejado);
  for (const z of [-2, -1, 0, 1, 2]) tk += `M${r1(NX(z))},${NYB - 4} V${NYB + 4} `;
  return nBase + ln(NX(0), NYB, NX(0), NY(1), tracejado) + v + `<path d="${tk}"${fino}/>` +
    t(NX(-2), 117, '−2σ') + t(NX(-1), 117, '−σ') + t(NX(0), 117, 'μ', 12) + t(NX(1), 117, '+σ') + t(NX(2), 117, '+2σ');
})();
const zc = 1.65, zb = 1.96;
const marcaZ = (z, s) => ln(NX(z), NYB - 4, NX(z), NYB + 4, fino) + t(NX(z), 117, s);
const normalDir = area(nPts(zc, 3.4), NYB) + nBase + ln(NX(zc), NYB, NX(zc), NY(fN(zc)), fino) + marcaZ(0, 'μ') + marcaZ(zc, 'z') + t(NX(2.45), 80, 'α', 13);
const normalEsq = area(nPts(-3.4, -zc), NYB) + nBase + ln(NX(-zc), NYB, NX(-zc), NY(fN(zc)), fino) + marcaZ(0, 'μ') + marcaZ(-zc, '−z') + t(NX(-2.45), 80, 'α', 13);
const normalBi = area(nPts(-3.4, -zb), NYB) + area(nPts(zb, 3.4), NYB) + nBase +
  ln(NX(-zb), NYB, NX(-zb), NY(fN(zb)), fino) + ln(NX(zb), NYB, NX(zb), NY(fN(zb)), fino) +
  marcaZ(0, 'μ') + marcaZ(-zb, '−z') + marcaZ(zb, '+z') + t(NX(-2.7), 82, 'α/2', 11) + t(NX(2.7), 82, 'α/2', 11);

const tNormal = (() => {
  const fT = z => 0.3676 / 0.3989 * Math.pow(1 + z * z / 3, -2);
  return `<path d="M6,${NYB} H214"/>` + path(nPts(-3.4, 3.4)) + path(curva(fT, -3.4, 3.4, NX, NY, 90), ' stroke-dasharray="7 5"') +
    marcaZ(0, '0') + ln(156, 12, 176, 12) + t(198, 12, 'normal', 10) + ln(156, 28, 176, 28, ' stroke-dasharray="7 5"') + t(198, 28, 't', 11);
})();

// eixos para distribuições de x ≥ 0 (origem em 18,110)
const OX = 18, OY = 110, eixoPos = eixos(OX, OY, 214, 6);
const quiQuad = (() => {
  const X = u => OX + u * 10, Y = v => OY - v * 470;
  const f4 = u => u * Math.exp(-u / 2) / 4, f8 = u => u ** 3 * Math.exp(-u / 2) / 96;
  return eixoPos + path(curva(f4, 0, 19, X, Y)) + path(curva(f8, 0, 19, X, Y), ' stroke-dasharray="7 5"') +
    t(X(2) + 14, Y(0.184) - 8, 'k = 4', 10) + t(X(6) + 20, Y(0.112) - 10, 'k = 8', 10) + t(206, 122, 'χ²', 13);
})();
const distF = (() => {
  const d1 = 5, d2 = 10, f = u => u <= 0 ? 0 : Math.pow(u, d1 / 2 - 1) * Math.pow(1 + d1 * u / d2, -(d1 + d2) / 2);
  let m = 0; for (let u = 0.01; u < 5; u += 0.01) m = Math.max(m, f(u));
  const X = u => OX + u * 38, Y = v => OY - 92 * v / m;
  return eixoPos + path(curva(f, 0, 5, X, Y, 100)) + t(206, 122, 'F', 13);
})();
const exponencial = (() => {
  const X = u => OX + u * 36, Y = v => OY - 94 * v;
  return eixoPos + path(curva(u => Math.exp(-u), 0, 5.2, X, Y)) + t(206, 122, 'x', 13) + t(8, 16, 'λ', 12);
})();
const uniforme = (() => {
  const a = 60, b = 160, h = 50;
  return eixoPos + `<path d="M${OX},${OY} H${a} M${a},${h} H${b} M${b},${OY} H204"/>` + ln(a, h, a, OY, tracejado) + ln(b, h, b, OY, tracejado) +
    `<rect x="${a}" y="${h}" width="${b - a}" height="${OY - h}"${sombra}/>` +
    t(a, 122, 'a', 12) + t(b, 122, 'b', 12) + t((a + b) / 2, h - 12, '1/(b − a)', 11);
})();
const barrasDiscretas = (probs, x0, dx, w) => {
  const m = Math.max(...probs); let s = '', lb = '';
  probs.forEach((p, k) => { const x = x0 + k * dx, hh = 90 * p / m; s += `<rect x="${r1(x - w / 2)}" y="${r1(OY - hh)}" width="${w}" height="${r1(hh)}" fill="#C" fill-opacity=".25" stroke-width="1.8"/>`; lb += t(x, 121, String(k), 9); });
  return s + lb;
};
const fat = n => n <= 1 ? 1 : n * fat(n - 1);
const binomial = (() => {
  const n = 10, p = 0.3, pr = []; for (let k = 0; k <= n; k++) pr.push(fat(n) / (fat(k) * fat(n - k)) * p ** k * (1 - p) ** (n - k));
  return eixoPos + barrasDiscretas(pr, 34, 16, 10);
})();
const poisson = (() => {
  const lam = 3, pr = []; for (let k = 0; k <= 10; k++) pr.push(Math.exp(-lam) * lam ** k / fat(k));
  return eixoPos + barrasDiscretas(pr, 34, 16, 10);
})();

// assimetria: lognormal (σ = 0,8): Mo < Md < média
const assim = (() => {
  const s = 0.8, f = u => u <= 0 ? 0 : Math.exp(-(Math.log(u) ** 2) / (2 * s * s)) / u;
  let m = 0; for (let u = 0.01; u < 5; u += 0.005) m = Math.max(m, f(u));
  const X = u => 14 + u * 38, Y = v => 112 - 92 * v / m;
  const mo = Math.exp(-s * s), md = 1, me = Math.exp(s * s / 2);
  const pts = curva(f, 0.0001, 5.1, X, Y, 120);
  const marcas = [[mo, 'Mo', 124], [md, 'Md', 134], [me, 'x̄', 124]];
  return { pts, X, Y, f, marcas };
})();
const assimetria = espelho => {
  const fx = x => espelho ? 220 - x : x, A = assim;
  let s = `<path d="M6,112 H214"/>` + path(A.pts.map(([x, y]) => [fx(x), y]));
  for (const [u, nm, yy] of A.marcas) s += ln(fx(A.X(u)), 112, fx(A.X(u)), A.Y(A.f(u)), tracejado) + t(fx(A.X(u)), yy, nm, 10);
  return s;
};

const curtose = (() => {
  const X = z => 96 + z * 22, g = s => z => Math.exp(-z * z / (2 * s * s)) / s;
  const k = 92 / (1 / 0.6), Y = v => 110 - k * v;
  return `<path d="M4,110 H188"/>` + path(curva(g(0.6), -4, 4, X, Y, 120)) + path(curva(g(1), -4, 4, X, Y, 120), ' stroke-dasharray="7 5"') +
    path(curva(g(1.6), -4, 4, X, Y, 120), pontilhado) +
    ln(170, 14, 190, 14) + t(212, 14, 'lepto', 10) + ln(170, 30, 190, 30, ' stroke-dasharray="7 5"') + t(212, 30, 'meso', 10) +
    ln(170, 46, 190, 46, pontilhado) + t(212, 46, 'plati', 10);
})();
const bimodal = (() => {
  const f = z => Math.exp(-((z + 1.4) ** 2) / (2 * 0.49)) + 0.85 * Math.exp(-((z - 1.5) ** 2) / (2 * 0.64));
  let m = 0; for (let z = -4; z < 4; z += 0.01) m = Math.max(m, f(z));
  return `<path d="M6,${NYB} H214"/>` + path(curva(f, -3.6, 3.8, z => 110 + z * 25, v => NYB - 86 * v / m, 120));
})();

// ---------- Gráficos ----------
const GX = 22, GY = 130; // origem dos gráficos de 220×150
const eixoG = eixos(GX, GY, 214, 6);
const freq = [3, 7, 12, 16, 11, 6, 2];
const histograma = eixoG + freq.map((f, i) => `<rect x="${36 + i * 24}" y="${GY - f * 6.5}" width="24" height="${f * 6.5}"/>`).join('');
const poligono = (() => {
  const pts = [[28, GY], ...freq.map((f, i) => [49 + i * 21, GY - f * 6.5]), [49 + 7 * 21, GY]];
  return eixoG + path(pts) + pts.map(([x, y]) => pt(x, y)).join('');
})();
const ogiva = (() => {
  let ac = 0; const tot = freq.reduce((a, b) => a + b, 0), pts = [[36, GY]];
  freq.forEach((f, i) => { ac += f; pts.push([60 + i * 24, GY - 108 * ac / tot]); });
  return eixoG + ln(GX, GY - 108, 194, GY - 108, tracejado) + t(198, GY - 118, '100%', 9) + path(pts) + pts.map(([x, y]) => pt(x, y)).join('');
})();

const boxH = (() => {
  const y0 = 26, y1 = 50, yc = 38;
  let tk = ''; for (let x = 20; x <= 200; x += 20) tk += `M${x},70 V76 `;
  return `<path d="M12,73 H208"/>` + `<path d="${tk}"${fino}/>` +
    `<rect x="70" y="${y0}" width="62" height="${y1 - y0}"/>` + ln(96, y0, 96, y1, ' stroke-width="3"') +
    `<path d="M30,${yc} H70 M132,${yc} H172 M30,${yc - 8} V${yc + 8} M172,${yc - 8} V${yc + 8}"/>` +
    `<circle cx="200" cy="${yc}" r="4"/>` +
    t(70, 14, 'Q1') + t(96, 14, 'Md') + t(132, 14, 'Q3') + t(200, 22, 'outlier', 9);
})();
const boxV = (() => {
  const x0 = 40, x1 = 74, xc = 57;
  let tk = ''; for (let y = 186; y >= 26; y -= 20) tk += `M10,${y} H16 `;
  return `<path d="M13,194 V10"/>` + `<path d="${tk}"${fino}/>` +
    `<rect x="${x0}" y="78" width="${x1 - x0}" height="56"/>` + ln(x0, 104, x1, 104, ' stroke-width="3"') +
    `<path d="M${xc},78 V36 M${xc},134 V176 M${xc - 8},36 H${xc + 8} M${xc - 8},176 H${xc + 8}"/>` +
    `<circle cx="${xc}" cy="16" r="4"/>` +
    t(92, 78, 'Q3') + t(92, 104, 'Md') + t(92, 134, 'Q1') + t(92, 16, 'outlier', 9);
})();
const boxComp = (() => {
  const bx = (xc, wl, q1, md, q3, wh, out) => `<rect x="${xc - 14}" y="${q3}" width="28" height="${q1 - q3}"/>` + ln(xc - 14, md, xc + 14, md, ' stroke-width="3"') +
    `<path d="M${xc},${q3} V${wh} M${xc},${q1} V${wl} M${xc - 7},${wh} H${xc + 7} M${xc - 7},${wl} H${xc + 7}"/>` + (out ? `<circle cx="${xc}" cy="${out}" r="3.5"/>` : '');
  let tk = ''; for (let y = 110; y >= 30; y -= 20) tk += `M${GX - 4},${y} H${GX + 4} `;
  return eixoG + `<path d="${tk}"${fino}/>` + bx(62, 112, 92, 80, 64, 36, 0) + bx(118, 100, 74, 62, 50, 26, 120) + bx(174, 118, 104, 94, 84, 58, 22) +
    t(62, 141, 'A', 11) + t(118, 141, 'B', 11) + t(174, 141, 'C', 11);
})();

// dispersão: quadro 180×150, origem (20,132)
const DX = 20, DY = 132, eixoD = eixos(DX, DY, 176, 6);
const pontos = (seed, b, ruido, n = 22) => {
  const r = rng(seed), out = [];
  for (let i = 0; i < n; i++) { const x = 0.05 + 0.9 * r(); let y = 0.5 + b * (x - 0.5) + ruido * gauss(r); y = Math.min(0.95, Math.max(0.05, y)); out.push([x, y]); }
  return out;
};
const mapD = ([x, y]) => [DX + 10 + x * 140, DY - 10 - y * 112];
const nuvem = pts => pts.map(p => pt(...mapD(p))).join('');
const dispReta = eixoD + nuvem(pontos(7, 0.75, 0.08)) + ln(...mapD([0, 0.125]), ...mapD([1, 0.875]));
const corrPos = eixoD + nuvem(pontos(11, 0.8, 0.07));
const corrNeg = eixoD + nuvem(pontos(23, -0.8, 0.07));
const corrNula = eixoD + nuvem(pontos(5, 0, 0.22));
const residuos = (() => {
  const yc = 72;
  return `<path d="M${DX},134 V12"/>` + head(DX, 6, -90, 9) + `<path d="M${DX},${yc} H170"/>` + head(176, yc, 0, 9) + t(10, yc, '0', 11) +
    pontos(31, 0, 0.16).map(([x, y]) => pt(DX + 12 + x * 140, yc - (y - 0.5) * 120)).join('');
})();
const barras = eixoG + [70, 100, 45, 85, 30].map((h, i) => `<rect x="${36 + i * 36}" y="${GY - h}" width="24" height="${h}" fill="#C" fill-opacity=".25"/>` + t(48 + i * 36, 141, 'ABCDE'[i], 10)).join('');
const barrasAgrup = eixoG + [[60, 80], [95, 70], [45, 65], [85, 100]].map(([a, b], i) => {
  const x = 34 + i * 44;
  return `<rect x="${x}" y="${GY - a}" width="16" height="${a}" fill="#C" fill-opacity=".25"/><rect x="${x + 16}" y="${GY - b}" width="16" height="${b}"/>` + t(x + 16, 141, String(i + 1), 10);
}).join('');
const pizza = (() => {
  const c = 70, R = 62, angs = [0, 126, 216, 282], pol = a => [c + R * Math.sin(a * Math.PI / 180), c - R * Math.cos(a * Math.PI / 180)];
  const [x1, y1] = pol(0), [x2, y2] = pol(126);
  return `<path d="M${c},${c} L${r1(x1)},${r1(y1)} A${R},${R} 0 0 1 ${r1(x2)},${r1(y2)} Z"${sombra}/>` + `<circle cx="${c}" cy="${c}" r="${R}"/>` +
    angs.map(a => ln(c, c, ...pol(a), ' stroke-width="2"')).join('');
})();
const linhaTempo = (() => {
  const ys = [80, 70, 76, 58, 62, 46, 52, 38, 44, 30];
  const pts = ys.map((y, i) => [36 + i * 18, y + 20]);
  let tk = ''; for (let i = 0; i < 10; i++) tk += `M${36 + i * 18},${GY - 4} V${GY + 4} `;
  return eixoG + `<path d="${tk}"${fino}/>` + path(pts) + pts.map(([x, y]) => pt(x, y)).join('') + t(206, 142, 't', 12);
})();
const ramoFolhas = (() => {
  let g = ''; for (let y = 58; y <= 178; y += 24) g += `M8,${y} H152 `;
  return t(34, 18, 'Ramo', 14) + t(106, 18, 'Folhas', 14) + `<path d="M6,34 H154 M62,6 V184"/>` + `<path d="${g}" stroke-width="1" stroke-dasharray="2 5"/>`;
})();
const pareto = (() => {
  const pc = [40, 25, 15, 10, 6, 4], top = 18, Hh = GY - top, y = v => GY - Hh * v / 100;
  let ac = 0; const cum = [];
  const bars = pc.map((v, i) => { ac += v; const x = 30 + i * 28; cum.push([x + 12, y(ac)]); return `<rect x="${x}" y="${r1(y(v))}" width="24" height="${r1(Hh * v / 100)}" fill="#C" fill-opacity=".25"/>`; }).join('');
  return `<path d="M${GX},${GY} H202 M${GX},${GY} V10 M202,${GY} V10"/>` + bars + path(cum, ' stroke-width="2"') + cum.map(([a, b]) => pt(a, b)).join('') +
    ln(GX, y(80), 202, y(80), tracejado) + t(214, y(100), '100%', 9) + t(214, y(80), '80%', 9) + `<path d="M198,${y(100)} H206 M198,${y(80)} H206"${fino}/>`;
})();
const controle = (() => {
  const ys = [64, 54, 72, 60, 48, 70, 80, 58, 44, 66, 16, 62, 74, 56];
  const pts = ys.map((y, i) => [14 + i * 13.5, y]);
  return ln(8, 26, 196, 26, ' stroke-dasharray="7 5" stroke-width="2"') + ln(8, 64, 196, 64, ' stroke-width="2"') + ln(8, 102, 196, 102, ' stroke-dasharray="7 5" stroke-width="2"') +
    path(pts, ' stroke-width="1.6"') + pts.map(([x, y]) => pt(x, y, 2.8)).join('') +
    t(214, 26, 'LSC', 11) + t(214, 64, 'LC', 11) + t(214, 102, 'LIC', 11);
})();
const qqPlot = (() => {
  const n = 15, r = rng(3), pts = [];
  for (let i = 1; i <= n; i++) { const p = (i - 0.5) / n, z = 4.91 * (p ** 0.14 - (1 - p) ** 0.14); pts.push([z, z + 0.12 * gauss(r) + 0.03 * z ** 3]); }
  const m = ([a, b]) => [DX + 78 + a * 26, DY - 60 - b * 22];
  return eixoD + ln(...m([-2.0, -2.0]), ...m([2.0, 2.0]), tracejado) + pts.map(p => pt(...m(p))).join('');
})();

// ---------- Probabilidade e amostragem ----------
const venn2 = `<rect x="4" y="4" width="212" height="132" rx="4"/><circle cx="86" cy="72" r="50"/><circle cx="134" cy="72" r="50"/>` +
  T(56, 72, 'A', 18) + T(164, 72, 'B', 18) + T(20, 20, 'Ω', 16);
const venn3 = `<rect x="4" y="4" width="212" height="192" rx="4"/><circle cx="88" cy="80" r="50"/><circle cx="132" cy="80" r="50"/><circle cx="110" cy="120" r="50"/>` +
  T(66, 62, 'A', 18) + T(154, 62, 'B', 18) + T(110, 150, 'C', 18) + T(20, 20, 'Ω', 16);
const arvore = (() => {
  const r = [12, 75];
  return `<circle cx="${r[0]}" cy="${r[1]}" r="3.5" fill="#C"/>` +
    `<path d="M15,73 L84,38 M15,77 L84,112 M110,38 L176,18 M110,38 L176,58 M110,112 L176,92 M110,112 L176,132"/>` +
    T(97, 38, 'A', 16) + T(97, 112, 'Aᶜ', 16) + T(192, 18, 'B', 15) + T(194, 58, 'Bᶜ', 15) + T(192, 92, 'B', 15) + T(194, 132, 'Bᶜ', 15);
})();
const dado = (() => {
  const fr = `<path d="M10,38 H82 V110 H10 Z M10,38 L40,10 H112 L82,38 M82,110 L112,82 V10"/>`;
  const pf = [[28, 56], [64, 56], [46, 74], [28, 92], [64, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#C" stroke="none"/>`).join('');
  return fr + pf + `<ellipse cx="61" cy="24" rx="7" ry="3.5" fill="#C" stroke="none"/>` +
    `<ellipse cx="91" cy="48" rx="3.2" ry="5.5" fill="#C" stroke="none"/><ellipse cx="103" cy="72" rx="3.2" ry="5.5" fill="#C" stroke="none"/>`;
})();
const moeda = `<circle cx="55" cy="55" r="48"/><circle cx="55" cy="55" r="38" stroke-width="1.4"/>` + T(55, 57, '1', 40);
const urna = `<path d="M44,16 V32 C14,44 8,100 30,138 H90 C112,100 106,44 76,32 V16 M36,16 H84"/>` +
  [[40, 124, 1], [60, 126, 0], [80, 124, 1], [48, 105, 0], [70, 104, 1], [36, 86, 1], [58, 86, 0], [80, 86, 0], [60, 66, 1]]
    .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="9"${c ? ' fill="#C" fill-opacity=".6"' : ' stroke-width="1.8"'}/>`).join('');
const popAmostra = (() => {
  const r = rng(17); let d = '';
  for (let i = 0; i < 26; i++) { const a = r() * 2 * Math.PI, q = Math.sqrt(r()) * 0.82; d += pt(62 + 54 * q * Math.cos(a), 58 + 44 * q * Math.sin(a), 2.6); }
  const am = [[188, 50], [204, 46], [196, 64], [212, 62], [200, 76]].map(([x, y]) => pt(x, y, 2.6)).join('');
  return `<ellipse cx="62" cy="58" rx="58" ry="50"/>` + d + `<path d="M126,58 H152"/>` + head(162, 58, 0, 11) +
    `<ellipse cx="200" cy="60" rx="34" ry="30"/>` + am + t(62, 122, 'População (N)', 11) + t(200, 108, 'Amostra (n)', 11);
})();
const contingencia = (() => {
  const xs = [4, 56, 108, 160, 214], ys = [4, 34, 64, 94, 124];
  let g = ''; for (const x of xs.slice(1, -1)) g += `M${x},4 V124 `; for (const y of ys.slice(1, -1)) g += `M4,${y} H214 `;
  const cx = i => (xs[i] + xs[i + 1]) / 2, cy = j => (ys[j] + ys[j + 1]) / 2;
  return `<rect x="4" y="4" width="210" height="120"/>` + `<path d="${g}" stroke-width="1.6"/>` +
    t(cx(1), cy(0), 'B', 14) + t(cx(2), cy(0), 'Bᶜ', 14) + t(cx(3), cy(0), 'Total', 13) +
    t(cx(0), cy(1), 'A', 14) + t(cx(0), cy(2), 'Aᶜ', 14) + t(cx(0), cy(3), 'Total', 13);
})();

// ====================== Mais formas ======================
// Φ(z) pela aproximação de Abramowitz-Stegun 7.1.26
const Phi = z => {
  const x = Math.abs(z) / Math.SQRT2, k = 1 / (1 + 0.3275911 * x);
  const e = 1 - (((((1.061405429 * k - 1.453152027) * k) + 1.421413741) * k - 0.284496736) * k + 0.254829592) * k * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e);
};
// cota horizontal com rótulo no meio
const cota = (x1, x2, y, s, size = 10) => {
  const xm = (x1 + x2) / 2, g = s.length * size * 0.3 + 4;
  return `<path d="M${r1(x1)},${y - 5} V${y + 5} M${r1(x2)},${y - 5} V${y + 5} M${r1(x1)},${y} H${r1(xm - g)} M${r1(xm + g)},${y} H${r1(x2)}"${fino}/>` + t(xm, y, s, size);
};
// legenda: amostra de traço + texto à direita
const leg = (x, y, s, est = '') => ln(x, y, x + 18, y, est) + t(x + 24 + s.length * 2.6, y, s, 9);
const tiq = x => `<path d="M${r1(x)},${OY - 4} V${OY + 4}"${fino}/>`;
const desv = ' stroke-dasharray="7 5"';
const sub = (a, b) => `${a}<tspan font-size="9" dy="4">${b}</tspan>`;

// ---------- Curva normal e testes ----------
const normalRegra = (() => {
  let v = '', tk = '', lb = '';
  const nm = ['−3σ', '−2σ', '−σ', 'μ', '+σ', '+2σ', '+3σ'];
  for (let z = -3; z <= 3; z++) {
    if (Math.abs(z) < 3) v += ln(NX(z), NYB, NX(z), NY(fN(z)), tracejado);
    tk += `M${r1(NX(z))},${NYB - 4} V${NYB + 4} `; lb += t(NX(z), 117, nm[z + 3], 10);
  }
  return nBase + v + `<path d="${tk}"${fino}/>` + lb + cota(NX(-1), NX(1), 134, '68%') + cota(NX(-2), NX(2), 150, '95%') + cota(NX(-3), NX(3), 166, '99,7%');
})();
const normalPadrao = (() => {
  let tk = '', lb = '';
  for (let z = -3; z <= 3; z++) { tk += `M${r1(NX(z))},${NYB - 4} V${NYB + 4} `; lb += t(NX(z), 117, z < 0 ? '−' + (-z) : String(z), 10); }
  return nBase + ln(NX(0), NYB, NX(0), NY(1), tracejado) + `<path d="${tk}"${fino}/>` + lb + t(208, 92, 'z', 13);
})();
const normalEntre = (() => {
  const a = -0.7, b = 1.2;
  return area(nPts(a, b), NYB) + nBase + ln(NX(a), NYB, NX(a), NY(fN(a)), fino) + ln(NX(b), NYB, NX(b), NY(fN(b)), fino) +
    marcaZ(a, 'a') + marcaZ(b, 'b') + t(184, 34, 'P(a &lt; X &lt; b)', 10);
})();
const normalAcum = area(nPts(-3.4, 0.8), NYB) + nBase + ln(NX(0.8), NYB, NX(0.8), NY(fN(0.8)), fino) + marcaZ(0.8, 'z') + t(NX(-0.6), 78, 'Φ(z)', 12);
const normalIC = area(nPts(-zb, zb), NYB) + nBase + ln(NX(-zb), NYB, NX(-zb), NY(fN(zb)), fino) + ln(NX(zb), NYB, NX(zb), NY(fN(zb)), fino) +
  marcaZ(-zb, '−z') + marcaZ(zb, '+z') + marcaZ(0, 'μ') + t(110, 76, '1 − α', 12) + t(NX(-2.7), 82, 'α/2', 10) + t(NX(2.7), 82, 'α/2', 10);
const normalMedias = (() => {
  const s = 0.75, f1 = z => fN((z + 1.2) / s), f2 = z => fN((z - 1.2) / s);
  return `<path d="M6,${NYB} H214"/>` + path(curva(f1, -3.4, 3.4, NX, NY, 120)) + path(curva(f2, -3.4, 3.4, NX, NY, 120), desv) +
    ln(NX(-1.2), NYB, NX(-1.2), NY(1), tracejado) + ln(NX(1.2), NYB, NX(1.2), NY(1), tracejado) + marcaZ(-1.2, 'μ₁') + marcaZ(1.2, 'μ₂');
})();
const normalFda = (() => {
  const Y = v => 110 - 92 * v;
  return `<path d="M6,110 H206 M110,114 V12"/>` + head(214, 110, 0, 9) + head(110, 6, -90, 9) +
    ln(6, Y(1), 208, Y(1), tracejado) + ln(6, Y(0.5), 110, Y(0.5), tracejado) + path(curva(Phi, -3.4, 3.4, NX, Y, 100)) +
    t(94, Y(1) - 7, '1', 10) + t(94, Y(0.5) - 8, '0,5', 10) + t(206, 122, 'z', 13) + t(44, 40, 'Φ(z)', 12);
})();
const tBi = (() => {
  const f = z => (1 + z * z / 5) ** -3, tc = 2.571, tp = (a, b) => curva(f, a, b, NX, NY, Math.max(8, Math.round((b - a) * 14)));
  return area(tp(-3.4, -tc), NYB) + area(tp(tc, 3.4), NYB) + `<path d="M6,${NYB} H214"/>` + path(tp(-3.4, 3.4)) +
    ln(NX(-tc), NYB, NX(-tc), NY(f(tc)), fino) + ln(NX(tc), NYB, NX(tc), NY(f(tc)), fino) +
    marcaZ(0, '0') + marcaZ(-tc, '−t') + marcaZ(tc, '+t') + t(NX(-2.95), 80, 'α/2', 10) + t(NX(2.95), 80, 'α/2', 10) + t(192, 18, 't (gl)', 11);
})();
const quiQuadDir = (() => {
  const g = u => u ** 1.5 * Math.exp(-u / 2); let m = 0; for (let u = 0; u < 20; u += 0.05) m = Math.max(m, g(u));
  const X = u => OX + u * 12, Y = v => OY - 90 * v / m, c = 11.07;
  return area(curva(g, c, 15.5, X, Y, 30), OY) + eixoPos + path(curva(g, 0, 15.5, X, Y, 100)) + ln(X(c), OY, X(c), Y(g(c)), fino) + tiq(X(c)) +
    t(X(c), 122, sub('χ²', 'c'), 11) + t(X(13), Y(g(13)) - 14, 'α', 13) + t(206, 122, 'χ²', 13) + t(150, 24, 'gl = 5', 10);
})();
const fDir = (() => {
  const d1 = 5, d2 = 10, f = u => u <= 0 ? 0 : u ** (d1 / 2 - 1) * (1 + d1 * u / d2) ** (-(d1 + d2) / 2);
  let m = 0; for (let u = 0.01; u < 5; u += 0.01) m = Math.max(m, f(u));
  const X = u => OX + u * 38, Y = v => OY - 92 * v / m, c = 3.33;
  return area(curva(f, c, 5, X, Y, 30), OY) + eixoPos + path(curva(f, 0, 5, X, Y, 100)) + ln(X(c), OY, X(c), Y(f(c)), fino) + tiq(X(c)) +
    t(X(c), 122, sub('F', 'c'), 11) + t(X(3.9), Y(f(3.9)) - 14, 'α', 13) + t(206, 122, 'F', 13);
})();
const errosTipo = (() => {
  const s = 0.85, c = 0.35, X = z => 110 + z * 28, YB = 108, Y = v => YB - 80 * v;
  const f0 = z => fN((z + 1.2) / s), f1 = z => fN((z - 1.2) / s);
  const alfa = curva(f0, c, 3.6, X, Y, 40), beta = curva(f1, -3.6, c, X, Y, 40);
  return `<path d="${P([[X(c), YB], ...alfa, [X(3.6), YB]])} Z" fill="#C" fill-opacity=".55" stroke="none"/>` + area(beta, YB) +
    `<path d="M4,${YB} H216"/>` + path(curva(f0, -3.7, 3.7, X, Y, 120)) + path(curva(f1, -3.7, 3.7, X, Y, 120), desv) +
    ln(X(c), YB + 4, X(c), 18, ' stroke-width="1.8"') + t(X(c), 10, 'c', 11) + t(X(-1.2), 18, 'H₀', 12) + t(X(1.2), 18, 'H₁', 12) +
    t(X(0.95), 120, 'α', 12) + t(X(-0.25), 120, 'β', 12);
})();

// ---------- Mais distribuições ----------
const barrasK = (probs, k0, x0, dx, w) => {
  const m = Math.max(...probs);
  return probs.map((p, k) => { const x = x0 + k * dx, hh = 90 * p / m; return `<rect x="${r1(x - w / 2)}" y="${r1(OY - hh)}" width="${w}" height="${r1(hh)}" fill="#C" fill-opacity=".25" stroke-width="1.8"/>` + t(x, 121, String(k0 + k), 9); }).join('');
};
const binomialSim = (() => { const n = 10, pr = []; for (let k = 0; k <= n; k++) pr.push(fat(n) / (fat(k) * fat(n - k)) / 1024); return eixoPos + barrasDiscretas(pr, 34, 16, 10); })();
const geometrica = (() => { const pr = []; for (let k = 1; k <= 10; k++) pr.push(0.3 * 0.7 ** (k - 1)); return eixoPos + barrasK(pr, 1, 34, 17, 10); })();
const unifDiscreta = eixoPos + barrasK([1, 1, 1, 1, 1, 1], 1, 42, 28, 14) + ln(OX, 20, 190, 20, tracejado) + t(204, 20, '1/6', 10);
const weibull = (() => {
  const X = u => OX + u * 62, Y = v => OY - 56 * Math.min(v, 1.6), w = k => u => k * u ** (k - 1) * Math.exp(-(u ** k));
  return eixoPos + path(curva(w(0.8), 0.03, 3, X, Y, 120)) + path(curva(w(1.5), 0, 3, X, Y, 100), desv) + path(curva(w(3), 0, 3, X, Y, 100), pontilhado) +
    leg(140, 16, 'k = 0,8') + leg(140, 30, 'k = 1,5', desv) + leg(140, 44, 'k = 3', pontilhado) + t(206, 122, 'x', 13);
})();
const gama = (() => {
  const X = u => OX + u * 13, Y = v => OY - 230 * v, g = k => u => u ** (k - 1) * Math.exp(-u) / fat(k - 1);
  return eixoPos + path(curva(g(2), 0, 14.5, X, Y, 120)) + path(curva(g(3), 0, 14.5, X, Y, 120), desv) + path(curva(g(6), 0, 14.5, X, Y, 120), pontilhado) +
    leg(140, 16, 'k = 2') + leg(140, 30, 'k = 3', desv) + leg(140, 44, 'k = 6', pontilhado) + t(206, 122, 'x', 13);
})();
const expAcum = (() => {
  const X = u => OX + u * 36, Y = v => OY - 90 * v;
  return eixoPos + ln(OX, Y(1), 206, Y(1), tracejado) + path(curva(u => 1 - Math.exp(-u), 0, 5.2, X, Y)) + t(10, Y(1), '1', 10) + t(206, 122, 'x', 13) + t(140, 66, 'F(x)', 12);
})();
const triangular = (() => {
  const a = 40, c = 92, b = 196, top = 28;
  return eixoPos + `<path d="M${a},${OY} L${c},${top} L${b},${OY} Z"${sombra}/>` + `<path d="M${OX},${OY} H${a} L${c},${top} L${b},${OY} H206"/>` +
    ln(c, top, c, OY, tracejado) + t(a, 122, 'a', 12) + t(c, 122, 'c', 12) + t(b, 122, 'b', 12) + t(c + 6, top - 14, '2/(b − a)', 10);
})();
const beta = (() => {
  const X = u => OX + u * 180, Y = v => OY - 36 * v;
  const b25 = u => 30 * u * (1 - u) ** 4, b52 = u => 30 * u ** 4 * (1 - u), b22 = u => 6 * u * (1 - u);
  return eixoPos + path(curva(b25, 0, 1, X, Y, 100)) + path(curva(b52, 0, 1, X, Y, 100), desv) + path(curva(b22, 0, 1, X, Y, 100), pontilhado) +
    tiq(X(1)) + t(OX, 122, '0', 10) + t(X(1), 122, '1', 10) + t(58, 11, '(2, 5)', 10) + t(162, 11, '(5, 2)', 10) + t(110, 46, '(2, 2)', 10);
})();
const tlc = (() => {
  const nc = (s, est) => path(curva(z => 84 * 0.25 / s * Math.exp(-z * z / (2 * s * s)), -3.4, 3.4, NX, v => NYB - v, 160), est);
  return `<path d="M6,${NYB} H214"/>` + nc(1, pontilhado) + nc(0.5, desv) + nc(0.25, '') + marcaZ(0, 'μ') +
    leg(8, 14, 'n = 16') + leg(8, 28, 'n = 4', desv) + leg(8, 42, 'n = 1', pontilhado);
})();
const fdaDiscreta = (() => {
  const F = [0.1, 0.3, 0.6, 0.85, 1], xs = [44, 78, 112, 146, 180], Y = v => OY - 90 * v;
  let s = eixoPos + ln(OX, Y(1), 206, Y(1), tracejado) + t(10, Y(1), '1', 10) + `<path d="M${OX},${OY} H${xs[0] - 4}"/>` + `<circle cx="${xs[0]}" cy="${OY}" r="3.5" stroke-width="1.8"/>`;
  F.forEach((v, i) => {
    const x2 = i < 4 ? xs[i + 1] - 4 : 204;
    s += `<path d="M${xs[i]},${r1(Y(v))} H${x2}"/>` + pt(xs[i], Y(v), 3.5) + t(xs[i], 122, sub('x', String(i + 1)), 11);
    if (i < 4) s += `<circle cx="${xs[i + 1]}" cy="${r1(Y(v))}" r="3.5" stroke-width="1.8"/>`;
  });
  return s;
})();

// ---------- Mais gráficos ----------
const histNormal = histograma + path(curva(fN, -2.5, 2.5, z => 120 + z * 36, v => GY - 108 * v, 80), ' stroke-width="2"');
const barrasH = eixos(40, 140, 214, 6) + [120, 160, 70, 140, 95].map((v, i) => `<rect x="40" y="${16 + i * 24}" width="${v}" height="16" fill="#C" fill-opacity=".25"/>` + t(28, 24 + i * 24, 'ABCDE'[i], 10)).join('');
const barrasEmpilh = eixoG + [[40, 30, 25], [55, 20, 35], [30, 40, 20], [50, 35, 30]].map((seg, i) => {
  const x = 40 + i * 44, op = ['.55', '.2', '0']; let y = GY, s = '';
  seg.forEach((h, j) => { y -= h; s += `<rect x="${x}" y="${y}" width="26" height="${h}" fill="#C" fill-opacity="${op[j]}"/>`; });
  return s + t(x + 13, 141, String(i + 1), 10);
}).join('');
const rosca = (() => {
  const c = 70, R = 62, r = 32, pol = (a, q) => `${r1(c + q * Math.sin(a * Math.PI / 180))},${r1(c - q * Math.cos(a * Math.PI / 180))}`;
  return `<path d="M${pol(0, R)} A${R},${R} 0 0 1 ${pol(110, R)} L${pol(110, r)} A${r},${r} 0 0 0 ${pol(0, r)} Z"${sombra}/>` + `<circle cx="${c}" cy="${c}" r="${R}"/><circle cx="${c}" cy="${c}" r="${r}"/>` +
    [0, 110, 200, 290].map(a => `<path d="M${pol(a, r)} L${pol(a, R)}" stroke-width="2"/>`).join('');
})();
const pizzaDestaque = (() => {
  const c = 72, R = 58, pol = (a, q, dx = 0, dy = 0) => `${r1(c + dx + q * Math.sin(a * Math.PI / 180))},${r1(c + dy - q * Math.cos(a * Math.PI / 180))}`;
  const fatia = (a, b, dx = 0, dy = 0, ex = '') => `<path d="M${r1(c + dx)},${r1(c + dy)} L${pol(a, R, dx, dy)} A${R},${R} 0 ${b - a > 180 ? 1 : 0} 1 ${pol(b, R, dx, dy)} Z"${ex}/>`;
  const m = 50 * Math.PI / 180, dx = 10 * Math.sin(m), dy = -10 * Math.cos(m);
  return fatia(0, 100, dx, dy, ' fill="#C" fill-opacity=".25"') + fatia(100, 190) + fatia(190, 280) + fatia(280, 360);
})();
const linhas2 = (() => {
  const a = [100, 92, 84, 88, 70, 64, 52, 46, 36], b = [64, 70, 62, 76, 80, 74, 88, 92, 98];
  const pa = a.map((y, i) => [40 + i * 20, y]), pb = b.map((y, i) => [40 + i * 20, y]);
  const quad = (x, y) => `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="#C" stroke="none"/>`;
  return eixoG + path(pa) + pa.map(([x, y]) => pt(x, y)).join('') + path(pb, desv) + pb.map(([x, y]) => quad(x, y)).join('') +
    ln(32, 14, 50, 14) + pt(41, 14) + t(58, 14, 'A', 10) + ln(70, 14, 88, 14, desv) + quad(79, 14) + t(96, 14, 'B', 10);
})();
const grafArea = (() => {
  const ys = [96, 84, 90, 70, 74, 56, 62, 44, 50, 36], pts = ys.map((y, i) => [30 + i * 19, y]);
  return eixoG + `<path d="${P([[30, GY], ...pts, [201, GY]])} Z"${sombra}/>` + path(pts);
})();
const mapX = x => mapD([x, 0])[0], mapY = y => mapD([0, y])[1];
const dispQuad = (() => {
  const r = rng(41), f = x => 0.85 - 2.6 * (x - 0.5) ** 2; let s = '';
  for (let i = 0; i < 20; i++) { const x = 0.05 + 0.9 * r(); s += pt(...mapD([x, Math.min(0.95, Math.max(0.05, f(x) + 0.05 * gauss(r)))])); }
  return eixoD + s + path(curva(f, 0.02, 0.98, mapX, mapY, 50));
})();
const minimosQuad = (() => {
  const r = rng(9), b0 = 0.15, b1 = 0.7; let s = '', d = '';
  for (let i = 0; i < 9; i++) {
    const x = 0.08 + i * 0.105, y = Math.min(0.95, Math.max(0.05, b0 + b1 * x + 0.09 * gauss(r)));
    d += `M${r1(mapX(x))},${r1(mapY(y))} V${r1(mapY(b0 + b1 * x))} `; s += pt(mapX(x), mapY(y), 3.2);
  }
  return eixoD + ln(...mapD([0, b0]), ...mapD([1, b0 + b1])) + `<path d="${d}"${tracejado}/>` + s + t(74, 18, 'ŷ = a + bx', 11);
})();
const eixoRes = yc => `<path d="M${DX},134 V12"/>` + head(DX, 6, -90, 9) + `<path d="M${DX},${yc} H170"/>` + head(176, yc, 0, 9) + t(10, yc, '0', 11);
const residuosFunil = (() => {
  const r = rng(77), yc = 72; let s = '';
  for (let i = 0; i < 26; i++) { const x = 0.04 + 0.92 * i / 25, e = Math.max(-0.48, Math.min(0.48, (0.03 + 0.3 * x) * gauss(r))); s += pt(DX + 12 + x * 140, yc - e * 120); }
  return eixoRes(yc) + s;
})();
const residuosCurva = (() => {
  const r = rng(52), yc = 72; let s = '';
  for (let i = 0; i < 24; i++) { const x = 0.04 + 0.92 * i / 23, e = 1.6 * (x - 0.5) ** 2 - 0.13 + 0.04 * gauss(r); s += pt(DX + 12 + x * 140, yc - e * 120); }
  return eixoRes(yc) + s;
})();
const bandaIC = (() => {
  const f = x => 0.125 + 0.75 * x, h = x => 0.06 + 0.35 * (x - 0.5) ** 2;
  return eixoD + nuvem(pontos(13, 0.75, 0.07)) + ln(...mapD([0, 0.125]), ...mapD([1, 0.875])) +
    path(curva(x => f(x) + h(x), 0, 1, mapX, mapY, 40), tracejado) + path(curva(x => f(x) - h(x), 0, 1, mapX, mapY, 40), tracejado);
})();
const boxAnotado = `<rect x="74" y="38" width="72" height="24"/>` + ln(104, 38, 104, 62, ' stroke-width="3"') +
  `<path d="M24,50 H74 M146,50 H196 M24,42 V58 M196,42 V58"/>` + `<path d="M24,62 V68 M74,62 V68 M104,62 V68 M146,62 V68 M196,62 V68"${fino}/>` +
  t(24, 78, 'Mín', 10) + t(74, 78, 'Q1', 10) + t(104, 78, 'Md', 10) + t(146, 78, 'Q3', 10) + t(196, 78, 'Máx', 10) + cota(74, 146, 22, 'AIQ');
const violino = (() => {
  const vio = (xc, f, y0, y1, W) => {
    const n = 48, R = [], L = [];
    for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n, w = W * f(i / n); R.push([xc + w, y]); L.unshift([xc - w, y]); }
    return `<path d="${P([...R, ...L])} Z"/>`;
  };
  const f1 = u => Math.exp(-((u - 0.5) ** 2) / (2 * 0.16 ** 2));
  const f2 = u => Math.min(1, 0.95 * Math.exp(-((u - 0.3) ** 2) / (2 * 0.09 ** 2)) + 0.8 * Math.exp(-((u - 0.72) ** 2) / (2 * 0.1 ** 2)));
  const caixa = (xc, a, b, md) => `<rect x="${xc - 4}" y="${a}" width="8" height="${b - a}" fill="#C" fill-opacity=".35" stroke-width="1.4"/>` + pt(xc, md, 3.5);
  let tk = ''; for (let y = 136; y >= 26; y -= 22) tk += `M16,${y} H24 `;
  return `<path d="M20,156 V12 M20,156 H190"/>` + head(20, 6, -90, 9) + `<path d="${tk}"${fino}/>` +
    vio(72, f1, 16, 148, 32) + caixa(72, 69, 95, 82) + vio(148, f2, 16, 148, 30) + caixa(148, 50, 112, 76) + t(72, 166, 'A', 11) + t(148, 166, 'B', 11);
})();
const dotPlot = (() => {
  const c = [1, 3, 5, 6, 4, 2, 1]; let s = `<path d="M10,96 H210"/>`, tk = '';
  c.forEach((n, i) => { const x = 30 + i * 27; tk += `M${x},92 V100 `; for (let k = 0; k < n; k++) s += `<circle cx="${x}" cy="${86 - k * 12}" r="5" fill="#C" stroke="none"/>`; s += t(x, 110, String(i + 1), 10); });
  return s + `<path d="${tk}"${fino}/>`;
})();
const icAmostras = (() => {
  const r = rng(21), mu = 110, h = 40; let s = ln(mu, 6, mu, 158, tracejado) + t(mu, 168, 'μ', 13);
  for (let i = 0; i < 12; i++) {
    const y = 14 + i * 12.5, fora = i === 4 || i === 9;
    let c = mu + Math.max(-32, Math.min(32, 22 * gauss(r)));
    if (i === 4) c = mu + 58; if (i === 9) c = mu - 56;
    s += ln(c - h, y, c + h, y, fora ? ' stroke-width="3.2"' : ' stroke-width="1.8"') + `<path d="M${r1(c - h)},${y - 3.5} V${y + 3.5} M${r1(c + h)},${y - 3.5} V${y + 3.5}"${fino}/>` + pt(c, y, 2.6);
  }
  return s;
})();
const barrasErro = eixoG + [[70, 12], [95, 16], [55, 10], [85, 14]].map(([hh, e], i) => {
  const x = 40 + i * 44, xc = x + 13, yt = GY - hh;
  return `<rect x="${x}" y="${yt}" width="26" height="${hh}" fill="#C" fill-opacity=".25"/>` + `<path d="M${xc},${yt - e} V${yt + e} M${xc - 6},${yt - e} H${xc + 6} M${xc - 6},${yt + e} H${xc + 6}" stroke-width="1.8"/>` + t(xc, 141, 'ABCD'[i], 10);
}).join('');

// ---------- Controle de qualidade ----------
const cartaZonas = (() => {
  const lc = 75, sg = 18, x0 = 24, x1 = 200, fraco = ' stroke-width="1.1" stroke-dasharray="2 4"', limite = ' stroke-dasharray="7 5" stroke-width="2"';
  let s = ln(x0, lc - 3 * sg, x1, lc - 3 * sg, limite) + ln(x0, lc + 3 * sg, x1, lc + 3 * sg, limite) + ln(x0, lc, x1, lc, ' stroke-width="2"');
  for (const k of [-2, -1, 1, 2]) s += ln(x0, lc + k * sg, x1, lc + k * sg, fraco);
  for (const [k, z] of [[0.5, 'C'], [1.5, 'B'], [2.5, 'A']]) s += t(12, lc - k * sg, z, 10) + t(12, lc + k * sg, z, 10);
  const ys = [70, 62, 84, 78, 66, 90, 72, 58, 80, 88, 64, 76, 70], pts = ys.map((y, i) => [32 + i * 13.5, y]);
  return s + path(pts, ' stroke-width="1.6"') + pts.map(([x, y]) => pt(x, y, 2.8)).join('') + t(222, lc - 3 * sg, 'LSC', 11) + t(222, lc, 'LC', 11) + t(222, lc + 3 * sg, 'LIC', 11);
})();
const cartaP = (() => {
  const hs = [30, 36, 26, 32, 40, 28, 34, 24, 30, 38, 28, 32], lc = 64, up = [], dn = [];
  hs.forEach((h, i) => { const x = 14 + i * 15; up.push([x, lc - h], [x + 15, lc - h]); dn.push([x, lc + h], [x + 15, lc + h]); });
  const ys = [60, 52, 74, 66, 46, 70, 58, 80, 62, 50, 68, 72], pts = ys.map((y, i) => [21.5 + i * 15, y]);
  return path(up, ' stroke-dasharray="7 5" stroke-width="2"') + path(dn, ' stroke-dasharray="7 5" stroke-width="2"') + ln(14, lc, 194, lc, ' stroke-width="2"') +
    path(pts, ' stroke-width="1.6"') + pts.map(([x, y]) => pt(x, y, 2.8)).join('') + t(214, 26, 'LSC', 11) + t(214, lc, 'LC', 11) + t(214, 102, 'LIC', 11);
})();
const capabilidade = nBase + ln(NX(0), NYB, NX(0), NY(1), tracejado) + ln(NX(-3.25), NYB + 4, NX(-3.25), 18, ' stroke-width="2.4"') + ln(NX(3.25), NYB + 4, NX(3.25), 18, ' stroke-width="2.4"') +
  t(NX(-3.25), 9, 'LIE', 11) + t(NX(3.25), 9, 'LSE', 11) + marcaZ(0, 'μ') + marcaZ(-3, '−3σ') + marcaZ(3, '+3σ');

// ---------- Probabilidade e amostragem ----------
const vennS = (d, s, ex = '') => `<path d="${d}" fill="#C" fill-opacity=".3" stroke="none"${ex}/>` + venn2 + t(188, 20, s, 12);
const vennInter = vennS('M110,28.1 A50,50 0 0 1 110,115.9 A50,50 0 0 1 110,28.1 Z', 'A ∩ B');
const vennUniao = vennS('M110,28.1 A50,50 0 1 0 110,115.9 A50,50 0 1 0 110,28.1 Z', 'A ∪ B');
const vennDif = vennS('M110,28.1 A50,50 0 1 0 110,115.9 A50,50 0 0 1 110,28.1 Z', 'A − B');
const vennCompl = vennS('M4,4 H216 V136 H4 Z M36,72 A50,50 0 1 0 136,72 A50,50 0 1 0 36,72 Z', 'Aᶜ', ' fill-rule="evenodd"');
const vennDisj = `<rect x="4" y="4" width="212" height="132" rx="4"/><circle cx="66" cy="76" r="42"/><circle cx="154" cy="76" r="42"/>` +
  T(66, 76, 'A', 18) + T(154, 76, 'B', 18) + T(20, 20, 'Ω', 16) + t(110, 20, 'A ∩ B = ∅', 12);
const vennSub = `<rect x="4" y="4" width="212" height="132" rx="4"/><circle cx="104" cy="72" r="60"/><circle cx="124" cy="84" r="28" fill="#C" fill-opacity=".2"/>` +
  T(72, 52, 'A', 18) + T(124, 84, 'B', 18) + T(20, 20, 'Ω', 16) + t(188, 20, 'B ⊂ A', 12);
const arvoreP = `<circle cx="12" cy="80" r="3.5" fill="#C"/>` +
  `<path d="M16,78 L88,42 M16,82 L88,118 M112,40 L196,18 M112,40 L196,62 M112,120 L196,98 M112,120 L196,142"/>` +
  T(100, 40, 'A', 15) + T(100, 120, 'Aᶜ', 15) + T(208, 18, 'B', 14) + T(210, 62, 'Bᶜ', 14) + T(208, 98, 'B', 14) + T(210, 142, 'Bᶜ', 14) +
  t(38, 46, 'P(A)', 10) + t(38, 116, 'P(Aᶜ)', 10) + t(148, 16, 'P(B|A)', 9) + t(150, 62, 'P(Bᶜ|A)', 9) + t(148, 98, 'P(B|Aᶜ)', 9) + t(150, 144, 'P(Bᶜ|Aᶜ)', 9);
const tabelaFreq = (() => {
  const xs = [4, 74, 124, 174, 226]; let g = '';
  for (const x of xs.slice(1, -1)) g += `M${x},4 V140 `;
  for (let y = 52; y < 130; y += 22) g += `M4,${y} H226 `;
  return `<rect x="4" y="4" width="222" height="136"/>` + `<path d="${g}" stroke-width="1.4"/>` + ln(4, 30, 226, 30, ' stroke-width="2.2"') +
    t(39, 17, 'Classe', 12) + t(99, 15, sub('f', 'i'), 13) + t(149, 15, sub('fr', 'i'), 13) + t(200, 15, sub('F', 'i'), 13);
})();
const amostEstrat = (() => {
  const r = rng(61), esc = [[1, 4, 7], [0, 5], [2, 6, 8]];
  let s = `<rect x="4" y="4" width="192" height="120"/><path d="M4,44 H196 M4,84 H196 M36,4 V124" stroke-width="1.8"/>`;
  for (let e = 0; e < 3; e++) {
    s += t(20, 22 + e * 40, sub('E', String(e + 1)), 13);
    for (let j = 0; j < 9; j++) { const x = 50 + j * 17 + (r() - 0.5) * 6, y = 24 + e * 40 + (r() - 0.5) * 16; s += esc[e].includes(j) ? pt(x, y, 4) : `<circle cx="${r1(x)}" cy="${r1(y)}" r="4" stroke-width="1.6"/>`; }
  }
  return s;
})();
const amostCong = (() => {
  const r = rng(29); let s = '';
  [[40, 32], [110, 32], [180, 32], [40, 92], [110, 92], [180, 92]].forEach(([cx, cy], i) => {
    const sel = i === 1 || i === 3;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="32" ry="24"${sel ? ' stroke-width="3" fill="#C" fill-opacity=".15"' : ' stroke-width="1.8"'}/>`;
    for (let k = 0; k < 5; k++) { const a = r() * 2 * Math.PI, q = 0.25 + 0.5 * r(); s += pt(cx + 26 * q * Math.cos(a), cy + 18 * q * Math.sin(a), 2.8); }
  });
  return s;
})();
const amostSist = (() => {
  let s = '';
  for (let j = 0; j < 15; j++) { const x = 12 + j * 14.6; s += j % 3 === 1 ? pt(x, 42, 5) : `<circle cx="${r1(x)}" cy="42" r="5" stroke-width="1.6"/>`; }
  return s + cota(12 + 14.6, 12 + 4 * 14.6, 18, 'k', 12);
})();
const roleta = (() => {
  const c = 65, R = 58, pol = (a, q) => [r1(c + q * Math.sin(a * Math.PI / 180)), r1(c - q * Math.cos(a * Math.PI / 180))];
  return `<path d="M${c},${c} L${pol(90, R)} A${R},${R} 0 0 1 ${pol(200, R)} Z"${sombra}/>` + `<circle cx="${c}" cy="${c}" r="${R}"/>` +
    [0, 90, 200, 260].map(a => `<path d="M${c},${c} L${pol(a, R)}" stroke-width="2"/>`).join('') +
    `<path d="M${c},${c} L${pol(35, 32)}" stroke-width="3"/>` + head(...pol(35, 44), -55, 14) + `<circle cx="${c}" cy="${c}" r="5" fill="#C"/>`;
})();

export default {
  id: 'estat', nome: 'Estatística e gráficos',
  secoes: [
    ['Eixos e grades', [
      ['es-eixo-1q', 'Eixos (1º quadrante)', 200, 160, eixo1q],
      ['es-eixo-4q', 'Eixos (4 quadrantes)', 200, 200, eixo4q],
      ['es-reta', 'Reta numérica', 240, 50, reta],
      ['es-grade', 'Eixos com grade', 190, 146, grade],
      ['es-papel-normal', 'Papel de probabilidade normal', 200, 202, papelNormal],
      ['es-semilog', 'Eixos semilog', 200, 182, semilog],
      ['es-loglog', 'Eixos log-log', 200, 194, loglog],
    ]],
    ['Distribuições', [
      ['es-normal', 'Curva normal (μ, σ)', 220, 126, normal],
      ['es-normal-dir', 'Normal: cauda à direita', 220, 126, normalDir],
      ['es-normal-esq', 'Normal: cauda à esquerda', 220, 126, normalEsq],
      ['es-normal-bi', 'Normal: bilateral', 220, 126, normalBi],
      ['es-t-normal', 't de Student × normal', 220, 126, tNormal],
      ['es-quiquad', 'Qui-quadrado', 220, 130, quiQuad],
      ['es-f', 'Distribuição F', 220, 130, distF],
      ['es-exponencial', 'Exponencial', 220, 130, exponencial],
      ['es-uniforme', 'Uniforme', 220, 130, uniforme],
      ['es-binomial', 'Binomial (barras)', 220, 130, binomial],
      ['es-poisson', 'Poisson (barras)', 220, 130, poisson],
      ['es-assim-pos', 'Assimetria positiva', 220, 140, assimetria(false)],
      ['es-assim-neg', 'Assimetria negativa', 220, 140, assimetria(true)],
      ['es-curtose', 'Curtose', 230, 116, curtose],
      ['es-bimodal', 'Bimodal', 220, 110, bimodal],
    ]],
    ['Gráficos', [
      ['es-histograma', 'Histograma', 220, 140, histograma],
      ['es-poligono', 'Polígono de frequência', 220, 140, poligono],
      ['es-ogiva', 'Ogiva (acumulada)', 220, 140, ogiva],
      ['es-box-h', 'Boxplot horizontal', 216, 84, boxH],
      ['es-box-v', 'Boxplot vertical', 126, 200, boxV],
      ['es-box-comp', 'Boxplots comparativos', 220, 150, boxComp],
      ['es-disp-reta', 'Dispersão com reta', 180, 140, dispReta],
      ['es-corr-pos', 'Correlação positiva', 180, 140, corrPos],
      ['es-corr-neg', 'Correlação negativa', 180, 140, corrNeg],
      ['es-corr-nula', 'Sem correlação', 180, 140, corrNula],
      ['es-residuos', 'Gráfico de resíduos', 180, 140, residuos],
      ['es-barras', 'Gráfico de barras', 220, 150, barras],
      ['es-barras-agrup', 'Barras agrupadas', 220, 150, barrasAgrup],
      ['es-pizza', 'Pizza (setores)', 140, 140, pizza],
      ['es-linha', 'Série temporal', 220, 150, linhaTempo],
      ['es-ramo-folhas', 'Ramo e folhas', 160, 190, ramoFolhas],
      ['es-pareto', 'Diagrama de Pareto', 230, 140, pareto],
      ['es-controle', 'Gráfico de controle', 232, 120, controle],
      ['es-qqplot', 'QQ-plot', 180, 140, qqPlot],
    ]],
    ['Probabilidade e amostragem', [
      ['es-venn2', 'Venn (2 conjuntos)', 220, 140, venn2],
      ['es-venn3', 'Venn (3 conjuntos)', 220, 200, venn3],
      ['es-arvore', 'Árvore de probabilidades', 214, 150, arvore],
      ['es-dado', 'Dado', 120, 120, dado],
      ['es-moeda', 'Moeda', 110, 110, moeda],
      ['es-urna', 'Urna com bolas', 120, 144, urna],
      ['es-pop-amostra', 'População → amostra', 240, 130, popAmostra],
      ['es-contingencia', 'Tabela 2×2', 218, 128, contingencia],
    ]],
    ['Curva normal e testes', [
      ['es-normal-regra', 'Regra 68–95–99,7', 220, 174, normalRegra],
      ['es-normal-padrao', 'Normal padrão (z de −3 a 3)', 220, 126, normalPadrao],
      ['es-normal-entre', 'Normal: área entre a e b', 220, 126, normalEntre],
      ['es-normal-acum', 'Normal: área acumulada Φ(z)', 220, 126, normalAcum],
      ['es-normal-ic', 'Normal: confiança (1 − α)', 220, 126, normalIC],
      ['es-normal-medias', 'Duas normais (μ₁ ≠ μ₂)', 220, 126, normalMedias],
      ['es-normal-fda', 'Normal acumulada (curva S)', 220, 130, normalFda],
      ['es-t-bi', 't de Student: bilateral', 220, 126, tBi],
      ['es-quiquad-dir', 'Qui-quadrado: região crítica', 220, 130, quiQuadDir],
      ['es-f-dir', 'F: região crítica', 220, 130, fDir],
      ['es-erros', 'Erros tipo I e II (α, β)', 220, 128, errosTipo],
    ]],
    ['Mais distribuições', [
      ['es-binomial-sim', 'Binomial simétrica (p = 0,5)', 220, 130, binomialSim],
      ['es-geometrica', 'Geométrica (barras)', 220, 130, geometrica],
      ['es-unif-discreta', 'Uniforme discreta (dado)', 220, 130, unifDiscreta],
      ['es-weibull', 'Weibull (vários k)', 220, 130, weibull],
      ['es-gama', 'Gama (vários k)', 220, 130, gama],
      ['es-exp-acum', 'Exponencial acumulada', 220, 130, expAcum],
      ['es-triangular', 'Triangular', 220, 130, triangular],
      ['es-beta', 'Beta (vários parâmetros)', 220, 130, beta],
      ['es-tlc', 'Distribuição amostral da média', 220, 126, tlc],
      ['es-fda-discreta', 'Acumulada discreta (escada)', 220, 130, fdaDiscreta],
    ]],
    ['Mais gráficos', [
      ['es-hist-normal', 'Histograma com curva normal', 220, 140, histNormal],
      ['es-barras-h', 'Barras horizontais', 220, 150, barrasH],
      ['es-barras-empilh', 'Barras empilhadas', 220, 150, barrasEmpilh],
      ['es-rosca', 'Rosca (anel)', 140, 140, rosca],
      ['es-pizza-destaque', 'Pizza com setor destacado', 146, 146, pizzaDestaque],
      ['es-linhas-2', 'Duas séries (linhas)', 220, 150, linhas2],
      ['es-area', 'Gráfico de área', 220, 150, grafArea],
      ['es-disp-quad', 'Dispersão com parábola', 180, 140, dispQuad],
      ['es-minimos-quad', 'Mínimos quadrados (desvios)', 180, 140, minimosQuad],
      ['es-banda-ic', 'Regressão com banda de confiança', 180, 140, bandaIC],
      ['es-residuos-funil', 'Resíduos em funil', 180, 140, residuosFunil],
      ['es-residuos-curva', 'Resíduos com curvatura', 180, 140, residuosCurva],
      ['es-box-anotado', 'Boxplot (Mín, Q1, Md, Q3, Máx)', 220, 86, boxAnotado],
      ['es-violino', 'Gráfico de violino', 200, 174, violino],
      ['es-pontos', 'Gráfico de pontos', 220, 118, dotPlot],
      ['es-ic-amostras', 'Intervalos de confiança (amostras)', 220, 176, icAmostras],
      ['es-barras-erro', 'Barras com erro', 220, 150, barrasErro],
    ]],
    ['Controle de qualidade', [
      ['es-carta-zonas', 'Carta de controle com zonas', 240, 140, cartaZonas],
      ['es-carta-p', 'Carta p (limites variáveis)', 232, 120, cartaP],
      ['es-capabilidade', 'Capacidade do processo', 220, 126, capabilidade],
    ]],
    ['Conjuntos e amostragem', [
      ['es-venn-inter', 'Venn: interseção', 220, 140, vennInter],
      ['es-venn-uniao', 'Venn: união', 220, 140, vennUniao],
      ['es-venn-dif', 'Venn: diferença A − B', 220, 140, vennDif],
      ['es-venn-compl', 'Venn: complementar', 220, 140, vennCompl],
      ['es-venn-disj', 'Eventos mutuamente exclusivos', 220, 140, vennDisj],
      ['es-venn-sub', 'Venn: B contido em A', 220, 140, vennSub],
      ['es-arvore-p', 'Árvore com probabilidades', 222, 160, arvoreP],
      ['es-tabela-freq', 'Tabela de frequências', 230, 144, tabelaFreq],
      ['es-amost-estrat', 'Amostragem estratificada', 200, 128, amostEstrat],
      ['es-amost-cong', 'Amostragem por conglomerados', 220, 124, amostCong],
      ['es-amost-sist', 'Amostragem sistemática', 230, 54, amostSist],
      ['es-roleta', 'Roleta (setores)', 130, 130, roleta],
    ]],
  ],
};
