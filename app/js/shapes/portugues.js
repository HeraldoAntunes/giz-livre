// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Língua Portuguesa (fundamental e médio): sintaxe, morfologia, ortografia, pontuação, gêneros, semântica e comunicação.
import { T, head } from './base.js';

// ---------- utilidades locais ----------
const F = ' stroke-width="1.6"', TRAC = ' stroke-dasharray="6 5"';
const f = n => +n.toFixed(1);
const TL = (x, y, s, z = 14) => T(x, y, s, z).replace('text-anchor="middle"', 'text-anchor="start"');
const TR = (x, y, s, z = 14) => T(x, y, s, z).replace('text-anchor="middle"', 'text-anchor="end"');
const leve = t => t.replace('font-weight="600"', 'font-weight="400"');
const ita = t => leve(t).replace('<text ', '<text font-style="italic" ');
const N = (x, y, s, z = 14) => leve(T(x, y, s, z));          // texto sem negrito
const NL = (x, y, s, z = 14) => leve(TL(x, y, s, z));
const I = (x, y, s, z = 14) => ita(T(x, y, s, z));           // itálico (exemplos, rótulos secundários)
const IL = (x, y, s, z = 14) => ita(TL(x, y, s, z));
const IR = (x, y, s, z = 14) => ita(TR(x, y, s, z));
const R = (x, y, w, h, rx = 4, ext = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"${ext}/>`;
const B = (x, y, w, h, s, z = 14, ext = '') => R(x, y, w, h, 4, ext) + T(x + w / 2, y + h / 2, s, z);
const L = (d, ext = '') => `<path d="${d}"${ext}/>`;
const dot = (x, y, r = 3.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#C" stroke="none"/>`;
const ell = (cx, cy, rx, ry, ext = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${ext}/>`;
const sa = (x1, y1, x2, y2, Lh = 10, ext = '') => { // linha com ponta cheia no fim
  const a = Math.atan2(y2 - y1, x2 - x1), k = Lh * 0.7;
  return L(`M${x1} ${y1} L${f(x2 - k * Math.cos(a))} ${f(y2 - k * Math.sin(a))}`, ext) + head(x2, y2, f(a * 180 / Math.PI), Lh);
};
const sa2 = (x1, y1, x2, y2, Lh = 10) => { // seta dupla
  const a = Math.atan2(y2 - y1, x2 - x1), k = Lh * 0.7, c = Math.cos(a), s = Math.sin(a);
  return L(`M${f(x1 + k * c)} ${f(y1 + k * s)} L${f(x2 - k * c)} ${f(y2 - k * s)}`) + head(x2, y2, f(a * 180 / Math.PI), Lh) + head(x1, y1, f(a * 180 / Math.PI + 180), Lh);
};
const arco = (x1, y, x2, h, Lh = 9) => { // arco por cima, com ponta no fim (concordância, regência)
  const mx = (x1 + x2) / 2, cy = y - 2 * h, a = Math.atan2(y - cy, x2 - mx) * 180 / Math.PI;
  return L(`M${x1} ${y} Q${mx} ${cy} ${x2} ${y}`) + head(x2, y, f(a), Lh);
};
const ramos = (x0, y0, xs, y1) => { const ym = (y0 + y1) / 2;
  return L(`M${x0} ${y0} V${ym} M${Math.min(...xs)} ${ym} H${Math.max(...xs)} ` + xs.map(x => `M${x} ${ym} V${y1}`).join(' ')); };
// chave vertical: s = 1 bico para a esquerda (lista à direita); s = -1 bico para a direita
const chaveV = (x, y1, y2, s = 1, d = 8) => { const m = (y1 + y2) / 2;
  return L(`M${x + s * d} ${y1} Q${x} ${y1} ${x} ${y1 + d} V${m - d} Q${x} ${m} ${x - s * d} ${m} Q${x} ${m} ${x} ${m + d} V${y2 - d} Q${x} ${y2} ${x + s * d} ${y2}`); };
// chave horizontal com bico para baixo
const chaveH = (x1, x2, y, d = 8) => { const m = (x1 + x2) / 2;
  return L(`M${x1} ${y} Q${x1} ${y + d} ${x1 + d} ${y + d} H${m - d} Q${m} ${y + d} ${m} ${y + 2 * d} Q${m} ${y + d} ${m + d} ${y + d} H${x2 - d} Q${x2} ${y + d} ${x2} ${y}`); };
// quadro em chaves (classificação): grupos = [[título ou [linhas], [itens]], …] → [largura, altura, corpo]
const chaves = (w, tw, grupos, passo = 22) => {
  let y = 4, c = '';
  for (const [tit, itens] of grupos) {
    const h = itens.length * passo, bx = tw + 8, lin = [].concat(tit);
    c += lin.map((s, i) => T(tw / 2 + 2, y + h / 2 + (i - (lin.length - 1) / 2) * 18, s, 15)).join('');
    c += itens.length > 1 ? chaveV(bx + 8, y + 2, y + h - 2) : L(`M${bx} ${y + h / 2} H${bx + 14}`);
    c += itens.map((s, i) => NL(bx + 22, y + passo * (i + 0.5), s)).join('');
    y += h + 10;
  }
  return [w, y - 6, c];
};
// tabela: ws = larguras das colunas; cab = 1ª linha é cabeçalho; centro = texto centrado; col1 = 1ª coluna em negrito
const tabela = (x, y, ws, rh, linhas, { cab = true, centro = false, col1 = false } = {}) => {
  const W = ws.reduce((a, b) => a + b, 0), H = rh * linhas.length;
  let c = R(x, y, W, H, 3), cx = x;
  ws.slice(0, -1).forEach(w => { cx += w; c += L(`M${cx} ${y} V${y + H}`, F); });
  for (let i = 1; i < linhas.length; i++) c += L(`M${x} ${y + i * rh} H${x + W}`, i === 1 && cab ? '' : F);
  linhas.forEach((l, i) => { let xx = x; l.forEach((s, j) => {
    const forte = (i === 0 && cab) || (j === 0 && col1);
    if (s) c += (centro ? (forte ? T : N) : (forte ? TL : NL))(centro ? xx + ws[j] / 2 : xx + 7, y + i * rh + rh / 2, s, 14);
    xx += ws[j]; }); });
  return c;
};
// blocos lado a lado (sílabas, morfemas); ton = índice (ou lista) dos blocos em destaque
const blocos = (x, y, ws, h, txt, ton = [], z = 18) => { const tn = [].concat(ton); let xx = x, c = '';
  txt.forEach((s, i) => { const w = Array.isArray(ws) ? ws[i] : ws;
    c += R(xx, y, w, h, 2, tn.includes(i) ? ' stroke-width="4.5"' : '') + (s ? T(xx + w / 2, y + h / 2, s, z) : ''); xx += w; });
  return c; };
// diagrama radial: centro em elipse e nós ligados (caixa opcional); 1ª linha do nó em negrito, demais em itálico
const radial = (cx, cy, rx, ry, centro, nos, caixa = true) => {
  const cl = [].concat(centro);
  let c = ell(cx, cy, rx, ry) + cl.map((s, i) => T(cx, cy + (i - (cl.length - 1) / 2) * 17, s, 15)).join('');
  for (const [x, y, w, h, txt] of nos) {
    const dx = x - cx, dy = y - cy, t = 1 / Math.hypot(dx / rx, dy / ry);
    const s = Math.min(w / 2 / Math.abs(dx || 1e-6), h / 2 / Math.abs(dy || 1e-6)) + 0.03;
    c += L(`M${f(cx + dx * t)} ${f(cy + dy * t)} L${f(x - dx * s)} ${f(y - dy * s)}`, ' stroke-width="1.8"');
    if (caixa) c += R(x - w / 2, y - h / 2, w, h, 6);
    const tl = [].concat(txt);
    c += tl.map((q, i) => (i ? I : T)(x, y + (i - (tl.length - 1) / 2) * 17, q, 14)).join('');
  }
  return c;
};
// balões de HQ
const balao = (cx, cy, rx, ry, tx, ty, ext = '') => { // elipse com rabicho, num traço só
  const yb = d => f(cy + ry * Math.sqrt(1 - (d / rx) ** 2));
  return L(`M${cx + 4} ${yb(4)} A${rx} ${ry} 0 1 0 ${cx - 12} ${yb(12)} L${tx} ${ty} Z`, ext);
};
const nuvem = (cx, cy, rx, ry, n, k = 1.28) => { // contorno de nuvem (balão de pensamento, nuvem de palavras)
  const p = a => `${f(cx + rx * Math.cos(a))} ${f(cy + ry * Math.sin(a))}`, q = a => `${f(cx + rx * k * Math.cos(a))} ${f(cy + ry * k * Math.sin(a))}`;
  let d = `M${p(0)}`;
  for (let i = 0; i < n; i++) { const a0 = 2 * Math.PI * i / n, a1 = 2 * Math.PI * (i + 1) / n; d += ` Q${q((a0 + a1) / 2)} ${p(a1)}`; }
  return L(d + ' Z');
};
const estrela = (cx, cy, rx, ry, n, k = 0.74, cauda = null) => { // contorno serrilhado (grito, onomatopeia)
  const pts = [];
  for (let i = 0; i < 2 * n; i++) { const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? k : 1; pts.push([f(cx + rx * r * Math.cos(a)), f(cy + ry * r * Math.sin(a))]); }
  if (cauda) pts[cauda[0]] = cauda[1];
  return L('M' + pts.map(p => p.join(' ')).join(' L') + ' Z');
};
// vírgula cheia (ponto + cauda), girável: 0 = vírgula / aspas que fecham; 180 = aspas que abrem
const virg = (x, y, rot = 0, k = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><circle r="9" fill="#C" stroke="none"/><path d="M8.6 3 Q10 20 -5 30 L-7.5 27 Q2 19 -1 8.9 Z" fill="#C" stroke-width="1"/></g>`;
const pessoa = (x, y) => `<circle cx="${x}" cy="${y}" r="10"/>` + L(`M${x - 16} ${y + 36} Q${x - 16} ${y + 15} ${x} ${y + 15} Q${x + 16} ${y + 15} ${x + 16} ${y + 36}`);
// cartão de figura de linguagem: nome em cima, ícone no meio, exemplo embaixo
const card = (nome, icone, ex) => [150, 104, R(4, 4, 142, 96, 8) + T(75, 20, nome, 15) + icone + I(75, 84, ex)];

// ---------- desenhos maiores ----------
const arvore = (() => { // árvore sintática simples
  const nos = { O: [125, 16], SN: [60, 62], SV: [190, 62], Det: [30, 108], Nn: [90, 108], V: [160, 108], SN2: [220, 108] };
  const lig = [['O', 'SN'], ['O', 'SV'], ['SN', 'Det'], ['SN', 'Nn'], ['SV', 'V'], ['SV', 'SN2']];
  const rot = { O: 'O', SN: 'SN', SV: 'SV', Det: 'Det', Nn: 'N', V: 'V', SN2: 'SN' };
  return lig.map(([a, b]) => L(`M${nos[a][0]} ${nos[a][1] + 11} L${nos[b][0]} ${nos[b][1] - 11}`, ' stroke-width="2"')).join('') +
    Object.entries(nos).map(([k, [x, y]]) => T(x, y, rot[k], 16)).join('') +
    [[30, 'A'], [90, 'menina'], [160, 'leu'], [220, 'o livro']].map(([x, s]) => L(`M${x} 120 V136`, F + ' stroke-dasharray="3 4"') + I(x, 150, s, 15)).join('');
})();

const vozes = I(132, 12, 'voz ativa') + B(6, 22, 76, 32, 'Sujeito') + B(94, 22, 76, 32, 'Verbo') + B(182, 22, 76, 32, 'OD') +
  sa(44, 54, 214, 104) + sa(220, 54, 50, 104) + sa(132, 54, 132, 104, 10, TRAC) +
  B(6, 104, 76, 32, 'Sujeito') + B(94, 104, 76, 32, 'ser + part.') + B(182, 104, 76, 32, 'Agente') + I(132, 150, 'voz passiva');

const periodo = B(62, 4, 136, 32, 'Período composto') + ramos(130, 36, [58, 190], 58) +
  B(6, 58, 104, 30, 'Coordenação') + B(134, 58, 114, 30, 'Subordinação') +
  L('M20 88 V136 M20 112 H30 M20 136 H30', F) + NL(36, 112, 'assindéticas') + NL(36, 136, 'sindéticas') +
  L('M148 88 V160 M148 112 H158 M148 136 H158 M148 160 H158', F) + NL(164, 112, 'substantivas') + NL(164, 136, 'adjetivas') + NL(164, 160, 'adverbiais');

const tempos = T(78, 10, 'pretérito', 14) + chaveH(24, 132, 18, 6) + sa(6, 66, 262, 66) +
  [[44, 'cantara'], [112, 'cantei'], [168, 'canto'], [226, 'cantarei']].map(([x, v]) => L(`M${x} 58 V74`) + I(x, 46, v, 16)).join('') +
  dot(168, 66, 6) + N(44, 88, 'mais-que-') + N(44, 104, 'perfeito') + N(112, 88, 'perfeito') + T(168, 88, 'presente', 14) + N(226, 88, 'futuro');

const acentuacao = (() => {
  const x = 4, y = 4, a = 120, b = 142, hs = [26, 44, 26, 26];
  let c = R(x, y, a + b, hs.reduce((p, q) => p + q, 0), 3) + L(`M${x + a} ${y} V${y + 122}`, F), yy = y;
  const lin = [['Proparoxítonas', ['todas']], ['Paroxítonas', ['l, n, r, x, ps, ã, ão,', 'i, us, um, on, ditongo']], ['Oxítonas', ['a, e, o, em (+ s)']], ['Monossílabos', ['a, e, o (+ s)']]];
  lin.forEach(([k, v], i) => {
    if (i) c += L(`M${x} ${yy} H${x + a + b}`, F);
    c += TL(x + 7, yy + hs[i] / 2, k) + v.map((s, j) => NL(x + a + 8, yy + hs[i] / 2 + (j - (v.length - 1) / 2) * 18, s)).join('');
    yy += hs[i];
  });
  return c;
})();

const pontQuadro = (() => {
  const ws = [28, 92, 28, 108], x = 4, y = 4, rh = 28;
  const esq = [['.', 'ponto final'], [',', 'vírgula'], [':', 'dois-pontos'], ['?', 'interrogação'], ['“ ”', 'aspas']];
  const dir = [[';', 'ponto e vírgula'], ['!', 'exclamação'], ['…', 'reticências'], ['—', 'travessão'], ['( )', 'parênteses']];
  let c = R(x, y, 256, rh * 5, 3) + L(`M${x + 28} ${y} V${y + 140} M${x + 120} ${y} V${y + 140} M${x + 148} ${y} V${y + 140}`, F) + L(`M${x + 120} ${y} V${y + 140}`, ' stroke-width="2.5"');
  for (let i = 1; i < 5; i++) c += L(`M${x} ${y + i * rh} H${x + 256}`, F);
  [esq, dir].forEach((col, k) => col.forEach(([s, n], i) => {
    const x0 = x + (k ? 120 : 0), yc = y + i * rh + rh / 2;
    c += T(x0 + 14, yc, s, s.length > 1 ? 16 : 24) + NL(x0 + 36, yc, n);
  }));
  return c;
})();

const narrativa = L('M12 140 H62 L190 32 L226 104 H248', ' stroke-width="3"') + dot(62, 140, 5) + dot(190, 32, 5) + dot(226, 104, 5) +
  N(62, 158, 'situação inicial') + N(46, 124, 'conflito') + T(190, 16, 'clímax', 15) + N(226, 124, 'desfecho') +
  `<g transform="rotate(-40.2 112 76)">${I(112, 76, 'desenvolvimento')}</g>`;

const jakobson = B(83, 4, 100, 32, 'Referente') + L('M133 36 V66', TRAC + F) +
  B(4, 66, 68, 34, 'Emissor') + sa(72, 83, 92, 83, 8) + B(92, 66, 82, 34, 'Mensagem') + sa(174, 83, 194, 83, 8) + B(194, 66, 68, 34, 'Receptor') +
  L('M66 132 L118 100 M200 132 L148 100', TRAC + F) + B(4, 132, 124, 32, 'Canal') + B(138, 132, 124, 32, 'Código');
const caixa2 = (x, y, w, h, a, b) => R(x, y, w, h, 4) + T(x + w / 2, y + h / 2 - 9, a, 14) + I(x + w / 2, y + h / 2 + 10, b);
const funcoes = caixa2(73, 4, 120, 44, 'referencial', 'referente') + L('M133 48 V66', TRAC + F) +
  caixa2(4, 66, 76, 44, 'emotiva', 'emissor') + sa(80, 88, 92, 88, 8) + caixa2(92, 66, 82, 44, 'poética', 'mensagem') + sa(174, 88, 186, 88, 8) +
  caixa2(186, 66, 76, 44, 'conativa', 'receptor') + L('M64 128 L116 110 M202 128 L150 110', TRAC + F) +
  caixa2(4, 128, 120, 44, 'fática', 'canal') + caixa2(142, 128, 120, 44, 'metalinguística', 'código');

const comunic = pessoa(30, 18) + pessoa(220, 18) + R(108, 28, 34, 24, 2) + L('M108 28 L125 42 L142 28', F) +
  sa(52, 40, 102, 40) + sa(148, 40, 198, 40) + N(30, 72, 'emissor') + N(125, 72, 'mensagem') + N(220, 72, 'receptor') +
  L('M220 88 Q125 118 36 90', TRAC) + head(30, 88, -162, 10) + I(125, 120, 'resposta (retorno)');

const baloes = balao(65, 34, 46, 22, 48, 70) + N(65, 80, 'fala') +
  nuvem(195, 32, 40, 16, 9) + `<circle cx="178" cy="60" r="4.5"/><circle cx="170" cy="69" r="3"/>` + N(195, 80, 'pensamento') +
  estrela(65, 122, 52, 28, 10, 0.72, [12, [30, 164]]) + N(65, 172, 'grito') +
  balao(195, 122, 46, 22, 178, 158, ' stroke-dasharray="5 5"') + N(195, 172, 'cochicho');

const sol = `<circle cx="48" cy="47" r="8"/>` + Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4;
  return L(`M${f(48 + 12 * Math.cos(a))} ${f(47 + 12 * Math.sin(a))} L${f(48 + 17 * Math.cos(a))} ${f(47 + 17 * Math.sin(a))}`, F); }).join('');
const lua = L('M104 33 A15 15 0 1 0 104 61 A11 11 0 1 1 104 33 Z', ' fill="#C" stroke-width="1.5"');
const rosto = (x, y) => `<circle cx="${x}" cy="${y}" r="16"/>`;

const folhaRedacao = R(4, 4, 196, 244, 3) + TL(14, 24, 'Título:') + L('M68 30 H188', F) +
  Array.from({ length: 10 }, (_, i) => { const y = 64 + i * 18; return N(20, y - 7, String(i + 1)) + L(`M34 ${y} H188`, ' stroke-width="1.3"'); }).join('');

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "pt-paragrafo-plano",
        "Parágrafo — planejamento preenchível",
        520,
        158,
        "<text x=\"260\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Parágrafo — planejamento preenchível</text><rect x=\"10\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"85\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Tópico frasal</text><path d=\"M162 73 L176 73\"/><path d=\"M169 69 L176 73 L169 77\"/><text x=\"85\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">ideia: ______</text><rect x=\"180\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"255\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Desenvolvimento</text><path d=\"M332 73 L346 73\"/><path d=\"M339 69 L346 73 L339 77\"/><text x=\"255\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">evidência: _____</text><rect x=\"350\" y=\"45\" width=\"150\" height=\"56\" rx=\"3\"/><text x=\"425\" y=\"73\" font-size=\"16\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Fechamento</text><text x=\"425\" y=\"124\" font-size=\"14\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">vínculo: _____</text>"
      ],
      [
        "pt-sintaxe-modelo",
        "Análise sintática — preencher",
        540,
        224,
        "<text x=\"270\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Análise sintática — preencher</text><rect x=\"10\" y=\"42\" width=\"520\" height=\"178\" rx=\"3\"/><text x=\"75\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Trecho</text><text x=\"205\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Função</text><path d=\"M140 42 V220\"/><text x=\"335\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Núcleo</text><path d=\"M270 42 V220\"/><text x=\"465\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Relação</text><path d=\"M400 42 V220\"/><path d=\"M10 68 H530\"/><path d=\"M10 106 H530\"/><path d=\"M10 144 H530\"/><path d=\"M10 182 H530\"/>"
      ]
    ]
  ]
];

