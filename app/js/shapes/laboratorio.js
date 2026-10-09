// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
import { T, head } from './base.js';

// Laboratório de água e esgoto (Engenharia Ambiental e Sanitária): vidrarias, aquecimento, equipamentos,
// amostragem de campo e segurança. Desenhos próprios do Giz Livre; pictogramas GHS simplificados.
// prefixo dos ids: 'lb-'

const liq = (x1, x2, y) => `<path d="M${x1},${y} H${x2}" stroke-width="1.5" stroke-dasharray="5 4"/>`; // nível de líquido
const fino = (d, w = 1.6) => `<path d="${d}" stroke-width="${w}"/>`;
const dot = (x, y, r = 2.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#C" stroke="none"/>`;
// marcas de graduação: x0 = parede, dir = +1 (para a direita) ou -1; a cada `passo`, uma marca longa a cada 5
const grad = (x0, y0, y1, passo, curta, longa, dir = 1) => {
  let d = '';
  for (let y = y0, i = 0; y <= y1; y += passo, i++) d += `M${x0},${y} h${dir * (i % 5 === 0 ? longa : curta)} `;
  return fino(d, 1.3);
};

// medidor de bancada com eletrodo mergulhado num béquer (pHmetro, condutivímetro, oxímetro)
const medidor = (id, nome, valor, unid, sonda) => [id, nome, 140, 130,
  `<rect x="6" y="50" width="72" height="74" rx="6"/><rect x="15" y="59" width="54" height="30" rx="2" stroke-width="1.8"/>`
  + T(42, 74, valor, 15) + T(42, 103, unid, 11)
  + `<rect x="18" y="112" width="12" height="6" rx="2" stroke-width="1.4"/><rect x="36" y="112" width="12" height="6" rx="2" stroke-width="1.4"/><rect x="54" y="112" width="12" height="6" rx="2" stroke-width="1.4"/>`
  + `<path d="M42,50 C42,14 108,2 108,16" stroke-width="1.8"/>`
  + `<path d="M86,72 V118 Q86,124 92,124 H124 Q130,124 130,118 V72"/>` + liq(88, 128, 86) + sonda];

const DIA = '<path d="M50,4 L96,50 L50,96 L4,50 Z" stroke-width="3"/>'; // losango GHS

// garrafa de DBO pequena (para a incubadora), base em (x, y)
const garrafinha = (x, y) => `<path d="M${x - 7},${y} V${y - 15} Q${x - 7},${y - 20} ${x - 3},${y - 21} V${y - 26} H${x + 3} V${y - 21} Q${x + 7},${y - 20} ${x + 7},${y - 15} V${y} Z" stroke-width="1.6"/>`;

const jarros = () => {
  let s = '';
  for (let i = 0; i < 6; i++) {
    const x = 12 + 38 * i, c = x + 15;
    s += `<path d="M${x},58 V134 H${x + 30} V58"/>` + liq(x + 2, x + 28, 70)
      + `<path d="M${c},30 V116" stroke-width="1.8"/><rect x="${c - 8}" y="114" width="16" height="8" rx="1" fill="#C" stroke="none"/>`;
  }
  return s;
};

// ===== Mais formas: vidrarias que faltavam, montagens clássicas, análise de água, campo e segurança =====
const serie = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join(' ');
// estrela de n pontas (raios R e r) centrada em (cx, cy)
const estrela = (cx, cy, R, r, n) => 'M' + Array.from({ length: 2 * n }, (_, i) => {
  const a = (i * 180 / n - 90) * Math.PI / 180, q = i % 2 ? r : R;
  return `${(cx + q * Math.cos(a)).toFixed(1)} ${(cy + q * Math.sin(a)).toFixed(1)}`;
}).join(' L') + ' Z';

const VIDR2 = [
  ['lb-termometro', 'Termômetro', 30, 170, '<path d="M11 141 V12 Q11 6 15 6 Q19 6 19 12 V141"/><circle cx="15" cy="150" r="10"/>' + dot(15, 150, 6) + fino('M15 146 V64', 2.4) + grad(19, 24, 132, 9, 4, 7)],
  ['lb-balao-destilacao', 'Balão de destilação', 110, 104, '<path d="M30 6 H50 M33 6 V37 A30 30 0 1 0 47 37 V25 L96 51 L100 44 L47 16 V6"/>' + liq(12, 68, 74)],
  ['lb-kjeldahl', 'Balão de Kjeldahl', 70, 170, '<path d="M27 6 H43 M30 6 V96 C12 104 8 140 22 154 Q35 164 48 154 C62 140 58 104 40 96 V6"/>' + liq(15, 55, 134)],
  ['lb-picnometro', 'Picnômetro', 70, 110, '<path d="M14 50 Q14 34 28 30 V22 H42 V30 Q56 34 56 50 V96 Q56 104 48 104 H22 Q14 104 14 96 Z M29 22 L31 6 H39 L41 22"/>' + fino('M35 7 V30', 1.2) + liq(16, 54, 44)],
  ['lb-densimetro', 'Densímetro na proveta', 70, 170, '<path d="M14 6 V156 M56 6 V156 M6 156 H64 V164 H6 Z"/>' + liq(15, 55, 50)
    + '<path d="M32 80 V18 Q35 13 38 18 V80 Q46 84 46 96 V124 Q46 132 35 138 Q24 132 24 124 V96 Q24 84 32 80 Z" stroke-width="2"/>' + dot(35, 128, 4) + fino('M32 30 h3 M32 40 h4 M32 50 h3 M32 60 h4', 1.2)],
  ['lb-thiele', 'Tubo de Thiele', 110, 160, '<path d="M30 10 V140 Q30 154 44 154 H86 Q98 154 98 140 V132 L44 52 V10 M44 81 V140 H84 Z"/>' + fino('M37 2 V122', 1.6) + dot(37, 124, 3) + liq(31, 43, 30)],
  ['lb-nessler', 'Tubo de Nessler', 36, 170, '<path d="M8 6 H28 M10 6 V160 H26 V6"/>' + fino('M10 46 H26', 1.8) + liq(11, 25, 52)],
  ['lb-gooch', 'Cadinho de Gooch', 80, 84, '<ellipse cx="40" cy="14" rx="28" ry="6"/><path d="M12 14 L20 66 H60 L68 14"/>' + fino('M22 58 H58', 1.6)
    + dot(30, 66, 2) + dot(40, 66, 2) + dot(50, 66, 2) + dot(34, 76, 1.8) + dot(46, 78, 1.8)],
  ['lb-pera', 'Pera de borracha (pipetador)', 70, 150, '<rect x="29" y="8" width="12" height="10" rx="2"/><path d="M35 18 V20"/><circle cx="35" cy="46" r="26"/><rect x="28" y="72" width="14" height="18" rx="2"/>'
    + '<path d="M42 84 H54"/><rect x="54" y="78" width="12" height="12" rx="2"/><path d="M31 90 V138 Q35 144 39 138 V90"/>' + T(35, 13, 'A', 8) + T(35, 81, 'S', 9) + T(60, 84, 'E', 8)],
  ['lb-falcon', 'Tubo cônico (Falcon)', 40, 150, '<rect x="8" y="6" width="24" height="14" rx="2"/><path d="M10 20 V112 L18 140 H22 L30 112 V20"/>' + grad(30, 40, 108, 6, -4, -7) + liq(11, 29, 60)],
  ['lb-drechsel', 'Frasco lavador de gases', 100, 140, '<path d="M16 40 V126 Q16 134 24 134 H76 Q84 134 84 126 V40 M22 40 V30 H78 V40 M12 40 H88"/><path d="M36 4 V120 M44 4 V120 M64 30 V14 H96"/>'
    + liq(18, 82, 70) + '<g stroke-width="1.3"><circle cx="40" cy="112" r="3"/><circle cx="50" cy="98" r="3"/><circle cx="34" cy="88" r="3"/></g>'],
  ['lb-estante', 'Estante com tubos de ensaio', 180, 120, '<rect x="10" y="40" width="160" height="8" rx="2"/><rect x="10" y="106" width="160" height="8" rx="2"/><path d="M16 48 V106 M164 48 V106"/>'
    + serie(6, i => { const x = 30 + 24 * i; return `<path d="M${x - 7} 16 V96 A7 7 0 0 0 ${x + 7} 96 V16"/>` + liq(x - 6, x + 6, 60 + (i % 3) * 10); })],
  ['lb-conta-gotas', 'Conta-gotas', 30, 132, '<path d="M9 30 V14 Q9 4 15 4 Q21 4 21 14 V30 Z M11 30 V104 L14 116 H16 L19 104 V30"/><path d="M15 120 Q11 126 15 129 Q19 126 15 120 Z" fill="#C"/>'],
  ['lb-seringa', 'Seringa', 180, 50, '<rect x="40" y="14" width="110" height="22" rx="2"/><path d="M40 6 V44" stroke-width="3"/><path d="M4 25 H92 M4 15 V35"/><path d="M92 16 V34" stroke-width="4"/>'
    + '<path d="M150 21 L160 23 V27 L150 29 M160 25 H176"/>' + fino(serie(8, i => `M${104 + 6 * i} 14 v${i % 4 === 0 ? 8 : 5}`), 1.2)],
  ['lb-schott', 'Frasco reagente (Schott)', 70, 120, '<rect x="24" y="6" width="22" height="14" rx="2"/><path d="M27 20 V28 Q12 32 12 46 V108 Q12 114 18 114 H52 Q58 114 58 108 V46 Q58 32 43 28 V20"/>'
    + grad(58, 56, 100, 11, -4, -7) + liq(14, 56, 64)],
  ['lb-durham', 'Tubo com tubo de Durham', 40, 120, '<path d="M9 6 H31 M12 6 V100 A8 8 0 0 0 28 100 V6"/>' + liq(13, 27, 36)
    + '<path d="M15 100 V74 Q15 69 20 69 Q25 69 25 74 V100" stroke-width="1.8"/><path d="M16 79 H24" stroke-width="1.2" stroke-dasharray="2 2"/>'],
  ['lb-papel-filtro', 'Papel de filtro (dobra)', 120, 70, '<circle cx="35" cy="35" r="28"/><path d="M7 35 H63 M35 7 V35" stroke-width="1.3" stroke-dasharray="4 3"/>'
    + fino('M66 35 H70', 1.6) + head(76, 35, 0, 7) + '<path d="M80 14 H114 L97 62 Z"/>' + fino('M97 14 V62', 1.3)],
];

const MONTAGENS = [
  ['lb-mont-destilacao', 'Montagem: destilação simples', 260, 200, '<rect x="14" y="128" width="80" height="52" rx="6"/>' + fino('M20 128 Q54 168 88 128', 1.6)
    + '<path d="M48 70 V99 A26 26 0 1 0 60 99 V70"/><rect x="46" y="62" width="16" height="9" rx="2"/>' + fino('M54 36 V90', 1.6) + dot(54, 92, 3) + liq(30, 78, 120)
    + '<g transform="translate(60 82) rotate(26.6)"><path d="M0 -3 H152 M0 3 H152"/><rect x="20" y="-12" width="110" height="24" rx="5"/><path d="M34 -12 V-22 M116 12 V22"/></g>'
    + '<path d="M192 146 V160 L172 188 Q170 192 174 192 H226 Q230 192 228 188 L208 160 V146"/>' + liq(178, 222, 180) + fino('M6 196 H254', 1.6)],
  ['lb-mont-titulacao', 'Montagem: titulação', 160, 220, '<rect x="10" y="204" width="140" height="10" rx="3"/><rect x="24" y="10" width="7" height="194" rx="2"/><rect x="20" y="34" width="15" height="12" rx="2"/>'
    + fino('M35 40 H74 M74 36 H86 M74 44 H86', 2)
    + '<path d="M74 14 V118 L77 122 V130 M86 14 V118 L83 122 V130 M77 130 V140 L80 150 L83 140 V130"/><circle cx="80" cy="126" r="4"/>' + fino('M66 126 H94', 1.8)
    + liq(75, 85, 30) + grad(86, 24, 112, 8, -4, -7) + dot(80, 157, 2)
    + '<path d="M70 144 H90 M72 144 V160 L50 196 Q48 202 54 202 H106 Q112 202 110 196 L88 160 V144"/>' + liq(57, 103, 184)],
  ['lb-mont-filt-vacuo', 'Montagem: filtração a vácuo', 200, 170, '<path d="M26 8 H94 V34 Q94 40 86 42 L64 50 V76 L60 82 L56 76 V50 L34 42 Q26 40 26 34 Z"/>'
    + '<path d="M28 30 H92" stroke-width="2" stroke-dasharray="4 4"/><rect x="46" y="58" width="28" height="10" rx="2"/>'
    + '<path d="M48 68 V86 L18 150 Q16 158 24 158 H96 Q104 158 102 150 L72 86 V80 M72 72 V68 M72 72 L120 68 M72 80 L120 76"/>' + liq(26, 94, 136)
    + '<path d="M120 72 C150 72 148 110 160 110" stroke-width="4"/><rect x="160" y="96" width="34" height="28" rx="4"/>' + T(177, 110, 'vácuo', 9) + fino('M10 164 H190', 1.6)],
  ['lb-mont-refluxo', 'Montagem: refluxo', 120, 240, '<rect x="20" y="190" width="80" height="44" rx="6"/>' + fino('M26 190 Q60 232 94 190', 1.6)
    + '<path d="M54 150 V175 A26 26 0 1 0 66 175 V150"/>' + liq(36, 84, 196)
    + '<path d="M56 18 V150 M64 18 V150"/><rect x="46" y="40" width="28" height="96" rx="6"/><path d="M74 124 H92 M46 52 H28"/>'
    + head(76, 124, 180, 7) + head(24, 52, 180, 7) + T(104, 124, 'água', 9) + T(20, 40, 'água', 9)],
  ['lb-mont-extracao', 'Montagem: extração (funil de separação)', 140, 220, '<rect x="8" y="206" width="124" height="8" rx="2"/><rect x="16" y="8" width="7" height="198" rx="2"/>'
    + fino('M23 70 H44', 2.2) + '<ellipse cx="70" cy="70" rx="26" ry="5" stroke-width="2"/>'
    + '<rect x="64" y="10" width="12" height="8" rx="2"/><path d="M65 18 V26 C42 42 40 70 66 100 V112 M75 18 V26 C98 42 100 70 74 100 V112"/><circle cx="70" cy="116" r="4"/>'
    + fino('M58 116 H82', 1.8) + '<path d="M67 120 V146 L70 152 M73 120 V146 L70 152"/>' + liq(49, 91, 50) + liq(52, 88, 76)
    + '<path d="M44 150 V198 Q44 202 48 202 H92 Q96 202 96 198 V150"/>' + liq(46, 94, 184)],
  ['lb-mont-filt-simples', 'Montagem: filtração simples', 140, 200, '<rect x="8" y="186" width="124" height="8" rx="2"/><rect x="16" y="8" width="7" height="178" rx="2"/>'
    + fino('M23 40 H46', 2.2) + '<ellipse cx="76" cy="40" rx="30" ry="5" stroke-width="2"/>'
    + '<path d="M44 30 L72 78 V118 L76 124 L80 118 V78 L108 30"/><path d="M52 36 L76 72 L100 36" stroke-width="1.4" stroke-dasharray="4 3"/>'
    + '<path d="M50 116 V178 Q50 182 54 182 H100 Q104 182 104 178 V116"/>' + liq(52, 102, 164) + fino('M100 4 L80 40', 3)],
  ['lb-soxhlet', 'Extrator Soxhlet', 120, 252, '<path d="M56 4 V64 M64 4 V64"/><rect x="46" y="10" width="28" height="46" rx="6"/><path d="M74 48 H90 M46 18 H30"/>'
    + '<path d="M44 64 H76 M44 64 V150 Q44 160 54 162 V172 M76 64 V150 Q76 160 66 162 V172"/>'
    + '<rect x="50" y="78" width="20" height="62" rx="3" stroke-width="1.6" stroke-dasharray="4 3"/>'
    + fino('M76 154 H88 V100 Q88 92 93 92 Q98 92 98 100 V176 H66', 1.6)
    + '<path d="M44 72 H28 V176 H54 M44 80 H36 V168 H54"/><path d="M54 172 V196 A26 26 0 1 0 66 196 V172"/>' + liq(38, 82, 230) + liq(46, 74, 118)],
  ['lb-mont-membrana', 'Filtração em membrana (coliformes)', 140, 176, '<path d="M36 10 V80 M104 10 V80 M32 10 H40 M100 10 H108"/>' + grad(104, 20, 70, 10, -5, -8) + liq(38, 102, 34)
    + '<rect x="30" y="80" width="80" height="12" rx="2"/><path d="M34 86 H106" stroke-width="2" stroke-dasharray="3 3"/>'
    + '<path d="M40 92 L60 112 V140 M100 92 L80 112 V140"/><rect x="8" y="140" width="124" height="14" rx="7"/>' + T(70, 166, 'para o vácuo →', 9)],
];

const EQUIP2 = [
  ['lb-oxitop', 'Respirômetro de DBO (OxiTop)', 80, 150, '<rect x="22" y="10" width="36" height="30" rx="4"/><rect x="28" y="16" width="24" height="12" rx="1" stroke-width="1.4"/>' + T(40, 22, 'hPa', 7)
    + '<path d="M14 70 Q14 56 28 52 V40 M52 40 V52 Q66 56 66 70 V138 Q66 144 60 144 H20 Q14 144 14 138 V70"/>'
    + '<path d="M34 52 V64 Q34 68 40 68 Q46 68 46 64 V52" stroke-width="1.4"/>' + liq(16, 64, 96) + '<rect x="32" y="134" width="16" height="5" rx="2" fill="#C" stroke="none"/>' + dot(32, 33, 1.8) + dot(48, 33, 1.8)],
  ['lb-bloco-dqo', 'Bloco digestor (DQO)', 160, 110, '<rect x="10" y="50" width="140" height="52" rx="4"/>'
    + serie(6, i => { const x = 30 + 20 * i; return `<rect x="${x - 6}" y="12" width="12" height="9" rx="2"/><path d="M${x - 5} 21 V50 M${x + 5} 21 V50"/>`; })
    + '<rect x="18" y="64" width="46" height="18" rx="2" stroke-width="1.6"/>' + T(41, 73, '150 °C', 9) + T(96, 74, 'DQO', 12) + '<circle cx="132" cy="76" r="8"/>'],
  ['lb-vortex', 'Agitador de tubos (vórtex)', 90, 120, '<path d="M14 112 L22 72 H68 L76 112 Z"/><ellipse cx="45" cy="68" rx="18" ry="5"/><path d="M36 8 H54 M38 8 V56 A7 7 0 0 0 52 56 V8"/>'
    + liq(39, 51, 40) + fino('M40 46 Q45 54 50 46', 1.2) + fino('M22 54 Q17 60 22 66 M68 54 Q73 60 68 66', 1.4) + '<circle cx="45" cy="94" r="6"/>'],
  ['lb-shaker', 'Mesa agitadora orbital', 200, 110, '<rect x="10" y="70" width="180" height="34" rx="5"/>' + fino('M14 64 H186', 3)
    + [50, 100, 150].map(c => `<path d="M${c - 6} 18 V30 L${c - 22} 58 Q${c - 23} 62 ${c - 19} 62 H${c + 19} Q${c + 23} 62 ${c + 22} 58 L${c + 6} 30 V18"/>` + liq(c - 17, c + 17, 50)).join('')
    + '<rect x="24" y="78" width="40" height="16" rx="2" stroke-width="1.6"/>' + T(44, 86, 'rpm', 9) + '<circle cx="166" cy="87" r="7"/>' + fino('M92 92 A14 5 0 1 1 108 92', 1.4) + head(111, 89, 40, 6)],
  ['lb-ultrassom', 'Banho ultrassônico', 150, 100, '<rect x="8" y="20" width="134" height="74" rx="4"/>' + liq(10, 140, 32) + fino('M8 66 H142', 1.6)
    + '<rect x="16" y="72" width="44" height="14" rx="2" stroke-width="1.6"/>' + T(38, 79, '40 kHz', 8) + '<circle cx="126" cy="79" r="6"/>'
    + fino('M63 64 A12 12 0 0 1 87 64 M55 64 A20 20 0 0 1 95 64 M47 64 A28 28 0 0 1 103 64', 1.3)],
  ['lb-peristaltica', 'Bomba peristáltica', 140, 110, '<rect x="8" y="16" width="124" height="86" rx="6"/><circle cx="56" cy="58" r="32"/>'
    + '<g stroke-width="1.8"><circle cx="56" cy="40" r="6"/><circle cx="71.6" cy="67" r="6"/><circle cx="40.4" cy="67" r="6"/></g>' + dot(56, 58, 3)
    + '<path d="M2 96 H30 V58 A26 26 0 0 1 82 58 V96 H138" stroke-width="3.5"/>' + '<rect x="96" y="28" width="30" height="16" rx="2" stroke-width="1.6"/>' + T(111, 36, 'rpm', 8)],
  ['lb-cromatografo', 'Cromatógrafo a gás', 240, 150, '<rect x="10" y="40" width="130" height="100" rx="4"/><rect x="20" y="56" width="80" height="74" rx="3"/>'
    + '<g stroke-width="1.4"><circle cx="60" cy="93" r="24"/><circle cx="60" cy="93" r="18"/><circle cx="60" cy="93" r="12"/></g>'
    + '<rect x="30" y="26" width="14" height="14"/>' + fino('M37 26 V16', 2) + '<rect x="110" y="26" width="20" height="14"/>'
    + '<rect x="108" y="60" width="26" height="30" rx="2" stroke-width="1.6"/>' + T(121, 118, 'CG', 12)
    + '<rect x="156" y="40" width="76" height="56" rx="3"/>' + fino('M162 88 H176 L180 60 L184 88 H196 L199 70 L202 88 H214 L217 52 L220 88 H228', 1.4)
    + '<path d="M194 96 V110 M178 112 H210"/>' + fino('M140 70 H156', 1.4)],
  ['lb-absorcao-atomica', 'Absorção atômica (esquema)', 250, 112, '<rect x="6" y="40" width="40" height="30" rx="12"/>'
    + '<path d="M46 55 H140 M180 55 H187" stroke-width="1.6" stroke-dasharray="6 4"/>' + head(196, 55, 0, 9)
    + '<rect x="76" y="70" width="40" height="8" rx="2"/><path d="M82 70 Q84 50 96 32 Q108 50 110 70"/>'
    + '<rect x="140" y="36" width="40" height="38" rx="2"/>' + fino('M150 66 L160 44 L170 66 Z', 1.4) + '<rect x="196" y="40" width="30" height="30" rx="2"/>' + T(211, 55, 'D', 12)
    + T(26, 90, 'lâmpada', 9) + T(96, 90, 'chama', 9) + T(160, 102, 'monocromador', 9) + T(211, 90, 'detector', 9)],
  ['lb-fluxo-laminar', 'Cabine de fluxo laminar', 150, 170, '<rect x="10" y="10" width="130" height="120" rx="3"/><rect x="18" y="18" width="114" height="16" rx="1"/>' + T(75, 26, 'HEPA', 9)
    + [45, 75, 105].map(x => fino(`M${x} 40 V66`, 1.6) + head(x, 74, 90, 7)).join('') + fino('M10 100 H140', 2)
    + '<path d="M24 130 V164 M126 130 V164 M16 164 H34 M118 164 H136"/>'],
  ['lb-rotaevaporador', 'Rotaevaporador', 220, 170, '<rect x="186" y="20" width="8" height="136" rx="2"/><rect x="170" y="156" width="44" height="8" rx="2"/>'
    + '<rect x="124" y="52" width="44" height="24" rx="4"/>' + fino('M168 64 H186', 2.2)
    + '<rect x="134" y="4" width="24" height="48" rx="5"/>' + fino('M146 8 l-6 5 l12 6 l-12 6 l12 6 l-12 6 l12 6 l-6 4', 1.4)
    + '<g transform="translate(130 72) rotate(135)"><path d="M0 -5 H44 M0 5 H44"/><circle cx="64" cy="0" r="20"/></g>'
    + '<path d="M40 118 V152 Q40 158 46 158 H124 Q130 158 130 152 V118"/>' + liq(42, 128, 128)
    + '<path d="M142 76 V86 M150 76 V86"/><circle cx="146" cy="102" r="16"/>' + liq(132, 160, 108)],
  ['lb-balanca-semi', 'Balança semianalítica', 130, 80, '<ellipse cx="65" cy="30" rx="44" ry="6"/><path d="M65 36 V44 M6 44 H124 V70 Q124 76 118 76 H12 Q6 76 6 70 Z"/>'
    + '<rect x="16" y="52" width="52" height="16" rx="2" stroke-width="1.6"/>' + T(42, 60, '0,00 g', 9) + '<circle cx="90" cy="60" r="4"/><circle cx="106" cy="60" r="4"/>'],
  ['lb-comparador-cloro', 'Comparador de cloro (disco)', 140, 110, '<rect x="28" y="6" width="14" height="34" rx="2"/><rect x="98" y="6" width="14" height="34" rx="2"/>'
    + '<rect x="10" y="30" width="120" height="74" rx="6"/><circle cx="70" cy="68" r="30"/>'
    + fino(serie(8, i => { const a = i * Math.PI / 4; return `M${(70 + 14 * Math.cos(a)).toFixed(1)} ${(68 + 14 * Math.sin(a)).toFixed(1)} L${(70 + 30 * Math.cos(a)).toFixed(1)} ${(68 + 30 * Math.sin(a)).toFixed(1)}`; }), 1.3)
    + T(70, 68, 'Cl₂', 11) + liq(30, 40, 16) + liq(100, 110, 16)],
  ['lb-cabine-uv', 'Lâmpada UV (Colilert)', 140, 110, T(70, 14, 'UV 365 nm', 11) + '<rect x="10" y="28" width="120" height="76" rx="4"/><rect x="24" y="36" width="92" height="10" rx="5"/>'
    + '<path d="M40 50 L34 72 M60 50 V72 M80 50 V72 M100 50 L106 72" stroke-width="1.4" stroke-dasharray="4 3"/>'
    + '<rect x="36" y="80" width="68" height="16" rx="2"/>' + fino('M53 80 V96 M70 80 V96 M87 80 V96', 1.2)],
];

const CAMPO2 = [
  ['lb-amostrador', 'Amostrador automático (composto)', 120, 170, '<rect x="14" y="10" width="82" height="40" rx="6"/><rect x="24" y="20" width="36" height="16" rx="2" stroke-width="1.6"/>'
    + T(42, 28, '24 h', 9) + '<circle cx="78" cy="28" r="6"/><rect x="14" y="50" width="82" height="110" rx="6"/>'
    + garrafinha(28, 150) + garrafinha(46, 150) + garrafinha(64, 150) + garrafinha(82, 150)
    + '<path d="M96 30 Q108 30 108 60 V156" stroke-width="2"/><rect x="104" y="156" width="8" height="10" rx="1" stroke-width="1.6"/>'],
  ['lb-draga', 'Draga de Petersen', 120, 140, fino('M60 4 V40', 1.6) + '<path d="M60 40 L30 70 M60 40 L90 70"/><circle cx="60" cy="70" r="4"/>'
    + '<path d="M58 70 H14 V96 Q14 132 58 132 Z M62 70 H106 V96 Q106 132 62 132 Z"/>'],
  ['lb-rede-plancton', 'Rede de plâncton', 100, 180, fino('M50 4 V22', 1.6) + '<path d="M50 22 L22 40 M50 22 L78 40"/><ellipse cx="50" cy="42" rx="30" ry="6"/><path d="M20 42 L44 150 M80 42 L56 150"/>'
    + fino('M24 60 L62.7 120 M76 60 L37.3 120 M30.7 90 L58.2 140 M69.3 90 L41.8 140', 1.1) + '<rect x="43" y="150" width="14" height="22" rx="3"/>'],
  ['lb-molinete', 'Molinete hidrométrico', 180, 100, fino('M110 4 V96', 2) + '<path d="M60 50 Q60 40 80 40 H140 Q160 44 170 50 Q160 56 140 60 H80 Q60 60 60 50 Z"/>'
    + '<path d="M58 50 L42 28 Q36 30 44 46 M58 50 L42 72 Q36 70 44 54"/><circle cx="58" cy="50" r="4"/><path d="M150 46 L164 30 M150 54 L164 70"/>'
    + fino('M4 20 Q14 14 24 20 T44 20 T64 20 T84 20 T104 20', 1.4) + fino('M6 84 H30', 1.6) + head(38, 84, 0, 8)],
];

const SEG2 = [
  ['lb-respirador', 'Respirador (PFF2)', 120, 100, '<path d="M20 40 Q60 10 100 40 Q104 76 60 92 Q16 76 20 40 Z"/><circle cx="60" cy="62" r="10"/>' + fino('M54 62 H66 M60 56 V68', 1.4)
    + '<path d="M20 44 L4 36 M100 44 L116 36 M22 62 L4 70 M98 62 L116 70" stroke-width="1.8"/>' + fino('M48 30 Q60 25 72 30', 2.4)],
  ['lb-perfurocortante', 'Coletor de perfurocortante', 100, 130, '<path d="M18 40 H82 L76 124 H24 Z M14 40 L22 24 H78 L86 40"/>' + fino('M38 32 H62', 3) + T(50, 76, 'PERFURO-', 9) + T(50, 88, 'CORTANTE', 9)],
];

const GHS2 = [
  ['lb-ghs-explosivo', 'GHS explosivo', 100, 100, DIA + '<circle cx="50" cy="58" r="9" fill="#C"/>'
    + '<path d="M50 44 V30 M60 48 L70 36 M40 48 L30 36 M64 58 H76 M36 58 H24 M60 68 L66 74 M40 68 L34 74" stroke-width="3"/>' + dot(66, 28, 2.5) + dot(34, 28, 2.5)],
  ['lb-ghs-oxidante', 'GHS oxidante (comburente)', 100, 100, DIA + '<path d="M50 22 C62 34 62 46 56 52 C54 48 46 48 44 52 C38 46 38 34 50 22 Z" fill="#C"/>'
    + '<circle cx="50" cy="63" r="9" stroke-width="3.5"/><rect x="36" y="75" width="28" height="3.5" fill="#C" stroke="none"/>'],
  ['lb-ghs-gas', 'GHS gás sob pressão', 100, 100, DIA + '<rect x="24" y="46" width="44" height="20" rx="10" fill="#C"/><rect x="68" y="51" width="6" height="10" fill="#C" stroke="none"/><path d="M74 56 H80" stroke-width="3"/>'],
  ['lb-ghs-saude', 'GHS perigo à saúde', 100, 100, DIA + '<circle cx="50" cy="28" r="7" fill="#C"/><path d="M33 76 V52 Q33 40 50 40 Q67 40 67 52 V76 Z" stroke-width="3"/>'
    + `<path d="${estrela(50, 58, 10, 4, 8)}" fill="#C" stroke="none"/>`],
  ['lb-nfpa', 'Diamante de Hommel (NFPA 704)', 120, 120, '<path d="M60 4 L116 60 L60 116 L4 60 Z" stroke-width="3"/>' + fino('M32 32 L88 88 M88 32 L32 88', 2)
    + T(60, 34, '3', 20) + T(34, 60, '2', 20) + T(86, 60, '0', 20) + T(60, 87, 'W', 15) + fino('M50 87 H70', 1.6)],
];


export default {
  id: 'lab', nome: 'Laboratório',
  secoes: [
    ['Vidrarias', [
      ['lb-bequer', 'Béquer', 70, 92, '<path d="M4,6 Q12,6 12,14 V80 Q12,86 18,86 H56 Q62,86 62,80 V10 L66,6"/>'
        + liq(13, 61, 50) + grad(61, 26, 66, 10, -6, -10)],
      ['lb-erlenmeyer', 'Erlenmeyer', 80, 100, '<path d="M29,6 H51 M32,6 V36 L8,86 Q6,92 12,92 H68 Q74,92 72,86 L48,36 V6"/>'
        + liq(17, 63, 70) + fino('M44,56 h6 M47,64 h7 M50,72 h6', 1.3)],
      ['lb-balao-redondo', 'Balão de fundo redondo', 80, 100, '<path d="M30,6 H50 M33,6 V37 A30,30 0 1 0 47,37 V6"/>' + liq(12, 68, 74)],
      ['lb-balao-chato', 'Balão de fundo chato', 80, 100, '<path d="M30,6 H50 M33,6 V36 C14,42 8,60 12,80 Q14,92 24,92 H56 Q66,92 68,80 C72,60 66,42 47,36 V6"/>' + liq(12, 68, 72)],
      ['lb-balao-volumetrico', 'Balão volumétrico', 70, 130, '<path d="M28,6 H42 M31,6 V70 C10,76 6,96 8,112 Q9,124 20,124 H50 Q61,124 62,112 C64,96 60,76 39,70 V6"/>'
        + fino('M26,38 H44', 1.8) + liq(10, 60, 100)],
      ['lb-proveta', 'Proveta', 50, 140, '<path d="M11,6 Q16,6 16,12 V124 M34,8 V124 M6,124 H44 V132 H6 Z"/>' + liq(17, 33, 52) + grad(34, 24, 114, 9, -5, -9)],
      ['lb-tubo-ensaio', 'Tubo de ensaio', 40, 120, '<path d="M9,6 H31 M12,6 V100 A8,8 0 0 0 28,100 V6"/>' + liq(13, 27, 72)],
      ['lb-pipeta-volumetrica', 'Pipeta volumétrica', 40, 170, '<path d="M18,6 V57 C6,64 7,108 18,114 V150 L20,164 L22,150 V114 C33,108 34,64 22,57 V6"/>' + fino('M13,30 H27', 1.8)],
      ['lb-pipeta-graduada', 'Pipeta graduada', 30, 170, '<path d="M9,6 V150 L15,165 L21,150 V6"/>' + grad(21, 16, 142, 6, -4, -9)],
      ['lb-micropipeta', 'Micropipeta', 50, 170, '<rect x="19" y="4" width="12" height="10" rx="3"/><path d="M22,14 V22 M28,14 V22"/>'
        + '<rect x="12" y="22" width="26" height="78" rx="8"/><rect x="18" y="38" width="14" height="18" rx="2" stroke-width="1.6"/>'
        + T(25, 47, '100', 8) + '<path d="M12,34 Q3,36 5,46 L12,50"/><path d="M17,100 L21,130 H29 L33,100"/><path d="M21,130 L25,166 L29,130" stroke-width="1.8"/>'],
      ['lb-bureta', 'Bureta com torneira', 40, 180, '<path d="M14,6 V132 L17,136 V146 M26,6 V132 L23,136 V146 M17,146 V160 L20,172 L23,160 V146"/>'
        + '<circle cx="20" cy="141" r="5"/><path d="M4,141 H15 M25,141 H36 M4,136 V146"/>' + liq(15, 25, 28) + grad(26, 16, 126, 6, -4, -8)],
      ['lb-funil', 'Funil simples', 80, 110, '<path d="M6,8 H74 M6,8 L36,50 V98 L40,104 L44,98 V50 L74,8"/>' + `<path d="M16,13 L40,44 L64,13" stroke-width="1.4" stroke-dasharray="4 3"/>`],
      ['lb-funil-separacao', 'Funil de separação', 70, 170, '<rect x="29" y="4" width="12" height="8" rx="2"/><path d="M30,12 V22 C8,40 6,80 32,110 V123 M40,12 V22 C62,40 64,80 38,110 V123"/>'
        + '<circle cx="35" cy="128" r="5"/><path d="M20,128 H30 M40,128 H50 M32,133 V158 L35,166 M38,133 V158 L35,166"/>'
        + liq(15, 55, 62) + liq(20, 50, 86)],
      ['lb-funil-buchner', 'Funil de Büchner', 90, 110, '<path d="M8,8 H82 V40 Q82,46 74,48 L50,56 V98 L45,104 L40,98 V56 L16,48 Q8,46 8,40 Z"/>'
        + '<path d="M10,32 H80" stroke-width="2" stroke-dasharray="4 4"/>'],
      ['lb-kitassato', 'Kitassato', 100, 110, '<path d="M35,8 H55 M38,8 V36 L12,92 Q10,100 16,100 H74 Q80,100 78,92 L52,36 V24 M52,16 V8 M52,16 L96,12 M52,24 L96,20"/>' + liq(22, 68, 78)],
      ['lb-condensador-liebig', 'Condensador Liebig', 220, 64, '<path d="M6,28 H214 M6,36 H214"/><rect x="30" y="16" width="160" height="32" rx="6"/>'
        + '<path d="M46,16 V5 M54,16 V5 M166,48 V59 M174,48 V59"/>'],
      ['lb-condensador-bolas', 'Condensador de bolas', 220, 70, '<path d="M6,30 H40 A14,12 0 0 1 68,30 A14,12 0 0 1 96,30 A14,12 0 0 1 124,30 A14,12 0 0 1 152,30 A14,12 0 0 1 180,30 H214'
        + ' M6,40 H40 A14,12 0 0 0 68,40 A14,12 0 0 0 96,40 A14,12 0 0 0 124,40 A14,12 0 0 0 152,40 A14,12 0 0 0 180,40 H214"/>'
        + '<rect x="30" y="12" width="160" height="46" rx="6"/><path d="M44,12 V3 M52,12 V3 M168,58 V67 M176,58 V67"/>'],
      ['lb-vigreux', 'Coluna de Vigreux', 50, 170, '<path d="M10,6 H40 M14,6 V164 M36,6 V164 M10,164 H40"/>'
        + fino('M14,24 L22,32 M36,24 L28,32 M14,46 L22,54 M36,46 L28,54 M14,68 L22,76 M36,68 L28,76 M14,90 L22,98 M36,90 L28,98 M14,112 L22,120 M36,112 L28,120 M14,134 L22,142 M36,134 L28,142', 1.8)],
      ['lb-dessecador', 'Dessecador', 120, 120, '<rect x="52" y="12" width="16" height="12" rx="3"/><path d="M8,46 Q60,4 112,46 M4,46 H116 M4,52 H116 M10,52 V70 Q14,110 40,112 H80 Q106,110 110,70 V52"/>'
        + '<path d="M12,76 H108" stroke-width="2" stroke-dasharray="4 4"/>' + dot(36, 92) + dot(50, 98) + dot(64, 92) + dot(78, 98) + dot(90, 90) + dot(44, 104) + dot(72, 105)],
      ['lb-vidro-relogio', 'Vidro de relógio', 120, 40, '<path d="M6,10 Q60,46 114,10 M6,10 Q60,36 114,10"/>'],
      ['lb-placa-petri', 'Placa de Petri', 130, 60, '<ellipse cx="65" cy="24" rx="58" ry="14"/><path d="M7,24 V36 A58,14 0 0 0 123,36 V24"/>'
        + dot(44, 22) + dot(60, 28, 3) + dot(78, 19) + dot(88, 27, 2) + dot(52, 16, 2)],
      ['lb-cadinho', 'Cadinho com tampa', 80, 82, '<ellipse cx="40" cy="28" rx="28" ry="6"/><path d="M12,28 L22,72 Q24,76 28,76 H52 Q56,76 58,72 L68,28"/>'
        + '<path d="M8,16 Q40,4 72,16 Z"/><circle cx="40" cy="7" r="3"/>'],
      ['lb-capsula', 'Cápsula de porcelana', 120, 60, '<ellipse cx="60" cy="16" rx="54" ry="7"/><path d="M6,16 Q10,54 60,54 Q110,54 114,16 M6,14 L2,10"/>'],
      ['lb-almofariz', 'Almofariz e pistilo', 120, 110, '<ellipse cx="55" cy="50" rx="44" ry="8"/><path d="M11,50 Q14,92 55,92 Q96,92 99,50 M38,92 L34,104 H76 L72,92"/>'
        + '<g transform="translate(104,6) rotate(40)"><rect x="-6" y="0" width="12" height="60" rx="6"/></g>'],
      ['lb-bastao', 'Bastão de vidro', 30, 150, '<rect x="11" y="6" width="8" height="138" rx="4"/>'],
      ['lb-pisseta', 'Pisseta', 80, 130, '<path d="M14,50 Q14,40 24,38 H56 Q66,40 66,50 V116 Q66,124 58,124 H22 Q14,124 14,116 Z"/><rect x="30" y="26" width="20" height="12" rx="2"/>'
        + '<path d="M40,26 V14 Q40,8 34,8 L6,14"/>' + fino('M40,38 V114', 1.4) + liq(16, 64, 70)],
      ['lb-frasco-ambar', 'Frasco âmbar', 70, 110, '<rect x="24" y="6" width="22" height="8" rx="2"/><path d="M26,14 V22 L22,28 Q10,30 10,40 V100 Q10,104 14,104 H56 Q60,104 60,100 V40 Q60,30 48,28 L44,22 V14"/>'
        + '<rect x="16" y="46" width="38" height="26" rx="2" stroke-width="1.6"/>' + T(35, 59, 'âmbar', 10)
        + fino('M12,92 L24,80 M14,102 L36,80 M26,102 L48,80 M38,102 L58,82 M50,102 L58,94', 1.3)],
      ['lb-frasco-dbo', 'Frasco de DBO', 70, 120, '<path d="M14,52 Q14,40 28,36 V24 H42 V36 Q56,40 56,52 V108 Q56,114 50,114 H20 Q14,114 14,108 Z"/>'
        + '<path d="M28,24 L31,8 H39 L42,24 M22,27 Q19,20 27,17 M48,27 Q51,20 43,17"/>' + T(35, 80, 'DBO', 13)],
      ['lb-cubeta', 'Cubeta', 50, 100, '<rect x="12" y="6" width="26" height="88" rx="2"/><path d="M12,16 H38" stroke-width="1.6"/>' + liq(14, 36, 34)
        + fino('M16,40 V88 M34,40 V88', 1.2)],
      ...VIDR2,
    ]],
    ['Suportes e aquecimento', [
      ['lb-suporte-universal', 'Suporte universal com garra', 140, 180, '<rect x="6" y="164" width="128" height="12" rx="3"/><rect x="26" y="8" width="8" height="156" rx="2"/>'
        + '<rect x="22" y="58" width="16" height="18" rx="2"/><path d="M38,64 H102 M38,70 H102 M102,56 Q126,56 126,67 Q126,78 102,78 M108,62 Q118,62 118,67 Q118,72 108,72"/>'],
      ['lb-garra-mufa', 'Garra e mufa', 160, 70, '<rect x="10" y="16" width="30" height="38" rx="3"/><circle cx="25" cy="35" r="6"/><path d="M25,16 V6 M18,6 H32 M10,35 H3"/>'
        + '<path d="M40,31 H110 M40,39 H110 M110,31 Q132,10 154,22 M110,39 Q132,60 154,48 M126,19 V9 M120,9 H132"/>' + fino('M138,20 Q146,24 150,30 M138,50 Q146,46 150,40', 3)],
      ['lb-tripe', 'Tripé com tela', 130, 110, '<rect x="8" y="14" width="114" height="8" rx="1"/><rect x="45" y="14" width="40" height="8" fill="#C" stroke="none"/>'
        + fino('M16,14 V22 M24,14 V22 M32,14 V22 M40,14 V22 M90,14 V22 M98,14 V22 M106,14 V22 M114,14 V22', 1.2)
        + '<path d="M22,22 L10,104 M108,22 L120,104 M65,22 V100"/>'],
      ['lb-bico-bunsen', 'Bico de Bunsen', 80, 140, '<path d="M10,132 H70 L64,118 H16 Z"/><rect x="32" y="50" width="16" height="68"/><rect x="29" y="92" width="22" height="14" rx="2"/>'
        + '<circle cx="40" cy="99" r="3"/><path d="M51,108 H76 M51,114 H76"/>'
        + '<path d="M40,6 C54,22 52,40 40,48 C28,40 26,22 40,6 Z"/>' + fino('M40,22 C46,32 44,42 40,46 C36,42 34,32 40,22 Z')],
      ['lb-chapa', 'Chapa aquecedora', 140, 80, '<rect x="14" y="20" width="112" height="10" rx="2"/><rect x="6" y="30" width="128" height="42" rx="4"/>'
        + '<circle cx="30" cy="52" r="8"/><path d="M30,52 V45"/><circle cx="110" cy="52" r="8"/><path d="M110,52 L115,47"/>' + dot(70, 52, 3.5)
        + fino('M54,16 Q50,12 54,8 Q58,4 54,2 M70,16 Q66,12 70,8 Q74,4 70,2 M86,16 Q82,12 86,8 Q90,4 86,2')],
      ['lb-manta', 'Manta aquecedora', 120, 100, '<path d="M8,30 H112 V82 Q112,94 100,94 H20 Q8,94 8,82 Z"/><path d="M18,30 Q20,70 60,72 Q100,70 102,30" stroke-width="1.8"/>'
        + '<circle cx="24" cy="84" r="5"/>' + dot(96, 84, 3) + fino('M48,12 Q44,8 48,4 M60,14 Q56,10 60,6 M72,12 Q68,8 72,4')],
      ['lb-banho-maria', 'Banho-maria', 150, 90, '<rect x="6" y="22" width="138" height="62" rx="4"/>' + liq(8, 142, 34)
        + '<path d="M60,6 V50 A6,6 0 0 0 72,50 V6 M88,6 V50 A6,6 0 0 0 100,50 V6"/>'
        + '<rect x="14" y="60" width="32" height="16" rx="2" stroke-width="1.6"/>' + T(30, 68, '37 °C', 9) + '<circle cx="128" cy="68" r="7"/>'],
      ['lb-agitador', 'Agitador magnético', 120, 110, '<rect x="6" y="66" width="108" height="40" rx="4"/><circle cx="28" cy="86" r="7"/><circle cx="92" cy="86" r="7"/>'
        + '<path d="M30,18 V60 Q30,64 34,64 H86 Q90,64 90,60 V18"/>' + fino('M32,30 Q60,48 88,30') + '<rect x="50" y="55" width="20" height="6" rx="3" fill="#C" stroke="none"/>'
        + fino('M48,44 Q60,50 72,44', 1.4)],
      ['lb-pinca', 'Pinça', 160, 50, '<path d="M6,25 C30,18 110,6 144,6 L154,20 M6,25 C30,32 110,44 144,44 L154,30"/>' + fino('M70,12 l2,6 M80,11 l2,6 M90,10 l2,6 M70,38 l2,-6 M80,39 l2,-6 M90,40 l2,-6', 1.3)],
      ['lb-espatula', 'Espátula', 170, 30, '<rect x="6" y="9" width="64" height="12" rx="5"/><path d="M70,12 H140 Q162,7 164,15 Q162,23 140,18 H70"/>'],
    ]],
    ['Montagens clássicas', MONTAGENS],
    ['Equipamentos', [
      ['lb-balanca', 'Balança analítica', 140, 130, '<rect x="16" y="10" width="108" height="90" rx="3"/>' + fino('M70,10 V100', 1.4) + fino('M26,22 L40,36 M30,40 L48,22 M96,22 L110,36', 1.2)
        + '<path d="M44,86 H96 M70,86 V100"/><rect x="6" y="100" width="128" height="24" rx="4"/><rect x="38" y="105" width="64" height="14" rx="2" stroke-width="1.6"/>' + T(70, 112, '0,0000 g', 10)],
      medidor('lb-phmetro', 'pHmetro', '7,00', 'pH', '<rect x="103" y="16" width="10" height="74" rx="4"/><circle cx="108" cy="95" r="6"/>'),
      medidor('lb-condutivimetro', 'Condutivímetro', '1413', 'µS/cm', '<rect x="102" y="16" width="12" height="86" rx="3"/>' + fino('M102,88 H114 M102,95 H114')),
      ['lb-turbidimetro', 'Turbidímetro', 130, 100, '<rect x="6" y="30" width="118" height="64" rx="6"/><rect x="16" y="42" width="54" height="30" rx="2" stroke-width="1.8"/>'
        + T(43, 57, '5,2', 15) + T(43, 84, 'NTU', 11) + '<rect x="88" y="6" width="18" height="34" rx="2"/><path d="M88,12 H106" stroke-width="1.6"/>'
        + '<ellipse cx="97" cy="42" rx="16" ry="5" stroke-width="1.6"/><circle cx="88" cy="74" r="5"/><circle cx="108" cy="74" r="5"/>'],
      medidor('lb-oximetro', 'Oxímetro (OD)', '8,2', 'mg/L OD', '<rect x="102" y="16" width="12" height="80" rx="3"/><path d="M101,96 H115 V102 H101 Z" fill="#C"/>'),
      ['lb-espectrofotometro', 'Espectrofotômetro', 180, 100, '<rect x="6" y="24" width="168" height="70" rx="6"/><rect x="110" y="12" width="52" height="12" rx="3"/>'
        + '<rect x="18" y="36" width="64" height="32" rx="2" stroke-width="1.8"/>' + fino('M22,62 Q34,40 44,52 T78,44', 1.4) + T(50, 80, '600 nm', 10)
        + dot(102, 44) + dot(114, 44) + dot(126, 44) + dot(102, 56) + dot(114, 56) + dot(126, 56) + dot(102, 68) + dot(114, 68) + dot(126, 68)
        + '<rect x="142" y="40" width="20" height="40" rx="2" stroke-width="1.6"/>'],
      ['lb-colorimetro', 'Colorímetro', 120, 100, '<rect x="30" y="20" width="60" height="76" rx="10"/><rect x="40" y="30" width="40" height="22" rx="2" stroke-width="1.6"/>' + T(60, 41, '0,35', 11)
        + '<circle cx="60" cy="72" r="11"/><rect x="54" y="6" width="12" height="18" rx="1" stroke-width="1.6"/>' + dot(42, 86) + dot(78, 86)],
      ['lb-estufa', 'Estufa', 130, 130, '<rect x="6" y="6" width="118" height="112" rx="4"/><rect x="14" y="14" width="82" height="96" rx="2"/><rect x="24" y="24" width="56" height="76" rx="2" stroke-width="1.6"/>'
        + fino('M26,50 H78 M26,76 H78', 1.4) + '<path d="M88,48 V76"/><rect x="101" y="18" width="18" height="14" rx="2" stroke-width="1.6"/>' + T(110, 25, '°C', 8)
        + '<circle cx="110" cy="48" r="6"/><path d="M14,118 V124 M116,118 V124"/>'],
      ['lb-mufla', 'Forno mufla', 130, 120, '<rect x="6" y="10" width="118" height="98" rx="4"/><rect x="16" y="22" width="64" height="74" rx="2"/><rect x="26" y="32" width="44" height="54" rx="1" stroke-width="1.6" stroke-dasharray="5 3"/>'
        + fino('M32,74 l6,-10 l6,10 l6,-10 l6,10 l6,-10', 1.6) + '<rect x="88" y="22" width="30" height="16" rx="2" stroke-width="1.6"/>' + T(103, 30, '550', 10)
        + '<circle cx="103" cy="58" r="7"/><path d="M103,58 V52 M14,108 V114 M116,108 V114"/>'],
      ['lb-autoclave', 'Autoclave', 110, 140, '<ellipse cx="55" cy="32" rx="41" ry="10"/><path d="M14,32 V120 Q14,130 24,130 H86 Q96,130 96,120 V32"/>'
        + '<path d="M36,23 V12 M30,12 H42"/><circle cx="76" cy="12" r="8"/><path d="M76,12 L80,7" stroke-width="1.6"/><path d="M76,20 V23"/>'
        + '<rect x="34" y="66" width="42" height="18" rx="2" stroke-width="1.6"/>' + T(55, 75, '121 °C', 10) + '<path d="M22,130 V136 M88,130 V136"/>'],
      ['lb-capela', 'Capela de exaustão', 140, 170, '<rect x="56" y="4" width="28" height="26"/>' + '<path d="M70,26 V14"/>' + head(70, 8, -90, 8)
        + '<rect x="10" y="30" width="120" height="130" rx="2"/><rect x="20" y="40" width="100" height="70" rx="1"/><path d="M20,80 H120 M14,110 H126" stroke-width="1.8"/>'
        + fino('M60,94 H46 M100,94 H86', 1.4) + head(40, 94, 180, 7) + head(80, 94, 180, 7)
        + '<rect x="20" y="118" width="48" height="34" rx="1"/><rect x="72" y="118" width="48" height="34" rx="1"/><path d="M60,130 V140 M80,130 V140"/>'],
      ['lb-centrifuga', 'Centrífuga de bancada', 140, 110, '<path d="M8,50 Q8,40 18,38 H122 Q132,40 132,50 V96 Q132,102 126,102 H14 Q8,102 8,96 Z M18,38 Q70,8 122,38"/>'
        + fino('M48,32 Q70,18 92,30') + head(94, 31, 30, 7) + '<rect x="20" y="62" width="40" height="20" rx="2" stroke-width="1.6"/>' + T(40, 72, 'rpm', 10) + '<circle cx="110" cy="72" r="8"/>'],
      ['lb-jarteste', 'Jarteste', 240, 150, '<rect x="6" y="6" width="228" height="24" rx="3"/><rect x="18" y="11" width="40" height="14" rx="2" stroke-width="1.6"/>' + T(38, 18, 'rpm', 9)
        + jarros() + '<rect x="6" y="134" width="228" height="10" rx="2"/>'],
      ['lb-cone-imhoff', 'Cone Imhoff', 70, 170, '<path d="M8,10 H62 L35,152 Z"/><path d="M30.8,130 L39.2,130 L35,152 Z" fill="#C" stroke="none"/>' + liq(12, 58, 24)
        + fino('M45,60 H52 M41,90 H47 M37,115 H42', 1.3)
        + '<path d="M12,46 H58 M16,46 L8,166 M54,46 L62,166"/>'],
      ['lb-incubadora-dbo', 'Incubadora de DBO', 120, 150, '<rect x="10" y="6" width="100" height="134" rx="4"/><rect x="30" y="11" width="40" height="13" rx="2" stroke-width="1.6"/>' + T(50, 17.5, '20 °C', 9)
        + '<rect x="18" y="30" width="84" height="102" rx="2"/><path d="M18,64 H102 M18,98 H102" stroke-width="1.8"/>'
        + garrafinha(36, 64) + garrafinha(60, 64) + garrafinha(84, 64) + garrafinha(36, 98) + garrafinha(60, 98) + garrafinha(84, 98)
        + garrafinha(36, 131) + garrafinha(60, 131) + garrafinha(84, 131) + '<path d="M96,40 V54"/>'],
      ['lb-destilador', 'Destilador de água', 150, 130, '<rect x="16" y="34" width="44" height="80" rx="4"/>' + liq(18, 58, 54) + fino('M22,104 l6,-8 l6,8 l6,-8 l6,8 l6,-8', 1.6)
        + '<path d="M38,34 V14 H108 V24"/><rect x="92" y="24" width="32" height="56" rx="3"/>' + fino('M108,24 l-10,6 l20,6 l-20,6 l20,6 l-20,6 l20,6 l-10,6 V80', 1.6)
        + '<path d="M108,80 V90"/>' + dot(108, 96, 2.5) + '<path d="M96,102 V122 Q96,126 100,126 H116 Q120,126 120,122 V102"/><path d="M10,114 H66"/>'],
      ['lb-deionizador', 'Deionizador', 120, 150, '<rect x="14" y="20" width="30" height="110" rx="8"/><rect x="64" y="20" width="30" height="110" rx="8"/>'
        + T(29, 72, 'H⁺', 13) + T(79, 72, 'OH⁻', 12) + '<path d="M29,20 V10 H79 V20 M2,120 H14 M94,120 H112 V130 M106,130 H118"/>' + head(14, 120, 0, 8)
        + fino('M18,96 H40 M18,104 H40 M18,112 H40 M68,96 H90 M68,104 H90 M68,112 H90', 1.2)],
      ['lb-microscopio', 'Microscópio', 110, 150, '<path d="M14,142 H96 L90,126 H20 Z"/><rect x="70" y="60" width="12" height="66" rx="2"/>'
        + '<path d="M70,64 Q62,46 50,40 M82,64 Q78,34 50,30"/><rect x="34" y="24" width="16" height="46"/><rect x="36" y="6" width="12" height="18" rx="1"/>'
        + '<path d="M30,70 H54 L50,78 H34 Z"/><rect x="38" y="78" width="8" height="12" rx="1"/><rect x="16" y="94" width="66" height="6" rx="1"/>'
        + '<rect x="37" y="100" width="10" height="8"/><circle cx="42" cy="116" r="4"/><circle cx="88" cy="88" r="6"/>'],
      ['lb-bomba-vacuo', 'Bomba de vácuo', 140, 90, '<rect x="50" y="20" width="80" height="56" rx="8"/>' + fino('M62,26 V70 M74,26 V70 M86,26 V70 M98,26 V70 M110,26 V70 M120,28 V68', 1.4)
        + '<rect x="14" y="28" width="36" height="42" rx="4"/><circle cx="32" cy="14" r="9"/><path d="M32,14 L37,9" stroke-width="1.6"/><path d="M32,23 V28 M14,49 H4"/>'
        + '<rect x="12" y="76" width="122" height="8" rx="2"/>'],
      ['lb-contador-colonias', 'Contador de colônias', 140, 110, '<path d="M8,70 H132 L124,104 H16 Z"/><ellipse cx="66" cy="60" rx="44" ry="11"/>'
        + dot(48, 58, 2) + dot(60, 63, 2) + dot(74, 56, 2) + dot(84, 62, 2) + dot(56, 54, 2) + dot(70, 66, 2)
        + '<path d="M120,70 V22 H96"/><ellipse cx="70" cy="22" rx="26" ry="8"/><rect x="88" y="80" width="30" height="16" rx="2" stroke-width="1.6"/>' + T(103, 88, '123', 10)],
      ...EQUIP2,
    ]],
    ['Amostragem e campo', [
      ['lb-van-dorn', 'Garrafa de Van Dorn', 80, 170, '<path d="M40,2 V30"/><rect x="34" y="12" width="12" height="10" rx="1" fill="#C" stroke="none"/>'
        + '<path d="M14,40 Q40,22 66,40 M14,140 Q40,158 66,140"/><rect x="18" y="40" width="44" height="100" rx="3"/>'
        + '<path d="M40,32 V148" stroke-width="1.4" stroke-dasharray="5 4"/><path d="M62,120 H72 V128"/>'],
      ['lb-disco-secchi', 'Disco de Secchi', 120, 150, fino('M4,40 Q14,34 24,40 T44,40 T64,40 T84,40 T104,40 T116,38') + '<path d="M60,6 V110"/>'
        + fino('M56,20 H64 M56,60 H64 M56,80 H64 M56,100 H64')
        + '<ellipse cx="60" cy="110" rx="50" ry="14"/><path d="M60,110 L110,110 A50,14 0 0 0 60,96 Z M60,110 L10,110 A50,14 0 0 0 60,124 Z" fill="#C"/>'
        + '<path d="M60,124 V134"/><rect x="54" y="134" width="12" height="12" rx="2" fill="#C"/>'],
      ['lb-frasco-coleta', 'Frasco de coleta', 70, 120, '<rect x="16" y="6" width="38" height="16" rx="2"/>' + fino('M24,8 V20 M32,8 V20 M40,8 V20 M48,8 V20', 1.3)
        + '<path d="M18,22 V30 M52,22 V30"/><rect x="10" y="30" width="50" height="84" rx="8"/><rect x="16" y="52" width="38" height="36" rx="2" stroke-width="1.6"/>'
        + fino('M20,62 H50 M20,70 H50 M20,78 H40', 1.2)],
      ['lb-caixa-termica', 'Caixa térmica', 140, 110, '<path d="M44,28 V16 Q44,12 48,12 H92 Q96,12 96,16 V28"/><rect x="6" y="28" width="128" height="12" rx="3"/>'
        + '<path d="M10,40 H130 V98 Q130,104 124,104 H16 Q10,104 10,98 Z"/><path d="M70,57 V87 M57,64.5 L83,79.5 M57,79.5 L83,64.5" stroke-width="2"/>'],
      ['lb-sonda-multi', 'Sonda multiparâmetro', 120, 170, '<rect x="6" y="10" width="50" height="80" rx="8"/><rect x="13" y="18" width="36" height="40" rx="2" stroke-width="1.6"/>'
        + T(31, 26, 'pH 7,1', 8) + T(31, 38, 'OD 6,8', 8) + T(31, 50, 'T 25°', 8) + dot(20, 74) + dot(31, 74) + dot(42, 74)
        + '<path d="M31,90 Q31,110 50,110 Q70,110 70,60 Q70,30 92,30 V40" stroke-width="1.8"/>'
        + '<rect x="82" y="40" width="20" height="92" rx="4"/><rect x="80" y="132" width="24" height="32" rx="2"/>' + fino('M86,136 V160 M92,136 V160 M98,136 V160', 1.4)],
      ...CAMPO2,
    ]],
    ['Segurança (EPI e emergência)', [
      ['lb-oculos', 'Óculos de proteção', 140, 60, '<path d="M14,20 Q14,10 26,10 H114 Q126,10 126,20 V38 Q126,50 114,50 H88 Q80,50 76,42 Q70,34 64,42 Q60,50 52,50 H26 Q14,50 14,38 Z"/>'
        + '<path d="M14,28 H3 M126,28 H137"/>' + dot(40, 16, 1.8) + dot(50, 16, 1.8) + dot(90, 16, 1.8) + dot(100, 16, 1.8)],
      ['lb-luva', 'Luva', 90, 130, '<path d="M28,104 V84 L14,68 Q8,60 14,56 Q19,53 24,60 L28,64 V34 Q28,28 33.5,28 Q39,28 39,34 V54 Q40,56 41,54 V24 Q41,18 46.5,18 Q52,18 52,24 V54 Q53,56 54,54 V28 Q54,22 59.5,22 Q65,22 65,28 V56 Q66,58 67,56 V42 Q67,36 71.5,36 Q76,36 76,42 V104 Z"/>'
        + '<rect x="24" y="104" width="56" height="20" rx="2"/>'],
      ['lb-jaleco', 'Jaleco', 120, 150, '<path d="M40,10 L60,50 L80,10 L100,18 L114,90 L102,92 L94,50 V144 H26 V50 L18,92 L6,90 L20,18 Z"/>'
        + fino('M60,50 V144') + dot(64, 70, 2) + dot(64, 94, 2) + dot(64, 118, 2)
        + '<rect x="32" y="100" width="18" height="18" rx="1" stroke-width="1.6"/><rect x="72" y="60" width="14" height="12" rx="1" stroke-width="1.6"/>'],
      ['lb-chuveiro', 'Chuveiro e lava-olhos', 120, 180, '<path d="M30,172 V14 H90 V26 M14,172 H46"/><path d="M78,26 H102 L96,36 H84 Z"/>'
        + '<path d="M84,42 L80,62 M90,42 V64 M96,42 L100,62" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M66,14 V62"/><circle cx="66" cy="68" r="6"/>'
        + '<path d="M30,112 H52 M50,104 H90 Q88,120 70,122 Q52,120 50,104 Z M62,104 V97 M78,104 V97"/>'],
      ['lb-extintor', 'Extintor', 80, 150, '<path d="M18,40 Q18,30 34,28 H46 Q62,30 62,40 V138 Q62,144 56,144 H24 Q18,144 18,138 Z"/><rect x="33" y="16" width="14" height="12" rx="1"/>'
        + '<path d="M33,20 H22 M40,16 L60,8 M47,22 Q72,24 72,60 V96"/><rect x="68" y="96" width="8" height="14" rx="1"/>'
        + '<rect x="22" y="70" width="36" height="30" rx="1" stroke-width="1.6"/>' + T(40, 85, 'PQS', 11)],
      ...SEG2,
    ]],
    ['Pictogramas GHS', [
      ['lb-ghs-inflamavel', 'GHS inflamável', 100, 100, DIA + '<path d="M50,22 C66,38 66,58 60,66 Q56,70 50,70 Q42,70 39,64 C34,54 40,46 44,40 C44,48 47,52 50,52 C48,42 50,32 50,22 Z" fill="#C"/>'
        + '<rect x="34" y="73" width="32" height="4" fill="#C" stroke="none"/>'],
      ['lb-ghs-corrosivo', 'GHS corrosivo', 100, 100, DIA + '<rect x="33" y="24" width="9" height="20" rx="1" transform="rotate(-35 37 34)"/><rect x="58" y="24" width="9" height="20" rx="1" transform="rotate(35 63 34)"/>'
        + dot(40, 48, 2.5) + dot(41, 56, 2) + dot(60, 48, 2.5) + dot(59, 56, 2)
        + '<path d="M24,64 H36 Q40,58 44,64 H46 V72 H24 Z M54,64 H60 Q64,58 68,64 H76 V72 H54 Z" fill="#C"/>'],
      ['lb-ghs-toxico', 'GHS tóxico', 100, 100, DIA + '<path d="M37,44 A13,13 0 1 1 63,44 V50 H57 V56 H43 V50 H37 Z"/>' + dot(45, 42, 3.5) + dot(55, 42, 3.5) + dot(50, 49, 1.6)
        + '<path d="M32,62 L68,76 M68,62 L32,76" stroke-width="4"/>' + dot(31, 61, 3) + dot(69, 61, 3) + dot(31, 77, 3) + dot(69, 77, 3)],
      ['lb-ghs-ambiente', 'GHS perigo ao meio ambiente', 100, 100, DIA + '<path d="M36,72 V36 M36,48 L28,38 M36,54 L44,44 M36,42 L32,32"/><path d="M24,72 H76"/>'
        + '<ellipse cx="58" cy="64" rx="10" ry="5" fill="#C"/><path d="M68,64 L76,58 V70 Z" fill="#C"/>'],
      ['lb-ghs-irritante', 'GHS irritante (!)', 100, 100, DIA + '<path d="M45,26 H55 L53,60 H47 Z" fill="#C"/>' + dot(50, 70, 4.5)],
      ...GHS2,
    ]],
  ],
};
