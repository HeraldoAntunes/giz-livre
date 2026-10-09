// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Física (médio e superior): cinemática, dinâmica, energia, gravitação, fluidos, térmica, ondas, óptica, eletromagnetismo, moderna e instrumentos.
import { T, head } from './base.js';

// Desenhos próprios do Giz Livre, feitos do zero (coordenadas calculadas aqui); nada copiado de outras bibliotecas.
// Hidrostática já tem vasos comunicantes, prensa e empuxo em parede em hidraulica.js; termômetro avulso fica em laboratorio.js.

const r1 = (n) => Math.round(n * 10) / 10;
const rad = (g) => g * Math.PI / 180;
const tx = (x, y, s, size = 15) => T(r1(x), r1(y), s, size);
const ti = (x, y, s, size = 17) => T(r1(x), r1(y), s, size).replace('<text ', '<text font-style="italic" '); // grandeza (itálico)
const sub = (b, s) => `${b}<tspan font-size="78%" dy="0.35em">${s}</tspan>`; // índice: só no fim do rótulo
const fina = (d, sw = 1.6) => `<path d="${d}" stroke-width="${sw}"/>`;
const trac = (d, sw = 1.6) => `<path d="${d}" stroke-width="${sw}" stroke-dasharray="6 5"/>`;
const ponto = (x, y, r = 3.5) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="#C" stroke="none"/>`;
// seta de (x1,y1) até a ponta (x2,y2); o traço para antes da ponta para não vazar
const seta = (x1, y1, x2, y2, sw = 2.5, L = 12, extra = '') => {
  const d = Math.hypot(x2 - x1, y2 - y1), k = (d - L * 0.7) / d, a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return `<path d="M${r1(x1)} ${r1(y1)} L${r1(x1 + (x2 - x1) * k)} ${r1(y1 + (y2 - y1) * k)}"${sw !== 2.5 ? ` stroke-width="${sw}"` : ''}${extra}/>` + head(r1(x2), r1(y2), r1(a), L);
};
const setaT = (x1, y1, x2, y2, sw = 1.8, L = 11) => seta(x1, y1, x2, y2, sw, L, ' stroke-dasharray="5 4"');
// cota com rótulo no meio: duas setas saindo do centro para as pontas
const cota = (x1, y1, x2, y2, s, gap = 11, size = 16) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
  return seta(mx - ux * gap, my - uy * gap, x1, y1, 1.5, 8) + seta(mx + ux * gap, my + uy * gap, x2, y2, 1.5, 8) + ti(mx, my, s, size);
};
const pt = (cx, cy, r, a) => [r1(cx + r * Math.cos(rad(a))), r1(cy - r * Math.sin(rad(a)))]; // ângulo matemático (anti-horário)
const arco = (cx, cy, r, a1, a2, sw = 1.6) => {
  const [x1, y1] = pt(cx, cy, r, a1), [x2, y2] = pt(cx, cy, r, a2);
  return `<path d="M${x1} ${y1} A${r} ${r} 0 ${Math.abs(a2 - a1) > 180 ? 1 : 0} ${a2 > a1 ? 0 : 1} ${x2} ${y2}" stroke-width="${sw}"/>`;
};
const hach = (pts, dx, dy) => fina(pts.map(([x, y]) => `M${r1(x)} ${r1(y)} l${dx} ${dy}`).join(' '), 1.4);
const passo = (a, b, p) => { const v = []; for (let s = a; s <= b + 0.01; s += p) v.push(s); return v; };
const chao = (x1, x2, y) => `<path d="M${x1} ${y} H${x2}"/>` + hach(passo(x1 + 8, x2, 12).map((x) => [x, y]), -7, 7);
const teto = (x1, x2, y) => `<path d="M${x1} ${y} H${x2}"/>` + hach(passo(x1 + 1, x2 - 7, 12).map((x) => [x, y]), 7, -7);
const paredeE = (x, y1, y2) => `<path d="M${x} ${y1} V${y2}"/>` + hach(passo(y1 + 1, y2 - 7, 12).map((y) => [x, y]), -7, 7);
const paredeD = (x, y1, y2) => `<path d="M${x} ${y1} V${y2}"/>` + hach(passo(y1 + 1, y2 - 7, 12).map((y) => [x, y]), 7, 7);
const mola = (x1, x2, y, n = 8, a = 9) => {
  const p = 8, s = (x2 - x1 - 2 * p) / n;
  let d = `M${x1} ${y} H${x1 + p}`;
  for (let i = 0; i < n; i++) d += ` L${r1(x1 + p + s * (i + 0.5))} ${y + (i % 2 ? a : -a)}`;
  return `<path d="${d} L${x2 - p} ${y} H${x2}" stroke-width="2"/>`;
};
const molaV = (x, y1, y2, n = 8, a = 9) => {
  const p = 8, s = (y2 - y1 - 2 * p) / n;
  let d = `M${x} ${y1} V${y1 + p}`;
  for (let i = 0; i < n; i++) d += ` L${x + (i % 2 ? a : -a)} ${r1(y1 + p + s * (i + 0.5))}`;
  return `<path d="${d} L${x} ${y2 - p} V${y2}" stroke-width="2"/>`;
};
const curva = (f, a, b, n = 60) => 'M' + Array.from({ length: n + 1 }, (_, i) => { const [x, y] = f(a + (b - a) * i / n); return `${r1(x)} ${r1(y)}`; }).join(' L');
// eixos cartesianos com rótulos (origem ox,oy; até xmax à direita e ymin acima)
const eixos = (ox, oy, xmax, ymin, lx = 'x', ly = 'y', xmin = ox, ymax = oy) =>
  seta(xmin, oy, xmax, oy, 2, 10) + seta(ox, ymax, ox, ymin, 2, 10) + ti(xmax - 5, oy + 12, lx) + ti(ox + 14, ymin + 5, ly);
// curva de Bézier quadrática com ponta de seta no meio (sentido de percurso)
const qSeta = (x0, y0, cx, cy, x1, y1, t = 0.5, sw = 2.5, L = 11) => {
  const bx = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1, by = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1;
  const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy), a = Math.atan2(dy, dx), m = L * 0.5;
  return `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}"${sw !== 2.5 ? ` stroke-width="${sw}"` : ''}/>` + head(r1(bx + m * Math.cos(a)), r1(by + m * Math.sin(a)), r1(a * 180 / Math.PI), L);
};
const cSeta = (p0, p1, p2, p3, t = 0.5, sw = 1.8, L = 10) => {
  const B = (i) => (1 - t) ** 3 * p0[i] + 3 * (1 - t) ** 2 * t * p1[i] + 3 * (1 - t) * t * t * p2[i] + t ** 3 * p3[i];
  const D = (i) => 3 * (1 - t) ** 2 * (p1[i] - p0[i]) + 6 * (1 - t) * t * (p2[i] - p1[i]) + 3 * t * t * (p3[i] - p2[i]);
  const a = Math.atan2(D(1), D(0)), m = L * 0.5;
  return `<path d="M${p0.join(' ')} C${p1.join(' ')} ${p2.join(' ')} ${p3.join(' ')}" stroke-width="${sw}"/>` + head(r1(B(0) + m * Math.cos(a)), r1(B(1) + m * Math.sin(a)), r1(a * 180 / Math.PI), L);
};
// linha ondulada (fóton, luz) de (x1,y1) a (x2,y2), terminando em seta
const onda = (x1, y1, x2, y2, amp = 6, ciclos = 4, sw = 2, L = 11) => {
  const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d, fim = (d - L) / d;
  const c = curva((u) => { const w = amp * Math.sin(2 * Math.PI * ciclos * u / fim) * (u < fim ? 1 : 0); return [x1 + ux * d * u - uy * w, y1 + uy * d * u + ux * w]; }, 0, fim, 24 * ciclos);
  return `<path d="${c}" stroke-width="${sw}"/>` + head(r1(x2), r1(y2), r1(Math.atan2(uy, ux) * 180 / Math.PI), L);
};
const carga = (x, y, r, s) => `<circle cx="${x}" cy="${y}" r="${r}"/>` + T(x, y + (s === '+' ? 0 : -1), s, r > 13 ? 22 : 18);
const vetLbl = (x, y, s, size = 18) => ti(x, y, s, size) + fina(`M${r1(x - 6)} ${r1(y - size * 0.78)} H${r1(x + 3)}`, 1.3) + head(r1(x + 8), r1(y - size * 0.78), 0, 6);
const agua = (x, y) => `<path d="M${x - 7} ${y - 6} H${x + 7} L${x} ${y + 4} Z" stroke-width="1.6"/>` + fina(`M${x - 5} ${y + 8} H${x + 5} M${x - 2} ${y + 12} H${x + 2}`, 1.4); // símbolo de nível ▽

