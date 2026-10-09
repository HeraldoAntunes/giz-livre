// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Matemática e Geometria (prefixo 'mat-'): figuras com marcas e rótulos, do fundamental ao superior; tudo calculado aqui.
import { T, head } from './base.js';

// ---------- utilidades ----------
const D = Math.PI / 180;
const r1 = v => +v.toFixed(1);
const f = p => `${r1(p[0])},${r1(p[1])}`;
const pl = (pts, extra = '') => `<path d="M${pts.map(f).join(' L')}"${extra}/>`;
const pg = (pts, extra = '') => `<path d="M${pts.map(f).join(' L')} Z"${extra}/>`;
const seg = (A, B, extra = '') => pl([A, B], extra);
const dot = (p, r = 3.2) => `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r}" fill="#C" stroke="none"/>`;
const t = (x, y, s, size = 15) => T(r1(x), r1(y), s, size);
const vi = (x, y, s, size = 17) => t(x, y, s, size).replace('<text ', '<text font-style="italic" ');
const sub = (x, y, b, s, size = 18) => `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" font-family="Segoe UI, Arial, sans-serif" font-weight="600" font-style="italic" text-anchor="middle" dominant-baseline="central" fill="#C" stroke="none">${b}<tspan font-size="14" dy="5">${s}</tspan></text>`;
const fino = ' stroke-width="1.6"';
const trac = ' stroke-width="1.6" stroke-dasharray="5 4"';
const sombra = ' fill="#C" fill-opacity=".22" stroke="none"';
const grosso = ' stroke-width="5"';

const pol = (c, r, a) => [c[0] + r * Math.cos(a * D), c[1] - r * Math.sin(a * D)]; // a em graus, anti-horário
const unit = (A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], n = Math.hypot(dx, dy); return [dx / n, dy / n]; };
const add = (A, u, k = 1) => [A[0] + u[0] * k, A[1] + u[1] * k];
const mid = (A, B) => [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
const foot = (P, A, B) => { const u = unit(A, B), k = (P[0] - A[0]) * u[0] + (P[1] - A[1]) * u[1]; return add(A, u, k); };
const inter = (A, B, C, E) => { // interseção das retas AB e CE
  const d = (A[0] - B[0]) * (C[1] - E[1]) - (A[1] - B[1]) * (C[0] - E[0]);
  const a = A[0] * B[1] - A[1] * B[0], c = C[0] * E[1] - C[1] * E[0];
  return [(a * (C[0] - E[0]) - (A[0] - B[0]) * c) / d, (a * (C[1] - E[1]) - (A[1] - B[1]) * c) / d];
};
const poly = (c, R, n, rot = 90) => Array.from({ length: n }, (_, i) => pol(c, R, rot + i * 360 / n));

// arco de circunferência de a1 até a2 (graus, a2 > a1, anti-horário)
const arco = (c, r, a1, a2, extra = fino) => {
  const p = pol(c, r, a1), q = pol(c, r, a2);
  return `<path d="M${f(p)} A${r},${r} 0 ${a2 - a1 > 180 ? 1 : 0},0 ${f(q)}"${extra}/>`;
};
// marcas de ângulo no vértice V entre os lados VA e VB (o menor dos dois ângulos)
const dirAng = (V, A) => Math.atan2(V[1] - A[1], A[0] - V[0]) / D;
const vao = (V, A, B) => { let a = dirAng(V, A); const b = dirAng(V, B); let d = ((b - a) % 360 + 360) % 360; if (d > 180) { a = b; d = 360 - d; } return [a, d]; };
const angM = (V, A, B, r = 16, n = 1) => { const [a, d] = vao(V, A, B); let s = ''; for (let i = 0; i < n; i++) s += arco(V, r + i * 4, a, a + d); return s; };
const angL = (V, A, B, r) => { const [a, d] = vao(V, A, B); return pol(V, r, a + d / 2); };
const reto = (V, A, B, s = 10) => { const u = unit(V, A), w = unit(V, B); return pl([add(V, u, s), add(add(V, u, s), w, s), add(V, w, s)], fino); };
// tracinhos de congruência no meio do lado AB
const tick = (A, B, n = 1, L = 6) => {
  const u = unit(A, B), p = [-u[1], u[0]], M = mid(A, B); let d = '';
  for (let i = 0; i < n; i++) { const c = add(M, u, (i - (n - 1) / 2) * 5); d += `M${f(add(c, p, L))} L${f(add(c, p, -L))} `; }
  return `<path d="${d.trim()}" stroke-width="1.8"/>`;
};
// seta reta de A até B
const seta = (A, B, w = 2.5, L = 12) => {
  const u = unit(A, B), ang = Math.atan2(u[1], u[0]) / D;
  return `<path d="M${f(A)} L${f(add(B, u, -L * 0.7))}" stroke-width="${w}"/>` + head(r1(B[0]), r1(B[1]), r1(ang), L);
};
// eixos x e y com setas
const eixos = (W, H, ox, oy, rot = true) => `<path d="M6,${oy} H${W - 10} M${ox},${H - 6} V10"/>` + head(W - 4, oy, 0, 9) + head(ox, 4, -90, 9) +
  (rot ? vi(W - 9, oy + 13 > H - 8 ? oy - 13 : oy + 13, 'x', 15) + vi(ox + 12, 11, 'y', 15) : '');
// curva y = fn(u) recortada na faixa [y0, y1] da tela
const curva = (fn, a, b, X, Y, y0, y1, n = 200, extra = '') => {
  let d = '', on = false;
  for (let i = 0; i <= n; i++) {
    const u = a + (b - a) * i / n, y = Y(fn(u));
    if (!isFinite(y) || y < y0 || y > y1) { on = false; continue; }
    d += `${on ? ' L' : ' M'}${r1(X(u))},${r1(y)}`; on = true;
  }
  return `<path d="${d.trim()}"${extra}/>`;
};

// sólido de base poligonal regular em perspectiva: s = 1 prisma, s = 0 pirâmide, 0 < s < 1 tronco
const solido = (n, rot, cx, yb, rx, ry, yt, s) => {
  const B = [], Tp = [];
  for (let i = 0; i < n; i++) { const a = (rot + i * 360 / n) * D; B.push([cx + rx * Math.cos(a), yb - ry * Math.sin(a), Math.sin(a)]); Tp.push([cx + s * rx * Math.cos(a), yt - s * ry * Math.sin(a)]); }
  const xs = B.map(p => p[0]), iMin = xs.indexOf(Math.min(...xs)), iMax = xs.indexOf(Math.max(...xs));
  let vis = '', hid = '';
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, frente = Math.sin((rot + (i + 0.5) * 360 / n) * D) < -1e-6, d = `M${f(B[i])} L${f(B[j])} `;
    if (frente) vis += d; else hid += d;
    const d2 = `M${f(B[i])} L${f(Tp[i])} `;
    if (B[i][2] < -1e-6 || i === iMin || i === iMax) vis += d2; else hid += d2;
  }
  if (s > 0) vis += `M${Tp.map(f).join(' L')} Z`;
  return `<path d="${vis.trim()}"/>` + (hid ? `<path d="${hid.trim()}"${trac}/>` : '');
};

// ---------- Triângulos ----------
const triEqui = (() => {
  const A = [70, 10], B = [10, 114], C = [130, 114];
  return pg([A, B, C]) + tick(A, B) + tick(A, C) + tick(B, C) + angM(A, B, C) + angM(B, A, C) + angM(C, A, B) +
    t(...angL(A, B, C, 32), '60°', 14) + t(...angL(B, A, C, 31), '60°', 14) + t(...angL(C, A, B, 31), '60°', 14);
})();
const triIso = (() => {
  const A = [65, 8], B = [12, 122], C = [118, 122];
  return pg([A, B, C]) + tick(A, B) + tick(A, C) + angM(B, A, C, 18) + angM(C, A, B, 18) + angM(A, B, C, 18, 2);
})();
const triEsc = (() => {
  const A = [44, 10], B = [8, 112], C = [148, 112];
  return pg([A, B, C]) + tick(A, B, 1) + tick(A, C, 2) + tick(B, C, 3) + angM(A, B, C, 14, 1) + angM(B, A, C, 14, 2) + angM(C, A, B, 14, 3);
})();
const triRet = (() => {
  const C = [20, 110], A = [20, 12], B = [146, 110];
  return pg([A, B, C]) + reto(C, A, B, 12) + vi(9, 61, 'b') + vi(83, 124, 'c') + vi(92, 50, 'a') + angM(A, B, C, 16) + angM(B, A, C, 20);
})();
const triAcut = (() => {
  const A = [62, 10], B = [10, 110], C = [132, 110];
  return pg([A, B, C]) + angM(A, B, C) + angM(B, A, C) + angM(C, A, B);
})();
const triObt = (() => {
  const A = [10, 16], B = [64, 90], C = [168, 90];
  return pg([A, B, C]) + angM(B, A, C, 14, 2) + angM(A, B, C, 20) + angM(C, A, B, 30);
})();

