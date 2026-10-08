// Tipos de folha (fundo do quadro). Tudo desenhado só na área visível, em coordenadas de tela.
export const PAPERS = [
  ['none', 'Lisa'], ['grid', 'Quadriculada'], ['mm', 'Milimetrada'], ['dots', 'Pontilhada'],
  ['lines', 'Pautada'], ['notebook', 'Caderno'], ['calligraphy', 'Caligrafia'], ['iso', 'Isométrica'],
  ['hex', 'Hexagonal'], ['cartesian', 'Plano cartesiano'], ['polar', 'Polar'], ['music', 'Pauta musical'],
  ['cornell', 'Cornell'],
];
// folhas presas a uma origem (não se repetem pelo quadro inteiro)
export const ANCHORED = new Set(['notebook', 'cartesian', 'polar', 'cornell']);
const SIZE = { s: 0.6, m: 1, l: 1.6 };
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
    const str = STRENGTH[bg.strength] || 1, dark = isDark(bg.color);
    const P = {
      ctx, w, h, z: view.zoom, v: view, k: SIZE[bg.size] || 1, o: bg.origin || { x: 0, y: 0 }, dark, page: bg.pageBox,
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