// ---------- cinemática ----------
const CINEMATICA = [
  ['fis-eixos-xy', 'Eixos x e y (origem)', 160, 140, eixos(30, 115, 154, 6) + '<path d="M18 115 H30 M30 115 V128" stroke-width="2"/>' + tx(19, 128, 'O', 15)],
  ['fis-vetor', 'Vetor', 150, 70, ponto(12, 54) + seta(12, 54, 138, 18, 2.5, 14) + vetLbl(60, 24, 'v', 20)],
  ['fis-componentes', 'Componentes de um vetor', 178, 159, "<g transform=\"translate(1.67 5.00)\">" + (eixos(26, 118, 170, 6, 'x', 'y')
    + trac('M132 38 V118 M132 38 H26', 1.4) + seta(26, 118, 132, 38, 2.6, 13) + seta(26, 118, 132, 118, 2.6, 12) + seta(26, 118, 26, 38, 2.6, 12)
    + arco(26, 118, 30, 0, 37) + ti(64, 106, 'θ', 16) + ti(68, 66, 'v', 18) + ti(80, 135, sub('v', 'x'), 17) + ti(11, 78, sub('v', 'y'), 17)) + "</g>"],
  ['fis-soma-vetores', 'Soma de vetores (paralelogramo)', 180, 140, "<g transform=\"translate(0.00 0.00)\">" + (ponto(16, 112, 3)
    + trac('M104 112 L148 42 M60 42 H148', 1.4) + seta(16, 112, 104, 112) + seta(16, 112, 60, 42) + seta(16, 112, 148, 42, 2.8, 13)
    + vetLbl(60, 124, 'a', 17) + vetLbl(24, 72, 'b', 17) + vetLbl(118, 90, 'R', 17)) + "</g>"],
  ['fis-grafico-st', 'Gráfico s × t (MRU)', 150, 126, eixos(26, 102, 146, 6, 't', 's') + '<path d="M26 78 L136 24"/>' + trac('M26 24 H136 V102', 1.2) + ti(12, 78, sub('s', '0'), 16)],
  ['fis-grafico-vt', 'Gráfico v × t (MRUV, área = Δs)', 150, 126, eixos(26, 102, 146, 6, 't', 'v')
    + '<path d="M26 102 V80 L126 30 V102 Z" fill="#C" fill-opacity=".14" stroke="none"/><path d="M26 80 L126 30" /><path d="M126 30 V102" stroke-width="1.4" stroke-dasharray="5 4"/>'
    + ti(12, 80, sub('v', '0'), 16) + ti(86, 80, 'Δs', 16)],
  ['fis-lancamento', 'Lançamento oblíquo', 240, 156, chao(8, 232, 128) + '<path d="M24 128 Q114 -28 204 128" stroke-width="2" stroke-dasharray="7 5"/>'
    + seta(24, 128, 52, 80, 2.6, 13) + arco(24, 128, 24, 0, 60) + ti(56, 117, 'θ', 16) + ti(30, 82, sub('v', '0'), 17)
    + trac('M114 50 V128', 1.4) + ponto(114, 50, 5) + seta(120, 50, 154, 50, 2, 10) + ti(160, 38, sub('v', 'x'), 16) + ti(127, 92, 'H', 16)
    + cota(24, 146, 204, 146, 'A', 12)],
  ['fis-lanc-horizontal', 'Lançamento horizontal', 190, 168, "<g transform=\"translate(0.00 5.50)\">" + ('<path d="M8 40 H62 V132"/>'
    + hach(passo(44, 124, 12).map((y) => [62, y]), -7, 7) + chao(62, 184, 132) + '<circle cx="66" cy="33" r="6" fill="#C" stroke="none"/>'
    + '<path d="M66 33 Q118 33 166 132" stroke-width="2" stroke-dasharray="7 5"/>' + seta(76, 24, 112, 24, 2.4, 11) + ti(96, 10, sub('v', '0'), 16)
    + cota(30, 44, 30, 130, 'h', 11) + cota(62, 147, 166, 147, 'A', 11)) + "</g>"],
  ['fis-mcu', 'Movimento circular (v e acp)', 150, 150, '<circle cx="72" cy="78" r="50" stroke-width="2"/>' + ponto(72, 78, 3) + fina('M72 78 L36.6 113.4', 1.6)
    + ti(46, 92, 'R', 16) + '<circle cx="122" cy="78" r="7" fill="#C" stroke="none"/>' + seta(122, 70, 122, 18) + seta(114, 78, 84, 78, 2.4, 11)
    + ti(136, 34, 'v', 18) + ti(98, 64, sub('a', 'cp'), 16)],
  ['fis-queda-livre', 'Queda livre (fotos em intervalos iguais)', 110, 168, [12, 24, 48, 84, 132].map((y) => `<circle cx="36" cy="${y}" r="5.5" fill="#C" stroke="none"/>`).join('')
    + seta(86, 36, 86, 108, 2.4, 12) + ti(99, 72, 'g', 18) + chao(8, 102, 150)],
  ['fis-carrinho', 'Carrinho com velocidade', 165, 90, '<rect x="18" y="30" width="92" height="32" rx="5"/><circle cx="40" cy="70" r="8"/><circle cx="88" cy="70" r="8"/>'
    + chao(6, 158, 78) + seta(118, 46, 158, 46) + ti(138, 30, 'v', 18) + tx(64, 46, 'm', 17)],
];

// ---------- dinâmica ----------
const plano = (() => {
  const x0 = 8, y0 = 120, x1 = 200, y1 = 28, a = Math.atan2(y0 - y1, x1 - x0) * 180 / Math.PI, px = 120, py = r1(y0 - (px - x0) * (y0 - y1) / (x1 - x0));
  const [lx, ly] = pt(x0, y0, 52, a / 2);
  return `<path d="M${x0} ${y0} H${x1} V${y1} Z"/><g transform="rotate(${r1(-a)} ${px} ${py})"><rect x="${px - 20}" y="${r1(py - 26)}" width="40" height="26"/></g>`
    + arco(x0, y0, 36, 0, a) + ti(lx, ly, 'θ', 16);
})();
const planoF = (() => {
  const x0 = 8, y0 = 162, x1 = 222, y1 = 44, a = Math.atan2(y0 - y1, x1 - x0), ag = a * 180 / Math.PI;
  const px = 116, py = y0 - (px - x0) * Math.tan(a), ux = Math.cos(a), uy = -Math.sin(a), nx = -Math.sin(a), ny = -Math.cos(a);
  const cx = px + nx * 15, cy = py + ny * 15, P = 62, [lx, ly] = pt(x0, y0, 52, ag / 2);
  return `<path d="M${x0} ${y0} H${x1} V${y1} Z"/><g transform="rotate(${r1(-ag)} ${r1(px)} ${r1(py)})"><rect x="${r1(px - 22)}" y="${r1(py - 30)}" width="44" height="30"/></g>`
    + arco(x0, y0, 36, 0, ag) + ti(lx, ly, 'θ', 16) + ponto(cx, cy, 3)
    + seta(cx, cy, cx, cy + P) + seta(cx, cy, cx + nx * 56, cy + ny * 56)
    + setaT(cx, cy, cx - ux * P * Math.sin(a), cy - uy * P * Math.sin(a)) + setaT(cx, cy, cx - nx * P * Math.cos(a), cy - ny * P * Math.cos(a))
    + ti(cx + 13, cy + P - 4, 'P') + ti(cx + nx * 56 - 12, cy + ny * 56 + 4, 'N') + ti(cx - ux * 36 - 30, cy - uy * 36 - 22, 'P sen θ', 14) + ti(cx - nx * 54 + 32, cy - ny * 54 + 4, 'P cos θ', 14);
})();
const DINAMICA = [
  ['fis-bloco-forcas', 'Diagrama de corpo livre (bloco)', 172, 172, '<rect x="56" y="70" width="60" height="42"/>' + ponto(86, 91, 3)
    + seta(86, 70, 86, 14) + seta(86, 112, 86, 166) + seta(116, 91, 166, 91) + seta(56, 91, 8, 91)
    + ti(100, 26, 'N') + ti(100, 154, 'P') + ti(150, 76, 'F') + ti(26, 76, sub('F', 'at'))],
  ['fis-forcas-ponto', 'Forças num ponto', 150, 150, ponto(70, 78, 4) + seta(70, 78, 142, 78) + seta(70, 78, 32, 16) + seta(70, 78, 30, 140)
    + ti(130, 62, sub('F', '1')) + ti(56, 18, sub('F', '2')) + ti(62, 136, sub('F', '3'))],
  ['fis-plano-inclinado', 'Plano inclinado', 210, 130, plano],
  ['fis-plano-forcas', 'Plano inclinado com forças', 232, 170, planoF],
  ['fis-atwood', 'Máquina de Atwood (polia fixa)', 130, 156, teto(32, 98, 10) + '<path d="M65 10 V40"/><circle cx="65" cy="40" r="22"/>' + ponto(65, 40, 3.5)
    + '<path d="M43 40 V108 M87 40 V78" stroke-width="2"/><rect x="27" y="108" width="32" height="34"/><rect x="71" y="78" width="32" height="34"/>'
    + tx(43, 125, sub('m', '1'), 16) + tx(87, 95, sub('m', '2'), 16)],
  ['fis-polia-movel', 'Polia móvel', 160, 186, teto(18, 140, 10) + '<path d="M40 10 V100 A20 20 0 0 0 80 100 V40 A20 20 0 0 1 120 40 V118" stroke-width="2"/>'
    + '<path d="M100 10 V40"/><circle cx="100" cy="40" r="20"/>' + ponto(100, 40, 3) + '<circle cx="60" cy="100" r="20"/>' + ponto(60, 100, 3)
    + '<path d="M60 100 V138"/><rect x="40" y="138" width="40" height="36"/>' + tx(60, 156, 'P', 17) + seta(120, 118, 120, 166) + ti(134, 150, 'F')],
  ['fis-mesa-polia', 'Bloco na mesa e bloco suspenso', 210, 150, '<path d="M8 60 H160 M22 60 V144 M150 60 V144"/>' + '<rect x="50" y="26" width="52" height="34"/>' + tx(76, 43, sub('m', '1'), 16)
    + '<path d="M102 40 H168 A12 12 0 0 1 180 52 V96" stroke-width="2"/><circle cx="168" cy="52" r="12"/>' + ponto(168, 52, 2.5) + '<path d="M160 60 L168 52"/>'
    + '<rect x="164" y="96" width="32" height="34"/>' + tx(180, 113, sub('m', '2'), 16)],
  ['fis-mola', 'Mola e bloco (horizontal)', 200, 84, paredeE(12, 8, 72) + chao(12, 192, 72) + mola(12, 122, 46, 8, 10)
    + '<rect x="122" y="28" width="50" height="44"/>' + tx(147, 50, 'm', 17) + ti(66, 22, 'k')],
  ['fis-mola-vertical', 'Mola vertical com massa', 112, 160, teto(22, 90, 10) + molaV(55, 10, 110, 8, 10)
    + '<rect x="35" y="110" width="40" height="36"/>' + tx(55, 128, 'm', 17) + trac('M66 80 H102', 1.2) + '<path d="M78 110 H102" stroke-width="1.2"/>'
    + seta(96, 86, 96, 108, 1.5, 8) + ti(84, 94, 'x', 15)],
  ['fis-pendulo', 'Pêndulo simples', 150, 140, teto(40, 110, 10) + trac('M75 10 V132', 1.4) + '<path d="M75 10 L131 107" stroke-width="2"/>'
    + '<circle cx="131" cy="107" r="10" fill="#C" stroke="none"/>' + arco(75, 10, 36, 270, 300) + ti(87, 58, 'θ', 16) + ti(116, 52, 'L')
    + '<path d="M19 107 A112 112 0 0 0 131 107" stroke-width="1.4" stroke-dasharray="3 5"/>'],
  ['fis-atrito', 'Força de atrito', 190, 100, '<path d="M8 74 ' + passo(8, 176, 8).map((x) => `L${x + 4} 79 L${x + 8} 74`).join(' ') + '"/>'
    + hach(passo(16, 182, 12).map((x) => [x, 80]), -7, 7) + '<rect x="62" y="32" width="58" height="42"/>' + seta(120, 52, 182, 52) + ti(160, 36, 'F')
    + seta(62, 68, 14, 68) + ti(34, 52, sub('F', 'at'))],
  ['fis-tracao', 'Corpo suspenso (tração e peso)', 110, 164, teto(22, 88, 10) + fina('M55 10 V82', 1.4) + '<rect x="35" y="82" width="40" height="32"/>'
    + seta(55, 82, 55, 34, 2.6, 12) + seta(55, 114, 55, 160) + ti(70, 46, 'T') + ti(70, 148, 'P')],
  ['fis-alavanca', 'Alavanca (braços e apoio)', 220, 116, '<path d="M10 50 H210" stroke-width="4"/><path d="M80 52 L66 76 H94 Z"/>' + chao(46, 116, 76)
    + seta(16, 8, 16, 46) + seta(204, 8, 204, 46) + ti(30, 18, 'R') + ti(190, 18, 'F') + trac('M16 52 V100 M80 82 V100 M204 52 V100', 1.2)
    + cota(16, 96, 80, 96, sub('d', '1'), 12, 15) + cota(80, 96, 204, 96, sub('d', '2'), 12, 15)],
  ['fis-colisao', 'Colisão entre dois corpos', 230, 90, chao(8, 222, 74) + '<rect x="20" y="40" width="44" height="34"/><rect x="152" y="40" width="44" height="34"/>'
    + tx(42, 57, sub('m', '1'), 16) + tx(174, 57, sub('m', '2'), 16) + seta(70, 56, 110, 56) + seta(146, 56, 122, 56) + ti(88, 38, sub('v', '1'), 16) + ti(134, 38, sub('v', '2'), 16)],
  ['fis-torque', 'Torque (momento de uma força)', 194, 124, '<rect x="24" y="76" width="134" height="14" rx="7"/><circle cx="32" cy="83" r="5"/>' + ponto(32, 83, 2)
    + seta(150, 83, 172, 20) + arco(150, 83, 20, 0, 70) + ti(176, 64, 'θ', 15) + ti(182, 34, 'F')
    + `<path d="M14 72 A20 20 0 0 1 50 64" stroke-width="1.8"/>` + head(52, 67, 60, 9) + ti(28, 44, 'τ', 18)
    + cota(32, 108, 150, 108, 'r', 10)],
];

