// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Música e artes: claves, figuras, pausas, compassos, acidentes, dinâmica, teclado, cifras, instrumentos e som.
import { T, head } from './base.js';

// prefixo dos ids: 'mus-'
// Desenhos próprios do Giz Livre, feitos à mão com coordenadas próprias; nenhuma fonte musical (Bravura/SMuFL etc.) copiada.
// Escala: entrelinha de 10 px, a mesma da folha "Pauta musical" da lousa; notas, pausas, claves e acidentes entram
// a 100% já no tamanho da pauta (pauta de 5 linhas = 40 px de altura).

const S = 10;                       // entrelinha
const r2 = v => +v.toFixed(2);
const fino = (d, w = 1.6) => `<path d="${d}" stroke-width="${w}"/>`;
const cheio = d => `<path d="${d}" fill="#C" stroke="none"/>`;
const dot = (x, y, r = 2.5) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r}" fill="#C" stroke="none"/>`;
// texto em serifa (números de compasso, dinâmica e indicações)
const SERIF = 'font-family="Georgia, Times New Roman, serif" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#C" stroke="none"';
const N = (x, y, s, size = 26) => `<text x="${x}" y="${y}" font-size="${size}" ${SERIF}>${s}</text>`;
const I = (x, y, s, size = 30) => `<text x="${x}" y="${y}" font-size="${size}" font-style="italic" ${SERIF}>${s}</text>`;
const t = (x, y, s, size = 11) => T(r2(x), r2(y), s, size);

// pauta de n linhas a partir de y0
const pauta = (x1, x2, y0, n = 5) => fino(Array.from({ length: n }, (_, i) => `M${x1},${y0 + i * S} H${x2}`).join(' '), 1.2);
// elipse (rx, ry, girada rot graus) como subcaminho, para montar cabeças vazadas com evenodd
const elip = (cx, cy, rx, ry, rot = 0) => {
  const a = rot * Math.PI / 180, dx = r2(rx * Math.cos(a)), dy = r2(rx * Math.sin(a));
  return `M${r2(cx - dx)},${r2(cy - dy)} a${rx},${ry} ${rot} 1,0 ${r2(2 * dx)},${r2(2 * dy)} a${rx},${ry} ${rot} 1,0 ${r2(-2 * dx)},${r2(-2 * dy)} Z`;
};
// cabeças de nota (centro cx, cy)
const cabCheia = (cx, cy) => cheio(elip(cx, cy, 6.2, 4.3, -20));
const cabVazia = (cx, cy) => `<path d="${elip(cx, cy, 6.2, 4.3, -20)} ${elip(cx, cy, 4.6, 1.9, -35)}" fill="#C" fill-rule="evenodd" stroke="none"/>`;
const cabSemibreve = (cx, cy) => `<path d="${elip(cx, cy, 7.6, 5, 0)} ${elip(cx, cy, 3.4, 2.4, 60)}" fill="#C" fill-rule="evenodd" stroke="none"/>`;
// colchete (bandeirola) cheio preso à haste em (x, y)
const flagUp = (x, y) => cheio(`M${x},${y} C${x + 1},${y + 7} ${x + 11},${y + 10} ${x + 9},${y + 22} C${x + 9},${y + 15} ${x + 5},${y + 12} ${x},${y + 9} Z`);
const flagDown = (x, y) => cheio(`M${x},${y} C${x + 1},${y - 7} ${x + 11},${y - 10} ${x + 9},${y - 22} C${x + 9},${y - 15} ${x + 5},${y - 12} ${x},${y - 9} Z`);
// comprimento da haste conforme o número de colchetes
const hasteL = nb => 34 + Math.max(0, nb - 2) * 8;
// figura n: 0 semibreve, 1 mínima, 2 semínima, 3 colcheia, 4 semicolcheia, 5 fusa, 6 semifusa
const figura = (cx, cy, n, up = true, L) => {
  if (n === 0) return cabSemibreve(cx, cy);
  const nb = Math.max(0, n - 2); L = L || hasteL(nb);
  const x = r2(up ? cx + 5.6 : cx - 5.6), yt = up ? cy - L : cy + L;
  let s = (n >= 2 ? cabCheia(cx, cy) : cabVazia(cx, cy)) + fino(`M${x},${up ? cy - 1 : cy + 1} V${yt}`, 1.7);
  for (let i = 0; i < nb; i++) s += up ? flagUp(x, yt + 7 * i) : flagDown(x, yt - 7 * i);
  return s;
};
const notaShape = (id, nome, n, up = true) => {
  const L = n === 0 ? 0 : hasteL(Math.max(0, n - 2));
  if (n === 0) return [id, nome, 26, 18, figura(13, 9, 0)];
  const w = n >= 3 ? 34 : 26, h = L + 14;
  return up ? [id, nome, w, h, figura(11, L + 6, n, true)] : [id, nome, w, h, figura(13, 8, n, false)];
};
// barra de ligação (feixe) entre hastes
const feixe = (x1, x2, y, e = 5) => cheio(`M${x1 - 0.8},${y} H${x2 + 0.8} V${y + e} H${x1 - 0.8} Z`);

// ---------- claves ----------
// clave de sol: (x, y) = centro da espiral, sobre a 2ª linha (Sol)
const claveSol = (x, y) => `<path d="M${x + 1},${y + 4} C${x - 5},${y + 4} ${x - 6},${y - 5} ${x},${y - 7} C${x + 8},${y - 9} ${x + 12},${y + 1} ${x + 9},${y + 7} C${x + 5},${y + 15} ${x - 10},${y + 15} ${x - 13},${y + 5} C${x - 16},${y - 6} ${x - 6},${y - 16} ${x + 2},${y - 24} C${x + 10},${y - 32} ${x + 10},${y - 46} ${x + 4},${y - 48} C${x - 2},${y - 50} ${x - 5},${y - 38} ${x - 4},${y - 30} L${x + 4},${y + 22} C${x + 5},${y + 30} ${x - 4},${y + 33} ${x - 7},${y + 27}" stroke-width="2.3"/>` + dot(x - 5.5, y + 26, 3.6);
// clave de fá: (x, y) = bolinha sobre a 4ª linha (Fá)
const claveFa = (x, y) => dot(x + 3, y, 4) + `<path d="M${x + 1},${y - 2} C${x + 1},${y - 10} ${x + 10},${y - 13} ${x + 16},${y - 11} C${x + 24},${y - 8} ${x + 25},${y + 3} ${x + 21},${y + 10} C${x + 16},${y + 19} ${x + 6},${y + 26} ${x - 1},${y + 30}" stroke-width="2.8"/>` + dot(x + 31, y - 5, 2.6) + dot(x + 31, y + 5, 2.6);
// clave de dó: (x, y) = ponto central, sobre a linha do Dó
const lobo = (x, y, s) => `<path d="M${x + 9},${y} L${x + 14},${y - 6 * s} C${x + 18},${y - 2 * s} ${x + 28},${y - 6 * s} ${x + 28},${y - 13 * s} C${x + 28},${y - 21 * s} ${x + 19},${y - 24 * s} ${x + 16},${y - 18 * s}" stroke-width="2.2"/>` + dot(x + 18, y - 17 * s, 2.8);
const claveDo = (x, y) => cheio(`M${x},${y - 22} H${x + 5} V${y + 22} H${x} Z`) + fino(`M${x + 9},${y - 22} V${y + 22}`, 1.8) + lobo(x, y, 1) + lobo(x, y, -1);

