// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Mecânica e Mecatrônica: desenho técnico, elementos de máquinas, pneumática/hidráulica (ISO 1219), automação, usinagem, metrologia, manutenção e robótica.
import { T, head } from './base.js';

// Desenhos próprios do Giz Livre, do zero; seguem só as convenções das normas (ABNT NBR 10067/8403/8404, ISO 128,
// ISO 1302, ISO 1101, ISO 2553, ISO 1219, IEC 61131-3, IEC 60848). Motores, contatores e botoeiras elétricas ficam
// em eletrica.js; sensores e módulos de bancada (servo de hobby, encoder KY-040) em embarcados.js.

const f = (n) => +n.toFixed(1);
const rad = (g) => g * Math.PI / 180;
const P = (pts, z = false) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join(' ') + (z ? ' Z' : '');
const fino = (d, w = 1.6) => `<path d="${d}" stroke-width="${w}"/>`;
const centro = (d) => `<path d="${d}" stroke-width="1.3" stroke-dasharray="14 3 2 3"/>`; // traço-ponto estreito
const oculta = (d) => `<path d="${d}" stroke-width="1.8" stroke-dasharray="6 4"/>`;
const tl = (x, y, s, size = 14) => T(x, y, s, size).replace('text-anchor="middle"', 'text-anchor="start"');
const tr = (x, y, s, size = 14) => T(x, y, s, size).replace('text-anchor="middle"', 'text-anchor="end"');
const seta = (x1, y1, x2, y2, L = 9, w = 1.8) => `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke-width="${w}"/>`
  + head(f(x2), f(y2), Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, L);
// seta curva de giro: arco de a1 a a2 (graus; crescente = horário na tela), ponta no fim
const giro = (cx, cy, r, a1, a2, w = 1.8, L = 9) => {
  const p = (a) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))], [x1, y1] = p(a1), [x2, y2] = p(a2), cw = a2 > a1;
  return `<path d="M${f(x1)} ${f(y1)} A${r} ${r} 0 ${Math.abs(a2 - a1) > 180 ? 1 : 0} ${cw ? 1 : 0} ${f(x2)} ${f(y2)}" stroke-width="${w}"/>`
    + head(f(x2), f(y2), cw ? a2 + 90 : a2 - 90, L);
};
// hachura a 45° num retângulo (inv = sentido oposto, para peças vizinhas)
const hach = (x0, y0, x1, y1, g = 7, inv = false) => {
  const W = x1 - x0, H = y1 - y0; let d = '';
  for (let c = g / 2; c < W + H; c += g) {
    const ua = Math.max(0, c - H), ub = Math.min(W, c);
    if (ub - ua < 0.5) continue;
    const X = (u) => f(inv ? x1 - u : x0 + u);
    d += `M${X(ua)} ${f(y0 + c - ua)} L${X(ub)} ${f(y0 + c - ub)} `;
  }
  return fino(d.trim(), 1.1);
};
// hachura recortada por um contorno qualquer (id único por forma)
const hachClip = (id, dClip, x0, y0, x1, y1, g = 7, inv = false) =>
  `<clipPath id="${id}"><path d="${dClip}"/></clipPath><g clip-path="url(#${id})">${hach(x0, y0, x1, y1, g, inv)}</g>`;
const cruz = (x, y, r) => centro(`M${x - r} ${y} H${x + r} M${x} ${y - r} V${y + r}`);

// ---------- engrenagens, correias, elos ----------
// engrenagem de z dentes e módulo m (px); rot = ângulo do centro do 1º dente; ponta = meia-largura do topo (fração do passo)
const engr = (cx, cy, z, m, rot = 0, ponta = 0.14) => {
  const R = z * m / 2, ro = R + m, ri = R - 1.2 * m, p = 2 * Math.PI / z, pts = [];
  const q = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  for (let i = 0; i < z; i++) { const c = rot + i * p; pts.push(q(c - 0.3 * p, ri), q(c - ponta * p, ro), q(c + ponta * p, ro), q(c + 0.3 * p, ri)); }
  return `<path d="${P(pts, true)}"/>`;
};
const correia = (x1, y, r1, x2, r2) => {
  const a = Math.acos((r1 - r2) / (x2 - x1)), c = Math.cos(a), s = Math.sin(a);
  return `M${f(x1 + r1 * c)} ${f(y - r1 * s)} L${f(x2 + r2 * c)} ${f(y - r2 * s)} A${r2} ${r2} 0 0 1 ${f(x2 + r2 * c)} ${f(y + r2 * s)} `
    + `L${f(x1 + r1 * c)} ${f(y + r1 * s)} A${r1} ${r1} 0 1 1 ${f(x1 + r1 * c)} ${f(y - r1 * s)} Z`;
};
const cruzada = (x1, y, r1, x2, r2) => {
  const a = Math.acos((r1 + r2) / (x2 - x1)), c = Math.cos(a), s = Math.sin(a);
  return `M${f(x1 + r1 * c)} ${f(y - r1 * s)} L${f(x2 - r2 * c)} ${f(y + r2 * s)} A${r2} ${r2} 0 1 0 ${f(x2 - r2 * c)} ${f(y - r2 * s)} `
    + `L${f(x1 + r1 * c)} ${f(y + r1 * s)} A${r1} ${r1} 0 1 1 ${f(x1 + r1 * c)} ${f(y - r1 * s)} Z`;
};
// elo de robô (contorno em "estádio") entre dois eixos
const elo = (x1, y1, x2, y2, w) => {
  const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * w / 2, ny = Math.cos(a) * w / 2, r = w / 2;
  return `<path d="M${f(x1 + nx)} ${f(y1 + ny)} L${f(x2 + nx)} ${f(y2 + ny)} A${r} ${r} 0 0 0 ${f(x2 - nx)} ${f(y2 - ny)} `
    + `L${f(x1 - nx)} ${f(y1 - ny)} A${r} ${r} 0 0 0 ${f(x1 + nx)} ${f(y1 + ny)} Z"/>`;
};

// ---------- ISO 1219: quadrados de válvula, vias e acionamentos ----------
const quads = (x, y, S, n) => Array.from({ length: n }, (_, i) => `<rect x="${x + i * S}" y="${y}" width="${S}" height="${S}"/>`).join('');
const via = (x1, y1, x2, y2) => seta(x1, y1, x2, y2, 8, 2);
const bloq = (x, y, k) => fino(`M${f(x)} ${y} V${y + 10 * k} M${f(x - 6)} ${y + 10 * k} H${f(x + 6)}`, 2); // via bloqueada (T)
const esc = (x, y) => `<path d="M${f(x - 6)} ${y} H${f(x + 6)} L${f(x)} ${y + 8} Z" stroke-width="1.8"/>`; // escape sem conexão
// acionamentos encostados no quadrado em (x, cy); k = -1 desenha para a esquerda, +1 para a direita
const mola = (x, cy, k) => fino(`M${x} ${cy} l${4 * k} -8 l${6 * k} 16 l${6 * k} -16 l${6 * k} 16 l${4 * k} -8`, 1.8);
const botao = (x, cy, k) => fino(`M${x} ${cy} h${12 * k} M${x + 12 * k} ${cy - 9} A9 9 0 0 ${k < 0 ? 0 : 1} ${x + 12 * k} ${cy + 9}`, 2);
const rolete = (x, cy, k) => fino(`M${x} ${cy} h${12 * k}`, 2) + `<circle cx="${x + 19 * k}" cy="${cy}" r="7" stroke-width="2"/>`;
const solen = (x, cy, k) => { const a = Math.min(x, x + 18 * k); return `<rect x="${a}" y="${cy - 10}" width="18" height="20" stroke-width="2"/>` + fino(`M${a} ${cy + 10} L${a + 18} ${cy - 10}`, 1.8); };
const piloto = (x, cy, k) => `<path d="M${x} ${cy} L${x + 11 * k} ${cy - 7} V${cy + 7} Z" stroke-width="1.8"/>`
  + `<path d="M${x + 11 * k} ${cy} h${16 * k}" stroke-width="1.6" stroke-dasharray="5 3"/>`;
const alavanca = (x, cy, k) => fino(`M${x} ${cy} h${8 * k} l${10 * k} -14`, 2) + `<circle cx="${x + 20 * k}" cy="${cy - 17}" r="3.5" fill="#C"/>`;

