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

export default {
  id: 'quimica', nome: 'Operações unitárias',
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
  ],
};
