// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Tecnologia de Alimentos: fluxogramas, equipamentos, conservação, microbiologia, qualidade, análises e embalagens (desenhos próprios).
import { T, head } from './base.js';

// ===== utilidades locais (coordenadas calculadas aqui, nada copiado de outras bibliotecas) =====
const f1 = n => +n.toFixed(1);
const fino = (d, w = 1.6) => `<path d="${d}" stroke-width="${w}"/>`;
const tra = (d, w = 1.4, da = '5 4') => `<path d="${d}" stroke-width="${w}" stroke-dasharray="${da}"/>`;
const P = (d, ex = '') => `<path d="${d}"${ex}/>`;
const R = (x, y, w, h, rx = 0, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ''}${ex}/>`;
const C = (cx, cy, r, ex = '') => `<circle cx="${cx}" cy="${cy}" r="${r}"${ex}/>`;
const E = (cx, cy, rx, ry, ex = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${ex}/>`;
const CHEIO = ' fill="#C" stroke="none"';
const pto = (x, y, r = 3) => C(x, y, r, CHEIO);
const W = w => ` stroke-width="${w}"`;
const serie = (a, b, p, f) => { let s = ''; for (let v = a; v <= b + 1e-9; v += p) s += f(f1(v)); return s; };
// texto com âncora à escolha (o T de base.js é sempre centralizado)
const Tx = (x, y, s, size = 14, anc = 'start') => `<text x="${x}" y="${y}" font-size="${size}" font-family="Segoe UI, Arial, sans-serif" font-weight="600" text-anchor="${anc}" dominant-baseline="central" fill="#C" stroke="none">${s}</text>`;
// seta reta de (x1,y1) até a ponta em (x2,y2)
const seta = (x1, y1, x2, y2, L = 10, w = 2.5) => {
  const a = Math.atan2(y2 - y1, x2 - x1), k = L * 0.8;
  return `<path d="M${x1} ${y1} L${f1(x2 - k * Math.cos(a))} ${f1(y2 - k * Math.sin(a))}" stroke-width="${w}"/>` + head(x2, y2, f1(a * 180 / Math.PI), L);
};
const eixos = (ox, oy, x1, y1) => P(`M${ox} ${y1 + 8} V${oy} H${x1 - 8}`) + head(ox, y1, -90, 10) + head(x1, oy, 0, 10);
const floco = (cx, cy, r, w = 1.8) => fino([0, 60, 120].map(g => {
  const a = g * Math.PI / 180, dx = r * Math.cos(a), dy = r * Math.sin(a);
  return `M${f1(cx - dx)} ${f1(cy - dy)} L${f1(cx + dx)} ${f1(cy + dy)}`;
}).join(' '), w);

// ===== fluxograma: bloco de etapa (com tocos de ligação em cima e embaixo) =====
const bloco = txt => P('M85 3 V12') + R(8, 12, 154, 32, 6) + (txt ? T(85, 28, txt, txt.length > 13 ? 15 : 17) : '') + P('M85 44 V47') + head(85, 55, 90, 9);
const ETAPAS = [
  ['recepcao', 'Recepção'], ['selecao', 'Seleção'], ['lavagem', 'Lavagem'], ['sanitizacao', 'Sanitização'],
  ['descascamento', 'Descascamento'], ['corte', 'Corte'], ['branqueamento', 'Branqueamento'], ['despolpa', 'Despolpa'],
  ['formulacao', 'Formulação'], ['coccao', 'Cocção'], ['pasteurizacao', 'Pasteurização'], ['esterilizacao', 'Esterilização'],
  ['envase', 'Envase'], ['exaustao', 'Exaustão'], ['fechamento', 'Fechamento'], ['resfriamento', 'Resfriamento'],
  ['rotulagem', 'Rotulagem'], ['armazenamento', 'Armazenamento'],
].map(([s, t]) => [`ali-etapa-${s}`, `Etapa: ${t}`, 170, 58, bloco(t)]);

// fluxograma pronto em duas colunas: desce a 1ª, sobe por fora e desce a 2ª
const fluxo2 = passos => {
  const n = passos.length, rows = Math.ceil(n / 2), bw = 120, bh = 26, pitch = 40, y0 = 18, c1 = 66, c2 = 214;
  let s = '';
  passos.forEach((t, i) => {
    const col = i < rows ? 0 : 1, r = col ? i - rows : i, cx = col ? c2 : c1, y = y0 + r * pitch;
    s += R(cx - bw / 2, y, bw, bh, 5) + T(cx, y + bh / 2, t, 14);
    const ultimo = col ? i === n - 1 : r === rows - 1;
    if (!ultimo) s += seta(cx, y + bh, cx, y + pitch, 8, 1.8);
  });
  const yl = y0 + (rows - 1) * pitch + bh / 2;
  s += P(`M${c1 + bw / 2} ${yl} H140 V${y0 - 10} H${c2} V${y0 - 7}`, W(1.8)) + head(c2, y0, 90, 8);
  return s;
};
const FLX = [
  ['ali-flx-leite', 'Fluxograma: leite pasteurizado', ['Recepção', 'Análises', 'Filtração', 'Resfriamento', 'Padronização', 'Homogeneização', 'Pasteurização', 'Resfriamento', 'Envase', 'Estocagem 4 °C']],
  ['ali-flx-queijo', 'Fluxograma: queijo minas frescal', ['Recepção', 'Filtração', 'Pasteurização', 'Ajuste a 35 °C', 'Coagulação', 'Corte', 'Mexedura', 'Dessoragem', 'Enformagem', 'Salga', 'Embalagem', 'Refrigeração']],
  ['ali-flx-iogurte', 'Fluxograma: iogurte', ['Recepção', 'Padronização', 'Formulação', 'Homogeneização', 'Aquecer 90 °C', 'Resfriar 43 °C', 'Inoculação', 'Fermentação', 'Quebra do gel', 'Resfriamento', 'Envase', 'Estocagem 4 °C']],
  ['ali-flx-polpa', 'Fluxograma: polpa de fruta congelada', ['Recepção', 'Seleção', 'Lavagem', 'Sanitização', 'Corte', 'Despolpa', 'Refino', 'Pasteurização', 'Envase', 'Congelamento', 'Estocagem']],
  ['ali-flx-pao', 'Fluxograma: pão francês', ['Pesagem', 'Mistura', 'Sova', 'Divisão', 'Boleamento', 'Descanso', 'Modelagem', 'Fermentação', 'Pestana', 'Forneamento', 'Resfriamento', 'Expedição']],
  ['ali-flx-linguica', 'Fluxograma: linguiça frescal', ['Recepção', 'Toalete', 'Moagem', 'Pesagem', 'Mistura', 'Embutimento', 'Amarração', 'Embalagem', 'Estocagem 4 °C']],
  ['ali-flx-calda', 'Fluxograma: fruta em calda', ['Recepção', 'Seleção', 'Lavagem', 'Descascamento', 'Corte', 'Branqueamento', 'Enchimento', 'Adição de calda', 'Exaustão', 'Fechamento', 'Trat. térmico', 'Resfriamento']],
  ['ali-flx-cajuina', 'Fluxograma: cajuína', ['Recepção', 'Seleção', 'Lavagem', 'Prensagem', 'Clarificação', 'Filtração', 'Envase', 'Fechamento', 'Banho-maria', 'Resfriamento', 'Estocagem']],
].map(([id, nome, p]) => [id, nome, 280, Math.ceil(p.length / 2) * 40 + 8, fluxo2(p)]);
// fluxograma do pão em uma coluna só (sequência básica do técnico em Panificação)
const PAO7 = ['Mistura', 'Sova', 'Fermentação', 'Modelagem', 'Crescimento', 'Forneamento', 'Resfriamento'];
const FLX_PAO = ['ali-flx-pao-basico', 'Fluxograma: pão (básico)', 150, 7 * 34 + 2,
  PAO7.map((t, i) => { const y = 4 + i * 34; return R(15, y, 120, 24, 5) + T(75, y + 12, t, 14) + (i < 6 ? seta(75, y + 24, 75, y + 34, 7, 1.8) : ''); }).join('')];
// rede de glúten: fios ondulados ligando nós, com bolhas de gás presas
const GN = [[20, 30], [70, 18], [130, 26], [168, 52], [24, 84], [86, 70], [150, 100], [50, 122], [118, 128], [172, 120]];
const GL = [[0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 5], [3, 6], [4, 5], [5, 6], [4, 7], [5, 7], [5, 8], [6, 8], [6, 9], [7, 8], [8, 9]];
const gluten = () => GL.map(([a, b], k) => {
  const [x1, y1] = GN[a], [x2, y2] = GN[b], mx = (x1 + x2) / 2, my = (y1 + y2) / 2, o = k % 2 ? 7 : -7;
  return fino(`M${x1} ${y1} Q${f1(mx + o)} ${f1(my - o)} ${x2} ${y2}`, 1.8);
}).join('') + GN.map(([x, y]) => pto(x, y, 2.5)).join('');

