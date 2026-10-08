// "Embelezar escrita": endireita a linha, corrige a inclinação, iguala altura e espaçamento das palavras e suaviza.
// Não troca a letra por fonte. Guarda os pontos originais em `orig` para voltar atrás.
// Modo incremental: o que já foi embelezado entra como CONTEXTO (referência de linha de base, altura e espaço)
// e não se mexe; só os traços novos se encaixam. Assim a correção é pequena e localizada.
import { smoothPts } from './stabilizer.js';

const median = a => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const pct = (a, q) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(b.length * q))]; };

export function box(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < pts.length; i += 3) {
    x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]);
    y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]);
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

export const canBeautify = it => it.type === 'stroke' && it.tool === 'pen' && !it.arrow && it.pts.length >= 6;

// intensidades: s = endireitar/inclinação · sp/passes = suavização · shift = assentar na linha
// size = igualar altura das palavras · space = regularizar espaço entre palavras
export const BEAUTY_LEVELS = {
  suave: { s: 0.35, sp: 18, passes: 1, shift: 0.2, size: 0, space: 0 },
  moderado: { s: 0.65, sp: 14, passes: 2, shift: 0.35, size: 0.5, space: 0.4 },
  forte: { s: 1, sp: 9, passes: 3, shift: 0.55, size: 0.85, space: 0.8 },
};

function fitBaseline(list, x0, hl) {
  const bins = new Map();
  for (const p of list) for (let i = 0; i < p.length; i += 3) {
    const k = Math.floor((p[i] - x0) / hl);
    if (!bins.has(k)) bins.set(k, []);
    bins.get(k).push(p[i + 1]);
  }
  const bx = [], by = [];
  for (const [k, ys] of bins) if (ys.length >= 3) { bx.push(x0 + (k + 0.5) * hl); by.push(pct(ys, 0.8)); }
  if (!by.length) return null;
  const mx = bx.reduce((a, b) => a + b) / bx.length, my = by.reduce((a, b) => a + b) / by.length;
  let num = 0, den = 0;
  for (let i = 0; i < bx.length; i++) { num += (bx[i] - mx) * (by[i] - my); den += (bx[i] - mx) ** 2; }
  return { slope: bx.length >= 2 && den ? num / den : 0, cy: my };
}

