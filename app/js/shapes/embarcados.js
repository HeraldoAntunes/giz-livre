import { T, head } from './base.js';

// Sistemas embarcados: placas de desenvolvimento, prototipagem, módulos de sensores, atuadores, comunicação e
// componentes avulsos. Vistas de cima simplificadas, desenhadas à mão para o Giz Livre (nada copiado de outras
// bibliotecas). Nomes de placas aparecem só como texto genérico; nenhum logotipo é reproduzido.
// prefixo dos ids: 'em-'

const f1 = (v) => Math.round(v * 10) / 10;
const t = (x, y, s, z = 8) => T(f1(x), f1(y), s, z);
const furo = (x, y, r = 1.7) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="#C" stroke="none"/>`;
const placa = (x, y, w, h, r = 5) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
const fixa = (x, y) => `<circle cx="${x}" cy="${y}" r="3.2" stroke-width="1.4"/>`;
const girar = (ang, x, y, s) => `<g transform="rotate(${ang} ${x} ${y})">${s}</g>`;

// barra de pinos (fileira de furos com moldura), horizontal ou vertical
const barra = (x, y, n, d = 8, vert = false) => {
  const L = (n - 1) * d + 8;
  let s = `<rect x="${x - 4}" y="${y - 4}" width="${vert ? 8 : L}" height="${vert ? L : 8}" rx="1" stroke-width="1.2"/>`;
  for (let i = 0; i < n; i++) s += furo(vert ? x : x + i * d, vert ? y + i * d : y);
  return s;
};

// circuito integrado visto de cima, terminais em cima e embaixo; ponto do pino 1
const ci = (x, y, w, h, n) => {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" stroke-width="2"/>`;
  const d = w / n;
  for (let i = 0; i < n; i++) { const px = f1(x + d * (i + 0.5)); s += `<path d="M${px},${y} v-4 M${px},${y + h} v4" stroke-width="1.6"/>`; }
  return s + furo(x + 4.5, y + h - 4.5, 1.6);
};

// borne de parafuso: n parafusos (círculo com fenda)
const borne = (x, y, n, d = 14, vert = false) => {
  const L = (n - 1) * d + 14;
  let s = `<rect x="${x - 7}" y="${y - 7}" width="${vert ? 14 : L}" height="${vert ? L : 14}" rx="1.5" stroke-width="1.6"/>`;
  for (let i = 0; i < n; i++) {
    const cx = vert ? x : x + i * d, cy = vert ? y + i * d : y;
    s += `<circle cx="${cx}" cy="${cy}" r="4.5" stroke-width="1.4"/><path d="M${cx - 3},${cy + 3} L${cx + 3},${cy - 3}" stroke-width="1.4"/>`;
  }
  return s;
};

// módulo de sensor: placa com barra de pinos na borda de baixo; terminais saem até a borda (ponto de ligação)
const modulo = (w, h, rot, corpo, passo = 14, z = 7) => {
  const yb = h - 16, n = rot.length, x0 = w / 2 - (n - 1) * passo / 2;
  let s = placa(4, 4, w - 8, yb - 4, 4) + `<rect x="${f1(x0 - 5)}" y="${yb - 8}" width="${(n - 1) * passo + 10}" height="8" rx="1" stroke-width="1.2"/>`;
  rot.forEach((r, i) => { const x = f1(x0 + i * passo); s += furo(x, yb - 4) + `<path d="M${x},${yb} V${h - 4}" stroke-width="2"/>` + t(x, yb - 15, r, z); });
  return s + corpo;
};

// placa DevKit vertical (antena no alto, USB embaixo, 15 pinos de cada lado)
const devkit = (chip, sub, L, R) => {
  let s = placa(14, 4, 92, 222, 5)
    + '<path d="M30,22 V10 H40 V22 H50 V10 H60 V22 H70 V10 H80 V22 H90" stroke-width="1.6"/>'
    + '<rect x="28" y="28" width="64" height="44" rx="2"/>' + T(60, 44, chip, 11) + t(60, 60, sub, 7);
  for (let i = 0; i < 15; i++) { const y = 82 + i * 9; s += furo(22, y) + furo(98, y) + t(38, y, L[i], 6.5) + t(82, y, R[i], 6.5); }
  return s + '<rect x="48" y="216" width="24" height="18" rx="2"/>'
    + '<rect x="24" y="214" width="12" height="8" rx="2" stroke-width="1.4"/><rect x="84" y="214" width="12" height="8" rx="2" stroke-width="1.4"/>';
};

// encapsulamento TO-92 visto de frente (face plana), 3 terminais com rótulos embaixo
const to92 = (nome, rot) => '<path d="M28,62 V24 Q28,10 50,10 Q72,10 72,24 V62 Z"/>' + t(50, 38, nome, 9)
  + '<path d="M38,62 L28,78 V108 M50,62 V108 M62,62 L72,78 V108"/>' + t(28, 119, rot[0], 7) + t(50, 119, rot[1], 7) + t(72, 119, rot[2], 7);

// CI DIP horizontal com n pinos: pino 1 embaixo à esquerda, numeração no sentido anti-horário
const dip = (n, titulo) => {
  const m = n / 2, w = 38 + (m - 1) * 14;
  let s = `<rect x="12" y="22" width="${w - 24}" height="46" rx="3"/><path d="M12,37 A8,8 0 0 1 12,53" stroke-width="1.6"/>` + T(w / 2, 45, titulo, 10);
  for (let i = 0; i < m; i++) {
    const x = 19 + i * 14;
    s += `<path d="M${x},22 V4 M${x},68 V86"/>` + t(x, 61, String(i + 1), 7) + t(x, 29, String(n - i), 7);
  }
  return [w, s];
};
const [dip8w, dip8] = dip(8, 'DIP-8');
const [dip16w, dip16] = dip(16, 'DIP-16');

// protoboard: colunas x linhas de furos, trilhos de alimentação opcionais
const proto = () => {
  let s = '<rect x="4" y="4" width="252" height="142" rx="4"/>';
  const X = (i) => 24 + i * 7.4;
  const linhas = [38, 45.5, 53, 60.5, 68, 82, 89.5, 97, 104.5, 112];
  for (let i = 0; i < 30; i++) for (const y of linhas) s += furo(X(i), y, 1.3);
  for (const y of [14, 21, 129, 136]) for (let i = 0; i < 30; i++) if (i % 6 !== 5) s += furo(X(i) + 3.7, y, 1.3);
  s += '<path d="M20,9 H242 M20,124.5 H242" stroke-width="1.1"/><path d="M20,25.5 H242 M20,140.5 H242" stroke-width="1.1" stroke-dasharray="4 3"/>';
  s += '<rect x="16" y="73" width="228" height="4" rx="2" stroke-width="1.2"/><path d="M10,31.5 H250 M10,118.5 H250" stroke-width="1.2"/>';
  s += t(12, 14, '+', 9) + t(12, 21, '−', 9) + t(12, 129, '+', 9) + t(12, 136, '−', 9);
  'abcde'.split('').forEach((c, i) => { s += t(13, linhas[i], c, 6.5); });
  'fghij'.split('').forEach((c, i) => { s += t(13, linhas[i + 5], c, 6.5); });
  return s;
};
const protoMini = () => {
  let s = '<rect x="4" y="4" width="132" height="88" rx="4"/>';
  const X = (i) => 18 + i * 6.5;
  const linhas = [14, 20.5, 27, 33.5, 40, 56, 62.5, 69, 75.5, 82];
  for (let i = 0; i < 17; i++) for (const y of linhas) s += furo(X(i), y, 1.3);
  return s + '<rect x="12" y="46" width="116" height="4" rx="2" stroke-width="1.2"/>';
};

