// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Empreendedorismo e gestão: modelos de negócio, planejamento, mercado, finanças, pessoas, qualidade e ícones. Desenho próprio.
import { T, head } from './base.js';

const n1 = v => +v.toFixed(1);
const F = ' stroke-width="1.6"';
const CH = ' fill="#C"';
const LEVE = ' fill="#C" fill-opacity=".22"';
const TRACO = ' stroke-width="1.4" stroke-dasharray="4 4"';
const TL = (x, y, s, z = 14) => T(x, y, s, z).replace('text-anchor="middle"', 'text-anchor="start"');
const TE = (x, y, s, z = 14) => T(x, y, s, z).replace('text-anchor="middle"', 'text-anchor="end"');
const TV = (x, y, s, z = 14) => `<g transform="rotate(-90 ${x} ${y})">${T(x, y, s, z)}</g>`; // texto vertical
const R = (x, y, w, h, rx = 3, a = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"${a}/>`;
const P = (d, a = '') => `<path d="${d}"${a}/>`;
const C = (cx, cy, r, a = '') => `<circle cx="${cx}" cy="${cy}" r="${r}"${a}/>`;
const linhas = (x, y, ls, z = 14, dy = 17) => ls.map((s, k) => T(x, n1(y + (k - (ls.length - 1) / 2) * dy), s, z)).join('');
const polar = (cx, cy, r, g) => [n1(cx + r * Math.cos(g * Math.PI / 180)), n1(cy + r * Math.sin(g * Math.PI / 180))];
const seta = (x1, y1, x2, y2, L = 11, a = '') => {
  const g = Math.atan2(y2 - y1, x2 - x1);
  return P(`M${x1} ${y1} L${n1(x2 - Math.cos(g) * L * 0.8)} ${n1(y2 - Math.sin(g) * L * 0.8)}`, a) + head(x2, y2, n1(g * 180 / Math.PI), L);
};
const arco = (cx, cy, r, a1, a2, a = '') => { const [x1, y1] = polar(cx, cy, r, a1), [x2, y2] = polar(cx, cy, r, a2); return P(`M${x1} ${y1} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2} ${y2}`, a); };
const arcoSeta = (cx, cy, r, a1, a2, L = 11) => { const [x, y] = polar(cx, cy, r, a2); return arco(cx, cy, r, a1, a2 - 4) + head(x, y, a2 + 90, L); };
const estrela = (cx, cy, Re, Ri, a = '', n = 5) => {
  let d = '';
  for (let k = 0; k < 2 * n; k++) { const [x, y] = polar(cx, cy, k % 2 ? Ri : Re, -90 + k * 180 / n); d += (k ? 'L' : 'M') + x + ' ' + y + ' '; }
  return P(d + 'Z', a);
};
const curva = (f, x0, x1, dx = 4) => { let d = ''; for (let x = x0; x <= x1 + 0.01; x += dx) d += (x === x0 ? 'M' : 'L') + n1(x) + ' ' + n1(f(x)) + ' '; return d; };
const pessoa = (cx, cy, s = 1) => C(cx, cy, n1(10 * s)) +
  P(`M${n1(cx - 18 * s)} ${n1(cy + 34 * s)} V${n1(cy + 30 * s)} Q${n1(cx - 18 * s)} ${n1(cy + 14 * s)} ${cx} ${n1(cy + 14 * s)} Q${n1(cx + 18 * s)} ${n1(cy + 14 * s)} ${n1(cx + 18 * s)} ${n1(cy + 30 * s)} V${n1(cy + 34 * s)} Z`);
const eixos = (x0, y0, x1, y1) => P(`M${x0} ${y1 + 8} V${y0} H${x1 - 8}`) + head(x0, y1, -90, 11) + head(x1, y0, 0, 11); // origem (x0,y0)
const engrenagem = (cx, cy, Re, n, a0 = 0) => {
  const r = Re - 8, w = 360 / n; let d = '';
  for (let k = 0; k < n; k++) {
    const t = a0 + w * k;
    [[r, t - w * 0.5], [r, t - w * 0.25], [Re, t - w * 0.13], [Re, t + w * 0.13], [r, t + w * 0.25]].forEach(([rr, g], j) => { const [x, y] = polar(cx, cy, rr, g); d += (k || j ? 'L' : 'M') + x + ' ' + y + ' '; });
  }
  return P(d + 'Z') + C(cx, cy, Math.round(Re * 0.3));
};

// ---------- Quadros de 5 colunas (Canvas e Lean Canvas) ----------
const grade5 = (sup, inf, rodape) => {
  const xs = [4, 78, 152, 228, 302, 376]; let d = 'M4 164 H376 M190 164 V236 ', s = '';
  for (let i = 1; i < 5; i++) d += `M${xs[i]} 4 V164 `;
  sup.forEach((ls, i) => ls.forEach((t, k) => { s += T((xs[i] + xs[i + 1]) / 2, 20 + k * 17, t, 14); }));
  for (const [i, ls] of Object.entries(inf)) { const j = +i; d += `M${xs[j]} 84 H${xs[j + 1]} `; ls.forEach((t, k) => { s += T((xs[j] + xs[j + 1]) / 2, 100 + k * 17, t, 14); }); }
  return R(4, 4, 372, 232, 3) + P(d) + s + T(97, 182, rodape[0], 14) + T(283, 182, rodape[1], 14);
};
const canvasNum = (() => {
  const num = (x, y, k) => C(x, y, 11, F) + T(x, y + 0.5, String(k), 14);
  return R(4, 4, 252, 168, 3) + P('M54 4 V120 M104 4 V120 M156 4 V120 M206 4 V120 M4 120 H256 M130 120 V172 M54 62 H104 M156 62 H206') +
    num(29, 20, 8) + num(79, 20, 7) + num(79, 78, 6) + num(130, 20, 2) + num(181, 20, 4) + num(181, 78, 3) + num(231, 20, 1) + num(20, 136, 9) + num(146, 136, 5);
})();

// ---------- Matriz 2 × 2 genérica ----------
const mat22 = ({ cw, ch, cols, rows, quads, tx, ty }) => {
  const x0 = ty ? 64 : 44, y0 = tx ? 42 : 26, W = x0 + 2 * cw, H = y0 + 2 * ch;
  let s = R(x0, y0, 2 * cw, 2 * ch, 0) + P(`M${x0 + cw} ${y0} V${H} M${x0} ${y0 + ch} H${W}`);
  if (tx) s += T(x0 + cw, 12, tx, 14);
  if (ty) s += TV(14, y0 + ch, ty, 14);
  cols.forEach((c, i) => { s += T(x0 + cw * (i + 0.5), y0 - 12, c, 14); });
  rows.forEach((r, i) => { s += TV(x0 - 13, y0 + ch * (i + 0.5), r, 14); });
  quads.forEach((q, i) => { const cx = x0 + cw * (i % 2 + 0.5), cy = y0 + ch * (Math.floor(i / 2) + 0.5); s += typeof q === 'function' ? q(cx, cy) : linhas(cx, cy, q, 16, 19); });
  return s;
};

// ---------- Modelos de negócio ----------
const propostaValor = R(8, 8, 120, 120, 2) + P('M68 68 H8 M68 68 L128 8 M68 68 L128 128') +
  T(50, 36, '+', 28) + T(50, 100, '−', 28) + R(98, 62, 20, 16, 1, F) + P('M98 62 L108 56 L118 62 M108 56 V78', F) +
  C(252, 68, 60) + P('M252 68 H312 M252 68 L209.6 25.6 M252 68 L209.6 110.4') +
  T(268, 34, '+', 28) + T(268, 102, '−', 28) + P('M212 68 L220 76 L234 60', ' stroke-width="3"') +
  P('M142 68 H182') + head(188, 68, 0, 10) + head(136, 68, 180, 10) +
  T(68, 148, 'Proposta de valor', 14) + T(252, 148, 'Cliente', 14);
const cadeiaValor = (() => {
  const prim = ['Entrada', 'Operações', 'Saída', 'Marketing', 'Serviços'];
  let s = P('M4 4 H240 L296 90 L240 176 H4 Z') + P('M4 92 H240 M240 4 V176 M4 26 H240 M4 48 H240 M4 70 H240 M51 92 V176 M98 92 V176 M146 92 V176 M193 92 V176', F);
  ['Infraestrutura', 'Pessoas (RH)', 'Tecnologia', 'Compras'].forEach((t, k) => { s += T(122, 15 + 22 * k, t, 14); });
  prim.forEach((t, k) => { s += TV(n1(27.5 + 47.2 * k), 134, t, 14); });
  return s + TV(262, 90, 'Margem', 14);
})();
const circuloDourado = C(100, 100, 94) + C(100, 100, 66) + C(100, 100, 36) + T(100, 100, 'Por quê?', 14) + T(100, 50, 'Como?', 14) + T(100, 20, 'O quê?', 14);
const construirMedir = (() => {
  const c = [130, 112], r = 78;
  const box = (g, t) => { const [x, y] = polar(c[0], c[1], r, g); return R(n1(x - 46), n1(y - 15), 92, 30, 15) + T(x, y, t, 14); };
  return arcoSeta(c[0], c[1], r, -52, -6) + arcoSeta(c[0], c[1], r, 68, 114) + arcoSeta(c[0], c[1], r, 188, 234) +
    box(-90, 'Construir') + box(30, 'Medir') + box(150, 'Aprender') + T(130, 116, 'MVP', 22);
})();
const plataforma = R(4, 30, 88, 40, 8) + T(48, 50, 'Ofertantes', 14) + R(126, 30, 88, 40, 8, ' stroke-width="3"') + T(170, 50, 'Plataforma', 14) +
  R(248, 30, 88, 40, 8) + T(292, 50, 'Clientes', 14) +
  P('M98 50 H120 M220 50 H242') + head(124, 50, 0, 9) + head(94, 50, 180, 9) + head(246, 50, 0, 9) + head(216, 50, 180, 9) + T(170, 88, 'intermedia e cobra', 14);
const tripe = C(80, 72, 56) + C(140, 72, 56) + C(110, 124, 56) + T(62, 50, 'Pessoas', 14) + T(158, 50, 'Planeta', 14) + T(110, 156, 'Lucro', 14) + T(110, 92, '3P', 14);

// ---------- Planejamento e estratégia ----------
const q5w2h = (() => {
  const ls = ['O quê?', 'Por quê?', 'Onde?', 'Quando?', 'Quem?', 'Como?', 'Quanto?'];
  let s = R(4, 4, 252, 240, 2) + P('M96 4 V244 ' + ls.map((_, k) => `M4 ${34 + 30 * k} H256`).join(' ')) + T(50, 19, '5W2H', 15) + T(176, 19, 'Resposta', 15);
  ls.forEach((t, k) => { s += TL(12, 49 + 30 * k, t, 14); });
  return s;
})();
const planoAcao = (() => {
  let s = R(4, 4, 292, 142, 2) + P('M4 32 H296 M120 4 V146 M180 4 V146 M240 4 V146 M4 70 H296 M4 108 H296', '') +
    T(62, 18, 'Ação', 14) + T(150, 18, 'Quem', 14) + T(210, 18, 'Prazo', 14) + T(268, 18, 'Status', 14);
  s += C(268, 51, 8, CH) + C(268, 89, 8) + C(268, 127, 8, LEVE);
  return s;
})();
const okr = (() => {
  let s = R(4, 4, 252, 40, 6, ' stroke-width="3"') + T(130, 24, 'Objetivo', 16) + P('M22 44 V152');
  [[72, 0.8], [112, 0.5], [152, 0.3]].forEach(([y, p], k) => {
    s += P(`M22 ${y} H34`) + T(52, y, 'KR' + (k + 1), 14) + R(76, y - 9, 176, 18, 4) + R(76, y - 9, n1(176 * p), 18, 4, ' fill="#C" fill-opacity=".35" stroke="none"');
  });
  return s;
})();
const bcg = mat22({
  cw: 104, ch: 96, tx: null, ty: 'Crescimento', cols: ['Alta participação', 'Baixa'], rows: ['Alto', 'Baixo'],
  quads: [
    (x, y) => estrela(x, y - 14, 18, 8) + T(x, y + 24, 'Estrela', 15),
    (x, y) => T(x, y - 14, '?', 32) + T(x, y + 24, 'Interrogação', 15),
    (x, y) => T(x, y - 14, 'R$', 24) + T(x, y + 24, 'Vaca leiteira', 15),
    (x, y) => P(`M${x} ${y - 18} Q${x - 14} ${y - 26} ${x - 17} ${y - 38} M${x} ${y - 18} Q${x - 4} ${y - 30} ${x - 7} ${y - 44} M${x} ${y - 18} Q${x + 4} ${y - 30} ${x + 7} ${y - 44} M${x} ${y - 18} Q${x + 14} ${y - 26} ${x + 17} ${y - 38}`, ' stroke-width="2"') +
      `<ellipse cx="${x}" cy="${y - 4}" rx="11" ry="15"/>` + P(`M${x - 9} ${y - 12} L${x + 9} ${y + 4} M${x + 9} ${y - 12} L${x - 9} ${y + 4}`, F) + T(x, y + 24, 'Abacaxi', 15),
  ],
});
const gut = (() => {
  let s = R(4, 4, 312, 138, 2) + P('M4 34 H316 M4 70 H316 M4 106 H316 M140 4 V142 M180 4 V142 M220 4 V142 M260 4 V142') +
    T(72, 19, 'Problema', 14) + T(160, 19, 'G', 16) + T(200, 19, 'U', 16) + T(240, 19, 'T', 16) + T(288, 19, 'G×U×T', 14);
  return s;
})();
const eisenhower = mat22({
  cw: 104, ch: 106, cols: ['Urgente', 'Não urgente'], rows: ['Importante', 'Não importante'],
  quads: [['Fazer', 'agora'], ['Agendar'], ['Delegar'], ['Eliminar']],
});
const ansoff = mat22({
  cw: 112, ch: 96, tx: 'Produtos', ty: 'Mercados', cols: ['Existentes', 'Novos'], rows: ['Existentes', 'Novos'],
  quads: [['Penetração', 'de mercado'], ['Novo', 'produto'], ['Novo', 'mercado'], ['Diversifi-', 'cação']],
});
const esforcoImpacto = mat22({
  cw: 110, ch: 90, tx: 'Esforço', ty: 'Impacto', cols: ['Baixo', 'Alto'], rows: ['Alto', 'Baixo'],
  quads: [['Ganho', 'rápido'], ['Grande', 'projeto'], ['Tarefa', 'menor'], ['Evitar']],
});
const arvoreProb = (() => {
  let s = '';
  [42, 130, 218].forEach(x => { s += R(x - 38, 4, 76, 30, 4) + T(x, 19, 'Efeito', 14) + R(x - 38, 182, 76, 30, 4) + T(x, 197, 'Causa', 14); });
  s += R(50, 88, 160, 40, 6, ' stroke-width="3"') + T(130, 108, 'Problema central', 14);
  s += seta(100, 88, 50, 40) + seta(130, 88, 130, 40) + seta(160, 88, 210, 40);
  s += seta(50, 182, 100, 134) + seta(130, 182, 130, 134) + seta(210, 182, 160, 134);
  return s;
})();
const porter = R(130, 98, 80, 38, 6, ' stroke-width="3"') + T(170, 117, 'Rivalidade', 14) +
  R(100, 4, 140, 34, 6) + T(170, 21, 'Novos entrantes', 14) + R(110, 196, 120, 34, 6) + T(170, 213, 'Substitutos', 14) +
  R(4, 98, 98, 38, 6) + T(53, 117, 'Fornecedores', 14) + R(238, 98, 98, 38, 6) + T(287, 117, 'Clientes', 14) +
  seta(170, 38, 170, 98) + seta(170, 196, 170, 136) + seta(102, 117, 130, 117, 9) + seta(238, 117, 210, 117, 9);
const pestel = (() => {
  const it = [['P', 'Político'], ['E', 'Econômico'], ['S', 'Social'], ['T', 'Tecnológico'], ['E', 'Ecológico'], ['L', 'Legal']];
  let s = R(4, 4, 300, 168, 2) + P('M104 4 V172 M204 4 V172 M4 88 H304');
  it.forEach(([l, w], k) => { const x = 54 + 100 * (k % 3), y = 4 + 84 * Math.floor(k / 3); s += T(x, y + 32, l, 28) + T(x, y + 64, w, 14); });
  return s;
})();
const matrizRisco = (() => {
  let s = '';
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const v = (i + 1) * (5 - j); // i = impacto (→), j = linha de cima para baixo
    s += R(44 + 38 * i, 4 + 38 * j, 38, 38, 0, ` fill="#C" fill-opacity="${n1(v / 25 * 0.55)}" stroke-width="1.4"`);
  }
  return s + R(44, 4, 190, 190, 0) + T(139, 210, 'Impacto', 14) + TV(16, 99, 'Probabilidade', 14) + T(34, 23, '5', 14) + T(34, 175, '1', 14);
})();
const roadmap = P('M10 120 C80 120 60 64 140 64 S206 24 250 24', ' stroke-width="3"') +
  [[44, 112, 1], [116, 70, 2], [190, 40, 3]].map(([x, y, k]) => C(x, y, 12) + T(x, y + 0.5, String(k), 14)).join('') +
  P('M262 30 V4') + P('M262 4 L244 9 L262 14', CH) + T(150, 112, 'marcos do projeto', 14);
