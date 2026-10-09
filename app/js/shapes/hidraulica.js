// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
import { T, head, bow, pipe } from './base.js';

// Hidráulica (válvulas, conexões, bombas, medição, reservação, prediais; ETA e ETE ficam em saneamento.js):
// desenhos próprios, seguindo só as convenções usuais (ISO 10628 / ABNT) de P&ID e de
// projeto de instalações. Válvulas em linha usam a "gravata" de base.js com tocos de tubo nas bordas.
const V = (cy, extra = '') => bow(50, cy) + pipe(50, cy) + extra;
const tn = 'stroke-width="1.6"'; // traço fino de detalhe
const dash = `stroke-dasharray="7 5" ${tn}`; // nível de líquido

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
// régua de nível: tracinhos alternados
const regua = () => {
  let d = '';
  for (let y = 12, i = 0; y <= 120; y += 6, i++) d += `M14 ${y} h${i % 5 === 0 ? 14 : 7}`;
  return `<path d="${d}" ${tn}/>`;
};
// onda de lodo/superfície entre x0 e x1
const wave = (x0, x1, y, a = 4, p = 16) => {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1; x += p) d += ` q${p / 4} ${-a} ${p / 2} 0 t${p / 2} 0`;
  return d;
};

const lv = (x0, x1, y) => `<path d="M${x0} ${y} H${x1}" ${dash}/>`; // nível de líquido
// seta fina horizontal/vertical terminando em ponta cheia
const setaH = (x0, x1, y, L = 9) => `<path d="M${x0} ${y} H${x1 - Math.sign(x1 - x0) * L}" ${tn}/>` + head(x1, y, x1 > x0 ? 0 : 180, L);
const setaV = (x, y0, y1, L = 9) => `<path d="M${x} ${y0} V${y1 - Math.sign(y1 - y0) * L}" ${tn}/>` + head(x, y1, y1 > y0 ? 90 : -90, L);
// cota: reta fina com ponta nas duas extremidades
const cota = (x0, y0, x1, y1, L = 7) => {
  const a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  return `<path d="M${x0} ${y0} L${x1} ${y1}" ${tn}/>` + head(x1, y1, a, L) + head(x0, y0, a + 180, L);
};
const bolhas = (pts, r = 2.4) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" stroke-width="1.4"/>`).join('');
// bomba (círculo com triângulo cheio apontando para a direita)
const bomba = (cx, cy, r = 16) => `<circle cx="${cx}" cy="${cy}" r="${r}"/><path d="M${cx - r * 0.45} ${cy - r * 0.55} L${cx + r * 0.6} ${cy} L${cx - r * 0.45} ${cy + r * 0.55} Z" fill="#C" stroke="none"/>`;
// curva y = f(x) amostrada; curva paramétrica [x, y] = g(t)
const curva = (f, x0, x1, passo = 4) => { let d = ''; for (let x = x0; x <= x1 + 1e-9; x += passo) d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${f(x).toFixed(1)}`; return d; };
const param = (g, t0, t1, n = 48) => { let d = ''; for (let i = 0; i <= n; i++) { const [x, y] = g(t0 + (t1 - t0) * i / n); d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; } return d; };
// hachura de terreno sob uma reta (x0,y0)-(x1,y1)
const terreno = (x0, y0, x1, y1, s = 14) => { let d = ''; for (let x = x0 + 8; x <= x1; x += s) d += `M${x} ${(y0 + (y1 - y0) * (x - x0) / (x1 - x0)).toFixed(1)} l-6 8`; return `<path d="${d}" ${tn}/>`; };

export default {
  id: 'hidra', nome: 'Hidráulica',
  secoes: [
    ['Válvulas e registros', [
      ['hd-gaveta', 'Registro de gaveta', 100, 70, V(50, '<path d="M50 50 V20 M38 20 H62"/>')],
      ['hd-globo', 'Válvula globo', 100, 40, V(20, '<circle cx="50" cy="20" r="5" fill="#C"/>')],
      ['hd-esfera', 'Válvula de esfera', 100, 40, '<path d="M18 4 V36 L41 20 Z M82 4 V36 L59 20 Z"/><circle cx="50" cy="20" r="9"/>' + pipe(50, 20)],
      ['hd-borboleta', 'Válvula borboleta', 90, 50, '<path d="M30 6 V44 M60 6 V44 M30 40 L60 10 M8 25 H30 M60 25 H82"/><circle cx="45" cy="25" r="3" fill="#C"/>'],
      ['hd-retencao', 'Válvula de retenção', 100, 40, V(20, `<path d="M18 36 L82 4" ${tn}/>`) + '<path d="M50 20 L82 4 V36 Z" fill="#C"/>'],
      ['hd-agulha', 'Válvula agulha', 100, 70, V(50, '<path d="M50 50 V26"/><path d="M41 12 H59 L50 27 Z" fill="#C"/>')],
      ['hd-macho', 'Válvula macho', 100, 40, V(20, '<rect x="45" y="12" width="10" height="16" rx="1" fill="#C"/>')],
      ['hd-diafragma', 'Válvula de diafragma', 100, 70, V(50, '<path d="M50 50 V30 M32 30 A18 14 0 0 1 68 30 Z"/>')],
      ['hd-pe-crivo', 'Válvula de pé com crivo', 70, 116, '<path d="M35 4 V32 M23 32 H47 L23 80 H47 Z M35 80 V84"/><rect x="19" y="84" width="32" height="26" rx="3"/>' + dots(25, 46, 90, 106, 6)],
      ['hd-redutora', 'Válvula redutora de pressão', 100, 80, V(60, `<path d="M50 60 V36 M34 36 A16 14 0 0 1 66 36 Z"/><path d="M66 30 H90 V60" ${dash}/>`)],
      ['hd-alivio', 'Válvula de alívio', 90, 100, '<path d="M28 84 H52 L40 50 Z M74 38 V62 L40 50 Z M40 84 V96 M74 50 H86"/><path d="M40 50 V42 L30 38 L50 32 L30 26 L50 20 L40 16 V6" stroke-width="1.8"/>'],
      ['hd-solenoide', 'Válvula solenoide', 100, 80, V(60, '<path d="M50 60 V36"/><rect x="36" y="8" width="28" height="28" rx="2"/>' + T(50, 22, 'S', 16))],
      ['hd-boia', 'Torneira de boia', 100, 70, V(50, '<path d="M50 50 V30 L79 15"/><circle cx="86" cy="13" r="7"/>')],
      ['hd-ventosa', 'Ventosa', 70, 90, '<path d="M15 60 V34 A20 14 0 0 1 55 34 V60 Z M35 60 V86 M35 20 V8 M28 8 H42"/><circle cx="35" cy="46" r="7" fill="#C"/>'],
      ['hd-hidrante', 'Hidrante', 80, 110, '<path d="M14 104 H66 M24 104 V40 H56 V104 M24 40 A16 16 0 0 1 56 40 M40 24 V14 M33 14 H47 M24 64 H12 M10 57 V71 M56 64 H68 M70 57 V71"/>'],
      ['hd-filtroY', 'Filtro Y', 100, 80, '<path d="M4 24 H30 M70 24 H96"/><rect x="30" y="14" width="40" height="20"/><path d="M42 34 L62 66 M58 34 L74 58 M57 70 L80 54"/><path d="M50 37 L67 63" stroke-dasharray="4 3" stroke-width="1.4"/>'],
      ['hd-angular', 'Válvula angular', 80, 80, '<path d="M20 22 V50 L44 36 Z M30 60 H58 L44 36 Z M4 36 H20 M44 60 V76 M44 36 V12 M34 12 H54"/>'],
      ['hd-4vias', 'Válvula de quatro vias', 100, 100, '<path d="M18 34 V66 L50 50 Z M82 34 V66 L50 50 Z M34 18 H66 L50 50 Z M34 82 H66 L50 50 Z M4 50 H18 M82 50 H96 M50 4 V18 M50 82 V96"/>'],
      ['hd-motorizada', 'Válvula motorizada (atuador elétrico)', 100, 96, V(72, '<path d="M50 72 V40"/><circle cx="50" cy="24" r="16"/>' + T(50, 24, 'M', 16))],
    ]],
    ['Tubulações e conexões', [
      ['hd-tubo', 'Tubo', 120, 30, `<path d="M4 8 H116 M4 22 H116"/><path d="M4 8 V22 M116 8 V22" ${tn}/>`],
      ['hd-curva', 'Curva 90°', 80, 80, '<path d="M4 20 H40 A20 20 0 0 1 60 40 V76 M4 40 H40 V76"/>'],
      ['hd-curva45', 'Curva 45°', 92, 80, '<path d="M4 20 H44 L84 60 M4 40 H35.8 L69.9 74.1"/>'],
      ['hd-te', 'Tê', 110, 70, '<path d="M4 10 H106 M4 30 H45 V66 M106 30 H65 V66"/>'],
      ['hd-juncao', 'Junção 45°', 120, 80, '<path d="M4 54 H40 L74 20 M88.1 34.1 L68.3 54 H116 M4 74 H116"/>'],
      ['hd-cruzeta', 'Cruzeta', 100, 100, '<path d="M4 40 H40 V4 M60 4 V40 H96 M96 60 H60 V96 M40 96 V60 H4"/>'],
      ['hd-luva', 'Luva', 100, 60, `<path d="M4 22 H34 M4 38 H34 M66 22 H96 M66 38 H96"/><rect x="34" y="14" width="32" height="32" rx="2"/><path d="M50 14 V46" ${tn}/>`],
      ['hd-uniao', 'União', 100, 50, '<path d="M4 25 H42 M58 25 H96 M50 15 V35"/><path d="M42 10 V40 M58 10 V40" stroke-width="3.5"/>'],
      ['hd-cap', 'Cap (tampão)', 84, 60, `<path d="M4 18 H56 Q78 18 78 30 Q78 42 56 42 H4"/><path d="M56 18 V42" ${tn}/>`],
      ['hd-reducao', 'Redução concêntrica', 90, 50, '<path d="M4 8 H30 L60 18 V32 L30 42 H4 M60 18 H86 M60 32 H86"/>'],
      ['hd-reducao-exc', 'Redução excêntrica', 90, 50, '<path d="M4 8 H30 L60 22 H86 M4 42 H86"/>'],
      ['hd-flange', 'Flange', 80, 60, '<path d="M4 30 H32 M48 30 H76"/><path d="M32 8 V52 M48 8 V52" stroke-width="4"/>'],
      ['hd-dilatacao', 'Junta de dilatação', 100, 60, `<path d="M4 22 H26 M4 38 H26 M74 22 H96 M74 38 H96 M26 22 L32 12 L38 22 L44 12 L50 22 L56 12 L62 22 L68 12 L74 22 M26 38 L32 48 L38 38 L44 48 L50 38 L56 48 L62 38 L68 48 L74 38"/><path d="M26 12 V48 M74 12 V48" ${tn}/>`],
      ['hd-fluxo', 'Sentido do fluxo', 120, 40, `<path d="M6 20 H96"/>${head(114, 20, 0, 18)}`],
    ]],
    ['Bombas, motores e sopradores', [
      ['hd-bomba', 'Bomba centrífuga', 100, 100, '<circle cx="50" cy="48" r="32"/><path d="M50 16 H94 M4 48 H18 M20 92 H80 L66 74 M20 92 L34 74"/>'],
      ['hd-submersivel', 'Bomba submersível', 80, 130, `<path d="M4 30 H76" ${dash}/><path d="M40 4 V40 M40 76 V80"/><rect x="28" y="40" width="24" height="36" rx="3"/><path d="M32 64 H48 M32 70 H48" ${tn}/><rect x="26" y="80" width="28" height="42" rx="4"/>` + T(40, 101, 'M', 16)],
      ['hd-motobomba', 'Motobomba', 160, 90, '<circle cx="40" cy="46" r="26"/><circle cx="40" cy="46" r="6" stroke-width="1.8"/><path d="M14 46 V4 M66 46 H86 M10 84 H156 M30 70 L26 84 M50 70 L54 84 M96 66 V84 M144 66 V84"/><rect x="86" y="26" width="68" height="40" rx="4"/>' + T(120, 46, 'M', 20)],
      ['hd-soprador', 'Soprador', 100, 90, '<circle cx="50" cy="45" r="30"/><path d="M24 30 L76 38 M24 60 L76 52 M4 45 H20 M80 45 H96"/>'],
      ['hd-motor', 'Motor elétrico', 90, 70, '<circle cx="35" cy="35" r="26"/><path d="M61 35 H86"/>' + T(35, 30, 'M', 20) + T(35, 48, '~', 16)],
      ['hd-bomba-axial', 'Bomba de fluxo axial (hélice)', 130, 90, `<path d="M4 24 H126 M4 66 H126 M4 45 H51"/><ellipse cx="60" cy="45" rx="9" ry="6"/><ellipse cx="62" cy="34" rx="4" ry="8" transform="rotate(25 62 34)"/><ellipse cx="62" cy="56" rx="4" ry="8" transform="rotate(-25 62 56)"/><path d="M84 24 V32 M84 66 V58 M94 24 V32 M94 66 V58" ${tn}/>${setaH(100, 122, 45, 8)}`],
      ['hd-parafuso', 'Parafuso de Arquimedes (elevatória)', 210, 130, `<path d="M4 124 H64 M166 50 V66 H206"/>${lv(4, 58, 100)}${lv(170, 206, 58)}<g transform="rotate(-28 105 70)"><rect x="25" y="58" width="160" height="24" rx="3"/><path d="M15 70 H195" stroke-width="2"/><path d="${[32, 44, 56, 68, 80, 92, 104, 116, 128, 140, 152, 164].map(x => `M${x} 58 l12 24`).join('')}" ${tn}/><rect x="195" y="62" width="16" height="16" rx="2"/>${T(203, 70, 'M', 10)}</g>`],
      ['hd-carneiro', 'Carneiro hidráulico', 200, 130, `<path d="M6 12 V44 H46 V12 M46 38 L118 96 M128 92 V82 M122 82 H134 M142 92 V64 Q142 52 152 52 Q162 52 162 64 V92 M162 102 H186 V16"/><rect x="118" y="92" width="48" height="20" rx="3"/>${lv(6, 46, 22)}<path d="M122 86 l-6 10 M134 86 l6 10" stroke-dasharray="3 3" ${tn}/>${head(186, 8, -90, 8)}` + T(152, 76, 'ar', 10)],
      ['hd-pistao', 'Bomba de pistão (alternativa)', 170, 110, `<rect x="30" y="30" width="110" height="40" rx="2"/><rect x="92" y="33" width="12" height="34" fill="#C"/><path d="M104 50 H148 M45 70 V106 M45 30 V4 M39 92 H51 L45 80 Z M39 22 H51 L45 10 Z"/><circle cx="156" cy="50" r="8" ${tn}/>${cota(80, 86, 124, 86)}`],
      ['hd-serie', 'Bombas em série', 200, 76, `<path d="M4 34 H44 M76 34 H124 M156 34 H196"/>${bomba(60, 34)}${bomba(140, 34)}` + T(60, 64, 'B1', 12) + T(140, 64, 'B2', 12)],
      ['hd-paralelo', 'Bombas em paralelo', 200, 112, `<path d="M4 56 H40 M40 24 V88 M40 24 H84 M40 88 H84 M116 24 H160 M116 88 H160 M160 24 V88 M160 56 H196"/>${bomba(100, 24)}${bomba(100, 88)}`],
      ['hd-airlift', 'Bomba air-lift (ar comprimido)', 130, 170, `<path d="M10 40 V164 H100 V40 M48 158 V14 Q48 6 56 6 H122 M60 158 V22 Q60 18 64 18 H122"/>${lv(10, 100, 54)}<path d="M114 30 H80 V146 H60" stroke-width="2"/>${bolhas([[54, 140], [55, 124], [53, 108], [55, 92], [54, 76], [55, 60], [54, 44], [55, 30]], 2.2)}${head(127, 12, 0, 8)}` + T(118, 40, 'ar', 11)],
      ['hd-rotor', 'Rotor de bomba centrífuga', 120, 120, `<circle cx="60" cy="60" r="48"/><circle cx="60" cy="60" r="14" ${tn}/><circle cx="60" cy="60" r="4" fill="#C"/><path d="${[0, 60, 120, 180, 240, 300].map(a => { const P = (r, g) => `${(60 + r * Math.cos(g * Math.PI / 180)).toFixed(1)} ${(60 + r * Math.sin(g * Math.PI / 180)).toFixed(1)}`; return `M${P(14, a)} Q${P(34, a + 18)} ${P(46, a + 50)}`; }).join('')}" stroke-width="2.4"/><path d="M50.6 6.8 A54 54 0 0 0 18.6 25.3" ${tn}/>${head(18.6, 25.3, 130, 8)}`],
      ['hd-curva-bomba', 'Curvas da bomba e do sistema', 210, 150, `<path d="M30 10 V126 H200"/>${head(30, 6, -90, 9)}${head(204, 126, 0, 9)}<path d="${curva(x => 30 + 0.00346 * (x - 30) ** 2, 30, 186)}"/><path d="${curva(x => 92 - 0.00302 * (x - 30) ** 2, 30, 180)}" stroke-dasharray="7 4" stroke-width="2"/><path d="M30 63.1 H127.8 V126" stroke-dasharray="3 4" ${tn}/><circle cx="127.8" cy="63.1" r="4.5" fill="#C"/>` + T(16, 14, 'H', 13) + T(200, 140, 'Q', 13) + T(70, 22, 'bomba', 11) + T(182, 12, 'sistema', 11) + T(15, 92, 'Hg', 10)],
      ['hd-recalque', 'Instalação de recalque (sucção e recalque)', 220, 170, `<path d="M4 112 V162 H84 V112 M40 150 V90 H96 M110 76 V8 H176 V26 M150 16 V60 H214 V16"/>${lv(4, 84, 124)}${lv(150, 214, 34)}${bomba(110, 90, 14)}<rect x="34" y="148" width="12" height="10" ${tn}/><path d="M84 124 H210 M176 34 H210" stroke-dasharray="3 4" ${tn}/>${cota(204, 34, 204, 124)}` + T(188, 96, 'Hg', 12) + T(64, 80, 'sucção', 10) + T(80, 50, 'recalque', 10)],
    ]],
    ['Medição e controle', [
      ['hd-hidrometro', 'Hidrômetro', 100, 60, '<circle cx="50" cy="30" r="22"/>' + T(50, 30, 'H', 20) + '<path d="M4 30 H28 M72 30 H96"/>'],
      ['hd-macromedidor', 'Macromedidor (Woltmann)', 120, 70, '<path d="M4 44 H30 M90 44 H116 M60 22 V26"/><rect x="30" y="26" width="60" height="36" rx="3"/><rect x="46" y="6" width="28" height="16" rx="2"/>' + T(60, 44, 'W', 18)],
      ['hd-eletromag', 'Medidor eletromagnético', 120, 70, `<path d="M4 44 H30 M90 44 H116 M60 18 V26"/><rect x="30" y="26" width="60" height="36" rx="3"/><circle cx="60" cy="11" r="8"/><path d="M36 32 q4 -5 8 0 t8 0 M68 56 q4 5 8 0 t8 0" ${tn}/>` + T(60, 44, 'EM', 16)],
      ['hd-parshall', 'Calha Parshall', 160, 80, `<path d="M4 10 H50 L80 26 H100 L156 14 M4 70 H50 L80 54 H100 L156 66"/><path d="M14 40 H44" ${tn}/>${head(54, 40, 0, 11)}<circle cx="62" cy="22" r="3" fill="#C"/>`],
      ['hd-vertedor-tri', 'Vertedor triangular', 120, 90, `<path d="M4 20 H40 L60 60 L80 20 H116 V86 H4 Z"/><path d="M45 30 H75" ${dash}/>`],
      ['hd-vertedor-ret', 'Vertedor retangular', 120, 90, `<path d="M4 20 H36 V56 H84 V20 H116 V86 H4 Z"/><path d="M36 34 H84" ${dash}/>`],
      ['hd-manometro', 'Manômetro', 70, 90, '<circle cx="35" cy="32" r="26"/><path d="M35 32 L50 18 M35 58 V86"/><circle cx="35" cy="32" r="3" fill="#C"/>'],
      ['hd-piezometro', 'Piezômetro', 100, 110, `<path d="M4 78 H44 V8 M56 8 V78 H96 M4 100 H96"/><path d="M44 34 H56" stroke-width="3"/><path d="M62 26 H76 L69 34 Z" fill="#C"/><path d="M18 89 H60" ${tn}/>${head(72, 89, 0, 10)}`],
      ['hd-regua', 'Régua de nível', 50, 130, `<rect x="14" y="4" width="22" height="122"/>${regua()}<path d="M2 80 H48" ${dash}/>`],
      ['hd-na', "Nível d'água (NA)", 60, 52, '<path d="M18 8 H42 L30 24 Z M10 30 H50"/><path d="M18 38 H42 M25 45 H35" stroke-width="2"/>'],
      ['hd-venturi', 'Medidor Venturi', 200, 124, `<path d="M4 72 H50 L90 84 H110 L180 72 H196 M4 112 H50 L90 100 H110 L180 112 H196 M26 72 V14 M34 72 V14 M96 84 V14 M104 84 V14"/><path d="M26 26 H34 M96 52 H104" stroke-width="3"/><path d="M34 26 H126 M104 52 H126" stroke-dasharray="3 4" ${tn}/>${cota(120, 26, 120, 52, 6)}${setaH(130, 170, 92, 8)}` + T(140, 39, 'Δh', 12) + T(30, 92, '1', 12) + T(100, 92, '2', 12)],
      ['hd-orificio-placa', 'Placa de orifício', 140, 80, `<path d="M4 20 H136 M4 60 H136"/><path d="M70 20 V32 M70 48 V60" stroke-width="4"/><path d="M50 20 V8 M90 20 V8" ${tn}/><path d="M72 32 Q84 36 100 37 H128 M72 48 Q84 44 100 43 H128" stroke-dasharray="4 3" ${tn}/>${setaH(12, 48, 40, 8)}`],
      ['hd-pitot', 'Tubo de Pitot', 150, 110, `<path d="M4 62 H146 M4 100 H146 M26 62 V12 M34 62 V12 M70 77 H102 V12 M70 85 H110 V12"/><path d="M26 38 H34 M102 20 H110" stroke-width="3"/><path d="M34 38 H76 M64 20 H102" stroke-dasharray="3 4" ${tn}/>${cota(70, 20, 70, 38, 5)}${setaH(10, 50, 81, 8)}` + T(52, 28, 'Δh', 11)],
      ['hd-rotametro', 'Rotâmetro', 80, 150, `<path d="M30 130 L20 20 M50 130 L60 20 M14 20 H66 M24 130 H56 M40 20 V4 M40 130 V146"/><path d="M33 72 H47 L40 86 Z" fill="#C"/><path d="M33 68 H47" stroke-width="2"/><path d="${[30, 40, 50, 60, 70, 80, 90, 100, 110].map((y, i) => `M64 ${y} h${i % 2 ? 4 : 8}`).join('')}" ${tn}/>`],
      ['hd-manometro-u', 'Manômetro diferencial em U', 150, 130, `<path d="M4 14 H146 M4 34 H146 M36 34 V108 Q36 124 52 124 H88 Q104 124 104 108 V34 M44 34 V108 Q44 116 52 116 H88 Q96 116 96 108 V34"/><path d="M36 92 H44 M96 66 H104" stroke-width="3"/><path d="M44 92 H126 M104 66 H126" stroke-dasharray="3 4" ${tn}/>${cota(122, 66, 122, 92, 6)}${setaH(60, 90, 24, 8)}` + T(136, 79, 'Δh', 12)],
      ['hd-molinete', 'Molinete hidrométrico', 170, 110, `${lv(4, 166, 16)}<path d="${wave(4, 166, 100, 3, 18)}" stroke-width="2"/><path d="M80 6 V92" stroke-width="2"/><ellipse cx="86" cy="56" rx="22" ry="7"/><path d="M64 56 H57 M108 56 L120 46 M108 56 L120 66"/><ellipse cx="54" cy="56" rx="3" ry="12"/>${setaH(8, 40, 40, 8)}${setaH(8, 40, 72, 8)}`],
      ['hd-ultrassonico', 'Medidor ultrassônico (tempo de trânsito)', 160, 100, `<path d="M4 32 H156 M4 72 H156"/><rect x="34" y="18" width="20" height="14" rx="2"/><rect x="106" y="72" width="20" height="14" rx="2"/><path d="M48 32 L112 72" stroke-dasharray="5 4" ${tn}/>${head(112, 72, 32, 7)}${head(48, 32, 212, 7)}${setaH(12, 40, 52, 8)}`],
      ['hd-vertedor-trap', 'Vertedor trapezoidal (Cipolletti)', 130, 90, `<path d="M4 20 H38 L48 60 H82 L92 20 H126 V86 H4 Z"/>${lv(41, 89, 30)}`],
      ['hd-pluviometro', 'Pluviômetro', 80, 140, `<rect x="16" y="14" width="48" height="114" rx="2"/><path d="M10 14 H70" stroke-width="3.5"/><path d="M18 18 L36 46 V58 M62 18 L44 46 V58 M64 116 H74 M74 112 V120"/><rect x="28" y="62" width="24" height="56" rx="3" ${tn}/>${lv(28, 52, 96)}<path d="M28 3 l-2 6 M42 3 l-2 6 M56 3 l-2 6" ${tn}/>`],
    ]],
    ['Orifícios, bocais e vertedores', [
      ['hd-orificio-parede', 'Orifício em parede delgada (jato)', 180, 130, `<path d="M10 10 V120 H70 V96 M70 84 V10 M70 84 Q78 87 86 87 Q130 89 168 126 M70 96 Q78 93 86 93 Q124 95 152 126"/>${lv(10, 70, 24)}<path d="M40 90 H70" stroke-dasharray="3 4" ${tn}/>${cota(40, 24, 40, 90)}` + T(52, 56, 'h', 13)],
      ['hd-orificio-fundo', 'Esvaziamento por orifício de fundo', 120, 150, `<path d="M14 10 V110 H52 M68 110 H106 V10 M52 110 Q55 120 56 130 V146 M68 110 Q65 120 64 130 V146"/>${lv(14, 106, 30)}${cota(30, 30, 30, 110)}${setaV(88, 36, 54, 8)}` + T(41, 70, 'h', 13)],
      ['hd-bocal', 'Bocal cilíndrico externo', 170, 110, `<path d="M10 10 V104 H60 V64 H100 M60 10 V40 H100"/>${lv(10, 60, 22)}<path d="M60 44 Q68 48 74 48 Q86 48 100 44 M60 60 Q68 56 74 56 Q86 56 100 60" stroke-dasharray="4 3" ${tn}/>${setaH(106, 162, 52)}`],
      ['hd-sifao', 'Sifão', 220, 130, `<path d="M4 40 V120 H70 V40 M150 78 V124 H216 V78 M26 112 V22 Q26 6 42 6 H164 Q180 6 180 22 V116 M34 112 V22 Q34 14 42 14 H164 Q172 14 172 22 V116"/>${lv(4, 70, 56)}${lv(150, 216, 94)}${head(116, 10, 0, 8)}<path d="M70 56 H206" stroke-dasharray="3 4" ${tn}/>${cota(200, 56, 200, 94, 6)}` + T(209, 70, 'H', 12)],
      ['hd-vertedor-soleira', 'Vertedor de soleira espessa (perfil)', 200, 100, `<path d="M4 90 H60 V56 H140 V90 H196"/><path d="M4 30 H36 Q70 32 92 46 H120 Q140 48 148 64 Q156 80 196 82" stroke-width="2"/><path d="M24 56 H60" stroke-dasharray="3 4" ${tn}/>${cota(24, 30, 24, 56, 6)}` + T(12, 43, 'H', 12)],
      ['hd-vertedor-creager', 'Vertedor de perfil Creager (ogiva)', 200, 130, `<path d="M4 120 H60 V40 Q66 30 80 32 Q96 36 108 60 L140 108 Q148 120 170 120 H196"/><path d="M4 22 H40 Q62 22 80 25 Q100 29 114 52 L146 100 Q154 112 196 112" stroke-width="2"/>`],
    ]],
    ['Hidrostática e energia', [
      ['hd-vasos-comunicantes', 'Vasos comunicantes', 200, 112, `<path d="M20 20 V104 H180 V20 M44 20 V86 H74 L62 20 M118 20 L106 86 H166 V20"/>${lv(20, 44, 40)}${lv(66, 114, 40)}${lv(166, 180, 40)}`],
      ['hd-prensa', 'Prensa hidráulica (Pascal)', 200, 120, `<path d="M30 30 V104 H190 V30 M50 30 V86 H110 V30"/><rect x="30" y="44" width="20" height="8" fill="#C"/><rect x="110" y="60" width="80" height="10" fill="#C"/>${setaV(40, 8, 42, 9)}${setaV(150, 58, 20, 10)}` + T(62, 18, 'F₁', 13) + T(172, 30, 'F₂', 13)],
      ['hd-empuxo', 'Empuxo hidrostático em parede', 170, 130, `<path d="M124 8 V124" stroke-width="4"/><path d="M4 124 H166"/><path d="${[20, 34, 48, 62, 76, 90, 104, 118].map(y => `M127 ${y} l8 -8`).join('')}" ${tn}/>${lv(10, 122, 24)}<path d="M122 24 L72 120 H122" ${tn}/>${setaH(109, 121, 48, 6)}${setaH(97, 121, 72, 7)}${setaH(80, 121, 104, 7)}<path d="M34 88 H108" stroke-width="3"/>${head(121, 88, 0, 13)}${cota(16, 24, 16, 120)}` + T(56, 78, 'E', 14) + T(28, 50, 'h', 13)],
      ['hd-bernoulli', 'Linhas de energia e piezométrica', 240, 116, `<path d="M4 20 V108 H36 V100 H236 M36 20 V92 H236"/>${lv(4, 36, 30)}<path d="M36 30 L236 58" stroke-dasharray="10 5" stroke-width="2"/><path d="M40 44 L236 72" stroke-dasharray="3 4" ${tn}/><path d="M96 92 V36 M104 92 V36 M166 92 V46 M174 92 V46"/><path d="M96 52.6 H104 M166 62.6 H174" stroke-width="3"/>` + T(220, 45, 'LE', 11) + T(220, 82, 'LP', 11)],
      ['hd-perfil-laminar', 'Perfil de velocidades laminar', 140, 100, `<path d="M4 14 H136 M4 86 H136"/><path d="M40 14 V86" ${tn}/><path d="M40 14 Q180 50 40 86" stroke-width="2"/>${setaH(40, 88, 30, 7)}${setaH(40, 110, 50, 7)}${setaH(40, 88, 70, 7)}`],
      ['hd-perfil-turbulento', 'Perfil de velocidades turbulento', 140, 100, `<path d="M4 14 H136 M4 86 H136"/><path d="M40 14 V86" ${tn}/><path d="M40 14 C104 16 112 30 112 50 C112 70 104 84 40 86" stroke-width="2"/>${setaH(40, 106, 30, 7)}${setaH(40, 112, 50, 7)}${setaH(40, 106, 70, 7)}`],
    ]],
    ['Canais e escoamento livre', [
      ['hd-canal-ret', 'Canal retangular (seção)', 140, 124, `<path d="M20 14 V96 H120 V14"/>${lv(20, 120, 44)}${cota(20, 106, 120, 106)}${cota(32, 44, 32, 96)}` + T(70, 116, 'b', 13) + T(42, 70, 'y', 13)],
      ['hd-canal-trap', 'Canal trapezoidal (seção)', 180, 124, `<path d="M10 14 L50 90 H130 L170 14"/>${lv(24, 156, 40)}${cota(50, 102, 130, 102)}${cota(90, 40, 90, 90)}<path d="M145.8 60 H156.3 V40" ${tn}/>` + T(90, 115, 'b', 13) + T(100, 65, 'y', 13) + T(151, 69, 'z', 11) + T(163, 50, '1', 11)],
      ['hd-canal-tri', 'Canal triangular (seção)', 140, 110, `<path d="M10 14 L70 94 L130 14"/>${lv(30, 110, 40)}${cota(70, 40, 70, 94)}` + T(80, 62, 'y', 13)],
      ['hd-canal-circ', 'Conduto circular parcialmente cheio', 120, 120, `<circle cx="60" cy="60" r="50"/><circle cx="60" cy="60" r="2" fill="#C"/>${lv(13, 107, 76)}${cota(60, 76, 60, 110, 6)}` + T(71, 93, 'y', 12)],
      ['hd-canal-perfil', 'Canal em perfil (declividade)', 220, 100, `<path d="M4 40 L216 84"/><path d="M4 18 L216 62" stroke-width="2"/>${terreno(4, 40, 216, 84)}<path d="M150 70.3 H190 V78.6" ${tn}/>${cota(60, 29.6, 60, 51.6, 6)}${setaH(100, 140, 49, 8)}` + T(70, 40, 'y', 12) + T(202, 72, 'I', 12)],
      ['hd-ressalto', 'Ressalto hidráulico', 220, 100, `<path d="M4 90 H216"/><path d="M4 74 H80 Q96 74 104 56 Q112 36 132 34 H216" stroke-width="2"/><ellipse cx="114" cy="48" rx="14" ry="8" stroke-dasharray="3 3" ${tn}/>${cota(54, 74, 54, 90, 5)}${cota(180, 34, 180, 90)}${setaH(10, 40, 82, 8)}` + T(68, 82, 'y₁', 11) + T(194, 62, 'y₂', 11)],
      ['hd-remanso', 'Curva de remanso (perfil M1)', 230, 110, `<path d="M4 60 L190 96 M190 96 V22 H204 V104"/>${terreno(4, 60, 190, 96)}<path d="M4 40 L190 76" stroke-dasharray="6 4" ${tn}/><path d="M4 40 C60 50 120 34 190 32" stroke-width="2"/>` + T(120, 72, 'yₙ', 10)],
      ['hd-comporta', 'Comporta plana (vista frontal)', 140, 130, `<path d="M14 36 V122 H126 V36 M70 50 V8 M54 8 H86"/><path d="M8 30 H132" stroke-width="3.5"/><path d="M30 30 V122 M110 30 V122" ${tn}/><rect x="32" y="50" width="76" height="50" rx="2"/><path d="M38 62 H102 M38 75 H102 M38 88 H102" ${tn}/>`],
      ['hd-comporta-segmento', 'Comporta de segmento (corte)', 180, 112, `<path d="M4 100 H176"/><path d="M64.3 20 A80 80 0 0 0 71.9 88"/><path d="M64.3 20 L140 46 M71.9 88 L140 46" stroke-width="2"/><circle cx="140" cy="46" r="4" fill="#C"/><path d="M140 50 L132 100 M140 50 L148 100" ${tn}/>${lv(4, 60, 30)}${lv(96, 176, 86)}${setaH(20, 120, 94, 8)}`],
      ['hd-comporta-escoamento', 'Escoamento sob comporta', 200, 110, `<path d="M4 96 H196"/><path d="M80 4 V72" stroke-width="4"/><path d="M4 30 H77 M83 72 Q92 80 108 82 H196" stroke-width="2"/>${cota(30, 30, 30, 96)}${cota(160, 82, 160, 96, 5)}${cota(70, 72, 70, 96, 5)}` + T(42, 62, 'y₁', 11) + T(174, 89, 'y₂', 11) + T(60, 84, 'a', 11)],
      ['hd-energia-especifica', 'Energia específica (E × y)', 200, 150, `<path d="M24 140 H192 M24 140 V12"/>${head(196, 140, 0, 9)}${head(24, 8, -90, 9)}<path d="M24 140 L144 20" stroke-dasharray="4 4" ${tn}/><path d="${param(y => [24 + y + 32000 / (y * y), 140 - y], 22, 122)}" stroke-width="2.5"/><circle cx="84" cy="100" r="3.5" fill="#C"/><path d="M24 100 H84" stroke-dasharray="3 4" ${tn}/>` + T(190, 128, 'E', 12) + T(12, 14, 'y', 12) + T(12, 100, 'yc', 10) + T(162, 54, 'subcrítico', 10) + T(152, 112, 'supercrítico', 10)],
      ['hd-queda', 'Queda livre em degrau', 200, 110, `<path d="M4 60 H120 V104 H196"/><path d="M4 28 H60 Q100 30 118 48 Q132 60 140 104" stroke-width="2"/><path d="M120 60 Q128 72 130 104" ${tn}/>${cota(80, 31, 80, 60, 6)}` + T(94, 46, 'yc', 11)],
    ]],
    ['Reservação e captação', [
      ['hd-elevado', 'Reservatório elevado', 120, 170, '<rect x="20" y="8" width="80" height="60" rx="4"/><path d="M20 30 H100" stroke-dasharray="8 6" stroke-width="1.6"/><path d="M34 68 L20 166 M86 68 L100 166 M27 118 H93 M30 100 L90 140 M90 100 L30 140" stroke-width="1.8"/>'],
      ['hd-apoiado', 'Reservatório apoiado', 140, 110, `<path d="M20 96 V26 Q70 6 120 26 V96 M4 96 H136"/><path d="M20 46 H120" ${dash}/><path d="${[16, 28, 40, 52, 64, 76, 88, 100, 112, 124, 136].map(x => `M${x} 96 L${x - 6} 104`).join('')}" ${tn}/>`],
      ['hd-enterrado', 'Reservatório enterrado', 140, 110, `<path d="M4 24 H60 M80 24 H136 M60 32 V16 M80 32 V16"/><path d="M56 16 H84" stroke-width="3.5"/><rect x="20" y="32" width="100" height="72" rx="2"/><path d="M20 52 H120" ${dash}/><path d="${[10, 22, 34, 46, 94, 106, 118, 130].map(x => `M${x} 24 L${x + 6} 16`).join('')}" ${tn}/>`],
      ['hd-caixa', "Caixa d'água", 140, 100, '<path d="M10 20 H130 L120 94 H20 Z"/><path d="M16 46 H124" stroke-dasharray="8 6" stroke-width="1.6"/><path d="M4 20 H136"/>'],
      ['hd-poco', 'Poço', 100, 170, '<path d="M4 20 H34 V166 H66 V20 H96"/><path d="M34 70 H66" stroke-dasharray="6 5" stroke-width="1.6"/><path d="M50 4 V150"/><rect x="42" y="140" width="16" height="22" fill="#C"/>'],
      ['hd-captacao', "Tomada d'água (captação)", 160, 100, `<path d="M4 92 Q40 98 64 88 L70.6 74 M76.2 62 L96 20 H156 M34 62 H150 M34 74 H150"/><path d="M4 30 H90" ${dash}/><path d="M34 52 V84" stroke-width="3.5"/>`],
      ['hd-cisterna', 'Cisterna', 150, 130, `<path d="M6 44 L46 14 L86 44 Z M14 44 V112 M78 44 V112 M4 112 H104 M144 112 H146 M86 44 H96 V60 H124 V70"/><rect x="104" y="70" width="40" height="56" rx="2"/><path d="M104 92 H144" ${dash}/>`],
      ['hd-hidropneumatico', 'Tanque hidropneumático', 120, 150, `<path d="M24 40 Q24 12 60 12 Q96 12 96 40 V116 Q96 140 60 140 Q24 140 24 116 Z M96 124 H116 M34 134 L30 147 M86 134 L90 147"/>${lv(24, 96, 70)}` + T(60, 44, 'ar', 13) + T(60, 104, 'água', 12)],
    ]],
    ['Adução e distribuição', [
      ['hd-chamine', 'Chaminé de equilíbrio', 230, 130, `<path d="M4 20 V112 H30 V20 M136 104 V14 M152 104 V14"/><path d="M30 104 H180 M212 104 H226" stroke-width="3.5"/>${bow(196, 104, 8)}${lv(4, 30, 32)}${lv(136, 152, 44)}<path d="M30 32 H136" stroke-dasharray="2 4" ${tn}/>${cota(162, 36, 162, 52, 5)}`],
      ['hd-quebra-pressao', 'Caixa de quebra-pressão', 160, 100, `<path d="M30 26 V92 H130 V26 M4 40 H40 V48 M130 84 H156"/><path d="M24 20 H136" stroke-width="3.5"/><path d="M40 48 L64 58 M112 20 V8 Q112 4 118 4 Q124 4 124 10" stroke-width="2"/><circle cx="70" cy="58" r="6"/>${lv(30, 130, 60)}`],
      ['hd-rede-ramificada', 'Rede ramificada (planta)', 200, 120, `<rect x="4" y="46" width="24" height="24" rx="2"/><path d="M28 58 H190" stroke-width="3"/><path d="M60 58 V14 M60 58 V102 M110 58 V20 M110 58 V96 M160 58 V28 M160 58 V88" stroke-width="2"/><path d="M54 14 H66 M54 102 H66 M104 20 H116 M104 96 H116 M154 28 H166 M154 88 H166 M190 52 V64"/>${[60, 110, 160].map(x => `<circle cx="${x}" cy="58" r="3.5" fill="#C"/>`).join('')}` + T(16, 58, 'R', 12)],
      ['hd-rede-malhada', 'Rede malhada (planta)', 200, 130, `<rect x="4" y="53" width="24" height="24" rx="2"/><path d="M28 65 H40"/><path d="M40 16 H180 V114 H40 Z M110 16 V114 M40 65 H180"/>${[40, 110, 180].map(x => [16, 65, 114].map(y => `<circle cx="${x}" cy="${y}" r="3.5" fill="#C"/>`).join('')).join('')}` + T(16, 65, 'R', 12)],
    ]],
    ['Instalações prediais', [
      ['hd-inspecao', 'Caixa de inspeção', 90, 90, '<rect x="8" y="8" width="74" height="74"/><path d="M8 8 L82 82 M82 8 L8 82" stroke-width="1.6"/>'],
      ['hd-gordura', 'Caixa de gordura', 110, 90, `<path d="M14 16 V86 H96 V16 M4 34 H14 M96 40 H106 M84 40 H96"/><path d="M10 12 H100" stroke-width="3.5"/><path d="M84 30 V62" stroke-width="2"/><path d="M14 40 H84" ${dash}/>`],
      ['hd-sifonada', 'Caixa sifonada', 80, 80, `<circle cx="40" cy="40" r="32"/><circle cx="40" cy="40" r="25" ${tn}/>` + T(40, 40, 'CS', 18)],
      ['hd-ralo', 'Ralo', 80, 80, '<circle cx="40" cy="40" r="32"/><path d="M18 30 H62 M14 40 H66 M18 50 H62" stroke-width="1.6"/>'],
      ['hd-fossa', 'Fossa séptica', 160, 90, `<rect x="14" y="14" width="132" height="70" rx="2"/><path d="M4 30 H24 M24 22 V50 M136 34 H156 M136 26 V54"/><path d="M24 36 H136" ${dash}/><path d="${wave(14, 146, 72, 3, 22)}" ${tn}/>`],
      ['hd-sumidouro', 'Sumidouro', 100, 120, `<path d="M14 20 H86 M4 30 H20"/><path d="M20 20 V112 M80 20 V112" stroke-dasharray="8 5"/>${stones(24, 76, 98, 110)}`],
      ['hd-chuveiro', 'Chuveiro', 80, 100, `<path d="M10 4 V20 H40 V30 M26 30 H54 L48 40 H32 Z"/><path d="M33 46 L25 92 M40 46 V92 M47 46 L55 92" stroke-dasharray="6 6" ${tn}/>`],
      ['hd-pia', 'Pia', 120, 80, `<rect x="4" y="8" width="112" height="68" rx="3"/><rect x="18" y="18" width="58" height="50" rx="8"/><circle cx="47" cy="43" r="4"/><path d="M47 8 V16" stroke-width="3"/><path d="M88 20 V64 M98 20 V64 M108 20 V64" ${tn}/>`],
      ['hd-bacia', 'Bacia sanitária', 80, 110, `<rect x="10" y="4" width="60" height="22" rx="3"/><ellipse cx="40" cy="66" rx="26" ry="38"/><ellipse cx="40" cy="68" rx="16" ry="26" ${tn}/>`],
      ['hd-torneira', 'Torneira', 90, 80, `<path d="M4 30 H30 M41 22 V10 M32 10 H50 M52 26 H72 Q84 26 84 38 V50 M52 34 H70 Q76 34 76 40 V50"/><rect x="30" y="22" width="22" height="16" rx="2"/><path d="M80 56 V74" stroke-dasharray="4 4" ${tn}/>`],
    ]],
  ],
};