// pente de trilhas entrelaçadas (sensores de nível e de chuva)
const pente = (x1, x2, y0, n, d) => {
  let s = `M${x1},${y0 - 4} V${y0 + (n - 1) * d + 4} M${x2},${y0 - 4} V${y0 + (n - 1) * d + 4}`;
  for (let i = 0; i < n; i++) { const y = y0 + i * d; s += i % 2 ? ` M${x2},${y} H${x1 + 6}` : ` M${x1},${y} H${x2 - 6}`; }
  return `<path d="${s}" stroke-width="1.4"/>`;
};

// matriz 8x8 com um coração aceso
const matriz = () => {
  const pad = ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000'];
  let s = '<rect x="22" y="10" width="96" height="96" rx="2"/>';
  pad.forEach((lin, r) => lin.split('').forEach((v, c) => {
    s += `<circle cx="${28 + c * 12}" cy="${16 + r * 12}" r="4" ${v === '1' ? 'fill="#C" stroke="none"' : 'stroke-width="1.2"'}/>`;
  }));
  return s;
};

// tela LCD 16x2 (células de caractere)
const lcdCelulas = () => {
  let s = '';
  for (let r = 0; r < 2; r++) for (let c = 0; c < 16; c++) s += `<rect x="${f1(55 + c * 10.75)}" y="${36 + r * 22}" width="9" height="16" stroke-width="0.9"/>`;
  return s;
};

// malha da tela do sensor de gás
const malha = (cx, cy, r, d) => {
  let s = '';
  for (let k = -2; k <= 2; k++) { const o = k * d, h = f1(Math.sqrt(r * r - o * o)); s += `M${cx + o},${cy - h} V${cy + h} M${cx - h},${cy + o} H${cx + h} `; }
  return `<path d="${s.trim()}" stroke-width="1.1"/>`;
};

// ondas de Wi-Fi centradas em (cx, cy), abertas para cima
const wifi = (cx, cy, raios) => raios.map(r => {
  const k = f1(r * 0.707);
  return `<path d="M${f1(cx - k)},${f1(cy - k)} A${r},${r} 0 0 1 ${f1(cx + k)},${f1(cy - k)}" stroke-width="2.2"/>`;
}).join('') + `<circle cx="${cx}" cy="${cy}" r="3" fill="#C" stroke="none"/>`;