// ---------- acidentes (centro cx, cy) ----------
const sust = (cx, cy) => fino(`M${cx - 3},${cy - 13} V${cy + 15} M${cx + 3},${cy - 15} V${cy + 13}`, 1.6) + fino(`M${cx - 7},${cy - 3} L${cx + 7},${cy - 7} M${cx - 7},${cy + 7} L${cx + 7},${cy + 3}`, 3.2);
const bemol = (cx, cy) => fino(`M${cx - 4},${cy - 20} V${cy + 6}`, 1.8) + `<path d="M${cx - 4},${cy + 6} C${cx + 4},${cy + 1} ${cx + 8},${cy - 6} ${cx + 2},${cy - 6} C${cx - 1},${cy - 6} ${cx - 4},${cy - 3} ${cx - 4},${cy - 1}" stroke-width="2.4"/>`;
const bequadro = (cx, cy) => fino(`M${cx - 4},${cy - 16} V${cy + 6} M${cx + 4},${cy - 6} V${cy + 16}`, 1.6) + fino(`M${cx - 4},${cy - 3} L${cx + 4},${cy - 6} M${cx - 4},${cy + 6} L${cx + 4},${cy + 3}`, 3.2);

// ---------- pausas ----------
const pausaFlag = nb => { // colcheia (1) a semifusa (4)
  const L = 10 * nb + 14, xt = r2(18.2 + 2.8 * (nb - 1)), xb = r2(xt - 0.28 * L);
  let s = fino(`M${xt},6 L${xb},${6 + L}`, 2);
  for (let i = 0; i < nb; i++) {
    const px = r2(xt - 2.8 * i), py = 6 + 10 * i, dx = r2(px - 11), dy = py + 3;
    s += dot(dx, dy, 3.2) + fino(`M${dx},${dy + 2} C${dx + 3},${dy + 6} ${r2(px - 4)},${py + 5} ${px},${py}`, 1.8);
  }
  return [Math.ceil(xt + 5), 12 + L, s];
};

// ---------- teclado ----------
const PRETAS = [0, 1, 3, 4, 5];   // brancas seguidas de uma preta (Dó, Ré, Fá, Sol, Lá)
const teclado = (oit, w, h, nomes) => {
  const n = 7 * oit, x0 = 4, y0 = 4, W = n * w, bw = w * 0.6, bh = h * 0.62;
  let s = `<rect x="${x0}" y="${y0}" width="${W}" height="${h}" rx="2"/>` + fino(Array.from({ length: n - 1 }, (_, i) => `M${x0 + (i + 1) * w},${y0} V${y0 + h}`).join(' '), 1.5);
  for (let i = 0; i < n - 1; i++) if (PRETAS.includes(i % 7)) {
    s += `<rect x="${r2(x0 + (i + 1) * w - bw / 2)}" y="${y0}" width="${r2(bw)}" height="${r2(bh)}" rx="1.5" fill="#C" stroke="none"/>`;
  }
  if (nomes) nomes.forEach((nm, i) => { for (let o = 0; o < oit; o++) s += t(x0 + (7 * o + i + 0.5) * w, y0 + h - 11, nm, w > 20 ? 11 : 10); });
  return [W + 8, h + 8, s];
};

// ---------- diagrama de acorde (violão) ----------
// spec: 6 caracteres da 6ª corda (Mi grave) à 1ª: 'x' abafada, '0' solta, '1'..'5' casa; pestana = casa da pestana
const acorde = (id, nome, cifra, spec, pestana) => {
  const xs = j => 14 + 12 * j, top = 36, cas = 18;
  let s = fino(`M14,${top} H74`, 4.5) + fino(Array.from({ length: 6 }, (_, j) => `M${xs(j)},${top} V${top + 5 * cas}`).join(' '), 1.4)
    + fino(Array.from({ length: 5 }, (_, k) => `M14,${top + (k + 1) * cas} H74`).join(' '), 1.6);
  if (cifra) s += N(44, 12, cifra, 16);
  if (spec) [...spec].forEach((c, j) => {
    const x = xs(j);
    if (c === 'x') s += fino(`M${x - 3.5},24.5 L${x + 3.5},31.5 M${x + 3.5},24.5 L${x - 3.5},31.5`, 1.6);
    else if (c === '0') s += `<circle cx="${x}" cy="28" r="3.6" stroke-width="1.6"/>`;
    else if (+c !== pestana) s += dot(x, top + cas * (+c - 0.5), 5);
  });
  if (pestana) s += `<rect x="9" y="${top + cas * (pestana - 0.5) - 4.5}" width="70" height="9" rx="4.5" fill="#C" stroke="none"/>`;
  return [id, nome, 88, 134, s];
};

// ---------- som: curvas amostradas ----------
const curva = (f, x1, x2, n = 120) => 'M' + Array.from({ length: n + 1 }, (_, i) => { const x = x1 + (x2 - x1) * i / n; return `${r2(x)},${r2(f(x))}`; }).join(' L');
const seno = (x1, x2, yc, A, per, n) => curva(x => yc - A * Math.sin(2 * Math.PI * (x - x1) / per), x1, x2, n);

