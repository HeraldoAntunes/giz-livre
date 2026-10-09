// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
import { T, head } from './base.js';

// Saneamento: unidades de ETA e ETE, ensaios e tratamento do lodo. Desenhos próprios em corte (perfil) ou planta,
// seguindo só as convenções usuais de fluxograma de processo (ISO 10628); nada copiado de outras bibliotecas.
// As formas 'hd-*' vieram de hidraulica.js e mantêm o id (há quadros salvos com elas). Prefixo das novas: 'sn-'.
const tn = 'stroke-width="1.6"'; // traço fino de detalhe
const dash = `stroke-dasharray="7 5" ${tn}`; // nível de líquido
const lv = (x0, x1, y) => `<path d="M${x0} ${y} H${x1}" ${dash}/>`;

// pontos (areia, lodo) num retângulo, em linhas desencontradas
const dots = (x0, x1, y0, y1, s = 7) => {
  let d = '';
  for (let y = y0, i = 0; y <= y1; y += s, i++) for (let x = x0 + (i % 2 ? s / 2 : 0); x <= x1; x += s) d += `M${x} ${y}h0.01`;
  return `<path d="${d}" stroke-width="2.6"/>`;
};
// pedras (brita, cascalho) em fileiras
const stones = (x0, x1, y0, y1, r = 3.2, g = 2) => {
  let c = '';
  for (let y = y0, i = 0; y <= y1; y += 2 * r + g, i++) for (let x = x0 + (i % 2 ? r + g / 2 : 0); x <= x1; x += 2 * r + g) c += `<circle cx="${x}" cy="${y}" r="${r}" ${tn}/>`;
  return c;
};
// onda de lodo/superfície entre x0 e x1
const wave = (x0, x1, y, a = 4, p = 16) => {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1; x += p) d += ` q${p / 4} ${-a} ${p / 2} 0 t${p / 2} 0`;
  return d;
};
const bolhas = (pts, r = 2.6) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" stroke-width="1.4"/>`).join('');
// motor (caixa com M) centrado em x, topo em y
const mot = (x, y, w = 24, h = 14) => `<rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" rx="2"/>` + T(x, y + h / 2, 'M', 11);
// seta fina horizontal/vertical terminando em ponta cheia
const setaH = (x0, x1, y, L = 9) => `<path d="M${x0} ${y} H${x1 - Math.sign(x1 - x0) * L}" ${tn}/>` + head(x1, y, x1 > x0 ? 0 : 180, L);
const setaV = (x, y0, y1, L = 9) => `<path d="M${x} ${y0} V${y1 - Math.sign(y1 - y0) * L}" ${tn}/>` + head(x, y1, y1 > y0 ? 90 : -90, L);
// bomba pequena (círculo com triângulo) apontando para a direita (dir=1) ou esquerda (dir=-1)
const bombinha = (cx, cy, r = 10, dir = 1) => `<circle cx="${cx}" cy="${cy}" r="${r}"/><path d="M${cx - dir * r * 0.45} ${cy - r * 0.55} L${cx + dir * r * 0.6} ${cy} L${cx - dir * r * 0.45} ${cy + r * 0.55} Z" fill="#C" stroke="none"/>`;
// sol (lagoas)
const sol = (cx, cy, r = 8) => `<circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="2"/><path d="${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); return `M${(cx + c * (r + 3)).toFixed(1)} ${(cy + s * (r + 3)).toFixed(1)} L${(cx + c * (r + 8)).toFixed(1)} ${(cy + s * (r + 8)).toFixed(1)}`; }).join('')}" ${tn}/>`;

// filtro em corte (caixa de x a x+w, y de 10 a 136); up = fluxo ascendente
const filtro = (x, w, up) => {
  const r = x + w, c = x + w / 2;
  const caixa = `<rect x="${x}" y="10" width="${w}" height="126" rx="2"/>` + lv(x, r, 24) + `<path d="M${x + 4} 124 H${r - 4}" stroke-dasharray="3 4" ${tn}/>`;
  if (up) return caixa + `<path d="M${x} 58 H${r} M${x} 92 H${r}" ${tn}/>` + dots(x + 7, r - 7, 63, 87, 5) + stones(x + 8, r - 6, 99, 116) + setaV(c, 52, 30, 10);
  return caixa + `<path d="M${x} 60 H${r} M${x} 80 H${r} M${x} 102 H${r}" ${tn}/>` + dots(x + 8, r - 8, 65, 76, 8) + dots(x + 7, r - 7, 85, 98, 5) + stones(x + 8, r - 6, 108, 116) + setaV(c, 30, 54, 10);
};
// dosador: tanque com agitador + bomba dosadora; rótulo do produto acima da bomba
const dosador = (label, size = 13) => `<rect x="8" y="24" width="60" height="80" rx="3"/>${lv(8, 68, 38)}${mot(38, 4)}<path d="M38 18 V84"/><path d="M28 84 L48 90 M28 90 L48 84" stroke-width="2"/><path d="M68 92 H92 M116 92 H146"/>${bombinha(104, 92, 12)}` + T(108, 50, label, size);
// lagoa em perfil (taludes)
const lagoa = (yTopo, yFundo, x0 = 24, x1 = 176, inc = 24) => `<path d="M4 ${yTopo} H${x0} L${x0 + inc} ${yFundo} H${x1 - inc} L${x1} ${yTopo} H196"/>`;
const carrier = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="5" ${tn}/><path d="M${cx - 5} ${cy} H${cx + 5} M${cx} ${cy - 5} V${cy + 5}" stroke-width="1.2"/>`;
const chama = (cx, y) => `<path d="M${cx} ${y} Q${cx - 13} ${y - 12} ${cx - 7} ${y - 26} Q${cx - 4} ${y - 16} ${cx + 1} ${y - 20} Q${cx + 5} ${y - 32} ${cx - 1} ${y - 46} Q${cx + 17} ${y - 28} ${cx + 9} ${y - 10} Q${cx + 7} ${y} ${cx} ${y} Z" ${tn}/>`;
// caixa de fluxograma com rótulo
const bloco = (x, y, w, h, s, size = 10) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>` + T(x + w / 2, y + h / 2, s, size);
// grãos escuros (carvão, antracito): losangos cheios em linhas desencontradas
const gran = (x0, x1, y0, y1, s = 7) => {
  let d = '';
  for (let y = y0, i = 0; y <= y1; y += s, i++) for (let x = x0 + (i % 2 ? s / 2 : 0); x <= x1; x += s) d += `M${x} ${y - 2.2}l2.2 2.2l-2.2 2.2l-2.2 -2.2Z`;
  return `<path d="${d}" fill="#C" stroke="none"/>`;
};
// junco (macrófita) com base em (x,y) e altura h; taboa com espiga cheia
const junco = (x, y, h = 44) => `<path d="M${x} ${y} V${y - h} M${x} ${y - h * 0.45} Q${x - 8} ${y - h * 0.65} ${x - 11} ${y - h * 0.9} M${x} ${y - h * 0.55} Q${x + 8} ${y - h * 0.75} ${x + 11} ${y - h}" ${tn}/>`;
const taboa = (x, y, h = 60) => `<path d="M${x} ${y} V${y - h} M${x} ${y - 10} Q${x - 10} ${y - 30} ${x - 12} ${y - h * 0.7} M${x} ${y - 14} Q${x + 9} ${y - 32} ${x + 10} ${y - h * 0.75}" ${tn}/><rect x="${x - 2.5}" y="${y - h + 4}" width="5" height="14" rx="2.5" fill="#C" stroke="none"/>`;
// vapor subindo (3 ondas) a partir de (x,y)
const vapor = (x, y) => `<path d="M${x} ${y} q5 -6 0 -12 t0 -12" ${tn}/>`;
const gradeFrente = (s, sw) => { let d = ''; for (let x = 20 + s; x < 120; x += s) d += `M${x} 20 V100`; return `<path d="M14 10 V104 H126 V10"/>${lv(14, 126, 40)}<path d="M14 20 H126" ${tn}/><path d="${d}" stroke-width="${sw}"/>`; };