const bsc = `<ellipse cx="165" cy="115" rx="50" ry="26" stroke-width="3"/>` + T(165, 115, 'Estratégia', 14) +
  R(105, 4, 120, 40, 6) + T(165, 24, 'Financeira', 14) + R(105, 186, 120, 40, 6) + T(165, 206, 'Aprendizado', 14) +
  R(4, 95, 92, 40, 6) + T(50, 115, 'Clientes', 14) + R(234, 95, 92, 40, 6) + T(280, 115, 'Processos', 14) +
  seta(165, 89, 165, 44) + seta(165, 141, 165, 186) + seta(115, 115, 96, 115, 9) + seta(215, 115, 234, 115, 9);
const smart = (() => {
  const it = [['S', 'Específica'], ['M', 'Mensurável'], ['A', 'Atingível'], ['R', 'Relevante'], ['T', 'Temporal']];
  return it.map(([l, w], k) => R(4, 4 + 42 * k, 38, 38, 4) + T(23, 23 + 42 * k, l, 22) + TL(54, 23 + 42 * k, w, 15)).join('');
})();

// ---------- Mercado e marketing ----------
const persona = R(4, 4, 252, 152, 8) + R(14, 14, 72, 82, 4) + C(50, 42, 15) + P('M22 92 C22 64 78 64 78 92') +
  TL(98, 24, 'Nome:') + TL(98, 50, 'Idade:') + TL(98, 76, 'Profissão:') + TL(14, 116, 'Dores:') + TL(14, 142, 'Objetivos:') +
  P('M146 32 H246 M146 58 H246 M174 84 H246 M64 124 H246 M88 150 H246', TRACO);
