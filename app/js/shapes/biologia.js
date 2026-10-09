// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Biologia (ensino médio e superior): célula, membrana, DNA, divisão, genética, fisiologia, botânica, micro, ecologia, evolução.
import { T, head } from './base.js';

// prefixo dos ids: 'bio-'
// Desenhos próprios do Giz Livre, coordenadas calculadas aqui (nada copiado de atlas, livros ou bibliotecas de ícones).
// Esquemas didáticos simplificados: a proporção entre as partes é ilustrativa, não anatômica.

const f = n => +n.toFixed(1);
const fino = (d, w = 1.6) => `<path d="${d}" stroke-width="${w}"/>`;
const dot = (x, y, r = 2.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#C" stroke="none"/>`;
const serie = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');
const L = (s, x, y, size = 14) => T(x, y, s, size); // rótulo (fonte mínima 14)
const pt = (cx, cy, r, ang) => { const a = ang * Math.PI / 180; return [f(cx + r * Math.cos(a)), f(cy + r * Math.sin(a))]; };
// seta reta de (x1,y1) até a ponta (x2,y2)
const seta = (x1, y1, x2, y2, w = 2, Lh = 10) => {
  const a = Math.atan2(y2 - y1, x2 - x1), xe = x2 - 0.8 * Lh * Math.cos(a), ye = y2 - 0.8 * Lh * Math.sin(a);
  return `<path d="M${x1},${y1} L${f(xe)},${f(ye)}" stroke-width="${w}"/>` + head(x2, y2, f(a * 180 / Math.PI), Lh);
};
// seta entre dois círculos (centro, raio), parando na borda
const setaC = (x1, y1, r1, x2, y2, r2) => {
  const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(a), s = Math.sin(a);
  return seta(f(x1 + r1 * c), f(y1 + r1 * s), f(x2 - r2 * c), f(y2 - r2 * s), 1.8, 9);
};
// curva y = fn(x) amostrada
const graf = (fn, x0, x1, passo = 2) => { let d = ''; for (let x = x0; x <= x1 + 1e-9; x += passo) d += (d ? ' L' : 'M') + f(x) + ',' + f(fn(x)); return d; };
// eixos cartesianos com origem (x0,y0), até (x1, yTopo)
const eixos = (x0, y0, x1, yt) => `<path d="M${x0},${y0} H${x1 - 6} M${x0},${y0} V${yt + 6}"/>` + head(x1, y0, 0, 10) + head(x0, yt, -90, 10);
const caixa = (x, y, w, h, s, size = 14) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/>` + T(x + w / 2, y + h / 2, s, size);

// ===== peças reaproveitadas =====
// mitocôndria pequena centrada em (cx,cy), girada `ang`, escala s
const mito = (cx, cy, ang, s = 1) => `<g transform="translate(${cx} ${cy}) rotate(${ang}) scale(${s})"><ellipse rx="17" ry="8.5"/>`
  + `<path d="M-11,0 L-8,-5 L-5,4 L-2,-5 L1,4 L4,-5 L7,4 L10,-2" stroke-width="1.3"/></g>`;
// cloroplasto pequeno
const cloro = (cx, cy, ang, s = 1) => `<g transform="translate(${cx} ${cy}) rotate(${ang}) scale(${s})"><ellipse rx="15" ry="7"/>`
  + `<path d="M-8,-3 V3 M-3,-4 V4 M2,-4 V4 M7,-3 V3" stroke-width="1.6"/></g>`;
// cromátide (pílula) vertical, centro (cx,cy), meia-altura h, girada ang; cheia ou vazada
const pilula = (cx, cy, h, ang = 0, cheia = false, w = 7) => `<rect x="${f(cx - w / 2)}" y="${f(cy - h)}" width="${w}" height="${2 * h}" rx="${w / 2}" transform="rotate(${ang} ${cx} ${cy})"${cheia ? ' fill="#C"' : ''} stroke-width="1.6"/>`;
// cromossomo duplicado em X (duas cromátides unidas no centrômero)
const xcrom = (cx, cy, h, cheio = true, ang = 0, w = 6) => `<g transform="rotate(${ang} ${cx} ${cy})">${pilula(cx - 2, cy, h, -14, cheio, w)}${pilula(cx + 2, cy, h, 14, cheio, w)}</g>`;
// cromossomo simples (uma cromátide)
const icrom = (cx, cy, h, cheio = true, ang = 0, w = 6) => pilula(cx, cy, h, ang, cheio, w);
// cromátide puxada pelo fuso (forma de V, vértice apontando para o polo)
const vcrom = (cx, cy, dir, cheio = true) => `<path d="M${cx + dir * 8},${cy - 9} L${cx},${cy} L${cx + dir * 8},${cy + 9}" stroke-width="${cheio ? 4 : 2}"/>`;
// célula em divisão (contorno)
const celD = '<ellipse cx="65" cy="55" rx="58" ry="48"/>';
// áster (centríolo com raios)
const aster = (cx, cy) => dot(cx, cy, 3) + fino(serie(8, i => { const [a, b] = pt(cx, cy, 5, i * 45), [c, d] = pt(cx, cy, 11, i * 45); return `M${a},${b} L${c},${d} `; }), 1.2);
// fosfolipídio pequeno: cabeça em (x,y), caudas para dir (+1 baixo, -1 cima)
const lip = (x, y, dir, cauda = 20) => dot(x, y, 4.5) + `<path d="M${x - 2},${y + dir * 4} V${y + dir * cauda} M${x + 2},${y + dir * 4} V${y + dir * (cauda * 0.55)} L${x + 4},${y + dir * (cauda * 0.75)} V${y + dir * cauda}" stroke-width="1.3"/>`;
// hemácia vista de frente
const hemF = (cx, cy, r = 14) => `<circle cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx}" cy="${cy}" r="${f(r * 0.42)}" stroke-width="1.3"/>`;
// árvore pequena (copa redonda) com base em (x,y), altura h
const arvore = (x, y, h, r) => `<path d="M${x},${y} V${f(y - h + r)}"/><circle cx="${x}" cy="${f(y - h)}" r="${r}"/>`;
// tufo de capim com base em (x,y)
const tufo = (x, y, s = 1) => fino(`M${x},${y} l${-5 * s},${-10 * s} M${x},${y} V${f(y - 13 * s)} M${x},${y} l${5 * s},${-10 * s}`, 1.6);
// símbolo de heredograma
const hq = (cx, cy, r, af = false) => `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}"${af ? ' fill="#C"' : ''}/>`;
const hc = (cx, cy, r, af = false) => `<circle cx="${cx}" cy="${cy}" r="${r}"${af ? ' fill="#C"' : ''}/>`;
// faixa senoidal (retículo endoplasmático): par de linhas onduladas fechadas
const onda = (x0, x1, y0, A, fase) => graf(x => y0 + A * Math.sin((x - x0) / (x1 - x0) * 2 * Math.PI + fase), x0, x1, 3);

// ===== Célula e organelas =====
const CELULA = [
  ['bio-cel-animal', 'Célula animal', 220, 160,
    '<path d="M20,80 C18,36 60,10 110,12 C165,14 204,40 202,82 C200,126 160,150 108,148 C56,146 22,124 20,80 Z"/>'
    + '<circle cx="96" cy="76" r="28"/><circle cx="96" cy="76" r="24" stroke-width="1.2"/>' + dot(103, 70, 8)
    + mito(160, 56, -20) + mito(58, 120, 15)
    + fino('M140,104 Q156,96 172,104 M138,112 Q156,104 174,112 M140,120 Q156,112 172,120', 2)
    + '<circle cx="180" cy="96" r="3.5" stroke-width="1.4"/><circle cx="182" cy="124" r="3.5" stroke-width="1.4"/>'
    + fino('M30,70 Q38,64 46,70 T62,70 M30,84 Q38,78 46,84 T62,84', 1.6)
    + dot(34, 63, 1.8) + dot(50, 63, 1.8) + dot(36, 92, 1.8) + dot(52, 91, 1.8)
    + '<rect x="132" y="28" width="12" height="5" rx="2" stroke-width="1.4"/><rect x="148" y="24" width="5" height="12" rx="2" stroke-width="1.4"/>'
    + '<circle cx="124" cy="132" r="7" stroke-width="1.6"/>' + dot(124, 132, 2)
    + dot(70, 30, 1.8) + dot(120, 30, 1.8) + dot(176, 76, 1.8) + dot(96, 134, 1.8) + dot(40, 104, 1.8)],
  ['bio-cel-vegetal', 'Célula vegetal', 220, 160,
    '<rect x="4" y="4" width="212" height="152" rx="10"/><rect x="11" y="11" width="198" height="138" rx="7" stroke-width="1.6"/>'
    + '<path d="M72,42 C110,30 168,36 174,70 C180,108 140,124 102,120 C66,116 54,64 72,42 Z" stroke-width="1.8"/>'
    + '<circle cx="40" cy="116" r="18"/>' + dot(44, 112, 5)
    + cloro(36, 36, 30) + cloro(36, 72, -20) + cloro(150, 138, 0) + cloro(194, 82, 90) + cloro(140, 22, 0) + mito(92, 138, 0, 0.8)],
  ['bio-cel-procarionte', 'Célula procarionte (bactéria)', 230, 110,
    '<rect x="30" y="12" width="150" height="76" rx="38" stroke-width="1.4" stroke-dasharray="4 3"/>'
    + '<rect x="36" y="18" width="138" height="64" rx="32"/><rect x="41" y="23" width="128" height="54" rx="27" stroke-width="1.4"/>'
    + fino('M78,48 C84,34 100,36 104,48 S124,62 130,46 S112,30 104,42 S84,66 78,48', 1.8)
    + '<circle cx="150" cy="62" r="6" stroke-width="1.4"/>'
    + dot(60, 40, 2.2) + dot(62, 62, 2.2) + dot(140, 36, 2.2) + dot(118, 66, 2.2) + dot(90, 66, 2.2) + dot(124, 32, 2.2)
    + '<path d="M180,50 q7,-10 14,0 t14,0 t14,0" stroke-width="2"/>'
    + fino('M70,18 L66,6 M110,18 V5 M150,18 L154,6 M70,82 L66,94 M110,82 V95 M150,82 L154,94', 1.4)],
  ['bio-nucleo', 'Núcleo celular', 130, 130,
    '<circle cx="65" cy="65" r="56"/><circle cx="65" cy="65" r="50" stroke-width="1.4"/>'
    + `<path d="${serie(10, i => { const [a, b] = pt(65, 65, 47, i * 36 + 10), [c, d] = pt(65, 65, 59, i * 36 + 10); return `M${a},${b} L${c},${d} `; })}" stroke-width="3.5"/>`
    + dot(74, 56, 12) + fino('M30,76 q6,-8 12,0 t12,0 M44,96 q5,6 10,0 t10,0 M84,90 q6,-6 12,0 M38,50 q4,-6 8,0', 1.4)],
  ['bio-mitocondria', 'Mitocôndria', 180, 90,
    '<ellipse cx="90" cy="45" rx="84" ry="38"/>'
    + `<path d="${(() => { let d = ''; for (let i = 0; i < 7; i++) { const x = 30 + 20 * i, t = Math.sqrt(1 - ((x - 90) / 76) ** 2) * 31, de = i % 2 === 0; const y0 = de ? 45 - t : 45 + t, y1 = de ? 54 : 36; d += `M${x - 4},${f(y0)} V${y1} Q${x},${de ? y1 + 6 : y1 - 6} ${x + 4},${y1} V${f(y0)} `; } return d; })()}" stroke-width="1.6"/>`
    + '<ellipse cx="90" cy="45" rx="76" ry="31" stroke-width="1.6"/>' + dot(42, 40, 1.8) + dot(82, 54, 1.8) + dot(118, 38, 1.8)],
  ['bio-cloroplasto', 'Cloroplasto', 180, 90,
    '<ellipse cx="90" cy="45" rx="84" ry="38"/><ellipse cx="90" cy="45" rx="78" ry="32" stroke-width="1.4"/>'
    + serie(4, i => { const x = 42 + 32 * i, y0 = i % 2 ? 36 : 30; return serie(4, k => `<rect x="${x - 9}" y="${y0 + 7 * k}" width="18" height="5" rx="2" stroke-width="1.4"/>`); })
    + fino('M51,40 H65 M83,47 H97 M115,40 H129 M30,50 H24 M151,52 H160', 1.2)],
  ['bio-golgi', 'Complexo golgiense', 140, 110,
    serie(5, i => { const y = 24 + 14 * i; return `<path d="M20,${y} Q70,${y - 14} 120,${y} Q123,${y + 6} 116,${y + 7} Q70,${y - 6} 24,${y + 7} Q17,${y + 6} 20,${y} Z" stroke-width="1.8"/>`; })
    + '<circle cx="128" cy="26" r="5" stroke-width="1.6"/><circle cx="132" cy="58" r="5" stroke-width="1.6"/><circle cx="126" cy="96" r="6" stroke-width="1.6"/><circle cx="12" cy="98" r="5" stroke-width="1.6"/>'],
  ['bio-re-rugoso', 'Retículo endoplasmático rugoso', 150, 110,
    serie(3, i => { const y = 24 + 30 * i; return `<path d="${onda(10, 140, y, 6, i)}"/><path d="${onda(10, 140, y + 12, 6, i)}"/>`
      + `<path d="M10,${f(y + 6 * Math.sin(i))} V${f(y + 12 + 6 * Math.sin(i))} M140,${f(y + 6 * Math.sin(i))} V${f(y + 12 + 6 * Math.sin(i))}"/>`
      + serie(11, k => { const x = 16 + 12 * k, yy = y + 6 * Math.sin((x - 10) / 130 * 2 * Math.PI + i); return dot(x, f(yy - 5), 2.2) + dot(x + 6, f(y + 12 + 6 * Math.sin((x + 6 - 10) / 130 * 2 * Math.PI + i) + 5), 2.2); }); })],
  ['bio-re-liso', 'Retículo endoplasmático liso', 150, 100,
    serie(3, i => { const y = 20 + 28 * i, A = 7, fs = 0.8 + i; return `<path d="${onda(10, 140, y, A, fs)}"/><path d="${onda(10, 140, y + 11, A, fs)}"/>`
      + `<path d="M10,${f(y + A * Math.sin(fs))} V${f(y + 11 + A * Math.sin(fs))} M140,${f(y + A * Math.sin(fs))} V${f(y + 11 + A * Math.sin(fs))}"/>`; })],
  ['bio-ribossomo', 'Ribossomo', 100, 90,
    '<ellipse cx="50" cy="60" rx="32" ry="22"/><ellipse cx="50" cy="24" rx="24" ry="12"/>'
    + '<path d="M4,37 q4,-4 8,0 t8,0 t8,0 t8,0 t8,0 t8,0 t8,0 t8,0 t8,0 t8,0 t8,0 t8,0" stroke-width="1.6"/>'],
  ['bio-lisossomo', 'Lisossomo (vesícula)', 80, 80,
    '<circle cx="40" cy="40" r="32"/><circle cx="40" cy="40" r="28" stroke-width="1.2"/>'
    + dot(30, 30) + dot(48, 28) + dot(54, 44) + dot(38, 52) + dot(26, 46) + dot(42, 38)
    + fino('M30,36 l4,3 M50,34 l3,4 M46,52 l-4,3', 1.4)],
  ['bio-centriolo', 'Centríolos', 130, 100,
    '<rect x="10" y="38" width="64" height="26" rx="3"/>' + fino('M14,44 H70 M14,51 H70 M14,58 H70', 1.2)
    + serie(9, i => { let s = ''; for (let k = 0; k < 3; k++) { const [x, y] = pt(98, 51, 18 + k * 0, i * 40); const [x2, y2] = pt(x, y, 4.6 * (k - 1), i * 40 + 90 + 20); s += `<circle cx="${x2}" cy="${y2}" r="2.3" stroke-width="1.3"/>`; } return s; })
    + '<circle cx="98" cy="51" r="28" stroke-width="1.4"/>'],
];

