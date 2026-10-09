// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Tipos de folha (fundo do quadro). Tudo desenhado só na área visível, em coordenadas de tela.
export const PAPERS = [
  ['none', 'Lisa'], ['grid', 'Quadriculada'], ['mm', 'Milimetrada'], ['dots', 'Pontilhada'],
  ['lines', 'Pautada'], ['notebook', 'Caderno'], ['calligraphy', 'Caligrafia'], ['iso', 'Isométrica'],
  ['hex', 'Hexagonal'], ['cartesian', 'Plano cartesiano'], ['polar', 'Polar'], ['music', 'Pauta musical'],
  ['cornell', 'Cornell'],
  // folhas temáticas
  ['cartfine', 'Cartesiano milimetrado'], ['numberline', 'Reta numérica'], ['axes3d', 'Eixos 3D'], ['trigrid', 'Malha triangular'],
  ['unitcircle', 'Círculo trigonométrico'],
  ['semilog', 'Monolog (semilog)'], ['loglog', 'Log-log'], ['kinematics', 'Cinemática (s, v, a)'], ['pv', 'Diagrama P×V'],
  ['drawing', 'Desenho técnico A4'], ['ternary', 'Diagrama ternário'],
  ['normprob', 'Probabilidade normal'], ['gumbel', 'Papel de Gumbel'], ['weibull', 'Papel de Weibull'],
  ['moody', 'Diagrama de Moody'], ['granulo', 'Granulometria'],
  ['scope', 'Osciloscópio'], ['smith', 'Carta de Smith'], ['bode', 'Diagrama de Bode'], ['timing', 'Diagrama de tempo'],
  ['phasor', 'Fasores trifásicos'],
  ['code', 'Folha de código'], ['deskcheck', 'Teste de mesa'], ['terminal', 'Terminal'],
  ['punnett2', 'Punnett 2×2'], ['punnett4', 'Punnett 4×4'], ['microscope', 'Campo de microscópio'],
  ['essay', 'Redação (30 linhas)'], ['literacy', 'Alfabetização'], ['comics', 'Quadrinhos (HQ)'], ['storyboard', 'Storyboard'],
  ['tab', 'Tablatura'], ['piano', 'Pauta de piano'], ['percussion', 'Pauta de percussão'],
  ['timeline', 'Linha do tempo'], ['latlon', 'Latitude e longitude'],
  ['canvas', 'Canvas de negócio'], ['kanban', 'Kanban'], ['matrix2', 'Matriz 2×2'], ['calendar', 'Calendário mensal'],
  ['weekly', 'Planner semanal'], ['table', 'Tabela'], ['cols2', 'Duas colunas'], ['cols3', 'Três colunas'],
  ['plot', 'Croqui de área'],
];
// folhas presas a uma origem (não se repetem pelo quadro inteiro)
export const ANCHORED = new Set(['notebook', 'cartesian', 'polar', 'cornell',
  'cartfine', 'axes3d', 'unitcircle', 'semilog', 'loglog', 'kinematics', 'pv', 'drawing', 'ternary', 'normprob', 'gumbel',
  'weibull', 'moody', 'granulo', 'scope', 'smith', 'bode', 'phasor', 'code', 'deskcheck', 'terminal', 'punnett2', 'punnett4',
  'microscope', 'essay', 'comics', 'storyboard', 'timeline', 'latlon', 'canvas', 'kanban', 'matrix2', 'calendar', 'weekly',
  'table', 'cols2', 'cols3', 'plot']);
export const SIZE = { s: 0.6, m: 1, l: 1.6 };
export const CELL = 40;   // lado do quadradinho da malha em tamanho M (px de mundo)
const STRENGTH = { soft: 0.55, normal: 1, strong: 1.8 };

export function isDark(hex) {
  const c = (hex || '#ffffff').replace('#', '');
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}

function rgba(hex, a) {
  const c = hex.replace('#', '');
  return `rgba(${parseInt(c.slice(0, 2), 16)},${parseInt(c.slice(2, 4), 16)},${parseInt(c.slice(4, 6), 16)},${Math.min(1, a)})`;
}

export function drawBackground(ctx, bg, view, w, h) {
  ctx.save();
  ctx.fillStyle = bg.color;
  ctx.fillRect(0, 0, w, h);
  const fn = DRAW[bg.pattern];
  if (fn) {
    const str = STRENGTH[bg.strength] || 1, dark = isDark(bg.color), pb = bg.pageBox;
    // no modo caderno, as folhas presas a uma origem ficam no centro da página
    const o = pb && ANCHORED.has(bg.pattern) && bg.pattern !== 'notebook' ? { x: pb.x + pb.w / 2, y: pb.y + pb.h / 2 } : bg.origin || { x: 0, y: 0 };
    const P = {
      ctx, w, h, z: view.zoom, v: view, k: SIZE[bg.size] || 1, o, dark, page: pb, bg: bg.color,
      col: (m = 1) => bg.lineColor ? rgba(bg.lineColor, 0.4 * str * m) : dark ? `rgba(255,255,255,${Math.min(1, 0.15 * str * m)})` : `rgba(0,0,0,${Math.min(1, 0.11 * str * m)})`,
      red: (m = 1) => `rgba(232,18,36,${Math.min(1, 0.4 * str * m)})`,
      sx: x => x * view.zoom + view.x, sy: y => y * view.zoom + view.y,
    };
    ctx.lineWidth = 1;
    fn(P);
  }
  ctx.restore();
}

// família de retas paralelas: ângulo (graus), espaçamento e um ponto por onde uma delas passa (mundo)
function family(P, ang, sp, color, { phase = P.o, width = 1, dash = null, min = 5 } = {}) {
  const { ctx, w, h, z } = P;
  const ssp = sp * z;
  if (ssp < min) return false;
  const a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const c0 = nx * P.sx(phase.x) + ny * P.sy(phase.y);
  const cs = [0, nx * w, ny * h, nx * w + ny * h];
  const k0 = Math.ceil((Math.min(...cs) - c0) / ssp), k1 = Math.floor((Math.max(...cs) - c0) / ssp);
  if (k1 - k0 > 3000) return false;
  const L = (w + h) * 2, crisp = ang % 90 === 0;
  ctx.beginPath();
  for (let k = k0; k <= k1; k++) {
    const c = c0 + k * ssp;
    let bx = nx * c, by = ny * c;
    if (crisp) { bx = Math.round(bx) + 0.5; by = Math.round(by) + 0.5; }
    ctx.moveTo(bx - dx * L, by - dy * L);
    ctx.lineTo(bx + dx * L, by + dy * L);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash || []);
  ctx.stroke();
  ctx.setLineDash([]);
  return true;
}

// espaçamento que dobra até ficar legível
const fit = (P, sp, min = 10) => { while (sp * P.z < min) sp *= 2; return sp; };

function line(P, x1, y1, x2, y2) {
  P.ctx.moveTo(Math.round(P.sx(x1)) + 0.5, Math.round(P.sy(y1)) + 0.5);
  P.ctx.lineTo(Math.round(P.sx(x2)) + 0.5, Math.round(P.sy(y2)) + 0.5);
}

function worldRect(P) {
  return { x0: -P.v.x / P.z, y0: -P.v.y / P.z, x1: (P.w - P.v.x) / P.z, y1: (P.h - P.v.y) / P.z };
}

function label(P, text, x, y, align = 'center', base = 'top') {
  const { ctx } = P;
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.textAlign = align; ctx.textBaseline = base;
  ctx.fillText(text, x, y);
}

const DRAW = {
  grid(P) {
    const sp = fit(P, 40 * P.k);
    family(P, 0, sp, P.col()); family(P, 90, sp, P.col());
  },
  mm(P) {
    const u = 8 * P.k; // 1 mm
    family(P, 0, u, P.col(0.55)); family(P, 90, u, P.col(0.55));
    family(P, 0, u * 5, P.col(1.1)); family(P, 90, u * 5, P.col(1.1));
    family(P, 0, u * 10, P.col(1.9), { min: 3 }); family(P, 90, u * 10, P.col(1.9), { min: 3 });
  },
  dots(P) {
    const { ctx, w, h } = P;
    const sp = fit(P, 30 * P.k, 12), ssp = sp * P.z;
    const ox = ((P.sx(P.o.x) % ssp) + ssp) % ssp, oy = ((P.sy(P.o.y) % ssp) + ssp) % ssp;
    const r = Math.max(1, Math.min(2.4, P.z * 1.6 * P.k));
    ctx.beginPath();
    for (let x = ox; x < w; x += ssp) for (let y = oy; y < h; y += ssp) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }
    ctx.fillStyle = P.col(1.6);
    ctx.fill();
  },
  lines(P) { family(P, 0, fit(P, 32 * P.k), P.col(1.2)); },
  notebook(P) {
    family(P, 0, fit(P, 32 * P.k), P.col(1.2));
    const { ctx } = P;
    ctx.beginPath();
    const x = Math.round(P.sx(P.o.x)) + 0.5;
    ctx.moveTo(x, 0); ctx.lineTo(x, P.h);
    ctx.moveTo(x + 3, 0); ctx.lineTo(x + 3, P.h);
    ctx.strokeStyle = P.red(); ctx.stroke();
  },
  calligraphy(P) {
    const u = 14 * P.k, per = 5 * u;
    if (u * P.z < 3) return;
    const ph = d => ({ x: P.o.x, y: P.o.y + d });
    family(P, 0, per, P.col(0.8), { phase: ph(0), min: 8 });            // ascendente
    family(P, 0, per, P.col(1.1), { phase: ph(u), dash: [6, 5], min: 8 }); // altura do x
    family(P, 0, per, P.col(2.2), { phase: ph(2 * u), min: 8 });        // linha de base
    family(P, 0, per, P.col(0.8), { phase: ph(3 * u), min: 8 });        // descendente
  },
  iso(P) {
    const sp = fit(P, 40 * P.k * Math.sqrt(3) / 2, 9);
    family(P, 90, sp, P.col()); family(P, 30, sp, P.col()); family(P, 150, sp, P.col());
  },
  hex(P) {
    const a = 26 * P.k;
    if (a * P.z < 6) return;
    const { ctx } = P, r = worldRect(P), hh = Math.sqrt(3) * a;
    const i0 = Math.floor((r.x0 - P.o.x) / (1.5 * a)) - 1, i1 = Math.ceil((r.x1 - P.o.x) / (1.5 * a)) + 1;
    const j0 = Math.floor((r.y0 - P.o.y) / hh) - 1, j1 = Math.ceil((r.y1 - P.o.y) / hh) + 1;
    if ((i1 - i0) * (j1 - j0) > 20000) return;
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const cx = P.o.x + i * 1.5 * a, cy = P.o.y + j * hh + (((i % 2) + 2) % 2 ? hh / 2 : 0);
      for (let q = 0; q <= 6; q++) {
        const ang = q * Math.PI / 3, x = P.sx(cx + a * Math.cos(ang)), y = P.sy(cy + a * Math.sin(ang));
        q ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
    }
    ctx.strokeStyle = P.col(1.1); ctx.stroke();
  },
  cartesian(P) {
    const cell = 40 * P.k, sp = fit(P, cell);
    family(P, 0, sp, P.col()); family(P, 90, sp, P.col());
    const { ctx } = P, X = Math.round(P.sx(P.o.x)) + 0.5, Y = Math.round(P.sy(P.o.y)) + 0.5;
    ctx.beginPath(); ctx.moveTo(0, Y); ctx.lineTo(P.w, Y); ctx.moveTo(X, 0); ctx.lineTo(X, P.h);
    ctx.strokeStyle = P.col(4.5); ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1;
    // números nos eixos
    let step = 1;
    for (const m of [1, 2, 5, 10, 20, 50, 100, 200, 500]) { step = m; if (m * cell * P.z >= 36) break; }
    ctx.fillStyle = P.col(5);
    const r = worldRect(P);
    if (Y > 0 && Y < P.h) for (let n = Math.ceil((r.x0 - P.o.x) / cell / step) * step; P.o.x + n * cell <= r.x1; n += step)
      if (n) label(P, String(n), P.sx(P.o.x + n * cell), Y + 4);
    if (X > 0 && X < P.w) for (let n = Math.ceil((r.y0 - P.o.y) / cell / step) * step; P.o.y + n * cell <= r.y1; n += step)
      if (n) label(P, String(-n), X - 5, P.sy(P.o.y + n * cell), 'right', 'middle');
    if (Y > 0 && Y < P.h) label(P, 'x', P.w - 14, Y - 18);
    if (X > 0 && X < P.w) label(P, 'y', X + 12, 8);
    if (X > 0 && X < P.w && Y > 0 && Y < P.h) label(P, '0', X - 5, Y + 4, 'right');
  },
  polar(P) {
    const { ctx } = P, rs = 40 * P.k * P.z;
    if (rs < 6) return;
    const cx = P.sx(P.o.x), cy = P.sy(P.o.y);
    const corners = [[0, 0], [P.w, 0], [0, P.h], [P.w, P.h]].map(([x, y]) => Math.hypot(x - cx, y - cy));
    const dmax = Math.max(...corners);
    const ex = cx < 0 ? -cx : cx > P.w ? cx - P.w : 0, ey = cy < 0 ? -cy : cy > P.h ? cy - P.h : 0;
    const dmin = Math.hypot(ex, ey);
    ctx.beginPath();
    for (let k = Math.max(1, Math.ceil(dmin / rs)); k * rs <= dmax && k < 2000; k++) { ctx.moveTo(cx + k * rs, cy); ctx.arc(cx, cy, k * rs, 0, Math.PI * 2); }
    ctx.strokeStyle = P.col(1.2); ctx.stroke();
    for (let d = 0; d < 360; d += 15) {
      const a = -d * Math.PI / 180;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * dmax, cy + Math.sin(a) * dmax);
      ctx.strokeStyle = P.col(d % 90 === 0 ? 4 : d % 45 === 0 ? 1.8 : 1); ctx.stroke();
    }
    const lr = Math.max(1, Math.round(160 / rs)) * rs + 10;
    ctx.fillStyle = P.col(5);
    for (let d = 0; d < 360; d += 30) {
      const a = -d * Math.PI / 180;
      label(P, d + '°', cx + Math.cos(a) * lr, cy + Math.sin(a) * lr, 'center', 'middle');
    }
  },
  music(P) {
    const u = 10 * P.k, per = 12 * u;
    if (u * P.z < 3) return;
    for (let i = 0; i < 5; i++) family(P, 0, per, P.col(2), { phase: { x: P.o.x, y: P.o.y + i * u }, min: 8 });
  },
  cornell(P) {
    const { ctx } = P, pb = P.page;
    const W = pb ? pb.w - 80 : 1200, H = pb ? pb.h - 80 : 1600;
    const x0 = P.o.x - W / 2, y0 = P.o.y - H / 2, x1 = x0 + W, y1 = y0 + H;
    const top = y0 + 110, cue = x0 + W * 0.3, sum = y1 - H * 0.2;
    ctx.beginPath();
    for (let y = top + 40; y < sum; y += 40) line(P, cue, y, x1, y);
    ctx.strokeStyle = P.col(0.8); ctx.stroke();
    ctx.beginPath();
    line(P, x0, y0, x1, y0); line(P, x1, y0, x1, y1); line(P, x1, y1, x0, y1); line(P, x0, y1, x0, y0);
    line(P, x0, top, x1, top); line(P, cue, top, cue, sum); line(P, x0, sum, x1, sum);
    ctx.strokeStyle = P.col(3.5); ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1;
    if (P.z > 0.15) {
      ctx.fillStyle = P.col(4);
      label(P, 'Título / data', P.sx(x0 + 16), P.sy(y0 + 14), 'left');
      label(P, 'Palavras-chave / perguntas', P.sx(x0 + 16), P.sy(top + 12), 'left');
      label(P, 'Anotações', P.sx(cue + 16), P.sy(top + 12), 'left');
      label(P, 'Resumo', P.sx(x0 + 16), P.sy(sum + 12), 'left');
    }
  },
};