// ---------- energia e trabalho ----------
const ENERGIA = [
  ['fis-montanha-russa', 'Montanha-russa (energia)', 240, 140, chao(8, 232, 132) + '<path d="M22 36 H40 C80 36 80 120 124 120 C168 120 170 66 200 66 H232"/>'
    + '<circle cx="31" cy="27" r="8" fill="#C" stroke="none"/>' + cota(12, 38, 12, 130, 'h', 10)],
  ['fis-trabalho', 'Trabalho de uma força', 210, 112, chao(8, 202, 80) + '<rect x="30" y="46" width="50" height="34"/>' + trac('M80 63 H150', 1.3)
    + seta(80, 63, 144, 26) + arco(80, 63, 28, 0, 30) + ti(118, 54, 'θ', 15) + ti(150, 18, 'F')
    + '<rect x="146" y="46" width="50" height="34" stroke-width="1.6" stroke-dasharray="5 4"/>' + cota(30, 100, 146, 100, 'd', 10)],
  ['fis-looping', 'Looping (movimento vertical)', 170, 156, chao(8, 162, 140) + '<circle cx="100" cy="84" r="56"/>'
    + '<circle cx="100" cy="37" r="8" fill="#C" stroke="none"/>' + seta(92, 18, 50, 18, 2.2, 10) + ti(40, 18, 'v')
    + fina('M100 84 L139.6 123.6', 1.4) + ponto(100, 84, 3) + ti(129, 104, 'R', 16) + seta(100, 50, 100, 72, 1.8, 9) + ti(112, 64, 'g', 15)],
  ['fis-grafico-hooke', 'Gráfico F × x (trabalho da mola)', 150, 134, eixos(26, 108, 146, 6, 'x', 'F')
    + '<path d="M26 108 L112 36 V108 Z" fill="#C" fill-opacity=".14" stroke="none"/><path d="M26 108 L128 23"/>' + trac('M112 36 V108', 1.2) + ti(88, 90, 'W', 16)],
  ['fis-barras-energia', 'Barras de energia (Ec, Ep, Em)', 160, 144, "<g transform=\"translate(0.00 0.00)\">" + ('<path d="M8 112 H152"/>'
    + '<rect x="20" y="72" width="30" height="40" fill="#C" fill-opacity=".25"/><rect x="66" y="62" width="30" height="50" fill="#C" fill-opacity=".25"/><rect x="112" y="22" width="30" height="90" fill="#C" fill-opacity=".5"/>'
    + ti(35, 126, sub('E', 'c'), 16) + ti(81, 126, sub('E', 'p'), 16) + ti(127, 126, sub('E', 'm'), 16)) + "</g>"],
];

// ---------- gravitação ----------
const elP = (t) => [120 + 100 * Math.cos(rad(t)), 70 - 56 * Math.sin(rad(t))];
const FOCO = 120 - Math.sqrt(100 * 100 - 56 * 56);
const setor = (t1, t2) => { const [a, b] = elP(t1), [c, d] = elP(t2); return `<path d="M${r1(FOCO)} 70 L${r1(a)} ${r1(b)} A100 56 0 0 0 ${r1(c)} ${r1(d)} Z" fill="#C" fill-opacity=".22" stroke-width="1.4"/>`; };
const ORB_SETA = (() => { const t = 105, [x, y] = elP(t), a = Math.atan2(-56 * Math.cos(rad(t)), -100 * Math.sin(rad(t))) * 180 / Math.PI; return head(r1(x), r1(y), r1(a), 11); })();
const GRAVITACAO = [
  ['fis-orbita', 'Órbita elíptica (Kepler)', 240, 140, '<ellipse cx="120" cy="70" rx="100" ry="56" stroke-width="2"/>' + trac('M20 70 H220', 1.1)
    + `<circle cx="${r1(FOCO)}" cy="70" r="10" fill="#C" stroke="none"/>` + ponto(r1(240 - FOCO), 70, 2.5) + `<circle cx="${r1(elP(60)[0])}" cy="${r1(elP(60)[1])}" r="7"/>`
    + tx(9, 70, 'P', 15) + tx(231, 70, 'A', 15) + ORB_SETA],
  ['fis-kepler-areas', 'Lei das áreas (Kepler)', 240, 140, '<ellipse cx="120" cy="70" rx="100" ry="56" stroke-width="2"/>' + setor(150, 210) + setor(-9, 9)
    + `<circle cx="${r1(FOCO)}" cy="70" r="9" fill="#C" stroke="none"/>` + ti(20, 24, sub('A', '1'), 16) + ti(206, 30, sub('A', '2'), 16)
   ],
  ['fis-atracao', 'Atração gravitacional', 230, 96, '<circle cx="40" cy="44" r="22"/><circle cx="190" cy="44" r="14"/>' + ti(40, 44, 'M', 17) + ti(190, 44, 'm', 15)
    + seta(64, 44, 104, 44) + seta(174, 44, 134, 44) + ti(84, 28, 'F') + ti(154, 28, 'F') + trac('M40 70 V88 M190 62 V88', 1.2) + cota(40, 84, 190, 84, 'd', 10)],
  ['fis-campo-gravitacional', 'Campo gravitacional (planeta)', 150, 150, '<circle cx="75" cy="75" r="26"/>' + ti(75, 75, 'M', 18)
    + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const [x1, y1] = pt(75, 75, 70, a), [x2, y2] = pt(75, 75, 32, a); return seta(x1, y1, x2, y2, 1.8, 10); }).join('')],
  ['fis-satelite', 'Satélite em órbita circular', 170, 160, '<circle cx="80" cy="90" r="24"/>' + fina('M60 78 Q80 86 100 78 M58 96 Q80 106 102 96', 1.2)
    + '<circle cx="80" cy="90" r="62" stroke-width="1.6" stroke-dasharray="6 5"/>' + '<rect x="73" y="22" width="14" height="12" fill="#C" stroke="none"/><path d="M60 28 H73 M87 28 H100" stroke-width="1.6"/><rect x="56" y="22" width="6" height="12" stroke-width="1.4"/><rect x="98" y="22" width="6" height="12" stroke-width="1.4"/>'
    + seta(108, 28, 152, 28) + ti(136, 14, 'v') + seta(80, 36, 80, 62, 2.2, 10) + ti(92, 52, 'F', 16)],
];