// ---------- Quadriláteros e polígonos ----------
const quadrado = (() => {
  const Q = [[14, 12], [104, 12], [104, 102], [14, 102]];
  let s = pg(Q);
  for (let i = 0; i < 4; i++) s += tick(Q[i], Q[(i + 1) % 4]) + reto(Q[i], Q[(i + 1) % 4], Q[(i + 3) % 4], 9);
  return s + seg(Q[0], Q[2], trac) + vi(72, 48, 'd') + vi(59, 116, 'ℓ');
})();
const retangulo = (() => {
  const Q = [[12, 10], [136, 10], [136, 88], [12, 88]];
  let s = pg(Q);
  for (let i = 0; i < 4; i++) s += reto(Q[i], Q[(i + 1) % 4], Q[(i + 3) % 4], 9);
  return s + vi(74, 101, 'b') + vi(149, 49, 'h');
})();
const paralelogramo = (() => {
  const Q = [[40, 12], [162, 12], [132, 90], [10, 90]];
  return pg(Q) + seg([40, 12], [40, 90], trac) + reto([40, 90], [40, 12], [132, 90], 8) +
    tick(Q[0], Q[1]) + tick(Q[3], Q[2]) + tick(Q[1], Q[2], 2) + tick(Q[0], Q[3], 2) + vi(71, 103, 'b') + vi(51, 52, 'h');
})();
const losango = (() => {
  const Q = [[82, 8], [154, 62], [82, 116], [10, 62]];
  let s = pg(Q) + seg(Q[3], Q[1], trac) + seg(Q[0], Q[2], trac) + reto([82, 62], Q[0], Q[1], 8);
  for (let i = 0; i < 4; i++) s += tick(Q[i], Q[(i + 1) % 4]);
  return s + vi(120, 52, 'D') + vi(92, 36, 'd');
})();
const trapezio = (() => {
  const Q = [[52, 24], [120, 24], [162, 98], [10, 98]];
  return pg(Q) + seg([52, 24], [52, 98], trac) + reto([52, 98], [52, 24], [162, 98], 8) +
    vi(86, 11, 'b') + vi(86, 112, 'B') + vi(62, 62, 'h');
})();
const trapRet = (() => {
  const Q = [[10, 22], [88, 22], [140, 100], [10, 100]];
  return pg(Q) + reto(Q[0], Q[1], Q[3], 9) + reto(Q[3], Q[0], Q[2], 9) + vi(49, 10, 'b') + vi(75, 113, 'B') + vi(22, 61, 'h');
})();
const trapIso = (() => {
  const Q = [[46, 12], [114, 12], [150, 88], [10, 88]];
  return pg(Q) + tick(Q[1], Q[2]) + tick(Q[3], Q[0]) + angM(Q[3], Q[0], Q[2], 16) + angM(Q[2], Q[1], Q[3], 16) +
    angM(Q[0], Q[1], Q[3], 12, 2) + angM(Q[1], Q[0], Q[2], 12, 2);
})();
const pipa = (() => {
  const A = [70, 8], B = [122, 50], C = [70, 132], E = [18, 50];
  return pg([A, B, C, E]) + seg(A, C, trac) + seg(E, B, trac) + reto([70, 50], A, B, 8) +
    tick(A, B) + tick(A, E) + tick(B, C, 2) + tick(E, C, 2);
})();
const pentagono = (() => {
  const P = poly([60, 62], 52, 5);
  let s = pg(P);
  for (let i = 0; i < 5; i++) s += tick(P[i], P[(i + 1) % 5]);
  return s + angM(P[0], P[1], P[4], 14) + t(60, 41, '108°', 14);
})();
const hexApotema = (() => {
  const C = [65, 60], P = poly(C, 54, 6, 0), F = mid(P[4], P[5]);
  return pg(P) + seg(C, P[0], fino) + seg(C, F, fino) + reto(F, C, P[5], 8) + dot(C) + vi(92, 50, 'R') + vi(75, 84, 'a');
})();
const poligonos = (() => {
  let s = '';
  [[3, 90], [4, 45], [5, 90], [6, 0], [7, 90], [8, 22.5]].forEach(([n, rot], i) => {
    const c = [36 + (i % 3) * 64, 38 + Math.floor(i / 3) * 66 + (n === 3 ? 6 : 0)];
    s += pg(poly(c, 30, n, rot));
  });
  return s;
})();

// ---------- Círculo e circunferência ----------
const circElementos = (() => {
  const O = [72, 72];
  return `<circle cx="72" cy="72" r="62"/>` + seg([10, 72], [134, 72], fino) + seg(O, pol(O, 62, 60), fino) +
    seg(pol(O, 62, 205), pol(O, 62, 335)) + dot(O) + t(62, 61, 'O', 14) + vi(30, 62, 'd') + vi(77, 39, 'r') + t(72, 112, 'corda', 14);
})();
const setor = (() => {
  const O = [70, 70], P = pol(O, 60, 15), Q = pol(O, 60, 85), d = `M70,70 L${f(P)} A60,60 0 0,0 ${f(Q)} Z`;
  return `<circle cx="70" cy="70" r="60"${fino}/><path d="${d}"${sombra}/><path d="${d}"/>` + arco(O, 18, 15, 85) +
    vi(...pol(O, 30, 50), 'θ') + vi(102, 76, 'r') + dot(O);
})();
const coroa = (() => {
  const O = [70, 70];
  return `<path fill-rule="evenodd" d="M8,70 A62,62 0 1,0 132,70 A62,62 0 1,0 8,70 Z M36,70 A34,34 0 1,0 104,70 A34,34 0 1,0 36,70 Z"${sombra}/>` +
    `<circle cx="70" cy="70" r="62"/><circle cx="70" cy="70" r="34"/>` + seg(O, pol(O, 62, -35), fino) + seg(O, pol(O, 34, 145), fino) + dot(O) +
    vi(...pol(O, 49, -18), 'R') + vi(...pol(O, 22, 175), 'r', 15);
})();
const inscritoCentral = (() => {
  const O = [72, 76], V = pol(O, 62, 90), A = pol(O, 62, 215), B = pol(O, 62, 325);
  return `<circle cx="72" cy="76" r="62"/>` + pl([A, V, B]) + pl([A, O, B], fino) + angM(V, A, B, 18) + angM(O, A, B, 14) +
    vi(72, 44, 'α') + vi(72, 100, '2α', 16) + dot(V) + dot(A) + dot(B) + dot(O);
})();
const tangente = (() => {
  const O = [80, 74], P = [80, 30];
  return `<circle cx="80" cy="74" r="44"/>` + seg([8, 30], [152, 30]) + seg(O, P, fino) + reto(P, O, [152, 30], 9) +
    dot(O) + dot(P) + vi(89, 54, 'r') + vi(146, 18, 't') + t(68, 18, 'T', 14);
})();

// ---------- Ângulos ----------
const angAgudo = (() => { const V = [10, 82], A = [116, 82], B = pol(V, 112, 40); return pl([B, V, A]) + angM(V, A, B, 30) + vi(...pol(V, 44, 20), 'α'); })();
const angReto = (() => { const V = [14, 88]; return pl([[14, 8], V, [94, 88]]) + reto(V, [14, 8], [94, 88], 14) + t(50, 56, '90°'); })();
const angObtuso = (() => { const V = [92, 80], A = [144, 80], B = pol(V, 98, 135); return pl([B, V, A]) + angM(V, A, B, 24) + vi(...pol(V, 40, 67.5), 'α'); })();
const angRaso = (() => { const V = [80, 58]; return seg([8, 58], [152, 58]) + dot(V) + arco(V, 22, 0, 180) + t(80, 22, '180°'); })();
const angCompl = (() => {
  const V = [12, 100], B = pol(V, 92, 35);
  return pl([[12, 8], V, [104, 100]]) + seg(V, B) + reto(V, [104, 100], [12, 8], 9) + arco(V, 28, 0, 35) + arco(V, 36, 35, 90) + arco(V, 40, 35, 90) +
    vi(...pol(V, 46, 15), 'α', 16) + vi(...pol(V, 56, 64), 'β', 16);
})();
const angSupl = (() => {
  const V = [86, 72], B = pol(V, 72, 60);
  return seg([8, 72], [164, 72]) + seg(V, B) + arco(V, 22, 0, 60) + arco(V, 20, 60, 180) + arco(V, 24, 60, 180) +
    vi(...pol(V, 38, 28), 'α', 16) + vi(...pol(V, 40, 122), 'β', 16);
})();
const angOpv = (() => {
  const C = [72, 52];
  return seg(pol(C, 70, 30), pol(C, 70, 210)) + seg(pol(C, 70, 150), pol(C, 70, 330)) + arco(C, 20, -30, 30) + arco(C, 20, 150, 210) +
    arco(C, 18, 30, 150) + arco(C, 22, 30, 150) + arco(C, 18, 210, 330) + arco(C, 22, 210, 330) +
    vi(104, 52, 'α', 16) + vi(40, 52, 'α', 16) + vi(72, 20, 'β', 16) + vi(72, 85, 'β', 16) + dot(C, 2.6);
})();
const paralelasTransv = (() => {
  const I1 = [108.8, 40], I2 = [70.5, 96], a = Math.atan2(120, 82) / D;
  return seg([8, 40], [176, 40]) + seg([8, 96], [176, 96]) + seg([50, 126], [132, 6]) +
    pl([[24, 35], [31, 40], [24, 45]], fino) + pl([[24, 91], [31, 96], [24, 101]], fino) +
    arco(I1, 16, 0, a) + arco(I2, 16, 0, a) + vi(...pol(I1, 29, a / 2), 'α', 15) + vi(...pol(I2, 29, a / 2), 'α', 15) +
    vi(170, 28, 'r', 16) + vi(170, 84, 's', 16) + vi(142, 14, 't', 16);
})();

