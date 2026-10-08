import { T, head } from './base.js';

// prefixo dos ids: 'ic-'
// Ícones gerais para aula: desenhos próprios do Giz Livre, coordenadas feitas à mão (nada copiado de pacotes de ícones).

const f = n => n.toFixed(1);
const pt = (cx, cy, r, ang) => { const a = ang * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
// polígono regular de n lados, primeiro vértice no ângulo `rot` (graus)
const poly = (cx, cy, r, n, rot = -90) => '<path d="M' + Array.from({ length: n }, (_, i) => pt(cx, cy, r, rot + 360 * i / n).map(f).join(',')).join(' L') + ' Z"/>';
// estrela de n pontas
const star = (cx, cy, R, r, n, extra = '') => '<path' + extra + ' d="M' + Array.from({ length: 2 * n }, (_, i) => pt(cx, cy, i % 2 ? r : R, -90 + 180 * i / n).map(f).join(',')).join(' L') + ' Z"/>';
const fino = (d, w = 1.6) => `<path stroke-width="${w}" d="${d}"/>`;
const trac = d => `<path stroke-width="1.6" stroke-dasharray="4 4" d="${d}"/>`;
const NUVEM = 'M25,62 C10,62 5,52 8,44 C10,36 18,32 25,34 C25,20 38,12 50,15 C58,6 76,6 84,18 C96,16 105,26 102,38 C108,44 106,58 94,62 Z';
const numero = n => [`ic-num${n}`, `Número ${n}`, 80, 80, `<circle cx="40" cy="40" r="34"/>${T(40, 41, n, 40)}`];
const busto = (cx, cy, s = 1) => `<circle cx="${cx}" cy="${f(cy - 24 * s)}" r="${f(13 * s)}"/><path d="M${f(cx - 24 * s)},${f(cy + 40 * s)} V${f(cy + 26 * s)} Q${f(cx - 24 * s)},${cy} ${cx},${cy} Q${f(cx + 24 * s)},${cy} ${f(cx + 24 * s)},${f(cy + 26 * s)} V${f(cy + 40 * s)} Z"/>`;

// réguas: tracinhos
const marcasRegua = (() => { let d = ''; for (let i = 0, x = 10; x <= 110; x += 5, i++) d += `M${x},6 V${i % 2 ? 12 : 17} `; return fino(d, 1.4); })();
const marcasTransf = (() => { let d = ''; for (let a = 180; a <= 360; a += 15) { const [x1, y1] = pt(55, 58, 49, a), [x2, y2] = pt(55, 58, a % 45 ? 44 : 40, a); d += `M${f(x1)},${f(y1)} L${f(x2)},${f(y2)} `; } return fino(d, 1.4); })();
const raiosSol = (() => { let d = ''; for (let a = 0; a < 360; a += 30) { const [x1, y1] = pt(45, 45, 26, a), [x2, y2] = pt(45, 45, a % 90 ? 36 : 40, a); d += `M${f(x1)},${f(y1)} L${f(x2)},${f(y2)} `; } return `<path d="${d}"/>`; })();
const dentesSerrote = (() => { let d = 'M40,6 L124,24 V30'; const yb = x => 30 + (124 - x) * 10 / 84; for (let x = 124; x > 40.5; x -= 6) d += ` L${f(x - 3)},${f(yb(x - 3) + 4)} L${f(x - 6)},${f(yb(x - 6))}`; return `<path d="${d} Z"/>`; })();
const reciclagem = (() => {
  let s = '';
  for (let k = 0; k < 3; k++) {
    const a0 = -80 + 120 * k, a1 = a0 + 84;
    const [x0, y0] = pt(45, 47, 30, a0), [x1, y1] = pt(45, 47, 30, a1), [xt, yt] = pt(45, 47, 30, a1 + 22);
    s += `<path stroke-width="4.5" d="M${f(x0)},${f(y0)} A30,30 0 0,1 ${f(x1)},${f(y1)}"/>` + head(+f(xt), +f(yt), a1 + 101, 16);
  }
  return s;
})();
const cone = (y1, y2) => { const xl = y => 30 - (y - 8) * 16 / 68; return `<path fill="#C" d="M${f(xl(y1))},${y1} H${f(80 - xl(y1))} L${f(80 - xl(y2))},${y2} H${f(xl(y2))} Z"/>`; };
const petalas = (() => { let s = ''; for (let a = 0; a < 360; a += 60) { const [x, y] = pt(35, 30, 15, a); s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="9" ry="6" transform="rotate(${a} ${f(x)} ${f(y)})"/>`; } return s; })();
const janelasPredio = (() => { let s = ''; for (const y of [14, 28, 42, 56]) for (const x of [18, 31, 44]) s += `<rect x="${x}" y="${y}" width="8" height="8"/>`; return `<g stroke-width="1.6">${s}</g>`; })();
const diasCal = (() => { let s = ''; for (const y of [36, 48, 60]) for (const x of [15, 29, 43, 57]) s += `<rect x="${x}" y="${y}" width="7" height="6" rx="1"/>`; return `<g fill="#C" stroke="none">${s}</g>`; })();
const teclas = (() => { let s = ''; for (const y of [38, 50, 62, 74]) for (const x of [14, 30, 46]) s += `<rect x="${x}" y="${y}" width="10" height="7" rx="1.5"/>`; return `<g stroke-width="1.6">${s}</g>`; })();
const anelCaderno = (() => { let s = ''; for (let y = 14; y <= 78; y += 10) s += `<path stroke-width="2" d="M8,${y} H20"/>`; return s; })();

export default {
  id: 'icones', nome: 'Ícones gerais',
  secoes: [
    ['Formas geométricas', [
      ['ic-circulo', 'Círculo', 80, 80, '<circle cx="40" cy="40" r="34"/>'],
      ['ic-quadrado', 'Quadrado', 80, 80, '<rect x="6" y="6" width="68" height="68"/>'],
      ['ic-retangulo', 'Retângulo', 110, 70, '<rect x="5" y="5" width="100" height="60"/>'],
      ['ic-tri-eq', 'Triângulo equilátero', 84, 76, '<path d="M42,6 L79,70 H5 Z"/>'],
      ['ic-tri-ret', 'Triângulo retângulo', 80, 80, '<path d="M6,6 V74 H74 Z"/>' + fino('M6,62 H18 V74')],
      ['ic-losango', 'Losango', 70, 90, '<path d="M35,5 L65,45 L35,85 L5,45 Z"/>'],
      ['ic-pentagono', 'Pentágono', 80, 80, poly(40, 42, 35, 5)],
      ['ic-hexagono', 'Hexágono', 80, 80, poly(40, 40, 35, 6, 0)],
      ['ic-octogono', 'Octógono', 80, 80, poly(40, 40, 36, 8, 22.5)],
      ['ic-estrela5', 'Estrela de 5 pontas', 80, 80, star(40, 43, 36, 15, 5)],
      ['ic-estrela6', 'Estrela de 6 pontas', 80, 80, star(40, 40, 35, 19, 6)],
      ['ic-coracao', 'Coração', 80, 74, '<path d="M40,68 C10,46 4,32 6,22 C8,10 18,5 26,5 C33,5 38,10 40,16 C42,10 47,5 54,5 C62,5 72,10 74,22 C76,32 70,46 40,68 Z"/>'],
      ['ic-nuvem', 'Nuvem', 110, 70, `<path d="${NUVEM}"/>`],
      ['ic-balao-fala', 'Balão de fala', 100, 80, '<path d="M17,5 H83 Q95,5 95,17 V45 Q95,57 83,57 H42 L22,75 L27,57 H17 Q5,57 5,45 V17 Q5,5 17,5 Z"/>'],
      ['ic-balao-pens', 'Balão de pensamento', 100, 84, '<path d="M24,52 C10,52 6,40 12,33 C6,24 14,12 26,14 C30,5 44,3 52,9 C60,2 76,4 80,14 C92,14 98,26 92,34 C98,44 88,54 76,52 C70,60 54,60 48,54 C40,58 28,58 24,52 Z"/><circle cx="24" cy="66" r="5"/><circle cx="13" cy="77" r="3"/>'],
      ['ic-mais', 'Cruz (mais)', 80, 80, '<path d="M30,6 H50 V30 H74 V50 H50 V74 H30 V50 H6 V30 H30 Z"/>'],
      ['ic-seta-circ', 'Seta circular', 80, 80, '<path stroke-width="4" d="M40,12 A28,28 0 1,1 12,40 V38"/>' + head(12, 26, -90, 15)],
      ['ic-cubo', 'Cubo', 90, 90, '<path d="M6,26 H64 V84 H6 Z M6,26 L26,6 H84 L64,26 M64,84 L84,64 V6"/>' + trac('M26,6 V64 H84 M26,64 L6,84')],
      ['ic-cilindro', 'Cilindro', 70, 90, '<ellipse cx="35" cy="14" rx="29" ry="9"/><path d="M6,14 V76 M64,14 V76 M6,76 A29,9 0 0,0 64,76"/>' + trac('M6,76 A29,9 0 0,1 64,76')],
      ['ic-cone', 'Cone', 70, 90, '<path d="M6,78 L35,6 L64,78 M6,78 A29,9 0 0,0 64,78"/>' + trac('M6,78 A29,9 0 0,1 64,78')],
      ['ic-esfera', 'Esfera', 80, 80, '<circle cx="40" cy="40" r="34"/><path stroke-width="1.8" d="M6,40 A34,11 0 0,0 74,40"/>' + trac('M6,40 A34,11 0 0,1 74,40')],
      ['ic-piramide', 'Pirâmide', 90, 80, '<path d="M6,66 L58,74 L84,58 M45,6 L6,66 M45,6 L58,74 M45,6 L84,58"/>' + trac('M6,66 L32,50 L84,58 M45,6 L32,50')],
      ['ic-paralelep', 'Paralelepípedo', 110, 80, '<path d="M6,28 H82 V74 H6 Z M6,28 L28,8 H104 L82,28 M82,74 L104,54 V8"/>' + trac('M28,8 V54 H104 M28,54 L6,74')],
    ]],
    ['Marcadores de aula', [
      ['ic-visto', 'Visto (certo)', 80, 80, '<path stroke-width="8" d="M12,42 L31,61 L68,18"/>'],
      ['ic-xis', 'X (errado)', 80, 80, '<path stroke-width="8" d="M16,16 L64,64 M64,16 L16,64"/>'],
      ['ic-interrog', 'Interrogação', 80, 80, '<circle cx="40" cy="40" r="34"/><path stroke-width="5" d="M28,30 C28,16 52,16 52,30 C52,40 40,40 40,51"/><circle cx="40" cy="62" r="3.5" fill="#C" stroke="none"/>'],
      ['ic-atencao', 'Atenção', 84, 76, '<path d="M42,6 L79,70 H5 Z"/><path stroke-width="5" d="M42,28 V48"/><circle cx="42" cy="59" r="3.5" fill="#C" stroke="none"/>'],
      ['ic-lampada', 'Lâmpada (ideia)', 70, 90, '<path d="M23,60 C11,50 8,38 12,27 C17,13 28,7 35,7 C42,7 53,13 58,27 C62,38 59,50 47,60 V67 H23 Z"/><path d="M24,73 H46 M26,79 H44 M31,85 H39"/>' + fino('M28,58 L31,40 L35,48 L39,40 L42,58')],
      ['ic-alvo', 'Alvo', 80, 80, '<circle cx="40" cy="40" r="34"/><circle cx="40" cy="40" r="22"/><circle cx="40" cy="40" r="10"/><circle cx="40" cy="40" r="3.5" fill="#C"/>'],
      ['ic-bandeira', 'Bandeira', 70, 90, '<path stroke-width="3" d="M10,86 V6"/><path d="M10,9 C22,3 32,5 40,11 C48,17 56,17 63,13 V45 C56,49 48,49 40,43 C32,37 22,35 10,41"/>'],
      ['ic-alfinete', 'Alfinete', 60, 90, '<circle cx="30" cy="20" r="15"/><path d="M23,34 L25,50 H35 L37,34 M16,50 H44"/><path stroke-width="2" d="M30,50 V86"/>'],
      ['ic-destaque', 'Estrela de destaque', 80, 80, star(40, 43, 36, 15, 5, ' fill="#C"')],
      numero(1), numero(2), numero(3), numero(4), numero(5),
      ['ic-cadeado', 'Cadeado', 70, 90, '<path d="M18,42 V27 A17,17 0 0,1 52,27 V42"/><rect x="8" y="42" width="54" height="42" rx="6"/><circle cx="35" cy="58" r="5" fill="#C"/><path stroke-width="4" d="M35,62 V72"/>'],
      ['ic-relogio', 'Relógio', 80, 80, '<circle cx="40" cy="40" r="34"/><path stroke-width="3.5" d="M40,40 V18 M40,40 L55,49"/><path stroke-width="2" d="M40,9 V14 M71,40 H66 M40,71 V66 M9,40 H14"/><circle cx="40" cy="40" r="3" fill="#C"/>'],
      ['ic-calendario', 'Calendário', 80, 80, '<rect x="6" y="12" width="68" height="62" rx="5"/><path d="M6,28 H74"/><path stroke-width="3.5" d="M24,6 V18 M56,6 V18"/>' + diasCal],
      ['ic-trofeu', 'Troféu', 80, 90, '<path d="M22,8 H58 V30 C58,44 50,52 40,52 C30,52 22,44 22,30 Z M22,14 H12 C10,28 16,34 23,37 M58,14 H68 C70,28 64,34 57,37 M40,52 V66 M28,66 H52 V74 H28 Z M20,74 H60 V84 H20 Z"/>'],
      ['ic-megafone', 'Megafone', 90, 70, '<path d="M14,26 L58,8 V62 L14,44 Z"/><rect x="6" y="26" width="8" height="18" rx="2"/><path d="M24,48 L28,62 H36 L34,52"/><path d="M68,26 Q74,35 68,44 M76,18 Q86,35 76,52"/>'],
      ['ic-olho', 'Olho', 90, 60, '<path d="M5,30 C20,6 70,6 85,30 C70,54 20,54 5,30 Z"/><circle cx="45" cy="30" r="13"/><circle cx="45" cy="30" r="5" fill="#C"/>'],
    ]],
    ['Escola e escritório', [
      ['ic-livro', 'Livro', 100, 70, '<path d="M50,14 C38,6 20,6 6,10 V62 C20,58 38,58 50,66 C62,58 80,58 94,62 V10 C80,6 62,6 50,14 Z M50,14 V66"/>' + fino('M14,22 C24,19 34,19 42,23 M14,32 C24,29 34,29 42,33 M14,42 C24,39 34,39 42,43 M58,23 C66,19 76,19 86,22 M58,33 C66,29 76,29 86,32 M58,43 C66,39 76,39 86,42')],
      ['ic-caderno', 'Caderno', 70, 90, '<rect x="14" y="6" width="50" height="78" rx="4"/>' + anelCaderno + fino('M24,24 H56 M24,34 H56 M24,44 H56 M24,54 H56 M24,64 H56')],
      ['ic-lapis', 'Lápis', 110, 30, '<path d="M26,5 H104 V25 H26 L6,15 Z M26,5 V25 M92,5 V25 M86,5 V25"/><path d="M6,15 L13,11.5 V18.5 Z" fill="#C"/>' + fino('M26,15 H86')],
      ['ic-caneta', 'Caneta', 110, 30, '<path d="M22,9 L6,15 L22,21"/><rect x="22" y="8" width="80" height="14" rx="4"/><path d="M66,8 V22"/><path stroke-width="2" d="M72,8 V3 H98"/>'],
      ['ic-regua', 'Régua', 120, 34, '<rect x="4" y="6" width="112" height="22" rx="2"/>' + marcasRegua],
      ['ic-esquadro', 'Esquadro', 80, 80, '<path d="M6,6 V74 H74 Z M17,32 V63 H48 Z"/>' + fino('M6,18 H11 M6,30 H11 M6,42 H11 M6,54 H11 M18,74 V69 M30,74 V69 M42,74 V69 M54,74 V69', 1.4)],
      ['ic-compasso', 'Compasso', 70, 90, '<path stroke-width="2" d="M35,4 V10"/><circle cx="35" cy="15" r="5"/><path d="M32,20 L14,82 M38,20 L56,78"/><path stroke-width="1.6" d="M14,82 L13,88"/><path d="M53,76 L60,74 L58,86 Z" fill="#C"/>' + fino('M21,58 Q35,64 49,58')],
      ['ic-transferidor', 'Transferidor', 110, 64, '<path d="M6,58 A49,49 0 0,1 104,58 Z"/>' + fino('M26,58 A29,29 0 0,1 84,58') + marcasTransf + fino('M55,58 V50 M51,58 H59')],
      ['ic-calculadora', 'Calculadora', 70, 90, '<rect x="6" y="4" width="58" height="82" rx="6"/><rect x="14" y="12" width="42" height="18" rx="2"/>' + teclas],
      ['ic-computador', 'Computador', 100, 90, '<rect x="6" y="6" width="88" height="58" rx="4"/><path d="M42,64 L38,80 H62 L58,64 M28,82 H72"/>' + fino('M12,12 H88 V56 H12 Z')],
      ['ic-notebook', 'Notebook', 110, 76, '<rect x="18" y="6" width="74" height="50" rx="4"/><path d="M18,56 H92 L104,66 Q104,70 100,70 H10 Q6,70 6,66 Z"/>' + fino('M24,12 H86 V50 H24 Z M48,63 H62')],
      ['ic-celular', 'Celular', 50, 90, '<rect x="6" y="4" width="38" height="82" rx="7"/><circle cx="25" cy="78" r="3"/>' + fino('M10,14 H40 V70 H10 Z M20,9 H30')],
      ['ic-projetor', 'Projetor', 110, 64, '<rect x="6" y="14" width="76" height="38" rx="6"/><circle cx="62" cy="33" r="12"/><circle cx="62" cy="33" r="5"/><path d="M16,52 V58 M72,52 V58"/>' + fino('M16,24 H38 M16,32 H38 M16,40 H38') + fino('M84,25 L104,16 M84,33 H106 M84,41 L104,50', 2)],
      ['ic-quadro', 'Quadro (lousa)', 110, 84, '<rect x="6" y="6" width="98" height="62" rx="2"/><path d="M2,68 H108 M20,68 L12,82 M90,68 L98,82"/>' + fino('M11,11 H99 V63 H11 Z') + fino('M20,30 Q30,20 40,30 T60,30 M20,46 H70', 2)],
      ['ic-mochila', 'Mochila', 76, 90, '<path d="M14,32 Q14,16 38,16 Q62,16 62,32 V80 Q62,86 56,86 H20 Q14,86 14,80 Z M30,16 V9 Q30,5 34,5 H42 Q46,5 46,9 V16"/><rect x="22" y="52" width="32" height="24" rx="5"/>' + fino('M22,61 H54 M14,40 H8 V74 H14 M62,40 H68 V74 H62')],
      ['ic-prancheta', 'Prancheta', 70, 90, '<rect x="6" y="10" width="58" height="76" rx="5"/><rect x="22" y="4" width="26" height="12" rx="3"/>' + fino('M28,32 H54 M28,46 H54 M28,60 H54 M28,74 H48') + fino('M14,32 L17,35 L22,28 M14,46 L17,49 L22,42', 2)],
      ['ic-tesoura', 'Tesoura', 90, 70, '<circle cx="16" cy="20" r="10"/><circle cx="16" cy="50" r="10"/><path stroke-width="3.5" d="M24,26 L86,52 M24,44 L86,18"/><circle cx="44" cy="35" r="2.5" fill="#C"/>'],
      ['ic-clipe', 'Clipe', 40, 90, '<path stroke-width="3" d="M24,28 V68 Q24,76 18,76 Q12,76 12,68 V16 Q12,6 22,6 Q32,6 32,16 V72 Q32,86 20,86 Q6,86 6,72 V26"/>'],
      ['ic-pasta', 'Pasta', 90, 72, '<path d="M6,14 Q6,8 12,8 H32 L40,16 H78 Q84,16 84,22 V60 Q84,66 78,66 H12 Q6,66 6,60 Z M6,24 H84"/>'],
    ]],
    ['Ferramentas', [
      ['ic-ferro-solda', 'Ferro de solda', 130, 40, '<path stroke-width="3" d="M4,20 H22"/><rect x="22" y="16" width="34" height="8" rx="1"/><rect x="56" y="13" width="8" height="14" rx="1"/><path d="M64,10 H112 Q120,10 120,20 Q120,30 112,30 H64 Z M120,20 Q127,20 127,28 Q127,35 122,38"/>' + fino('M76,10 V30 M86,10 V30 M96,10 V30') + fino('M8,13 Q5,9 8,5 M14,13 Q11,9 14,5', 1.4)],
      ['ic-multimetro', 'Multímetro', 70, 100, '<rect x="6" y="4" width="58" height="92" rx="8"/><rect x="14" y="12" width="42" height="20" rx="2"/>' + T(35, 22, '8.88', 14) + '<circle cx="35" cy="55" r="12"/><path stroke-width="3" d="M35,55 V45"/>' + fino('M35,38 V41 M50,44 L48,46 M20,44 L22,46 M53,55 H50 M17,55 H20', 1.4) + '<circle cx="20" cy="82" r="4"/><circle cx="35" cy="82" r="4"/><circle cx="50" cy="82" r="4"/>'],
      ['ic-alicate', 'Alicate', 70, 100, '<path d="M28,44 C24,30 26,16 33,4 H37 C44,16 46,30 42,44 Z"/><circle cx="35" cy="47" r="6"/><path d="M30,52 C24,66 18,80 16,96 M40,52 C46,66 52,80 54,96"/><path stroke-width="8" d="M24,66 Q19,80 17,93 M46,66 Q51,80 53,93"/>' + fino('M35,6 V40') + fino('M30,22 H40 M29,30 H41', 1.4)],
      ['ic-chave-fenda', 'Chave de fenda', 30, 110, '<path d="M7,8 Q7,4 11,4 H19 Q23,4 23,8 V44 Q23,48 19,50 H11 Q7,48 7,44 Z"/>' + fino('M12,10 V42 M18,10 V42') + '<path stroke-width="3.5" d="M15,50 V94"/><path d="M12,94 H18 L17,105 H13 Z" fill="#C"/>'],
      ['ic-chave-inglesa', 'Chave inglesa', 120, 50, '<path d="M40,18 H108 Q114,18 114,25 Q114,32 108,32 H40 L34,44 H10 Q4,44 4,38 V32 H22 V18 H4 V12 Q4,6 10,6 H34 Z"/><circle cx="104" cy="25" r="3"/>' + fino('M26,38 H34 M26,12 H34')],
      ['ic-martelo', 'Martelo', 90, 100, '<path d="M8,8 H60 Q64,8 64,12 V26 Q64,30 60,30 H8 L4,26 V12 Z M64,12 Q78,10 86,2 M64,26 Q80,24 86,34"/><rect x="28" y="30" width="14" height="66" rx="4"/>' + fino('M28,70 H42 M28,76 H42 M28,82 H42')],
      ['ic-trena', 'Trena', 90, 80, '<rect x="6" y="12" width="62" height="62" rx="14"/><circle cx="37" cy="43" r="14"/><rect x="30" y="6" width="14" height="6" rx="1"/><path d="M68,60 H86 V68 H68 M86,56 V70"/>' + fino('M73,60 V63 M78,60 V63 M83,60 V63', 1.4)],
      ['ic-nivel', 'Nível de bolha', 130, 36, '<rect x="4" y="8" width="122" height="20" rx="4"/><rect x="48" y="11" width="34" height="14" rx="7"/><ellipse cx="65" cy="18" rx="5" ry="3.5" fill="#C"/><circle cx="18" cy="18" r="4"/><circle cx="112" cy="18" r="4"/>' + fino('M57,11 V25 M73,11 V25')],
      ['ic-serrote', 'Serrote', 130, 60, dentesSerrote + '<path d="M40,4 H24 Q6,4 6,22 V40 Q6,56 22,56 H40 Z"/><rect x="16" y="18" width="16" height="22" rx="6"/>'],
      ['ic-furadeira', 'Furadeira', 110, 90, '<path d="M30,10 H82 Q92,10 92,20 V32 Q92,42 82,42 H30 Z M30,16 H18 V36 H30 M56,42 L50,78 H72 L74,42"/><path stroke-width="3" d="M18,26 H4"/><rect x="44" y="78" width="36" height="8" rx="2"/>' + fino('M58,48 Q52,52 55,58') + fino('M40,18 H60 M40,24 H60', 1.4)],
      ['ic-capacete', 'Capacete de obra', 100, 70, '<path d="M14,52 C14,22 32,8 50,8 C68,8 86,22 86,52 Z M4,52 H96 Q96,60 88,60 H12 Q4,60 4,52 Z"/>' + fino('M44,9 V52 M56,9 V52')],
      ['ic-cone-sinal', 'Cone de sinalização', 80, 90, '<path d="M30,8 H50 L66,76 H14 Z"/>' + cone(28, 40) + cone(52, 62) + '<rect x="6" y="76" width="68" height="8" rx="2"/>'],
    ]],
    ['Pessoas e natureza', [
      ['ic-pessoa', 'Pessoa', 60, 90, busto(30, 44)],
      ['ic-grupo', 'Grupo de pessoas', 120, 90, '<circle cx="26" cy="28" r="10"/><path d="M6,80 V66 Q6,46 26,46 Q34,46 38,49 M94,46 Q114,46 114,66 V80 M82,49 Q86,46 94,46"/><circle cx="94" cy="28" r="10"/>' + busto(60, 46)],
      ['ic-casa', 'Casa', 90, 84, '<path d="M6,40 L45,6 L84,40 M14,33 V78 H76 V33"/><rect x="38" y="52" width="14" height="26"/><rect x="20" y="46" width="12" height="12"/><rect x="58" y="46" width="12" height="12"/>'],
      ['ic-predio', 'Prédio', 70, 100, '<rect x="10" y="6" width="50" height="90"/><path d="M4,96 H66"/><rect x="29" y="74" width="12" height="22"/>' + janelasPredio],
      ['ic-fabrica', 'Fábrica', 120, 84, '<path d="M6,78 V44 L30,30 V44 L54,30 V44 L78,30 V44 H94 V10 H106 V78 Z"/><path d="M2,78 H118"/>' + fino('M14,54 H24 V62 H14 Z M38,54 H48 V62 H38 Z M62,54 H72 V62 H62 Z') + '<rect x="80" y="58" width="12" height="20"/>'],
      ['ic-industria', 'Indústria com chaminé', 120, 100, '<path d="M6,96 V60 H40 V46 H72 V96 Z"/><path d="M78,96 V36 H90 V96 M98,96 V48 H110 V96 M2,96 H118"/>' + fino('M14,70 H24 V78 H14 Z M48,58 H58 V66 H48 Z M48,76 H58 V84 H48 Z') + '<path stroke-width="2" d="M84,30 C76,24 86,18 80,12 C76,6 84,2 90,4 M104,42 C98,36 108,32 102,26 C98,20 106,16 112,18"/>'],
      ['ic-arvore', 'Árvore', 80, 96, '<path d="M40,6 C56,6 66,18 64,30 C76,34 78,52 66,60 C62,70 48,72 40,66 C32,72 18,70 14,60 C2,52 4,34 16,30 C14,18 24,6 40,6 Z M34,92 L36,66 M46,92 L44,66 M20,92 H60"/>' + fino('M40,68 V50 M40,56 L32,48')],
      ['ic-folha', 'Folha', 80, 80, '<path d="M10,70 C10,30 36,8 72,8 C72,44 50,70 10,70 Z"/><path stroke-width="2" d="M6,74 L60,20"/>' + fino('M28,52 L26,38 M28,52 L42,54 M42,38 L41,26 M42,38 L54,39')],
      ['ic-flor', 'Flor', 70, 96, petalas + '<circle cx="35" cy="30" r="7" fill="#C"/><path d="M35,46 V92 M35,74 Q22,60 13,66 Q22,77 35,74"/>'],
      ['ic-gota', 'Gota d\'água', 60, 84, '<path d="M30,6 C30,6 8,36 8,56 A22,22 0 0,0 52,56 C52,36 30,6 30,6 Z"/>' + fino('M18,58 Q18,68 27,71', 2)],
      ['ic-sol', 'Sol', 90, 90, '<circle cx="45" cy="45" r="18"/>' + raiosSol],
      ['ic-chuva', 'Nuvem com chuva', 110, 96, `<path d="${NUVEM}"/>` + '<path stroke-width="2.5" stroke-dasharray="6 6" d="M30,70 L24,92 M52,70 L46,92 M74,70 L68,92 M94,70 L88,92"/>'],
      ['ic-raio', 'Raio', 60, 90, '<path d="M38,4 L10,50 H28 L20,86 L52,36 H34 L46,4 Z"/>'],
      ['ic-montanha', 'Montanha', 120, 76, '<path d="M4,72 L42,14 L62,42 L78,26 L116,72 Z"/>' + fino('M31,31 L37,36 L42,30 L47,36 L53,31', 2)],
      ['ic-rio', 'Rio', 120, 76, '<path d="M4,24 C30,10 46,40 70,26 S104,12 116,22 M4,52 C30,38 46,68 70,54 S104,40 116,50"/>' + fino('M18,38 q4,-3 8,0 t8,0 M56,44 q4,-3 8,0 t8,0 M90,34 q4,-3 8,0 t8,0', 1.6) + fino('M30,8 V2 M34,9 L37,3 M26,9 L23,3 M86,68 V62 M90,69 L93,63 M82,69 L79,63', 1.4)],
      ['ic-peixe', 'Peixe', 100, 60, '<path d="M24,30 C40,8 74,8 94,30 C74,52 40,52 24,30 Z M24,30 L6,14 V46 Z"/><circle cx="80" cy="26" r="3" fill="#C"/>' + fino('M70,19 Q64,30 70,41 M48,13 Q54,4 62,12')],
      ['ic-globo', 'Terra (globo)', 80, 80, '<circle cx="40" cy="40" r="34"/><ellipse cx="40" cy="40" rx="14" ry="34"/>' + fino('M6,40 H74 M11,23 H69 M11,57 H69')],
      ['ic-reciclagem', 'Reciclagem', 90, 90, reciclagem],
      ['ic-lixeira', 'Lixeira', 70, 90, '<path d="M6,18 H64 M26,18 V10 H44 V18 M12,18 L18,84 H52 L58,18"/>' + fino('M27,28 L29,76 M35,28 V76 M43,28 L41,76')],
      ['ic-carro', 'Carro', 120, 64, '<path d="M26,48 H10 Q6,48 6,44 V36 Q6,30 12,29 L30,26 L42,12 H78 L94,26 L108,29 Q114,30 114,36 V44 Q114,48 110,48 H96 M76,48 H46"/><circle cx="36" cy="48" r="10"/><circle cx="86" cy="48" r="10"/>' + fino('M36,26 L45,16 H58 V26 Z M62,16 H76 L86,26 H62 Z')],
      ['ic-caminhao-pipa', 'Caminhão-pipa', 140, 70, '<path d="M100,58 V22 H120 L132,36 V58"/><path stroke-width="1.8" d="M104,26 H118 L126,36 H104 Z"/><rect x="8" y="14" width="88" height="34" rx="17"/><path d="M6,58 H15 M33,58 H39 M57,58 H105 M123,58 H134 M30,48 V54 M74,48 V54"/><circle cx="24" cy="59" r="9"/><circle cx="48" cy="59" r="9"/><circle cx="114" cy="59" r="9"/>' + T(52, 31, 'ÁGUA', 13)],
      ['ic-onibus', 'Ônibus', 130, 76, '<rect x="6" y="8" width="118" height="52" rx="8"/><path d="M6,44 H124"/><circle cx="30" cy="62" r="9"/><circle cx="100" cy="62" r="9"/>' + fino('M14,16 H34 V36 H14 Z M40,16 H60 V36 H40 Z M66,16 H86 V36 H66 Z M94,16 H116 V54 H94 Z M105,16 V54') + fino('M10,52 H18 M112,52 H120', 3)],
      ['ic-bicicleta', 'Bicicleta', 120, 76, '<circle cx="26" cy="50" r="20"/><circle cx="94" cy="50" r="20"/><path d="M26,50 H56 L84,24 M26,50 L46,22 L56,50 M46,22 H80 M84,24 L94,50 M40,18 H54 M80,14 H90 M84,14 L85,24"/><circle cx="56" cy="50" r="4"/>'],
    ]],
  ],
};
