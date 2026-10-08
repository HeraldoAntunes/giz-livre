// Biblioteca de imagens da disciplina (SVG vetorial gerado aqui): tabela periódica e vidrarias de laboratório.
// Massas atômicas: valores-padrão IUPAC arredondados; entre colchetes, o número de massa do isótopo mais estável.

const EL = [
  // Z, símbolo, nome, massa
  [1, 'H', 'Hidrogênio', '1,008'], [2, 'He', 'Hélio', '4,003'], [3, 'Li', 'Lítio', '6,94'], [4, 'Be', 'Berílio', '9,012'],
  [5, 'B', 'Boro', '10,81'], [6, 'C', 'Carbono', '12,01'], [7, 'N', 'Nitrogênio', '14,01'], [8, 'O', 'Oxigênio', '16,00'],
  [9, 'F', 'Flúor', '19,00'], [10, 'Ne', 'Neônio', '20,18'], [11, 'Na', 'Sódio', '22,99'], [12, 'Mg', 'Magnésio', '24,31'],
  [13, 'Al', 'Alumínio', '26,98'], [14, 'Si', 'Silício', '28,09'], [15, 'P', 'Fósforo', '30,97'], [16, 'S', 'Enxofre', '32,06'],
  [17, 'Cl', 'Cloro', '35,45'], [18, 'Ar', 'Argônio', '39,95'], [19, 'K', 'Potássio', '39,10'], [20, 'Ca', 'Cálcio', '40,08'],
  [21, 'Sc', 'Escândio', '44,96'], [22, 'Ti', 'Titânio', '47,87'], [23, 'V', 'Vanádio', '50,94'], [24, 'Cr', 'Cromo', '52,00'],
  [25, 'Mn', 'Manganês', '54,94'], [26, 'Fe', 'Ferro', '55,85'], [27, 'Co', 'Cobalto', '58,93'], [28, 'Ni', 'Níquel', '58,69'],
  [29, 'Cu', 'Cobre', '63,55'], [30, 'Zn', 'Zinco', '65,38'], [31, 'Ga', 'Gálio', '69,72'], [32, 'Ge', 'Germânio', '72,63'],
  [33, 'As', 'Arsênio', '74,92'], [34, 'Se', 'Selênio', '78,97'], [35, 'Br', 'Bromo', '79,90'], [36, 'Kr', 'Criptônio', '83,80'],
  [37, 'Rb', 'Rubídio', '85,47'], [38, 'Sr', 'Estrôncio', '87,62'], [39, 'Y', 'Ítrio', '88,91'], [40, 'Zr', 'Zircônio', '91,22'],
  [41, 'Nb', 'Nióbio', '92,91'], [42, 'Mo', 'Molibdênio', '95,95'], [43, 'Tc', 'Tecnécio', '[98]'], [44, 'Ru', 'Rutênio', '101,07'],
  [45, 'Rh', 'Ródio', '102,91'], [46, 'Pd', 'Paládio', '106,42'], [47, 'Ag', 'Prata', '107,87'], [48, 'Cd', 'Cádmio', '112,41'],
  [49, 'In', 'Índio', '114,82'], [50, 'Sn', 'Estanho', '118,71'], [51, 'Sb', 'Antimônio', '121,76'], [52, 'Te', 'Telúrio', '127,60'],
  [53, 'I', 'Iodo', '126,90'], [54, 'Xe', 'Xenônio', '131,29'], [55, 'Cs', 'Césio', '132,91'], [56, 'Ba', 'Bário', '137,33'],
  [57, 'La', 'Lantânio', '138,91'], [58, 'Ce', 'Cério', '140,12'], [59, 'Pr', 'Praseodímio', '140,91'], [60, 'Nd', 'Neodímio', '144,24'],
  [61, 'Pm', 'Promécio', '[145]'], [62, 'Sm', 'Samário', '150,36'], [63, 'Eu', 'Európio', '151,96'], [64, 'Gd', 'Gadolínio', '157,25'],
  [65, 'Tb', 'Térbio', '158,93'], [66, 'Dy', 'Disprósio', '162,50'], [67, 'Ho', 'Hólmio', '164,93'], [68, 'Er', 'Érbio', '167,26'],
  [69, 'Tm', 'Túlio', '168,93'], [70, 'Yb', 'Itérbio', '173,05'], [71, 'Lu', 'Lutécio', '174,97'], [72, 'Hf', 'Háfnio', '178,49'],
  [73, 'Ta', 'Tântalo', '180,95'], [74, 'W', 'Tungstênio', '183,84'], [75, 'Re', 'Rênio', '186,21'], [76, 'Os', 'Ósmio', '190,23'],
  [77, 'Ir', 'Irídio', '192,22'], [78, 'Pt', 'Platina', '195,08'], [79, 'Au', 'Ouro', '196,97'], [80, 'Hg', 'Mercúrio', '200,59'],
  [81, 'Tl', 'Tálio', '204,38'], [82, 'Pb', 'Chumbo', '207,2'], [83, 'Bi', 'Bismuto', '208,98'], [84, 'Po', 'Polônio', '[209]'],
  [85, 'At', 'Astato', '[210]'], [86, 'Rn', 'Radônio', '[222]'], [87, 'Fr', 'Frâncio', '[223]'], [88, 'Ra', 'Rádio', '[226]'],
  [89, 'Ac', 'Actínio', '[227]'], [90, 'Th', 'Tório', '232,04'], [91, 'Pa', 'Protactínio', '231,04'], [92, 'U', 'Urânio', '238,03'],
  [93, 'Np', 'Netúnio', '[237]'], [94, 'Pu', 'Plutônio', '[244]'], [95, 'Am', 'Amerício', '[243]'], [96, 'Cm', 'Cúrio', '[247]'],
  [97, 'Bk', 'Berquélio', '[247]'], [98, 'Cf', 'Califórnio', '[251]'], [99, 'Es', 'Einstênio', '[252]'], [100, 'Fm', 'Férmio', '[257]'],
  [101, 'Md', 'Mendelévio', '[258]'], [102, 'No', 'Nobélio', '[259]'], [103, 'Lr', 'Laurêncio', '[266]'], [104, 'Rf', 'Rutherfórdio', '[267]'],
  [105, 'Db', 'Dúbnio', '[268]'], [106, 'Sg', 'Seabórgio', '[269]'], [107, 'Bh', 'Bóhrio', '[270]'], [108, 'Hs', 'Hássio', '[269]'],
  [109, 'Mt', 'Meitnério', '[278]'], [110, 'Ds', 'Darmstádtio', '[281]'], [111, 'Rg', 'Roentgênio', '[282]'], [112, 'Cn', 'Copernício', '[285]'],
  [113, 'Nh', 'Nihônio', '[286]'], [114, 'Fl', 'Fleróvio', '[289]'], [115, 'Mc', 'Moscóvio', '[290]'], [116, 'Lv', 'Livermório', '[293]'],
  [117, 'Ts', 'Tenesso', '[294]'], [118, 'Og', 'Oganessônio', '[294]'],
];