// ===================================================================================================
// Folhas temáticas. Tudo gerado por conta (sem copiar cartas publicadas). As "folhas fixas" têm um
// tamanho em mundo (SHEET), ficam centradas na origem e, no modo caderno, ocupam a página (P.page).
// ===================================================================================================
const SHEET = {
  axes3d: [1000, 860], unitcircle: [1100, 1100], semilog: [1600, 1000], loglog: [1400, 1100], kinematics: [1200, 1560],
  pv: [1300, 1000], drawing: [794, 1123], ternary: [1200, 1080], normprob: [1300, 1100], gumbel: [1500, 1000],
  weibull: [1300, 1100], moody: [1700, 1100], granulo: [1700, 1100], scope: [960, 800], smith: [1100, 1100],
  bode: [1300, 1300], phasor: [1100, 1100], code: [1200, 1600], deskcheck: [1600, 1100], terminal: [1600, 1000],
  punnett2: [760, 760], punnett4: [1000, 1000], microscope: [1100, 1180], essay: [1200, 1600], comics: [1100, 1500],
  storyboard: [1600, 1050], canvas: [1700, 1100], kanban: [1600, 1050], matrix2: [1100, 1100], calendar: [1600, 1150],
  weekly: [1700, 1100], table: [1300, 1100], cols2: [1200, 1600], cols3: [1600, 1150], plot: [1600, 1130], latlon: [1600, 900],
};

const LG = Math.log10;
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const pow10 = e => e === 0 ? '1' : e === 1 ? '10' : '10' + String(e).split('').map(c => SUP[c]).join('');
const nf = v => String(+(+v).toPrecision(6)).replace('.', ',').replace('-', '−');