const mapaEmpatia = (() => {
  const c = [150, 88], r = 30; let d = '';
  [[4, 4], [296, 4], [4, 172], [296, 172]].forEach(([x, y]) => { const g = Math.atan2(y - c[1], x - c[0]); d += `M${x} ${y} L${n1(c[0] + r * Math.cos(g))} ${n1(c[1] + r * Math.sin(g))} `; });
  return R(4, 4, 292, 232, 2) + P(d + 'M4 172 H296 M150 172 V236') + C(150, 88, 26) + C(141, 82, 2.5, CH) + C(159, 82, 2.5, CH) + P('M140 96 Q150 104 160 96', F) +
    T(150, 22, 'Pensa e sente', 14) + T(34, 88, 'Ouve', 14) + T(266, 88, 'Vê', 14) + T(150, 156, 'Fala e faz', 14) + T(77, 204, 'Dores', 15) + T(223, 204, 'Ganhos', 15);
})();
const jornada = (() => {
  const xs = [40, 102, 164, 226, 288], nm = ['Descoberta', 'Consideração', 'Compra', 'Uso', 'Fidelização'];
  let s = P('M10 86 H312') + head(324, 86, 0, 12) + P('M40 50 C70 30 80 28 102 30 S140 70 164 66 S205 38 226 40 S270 24 288 22', ' stroke-width="2" stroke-dasharray="7 5"') +
    T(14, 22, '+', 18) + T(14, 62, '−', 18);
  xs.forEach((x, k) => { s += C(x, 86, 13) + T(x, 86.5, String(k + 1), 14) + T(x, k % 2 ? 140 : 118, nm[k], 14); });
  return s;
})();
const quatroPs = C(120, 106, 30, ' stroke-width="3"') + T(120, 106, 'Cliente', 14) +
  [[58, 46, 'Produto'], [182, 46, 'Preço'], [58, 166, 'Praça'], [182, 166, 'Promoção']].map(([x, y, t]) => C(x, y, 40) + T(x, y, t, 14)).join('');
const segmentacao = P('M86 94 V18 A76 76 0 1 0 162 94 Z M86 94 H10 M86 94 V170') + P('M98 82 V6 A76 76 0 0 1 174 82 Z', LEVE) + T(134, 46, 'Alvo', 14);
const aarrr = (() => {
  const nm = ['Aquisição', 'Ativação', 'Retenção', 'Receita', 'Indicação'], ws = [268, 230, 192, 154, 116];
  return nm.map((t, k) => R(n1(140 - ws[k] / 2), 4 + 40 * k, ws[k], 34, 4, k % 2 ? '' : LEVE) + T(140, 21 + 40 * k, t, 14)).join('');
})();
const cicloVida = eixos(30, 170, 314, 8) +
  P('M32 166 C80 164 100 120 130 80 S190 22 220 24 S280 60 306 120', ' stroke-width="3"') + P('M100 22 V170 M170 22 V170 M240 22 V170', TRACO) +
  T(65, 186, 'Introdução', 14) + T(135, 204, 'Crescimento', 14) + T(205, 186, 'Maturidade', 14) + T(275, 204, 'Declínio', 14) +
  TL(40, 12, 'Vendas') + T(290, 156, 'Tempo', 14);
const curvaAdocao = (() => {
  const m = 190, sg = 56, f = x => 150 - 128 * Math.exp(-0.5 * ((x - m) / sg) ** 2);
  let d = '';
  [m - 2 * sg, m - sg, m, m + sg].forEach(x => { d += `M${x} 150 V${n1(f(x))} `; });
  return P(curva(f, 8, 336, 4), ' stroke-width="3"') + P('M6 150 H338') + P(d, F) +
    T(58, 168, '2,5%', 14) + T(106, 168, '13,5%', 14) + T(162, 168, '34%', 14) + T(218, 168, '34%', 14) + T(290, 168, '16%', 14) +
    T(58, 190, 'Inovadores', 14) + T(162, 190, 'Maioria inicial', 14) + T(290, 190, 'Retardatários', 14) +
    T(106, 210, 'Pioneiros', 14) + T(218, 210, 'Maioria tardia', 14);
})();
const posicionamento = P('M115 18 V192 M22 105 H208') + head(115, 8, -90, 11) + head(115, 202, 90, 11) + head(12, 105, 180, 11) + head(218, 105, 0, 11) +
  TL(124, 12, 'Preço') + T(186, 90, 'Qualidade', 14) + C(60, 52, 8) + C(166, 44, 8) + C(66, 152, 8) + C(172, 150, 8) + C(160, 74, 9, CH);
const tamSamSom = C(110, 110, 100) + C(110, 146, 64) + C(110, 182, 28, LEVE) + T(110, 28, 'TAM', 16) + T(110, 48, 'total', 14) +
  T(110, 104, 'SAM', 16) + T(110, 124, 'disponível', 14) + T(110, 182, 'SOM', 15);