// ---------- Construções e teoremas ----------
const bissetriz = (() => {
  const V = [12, 108], P1 = [72, 108], P2 = pol(V, 60, 40), Q = [P1[0] + P2[0] - V[0], P1[1] + P2[1] - V[1]];
  return pl([pol(V, 150, 40), V, [154, 108]]) + seg(V, pol(V, 146, 20)) + arco(V, 60, -6, 46) +
    arco(P1, 60, 28, 52) + arco(P2, 60, -12, 12) + arco(V, 26, 0, 20) + arco(V, 30, 20, 40) +
    dot(P1) + dot(P2) + dot(Q) + dot(V);
})();
const mediatriz = (() => {
  const A = [25, 80], B = [125, 80], M = [75, 80];
  return seg(A, B) + seg([75, 8], [75, 126]) + arco(A, 64, 28, 50) + arco(A, 64, -50, -28) + arco(B, 64, 130, 152) + arco(B, 64, 208, 230) +
    tick(A, M) + tick(M, B) + reto(M, [75, 40], B, 8) + dot(A) + dot(B) + t(12, 80, 'A') + t(138, 80, 'B') + vi(85, 16, 'm', 16);
})();
const tales = (() => {
  const x1 = y => 30 + (y - 8) * 40 / 116, x2 = y => 108 + (y - 8) * 60 / 116;
  let s = seg([8, 20], [176, 20]) + seg([8, 60], [176, 60]) + seg([8, 110], [176, 110]) + seg([30, 8], [70, 124]) + seg([108, 8], [168, 124]);
  for (const y of [20, 60, 110]) s += dot([x1(y), y], 2.8) + dot([x2(y), y], 2.8);
  return s + vi(30, 40, 'a') + vi(44, 85, 'b') + vi(134, 38, 'c') + vi(158, 84, 'd');
})();
const pitagoras = (() => {
  const C = [70, 120], A = [70, 72], B = [134, 120];
  return pg([A, B, C], ' fill="#C" fill-opacity=".15"') + pg([[22, 72], A, C, [22, 120]]) + pg([C, B, [134, 184], [70, 184]]) +
    pg([A, B, [182, 56], [118, 8]]) + reto(C, A, B, 9) + t(102, 152, 'a²', 18) + t(46, 96, 'b²', 18) + t(126, 64, 'c²', 18);
})();
const TA = [60, 10], TB = [8, 122], TC = [152, 122];
const alturas = (() => {
  const Fa = foot(TA, TB, TC), Fb = foot(TB, TA, TC), Fc = foot(TC, TA, TB), H = inter(TA, Fa, TB, Fb);
  return pg([TA, TB, TC]) + seg(TA, Fa, trac) + seg(TB, Fb, trac) + seg(TC, Fc, trac) +
    reto(Fa, TA, TC, 8) + reto(Fb, TB, TC, 8) + reto(Fc, TC, TB, 8) + dot(H) + t(H[0] + 12, H[1] - 2, 'H', 14);
})();
const medianas = (() => {
  const Ma = mid(TB, TC), Mb = mid(TA, TC), Mc = mid(TA, TB), G = [(TA[0] + TB[0] + TC[0]) / 3, (TA[1] + TB[1] + TC[1]) / 3];
  return pg([TA, TB, TC]) + seg(TA, Ma, trac) + seg(TB, Mb, trac) + seg(TC, Mc, trac) +
    tick(TB, Ma) + tick(Ma, TC) + tick(TA, Mb, 2) + tick(Mb, TC, 2) + tick(TA, Mc, 3) + tick(Mc, TB, 3) +
    dot(Ma, 2.6) + dot(Mb, 2.6) + dot(Mc, 2.6) + dot(G) + t(G[0] + 4, G[1] - 13, 'G', 14);
})();
const circunscrita = (() => {
  const O = [72, 72], P = [pol(O, 64, 100), pol(O, 64, 215), pol(O, 64, 330)];
  return `<circle cx="72" cy="72" r="64"/>` + pg(P) + seg(O, P[2], trac) + dot(O) + P.map(p => dot(p, 2.8)).join('') + vi(98, 80, 'R', 15) + t(62, 70, 'O', 14);
})();
const inscrita = (() => {
  const a = Math.hypot(TB[0] - TC[0], TB[1] - TC[1]), b = Math.hypot(TA[0] - TC[0], TA[1] - TC[1]), c = Math.hypot(TA[0] - TB[0], TA[1] - TB[1]), p = a + b + c;
  const I = [(a * TA[0] + b * TB[0] + c * TC[0]) / p, (a * TA[1] + b * TB[1] + c * TC[1]) / p], r = TC[1] - I[1], F = [I[0], TC[1]];
  return pg([TA, TB, TC]) + `<circle cx="${r1(I[0])}" cy="${r1(I[1])}" r="${r1(r)}"/>` + seg(I, F, trac) + reto(F, I, TC, 7) + dot(I) +
    vi(I[0] + 9, I[1] + r / 2, 'r', 15);
})();
const semelhanca = (() => {
  const T0 = [[0, 0], [60, 0], [16, -48]];
  const tr = (o, k) => T0.map(p => [o[0] + p[0] * k, o[1] + p[1] * k]);
  const P = tr([10, 100], 1), Q = tr([96, 106], 1.6);
  const marcas = (X, r) => angM(X[0], X[1], X[2], r, 1) + angM(X[1], X[0], X[2], r, 2) + angM(X[2], X[0], X[1], r - 2, 3);
  return pg(P) + pg(Q) + marcas(P, 10) + marcas(Q, 14) + t(82, 74, '~', 24);
})();
const relacoes = (() => {
  const B = [10, 110], C = [190, 110], H = [70, 110], A = [70, 110 - Math.sqrt(60 * 120)];
  return pg([A, B, C]) + seg(A, H, trac) + reto(H, A, C, 8) + reto(A, B, C, 10) +
    vi(40, 123, 'm') + vi(130, 123, 'n') + vi(80, 74, 'h') + vi(30, 61, 'c') + vi(138, 57, 'b');
})();

// ---------- Sólidos geométricos ----------
const cubo = '<path d="M10,44 H94 V128 H10 Z M10,44 L46,10 H130 L94,44 M94,128 L130,94 V10"/>' +
  `<path d="M46,10 V94 H130 M46,94 L10,128"${trac}/>` + seg([10, 128], [130, 10], trac) + vi(52, 139, 'a') + vi(62, 60, 'D');
const paralelep = '<path d="M22,40 H132 V116 H22 Z M22,40 L62,10 H172 L132,40 M132,116 L172,86 V10"/>' +
  `<path d="M62,10 V86 H172 M62,86 L22,116"${trac}/>` + vi(77, 128, 'a') + vi(160, 111, 'b') + vi(11, 78, 'c');
const prismaTri = solido(3, -90, 70, 100, 60, 22, 34, 1) + vi(132, 72, 'h');
const prismaHex = solido(6, 0, 70, 118, 60, 18, 26, 1);
const piramide = solido(4, 20, 74, 112, 64, 22, 10, 0) + seg([74, 10], [74, 112], trac) + dot([74, 112], 2.6) + vi(66, 78, 'h', 15);
const tetraedro = solido(3, 90, 70, 110, 62, 20, 10, 0);
const troncoPir = solido(4, 20, 74, 112, 64, 22, 40, 0.55);
const cilindro = '<ellipse cx="60" cy="22" rx="50" ry="13"/><path d="M10,22 V116 M110,22 V116 M10,116 A50,13 0 0,0 110,116"/>' +
  `<path d="M10,116 A50,13 0 0,1 110,116"${trac}/>` + seg([60, 22], [60, 116], trac) + seg([60, 116], [110, 116], fino) +
  dot([60, 116], 2.6) + vi(85, 105, 'r', 15) + vi(119, 69, 'h', 15);
const cone = '<path d="M10,118 L60,8 L110,118 M10,118 A50,13 0 0,0 110,118"/>' + `<path d="M10,118 A50,13 0 0,1 110,118"${trac}/>` +
  seg([60, 8], [60, 118], trac) + seg([60, 118], [110, 118], fino) + reto([60, 118], [60, 8], [110, 118], 7) + dot([60, 118], 2.6) +
  vi(50, 76, 'h', 15) + vi(87, 107, 'r', 15) + vi(97, 57, 'g', 15);
const esfera = (() => {
  const O = [62, 62];
  return '<circle cx="62" cy="62" r="54"/>' + `<path d="M8,62 A54,15 0 0,0 116,62"${fino}/><path d="M8,62 A54,15 0 0,1 116,62"${trac}/>` +
    seg(O, pol(O, 54, 40), fino) + dot(O) + vi(75, 35, 'r', 15);
})();
const troncoCone = '<ellipse cx="67" cy="28" rx="30" ry="9"/><path d="M37,28 L10,114 M97,28 L124,114 M10,114 A57,15 0 0,0 124,114"/>' +
  `<path d="M10,114 A57,15 0 0,1 124,114"${trac}/>` + seg([67, 28], [67, 114], trac) + seg([67, 114], [124, 114], fino) + seg([67, 28], [97, 28], fino) +
  dot([67, 114], 2.6) + dot([67, 28], 2.4) + vi(96, 104, 'R', 15) + vi(82, 11, 'r', 15) + vi(77, 68, 'h', 15);

