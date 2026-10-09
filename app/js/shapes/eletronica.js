// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
import { T, head } from './base.js';

// Eletrônica: semicondutores e sensores (convenções IEC 60617) e portas lógicas no formato distintivo (IEEE/ANSI 91).
// Desenhos próprios do Giz Livre; coordenadas feitas à mão.

const f1 = (v) => +v.toFixed(1);
const t = (x, y, s, size = 12) => T(x, y, s, size).replace('font-weight="600"', 'font-weight="500"');

// diodo pequeno no meio de um segmento: triângulo cheio apontando para `ang` (graus) e barra no ápice
const dAt = (mx, my, ang, s = 9) => {
  const a = ang * Math.PI / 180, c = Math.cos(a), n = Math.sin(a);
  const ax = mx + s * c, ay = my + s * n, bx = mx - s * c, by = my - s * n;
  return `<path d="M${f1(ax)},${f1(ay)} L${f1(bx - s * n)},${f1(by + s * c)} L${f1(bx + s * n)},${f1(by - s * c)} Z" fill="#C"/>`
    + `<path d="M${f1(ax - s * n)},${f1(ay + s * c)} L${f1(ax + s * n)},${f1(ay - s * c)}"/>`;
};

// diodo horizontal (anodo à esquerda) com centro vertical cy; `bar` permite trocar o traço do catodo
const diode = (cy, bar) => `<path d="M4 ${cy} H46 M78 ${cy} H116"/><path d="M46 ${cy - 18} L78 ${cy} L46 ${cy + 18} Z" fill="#C"/>`
  + (bar ?? `<path d="M78 ${cy - 18} V${cy + 18}"/>`);

// ---------- portas lógicas (140 x 80, saída em y = 40) ----------
const AND = 'M30 8 H62 A32 32 0 0 1 62 72 H30 Z';
const OR = 'M26 8 H52 Q86 10 104 40 Q86 70 52 72 H26 Q44 40 26 8 Z';
const orX = (y) => { const k = (y - 8) / 64; return f1(26 + 36 * k * (1 - k)); }; // borda traseira do OU
const xorX = (y) => { const k = (y - 8) / 64; return f1(16 + 36 * k * (1 - k)); };
const ins = (ys, xf) => '<path d="' + ys.map(y => `M4 ${y} H${typeof xf === 'function' ? xf(y) : xf}`).join(' ') + '"/>';
const bubble = (cx) => `<circle cx="${cx}" cy="40" r="6"/><path d="M${cx + 6} 40 H136"/>`;
const gate = (body, inputs, out) => `<path d="${body}"/>` + inputs + out;
const TRI = 'M34 10 L94 40 L34 70 Z';

// ---------- blocos retangulares (flip-flops, MUX etc.) ----------
// L/R: listas [y, rótulo]; rótulo '>' = entrada de clock (triângulo); '~Q' = rótulo barrado
const block = (w, h, bx, by, bw, bh, L, R, title, extra = '') => {
  let s = `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="2"/>`;
  let wires = '';
  for (const [y, lb] of L) {
    wires += `M4 ${y} H${bx} `;
    if (lb === '>') s += `<path d="M${bx} ${y - 7} L${bx + 11} ${y} L${bx} ${y + 7}" stroke-width="1.8"/>`;
    else if (lb.startsWith('>')) s += `<path d="M${bx} ${y - 7} L${bx + 11} ${y} L${bx} ${y + 7}" stroke-width="1.8"/>` + t(bx + 24, y, lb.slice(1), 11);
    else s += t(bx + 6 + lb.length * 3.6, y, lb);
  }
  for (const [y, lb] of R) {
    wires += `M${bx + bw} ${y} H${w - 4} `;
    const bar = lb.startsWith('~'), txt = bar ? lb.slice(1) : lb, cx = bx + bw - 6 - txt.length * 3.6;
    s += t(cx, y, txt);
    if (bar) s += `<path d="M${f1(cx - txt.length * 3.8)} ${y - 9} H${f1(cx + txt.length * 3.8)}" stroke-width="1.4"/>`;
  }
  if (title) s += t(bx + bw / 2, by + 13, title, 12);
  return `<path d="${wires.trim()}"/>` + s + extra;
};
const ff = (id, nome, L) => [id, nome, 140, 120, block(140, 120, 30, 8, 80, 104, L, [[30, 'Q'], [90, '~Q']], '')];

// ---------- mais formas ----------
// peças de circuito para os esquemas com amp-op e filtros
const op = (x, yc, menosEmCima = true) => `<path d="M${x} ${yc - 36} L${x + 68} ${yc} L${x} ${yc + 36} Z"/>`
  + T(x + 11, yc - 18, menosEmCima ? '−' : '+', 18) + T(x + 11, yc + 18, menosEmCima ? '+' : '−', 18);
