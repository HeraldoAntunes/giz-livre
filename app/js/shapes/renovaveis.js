// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
import { T, head } from './base.js';

// ---- utilidades das formas da segunda parte (rótulos legíveis a ~80 px: fonte >= 14) ----
const f1 = (v) => Math.round(v * 10) / 10;
const R = (x, y, s, z = 14) => T(f1(x), f1(y), s, z);
const ponto = (x, y, r = 3) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="#C" stroke="none"/>`;
const seta = (x1, y1, x2, y2, L = 9, w = 2.2) => `<path d="M${f1(x1)},${f1(y1)} L${f1(x2)},${f1(y2)}" stroke-width="${w}"/>` + head(f1(x2), f1(y2), Math.round(Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI), L);
const seta2 = (x1, y1, x2, y2, L = 8, w = 2) => seta(x1, y1, x2, y2, L, w) + head(f1(x1), f1(y1), Math.round(Math.atan2(y1 - y2, x1 - x2) * 180 / Math.PI), L);
const bloco = (x, y, w, h, s, z = 14) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>` + R(x + w / 2, y + h / 2, s, z);
const onda = (x, y, n, d = 16, a = 6) => `<path d="M${x},${y} q${d / 2},-${a} ${d},0` + ` t${d},0`.repeat(n - 1) + '" stroke-width="1.8"/>';
const modFV = (x, y, w = 36, h = 28) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/><path d="M${x},${y + h} L${x + w},${y}" stroke-width="1.6"/>`;
const sol = (cx, cy, r = 12) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>` + Array.from({ length: 8 }, (_, k) => {
  const a = k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
  return `<path d="M${f1(cx + c * (r + 4))},${f1(cy + s * (r + 4))} L${f1(cx + c * (r + 10))},${f1(cy + s * (r + 10))}" stroke-width="1.8"/>`;
}).join('');
const raios = (cx, cy, n, r1, r2, w = 2) => `<path d="${Array.from({ length: n }, (_, k) => {
  const a = k * 2 * Math.PI / n, c = Math.cos(a), s = Math.sin(a);
  return `M${f1(cx + c * r1)},${f1(cy + s * r1)} L${f1(cx + c * r2)},${f1(cy + s * r2)}`;
}).join(' ')}" stroke-width="${w}"/>`;
const aterro = (x1, x2, y) => { let s = `M${x1},${y} H${x2}`; for (let x = x1 + 10; x <= x2; x += 14) s += ` M${x},${y} l-7,8`; return `<path d="${s}" stroke-width="1.6"/>`; };