// retângulo da folha fixa em mundo: a página inteira (menos a margem) no modo caderno, senão o tamanho padrão
function box(P, key, m = 40) {
  const pb = P.page;
  if (pb) return { x0: pb.x + m, y0: pb.y + m, x1: pb.x + pb.w - m, y1: pb.y + pb.h - m };
  const [W, H] = SHEET[key];
  return { x0: P.o.x - W / 2, y0: P.o.y - H / 2, x1: P.o.x + W / 2, y1: P.o.y + H / 2 };
}
const bw = b => b.x1 - b.x0, bh = b => b.y1 - b.y0;
const inset = (b, l, t, r, d) => ({ x0: b.x0 + l, y0: b.y0 + t, x1: b.x1 - r, y1: b.y1 - d });
// maior retângulo de proporção ar (= largura/altura) centrado dentro de b
function fitIn(b, ar) {
  let w = bw(b), h = w / ar;
  if (h > bh(b)) { h = bh(b); w = h * ar; }
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  return { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 };
}
function seen(P, b, pad = 80) {
  const r = worldRect(P);
  return b.x1 + pad > r.x0 && b.x0 - pad < r.x1 && b.y1 + pad > r.y0 && b.y0 - pad < r.y1;
}
function stroke(P, color, width, draw, dash) {
  const { ctx } = P;
  ctx.beginPath(); draw();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []);
  ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
}
function rect(P, b) { line(P, b.x0, b.y0, b.x1, b.y0); line(P, b.x1, b.y0, b.x1, b.y1); line(P, b.x1, b.y1, b.x0, b.y1); line(P, b.x0, b.y1, b.x0, b.y0); }
function fillBox(P, b, color) {
  P.ctx.fillStyle = color;
  P.ctx.fillRect(P.sx(b.x0), P.sy(b.y0), (b.x1 - b.x0) * P.z, (b.y1 - b.y0) * P.z);
}
// segmento sem arredondar (diagonais e curvas)
function seg(P, x1, y1, x2, y2) { P.ctx.moveTo(P.sx(x1), P.sy(y1)); P.ctx.lineTo(P.sx(x2), P.sy(y2)); }
function poly(P, pts) { pts.forEach(([x, y], i) => i ? P.ctx.lineTo(P.sx(x), P.sy(y)) : P.ctx.moveTo(P.sx(x), P.sy(y))); }
function arrow(P, x1, y1, x2, y2, color, width = 1.5, head = 14) {
  stroke(P, color, width, () => seg(P, x1, y1, x2, y2));
  const a = Math.atan2(y2 - y1, x2 - x1), { ctx } = P;
  ctx.beginPath();
  ctx.moveTo(P.sx(x2), P.sy(y2));
  ctx.lineTo(P.sx(x2 - head * Math.cos(a - 0.38)), P.sy(y2 - head * Math.sin(a - 0.38)));
  ctx.lineTo(P.sx(x2 - head * Math.cos(a + 0.38)), P.sy(y2 - head * Math.sin(a + 0.38)));
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
// texto com tamanho em mundo (some quando fica ilegível; não desenha longe da tela)
function T(P, s, x, y, size, { align = 'center', base = 'middle', m = 4.5, bold = false, rot = 0, color = null, italic = false, maxW = 0 } = {}) {
  let px = size * P.z;
  if (px < 5) return;
  const X = P.sx(x), Y = P.sy(y), far = Math.max(300, px * 20);
  if (X < -far || X > P.w + far || Y < -far || Y > P.h + far) return;
  const { ctx } = P;
  const font = () => { ctx.font = `${italic ? 'italic ' : ''}${bold ? '600 ' : ''}${Math.min(px, 600).toFixed(1)}px "Segoe UI", sans-serif`; };
  font();
  if (maxW > 0) {   // encolhe para caber na largura (em mundo) disponível
    const tw = ctx.measureText(s)?.width || 0, lim = maxW * P.z;
    if (tw > lim) { px *= lim / tw; if (px < 5) return; font(); }
  }
  ctx.textAlign = align; ctx.textBaseline = base; ctx.fillStyle = color || P.col(m);
  if (rot) { ctx.save(); ctx.translate(X, Y); ctx.rotate(rot); ctx.fillText(s, 0, 0); ctx.restore(); }
  else ctx.fillText(s, X, Y);
}

// ---------- eixos de gráfico: map(v) → 0..1, linhas [[v, nível 0|1|2]], rótulos [[v, texto]] ----------
function linAx(min, max, step, sub = 1, every = 1, fmt = nf) {
  const map = v => (v - min) / (max - min), lines = [], labels = [];
  const n = Math.round((max - min) / step * sub);
  for (let i = 0; i <= n; i++) {
    const v = min + i * step / sub, maj = i % sub === 0;
    lines.push([v, maj ? 2 : (sub % 2 === 0 && i % (sub / 2) === 0) ? 1 : 0]);
    if (maj && fmt && (i / sub) % every === 0) labels.push([v, fmt(v)]);
  }
  return { map, lines, labels };
}
function logAx(e0, e1, fmt = (v, e) => pow10(e)) {
  const map = v => (LG(v) - e0) / (e1 - e0), lines = [], labels = [];
  for (let e = e0; e <= e1; e++) for (let m = 1; m <= 9; m++) {
    if (e === e1 && m > 1) break;
    const v = m * 10 ** e;
    lines.push([v, m === 1 ? 2 : m === 5 ? 1 : 0]);
    if (m === 1 && fmt) labels.push([v, fmt(v, e)]);
  }
  return { map, lines, labels };
}
const custAx = (map, major, minor = [], fmt = nf) =>
  ({ map, lines: [...minor.map(v => [v, 0]), ...major.map(v => [v, 2])], labels: fmt ? major.map(v => [v, fmt(v)]) : [] });

const LVL = [0.6, 1.25, 2.3];
function chart(P, pr, X, Y, { fs = 14, xl = true, yl = true } = {}) {
  const W = pr.x1 - pr.x0, H = pr.y1 - pr.y0;
  const fx = v => pr.x0 + X.map(v) * W, fy = v => pr.y1 - Y.map(v) * H;
  for (let l = 0; l < 3; l++) {
    const xs = X.lines.filter(a => a[1] === l), ys = Y.lines.filter(a => a[1] === l);
    const okx = l > 0 || W * P.z / (X.lines.length || 1) > 3, oky = l > 0 || H * P.z / (Y.lines.length || 1) > 3;
    stroke(P, P.col(LVL[l]), 1, () => {
      if (okx) for (const [v] of xs) line(P, fx(v), pr.y0, fx(v), pr.y1);
      if (oky) for (const [v] of ys) line(P, pr.x0, fy(v), pr.x1, fy(v));
    });
  }
  stroke(P, P.col(3), 1.5, () => rect(P, pr));
  if (xl) for (const [v, s] of X.labels) T(P, s, fx(v), pr.y1 + fs * 0.5, fs, { base: 'top' });
  if (yl) for (const [v, s] of Y.labels) T(P, s, pr.x0 - fs * 0.5, fy(v), fs, { align: 'right' });
  return { fx, fy };
}

// inversa da normal padrão (aproximação racional de Acklam, erro < 1,2e-9)
function qnorm(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - pl) return -qnorm(1 - p);
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
// fator de atrito pela equação de Colebrook-White (iteração de ponto fixo em 1/√f)
function colebrook(eps, Re) {
  let x = 8;
  for (let i = 0; i < 40; i++) x = -2 * LG(eps / 3.7 + 2.51 * x / Re);
  return 1 / (x * x);
}
const MOODY_EPS = [0.05, 0.04, 0.03, 0.02, 0.015, 0.01, 0.008, 0.006, 0.004, 0.002, 0.001, 0.0008, 0.0006, 0.0004, 0.0002, 0.0001, 0.00005, 0.00001];
let MOODY = null;   // curvas calculadas uma vez: [ε, [[Re, f], …]]
function moodyCurves() {
  if (MOODY) return MOODY;
  MOODY = [...MOODY_EPS, 0].map(eps => {
    const pts = [];
    for (let i = 0; i <= 140; i++) { const Re = 10 ** (LG(4000) + i * (8 - LG(4000)) / 140); pts.push([Re, colebrook(eps, Re)]); }
    return [eps, pts];
  });
  return MOODY;
}

// pautas repetidas (tablatura, piano, percussão): x da "cabeça" da pauta, presa à esquerda da tela ou da página
const staffX = P => P.page ? P.sx(P.page.x + 24) : 14;
function rows(P, per, phase) {
  const r = worldRect(P);
  return { j0: Math.floor((r.y0 - phase) / per) - 1, j1: Math.ceil((r.y1 - phase) / per) + 1 };
}

Object.assign(DRAW, {
  // ------------------------------------------------------------------ Matemática e cálculo
  cartfine(P) {
    family(P, 0, 8 * P.k, P.col(0.5)); family(P, 90, 8 * P.k, P.col(0.5));
    DRAW.cartesian(P);
  },
  trigrid(P) {
    const sp = fit(P, 40 * P.k * Math.sqrt(3) / 2, 9);
    for (const a of [0, 60, 120]) family(P, a, sp, P.col());
    for (const a of [0, 60, 120]) family(P, a, sp * 5, P.col(1.7), { min: 30 });
  },
  numberline(P) {
    const cell = 40 * P.k, per = 4 * cell;
    if (per * P.z < 6) return;
    const ox = P.page ? P.page.x + 2 * cell : P.o.x, oy = P.o.y + (P.page ? per / 2 : 0);
    const r = worldRect(P), { j0, j1 } = rows(P, per, oy);
    if (j1 - j0 > 500) return;
    stroke(P, P.col(3.2), 1.5, () => { for (let j = j0; j <= j1; j++) line(P, r.x0, oy + j * per, r.x1, oy + j * per); });
    if (cell * P.z < 7) return;
    let st = 1;
    for (const m of [1, 2, 5, 10, 20, 50]) { st = m; if (m * cell * P.z >= 7) break; }
    let ls = 1;
    for (const m of [1, 2, 5, 10, 20, 50, 100]) { ls = m; if (m * cell * P.z >= 28) break; }
    const n0 = Math.ceil((r.x0 - ox) / cell / st) * st, n1 = Math.floor((r.x1 - ox) / cell);
    const { ctx } = P;
    stroke(P, P.col(3.2), 1.5, () => {
      for (let j = j0; j <= j1; j++) {
        const Y = Math.round(P.sy(oy + j * per)) + 0.5;
        for (let n = n0; n <= n1; n += st) {
          const X = Math.round(P.sx(ox + n * cell)) + 0.5, L = n === 0 ? 11 : n % 5 === 0 ? 8 : 5;
          ctx.moveTo(X, Y - L); ctx.lineTo(X, Y + L);
        }
      }
    });
    ctx.fillStyle = P.col(4.5);
    for (let j = j0; j <= j1; j++) {
      const Y = P.sy(oy + j * per);
      for (let n = Math.ceil((r.x0 - ox) / cell / ls) * ls; n <= n1; n += ls)
        label(P, n < 0 ? '−' + (-n) : String(n), P.sx(ox + n * cell), Y + 12);
    }
  },
  axes3d(P) {
    const b = box(P, 'axes3d');
    if (!seen(P, b)) return;
    const N = 10, dx = -0.42, dy = 0.42;
    const g = Math.min((bw(b) - 160) / ((1 - dx) * N), (bh(b) - 140) / ((1 + dy) * N));
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const O = { x: cx - (N + dx * N) / 2 * g, y: cy + (N - dy * N) / 2 * g };
    const pr = (x, y, z) => [O.x + (y + x * dx) * g, O.y + (-z + x * dy) * g];
    const S = (a, c) => seg(P, a[0], a[1], c[0], c[1]);
    for (const maj of [false, true]) stroke(P, P.col(maj ? 2.6 : 1.5), 1, () => {
      for (let i = 1; i <= N; i++) if ((i % 5 === 0) === maj) { S(pr(i, 0, 0), pr(i, N, 0)); S(pr(0, i, 0), pr(N, i, 0)); }
    });
    // planos xz e yz bem leves, só as bordas
    stroke(P, P.col(0.9), 1, () => { S(pr(0, 0, N), pr(0, N, N)); S(pr(0, N, 0), pr(0, N, N)); S(pr(0, 0, N), pr(N, 0, N)); S(pr(N, 0, 0), pr(N, 0, N)); }, [6, 6]);
    const ax = P.col(4.5);
    stroke(P, P.col(2), 1.5, () => { S(pr(0, 0, 0), pr(-2.5, 0, 0)); S(pr(0, 0, 0), pr(0, -2, 0)); S(pr(0, 0, 0), pr(0, 0, -2)); }, [5, 5]);
    for (const [e, t] of [[[N + 1.6, 0, 0], 'x'], [[0, N + 1.2, 0], 'y'], [[0, 0, N + 1.2], 'z']]) {
      const o = pr(0, 0, 0), p = pr(...e);
      arrow(P, o[0], o[1], p[0], p[1], ax, 2, 16);
      T(P, t, p[0] + (t === 'y' ? 18 : t === 'x' ? -14 : 16), p[1] + (t === 'x' ? 14 : t === 'z' ? 6 : -14), 28, { italic: true, bold: true, m: 5 });
    }
    for (let i = 2; i <= N; i += 2) {
      let p = pr(i, 0, 0); T(P, String(i), p[0] - 14, p[1] - 4, 15, { align: 'right' });
      p = pr(0, i, 0); T(P, String(i), p[0], p[1] + 8, 15, { base: 'top' });
      p = pr(0, 0, i); T(P, String(i), p[0] - 10, p[1], 15, { align: 'right' });
      stroke(P, ax, 1.5, () => { const q = pr(0, 0, i); seg(P, q[0] - 6, q[1], q[0] + 6, q[1]); });
    }
    T(P, '0', O.x - 10, O.y + 8, 15, { align: 'right', base: 'top' });
  },
  unitcircle(P) {
    const b = fitIn(box(P, 'unitcircle'), 1);
    if (!seen(P, b)) return;
    const R = bw(b) / 2 - 120, cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    if (R <= 0) return;
    const { ctx } = P;
    // malha leve de décimos do raio
    stroke(P, P.col(0.55), 1, () => { for (let i = -12; i <= 12; i++) { line(P, cx + i * R / 10, cy - 1.2 * R, cx + i * R / 10, cy + 1.2 * R); line(P, cx - 1.2 * R, cy + i * R / 10, cx + 1.2 * R, cy + i * R / 10); } });
    const ax = P.col(4.5);
    arrow(P, cx - 1.3 * R, cy, cx + 1.3 * R, cy, ax, 1.5, 16);
    arrow(P, cx, cy + 1.3 * R, cx, cy - 1.3 * R, ax, 1.5, 16);
    T(P, 'cos', cx + 1.3 * R, cy + 16, 20, { align: 'right', base: 'top', italic: true });
    T(P, 'sen', cx + 14, cy - 1.3 * R, 20, { align: 'left', base: 'top', italic: true });
    stroke(P, P.col(4.5), 2, () => { ctx.moveTo(P.sx(cx + R), P.sy(cy)); ctx.arc(P.sx(cx), P.sy(cy), R * P.z, 0, Math.PI * 2); });
    const RAD = { 0: '0 · 2π', 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2', 120: '2π/3', 135: '3π/4', 150: '5π/6', 180: 'π', 210: '7π/6', 225: '5π/4', 240: '4π/3', 270: '3π/2', 300: '5π/3', 315: '7π/4', 330: '11π/6' };
    const angs = Object.keys(RAD).map(Number);
    stroke(P, P.col(1.6), 1, () => { for (const d of angs) if (d % 90) { const a = d * Math.PI / 180; seg(P, cx, cy, cx + R * Math.cos(a), cy - R * Math.sin(a)); } }, [6, 6]);
    // projeções dos ângulos do 1º quadrante
    stroke(P, P.col(1.2), 1, () => {
      for (const d of [30, 45, 60]) { const a = d * Math.PI / 180, x = cx + R * Math.cos(a), y = cy - R * Math.sin(a); seg(P, x, y, x, cy); seg(P, x, y, cx, y); }
    }, [3, 5]);
    ctx.beginPath();
    for (const d of angs) { const a = d * Math.PI / 180, x = P.sx(cx + R * Math.cos(a)), y = P.sy(cy - R * Math.sin(a)); ctx.moveTo(x + 4 * Math.min(1, P.z * 2), y); ctx.arc(x, y, 4 * Math.min(1, P.z * 2), 0, Math.PI * 2); }
    ctx.fillStyle = P.col(5); ctx.fill();
    for (const d of angs) {
      const a = d * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      let x = cx + (R + 62) * c, y = cy - (R + 62) * s, al = 'center';
      if (d === 90 || d === 270) { x = cx + 14; al = 'left'; y = cy - (R + 40) * s; }   // ao lado do eixo, não em cima
      if (d === 0 || d === 180) { x = cx + (R + 48) * c; y = cy - 34; }                  // acima do eixo
      T(P, d === 0 ? '0° · 360°' : d + '°', x, y - 11, 17, { m: 5, align: al });
      T(P, RAD[d], x, y + 11, 17, { m: 3.5, italic: true, align: al });
    }
    const V = [[0.5, '½'], [Math.SQRT1_2, '√2/2'], [Math.sqrt(3) / 2, '√3/2'], [1, '1']];
    stroke(P, ax, 1.5, () => { for (const [v] of V) { seg(P, cx + v * R, cy - 6, cx + v * R, cy + 6); seg(P, cx - 6, cy - v * R, cx + 6, cy - v * R); seg(P, cx - v * R, cy - 6, cx - v * R, cy + 6); seg(P, cx - 6, cy + v * R, cx + 6, cy + v * R); } });
    for (const [v, s] of V) {
      T(P, s, cx + v * R, cy + 10, 14, { base: 'top' });
      T(P, s, cx - 10, cy - v * R, 14, { align: 'right' });
    }
    T(P, '−1', cx - R - 6, cy + 10, 14, { align: 'right', base: 'top' });
    T(P, '−1', cx - 10, cy + R + 6, 14, { align: 'right', base: 'top' });
  },

  // ------------------------------------------------------------------ Física e engenharias
  semilog(P) {
    const b = box(P, 'semilog');
    if (!seen(P, b)) return;
    const pr = inset(b, 60, 50, 50, 60);
    chart(P, pr, logAx(0, 4), linAx(0, 10, 1, 5, 1, null), { fs: 16 });
    T(P, 'escala logarítmica (4 décadas)', (pr.x0 + pr.x1) / 2, pr.y1 + 36, 14, { base: 'top', m: 3 });
  },
  loglog(P) {
    const b = box(P, 'loglog');
    if (!seen(P, b)) return;
    chart(P, inset(b, 70, 50, 50, 60), logAx(0, 4), logAx(0, 3), { fs: 16 });
  },
  kinematics(P) {
    const b = box(P, 'kinematics');
    if (!seen(P, b)) return;
    const g = 40 * P.k, H = bh(b) / 3, show = g * P.z >= 3;
    [['s (m)', false], ['v (m/s)', true], ['a (m/s²)', true]].forEach(([nm, mid], i) => {
      const pr = { x0: b.x0 + 60, x1: b.x1 - 50, y0: b.y0 + i * H + 46, y1: b.y0 + (i + 1) * H - 26 };
      const nx = Math.floor(bw(pr) / g), ny = Math.floor(bh(pr) / g);
      if (nx < 1 || ny < 1) return;
      pr.x1 = pr.x0 + nx * g; pr.y0 = pr.y1 - ny * g;
      const ai = mid ? Math.floor(ny / 2) : 0, ay = pr.y1 - ai * g;
      if (show) for (const maj of [false, true]) stroke(P, P.col(maj ? 1.8 : 0.9), 1, () => {
        for (let n = 0; n <= nx; n++) if ((n % 5 === 0) === maj) line(P, pr.x0 + n * g, pr.y0, pr.x0 + n * g, pr.y1);
        for (let m = 0; m <= ny; m++) if (((m - ai) % 5 === 0) === maj) line(P, pr.x0, pr.y1 - m * g, pr.x1, pr.y1 - m * g);
      });
      const ax = P.col(4.5);
      arrow(P, pr.x0, pr.y1 + (mid ? 0 : 10), pr.x0, pr.y0 - 24, ax, 2, 14);
      arrow(P, pr.x0 - 10, ay, pr.x1 + 34, ay, ax, 2, 14);
      T(P, nm, pr.x0 + 12, pr.y0 - 22, 20, { align: 'left', italic: true, m: 5 });
      T(P, 't (s)', pr.x1 + 30, ay + 12, 18, { align: 'right', base: 'top', italic: true });
      T(P, '0', pr.x0 - 8, ay + 6, 15, { align: 'right', base: 'top' });
    });
  },
  pv(P) {
    const b = box(P, 'pv');
    if (!seen(P, b)) return;
    const g = 40 * P.k, pr = inset(b, 80, 60, 70, 70);
    const nx = Math.floor(bw(pr) / g), ny = Math.floor(bh(pr) / g);
    if (nx < 2 || ny < 2) return;
    pr.x1 = pr.x0 + nx * g; pr.y0 = pr.y1 - ny * g;
    if (g * P.z >= 3) for (const maj of [false, true]) stroke(P, P.col(maj ? 1.8 : 0.9), 1, () => {
      for (let n = 1; n <= nx; n++) if ((n % 5 === 0) === maj) line(P, pr.x0 + n * g, pr.y0, pr.x0 + n * g, pr.y1);
      for (let m = 1; m <= ny; m++) if ((m % 5 === 0) === maj) line(P, pr.x0, pr.y1 - m * g, pr.x1, pr.y1 - m * g);
    });
    // isotermas PV = constante, tracejadas
    const sub = '₁₂₃₄';
    [0.05, 0.11, 0.2, 0.32].forEach((f, i) => {
      const c = f * nx * ny, v0 = Math.max(c / ny, 0.3), pts = [];
      for (let q = 0; q <= 60; q++) { const v = v0 + (nx - v0) * q / 60; pts.push([pr.x0 + v * g, pr.y1 - (c / v) * g]); }
      stroke(P, P.col(2), 1.2, () => poly(P, pts), [8, 6]);
      T(P, 'T' + sub[i], pr.x1 + 8, pr.y1 - (c / nx) * g, 16, { align: 'left', italic: true, m: 3.5 });
    });
    const ax = P.col(4.5);
    arrow(P, pr.x0, pr.y1, pr.x0, pr.y0 - 30, ax, 2, 15);
    arrow(P, pr.x0, pr.y1, pr.x1 + 40, pr.y1, ax, 2, 15);
    T(P, 'P (kPa)', pr.x0 + 12, pr.y0 - 28, 20, { align: 'left', italic: true, m: 5 });
    T(P, 'V (m³)', pr.x1 + 40, pr.y1 + 14, 20, { align: 'right', base: 'top', italic: true, m: 5 });
    T(P, '0', pr.x0 - 8, pr.y1 + 6, 15, { align: 'right', base: 'top' });
    T(P, 'isotermas (PV = constante)', pr.x1, pr.y0 - 10, 14, { align: 'right', base: 'bottom', m: 3 });
  },
  drawing(P) {
    const b = box(P, 'drawing', 0);
    if (!seen(P, b)) return;
    const mm = Math.min(bw(b), bh(b)) / 210;
    const f = inset(b, 25 * mm, 10 * mm, 10 * mm, 10 * mm);
    stroke(P, P.col(4.5), Math.max(1.5, 0.7 * mm * P.z), () => rect(P, f));
    // marcas de centro
    stroke(P, P.col(4), 1.5, () => {
      const mx = (f.x0 + f.x1) / 2, my = (f.y0 + f.y1) / 2;
      line(P, mx, b.y0 + 3 * mm, mx, f.y0); line(P, mx, f.y1, mx, b.y1 - 3 * mm);
      line(P, b.x0 + 15 * mm, my, f.x0, my); line(P, f.x1, my, b.x1 - 3 * mm, my);
    });
    // legenda (selo) no canto inferior direito
    const L = { x0: f.x1 - Math.min(120 * mm, bw(f)), y0: f.y1 - 36 * mm, x1: f.x1, y1: f.y1 }, rh = 12 * mm;
    const cols = [0, 0.4, 0.62, 0.82, 1].map(t => L.x0 + t * bw(L));
    stroke(P, P.col(4), 1.5, () => {
      rect(P, L); line(P, L.x0, L.y0 + rh, L.x1, L.y0 + rh); line(P, L.x0, L.y0 + 2 * rh, L.x1, L.y0 + 2 * rh);
      for (const x of cols.slice(1, -1)) line(P, x, L.y0 + 2 * rh, x, L.y1);
    });
    const fs = 2.6 * mm, lab = (s, x, y) => T(P, s, x + 1.5 * mm, y + 1.2 * mm, fs, { align: 'left', base: 'top', m: 3.5 });
    lab('INSTITUIÇÃO', L.x0, L.y0); lab('TÍTULO', L.x0, L.y0 + rh);
    ['ALUNO(A)', 'ESCALA', 'DATA', 'FOLHA'].forEach((s, i) => lab(s, cols[i], L.y0 + 2 * rh));
    T(P, 'UNIDADE: mm', L.x0 - 2 * mm, L.y1 - 1.5 * mm, fs, { align: 'right', base: 'bottom', m: 3 });
  },
  ternary(P) {
    const b = box(P, 'ternary');
    if (!seen(P, b)) return;
    const S = Math.min(bw(b) - 180, (bh(b) - 170) / 0.866), h = S * Math.sqrt(3) / 2;
    if (S <= 0) return;
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2 + 10;
    const A = [cx, cy - h / 2], B = [cx - S / 2, cy + h / 2], C = [cx + S / 2, cy + h / 2];
    const at = (a, bb, c) => [a * A[0] + bb * B[0] + c * C[0], a * A[1] + bb * B[1] + c * C[1]];
    const S2 = (p, q) => seg(P, p[0], p[1], q[0], q[1]);
    for (const [st, mul] of [[0.02, 0.45], [0.1, 1.5]]) {
      if (st === 0.02 && S * P.z / 50 < 4) continue;
      stroke(P, P.col(mul), 1, () => {
        for (let i = 1; i * st < 0.999; i++) {
          const f = i * st;
          if (st === 0.02 && Math.abs(f * 10 - Math.round(f * 10)) < 1e-6) continue;
          S2(at(f, 1 - f, 0), at(f, 0, 1 - f)); S2(at(1 - f, f, 0), at(0, f, 1 - f)); S2(at(1 - f, 0, f), at(0, 1 - f, f));
        }
      });
    }
    stroke(P, P.col(4.5), 2, () => poly(P, [A, B, C, A]));
    for (let i = 1; i <= 9; i++) {
      const f = i / 10, s = String(i * 10);
      let p = at(f, 1 - f, 0); T(P, s, p[0] - 10, p[1], 15, { align: 'right' });
      p = at(0, f, 1 - f); T(P, s, p[0], p[1] + 10, 15, { base: 'top' });
      p = at(1 - f, 0, f); T(P, s, p[0] + 10, p[1], 15, { align: 'left' });
    }
    T(P, 'A', A[0], A[1] - 14, 26, { base: 'bottom', bold: true, m: 5 });
    T(P, 'B', B[0] - 16, B[1] + 8, 26, { align: 'right', base: 'top', bold: true, m: 5 });
    T(P, 'C', C[0] + 16, C[1] + 8, 26, { align: 'left', base: 'top', bold: true, m: 5 });
    T(P, '% A →', (A[0] + B[0]) / 2 - 60, (A[1] + B[1]) / 2, 15, { rot: -Math.PI / 3, m: 3 });
    T(P, '% B →', (B[0] + C[0]) / 2, B[1] + 44, 15, { rot: 0, m: 3, base: 'top' });
    T(P, '← % C', (A[0] + C[0]) / 2 + 60, (A[1] + C[1]) / 2, 15, { rot: Math.PI / 3, m: 3 });
  },

  // ------------------------------------------------------------------ Estatística
  normprob(P) {
    const b = box(P, 'normprob');
    if (!seen(P, b)) return;
    const zr = qnorm(0.999), Y = custAx(v => (qnorm(v / 100) + zr) / (2 * zr),
      [0.1, 0.5, 1, 2, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 99, 99.5, 99.9],
      [0.2, 0.3, 0.4, 1.5, 3, 4, 6, 7, 8, 9, 15, 25, 35, 45, 55, 65, 75, 85, 92, 94, 96, 97, 98.5, 99.2, 99.7], v => nf(v));
    const pr = inset(b, 90, 50, 80, 50);
    const { fy } = chart(P, pr, linAx(0, 10, 1, 5, 1, null), Y, { fs: 15 });
    for (let z = -3; z <= 3; z++) T(P, (z > 0 ? '+' : z < 0 ? '−' : '') + Math.abs(z) + 'σ', pr.x1 + 10, fy(100 * (0.5 * (1 + erf(z / Math.SQRT2)))), 14, { align: 'left', m: 3 });
    T(P, 'probabilidade acumulada (%)', pr.x0 - 66, (pr.y0 + pr.y1) / 2, 16, { rot: -Math.PI / 2, m: 3.5 });
    T(P, 'valor da variável (escala linear)', (pr.x0 + pr.x1) / 2, pr.y1 + 14, 15, { base: 'top', m: 3.5 });
  },
  gumbel(P) {
    const b = box(P, 'gumbel');
    if (!seen(P, b)) return;
    const yr = T_ => -Math.log(-Math.log(1 - 1 / T_)), map = T_ => (yr(T_) + 2) / 8;
    const X = custAx(map, [1.01, 1.1, 1.25, 1.5, 2, 3, 5, 10, 25, 50, 100, 200], [1.05, 1.2, 1.35, 4, 6, 7, 8, 9, 15, 20, 30, 40, 75, 150, 300], v => nf(v));
    const pr = inset(b, 80, 80, 50, 80);
    const { fx } = chart(P, pr, X, linAx(0, 10, 1, 5, 1, null), { fs: 15 });
    stroke(P, P.col(3), 1.5, () => { for (let y = -2; y <= 6; y++) { const x = pr.x0 + (y + 2) / 8 * bw(pr); line(P, x, pr.y0, x, pr.y0 - 8); } });
    for (let y = -2; y <= 6; y++) T(P, nf(y), pr.x0 + (y + 2) / 8 * bw(pr), pr.y0 - 12, 14, { base: 'bottom', m: 3.5 });
    T(P, 'variável reduzida  y = −ln(−ln(1 − 1/T))', (pr.x0 + pr.x1) / 2, pr.y0 - 40, 15, { base: 'bottom', m: 3.5 });
    T(P, 'tempo de retorno T (anos)', (pr.x0 + pr.x1) / 2, pr.y1 + 36, 16, { base: 'top', m: 4 });
    T(P, 'máximo anual (chuva, vazão…)', pr.x0 - 40, (pr.y0 + pr.y1) / 2, 16, { rot: -Math.PI / 2, m: 3.5 });
    void fx;
  },
  weibull(P) {
    const b = box(P, 'weibull');
    if (!seen(P, b)) return;
    const W = F => Math.log(-Math.log(1 - F / 100)), map = F => (W(F) + 7) / 9;
    const Y = custAx(map, [0.1, 0.5, 1, 2, 5, 10, 20, 30, 50, 63.2, 80, 90, 95, 99, 99.9],
      [0.2, 0.3, 0.4, 3, 4, 6, 7, 8, 15, 25, 40, 70, 85, 97, 99.5], v => nf(v));
    const pr = inset(b, 90, 50, 70, 70);
    const { fy } = chart(P, pr, logAx(0, 3, v => nf(v)), Y, { fs: 15 });
    stroke(P, P.red(1.2), 1.5, () => line(P, pr.x0, fy(63.2), pr.x1, fy(63.2)), [8, 5]);
    for (let w = -7; w <= 2; w++) T(P, nf(w), pr.x1 + 10, pr.y1 - (w + 7) / 9 * bh(pr), 13, { align: 'left', m: 3 });
    T(P, 'F(t) (%)', pr.x0 - 66, (pr.y0 + pr.y1) / 2, 16, { rot: -Math.PI / 2, m: 3.5 });
    T(P, 'ln(−ln(1−F))', pr.x1 + 40, pr.y0 - 12, 13, { base: 'bottom', m: 3 });
    T(P, 't (escala log)', (pr.x0 + pr.x1) / 2, pr.y1 + 34, 15, { base: 'top', m: 3.5 });
  },

  // ------------------------------------------------------------------ Hidráulica e saneamento
  moody(P) {
    const b = box(P, 'moody');
    if (!seen(P, b)) return;
    const pr = inset(b, 90, 60, 110, 80), fl = LG(0.008), fh = LG(0.1);
    const Y = custAx(f => (LG(f) - fl) / (fh - fl), [0.008, 0.009, 0.01, 0.015, 0.02, 0.025, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1],
      [0.011, 0.012, 0.013, 0.014, 0.035, 0.045], v => nf(v));
    const { fx, fy } = chart(P, pr, logAx(3, 8), Y, { fs: 15 });
    const { ctx } = P;
    // zona crítica
    fillBox(P, { x0: fx(2300), y0: pr.y0, x1: fx(4000), y1: pr.y1 }, P.col(0.5));
    ctx.save();
    ctx.beginPath(); ctx.rect(P.sx(pr.x0), P.sy(pr.y0), bw(pr) * P.z, bh(pr) * P.z); ctx.clip();
    // laminar
    stroke(P, P.col(5), 2, () => seg(P, fx(1000), fy(0.064), fx(2300), fy(64 / 2300)));
    stroke(P, P.col(2.5), 1.5, () => seg(P, fx(2300), fy(64 / 2300), fx(4000), fy(0.016)), [6, 5]);
    // turbulento (Colebrook-White)
    const C = moodyCurves();
    for (const [eps, pts] of C) stroke(P, P.col(eps === 0 ? 5 : 3.6), eps === 0 ? 2 : 1.3, () => poly(P, pts.map(([Re, f]) => [fx(Re), fy(f)])));
    // limite da turbulência completa: Re·√f·(ε/D) = 200
    const lim = [];
    for (let i = 0; i <= 60; i++) { const e = 10 ** (LG(0.05) + i * (LG(1e-5) - LG(0.05)) / 60), x = -2 * LG(e / 3.7), f = 1 / (x * x); lim.push([fx(200 / (e * Math.sqrt(f))), fy(f)]); }
    stroke(P, P.red(1.4), 1.5, () => poly(P, lim), [9, 6]);
    ctx.restore();
    // rótulos de ε/D à direita, sem sobreposição
    const fs = 13, ls = C.filter(c => c[0] > 0).map(([e, pts]) => [e, fy(pts[pts.length - 1][1])]).sort((a, c) => a[1] - c[1]);
    let last = -1e9;
    for (const l of ls) { l[2] = Math.max(l[1], last + fs * 1.05); last = l[2]; }
    for (const [e, y, ly] of ls) if (ly < pr.y1) T(P, nf(e), pr.x1 + 8, ly, fs, { align: 'left', m: 4 });
    T(P, 'ε/D', pr.x1 + 8, pr.y0 - 14, 16, { align: 'left', base: 'bottom', italic: true, m: 5 });
    T(P, 'número de Reynolds  Re = VD/ν', (pr.x0 + pr.x1) / 2, pr.y1 + 34, 17, { base: 'top', m: 4.5 });
    T(P, 'fator de atrito  f', pr.x0 - 70, (pr.y0 + pr.y1) / 2, 17, { rot: -Math.PI / 2, m: 4.5 });
    T(P, 'laminar  f = 64/Re', fx(1150), fy(0.06) - 28, 15, { align: 'left', base: 'bottom', m: 4.5 });
    T(P, 'zona crítica', fx(3030), pr.y0 + 12, 13, { base: 'top', m: 3.5 });
    T(P, 'turbulência completa (tubo rugoso)', fx(3e6), pr.y0 + 14, 15, { base: 'top', m: 4 });
    T(P, 'tubo liso', fx(1.5e6), fy(colebrook(0, 1.5e6)) + 8, 14, { align: 'right', base: 'top', m: 4 });
    T(P, 'Colebrook-White:  1/√f = −2 log(ε/3,7D + 2,51/(Re√f))', pr.x0, pr.y0 - 14, 15, { align: 'left', base: 'bottom', m: 3.5 });
  },
  granulo(P) {
    const b = box(P, 'granulo');
    if (!seen(P, b)) return;
    const pr = inset(b, 90, 120, 90, 80);
    const { fx } = chart(P, pr, logAx(-3, 2, v => nf(v)), linAx(0, 100, 10, 2), { fs: 15 });
    for (let p = 0; p <= 100; p += 10) T(P, String(100 - p), pr.x1 + 8, pr.y1 - p / 100 * bh(pr), 15, { align: 'left' });
    // peneiras usuais (ABNT): abertura em mm
    const PEN = [[50, '2"'], [38, '1½"'], [25, '1"'], [19, '¾"'], [9.5, '⅜"'], [4.8, 'nº 4'], [2, 'nº 10'], [1.2, 'nº 16'],
      [0.6, 'nº 30'], [0.42, 'nº 40'], [0.25, 'nº 60'], [0.15, 'nº 100'], [0.075, 'nº 200']];
    stroke(P, P.col(2.4), 1, () => { for (const [d] of PEN) line(P, fx(d), pr.y0, fx(d), pr.y1); }, [6, 5]);
    for (const [d, n] of PEN) T(P, n + '  (' + nf(d) + ')', fx(d) - 4, pr.y0 + 8, 12, { rot: -Math.PI / 2, align: 'right', base: 'bottom', m: 3.5 });
    // faixas de solo (NBR 6502)
    const F = [[0.001, 0.002, 'argila'], [0.002, 0.06, 'silte'], [0.06, 0.2, 'areia fina'], [0.2, 0.6, 'areia média'], [0.6, 2, 'areia grossa'], [2, 60, 'pedregulho'], [60, 100, '']];
    const by0 = pr.y0 - 52, by1 = pr.y0 - 8;
    stroke(P, P.col(3), 1.2, () => { rect(P, { x0: pr.x0, y0: by0, x1: pr.x1, y1: by1 }); for (const [a] of F.slice(1)) line(P, fx(a), by0, fx(a), by1); });
    for (const [a, c, n] of F) if (n) T(P, n, (fx(a) + fx(c)) / 2, (by0 + by1) / 2, 14, { m: 4, maxW: fx(c) - fx(a) - 6 });
    T(P, 'diâmetro dos grãos (mm)', (pr.x0 + pr.x1) / 2, pr.y1 + 36, 16, { base: 'top', m: 4.5 });
    T(P, 'porcentagem que passa (%)', pr.x0 - 62, (pr.y0 + pr.y1) / 2, 16, { rot: -Math.PI / 2, m: 4.5 });
    T(P, 'porcentagem retida (%)', pr.x1 + 64, (pr.y0 + pr.y1) / 2, 16, { rot: Math.PI / 2, m: 4.5 });
  },

  // ------------------------------------------------------------------ Elétrica e eletrônica
  scope(P) {
    const b = box(P, 'scope');
    if (!seen(P, b)) return;
    const d = Math.min((bw(b) - 40) / 10, (bh(b) - 90) / 8), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2 - 25;
    const s = { x0: cx - 5 * d, y0: cy - 4 * d, x1: cx + 5 * d, y1: cy + 4 * d };
    stroke(P, P.col(1.5), 1, () => {
      for (let i = 1; i < 10; i++) if (i !== 5) line(P, s.x0 + i * d, s.y0, s.x0 + i * d, s.y1);
      for (let j = 1; j < 8; j++) if (j !== 4) line(P, s.x0, s.y0 + j * d, s.x1, s.y0 + j * d);
    }, [2, 4]);
    stroke(P, P.col(3), 1.2, () => {
      line(P, cx, s.y0, cx, s.y1); line(P, s.x0, cy, s.x1, cy);
      if (d / 5 * P.z >= 3) for (let i = 1; i < 50; i++) if (i % 5) {
        const x = s.x0 + i * d / 5; line(P, x, cy - d / 12, x, cy + d / 12);
        if (i < 40) { const y = s.y0 + i * d / 5; line(P, cx - d / 12, y, cx + d / 12, y); }
      }
    });
    stroke(P, P.col(4.5), 2.5, () => rect(P, s));
    T(P, 'V/div: __________     tempo/div: __________     acoplamento:  CA  /  CC', cx, s.y1 + 26, 17, { base: 'top', m: 4 });
  },
  smith(P) {
    const b = fitIn(box(P, 'smith'), 1);
    if (!seen(P, b)) return;
    const R = bw(b) / 2 - 70, cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    if (R <= 0) return;
    const { ctx } = P, X = gx => P.sx(cx + gx * R), Yy = gy => P.sy(cy - gy * R);
    const MAJ = [0.2, 0.5, 1, 2, 5], MIN = [0.1, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 1.2, 1.5, 3, 4, 10];
    ctx.save();
    ctx.beginPath(); ctx.arc(X(0), Yy(0), R * P.z, 0, Math.PI * 2); ctx.clip();
    for (const [list, mul] of [[MIN, 0.9], [MAJ, 2.2]]) {
      stroke(P, P.col(mul), 1, () => {
        for (const r of list) { const c = r / (1 + r), rr = 1 / (1 + r); ctx.moveTo(X(c + rr), Yy(0)); ctx.arc(X(c), Yy(0), rr * R * P.z, 0, Math.PI * 2); }
        for (const x of list) for (const sg of [1, -1]) { const rr = 1 / x; ctx.moveTo(X(1 + rr), Yy(sg * rr)); ctx.arc(X(1), Yy(sg * rr), rr * R * P.z, 0, Math.PI * 2); }
      });
    }
    ctx.restore();
    stroke(P, P.col(3.5), 1.5, () => line(P, cx - R, cy, cx + R, cy));
    stroke(P, P.col(4.5), 2.5, () => { ctx.moveTo(X(1), Yy(0)); ctx.arc(X(0), Yy(0), R * P.z, 0, Math.PI * 2); });
    for (const r of [0, ...MAJ]) T(P, nf(r), cx + (r - 1) / (r + 1) * R + 3, cy - 5, 13, { align: 'left', base: 'bottom', m: 4 });
    T(P, '∞', cx + R + 8, cy, 18, { align: 'left', m: 4 });
    for (const x of MAJ) for (const sg of [1, -1]) {
      const gx = (x * x - 1) / (1 + x * x), gy = sg * 2 * x / (1 + x * x), k = 1 + 34 / R;
      T(P, (sg > 0 ? '+j' : '−j') + nf(x), cx + gx * R * k, cy - gy * R * k, 14, { m: 4 });
    }
    T(P, 'resistência (r) e reatância (x) normalizadas por Z₀', cx, cy + R + 56, 14, { base: 'bottom', m: 3 });
  },
  bode(P) {
    const b = box(P, 'bode');
    if (!seen(P, b)) return;
    const H = bh(b), X = logAx(-1, 3, v => nf(v));
    const p1 = { x0: b.x0 + 100, x1: b.x1 - 40, y0: b.y0 + 40, y1: b.y0 + H * 0.5 - 40 };
    const p2 = { x0: p1.x0, x1: p1.x1, y0: b.y0 + H * 0.5 + 20, y1: b.y1 - 70 };
    const c1 = chart(P, p1, X, linAx(-60, 40, 10, 2, 2), { fs: 15 });
    const c2 = chart(P, p2, X, linAx(-270, 90, 45, 3), { fs: 15 });
    stroke(P, P.col(4.5), 1.5, () => { line(P, p1.x0, c1.fy(0), p1.x1, c1.fy(0)); line(P, p2.x0, c2.fy(-180), p2.x1, c2.fy(-180)); });
    T(P, '|H(jω)| (dB)', p1.x0 - 74, (p1.y0 + p1.y1) / 2, 17, { rot: -Math.PI / 2, m: 4.5 });
    T(P, '∠H(jω) (graus)', p2.x0 - 74, (p2.y0 + p2.y1) / 2, 17, { rot: -Math.PI / 2, m: 4.5 });
    T(P, 'ω (rad/s)', (p2.x0 + p2.x1) / 2, p2.y1 + 34, 17, { base: 'top', m: 4.5 });
  },
  timing(P) {
    const row = 80 * P.k, clk = 40 * P.k;
    if (row * P.z < 8) return;
    const oy = P.o.y;
    family(P, 90, clk, P.col(0.9), { dash: [3, 4] });
    family(P, 90, clk * 4, P.col(1.6), { min: 12 });
    family(P, 0, row, P.col(0.9), { phase: { x: 0, y: oy + row * 0.25 }, dash: [6, 5], min: 8 });
    family(P, 0, row, P.col(0.9), { phase: { x: 0, y: oy + row * 0.75 }, dash: [6, 5], min: 8 });
    family(P, 0, row, P.col(2.4), { phase: { x: 0, y: oy }, min: 8 });
    const nx = (P.page ? P.page.x : P.o.x) + 140;
    stroke(P, P.col(3.5), 2, () => line(P, nx, worldRect(P).y0, nx, worldRect(P).y1));
    if (P.z * 15 >= 6) {
      const { j0, j1 } = rows(P, row, oy);
      if (j1 - j0 < 300) for (let j = j0; j <= j1; j++) {
        T(P, 'H', nx - 10, oy + j * row + row * 0.25, 12, { align: 'right', m: 2.5 });
        T(P, 'L', nx - 10, oy + j * row + row * 0.75, 12, { align: 'right', m: 2.5 });
      }
    }
  },
  phasor(P) {
    const b = fitIn(box(P, 'phasor'), 1);
    if (!seen(P, b)) return;
    const R = bw(b) / 2 - 110, cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    if (R <= 0) return;
    const { ctx } = P;
    stroke(P, P.col(1.4), 1, () => { for (let i = 1; i <= 5; i++) { ctx.moveTo(P.sx(cx + R * i / 5), P.sy(cy)); ctx.arc(P.sx(cx), P.sy(cy), R * i / 5 * P.z, 0, Math.PI * 2); } });
    stroke(P, P.col(0.9), 1, () => { for (let d = 0; d < 360; d += 30) if (d % 120) { const a = d * Math.PI / 180; seg(P, cx, cy, cx + R * Math.cos(a), cy - R * Math.sin(a)); } }, [4, 5]);
    for (const [d, n] of [[0, 'A  0°'], [-120, 'B  −120°'], [120, 'C  +120°']]) {
      const a = d * Math.PI / 180, ex = cx + 1.12 * R * Math.cos(a), ey = cy - 1.12 * R * Math.sin(a);
      arrow(P, cx, cy, ex, ey, P.col(4.5), 2, 18);
      stroke(P, P.col(1.8), 1.2, () => seg(P, cx, cy, cx - R * Math.cos(a), cy + R * Math.sin(a)), [8, 6]);
      T(P, n, cx + 1.2 * R * Math.cos(a) + (d === 0 ? 12 : 0), cy - 1.2 * R * Math.sin(a), 20, { align: d === 0 ? 'left' : 'center', bold: true, m: 5 });
    }
    T(P, 'sequência ABC · 120° entre fases', cx, b.y1 - 4, 14, { base: 'bottom', m: 3 });
  },

  // ------------------------------------------------------------------ Computação
  code(P) {
    const b = box(P, 'code');
    if (!seen(P, b)) return;
    const lh = 32 * P.k, gx = b.x0 + 70, n = Math.floor((bh(b) - 20) / lh);
    if (lh * P.z >= 3) stroke(P, P.col(0.9), 1, () => { for (let i = 1; i <= n; i++) line(P, b.x0, b.y0 + 10 + i * lh, b.x1, b.y0 + 10 + i * lh); });
    if (lh * P.z >= 6) stroke(P, P.col(0.7), 1, () => { for (let x = gx + 16 + 64; x < b.x1 - 20; x += 64) line(P, x, b.y0, x, b.y1); }, [2, 6]);
    stroke(P, P.red(), 1, () => line(P, gx, b.y0, gx, b.y1));
    stroke(P, P.col(2.5), 1.5, () => rect(P, b));
    for (let i = 1; i <= n; i++) T(P, String(i), gx - 12, b.y0 + 10 + i * lh - 5, Math.min(16, lh * 0.5), { align: 'right', base: 'bottom', m: 3.5 });
  },
  deskcheck(P) {
    const b = box(P, 'deskcheck');
    if (!seen(P, b)) return;
    const head = 70, hr = 56, lh = 42 * P.k;
    const t = b.y0 + head, n = Math.floor((bh(b) - head - hr) / lh), y1 = t + hr + n * lh;
    const cw = [0.07, ...Array(6).fill(0.13), 0.15], xs = [b.x0];
    for (const c of cw) xs.push(xs[xs.length - 1] + c * bw(b));
    fillBox(P, { x0: b.x0, y0: t, x1: b.x1, y1: t + hr }, P.col(0.45));
    if (lh * P.z >= 3) stroke(P, P.col(1.2), 1, () => { for (let i = 1; i < n; i++) line(P, b.x0, t + hr + i * lh, b.x1, t + hr + i * lh); });
    stroke(P, P.col(3), 1.5, () => {
      line(P, b.x0, t, b.x1, t); line(P, b.x0, t + hr, b.x1, t + hr); line(P, b.x0, y1, b.x1, y1);
      for (const x of xs) line(P, x, t, x, y1);
    });
    T(P, 'Teste de mesa — algoritmo: ______________________________', b.x0, b.y0 + head / 2, 22, { align: 'left', m: 4.5 });
    T(P, 'passo', (xs[0] + xs[1]) / 2, t + hr / 2, 16, { m: 4, maxW: xs[1] - xs[0] - 8 });
    T(P, 'saída (tela)', (xs[7] + xs[8]) / 2, t + hr / 2, 16, { m: 4, maxW: xs[8] - xs[7] - 8 });
    for (let i = 1; i <= 6; i++) T(P, 'variável', xs[i] + 6, t + 6, 11, { align: 'left', base: 'top', m: 2.2 });
    for (let i = 1; i <= n; i++) T(P, String(i), (xs[0] + xs[1]) / 2, t + hr + (i - 0.5) * lh, Math.min(16, lh * 0.45), { m: 3.5 });
  },
  terminal(P) {
    const b = box(P, 'terminal');
    if (!seen(P, b)) return;
    const bar = 52, lh = 34 * P.k, n = Math.floor((bh(b) - bar - 16) / lh), { ctx } = P;
    fillBox(P, { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y0 + bar }, P.col(0.6));
    stroke(P, P.col(3), 1.5, () => { for (let i = 0; i < 3; i++) { const x = P.sx(b.x0 + 30 + i * 30), y = P.sy(b.y0 + bar / 2), r = 8 * P.z; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); } });
    T(P, 'Terminal', (b.x0 + b.x1) / 2, b.y0 + bar / 2, 18, { m: 4 });
    if (lh * P.z >= 3) stroke(P, P.col(0.6), 1, () => { for (let i = 1; i <= n; i++) line(P, b.x0 + 16, b.y0 + bar + 8 + i * lh, b.x1 - 16, b.y0 + bar + 8 + i * lh); });
    for (let i = 1; i <= n; i++) T(P, '$', b.x0 + 22, b.y0 + bar + 8 + i * lh - 6, Math.min(18, lh * 0.55), { align: 'left', base: 'bottom', m: 2.2, bold: true });
    stroke(P, P.col(3.5), 2, () => { rect(P, b); line(P, b.x0, b.y0 + bar, b.x1, b.y0 + bar); });
  },

  // ------------------------------------------------------------------ Biologia e saúde
  punnett2(P) { punnett(P, 2, 'punnett2'); },
  punnett4(P) { punnett(P, 4, 'punnett4'); },
  microscope(P) {
    const b = box(P, 'microscope');
    if (!seen(P, b)) return;
    const R = Math.min(bw(b), bh(b) - 90) / 2 - 20, cx = (b.x0 + b.x1) / 2, cy = b.y0 + 20 + R, { ctx } = P;
    if (R <= 0) return;
    stroke(P, P.col(1.2), 1, () => { line(P, cx - R, cy, cx + R, cy); line(P, cx, cy - R, cx, cy + R); });
    stroke(P, P.col(1), 1, () => { ctx.moveTo(P.sx(cx + R / 2), P.sy(cy)); ctx.arc(P.sx(cx), P.sy(cy), R / 2 * P.z, 0, Math.PI * 2); }, [5, 6]);
    // escala ocular (micrômetro): 100 divisões
    const L = 1.6 * R, x0 = cx - L / 2, y = cy + R * 0.18;
    stroke(P, P.col(3.5), 1.2, () => {
      line(P, x0, y, x0 + L, y);
      const fine = L / 100 * P.z >= 2.5;
      for (let i = 0; i <= 100; i++) { if (!fine && i % 5) continue; const h = i % 10 === 0 ? 18 : i % 5 === 0 ? 12 : 7; line(P, x0 + i * L / 100, y, x0 + i * L / 100, y - h); }
    });
    for (let i = 0; i <= 100; i += 10) T(P, String(i), x0 + i * L / 100, y - 22, 13, { base: 'bottom', m: 4 });
    stroke(P, P.col(4.5), 3, () => { ctx.moveTo(P.sx(cx + R), P.sy(cy)); ctx.arc(P.sx(cx), P.sy(cy), R * P.z, 0, Math.PI * 2); });
    T(P, 'aumento: ________ ×      1 divisão = ________ µm      amostra: ____________________', cx, cy + R + 30, 17, { base: 'top', m: 4 });
  },

  // ------------------------------------------------------------------ Linguagens
  essay(P) {
    const b = box(P, 'essay');
    if (!seen(P, b)) return;
    const head = 110, nc = 56, lh = (bh(b) - head) / 30, t = b.y0 + head;
    stroke(P, P.col(1.4), 1, () => { for (let i = 1; i < 30; i++) line(P, b.x0, t + i * lh, b.x1, t + i * lh); });
    stroke(P, P.col(3), 1.5, () => { rect(P, b); line(P, b.x0, t, b.x1, t); line(P, b.x0 + nc, t, b.x0 + nc, b.y1); });
    T(P, 'Título:', b.x0 + 16, b.y0 + head * 0.62, 20, { align: 'left', base: 'bottom', m: 4.5 });
    stroke(P, P.col(1.4), 1, () => line(P, b.x0 + 100, b.y0 + head * 0.62, b.x1 - 20, b.y0 + head * 0.62));
    for (let i = 1; i <= 30; i++) T(P, String(i), b.x0 + nc / 2, t + (i - 0.5) * lh, Math.min(17, lh * 0.4), { m: 3.5 });
  },
  literacy(P) {
    const u = 18 * P.k, per = 5 * u;
    if (u * P.z < 3) return;
    const { j0, j1 } = rows(P, per, P.o.y);
    if (j1 - j0 > 800) return;
    P.ctx.fillStyle = P.col(0.5);
    for (let j = j0; j <= j1; j++) P.ctx.fillRect(0, P.sy(P.o.y + j * per + u), P.w, u * P.z);
    const ph = d => ({ x: P.o.x, y: P.o.y + d });
    family(P, 0, per, P.col(1), { phase: ph(0), min: 8 });
    family(P, 0, per, P.col(1.4), { phase: ph(u), min: 8 });
    family(P, 0, per, P.col(2.8), { phase: ph(2 * u), min: 8, width: 1.5 });
    family(P, 0, per, P.col(1), { phase: ph(3 * u), dash: [6, 5], min: 8 });
  },
  comics(P) {
    const b = box(P, 'comics');
    if (!seen(P, b)) return;
    const G = 28, cw = (bw(b) - G) / 2, ch = (bh(b) - 2 * G) / 3;
    stroke(P, P.col(4.5), 3, () => {
      for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
        const x = b.x0 + c * (cw + G), y = b.y0 + r * (ch + G);
        rect(P, { x0: x, y0: y, x1: x + cw, y1: y + ch });
      }
    });
  },
  storyboard(P) {
    const b = box(P, 'storyboard');
    if (!seen(P, b)) return;
    const G = 36, cw = (bw(b) - 2 * G) / 3, ch = (bh(b) - G) / 2;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const x = b.x0 + c * (cw + G), y = b.y0 + r * (ch + G), fh = Math.min(cw * 9 / 16, ch - 140);
      const f = { x0: x, y0: y + 34, x1: x + cw, y1: y + 34 + fh };
      T(P, 'Cena ____', x, y + 26, 16, { align: 'left', base: 'bottom', m: 4 });
      stroke(P, P.col(4), 2, () => rect(P, f));
      stroke(P, P.col(1.4), 1, () => { for (let i = 1; i <= 3; i++) line(P, x, f.y1 + i * 30, x + cw, f.y1 + i * 30); });
    }
  },

  // ------------------------------------------------------------------ Música
  tab(P) {
    const u = 12 * P.k, per = 10 * u;
    if (u * P.z < 3) return;
    for (let i = 0; i < 6; i++) family(P, 0, per, P.col(2), { phase: { x: P.o.x, y: P.o.y + i * u }, min: 8 });
    if (u * P.z < 7) return;
    const { j0, j1 } = rows(P, per, P.o.y), X = staffX(P), { ctx } = P;
    ctx.font = `600 ${(u * 1.25 * P.z).toFixed(1)}px "Segoe UI", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = P.col(4.5);
    for (let j = j0; j <= j1; j++) {
      const y0 = P.o.y + j * per;
      ['T', 'A', 'B'].forEach((c, i) => ctx.fillText(c, X + u * 0.8 * P.z, P.sy(y0 + u * (1 + 1.5 * i))));
    }
  },
  piano(P) {
    const u = 10 * P.k, per = 20 * u;
    if (u * P.z < 3) return;
    for (let i = 0; i < 5; i++) {
      family(P, 0, per, P.col(2), { phase: { x: P.o.x, y: P.o.y + i * u }, min: 8 });
      family(P, 0, per, P.col(2), { phase: { x: P.o.x, y: P.o.y + (i + 8) * u }, min: 8 });
    }
    if (u * P.z < 5) return;
    const { j0, j1 } = rows(P, per, P.o.y), X = staffX(P) + 1.6 * u * P.z, { ctx } = P;
    ctx.beginPath();
    for (let j = j0; j <= j1; j++) {
      const t = P.sy(P.o.y + j * per), bt = P.sy(P.o.y + j * per + 12 * u), m = (t + bt) / 2, h = bt - t, w = u * 1.1 * P.z;
      ctx.moveTo(X, t); ctx.lineTo(X, bt);
      // chave: duas curvas que se encontram na ponta, no meio
      const bx = X - 4 * P.z;
      ctx.moveTo(bx, t);
      ctx.bezierCurveTo(bx - w * 1.3, t + h * 0.06, bx + w * 0.2, m - h * 0.12, bx - w, m);
      ctx.bezierCurveTo(bx + w * 0.2, m + h * 0.12, bx - w * 1.3, bt - h * 0.06, bx, bt);
    }
    ctx.strokeStyle = P.col(4); ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
  },
  percussion(P) {
    const u = 10 * P.k, per = 8 * u;
    if (u * P.z < 3) return;
    family(P, 0, per, P.col(2.4), { min: 8 });
    if (u * P.z < 3.5) return;
    const { j0, j1 } = rows(P, per, P.o.y), X = staffX(P), { ctx } = P;
    ctx.fillStyle = P.col(4);
    for (let j = j0; j <= j1; j++) {
      const y = P.sy(P.o.y + j * per);
      ctx.fillRect(X + 4, y - u * P.z, Math.max(1.5, u * 0.25 * P.z), 2 * u * P.z);
      ctx.fillRect(X + 4 + u * 0.6 * P.z, y - u * P.z, Math.max(1.5, u * 0.25 * P.z), 2 * u * P.z);
    }
  },

  // ------------------------------------------------------------------ Humanas
  timeline(P) {
    const cell = 40 * P.k, ay = P.o.y, ox = P.o.x;
    if (cell * P.z < 2) return;
    const r = worldRect(P);
    if (ay < r.y0 - 300 || ay > r.y1 + 300) return;
    const n0 = Math.ceil((r.x0 - ox) / cell), n1 = Math.floor((r.x1 - ox) / cell);
    const big = cell * P.z >= 5 ? 1 : 5;
    stroke(P, P.col(1), 1, () => { for (let n = Math.ceil(n0 / 5) * 5; n <= n1; n += 5) line(P, ox + n * cell, ay - 240, ox + n * cell, ay + 240); }, [4, 6]);
    stroke(P, P.col(0.9), 1, () => { line(P, r.x0, ay - 120, r.x1, ay - 120); line(P, r.x0, ay + 120, r.x1, ay + 120); }, [10, 8]);
    stroke(P, P.col(4.5), 1.5, () => {
      for (let n = n0; n <= n1; n++) {
        if (n % 5 && big === 5) continue;
        const L = n % 10 === 0 ? 26 : n % 5 === 0 ? 18 : 9;
        line(P, ox + n * cell, ay - L, ox + n * cell, ay + L);
      }
    });
    stroke(P, P.col(5), 3, () => line(P, r.x0, ay, r.x1, ay));
  },
  latlon(P) {
    const b = box(P, 'latlon');
    if (!seen(P, b)) return;
    const d = Math.min((bw(b) - 150) / 360, (bh(b) - 80) / 180), cx = (b.x0 + b.x1) / 2 - 20, cy = (b.y0 + b.y1) / 2;
    if (d <= 0) return;
    const X = lo => cx + lo * d, Y = la => cy - la * d, fr = { x0: X(-180), y0: Y(90), x1: X(180), y1: Y(-90) };
    if (15 * d * P.z >= 4) stroke(P, P.col(1), 1, () => {
      for (let lo = -165; lo < 180; lo += 30) line(P, X(lo), fr.y0, X(lo), fr.y1);
      for (let la = -75; la < 90; la += 30) line(P, fr.x0, Y(la), fr.x1, Y(la));
    });
    stroke(P, P.col(2), 1, () => {
      for (let lo = -150; lo < 180; lo += 30) if (lo) line(P, X(lo), fr.y0, X(lo), fr.y1);
      for (let la = -60; la < 90; la += 30) if (la) line(P, fr.x0, Y(la), fr.x1, Y(la));
    });
    stroke(P, P.col(2.6), 1.2, () => { for (const la of [23.44, -23.44, 66.56, -66.56]) line(P, fr.x0, Y(la), fr.x1, Y(la)); }, [8, 6]);
    stroke(P, P.red(1.3), 2, () => { line(P, fr.x0, Y(0), fr.x1, Y(0)); line(P, X(0), fr.y0, X(0), fr.y1); });
    stroke(P, P.col(4), 2, () => rect(P, fr));
    for (let lo = -180; lo <= 180; lo += 30) T(P, lo === 0 ? '0°' : Math.abs(lo) + '°' + (lo < 0 ? 'O' : 'L'), X(lo), fr.y1 + 8, 14, { base: 'top', m: 4 });
    for (let la = -90; la <= 90; la += 30) T(P, la === 0 ? '0°' : Math.abs(la) + '°' + (la < 0 ? 'S' : 'N'), fr.x0 - 8, Y(la), 14, { align: 'right', m: 4 });
    for (const [la, n] of [[0, 'Equador'], [23.44, 'Trópico de Câncer'], [-23.44, 'Trópico de Capricórnio'], [66.56, 'Círculo Polar Ártico'], [-66.56, 'Círculo Polar Antártico']])
      T(P, n, fr.x1 + 8, Y(la), 13, { align: 'left', m: 3.5 });
    T(P, 'Greenwich', X(0) + 6, fr.y0 + 6, 13, { align: 'left', base: 'top', m: 3.5 });
  },

  // ------------------------------------------------------------------ Gestão e organização
  canvas(P) {
    const b = box(P, 'canvas');
    if (!seen(P, b)) return;
    const t = b.y0 + 56, W = bw(b) / 5, top = (b.y1 - t) * 0.7, ym = t + top / 2, yb = t + top, xm = (b.x0 + b.x1) / 2;
    stroke(P, P.col(4), 2, () => {
      rect(P, { x0: b.x0, y0: t, x1: b.x1, y1: b.y1 });
      for (let i = 1; i < 5; i++) line(P, b.x0 + i * W, t, b.x0 + i * W, yb);
      line(P, b.x0 + W, ym, b.x0 + 2 * W, ym); line(P, b.x0 + 3 * W, ym, b.x0 + 4 * W, ym);
      line(P, b.x0, yb, b.x1, yb); line(P, xm, yb, xm, b.y1);
    });
    T(P, 'Modelo de negócio: ______________________________', b.x0, b.y0 + 26, 22, { align: 'left', m: 4.5 });
    const L = (s, x, y) => T(P, s, x + 12, y + 10, 15, { align: 'left', base: 'top', m: 4, bold: true, maxW: (s.includes('custos') || s.includes('receita') ? bw(b) / 2 : W) - 22 });
    L('Parcerias principais', b.x0, t); L('Atividades principais', b.x0 + W, t); L('Recursos principais', b.x0 + W, ym);
    L('Proposta de valor', b.x0 + 2 * W, t); L('Relacionamento', b.x0 + 3 * W, t); L('Canais', b.x0 + 3 * W, ym);
    L('Segmentos de clientes', b.x0 + 4 * W, t); L('Estrutura de custos', b.x0, yb); L('Fontes de receita', xm, yb);
  },
  kanban(P) {
    const b = box(P, 'kanban');
    if (!seen(P, b)) return;
    const hd = 72, W = bw(b) / 3;
    fillBox(P, { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y0 + hd }, P.col(0.5));
    stroke(P, P.col(4), 2, () => { rect(P, b); line(P, b.x0, b.y0 + hd, b.x1, b.y0 + hd); for (let i = 1; i < 3; i++) line(P, b.x0 + i * W, b.y0, b.x0 + i * W, b.y1); });
    ['A fazer', 'Fazendo', 'Feito'].forEach((s, i) => T(P, s, b.x0 + (i + 0.5) * W, b.y0 + hd / 2, 28, { bold: true, m: 5, maxW: W - 20 }));
  },
  matrix2(P) {
    const b = fitIn(box(P, 'matrix2'), 1);
    if (!seen(P, b)) return;
    const q = inset(b, 110, 50, 50, 110), cx = (q.x0 + q.x1) / 2, cy = (q.y0 + q.y1) / 2;
    stroke(P, P.col(3.5), 2, () => { rect(P, q); line(P, cx, q.y0, cx, q.y1); line(P, q.x0, cy, q.x1, cy); });
    const ax = P.col(4.5);
    arrow(P, q.x0 - 40, q.y1 + 40, q.x1 + 10, q.y1 + 40, ax, 2, 16);
    arrow(P, q.x0 - 40, q.y1 + 40, q.x0 - 40, q.y0 - 10, ax, 2, 16);
    T(P, '−', q.x0, q.y1 + 56, 22, { base: 'top', m: 4 }); T(P, '+', q.x1, q.y1 + 56, 22, { base: 'top', m: 4 });
    T(P, '−', q.x0 - 60, q.y1, 22, { align: 'right', m: 4 }); T(P, '+', q.x0 - 60, q.y0, 22, { align: 'right', m: 4 });
    T(P, 'eixo: ____________', cx, q.y1 + 60, 18, { base: 'top', m: 3.5 });
    T(P, 'eixo: ____________', q.x0 - 70, cy, 18, { rot: -Math.PI / 2, m: 3.5 });
    [['II', q.x0, q.y0], ['I', cx, q.y0], ['III', q.x0, cy], ['IV', cx, cy]].forEach(([s, x, y]) => T(P, s, x + 14, y + 10, 20, { align: 'left', base: 'top', m: 2.5, bold: true }));
  },
  calendar(P) {
    const b = box(P, 'calendar');
    if (!seen(P, b)) return;
    const hd = 80, wd = 46, t = b.y0 + hd, cw = bw(b) / 7, rh = (b.y1 - t - wd) / 6;
    fillBox(P, { x0: b.x0, y0: t, x1: b.x1, y1: t + wd }, P.col(0.5));
    stroke(P, P.col(3.5), 1.5, () => {
      rect(P, { x0: b.x0, y0: t, x1: b.x1, y1: b.y1 });
      for (let i = 1; i < 7; i++) line(P, b.x0 + i * cw, t, b.x0 + i * cw, b.y1);
      for (let j = 0; j < 6; j++) line(P, b.x0, t + wd + j * rh, b.x1, t + wd + j * rh);
    });
    stroke(P, P.col(1), 1, () => { for (let i = 0; i < 7; i++) for (let j = 0; j < 6; j++) { const x = b.x0 + (i + 1) * cw, y = t + wd + j * rh; line(P, x - 44, y, x - 44, y + 36); line(P, x - 44, y + 36, x, y + 36); } });
    T(P, 'Mês: ____________________', b.x0, b.y0 + hd / 2, 26, { align: 'left', m: 4.5 });
    T(P, 'Ano: ________', b.x1, b.y0 + hd / 2, 26, { align: 'right', m: 4.5 });
    ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].forEach((s, i) =>
      T(P, s, b.x0 + (i + 0.5) * cw, t + wd / 2, 18, { bold: true, m: 4.5, color: i === 0 ? P.red(2) : null, maxW: cw - 10 }));
  },
  weekly(P) {
    const b = box(P, 'weekly');
    if (!seen(P, b)) return;
    const hd = 70, wd = 50, t = b.y0 + hd, cw = bw(b) / 7, lh = 36 * P.k;
    fillBox(P, { x0: b.x0, y0: t, x1: b.x1, y1: t + wd }, P.col(0.5));
    if (lh * P.z >= 3) stroke(P, P.col(0.9), 1, () => { for (let y = t + wd + lh; y < b.y1 - 4; y += lh) line(P, b.x0, y, b.x1, y); });
    stroke(P, P.col(3.5), 1.5, () => { rect(P, { x0: b.x0, y0: t, x1: b.x1, y1: b.y1 }); line(P, b.x0, t + wd, b.x1, t + wd); for (let i = 1; i < 7; i++) line(P, b.x0 + i * cw, t, b.x0 + i * cw, b.y1); });
    T(P, 'Semana de ____/____ a ____/____', b.x0, b.y0 + hd / 2, 24, { align: 'left', m: 4.5 });
    ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].forEach((s, i) => T(P, s, b.x0 + (i + 0.5) * cw, t + wd / 2, 18, { bold: true, m: 4.5, maxW: cw - 10 }));
  },
  table(P) {
    const b = box(P, 'table');
    if (!seen(P, b)) return;
    const hd = 56, lh = 44 * P.k, nc = 5, cw = bw(b) / nc, n = Math.floor((bh(b) - hd) / lh), y1 = b.y0 + hd + n * lh;
    fillBox(P, { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y0 + hd }, P.col(0.6));
    if (lh * P.z >= 3) stroke(P, P.col(1.3), 1, () => { for (let i = 1; i < n; i++) line(P, b.x0, b.y0 + hd + i * lh, b.x1, b.y0 + hd + i * lh); });
    stroke(P, P.col(3.5), 1.5, () => { rect(P, { x0: b.x0, y0: b.y0, x1: b.x1, y1: y1 }); line(P, b.x0, b.y0 + hd, b.x1, b.y0 + hd); for (let i = 1; i < nc; i++) line(P, b.x0 + i * cw, b.y0, b.x0 + i * cw, y1); });
  },
  cols2(P) { columns(P, 2, 'cols2'); },
  cols3(P) { columns(P, 3, 'cols3'); },

  // ------------------------------------------------------------------ Agrárias
  plot(P) {
    const b = box(P, 'plot');
    if (!seen(P, b)) return;
    const g = 40 * P.k, { ctx } = P;
    const nx = Math.floor(bw(b) / g), ny = Math.floor(bh(b) / g), f = { x0: b.x0, y0: b.y0, x1: b.x0 + nx * g, y1: b.y0 + ny * g };
    if (g * P.z >= 3) for (const maj of [false, true]) stroke(P, P.col(maj ? 1.9 : 0.9), 1, () => {
      for (let i = 1; i < nx; i++) if ((i % 5 === 0) === maj) line(P, f.x0 + i * g, f.y0, f.x0 + i * g, f.y1);
      for (let j = 1; j < ny; j++) if ((j % 5 === 0) === maj) line(P, f.x0, f.y0 + j * g, f.x1, f.y0 + j * g);
    });
    stroke(P, P.col(4.5), 2.5, () => rect(P, f));
    // título
    fillBox(P, { x0: f.x0 + 14, y0: f.y0 + 14, x1: f.x0 + 520, y1: f.y0 + 62 }, P.bg);
    T(P, 'Croqui da área: ________________________', f.x0 + 24, f.y0 + 38, 20, { align: 'left', m: 4.5 });
    // norte
    const nx0 = f.x1 - 80, ny0 = f.y0 + 90, R = 50;
    ctx.beginPath(); ctx.arc(P.sx(nx0), P.sy(ny0), (R + 14) * P.z, 0, Math.PI * 2); ctx.fillStyle = P.bg; ctx.fill();
    stroke(P, P.col(3), 1.5, () => { ctx.moveTo(P.sx(nx0 + R), P.sy(ny0)); ctx.arc(P.sx(nx0), P.sy(ny0), R * P.z, 0, Math.PI * 2); });
    ctx.beginPath(); poly(P, [[nx0, ny0 - R + 4], [nx0 + 14, ny0 + 16], [nx0, ny0 + 6], [nx0 - 14, ny0 + 16]]); ctx.closePath();
    ctx.fillStyle = P.col(5); ctx.fill();
    T(P, 'N', nx0, ny0 - R - 4, 22, { base: 'bottom', bold: true, m: 5 });
    // escala gráfica: 5 quadradinhos
    const sx0 = f.x0 + 30, sy0 = f.y1 - 70, sw = 5 * g;
    fillBox(P, { x0: sx0 - 16, y0: sy0 - 40, x1: sx0 + sw + 300, y1: sy0 + 52 }, P.bg);
    for (let i = 0; i < 5; i++) fillBox(P, { x0: sx0 + i * g, y0: sy0, x1: sx0 + (i + 1) * g, y1: sy0 + 12 }, i % 2 ? P.bg : P.col(4.5));
    stroke(P, P.col(4.5), 1.5, () => rect(P, { x0: sx0, y0: sy0, x1: sx0 + sw, y1: sy0 + 12 }));
    T(P, 'escala gráfica', sx0, sy0 - 10, 15, { align: 'left', base: 'bottom', m: 4 });
    T(P, '0', sx0, sy0 + 18, 14, { base: 'top', m: 4 });
    T(P, '______ m', sx0 + sw, sy0 + 18, 14, { base: 'top', m: 4 });
    T(P, 'escala 1 : ________', sx0 + sw + 40, sy0 + 6, 16, { align: 'left', m: 4 });
  },
});

function erf(x) {   // Abramowitz e Stegun 7.1.26
  const s = Math.sign(x), t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

function punnett(P, N, key) {
  const b = fitIn(box(P, key), 1);
  if (!seen(P, b)) return;
  const q = inset(b, 70, 70, 10, 10), c = bw(q) / (N + 1);
  fillBox(P, { x0: q.x0 + c, y0: q.y0, x1: q.x1, y1: q.y0 + c }, P.col(0.55));
  fillBox(P, { x0: q.x0, y0: q.y0 + c, x1: q.x0 + c, y1: q.y1 }, P.col(0.55));
  stroke(P, P.col(4), 2, () => {
    for (let i = 0; i <= N + 1; i++) { line(P, q.x0 + i * c, q.y0, q.x0 + i * c, q.y1); line(P, q.x0, q.y0 + i * c, q.x1, q.y0 + i * c); }
    line(P, q.x0, q.y0, q.x0 + c, q.y0 + c);
  });
  T(P, '♀', q.x0 + c * 0.25, q.y0 + c * 0.72, c * 0.28, { m: 4 });
  T(P, '♂', q.x0 + c * 0.72, q.y0 + c * 0.28, c * 0.28, { m: 4 });
  T(P, 'gametas ♂', (q.x0 + c + q.x1) / 2, q.y0 - 24, 22, { base: 'bottom', m: 4 });
  T(P, 'gametas ♀', q.x0 - 30, (q.y0 + c + q.y1) / 2, 22, { rot: -Math.PI / 2, m: 4 });
}

function columns(P, n, key) {
  const b = box(P, key);
  if (!seen(P, b)) return;
  const hd = 90, G = 44, cw = (bw(b) - (n - 1) * G) / n, lh = 32 * P.k, t = b.y0 + hd;
  T(P, 'Título:', b.x0, b.y0 + hd * 0.55, 22, { align: 'left', base: 'bottom', m: 4.5 });
  stroke(P, P.col(1.6), 1, () => line(P, b.x0 + 80, b.y0 + hd * 0.55, b.x1, b.y0 + hd * 0.55));
  stroke(P, P.col(3), 1.5, () => line(P, b.x0, t, b.x1, t));
  if (lh * P.z >= 3) stroke(P, P.col(1.2), 1, () => {
    for (let i = 0; i < n; i++) { const x = b.x0 + i * (cw + G); for (let y = t + lh; y <= b.y1; y += lh) line(P, x, y, x + cw, y); }
  });
  stroke(P, P.col(2.2), 1, () => { for (let i = 1; i < n; i++) { const x = b.x0 + i * (cw + G) - G / 2; line(P, x, t + 16, x, b.y1); } });
}

export const PAPER_GROUPS = [
  ['Básicas', ['none', 'grid', 'mm', 'dots', 'lines', 'notebook', 'calligraphy', 'iso', 'hex', 'cornell']],
  ['Matemática e cálculo', ['cartesian', 'cartfine', 'polar', 'numberline', 'axes3d', 'trigrid', 'unitcircle']],
  ['Física e engenharias', ['semilog', 'loglog', 'kinematics', 'pv', 'drawing', 'ternary']],
  ['Estatística', ['normprob', 'gumbel', 'weibull']],
  ['Hidráulica e saneamento', ['moody', 'granulo']],
  ['Elétrica e eletrônica', ['scope', 'smith', 'bode', 'timing', 'phasor']],
  ['Computação', ['code', 'deskcheck', 'terminal']],
  ['Biologia e saúde', ['punnett2', 'punnett4', 'microscope']],
  ['Linguagens', ['essay', 'literacy', 'comics', 'storyboard']],
  ['Música', ['music', 'tab', 'piano', 'percussion']],
  ['Humanas', ['timeline', 'latlon']],
  ['Gestão e organização', ['canvas', 'kanban', 'matrix2', 'calendar', 'weekly', 'table', 'cols2', 'cols3']],
  ['Agrárias', ['plot']],
];

// disciplinas da biblioteca de formas ligadas a cada folha (a folha aparece se ao menos uma estiver visível)
export const PAPER_DISC = {
  cartesian: ['matematica', 'fisica'], cartfine: ['matematica', 'fisica'], polar: ['matematica', 'fisica', 'eletrica'],
  numberline: ['matematica'], axes3d: ['matematica', 'fisica'], trigrid: ['matematica'], unitcircle: ['matematica', 'fisica'],
  semilog: ['fisica', 'matematica', 'quimica', 'lab', 'eletronica'], loglog: ['fisica', 'matematica', 'quimica', 'lab'],
  kinematics: ['fisica', 'edfisica'], pv: ['fisica', 'mecanica', 'quimica', 'renov'],
  drawing: ['mecanica', 'eletrica', 'hidra', 'saneamento', 'renov'], ternary: ['quimica', 'agronomia', 'geografia'],
  normprob: ['estat'], gumbel: ['estat', 'hidra', 'saneamento'], weibull: ['estat', 'renov', 'mecanica'],
  moody: ['hidra', 'saneamento', 'mecanica'], granulo: ['saneamento', 'agronomia', 'hidra', 'geografia'],
  scope: ['eletrica', 'eletronica', 'embarcados', 'fisica'], smith: ['eletronica', 'eletrica'], bode: ['eletronica', 'eletrica', 'embarcados'],
  timing: ['eletronica', 'embarcados', 'computacao'], phasor: ['eletrica', 'renov'],
  code: ['computacao', 'embarcados'], deskcheck: ['computacao', 'fluxo'], terminal: ['computacao', 'embarcados'],
  punnett2: ['biologia', 'agronomia'], punnett4: ['biologia', 'agronomia'], microscope: ['biologia', 'lab', 'alimentos', 'saneamento'],
  essay: ['portugues', 'filosofia', 'historia'], literacy: ['portugues'], comics: ['portugues', 'historia'], storyboard: ['portugues', 'historia', 'empreendedorismo'],
  music: ['musica'], tab: ['musica'], piano: ['musica'], percussion: ['musica'],
  timeline: ['historia', 'filosofia', 'geografia'], latlon: ['geografia', 'historia'],
  canvas: ['empreendedorismo'], kanban: ['empreendedorismo', 'computacao', 'fluxo'], matrix2: ['empreendedorismo', 'fluxo'],
  calendar: ['empreendedorismo', 'fluxo'], weekly: ['empreendedorismo', 'fluxo'], table: ['fluxo', 'estat', 'empreendedorismo'],
  cols2: ['fluxo', 'portugues'], cols3: ['fluxo', 'portugues'],
  plot: ['agronomia', 'geografia'],
};

// zoom da miniatura 96×58 do menu (o padrão é 0,5)
export const PAPER_PREVIEW = {
  cornell: 0.034, polar: 0.35, numberline: 0.3, trigrid: 0.5, timing: 0.3, literacy: 0.4, tab: 0.32, piano: 0.34,
  percussion: 0.4, timeline: 0.12,
  ...Object.fromEntries(Object.entries(SHEET).map(([k, [W, H]]) => [k, +Math.min(92 / W, 54 / H).toFixed(4)])),
};