// ---------- Planificações ----------
const planCubo = '<path d="M46,6 H86 V46 H166 V86 H86 V126 H46 V86 H6 V46 H46 Z"/>' +
  `<path d="M46,46 H86 M46,86 H86 M46,46 V86 M86,46 V86 M126,46 V86"${trac}/>`;
const planCilindro = '<circle cx="75" cy="22" r="18"/><rect x="18" y="40" width="113" height="80"/><circle cx="75" cy="138" r="18"/>' +
  seg([75, 22], [93, 22], fino) + dot([75, 22], 2.4) + vi(102, 13, 'r', 15) + vi(75, 80, '2πr', 17) + vi(140, 80, 'h', 15);
const planCone = (() => {
  const A = [80, 10], P = pol(A, 90, 240), Q = pol(A, 90, 300);
  return `<path d="M80,10 L${f(P)} A90,90 0 0,0 ${f(Q)} Z"/>` + '<circle cx="80" cy="130" r="30"/>' + seg([80, 130], [110, 130], fino) +
    dot([80, 130], 2.4) + vi(47, 43, 'g', 15) + vi(95, 121, 'r', 15);
})();
const planPiramide = '<path d="M75,10 L100,50 L140,75 L100,100 L75,140 L50,100 L10,75 L50,50 Z"/>' + `<path d="M50,50 H100 V100 H50 Z"${trac}/>`;
const planPrismaTri = '<path d="M24,44 H68 L90,5.9 L112,44 H156 V94 H112 L90,132.1 L68,94 H24 Z"/>' +
  `<path d="M68,44 V94 M112,44 V94 M68,44 H112 M68,94 H112"${trac}/>`;

// ---------- Trigonometria ----------
const cicloTrig = (() => {
  const O = [100, 100], P = pol(O, 76, 50);
  return '<path d="M8,100 H188 M100,192 V12"/>' + head(194, 100, 0, 9) + head(100, 6, -90, 9) + '<circle cx="100" cy="100" r="76"/>' +
    seg(O, P) + seg(P, [P[0], 100], trac) + seg(P, [100, P[1]], trac) + `<path d="M100,100 H${r1(P[0])}"${grosso}/><path d="M100,100 V${r1(P[1])}"${grosso}/>` +
    arco(O, 20, 0, 50) + vi(...pol(O, 33, 25), 'θ', 15) + dot(P) + t(160, 31, 'P') + t(124, 114, 'cos', 14) + t(80, 70, 'sen', 14) +
    t(184, 113, '1', 14) + t(90, 21, '1', 14);
})();
const cicloNotaveis = (() => {
  const O = [126, 110];
  let s = '<path d="M8,110 H222 M126,212 V14"/>' + head(228, 110, 0, 9) + head(126, 8, -90, 9) + '<circle cx="126" cy="110" r="78"/>';
  for (const a of [30, 45, 60]) s += seg(O, pol(O, 78, a), fino);
  for (let k = 0; k < 4; k++) for (const a of [0, 30, 45, 60]) s += dot(pol(O, 78, k * 90 + a), 3);
  return s + t(...pol(O, 97, 30), '30°', 14) + t(...pol(O, 97, 45), '45°', 14) + t(...pol(O, 97, 60), '60°', 14) +
    t(148, 22, '90°', 14) + t(214, 98, '0°', 14) + t(26, 98, '180°', 14) + t(150, 200, '270°', 14);
})();
const cicloTg = (() => {
  const O = [100, 100], P = pol(O, 76, 40), Tt = [176, 100 - 76 * Math.tan(40 * D)];
  return '<path d="M8,100 H196 M100,192 V12"/>' + head(202, 100, 0, 9) + head(100, 6, -90, 9) + '<circle cx="100" cy="100" r="76"/>' +
    seg([176, 8], [176, 192], fino) + seg(O, P) + seg(P, Tt, trac) + `<path d="M176,100 V${r1(Tt[1])}"${grosso}/>` +
    arco(O, 20, 0, 40) + vi(...pol(O, 33, 20), 'θ', 15) + dot(P) + dot(Tt) + t(150, 40, 'P') + t(193, 68, 'tg', 15);
})();
const trigTriangulo = (() => {
  const A = [20, 120], C = [150, 120], B = [150, 30], ang = Math.atan2(90, 130) / D;
  return pg([A, B, C]) + reto(C, A, B, 11) + angM(A, B, C, 26) + vi(...pol(A, 40, ang / 2), 'θ', 16) +
    t(85, 136, 'cateto adjacente', 14) + t(185, 66, 'cateto', 14) + t(185, 84, 'oposto', 14) +
    `<g transform="rotate(${r1(-ang)} 78 65)">${t(78, 65, 'hipotenusa', 14)}</g>`;
})();
const grafSen = (() => {
  const X = u => 26 + u * 96 / Math.PI, Y = v => 65 - 46 * v;
  return '<path d="M8,65 H228 M26,124 V10"/>' + head(234, 65, 0, 9) + head(26, 4, -90, 9) + curva(Math.sin, 0, 2 * Math.PI, X, Y, 0, 130) +
    `<path d="M74,61 V69 M122,61 V69 M170,61 V69 M218,61 V69 M22,19 H30 M22,111 H30"${fino}/>` +
    t(74, 80, 'π/2', 14) + t(128, 51, 'π', 15) + t(170, 50, '3π/2', 14) + t(216, 50, '2π', 14) + t(14, 19, '1', 14) + t(12, 111, '−1', 14) + vi(232, 79, 'x', 15);
})();
const grafCos = (() => {
  const X = u => 26 + u * 96 / Math.PI, Y = v => 65 - 46 * v;
  return '<path d="M8,65 H228 M26,124 V10"/>' + head(234, 65, 0, 9) + head(26, 4, -90, 9) + curva(Math.cos, 0, 2 * Math.PI, X, Y, 0, 130) +
    `<path d="M74,61 V69 M122,61 V69 M170,61 V69 M218,61 V69 M22,19 H30 M22,111 H30"${fino}/>` +
    t(88, 50, 'π/2', 14) + t(122, 50, 'π', 15) + t(186, 80, '3π/2', 14) + t(218, 80, '2π', 14) + t(14, 19, '1', 14) + t(12, 111, '−1', 14) + vi(232, 50, 'x', 15);
})();
const grafTg = (() => {
  const X = u => 70 + u * 80 / Math.PI, Y = v => 75 - 18 * v;
  return '<path d="M6,75 H198 M70,142 V10"/>' + head(204, 75, 0, 9) + head(70, 4, -90, 9) +
    `<path d="M30,8 V142 M110,8 V142 M190,8 V142"${trac}/>` + curva(Math.tan, -Math.PI / 2 + 0.01, 3 * Math.PI / 2 - 0.01, X, Y, 8, 142, 400) +
    t(30, 152, '−π/2', 14) + t(110, 152, 'π/2', 14) + t(186, 152, '3π/2', 14) + t(156, 88, 'π', 15);
})();

