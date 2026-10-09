// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
import { T, head, bow, pipe } from './base.js';

// Operações unitárias em P&ID simplificado (convenções ISA 5.1 / ISO 10628), desenhos próprios do Giz Livre.
const motor = (cx, cy, r = 14) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>` + T(cx, cy, 'M', Math.round(r * 1.15));
const nivel = (x1, x2, y) => `<path d="M${x1} ${y} H${x2}" stroke-dasharray="8 6" stroke-width="1.6"/>`;
const fino = (d, w = 1.6) => `<path d="${d}" stroke-width="${w}"/>`;
const serie = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join(' ');
// recheio (X entre duas grades) de x1 a x2, de y1 a y2
const recheio = (x1, x2, y1, y2) => fino(`M${x1} ${y1} H${x2} M${x1} ${y2} H${x2} M${x1} ${y1} L${x2} ${y2} M${x2} ${y1} L${x1} ${y2}`, 1.8);
// mandíbula serrilhada de (x1,y1) a (x2,y2), dentes deslocados `dx` em x
const serra = (x1, y1, x2, y2, n, dx) => 'M' + Array.from({ length: 2 * n + 1 }, (_, i) => {
  const t = i / (2 * n);
  return `${(x1 + (x2 - x1) * t + (i % 2 ? dx : 0)).toFixed(1)} ${(y1 + (y2 - y1) * t).toFixed(1)}`;
}).join(' L');
const chama = '<path d="M40 130 Q30 112 44 100 Q46 116 56 110 Q52 92 64 84 Q66 104 78 108 Q90 118 80 130 Z"/>';
const cristal = (x, y) => `M${x} ${y} l4 -5 l4 5 l-4 5 Z`;

// ===== Mais formas: química geral, físico-química, eletroquímica e mais equipamentos de processo =====
// Desenhos próprios do Giz Livre (coordenadas calculadas aqui), sem cópia de nenhuma biblioteca.
const lig = (x1, y1, x2, y2, w) => `<path d="M${x1} ${y1} L${x2} ${y2}"${w ? ` stroke-width="${w}"` : ''}/>`;
const tra = (d, w = 1.2, da = '4 4') => `<path d="${d}" stroke-width="${w}" stroke-dasharray="${da}"/>`; // tracejado
const pto = (x, y, r = 3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#C" stroke="none"/>`;
const polar = (cx, cy, r, a) => [+(cx + r * Math.cos(a * Math.PI / 180)).toFixed(1), +(cy + r * Math.sin(a * Math.PI / 180)).toFixed(1)];
// anel hexagonal com vértice para cima; `duplas` desenha as ligações duplas (Kekulé) por dentro das arestas `ks`
const hexa = (cx, cy, r) => '<path d="M' + [0, 1, 2, 3, 4, 5].map(k => polar(cx, cy, r, -90 + 60 * k).join(' ')).join(' L') + ' Z"/>';
const duplas = (cx, cy, r, ks) => fino(ks.map(k => {
  const a = polar(cx, cy, r * 0.78, -90 + 60 * k), b = polar(cx, cy, r * 0.78, -30 + 60 * k);
  const m = f => `${(a[0] + (b[0] - a[0]) * f).toFixed(1)} ${(a[1] + (b[1] - a[1]) * f).toFixed(1)}`;
  return `M${m(0.12)} L${m(0.88)}`;
}).join(' '), 2.2);
// grupo carbonila: R–C(=O)–X, com C em (cx, cy); X centrado em xr, `g` = folga até o rótulo X
const carbonila = (cx, cy, x, xr, g) => T(22, cy, 'R') + lig(34, cy, cx - 12, cy) + T(cx, cy, 'C')
  + lig(cx - 4, cy - 14, cx - 4, cy - 36) + lig(cx + 4, cy - 14, cx + 4, cy - 36) + T(cx, cy - 50, 'O') + lig(cx + 12, cy, xr - g, cy) + T(xr, cy, x);
// lóbulo de orbital com base em (cx, cy), apontando para `ang` graus, comprimento L e meia-largura ~0,75·W
const lobo = (cx, cy, ang, L, W, extra = '') => `<path d="M0 0 C${(L * 0.3).toFixed(1)} ${-W} ${L} ${-W} ${L} 0 C${L} ${W} ${(L * 0.3).toFixed(1)} ${W} 0 0 Z" transform="translate(${cx} ${cy}) rotate(${ang})"${extra}/>`;
const sobe = (x, y1, y2) => lig(x, y1, x, y2 + 6, 1.8) + head(x, y2, -90, 8); // elétron ↑ (de y1 até a ponta em y2)
const desce = (x, y1, y2) => lig(x, y1, x, y2 - 6, 1.8) + head(x, y2, 90, 8); // elétron ↓
const eixos = (ox, oy, x1, y1) => `<path d="M${ox} ${y1 + 8} V${oy} H${x1 - 8}"/>` + head(ox, y1, -90, 10) + head(x1, oy, 0, 10);
// perfil de energia: reagentes em y=r, produtos em y=p, pico em y=pk
const perfil = (r, p, pk, extra) => eixos(24, 150, 212, 8) + `<path d="M30 ${r} H60 C90 ${r} 96 ${pk} 112 ${pk} C128 ${pk} 134 ${p} 164 ${p} H204"/>`
  + extra + T(12, 14, 'E', 14) + T(118, 163, 'caminho da reação', 10);
const bq = (x1, x2, top, bot) => `<path d="M${x1} ${top} V${bot - 4} Q${x1} ${bot} ${x1 + 4} ${bot} H${x2 - 4} Q${x2} ${bot} ${x2} ${bot - 4} V${top}"/>`; // béquer/cuba
const col = (x1, x2, ry, y1, y2) => { const r = (x2 - x1) / 2; return `<path d="M${x1} ${y1} A${r} ${ry} 0 0 1 ${x2} ${y1} V${y2} A${r} ${ry} 0 0 1 ${x1} ${y2} Z"/>`; }; // coluna com tampos
const bolhas = l => '<g stroke-width="1.4">' + l.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('') + '</g>';
const zig = (x1, x2, y, a = 8) => { const n = 5, s = (x2 - x1) / n; let d = `M${x1} ${y}`; for (let i = 1; i < n; i++) d += ` L${(x1 + s * i).toFixed(1)} ${i % 2 ? y - a : y + a}`; return fino(d + ` L${x2} ${y}`, 1.6); };
const ternario = () => {
  const A = [16, 158], B = [184, 158], C = [100, 12.5];
  const L = (p, q, f) => `${(p[0] + (q[0] - p[0]) * f).toFixed(1)} ${(p[1] + (q[1] - p[1]) * f).toFixed(1)}`;
  let d = '';
  for (const f of [0.25, 0.5, 0.75]) d += `M${L(A, C, f)} L${L(B, C, f)} M${L(B, A, f)} L${L(C, A, f)} M${L(C, B, f)} L${L(A, B, f)} `;
  return '<path d="M16 158 L184 158 L100 12.5 Z"/>' + fino(d, 1.1) + '<path d="M40 158 C58 74 142 74 160 158" stroke-width="2"/>'
    + T(114, 18, 'C', 15) + T(10, 172, 'A', 15) + T(190, 172, 'B', 15);
};