// formas novas, acrescentadas ao fim das seções existentes (ids antigos intocados)
const novosSolar = [
  ['rn-celula', 'Célula FV (corte n/p)', 200, 150, '<rect x="30" y="40" width="150" height="24"/><rect x="30" y="64" width="150" height="50"/><rect x="30" y="114" width="150" height="8" fill="#C"/>'
    + '<rect x="56" y="32" width="12" height="8" fill="#C"/><rect x="100" y="32" width="12" height="8" fill="#C"/><rect x="144" y="32" width="12" height="8" fill="#C"/>'
    + R(105, 52, 'n', 16) + R(105, 89, 'p', 16) + '<path d="M62,32 V14 H12 V54 M12,88 V118 H30"/><rect x="5" y="54" width="14" height="34"/>' + R(40, 24, 'e⁻')
    + seta(132, 4, 120, 26, 8, 1.8) + seta(160, 4, 148, 26, 8, 1.8) + seta(188, 4, 176, 26, 8, 1.8)],
  ['rn-arranjo', 'Arranjo FV (séries em paralelo)', 230, 150, modFV(42, 24) + modFV(98, 24) + modFV(154, 24) + modFV(42, 84) + modFV(98, 84) + modFV(154, 84)
    + '<path d="M16,38 H42 M78,38 H98 M134,38 H154 M190,38 H214 M16,98 H42 M78,98 H98 M134,98 H154 M190,98 H214 M16,38 V144 M214,38 V144"/>'
    + ponto(16, 98, 3.5) + ponto(214, 98, 3.5) + R(32, 134, '−', 18) + R(198, 134, '+', 18)],
  ['rn-stringbox', 'String box (proteção CC)', 170, 140, '<rect x="20" y="10" width="130" height="120" rx="4"/>' + R(85, 26, 'String box')
    + [56, 96].map(y => `<path d="M4,${y} H40 M66,${y} H88 M114,${y} H166 M88,${y} L112,${y - 12}"/><rect x="40" y="${y - 6}" width="26" height="12"/><path d="M40,${y} H66" stroke-width="1.4"/>` + ponto(88, y) + ponto(114, y)).join('')
    + '<path d="M100,50 V90" stroke-width="1.4" stroke-dasharray="4 3"/>' + R(10, 42, '+') + R(10, 82, '−') + R(160, 42, '+') + R(160, 82, '−')],
  ['rn-microinv', 'Microinversor', 150, 110, '<rect x="48" y="10" width="14" height="12" rx="2"/><rect x="88" y="10" width="14" height="12" rx="2"/><rect x="36" y="22" width="78" height="66" rx="8"/>'
    + '<path d="M36,88 L114,22" stroke-width="1.6"/><path d="M48,40 H64 M48,47 H64" stroke-width="1.8"/><path d="M84,68 q5,-8 10,0 t10,0" stroke-width="1.8"/>'
    + '<path d="M4,44 H36 M4,66 H36 M114,55 H146"/>' + R(14, 32, '+') + R(14, 78, '−') + R(132, 42, '~', 16) + R(75, 100, 'micro')],
  ['rn-ongrid', 'Sistema FV conectado à rede', 264, 120, bloco(4, 16, 40, 40, 'FV') + bloco(58, 16, 40, 40, 'Inv.') + bloco(112, 16, 40, 40, 'QD') + bloco(166, 16, 40, 40, 'kWh') + bloco(220, 16, 40, 40, 'Rede')
    + seta(44, 36, 58, 36, 7) + seta(98, 36, 112, 36, 7) + '<path d="M152,36 H166 M206,36 H220" stroke-width="2.2"/>'
    + seta(132, 56, 132, 84, 8) + bloco(102, 84, 60, 30, 'Cargas')],
  ['rn-offgrid', 'Sistema FV isolado (off-grid)', 262, 124, bloco(4, 16, 48, 40, 'FV') + bloco(70, 16, 58, 40, 'Contr.') + bloco(146, 16, 48, 40, '= / ~') + bloco(208, 16, 50, 40, 'Carga')
    + seta(52, 36, 70, 36, 8) + seta(128, 36, 146, 36, 8) + seta(194, 36, 208, 36, 7) + seta2(99, 58, 99, 82, 8) + bloco(70, 82, 58, 36, 'Bateria')],
  ['rn-curva-iv', 'Curvas I–V e P–V (MPP)', 230, 170, '<path d="M30,10 V146 H220" stroke-width="2"/>' + head(30, 8, -90, 9) + head(224, 146, 0, 9)
    + '<path d="M30,40 C110,40 150,44 168,76 Q182,104 190,146" stroke-width="2.6"/><path d="M30,146 Q110,70 160,62 Q178,60 190,146" stroke-width="2" stroke-dasharray="7 5"/>'
    + '<path d="M160,66 V146" stroke-width="1.2" stroke-dasharray="2 3"/>' + ponto(160, 62, 4.5)
    + R(52, 14, 'I, P') + R(15, 40, 'Isc') + R(190, 160, 'Voc') + R(215, 160, 'V') + R(196, 48, 'MPP')],
  ['rn-inclinacao', 'Inclinação do módulo (β)', 200, 140, aterro(8, 192, 128) + '<g transform="rotate(-36 60 128)"><rect x="60" y="120" width="112" height="8"/></g>'
    + '<path d="M140,70 V128"/><path d="M98,128 A38,38 0 0 0 90.7,105.7" stroke-width="1.8"/>' + R(110, 116, 'β', 18) + sol(30, 30, 11) + seta(48, 48, 88, 88, 9, 1.8)],
  ['rn-seguidor', 'Seguidor solar (tracker)', 200, 160, '<path d="M100,90 V150 M76,150 H124"/><circle cx="100" cy="84" r="6"/>'
    + '<g transform="rotate(-18 100 84)"><rect x="36" y="70" width="128" height="8"/><path d="M68,70 V78 M100,70 V78 M132,70 V78" stroke-width="1.4"/></g>'
    + '<path d="M50,40 A60,60 0 0 1 150,40" stroke-width="2"/>' + head(150, 40, 56, 10) + head(50, 40, 124, 10)],
  ['rn-telhado', 'Telhado com módulos FV', 220, 150, '<rect x="40" y="80" width="140" height="62"/><path d="M24,86 L110,20 L196,86"/>'
    + '<path d="M121.1,28.5 L184.5,77.2 L189.4,70.9 L126,22.2 Z"/><path d="M142.3,44.8 L147.2,38.5 M163.4,61 L168.3,54.7" stroke-width="1.6"/>'
    + '<rect x="70" y="104" width="24" height="38"/><rect x="120" y="100" width="34" height="24"/><path d="M137,100 V124 M120,112 H154" stroke-width="1.4"/><path d="M8,142 H212"/>'],
  ['rn-piranometro', 'Piranômetro (radiação solar)', 120, 140, '<rect x="24" y="72" width="72" height="26" rx="4"/><path d="M34,72 A26,26 0 0 1 86,72"/><path d="M44,72 A16,16 0 0 1 76,72" stroke-width="1.4"/>'
    + '<path d="M48,72 H72" stroke-width="3.5"/><path d="M60,98 V130 M38,130 H82"/>' + seta(20, 6, 38, 40, 8, 1.8) + seta(56, 4, 56, 38, 8, 1.8) + R(94, 22, 'W/m²')],
  ['rn-bomba-solar', 'Bombeamento solar', 240, 170, '<path d="M14,12 H74 L66,46 H6 Z"/><path d="M40,12 L36,46" stroke-width="1.4"/><path d="M40,46 V58"/>'
    + bloco(14, 58, 52, 28, 'MPPT') + '<path d="M66,72 H100 V148 H104" stroke-width="1.6" stroke-dasharray="5 3"/>'
    + '<path d="M4,100 H96 M126,100 H236 M96,100 V166 M126,100 V166 M96,166 H126"/><path d="M98,124 H124" stroke-width="1.4" stroke-dasharray="5 4"/>'
    + '<rect x="104" y="140" width="14" height="22" rx="2"/><path d="M111,140 V84 H180 V60" stroke-width="3"/>'
    + '<rect x="166" y="20" width="60" height="40" rx="3"/><path d="M170,34 H222" stroke-width="1.4" stroke-dasharray="5 4"/><path d="M172,60 V100 M220,60 V100"/>'],
];
const novosTermica = [
  ['rn-boiler', 'Reservatório térmico (boiler)', 200, 110, '<rect x="30" y="22" width="140" height="66" rx="33"/>'
    + '<path d="M60,72 L66,62 L72,72 L78,62 L84,72 L90,62 L96,72" stroke-width="1.6"/>'
    + seta(4, 78, 40, 78, 8) + seta(160, 32, 196, 32, 8) + R(18, 96, 'fria') + R(176, 14, 'quente')],
  ['rn-termossifao', 'Aquecimento solar (termossifão)', 240, 170, '<g transform="rotate(-30 64 128)"><rect x="14" y="116" width="100" height="24" rx="2"/><path d="M24,122 H104 M24,128 H104 M24,134 H104" stroke-width="1.2"/></g>'
    + '<rect x="150" y="24" width="84" height="44" rx="22"/>' + '<path d="M106,98 V46 H146" stroke-width="2.4"/>' + head(150, 46, 0, 9)
    + '<path d="M206,68 V160 H32" stroke-width="2.4"/>' + head(28, 160, 180, 9) + R(126, 32, 'quente') + R(222, 120, 'fria')],
  ['rn-calha', 'Concentrador cilindro-parabólico', 200, 150, '<path d="M20,40 Q100,150 180,40" stroke-width="4"/><circle cx="100" cy="66" r="7"/><circle cx="100" cy="66" r="2.5" fill="#C"/>'
    + '<path d="M50,6 V73.5 L93,65 M80,6 V91.6 L96,72 M150,6 V73.5 L107,65 M120,6 V91.6 L104,72" stroke-width="1.4" stroke-dasharray="5 3"/>'
    + '<path d="M100,95 V138 M72,140 H128"/>'],
  ['rn-torre-solar', 'Torre solar com helióstatos', 240, 170, '<path d="M4,160 H236 M112,160 V34 M128,160 V34"/><rect x="104" y="14" width="32" height="20" rx="2"/>'
    + [[24, -1], [62, -1], [178, 1], [216, 1]].map(([x, s]) => `<path d="M${x},160 V140"/><path d="M${x - 12},${136 + 4 * s} L${x + 12},${136 - 4 * s}" stroke-width="4"/>`).join('')
    + '<path d="M24,134 L110,30 M62,134 L114,32 M178,134 L126,32 M216,134 L130,30" stroke-width="1.4" stroke-dasharray="5 4"/>'],
  ['rn-destilador', 'Destilador solar', 220, 140, '<path d="M20,124 V40 L200,92 V124 Z"/><path d="M24,112 H196" stroke-width="1.6" stroke-dasharray="6 4"/>'
    + ponto(60, 58, 2.5) + ponto(100, 70, 2.5) + ponto(140, 82, 2.5) + '<path d="M186,92 V104 H200" stroke-width="1.6"/>'
    + '<path d="M60,106 q-4,-6 0,-12 t0,-12 M100,106 q-4,-6 0,-12 t0,-12 M140,106 q-4,-6 0,-12" stroke-width="1.4"/>'
    + seta(200, 100, 218, 100, 7) + sol(186, 26, 10)],
];
const novosEolHid = [
  ['rn-savonius', 'Aerogerador Savonius', 120, 190, '<ellipse cx="60" cy="22" rx="40" ry="8"/><ellipse cx="60" cy="126" rx="40" ry="8"/><path d="M20,22 V126 M100,22 V126"/>'
    + '<path d="M60,30 C30,44 30,104 60,118 M60,30 C90,44 90,104 60,118" stroke-width="1.6"/>'
    + '<path d="M60,4 V14 M60,134 V150 M60,172 V184 M36,184 H84"/>' + bloco(46, 150, 28, 22, 'G')],
  ['rn-darrieus', 'Aerogerador Darrieus', 120, 200, '<path d="M60,6 V160"/><path d="M60,12 C0,50 0,120 60,158 M60,12 C120,50 120,120 60,158" stroke-width="3"/>'
    + bloco(46, 160, 28, 22, 'G') + '<path d="M60,182 V194 M34,194 H86"/>'],
  ['rn-nacele', 'Nacele do aerogerador', 256, 130, '<path d="M62,30 Q18,56 62,82 Z"/><path d="M44,38 L36,6 H50 L54,34 M44,74 L36,106 H50 L54,78"/>'
    + '<rect x="62" y="24" width="188" height="64" rx="10"/><path d="M62,56 H92" stroke-width="4"/>' + bloco(92, 36, 56, 40, 'Caixa')
    + '<path d="M148,56 H170" stroke-width="3"/><circle cx="192" cy="56" r="22"/>' + R(192, 56, 'G', 18) + '<path d="M140,88 L130,126 M180,88 L190,126"/>'],
  ['rn-curva-eolica', 'Curva de potência do aerogerador', 230, 160, '<path d="M30,14 V130 H218" stroke-width="2"/>' + head(30, 10, -90, 9) + head(222, 130, 0, 9)
    + '<path d="M30,130 H49.5 C70,128 92,60 108,40 H192.5" stroke-width="2.6"/><path d="M192.5,40 V130 M108,40 V130 M30,40 H108" stroke-width="1.2" stroke-dasharray="3 3"/>'
    + R(49.5, 146, '3') + R(108, 146, '12') + R(192.5, 146, '25') + R(216, 146, 'v') + R(16, 18, 'P') + R(14, 40, 'Pn')],
  ['rn-perfil-vento', 'Perfil vertical do vento', 180, 180, aterro(10, 170, 168) + '<path d="M20,168 V14" stroke-width="2"/>' + head(20, 10, -90, 9)
    + [[150, 40], [120, 68], [90, 86], [60, 98], [30, 108]].map(([y, l]) => seta(20, y, 20 + l, y, 8, 1.8)).join('')
    + '<path d="M60,150 C76,132 94,112 106,90 S122,52 128,30" stroke-width="1.6" stroke-dasharray="5 4"/>' + R(34, 14, 'z') + R(158, 30, 'v(z)')],
  ['rn-catavento', 'Cata-vento de bombeamento', 150, 220, '<path d="M64,90 L44,212 M86,90 L106,212 M10,212 H140"/>'
    + '<path d="M61.4,110 H88.6 M55,150 H95 M48.5,190 H101.5 M61.4,110 L95,150 M88.6,110 L55,150 M55,150 L101.5,190 M95,150 L48.5,190" stroke-width="1.4"/>'
    + '<path d="M75,90 V212" stroke-width="1.4" stroke-dasharray="5 4"/><path d="M83,50 H128" stroke-width="2"/><path d="M118,50 L142,32 V68 Z"/>'
    + '<circle cx="75" cy="50" r="40" stroke-width="1.6"/><circle cx="75" cy="50" r="8"/>' + raios(75, 50, 12, 10, 40, 2)],
  ['rn-offshore', 'Aerogerador offshore', 140, 220, '<path d="M66,64 L62,150 M74,64 L78,150"/><rect x="60" y="50" width="28" height="14" rx="3"/><circle cx="58" cy="57" r="5"/>'
    + '<path d="M58,52 V8 M54,60 L18,82 M62,60 L96,84" stroke-width="3"/><rect x="56" y="150" width="28" height="14"/>'
    + onda(4, 170, 8) + '<path d="M62,164 V214 M78,164 V214"/>' + aterro(4, 136, 206)],
  ['rn-pelton', 'Turbina Pelton', 160, 160, '<circle cx="80" cy="74" r="44"/><circle cx="80" cy="74" r="8"/>' + raios(80, 74, 6, 8, 44, 1.4)
    + Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6; return `<circle cx="${f1(80 + 51 * Math.cos(a))}" cy="${f1(74 + 51 * Math.sin(a))}" r="7" stroke-width="1.8"/>`; }).join('')
    + '<path d="M4,118 H28 L44,124 L28,130 H4"/><path d="M44,124 H80" stroke-width="2" stroke-dasharray="6 4"/>' + head(84, 124, 0, 9)],
  ['rn-kaplan', 'Turbina Kaplan (hélice)', 140, 170, '<path d="M70,6 V68" stroke-width="3"/><ellipse cx="70" cy="90" rx="12" ry="22"/>'
    + '<path d="M58,82 L34,72 Q30,86 34,100 L58,98 Z M82,82 L106,72 Q110,86 106,100 L82,98 Z"/>'
    + '<path d="M26,56 V112 L16,166 M114,56 V112 L124,166"/>' + seta(44, 14, 44, 50) + seta(96, 14, 96, 50) + seta(70, 124, 70, 160)],
  ['rn-roda', "Roda d'água", 180, 160, '<circle cx="96" cy="94" r="50"/><circle cx="96" cy="94" r="8"/>' + raios(96, 94, 8, 8, 50, 1.6) + raios(96, 94, 12, 50, 62, 4)
    + '<path d="M4,14 H104 M4,28 H104"/><path d="M104,22 Q118,24 120,40" stroke-width="1.6" stroke-dasharray="5 3"/>' + onda(30, 152, 8)],
  ['rn-carneiro', 'Carneiro hidráulico', 220, 130, '<path d="M4,22 V52 H44 V22"/><path d="M8,32 H40" stroke-width="1.4" stroke-dasharray="5 4"/><path d="M30,52 L72,100" stroke-width="3.5"/>'
    + '<rect x="70" y="96" width="80" height="22" rx="3"/><rect x="80" y="80" width="18" height="16" rx="2"/>' + seta(89, 80, 89, 62, 8)
    + '<rect x="112" y="30" width="30" height="66" rx="15"/>' + R(127, 50, 'ar') + '<path d="M114,72 H140" stroke-width="1.2" stroke-dasharray="4 3"/>'
    + '<path d="M150,107 H200 V16" stroke-width="3"/>' + head(200, 8, -90, 10)],
  ['rn-reversivel', 'Usina reversível (bombeamento)', 240, 160, '<path d="M8,30 L20,60 H80 L92,30"/><path d="M14,40 H86" stroke-width="1.6" stroke-dasharray="6 4"/>'
    + '<path d="M148,120 L160,150 H220 L232,120"/><path d="M154,130 H226" stroke-width="1.6" stroke-dasharray="6 4"/>'
    + '<path d="M60,60 L115,108 M148,128 L166,140" stroke-width="3.5"/><circle cx="130" cy="122" r="20"/>' + R(130, 122, 'M/G')
    + seta2(36, 86, 80, 124, 9, 1.8)],
  ['rn-mare', 'Usina maremotriz', 240, 140, aterro(4, 236, 128) + '<path d="M100,128 V30 H140 V128"/><rect x="100" y="92" width="40" height="18"/><circle cx="120" cy="101" r="6" stroke-width="1.6"/>'
    + onda(4, 50, 6) + '<path d="M140,80 H236" stroke-width="1.6" stroke-dasharray="6 4"/>' + seta2(66, 101, 94, 101, 7, 1.8) + R(50, 72, 'mar') + R(190, 104, 'bacia')],
];
const novosBio = [
  ['rn-bd-indiano', 'Biodigestor indiano (campânula)', 220, 170, '<path d="M4,44 H56 M164,44 H216 M56,40 V160 H164 V40"/><rect x="66" y="20" width="88" height="64" rx="3"/>'
    + '<path d="M68,64 H152 M58,64 H64 M156,64 H162" stroke-width="1.6" stroke-dasharray="6 4"/><path d="M110,104 V160"/>'
    + '<rect x="8" y="28" width="34" height="16"/><rect x="178" y="28" width="34" height="16"/><path d="M30,44 L68,150 M152,150 L190,44" stroke-width="3"/>'
    + '<path d="M110,20 V10 H146"/>' + R(182, 10, 'biogás')],
  ['rn-bd-chines', 'Biodigestor chinês (cúpula fixa)', 220, 170, '<path d="M4,30 H12 M38,30 H172 M212,30 H216"/><path d="M60,80 V138 Q110,166 160,138 V80 Q160,40 110,40 Q60,40 60,80 Z"/>'
    + '<path d="M62,86 H158 M174,56 H210" stroke-width="1.6" stroke-dasharray="6 4"/><rect x="12" y="18" width="26" height="16"/><path d="M28,34 L62,122 M158,126 L192,76" stroke-width="3"/>'
    + '<path d="M172,30 V76 H212 V30"/><path d="M110,40 V8 H150"/>' + R(186, 10, 'biogás')],
  ['rn-bd-tubular', 'Biodigestor tubular (lona)', 240, 120, '<path d="M4,56 H40 M200,56 H236 M40,56 L56,104 H184 L200,56"/><path d="M46,60 C46,8 194,8 194,60" stroke-width="2.4"/>'
    + '<path d="M54,74 H186" stroke-width="1.6" stroke-dasharray="6 4"/><path d="M6,40 L54,90 M186,90 L234,40" stroke-width="3"/>'
    + '<path d="M120,21 V6 H160"/>' + R(196, 10, 'biogás')],
  ['rn-filtro-h2s', 'Filtro de H₂S (biogás)', 110, 170, '<rect x="34" y="30" width="44" height="124" rx="6"/>' + R(56, 42, 'H₂S')
    + Array.from({ length: 36 }, (_, i) => ponto(42 + (i % 4) * 9.3 + (Math.floor(i / 4) % 2) * 4, 56 + Math.floor(i / 4) * 9, 2)).join('')
    + '<path d="M34,138 H78" stroke-width="1.4" stroke-dasharray="4 3"/>' + seta(4, 146, 34, 146, 8) + '<path d="M56,30 V12 H96" stroke-width="2.2"/>' + head(104, 12, 0, 9)],
  ['rn-gaseificador', 'Gaseificador de biomassa', 150, 190, '<path d="M30,8 H120 L106,34 H44 Z"/><rect x="44" y="34" width="62" height="126" rx="4"/>'
    + '<path d="M44,70 H106 M44,100 H106 M44,130 H106" stroke-width="1.2" stroke-dasharray="4 4"/>'
    + '<path d="M75,126 Q62,116 70,104 Q72,112 77,108 Q76,98 82,92 Q92,108 84,120 Q82,126 75,126 Z" stroke-width="1.8"/>'
    + seta(6, 114, 44, 114, 8) + R(16, 98, 'ar') + seta(106, 146, 142, 146, 8) + R(126, 130, 'gás') + '<rect x="56" y="160" width="38" height="22" rx="2"/>'],
  ['rn-cogeracao', 'Cogeração (eletricidade e calor)', 250, 126, R(28, 42, 'Biogás') + seta(54, 42, 72, 42, 8) + bloco(72, 20, 60, 44, 'Motor')
    + seta(132, 42, 150, 42, 8) + '<circle cx="170" cy="42" r="20"/>' + R(170, 42, 'G', 16) + seta(190, 42, 208, 42, 8) + R(230, 42, 'kWh')
    + seta(102, 64, 102, 86, 8) + bloco(72, 86, 60, 32, 'Recup.') + seta(132, 102, 190, 102, 8) + R(218, 102, 'calor')],
  ['rn-ciclo-co2', 'Ciclo do carbono da biomassa', 220, 150, '<path d="M50,142 V104" stroke-width="3"/><circle cx="50" cy="78" r="28"/><path d="M4,142 H216"/>'
    + '<rect x="148" y="96" width="52" height="46" rx="2"/><rect x="180" y="58" width="12" height="38"/>'
    + '<path d="M174,134 Q166,124 172,114 Q174,120 178,118 Q178,110 184,104 Q192,118 186,128 Q184,134 174,134 Z" stroke-width="1.6"/>'
    + '<path d="M186,54 Q120,10 68,46" stroke-width="2.2"/>' + head(66, 47, 145, 10) + R(124, 16, 'CO₂') + seta(84, 124, 146, 124, 9) + R(114, 110, 'biomassa')],
];
const novosArmaz = [
  ['rn-celula-comb', 'Célula a combustível (H₂)', 220, 150, '<rect x="64" y="44" width="14" height="86"/><rect x="142" y="44" width="14" height="86"/><rect x="104" y="44" width="12" height="86" stroke-width="1.4" stroke-dasharray="4 3"/>'
    + '<path d="M71,44 V14 H98 M122,14 H149 V44"/><rect x="98" y="6" width="24" height="16"/>' + R(58, 30, '−') + R(162, 30, '+')
    + seta(14, 70, 58, 70) + R(26, 56, 'H₂') + seta(206, 70, 162, 70) + R(194, 56, 'O₂') + seta(162, 116, 206, 116) + R(190, 134, 'H₂O')
    + seta(84, 96, 136, 96, 7, 1.4) + R(110, 140, 'H⁺')],
  ['rn-cilindro-h2', 'Cilindro de H₂', 80, 180, '<path d="M24,10 H56 M40,10 V16" stroke-width="3"/><rect x="32" y="16" width="16" height="14" rx="2"/><rect x="16" y="30" width="48" height="144" rx="22"/>'
    + R(40, 100, 'H₂', 18)],
  ['rn-bms', 'Banco de baterias com BMS', 220, 120, bloco(40, 8, 140, 32, 'BMS', 16)
    + [14, 66, 118, 170].map(x => `<rect x="${x}" y="64" width="40" height="44" rx="3"/><rect x="${x + 26}" y="58" width="10" height="6" rx="1"/>`).join('')
    + '<path d="M4,86 H14 M54,86 H66 M106,86 H118 M158,86 H170 M210,86 H216 M60,40 V86 M112,40 V86 M164,40 V86" stroke-width="2"/>'
    + ponto(60, 86) + ponto(112, 86) + ponto(164, 86) + R(8, 70, '−', 16) + R(212, 70, '+', 16)],
  ['rn-inv-hibrido', 'Inversor híbrido', 196, 140, '<rect x="44" y="16" width="100" height="108" rx="6"/><path d="M44,124 L144,16" stroke-width="1.6"/>'
    + '<path d="M58,38 H80 M58,46 H80" stroke-width="2"/><path d="M104,100 q6,-9 12,0 t12,0" stroke-width="2"/>'
    + '<path d="M4,50 H44 M4,100 H44 M144,50 H192 M144,100 H192"/>' + R(22, 36, 'FV') + R(22, 86, 'Bat.') + R(170, 36, 'Rede') + R(170, 86, 'Carga')],
  ['rn-microrrede', 'Microrrede (diagrama)', 250, 170, '<path d="M24,86 H176" stroke-width="3.5"/>' + bloco(14, 14, 50, 34, 'FV') + bloco(88, 14, 62, 34, 'Eólica')
    + bloco(14, 124, 62, 34, 'Bateria') + bloco(92, 124, 62, 34, 'Cargas') + bloco(196, 69, 50, 34, 'Rede')
    + '<path d="M39,48 V86 M119,48 V86 M45,124 V86 M123,124 V86 M176,86 L192,74" stroke-width="2"/>' + ponto(39, 86) + ponto(119, 86) + ponto(45, 86) + ponto(123, 86) + ponto(176, 86) + ponto(196, 86)],
  ['rn-curva-carga', 'Curva de carga e geração FV', 240, 170, '<path d="M30,14 V140 H226" stroke-width="2"/>' + head(30, 10, -90, 9) + head(230, 140, 0, 9)
    + '<path d="M30,82 C60,92 70,92 86,76 S118,62 136,58 S166,50 178,24 S204,30 222,72" stroke-width="2.6"/>'
    + '<path d="M78,140 C102,140 108,40 126,40 S150,140 174,140" stroke-width="2" stroke-dasharray="7 5"/>'
    + R(30, 155, '0') + R(126, 155, '12') + R(218, 155, '24 h') + R(48, 14, 'kW') + R(62, 70, 'carga') + R(126, 26, 'FV')],
  ['rn-volante', 'Volante de inércia', 140, 160, '<rect x="20" y="10" width="100" height="100" rx="8"/><path d="M70,16 V118" stroke-width="3"/>'
    + '<ellipse cx="70" cy="60" rx="40" ry="14"/><path d="M30,60 V68 M110,60 V68 M30,68 A40,14 0 0 0 110,68" />'
    + '<path d="M44,92 Q70,102 96,92" stroke-width="1.8"/>' + head(96, 92, -20, 9) + bloco(44, 118, 52, 32, 'M/G')],
];
const eficiencia = [
  ['rn-etiqueta', 'Etiqueta de eficiência (A–E)', 160, 190, '<rect x="6" y="6" width="148" height="178" rx="4"/>' + R(80, 22, 'Eficiência')
    + 'ABCDE'.split('').map((c, i) => { const y = 38 + i * 28, w = 48 + i * 14; return `<path d="M14,${y} H${14 + w} L${24 + w},${y + 11} L${14 + w},${y + 22} H14 Z" stroke-width="2"/>` + R(26, y + 11, c); }).join('')
    + '<path d="M148,38 V60 H122 L112,49 L122,38 Z" stroke-width="2.4"/>' + R(132, 49, 'A')],
  ['rn-sankey', 'Diagrama de Sankey (perdas)', 240, 150, '<path d="M8,30 H200 M8,90 H100 M8,30 V90 M100,66 H200 M100,90 A10,10 0 0 1 110,100 V128 M100,66 A34,34 0 0 1 134,100 V128"/>'
    + '<path d="M200,22 L228,48 L200,74 Z M102,128 H142 L122,146 Z"/>' + R(54, 60, 'entrada') + R(156, 48, 'útil') + R(178, 112, 'perdas')],
  ['rn-bomba-calor', 'Bomba de calor (ciclo)', 230, 150, '<rect x="30" y="30" width="36" height="80" rx="3"/><rect x="164" y="30" width="36" height="80" rx="3"/>'
    + '<path d="M38,40 H58 L38,52 H58 L38,64 H58 L38,76 H58 L38,88 H58 L38,100 H58 M172,40 H192 L172,52 H192 L172,64 H192 L172,76 H192 L172,88 H192 L172,100 H192" stroke-width="1.4"/>'
    + '<path d="M95,12 L135,32 V12 L95,32 Z"/><path d="M48,30 V22 H95 M135,22 H182 V30 M48,110 V120 H97 M133,120 H182 V110"/>'
    + head(48, 29, 90, 8) + head(98, 120, 0, 8) + head(182, 113, -90, 8) + head(138, 22, 180, 8)
    + '<circle cx="115" cy="120" r="18"/>' + R(115, 120, 'W') + seta(4, 70, 28, 70, 8) + R(14, 52, 'Q') + seta(202, 70, 226, 70, 8) + R(216, 52, 'Q')],
  ['rn-triangulo-pot', 'Triângulo de potências (P, Q, S)', 200, 140, '<path d="M20,110 H160 V30 Z"/><path d="M150,110 V100 H160" stroke-width="1.4"/>'
    + '<path d="M60,110 A40,40 0 0 0 54.7,90.2" stroke-width="1.6"/>' + R(90, 126, 'P', 16) + R(176, 70, 'Q', 16) + R(78, 58, 'S', 16) + R(72, 100, 'φ', 16)],
];