// ===== Membrana e transporte =====
const MEMBRANA = [
  ['bio-fosfolipidio', 'Fosfolipídio', 70, 130,
    '<circle cx="35" cy="24" r="16"/>' + L('P', 35, 24, 16) + '<path d="M29,40 V122 M41,40 V74 L47,84 V122" stroke-width="2.2"/>'],
  ['bio-bicamada', 'Bicamada fosfolipídica', 230, 100,
    serie(17, i => lip(12 + 13 * i, 14, 1, 30) + lip(12 + 13 * i, 86, -1, 30))],
  ['bio-mosaico', 'Membrana (mosaico fluido)', 240, 140,
    serie(19, i => { const x = 12 + 12 * i; return (x > 70 && x < 116) || (x > 146 && x < 202) ? '' : lip(x, 46, 1, 22) + lip(x, 98, -1, 22); })
    + '<rect x="76" y="30" width="36" height="84" rx="14"/>'
    + '<rect x="150" y="34" width="18" height="76" rx="8"/><rect x="180" y="34" width="18" height="76" rx="8"/>'
    + fino('M94,30 V18 M94,22 L84,12 M94,22 L104,12', 1.6) + '<circle cx="94" cy="16" r="3" stroke-width="1.4"/><circle cx="82" cy="10" r="3" stroke-width="1.4"/><circle cx="106" cy="10" r="3" stroke-width="1.4"/>'
    + '<path d="M206,108 Q216,102 228,108 Q232,118 222,122 H210 Q202,118 206,108 Z" stroke-width="1.8"/>' + fino('M174,40 V104', 1.2)],
  ['bio-difusao', 'Difusão simples', 190, 120,
    '<path d="M92,22 V108 M100,22 V108" stroke-dasharray="10 6"/>'
    + [[20, 34], [40, 30], [62, 36], [28, 52], [52, 50], [74, 56], [18, 72], [44, 70], [66, 80], [30, 90], [56, 94], [78, 98]].map(([x, y]) => dot(x, y, 3.5)).join('')
    + [[126, 44], [160, 70], [138, 92]].map(([x, y]) => dot(x, y, 3.5)).join('')
    + seta(60, 112, 140, 112, 2) + L('mais', 46, 10) + L('menos', 146, 10)],
  ['bio-osmose', 'Osmose (tubo em U)', 170, 175,
    '<path d="M30,10 V120 Q30,150 85,150 Q140,150 140,120 V10 M50,10 V118 Q50,130 85,130 Q120,130 120,118 V10"/>'
    + '<path d="M85,128 V152" stroke-width="2.5" stroke-dasharray="3 3"/>'
    + '<path d="M32,62 H48 M122,40 H138" stroke-width="1.5" stroke-dasharray="4 3"/>'
    + dot(126, 60, 2.6) + dot(134, 76, 2.6) + dot(127, 96, 2.6) + dot(133, 112, 2.6) + dot(110, 138, 2.6) + dot(126, 128, 2.6)
    + seta(58, 166, 112, 166) + L('H₂O', 30, 166)],
  ['bio-bomba-na-k', 'Bomba de sódio e potássio', 200, 150,
    '<path d="M6,55 H80 M120,55 H194 M6,95 H80 M120,95 H194"/>' + fino('M6,75 H80 M120,75 H194', 1) + '<rect x="80" y="40" width="40" height="70" rx="10"/>'
    + seta(93, 118, 93, 18) + seta(107, 22, 107, 132) + L('3 Na⁺', 56, 20, 15) + L('2 K⁺', 146, 132, 15)
    + L('ATP', 34, 128, 14) + seta(52, 124, 78, 108, 1.6, 8) + L('fora', 166, 24) + L('dentro', 160, 112)],
  ['bio-endocitose', 'Endocitose (fagocitose)', 220, 110,
    '<path d="M6,40 H64"/><circle cx="34" cy="22" r="10" stroke-width="1.8"/>'
    + '<path d="M78,40 H92 Q96,40 96,52 Q96,82 114,82 Q132,82 132,52 Q132,40 136,40 H150"/><circle cx="114" cy="58" r="10" stroke-width="1.8"/>'
    + '<path d="M164,40 H216"/><circle cx="190" cy="76" r="17"/><circle cx="190" cy="76" r="10" stroke-width="1.8"/>'
    + seta(58, 96, 82, 96, 1.8, 9) + seta(138, 96, 162, 96, 1.8, 9) + L('fora', 114, 16) + L('dentro', 34, 66)],
  ['bio-exocitose', 'Exocitose', 220, 110,
    '<path d="M6,40 H64"/><circle cx="34" cy="72" r="16"/>' + dot(28, 68) + dot(38, 66) + dot(34, 78)
    + '<path d="M78,40 H96 Q100,40 100,50 Q100,74 114,74 Q128,74 128,50 Q128,40 132,40 H150"/>' + dot(110, 56) + dot(118, 30) + dot(108, 20)
    + '<path d="M164,40 H216"/>' + dot(178, 26) + dot(192, 14) + dot(204, 28)
    + seta(52, 98, 82, 98, 1.8, 9) + seta(136, 98, 166, 98, 1.8, 9)],
  ['bio-tonicidade', 'Hemácia: meio hipo, iso e hipertônico', 270, 110,
    '<circle cx="45" cy="44" r="30"/>' + hemF(135, 44, 26)
    + `<path d="${(() => { let d = ''; const n = 14; for (let i = 0; i <= n; i++) { const [x, y] = pt(225, 44, 21, i * 360 / n); d += i ? ` A6,6 0 0 1 ${x},${y}` : `M${x},${y}`; } return d; })()} Z"/>`
    + L('hipotônico', 45, 96) + L('isotônico', 135, 96) + L('hipertônico', 225, 96)
    + seta(20, 10, 34, 18, 1.4, 7) + seta(70, 10, 56, 18, 1.4, 7) + seta(214, 8, 214, 18, 1.4, 7) + seta(236, 18, 236, 8, 1.4, 7)],
];