const REAT2 = [
  ['pq-colbolhas', 'Coluna de bolhas', 90, 220, col(14, 76, 20, 36, 184) + nivel(14, 76, 58) + fino('M26 174 H64', 2) + '<path d="M45 218 V174 M45 16 V4 M76 150 H88 M2 80 H14"/>'
    + bolhas([[30, 160, 4], [52, 150, 5], [38, 134, 4], [60, 122, 4], [28, 108, 5], [48, 96, 4], [62, 84, 3], [34, 72, 3], [56, 66, 3]])],
  ['pq-airlift', 'Reator airlift', 100, 220, col(14, 86, 20, 36, 184) + nivel(14, 86, 50) + fino('M34 64 V166 M66 64 V166', 1.8) + fino('M38 176 H62', 2) + '<path d="M50 218 V176 M50 16 V4"/>'
    + fino('M50 150 V86', 1.4) + head(50, 78, -90, 7) + fino('M24 80 V130 M76 80 V130', 1.4) + head(24, 138, 90, 7) + head(76, 138, 90, 7) + bolhas([[42, 160, 3], [58, 140, 3], [42, 118, 3], [58, 100, 3]])],
  ['pq-cstr-serie', 'CSTRs em série', 250, 130, serie(3, i => {
    const x = 12 + 80 * i;
    return `<path d="M${x} 40 V108 Q${x} 120 ${x + 12} 120 H${x + 44} Q${x + 56} 120 ${x + 56} 108 V40"/><circle cx="${x + 28}" cy="14" r="8"/><path d="M${x + 28} 22 V96 M${x + 18} 96 H${x + 38}"/>` + nivel(x, x + 56, 52);
  }) + '<path d="M68 100 H80 V56 H92 M148 100 H160 V56 H172 M2 56 H6 M228 100 H240"/>' + head(12, 56, 0, 7) + head(248, 100, 0, 7)],
];

const SEP2 = [
  ['pq-destilacao', 'Coluna com condensador e refervedor', 240, 260, col(70, 130, 18, 48, 212)
    + '<path d="M70 72 H112 M88 94 H130 M70 116 H112 M88 138 H130 M70 160 H112 M88 182 H130" stroke-width="1.8"/>'
    + '<path d="M100 30 V14 H196 V30"/><circle cx="196" cy="44" r="14"/>' + zig(182, 210, 44, 7) + '<path d="M196 58 V66"/><rect x="170" y="66" width="56" height="22" rx="11"/>'
    + '<path d="M182 88 V100 H150 V60 H138 M212 88 V104 H226"/>' + head(130, 60, 180, 8) + head(234, 104, 0, 8) + T(222, 118, 'D', 13)
    + '<path d="M4 126 H62"/>' + head(70, 126, 0, 8) + T(16, 114, 'F', 13)
    + '<path d="M130 200 H170"/><circle cx="184" cy="200" r="14"/>' + zig(170, 198, 200, 7) + '<path d="M184 186 V168 H138"/>' + head(130, 168, 180, 8)
    + '<path d="M100 230 V250 H226"/>' + head(234, 250, 0, 8) + T(222, 238, 'B', 13)],
  ['pq-membrana', 'Módulo de membrana (OI/UF)', 200, 100, '<rect x="30" y="20" width="140" height="60" rx="3"/>' + tra('M30 50 H170', 2, '7 5')
    + '<path d="M4 35 H22 M170 35 H188 M170 66 H188"/>' + head(30, 35, 0, 8) + head(196, 35, 0, 8) + head(196, 66, 0, 8) + T(100, 35, 'concentrado', 11) + T(100, 66, 'permeado', 11)],
  ['pq-adsorcao', 'Coluna de adsorção (carvão ativado)', 90, 220, col(14, 76, 20, 36, 184) + fino('M14 60 H76 M14 172 H76', 1.8)
    + '<g stroke-width="1.2">' + serie(10, r => serie(r % 2 ? 5 : 6, c => `<circle cx="${(r % 2 ? 25 : 20) + 10 * c}" cy="${(68 + 10.4 * r).toFixed(1)}" r="2.6"/>`)) + '</g>'
    + T(45, 44, 'CAG', 11) + '<path d="M45 16 V4 M45 204 V216"/>'],
  ['pq-trocaionica', 'Coluna de troca iônica', 90, 220, col(14, 76, 20, 36, 184) + fino('M14 60 H76 M14 172 H76', 1.8)
    + '<g stroke-width="1.4">' + serie(8, r => serie(r % 2 ? 4 : 5, c => `<circle cx="${(r % 2 ? 27 : 21) + 12 * c}" cy="${70 + 13 * r}" r="4.5"/>`)) + '</g>'
    + T(45, 44, 'resina', 10) + '<path d="M45 16 V4 M45 204 V216"/>'],
];

const TROCA2 = [
  ['pq-trocador-u', 'Trocador de tubos em U', 220, 100, '<rect x="20" y="20" width="30" height="60"/>' + fino('M20 50 H50', 1.8) + '<path d="M50 20 H170 A22 30 0 0 1 170 80 H50"/>'
    + fino('M50 34 H172 A16 16 0 0 1 172 66 H50 M50 42 H172 A8 8 0 0 1 172 58 H50', 1.4) + '<path d="M35 20 V6 M35 80 V94 M90 20 V6 M150 80 V94"/>'],
];