const grupo = {
  id: 'saneamento', nome: 'Saneamento (ETA e ETE)',
  destaques: [
    'sn-captacao', 'sn-parshall-mistura', 'hd-floculador', 'hd-decantador', 'hd-filtro-areia',
    'hd-contato', 'sn-reserv-tratada', 'sn-eta-blocos', 'hd-grade', 'hd-desarenador',
    'sn-tanque-septico', 'hd-uasb', 'sn-lodo-ativado', 'hd-dec-sec', 'hd-lagoa', 'hd-leito',
  ],
  secoes: [
    ['ETA: captação, mistura e floculação', [
      ['sn-captacao', 'Captação com poço de sucção', 200, 120, `<path d="M4 100 Q36 108 64 98 L96 30 H110 M150 30 H196 M110 30 V112 H150 V30"/>${lv(4, 86, 44)}${lv(110, 150, 50)}<path d="M30 76 H110 M30 86 H110"/><path d="M30 70 V92" stroke-width="3.5"/><path d="M130 100 V16 H166 M186 16 H196"/><circle cx="176" cy="16" r="10"/><rect x="124" y="100" width="12" height="8" ${tn}/>`],
      ['sn-parshall-mistura', 'Calha Parshall (mistura rápida)', 200, 110, `<path d="M4 80 H70 L90 96 L130 88 H196"/><path d="M4 40 H66 Q84 42 94 70 Q104 78 108 66 q4 -8 8 -4 q4 -8 8 -6 H196" ${tn}/>${setaV(100, 22, 56, 10)}` + T(146, 14, 'coagulante', 13)],
      ['sn-mistura-rapida', 'Mistura rápida mecanizada', 110, 130, `<path d="M14 30 V124 H96 V30 M4 110 H14 M96 50 H106"/>${lv(14, 96, 40)}${mot(55, 6, 28, 18)}<path d="M55 24 V96 M37 96 H73"/><rect x="35" y="89" width="8" height="14" fill="#C"/><rect x="67" y="89" width="8" height="14" fill="#C"/><path d="M20 52 V114 M90 52 V114" ${tn}/>`],
      ['hd-floculador', 'Floculador mecanizado (eixo vertical)', 110, 120, `<path d="M10 30 V114 H100 V30 M55 20 V100"/><path d="M10 40 H100" ${dash}/><rect x="42" y="4" width="26" height="16" rx="2"/><path d="M38 56 H72 M38 80 H72 M38 50 V62 M72 50 V62 M38 74 V86 M72 74 V86" stroke-width="2.2"/>`],
      ['sn-floc-horizontal', 'Floculador mecanizado (eixo horizontal)', 220, 100, `<path d="M8 20 V94 H192 V20"/>${lv(8, 192, 28)}<path d="M4 58 H198" stroke-width="2"/>${[50, 100, 150].map(x => `<circle cx="${x}" cy="58" r="20" ${tn}/><path d="M${x} 38 V78" ${tn}/><path d="M${x - 20} 52 V64 M${x + 20} 52 V64 M${x - 6} 38 H${x + 6} M${x - 6} 78 H${x + 6}" stroke-width="3.5"/>`).join('')}<path d="M75 20 V94 M125 20 V94" stroke-dasharray="6 4" ${tn}/><rect x="198" y="50" width="18" height="16" rx="2"/>` + T(207, 58, 'M', 11)],
      ['hd-floc-chicana', 'Floculador de chicanas (fluxo horizontal)', 160, 90, '<rect x="4" y="10" width="152" height="70" rx="2"/><path d="M30 10 V62 M56 80 V28 M82 10 V62 M108 80 V28 M134 10 V62"/>'],
      ['sn-floc-chic-vert', 'Floculador de chicanas (fluxo vertical)', 180, 110, `<path d="M8 14 V104 H172 V14 M40 8 V84 M72 104 V40 M104 8 V84 M136 104 V40"/>${lv(8, 172, 24)}${setaV(24, 36, 82)}${setaV(56, 94, 48)}${setaV(88, 36, 82)}${setaV(120, 94, 48)}${setaV(154, 36, 82)}`],
      ['sn-floc-alabama', 'Floculador Alabama', 200, 110, `<path d="M8 14 V104 H192 V14 M69 14 V104 M130 14 V104 M192 30 H196"/>${lv(8, 192, 24)}<path d="M4 88 H11 Q19 88 19 80 V66 M4 98 H13 Q29 98 29 82 V66 M58 88 H72 Q80 88 80 80 V66 M58 98 H74 Q90 98 90 82 V66 M119 88 H133 Q141 88 141 80 V66 M119 98 H135 Q151 98 151 82 V66" stroke-width="2"/>${setaV(24, 62, 40)}${setaV(85, 62, 40)}${setaV(146, 62, 40)}`],
      ['sn-eta-blocos', 'ETA convencional (fluxograma)', 256, 124, [['Captação', 4, 6], ['Coagulação', 90, 6], ['Floculação', 176, 6], ['Decantação', 176, 48], ['Filtração', 90, 48], ['Desinfecção', 4, 48], ['Fluoretação', 4, 90], ['Reservação', 90, 90], ['Distribuição', 176, 90]].map(([s, x, y]) => bloco(x, y, 76, 28, s)).join('') + setaH(80, 90, 20, 6) + setaH(166, 176, 20, 6) + setaV(214, 34, 48, 6) + setaH(176, 166, 62, 6) + setaH(90, 80, 62, 6) + setaV(42, 76, 90, 6) + setaH(80, 90, 104, 6) + setaH(166, 176, 104, 6)],
      ['sn-eta-compacta', 'ETA compacta (pré-fabricada)', 230, 132, `<rect x="10" y="18" width="210" height="90" rx="3"/><path d="M80 18 V96 M150 34 V108 M4 96 H10 M220 102 H226 M20 108 V126 M115 108 V126 M210 108 V126 M14 126 H26 M109 126 H121 M204 126 H216"/><path d="M28 18 V88 M46 108 V38 M64 18 V88" stroke-width="2"/>${lv(80, 150, 28)}<path d="${[88, 97, 106, 115, 124, 133].map(x => `M${x} 88 l14 -40`).join('')}" stroke-width="1.8"/>${lv(150, 220, 28)}${dots(158, 212, 54, 76, 6)}${stones(158, 212, 86, 98)}` + T(45, 9, 'floculação', 10) + T(115, 9, 'decantação', 10) + T(185, 9, 'filtração', 10)],
      ['sn-aerador-bandejas', 'Aerador de bandejas', 140, 160, `<path d="M4 10 H70 V18 M20 138 V154 H120 V138 M120 150 H136"/><path d="M24 18 V138 M116 18 V138" ${tn}/>${[24, 50, 76, 102].map(y => `<path d="M30 ${y} V${y + 10} H110 V${y}"/><path d="M34 ${y + 10} H106" stroke-dasharray="2 4" stroke-width="2.4"/>`).join('')}<path d="${[24, 50, 76, 102].map(y => [44, 60, 76, 96].map(x => `M${x} ${y + 15}v7`).join('')).join('')}" stroke-dasharray="3 3" ${tn}/>${lv(20, 120, 144)}`],
    ]],
    ['ETA: decantação, flotação e filtração', [
      ['hd-decantador', 'Decantador convencional', 170, 90, `<path d="M14 14 V70 L40 84 L54 70 H160 V14 M4 30 H14 M40 84 V88"/><path d="M14 22 H160" ${dash}/><path d="M26 14 V44 M160 22 H166" ${tn}/>` + dots(30, 50, 74, 80, 6)],
      ['sn-dec-alta-taxa', 'Decantador de alta taxa (placas)', 180, 122, `<path d="M10 14 V76 L70 112 H110 L170 76 V14 M4 72 H10 M170 30 H176 M90 112 V118"/>${lv(10, 170, 22)}<path d="${[30, 42, 54, 66, 78, 90, 102, 114, 126, 138].map(x => `M${x} 70 l19.6 -34`).join('')}" stroke-width="2"/><path d="M40 24 v6 h12 v-6 M84 24 v6 h12 v-6 M128 24 v6 h12 v-6" ${tn}/>` + dots(62, 118, 100, 108, 6)],
      ['sn-flotador', 'Flotador por ar dissolvido (FAD)', 190, 120, `<path d="M10 20 V108 H170 V20 M60 108 V44 M4 100 H10 M170 96 H184 M170 20 H184 V44 H170"/>${lv(10, 60, 30)}<path d="${wave(62, 168, 38, 2, 12)}" ${tn}/>${dots(66, 164, 30, 34, 6)}<path d="M60 12 H164" ${tn}/><path d="M84 12 V28 M114 12 V28 M144 12 V28" stroke-width="2"/>${bolhas([[20, 96], [30, 88], [44, 94], [24, 76], [38, 70], [50, 80], [20, 58], [34, 52], [48, 60], [28, 40], [44, 42], [76, 52], [96, 48], [120, 46], [146, 50]], 2)}`],
      ['hd-filtro-areia', 'Filtro de areia', 110, 132, `<rect x="10" y="8" width="90" height="114" rx="2"/><path d="M10 22 H100" ${dash}/><path d="M10 48 H100 M10 84 H100" ${tn}/>${dots(18, 94, 54, 80)}${stones(18, 94, 90, 104)}<path d="M18 113 H92" stroke-dasharray="3 4" ${tn}/><path d="M55 122 V128"/>`],
      ['sn-filtro-desc', 'Filtro rápido descendente', 120, 150, filtro(14, 92, false) + '<path d="M4 30 H14 M60 136 V146"/>'],
      ['sn-filtro-asc', 'Filtro ascendente', 120, 150, filtro(14, 92, true) + '<path d="M4 128 H14 M106 18 H116"/>'],
      ['sn-filtro-lento', 'Filtro lento', 200, 110, `<rect x="8" y="8" width="184" height="94" rx="2"/>${lv(8, 192, 18)}<path d="${wave(8, 192, 50, 2, 14)}" stroke-width="2"/>${dots(14, 186, 56, 76, 7)}<path d="M8 82 H192" ${tn}/>${stones(14, 186, 88, 94)}<path d="M4 22 H8 M192 96 H196"/>`],
      ['sn-dupla-filtracao', 'Dupla filtração', 230, 150, filtro(14, 80, true) + filtro(136, 80, false) + '<path d="M4 128 H14 M94 18 H146 M176 136 V146"/>'],
      ['sn-dec-manto', 'Decantador de manto de lodo', 170, 140, `<rect x="10" y="14" width="150" height="120" rx="2"/>${lv(10, 160, 24)}<path d="M85 4 V114 M45 114 H125 M160 30 H166 M160 96 H166"/><path d="M55 118 v5 M75 118 v5 M95 118 v5 M115 118 v5 M28 24 v6 h12 v-6 M130 24 v6 h12 v-6 ${wave(12, 158, 62, 3, 14)} ${wave(12, 158, 100, 3, 14)}" ${tn}/>${dots(18, 76, 68, 94, 8)}${dots(94, 152, 68, 94, 8)}${setaV(52, 58, 36, 8)}${setaV(118, 58, 36, 8)}`],
      ['sn-dec-dortmund', 'Decantador de fluxo vertical (Dortmund)', 130, 164, `<path d="M14 14 V70 L65 140 L116 70 V14 M65 4 V84 M65 140 V160 M116 30 H126"/><path d="M50 90 H80" stroke-width="3.5"/>${lv(14, 116, 24)}${setaV(40, 92, 40, 8)}${setaV(90, 92, 40, 8)}${dots(57, 73, 122, 132, 5)}`],
      ['sn-calha-vertedores', 'Calha coletora com vertedores triangulares', 200, 84, `<path d="M8 20 ${[20, 48, 76, 104, 132, 160].map(x => `H${x} L${x + 8} 36 L${x + 16} 20`).join(' ')} H192 V64 H8 Z M100 64 V78"/>${lv(4, 196, 28)}`],
      ['sn-filtro-pressao', 'Filtro de pressão', 120, 168, `<path d="M20 44 Q20 12 60 12 Q100 12 100 44 V124 Q100 156 60 156 Q20 156 20 124 Z M60 12 V6 H4 M100 132 H116 M30 150 L24 164 M90 150 L96 164 M18 164 H30 M90 164 H102"/><path d="M60 12 V26 M46 26 H74 M20 52 H100 M20 98 H100" ${tn}/>${dots(28, 92, 58, 92, 6)}${stones(28, 92, 104, 116)}<path d="M28 126 H92" stroke-dasharray="3 4" ${tn}/>`],
      ['sn-filtro-cag', 'Filtro de carvão ativado (CAG)', 120, 150, `<rect x="14" y="10" width="92" height="126" rx="2"/>${lv(14, 106, 24)}<path d="M14 50 H106 M14 102 H106" ${tn}/>${gran(22, 98, 57, 96, 7)}${stones(22, 100, 108, 116)}<path d="M18 124 H102" stroke-dasharray="3 4" ${tn}/><path d="M4 30 H14 M60 136 V146"/>${setaV(36, 28, 46, 8)}` + T(76, 37, 'CAG', 13)],
      ['sn-filtro-dupla', 'Filtro de dupla camada (antracito e areia)', 120, 150, `<rect x="14" y="10" width="92" height="126" rx="2"/>${lv(14, 106, 24)}<path d="M14 48 H106 M14 74 H106 M14 102 H106" ${tn}/>${gran(22, 98, 55, 68, 7)}${dots(20, 100, 80, 96, 5)}${stones(22, 100, 108, 116)}<path d="M18 124 H102" stroke-dasharray="3 4" ${tn}/><path d="M4 30 H14 M60 136 V146"/>${setaV(60, 28, 44, 8)}`],
      ['sn-filtro-lavagem', 'Lavagem do filtro (contracorrente)', 160, 150, `<rect x="30" y="10" width="100" height="126" rx="2"/>${lv(30, 130, 24)}<path d="M56 30 V44 H104 V30 M104 38 H148 M4 128 H28"/>${head(156, 38, 0, 8)}${head(38, 128, 0, 8)}${dots(38, 122, 60, 96, 9)}<path d="M30 104 H130" ${tn}/>${stones(38, 122, 110, 118)}${setaV(46, 100, 60, 8)}${setaV(114, 100, 60, 8)}`],
      ['sn-fundo-filtro', 'Fundo de filtro com bocais (crepinas)', 180, 100, `<path d="M8 8 V92 H172 V8 M172 80 H178"/><rect x="8" y="52" width="164" height="8"/><path d="${[26, 47, 68, 90, 112, 133, 154].map(x => `M${x} 52 V42 M${x - 7} 42 Q${x} 30 ${x + 7} 42 Z`).join('')}" stroke-width="2"/>${stones(16, 166, 16, 24, 3, 2)}${setaV(50, 86, 66, 8)}${setaV(130, 86, 66, 8)}`],
    ]],
    ['ETA: produtos químicos e reservação', [
      ['sn-casa-quimica', 'Casa de química', 180, 130, `<path d="M4 46 L90 8 L176 46 M16 41 V124 M164 41 V124 M4 124 H176"/><rect x="28" y="70" width="34" height="46" rx="2"/><rect x="72" y="70" width="34" height="46" rx="2"/>${lv(28, 62, 80)}${lv(72, 106, 80)}<path d="M45 62 V100 M89 62 V100" ${tn}/><path d="M106 108 H126 M146 108 H176"/>${bombinha(136, 108, 10)}` + T(90, 32, 'química', 13)],
      ['hd-dosador', 'Dosador de produto químico', 130, 100, `<rect x="8" y="14" width="50" height="76" rx="3"/><path d="M8 32 H58" ${dash}/><path d="M58 80 H74 M98 80 H126"/><circle cx="86" cy="80" r="12"/><path d="M81 74 L93 80 L81 86 Z" fill="#C"/>` + T(33, 58, 'PQ', 15)],
      ['sn-dos-sulfato', 'Dosador de sulfato de alumínio', 150, 110, dosador('Al₂(SO₄)₃', 12)],
      ['sn-dos-cal', 'Dosador de cal', 150, 110, dosador('Cal', 16)],
      ['sn-saturador-cal', 'Saturador de cal', 110, 150, `<path d="M14 14 V90 L55 132 L96 90 V14 M34 4 V104 M96 30 H106 M55 132 V146"/>${lv(14, 96, 24)}${dots(42, 70, 106, 120, 6)}` + T(68, 58, 'Ca(OH)₂', 12)],
      ['sn-dos-fluor', 'Dosador de flúor', 150, 110, dosador('flúor', 15)],
      ['sn-clorador', 'Dosador de cloro gás (clorador)', 200, 130, `<path d="M10 118 V44 Q10 26 28 26 Q46 26 46 44 V118 Z M28 26 V16 M20 16 H36 M36 16 H90 V40 M110 70 H156 V108"/><rect x="4" y="118" width="48" height="8" rx="1"/><rect x="70" y="40" width="40" height="56" rx="3"/><rect x="84" y="48" width="12" height="40" rx="6" ${tn}/><circle cx="90" cy="64" r="3" fill="#C"/><path d="M130 104 H146 L156 108 L166 104 H196 M130 116 H146 L156 112 L166 116 H196"/>` + T(28, 76, 'Cl₂', 14)],
      ['sn-cilindro-cloro', 'Cilindro de cloro', 80, 150, `<path d="M14 144 V46 Q14 22 40 22 Q66 22 66 46 V144 Z M34 22 V18 M46 22 V18"/><rect x="28" y="6" width="24" height="12" rx="3"/><path d="M14 56 H66 M14 132 H66" ${tn}/>` + T(40, 92, 'Cl₂', 18)],
      ['sn-equalizacao', 'Tanque de equalização', 170, 110, `<path d="M10 22 V104 H160 V22 M4 30 H10 M160 96 H166"/>${mot(85, 4, 22, 14)}<path d="M85 18 V80"/><path d="M73 80 L97 86 M73 86 L97 80" stroke-width="2"/>${lv(10, 160, 36)}${lv(10, 160, 66)}<path d="M146 44 V58" ${tn}/>${head(146, 38, -90, 8)}${head(146, 64, 90, 8)}`],
      ['sn-reserv-tratada', 'Reservatório de água tratada', 160, 110, `<path d="M20 100 V30 Q80 10 140 30 V100 M4 100 H156 M4 36 H20 M140 92 H156"/>${lv(20, 140, 46)}` + T(80, 72, 'RAT', 18)],
      ['sn-dos-polimero', 'Preparo e dosagem de polímero', 150, 110, dosador('polímero', 12)],
      ['sn-dos-cap', 'Dosador de carvão ativado em pó (CAP)', 150, 110, dosador('CAP', 16)],
      ['sn-dos-hipoclorito', 'Dosador de hipoclorito (bombona)', 150, 110, `<path d="M14 42 Q14 30 26 30 H50 Q62 30 62 42 V102 H14 Z M30 30 V22 H42 V30 M52 92 V14 H104 V80 M116 92 H146"/>${lv(14, 62, 50)}${bombinha(104, 92, 12)}` + T(30, 76, 'NaClO', 10)],
      ['sn-dosador-seco', 'Dosador de sólidos (tremonha e rosca)', 180, 130, `<path d="M14 8 H84 V36 L58 60 H40 L14 36 Z M100 98 V126 H172 V98 M172 120 H177"/><rect x="30" y="60" width="100" height="18" rx="2"/><path d="${[40, 52, 64, 76, 88, 100, 112].map(x => `M${x} 62 l8 14`).join('')}" ${tn}/><rect x="6" y="62" width="22" height="14" rx="2"/>${mot(152, 72, 20, 12)}<path d="M152 84 V116"/><path d="M144 116 H160" stroke-width="3"/>${lv(100, 172, 106)}${setaV(122, 80, 100, 7)}` + T(17, 69, 'M', 10) + T(49, 24, 'cal', 13)],
      ['sn-dos-mariotte', 'Dosador de carga constante (Mariotte)', 120, 150, `<rect x="20" y="30" width="66" height="94" rx="5"/><rect x="43" y="22" width="20" height="8" rx="1"/><path d="M53 6 V100 M86 112 H104 V124"/>${lv(20, 86, 54)}${bolhas([[53, 106], [58, 96], [48, 90]], 2)}<path d="M104 130 v5 M104 141 v5" ${tn}/>`],
    ]],
    ['ETA: tratamento avançado', [
      ['sn-osmose', 'Osmose reversa (vaso de membranas)', 244, 104, `<path d="M4 48 H22 M50 48 H70 M198 48 H232 M176 68 V86 H232"/>${bombinha(36, 48, 14)}<rect x="70" y="28" width="128" height="40" rx="20"/><path d="${[96, 108, 120, 132, 144, 156, 168, 180].map(x => `M${x} 31 l-10 34`).join('')}" ${tn}/><path d="M84 48 H198" stroke-dasharray="6 4" stroke-width="2"/>${head(240, 48, 0, 8)}${head(240, 86, 0, 8)}` + T(222, 38, 'permeado', 9) + T(208, 97, 'concentrado', 9)],
      ['sn-troca-ionica', 'Coluna de troca iônica (resina)', 100, 170, `<path d="M20 34 Q20 14 50 14 Q80 14 80 34 V136 Q80 156 50 156 Q20 156 20 136 Z M50 14 V6 H4 M80 144 H96 M30 152 L26 166 M70 152 L74 166"/><path d="M50 14 V26 M38 26 H62 M20 42 H80 M20 128 H80" ${tn}/>${stones(28, 74, 48, 122, 3, 2.2)}`],
    ]],
    ['Ensaios de laboratório', [
      ['sn-jarteste', 'Jarteste (6 jarros)', 250, 150, `<rect x="6" y="8" width="238" height="18" rx="3"/><rect x="6" y="118" width="238" height="26" rx="3"/><rect x="100" y="124" width="50" height="14" rx="2" ${tn}/><path d="M12 26 V118 M238 26 V118" stroke-width="2"/>${[32, 69, 106, 143, 180, 217].map(c => `<path d="M${c - 14} 56 V118 H${c + 14} V56"/><path d="M${c - 14} 66 H${c + 14}" ${dash}/><path d="M${c} 26 V96" ${tn}/><rect x="${c - 8}" y="94" width="16" height="10" fill="#C"/>`).join('')}`],
      ['sn-imhoff', 'Cone Imhoff', 80, 150, `<path d="M10 14 L38 128 H42 L70 14 M6 14 H74"/><path d="M34.1 112 H45.9 L42 128 H38 Z" fill="#C"/>${lv(12.5, 67.5, 24)}<path d="M33 92 h6 M34 102 h5 M35 112 h3" ${tn}/><path d="M18 70 H62" stroke-width="3"/><path d="M20 70 L8 146 M60 70 L72 146" stroke-width="2"/>`],
      ['sn-coluna-sed', 'Coluna de sedimentação', 80, 170, `<rect x="24" y="6" width="32" height="154" rx="4"/>${lv(24, 56, 16)}<path d="M56 40 H68 M68 35 V45 M56 70 H68 M68 65 V75 M56 100 H68 M68 95 V105 M56 130 H68 M68 125 V135 M10 164 H70"/><path d="${[20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150].map((y, i) => `M${i % 5 === 0 ? 12 : 17} ${y} H24`).join('')}" ${tn}/>` + dots(30, 50, 148, 154, 5)],
    ]],
    ['ETE: preliminar e primário', [
      ['hd-grade', 'Grade de barras (planta)', 100, 90, `<path d="M4 16 H96 M4 74 H96"/><path d="${[22, 29, 36, 43, 50, 57, 64].map(y => `M46 ${y} H56`).join('')}" stroke-width="3"/><path d="M8 45 H28" ${tn}/>${head(38, 45, 0, 10)}`],
      ['sn-grade-grossa', 'Grade grossa (vista frontal)', 140, 110, gradeFrente(18, 3.5)],
      ['sn-grade-fina', 'Grade fina (vista frontal)', 140, 110, gradeFrente(8, 2)],
      ['sn-peneira-rot', 'Peneira rotativa', 160, 120, `<circle cx="80" cy="60" r="36"/><circle cx="80" cy="60" r="30" stroke-dasharray="3 4" ${tn}/><circle cx="80" cy="60" r="3" fill="#C"/>${setaH(4, 52, 30, 10)}<path d="M112 44 L150 60 M118 54 L154 76"/>${dots(126, 146, 62, 68, 6)}${setaV(80, 98, 116, 8)}`],
      ['hd-desarenador', 'Desarenador (fluxo horizontal)', 160, 70, `<path d="M4 14 V40 H40 L60 60 H100 L120 40 H156 V14"/><path d="M4 22 H156" ${dash}/><path d="M62 59 H98 L92 51 H68 Z" fill="#C"/>`],
      ['sn-desarenador-aerado', 'Desarenador aerado', 140, 130, `<path d="M14 14 V100 H40 V116 H62 V100 L126 86 V14 M110 4 V76 H100"/>${lv(14, 126, 24)}${bolhas([[104, 66], [110, 54], [102, 44], [108, 34]])}<path d="M98 32 Q56 16 36 44 Q28 72 60 82" ${tn}/>${head(70, 80, -8, 9)}${dots(44, 58, 106, 112, 5)}`],
      ['sn-caixa-areia', 'Caixa de areia (planta)', 180, 100, `<rect x="10" y="10" width="160" height="80" rx="2"/><path d="M30 50 H150"/><path d="M36 12 V48 M36 52 V88 M144 12 V48 M144 52 V88" stroke-width="4"/>${dots(50, 130, 22, 38, 8)}${dots(50, 130, 62, 78, 8)}<path d="M4 50 H10 M170 50 H176"/>`],
      ['sn-parshall-medidor', 'Calha Parshall com medidor de nível', 180, 110, `<path d="M4 30 H50 L80 46 H100 L176 34 M4 90 H50 L80 74 H100 L176 86"/><circle cx="60" cy="16" r="12"/><path d="M60 28 V54" stroke-dasharray="3 3" ${tn}/><circle cx="60" cy="60" r="3" fill="#C"/>${setaH(110, 152, 60, 10)}` + T(60, 16, 'LT', 11)],
      ['sn-elevatoria', 'Elevatória de esgoto (poço úmido)', 150, 150, `<path d="M4 30 H20 V140 H130 V30 H146 M20 30 H130 M4 52 H20 M4 62 H20 M54 112 V18 H146 M96 112 V18"/>${lv(20, 130, 76)}<rect x="44" y="112" width="20" height="24" rx="3"/><rect x="86" y="112" width="20" height="24" rx="3"/>` + T(54, 124, 'M', 11) + T(96, 124, 'M', 11)],
      ['sn-dec-prim-ret', 'Decantador primário retangular', 200, 110, `<path d="M10 14 V96 H38 L56 80 H190 V14 M4 28 H10 M190 22 H196 M24 96 V104"/>${lv(10, 190, 22)}<path d="M20 14 V44" ${tn}/><rect x="60" y="30" width="120" height="40" rx="20" ${tn}/><circle cx="80" cy="50" r="5" ${tn}/><circle cx="160" cy="50" r="5" ${tn}/><path d="M90 66 V78 M120 66 V78 M150 66 V78 M100 26 V34 M140 26 V34" stroke-width="2.2"/>` + dots(16, 34, 84, 92, 6)],
      ['sn-dec-prim-circ', 'Decantador circular com raspador', 190, 110, `<path d="M10 14 V66 L86 88 V100 H104 V88 L180 66 V14 M95 100 V106 M180 22 H186"/><path d="M10 10 H180" stroke-width="3"/>${lv(10, 180, 22)}<path d="M80 16 V44 M110 16 V44 M95 10 V82 M90 82 L20 62 M100 82 L170 62 M10 30 H22 V22 M180 30 H168 V22" ${tn}/>` + dots(90, 100, 92, 98, 5)],
      ['sn-tanque-septico', 'Tanque séptico (duas câmaras)', 190, 100, `<rect x="14" y="16" width="162" height="72" rx="2"/><path d="M110 16 V52 M110 68 V88 M4 30 H24 M24 22 V50 M166 34 H186 M166 26 V54"/>${lv(24, 166, 36)}<path d="${wave(14, 110, 76, 3, 16)} ${wave(110, 174, 80, 2, 16)}" ${tn}/>`],
      ['sn-filtro-anaerobio', 'Filtro anaeróbio', 140, 140, `<rect x="14" y="14" width="112" height="116" rx="2"/><path d="M4 24 H24 V120 M126 30 H136"/>${lv(14, 126, 22)}<path d="M30 46 H126 M14 112 H126" stroke-dasharray="6 4" ${tn}/>${stones(36, 118, 54, 104, 5, 4)}`],
      ['sn-grade-mecanizada', 'Grade mecanizada (perfil)', 180, 122, `<path d="M4 112 H112 M146 50 L152 84 H174 L178 50 M132 26 L150 44"/><path d="M70 112 L118 20" stroke-width="3"/><path d="M80 116 L128 24" ${tn}/><circle cx="128" cy="20" r="7" ${tn}/><rect x="122" y="4" width="22" height="10" rx="2"/>${lv(4, 92, 70)}${setaH(10, 56, 92)}${dots(156, 170, 66, 78, 6)}` + T(133, 9, 'M', 9)],
      ['sn-desarenador-vortex', 'Desarenador tipo vórtice (planta)', 170, 140, `<circle cx="95" cy="72" r="54"/><circle cx="95" cy="72" r="13" ${tn}/><path d="M4 18 H95 M4 40 H51.5 M148 62 H166 M148 82 H166"/><path d="M95 36 A36 36 0 1 1 59 72" ${tn}/>${head(59, 64, -90, 8)}${dots(89, 101, 68, 76, 5)}`],
      ['sn-tanque-imhoff', 'Tanque Imhoff (decanto-digestor)', 150, 170, `<path d="M14 14 V100 L75 154 L136 100 V14 M75 154 V166 M44 14 V64 L84 98 M106 14 V64 L68 90"/>${lv(14, 136, 24)}${bolhas([[29, 62], [26, 48], [30, 36], [121, 62], [124, 48], [120, 36]], 2.2)}${dots(56, 94, 112, 136, 6)}<circle cx="75" cy="46" r="7" ${tn}/><circle cx="75" cy="46" r="2" fill="#C"/>`],
      ['sn-dec-circ-planta', 'Decantador circular (planta)', 150, 156, `<circle cx="75" cy="75" r="66"/><circle cx="75" cy="75" r="58" ${tn}/><path d="M75 71 H141 M75 79 H141 M70 141 V152 M80 141 V152"/><path d="M61 75 H17" stroke-dasharray="5 4" ${tn}/><circle cx="75" cy="75" r="14"/><path d="M68.1 114.4 A40 40 0 0 1 40.4 95" ${tn}/>${head(40.4, 95, 240, 8)}`],
    ]],
    ['ETE: reatores biológicos', [
      ['hd-uasb', 'Reator UASB', 110, 160, `<rect x="14" y="20" width="82" height="134" rx="2"/><path d="M28 72 L55 46 L82 72 M55 46 V4 M4 146 H14 M96 30 H106 M14 86 L36 78 M96 86 L74 78"/><path d="M14 30 H96" ${dash}/>` + dots(22, 90, 112, 148)],
      ['sn-uasb-completo', 'UASB com separador trifásico e queimador', 190, 180, `<rect x="14" y="34" width="96" height="140" rx="2"/>${lv(14, 110, 44)}<path d="M34 96 L62 66 L90 96 M14 112 L40 102 M110 112 L84 102 M62 66 V20 H130 V100 H160 M110 50 H120 M160 174 V50 M153 50 H167"/><path d="M22 46 v6 h10 v-6 M92 46 v6 h10 v-6" ${tn}/><path d="M26 20 V162" stroke-width="2"/>${head(26, 170, 90, 8)}${dots(36, 104, 138, 166, 8)}${chama(160, 46)}` + T(96, 12, 'biogás', 11)],
      ['sn-queimador', 'Queimador de biogás (flare)', 70, 150, `<path d="M35 146 V60 M20 146 H50 M27 60 H43 M4 120 H35"/>${chama(35, 54)}`],
      ['hd-aeracao', 'Tanque de aeração (lodo ativado)', 160, 100, `<path d="M8 14 V94 H152 V14"/><path d="M8 22 H152" ${dash}/><path d="M20 4 V84 H140" stroke-width="2"/><path d="M36 84 h8 M66 84 h8 M96 84 h8 M126 84 h8" stroke-width="5"/>${[[40, 72], [44, 58], [38, 44], [70, 70], [66, 54], [72, 38], [100, 72], [96, 56], [102, 40], [130, 70], [126, 52], [132, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" stroke-width="1.4"/>`).join('')}`],
      ['sn-lodo-ativado', 'Lodo ativado com recirculação', 260, 130, `<path d="M8 20 V90 H118 V20 M118 40 H140 M140 20 V60 L180 84 L220 60 V20 M180 84 V112 H24 V100"/>${head(24, 92, -90, 9)}${lv(8, 118, 28)}${lv(140, 220, 28)}<path d="M4 10 H24 V18" ${tn}/>${head(24, 26, 90, 8)}<path d="M24 84 h12 M54 84 h12 M84 84 h12" stroke-width="4"/>${bolhas([[30, 70], [36, 56], [28, 42], [60, 72], [66, 56], [58, 42], [90, 70], [96, 54], [88, 40]])}${setaH(220, 256, 34)}${setaH(180, 250, 112)}` + T(100, 122, 'recirculação', 11) + T(220, 122, 'excesso', 11)],
      ['sn-valo', 'Valo de oxidação (aeração prolongada)', 200, 110, `<rect x="8" y="10" width="184" height="90" rx="45"/><rect x="58" y="46" width="84" height="18" rx="9"/><rect x="92" y="14" width="16" height="28" rx="2" ${tn}/><path d="M92 20 H108 M92 26 H108 M92 32 H108 M92 38 H108" ${tn}/>${setaH(50, 84, 28)}${setaH(130, 70, 82)}`],
      ['sn-rbs', 'Reator em batelada sequencial (RBS)', 260, 112, [8, 71, 134, 197].map((x, i) => `<path d="M${x} 30 V96 H${x + 54} V30"/>` + [
        lv(x, x + 54, 70) + setaV(x + 27, 8, 60),
        lv(x, x + 54, 40) + bolhas([[x + 14, 84], [x + 20, 70], [x + 14, 56], [x + 38, 82], [x + 34, 66], [x + 40, 52]]) + `<path d="M${x + 10} 92 H${x + 44}" stroke-width="3"/>`,
        lv(x, x + 54, 40) + `<path d="${wave(x, x + 54, 84, 2, 13.5)}" ${tn}/>` + dots(x + 6, x + 48, 88, 92, 6),
        lv(x, x + 54, 66) + `<path d="${wave(x, x + 54, 84, 2, 13.5)}" ${tn}/>` + dots(x + 6, x + 48, 88, 92, 6) + setaV(x + 40, 62, 14),
      ][i] + T(x + 27, 105, ['enchimento', 'reação', 'sedimentação', 'descarte'][i], 10)).join('')],
      ['sn-difusores', 'Difusores de bolha fina', 180, 90, `<path d="M4 72 H172 M4 80 H172"/>${[30, 70, 110, 150].map(x => `<path d="M${x - 14} 72 Q${x} 58 ${x + 14} 72"/>` + bolhas([[x - 8, 52], [x, 48], [x + 8, 52], [x - 4, 40], [x + 5, 36], [x - 7, 28], [x + 2, 22], [x + 8, 30], [x - 2, 12]], 1.6)).join('')}`],
      ['sn-aerador-sup', 'Aerador superficial mecânico', 160, 120, `<path d="M8 40 V114 H152 V40"/><path d="M8 34 H152" stroke-width="3"/>${mot(80, 8, 28, 20)}<path d="M80 28 V58"/><path d="M64 56 H96 L88 66 H72 Z"/>${lv(8, 64, 60)}${lv(96, 152, 60)}<path d="M64 54 Q44 40 26 58 M96 54 Q116 40 134 58" stroke-dasharray="4 4" ${tn}/>`],
      ['sn-sopr-centrifugo', 'Soprador centrífugo', 140, 110, `<path d="M112 30 H60 A34 34 0 1 0 94 64 V44 H112"/><circle cx="60" cy="64" r="16" ${tn}/><circle cx="60" cy="64" r="5" ${tn}/><path d="M60 48 V59 M60 69 V80 M44 64 H55 M65 64 H76" ${tn}/><path d="M24 104 H100 M44 96 V104 M76 96 V104"/>${setaH(114, 136, 37)}`],
      ['sn-sopr-lobulos', 'Soprador de lóbulos (Roots)', 150, 110, `<path d="M52 26 H98 A29 29 0 0 1 98 84 H52 A29 29 0 0 1 52 26 Z M68 26 V6 M82 26 V6 M68 84 V104 M82 84 V104"/><circle cx="52" cy="45" r="10" ${tn}/><circle cx="52" cy="65" r="10" ${tn}/><circle cx="88" cy="55" r="10" ${tn}/><circle cx="108" cy="55" r="10" ${tn}/><circle cx="52" cy="55" r="2.5" fill="#C"/><circle cx="98" cy="55" r="2.5" fill="#C"/>${head(75, 8, -90, 9)}${head(75, 92, -90, 9)}`],
      ['sn-misturador-sub', 'Misturador submersível', 160, 110, `<path d="M8 10 V104 H152 V10"/>${lv(8, 152, 20)}<path d="M30 10 V100 M30 72 H36" stroke-width="2"/><rect x="36" y="62" width="46" height="20" rx="10"/><path d="M82 66 L92 72 L82 78"/><ellipse cx="96" cy="62" rx="4" ry="10"/><ellipse cx="96" cy="82" rx="4" ry="10"/><path d="M58 62 V22" stroke-dasharray="3 3" ${tn}/>${setaH(110, 142, 66)}${setaH(110, 142, 80)}`],
      ['hd-dec-sec', 'Decantador secundário', 170, 100, `<path d="M8 16 V64 L85 88 L162 64 V16 M85 88 V96"/><path d="M8 24 H162" ${dash}/><path d="M8 10 H162" stroke-width="3"/><path d="M72 16 V44 M98 16 V44 M85 88 V46 M20 60 L80 80 M150 60 L90 80" ${tn}/>`],
      ['sn-dec-sec-recirc', 'Decantador secundário com recirculação', 200, 110, `<path d="M60 16 V56 L125 80 L190 56 V16 M190 22 H196 M125 80 V96 H90 M70 96 H18 V30"/>${lv(60, 190, 24)}${bombinha(80, 96, 10, -1)}${head(18, 22, -90, 9)}${setaH(28, 58, 34, 8)}` + T(44, 86, 'retorno', 11)],
      ['hd-filtro-bio', 'Filtro biológico percolador', 140, 120, `<path d="M14 30 V110 H126 V30 M70 116 V18 M126 104 H136"/><path d="M24 18 H116" stroke-width="3.5"/><path d="M30 22 V28 M46 22 V28 M94 22 V28 M110 22 V28" stroke-dasharray="2 3" ${tn}/>${stones(24, 116, 44, 98, 5, 6)}`],
      ['sn-biodisco', 'Biodisco (RBC)', 180, 110, `<path d="M10 50 V70 Q10 104 50 104 H130 Q170 104 170 70 V50"/>${lv(10, 170, 64)}<path d="${[24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156].map(x => `M${x} 18 V98`).join('')}" stroke-width="1.8"/><path d="M4 58 H176" stroke-width="3"/>`],
      ['sn-mbbr', 'Reator MBBR (biomídia)', 160, 110, `<path d="M8 10 V104 H152 V10 M152 40 H158"/>${lv(8, 140, 20)}<path d="M140 28 V74" stroke-dasharray="2 3" stroke-width="2"/><path d="M16 96 H132" stroke-width="2"/>${[[26, 34], [52, 30], [80, 36], [108, 32], [36, 54], [64, 50], [94, 56], [122, 52], [24, 76], [50, 72], [78, 78], [106, 74]].map(([x, y]) => carrier(x, y)).join('')}${bolhas([[40, 88], [70, 86], [100, 88], [124, 84]], 2)}`],
      ['sn-mbr', 'Biorreator de membrana (MBR)', 170, 120, `<path d="M8 24 V114 H162 V24 M61 44 V12 H138 M109 44 V12 M158 12 H166"/>${lv(8, 162, 32)}<rect x="44" y="44" width="34" height="50" rx="2"/><rect x="92" y="44" width="34" height="50" rx="2"/><path d="${[50, 56, 62, 68, 74, 98, 104, 110, 116, 122].map(x => `M${x} 48 V90`).join('')}" ${tn}/><path d="M44 104 H126" stroke-width="2"/>${bombinha(148, 12, 8)}${bolhas([[52, 99], [70, 100], [100, 99], [118, 100]], 1.8)}`],
      ['sn-rac', 'Reator anaeróbio compartimentado (RAC)', 230, 112, `<rect x="8" y="14" width="214" height="88" rx="2"/>${lv(8, 222, 24)}<path d="M17 4 V30 M222 30 H228 M61.5 102 V30 M115 102 V30 M168.5 102 V30"/><path d="M26 14 V86 M79.5 14 V86 M133 14 V86 M186.5 14 V86" stroke-width="2"/>${[8, 61.5, 115, 168.5].map(x0 => setaV(x0 + 9, 34, 76, 7) + setaV(x0 + 36, 80, 44, 8) + dots(x0 + 24, x0 + 50, 92, 98, 6)).join('')}`],
      ['sn-mle', 'Remoção de nitrogênio (anóxico + aeróbio)', 260, 130, `<path d="M8 30 V96 H88 V30 M100 30 V96 H180 V30 M88 44 H100 M180 44 H196 M196 30 V62 L222 86 L248 62 V30 M248 38 H256 M4 44 H8"/>${lv(8, 88, 38)}${lv(100, 180, 38)}${lv(196, 248, 38)}${mot(30, 8, 20, 14)}<path d="M30 22 V80"/><path d="M22 80 L38 86 M22 86 L38 80" stroke-width="2"/><path d="M108 90 H172" stroke-width="2"/>${bolhas([[114, 82], [126, 76], [138, 84], [150, 78], [162, 84], [120, 70], [156, 70]], 2.2)}<path d="M150 30 V16 H70 V22 M222 86 V112 H28 V105" ${tn}/>${head(70, 30, 90, 8)}${head(28, 97, -90, 8)}` + T(62, 64, 'anóxico', 11) + T(140, 56, 'aeróbio', 11) + T(116, 8, 'recirculação interna', 10) + T(125, 122, 'recirculação de lodo', 10)],
      ['sn-a2o', 'Remoção de N e P (anaeróbio, anóxico, aeróbio)', 260, 122, `<path d="M8 24 V90 H200 V24 M72 24 V90 M136 24 V90 M4 34 H8"/>${lv(8, 200, 32)}${[40, 104].map(x => mot(x, 4, 18, 12) + `<path d="M${x} 16 V64"/><path d="M${x - 9} 64 H${x + 9}" stroke-width="3"/>`).join('')}<path d="M142 86 H194" stroke-width="2"/>${bolhas([[148, 58], [160, 50], [172, 58], [184, 50], [154, 42], [178, 42], [190, 60]], 2.2)}${setaH(200, 252, 40)}<path d="M168 90 V100 H104 V99 M252 112 H40 V99" ${tn}/>${head(104, 91, -90, 8)}${head(40, 91, -90, 8)}` + T(40, 78, 'anaeróbio', 10) + T(104, 78, 'anóxico', 10) + T(168, 72, 'aeróbio', 10) + T(226, 30, 'efluente', 9) + T(136, 106, 'nitrato', 9) + T(232, 104, 'lodo', 9)],
      ['sn-bas', 'Biofiltro aerado submerso (BAS)', 130, 160, `<rect x="30" y="10" width="70" height="140" rx="2"/>${lv(30, 100, 20)}${stones(38, 94, 44, 108, 4, 3)}<path d="M30 116 H100" stroke-dasharray="4 3" ${tn}/><path d="M4 140 H30 M100 24 H126 M40 128 H126"/>${bolhas([[46, 122], [60, 121], [74, 122], [88, 121]], 2)}${setaV(65, 38, 25, 7)}` + T(116, 118, 'ar', 11)],
      ['sn-distribuidor-rot', 'Distribuidor rotativo (filtro biológico, planta)', 150, 150, `<circle cx="75" cy="75" r="66"/><circle cx="75" cy="75" r="8"/><path d="M83 75 H135 M67 75 H15 M75 67 V15 M75 83 V135" stroke-width="3"/><path d="M90 81 H132 M60 69 H18 M69 90 V132 M81 60 V18" stroke-dasharray="2 5" ${tn}/><path d="M90.7 31.8 A46 46 0 0 1 118.2 59.3" ${tn}/>${head(118.2, 59.3, 70, 8)}`],
    ]],
    ['Lagoas e wetlands', [
      ['hd-lagoa', 'Lagoa de estabilização', 170, 70, `<path d="M4 14 H24 L54 60 H116 L146 14 H166"/><path d="M32 26 H138" ${dash}/><path d="${wave(56, 112, 56, 2.5, 14)}" ${tn}/>`],
      ['sn-lagoa-anaerobia', 'Lagoa anaeróbia', 200, 110, `${lagoa(18, 100, 24, 176, 36)}${lv(32, 168, 28)}<path d="${wave(62, 138, 90, 3, 15)}" ${tn}/>${dots(66, 134, 94, 96, 7)}${bolhas([[80, 76], [84, 60], [80, 44], [110, 72], [114, 56], [108, 40], [136, 66], [132, 50]], 2.2)}`],
      ['sn-lagoa-facultativa', 'Lagoa facultativa', 200, 110, `${lagoa(50, 100, 24, 176, 22)}${lv(30, 170, 58)}<path d="M38 80 H162" stroke-dasharray="2 4" ${tn}/><path d="${wave(48, 152, 92, 2.5, 13)}" ${tn}/>${sol(100, 24)}${bolhas([[52, 66], [70, 70], [88, 66], [106, 70], [124, 66], [142, 70]], 2)}`],
      ['sn-lagoa-maturacao', 'Lagoa de maturação', 200, 100, `${lagoa(52, 84, 20, 180, 16)}${lv(26, 174, 60)}${sol(100, 24)}<path d="M84 40 L76 54 M100 42 V56 M116 40 L124 54" stroke-dasharray="3 3" ${tn}/>`],
      ['sn-lagoa-aerada', 'Lagoa aerada', 200, 110, `${lagoa(40, 100, 24, 176, 24)}${lv(30, 170, 50)}${[70, 130].map(x => `<rect x="${x - 8}" y="30" width="16" height="12" rx="2"/><ellipse cx="${x}" cy="49" rx="14" ry="4"/><path d="M${x - 14} 46 Q${x - 24} 34 ${x - 32} 48 M${x + 14} 46 Q${x + 24} 34 ${x + 32} 48" stroke-dasharray="3 3" ${tn}/>`).join('')}`],
      ['sn-lagoas-serie', 'Lagoas em série (planta)', 260, 90, `<rect x="8" y="14" width="60" height="62" rx="4"/><rect x="80" y="14" width="100" height="62" rx="4"/><rect x="192" y="14" width="60" height="62" rx="4"/>${head(80, 45, 0, 10)}${head(192, 45, 0, 10)}` + T(38, 45, 'A', 20) + T(130, 45, 'F', 20) + T(222, 45, 'M', 20)],
      ['sn-wetland', 'Wetland construído', 200, 110, `<path d="M8 40 V100 H192 V40 M4 66 H8 M192 88 H196"/>${lv(8, 192, 54)}${stones(14, 186, 62, 94, 4, 3)}${[30, 62, 94, 126, 158, 182].map(x => `<path d="M${x} 58 V14 M${x} 40 Q${x - 10} 30 ${x - 13} 20 M${x} 46 Q${x + 10} 36 ${x + 13} 26" ${tn}/>`).join('')}`],
      ['sn-wetland-vertical', 'Wetland de fluxo vertical', 200, 124, `<path d="M8 34 V112 H192 V34 M4 26 H184 M192 108 H196"/><path d="${[24, 48, 72, 96, 120, 144, 168].map(x => `M${x} 28 V38`).join('')}" stroke-dasharray="2 3" ${tn}/>${dots(16, 184, 46, 70, 7)}<path d="M8 76 H192" ${tn}/>${stones(16, 184, 84, 100)}<path d="M20 108 H192" stroke-dasharray="6 3" stroke-width="2"/>${[40, 100, 160].map(x => junco(x, 34, 30)).join('')}`],
      ['sn-wetland-sup', 'Wetland de fluxo superficial', 200, 110, `${lagoa(40, 100, 24, 176, 20)}${lv(30, 170, 56)}<path d="M50 94 H150" stroke-dasharray="2 5" ${tn}/>${[62, 88, 114, 140].map(x => taboa(x, 98, 74)).join('')}`],
      ['sn-lagoa-alta-taxa', 'Lagoa de alta taxa (com roda de pás)', 230, 100, `<path d="M8 46 V86 H222 V46"/>${lv(8, 222, 58)}<circle cx="60" cy="58" r="18" ${tn}/><circle cx="60" cy="58" r="3" fill="#C"/><path d="${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); return `M${(60 + c * 3).toFixed(1)} ${(58 + s * 3).toFixed(1)} L${(60 + c * 26).toFixed(1)} ${(58 + s * 26).toFixed(1)}`; }).join('')}" stroke-width="2"/>${sol(170, 22)}${setaH(110, 160, 72)}${dots(100, 210, 64, 80, 12)}`],
    ]],
    ['Desinfecção e polimento', [
      ['hd-contato', 'Tanque de contato (desinfecção)', 160, 100, `<rect x="4" y="24" width="152" height="70" rx="2"/><path d="M36 24 V74 M68 94 V44 M100 24 V74 M132 94 V44"/><path d="M16 4 V20" ${tn}/>${head(16, 30, 90, 10)}` + T(36, 10, 'Cl', 14)],
      ['sn-cloracao', 'Câmara de cloração (planta)', 200, 110, `<rect x="8" y="8" width="184" height="94" rx="2"/><path d="M8 32 H160 M40 56 H192 M8 80 H160 M4 20 H8 M192 92 H196"/>${setaH(20, 150, 20)}${setaH(176, 50, 44)}${setaH(20, 150, 68)}${setaH(150, 186, 92, 8)}`],
      ['sn-uv', 'Reator ultravioleta (UV)', 180, 100, `<rect x="24" y="30" width="132" height="56" rx="6"/><path d="M4 58 H24 M156 58 H176 M90 30 V22"/>${[38, 52, 66].map(y => `<rect x="36" y="${y}" width="108" height="8" rx="4" ${tn}/>`).join('')}` + T(90, 12, 'UV', 16)],
      ['sn-ozonizador', 'Ozonizador com coluna de contato', 200, 140, `<rect x="8" y="40" width="60" height="50" rx="3"/><path d="M38 40 V24 M68 76 H90 V124 H118 M160 24 H190 M160 120 H190 M135 14 V6"/><rect x="110" y="14" width="50" height="118" rx="3"/>${lv(110, 160, 24)}<path d="M118 124 H152" stroke-width="3"/>${bolhas([[122, 110], [134, 104], [148, 110], [128, 90], [142, 84], [124, 68], [138, 62], [150, 72], [130, 46], [146, 40]], 2.2)}` + T(38, 65, 'O₃', 18) + T(38, 14, 'O₂', 12)],
      ['sn-cascata', 'Aerador em cascata', 160, 120, `<path d="M4 30 H40 V54 H72 V78 H104 V102 H156"/><path d="M4 22 H38 Q46 22 46 32 V46 H70 Q78 46 78 56 V70 H102 Q110 70 110 80 V94 H156" stroke-dasharray="5 4" ${tn}/>`],
      ['sn-uv-canal', 'Desinfecção UV em canal aberto', 210, 120, `<path d="M4 104 H206 M190 104 V48"/>${lv(4, 190, 40)}${[50, 80, 110, 140].map(x => `<rect x="${x - 8}" y="16" width="16" height="10" rx="2"/><rect x="${x - 3}" y="26" width="6" height="68" rx="3" ${tn}/>`).join('')}<path d="M42 21 H148" ${tn}/><path d="M190 46 Q200 46 202 64" ${tn}/>${setaH(8, 34, 70, 8)}` + T(95, 7, 'UV', 12)],
      ['sn-clorador-pastilhas', 'Clorador de pastilhas', 160, 120, `<path d="M4 84 H64 M96 84 H156 M4 112 H156 M64 10 V98 M96 10 V98"/><path d="M60 10 H100" stroke-width="3.5"/>${[28, 40, 52, 64, 76, 88].map(y => `<rect x="68" y="${y}" width="24" height="9" rx="4" ${tn}/>`).join('')}${lv(4, 64, 92)}${lv(96, 156, 92)}${setaH(10, 50, 102, 8)}${setaH(110, 150, 102, 8)}` + T(130, 50, 'Ca(ClO)₂', 11)],
      ['sn-gerador-hipoclorito', 'Gerador de hipoclorito (eletrólise)', 220, 120, `<path d="M8 30 V108 H56 V30 M56 96 H76 M144 96 H164 M164 30 V108 H212 V30 M96 40 V28 M124 40 V28"/>${lv(8, 56, 42)}${lv(164, 212, 42)}<rect x="76" y="40" width="68" height="62" rx="3"/><path d="M90 48 V94 M104 48 V94 M118 48 V94 M132 48 V94" ${tn}/>` + T(32, 74, 'NaCl', 12) + T(188, 74, 'NaClO', 11) + T(96, 18, '+', 16) + T(124, 18, '−', 16)],
    ]],
    ['Tratamento do lodo', [
      ['hd-adensador', 'Adensador por gravidade', 130, 110, `<path d="M10 16 V58 L65 96 L120 58 V16 M65 16 V96"/><path d="M10 24 H120" ${dash}/><rect x="56" y="4" width="18" height="12" rx="2"/><path d="M65 84 L28 60 M65 84 L102 60 M36 65 V50 M46 72 V56 M56 78 V62 M74 78 V62 M84 72 V56 M94 65 V50" ${tn}/>`],
      ['sn-flotador-lodo', 'Flotador de lodo (adensamento)', 180, 100, `<path d="M10 16 V90 H150 V16 M4 80 H10 M150 82 H158 M150 16 H172 V36 H150"/>${lv(10, 150, 24)}${dots(16, 146, 26, 38, 6)}<path d="${wave(10, 150, 42, 2, 14)}" ${tn}/><path d="M30 10 H146" ${tn}/><path d="M60 10 V24 M100 10 V24 M140 10 V24" stroke-width="2"/>${bolhas([[24, 76], [40, 70], [58, 78], [76, 68], [94, 74], [112, 66], [30, 58], [66, 56], [104, 54]], 2)}`],
      ['hd-digestor', 'Digestor anaeróbio', 120, 150, `<path d="M20 40 Q60 4 100 40 V104 L60 140 L20 104 Z M60 22 V4 M4 90 H20 M60 140 V146"/><path d="M20 52 H100" ${dash}/>` + dots(36, 86, 108, 124)],
      ['sn-gasometro', 'Gasômetro de biogás', 120, 110, `<path d="M10 100 V70 Q60 4 110 70 V100 M4 100 H116 M4 86 H10"/><path d="M18 72 Q60 22 102 72" stroke-dasharray="5 4" ${tn}/>`],
      ['sn-centrifuga', 'Centrífuga de lodo (decanter)', 200, 100, `<path d="M30 26 H130 L170 40 V60 L130 74 H30 Z M24 50 H180"/><rect x="4" y="36" width="20" height="28" rx="2"/><path d="${[36, 52, 68, 84, 100, 116, 132, 148].map(x => `M${x} 30 L${x + 8} 70`).join('')}" ${tn}/>${setaV(100, 4, 46, 8)}${setaV(40, 74, 94, 8)}<path d="M162 64 V78"/>${dots(152, 172, 84, 92, 5)}` + T(14, 50, 'M', 11)],
      ['sn-filtro-prensa', 'Filtro prensa de placas', 230, 110, `<path d="M20 14 H178 M20 84 V104 M178 84 V104 M4 50 H14 M184 49 H186"/><rect x="14" y="14" width="12" height="70" rx="1"/><rect x="172" y="14" width="12" height="70" rx="1"/><rect x="186" y="36" width="34" height="26" rx="3"/>${[30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160].map(x => `<rect x="${x}" y="18" width="8" height="62" rx="1" ${tn}/>`).join('')}${dots(60, 140, 92, 100, 8)}`],
      ['sn-prensa-esteira', 'Prensa desaguadora de esteira', 220, 120, `<circle cx="16" cy="29" r="8"/>${[[130, 58], [158, 86], [186, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11"/><circle cx="${x}" cy="${y}" r="2" fill="#C"/>`).join('')}<path d="M12 21 H112 L130 47 Q141 47 141 58 L147 86 Q147 97 158 97 Q169 97 169 86 L175 58 Q175 47 186 47 H214" stroke-width="2"/>${dots(32, 104, 15, 15, 6)}${setaV(26, 2, 13, 7)}<path d="M40 27 V35 M64 27 V35 M88 27 V35" stroke-dasharray="2 3" ${tn}/><path d="M20 104 V112 H200 V104" ${tn}/>${dots(204, 212, 58, 66, 5)}`],
      ['hd-leito', 'Leito de secagem', 160, 80, `<path d="M8 10 V74 H152 V10"/><path d="${wave(8, 152, 24, 3, 18)}" stroke-width="2"/><path d="M8 32 H152 M8 54 H152" ${tn}/>${dots(14, 148, 38, 50)}${stones(14, 148, 60, 68)}`],
      ['sn-bag', 'Bag de desaguamento (geotêxtil)', 200, 90, `<path d="M20 50 Q20 16 60 16 H140 Q180 16 180 50 Q180 72 140 72 H60 Q20 72 20 50 Z M96 16 V8 H104 V16 M4 84 H196"/><path d="M60 18 V70 M100 18 V70 M140 18 V70" stroke-dasharray="4 4" ${tn}/><path d="M44 72 V80 M76 74 V80 M124 74 V80 M156 72 V80" stroke-dasharray="2 3" ${tn}/>`],
      ['sn-cacamba', 'Caçamba de lodo', 160, 100, `<path d="M10 30 L26 84 H134 L150 30"/><path d="M6 30 H154" stroke-width="3"/><path d="M24 30 Q80 2 136 30" ${tn}/>${dots(50, 110, 20, 26, 8)}<circle cx="40" cy="90" r="6"/><circle cx="120" cy="90" r="6"/>`],
      ['sn-estufa-lodo', 'Estufa de secagem solar de lodo', 210, 120, `<path d="M14 104 V60 Q105 -4 196 60 V104 M4 104 H206"/><path d="M60 104 V46 M105 104 V28 M150 104 V36" stroke-dasharray="4 4" ${tn}/><path d="${wave(20, 190, 94, 3, 16)}" stroke-width="2"/>${dots(26, 186, 99, 99, 7)}${sol(24, 20, 6)}${vapor(80, 84)}${vapor(128, 84)}`],
      ['sn-calagem', 'Estabilização alcalina do lodo (cal)', 200, 120, `<path d="M4 40 H60 M72 6 H112 V20 L100 36 H84 L72 20 Z M120 112 Q148 80 176 112 M100 112 H196"/><rect x="50" y="50" width="110" height="24" rx="4"/><path d="M44 62 H166" stroke-width="2"/><path d="${[64, 78, 92, 106, 120, 134, 148].map((x, i) => `M${x - 3} ${i % 2 ? 54 : 70} L${x + 3} ${i % 2 ? 70 : 54}`).join('')}" stroke-width="2.6"/><rect x="166" y="54" width="22" height="16" rx="2"/>${dots(10, 54, 35, 35, 6)}${setaV(58, 42, 58, 7)}${setaV(92, 36, 58, 7)}${setaV(150, 74, 92, 7)}${dots(136, 160, 104, 108, 6)}` + T(177, 62, 'M', 10) + T(92, 14, 'cal', 11) + T(30, 26, 'lodo', 10)],
      ['sn-secador-termico', 'Secador térmico de lodo (tambor rotativo)', 230, 110, `<path d="M40 30 L190 40 V76 L40 66 Z M60 98 H170 M196 34 V8 M206 34 V8 M201 82 V92 M44 8 H70 L62 22 H52 Z"/><path d="M80 32.7 V68.7 M150 37.3 V73.3" stroke-width="3.5"/><circle cx="80" cy="76" r="6"/><circle cx="150" cy="81" r="6"/><path d="M80 82 V98 M150 87 V98" ${tn}/><rect x="190" y="34" width="22" height="48" rx="2"/>${chama(20, 62)}${setaV(57, 22, 32, 6)}${dots(194, 208, 98, 104, 5)}`],
    ]],
    ['Resíduos sólidos', [
      ['sn-aterro', 'Aterro sanitário (corte)', 260, 140, `<path d="M4 40 H40 M220 40 H256"/><path d="M40 40 L64 112 H196 L220 40" stroke-width="3.5"/><path d="M40 40 Q130 -10 220 40" stroke-width="2"/><path d="M46 58 H214 M52 76 H208 M58 94 H202" stroke-dasharray="6 4" ${tn}/><path d="M66 106 H194" ${tn}/>${[100, 160].map(x => `<rect x="${x - 4}" y="16" width="8" height="88" ${tn}/>`).join('')}<path d="M96 16 H104 M156 16 H164" stroke-width="3"/><path d="M130 112 V124 H244" ${tn}/>${head(252, 124, 0, 9)}` + T(130, 48, 'resíduos', 11) + T(200, 134, 'chorume', 10)],
      ['sn-camadas-base', 'Impermeabilização de base (camadas)', 200, 132, `<path d="M8 10 V124 M120 10 V124 M8 124 H120 M8 34 H120 M8 58 H120 M8 98 H120"/><path d="${[14, 26, 38, 50, 62, 74, 86, 98].map(x => `M${x} 31 l10 -18`).join('')} ${wave(8, 120, 10, 2, 16)}" ${tn}/>${stones(14, 116, 40, 54, 3.4, 2)}<path d="M8 62 H120" stroke-dasharray="3 3" stroke-width="2"/><path d="M8 68 H120" stroke-width="4"/><path d="M8 78 H120 M8 86 H120 M8 94 H120" stroke-dasharray="10 4" ${tn}/>${dots(14, 116, 106, 120, 8)}<path d="M124 21 H130 M124 44 H130 M124 58 H130 M124 72 H130 M124 87 H130 M124 111 H130" ${tn}/>` + [['resíduos', 21], ['drenagem', 44], ['geotêxtil', 58], ['manta PEAD', 72], ['argila', 87], ['solo', 111]].map(([s, y]) => T(165, y, s, 10)).join('')],
      ['sn-dreno-gas', 'Dreno vertical de gás (aterro)', 100, 190, `<path d="M4 60 H24 M76 60 H96 M50 54 V60 M44 60 H56"/><path d="M44 60 V184 M56 60 V184" stroke-dasharray="8 3"/><path d="M24 60 V184 M76 60 V184" stroke-dasharray="3 3" ${tn}/>${stones(30, 38, 66, 180, 3, 1.6)}${stones(62, 70, 66, 180, 3, 1.6)}<path d="M4 100 H24 M76 100 H96 M4 140 H24 M76 140 H96" stroke-dasharray="6 4" ${tn}/>${chama(50, 52)}`],
      ['sn-dreno-chorume', 'Dreno de chorume (tubo perfurado em brita)', 170, 110, `<path d="M4 16 H30 M140 16 H166" stroke-width="3.5"/><path d="M30 16 V100 H140 V16"/><path d="M35 20 V95 H135 V20" stroke-dasharray="3 3" ${tn}/><path d="${wave(4, 166, 8, 2, 16)}" ${tn}/>${(() => { let c = ''; for (let y = 28, i = 0; y <= 90; y += 9, i++) for (let x = 42 + (i % 2 ? 4.5 : 0); x <= 128; x += 9) if (Math.hypot(x - 85, y - 70) > 23) c += `<circle cx="${x}" cy="${y}" r="3.6" ${tn}/>`; return c; })()}<circle cx="85" cy="70" r="17"/><circle cx="85" cy="70" r="12" stroke-dasharray="4 3" ${tn}/>`],
      ['sn-leiras', 'Compostagem em leiras', 230, 110, `<path d="M4 96 H226"/>${[14, 84, 154].map(x => `<path d="M${x} 96 Q${x + 30} 10 ${x + 60} 96"/>` + dots(x + 20, x + 40, 76, 88, 8) + vapor(x + 22, 44) + vapor(x + 38, 44)).join('')}<rect x="126" y="40" width="6" height="34" rx="3" ${tn}/><circle cx="129" cy="78" r="5"/>`],
      ['sn-composteira', 'Composteira doméstica', 110, 140, `<path d="M18 34 L24 128 H86 L92 34 M86 116 H100 V124"/><path d="M12 34 H98" stroke-width="3.5"/><path d="M16 34 Q55 12 94 34 M48 20 H62" ${tn}/><path d="${wave(22, 88, 64, 2, 14)} ${wave(23, 87, 88, 2, 14)} ${wave(24, 86, 108, 2, 14)}" ${tn}/>${dots(30, 80, 72, 80, 8)}${dots(32, 78, 96, 100, 8)}${bolhas([[32, 48], [55, 48], [78, 48]], 2)}`],
      ['sn-coleta-seletiva', 'Coletores de coleta seletiva', 260, 120, [['papel', 28], ['plástico', 79], ['vidro', 130], ['metal', 181], ['orgânico', 232]].map(([s, c]) => `<path d="M${c - 18} 30 L${c - 15} 94 H${c + 15} L${c + 18} 30"/><path d="M${c - 21} 30 H${c + 21}" stroke-width="3.5"/><path d="M${c - 8} 30 V24 H${c + 8} V30 M${c - 9} 44 H${c + 9}" ${tn}/>` + T(c, 108, s, 10)).join('')],
      ['sn-compactador', 'Caminhão compactador', 230, 120, `<path d="M8 92 V54 L22 34 H52 V92 M176 22 H196 Q222 40 214 92 H176 M8 92 H216"/><path d="M16 52 L26 38 H46 V52 Z" ${tn}/><rect x="56" y="22" width="120" height="70" rx="3"/><path d="M86 22 V92 M116 22 V92 M146 22 V92" ${tn}/><path d="M184 30 L204 82" stroke-dasharray="4 4" ${tn}/>${[36, 140, 170].map(x => `<circle cx="${x}" cy="102" r="12"/><circle cx="${x}" cy="102" r="3" fill="#C"/>`).join('')}`],
      ['sn-conteiner', 'Contêiner de resíduos (com rodas)', 130, 120, `<path d="M18 34 L26 100 H104 L112 34 Z M20 28 V20 H110 V28"/><path d="M14 28 H116 V34 H14 Z"/><path d="M44 40 V94 M65 40 V94 M86 40 V94" ${tn}/><circle cx="36" cy="106" r="8"/><circle cx="94" cy="106" r="8"/>`],
      ['sn-incinerador', 'Incinerador (câmaras e chaminé)', 240, 150, `<rect x="10" y="60" width="80" height="70" rx="2"/><rect x="104" y="40" width="50" height="90" rx="2"/><rect x="168" y="70" width="30" height="60" rx="2"/><path d="M14 40 H40 L34 60 H20 Z M90 76 H104 M154 56 H183 V70 M198 112 H206 M206 130 V16 M220 130 V16 M50 130 V138"/><path d="M18 118 H82" stroke-width="3" stroke-dasharray="6 3"/><path d="M176 78 V122 M183 78 V122 M190 78 V122" ${tn}/>${chama(50, 114)}${chama(129, 120)}<path d="M213 12 q5 -4 0 -8" ${tn}/>${dots(42, 58, 143, 143, 5)}`],
      ['sn-triagem', 'Esteira de triagem', 240, 120, `<circle cx="30" cy="46" r="12"/><circle cx="210" cy="46" r="12"/><circle cx="30" cy="46" r="3" fill="#C"/><circle cx="210" cy="46" r="3" fill="#C"/><path d="M30 34 H210 M30 58 H210"/><rect x="50" y="22" width="12" height="12" rx="1"/><circle cx="84" cy="28" r="6"/><path d="M106 34 L114 20 L122 34 Z"/><rect x="140" y="24" width="18" height="10" rx="2"/><circle cx="178" cy="28" r="5"/>${[60, 120, 180].map(c => setaV(c, 62, 78, 7) + `<path d="M${c - 20} 80 L${c - 16} 114 H${c + 16} L${c + 20} 80"/>`).join('')}`],
    ]],
    ['Drenagem urbana', [
      ['sn-sarjeta', 'Meio-fio e sarjeta (corte)', 200, 96, `<path d="M4 30 H70 V54 L110 50 L196 42 M58 30 V72 H70 V54"/><path d="M4 40 H58 M110 60 L196 52" ${tn}/>${lv(70, 130, 48)}` + T(30, 20, 'calçada', 10) + T(64, 84, 'meio-fio', 10) + T(96, 36, 'sarjeta', 10) + T(160, 30, 'pista', 10)],
      ['sn-boca-lobo', 'Boca de lobo (corte)', 180, 140, `<path d="M4 30 H70 V40 H4 M12 40 V124 H70 V58 H176 M4 104 H12 M4 116 H12"/>${lv(70, 120, 54)}${setaH(150, 80, 50, 8)}${setaV(42, 60, 96, 8)}` + T(36, 20, 'calçada', 10) + T(146, 72, 'pista', 10)],
      ['sn-poco-visita', 'Poço de visita (PV)', 140, 160, `<path d="M4 12 H44 M96 12 H136 M50 14 V60 H24 V150 H116 V60 H90 V14 M4 126 H24 M4 142 H24 M116 130 H136 M116 146 H136"/><path d="M44 10 H96" stroke-width="4"/><path d="M24 146 Q70 156 116 146" ${tn}/><path d="${[24, 36, 48].map(y => `M50 ${y} h8`).join('')}${[72, 86, 100, 114].map(y => `M24 ${y} h8`).join('')}" stroke-width="2.4"/>`],
      ['sn-galeria', 'Galeria celular (seção)', 180, 110, `<path d="M4 14 H176"/>${dots(18, 162, 20, 24, 10)}<rect x="14" y="30" width="152" height="70" rx="2"/><rect x="24" y="40" width="62" height="50" rx="2"/><rect x="94" y="40" width="62" height="50" rx="2"/>${lv(24, 86, 70)}${lv(94, 156, 70)}`],
      ['sn-bacia-detencao', 'Bacia de detenção (perfil)', 230, 110, `<path d="M4 40 H30 L56 96 H170 L196 40 H226 M172 88 H226 M172 96 H226"/>${lv(50, 176, 82)}${lv(36, 190, 52)}${setaH(4, 34, 30, 8)}${setaH(200, 224, 32, 7)}` + T(110, 44, 'NA máx.', 10) + T(110, 72, 'NA normal', 10)],
      ['sn-trincheira', 'Trincheira de infiltração', 150, 132, `<path d="M4 24 H40 V112 H110 V24 H146"/><path d="M44 24 V108 H106 V24" stroke-dasharray="3 3" ${tn}/>${stones(50, 100, 32, 100, 4, 3)}${setaV(56, 113, 127, 7)}${setaV(94, 113, 127, 7)}${setaH(8, 36, 16, 8)}`],
      ['sn-pav-permeavel', 'Pavimento permeável (camadas)', 200, 130, `<path d="${[30, 60, 90, 120, 150, 180].map(x => `M${x} 4 l-4 9`).join('')}" ${tn}/>${[8, 34, 60, 86, 112, 138, 164].map(x => `<rect x="${x}" y="20" width="22" height="14" rx="1.5"/>`).join('')}<path d="M8 38 H192 M8 52 H192 M8 84 H192 M8 108 H192 M8 20 V108 M192 20 V108"/>${dots(12, 188, 44, 48, 6)}${stones(14, 186, 60, 78, 4, 3)}${stones(12, 188, 90, 102, 2.6, 2)}${setaV(60, 110, 125, 7)}${setaV(140, 110, 125, 7)}`],
      ['sn-hidrograma', 'Hidrograma antes e depois da urbanização', 210, 140, `<path d="M24 12 V118 H198"/>${head(24, 6, -90, 9)}${head(204, 118, 0, 9)}<path d="M26 114 C70 112 90 70 120 70 C150 70 170 108 196 112" stroke-dasharray="6 4" stroke-width="2"/><path d="M26 114 C50 114 60 22 72 22 C86 22 100 104 150 112"/>` + T(12, 14, 'Q', 13) + T(198, 132, 't', 13) + T(48, 22, 'pós', 11) + T(120, 58, 'pré', 11)],
    ]],
  ],
};


// Esquemas didáticos autorais; não são projetos dimensionados nem símbolos certificados.
const aPath = (d, extra = '') => '<path d="' + d + '" ' + extra + '/>';
const aText = (x, y, s, size = 14) => T(x, y, s, size);
const aLine = (x, y, xx, yy, dash = false) => aPath('M'+x+' '+y+' L'+xx+' '+yy, dash ? 'stroke-width="1.6" stroke-dasharray="6 4"' : '');
const aArrow = (x, y, xx, yy) => aLine(x,y,xx,yy) + head(xx,yy,Math.atan2(yy-y,xx-x)*180/Math.PI,8);
const aBox = (x,y,w,h,labels) => '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="3"/>' + (Array.isArray(labels)?labels:(labels?[labels]:[])).map((s,i,all)=>aText(x+w/2,y+h/2+(i-(all.length-1)/2)*20,s)).join('');
const aTank = (x,y,w,h,level) => aPath('M'+x+' '+y+' V'+(y+h)+' H'+(x+w)+' V'+y) + aLine(x,y+level,x+w,y+level,true);
const aPump = (x,y,r=16) => '<circle cx="'+x+'" cy="'+y+'" r="'+r+'"/>' + aPath('M'+(x-6)+' '+(y-8)+' L'+(x+9)+' '+y+' L'+(x-6)+' '+(y+8)+'Z','fill="#C"');
const aChain = (labels, note = '') => labels.map((s,i)=>aBox(8+i*164,36,140,62,s)+(i<labels.length-1?aArrow(148+i*164,67,172+i*164,67):'')).join('') + (note?aText((labels.length*164-8)/2,126,note):'');
const aAxes = (w=340,h=220,x='Q (m³/s)',y='H (m)') => aArrow(48,h-42,w-14,h-42)+aArrow(48,h-42,48,34)+aText(w-65,h-16,x)+aText(53,16,y);
const aForm = (id,n,w,h,body) => [id,n,w,h,body];

const aSaneamento = [
 ['Sistemas individuais: unidades e arranjos', [
 aForm('sn-individual-trem','Sistema individual: sequência conceitual',648,150,aChain([['Esgoto','doméstico'],['Tanque','séptico'],['Tratamento','complementar'],['Destinação','avaliada']],'Seleção depende de solo, nível d’água, uso e exigências locais')),
 aForm('sn-vala-infiltracao','Vala de infiltração: corte e solo não saturado',340,240,aPath('M8 46 H65 V142 H275 V46 H332 M65 142 L52 166 M275 142 L288 166')+aLine(8,206,332,206,true)+'<circle cx="170" cy="97" r="18" stroke-dasharray="4 4"/>'+aPath('M75 121 H265','stroke-dasharray="3 5"')+aArrow(130,147,130,178)+aArrow(210,147,210,178)+aText(170,24,'Tubo distribuidor / material granular')+aText(170,190,'Zona não saturada')+aText(170,225,'Nível d’água: medir em campo')),
 aForm('sn-canteiro-elevado','Disposição no solo: leito elevado',350,230,aPath('M8 142 H50 L90 82 H260 L300 142 H342 M95 108 H255 M92 124 H258')+aPath('M102 96 H248','stroke-dasharray="4 4"')+aArrow(145,130,145,165)+aArrow(210,130,210,165)+aLine(8,195,342,195,true)+aText(175,28,'Leito elevado · distribuição dosada')+aText(175,61,'Material selecionado')+aText(175,216,'Viabilidade e afastamentos: avaliar')),
 aForm('sn-caixa-distribuidora','Caixa de distribuição para valas',260,180,aBox(82,43,96,74,'CD')+aPath('M8 80 H82 M178 59 H252 M178 80 H252 M178 101 H252')+aText(130,23,'Divisão de vazão')+aText(130,151,'Saídas niveladas / projeto hidráulico')),
 aForm('sn-dosagem-intermitente','Distribuição intermitente por dosagem',484,150,aChain([['Câmara','de dosagem'],['Bomba / sifão','volume por ciclo'],['Leito / valas','repouso entre ciclos']],'Operação por dose e intervalo definidos no projeto')),
 aForm('sn-separacao-na-solo','Infiltração: distância até o nível d’água',300,220,aPath('M8 44 H292 M30 72 H270 M30 98 H270')+aLine(8,178,292,178,true)+aArrow(256,102,256,172)+head(256,102,-90,8)+aText(134,25,'Superfície')+aText(139,84,'Base de infiltração')+aText(134,139,'Separação vertical')+aText(134,199,'Critério local · sem valor universal')),
 aForm('sn-individual-inspecao','Sistema individual: acesso e manutenção',484,150,aChain([['Inspeção','e registros'],['Remoção','periódica de lodo'],['Transporte','e destino autorizado']],'Frequência por uso e acúmulo; não entrar em espaço confinado')),
 aForm('sn-aguas-cinzas-segregadas','Águas cinzas: coleta segregada',484,150,aChain([['Banho / lavatório','fontes selecionadas'],['Tratamento','conforme uso'],['Reservação','não potável']],'Águas de cozinha e riscos sanitários exigem avaliação própria')),
 ]],
 ['Reúso: arranjos, barreiras e controle', [
 aForm('sn-reuso-nao-potavel','Reúso não potável: trem de tratamento',648,150,aChain([['Efluente','secundário'],['Polimento','filtração'],['Desinfecção','validada'],['Uso','não potável']],'A qualidade-alvo depende da exposição e do uso previsto')),
 aForm('sn-rede-dupla','Redes separadas de água potável e reúso',400,200,aPath('M8 54 H35 M155 54 H392 M8 130 H35 M155 130 H392')+aBox(35,30,120,48,['Água potável'])+aBox(35,106,120,48,['Reúso'])+aPath('M250 54 V82 M250 130 V158')+aText(288,84,'ponto potável')+aText(279,174,'uso não potável')+aText(200,16,'Sem conexão cruzada')),
 aForm('sn-air-gap','Separação atmosférica: abastecimento de apoio',280,220,aPath('M8 40 H140 V80 M110 120 V190 H250 V120')+aLine(110,151,250,151,true)+aPath('M140 89 V108','stroke-dasharray="3 5"')+aArrow(87,85,87,116)+head(87,85,-90,7)+aText(184,32,'Água de apoio')+aText(216,102,'vão de ar')+aText(180,174,'reservatório')),
 aForm('sn-reuso-desvio','Reúso: desvio de água fora da meta',370,230,aBox(8,50,110,60,['Medição','de controle'])+aPath('M118 80 H166 M166 80 H252 M166 80 V170 H252')+aArrow(214,80,246,80)+aArrow(214,170,246,170)+aBox(252,50,110,60,['Uso','autorizado'])+aBox(252,140,110,60,['Retorno /','destino seguro'])+aText(171,23,'Lógica de intertravamento')),
 aForm('sn-barreiras-multiplas','Barreiras múltiplas de tratamento',648,150,aChain([['Remoção','de sólidos'],['Barreira','microbiológica'],['Controle','químico'],['Monitoramento','e resposta']],'Barreiras são escolhidas e validadas conforme os perigos')),
 aForm('sn-reuso-risco','Reúso: fonte, exposição e uso',484,150,aChain([['Caracterizar','a fonte'],['Avaliar','exposição'],['Definir metas','e controles']],'Não confundir desenho didático com autorização de reúso')),
 aForm('sn-reuso-industrial','Reúso industrial: controle e purga',484,190,aChain([['Água de reúso','condicionada'],['Circuito','industrial'],['Purga','tratamento']])+aPath('M242 98 V155 H78 V98')+aArrow(170,155,128,155)+aText(245,177,'Retorno do circuito')),
 aForm('sn-reuso-irrigacao','Reúso para irrigação: barreiras de exposição',484,150,aChain([['Qualidade','para o uso'],['Distribuição','controlada'],['Cultura / solo','e exposição']],'Considerar salinidade, nutrientes, patógenos e contato')),
 ]],
 ['Tratamento avançado: módulos conectáveis', [
 aForm('sn-modulo-mf','Microfiltração: alimentação e concentrado',350,190,aBox(104,42,140,74,['Membrana','MF'])+aPath('M8 79 H104 M244 79 H342 M174 116 V150 H294')+aArrow(265,79,304,79)+aArrow(236,150,279,150)+aText(54,56,'entrada')+aText(289,56,'permeado')+aText(192,174,'retido / concentrado')),
 aForm('sn-modulo-uf','Ultrafiltração: módulo e retrolavagem',350,230,aBox(104,42,140,74,['Membrana','UF'])+aPath('M8 79 H104 M244 79 H342 M174 116 V156 H294')+aArrow(265,79,304,79)+aPath('M342 132 H276 V98 H244')+head(244,98,180,8)+aText(174,25,'Separação por membrana')+aText(194,174,'concentrado')+aText(174,207,'Retrolavagem: retorno ao módulo')),
 aForm('sn-modulo-nf','Nanofiltração: três correntes',350,190,aBox(104,42,140,74,['Membrana','NF'])+aPath('M8 79 H104 M244 79 H342 M174 116 V150 H294')+aText(50,56,'entrada')+aText(291,56,'permeado')+aText(185,174,'concentrado')+aArrow(268,79,309,79)),
 aForm('sn-ro-balanco','Osmose reversa: balanço de vazões',420,210,aBox(145,57,130,70,['Osmose','reversa'])+aArrow(8,92,145,92)+aArrow(275,92,412,92)+aPath('M210 127 V163 H350')+head(350,163,0,8)+aText(70,65,'Qf')+aText(345,65,'Qp')+aText(274,145,'Qc')+aText(210,193,'Qf = Qp + Qc · recuperação = Qp/Qf')),
 aForm('sn-oxidacao-avancada','Oxidação avançada: UV e peróxido',350,190,aBox(90,72,170,70,['UV + H₂O₂'])+aPath('M8 107 H90 M260 107 H342 M175 18 V72')+head(175,72,90,8)+aText(239,30,'H₂O₂')+aText(175,166,'Alvo e dose: validação específica')),
 aForm('sn-eletrodialise','Eletrodiálise: membranas e eletrodos',340,200,aBox(48,32,244,120,'')+aPath('M73 48 V133 M267 48 V133 M115 48 V133 M153 48 V133 M191 48 V133 M229 48 V133','stroke-width="1.6"')+aText(73,18,'+')+aText(267,18,'−')+aArrow(122,88,143,88)+aText(133,69,'+')+aArrow(220,111,199,111)+aText(210,131,'−')+aText(170,175,'Compartimentos alternados · íons')),
 aForm('sn-filtro-cag-modulo','Adsorção em CAG: módulo conectável',270,190,aBox(65,38,140,88,['Carvão ativado','granular'])+aPath('M8 82 H65 M205 82 H262 M135 126 V158')+aText(135,176,'Troca / regeneração controlada')),
 aForm('sn-integridade-membrana','Membranas: teste de integridade',484,150,aChain([['Teste','de integridade'],['Comparar','com limite'],['Liberar / isolar','módulo']],'Procedimento e frequência definidos pelo sistema')),
 ]],
 ['Unidades conectáveis e monitoramento', [
 aForm('sn-modulo-tanque-septico','Tanque séptico: módulo de processo',270,190,aBox(65,42,140,80,['Tanque','séptico'])+aPath('M8 82 H65 M205 82 H262 M135 122 V153')+head(135,153,90,8)+aText(135,174,'lodo: retirada periódica')),
 aForm('sn-modulo-filtro-anaerobio','Filtro anaeróbio: módulo de processo',270,190,aBox(65,42,140,80,['Filtro','anaeróbio'])+aPath('M8 82 H65 M205 82 H262 M135 122 V153')+aText(135,174,'lodo / limpeza: manejo')),
 aForm('sn-modulo-desinfeccao','Desinfecção: módulo com dose e controle',300,190,aBox(70,65,160,70,['Desinfecção'])+aPath('M8 100 H70 M230 100 H292 M150 18 V65')+head(150,65,90,8)+aText(221,30,'agente / energia')+aText(150,163,'Dose, tempo e condição de operação')),
 aForm('sn-amostragem-entrada-saida','Monitoramento: amostras de entrada e saída',350,190,aBox(105,50,140,70,['Tratamento'])+aPath('M8 85 H105 M245 85 H342 M58 85 V135 M292 85 V135')+aText(58,155,'entrada')+aText(292,155,'saída')+aText(175,24,'Plano de amostragem')),
 aForm('sn-tdh-preenchivel','Tempo de detenção hidráulica: modelo',330,180,aText(165,29,'TDH = V / Q',24)+aText(165,76,'V = ____ m³ · Q = ____ m³/d')+aText(165,113,'TDH = ____ dias')+aText(165,151,'Volume útil · mesma base temporal')),
 aForm('sn-carga-eficiencia','Carga e remoção: modelo preenchível',420,180,aText(210,28,'Carga (kg/d) = Q (m³/d) · C (mg/L) / 1000',16)+aText(210,74,'η = (Centrada − Csaída) / Centrada · 100%',16)+aText(210,116,'Q = ____ · Centrada = ____ · Csaída = ____')+aText(210,153,'Concentrações comparáveis · carga se Q variar')),
 ]],
];
grupo.secoes.push(...aSaneamento);
// Detenção não implica lâmina permanente; explicitar a fase de esvaziamento.
for(const [,fs] of grupo.secoes) for(const f of fs) if(f[0]==='sn-bacia-detencao') {
 f[2]=340; f[3]=170; f[4]=aPath('M8 70 H40 L76 140 H260 L296 70 H332 M260 128 H332 M260 140 H332')+aLine(58,103,278,103,true)+aLine(74,133,262,133,true)+aText(170,28,'Bacia de detenção · armazenamento temporário')+aText(170,85,'NA durante o evento')+aText(170,155,'Saída controlada · esvaziamento');
}


const aPointEta = (x,y,t) => '<circle cx="'+x+'" cy="'+y+'" r="3" fill="#C"/>'+aText(x,y-17,t);

// Peças para montar a ETA: desenhos conceituais, sem dosagem prescrita.
const aEtaExtra = [
 ['ETA: componentes para montar esquemas',[
 aForm('sn-agitador-peca','Agitador: motor, eixo e hélice isolados',220,240,aBox(74,14,72,45,'M')+aPath('M110 59 V171 M68 169 L110 184 L152 169 M68 184 L110 169 L152 184 M67 75 H153')+aText(110,216,'Componente de mistura')),
 aForm('sn-mistura-floco-comparar','Mistura rápida e floculação: funções distintas',484,180,aChain([['Mistura rápida','dispersar coagulante'],['Floculação','agregação gradual'],['Separação','dos flocos']],'Energia e tempo próprios; não aplicar uma rotação universal')),
 aForm('sn-chicana-caminho','Floculador hidráulico: caminho em chicanas',410,240,aBox(25,32,360,145,'')+aPath('M97 32 V144 M169 177 V65 M241 32 V144 M313 177 V65 M8 55 H25 M385 154 H402')+aArrow(58,60,58,140)+aArrow(68,154,130,154)+aArrow(130,144,130,65)+aArrow(140,55,202,55)+aArrow(202,65,202,144)+aArrow(212,154,274,154)+aArrow(274,144,274,65)+aArrow(284,55,346,55)+aArrow(346,65,346,151)+aText(205,211,'Fluxo alternado · folgas livres nas pontas')),
 aForm('sn-chicanas-vertical-caminho','Floculador vertical: passagem superior/inferior',410,260,aTank(25,44,360,155,25)+aPath('M97 44 V164 M169 199 V98 M241 44 V164 M313 199 V98 M8 80 H25 M385 80 H402')+aArrow(60,95,60,168)+aArrow(66,179,131,179)+aArrow(132,164,132,83)+aArrow(143,81,204,81)+aArrow(205,98,205,166)+aArrow(213,179,274,179)+aArrow(277,165,277,83)+aArrow(285,81,348,81)+aText(205,230,'Corte: lâmina acima das chicanas de fundo')),
 aForm('sn-calha-parshall-pontos','Parshall: montante, garganta e jusante',410,220,aPath('M8 53 H110 L180 78 H234 L298 42 H402 M8 167 H110 L180 142 H234 L298 178 H402')+aLine(180,78,180,142,true)+aLine(234,78,234,142,true)+aArrow(36,110,93,110)+aArrow(263,110,325,110)+aPointEta(133,99,'Ha')+aPointEta(209,112,'Hb')+aText(208,160,'garganta')+aText(205,201,'Pontos de medição conforme geometria / regime')),
 aForm('sn-dos-pac','Preparo e dosagem de PAC: esquema',390,240,aTank(20,48,112,139,40)+aBox(54,15,45,30,'M')+aPath('M76 45 V144 M56 144 L96 156 M56 156 L96 144 M132 161 H218 M250 161 H382')+aPump(234,161)+aText(103,109,'PAC')+aText(290,111,'injeção')+aText(195,217,'PAC: policloreto de alumínio · avaliar produto')),
 aForm('sn-dos-alum-preparo','Sulfato de alumínio: dissolução e dosagem',410,250,aTank(30,55,120,139,35)+aPath('M60 12 H120 L107 38 H73Z M90 38 V58 M150 164 H238 M270 164 H402')+aPump(254,164)+aText(90,117,'solução')+aText(267,56,'Sulfato de alumínio')+aText(205,221,'Preparo conforme produto · ensaio e operação')),
 aForm('sn-dos-cloro-contato','Hipoclorito: dosagem e tanque de contato',484,190,aChain([['Solução','de hipoclorito'],['Bomba dosadora','injeção'],['Tanque','de contato']],'Controlar demanda, residual, pH e tempo; sem dose universal')),
 aForm('sn-bomba-dosadora-diafragma','Bomba dosadora: diafragma conceitual',260,242,aBox(8,62,90,80,'M')+aPath('M98 102 H122 M148 61 Q112 102 148 143 M148 61 H202 V143 H148 M175 61 V32 M175 143 V196')+aArrow(175,35,175,56)+aArrow(175,163,175,190)+aText(175,17,'entrada')+aText(175,224,'saída')),
 aForm('sn-injecao-dosagem','Ponto de injeção na linha de água',330,210,aPath('M8 116 H322 M8 151 H322 M165 26 V132')+head(165,132,90,9)+aArrow(218,134,282,134)+aText(165,18,'solução dosada')+aText(165,182,'Mistura e compatibilidade a verificar')),
 aForm('sn-coluna-calibracao','Coluna de calibração de bomba dosadora',280,240,aTank(104,32,72,130,50)+aPath('M140 162 V202 H220')+aPump(236,202)+[58,82,106,130].map(y=>aLine(108,y,122,y)).join('')+aText(140,17,'Coluna graduada')+aText(140,225,'Variação de volume por tempo')),
 aForm('sn-amostrador-torneira','Torneira de amostragem em derivação',260,190,aPath('M8 129 H252 M120 129 V76 H192 V110 M111 72 H129 M120 76 V50 M108 50 H132')+aPath('M192 120 V133','stroke-dasharray="3 5"')+aText(130,22,'Ponto de amostragem')+aText(130,164,'Procedimento e higiene apropriados')),
 ]],
 ['Água, flocos e microrganismos ilustrativos',[
 aForm('sn-copo-agua-clara','Copo de água visualmente clara',190,220,aPath('M34 26 L48 182 H142 L156 26 M34 26 H156')+aLine(42,78,149,78,true)+aText(95,199,'Clareza ≠ potabilidade')),
 aForm('sn-copo-agua-turva','Copo com partículas em suspensão',190,220,aPath('M34 26 L48 182 H142 L156 26 M34 26 H156')+aLine(42,78,149,78,true)+[[60,102],[92,92],[127,110],[78,137],[115,151],[65,163],[134,169]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="3" fill="#C"/>').join('')+aText(95,199,'Suspensão ilustrativa')),
 aForm('sn-flocos-formacao','Floculação: partículas e agregados',430,200,[[30,66],[66,42],[52,111],[96,99],[99,54]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="4"/>').join('')+aArrow(129,88,190,88)+[[231,83],[244,69],[249,95],[266,81],[280,68],[282,95],[298,82]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="9"/>').join('')+aText(69,153,'partículas')+aText(270,153,'agregado / floco')+aText(215,181,'Representação conceitual sem escala')),
 aForm('sn-bacteria-bacilo','Bactéria: bacilo ilustrativo',250,180,'<rect x="58" y="56" width="130" height="56" rx="28"/>'+aPath('M188 84 Q219 54 239 80 M72 56 L64 43 M98 56 V41 M123 56 V41 M149 56 L156 42 M72 112 L64 126 M99 112 V128 M125 112 V128 M151 112 L158 126','stroke-width="1.6"')+aPath('M92 78 Q119 65 146 87 Q120 101 92 78','stroke-width="1.6"')+aText(125,156,'Microrganismo ilustrativo')),
 aForm('sn-bacteria-cocos','Bactérias: agrupamento de cocos ilustrativo',240,180,[[80,58],[119,48],[157,63],[68,96],[109,88],[148,103],[106,128]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="17"/>').join('')+aText(120,160,'Agrupamento sem escala')),
 aForm('sn-inativacao-conceito','Desinfecção: inativação conceitual',430,220,'<rect x="35" y="65" width="95" height="44" rx="22"/>'+aArrow(152,86,248,86)+'<rect x="270" y="65" width="95" height="44" rx="22" stroke-dasharray="5 4"/>'+aPath('M283 52 L352 123 M352 52 L283 123','stroke-width="1.6"')+aText(83,141,'antes')+aText(317,141,'inativado')+aText(215,182,'Inativação ≠ remoção física')+aText(215,207,'Efeito depende do organismo e da condição')),
 ]],
];
grupo.secoes.push(...aEtaExtra);


// Legados pequenos: ampliar sem deformar; manter traço natural 2,5 com non-scaling-stroke.
// A fonte efetiva é fonte original × escala (>=14 px nos candidatos com fonte <12 px).
const aAjustesLegados = {
  "sn-mistura-rapida": {
    "k": 1.2727272727272727,
    "x": 0.9090909090909092,
    "y": -1.6363636363636367,
    "w": 142,
    "h": 163
  },
  "sn-floc-horizontal": {
    "k": 1.2727272727272727,
    "x": 0.9090909090909092,
    "y": -19.454545454545453,
    "w": 282,
    "h": 107
  },
  "sn-eta-blocos": {
    "k": 1.4,
    "x": 0.40000000000000036,
    "y": -2.3999999999999986,
    "w": 360,
    "h": 169
  },
  "sn-eta-compacta": {
    "k": 1.4,
    "x": 0.40000000000000036,
    "y": 3.2,
    "w": 323,
    "h": 186
  },
  "sn-filtro-lento": {
    "k": 1,
    "x": 2,
    "y": -2,
    "w": 212,
    "h": 106
  },
  "sn-dos-sulfato": {
    "k": 1.2727272727272727,
    "x": -4.181818181818182,
    "y": 1.5454545454545459,
    "w": 188,
    "h": 140
  },
  "sn-dos-cal": {
    "k": 1.2727272727272727,
    "x": -4.181818181818182,
    "y": 1.5454545454545459,
    "w": 188,
    "h": 140
  },
  "sn-dos-fluor": {
    "k": 1.2727272727272727,
    "x": -4.181818181818182,
    "y": 1.5454545454545459,
    "w": 188,
    "h": 140
  },
  "sn-equalizacao": {
    "k": 1.2727272727272727,
    "x": 0.9090909090909092,
    "y": 1.5454545454545459,
    "w": 219,
    "h": 140
  },
  "sn-dos-polimero": {
    "k": 1.2727272727272727,
    "x": -4.181818181818182,
    "y": 1.5454545454545459,
    "w": 188,
    "h": 140
  },
  "sn-dos-cap": {
    "k": 1.2727272727272727,
    "x": -4.181818181818182,
    "y": 1.5454545454545459,
    "w": 188,
    "h": 140
  },
  "sn-dos-hipoclorito": {
    "k": 1.4,
    "x": -13.599999999999998,
    "y": -13.599999999999998,
    "w": 197,
    "h": 138
  },
  "sn-dosador-seco": {
    "k": 1.4,
    "x": -2.3999999999999986,
    "y": -5.199999999999999,
    "w": 252,
    "h": 178
  },
  "sn-osmose": {
    "k": 1.5555555555555556,
    "x": -0.22222222222222232,
    "y": -37.55555555555556,
    "w": 385,
    "h": 129
  },
  "sn-parshall-medidor": {
    "k": 1.2727272727272727,
    "x": 0.9090909090909092,
    "y": 0.9090909090909092,
    "w": 231,
    "h": 122
  },
  "sn-elevatoria": {
    "k": 1.2727272727272727,
    "x": 0.9090909090909092,
    "y": -16.90909090909091,
    "w": 193,
    "h": 168
  },
  "sn-grade-mecanizada": {
    "k": 1.5555555555555556,
    "x": -0.22222222222222232,
    "y": 1.333333333333333,
    "w": 283,
    "h": 188
  },
  "sn-uasb-completo": {
    "k": 1.2727272727272727,
    "x": -11.818181818181817,
    "y": 6,
    "w": 213,
    "h": 234
  },
  "sn-lodo-ativado": {
    "k": 1.2727272727272727,
    "x": 0.9090909090909092,
    "y": -6.727272727272727,
    "w": 333,
    "h": 165
  },
  "sn-rbs": {
    "k": 1.4,
    "x": -5.199999999999999,
    "y": -5.199999999999999,
    "w": 353,
    "h": 158
  },
  "sn-aerador-sup": {
    "k": 1.2727272727272727,
    "x": -4.181818181818182,
    "y": -4.181818181818182,
    "w": 196,
    "h": 147
  },
  "sn-dec-sec-recirc": {
    "k": 1.2727272727272727,
    "x": -11.18181818181818,
    "y": -14.363636363636363,
    "w": 245,
    "h": 127
  },
  "sn-mle": {
    "k": 1.4,
    "x": 0.40000000000000036,
    "y": 4.6,
    "w": 365,
    "h": 192
  },
  "sn-a2o": {
    "k": 1.5555555555555556,
    "x": -0.22222222222222232,
    "y": 2.111111111111111,
    "w": 398,
    "h": 183
  },
  "sn-bas": {
    "k": 1.2727272727272727,
    "x": 0.9090909090909092,
    "y": -6.727272727272727,
    "w": 168,
    "h": 191
  },
  "hd-contato": {
    "k": 1,
    "x": 2,
    "y": 5.5,
    "w": 164,
    "h": 106
  },
  "sn-uv": {
    "k": 1,
    "x": 2,
    "y": 4.5,
    "w": 184,
    "h": 97
  },
  "sn-uv-canal": {
    "k": 1,
    "x": 2,
    "y": 7,
    "w": 214,
    "h": 117
  },
  "sn-clorador-pastilhas": {
    "k": 1.2727272727272727,
    "x": 0.9090909090909092,
    "y": -6.727272727272727,
    "w": 206,
    "h": 142
  },
  "sn-gerador-hipoclorito": {
    "k": 1.2727272727272727,
    "x": -4.181818181818182,
    "y": -3.545454545454545,
    "w": 272,
    "h": 140
  },
  "sn-centrifuga": {
    "k": 1.2727272727272727,
    "x": 0.9090909090909092,
    "y": 0.9090909090909092,
    "w": 236,
    "h": 127
  },
  "sn-calagem": {
    "k": 1.4,
    "x": 0.40000000000000036,
    "y": -2.3999999999999986,
    "w": 281,
    "h": 161
  },
  "sn-aterro": {
    "k": 1.4,
    "x": 0.40000000000000036,
    "y": -15,
    "w": 365,
    "h": 189
  },
  "sn-camadas-base": {
    "k": 1.4,
    "x": -5.199999999999999,
    "y": -6.6,
    "w": 272,
    "h": 173
  },
  "sn-dreno-chorume": {
    "k": 1,
    "x": 2,
    "y": -1,
    "w": 188,
    "h": 105
  },
  "sn-coleta-seletiva": {
    "k": 1.4,
    "x": -3.799999999999999,
    "y": -27.599999999999994,
    "w": 357,
    "h": 140
  },
  "sn-sarjeta": {
    "k": 1.4,
    "x": 0.40000000000000036,
    "y": -12.2,
    "w": 281,
    "h": 122
  },
  "sn-boca-lobo": {
    "k": 1.4,
    "x": 0.40000000000000036,
    "y": -12.2,
    "w": 253,
    "h": 168
  },
  "sn-hidrograma": {
    "k": 1.2727272727272727,
    "x": -3.0184659090909083,
    "y": -1,
    "w": 263,
    "h": 184
  }
};
for(const [,fs] of grupo.secoes) for(const f of fs){
 const a=aAjustesLegados[f[0]];if(!a)continue;
 f[2]=a.w;f[3]=a.h;
 f[4]='<g transform="translate('+a.x+' '+a.y+') scale('+a.k+')">'+f[4].replace(/<(path|rect|circle|ellipse|line|polyline|polygon)\b/g,'<$1 vector-effect="non-scaling-stroke"')+'</g>';
}

export default grupo;