// ---------- Geometria analítica ----------
const planoPontos = (() => {
  let g = '';
  for (let k = 20; k <= 180; k += 20) if (k !== 100) g += `M${k},14 V186 M14,${k} H186 `;
  return `<path d="${g.trim()}" stroke-width="1" stroke-opacity=".35"/>` + '<path d="M6,100 H188 M100,194 V12"/>' + head(194, 100, 0, 9) + head(100, 6, -90, 9) +
    vi(190, 113, 'x', 15) + vi(113, 9, 'y', 15) + t(91, 111, 'O', 13 + 1) +
    dot([140, 40], 4) + dot([40, 80], 4) + dot([60, 140], 4) + dot([160, 120], 4) +
    t(160, 28, 'A(2, 3)', 14) + t(48, 66, 'B(−3, 1)', 14) + t(60, 155, 'C(−2, −2)', 14) + t(160, 135, 'D(3, −1)', 14);
})();
const distancia = (() => {
  const A = [50, 112], B = [160, 40], Cc = [160, 112];
  return eixos(200, 160, 20, 144) + seg(A, B) + pl([A, Cc, B], trac) + reto(Cc, A, B, 8) + dot(A) + dot(B) +
    t(40, 102, 'A') + t(170, 30, 'B') + vi(97, 64, 'd') + t(105, 126, 'Δx') + t(178, 76, 'Δy');
})();
const retaCoef = (() => {
  const y = x => 130 - 0.6 * (x - 40), P1 = [110, y(110)], P2 = [170, y(170)];
  return '<path d="M8,130 H188 M90,154 V12"/>' + head(194, 130, 0, 9) + head(90, 6, -90, 9) +
    seg([12, y(12)], [192, y(192)]) + pl([P1, [170, P1[1]], P2], trac) + dot(P1) + dot(P2) + dot([90, 100], 3) +
    arco([40, 130], 18, 0, Math.atan(0.6) / D) + vi(67, 121, 'α', 15) + vi(80, 91, 'b', 15) +
    t(140, 100, 'Δx', 14) + t(184, 70, 'Δy', 14) + t(46, 28, 'm = Δy/Δx', 15) + vi(190, 143, 'x', 15);
})();
const retasParalelas = (() => {
  const a = Math.atan(0.8) / D;
  return '<path d="M6,140 H190 M30,154 V10"/>' + head(196, 140, 0, 9) + head(30, 4, -90, 9) +
    seg([32, 141.6], [150, 47.2]) + seg([102, 141.6], [196, 66.4]) + arco([40, 140], 16, 0, a) + arco([110, 140], 16, 0, a) +
    vi(158, 36, 'r', 16) + vi(190, 52, 's', 16) + t(64, 24, 'm₁ = m₂', 15);
})();
const retasPerp = (() => {
  const Q = [100, 70], R1 = pol(Q, 80, 30), R2 = pol(Q, 80, 210), S1 = pol(Q, 70, 120), S2 = pol(Q, 70, 300);
  return '<path d="M6,140 H178 M30,154 V10"/>' + head(184, 140, 0, 9) + head(30, 4, -90, 9) +
    seg(R1, R2) + seg(S1, S2) + reto(Q, R1, S1, 10) + dot(Q, 2.8) + vi(172, 44, 'r', 16) + vi(54, 16, 's', 16) + t(132, 154, 'm₁·m₂ = −1', 14);
})();
const circAnalitica = (() => {
  const C = [100, 80];
  return eixos(180, 180, 20, 160) + '<circle cx="100" cy="80" r="50"/>' + seg(C, [100, 160], trac) + seg(C, [20, 80], trac) +
    seg(C, pol(C, 50, 35), fino) + dot(C) + vi(100, 171, 'a', 15) + vi(10, 80, 'b', 15) + vi(114, 56, 'r', 15) + t(90, 69, 'C', 14);
})();
const parabola = (() => {
  const X = u => 90 + u, Y = v => 110 - v, P = [140, 110 - 2500 / 80], F = [90, 90];
  return curva(u => u * u / 80, -76, 76, X, Y, 0, 150, 80) + seg([8, 130], [172, 130], trac) + seg(P, F, fino) + seg(P, [140, 130], fino) +
    tick(P, F) + tick(P, [140, 130]) + dot(F) + dot([90, 110], 2.8) + dot(P) + t(78, 92, 'F') + t(152, 70, 'P') + t(100, 119, 'V', 14) + t(38, 142, 'diretriz', 14);
})();
const elipse = '<ellipse cx="100" cy="65" rx="88" ry="52"/>' + `<path d="M12,65 H188 M100,13 V117"${trac}/>` +
  dot([29, 65]) + dot([171, 65]) + dot([100, 65], 2.4) + t(29, 80, 'F₁', 14) + t(171, 80, 'F₂', 14) + vi(144, 56, 'a', 15) + vi(108, 40, 'b', 15) + vi(64, 56, 'c', 15);
const hiperbole = (() => {
  const ramo = sg => { const pts = []; for (let i = 0; i <= 60; i++) { const u = -1.6 + 3.2 * i / 60; pts.push([100 + sg * 30 * Math.cosh(u), 80 - 24 * Math.sinh(u)]); } return pl(pts); };
  return `<path d="M8,80 H192 M100,152 V8"${fino}/>` + `<path d="M10,152 L190,8 M10,8 L190,152"${trac}/>` + ramo(1) + ramo(-1) +
    dot([61.6, 80]) + dot([138.4, 80]) + dot([70, 80], 2.4) + dot([130, 80], 2.4) + t(48, 68, 'F₁', 14) + t(152, 68, 'F₂', 14);
})();

// ---------- Funções ----------
const fAfim = (() => {
  const X = u => 70 + 20 * u, Y = v => 100 - 20 * v, fn = u => 0.7 * u + 1;
  return eixos(170, 150, 70, 100) + curva(fn, -3.2, 4.5, X, Y, 6, 144, 2) + dot([70, 80]) + dot([X(-1 / 0.7), 100]) +
    vi(58, 72, 'b', 15) + t(28, 88, '−b/a', 14) + t(36, 30, 'a > 0');
})();
const fAfimDec = (() => {
  const X = u => 100 + 20 * u, Y = v => 100 - 20 * v, fn = u => -0.7 * u + 1;
  return eixos(170, 150, 100, 100) + curva(fn, -4.5, 3.2, X, Y, 6, 144, 2) + dot([100, 80]) + dot([X(1 / 0.7), 100]) +
    vi(112, 72, 'b', 15) + t(142, 88, '−b/a', 14) + t(136, 30, 'a &lt; 0');
})();
const fQuadPos = (() => {
  const X = u => 70 + 18 * u, Y = v => 96 - 18 * v, fn = u => 0.5 * (u + 1) * (u - 3);
  return eixos(170, 150, 70, 96) + curva(fn, -2.4, 4.4, X, Y, 6, 146, 100) + seg([88, 96], [88, 132], trac) +
    dot([52, 96]) + dot([124, 96]) + dot([88, 132]) + sub(40, 106, 'x', '1', 16) + sub(138, 106, 'x', '2', 16) + t(100, 140, 'V') + t(139, 132, 'a > 0');
})();
const fQuadNeg = (() => {
  const X = u => 70 + 18 * u, Y = v => 56 - 18 * v, fn = u => -0.5 * (u + 1) * (u - 3);
  return eixos(170, 140, 70, 56) + curva(fn, -2.4, 4.4, X, Y, 6, 136, 100) + seg([88, 56], [88, 20], trac) +
    dot([52, 56]) + dot([124, 56]) + dot([88, 20]) + sub(40, 42, 'x', '1', 16) + sub(138, 42, 'x', '2', 16) + t(102, 14, 'V') + t(146, 22, 'a &lt; 0');
})();
const fQuadDelta = (() => {
  let s = '';
  [[42, 84, 'Δ > 0'], [123, 64, 'Δ = 0'], [204, 44, 'Δ &lt; 0']].forEach(([cx, vy, txt]) => {
    s += `<path d="M${cx - 36},64 H${cx + 32}"${fino}/>` + head(cx + 38, 64, 0, 8) + curva(u => vy - 40 * u * u / 900, -30, 30, u => cx + u, v => v, 0, 120, 40) + t(cx, 104, txt);
  });
  const rx = 30 * Math.sqrt(20 / 40);
  return s + dot([42 - rx, 64], 3) + dot([42 + rx, 64], 3) + dot([123, 64], 3);
})();
const fExp = (() => {
  const X = u => 90 + 22 * u, Y = v => 120 - 18 * v;
  return eixos(170, 140, 90, 120) + curva(u => 2 ** u, -3.6, 2.5, X, Y, 6, 136, 100) + dot([90, 102]) + t(80, 95, '1', 14) + t(44, 40, 'a > 1');
})();
const fExpDec = (() => {
  const X = u => 80 + 22 * u, Y = v => 120 - 18 * v;
  return eixos(170, 140, 80, 120) + curva(u => 0.5 ** u, -2.5, 3.6, X, Y, 6, 136, 100) + dot([80, 102]) + t(90, 95, '1', 14) + t(128, 40, '0 &lt; a &lt; 1');
})();
const fLog = (() => {
  const X = u => 30 + 20 * u, Y = v => 80 - 16 * v;
  return eixos(186, 150, 30, 80) + curva(Math.log2, 0.07, 7.2, X, Y, 6, 146, 200) + dot([50, 80]) + t(58, 92, '1', 14) + t(134, 122, 'a > 1');
})();
const fExpLog = (() => {
  const X = u => 60 + 16 * u, Y = v => 124 - 16 * v;
  return eixos(184, 176, 60, 124) + seg([X(-3), Y(-3)], [X(6.9), Y(6.9)], trac) + curva(u => 2 ** u, -3.6, 2.5, X, Y, 6, 172, 100) +
    curva(Math.log2, 0.09, 7, X, Y, 6, 172, 200) + t(112, 28, 'aˣ', 15) + t(178, 96, 'log', 14) + t(156, 62, 'y = x', 14);
})();
const fModulo = (() => {
  const X = u => 85 + 20 * u, Y = v => 112 - 20 * v;
  return eixos(170, 130, 85, 112) + pl([[X(-3.8), Y(3.8)], [85, 112], [X(3.8), Y(3.8)]]) + t(40, 22, 'y = |x|');
})();
const fRaiz = (() => {
  const X = u => 20 + 20 * u, Y = v => 100 - 24 * v;
  return eixos(170, 120, 20, 100) + curva(Math.sqrt, 0, 7.3, X, Y, 6, 116, 120) + dot([20, 100], 3) + t(112, 28, 'y = √x');
})();
const fReciproca = (() => {
  const X = u => 85 + 20 * u, Y = v => 75 - 20 * v, fn = u => 1 / u;
  return eixos(170, 150, 85, 75) + curva(fn, 0.25, 3.9, X, Y, 6, 144, 120) + curva(fn, -3.9, -0.25, X, Y, 6, 144, 120) + t(42, 30, 'y = 1/x');
})();
const fCubica = (() => {
  const X = u => 85 + 18 * u, Y = v => 70 - 18 * v, fn = u => 0.25 * u * (u * u - 4);
  return eixos(170, 140, 85, 70) + curva(fn, -2.9, 2.9, X, Y, 6, 136, 120) + dot([X(-2), 70]) + dot([85, 70]) + dot([X(2), 70]);
})();