// ===== DNA, RNA e proteínas =====
const helice = (() => {
  const xa = y => 55 + 38 * Math.sin((y - 10) / 110 * 2 * Math.PI), xb = y => 55 - 38 * Math.sin((y - 10) / 110 * 2 * Math.PI);
  // a curva é x(y): amostra em y
  const strand = fx => { let d = ''; for (let y = 10; y <= 230; y += 3) d += (d ? ' L' : 'M') + f(fx(y)) + ',' + y; return `<path d="${d}"/>`; };
  let s = strand(xa) + strand(xb);
  for (let y = 16; y < 228; y += 11) s += fino(`M${f(xa(y))},${y} L${f(xb(y))},${y}`, 1.4);
  return s;
})();
const PARES = [['A', 'T'], ['C', 'G'], ['G', 'C'], ['T', 'A'], ['A', 'T'], ['G', 'C']];
const replicacao = (() => {
  const off = (x1, y1, x2, y2, d, t0, t1) => { const dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy), nx = -dy / n * d, ny = dx / n * d; return [f(x1 + dx * t0 + nx), f(y1 + dy * t0 + ny), f(x1 + dx * t1 + nx), f(y1 + dy * t1 + ny)]; };
  let s = '<path d="M6,62 H100 L232,16 M6,80 H100 L232,126"/>' + fino(serie(9, i => `M${12 + 10 * i},62 V80 `), 1.4);
  const [a, b, c, d] = off(100, 62, 232, 16, 12, 0.12, 0.95); s += `<path d="M${c},${d} L${a},${b}" stroke-width="2" stroke-dasharray="7 4"/>` + head(a, b, f(Math.atan2(b - d, a - c) * 180 / Math.PI), 9);
  for (const [t0, t1] of [[0.1, 0.34], [0.42, 0.66], [0.74, 0.96]]) { const [p, q, r, u] = off(100, 80, 232, 126, -12, t0, t1); s += `<path d="M${p},${q} L${r},${u}" stroke-width="2" stroke-dasharray="7 4"/>` + head(r, u, f(Math.atan2(u - q, r - p) * 180 / Math.PI), 8); }
  return s + '<circle cx="104" cy="71" r="8" fill="#C" stroke="none"/>';
})();
const DNA = [
  ['bio-dupla-helice', 'DNA (dupla hélice)', 110, 240, helice],
  ['bio-dna-fita', 'DNA planificado (pares de bases)', 240, 130,
    L('5′', 14, 16) + L('3′', 14, 114) + L('3′', 228, 16) + L('5′', 228, 114) + '<path d="M28,16 H214 M28,114 H214"/>'
    + PARES.map(([a, b], i) => { const x = 46 + 32 * i; return `<path d="M${x},16 V26 M${x},104 V114"/><rect x="${x - 13}" y="26" width="26" height="32" rx="3"/>` + L(a, x, 42, 16)
      + `<rect x="${x - 13}" y="72" width="26" height="32" rx="3"/>` + L(b, x, 88, 16) + fino(`M${x - 5},60 V70 M${x + 5},60 V70`, 1.2); }).join('')],
  ['bio-nucleotideo', 'Nucleotídeo', 194, 100,
    '<circle cx="30" cy="42" r="18"/>' + L('P', 30, 42, 16) + '<path d="M48,42 H62"/>'
    + `<path d="M${pt(85, 46, 24, -90).join(',')} L${pt(85, 46, 24, -18).join(',')} L${pt(85, 46, 24, 54).join(',')} L${pt(85, 46, 24, 126).join(',')} L${pt(85, 46, 24, 198).join(',')} Z"/>`
    + `<path d="M${pt(85, 46, 24, -18).join(',')} L132,34"/>` + '<rect x="132" y="18" width="50" height="34" rx="4"/>' + L('base', 157, 35)
    + L('fosfato', 30, 86) + L('pentose', 85, 86) + L('nitrogenada', 150, 68)],
  ['bio-replicacao', 'Replicação do DNA (forquilha)', 240, 140, replicacao],
  ['bio-transcricao', 'Transcrição (DNA → RNAm)', 240, 120,
    '<path d="M6,48 H86 C96,48 100,24 112,24 H178 C190,24 194,48 204,48 H234 M6,72 H86 C96,72 100,92 112,92 H178 C190,92 194,72 204,72 H234"/>'
    + fino(serie(8, i => `M${12 + 10 * i},48 V72 `) + 'M212,48 V72 M222,48 V72 M232,48 V72', 1.4)
    + '<ellipse cx="150" cy="58" rx="58" ry="44" stroke-width="1.6" stroke-dasharray="5 4"/>'
    + '<path d="M176,82 H124 C108,82 100,100 80,108 H40" stroke-width="2.2" stroke-dasharray="7 3"/>' + L('RNAm', 24, 92)
    + seta(176, 8, 222, 8, 1.8, 9)],
  ['bio-traducao', 'Tradução (ribossomo)', 240, 170,
    '<ellipse cx="120" cy="98" rx="74" ry="32"/><ellipse cx="120" cy="146" rx="60" ry="14"/>'
    + '<path d="M6,131 H234" stroke-width="2.2"/>' + fino(serie(10, i => `M${12 + 24 * i},127 V135 `), 1.4) + L('RNAm', 24, 152)
    + serie(2, i => { const x = 104 + 34 * i; return `<path d="M${x - 12},128 V116 H${x + 12} V128 M${x},116 V84" stroke-width="2"/>`; })
    + dot(104, 78, 6) + '<circle cx="138" cy="78" r="6" fill="#C" stroke="none"/>'
    + '<path d="M138,72 L128,52 L140,36 L126,20 L110,12" stroke-width="1.6"/>' + [[128, 52], [140, 36], [126, 20], [110, 12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6"/>`).join('')
    + seta(204, 116, 228, 116, 1.6, 8)],
  ['bio-trna', 'RNA transportador (RNAt)', 120, 165,
    '<path d="M54,22 V60 M66,22 V60 M54,82 V110 M66,82 V110 M54,60 H42 M54,82 H42 M66,60 H78 M66,82 H78"/>'
    + '<circle cx="30" cy="71" r="14"/><circle cx="90" cy="71" r="14"/><circle cx="60" cy="124" r="14"/>'
    + fino('M54,30 H66 M54,40 H66 M54,50 H66 M54,92 H66 M54,102 H66 M48,60 V82 M72,60 V82', 1.2)
    + '<path d="M66,22 V12 Q66,6 72,6 H78"/>' + '<circle cx="86" cy="8" r="6" fill="#C" stroke="none"/>'
    + L('UAC', 60, 154, 15)],
  ['bio-dogma', 'Dogma central (DNA → RNA → proteína)', 200, 190,
    caixa(10, 8, 80, 34, 'DNA', 16) + caixa(10, 78, 80, 34, 'RNA', 16) + caixa(10, 148, 80, 34, 'proteína', 15)
    + seta(50, 42, 50, 76) + seta(50, 112, 50, 146) + L('transcrição', 140, 60) + L('tradução', 130, 130)
    + '<path d="M90,14 C118,8 122,40 98,36" stroke-width="1.8"/>' + head(91, 36, 180, 8) + L('replicação', 154, 25)],
  ['bio-gene', 'Gene (éxons e íntrons)', 240, 70,
    '<rect x="8" y="26" width="18" height="18" fill="#C"/><rect x="30" y="26" width="40" height="18"/><path d="M70,35 H120 M156,35 H180" stroke-width="1.6"/>'
    + '<rect x="120" y="26" width="36" height="18"/><rect x="180" y="26" width="52" height="18"/>'
    + '<path d="M26,26 V12 H44"/>' + head(52, 12, 0, 8) + L('éxon', 50, 58) + L('íntron', 95, 58) + L('éxon', 138, 58) + L('éxon', 206, 58)],
  ['bio-polipeptidio', 'Cadeia polipeptídica', 230, 80,
    serie(8, i => { const x1 = 18 + 24 * i, y1 = i % 2 ? 50 : 30, x2 = x1 + 24, y2 = i % 2 ? 30 : 50, a = Math.atan2(y2 - y1, 24), c = 10 * Math.cos(a), d = 10 * Math.sin(a); return fino(`M${f(x1 + c)},${f(y1 + d)} L${f(x2 - c)},${f(y2 - d)}`, 2); })
    + serie(9, i => `<circle cx="${18 + 24 * i}" cy="${i % 2 ? 50 : 30}" r="10"/>`) + L('N', 18, 66) + L('C', 210, 66)],
];

// ===== Divisão celular =====
const fuso = (xa, xb, ys) => fino(ys.map(y => `M${xa},55 L65,${y} M${xb},55 L65,${y} `).join(''), 1.1);
const DIVISAO = [
  ['bio-ciclo-celular', 'Ciclo celular (G1, S, G2, M)', 190, 190,
    '<circle cx="95" cy="95" r="78"/><circle cx="95" cy="95" r="46"/>'
    + [0, 144, 252, 324].map(a => { const t = (a - 90); const [x1, y1] = pt(95, 95, 46, t), [x2, y2] = pt(95, 95, 78, t); return `<path d="M${x1},${y1} L${x2},${y2}"/>`; }).join('')
    + [['G₁', 72], ['S', 198], ['G₂', 288], ['M', 342]].map(([s, a]) => { const [x, y] = pt(95, 95, 62, a - 90); return L(s, x, y, 18); }).join('')
    + L('interfase', 95, 95)
    + `<path d="M${pt(95, 95, 87, -80).join(',')} A87,87 0 0 1 ${pt(95, 95, 87, -28).join(',')}" stroke-width="1.8"/>` + head(...pt(95, 95, 87, -22).map(Number), 62, 9)],
  ['bio-interfase', 'Interfase', 130, 110,
    celD + '<circle cx="60" cy="58" r="24"/>' + dot(66, 52, 5) + fino('M44,62 q5,-6 10,0 t10,0 M52,72 q4,5 8,0 t8,0', 1.3)
    + '<rect x="96" y="22" width="9" height="4" rx="2" stroke-width="1.3"/><rect x="108" y="18" width="4" height="9" rx="2" stroke-width="1.3"/>'],
  ['bio-profase', 'Prófase', 130, 110,
    celD + '<circle cx="65" cy="55" r="27" stroke-width="1.6" stroke-dasharray="6 5"/>'
    + xcrom(52, 46, 9) + xcrom(76, 44, 8, false) + xcrom(56, 68, 7, true, 30) + xcrom(78, 66, 9, false, -20)
    + aster(24, 34) + aster(106, 76)],
  ['bio-metafase', 'Metáfase', 130, 110,
    celD + fuso(18, 112, [24, 42, 68, 86]) + aster(18, 55) + aster(112, 55)
    + xcrom(65, 24, 8, true, 90) + xcrom(65, 42, 8, false, 90) + xcrom(65, 68, 7, true, 90) + xcrom(65, 86, 7, false, 90)],
  ['bio-anafase', 'Anáfase', 130, 110,
    celD + fino('M14,55 L44,26 M14,55 L44,44 M14,55 L44,66 M14,55 L44,84 M116,55 L86,26 M116,55 L86,44 M116,55 L86,66 M116,55 L86,84', 1.1)
    + aster(14, 55) + aster(116, 55)
    + vcrom(40, 26, 1) + vcrom(40, 44, 1, false) + vcrom(40, 66, 1) + vcrom(40, 84, 1, false)
    + vcrom(90, 26, -1) + vcrom(90, 44, -1, false) + vcrom(90, 66, -1) + vcrom(90, 84, -1, false)],
  ['bio-telofase', 'Telófase e citocinese', 130, 110,
    '<path d="M65,22 C42,6 6,22 6,55 C6,88 42,104 65,88 C88,104 124,88 124,55 C124,22 88,6 65,22 Z"/>'
    + '<circle cx="36" cy="55" r="17"/><circle cx="94" cy="55" r="17"/>' + fino('M26,52 q5,-6 10,0 t10,0 M30,62 q4,4 8,0 M84,52 q5,-6 10,0 t10,0 M88,62 q4,4 8,0', 1.3)],
  ['bio-mitose-esquema', 'Mitose (esquema 2n → 2n)', 220, 110,
    '<circle cx="40" cy="50" r="34"/>' + xcrom(30, 50, 14) + xcrom(52, 50, 9, false) + L('2n', 40, 100)
    + seta(82, 55, 120, 55) + '<circle cx="158" cy="30" r="24"/><circle cx="158" cy="82" r="24"/>'
    + icrom(150, 30, 12) + icrom(166, 30, 8, false) + icrom(150, 82, 12) + icrom(166, 82, 8, false) + L('2n', 202, 30) + L('2n', 202, 82)],
  ['bio-meiose-esquema', 'Meiose (esquema 2n → n)', 240, 160,
    '<circle cx="30" cy="80" r="25"/>' + xcrom(22, 80, 12) + xcrom(38, 80, 12, false)
    + '<circle cx="112" cy="44" r="20"/><circle cx="112" cy="116" r="20"/>' + xcrom(112, 44, 10) + xcrom(112, 116, 10, false)
    + serie(4, i => `<circle cx="204" cy="${20 + 40 * i}" r="16"/>` + icrom(204, 20 + 40 * i, 9, i < 2))
    + seta(52, 70, 90, 50, 1.8, 9) + seta(52, 90, 90, 110, 1.8, 9)
    + seta(132, 40, 186, 22, 1.8, 9) + seta(132, 50, 186, 58, 1.8, 9) + seta(132, 110, 186, 102, 1.8, 9) + seta(132, 120, 186, 138, 1.8, 9)
    + L('Meiose I', 66, 10) + L('Meiose II', 150, 150) + L('2n', 30, 122)],
  ['bio-crossing', 'Permutação (crossing-over)', 170, 130,
    (() => {
      const cr = (x, partes) => partes.map(([y0, y1, ch]) => `<rect x="${x - 4}" y="${y0}" width="8" height="${y1 - y0}" rx="${y0 === 12 || y1 === 118 ? 4 : 0}"${ch ? ' fill="#C"' : ''} stroke-width="1.6"/>`).join('');
      return cr(20, [[12, 118, 1]]) + cr(31, [[12, 118, 1]]) + cr(47, [[12, 118, 0]]) + cr(58, [[12, 118, 0]])
        + fino('M24,65 H27 M51,65 H54', 3) + fino('M35,30 L43,50 M43,30 L35,50', 2)
        + seta(70, 65, 98, 65)
        + cr(110, [[12, 118, 1]]) + cr(121, [[12, 40, 0], [40, 118, 1]]) + cr(137, [[12, 40, 1], [40, 118, 0]]) + cr(148, [[12, 118, 0]])
        + fino('M114,65 H117 M141,65 H144', 3);
    })()],
];

// ===== Genética =====
const chromatide = cx => `<path d="M${cx - 7},14 Q${cx - 7},6 ${cx},6 Q${cx + 7},6 ${cx + 7},14 L${cx + 6},68 Q${cx + 3},75 ${cx + 6},82 L${cx + 7},136 Q${cx + 7},144 ${cx},144 Q${cx - 7},144 ${cx - 7},136 L${cx - 6},82 Q${cx - 3},75 ${cx - 6},68 Z"/>`;
const punnett = (x0, n, c, cab, cel) => {
  let s = `<rect x="${x0 + 40}" y="${x0 + 40}" width="${n * c}" height="${n * c}"/>`;
  for (let i = 1; i < n; i++) s += `<path d="M${x0 + 40 + i * c},${x0 + 40} V${x0 + 40 + n * c} M${x0 + 40},${x0 + 40 + i * c} H${x0 + 40 + n * c}"/>`;
  s += fino(`M${x0 + 40},${x0 + 4} V${x0 + 40} H${x0 + 4}`, 1.4);
  cab.forEach((g, i) => { s += L(g, x0 + 40 + c * i + c / 2, x0 + 22, n > 2 ? 15 : 20) + L(g, x0 + 20, x0 + 40 + c * i + c / 2, n > 2 ? 15 : 20); });
  if (cel) cel.forEach((g, k) => { s += L(g, x0 + 40 + c * (k % n) + c / 2, x0 + 40 + c * Math.floor(k / n) + c / 2, 22); });
  return s;
};
const cariotipo = (() => {
  const par = (cx, base, h) => { const g = x => `<rect x="${x - 4}" y="${base - h}" width="8" height="${h}" rx="4" stroke-width="1.6"/>` + fino(`M${x - 4},${f(base - h * 0.62)} H${x + 4}`, 2.2); return g(cx - 6) + g(cx + 6); };
  let s = '';
  [44, 40, 36, 32, 28, 26].forEach((h, i) => { const cx = 22 + 39 * i; s += par(cx, 50, h) + L(String(i + 1), cx, 62); });
  [24, 22, 20, 18, 16].forEach((h, i) => { const cx = 22 + 39 * i; s += par(cx, 110, h) + L(String(i + 7), cx, 122); });
  s += `<rect x="212" y="78" width="8" height="32" rx="4" stroke-width="1.6"/><rect x="224" y="96" width="8" height="14" rx="4" stroke-width="1.6"/>` + fino('M212,90 H220 M224,100 H232', 2.2) + L('XY', 222, 122);
  return s;
})();
const GENETICA = [
  ['bio-cromossomo', 'Cromossomo duplicado', 80, 150,
    chromatide(33) + chromatide(47) + '<ellipse cx="40" cy="75" rx="7" ry="5" fill="#C"/>' + fino('M27,30 H39 M27,44 H39 M27,104 H39 M27,118 H39 M41,30 H53 M41,44 H53 M41,104 H53 M41,118 H53', 1.4)],
  ['bio-homologos', 'Par de homólogos (alelos)', 130, 150,
    [34, 44, 86, 96].map(x => `<rect x="${x - 5}" y="10" width="10" height="130" rx="5"/><rect x="${x - 5}" y="36" width="10" height="8" fill="#C" stroke="none"/><rect x="${x - 5}" y="104" width="10" height="8" fill="#C" stroke="none"/>`).join('')
    + dot(39, 70, 4.5) + dot(91, 70, 4.5) + L('A', 14, 40, 18) + L('a', 116, 40, 18) + L('B', 14, 108, 18) + L('b', 116, 108, 18)],
  ['bio-cariotipo', 'Cariótipo (esquema)', 240, 137, "<g transform=\"translate(0.00 0.00)\">" + (cariotipo) + "</g>"],
  ['bio-xy', 'Cromossomos X e Y', 120, 157, "<g transform=\"translate(0.00 0.00)\">" + (pilula(36, 70, 52, -18, false, 12) + pilula(44, 70, 52, 18, false, 12)
    + `<rect x="78" y="58" width="12" height="62" rx="6"/>` + pilula(78, 44, 20, -28, false, 12) + pilula(90, 44, 20, 28, false, 12)
    + L('X', 40, 140, 18) + L('Y', 84, 140, 18)) + "</g>"],
  ['bio-punnett', 'Quadro de Punnett (Aa × Aa)', 180, 180, punnett(6, 2, 64, ['A', 'a'], ['AA', 'Aa', 'Aa', 'aa'])],
  ['bio-punnett-vazio', 'Quadro de Punnett 2 × 2 (vazio)', 180, 180, punnett(6, 2, 64, ['', ''])],
  ['bio-punnett-4', 'Quadro de Punnett 4 × 4 (di-hibridismo)', 240, 240, punnett(4, 4, 48, ['AB', 'Ab', 'aB', 'ab'])],
  ['bio-h-homem', 'Heredograma: homem', 50, 50, hq(25, 25, 20)],
  ['bio-h-homem-af', 'Heredograma: homem afetado', 50, 50, hq(25, 25, 20, true)],
  ['bio-h-mulher', 'Heredograma: mulher', 50, 50, hc(25, 25, 20)],
  ['bio-h-mulher-af', 'Heredograma: mulher afetada', 50, 50, hc(25, 25, 20, true)],
  ['bio-h-portadora', 'Heredograma: portadora (heterozigota)', 50, 50, hc(25, 25, 20) + dot(25, 25, 6)],
  ['bio-hered-casal', 'Heredograma: casal e filhos', 172, 130,
    hq(34, 30, 20) + hc(146, 30, 20) + '<path d="M54,30 H126 M90,30 V76 M40,76 H140 M40,76 V94 M90,76 V94 M140,76 V94"/>'
    + hq(40, 109, 15) + hc(90, 109, 15) + hq(140, 109, 15, true)],
  ['bio-heredograma', 'Heredograma (3 gerações)', 230, 170,
    L('I', 10, 27, 16) + L('II', 10, 85, 16) + L('III', 12, 145, 16)
    + hq(85, 27, 15) + hc(145, 27, 15) + '<path d="M100,27 H130 M115,27 V56 M90,56 H205 M90,56 V70 M150,56 V70 M205,56 V70"/>'
    + hq(41, 85, 15) + hc(90, 85, 15) + dot(90, 85, 5) + hq(150, 85, 15, true) + hc(205, 85, 15)
    + '<path d="M56,85 H75 M66,85 V116 M40,116 H95 M40,116 V130 M95,116 V130"/>'
    + hq(40, 145, 15, true) + hc(95, 145, 15)],
];

// ===== Anatomia e fisiologia humanas =====
const rim = (() => {
  let s = '<path d="M70,10 C30,8 10,40 12,80 C14,124 40,152 74,150 C96,148 104,130 94,112 C88,100 88,62 94,50 C104,30 98,12 70,10 Z"/>'
    + '<path d="M68,20 C38,20 22,46 23,80 C24,118 44,140 72,139" stroke-width="1.3" stroke-dasharray="4 3"/>';
  for (const a of [-55, -20, 20, 55]) {
    const b = 180 + a, [bx, by] = pt(84, 80, 50, b), [ax, ay] = pt(84, 80, 20, b), [p1x, p1y] = pt(bx, by, 10, b + 90), [p2x, p2y] = pt(bx, by, 10, b - 90);
    s += `<path d="M${p1x},${p1y} L${ax},${ay} L${p2x},${p2y}" stroke-width="1.6"/>`;
  }
  return s + '<path d="M70,62 Q86,66 96,80 Q86,94 70,98" stroke-width="1.8"/><path d="M96,84 Q110,104 112,154 M98,92 Q104,110 104,154" stroke-width="2"/>'
    + '<path d="M96,70 H124 M96,62 Q110,56 124,56" stroke-width="2"/>';
})();
const ANATOMIA = [
  ['bio-coracao', 'Coração (quatro cavidades)', 200, 200,
    '<path d="M100,40 C80,10 30,14 24,60 C20,100 60,150 100,190 C140,150 180,100 176,60 C170,14 120,10 100,40 Z"/>'
    + '<path d="M100,40 V180 M26,88 H82 M118,88 H174"/>' + fino('M82,88 L90,98 M118,88 L110,98', 2)
    + L('AD', 62, 62, 18) + L('AE', 138, 62, 18) + L('VD', 66, 120, 18) + L('VE', 134, 120, 18)],
  ['bio-circulacao', 'Circulação dupla (esquema)', 200, 230,
    caixa(60, 8, 80, 36, 'pulmões') + caixa(50, 194, 100, 32, 'corpo')
    + '<rect x="70" y="95" width="60" height="60"/><path d="M100,95 V155 M70,125 H130" stroke-width="1.6"/>'
    + L('AD', 85, 110) + L('AE', 115, 110) + L('VD', 85, 140) + L('VE', 115, 140)
    + '<path d="M70,140 H36 V26 H52" stroke-dasharray="7 4"/>' + head(60, 26, 0, 10)
    + '<path d="M140,26 H164 V110 H138"/>' + head(130, 110, 180, 10)
    + '<path d="M130,140 H180 V210 H158"/>' + head(150, 210, 180, 10)
    + '<path d="M50,210 H20 V110 H62" stroke-dasharray="7 4"/>' + head(70, 110, 0, 10)],
  ['bio-respiratorio', 'Sistema respiratório', 200, 210,
    '<path d="M94,6 V62 L80,80 M106,6 V62 L120,80"/>' + fino('M94,16 H106 M94,26 H106 M94,36 H106 M94,46 H106', 1.4)
    + '<path d="M86,58 C62,36 18,90 16,160 C14,196 56,204 86,186 Z M114,58 C138,36 182,90 184,160 C186,196 144,204 114,186 Z"/>'
    + fino('M80,80 L62,104 L44,130 M62,104 L68,140 M62,104 L36,104 M44,130 L34,160 M44,130 L56,166 M120,80 L138,104 L156,130 M138,104 L132,140 M138,104 L164,104 M156,130 L166,160 M156,130 L144,166', 1.6)],
  ['bio-alveolo', 'Alvéolo e capilar (trocas gasosas)', 150, 140,
    '<path d="M68,28.7 A44,44 0 1 1 52,28.7 M52,28.7 V4 M68,28.7 V4"/>'
    + '<path d="M116,6 V134 M140,6 V134"/>' + '<ellipse cx="128" cy="26" rx="6" ry="9" stroke-width="1.6"/><ellipse cx="128" cy="116" rx="6" ry="9" stroke-width="1.6"/>'
    + seta(84, 56, 134, 56, 1.8, 9) + seta(134, 90, 84, 90, 1.8, 9) + L('O₂', 64, 56) + L('CO₂', 62, 90)],
  ['bio-digestorio', 'Sistema digestório (esquema)', 170, 252,
    '<path d="M70,12 Q85,22 100,12 M82,18 V82 M90,18 V76"/>'
    + '<path d="M82,82 C80,110 96,134 118,130 C140,126 146,96 132,80 C122,68 100,70 90,76"/>'
    + '<path d="M20,80 C30,64 70,62 78,74 C76,96 50,110 24,104 C14,100 14,88 20,80 Z"/>'
    + '<path d="M38,214 V150 Q38,136 52,136 H128 Q142,136 142,150 V206 Q142,228 116,228 Q102,228 102,236 V248 M50,214 V152 Q50,148 54,148 H126 Q130,148 130,152 V206 Q130,216 116,216 Q90,216 90,232 V248 M38,214 Q38,222 44,222 Q50,222 50,214"/>'
    + fino('M108,130 V158 H66 Q60,158 60,164 Q60,170 66,170 H114 Q120,170 120,176 Q120,182 114,182 H66 Q60,182 60,188 Q60,194 66,194 H114 Q120,194 120,200 Q120,206 114,206 H50', 2)],
  ['bio-nefron', 'Néfron (esquema)', 210, 210,
    '<path d="M60,24 A28,28 0 1 0 60,56"/>' + fino('M30,36 q6,-8 10,0 q4,8 10,0 M30,46 q6,-8 10,0 q4,8 10,0', 1.6)
    + fino('M4,34 H30 M4,48 H30', 2)
    + '<path d="M60,24 Q70,14 80,24 T100,24 T112,40 V176 Q120,190 128,176 V80 Q128,66 140,66 Q148,56 156,66 T172,66 H186"/>'
    + '<path d="M190,8 V194"/>' + head(190, 204, 90, 10) + L('urina', 160, 198)],
  ['bio-rim', 'Rim (corte)', 130, 160, rim],
  ['bio-neuronio', 'Neurônio', 250, 110,
    '<path d="M36,42 L48,36 L62,44 L66,58 L58,70 L42,72 L32,60 Z"/>' + '<circle cx="48" cy="55" r="7" stroke-width="1.6"/>'
    + fino('M36,42 L22,26 L10,24 M22,26 L20,12 M48,36 L50,18 L44,6 M50,18 L60,10 M32,60 L16,66 L6,62 M16,66 L12,80 M42,72 L36,90 L26,98 M36,90 L44,102', 1.6)
    + '<path d="M66,58 H84 M110,58 H118 M144,58 H152 M178,58 H206"/>'
    + '<rect x="84" y="50" width="26" height="16" rx="7"/><rect x="118" y="50" width="26" height="16" rx="7"/><rect x="152" y="50" width="26" height="16" rx="7"/>'
    + fino('M206,58 L226,40 M206,58 L232,58 M206,58 L226,76 M216,48 L232,44', 1.6) + dot(228, 39, 3.5) + dot(235, 58, 3.5) + dot(228, 77, 3.5) + dot(235, 44, 3.5)
    + seta(110, 22, 176, 22, 1.8, 9)],
  ['bio-sinapse', 'Sinapse química', 170, 140,
    '<path d="M50,4 V30 C18,42 20,90 85,90 C150,90 152,42 120,30 V4"/>'
    + [[70, 52], [94, 46], [82, 70], [108, 66], [60, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" stroke-width="1.6"/>` + dot(x, y, 1.6)).join('')
    + '<path d="M10,110 Q85,98 160,110"/>' + [60, 85, 110].map(x => fino(`M${x - 6},100 V106 H${x + 6} V100`, 1.6)).join('')
    + dot(72, 96, 2) + dot(90, 95, 2) + dot(100, 97, 2) + dot(80, 94, 2)],
  ['bio-olho', 'Olho humano (corte)', 190, 150,
    '<path d="M52.5,35.1 A62,62 0 1 1 52.5,114.9"/><path d="M52.5,35.1 Q22,75 52.5,114.9"/>'
    + '<ellipse cx="62" cy="75" rx="9" ry="20"/>' + '<path d="M56,40 L60,58 M56,110 L60,92" stroke-width="3"/>'
    + '<path d="M128,26.5 A56,56 0 0 1 128,123.5" stroke-width="1.4" stroke-dasharray="5 3"/>'
    + '<path d="M160,66 H186 M160,84 H186"/>' + fino('M4,52 L62,60 L156,75 M4,98 L62,90 L156,75', 1.2)],
  ['bio-hemacia', 'Hemácia (frente e perfil)', 150, 80,
    hemF(40, 40, 30) + '<path d="M100,26 C92,26 92,54 100,54 C108,54 112,46 120,46 C128,46 132,54 140,54 C148,54 148,26 140,26 C132,26 128,34 120,34 C112,34 108,26 100,26 Z"/>'],
  ['bio-celulas-sangue', 'Células do sangue', 210, 90,
    hemF(32, 45, 22) + '<circle cx="100" cy="45" r="30"/>'
    + '<path d="M86,40 Q86,30 94,32 Q100,26 106,32 Q114,30 114,40 Q118,50 108,52 Q100,58 92,52 Q82,50 86,40 Z" fill="#C"/>'
    + '<ellipse cx="160" cy="34" rx="7" ry="5"/><ellipse cx="184" cy="48" rx="6" ry="4"/><ellipse cx="164" cy="62" rx="6" ry="5"/><ellipse cx="196" cy="28" rx="5" ry="4"/>'],
  ['bio-sarcomero', 'Sarcômero (actina e miosina)', 230, 99, "<g transform=\"translate(0.00 0.00)\">" + ('<path d="M14,8 L10,20 L18,32 L10,44 L18,56 L10,68 L14,76 M216,8 L212,20 L220,32 L212,44 L220,56 L212,68 L216,76" stroke-width="2.2"/>'
    + fino('M14,20 H98 M14,40 H98 M14,60 H98 M216,20 H132 M216,40 H132 M216,60 H132', 1.6)
    + '<path d="M66,30 H164 M66,50 H164" stroke-width="4.5"/>' + fino('M115,12 V72', 1.2).replace('/>', ' stroke-dasharray="4 3"/>')
    + L('Z', 14, 84) + L('M', 115, 84) + L('Z', 216, 84)) + "</g>"],
];

// ===== Botânica =====
const folhaCorte = (() => {
  let s = '<path d="M6,8 H234 M6,134 H234" stroke-width="1.4"/>';
  s += serie(12, i => `<rect x="${6 + 19 * i}" y="10" width="19" height="14" stroke-width="1.4"/>`);
  s += serie(15, i => `<rect x="${7 + 15.2 * i}" y="27" width="13" height="40" rx="5" stroke-width="1.4"/>` + dot(f(13.5 + 15.2 * i), 38, 1.6) + dot(f(13.5 + 15.2 * i), 54, 1.6));
  for (const [x, y, r] of [[18, 82, 9], [44, 96, 10], [24, 108, 8], [70, 80, 9], [80, 104, 9], [160, 82, 10], [186, 102, 9], [210, 82, 9], [140, 106, 8], [222, 106, 7], [102, 76, 7], [52, 76, 6]]) s += `<circle cx="${x}" cy="${y}" r="${r}" stroke-width="1.4"/>`;
  s += '<circle cx="120" cy="94" r="16"/>' + [[114, 88], [126, 88], [120, 98]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" stroke-width="1.3"/>`).join('');
  s += serie(12, i => { const x = 6 + 19 * i; return x >= 150 && x < 188 ? '' : `<rect x="${x}" y="118" width="19" height="14" stroke-width="1.4"/>`; });
  s += '<ellipse cx="161" cy="125" rx="7" ry="7"/><ellipse cx="177" cy="125" rx="7" ry="7"/>';
  return s;
})();
const PLANTAS = [
  ['bio-folha-corte', 'Folha (corte transversal)', 240, 140, folhaCorte],
  ['bio-estomato', 'Estômato', 130, 120,
    '<path d="M65,12 C22,14 22,106 65,108 C46,92 46,28 65,12 Z M65,12 C108,14 108,106 65,108 C84,92 84,28 65,12 Z"/>'
    + dot(42, 40, 2.5) + dot(38, 62, 2.5) + dot(44, 84, 2.5) + dot(88, 40, 2.5) + dot(92, 62, 2.5) + dot(86, 84, 2.5)
    + fino('M30,30 L6,18 M30,90 L6,104 M100,30 L124,18 M100,90 L124,104 M24,60 H4 M106,60 H126', 1.4)],
  ['bio-flor', 'Flor (partes)', 230, 210,
    '<path d="M90,206 V150"/>' + '<path d="M90,150 Q70,148 62,132 Q78,134 90,146 M90,150 Q110,148 118,132 Q102,134 90,146"/>'
    + '<path d="M82,140 C40,130 10,70 34,40 C52,60 70,100 84,136 M98,140 C140,130 170,70 146,40 C128,60 110,100 96,136"/>'
    + '<ellipse cx="90" cy="126" rx="11" ry="15"/><path d="M90,111 V62"/><ellipse cx="90" cy="58" rx="8" ry="4" fill="#C"/>'
    + '<path d="M84,138 Q70,100 64,74 M96,138 Q110,100 116,74" stroke-width="1.8"/><ellipse cx="63" cy="68" rx="4" ry="8" fill="#C"/><ellipse cx="117" cy="68" rx="4" ry="8" fill="#C"/>'
    + fino('M98,58 L170,30 M122,68 L170,62 M150,96 L170,96 M101,128 L170,128 M114,140 L170,160', 1.2)
    + L('pistilo', 200, 30) + L('estame', 200, 62) + L('pétala', 200, 96) + L('ovário', 200, 128) + L('sépala', 200, 160)],
  ['bio-raiz', 'Raiz (zonas)', 230, 240,
    '<path d="M32,6 V168 Q32,198 44,212 Q56,198 56,168 V6"/><path d="M33,186 Q30,222 44,230 Q58,222 55,186" stroke-width="1.6"/>'
    + fino(serie(9, i => { const y = 72 + 8 * i; return `M32,${y} l-14,-4 M56,${y} l14,-4 `; }), 1.2)
    + '<path d="M32,24 Q20,30 10,46 M56,30 Q66,36 72,50" stroke-width="2"/>'
    + fino('M76,30 H84 M74,104 H84 M60,170 H84 M60,220 H84', 1.2)
    + L('ramificação', 150, 30) + L('pelos absorventes', 154, 104) + L('alongamento', 150, 170) + L('coifa', 112, 220)],
  ['bio-planta', 'Planta (partes)', 180, 240,
    '<path d="M4,150 H176" stroke-width="1.6" stroke-dasharray="6 4"/>'
    + '<path d="M70,150 V40"/><circle cx="70" cy="30" r="10"/>' + serie(5, i => { const [x, y] = pt(70, 30, 17, i * 72 - 90); return `<circle cx="${x}" cy="${y}" r="7" stroke-width="1.8"/>`; })
    + '<path d="M70,80 C50,64 26,70 20,82 C34,92 56,90 70,80 Z M70,110 C90,94 114,100 120,112 C106,122 84,120 70,110 Z"/>'
    + '<path d="M70,150 V214 M70,170 L46,196 M70,184 L94,210 M70,200 L52,226 M46,196 L34,204 M94,210 L104,222" stroke-width="2"/>'
    + fino('M86,30 H136 M108,108 H136 M74,130 H136 M74,196 H136', 1.2)
    + L('flor', 156, 30) + L('folha', 158, 108) + L('caule', 158, 130) + L('raiz', 156, 196)],
  ['bio-fotossintese', 'Fotossíntese (esquema)', 240, 170,
    '<path d="M70,110 C80,60 150,40 190,50 C180,100 130,130 70,110 Z"/>' + fino('M70,110 Q130,90 190,50', 1.4)
    + '<circle cx="26" cy="26" r="11"/>' + fino(serie(8, i => { const [a, b] = pt(26, 26, 15, i * 45), [c, d] = pt(26, 26, 21, i * 45); return `M${a},${b} L${c},${d} `; }), 1.8)
    + seta(44, 40, 96, 72) + L('luz', 80, 44)
    + seta(38, 118, 80, 112) + L('CO₂', 20, 120)
    + seta(104, 150, 106, 118) + L('H₂O', 104, 160)
    + seta(178, 72, 222, 92) + L('O₂', 226, 74)
    + seta(150, 108, 172, 132) + L('C₆H₁₂O₆', 196, 146)],
  ['bio-germinacao', 'Germinação da semente', 240, 130,
    '<path d="M4,78 H236" stroke-width="1.4" stroke-dasharray="6 4"/>'
    + '<ellipse cx="24" cy="92" rx="13" ry="8"/>'
    + '<ellipse cx="78" cy="90" rx="13" ry="8"/><path d="M84,96 Q88,108 80,122" stroke-width="2"/>'
    + '<path d="M138,120 V62 Q138,48 126,52" stroke-width="2.2"/><ellipse cx="122" cy="58" rx="8" ry="5"/><path d="M138,78 V122 M138,100 L128,112 M138,96 L148,108" stroke-width="1.6"/>'
    + '<path d="M204,78 V24 M204,124 V78 M204,96 L192,110 M204,104 L216,118" stroke-width="2"/><path d="M204,30 C190,16 176,22 174,30 C184,38 196,36 204,30 Z M204,30 C218,16 232,22 234,30 C224,38 212,36 204,30 Z"/>'
    + seta(44, 50, 60, 50, 1.6, 8) + seta(100, 50, 116, 50, 1.6, 8) + seta(160, 50, 176, 50, 1.6, 8)],
  ['bio-caule-corte', 'Caule (corte transversal)', 130, 130,
    '<circle cx="65" cy="65" r="58"/><circle cx="65" cy="65" r="54" stroke-width="1.2"/>'
    + serie(8, i => { const a = i * 45; const [x, y] = pt(65, 65, 34, a); const [x1, y1] = pt(x, y, 7, a + 90), [x2, y2] = pt(x, y, 7, a - 90); return `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" transform="rotate(${a} ${x} ${y})"/><path d="M${x1},${y1} L${x2},${y2}" stroke-width="1.3"/>` + dot(...pt(65, 65, 30, a).map(Number), 1.8); })],
  ['bio-fruto', 'Fruto (corte)', 110, 140,
    '<path d="M55,20 C20,20 8,60 12,92 C16,124 40,136 55,136 C70,136 94,124 98,92 C102,60 90,20 55,20 Z"/><path d="M55,20 L58,6"/>'
    + '<path d="M58,12 C66,2 82,4 86,10 C78,18 64,18 58,12 Z" stroke-width="1.8"/>'
    + '<ellipse cx="55" cy="84" rx="18" ry="26"/><ellipse cx="55" cy="84" rx="9" ry="15" fill="#C"/>'
    + '<path d="M55,30 C30,32 20,62 22,90 C24,116 40,126 55,127" stroke-width="1.2" stroke-dasharray="4 3"/>'],
  ['bio-fototropismo', 'Fototropismo', 160, 150,
    '<path d="M30,110 H100 L92,146 H38 Z"/>' + '<path d="M65,110 C64,80 70,56 98,40" stroke-width="2.4"/>'
    + '<path d="M98,40 C96,26 110,22 118,26 C116,36 106,42 98,40 Z M80,66 C70,56 56,58 52,64 C60,72 72,72 80,66 Z"/>'
    + '<circle cx="140" cy="24" r="10"/>' + fino(serie(6, i => { const [a, b] = pt(140, 24, 14, 90 + i * 36), [c, d] = pt(140, 24, 19, 90 + i * 36); return `M${a},${b} L${c},${d} `; }), 1.6)
    + seta(132, 44, 118, 56, 1.4, 7) + seta(150, 52, 138, 72, 1.4, 7)],
];

// ===== Microbiologia =====
const MICRO = [
  ['bio-bacterias-formas', 'Formas de bactérias', 250, 110,
    '<circle cx="24" cy="44" r="8"/><circle cx="40" cy="44" r="8"/><circle cx="32" cy="58" r="8"/><circle cx="48" cy="58" r="8"/>'
    + '<rect x="76" y="40" width="40" height="20" rx="10"/>'
    + '<path d="M132,52 q6,-16 12,0 t12,0 t12,0 t12,0" stroke-width="4"/>'
    + '<path d="M208,62 Q210,38 232,38" stroke-width="7"/><path d="M234,38 q6,-6 10,2" stroke-width="1.4"/>'
    + L('cocos', 36, 96) + L('bacilo', 96, 96) + L('espirilo', 156, 96) + L('vibrião', 218, 96)],
  ['bio-bacteriofago', 'Bacteriófago', 100, 180,
    `<path d="M${serie(6, i => pt(50, 34, 28, i * 60 - 90).join(',') + (i < 5 ? ' L' : ''))} Z"/>`
    + fino('M38,24 q6,-8 12,0 t12,0 M38,40 q6,8 12,0 t12,0', 1.4)
    + '<rect x="40" y="62" width="20" height="6"/><rect x="43" y="68" width="14" height="52"/>' + fino(serie(6, i => `M43,${76 + 8 * i} H57 `), 1.2)
    + '<rect x="32" y="120" width="36" height="7" rx="1"/>' + '<path d="M36,127 L16,148 L22,174 M64,127 L84,148 L78,174 M44,127 L36,152 L42,176 M56,127 L64,152 L58,176" stroke-width="1.8"/>'],
  ['bio-virus-envelopado', 'Vírus envelopado', 150, 150,
    '<circle cx="75" cy="75" r="52"/>'
    + serie(16, i => { const [a, b] = pt(75, 75, 52, i * 22.5), [c, d] = pt(75, 75, 64, i * 22.5), [e, g] = pt(75, 75, 67, i * 22.5); return `<path d="M${a},${b} L${c},${d}" stroke-width="2"/><circle cx="${e}" cy="${g}" r="3.5" fill="#C" stroke="none"/>`; })
    + `<path d="M${serie(6, i => pt(75, 75, 30, i * 60).join(',') + (i < 5 ? ' L' : ''))} Z" stroke-width="2"/>`
    + fino('M58,70 q6,-8 12,0 t12,0 t12,0 M60,82 q5,6 10,0 t10,0 t10,0', 1.6)],
  ['bio-virus-helicoidal', 'Vírus helicoidal (bastonete)', 210, 60,
    '<rect x="8" y="14" width="194" height="32" rx="4"/>' + fino(serie(16, i => `M${18 + 12 * i},14 L${12 + 12 * i},46 `), 1.4)
    + `<path d="${graf(x => 30 + 9 * Math.sin((x - 8) / 24 * 2 * Math.PI), 8, 202, 2)}" stroke-width="1.8" stroke-dasharray="6 3"/>`],
  ['bio-levedura', 'Levedura (brotamento)', 140, 100,
    '<ellipse cx="52" cy="56" rx="38" ry="30"/><ellipse cx="104" cy="34" rx="20" ry="15"/>'
    + '<circle cx="46" cy="62" r="9" stroke-width="1.6"/>' + dot(46, 62, 2.5) + '<circle cx="64" cy="44" r="7" stroke-width="1.4"/>'
    + dot(104, 34, 2.5) + fino('M26,40 q4,-4 8,0', 1.4) + '<ellipse cx="116" cy="80" rx="14" ry="11"/>'],
  ['bio-bolor', 'Bolor (hifas e esporângios)', 170, 160,
    '<path d="M6,140 C40,130 60,150 90,138 S140,132 164,142" stroke-width="2"/>' + fino('M20,138 L14,154 M60,142 L66,156 M120,136 L114,154 M150,140 L158,154', 1.4)
    + '<path d="M50,138 V40 M92,138 V24 M134,138 V54" stroke-width="2"/>'
    + '<circle cx="50" cy="30" r="12"/><circle cx="92" cy="14" r="11"/><circle cx="134" cy="44" r="12"/>'
    + [[46, 26], [55, 32], [47, 36], [88, 11], [96, 16], [90, 19], [130, 40], [139, 46], [131, 50]].map(([x, y]) => dot(x, y, 2)).join('')],
  ['bio-ameba', 'Ameba', 170, 120,
    '<path d="M30,60 C20,30 50,20 64,34 C70,10 100,8 104,30 C124,24 160,40 140,62 C160,80 130,108 100,96 C90,116 50,114 52,94 C30,100 10,80 30,60 Z"/>'
    + '<circle cx="80" cy="62" r="11"/>' + dot(82, 60, 3) + '<circle cx="114" cy="50" r="7" stroke-width="1.4"/>'
    + '<circle cx="54" cy="66" r="6" stroke-width="1.4"/>' + dot(54, 66, 2) + '<circle cx="100" cy="80" r="5" stroke-width="1.4"/>'],
  ['bio-paramecio', 'Paramécio', 190, 100,
    '<ellipse cx="95" cy="50" rx="80" ry="32" transform="rotate(-6 95 50)"/>'
    + fino(serie(36, i => { const t = i * 10 * Math.PI / 180, c = Math.cos(-6 * Math.PI / 180), s = Math.sin(-6 * Math.PI / 180); const ex = 80 * Math.cos(t), ey = 32 * Math.sin(t), nx = ex / 80, ny = ey / 32, n = Math.hypot(nx / 80, ny / 32); const ux = nx / 80 / n, uy = ny / 32 / n; const p = (k) => [f(95 + (ex + ux * k) * c - (ey + uy * k) * s), f(50 + (ex + ux * k) * s + (ey + uy * k) * c)]; const [a, b] = p(0), [d, e] = p(7); return `M${a},${b} L${d},${e} `; }), 1.2)
    + '<path d="M80,58 Q100,70 110,54" stroke-width="1.8"/>' + '<ellipse cx="96" cy="40" rx="15" ry="10" stroke-width="1.8"/>' + dot(116, 40, 3)
    + [[44, 50], [146, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" stroke-width="1.4"/>` + fino(serie(6, i => { const [a, b] = pt(x, y, 6, i * 60), [c, d] = pt(x, y, 11, i * 60); return `M${a},${b} L${c},${d} `; }), 1.2)).join('')],
  ['bio-euglena', 'Euglena', 190, 90,
    '<path d="M24,48 C24,28 90,26 150,38 Q182,46 184,50 Q182,54 150,62 C90,74 24,70 24,48 Z"/>'
    + '<path d="M28,40 C16,24 32,16 18,6" stroke-width="1.8"/>' + dot(40, 44, 4)
    + '<circle cx="104" cy="50" r="9" stroke-width="1.6"/>' + dot(104, 50, 2)
    + [[64, 40, 10], [72, 58, -10], [134, 44, 0], [140, 58, 10], [84, 38, 0]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="3.5" transform="rotate(${a} ${x} ${y})" stroke-width="1.4"/>`).join('')],
  ['bio-diatomaceas', 'Diatomáceas', 140, 80,
    '<circle cx="34" cy="40" r="28"/><circle cx="34" cy="40" r="8" stroke-width="1.4"/>'
    + fino(serie(16, i => { const [a, b] = pt(34, 40, 10, i * 22.5), [c, d] = pt(34, 40, 25, i * 22.5); return `M${a},${b} L${c},${d} `; }), 1.2)
    + '<ellipse cx="102" cy="40" rx="34" ry="14"/>' + fino('M76,40 H128', 1.4) + fino(serie(10, i => `M${80 + 5 * i},${i % 2 ? 31 : 30} V36 M${80 + 5 * i},44 V${i % 2 ? 49 : 50} `), 1.1)],
  ['bio-curva-crescimento', 'Curva de crescimento bacteriano', 240, 170,
    eixos(30, 140, 232, 8) + `<path d="M30,120 H60 C80,120 110,40 130,40 H180 C196,40 210,64 226,82" stroke-width="2.6"/>`
    + fino('M60,40 V140 M130,40 V140 M180,40 V140', 1.2).replace('/>', ' stroke-dasharray="4 4"/>')
    + L('lag', 45, 154) + L('log', 95, 154) + L('estac.', 155, 154) + L('morte', 206, 154) + L('log N', 64, 14)],
];

// ===== Ecologia =====
const TEIA_N = { P1: [50, 168], P2: [180, 168], H1: [30, 110], H2: [115, 110], H3: [200, 110], C1: [70, 58], C2: [160, 58], C3: [115, 20] };
const teia = (() => {
  const r = 15, nomes = { P1: 'P₁', P2: 'P₂', H1: 'H₁', H2: 'H₂', H3: 'H₃', C1: 'C₁', C2: 'C₂', C3: 'C₃' };
  let s = Object.entries(TEIA_N).map(([k, [x, y]]) => `<circle cx="${x}" cy="${y}" r="${r}"/>` + L(nomes[k], x, y, 14)).join('');
  for (const [a, b] of [['P1', 'H1'], ['P1', 'H2'], ['P2', 'H2'], ['P2', 'H3'], ['H1', 'C1'], ['H2', 'C1'], ['H2', 'C2'], ['H3', 'C2'], ['C1', 'C3'], ['C2', 'C3']]) s += setaC(...TEIA_N[a], r + 1, ...TEIA_N[b], r + 1);
  return s;
})();
const piramide = (ws, rotulos, y0, h, cx = 110) => ws.map((w, i) => `<rect x="${cx - w / 2}" y="${y0 - (i + 1) * h}" width="${w}" height="${h}"/>` + L(rotulos[i], cx, y0 - (i + 0.5) * h, 16)).join('');
const ECOLOGIA = [
  ['bio-cadeia', 'Cadeia alimentar', 250, 60,
    [28, 94, 160, 226].map((x, i) => `<circle cx="${x}" cy="30" r="20"/>` + L(['P', 'C₁', 'C₂', 'C₃'][i], x, 30, 18)).join('')
    + seta(49, 30, 73, 30) + seta(115, 30, 139, 30) + seta(181, 30, 205, 30)],
  ['bio-teia', 'Teia alimentar', 230, 190, teia],
  ['bio-piramide', 'Pirâmide ecológica (energia)', 220, 150, piramide([200, 150, 100, 50], ['P', 'C₁', 'C₂', 'C₃'], 142, 32)],
  ['bio-piramide-invertida', 'Pirâmide invertida', 220, 120, piramide([40, 110, 200], ['P', 'C₁', 'C₂'], 112, 34)],
  ['bio-ciclo-carbono', 'Ciclo do carbono', 240, 190,
    caixa(50, 6, 140, 28, 'CO₂ atmosférico') + caixa(24, 80, 70, 28, 'plantas') + caixa(146, 80, 70, 28, 'animais')
    + caixa(92, 150, 120, 28, 'decompositores') + caixa(6, 150, 64, 28, 'fósseis')
    + seta(78, 34, 52, 78, 1.8, 9) + seta(76, 80, 100, 36, 1.8, 9) + seta(176, 80, 160, 36, 1.8, 9)
    + seta(94, 94, 144, 94, 1.8, 9) + seta(70, 108, 118, 148, 1.8, 9) + seta(181, 108, 168, 148, 1.8, 9)
    + '<path d="M38,150 V128 Q38,122 32,122 H16 Q10,122 10,116 V26 Q10,20 16,20 H40" stroke-width="1.8"/>' + head(48, 20, 0, 9)
    + '<path d="M212,164 H222 Q228,164 228,158 V26 Q228,20 222,20 H200" stroke-width="1.8"/>' + head(192, 20, 180, 9)],
  ['bio-ciclo-nitrogenio', 'Ciclo do nitrogênio', 250, 207, "<g transform=\"translate(0.00 0.00)\">" + (caixa(97, 8, 56, 28, 'N₂', 16) + caixa(6, 84, 60, 28, 'NH₄⁺', 15) + caixa(184, 84, 60, 28, 'NO₃⁻', 15)
    + caixa(95, 150, 60, 28, 'NO₂⁻', 15) + caixa(88, 84, 74, 28, 'biomassa')
    + seta(97, 30, 46, 82, 1.8, 9) + seta(46, 112, 93, 152, 1.8, 9) + seta(155, 152, 204, 114, 1.8, 9) + seta(204, 82, 155, 30, 1.8, 9)
    + seta(184, 98, 164, 98, 1.8, 8) + seta(88, 98, 68, 98, 1.8, 8)
    + L('fixação', 36, 44) + L('desnitrif.', 210, 44) + L('nitrificação', 125, 192)) + "</g>"],
  ['bio-cresc-populacional', 'Crescimento populacional (J e S)', 230, 171, "<g transform=\"translate(0.00 1.50)\">" + (eixos(28, 140, 222, 8) + `<path d="${graf(x => 140 - 6 * Math.exp((x - 28) / 42), 28, 150, 2)}" stroke-width="2" stroke-dasharray="7 4"/>`
    + `<path d="${graf(x => 140 - 96 / (1 + Math.exp(-(x - 100) / 18)), 28, 212, 2)}" stroke-width="2.6"/>`
    + fino('M28,44 H214', 1.3).replace('/>', ' stroke-dasharray="4 4"/>') + L('K', 16, 44, 16) + L('N', 14, 14, 16) + L('t', 216, 154, 16)
    + L('J', 158, 14, 16) + L('S', 200, 60, 16)) + "</g>"],
  ['bio-predador-presa', 'Predador e presa (oscilações)', 230, 181, "<g transform=\"translate(0.00 1.50)\">" + (eixos(28, 150, 224, 8) + `<path d="${graf(x => 94 - 40 * Math.sin((x - 28) / 60 * Math.PI), 28, 214, 2)}" stroke-width="2.4"/>`
    + `<path d="${graf(x => 116 - 22 * Math.sin((x - 48) / 60 * Math.PI), 28, 214, 2)}" stroke-width="2" stroke-dasharray="7 4"/>`
    + fino('M110,14 H132') + L('presa', 160, 14) + fino('M110,32 H132').replace('/>', ' stroke-dasharray="6 3"/>') + L('predador', 174, 32) + L('N', 14, 14, 16) + L('t', 218, 164, 16)) + "</g>"],
  ['bio-sucessao', 'Sucessão ecológica', 250, 120,
    '<path d="M4,108 H246"/>' + seta(16, 10, 236, 10, 1.8, 9)
    + '<path d="M10,108 Q16,96 28,98 Q36,92 44,100 Q52,100 54,108" stroke-width="1.8"/>' + dot(22, 102, 2) + dot(36, 98, 2)
    + tufo(70, 108) + tufo(84, 108, 0.8) + tufo(98, 108)
    + '<path d="M120,108 V98"/><circle cx="120" cy="88" r="11"/><path d="M146,108 V100"/><circle cx="146" cy="90" r="10"/>'
    + arvore(186, 108, 56, 18) + arvore(226, 108, 72, 18)],
  ['bio-bioma-caatinga', 'Caatinga (bioma)', 120, 100,
    '<path d="M4,94 H116"/><path d="M56,94 V30 Q56,20 64,20 Q72,20 72,30 V94 M56,62 H46 Q40,62 40,56 V42 Q40,36 46,36 Q50,36 50,42 V54 H56 M72,72 H84 Q90,72 90,66 V50 Q90,44 84,44 Q80,44 80,50 V64 H72"/>'
    + fino('M20,94 L18,74 L10,62 M18,74 L26,60 M18,80 L28,74 M104,94 L106,78 L98,70 M106,78 L114,68', 1.6)
    + '<circle cx="100" cy="18" r="8"/>' + fino(serie(8, i => { const [a, b] = pt(100, 18, 11, i * 45), [c, d] = pt(100, 18, 15, i * 45); return `M${a},${b} L${c},${d} `; }), 1.4)],
  ['bio-bioma-cerrado', 'Cerrado (bioma)', 120, 100,
    '<path d="M4,94 H116"/><path d="M58,94 C56,80 66,70 58,58 C52,48 62,42 60,36 M58,58 C70,52 76,46 84,42 M60,46 C50,42 44,38 38,30" stroke-width="2.4"/>'
    + '<path d="M26,30 C26,20 52,18 54,28 C66,22 76,30 72,36 C90,32 100,44 86,48 C72,52 56,44 50,40 C38,40 20,40 26,30 Z"/>'
    + tufo(14, 94) + tufo(30, 94, 0.8) + tufo(88, 94) + tufo(104, 94, 0.8)],
  ['bio-bioma-mangue', 'Manguezal (bioma)', 120, 100,
    '<path d="M4,76 q7,-4 14,0 t14,0 t14,0 t14,0 t14,0 t14,0 t14,0 t14,0" stroke-width="1.6"/><path d="M4,94 H116" stroke-width="1.4" stroke-dasharray="5 4"/>'
    + '<path d="M60,58 V30"/><circle cx="60" cy="24" r="18"/><circle cx="40" cy="34" r="12"/><circle cx="80" cy="34" r="12"/>'
    + '<path d="M60,58 Q40,60 32,92 M60,58 Q50,72 48,92 M60,58 Q70,72 72,92 M60,58 Q80,60 88,92" stroke-width="2"/>'],
  ['bio-bioma-pampa', 'Pampa (bioma)', 120, 100,
    '<path d="M4,70 Q34,50 64,66 Q90,54 116,62"/><path d="M4,94 H116"/>'
    + tufo(16, 86) + tufo(36, 90, 0.9) + tufo(58, 84) + tufo(80, 90, 0.9) + tufo(100, 86) + arvore(96, 60, 30, 9)],
  ['bio-bioma-floresta', 'Floresta tropical (bioma)', 120, 100,
    '<path d="M4,94 H116"/>' + arvore(60, 94, 74, 16) + arvore(28, 94, 48, 16) + arvore(94, 94, 52, 18)
    + '<circle cx="42" cy="56" r="11"/><circle cx="78" cy="58" r="11"/>' + tufo(12, 94, 0.8) + tufo(110, 94, 0.8)],
];

// ===== Evolução =====
const arvoreFilo = (() => {
  const t = (s, y) => L(s, 216, y, 16);
  return '<path d="M200,20 H150 V50 H200 M150,35 H110 V80 H200 M110,57.5 H60 V125 M200,110 H140 V140 H200 M140,125 H60 M60,91 H12" stroke-width="2.2"/>'
    + t('A', 20) + t('B', 50) + t('C', 80) + t('D', 110) + t('E', 140);
})();
const cladograma = (() => {
  const yMain = x => 150 - (130 / 180) * (x - 20);
  let s = '<path d="M20,150 L200,20" stroke-width="2.2"/>';
  ['A', 'B', 'C', 'D'].forEach((n, i) => { const xt = 40 + 40 * i, x = (144.44 + xt) / 1.7222; s += `<path d="M${f(x)},${f(yMain(x))} L${xt},26" stroke-width="2.2"/>` + L(n, xt, 14, 16); });
  s += L('E', 200, 10, 16);
  for (const x of [80, 105, 128, 152]) { const y = yMain(x); s += fino(`M${f(x - 5)},${f(y - 7)} L${f(x + 5)},${f(y + 7)}`, 3); }
  return s;
})();
const gauss = (mu, s, A, y0) => x => y0 - A * Math.exp(-((x - mu) ** 2) / (2 * s * s));
const EVOLUCAO = [
  ['bio-arvore-filo', 'Árvore filogenética', 230, 160, arvoreFilo],
  ['bio-cladograma', 'Cladograma', 220, 160, cladograma],
  ['bio-tres-dominios', 'Três domínios da vida', 240, 150,
    '<path d="M100,140 V110 L40,30 M100,110 L150,70 L125,30 M150,70 L205,30" stroke-width="2.2"/>' + dot(100, 140, 4)
    + L('Bacteria', 40, 16, 15) + L('Archaea', 125, 16, 15) + L('Eukarya', 205, 16, 15)],
  ['bio-especiacao', 'Especiação alopátrica', 240, 120,
    '<ellipse cx="36" cy="60" rx="30" ry="40"/>' + [[26, 40], [44, 46], [30, 62], [46, 70], [32, 84], [22, 54]].map(([x, y]) => dot(x, y, 3)).join('')
    + seta(70, 60, 86, 60, 1.6, 8)
    + '<ellipse cx="120" cy="60" rx="30" ry="40"/><path d="M104,24 L114,40 L108,56 L122,70 L114,86 L130,98" stroke-width="2.2"/>' + [[102, 64], [100, 82], [112, 32], [134, 40], [140, 60], [132, 80]].map(([x, y]) => dot(x, y, 3)).join('')
    + seta(154, 60, 170, 60, 1.6, 8)
    + '<ellipse cx="190" cy="34" rx="18" ry="26"/><ellipse cx="216" cy="88" rx="18" ry="26"/>'
    + [[184, 26], [196, 38], [186, 46]].map(([x, y]) => dot(x, y, 3)).join('') + [[210, 80], [222, 92], [212, 102]].map(([x, y]) => `<path d="M${x - 4},${y + 3} L${x},${y - 4} L${x + 4},${y + 3} Z" stroke-width="1.4"/>`).join('')],
  ['bio-selecao', 'Seleção natural direcional', 230, 140,
    '<path d="M10,120 H222"/>' + `<path d="${graf(gauss(80, 24, 82, 120), 14, 160, 2)}" stroke-width="2" stroke-dasharray="7 4"/>`
    + `<path d="${graf(gauss(146, 24, 82, 120), 80, 218, 2)}" stroke-width="2.6"/>` + seta(88, 22, 136, 22, 1.8, 9) + L('antes', 34, 60) + L('depois', 200, 60)],
  ['bio-fossil', 'Fóssil (amonite)', 110, 110,
    (() => {
      const r = th => 3.2 * Math.exp(0.2 * th);
      let d = ''; for (let th = 0; th <= 13.6; th += 0.12) d += (d ? ' L' : 'M') + f(55 + r(th) * Math.cos(th)) + ',' + f(55 + r(th) * Math.sin(th));
      let rib = ''; for (let th = 2 * Math.PI + 0.3; th <= 13.6; th += 0.42) rib += `M${f(55 + r(th) * Math.cos(th))},${f(55 + r(th) * Math.sin(th))} L${f(55 + r(th - 2 * Math.PI) * Math.cos(th))},${f(55 + r(th - 2 * Math.PI) * Math.sin(th))} `;
      return `<path d="${d}"/>` + fino(rib, 1.3);
    })()],
];

// ===== Laboratório de biologia (microscópio, Petri, autoclave e afins estão na aba Laboratório) =====
const LAB = [
  ['bio-lamina', 'Lâmina e lamínula', 220, 70,
    '<rect x="6" y="14" width="208" height="42" rx="2"/>' + fino(serie(8, i => `M${10 + 5 * i},18 l-4,8 `) + 'M6,18 H46 V52 H6', 1.2)
    + '<rect x="114" y="19" width="36" height="32" stroke-width="1.4"/>' + '<path d="M126,30 Q132,26 138,32 Q142,40 132,42 Q122,40 126,30 Z" fill="#C" stroke="none"/>'],
  ['bio-alca', 'Alça de semeadura', 210, 40,
    '<rect x="6" y="14" width="90" height="12" rx="6"/><path d="M96,20 H186" stroke-width="1.8"/><circle cx="194" cy="20" r="8" stroke-width="1.8"/>'],
  ['bio-estrias', 'Semeadura por esgotamento (estrias)', 140, 140,
    '<circle cx="70" cy="70" r="62"/><circle cx="70" cy="70" r="57" stroke-width="1.2"/>'
    + fino('M32,30 L52,22 L36,40 L60,28 L40,50 L64,36 L46,58', 1.6)
    + fino('M64,40 L104,40 L70,52 L112,56 L74,66 L114,72', 1.6)
    + fino('M108,78 L84,108 L96,84 L66,116 L80,94 L50,112', 1.6)
    + [[56, 106], [44, 100], [62, 120], [88, 112], [36, 92]].map(([x, y]) => dot(x, y, 3)).join('')],
  ['bio-campo-micro', 'Campo do microscópio (esfregaço)', 140, 140,
    '<circle cx="70" cy="70" r="64" stroke-width="3"/>'
    + [[40, 40], [70, 28], [100, 42], [30, 76], [108, 78], [44, 106], [74, 108], [102, 104]].map(([x, y]) => hemF(x, y, 11)).join('')
    + '<circle cx="68" cy="70" r="15"/>' + '<path d="M59,68 Q61,62 67,64 Q73,60 76,68 Q78,76 68,76 Q57,77 59,68 Z" fill="#C"/>'],
  ['bio-eletroforese', 'Gel de eletroforese', 190, 160,
    '<rect x="24" y="16" width="146" height="128" rx="3"/>' + serie(5, i => `<rect x="${36 + 26 * i}" y="24" width="18" height="7" rx="1" stroke-width="1.4"/>`)
    + fino([46, 58, 70, 84, 100, 118, 132].map(y => `M36,${y} H54 `).join(''), 2.4)
    + fino('M62,64 H80 M62,104 H80 M88,58 H106 M114,84 H132 M114,118 H132 M140,64 H158 M140,104 H158 M140,132 H158', 3.4)
    + L('−', 180, 22, 22) + L('+', 180, 136, 22) + seta(10, 40, 10, 130, 1.8, 9)],
  ['bio-swab', 'Swab (coleta)', 200, 40,
    '<path d="M32,20 H196" stroke-width="2.4"/><ellipse cx="20" cy="20" rx="15" ry="9"/>' + fino('M12,16 l4,2 M20,14 l3,3 M14,24 l4,-2 M24,22 l3,2', 1.2)],
  ['bio-microtubo', 'Microtubo (PCR)', 60, 120,
    '<rect x="10" y="26" width="34" height="7" rx="2"/><path d="M13,33 V72 L24,108 Q27,113 30,108 L41,72 V33"/>'
    + '<path d="M44,28 Q56,24 54,14 Q52,6 40,6 H18 Q12,6 12,12 V18 H40 Q46,18 46,22" stroke-width="1.8"/>'
    + '<path d="M16,82 H38" stroke-width="1.5" stroke-dasharray="4 3"/>'],
  ['bio-microplaca', 'Microplaca de 96 poços', 240, 170,
    '<path d="M6,14 Q6,6 14,6 H226 Q234,6 234,14 V160 Q234,164 230,164 H10 Q6,164 6,160 Z M6,14 H18 V6"/>'
    + serie(12, j => L(String(j + 1), 34 + 17 * j, 18, 14)) + serie(8, i => L('ABCDEFGH'[i], 16, 40 + 16 * i, 14))
    + serie(96, k => `<circle cx="${34 + 17 * (k % 12)}" cy="${40 + 16 * Math.floor(k / 12)}" r="6" stroke-width="1.4"/>`)],
];

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "bio-processo-preencher",
        "Processo biológico — causas e efeitos",
        520,
        158,
        "<text x=\"260\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Processo biológico — causas e efeitos</text><rect x=\"10\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"85\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Entrada</text><path d=\"M162 73 L176 73\"/><path d=\"M169 69 L176 73 L169 77\"/><text x=\"85\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">condição: ____</text><rect x=\"180\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"255\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Transformação</text><path d=\"M332 73 L346 73\"/><path d=\"M339 69 L346 73 L339 77\"/><text x=\"255\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">mecanismo: ____</text><rect x=\"350\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"425\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Saída</text><text x=\"425\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">evidência: ____</text>"
      ],
      [
        "bio-observacao-registro",
        "Observação biológica — registro",
        540,
        224,
        "<text x=\"270\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Observação biológica — registro</text><rect x=\"10\" y=\"42\" width=\"520\" height=\"178\" rx=\"3\"/><text x=\"75\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Amostra</text><text x=\"205\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Estrutura</text><path d=\"M140 42 V220\"/><text x=\"335\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Função</text><path d=\"M270 42 V220\"/><text x=\"465\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Evidência</text><path d=\"M400 42 V220\"/><path d=\"M10 68 H530\"/><path d=\"M10 106 H530\"/><path d=\"M10 144 H530\"/><path d=\"M10 182 H530\"/>"
      ]
    ]
  ]
];

export default {
  id: 'biologia', nome: 'Biologia',
  destaques: ['bio-cel-animal', 'bio-cel-vegetal', 'bio-cel-procarionte', 'bio-mitocondria', 'bio-mosaico', 'bio-dupla-helice', 'bio-dogma',
    'bio-ciclo-celular', 'bio-cromossomo', 'bio-punnett', 'bio-heredograma', 'bio-neuronio', 'bio-cadeia', 'bio-piramide', 'bio-ciclo-carbono', 'bio-arvore-filo'],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Célula e organelas', CELULA],
    ['Membrana e transporte', MEMBRANA],
    ['DNA, RNA e proteínas', DNA],
    ['Divisão celular', DIVISAO],
    ['Genética e heredogramas', GENETICA],
    ['Anatomia e fisiologia humanas', ANATOMIA],
    ['Botânica', PLANTAS],
    ['Microbiologia', MICRO],
    ['Ecologia e biomas', ECOLOGIA],
    ['Evolução', EVOLUCAO],
    ['Laboratório de biologia', LAB],
  ],
};