export default {
  id: 'embarcados', nome: 'Sistemas embarcados',
  secoes: [
    ['Placas', [
      ['em-uno', 'Placa tipo Uno', 250, 180, placa(14, 6, 232, 168, 8)
        + '<rect x="4" y="24" width="44" height="36" rx="2"/><rect x="11" y="31" width="30" height="22" stroke-width="1.4"/>'
        + '<rect x="4" y="124" width="38" height="36" rx="3"/><circle cx="23" cy="142" r="7" stroke-width="1.6"/>'
        + barra(96, 16, 10) + barra(180, 16, 8)
        + t(128, 27, '13', 7) + t(168, 27, '8', 7) + t(180, 27, '7', 7) + t(236, 27, '0', 7) + t(166, 39, 'DIGITAL (PWM ~)', 8)
        + barra(96, 164, 8) + barra(176, 164, 6)
        + t(127, 153, '5V', 6.5) + t(140, 153, 'GND', 6.5) + t(154, 153, 'Vin', 6.5) + t(176, 153, 'A0', 6.5) + t(216, 153, 'A5', 6.5)
        + t(124, 141, 'POWER', 7) + t(196, 141, 'ANALOG IN', 7)
        + ci(120, 88, 112, 22, 14) + t(176, 99, 'MCU', 9) + T(78, 98, 'UNO', 20)
        + '<rect x="58" y="14" width="14" height="14" rx="2" stroke-width="1.4"/><circle cx="65" cy="21" r="3.5" stroke-width="1.4"/>'
        + fixa(68, 160) + fixa(236, 70)],
      ['em-nano', 'Placa tipo Nano', 180, 70, placa(14, 8, 162, 54, 4)
        + '<rect x="4" y="25" width="26" height="20" rx="2"/>' + barra(40, 16, 15) + barra(40, 54, 15)
        + '<rect x="80" y="26" width="18" height="18" stroke-width="1.6" transform="rotate(45 89 35)"/>'
        + '<rect x="54" y="30" width="10" height="10" rx="2" stroke-width="1.4"/>'
        + T(132, 35, 'NANO', 12) + t(166, 16, 'D', 8) + t(166, 54, 'A', 8)],
      ['em-mega', 'Placa tipo Mega', 290, 140, placa(14, 6, 272, 128, 8)
        + '<rect x="4" y="20" width="44" height="34" rx="2"/><rect x="11" y="27" width="30" height="20" stroke-width="1.4"/>'
        + '<rect x="4" y="96" width="36" height="34" rx="3"/><circle cx="22" cy="113" r="7" stroke-width="1.6"/>'
        + barra(80, 16, 10) + barra(164, 16, 8) + t(150, 30, 'DIGITAL', 7)
        + barra(266, 20, 15, 6, true) + barra(274, 20, 15, 6, true) + girar(-90, 252, 62, t(252, 62, 'D22 … D53', 7))
        + barra(80, 124, 8) + barra(150, 124, 8) + barra(222, 124, 8)
        + t(108, 103, 'POWER', 7) + t(214, 103, 'ANALOG IN', 7)
        + t(111, 113, '5V', 6.5) + t(124, 113, 'GND', 6.5) + t(137, 113, 'Vin', 6.5) + t(150, 113, 'A0', 6.5) + t(278, 113, 'A15', 6.5)
        + '<rect x="110" y="46" width="42" height="42" rx="2" stroke-width="2"/>'
        + (() => { let s = ''; for (let i = 0; i < 8; i++) { const p = 113 + i * 5; s += `M${p},46 v-4 M${p},88 v4 M110,${p - 64} h-4 M152,${p - 64} h4 `; } return `<path d="${s.trim()}" stroke-width="1.4"/>`; })()
        + t(131, 67, 'MCU', 9) + T(205, 68, 'MEGA', 20)],
      ['em-esp32', 'ESP32 DevKit', 120, 236, devkit('ESP32', 'DevKit', ['EN', 'VP', 'VN', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'GND', 'VIN'],
        ['D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'TX2', 'RX2', 'D4', 'D2', 'D15', 'GND', '3V3'])],
      ['em-nodemcu', 'ESP8266 (NodeMCU)', 120, 236, devkit('ESP8266', 'NodeMCU', ['A0', 'RSV', 'RSV', 'SD3', 'SD2', 'SD1', 'CMD', 'SD0', 'CLK', 'GND', '3V3', 'EN', 'RST', 'GND', 'Vin'],
        ['D0', 'D1', 'D2', 'D3', 'D4', '3V3', 'GND', 'D5', 'D6', 'D7', 'D8', 'RX', 'TX', 'GND', '3V3'])],
      ['em-esp01', 'ESP-01', 150, 70, placa(4, 6, 142, 58, 4)
        + '<path d="M12,56 V14 H20 V56 H28 V14 H36 V56 H44 V14" stroke-width="1.6"/>'
        + '<rect x="52" y="22" width="22" height="22" rx="1" stroke-width="1.8"/>' + t(63, 54, 'ESP-01', 8)
        + barra(108, 20, 4, 10, true) + barra(118, 20, 4, 10, true)
        + t(91, 20, 'GND', 6.5) + t(91, 30, 'GPIO2', 6.5) + t(91, 40, 'GPIO0', 6.5) + t(91, 50, 'RX', 6.5)
        + t(134, 20, 'TX', 6.5) + t(134, 30, 'CH_PD', 6.5) + t(134, 40, 'RST', 6.5) + t(134, 50, 'VCC', 6.5)],
      ['em-rpi', 'Raspberry Pi', 256, 176, placa(4, 4, 226, 164, 8)
        + barra(28, 13, 20) + barra(28, 21, 20) + '<rect x="24.5" y="17.5" width="7" height="7" stroke-width="1"/>'
        + t(14, 13, '5V', 6.5) + t(14, 21, '3V3', 6.5) + t(104, 34, 'GPIO – 40 pinos', 8)
        + '<rect x="60" y="60" width="46" height="46" rx="2" stroke-width="2"/>' + t(83, 83, 'SoC', 10)
        + '<rect x="118" y="66" width="34" height="34" rx="2" stroke-width="1.8"/>' + t(135, 83, 'RAM', 8)
        + T(180, 84, 'Pi', 26)
        + '<rect x="206" y="38" width="46" height="34" rx="2"/><rect x="214" y="44" width="32" height="8" stroke-width="1.4"/><rect x="214" y="58" width="32" height="8" stroke-width="1.4"/>'
        + '<rect x="206" y="78" width="46" height="34" rx="2"/><rect x="214" y="84" width="32" height="8" stroke-width="1.4"/><rect x="214" y="98" width="32" height="8" stroke-width="1.4"/>'
        + '<rect x="206" y="118" width="46" height="38" rx="2"/><path d="M218,148 V130 H224 V126 H234 V130 H240 V148 Z" stroke-width="1.4"/>'
        + '<rect x="30" y="160" width="18" height="12" rx="2" stroke-width="1.8"/><rect x="64" y="160" width="16" height="12" rx="2" stroke-width="1.8"/><rect x="92" y="160" width="16" height="12" rx="2" stroke-width="1.8"/>'
        + t(39, 152, 'USB-C', 6.5) + t(86, 152, 'HDMI', 6.5) + fixa(14, 152) + fixa(200, 14)],
      ['em-pico', 'Raspberry Pi Pico', 96, 210, placa(14, 10, 68, 196, 4)
        + '<rect x="36" y="4" width="24" height="14" rx="2"/>'
        + (() => { let s = ''; for (let i = 0; i < 20; i++) s += furo(20, 24 + i * 9) + furo(76, 24 + i * 9); return s; })()
        + t(33, 24, 'GP0', 6.5) + t(33, 33, 'GP1', 6.5) + t(33, 42, 'GND', 6.5)
        + t(62, 24, 'VBUS', 6.5) + t(62, 33, 'VSYS', 6.5) + t(62, 42, 'GND', 6.5)
        + '<rect x="40" y="56" width="16" height="10" rx="2" stroke-width="1.4"/>' + T(48, 82, 'Pico', 13)
        + '<rect x="34" y="104" width="28" height="28" rx="1" stroke-width="2"/>' + t(48, 118, 'RP2040', 6)],
      ['em-bluepill', 'STM32 "Blue Pill"', 210, 84, placa(14, 8, 192, 68, 4)
        + '<rect x="4" y="32" width="22" height="20" rx="2"/>'
        + barra(24, 16, 20, 9) + barra(24, 68, 20, 9)
        + '<rect x="98" y="30" width="24" height="24" stroke-width="1.8" transform="rotate(45 110 42)"/>'
        + '<rect x="70" y="36" width="12" height="12" rx="6" stroke-width="1.4"/>'
        + barra(42, 36, 3, 7) + barra(42, 48, 3, 7)
        + t(160, 42, 'STM32F103', 9)
        + t(24, 58, 'B12', 6) + t(177, 58, '5V', 6) + t(186, 58, 'G', 6) + t(196, 58, '3V3', 6)],
      ['em-attiny85', 'ATtiny85 (DIP-8)', 170, 104, '<rect x="46" y="18" width="78" height="82" rx="3"/><path d="M77,18 A8,8 0 0 0 93,18" stroke-width="1.6"/>'
        + T(85, 9, 'ATtiny85', 9) + furo(53, 25, 1.8)
        + [['RST', 'VCC'], ['PB3', 'PB2'], ['PB4', 'PB1'], ['GND', 'PB0']].map(([a, b], i) => {
          const y = 32 + i * 18;
          return `<path d="M4,${y} H46 M124,${y} H166"/>` + t(65, y, a, 8) + t(105, y, b, 8) + t(14, y - 6, String(i + 1), 6.5) + t(156, y - 6, String(8 - i), 6.5);
        }).join('')],
    ]],
    ['Prototipagem', [
      ['em-protoboard', 'Protoboard', 260, 150, proto()],
      ['em-protomini', 'Protoboard mini', 140, 96, protoMini()],
      ['em-jumper', 'Jumper', 170, 44, '<path d="M4,22 H10 M160,22 H166" stroke-width="2"/>'
        + '<rect x="10" y="14" width="20" height="16" rx="2"/><rect x="140" y="14" width="20" height="16" rx="2"/>'
        + '<path d="M30,22 C70,2 100,42 140,22" stroke-width="3.5"/>'],
      ['em-barra-macho', 'Barra de pinos macho', 160, 50, '<rect x="6" y="20" width="148" height="10" rx="1"/>'
        + (() => { let s = ''; for (let i = 0; i < 10; i++) { const x = 12.5 + i * 15; s += `M${x},4 V20 M${x},30 V46 `; } return `<path d="${s.trim()}" stroke-width="2.8"/>`; })()],
      ['em-barra-femea', 'Barra de pinos fêmea', 160, 50, '<rect x="6" y="6" width="148" height="26" rx="1"/>'
        + (() => { let s = ''; for (let i = 0; i < 10; i++) { const x = 12.5 + i * 15; s += `<rect x="${x - 3.5}" y="9" width="7" height="7" stroke-width="1.4"/><path d="M${x},32 V46" stroke-width="2.4"/>`; } return s; })()],
      ['em-fonte-proto', 'Fonte para protoboard', 170, 100, placa(4, 4, 162, 72, 4)
        + '<path d="M14,76 V96 M24,76 V96 M146,76 V96 M156,76 V96" stroke-width="2.4"/>'
        + t(14, 68, '+', 9) + t(24, 68, '−', 9) + t(146, 68, '+', 9) + t(156, 68, '−', 9)
        + '<rect x="34" y="12" width="32" height="26" rx="2"/><circle cx="50" cy="25" r="6" stroke-width="1.6"/>'
        + '<rect x="36" y="46" width="28" height="16" rx="1" stroke-width="1.6"/>' + t(50, 54, 'USB', 6.5)
        + '<rect x="76" y="14" width="18" height="12" rx="1" stroke-width="1.6"/><rect x="78" y="16" width="7" height="8" fill="#C" stroke="none"/>'
        + '<circle cx="85" cy="44" r="4" stroke-width="1.4"/>' + t(85, 56, 'ON', 6.5)
        + '<rect x="102" y="14" width="16" height="22" rx="1" stroke-width="1.6"/><rect x="102" y="42" width="16" height="22" rx="1" stroke-width="1.6"/>'
        + barra(132, 16, 3, 8, true) + barra(150, 16, 3, 8, true) + t(141, 46, '5V / 3,3V', 7)],
      ['em-bateria9v', 'Bateria 9 V com clipe', 90, 160, '<rect x="14" y="46" width="62" height="108" rx="4"/><path d="M14,70 H76" stroke-width="1.4"/>'
        + T(45, 104, '9 V', 20)
        + '<rect x="18" y="26" width="54" height="20" rx="3"/>'
        + '<path d="M34,26 C34,14 28,10 28,4" stroke-width="2.4"/><path d="M56,26 C56,14 62,10 62,4" stroke-width="2.4" stroke-dasharray="5 3"/>'
        + t(18, 10, '+', 11) + t(72, 10, '−', 11)],
      ['em-pilhas-aa', 'Suporte de pilhas AA', 170, 110, '<rect x="4" y="8" width="142" height="94" rx="4"/>'
        + '<rect x="22" y="18" width="100" height="32" rx="3"/><rect x="122" y="27" width="6" height="14" rx="1"/>'
        + '<rect x="28" y="60" width="100" height="32" rx="3"/><rect x="22" y="69" width="6" height="14" rx="1"/>'
        + '<path d="M10,22 L20,26 L10,30 L20,34 L10,38 L20,42 L10,46" stroke-width="1.4"/><path d="M140,64 L130,68 L140,72 L130,76 L140,80 L130,84 L140,88" stroke-width="1.4"/>'
        + t(112, 34, '+', 12) + t(34, 34, '−', 12) + t(40, 76, '+', 12) + t(116, 76, '−', 12)
        + t(73, 34, 'AA 1,5 V', 9) + t(78, 76, 'AA 1,5 V', 9)
        + '<path d="M146,24 H166" stroke-width="2.4"/><path d="M146,86 H166" stroke-width="2.4" stroke-dasharray="5 3"/>'
        + t(158, 14, '+', 10) + t(158, 98, '−', 10)],
      ['em-cabo-usb', 'Cabo USB', 190, 50, '<rect x="4" y="16" width="24" height="18" rx="1"/><rect x="9" y="21" width="5" height="4" stroke-width="1.2"/><rect x="18" y="21" width="5" height="4" stroke-width="1.2"/>'
        + '<rect x="28" y="11" width="28" height="28" rx="4"/>' + t(42, 25, 'USB', 7)
        + '<path d="M56,25 C90,8 110,42 134,25" stroke-width="3.5"/>'
        + '<rect x="134" y="14" width="26" height="22" rx="4"/><path d="M160,18 H184 V28 L180,32 H164 L160,28 Z"/>'],
    ]],
    ['Sensores', [
      ['em-dht', 'DHT11/22 (temp. e umidade)', 110, 140, modulo(110, 140, ['VCC', 'DATA', 'GND'],
        '<rect x="28" y="10" width="54" height="86" rx="3"/>'
        + (() => { let s = ''; for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) s += `<rect x="${35 + c * 15}" y="${16 + r * 13}" width="10" height="7" rx="1" stroke-width="1.2"/>`; return s; })()
        + t(55, 88, 'DHT', 9), 20)],
      ['em-ds18b20', 'DS18B20 (sonda)', 230, 60, '<path d="M4,14 H24 C40,14 44,30 56,30 M4,30 H56 M4,46 H24 C40,46 44,30 56,30" stroke-width="1.8"/>'
        + t(14, 7, 'VCC', 6.5) + t(14, 23, 'DQ', 6.5) + t(14, 39, 'GND', 6.5)
        + '<path d="M56,30 C90,16 110,44 140,30" stroke-width="4"/>'
        + '<rect x="140" y="24" width="16" height="12" rx="2"/><path d="M156,22 H214 A8,8 0 0 1 214,38 H156 Z"/>' + t(188, 30, 'DS18B20', 8)],
      ['em-lm35', 'LM35 (temperatura)', 100, 128, to92('LM35', ['+Vs', 'Vout', 'GND'])],
      ['em-hcsr04', 'Ultrassônico HC-SR04', 180, 110, modulo(180, 110, ['VCC', 'TRIG', 'ECHO', 'GND'],
        '<circle cx="46" cy="42" r="28"/><circle cx="46" cy="42" r="18" stroke-width="1.4"/><circle cx="46" cy="42" r="8" stroke-width="1.4"/>'
        + '<circle cx="134" cy="42" r="28"/><circle cx="134" cy="42" r="18" stroke-width="1.4"/><circle cx="134" cy="42" r="8" stroke-width="1.4"/>'
        + t(46, 42, 'T', 8) + t(134, 42, 'R', 8)
        + '<rect x="80" y="30" width="20" height="10" rx="5" stroke-width="1.4"/>' + t(90, 14, 'HC-SR04', 8), 22, 6.5)],
      ['em-pir', 'Sensor de presença PIR', 120, 140, modulo(120, 140, ['VCC', 'OUT', 'GND'],
        '<circle cx="60" cy="56" r="40"/><circle cx="60" cy="56" r="26" stroke-width="1.2"/>'
        + '<path d="M60,16 V96 M20,56 H100 M31.7,27.7 L88.3,84.3 M88.3,27.7 L31.7,84.3" stroke-width="1.2"/>', 20)],
      ['em-ldr', 'Módulo LDR (luz)', 120, 110, modulo(120, 110, ['VCC', 'GND', 'DO', 'AO'],
        '<circle cx="32" cy="40" r="16"/><path d="M23,33 H41 V38 H23 V43 H41 V48 H23" stroke-width="1.4"/>' + t(32, 65, 'LDR', 7)
        + '<rect x="66" y="22" width="28" height="28" rx="2" stroke-width="1.8"/><circle cx="80" cy="36" r="8" stroke-width="1.4"/><path d="M75,36 H85 M80,31 V41" stroke-width="1.4"/>', 16)],
      ['em-solo', 'Sensor de umidade do solo', 120, 190, '<path d="M50,4 V16 M70,4 V16" stroke-width="2.4"/>'
        + '<rect x="20" y="16" width="80" height="40" rx="4"/>' + t(50, 26, '+', 9) + t(70, 26, '−', 9) + t(60, 44, 'SOLO', 8)
        + '<path d="M24,56 V158 L36,184 L48,158 V56 M72,56 V158 L84,184 L96,158 V56"/>'
        + '<path d="M36,60 V164 M84,60 V164" stroke-width="1.2" stroke-dasharray="6 4"/>'],
      ['em-nivel', 'Sensor de nível de água', 80, 180, '<path d="M28,4 V20 M40,4 V20 M52,4 V20" stroke-width="2.4"/>'
        + '<rect x="10" y="20" width="60" height="156" rx="4"/>' + t(28, 30, 'S', 8) + t(40, 30, '+', 9) + t(52, 30, '−', 9) + t(40, 46, 'NÍVEL', 8)
        + pente(18, 62, 64, 14, 8)],
      ['em-chuva', 'Sensor de chuva', 140, 140, '<path d="M60,4 V20 M80,4 V20" stroke-width="2.4"/>'
        + '<rect x="6" y="20" width="128" height="114" rx="3"/>' + t(60, 29, '+', 9) + t(80, 29, '−', 9)
        + pente(16, 124, 42, 11, 8.4)],
      ['em-mq2', 'Sensor de gás MQ-2', 120, 130, modulo(120, 130, ['VCC', 'GND', 'DO', 'AO'],
        '<circle cx="60" cy="50" r="36"/><circle cx="60" cy="50" r="24" stroke-width="1.4"/>' + malha(60, 50, 24, 9) + t(60, 20, 'MQ-2', 7), 16)],
      ['em-ph', 'Sensor de pH (sonda e placa)', 250, 130, '<rect x="30" y="8" width="20" height="84" rx="3"/><rect x="35" y="92" width="10" height="16"/><circle cx="40" cy="114" r="8"/>'
        + t(40, 44, 'pH', 9)
        + '<path d="M40,8 C40,2 100,4 100,30 C100,46 118,50 132,50" stroke-width="2.4"/>'
        + placa(120, 10, 126, 90, 4) + '<circle cx="146" cy="50" r="14"/><circle cx="146" cy="50" r="6" stroke-width="1.4"/>'
        + ci(172, 48, 40, 14, 4) + '<circle cx="226" cy="30" r="9" stroke-width="1.4"/><path d="M221,30 H231 M226,25 V35" stroke-width="1.4"/>'
        + '<path d="M180,100 V126 M200,100 V126 M220,100 V126" stroke-width="2"/>'
        + t(180, 88, 'V+', 7) + t(200, 88, 'G', 7) + t(220, 88, 'Po', 7)],
      ['em-turbidez', 'Sensor de turbidez', 250, 130, '<path d="M18,8 H62 V112 Q62,118 56,118 H52 Q46,118 46,112 V76 H34 V112 Q34,118 28,118 H24 Q18,118 18,112 Z"/>'
        + '<path d="M34,96 H46" stroke-width="1.4" stroke-dasharray="3 2"/>' + t(40, 40, 'NTU', 8)
        + '<path d="M40,8 C40,2 100,4 100,30 C100,46 118,50 132,50" stroke-width="2.4"/>'
        + placa(120, 10, 126, 90, 4) + '<rect x="132" y="42" width="16" height="16" rx="1" stroke-width="1.6"/>'
        + ci(168, 48, 40, 14, 4) + '<circle cx="226" cy="30" r="9" stroke-width="1.4"/><path d="M221,30 H231 M226,25 V35" stroke-width="1.4"/>'
        + '<rect x="160" y="20" width="22" height="10" rx="1" stroke-width="1.4"/><rect x="161" y="21" width="9" height="8" fill="#C" stroke="none"/>'
        + '<path d="M180,100 V126 M200,100 V126 M220,100 V126" stroke-width="2"/>'
        + t(180, 88, 'VCC', 7) + t(200, 88, 'GND', 7) + t(220, 88, 'OUT', 7)],
      ['em-fluxo', 'Sensor de fluxo (hall)', 200, 120, '<path d="M4,80 H10 M190,80 H196"/>'
        + '<rect x="10" y="66" width="40" height="28" rx="2"/><rect x="150" y="66" width="40" height="28" rx="2"/>'
        + '<path d="M16,66 V94 M22,66 V94 M28,66 V94 M34,66 V94 M40,66 V94 M160,66 V94 M166,66 V94 M172,66 V94 M178,66 V94 M184,66 V94" stroke-width="1.1"/>'
        + '<rect x="50" y="60" width="100" height="40" rx="4"/>'
        + '<path d="M64,80 H128" stroke-width="2"/>' + head(138, 80, 0, 10)
        + '<rect x="70" y="34" width="60" height="26" rx="3"/>' + t(85, 47, '+', 9) + t(100, 47, '−', 9) + t(115, 47, 'S', 8)
        + '<path d="M84,34 V4 M100,34 V4 M116,34 V4" stroke-width="2"/>'],
      ['em-bmp280', 'BMP280 (pressão)', 110, 80, modulo(110, 80, ['VCC', 'GND', 'SCL', 'SDA', 'CSB', 'SDO'],
        '<rect x="42" y="14" width="18" height="18" rx="1" stroke-width="1.8"/><circle cx="47" cy="19" r="2" stroke-width="1.2"/>' + t(84, 23, 'BMP280', 7) + fixa(16, 16), 15, 6.5)],
      ['em-mpu6050', 'Acelerômetro MPU6050', 140, 100, modulo(140, 100, ['VCC', 'GND', 'SCL', 'SDA', 'XDA', 'XCL', 'AD0', 'INT'],
        '<rect x="58" y="20" width="24" height="24" rx="1" stroke-width="1.8"/>' + furo(62, 24, 1.5)
        + '<path d="M22,52 H40 M22,52 V34" stroke-width="1.6"/>' + head(46, 52, 0, 8) + head(22, 28, -90, 8) + t(46, 42, 'X', 7) + t(32, 28, 'Y', 7)
        + t(108, 32, 'MPU-6050', 8) + fixa(14, 14) + fixa(126, 14), 15, 6)],
      ['em-gps', 'Módulo GPS', 150, 120, modulo(150, 120, ['VCC', 'RX', 'TX', 'GND'],
        '<rect x="14" y="14" width="60" height="60" rx="2"/>' + T(44, 44, 'GPS', 12)
        + '<rect x="86" y="14" width="50" height="50" rx="3"/><rect x="98" y="26" width="26" height="26" stroke-width="1.4"/>' + furo(111, 39, 2.2)
        + t(111, 74, 'antena', 7), 18)],
      ['em-rtc', 'Relógio RTC DS3231', 150, 100, modulo(150, 100, ['32K', 'SQW', 'SCL', 'SDA', 'VCC', 'GND'],
        '<circle cx="110" cy="36" r="26"/><circle cx="110" cy="36" r="20" stroke-width="1.2"/>' + t(110, 30, '+', 12) + t(110, 44, '3 V', 8)
        + ci(18, 28, 44, 18, 4) + t(40, 37, 'RTC', 7), 16, 6.5)],
      ['em-microsd', 'Módulo cartão microSD', 120, 120, modulo(120, 120, ['GND', 'VCC', 'MISO', 'MOSI', 'SCK', 'CS'],
        '<rect x="22" y="10" width="76" height="70" rx="2"/><path d="M36,18 H72 L84,30 V72 H36 Z" stroke-width="1.6"/>'
        + '<path d="M42,22 V30 M48,22 V30 M54,22 V30 M60,22 V30 M66,22 V30" stroke-width="1.2"/>' + t(60, 52, 'microSD', 8), 18, 6)],
    ]],
    ['Atuadores e saídas', [
      ['em-led5', 'LED 5 mm', 70, 140, '<path d="M17,70 V30 A18,18 0 0 1 53,30 V70 Z"/><path d="M13,70 H53 V78 H13 Z"/>'
        + '<path d="M28,70 V48 M42,70 V54 L34,48" stroke-width="1.2"/>'
        + '<path d="M28,78 V136 M42,78 V124"/>' + t(17, 106, '+', 11) + t(53, 106, '−', 11) + t(20, 124, 'A', 7) + t(53, 120, 'K', 7)],
      ['em-ledrgb', 'LED RGB', 90, 150, '<path d="M23,72 V30 A22,22 0 0 1 67,30 V72 Z"/><rect x="19" y="72" width="52" height="8"/>'
        + t(30, 62, 'R', 8) + t(40, 62, '−', 9) + t(50, 62, 'G', 8) + t(60, 62, 'B', 8)
        + '<path d="M30,80 V130 M40,80 V146 M50,80 V136 M60,80 V130"/>'],
      ['em-buzzer', 'Buzzer', 100, 120, '<circle cx="50" cy="48" r="40"/><circle cx="50" cy="48" r="6" stroke-width="1.6"/><circle cx="50" cy="48" r="30" stroke-width="1.1"/>'
        + t(34, 48, '+', 12) + '<path d="M38,86 V116 M62,86 V116"/>' + t(28, 104, '+', 10) + t(72, 104, '−', 10)],
      ['em-servo', 'Servo motor', 180, 120, '<rect x="22" y="54" width="18" height="14" rx="2"/><rect x="140" y="54" width="18" height="14" rx="2"/>'
        + '<circle cx="31" cy="61" r="3" stroke-width="1.4"/><circle cx="149" cy="61" r="3" stroke-width="1.4"/>'
        + '<rect x="40" y="26" width="100" height="74" rx="4"/>'
        + '<rect x="58" y="44" width="76" height="16" rx="8"/><circle cx="70" cy="52" r="11"/><circle cx="70" cy="52" r="3" fill="#C" stroke="none"/>'
        + furo(96, 52, 1.6) + furo(108, 52, 1.6) + furo(120, 52, 1.6)
        + t(110, 76, 'SERVO', 8)
        + '<path d="M72,100 V116 M90,100 V116 M108,100 V116" stroke-width="2"/>' + t(72, 91, 'GND', 6.5) + t(90, 91, '+5V', 6.5) + t(108, 91, 'SIN', 6.5)],
      ['em-motordc', 'Motor DC', 170, 90, '<path d="M30,34 H4 M30,56 H4" stroke-width="2.2"/>' + t(14, 25, '+', 10) + t(14, 66, '−', 10)
        + '<rect x="30" y="14" width="90" height="62" rx="8"/><path d="M46,14 V76" stroke-width="1.4"/>'
        + '<rect x="120" y="30" width="14" height="30" rx="3"/><path d="M134,45 H166" stroke-width="3.5"/>' + T(80, 45, 'M', 22)],
      ['em-passo', 'Motor de passo com driver', 250, 150, '<circle cx="62" cy="72" r="44"/><circle cx="62" cy="54" r="9"/><path d="M57,51 H67" stroke-width="2"/>'
        + T(62, 92, 'M', 16)
        + '<path d="M103,56 H146 M105.3,64 H146 M106,72 H146 M105.3,80 H146 M103,88 H146" stroke-width="1.6"/>'
        + placa(140, 10, 106, 112, 4) + '<rect x="146" y="50" width="10" height="44" rx="1" stroke-width="1.4"/>'
        + ci(166, 30, 52, 16, 8) + t(192, 38, 'ULN2003', 6)
        + '<circle cx="226" cy="64" r="4" stroke-width="1.4"/><circle cx="226" cy="78" r="4" stroke-width="1.4"/><circle cx="238" cy="64" r="4" stroke-width="1.4"/><circle cx="238" cy="78" r="4" stroke-width="1.4"/>'
        + '<path d="M160,122 V146 M176,122 V146 M192,122 V146 M208,122 V146 M226,122 V146 M238,122 V146" stroke-width="2"/>'
        + t(160, 112, 'IN1', 6.5) + t(176, 112, 'IN2', 6.5) + t(192, 112, 'IN3', 6.5) + t(208, 112, 'IN4', 6.5) + t(226, 112, '+', 9) + t(238, 112, '−', 9)],
      ['em-l298n', 'Driver de motor L298N', 160, 160, placa(14, 4, 132, 132, 4)
        + '<rect x="50" y="8" width="60" height="36" rx="1"/>'
        + '<path d="M56,8 V44 M62,8 V44 M68,8 V44 M74,8 V44 M80,8 V44 M86,8 V44 M92,8 V44 M98,8 V44 M104,8 V44" stroke-width="1.1"/>'
        + '<rect x="58" y="44" width="44" height="14" rx="1" stroke-width="1.8"/>' + t(80, 51, 'L298N', 7)
        + borne(28, 26, 2, 14, true) + borne(132, 26, 2, 14, true) + t(28, 62, 'M A', 7) + t(132, 62, 'M B', 7)
        + borne(64, 100, 3, 16) + t(64, 86, '12V', 6.5) + t(80, 86, 'GND', 6.5) + t(96, 86, '5V', 6.5)
        + '<circle cx="30" cy="96" r="8" stroke-width="1.6"/><circle cx="130" cy="96" r="8" stroke-width="1.6"/>'
        + ['ENA', 'IN1', 'IN2', 'IN3', 'IN4', 'ENB'].map((r, i) => { const x = 40 + i * 15; return `<path d="M${x},136 V156" stroke-width="2"/>` + t(x, 124, r, 6); }).join('')],
      ['em-rele1', 'Módulo relé (1 canal)', 170, 90, placa(4, 6, 146, 78, 4)
        + borne(18, 25, 3, 20, true) + t(36, 25, 'NA', 6.5) + t(36, 45, 'C', 6.5) + t(36, 65, 'NF', 6.5)
        + '<rect x="48" y="16" width="58" height="58" rx="2"/>' + t(77, 38, 'RELÉ', 9) + t(77, 54, '5 V', 8)
        + barra(146, 30, 3, 15, true) + '<path d="M150,30 H166 M150,45 H166 M150,60 H166" stroke-width="2"/>'
        + t(129, 30, 'VCC', 6.5) + t(129, 45, 'GND', 6.5) + t(129, 60, 'IN', 6.5) + '<circle cx="124" cy="74" r="3" stroke-width="1.2"/>'],
      ['em-rele4', 'Módulo relé (4 canais)', 230, 140, modulo(230, 140, ['GND', 'IN1', 'IN2', 'IN3', 'IN4', 'VCC'],
        [14, 68, 122, 176].map((x, i) => borne(x + 8, 18, 3, 14) + `<rect x="${x}" y="32" width="44" height="58" rx="2"/>` + t(x + 22, 52, 'RELÉ', 7) + t(x + 22, 70, 'K' + (i + 1), 8)).join(''), 16, 6.5)],
      ['em-lcd16x2', 'Display LCD 16×2 (I2C)', 250, 110, placa(18, 4, 228, 102, 4)
        + '<path d="M4,37 H18 M4,49 H18 M4,61 H18 M4,73 H18" stroke-width="2"/>'
        + t(31, 37, 'GND', 6.5) + t(31, 49, 'VCC', 6.5) + t(31, 61, 'SDA', 6.5) + t(31, 73, 'SCL', 6.5)
        + '<rect x="46" y="18" width="190" height="74" rx="2"/><rect x="52" y="30" width="178" height="52" stroke-width="1.6"/>'
        + lcdCelulas() + t(141, 99, 'LCD 16×2 – I2C', 7) + fixa(30, 14) + fixa(30, 96)],
      ['em-oled', 'Display OLED', 110, 110, '<path d="M32.5,4 V22 M47.5,4 V22 M62.5,4 V22 M77.5,4 V22" stroke-width="2"/>'
        + placa(4, 22, 102, 84, 4) + t(32.5, 30, 'GND', 6.5) + t(47.5, 30, 'VCC', 6.5) + t(62.5, 30, 'SCL', 6.5) + t(77.5, 30, 'SDA', 6.5)
        + '<rect x="14" y="40" width="82" height="58" rx="2"/><rect x="20" y="46" width="70" height="44" stroke-width="1.2"/>'
        + t(55, 57, 'OLED', 10) + '<path d="M24,82 L34,74 L44,78 L54,66 L64,72 L74,62 L86,68" stroke-width="1.4"/>'],
      ['em-7seg', 'Display de 7 segmentos', 90, 140, '<rect x="10" y="20" width="70" height="100" rx="3"/>'
        + '<path d="M33,34 H57 M61,38 V64 M61,72 V98 M33,102 H57 M29,72 V98 M29,38 V64 M33,68 H57" stroke-width="6"/>' + furo(70, 103, 3.2)
        + '<path d="M21,4 V20 M33,4 V20 M45,4 V20 M57,4 V20 M69,4 V20 M21,120 V136 M33,120 V136 M45,120 V136 M57,120 V136 M69,120 V136"/>'],
      ['em-matriz8x8', 'Matriz de LED 8×8', 140, 150, modulo(140, 150, ['VCC', 'GND', 'DIN', 'CS', 'CLK'], matriz(), 18)],
      ['em-solenoide', 'Válvula solenoide', 180, 120, '<path d="M4,82 H14 M166,82 H176"/>'
        + '<rect x="14" y="70" width="36" height="24" rx="2"/><rect x="130" y="70" width="36" height="24" rx="2"/>'
        + '<path d="M22,70 V94 M30,70 V94 M38,70 V94 M142,70 V94 M150,70 V94 M158,70 V94" stroke-width="1.1"/>'
        + '<rect x="50" y="62" width="80" height="40" rx="4"/><path d="M64,82 H106" stroke-width="2"/>' + head(116, 82, 0, 10)
        + '<rect x="60" y="18" width="60" height="44" rx="3"/>' + t(90, 34, 'BOBINA', 7)
        + '<path d="M68,48 Q72,40 76,48 Q80,40 84,48 Q88,40 92,48 Q96,40 100,48 Q104,40 108,48 Q112,40 112,48" stroke-width="1.4"/>'
        + '<path d="M80,18 V4 M100,18 V4" stroke-width="2"/>' + t(72, 10, '+', 9) + t(108, 10, '−', 9)],
      ['em-bomba', "Mini bomba d'água", 170, 110, '<rect x="60" y="30" width="96" height="60" rx="8"/>' + T(108, 60, 'M', 20)
        + '<rect x="24" y="22" width="36" height="76" rx="6"/>'
        + '<rect x="32" y="4" width="12" height="18" rx="1"/><rect x="4" y="54" width="20" height="12" rx="1"/>'
        + t(54, 12, 'saída', 6.5) + t(17, 78, 'entrada', 6)
        + '<path d="M156,48 H166 M156,72 H166" stroke-width="2"/>' + t(161, 39, '+', 9) + t(161, 82, '−', 9)],
    ]],
    ['Comunicação', [
      ['em-hc05', 'Bluetooth HC-05', 170, 90, placa(20, 6, 146, 78, 4)
        + ['STATE', 'RXD', 'TXD', 'GND', 'VCC', 'EN'].map((r, i) => { const y = 15 + i * 12; return `<path d="M4,${y} H20" stroke-width="2"/>` + t(35, y, r, 6.5); }).join('')
        + '<rect x="50" y="14" width="110" height="62" rx="2"/><rect x="64" y="24" width="32" height="32" rx="1" stroke-width="1.8"/>' + t(80, 40, 'BT', 10)
        + t(80, 67, 'HC-05', 8) + '<path d="M122,20 V70 H130 V20 H138 V70 H146 V20 H154 V70" stroke-width="1.4"/>'],
      ['em-lora', 'Módulo LoRa', 150, 110, modulo(150, 110, ['GND', '3V3', 'MISO', 'MOSI', 'SCK', 'NSS', 'RST', 'DIO0'],
        '<rect x="18" y="12" width="82" height="58" rx="2"/>' + T(59, 41, 'LoRa', 14)
        + '<path d="M124,68 V60 L114,56 L132,50 L114,44 L132,38 L114,32 L132,26 L114,20 L124,16 V10" stroke-width="1.8"/>', 17, 6)],
      ['em-nrf24', 'Rádio nRF24L01', 170, 80, placa(4, 6, 162, 68, 4)
        + barra(42, 22, 4, 12, true) + barra(54, 22, 4, 12, true)
        + t(24, 22, 'GND', 6.5) + t(24, 34, 'CE', 6.5) + t(24, 46, 'SCK', 6.5) + t(24, 58, 'MISO', 6.5)
        + t(72, 22, 'VCC', 6.5) + t(72, 34, 'CSN', 6.5) + t(72, 46, 'MOSI', 6.5) + t(72, 58, 'IRQ', 6.5)
        + '<rect x="88" y="28" width="20" height="20" rx="1" stroke-width="1.8"/>' + t(98, 58, 'nRF24', 6.5)
        + '<path d="M118,40 H124 V16 H132 V64 H140 V16 H148 V64 H156 V16" stroke-width="1.4"/>'],
      ['em-rs485', 'Módulo RS485', 160, 100, placa(20, 6, 120, 88, 4)
        + ['RO', 'RE', 'DE', 'DI'].map((r, i) => { const y = 26 + i * 16; return `<path d="M4,${y} H20" stroke-width="2"/>` + t(31, y, r, 6.5); }).join('')
        + ['VCC', 'B', 'A', 'GND'].map((r, i) => { const y = 26 + i * 16; return `<path d="M140,${y} H156" stroke-width="2"/>` + t(127, y, r, 6.5); }).join('')
        + ci(56, 30, 48, 22, 4) + t(80, 41, 'MAX485', 6.5)
        + borne(72, 76, 2, 16) + t(58, 76, 'A', 7) + t(102, 76, 'B', 7)],
      ['em-antena', 'Antena', 80, 140, '<rect x="36" y="8" width="8" height="88" rx="4"/><circle cx="40" cy="100" r="5"/>'
        + '<path d="M28,108 H52 L56,115 L52,122 H28 L24,115 Z"/><path d="M40,122 V136" stroke-width="3"/>'
        + '<path d="M52,22 Q60,32 52,42 M58,14 Q72,32 58,50 M28,22 Q20,32 28,42 M22,14 Q8,32 22,50" stroke-width="2"/>'],
      ['em-nuvem', 'Nuvem (IoT)', 160, 120, '<path d="M40,80 A20,20 0 0 1 36,42 A28,28 0 0 1 86,26 A24,24 0 0 1 126,46 A18,18 0 0 1 124,80 Z"/>'
        + T(82, 58, 'IoT', 18)
        + '<path d="M66,114 V96 M98,88 V106" stroke-width="2.4"/>' + head(66, 88, -90, 10) + head(98, 114, 90, 10)],
      ['em-roteador', 'Roteador Wi-Fi', 170, 124, '<rect x="14" y="76" width="142" height="36" rx="8"/><path d="M28,112 V118 H40 V112 M130,112 V118 H142 V112"/>'
        + '<path d="M40,76 L28,22 M130,76 L142,22" stroke-width="5"/>'
        + furo(40, 94, 3) + furo(54, 94, 3) + furo(68, 94, 3) + furo(82, 94, 3) + t(120, 94, 'Wi-Fi', 8)
        + wifi(85, 62, [12, 24, 36])],
    ]],
    ['Componentes avulsos', [
      ['em-resistor', 'Resistor', 170, 40, '<path d="M4,20 H44 M126,20 H166"/>'
        + '<path d="M44,14 Q44,10 50,10 H58 Q62,10 64,13 H106 Q108,10 112,10 H120 Q126,10 126,14 V26 Q126,30 120,30 H112 Q108,30 106,27 H64 Q62,30 58,30 H50 Q44,30 44,26 Z"/>'
        + '<path d="M54,11 V29 M72,14 V26 M82,14 V26 M92,14 V26 M116,11 V29" stroke-width="3.5" stroke-linecap="butt"/>'],
      ['em-ceramico', 'Capacitor cerâmico', 70, 120, '<circle cx="35" cy="34" r="26"/>' + t(35, 34, '104', 10) + '<path d="M27,59 V116 M43,59 V116"/>'],
      ['em-eletrolitico', 'Capacitor eletrolítico', 80, 150, '<rect x="18" y="8" width="44" height="88" rx="6"/><path d="M18,20 H62" stroke-width="1.2"/><path d="M50,8 V96" stroke-width="1.4"/>'
        + t(56, 36, '−', 10) + t(56, 70, '−', 10) + girar(-90, 34, 52, t(34, 52, '100 µF', 8))
        + '<path d="M30,96 V146 M50,96 V130"/>' + t(20, 124, '+', 10) + t(60, 116, '−', 10)],
      ['em-potenciometro', 'Potenciômetro', 110, 140, '<rect x="17" y="14" width="76" height="76" rx="10"/>'
        + '<circle cx="55" cy="52" r="18" stroke-dasharray="3 2.5"/><circle cx="55" cy="52" r="12" stroke-width="1.6"/><path d="M47,52 H63" stroke-width="3"/>'
        + '<path d="M35,90 V136 M55,90 V136 M75,90 V136"/>' + t(29, 104, '1', 8) + t(49, 104, '2', 8) + t(69, 104, '3', 8)],
      ['em-botao', 'Botão tátil (push button)', 110, 110, '<rect x="25" y="25" width="60" height="60" rx="3"/><circle cx="55" cy="55" r="16"/><circle cx="55" cy="55" r="11" stroke-width="1.4"/>'
        + furo(32, 32, 2) + furo(78, 32, 2) + furo(32, 78, 2) + furo(78, 78, 2)
        + '<path d="M4,36 H25 M4,74 H25 M85,36 H106 M85,74 H106"/>'],
      ['em-chave', 'Chave liga-desliga', 130, 100, '<rect x="10" y="24" width="110" height="40" rx="3"/><rect x="34" y="36" width="62" height="16" rx="2" stroke-width="1.4"/>'
        + '<rect x="36" y="30" width="26" height="28" rx="2" fill="#C" stroke="none"/>' + t(40, 14, 'LIGA', 8) + t(92, 14, 'DESL', 8)
        + '<path d="M40,64 V96 M65,64 V96 M90,64 V96"/>'],
      ['em-to92', 'Transistor TO-92', 100, 128, to92('BC547', ['C', 'B', 'E'])],
      ['em-to220', 'Regulador TO-220', 100, 170, '<rect x="18" y="6" width="64" height="38" rx="2"/><circle cx="50" cy="24" r="8"/>'
        + '<rect x="18" y="44" width="64" height="62" rx="2"/>' + t(50, 66, '7805', 11)
        + t(32, 96, 'IN', 7) + t(50, 96, 'GND', 7) + t(68, 96, 'OUT', 7) + '<path d="M32,106 V166 M50,106 V166 M68,106 V166" stroke-width="3"/>'],
      ['em-dip8', 'CI DIP-8', dip8w, 90, dip8],
      ['em-dip16', 'CI DIP-16', dip16w, 90, dip16],
      ['em-diodo', 'Diodo', 170, 40, '<path d="M4,20 H50 M120,20 H166"/><rect x="50" y="11" width="70" height="18" rx="4"/><rect x="102" y="11" width="8" height="18" fill="#C" stroke="none"/>'
        + t(30, 10, 'A', 8) + t(140, 10, 'K', 8)],
      ['em-cristal', 'Cristal oscilador', 90, 120, '<rect x="12" y="10" width="66" height="40" rx="20"/><rect x="18" y="16" width="54" height="28" rx="14" stroke-width="1.2"/>'
        + t(45, 30, '16 MHz', 8) + '<path d="M33,50 V116 M57,50 V116"/>'],
    ]],
  ],
};