// ---------- Conjuntos, números e lógica ----------
const conjNumericos = '<rect x="4" y="4" width="212" height="142" rx="10"/><ellipse cx="100" cy="80" rx="92" ry="62"/>' +
  '<ellipse cx="80" cy="90" rx="60" ry="44"/><ellipse cx="66" cy="98" rx="32" ry="26"/>' +
  t(66, 98, 'ℕ', 20) + t(100, 64, 'ℤ', 20) + t(150, 50, 'ℚ', 20) + t(22, 22, 'ℝ', 20) + t(188, 134, 'ℝ − ℚ', 14);
const diagFlechas = (() => {
  const A = [[48, 32], [48, 62], [48, 92]], B = [[152, 24], [152, 48], [152, 76], [152, 100]];
  return '<ellipse cx="48" cy="62" rx="30" ry="50"/><ellipse cx="152" cy="62" rx="30" ry="50"/>' + [...A, ...B].map(p => dot(p)).join('') +
    seta([53, 31], [146, 24], 1.8, 10) + seta([53, 63], [146, 76], 1.8, 10) + seta([53, 91], [146, 77], 1.8, 10) +
    t(48, 128, 'A', 16) + t(152, 128, 'B', 16) + vi(100, 14, 'f', 16);
})();
const reta2 = (bits = '') => '<path d="M14,30 H206"/>' + head(212, 30, 0, 9) + head(8, 30, 180, 9) + bits;
const fech = x => `<circle cx="${x}" cy="30" r="6" fill="#C"/>`;
const aber = x => `<circle cx="${x}" cy="30" r="6" fill="none" stroke-width="2.5"/>`;
const intFechado = reta2(`<path d="M60,30 H160"${grosso}/>`) + fech(60) + fech(160) + vi(60, 50, 'a') + vi(160, 50, 'b');
const intAberto = '<path d="M14,30 H54 M166,30 H206"/>' + head(212, 30, 0, 9) + head(8, 30, 180, 9) + `<path d="M66,30 H154"${grosso}/>` + aber(60) + aber(160) + vi(60, 50, 'a') + vi(160, 50, 'b');
const intSemi = '<path d="M14,30 H60 M166,30 H206"/>' + head(212, 30, 0, 9) + head(8, 30, 180, 9) + `<path d="M60,30 H154"${grosso}/>` + fech(60) + aber(160) + vi(60, 50, 'a') + vi(160, 50, 'b');
const intInfinito = '<path d="M14,30 H70"/>' + head(8, 30, 180, 9) + `<path d="M70,30 H200"${grosso}/>` + head(214, 30, 0, 14) + fech(70) + vi(70, 50, 'a') + t(190, 50, '+∞', 15);
const pizza4 = '<path d="M62,62 L62,8 A54,54 0 1,0 116,62 Z"' + sombra + '/><circle cx="62" cy="62" r="54"/><path d="M8,62 H116 M62,8 V116"/>';
const pizza8 = (() => {
  const O = [62, 62];
  let d = '';
  for (let k = 0; k < 4; k++) d += `M${f(pol(O, 54, k * 45))} L${f(pol(O, 54, k * 45 + 180))} `;
  return `<path d="M62,62 L62,8 A54,54 0 1,0 ${f(pol(O, 54, 315))} Z"${sombra}/>` + '<circle cx="62" cy="62" r="54"/>' + `<path d="${d.trim()}"/>`;
})();
const fracBarra = `<rect x="6" y="8" width="79.2" height="32"${sombra}/>` + '<rect x="6" y="8" width="198" height="32"/><path d="M45.6,8 V40 M85.2,8 V40 M124.8,8 V40 M164.4,8 V40"/>';
const fracEquiv = (() => {
  let s = '';
  [2, 4, 8].forEach((n, i) => {
    const y = 8 + i * 36, w = 154 / n;
    s += `<rect x="50" y="${y}" width="77" height="24"${sombra}/><rect x="50" y="${y}" width="154" height="24"/>`;
    let d = ''; for (let k = 1; k < n; k++) d += `M${r1(50 + k * w)},${y} V${y + 24} `;
    s += `<path d="${d.trim()}"/>` + t(24, y + 12, ['1/2', '2/4', '4/8'][i], 16);
  });
  return s;
})();
const tabelaVerdade = (() => {
  const L = [['p', 'q', 'p ∧ q', 'p ∨ q'], ['V', 'V', 'V', 'V'], ['V', 'F', 'F', 'V'], ['F', 'V', 'F', 'V'], ['F', 'F', 'F', 'F']];
  let s = '<rect x="6" y="6" width="192" height="120"/><path d="M6,30 H198"/>' + `<path d="M54,6 V126 M102,6 V126 M150,6 V126 M6,54 H198 M6,78 H198 M6,102 H198"${fino}/>`;
  L.forEach((row, i) => row.forEach((c, j) => { s += (i === 0 && j < 2 ? vi : t)(30 + j * 48, 18 + i * 24, c, 15); }));
  return s;
})();

// ---------- Vetores e matrizes ----------
const vetorComp = (() => {
  const O = [32, 128], V = [148, 44];
  return '<path d="M32,128 H170 M32,128 V14"/>' + head(176, 128, 0, 9) + head(32, 8, -90, 9) +
    `<path d="M148,44 V128 M148,44 H32"${trac}/>` + seta(O, [148, 128], 4, 13) + seta(O, [32, 44], 4, 13) + seta(O, V, 3, 14) +
    arco(O, 22, 0, Math.atan2(84, 116) / D) + vi(...pol(O, 34, 18), 'θ', 15) + vi(82, 74, 'v', 18) + sub(90, 142, 'v', 'x') + sub(14, 84, 'v', 'y');
})();
const somaParalelogramo = (() => {
  const O = [14, 116], U = [114, 96], V = [54, 36], S = [154, 16];
  return seg(U, S, trac) + seg(V, S, trac) + seta(O, U) + seta(O, V) + seta(O, S, 3.5, 14) + vi(66, 118, 'u') + vi(23, 70, 'v') + vi(94, 86, 'u + v', 16);
})();
const somaPoligonal = (() => {
  const P0 = [10, 110], P1 = [40, 40], P2 = [130, 20], P3 = [186, 70];
  return seta(P0, P1) + seta(P1, P2) + seta(P2, P3) + `<path d="M10,110 L${f(add(P3, unit(P0, P3), -11))}" stroke-width="3" stroke-dasharray="7 4"/>` +
    head(186, 70, r1(Math.atan2(-40, 176) / D), 14) + vi(14, 70, 'a') + vi(82, 18, 'b') + vi(166, 36, 'c') + vi(101, 104, 'R');
})();
const angVetores = (() => {
  const O = [14, 96], U = pol(O, 124, 8), V = pol(O, 100, 58);
  return seta(O, U) + seta(O, V) + arco(O, 30, 8, 58) + vi(...pol(O, 44, 33), 'θ', 16) + vi(128, 94, 'u') + vi(50, 16, 'v') + dot(O, 2.6);
})();
const eixos3d = (() => {
  const O = [70, 92], ux = unit(O, [14, 142]), Xa = add(O, ux, 40), Q = add(Xa, [1, 0], 50), P = [Q[0], Q[1] - 60];
  return seg(O, [70, 12]) + head(70, 4, -90, 10) + seg(O, [154, 92]) + head(162, 92, 0, 10) + seg(O, add([14, 142], ux, -7)) + head(14, 142, r1(Math.atan2(ux[1], ux[0]) / D), 10) +
    `<path d="M${f(Xa)} L${f(Q)} L120,92 M${f(Q)} L${f(P)} L70,${r1(P[1])}"${trac}/>` + dot(P) + t(103, 49, 'P') +
    vi(8, 128, 'x', 16) + vi(160, 106, 'y', 16) + vi(82, 8, 'z', 16);
})();
const colchetes = (x1, x2, y1, y2) => `<path d="M${x1 + 10},${y1} H${x1} V${y2} H${x1 + 10} M${x2 - 10},${y1} H${x2} V${y2} H${x2 - 10}"/>`;
const matriz3 = (() => {
  let s = colchetes(12, 188, 8, 122);
  for (let i = 1; i <= 3; i++) for (let j = 1; j <= 3; j++) s += vi(52 + (j - 1) * 48, 30 + (i - 1) * 35, 'a' + '₀₁₂₃'[i] + '₀₁₂₃'[j], 18);
  return s;
})();
const matrizMN = (() => {
  const L = [['a₁₁', 'a₁₂', '⋯', 'a₁ₙ'], ['a₂₁', 'a₂₂', '⋯', 'a₂ₙ'], ['⋮', '⋮', '⋱', '⋮'], ['aₘ₁', 'aₘ₂', '⋯', 'aₘₙ']];
  let s = colchetes(8, 212, 6, 144);
  L.forEach((row, i) => row.forEach((c, j) => { s += vi(44 + j * 46, 24 + i * 33, c, 17); }));
  return s;
})();
const determinante = '<path d="M22,10 V90 M128,10 V90"/>' + vi(50, 30, 'a', 20) + vi(100, 30, 'b', 20) + vi(50, 70, 'c', 20) + vi(100, 70, 'd', 20) +
  seg([60, 40], [90, 60], fino) + seg([90, 40], [60, 60], trac) + vi(75, 104, 'ad − bc', 16);