const nps = (() => {
  let s = T(160, 14, 'NPS = % promotores − % detratores', 14);
  for (let k = 0; k <= 10; k++) s += R(6 + 28 * k, 30, 28, 30, 0, k > 8 ? ' fill="#C" fill-opacity=".35"' : k > 6 ? ' fill="#C" fill-opacity=".12"' : '') + T(20 + 28 * k, 45, String(k), 14);
  s += P('M8 68 V74 H200 V68 M204 68 V74 H256 V68 M260 68 V74 H312 V68', F) + T(104, 88, 'Detratores', 14) + T(230, 88, 'Neutros', 14) + TE(314, 106, 'Promotores', 14);
  return s;
})();
const curtida = R(8, 44, 22, 50, 3) + P('M30 50 L48 22 Q52 10 60 14 Q66 18 61 32 L57 46 H84 Q93 46 91 56 L85 86 Q83 94 74 94 H30') +
  P('M60 58 H90 M58 70 H88 M58 82 H86', F);
const estrelas = [0, 1, 2, 3, 4].map(k => estrela(24 + 46 * k, 26, 21, 9, k < 4 ? CH : '')).join('');
const etiqueta = P('M40 8 H132 V72 H40 L8 40 Z') + C(30, 40, 5) + T(86, 40, 'R$', 24);
const desconto = estrela(45, 45, 41, 33, '', 14) + T(45, 46, '%', 28);

// ---------- Finanças ----------
const fluxoCaixa = (() => {
  let s = P('M10 100 H290') + head(298, 100, 0, 11) + T(292, 86, 't', 16);
  for (let k = 0; k <= 5; k++) s += P(`M${30 + 50 * k} 95 V105`) + T(18 + 50 * k, 114, String(k), 14);
  s += seta(30, 100, 30, 176, 13);
  [50, 56, 58, 60, 78].forEach((h, k) => { s += seta(80 + 50 * k, 100, 80 + 50 * k, 100 - h, 12); });
  s += seta(180, 100, 180, 136, 12);
  return s + T(150, 14, 'Entradas (+)', 14) + TL(46, 172, 'Saídas (−)');
})();
const pontoEquilibrio = (() => {
  return eixos(34, 190, 270, 8) +
    P('M34 140 H262', ' stroke-width="1.8" stroke-dasharray="7 5"') + P('M34 140 L262 60', ' stroke-width="2.5"') + P('M34 190 L262 30', ' stroke-width="3"') +
    P('M176.5 90 L262 30 V60 Z', ' fill="#C" fill-opacity=".25" stroke="none"') + P('M34 140 L176.5 90 L34 190 Z', ' fill="#C" fill-opacity=".1" stroke="none"') +
    C(176.5, 90, 5, CH) + P('M176.5 96 V190', TRACO) + T(176.5, 204, 'Q*', 14) + T(160, 74, 'PE', 14) +
    TL(268, 30, 'Receita') + TL(268, 60, 'Custo total') + TL(268, 140, 'Custo fixo') + TL(42, 14, 'R$') + T(262, 204, 'Q', 14);
})();
const dre = (() => {
  const ls = ['Receita bruta', '(−) Deduções', '= Receita líquida', '(−) Custos', '= Lucro bruto', '(−) Despesas', '(−) Impostos', '= Lucro líquido'];
  let s = R(4, 4, 272, 212, 2);
  ls.forEach((t, k) => { const y = 20 + 26 * k; s += TL(14, y, t, 14) + P(`M196 ${y + 7} H266`, TRACO); if (t[0] === '=') s += P(`M8 ${y - 13} H272`, F); });
  return s;
})();
const cascata = (() => {
  const b = [[16, 30, 170, 1], [70, 30, 80, 0], [124, 80, 110, 0], [178, 110, 126, 0], [232, 126, 170, 1]];
  const nm = ['Receita', 'Custos', 'Despesas', 'Impostos', 'Lucro'];
  let s = P('M8 170 H286');
  b.forEach(([x, y1, y2, f], k) => { s += R(x, y1, 42, y2 - y1, 0, f ? ' fill="#C" fill-opacity=".35"' : ''); s += T(x + 21, k % 2 ? 200 : 184, nm[k], 14); });
  s += P('M58 30 H70 M112 80 H124 M166 110 H178 M220 126 H232', TRACO);
  return s;
})();
const balanca = P('M120 40 V170 M100 176 L110 166 H130 L140 176 Z M84 176 H156') + P('M40 48 L200 32', ' stroke-width="3"') + C(120, 40, 5, CH) +
  P('M40 48 L18 100 M40 48 L62 100 M200 32 L178 84 M200 32 L222 84', F) + P('M14 100 Q40 122 66 100 Z M174 84 Q200 106 226 84 Z') +
  `<ellipse cx="40" cy="94" rx="11" ry="4"/><ellipse cx="40" cy="87" rx="11" ry="4"/>` + T(40, 136, 'Receitas', 14) + T(200, 120, 'Custos', 14);
const juros = (() => {
  const k = Math.log(160 / 30) / 216, f = x => 180 - 30 * Math.exp(k * (x - 34));
  return eixos(34, 180, 262, 8) + P('M34 150 L250 90', ' stroke-width="2.5" stroke-dasharray="8 5"') + P(curva(f, 34, 250, 6), ' stroke-width="3"') +
    TE(226, 28, 'Compostos', 14) + TE(254, 114, 'Simples', 14) + T(20, 150, 'C₀', 14) + TL(42, 12, 'Montante') + T(258, 194, 't', 16);
})();
const cofrinho = `<ellipse cx="78" cy="66" rx="56" ry="40"/>` + R(128, 54, 16, 24, 6) + C(134, 64, 1.8, CH) + C(139, 69, 1.8, CH) +
  P('M90 30 L102 12 L110 34') + R(44, 100, 13, 14, 2) + R(98, 100, 13, 14, 2) + P('M23 58 Q10 56 12 44 Q16 38 21 44', F) + C(112, 52, 3, CH) +
  R(62, 30, 26, 5, 2, CH) + `<ellipse cx="75" cy="14" rx="10" ry="10"/>` + P('M75 9 V19', F);
const moeda = C(40, 40, 36) + C(40, 40, 29, F) + T(40, 41, 'R$', 22);
const pilhaMoedas = (() => {
  let s = '';
  for (let k = 0; k < 5; k++) { const y = 80 - 12 * k; s += P(`M14 ${y} V${y + 10} A40 9 0 0 0 94 ${y + 10} V${y}`); }
  return s + `<ellipse cx="54" cy="32" rx="40" ry="9"/>` + `<ellipse cx="54" cy="32" rx="24" ry="5"${F}/>`;
})();
const cedula = R(4, 8, 162, 74, 4) + R(12, 16, 146, 58, 2, F) + C(56, 45, 20) + T(56, 46, 'R$', 16) + T(124, 45, '100', 20);
const sacoDinheiro = P('M44 34 C20 60 8 86 14 104 C20 122 100 122 106 104 C112 86 100 60 76 34 Z') + P('M44 34 L34 14 Q60 24 86 14 L76 34') +
  P('M40 36 H80', ' stroke-width="4"') + T(60, 84, 'R$', 24);
const graficoCresc = eixos(20, 154, 202, 8) +
  [[34, 30], [70, 52], [106, 78], [142, 110]].map(([x, h]) => R(x, 154 - h, 26, h, 0, LEVE)).join('') +
  P('M30 118 L70 92 L104 100 L148 50 L176 30', ' stroke-width="3"') + head(194, 16, -38, 14);
