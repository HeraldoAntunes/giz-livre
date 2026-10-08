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
    ]],
    ['Lógica sequencial', [
      ff('eo-ffd', 'Flip-flop D', [[30, 'D'], [90, '>']]),
      ff('eo-ffjk', 'Flip-flop JK', [[30, 'J'], [60, '>'], [90, 'K']]),
      ff('eo-ffsr', 'Flip-flop SR', [[30, 'S'], [60, '>'], [90, 'R']]),
      ff('eo-fft', 'Flip-flop T', [[30, 'T'], [90, '>']]),
      ['eo-contador', 'Contador', 140, 140, block(140, 140, 34, 8, 72, 124, [[50, '>'], [90, 'R']], [[34, 'Q0'], [58, 'Q1'], [82, 'Q2'], [106, 'Q3']], 'CTR')],
      ['eo-registrador', 'Registrador de deslocamento', 140, 140, block(140, 140, 34, 8, 72, 124, [[50, 'D'], [90, '>']], [[34, 'Q0'], [58, 'Q1'], [82, 'Q2'], [106, 'Q3']], 'SRG')],
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
  ],
};
