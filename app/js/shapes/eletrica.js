// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
import { T, head } from './base.js';

// Símbolos de elétrica autorais e didáticos; referências históricas IEC/ABNT não constituem certificação.
// Semicondutores (diodo, LED, transistor) ficam em eletronica.js.

const W = '<path d="M4 35 H29 M81 35 H106"/>'; // fios dos símbolos circulares 110×70
const circ = (dentro) => '<circle cx="55" cy="35" r="26"/>' + W + dentro;
const med = (id, nome, s, size = 22) => [id, nome, 110, 70, circ(T(55, 35, s, size))];
const maq = (id, nome, s, marca) => [id, nome, 110, 70, circ(T(55, 29, s, 20) + marca)];
const CA = '<path d="M45 47 Q50 41 55 47 T65 47" stroke-width="1.8"/>';
const CC = '<path d="M45 45 H65" stroke-width="1.8"/><path d="M45 50 H65" stroke-width="1.8" stroke-dasharray="3 3"/>';
const parede = '<path d="M6 62 H74" stroke-width="4"/>';
const tri = '<path d="M18 58 L62 58 L40 20 Z"/>';

// ---------- mais formas: fontes, transformadores, proteção, comandos, unifilar ----------
const lt = (x, y, s, size = 11) => T(x, y, s, size).replace('font-weight="600"', 'font-weight="500"');
const X = (x, y) => `<path d="M${x - 5} ${y - 5} L${x + 5} ${y + 5} M${x + 5} ${y - 5} L${x - 5} ${y + 5}" stroke-width="2"/>`;
const terra = (x, y) => `<path d="M${x} ${y} V${y + 6} M${x - 14} ${y + 6} H${x + 14} M${x - 9} ${y + 13} H${x + 9} M${x - 4} ${y + 20} H${x + 4}"/>`;
const tres = (x, y) => `<path d="M${x - 9} ${y + 6} L${x - 3} ${y - 6} M${x - 3} ${y + 6} L${x + 3} ${y - 6} M${x + 3} ${y + 6} L${x + 9} ${y - 6}" stroke-width="1.6"/>`; // marca de 3 condutores
// bobina vertical: n meias-voltas de raio r a partir de (x, y0); lado +1 = barriga para a direita
const bob = (x, y0, n, r, lado) => `M${x} ${y0}` + Array.from({ length: n }, (_, i) => ` A${r} ${r} 0 0 ${lado > 0 ? 1 : 0} ${x} ${y0 + 2 * r * (i + 1)}`).join('');
// três polos verticais (corrente de baixo para cima), lâmina aberta e acoplamento mecânico tracejado
const polos = (xs, marca) => '<path d="' + xs.map(x => `M${x} 146 V110 L${x - 18} 72 M${x} 4 V66`).join(' ') + '"/>'
  + xs.map(marca).join('') + `<path d="M${xs[0] - 9} 91 H${xs[2] - 9}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
// contato NA (120×80) acionado por um atuador desenhado acima, ligado pela haste tracejada
const naAt = (atuador, y1 = 32) => `<path d="M4 66 H40 L82 44 M84 66 H116"/><path d="M61 55 V${y1}" stroke-width="1.6" stroke-dasharray="4 3"/>` + atuador;
// paraquedas de temporização (retardo) preso à lâmina em (x, y)
const retardo = (x, y) => `<path d="M${x} ${y} V22 M${x - 12} 22 A12 12 0 0 1 ${x + 12} 22" stroke-width="1.8"/>`;
const caixa = (dentro) => '<path d="M50 4 V20 M50 60 V76"/><rect x="24" y="20" width="52" height="40"/>' + dentro;
const disjU = (dentro = '') => '<path d="M30 4 V30 M30 70 V96"/><rect x="12" y="30" width="36" height="40"/>' + dentro;

const FONTES2 = [
  ['el-fontecc', 'Fonte de tensão CC', 110, 70, circ(T(43, 35, '+', 18) + T(68, 35, '−', 20))],
  ['el-fonte3f', 'Fonte CA trifásica', 110, 70, circ(T(55, 35, '3~', 19))],
  ['el-terralimpo', 'Terra sem ruído (limpo)', 70, 70, '<path d="M8 36 A27 27 0 0 0 62 36"/>' + '<path d="M35 4 V36 M15 36 H55 M22 46 H48 M29 56 H41"/>'],
  ['el-bep', 'Barramento de equipotencialização (BEP)', 160, 74, '<rect x="10" y="26" width="140" height="12" fill="#C"/>'
    + '<path d="M30 38 V62 M55 38 V62 M80 38 V62 M105 38 V62 M130 38 V62" stroke-width="2"/>'
    + '<circle cx="30" cy="65" r="3"/><circle cx="55" cy="65" r="3"/><circle cx="80" cy="65" r="3"/><circle cx="105" cy="65" r="3"/><circle cx="130" cy="65" r="3"/>' + T(80, 13, 'BEP', 15)],
  ['el-haste', 'Haste de aterramento', 80, 130, '<path d="M6 30 H74"/><path d="M14 30 L6 38 M26 30 L18 38 M58 30 L50 38 M70 30 L62 38" stroke-width="1.6"/>'
    + '<path d="M37 14 V114 L40 124 L43 114 V14 Z" fill="#C"/><rect x="30" y="16" width="20" height="9"/><path d="M4 20 H30"/>'],
];

const TRAFOS = [
  ['el-tc', 'Transformador de corrente (TC)', 130, 90, '<path d="M4 30 H126"/><circle cx="65" cy="30" r="18"/><path d="M58 46.6 V80 M72 46.6 V80"/>'
    + lt(14, 16, 'P1') + lt(116, 16, 'P2') + lt(44, 76, 'S1') + lt(86, 76, 'S2')],
  ['el-tp', 'Transformador de potencial (TP)', 100, 130, '<circle cx="45" cy="44" r="20"/><circle cx="45" cy="74" r="20"/><path d="M45 4 V24 M65 74 H96 M45 94 V102"/>'
    + terra(45, 102) + lt(80, 64, 'S1') + lt(20, 12, 'P1')],
  ['el-trafo3e', 'Transformador de três enrolamentos', 140, 110, '<circle cx="54" cy="40" r="24"/><circle cx="86" cy="40" r="24"/><circle cx="70" cy="68" r="24"/>'
    + '<path d="M4 40 H30 M110 40 H136 M70 92 V106"/>'],
  ['el-trafotap', 'Transformador com comutador (tap)', 140, 80, '<circle cx="56" cy="40" r="24"/><circle cx="84" cy="40" r="24"/><path d="M4 40 H32 M108 40 H136"/>'
    + '<path d="M36 74 L96 14" stroke-width="1.8"/>' + head(101, 9, -45, 11)],
  ['el-trafodyn', 'Transformador Δ-Yn (distribuição)', 150, 80, '<circle cx="61" cy="40" r="26"/><circle cx="89" cy="40" r="26"/><path d="M4 40 H35 M115 40 H146"/>'
    + tres(18, 40) + tres(130, 40) + '<path d="M44 47 L52 32 L60 47 Z M98 39 V49 M98 39 L90 31 M98 39 L106 31" stroke-width="1.8"/>' + lt(107, 46, 'n', 12)],
  ['el-trafoblind', 'Transformador com blindagem', 120, 112, `<path d="${bob(30, 20, 3, 10, 1)} M30 8 V20 M30 80 V92 ${bob(90, 20, 3, 10, -1)} M90 8 V20 M90 80 V92"/>`
    + '<path d="M50 14 V86 M70 14 V86" stroke-width="1.8"/><path d="M60 10 V90" stroke-width="1.6" stroke-dasharray="4 3"/>'
    + '<path d="M60 90 V95 M51 95 H69 M55 101 H65 M59 107 H61" stroke-width="1.8"/>'],
  ['el-trafoct', 'Transformador com derivação central', 120, 100, `<path d="${bob(30, 20, 3, 10, 1)} M30 8 V20 M30 80 V92 ${bob(90, 20, 4, 7.5, -1)} M90 8 V20 M90 80 V92 M90 50 H116"/>`
    + '<path d="M56 14 V86 M64 14 V86" stroke-width="1.8"/>' + lt(108, 40, 'CT', 10)],
  ['el-reator', 'Reator (indutor de potência, didático)', 100, 150, '<path d="M35 8 V25 A12 12 0 0 1 35 49 A12 12 0 0 1 35 73 A12 12 0 0 1 35 97 A12 12 0 0 1 35 121 V142 M65 25 V121 M72 25 V121"/>'],
];

const MAQS2 = [
  maq('el-motor3', 'Motor de indução trifásico', 'M', T(55, 47, '3~', 14)),
  maq('el-motorsinc', 'Motor síncrono', 'MS', CA),
  maq('el-gerador3', 'Gerador síncrono trifásico', 'GS', T(55, 47, '3~', 14)),
  ['el-motor3t', 'Motor trifásico (U V W)', 110, 100, '<circle cx="55" cy="66" r="30"/><path d="M35 43.6 V14 M55 36 V14 M75 43.6 V14"/>'
    + '<circle cx="35" cy="10" r="3.5"/><circle cx="55" cy="10" r="3.5"/><circle cx="75" cy="10" r="3.5"/>'
    + T(55, 60, 'M', 20) + T(55, 80, '3~', 14) + lt(24, 26, 'U') + lt(44, 26, 'V') + lt(86, 26, 'W')],
];

const PROTECAO = [
  ['el-disj3', 'Disjuntor tripolar', 120, 150, polos([32, 62, 92], x => X(x, 66))],
  ['el-disjtm', 'Disjuntor termomagnético', 160, 80, '<path d="M4 60 H46 L88 36 M94 60 H156"/>' + X(94, 60)
    + '<path d="M67 48 V32 M51 26 V32 H93 V26" stroke-width="1.6" stroke-dasharray="4 3"/>'
    + '<rect x="34" y="6" width="34" height="20" stroke-width="1.8"/><path d="M40 21 H46 V12 H56 V21 H62" stroke-width="1.6"/>'
    + '<rect x="76" y="6" width="34" height="20" stroke-width="1.8"/>' + T(93, 16, 'I&gt;', 13)],
  ['el-fussecc', 'Seccionador-fusível (NH)', 140, 60, '<path d="M4 44 H36 M106 44 H136 M106 36 V52"/><circle cx="36" cy="44" r="3" fill="#C"/>'
    + '<g transform="rotate(-25 36 44)"><path d="M36 44 H104"/><rect x="50" y="37" width="40" height="14"/></g>'],
  ['el-reletermico', 'Relé térmico (sobrecarga)', 100, 80, caixa('<path d="M34 48 H43 V32 H57 V48 H66" stroke-width="2"/>')],
  ['el-relesobrecorr', 'Relé de sobrecorrente', 100, 80, caixa(T(50, 40, 'I &gt;', 18))],
  ['el-contator3', 'Contator tripolar', 130, 150, polos([36, 70, 104], x => `<path d="M${x} 66 A7 7 0 0 1 ${x - 14} 66"/>`)],
  ['el-comutador', 'Chave comutadora (1 polo, 2 posições)', 120, 70, '<path d="M4 35 H36 L80 17 M86 14 H116 M86 56 H116"/>'
    + '<circle cx="36" cy="35" r="3" fill="#C"/><circle cx="86" cy="14" r="3" fill="#C"/><circle cx="86" cy="56" r="3" fill="#C"/>'],
];

const COMANDOS = [
  ['el-bobtemp', 'Bobina temporizada (retardo)', 100, 90, '<rect x="34" y="28" width="52" height="34"/><path d="M60 4 V28 M60 62 V86"/>'
    + '<rect x="14" y="28" width="20" height="34"/><path d="M14 28 L34 62 M34 28 L14 62" stroke-width="1.6"/>'],
  ['el-contNAtemp', 'Contato NA temporizado', 120, 70, '<path d="M4 56 H40 L82 34 M84 56 H116"/>' + retardo(61, 45)],
  ['el-contNFtemp', 'Contato NF temporizado', 120, 70, '<path d="M4 56 H40 L92 32 M80 56 V38 M80 56 H116"/>' + retardo(60, 46.8)],
  ['el-botemerg', 'Botoeira de emergência (cogumelo)', 120, 80, '<path d="M4 52 H36 V64 M116 52 H84 V64 M30 64 H90"/>'
    + '<path d="M60 64 V28" stroke-width="1.8" stroke-dasharray="4 3"/><path d="M38 28 A22 18 0 0 1 82 28 Z"/>'],
  ['el-botNANF', 'Botoeira conjugada (NA + NF)', 120, 110, '<path d="M4 42 H36 V54 M116 42 H84 V54 M30 54 H90 M4 98 H36 V90 M116 98 H84 V90 M30 82 H90 M48 8 V18 H72 V8"/>'
    + '<path d="M60 82 V18" stroke-width="1.8" stroke-dasharray="4 3"/>'],
  ['el-fimcurso', 'Chave fim de curso (NA)', 120, 80, naAt('<path d="M50 12 H72 L61 32 Z"/>')],
  ['el-pressostato', 'Pressostato (NA)', 120, 80, naAt('<rect x="46" y="8" width="30" height="24"/>' + T(61, 19, 'p', 17))],
  ['el-termostato', 'Termostato (NA)', 120, 80, naAt('<rect x="46" y="8" width="30" height="24"/>' + T(61, 20, 'θ', 17))],
  ['el-boia', 'Chave boia (nível)', 120, 80, naAt('<circle cx="61" cy="20" r="11"/><path d="M34 24 H48 M74 24 H88" stroke-width="1.6" stroke-dasharray="4 3"/>', 31)],
];

const UNIFILAR = [
  ['el-u-barra', 'Barramento', 220, 44, '<path d="M8 14 H212" stroke-width="6"/><path d="M50 14 V40 M110 14 V40 M170 14 V40"/>'],
  ['el-u-disj', 'Disjuntor (unifilar, quadrado)', 60, 100, disjU()],
  ['el-u-religador', 'Religador', 60, 100, disjU(T(30, 50, 'R', 18))],
  ['el-u-carga', 'Carga (seta)', 50, 92, '<path d="M25 4 V72"/>' + head(25, 88, 90, 16)],
  ['el-u-rede', 'Rede / concessionária', 120, 90, '<rect x="20" y="8" width="80" height="44"/><path d="M60 52 V86"/>'
    + '<path d="M20 30 L42 8 M20 52 L64 8 M42 52 L86 8 M64 52 L100 16 M86 52 L100 38" stroke-width="1.2"/>'],
  ['el-u-capbanco', 'Banco de capacitores', 80, 110, '<path d="M40 4 V44 M40 54 V78"/><path d="M22 44 H58 M22 54 H58" stroke-width="3.5"/>'
    + tres(40, 22) + terra(40, 78)],
  ['el-u-aterres', 'Neutro aterrado por resistor', 60, 110, '<path d="M30 4 V24 M30 64 V78"/><rect x="20" y="24" width="20" height="40"/>' + terra(30, 78)],
  ['el-u-impedancia', 'Impedância (Z)', 140, 40, '<path d="M4 20 H36 M104 20 H136"/><rect x="36" y="8" width="68" height="24"/>' + T(70, 20, 'Z', 17)],
  ['el-u-linhapi', 'Linha (modelo π)', 240, 96, '<path d="M9 30 H70 M110 30 H124 M188 30 H231 M9 80 H231 M40 30 V52 M40 60 V80 M200 30 V52 M200 60 V80"/>'
    + '<rect x="70" y="20" width="40" height="20"/><path d="M124 30 A8 8 0 0 1 140 30 A8 8 0 0 1 156 30 A8 8 0 0 1 172 30 A8 8 0 0 1 188 30"/>'
    + '<path d="M28 52 H52 M28 60 H52 M188 52 H212 M188 60 H212" stroke-width="3"/>'
    + '<circle cx="6" cy="30" r="3"/><circle cx="6" cy="80" r="3"/><circle cx="234" cy="30" r="3"/><circle cx="234" cy="80" r="3"/>'
    + '<circle cx="40" cy="30" r="3" fill="#C" stroke="none"/><circle cx="200" cy="30" r="3" fill="#C" stroke="none"/><circle cx="40" cy="80" r="3" fill="#C" stroke="none"/><circle cx="200" cy="80" r="3" fill="#C" stroke="none"/>'
    + lt(90, 10, 'R') + lt(156, 12, 'L') + lt(66, 66, 'C/2') + lt(174, 66, 'C/2')],
];

const MEDICAO2 = [
  med('el-varmetro', 'Varímetro', 'var', 17),
  med('el-cosfimetro', 'Cosfímetro', 'cos φ', 14),
  med('el-megometro', 'Megôhmetro', 'MΩ', 18),
  ['el-horimetro', 'Horímetro', 120, 70, '<rect x="30" y="10" width="60" height="50"/><path d="M4 35 H30 M90 35 H116"/>' + T(60, 35, 'h', 20)],
  ['el-alicate', 'Alicate amperímetro', 90, 150, '<path d="M50.8 8.7 A26 26 0 1 1 39.2 8.7 L41.9 20.4 A14 14 0 1 0 48.1 20.4 Z"/><circle cx="45" cy="34" r="5" fill="#C" stroke="none"/>'
    + '<rect x="22" y="60" width="46" height="84" rx="8"/><rect x="30" y="70" width="30" height="18" stroke-width="1.6"/>' + T(45, 79, 'A', 13)
    + '<circle cx="45" cy="114" r="10" stroke-width="1.8"/><path d="M45 114 L51 107" stroke-width="1.8"/>'],
];

const PREDIAIS2 = [
  ['el-intduplo', 'Interruptor de duas seções', 70, 60, '<circle cx="28" cy="34" r="18"/>' + T(28, 34, 'S2', 15) + T(56, 14, 'a,b', 13)],
  ['el-intinterm', 'Interruptor intermediário (four-way)', 70, 60, '<circle cx="28" cy="34" r="19"/>' + T(28, 34, 'S4w', 12) + T(58, 14, 'a', 14)],
  ['el-luzfluor', 'Luminária fluorescente', 120, 60, '<rect x="8" y="16" width="104" height="28"/><circle cx="60" cy="30" r="9"/><path d="M18 30 H51 M69 30 H102" stroke-width="1.6"/>'],
  ['el-cxpassagem', 'Caixa de passagem', 70, 70, '<rect x="12" y="12" width="46" height="46"/><path d="M12 12 L58 58 M58 12 L12 58" stroke-width="1.6"/>'],
];






// AMPLIACAO-B-INICIO
// SVG autoral: esquemas didáticos, sem certificação normativa ou pinagem universal.
const AMPLIACAO_B = [
  [
    [
      "el-recalque-potencia",
      "Recalque: potência trifásica e PE",
      450,
      465,
      "<text x=\"80\" y=\"18\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L1</text><text x=\"180\" y=\"18\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L2</text><text x=\"280\" y=\"18\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L3</text><path d=\"M80 40 V70 M80 106 V142 M80 180 V218 M80 254 V294\"/><rect x=\"68\" y=\"70\" width=\"24\" height=\"36\" rx=\"0\"/><path d=\"M80 142 l-14 27 M80 171 v9\"/><rect x=\"68\" y=\"218\" width=\"24\" height=\"36\" rx=\"0\"/><path d=\"M180 40 V70 M180 106 V142 M180 180 V218 M180 254 V294\"/><rect x=\"168\" y=\"70\" width=\"24\" height=\"36\" rx=\"0\"/><path d=\"M180 142 l-14 27 M180 171 v9\"/><rect x=\"168\" y=\"218\" width=\"24\" height=\"36\" rx=\"0\"/><path d=\"M280 40 V70 M280 106 V142 M280 180 V218 M280 254 V294\"/><rect x=\"268\" y=\"70\" width=\"24\" height=\"36\" rx=\"0\"/><path d=\"M280 142 l-14 27 M280 171 v9\"/><rect x=\"268\" y=\"218\" width=\"24\" height=\"36\" rx=\"0\"/><text x=\"350\" y=\"88\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">QF • curto</text><text x=\"350\" y=\"158\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM</text><text x=\"350\" y=\"236\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">FR • sobrecarga</text><path d=\"M80 294 H140 V328 M180 294 V312 M280 294 H220 V328\"/><circle cx=\"180\" cy=\"370\" r=\"58\"/><text x=\"180\" y=\"359\" font-size=\"24\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">M</text><text x=\"180\" y=\"389\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">3~</text><path d=\"M238 370 H330 V400\"/><path d=\"M330 400 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><text x=\"330\" y=\"350\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PE</text><text x=\"225.0\" y=\"449\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Topologia de partida direta; dimensionar proteções</text>"
    ],
    [
      "el-recalque-selo",
      "Recalque: liga/desliga com selo",
      650,
      210,
      "<path d=\"M20 30 V180 M630 30 V180\"/><text x=\"20\" y=\"14\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L</text><text x=\"630\" y=\"14\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">N</text><path d=\"M20 90 H70\"/><path d=\"M70 90 h15 M105 90 h15 M85 78 v24 M105 78 v24\"/><path d=\"M80 107 l30 -34\"/><text x=\"95\" y=\"64\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">S0 NF</text><path d=\"M120 90 H200\"/><path d=\"M200 90 h15 M235 90 h15 M215 78 v24 M235 78 v24\"/><path d=\"M210 107 l30 -34\"/><text x=\"225\" y=\"64\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">FR NF</text><path d=\"M250 90 H330\"/><path d=\"M330 90 h15 M365 90 h15 M345 78 v24 M365 78 v24\"/><text x=\"355\" y=\"64\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">S1 NA</text><path d=\"M380 90 H515\"/><rect x=\"515\" y=\"72\" width=\"50\" height=\"36\" rx=\"0\"/><text x=\"540\" y=\"90\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM</text><path d=\"M565 90 H630\"/><path d=\"M300 90 V154 H330 M380 154 H410 V90\"/><path d=\"M330 154 h15 M365 154 h15 M345 142 v24 M365 142 v24\"/><text x=\"355\" y=\"128\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM</text><circle cx=\"300\" cy=\"90\" r=\"3\" fill=\"#C\" stroke=\"none\"/><circle cx=\"410\" cy=\"90\" r=\"3\" fill=\"#C\" stroke=\"none\"/><text x=\"325.0\" y=\"194\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">S0 para; S1 liga; FR abre por sobrecarga</text>"
    ],
    [
      "el-nivel-histerese",
      "Encher reservatório: dois níveis e selo",
      650,
      210,
      "<path d=\"M20 30 V180 M630 30 V180\"/><text x=\"20\" y=\"14\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L</text><text x=\"630\" y=\"14\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">N</text><path d=\"M20 90 H70\"/><path d=\"M70 90 h15 M105 90 h15 M85 78 v24 M105 78 v24\"/><path d=\"M80 107 l30 -34\"/><text x=\"95\" y=\"64\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Alto NF</text><path d=\"M120 90 H200\"/><path d=\"M200 90 h15 M235 90 h15 M215 78 v24 M235 78 v24\"/><path d=\"M210 107 l30 -34\"/><text x=\"225\" y=\"64\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">FR NF</text><path d=\"M250 90 H330\"/><path d=\"M330 90 h15 M365 90 h15 M345 78 v24 M365 78 v24\"/><text x=\"355\" y=\"64\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Baixo NA</text><path d=\"M380 90 H515\"/><rect x=\"515\" y=\"72\" width=\"50\" height=\"36\" rx=\"0\"/><text x=\"540\" y=\"90\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM</text><path d=\"M565 90 H630\"/><path d=\"M300 90 V154 H330 M380 154 H410 V90\"/><path d=\"M330 154 h15 M365 154 h15 M345 142 v24 M365 142 v24\"/><text x=\"355\" y=\"128\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM</text><circle cx=\"300\" cy=\"90\" r=\"3\" fill=\"#C\" stroke=\"none\"/><circle cx=\"410\" cy=\"90\" r=\"3\" fill=\"#C\" stroke=\"none\"/><text x=\"325.0\" y=\"194\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Baixo fecha no nível mínimo; Alto abre no máximo</text>"
    ],
    [
      "el-seco-permissivo",
      "Recalque: permissivo contra funcionamento a seco",
      650,
      210,
      "<path d=\"M20 30 V180 M630 30 V180\"/><text x=\"20\" y=\"14\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L</text><text x=\"630\" y=\"14\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">N</text><path d=\"M20 90 H70\"/><path d=\"M70 90 h15 M105 90 h15 M85 78 v24 M105 78 v24\"/><text x=\"95\" y=\"64\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Água OK</text><path d=\"M120 90 H200\"/><path d=\"M200 90 h15 M235 90 h15 M215 78 v24 M235 78 v24\"/><path d=\"M210 107 l30 -34\"/><text x=\"225\" y=\"64\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">FR NF</text><path d=\"M250 90 H330\"/><path d=\"M330 90 h15 M365 90 h15 M345 78 v24 M365 78 v24\"/><text x=\"355\" y=\"64\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pedido</text><path d=\"M380 90 H515\"/><rect x=\"515\" y=\"72\" width=\"50\" height=\"36\" rx=\"0\"/><text x=\"540\" y=\"90\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM</text><path d=\"M565 90 H630\"/><text x=\"325.0\" y=\"194\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM só energiza com água disponível e pedido</text>"
    ],
    [
      "el-duas-bombas",
      "Duas bombas: alternância e reserva",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pedido</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">de nível</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Alternador</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">B1 / B2</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Intertrav.</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">e proteção</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM1 / KM2</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">bombas</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Esquema funcional; falha da titular chama a reserva</text>"
    ],
    [
      "el-recalque-pid",
      "Recalque: malha de pressão com inversor",
      720,
      260,
      "<rect x=\"20\" y=\"40\" width=\"130\" height=\"60\" rx=\"4\"/><text x=\"85.0\" y=\"59.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pressão</text><text x=\"85.0\" y=\"81.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">desejada</text><rect x=\"200\" y=\"40\" width=\"130\" height=\"60\" rx=\"4\"/><text x=\"265.0\" y=\"70.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PID</text><rect x=\"380\" y=\"40\" width=\"130\" height=\"60\" rx=\"4\"/><text x=\"445.0\" y=\"59.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Inversor</text><text x=\"445.0\" y=\"81.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">de frequência</text><rect x=\"560\" y=\"40\" width=\"130\" height=\"60\" rx=\"4\"/><text x=\"625.0\" y=\"59.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Bomba</text><text x=\"625.0\" y=\"81.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+ tubulação</text><path d=\"M150 70 L200 70\"/><path d=\"M200 70 L191.0 74.0 L191.0 66.0 Z\" fill=\"#C\"/><path d=\"M330 70 L380 70\"/><path d=\"M380 70 L371.0 74.0 L371.0 66.0 Z\" fill=\"#C\"/><path d=\"M510 70 L560 70\"/><path d=\"M560 70 L551.0 74.0 L551.0 66.0 Z\" fill=\"#C\"/><rect x=\"380\" y=\"155\" width=\"130\" height=\"60\" rx=\"4\"/><text x=\"445.0\" y=\"174.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Transmissor</text><text x=\"445.0\" y=\"196.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">de pressão</text><path d=\"M625 100 V185 H510 M380 185 H265 V100\" stroke-width=\"1.6\" stroke-dasharray=\"6 5\"/><path d=\"M265 125 L265 100\"/><path d=\"M265 100 L269.1 109.0 L260.9 109.0 Z\" fill=\"#C\"/><text x=\"360.0\" y=\"244\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Potência no inversor; sinal de realimentação tracejado</text>"
    ],
    [
      "el-reversao-intertravada",
      "Reversão: intertravamento elétrico cruzado",
      710,
      270,
      "<path d=\"M20 30 V220 M680 30 V220\"/><path d=\"M20 80 H75 M125 80 H245 M295 80 H415 M465 80 H535 M585 80 H680\"/><path d=\"M75 80 h15 M110 80 h15 M90 68 v24 M110 68 v24\"/><path d=\"M85 97 l30 -34\"/><text x=\"100\" y=\"54\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">FR NF</text><path d=\"M245 80 h15 M280 80 h15 M260 68 v24 M280 68 v24\"/><path d=\"M255 97 l30 -34\"/><text x=\"270\" y=\"54\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM2 NF</text><path d=\"M415 80 h15 M450 80 h15 M430 68 v24 M450 68 v24\"/><text x=\"440\" y=\"54\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pedido 1</text><rect x=\"535\" y=\"62\" width=\"50\" height=\"36\" rx=\"0\"/><text x=\"560\" y=\"80\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM1</text><path d=\"M20 170 H75 M125 170 H245 M295 170 H415 M465 170 H535 M585 170 H680\"/><path d=\"M75 170 h15 M110 170 h15 M90 158 v24 M110 158 v24\"/><path d=\"M85 187 l30 -34\"/><text x=\"100\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">FR NF</text><path d=\"M245 170 h15 M280 170 h15 M260 158 v24 M280 158 v24\"/><path d=\"M255 187 l30 -34\"/><text x=\"270\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM1 NF</text><path d=\"M415 170 h15 M450 170 h15 M430 158 v24 M450 158 v24\"/><text x=\"440\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pedido 2</text><rect x=\"535\" y=\"152\" width=\"50\" height=\"36\" rx=\"0\"/><text x=\"560\" y=\"170\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM2</text><text x=\"355.0\" y=\"254\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Reversão: também exigir intertravamento mecânico</text>"
    ],
    [
      "el-estrela-delta-sequencia",
      "Estrela-triângulo: sequência com intervalo",
      530,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KM + KY</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">acelera</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KY desliga</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">intervalo</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KΔ liga</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">regime</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><text x=\"265.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">KY e KΔ nunca simultâneos; motor deve admitir partida Y/Δ</text>"
    ]
  ],
  [
    [
      "el-tt-esquema",
      "Aterramento TT: fonte e instalação",
      570,
      255,
      "<rect x=\"20\" y=\"35\" width=\"120\" height=\"65\" rx=\"4\"/><text x=\"80.0\" y=\"56.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Fonte</text><text x=\"80.0\" y=\"78.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">N aterrado</text><rect x=\"220\" y=\"35\" width=\"100\" height=\"65\" rx=\"4\"/><text x=\"270.0\" y=\"67.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">DR</text><rect x=\"400\" y=\"35\" width=\"140\" height=\"65\" rx=\"4\"/><text x=\"470.0\" y=\"56.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Carga</text><text x=\"470.0\" y=\"78.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">carcaça</text><path d=\"M140 53 H220 M140 83 H220 M320 53 H400 M320 83 H400 M70 100 V165 M470 100 V165\"/><path d=\"M70 165 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><path d=\"M470 165 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><text x=\"70\" y=\"210\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Eletrodo da fonte</text><text x=\"470\" y=\"210\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Eletrodo da instalação</text><text x=\"180\" y=\"40\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L</text><text x=\"180\" y=\"110\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">N</text><text x=\"285.0\" y=\"239\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">TT: PE local; neutro e carcaça não se unem na carga</text>"
    ],
    [
      "el-tns-esquema",
      "Aterramento TN-S: N e PE separados",
      560,
      225,
      "<rect x=\"20\" y=\"30\" width=\"110\" height=\"70\" rx=\"4\"/><text x=\"75.0\" y=\"65.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Fonte</text><rect x=\"400\" y=\"30\" width=\"130\" height=\"80\" rx=\"4\"/><text x=\"465.0\" y=\"70.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Carga</text><path d=\"M130 45 H400 M130 75 H400 M130 95 H250 V140 H465 V110 M80 100 V140 H250 M80 140 V160\"/><path d=\"M80 160 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><text x=\"270\" y=\"30\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L</text><text x=\"270\" y=\"60\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">N</text><text x=\"300\" y=\"125\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PE</text><circle cx=\"80\" cy=\"140\" r=\"3\" fill=\"#C\" stroke=\"none\"/><text x=\"280.0\" y=\"209\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">TN-S: N e PE separados após a origem</text>"
    ],
    [
      "el-bep-conexoes",
      "BEP: ligações equipotenciais",
      640,
      220,
      "<rect x=\"245\" y=\"95\" width=\"150\" height=\"18\" rx=\"0\"/><text x=\"320\" y=\"79\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">BEP</text><rect x=\"20\" y=\"20\" width=\"110\" height=\"40\" rx=\"4\"/><text x=\"75.0\" y=\"40.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Carcaça</text><path d=\"M75 60 V104 H245\"/><rect x=\"175\" y=\"20\" width=\"110\" height=\"40\" rx=\"4\"/><text x=\"230.0\" y=\"40.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Tubulação</text><path d=\"M230 60 V104 H245\"/><rect x=\"365\" y=\"20\" width=\"110\" height=\"40\" rx=\"4\"/><text x=\"420.0\" y=\"40.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Estrutura</text><path d=\"M420 60 V104 H395\"/><rect x=\"510\" y=\"20\" width=\"110\" height=\"40\" rx=\"4\"/><text x=\"565.0\" y=\"40.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Eletrodo</text><path d=\"M565 60 V104 H395\"/><path d=\"M320 113 V165\"/><path d=\"M320 165 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><text x=\"320.0\" y=\"204\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Ligações equipotenciais; continuidade do PE é essencial</text>"
    ],
    [
      "el-dr-pe-fora",
      "DR tetrapolar: PE fora do sensor",
      660,
      305,
      "<rect x=\"180\" y=\"30\" width=\"130\" height=\"180\" rx=\"0\"/><text x=\"245\" y=\"52\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">DR</text><path d=\"M20 80 H470\"/><text x=\"46\" y=\"67\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L1</text><path d=\"M20 112 H470\"/><text x=\"46\" y=\"99\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L2</text><path d=\"M20 144 H470\"/><text x=\"46\" y=\"131\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L3</text><path d=\"M20 176 H470\"/><text x=\"46\" y=\"163\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">N</text><path d=\"M20 240 H470\"/><text x=\"80\" y=\"225\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PE</text><rect x=\"490\" y=\"30\" width=\"140\" height=\"235\" rx=\"4\"/><text x=\"560.0\" y=\"125.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Carga</text><text x=\"560.0\" y=\"147.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L1 L2 L3 N</text><text x=\"560.0\" y=\"169.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PE na carcaça</text><path d=\"M470 80 H490 M470 112 H490 M470 144 H490 M470 176 H490 M470 240 H490\"/><text x=\"330.0\" y=\"289\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Todos os condutores ativos passam pelo DR; PE não passa</text>"
    ],
    [
      "el-dps-paralelo",
      "DPS: conexão em paralelo L–PE (conceitual)",
      640,
      255,
      "<path d=\"M20 50 H470 M20 180 H470 M180 50 V85 M180 135 V180\"/><rect x=\"145\" y=\"85\" width=\"70\" height=\"50\" rx=\"4\"/><text x=\"180.0\" y=\"110.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">DPS</text><circle cx=\"180\" cy=\"50\" r=\"3\" fill=\"#C\" stroke=\"none\"/><circle cx=\"180\" cy=\"180\" r=\"3\" fill=\"#C\" stroke=\"none\"/><text x=\"40\" y=\"30\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">L</text><text x=\"40\" y=\"205\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PE</text><path d=\"M400 180 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><rect x=\"500\" y=\"35\" width=\"100\" height=\"65\" rx=\"4\"/><text x=\"550.0\" y=\"67.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Carga</text><path d=\"M470 50 H500\"/><text x=\"320.0\" y=\"239\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">DPS em paralelo, com proteção de retaguarda adequada</text>"
    ],
    [
      "el-protecao-coordenacao",
      "Motor: coordenação de proteções",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Curto</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">QF / fusível</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Manobra</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">contator KM</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Sobrecarga</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">relé FR</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Motor</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PE contínuo</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Selecionar conjunto coordenado e ajustar à placa do motor</text>"
    ]
  ],
  [
    [
      "el-seletividade-curvas",
      "Seletividade: curvas tempo-corrente",
      460,
      255,
      "<path d=\"M55 180 H420 M55 180 V25\"/><path d=\"M55 180 L410 180\"/><path d=\"M410 180 L401.0 184.1 L401.0 175.9 Z\" fill=\"#C\"/><path d=\"M55 180 L55 25\"/><path d=\"M55 25 L59.0 34.0 L51.0 34.0 Z\" fill=\"#C\"/><path d=\"M80 55 C130 70 155 120 180 160 M130 50 C220 70 250 120 280 155\" stroke-width=\"1.6\"/><text x=\"250\" y=\"205\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Corrente (A) • log</text><text x=\"95\" y=\"18\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Tempo (s)</text><text x=\"135\" y=\"95\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Jusante</text><text x=\"295\" y=\"105\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Montante</text><text x=\"230.0\" y=\"239\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Curvas ilustrativas; verificar seletividade do fabricante</text>"
    ],
    [
      "el-queda-tensao-loop",
      "Queda de tensão: ida e retorno",
      560,
      275,
      "<path d=\"M30 60 H150 M204 60 H410 V170 H204 M150 170 H30\"/><path d=\"M150 60 h12 m30 0 h12\"/><rect x=\"162\" y=\"54\" width=\"30\" height=\"12\" rx=\"0\"/><text x=\"177\" y=\"41\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">R ida</text><path d=\"M150 170 h12 m30 0 h12\"/><rect x=\"162\" y=\"164\" width=\"30\" height=\"12\" rx=\"0\"/><text x=\"177\" y=\"151\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">R volta</text><rect x=\"410\" y=\"40\" width=\"110\" height=\"150\" rx=\"4\"/><text x=\"465.0\" y=\"115.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Carga</text><text x=\"60\" y=\"35\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Fonte</text><text x=\"300\" y=\"85\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">I →</text><text x=\"275\" y=\"140\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">← I</text><text x=\"275\" y=\"230\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ΔV = I (R ida + R volta)</text><text x=\"280.0\" y=\"259\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Modelo resistivo CC; em CA considerar reatância e cos φ</text>"
    ],
    [
      "el-triangulo-potencias",
      "Triângulo de potências P, Q e S",
      460,
      310,
      "<path d=\"M60 200 H340 V45 Z\"/><text x=\"200\" y=\"222\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">P (kW)</text><text x=\"385\" y=\"125\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Q (kvar)</text><text x=\"165\" y=\"102\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">S (kVA)</text><path d=\"M105 200 A45 45 0 0 0 98 176\" stroke-width=\"1.6\"/><text x=\"125\" y=\"179\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">φ</text><text x=\"240\" y=\"275\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">cos φ = P / S • S² = P² + Q²</text>"
    ],
    [
      "el-compensacao-reativa",
      "Compensação reativa: banco em derivação",
      550,
      270,
      "<path d=\"M20 40 H500 M20 190 H500 M180 40 V75 M180 115 V190 M400 40 V105 M370 105 H430 M370 120 H430 M400 120 V190\"/><rect x=\"130\" y=\"75\" width=\"100\" height=\"40\" rx=\"4\"/><text x=\"180.0\" y=\"95.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Motor</text><text x=\"460\" y=\"100\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Qcap</text><circle cx=\"180\" cy=\"40\" r=\"3\" fill=\"#C\" stroke=\"none\"/><circle cx=\"400\" cy=\"40\" r=\"3\" fill=\"#C\" stroke=\"none\"/><text x=\"275\" y=\"225\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Qrede = Qmotor − Qcap</text><text x=\"275.0\" y=\"254\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Banco dimensionado; avaliar harmônicos e sobrecompensação</text>"
    ],
    [
      "el-bornes-recalque",
      "Recalque: régua de bornes funcional 24 V",
      640,
      240,
      "<rect x=\"40\" y=\"35\" width=\"560\" height=\"160\" rx=\"0\" stroke-dasharray=\"6 5\"/><circle cx=\"90\" cy=\"85\" r=\"10\"/><path d=\"M90 45 V75 M90 95 V185\"/><text x=\"130\" y=\"125\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+24 V</text><circle cx=\"180\" cy=\"85\" r=\"10\"/><path d=\"M180 45 V75 M180 95 V185\"/><text x=\"220\" y=\"125\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">0 V</text><circle cx=\"270\" cy=\"85\" r=\"10\"/><path d=\"M270 45 V75 M270 95 V185\"/><text x=\"310\" y=\"125\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Nível baixo</text><circle cx=\"360\" cy=\"85\" r=\"10\"/><path d=\"M360 45 V75 M360 95 V185\"/><text x=\"400\" y=\"125\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Nível alto</text><circle cx=\"450\" cy=\"85\" r=\"10\"/><path d=\"M450 45 V75 M450 95 V185\"/><text x=\"490\" y=\"125\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Água OK</text><circle cx=\"540\" cy=\"85\" r=\"10\"/><path d=\"M540 45 V75 M540 95 V185\"/><text x=\"580\" y=\"125\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PE</text><text x=\"320.0\" y=\"224\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Bornes funcionais genéricos; circuito de potência separado</text>"
    ],
    [
      "el-diagnostico-motor",
      "Motor não parte: roteiro de diagnóstico",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Alimentação</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">e proteção</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Permissivos</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">e comando</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Tensão</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">na bobina</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Contator</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">e motor</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Desenergizar para inspeção; medições por pessoa habilitada</text>"
    ]
  ],
  [
    [
      "el-eta-misturador",
      "ETA: acionamento do motor do misturador",
      530,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">QF + proteção</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">potência</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Inversor</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">velocidade</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Motor</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">misturador</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><text x=\"265.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Proteção e torque conforme projeto; PE contínuo até o motor</text>"
    ],
    [
      "el-eta-dosagem-vazao",
      "ETA: comando proporcional de dosagem pela vazão",
      690,
      280,
      "<rect x=\"20\" y=\"40\" width=\"150\" height=\"70\" rx=\"4\"/><text x=\"95.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Medidor</text><text x=\"95.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">de vazão Q</text><rect x=\"250\" y=\"40\" width=\"160\" height=\"70\" rx=\"4\"/><text x=\"330.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Dosagem</text><text x=\"330.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">D = k × Q</text><rect x=\"490\" y=\"40\" width=\"160\" height=\"70\" rx=\"4\"/><text x=\"570.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Acionamento</text><text x=\"570.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">bomba dosadora</text><path d=\"M170 75 L250 75\"/><path d=\"M250 75 L241.0 79.0 L241.0 71.0 Z\" fill=\"#C\"/><path d=\"M410 75 L490 75\"/><path d=\"M490 75 L481.0 79.0 L481.0 71.0 Z\" fill=\"#C\"/><rect x=\"250\" y=\"160\" width=\"160\" height=\"70\" rx=\"4\"/><text x=\"330.0\" y=\"184.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Permissivos</text><text x=\"330.0\" y=\"206.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">nível / falha</text><path d=\"M410 195 H570 V110\" stroke-width=\"1.6\" stroke-dasharray=\"6 5\"/><path d=\"M570 135 L570 110\"/><path d=\"M570 110 L574.0 119.0 L566.0 119.0 Z\" fill=\"#C\"/><text x=\"210\" y=\"55\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Sinal</text><text x=\"450\" y=\"55\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Comando</text><text x=\"345.0\" y=\"264\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Malha funcional: sem fluxo, bloquear dosagem; ajustar unidades</text>"
    ]
  ]
];
// AMPLIACAO-B-FIM

export default {
  id: 'eletrica', nome: 'Elétrica',
  destaques: [
    'el-resistor', 'el-capacitor', 'el-indutor', 'el-bateria', 'el-ca', 'el-terra',
    'el-amperimetro', 'el-voltimetro', 'el-chave', 'el-fusivel', 'el-disjuntor', 'el-contator',
    'el-rele', 'el-lampada', 'el-motor3', 'el-trafo',
  ],
  secoes: [
    ["Recalque — potência e comando (didático)", AMPLIACAO_B[0]],
    ["Proteção e aterramento — esquemas didáticos", AMPLIACAO_B[1]],
    ["Medição, energia e modelos preenchíveis", AMPLIACAO_B[2]],
    ["ETA — acionamento e dosagem (funcional)", AMPLIACAO_B[3]],
    ['Componentes passivos', [
      ['el-resistor', 'Resistor', 140, 40, '<path d="M4 20 H36 M104 20 H136"/><rect x="36" y="8" width="68" height="24"/>'],
      ['el-resistorA', 'Resistor (zigue-zague)', 140, 40, '<path d="M4 20 H34 L40 6 L52 34 L64 6 L76 34 L88 6 L100 34 L106 20 H136"/>'],
      ['el-resvar', 'Resistor variável', 140, 60, '<path d="M4 30 H36 M104 30 H136"/><rect x="36" y="18" width="68" height="24"/><path d="M38 54 L94 12" stroke-width="1.8"/>' + head(100, 8, -36, 10)],
      ['el-pot', 'Potenciômetro', 140, 60, '<path d="M4 22 H36 M104 22 H136"/><rect x="36" y="10" width="68" height="24"/><path d="M70 56 V44"/>' + head(70, 35, -90, 10)],
      ['el-capacitor', 'Capacitor', 120, 60, '<path d="M4 30 H52 M68 30 H116"/><path d="M52 8 V52 M68 8 V52" stroke-width="3.5"/>'],
      ['el-eletrolitico', 'Capacitor polarizado', 120, 60, '<path d="M4 30 H52 M70 30 H116"/><path d="M52 8 V52" stroke-width="3.5"/><path d="M76 8 Q64 30 76 52" stroke-width="3.5"/>' + T(38, 12, '+', 18)],
      ['el-capvar', 'Capacitor variável', 120, 70, '<path d="M4 35 H52 M68 35 H116"/><path d="M52 14 V56 M68 14 V56" stroke-width="3.5"/><path d="M36 62 L79 14" stroke-width="1.8"/>' + head(84, 8, -50, 10)],
      ['el-indutor', 'Indutor', 140, 40, '<path d="M4 28 H26 A11 11 0 0 1 48 28 A11 11 0 0 1 70 28 A11 11 0 0 1 92 28 A11 11 0 0 1 114 28 H136"/>'],
      ['el-indnucleo', 'Indutor com núcleo', 140, 50, '<path d="M4 38 H26 A11 11 0 0 1 48 38 A11 11 0 0 1 70 38 A11 11 0 0 1 92 38 A11 11 0 0 1 114 38 H136"/><path d="M26 10 H114 M26 16 H114" stroke-width="1.8"/>'],
      ['el-fio', 'Fio', 120, 20, '<path d="M4 10 H116"/>'],
      ['el-no', 'Nó / junção', 30, 30, '<circle cx="15" cy="15" r="6" fill="#C"/>'],
      ['el-cruz', 'Cruzamento sem conexão', 80, 80, '<path d="M4 40 H30 A10 10 0 0 1 50 40 H76 M40 4 V76"/>'],
    ]],
    ['Fontes e aterramento', [
      ['el-bateria', 'Bateria / fonte CC', 140, 70, '<path d="M4 35 H36 M104 35 H136"/><path d="M36 10 V60 M92 10 V60"/><path d="M48 22 V48 M104 22 V48" stroke-width="5"/><path d="M54 35 H86" stroke-width="1.6" stroke-dasharray="3 4"/>' + T(24, 12, '+', 18)],
      ['el-pilha', 'Pilha (uma célula)', 110, 70, '<path d="M4 35 H46 M64 35 H106"/><path d="M46 8 V62"/><path d="M64 22 V48" stroke-width="5"/>' + T(34, 12, '+', 18)],
      ['el-ca', 'Fonte CA', 110, 70, '<circle cx="55" cy="35" r="26"/><path d="M4 35 H29 M81 35 H106 M41 35 Q48 20 55 35 T69 35"/>'],
      ['el-fontei', 'Fonte de corrente', 110, 70, circ('<path d="M40 35 H62"/>' + head(72, 35, 0, 11))],
      ['el-fontev', 'Fonte de tensão controlada', 110, 70, '<path d="M55 8 L82 35 L55 62 L28 35 Z M4 35 H28 M82 35 H106"/>' + T(43, 35, '+', 20) + T(67, 35, '−', 22)],
      ['el-fonteic', 'Fonte de corrente controlada', 110, 70, '<path d="M55 8 L82 35 L55 62 L28 35 Z M4 35 H28 M82 35 H106"/><path d="M40 35 H60"/>' + head(70, 35, 0, 10)],
      ['el-terra', 'Terra', 60, 70, '<path d="M30 4 V36 M8 36 H52 M16 48 H44 M24 60 H36"/>'],
      ['el-massa', 'Massa / chassi', 60, 56, '<path d="M30 4 V30 M8 30 H52"/><path d="M16 30 L8 44 M30 30 L22 44 M44 30 L36 44" stroke-width="2"/>'],
      ['el-pe', 'Terra de proteção (PE)', 70, 84, '<circle cx="35" cy="50" r="28"/><path d="M35 4 V42 M19 42 H51 M25 52 H45 M31 62 H39"/>'],
      ...FONTES2,
    ]],
    ['Medição', [
      med('el-amperimetro', 'Amperímetro', 'A'),
      med('el-voltimetro', 'Voltímetro', 'V'),
      med('el-ohmimetro', 'Ohmímetro', 'Ω'),
      med('el-wattimetro', 'Wattímetro', 'W'),
      med('el-frequencimetro', 'Frequencímetro', 'Hz', 18),
      ['el-galvanometro', 'Galvanômetro', 110, 70, circ('<path d="M44 48 L62 26" stroke-width="2"/>' + head(67, 20, -50, 10) + '<path d="M38 26 Q55 14 72 26" stroke-width="1.4"/>')],
      ['el-osciloscopio', 'Osciloscópio', 120, 80, '<rect x="16" y="8" width="88" height="64" rx="6"/><rect x="26" y="16" width="68" height="40" stroke-width="1.6"/><path d="M30 36 Q38 20 46 36 T62 36 T78 36 T94 36" stroke-width="1.8"/><circle cx="44" cy="64" r="3"/><circle cx="76" cy="64" r="3"/><path d="M4 40 H16 M104 40 H116"/>'],
      ['el-kwh', 'Medidor de energia (kWh)', 120, 70, '<rect x="30" y="10" width="60" height="50"/><path d="M4 35 H30 M90 35 H116"/>' + T(60, 35, 'kWh', 17)],
      ...MEDICAO2,
    ]],
    ['Comando e proteção', [
      ['el-chave', 'Interruptor', 120, 50, '<path d="M4 38 H34 M86 38 H116 M38 36 L82 10"/><circle cx="36" cy="38" r="3" fill="#C"/><circle cx="84" cy="38" r="3" fill="#C"/>'],
      ['el-botNA', 'Botoeira NA', 120, 70, '<path d="M4 58 H36 V50 M116 58 H84 V50 M30 42 H90 M48 8 V18 H72 V8"/><path d="M60 42 V18" stroke-width="1.8" stroke-dasharray="4 3"/>'],
      ['el-botNF', 'Botoeira NF', 120, 70, '<path d="M4 42 H36 V54 M116 42 H84 V54 M30 54 H90 M48 8 V18 H72 V8"/><path d="M60 54 V18" stroke-width="1.8" stroke-dasharray="4 3"/>'],
      ['el-contNA', 'Contato NA', 120, 50, '<path d="M4 36 H40 L82 14 M84 36 H116"/>'],
      ['el-contNF', 'Contato NF', 120, 50, '<path d="M4 36 H40 L92 12 M80 36 V18 M80 36 H116"/>'],
      ['el-rele', 'Relé (bobina)', 80, 90, '<rect x="14" y="28" width="52" height="34"/><path d="M40 4 V28 M40 62 V86"/>'],
      ['el-contator', 'Contator (contato principal)', 120, 50, '<path d="M4 36 H40 L80 12 M84 36 H116 M84 36 A7 7 0 0 1 84 22"/>'],
      ['el-fusivel', 'Fusível', 130, 40, '<rect x="34" y="10" width="62" height="20"/><path d="M4 20 H126"/>'],
      ['el-disjuntor', 'Disjuntor monopolar', 120, 50, '<path d="M4 36 H36 L78 12 M84 36 H116"/><path d="M79 31 L89 41 M89 31 L79 41" stroke-width="2"/>'],
      ['el-dr', 'DR (diferencial residual)', 140, 80, '<path d="M4 44 H40 L84 18 M88 44 H136"/><path d="M83 39 L93 49 M93 39 L83 49" stroke-width="2"/><ellipse cx="22" cy="44" rx="5" ry="12" stroke-width="2"/><path d="M22 56 V70 H62 V33" stroke-width="1.6" stroke-dasharray="4 3"/>' + T(110, 66, 'IΔn', 14)],
      ['el-dps', 'DPS (surto)', 70, 110, '<path d="M35 4 V24 M35 70 V84 M17 84 H53 M23 94 H47 M29 104 H41"/><rect x="20" y="24" width="30" height="46"/><path d="M41 30 L31 47 H40 L33 60" stroke-width="1.8"/>' + head(30, 66, 118, 8)],
      ['el-seccionadora', 'Seccionadora', 120, 50, '<path d="M4 36 H40 L82 12 M84 36 H116 M84 28 V44"/>'],
      ...PROTECAO,
    ]],
    ['Comandos elétricos', [
      ...COMANDOS,
    ]],
    ['Máquinas e transformadores', [
      maq('el-motor', 'Motor CA', 'M', CA),
      maq('el-motorcc', 'Motor CC', 'M', CC),
      maq('el-gerador', 'Gerador CC', 'G', CC),
      maq('el-alternador', 'Alternador', 'G', CA),
      ['el-trafo', 'Transformador monofásico', 120, 100, '<path d="M30 8 V20 A10 10 0 0 1 30 40 A10 10 0 0 1 30 60 A10 10 0 0 1 30 80 V92 M90 8 V20 A10 10 0 0 0 90 40 A10 10 0 0 0 90 60 A10 10 0 0 0 90 80 V92"/><path d="M56 14 V86 M64 14 V86" stroke-width="1.8"/>'],
      ['el-trafoiec', 'Transformador (círculos)', 130, 70, '<circle cx="50" cy="35" r="24"/><circle cx="80" cy="35" r="24"/><path d="M4 35 H26 M104 35 H126"/>'],
      ['el-trafo3', 'Transformador trifásico (Y-Δ)', 140, 80, '<circle cx="56" cy="40" r="26"/><circle cx="84" cy="40" r="26"/><path d="M4 40 H30 M110 40 H136"/><path d="M10 46 L16 34 M15 46 L21 34 M20 46 L26 34 M114 46 L120 34 M119 46 L125 34 M124 46 L130 34" stroke-width="1.6"/><path d="M44 42 V52 M44 42 L36 34 M44 42 L52 34 M96 31 L104 47 H88 Z" stroke-width="1.8"/>'],
      ['el-autotrafo', 'Autotransformador', 100, 110, '<path d="M40 4 V18 A9 9 0 0 1 40 36 A9 9 0 0 1 40 54 A9 9 0 0 1 40 72 A9 9 0 0 1 40 90 V106 M96 54 H58"/>' + head(50, 54, 180, 10)],
      ...MAQS2,
    ]],
    ['Transformadores e reatores', [
      ...TRAFOS,
    ]],
    ['Instalações prediais (NBR 5444)', [
      ['el-luzteto', 'Ponto de luz no teto', 80, 80, '<circle cx="40" cy="40" r="28"/><path d="M12 40 H68" stroke-width="1.6"/>' + T(40, 28, 'a', 15) + T(40, 53, '100', 13)],
      ['el-arandela', 'Arandela', 80, 80, '<path d="M8 72 H72" stroke-width="4"/><path d="M40 72 V54"/><circle cx="40" cy="34" r="20"/>'],
      ['el-intsimples', 'Interruptor simples', 70, 60, '<circle cx="28" cy="34" r="17"/>' + T(28, 34, 'S', 17) + T(56, 14, 'a', 14)],
      ['el-intparalelo', 'Interruptor paralelo (three-way)', 70, 60, '<circle cx="28" cy="34" r="19"/>' + T(28, 34, 'S3w', 12) + T(58, 14, 'a', 14)],
      ['el-tombaixa', 'Tomada baixa', 80, 70, parede + tri],
      ['el-tommedia', 'Tomada média', 80, 70, parede + tri + '<path d="M18 58 L62 58 L51 39 L29 39 Z" fill="#C"/>'],
      ['el-tomalta', 'Tomada alta', 80, 70, parede + '<path d="M18 58 L62 58 L40 20 Z" fill="#C"/>'],
      ['el-tomada', 'Tomada (genérica)', 90, 70, '<path d="M10 62 H80 M45 62 V40 M20 40 A25 25 0 0 1 70 40 Z"/>'],
      ['el-quadro', 'Quadro de distribuição', 100, 60, '<rect x="8" y="10" width="84" height="40"/><path d="M8 50 L92 10 V50 Z" fill="#C"/>'],
      ['el-eletroduto', 'Eletroduto (teto/parede)', 140, 60, '<path d="M4 26 H136"/><path d="M44 16 V36 M70 16 V36 M96 16 V36 H102" stroke-width="2"/><circle cx="70" cy="13" r="3" fill="#C" stroke="none"/>' + T(44, 50, 'N', 12) + T(70, 50, 'F', 12) + T(96, 50, 'R', 12)],
      ['el-eletroduto-piso', 'Eletroduto no piso', 140, 30, '<path d="M4 15 H136" stroke-dasharray="10 6"/>'],
      ['el-campainha', 'Campainha', 80, 56, '<path d="M16 24 A24 24 0 0 0 64 24 Z M30 4 V24 M50 4 V24"/>'],
      ['el-lampada', 'Lâmpada', 110, 70, '<circle cx="55" cy="35" r="24"/><path d="M38 18 L72 52 M72 18 L38 52 M4 35 H31 M79 35 H106"/>'],
      ['el-chuveiro', 'Chuveiro elétrico', 80, 90, '<path d="M40 4 V20 M22 20 H58 L66 34 H14 Z"/><path d="M20 44 L16 62 M32 44 L30 64 M48 44 L50 64 M60 44 L64 62" stroke-width="1.6" stroke-dasharray="3 4"/>'],
      ...PREDIAIS2,
    ]],
    ['Diagrama unifilar', [
      ...UNIFILAR,
    ]],
  ],
};
