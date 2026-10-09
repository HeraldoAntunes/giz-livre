// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Agronomia (prefixo 'agr-'): solos, plantas, irrigação, culturas do semiárido, fitossanidade, máquinas, zootecnia e manejo.
import { T, head } from './base.js';

// Desenhos próprios do Giz Livre, coordenadas feitas à mão; nada copiado de outras bibliotecas.
// Trator, plantação, aspersor, boi, coqueiro, bombas, válvulas e pluviômetro já existem em icones.js e hidraulica.js.
const f = n => +(+n).toFixed(1);
const tn = 'stroke-width="1.6"';
const fino = (d, w = 1.6) => `<path d="${d}" stroke-width="${w}"/>`;
const trac = (d, w = 1.6) => `<path d="${d}" stroke-width="${w}" stroke-dasharray="5 4"/>`;
const cheio = d => `<path d="${d}" fill="#C" stroke="none"/>`;
// seta reta de (x0,y0) a (x1,y1) com ponta cheia
const seta = (x0, y0, x1, y1, L = 10, w = 1.8) => {
  const a = Math.atan2(y1 - y0, x1 - x0);
  return `<path d="M${x0} ${y0} L${f(x1 - 0.8 * L * Math.cos(a))} ${f(y1 - 0.8 * L * Math.sin(a))}" stroke-width="${w}"/>` + head(x1, y1, f(a * 180 / Math.PI), L);
};
// linha ondulada (limite entre horizontes, superfície)
const onda = (x0, x1, y, a = 3, p = 20) => { let d = `M${x0} ${y}`; for (let x = x0; x < x1 - 0.1; x += p) d += ` q${p / 4} ${-a} ${p / 2} 0 t${p / 2} 0`; return d; };
// pontilhado (solo) em linhas desencontradas
const pontos = (x0, x1, y0, y1, s = 8, w = 2.4) => {
  let d = '';
  for (let y = y0, i = 0; y <= y1 + 0.01; y += s, i++) for (let x = x0 + (i % 2 ? s / 2 : 0); x <= x1 + 0.01; x += s) d += `M${f(x)} ${f(y)}h0.01`;
  return `<path d="${d}" stroke-width="${w}"/>`;
};
// pedras (cascalho) em fileiras
const pedras = (x0, x1, y0, y1, r = 4) => {
  let c = '';
  for (let y = y0 + r, i = 0; y <= y1 - r + 0.01; y += 2 * r + 3, i++) for (let x = x0 + r + 1 + (i % 2 ? r + 2 : 0); x <= x1 - r - 1; x += 2 * r + 6) c += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${r + 1.5}" ry="${r - 0.5}" ${tn}/>`;
  return c;
};
// folha com nervura central: base em (x,y), apontando para `ang` graus (rotação SVG: -90 = para cima)
const folha = (x, y, ang, L = 18, w = 7, cheia = false) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${ang})"><path d="M0 0 Q${f(L * 0.45)} ${-w} ${L} 0 Q${f(L * 0.45)} ${w} 0 0 Z" stroke-width="1.8"${cheia ? ' fill="#C"' : ''}/>${cheia ? '' : `<path d="M1 0 H${f(L * 0.85)}" stroke-width="1.1"/>`}</g>`;
// muda pequena: caule de (x,y) para cima, duas folhas
const muda = (x, y, h = 22) => `<path d="M${x} ${y} V${y - h}" stroke-width="2"/>` + folha(x, y - h * 0.5, -150, h * 0.6, h * 0.2) + folha(x, y - h * 0.8, -30, h * 0.6, h * 0.2);
// tufo de capim
const tufo = (x, y, s = 1) => fino(`M${x} ${y} c${f(-1 * s)} ${f(-4 * s)} ${f(-4 * s)} ${f(-8 * s)} ${f(-9 * s)} ${f(-9 * s)} M${x} ${y} c0 ${f(-5 * s)} ${f(1 * s)} ${f(-9 * s)} ${f(3 * s)} ${f(-12 * s)} M${x} ${y} c${f(1 * s)} ${f(-3 * s)} ${f(4 * s)} ${f(-6 * s)} ${f(9 * s)} ${f(-7 * s)}`);
// gota cheia (centro x,y; s = meia altura)
const gota = (x, y, s = 5, cheia = true) => `<path d="M${x} ${f(y - s)} C${f(x + s * 0.9)} ${f(y + s * 0.1)} ${f(x + s * 0.6)} ${f(y + s)} ${x} ${f(y + s)} C${f(x - s * 0.6)} ${f(y + s)} ${f(x - s * 0.9)} ${f(y + s * 0.1)} ${x} ${f(y - s)} Z"${cheia ? ' fill="#C" stroke="none"' : ' stroke-width="1.6"'}/>`;
// roda com cubo
const roda = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx}" cy="${cy}" r="${f(r * 0.32)}" ${tn}/>`;
// sol pequeno
const sol = (cx, cy, r = 9) => `<circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="2"/>` + fino([0, 45, 90, 135, 180, 225, 270, 315].map(a => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); return `M${f(cx + c * (r + 3))} ${f(cy + s * (r + 3))} L${f(cx + c * (r + 8))} ${f(cy + s * (r + 8))}`; }).join(''), 1.8);
// ponto num ângulo (graus, 0 = topo, sentido horário)
const pol = (cx, cy, r, g) => [f(cx + r * Math.sin(g * Math.PI / 180)), f(cy - r * Math.cos(g * Math.PI / 180))];
// planta de milho: base (x,y), altura h; pendão e espiga opcionais; seco = folhas caídas
const milho = (x, y, h, pendao = false, espiga = false, seco = false) => {
  let s = `<path d="M${x} ${y} V${y - h}" stroke-width="2.2"/>`, d = '';
  const n = Math.max(1, Math.floor(h / 14));
  for (let i = 0; i < n; i++) {
    const yy = y - 6 - i * (h - 8) / n, lado = i % 2 ? -1 : 1, L = Math.min(20, 8 + h / 6);
    d += seco ? `M${x} ${f(yy)} q${f(lado * L * 0.5)} ${f(-2)} ${f(lado * L * 0.8)} ${f(L * 0.7)}` : `M${x} ${f(yy)} q${f(lado * L * 0.5)} ${f(-L * 0.6)} ${f(lado * L)} ${f(-L * 0.1)}`;
  }
  s += fino(d, 1.8);
  if (pendao) s += fino(`M${x} ${y - h} l-6 -10 M${x} ${y - h} l0 -12 M${x} ${y - h} l6 -10`, 1.6);
  if (espiga) s += `<ellipse cx="${x + 5}" cy="${f(y - h * 0.5)}" rx="3.5" ry="8" transform="rotate(20 ${x + 5} ${f(y - h * 0.5)})" ${seco ? 'fill="#C" stroke="none"' : 'stroke-width="1.6"'}/>`;
  return s;
};
// pé de feijão pequeno (trifólio)
const feijaozinho = (x, y, h = 26) => `<path d="M${x} ${y} V${y - h}" stroke-width="1.8"/>` + folha(x, y - h, -90, 9, 4) + folha(x, y - h, -150, 9, 4) + folha(x, y - h, -30, 9, 4) + folha(x, y - h * 0.5, -160, 8, 3.5) + folha(x, y - h * 0.5, -20, 8, 3.5);
// caju pequeno (pedúnculo e castanha) para a copa do cajueiro
const caju = (x, y, s = 1) => `<path d="M${f(x - 7 * s)} ${y} C${f(x - 10 * s)} ${f(y + 10 * s)} ${f(x - 6 * s)} ${f(y + 20 * s)} ${x} ${f(y + 20 * s)} C${f(x + 6 * s)} ${f(y + 20 * s)} ${f(x + 10 * s)} ${f(y + 10 * s)} ${f(x + 7 * s)} ${y} Z" stroke-width="1.8"/>` + `<ellipse cx="${x}" cy="${f(y + 24 * s)}" rx="${f(4 * s)}" ry="${f(3 * s)}" fill="#C" stroke="none"/>` + fino(`M${x} ${y} V${f(y - 5 * s)}`);