const CAT = {
  alc: ['#ffd7d7', 'Metais alcalinos'], alt: ['#ffe9c7', 'Metais alcalinoterrosos'], tr: ['#fff6c2', 'Metais de transição'],
  pt: ['#d9f2d0', 'Outros metais'], sm: ['#d2efe9', 'Semimetais'], nm: ['#d5e8ff', 'Não metais'], hal: ['#e3dcff', 'Halogênios'],
  ng: ['#f6d9f2', 'Gases nobres'], lan: ['#e8f4d4', 'Lantanídeos'], act: ['#f3e1d1', 'Actinídeos'],
};
function cat(z, sym) {
  if ([3, 11, 19, 37, 55, 87].includes(z)) return 'alc';
  if ([4, 12, 20, 38, 56, 88].includes(z)) return 'alt';
  if (z >= 57 && z <= 71) return 'lan';
  if (z >= 89 && z <= 103) return 'act';
  if ([2, 10, 18, 36, 54, 86, 118].includes(z)) return 'ng';
  if ([9, 17, 35, 53, 85, 117].includes(z)) return 'hal';
  if (['B', 'Si', 'Ge', 'As', 'Sb', 'Te'].includes(sym)) return 'sm';
  if (['H', 'C', 'N', 'O', 'P', 'S', 'Se'].includes(sym)) return 'nm';
  if ((z >= 21 && z <= 30) || (z >= 39 && z <= 48) || (z >= 72 && z <= 80) || (z >= 104 && z <= 112)) return 'tr';
  return 'pt';
}
// posição (linha, coluna) na tabela de 18 colunas; lantanídeos/actinídeos nas linhas 9 e 10
function pos(z) {
  if (z === 1) return [1, 1];
  if (z === 2) return [1, 18];
  const per = [[3, 10, 2], [11, 18, 3], [19, 36, 4], [37, 54, 5]];
  for (const [a, b, p] of per) if (z >= a && z <= b) {
    const i = z - a;
    return p <= 3 ? [p, i < 2 ? i + 1 : i + 11] : [p, i + 1];
  }
  if (z >= 57 && z <= 71) return [9, z - 57 + 3];
  if (z >= 89 && z <= 103) return [10, z - 89 + 3];
  if (z === 55 || z === 56) return [6, z - 54];
  if (z === 87 || z === 88) return [7, z - 86];
  if (z >= 72 && z <= 86) return [6, z - 68];
  return [7, z - 100];   // 104–118
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function periodicTableSVG() {
  const cw = 64, ch = 72, ox = 20, oy = 60;
  let cells = '';
  for (const [z, s, n, m] of EL) {
    const [r, c] = pos(z);
    const x = ox + (c - 1) * cw, y = oy + (r - 1) * ch + (r >= 9 ? 24 : 0);
    cells += `<g transform="translate(${x},${y})"><rect width="${cw - 3}" height="${ch - 3}" rx="4" fill="${CAT[cat(z, s)][0]}" stroke="#7a7574" stroke-width=".8"/>
      <text x="4" y="12" font-size="10">${z}</text><text x="${(cw - 3) / 2}" y="38" font-size="22" font-weight="700" text-anchor="middle">${s}</text>
      <text x="${(cw - 3) / 2}" y="52" font-size="8.2" text-anchor="middle">${esc(n)}</text><text x="${(cw - 3) / 2}" y="64" font-size="8.5" text-anchor="middle" fill="#444">${m}</text></g>`;
  }
  // marcadores dos blocos f
  cells += `<g transform="translate(${ox + 2 * cw},${oy + 5 * ch})"><rect width="${cw - 3}" height="${ch - 3}" rx="4" fill="${CAT.lan[0]}" stroke="#7a7574" stroke-width=".8"/><text x="30" y="40" font-size="12" text-anchor="middle">57–71</text></g>`;
  cells += `<g transform="translate(${ox + 2 * cw},${oy + 6 * ch})"><rect width="${cw - 3}" height="${ch - 3}" rx="4" fill="${CAT.act[0]}" stroke="#7a7574" stroke-width=".8"/><text x="30" y="40" font-size="12" text-anchor="middle">89–103</text></g>`;
  for (let g = 1; g <= 18; g++) cells += `<text x="${ox + (g - 1) * cw + 30}" y="${oy - 8}" font-size="11" text-anchor="middle" fill="#555">${g}</text>`;
  let leg = '', lx = ox + 3 * cw;
  Object.values(CAT).forEach(([cor, nome], i) => {
    const x = lx + (i % 5) * 150, y = 8 + Math.floor(i / 5) * 18;
    leg += `<rect x="${x}" y="${y}" width="12" height="12" fill="${cor}" stroke="#7a7574" stroke-width=".6"/><text x="${x + 17}" y="${y + 10}" font-size="11">${nome}</text>`;
  });
  const W = ox * 2 + 18 * cw, H = oy + 10 * ch + 24 + 24;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Arial, sans-serif">
    <rect width="${W}" height="${H}" fill="#fff"/>${leg}${cells}
    <text x="${ox}" y="${H - 8}" font-size="10" fill="#666">Massas atômicas: valores-padrão IUPAC arredondados; [ ] = número de massa do isótopo mais estável.</text></svg>`, w: W, h: H };
}

// vidrarias em traço (linha preta, fundo transparente)
const G = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" stroke="#1b1b1b" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
const GLASS = {
  bequer: ['Béquer', G(160, 190, '<path d="M28 20 L22 14 H138 L132 20 V176 Q132 184 124 184 H36 Q28 184 28 176 Z"/><path d="M28 96 H132" stroke="#0078d4" stroke-width="2"/><path d="M110 60 H128 M114 90 H128 M110 120 H128 M114 150 H128" stroke-width="2"/>')],
  erlenmeyer: ['Erlenmeyer', G(170, 210, '<path d="M66 12 H104 M70 12 V70 L20 190 Q16 200 28 200 H142 Q154 200 150 190 L100 70 V12"/><path d="M40 150 H130" stroke="#0078d4" stroke-width="2"/>')],
  balaoFundo: ['Balão de fundo redondo', G(160, 220, '<path d="M66 10 H94 M70 10 V96 A62 62 0 1 0 90 96 V10"/>')],
  balaoVol: ['Balão volumétrico', G(150, 260, '<path d="M60 10 H90 M64 10 V150 A56 56 0 1 0 86 150 V10"/><path d="M60 64 H90" stroke="#e81224" stroke-width="2"/>')],
  proveta: ['Proveta', G(90, 260, '<path d="M30 14 L24 8 H66 L62 14 V230 H30 Z"/><path d="M12 230 H80 V246 H12 Z"/><path d="M48 40 H62 M52 70 H62 M48 100 H62 M52 130 H62 M48 160 H62 M52 190 H62" stroke-width="2"/>')],
  tubo: ['Tubo de ensaio', G(70, 230, '<path d="M18 10 H52 M22 10 V196 A13 13 0 0 0 48 196 V10"/>')],
  pipeta: ['Pipeta volumétrica', G(60, 300, '<path d="M28 10 V110 Q12 120 14 150 Q12 180 28 190 V292 M32 10 V110 Q48 120 46 150 Q48 180 32 190 V292"/><path d="M22 60 H38" stroke="#e81224" stroke-width="2"/>')],
  bureta: ['Bureta', G(90, 320, '<path d="M38 10 V262 M52 10 V262 M38 262 L42 276 H48 L52 262"/><path d="M30 276 H60 M45 276 V300"/><path d="M38 40 H46 M38 70 H48 M38 100 H46 M38 130 H48 M38 160 H46 M38 190 H48 M38 220 H46" stroke-width="2"/>')],
  funil: ['Funil', G(160, 200, '<path d="M14 20 H146 L88 104 V190 H72 V104 Z"/>')],
  kitassato: ['Kitassato', G(200, 220, '<path d="M76 12 H114 M80 12 V70 L30 196 Q26 208 38 208 H152 Q164 208 160 196 L110 70 V12"/><path d="M106 44 H160"/>')],
  condensador: ['Condensador (Liebig)', G(320, 110, '<path d="M10 52 L310 70"/><path d="M50 36 H270 V82 H50 Z"/><path d="M80 36 V14 M240 82 V104"/>')],
  bico: ['Bico de Bunsen', G(140, 240, '<path d="M58 40 H82 V196 H58 Z"/><path d="M30 196 H110 Q118 196 118 206 V220 H22 V206 Q22 196 30 196 Z"/><path d="M58 150 H30"/><path d="M70 36 Q50 10 70 2 Q90 10 70 36" stroke="#f7630c"/>')],
};

export const LIBRARY = [
  { id: 'periodic', name: 'Tabela periódica', make: periodicTableSVG },
  ...Object.entries(GLASS).map(([id, [name, svg]]) => ({
    id, name, make: () => { const m = svg.match(/width="(\d+)" height="(\d+)"/); return { svg, w: +m[1], h: +m[2] }; },
  })),
];

export const svgDataUrl = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