// ---------- hidrostática (fluidos) ----------
const HIDRO = [
  ['fis-empuxo', 'Empuxo (corpo submerso)', 140, 160, '<path d="M10 16 V150 H130 V16"/>' + fina('M10 40 H130', 1.6) + agua(112, 32)
    + '<rect x="50" y="70" width="40" height="40" fill="#C" fill-opacity=".14"/>' + ponto(70, 90, 3) + seta(70, 90, 70, 26) + seta(70, 90, 70, 144) + ti(84, 50, 'E') + ti(84, 134, 'P')],
  ['fis-flutuacao', 'Corpo flutuando', 150, 130, '<path d="M10 14 V120 H140 V14"/>' + fina('M10 50 H50 M100 50 H140', 1.6) + agua(124, 42)
    + '<rect x="50" y="28" width="50" height="46"/><rect x="50" y="50" width="50" height="24" fill="#C" fill-opacity=".25" stroke="none"/>' + ti(75, 98, sub('V', 'sub'), 15)],
  ['fis-stevin', 'Pressão na profundidade (Stevin)', 140, 160, '<path d="M10 14 V150 H130 V14"/>' + fina('M10 36 H130', 1.6) + agua(112, 28)
    + ponto(46, 62, 4) + ponto(46, 122, 4) + ti(32, 62, 'A', 16) + ti(32, 122, 'B', 16) + trac('M52 62 H96 M52 122 H96', 1.2) + cota(90, 62, 90, 122, 'h', 11)
   ],
  ['fis-torricelli', 'Barômetro de Torricelli', 130, 180, '<path d="M8 130 V172 H112 V130"/><path d="M8 146 H40 M60 146 H112" stroke-width="1.6"/>'
    + '<rect x="9" y="146" width="102" height="25" fill="#C" fill-opacity=".22" stroke="none"/>'
    + '<path d="M40 162 V22 A10 10 0 0 1 60 22 V162"/><rect x="41" y="46" width="18" height="116" fill="#C" fill-opacity=".22" stroke="none"/><path d="M40 46 H60" stroke-width="1.6"/>'
    + trac('M62 46 H100', 1.2) + cota(94, 46, 94, 146, 'h', 11) + tx(26, 160, 'Hg', 14)],
];

// ---------- termologia ----------
const termo = (x, a, b, u) => `<path d="M${x - 8} 134 V28 A8 8 0 0 1 ${x + 8} 28 V134"/><circle cx="${x}" cy="148" r="15"/><circle cx="${x}" cy="148" r="9" fill="#C" stroke="none"/>`
  + `<rect x="${x - 3}" y="78" width="6" height="64" fill="#C" stroke="none"/>` + fina(`M${x + 8} 42 H${x + 14} M${x + 8} 112 H${x + 14}`, 1.8) + tx(x + 30, 42, a, 14) + tx(x + 30, 112, b, 14) + tx(x, 10, u, 16);
