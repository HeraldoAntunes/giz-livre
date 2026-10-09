// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
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

// ---- utilidades das formas da segunda parte (rótulos legíveis a ~80 px: fonte >= 14) ----
const R = (x, y, s, z = 14) => T(f1(x), f1(y), s, z);
const pernas = (xs, y1, y2) => `<path d="${xs.map(x => `M${x},${y1} V${y2}`).join(' ')}" stroke-width="2"/>`;
const ponto = (x, y, r = 3) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="#C" stroke="none"/>`;
const seta = (x1, y1, x2, y2, L = 9, w = 2.2) => `<path d="M${f1(x1)},${f1(y1)} L${f1(x2)},${f1(y2)}" stroke-width="${w}"/>` + head(f1(x2), f1(y2), Math.round(Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI), L);
const seta2 = (x1, y1, x2, y2, L = 8, w = 2) => seta(x1, y1, x2, y2, L, w) + head(f1(x1), f1(y1), Math.round(Math.atan2(y1 - y2, x1 - x2) * 180 / Math.PI), L);
const bloco = (x, y, w, h, s, z = 14) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>` + R(x + w / 2, y + h / 2, s, z);
const estado = (cx, cy, r, s, z = 15) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>` + R(cx, cy, s, z);
// resistor em zigue-zague vertical de y1 a y2
const zig = (x, y1, y2) => {
  const a = y1 + 8, b = y2 - 8, d = (b - a) / 6;
  let s = `M${x},${y1} V${a}`;
  for (let i = 1; i <= 6; i++) s += ` L${x + (i % 2 ? 10 : -10)},${f1(a + d * (i - 0.5))}`;
  return `<path d="${s} L${x},${b} V${y2}"/>`;
};
// sonda com cabo ligada a uma placa condicionadora (TDS, OD)
const sondaPlaca = (nome, ponta) => '<rect x="14" y="10" width="38" height="84" rx="4"/>' + R(33, 50, nome) + ponta
  + '<path d="M33,10 C33,0 86,0 96,24 C102,40 110,50 125,50" stroke-width="2.4"/>'
  + placa(118, 20, 88, 80, 4) + '<circle cx="136" cy="50" r="11"/><circle cx="136" cy="50" r="4" stroke-width="1.4"/>'
  + '<rect x="156" y="36" width="38" height="24" rx="1.5" stroke-width="1.8"/>'
  + pernas([138, 162, 186], 100, 136) + R(138, 86, '+') + R(162, 86, '−') + R(186, 86, 'A');
// conversor CC-CC em placa (buck / boost)
const conversor = (titulo) => placa(20, 8, 150, 84, 4)
  + '<circle cx="62" cy="40" r="20"/><circle cx="62" cy="40" r="10" stroke-width="1.4"/>'
  + '<rect x="96" y="18" width="26" height="16" rx="2" stroke-width="1.6"/><circle cx="103" cy="26" r="3.5" stroke-width="1.2"/>'
  + '<rect x="130" y="22" width="28" height="22" rx="1.5" stroke-width="1.8"/><circle cx="110" cy="54" r="7" stroke-width="1.4"/>'
  + R(95, 76, titulo) + '<path d="M4,32 H20 M4,62 H20 M170,32 H186 M170,62 H186" stroke-width="2"/>'
  + R(10, 20, '+') + R(10, 76, '−') + R(180, 20, '+') + R(180, 76, '−');
// onda senoidal amostrada (gera o caminho em JS)
const amostras = () => {
  const y = (x) => f1(70 - 40 * Math.sin(2 * Math.PI * (x - 20) / 160));
  let p = 'M20,70';
  for (let x = 24; x <= 212; x += 4) p += ` L${x},${y(x)}`;
  let s = `<path d="${p}" stroke-width="1.4" stroke-dasharray="5 4"/>`;
  for (let x = 20; x <= 212; x += 16) s += `<path d="M${x},70 V${y(x)}" stroke-width="1.8"/>` + ponto(x, y(x), 3.5);
  return s;
};
// quadro serial: repouso, start, 8 bits, stop
const quadro = () => {
  const bits = [0, 1, 0, 1, 1, 0, 0, 1, 0, 1];
  let p = 'M8,34 H30', x = 30;
  for (const b of bits) { p += ` V${b ? 34 : 62} H${x + 22}`; x += 22; }
  let s = `<path d="${p} H252" stroke-width="2.4"/>`;
  for (let k = 0; k <= 10; k++) s += `<path d="M${30 + 22 * k},26 V70" stroke-width="1" stroke-dasharray="2 3"/>`;
  return s;
};
// topologias de rede: nós ligados (encurta a linha para não invadir os círculos)
const rede = (nos, ligs, r = 11) => {
  let s = '';
  for (const [a, b] of ligs) {
    const [x1, y1] = nos[a], [x2, y2] = nos[b], d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    const ra = a === 0 && nos.centro ? nos.centro : r;
    s += `<path d="M${f1(x1 + ux * ra)},${f1(y1 + uy * ra)} L${f1(x2 - ux * r)},${f1(y2 - uy * r)}" stroke-width="2"/>`;
  }
  return s;
};
const pa = (k, n, cx, cy, d) => `<g transform="rotate(${f1(360 * k / n)} ${cx} ${cy})">${d}</g>`;





// AMPLIACAO-B-INICIO
// SVG autoral: esquemas didáticos, sem certificação normativa ou pinagem universal.
const AMPLIACAO_B = [
  [
    [
      "em-fsm-recalque",
      "Máquina de estados: recalque por níveis",
      500,
      175,
      "<rect x=\"20\" y=\"40\" width=\"150\" height=\"65\" rx=\"4\"/><text x=\"95.0\" y=\"61.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PARADA</text><text x=\"95.0\" y=\"83.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">bomba = 0</text><rect x=\"310\" y=\"40\" width=\"150\" height=\"65\" rx=\"4\"/><text x=\"385.0\" y=\"61.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">BOMBEIA</text><text x=\"385.0\" y=\"83.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">bomba = 1</text><path d=\"M170 57 L310 57\"/><path d=\"M310 57 L301.0 61.0 L301.0 53.0 Z\" fill=\"#C\"/><text x=\"240\" y=\"30\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Baixo + água OK</text><path d=\"M310 90 L170 90\"/><path d=\"M170 90 L179.0 86.0 L179.0 94.0 Z\" fill=\"#C\"/><text x=\"240\" y=\"125\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Alto ou falha</text><text x=\"250.0\" y=\"159\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Saída inicial segura; histerese pelos dois sensores</text>"
    ],
    [
      "em-fsm-falha-ack",
      "Máquina de estados: falha e reconhecimento",
      660,
      220,
      "<rect x=\"20\" y=\"40\" width=\"140\" height=\"65\" rx=\"4\"/><text x=\"90.0\" y=\"72.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">NORMAL</text><rect x=\"250\" y=\"40\" width=\"140\" height=\"65\" rx=\"4\"/><text x=\"320.0\" y=\"72.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">FALHA</text><rect x=\"480\" y=\"40\" width=\"140\" height=\"65\" rx=\"4\"/><text x=\"550.0\" y=\"72.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PRONTO</text><path d=\"M160 70 L250 70\"/><path d=\"M250 70 L241.0 74.0 L241.0 66.0 Z\" fill=\"#C\"/><path d=\"M390 70 L480 70\"/><path d=\"M480 70 L471.0 74.0 L471.0 66.0 Z\" fill=\"#C\"/><text x=\"205\" y=\"35\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Evento</text><text x=\"435\" y=\"35\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ACK</text><path d=\"M550 105 V155 H90 V105\"/><path d=\"M90 130 L90 105\"/><path d=\"M90 105 L94.0 114.0 L86.0 114.0 Z\" fill=\"#C\"/><text x=\"325\" y=\"176\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Causa removida + comando válido</text><text x=\"330.0\" y=\"204\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Reconhecer alarme não deve religar sozinho uma máquina</text>"
    ],
    [
      "em-isr-deferida",
      "Interrupção: ISR curta e processamento adiado",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Evento</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">periférico</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ISR</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">marca / fila</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Loop / tarefa</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">processa</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Saída</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">atualiza</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Na ISR: reconhecer a fonte; evitar espera e trabalho longo</text>"
    ],
    [
      "em-polling-irq",
      "Polling e interrupção: linha do tempo",
      650,
      200,
      "<text x=\"80\" y=\"35\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Polling</text><text x=\"80\" y=\"125\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">IRQ</text><path d=\"M150 35 H610 M150 125 H330 M440 125 H610\"/><path d=\"M320 5 L320 27\"/><path d=\"M320 27 L315.9 18.0 L324.1 18.0 Z\" fill=\"#C\"/><text x=\"390\" y=\"15\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Evento</text><path d=\"M190 25 v20\"/><path d=\"M275 25 v20\"/><path d=\"M360 25 v20\"/><path d=\"M445 25 v20\"/><path d=\"M530 25 v20\"/><rect x=\"330\" y=\"95\" width=\"110\" height=\"55\" rx=\"4\"/><text x=\"385.0\" y=\"122.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ISR</text><text x=\"495\" y=\"70\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Detecção na consulta</text><text x=\"325.0\" y=\"184\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Polling consulta periodicamente; IRQ reage ao evento</text>"
    ],
    [
      "em-atomicidade",
      "Concorrência: acesso atômico e seção crítica",
      660,
      220,
      "<rect x=\"20\" y=\"30\" width=\"600\" height=\"145\" rx=\"0\"/><text x=\"320\" y=\"58\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Recurso compartilhado: ler → modificar → gravar</text><rect x=\"45\" y=\"100\" width=\"220\" height=\"50\" rx=\"4\"/><text x=\"155.0\" y=\"125.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Seção crítica / atômico</text><rect x=\"350\" y=\"100\" width=\"245\" height=\"50\" rx=\"4\"/><text x=\"472.5\" y=\"125.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Restaurar estado de IRQ</text><path d=\"M265 125 L350 125\"/><path d=\"M350 125 L341.0 129.1 L341.0 121.0 Z\" fill=\"#C\"/><text x=\"330.0\" y=\"204\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">volatile não torna a operação atômica nem garante exclusão</text>"
    ],
    [
      "em-buffer-circular",
      "Buffer circular: índices de leitura e escrita",
      630,
      250,
      "<rect x=\"80\" y=\"65\" width=\"60\" height=\"65\" rx=\"0\"/><text x=\"110\" y=\"97\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">0</text><rect x=\"140\" y=\"65\" width=\"60\" height=\"65\" rx=\"0\"/><text x=\"170\" y=\"97\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">1</text><rect x=\"200\" y=\"65\" width=\"60\" height=\"65\" rx=\"0\"/><text x=\"230\" y=\"97\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">2</text><rect x=\"260\" y=\"65\" width=\"60\" height=\"65\" rx=\"0\"/><text x=\"290\" y=\"97\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">3</text><rect x=\"320\" y=\"65\" width=\"60\" height=\"65\" rx=\"0\"/><text x=\"350\" y=\"97\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">4</text><rect x=\"380\" y=\"65\" width=\"60\" height=\"65\" rx=\"0\"/><text x=\"410\" y=\"97\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">5</text><rect x=\"440\" y=\"65\" width=\"60\" height=\"65\" rx=\"0\"/><text x=\"470\" y=\"97\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">6</text><rect x=\"500\" y=\"65\" width=\"60\" height=\"65\" rx=\"0\"/><text x=\"530\" y=\"97\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">7</text><path d=\"M190 20 L190 62\"/><path d=\"M190 62 L185.9 53.0 L194.1 53.0 Z\" fill=\"#C\"/><text x=\"190\" y=\"15\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Leitura</text><path d=\"M430 180 L430 133\"/><path d=\"M430 133 L434.1 142.0 L425.9 142.0 Z\" fill=\"#C\"/><text x=\"430\" y=\"200\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Escrita</text><path d=\"M560 130 V160 H80 V130\"/><text x=\"315.0\" y=\"234\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Buffer circular; política explícita para cheio e vazio</text>"
    ],
    [
      "em-fila-produtor",
      "ISR e tarefa: fila produtor-consumidor",
      530,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ISR</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">produtor</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Fila</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">limitada</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Tarefa</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">consumidor</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><text x=\"265.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Definir sincronização, tamanho e tratamento de overflow</text>"
    ],
    [
      "em-rtos-preempcao",
      "RTOS: prioridades e preempção",
      680,
      235,
      "<path d=\"M130 40 H150\"/><rect x=\"150\" y=\"20\" width=\"100\" height=\"40\" rx=\"4\"/><text x=\"200.0\" y=\"40.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A</text><path d=\"M250 40 H330\"/><rect x=\"330\" y=\"20\" width=\"100\" height=\"40\" rx=\"4\"/><text x=\"380.0\" y=\"40.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A</text><path d=\"M430 40 H640\"/><path d=\"M130 110 H250\"/><rect x=\"250\" y=\"90\" width=\"80\" height=\"40\" rx=\"4\"/><text x=\"290.0\" y=\"110.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">B</text><path d=\"M330 110 H430\"/><rect x=\"430\" y=\"90\" width=\"90\" height=\"40\" rx=\"4\"/><text x=\"475.0\" y=\"110.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">B</text><path d=\"M520 110 H640\"/><path d=\"M130 180 H520\"/><rect x=\"520\" y=\"160\" width=\"110\" height=\"40\" rx=\"4\"/><text x=\"575.0\" y=\"180.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">C</text><path d=\"M630 180 H640\"/><text x=\"65\" y=\"40\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Alta</text><text x=\"65\" y=\"110\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Média</text><text x=\"65\" y=\"180\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Baixa</text><text x=\"340.0\" y=\"219\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Exemplo preemptivo: tarefa pronta de maior prioridade executa</text>"
    ]
  ],
  [
    [
      "em-timer-periodo",
      "Timer: período por prescaler e auto-reload",
      580,
      215,
      "<rect x=\"20\" y=\"40\" width=\"140\" height=\"70\" rx=\"4\"/><text x=\"90.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Clock</text><text x=\"90.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">fclk</text><rect x=\"210\" y=\"40\" width=\"140\" height=\"70\" rx=\"4\"/><text x=\"280.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Prescaler</text><text x=\"280.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PSC + 1</text><rect x=\"400\" y=\"40\" width=\"140\" height=\"70\" rx=\"4\"/><text x=\"470.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Contador</text><text x=\"470.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ARR + 1</text><path d=\"M160 75 L210 75\"/><path d=\"M210 75 L201.0 79.0 L201.0 71.0 Z\" fill=\"#C\"/><path d=\"M350 75 L400 75\"/><path d=\"M400 75 L391.0 79.0 L391.0 71.0 Z\" fill=\"#C\"/><text x=\"280\" y=\"165\" font-size=\"20\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">T = (PSC + 1)(ARR + 1) / fclk</text><text x=\"290.0\" y=\"199\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Contagem crescente simples; verificar arquitetura do timer</text>"
    ],
    [
      "em-timer-wrap",
      "Temporização sem bloqueio e wrap-around",
      660,
      225,
      "<rect x=\"20\" y=\"30\" width=\"600\" height=\"150\" rx=\"0\"/><text x=\"320\" y=\"60\" font-size=\"20\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">tempo_decorrido = agora − anterior</text><text x=\"320\" y=\"105\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Se tempo_decorrido ≥ intervalo: executar e atualizar</text><text x=\"320\" y=\"145\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Aritmética sem sinal de mesma largura</text><text x=\"330.0\" y=\"209\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Tratar wrap-around; respeitar limite do intervalo e polling</text>"
    ],
    [
      "em-tarefas-periodicas",
      "Loop cooperativo: tarefas periódicas",
      690,
      230,
      "<path d=\"M80 70 H100\"/><rect x=\"100\" y=\"50\" width=\"55\" height=\"40\" rx=\"4\"/><text x=\"127.5\" y=\"70.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A</text><path d=\"M155 70 H240\"/><rect x=\"240\" y=\"50\" width=\"55\" height=\"40\" rx=\"4\"/><text x=\"267.5\" y=\"70.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A</text><path d=\"M295 70 H380\"/><rect x=\"380\" y=\"50\" width=\"55\" height=\"40\" rx=\"4\"/><text x=\"407.5\" y=\"70.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A</text><path d=\"M435 70 H520\"/><rect x=\"520\" y=\"50\" width=\"55\" height=\"40\" rx=\"4\"/><text x=\"547.5\" y=\"70.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A</text><path d=\"M575 70 H650\"/><path d=\"M80 160 H170\"/><rect x=\"170\" y=\"140\" width=\"80\" height=\"40\" rx=\"4\"/><text x=\"210.0\" y=\"160.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">B</text><path d=\"M250 160 H450\"/><rect x=\"450\" y=\"140\" width=\"80\" height=\"40\" rx=\"4\"/><text x=\"490.0\" y=\"160.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">B</text><path d=\"M530 160 H650\"/><text x=\"50\" y=\"70\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A</text><text x=\"50\" y=\"160\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">B</text><text x=\"350\" y=\"15\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Tick periódico → tarefas vencidas</text><text x=\"345.0\" y=\"214\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Escalonamento cooperativo: cada tarefa deve retornar logo</text>"
    ],
    [
      "em-watchdog-saude",
      "Watchdog: alimentar só com saúde confirmada",
      700,
      290,
      "<rect x=\"20\" y=\"70\" width=\"150\" height=\"80\" rx=\"4\"/><text x=\"95.0\" y=\"99.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Tarefas</text><text x=\"95.0\" y=\"121.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">reportam saúde</text><rect x=\"250\" y=\"70\" width=\"150\" height=\"80\" rx=\"4\"/><text x=\"325.0\" y=\"99.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Supervisor</text><text x=\"325.0\" y=\"121.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">verifica prazo</text><rect x=\"500\" y=\"20\" width=\"160\" height=\"65\" rx=\"4\"/><text x=\"580.0\" y=\"41.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Todas OK</text><text x=\"580.0\" y=\"63.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">alimenta WDT</text><rect x=\"500\" y=\"170\" width=\"160\" height=\"75\" rx=\"4\"/><text x=\"580.0\" y=\"185.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Falha / prazo</text><text x=\"580.0\" y=\"207.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">não alimenta</text><text x=\"580.0\" y=\"229.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">→ reset seguro</text><path d=\"M170 110 L250 110\"/><path d=\"M250 110 L241.0 114.0 L241.0 106.0 Z\" fill=\"#C\"/><path d=\"M400 90 L500 52\"/><path d=\"M500 52 L493.0 59.0 L490.1 51.4 Z\" fill=\"#C\"/><path d=\"M400 135 L500 205\"/><path d=\"M500 205 L490.3 203.2 L494.9 196.5 Z\" fill=\"#C\"/><text x=\"350.0\" y=\"274\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Testar timeout, estado seguro e recuperação após reset</text>"
    ],
    [
      "em-boot-seguro",
      "Inicialização: saídas seguras antes do controle",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Reset</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">saídas seguras</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Clock + IO</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">periféricos</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Autoteste</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">configuração</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Habilita</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">controle</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Atuadores permanecem inativos até validação dos permissivos</text>"
    ]
  ],
  [
    [
      "em-amostragem-nyquist",
      "ADC: amostragem e anti-alias",
      620,
      240,
      "<path d=\"M50 160 H580 M50 160 V25\" stroke-width=\"1.6\"/><path d=\"M60 100.000 L64 91.396 L68 83.004 L72 75.031 L76 67.672 L80 61.109 L84 55.504 L88 50.995 L92 47.692 L96 45.677 L100 45.000 L104 45.677 L108 47.692 L112 50.995 L116 55.504 L120 61.109 L124 67.672 L128 75.031 L132 83.004 L136 91.396 L140 100.000 L144 108.604 L148 116.996 L152 124.969 L156 132.328 L160 138.891 L164 144.496 L168 149.005 L172 152.308 L176 154.323 L180 155.000 L184 154.323 L188 152.308 L192 149.005 L196 144.496 L200 138.891 L204 132.328 L208 124.969 L212 116.996 L216 108.604 L220 100.000 L224 91.396 L228 83.004 L232 75.031 L236 67.672 L240 61.109 L244 55.504 L248 50.995 L252 47.692 L256 45.677 L260 45.000 L264 45.677 L268 47.692 L272 50.995 L276 55.504 L280 61.109 L284 67.672 L288 75.031 L292 83.004 L296 91.396 L300 100.000 L304 108.604 L308 116.996 L312 124.969 L316 132.328 L320 138.891 L324 144.496 L328 149.005 L332 152.308 L336 154.323 L340 155.000 L344 154.323 L348 152.308 L352 149.005 L356 144.496 L360 138.891 L364 132.328 L368 124.969 L372 116.996 L376 108.604 L380 100.000 L384 91.396 L388 83.004 L392 75.031 L396 67.672 L400 61.109 L404 55.504 L408 50.995 L412 47.692 L416 45.677 L420 45.000 L424 45.677 L428 47.692 L432 50.995 L436 55.504 L440 61.109 L444 67.672 L448 75.031 L452 83.004 L456 91.396 L460 100.000 L464 108.604 L468 116.996 L472 124.969 L476 132.328 L480 138.891 L484 144.496 L488 149.005 L492 152.308 L496 154.323 L500 155.000 L504 154.323 L508 152.308 L512 149.005 L516 144.496 L520 138.891 L524 132.328 L528 124.969 L532 116.996 L536 108.604 L540 100.000\" stroke-width=\"1.6\"/><path d=\"M60 160 V100.0\" stroke-width=\"1.6\"/><circle cx=\"60\" cy=\"100.0\" r=\"3\" fill=\"#C\" stroke=\"none\"/><path d=\"M100 160 V45.0\" stroke-width=\"1.6\"/><circle cx=\"100\" cy=\"45.0\" r=\"3\" fill=\"#C\" stroke=\"none\"/><path d=\"M140 160 V100.0\" stroke-width=\"1.6\"/><circle cx=\"140\" cy=\"100.0\" r=\"3\" fill=\"#C\" stroke=\"none\"/><path d=\"M180 160 V155.0\" stroke-width=\"1.6\"/><circle cx=\"180\" cy=\"155.0\" r=\"3\" fill=\"#C\" stroke=\"none\"/><path d=\"M220 160 V100.00000000000001\" stroke-width=\"1.6\"/><circle cx=\"220\" cy=\"100.00000000000001\" r=\"3\" fill=\"#C\" stroke=\"none\"/><path d=\"M260 160 V45.0\" stroke-width=\"1.6\"/><circle cx=\"260\" cy=\"45.0\" r=\"3\" fill=\"#C\" stroke=\"none\"/><path d=\"M300 160 V99.99999999999999\" stroke-width=\"1.6\"/><circle cx=\"300\" cy=\"99.99999999999999\" r=\"3\" fill=\"#C\" stroke=\"none\"/><path d=\"M340 160 V155.0\" stroke-width=\"1.6\"/><circle cx=\"340\" cy=\"155.0\" r=\"3\" fill=\"#C\" stroke=\"none\"/><path d=\"M380 160 V100.00000000000003\" stroke-width=\"1.6\"/><circle cx=\"380\" cy=\"100.00000000000003\" r=\"3\" fill=\"#C\" stroke=\"none\"/><path d=\"M420 160 V45.0\" stroke-width=\"1.6\"/><circle cx=\"420\" cy=\"45.0\" r=\"3\" fill=\"#C\" stroke=\"none\"/><path d=\"M460 160 V99.99999999999997\" stroke-width=\"1.6\"/><circle cx=\"460\" cy=\"99.99999999999997\" r=\"3\" fill=\"#C\" stroke=\"none\"/><path d=\"M500 160 V155.0\" stroke-width=\"1.6\"/><circle cx=\"500\" cy=\"155.0\" r=\"3\" fill=\"#C\" stroke=\"none\"/><path d=\"M540 160 V100.00000000000004\" stroke-width=\"1.6\"/><circle cx=\"540\" cy=\"100.00000000000004\" r=\"3\" fill=\"#C\" stroke=\"none\"/><text x=\"310\" y=\"195\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">fs &gt; 2 fmax (sinal limitado em banda)</text><text x=\"310.0\" y=\"224\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Na prática: filtro anti-alias e margem para transição</text>"
    ],
    [
      "em-adc-quantizacao",
      "ADC: quantização e resolução ideal",
      590,
      305,
      "<path d=\"M55 185 H540 M55 185 V30\"/><path d=\"M55 185 h55 v-20\"/><path d=\"M110 165 h55 v-20\"/><path d=\"M165 145 h55 v-20\"/><path d=\"M220 125 h55 v-20\"/><path d=\"M275 105 h55 v-20\"/><path d=\"M330 85 h55 v-20\"/><path d=\"M385 65 h55 v-20\"/><path d=\"M440 45 h55\"/><text x=\"300\" y=\"220\" font-size=\"20\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">LSB ideal ≈ Vref / 2ᴺ</text><text x=\"300\" y=\"255\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Código: 0 … 2ᴺ − 1</text><text x=\"295.0\" y=\"289\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Curva ideal ilustrativa; erro total inclui ruído e não linearidade</text><text x=\"95\" y=\"18\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Código</text><text x=\"500\" y=\"205\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Vin (V)</text>"
    ],
    [
      "em-adc-timer-dma",
      "Aquisição: timer dispara ADC e DMA",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Timer</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">trigger</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ADC</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">conversão</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">DMA</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">buffer</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Tarefa</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">processa bloco</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Respeitar tempo de aquisição, impedância e overrun</text>"
    ],
    [
      "em-pwm-definicoes",
      "PWM: período, frequência e duty cycle",
      640,
      280,
      "<path d=\"M40 110 H80 V45 H200 V110 H360 V45 H480 V110 H600\"/><path d=\"M80 145 V155 H360 V145 M80 175 H200\" stroke-width=\"1.6\"/><text x=\"220\" y=\"170\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">T</text><text x=\"140\" y=\"195\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Ton</text><text x=\"320\" y=\"235\" font-size=\"20\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">D = Ton / T • fPWM = 1 / T</text><text x=\"320.0\" y=\"264\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">PWM de borda; duty não equivale a tensão CC sem filtragem</text>"
    ],
    [
      "em-captura-entrada",
      "Timer: captura de período de entrada",
      630,
      290,
      "<path d=\"M40 115 H100 V50 H180 V115 H380 V50 H460 V115 H590\"/><path d=\"M100 180 L100 55\"/><path d=\"M100 55 L104.0 64.0 L96.0 64.0 Z\" fill=\"#C\"/><path d=\"M380 180 L380 55\"/><path d=\"M380 55 L384.1 64.0 L375.9 64.0 Z\" fill=\"#C\"/><text x=\"100\" y=\"205\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">captura 1</text><text x=\"380\" y=\"205\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">captura 2</text><text x=\"300\" y=\"245\" font-size=\"20\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">T = Δcontagem / fcontador</text><text x=\"315.0\" y=\"274\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Tratar overflow e configurar a borda de captura</text>"
    ],
    [
      "em-debounce-fsm",
      "Botão: debounce por máquina de estados",
      690,
      225,
      "<rect x=\"20\" y=\"40\" width=\"140\" height=\"65\" rx=\"4\"/><text x=\"90.0\" y=\"72.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ESTÁVEL</text><rect x=\"260\" y=\"40\" width=\"150\" height=\"65\" rx=\"4\"/><text x=\"335.0\" y=\"61.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CANDIDATO</text><text x=\"335.0\" y=\"83.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">inicia prazo</text><rect x=\"510\" y=\"40\" width=\"140\" height=\"65\" rx=\"4\"/><text x=\"580.0\" y=\"72.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CONFIRMADO</text><path d=\"M160 70 L260 70\"/><path d=\"M260 70 L251.0 74.0 L251.0 66.0 Z\" fill=\"#C\"/><path d=\"M410 70 L510 70\"/><path d=\"M510 70 L501.0 74.0 L501.0 66.0 Z\" fill=\"#C\"/><text x=\"210\" y=\"30\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Mudou</text><text x=\"460\" y=\"30\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Prazo OK</text><path d=\"M335 105 V155 H90 V105\"/><path d=\"M90 130 L90 105\"/><path d=\"M90 105 L94.0 114.0 L86.0 114.0 Z\" fill=\"#C\"/><text x=\"240\" y=\"178\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Retornou ao estado anterior</text><text x=\"345.0\" y=\"209\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Debounce temporal; prazo depende da chave e da aplicação</text>"
    ]
  ],
  [
    [
      "em-i2c-quadro",
      "I²C: quadro, endereço e ACK",
      680,
      200,
      "<rect x=\"20\" y=\"45\" width=\"90\" height=\"65\" rx=\"4\"/><text x=\"65.0\" y=\"77.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">START</text><rect x=\"110\" y=\"45\" width=\"150\" height=\"65\" rx=\"4\"/><text x=\"185.0\" y=\"77.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">End. + R/W</text><rect x=\"260\" y=\"45\" width=\"70\" height=\"65\" rx=\"4\"/><text x=\"295.0\" y=\"77.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ACK</text><rect x=\"330\" y=\"45\" width=\"95\" height=\"65\" rx=\"4\"/><text x=\"377.5\" y=\"77.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Dado</text><rect x=\"425\" y=\"45\" width=\"145\" height=\"65\" rx=\"4\"/><text x=\"497.5\" y=\"77.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ACK / NACK</text><rect x=\"570\" y=\"45\" width=\"90\" height=\"65\" rx=\"4\"/><text x=\"615.0\" y=\"77.5\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">STOP</text><text x=\"330.0\" y=\"145\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">SDA muda com SCL baixo, exceto START / STOP</text><text x=\"340.0\" y=\"184\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Quadro genérico I²C; ACK é o nono pulso de clock</text>"
    ],
    [
      "em-spi-direcoes",
      "SPI: clock, dados e seleção do periférico",
      620,
      260,
      "<rect x=\"20\" y=\"30\" width=\"140\" height=\"180\" rx=\"4\"/><text x=\"90.0\" y=\"109.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Controlador</text><text x=\"90.0\" y=\"131.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">SPI</text><rect x=\"440\" y=\"30\" width=\"140\" height=\"180\" rx=\"4\"/><text x=\"510.0\" y=\"109.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Periférico</text><text x=\"510.0\" y=\"131.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">SPI</text><path d=\"M160 65 L440 65\"/><path d=\"M440 65 L431.0 69.0 L431.0 61.0 Z\" fill=\"#C\"/><text x=\"300\" y=\"49\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">SCK</text><path d=\"M160 105 L440 105\"/><path d=\"M440 105 L431.0 109.0 L431.0 101.0 Z\" fill=\"#C\"/><text x=\"300\" y=\"89\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">MOSI</text><path d=\"M440 145 L160 145\"/><path d=\"M160 145 L169.0 140.9 L169.0 149.1 Z\" fill=\"#C\"/><text x=\"300\" y=\"129\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">MISO</text><path d=\"M160 185 L440 185\"/><path d=\"M440 185 L431.0 189.1 L431.0 180.9 Z\" fill=\"#C\"/><text x=\"300\" y=\"169\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CS ativo</text><text x=\"310.0\" y=\"244\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Modo CPOL/CPHA e seleção CS devem coincidir</text>"
    ],
    [
      "em-uart-8n1",
      "UART 8N1: quadro de 0xA5",
      600,
      195,
      "<path d=\"M30 45 H78\"/><text x=\"54\" y=\"140\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Idle</text><path d=\"M78 45 V105\"/><path d=\"M78 105 H126\"/><text x=\"102\" y=\"140\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Start</text><path d=\"M126 105 V45\"/><path d=\"M126 45 H174\"/><text x=\"150\" y=\"140\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">D0</text><path d=\"M174 45 V105\"/><path d=\"M174 105 H222\"/><text x=\"198\" y=\"140\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">D1</text><path d=\"M222 105 V45\"/><path d=\"M222 45 H270\"/><text x=\"246\" y=\"140\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">D2</text><path d=\"M270 45 V105\"/><path d=\"M270 105 H318\"/><text x=\"294\" y=\"140\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">D3</text><path d=\"M318 105 V105\"/><path d=\"M318 105 H366\"/><text x=\"342\" y=\"140\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">D4</text><path d=\"M366 105 V45\"/><path d=\"M366 45 H414\"/><text x=\"390\" y=\"140\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">D5</text><path d=\"M414 45 V105\"/><path d=\"M414 105 H462\"/><text x=\"438\" y=\"140\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">D6</text><path d=\"M462 105 V45\"/><path d=\"M462 45 H510\"/><text x=\"486\" y=\"140\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">D7</text><path d=\"M510 45 V45\"/><path d=\"M510 45 H558\"/><text x=\"534\" y=\"140\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Stop</text><text x=\"300.0\" y=\"179\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">UART 8N1, LSB primeiro; exemplo 0xA5, repouso alto</text>"
    ],
    [
      "em-can-arbitragem",
      "CAN: identificação, arbitragem e ACK",
      704,
      160,
      "<rect x=\"20\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"91.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ID</text><text x=\"91.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">prioridade</text><rect x=\"194\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"265.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Arbitragem</text><text x=\"265.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">bit a bit</text><path d=\"M162 63 L194 63\"/><path d=\"M194 63 L185.0 67.0 L185.0 59.0 Z\" fill=\"#C\"/><rect x=\"368\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"439.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Dados</text><text x=\"439.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">+ CRC</text><path d=\"M336 63 L368 63\"/><path d=\"M368 63 L359.0 67.0 L359.0 59.0 Z\" fill=\"#C\"/><rect x=\"542\" y=\"30\" width=\"142\" height=\"66\" rx=\"4\"/><text x=\"613.0\" y=\"52.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ACK</text><text x=\"613.0\" y=\"74.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">recepção</text><path d=\"M510 63 L542 63\"/><path d=\"M542 63 L533.0 67.0 L533.0 59.0 Z\" fill=\"#C\"/><text x=\"352.0\" y=\"144\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">CAN clássico conceitual; dominante prevalece sobre recessivo</text>"
    ],
    [
      "em-sleep-wakeup",
      "Energia: estados ativo, sleep e wake-up",
      550,
      190,
      "<rect x=\"20\" y=\"40\" width=\"150\" height=\"70\" rx=\"4\"/><text x=\"95.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ATIVO</text><text x=\"95.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">mede / envia</text><rect x=\"350\" y=\"40\" width=\"150\" height=\"70\" rx=\"4\"/><text x=\"425.0\" y=\"64.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">SLEEP</text><text x=\"425.0\" y=\"86.0\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">baixo consumo</text><path d=\"M170 62 L350 62\"/><path d=\"M350 62 L341.0 66.0 L341.0 58.0 Z\" fill=\"#C\"/><text x=\"260\" y=\"30\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Trabalho concluído</text><path d=\"M350 92 L170 92\"/><path d=\"M170 92 L179.0 88.0 L179.0 96.0 Z\" fill=\"#C\"/><text x=\"260\" y=\"135\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Timer / GPIO de wake-up</text><text x=\"275.0\" y=\"174\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Periféricos e fontes de wake-up dependem do MCU</text>"
    ]
  ]
];
// AMPLIACAO-B-FIM

export default {
  id: 'embarcados', nome: 'Sistemas embarcados',
  destaques: [
    'em-uno', 'em-esp32', 'em-protoboard', 'em-jumper', 'em-resistor', 'em-led5', 'em-botao',
    'em-potenciometro', 'em-dht', 'em-hcsr04', 'em-ldr', 'em-solo', 'em-servo', 'em-rele1',
    'em-lcd16x2', 'em-buzzer',
  ],
  secoes: [
    ["Programação — estados, interrupções e concorrência", AMPLIACAO_B[0]],
    ["Temporização, watchdog e inicialização", AMPLIACAO_B[1]],
    ["ADC, PWM e aquisição", AMPLIACAO_B[2]],
    ["Protocolos, comunicação e energia", AMPLIACAO_B[3]],
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
      ["em-bluepill", "STM32 \"Blue Pill\" (vista ilustrativa)", 380, 220, "<rect x=\"20\" y=\"20\" width=\"330\" height=\"145\" rx=\"8\"/><rect x=\"25\" y=\"65\" width=\"35\" height=\"35\" rx=\"3\"/><rect x=\"130\" y=\"75\" width=\"50\" height=\"50\" rx=\"2\"/><text x=\"260\" y=\"62\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">STM32F103</text><text x=\"260\" y=\"105\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Blue Pill</text><circle cx=\"45\" cy=\"35\" r=\"3\"/><circle cx=\"45\" cy=\"150\" r=\"3\"/><circle cx=\"60\" cy=\"35\" r=\"3\"/><circle cx=\"60\" cy=\"150\" r=\"3\"/><circle cx=\"75\" cy=\"35\" r=\"3\"/><circle cx=\"75\" cy=\"150\" r=\"3\"/><circle cx=\"90\" cy=\"35\" r=\"3\"/><circle cx=\"90\" cy=\"150\" r=\"3\"/><circle cx=\"105\" cy=\"35\" r=\"3\"/><circle cx=\"105\" cy=\"150\" r=\"3\"/><circle cx=\"120\" cy=\"35\" r=\"3\"/><circle cx=\"120\" cy=\"150\" r=\"3\"/><circle cx=\"135\" cy=\"35\" r=\"3\"/><circle cx=\"135\" cy=\"150\" r=\"3\"/><circle cx=\"150\" cy=\"35\" r=\"3\"/><circle cx=\"150\" cy=\"150\" r=\"3\"/><circle cx=\"165\" cy=\"35\" r=\"3\"/><circle cx=\"165\" cy=\"150\" r=\"3\"/><circle cx=\"180\" cy=\"35\" r=\"3\"/><circle cx=\"180\" cy=\"150\" r=\"3\"/><circle cx=\"195\" cy=\"35\" r=\"3\"/><circle cx=\"195\" cy=\"150\" r=\"3\"/><circle cx=\"210\" cy=\"35\" r=\"3\"/><circle cx=\"210\" cy=\"150\" r=\"3\"/><circle cx=\"225\" cy=\"35\" r=\"3\"/><circle cx=\"225\" cy=\"150\" r=\"3\"/><circle cx=\"240\" cy=\"35\" r=\"3\"/><circle cx=\"240\" cy=\"150\" r=\"3\"/><circle cx=\"255\" cy=\"35\" r=\"3\"/><circle cx=\"255\" cy=\"150\" r=\"3\"/><circle cx=\"270\" cy=\"35\" r=\"3\"/><circle cx=\"270\" cy=\"150\" r=\"3\"/><circle cx=\"285\" cy=\"35\" r=\"3\"/><circle cx=\"285\" cy=\"150\" r=\"3\"/><circle cx=\"300\" cy=\"35\" r=\"3\"/><circle cx=\"300\" cy=\"150\" r=\"3\"/><circle cx=\"315\" cy=\"35\" r=\"3\"/><circle cx=\"315\" cy=\"150\" r=\"3\"/><circle cx=\"330\" cy=\"35\" r=\"3\"/><circle cx=\"330\" cy=\"150\" r=\"3\"/><text x=\"190.0\" y=\"204\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Vista ilustrativa • sem pinagem funcional</text>"],
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
    ['Sensores ambientais (água, ar, solo)', [
      ['em-tds', 'Sensor de TDS (condutividade)', 210, 140, sondaPlaca('TDS', '<path d="M25,94 V124 M41,94 V124" stroke-width="3"/>')],
      ['em-od', 'Sensor de oxigênio dissolvido', 210, 140, sondaPlaca('OD', '<path d="M16,94 H50 L46,122 H20 Z"/><path d="M22,126 H44" stroke-width="3.5"/>')],
      ['em-co2', 'Sensor de CO₂ (NDIR)', 150, 120, placa(6, 6, 138, 86, 4)
        + '<rect x="20" y="18" width="110" height="40" rx="20"/><circle cx="40" cy="38" r="8" stroke-width="1.8"/>'
        + '<rect x="106" y="30" width="12" height="16" rx="1" stroke-width="1.8"/><path d="M50,38 H104" stroke-width="1.4" stroke-dasharray="5 4"/>'
        + R(75, 76, 'CO₂ (NDIR)') + pernas([55, 75, 95], 92, 116)],
      ['em-pm', 'Sensor de partículas (PM2,5)', 160, 120, placa(6, 6, 148, 90, 4)
        + '<circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="8" stroke-width="1.6"/>'
        + [0, 1, 2, 3, 4].map(k => pa(k, 5, 50, 50, '<path d="M50,42 C60,34 68,28 74,24" stroke-width="1.8"/>')).join('')
        + R(118, 30, 'PM2,5', 15) + seta(96, 60, 142, 60) + R(118, 78, 'ar') + pernas([60, 80, 100], 96, 116)],
      ['em-som', 'Sensor de som (microfone)', 130, 110, placa(6, 6, 118, 78, 4)
        + '<circle cx="40" cy="44" r="22"/><circle cx="40" cy="44" r="15" stroke-width="1.2"/><path d="M30,38 H50 M27,44 H53 M30,50 H50" stroke-width="1.2"/>'
        + '<rect x="76" y="18" width="30" height="26" rx="2" stroke-width="1.6"/><circle cx="91" cy="31" r="8" stroke-width="1.4"/><path d="M86,31 H96 M91,26 V36" stroke-width="1.4"/>'
        + R(91, 64, 'SOM') + pernas([45, 65, 85], 84, 106)],
      ['em-anemometro', 'Anemômetro de conchas', 160, 170, '<path d="M80,68 V164 M58,166 H102"/><circle cx="80" cy="62" r="6"/>'
        + '<path d="M74,62 H34 M86,62 H126 M80,56 V41"/>'
        + '<path d="M34,48 A14,14 0 0 0 34,76 Z M126,48 A14,14 0 0 1 126,76 Z"/><circle cx="80" cy="30" r="11"/><circle cx="80" cy="30" r="5" stroke-width="1.4"/>'
        + '<path d="M50,92 Q80,106 110,92" stroke-width="1.8"/>' + head(110, 92, -25, 10)],
      ['em-biruta', 'Sensor de direção do vento', 170, 160, '<path d="M85,56 V152 M63,154 H107 M22,50 H150"/><circle cx="85" cy="50" r="5" fill="#C"/>'
        + head(8, 50, 180, 16) + '<path d="M128,50 L150,24 H164 V76 H150 Z"/>'],
      ['em-pluviometro', 'Pluviômetro de báscula', 140, 180, '<path d="M16,10 H124 L78,56 V66 H62 V56 Z"/><path d="M20,14 V172 H120 V14"/>'
        + '<path d="M38,98 L70,122 L102,98 M70,122 V92" stroke-width="2.2"/><path d="M70,122 L62,136 H78 Z"/>'
        + ponto(70, 74, 2.5) + ponto(70, 84, 2.5) + R(70, 156, 'mm')],
      ['em-boia', 'Chave de nível (boia)', 130, 150, '<path d="M58,4 V18 M72,4 V18" stroke-width="2"/>'
        + '<rect x="54" y="18" width="22" height="14"/><path d="M54,23 H76 M54,27 H76" stroke-width="1.2"/><rect x="44" y="32" width="42" height="12" rx="2"/>'
        + '<path d="M65,44 V136 M56,138 H74" stroke-width="3"/><rect x="46" y="80" width="38" height="32" rx="8"/>'
        + '<path d="M8,100 H44 M86,100 H122" stroke-width="1.6" stroke-dasharray="7 5"/>' + seta2(106, 72, 106, 124)],
      ['em-pressao', 'Transdutor de pressão (nível)', 100, 170, '<path d="M50,4 V28" stroke-width="3"/><rect x="36" y="28" width="28" height="10" rx="2"/>'
        + '<rect x="30" y="38" width="40" height="80" rx="6"/>' + R(50, 78, 'P', 18)
        + '<rect x="22" y="118" width="56" height="16"/><path d="M36,118 V134 M64,118 V134" stroke-width="1.4"/>'
        + '<rect x="38" y="134" width="24" height="28"/><path d="M38,140 H62 M38,146 H62 M38,152 H62" stroke-width="1.2"/>'],
      ['em-solo-cap', 'Sensor capacitivo de solo', 90, 200, '<path d="M36,4 V14 M45,4 V14 M54,4 V14" stroke-width="2"/>'
        + '<path d="M14,14 H76 V150 L45,194 L14,150 Z"/><rect x="26" y="20" width="38" height="14" rx="1" stroke-width="1.4"/>'
        + '<rect x="30" y="42" width="30" height="22" rx="1.5" stroke-width="1.8"/>' + R(45, 82, 'SOLO')
        + '<path d="M14,104 H76" stroke-width="1.4" stroke-dasharray="5 4"/><path d="M24,118 H66 V146 L45,178 L24,146 Z" stroke-width="1.4"/>'],
      ['em-celula-carga', 'Célula de carga com HX711', 230, 110, '<rect x="8" y="40" width="120" height="30" rx="2"/>'
        + '<circle cx="54" cy="55" r="9" stroke-width="1.6"/><circle cx="82" cy="55" r="9" stroke-width="1.6"/><path d="M54,49 H82 M54,61 H82" stroke-width="1.6"/>'
        + '<circle cx="20" cy="55" r="4" stroke-width="1.4"/><circle cx="116" cy="55" r="4" stroke-width="1.4"/>'
        + seta(30, 6, 30, 38) + R(16, 16, 'F', 16)
        + '<path d="M128,48 C140,48 140,36 150,36 M128,62 C140,62 140,74 150,74" stroke-width="1.8"/>'
        + placa(150, 20, 74, 70, 4) + R(187, 40, 'HX711') + '<rect x="170" y="56" width="34" height="18" rx="1.5" stroke-width="1.8"/>'
        + pernas([170, 187, 204], 90, 106)],
      ['em-estacao', 'Estação meteorológica', 200, 230, '<path d="M100,58 V150 M100,190 V222 M70,224 H130"/><path d="M36,58 H164" stroke-width="2.4"/>'
        + '<path d="M40,58 V36 M36,32 H18 M44,32 H62 M40,28 V20"/><circle cx="40" cy="32" r="4"/><circle cx="40" cy="14" r="6"/>'
        + '<path d="M18,24 A8,8 0 0 0 18,40 Z M62,24 A8,8 0 0 1 62,40 Z"/>'
        + '<path d="M160,58 V44 M138,40 H182"/><circle cx="160" cy="40" r="3.5" fill="#C"/>' + head(130, 40, 180, 12) + '<path d="M174,40 L186,26 H194 V54 H186 Z"/>'
        + '<path d="M108,94 H158 L150,124 H104 Z"/><path d="M133,94 L127,124" stroke-width="1.4"/><path d="M100,108 H106"/>'
        + bloco(76, 150, 48, 40, 'MCU')],
    ]],
    ['Entradas e displays', [
      ['em-teclado', 'Teclado matricial 4×4', 150, 190, '<rect x="8" y="8" width="134" height="150" rx="6"/>'
        + ['123A', '456B', '789C', '*0#D'].map((lin, r) => lin.split('').map((c, k) => `<rect x="${18 + k * 31}" y="${18 + r * 34}" width="25" height="28" rx="3" stroke-width="1.8"/>` + R(30.5 + k * 31, 32 + r * 34, c)).join('')).join('')
        + '<rect x="40" y="158" width="70" height="14" stroke-width="1.4"/>' + pernas([44, 53, 62, 71, 80, 89, 98, 107], 172, 186)],
      ['em-encoder', 'Encoder rotativo', 120, 150, placa(8, 44, 104, 72, 4) + '<rect x="30" y="52" width="60" height="56" rx="3"/>'
        + '<circle cx="60" cy="80" r="20"/><circle cx="60" cy="80" r="8" stroke-width="1.6"/><path d="M54,76 H66" stroke-width="1.6"/>'
        + '<path d="M26.3,51.7 A44,44 0 0 1 93.7,51.7" stroke-width="2"/>' + head(93.7, 51.7, 50, 9) + pernas([36, 48, 60, 72, 84], 116, 146)],
      ['em-joystick', 'Joystick analógico', 140, 156, placa(8, 8, 124, 116, 4) + '<rect x="30" y="20" width="80" height="80" rx="4"/>'
        + '<circle cx="70" cy="60" r="26"/><circle cx="70" cy="60" r="10" stroke-width="1.6"/>' + R(121, 60, 'X') + R(70, 112, 'Y')
        + pernas([46, 58, 70, 82, 94], 124, 152)],
      ['em-tft', 'Display TFT colorido', 200, 150, placa(8, 8, 184, 110, 4) + '<rect x="22" y="18" width="130" height="90" rx="2"/>'
        + R(87, 38, 'TFT', 18) + '<circle cx="52" cy="80" r="12" stroke-width="1.8"/><rect x="76" y="70" width="24" height="22" stroke-width="1.8"/><path d="M112,92 L126,68 L140,92 Z" stroke-width="1.8"/>'
        + '<rect x="162" y="30" width="22" height="40" rx="2" stroke-width="1.4"/>' + pernas([40, 60, 80, 100, 120, 140, 160], 118, 146)],
      ['em-anel-led', 'Anel de LEDs endereçáveis', 150, 150, '<circle cx="75" cy="68" r="62"/><circle cx="75" cy="68" r="38"/>'
        + Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6, x = f1(75 + 50 * Math.cos(a) - 5), y = f1(68 + 50 * Math.sin(a) - 5); return `<rect x="${x}" y="${y}" width="10" height="10" rx="1" stroke-width="1.6"/>`; }).join('')
        + pernas([63, 75, 87], 129, 146)],
      ['em-fita-led', 'Fita de LED', 240, 70, '<rect x="24" y="16" width="212" height="38" rx="2"/>'
        + [40, 86, 132, 178].map(x => `<rect x="${x}" y="25" width="20" height="20" rx="2" stroke-width="1.8"/><circle cx="${x + 10}" cy="35" r="5" stroke-width="1.4"/>`).join('')
        + '<path d="M218,10 V60" stroke-width="1.4" stroke-dasharray="4 3"/><path d="M4,24 H24 M4,35 H24 M4,46 H24" stroke-width="2"/>' + head(78, 35, 0, 8) + head(124, 35, 0, 8) + head(170, 35, 0, 8)],
    ]],
    ['Atuadores e potência', [
      ['em-ventoinha', 'Ventoinha (cooler)', 130, 130, '<rect x="8" y="8" width="114" height="114" rx="10"/><circle cx="65" cy="65" r="48"/><circle cx="65" cy="65" r="14"/>'
        + [0, 1, 2, 3, 4].map(k => pa(k, 5, 65, 65, '<path d="M65,51 C78,36 94,34 104,44 C92,46 80,52 76,58" stroke-width="1.8"/>')).join('')
        + '<circle cx="20" cy="20" r="4" stroke-width="1.4"/><circle cx="110" cy="20" r="4" stroke-width="1.4"/><circle cx="20" cy="110" r="4" stroke-width="1.4"/><circle cx="110" cy="110" r="4" stroke-width="1.4"/>'],
      ['em-mosfet', 'Módulo MOSFET (chave de potência)', 170, 110, placa(8, 8, 154, 82, 4)
        + '<rect x="66" y="14" width="38" height="14" rx="2"/><circle cx="85" cy="21" r="4" stroke-width="1.4"/><rect x="66" y="28" width="38" height="34" rx="2"/>'
        + '<path d="M74,62 V72 M85,62 V72 M96,62 V72" stroke-width="2"/>'
        + borne(26, 30, 2, 20, true) + R(46, 30, '+') + R(46, 50, '−') + R(32, 76, 'carga') + R(130, 30, 'PWM') + pernas([110, 130, 150], 90, 106)],
      ['em-ssr', 'Relé de estado sólido (SSR)', 160, 130, '<rect x="20" y="10" width="120" height="110" rx="4"/>'
        + [[46, 30], [114, 30], [46, 100], [114, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/><path d="M${x - 5},${y + 5} L${x + 5},${y - 5}" stroke-width="1.4"/>`).join('')
        + R(80, 65, 'SSR', 20) + R(80, 30, '~', 20) + R(64, 100, '+') + R(96, 100, '−')
        + '<path d="M4,30 H37 M123,30 H156 M4,100 H37 M123,100 H156" stroke-width="2"/>'],
      ['em-ponte-h', 'Ponte H (esquema)', 220, 176, '<path d="M32,20 H188 M32,152 H188"/>' + R(16, 20, '+V') + R(16, 152, '0 V')
        + [[40, 26], [180, 194]].map(([x, xb]) => `<path d="M${x},20 V38 M${x},66 V106 M${x},134 V152 M${x},66 L${xb},42 M${x},134 L${xb},110"/>`
          + ponto(x, 38) + ponto(x, 66) + ponto(x, 106) + ponto(x, 134) + ponto(x, 86, 3.5)).join('')
        + '<path d="M40,86 H88 M132,86 H180"/>' + estado(110, 86, 22, 'M', 18)
        + R(64, 50, 'S1') + R(156, 50, 'S2') + R(64, 122, 'S3') + R(156, 122, 'S4')],
      ['em-motorredutor', 'Motorredutor com roda', 200, 124, '<rect x="20" y="40" width="76" height="44" rx="8"/>' + R(56, 62, 'M', 18)
        + '<path d="M4,52 H20 M4,72 H20" stroke-width="2"/><rect x="96" y="30" width="46" height="64" rx="3"/>'
        + ponto(104, 38, 2) + ponto(134, 38, 2) + ponto(104, 86, 2) + ponto(134, 86, 2)
        + '<path d="M142,62 H154" stroke-width="4"/><rect x="154" y="6" width="38" height="112" rx="10"/>'
        + '<path d="M154,20 H192 M154,34 H192 M154,48 H192 M154,62 H192 M154,76 H192 M154,90 H192 M154,104 H192" stroke-width="1.4"/>'],
    ]],
    ['Alimentação', [
      ['em-buck', 'Conversor CC-CC abaixador (buck)', 190, 100, conversor('ABAIXADOR')],
      ['em-boost', 'Conversor CC-CC elevador (boost)', 190, 100, conversor('ELEVADOR')],
      ['em-fonte-chaveada', 'Fonte chaveada (CA → CC)', 210, 110, '<rect x="30" y="10" width="150" height="90" rx="4"/>'
        + '<path d="M44,24 H74 M44,34 H74 M44,44 H74 M44,54 H74 M44,64 H74 M44,74 H74 M44,84 H74" stroke-width="1.4"/>'
        + R(128, 40, 'FONTE', 16) + R(128, 68, '12 V', 16)
        + '<path d="M4,40 H30 M4,70 H30 M180,40 H206 M180,70 H206" stroke-width="2"/>' + R(16, 55, '~', 18) + R(194, 26, '+') + R(194, 84, '−')],
      ['em-carregador-li', 'Carregador de bateria Li-ion', 160, 100, placa(24, 10, 112, 80, 4)
        + '<rect x="8" y="36" width="26" height="28" rx="3"/><rect x="12" y="44" width="14" height="12" stroke-width="1.2"/>'
        + '<circle cx="58" cy="24" r="4" stroke-width="1.4"/><circle cx="76" cy="24" r="4" stroke-width="1.4"/><rect x="52" y="38" width="32" height="20" rx="1.5" stroke-width="1.8"/>'
        + R(76, 76, 'Li-ion 1S') + '<path d="M136,30 H156 M136,70 H156" stroke-width="2"/>' + R(118, 30, 'B+') + R(118, 70, 'B−')],
      ['em-18650', 'Célula 18650 (Li-ion)', 220, 70, '<rect x="20" y="14" width="176" height="42" rx="6"/><rect x="196" y="24" width="10" height="22" rx="2"/>'
        + '<path d="M44,14 V56" stroke-width="1.6"/><path d="M4,35 H20 M206,35 H216" stroke-width="2"/>' + R(116, 35, '3,7 V', 16) + R(182, 35, '+', 16) + R(32, 35, '−', 16)],
      ['em-divisor', 'Divisor de tensão', 150, 190, '<circle cx="50" cy="12" r="4"/>' + zig(50, 16, 92) + zig(50, 92, 160) + ponto(50, 92, 3.5)
        + '<path d="M50,92 H130 M50,160 V168 M34,168 H66 M40,174 H60 M46,180 H54"/><circle cx="134" cy="92" r="4"/>'
        + R(80, 12, 'Vin') + R(82, 54, 'R1') + R(82, 126, 'R2') + R(124, 74, 'Vout')],
      ['em-pullup', 'Botão com resistor de pull-up', 160, 190, '<path d="M34,10 H66"/>' + R(90, 10, 'VCC') + zig(50, 10, 86) + R(88, 48, '10 kΩ')
        + ponto(50, 86, 3.5) + '<path d="M50,86 H132 M50,86 V112 M50,148 V164 M34,164 H66 M40,170 H60 M46,176 H54"/><circle cx="136" cy="86" r="4"/>' + R(130, 70, 'pino')
        + ponto(50, 114) + ponto(50, 146) + '<path d="M38,108 V152 M38,130 H24 M24,122 V138" stroke-width="2.2"/>' + R(84, 130, 'botão')],
    ]],
    ['Barramentos e sinais', [
      ['em-i2c', 'Barramento I2C', 260, 150, R(22, 16, 'VCC') + '<path d="M44,16 H92 M72,16 V22 M72,40 V56 M92,16 V22 M92,40 V72"/>'
        + '<rect x="67" y="22" width="10" height="18" stroke-width="1.8"/><rect x="87" y="22" width="10" height="18" stroke-width="1.8"/>'
        + '<path d="M40,56 H252 M40,72 H252"/>' + R(20, 56, 'SDA') + R(20, 72, 'SCL')
        + bloco(40, 104, 64, 40, 'MCU') + bloco(122, 104, 60, 40, 'Sensor') + bloco(192, 104, 60, 40, 'Tela')
        + '<path d="M58,104 V56 M86,104 V72 M140,104 V56 M164,104 V72 M210,104 V56 M234,104 V72" stroke-width="2"/>'
        + [[72, 56], [92, 72], [58, 56], [86, 72], [140, 56], [164, 72], [210, 56], [234, 72]].map(([x, y]) => ponto(x, y)).join('')],
      ['em-spi', 'Barramento SPI', 260, 150, bloco(6, 20, 66, 116, 'MCU') + bloco(188, 20, 66, 116, 'Escravo')
        + seta(72, 44, 188, 44) + seta(72, 72, 188, 72) + seta(188, 100, 72, 100) + seta(72, 128, 188, 128)
        + R(130, 32, 'SCK') + R(130, 60, 'MOSI') + R(130, 88, 'MISO') + R(130, 116, 'CS')],
      ['em-uart', 'Comunicação serial (UART)', 240, 130, '<rect x="6" y="10" width="72" height="110" rx="4"/><rect x="162" y="10" width="72" height="110" rx="4"/>'
        + R(42, 26, 'MCU') + R(198, 26, 'Módulo') + R(60, 52, 'TX') + R(60, 80, 'RX') + R(52, 104, 'GND') + R(180, 52, 'TX') + R(180, 80, 'RX') + R(188, 104, 'GND')
        + seta(78, 52, 162, 80) + seta(162, 52, 78, 80) + '<path d="M78,104 H162" stroke-width="2.2"/>'],
      ['em-quadro-uart', 'Quadro serial (start, dados, stop)', 260, 110, quadro()
        + '<path d="M52,74 V78 H228 V74" stroke-width="1.4"/>' + R(41, 92, 'start') + R(140, 92, 'dados (8 bits)') + R(239, 92, 'stop')],
      ['em-pwm', 'Sinal PWM (ciclo de trabalho)', 240, 130, '<path d="M8,90 H20 V40 H48 V90 H90 V40 H118 V90 H160 V40 H188 V90 H230" stroke-width="2.4"/>'
        + '<path d="M20,40 V20 M48,40 V20 M20,90 V112 M90,90 V112" stroke-width="1" stroke-dasharray="2 3"/>'
        + seta2(20, 26, 48, 26, 7, 1.6) + seta2(20, 106, 90, 106, 7, 1.6) + R(34, 12, 'ton') + R(55, 120, 'T') + R(186, 16, 'D = ton / T')],
      ['em-adc', 'Conversor A/D (ADC)', 220, 110, '<path d="M8,55 C18,25 30,25 40,55 S62,85 72,55" stroke-width="2.2"/>' + seta(74, 55, 92, 55, 8)
        + bloco(92, 25, 56, 60, 'A/D', 16) + seta(148, 55, 168, 55, 8) + R(194, 55, '1011', 16)],
      ['em-amostragem', 'Amostragem de sinal', 230, 130, '<path d="M20,120 V14 M20,70 H218" stroke-width="2"/>' + head(20, 10, -90, 9) + head(224, 70, 0, 9)
        + amostras() + R(214, 88, 't') + R(42, 12, 'x(t)')],
      ['em-blocos', 'Diagrama de blocos (sensor, MCU, atuador)', 260, 90, bloco(6, 25, 66, 40, 'Sensor') + bloco(98, 25, 64, 40, 'MCU') + bloco(188, 25, 66, 40, 'Atuador')
        + seta(72, 45, 98, 45, 8) + seta(162, 45, 188, 45, 8)],
      ['em-mcu-blocos', 'Microcontrolador (blocos internos)', 220, 170, '<rect x="8" y="8" width="204" height="154" rx="6"/>' + R(110, 24, 'MCU', 16)
        + bloco(20, 40, 58, 40, 'CPU') + bloco(81, 40, 58, 40, 'RAM') + bloco(142, 40, 58, 40, 'Flash')
        + bloco(20, 104, 58, 40, 'E/S') + bloco(81, 104, 58, 40, 'ADC') + bloco(142, 104, 58, 40, 'Timer')
        + '<path d="M20,92 H200" stroke-width="4"/><path d="M49,80 V104 M110,80 V104 M171,80 V104" stroke-width="2"/>'],
    ]],
    ['Máquinas de estado e firmware', [
      ['em-estado', 'Estado', 90, 90, estado(45, 45, 38, 'S0', 16)],
      ['em-estado-ini', 'Estado inicial', 150, 90, '<circle cx="14" cy="45" r="8" fill="#C"/>' + seta(22, 45, 70, 45) + estado(108, 45, 38, 'S0', 16)],
      ['em-estado-final', 'Estado final', 90, 90, '<circle cx="45" cy="45" r="32"/>' + estado(45, 45, 40, 'Sf', 16)],
      ['em-transicao', 'Transição (evento / ação)', 200, 80, '<path d="M10,66 Q100,-6 190,66" stroke-width="2.2"/>' + head(190, 66, 39, 11) + R(100, 58, 'evento / ação')],
      ['em-autolaco', 'Autotransição (laço)', 110, 130, estado(55, 90, 36, 'S1', 16) + '<path d="M40,57 C24,8 86,8 70,57" stroke-width="2.2"/>' + head(70, 57, 110, 10)],
      ['em-mef-liga', 'Máquina de estados: liga/desliga', 260, 140, estado(60, 72, 40, 'DESL') + estado(200, 72, 40, 'LIGA')
        + '<path d="M90,46 Q130,24 170,46 M170,98 Q130,120 90,98" stroke-width="2.2"/>' + head(170, 46, 29, 10) + head(90, 98, 209, 10)
        + R(130, 16, 'botão') + R(130, 128, 'tempo')],
      ['em-mef-semaforo', 'Máquina de estados: semáforo', 260, 200, estado(60, 56, 40, 'Verde') + estado(200, 56, 40, 'Amarelo') + estado(130, 152, 40, 'Vermelho')
        + seta(100, 56, 160, 56, 10) + seta(176.4, 88.3, 153.6, 119.7, 10) + seta(106.4, 119.7, 83.6, 88.3, 10)
        + R(130, 42, '5 s') + R(182, 114, '2 s') + R(78, 114, '5 s')],
      ['em-loop', 'Firmware: setup() e loop()', 160, 184, '<rect x="30" y="6" width="100" height="30" rx="15"/>' + R(80, 21, 'início')
        + seta(80, 36, 80, 58) + bloco(30, 58, 100, 34, 'setup()') + seta(80, 92, 80, 120) + bloco(30, 120, 100, 34, 'loop()')
        + '<path d="M80,154 V174 H146 V106 H84" stroke-width="2.2"/>' + head(82, 106, 180, 9) + ponto(80, 106)],
      ['em-isr', 'Interrupção (ISR)', 240, 140, '<path d="M10,60 H100 M160,60 H226" stroke-width="2.4"/>' + head(232, 60, 0, 10)
        + '<path d="M100,60 H160" stroke-width="1.6" stroke-dasharray="6 4"/>' + R(46, 44, 'loop()')
        + seta(100, 60, 100, 94) + bloco(88, 94, 84, 36, 'ISR()') + seta(160, 94, 160, 62)
        + '<path d="M114,6 L104,24 H116 L106,42" stroke-width="2"/>' + head(104, 52, 100, 9) + R(150, 24, 'evento')],
    ]],
    ['IoT e redes', [
      ['em-mqtt', 'MQTT (publica / assina)', 260, 150, bloco(6, 56, 60, 40, 'Sensor') + '<rect x="100" y="50" width="60" height="52" rx="4"/>'
        + R(130, 66, 'Broker') + R(130, 88, 'tópico') + bloco(196, 10, 58, 40, 'App') + bloco(196, 104, 58, 40, 'Painel')
        + seta(66, 76, 100, 76, 8) + seta(160, 62, 196, 34, 8) + seta(160, 90, 196, 118, 8) + R(83, 62, 'pub') + R(184, 76, 'sub')],
      ['em-gateway', 'Gateway IoT', 150, 120, '<rect x="14" y="64" width="122" height="48" rx="6"/>' + R(75, 84, 'Gateway')
        + '<path d="M36,64 V18 M114,64 V18" stroke-width="4"/>'
        + '<path d="M29.1,14 A8,8 0 0 1 42.9,14 M23.9,11 A14,14 0 0 1 48.1,11 M107.1,14 A8,8 0 0 1 120.9,14 M101.9,11 A14,14 0 0 1 126.1,11" stroke-width="1.8"/>'
        + ponto(56, 102, 2.5) + ponto(68, 102, 2.5) + ponto(80, 102, 2.5) + ponto(92, 102, 2.5)],
      ['em-dashboard', 'Painel de monitoramento', 220, 150, '<rect x="8" y="8" width="204" height="122" rx="4"/><path d="M100,130 V142 M120,130 V142 M80,146 H140"/>'
        + '<path d="M24,90 A36,36 0 0 1 96,90" stroke-width="2.4"/><path d="M60,90 L80,66" stroke-width="2.4"/>' + ponto(60, 90, 4) + R(60, 110, '25 °C')
        + '<path d="M118,30 V100 H200" stroke-width="1.4"/><path d="M122,86 L140,70 L156,78 L172,52 L196,44" stroke-width="2"/>' + R(160, 116, 'pH 7,0')],
      ['em-iot-camadas', 'Arquitetura IoT (camadas)', 240, 206, bloco(10, 8, 190, 40, 'Aplicação', 15) + bloco(10, 58, 190, 40, 'Nuvem', 15)
        + bloco(10, 108, 190, 40, 'Rede', 15) + bloco(10, 158, 190, 40, 'Dispositivos', 15) + seta2(222, 12, 222, 196, 10, 2.2)],
      ['em-no-sensor', 'Nó sensor sem fio', 230, 110, bloco(4, 26, 62, 38, 'Sensor') + bloco(84, 26, 62, 38, 'MCU') + bloco(164, 26, 62, 38, 'Rádio')
        + seta(66, 45, 84, 45, 8) + seta(146, 45, 164, 45, 8) + '<path d="M210,26 V10 M202,4 L210,12 L218,4" stroke-width="2"/>'
        + bloco(84, 76, 62, 28, 'Bateria') + '<path d="M115,76 V64" stroke-width="2"/>'],
      ['em-estrela', 'Topologia em estrela', 160, 140, (() => {
        const nos = [[80, 75], [80, 17], [135.2, 57.1], [114.1, 121.9], [45.9, 121.9], [24.8, 57.1]]; nos.centro = 18;
        return rede(nos, [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]]) + estado(80, 75, 18, 'G') + nos.slice(1).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11"/>`).join('');
      })()],
      ['em-malha', 'Topologia em malha (mesh)', 170, 146, (() => {
        const nos = [[28, 38], [85, 18], [142, 38], [28, 108], [85, 128], [142, 108]];
        return rede(nos, [[0, 1], [1, 2], [0, 3], [2, 5], [3, 4], [4, 5], [1, 3], [1, 5], [0, 4], [2, 4]]) + nos.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11"/>`).join('');
      })()],
    ]],
  ],
};