// ---------- formas que precisam de cálculo ----------
// triângulo textural
const triTextural = (() => {
  const A = [20, 176], B = [200, 176], C = [110, 20], P = (a, b, c) => [f(a * A[0] + b * B[0] + c * C[0]), f(a * A[1] + b * B[1] + c * C[1])];
  let d = '';
  for (let k = 0.2; k < 0.99; k += 0.2) {
    const q = [P(1 - k, 0, k), P(0, 1 - k, k), P(k, 1 - k, 0), P(k, 0, 1 - k), P(1 - k, k, 0), P(0, k, 1 - k)];
    d += `M${q[0]} L${q[1]} M${q[2]} L${q[3]} M${q[4]} L${q[5]} `;
  }
  return `<path d="M${A} L${B} L${C} Z"/>` + fino(d.replace(/,/g, ' '), 1.1) + T(162, 22, 'Argila', 16) + T(36, 192, 'Areia', 16) + T(186, 192, 'Silte', 16) + T(110, 132, 'franca', 14);
})();
// composição do solo (pizza)
const pizza = (() => {
  const cx = 92, cy = 80, r = 64, p = g => pol(cx, cy, r, g).join(' ');
  return `<circle cx="${cx}" cy="${cy}" r="${r}"/>` + `<path d="M${cx} ${cy} L${p(0)} M${cx} ${cy} L${p(162)} M${cx} ${cy} L${p(180)} M${cx} ${cy} L${p(270)}"/>` +
    cheio(`M${cx} ${cy} L${p(162)} A${r} ${r} 0 0 1 ${p(180)} Z`) +
    T(cx + 32, cy - 10, 'Minerais', 15) + T(cx + 32, cy + 8, '45%', 15) + T(cx - 26, cy + 26, 'Água', 15) + T(cx - 26, cy + 43, '25%', 15) +
    T(cx - 26, cy - 34, 'Ar', 15) + T(cx - 26, cy - 17, '25%', 15) + T(cx + 40, cy + 78, 'matéria org. 5%', 14);
})();
// curvas de nível em planta, com plantas ao longo delas
const curvasNivel = (() => {
  let s = '';
  for (const y of [34, 64, 94, 124]) {
    const P0 = [6, y + 10], P1 = [70, y - 26], P2 = [130, y + 26], P3 = [194, y - 6];
    s += `<path d="M${P0} C${P1} ${P2} ${P3}" stroke-width="1.6"/>`.replace(/,/g, ' ');
    for (let t = 0.07; t < 0.95; t += 0.086) {
      const u = 1 - t, x = u ** 3 * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t ** 3 * P3[0], yy = u ** 3 * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t ** 3 * P3[1];
      s += `<circle cx="${f(x)}" cy="${f(yy - 6)}" r="2.6" fill="#C" stroke="none"/>`;
    }
  }
  return `<rect x="4" y="4" width="192" height="142" rx="3"/>` + s;
})();
// pivô central em planta
const pivoPlanta = (() => {
  let s = '<circle cx="80" cy="80" r="72"/>';
  for (const r of [18, 36, 54]) s += `<circle cx="80" cy="80" r="${r}" stroke-width="1.1" stroke-dasharray="3 4"/>`;
  s += '<path d="M80 80 L131 29" stroke-width="3.2"/>';
  for (const k of [0.33, 0.6, 0.86]) s += `<rect x="${f(80 + 51 * k - 3.5)}" y="${f(80 - 51 * k - 3.5)}" width="7" height="7" fill="#C" stroke="none"/>`;
  s += '<rect x="75" y="75" width="10" height="10" fill="#C" stroke="none"/>';
  s += `<path d="M${pol(80, 80, 62, 60).join(' ')} A62 62 0 0 1 ${pol(80, 80, 62, 100).join(' ')}" stroke-width="1.8"/>` + head(...pol(80, 80, 62, 104), 195, 10);
  return s;
})();
// pivô central em perfil
const pivoPerfil = (() => {
  let s = '<path d="M18 30 H254"/>' + '<path d="M18 30 V96 M6 96 H30 M10 96 L18 64 L26 96"/>';
  s += fino('M18 30 Q59 62 100 30 Q141 62 182 30 M182 30 Q218 48 254 30');
  let d = '';
  for (const [a, b] of [[18, 100], [100, 182]]) for (let x = a + 10; x < b - 5; x += 20) d += `M${x} 30 L${x + 10} ${f(30 + 32 * Math.sin(Math.PI * (x + 10 - a) / (b - a)))} `;
  s += fino(d, 1.2);
  for (const x of [100, 182]) s += `<path d="M${x} 30 L${x - 12} 88 M${x} 30 L${x + 12} 88 M${x - 14} 88 H${x + 14}"/>` + roda(x - 12, 96, 7) + roda(x + 12, 96, 7);
  let g = '';
  for (const x of [40, 60, 80, 120, 140, 160, 204, 228]) g += `M${x} 30 V66 M${x - 6} 74 L${x} 66 L${x + 6} 74`;
  s += fino(g, 1.4) + trac('M40 76 V86 M60 76 V86 M80 76 V86 M120 76 V86 M140 76 V86 M160 76 V86 M204 76 V86 M228 76 V86', 1.2);
  return s + fino('M4 104 H256', 1.8);
})();
// sulcos
const sulcos = (() => {
  let d = 'M4 66';
  for (const c of [30, 90, 150]) d += ` L${c - 22} 66 L${c - 8} 40 H${c + 8} L${c + 22} 66`;
  d += ' H196';
  let s = `<path d="${d} V104 H4 Z"/>`;
  for (const c of [30, 90, 150]) s += muda(c, 40, 26);
  for (const c of [60, 120, 180]) s += fino(`M${c - 12} 58 H${c + 12}`, 2.2) + trac(`M${c - 14} 66 A16 18 0 0 0 ${c + 14} 66`, 1.3);
  return s + pontos(12, 190, 80, 98, 12, 2);
})();
// estágios fenológicos do milho
const fenologia = (() => {
  const xs = [26, 68, 112, 158, 202, 240], hs = [10, 30, 56, 82, 86, 86], rot = ['VE', 'V4', 'V8', 'VT', 'R1', 'R6'];
  let s = fino('M4 118 H256', 2);
  xs.forEach((x, i) => { s += milho(x, 118, hs[i], i >= 3, i >= 4, i === 5) + T(x, 136, rot[i], 15); });
  return s;
})();
// curva de retenção
const retencao = (() => {
  let s = '<path d="M30 10 V124 H228"/>' + head(30, 6, -90, 10) + head(234, 124, 0, 10);
  s += '<path d="M34 22 C60 26 70 40 84 58 C104 84 140 104 206 112" stroke-width="2.8"/>';
  s += trac('M30 58 H84 V124 M30 104 H160 V124') + T(84, 138, 'CC', 14) + T(160, 138, 'PMP', 14) + T(16, 18, 'θ', 18) + T(212, 142, 'tensão', 14);
  s += fino('M44 60 V102') + head(44, 60, -90, 7) + head(44, 102, 90, 7) + T(60, 81, 'AD', 14);
  return s;
})();
// manejo integrado (gráfico)
const mip = (() => {
  let s = '<path d="M26 10 V124 H212"/>' + head(26, 6, -90, 10) + head(216, 124, 0, 10);
  s += trac('M26 40 H210') + trac('M26 62 H210', 1.4) + T(200, 30, 'NDE', 14) + T(200, 74, 'NC', 14);
  s += '<path d="M30 112 C70 108 90 90 112 62 C118 54 122 52 126 58 C136 76 150 100 206 104" stroke-width="2.6"/>';
  s += seta(118, 24, 118, 50, 9) + T(126, 16, 'controle', 14) + T(120, 140, 'tempo', 14) + T(14, 66, 'P', 15);
  return s;
})();
// ciclo do nitrogênio
const cicloN = (() => {
  let s = fino('M4 104 H266', 2) + T(152, 16, 'N₂ do ar', 17);
  s += `<path d="M40 104 V54" stroke-width="2"/>` + folha(40, 62, -150, 18, 6) + folha(40, 70, -30, 18, 6) + folha(40, 54, -90, 14, 5);
  s += fino('M40 104 V150 M40 116 L22 132 M40 122 L58 140 M40 134 L28 154') + `<circle cx="24" cy="130" r="3.2" fill="#C" stroke="none"/><circle cx="54" cy="136" r="3.2" fill="#C" stroke="none"/><circle cx="31" cy="150" r="3.2" fill="#C" stroke="none"/>`;
  s += seta(124, 22, 56, 50) + T(74, 22, 'fixação', 14);
  s += T(108, 142, 'NO₃⁻', 17) + T(206, 142, 'NH₄⁺', 17) + seta(184, 142, 132, 142) + T(158, 122, 'nitrificação', 14);
  s += seta(88, 140, 60, 132) + T(76, 160, 'absorção', 14);
  s += seta(108, 156, 108, 190) + T(156, 180, 'lixiviação', 14);
  s += `<path d="M100 128 Q104 64 156 32" stroke-width="1.8"/>` + head(160, 30, -35, 10) + T(216, 44, 'desnitrificação', 14);
  s += seta(232, 90, 214, 126) + T(240, 78, 'adubo', 14) + T(236, 166, 'MO', 15) + seta(230, 160, 214, 154);
  return s;
})();

