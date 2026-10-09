// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
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

// --- utilidades das seções de meio ambiente, saneamento, saúde e segurança (desenho próprio) ---
const letra = l => [`ic-letra-${l.toLowerCase()}`, `Letra ${l}`, 80, 80, `<circle cx="40" cy="40" r="34"/>${T(40, 41, l, 40)}`];
// raios curtos (sol): segmentos de r1 a r2 nos ângulos dados
const raios = (cx, cy, r1, r2, angs) => '<path d="' + angs.map(a => { const [x1, y1] = pt(cx, cy, r1, a), [x2, y2] = pt(cx, cy, r2, a); return `M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}`; }).join(' ') + '"/>';
const OITO = [0, 45, 90, 135, 180, 225, 270, 315];
// linha ondulada de x0 a x1 na altura y (meia-onda de largura w e amplitude a)
const ondas = (x0, x1, y, w = 8, a = 4) => { let d = `M${x0},${y}`; for (let x = x0; x + 2 * w <= x1 + 0.1; x += 2 * w) d += ` q${w / 2},${-a} ${w},0 q${w / 2},${a} ${w},0`; return d; };
// seta fina reta até a ponta (x1,y1)
const setaF = (x0, y0, x1, y1, L = 11, w = 1.8) => { const a = Math.atan2(y1 - y0, x1 - x0); return `<path stroke-width="${w}" d="M${x0},${y0} L${f(x1 - 0.75 * L * Math.cos(a))},${f(y1 - 0.75 * L * Math.sin(a))}"/>` + head(x1, y1, +f(a * 180 / Math.PI), L); };
// pinheiro em camadas: ponta em `top`, base da copa em `base`, largura w, tronco até base+tr
const pinheiro = (cx, top, base, w, tr = 10) => { const h = base - top, X = k => f(cx + k * w), Y = k => f(top + k * h); return `<path d="M${cx},${top} L${X(0.28)},${Y(0.38)} H${X(0.14)} L${X(0.4)},${Y(0.68)} H${X(0.22)} L${X(0.5)},${base} H${X(-0.5)} L${X(-0.22)},${Y(0.68)} H${X(-0.4)} L${X(-0.14)},${Y(0.38)} H${X(-0.28)} Z M${cx - 4},${base} V${base + tr} M${cx + 4},${base} V${base + tr}"/>`; };
// árvore de copa redonda com base do tronco em (cx, by)
const arvoreR = (cx, by, r, tr = 12) => `<path d="M${cx},${by} V${by - tr}"/><circle cx="${cx}" cy="${by - tr - r}" r="${r}"/>`;
// broto pequeno com base em (x,y) e escala s
const broto = (x, y, s = 1) => fino(`M${f(x)},${f(y)} V${f(y - 9 * s)} M${f(x)},${f(y - 4 * s)} Q${f(x - 6 * s)},${f(y - 10 * s)} ${f(x - 8 * s)},${f(y - 6 * s)} M${f(x)},${f(y - 6 * s)} Q${f(x + 6 * s)},${f(y - 12 * s)} ${f(x + 8 * s)},${f(y - 8 * s)}`, 1.6);
// lua crescente: parte do círculo (cx,cy,R) fora do círculo (c2x,c2y,r2)
const crescente = (cx, cy, R, c2x, c2y, r2) => {
  const dx = c2x - cx, dy = c2y - cy, d = Math.hypot(dx, dy), a = (R * R - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(R * R - a * a);
  const px = cx + a * dx / d, py = cy + a * dy / d, p1 = [f(px + h * dy / d), f(py - h * dx / d)], p2 = [f(px - h * dy / d), f(py + h * dx / d)];
  return `<path d="M${p1} A${R},${R} 0 1,0 ${p2} A${r2},${r2} 0 0,1 ${p1} Z"/>`;
};
const floco = (() => { let d = ''; for (let a = -90; a < 270; a += 60) { const [x2, y2] = pt(40, 40, 33, a), [xb, yb] = pt(40, 40, 21, a); d += `M40,40 L${f(x2)},${f(y2)} `; for (const s of [-40, 40]) { const [xe, ye] = pt(xb, yb, 10, a + s); d += `M${f(xb)},${f(yb)} L${f(xe)},${f(ye)} `; } } return `<path d="${d}"/>`; })();
const espinhosVirus = (() => { let s = '', d = ''; for (let a = 0; a < 360; a += 36) { const [x1, y1] = pt(45, 45, 22, a), [x2, y2] = pt(45, 45, 32, a), [xk, yk] = pt(45, 45, 35.5, a); d += `M${f(x1)},${f(y1)} L${f(x2)},${f(y2)} `; s += `<circle cx="${f(xk)}" cy="${f(yk)}" r="3.5"/>`; } return `<path d="${d}"/>` + s; })();
// coleta seletiva: 4 coletores com rótulo
const coletores = (() => { let s = ''; [['PA', 6], ['PL', 50], ['ME', 94], ['VI', 138]].forEach(([l, x]) => { s += `<path d="M${x - 2},22 H${x + 40} M${x + 2},22 L${x + 5},84 H${x + 33} L${x + 36},22 M${x + 14},22 V16 H${x + 24} V22"/>` + T(x + 19, 52, l, 14); }); return s; })();
// lavoura em perspectiva: fileiras convergindo para o horizonte, com brotos
const lavoura = (() => { let d = '', b = ''; [[10, 58], [42, 66], [75, 75], [108, 84], [140, 92]].forEach(([xb, xt]) => { d += `M${xb},86 L${xt},44 `; for (const [t, s] of [[0.12, 1.1], [0.45, 0.8], [0.72, 0.55]]) b += broto(xb + (xt - xb) * t, 86 - 42 * t, s); }); return fino(d, 1.6) + b; })();
// janelas da silhueta de cidade
const janelasCidade = (() => { let s = ''; for (const [x0, x1, yt] of [[4, 24, 60], [24, 44, 40], [56, 80, 20], [94, 114, 34], [128, 150, 44]]) for (let y = yt + 6; y <= 84; y += 10) for (let x = x0 + 4; x + 5 <= x1 - 3; x += 8) s += `<rect x="${x}" y="${y}" width="4" height="5"/>`; return `<g stroke-width="1.2">${s}</g>`; })();
// sala de aula: 2 fileiras de carteiras com cadeira
const carteiras = (() => { let s = ''; for (const y of [44, 76]) for (const x of [14, 70, 126]) s += `<rect x="${x}" y="${y}" width="30" height="12" rx="2"/><circle cx="${x + 15}" cy="${y + 22}" r="5"/>`; return s; })();
// fita zebrada: listras cheias
const zebra = (() => { let s = ''; for (let x = 4; x <= 124; x += 20) s += `M${x},30 L${x + 10},10 H${x + 20} L${x + 10},30 Z `; return `<path fill="#C" stroke="none" d="${s}"/>`; })();

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
      numero(6), numero(7), numero(8), numero(9), numero(10),
      letra('A'), letra('B'), letra('C'), letra('D'),
      ['ic-lupa', 'Lupa', 80, 80, '<circle cx="32" cy="32" r="24"/><path stroke-width="7" d="M50,50 L74,74"/>' + fino('M18,26 A14,14 0 0,1 28,16', 2)],
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
    ['Água e saneamento', [
      ['ic-ciclo-agua', 'Ciclo da água', 180, 130, '<circle cx="154" cy="24" r="10"/>' + raios(154, 24, 14, 19, OITO) + '<path d="M30,42 C20,42 16,34 22,29 C22,20 32,16 40,20 C44,12 58,12 62,20 C70,18 78,24 76,32 C82,34 82,42 74,42 Z"/>' + '<path stroke-width="1.6" stroke-dasharray="4 4" d="M32,48 L28,62 M44,48 L40,62 M56,48 L52,62 M68,48 L64,62"/>' + '<path d="M4,118 L32,70 L44,84 L58,66 L88,112"/>' + fino(ondas(88, 176, 112) + ' ' + ondas(96, 176, 122), 2) + '<path stroke-width="1.8" stroke-dasharray="5 4" d="M118,102 V66 M140,102 V72"/>' + head(118, 56, -90, 11) + head(140, 62, -90, 11) + '<path stroke-width="1.8" d="M116,40 Q104,32 92,33"/>' + head(81, 34, 175, 11)],
      ['ic-bacia', 'Bacia hidrográfica', 140, 120, '<path stroke-width="2" stroke-dasharray="6 5" d="M70,6 C110,6 134,30 130,60 C126,90 96,100 76,112 C56,100 14,92 10,62 C6,30 30,6 70,6 Z"/><path d="M70,20 C72,44 66,62 74,84 L76,110"/>' + fino('M28,40 C44,52 56,58 70,60 M114,36 C102,50 90,58 71,70 M26,76 C42,80 58,84 74,88 M112,78 C100,84 88,88 75,96', 2) + '<circle cx="76" cy="112" r="3.5" fill="#C" stroke="none"/>'],
      ['ic-caixa-dagua', 'Caixa d\'água elevada', 80, 110, '<rect x="14" y="6" width="52" height="38" rx="4"/>' + trac('M18,18 H62') + '<path d="M20,44 L10,104 M60,44 L70,104 M16,64 H64 M13,84 H67 M4,104 H76"/>' + fino('M16,64 L67,84 M64,64 L13,84 M40,44 V104')],
      ['ic-lancamento', 'Lançamento de esgoto no rio', 140, 90, '<path d="M4,40 H56 L70,86 H136 M4,22 H62 M4,34 H62 M62,19 V37"/>' + fino('M64,25 Q78,27 80,56 M64,31 Q72,33 74,56', 1.8) + fino(ondas(72, 136, 60) + ' ' + ondas(80, 136, 74), 2) + '<g fill="#C" stroke="none"><circle cx="96" cy="67" r="2.5"/><circle cx="118" cy="66" r="2.5"/><circle cx="106" cy="81" r="2.5"/></g>'],
      ['ic-gota-suja', 'Água contaminada (gota)', 70, 90, '<path d="M35,6 C35,6 10,40 10,60 A25,25 0 0,0 60,60 C60,40 35,6 35,6 Z"/><circle cx="27" cy="58" r="4"/><circle cx="45" cy="66" r="3"/><circle cx="38" cy="45" r="2.5" fill="#C"/>' + fino('M22,74 q3,-4 6,0 t6,0 t6,0 M40,54 q2,-3 4,0 t4,0')],
      ['ic-copo-agua', 'Copo de água', 60, 80, '<path d="M8,6 L14,74 H46 L52,6"/>' + fino('M10,26 q5,-4 10,0 t10,0 t10,0 t10,0', 2) + '<circle cx="24" cy="50" r="2" stroke-width="1.4"/><circle cx="36" cy="60" r="2.5" stroke-width="1.4"/><circle cx="32" cy="40" r="1.6" stroke-width="1.4"/>'],
      ['ic-grelha', 'Grelha de drenagem (bueiro)', 110, 70, '<rect x="6" y="8" width="98" height="54" rx="4"/>' + fino('M12,14 H98 V56 H12 Z') + '<path stroke-width="3" d="M22,14 V56 M32,14 V56 M42,14 V56 M52,14 V56 M62,14 V56 M72,14 V56 M82,14 V56 M92,14 V56"/>'],
      ['ic-enchente', 'Enchente', 120, 100, '<path d="M30,50 L60,20 L90,50 M38,44 V92 H82 V44 M54,92 V72 H66 V92"/>' + fino(ondas(4, 116, 72) + ' ' + ondas(4, 116, 86), 2.2) + '<path stroke-width="1.6" stroke-dasharray="4 4" d="M14,8 L10,22 M26,8 L22,22 M100,8 L96,22 M112,8 L108,22"/>'],
      ['ic-seca', 'Seca (solo rachado)', 120, 100, '<circle cx="92" cy="26" r="12"/>' + raios(92, 26, 16, 22, OITO) + '<path d="M4,64 H116 M4,64 V96 H116 V64"/>' + fino('M30,64 L36,74 L30,84 L38,96 M36,74 L50,80 M70,64 L66,78 L76,88 M66,78 L54,90 M96,64 L100,76 L94,96', 1.8) + fino('M20,64 V44 M20,52 L12,44 M20,48 L28,40', 2)],
    ]],
    ['Resíduos e reciclagem', [
      ['ic-coleta-seletiva', 'Coleta seletiva (4 coletores)', 180, 90, coletores],
      ['ic-aterro', 'Aterro sanitário (corte)', 180, 110, '<path d="M4,30 H30 L50,96 H130 L150,30 H176 M30,30 Q90,4 150,30"/><path stroke-width="1.6" stroke-dasharray="5 4" d="M26,34 L46,101 H134 L154,34"/>' + fino('M37,52 H143 M43,74 H137 M66,30 V52 M114,30 V52 M70,52 V74 M110,52 V74 M76,74 V96 M104,74 V96') + '<path d="M90,94 V6 M84,6 H96"/>' + '<circle cx="66" cy="91" r="2.5" stroke-width="1.6"/><circle cx="114" cy="91" r="2.5" stroke-width="1.6"/>'],
      ['ic-lixao', 'Lixão (descarte irregular)', 130, 90, '<path d="M8,84 C18,62 30,46 48,42 C58,32 78,32 88,44 C104,48 116,66 122,84 M2,84 H128"/>' + fino('M36,58 H50 V68 H36 Z M88,70 L102,62 L106,66 L92,74 Z M102,62 L104,58 M56,70 H66 V82 H56 Z M20,76 L28,70 L34,78', 1.6) + '<circle cx="72" cy="56" r="7" stroke-width="1.6"/>' + '<path stroke-width="1.4" stroke-dasharray="3 3" d="M34,30 Q38,16 44,20 M58,24 Q60,8 66,12 M80,32 Q84,18 88,22"/><g fill="#C" stroke="none"><circle cx="44" cy="20" r="2.2"/><circle cx="66" cy="12" r="2.2"/><circle cx="88" cy="22" r="2.2"/></g>'],
      ['ic-garrafa-pet', 'Garrafa PET', 50, 100, '<rect x="19" y="4" width="12" height="8" rx="1"/><path d="M20,12 V22 Q8,30 8,44 V88 Q8,94 14,94 H36 Q42,94 42,88 V44 Q42,30 30,22 V12"/>' + fino('M8,52 H42 M8,68 H42')],
      ['ic-lata', 'Lata de alumínio', 60, 90, '<ellipse cx="30" cy="12" rx="22" ry="6"/><path d="M8,12 V78 M52,12 V78 M8,78 A22,6 0 0,0 52,78"/><ellipse cx="34" cy="11" rx="5" ry="2" stroke-width="1.4"/>' + fino('M8,30 A22,6 0 0,0 52,30 M8,60 A22,6 0 0,0 52,60')],
      ['ic-saco-lixo', 'Saco de lixo', 80, 90, '<path d="M30,26 C10,36 6,66 14,80 Q40,90 66,80 C74,66 70,36 50,26 Z M30,26 L24,12 M50,26 L56,12 M30,26 Q40,20 50,26"/>' + fino('M24,50 Q30,62 26,74 M54,48 Q50,60 56,72', 1.4)],
      ['ic-composteira', 'Composteira', 100, 90, '<rect x="10" y="34" width="80" height="50" rx="2"/><path d="M12,34 Q24,16 40,20 Q54,10 68,18 Q82,16 88,34"/>' + fino('M30,34 V84 M50,34 V84 M70,34 V84') + '<g fill="#C" stroke="none"><circle cx="24" cy="28" r="1.8"/><circle cx="46" cy="24" r="1.8"/><circle cx="62" cy="27" r="1.8"/><circle cx="78" cy="28" r="1.8"/></g>'],
      ['ic-caminhao-lixo', 'Caminhão de coleta', 150, 76, '<path d="M110,62 V24 H130 L142,40 V62 M8,62 V18 Q8,10 16,10 H104 V62 M2,62 H21 M39,62 H47 M65,62 H115 M133,62 H146"/>' + fino('M114,28 H128 L136,40 H114 Z M16,18 V54 M28,22 H96 M28,48 H96', 1.8) + '<circle cx="30" cy="64" r="9"/><circle cx="56" cy="64" r="9"/><circle cx="124" cy="64" r="9"/>'],
      ['ic-pilha', 'Pilha (resíduo perigoso)', 50, 90, '<rect x="10" y="14" width="30" height="72" rx="4"/><rect x="19" y="6" width="12" height="8" rx="1"/>' + T(25, 34, '+', 24) + T(25, 68, '−', 24)],
      ['ic-sacola', 'Sacola retornável', 80, 90, '<path d="M10,34 H70 L64,86 H16 Z M26,34 V24 Q26,12 40,12 Q54,12 54,24 V34"/>' + fino('M30,72 C30,58 42,52 52,52 C52,64 44,72 30,72 Z M30,72 L44,60', 1.8)],
    ]],
    ['Fauna e flora', [
      ['ic-mata-ciliar', 'Mata ciliar (rio com margens)', 180, 90, '<path d="M4,44 H52 Q62,44 70,64 Q90,84 110,64 Q118,44 128,44 H176"/>' + fino(ondas(70, 110, 58, 5, 3), 1.8) + [14, 32, 50, 130, 148, 166].map(x => arvoreR(x, 44, 10, 12)).join('')],
      ['ic-floresta', 'Floresta', 140, 100, pinheiro(30, 18, 80, 40, 12) + pinheiro(110, 10, 80, 44, 12) + arvoreR(70, 92, 18, 28) + '<path d="M4,92 H136"/>'],
      ['ic-pinheiro', 'Pinheiro (conífera)', 70, 100, pinheiro(35, 6, 82, 60, 12) + '<path d="M10,94 H60"/>'],
      ['ic-coqueiro', 'Coqueiro', 90, 110, '<path d="M40,104 Q34,70 44,32 M50,104 Q44,70 52,34 M20,104 H76"/><path d="M48,30 Q30,12 6,22 Q28,22 48,30 Z M48,30 Q66,10 86,20 Q66,22 48,30 Z M48,30 Q24,30 10,52 Q30,38 48,30 Z M48,30 Q74,30 84,52 Q66,38 48,30 Z M48,30 Q46,12 58,4 Q52,18 48,30 Z"/><circle cx="43" cy="38" r="4.5"/><circle cx="53" cy="39" r="4.5"/>' + fino('M38,90 H47 M38,76 H46 M39,62 H48 M41,50 H50', 1.4)],
      ['ic-cacto', 'Cacto (mandacaru)', 80, 100, '<path d="M32,96 V20 Q32,8 40,8 Q48,8 48,20 V96 M32,64 H20 Q12,64 12,56 V38 Q12,32 17,32 Q22,32 22,38 V54 H32 M48,54 H60 Q68,54 68,46 V24 Q68,18 63,18 Q58,18 58,24 V44 H48 M10,96 H70"/>' + fino('M40,16 V92', 1.4)],
      ['ic-broto', 'Broto (muda)', 70, 80, '<path d="M6,72 Q35,58 64,72 M35,64 V36 M35,44 C24,44 14,36 12,24 C24,24 34,30 35,44 Z M35,38 C44,36 56,28 58,16 C46,16 36,24 35,38 Z"/>'],
      ['ic-passaro', 'Pássaro', 100, 70, '<circle cx="26" cy="26" r="10"/><path d="M16,24 L6,28 L16,31 M35,32 C48,26 68,30 80,38 L96,32 L90,46 C78,56 52,58 38,48 C31,43 31,37 35,32 Z"/>' + fino('M46,40 Q62,28 74,44') + '<circle cx="23" cy="24" r="1.8" fill="#C" stroke="none"/>' + fino('M52,56 V66 M62,56 V66', 2)],
      ['ic-borboleta', 'Borboleta', 100, 80, '<ellipse cx="50" cy="44" rx="4" ry="20"/><path d="M46,36 C32,6 6,8 8,28 C10,42 30,46 46,42 Z M46,48 C30,48 16,58 22,70 C28,78 42,68 47,54 Z M54,36 C68,6 94,8 92,28 C90,42 70,46 54,42 Z M54,48 C70,48 84,58 78,70 C72,78 58,68 53,54 Z"/>' + fino('M48,26 Q42,10 36,6 M52,26 Q58,10 64,6') + '<circle cx="24" cy="26" r="4" stroke-width="1.6"/><circle cx="76" cy="26" r="4" stroke-width="1.6"/>'],
      ['ic-abelha', 'Abelha (polinizador)', 90, 70, '<ellipse cx="40" cy="18" rx="9" ry="13" transform="rotate(-25 40 18)" stroke-width="1.8"/><ellipse cx="56" cy="18" rx="9" ry="13" transform="rotate(20 56 18)" stroke-width="1.8"/><ellipse cx="46" cy="42" rx="26" ry="16"/><circle cx="16" cy="40" r="9"/><path stroke-width="4" d="M40,28 V56 M54,28 V56"/><path d="M72,42 L82,42"/>' + fino('M12,32 L6,22 M18,31 L19,20') + '<circle cx="13" cy="38" r="1.8" fill="#C" stroke="none"/>'],
      ['ic-cogumelo', 'Cogumelo (fungo)', 70, 80, '<path d="M6,42 C6,18 22,6 35,6 C48,6 64,18 64,42 Z M26,42 V70 Q26,76 32,76 H38 Q44,76 44,70 V42"/><circle cx="22" cy="26" r="4" stroke-width="1.6"/><circle cx="40" cy="16" r="3.5" stroke-width="1.6"/><circle cx="50" cy="30" r="4" stroke-width="1.6"/>'],
      ['ic-tartaruga', 'Tartaruga', 110, 70, '<path d="M20,48 C20,18 84,18 88,48 Z M88,42 Q100,34 106,42 Q102,50 88,48 M28,48 L22,60 H34 L38,48 M70,48 L74,60 H86 L80,48"/>' + fino('M38,48 L44,32 H64 L70,48 M20,46 L10,50 L20,48') + '<circle cx="100" cy="41" r="1.8" fill="#C" stroke="none"/>'],
      ['ic-pegada', 'Pegada ecológica', 60, 100, '<path d="M32,32 C46,32 50,46 48,60 C46,76 44,94 30,94 C18,94 14,80 16,64 C18,48 18,32 32,32 Z"/><circle cx="44" cy="20" r="7"/><circle cx="31" cy="14" r="5.5"/><circle cx="21" cy="16" r="4.5"/><circle cx="13" cy="22" r="3.5"/><circle cx="9" cy="31" r="3"/>' + fino('M32,82 C24,70 26,54 36,46 C40,58 40,72 32,82 Z M32,82 L35,54')],
    ]],
    ['Clima e atmosfera', [
      ['ic-termometro', 'Termômetro', 40, 100, '<path d="M14,71.6 V14 A6,6 0 0,1 26,14 V71.6 M14,71.6 A12,12 0 1,0 26,71.6"/><path stroke-width="4" d="M20,80 V34"/><circle cx="20" cy="82" r="6" fill="#C" stroke="none"/>' + fino('M26,24 H32 M26,34 H30 M26,44 H32 M26,54 H30 M26,64 H32', 1.4)],
      ['ic-vento', 'Vento', 110, 80, '<path d="M6,30 H70 C84,30 88,12 76,8 C68,6 62,14 66,20 M6,48 H86 C100,48 104,66 92,70 C84,72 78,64 84,58 M14,64 H50"/>'],
      ['ic-sol-nuvem', 'Sol entre nuvens', 110, 90, '<circle cx="36" cy="34" r="16"/>' + raios(36, 34, 21, 28, [150, 180, 210, 240, 270, 300, 330, 0]) + '<path d="M40,82 C26,82 22,72 26,66 C28,58 36,56 42,58 C44,46 56,40 66,44 C72,36 88,36 92,48 C102,48 108,58 104,66 C108,74 102,82 94,82 Z"/>'],
      ['ic-lua', 'Lua (noite)', 70, 70, crescente(30, 38, 28, 44, 28, 22) + star(58, 14, 7, 2.6, 4, ' fill="#C" stroke-width="1"') + star(60, 40, 4.5, 1.8, 4, ' fill="#C" stroke-width="1"')],
      ['ic-floco-neve', 'Floco de neve (frio)', 80, 80, floco],
      ['ic-efeito-estufa', 'Efeito estufa', 160, 110, '<path d="M4,104 Q80,78 156,104"/><path stroke-width="1.8" stroke-dasharray="6 5" d="M4,64 Q80,14 156,64"/><circle cx="22" cy="18" r="10"/>' + raios(22, 18, 13, 17, OITO) + setaF(32, 28, 66, 88, 12, 2) + '<path stroke-width="2" d="M84,90 L104,44 L118.5,77.7"/>' + head(122, 86, 66.8, 12) + setaF(132, 94, 146, 30, 11, 1.6)],
      ['ic-chama', 'Fogo (chama)', 60, 90, '<path d="M30,86 C12,86 4,72 8,58 C12,44 22,40 20,24 C32,30 36,40 34,50 C40,44 42,36 40,28 C52,40 58,58 52,72 C48,82 40,86 30,86 Z"/>' + fino('M30,80 C22,80 18,72 22,64 C26,58 30,56 30,48 C38,56 40,66 38,72 C36,78 34,80 30,80 Z', 1.8)],
      ['ic-queimada', 'Queimada', 120, 100, '<circle cx="36" cy="34" r="22"/><path d="M36,56 V92 M4,92 H116 M76,92 C60,92 54,80 58,70 C62,60 70,58 68,46 C78,52 82,60 80,68 C86,62 88,56 86,50 C96,60 100,74 96,82 C92,90 86,92 76,92 Z M22,92 C14,92 12,84 16,78 C18,74 22,72 22,66 C28,72 30,80 28,86 C27,90 25,92 22,92 Z"/>' + fino('M66,36 C58,28 70,22 64,12 M88,40 C80,30 94,24 86,12', 2)],
      ['ic-co2', 'Nuvem de CO₂', 110, 70, `<path d="${NUVEM}"/>` + T(56, 42, 'CO₂', 20)],
      ['ic-guarda-chuva', 'Guarda-chuva', 80, 90, '<path d="M6,44 C6,20 22,8 40,8 C58,8 74,20 74,44 Q65,38 57,44 Q48,38 40,44 Q32,38 23,44 Q14,38 6,44 Z M40,44 V76 Q40,84 33,84 Q27,84 27,78 M40,8 V4"/>' + fino('M40,8 Q28,22 23,44 M40,8 Q52,22 57,44')],
    ]],
    ['Cidade, indústria e campo', [
      ['ic-cidade', 'Cidade (silhueta)', 170, 100, '<path d="M4,96 V60 H24 V40 H44 V70 H56 V20 H80 V50 H94 V34 H114 V64 H128 V44 H150 V96 M2,96 H168"/>' + janelasCidade + arvoreR(160, 96, 7, 12)],
      ['ic-hospital', 'Hospital (posto de saúde)', 120, 100, '<path d="M14,96 V30 H106 V96 M4,96 H116"/><rect x="10" y="22" width="100" height="8"/><path fill="#C" stroke="none" d="M55,38 H65 V46 H73 V56 H65 V64 H55 V56 H47 V46 H55 Z"/>' + fino('M22,40 H36 V52 H22 Z M84,40 H98 V52 H84 Z M22,66 H36 V78 H22 Z M84,66 H98 V78 H84 Z') + '<path d="M50,96 V74 H70 V96"/>' + fino('M60,74 V96')],
      ['ic-escola', 'Escola', 130, 100, '<path d="M10,96 V44 H120 V96 M26,44 L65,18 L104,44 M4,96 H126 M57,96 V74 H73 V96"/><path stroke-width="2" d="M65,18 V3"/>' + fino('M65,4 H80 L76,8 L80,12 H65 M18,56 H32 V70 H18 Z M36,56 H50 V70 H36 Z M80,56 H94 V70 H80 Z M98,56 H112 V70 H98 Z') + '<circle cx="65" cy="34" r="5" stroke-width="1.6"/>'],
      ['ic-trator', 'Trator', 130, 90, '<circle cx="36" cy="62" r="24"/><circle cx="36" cy="62" r="7"/><circle cx="104" cy="72" r="14"/><circle cx="104" cy="72" r="4"/><path d="M60,58 V40 H118 V60 M60,58 H90 M18,38 V8 H58 V40"/><path stroke-width="3" d="M100,40 V20"/>' + fino('M24,13 H52 V34 H24 Z')],
      ['ic-plantacao', 'Plantação (lavoura)', 150, 90, '<path d="M4,44 H146"/>' + lavoura + '<circle cx="126" cy="20" r="8"/>' + raios(126, 20, 11, 15, OITO)],
      ['ic-irrigacao', 'Irrigação (aspersor)', 110, 90, '<path d="M55,86 V40 M4,86 H106"/><rect x="49" y="32" width="12" height="8" rx="2"/><path stroke-width="1.8" stroke-dasharray="4 4" d="M52,32 Q30,6 8,40 M58,32 Q80,6 102,40 M55,32 Q50,14 36,12 M55,32 Q60,14 74,12"/>' + broto(18, 86) + broto(34, 86) + broto(76, 86) + broto(92, 86)],
      ['ic-boi', 'Boi (pecuária)', 130, 90, '<path d="M34,30 H98 Q110,30 110,42 V58 Q110,64 104,64 H38 Q30,64 30,56 V48 M34,30 L18,28 Q8,28 8,38 L12,52 Q14,58 20,56 L30,48 M18,28 Q12,18 18,12 M26,29 Q26,20 32,16"/><path stroke-width="3" d="M40,64 V86 M50,64 V86 M92,64 V86 M102,64 V86"/>' + fino('M110,40 Q120,48 118,64 M116,64 L118,70 L121,64') + '<ellipse cx="70" cy="46" rx="8" ry="6" stroke-width="1.6"/><ellipse cx="92" cy="40" rx="5" ry="4" stroke-width="1.6"/><circle cx="16" cy="38" r="1.8" fill="#C" stroke="none"/>'],
      ['ic-ponte', 'Ponte', 160, 80, '<path d="M4,26 H156 M4,32 H156 M16,76 Q80,0 144,76 M4,76 H16 M144,76 H156 M4,32 V76 M156,32 V76"/>' + fino('M40,32 V52.8 M60,32 V41.7 M100,32 V41.7 M120,32 V52.8', 2) + fino(ondas(24, 136, 70, 7, 3), 1.6)],
    ]],
    ['Saúde pública', [
      ['ic-mosquito', 'Mosquito (Aedes)', 110, 80, '<ellipse cx="60" cy="18" rx="18" ry="6" transform="rotate(-20 60 18)" stroke-width="1.6"/><ellipse cx="66" cy="24" rx="16" ry="5" transform="rotate(-5 66 24)" stroke-width="1.6"/><circle cx="34" cy="34" r="6"/><ellipse cx="48" cy="36" rx="10" ry="8"/><g transform="rotate(18 76 44)"><ellipse cx="76" cy="44" rx="22" ry="7"/><path stroke-width="1.4" d="M66,38 V50 M76,37 V51 M86,38 V50"/></g>' + fino('M29,37 L10,48 M32,29 L24,20 M34,28 L30,18', 1.8) + fino('M44,42 L34,56 L26,74 M48,44 L48,60 L44,76 M53,42 L64,58 L72,76', 1.4)],
      ['ic-virus', 'Vírus', 90, 90, '<circle cx="45" cy="45" r="22"/>' + espinhosVirus + fino('M34,40 q4,-6 8,0 t8,0 M40,52 q4,-6 8,0 t8,0')],
      ['ic-bacteria', 'Bactéria', 110, 70, '<rect x="6" y="18" width="78" height="32" rx="16"/><path d="M84,34 q3.5,-7 7,0 t7,0 t7,0"/>' + fino('M20,34 q4,-6 8,0 t8,0 t8,0 t8,0 t8,0 t8,0 t8,0') + fino('M24,18 L22,10 M44,18 V9 M64,18 L66,10 M24,50 L22,58 M44,50 V59 M64,50 L66,58', 1.4)],
      ['ic-seringa', 'Seringa (vacina)', 130, 40, '<rect x="30" y="10" width="66" height="20"/><path d="M10,20 H40 M96,15 H104 V25 H96"/><path stroke-width="3" d="M8,10 V30 M30,5 V35 M40,12 V28"/><path stroke-width="1.6" d="M104,20 H126"/>' + fino('M52,10 V16 M64,10 V18 M76,10 V16 M88,10 V18', 1.4)],
      ['ic-comprimido', 'Comprimido (cápsula)', 90, 50, '<rect x="6" y="10" width="78" height="30" rx="15"/><path d="M45,10 V40"/><path fill="#C" stroke="none" d="M45,10 H21 A15,15 0 0,0 21,40 H45 Z"/>'],
      ['ic-sabonete', 'Sabonete (higiene)', 100, 80, '<rect x="12" y="40" width="76" height="32" rx="12"/><circle cx="28" cy="28" r="8"/><circle cx="48" cy="18" r="6"/><circle cx="66" cy="28" r="9"/><circle cx="84" cy="12" r="4"/><circle cx="16" cy="10" r="3"/>' + fino('M22,50 H40')],
      ['ic-socorro', 'Kit de primeiros socorros', 100, 80, '<rect x="6" y="20" width="88" height="54" rx="6"/><path d="M38,20 V12 H62 V20 M45,34 H55 V42 H63 V52 H55 V60 H45 V52 H37 V42 H45 Z"/>'],
      ['ic-mascara', 'Máscara facial', 100, 60, '<path d="M24,14 Q50,6 76,14 V40 Q50,56 24,40 Z"/>' + fino('M28,24 Q50,18 72,24 M28,32 Q50,28 72,32') + '<path stroke-width="1.8" d="M24,16 Q6,12 6,28 Q8,40 24,38 M76,16 Q94,12 94,28 Q92,40 76,38"/>'],
    ]],
    ['Pessoas e sala de aula', [
      ['ic-professor', 'Professor na lousa', 150, 100, '<rect x="58" y="6" width="88" height="58" rx="2"/>' + fino('M66,20 H110 M66,32 H132 M66,44 H100', 2) + '<circle cx="28" cy="30" r="10"/><path d="M10,96 V70 Q10,48 28,48 Q46,48 46,70 V96 M40,56 L52,50"/><path stroke-width="2" d="M52,50 L80,34"/>'],
      ['ic-aluno', 'Aluno na carteira', 100, 100, '<circle cx="50" cy="22" r="10"/><path d="M30,62 V50 Q30,36 50,36 Q70,36 70,50 V62 M6,62 H94 M14,62 V96 M86,62 V96"/>' + fino('M34,62 L38,54 H62 L66,62 M50,54 V62')],
      ['ic-sala-aula', 'Sala de aula (carteiras)', 170, 110, '<rect x="50" y="4" width="70" height="22" rx="2"/>' + fino('M58,12 H100 M58,19 H86') + carteiras],
      ['ic-dialogo', 'Diálogo (duas pessoas)', 150, 100, busto(34, 64, 0.8) + busto(116, 64, 0.8) + '<path d="M10,4 H64 Q70,4 70,10 V22 Q70,28 64,28 H44 L36,36 L38,28 H10 Q4,28 4,22 V10 Q4,4 10,4 Z M140,4 H86 Q80,4 80,10 V22 Q80,28 86,28 H106 L114,36 L112,28 H140 Q146,28 146,22 V10 Q146,4 140,4 Z"/><g fill="#C" stroke="none"><circle cx="27" cy="16" r="2.2"/><circle cx="37" cy="16" r="2.2"/><circle cx="47" cy="16" r="2.2"/><circle cx="103" cy="16" r="2.2"/><circle cx="113" cy="16" r="2.2"/><circle cx="123" cy="16" r="2.2"/></g>'],
      ['ic-trabalhador', 'Trabalhador (com capacete)', 70, 100, '<path d="M22.6,30 A13,13 0 1,0 47.4,30 M11,98 V84 Q11,58 35,58 Q59,58 59,84 V98 Z M20,30 C20,12 50,12 50,30 M14,30 H56"/>' + fino('M35,15 V30')],
      ['ic-capelo', 'Capelo (formatura)', 110, 80, '<path d="M55,8 L104,28 L55,48 L6,28 Z M28,39 V58 Q55,70 82,58 V39"/><path stroke-width="1.8" d="M55,28 L94,32 V54"/><path fill="#C" stroke="none" d="M91,54 H97 L99,66 H89 Z"/><circle cx="55" cy="28" r="2.5" fill="#C" stroke="none"/>'],
      ['ic-diploma', 'Diploma (canudo)', 110, 60, '<path d="M12,18 H98 M12,42 H98"/><ellipse cx="12" cy="30" rx="5" ry="12"/><ellipse cx="98" cy="30" rx="5" ry="12"/><ellipse cx="98" cy="30" rx="2" ry="5" stroke-width="1.4"/><path stroke-width="2" d="M52,18 V42 M58,18 V42 M55,42 L46,56 M55,42 L64,56"/>'],
    ]],
    ['Segurança do trabalho e sinalização', [
      ['ic-abafador', 'Protetor auricular (abafador)', 90, 90, '<path d="M17,48 C17,8 73,8 73,48"/><rect x="6" y="44" width="22" height="38" rx="9"/><rect x="62" y="44" width="22" height="38" rx="9"/>' + fino('M25,46 C25,18 65,18 65,46 M12,54 V72 M78,54 V72')],
      ['ic-respirador', 'Respirador (máscara PFF)', 90, 80, '<path d="M14,30 Q45,8 76,30 Q80,56 45,70 Q10,56 14,30 Z"/><circle cx="45" cy="46" r="8"/>' + fino('M40,42 H50 M40,46 H50 M40,50 H50', 1.4) + '<path stroke-width="1.8" d="M14,30 L4,22 M76,30 L86,22 M16,48 L4,52 M74,48 L86,52"/>'],
      ['ic-bota', 'Bota de segurança', 100, 90, '<path d="M22,6 H52 V50 Q54,58 64,60 L84,64 Q94,66 94,76 V82 H16 V18 Q16,8 22,6 Z"/><path stroke-width="4" d="M16,85 H94"/>' + fino('M44,14 L52,20 M44,24 L52,30 M44,34 L52,40 M74,62 Q72,74 94,77')],
      ['ic-colete', 'Colete refletivo', 90, 90, '<path d="M28,6 L36,30 L45,42 L54,30 L62,6 L80,12 Q78,30 84,40 V84 H6 V40 Q12,30 10,12 Z"/>' + fino('M45,42 V84') + '<path stroke-width="2.4" d="M7,58 H40 M7,68 H40 M50,58 H83 M50,68 H83"/>'],
      ['ic-proibido', 'Proibido (placa genérica)', 80, 80, '<circle cx="40" cy="40" r="33" stroke-width="5"/><path stroke-width="5" d="M17,17 L63,63"/>'],
      ['ic-placa-aviso', 'Placa de aviso (em branco)', 110, 80, '<rect x="4" y="4" width="102" height="72" rx="4"/><path d="M4,26 H106"/>' + T(55, 15, 'AVISO', 14) + fino('M18,40 H92 M18,52 H92 M18,64 H70')],
      ['ic-fita-zebrada', 'Fita zebrada (isolamento)', 160, 40, '<rect x="4" y="10" width="152" height="20"/>' + zebra],
    ]],
  ],
};
