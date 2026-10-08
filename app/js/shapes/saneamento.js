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
const gradeFrente = (s, sw) => { let d = ''; for (let x = 20 + s; x < 120; x += s) d += `M${x} 20 V100`; return `<path d="M14 10 V104 H126 V10"/>${lv(14, 126, 40)}<path d="M14 20 H126" ${tn}/><path d="${d}" stroke-width="${sw}"/>`; };

export default {
  id: 'saneamento', nome: 'Saneamento (ETA e ETE)',
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
      ['sn-parshall-medidor', 'Calha Parshall com medidor de nível', 180, 110, `<path d="M4 30 H50 L80 46 H100 L176 34 M4 90 H50 L80 74 H100 L176 86"/><circle cx="40" cy="16" r="12"/><path d="M40 28 V54" stroke-dasharray="3 3" ${tn}/><circle cx="40" cy="60" r="3" fill="#C"/>${setaH(110, 152, 60, 10)}` + T(40, 16, 'LT', 11)],
      ['sn-elevatoria', 'Elevatória de esgoto (poço úmido)', 150, 150, `<path d="M4 30 H20 V140 H130 V30 H146 M20 30 H130 M4 52 H20 M4 62 H20 M54 112 V18 H146 M96 112 V18"/>${lv(20, 130, 76)}<rect x="44" y="112" width="20" height="24" rx="3"/><rect x="86" y="112" width="20" height="24" rx="3"/>` + T(54, 124, 'M', 11) + T(96, 124, 'M', 11)],
      ['sn-dec-prim-ret', 'Decantador primário retangular', 200, 110, `<path d="M10 14 V96 H38 L56 80 H190 V14 M4 28 H10 M190 22 H196 M24 96 V104"/>${lv(10, 190, 22)}<path d="M20 14 V44" ${tn}/><rect x="60" y="30" width="120" height="40" rx="20" ${tn}/><circle cx="80" cy="50" r="5" ${tn}/><circle cx="160" cy="50" r="5" ${tn}/><path d="M90 66 V78 M120 66 V78 M150 66 V78 M100 26 V34 M140 26 V34" stroke-width="2.2"/>` + dots(16, 34, 84, 92, 6)],
      ['sn-dec-prim-circ', 'Decantador circular com raspador', 190, 110, `<path d="M10 14 V66 L86 88 V100 H104 V88 L180 66 V14 M95 100 V106 M180 22 H186"/><path d="M10 10 H180" stroke-width="3"/>${lv(10, 180, 22)}<path d="M80 16 V44 M110 16 V44 M95 10 V82 M90 82 L20 62 M100 82 L170 62 M10 30 H22 V22 M180 30 H168 V22" ${tn}/>` + dots(90, 100, 92, 98, 5)],
      ['sn-tanque-septico', 'Tanque séptico (duas câmaras)', 190, 100, `<rect x="14" y="16" width="162" height="72" rx="2"/><path d="M110 16 V52 M110 68 V88 M4 30 H24 M24 22 V50 M166 34 H186 M166 26 V54"/>${lv(24, 166, 36)}<path d="${wave(14, 110, 76, 3, 16)} ${wave(110, 174, 80, 2, 16)}" ${tn}/>`],
      ['sn-filtro-anaerobio', 'Filtro anaeróbio', 140, 140, `<rect x="14" y="14" width="112" height="116" rx="2"/><path d="M4 24 H24 V120 M126 30 H136"/>${lv(14, 126, 22)}<path d="M30 46 H126 M14 112 H126" stroke-dasharray="6 4" ${tn}/>${stones(36, 118, 54, 104, 5, 4)}`],
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
    ]],
    ['Lagoas e wetlands', [
      ['hd-lagoa', 'Lagoa de estabilização', 170, 70, `<path d="M4 14 H24 L54 60 H116 L146 14 H166"/><path d="M32 26 H138" ${dash}/><path d="${wave(56, 112, 56, 2.5, 14)}" ${tn}/>`],
      ['sn-lagoa-anaerobia', 'Lagoa anaeróbia', 200, 110, `${lagoa(18, 100, 24, 176, 36)}${lv(32, 168, 28)}<path d="${wave(62, 138, 90, 3, 15)}" ${tn}/>${dots(66, 134, 94, 96, 7)}${bolhas([[80, 76], [84, 60], [80, 44], [110, 72], [114, 56], [108, 40], [136, 66], [132, 50]], 2.2)}`],
      ['sn-lagoa-facultativa', 'Lagoa facultativa', 200, 110, `${lagoa(50, 100, 24, 176, 22)}${lv(30, 170, 58)}<path d="M38 80 H162" stroke-dasharray="2 4" ${tn}/><path d="${wave(48, 152, 92, 2.5, 13)}" ${tn}/>${sol(100, 24)}${bolhas([[52, 66], [70, 70], [88, 66], [106, 70], [124, 66], [142, 70]], 2)}`],
      ['sn-lagoa-maturacao', 'Lagoa de maturação', 200, 100, `${lagoa(52, 84, 20, 180, 16)}${lv(26, 174, 60)}${sol(100, 24)}<path d="M84 40 L76 54 M100 42 V56 M116 40 L124 54" stroke-dasharray="3 3" ${tn}/>`],
      ['sn-lagoa-aerada', 'Lagoa aerada', 200, 110, `${lagoa(40, 100, 24, 176, 24)}${lv(30, 170, 50)}${[70, 130].map(x => `<rect x="${x - 8}" y="30" width="16" height="12" rx="2"/><ellipse cx="${x}" cy="49" rx="14" ry="4"/><path d="M${x - 14} 46 Q${x - 24} 34 ${x - 32} 48 M${x + 14} 46 Q${x + 24} 34 ${x + 32} 48" stroke-dasharray="3 3" ${tn}/>`).join('')}`],
      ['sn-lagoas-serie', 'Lagoas em série (planta)', 260, 90, `<rect x="8" y="14" width="60" height="62" rx="4"/><rect x="80" y="14" width="100" height="62" rx="4"/><rect x="192" y="14" width="60" height="62" rx="4"/>${head(80, 45, 0, 10)}${head(192, 45, 0, 10)}` + T(38, 45, 'A', 20) + T(130, 45, 'F', 20) + T(222, 45, 'M', 20)],
      ['sn-wetland', 'Wetland construído', 200, 110, `<path d="M8 40 V100 H192 V40 M4 66 H8 M192 88 H196"/>${lv(8, 192, 54)}${stones(14, 186, 62, 94, 4, 3)}${[30, 62, 94, 126, 158, 182].map(x => `<path d="M${x} 58 V14 M${x} 40 Q${x - 10} 30 ${x - 13} 20 M${x} 46 Q${x + 10} 36 ${x + 13} 26" ${tn}/>`).join('')}`],
    ]],
    ['Desinfecção e polimento', [
      ['hd-contato', 'Tanque de contato (desinfecção)', 160, 100, `<rect x="4" y="24" width="152" height="70" rx="2"/><path d="M36 24 V74 M68 94 V44 M100 24 V74 M132 94 V44"/><path d="M16 4 V20" ${tn}/>${head(16, 30, 90, 10)}` + T(36, 10, 'Cl', 14)],
      ['sn-cloracao', 'Câmara de cloração (planta)', 200, 110, `<rect x="8" y="8" width="184" height="94" rx="2"/><path d="M8 32 H160 M40 56 H192 M8 80 H160 M4 20 H8 M192 92 H196"/>${setaH(20, 150, 20)}${setaH(176, 50, 44)}${setaH(20, 150, 68)}${setaH(150, 186, 92, 8)}`],
      ['sn-uv', 'Reator ultravioleta (UV)', 180, 100, `<rect x="24" y="30" width="132" height="56" rx="6"/><path d="M4 58 H24 M156 58 H176 M90 30 V22"/>${[38, 52, 66].map(y => `<rect x="36" y="${y}" width="108" height="8" rx="4" ${tn}/>`).join('')}` + T(90, 12, 'UV', 16)],
      ['sn-ozonizador', 'Ozonizador com coluna de contato', 200, 140, `<rect x="8" y="40" width="60" height="50" rx="3"/><path d="M38 40 V24 M68 76 H90 V124 H118 M160 24 H190 M160 120 H190 M135 14 V6"/><rect x="110" y="14" width="50" height="118" rx="3"/>${lv(110, 160, 24)}<path d="M118 124 H152" stroke-width="3"/>${bolhas([[122, 110], [134, 104], [148, 110], [128, 90], [142, 84], [124, 68], [138, 62], [150, 72], [130, 46], [146, 40]], 2.2)}` + T(38, 65, 'O₃', 18) + T(38, 14, 'O₂', 12)],
      ['sn-cascata', 'Aerador em cascata', 160, 120, `<path d="M4 30 H40 V54 H72 V78 H104 V102 H156"/><path d="M4 22 H38 Q46 22 46 32 V46 H70 Q78 46 78 56 V70 H102 Q110 70 110 80 V94 H156" stroke-dasharray="5 4" ${tn}/>`],
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
    ]],
  ],
};