const sarrus = (() => {
  const L = ['abcab', 'defde', 'ghigh'];
  let s = '<path d="M14,8 V102 M130,8 V102"/>';
  L.forEach((row, i) => [...row].forEach((c, j) => { s += vi(36 + j * 38, 25 + i * 30, c, 18).replace('<text ', j > 2 ? '<text fill-opacity=".6" ' : '<text '); }));
  for (let k = 0; k < 3; k++) s += seg([36 + k * 38, 25], [112 + k * 38, 85], ' stroke-width="1.4" stroke-opacity=".7"') + seg([112 + k * 38, 25], [36 + k * 38, 85], ' stroke-width="1.4" stroke-dasharray="4 3" stroke-opacity=".7"');
  return s;
})();

// ---------- Material didático ----------
const tangram = (() => {
  const u = 36, o = 8, P = pts => pts.map(([x, y]) => [o + x * u, o + y * u]);
  const pecas = [[[0, 0], [4, 0], [2, 2]], [[0, 0], [2, 2], [0, 4]], [[4, 2], [4, 4], [2, 4]], [[2, 2], [3, 1], [4, 2], [3, 3]],
    [[3, 1], [4, 0], [4, 2]], [[0, 4], [1, 3], [3, 3], [2, 4]], [[1, 3], [2, 2], [3, 3]]];
  const op = ['.08', '.24', '.16', '.32', '.12', '.2', '.36'];
  return pecas.map((p, i) => pg(P(p), ` fill="#C" fill-opacity="${op[i]}"`)).join('');
})();
const abaco = (() => {
  let s = '<rect x="8" y="124" width="164" height="16" rx="3"/>';
  [[44, 2, 'M'], [76, 0, 'C'], [108, 5, 'D'], [140, 3, 'U']].forEach(([x, n, L]) => {
    s += `<path d="M${x},124 V26" stroke-width="2"/>` + t(x, 14, L, 14);
    for (let k = 0; k < n; k++) s += `<ellipse cx="${x}" cy="${116 - k * 12}" rx="13" ry="5.5" fill="#C" fill-opacity=".35"/>`;
  });
  return s;
})();
const reguaFracoes = (() => {
  let s = '';
  for (let i = 1; i <= 6; i++) {
    const y = 6 + (i - 1) * 26, w = 200 / i;
    s += `<rect x="10" y="${y}" width="200" height="24"/>`;
    let d = ''; for (let k = 1; k < i; k++) d += `M${r1(10 + k * w)},${y} V${y + 24} `;
    if (d) s += `<path d="${d.trim()}"/>`;
    for (let k = 0; k < i; k++) s += t(10 + (k + 0.5) * w, y + 12, i === 1 ? '1' : '1/' + i, 14);
  }
  return s;
})();
const bloco = (x, y, w, h, d, u) => { // bloco quadriculado em perspectiva (frente w×h, profundidade d, grade u)
  const e = d / 2;
  let s = `<path d="M${x},${y} H${x + w} V${y + h} H${x} Z M${x},${y} L${x + e},${y - e} H${x + w + e} L${x + w},${y} M${x + w},${y + h} L${x + w + e},${y + h - e} V${y - e}"/>`;
  let g = '';
  for (let k = u; k < w - 0.1; k += u) g += `M${r1(x + k)},${y} V${y + h} M${r1(x + k)},${y} L${r1(x + k + e)},${r1(y - e)} `;
  for (let k = u; k < h - 0.1; k += u) g += `M${x},${r1(y + k)} H${x + w} M${x + w},${r1(y + k)} L${r1(x + w + e)},${r1(y + k - e)} `;
  for (let k = u; k < d - 0.1; k += u) g += `M${r1(x + k / 2)},${r1(y - k / 2)} H${r1(x + w + k / 2)} M${r1(x + w + k / 2)},${r1(y - k / 2)} V${r1(y + h - k / 2)} `;
  return s + (g ? `<path d="${g.trim()}" stroke-width="1"/>` : '');
};
const dourado = bloco(6, 46, 70, 70, 70, 7) + bloco(126, 46, 70, 70, 7, 7) + bloco(212, 46, 7, 70, 7, 7) + bloco(236, 109, 7, 7, 7, 7);
const geoplano = (() => {
  let s = '<rect x="6" y="6" width="124" height="124" rx="8"/>' + '<path d="M20,116 L92,20 L116,92 Z" stroke-width="3"/>';
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) s += dot([20 + 24 * i, 20 + 24 * j], 3.4);
  return s;
})();

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "mat-triangulo-medidas",
        "Triângulo — medidas a preencher",
        380,
        270,
        "<path d=\"M55 218 L175 42 L325 218 Z\"/><text x=\"175\" y=\"23\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A</text><text x=\"37\" y=\"231\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">B</text><text x=\"342\" y=\"231\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">C</text><text x=\"86\" y=\"118\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">c = ___</text><text x=\"275\" y=\"118\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">b = ___</text><text x=\"190\" y=\"245\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">a = ___</text>"
      ],
      [
        "mat-construcao-etapas",
        "Construção geométrica — etapas",
        520,
        158,
        "<text x=\"260\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Construção geométrica — etapas</text><rect x=\"10\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"85\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Dados</text><path d=\"M162 73 L176 73\"/><path d=\"M169 69 L176 73 L169 77\"/><text x=\"85\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">___________</text><rect x=\"180\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"255\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Construção</text><path d=\"M332 73 L346 73\"/><path d=\"M339 69 L346 73 L339 77\"/><text x=\"255\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">___________</text><rect x=\"350\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"425\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Justificativa</text><text x=\"425\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">___________</text>"
      ]
    ]
  ]
];