const payback = (() => {
  const v = [70, 52, 30, 8, -16, -44], pts = v.map((y, k) => [30 + 46 * k, 120 + y]);
  return P('M30 200 V18') + head(30, 8, -90, 11) + P('M30 120 H272') + head(280, 120, 0, 11) +
    P('M' + pts.map(p => p.join(' ')).join(' L'), ' stroke-width="3"') + pts.map(([x, y]) => C(x, y, 4, CH)).join('') +
    C(183.3, 120, 6) + T(214, 138, 'Payback', 14) + TL(40, 12, 'Saldo acumulado') + T(18, 120, '0', 14) + T(276, 106, 't', 16);
})();
const vplTir = P('M34 190 V18') + head(34, 8, -90, 11) + P('M34 120 H252') + head(260, 120, 0, 11) +
  P('M34 24 C90 70 130 100 170 120 S230 160 256 168', ' stroke-width="3"') + C(170, 120, 5, CH) + T(150, 138, 'TIR', 14) +
  TL(42, 12, 'VPL') + TE(258, 104, 'taxa i', 14) + T(22, 120, '0', 14);
const pizza = (() => {
  const c = 85, r = 78; let d = '';
  [-90, 40, 140, 210].forEach(g => { const [x, y] = polar(c, c, r, g); d += `M${c} ${c} L${x} ${y} `; });
  const [ax, ay] = polar(c, c, r, -90), [bx, by] = polar(c, c, r, 40);
  return C(c, c, r) + P(d) + P(`M${c} ${c} L${ax} ${ay} A${r} ${r} 0 0 1 ${bx} ${by} Z`, LEVE);
})();
const carteira = R(6, 24, 134, 80, 10) + P('M6 36 Q6 12 28 12 H118 L126 24') + R(102, 50, 42, 28, 7) + C(118, 64, 4, CH);
const cartao = R(4, 4, 152, 96, 10) + R(20, 28, 30, 24, 4) + P('M20 40 H50 M35 28 V52', F) + P('M20 76 H140', ' stroke-width="3" stroke-dasharray="16 6"') +
  P('M118 32 Q124 40 118 48 M126 28 Q134 40 126 52 M134 24 Q144 40 134 56', F);
const investimento = (() => {
  let s = '';
  for (let k = 0; k < 3; k++) { const y = 96 - 12 * k; s += P(`M20 ${y} V${y + 10} A35 8 0 0 0 90 ${y + 10} V${y}`); }
  return s + `<ellipse cx="55" cy="72" rx="35" ry="8"/>` + P('M55 72 V24') + P('M55 50 C40 50 28 40 30 26 C44 26 55 36 55 50 Z', LEVE) + P('M55 40 C68 40 80 30 78 16 C64 16 55 26 55 40 Z', LEVE);
})();

// ---------- Pessoas e equipes ----------
const lideranca = pessoa(110, 22, 1.2) + estrela(110, 22, 5, 2.2, CH) +
  P('M110 64 V72 M50 72 H170 M50 72 V82 M110 72 V82 M170 72 V82', F) + pessoa(50, 96) + pessoa(110, 96) + pessoa(170, 96);