const NOVAS_SECOES = [
  ['Controle de poluição do ar', [
    ['pq-filtro-mangas', 'Filtro de mangas', 150, 200, '<rect x="20" y="20" width="110" height="100"/>' + fino('M20 36 H130', 1.8)
      + serie(4, i => `<rect x="${32 + 24 * i}" y="36" width="14" height="74" rx="7" stroke-width="1.8"/>`)
      + '<path d="M20 120 L65 160 H85 L130 120"/><rect x="66" y="160" width="18" height="14" rx="2"/><path d="M75 174 V196 M2 106 H12 M130 28 H140"/>' + head(20, 106, 0, 8) + head(148, 28, 0, 8)
      + pto(60, 140, 2) + pto(74, 148, 2) + pto(88, 140, 2) + pto(78, 134, 2)],
    ['pq-precipitador', 'Precipitador eletrostático', 220, 150, T(110, 10, 'alta tensão', 10) + '<rect x="30" y="20" width="160" height="80"/>' + fino('M44 36 H176 M44 60 H176 M44 84 H176', 2.2)
      + tra('M44 48 H176 M44 72 H176', 1.6, '3 5') + '<path d="M30 100 L60 130 H80 L110 100 L140 130 H160 L190 100 M70 130 V144 M150 130 V144 M4 60 H22 M190 60 H208"/>' + head(30, 60, 0, 8) + head(216, 60, 0, 8)],
    ['pq-venturi', 'Lavador Venturi', 200, 170, '<path d="M4 20 H30 L60 34 H74 L110 20 H130 M4 60 H30 L60 46 H74 L110 60 H130"/>' + fino('M67 6 V26', 1.6) + head(67, 33, 90, 7)
      + '<path d="M130 20 V14 H190 V128 L166 154 H154 L130 128 V60"/>' + nivel(130, 190, 112) + '<path d="M160 14 V2 M160 154 V168"/>' + bolhas([[84, 40, 2], [92, 46, 2], [100, 36, 2], [96, 52, 2]])],
    ['pq-chamine', 'Chaminé com pluma', 140, 200, '<path d="M50 196 L58 52 H82 L90 196 Z M10 196 H130"/>' + fino('M42 120 H98 M42 120 V112 M98 120 V112', 1.8) + '<circle cx="70" cy="100" r="4" stroke-width="1.6"/>'
      + '<path d="M60 50 Q48 36 62 28 Q70 12 90 18 Q108 6 122 20 Q136 30 126 42 Q112 52 96 44 Q84 54 70 48" stroke-width="1.8"/>'],
  ]],
  ['Estruturas e grupos funcionais', [
    ['pq-benzeno', 'Benzeno (Kekulé)', 110, 110, hexa(55, 55, 46) + duplas(55, 55, 46, [0, 2, 4])],
    ['pq-benzeno-aro', 'Benzeno (anel aromático)', 110, 110, hexa(55, 55, 46) + '<circle cx="55" cy="55" r="27" stroke-width="2"/>'],
    ['pq-fenol', 'Fenol', 110, 130, hexa(55, 84, 42) + duplas(55, 84, 42, [1, 3, 5]) + lig(55, 42, 55, 26) + T(55, 15, 'OH', 20)],
    ['pq-cicloexano', 'Cicloexano (cadeira)', 160, 96, '<path d="M146 38 L113 50 L47 26 L14 62 L47 50 L113 74 Z"/>'],
    ['pq-alcool', 'Álcool (–OH)', 160, 120, T(20, 60, 'R') + lig(32, 60, 66, 60) + T(78, 60, 'C') + lig(90, 60, 114, 60) + T(134, 60, 'OH')
      + lig(78, 47, 78, 29) + T(78, 17, 'H') + lig(78, 73, 78, 91) + T(78, 103, 'H')],
    ['pq-aldeido', 'Aldeído (–CHO)', 140, 100, carbonila(70, 76, 'H', 122, 12)],
    ['pq-cetona', 'Cetona (C=O)', 140, 100, carbonila(70, 76, 'R′', 122, 14)],
    ['pq-acido', 'Ácido carboxílico (–COOH)', 160, 100, carbonila(70, 76, 'OH', 128, 22)],
    ['pq-ester', 'Éster (–COO–)', 190, 100, carbonila(70, 76, 'O', 120, 12) + lig(132, 76, 160, 76) + T(174, 76, 'R′')],
    ['pq-amida', 'Amida (–CONH₂)', 170, 100, carbonila(70, 76, 'NH₂', 136, 26)],
    ['pq-amina', 'Amina (–NH₂)', 150, 110, T(22, 40, 'R') + lig(34, 40, 62, 40) + T(74, 40, 'N') + lig(86, 40, 112, 40) + T(124, 40, 'H') + lig(74, 53, 74, 78) + T(74, 92, 'H')],
    ['pq-eter', 'Éter (R–O–R′)', 160, 70, T(22, 52, 'R') + lig(34, 46, 66, 30) + T(80, 24, 'O') + lig(94, 30, 126, 46) + T(140, 52, 'R′')],
    ['pq-carbono', 'Carbono tetraédrico (cunhas)', 130, 140, T(65, 62, 'C') + lig(65, 49, 65, 26) + T(65, 14, 'H', 18) + lig(54, 70, 28, 94) + T(19, 104, 'H', 18)
      + '<path d="M76 70 L110 90 L103 99 Z" fill="#C"/>' + T(116, 110, 'H', 18)
      + fino(serie(5, i => `M${(63.5 - 1.6 * i).toFixed(1)} ${80 + 7 * i} H${(66.5 + 1.6 * i).toFixed(1)}`), 1.8) + T(65, 128, 'H', 18)],
    ['pq-agua', 'Molécula de água (104,5°)', 150, 106, '<circle cx="75" cy="38" r="18"/>' + T(75, 38, 'O', 18)
      + '<circle cx="35.5" cy="68.6" r="11"/><circle cx="114.5" cy="68.6" r="11"/>' + T(35.5, 68.6, 'H', 13) + T(114.5, 68.6, 'H', 13)
      + lig(60.8, 49, 44.2, 61.9) + lig(89.2, 49, 105.8, 61.9) + fino('M57.6 51.5 A22 22 0 0 0 92.4 51.5', 1.4)
      + T(75, 84, '104,5°', 12) + T(75, 9, 'δ⁻', 13) + T(20, 92, 'δ⁺', 13) + T(130, 92, 'δ⁺', 13)],
    ['pq-ponte-h', 'Ligação de hidrogênio (água)', 200, 112, T(50, 46, 'O') + lig(42, 56, 28, 72) + T(22, 82, 'H') + lig(62, 50, 82, 58) + T(92, 62, 'H')
      + tra('M104 62 H136', 2.2, '3 5') + T(150, 62, 'O') + lig(158, 52, 172, 34) + T(178, 24, 'H') + lig(158, 72, 172, 90) + T(178, 100, 'H')],
  ]],
  ['Átomos, orbitais e ligações', [
    ['pq-orb-s', 'Orbital s', 100, 100, '<circle cx="50" cy="50" r="34"/>' + tra('M4 50 H96 M50 4 V96') + pto(50, 50, 2.5)],
    ['pq-orb-p', 'Orbital p', 140, 90, lobo(70, 45, 0, 62, 40) + lobo(70, 45, 180, 62, 40) + tra('M70 4 V86') + T(106, 45, '+', 18) + T(34, 45, '−', 18)],
    ['pq-orb-d', 'Orbital d (dxy)', 120, 120, [45, 135, 225, 315].map(a => lobo(60, 60, a, 52, 28)).join('') + tra('M4 60 H116 M60 4 V116')
      + T(81, 81, '+', 15) + T(39, 39, '+', 15) + T(39, 81, '−', 15) + T(81, 39, '−', 15)],
    ['pq-orb-sp3', 'Orbitais híbridos sp³', 130, 130, lobo(65, 70, -90, 58, 30) + lobo(65, 70, 30, 58, 30) + lobo(65, 70, 150, 58, 30)
      + lobo(65, 70, 90, 36, 22, ' stroke-dasharray="5 4" stroke-width="1.8"') + pto(65, 70, 3)],
    ['pq-bohr', 'Átomo (modelo de Bohr)', 130, 130, '<g stroke-width="1.4"><circle cx="65" cy="65" r="22"/><circle cx="65" cy="65" r="38"/><circle cx="65" cy="65" r="56"/></g>' + pto(65, 65, 9)
      + [0, 180].map(a => pto(...polar(65, 65, 22, a), 3.5)).join('') + serie(8, i => pto(...polar(65, 65, 38, 22.5 + 45 * i), 3.5)) + pto(...polar(65, 65, 56, -60), 3.5)],
    ['pq-caixas', 'Diagrama de orbitais (caixas)', 200, 80, '<path d="M10 14 H40 V44 H10 Z M56 14 H86 V44 H56 Z M102 14 H192 V44 H102 Z M132 14 V44 M162 14 V44" stroke-width="2"/>'
      + sobe(20, 40, 18) + desce(30, 18, 40) + sobe(66, 40, 18) + desce(76, 18, 40) + sobe(112, 40, 18) + desce(122, 18, 40) + sobe(147, 40, 18) + sobe(177, 40, 18)
      + T(25, 62, '1s', 15) + T(71, 62, '2s', 15) + T(147, 62, '2p', 15)],
    ['pq-sigma', 'Ligação σ (frontal)', 200, 84, lobo(62, 40, 0, 44, 26) + lobo(62, 40, 180, 26, 18) + lobo(138, 40, 180, 44, 26) + lobo(138, 40, 0, 26, 18)
      + pto(62, 40) + pto(138, 40) + T(100, 74, 'σ', 18)],
    ['pq-pi', 'Ligação π (lateral)', 160, 150, lobo(55, 75, -90, 50, 24) + lobo(55, 75, 90, 50, 24) + lobo(105, 75, -90, 50, 24) + lobo(105, 75, 90, 50, 24)
      + fino('M55 75 H105', 1.4) + tra('M50 38 Q80 8 110 38 M50 112 Q80 142 110 112', 1.6, '5 4') + pto(55, 75) + pto(105, 75) + T(144, 75, 'π', 20)],
    ['pq-ionica', 'Ligação iônica (NaCl)', 220, 96, '<circle cx="40" cy="40" r="20"/>' + T(40, 40, 'Na', 15) + '<circle cx="176" cy="40" r="28"/>' + T(176, 40, 'Cl', 17)
      + fino('M62 32 Q106 2 142 26', 1.8) + head(146, 29, 37, 10) + T(104, 34, 'e⁻', 15) + T(40, 80, 'Na⁺', 16) + T(176, 84, 'Cl⁻', 16)],
    ['pq-om', 'Orbitais moleculares (H₂)', 200, 150, '<path d="M16 80 H56 M144 80 H184 M80 36 H120 M80 116 H120"/>' + tra('M56 80 L80 36 M56 80 L80 116 M144 80 L120 36 M144 80 L120 116')
      + sobe(36, 90, 68) + sobe(164, 90, 68) + sobe(94, 126, 104) + desce(106, 106, 128)
      + T(100, 22, 'σ*', 15) + T(100, 141, 'σ', 15) + T(36, 101, '1s', 13) + T(164, 101, '1s', 13) + T(36, 56, 'H', 14) + T(164, 56, 'H', 14)],
  ]],
  ['Diagramas de fase e equilíbrio', [
    ['pq-fase-agua', 'Diagrama de fases da água', 220, 170, eixos(24, 150, 212, 8) + '<path d="M30 146 Q58 138 80 112 Q140 100 180 40 M80 112 L68 18"/>' + pto(80, 112, 3.5) + pto(180, 40, 3.5)
      + T(46, 64, 'sólido', 12) + T(112, 56, 'líquido', 12) + T(150, 126, 'vapor', 12) + T(96, 126, 'PT', 10) + T(196, 30, 'PC', 10) + T(12, 14, 'P', 14) + T(206, 162, 'T', 14)],
    ['pq-fase-co2', 'Diagrama de fases do CO₂', 220, 170, eixos(24, 150, 212, 8) + '<path d="M30 146 Q58 138 80 112 Q140 100 180 40 M80 112 L100 18"/>' + pto(80, 112, 3.5) + pto(180, 40, 3.5)
      + T(46, 64, 'sólido', 12) + T(136, 56, 'líquido', 12) + T(150, 126, 'gás', 12) + T(96, 126, 'PT', 10) + T(196, 30, 'PC', 10) + T(12, 14, 'P', 14) + T(206, 162, 'T', 14)],
    ['pq-txy', 'Diagrama T-x-y (bolha e orvalho)', 200, 170, eixos(26, 150, 194, 8) + '<path d="M30 46 Q70 120 180 124 M30 46 Q140 50 180 124"/>'
      + T(150, 40, 'V', 14) + T(60, 128, 'L', 14) + T(114, 86, 'L + V', 11) + T(14, 14, 'T', 14) + T(182, 163, 'x, y', 12)],
    ['pq-mccabe', 'Diagrama de McCabe-Thiele', 180, 180, eixos(24, 156, 174, 6) + fino('M24 156 L164 16', 1.4) + '<path d="M24 156 Q40 40 164 16"/>'
      + fino('M150 30 H117 V63 H67 V113 H35 V145', 1.8) + pto(150, 30) + T(12, 14, 'y', 14) + T(170, 170, 'x', 14)],
    ['pq-azeotropo', 'Azeótropo (mínimo de T)', 200, 170, eixos(26, 150, 194, 8)
      + '<path d="M30 60 C50 110 80 120 110 120 C140 120 170 110 180 80 M30 60 C80 62 100 120 110 120 C120 120 150 66 180 80"/>' + pto(110, 120)
      + T(110, 40, 'V', 14) + T(110, 138, 'L', 14) + T(14, 14, 'T', 14) + T(182, 163, 'x, y', 12)],
    ['pq-curva-aquec', 'Curva de aquecimento (água)', 220, 160, eixos(24, 140, 212, 8) + '<path d="M28 134 L60 106 H100 L128 64 H178 L204 26"/>' + tra('M24 106 H60 M24 64 H128')
      + T(80, 96, 'fusão', 11) + T(153, 54, 'ebulição', 11) + T(12, 14, 'T', 14) + T(206, 152, 't', 14)],
    ['pq-ternario', 'Diagrama ternário', 200, 186, ternario()],
    ['pq-titulacao', 'Curva de titulação (pH × V)', 200, 160, eixos(28, 140, 192, 8) + '<path d="M30 120 C80 112 100 110 108 96 L112 50 C120 36 140 32 186 28"/>'
      + tra('M28 73 H110 V140') + pto(110, 73, 3.5) + T(126, 76, 'PE', 11) + T(14, 14, 'pH', 12) + T(186, 152, 'V', 13)],
  ]],
  ['Cinética', [
    ['pq-perfil-exo', 'Perfil de energia (exotérmica)', 220, 170, perfil(96, 126, 34, tra('M40 34 H108 M120 96 H200') + fino('M44 90 V42', 1.6) + head(44, 36, -90, 8) + head(44, 96, 90, 8)
      + T(60, 64, 'Eₐ', 13) + fino('M190 98 V120', 1.6) + head(190, 126, 90, 8) + T(170, 108, 'ΔH', 12))],
    ['pq-perfil-endo', 'Perfil de energia (endotérmica)', 220, 170, perfil(126, 90, 34, tra('M40 34 H108 M120 126 H200') + fino('M44 120 V42', 1.6) + head(44, 36, -90, 8) + head(44, 126, 90, 8)
      + T(60, 80, 'Eₐ', 13) + fino('M190 124 V96', 1.6) + head(190, 90, -90, 8) + T(172, 110, 'ΔH', 12))],
    ['pq-catalisador', 'Efeito do catalisador', 220, 170, perfil(96, 126, 34, '<path d="M60 96 C88 96 96 70 112 70 C128 70 136 126 164 126" stroke-width="1.8" stroke-dasharray="6 5"/>'
      + T(142, 40, 'sem', 11) + T(112, 90, 'com', 11))],
    ['pq-conc-tempo', 'Concentração × tempo', 200, 160, eixos(24, 140, 192, 8) + '<path d="M28 30 C60 100 100 126 186 130 M28 136 C60 70 100 44 186 40"/>'
      + T(176, 118, '[A]', 12) + T(176, 28, '[B]', 12) + T(12, 14, 'C', 14) + T(186, 152, 't', 14)],
    ['pq-equilibrio', 'Equilíbrio químico (C × t)', 200, 160, eixos(24, 140, 192, 8) + '<path d="M28 26 C60 66 90 84 120 86 H186 M28 136 C60 100 90 72 120 70 H186"/>' + tra('M120 14 V140')
      + T(160, 100, '[A]', 12) + T(160, 56, '[B]', 12) + T(156, 16, 'equilíbrio', 10) + T(12, 14, 'C', 14) + T(186, 152, 't', 14)],
    ['pq-arrhenius', 'Gráfico de Arrhenius (ln k × 1/T)', 200, 160, eixos(24, 140, 192, 8) + fino('M40 30 L180 124', 1.8)
      + [[54, 40], [82, 57], [110, 79], [138, 95], [166, 116]].map(([x, y]) => pto(x, y, 3.5)).join('') + T(48, 12, 'ln k', 12) + T(178, 152, '1/T', 12) + T(140, 60, '−Eₐ/R', 12)],
    ['pq-maxwell', 'Distribuição de Maxwell-Boltzmann', 220, 160, eixos(24, 140, 212, 8) + '<path d="M26 138 C44 138 52 34 76 34 C104 34 118 126 204 134"/>'
      + '<path d="M26 138 C54 138 72 74 104 74 C136 74 150 120 204 128" stroke-width="2" stroke-dasharray="7 5"/>' + tra('M150 18 V140')
      + T(76, 24, 'T₁', 13) + T(128, 64, 'T₂', 13) + T(164, 20, 'Eₐ', 12) + T(12, 14, 'f', 14) + T(200, 152, 'E', 13)],
    ['pq-michaelis', 'Michaelis-Menten / Monod', 200, 160, eixos(24, 140, 192, 8) + '<path d="M24 140 C50 60 100 40 186 34"/>' + tra('M24 28 H186 M24 84 H53 V140')
      + T(172, 18, 'Vmáx', 11) + T(53, 152, 'Kₘ', 12) + T(12, 14, 'v', 14) + T(186, 152, 'S', 13)],
  ]],
  ['Eletroquímica', [
    ['pq-daniell', 'Pilha de Daniell', 240, 170, bq(14, 94, 70, 160) + bq(146, 226, 70, 160) + nivel(16, 92, 90) + nivel(148, 224, 90)
      + '<rect x="38" y="40" width="12" height="100" rx="1"/><rect x="190" y="40" width="12" height="100" rx="1"/>'
      + '<path d="M70 104 V58 H170 V104 M82 104 V70 H158 V104"/>' + fino('M70 104 H82 M158 104 H170', 1.4)
      + fino('M44 40 V20 H107 M133 20 H196 V40', 1.8) + '<circle cx="120" cy="20" r="13"/>' + T(120, 20, 'V', 14) + head(86, 20, 0, 8) + T(84, 9, 'e⁻', 12)
      + T(60, 124, 'Zn', 12) + T(214, 124, 'Cu', 12) + T(28, 54, '−', 16) + T(212, 54, '+', 16)],
    ['pq-eletrolise', 'Célula eletrolítica', 200, 170, bq(20, 180, 70, 160) + nivel(22, 178, 86)
      + '<rect x="56" y="44" width="10" height="96" rx="1"/><rect x="134" y="44" width="10" height="96" rx="1"/>'
      + fino('M61 44 V20 H96 M106 20 H139 V44', 1.8) + '<path d="M96 6 V34" stroke-width="2"/><path d="M106 12 V28" stroke-width="4.5"/>'
      + T(88, 42, '+', 13) + T(114, 42, '−', 13) + T(61, 150, '+', 14) + T(139, 150, '−', 14) + bolhas([[150, 112, 3], [154, 98, 3], [148, 124, 3], [50, 106, 3], [46, 120, 3]])],
    ['pq-eph', 'Eletrodo padrão de hidrogênio', 140, 170, bq(14, 126, 60, 160) + nivel(16, 124, 80) + '<path d="M52 128 V18 H88 V128"/>' + fino('M70 4 V104', 1.6)
      + '<rect x="62" y="104" width="16" height="20" rx="1" stroke-width="1.8"/><path d="M88 36 H122"/>' + head(91, 36, 180, 8) + T(110, 26, 'H₂', 13)
      + bolhas([[64, 136, 3], [76, 142, 3], [70, 151, 2.5]]) + T(107, 112, 'Pt', 11) + T(107, 140, 'H⁺', 12)],
    ['pq-celcomb', 'Célula a combustível (H₂/O₂)', 220, 150, '<rect x="40" y="40" width="140" height="80" rx="3"/>' + fino('M90 40 V120 M130 40 V120', 1.8) + tra('M110 44 V116', 1.6, '5 4')
      + T(65, 100, '−', 16) + T(155, 100, '+', 16) + fino('M98 82 H118', 1.6) + head(124, 82, 0, 7) + T(110, 68, 'H⁺', 11)
      + '<path d="M4 60 H32 M216 60 H188 M180 104 H206"/>' + head(40, 60, 0, 8) + head(180, 60, 180, 8) + head(214, 104, 0, 8)
      + T(18, 48, 'H₂', 13) + T(202, 48, 'O₂', 13) + T(200, 120, 'H₂O', 12)
      + fino('M65 40 V14 H95 M125 14 H155 V40', 1.8) + '<rect x="95" y="6" width="30" height="16" rx="2"/>' + head(84, 14, 0, 7) + T(80, 28, 'e⁻', 11)],
    ['pq-protcat', 'Proteção catódica (ânodo de sacrifício)', 220, 140, '<path d="M4 30 H216"/>' + fino(serie(14, i => `M${12 + 15 * i} 30 l-6 8`), 1.2)
      + '<rect x="20" y="70" width="120" height="24" rx="12"/>' + T(80, 82, 'tubo de aço', 11) + '<rect x="170" y="80" width="26" height="40" rx="3"/>' + T(183, 100, 'Mg', 12)
      + fino('M120 70 V50 H183 V80', 1.8) + head(136, 50, 180, 7) + T(152, 62, 'e⁻', 11) + T(30, 50, 'solo', 10)],
    ['pq-eletrocoag', 'Eletrocoagulação', 200, 160, bq(14, 186, 50, 150) + nivel(16, 184, 64)
      + [46, 74, 102, 130, 158].map(x => `<rect x="${x}" y="40" width="6" height="96" rx="1"/>`).join('')
      + fino('M49 40 V26 H71 A6 6 0 0 1 83 26 H127 A6 6 0 0 1 139 26 H161 V40 M105 26 V40 M77 40 V12 H133 V40', 1.8) + T(34, 26, '+', 14) + T(146, 12, '−', 14)
      + bolhas([[60, 76, 3], [88, 72, 3], [116, 78, 3], [144, 74, 3], [172, 80, 3], [30, 82, 3]])],
  ]],
];


