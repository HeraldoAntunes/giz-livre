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






// AMPLIACAO-B-INICIO
// SVG autoral: esquemas didáticos, sem certificação normativa ou pinagem universal.
const AMPLIACAO_B = [
  [
    [
      "eo-buck-cadeia",
      "Alimentação: conversor buck e desacoplamento",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Entrada CC</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">protegida</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Buck</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">tensão menor</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Filtro</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+ capacitores</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Carga</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CC regulada</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Diagrama funcional; conferir tensão, corrente e ripple</text>"
    ],
    [
      "eo-ldo-capacitores",
      "LDO: capacitores e dissipação",
      540,
      250,
      "<rect x=\"180\" y=\"35\" width=\"130\" height=\"80\" rx=\"4\"/><text x=\"245.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">LDO</text><text x=\"245.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Vin → Vout</text><path d=\"M20 60 H180 M310 60 H500 M245 115 V190 M90 60 V115 M75 115 H105 M75 130 H105 M90 130 V190 M410 60 V115 M395 115 H425 M395 130 H425 M410 130 V190 M90 190 H410\"/><text x=\"90\" y=\"42\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Vin</text><text x=\"410\" y=\"42\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Vout</text><path d=\"M245 190 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><text x=\"270.0\" y=\"234\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Cin/Cout e ESR conforme datasheet; P ≈ (Vin − Vout) I</text>"
    ],
    [
      "eo-divisor-nivel",
      "Divisor resistivo: exemplo 5 V / 3,33 V",
      530,
      280,
      "<path d=\"M100 30 V45\"/><path d=\"M100 45 v12 m0 30 v12\"/><rect x=\"94\" y=\"57\" width=\"12\" height=\"30\" rx=\"0\"/><text x=\"145\" y=\"72\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">10 kΩ</text><path d=\"M100 99 V130 H335 M100 130 V160\"/><path d=\"M100 160 v12 m0 30 v12\"/><rect x=\"94\" y=\"172\" width=\"12\" height=\"30\" rx=\"0\"/><text x=\"145\" y=\"187\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">20 kΩ</text><path d=\"M100 214 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><rect x=\"335\" y=\"105\" width=\"150\" height=\"70\" rx=\"4\"/><text x=\"410.0\" y=\"129.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Entrada</text><text x=\"410.0\" y=\"151.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">alta impedância</text><circle cx=\"100\" cy=\"130\" r=\"3\" fill=\"#C\" stroke=\"none\"/><text x=\"100\" y=\"15\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">5 V</text><text x=\"300\" y=\"60\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Vout ≈ 3,33 V</text><text x=\"265.0\" y=\"264\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Divisor não é tradutor universal; conferir limites da entrada</text>"
    ],
    [
      "eo-i2c-dois-dominios",
      "I²C: tradução bidirecional entre tensões",
      620,
      270,
      "<rect x=\"20\" y=\"60\" width=\"130\" height=\"100\" rx=\"4\"/><text x=\"85.0\" y=\"99.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">MCU</text><text x=\"85.0\" y=\"121.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">3,3 V</text><rect x=\"230\" y=\"60\" width=\"140\" height=\"100\" rx=\"4\"/><text x=\"300.0\" y=\"99.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Tradutor</text><text x=\"300.0\" y=\"121.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">bidirecional</text><rect x=\"450\" y=\"60\" width=\"130\" height=\"100\" rx=\"4\"/><text x=\"515.0\" y=\"99.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Periférico</text><text x=\"515.0\" y=\"121.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">5 V</text><path d=\"M150 92 H230 M150 130 H230 M370 92 H450 M370 130 H450 M85 160 V210 H515 V160 M300 160 V210\"/><text x=\"190\" y=\"78\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">SDA</text><text x=\"190\" y=\"116\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">SCL</text><text x=\"410\" y=\"78\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">SDA</text><text x=\"410\" y=\"116\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">SCL</text><text x=\"85\" y=\"35\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pull-ups 3,3 V</text><text x=\"515\" y=\"35\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Pull-ups 5 V</text><path d=\"M300 210 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><text x=\"310.0\" y=\"254\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">I²C open-drain: dois domínios, pull-ups em ambos os lados</text>"
    ],
    [
      "eo-margens-logicas",
      "Níveis lógicos: margens de ruído",
      450,
      265,
      "<rect x=\"20\" y=\"40\" width=\"150\" height=\"70\" rx=\"4\"/><text x=\"95.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">GPIO</text><text x=\"95.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">3,3 V</text><rect x=\"250\" y=\"40\" width=\"150\" height=\"70\" rx=\"4\"/><text x=\"325.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Entrada 5 V</text><text x=\"325.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">VIH ? VIL ?</text><path d=\"M170 75 L250 75\"/><path d=\"M250 75 L241.0 79.0 L241.0 71.0 Z\" fill=\"#C\"/><rect x=\"20\" y=\"150\" width=\"380\" height=\"75\" rx=\"0\"/><text x=\"210\" y=\"172\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">VOH ≥ VIH e VOL ≤ VIL</text><text x=\"210\" y=\"202\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Verificar tolerância e máximos absolutos</text><text x=\"225.0\" y=\"249\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A tensão nominal, sozinha, não garante compatibilidade</text>"
    ],
    [
      "eo-desacoplamento-local",
      "Desacoplamento local e capacitor de reserva",
      540,
      270,
      "<path d=\"M40 50 H480 M40 210 H480 M110 50 V95 M95 95 H125 M95 110 H125 M110 110 V210 M350 50 V95 M335 95 H365 M335 110 H365 M350 110 V210\"/><rect x=\"200\" y=\"80\" width=\"100\" height=\"65\" rx=\"4\"/><text x=\"250.0\" y=\"112.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CI</text><path d=\"M250 50 V80 M250 145 V210\"/><text x=\"155\" y=\"145\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">100 nF</text><text x=\"400\" y=\"145\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Bulk</text><text x=\"430\" y=\"30\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">VCC</text><path d=\"M250 210 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><text x=\"270.0\" y=\"254\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Capacitor cerâmico perto dos pinos; valores são exemplos</text>"
    ]
  ],
  [
    [
      "eo-mosfet-carga-cc",
      "MOSFET: chave de carga indutiva CC",
      570,
      325,
      "<rect x=\"260\" y=\"40\" width=\"130\" height=\"60\" rx=\"4\"/><text x=\"325.0\" y=\"70.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Carga CC</text><path d=\"M325 20 V40 M325 100 V135 M325 185 V265 M144 160 H300 M300 140 V180 M310 145 V175 M310 145 H325 V135 M310 175 H325 V185 M325 120 H440 V95 M325 30 H440 V65 M425 65 H455 M425 95 L440 65 L455 95 Z M20 160 H90 M235 160 V185 M235 239 V265 H325\"/><path d=\"M90 160 h12 m30 0 h12\"/><rect x=\"102\" y=\"154\" width=\"30\" height=\"12\" rx=\"0\"/><text x=\"117\" y=\"141\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Rg</text><path d=\"M235 185 v12 m0 30 v12\"/><rect x=\"229\" y=\"197\" width=\"12\" height=\"30\" rx=\"0\"/><text x=\"280\" y=\"212\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Rpd</text><text x=\"325\" y=\"12\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+V</text><text x=\"55\" y=\"140\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">GPIO</text><path d=\"M325 265 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><text x=\"465\" y=\"120\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Flyback</text><text x=\"285.0\" y=\"309\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">MOSFET canal N; cátodo do diodo no +V; Rpd mantém desligado</text>"
    ],
    [
      "eo-opto-dominios",
      "Optoacoplador: dois domínios isolados",
      560,
      235,
      "<rect x=\"160\" y=\"35\" width=\"220\" height=\"150\" rx=\"4\"/><text x=\"270.0\" y=\"99.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Optoacoplador</text><text x=\"270.0\" y=\"121.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">luz → sinal</text><path d=\"M20 80 H160 M20 140 H160 M380 80 H520 M380 140 H520\"/><path d=\"M270 35 V75 M270 135 V185\" stroke-width=\"1.6\" stroke-dasharray=\"6 5\"/><text x=\"80\" y=\"55\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Entrada</text><text x=\"460\" y=\"55\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Saída</text><text x=\"80\" y=\"172\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">GND A</text><text x=\"460\" y=\"172\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">GND B</text><text x=\"280.0\" y=\"219\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Isolação exige fontes separadas e distâncias adequadas</text>"
    ],
    [
      "eo-malha-420-adc",
      "Sensor 4–20 mA: shunt para ADC",
      520,
      250,
      "<path d=\"M20 50 H100 V80\"/><path d=\"M100 80 v12 m0 30 v12\"/><rect x=\"94\" y=\"92\" width=\"12\" height=\"30\" rx=\"0\"/><text x=\"145\" y=\"107\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">150 Ω</text><path d=\"M100 134 V195 M100 70 H310\"/><path d=\"M100 195 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><rect x=\"310\" y=\"40\" width=\"155\" height=\"80\" rx=\"4\"/><text x=\"387.5\" y=\"69.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ADC 3,3 V</text><text x=\"387.5\" y=\"91.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">0,6–3,0 V</text><text x=\"160\" y=\"25\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Entrada 4–20 mA</text><text x=\"300\" y=\"170\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">V = I × 150 Ω</text><text x=\"260.0\" y=\"234\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Exemplo ideal: verificar compliance, precisão e proteção</text>"
    ],
    [
      "eo-rc-anti-alias",
      "Filtro RC de entrada analógica",
      470,
      270,
      "<path d=\"M20 65 H90\"/><path d=\"M90 65 h12 m30 0 h12\"/><rect x=\"102\" y=\"59\" width=\"30\" height=\"12\" rx=\"0\"/><text x=\"117\" y=\"46\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">R</text><path d=\"M144 65 H420 M250 65 V115 M235 115 H265 M235 130 H265 M250 130 V185\"/><path d=\"M250 185 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><text x=\"50\" y=\"40\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Vin</text><text x=\"410\" y=\"40\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Vout</text><text x=\"300\" y=\"225\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">fc = 1 / (2πRC)</text><text x=\"235.0\" y=\"254\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Filtro passa-baixas RC; considerar impedância do ADC</text>"
    ],
    [
      "eo-ponte-sensor",
      "Ponte de Wheatstone: saída diferencial",
      420,
      295,
      "<path d=\"M200 30 L161.16923726046755 60.74102050212985 M118.83076273953245 94.25897949787014 L80 125\"/><g transform=\"translate(140.0 77.5) rotate(141.63251461513846)\"><path d=\"M-27 0 h12 m30 0 h12\"/><rect x=\"-15\" y=\"-6\" width=\"30\" height=\"12\" rx=\"0\"/></g><path d=\"M200 30 L238.83076273953245 60.74102050212985 M281.1692372604676 94.25897949787014 L320 125\"/><g transform=\"translate(260.0 77.5) rotate(38.36748538486154)\"><path d=\"M-27 0 h12 m30 0 h12\"/><rect x=\"-15\" y=\"-6\" width=\"30\" height=\"12\" rx=\"0\"/></g><path d=\"M80 125 L118.83076273953245 155.74102050212986 M161.16923726046755 189.25897949787014 L200 220\"/><g transform=\"translate(140.0 172.5) rotate(38.36748538486154)\"><path d=\"M-27 0 h12 m30 0 h12\"/><rect x=\"-15\" y=\"-6\" width=\"30\" height=\"12\" rx=\"0\"/></g><path d=\"M320 125 L281.1692372604676 155.74102050212986 M238.83076273953245 189.25897949787014 L200 220\"/><g transform=\"translate(260.0 172.5) rotate(141.63251461513846)\"><path d=\"M-27 0 h12 m30 0 h12\"/><rect x=\"-15\" y=\"-6\" width=\"30\" height=\"12\" rx=\"0\"/></g><path d=\"M80 125 H30 M320 125 H370\"/><text x=\"118\" y=\"65\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">R1</text><text x=\"285\" y=\"65\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">R2</text><text x=\"118\" y=\"185\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">R3</text><text x=\"285\" y=\"185\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">R4</text><text x=\"200\" y=\"15\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Excitação +</text><text x=\"200\" y=\"250\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Excitação −</text><text x=\"30\" y=\"105\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">V−</text><text x=\"370\" y=\"105\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">V+</text><text x=\"210.0\" y=\"279\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Ponte resistiva conceitual; saída diferencial V+ − V−</text>"
    ],
    [
      "eo-instrumentacao-cadeia",
      "Medição diferencial: amplificação e ADC",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Sensor</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">V+ e V−</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Amplificador</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">instrumentação</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Filtro</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">anti-alias</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ADC</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">referência</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Definir ganho, modo comum, offset e faixa de saída</text>"
    ],
    [
      "eo-ntc-divisor",
      "NTC: divisor e sentido da resposta",
      520,
      270,
      "<path d=\"M100 25 V45\"/><path d=\"M100 45 v12 m0 30 v12\"/><rect x=\"94\" y=\"57\" width=\"12\" height=\"30\" rx=\"0\"/><text x=\"145\" y=\"72\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">R fixa</text><path d=\"M100 99 V130 H320 M100 130 V155\"/><path d=\"M100 155 v12 m0 30 v12\"/><rect x=\"94\" y=\"167\" width=\"12\" height=\"30\" rx=\"0\"/><text x=\"145\" y=\"182\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">NTC</text><path d=\"M100 209 v8 m-16 0 h32 m-26 7 h20 m-14 7 h8\"/><rect x=\"320\" y=\"105\" width=\"130\" height=\"65\" rx=\"4\"/><text x=\"385.0\" y=\"137.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ADC</text><text x=\"100\" y=\"15\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Vref</text><text x=\"310\" y=\"55\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">NTC: R cai quando T sobe</text><text x=\"260.0\" y=\"254\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Neste divisor, Vout cai com a temperatura</text>"
    ],
    [
      "eo-led-dimensionar",
      "LED: resistor limitador e dimensionamento",
      460,
      200,
      "<path d=\"M30 80 H90\"/><path d=\"M90 80 h12 m30 0 h12\"/><rect x=\"102\" y=\"74\" width=\"30\" height=\"12\" rx=\"0\"/><text x=\"117\" y=\"61\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">R</text><path d=\"M144 80 H220 M250 80 H400 M220 65 L250 80 L220 95 Z M250 65 V95\"/><path d=\"M255 55 L280 30\"/><path d=\"M280 30 L276.5 39.2 L270.8 33.5 Z\" fill=\"#C\"/><path d=\"M274 70 L299 45\"/><path d=\"M299 45 L295.5 54.2 L289.8 48.5 Z\" fill=\"#C\"/><text x=\"40\" y=\"45\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">VCC</text><text x=\"390\" y=\"45\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">GND</text><text x=\"220\" y=\"150\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">R = (VCC − Vf) / ILED</text><text x=\"230.0\" y=\"184\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Conferir corrente máxima e potência no resistor</text>"
    ],
    [
      "eo-fotodiodo-tia",
      "Fotodiodo: conversão corrente-tensão",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Luz</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">fotodiodo</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">TIA</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">realimentado</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Filtro</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">e ganho</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ADC</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">leitura</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Esquema funcional; TIA exige estabilidade e polarização</text>"
    ],
    [
      "eo-schmitt-histerese",
      "Disparador Schmitt: histerese",
      450,
      255,
      "<path d=\"M50 180 H400 M50 180 V25\"/><path d=\"M60 155 H270 V60 H360 M360 60 H150 V155 H60\"/><path d=\"M215 155 L245 155\"/><path d=\"M245 155 L236.0 159.1 L236.0 150.9 Z\" fill=\"#C\"/><path d=\"M315 60 L280 60\"/><path d=\"M280 60 L289.0 56.0 L289.0 64.0 Z\" fill=\"#C\"/><text x=\"150\" y=\"205\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">VTL</text><text x=\"270\" y=\"205\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">VTH</text><text x=\"245\" y=\"30\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Saída</text><text x=\"400\" y=\"205\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Vin</text><text x=\"225.0\" y=\"239\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Não inversor: sobe em VTH; desce em VTL</text>"
    ],
    [
      "eo-ponte-h-chaves",
      "Ponte H: quatro chaves e motor",
      460,
      280,
      "<path d=\"M60 30 H390 M60 230 H390 M100 30 V60 M350 30 V60 M100 100 V160 M350 100 V160 M100 200 V230 M350 200 V230 M100 130 H190 M260 130 H350\"/><rect x=\"75\" y=\"60\" width=\"50\" height=\"40\" rx=\"4\"/><text x=\"100.0\" y=\"80.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Q1</text><rect x=\"325\" y=\"60\" width=\"50\" height=\"40\" rx=\"4\"/><text x=\"350.0\" y=\"80.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Q2</text><rect x=\"75\" y=\"160\" width=\"50\" height=\"40\" rx=\"4\"/><text x=\"100.0\" y=\"180.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Q3</text><rect x=\"325\" y=\"160\" width=\"50\" height=\"40\" rx=\"4\"/><text x=\"350.0\" y=\"180.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Q4</text><circle cx=\"225\" cy=\"130\" r=\"35\"/><text x=\"225\" y=\"130\" font-size=\"20\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">M</text><text x=\"225\" y=\"15\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+V</text><text x=\"230.0\" y=\"264\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Ponte H: nunca ligar Q1+Q3 ou Q2+Q4 simultaneamente</text>"
    ],
    [
      "eo-flyback-polaridade",
      "Diodo flyback: polaridade na bobina CC",
      470,
      260,
      "<path d=\"M40 45 H420 M40 190 H420 M160 45 V90 M160 135 V190 M320 45 V90 M305 90 H335 M305 125 L320 90 L335 125 Z M320 125 V190\"/><rect x=\"110\" y=\"90\" width=\"100\" height=\"45\" rx=\"4\"/><text x=\"160.0\" y=\"112.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Bobina</text><text x=\"360\" y=\"78\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">K</text><text x=\"360\" y=\"140\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A</text><text x=\"70\" y=\"25\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+V</text><text x=\"70\" y=\"215\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Chave / 0 V</text><text x=\"235.0\" y=\"244\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Flyback: cátodo em +V; polarização reversa em regime</text>"
    ]
  ],
  [
    [
      "eo-uart-cruzamento",
      "UART: TX/RX cruzados e referência comum",
      560,
      255,
      "<rect x=\"20\" y=\"35\" width=\"120\" height=\"170\" rx=\"0\"/><rect x=\"400\" y=\"35\" width=\"120\" height=\"170\" rx=\"0\"/><text x=\"80\" y=\"18\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A</text><text x=\"460\" y=\"18\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">B</text><path d=\"M140 75 L400 125\"/><path d=\"M400 125 L390.4 127.3 L391.9 119.3 Z\" fill=\"#C\"/><path d=\"M400 75 L140 125\"/><path d=\"M140 125 L148.1 119.3 L149.6 127.3 Z\" fill=\"#C\"/><path d=\"M140 175 H400\"/><text x=\"96\" y=\"75\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">TX</text><text x=\"96\" y=\"125\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">RX</text><text x=\"445\" y=\"75\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">TX</text><text x=\"445\" y=\"125\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">RX</text><text x=\"270\" y=\"195\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">GND comum</text><text x=\"280.0\" y=\"239\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">UART lógica: TX→RX; conferir tensões; não é RS-232</text>"
    ],
    [
      "eo-rs485-linha",
      "RS-485: barramento linear e terminações",
      660,
      270,
      "<path d=\"M40 70 H610 M40 110 H610\"/><rect x=\"35\" y=\"70\" width=\"10\" height=\"40\" rx=\"0\"/><rect x=\"605\" y=\"70\" width=\"10\" height=\"40\" rx=\"0\"/><text x=\"40\" y=\"40\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">120 Ω</text><text x=\"610\" y=\"40\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">120 Ω</text><path d=\"M125 70 V165 M155 110 V165\"/><rect x=\"75\" y=\"165\" width=\"130\" height=\"60\" rx=\"4\"/><text x=\"140.0\" y=\"184.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Nó 1</text><text x=\"140.0\" y=\"206.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Transceptor</text><path d=\"M310 70 V165 M340 110 V165\"/><rect x=\"260\" y=\"165\" width=\"130\" height=\"60\" rx=\"4\"/><text x=\"325.0\" y=\"184.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Nó 2</text><text x=\"325.0\" y=\"206.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Transceptor</text><path d=\"M495 70 V165 M525 110 V165\"/><rect x=\"445\" y=\"165\" width=\"130\" height=\"60\" rx=\"4\"/><text x=\"510.0\" y=\"184.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Nó 3</text><text x=\"510.0\" y=\"206.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Transceptor</text><text x=\"325\" y=\"35\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A / B</text><text x=\"330.0\" y=\"254\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Terminação nas duas extremidades; derivações curtas</text>"
    ],
    [
      "eo-can-linha",
      "CAN: par diferencial e terminações",
      660,
      270,
      "<path d=\"M40 70 H610 M40 110 H610\"/><rect x=\"35\" y=\"70\" width=\"10\" height=\"40\" rx=\"0\"/><rect x=\"605\" y=\"70\" width=\"10\" height=\"40\" rx=\"0\"/><text x=\"40\" y=\"40\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">120 Ω</text><text x=\"610\" y=\"40\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">120 Ω</text><path d=\"M125 70 V165 M155 110 V165\"/><rect x=\"75\" y=\"165\" width=\"130\" height=\"60\" rx=\"4\"/><text x=\"140.0\" y=\"184.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Nó 1</text><text x=\"140.0\" y=\"206.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Transceptor</text><path d=\"M310 70 V165 M340 110 V165\"/><rect x=\"260\" y=\"165\" width=\"130\" height=\"60\" rx=\"4\"/><text x=\"325.0\" y=\"184.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Nó 2</text><text x=\"325.0\" y=\"206.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Transceptor</text><path d=\"M495 70 V165 M525 110 V165\"/><rect x=\"445\" y=\"165\" width=\"130\" height=\"60\" rx=\"4\"/><text x=\"510.0\" y=\"184.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Nó 3</text><text x=\"510.0\" y=\"206.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Transceptor</text><text x=\"325\" y=\"35\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CANH / CANL</text><text x=\"330.0\" y=\"254\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Terminação nas duas extremidades; derivações curtas</text>"
    ]
  ]
];
// AMPLIACAO-B-FIM