// strokes: traços novos a embelezar · context: traços já embelezados próximos (não são alterados)
export function beautify(strokes, zoom, level = 'moderado', context = []) {
  const L = BEAUTY_LEVELS[level] || BEAUTY_LEVELS.moderado, strength = L.s;
  const out = new Map();
  const pend = strokes.filter(canBeautify);
  if (!pend.length) return out;
  const ids = new Set(pend.map(s => s.id));
  let items = [...pend.map(s => ({ s, b: box(s.pts), ctx: false })),
    ...context.filter(c => canBeautify(c) && !ids.has(c.id)).map(s => ({ s, b: box(s.pts), ctx: true }))];
  const hMed = Math.max(4 / zoom, median(items.filter(i => !i.ctx).map(i => i.b.h)));
  // fora: sublinhados/linhas longas e traços grandes demais para serem letra
  items = items.filter(i => !(i.b.w > 8 * hMed && i.b.h < 0.5 * hMed) && i.b.h < 5 * hMed && i.b.h * zoom < 220 && i.b.w * zoom < 900);

  // agrupa em linhas por sobreposição vertical (novos primeiro, para a linha nascer deles)
  items.sort((a, b) => (a.ctx - b.ctx) || ((a.b.y0 + a.b.y1) - (b.b.y0 + b.b.y1)));
  const lines = [];
  for (const it of items) {
    // contexto entra com tolerância (a linha pode estar subindo/descendo em relação à anterior)
    const tol = l => it.ctx ? 0.8 * (l.y1 - l.y0) : 0;
    const ln = lines.find(l => Math.min(l.y1 + tol(l), it.b.y1) - Math.max(l.y0 - tol(l), it.b.y0) >= 0.3 * Math.min(l.y1 - l.y0, it.b.h || 1));
    if (ln) { ln.items.push(it); if (!it.ctx) { ln.y0 = Math.min(ln.y0, it.b.y0); ln.y1 = Math.max(ln.y1, it.b.y1); } }
    else if (!it.ctx) lines.push({ items: [it], y0: it.b.y0, y1: it.b.y1 });
  }

  for (const ln of lines) {
    const P = ln.items.filter(i => !i.ctx), C = ln.items.filter(i => i.ctx);
    const hl = Math.max(3 / zoom, median(ln.items.map(i => i.b.h)));
    if (hl * zoom < 6 || hl * zoom > 160) continue;              // letra minúscula demais ou desenho
    const px0 = Math.min(...P.map(i => i.b.x0)), px1 = Math.max(...P.map(i => i.b.x1));
    if (!C.length && px1 - px0 < 1.5 * hl) continue;              // pequeno demais e sem referência

    // 1) endireita os traços novos (só se forem largos o bastante para medir a inclinação)
    const fitP = fitBaseline(P.map(i => i.s.pts), px0, hl);
    let theta = 0;
    if (fitP && px1 - px0 >= 2.5 * hl) theta = Math.max(-0.35, Math.min(0.35, Math.atan(fitP.slope)));
    const rot = -theta * Math.min(1, strength * 1.6);
    const cx = (px0 + px1) / 2, cyP = fitP ? fitP.cy : (ln.y0 + ln.y1) / 2;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const work = P.map(({ s }) => {
      const p = s.pts.slice();
      for (let i = 0; i < p.length; i += 3) {
        const dx = p[i] - cx, dy = p[i + 1] - cyP;
        p[i] = cx + dx * cos - dy * sin; p[i + 1] = cyP + dx * sin + dy * cos;
      }
      return { s, p, ctx: false };
    });

    // 2) inclinação das letras: mediana ponderada de -dx/dy nos trechos quase verticais
    const slants = [], weights = [];
    for (const { p } of work) {
      const q = smoothPts(p, hl / 6, 1);
      for (let i = 3; i < q.length; i += 3) {
        const dx = q[i] - q[i - 3], dy = q[i + 1] - q[i - 2];
        if (Math.abs(dy) > Math.abs(dx) * 1.2) { slants.push(-dx / dy); weights.push(Math.hypot(dx, dy)); }
      }
    }
    let shear = 0;
    if (slants.length >= 4) {
      const idx = slants.map((v, i) => i).sort((a, b) => slants[a] - slants[b]);
      const half = weights.reduce((a, b) => a + b) / 2;
      let acc = 0;
      for (const i of idx) { acc += weights[i]; if (acc >= half) { shear = slants[i]; break; } }
      shear = Math.max(-0.7, Math.min(0.7, shear)) * strength;
    }
    for (const w of work) for (let i = 0; i < w.p.length; i += 3) w.p[i] += shear * (w.p[i + 1] - cyP);

    // 3) palavras (novas + contexto) por proximidade horizontal
    const all = [...work, ...C.map(({ s }) => ({ s, p: s.pts, ctx: true }))].sort((a, b) => box(a.p).x0 - box(b.p).x0);
    const words = [];
    for (const w of all) {
      const b = box(w.p), last = words[words.length - 1];
      if (last && b.x0 <= last.x1 + 0.5 * hl) { last.ws.push(w); last.x1 = Math.max(last.x1, b.x1); }
      else words.push({ ws: [w], x1: b.x1 });
    }
    const wys = wd => { const ys = []; for (const w of wd.ws) for (let i = 1; i < w.p.length; i += 3) ys.push(w.p[i]); return ys; };
    for (const wd of words) {
      wd.ctx = wd.ws.some(w => w.ctx);
      // palavra que mistura contexto e traço novo (ex.: pingo do i depois): o novo só é suavizado, sem mover
      if (wd.ctx) for (const w of wd.ws) if (!w.ctx) w.p = w.s.pts.slice();
      const ys = wys(wd);
      wd.base = pct(ys, 0.8); wd.core = Math.max(1e-6, pct(ys, 0.8) - pct(ys, 0.2));
    }
    const ctxWords = words.filter(w => w.ctx);
    const target = ctxWords.length ? median(ctxWords.map(w => w.base)) : cyP;   // linha de base de referência
    const coreT = median((ctxWords.length ? ctxWords : words).map(w => w.core));

    for (const wd of words) {
      if (wd.ctx) continue;
      // 3a) iguala a altura da palavra à referência (limitado)
      if (L.size > 0 && words.length > 1) {
        const f = 1 + (Math.max(0.75, Math.min(1.33, coreT / wd.core)) - 1) * L.size;
        let x0 = Infinity; for (const w of wd.ws) x0 = Math.min(x0, box(w.p).x0);
        for (const w of wd.ws) for (let i = 0; i < w.p.length; i += 3) {
          w.p[i] = x0 + (w.p[i] - x0) * f;
          w.p[i + 1] = wd.base + (w.p[i + 1] - wd.base) * f;
        }
      }
      // 3b) assenta a palavra na linha de base
      const shift = Math.max(-L.shift * hl, Math.min(L.shift * hl, (target - wd.base) * strength));
      for (const w of wd.ws) for (let i = 1; i < w.p.length; i += 3) w.p[i] += shift;
    }

    // 3c) espaço regular entre palavras (só desloca palavras novas que vêm depois de todo o contexto)
    if (L.space > 0 && words.length > 2) {
      const ext = wd => { let a = Infinity, b = -Infinity; for (const w of wd.ws) { const bb = box(w.p); a = Math.min(a, bb.x0); b = Math.max(b, bb.x1); } return [a, b]; };
      const ex = words.map(ext);
      const gaps = ex.slice(1).map((e, i) => e[0] - ex[i][1]);
      const gT = Math.max(0.5 * hl, Math.min(1.6 * hl, median(gaps)));
      const lastCtx = words.map(w => w.ctx).lastIndexOf(true);
      let off = 0;
      for (let k = Math.max(1, lastCtx + 1); k < words.length; k++) {
        off += (gT - gaps[k - 1]) * L.space;
        for (const w of words[k].ws) for (let i = 0; i < w.p.length; i += 3) w.p[i] += off;
      }
    }

    // 4) suaviza os traços novos
    for (const w of work) {
      const pts = smoothPts(w.p, Math.max(hl / L.sp, 0.8 / zoom), L.passes);
      out.set(w.s.id, { ...w.s, pts, orig: w.s.orig || w.s.pts });
    }
  }
  return out;
}

export function restoreOriginal(it) {
  if (!it.orig) return it;
  const n = { ...it, pts: it.orig };
  delete n.orig;
  return n;
}