export default {
  id: 'portugues',
  nome: 'Língua Portuguesa',
  destaques: ['por-oracao-sp', 'por-arvore-sintatica', 'por-chave-oracao', 'por-classes-10', 'por-estrutura-palavra', 'por-silabas',
    'por-tonicidade', 'por-porques', 'por-crase', 'por-virgula', 'por-redacao', 'por-piramide-invertida', 'por-curva-narrativa',
    'por-jakobson', 'por-funcoes-linguagem', 'por-baloes-hq'],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Análise sintática', [
      ['por-oracao-sp', 'Oração: sujeito e predicado', 240, 108, B(70, 6, 100, 32, 'Oração', 15) + ramos(120, 38, [62, 178], 66) +
        B(10, 66, 104, 34, 'Sujeito', 15) + B(126, 66, 104, 34, 'Predicado', 15)],
      ['por-arvore-sintatica', 'Árvore sintática (SN, SV)', 250, 162, arvore],
      ['por-chave-oracao', 'Chaves: sujeito | predicado', 260, 80, L('M8 30 H96 M112 30 H252', F + ' stroke-dasharray="2 6"') + L('M104 12 V38', ' stroke-width="2"') +
        chaveH(8, 96, 36) + T(52, 68, 'sujeito', 15) + chaveH(112, 252, 36) + T(182, 68, 'predicado', 15)],
      ['por-sujeito-tipos', 'Tipos de sujeito', ...chaves(230, 70, [['Sujeito', ['simples', 'composto', 'oculto (desinencial)', 'indeterminado', 'oração sem sujeito']]])],
      ['por-predicado-tipos', 'Tipos de predicado', ...chaves(210, 84, [['Predicado', ['verbal', 'nominal', 'verbo-nominal']]], 24)],
      ['por-termos-oracao', 'Termos da oração', ...chaves(250, 92, [['Essenciais', ['sujeito', 'predicado']], ['Integrantes', ['objeto direto', 'objeto indireto', 'compl. nominal', 'agente da passiva']],
        ['Acessórios', ['adj. adnominal', 'adj. adverbial', 'aposto']], ['Isolado', ['vocativo']]], 21)],
      ['por-sublinhado', 'Convenção de sublinhado', 210, 116, L('M8 18 H84') + NL(96, 18, 'sujeito') + L('M8 43 H84 M8 49 H84') + NL(96, 46, 'verbo') +
        L('M8 74 q6 -6 12 0 t12 0 t12 0 t12 0 t12 0 t12 0') + NL(96, 74, 'complemento') + L('M8 102 H84', ' stroke-dasharray="7 5"') + NL(96, 102, 'adjunto')],
      ['por-concordancia', 'Setas de concordância', 260, 90, T(30, 72, 'Os', 18) + T(92, 72, 'alunos', 18) + T(196, 72, 'chegaram.', 18) +
        arco(92, 56, 30, 16) + arco(92, 56, 190, 20) + N(58, 24, 'gên. e nº') + N(144, 22, 'nº e pessoa')],
      ['por-regencia', 'Seta de regência', 250, 112, T(52, 72, 'Assisti', 18) + T(124, 72, 'ao', 18) + T(180, 72, 'filme.', 18) + ell(124, 72, 18, 14, F) +
        arco(52, 56, 118, 18) + N(86, 22, 'exige a preposição “a”') + I(125, 102, 'assistir (= ver) é VTI')],
      ['por-vozes-verbais', 'Voz ativa → voz passiva', 264, 167, "<g transform=\"translate(0.00 2.50)\">" + (vozes) + "</g>"],
      ['por-periodo-composto', 'Período composto', 254, 170, periodo],
      ['por-coordenadas', 'Orações coordenadas', ...chaves(270, 96, [['Assindética', ['sem conjunção']], ['Sindéticas', ['aditivas (e, nem)', 'adversativas (mas)', 'alternativas (ou… ou)', 'conclusivas (logo)', 'explicativas (pois)']]])],
      ['por-sub-substantivas', 'Subordinadas substantivas', ...chaves(270, 102, [['Substantivas', ['subjetivas', 'objetivas diretas', 'objetivas indiretas', 'completivas nominais', 'predicativas', 'apositivas']]])],
      ['por-sub-adjetivas', 'Subordinadas adjetivas', ...chaves(200, 84, [['Adjetivas', ['restritivas', 'explicativas']]], 24)],
      ['por-sub-adverbiais', 'Subordinadas adverbiais', 250, 254, T(127, 14, 'Subordinadas adverbiais', 15) +
        tabela(4, 28, [120, 122], 20, [['tipo', 'conjunção'], ['causal', 'porque'], ['consecutiva', 'que (tão… que)'], ['condicional', 'se, caso'], ['concessiva', 'embora'],
          ['comparativa', 'como'], ['conformativa', 'conforme'], ['final', 'para que'], ['proporcional', 'à medida que'], ['temporal', 'quando']])],
      ['por-oracoes-coord', 'Coordenação: oração + oração', 260, 84, B(4, 10, 96, 36, 'Oração 1') + R(108, 14, 44, 28, 14, TRAC + F) + I(130, 28, 'e') +
        B(160, 10, 96, 36, 'Oração 2') + N(130, 68, 'conjunção: e, mas, ou, logo, pois')],
      ['por-oracao-principal', 'Principal + subordinada', 240, 124, B(20, 6, 200, 34, 'Oração principal', 15) + sa(120, 40, 120, 84) + IL(128, 62, 'conectivo') +
        B(20, 84, 200, 34, 'Oração subordinada', 15, TRAC)],
    ]],
    ['Morfologia', [
      ['por-classes-10', 'As 10 classes de palavras', 256, 162, tabela(4, 4, [124, 124], 22, [['Variáveis', 'Invariáveis'], ['substantivo', 'advérbio'], ['artigo', 'preposição'],
        ['adjetivo', 'conjunção'], ['numeral', 'interjeição'], ['pronome', ''], ['verbo', '']], { centro: true })],
      ['por-estrutura-palavra', 'Estrutura: prefixo + radical + sufixo', 250, 104, blocos(36, 12, [40, 72, 66], 38, ['in', 'feliz', 'mente'], [], 20) +
        L('M56 50 V62 M112 50 V82 M181 50 V62', F) + N(56, 72, 'prefixo') + N(112, 92, 'radical') + N(181, 72, 'sufixo')],
      ['por-estrutura-verbo', 'Estrutura do verbo (cant-á-va-mos)', 250, 140, blocos(42, 12, [54, 28, 36, 48], 38, ['cant', 'á', 'va', 'mos'], [], 20) +
        L('M69 50 V62 M110 50 V82 M142 50 V62 M184 50 V82', F) + N(69, 72, 'radical') + N(110, 92, 'VT') + N(142, 72, 'DMT') + N(184, 92, 'DNP') +
        I(125, 112, 'VT: vogal temática · DMT: modo-tempo') + I(125, 130, 'DNP: número-pessoa')],
      ['por-familia-palavras', 'Família de palavras (radical)', 254, 144, radial(127, 72, 38, 20, 'terr-',
        [[44, 20, 60, 22, 'terra'], [210, 20, 70, 22, 'terreno'], [30, 72, 60, 22, 'aterrar'], [222, 72, 64, 22, 'enterrar'], [44, 126, 60, 22, 'térreo'], [210, 126, 74, 22, 'terrestre']], false)],
      ['por-formacao-palavras', 'Formação de palavras', ...chaves(250, 92, [['Derivação', ['prefixal', 'sufixal', 'prefixal e sufixal', 'parassintética', 'regressiva', 'imprópria']], ['Composição', ['justaposição', 'aglutinação']]])],
      ['por-composicao', 'Justaposição × aglutinação', 250, 104, I(125, 16, 'justaposição') + N(125, 40, 'guarda + chuva → guarda-chuva', 16) +
        I(125, 68, 'aglutinação') + N(125, 92, 'plano + alto → planalto', 16)],
      ['por-flexao-substantivo', 'Flexão do substantivo', 250, 120, B(75, 6, 100, 32, 'Substantivo') + ramos(125, 38, [45, 125, 205], 62) +
        B(8, 62, 74, 30, 'gênero') + B(88, 62, 74, 30, 'número') + B(168, 62, 74, 30, 'grau') + N(45, 108, 'masc./fem.') + N(125, 108, 'sing./pl.') + N(205, 108, 'aum./dim.')],
      ['por-flexao-verbo', 'Flexões do verbo', 260, 154, radial(130, 78, 40, 22, 'Verbo',
        [[66, 20, 76, 28, 'pessoa'], [194, 20, 76, 28, 'número'], [42, 78, 76, 28, 'tempo'], [218, 78, 76, 28, 'modo'], [130, 136, 76, 28, 'voz']])],
      ['por-modos-verbais', 'Modos verbais e formas nominais', ...chaves(250, 76, [['Modos', ['indicativo: certeza', 'subjuntivo: hipótese', 'imperativo: ordem']], [['Formas', 'nominais'], ['infinitivo: cantar', 'gerúndio: cantando', 'particípio: cantado']]])],
      ['por-tempos-verbais', 'Linha do tempo verbal', 268, 123, "<g transform=\"translate(0.00 4.50)\">" + (tempos) + "</g>"],
      ['por-pronomes-pessoais', 'Pronomes pessoais (pessoas)', 264, 112, tabela(4, 4, [62, 90, 104], 26, [['Pessoa', 'Singular', 'Plural'], ['1ª', 'eu', 'nós'], ['2ª', 'tu', 'vós'], ['3ª', 'ele / ela', 'eles / elas']], { centro: true, col1: true })],
      ['por-grau-adjetivo', 'Grau do adjetivo (degraus)', 252, 126, L('M6 120 V90 H86 V60 H166 V30 H246 V120 Z') + L('M86 90 V120 M166 60 V120', F) +
        T(46, 105, 'bom', 16) + T(126, 105, 'melhor', 16) + T(206, 105, 'ótimo', 16) + I(46, 78, 'normal') + I(126, 48, 'comparativo') + I(206, 18, 'superlativo')],
      ['por-substantivo-tipos', 'Classificação do substantivo', 248, 112, tabela(4, 4, [100, 40, 100], 26, [['comum', '×', 'próprio'], ['concreto', '×', 'abstrato'], ['simples', '×', 'composto'], ['primitivo', '×', 'derivado']], { cab: false, centro: true })],
    ]],
    ['Fonologia e ortografia', [
      ['por-silabas', 'Divisão silábica (bor-bo-le-ta)', 250, 94, head(152, 20, 90, 10) + blocos(17, 24, 54, 38, ['bor', 'bo', 'le', 'ta'], 2) + I(125, 82, 'polissílaba · paroxítona')],
      ['por-silabas-vazias', 'Blocos de sílabas (vazios)', 250, 60, blocos(10, 8, 46, 44, ['', '', '', '', ''])],
      ['por-tonicidade', 'Oxítona, paroxítona, proparoxítona', 254, 130,
        [['proparoxítona', ['lâm', 'pa', 'da'], 0], ['paroxítona', ['ca', 'der', 'no'], 1], ['oxítona', ['pa', 'le', 'tó'], 2]].map(([n, s, t], i) =>
          TL(6, 23 + i * 42, n) + blocos(116, 6 + i * 42, 44, 34, s, t)).join('')],
      ['por-classif-silabas', 'Mono, di, tri e polissílaba', 250, 136,
        [['monossílaba', 1], ['dissílaba', 2], ['trissílaba', 3], ['polissílaba', 4]].map(([n, k], i) =>
          TL(6, 21 + i * 32, n) + blocos(110, 8 + i * 32, 30, 26, Array(k).fill(''), [], 14) + (k === 4 ? T(236, 21 + i * 32, '…', 18) : '')).join('')],
      ['por-encontros-vocalicos', 'Ditongo, tritongo e hiato', 230, 130,
        [['ditongo', [52, 40], ['cai', 'xa'], 0], ['tritongo', [40, 40, 58], ['Pa', 'ra', 'guai'], 2], ['hiato', 40, ['sa', 'ú', 'de'], [0, 1]]].map(([n, w, s, t], i) =>
          TL(6, 23 + i * 42, n) + blocos(86, 6 + i * 42, w, 34, s, t)).join('')],
      ['por-digrafos', 'Dígrafos', 232, 142, blocos(6, 6, 44, 32, ['ch', 'lh', 'nh', 'rr', 'ss']) + blocos(6, 38, 44, 32, ['sc', 'sç', 'xc', 'qu', 'gu']) +
        blocos(6, 84, 44, 32, ['am', 'en', 'im', 'on', 'um']) + I(116, 132, 'dígrafos vocálicos (nasais)')],
      ['por-acento-agudo', 'Acento agudo (´)', 100, 128, "<g transform=\"translate(0.00 1.00)\">" + (T(50, 64, 'e', 76) + L('M44 28 L58 4 L69 8 L50 31 Z', ' fill="#C" stroke-width="1.5"') + N(50, 112, 'agudo')) + "</g>"],
      ['por-acento-circunflexo', 'Acento circunflexo (^)', 100, 127, "<g transform=\"translate(0.00 0.00)\">" + (T(50, 64, 'e', 76) + L('M34 28 L50 8 L66 28', ' stroke-width="6"') + N(50, 112, 'circunflexo')) + "</g>"],
      ['por-til', 'Til (~)', 100, 127, "<g transform=\"translate(0.00 0.00)\">" + (T(50, 64, 'a', 76) + L('M32 24 Q40 10 50 18 T68 14', ' stroke-width="6"') + N(50, 112, 'til')) + "</g>"],
      ['por-acento-grave', 'Acento grave (`) — crase', 100, 128, "<g transform=\"translate(0.00 1.00)\">" + (T(50, 64, 'a', 76) + L('M56 28 L42 4 L31 8 L50 31 Z', ' fill="#C" stroke-width="1.5"') + N(50, 112, 'grave (crase)')) + "</g>"],
      ['por-cedilha', 'Cedilha (ç)', 100, 129, "<g transform=\"translate(0.00 0.00)\">" + (T(50, 56, 'c', 76) + L('M52 82 V88 Q63 88 61 95 Q59 100 46 98', ' stroke-width="5"') + N(50, 114, 'cedilha')) + "</g>"],
      ['por-crase', 'Crase: a + a = à', 260, 110, B(28, 10, 44, 44, 'a', 26) + T(90, 32, '+', 22) + B(108, 10, 44, 44, 'a', 26) + T(170, 32, '=', 22) +
        B(188, 10, 44, 44, 'à', 26, ' stroke-width="4.5"') + N(50, 72, 'preposição') + N(130, 72, 'artigo') + N(210, 72, 'crase') + I(130, 98, 'vou a + a praia → vou à praia')],
      ['por-crase-troca', 'Teste da crase (trocar por masculino)', 250, 116, T(125, 20, 'à escola', 18) + sa2(125, 34, 125, 62) + T(125, 76, 'ao colégio', 18) +
        IL(140, 48, 'troque') + I(125, 104, 'virou “ao”? então tem crase')],
      ['por-acentuacao-regras', 'Regras de acentuação', 270, 130, acentuacao],
      ['por-porques', 'Os porquês', 264, 120, tabela(4, 4, [80, 176], 28, [['por que', 'pergunta; “pelo qual”'], ['por quê', 'no fim da frase'], ['porque', 'explicação (= pois)'], ['porquê', 'substantivo (o motivo)']], { cab: false, col1: true })],
      ['por-mal-mau', 'Mal × mau', 250, 92, R(6, 6, 116, 80) + R(128, 6, 116, 80) + T(64, 28, 'mal', 24) + N(64, 54, 'oposto: bem') + I(64, 74, 'advérbio') +
        T(186, 28, 'mau', 24) + N(186, 54, 'oposto: bom') + I(186, 74, 'adjetivo')],
    ]],
    ['Pontuação', [
      ['por-ponto', 'Ponto final (.)', 40, 110, dot(20, 78, 9)],
      ['por-virgula', 'Vírgula (,)', 50, 110, virg(24, 78)],
      ['por-ponto-virgula', 'Ponto e vírgula (;)', 50, 110, dot(24, 42, 9) + virg(24, 78)],
      ['por-dois-pontos', 'Dois-pontos (:)', 40, 110, dot(20, 42, 9) + dot(20, 78, 9)],
      ['por-interrogacao', 'Ponto de interrogação (?)', 76, 110, L('M18 32 Q18 12 38 12 Q58 12 58 30 Q58 44 44 50 Q38 53 38 62', ' stroke-width="9"') + dot(38, 80, 7)],
      ['por-exclamacao', 'Ponto de exclamação (!)', 40, 110, L('M12 12 H28 L24 62 H16 Z', ' fill="#C"') + dot(20, 80, 7.5)],
      ['por-reticencias', 'Reticências (…)', 90, 110, dot(18, 78, 7.5) + dot(45, 78, 7.5) + dot(72, 78, 7.5)],
      ['por-travessao', 'Travessão (—)', 120, 110, R(8, 50, 104, 8, 2, ' fill="#C"')],
      ['por-aspas', 'Aspas (“ ”)', 130, 110, virg(26, 40, 180) + virg(52, 40, 180) + virg(80, 24) + virg(106, 24)],
      ['por-parenteses', 'Parênteses ( )', 100, 110, L('M30 10 Q8 55 30 100 M70 10 Q92 55 70 100', ' stroke-width="7"')],
      ['por-hifen-travessao', 'Hífen × travessão', 256, 90, R(10, 25, 18, 6, 1, ' fill="#C"') + NL(80, 28, 'hífen: guarda-chuva') +
        R(10, 61, 58, 6, 1, ' fill="#C"') + NL(80, 64, 'travessão: fala, destaque')],
      ['por-pontuacao-quadro', 'Quadro dos sinais de pontuação', 264, 148, pontQuadro],
      ['por-virgula-sentido', 'A vírgula muda o sentido', 230, 106, TL(8, 22, 'Vamos comer, crianças!', 16) + IL(8, 44, '→ chamando as crianças') +
        TL(8, 74, 'Vamos comer crianças!', 16) + IL(8, 96, '→ sem vírgula… que susto!')],
      ['por-dialogo', 'Diálogo com travessão', 260, 88, NL(8, 22, '— Bom dia! — disse a professora.', 15) + NL(8, 48, '— Bom dia! — responderam todos.', 15) +
        IL(8, 76, 'o travessão marca a fala do personagem')],
    ]],
    ['Texto e gêneros', [
      ['por-redacao', 'Redação dissertativa (estrutura)', 220, 240, R(4, 4, 212, 232, 3) +
        R(14, 14, 192, 46) + T(110, 30, 'Introdução', 15) + I(110, 48, 'contexto + tese') +
        R(14, 68, 192, 46) + T(110, 84, 'Desenvolvimento 1', 15) + I(110, 102, 'argumento + exemplo') +
        R(14, 122, 192, 46) + T(110, 138, 'Desenvolvimento 2', 15) + I(110, 156, 'argumento + dados') +
        R(14, 176, 192, 50) + T(110, 194, 'Conclusão', 15) + I(110, 212, 'retomada + proposta')],
      ['por-paragrafo', 'Estrutura do parágrafo', 256, 164, I(20, 12, 'recuo') + sa(8, 34, 30, 34, 7) +
        L('M34 34 H116 M8 52 H116 M8 74 H116 M8 92 H116 M8 110 H116 M8 132 H116 M8 150 H76', ' stroke-width="2"') +
        chaveV(130, 26, 60, -1) + chaveV(130, 66, 118, -1) + chaveV(130, 124, 158, -1) +
        NL(146, 34, 'tópico') + NL(146, 52, 'frasal') + NL(146, 92, 'desenvolvimento') + NL(146, 141, 'conclusão')],
      ['por-piramide-invertida', 'Pirâmide invertida (notícia)', 260, 192, L('M6 6 H254 L130 186 Z') + L('M54 76 H206 M87 124 H173', F) +
        T(130, 26, 'Lide', 17) + N(130, 46, 'quem? o quê?') + N(130, 62, 'quando? onde?') + T(130, 92, 'Corpo', 16) + I(130, 110, 'contexto') + N(130, 140, 'detalhes')],
      ['por-lide', 'Lide: as 6 perguntas', 250, 160, radial(125, 80, 28, 28, 'Lide',
        [[125, 16, 60, 20, 'O quê?'], [212, 46, 60, 20, 'Quem?'], [212, 114, 70, 20, 'Quando?'], [125, 146, 56, 20, 'Onde?'], [38, 114, 56, 20, 'Como?'], [38, 46, 70, 20, 'Por quê?']], false)],
      ['por-noticia', 'Notícia (diagramação)', 200, 240, R(4, 4, 192, 232, 3) + T(100, 26, 'MANCHETE', 18) + I(100, 48, 'linha fina') + L('M14 60 H186', F) +
        R(14, 70, 90, 62, 2) + L('M14 70 L104 132 M104 70 L14 132', ' stroke-width="1.2"') +
        L([74, 86, 98, 110, 122, 134].map(y => `M112 ${y} H186`).join(' ') + ' ' + [156, 168, 180, 192, 204, 216].map(y => `M14 ${y} H96 M104 ${y} H186`).join(' '), ' stroke-width="1.4"')],
      ['por-carta', 'Carta (estrutura)', 200, 240, R(4, 4, 192, 232, 3) + IR(184, 24, 'Local e data') + IL(16, 50, 'Vocativo,') +
        L('M34 74 H184 M16 90 H184 M16 106 H184 M16 122 H184 M16 138 H184 M16 154 H120', ' stroke-width="1.4"') +
        IL(16, 178, 'Despedida,') + L('M96 206 H184', F) + I(140, 222, 'assinatura')],
      ['por-email', 'E-mail (estrutura)', 240, 180, R(4, 4, 232, 172, 6) + L('M4 28 H236') + [16, 26, 36].map(x => `<circle cx="${x}" cy="16" r="3"${F}/>`).join('') +
        NL(14, 46, 'Para:') + L('M56 52 H226', F) + NL(14, 72, 'Assunto:') + L('M80 78 H226', F) + L('M4 88 H236', F) +
        L('M14 104 H226 M14 118 H226 M14 132 H150', ' stroke-width="1.4"') + B(14, 144, 70, 24, 'Enviar')],
      ['por-poema', 'Poema: estrofe, verso e rima', 252, 188,
        L([[16, 130], [34, 112], [52, 138], [70, 104], [100, 126], [118, 108], [136, 134], [154, 100]].map(([y, x]) => `M10 ${y} H${x}`).join(' '), ' stroke-width="2"') +
        ['A', 'B', 'A', 'B', 'C', 'D', 'C', 'D'].map((s, i) => N(158, [16, 34, 52, 70, 100, 118, 136, 154][i], s)).join('') +
        chaveV(180, 8, 78, -1) + NL(194, 43, 'estrofe') + sa(206, 136, 168, 136, 8) + NL(210, 136, 'verso') + I(158, 178, 'rima')],
      ['por-soneto', 'Soneto (4 + 4 + 3 + 3)', 230, 190,
        L([12, 22, 32, 42, 56, 66, 76, 86, 100, 110, 120, 134, 144, 154].map((y, i) => `M10 ${y} H${[128, 116, 124, 110][i % 4]}`).join(' '), ' stroke-width="2"') +
        [[6, 48, 'quarteto'], [50, 92, 'quarteto'], [94, 126, 'terceto'], [128, 160, 'terceto']].map(([a, b, s]) => chaveV(144, a, b, -1) + NL(160, (a + b) / 2, s)).join('') +
        I(115, 180, 'soneto: 14 versos')],
      ['por-hq-pagina', 'Página de HQ (quadros)', 200, 240, R(4, 4, 192, 232, 3) + R(12, 12, 84, 74, 1) + R(104, 12, 84, 74, 1) + R(12, 94, 176, 60, 1) +
        R(12, 162, 108, 66, 1) + R(128, 162, 60, 66, 1) + balao(52, 32, 28, 12, 42, 58, F)],
      ['por-baloes-hq', 'Balões de HQ (tipos)', 260, 187, "<g transform=\"translate(0.00 0.00)\">" + (baloes) + "</g>"],
      ['por-balao-grito', 'Balão de grito', 150, 110, estrela(75, 48, 66, 40, 11, 0.76, [14, [36, 104]])],
      ['por-balao-cochicho', 'Balão de cochicho', 150, 100, balao(75, 42, 66, 34, 50, 94, ' stroke-dasharray="6 6"')],
      ['por-recordatorio', 'Recordatório (legenda de HQ)', 170, 60, R(4, 4, 162, 52, 2) + I(85, 30, 'Enquanto isso…', 16)],
      ['por-onomatopeia', 'Onomatopeia (BUM!)', 150, 110, estrela(75, 55, 70, 50, 12, 0.7) + T(75, 56, 'BUM!', 26)],
      ['por-roteiro', 'Roteiro (cena)', 200, 240, R(4, 4, 192, 232, 3) + TL(14, 22, 'CENA 1 – SALA – DIA') +
        L('M14 40 H186 M14 54 H150', ' stroke-width="1.4"') + T(100, 74, 'ANA', 15) + I(100, 92, '(sorrindo)') + L('M52 108 H148 M52 122 H130', ' stroke-width="1.4"') +
        T(100, 146, 'JOÃO', 15) + L('M52 162 H148 M52 176 H120', ' stroke-width="1.4"') + TR(186, 214, 'CORTA PARA:')],
      ['por-receita', 'Receita (texto instrucional)', 190, 200, R(4, 4, 182, 192, 4) + TL(14, 24, 'Ingredientes', 15) +
        [44, 60, 76].map(y => dot(20, y, 3) + L(`M30 ${y} H150`, ' stroke-width="1.4"')).join('') + TL(14, 104, 'Modo de preparo', 15) +
        [124, 148, 172].map((y, i) => N(20, y, `${i + 1}.`) + L(`M32 ${y + 2} H${[172, 160, 140][i]}`, ' stroke-width="1.4"')).join('')],
      ['por-curva-narrativa', 'Curva da narrativa', 260, 168, narrativa],
      ['por-elementos-narrativa', 'Elementos da narrativa', 252, 152, radial(126, 82, 50, 22, 'Narrativa',
        [[126, 17, 84, 26, 'narrador'], [52, 50, 96, 26, 'personagens'], [206, 50, 80, 26, 'enredo'], [52, 128, 70, 26, 'tempo'], [200, 128, 70, 26, 'espaço']])],
      ['por-narrador', 'Tipos de narrador', ...chaves(260, 80, [['Narrador', ['1ª pessoa: personagem', '3ª pessoa: observador', '3ª pessoa: onisciente']]], 24)],
      ['por-discurso', 'Discurso direto × indireto', 260, 116, R(4, 4, 252, 50, 4) + TL(14, 20, 'Discurso direto') + IL(14, 40, '— Eu vou — disse Ana.', 15) +
        R(4, 62, 252, 50, 4) + TL(14, 78, 'Discurso indireto') + IL(14, 98, 'Ana disse que ia.', 15)],
      ['por-tipos-textuais', 'Tipos textuais', ...chaves(256, 76, [[['Tipos', 'textuais'], ['narração (conto)', 'descrição (retrato)', 'argumentação (artigo)', 'exposição (verbete)', 'injunção (receita)']]])],
      ['por-argumentacao', 'Tese, argumentos e conclusão', 250, 168, B(65, 6, 120, 34, 'Tese', 15) + sa(110, 40, 63, 66) + sa(140, 40, 187, 66) +
        B(6, 66, 114, 34, 'Argumento 1') + B(130, 66, 114, 34, 'Argumento 2') + sa(63, 100, 110, 128) + sa(187, 100, 140, 128) + B(65, 128, 120, 34, 'Conclusão', 15)],
    ]],
    ['Semântica e estilo', [
      ['por-sinonimos', 'Sinônimos (=)', 240, 76, B(6, 14, 82, 34, 'alegre', 15) + B(152, 14, 82, 34, 'feliz', 15) + sa2(94, 31, 146, 31, 9) + T(120, 16, '=', 18) + I(120, 66, 'sinônimos')],
      ['por-antonimos', 'Antônimos (≠)', 240, 76, B(6, 14, 82, 34, 'claro', 15) + B(152, 14, 82, 34, 'escuro', 15) + sa2(94, 31, 146, 31, 9) + T(120, 16, '≠', 18) + I(120, 66, 'antônimos')],
      ['por-polissemia', 'Polissemia (vários sentidos)', 250, 146, ell(125, 24, 40, 18) + T(125, 24, 'pena', 17) + ramos(125, 42, [45, 125, 205], 80) +
        B(8, 80, 74, 30, 'pluma') + B(88, 80, 74, 30, 'castigo') + B(168, 80, 74, 30, 'dó') + I(125, 134, 'uma palavra, vários sentidos')],
      ['por-homonimos', 'Homônimos', 264, 92, tabela(4, 4, [100, 156], 28, [['homófonos', 'cela × sela'], ['homógrafos', 'gosto (ô) × gosto (ó)'], ['perfeitos', 'rio (verbo) × rio (s.)']], { cab: false, col1: true })],
      ['por-paronimos', 'Parônimos', 220, 120, tabela(4, 4, [212], 28, [['Parônimos'], ['comprimento × cumprimento'], ['descrição × discrição'], ['eminente × iminente']], { centro: true })],
      ['por-hiperonimo', 'Hiperônimo e hipônimos', 258, 112, IL(6, 24, 'hiperônimo') + IL(6, 90, 'hipônimos') + B(140, 8, 60, 32, 'flor', 16) + ramos(170, 40, [112, 170, 228], 74) +
        B(86, 74, 52, 30, 'rosa') + B(144, 74, 52, 30, 'cravo') + B(202, 74, 52, 30, 'lírio')],
      ['por-denotacao', 'Denotação × conotação', 264, 104, R(4, 4, 124, 96) + R(136, 4, 124, 96) + T(66, 24, 'Denotação', 15) + N(66, 48, 'sentido literal') + I(66, 76, 'coração: órgão') +
        T(198, 24, 'Conotação', 15) + N(198, 48, 'sentido figurado') + I(198, 76, 'coração: afeto')],
      ['por-metafora', 'Metáfora', ...card('Metáfora', R(38, 36, 22, 22, 2) + T(75, 47, '=', 20) + `<circle cx="102" cy="47" r="11"/>`, 'Ela é uma flor.')],
      ['por-comparacao', 'Comparação (símile)', ...card('Comparação', R(26, 36, 22, 22, 2) + I(75, 47, 'como') + `<circle cx="114" cy="47" r="11"/>`, 'Ágil como um gato.')],
      ['por-hiperbole', 'Hipérbole (exagero)', ...card('Hipérbole', `<circle cx="42" cy="52" r="5"/>` + sa(52, 50, 80, 46, 9) + `<circle cx="104" cy="46" r="16"/>`, 'Já falei mil vezes!')],
      ['por-antitese', 'Antítese (opostos)', ...card('Antítese', sol + T(75, 47, '×', 18) + lua, 'Do riso ao choro.')],
      ['por-personificacao', 'Personificação (prosopopeia)', ...card('Personificação', rosto(75, 47) + dot(69, 43, 2.2) + dot(81, 43, 2.2) + L('M68 52 Q75 58 82 52', F) +
        L('M24 40 q6 -5 12 0 t12 0 M24 52 q6 -5 12 0 t12 0', F), 'O vento sussurrou.')],
      ['por-ironia', 'Ironia', ...card('Ironia', rosto(75, 47) + dot(69, 43, 2.2) + L('M78 43 H85', F) + L('M67 53 Q76 57 83 50', F), 'Que pontualidade!')],
      ['por-eufemismo', 'Eufemismo (suavização)', ...card('Eufemismo', L('M60 64 Q62 40 92 30 Q90 52 60 64 Z M60 64 L52 72 M64 58 L84 38', F), 'Ele nos deixou.')],
      ['por-onomatopeia-fig', 'Onomatopeia (figura)', ...card('Onomatopeia', R(52, 40, 12, 14, 1, F) + L('M64 40 L76 31 V63 L64 54', F) + L('M84 38 Q90 47 84 56 M90 33 Q99 47 90 61', F), 'Tic-tac, tic-tac.')],
      ['por-aliteracao', 'Aliteração', ...card('Aliteração', T(75, 47, 'r · r · r', 20), 'O rato roeu a roupa.')],
      ['por-metonimia', 'Metonímia', ...card('Metonímia', R(34, 34, 22, 28, 2, F) + L('M38 34 V62', F) + sa(62, 48, 84, 48, 8) + `<circle cx="104" cy="40" r="6"${F}/>` + L('M93 62 Q93 50 104 50 Q115 50 115 62', F), 'Li Machado de Assis.')],
    ]],
    ['Comunicação', [
      ['por-jakobson', 'Elementos da comunicação (Jakobson)', 266, 168, jakobson],
      ['por-funcoes-linguagem', 'Funções da linguagem', 266, 176, funcoes],
      ['por-comunicacao', 'Emissor → mensagem → receptor', 250, 130, comunic],
      ['por-variacao', 'Variação linguística', 260, 172, radial(130, 86, 58, 26, ['Variação', 'linguística'],
        [[56, 22, 104, 40, ['regional', 'diatópica']], [204, 22, 104, 40, ['social', 'diastrática']], [56, 150, 104, 40, ['situacional', 'diafásica']], [204, 150, 104, 40, ['histórica', 'diacrônica']]])],
      ['por-formal-informal', 'Registro: formal ↔ informal', 260, 102, TL(8, 18, 'formal', 15) + TR(252, 18, 'informal', 15) + sa2(10, 44, 250, 44, 10) +
        dot(40, 44, 4) + dot(130, 44, 4) + dot(220, 44, 4) + IL(8, 70, 'Prezado senhor,') + IR(252, 70, 'E aí, beleza?') + I(130, 92, 'Olá, tudo bem?')],
      ['por-verbal-naoverbal', 'Linguagem verbal, não verbal e mista', 264, 108, R(4, 4, 80, 100, 6) + R(92, 4, 80, 100, 6) + R(180, 4, 80, 100, 6) +
        T(44, 34, 'Aa', 22) + L('M18 56 H70 M18 66 H70 M18 76 H54', F) + N(44, 92, 'verbal') +
        L('M132 18 L156 62 H108 Z') + T(132, 48, '!', 18) + N(132, 92, 'não verbal') +
        L('M210 22 H230 L242 34 V54 L230 66 H210 L198 54 V34 Z') + T(220, 44, 'PARE', 14) + N(220, 92, 'mista')],
    ]],
    ['Recursos de aula', [
      ['por-dicionario', 'Dicionário', 146, 170, R(22, 8, 108, 154, 4) + L('M34 8 V162') + T(82, 52, 'Dicionário', 15) + T(82, 96, 'A–Z', 24) +
        [24, 52, 80, 108, 136].map(y => R(130, y, 8, 18, 2, F)).join('')],
      ['por-livro-aberto', 'Livro aberto', 220, 146, L('M110 30 Q66 14 12 24 V126 Q66 116 110 132 Z M110 30 Q154 14 208 24 V126 Q154 116 110 132 Z') +
        L('M4 32 V134 Q60 126 110 140 Q160 126 216 134 V32', F) +
        L([44, 58, 72, 86, 100].map(y => `M24 ${y} H98 M122 ${y} H196`).join(' '), ' stroke-width="1.4"')],
      ['por-caderno-pautado', 'Caderno pautado', 180, 220, R(28, 6, 146, 208, 3) + [24, 50, 76, 102, 128, 154, 180].map(y => ell(28, y, 10, 4, F)).join('') +
        L([40, 56, 72, 88, 104, 120, 136, 152, 168, 184, 200].map(y => `M28 ${y} H174`).join(' '), ' stroke-width="1.2"') + L('M56 6 V214', F)],
      ['por-folha-redacao', 'Folha de redação (numerada)', 204, 252, folhaRedacao],
      ['por-ficha-leitura', 'Ficha de leitura', 220, 192, R(4, 4, 212, 184, 6) + T(110, 22, 'Ficha de leitura', 15) + L('M4 38 H216') +
        [['Título:', 56, 72], ['Autor:', 80, 66], ['Gênero:', 104, 76], ['Personagens:', 128, 110], ['Resumo:', 152, 82]].map(([s, y, x]) => TL(14, y, s) + L(`M${x} ${y + 6} H206`, F)).join('') +
        L('M14 176 H206', F)],
      ['por-nuvem-palavras', 'Nuvem de palavras (vazia)', 240, 150, nuvem(120, 76, 92, 50, 11, 1.22) +
        L('M86 72 H156', ' stroke-width="8"') + L('M60 52 H104 M134 98 H178', ' stroke-width="5"') + L('M118 46 H162 M62 96 H108 M168 68 H190 M48 74 H72', ' stroke-width="3"')],
      ['por-certo-errado', 'Quadro certo × errado', 240, 138, tabela(4, 4, [116, 116], 26, [['', ''], ['', ''], ['', ''], ['', ''], ['', '']]) +
        L('M28 17 l5 6 l10 -12', ' stroke-width="3"') + TL(50, 17, 'Certo') + L('M140 11 l12 12 m0 -12 l-12 12', ' stroke-width="3"') + TL(162, 17, 'Errado')],
      ['por-lacunas', 'Exercício de lacunas', 240, 96, TL(8, 14, 'Complete:') + L('M8 46 H60 M140 46 H230 M8 82 H90 M178 82 H230', ' stroke-width="2"') +
        R(68, 30, 64, 24, 3, TRAC + F) + R(98, 66, 72, 24, 3, TRAC + F)],
    ]],
  ],
};