// válvula 3/2 NF, retorno por mola (quadrado da direita = posição normal, onde ficam as vias)
const v32 = (id, nome, acion) => {
  const x = 36, y = 22, S = 40, b = y + S, xn = x + S, u = (q, t) => f(q + t * S);
  return [id, nome, 150, 96, quads(x, y, S, 2)
    + via(u(x, .3), b, u(x, .3), y) + bloq(u(x, .7), b, -1)
    + bloq(u(xn, .3), b, -1) + via(u(xn, .3), y, u(xn, .7), b)
    + acion(x, y + S / 2, -1) + mola(x + 2 * S, y + S / 2, 1)
    + `<path d="M${u(xn, .3)} ${y} V8 M${u(xn, .3)} ${b} V${b + 14} M${u(xn, .7)} ${b} V${b + 14}"/>` + esc(u(xn, .7), b + 14)
    + tl(u(xn, .3) + 6, 12, '2') + tr(u(xn, .3) - 6, b + 12, '1') + tl(u(xn, .7) + 10, b + 12, '3')];
};
// válvula 5/2 (vias numeradas na posição da direita)
const v52 = (id, nome, esq, dir) => {
  const x = 36, y = 24, S = 44, b = y + S, xn = x + S, u = (q, t) => f(q + t * S);
  return [id, nome, 160, 118, quads(x, y, S, 2)
    + via(u(x, .5), b, u(x, .3), y) + via(u(x, .7), y, u(x, .8), b) + bloq(u(x, .2), b, -1)
    + via(u(xn, .5), b, u(xn, .7), y) + via(u(xn, .3), y, u(xn, .2), b) + bloq(u(xn, .8), b, -1)
    + esq(x, y + S / 2, -1) + dir(x + 2 * S, y + S / 2, 1)
    + `<path d="M${u(xn, .3)} ${y} V10 M${u(xn, .7)} ${y} V10 M${u(xn, .2)} ${b} V${b + 12} M${u(xn, .5)} ${b} V${b + 12} M${u(xn, .8)} ${b} V${b + 12}"/>`
    + esc(u(xn, .2), b + 12) + esc(u(xn, .8), b + 12)
    + tr(u(xn, .3) - 5, 14, '4') + tl(u(xn, .7) + 5, 14, '2')
    + T(u(xn, .2), b + 28, '5', 14) + T(u(xn, .5), b + 22, '1', 14) + T(u(xn, .8), b + 28, '3', 14)];
};
// fonte de ar comprimido (círculo com triângulo vazado)
const fonte = (cx, cy, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}"/><path d="M${cx} ${cy - r * 0.55} L${f(cx - r * 0.5)} ${f(cy + r * 0.35)} H${f(cx + r * 0.5)} Z" stroke-width="1.6"/>`;
// cilindro de dupla ação: corpo (x0..x1, y0..y1), êmbolo em xp, haste até xh
const cilindro = (x0, y0, x1, y1, xp, xh) => { const cy = (y0 + y1) / 2;
  return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/><path d="M${xp} ${y0} V${y1}" stroke-width="4"/><path d="M${xp} ${cy} H${xh}" stroke-width="4"/>`; };
// máquinas rotativas ISO 1219: triângulo para fora (gera) ou para dentro (consome); cheio = hidráulica
const rotativa = (para, cheio) => {
  const c = 55, r = 30, tri = para === 'fora' ? `M55 25 L47 39 H63 Z` : `M55 39 L47 25 H63 Z`;
  return `<circle cx="${c}" cy="58" r="${r}"/><path d="${tri.replace(/(\d+) (\d+)/g, (m, a, b) => `${a} ${+b + 3}`)}"${cheio ? ' fill="#C"' : ''} stroke-width="1.8"/>`
    + '<path d="M55 28 V4"/><path d="M25 54 H8 M25 62 H8" stroke-width="2"/>';
};

// ---------- automação (ladder IEC 61131-3) ----------
const contato = (cx, cy, nf = false, marca = '') => fino(`M${cx - 10} ${cy - 15} V${cy + 15} M${cx + 10} ${cy - 15} V${cy + 15}`, 2.5)
  + (nf ? fino(`M${cx - 14} ${cy + 15} L${cx + 14} ${cy - 15}`, 2) : '') + (marca ? T(cx, cy, marca, 14) : '');
const bobina = (cx, cy, marca = '') => `<path d="M${cx - 6} ${cy - 15} A20 20 0 0 0 ${cx - 6} ${cy + 15} M${cx + 6} ${cy - 15} A20 20 0 0 1 ${cx + 6} ${cy + 15}"/>`
  + (marca ? T(cx, cy, marca, 15) : '');
const lad = (id, nome, el, rot, larg = 26) => [id, nome, 120, 70, `<path d="M4 42 H${60 - larg / 2 - 2} M${60 + larg / 2 + 2} 42 H116"/>` + el + T(60, 12, rot, 15)];
const sensor = (id, nome, dentro) => [id, nome, 150, 90, '<rect x="18" y="14" width="62" height="62"/><path d="M18 14 V76" stroke-width="5"/>'
  + '<path d="M49 25 L69 45 L49 65 L29 45 Z" stroke-width="2"/>' + dentro
  + '<path d="M80 28 H110 M80 45 H110 M80 62 H110" stroke-width="2"/>' + tl(114, 28, 'BN') + tl(114, 45, 'BK') + tl(114, 62, 'BU')];

// ---------- desenho técnico ----------
const diedro = (x, cy, s = 1) => P([[x, cy - 9 * s], [x + 42 * s, cy - 18 * s], [x + 42 * s, cy + 18 * s], [x, cy + 9 * s]], true);
const diedroSvg = (x, cy, s = 1) => `<path d="${diedro(x, cy, s)}"/><circle cx="${f(x + 74 * s)}" cy="${cy}" r="${f(18 * s)}"/><circle cx="${f(x + 74 * s)}" cy="${cy}" r="${f(9 * s)}"/>`
  + centro(`M${f(x - 6 * s)} ${cy} H${f(x + 98 * s)} M${f(x + 74 * s)} ${f(cy - 24 * s)} V${f(cy + 24 * s)}`);
const iso = (ox, oy, s) => (x, y, z) => [ox + (x - y) * 0.866 * s, oy + (x + y) * 0.5 * s - z * s];
const isoL = (() => {
  const p = iso(62, 72, 1.6), F = (pts) => `<path d="${P(pts.map((q) => p(...q)), true)}"/>`;
  return F([[0, 40, 0], [70, 40, 0], [70, 40, 15], [30, 40, 15], [30, 40, 40], [0, 40, 40]])
    + F([[70, 0, 0], [70, 40, 0], [70, 40, 15], [70, 0, 15]])
    + F([[30, 0, 15], [70, 0, 15], [70, 40, 15], [30, 40, 15]])
    + F([[30, 0, 15], [30, 40, 15], [30, 40, 40], [30, 0, 40]])
    + F([[0, 0, 40], [30, 0, 40], [30, 40, 40], [0, 40, 40]]);
})();

const DESENHO = [
  ['mec-vistas', 'Vistas ortográficas (1º diedro)', 240, 180, '<path d="M20 84 V24 H50 V54 H100 V84 Z"/>'
    + '<rect x="20" y="104" width="80" height="46"/><path d="M50 104 V150"/>'
    + '<rect x="130" y="24" width="46" height="60"/>' + oculta('M130 54 H176')
    + `<path d="M20 94 V100 M100 94 V100 M110 24 H120 M110 84 H120" stroke-width="1.1" stroke-dasharray="3 3"/>`
    + T(75, 39, 'VF', 14) + T(60, 166, 'VS', 14) + T(153, 98, 'VLE', 14) + diedroSvg(146, 150, 0.7)],
  ['mec-diedro1', 'Símbolo do 1º diedro', 130, 84, diedroSvg(14, 32) + T(65, 72, '1º diedro', 14)],
  ['mec-diedro3', 'Símbolo do 3º diedro', 130, 84, (() => { // espelhado: círculos à esquerda, cone com a ponta fina voltada para eles
    const x = 14, cy = 32; return `<circle cx="${x + 18}" cy="${cy}" r="18"/><circle cx="${x + 18}" cy="${cy}" r="9"/>`
      + `<path d="${P([[x + 50, cy - 9], [x + 92, cy - 18], [x + 92, cy + 18], [x + 50, cy + 9]], true)}"/>`
      + centro(`M${x - 6} ${cy} H${x + 98} M${x + 18} ${cy - 24} V${cy + 24}`) + T(65, 72, '3º diedro', 14);
  })()],
  ['mec-isometrica', 'Perspectiva isométrica (peça em L)', 170, 170, isoL],
  ['mec-cota-linear', 'Cota linear', 200, 84, '<rect x="30" y="56" width="140" height="22"/>'
    + fino('M30 52 V20 M170 52 V20 M30 30 H170', 1.4) + head(30, 30, 180, 10) + head(170, 30, 0, 10) + T(100, 18, '50', 17)],
  ['mec-cota-diametro', 'Cota de diâmetro (Ø)', 150, 125, '<circle cx="60" cy="75" r="40"/>' + cruz(60, 75, 48)
    + fino('M31.7 103.3 L106 29 H144', 1.4) + head(31.7, 103.3, 135, 10) + head(88.3, 46.7, -45, 10) + T(125, 18, 'Ø40', 17)],
  ['mec-cota-raio', 'Cota de raio (R)', 130, 110, '<path d="M10 104 V50 A40 40 0 0 1 50 10 H124"/>'
    + fino('M50 50 L21.7 21.7', 1.4) + head(21.7, 21.7, -135, 10) + fino('M46 50 H54 M50 46 V54', 1.4) + T(78, 66, 'R40', 17)],
  ['mec-cota-angular', 'Cota angular', 150, 110, '<path d="M20 95 H140 M20 95 L101 14"/>'
    + fino('M100 95 A80 80 0 0 0 76.6 38.4', 1.4) + head(100, 95, 90, 10) + head(76.6, 38.4, -135, 10) + T(116, 58, '45°', 17)],
  ['mec-linhas', 'Tipos de linha (NBR 8403)', 260, 150, '<path d="M12 22 H100" stroke-width="3.5"/>' + tl(112, 22, 'Visível')
    + fino('M12 56 H100', 1.3) + tl(112, 56, 'Cota e hachura')
    + oculta('M12 90 H100') + tl(112, 90, 'Oculta')
    + centro('M12 124 H100') + tl(112, 124, 'Centro e simetria')],
  ['mec-linhacentro', 'Furo com linhas de centro', 110, 110, '<circle cx="55" cy="55" r="32"/><circle cx="55" cy="55" r="14"/>' + cruz(55, 55, 44)],
  ['mec-corte', 'Corte com hachura', 200, 112, '<path d="M20 30 H85 V90 H20 Z M115 30 H180 V90 H115 Z"/>'
    + hach(20, 30, 85, 90) + hach(115, 30, 180, 90) + centro('M100 22 V98') + T(100, 12, 'CORTE A-A', 15)],
  ['mec-plano-corte', 'Plano de corte (A-A)', 200, 104, '<rect x="30" y="30" width="140" height="60"/><circle cx="100" cy="60" r="15"/>'
    + centro('M14 60 H186') + '<path d="M14 60 H30 M170 60 H186" stroke-width="4"/>'
    + seta(20, 58, 20, 34, 10, 2) + seta(180, 58, 180, 34, 10, 2) + T(34, 18, 'A', 16) + T(166, 18, 'A', 16)],
  ['mec-rugosidade', 'Rugosidade (com remoção de material)', 130, 104, '<path d="M27 67.5 L40 90 L75 29.4 H122 M27 67.5 H53"/>' + T(98, 44, 'Ra 1,6', 15)],
  ['mec-tolerancia', 'Quadro de tolerância geométrica', 200, 84, '<rect x="40" y="18" width="150" height="34"/><path d="M72 18 V52 M150 18 V52"/>'
    + '<path d="M56 26 V44 M46 44 H66" stroke-width="2.2"/>' + T(111, 35, '0,05', 17) + T(170, 35, 'A', 17)
    + fino('M40 35 H16 V70', 1.6) + head(16, 72, 90, 10) + '<path d="M4 76 H70" stroke-width="3"/>'],
  ['mec-referencia', 'Referência (datum)', 90, 96, '<rect x="25" y="8" width="40" height="40"/>' + T(45, 28, 'A', 18)
    + '<path d="M45 48 V64"/><path d="M33 80 H57 L45 64 Z" fill="#C"/><path d="M8 80 H82" stroke-width="3"/>'],
  ['mec-selo', 'Legenda (selo)', 250, 120, '<rect x="4" y="4" width="242" height="112"/><path d="M4 44 H246 M4 80 H246 M86 44 V116 M166 44 V116" stroke-width="1.8"/>'
    + T(125, 24, 'TÍTULO DA PEÇA', 16) + T(45, 62, 'Material', 14) + T(126, 62, 'Escala 1:1', 14) + T(206, 62, '1º diedro', 14)
    + T(45, 98, 'Desenhista', 14) + T(126, 98, 'Data', 14) + T(206, 98, 'Folha A4', 14)],
  ['mec-rosca', 'Rosca externa (representação)', 200, 86, '<path d="M14 28 H180 L186 34 V58 L180 64 H14 Z M70 28 V64 M180 28 V64"/>'
    + fino('M70 33 H186 M70 59 H186', 1.2) + centro('M6 46 H194') + T(128, 12, 'M20', 14)],
];

// ---------- elementos de máquinas ----------
const ELEMENTOS = [
  ['mec-engrenagem', 'Engrenagem cilíndrica de dentes retos', 130, 130, engr(65, 65, 18, 5.6, -Math.PI / 2)
    + `<circle cx="65" cy="65" r="50.4" stroke-width="1.2" stroke-dasharray="10 3 2 3"/><circle cx="65" cy="65" r="13"/><rect x="61" y="48" width="8" height="6" stroke-width="1.6"/>`],
  ['mec-par-engrenagens', 'Par de engrenagens', 220, 140, (() => {
    const m = 5.6, z1 = 12, z2 = 20, R1 = z1 * m / 2, R2 = z2 * m / 2, c1 = 50, c2 = c1 + R1 + R2;
    return engr(c1, 70, z1, m, 0) + engr(c2, 70, z2, m, Math.PI - Math.PI / z2)
      + `<circle cx="${c1}" cy="70" r="7"/><circle cx="${f(c2)}" cy="70" r="9"/>`
      + giro(c1, 70, 18, 200, 320) + giro(f(c2), 70, 30, 340, 220);
  })()],
  ['mec-cremalheira', 'Pinhão e cremalheira', 220, 140, (() => {
    const m = 6, z = 14, R = z * m / 2, cx = 110, cy = 56, py = cy + R, pt = Math.PI * m;
    let d = `M6 ${f(py + 1.2 * m)}`;
    for (let k = -4; k <= 3; k++) { const c = cx + (k + 0.5) * pt; if (c - 0.3 * pt < 6 || c + 0.3 * pt > 214) continue;
      d += ` L${f(c - 0.3 * pt)} ${f(py + 1.2 * m)} L${f(c - 0.15 * pt)} ${f(py - m)} L${f(c + 0.15 * pt)} ${f(py - m)} L${f(c + 0.3 * pt)} ${f(py + 1.2 * m)}`; }
    d += ` L214 ${f(py + 1.2 * m)} V122 H6 Z`;
    return engr(cx, cy, z, m, Math.PI / 2) + `<circle cx="${cx}" cy="${cy}" r="9"/><path d="${d}"/>` + giro(cx, cy, 24, 200, 320) + seta(140, 132, 180, 132, 9);
  })()],
  ['mec-conica', 'Engrenagens cônicas', 170, 145, (() => {
    const O = [110, 92], u1 = [-0.707, -0.707], u2 = [-0.707, 0.707], u3 = [0.707, -0.707], a = 34, b = 64;
    const pt = (u, r) => [O[0] + u[0] * r, O[1] + u[1] * r];
    const tronco = (ua, ub) => {
      let s = `<path d="${P([pt(ua, b), pt(ub, b), pt(ub, a), pt(ua, a)], true)}"/>`, dd = '';
      for (const t of [0.2, 0.4, 0.6, 0.8]) { const o = [pt(ua, b), pt(ub, b)], i = [pt(ua, a), pt(ub, a)];
        dd += `M${f(o[0][0] + (o[1][0] - o[0][0]) * t)} ${f(o[0][1] + (o[1][1] - o[0][1]) * t)} L${f(i[0][0] + (i[1][0] - i[0][0]) * t)} ${f(i[0][1] + (i[1][1] - i[0][1]) * t)} `; }
      return s + fino(dd.trim(), 1.2);
    };
    return tronco(u1, u2) + tronco(u1, u3) + '<path d="M64.7 86 H12 M64.7 98 H12 M104 46.7 V6 M116 46.7 V6"/>'
      + centro('M6 92 H110 M110 2 V92');
  })()],
  ['mec-semfim', 'Coroa e parafuso sem-fim', 200, 150, (() => {
    let fil = ''; for (let x = 36; x < 166; x += 14) fil += `M${x} 88 L${x + 10} 120 `;
    return `<clipPath id="mecsf"><rect x="0" y="0" width="200" height="88"/></clipPath><g clip-path="url(#mecsf)">${engr(100, 52, 20, 4, 0)}</g>`
      + '<circle cx="100" cy="52" r="10"/><rect x="30" y="88" width="140" height="32"/><path d="M10 98 H30 M10 110 H30 M170 98 H190 M170 110 H190"/>'
      + fino(fil.trim(), 1.6) + centro('M4 104 H196') + giro(100, 52, 22, 200, 320);
  })()],
  ['mec-polia-correia', 'Polias e correia', 220, 128, '<circle cx="58" cy="64" r="48"/><circle cx="58" cy="64" r="9"/><circle cx="178" cy="64" r="26"/><circle cx="178" cy="64" r="7"/>'
    + `<path d="${correia(58, 64, 53, 178, 31)}" stroke-width="2"/>` + head(125.7, 22.7, 10.5, 11)],
  ['mec-correia-cruzada', 'Correia cruzada', 230, 120, '<circle cx="56" cy="60" r="42"/><circle cx="56" cy="60" r="8"/><circle cx="186" cy="60" r="28"/><circle cx="186" cy="60" r="7"/>'
    + `<path d="${cruzada(56, 60, 46, 186, 32)}" stroke-width="2"/>` + giro(56, 60, 22, 200, 320, 1.6, 8) + giro(186, 60, 15, 340, 220, 1.6, 8)],
  ['mec-polia-v', 'Polia em V com correia (corte)', 140, 110, (() => {
    const aro = 'M20 20 H46 L60 70 H80 L94 20 H120 V100 H20 Z';
    return `<path d="${aro}"/>` + hachClip('mecpv', aro, 20, 20, 120, 100)
      + '<path d="M44.3 12 H95.7 L83.9 56 H56.1 Z" stroke-width="2.2"/>'
      + [54, 64, 76, 86].map((x) => `<circle cx="${x}" cy="22" r="2.6" fill="#C" stroke="none"/>`).join('');
  })()],
  ['mec-corrente', 'Corrente e rodas dentadas', 230, 120, (() => {
    let roletes = ''; const a = Math.acos((40 - 26) / 120), c = Math.cos(a), s = Math.sin(a);
    for (let t = 0.1; t < 0.95; t += 0.1) for (const sg of [-1, 1]) {
      const x = 60 + 40 * c + (120 + 26 * c - 40 * c) * t, y = 60 + sg * (40 * s + (26 * s - 40 * s) * t);
      roletes += `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="#C" stroke="none"/>`; }
    return engr(60, 60, 18, 4.44, 0, 0.03) + engr(180, 60, 12, 4.33, 0, 0.03)
      + '<circle cx="60" cy="60" r="8"/><circle cx="180" cy="60" r="6"/>'
      + `<path d="${correia(60, 60, 44, 180, 30)}" stroke-width="1.6"/><path d="${correia(60, 60, 36, 180, 22)}" stroke-width="1.6"/>` + roletes;
  })()],
  ['mec-eixo-chaveta', 'Eixo, cubo e chaveta (corte)', 140, 140, '<circle cx="70" cy="70" r="56"/>'
    + '<path d="M62 41.1 V48 H78 V41.1 A30 30 0 1 1 62 41.1 Z"/><path d="M62 41.1 V32 H78 V41.1" stroke-width="2"/>'
    + '<rect x="62" y="32" width="16" height="16" fill="#C"/>' + cruz(70, 74, 40)],
  ['mec-eixo-escalonado', 'Eixo escalonado', 230, 90, '<path d="M10 33 L14 29 H50 V23 H120 V15 H150 V27 H216 L220 31 V59 L216 63 H150 V75 H120 V67 H50 V61 H14 L10 57 Z M50 29 V61 M120 23 V67 M150 27 V63"/>'
    + '<rect x="66" y="39" width="38" height="12" rx="6" stroke-width="1.8"/>' + centro('M4 45 H226')],
  ['mec-rolamento', 'Rolamento de esferas', 130, 130, '<circle cx="65" cy="65" r="58"/><circle cx="65" cy="65" r="46"/><circle cx="65" cy="65" r="26"/><circle cx="65" cy="65" r="16"/>'
    + Array.from({ length: 10 }, (_, i) => `<circle cx="${f(65 + 36 * Math.cos(i * Math.PI / 5))}" cy="${f(65 + 36 * Math.sin(i * Math.PI / 5))}" r="9" stroke-width="2"/>`).join('')
    + cruz(65, 65, 12)],
  ['mec-rolamento-corte', 'Rolamento em corte', 120, 130, '<rect x="30" y="6" width="60" height="18"/><rect x="30" y="40" width="60" height="16"/><rect x="30" y="74" width="60" height="16"/><rect x="30" y="106" width="60" height="18"/>'
    + hach(30, 6, 90, 24, 6) + hach(30, 40, 90, 56, 6, true) + hach(30, 74, 90, 90, 6, true) + hach(30, 106, 90, 124, 6)
    + '<circle cx="60" cy="32" r="11" stroke-width="2"/><circle cx="60" cy="98" r="11" stroke-width="2"/>' + centro('M18 65 H102')],
  ['mec-mancal', 'Mancal de pedestal', 170, 130, '<rect x="14" y="104" width="142" height="18"/><path d="M38 104 L45 62 A40 40 0 0 1 125 62 L132 104"/>'
    + '<circle cx="85" cy="62" r="20"/><circle cx="85" cy="62" r="15" stroke-width="2"/>' + cruz(85, 62, 26)
    + '<rect x="81" y="12" width="8" height="10"/><circle cx="85" cy="9" r="3"/><rect x="24" y="96" width="12" height="8"/><rect x="134" y="96" width="12" height="8"/>'],
  ['mec-mola-compressao', 'Mola helicoidal de compressão', 200, 80, (() => {
    let fr = '', tr2 = ''; for (let i = 0; i < 8; i++) { const x = 24 + i * 19; fr += `M${x} 18 L${x + 9.5} 62 `; tr2 += `M${x + 9.5} 62 L${x + 19} 18 `; }
    return '<path d="M24 18 V62 M176 18 V62"/>' + fino(fr.trim(), 2.2) + fino(tr2.trim(), 1.2) + centro('M18 40 H182')
      + seta(2, 40, 16, 40, 8) + seta(198, 40, 184, 40, 8);
  })()],
  ['mec-mola-tracao', 'Mola helicoidal de tração', 220, 70, (() => {
    let d = ''; for (let i = 0; i < 14; i++) { const x = 48 + i * 9; d += `M${x} 22 L${x + 9} 48 `; }
    return fino(d.trim(), 2) + '<path d="M48 22 H174 M48 48 H174" stroke-width="1.2"/>'
      + '<path d="M48 22 A13 13 0 1 0 48 48 M174 22 A13 13 0 1 1 174 48" />' + seta(22, 35, 4, 35, 8) + seta(198, 35, 216, 35, 8);
  })()],
  ['mec-parafuso', 'Parafuso sextavado', 200, 80, '<rect x="14" y="16" width="26" height="48"/><path d="M14 30 H40 M14 50 H40" stroke-width="1.6"/>'
    + '<path d="M40 28 H180 L186 34 V46 L180 52 H40 M110 28 V52 M180 28 V52"/>' + fino('M110 31.5 H186 M110 48.5 H186', 1.2) + centro('M6 40 H194')],
  ['mec-porca', 'Porca sextavada (vista)', 110, 110, `<path d="${P(Array.from({ length: 6 }, (_, i) => [55 + 48 * Math.cos(i * Math.PI / 3), 55 + 48 * Math.sin(i * Math.PI / 3)]), true)}"/>`
    + '<circle cx="55" cy="55" r="41" stroke-width="1.3"/><circle cx="55" cy="55" r="18"/><path d="M55 33 A22 22 0 1 1 33 55" stroke-width="1.3"/>' + cruz(55, 55, 30)],
  ['mec-arruela', 'Arruela lisa (vistas)', 160, 100, '<circle cx="50" cy="50" r="36"/><circle cx="50" cy="50" r="16"/>' + cruz(50, 50, 44)
    + '<rect x="112" y="14" width="12" height="72"/>' + oculta('M112 34 H124 M112 66 H124') + centro('M104 50 H132')],
  ['mec-parafuso-montagem', 'União parafusada (corte)', 170, 170, (() => {
    const ch1 = 'M14 60 H70 V85 H14 Z M100 60 H156 V85 H100 Z', ch2 = 'M14 85 H70 V110 H14 Z M100 85 H156 V110 H100 Z';
    return `<path d="${ch1} ${ch2}"/>` + hach(14, 60, 70, 85) + hach(100, 60, 156, 85) + hach(14, 85, 70, 110, 7, true) + hach(100, 85, 156, 110, 7, true)
      + '<rect x="58" y="40" width="54" height="20"/><path d="M72 60 V140 L76 146 H94 L98 140 V60"/><rect x="60" y="110" width="50" height="6"/><rect x="58" y="116" width="54" height="20"/>'
      + fino('M75 116 V146 M95 116 V146', 1.2) + centro('M85 32 V156');
  })()],
  ['mec-rebite', 'Rebite em junta sobreposta', 160, 130, '<path d="M14 50 H70 V70 H14 Z M90 50 H110 V70 H90 Z M50 70 H70 V90 H50 Z M90 70 H146 V90 H90 Z"/>'
    + hach(14, 50, 70, 70) + hach(90, 50, 110, 70) + hach(50, 70, 70, 90, 7, true) + hach(90, 70, 146, 90, 7, true)
    + '<path d="M70 50 V90 M90 50 V90 M58 50 A22 16 0 0 1 102 50 M58 90 A22 14 0 0 0 102 90"/>' + centro('M80 24 V112')],
  ['mec-acoplamento', 'Acoplamento de flanges', 220, 120, '<path d="M8 50 H60 M8 70 H60 M160 50 H212 M160 70 H212"/>'
    + '<rect x="60" y="34" width="20" height="52"/><rect x="80" y="16" width="30" height="88"/><rect x="110" y="16" width="30" height="88"/><rect x="140" y="34" width="20" height="52"/>'
    + '<path d="M76 26 H144 M76 94 H144" stroke-width="2"/><rect x="70" y="21" width="10" height="10" fill="#C"/><rect x="140" y="21" width="10" height="10" fill="#C"/>'
    + '<rect x="70" y="89" width="10" height="10" fill="#C"/><rect x="140" y="89" width="10" height="10" fill="#C"/>' + centro('M4 60 H216')],
  ['mec-came', 'Came e seguidor', 140, 164, (() => {
    const pts = []; for (let i = 0; i < 72; i++) { const t = i * Math.PI / 36, r = 30 + 26 * ((1 + Math.cos(t + Math.PI / 2)) / 2) ** 2; pts.push([70 + r * Math.cos(t), 120 + r * Math.sin(t)]); }
    return `<path d="${P(pts, true)}"/><circle cx="70" cy="120" r="6" fill="#C"/>` + '<circle cx="70" cy="54" r="10"/><rect x="64" y="10" width="12" height="34"/>'
      + '<rect x="50" y="22" width="12" height="14" stroke-width="2"/><rect x="78" y="22" width="12" height="14" stroke-width="2"/>'
      + hach(50, 22, 62, 36, 5) + hach(78, 22, 90, 36, 5) + giro(70, 120, 20, 200, 330) + seta(110, 40, 110, 14, 8);
  })()],
  ['mec-biela', 'Biela-manivela', 247, 130, "<g transform=\"translate(6.94 0.00)\">" + ('<circle cx="50" cy="70" r="40" stroke-width="1.4" stroke-dasharray="6 4"/>'
    + '<path d="M50 70 L72.6 47.4" stroke-width="5"/><path d="M72.6 47.4 L178 70" stroke-width="5"/>'
    + '<path d="M140 48 H232 V92 H140"/><rect x="160" y="52" width="36" height="36"/>'
    + '<circle cx="50" cy="70" r="6" fill="#C"/><circle cx="72.6" cy="47.4" r="5"/><circle cx="178" cy="70" r="5"/>'
    + giro(50, 70, 52, 120, 220) + seta(200, 108, 228, 108, 8) + seta(200, 108, 172, 108, 8)) + "</g>"],
];

// ---------- pneumática e hidráulica (ISO 1219) ----------
const PNEU = [
  ['mec-cil-simples', 'Cilindro de simples ação (retorno por mola)', 210, 90, cilindro(20, 18, 150, 58, 50, 196)
    + fino('M56 38 l4 -10 l8 20 l8 -20 l8 20 l8 -20 l8 20 l8 -20 l8 20 l8 -20 l8 20 l8 -20 l4 10', 1.6) + '<path d="M30 58 V80"/>'],
  ['mec-cil-dupla', 'Cilindro de dupla ação', 210, 90, cilindro(20, 18, 150, 58, 60, 196) + '<path d="M32 58 V80 M138 58 V80"/>'],
  ['mec-cil-amort', 'Cilindro de dupla ação com amortecimento regulável', 210, 90, cilindro(20, 18, 150, 58, 70, 196)
    + '<rect x="58" y="31" width="10" height="14" stroke-width="1.8"/>'
    + '<rect x="128" y="31" width="10" height="14" stroke-width="1.8"/><rect x="72" y="31" width="10" height="14" stroke-width="1.8"/>'
    + seta(20, 70, 50, 6, 8, 1.4) + seta(124, 70, 154, 6, 8, 1.4) + '<path d="M32 58 V80 M138 58 V80"/>'],
  v32('mec-v32-botao', 'Válvula 3/2 NF, botão e mola', botao),
  v32('mec-v32-rolete', 'Válvula 3/2 NF, rolete e mola', rolete),
  v32('mec-v32-solenoide', 'Válvula 3/2 NF, solenoide e mola', solen),
  v52('mec-v52-solenoide', 'Válvula 5/2, solenoide e mola', solen, mola),
  v52('mec-v52-piloto', 'Válvula 5/2, duplo piloto (memória)', piloto, piloto),
  v52('mec-v52-alavanca', 'Válvula 5/2, alavanca e mola', alavanca, mola),
  ['mec-v43', 'Válvula 4/3 centro fechado (solenoides)', 232, 92, (() => {
    const y = 24, S = 40, b = 64;
    return quads(62, y, S, 3) + bloq(114, y, 1) + bloq(130, y, 1) + bloq(114, b, -1) + bloq(130, b, -1)
      + via(74, b, 74, y) + via(90, y, 90, b) + via(154, b, 170, y) + via(154, y, 170, b)
      + mola(62, 44, -1) + solen(36, 44, -1) + mola(182, 44, 1) + solen(208, 44, 1)
      + '<path d="M114 24 V8 M130 24 V8 M114 64 V80 M130 64 V80"/>' + tr(108, 12, 'A') + tl(136, 12, 'B') + tr(108, 80, 'P') + tl(136, 80, 'T');
  })()],
  ['mec-frl', 'Unidade de conservação (FRL)', 230, 104, '<path d="M4 60 H22 M58 60 H92 M128 60 H178 M214 60 H226"/>'
    + '<path d="M22 60 L40 42 L58 60 L40 78 Z"/>' + oculta('M40 44 V76') + '<path d="M40 78 V88 M34 88 H46" stroke-width="1.8"/>'
    + '<rect x="92" y="42" width="36" height="36"/>' + seta(96, 60, 124, 60, 8, 2)
    + fino('M110 42 l-8 -4 l16 -6 l-16 -6 l16 -6 l-8 -4', 1.6) + seta(98, 34, 124, 16, 7, 1.4)
    + '<path d="M140 60 V88 H110 V78" stroke-width="1.5" stroke-dasharray="5 3"/>'
    + '<circle cx="158" cy="34" r="11"/>' + seta(152, 41, 165, 27, 6, 1.4) + '<path d="M158 45 V60"/>'
    + '<path d="M178 60 L196 42 L214 60 L196 78 Z"/><path d="M196 44 V70 M190 64 L196 72 L202 64" stroke-width="1.8"/>'
    + '<rect x="14" y="10" width="208" height="88" stroke-width="1.3" stroke-dasharray="14 3 2 3"/>'],
  ['mec-fonte-ar', 'Fonte de ar comprimido', 60, 70, fonte(30, 50, 14) + '<path d="M30 36 V6"/>'],
  ['mec-compressor', 'Compressor (ISO 1219)', 110, 100, rotativa('fora', false)],
  ['mec-bomba-hid', 'Bomba hidráulica (ISO 1219)', 110, 100, rotativa('fora', true) + '<path d="M55 88 V98"/>'],
  ['mec-motor-pneu', 'Motor pneumático', 110, 100, rotativa('dentro', false).replace('M25 54 H8 M25 62 H8', 'M85 54 H102 M85 62 H102') + giro(55, 58, 18, 120, 230, 1.6, 7)],
  ['mec-motor-hid', 'Motor hidráulico', 110, 100, rotativa('dentro', true).replace('M25 54 H8 M25 62 H8', 'M85 54 H102 M85 62 H102') + giro(55, 58, 18, 120, 230, 1.6, 7)],
  ['mec-reservatorio-ar', 'Reservatório de ar comprimido', 160, 80, '<rect x="14" y="24" width="132" height="44" rx="22"/><path d="M80 24 V6"/>'],
  ['mec-tanque', 'Reservatório hidráulico (tanque)', 140, 90, '<path d="M14 30 V82 H126 V30"/><path d="M44 6 V24 M96 6 V66"/>'],
  ['mec-reg-fluxo', 'Válvula reguladora de fluxo unidirecional', 150, 104, '<path d="M4 40 H60 M90 40 H146 M34 40 V76 H63 M86 76 H116 V40"/>'
    + '<path d="M60 28 Q75 38 90 28 M60 52 Q75 42 90 52"/>' + seta(56, 62, 94, 18, 8, 1.6)
    + '<circle cx="70" cy="76" r="7" stroke-width="2"/><path d="M78 67 L88 76 L78 85" stroke-width="2"/>'
    + '<rect x="20" y="12" width="110" height="84" stroke-width="1.3" stroke-dasharray="14 3 2 3"/>'],
  ['mec-alternadora', 'Válvula alternadora (OU)', 140, 90, '<rect x="30" y="30" width="80" height="26"/><path d="M4 43 H30 M110 43 H136 M70 30 V6"/>'
    + '<path d="M30 33 L37 43 L30 53 M110 33 L103 43 L110 53" stroke-width="1.8"/><circle cx="46" cy="43" r="8" fill="#C"/>'
    + T(12, 60, '1', 14) + T(128, 60, '1', 14) + tl(76, 12, '2')],
  ['mec-simultaneidade', 'Válvula de simultaneidade (E)', 140, 90, '<rect x="30" y="30" width="80" height="26"/><path d="M4 43 H30 M110 43 H136 M70 30 V6"/>'
    + '<rect x="36" y="35" width="12" height="16" stroke-width="1.8"/><rect x="92" y="35" width="12" height="16" stroke-width="1.8"/><path d="M48 43 H92" stroke-width="2"/>'
    + T(12, 60, '1', 14) + T(128, 60, '1', 14) + tl(76, 12, '2')],
  ['mec-escape', 'Escape livre e silenciador', 170, 90, '<path d="M40 8 V46 M120 8 V36"/>' + esc(40, 46).replace('L40 54', 'L40 58').replace('M34 46 H46', 'M32 46 H48')
    + '<rect x="108" y="36" width="24" height="26"/>' + fino('M114 40 V58 M120 40 V58 M126 40 V58', 1.2) + T(40, 76, 'livre', 14) + T(120, 78, 'silenciador', 14)],
  ['mec-limitadora', 'Válvula limitadora de pressão', 130, 130, '<rect x="40" y="40" width="50" height="50"/>' + via(75, 86, 75, 44)
    + '<path d="M65 90 V122 M65 40 V12"/>' + mola(90, 65, 1) + seta(92, 82, 120, 48, 7, 1.4)
    + '<path d="M65 108 H24 V65 H40" stroke-width="1.5" stroke-dasharray="5 3"/>' + tr(58, 118, 'P') + tr(58, 18, 'T')],
  ['mec-linhas-iso', 'Linhas ISO 1219', 230, 150, '<path d="M12 18 H90"/>' + tl(104, 18, 'Trabalho')
    + '<path d="M12 46 H90" stroke-width="1.8" stroke-dasharray="10 5"/>' + tl(104, 46, 'Pilotagem')
    + '<path d="M12 74 H90" stroke-width="1.6" stroke-dasharray="3 3"/>' + tl(104, 74, 'Dreno')
    + '<path d="M12 102 H90 M51 102 V90"/><circle cx="51" cy="102" r="3.5" fill="#C"/>' + tl(104, 102, 'Conexão')
    + '<path d="M12 132 H90 M51 120 V144"/>' + tl(104, 132, 'Cruzamento')],
  ['mec-circuito-pneu', 'Circuito: cilindro com válvula 5/2', 220, 214, (() => {
    const x = 64, y = 110, S = 40, b = 150, xn = x + S, u = (q, t) => f(q + t * S);
    return cilindro(40, 14, 170, 44, 60, 206) + '<path d="M50 44 V74 H116 V110 M160 44 V88 H132 V110"/>'
      + quads(x, y, S, 2)
      + via(u(x, .5), b, u(x, .3), y) + via(u(x, .7), y, u(x, .8), b) + bloq(u(x, .2), b, -1)
      + via(u(xn, .5), b, u(xn, .7), y) + via(u(xn, .3), y, u(xn, .2), b) + bloq(u(xn, .8), b, -1)
      + solen(x, y + S / 2, -1) + mola(x + 2 * S, y + S / 2, 1)
      + `<path d="M${u(xn, .2)} ${b} V${b + 10} M${u(xn, .8)} ${b} V${b + 10} M${u(xn, .5)} ${b} V180"/>`
      + esc(u(xn, .2), b + 10) + esc(u(xn, .8), b + 10) + fonte(124, 194, 10)
      + T(38, 130, 'Y1', 14) + tr(36, 29, '1A', 14);
  })()],
];

// ---------- automação ----------
const AUTOMACAO = [
  ['mec-clp', 'CLP (entradas e saídas)', 210, 160, '<rect x="50" y="8" width="110" height="144" rx="4"/>' + T(105, 28, 'CLP', 18)
    + '<path d="M50 42 H160" stroke-width="1.6"/>'
    + [0, 1, 2, 3].map((i) => { const y = 58 + i * 24; return `<path d="M8 ${y} H46 M164 ${y} H202"/><circle cx="50" cy="${y}" r="3.5" fill="#C"/><circle cx="160" cy="${y}" r="3.5" fill="#C"/>`
      + tl(58, y, `I0.${i}`) + tr(152, y, `Q0.${i}`); }).join('')],
  lad('mec-ladder-na', 'Contato NA (ladder)', contato(60, 42), 'I0.0', 20),
  lad('mec-ladder-nf', 'Contato NF (ladder)', contato(60, 42, true), 'I0.1', 20),
  lad('mec-ladder-bobina', 'Bobina (ladder)', bobina(60, 42), 'Q0.0', 26),
  lad('mec-ladder-set', 'Bobina SET (liga e mantém)', bobina(60, 42, 'S'), 'Q0.0', 26),
  lad('mec-ladder-reset', 'Bobina RESET (desliga)', bobina(60, 42, 'R'), 'Q0.0', 26),
  lad('mec-ladder-borda', 'Contato de borda de subida (P)', contato(60, 42, false, 'P'), 'I0.2', 20),
  ['mec-ladder-ton', 'Temporizador TON (ladder)', 170, 130, '<rect x="50" y="30" width="70" height="92"/>' + T(85, 16, 'T1', 15) + T(85, 44, 'TON', 15)
    + '<path d="M8 70 H50 M24 102 H50 M120 70 H162 M120 102 H162"/>' + tl(55, 70, 'IN') + tl(55, 102, 'PT') + tr(115, 70, 'Q') + tr(115, 102, 'ET')
    + T(30, 89, 'T#5s', 14)],
  ['mec-ladder-ctu', 'Contador CTU (ladder)', 170, 130, '<rect x="50" y="30" width="70" height="94"/>' + T(85, 16, 'C1', 15) + T(85, 44, 'CTU', 15)
    + '<path d="M8 64 H50 M8 86 H50 M24 110 H50 M120 64 H162 M120 110 H162"/>' + tl(55, 64, 'CU') + tl(55, 86, 'R') + tl(55, 110, 'PV')
    + tr(115, 64, 'Q') + tr(115, 110, 'CV') + T(34, 98, '10', 14)],
  ['mec-ladder-selo', 'Ladder: partida com selo', 260, 136, '<path d="M10 8 V128 M250 8 V128" stroke-width="3.5"/>'
    + '<path d="M10 50 H50 M70 50 H110 M130 50 H198 M222 50 H250 M95 50 V100 H110 M130 100 H145 V50"/>'
    + '<circle cx="95" cy="50" r="3.5" fill="#C"/><circle cx="145" cy="50" r="3.5" fill="#C"/>'
    + contato(60, 50, true) + contato(120, 50) + contato(120, 100) + bobina(210, 50)
    + T(60, 24, 'I0.0', 14) + T(120, 24, 'I0.1', 14) + T(120, 124, 'Q0.0', 14) + T(210, 24, 'Q0.0', 14)],
  ['mec-ladder-trilhos', 'Trilhos de alimentação (ladder)', 200, 130, '<path d="M14 6 V124 M186 6 V124" stroke-width="3.5"/>'
    + fino('M14 34 H186 M14 66 H186 M14 98 H186', 1.4) + T(30, 16, 'L+', 14) + T(166, 16, 'M', 14)],
  sensor('mec-sensor-indutivo', 'Sensor indutivo (símbolo)', '<path d="M43 39 q3 -6 6 0 q3 6 6 0 q3 -6 6 0" stroke-width="1.6"/>' + T(49, 52, 'Fe', 14)),
  sensor('mec-sensor-capacitivo', 'Sensor capacitivo (símbolo)', '<path d="M45 35 V55 M53 35 V55 M37 45 H45 M53 45 H61" stroke-width="2"/>'),
  sensor('mec-sensor-optico', 'Sensor óptico (símbolo)', seta(58, 38, 42, 38, 6, 1.6) + seta(58, 52, 42, 52, 6, 1.6)),
  ['mec-barreira', 'Sensor óptico de barreira', 220, 90, '<rect x="10" y="25" width="50" height="40"/><rect x="160" y="25" width="50" height="40"/>'
    + T(35, 45, 'E', 17) + T(185, 45, 'R', 17) + '<path d="M60 45 H150" stroke-width="1.8" stroke-dasharray="8 5"/>' + head(158, 45, 0, 10)
    + '<path d="M60 38 L72 30 M60 52 L72 60 M160 38 L148 30 M160 52 L148 60" stroke-width="1.4"/>'],
  ['mec-fimcurso-rolete', 'Fim de curso com rolete (vista)', 150, 130, '<rect x="56" y="60" width="64" height="58" rx="4"/>'
    + '<path d="M88 60 L58 26" stroke-width="3"/><circle cx="88" cy="60" r="4" fill="#C"/><circle cx="52" cy="20" r="9"/>'
    + '<path d="M4 36 H22 L36 8" stroke-width="2"/>' + seta(10, 50, 34, 50, 8) + '<path d="M78 118 V126 M98 118 V126"/>'],
  ['mec-inversor', 'Inversor de frequência com motor', 252, 110, '<path d="M8 55 H80 M150 55 H190"/>'
    + fino('M30 62 L36 48 M37 62 L43 48 M44 62 L50 48 M162 62 L168 48 M169 62 L175 48 M176 62 L182 48', 1.6)
    + '<rect x="80" y="20" width="70" height="70"/><path d="M80 90 L150 20" stroke-width="1.6"/>' + T(98, 38, '~', 22) + T(132, 72, '~', 22)
    + '<circle cx="218" cy="55" r="28"/>' + T(218, 47, 'M', 18) + T(218, 67, '3~', 14)],
  ['mec-servo', 'Servoacionamento (drive, motor, encoder)', 250, 110, '<rect x="8" y="20" width="82" height="70"/>' + T(49, 44, 'Servo', 15) + T(49, 66, 'drive', 15)
    + '<path d="M90 45 H140"/><circle cx="166" cy="55" r="26"/>' + T(166, 55, 'M', 18) + '<path d="M192 55 H200"/><rect x="200" y="40" width="36" height="30"/>' + T(218, 55, 'E', 16)
    + '<path d="M218 70 V100 H49 V90" stroke-width="1.6" stroke-dasharray="6 4"/>' + head(49, 91, -90, 8)],
  ['mec-encoder', 'Encoder incremental (disco e sinais A/B)', 200, 130, '<circle cx="60" cy="65" r="52"/><circle cx="60" cy="65" r="8"/>'
    + Array.from({ length: 20 }, (_, i) => { const a = i * Math.PI / 10; return `M${f(60 + 36 * Math.cos(a))} ${f(65 + 36 * Math.sin(a))} L${f(60 + 46 * Math.cos(a))} ${f(65 + 46 * Math.sin(a))}`; }).reduce((s, d) => s + `<path d="${d}" stroke-width="4"/>`, '')
    + fino('M136 48 H142 V34 H154 V48 H166 V34 H178 V48 H190 V34 H196', 2) + fino('M136 98 H148 V84 H160 V98 H172 V84 H184 V98 H196', 2)
    + T(126, 41, 'A', 15) + T(126, 91, 'B', 15)],
  ['mec-torre', 'Torre de sinalização', 80, 170, '<path d="M22 22 A18 12 0 0 1 58 22"/><rect x="22" y="22" width="36" height="26"/><rect x="22" y="48" width="36" height="26"/><rect x="22" y="74" width="36" height="26"/>'
    + '<rect x="34" y="100" width="12" height="50"/><rect x="16" y="150" width="48" height="12"/>'
    + fino('M8 14 L16 20 M72 14 L64 20 M40 2 V8', 1.6)],
  ['mec-ihm', 'IHM (painel de operação)', 170, 130, '<rect x="6" y="6" width="158" height="118" rx="6"/><rect x="18" y="18" width="94" height="68"/>'
    + fino('M30 74 V56 M44 74 V44 M58 74 V60 M72 74 V36 M86 74 V50 M100 74 V30', 4)
    + [20, 42, 64, 86].map((y) => `<rect x="124" y="${y}" width="28" height="16" rx="3" stroke-width="2"/>`).join('') + T(65, 106, 'IHM', 15)],
  ['mec-grafcet', 'GRAFCET (etapas e transições)', 160, 176, '<rect x="50" y="16" width="40" height="40"/><rect x="54" y="20" width="32" height="32" stroke-width="1.8"/>' + T(70, 36, '0', 17)
    + '<path d="M70 56 V92"/><path d="M58 74 H82" stroke-width="4"/>' + tl(92, 74, 'b0')
    + '<rect x="50" y="92" width="40" height="40"/>' + T(70, 112, '1', 17) + '<path d="M90 112 H104"/><rect x="104" y="98" width="50" height="28"/>' + T(129, 112, 'A+', 15)
    + '<path d="M70 132 V166 H26 V6 H70 V16"/><path d="M58 150 H82" stroke-width="4"/>' + tl(92, 150, 'a1') + head(26, 80, -90, 10)],
  ['mec-trajeto-passo', 'Diagrama trajeto-passo (A+ B+ A− B−)', 230, 140, fino('M50 14 V116 M90 14 V116 M130 14 V116 M170 14 V116 M210 14 V116 M50 20 H210 M50 50 H210 M50 80 H210 M50 110 H210', 1)
    + '<path d="M50 50 L90 20 H130 L170 50 H210 M50 110 H90 L130 80 H170 L210 110" stroke-width="3"/>'
    + T(26, 35, 'A', 17) + T(26, 95, 'B', 17) + [1, 2, 3, 4, 5].map((n, i) => T(50 + 40 * i, 130, String(n), 14)).join('')],
];

// ---------- usinagem e soldagem ----------
const USINAGEM = [
  ['mec-torno', 'Torno mecânico (esquema)', 260, 140, '<rect x="10" y="96" width="240" height="14"/><path d="M22 110 V134 H44 V110 M216 110 V134 H238 V110"/>'
    + '<rect x="14" y="30" width="56" height="66"/><rect x="70" y="44" width="14" height="38"/><rect x="84" y="56" width="112" height="14"/>'
    + '<rect x="206" y="46" width="38" height="50"/><rect x="196" y="58" width="10" height="10"/><path d="M196 58 L190 63 L196 68" stroke-width="2"/>'
    + '<rect x="120" y="84" width="50" height="12"/><rect x="136" y="74" width="16" height="10"/><path d="M140 74 L146 70 L150 74" fill="#C" stroke-width="1.6"/>'
    + giro(42, 63, 16, 200, 330, 1.6, 8)],
  ['mec-fresadora', 'Fresadora (esquema)', 200, 192, '<rect x="120" y="20" width="50" height="150"/><rect x="40" y="20" width="80" height="30"/><rect x="50" y="50" width="30" height="40"/>'
    + '<rect x="58" y="90" width="14" height="22"/>' + fino('M58 96 L72 102 M58 104 L72 110', 1.4)
    + '<rect x="40" y="114" width="60" height="12"/><rect x="20" y="126" width="100" height="12"/><rect x="60" y="138" width="60" height="32"/><rect x="10" y="170" width="180" height="14"/>'
    + giro(65, 100, 14, 200, 330, 1.6, 7)],
  ['mec-furadeira', 'Furadeira de bancada (esquema)', 160, 204, '<rect x="20" y="186" width="120" height="14"/><rect x="104" y="20" width="12" height="166"/><rect x="30" y="20" width="100" height="50" rx="4"/>'
    + '<rect x="56" y="70" width="16" height="26"/><path d="M54 96 H74 L70 110 H58 Z"/><path d="M62 110 V144 L65 150 L68 144 V110"/>' + fino('M62 118 L68 124 M62 128 L68 134 M62 138 L68 144', 1.2)
    + '<rect x="30" y="156" width="74" height="10"/><rect x="44" y="148" width="40" height="8"/><path d="M130 46 L150 32 M130 46 L152 52" stroke-width="2"/><circle cx="150" cy="32" r="3" fill="#C"/><circle cx="152" cy="52" r="3" fill="#C"/>'],
  ['mec-ferramenta-corte', 'Ferramenta de corte (ângulos α, β, γ)', 220, 130, '<path d="M4 80 H110 L124 64 H216 M4 104 H216"/>' + hach(4, 84, 216, 104, 9)
    + '<path d="M110 80 L30 69 V20 H98 Z"/>' + hachClip('mecfc', 'M110 80 L30 69 V20 H98 Z', 30, 20, 110, 80, 9, true)
    + '<path d="M101 50 Q108 20 130 22 Q146 26 140 42 M124 64 Q128 46 140 42" stroke-width="2"/>'
    + oculta('M110 80 V22') + T(112, 10, 'γ', 15) + T(78, 62, 'β', 15) + T(60, 92, 'α', 15) + fino('M70 80 A40 40 0 0 1 70.4 74.5', 1.4)
    + seta(196, 118, 156, 118, 8, 1.6) + T(208, 118, 'vc', 14)],
  ['mec-broca', 'Broca helicoidal', 220, 70, '<rect x="10" y="24" width="80" height="22"/><path d="M90 24 H190 L196.6 35 L190 46 H90"/>'
    + fino('M96 24 L110 46 M114 24 L128 46 M132 24 L146 46 M150 24 L164 46 M168 24 L182 46', 1.6) + centro('M4 35 H214') + T(196, 12, '118°', 14)],
  ['mec-fresa-topo', 'Fresa de topo', 90, 200, '<rect x="30" y="6" width="30" height="86"/><path d="M28 92 H62 V180 L56 186 H34 L28 180 Z"/>'
    + fino('M28 104 L62 120 M28 124 L62 140 M28 144 L62 160 M28 164 L62 180', 1.6) + centro('M45 2 V196')],
  ['mec-torneamento', 'Torneamento (avanço e rotação)', 210, 130, '<rect x="6" y="15" width="14" height="80"/><rect x="20" y="25" width="80" height="60"/><rect x="100" y="33" width="80" height="44"/>'
    + '<path d="M100 80 L128 120 H146 L108 80 Z" fill="#C"/>' + centro('M2 55 H200') + seta(80, 108, 40, 108, 9) + T(28, 108, 'f', 16)
    + giro(190, 55, 14, -60, 60, 1.6, 8) + T(196, 18, 'n', 16)],
  ['mec-solda-eletrodo', 'Soldagem com eletrodo revestido', 180, 160, '<rect x="70" y="8" width="40" height="22" rx="3"/><path d="M110 18 Q140 18 160 6"/>'
    + '<rect x="82" y="30" width="16" height="80"/><path d="M87 30 V114 M93 30 V114" stroke-width="1.4"/>'
    + '<path d="M90 114 L86 119 L94 123 L88 128" stroke-width="2"/><rect x="10" y="128" width="160" height="18"/><path d="M24 128 Q50 116 80 128" fill="#C" stroke-width="1.6"/>'
    + '<path d="M70 110 Q60 100 66 90 M110 110 Q120 100 114 90" stroke-width="1.4" stroke-dasharray="4 3"/>' + seta(130, 112, 160, 112, 8, 1.6)],
  ['mec-solda-mig', 'Soldagem MIG/MAG (tocha)', 180, 160, '<path d="M76 30 Q60 10 30 8 M104 30 Q90 4 60 4" stroke-width="2"/><rect x="74" y="30" width="32" height="20"/>'
    + '<path d="M70 50 H110 L102 100 H78 Z"/><rect x="85" y="84" width="10" height="16" stroke-width="1.8"/><path d="M90 100 V116" stroke-width="2.5"/>'
    + '<path d="M90 116 L86 120 L94 124 L90 128" stroke-width="1.8"/><path d="M78 100 L60 126 M102 100 L120 126" stroke-width="1.4" stroke-dasharray="4 3"/>'
    + '<rect x="10" y="128" width="160" height="18"/><path d="M24 128 Q50 116 82 128" fill="#C" stroke-width="1.6"/>'],
  ['mec-solda-tig', 'Soldagem TIG (tocha e vareta)', 180, 160, '<path d="M98 8 L118 30" stroke-width="10"/><path d="M86 30 H124 L118 92 H92 Z"/>'
    + '<path d="M102 92 V110 L105 116 L108 110 V92" fill="#C"/><path d="M105 116 L101 120 L109 124 L105 128" stroke-width="1.8"/>'
    + '<path d="M92 92 L76 124 M118 92 L134 124" stroke-width="1.4" stroke-dasharray="4 3"/><path d="M14 78 L84 124" stroke-width="3"/>'
    + '<rect x="10" y="128" width="160" height="18"/><path d="M130 128 Q150 118 166 128" fill="#C" stroke-width="1.6"/>'],
  ['mec-simbolo-solda', 'Símbolo de solda (filete)', 220, 100, '<path d="M60 40 L22 86 M60 40 H190 M190 40 L204 26 M190 40 L204 54"/>' + head(20, 88, 130, 11)
    + '<path d="M96 40 V64 L120 40" stroke-width="2.5"/>' + T(80, 54, 'a5', 15)],
];

// ---------- metrologia ----------
const ticks = (x0, x1, y, passo, curto, longo, cada = 5, dir = -1) => {
  let d = ''; for (let i = 0, x = x0; x <= x1 + 0.01; i++, x += passo) d += `M${f(x)} ${y} V${f(y + dir * (i % cada ? curto : longo))} `;
  return fino(d.trim(), 1.1);
};
const METROLOGIA = [
  ['mec-paquimetro', 'Paquímetro', 270, 120, '<rect x="10" y="20" width="250" height="20"/>' + ticks(40, 254, 20, 7, 5, 10, 5, 1)
    + '<path d="M10 40 H34 V100 L28 112 H10 Z M26 20 L30 4 H34 V20" stroke-width="2.5"/>'
    + '<path d="M60 14 H124 V58 H80 V100 L74 112 H60 Z M60 14 V4 H64 L68 14" stroke-width="2.5"/>' + ticks(64, 118, 40, 6.3, 4, 7, 5, 1)
    + '<rect x="98" y="6" width="10" height="8"/><circle cx="47" cy="84" r="12" stroke-width="2"/>'],
  ['mec-micrometro', 'Micrômetro externo', 250, 140, '<path d="M46 46 V92 Q46 126 86 126 H110 Q140 126 140 96 V50" stroke-width="12"/>'
    + '<rect x="38" y="33" width="18" height="14"/><rect x="72" y="35" width="58" height="10"/><rect x="130" y="28" width="20" height="24"/>'
    + '<rect x="150" y="30" width="46" height="20"/><path d="M150 40 H196" stroke-width="1.2"/>' + ticks(154, 194, 40, 5, 4, 4, 2, -1) + ticks(156.5, 194, 40, 5, 3, 3, 2, 1)
    + '<path d="M196 24 H226 V56 H196 Z"/>' + fino('M196 30 H202 M196 36 H202 M196 42 H202 M196 48 H202', 1.1) + fino('M212 24 V56 M217 24 V56 M222 24 V56', 1)
    + '<rect x="226" y="32" width="18" height="16" rx="3"/>'],
  ['mec-relogio', 'Relógio comparador', 140, 200, '<circle cx="70" cy="70" r="58"/><circle cx="70" cy="70" r="50" stroke-width="1.6"/>'
    + Array.from({ length: 50 }, (_, i) => { const a = i * Math.PI / 25 - Math.PI / 2, r2 = i % 5 ? 45 : 40; return `M${f(70 + 50 * Math.cos(a))} ${f(70 + 50 * Math.sin(a))} L${f(70 + r2 * Math.cos(a))} ${f(70 + r2 * Math.sin(a))}`; }).reduce((s, d) => s + d + ' ', '<path stroke-width="1.1" d="') + '"/>'
    + T(70, 32, '0', 14) + '<path d="M70 70 L97 46" stroke-width="2.5"/><circle cx="70" cy="70" r="4" fill="#C"/>'
    + '<circle cx="70" cy="98" r="10" stroke-width="1.6"/><path d="M70 98 L64 92" stroke-width="1.6"/>'
    + '<rect x="62" y="128" width="16" height="32"/><rect x="67" y="160" width="6" height="26"/><circle cx="70" cy="191" r="5"/>'],
  ['mec-goniometro', 'Goniômetro (transferidor)', 220, 140, '<path d="M20 110 A90 90 0 0 1 200 110"/><rect x="6" y="110" width="208" height="12"/>'
    + Array.from({ length: 19 }, (_, i) => { const a = Math.PI + i * Math.PI / 18, r2 = i % 3 ? 82 : 74; return `M${f(110 + 90 * Math.cos(a))} ${f(110 + 90 * Math.sin(a))} L${f(110 + r2 * Math.cos(a))} ${f(110 + r2 * Math.sin(a))}`; }).reduce((s, d) => s + d + ' ', '<path stroke-width="1.2" d="') + '"/>'
    + elo(110, 110, 110 + 120 * Math.cos(rad(-38)), 110 + 120 * Math.sin(rad(-38)), 10).replace('Z"/>', 'Z" stroke-width="2"/>')
    + '<circle cx="110" cy="110" r="5" fill="#C"/>' + fino('M142 110 A32 32 0 0 0 135.2 90.3', 1.4) + T(152, 98, 'θ', 15)],
  ['mec-calibrador-folga', 'Calibrador de folga (lâminas)', 200, 130, "<g transform=\"translate(0.00 7.00)\">" + ([-6, -16, -26, -36].map((g) => {
    const a = rad(g), q = (u, v) => [30 + u * Math.cos(a) - v * Math.sin(a), 92 + u * Math.sin(a) + v * Math.cos(a)];
    return `<path d="${P([q(0, -6), q(150, -4), q(160, 0), q(150, 4), q(0, 6)], true)}" stroke-width="1.8"/>`;
  }).join('') + '<circle cx="30" cy="92" r="12"/><circle cx="30" cy="92" r="4" fill="#C"/>' + T(150, 108, '0,05 mm', 14)) + "</g>"],
  ['mec-tampao', 'Calibrador tampão (passa / não passa)', 220, 70, '<rect x="16" y="20" width="54" height="30"/><rect x="70" y="27" width="80" height="16" rx="3"/><rect x="150" y="22" width="34" height="26"/>'
    + fino('M80 27 V43 M88 27 V43 M96 27 V43 M104 27 V43 M112 27 V43 M120 27 V43 M128 27 V43 M136 27 V43', 1) + '<path d="M156 22 V48" stroke-width="1.6"/>'
    + T(43, 35, 'P', 16) + T(170, 35, 'NP', 14)],
];

// ---------- manutenção ----------
const MANUTENCAO = [
  ['mec-rolamento-falha', 'Rolamento com falha (lascamento)', 130, 130, '<circle cx="65" cy="65" r="58"/><circle cx="65" cy="65" r="46"/><circle cx="65" cy="65" r="26"/><circle cx="65" cy="65" r="16"/>'
    + Array.from({ length: 10 }, (_, i) => `<circle cx="${f(65 + 36 * Math.cos(i * Math.PI / 5 + 0.3))}" cy="${f(65 + 36 * Math.sin(i * Math.PI / 5 + 0.3))}" r="9" stroke-width="2"/>`).join('')
    + '<path d="M50 21 L55 16 L60 20 L56 24 Z M64 17 L70 13 L74 18 L68 22 Z M78 19 L82 16 L85 21 L80 23 Z" fill="#C" stroke-width="1"/>'
    + '<path d="M112 46 L104 52 L110 58 L102 64" stroke-width="2"/>'],
  ['mec-desalinhamento', 'Desalinhamento de eixos (paralelo e angular)', 230, 150, T(60, 12, 'Paralelo', 14) + T(60, 84, 'Angular', 14)
    + '<rect x="10" y="26" width="98" height="16"/><rect x="122" y="38" width="98" height="16"/>' + centro('M6 34 H226 M118 46 H226')
    + '<rect x="10" y="100" width="98" height="16"/>' + `<path d="${P([[122, 102], [220, 88], [222.3, 103.8], [124.3, 117.8]], true)}"/>`
    + centro('M6 108 H226') + centro(P([[118, 110.5], [226, 95.3]]))],
  ['mec-almotolia', 'Lubrificação (almotolia)', 150, 130, '<path d="M24 124 H86 Q92 124 92 116 L86 70 Q70 52 56 52 Q40 52 24 70 L18 116 Q18 124 24 124 Z"/>'
    + '<path d="M48 52 V40 H64 V52"/><path d="M62 44 L138 12" stroke-width="4"/>' + '<path d="M140 22 Q134 32 140 34 Q146 32 140 22 Z" fill="#C"/><path d="M140 40 Q136 46 140 48 Q144 46 140 40 Z" fill="#C"/>'],
  ['mec-graxeira', 'Pino graxeiro', 110, 130, '<rect x="30" y="88" width="50" height="22"/><path d="M42 88 V110 M68 88 V110" stroke-width="1.6"/><path d="M40 110 H70 V124 H40 Z"/>'
    + fino('M40 114 H70 M40 118 H70', 1.1) + '<rect x="46" y="58" width="18" height="30"/><path d="M44 58 A12 12 0 1 1 66 58 Z"/>' + seta(88, 20, 66, 38, 8, 1.8)],
  ['mec-loto', 'Bloqueio e etiquetagem', 170, 150, '<path d="M32 66 V48 A18 18 0 0 1 68 48 V66"/><rect x="22" y="66" width="56" height="54" rx="6"/>'
    + '<circle cx="50" cy="88" r="6"/><path d="M50 94 V106" stroke-width="3"/>' + '<rect x="100" y="40" width="64" height="100" rx="6"/><circle cx="132" cy="52" r="5"/>'
    + '<path d="M68 52 Q100 30 128 50" stroke-width="1.6"/>' + T(132, 82, 'NÃO', 15) + T(132, 102, 'OPERE', 14) + '<path d="M108 118 H156" stroke-width="3"/>'],
  ['mec-vibracao', 'Análise de vibração (sensor no mancal)', 220, 120, '<rect x="10" y="60" width="70" height="50"/><circle cx="45" cy="84" r="14"/>' + cruz(45, 84, 18)
    + '<rect x="36" y="44" width="18" height="16" fill="#C"/><path d="M54 50 Q80 50 100 34" stroke-width="1.6"/><rect x="100" y="14" width="114" height="92" rx="4"/>'
    + fino('M108 60 L114 44 L118 70 L123 50 L128 66 L132 38 L137 78 L142 52 L147 64 L151 42 L156 74 L161 54 L166 64 L171 40 L176 76 L181 52 L186 62 L191 46 L196 70 L201 56 L206 60', 1.6)],
];

// ---------- robótica ----------
const ROBOTICA = [
  ['mec-robo6', 'Braço robótico de 6 eixos', 200, 200, '<rect x="50" y="180" width="80" height="12"/><rect x="66" y="156" width="48" height="24"/>'
    + elo(90, 144, 60, 74, 22) + elo(60, 74, 140, 56, 18) + elo(140, 56, 162, 66, 12)
    + '<circle cx="90" cy="144" r="6" fill="#C"/><circle cx="60" cy="74" r="5" fill="#C"/><circle cx="140" cy="56" r="4" fill="#C"/>'
    + '<path d="M168 70 L180 62 M168 70 L176 82" stroke-width="2.5"/>'
    + '<path d="M56 168 A34 8 0 0 0 124 168" stroke-width="1.4"/>' + head(124, 166, -90, 8) + T(134, 160, '1', 14) + T(112, 140, '2', 14) + T(40, 64, '3', 14)
    + T(100, 46, '4', 14) + T(138, 34, '5', 14) + T(186, 48, '6', 14)],
  ['mec-garra', 'Garra paralela', 150, 150, '<rect x="60" y="2" width="30" height="8"/><rect x="35" y="10" width="80" height="50" rx="4"/>'
    + '<rect x="40" y="60" width="16" height="70"/><rect x="94" y="60" width="16" height="70"/><circle cx="75" cy="110" r="19"/>'
    + seta(20, 40, 34, 40, 7, 1.6) + seta(130, 40, 116, 40, 7, 1.6)],
  ['mec-ventosa', 'Ventosa (garra a vácuo)', 100, 130, '<path d="M50 50 V4"/><rect x="40" y="50" width="20" height="16"/><path d="M42 66 V72 H58 V66 M42 72 L22 92 H78 L58 72"/>'
    + '<rect x="10" y="92" width="80" height="14"/>' + hach(10, 92, 90, 106, 7) + seta(64, 40, 64, 12, 7, 1.4)],
  ['mec-esteira', 'Esteira transportadora', 260, 120, '<circle cx="40" cy="70" r="18"/><circle cx="220" cy="70" r="18"/><path d="M40 50 H220 A20 20 0 0 1 220 90 H40 A20 20 0 0 1 40 50 Z" stroke-width="2"/>'
    + '<rect x="70" y="20" width="40" height="30"/><rect x="140" y="28" width="30" height="22"/>' + T(220, 70, 'M', 15)
    + '<circle cx="90" cy="70" r="5"/><circle cx="130" cy="70" r="5"/><circle cx="170" cy="70" r="5"/><path d="M60 90 V116 M200 90 V116"/>' + seta(186, 14, 226, 14, 9)],
  ['mec-agv', 'AGV (veículo autoguiado)', 220, 130, '<rect x="20" y="60" width="180" height="40" rx="8"/><circle cx="55" cy="104" r="12"/><circle cx="165" cy="104" r="12"/>'
    + '<rect x="100" y="46" width="20" height="14"/><path d="M120 50 L170 34 M120 53 L176 50 M120 56 L170 66" stroke-width="1.4" stroke-dasharray="5 4"/>'
    + '<path d="M4 116 H216"/><path d="M30 120 H190" stroke-width="4"/><rect x="40" y="30" width="50" height="30"/>'],
  ['mec-scara', 'Robô SCARA', 200, 160, '<rect x="20" y="146" width="56" height="10"/><rect x="34" y="56" width="28" height="90"/>'
    + elo(48, 56, 120, 56, 20) + elo(120, 70, 172, 70, 16) + '<path d="M172 70 V132" stroke-width="5"/><path d="M164 132 H180 M166 132 V142 M178 132 V142" stroke-width="2"/>'
    + '<circle cx="48" cy="56" r="4" fill="#C"/><circle cx="120" cy="63" r="4" fill="#C"/>' + giro(48, 30, 14, 200, 340, 1.4, 7) + giro(120, 34, 12, 200, 340, 1.4, 7)],
];

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "mc-valvula-portas",
        "Válvula direcional — modelo de portas",
        400,
        250,
        "<rect x=\"95\" y=\"75\" width=\"210\" height=\"105\" rx=\"3\"/><path d=\"M200 75 V180 M125 75 V47 M175 75 V47 M125 180 V208 M175 180 V208\"/><text x=\"125\" y=\"25\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A</text><text x=\"175\" y=\"25\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">B</text><text x=\"125\" y=\"231\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">P</text><text x=\"175\" y=\"231\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">T</text><text x=\"146\" y=\"125\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Estado 1</text><text x=\"251\" y=\"125\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Estado 2</text>"
      ],
      [
        "mc-sequencia-estados",
        "Atuador — sequência e conexões",
        560,
        224,
        "<text x=\"280\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Atuador — sequência e conexões</text><rect x=\"10\" y=\"42\" width=\"540\" height=\"178\" rx=\"3\"/><text x=\"77.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Estado</text><text x=\"212.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Comando</text><path d=\"M145 42 V220\"/><text x=\"347.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Portas</text><path d=\"M280 42 V220\"/><text x=\"482.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Movimento</text><path d=\"M415 42 V220\"/><path d=\"M10 68 H550\"/><path d=\"M10 106 H550\"/><path d=\"M10 144 H550\"/><path d=\"M10 182 H550\"/>"
      ]
    ]
  ]
];

export default {
  id: 'mecanica',
  nome: 'Mecânica e Mecatrônica',
  destaques: ['mec-vistas', 'mec-cota-linear', 'mec-corte', 'mec-engrenagem', 'mec-polia-correia', 'mec-rolamento', 'mec-cil-simples', 'mec-cil-dupla',
    'mec-v32-botao', 'mec-v52-solenoide', 'mec-clp', 'mec-ladder-na', 'mec-ladder-bobina', 'mec-paquimetro', 'mec-robo6'],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Desenho técnico', DESENHO],
    ['Elementos de máquinas', ELEMENTOS],
    ['Pneumática e hidráulica (ISO 1219)', PNEU],
    ['Automação e CLP', AUTOMACAO],
    ['Usinagem e soldagem', USINAGEM],
    ['Metrologia', METROLOGIA],
    ['Manutenção', MANUTENCAO],
    ['Robótica', ROBOTICA],
  ],
};