const isoterma = (k) => curva((X) => [24 + X, 130 - k / X], k / 112, 150, 50);
const planck = (lam, T) => 1 / (lam ** 5 * (Math.exp(14.4 / (lam * T)) - 1));
const PMAX = planck(2.898 / 6, 6);
const TERMOLOGIA = [
  ['fis-escalas-termometricas', 'Escalas termométricas (°C, °F, K)', 240, 168, termo(30, '100', '0', '°C') + termo(110, '212', '32', '°F') + termo(190, '373', '273', 'K')
   ],
  ['fis-dilatacao', 'Dilatação linear', 230, 120, "<g transform=\"translate(0.00 5.00)\">" + (paredeE(12, 10, 82) + '<rect x="12" y="22" width="158" height="16"/>' + ti(90, 10, sub('L', '0'), 15)
    + '<rect x="12" y="54" width="188" height="16"/>' + fina('M170 54 V70', 1.4) + trac('M170 38 V96 M200 70 V96', 1.1) + seta(170, 90, 200, 90, 1.4, 7) + head(170, 90, 180, 7)
    + ti(185, 100, 'ΔL', 14) + ti(212, 30, sub('T', '0'), 15) + ti(216, 62, 'T', 15)) + "</g>"],
  ['fis-bimetal', 'Lâmina bimetálica', 180, 110, '<rect x="6" y="28" width="18" height="34" fill="#C" fill-opacity=".3"/>' + '<path d="M24 38 H170 V50 H24" stroke-width="1.4" stroke-dasharray="5 4"/>'
    + '<path d="M24 38 Q110 38 164 90 L156 98 Q102 50 24 50"/>' + fina('M24 44 Q106 44 160 94', 1.2) + ti(64, 26, sub('α', '1'), 15) + ti(64, 64, sub('α', '2'), 15)],
  ['fis-ciclo-carnot', 'Ciclo de Carnot (p × V)', 190, 166, eixos(24, 140, 184, 6, 'V', 'p')
    + qSeta(44, 26, 60, 52, 104, 56) + qSeta(104, 56, 126, 96, 164, 104) + qSeta(164, 104, 112, 112, 84, 116) + qSeta(84, 116, 56, 98, 44, 26)
    + tx(56, 20, 'A', 14) + tx(110, 46, 'B', 14) + tx(172, 94, 'C', 14) + tx(80, 128, 'D', 14) + ti(82, 32, sub('T', '1'), 15) + ti(136, 126, sub('T', '2'), 15)],
  ['fis-ciclo-pv', 'Ciclo termodinâmico (p × V, área = W)', 182, 163, "<g transform=\"translate(0.00 5.00)\">" + (eixos(24, 130, 174, 6, 'V', 'p')
    + '<rect x="50" y="36" width="100" height="62" fill="#C" fill-opacity=".14" stroke="none"/>' + '<path d="M100 36 H150 V98 H50 V36"/>'
    + head(104, 36, 0, 11) + head(150, 71, 90, 11) + head(96, 98, 180, 11) + head(50, 63, -90, 11) + ti(100, 67, 'W', 17)) + "</g>"],
  ['fis-isotermas', 'Isotermas (p × V)', 182, 163, "<g transform=\"translate(0.00 5.00)\">" + (eixos(24, 130, 174, 6, 'V', 'p')
    + `<path d="${isoterma(1300)}" stroke-width="2"/><path d="${isoterma(2400)}" stroke-width="2"/><path d="${isoterma(3800)}" stroke-width="2"/>`
    + ti(162, 112, sub('T', '1'), 14) + ti(162, 86, sub('T', '2'), 14) + ti(162, 62, sub('T', '3'), 14)) + "</g>"],
  ['fis-maquina-termica', 'Máquina térmica', 160, 190, '<rect x="16" y="8" width="128" height="32" rx="4"/>' + tx(80, 24, 'Fonte quente', 14)
    + '<circle cx="80" cy="95" r="22"/>' + tx(80, 95, 'M', 18) + '<rect x="16" y="150" width="128" height="32" rx="4"/>' + tx(80, 166, 'Fonte fria', 14)
    + seta(80, 40, 80, 72) + seta(80, 117, 80, 150) + seta(102, 95, 152, 95) + ti(98, 56, sub('Q', '1'), 16) + ti(98, 134, sub('Q', '2'), 16) + ti(132, 80, 'W')],
  ['fis-refrigerador', 'Refrigerador (máquina frigorífica)', 160, 190, '<rect x="16" y="8" width="128" height="32" rx="4"/>' + tx(80, 24, 'Fonte quente', 14)
    + '<circle cx="80" cy="95" r="22"/>' + tx(80, 95, 'R', 18) + '<rect x="16" y="150" width="128" height="32" rx="4"/>' + tx(80, 166, 'Fonte fria', 14)
    + seta(80, 73, 80, 40) + seta(80, 150, 80, 117) + seta(152, 95, 102, 95) + ti(98, 56, sub('Q', '1'), 16) + ti(98, 134, sub('Q', '2'), 16) + ti(132, 80, 'W')],
  ['fis-gas-pistao', 'Gás no cilindro com pistão', 140, 172, '<path d="M20 20 V134 H120 V20"/><rect x="22" y="58" width="96" height="14" fill="#C" fill-opacity=".35"/><path d="M70 58 V12"/>'
    + [[38, 88], [62, 82], [96, 92], [48, 112], [80, 106], [104, 120], [30, 124], [70, 126]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#C" stroke="none"/>`).join('')
    + seta(96, 50, 96, 18, 2, 10) + ti(110, 34, 'W', 16) + seta(52, 168, 52, 140, 2.2, 10) + seta(88, 168, 88, 140, 2.2, 10) + ti(70, 156, 'Q', 16)],
  ['fis-curva-aquecimento', 'Curva de aquecimento (T × Q)', 200, 156, eixos(28, 132, 196, 6, 'Q', 'T')
    + '<path d="M28 122 L52 92 H86 L122 54 H168 L190 26"/>' + trac('M28 92 H52 M28 54 H122', 1.2) + ti(14, 92, sub('T', 'F'), 14) + ti(14, 54, sub('T', 'E'), 14)
    + tx(69, 80, 'fusão', 14) + tx(145, 42, 'ebulição', 14)],
  ['fis-conducao', 'Condução de calor (barra)', 220, 100, '<rect x="8" y="28" width="32" height="50" fill="#C" fill-opacity=".35"/><rect x="40" y="42" width="140" height="22"/><rect x="180" y="28" width="32" height="50"/>'
    + tx(24, 53, sub('T', '1'), 15) + tx(196, 53, sub('T', '2'), 15) + seta(76, 18, 146, 18, 2.2, 11) + ti(160, 12, 'Q', 15) + cota(40, 88, 180, 88, 'L', 10)],
  ['fis-calorimetro', 'Calorímetro', 120, 150, '<rect x="12" y="38" width="96" height="104" rx="4"/><rect x="26" y="50" width="68" height="80"/><path d="M6 38 H114" stroke-width="3.5"/>'
    + trac('M26 74 H94', 1.2) + '<path d="M40 10 V98"/><path d="M48 10 V98"/><path d="M40 10 A4 4 0 0 1 48 10"/><circle cx="44" cy="104" r="7" fill="#C" stroke="none"/>'
    + '<path d="M78 14 V112 M68 112 H88" stroke-width="2"/><path d="M72 14 H84" stroke-width="3"/>'],
];

// ---------- ondas ----------
const ondaT = (x0, x1, y, A, lam, f = 0) => curva((x) => [x, y - A * Math.sin(2 * Math.PI * (x - x0) / lam + f)], x0, x1, 120);
const longX = passo(0, 36, 1).map((i) => { const u = 12 + i * 6; return u - 8 * Math.sin(2 * Math.PI * (u - 12) / 72); });
const arcosLim = (sx, sy, rs, H, amax = 90) => rs.map((r) => arco(sx, sy, r, -Math.min(amax, Math.asin(Math.min(1, (H - 6 - sy) / r)) * 180 / Math.PI), Math.min(amax, Math.asin(Math.min(1, (sy - 6) / r)) * 180 / Math.PI), 1.4)).join('');
const ONDAS = [
  ['fis-onda-transversal', 'Onda transversal (λ e A)', 240, 106, trac('M8 60 H232', 1.2) + `<path d="${ondaT(12, 228, 60, 34, 96)}"/>`
    + trac('M36 26 V14 M132 26 V14', 1.1) + cota(36, 14, 132, 14, 'λ', 10) + seta(180, 60, 180, 92, 1.5, 8) + ti(194, 72, 'A', 15)],
  ['fis-onda-longitudinal', 'Onda longitudinal (compressão)', 240, 98, fina(longX.map((x) => `M${r1(x)} 18 V60`).join(' '), 2)
    + cota(84, 84, 156, 84, 'λ', 10)],
  ['fis-onda-estacionaria', 'Onda estacionária (nós e ventres)', 240, 112, '<path d="M12 22 V88 M228 22 V88" stroke-width="3"/>'
    + `<path d="${curva((x) => [x, 55 - 32 * Math.sin(3 * Math.PI * (x - 12) / 216)], 12, 228, 120)}"/>`
    + `<path d="${curva((x) => [x, 55 + 32 * Math.sin(3 * Math.PI * (x - 12) / 216)], 12, 228, 120)}" stroke-width="1.6" stroke-dasharray="5 4"/>`
    + [12, 84, 156, 228].map((x) => tx(x, 102, 'N', 14)).join('') + [48, 120, 192].map((x) => tx(x, 102, 'V', 14)).join('')],
  ['fis-interferencia', 'Interferência (duas fontes)', 220, 160, ponto(20, 60, 4) + ponto(20, 100, 4) + arcosLim(20, 60, passo(18, 180, 18), 160) + arcosLim(20, 100, passo(18, 180, 18), 160)
   ],
  ['fis-difracao', 'Difração numa fenda', 200, 140, fina('M16 10 V130 M32 10 V130 M48 10 V130 M64 10 V130', 1.6) + '<path d="M84 4 V56 M84 84 V136" stroke-width="5"/>'
    + arcosLim(86, 70, passo(16, 106, 15), 140, 88)],
  ['fis-doppler', 'Efeito Doppler', 200, 150, [1, 2, 3, 4, 5].map((k) => `<circle cx="${130 - 8 * k}" cy="75" r="${13 * k}" stroke-width="1.6"/>`).join('')
    + '<circle cx="130" cy="75" r="5" fill="#C" stroke="none"/>' + seta(138, 75, 190, 75, 2.4, 11) + ti(182, 60, 'v')],
  ['fis-fenda-dupla', 'Fenda dupla (Young)', 240, 140, fina('M12 10 V130 M26 10 V130 M40 10 V130', 1.6) + '<path d="M62 4 V54 M62 64 V76 M62 86 V136" stroke-width="5"/>'
    + arcosLim(64, 59, [14, 28, 42], 140, 70) + arcosLim(64, 81, [14, 28, 42], 140, 70) + fina('M196 8 V132', 3)
    + `<path d="${curva((y) => { const u = (y - 70) / 48, s = Math.abs(u) < 1e-6 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u); return [200 + 34 * s * s * Math.cos(Math.PI * (y - 70) / 13) ** 2, y]; }, 10, 130, 240)}" stroke-width="1.8"/>`],
  ['fis-espectro-em', 'Espectro eletromagnético', 260, 84, '<rect x="8" y="28" width="244" height="26"/>' + fina(passo(1, 6, 1).map((i) => `M${r1(8 + i * 244 / 7)} 28 V54`).join(' '), 1.4)
   
    + ['Rádio', 'Micro-ondas', 'IV', 'Luz', 'UV', 'X', 'γ'].map((s, i) => tx(8 + (i + 0.5) * 244 / 7, i % 2 ? 68 : 15, s, 14)).join('')],
  ['fis-pulso', 'Pulso numa corda', 220, 84, paredeD(212, 30, 76) + `<path d="${curva((x) => [x, 66 - 36 * Math.exp(-(((x - 90) / 18) ** 2))], 8, 212, 120)}"/>` + seta(116, 20, 156, 20, 2.2, 10) + ti(170, 20, 'v')],
  ['fis-tubo-sonoro', 'Tubo sonoro fechado (fundamental)', 220, 96, '<path d="M10 20 H210 V70 H10"/><path d="M210 20 V70" stroke-width="5"/>'
    + `<path d="${curva((x) => [x, 45 - 20 * Math.cos(Math.PI * (x - 10) / 400)], 10, 210, 60)}" stroke-width="1.8"/><path d="${curva((x) => [x, 45 + 20 * Math.cos(Math.PI * (x - 10) / 400)], 10, 210, 60)}" stroke-width="1.8"/>`
    + cota(10, 86, 210, 86, 'L', 10)],
];

// ---------- óptica ----------
const lenteSeta = (x, y1, y2, conv) => `<path d="M${x} ${y1} V${y2}" stroke-width="2.4"/>` + (conv ? head(x, y1, -90, 11) + head(x, y2, 90, 11)
  : `<path d="M${x - 7} ${y1 - 8} L${x} ${y1} L${x + 7} ${y1 - 8} M${x - 7} ${y2 + 8} L${x} ${y2} L${x + 7} ${y2 + 8}" stroke-width="2.4"/>`);
const OPTICA = [
  ['fis-espelho-plano', 'Espelho plano (imagem virtual)', 200, 134, '<path d="M100 8 V126" stroke-width="3"/>' + hach(passo(12, 120, 10).map((y) => [100, y]), 7, 7)
    + fina('M20 104 H180', 1.2) + seta(50, 104, 50, 50) + seta(150, 104, 150, 50, 1.8, 12, ' stroke-dasharray="5 4"') + seta(50, 50, 100, 80, 1.8, 10) + seta(100, 80, 46, 112.4, 1.8, 10)
    + trac('M100 80 L150 50', 1.4) + tx(36, 64, 'O', 15) + tx(164, 64, 'I', 15)],
  ['fis-espelho-concavo', 'Espelho côncavo (C, F, V)', 220, 134, trac('M8 65 H212', 1.2) + '<path d="M180.8 15 A140 140 0 0 1 180.8 115" stroke-width="3"/>'
    + hach(passo(20, 108, 11).map((y) => [r1(50 + Math.sqrt(140 * 140 - (y - 65) ** 2)) + 2, y]), 7, 4)
    + ponto(50, 65) + ponto(120, 65) + ponto(190, 65) + tx(50, 82, 'C', 15) + tx(120, 82, 'F', 15) + tx(178, 82, 'V', 15)
    + seta(10, 40, 100, 40, 1.8, 10) + '<path d="M100 40 H187.7 L120 65" stroke-width="1.8"/>' + seta(120, 65, 72, 82.7, 1.8, 10)],
  ['fis-espelho-convexo', 'Espelho convexo', 220, 134, trac('M8 65 H212', 1.2) + '<path d="M90.9 15 A120 120 0 0 0 90.9 115" stroke-width="3"/>'
    + hach(passo(20, 108, 11).map((y) => [r1(200 - Math.sqrt(120 * 120 - (y - 65) ** 2)) + 2, y]), 7, 4)
    + ponto(80, 65) + ponto(140, 65) + ponto(200, 65) + tx(70, 82, 'V', 15) + tx(140, 82, 'F', 15) + tx(200, 82, 'C', 15)
    + seta(10, 40, 60, 40, 1.8, 10) + '<path d="M60 40 H82.6" stroke-width="1.8"/>' + seta(82.6, 40, 24, 14.5, 1.8, 10) + trac('M82.6 40 L140 65', 1.3)],
  ['fis-lente-convergente', 'Lente convergente', 200, 120, trac('M8 60 H192', 1.2) + '<path d="M100 10 Q124 60 100 110 Q76 60 100 10 Z"/>'
    + '<path d="M10 36 H100 L190 79.2 M10 84 H100 L190 40.8" stroke-width="1.6"/>' + head(56, 36, 0, 9) + head(56, 84, 0, 9) + head(176, 72.5, 25.6, 9) + head(176, 47.5, -25.6, 9)
    + ponto(50, 60) + ponto(150, 60) + tx(50, 50, 'F', 15) + tx(160, 42, "F'", 15)],
  ['fis-lente-divergente', 'Lente divergente', 200, 120, trac('M8 60 H192', 1.2) + '<path d="M88 10 H112 Q98 60 112 110 H88 Q102 60 88 10 Z"/>'
    + '<path d="M10 44 H100 L190 15.2 M10 76 H100 L190 104.8" stroke-width="1.6"/>' + head(56, 44, 0, 9) + head(56, 76, 0, 9) + head(176, 19.7, -17.7, 9) + head(176, 100.3, 17.7, 9)
    + trac('M100 44 L50 60 L100 76', 1.2) + ponto(50, 60) + ponto(150, 60) + tx(50, 76, 'F', 15) + tx(150, 76, "F'", 15)],
  ['fis-imagem-lente', 'Formação de imagem (lente convergente)', 240, 140, trac('M8 70 H232', 1.2) + lenteSeta(120, 12, 128, true)
    + seta(40, 70, 40, 34, 2.4, 11) + seta(200, 70, 200, 106, 2.4, 11)
    + '<path d="M40 34 H120 L200 106 M40 34 L200 106 M40 34 L120 106 H200" stroke-width="1.4"/>'
    + ponto(80, 70, 3) + ponto(160, 70, 3) + tx(80, 84, 'F', 14) + tx(160, 56, "F'", 14)],
  ['fis-refracao', 'Refração (lei de Snell)', 170, 170, '<rect x="8" y="85" width="154" height="77" fill="#C" fill-opacity=".1" stroke="none"/><path d="M8 85 H162" stroke-width="2"/>' + trac('M85 8 V162', 1.2)
    + '<path d="M40 31.4 L85 85 L116.7 153" stroke-width="2.2"/>' + head(63, 58.6, 50, 11) + head(101.5, 120.4, 65, 11)
    + arco(85, 85, 30, 90, 130) + arco(85, 85, 34, 270, 295) + ti(72, 46, sub('θ', '1'), 15) + ti(98, 132, sub('θ', '2'), 15) + ti(26, 70, sub('n', '1'), 15) + ti(26, 102, sub('n', '2'), 15)],
  ['fis-reflexao', 'Reflexão (ângulos iguais)', 190, 112, '<path d="M10 92 H180" stroke-width="3"/>' + hach(passo(16, 178, 12).map((x) => [x, 92]), -7, 7) + trac('M95 12 V92', 1.2)
    + '<path d="M35 26 L95 92 L155 26" stroke-width="2.2"/>' + head(65, 59, 47.7, 11) + head(130, 53.5, -47.7, 11) + arco(95, 92, 28, 90, 132.3) + arco(95, 92, 32, 47.7, 90) + ti(84, 54, 'i', 15) + ti(108, 52, 'r', 15)],
  ['fis-reflexao-total', 'Reflexão total (ângulo limite)', 190, 130, '<rect x="8" y="60" width="174" height="64" fill="#C" fill-opacity=".1" stroke="none"/><path d="M8 60 H182" stroke-width="2"/>' + ponto(50, 118, 4)
    + '<path d="M50 118 L70 60 L82 10 M50 118 L104 60 H180 M50 118 L134 60 L182 93.2" stroke-width="1.6"/>' + head(76, 35, -76.5, 9) + head(150, 60, 0, 9) + head(166, 82, 34.6, 9)
    + trac('M104 30 V90', 1.1) + arco(104, 60, 18, 227, 270, 1.4) + ti(118, 86, sub('θ', 'L'), 14)],
  ['fis-prisma', 'Prisma (dispersão da luz)', 220, 130, '<path d="M110 12 L48 120 H172 Z"/>' + '<path d="M8 90 L79 66" stroke-width="2.4"/>' + head(48, 76.5, -18.7, 11)
    + fina('M79 66 L140 64 M79 66 L143 70 M79 66 L146 76', 1.4) + fina('M140 64 L212 80 M143 70 L212 98 M146 76 L212 116', 1.8) + tx(46, 52, 'luz branca', 14)],
  ['fis-olho', 'Olho humano (esquema óptico)', 210, 130, '<circle cx="118" cy="65" r="50"/><path d="M76 38 Q58 65 76 92" />' + '<ellipse cx="84" cy="65" rx="7" ry="20" stroke-width="2"/>'
    + arco(118, 65, 50, -40, 40, 5) + '<path d="M166 56 L200 52 M166 74 L200 78"/>' + fina('M8 42 L84 50 L167 65 M8 88 L84 80 L167 65', 1.4) + ponto(167, 65, 3.5) + tx(186, 22, 'retina', 14)],
  ['fis-camara-escura', 'Câmara escura', 210, 120, '<path d="M100 53 V14 H196 V106 H100 V67"/>' + seta(20, 84, 20, 36, 2.4, 11)
    + seta(194, 33, 194, 86, 2.4, 11) + fina('M20 36 L194 88.2 M20 84 L194 31.8', 1.3)],
  ['fis-fibra-optica', 'Fibra óptica (reflexão total)', 230, 80, '<path d="M10 12 H220 M10 68 H220"/>' + fina('M10 22 H220 M10 58 H220', 1.4)
    + '<path d="M10 48 L50 22 L95 58 L140 22 L185 58 L212 40" stroke-width="2"/>' + head(218, 36, -33.7, 10)],
];

// ---------- eletrostática e campo elétrico ----------
const raios = (cx, cy, rIn, rOut, angs, sai) => angs.map((a) => { const [x1, y1] = pt(cx, cy, sai ? rIn : rOut, a), [x2, y2] = pt(cx, cy, sai ? rOut : rIn, a); return seta(x1, y1, x2, y2, 1.8, 10); }).join('');
const ELETRO = [
  ['fis-carga-positiva', 'Carga positiva (campo saindo)', 130, 130, carga(65, 65, 16, '+') + raios(65, 65, 22, 60, passo(0, 315, 45), true)],
  ['fis-carga-negativa', 'Carga negativa (campo entrando)', 130, 130, carga(65, 65, 16, '−') + raios(65, 65, 22, 60, passo(0, 315, 45), false)],
  ['fis-dipolo', 'Linhas de campo (dipolo)', 230, 150, carga(60, 75, 14, '+') + carga(170, 75, 14, '−') + seta(76, 75, 118, 75, 1.8, 10) + fina('M110 75 H154', 1.8)
    + [36, 76, 120].map((k) => qSeta(72, 68, 115, 75 - k, 158, 68, 0.5, 1.8, 10) + qSeta(72, 82, 115, 75 + k, 158, 82, 0.5, 1.8, 10)).join('')
    + raios(60, 75, 20, 54, [160, 180, 200], true) + raios(170, 75, 20, 54, [20, 0, -20], false)],
  ['fis-cargas-iguais', 'Linhas de campo (cargas iguais)', 230, 150, carga(70, 75, 14, '+') + carga(160, 75, 14, '+') + raios(70, 75, 20, 60, [100, 140, 180, 220, 260], true) + raios(160, 75, 20, 60, [80, 40, 0, -40, -80], true)
    + '<path d="M80 65 Q102 44 104 10 M150 65 Q128 44 126 10 M80 85 Q102 106 104 140 M150 85 Q128 106 126 140" stroke-width="1.8"/>' + head(104, 10, -88, 10) + head(126, 10, -92, 10) + head(104, 140, 88, 10) + head(126, 140, 92, 10)],
  ['fis-coulomb', 'Força elétrica (Coulomb)', 230, 96, carga(40, 44, 16, '+') + carga(190, 44, 16, '−') + seta(60, 44, 100, 44) + seta(170, 44, 130, 44) + ti(80, 28, 'F') + ti(150, 28, 'F')
    + trac('M40 64 V90 M190 64 V90', 1.2) + cota(40, 84, 190, 84, 'd', 10)],
  ['fis-capacitor-placas', 'Capacitor de placas paralelas', 171, 163, "<g transform=\"translate(0.00 6.00)\">" + ('<rect x="20" y="22" width="130" height="8" fill="#C"/><rect x="20" y="120" width="130" height="8" fill="#C"/>'
    + [40, 62, 85, 108, 130].map((x) => seta(x, 36, x, 114, 1.8, 10)).join('')
    + [40, 70, 100, 130].map((x) => tx(x, 11, '+', 18) + tx(x, 140, '−', 18)).join('') + ti(160, 75, 'E')) + "</g>"],
  ['fis-eletroscopio', 'Eletroscópio de folhas', 120, 170, '<circle cx="60" cy="16" r="10"/><path d="M60 26 V100"/><rect x="20" y="62" width="80" height="100" rx="14"/><rect x="48" y="56" width="24" height="12" fill="#C" fill-opacity=".3"/>'
    + '<path d="M60 100 L42 140 L48 142 L60 104 Z M60 100 L78 140 L72 142 L60 104 Z" fill="#C"/>'],
  ['fis-equipotenciais', 'Superfícies equipotenciais', 150, 150, carga(75, 75, 12, '+') + [30, 48, 66].map((r) => `<circle cx="75" cy="75" r="${r}" stroke-width="1.4" stroke-dasharray="5 4"/>`).join('')
    + raios(75, 75, 16, 72, [45, 135, 225, 315], true)],
  ['fis-campo-uniforme', 'Carga num campo elétrico uniforme', 220, 130, '<rect x="30" y="10" width="180" height="8" fill="#C"/><rect x="30" y="112" width="180" height="8" fill="#C"/>' + tx(16, 14, '+', 18) + tx(16, 116, '−', 18)
    + [70, 110, 150, 190].map((x) => seta(x, 24, x, 46, 1.6, 8)).join('') + '<circle cx="24" cy="66" r="6" fill="#C" stroke="none"/>' + seta(32, 66, 58, 66, 2, 9)
    + '<path d="M58 66 Q120 66 196 104" stroke-width="1.8" stroke-dasharray="6 5"/>' + ti(200, 36, 'E', 16)],
];

// ---------- magnetismo ----------
const espiras = (x0, n, dx, cy, ry, rx = 7) => passo(0, n - 1, 1).map((i) => `<ellipse cx="${x0 + i * dx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke-width="2"/>`).join('');
const xis = (x, y, s = 6) => `<path d="M${x - s} ${y - s} L${x + s} ${y + s} M${x + s} ${y - s} L${x - s} ${y + s}" stroke-width="2"/>`;
const sai = (x, y) => `<circle cx="${x}" cy="${y}" r="9" stroke-width="2"/>` + ponto(x, y, 3);
const MAGNETISMO = [
  ['fis-ima', 'Ímã em barra (N e S)', 180, 70, '<rect x="10" y="17" width="160" height="36" rx="3"/><rect x="10" y="17" width="80" height="36" fill="#C" fill-opacity=".25" stroke="none"/><path d="M90 17 V53"/>' + tx(50, 35, 'N', 20) + tx(130, 35, 'S', 20)],
  ['fis-ima-linhas', 'Ímã com linhas de campo', 230, 160, '<rect x="75" y="68" width="80" height="24"/><rect x="75" y="68" width="40" height="24" fill="#C" fill-opacity=".25" stroke="none"/><path d="M115 68 V92"/>' + tx(95, 80, 'N', 15) + tx(135, 80, 'S', 15)
    + [1, 2, 3].map((k) => cSeta([75, 72], [75 - 32 * k, 72 - 30 * k], [155 + 32 * k, 72 - 30 * k], [155, 72]) + cSeta([75, 88], [75 - 32 * k, 88 + 30 * k], [155 + 32 * k, 88 + 30 * k], [155, 88])).join('')
    + seta(73, 80, 14, 80, 1.8, 10) + seta(216, 80, 158, 80, 1.8, 10)],
  ['fis-ima-ferradura', 'Ímã em ferradura', 140, 150, '<path d="M30 22 V96 A40 40 0 0 0 110 96 V22 H86 V96 A16 16 0 0 1 54 96 V22 Z"/><path d="M30 46 H54 M86 46 H110" stroke-width="1.6"/>'
    + tx(42, 34, 'N', 15) + tx(98, 34, 'S', 15) + seta(57, 34, 84, 34, 1.6, 8) + seta(57, 58, 84, 58, 1.6, 8) + qSeta(42, 20, 70, -8, 98, 20, 0.5, 1.6, 9)],
  ['fis-fio-campo', 'Campo de um fio com corrente', 150, 160, '<path d="M75 8 V152" stroke-width="2.6"/>' + head(75, 10, -90, 12)
    + '<ellipse cx="75" cy="64" rx="52" ry="14" stroke-width="1.8"/><ellipse cx="75" cy="112" rx="36" ry="10" stroke-width="1.8"/>' + head(80, 78, 0, 10) + head(80, 122, 0, 9)
    + ti(90, 22, 'i') + vetLbl(138, 46, 'B', 17)],
  ['fis-mao-direita', 'Regra da mão direita (fio)', 150, 176, '<path d="M75 6 V56 M75 124 V170" stroke-width="2.6"/>' + head(75, 8, -90, 12) + ti(90, 18, 'i')
    + '<path d="M54 62 V34 Q54 26 62 26 Q70 26 70 34 V62"/>' + '<rect x="40" y="60" width="74" height="62" rx="16"/>'
    + fina('M88 62 Q112 66 112 76 M88 76 Q114 80 112 92 M88 92 Q114 96 112 106 M88 106 Q112 110 110 118', 1.5)
    + '<path d="M28 146 A47 13 0 0 0 122 146" stroke-width="1.8"/>' + head(122, 145, -60, 10) + vetLbl(136, 162, 'B', 16)],
  ['fis-campo-entrando', 'Campo magnético entrando (×)', 120, 120, [30, 60, 90].map((y) => [30, 60, 90].map((x) => xis(x, y)).join('')).join('')],
  ['fis-campo-saindo', 'Campo magnético saindo (•)', 120, 120, [30, 60, 90].map((y) => [30, 60, 90].map((x) => sai(x, y)).join('')).join('')],
  ['fis-espira', 'Espira com corrente', 150, 150, '<circle cx="75" cy="80" r="46" stroke-width="2.4"/>' + head(70, 34, 180, 12) + head(80, 126, 0, 12) + sai(75, 80) + ti(75, 18, 'i') + vetLbl(100, 82, 'B', 16)],
  ['fis-solenoide', 'Solenoide (campo interno)', 230, 130, espiras(44, 8, 20, 62, 30) + seta(24, 62, 214, 62, 2, 11) + vetLbl(206, 44, 'B', 16)
    + '<path d="M44 92 V122 M184 92 V122" stroke-width="2"/>' + ti(30, 112, 'i', 16)],
  ['fis-inducao', 'Indução (ímã e bobina)', 240, 150, '<rect x="18" y="50" width="72" height="24"/><rect x="54" y="50" width="36" height="24" fill="#C" fill-opacity=".25" stroke="none"/><path d="M54 50 V74"/>' + tx(36, 62, 'S', 15) + tx(72, 62, 'N', 15)
    + seta(34, 32, 76, 32, 2.2, 10) + ti(56, 16, 'v') + espiras(130, 4, 20, 62, 26) + '<path d="M130 88 V124 H146 M190 88 V124 H174" stroke-width="2"/>'
    + '<circle cx="160" cy="124" r="14"/>' + tx(160, 124, 'G', 14)],
  ['fis-motor-esquema', 'Motor elétrico (esquema)', 230, 140, '<rect x="8" y="30" width="42" height="80"/><rect x="180" y="30" width="42" height="80"/>' + tx(29, 70, 'N', 18) + tx(201, 70, 'S', 18)
    + '<path d="M80 92 V44 H150 V92 H122 M108 92 H80"/>' + seta(66, 86, 66, 46, 2.2, 10) + seta(164, 46, 164, 86, 2.2, 10) + ti(66, 30, 'F', 16) + ti(164, 100, 'F', 16)
    + '<path d="M108 92 V112 M122 92 V112"/>' + '<path d="M113 112 A10 10 0 0 0 113 132 M117 112 A10 10 0 0 1 117 132" stroke-width="2.4"/>' + '<rect x="94" y="117" width="8" height="10" fill="#C"/><rect x="128" y="117" width="8" height="10" fill="#C"/>'
   ],
  ['fis-bussola', 'Bússola', 110, 110, '<circle cx="55" cy="55" r="48"/>' + '<path d="M55 30 L63 55 H47 Z" fill="#C"/><path d="M55 80 L63 55 H47 Z"/>' + ponto(55, 55, 2.5)
    + tx(55, 17, 'N', 14) + tx(55, 94, 'S', 14) + tx(93, 55, 'L', 14) + tx(17, 55, 'O', 14)],
  ['fis-carga-campo-magnetico', 'Carga em campo magnético (MCU)', 150, 150, passo(15, 135, 30).flatMap((y) => passo(15, 135, 30).map((x) => [x, y])).filter(([x, y]) => { const d = Math.hypot(x - 75, y - 75); return d > 56 && y < 120; }).map(([x, y]) => xis(x, y, 5)).join('')
    + '<circle cx="75" cy="75" r="40" stroke-width="1.6" stroke-dasharray="6 5"/>' + '<circle cx="75" cy="115" r="6" fill="#C" stroke="none"/>' + seta(83, 115, 122, 115, 2.2, 10) + seta(75, 107, 75, 84, 2.2, 10) + ti(118, 132, 'v') + ti(88, 92, 'F', 15)],
];

// ---------- física moderna ----------
const nucleos = [[0, 0], ...passo(0, 300, 60).map((a) => [20 * Math.cos(rad(a)), 20 * Math.sin(rad(a))]), ...passo(30, 330, 60).map((a) => [34.6 * Math.cos(rad(a)), 34.6 * Math.sin(rad(a))])];
const MODERNA = [
  ['fis-bohr', 'Átomo de Bohr (órbitas)', 180, 170, '<circle cx="80" cy="85" r="8" fill="#C" stroke="none"/>' + [22, 44, 66].map((r) => `<circle cx="80" cy="85" r="${r}" stroke-width="1.6"/>`).join('')
    + '<circle cx="126.7" cy="38.3" r="5" fill="#C" stroke="none"/>' + seta(124, 42, 113, 53, 1.6, 7) + onda(118, 58, 172, 90, 5, 3, 1.8, 10) + ti(160, 64, 'hf', 15)
    + tx(96, 104, '1', 14) + tx(106, 128, '2', 14) + tx(118, 150, '3', 14)],
  ['fis-niveis-energia', 'Níveis de energia (transições)', 180, 156, seta(20, 150, 20, 8, 2, 10) + ti(34, 12, 'E') + fina('M40 140 H140 M40 84 H140 M40 54 H140 M40 38 H140', 2)
    + tx(160, 140, 'n=1', 14) + tx(160, 84, 'n=2', 14) + tx(160, 54, 'n=3', 14) + tx(160, 36, 'n=4', 14)
    + seta(64, 54, 64, 84, 1.8, 9) + seta(92, 84, 92, 140, 1.8, 9) + seta(118, 38, 118, 84, 1.8, 9)],
  ['fis-fotoeletrico', 'Efeito fotoelétrico', 210, 130, '<rect x="20" y="90" width="170" height="22" fill="#C" fill-opacity=".25"/>' + tx(105, 101, 'metal', 14)
    + onda(26, 14, 84, 86, 5, 4) + ti(78, 40, 'hf', 16) + '<circle cx="116" cy="82" r="4" fill="#C" stroke="none"/>' + seta(120, 78, 166, 32, 2, 10) + ti(180, 40, 'e⁻', 16)],
  ['fis-grafico-fotoeletrico', 'Gráfico Ec × f (fotoelétrico)', 170, 140, eixos(32, 90, 164, 6, 'f', sub('E', 'c'), 32, 134) + '<path d="M72 90 L150 12" stroke-width="2.4"/>' + trac('M72 90 L32 130', 1.6)
    + ti(72, 104, sub('f', '0'), 15) + tx(16, 128, '−φ', 15)],
  ['fis-espectro-emissao', 'Espectro de linhas (emissão)', 230, 74, '<rect x="10" y="12" width="210" height="36"/>' + fina('M58 12 V48 M118 12 V48 M152 12 V48 M168 12 V48', 3.5) + seta(10, 62, 214, 62, 1.6, 9) + ti(224, 62, 'λ', 15)],
  ['fis-espectro-absorcao', 'Espectro de absorção', 230, 74, '<rect x="10" y="12" width="210" height="36" fill="#C" fill-opacity=".25"/>' + fina('M58 12 V48 M118 12 V48 M152 12 V48 M168 12 V48', 3.5) + seta(10, 62, 214, 62, 1.6, 9) + ti(224, 62, 'λ', 15)],
  ['fis-corpo-negro', 'Radiação de corpo negro', 190, 146, eixos(24, 122, 186, 6, 'λ', 'I')
    + [6, 5, 4].map((T0) => `<path d="${curva((l) => [24 + l * 52, 122 - 100 * planck(l, T0) / PMAX], 0.12, 3, 120)}" stroke-width="2"/>`).join('')
    + ti(70, 14, sub('T', '1'), 14) + ti(96, 62, sub('T', '2'), 14) + ti(128, 92, sub('T', '3'), 14)],
  ['fis-rutherford', 'Experimento de Rutherford', 210, 130, '<rect x="8" y="54" width="30" height="22"/>' + tx(23, 65, 'α', 15) + '<path d="M118 14 V116" stroke-width="3"/>' + tx(134, 14, 'Au', 14)
    + '<path d="M38 65 H118" stroke-width="1.8"/>' + seta(118, 65, 200, 65, 1.8, 9) + seta(118, 65, 190, 26, 1.6, 9) + seta(118, 65, 186, 108, 1.6, 9) + seta(118, 65, 70, 22, 1.6, 9)
   ],
  ['fis-decaimento', 'Decaimento radioativo (meia-vida)', 200, 144, eixos(44, 118, 196, 6, 't', 'N') + `<path d="${curva((x) => [x, 118 - 98 * 2 ** (-(x - 44) / 36)], 44, 190, 80)}" stroke-width="2.4"/>`
    + trac('M44 69 H80 V118 M44 93.5 H116 V118', 1.2) + tx(22, 20, sub('N', '0'), 14) + tx(24, 69, 'N₀/2', 14) + tx(24, 93.5, 'N₀/4', 14)
    + tx(80, 132, 'T½', 14) + tx(116, 132, '2T½', 14)],
  ['fis-nucleo', 'Núcleo atômico (prótons e nêutrons)', 110, 110, nucleos.map(([x, y], i) => `<circle cx="${r1(55 + x)}" cy="${r1(55 + y)}" r="9.5"${i % 2 ? ' fill="#C"' : ''} stroke-width="1.8"/>`).join('')],
  ['fis-foton', 'Fóton (hf)', 170, 60, onda(10, 34, 160, 34, 9, 5, 2.2, 12) + ti(85, 10, 'hf', 15)],
];

// ---------- instrumentos ----------
const INSTRUMENTOS = [
  ['fis-dinamometro', 'Dinamômetro', 80, 184, '<circle cx="40" cy="12" r="6"/><rect x="28" y="18" width="24" height="112" rx="3"/>' + fina(passo(30, 120, 10).map((y, i) => `M28 ${y} H${i % 5 ? 33 : 37}`).join(' '), 1.3)
    + molaV(40, 20, 90, 7, 6).replace('stroke-width="2"', 'stroke-width="1.6"') + '<path d="M33 90 H50" stroke-width="2.4"/><path d="M40 90 V160 A8 8 0 0 1 24 160 V156"/>'],
  ['fis-cronometro', 'Cronômetro', 120, 140, '<circle cx="60" cy="82" r="46"/><rect x="52" y="20" width="16" height="10" rx="2"/><path d="M60 30 V36"/><path d="M92 42 L100 34" stroke-width="3.5"/>'
    + fina(passo(0, 330, 30).map((a) => { const [x1, y1] = pt(60, 82, 39, a), [x2, y2] = pt(60, 82, 45, a); return `M${x1} ${y1} L${x2} ${y2}`; }).join(' '), 1.8)
    + '<path d="M60 82 V48 M60 82 L80 96" stroke-width="2.4"/>' + ponto(60, 82, 3.5)],
  ['fis-paquimetro', 'Paquímetro', 250, 120, '<rect x="10" y="30" width="232" height="20"/><path d="M10 50 V96 L30 112 V50"/><path d="M10 30 V12 L22 20 V30" stroke-width="2"/>'
    + fina(passo(36, 236, 6).map((x, i) => `M${x} 30 V${i % 5 ? 35 : 39}`).join(' '), 1.1)
    + '<rect x="70" y="24" width="52" height="34" rx="2"/><path d="M70 58 V112 L90 96 V58"/><path d="M70 24 V12 L58 20 V24" stroke-width="2"/>' + fina(passo(74, 116, 4.2).map((x, i) => `M${r1(x)} 50 V${i % 5 ? 54 : 57}`).join(' '), 1.1)
    + '<circle cx="110" cy="16" r="5" stroke-width="1.8"/>'],
  ['fis-micrometro', 'Micrômetro', 236, 120, '<path d="M24 34 H44 V90 H128 V58 H148 V108 H24 Z"/><rect x="44" y="40" width="12" height="12" fill="#C"/>'
    + '<rect x="78" y="42" width="70" height="8"/><rect x="148" y="34" width="40" height="24"/>' + fina('M148 46 H188 ' + passo(152, 186, 5).map((x) => `M${x} 46 V${x % 10 === 2 ? 40 : 42}`).join(' '), 1.2)
    + '<path d="M188 28 H222 V64 H188 Z"/>' + fina(passo(34, 58, 6).map((y) => `M188 ${y} H196`).join(' '), 1.2) + '<rect x="222" y="38" width="10" height="16" rx="2"/>'],
  ['fis-balanca-pratos', 'Balança de dois pratos', 180, 140, '<path d="M60 130 H120 L106 118 H74 Z"/><path d="M90 118 V34"/><path d="M18 32 H162" stroke-width="3"/><path d="M84 28 L90 18 L96 28 Z" fill="#C"/>'
    + '<path d="M24 32 L12 84 M24 32 L36 84 M156 32 L144 84 M156 32 L168 84" stroke-width="1.6"/><path d="M4 84 Q24 100 44 84 Z M136 84 Q156 100 176 84 Z"/>'],
  ['fis-transferidor', 'Transferidor', 190, 110, '<path d="M10 100 A85 85 0 0 1 180 100 Z"/>' + fina(passo(0, 180, 10).map((a) => { const [x1, y1] = pt(95, 100, a % 30 ? 77 : 71, a), [x2, y2] = pt(95, 100, 85, a); return `M${x1} ${y1} L${x2} ${y2}`; }).join(' '), 1.3)
    + '<path d="M50 100 A45 45 0 0 1 140 100" stroke-width="1.3"/>' + fina('M95 92 V100', 1.6) + tx(95, 40, '90', 14) + tx(160, 90, '0', 14) + tx(30, 90, '180', 14)],
  ['fis-trilho-ar', 'Trilho de ar com sensores', 240, 100, '<rect x="10" y="60" width="220" height="10"/><path d="M30 70 L24 94 M210 70 L216 94"/>' + fina(passo(20, 220, 14).map((x) => `M${x} 65 h0.1`).join(' '), 2.4)
    + '<path d="M84 60 L96 42 H132 L144 60"/><rect x="108" y="26" width="12" height="16"/>' + seta(100, 14, 140, 14, 2, 9) + ti(152, 14, 'v', 15)
    + '<path d="M50 60 V18 H66 V60 M174 60 V18 H190 V60" stroke-width="2"/>' + fina('M50 32 H66 M174 32 H190', 1.2)],
];

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "fis-dcl-preencher",
        "Corpo livre — forças a identificar",
        360,
        270,
        "<rect x=\"145\" y=\"100\" width=\"70\" height=\"70\" rx=\"3\"/><path d=\"M215 135 L321 135\"/><path d=\"M314 131 L321 135 L314 139\"/><path d=\"M180 100 V36 M176 43 L180 36 L184 43 M180 170 V232 M176 225 L180 232 L184 225 M145 135 H39 M46 131 L39 135 L46 139\"/><text x=\"180\" y=\"20\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">F₁ = ____ N</text><text x=\"285\" y=\"112\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">F₂ = ___ N</text><text x=\"180\" y=\"252\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">F₃ = ____ N</text><text x=\"74\" y=\"112\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">F₄ = ___ N</text>"
      ],
      [
        "fis-balanco-unidades",
        "Balanço físico — dados e unidades",
        540,
        224,
        "<text x=\"270\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Balanço físico — dados e unidades</text><rect x=\"10\" y=\"42\" width=\"520\" height=\"178\" rx=\"3\"/><text x=\"75\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Grandeza</text><text x=\"205\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Símbolo</text><path d=\"M140 42 V220\"/><text x=\"335\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Valor</text><path d=\"M270 42 V220\"/><text x=\"465\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Unidade</text><path d=\"M400 42 V220\"/><path d=\"M10 68 H530\"/><path d=\"M10 106 H530\"/><path d=\"M10 144 H530\"/><path d=\"M10 182 H530\"/>"
      ]
    ]
  ]
];

export default {
  id: 'fisica', nome: 'Física',
  destaques: ['fis-eixos-xy', 'fis-vetor', 'fis-componentes', 'fis-bloco-forcas', 'fis-plano-forcas', 'fis-lancamento', 'fis-mola', 'fis-pendulo',
    'fis-atwood', 'fis-onda-transversal', 'fis-lente-convergente', 'fis-espelho-concavo', 'fis-refracao', 'fis-dipolo', 'fis-ima-linhas', 'fis-bohr'],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Cinemática', CINEMATICA],
    ['Dinâmica', DINAMICA],
    ['Energia e trabalho', ENERGIA],
    ['Gravitação e órbitas', GRAVITACAO],
    ['Hidrostática', HIDRO],
    ['Termologia e termodinâmica', TERMOLOGIA],
    ['Ondas e som', ONDAS],
    ['Óptica', OPTICA],
    ['Eletrostática e campo elétrico', ELETRO],
    ['Magnetismo e indução', MAGNETISMO],
    ['Física moderna', MODERNA],
    ['Instrumentos de medida', INSTRUMENTOS],
  ],
};