export default {
  id: 'matematica', nome: 'Matemática e Geometria',
  destaques: ['mat-tri-ret', 'mat-pitagoras', 'mat-circ-elementos', 'mat-ciclo-trig', 'mat-trig-triangulo', 'mat-plano-pontos',
    'mat-f-afim', 'mat-f-quad-pos', 'mat-cubo', 'mat-cilindro', 'mat-cone', 'mat-pizza-4', 'mat-int-fechado', 'mat-vetor-comp',
    'mat-matriz-3x3', 'mat-paralelas-transv'],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Triângulos', [
      ['mat-tri-equi', 'Triângulo equilátero (60°)', 140, 122, triEqui],
      ['mat-tri-iso', 'Triângulo isósceles', 130, 130, triIso],
      ['mat-tri-esc', 'Triângulo escaleno', 156, 120, triEsc],
      ['mat-tri-ret', 'Triângulo retângulo (a, b, c)', 160, 134, triRet],
      ['mat-tri-acut', 'Triângulo acutângulo', 142, 118, triAcut],
      ['mat-tri-obt', 'Triângulo obtusângulo', 178, 100, triObt],
    ]],
    ['Quadriláteros e polígonos', [
      ['mat-quadrado', 'Quadrado (lado ℓ, diagonal d)', 118, 126, quadrado],
      ['mat-retangulo', 'Retângulo (b × h)', 160, 112, retangulo],
      ['mat-paralelogramo', 'Paralelogramo (b, h)', 172, 119, "<g transform=\"translate(0.00 0.00)\">" + (paralelogramo) + "</g>"],
      ['mat-losango', 'Losango (D, d)', 164, 124, losango],
      ['mat-trapezio', 'Trapézio (B, b, h)', 172, 122, trapezio],
      ['mat-trap-ret', 'Trapézio retângulo', 150, 135, "<g transform=\"translate(0.00 6.00)\">" + (trapRet) + "</g>"],
      ['mat-trap-iso', 'Trapézio isósceles', 160, 100, trapIso],
      ['mat-pipa', 'Pipa (deltoide)', 140, 140, pipa],
      ['mat-pentagono', 'Pentágono regular (108°)', 120, 112, pentagono],
      ['mat-hex-apotema', 'Hexágono regular (R, apótema)', 130, 120, hexApotema],
      ['mat-poligonos', 'Polígonos regulares (3 a 8 lados)', 200, 140, poligonos],
    ]],
    ['Círculo e circunferência', [
      ['mat-circ-elementos', 'Círculo: raio, diâmetro e corda', 144, 144, circElementos],
      ['mat-setor', 'Setor circular (θ, r)', 140, 140, setor],
      ['mat-coroa', 'Coroa circular (R, r)', 140, 140, coroa],
      ['mat-inscrito-central', 'Ângulo inscrito e central', 144, 144, inscritoCentral],
      ['mat-tangente', 'Reta tangente (⊥ ao raio)', 160, 124, tangente],
    ]],
    ['Ângulos', [
      ['mat-ang-agudo', 'Ângulo agudo', 124, 92, angAgudo],
      ['mat-ang-reto', 'Ângulo reto', 100, 100, angReto],
      ['mat-ang-obtuso', 'Ângulo obtuso', 150, 92, angObtuso],
      ['mat-ang-raso', 'Ângulo raso (180°)', 160, 76, angRaso],
      ['mat-ang-compl', 'Ângulos complementares', 112, 112, angCompl],
      ['mat-ang-supl', 'Ângulos suplementares', 172, 84, angSupl],
      ['mat-ang-opv', 'Opostos pelo vértice', 144, 104, angOpv],
      ['mat-paralelas-transv', 'Paralelas e transversal', 184, 132, paralelasTransv],
    ]],
    ['Construções e teoremas', [
      ['mat-bissetriz', 'Bissetriz (com compasso)', 160, 120, bissetriz],
      ['mat-mediatriz', 'Mediatriz de um segmento', 150, 132, mediatriz],
      ['mat-tales', 'Teorema de Tales', 184, 132, tales],
      ['mat-pitagoras', 'Teorema de Pitágoras (a² = b² + c²)', 192, 192, pitagoras],
      ['mat-alturas', 'Alturas e ortocentro', 160, 130, alturas],
      ['mat-medianas', 'Medianas e baricentro', 160, 130, medianas],
      ['mat-circunscrita', 'Circunferência circunscrita', 144, 144, circunscrita],
      ['mat-inscrita', 'Circunferência inscrita', 160, 130, inscrita],
      ['mat-semelhanca', 'Triângulos semelhantes', 204, 112, semelhanca],
      ['mat-relacoes-metricas', 'Relações métricas (h, m, n)', 200, 140, "<g transform=\"translate(0.00 0.00)\">" + (relacoes) + "</g>"],
    ]],
    ['Sólidos geométricos', [
      ['mat-cubo', 'Cubo (aresta a, diagonal D)', 140, 155, "<g transform=\"translate(0.00 0.00)\">" + (cubo) + "</g>"],
      ['mat-paralelep', 'Paralelepípedo (a, b, c)', 180, 144, "<g transform=\"translate(0.00 0.00)\">" + (paralelep) + "</g>"],
      ['mat-prisma-tri', 'Prisma triangular', 140, 130, prismaTri],
      ['mat-prisma-hex', 'Prisma hexagonal', 140, 140, prismaHex],
      ['mat-piramide', 'Pirâmide de base quadrada', 150, 140, piramide],
      ['mat-tetraedro', 'Tetraedro', 140, 128, tetraedro],
      ['mat-cilindro', 'Cilindro (r, h)', 128, 136, cilindro],
      ['mat-cone', 'Cone (r, h, g)', 124, 138, cone],
      ['mat-esfera', 'Esfera (raio r)', 124, 124, esfera],
      ['mat-tronco-cone', 'Tronco de cone', 134, 134, troncoCone],
      ['mat-tronco-pir', 'Tronco de pirâmide', 150, 140, troncoPir],
    ]],
    ['Planificações', [
      ['mat-plan-cubo', 'Planificação do cubo', 172, 132, planCubo],
      ['mat-plan-cilindro', 'Planificação do cilindro', 150, 162, planCilindro],
      ['mat-plan-cone', 'Planificação do cone', 160, 166, planCone],
      ['mat-plan-piramide', 'Planificação da pirâmide', 150, 150, planPiramide],
      ['mat-plan-prisma-tri', 'Planificação do prisma triangular', 180, 138, planPrismaTri],
    ]],
    ['Trigonometria', [
      ['mat-ciclo-trig', 'Círculo trigonométrico (sen, cos)', 200, 200, cicloTrig],
      ['mat-ciclo-notaveis', 'Ciclo com ângulos notáveis', 236, 220, cicloNotaveis],
      ['mat-ciclo-tg', 'Ciclo com eixo da tangente', 210, 200, cicloTg],
      ['mat-trig-triangulo', 'Triângulo retângulo (sen, cos, tg)', 220, 146, trigTriangulo],
      ['mat-graf-sen', 'Gráfico de sen x', 240, 130, grafSen],
      ['mat-graf-cos', 'Gráfico de cos x', 240, 130, grafCos],
      ['mat-graf-tg', 'Gráfico de tg x', 210, 168, "<g transform=\"translate(0.00 1.00)\">" + (grafTg) + "</g>"],
    ]],
    ['Geometria analítica', [
      ['mat-plano-pontos', 'Plano cartesiano com pontos', 200, 200, planoPontos],
      ['mat-distancia', 'Distância entre dois pontos', 200, 160, distancia],
      ['mat-reta-coef', 'Reta: coeficientes (m, b)', 200, 160, retaCoef],
      ['mat-retas-paralelas', 'Retas paralelas', 200, 160, retasParalelas],
      ['mat-retas-perp', 'Retas perpendiculares', 189, 170, "<g transform=\"translate(0.00 1.00)\">" + (retasPerp) + "</g>"],
      ['mat-circunferencia', 'Circunferência (centro e raio)', 180, 180, circAnalitica],
      ['mat-parabola', 'Parábola (foco e diretriz)', 180, 157, "<g transform=\"translate(0.00 0.00)\">" + (parabola) + "</g>"],
      ['mat-elipse', 'Elipse (focos, a, b, c)', 200, 130, elipse],
      ['mat-hiperbole', 'Hipérbole (assíntotas)', 200, 160, hiperbole],
    ]],
    ['Funções', [
      ['mat-f-afim', 'Função afim crescente', 170, 150, fAfim],
      ['mat-f-afim-dec', 'Função afim decrescente', 170, 150, fAfimDec],
      ['mat-f-quad-pos', 'Parábola a > 0 (raízes, vértice)', 170, 150, fQuadPos],
      ['mat-f-quad-neg', 'Parábola a < 0 (raízes, vértice)', 170, 140, fQuadNeg],
      ['mat-f-quad-delta', 'Parábola e o sinal de Δ', 246, 116, fQuadDelta],
      ['mat-f-exp', 'Função exponencial (a > 1)', 170, 140, fExp],
      ['mat-f-exp-dec', 'Exponencial decrescente', 170, 140, fExpDec],
      ['mat-f-log', 'Função logarítmica', 186, 150, fLog],
      ['mat-f-exp-log', 'Exponencial × logaritmo (inversas)', 192, 176, fExpLog],
      ['mat-f-modulo', 'Função modular |x|', 170, 130, fModulo],
      ['mat-f-raiz', 'Função raiz quadrada', 170, 120, fRaiz],
      ['mat-f-reciproca', 'Função recíproca 1/x', 170, 150, fReciproca],
      ['mat-f-cubica', 'Função cúbica', 170, 140, fCubica],
    ]],
    ['Conjuntos, números e lógica', [
      ['mat-conj-numericos', 'Conjuntos numéricos (ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ)', 220, 150, conjNumericos],
      ['mat-diag-flechas', 'Diagrama de flechas (função)', 200, 140, diagFlechas],
      ['mat-int-fechado', 'Intervalo fechado [a, b]', 220, 62, intFechado],
      ['mat-int-aberto', 'Intervalo aberto ]a, b[', 220, 62, intAberto],
      ['mat-int-semi', 'Intervalo [a, b[', 220, 62, intSemi],
      ['mat-int-infinito', 'Intervalo [a, +∞[', 220, 62, intInfinito],
      ['mat-pizza-4', 'Fração em pizza (3/4)', 124, 124, pizza4],
      ['mat-pizza-8', 'Fração em pizza (5/8)', 124, 124, pizza8],
      ['mat-frac-barra', 'Fração em barra (2/5)', 210, 48, fracBarra],
      ['mat-frac-equiv', 'Frações equivalentes', 210, 112, fracEquiv],
      ['mat-tabela-verdade', 'Tabela-verdade (∧, ∨)', 204, 132, tabelaVerdade],
    ]],
    ['Vetores e matrizes', [
      ['mat-vetor-comp', 'Vetor e componentes', 180, 156, vetorComp],
      ['mat-soma-paralelogramo', 'Soma de vetores (paralelogramo)', 170, 128, somaParalelogramo],
      ['mat-soma-poligonal', 'Soma de vetores (ponta a cauda)', 196, 118, somaPoligonal],
      ['mat-ang-vetores', 'Ângulo entre vetores', 150, 108, angVetores],
      ['mat-eixos-3d', 'Espaço xyz com ponto P', 173, 160, "<g transform=\"translate(2.02 7.50)\">" + (eixos3d) + "</g>"],
      ['mat-matriz-3x3', 'Matriz 3×3 (aᵢⱼ)', 200, 130, matriz3],
      ['mat-matriz-mxn', 'Matriz m × n', 220, 150, matrizMN],
      ['mat-determinante', 'Determinante 2×2', 150, 114, determinante],
      ['mat-sarrus', 'Regra de Sarrus (3×3)', 220, 110, sarrus],
    ]],
    ['Material didático', [
      ['mat-tangram', 'Tangram (7 peças)', 160, 160, tangram],
      ['mat-abaco', 'Ábaco (M C D U)', 180, 146, abaco],
      ['mat-regua-fracoes', 'Régua de frações', 220, 164, reguaFracoes],
      ['mat-material-dourado', 'Material dourado', 252, 122, dourado],
      ['mat-geoplano', 'Geoplano 5×5', 136, 136, geoplano],
    ]],
  ],
};