// ===== equipamentos: peças repetidas =====
const garrafa = x => P(`M${x - 12} 158 V128 Q${x - 12} 120 ${x - 5} 116 V104 H${x + 5} V116 Q${x + 12} 120 ${x + 12} 128 V158 Z`) + tra(`M${x - 8} 136 H${x + 8}`, 1.2, '3 3');
const latas = bx => serie(0, 2, 1, r => serie(0, 3, 1, c => C(bx + 12 + c * 16, 56 + r * 19, 6, W(1.4))));
const linguicas = y => serie(92, 164, 18, x => fino(`M${x} ${y} V${y + 4}`, 1.4) + R(x - 5, y + 4, 10, 32, 5, W(1.8)));

// ===== gráficos de conservação =====
// reta em escala log com um ciclo marcado (valor D ou valor z)
const curvaLog = (ylab, xlab, sym, y1, y2) => eixos(40, 150, 222, 10) + P('M44 30 L210 140')
  + tra('M40 60 H89.3 V150 M40 90 H134.5 V150', 1.3) + P('M97 160 H127', W(1.6)) + head(89.3, 160, 180, 8) + head(134.5, 160, 0, 8)
  + T(112, 174, sym, 16) + T(22, 60, y1, 14) + T(22, 90, y2, 14) + Tx(50, 14, ylab) + T(196, 168, xlab, 14);

// ===== microbiologia =====
const tubo = x => P(`M${x - 10} 22 V88 A10 10 0 0 0 ${x + 10} 88 V22`) + tra(`M${x - 10} 52 H${x + 10}`, 1.2, '3 3');
const placa = (x, pts) => E(x, 142, 24, 8) + P(`M${x - 24} 142 V150 A24 8 0 0 0 ${x + 24} 150 V142`) + pts.map(([dx, dy]) => pto(x + dx, 142 + dy, 1.8)).join('');
const COL = [[-14, -2], [-8, 2], [-2, -3], [4, 1], [10, -2], [15, 2], [-12, 3], [-4, 4], [7, 4], [16, -1], [0, 0], [-17, 0]];
const nmpTubo = (x, pos) => R(x - 9, 14, 18, 6, 1, W(1.6)) + P(`M${x - 8} 20 V96 A8 8 0 0 0 ${x + 8} 96 V20`) + tra(`M${x - 8} 40 H${x + 8}`, 1.2, '3 3')
  + R(x - 3, 62, 6, 26, 1, W(1.4)) + (pos ? R(x - 3, 62, 6, 9, 1, CHEIO) + pto(x - 4, 50, 1.4) + pto(x + 3, 54, 1.4) + pto(x - 2, 96, 1.4) + pto(x + 4, 92, 1.4) : '');

// ===== qualidade =====
const qBox = (y, t) => R(14, y, 52, 28, 5) + T(40, y + 14, t, 15);
const oBox = (y, t, forte) => R(132, y, 110, 28, 5, forte ? W(3.5) : '') + T(187, y + 14, t, 14);
const desce = (y, lab) => seta(40, y + 28, 40, y + 48, 8, 2) + Tx(48, y + 38, lab);
const lado = (y, lab) => seta(66, y + 14, 130, y + 14, 8, 2) + T(98, y + 4, lab, 14);
const ROT = [['Valor energético', 10], ['Carboidratos', 10], ['Açúcares totais', 20], ['Açúcares adicionados', 20], ['Proteínas', 10],
  ['Gorduras totais', 10], ['Gorduras saturadas', 20], ['Gorduras trans', 20], ['Fibra alimentar', 10], ['Sódio', 10]];
const hexa = (cx, cy, r) => 'M' + [0, 1, 2, 3, 4, 5].map(k => { const a = (-90 + 60 * k) * Math.PI / 180; return `${f1(cx + r * Math.cos(a))} ${f1(cy + r * Math.sin(a))}`; }).join(' L') + ' Z';

// mãos: ícones dos 5 passos
const MAOS = [31, 93, 155, 217, 279];
const maos = () => {
  const [a, b, c, d, e] = MAOS;
  let s = P(`M${a - 18} 16 H${a + 2} Q${a + 8} 16 ${a + 8} 24 V28`) + P(`M${a - 8} 16 V9 M${a - 14} 9 H${a - 2}`) + tra(`M${a + 8} 34 V60`, 1.8, '4 4');
  s += R(b - 12, 28, 24, 32, 4) + P(`M${b} 28 V18 H${b + 12} V22`) + C(b + 18, 12, 3, W(1.4)) + C(b - 14, 16, 4, W(1.4)) + C(b - 6, 8, 2.5, W(1.4));
  s += E(c - 6, 40, 9, 19, ` transform="rotate(-18 ${c - 6} 40)"`) + E(c + 6, 40, 9, 19, ` transform="rotate(18 ${c + 6} 40)"`)
    + fino(`M${c - 20} 16 A22 22 0 0 1 ${c + 16} 12`, 1.6) + head(c + 21, 17, 50, 7);
  s += tra(`M${d - 6} 6 V26 M${d + 6} 6 V26`, 1.6, '4 3') + P(`M${d - 14} 62 V42 Q${d - 14} 32 ${d} 32 Q${d + 14} 32 ${d + 14} 42 V62`) + fino(`M${d - 14} 50 L${d - 20} 42`, 2.5);
  s += R(e - 18, 8, 36, 16, 3) + R(e - 12, 24, 24, 32, 1, W(1.8)) + fino(`M${e - 8} 34 H${e + 8} M${e - 8} 42 H${e + 8}`, 1.2);
  for (let i = 0; i < 4; i++) s += seta(MAOS[i] + 22, 40, MAOS[i + 1] - 22, 40, 7, 1.6);
  return s + ['molhar', 'sabão', 'esfregar', 'enxaguar', 'secar'].map((t, i) => T(MAOS[i], 84, t, 14)).join('');
};

// escala do refratômetro: hachura (parte escura, em cima) com vão para a régua
const brix = () => {
  let s = C(75, 75, 68) + fino('M100 30 V120', 1.6);
  const yb = 84, hb = Math.sqrt(68 * 68 - (yb - 75) ** 2);
  s += P(`M${f1(75 - hb)} ${yb} H${f1(75 + hb)}`, W(2.2));
  for (let y = 16; y < yb; y += 8) {
    const h = Math.sqrt(68 * 68 - (y - 75) ** 2);
    s += fino(`M${f1(75 - h)} ${y} H94 M128 ${y} H${f1(75 + h)}`, 1.1);
  }
  for (let v = 0; v <= 30; v += 5) { const y = 120 - 3 * v; s += fino(`M${v % 10 ? 94 : 89} ${y} H100`, 1.6) + (v % 10 ? '' : Tx(106, y, String(v))); }
  return s;
};

// lata: hachura do produto (linhas a 45° recortadas no retângulo)
const hachura = (x1, x2, y1, y2, p) => {
  let d = '';
  for (let k = x1 + y1 + p; k < x2 + y2; k += p) {
    const xa = Math.max(x1, k - y2), xb = Math.min(x2, k - y1);
    if (xb > xa) d += `M${f1(xa)} ${f1(k - xa)} L${f1(xb)} ${f1(k - xb)} `;
  }
  return fino(d.trim(), 1.1);
};
const onda = () => { let d = 'M6 54'; for (let x = 6; x < 182; x += 32) d += ` C${x + 8} 54 ${x + 8} 18 ${x + 16} 18 C${x + 24} 18 ${x + 24} 54 ${x + 32} 54`; return P(d, W(2)); };

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "al-fluxo-lote",
        "Lote — rastreabilidade do processo",
        520,
        158,
        "<text x=\"260\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Lote — rastreabilidade do processo</text><rect x=\"10\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"85\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Matéria-prima</text><path d=\"M162 73 L176 73\"/><path d=\"M169 69 L176 73 L169 77\"/><text x=\"85\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">lote: ______</text><rect x=\"180\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"255\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Processamento</text><path d=\"M332 73 L346 73\"/><path d=\"M339 69 L346 73 L339 77\"/><text x=\"255\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">registro: _____</text><rect x=\"350\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"425\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Produto</text><text x=\"425\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">destino: _____</text>"
      ],
      [
        "al-pcc-registro",
        "Ponto crítico — registro operacional",
        540,
        224,
        "<text x=\"270\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Ponto crítico — registro operacional</text><rect x=\"10\" y=\"42\" width=\"520\" height=\"178\" rx=\"3\"/><text x=\"75\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Etapa</text><text x=\"205\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Limite</text><path d=\"M140 42 V220\"/><text x=\"335\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Monitorar</text><path d=\"M270 42 V220\"/><text x=\"465\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Ação</text><path d=\"M400 42 V220\"/><path d=\"M10 68 H530\"/><path d=\"M10 106 H530\"/><path d=\"M10 144 H530\"/><path d=\"M10 182 H530\"/>"
      ]
    ]
  ]
];