// ---------- figuras compostas ----------
const arvore = () => {
  let s = figura(127, 12, 0);
  const rows = [[67, 187], [37, 97, 157, 217], [22, 52, 82, 112, 142, 172, 202, 232]], ys = [72, 128, 184], ns = [1, 2, 3];
  rows.forEach((r, k) => r.forEach(x => { s += figura(x, ys[k], ns[k], true, k === 2 ? 30 : 32); }));
  const lig = (px, py, xs, cy, L) => xs.forEach(x => { s += fino(`M${px},${py} L${x + 5.6},${cy - L - 3}`, 1); });
  lig(127, 19, [67, 187], 72, 32);
  [[67, [37, 97]], [187, [157, 217]]].forEach(([p, f]) => lig(p, 79, f, 128, 32));
  [[37, [22, 52]], [97, [82, 112]], [157, [142, 172]], [217, [202, 232]]].forEach(([p, f]) => lig(p, 135, f, 184, 30));
  return s;
};

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "mus-pauta-analise",
        "Pauta ampliada — análise preenchível",
        500,
        220,
        "<text x=\"250\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pauta ampliada — anotar alturas e ritmo</text><path d=\"M20 70 H480\" stroke-width=\"1.5\"/><path d=\"M20 90 H480\" stroke-width=\"1.5\"/><path d=\"M20 110 H480\" stroke-width=\"1.5\"/><path d=\"M20 130 H480\" stroke-width=\"1.5\"/><path d=\"M20 150 H480\" stroke-width=\"1.5\"/><path d=\"M20 70 V150 M250 70 V150 M480 70 V150\"/><text x=\"250\" y=\"192\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Compasso: ____  Clave: ____</text>"
      ],
      [
        "mus-ritmo-contagem",
        "Ritmo — contagem por pulsos",
        520,
        224,
        "<text x=\"260\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Ritmo — contagem por pulsos</text><rect x=\"10\" y=\"42\" width=\"500\" height=\"178\" rx=\"3\"/><text x=\"72.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pulso</text><text x=\"197.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Figura</text><path d=\"M135 42 V220\"/><text x=\"322.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Duração</text><path d=\"M260 42 V220\"/><text x=\"447.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Sílaba</text><path d=\"M385 42 V220\"/><path d=\"M10 68 H510\"/><path d=\"M10 106 H510\"/><path d=\"M10 144 H510\"/><path d=\"M10 182 H510\"/>"
      ]
    ]
  ]
];