export default {
  id: 'eletronica', nome: 'Eletrônica',
  destaques: [
    'eo-diodo', 'eo-led', 'eo-zener', 'eo-ponte', 'eo-npn', 'eo-pnp', 'eo-mosfetn', 'eo-ampop',
    'eo-regulador', 'eo-ldr', 'eo-and', 'eo-or', 'eo-not', 'eo-ffd', 'eo-555', 'eo-7seg',
  ],
  secoes: [
    ["Alimentação e níveis lógicos", AMPLIACAO_B[0]],
    ["Interfaces de sensores e atuadores", AMPLIACAO_B[1]],
    ["Barramentos e transmissão de sinal", AMPLIACAO_B[2]],
    ['Semicondutores', [
      ['eo-diodo', 'Diodo', 120, 50, diode(25)],
      ['eo-zener', 'Diodo Zener', 120, 54, diode(27, '<path d="M70 5 L78 9 V45 L86 49"/>')],
      ['eo-led', 'LED', 120, 70, diode(45) + '<path d="M62 22 L74 10 M76 28 L88 16" stroke-width="1.6"/>' + head(76, 8, -45, 8) + head(90, 14, -45, 8)],
      ['eo-fotodiodo', 'Fotodiodo', 120, 70, diode(45) + '<path d="M96 6 L84 18 M108 14 L96 26" stroke-width="1.6"/>' + head(82, 20, 135, 8) + head(94, 28, 135, 8)],
      ['eo-schottky', 'Diodo Schottky', 120, 54, diode(27, '<path d="M86 15 V9 H78 V45 H70 V39"/>')],
      ['eo-ponte', 'Ponte retificadora', 164, 164,
        '<g transform="translate(12 12)"><path d="M70 16 L124 70 L70 124 L16 70 Z M4 70 H16 M124 70 H136 M70 4 V16 M70 124 V136"/>'
        + dAt(43, 43, -45) + dAt(97, 43, 225) + dAt(43, 97, 225) + dAt(97, 97, -45)
        + t(9, 56, '~', 18) + t(131, 56, '~', 18) + t(84, 8, '+', 16) + t(84, 132, '−', 16) + '</g>'],
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