const agr = {
  solos: [
    ['agr-perfil-solo', 'Perfil do solo (horizontes O, A, B, C, R)', 170, 222,
      '<rect x="40" y="20" width="120" height="196"/>' +
      fino(onda(40, 160, 36, 2.5) + onda(40, 160, 80) + onda(40, 160, 136) + onda(40, 160, 182)) +
      tufo(52, 20) + tufo(80, 20) + tufo(108, 20) + tufo(140, 20) +
      fino('M48 28 l8 3 M66 27 l9 -2 M88 29 l8 2 M112 27 l9 2 M134 29 l9 -2 M150 27 l7 3', 1.4) +
      pontos(48, 156, 44, 72, 8) + pontos(50, 154, 90, 128, 13, 2.2) + pedras(42, 162, 142, 178, 4) +
      fino('M40 198 H160 M70 184 V198 M112 184 V198 M146 184 V198 M56 198 V216 M94 198 V216 M132 198 V216') +
      fino('M66 20 q-2 18 4 34 q4 12 -2 24 M124 20 q3 16 -3 30', 1.3) +
      T(20, 28, 'O', 18) + T(20, 58, 'A', 18) + T(20, 108, 'B', 18) + T(20, 159, 'C', 18) + T(20, 200, 'R', 18)],
    ['agr-triangulo-textural', 'Triângulo textural', 220, 202, triTextural],
    ['agr-composicao-solo', 'Exemplo de composição do solo (volume)', 190, 173, "<g transform=\"translate(0.00 0.00)\">" + (pizza) + "</g>"],
    ['agr-est-granular', 'Estrutura granular', 100, 100,
      '<rect x="4" y="4" width="92" height="92" rx="3" stroke-width="1.4" stroke-dasharray="4 4"/>' +
      [[22, 24, 9], [44, 20, 8], [68, 26, 10], [26, 48, 8], [50, 44, 10], [76, 52, 8], [20, 72, 9], [46, 72, 8], [70, 76, 10]].map(([x, y, r]) => `<path d="M${x - r} ${y} q1 ${-r} ${r} ${-r} q${r} 1 ${r} ${r} q-2 ${r} ${-r} ${r} q${-r} -1 ${-r} ${-r} Z" stroke-width="2"/>`).join('')],
    ['agr-est-blocos', 'Estrutura em blocos', 100, 100,
      '<path d="M6 8 L94 6 L95 94 L5 93 Z"/>' + fino('M6 36 L95 33 M5 64 L95 62 M34 7 L35 36 M64 6 L62 34 M24 36 L26 64 M52 35 L54 63 M80 34 L78 62 M38 64 L36 93 M70 62 L72 94', 2)],
    ['agr-est-prismatica', 'Estrutura prismática', 100, 110,
      '<path d="M6 6 H94 V104 H6 Z"/>' + fino('M28 6 L27 104 M50 6 L52 104 M73 6 L72 104 M6 6 H94 M6 40 H8 M27 52 H52 M52 30 H72 M72 70 H94 M6 80 H27', 2)],
    ['agr-est-laminar', 'Estrutura laminar', 110, 90,
      '<rect x="4" y="6" width="102" height="78" rx="2"/>' + fino('M4 18 H60 M66 16 H106 M4 30 H40 M46 30 H106 M4 42 H76 M82 43 H106 M4 54 H30 M36 54 H106 M4 66 H64 M70 67 H106 M4 76 H50 M56 76 H106', 2)],
    ['agr-erosao', 'Erosão hídrica na encosta', 210, 130,
      (() => { const y = x => f(36 + 76 * (x - 6) / 198); let d = 'M6 36'; for (const x of [70, 116, 162]) d += ` L${x - 6} ${y(x - 6)} L${x} ${f(+y(x) + 9)} L${x + 6} ${y(x + 6)}`; return `<path d="${d} L204 112 V124 H6 Z"/>`; })() +
      fino('M22 4 l-6 14 M38 4 l-6 14 M54 4 l-6 14 M30 18 l-5 12 M46 18 l-5 12 M70 6 l-6 14', 1.5) +
      seta(40, 38, 150, 80, 10) + T(122, 50, 'enxurrada', 14) + pontos(180, 200, 108, 120, 6, 2.6) + pontos(24, 180, 90, 116, 14, 2)],
    ['agr-vocoroca', 'Voçoroca (corte)', 170, 110,
      '<path d="M4 22 H50 L58 34 L54 46 L64 62 L76 92 H94 L104 68 L110 52 L106 36 L116 22 H166 V106 H4 Z"/>' +
      tufo(16, 22) + tufo(34, 22) + tufo(132, 22) + tufo(152, 22) + pontos(10, 44, 34, 98, 10, 2) + pontos(124, 160, 34, 98, 10, 2) + pontos(62, 112, 100, 102, 9, 2)],
    ['agr-curvas-nivel', 'Plantio em curvas de nível (planta)', 200, 150, curvasNivel],
    ['agr-terracos', 'Terraços em patamar (perfil)', 222, 124,
      '<path d="M4 22 H50 L58 46 H110 L118 70 H170 L178 94 H218 V120 H4 Z"/>' +
      '<path d="M44 22 q4 -7 8 0 M104 46 q4 -7 8 0 M164 70 q4 -7 8 0" stroke-width="2"/>' +
      trac('M4 22 L218 98', 1.2) + muda(22, 22, 18) + muda(76, 46, 18) + muda(134, 70, 18) + muda(196, 94, 18)],
    ['agr-compactacao', 'Compactação do solo (pé de grade)', 150, 160,
      '<path d="M4 50 H146 V156 H4 Z"/>' + fino('M4 92 H146 M4 108 H146') +
      fino('M10 108 L26 92 M26 108 L42 92 M42 108 L58 92 M58 108 L74 92 M74 108 L90 92 M90 108 L106 92 M106 108 L122 92 M122 108 L138 92 M138 108 L146 100', 1.4) +
      `<path d="M75 50 V8" stroke-width="2.2"/>` + folha(75, 26, -150, 26, 8) + folha(75, 16, -30, 26, 8) +
      fino('M75 50 V88 q0 4 10 4 H112 M75 70 L58 84 M75 88 q0 3 -12 3 H40 M75 60 L94 76', 1.8) + pontos(14, 140, 60, 84, 16, 2) + pontos(14, 140, 118, 150, 16, 2)],
    ['agr-amostragem', 'Amostragem de solo em zigue-zague', 190, 130,
      '<path d="M6 10 H184 L178 124 H10 Z"/>' + trac('M20 24 L50 110 L80 24 L110 110 L140 24 L170 110', 1.4) +
      [[20, 24], [35, 67], [50, 110], [65, 67], [80, 24], [95, 67], [110, 110], [125, 67], [140, 24], [155, 67], [170, 110]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#C" stroke="none"/>`).join('')],
    ['agr-trado', 'Trado de amostragem', 60, 170,
      '<path d="M8 12 H52" stroke-width="5"/><path d="M30 12 V112"/>' +
      '<path d="M22 112 H38 V150 L30 164 L22 150 Z"/>' + fino('M22 120 L38 128 M22 132 L38 140 M22 144 L38 152', 1.6)],
    ['agr-infiltrometro', 'Infiltrômetro de duplo anel', 150, 110,
      fino('M4 70 H146', 2) +
      '<ellipse cx="75" cy="30" rx="64" ry="12"/><path d="M11 30 V80 M139 30 V80"/><path d="M11 80 A64 12 0 0 0 139 80" stroke-width="1.6" stroke-dasharray="5 4"/>' +
      '<ellipse cx="75" cy="30" rx="30" ry="6"/><path d="M45 30 V80 M105 30 V80"/>' +
      trac('M17 44 Q75 60 133 44', 1.3) + trac('M47 40 Q75 47 103 40', 1.3) + pontos(14, 136, 86, 104, 12, 2)],
    ['agr-anel-volumetrico', 'Anel volumétrico (densidade)', 100, 90,
      '<ellipse cx="50" cy="20" rx="38" ry="11"/><path d="M12 20 V66 A38 11 0 0 0 88 66 V20"/>' + pontos(22, 78, 36, 70, 9, 2.4)],
  ],

  plantas: [
    ['agr-planta-partes', 'Partes da planta', 200, 232,
      fino('M4 150 H140', 2) +
      '<path d="M76 150 V40" stroke-width="3"/>' +
      [0, 72, 144, 216, 288].map(g => `<ellipse cx="${pol(76, 30, 9, g)[0]}" cy="${pol(76, 30, 9, g)[1]}" rx="6" ry="6"/>`).join('') + '<circle cx="76" cy="30" r="4" fill="#C" stroke="none"/>' +
      folha(76, 112, -160, 40, 12) + folha(76, 90, -20, 40, 12) +
      '<path d="M76 70 L98 62"/><circle cx="104" cy="66" r="8" fill="#C" stroke="none"/>' +
      fino('M76 150 V214 M76 164 L56 178 M76 172 L98 190 M76 188 L62 204 M76 196 L90 214 M56 178 L48 192 M98 190 L108 200', 1.8) +
      fino('M128 30 H90 M128 64 H114 M128 92 L110 80 M128 128 H80 M128 194 H90', 1.2) +
      T(158, 30, 'flor', 15) + T(160, 64, 'fruto', 15) + T(160, 94, 'folha', 15) + T(160, 128, 'caule', 15) + T(158, 194, 'raiz', 15)],
    ['agr-raiz-pivotante', 'Raiz pivotante', 100, 160,
      trac('M4 40 H96', 1.6) + `<path d="M50 40 V12" stroke-width="2"/>` + folha(50, 22, -150, 22, 7) + folha(50, 14, -30, 22, 7) +
      '<path d="M44 40 Q46 100 50 152 Q54 100 56 40" stroke-width="2.2"/>' +
      fino('M46 60 L26 72 L18 70 M54 66 L74 78 L82 76 M47 88 L30 100 M53 98 L70 110 M49 118 L38 128 M51 128 L62 136', 1.4)],
    ['agr-raiz-fasciculada', 'Raiz fasciculada', 110, 150,
      trac('M4 40 H106', 1.6) + fino('M55 40 q-14 -16 -22 -34 M55 40 q-2 -18 0 -36 M55 40 q12 -16 24 -32 M55 40 q-8 -12 -24 -18 M55 40 q8 -10 26 -14', 2) +
      fino('M55 40 q-30 30 -40 90 M55 40 q-18 40 -22 100 M55 40 q-4 50 -4 104 M55 40 q8 50 10 100 M55 40 q20 40 26 92 M55 40 q32 26 44 80 M55 40 q-38 14 -48 50 M55 40 q40 10 50 44', 1.6)],
    ['agr-raiz-tuberosa', 'Raiz tuberosa (mandioca)', 140, 150,
      trac('M4 46 H136', 1.6) + '<path d="M66 46 V10 M74 46 V14" stroke-width="2.4"/>' + fino('M66 16 l-14 -6 M74 20 l14 -8', 1.8) +
      '<path d="M66 52 Q30 70 16 124 Q34 92 72 56 Z"/><path d="M70 54 Q66 100 60 144 Q80 100 76 54 Z"/><path d="M76 52 Q110 70 124 120 Q104 86 72 56 Z"/>' +
      fino('M70 48 V54', 2)],
    ['agr-semente', 'Semente (partes)', 200, 110,
      '<path d="M18 34 C28 6 82 6 92 34 C100 58 92 96 60 98 C40 100 46 78 30 80 C10 82 6 54 18 34 Z"/>' +
      '<path d="M24 36 C33 14 78 14 86 36 C93 56 86 89 60 91 C44 92 46 74 32 74 C16 74 13 52 24 36 Z" stroke-width="1.3" stroke-dasharray="4 3"/>' +
      cheio('M34 68 q6 -14 20 -12 q-4 10 -20 12 Z') + fino('M54 22 Q50 46 56 66', 1.4) +
      fino('M108 22 H88 M108 54 H74 M108 86 H48', 1.2) + T(150, 22, 'tegumento', 15) + T(152, 54, 'cotilédone', 15) + T(144, 86, 'embrião', 15)],
    ['agr-germinacao', 'Germinação (epígea)', 250, 140,
      fino('M4 72 H246', 2) + pontos(10, 240, 82, 128, 18, 2) +
      '<ellipse cx="30" cy="94" rx="10" ry="6.5"/>' +
      '<ellipse cx="86" cy="90" rx="10" ry="6.5"/>' + fino('M86 96 q3 12 -2 24', 1.8) +
      fino('M146 120 q2 -8 0 -22 V64 q0 -14 -12 -10', 2) + '<ellipse cx="130" cy="64" rx="6" ry="9" transform="rotate(20 130 64)"/>' + fino('M146 98 l-8 10 M146 106 l8 10', 1.4) +
      fino('M210 120 V30', 2.2) + '<ellipse cx="198" cy="58" rx="12" ry="5"/><ellipse cx="222" cy="58" rx="12" ry="5"/>' + folha(210, 32, -140, 18, 7) + folha(210, 32, -40, 18, 7) + fino('M210 96 l-10 14 M210 104 l10 14 M210 88 l-8 8', 1.4) +
      seta(46, 40, 66, 40, 8) + seta(104, 40, 122, 40, 8) + seta(164, 40, 184, 40, 8)],
    ['agr-fenologia', 'Estágios fenológicos (milho)', 260, 146, fenologia],
    ['agr-folha-dicot', 'Folha de dicotiledônea (nervuras em rede)', 100, 140,
      '<path d="M50 6 C86 26 88 76 50 112 C12 76 14 26 50 6 Z"/><path d="M50 112 V136" stroke-width="2.4"/>' +
      fino('M50 10 V112 M50 34 L32 26 M50 34 L68 26 M50 54 L26 44 M50 54 L74 44 M50 74 L28 64 M50 74 L72 64 M50 94 L36 84 M50 94 L64 84', 1.4)],
    ['agr-folha-monocot', 'Folha de monocotiledônea (nervuras paralelas)', 70, 160,
      '<path d="M35 4 C48 30 50 90 46 128 H24 C20 90 22 30 35 4 Z"/><path d="M24 128 L22 156 M46 128 L48 156"/>' +
      fino('M35 10 V126 M29 30 Q28 80 30 126 M41 30 Q42 80 40 126', 1.2)],
    ['agr-enxertia-fenda', 'Enxertia por garfagem (fenda cheia)', 100, 172,
      '<path d="M34 92 V166 H66 V92 Z"/>' + fino('M50 92 V124', 1.4) +
      '<path d="M40 20 H60 V92 L50 118 L40 92 Z"/>' + fino('M36 20 L64 20', 2) +
      '<path d="M60 40 q8 -4 10 -12 M40 62 q-8 -4 -10 -12" stroke-width="2"/>' +
      fino('M32 86 L68 94 M32 94 L68 102 M32 102 L68 110 M32 110 L68 118', 1.6)],
    ['agr-enxertia-borbulha', 'Enxertia por borbulhia (em T)', 80, 160,
      '<path d="M28 4 V156 M52 4 V156"/>' + '<path d="M34 64 Q40 56 46 64 V96 Q40 104 34 96 Z" stroke-width="2"/>' + cheio('M37 74 Q40 66 43 74 Q40 80 37 74 Z') +
      fino('M30 56 H50 M40 56 V64', 1.6) + fino('M24 44 L56 52 M24 52 L56 60 M24 102 L56 110 M24 110 L56 118', 1.6)],
    ['agr-poda', 'Poda (corte do ramo)', 150, 150,
      fino('M4 146 H146', 2) + '<path d="M64 146 V82 L30 36 M64 96 L104 50 M64 82 L70 30 M86 72 L120 74"/>' +
      folha(30, 36, -120, 18, 6) + folha(30, 36, -170, 16, 6) + folha(70, 30, -80, 18, 6) + folha(104, 50, -50, 18, 6) + folha(120, 74, -10, 16, 6) +
      '<path d="M88 46 L112 72" stroke-width="2" stroke-dasharray="5 4"/>' + T(124, 100, 'corte', 15)],
    ['agr-tesoura-poda', 'Tesoura de poda', 130, 90,
      '<path d="M50 38 Q26 14 6 26 Q24 32 48 50 Z" stroke-width="2.2"/><path d="M48 50 Q30 58 12 48 Q28 46 46 42" stroke-width="2.2"/>' +
      '<path d="M56 36 Q90 12 124 20 L126 30 Q92 28 60 46 Z M58 50 Q92 66 126 58 L124 68 Q90 78 54 56 Z"/><circle cx="52" cy="45" r="4" fill="#C" stroke="none"/>' + fino('M78 34 l4 6 l-4 5 l4 6', 1.6)],
    ['agr-fotossintese', 'Fotossíntese (folha)', 210, 150,
      '<path d="M50 96 C70 40 140 30 170 70 C140 116 80 124 50 96 Z"/>' + fino('M50 96 L168 70 M84 89 L96 66 M116 82 L128 58 M84 89 L104 102 M116 82 L134 96', 1.3) + '<path d="M50 96 L26 120" stroke-width="2.4"/>' +
      sol(24, 24, 10) + seta(40, 38, 70, 58) +
      T(30, 72, 'CO₂', 15) + seta(32, 82, 56, 82) + T(182, 32, 'O₂', 15) + seta(160, 58, 180, 42) + T(68, 138, 'H₂O', 15) + seta(32, 128, 46, 114) + T(140, 128, 'glicose', 14)],
  ],

  irrigacao: [
    ['agr-gotejamento', 'Irrigação por gotejamento', 240, 120,
      fino('M4 80 H236', 1.8) + '<rect x="6" y="70" width="228" height="8" rx="4"/>' +
      [30, 75, 120, 165, 210].map(x => `<rect x="${x + 6}" y="66" width="10" height="6" fill="#C" stroke="none"/>` + gota(x + 11, 86, 3.5) + trac(`M${x - 8} 80 A19 26 0 0 0 ${x + 30} 80`, 1.3) + muda(x, 68, 32)).join('')],
    ['agr-gotejador', 'Gotejador (emissor na linha)', 150, 100,
      '<path d="M4 30 H146 M4 50 H146"/>' + '<path d="M56 30 V22 H94 V30" stroke-width="2"/><rect x="66" y="14" width="18" height="8" rx="2"/>' +
      seta(20, 40, 46, 40, 8, 1.6) + seta(104, 40, 130, 40, 8, 1.6) + fino('M75 50 V60', 2) + gota(75, 74, 7) + gota(75, 92, 4)],
    ['agr-microaspersao', 'Microaspersão (pomar)', 190, 140,
      fino('M4 120 H186', 2) + '<path d="M50 120 V74 M58 120 V74"/>' + '<path d="M22 72 C6 62 10 36 28 36 C32 18 60 14 70 26 C86 18 102 32 96 50 C108 58 98 80 82 76 C70 86 36 86 22 72 Z"/>' +
      '<path d="M128 120 V100" stroke-width="2"/><rect x="124" y="94" width="8" height="6" fill="#C" stroke="none"/>' +
      trac('M128 94 Q108 70 92 116 M128 94 Q148 70 166 116 M128 94 Q120 76 106 112 M128 94 Q136 76 150 112', 1.4)],
    ['agr-aspersao-conv', 'Aspersão convencional (planta)', 230, 140,
      '<path d="M12 10 V130" stroke-width="3.2"/><path d="M12 70 H206"/>' +
      [48, 112, 176].map(x => `<circle cx="${x}" cy="70" r="40" stroke-width="1.4" stroke-dasharray="5 4"/><circle cx="${x}" cy="70" r="5" fill="#C" stroke="none"/>`).join('')],
    ['agr-pivo-planta', 'Pivô central (planta)', 160, 160, pivoPlanta],
    ['agr-pivo-perfil', 'Pivô central (perfil)', 260, 110, pivoPerfil],
    ['agr-sulcos', 'Irrigação por sulcos (corte)', 200, 108, sulcos],
    ['agr-inundacao', 'Irrigação por inundação (tabuleiros)', 210, 110,
      '<path d="M4 46 H18 L30 76 H90 L102 46 H112 L124 76 H184 L196 46 H206 V104 H4 Z"/>' +
      fino('M28 62 H92 M122 62 H186', 2.2) + fino(onda(36, 84, 68, 1.5, 12) + onda(130, 178, 68, 1.5, 12), 1.2) +
      [44, 60, 76, 138, 154, 170].map(x => tufo(x, 62, 1.6)).join('')],
    ['agr-bulbo-molhado', 'Bulbo molhado (gotejamento)', 172, 168, "<g transform=\"translate(1.00 7.03)\">" + (fino('M4 42 H166', 2) + '<rect x="82" y="34" width="14" height="7" fill="#C" stroke="none"/>' +
      '<path d="M66 42 C30 64 30 130 88 142 C146 130 146 64 110 42" stroke-dasharray="6 4" stroke-width="2"/>' +
      '<path d="M76 42 C54 60 56 106 88 114 C120 106 122 60 100 42" stroke-dasharray="4 4" stroke-width="1.4"/>' +
      `<path d="M60 42 V8" stroke-width="2"/>` + folha(60, 22, -150, 22, 7) + folha(60, 12, -30, 22, 7) + fino('M60 42 V82 M60 56 L46 70 M60 64 L76 80', 1.4) +
      seta(88, 60, 88, 92, 8, 1.4) + seta(96, 64, 120, 80, 8, 1.4)) + "</g>"],
    ['agr-tensiometro', 'Tensiômetro', 90, 192,
      fino('M4 70 H86', 2) + fino('M10 70 l-6 8 M24 70 l-6 8 M62 70 l-6 8 M78 70 l-6 8', 1.2) +
      '<rect x="32" y="8" width="16" height="10" rx="2" fill="#C" stroke="none"/><path d="M34 18 V154 M46 18 V154"/>' +
      '<path d="M34 154 V162 Q34 180 40 180 Q46 180 46 162 V154" stroke-width="2.6"/>' + pontos(37, 44, 160, 172, 4, 2) + trac('M34 30 H46', 1.2) +
      '<path d="M46 40 H54"/><circle cx="68" cy="40" r="14"/>' + fino('M68 40 L60 32', 2) + '<circle cx="68" cy="40" r="2" fill="#C" stroke="none"/>'],
    ['agr-curva-retencao', 'Curva de retenção de água no solo', 240, 157, "<g transform=\"translate(0.00 0.00)\">" + (retencao) + "</g>"],
    ['agr-balanco-hidrico', 'Balanço hídrico do solo', 240, 190,
      fino('M4 80 H236', 2) + '<rect x="50" y="80" width="140" height="54" stroke-width="1.8" stroke-dasharray="6 4"/>' +
      fino('M58 10 l-5 12 M70 6 l-5 12 M82 10 l-5 12', 1.4) + seta(70, 28, 70, 76) + T(56, 46, 'P', 18) +
      seta(104, 30, 104, 76) + T(92, 44, 'I', 18) +
      `<path d="M140 80 V40" stroke-width="2"/>` + folha(140, 58, -150, 22, 7) + folha(140, 46, -30, 22, 7) +
      '<path d="M172 70 q6 -8 0 -16 q-6 -8 0 -16 q6 -8 0 -16" stroke-width="1.8"/>' + head(172, 14, -90, 10) + T(196, 30, 'ET', 18) +
      seta(194, 74, 230, 74) + T(214, 60, 'R', 18) + seta(120, 134, 120, 160) + T(134, 150, 'D', 18) + T(84, 108, 'ΔA', 18) +
      T(120, 180, 'P + I = ET + R + D + ΔA', 14)],
    ['agr-tanque-classe-a', 'Tanque Classe A (evaporação)', 180, 112,
      '<ellipse cx="90" cy="40" rx="70" ry="12"/><path d="M20 40 V68 A70 12 0 0 0 160 68 V40"/>' + trac('M28 52 Q90 66 152 52', 1.3) +
      '<path d="M116 34 V58 M128 34 V58" stroke-width="1.6"/>' + '<path d="M24 82 H156 M24 92 H156 M36 82 V92 M60 80 V92 M90 80 V92 M120 80 V92 M144 82 V92" stroke-width="1.8"/>' +
      '<path d="M60 26 q5 -6 0 -12 q-5 -6 0 -12 M90 24 q5 -6 0 -12 q-5 -6 0 -12" stroke-width="1.6"/>' + head(60, 2, -90, 7) + head(90, 0, -90, 7)],
    ['agr-filtro-discos', 'Filtro de discos (cabeçal)', 120, 130,
      '<path d="M4 65 H36 M84 65 H116"/><rect x="36" y="20" width="48" height="96" rx="6"/><rect x="42" y="8" width="36" height="12" rx="2"/>' +
      fino('M44 34 H76 M44 40 H76 M44 46 H76 M44 52 H76 M44 58 H76 M44 64 H76 M44 70 H76 M44 76 H76 M44 82 H76 M44 88 H76 M44 94 H76 M44 100 H76', 1.2) + head(30, 65, 0, 9) + head(114, 65, 0, 9)],
  ],

  culturas: [
    ['agr-bananeira', 'Bananeira (com cacho)', 150, 184,
      fino('M4 178 H146', 2) + '<path d="M62 178 L66 82 M80 178 L76 82"/>' + fino('M64 140 l14 -4 M65 112 l12 -4', 1.2) +
      folha(70, 82, -168, 62, 15) + folha(70, 80, -132, 58, 13) + folha(72, 80, -52, 58, 13) + folha(72, 82, -14, 62, 15) +
      '<path d="M76 88 Q112 84 112 112 V146" stroke-width="2"/>' +
      [104, 116, 128, 140].map(y => fino(`M112 ${y} q-10 2 -14 -8 M112 ${y} q10 2 14 -8 M112 ${y} q-3 -2 -4 -10`, 2.4)).join('') +
      cheio('M112 146 C120 152 118 168 112 172 C106 168 104 152 112 146 Z') +
      fino('M36 178 V158', 2) + folha(36, 160, -130, 18, 5) + folha(36, 162, -50, 16, 5)],
    ['agr-cajueiro', 'Cajueiro', 170, 140,
      fino('M4 134 H166', 2) + '<path d="M70 134 Q74 110 64 96 M84 134 Q82 112 96 96"/>' +
      '<path d="M18 92 C4 80 14 58 30 60 C30 40 52 30 66 40 C76 22 104 24 112 40 C128 30 150 44 146 62 C164 66 162 92 146 96 C132 104 112 98 100 96 C86 104 60 104 46 98 C34 104 22 100 18 92 Z"/>' +
      caju(40, 76, 0.7) + caju(84, 66, 0.7) + caju(126, 74, 0.7)],
    ['agr-caju', 'Caju (pedúnculo e castanha)', 100, 140,
      fino('M50 4 V16', 2) + folha(50, 10, -20, 22, 7) +
      '<path d="M36 16 C26 18 22 34 26 54 C30 74 38 86 50 86 C62 86 70 74 74 54 C78 34 74 18 64 16 C58 15 42 15 36 16 Z"/>' +
      fino('M38 34 Q36 54 42 70', 1.2) +
      '<path d="M40 88 C28 92 28 120 46 124 C60 126 72 116 66 102 C62 94 54 100 54 90 Z" fill="#C"/>'],
    ['agr-mangueira', 'Mangueira', 170, 170,
      fino('M4 164 H166', 2) + '<path d="M76 164 V112 M94 164 V112 M76 120 L58 100 M94 118 L110 100"/>' +
      '<path d="M20 104 C4 92 8 60 26 54 C24 30 50 12 72 20 C84 6 112 8 120 24 C142 20 162 44 152 64 C166 78 156 104 138 106 C120 116 50 116 20 104 Z"/>' +
      [[46, 102], [84, 108], [124, 104]].map(([x, y]) => fino(`M${x} ${y} V${y + 10}`, 1.4) + `<ellipse cx="${x + 2}" cy="${y + 20}" rx="7" ry="10" transform="rotate(-15 ${x + 2} ${y + 20})" fill="#C" stroke="none"/>`).join('')],
    ['agr-manga', 'Manga', 100, 120,
      fino('M50 4 Q52 12 50 20', 2.2) + folha(50, 10, -10, 30, 8) +
      '<path d="M50 20 C76 18 88 46 84 74 C80 104 58 116 40 112 C20 108 14 88 22 70 C30 52 26 22 50 20 Z"/>' + fino('M64 36 Q74 50 72 70', 1.3)],
    ['agr-milho', 'Milho (planta com espiga)', 100, 200,
      fino('M4 194 H96', 2) + '<path d="M50 194 V30" stroke-width="3"/>' +
      fino('M50 170 q-20 -16 -40 -6 M50 150 q20 -16 40 -6 M50 126 q-22 -18 -40 -10 M50 100 q22 -18 40 -10 M50 76 q-20 -16 -36 -8 M50 54 q18 -14 32 -6', 2) +
      fino('M50 30 l-10 -20 M50 30 l0 -24 M50 30 l10 -20 M50 22 l-16 -8 M50 22 l16 -8', 1.6) +
      '<ellipse cx="62" cy="116" rx="7" ry="18" transform="rotate(18 62 116)"/>' + fino('M68 100 q6 -10 2 -16 M66 99 q10 -6 10 -14', 1.2) + fino('M50 140 q12 -4 16 -10', 1.6) +
      fino('M50 194 l-10 -2 M50 194 l10 -2', 1.6)],
    ['agr-espiga', 'Espiga de milho', 80, 160,
      '<path d="M40 14 C58 14 60 40 58 80 C56 116 50 138 40 140 C30 138 24 116 22 80 C20 40 22 14 40 14 Z"/>' +
      (() => { let d = ''; for (let y = 24; y < 134; y += 9) d += `M${f(25 + (y > 110 ? (y - 110) * 0.3 : 0))} ${y} H${f(55 - (y > 110 ? (y - 110) * 0.3 : 0))} `; return fino(d + 'M32 16 V138 M40 14 V140 M48 16 V138', 1.2); })() +
      '<path d="M40 140 Q16 130 10 90 Q12 120 34 148 M40 140 Q66 130 70 94 Q68 124 46 148" stroke-width="2"/><path d="M40 150 V158" stroke-width="3"/>' +
      fino('M40 14 q-6 -10 -2 -12 M40 14 q4 -10 8 -10', 1.2)],
    ['agr-feijao', 'Feijão (planta com vagens)', 130, 140,
      fino('M4 134 H126', 2) + '<path d="M64 134 V64 Q60 40 66 20" stroke-width="2.2"/>' + fino('M64 100 L36 80 M64 86 L94 64', 2) +
      [[36, 80], [94, 64], [66, 20]].map(([x, y]) => folha(x, y, -90, 18, 7) + folha(x, y, -160, 18, 7) + folha(x, y, -20, 18, 7)).join('') +
      '<path d="M64 112 q-24 4 -30 22 q8 -2 30 -18 Z" stroke-width="1.8"/><path d="M66 106 q24 0 34 16 q-10 0 -34 -12 Z" stroke-width="1.8"/>'],
    ['agr-vagem', 'Vagem de feijão', 150, 60,
      '<path d="M8 34 C30 10 120 8 144 22 C130 46 34 52 8 34 Z"/>' + fino('M2 34 L10 34', 2) +
      [34, 58, 82, 106].map(x => `<ellipse cx="${x}" cy="${f(30 - (x - 70) * (x - 70) / 600)}" rx="9" ry="6" ${tn}/>`).join('')],
    ['agr-algodao', 'Algodão (capulho)', 110, 120,
      '<path d="M55 116 V82" stroke-width="2.4"/>' + '<path d="M55 84 L22 70 L36 92 Z M55 84 L88 70 L74 92 Z M55 84 L50 96 L60 96 Z" stroke-width="1.8"/>' +
      '<path d="M30 64 C14 64 12 40 28 36 C26 18 46 10 56 22 C66 10 86 18 84 36 C100 40 96 64 80 64 C72 76 40 76 30 64 Z"/>' + fino('M56 24 Q52 46 56 70 M30 40 Q44 50 54 50 M82 40 Q68 50 58 50', 1.3)],
    ['agr-melao', 'Melão (casca reticulada)', 120, 100,
      fino('M60 14 Q62 6 70 4', 2.2) + '<ellipse cx="60" cy="56" rx="52" ry="40"/>' +
      fino('M22 30 Q50 50 40 92 M40 20 Q70 50 64 96 M66 16 Q96 48 92 86 M12 52 Q40 40 66 18 M12 70 Q60 60 98 24 M28 90 Q70 70 110 50 M58 96 Q90 80 110 66', 1.1)],
    ['agr-mamoeiro', 'Mamoeiro', 141, 194, "<g transform=\"translate(4.08 3.04)\">" + (fino('M4 184 H126', 2) + '<path d="M58 184 V54 M72 184 V54"/>' + fino('M58 160 h14 M58 140 h14 M58 120 h14 M58 100 h14', 1.2) +
      '<path d="M64 54 L20 30 M66 52 L40 14 M68 52 L96 14 M70 54 L114 30 M64 56 L14 56 M70 56 L118 56" stroke-width="1.8"/>' +
      [[20, 30], [40, 14], [96, 14], [114, 30], [14, 56], [118, 56]].map(([x, y]) => { const a = f(Math.atan2(y - 54, x - 67) * 180 / Math.PI); return folha(x, y, a, 13, 4.5) + folha(x, y, a - 40, 11, 4) + folha(x, y, a + 40, 11, 4); }).join('') +
      [[54, 68], [76, 68], [56, 86], [74, 86]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="10" fill="#C" stroke="none"/>`).join('')) + "</g>"],
  ],

  fito: [
    ['agr-lagarta', 'Lagarta', 150, 70,
      [[22, 40, 13], [42, 36, 11], [60, 33, 11], [78, 32, 11], [96, 33, 11], [114, 36, 11], [132, 40, 10]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('') +
      '<circle cx="18" cy="36" r="2.4" fill="#C" stroke="none"/>' + fino('M12 30 l-6 -10 M20 28 l0 -12', 1.4) +
      fino('M38 47 v12 M56 44 v12 M74 43 v12 M92 43 v12 M110 46 v12 M128 50 v10', 2.2)],
    ['agr-pulgao', 'Pulgão', 110, 100,
      '<path d="M30 50 C30 28 76 26 90 50 C96 64 76 84 50 80 C34 78 30 64 30 50 Z"/><circle cx="26" cy="50" r="9"/>' +
      fino('M20 44 Q8 20 22 6 M24 42 Q24 18 40 8', 1.4) + '<path d="M80 40 L96 32 M84 66 L100 70" stroke-width="3"/>' +
      fino('M44 78 l-8 14 M56 80 l-2 16 M68 78 l6 14 M44 32 l-8 -10 M58 30 l0 -12', 1.6)],
    ['agr-mosca-branca', 'Mosca-branca', 120, 100,
      '<ellipse cx="60" cy="52" rx="8" ry="26"/><circle cx="60" cy="22" r="6"/>' +
      '<path d="M54 40 C30 20 6 34 14 52 C22 64 44 58 54 50 Z M66 40 C90 20 114 34 106 52 C98 64 76 58 66 50 Z M54 56 C34 60 22 80 34 86 C46 90 54 74 56 62 Z M66 56 C86 60 98 80 86 86 C74 90 66 74 64 62 Z" stroke-width="1.8"/>' +
      fino('M56 18 l-8 -12 M64 18 l8 -12', 1.4)],
    ['agr-mosca-frutas', 'Mosca-das-frutas', 130, 100,
      '<circle cx="30" cy="50" r="10"/><ellipse cx="54" cy="50" rx="14" ry="11"/><path d="M68 50 C76 40 104 42 110 50 C104 58 76 60 68 50 Z"/>' +
      '<path d="M52 40 C60 12 92 6 108 18 C94 30 72 38 52 40 Z M52 60 C60 88 92 94 108 82 C94 70 72 62 52 60 Z" stroke-width="1.6"/>' +
      fino('M68 22 L74 34 M84 16 L88 30 M68 78 L74 66 M84 84 L88 70 M80 46 V54 M92 46 V54', 1.6) + '<circle cx="24" cy="46" r="3" fill="#C" stroke="none"/>' +
      fino('M46 60 l-8 16 M54 61 l0 18 M62 60 l8 16', 1.6)],
    ['agr-joaninha', 'Joaninha (inimigo natural)', 110, 100,
      '<path d="M20 60 C20 26 90 26 90 60 C90 84 20 84 20 60 Z"/><path d="M55 30 V82"/><path d="M28 46 C30 30 80 30 82 46" stroke-width="1.6"/>' +
      cheio('M22 48 A12 12 0 0 0 22 72 Z') + [[38, 50], [72, 50], [36, 68], [74, 68], [55, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#C" stroke="none"/>`).join('') +
      fino('M14 50 l-8 -8 M14 70 l-8 8 M32 82 l-6 10 M78 82 l6 10 M55 82 v10', 1.6)],
    ['agr-folha-doente', 'Folha com manchas (doença)', 110, 140,
      '<path d="M55 6 C94 28 94 82 55 116 C16 82 16 28 55 6 Z"/><path d="M55 116 V136" stroke-width="2.4"/>' + fino('M55 10 V114', 1.2) +
      [[38, 40, 6], [70, 36, 5], [42, 74, 7], [72, 70, 6], [56, 94, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#C" stroke="none"/><circle cx="${x}" cy="${y}" r="${r + 4}" stroke-width="1.2" stroke-dasharray="2 2"/>`).join('')],
    ['agr-pulverizador-costal', 'Pulverizador costal', 140, 160,
      '<rect x="14" y="20" width="56" height="96" rx="10"/><rect x="30" y="10" width="24" height="10" rx="3"/>' + trac('M18 54 H66', 1.3) +
      '<path d="M70 40 L86 28 M70 100 H80"/><circle cx="86" cy="28" r="3" fill="#C" stroke="none"/>' + fino('M30 116 V126 M54 116 V126', 2) +
      '<path d="M74 104 Q90 140 104 120 L126 82" stroke-width="2"/><rect x="100" y="112" width="10" height="6" transform="rotate(-60 105 115)" fill="#C" stroke="none"/>' +
      trac('M126 82 L112 60 M126 82 L132 58 M126 82 L122 58', 1.3)],
    ['agr-epi-aplicador', 'EPI para aplicação de agrotóxico', 120, 200,
      '<circle cx="60" cy="30" r="14"/><path d="M42 18 Q60 0 78 18 L80 50 H40 Z" stroke-width="2"/><path d="M44 26 H76 V42 H44 Z" stroke-width="1.6"/>' +
      '<path d="M38 54 H82 L90 110 H30 Z"/><path d="M46 60 H74 L80 118 H40 Z" stroke-width="1.6"/>' +
      '<path d="M38 56 L22 100 M82 56 L98 100"/>' + cheio('M16 98 h12 v12 q-6 4 -12 0 Z M92 98 h12 v12 q-6 4 -12 0 Z') +
      '<path d="M40 118 L42 170 M80 118 L78 170 M58 118 V170 M62 118 V170"/>' + cheio('M38 168 H58 V186 H32 Q32 176 38 168 Z M62 168 H82 Q88 176 88 186 H62 Z')],
    ['agr-triplice-lavagem', 'Tríplice lavagem (embalagem)', 130, 130,
      '<path d="M30 40 H90 Q100 40 100 50 V116 Q100 124 92 124 H28 Q20 124 20 116 V50 Q20 40 30 40 Z"/><rect x="34" y="28" width="18" height="12" rx="2"/>' +
      '<path d="M66 40 V24 H90 V40" stroke-width="2"/>' + T(60, 84, '3×', 26) + gota(108, 30, 6) + gota(118, 52, 5) + gota(10, 30, 5)],
    ['agr-armadilha', 'Armadilha para mosca-das-frutas', 100, 140,
      '<path d="M50 4 V16 M44 16 H56"/><rect x="30" y="18" width="40" height="10" rx="3"/>' +
      '<path d="M32 28 C10 40 10 116 32 126 H44 C40 112 40 104 50 100 C60 104 60 112 56 126 H68 C90 116 90 40 68 28"/>' + trac('M20 86 H80', 1.3) +
      '<ellipse cx="50" cy="60" rx="6" ry="3" fill="#C" stroke="none"/><path d="M50 60 l-7 -6 M50 60 l7 -6" stroke-width="1.4"/>'],
    ['agr-mip', 'MIP: nível de dano e nível de controle', 222, 155, "<g transform=\"translate(0.00 0.00)\">" + (mip) + "</g>"],
  ],

  maquinas: [
    ['agr-arado-discos', 'Arado de discos', 188, 110, "<g transform=\"translate(1.00 0.00)\">" + ('<path d="M8 40 L26 24 L8 64 M26 24 H160 L168 40"/>' + '<circle cx="8" cy="40" r="3" fill="#C" stroke="none"/><circle cx="8" cy="64" r="3" fill="#C" stroke="none"/>' +
      [56, 94, 132].map(x => `<path d="M${x} 24 V46"/><ellipse cx="${x + 6}" cy="68" rx="10" ry="24" transform="rotate(-20 ${x + 6} 68)"/><circle cx="${x + 6}" cy="68" r="3" fill="#C" stroke="none"/>`).join('') +
      '<path d="M168 40 V70"/>' + roda(168, 84, 14) + fino('M4 104 H176', 1.4)) + "</g>"],
    ['agr-arado-aiveca', 'Arado de aiveca', 160, 110,
      '<path d="M8 30 H120 L130 22" stroke-width="3"/><path d="M90 30 V62"/>' +
      '<path d="M60 92 L96 62 Q118 60 126 40 Q118 74 104 92 Z" stroke-width="2.4"/><path d="M60 92 L104 92" stroke-width="3"/>' +
      '<path d="M40 30 V60 M40 60 L56 80"/>' + fino('M4 104 H156', 1.4) + fino('M108 70 Q114 66 118 58 M100 80 Q110 76 114 70', 1.2)],
    ['agr-grade-discos', 'Grade de discos', 200, 100,
      '<path d="M8 40 L24 26 H186 M24 26 V40 H186 V26"/>' + '<circle cx="8" cy="40" r="3" fill="#C" stroke="none"/>' +
      [40, 56, 72, 88, 116, 132, 148, 164].map(x => `<ellipse cx="${x}" cy="66" rx="5" ry="22"/>`).join('') +
      '<path d="M34 66 H94 M110 66 H170" stroke-width="2"/>' + '<path d="M64 40 V48 M140 40 V48"/>' + fino('M4 92 H196', 1.4)],
    ['agr-subsolador', 'Subsolador', 130, 130,
      '<path d="M8 26 L24 14 H118 V26 H24 Z"/>' + '<circle cx="8" cy="26" r="3" fill="#C" stroke="none"/>' +
      [52, 92].map(x => `<path d="M${x} 26 V70 Q${x} 100 ${x + 16} 112 L${x + 24} 114" stroke-width="4"/>`).join('') +
      fino('M4 70 H126', 1.4) + pontos(10, 124, 82, 122, 14, 2)],
    ['agr-semeadora', 'Semeadora-adubadora', 200, 120,
      '<path d="M8 50 L26 40 H180 M26 40 V52 H180 V40"/><circle cx="8" cy="50" r="3" fill="#C" stroke="none"/>' +
      '<path d="M40 40 L30 8 H96 L86 40 Z M110 40 L100 8 H176 L166 40 Z"/>' + T(63, 24, 'adubo', 14) + T(138, 24, 'semente', 14) +
      '<path d="M63 52 V78 M138 52 V78"/>' + '<circle cx="63" cy="88" r="11"/><circle cx="138" cy="88" r="11"/>' + roda(178, 88, 12) +
      trac('M138 58 V74', 1.2) + fino('M4 104 H196', 1.4)],
    ['agr-pulverizador-barras', 'Pulverizador de barras (traseira)', 240, 120,
      '<rect x="88" y="14" width="64" height="52" rx="18"/><rect x="112" y="8" width="16" height="6" rx="2"/>' +
      roda(96, 84, 14) + roda(144, 84, 14) + '<path d="M96 66 V70 M144 66 V70"/>' +
      '<path d="M6 60 H234" stroke-width="3"/>' +
      [16, 44, 72, 168, 196, 224].map(x => `<path d="M${x} 60 V66"/>` + trac(`M${x} 68 L${x - 10} 96 M${x} 68 L${x + 10} 96 M${x} 68 V96`, 1.2)).join('') +
      fino('M4 104 H236', 1.4)],
    ['agr-colhedora', 'Colhedora (colheitadeira)', 250, 130,
      '<path d="M70 92 V44 H96 V20 H136 V44 H200 L214 62 V96 H70"/>' + '<path d="M100 24 H132 V42 H100 Z" stroke-width="1.6"/>' +
      '<path d="M150 44 V24 H196 L204 44" stroke-width="2"/><path d="M196 30 L238 12" stroke-width="5"/>' +
      '<path d="M70 70 H40 L8 92 H48 L70 84"/>' + '<circle cx="40" cy="70" r="16" stroke-width="1.8"/>' + fino('M24 70 H56 M40 54 V86 M29 59 L51 81 M51 59 L29 81', 1.2) +
      roda(110, 98, 26) + roda(192, 106, 16) + fino('M4 124 H246', 1.4)],
    ['agr-enxada', 'Enxada', 70, 160,
      '<path d="M58 6 L22 124" stroke-width="5"/><path d="M14 118 L30 124 L24 132 Z" stroke-width="2"/><path d="M24 130 L60 152 L54 158 L18 136 Z" fill="#C"/>'],
    ['agr-matraca', 'Plantadeira manual (matraca)', 90, 170,
      '<path d="M30 8 L36 120 M60 8 L54 120" stroke-width="4"/><path d="M22 8 H38 M52 8 H68" stroke-width="5"/>' +
      '<path d="M38 30 H62 V64 H38 Z"/>' + fino('M44 64 V100', 1.4) + '<path d="M36 120 L45 160 L54 120"/>' + '<circle cx="45" cy="116" r="3" fill="#C" stroke="none"/>' +
      fino('M8 146 H82', 1.6)],
  ],

  zoo: [
    ['agr-galinha', 'Galinha', 120, 110,
      '<path d="M30 46 C26 30 36 20 46 24 C52 36 50 50 60 54 C76 58 92 44 100 26 C112 40 112 70 96 82 C80 94 52 92 40 80 C30 70 32 58 30 46 Z"/>' +
      cheio('M38 22 q2 -10 6 -6 q4 -8 7 0 q5 -4 4 6 Z') + '<path d="M30 34 L20 38 L30 40" stroke-width="2"/>' + cheio('M34 42 q-2 10 3 10 q3 -6 0 -10 Z') +
      '<circle cx="38" cy="32" r="2" fill="#C" stroke="none"/>' + fino('M58 70 Q74 66 86 54', 1.4) + '<path d="M60 90 V104 L52 106 M60 104 L66 106 M76 90 V104 L68 106 M76 104 L82 106" stroke-width="2"/>'],
    ['agr-cabra', 'Cabra', 150, 130,
      '<path d="M40 50 H108 Q122 50 120 70 L118 86 Q114 96 104 94 H50 Q40 94 38 84 Z"/>' +
      '<path d="M40 54 L26 32 L14 38 L16 50 L30 62"/>' + cheio('M14 50 q-2 12 6 16 q2 -10 -2 -16 Z') + '<path d="M26 32 Q30 12 46 18" stroke-width="2.6"/><path d="M24 34 L18 26" stroke-width="2"/>' +
      '<circle cx="22" cy="40" r="2" fill="#C" stroke="none"/>' + '<path d="M118 56 L130 44" stroke-width="2.4"/>' +
      '<path d="M50 94 V124 M62 94 V124 M100 94 V124 M112 92 V124"/>'],
    ['agr-ovelha', 'Ovelha', 150, 120,
      (() => { let d = 'M36 40'; const pts = [[56, 30], [76, 28], [96, 28], [116, 34], [128, 52], [126, 72], [108, 84], [86, 86], [64, 86], [42, 82], [32, 62], [36, 40]]; for (const [x, y] of pts) d += ` Q${f(x)} ${f(y - 8)} ${x} ${y}`; return `<path d="${d} Z"/>`; })() +
      '<path d="M36 48 C24 38 10 44 10 56 C12 68 24 70 34 62" fill="#C" stroke="none"/>' + '<path d="M26 44 L22 34" stroke-width="2.4"/>' +
      '<path d="M50 86 V112 M66 86 V112 M100 86 V112 M114 82 V112" stroke-width="3"/>'],
    ['agr-vaca-leiteira', 'Vaca leiteira', 180, 130,
      '<path d="M44 40 H140 Q160 40 158 64 L154 82 Q150 92 138 92 H54 Q42 92 40 80 L40 40 Z"/>' +
      '<path d="M44 44 L30 30 L12 34 L10 56 L24 62 L42 58"/>' + '<path d="M28 30 l-4 -10 M38 34 l6 -10" stroke-width="2.2"/>' + '<circle cx="22" cy="42" r="2" fill="#C" stroke="none"/><ellipse cx="13" cy="54" rx="4" ry="3"/>' +
      cheio('M70 44 q14 -2 18 10 q-4 14 -18 10 q-8 -10 0 -20 Z M112 56 q12 -6 20 4 q0 14 -14 14 q-10 -4 -6 -18 Z M98 82 q10 -4 14 4 q-4 6 -14 4 Z') +
      '<path d="M158 52 Q170 70 166 96" stroke-width="2"/>' + '<path d="M106 92 Q110 106 122 106 Q134 106 136 92 M114 104 V112 M128 104 V112" stroke-width="2"/>' +
      '<path d="M56 92 V124 M70 92 V124 M140 92 V124 M150 88 V124"/>'],
    ['agr-suino', 'Suíno', 150, 110,
      '<path d="M34 34 C60 22 116 22 130 44 C140 62 128 80 110 82 H48 C30 80 22 60 34 34 Z"/>' + '<ellipse cx="20" cy="52" rx="8" ry="12"/>' + fino('M18 48 v8 M23 48 v8', 1.8) +
      '<path d="M40 30 L48 14 L56 30" stroke-width="2"/><circle cx="38" cy="44" r="2.2" fill="#C" stroke="none"/>' + '<path d="M132 50 q12 -6 8 6 q-4 8 6 4" stroke-width="1.8"/>' +
      '<path d="M48 82 V102 M62 82 V102 M104 82 V102 M118 80 V102" stroke-width="3"/>'],
    ['agr-aprisco', 'Aprisco suspenso (piso ripado)', 210, 140,
      '<path d="M10 52 L105 12 L200 52"/><path d="M24 46 V82 M186 46 V82"/>' + '<path d="M18 82 H192" stroke-width="3"/>' + trac('M22 88 H188', 2) +
      '<path d="M30 88 V130 M80 88 V130 M130 88 V130 M180 88 V130"/>' + '<path d="M186 82 L206 130" stroke-width="2"/>' + fino('M190 92 l6 -2 M194 102 l6 -2 M198 112 l6 -2', 1.2) +
      fino('M4 132 H206', 1.6) + fino('M40 82 V58 M60 82 V58 M80 82 V58 M100 82 V58 M120 82 V58 M140 82 V58 M160 82 V58 M24 58 H186', 1.4)],
    ['agr-aviario', 'Aviário (galpão)', 240, 120,
      '<path d="M8 50 L40 22 L72 50 V108 H8 Z"/><path d="M40 22 H200 L232 50 V108 H72"/><path d="M72 50 L232 50"/>' +
      '<path d="M34 108 V80 H46 V108" stroke-width="1.8"/>' + '<path d="M80 60 H226 V96 H80 Z" stroke-width="1.6" stroke-dasharray="6 4"/>' +
      fino('M100 60 V96 M124 60 V96 M148 60 V96 M172 60 V96 M196 60 V96', 1.1) + '<path d="M60 22 V14 H180 V22" stroke-width="1.8"/>'],
    ['agr-colmeia', 'Colmeia (apicultura)', 110, 140,
      '<path d="M14 14 H96 V24 H14 Z"/><rect x="18" y="24" width="74" height="30"/><rect x="18" y="54" width="74" height="46"/>' +
      '<path d="M12 100 H98 V108 H12 Z"/>' + cheio('M40 94 H70 V98 H40 Z') + '<path d="M24 108 V132 M86 108 V132"/>' +
      fino('M30 34 H80 M30 44 H80', 1.2) + '<ellipse cx="96" cy="70" rx="5" ry="3.5" fill="#C" stroke="none"/>' + fino('M96 66 q-4 -6 -8 -2 M96 66 q4 -6 8 -2', 1.2)],
  ],

  posColheita: [
    ['agr-silo', 'Silo metálico (grãos)', 110, 180,
      '<path d="M20 60 L55 22 L90 60"/><rect x="50" y="12" width="10" height="10"/>' + '<path d="M20 60 V172 H90 V60"/>' +
      fino('M20 72 H90 M20 84 H90 M20 96 H90 M20 108 H90 M20 120 H90 M20 132 H90 M20 144 H90 M20 156 H90', 1.1) +
      '<path d="M96 64 V172 M104 64 V172" stroke-width="1.6"/>' + fino('M96 76 H104 M96 92 H104 M96 108 H104 M96 124 H104 M96 140 H104 M96 156 H104', 1.4) + fino('M4 174 H106', 2)],
    ['agr-silo-trincheira', 'Silo trincheira (silagem)', 210, 110,
      fino('M4 34 H40 M170 34 H206', 2) + '<path d="M40 34 L56 100 H154 L170 34"/>' +
      '<path d="M44 40 Q105 14 166 40" stroke-width="2.6"/>' + fino('M50 56 H160 M54 72 H156 M58 88 H152', 1.2) +
      `<ellipse cx="74" cy="26" rx="12" ry="5"/><ellipse cx="105" cy="22" rx="12" ry="5"/><ellipse cx="136" cy="26" rx="12" ry="5"/>`],
    ['agr-armazem', 'Armazém graneleiro (corte)', 220, 130,
      '<path d="M10 120 V60 Q110 -10 210 60 V120"/>' + fino('M4 122 H216', 2) + '<path d="M30 120 L110 46 L190 120" stroke-width="2"/>' + pontos(46, 174, 96, 116, 10, 2.2) + pontos(80, 140, 72, 92, 10, 2.2) +
      '<path d="M110 26 V42" stroke-width="2"/>' + head(110, 46, 90, 8)],
    ['agr-caixa-colheita', 'Caixa de colheita', 150, 110,
      '<path d="M10 34 H120 L140 20 H30 Z"/><path d="M10 34 V102 H120 V34 M120 102 L140 88 V20"/>' +
      '<rect x="48" y="42" width="34" height="10" rx="5"/>' + fino('M22 62 H108 M22 74 H108 M22 86 H108 M128 40 V84', 2.2)],
    ['agr-saca', 'Saca de grãos', 100, 130,
      '<path d="M34 24 C20 40 12 70 14 104 Q16 122 30 122 H70 Q84 122 86 104 C88 70 80 40 66 24 Z"/>' + '<path d="M34 24 L28 8 M66 24 L72 8 M40 24 Q50 30 60 24" stroke-width="2"/>' +
      '<path d="M36 20 H64" stroke-width="3"/>' + T(50, 80, '60 kg', 16)],
    ['agr-camara-fria', 'Câmara fria', 160, 130,
      '<rect x="6" y="10" width="148" height="114" rx="3"/><rect x="14" y="18" width="132" height="98" stroke-width="1.4"/>' +
      '<path d="M98 116 V40 H138 V116" stroke-width="2"/><path d="M130 72 V84" stroke-width="3"/>' +
      '<rect x="24" y="80" width="28" height="18" stroke-width="1.8"/><rect x="56" y="80" width="28" height="18" stroke-width="1.8"/><rect x="40" y="60" width="28" height="18" stroke-width="1.8"/><path d="M22 100 H86 M22 106 H86" stroke-width="1.6"/>' +
      fino('M50 26 V50 M40 32 L60 44 M60 32 L40 44', 2) + fino('M118 50 V60 M114 54 H122', 1)],
  ],

  manejo: [
    ['agr-rotacao', 'Rotação de culturas', 200, 180,
      (() => { let s = ''; for (const [a0, a1] of [[20, 100], [140, 220], [260, 340]]) { s += `<path d="M${pol(100, 92, 62, a0).join(' ')} A62 62 0 0 1 ${pol(100, 92, 62, a1).join(' ')}" stroke-width="2"/>` + head(...pol(100, 92, 62, a1 + 4), a1 + 4, 11); } return s; })() +
      milho(100, 44, 30, true) + T(100, 62, 'milho', 14) +
      feijaozinho(160, 140, 22) + T(160, 158, 'feijão', 14) +
      `<path d="M46 140 V118" stroke-width="2"/>` + folha(46, 128, -150, 12, 5) + folha(46, 124, -30, 12, 5) + folha(46, 118, -90, 10, 4) + T(52, 158, 'adubo verde', 14) + T(100, 96, 'ano a ano', 14)],
    ['agr-consorcio', 'Consórcio (milho e feijão)', 230, 120,
      fino('M4 112 H226', 2) + [20, 76, 132, 188].map(x => milho(x, 112, 88, true, true)).join('') + [48, 104, 160, 216].map(x => feijaozinho(x, 112, 24)).join('')],
    ['agr-plantio-direto', 'Plantio direto na palha', 210, 120,
      fino('M4 66 H206', 2) +
      fino('M8 62 l14 -4 M26 64 l12 -6 M44 61 l16 2 M64 63 l10 -6 M84 62 l16 -2 M104 64 l12 -5 M126 61 l14 3 M146 63 l12 -6 M166 62 l16 -3 M186 64 l14 -4 M14 58 l10 2 M100 58 l10 -2 M156 57 l12 2', 2.4) +
      [40, 104, 168].map(x => muda(x, 64, 34) + fino(`M${x} 66 V100 M${x} 76 l-10 12 M${x} 82 l10 12`, 1.4)).join('') + pontos(12, 200, 82, 112, 16, 2)],
    ['agr-adubacao-verde', 'Adubação verde (corte e incorporação)', 230, 120,
      fino('M4 80 H226', 2) +
      [16, 40, 64].map(x => `<path d="M${x} 80 V30" stroke-width="2"/>` + folha(x, 60, -150, 14, 5) + folha(x, 48, -30, 14, 5) + folha(x, 36, -150, 12, 4)).join('') +
      seta(86, 50, 128, 50, 11, 2.2) +
      fino('M140 76 l14 -6 M160 78 l12 -8 M178 76 l16 -2 M200 78 l12 -6 M146 90 l12 -4 M170 94 l14 -2 M196 92 l12 -6', 2.2) + pontos(140, 220, 100, 112, 12, 2)],
    ['agr-ciclo-n', 'Ciclo do nitrogênio (agrícola)', 272, 200, cicloN],
    ['agr-nodulos', 'Nódulos de leguminosa (fixação de N)', 110, 160,
      fino('M4 50 H106', 2) + `<path d="M55 50 V12" stroke-width="2"/>` + folha(55, 14, -90, 14, 5) + folha(55, 14, -150, 14, 5) + folha(55, 14, -30, 14, 5) +
      '<path d="M55 50 V150" stroke-width="2"/>' + fino('M55 70 L26 90 L18 108 M55 84 L84 102 L92 120 M55 112 L36 132 M55 124 L76 142', 1.6) +
      [[36, 82, 5], [22, 100, 4.5], [72, 94, 5], [88, 112, 4.5], [44, 124, 4.5], [68, 136, 4.5], [55, 98, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#C" stroke="none"/>`).join('')],
    ['agr-mulching', 'Canteiro com mulching e gotejo', 210, 110,
      '<path d="M20 90 L36 54 H174 L190 90"/>' + '<path d="M18 92 L36 50 H174 L192 92" stroke-width="1.6"/>' + fino('M4 92 H206', 2) +
      [64, 105, 146].map(x => muda(x, 50, 30)).join('') + pontos(44, 166, 66, 86, 12, 2)],
  ],

  medidas: [
    ['agr-hectare', 'Hectare (100 m × 100 m)', 170, 170,
      '<rect x="30" y="30" width="130" height="130"/>' + fino('M30 16 H160 M30 10 V22 M160 10 V22 M16 30 V160 M10 30 H22 M10 160 H22') +
      head(30, 16, 180, 8) + head(160, 16, 0, 8) + head(16, 30, -90, 8) + head(16, 160, 90, 8) +
      T(95, 46, '100 m', 15) + T(52, 95, '100 m', 15).replace('text ', 'text transform="rotate(-90 52 95)" ') + T(100, 102, '1 ha', 30)],
    ['agr-croqui', 'Croqui da propriedade', 250, 190,
      '<path d="M10 10 H210 L240 60 L230 150 H10 Z"/>' + '<path d="M4 162 H246 M4 180 H246"/>' + trac('M4 171 H246', 1.2) +
      '<path d="M10 80 H120 M120 10 V150 M120 90 H236"/>' +
      '<path d="M24 26 L44 14 L64 26 V48 H24 Z"/>' +
      '<path d="M150 112 C140 100 160 94 176 100 C196 96 214 108 206 124 C196 140 160 140 150 126 Z"/>' + fino(onda(160, 196, 118, 2, 12), 1.2) +
      [36, 56, 76, 96].map(x => [100, 118, 136].map(y => `<circle cx="${x}" cy="${y}" r="5" stroke-width="1.6"/>`).join('')).join('') +
      T(90, 46, 'T1', 16) + T(176, 46, 'T2', 16) +
      '<path d="M242 36 V16" stroke-width="2"/>' + head(242, 8, -90, 10) + T(229, 22, 'N', 15)],
    ['agr-espacamento', 'Espaçamento entre linhas e entre plantas', 220, 156,
      [40, 90, 140, 190].map(x => [50, 98, 146].map(y => `<circle cx="${x}" cy="${y}" r="7" stroke-width="2"/><path d="M${x - 4} ${y} H${x + 4} M${x} ${y - 4} V${y + 4}" stroke-width="1.4"/>`).join('')).join('') +
      trac('M24 50 H210 M24 98 H210 M24 146 H210', 1) +
      fino('M14 50 V98') + head(14, 50, -90, 7) + head(14, 98, 90, 7) + T(66, 74, 'entre linhas', 14) +
      fino('M90 28 H140') + head(90, 28, 180, 7) + head(140, 28, 0, 7) + T(115, 11, 'entre plantas', 14)],
    ['agr-quadro-amostragem', 'Quadro de amostragem (1 m²)', 130, 140,
      '<rect x="14" y="14" width="102" height="102" stroke-width="3.2"/>' + fino('M48 14 V116 M82 14 V116 M14 48 H116 M14 82 H116', 1.1) +
      tufo(30, 40, 1.2) + tufo(70, 34, 1.2) + tufo(100, 70, 1.2) + tufo(40, 100, 1.2) + tufo(64, 76, 1.2) + T(65, 130, '1 m', 15)],
    ['agr-estacao-met', 'Estação meteorológica', 150, 180,
      fino('M4 174 H146', 2) + '<path d="M44 174 V30"/>' + '<path d="M28 30 H60 M44 30 V22"/>' +
      '<path d="M28 30 a6 4 0 0 1 0 -8 M60 30 a6 4 0 0 0 0 -8" stroke-width="2"/>' + '<path d="M44 22 L26 10 M44 22 L62 10"/>' + cheio('M20 6 L30 10 L22 14 Z') + '<path d="M62 10 L70 6" stroke-width="2"/>' +
      '<path d="M44 70 L70 56 L74 64 L48 78 Z" stroke-width="1.8"/>' +
      '<path d="M84 100 L106 90 L128 100 V140 H84 Z"/>' + fino('M90 108 H122 M90 116 H122 M90 124 H122 M90 132 H122', 1.4) + '<path d="M94 140 V174 M118 140 V174"/>' +
      '<path d="M14 120 H30 V140 H14 Z M22 140 V174" stroke-width="2"/>' + '<path d="M12 120 L16 114 H28 L32 120" stroke-width="1.6"/>'],
  ],
};

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "ag-plano-manejo",
        "Manejo — plano por talhão",
        540,
        224,
        "<text x=\"270\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Manejo — plano por talhão</text><rect x=\"10\" y=\"42\" width=\"520\" height=\"178\" rx=\"3\"/><text x=\"75\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Talhão</text><text x=\"205\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Diagnóstico</text><path d=\"M140 42 V220\"/><text x=\"335\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Prática</text><path d=\"M270 42 V220\"/><text x=\"465\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Indicador</text><path d=\"M400 42 V220\"/><path d=\"M10 68 H530\"/><path d=\"M10 106 H530\"/><path d=\"M10 144 H530\"/><path d=\"M10 182 H530\"/>"
      ],
      [
        "ag-perfil-preencher",
        "Perfil do solo — descrição de horizontes",
        440,
        240,
        "<text x=\"220\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Perfil esquemático — sem escala</text><rect x=\"15\" y=\"46\" width=\"150\" height=\"176\" rx=\"3\"/><path d=\"M15 95 H165 M15 155 H165\"/><text x=\"285\" y=\"72\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Horizonte: ______</text><text x=\"285\" y=\"122\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Textura: ______</text><text x=\"285\" y=\"184\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Profundidade (cm): ___</text>"
      ]
    ]
  ]
];

export default {
  id: 'agronomia', nome: 'Agronomia',
  destaques: [
    'agr-perfil-solo', 'agr-triangulo-textural', 'agr-planta-partes', 'agr-gotejamento', 'agr-microaspersao', 'agr-pivo-planta',
    'agr-bulbo-molhado', 'agr-tensiometro', 'agr-balanco-hidrico', 'agr-bananeira', 'agr-cajueiro', 'agr-milho',
    'agr-pulverizador-costal', 'agr-epi-aplicador', 'agr-ciclo-n', 'agr-croqui',
  ],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Solos', agr.solos],
    ['Plantas', agr.plantas],
    ['Irrigação', agr.irrigacao],
    ['Fruticultura e culturas', agr.culturas],
    ['Fitossanidade', agr.fito],
    ['Máquinas e implementos', agr.maquinas],
    ['Zootecnia', agr.zoo],
    ['Pós-colheita e armazenamento', agr.posColheita],
    ['Manejo do solo e das culturas', agr.manejo],
    ['Medidas e propriedade', agr.medidas],
  ],
};