export default {
  id: 'musica',
  nome: 'Música',
  destaques: ['mus-pauta-sol', 'mus-clave-sol', 'mus-clave-fa', 'mus-semibreve', 'mus-minima', 'mus-seminima', 'mus-colcheia',
    'mus-colcheias', 'mus-pausa-seminima', 'mus-compasso-4-4', 'mus-barra-final', 'mus-ritornelo-fim', 'mus-sustenido', 'mus-bemol',
    'mus-teclado-1-nomes', 'mus-acorde-vazio'],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Claves e pauta', [
      ['mus-pauta', 'Trecho de pauta', 200, 56, pauta(4, 196, 8)],
      ['mus-pauta-sol', 'Pauta com clave de sol', 160, 94, pauta(4, 156, 24) + claveSol(22, 54)],
      ['mus-pauta-fa', 'Pauta com clave de fá', 160, 76, pauta(4, 156, 24) + claveFa(10, 34)],
      ['mus-pauta-do', 'Pauta com clave de dó', 160, 76, pauta(4, 156, 24) + claveDo(10, 44)],
      ['mus-sistema-piano', 'Pauta dupla (piano) com chave', 200, 154, pauta(20, 196, 24) + pauta(20, 196, 104)
        + fino('M20,24 V144', 1.6) + cheio('M15,22 C5,30 15,64 5,84 C15,104 5,138 15,146 C9,136 19,104 9,84 C19,64 9,32 15,22 Z')
        + claveSol(40, 54) + claveFa(28, 114)],
      ['mus-clave-sol', 'Clave de sol', 40, 92, claveSol(21, 52)],
      ['mus-clave-fa', 'Clave de fá', 44, 54, claveFa(6, 18)],
      ['mus-clave-do', 'Clave de dó', 40, 56, claveDo(6, 28)],
      ['mus-linha-suplementar', 'Dó central (linha suplementar)', 80, 66, pauta(4, 76, 8) + fino('M26,58 H50', 1.6) + figura(38, 58, 2)],
    ]],
    ['Figuras e pausas', [
      notaShape('mus-semibreve', 'Semibreve', 0),
      notaShape('mus-minima', 'Mínima', 1),
      notaShape('mus-seminima', 'Semínima', 2),
      notaShape('mus-colcheia', 'Colcheia', 3),
      notaShape('mus-semicolcheia', 'Semicolcheia', 4),
      notaShape('mus-fusa', 'Fusa', 5),
      notaShape('mus-semifusa', 'Semifusa', 6),
      notaShape('mus-minima-baixo', 'Mínima (haste para baixo)', 1, false),
      notaShape('mus-seminima-baixo', 'Semínima (haste para baixo)', 2, false),
      notaShape('mus-colcheia-baixo', 'Colcheia (haste para baixo)', 3, false),
      ['mus-cabeca-cheia', 'Cabeça de nota cheia', 18, 14, cabCheia(9, 7)],
      ['mus-cabeca-vazia', 'Cabeça de nota vazia', 18, 14, cabVazia(9, 7)],
      ['mus-colcheias', 'Duas colcheias ligadas', 50, 54, figura(10, 46, 2) + figura(36, 46, 2) + feixe(15.6, 41.6, 8)],
      ['mus-semicolcheias', 'Quatro semicolcheias ligadas', 92, 54, [10, 32, 54, 76].map(x => figura(x, 46, 2)).join('') + feixe(15.6, 81.6, 8) + feixe(15.6, 81.6, 16)],
      ['mus-colcheia-2semi', 'Colcheia e duas semicolcheias', 72, 54, [10, 32, 54].map(x => figura(x, 46, 2)).join('') + feixe(15.6, 59.6, 8) + feixe(37.6, 59.6, 16)],
      ['mus-quialtera', 'Quiáltera (tercina)', 72, 62, [12, 34, 56].map(x => figura(x, 54, 2)).join('') + feixe(17.6, 61.6, 16)
        + fino('M14,12 V6 H30 M50,6 H66 V12', 1.4) + N(40, 7, '3', 14)],
      ['mus-seminima-pontuada', 'Semínima pontuada', 30, 48, figura(11, 40, 2) + dot(23, 38, 2.5)],
      ['mus-minima-pontuada', 'Mínima pontuada', 30, 48, figura(11, 40, 1) + dot(23, 38, 2.5)],
      ['mus-ligadura-valor', 'Ligadura de valor (duas notas)', 58, 60, figura(12, 40, 2) + figura(46, 40, 2)
        + cheio('M13,48 C21,57 37,57 45,48 C37,53 21,53 13,48 Z')],
      ['mus-ligadura', 'Ligadura (curva)', 100, 28, `<path d="M4,6 C24,28 76,28 96,6 C76,22 24,22 4,6 Z" fill="#C" stroke="#C" stroke-width="1"/>`],
      ['mus-pausa-semibreve', 'Pausa de semibreve', 34, 22, fino('M4,8 H30', 1.4) + cheio('M10,8 H24 V14 H10 Z')],
      ['mus-pausa-minima', 'Pausa de mínima', 34, 22, fino('M4,14 H30', 1.4) + cheio('M10,8 H24 V14 H10 Z')],
      ['mus-pausa-seminima', 'Pausa de semínima', 26, 44, '<path d="M10,4 L18,13 L11,21 L19,30 C12,27 8,33 14,39" stroke-width="3.2"/>'],
      ['mus-pausa-colcheia', 'Pausa de colcheia', ...pausaFlag(1)],
      ['mus-pausa-semicolcheia', 'Pausa de semicolcheia', ...pausaFlag(2)],
      ['mus-pausa-fusa', 'Pausa de fusa', ...pausaFlag(3)],
      ['mus-pausa-semifusa', 'Pausa de semifusa', ...pausaFlag(4)],
      ['mus-arvore', 'Árvore dos valores (semibreve a colcheia)', 260, 192, arvore()],
    ]],
    ['Compassos e barras', [
      ['mus-compasso-2-4', 'Compasso 2/4', 34, 60, N(17, 17, '2', 22) + N(17, 41, '4', 22)],
      ['mus-compasso-3-4', 'Compasso 3/4', 34, 60, N(17, 17, '3', 22) + N(17, 41, '4', 22)],
      ['mus-compasso-4-4', 'Compasso 4/4', 34, 60, N(17, 17, '4', 22) + N(17, 41, '4', 22)],
      ['mus-compasso-2-2', 'Compasso 2/2', 34, 60, N(17, 17, '2', 22) + N(17, 41, '2', 22)],
      ['mus-compasso-3-8', 'Compasso 3/8', 34, 60, N(17, 17, '3', 22) + N(17, 41, '8', 22)],
      ['mus-compasso-6-8', 'Compasso 6/8', 34, 60, N(17, 17, '6', 22) + N(17, 41, '8', 22)],
      ['mus-compasso-c', 'Compasso C (quaternário)', 32, 46, '<path d="M25,14 C22,7 8,6 7,23 C7,37 19,41 26,32" stroke-width="3.6"/>' + dot(23, 15, 2.6)],
      ['mus-compasso-c-cortado', 'C cortado (alla breve)', 32, 52, '<path d="M25,17 C22,10 8,9 7,26 C7,40 19,44 26,35" stroke-width="3.6"/>' + dot(23, 18, 2.6) + fino('M16,4 V48', 2)],
      ['mus-barra', 'Barra de compasso', 12, 48, fino('M6,4 V44', 1.8)],
      ['mus-barra-dupla', 'Barra dupla', 18, 48, fino('M5,4 V44 M12,4 V44', 1.8)],
      ['mus-barra-final', 'Barra final', 22, 48, fino('M5,4 V44', 1.8) + cheio('M11,4 H17 V44 H11 Z')],
      ['mus-ritornelo-inicio', 'Ritornelo (início)', 28, 48, cheio('M4,4 H10 V44 H4 Z') + fino('M15,4 V44', 1.8) + dot(22, 19, 2.6) + dot(22, 29, 2.6)],
      ['mus-ritornelo-fim', 'Ritornelo (fim)', 28, 48, dot(6, 19, 2.6) + dot(6, 29, 2.6) + fino('M13,4 V44', 1.8) + cheio('M18,4 H24 V44 H18 Z')],
      ['mus-casa-1', 'Casa 1', 100, 34, fino('M4,30 V6 H96 V30', 1.8) + N(16, 19, '1.', 14)],
      ['mus-casa-2', 'Casa 2', 100, 34, fino('M4,30 V6 H96', 1.8) + N(16, 19, '2.', 14)],
      ['mus-casas', 'Casas 1 e 2 (ritornelo)', 206, 72, pauta(4, 202, 24) + fino('M100,24 V64', 1.8) + dot(88, 39, 2.6) + dot(88, 49, 2.6)
        + fino('M94,24 V64', 1.8) + cheio('M98,24 H103 V64 H98 Z') + fino('M8,18 V4 H98 V18 M106,18 V4 H198', 1.6) + N(18, 12, '1.', 12) + N(116, 12, '2.', 12)],
    ]],
    ['Acidentes e armaduras', [
      ['mus-sustenido', 'Sustenido', 22, 40, sust(11, 20)],
      ['mus-bemol', 'Bemol', 22, 38, bemol(9, 26)],
      ['mus-bequadro', 'Bequadro', 22, 40, bequadro(11, 20)],
      ['mus-dobrado-sustenido', 'Dobrado sustenido', 26, 26, fino('M7,7 L19,19 M19,7 L7,19', 2.2)
        + cheio('M3,3 H9 V9 H3 Z M17,3 H23 V9 H17 Z M3,17 H9 V23 H3 Z M17,17 H23 V23 H17 Z')],
      ['mus-dobrado-bemol', 'Dobrado bemol', 34, 38, bemol(9, 26) + bemol(21, 26)],
      ...[['mus-armadura-1s', '1 sustenido (Sol M / Mi m)', 's', [24]], ['mus-armadura-2s', '2 sustenidos (Ré M / Si m)', 's', [24, 39]],
        ['mus-armadura-3s', '3 sustenidos (Lá M / Fá♯ m)', 's', [24, 39, 19]], ['mus-armadura-1b', '1 bemol (Fá M / Ré m)', 'b', [44]],
        ['mus-armadura-2b', '2 bemóis (Si♭ M / Sol m)', 'b', [44, 29]], ['mus-armadura-3b', '3 bemóis (Mi♭ M / Dó m)', 'b', [44, 29, 49]]]
        .map(([id, nm, tp, ys]) => {
          const w = 52 + 16 * ys.length + 10;
          return [id, 'Armadura: ' + nm, w, 94, pauta(4, w - 4, 24) + claveSol(22, 54) + ys.map((y, i) => (tp === 's' ? sust : bemol)(52 + 16 * i, y)).join('')];
        }),
    ]],
    ['Dinâmica, articulação e repetição', [
      ['mus-pp', 'Pianíssimo (pp)', 46, 40, I(23, 18, 'pp')],
      ['mus-p', 'Piano (p)', 30, 40, I(15, 18, 'p')],
      ['mus-mp', 'Mezzo piano (mp)', 52, 40, I(26, 18, 'mp')],
      ['mus-mf', 'Mezzo forte (mf)', 59, 45, "<g transform=\"translate(1.74 4.50)\">" + (I(24, 18, 'mf')) + "</g>"],
      ['mus-f', 'Forte (f)', 30, 40, I(15, 18, 'f')],
      ['mus-ff', 'Fortíssimo (ff)', 42, 40, I(21, 18, 'ff')],
      ['mus-sfz', 'Sforzando (sfz)', 56, 40, I(28, 18, 'sfz')],
      ['mus-crescendo', 'Crescendo (forquilha)', 120, 32, fino('M116,4 L4,16 L116,28', 2)],
      ['mus-decrescendo', 'Decrescendo (forquilha)', 120, 32, fino('M4,4 L116,16 L4,28', 2)],
      ['mus-staccato', 'Staccato (sobre a nota)', 28, 60, figura(13, 22, 2, false) + dot(13, 9, 2.6)],
      ['mus-acento', 'Acento (sobre a nota)', 28, 60, figura(13, 22, 2, false) + fino('M5,4 L21,9 L5,14', 2)],
      ['mus-tenuto', 'Tenuto (sobre a nota)', 28, 60, figura(13, 22, 2, false) + fino('M6,9 H20', 2.8)],
      ['mus-fermata', 'Fermata', 52, 36, cheio('M4,30 C4,2 48,2 48,30 C46,10 6,10 4,30 Z') + dot(26, 26, 3.4)],
      ['mus-trinado', 'Trinado (tr)', 90, 36, I(16, 18, 'tr', 24) + fino(curva(x => 18 - 4 * Math.sin((x - 34) * Math.PI / 6), 34, 86, 60), 1.8)],
      ['mus-respiracao', 'Respiração (vírgula)', 20, 30, cheio('M10,8 m-4,0 a4,4 0 1,1 8,0 C14,16 10,22 6,26 C8,20 9,16 8,12 C7,12 6,10 6,8 Z')],
      ['mus-dc', 'Da Capo (D.C.)', 60, 34, I(30, 17, 'D.C.', 22)],
      ['mus-ds', 'Dal Segno (D.S.)', 60, 34, I(30, 17, 'D.S.', 22)],
      ['mus-fine', 'Fine', 54, 34, I(27, 17, 'Fine', 22)],
      ['mus-dc-fine', 'D.C. al Fine', 134, 34, I(67, 17, 'D.C. al Fine', 20)],
      ['mus-coda', 'Coda', 48, 48, '<ellipse cx="24" cy="24" rx="12" ry="15" stroke-width="2.8"/>' + fino('M24,3 V45 M3,24 H45', 2)],
      ['mus-segno', 'Segno', 40, 50, '<path d="M28,10 C22,3 9,6 11,15 C13,23 28,22 29,33 C30,43 15,46 10,38" stroke-width="3"/>' + fino('M8,44 L32,6', 2) + dot(8, 24, 2.8) + dot(32, 26, 2.8)],
    ]],
    ['Teclado, cifras e escalas', [
      ['mus-teclado-1', 'Teclado (1 oitava)', ...teclado(1, 24, 110)],
      ['mus-teclado-1-nomes', 'Teclado com nomes (Dó a Si)', ...teclado(1, 24, 110, ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'])],
      ['mus-teclado-2', 'Teclado (2 oitavas)', ...teclado(2, 18, 100)],
      ['mus-teclado-2-cifras', 'Teclado com cifras (C a B)', ...teclado(2, 18, 100, ['C', 'D', 'E', 'F', 'G', 'A', 'B'])],
      acorde('mus-acorde-vazio', 'Diagrama de acorde (vazio)'),
      acorde('mus-acorde-c', 'Acorde C (Dó maior)', 'C', 'x32010'),
      acorde('mus-acorde-d', 'Acorde D (Ré maior)', 'D', 'xx0232'),
      acorde('mus-acorde-e', 'Acorde E (Mi maior)', 'E', '022100'),
      acorde('mus-acorde-f', 'Acorde F (Fá maior, pestana)', 'F', '133211', 1),
      acorde('mus-acorde-g', 'Acorde G (Sol maior)', 'G', '320003'),
      acorde('mus-acorde-a', 'Acorde A (Lá maior)', 'A', 'x02220'),
      acorde('mus-acorde-am', 'Acorde Am (Lá menor)', 'Am', 'x02210'),
      acorde('mus-acorde-em', 'Acorde Em (Mi menor)', 'Em', '022000'),
      acorde('mus-acorde-dm', 'Acorde Dm (Ré menor)', 'Dm', 'xx0231'),
      ['mus-braco-violao', 'Braço do violão (12 casas)', 262, 74, (() => {
        const fx = k => r2(8 + 490 * (1 - Math.pow(2, -k / 12)));
        let s = fino('M8,8 V66', 4.5) + fino(Array.from({ length: 12 }, (_, k) => `M${fx(k + 1)},8 V66`).join(' '), 1.6);
        s += Array.from({ length: 6 }, (_, i) => fino(`M8,${r2(10 + 10.8 * i)} H${fx(12) + 4}`, 0.8 + 0.25 * i)).join('');
        [3, 5, 7, 9].forEach(k => { s += dot((fx(k - 1) + fx(k)) / 2, 37, 3.5); });
        const m12 = (fx(11) + fx(12)) / 2; s += dot(m12, 26.5, 3.5) + dot(m12, 47.5, 3.5);
        return s;
      })()],
      ['mus-escala-do', 'Escala de Dó maior na pauta', 262, 108, pauta(4, 258, 24) + claveSol(22, 54)
        + [74, 69, 64, 59, 54, 49, 44, 39].map((y, i) => { const x = 54 + 27 * i; return (i === 0 ? fino(`M${x - 10},74 H${x + 10}`, 1.6) : '') + figura(x, y, 2, i < 6, 30); }).join('')
        + ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si', 'Dó'].map((nm, i) => t(54 + 27 * i, 99, nm, 11)).join('')],
      ['mus-triade-do', 'Acorde de Dó maior (tríade) na pauta', 100, 94, pauta(4, 96, 24) + claveSol(22, 54) + fino('M56,74 H76', 1.6)
        + cabCheia(66, 74) + cabCheia(66, 64) + cabCheia(66, 54) + fino('M71.6,73 V30', 1.7)],
      ['mus-circulo-quintas', 'Círculo das quintas', 260, 260, (() => {
        const c = 130, P = (r, a) => [r2(c + r * Math.cos(a)), r2(c + r * Math.sin(a))];
        const MA = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'], MI = ['Am', 'Em', 'Bm', 'F♯m', 'C♯m', 'G♯m', 'E♭m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'];
        let s = `<circle cx="${c}" cy="${c}" r="124"/><circle cx="${c}" cy="${c}" r="86" stroke-width="1.6"/><circle cx="${c}" cy="${c}" r="46" stroke-width="1.6"/>`;
        let d = '';
        for (let i = 0; i < 12; i++) {
          const a = (i * 30 - 105) * Math.PI / 180, p1 = P(46, a), p2 = P(124, a);
          d += `M${p1[0]},${p1[1]} L${p2[0]},${p2[1]} `;
          const b = (i * 30 - 90) * Math.PI / 180, m = P(105, b), n = P(66, b);
          s += t(m[0], m[1], MA[i], 16) + t(n[0], n[1], MI[i], 11);
        }
        return s + fino(d, 1.2);
      })()],
    ]],
    ['Instrumentos', [
      ['mus-violao', 'Violão', 70, 168, '<path d="M28,22 L26,4 H44 L42,22 Z"/>' + dot(23, 9, 2.2) + dot(23, 16, 2.2) + dot(47, 9, 2.2) + dot(47, 16, 2.2)
        + '<path d="M31,22 V92 H39 V22"/>' + fino('M31,30 H39 M31,38 H39 M31,46 H39 M31,54 H39 M31,62 H39', 1)
        + '<path d="M35,66 C22,66 14,72 14,84 C14,94 20,98 18,104 C8,110 6,122 8,134 C11,152 24,162 35,162 C46,162 59,152 62,134 C64,122 62,110 52,104 C50,98 56,94 56,84 C56,72 48,66 35,66 Z"/>'
        + '<circle cx="35" cy="104" r="9"/><rect x="24" y="134" width="22" height="5" rx="1.5" stroke-width="1.8"/>'
        + fino('M32.5,6 V136 M34.5,6 V136 M36.5,6 V136', 0.7)],
      ['mus-violino', 'Violino', 80, 186, '<circle cx="40" cy="12" r="7"/><circle cx="41" cy="12" r="2.5" stroke-width="1.4"/><path d="M35,19 V38 H45 V19"/>'
        + fino('M29,25 H35 M45,25 H51 M29,32 H35 M45,32 H51', 2) + '<path d="M37,38 V76 M43,38 V76"/>'
        + '<path d="M40,76 C26,76 16,80 16,94 C16,104 24,106 24,114 C24,120 12,122 12,138 C12,158 26,176 40,176 C54,176 68,158 68,138 C68,122 56,120 56,114 C56,106 64,104 64,94 C64,80 54,76 40,76 Z"/>'
        + '<path d="M37,76 L35,126 H45 L43,76" stroke-width="1.8"/>' + fino('M28,118 C24,124 32,132 28,140 M52,118 C56,124 48,132 52,140', 1.6)
        + dot(28, 118, 1.8) + dot(28, 140, 1.8) + dot(52, 118, 1.8) + dot(52, 140, 1.8) + fino('M32,138 H48', 2.2) + '<path d="M36,148 L38,170 H42 L44,148 Z" stroke-width="1.6"/>'
        + fino('M38.6,38 V148 M39.6,38 V148 M40.4,38 V148 M41.4,38 V148', 0.6)],
      ['mus-piano', 'Piano', 140, 116, '<path d="M6,8 H134 M10,8 V74 H130 V8"/><rect x="48" y="40" width="44" height="22" rx="2" stroke-width="1.4"/>'
        + '<rect x="10" y="74" width="120" height="16"/>' + fino(Array.from({ length: 14 }, (_, j) => `M${10 + 8 * (j + 1)},74 V90`).join(' '), 1)
        + Array.from({ length: 14 }, (_, j) => PRETAS.includes(j % 7) ? `<rect x="${10 + 8 * (j + 1) - 2.5}" y="74" width="5" height="9" fill="#C" stroke="none"/>` : '').join('')
        + '<path d="M14,90 V106 H126 V90"/>' + fino('M20,106 V112 M120,106 V112 M60,108 H66 M74,108 H80', 2.4)],
      ['mus-piano-cauda', 'Piano de cauda (vista de cima)', 150, 200, '<path d="M14,8 H136 V100 C136,130 118,140 112,160 C106,182 92,192 72,192 H22 Q14,192 14,184 Z"/>'
        + '<rect x="14" y="8" width="122" height="20"/>' + fino(Array.from({ length: 16 }, (_, j) => `M${r2(14 + 122 / 17 * (j + 1))},8 V28`).join(' '), 1)
        + fino('M26,40 L60,182 M42,40 L72,170 M58,40 L84,158 M74,40 L96,146 M90,40 L108,132 M106,40 L120,112', 1)],
      ['mus-flauta-doce', 'Flauta doce', 34, 180, '<path d="M11,4 H23 Q25,4 24,8 L22,26 H12 L10,8 Q9,4 11,4 Z"/><rect x="13" y="30" width="8" height="5" stroke-width="1.4"/>'
        + '<path d="M12,26 V148 Q10,166 9,174 H25 Q24,166 22,148 V26"/>' + fino('M12,42 H22 M12,142 H22', 1.2)
        + [56, 69, 82, 95, 110, 123, 136].map(y => `<circle cx="17" cy="${y}" r="2.6" stroke-width="1.6"/>`).join('')],
      ['mus-flauta-transversal', 'Flauta transversal', 260, 40, '<rect x="8" y="16" width="244" height="8" rx="3"/>' + fino('M62,16 V24 M196,16 V24', 1.2)
        + '<ellipse cx="34" cy="20" rx="3.5" ry="2" fill="#C" stroke="none"/>' + fino('M96,11 H234', 1.2)
        + [100, 114, 128, 150, 164, 178, 210, 226].map(x => `<circle cx="${x}" cy="20" r="4" stroke-width="1.4"/>`).join('')],
      ['mus-trompete', 'Trompete', 200, 80, '<path d="M4,25 L12,28 V32 L4,35 Z" stroke-width="1.8"/><path d="M12,30 H140 C166,28 180,16 196,8 M140,42 C166,44 180,56 196,64"/>'
        + '<ellipse cx="196" cy="36" rx="3" ry="28" stroke-width="1.8"/><path d="M140,30 V42"/>'
        + '<path d="M66,58 H40 Q28,58 28,48 Q28,38 40,38 H66 M108,58 H126 Q136,58 136,48 V42"/>'
        + [70, 84, 98].map(x => `<rect x="${x}" y="24" width="8" height="38" rx="2"/><path d="M${x + 4},24 V16"/><rect x="${x - 1}" y="11" width="10" height="5" rx="2" fill="#C" stroke="none"/>`).join('')],
      ['mus-bateria', 'Bateria', 200, 150, '<circle cx="100" cy="102" r="36"/><circle cx="100" cy="102" r="29" stroke-width="1.4"/>' + fino('M76,132 L68,144 M124,132 L132,144', 2)
        + '<ellipse cx="82" cy="40" rx="14" ry="5"/><path d="M68,40 V54 A14,5 0 0 0 96,54 V40"/><ellipse cx="118" cy="40" rx="14" ry="5"/><path d="M104,40 V54 A14,5 0 0 0 132,54 V40"/>' + fino('M100,66 V50 M88,59 L100,50 L112,59', 1.6)
        + '<ellipse cx="38" cy="90" rx="20" ry="6"/><path d="M18,90 V104 A20,6 0 0 0 58,104 V90"/>' + fino('M38,110 V140 L26,146 M38,140 L50,146', 1.6)
        + '<ellipse cx="168" cy="88" rx="18" ry="6"/><path d="M150,88 V124 A18,6 0 0 0 186,124 V88"/>' + fino('M154,129 L150,144 M182,129 L186,144', 1.6)
        + '<ellipse cx="30" cy="28" rx="22" ry="4"/>' + fino('M30,32 V84', 1.6) + '<ellipse cx="170" cy="38" rx="22" ry="4"/>' + fino('M170,42 V82', 1.6)],
      ['mus-tambor', 'Tambor', 120, 104, '<ellipse cx="60" cy="30" rx="40" ry="10"/><path d="M20,30 V86 A40,10 0 0 0 100,86 V30"/>'
        + fino('M20,38 A40,10 0 0 0 100,38 M20,78 A40,10 0 0 0 100,78', 1.6) + fino('M24,47 L36,85 L48,49 L60,88 L72,49 L84,85 L96,47', 1.3)
        + fino('M40,28 L98,6 M80,28 L22,6', 3) + dot(40, 28, 3.4) + dot(80, 28, 3.4)],
      ['mus-pandeiro', 'Pandeiro', 120, 120, '<circle cx="60" cy="60" r="52"/><circle cx="60" cy="60" r="43" stroke-width="1.4"/>'
        + [0, 1, 2, 3, 4].map(k => { const a = (k * 72 - 54) * Math.PI / 180, x = r2(60 + 47.5 * Math.cos(a)), y = r2(60 + 47.5 * Math.sin(a)), g = r2(k * 72 - 54 + 90);
          return `<ellipse cx="${x}" cy="${y}" rx="8" ry="4.5" transform="rotate(${g} ${x} ${y})" stroke-width="1.6"/>` + dot(x, y, 1.6); }).join('')],
      ['mus-triangulo', 'Triângulo', 110, 104, '<path d="M50,22 L98,98 H12 L44,32" stroke-width="3.6"/>' + fino('M50,22 Q46,12 50,4', 1.4) + fino('M66,70 L104,46', 2.4)],
      ['mus-xilofone', 'Xilofone', 180, 104, Array.from({ length: 8 }, (_, i) => { const x = 8 + 20 * i, y1 = 8 + 3 * i, y2 = 82 - 3 * i;
        return `<rect x="${x}" y="${y1}" width="15" height="${y2 - y1}" rx="2"/>` + dot(x + 7.5, y1 + 7, 1.8) + dot(x + 7.5, y2 - 7, 1.8); }).join('')
        + fino('M112,98 L150,72 M136,100 L166,80', 2) + dot(151, 71, 5) + dot(167, 79, 4.5)],
      ['mus-maracas', 'Maracas', 112, 122, `<ellipse cx="40" cy="40" rx="22" ry="30" transform="rotate(-25 40 40)"/><ellipse cx="72" cy="40" rx="22" ry="30" transform="rotate(25 72 40)"/>`
        + fino('M53,67 L73,112 M59,67 L39,112', 4) + fino('M24,34 Q38,44 52,36 M88,34 Q74,44 60,36', 1.4)],
      ['mus-microfone', 'Microfone', 60, 150, '<circle cx="30" cy="26" r="20"/>' + fino('M11.7,18 H48.3 M10,26 H50 M11.7,34 H48.3 M22,7.7 V44.3 M30,6 V46 M38,7.7 V44.3', 1)
        + '<rect x="14" y="44" width="32" height="8" rx="2"/><path d="M16,52 L24,128 H36 L44,52"/><rect x="27" y="70" width="6" height="10" rx="2" stroke-width="1.6"/>'
        + fino('M30,128 V136 C30,146 44,146 52,140', 1.8)],
      ['mus-metronomo', 'Metrônomo', 100, 140, '<path d="M36,8 H64 L90,126 H10 Z"/><rect x="6" y="126" width="88" height="10" rx="2"/>'
        + '<path d="M40,22 H60 L74,104 H26 Z" stroke-width="1.4"/>' + fino(Array.from({ length: 7 }, (_, k) => `M47,${36 + 9 * k} H53`).join(' '), 1.2)
        + fino('M50,100 L66,28', 2.2) + '<path d="M58,50 H70 L68,60 H58 Z" fill="#C"/>' + dot(50, 100, 3.5) + fino('M90,92 H98 M98,86 V98', 2)],
      ['mus-diapasao', 'Diapasão', 70, 150, '<path d="M20,8 V70 Q20,92 35,92 Q50,92 50,70 V8 M35,92 V136" stroke-width="5"/><circle cx="35" cy="140" r="5" fill="#C" stroke="none"/>'
        + fino('M12,22 Q7,38 12,54 M5,16 Q-1,38 5,60 M58,22 Q63,38 58,54 M65,16 Q71,38 65,60', 1.6)],
      ['mus-fone', 'Fone de ouvido', 120, 104, '<path d="M18,64 C18,10 102,10 102,64" stroke-width="3"/>' + fino('M26,62 C26,22 94,22 94,62', 1.4)
        + '<rect x="8" y="58" width="20" height="40" rx="8"/><rect x="92" y="58" width="20" height="40" rx="8"/>' + fino('M28,64 V92 M92,64 V92', 4)],
      ['mus-caixa-som', 'Caixa de som', 100, 140, '<rect x="14" y="6" width="72" height="128" rx="4"/><circle cx="50" cy="34" r="11"/><circle cx="50" cy="34" r="4" stroke-width="1.6"/>'
        + '<circle cx="50" cy="92" r="28"/><circle cx="50" cy="92" r="18" stroke-width="1.6"/>' + dot(50, 92, 6)],
    ]],
    ['Ritmo e som', [
      ['mus-onda', 'Onda sonora (senoide)', 240, 100, fino('M8,50 H226', 1.4) + head(234, 50, 0, 9) + `<path d="${seno(8, 228, 50, 32, 80, 160)}"/>`],
      ['mus-onda-legendas', 'Onda: amplitude e comprimento', 240, 120, fino('M30,58 H226', 1.4) + head(234, 58, 0, 9) + `<path d="${seno(30, 228, 58, 32, 80, 160)}"/>`
        + fino('M16,58 V30', 1.4) + head(16, 26, -90, 7) + fino('M10,58 H30 M10,26 H48', 1) + t(8, 42, 'A', 13)
        + fino('M54,100 H126', 1.4) + head(130, 100, 0, 7) + head(50, 100, 180, 7) + fino('M50,26 V106 M130,26 V106', 1) + t(90, 112, 'λ', 13)],
      ['mus-grave-agudo', 'Frequência: grave e agudo', 260, 120, t(28, 30, 'grave', 13) + t(28, 90, 'agudo', 13)
        + `<path d="${seno(60, 254, 30, 18, 110, 120)}"/><path d="${seno(60, 254, 90, 18, 26, 240)}"/>` + fino('M60,30 H254 M60,90 H254', 1)],
      ['mus-forte-fraco', 'Intensidade: forte e fraco', 260, 120, t(28, 30, 'forte', 13) + t(28, 90, 'fraco', 13)
        + `<path d="${seno(60, 254, 30, 22, 48, 160)}"/><path d="${seno(60, 254, 90, 7, 48, 160)}"/>` + fino('M60,30 H254 M60,90 H254', 1)],
      ['mus-timbre', 'Timbre: formas de onda', 260, 170, t(30, 28, 'flauta', 12) + t(30, 84, 'clarinete', 12) + t(30, 140, 'violino', 12)
        + `<path d="${seno(64, 254, 28, 18, 48, 160)}"/>`
        + `<path d="${curva(x => 84 - 18 * Math.tanh(4 * Math.sin(2 * Math.PI * (x - 64) / 48)), 64, 254, 240)}"/>`
        + `<path d="${curva(x => { const u = ((x - 64) / 48) % 1; return 140 + 18 * (2 * u - 1) * (u < 0.92 ? 1 : (1 - u) / 0.08 * 2 - 1); }, 64, 254, 400)}"/>`
        + fino('M64,28 H254 M64,84 H254 M64,140 H254', 0.8)],
      ['mus-harmonicos', 'Harmônicos da corda', 260, 186, [1, 2, 3, 4].map((n, k) => {
        const y = 24 + 46 * k, f = s => x => y + s * 14 * Math.sin(n * Math.PI * (x - 40) / 210);
        return t(18, y, n === 1 ? 'f' : n + 'f', 12) + `<path d="${curva(f(1), 40, 250, 100)}"/>` + `<path d="${curva(f(-1), 40, 250, 100)}" stroke-width="1.4" stroke-dasharray="4 3"/>`
          + fino(`M40,${y} H250`, 0.7) + dot(40, y, 3) + dot(250, y, 3);
      }).join('')],
      ['mus-compressao', 'Som: compressão (C) e rarefação (R)', 260, 88, '<path d="M6,30 H16 L32,16 V64 L16,50 H6 Z"/>'
        + fino(Array.from({ length: 36 }, (_, k) => { const u = 40 + 6 * k, x = r2(u + 6 * Math.sin(2 * Math.PI * (u - 30) / 60)); return `M${x},14 V66`; }).join(' '), 1.4)
        + [60, 120, 180, 240].map(x => t(x, 78, 'C', 11)).join('') + [90, 150, 210].map(x => t(x, 78, 'R', 11)).join('')],
      ['mus-fonte-som', 'Fonte sonora (alto-falante)', 100, 80, '<path d="M6,30 H18 L36,14 V66 L18,50 H6 Z"/>' + fino('M48,28 Q56,40 48,52 M60,20 Q72,40 60,60 M72,12 Q88,40 72,68', 2)],
      ['mus-adsr', 'Envelope ADSR', 240, 112, '<path d="M16,92 H226 M16,92 V14"/>' + head(232, 92, 0, 8) + head(16, 8, -90, 8)
        + '<path d="M16,92 L50,16 L84,42 H170 L222,92" stroke-width="2.6"/>' + fino('M50,16 V92 M84,42 V92 M170,42 V92', 1)
        + t(33, 102, 'A', 12) + t(67, 102, 'D', 12) + t(127, 102, 'S', 12) + t(196, 102, 'R', 12)],
      ['mus-pulsacao', 'Pulsação (tempo forte e fracos)', 260, 66, [0, 1, 2, 3, 4, 5, 6, 7].map(k => {
        const x = 22 + 31 * k, forte = k % 4 === 0;
        return (forte ? dot(x, 26, 10) : `<circle cx="${x}" cy="26" r="6"/>`) + t(x, 54, String(k % 4 + 1), 12);
      }).join('') + fino('M131.5,10 V60', 1.6)],
      ['mus-partitura-grafica', 'Partitura gráfica (exemplo)', 260, 110, fino('M8,98 H244', 1.4) + head(252, 98, 0, 9)
        + `<path d="${curva(x => 30 - 8 * Math.sin((x - 10) / 6), 10, 80, 60)}"/>`
        + [[96, 22], [104, 32], [112, 18], [118, 28], [126, 38], [132, 24]].map(([x, y]) => dot(x, y, 3)).join('')
        + fino('M160,58 L200,16', 2.6) + '<path d="M204,40 L212,22 L220,48 L228,18 L236,44"/>'
        + '<circle cx="40" cy="70" r="12"/>' + dot(40, 70, 4) + cheio('M70,62 H150 V76 H70 Z') + fino('M170,76 Q200,52 236,74', 2)],
    ]],
  ],
};