const rh = (x1, x2, y) => { const m = (x1 + x2) / 2; return `<path d="M${x1} ${y} H${m - 17} M${m + 17} ${y} H${x2}"/><rect x="${m - 17}" y="${y - 6}" width="34" height="12"/>`; };
const rv = (x, y1, y2) => { const m = (y1 + y2) / 2; return `<path d="M${x} ${y1} V${m - 17} M${x} ${m + 17} V${y2}"/><rect x="${x - 6}" y="${m - 17}" width="12" height="34"/>`; };
const ch = (x1, x2, y) => { const m = (x1 + x2) / 2; return `<path d="M${x1} ${y} H${m - 4} M${m + 4} ${y} H${x2}"/><path d="M${m - 4} ${y - 11} V${y + 11} M${m + 4} ${y - 11} V${y + 11}" stroke-width="3"/>`; };
const cv = (x, y1, y2) => { const m = (y1 + y2) / 2; return `<path d="M${x} ${y1} V${m - 4} M${x} ${m + 4} V${y2}"/><path d="M${x - 12} ${m - 4} H${x + 12} M${x - 12} ${m + 4} H${x + 12}" stroke-width="3"/>`; };
const gnd = (x, y) => `<path d="M${x} ${y} V${y + 8} M${x - 11} ${y + 8} H${x + 11} M${x - 6} ${y + 13} H${x + 6} M${x - 2} ${y + 18} H${x + 2}" stroke-width="2"/>`;
const term = (x, y) => `<circle cx="${x}" cy="${y}" r="3"/>`;
const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="3" fill="#C" stroke="none"/>`;
// amp-op com entrada no − e realimentação por cima (inversor, integrador, derivador)
const inversora = (entrada, realim, le, lr) => term(8, 62) + entrada + '<path d="M80 62 H110 M80 62 V24 M200 24 V80 M178 80 H229 M110 98 H92"/>'
  + realim + op(110, 80) + gnd(92, 98) + dot(80, 62) + dot(200, 80) + term(232, 80)
  + t(46, 46, le, 11) + t(140, 8, lr, 11) + t(8, 46, 'vi', 11) + t(232, 64, 'vo', 11);
// portas lógicas no formato retangular da IEC 60617-12
const iec = (rot, n = 2, neg = false, size = 20) => '<rect x="36" y="8" width="64" height="64" rx="2"/>'
  + ins(n === 1 ? [40] : [24, 56], 36) + (neg ? '<circle cx="106" cy="40" r="6"/><path d="M112 40 H136"/>' : '<path d="M100 40 H136"/>') + T(68, 40, rot, size);
// filtro em bloco: três ondas (alta, média e baixa frequência); `cortes` = índices das ondas barradas
const filtro = (cortes) => '<rect x="30" y="10" width="70" height="70" rx="2"/><path d="M4 45 H30 M100 45 H126"/>'
  + [26, 45, 64].map((y, i) => `<path d="M51 ${y} Q58 ${y - 8} 65 ${y} T79 ${y}" stroke-width="1.8"/>` + (cortes.includes(i) ? `<path d="M57 ${y + 8} L73 ${y - 8}" stroke-width="1.6"/>` : '')).join('');
// bloco com diagonal (conversores): rótulos/ícones nos dois cantos
const conv = (a, b, w = 120) => `<rect x="30" y="10" width="${w - 60}" height="70" rx="2"/><path d="M30 80 L${w - 30} 10" stroke-width="1.6"/><path d="M4 45 H30 M${w - 30} 45 H${w - 4}"/>` + a + b;
const tilde = (x, y) => `<path d="M${x - 10} ${y} Q${x - 5} ${y - 7} ${x} ${y} T${x + 10} ${y}" stroke-width="1.8"/>`;
const igual = (x, y) => `<path d="M${x - 9} ${y - 3} H${x + 9} M${x - 9} ${y + 3} H${x + 9}" stroke-width="1.8"/>`;
const barramento = (x, y) => `<path d="M${x - 4} ${y + 7} L${x + 4} ${y - 7}" stroke-width="1.6"/>`;

const SEMI2 = [
  ['eo-varicap', 'Diodo varicap', 120, 54, '<path d="M4 27 H46 M86 27 H116"/><path d="M46 9 L78 27 L46 45 Z" fill="#C"/><path d="M78 9 V45 M86 9 V45"/>'],
  ['eo-tvs', 'Diodo TVS (bidirecional)', 140, 54, '<path d="M4 27 H40 M96 27 H136"/><path d="M40 9 L68 27 L40 45 Z M96 9 L68 27 L96 45 Z" fill="#C"/><path d="M60 5 L68 9 V45 L76 49"/>'],
  ['eo-diac', 'DIAC', 120, 110, '<path d="M60 4 V34 M60 76 V106 M28 34 H92 M28 76 H92 M30 34 L45 76 L60 34 M60 76 L75 34 L90 76"/>'],
  ['eo-igbt', 'IGBT', 110, 110, '<path d="M4 78 H30 M30 32 V78"/><path d="M42 30 V80" stroke-width="3.5"/><path d="M42 42 L74 22 V4 M42 68 L74 88 V106"/>'
    + head(70, 85.5, 32, 10) + t(92, 14, 'C') + t(92, 96, 'E') + t(12, 66, 'G')],
  ['eo-darlington', 'Par Darlington', 130, 130, '<path d="M4 50 H34 M34 42 L60 26 V12 H106 V56 M34 58 L60 74 V82 H80 M80 72 L106 56 M80 92 L106 108 V126 M106 12 V4"/>'
    + '<path d="M34 34 V66 M80 66 V98" stroke-width="3.5"/>' + head(57, 72.2, 31.6, 10) + head(103, 106.2, 31.6, 10) + t(120, 10, 'C') + t(10, 38, 'B') + t(120, 120, 'E')],
  ['eo-ujt', 'Transistor unijunção (UJT)', 100, 110, '<path d="M62 24 V86" stroke-width="3.5"/><path d="M62 30 H86 V4 M62 80 H86 V106 M4 88 H22 L56 69"/>'
    + head(60, 66.8, -29, 10) + t(74, 14, 'B2', 11) + t(74, 96, 'B1', 11) + t(10, 74, 'E', 11)],
  ['eo-mosfetdep', 'MOSFET de depleção (canal N)', 110, 110, '<path d="M4 78 H32 M32 32 V78"/><path d="M44 28 V82" stroke-width="3.5"/>'
    + '<path d="M44 34 H76 V4 M44 76 H76 V106 M44 55 H76 V76"/>' + head(46, 55, 180, 10) + t(96, 14, 'D') + t(96, 96, 'S') + t(12, 66, 'G')],
  ['eo-jfetp', 'JFET canal P', 100, 110, '<path d="M44 24 V86" stroke-width="3.5"/><path d="M44 32 H72 V4 M44 78 H72 V106 M4 78 H42"/>' + head(26, 78, 180, 11)
    + t(88, 14, 'D') + t(88, 96, 'S') + t(12, 66, 'G')],
  ['eo-mosfetpot', 'MOSFET de potência (com diodo)', 130, 110, '<path d="M4 78 H32 M32 32 V78"/><path d="M44 28 V40 M44 49 V61 M44 70 V82" stroke-width="3.5"/>'
    + '<path d="M44 34 H76 V4 M44 76 H76 V106 M44 55 H76 V76 M76 20 H106 V46 M106 64 V90 H76"/><path d="M95 64 H117 L106 46 Z" fill="#C"/><path d="M95 46 H117"/>'
    + head(46, 55, 180, 10) + t(64, 12, 'D') + t(64, 100, 'S') + t(12, 66, 'G')],
  ['eo-laser', 'Diodo laser', 120, 70, diode(45) + '<path d="M52 10 H92 M52 22 H92" stroke-width="1.6"/>' + head(102, 10, 0, 9) + head(102, 22, 0, 9)],
  ['eo-optotriac', 'Optoacoplador com TRIAC', 160, 110,
    '<rect x="10" y="16" width="140" height="78" rx="4" stroke-width="1.5" stroke-dasharray="6 4"/>'
    + '<path d="M30 4 V36 M30 58 V106 M18 58 H42"/><path d="M18 36 H42 L30 58 Z" fill="#C"/>'
    + '<path d="M52 40 H72 M52 58 H72" stroke-width="1.6"/>' + head(78, 40, 0, 8) + head(78, 58, 0, 8)
    + '<path d="M116 4 V36 M116 76 V106 M96 36 H136 M96 76 H136 M98 36 L107 76 L116 36 M116 76 L125 36 L134 76"/>'],
];

const AMPOP = [
  ['eo-ao-inversor', 'Amplificador inversor', 240, 130, inversora(rh(11, 80, 62), rh(80, 200, 24), 'R1', 'Rf')],
  ['eo-ao-naoinv', 'Amplificador não inversor', 240, 146, term(8, 62) + '<path d="M11 62 H110 M110 98 H88 M88 98 V130 M200 130 V80 M178 80 H229"/>'
    + rh(30, 88, 98) + rh(88, 200, 130) + gnd(30, 98) + op(110, 80, false) + dot(88, 98) + dot(200, 80) + term(232, 80)
    + t(59, 84, 'R1', 11) + t(144, 115, 'Rf', 11) + t(8, 46, 'vi', 11) + t(232, 64, 'vo', 11)],
  ['eo-ao-seguidor', 'Seguidor de tensão', 220, 110, term(8, 84) + '<path d="M11 84 H90 M158 66 H209 M180 66 V14 H70 V48 H90"/>' + op(90, 66)
    + dot(180, 66) + term(212, 66) + t(8, 68, 'vi', 11) + t(212, 50, 'vo', 11)],
  ['eo-ao-somador', 'Somador inversor', 250, 150, [60, 86, 112].map(y => term(8, y) + rh(11, 100, y)).join('')
    + '<path d="M100 60 V112 M100 86 H130 M100 60 V24 M220 24 V104 M198 104 H239 M130 122 H116"/>' + rh(100, 220, 24) + op(130, 104) + gnd(116, 122)
    + dot(100, 86) + dot(100, 60) + dot(220, 104) + term(242, 104) + t(56, 46, 'R1', 11) + t(56, 72, 'R2', 11) + t(56, 98, 'R3', 11) + t(160, 10, 'Rf', 11) + t(242, 88, 'vo', 11)],
  ['eo-ao-diferencial', 'Amplificador diferencial', 250, 166, term(8, 58) + rh(11, 100, 58) + term(8, 94) + rh(11, 110, 94)
    + '<path d="M100 58 H130 M100 58 V22 M220 22 V76 M198 76 H239 M110 94 H130"/>' + rh(100, 220, 22) + rv(110, 94, 140) + gnd(110, 140) + op(130, 76)
    + dot(100, 58) + dot(220, 76) + dot(110, 94) + term(242, 76)
    + t(56, 44, 'R1', 11) + t(160, 8, 'R2', 11) + t(56, 80, 'R3', 11) + t(128, 120, 'R4', 11) + t(8, 42, 'v1', 11) + t(8, 112, 'v2', 11) + t(242, 60, 'vo', 11)],
  ['eo-ao-integrador', 'Integrador', 240, 130, inversora(rh(11, 80, 62), ch(80, 200, 24), 'R', 'C')],
  ['eo-ao-derivador', 'Derivador', 240, 130, inversora(ch(11, 80, 62), rh(80, 200, 24), 'C', 'R')],
  ['eo-ao-schmitt', 'Schmitt trigger (amp-op)', 240, 130, term(8, 98) + '<path d="M11 98 H110 M86 62 H110 M86 62 V22 M200 22 V80 M178 80 H229"/>'
    + rh(30, 86, 62) + gnd(30, 62) + rh(86, 200, 22) + op(110, 80, false) + dot(86, 62) + dot(200, 80) + term(232, 80)
    + t(58, 48, 'R1', 11) + t(143, 8, 'R2', 11) + t(8, 114, 'vi', 11) + t(232, 64, 'vo', 11)],
];

const PORTAS_IEC = [
  ['eo-iec-and', 'Porta E (IEC, &)', 140, 80, iec('&amp;')],
  ['eo-iec-or', 'Porta OU (IEC, ≥1)', 140, 80, iec('≥1', 2, false, 18)],
  ['eo-iec-not', 'Porta NÃO (IEC)', 140, 80, iec('1', 1, true)],
  ['eo-iec-buffer', 'Buffer (IEC)', 140, 80, iec('1', 1)],
  ['eo-iec-nand', 'Porta NÃO-E (IEC)', 140, 80, iec('&amp;', 2, true)],
  ['eo-iec-nor', 'Porta NÃO-OU (IEC)', 140, 80, iec('≥1', 2, true, 18)],
  ['eo-iec-xor', 'Porta OU exclusivo (IEC, =1)', 140, 80, iec('=1', 2, false, 18)],
  ['eo-iec-xnor', 'Porta XNOR (IEC)', 140, 80, iec('=1', 2, true, 18)],
];

const SEQ2 = [
  ['eo-ffdpc', 'Flip-flop D com PRE e CLR', 140, 150, block(140, 150, 30, 22, 80, 106, [[46, 'D'], [104, '>']], [[46, 'Q'], [104, '~Q']], '')
    + '<path d="M70 4 V11 M70 139 V146"/><circle cx="70" cy="16" r="5"/><circle cx="70" cy="134" r="5"/>' + t(70, 34, 'PRE', 10) + t(70, 118, 'CLR', 10)],
  ['eo-ffjkneg', 'Flip-flop JK (borda de descida)', 140, 120, block(140, 120, 30, 8, 80, 104, [[30, 'J'], [90, 'K']], [[30, 'Q'], [90, '~Q']], '')
    + '<path d="M4 60 H19"/><circle cx="24.5" cy="60" r="5.5"/><path d="M30 53 L41 60 L30 67" stroke-width="1.8"/>'],
  ['eo-latchsr', 'Latch SR', 140, 120, block(140, 120, 30, 8, 80, 104, [[30, 'S'], [90, 'R']], [[30, 'Q'], [90, '~Q']], '')],
  ['eo-latchd', 'Latch D (transparente)', 140, 120, block(140, 120, 30, 8, 80, 104, [[30, 'D'], [90, 'EN']], [[30, 'Q'], [90, '~Q']], '')],
];

const CIS = [
  ['eo-555', 'CI 555 (temporizador)', 180, 170, block(180, 170, 46, 14, 88, 142, [[52, 'TRIG'], [80, 'THR'], [108, 'DIS'], [136, 'CV']], [[66, 'OUT'], [122, 'RST']], '')
    + '<path d="M90 4 V14 M90 156 V166"/>' + t(90, 30, '555', 14) + t(110, 8, 'VCC', 10) + t(110, 162, 'GND', 10)
    + t(20, 43, '2', 10) + t(20, 71, '6', 10) + t(20, 99, '7', 10) + t(20, 127, '5', 10) + t(158, 57, '3', 10) + t(158, 113, '4', 10) + t(82, 8, '8', 10) + t(82, 162, '1', 10)],
  ['eo-adc', 'Conversor A/D', 140, 90, conv(T(52, 30, 'A', 17), T(88, 62, 'D', 17), 140) + barramento(124, 45) + t(124, 30, 'n', 11)],
  ['eo-dac', 'Conversor D/A', 140, 90, conv(T(52, 30, 'D', 17), T(88, 62, 'A', 17), 140) + barramento(16, 45) + t(16, 30, 'n', 11)],
  ['eo-ula', 'ULA (unidade lógica e aritmética)', 160, 150, '<path d="M14 20 H66 L80 44 L94 20 H146 L114 120 H46 Z M40 4 V20 M120 4 V20 M80 120 V146 M4 70 H30"/>'
    + t(40, 34, 'A') + t(120, 34, 'B') + t(80, 108, 'F') + T(80, 76, 'ULA', 16) + t(13, 60, 'op', 10)],
  ['eo-memoria', 'Memória (RAM)', 150, 140, block(150, 140, 40, 8, 74, 124, [[34, 'A'], [62, 'D'], [90, 'WE'], [114, 'CS']], [[62, 'Q']], 'RAM') + barramento(20, 34) + barramento(128, 62)],
  ['eo-codificador', 'Codificador 4:2', 140, 140, block(140, 140, 34, 8, 72, 124, [[34, 'I0'], [58, 'I1'], [82, 'I2'], [106, 'I3']], [[50, 'A0'], [90, 'A1']], 'COD')],
  ['eo-compmag', 'Comparador de magnitude', 160, 130, block(160, 130, 40, 8, 80, 114, [[40, 'A'], [90, 'B']], [], 'COMP')
    + '<path d="M120 40 H156 M120 66 H156 M120 92 H156"/>' + t(104, 40, 'A&gt;B', 11) + t(104, 66, 'A=B', 11) + t(104, 92, 'A&lt;B', 11)],
];

const OSC_FILTROS = [
  ['eo-oscilador', 'Oscilador (gerador de sinal)', 120, 80, '<rect x="30" y="10" width="60" height="60" rx="2"/><path d="M90 40 H116"/><path d="M40 40 Q47.5 24 55 40 T70 40 T85 40" stroke-width="1.8"/>'],
  ['eo-filtro-pb', 'Filtro passa-baixas (bloco)', 130, 90, filtro([0])],
  ['eo-filtro-pa', 'Filtro passa-altas (bloco)', 130, 90, filtro([2])],
  ['eo-filtro-pf', 'Filtro passa-faixa (bloco)', 130, 90, filtro([0, 2])],
  ['eo-filtro-rf', 'Filtro rejeita-faixa (bloco)', 130, 90, filtro([1])],
  ['eo-rc-pb', 'Filtro RC passa-baixas', 200, 104, term(8, 30) + term(8, 90) + term(192, 30) + term(192, 90) + rh(11, 110, 30)
    + '<path d="M110 30 H189 M11 90 H189"/>' + cv(130, 30, 90) + dot(130, 30) + dot(130, 90) + t(60, 14, 'R', 11) + t(154, 60, 'C', 11) + t(10, 60, 'vi', 11) + t(190, 60, 'vo', 11)],
  ['eo-rc-pa', 'Filtro RC passa-altas', 200, 104, term(8, 30) + term(8, 90) + term(192, 30) + term(192, 90) + ch(11, 110, 30)
    + '<path d="M110 30 H189 M11 90 H189"/>' + rv(130, 30, 90) + dot(130, 30) + dot(130, 90) + t(60, 10, 'C', 11) + t(152, 60, 'R', 11) + t(10, 60, 'vi', 11) + t(190, 60, 'vo', 11)],
];

const FONTES = [
  ['eo-lm317', 'Regulador ajustável (LM317)', 150, 90, '<rect x="40" y="12" width="70" height="48" rx="2"/><path d="M4 30 H40 M110 30 H146 M75 60 V86"/>'
    + t(75, 28, 'LM317', 13) + t(50, 48, 'E', 11) + t(100, 48, 'S', 11) + t(96, 78, 'ADJ', 10)],
  ['eo-retificador', 'Retificador (bloco CA/CC)', 120, 90, conv(tilde(48, 30), igual(74, 62))],
  ['eo-cccc', 'Conversor CC-CC (bloco)', 120, 90, conv(igual(48, 30), igual(74, 62))],
  ['eo-meiaonda', 'Retificador de meia onda', 220, 110, term(8, 28) + term(8, 92) + '<path d="M11 28 H80 M108 28 H190 M11 92 H190"/>'
    + '<path d="M80 14 L108 28 L80 42 Z" fill="#C"/><path d="M108 14 V42"/>' + rv(190, 28, 92) + T(14, 60, '~', 20) + t(210, 60, 'RL', 11) + t(94, 54, 'D', 11)],
  ['eo-zenerreg', 'Regulador com Zener', 220, 110, term(8, 28) + term(8, 92) + term(212, 28) + term(212, 92) + rh(11, 120, 28)
    + '<path d="M120 28 H209 M11 92 H209 M140 28 V50 M140 70 V92"/><path d="M128 70 H152 L140 50 Z" fill="#C"/><path d="M124 54 L128 50 H152 L156 46"/>'
    + dot(140, 28) + dot(140, 92) + t(66, 12, 'R', 11) + t(172, 60, 'DZ', 11) + t(10, 60, 'vi', 11) + t(210, 60, 'vo', 11)],
];

const SENSORES2 = [
  ['eo-ptc', 'Termistor (PTC)', 140, 80, '<path d="M4 40 H38 M102 40 H136"/><rect x="38" y="28" width="64" height="24"/>'
    + '<path d="M18 70 H32 L104 10" stroke-width="1.8"/>' + t(120, 66, '+t°', 14)],
  ['eo-hall', 'Sensor de efeito Hall', 120, 110, '<rect x="30" y="25" width="60" height="60"/><path d="M30 25 L90 85 M90 25 L30 85" stroke-width="1.4"/><path d="M4 55 H30 M90 55 H116 M60 4 V25 M60 85 V106"/>'],
  ['eo-termopar', 'Termopar', 100, 110, '<path d="M30 4 V60 L50 90" stroke-width="1.8"/><path d="M70 4 V60 L50 90" stroke-width="4.5"/><circle cx="50" cy="92" r="4.5" fill="#C" stroke="none"/>'
    + t(18, 14, '+', 15) + t(84, 14, '−', 15)],
  ['eo-strain', 'Extensômetro (strain gauge)', 140, 70, '<rect x="30" y="10" width="80" height="50" rx="3" stroke-width="1.4"/>'
    + '<path d="M40 50 V20 H48 V50 H56 V20 H64 V50 H72 V20 H80 V50 H88 V20 H96 V50 H104" stroke-width="1.6"/><path d="M4 50 H40 M104 50 H136"/>'],
];

export default {
  id: 'eletronica', nome: 'Eletrônica',
  secoes: [
    ['Semicondutores', [
      ['eo-diodo', 'Diodo', 120, 50, diode(25)],
      ['eo-zener', 'Diodo Zener', 120, 54, diode(27, '<path d="M70 5 L78 9 V45 L86 49"/>')],
      ['eo-led', 'LED', 120, 70, diode(45) + '<path d="M62 22 L74 10 M76 28 L88 16" stroke-width="1.6"/>' + head(76, 8, -45, 8) + head(90, 14, -45, 8)],
      ['eo-fotodiodo', 'Fotodiodo', 120, 70, diode(45) + '<path d="M96 6 L84 18 M108 14 L96 26" stroke-width="1.6"/>' + head(82, 20, 135, 8) + head(94, 28, 135, 8)],
      ['eo-schottky', 'Diodo Schottky', 120, 54, diode(27, '<path d="M86 15 V9 H78 V45 H70 V39"/>')],
      ['eo-ponte', 'Ponte retificadora', 140, 140,
        '<path d="M70 16 L124 70 L70 124 L16 70 Z M4 70 H16 M124 70 H136 M70 4 V16 M70 124 V136"/>'
        + dAt(43, 43, -45) + dAt(97, 43, 225) + dAt(43, 97, 225) + dAt(97, 97, -45)
        + t(9, 56, '~', 18) + t(131, 56, '~', 18) + t(84, 8, '+', 16) + t(84, 132, '−', 16)],
      ['eo-npn', 'Transistor NPN', 100, 110, '<circle cx="56" cy="55" r="34"/><path d="M4 55 H42 M42 45 L70 24 V4 M42 65 L70 86 V106"/><path d="M42 33 V77" stroke-width="3.5"/>' + head(66, 83, 37, 11)],
      ['eo-pnp', 'Transistor PNP', 100, 110, '<circle cx="56" cy="55" r="34"/><path d="M4 55 H42 M42 45 L70 24 V4 M42 65 L70 86 V106"/><path d="M42 33 V77" stroke-width="3.5"/>' + head(47, 41, 143, 11)],
      ['eo-mosfetn', 'MOSFET canal N', 110, 110,
        '<path d="M4 78 H32 M32 32 V78" /><path d="M44 28 V40 M44 49 V61 M44 70 V82" stroke-width="3.5"/>'
        + '<path d="M44 34 H76 V4 M44 76 H76 V106 M44 55 H76 V76"/>' + head(46, 55, 180, 10)
        + t(96, 14, 'D') + t(96, 96, 'S') + t(12, 66, 'G')],
      ['eo-mosfetp', 'MOSFET canal P', 110, 110,
        '<path d="M4 78 H32 M32 32 V78" /><path d="M44 28 V40 M44 49 V61 M44 70 V82" stroke-width="3.5"/>'
        + '<path d="M44 34 H76 V4 M44 76 H76 V106 M44 55 H76 V76"/>' + head(70, 55, 0, 10)
        + t(96, 14, 'D') + t(96, 96, 'S') + t(12, 66, 'G')],
      ['eo-jfet', 'JFET canal N', 100, 110,
        '<path d="M44 24 V86" stroke-width="3.5"/><path d="M44 32 H72 V4 M44 78 H72 V106 M4 78 H42"/>' + head(43, 78, 0, 11)
        + t(88, 14, 'D') + t(88, 96, 'S') + t(12, 66, 'G')],
      ['eo-scr', 'Tiristor (SCR)', 120, 80, diode(35) + '<path d="M78 53 L96 72"/>' + t(106, 66, 'G')],
      ['eo-triac', 'TRIAC', 120, 110,
        '<path d="M60 4 V34 M60 76 V106 M28 34 H92 M28 76 H92 M30 34 L45 76 L60 34 M60 76 L75 34 L90 76 M90 76 L108 96"/>' + t(108, 82, 'G')],
      ['eo-fototransistor', 'Fototransistor', 110, 110,
        '<circle cx="62" cy="55" r="34"/><path d="M48 45 L76 24 V4 M48 65 L76 86 V106"/><path d="M48 33 V77" stroke-width="3.5"/>'
        + head(72, 83, 37, 11) + '<path d="M6 30 L24 46 M6 50 L24 66" stroke-width="1.6"/>' + head(30, 51, 42, 8) + head(30, 71, 42, 8)],
      ['eo-opto', 'Optoacoplador', 160, 110,
        '<rect x="10" y="16" width="140" height="78" rx="4" stroke-width="1.5" stroke-dasharray="6 4"/>'
        + '<path d="M30 4 V36 M30 58 V106 M18 58 H42"/><path d="M18 36 H42 L30 58 Z" fill="#C"/>'
        + '<path d="M52 40 H72 M52 58 H72" stroke-width="1.6"/>' + head(78, 40, 0, 8) + head(78, 58, 0, 8)
        + '<path d="M96 33 V77" stroke-width="3.5"/><path d="M96 45 L124 26 V4 M96 65 L124 84 V106"/>' + head(120, 81, 34, 10)],
      ...SEMI2,
    ]],
    ['Sensores e transdutores', [
      ['eo-ldr', 'LDR', 140, 74, '<path d="M4 50 H38 M102 50 H136"/><rect x="38" y="38" width="64" height="24"/>'
        + '<path d="M40 6 L54 22 M64 6 L78 22" stroke-width="1.6"/>' + head(58, 27, 49, 8) + head(82, 27, 49, 8)],
      ['eo-ntc', 'Termistor (NTC)', 140, 80, '<path d="M4 40 H38 M102 40 H136"/><rect x="38" y="28" width="64" height="24"/>'
        + '<path d="M18 70 H32 L104 10" stroke-width="1.8"/>' + t(120, 66, '−t°', 14)],
      ['eo-pot', 'Potenciômetro', 140, 76, '<path d="M4 50 H38 M102 50 H136"/><rect x="38" y="38" width="64" height="24"/><path d="M70 4 V30"/>' + head(70, 38, 90, 10)],
      ['eo-cristal', 'Cristal oscilador', 120, 70, '<path d="M4 35 H42 M78 35 H116"/><path d="M42 12 V58 M78 12 V58" stroke-width="3"/><rect x="51" y="18" width="18" height="34"/>'],
      ['eo-altofalante', 'Alto-falante', 100, 110, '<rect x="18" y="38" width="20" height="34"/><path d="M38 38 L72 8 V102 L38 72"/><path d="M4 48 H18 M4 62 H18"/>'],
      ['eo-microfone', 'Microfone', 110, 80, '<circle cx="55" cy="40" r="24"/><path d="M31 12 V68" stroke-width="3.5"/><path d="M4 40 H31 M79 40 H106"/>'],
      ['eo-buzzer', 'Campainha / buzzer', 110, 84, '<path d="M23 52 A32 32 0 0 1 87 52 Z"/><path d="M40 52 V80 M70 52 V80"/>' + t(30, 70, '+', 15)],
      ['eo-antena', 'Antena', 70, 110, '<path d="M35 106 V8 M10 8 L35 44 L60 8"/>'],
      ['eo-passo', 'Motor de passo', 120, 76, '<circle cx="60" cy="38" r="30"/><path d="M4 38 H30 M90 38 H116"/>' + T(60, 30, 'M', 20)
        + '<path d="M44 58 H50 V53 H56 V48 H62 V53 H68 V58 H74" stroke-width="1.6"/>'],
      ['eo-sensor', 'Sensor (genérico)', 140, 70, '<rect x="34" y="10" width="72" height="50" rx="4"/><path d="M4 35 H34 M106 35 H136"/>' + t(70, 35, 'sensor', 15)],
      ...SENSORES2,
    ]],
    ['Analógica', [
      ['eo-ampop', 'Amplificador operacional', 140, 110, '<path d="M30 8 L118 55 L30 102 Z M4 32 H30 M4 78 H30 M118 55 H136 M74 31.5 V6 M74 78.5 V104"/>'
        + T(42, 32, '−', 20) + T(42, 78, '+', 20)],
      ['eo-comparador', 'Comparador', 140, 110, '<path d="M30 8 L118 55 L30 102 Z M4 32 H30 M4 78 H30 M118 55 H136"/>'
        + T(42, 32, '−', 20) + T(42, 78, '+', 20) + '<path d="M56 64 H74 V46 M86 46 H64 V64" stroke-width="1.6"/>'],
      ['eo-regulador', 'Regulador de tensão', 150, 90, '<rect x="40" y="12" width="70" height="48" rx="2"/><path d="M4 30 H40 M110 30 H146 M75 60 V86"/>'
        + t(75, 30, 'REG', 15) + t(50, 48, 'E', 11) + t(100, 48, 'S', 11) + t(98, 78, 'GND', 10)],
      ['eo-rele', 'Relé', 140, 110, '<rect x="14" y="38" width="36" height="34"/><path d="M32 4 V38 M32 72 V106 M14 72 L50 38" stroke-width="2.5"/>'
        + '<path d="M106 106 V78 L120 44 M114 4 V38 M106 38 H122"/><path d="M50 55 H112" stroke-width="1.5" stroke-dasharray="5 4"/>'],
      ['eo-fusivelmini', 'Fusível miniatura', 110, 36, '<rect x="35" y="10" width="40" height="16" rx="2"/><path d="M4 18 H106"/>'],
    ]],
    ['Amp-op: configurações', [
      ...AMPOP,
    ]],
    ['Osciladores e filtros', [
      ...OSC_FILTROS,
    ]],
    ['Fontes e conversores', [
      ...FONTES,
    ]],
    ['Portas lógicas', [
      ['eo-and', 'Porta E (AND)', 140, 80, gate(AND, ins([28, 52], 30), '<path d="M94 40 H136"/>')],
      ['eo-or', 'Porta OU (OR)', 140, 80, gate(OR, ins([28, 52], orX), '<path d="M104 40 H136"/>')],
      ['eo-not', 'Porta NÃO (NOT)', 140, 80, gate(TRI, ins([40], 34), bubble(100))],
      ['eo-nand', 'Porta NÃO-E (NAND)', 140, 80, gate(AND, ins([28, 52], 30), bubble(100))],
      ['eo-nor', 'Porta NÃO-OU (NOR)', 140, 80, gate(OR, ins([28, 52], orX), bubble(110))],
      ['eo-xor', 'Porta OU exclusivo (XOR)', 140, 80, gate(OR, ins([28, 52], xorX), '<path d="M104 40 H136"/><path d="M16 8 Q52 40 16 72"/>')],
      ['eo-xnor', 'Porta XNOR', 140, 80, gate(OR, ins([28, 52], xorX), bubble(110) + '<path d="M16 8 Q52 40 16 72"/>')],
      ['eo-buffer', 'Buffer', 140, 80, gate(TRI, ins([40], 34), '<path d="M94 40 H136"/>')],
      ['eo-tristate', 'Buffer tri-state', 140, 80, gate(TRI, ins([40], 34), '<path d="M94 40 H136 M64 4 V25"/>') + t(84, 10, 'EN', 11)],
      ['eo-and3', 'Porta E de 3 entradas', 140, 80, gate(AND, ins([20, 40, 60], 30), '<path d="M94 40 H136"/>')],
      ['eo-or3', 'Porta OU de 3 entradas', 140, 80, gate(OR, ins([20, 40, 60], orX), '<path d="M104 40 H136"/>')],
      ['eo-schmitt', 'Inversor Schmitt trigger', 140, 80, gate(TRI, ins([40], 34), bubble(100)) + '<path d="M44 46 H58 V34 M52 46 V34 H66" stroke-width="1.4"/>'],
    ]],
    ['Portas lógicas (IEC retangular)', [
      ...PORTAS_IEC,
    ]],
    ['Lógica sequencial', [
      ff('eo-ffd', 'Flip-flop D', [[30, 'D'], [90, '>']]),
      ff('eo-ffjk', 'Flip-flop JK', [[30, 'J'], [60, '>'], [90, 'K']]),
      ff('eo-ffsr', 'Flip-flop SR', [[30, 'S'], [60, '>'], [90, 'R']]),
      ff('eo-fft', 'Flip-flop T', [[30, 'T'], [90, '>']]),
      ['eo-contador', 'Contador', 140, 140, block(140, 140, 34, 8, 72, 124, [[50, '>'], [90, 'R']], [[34, 'Q0'], [58, 'Q1'], [82, 'Q2'], [106, 'Q3']], 'CTR')],
      ['eo-registrador', 'Registrador de deslocamento', 140, 140, block(140, 140, 34, 8, 72, 124, [[50, 'D'], [90, '>']], [[34, 'Q0'], [58, 'Q1'], [82, 'Q2'], [106, 'Q3']], 'SRG')],
      ...SEQ2,
    ]],
    ['Blocos digitais', [
      ['eo-mux', 'Multiplexador 4:1', 140, 140, '<path d="M40 8 L100 28 V112 L40 132 Z M4 34 H40 M4 58 H40 M4 82 H40 M4 106 H40 M100 70 H136 M60 125 V136 M80 119 V136"/>'
        + t(50, 34, '0') + t(50, 58, '1') + t(50, 82, '2') + t(50, 106, '3') + t(74, 70, 'MUX', 12)],
      ['eo-demux', 'Demultiplexador 1:4', 140, 140, '<path d="M40 28 L100 8 V132 L40 112 Z M4 70 H40 M100 34 H136 M100 58 H136 M100 82 H136 M100 106 H136 M60 119 V136 M80 125 V136"/>'
        + t(90, 34, '0') + t(90, 58, '1') + t(90, 82, '2') + t(90, 106, '3') + t(66, 70, 'DMX', 12)],
      ['eo-decodificador', 'Decodificador 2:4', 140, 140, block(140, 140, 34, 8, 72, 124, [[50, 'A0'], [90, 'A1']], [[34, 'Y0'], [58, 'Y1'], [82, 'Y2'], [106, 'Y3']], 'DEC')],
      ['eo-somador', 'Somador completo', 140, 110, block(140, 110, 34, 8, 72, 94, [[34, 'A'], [58, 'B'], [82, 'Cin']], [[44, 'S'], [76, 'Cout']], 'Σ')],
      ['eo-clock', 'Clock', 120, 70, '<circle cx="40" cy="35" r="27"/><path d="M67 35 H116"/><path d="M24 44 H32 V26 H44 V44 H56" stroke-width="1.8"/>'],
      ['eo-7seg', 'Display de 7 segmentos', 90, 130, '<rect x="6" y="6" width="78" height="118" rx="6" stroke-width="1.8"/>'
        + '<path d="M30 20 H60 M66 26 V58 M66 72 V104 M30 110 H60 M24 72 V104 M24 26 V58 M30 65 H60" stroke-width="6"/><circle cx="76" cy="112" r="3.5" fill="#C"/>'],
      ['eo-ledsinal', 'LED de sinal', 100, 80, '<path d="M4 40 H32"/><circle cx="50" cy="40" r="18"/><circle cx="50" cy="40" r="9" fill="#C"/>'
        + '<path d="M50 14 V6 M71 19 L77 13 M76 40 H86 M71 61 L77 67 M50 66 V74" stroke-width="1.8"/>'],
      ['eo-chave', 'Chave lógica (0/1)', 110, 60, '<rect x="6" y="14" width="60" height="32" rx="16"/><circle cx="50" cy="30" r="11" fill="#C"/><path d="M66 30 H106"/>'
        + t(22, 30, '1', 14) + t(86, 18, '0/1', 11)],
      ['eo-vcc', 'Nível alto (VCC)', 70, 70, '<path d="M35 66 V30 M14 30 H56"/>' + t(35, 14, 'VCC', 14)],
      ['eo-terra', 'Terra digital', 70, 64, '<path d="M35 4 V28 M13 28 H57 L35 56 Z"/>'],
    ]],
    ['Circuitos integrados', [
      ...CIS,
    ]],
  ],
};