const reuniao = (() => {
  const pes = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="17" ry="8"/>` + C(x, y, 8);
  return R(50, 46, 120, 58, 26) + R(84, 62, 18, 24, 1, F) + R(118, 62, 18, 24, 1, F) +
    pes(80, 24) + pes(140, 24) + pes(80, 126) + pes(140, 126) +
    `<ellipse cx="24" cy="75" rx="8" ry="17"/>` + C(24, 75, 8) + `<ellipse cx="196" cy="75" rx="8" ry="17"/>` + C(196, 75, 8);
})();
const pitch = R(80, 8, 134, 88, 3) + P('M147 96 V120 M147 120 L130 150 M147 120 L164 150') +
  [[100, 20], [124, 34], [148, 50], [172, 64]].map(([x, h]) => R(x, 86 - h, 16, h, 0, LEVE)).join('') + seta(98, 72, 204, 22, 11) +
  C(40, 40, 12) + P('M40 52 V108 M40 108 L28 150 M40 108 L52 150 M40 66 L76 50 M40 66 L26 94') + P('M76 50 L98 40', F);
const apertoMaos = P('M4 84 L36 54 L54 72 L22 102 Z M216 84 L184 54 L166 72 L198 102 Z') + // punhos
  P('M42 60 L74 40 Q90 34 104 38 H150 Q162 40 174 60') + // contorno de cima
  P('M48 66 Q56 82 68 80 Q72 92 84 88 Q90 98 102 92 Q110 100 120 90 Q128 92 130 82 L168 66') + // dedos por baixo
  P('M68 80 Q74 70 82 66 M84 88 Q90 76 98 72 M102 92 Q108 80 114 76 M100 38 Q116 54 136 48', F);
const lampada = P('M55 8 C26 8 12 32 18 54 C22 70 36 78 38 92 H72 C74 78 88 70 92 54 C98 32 84 8 55 8 Z') +
  P('M40 100 H70 M42 108 H68 M46 116 H64') + P('M48 122 Q55 128 62 122') + T(55, 48, 'R$', 22) +
  P('M6 18 L14 24 M104 18 L96 24 M2 50 H10 M108 50 H100', F);
const foguete = P('M60 6 C80 24 86 50 84 90 H36 C34 50 40 24 60 6 Z') + C(60, 46, 10) + P('M36 70 L18 94 V110 L38 96 M84 70 L102 94 V110 L82 96') +
  P('M44 90 L48 102 H72 L76 90') + P('M50 106 Q52 124 60 144 Q68 124 70 106', LEVE) + P('M26 118 V140 M94 118 V140', ' stroke-width="1.6" stroke-dasharray="5 4"');
const alvoMeta = C(54, 66, 46) + C(54, 66, 30) + C(54, 66, 14) + C(54, 66, 3.5, CH) +
  P('M57 63 L116 14', ' stroke-width="3"') + P('M116 14 L104 13 M116 14 L117 26 M110 19 L98 18 M110 19 L111 31', F);
const escada = P('M4 164 H56 V128 H108 V92 H160 V56 H212 V164 Z') + P('M196 56 V12') + P('M196 12 L172 20 L196 28 Z', CH) +
  C(76, 100, 7) + P('M76 107 V118 M76 118 L70 128 M76 118 L84 128 M76 110 L68 116 M76 110 L86 104', F);
const quebraCabeca = P('M10 14 H96 V44 C108 40 112 52 112 57 C112 62 108 74 96 70 V100 H10 Z') +
  P('M104 14 H190 V100 H104 V70 C116 74 120 62 120 57 C120 52 116 40 104 44 Z', LEVE);
const cracha = P('M30 4 L46 30 M70 4 L54 30') + R(42, 28, 16, 10, 2) + R(14, 38, 72, 96, 8) + R(30, 50, 40, 40, 3) + C(50, 64, 7, F) + P('M38 90 Q38 76 50 76 Q62 76 62 90', F) +
  P('M26 106 H74 M32 120 H68', F);
const maleta = R(6, 30, 138, 74, 8) + P('M54 30 V18 Q54 12 60 12 H90 Q96 12 96 18 V30 M6 62 H66 M84 62 H144') + R(66, 55, 18, 15, 2);
const engrenagens = engrenagem(58, 66, 46, 10) + engrenagem(126, 94, 30, 7, 12);
const tuckman = P('M40 100 C70 100 80 140 110 140 S150 90 180 86 S230 40 260 36', ' stroke-width="3"') +
  [[40, 100], [110, 140], [180, 86], [260, 36]].map(([x, y]) => C(x, y, 5, CH)).join('') +
  T(40, 80, 'Formação', 14) + T(110, 160, 'Conflito', 14) + T(214, 102, 'Normas', 14) + T(256, 18, 'Desempenho', 14);
const raci = (() => {
  let s = R(4, 4, 272, 136, 2) + P('M4 34 H276 M4 69 H276 M4 104 H276 M120 4 V140 M159 4 V140 M198 4 V140 M237 4 V140') + T(62, 19, 'Tarefa', 14);
  ['R', 'A', 'C', 'I'].forEach((l, k) => { s += T(139.5 + 39 * k, 19, l, 16); });
  return s;
})();
const feedback = pessoa(36, 46) + pessoa(184, 46) + P('M64 40 Q110 4 156 40', '') + head(160, 44, 45, 11) + P('M156 92 Q110 128 64 92') + head(60, 88, -135, 11) + T(110, 66, 'Feedback', 14);
const empreendedor = C(50, 30, 18) + P('M10 116 V100 Q10 66 50 66 Q90 66 90 100 V116') + P('M38 66 L50 80 L62 66', F) + P('M50 80 L44 88 L50 112 L56 88 Z', CH);

// ---------- Processos e qualidade ----------
const roda5 = (cx, cy, R0, r, letras, nomes, z, centro) => { // nomes por fora: em cima, à direita, embaixo, embaixo, à esquerda
  const gs = [-90, -18, 54, 126, 198]; let s = '';
  gs.forEach((g, k) => {
    s += arcoSeta(cx, cy, R0, g + 20, g + 52, 10);
    const [x, y] = polar(cx, cy, R0, g); s += C(x, y, r) + T(x, y, letras[k], z);
    s += k === 0 ? T(x, y - r - 12, nomes[k], 14) : k === 1 ? TL(x + r + 8, y, nomes[k]) : k === 4 ? TE(x - r - 8, y, nomes[k]) : T(x, y + r + 14, nomes[k], 14);
  });
  return s + centro;
};
const dmaic = roda5(180, 128, 82, 24, ['D', 'M', 'A', 'I', 'C'], ['Definir', 'Medir', 'Analisar', 'Melhorar', 'Controlar'], 20, T(180, 125, '6σ', 22));
const cincoS = roda5(190, 134, 80, 31, ['Seiri', 'Seiton', 'Seiso', 'Seiketsu', 'Shitsuke'], ['Utilização', 'Ordenação', 'Limpeza', 'Padronização', 'Disciplina'], 14, T(190, 138, '5S', 26));
const sipoc = (() => {
  const L = ['S', 'I', 'P', 'O', 'C'], nm = ['Fornecedores', 'Entradas', 'Processo', 'Saídas', 'Clientes']; let s = '';
  L.forEach((l, k) => {
    const x = 16 + 70 * k;
    s += P(k ? `M${x} 30 H${x + 60} L${x + 72} 56 L${x + 60} 82 H${x} L${x + 12} 56 Z` : `M${x} 30 H${x + 60} L${x + 72} 56 L${x + 60} 82 H${x} Z`, k === 2 ? LEVE : '') +
      T(x + (k ? 38 : 32), 56, l, 24) + T(x + 36, k % 2 ? 116 : 98, nm[k], 14);
  });
  return s;
})();
const linhaProducao = R(10, 80, 280, 24, 12) + [24, 64, 104, 144, 184, 224, 276].map(x => C(x, 92, 6, F)).join('') +
  [40, 120, 200].map(x => R(x, 48, 34, 32, 2) + P(`M${x + 17} 48 V60`, F)).join('') + P('M40 104 V124 M260 104 V124 M30 124 H50 M250 124 H270') +
  seta(100, 22, 200, 22, 12);
const cadeiaSup = R(25, 26, 40, 36, 2) + P('M25 38 H65 M45 26 V38', F) +
  P('M117 64 V38 L131 48 V38 L145 48 V38 L159 48 V20 H167 V64 Z') +
  R(215, 28, 40, 30, 2) + P('M255 38 H267 L275 48 V58 H255') + C(227, 62, 6) + C(265, 62, 6) +
  pessoa(335, 28) +
  seta(70, 44, 110, 44, 10) + seta(172, 44, 208, 44, 10) + seta(280, 44, 312, 44, 10) +
  T(45, 92, 'Fornecedor', 14) + T(142, 92, 'Fábrica', 14) + T(245, 92, 'Distribuição', 14) + T(335, 92, 'Cliente', 14);
const kaizen = P('M10 170 H250 V60 Z') +
  `<g transform="translate(150 105.8) rotate(-24.6)">` + C(0, -40, 40) + P('M0 -80 V0 M-40 -40 H40', F) +
  T(16, -56, 'P', 15) + T(16, -24, 'D', 15) + T(-16, -24, 'C', 15) + T(-16, -56, 'A', 15) +
  P('M-56 0 L-8 0 L-28 -12 Z', ' fill="#C" fill-opacity=".45"') + `</g>` +
  T(52, 130, 'Padrão', 14) + P('M74 128 L96 124', F) + seta(176, 24, 232, 4, 11);
const vsm = (() => {
  const proc = x => R(x, 14, 80, 36, 2) + T(x + 40, 32, 'Processo', 14) + R(x, 50, 80, 52, 0, F) + TL(x + 8, 66, 'TC =') + TL(x + 8, 88, 'TS =');
  return proc(8) + proc(192) + P('M140 20 L164 60 H116 Z') + T(140, 46, 'I', 16) +
    P('M96 80 H164 V72 L184 88 L164 104 V96 H96 Z') + P('M110 80 L104 96 M124 80 L118 96 M138 80 L132 96 M152 80 L146 96', F);
})();
const velocimetro = (() => {
  let d = '';
  for (let g = 180; g <= 360; g += 30) { const [a, b] = polar(90, 100, 80, g), [c, e] = polar(90, 100, 68, g); d += `M${a} ${b} L${c} ${e} `; }
  const [nx, ny] = polar(90, 100, 64, -50);
  return P('M10 100 A80 80 0 0 1 170 100') + P(d, F) + arco(90, 100, 74, 300, 360, ' stroke-width="7" stroke-opacity=".35"') +
    P(`M90 100 L${nx} ${ny}`, ' stroke-width="3.5"') + C(90, 100, 6, CH) + T(14, 112, '0', 14) + T(166, 112, '100', 14);
})();
const seloQualidade = P('M34 82 L24 132 L40 122 L50 136 L56 92 M76 82 L86 132 L70 122 L60 136 L54 92') + estrela(55, 52, 46, 40, '', 16) + C(55, 52, 30, F) +
  P('M40 52 L51 63 L72 40', ' stroke-width="4"');
const checklist = [0, 1, 2, 3].map(k => {
  const y = 10 + 34 * k;
  return R(8, y, 22, 22, 3) + P(`M38 ${y + 11} H140`, F) + (k < 3 ? P(`M12 ${y + 11} L18 ${y + 18} L32 ${y - 2}`, ' stroke-width="3.5"') : '');
}).join('');

// ---------- Ícones de negócio ----------
const loja = (() => {
  let sc = 'M4 48 ';
  for (let k = 0; k < 6; k++) sc += 'a13.67 10 0 0 0 27.33 0 ';
  return R(14, 48, 142, 96, 0) + P('M14 20 H156 L166 48 H4 Z') + P(sc) + P('M40 20 L35 48 M66 20 L62 48 M92 20 L90 48 M118 20 L117 48 M140 20 L144 48', F) +
    R(28, 84, 36, 60, 2) + C(56, 116, 2.5, CH) + R(82, 78, 62, 42, 2) + P('M113 78 V120 M82 99 H144', F);
})();
const carrinho = P('M6 14 H24 L46 88 H128') + P('M30 30 H142 L130 72 H42') + P('M64 30 L68 72 M90 30 L91 72 M116 30 L114 72 M36 51 H136', F) + C(58, 106, 9) + C(118, 106, 9);
const entrega = P('M10 30 H122 V96 H10 Z') + P('M122 46 H160 L184 70 V96 H122') + P('M130 54 H156 L170 70 H130 Z', F) + C(44, 98, 13) + C(156, 98, 13) +
  R(48, 44, 34, 32, 2) + P('M65 44 V56', F);
const pacote = P('M65 10 L120 32 L65 54 L10 32 Z') + P('M10 32 V88 L65 110 V54 M120 32 V88 L65 110') + P('M36 21 L91 43 V58', ' stroke-width="5" stroke-opacity=".45"');
const notaFiscal = (() => {
  let z = 'M10 6 H100 V136 ';
  for (let k = 0; k < 6; k++) { const x = 100 - 15 * k; z += `L${n1(x - 7.5)} 144 L${x - 15} 136 `; }
  return P(z + 'Z') + T(55, 24, 'Nota fiscal', 14) + P('M18 38 H92', F) + P('M20 54 H90 M20 70 H90 M20 86 H70', F) + TL(20, 112, 'Total') + P('M64 116 H90', F);
})();
const contrato = P('M8 4 H96 L122 30 V146 H8 Z M96 4 V30 H122') + P('M22 30 H80 M22 46 H108 M22 62 H108 M22 78 H108 M22 94 H80', F) +
  P('M22 118 C30 102 36 116 40 110 S48 98 52 110 S62 114 68 104', ' stroke-width="2"') + P('M20 126 H76', F) + estrela(102, 118, 14, 10, '', 10) + C(102, 118, 6, F);
const calendarioPrazo = R(6, 18, 128, 116, 6) + P('M6 42 H134') + P('M38 8 V26 M102 8 V26', ' stroke-width="4"') + T(70, 31, 'Prazo', 14) +
  P('M6 70 H134 M6 98 H134 M38 42 V134 M70 42 V134 M102 42 V134', ' stroke-width="1.2"') + C(86, 112, 17, ' stroke-width="3.5"');
const ampulheta = R(8, 6, 74, 10, 3) + R(8, 124, 74, 10, 3) +
  P('M16 16 C16 50 40 58 40 70 C40 82 16 90 16 124 M74 16 C74 50 50 58 50 70 C50 82 74 90 74 124') +
  P('M24 38 Q45 46 66 38 C62 50 50 58 45 64 C40 58 28 50 24 38 Z', ' fill="#C" fill-opacity=".4"') + P('M20 122 Q45 96 70 122 Z', ' fill="#C" fill-opacity=".4"') +
  P('M45 66 V108', ' stroke-width="1.4" stroke-dasharray="3 3"');
const cronometro = (() => {
  let d = '';
  for (let g = 0; g < 360; g += 30) { const [a, b] = polar(60, 82, 48, g), [c, e] = polar(60, 82, 42, g); d += `M${a} ${b} L${c} ${e} `; }
  const [ex, ey] = polar(60, 82, 40, -45);
  return C(60, 82, 52) + R(50, 10, 20, 12, 2) + P('M60 22 V30 M100 40 L108 32') + P(d, F) +
    P(`M60 82 V42 A40 40 0 0 1 ${ex} ${ey} Z`, LEVE) + P(`M60 82 L${ex} ${ey}`, ' stroke-width="3"') + C(60, 82, 4, CH);
})();
const codigoBarras = (() => {
  const w = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3]; let x = 14, s = '';
  w.forEach((k, i) => { if (i % 2 === 0) s += `<rect x="${x}" y="8" width="${k * 1.6}" height="56" fill="#C" stroke="none"/>`; x += k * 1.6 + 1.6; });
  return s + T(80, 78, '0 123456 789012', 14);
})();
const maquininha = R(14, 4, 72, 142, 12) + R(24, 16, 52, 34, 3) + P('M30 34 H52', F) +
  [0, 1, 2, 3].map(r => [34, 50, 66].map(x => C(x, 66 + 16 * r, 4.5, F)).join('')).join('') + R(32, 132, 36, 4, 2, CH);
const atendimento = P('M24 66 A36 36 0 0 1 96 66') + R(12, 58, 18, 34, 6) + R(90, 58, 18, 34, 6) + P('M21 92 Q24 112 52 112') + `<ellipse cx="60" cy="112" rx="8" ry="5"${CH}/>`;
const estoque = P('M10 6 V146 M190 6 V146') + P('M10 52 H190 M10 100 H190 M10 146 H190', ' stroke-width="3"') +
  [[20, 22, 40, 30], [66, 30, 44, 22], [120, 16, 50, 36], [20, 66, 50, 34], [80, 74, 40, 26], [130, 60, 50, 40], [24, 112, 60, 34], [96, 118, 80, 28]]
    .map(([x, y, w, h]) => R(x, y, w, h, 2) + P(`M${x + w / 2} ${y} V${y + 8}`, F)).join('');
const envelope = R(6, 14, 128, 82, 4) + P('M6 18 L70 62 L134 18') + P('M6 92 L52 52 M134 92 L88 52', F);

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "emp-hipoteses-modelo",
        "Hipóteses — plano de validação",
        580,
        224,
        "<text x=\"290\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Hipóteses — plano de validação</text><rect x=\"10\" y=\"42\" width=\"560\" height=\"178\" rx=\"3\"/><text x=\"80\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Hipótese</text><text x=\"220\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Experimento</text><path d=\"M150 42 V220\"/><text x=\"360\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Métrica</text><path d=\"M290 42 V220\"/><text x=\"500\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Critério</text><path d=\"M430 42 V220\"/><path d=\"M10 68 H570\"/><path d=\"M10 106 H570\"/><path d=\"M10 144 H570\"/><path d=\"M10 182 H570\"/>"
      ],
      [
        "emp-acao-responsaveis",
        "Plano de ação — preencher",
        560,
        224,
        "<text x=\"280\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Plano de ação — preencher</text><rect x=\"10\" y=\"42\" width=\"540\" height=\"178\" rx=\"3\"/><text x=\"77.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Ação</text><text x=\"212.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Responsável</text><path d=\"M145 42 V220\"/><text x=\"347.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Prazo</text><path d=\"M280 42 V220\"/><text x=\"482.5\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Indicador</text><path d=\"M415 42 V220\"/><path d=\"M10 68 H550\"/><path d=\"M10 106 H550\"/><path d=\"M10 144 H550\"/><path d=\"M10 182 H550\"/>"
      ]
    ]
  ]
];

export default {
  id: 'empreendedorismo', nome: 'Empreendedorismo e Gestão',
  destaques: ['emp-canvas-nomes', 'emp-proposta-valor', 'emp-5w2h', 'emp-plano-acao', 'emp-eisenhower', 'emp-bcg', 'emp-porter',
    'emp-persona', 'emp-jornada', 'emp-fluxo-caixa', 'emp-ponto-equilibrio', 'emp-dre', 'emp-lampada-ideia', 'emp-foguete', 'emp-dmaic'],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Modelos de negócio', [
      ['emp-canvas', 'Canvas (9 blocos numerados)', 260, 176, canvasNum],
      ['emp-canvas-nomes', 'Canvas do modelo de negócio', 380, 240, grade5([['Parcerias', 'principais'], ['Atividades', 'principais'], ['Proposta', 'de valor'], ['Relaciona-', 'mento'], ['Segmentos', 'de clientes']],
        { 1: ['Recursos', 'principais'], 3: ['Canais'] }, ['Estrutura de custos', 'Fontes de receita'])],
      ['emp-lean-canvas', 'Lean Canvas', 380, 240, grade5([['Problema'], ['Solução'], ['Proposta', 'única', 'de valor'], ['Vantagem', 'injusta'], ['Segmentos', 'de clientes']],
        { 1: ['Métricas', 'principais'], 3: ['Canais'] }, ['Estrutura de custos', 'Fontes de receita'])],
      ['emp-proposta-valor', 'Canvas da proposta de valor', 320, 160, propostaValor],
      ['emp-cadeia-valor', 'Cadeia de valor', 300, 180, cadeiaValor],
      ['emp-circulo-dourado', 'Círculo dourado (por quê, como, o quê)', 200, 200, circuloDourado],
      ['emp-construir-medir', 'Ciclo construir–medir–aprender (MVP)', 260, 200, construirMedir],
      ['emp-plataforma', 'Plataforma de dois lados', 340, 100, plataforma],
      ['emp-tripe', 'Tripé da sustentabilidade (3P)', 220, 184, tripe],
    ]],
    ['Planejamento e estratégia', [
      ['emp-5w2h', 'Quadro 5W2H', 260, 248, q5w2h],
      ['emp-plano-acao', 'Plano de ação (tabela)', 300, 150, planoAcao],
      ['emp-okr', 'OKR (objetivo e resultados-chave)', 260, 162, okr],
      ['emp-bcg', 'Matriz BCG', 276, 222, bcg],
      ['emp-gut', 'Matriz GUT', 320, 146, gut],
      ['emp-eisenhower', 'Matriz de Eisenhower', 256, 242, eisenhower],
      ['emp-ansoff', 'Matriz de Ansoff', 292, 238, ansoff],
      ['emp-esforco-impacto', 'Matriz esforço × impacto', 288, 226, esforcoImpacto],
      ['emp-matriz-risco', 'Matriz de risco (probabilidade × impacto)', 240, 220, matrizRisco],
      ['emp-arvore-problemas', 'Árvore de problemas', 260, 216, arvoreProb],
      ['emp-porter', 'Cinco forças de Porter', 340, 234, porter],
      ['emp-pestel', 'Análise PESTEL', 308, 176, pestel],
      ['emp-bsc', 'Balanced Scorecard (4 perspectivas)', 330, 230, bsc],
      ['emp-smart', 'Meta SMART', 160, 216, smart],
      ['emp-roadmap', 'Roadmap (marcos)', 270, 132, roadmap],
    ]],
    ['Mercado e marketing', [
      ['emp-persona', 'Persona (ficha do cliente)', 260, 160, persona],
      ['emp-mapa-empatia', 'Mapa de empatia', 300, 240, mapaEmpatia],
      ['emp-jornada', 'Jornada do cliente', 330, 150, jornada],
      ['emp-4ps', 'Composto de marketing (4Ps)', 240, 212, quatroPs],
      ['emp-segmentacao', 'Segmentação de mercado', 180, 176, segmentacao],
      ['emp-aarrr', 'Funil AARRR (métricas piratas)', 280, 200, aarrr],
      ['emp-ciclo-vida', 'Ciclo de vida do produto', 320, 214, cicloVida],
      ['emp-curva-adocao', 'Curva de adoção de inovação', 344, 220, curvaAdocao],
      ['emp-posicionamento', 'Mapa de posicionamento', 230, 210, posicionamento],
      ['emp-tam-sam-som', 'Tamanho de mercado (TAM, SAM, SOM)', 220, 220, tamSamSom],
      ['emp-nps', 'Escala NPS (0 a 10)', 320, 121, "<g transform=\"translate(0.00 0.50)\">" + (nps) + "</g>"],
      ['emp-curtida', 'Aprovação (polegar para cima)', 100, 100, curtida],
      ['emp-estrelas', 'Avaliação (estrelas)', 232, 52, estrelas],
      ['emp-etiqueta-preco', 'Etiqueta de preço', 140, 80, etiqueta],
      ['emp-desconto', 'Selo de desconto (%)', 90, 90, desconto],
    ]],
    ['Finanças', [
      ['emp-fluxo-caixa', 'Diagrama de fluxo de caixa', 304, 184, fluxoCaixa],
      ['emp-ponto-equilibrio', 'Ponto de equilíbrio', 350, 219, "<g transform=\"translate(0.00 0.50)\">" + (pontoEquilibrio) + "</g>"],
      ['emp-dre', 'DRE esquemático', 280, 220, dre],
      ['emp-cascata', 'Gráfico em cascata (resultado)', 294, 210, cascata],
      ['emp-balanca', 'Balança: receitas × custos', 240, 182, balanca],
      ['emp-juros', 'Juros simples × compostos', 270, 212, "<g transform=\"translate(0.00 2.50)\">" + (juros) + "</g>"],
      ['emp-payback', 'Payback (saldo acumulado)', 290, 204, payback],
      ['emp-vpl-tir', 'VPL × taxa (TIR)', 270, 196, vplTir],
      ['emp-grafico-cresc', 'Gráfico de crescimento', 206, 162, graficoCresc],
      ['emp-pizza', 'Orçamento (gráfico de pizza)', 170, 170, pizza],
      ['emp-cofrinho', 'Cofrinho', 150, 118, cofrinho],
      ['emp-moeda', 'Moeda (R$)', 80, 80, moeda],
      ['emp-pilha-moedas', 'Pilha de moedas', 108, 104, pilhaMoedas],
      ['emp-cedula', 'Cédula', 170, 90, cedula],
      ['emp-saco-dinheiro', 'Saco de dinheiro', 120, 122, sacoDinheiro],
      ['emp-investimento', 'Investimento (moedas e broto)', 110, 120, investimento],
      ['emp-carteira', 'Carteira', 150, 108, carteira],
      ['emp-cartao', 'Cartão de pagamento', 160, 104, cartao],
    ]],
    ['Pessoas e equipes', [
      ['emp-lideranca', 'Liderança (líder e equipe)', 220, 134, lideranca],
      ['emp-reuniao', 'Reunião (mesa vista de cima)', 220, 150, reuniao],
      ['emp-pitch', 'Pitch (apresentação)', 220, 154, pitch],
      ['emp-aperto-maos', 'Aperto de mãos (acordo)', 220, 108, apertoMaos],
      ['emp-lampada-ideia', 'Ideia de negócio (lâmpada)', 110, 132, lampada],
      ['emp-foguete', 'Foguete (startup)', 120, 148, foguete],
      ['emp-alvo-meta', 'Meta (alvo com flecha)', 124, 116, alvoMeta],
      ['emp-escada', 'Escada até a meta', 216, 168, escada],
      ['emp-quebra-cabeca', 'Quebra-cabeça (parceria)', 200, 114, quebraCabeca],
      ['emp-empreendedor', 'Empreendedor', 100, 120, empreendedor],
      ['emp-cracha', 'Crachá', 100, 138, cracha],
      ['emp-maleta', 'Maleta', 150, 108, maleta],
      ['emp-engrenagens', 'Engrenagens (trabalho em conjunto)', 164, 132, engrenagens],
      ['emp-tuckman', 'Estágios da equipe (Tuckman)', 310, 170, tuckman],
      ['emp-raci', 'Matriz RACI', 280, 144, raci],
      ['emp-feedback', 'Feedback', 220, 130, feedback],
    ]],
    ['Processos e qualidade', [
      ['emp-dmaic', 'Ciclo DMAIC (Seis Sigma)', 340, 248, dmaic],
      ['emp-5s', 'Programa 5S', 380, 256, cincoS],
      ['emp-sipoc', 'Mapa SIPOC', 380, 131, "<g transform=\"translate(0.00 0.00)\">" + (sipoc) + "</g>"],
      ['emp-linha-producao', 'Linha de produção (esteira)', 300, 128, linhaProducao],
      ['emp-cadeia-suprimentos', 'Cadeia de suprimentos', 370, 102, cadeiaSup],
      ['emp-kaizen', 'Melhoria contínua (PDCA na rampa)', 260, 176, kaizen],
      ['emp-vsm', 'Fluxo de valor (VSM)', 280, 108, vsm],
      ['emp-indicador', 'Indicador de desempenho (KPI)', 182, 127, "<g transform=\"translate(0.00 0.00)\">" + (velocimetro) + "</g>"],
      ['emp-selo-qualidade', 'Selo de qualidade', 110, 140, seloQualidade],
      ['emp-checklist', 'Lista de verificação', 150, 144, checklist],
    ]],
    ['Ícones de negócio', [
      ['emp-loja', 'Loja', 170, 148, loja],
      ['emp-carrinho', 'Carrinho de compras', 150, 120, carrinho],
      ['emp-entrega', 'Entrega (furgão)', 190, 116, entrega],
      ['emp-pacote', 'Pacote (caixa)', 130, 116, pacote],
      ['emp-nota-fiscal', 'Nota fiscal', 110, 150, notaFiscal],
      ['emp-contrato', 'Contrato assinado', 130, 150, contrato],
      ['emp-calendario-prazo', 'Prazo no calendário', 140, 138, calendarioPrazo],
      ['emp-ampulheta', 'Ampulheta (prazo)', 90, 140, ampulheta],
      ['emp-cronometro', 'Cronômetro', 120, 138, cronometro],
      ['emp-codigo-barras', 'Código de barras', 160, 90, codigoBarras],
      ['emp-maquininha', 'Maquininha de cartão', 100, 150, maquininha],
      ['emp-atendimento', 'Atendimento (headset)', 120, 122, atendimento],
      ['emp-estoque', 'Estoque (prateleira)', 200, 150, estoque],
      ['emp-envelope', 'Mensagem (envelope)', 140, 104, envelope],
    ]],
  ],
};
