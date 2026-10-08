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
    ]],
    ['Reservação e captação', [
      ['hd-elevado', 'Reservatório elevado', 120, 170, '<rect x="20" y="8" width="80" height="60" rx="4"/><path d="M20 30 H100" stroke-dasharray="8 6" stroke-width="1.6"/><path d="M34 68 L20 166 M86 68 L100 166 M27 118 H93 M30 100 L90 140 M90 100 L30 140" stroke-width="1.8"/>'],
      ['hd-apoiado', 'Reservatório apoiado', 140, 110, `<path d="M20 96 V26 Q70 6 120 26 V96 M4 96 H136"/><path d="M20 46 H120" ${dash}/><path d="${[16, 28, 40, 52, 64, 76, 88, 100, 112, 124, 136].map(x => `M${x} 96 L${x - 6} 104`).join('')}" ${tn}/>`],
      ['hd-enterrado', 'Reservatório enterrado', 140, 110, `<path d="M4 24 H60 M80 24 H136 M60 32 V16 M80 32 V16"/><path d="M56 16 H84" stroke-width="3.5"/><rect x="20" y="32" width="100" height="72" rx="2"/><path d="M20 52 H120" ${dash}/><path d="${[10, 22, 34, 46, 94, 106, 118, 130].map(x => `M${x} 24 L${x + 6} 16`).join('')}" ${tn}/>`],
      ['hd-caixa', "Caixa d'água", 140, 100, '<path d="M10 20 H130 L120 94 H20 Z"/><path d="M16 46 H124" stroke-dasharray="8 6" stroke-width="1.6"/><path d="M4 20 H136"/>'],
      ['hd-poco', 'Poço', 100, 170, '<path d="M4 20 H34 V166 H66 V20 H96"/><path d="M34 70 H66" stroke-dasharray="6 5" stroke-width="1.6"/><path d="M50 4 V150"/><rect x="42" y="140" width="16" height="22" fill="#C"/>'],
      ['hd-captacao', "Tomada d'água (captação)", 160, 100, `<path d="M4 92 Q40 98 64 88 L70.6 74 M76.2 62 L96 20 H156 M34 62 H150 M34 74 H150"/><path d="M4 30 H90" ${dash}/><path d="M34 52 V84" stroke-width="3.5"/>`],
      ['hd-cisterna', 'Cisterna', 150, 130, `<path d="M6 44 L46 14 L86 44 Z M14 44 V112 M78 44 V112 M4 112 H104 M144 112 H146 M86 44 H96 V60 H124 V70"/><rect x="104" y="70" width="40" height="56" rx="2"/><path d="M104 92 H144" ${dash}/>`],
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