// Energias renováveis: solar, eólica/hídrica, biomassa/biogás, armazenamento e rede. Desenho próprio do Giz Livre.




// AMPLIACAO-B-INICIO
// SVG autoral: esquemas didáticos, sem certificação normativa ou pinagem universal.
const AMPLIACAO_B = [
  [
    [
      "rn-biometano-cadeia",
      "Biometano: cadeia de upgrading",
      878,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Biogás</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">bruto</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pré-trat.</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">H₂S / H₂O</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Separação</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CO₂</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Secagem</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+ qualidade</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><rect x=\"716\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"787.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Compressão</text><text x=\"787.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">/ uso</text><path d=\"M684 63 L716 63\"/><path d=\"M716 63 L707.0 67.0 L707.0 59.0 Z\" fill=\"#C\"/><text x=\"439.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Ordem e tecnologia variam; controlar metano no gás residual</text>"
    ],
    [
      "rn-h2s-leito",
      "Biogás: remoção de H₂S em leito",
      430,
      235,
      "<rect x=\"145\" y=\"30\" width=\"120\" height=\"160\" rx=\"30\"/><path d=\"M20 110 H145 M265 110 H390 M155 65 H255 M155 155 H255\" stroke-width=\"1.6\"/><text x=\"205\" y=\"95\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Leito</text><text x=\"205\" y=\"125\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">adsorvente</text><text x=\"75\" y=\"88\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Biogás</text><text x=\"325\" y=\"88\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">H₂S reduzido</text><text x=\"215.0\" y=\"219\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Meio consumível; acompanhar saturação e perda de carga</text>"
    ],
    [
      "rn-co2-membrana",
      "Upgrading: membrana e duas correntes",
      590,
      250,
      "<rect x=\"190\" y=\"40\" width=\"170\" height=\"150\" rx=\"4\"/><text x=\"275.0\" y=\"104.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Membrana</text><text x=\"275.0\" y=\"126.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">seletiva</text><path d=\"M20 110 L190 110\"/><path d=\"M190 110 L181.0 114.0 L181.0 106.0 Z\" fill=\"#C\"/><path d=\"M360 80 L540 80\"/><path d=\"M540 80 L531.0 84.0 L531.0 76.0 Z\" fill=\"#C\"/><path d=\"M360 155 L540 155\"/><path d=\"M540 155 L531.0 159.1 L531.0 150.9 Z\" fill=\"#C\"/><text x=\"100\" y=\"88\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Biogás tratado</text><text x=\"460\" y=\"55\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Retentado: rico em CH₄</text><text x=\"460\" y=\"185\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Permeado: rico em CO₂</text><text x=\"295.0\" y=\"234\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pode haver CH₄ no permeado; recuperação depende do arranjo</text>"
    ],
    [
      "rn-co2-psa",
      "Upgrading: PSA com torres alternadas",
      550,
      325,
      "<rect x=\"140\" y=\"65\" width=\"100\" height=\"150\" rx=\"20\"/><rect x=\"340\" y=\"65\" width=\"100\" height=\"150\" rx=\"20\"/><text x=\"190\" y=\"105\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Torre A</text><text x=\"190\" y=\"140\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Adsorve</text><text x=\"390\" y=\"105\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Torre B</text><text x=\"390\" y=\"140\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Regenera</text><path d=\"M20 180 H140 M240 95 H290 V40 H500 M340 180 H290 V250 H500\"/><text x=\"85\" y=\"160\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Alimentação</text><text x=\"450\" y=\"15\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CH₄ rico</text><text x=\"425\" y=\"275\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Dessorção CO₂ + traços CH₄</text><text x=\"275.0\" y=\"309\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PSA alterna pressão e torres; gás residual deve ser tratado</text>"
    ],
    [
      "rn-co2-lavagem-agua",
      "Upgrading: lavagem com água",
      510,
      325,
      "<rect x=\"210\" y=\"45\" width=\"100\" height=\"170\" rx=\"20\"/><path d=\"M20 175 L210 175\"/><path d=\"M210 175 L201.0 179.1 L201.0 170.9 Z\" fill=\"#C\"/><path d=\"M260 45 V20\"/><path d=\"M260 20 L330 20\"/><path d=\"M330 20 L321.0 24.1 L321.0 15.9 Z\" fill=\"#C\"/><path d=\"M420 75 L310 75\"/><path d=\"M310 75 L319.0 71.0 L319.0 79.0 Z\" fill=\"#C\"/><path d=\"M260 215 L260 250\"/><path d=\"M260 250 L255.9 241.0 L264.1 241.0 Z\" fill=\"#C\"/><text x=\"95\" y=\"153\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Biogás</text><text x=\"380\" y=\"20\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CH₄ rico</text><text x=\"420\" y=\"50\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Água</text><text x=\"260\" y=\"275\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Água + CO₂ dissolvido</text><path d=\"M225 90 H295 M225 125 H295 M225 160 H295\" stroke-width=\"1.6\"/><text x=\"255.0\" y=\"309\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Lavagem física contracorrente; regenerar e recircular água</text>"
    ],
    [
      "rn-co2-aminas",
      "Upgrading: absorção e regeneração de amina",
      550,
      250,
      "<rect x=\"50\" y=\"70\" width=\"150\" height=\"100\" rx=\"4\"/><text x=\"125.0\" y=\"109.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Absorvedor</text><text x=\"125.0\" y=\"131.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">retém CO₂</text><rect x=\"350\" y=\"70\" width=\"150\" height=\"100\" rx=\"4\"/><text x=\"425.0\" y=\"109.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Regenerador</text><text x=\"425.0\" y=\"131.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">recebe calor</text><path d=\"M200 140 H350 M350 100 H270 V45 H175 V70 M95 70 V20\"/><path d=\"M260 140 L350 140\"/><path d=\"M350 140 L341.0 144.1 L341.0 135.9 Z\" fill=\"#C\"/><path d=\"M270 45 L200 45\"/><path d=\"M200 45 L209.0 41.0 L209.0 49.0 Z\" fill=\"#C\"/><path d=\"M20 120 L50 120\"/><path d=\"M50 120 L41.0 124.0 L41.0 116.0 Z\" fill=\"#C\"/><path d=\"M95 20 L20 20\"/><path d=\"M20 20 L29.0 15.9 L29.0 24.1 Z\" fill=\"#C\"/><path d=\"M425 70 L425 20\"/><path d=\"M425 20 L429.1 29.0 L420.9 29.0 Z\" fill=\"#C\"/><text x=\"65\" y=\"45\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CH₄ rico</text><text x=\"465\" y=\"18\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CO₂</text><text x=\"85\" y=\"200\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Biogás</text><text x=\"440\" y=\"200\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Calor / solvente</text><text x=\"275.0\" y=\"234\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Solvente circula entre absorção e regeneração térmica</text>"
    ],
    [
      "rn-secagem-torres",
      "Biometano: secador de adsorção de duas torres",
      580,
      285,
      "<rect x=\"110\" y=\"40\" width=\"100\" height=\"140\" rx=\"20\"/><rect x=\"330\" y=\"50\" width=\"100\" height=\"130\" rx=\"20\"/><path d=\"M20 80 H110 M210 80 H260 V15 H540 M540 150 H430 M330 150 H260 V220 H540\"/><text x=\"160\" y=\"80\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Secagem</text><text x=\"160\" y=\"120\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">leito A</text><text x=\"380\" y=\"80\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Regenera</text><text x=\"380\" y=\"120\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">leito B</text><text x=\"445\" y=\"35\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Produto seco</text><text x=\"490\" y=\"175\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Purga / calor</text><text x=\"440\" y=\"240\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Purga úmida</text><text x=\"290.0\" y=\"269\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Comutação alterna funções; circuito de regeneração separado</text>"
    ],
    [
      "rn-compressao-estagios",
      "Biometano: compressão com intercooling",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Compressor</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">estágio 1</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Resfriador</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+ separador</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Compressor</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">estágio 2</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Resfriador</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+ separador</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Remover condensado; pressões e temperaturas conforme projeto</text>"
    ],
    [
      "rn-qualidade-desvio",
      "Biometano: qualidade e desvio do produto",
      640,
      260,
      "<rect x=\"20\" y=\"50\" width=\"140\" height=\"70\" rx=\"4\"/><text x=\"90.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Gás</text><text x=\"90.0\" y=\"96.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">tratado</text><rect x=\"240\" y=\"50\" width=\"140\" height=\"70\" rx=\"4\"/><text x=\"310.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Análise</text><text x=\"310.0\" y=\"96.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">qualidade</text><rect x=\"460\" y=\"20\" width=\"140\" height=\"60\" rx=\"4\"/><text x=\"530.0\" y=\"39.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Produto</text><text x=\"530.0\" y=\"61.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">conforme</text><rect x=\"460\" y=\"150\" width=\"140\" height=\"60\" rx=\"4\"/><text x=\"530.0\" y=\"169.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Desvio</text><text x=\"530.0\" y=\"191.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">reprocesso</text><path d=\"M160 85 L240 85\"/><path d=\"M240 85 L231.0 89.0 L231.0 81.0 Z\" fill=\"#C\"/><path d=\"M380 70 L460 50\"/><path d=\"M460 50 L452.3 56.1 L450.3 48.3 Z\" fill=\"#C\"/><path d=\"M380 105 L460 180\"/><path d=\"M460 180 L450.7 176.8 L456.2 170.9 Z\" fill=\"#C\"/><text x=\"420\" y=\"25\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">OK</text><text x=\"422\" y=\"183\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Falha</text><text x=\"320.0\" y=\"244\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Avaliar composição, H₂O, enxofre e critérios do destino</text>"
    ],
    [
      "rn-injecao-rede",
      "Biometano: estação de injeção na rede",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Qualidade</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">aprovada</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Medição</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">e regulagem</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Odorização</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">se requerida</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Rede</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">compatível</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Intertravamento de bloqueio; requisitos locais do operador</text>"
    ],
    [
      "rn-biocng-abastecimento",
      "Bio-GNV: compressão, armazenamento e uso",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Biometano</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">seco / conforme</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Compressor</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">alta pressão</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Cascata</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">armazenamento</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Abastecimento</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">veicular</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Esquema didático; vaso e instalação exigem projeto específico</text>"
    ]
  ],
  [
    [
      "rn-metano-balanco",
      "Upgrading: balanço de metano e recuperação",
      700,
      305,
      "<rect x=\"20\" y=\"70\" width=\"150\" height=\"90\" rx=\"4\"/><text x=\"95.0\" y=\"104.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CH₄ entrada</text><text x=\"95.0\" y=\"126.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">100 Nm³/h</text><rect x=\"250\" y=\"70\" width=\"150\" height=\"90\" rx=\"4\"/><text x=\"325.0\" y=\"104.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Upgrading</text><text x=\"325.0\" y=\"126.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">recuperação 97%</text><rect x=\"500\" y=\"25\" width=\"160\" height=\"75\" rx=\"4\"/><text x=\"580.0\" y=\"51.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CH₄ produto</text><text x=\"580.0\" y=\"73.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">97 Nm³/h</text><rect x=\"500\" y=\"180\" width=\"160\" height=\"75\" rx=\"4\"/><text x=\"580.0\" y=\"206.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CH₄ residual</text><text x=\"580.0\" y=\"228.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">3 Nm³/h</text><path d=\"M170 115 L250 115\"/><path d=\"M250 115 L241.0 119.0 L241.0 111.0 Z\" fill=\"#C\"/><path d=\"M400 100 L500 62\"/><path d=\"M500 62 L493.0 69.0 L490.1 61.4 Z\" fill=\"#C\"/><path d=\"M400 140 L500 217\"/><path d=\"M500 217 L490.4 214.7 L495.3 208.3 Z\" fill=\"#C\"/><text x=\"350.0\" y=\"289\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Exemplo: balanço só de CH₄; Nm³ na mesma base de referência</text>"
    ],
    [
      "rn-biometano-energia",
      "Biometano: balanço de energia líquida",
      660,
      235,
      "<rect x=\"20\" y=\"30\" width=\"600\" height=\"160\" rx=\"0\"/><text x=\"320\" y=\"55\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Energia líquida = energia do produto − consumos</text><text x=\"320\" y=\"100\" font-size=\"20\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Eproduto = Vproduto × PCI</text><text x=\"320\" y=\"142\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Consumos auxiliares: eletricidade e calor</text><text x=\"320\" y=\"168\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Incluir compressão uma única vez nos consumos</text><text x=\"330.0\" y=\"219\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">V em Nm³ e PCI em kWh/Nm³; declarar mesma base de referência</text>"
    ],
    [
      "rn-chp-balanco",
      "Cogeração: eletricidade, calor útil e perdas",
      680,
      320,
      "<rect x=\"20\" y=\"80\" width=\"150\" height=\"75\" rx=\"4\"/><text x=\"95.0\" y=\"106.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Biogás</text><text x=\"95.0\" y=\"128.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">energia química</text><rect x=\"260\" y=\"80\" width=\"140\" height=\"75\" rx=\"4\"/><text x=\"330.0\" y=\"117.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CHP</text><rect x=\"490\" y=\"20\" width=\"150\" height=\"65\" rx=\"4\"/><text x=\"565.0\" y=\"52.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Eletricidade</text><rect x=\"490\" y=\"115\" width=\"150\" height=\"65\" rx=\"4\"/><text x=\"565.0\" y=\"147.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Calor útil</text><rect x=\"490\" y=\"210\" width=\"150\" height=\"65\" rx=\"4\"/><text x=\"565.0\" y=\"242.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Perdas</text><path d=\"M170 117 L260 117\"/><path d=\"M260 117 L251.0 121.0 L251.0 113.0 Z\" fill=\"#C\"/><path d=\"M400 100 L490 52\"/><path d=\"M490 52 L484.0 59.8 L480.2 52.7 Z\" fill=\"#C\"/><path d=\"M400 117 L490 147\"/><path d=\"M490 147 L480.2 148.0 L482.7 140.3 Z\" fill=\"#C\"/><path d=\"M400 140 L490 242\"/><path d=\"M490 242 L481.0 237.9 L487.1 232.6 Z\" fill=\"#C\"/><text x=\"340.0\" y=\"304\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ηtotal = (Eelétrica + Ecalor útil) / Ecombustível</text>"
    ],
    [
      "rn-digestato-destinos",
      "Digestato: separação e aproveitamento",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Digestato</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">bruto</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Separação</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">sólido / líquido</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Tratamento</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">/ controle</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Uso agron.</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">/ destinação</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Planejar nutrientes, contaminantes, armazenamento e emissões</text>"
    ]
  ],
  [
    [
      "rn-yaw-vista-superior",
      "Eólica: yaw e direção do vento",
      520,
      315,
      "<rect x=\"145\" y=\"105\" width=\"190\" height=\"70\" rx=\"25\"/><circle cx=\"250\" cy=\"140\" r=\"12\"/><path d=\"M130 55 V225 M130 140 H145\"/><path d=\"M20 70 L120 70\"/><path d=\"M120 70 L111.0 74.0 L111.0 66.0 Z\" fill=\"#C\"/><text x=\"70\" y=\"40\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Vento</text><path d=\"M360 205 A145 90 0 0 0 135 205\" stroke-width=\"1.6\"/><path d=\"M160 200 L135 205\"/><path d=\"M135 205 L143.0 199.3 L144.6 207.2 Z\" fill=\"#C\"/><text x=\"400\" y=\"195\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Yaw</text><path d=\"M250 152 V235 H340\" stroke-width=\"1.6\" stroke-dasharray=\"6 5\"/><text x=\"395\" y=\"235\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Eixo da torre</text><text x=\"100\" y=\"250\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Plano do rotor</text><text x=\"260.0\" y=\"299\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Yaw orienta a nacele na direção do vento • vista superior</text>"
    ],
    [
      "rn-pitch-corte-pa",
      "Eólica: pitch na seção da pá",
      510,
      290,
      "<path d=\"M100 140 Q220 70 410 140 Q230 160 100 140 Z\"/><circle cx=\"190\" cy=\"140\" r=\"5\" fill=\"#C\" stroke=\"none\"/><path d=\"M265 75 A99.25 99.25 0 1 0 265 205\" stroke-width=\"1.6\"/><path d=\"M260 202 L265 205\"/><path d=\"M265 205 L255.2 203.8 L259.4 196.9 Z\" fill=\"#C\"/><path d=\"M190 140 H460\" stroke-width=\"1.6\" stroke-dasharray=\"6 5\"/><path d=\"M20 65 L125 65\"/><path d=\"M125 65 L116.0 69.0 L116.0 61.0 Z\" fill=\"#C\"/><text x=\"70\" y=\"40\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Vento relativo</text><text x=\"350\" y=\"215\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pitch: gira a pá</text><text x=\"320\" y=\"245\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">em torno do seu eixo longitudinal</text><text x=\"255.0\" y=\"274\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Corte da pá; pitch altera ângulo e carregamento aerodinâmico</text>"
    ],
    [
      "rn-eolica-trem-potencia",
      "Eólica: trem de potência com multiplicadora",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Rotor</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">baixo rpm</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Eixo</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+ mancais</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Multiplicadora</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">alto rpm</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Gerador</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">eletricidade</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Arquitetura ilustrativa; freio e controle atuam no conjunto</text>"
    ],
    [
      "rn-eolica-direct-drive",
      "Eólica: acionamento direto sem multiplicadora",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Rotor</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">baixo rpm</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Gerador</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">multipolar</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Conversor</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">eletrônico</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Rede</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CA</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Comparar massa, manutenção e conversão com a arquitetura engrenada</text>"
    ],
    [
      "rn-vento-potencia-cp",
      "Eólica: potência disponível e coeficiente Cp",
      680,
      235,
      "<rect x=\"20\" y=\"25\" width=\"620\" height=\"165\" rx=\"0\"/><text x=\"330\" y=\"55\" font-size=\"24\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pvento = ½ ρ A v³</text><text x=\"330\" y=\"103\" font-size=\"20\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pmecânica = Cp × Pvento</text><text x=\"330\" y=\"150\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A = πR² • ρ (kg/m³) • v (m/s) • P (W)</text><text x=\"340.0\" y=\"219\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Cp depende de λ e pitch; limite de Betz Cp ≤ 16/27</text>"
    ],
    [
      "rn-eolica-perdas",
      "Eólica: cadeia de conversão e perdas",
      620,
      255,
      "<rect x=\"20\" y=\"40\" width=\"140\" height=\"70\" rx=\"4\"/><text x=\"90.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Potência</text><text x=\"90.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">aerodinâmica</text><rect x=\"230\" y=\"40\" width=\"140\" height=\"70\" rx=\"4\"/><text x=\"300.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Transmissão</text><text x=\"300.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">mecânica</text><rect x=\"440\" y=\"40\" width=\"140\" height=\"70\" rx=\"4\"/><text x=\"510.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Gerador</text><text x=\"510.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+ conversor</text><path d=\"M160 75 L230 75\"/><path d=\"M230 75 L221.0 79.0 L221.0 71.0 Z\" fill=\"#C\"/><path d=\"M370 75 L440 75\"/><path d=\"M440 75 L431.0 79.0 L431.0 71.0 Z\" fill=\"#C\"/><path d=\"M300 110 L300 180\"/><path d=\"M300 180 L295.9 171.0 L304.1 171.0 Z\" fill=\"#C\"/><path d=\"M510 110 L510 180\"/><path d=\"M510 180 L505.9 171.0 L514.0 171.0 Z\" fill=\"#C\"/><text x=\"300\" y=\"205\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Perdas mecânicas</text><text x=\"510\" y=\"205\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Perdas elétricas</text><text x=\"310.0\" y=\"239\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Prede = Pcaptada × ηmecânica × ηgerador × ηconversor</text>"
    ],
    [
      "rn-curva-eolica-generica",
      "Eólica: curva de potência e corte",
      620,
      310,
      "<path d=\"M50 205 H570 M50 205 V25\"/><path d=\"M60 205 H145 C205 205 240 55 330 55 H480 V205 H560\"/><text x=\"145\" y=\"230\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Entrada</text><text x=\"330\" y=\"230\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Nominal</text><text x=\"480\" y=\"230\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Corte</text><text x=\"90\" y=\"22\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Potência</text><text x=\"420\" y=\"270\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Velocidade do vento (m/s)</text><text x=\"310.0\" y=\"294\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Curva esquemática; velocidades dependem do aerogerador</text>"
    ]
  ],
  [
    [
      "rn-fv-cadeia-perdas",
      "Fotovoltaica: cadeia e fontes de perda",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Irradiância</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">plano FV</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Módulos</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">T / sujeira</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CC</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">cabos / mismatch</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Inversor</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+ rede CA</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Separar perdas ópticas, térmicas, elétricas e clipping</text>"
    ],
    [
      "rn-bateria-balanco",
      "Bateria: balanço de energia e SOC",
      690,
      250,
      "<rect x=\"20\" y=\"65\" width=\"150\" height=\"80\" rx=\"4\"/><text x=\"95.0\" y=\"94.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Geração</text><text x=\"95.0\" y=\"116.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+ rede</text><rect x=\"260\" y=\"65\" width=\"150\" height=\"80\" rx=\"4\"/><text x=\"335.0\" y=\"94.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Bateria</text><text x=\"335.0\" y=\"116.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">E armazenada</text><rect x=\"500\" y=\"65\" width=\"150\" height=\"80\" rx=\"4\"/><text x=\"575.0\" y=\"105.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Cargas</text><path d=\"M170 105 L260 105\"/><path d=\"M260 105 L251.0 109.0 L251.0 101.0 Z\" fill=\"#C\"/><path d=\"M410 105 L500 105\"/><path d=\"M500 105 L491.0 109.0 L491.0 101.0 Z\" fill=\"#C\"/><path d=\"M260 130 L170 130\"/><path d=\"M170 130 L179.0 126.0 L179.0 134.1 Z\" fill=\"#C\"/><text x=\"330\" y=\"200\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ΔE = ηc Ecarga − Edescarga / ηd</text><text x=\"345.0\" y=\"234\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Considerar limites de SOC, potência, temperatura e perdas</text>"
    ]
  ]
];
// AMPLIACAO-B-FIM