export default {
  id: 'quimica', nome: 'Química e processos',
  secoes: [
    ['Vasos e tanques', [
      ['pq-tanque', 'Tanque / vaso vertical', 110, 180, '<path d="M14 36 A41 22 0 0 1 96 36 V146 A41 22 0 0 1 14 146 Z"/><path d="M55 14 V4 M55 168 V177"/>'],
      ['pq-aberto', 'Tanque aberto', 120, 140, '<path d="M8 8 V132 H112 V8"/>' + nivel(8, 112, 40)],
      ['pq-tetocon', 'Tanque de teto cônico', 130, 150, '<path d="M10 40 L65 10 L120 40 V142 H10 Z"/>' + nivel(10, 120, 64)],
      ['pq-tetoflut', 'Tanque de teto flutuante', 140, 130, '<path d="M8 8 V122 H132 V8"/><path d="M12 38 H128 V48 H12 Z" stroke-width="1.8"/>' + nivel(8, 132, 54) + fino('M40 38 V24 M100 38 V24')],
      ['pq-horizontal', 'Vaso horizontal', 200, 90, '<path d="M40 10 H160 A30 35 0 0 1 160 80 H40 A30 35 0 0 1 40 10 Z"/><path d="M100 10 V3 M100 80 V87"/>'],
      ['pq-esfera', 'Esfera de GLP', 130, 150, '<circle cx="65" cy="62" r="54"/>' + fino('M11 62 H119', 1.4) + '<path d="M27 100 L20 146 M103 100 L110 146 M50 114 L48 146 M80 114 L82 146"/>'],
      ['pq-silo', 'Silo / tremonha', 110, 180, '<path d="M10 10 H100 V110 L64 150 H46 L10 110 Z"/><path d="M55 150 V176"/>' + fino('M10 110 V176 M100 110 V176', 1.8)],
      ['pq-tqcamisa', 'Tanque com camisa', 120, 180, '<path d="M20 40 A40 20 0 0 1 100 40 V140 A40 20 0 0 1 20 140 Z"/><path d="M20 70 H10 V140 A50 28 0 0 0 110 140 V70 H100"/><path d="M110 82 H118 M2 150 H10 M60 20 V6"/>'],
      ['pq-tqserp', 'Tanque com serpentina', 120, 180, '<path d="M20 40 A40 20 0 0 1 100 40 V140 A40 20 0 0 1 20 140 Z"/>' + fino('M2 70 H30 L90 80 L30 90 L90 100 L30 110 L90 120 L30 130 H2', 1.8) + '<path d="M60 20 V6"/>'],
    ]],
    ['Reatores', [
      ['pq-reator', 'Reator agitado (CSTR)', 120, 200, '<path d="M14 66 A46 20 0 0 1 106 66 V170 A46 20 0 0 1 14 170 Z"/>' + motor(60, 22, 16) + '<path d="M60 38 V150 M40 150 H80 M40 142 V158 M80 142 V158"/>'],
      ['pq-pfr', 'Reator tubular (PFR)', 200, 70, '<rect x="10" y="10" width="180" height="50" rx="6"/><path d="M30 60 L60 10 M60 60 L90 10 M90 60 L120 10 M120 60 L150 10 M150 60 L180 10" stroke-width="1.4"/><path d="M2 35 H10 M190 35 H198"/>'],
      ['pq-leitofixo', 'Reator de leito fixo', 100, 200, '<path d="M14 40 A36 22 0 0 1 86 40 V160 A36 22 0 0 1 14 160 Z"/>' + recheio(14, 86, 60, 140) + '<path d="M50 18 V4 M50 182 V196"/>'],
      ['pq-fluidizado', 'Reator de leito fluidizado', 100, 200, '<path d="M14 40 A36 22 0 0 1 86 40 V160 A36 22 0 0 1 14 160 Z"/>' + nivel(14, 86, 76)
        + fino('M14 150 H86 M22 150 V156 M36 150 V156 M50 150 V156 M64 150 V156 M78 150 V156', 1.6)
        + '<g stroke-width="1.4"><circle cx="28" cy="132" r="4"/><circle cx="46" cy="120" r="5"/><circle cx="68" cy="134" r="4"/><circle cx="36" cy="100" r="5"/><circle cx="62" cy="106" r="4"/><circle cx="74" cy="92" r="3"/><circle cx="50" cy="88" r="3"/></g><path d="M50 18 V4 M50 182 V196"/>'],
      ['pq-reatorcam', 'Reator com camisa', 130, 210, '<path d="M25 70 A40 18 0 0 1 105 70 V160 A40 18 0 0 1 25 160 Z"/><path d="M25 95 H15 V160 A50 26 0 0 0 115 160 V95 H105"/>' + motor(65, 24, 15) + '<path d="M65 39 V146 M47 146 H83 M47 139 V153 M83 139 V153 M115 106 H126 M4 150 H15 M65 186 V206"/>'],
      ['pq-fermentador', 'Biorreator / fermentador', 120, 210, '<path d="M14 66 A46 20 0 0 1 106 66 V170 A46 20 0 0 1 14 170 Z"/>' + motor(60, 22, 16) + '<path d="M60 38 V140 M44 108 H76 M44 102 V114 M76 102 V114 M44 140 H76 M44 134 V146 M76 134 V146"/>' + nivel(14, 106, 84)
        + fino('M2 162 H76') + '<g stroke-width="1.4"><circle cx="34" cy="152" r="3"/><circle cx="52" cy="154" r="3"/><circle cx="70" cy="151" r="3"/><circle cx="88" cy="120" r="3"/><circle cx="30" cy="124" r="3"/></g><path d="M60 190 V206"/>'],
      ['pq-biodigestor', 'Biodigestor', 200, 140, '<path d="M14 136 V70 A86 56 0 0 1 186 70 V136 Z"/>' + nivel(14, 186, 96) + '<path d="M100 14 V2 H140"/>' + T(100, 116, 'CH₄', 18)],
      ...REAT2,
    ]],
    ['Separação por contato', [
      ['pq-coluna', 'Coluna de pratos (destilação)', 80, 260, '<path d="M8 32 A32 24 0 0 1 72 32 V228 A32 24 0 0 1 8 228 Z"/><path d="M8 62 H56 M24 92 H72 M8 122 H56 M24 152 H72 M8 182 H56 M24 212 H72" stroke-width="1.8"/>'],
      ['pq-recheada', 'Coluna recheada', 80, 260, '<path d="M8 32 A32 24 0 0 1 72 32 V228 A32 24 0 0 1 8 228 Z"/>' + recheio(8, 72, 56, 120) + recheio(8, 72, 140, 204)],
      ['pq-absorvedora', 'Absorvedora', 100, 260, '<path d="M18 32 A32 24 0 0 1 82 32 V228 A32 24 0 0 1 18 228 Z"/>' + recheio(18, 82, 70, 190)
        + fino('M2 52 H50 M30 52 V58 M40 52 V58 M50 52 V58 M60 52 V58 M70 52 V58 M50 52 H70', 1.6) + '<path d="M98 210 H86"/>' + head(82, 210, 180) + '<path d="M50 252 V258 M50 8 V2"/>'],
      ['pq-extratora', 'Extratora líquido-líquido', 100, 260, motor(50, 18, 14) + '<path d="M18 40 H82 V250 H18 Z M50 32 V232"/>'
        + fino(serie(6, i => `M36 ${70 + 30 * i} H64`), 2.2) + fino(serie(6, i => `M18 ${85 + 30 * i} H30 M70 ${85 + 30 * i} H82`), 1.8) + '<path d="M82 60 H98 M2 230 H18"/>'],
      ['pq-stripper', 'Esgotadora (stripper)', 100, 240, '<path d="M18 32 A32 24 0 0 1 82 32 V208 A32 24 0 0 1 18 208 Z"/><path d="M18 62 H66 M34 92 H82 M18 122 H66 M34 152 H82 M18 182 H66" stroke-width="1.8"/>'
        + '<path d="M98 50 H86 M2 196 H14"/>' + head(82, 50, 180) + head(18, 196, 0) + '<path d="M50 232 V238 M50 8 V2"/>'],
      ['pq-refervedor', 'Refervedor (kettle)', 200, 110, '<path d="M30 40 H70 L90 12 H170 A18 44 0 0 1 170 100 H90 L70 80 H30 A12 20 0 0 1 30 40 Z"/>' + fino('M30 52 H150 A8 8 0 0 1 150 68 H30', 1.6) + nivel(90, 172, 34) + '<path d="M130 12 V3 M150 100 V108 M60 40 V30 M60 80 V90"/>'],
      ['pq-condensador', 'Condensador', 200, 100, '<path d="M30 25 H175 A18 25 0 0 1 175 75 H30 Z M30 25 H14 V75 H30"/>' + fino('M14 50 H30 M30 40 H165 A10 10 0 0 1 165 60 H30', 1.6) + '<path d="M22 25 V12 M22 75 V88 M120 4 V20 M150 75 V96"/>' + head(120, 25, 90)],
      ['pq-tambor', 'Tambor de refluxo', 200, 112, '<path d="M40 10 H160 A30 35 0 0 1 160 80 H40 A30 35 0 0 1 40 10 Z"/><path d="M120 80 V100 H150 V80 M135 100 V109 M60 10 V3 M180 45 H198"/>' + nivel(14, 186, 50)],
      ['pq-flash', 'Vaso flash (separador)', 110, 180, '<path d="M14 36 A41 22 0 0 1 96 36 V146 A41 22 0 0 1 14 146 Z"/><path d="M14 44 H96 M14 56 H96" stroke-width="1.6"/>' + fino(serie(8, i => `M${16 + 10 * i} 56 L${24 + 10 * i} 44`), 1.4) + nivel(14, 96, 120) + '<path d="M55 14 V4 M55 168 V177 M2 96 H14"/>'],
      ...SEP2,
    ]],
    ['Troca térmica', [
      ['pq-trocador', 'Trocador de calor', 110, 110, '<circle cx="55" cy="55" r="40"/><path d="M4 55 H24 L36 34 L50 76 L62 34 L74 76 L86 55 H106"/>'],
      ['pq-cascotubo', 'Casco e tubo', 210, 90, '<path d="M30 20 H180 A20 25 0 0 1 180 70 H30 A20 25 0 0 1 30 20 Z"/><path d="M30 35 H180 M30 45 H180 M30 55 H180" stroke-width="1.4"/><path d="M60 20 V4 M150 70 V86"/>'],
      ['pq-placas', 'Trocador de placas', 110, 150, '<rect x="20" y="10" width="70" height="130" rx="3"/>' + fino(serie(7, i => `M${31 + 8 * i} 18 V132`), 1.4) + '<path d="M4 30 H20 M4 120 H20 M90 30 H106 M90 120 H106"/>'],
      ['pq-duplotubo', 'Duplo tubo (grampo)', 220, 100, '<path d="M20 10 H170 A40 40 0 0 1 170 90 H20 V70 H170 A20 20 0 0 0 170 30 H20 Z"/>' + fino('M4 20 H170 A30 30 0 0 1 170 80 H4', 1.6) + '<path d="M60 10 V2 M60 90 V98"/>'],
      ['pq-aerorresf', 'Resfriador a ar', 200, 120, '<rect x="10" y="20" width="180" height="30"/>' + fino('M10 30 H190 M10 40 H190', 1.4) + fino('M30 50 L50 68 H150 L170 50', 1.8)
        + '<ellipse cx="80" cy="80" rx="20" ry="6" stroke-width="1.8"/><ellipse cx="120" cy="80" rx="20" ry="6" stroke-width="1.8"/><circle cx="100" cy="80" r="3" fill="#C"/><path d="M100 83 V100 M2 35 H10 M190 35 H198"/><rect x="90" y="100" width="20" height="14" stroke-width="1.8"/>'],
      ['pq-serpentina', 'Serpentina', 120, 80, '<path d="M4 40 H16' + serie(8, i => ` Q${22 + 11 * i} ${i % 2 ? 70 : 10} ${27 + 11 * i} 40`) + ' H116"/>'],
      ['pq-caldeira', 'Caldeira', 150, 150, '<path d="M45 10 H105 A15 15 0 0 1 105 40 H45 A15 15 0 0 1 45 10 Z"/><rect x="20" y="40" width="110" height="102"/>' + fino('M55 40 V76 M95 40 V76', 1.4) + `<g transform="translate(15,6)">${chama}</g>` + '<path d="M75 10 V2"/>'],
      ['pq-forno', 'Forno', 120, 150, '<path d="M14 146 V50 L60 8 L106 50 V146 Z"/>' + chama],
      ['pq-torre', 'Torre de resfriamento', 130, 150, '<path d="M20 146 Q52 80 26 8 H104 Q78 80 110 146 Z"/>' + fino('M44 32 L65 24 L86 32 M44 32 L65 40 L86 32', 1.4)],
      ['pq-evaporador', 'Evaporador', 110, 200, '<path d="M14 36 A41 22 0 0 1 96 36 V146 A41 22 0 0 1 14 146 Z"/><path d="M14 100 H96 M14 140 H96" stroke-width="1.8"/>' + fino(serie(6, i => `M${25 + 12 * i} 100 V140`), 1.4) + '<path d="M96 110 H108 M2 132 H14 M55 14 V4 M55 168 V194"/>'],
      ['pq-aquecedor', 'Aquecedor elétrico', 160, 80, '<path d="M30 14 H130 A16 26 0 0 1 130 66 H30 A16 26 0 0 1 30 14 Z"/>' + fino('M40 40 L48 28 L60 52 L72 28 L84 52 L96 28 L108 52 L116 40', 1.8) + '<path d="M2 40 H14 M146 40 H158"/>' + fino('M70 14 V4 M90 14 V4', 1.8)],
      ...TROCA2,
    ]],
    ['Movimentação de fluidos', [
      ['pq-bomba', 'Bomba centrífuga', 100, 100, '<circle cx="50" cy="48" r="32"/><path d="M50 16 H94 M20 92 H80 L66 74 M20 92 L34 74 M4 48 H18"/>'],
      ['pq-engrenagens', 'Bomba de engrenagens', 100, 100, '<circle cx="50" cy="48" r="32"/>' + '<circle cx="50" cy="36" r="11" stroke-width="1.8"/><circle cx="50" cy="60" r="11" stroke-width="1.8"/><path d="M4 48 H18 M82 48 H96 M20 92 H80 L66 74 M20 92 L34 74"/>'],
      ['pq-dosadora', 'Bomba dosadora (diafragma)', 120, 100, '<circle cx="60" cy="52" r="28"/>' + fino('M60 24 Q46 52 60 80', 1.8) + '<path d="M4 52 H32 M88 52 H116"/>' + fino('M26 92 L94 14', 1.6) + head(98, 10, -48.8)],
      ['pq-compressor', 'Compressor', 110, 90, '<path d="M10 10 L100 28 V62 L10 80 Z"/>'],
      ['pq-soprador', 'Soprador (blower)', 110, 100, '<circle cx="50" cy="55" r="32"/><path d="M50 23 H104 M4 55 H18"/>' + fino('M50 55 V37 M50 55 L66 64 M50 55 L34 64', 1.8) + '<circle cx="50" cy="55" r="3" fill="#C"/>'],
      ['pq-ventilador', 'Ventilador', 100, 100, '<circle cx="50" cy="50" r="36"/><ellipse cx="50" cy="32" rx="8" ry="15" stroke-width="1.8"/><ellipse cx="50" cy="68" rx="8" ry="15" stroke-width="1.8"/><circle cx="50" cy="50" r="4" fill="#C"/><path d="M2 50 H14 M86 50 H98"/>'],
      ['pq-ejetor', 'Ejetor', 180, 80, '<path d="M30 20 L90 32 H110 L170 14 M30 60 L90 48 H110 L170 66 M30 20 V34 M30 46 V60 M70 52 V76"/>' + fino('M4 34 H40 L64 38 M4 46 H40 L64 42', 1.8)],
      ['pq-turbina', 'Turbina', 110, 90, '<path d="M10 28 L100 10 V80 L10 62 Z"/>'],
      ['pq-misturador', 'Misturador estático', 120, 70, '<rect x="10" y="20" width="100" height="30"/><path d="M10 20 L35 50 L60 20 L85 50 L110 20" stroke-width="1.6"/><path d="M2 35 H10 M110 35 H118"/>'],
    ]],
    ['Separação sólido-fluido', [
      ['pq-ciclone', 'Ciclone', 100, 190, '<path d="M14 14 H86 V80 L56 170 H44 L14 80 Z"/><path d="M38 14 V2 M62 14 V2 M86 30 H98"/><path d="M50 170 V186"/>'],
      ['pq-hidrociclone', 'Hidrociclone', 80, 200, '<path d="M14 14 H56 V50 L38 180 H32 L14 50 Z"/><path d="M35 14 V2 M56 30 H76 M35 180 V196"/>'],
      ['pq-filtro', 'Filtro (genérico)', 100, 100, '<rect x="10" y="10" width="80" height="80"/><path d="M10 90 L90 10" stroke-dasharray="8 6"/>'],
      ['pq-filtroprensa', 'Filtro prensa', 220, 110, '<rect x="10" y="10" width="20" height="70"/><rect x="190" y="10" width="20" height="70"/>' + fino('M30 20 H190 M30 70 H190', 1.4)
        + fino(serie(13, i => `M${38 + 11.5 * i} 14 V76`), 3) + '<path d="M20 80 V104 M200 80 V104 M2 45 H10"/>'],
      ['pq-rotativo', 'Filtro rotativo a vácuo', 140, 130, '<circle cx="70" cy="56" r="40"/><path d="M14 64 V96 A56 26 0 0 0 126 96 V64"/>' + nivel(14, 38, 80) + nivel(102, 126, 80)
        + '<path d="M108 42 L134 28"/>' + fino('M50 34 A28 28 0 0 1 92 38', 1.6) + head(94, 41, 55, 10) + '<circle cx="70" cy="56" r="4" fill="#C"/>'],
      ['pq-centrifuga', 'Centrífuga', 120, 130, motor(60, 16, 12) + '<rect x="14" y="36" width="92" height="84"/>' + fino('M28 46 V104 H92 V46', 1.8) + '<path d="M60 28 V104 M106 112 H118"/>'
        + fino('M40 76 A20 6 0 1 0 80 76', 1.6) + head(80, 74, -80, 9)],
      ['pq-peneira', 'Peneira vibratória', 180, 112, '<path d="M20 20 L160 56 V82 L20 46 Z"/><path d="M28 36 L156 69" stroke-dasharray="6 4" stroke-width="1.6"/>'
        + fino('M40 51 L34 58 L46 64 L34 70 L46 76 L34 82 L46 88 L40 104 M140 77 L134 82 L146 86 L134 90 L146 94 L140 104', 1.6) + '<path d="M16 106 H164 M8 6 L22 14"/>'],
      ['pq-decantador', 'Decantador (espessador)', 200, 100, '<path d="M8 10 V60 L100 92 L192 60 V10"/>' + nivel(8, 192, 26) + fino('M90 4 V40 H110 V4 M100 4 V80 M60 72 L100 80 L140 72', 1.6)],
      ['pq-flotador', 'Flotador', 200, 110, '<path d="M8 20 V100 H192 V20"/>' + nivel(8, 192, 34) + '<path d="M100 4 V84 M86 84 H114 M192 28 H198"/>'
        + '<g stroke-width="1.4">' + serie(8, i => `<circle cx="${24 + 22 * i}" cy="28" r="4"/>`) + '<circle cx="70" cy="64" r="3"/><circle cx="130" cy="58" r="3"/><circle cx="82" cy="48" r="3"/><circle cx="150" cy="74" r="3"/><circle cx="44" cy="76" r="3"/></g>'],
    ]],
    ['Sólidos e secagem', [
      ['pq-moinho', 'Moinho de bolas', 200, 110, '<path d="M30 20 H170 V90 H30 Z M30 20 L10 45 V65 L30 90 M170 20 L190 45 V65 L170 90"/>'
        + '<g stroke-width="1.6">' + [[50, 78], [66, 80], [82, 79], [98, 80], [114, 79], [130, 80], [146, 78], [58, 66], [74, 67], [90, 66], [106, 67], [122, 66], [138, 67]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6"/>`).join('') + '</g><path d="M2 55 H10 M190 55 H198"/>'],
      ['pq-britador', 'Britador de mandíbulas', 120, 140, `<path d="${serra(16, 10, 50, 112, 6, 7)}"/><path d="${serra(104, 10, 70, 112, 6, -7)}"/>` + '<circle cx="104" cy="10" r="5" stroke-width="1.8"/><path d="M60 116 V128"/>' + head(60, 136, 90)],
      ['pq-secador', 'Secador rotativo', 220, 110, '<g transform="rotate(8 110 50)"><rect x="20" y="30" width="180" height="40" rx="4"/><path d="M60 22 V78 M160 22 V78" stroke-width="4"/>' + fino(serie(8, i => `M${32 + 20 * i} 38 l8 6`), 1.4) + '</g>'
        + '<circle cx="60" cy="96" r="6" stroke-width="1.8"/><circle cx="160" cy="104" r="6" stroke-width="1.8"/><path d="M2 20 H22 M200 80 H218"/>'],
      ['pq-spray', 'Secador spray', 120, 200, '<path d="M14 30 H106 V110 L70 170 H50 L14 110 Z"/><path d="M60 4 V42 M60 170 V196 M2 40 H14 M106 100 H118"/>' + fino('M60 42 L36 74 M60 42 L48 80 M60 42 L60 82 M60 42 L72 80 M60 42 L84 74', 1.4)],
      ['pq-cristalizador', 'Cristalizador', 120, 200, '<path d="M14 60 A46 18 0 0 1 106 60 V140 L66 180 H54 L14 140 Z"/>' + motor(60, 22, 15) + '<path d="M60 37 V128 M44 128 H76 M60 180 V196"/>' + fino('M40 74 V118 M80 74 V118', 1.6) + fino(cristal(20, 100) + cristal(88, 96) + cristal(22, 128) + cristal(90, 128) + cristal(50, 150) + cristal(66, 156), 1.4)],
      ['pq-correia', 'Transportador de correia', 220, 80, '<circle cx="24" cy="50" r="14"/><circle cx="196" cy="50" r="14"/><path d="M24 36 H196 M24 64 H196"/><circle cx="24" cy="50" r="3" fill="#C"/><circle cx="196" cy="50" r="3" fill="#C"/>' + fino('M56 36 Q70 20 84 36 M116 36 Q130 20 144 36', 1.8)],
      ['pq-rosca', 'Rosca transportadora', 220, 72, '<rect x="10" y="15" width="200" height="40"/>' + fino('M10 35 H210', 1.6) + fino(serie(12, i => `M${20 + 15.5 * i} 19 L${32 + 15.5 * i} 51`), 1.6) + '<path d="M30 15 V3 M190 55 V68"/>'],
      ['pq-misturadorv', 'Misturador de sólidos (V)', 140, 150, '<path d="M14 20 L58 120 H82 L126 20 L102 10 L70 80 L38 10 Z"/><path d="M20 144 V96 H32 M120 144 V96 H108 M70 120 V134"/>' + '<path d="M32 96 H108" stroke-dasharray="6 5" stroke-width="1.4"/>'],
    ]],
    ['Válvulas e instrumentos', [
      ['pq-valvula', 'Válvula', 100, 40, bow(50, 20) + pipe(50, 20)],
      ['pq-controle', 'Válvula de controle', 100, 90, bow(50, 70) + pipe(50, 70) + '<path d="M50 70 V36 M28 36 A22 22 0 0 1 72 36 Z"/>'],
      ['pq-retencao', 'Válvula de retenção', 100, 40, bow(50, 20) + pipe(50, 20) + '<path d="M18 4 L82 36" stroke-width="1.6"/>' + head(82, 36, 27, 12)],
      ['pq-alivio', 'Válvula de alívio / segurança', 90, 110, '<path d="M30 70 L60 50 V90 Z M30 70 L10 40 H50 Z"/><path d="M30 70 H86 M30 40 V8"/><path d="M30 34 L20 30 L40 24 L20 18 L40 12 L30 8" stroke-width="1.6"/>'],
      ['pq-3vias', 'Válvula de três vias', 100, 80, bow(50, 24) + pipe(50, 24) + '<path d="M50 24 L34 56 H66 Z M50 56 V76"/>'],
      ['pq-vesfera', 'Válvula esfera', 100, 40, bow(50, 20) + pipe(50, 20) + '<circle cx="50" cy="20" r="6" fill="#C"/>'],
      ['pq-instr', 'Instrumento (campo)', 60, 60, '<circle cx="30" cy="30" r="25"/>' + T(30, 30, 'TI', 18)],
      ['pq-instrpainel', 'Instrumento (painel)', 60, 60, '<circle cx="30" cy="30" r="25"/><path d="M5 30 H55" stroke-width="1.8"/>' + T(30, 19, 'FIC', 13) + T(30, 42, '101', 12)],
      ['pq-sinal', 'Linha de sinal elétrico', 160, 30, '<path d="M4 15 H146" stroke-dasharray="10 6" stroke-width="1.8"/>' + head(156, 15, 0)],
      ['pq-sinalpn', 'Linha de sinal pneumático', 160, 30, '<path d="M4 15 H146" stroke-width="1.8"/>' + fino('M50 24 L58 6 M60 24 L68 6 M100 24 L108 6 M110 24 L118 6', 1.6) + head(156, 15, 0)],
    ]],
    ...NOVAS_SECOES,
  ],
};