export default {
  id: 'alimentos',
  nome: 'Tecnologia de Alimentos',
  destaques: ['ali-etapa-recepcao', 'ali-flx-leite', 'ali-flx-polpa', 'ali-pasteurizador', 'ali-tacho', 'ali-autoclave-ind', 'ali-camara-fria',
    'ali-curva-crescimento', 'ali-sobrevivencia', 'ali-zona-perigo', 'ali-cadeia-frio', 'ali-leistner', 'ali-appcc-arvore', 'ali-rotulo',
    'ali-refratometro', 'ali-lata-recravacao'],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Fluxograma: etapas', [
      ...ETAPAS,
      ['ali-etapa-branco', 'Etapa (em branco)', 170, 58, bloco('')],
      ['ali-etapa-pcc', 'Etapa com PCC', 214, 58, bloco('Etapa') + P('M162 28 H170') + R(170, 14, 40, 28, 5, W(3.2)) + T(190, 28, 'PCC', 14)],
      ['ali-etapa-lateral', 'Etapa com saída lateral (resíduo)', 246, 58, bloco('Etapa') + seta(162, 28, 184, 28, 9) + T(214, 28, 'resíduo', 14)],
    ]],
    ['Fluxogramas prontos', FLX.filter(f => f[0] !== 'ali-flx-pao')],
    ['Panificação e confeitaria', [
      FLX.find(f => f[0] === 'ali-flx-pao'),
      FLX_PAO,
      ['ali-masseira', 'Masseira (amassadeira espiral)', 200, 196,
        P('M20 190 V30 Q20 18 32 18 H176 Q188 18 188 30 V50 Q188 60 178 60 H68 V150 H188 V190 Z')
        + P('M82 74 L92 146 H168 L178 74') + P('M78 74 H182', W(3)) + P('M130 60 V78')
        + fino('M130 78 C152 84 152 100 130 104 C108 108 108 122 130 128 C148 132 148 140 134 142', 2.4) + C(40, 170, 5) + C(56, 170, 5)],
      ['ali-forno-lastro', 'Forno de lastro (pães)', 220, 184,
        R(10, 22, 200, 150, 4) + P('M30 22 V6 H46 V22')
        + [34, 80, 126].map(y => R(20, y, 142, 38, 3) + R(42, y + 7, 98, 14, 2, W(1.6)) + P(`M46 ${y + 29} H136`, W(3.5))).join('')
        + R(170, 34, 30, 130, 3) + C(185, 52, 6) + C(185, 74, 6) + R(176, 92, 18, 12, 2, W(1.4)) + P('M24 172 V180 M196 172 V180')],
      ['ali-cilindro', 'Cilindro laminador de massa', 220, 140,
        P('M10 84 H92') + R(20, 70, 72, 14, 5, W(2)) + C(110, 58, 22) + C(110, 106, 22) + pto(110, 58, 3) + pto(110, 106, 3)
        + R(132, 80, 80, 4, 2, W(1.8)) + P('M128 88 H214') + fino('M96 30 A18 18 0 0 1 124 30', 1.6) + head(128, 36, 60, 7)
        + P('M110 128 V134 M64 134 H156')],
      ['ali-modeladora', 'Modeladora de pães', 240, 130,
        P('M20 8 H62 L50 28 H32 Z') + C(32, 40, 9) + C(52, 40, 9) + fino('M42 50 L62 88', 1.6) + R(10, 94, 220, 10, 5)
        + R(84, 70, 100, 10, 2) + serie(90, 176, 10, x => fino(`M${x} 80 L${x + 6} 70`, 1)) + E(70, 88, 8, 6, W(1.8)) + E(134, 88, 14, 5, W(1.8))
        + E(212, 86, 18, 6, W(2)) + seta(70, 118, 130, 118, 9, 2)],
      ['ali-divisora', 'Divisora de massa', 200, 168,
        R(34, 84, 112, 76, 4) + E(90, 74, 56, 12) + P('M34 74 V84 M146 74 V84')
        + serie(0, 150, 30, g => { const a = g * Math.PI / 180; return fino(`M${f1(90 - 56 * Math.cos(a))} ${f1(74 - 12 * Math.sin(a))} L${f1(90 + 56 * Math.cos(a))} ${f1(74 + 12 * Math.sin(a))}`, 1.2); })
        + P('M90 62 V30 H160') + C(166, 30, 6) + R(48, 104, 30, 14, 2, W(1.6)) + P('M30 160 H150')],
      ['ali-camara-fermentacao', 'Câmara de fermentação (armário)', 150, 200,
        R(10, 10, 130, 180, 6) + R(22, 42, 106, 140, 3, W(1.6)) + R(28, 16, 62, 20, 2, W(1.6)) + T(59, 26, '30 °C', 14)
        + P('M112 16 Q104 26 112 30 Q120 26 112 16 Z', W(1.6)) + fino('M124 90 V130', 3)
        + [76, 116, 156].map(y => fino(`M26 ${y} H124`, 1.6) + [46, 74, 102].map(x => E(x, y - 7, 10, 6, W(1.6))).join('')).join('')],
      ['ali-forno-turbo', 'Forno turbo (convecção)', 200, 160,
        R(10, 10, 180, 140, 6) + R(20, 22, 120, 116, 4) + R(32, 34, 96, 92, 3, W(1.6)) + C(80, 80, 24, W(1.6)) + pto(80, 80, 3)
        + fino('M80 80 Q88 64 80 58 M80 80 Q96 88 102 80 M80 80 Q72 96 80 102 M80 80 Q64 72 58 80', 1.6)
        + tra('M36 52 H124 M36 110 H124', 1.2, '4 3')
        + R(150, 22, 30, 116, 3) + C(165, 44, 7) + C(165, 72, 7) + R(156, 94, 18, 12, 2, W(1.4)) + P('M24 150 V156 M176 150 V156')],
      ['ali-batedeira', 'Batedeira planetária', 180, 200,
        R(20, 178, 140, 16, 4) + R(22, 44, 26, 134, 4) + R(20, 18, 144, 36, 14) + P('M48 140 H70')
        + P('M66 116 H154', W(3)) + P('M70 116 Q74 168 110 168 Q146 168 150 116') + P('M110 54 V78')
        + E(110, 104, 16, 26, W(1.8)) + E(110, 104, 6, 26, W(1.4)) + fino('M80 70 A34 10 0 0 0 140 70', 1.4) + head(144, 66, -40, 7)],
      ['ali-pao-frances', 'Pão francês (ícone)', 160, 80,
        P('M14 44 C14 18 60 12 80 12 C100 12 146 18 146 44 C146 64 110 70 80 70 C50 70 14 64 14 44 Z')
        + P('M40 42 Q80 22 124 38') + fino('M44 46 Q82 30 120 42', 1.4)],
      ['ali-pao-forma', 'Pão de forma (fatia)', 110, 110,
        P('M18 102 V44 Q8 40 10 28 Q14 10 40 12 Q55 4 70 12 Q96 10 100 28 Q102 40 92 44 V102 Z')
        + fino('M26 96 V48 Q18 44 18 32 Q22 18 42 20 Q55 12 68 20 Q90 18 92 32 Q92 44 84 48 V96 Z', 1.2)
        + [[40, 50], [62, 44], [50, 70], [72, 76], [38, 84]].map(([x, y]) => C(x, y, 3, W(1.2))).join('')],
      ['ali-croissant', 'Croissant (ícone)', 160, 100,
        P('M14 76 Q24 22 80 16 Q136 22 146 76 Q122 54 80 52 Q38 54 14 76 Z')
        + fino('M44 32 L54 54 M80 18 V52 M116 32 L106 54', 1.6)],
      ['ali-gluten', 'Rede de glúten (retém o gás)', 190, 150,
        C(46, 56, 15, W(1.8)) + C(112, 46, 17, W(1.8)) + C(118, 102, 15, W(1.8)) + C(56, 104, 12, W(1.8)) + T(112, 46, 'CO₂', 14) + gluten()],
      ['ali-ponto-veu', 'Ponto de véu (teste da massa)', 200, 150,
        P('M30 70 C28 30 70 14 100 16 C140 14 172 34 170 70 C172 104 140 122 100 120 C62 122 32 108 30 70 Z', W(4))
        + tra('M56 70 C56 46 80 36 100 38 C126 36 146 50 144 70 C146 92 124 102 100 100 C76 102 56 92 56 70 Z', 1.2, '4 3')
        + fino('M86 56 L96 66 M104 76 L114 86', 1.2) + R(4, 52, 22, 36, 10) + R(174, 52, 22, 36, 10) + T(100, 138, 'película fina, sem rasgar', 14)],
    ]],
    ['Equipamentos de processo', [
      ['ali-pasteurizador', 'Pasteurizador de placas (HTST)', 260, 170,
        P('M10 40 H250 M10 132 H250') + R(14, 32, 16, 108, 2) + R(230, 32, 16, 108, 2)
        + serie(38, 222, 6, x => (x >= 90 && x <= 106) || (x >= 154 && x <= 170) ? '' : fino(`M${x} 46 V126`, 1.3))
        + R(94, 40, 8, 92, 1, W(2)) + R(158, 40, 8, 92, 1, W(2))
        + fino('M110 40 V12 H120 V30 H130 V12 H140 V30 H150 V12 H156 V40', 2) + T(54, 16, 'retenção', 14)
        + T(64, 152, 'regen.', 14) + T(130, 152, 'aquec.', 14) + T(196, 152, 'resfr.', 14)
        + P('M24 140 V164 M236 140 V164 M16 164 H32 M228 164 H244')],
      ['ali-tanque-leite', 'Tanque de resfriamento de leite', 240, 158,
        P('M50 48 H150 A40 40 0 0 1 150 128 H50 A40 40 0 0 1 50 48 Z') + tra('M22 70 H178', 1.4, '8 6') + R(80, 38, 50, 10, 2)
        + R(92, 14, 26, 24, 3) + T(105, 26, 'M', 14) + P('M105 48 V108', W(1.8)) + fino('M90 108 H120', 3)
        + R(196, 80, 40, 50, 3) + C(216, 98, 10, W(1.8)) + fino('M209 91 L223 105 M223 91 L209 105', 1.4) + floco(216, 121, 6, 1.4)
        + fino('M196 112 H182 M196 122 H172', 2) + P('M60 128 V152 M140 128 V152 M52 152 H68 M132 152 H148')],
      ['ali-desnatadeira', 'Desnatadeira (centrífuga de discos)', 212, 214,
        P('M60 64 L100 40 L140 64 V136 L100 158 L60 136 Z') + serie(0, 5, 1, i => fino(`M74 ${80 + i * 10} L100 ${66 + i * 10} L126 ${80 + i * 10}`, 1.4))
        + P('M50 72 V30 H150 V72') + seta(100, 4, 100, 40, 8, 2.5) + T(126, 12, 'leite', 14)
        + P('M50 44 H16 M150 44 H184') + T(30, 58, 'creme', 14) + T(182, 58, 'desnat.', 14)
        + P('M100 158 V178') + R(76, 178, 48, 28, 4) + T(100, 192, 'M', 16) + P('M56 210 H144')],
      ['ali-homogeneizador', 'Homogeneizador (pistões e válvula)', 234, 152,
        C(28, 92, 18) + T(28, 92, 'M', 18) + P('M46 92 H62') + R(62, 60, 34, 64, 4) + P('M96 74 H118 M96 92 H118 M96 110 H118', W(3.5))
        + R(118, 56, 56, 72, 4) + P('M174 76 H194 L208 84 V100 L194 108 H174') + P('M208 92 H222') + P('M222 80 V104', W(3.5))
        + C(146, 32, 12) + P('M146 44 V56') + fino('M146 32 L153 25', 1.8)
        + P('M190 108 V136 H220') + head(230, 136, 0, 10) + P('M104 146 H146 V137') + head(146, 128, -90, 9)],
      ['ali-autoclave-ind', 'Autoclave horizontal (retorta)', 246, 146,
        P('M40 30 H214 Q240 30 240 75 Q240 120 214 120 H40') + P('M40 30 Q12 30 12 75 Q12 120 40 120 Z') + C(26, 75, 7) + fino('M26 66 V84 M17 75 H35', 1.6)
        + R(52, 44, 72, 62, 3, W(1.8)) + R(134, 44, 72, 62, 3, W(1.8)) + latas(52) + latas(134) + fino('M44 110 H230', 1.6)
        + C(150, 14, 9) + P('M150 23 V30') + fino('M150 14 L155 9', 1.6) + R(184, 6, 7, 24, 3) + P('M100 30 V12 H78') + T(56, 12, 'vapor', 14)
        + P('M70 120 V140 M200 120 V140 M60 140 H80 M190 140 H210')],
      ['ali-tacho', 'Tacho encamisado basculante', 210, 186,
        P('M20 66 V180 M190 66 V180 M8 182 H32 M178 182 H202') + C(20, 70, 5) + C(190, 70, 5) + P('M25 70 H34 M176 70 H185')
        + P('M40 70 A65 76 0 0 0 170 70') + P('M34 70 A71 86 0 0 0 176 70') + P('M30 70 H180', W(3)) + tra('M46 88 H164', 1.4, '8 6')
        + P('M60 70 L80 34 H130 L150 70') + R(88, 10, 34, 24, 3) + T(105, 22, 'M', 14) + P('M105 34 V134', W(1.8))
        + fino('M66 94 Q70 136 105 138 Q140 136 144 94', 2.2) + P('M105 156 V172 H70') + T(48, 172, 'vapor', 14)],
      ['ali-despolpadeira', 'Despolpadeira', 258, 164,
        P('M44 8 H94 L76 40 H62 Z') + R(36, 40, 164, 54, 8) + tra('M44 48 H192 V86 H44 Z', 1.4, '3 4') + P('M28 67 H214', W(2))
        + serie(60, 180, 20, x => fino(`M${x} 52 L${x + 12} 82`, 2)) + C(16, 67, 12) + T(16, 67, 'M', 14)
        + P('M64 94 L96 118 H140 L172 94') + seta(118, 118, 118, 140, 9) + T(118, 154, 'polpa', 14)
        + P('M200 72 H214 L232 98 V113') + head(232, 122, 90, 9) + T(226, 136, 'resíduo', 14)
        + P('M44 94 V160 M192 94 V160 M36 160 H52 M184 160 H200')],
      ['ali-liofilizador', 'Liofilizador', 250, 156,
        R(10, 20, 100, 110, 6) + fino('M18 50 H102 M18 78 H102 M18 106 H102', 2) + [50, 78, 106].map(y => R(28, y - 8, 64, 8, 1, W(1.4))).join('') + T(60, 146, 'câmara', 14)
        + P('M110 60 H117 M133 60 H140') + P('M117 54 L133 66 V54 L117 66 Z')
        + R(140, 20, 62, 110, 6) + fino('M150 34 H190 V48 H156 V62 H190 V76 H156 V90 H190 V104 H150', 1.8) + floco(171, 118, 7, 1.4) + T(171, 146, 'condensador', 14)
        + P('M202 60 H226 V82') + C(226, 98, 16) + fino('M214 106 L226 84 L238 106', 1.6) + T(226, 126, 'vácuo', 14)],
      ['ali-extrusora', 'Extrusora (rosca e matriz)', 260, 120,
        R(4, 44, 36, 40, 4) + T(22, 64, 'M', 15) + R(40, 50, 22, 28, 2) + R(62, 50, 160, 28, 2) + fino('M62 64 H222', 1.4)
        + serie(70, 206, 12, x => fino(`M${x} 52 L${x + 8} 76`, 1.8)) + P('M84 10 H128 L112 50 H100 Z') + P('M222 50 L238 58 V70 L222 78 Z')
        + E(249, 54, 7, 4, W(1.8)) + E(251, 68, 7, 4, W(1.8)) + E(246, 82, 6, 4, W(1.8))
        + P('M72 78 V112 M210 78 V112 M22 84 V112') + P('M4 114 H226')],
      ['ali-envasadora', 'Envasadora (bicos dosadores)', 242, 174,
        R(36, 6, 168, 40, 6) + tra('M44 20 H196', 1.4, '8 6')
        + [70, 120, 170].map(x => P(`M${x} 46 V82`) + R(x - 6, 56, 12, 12, 2, W(1.8)) + P(`M${x - 6} 82 L${x} 92 L${x + 6} 82 Z`) + garrafa(x)).join('')
        + R(8, 158, 226, 10, 5) + seta(12, 140, 42, 140, 9, 2)],
      ['ali-recravadeira', 'Recravadeira de latas', 200, 184,
        P('M100 4 V12') + R(78, 12, 44, 30, 4) + R(84, 42, 32, 6, 1) + P('M58 48 H142', W(3.5)) + P('M62 50 V150 H138 V50')
        + fino('M62 80 H138 M62 110 H138', 1.2) + R(54, 150, 92, 10, 2) + P('M100 160 V178 M76 180 H124')
        + C(32, 48, 14) + T(32, 48, '1ª', 14) + C(168, 48, 14) + T(168, 48, '2ª', 14) + fino('M32 62 V96 M168 62 V96', 2.5)
        + seta(46, 70, 58, 58, 7, 1.6) + seta(154, 70, 142, 58, 7, 1.6)],
      ['ali-camara-fria', 'Câmara fria', 220, 166,
        R(10, 22, 200, 138, 4) + R(34, 4, 80, 18, 3) + C(56, 13, 6, W(1.6)) + C(92, 13, 6, W(1.6))
        + R(28, 40, 70, 28, 3) + T(63, 54, '−18 °C', 14) + floco(63, 112, 22, 2.2)
        + R(120, 40, 76, 114, 3) + R(180, 86, 7, 24, 2, CHEIO) + fino('M120 58 H127 M120 136 H127', 3) + P('M4 160 H216')],
      ['ali-defumador', 'Defumador', 188, 186,
        R(70, 28, 112, 152, 4) + P('M116 28 V8 H136 V28') + fino('M78 50 H174 M78 104 H174', 2) + linguicas(50) + linguicas(104)
        + C(164, 162, 8) + fino('M164 162 L169 157', 1.4) + R(10, 132, 48, 48, 3) + P('M58 150 H70')
        + fino('M18 172 H50', 2.5) + fino('M28 168 Q22 156 30 148 Q32 158 36 154 Q38 144 46 156 Q48 166 42 168', 1.6)
        + fino('M84 170 Q92 160 100 170 T116 170 M118 162 Q126 152 134 162 T150 162', 1.6)],
      ['ali-moedor', 'Moedor de carne', 232, 148,
        R(8, 56, 82, 84, 8) + T(49, 98, 'M', 18) + P('M4 142 H100') + R(90, 70, 100, 34, 4) + serie(98, 178, 12, x => fino(`M${x} 72 L${x + 8} 102`, 1.8))
        + P('M118 44 V70 M144 44 V70') + P('M80 30 H200 L192 44 H88 Z') + R(190, 64, 8, 46, 2)
        + fino('M198 76 Q210 74 214 82 T226 92 M198 87 Q210 86 216 94 T228 106 M198 98 Q208 100 212 110 T222 122', 2)],
      ['ali-embutideira', 'Embutideira (pistão)', 208, 194,
        R(60, 32, 60, 136, 6) + R(64, 14, 52, 18, 3) + P('M90 32 V62', W(3)) + R(64, 62, 52, 10, 2, W(2))
        + fino('M66 90 L80 76 M66 110 L100 76 M66 130 L114 82 M70 150 L114 106 M90 154 L114 130', 1.2)
        + fino('M116 22 H146 V12', 2.5) + C(146, 9, 4) + P('M120 146 H160 L166 150 L160 154 H120') + R(166, 144, 34, 12, 6, W(2))
        + P('M70 168 V190 M110 168 V190 M62 190 H78 M102 190 H118')],
      ['ali-tanque-queijo', 'Tanque de queijo com lira', 232, 152,
        P('M10 40 V120 Q10 132 22 132 H198 Q210 132 210 120 V40') + fino('M20 40 V114 Q20 122 28 122 H192 Q200 122 200 114 V40', 2) + P('M6 40 H214', W(3))
        + tra('M24 62 H196', 1.4, '8 6') + serie(48, 176, 24, x => fino(`M${x} 66 V118`, 1.1)) + fino('M24 84 H196 M24 102 H196', 1.1)
        + R(40, 6, 72, 26, 2) + serie(50, 104, 9, x => fino(`M${x} 8 V30`, 1.2)) + fino('M112 19 H132', 2.5)
        + P('M30 132 V148 M190 132 V148') + P('M210 112 H228') + fino('M222 106 V118', 2)],
      ['ali-prensa-queijo', 'Prensa de queijos', 200, 178,
        P('M30 10 V170 M170 10 V170') + R(24, 10, 152, 14, 2) + R(84, 24, 32, 30, 3) + P('M100 54 V70', W(3)) + R(56, 70, 88, 8, 2)
        + R(60, 78, 80, 32, 3) + R(60, 112, 80, 32, 3)
        + [94, 128].map(y => serie(72, 128, 14, x => C(x, y, 2, W(1.2)))).join('')
        + P('M40 146 H160 L154 156 H46 Z') + P('M20 172 H180')],
      ['ali-tunel-congelamento', 'Túnel de congelamento', 260, 130,
        P('M40 72 V20 H220 V72 M40 104 V112 H220 V104') + R(6, 88, 248, 10, 5) + [16, 60, 110, 160, 230].map(x => R(x, 76, 22, 12, 2, W(1.8))).join('')
        + C(90, 40, 11) + C(170, 40, 11) + fino('M82 32 L98 48 M98 32 L82 48 M162 32 L178 48 M178 32 L162 48', 1.4) + T(130, 40, '−35 °C', 14)
        + seta(90, 54, 90, 72, 8, 1.6) + seta(170, 54, 170, 72, 8, 1.6) + P('M56 112 V126 M204 112 V126') + seta(100, 122, 160, 122, 9, 2)],
    ]],
    ['Conservação', [
      ['ali-binomio', 'Binômio tempo × temperatura', 240, 176,
        eixos(40, 150, 228, 12) + P('M56 38 L214 136') + pto(66, 44.2) + pto(130, 83.9) + pto(196, 124.8)
        + T(98, 40, 'UHT', 14) + T(164, 74, 'HTST', 14) + T(212, 108, 'LTLT', 14) + Tx(48, 14, 'T (°C)') + T(196, 166, 'tempo (log)', 14)],
      ['ali-sobrevivencia', 'Curva de sobrevivência (valor D)', 230, 190, "<g transform=\"translate(0.00 0.50)\">" + (curvaLog('N (log)', 'tempo', 'D', '10⁴', '10³')) + "</g>"],
      ['ali-tdt', 'Curva TDT (valor z)', 230, 190, "<g transform=\"translate(0.00 0.50)\">" + (curvaLog('D (log)', 'T (°C)', 'z', '10', '1')) + "</g>"],
      ['ali-cadeia-frio', 'Cadeia do frio', 260, 126,
        P('M12 70 V38 L24 30 V38 L36 30 V38 L48 30 V70 Z') + R(24, 56, 12, 14, 1, W(1.6))
        + R(74, 28, 34, 30, 2) + P('M108 40 H116 L122 48 V58 H108') + C(84, 62, 5) + C(114, 62, 5) + floco(91, 43, 8, 1.4)
        + R(142, 24, 40, 46, 3) + fino('M142 40 H182 M142 54 H182', 1.4) + floco(162, 32, 5, 1.2)
        + R(212, 22, 32, 48, 4) + P('M212 38 H244') + fino('M218 28 V34 M218 44 V54', 2.5)
        + seta(54, 46, 70, 46, 8, 2) + seta(126, 46, 138, 46, 8, 2) + seta(188, 46, 208, 46, 8, 2)
        + T(32, 86, 'fábrica', 14) + T(97, 86, 'caminhão', 14) + T(162, 86, 'mercado', 14) + T(228, 86, 'casa', 14)
        + T(130, 114, 'sem quebra da cadeia', 14)],
      ['ali-aw-estabilidade', 'Atividade de água × estabilidade', 256, 189, "<g transform=\"translate(0.00 0.50)\">" + (eixos(30, 160, 250, 12) + T(30, 174, '0', 14) + T(130, 174, '0,5', 14) + T(230, 174, '1', 14) + fino('M130 160 V166 M230 160 V166', 1.6)
        + Tx(38, 14, 'taxa relativa') + T(240, 144, 'aw', 14)
        + P('M36 44 Q74 150 100 138 Q150 120 224 70') + P('M90 158 Q150 28 210 140', W(2)) + P('M150 158 C190 156 212 100 224 26', ' stroke-dasharray="7 5"')
        + T(86, 40, 'oxidação', 14) + T(150, 72, 'Maillard', 14) + T(186, 30, 'micróbios', 14)) + "</g>"],
      ['ali-ph-limite', 'Alimento ácido × pouco ácido (pH 4,5)', 260, 118,
        R(10, 40, 240, 22, 3) + serie(1, 13, 1, i => fino(`M${f1(10 + i * 240 / 14)} 40 V46`, 1.4))
        + serie(0, 14, 2, i => T(f1(10 + i * 240 / 14), 28, String(i), 14))
        + serie(10, 74, 8, x => fino(`M${x} 62 L${x + 12} 40`, 1.2)) + P('M87.1 34 V70', W(4)) + T(87, 82, '4,5', 15)
        + T(40, 82, 'ácido', 14) + T(170, 82, 'pouco ácido', 14) + T(46, 104, 'pasteurizar', 14) + T(170, 104, 'esterilizar', 14)],
      ['ali-ph-crescimento', 'pH × crescimento (fungos e bactérias)', 247, 171, "<g transform=\"translate(0.00 2.50)\">" + (eixos(30, 140, 232, 12) + P('M50 140 C72 20 120 20 152 140') + P('M84 140 C108 10 140 10 166 140', ' stroke-dasharray="7 5"')
        + fino('M124.5 140 V146 M219 140 V146', 1.6) + T(30, 154, '0', 14) + T(124.5, 154, '7', 14) + T(219, 154, '14', 14)
        + T(232, 124, 'pH', 14) + Tx(36, 12, 'crescimento') + T(60, 40, 'fungos', 14) + T(192, 50, 'bactérias', 14)) + "</g>"],
      ['ali-leistner', 'Obstáculos de Leistner', 260, 139, "<g transform=\"translate(0.00 0.00)\">" + (P('M6 110 H254') + [[60, 70, 'T'], [100, 58, 'aw'], [140, 76, 'pH'], [180, 64, 'Eh'], [220, 54, 'cons.']].map(([x, y, l]) =>
          P(`M${x - 12} 110 V${y} M${x + 12} 110 V${y}`) + P(`M${x - 15} ${y} H${x + 15}`, W(4)) + T(x, 124, l, 14)).join('')
        + E(22, 100, 12, 7) + pto(18, 99, 1.6) + pto(26, 101, 1.6)
        + tra('M30 90 Q60 30 88 52 Q110 30 130 56 Q146 44 158 60', 1.6) + fino('M162 54 L174 66 M174 54 L162 66', 3)) + "</g>"],
      ['ali-vacuo', 'Embalagem a vácuo', 200, 112,
        R(6, 40, 16, 60, 2) + R(178, 40, 16, 60, 2) + fino('M6 52 H22 M6 64 H22 M6 76 H22 M6 88 H22 M178 52 H194 M178 64 H194 M178 76 H194 M178 88 H194', 1.2)
        + P('M22 46 C52 46 52 34 100 34 C148 34 148 46 178 46 M22 94 C52 94 52 106 100 106 C148 106 148 94 178 94')
        + E(100, 70, 58, 28, W(2)) + fino('M62 64 Q80 56 96 66 M104 78 Q124 70 140 76', 1.2)
        + seta(76, 30, 76, 8, 8, 1.6) + seta(124, 30, 124, 8, 8, 1.6) + T(166, 16, 'sem ar', 14)],
      ['ali-atm-modificada', 'Bandeja em atmosfera modificada', 220, 106,
        P('M14 40 L28 96 H192 L206 40') + P('M6 40 H214', W(3)) + fino('M8 37 Q110 28 212 37', 1.6) + R(40, 74, 140, 16, 8, W(1.8))
        + T(64, 56, 'CO₂', 14) + T(110, 60, 'N₂', 14) + T(156, 56, 'O₂', 14)],
      ['ali-irradiacao', 'Irradiação de alimentos (esquema)', 240, 136,
        R(92, 6, 56, 30, 3) + T(120, 21, 'fonte', 14)
        + [104, 120, 136].map(x => fino(`M${x} 38 q5 6 0 12 q-5 6 0 12 q5 6 0 12`, 1.8) + head(x, 82, 90, 8)).join('')
        + R(30, 86, 40, 26, 2) + R(100, 86, 40, 26, 2) + R(170, 86, 40, 26, 2) + R(10, 112, 220, 8, 4) + seta(96, 129, 150, 129, 9, 2)],
      ['ali-zona-perigo', 'Zona de perigo de temperatura', 200, 214,
        P('M40 175 V22 A12 12 0 0 1 64 22 V175') + C(52, 192, 18) + C(52, 192, 12, CHEIO) + R(48, 70, 8, 112, 0, CHEIO)
        + tra('M30 60 H190', 1.4) + tra('M30 130 H190', 1.4) + T(18, 60, '60', 14) + T(18, 130, '5', 14) + T(18, 16, '°C', 14)
        + T(132, 34, 'seguro (quente)', 14) + R(76, 66, 112, 58, 4, W(3)) + T(132, 86, 'zona de', 15) + T(132, 104, 'perigo', 15)
        + T(132, 154, 'seguro (frio)', 14)],
      ['ali-congelamento', 'Curva de congelamento', 240, 162,
        eixos(36, 156, 232, 12) + tra('M36 72 H226', 1.2, '4 4') + tra('M36 130 H226', 1.2, '4 4') + T(20, 72, '0', 14) + T(18, 130, '−18', 14)
        + P('M40 28 C56 52 66 70 76 80 Q82 86 88 74 Q92 70 100 72 H156 C176 74 190 112 222 126')
        + T(128, 56, 'mudança de fase', 14) + Tx(44, 12, 'T (°C)') + T(214, 146, 'tempo', 14)],
      ['ali-curva-secagem', 'Curva de taxa de secagem', 241, 169, "<g transform=\"translate(0.00 2.50)\">" + (eixos(30, 140, 232, 12) + P('M34 126 Q44 62 60 58 H130 C160 58 190 110 222 132') + tra('M60 58 V140 M130 58 V140', 1.2, '4 4')
        + T(95, 42, 'constante', 14) + T(186, 40, 'decrescente', 14) + Tx(38, 12, 'taxa de secagem') + T(214, 152, 'tempo', 14)) + "</g>"],
    ]],
    ['Microbiologia', [
      ['ali-curva-crescimento', 'Curva de crescimento microbiano', 264, 178,
        eixos(30, 150, 252, 12) + P('M34 128 H62 C76 128 80 120 86 110 L124 46 C130 38 138 34 150 34 H204 C220 34 230 50 250 90')
        + tra('M80 30 V150 M132 30 V150 M210 30 V150', 1.2, '4 4')
        + T(54, 110, 'lag', 14) + T(120, 104, 'log', 14) + T(171, 58, 'estacionária', 14) + T(234, 112, 'declínio', 14)
        + Tx(38, 12, 'log N') + T(232, 166, 'tempo', 14)],
      ['ali-diluicao', 'Diluição seriada e plaqueamento', 252, 164,
        [36, 98, 160, 222].map(tubo).join('')
        + [36, 98, 160].map(x => fino(`M${x + 4} 18 Q${x + 31} 2 ${x + 52} 15`, 1.8) + head(x + 58, 19, 35, 8)).join('')
        + T(36, 108, 'amostra', 14) + T(98, 108, '10⁻¹', 14) + T(160, 108, '10⁻²', 14) + T(222, 108, '10⁻³', 14)
        + [98, 160, 222].map(x => seta(x, 118, x, 132, 8, 1.8)).join('')
        + placa(98, COL) + placa(160, COL.slice(0, 5)) + placa(222, COL.slice(0, 2))],
      ['ali-nmp', 'NMP: série de tubos (3 × 3)', 240, 150,
        [30, 52, 74, 106, 128, 150, 182, 204, 226].map((x, i) => nmpTubo(x, i < 5)).join('')
        + T(52, 118, '10⁻¹', 14) + T(128, 118, '10⁻²', 14) + T(204, 118, '10⁻³', 14) + T(128, 138, '3-2-0 → tabela NMP', 14)],
      ['ali-termometro-espeto', 'Termômetro de espeto (cozimento)', 200, 150,
        R(16, 16, 76, 48, 10) + R(26, 24, 56, 26, 3, W(1.8)) + T(54, 37, '70 °C', 14) + C(80, 57, 3, W(1.4))
        + P('M86 60 L128 98', W(3)) + tra('M128 98 L168 134', 3, '6 4')
        + P('M118 118 C116 96 156 88 184 102 C200 112 196 140 168 144 C140 148 120 140 118 118 Z')],
      ['ali-levedura', 'Levedura em brotamento', 136, 110,
        E(60, 62, 40, 32) + E(106, 32, 18, 15) + C(54, 66, 10, W(1.8)) + C(78, 76, 6, W(1.4)) + C(108, 32, 4, W(1.4))
        + pto(40, 50, 2) + pto(46, 84, 2) + pto(72, 50, 2)],
      ['ali-bolor', 'Bolor (hifas e esporos)', 180, 150,
        fino('M8 136 Q40 124 70 136 T130 132 T172 136 M40 130 Q50 142 62 144 M110 134 Q120 144 134 146', 1.8)
        + P('M58 134 V64') + C(58, 54, 10)
        + serie(-180, 0, 30, g => { const a = g * Math.PI / 180; return C(f1(58 + 15 * Math.cos(a)), f1(54 + 15 * Math.sin(a)), 3, W(1.3)) + C(f1(58 + 21 * Math.cos(a)), f1(54 + 21 * Math.sin(a)), 3, W(1.3)); })
        + P('M126 134 V60') + C(126, 40, 20) + fino('M116 58 Q126 46 136 58', 1.4)
        + [[118, 30], [128, 26], [136, 34], [120, 42], [132, 44], [126, 34]].map(([x, y]) => pto(x, y, 2)).join('')
        + fino('M126 134 L118 144 M126 134 L134 144', 1.4)],
      ['ali-esporo', 'Bactéria com endósporo', 200, 94,
        R(12, 22, 104, 42, 21) + E(94, 43, 12, 9, CHEIO) + pto(34, 36, 2) + pto(50, 50, 2) + pto(64, 34, 2)
        + E(156, 43, 16, 11, W(3)) + E(156, 43, 9, 5, CHEIO) + T(64, 80, 'célula com esporo', 14) + T(156, 74, 'esporo', 14)],
      ['ali-swab', 'Swab de superfície (molde 10 × 10 cm)', 200, 136,
        R(8, 36, 116, 94, 4) + R(30, 52, 72, 58, 1, W(1.6)) + tra('M38 60 L94 68 L38 78 L94 88 L38 98 L94 104', 1.4, '4 3')
        + P('M170 10 L98 78', W(3)) + E(94, 82, 10, 6, ` transform="rotate(-43 94 82)" fill="#C"`)
        + R(158, 38, 26, 12, 3) + P('M161 50 V118 A10 10 0 0 0 181 118 V50') + T(66, 120, '10 × 10 cm', 14)],
    ]],
    ['Qualidade e segurança (BPF/APPCC)', [
      ['ali-appcc-arvore', 'Árvore decisória do PCC (APPCC)', 250, 236,
        qBox(10, 'Q1') + qBox(58, 'Q2') + qBox(106, 'Q3') + qBox(154, 'Q4') + R(10, 202, 60, 28, 5, W(3.5)) + T(40, 216, 'PCC', 14)
        + desce(10, 'sim') + lado(10, 'não') + oBox(10, 'modificar')
        + lado(58, 'sim') + oBox(58, 'PCC', true) + desce(58, 'não')
        + lado(106, 'não') + oBox(106, 'não é PCC') + desce(106, 'sim')
        + lado(154, 'sim') + oBox(154, 'não é PCC') + desce(154, 'não')],
      ['ali-pcc-marcador', 'Marcador PCC', 96, 64,
        R(4, 4, 88, 56, 10) + R(10, 10, 76, 44, 6, W(1.4)) + T(48, 26, 'PCC', 20) + T(48, 44, 'nº ___', 14)],
      ['ali-cinco-chaves', 'Cinco chaves do alimento seguro', 210, 186,
        ['manter a limpeza', 'separar cru e cozido', 'cozinhar bem', 'temperatura segura', 'água e matéria-prima']
          .map((t, i) => { const y = 20 + 36 * i; return C(24, y, 14) + T(24, y, String(i + 1), 15) + Tx(46, y, t, 15); }).join('')],
      ['ali-maos', 'Higienização das mãos (5 passos)', 310, 96, maos()],
      ['ali-marcha-avante', 'Marcha avante (sem cruzamento)', 280, 136,
        T(70, 14, 'área suja', 14) + T(210, 14, 'área limpa', 14)
        + ['recepção', 'preparo', 'cocção', 'saída'].map((t, i) => R(6 + i * 67, 26, 64, 46, 3) + T(38 + i * 67, 49, t, 14)).join('')
        + seta(10, 88, 270, 88, 12, 3) + T(140, 104, 'marcha avante', 14)
        + tra('M262 124 H30', 2, '6 5') + head(20, 124, 180, 10) + fino('M132 114 L148 134 M148 114 L132 134', 3)],
      ['ali-rotulo', 'Tabela nutricional (para preencher)', 308, 250,
        R(4, 4, 300, 242, 2) + T(154, 19, 'INFORMAÇÃO NUTRICIONAL', 15) + P('M4 32 H304', W(3)) + Tx(10, 43, 'Porção: ___ g')
        + P('M4 54 H304', W(2)) + T(191, 64, '100 g', 14) + T(238, 64, 'porção', 14) + T(283, 64, '%VD', 14) + P('M4 74 H304', W(2))
        + ROT.map(([t, x], i) => Tx(x, 74 + 17 * i + 8.5, t) + (i < ROT.length - 1 ? fino(`M4 ${74 + 17 * (i + 1)} H304`, 1) : '')).join('')
        + fino('M168 54 V246 M214 54 V246 M262 54 V246', 1.2)],
      ['ali-lote-validade', 'Lote, fabricação e validade', 190, 100,
        R(4, 4, 182, 92, 8) + Tx(16, 26, 'LOTE: ________', 15) + Tx(16, 50, 'FAB.: ___/___/___', 15) + Tx(16, 74, 'VAL.: ___/___/___', 15)],
      ['ali-selo-inspecao', 'Selo de inspeção (genérico)', 124, 116,
        P(hexa(62, 58, 52)) + fino(hexa(62, 58, 44), 1.4) + T(62, 40, 'INSPEÇÃO', 14) + P('M50 60 L58 68 L74 52', W(4)) + T(62, 84, 'nº ___', 14)],
      ['ali-peps', 'PEPS (primeiro que entra, primeiro que sai)', 244, 124,
        P('M30 82 H210', W(3)) + P('M36 82 V112 M204 82 V112')
        + serie(0, 3, 1, i => R(40 + i * 42, 48, 36, 34, 2) + T(58 + i * 42, 65, String(i + 1), 15))
        + seta(240, 60, 208, 60, 9, 2) + T(224, 40, 'entra', 14) + seta(36, 60, 6, 60, 9, 2) + T(20, 40, 'sai', 14)
        + T(120, 104, '1º a entrar, 1º a sair', 14)],
      ['ali-manipulador', 'Manipulador uniformizado', 206, 212,
        C(80, 48, 18) + P('M60 46 Q60 20 80 20 Q100 20 100 46 Z') + fino('M60 46 Q65 51 70 46 Q75 51 80 46 Q85 51 90 46 Q95 51 100 46', 1.4)
        + R(70, 52, 20, 10, 3, W(1.8)) + pto(73, 44, 1.8) + pto(87, 44, 1.8)
        + R(54, 70, 52, 84, 12) + P('M62 84 H98 L104 156 H56 Z', W(2)) + P('M54 82 L40 134 M106 82 L120 134')
        + P('M68 154 V192 M92 154 V192') + R(58, 190, 20, 16, 3) + R(84, 190, 20, 16, 3)
        + Tx(140, 24, 'touca') + fino('M98 30 L136 25', 1.2) + Tx(140, 58, 'máscara') + fino('M90 57 L136 58', 1.2)
        + Tx(140, 112, 'avental') + fino('M102 112 L136 112', 1.2) + Tx(140, 198, 'botas') + fino('M104 198 L136 198', 1.2)],
      ['ali-etiqueta-aberto', 'Etiqueta de produto aberto', 200, 118,
        P('M26 6 H194 V112 H26 L6 92 V26 Z') + C(20, 59, 5) + Tx(34, 24, 'PRODUTO: ______') + Tx(34, 48, 'ABERTO: __/__')
        + Tx(34, 72, 'VALIDADE: __/__') + Tx(34, 96, 'RESP.: ______')],
      ['ali-planilha-temp', 'Planilha de controle de temperatura', 236, 152,
        R(4, 4, 228, 144, 2) + T(34, 16, 'data', 14) + T(88, 16, 'hora', 14) + T(138, 16, '°C', 14) + T(198, 16, 'visto', 14)
        + P('M4 28 H232', W(2)) + fino('M4 52 H232 M4 76 H232 M4 100 H232 M4 124 H232', 1) + fino('M64 4 V148 M112 4 V148 M164 4 V148', 1.4)],
    ]],
    ['Análises', [
      ['ali-refratometro', 'Refratômetro de mão (°Brix)', 240, 70,
        P('M10 26 H50 V56 H24 Z') + P('M8 22 L48 18', W(3)) + pto(48, 19, 2.5) + R(50, 26, 150, 30, 12) + T(126, 41, '°Brix', 14)
        + fino('M180 26 V56 M186 26 V56', 1.6) + R(200, 30, 32, 22, 5) + fino('M210 30 V52 M220 30 V52', 1.4)],
      ['ali-escala-brix', 'Leitura do refratômetro (escala)', 150, 150, brix()],
      ['ali-dornic', 'Acidímetro Dornic (leite)', 170, 218,
        P('M14 210 V150 Q14 140 26 138 H34 V126 H50 V138 H58 Q70 140 70 150 V210 Z') + T(42, 180, 'NaOH', 14)
        + fino('M42 126 V20 Q42 8 54 8 H96 Q104 8 104 12', 1.8)
        + R(96, 12, 16, 148, 3) + serie(20, 150, 10, y => fino(`M96 ${y} H${(y - 20) % 30 === 0 ? 104 : 101}`, 1.2))
        + P('M104 160 V172') + R(98, 163, 12, 6, 1, CHEIO)
        + P('M80 182 V208 Q80 212 84 212 H124 Q128 212 128 208 V182') + tra('M84 196 H124', 1.2, '4 3') + pto(104, 177, 2.2)],
      ['ali-colorimetro', 'Colorímetro de alimentos (L* a* b*)', 140, 180,
        R(30, 8, 80, 132, 14) + R(40, 18, 60, 52, 3, W(1.8)) + Tx(46, 30, 'L* 52') + Tx(46, 45, 'a* 12') + Tx(46, 60, 'b* 30')
        + C(56, 90, 7) + C(84, 90, 7) + R(56, 108, 28, 10, 4, W(1.6)) + P('M52 140 V154 H88 V140') + P('M44 154 H96 L90 172 H50 Z')],
      ['ali-espaco-lab', 'Espaço de cor CIELAB', 290, 200,
        '<g transform="translate(30 0)">' + E(110, 110, 88, 32, W(1.6)) + P('M110 186 V22') + head(110, 12, -90, 10)
        + P('M30 110 H190') + head(200, 110, 0, 10) + head(20, 110, 180, 10)
        + P('M66.6 139.5 L153.4 80.5') + head(160, 76, -34.3, 10) + head(60, 144, 145.7, 10)
        + Tx(120, 16, 'L* branco') + Tx(120, 186, 'preto') + T(220, 110, '+a*', 14) + T(-8, 110, '−a*', 14) + T(226, 128, 'vermelho', 14) + T(-6, 128, 'verde', 14)
        + T(172, 66, '+b*', 14) + T(176, 50, 'amarelo', 14) + T(48, 156, '−b*', 14) + T(48, 172, 'azul', 14) + '</g>'],
      ['ali-texturometro', 'Texturômetro', 160, 218,
        R(10, 198, 140, 16, 3) + P('M30 198 V24 M130 198 V24') + R(22, 10, 116, 16, 3) + R(30, 74, 100, 16, 2) + R(70, 90, 20, 12, 1)
        + P('M80 102 V132', W(3)) + R(66, 132, 28, 10, 2) + R(56, 168, 48, 30, 3) + seta(112, 104, 112, 132, 8, 1.8)],
      ['ali-curva-tpa', 'Curva TPA (perfil de textura)', 256, 170,
        P('M30 160 V20') + head(30, 12, -90, 10) + P('M30 120 H232') + head(240, 120, 0, 10)
        + P('M32 120 C58 118 68 30 80 26 C86 24 90 60 96 120 Q102 138 110 120 H132 C150 118 156 52 166 48 C172 46 176 74 180 120 H230')
        + T(118, 28, 'dureza', 14) + T(78, 94, 'A₁', 14) + T(164, 96, 'A₂', 14) + T(110, 152, 'adesividade', 14) + fino('M104 144 L102 132', 1.2)
        + Tx(38, 14, 'força') + T(228, 106, 'tempo', 14)],
      ['ali-phmetro-espeto', 'pHmetro de espeto (carnes e queijos)', 200, 160,
        R(14, 10, 56, 92, 10) + R(22, 20, 40, 26, 3, W(1.8)) + T(42, 33, '5,8', 15) + C(32, 62, 5, W(1.6)) + C(52, 62, 5, W(1.6)) + T(42, 84, 'pH', 14)
        + fino('M42 102 Q42 126 70 128 H100', 2) + R(100, 120, 40, 14, 5) + P('M140 122 L176 125 L190 127 L176 129 L140 132')
        + P('M148 104 L196 116 V152 H148 Z') + C(160, 142, 4, W(1.4)) + C(184, 138, 3, W(1.4)) + C(176, 146, 2.5, W(1.4))],
      ['ali-butirometro', 'Butirômetro de Gerber', 110, 210,
        R(64, 8, 12, 92, 3) + R(66, 34, 8, 30, 0, CHEIO) + serie(18, 98, 4, y => fino(`M76 ${y} H${(y - 18) % 20 === 0 ? 86 : 81}`, 1.2))
        + P('M64 100 L50 114 V176 Q50 186 60 188 H80 Q90 186 90 176 V114 L76 100') + R(58, 188, 24, 18, 4) + fino('M62 194 H78 M62 200 H78', 1.2)],
      ['ali-medidor-aw', 'Medidor de atividade de água', 210, 126,
        R(8, 14, 194, 104, 8) + R(22, 26, 90, 34, 3, W(1.8)) + T(67, 43, '0,850', 17) + T(134, 43, 'aw', 16) + C(166, 43, 7) + C(186, 43, 7)
        + R(26, 76, 158, 30, 4) + P('M60 96 H96', W(3.5)) + E(150, 88, 16, 5) + P('M134 88 V95 A16 5 0 0 0 166 95 V88')],
      ['ali-umidade-ir', 'Determinador de umidade (infravermelho)', 200, 136,
        R(8, 82, 184, 46, 6) + R(112, 94, 66, 22, 3, W(1.8)) + T(145, 105, '12,5 %', 14) + C(30, 105, 6) + C(50, 105, 6)
        + P('M18 82 Q20 30 60 24 H150 Q182 30 184 82') + tra('M50 40 H156', 2.5, '10 5')
        + fino('M70 50 q4 5 0 10 q-4 5 0 10 M104 50 q4 5 0 10 q-4 5 0 10 M138 50 q4 5 0 10 q-4 5 0 10', 1.4)
        + P('M56 76 H144', W(3)) + fino('M72 72 H128', 3) + P('M100 76 V82')],
      ['ali-penetrometro', 'Penetrômetro de frutas (firmeza)', 160, 212,
        R(68, 4, 24, 16, 4) + C(80, 60, 40) + C(80, 60, 3, CHEIO) + P('M80 60 L104 42', W(2))
        + serie(-210, 30, 30, g => { const a = g * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return fino(`M${f1(80 + 32 * c)} ${f1(60 + 32 * s)} L${f1(80 + 38 * c)} ${f1(60 + 38 * s)}`, 1.4); })
        + P('M80 100 V138', W(3)) + R(74, 138, 12, 10, 2) + C(80, 178, 30) + P('M104 158 Q118 146 124 156 Q112 166 104 158 Z', W(1.6))],
    ]],
    ['Embalagens', [
      ['ali-lata-recravacao', 'Lata com recravação dupla (detalhe)', 232, 164,
        P('M22 30 V146 M108 30 V146') + R(16, 20, 98, 12, 3) + R(16, 144, 98, 12, 3) + fino('M22 56 H108 M22 76 H108 M22 96 H108 M22 116 H108', 1.2)
        + C(110, 26, 10, ' stroke-width="1.4" stroke-dasharray="3 3"') + fino('M120 28 L144 40', 1.2) + C(182, 62, 44, W(1.6))
        + P('M146 84 H162 V30 Q162 24 168 24 H188 Q194 24 194 30 V92 Q194 98 188 98 H184 Q178 98 178 92 V52')
        + P('M170 102 V36 Q170 30 176 30 H180 Q186 30 186 36 V76')],
      ['ali-lata-espaco', 'Lata: espaço livre (headspace)', 206, 166,
        P('M24 28 V150 M100 28 V150') + R(18, 18, 88, 12, 3) + R(18, 148, 88, 12, 3) + tra('M24 52 H100', 1.6, '6 4') + hachura(24, 100, 56, 146, 14)
        + fino('M108 32 H114 V48 H108', 1.8) + Tx(118, 40, 'espaço livre')],
      ['ali-garrafa-vidro', 'Garrafa de vidro (tampa coroa)', 70, 200,
        P('M22 194 Q12 194 12 182 V96 Q12 74 28 60 V22 H42 V60 Q58 74 58 96 V182 Q58 194 48 194 Z') + P('M25 22 V12 H45 V22')
        + fino('M25 22 L27.5 18 L30 22 L32.5 18 L35 22 L37.5 18 L40 22 L42.5 18 L45 22', 1.4) + R(16, 110, 38, 44, 2, W(1.6))],
      ['ali-pote-vidro', 'Pote de vidro com tampa', 110, 132,
        R(18, 10, 74, 18, 4) + serie(26, 84, 8, x => fino(`M${x} 12 V26`, 1.2)) + P('M24 28 V36 H86 V28')
        + P('M24 36 Q12 40 12 54 V112 Q12 124 24 124 H86 Q98 124 98 112 V54 Q98 40 86 36') + tra('M14 60 H96', 1.4) + R(22, 72, 66, 36, 2, W(1.6))],
      ['ali-cartonada', 'Embalagem cartonada (longa vida)', 120, 180,
        R(14, 40, 60, 132, 1) + P('M74 40 L104 24 V156 L74 172') + P('M14 40 L44 24 H104')
        + P('M50 32 V26') + P('M68 32 V26') + E(59, 26, 9, 3.5) + P('M50 32 A9 3.5 0 0 0 68 32')
        + fino('M74 56 L89 48 L104 56', 1.2) + R(22, 80, 44, 40, 2, W(1.4))],
      ['ali-camadas-cartonada', 'Camadas da embalagem cartonada', 226, 166,
        R(10, 44, 74, 76, 1) + fino('M10 52 H84 M10 88 H84 M10 96 H84 M10 104 H84 M10 112 H84', 1.4)
        + serie(16, 76, 10, x => fino(`M${x} 86 L${x + 8} 54`, 1)) + R(10, 96, 74, 8, 0, CHEIO)
        + [[48, 'polietileno'], [70, 'cartão'], [92, 'polietileno'], [100, 'alumínio'], [108, 'polietileno'], [116, 'polietileno']]
          .map(([ym, t], i) => { const y = 20 + 26 * i; return fino(`M84 ${ym} L118 ${y}`, 1.1) + Tx(122, y, t); }).join('')
        + T(47, 30, 'fora', 14) + T(47, 136, 'dentro', 14)],
      ['ali-sache', 'Sachê', 124, 150,
        P('M14 26 Q8 75 14 124 H110 Q116 75 110 26 Z') + R(10, 10, 104, 16, 2) + R(10, 124, 104, 16, 2)
        + serie(18, 106, 8, x => fino(`M${x} 12 V24 M${x} 126 V138`, 1)) + tra('M62 26 V124', 1.4) + P('M114 14 L108 18 L114 22', W(1.8))],
      ['ali-pouch', 'Embalagem flexível em pé (pouch)', 124, 176,
        P('M20 30 V120 Q14 150 18 168 H106 Q110 150 104 120 V30') + R(18, 14, 88, 16, 2) + serie(26, 98, 8, x => fino(`M${x} 16 V28`, 1))
        + tra('M20 42 H104', 2, '3 3') + fino('M20 150 Q62 132 104 150', 1.6) + R(40, 64, 44, 40, 8, W(1.6))],
      ['ali-ondulado', 'Papelão ondulado (corte)', 200, 72,
        P('M6 14 H194 M6 58 H194', W(3)) + onda() + P('M182 54 H194', W(2))],
    ]],
  ],
};