export default {
  id: 'renov', nome: 'Energias renováveis',
  destaques: [
    'rn-fv', 'rn-sol', 'rn-inversor', 'rn-controlador', 'rn-bateria', 'rn-ongrid', 'rn-offgrid',
    'rn-curva-iv', 'rn-coletor', 'rn-termossifao', 'rn-eolico', 'rn-hidro', 'rn-barragem',
    'rn-biodigestor', 'rn-medidor', 'rn-rede',
  ],
  secoes: [
    ["Biometano — tratamento e unidades conectáveis", AMPLIACAO_B[0]],
    ["Balanços de massa, energia e perdas", AMPLIACAO_B[1]],
    ["Eólica — yaw, pitch e trem de potência", AMPLIACAO_B[2]],
    ["Solar, armazenamento e gestão de energia", AMPLIACAO_B[3]],
    ['Solar', [
      ['rn-fv', 'Painel fotovoltaico', 140, 110, '<path d="M20 14 H124 L112 76 H8 Z"/><path d="M46 14 L38 76 M72 14 L66 76 M98 14 L94 76 M14 45 H118" stroke-width="1.6"/><path d="M60 76 V104 M40 104 H80"/>'],
      ['rn-fvsimb', 'Gerador FV (símbolo)', 110, 90, '<rect x="25" y="20" width="60" height="50"/><path d="M25 70 L85 20 M4 45 H25 M85 45 H106"/><path d="M58 4 L48 14 M76 6 L66 16" stroke-width="1.6"/>' + head(48, 14, 135, 8) + head(66, 16, 135, 8)],
      ['rn-string', 'String FV (série)', 220, 90, '<rect x="24" y="30" width="40" height="40"/><rect x="90" y="30" width="40" height="40"/><rect x="156" y="30" width="40" height="40"/><path d="M24 70 L64 30 M90 70 L130 30 M156 70 L196 30" stroke-width="1.6"/><path d="M4 50 H24 M64 50 H90 M130 50 H156 M196 50 H216"/>' + T(12, 34, '+', 16) + T(208, 34, '−', 16) + '<path d="M104 6 L96 16 M120 8 L112 18" stroke-width="1.6"/>' + head(96, 16, 130, 7) + head(112, 18, 130, 7)],
      ['rn-coletor', 'Coletor solar térmico', 150, 100, '<rect x="20" y="8" width="110" height="80" rx="3"/><path d="M4 76 H32 V22 H50 V76 H68 V22 H86 V76 H104 V22 H118 V76 H146" stroke-width="2"/>'],
      ['rn-inversor', 'Inversor (CC/CA)', 100, 100, '<rect x="10" y="10" width="80" height="80"/><path d="M10 90 L90 10"/><path d="M20 30 H44 M20 38 H28 M36 38 H44" stroke-width="1.8"/><path d="M56 70 Q63 58 70 70 T84 70" stroke-width="1.8"/>'],
      ['rn-controlador', 'Controlador de carga', 110, 90, '<rect x="20" y="12" width="70" height="66" rx="4"/><path d="M4 45 H20 M90 45 H106"/>' + T(55, 30, 'MPPT', 13) + '<rect x="41" y="50" width="26" height="15" stroke-width="1.6"/><path d="M67 54 H71 V61 H67" stroke-width="1.6"/>'],
      ['rn-sol', 'Sol', 100, 100, '<circle cx="50" cy="50" r="20"/><path d="M50 8 V20 M50 80 V92 M8 50 H20 M80 50 H92 M20 20 L29 29 M71 71 L80 80 M80 20 L71 29 M29 71 L20 80"/>'],
      ...novosSolar,
    ]],
    ['Solar térmica', novosTermica],
    ['Eólica e hídrica', [
      ['rn-eolico', 'Aerogerador', 110, 190, '<path d="M50 70 L46 186 H64 L60 70"/><circle cx="55" cy="56" r="7"/><path d="M55 49 Q50 22 56 4 Q64 26 58 49 M61 60 Q86 72 104 86 Q80 84 58 64 M49 60 Q28 76 8 82 Q24 64 50 54" fill="none"/>'],
      ['rn-hidro', 'Turbina hidráulica', 120, 100, '<circle cx="60" cy="50" r="30"/><path d="M60 20 Q76 40 60 50 Q44 60 60 80 M30 50 Q50 34 60 50 Q70 66 90 50"/><path d="M4 50 H30"/>'],
      ['rn-barragem', 'PCH / barragem', 220, 130, '<path d="M4 120 H216 M70 120 V14 H90 L120 120"/><path d="M4 30 H68" stroke-dasharray="7 5" stroke-width="1.8"/><path d="M12 42 Q18 38 24 42 T36 42 M40 58 Q46 54 52 58 T64 58" stroke-width="1.4"/><path d="M70 92 L150 100 M70 102 L150 110" stroke-width="1.8"/><rect x="150" y="84" width="44" height="36"/><circle cx="172" cy="104" r="9" stroke-width="1.8"/><path d="M194 112 H216" stroke-dasharray="6 4" stroke-width="1.8"/>'],
      ['rn-gerador', 'Gerador (G~)', 90, 70, '<circle cx="45" cy="35" r="22"/><path d="M4 35 H23 M67 35 H86"/>' + T(45, 29, 'G', 17) + '<path d="M37 45 Q41 39 45 45 T53 45" stroke-width="1.6"/>'],
      ...novosEolHid,
    ]],
    ['Biomassa e biogás', [
      ['rn-biodigestor', 'Biodigestor (gasômetro)', 200, 140, '<path d="M50 50 V126 H150 V50 M50 50 A50 36 0 0 1 150 50"/><path d="M4 50 H50 M150 50 H196" stroke-width="1.6"/><path d="M54 68 H146" stroke-dasharray="7 5" stroke-width="1.6"/><path d="M100 14 V6 H196 M4 38 H28 L58 104 M142 104 L170 38 H196" stroke-width="2"/>' + T(176, 20, 'biogás', 13)],
      ['rn-flare', 'Queimador (flare)', 80, 150, '<path d="M34 146 V62 M46 146 V62 M30 62 H50 M22 146 H58 M4 130 H34"/><path d="M40 56 Q24 42 34 22 Q38 34 44 28 Q42 14 50 4 Q62 28 52 46 Q50 54 40 56 Z"/>'],
      ['rn-motogerador', 'Motogerador', 200, 90, '<rect x="20" y="16" width="90" height="58" rx="4"/><path d="M4 45 H20 M110 45 H130 M174 45 H196"/><circle cx="152" cy="45" r="22"/>' + T(65, 45, 'Motor', 15) + T(152, 45, 'G', 17)],
      ['rn-caldeira', 'Caldeira a biomassa', 140, 150, '<rect x="20" y="40" width="100" height="98" rx="6"/><path d="M86 40 V6 H104 V40 M40 40 V20 H4 M120 100 H136"/><path d="M28 64 H112" stroke-dasharray="7 5" stroke-width="1.6"/><path d="M36 126 Q42 108 50 118 Q56 98 66 116 Q72 102 80 118 Q88 106 100 126 M30 128 H110" stroke-width="1.8"/>'],
      ...novosBio,
    ]],
    ['Armazenamento e rede', [
      ['rn-bateria', 'Banco de baterias', 120, 80, '<rect x="10" y="16" width="100" height="58" rx="4"/><path d="M30 16 V8 H42 V16 M78 16 V8 H90 V16"/>' + T(36, 45, '+', 22) + T(84, 45, '−', 22)],
      ['rn-medidor', 'Medidor bidirecional', 110, 70, '<rect x="25" y="10" width="60" height="50" rx="4"/>' + T(55, 30, 'kWh', 16) + '<path d="M4 35 H25 M85 35 H106 M44 48 H66" stroke-width="1.6"/>' + head(70, 48, 0, 7) + head(40, 48, 180, 7)],
      ['rn-rede', 'Rede elétrica (torre)', 100, 130, '<path d="M50 6 L26 126 M50 6 L74 126 M20 30 H80 M30 60 H70 M24 100 H76 M36 60 L64 100 M64 60 L36 100" stroke-width="2"/>'],
      ['rn-poste', 'Poste de distribuição', 80, 160, '<path d="M40 156 V8 M8 22 H72 M18 64 H62 M24 156 H56"/><circle cx="12" cy="17" r="3" fill="#C"/><circle cx="40" cy="8" r="3" fill="#C"/><circle cx="68" cy="17" r="3" fill="#C"/><circle cx="22" cy="60" r="2.5" fill="#C"/><circle cx="58" cy="60" r="2.5" fill="#C"/>'],
      ['rn-trafoposte', 'Transformador de poste', 130, 170, '<path d="M40 166 V8 M8 20 H72 M24 166 H56 M40 70 H52 M40 106 H52 M62 60 V50 M86 60 V50"/><circle cx="12" cy="15" r="3" fill="#C"/><circle cx="68" cy="15" r="3" fill="#C"/><rect x="52" y="60" width="44" height="56" rx="6"/><circle cx="69" cy="88" r="9" stroke-width="1.6"/><circle cx="80" cy="88" r="9" stroke-width="1.6"/>'],
      ['rn-carregador', 'Carregador de VE', 120, 150, '<rect x="20" y="8" width="56" height="134" rx="8"/><path d="M10 142 H86 M76 92 Q104 92 104 120"/><rect x="30" y="20" width="36" height="22" rx="2" stroke-width="1.6"/><path d="M52 52 L40 76 H50 L44 96 L60 68 H50 L58 52 Z" fill="#C" stroke-width="1.4"/><rect x="96" y="120" width="16" height="16" rx="3"/><path d="M100 136 V144 M108 136 V144" stroke-width="2"/>'],
      ['rn-h2', 'Eletrolisador (H₂)', 140, 120, '<rect x="20" y="24" width="100" height="90" rx="4"/><path d="M50 34 V100 M90 34 V100" stroke-width="3.5"/><path d="M70 30 V108" stroke-dasharray="6 4" stroke-width="1.4"/><path d="M24 44 H116" stroke-dasharray="4 4" stroke-width="1.2"/><path d="M50 24 V8 M90 24 V8 M4 90 H20"/><circle cx="58" cy="70" r="3" stroke-width="1.4"/><circle cx="60" cy="56" r="2.5" stroke-width="1.4"/><circle cx="82" cy="66" r="3" stroke-width="1.4"/>' + T(34, 10, 'H₂', 13) + T(108, 10, 'O₂', 13)],
      ...novosArmaz,
    ]],
    ['Eficiência energética', eficiencia],
  ],
};
