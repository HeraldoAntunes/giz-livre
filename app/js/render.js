// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Desenho dos itens, caixas delimitadoras, testes de toque e reconhecimento de formas
const FONT = '"Segoe UI", system-ui, sans-serif';
const imgCache = new Map();
let onImageLoad = () => {};
export function setImageLoadHandler(fn) { onImageLoad = fn; }

const measureCtx = document.createElement('canvas').getContext('2d');

// ---------- fundo (tipos de folha em paper.js) ----------
export { drawBackground, isDark } from './paper.js';
import { shapeSvg } from './shapelib.js';
import { svgDataUrl } from './library.js';
import { drawBackground, isDark } from './paper.js';

// ---------- itens ----------
// fundo escuro: tinta preta aparece branca e vice-versa (só na exibição)
let darkBg = false;
export function setDarkBackground(v) { darkBg = !!v; }
export function withDarkBackground(v, fn) { const p = darkBg; darkBg = !!v; try { return fn(); } finally { darkBg = p; } }
function withRot(ctx, it, fn) {
  if (!it.rot) return fn();
  const cx = it.x + it.w / 2, cy = it.y + (it.type === 'text' ? textHeight(it) : it.h) / 2;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(it.rot); ctx.translate(-cx, -cy);
  try { fn(); } finally { ctx.restore(); }
}
export function drawItem(ctx, it) {
  if (it.rot && (it.type === 'text' || it.type === 'note' || it.type === 'image')) {
    const un = { ...it, rot: 0 };
    return withRot(ctx, it, () => drawItem(ctx, un));
  }
  if ((it.type === 'shape' || it.type === 'text') && darkBg && it.color === '#000000') it = { ...it, color: '#ffffff' };
  switch (it.type) {
    case 'stroke': return drawStroke(ctx, it, true);
    case 'shape': return drawShape(ctx, it);
    case 'text': return drawText(ctx, it);
    case 'note': return drawNote(ctx, it);
    case 'image': return drawImage(ctx, it);
  }
}

// desenha o caminho suavizado do traço; `ctx` pode ser um contexto 2D ou um Path2D (cache)
function strokePath(ctx, p) {
  const n = p.length / 3;
  if (ctx.beginPath) ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  if (n === 2) { ctx.lineTo(p[3], p[4]); return; }
  for (let i = 1; i < n - 1; i++) {
    const x = p[i * 3], y = p[i * 3 + 1];
    const mx = (x + p[i * 3 + 3]) / 2, my = (y + p[i * 3 + 4]) / 2;
    ctx.quadraticCurveTo(x, y, mx, my);
  }
  ctx.lineTo(p[(n - 1) * 3], p[(n - 1) * 3 + 1]);
}

const pw = (s, pr) => s.width * (0.3 + 1.1 * pr);

// Contorno do traço como polígono preenchido (largura variável sem emendas nem "contas")
const outlineCache = new WeakMap(), simpleCache = new WeakMap();
function outlinePath(s) {
  const p = s.pts, n = p.length / 3;
  const path = new Path2D();
  // comprimento acumulado (para o afinamento de início/fim)
  const L = new Float64Array(n);
  for (let i = 1; i < n; i++) L[i] = L[i - 1] + Math.hypot(p[i * 3] - p[i * 3 - 3], p[i * 3 + 1] - p[i * 3 - 2]);
  const total = L[n - 1];
  // estilos: tinteiro (pressão já modulada pela velocidade), caligrafia (pena chanfrada), pincel (pontas bem finas)
  // lápis (mais fino), marcador (ponta chata, largura sem pressão), aquarela (larga, pontas suaves)
  const brush = s.style === 'brush', calli = s.style === 'calligraphy', marker = s.style === 'marker';
  const pencil = s.style === 'pencil', aqua = s.style === 'watercolor';
  const tl = brush ? Math.min(s.width * 14, total * 0.45) : aqua ? Math.min(s.width * 8, total * 0.35)
    : s.taper && !marker ? Math.min(s.width * 5, total * 0.28) : 0;
  const tmin = brush ? 0.08 : aqua ? 0.2 : 0.35;
  const nib = (s.nib ?? (marker ? 30 : 45)) * Math.PI / 180;
  const ease = x => Math.sin(Math.min(1, x) * Math.PI / 2);
  const rad = (i, nx, ny) => {
    let r = (s.pr ? pw(s, Math.max(0.05, p[i * 3 + 2])) : s.width) / 2;
    if (calli) r = s.width * 0.9 * (0.16 + 0.84 * Math.abs(Math.sin(Math.atan2(nx, -ny) - nib)));
    else if (marker) r = s.width * 0.8 * (0.4 + 0.6 * Math.abs(Math.sin(Math.atan2(nx, -ny) - nib)));
    else if (pencil) r *= 0.75;
    else if (aqua) r *= 1.4;
    if (tl > 0) {
      const a = L[i] / tl, b = (total - L[i]) / tl;
      if (a < 1) r *= tmin + (1 - tmin) * ease(a);
      if (b < 1) r *= tmin + (1 - tmin) * ease(b);
    }
    return r;
  };
  const lx = new Float64Array(n), ly = new Float64Array(n), rx = new Float64Array(n), ry = new Float64Array(n), R = new Float64Array(n);
  let nx = 0, ny = -1;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
    const tx = p[b * 3] - p[a * 3], ty = p[b * 3 + 1] - p[a * 3 + 1], tlen = Math.hypot(tx, ty);
    if (tlen > 1e-9) { nx = -ty / tlen; ny = tx / tlen; }
    const r = rad(i, nx, ny);
    R[i] = r;
    lx[i] = p[i * 3] + nx * r; ly[i] = p[i * 3 + 1] + ny * r;
    rx[i] = p[i * 3] - nx * r; ry[i] = p[i * 3 + 1] - ny * r;
  }
  const ang = (i, x, y) => Math.atan2(y - p[i * 3 + 1], x - p[i * 3]);
  path.moveTo(lx[0], ly[0]);
  for (let i = 1; i < n; i++) path.lineTo(lx[i], ly[i]);
  const e = n - 1;
  if (!marker) path.arc(p[e * 3], p[e * 3 + 1], R[e], ang(e, lx[e], ly[e]), ang(e, rx[e], ry[e]), true);   // marcador: pontas retas
  for (let i = n - 1; i >= 0; i--) path.lineTo(rx[i], ry[i]);
  if (!marker) path.arc(p[0], p[1], R[0], ang(0, rx[0], ry[0]), ang(0, lx[0], ly[0]), true);
  path.closePath();
  return path;
}

// estilo Giz ("simulando a época de giz"): textura granulada fixa na cor da caneta, com falhas, como giz na
// lousa. A textura é gerada uma vez por cor (sorteio determinístico) e preenche o contorno do traço; nada é apagado por baixo.
// o lápis usa grão fino e denso (grafite no papel).
const TEXTURAS = { giz: [3200, 0.5, 1.3, 0.3], lapis: [5200, 0.3, 0.6, 0.2] };
const texCache = new Map();
function textura(ctx, color, tipo = 'giz') {
  const k = tipo + color;
  let c = texCache.get(k);
  if (!c) {
    const [qt, rmin, rvar, amin] = TEXTURAS[tipo];
    c = document.createElement('canvas'); c.width = c.height = 96;
    const g = c.getContext('2d');
    let semente = 20261015;
    const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
    g.fillStyle = color;
    for (let i = 0; i < qt; i++) { g.globalAlpha = amin + rnd() * (1 - amin); const r = rmin + rnd() * rvar; g.fillRect(rnd() * 96, rnd() * 96, r, r * (0.6 + rnd() * 0.8)); }
    if (tipo === 'giz') {   // falhas em riscos finos, como o giz que pula nos poros da lousa (sem emenda na repetição)
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 70; i++) {
        const x = rnd() * 96, y = rnd() * 96, l = 4 + rnd() * 16, e = 0.6 + rnd() * 0.9;
        g.globalAlpha = 0.35 + rnd() * 0.5;
        for (const dx of [-96, 0, 96]) for (const dy of [-96, 0, 96]) g.fillRect(x + dx, y + dy, l, e);
      }
      g.globalCompositeOperation = 'source-over';
    }
    texCache.set(k, c);
  }
  return ctx.createPattern(c, 'repeat');
}

export function drawStroke(ctx, s, cache = false) {
  const p = s.pts, n = p.length / 3;
  if (!n) return;
  ctx.save();
  const color = darkBg && s.color === '#000000' ? '#ffffff' : s.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ctx.fillStyle = color;
  if (s.tool === 'highlighter') ctx.globalAlpha = 0.38;
  if (n === 1) {
    ctx.beginPath();
    ctx.arc(p[0], p[1], (s.pr ? pw(s, p[2]) : s.width) / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (!s.pr && !s.taper && !s.style) {
    ctx.lineWidth = s.width;
    let path = cache ? simpleCache.get(s) : null;
    if (!path) { path = new Path2D(); strokePath(path, p); if (cache) simpleCache.set(s, path); }
    ctx.stroke(path);
  } else {
    let path = cache ? outlineCache.get(s) : null;
    if (!path) { path = outlinePath(s); if (cache) outlineCache.set(s, path); }
    const tex = typeof document !== 'undefined' && !!ctx.createPattern, a = ctx.globalAlpha;
    if (s.style === 'giz' && tex) {
      ctx.globalAlpha = a * 0.08; ctx.lineWidth = Math.max(1, s.width * 0.55); ctx.stroke(path);   // pó espalhado em volta
      ctx.globalAlpha = a * 0.36; ctx.fill(path, 'nonzero');   // pó de fundo, mais fraco
      ctx.globalAlpha = a; ctx.fillStyle = textura(ctx, color, 'giz'); ctx.fill(path, 'nonzero');   // grãos
    } else if (s.style === 'pencil' && tex) {
      ctx.globalAlpha = a * 0.5; ctx.fill(path, 'nonzero');
      ctx.globalAlpha = a * 0.9; ctx.fillStyle = textura(ctx, color, 'lapis'); ctx.fill(path, 'nonzero');
    } else if (s.style === 'marker') {
      ctx.globalAlpha = a * 0.88; ctx.fill(path, 'nonzero');   // tinta de marcador, levemente translúcida
    } else if (s.style === 'watercolor') {
      ctx.globalAlpha = a * 0.22; ctx.fill(path, 'nonzero');   // aguada
      const dx = s.width * 0.18, dy = s.width * 0.12;   // segunda demão um pouco deslocada: a tinta "escorre"
      ctx.translate(dx, dy); ctx.globalAlpha = a * 0.14; ctx.fill(path, 'nonzero'); ctx.translate(-dx, -dy);
      ctx.globalAlpha = a * 0.32; ctx.lineWidth = Math.max(0.8, s.width * 0.12); ctx.stroke(path);   // pigmento junta na borda
    } else ctx.fill(path, 'nonzero');
    ctx.globalAlpha = a;
  }
  if (s.arrow && n > 1) {
    const ex = p[(n - 1) * 3], ey = p[(n - 1) * 3 + 1];
    // direção a partir de um ponto ~ 3x a cabeça para trás
    const head = Math.max(12, s.width * 4);
    let bx = p[0], by = p[1];
    for (let i = n - 2; i >= 0; i--) {
      bx = p[i * 3]; by = p[i * 3 + 1];
      if (Math.hypot(ex - bx, ey - by) > head) break;
    }
    arrowHead(ctx, bx, by, ex, ey, head, s.width);
  }
  ctx.restore();
}

function arrowHead(ctx, bx, by, ex, ey, head, width) {
  const a = Math.atan2(ey - by, ex - bx);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(ex - head * Math.cos(a - 0.45), ey - head * Math.sin(a - 0.45));
  ctx.lineTo(ex, ey);
  ctx.lineTo(ex - head * Math.cos(a + 0.45), ey - head * Math.sin(a + 0.45));
  ctx.stroke();
}

export function shapePath(ctx, s) {
  const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2);
  const w = Math.abs(s.x2 - s.x1), h = Math.abs(s.y2 - s.y1);
  ctx.beginPath();
  switch (s.kind) {
    case 'line': case 'arrow':
      ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); break;
    case 'rect': ctx.rect(x, y, w, h); break;
    case 'ellipse': ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); break;
    case 'triangle':
      ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); break;
    case 'polygon': {
      const p = s.pts;
      ctx.moveTo(p[0], p[1]);
      for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
      ctx.closePath();
      break;
    }
  }
}

function drawShape(ctx, s) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.width;
  shapePath(ctx, s);
  if (s.fill && s.kind !== 'line' && s.kind !== 'arrow') { ctx.fillStyle = s.fill; ctx.fill(); }
  if (s.dash) ctx.setLineDash([s.width * 3, s.width * 2.5]);
  ctx.stroke();
  ctx.setLineDash([]);
  if (s.kind === 'arrow') arrowHead(ctx, s.x1, s.y1, s.x2, s.y2, Math.max(14, s.width * 4), s.width);
  if (s.kind === 'arrow' && s.both) arrowHead(ctx, s.x2, s.y2, s.x1, s.y1, Math.max(14, s.width * 4), s.width);
  ctx.restore();
}

// quebra o texto em linhas que cabem em `w`
export const fontOf = it => it.font ? `"${it.font}", ${FONT}` : FONT;
// negrito e itálico do item (texto e nota): prefixo da propriedade CSS font
export const estiloDe = it => (it.i ? 'italic ' : '') + (it.b ? 'bold ' : '');
export function wrapText(text, size, w, font = FONT, estilo = '') {
  measureCtx.font = `${estilo}${size}px ${font}`;
  const out = [];
  for (const para of (text || '').split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const t = line ? line + ' ' + word : word;
      if (measureCtx.measureText(t).width > w && line) { out.push(line); line = word; }
      else line = t;
    }
    out.push(line);
  }
  return out;
}

export function textHeight(it) {
  return Math.max(1, wrapText(it.text, it.size, it.w, fontOf(it), estiloDe(it)).length) * it.size * 1.3;
}

// escreve o texto quebrado em linhas com o alinhamento pedido (esquerda, centro, direita, justificado)
function desenhaLinhas(ctx, text, size, w, font, estilo, x, y, lh, al) {
  let k = 0;
  for (const para of (text || '').split('\n')) {
    const linhas = wrapText(para, size, w, font, estilo);
    linhas.forEach((l, j) => {
      const yy = y + k++ * lh;
      if (al === 'center') { ctx.textAlign = 'center'; ctx.fillText(l, x + w / 2, yy); }
      else if (al === 'right') { ctx.textAlign = 'right'; ctx.fillText(l, x + w, yy); }
      else if (al === 'justify' && j < linhas.length - 1 && l.includes(' ')) {
        ctx.textAlign = 'left';
        const pal = l.split(' '), larg = pal.reduce((s, p) => s + ctx.measureText(p).width, 0);
        const vao = (w - larg) / (pal.length - 1);
        let xx = x;
        for (const p of pal) { ctx.fillText(p, xx, yy); xx += ctx.measureText(p).width + vao; }
      } else { ctx.textAlign = 'left'; ctx.fillText(l, x, yy); }
    });
  }
}

function drawText(ctx, it) {
  if (it._editing) return;
  ctx.save();
  ctx.fillStyle = it.color;
  ctx.font = `${estiloDe(it)}${it.size}px ${fontOf(it)}`;
  ctx.textBaseline = 'top';
  desenhaLinhas(ctx, it.text, it.size, it.w, fontOf(it), estiloDe(it), it.x, it.y, it.size * 1.3, it.al);
  ctx.restore();
}

const noteSizeCache = new WeakMap();
export function noteFontSize(it) {
  if (noteSizeCache.has(it)) return noteSizeCache.get(it);
  const v = noteFontSizeRaw(it);
  noteSizeCache.set(it, v);
  return v;
}
// altura que a nota precisa para mostrar todo o texto no tamanho escolhido: cresce para baixo em vez de encolher a
// letra e volta à altura de base (hb, a que a nota tinha antes de crescer) quando o texto diminui; sem tamanho escolhido
// (automático), a altura não muda
export function noteHeightFor(it) {
  if (!it.fs) return it.h;
  const pad = it.w * 0.08, base = it.hb || it.h;
  const lines = wrapText(it.text || 'x', it.fs, it.w - pad * 2, fontOf(it), estiloDe(it));
  return Math.max(base, lines.length * it.fs * 1.25 + pad * 2);
}
// nota com o texto todo à vista: guarda a altura de base na primeira vez que cresce
export function noteFitted(it) {
  if (it.type !== 'note' || !it.fs) return it;
  const n = { ...it, hb: it.hb || it.h };
  n.h = noteHeightFor(n);
  if (n.h === n.hb) delete n.hb;
  return n;
}

function noteFontSizeRaw(it) {
  if (it.fs) return it.fs;   // tamanho escolhido pelo professor; sem ele, o maior que cabe na nota
  let size = Math.round(it.w / 7);
  const pad = it.w * 0.08;
  while (size > 8) {
    const lines = wrapText(it.text, size, it.w - pad * 2, fontOf(it), estiloDe(it));
    if (lines.length * size * 1.25 <= it.h - pad * 2) break;
    size -= 1;
  }
  return size;
}

function drawNote(ctx, it) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = it.color;
  ctx.beginPath();
  ctx.roundRect(it.x, it.y, it.w, it.h, 4);
  ctx.fill();
  ctx.restore();
  if (it._editing || !it.text) return;
  ctx.save();
  const size = noteFontSize(it), pad = it.w * 0.08;
  ctx.fillStyle = '#252423';
  ctx.font = `${estiloDe(it)}${size}px ${fontOf(it)}`;
  ctx.textBaseline = 'top';
  desenhaLinhas(ctx, it.text, size, it.w - pad * 2, fontOf(it), estiloDe(it), it.x + pad, it.y + pad, size * 1.25, it.al);
  ctx.restore();
}

function getImage(it, src = it.src) {
  let img = imgCache.get(src);
  if (!img) {
    img = new Image();
    img.onload = () => onImageLoad();
    img.src = src;
    imgCache.set(src, img);
  }
  return img;
}

// forma da biblioteca ({lib, tint}): desenhada a partir da própria biblioteca na cor `tint`;
// tinta preta em fundo escuro aparece branca (como o traço preto). Sem a forma na biblioteca, usa o `src` gravado.
// `semLegendas: true` no item: desenhada sem os textos (botão Legendas da barra da seleção).
const libSrcCache = new Map();
export function libSrc(id, color, semTexto = false) {
  const k = id + color + (semTexto ? '/sem' : '');
  if (!libSrcCache.has(k)) { const m = shapeSvg(id, color, { semTexto }); libSrcCache.set(k, m ? svgDataUrl(m.svg) : null); }
  return libSrcCache.get(k);
}
// imagem que de fato é desenhada (o PNG/PDF e a miniatura esperam por esta, não pelo src gravado)
function srcOf(it) {
  if (!it.lib) return it.src;
  const t = it.tint ?? (it.src?.includes('%23000000') ? '#000000' : null);
  if (!t) return it.src;
  return libSrc(it.lib, darkBg && t === '#000000' ? '#ffffff' : t, !!it.semLegendas) || it.src;
}
// imagem já carregada do item (ou null) — a borracha usa para tocar só no desenho da forma
export function loadedImage(it) { const img = getImage(it, srcOf(it)); return img.complete && img.naturalWidth ? img : null; }
function drawImage(ctx, it) {
  const img = getImage(it, srcOf(it));
  if (img.complete && img.naturalWidth) ctx.drawImage(img, it.x, it.y, it.w, it.h);
  else {
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(it.x, it.y, it.w, it.h);
  }
}

export function imagesReady(items, dark = darkBg) {
  const prev = darkBg; darkBg = dark;
  try {
  return Promise.all(items.filter(i => i.type === 'image').map(i => {
    const img = getImage(i, srcOf(i));
    return img.complete ? null : new Promise(r => { img.addEventListener('load', r); img.addEventListener('error', r); });
  }));
  } finally { darkBg = prev; }
}

// ---------- geometria ----------
// item vindo de fora (arquivo .lousa, pacote de outro PC) com geometria que o desenho consegue usar: números finitos
// onde o bbox e o desenho leem. Um traço com pts=null derrubava o desenho do quadro (auditoria de 29/10/2026). As
// mesmas regras estão em item_valido(), no server.py.
const num = v => typeof v === 'number' && Number.isFinite(v);
const nums = (p, passo, min) => Array.isArray(p) && p.length >= min && p.length % passo === 0 && p.every(num);
export function itemValido(it) {
  if (!it || typeof it !== 'object' || typeof it.type !== 'string') return false;
  switch (it.type) {
    case 'stroke': return nums(it.pts, 3, 3) && num(it.width) && it.width > 0;
    case 'shape': return num(it.width) && (it.kind === 'polygon' ? nums(it.pts, 2, 4) : [it.x1, it.y1, it.x2, it.y2].every(num));
    case 'text': return [it.x, it.y, it.w].every(num);
    default: return [it.x, it.y, it.w, it.h].every(num);
  }
}

const bboxCache = new WeakMap();
export function bbox(it) {
  let b = bboxCache.get(it);
  if (b) return b;
  switch (it.type) {
    case 'stroke': {
      let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      const p = it.pts;
      for (let i = 0; i < p.length; i += 3) {
        if (p[i] < x1) x1 = p[i]; if (p[i] > x2) x2 = p[i];
        if (p[i + 1] < y1) y1 = p[i + 1]; if (p[i + 1] > y2) y2 = p[i + 1];
      }
      const m = it.width * (it.style === 'watercolor' ? 1.05 : it.style === 'calligraphy' || it.style === 'marker' ? 0.95 : it.pr ? 0.75 : 0.5) + (it.arrow ? it.width * 4 : 0);
      b = { x: x1 - m, y: y1 - m, w: x2 - x1 + 2 * m, h: y2 - y1 + 2 * m };
      break;
    }
    case 'shape': {
      let x1, y1, x2, y2;
      if (it.kind === 'polygon') {
        x1 = y1 = Infinity; x2 = y2 = -Infinity;
        for (let i = 0; i < it.pts.length; i += 2) {
          x1 = Math.min(x1, it.pts[i]); x2 = Math.max(x2, it.pts[i]);
          y1 = Math.min(y1, it.pts[i + 1]); y2 = Math.max(y2, it.pts[i + 1]);
        }
      } else {
        x1 = Math.min(it.x1, it.x2); x2 = Math.max(it.x1, it.x2);
        y1 = Math.min(it.y1, it.y2); y2 = Math.max(it.y1, it.y2);
      }
      const m = it.width / 2 + (it.kind === 'arrow' ? Math.max(14, it.width * 4) : 0);
      b = { x: x1 - m, y: y1 - m, w: x2 - x1 + 2 * m, h: y2 - y1 + 2 * m };
      break;
    }
    case 'text': b = { x: it.x, y: it.y, w: it.w, h: textHeight(it) }; break;
    default: b = { x: it.x, y: it.y, w: it.w, h: it.h };
  }
  if (it.rot && (it.type === 'text' || it.type === 'note' || it.type === 'image')) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, c = Math.abs(Math.cos(it.rot)), s = Math.abs(Math.sin(it.rot));
    const w = b.w * c + b.h * s, h = b.w * s + b.h * c;
    b = { x: cx - w / 2, y: cy - h / 2, w, h };
  }
  bboxCache.set(it, b);
  return b;
}

export function unionBox(items) {
  if (!items.length) return null;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const it of items) {
    const b = bbox(it);
    x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y);
    x2 = Math.max(x2, b.x + b.w); y2 = Math.max(y2, b.y + b.h);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

export const boxesTouch = (a, b) => a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;

function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l = dx * dx + dy * dy;
  let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

// toque no item? (tol em unidades de mundo). `inkOnly` limita a traços e formas (borracha)
export function hitItem(it, x, y, tol, inkOnly = false) {
  const b = bbox(it);
  if (x < b.x - tol || x > b.x + b.w + tol || y < b.y - tol || y > b.y + b.h + tol) return false;
  if (it.type === 'stroke') {
    const p = it.pts, r = it.width / 2 + tol;
    if (p.length === 3) return Math.hypot(x - p[0], y - p[1]) <= r;
    for (let i = 3; i < p.length; i += 3)
      if (distSeg(x, y, p[i - 3], p[i - 2], p[i], p[i + 1]) <= r) return true;
    return false;
  }
  if (it.type === 'shape') {
    const r = it.width / 2 + tol;
    if (it.kind === 'line' || it.kind === 'arrow') return distSeg(x, y, it.x1, it.y1, it.x2, it.y2) <= r;
    if (!inkOnly && it.fill) return true;   // forma vazia: só a borda seleciona (não tampa o que está dentro)
    measureCtx.lineWidth = r * 2;
    shapePath(measureCtx, it);
    return measureCtx.isPointInStroke(x, y);
  }
  return !inkOnly;
}

export function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const xi = poly[i], yi = poly[i + 1], xj = poly[j], yj = poly[j + 1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function inLasso(it, poly) {
  if (it.type === 'stroke') {
    const p = it.pts, n = p.length / 3;
    const step = Math.max(1, Math.floor(n / 40));
    let inn = 0, tot = 0;
    for (let i = 0; i < n; i += step) { tot++; if (pointInPoly(p[i * 3], p[i * 3 + 1], poly)) inn++; }
    return inn / tot >= 0.6;
  }
  const b = bbox(it);
  return pointInPoly(b.x + b.w / 2, b.y + b.h / 2, poly);
}

// aplica escala s em torno de (ox,oy) e translação (dx,dy); devolve novo item
export function transformItem(it, dx, dy, s = 1, ox = 0, oy = 0) {
  const fx = x => (x - ox) * s + ox + dx, fy = y => (y - oy) * s + oy + dy;
  const n = { ...it };
  delete n._editing;
  switch (it.type) {
    case 'stroke': {
      const p = new Array(it.pts.length);
      for (let i = 0; i < p.length; i += 3) { p[i] = fx(it.pts[i]); p[i + 1] = fy(it.pts[i + 1]); p[i + 2] = it.pts[i + 2]; }
      n.pts = p; n.width = it.width * s;
      if (it.orig) {  // o original acompanha o traço (voltar ao original não salta de lugar)
        const o = new Array(it.orig.length);
        for (let i = 0; i < o.length; i += 3) { o[i] = fx(it.orig[i]); o[i + 1] = fy(it.orig[i + 1]); o[i + 2] = it.orig[i + 2]; }
        n.orig = o;
      }
      break;
    }
    case 'shape':
      if (it.kind === 'polygon') n.pts = it.pts.map((v, i) => i % 2 ? fy(v) : fx(v));
      else { n.x1 = fx(it.x1); n.y1 = fy(it.y1); n.x2 = fx(it.x2); n.y2 = fy(it.y2); }
      n.width = it.width * s; break;
    case 'text': n.x = fx(it.x); n.y = fy(it.y); n.w = it.w * s; n.size = it.size * s;
      if (it.ink) n.ink = it.ink.map(k => transformItem(k, dx, dy, s, ox, oy));
      break;
    case 'note':   // a letra escolhida acompanha a nota ao redimensionar, como na caixa de texto
      n.x = fx(it.x); n.y = fy(it.y); n.w = it.w * s; n.h = it.h * s;
      if (it.fs) n.fs = it.fs * s;
      if (it.hb) n.hb = it.hb * s;
      break;
    default: n.x = fx(it.x); n.y = fy(it.y); n.w = it.w * s; n.h = it.h * s;
  }
  return n;
}

// ---------- tinta → forma ----------
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let dmax = 0, idx = 0;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) {
    const d = distSeg(pts[i][0], pts[i][1], ax, ay, bx, by);
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax <= eps) return [pts[0], pts[pts.length - 1]];
  return rdp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(pts.slice(idx), eps));
}

const angleAt = (a, b, c) => {
  const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1);
  return Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
};

// opções do "tinta vira forma"; sem opção, vale o comportamento de antes
export const FORMA_OPC = { linha: true, elipse: true, retangulo: true, poligono: true, angulos: false, circulo: false, quadrado: false };
const ANG_PASSO = 45, ANG_TOL = 7;   // retas presas a 0°, 45°, 90°… quando o traço passa a menos de 7° disso
function prendeAngulo(sx, sy, ex, ey) {
  const L = Math.hypot(ex - sx, ey - sy), a = Math.atan2(ey - sy, ex - sx) * 180 / Math.PI, alvo = Math.round(a / ANG_PASSO) * ANG_PASSO;
  if (Math.abs(a - alvo) > ANG_TOL) return [ex, ey];
  const r = alvo * Math.PI / 180;
  return [sx + L * Math.cos(r), sy + L * Math.sin(r)];
}
export function recognizeShape(stroke, opc = FORMA_OPC) {
  const O = { ...FORMA_OPC, ...opc };
  const p = stroke.pts, n = p.length / 3;
  if (n < 6) return null;
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([p[i * 3], p[i * 3 + 1]]);
  let len = 0;
  for (let i = 1; i < n; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const b = bbox({ ...stroke, width: 0, pr: false, arrow: false });
  const diag = Math.hypot(b.w, b.h);
  if (diag < 25) return null;
  const [sx, sy] = pts[0], [ex, ey] = pts[n - 1];
  const gap = Math.hypot(ex - sx, ey - sy);
  const base = { id: stroke.id, type: 'shape', color: stroke.color, width: stroke.width, fill: null };
  if (gap / len > 0.94) {
    if (!O.linha) return null;
    const [fx, fy] = O.angulos ? prendeAngulo(sx, sy, ex, ey) : [ex, ey];
    return { ...base, kind: stroke.arrow ? 'arrow' : 'line', x1: sx, y1: sy, x2: fx, y2: fy };
  }
  if (gap > diag * 0.25) return null; // aberto e não reto: deixa como está

  let v = rdp(pts, diag * 0.07);
  if (Math.hypot(v[0][0] - v[v.length - 1][0], v[0][1] - v[v.length - 1][1]) < diag * 0.2) v = v.slice(0, -1);
  // remove vértices quase retos (inclusive o inicial)
  let changed = true;
  while (changed && v.length > 3) {
    changed = false;
    for (let i = 0; i < v.length; i++) {
      const a = v[(i - 1 + v.length) % v.length], c = v[(i + 1) % v.length];
      if (angleAt(a, v[i], c) > 155) { v.splice(i, 1); changed = true; break; }
    }
  }
  const x = b.x, y = b.y, w = b.w, h = b.h;
  // quase quadrado/círculo vira perfeito (lado = média), centrado no desenho
  const perfeito = () => { const m = (w + h) / 2; return { x1: x + w / 2 - m / 2, y1: y + h / 2 - m / 2, x2: x + w / 2 + m / 2, y2: y + h / 2 + m / 2 }; };
  const quase = Math.abs(w - h) / Math.max(w, h) < 0.18;
  // elipse: raio normalizado constante?
  const cx = x + w / 2, cy = y + h / 2;
  let err = 0;
  for (const [px, py] of pts) err += Math.abs(Math.hypot((px - cx) / (w / 2), (py - cy) / (h / 2)) - 1);
  err /= pts.length;
  const ellipse = O.elipse ? { ...base, kind: 'ellipse', x1: x, y1: y, x2: x + w, y2: y + h, ...(O.circulo && quase ? perfeito() : {}) } : null;
  if (err < 0.09) return ellipse;
  if (v.length === 3) return O.poligono ? { ...base, kind: 'polygon', pts: v.flat() } : null;
  if (v.length === 4) {
    const axis = v.every((q, i) => {
      const r = v[(i + 1) % 4];
      const a = Math.abs(Math.atan2(r[1] - q[1], r[0] - q[0]) * 180 / Math.PI) % 90;
      return a < 15 || a > 75;
    });
    if (axis) return O.retangulo ? { ...base, kind: 'rect', x1: x, y1: y, x2: x + w, y2: y + h, ...(O.quadrado && quase ? perfeito() : {}) } : null;
    return O.poligono ? { ...base, kind: 'polygon', pts: v.flat() } : null;
  }
  return err < 0.2 ? ellipse : null;
}

// ---------- renderização para imagem (exportação / miniatura) ----------
export async function renderToCanvas(board, opts = {}) {
  const items = board.items;
  await imagesReady(items, !opts.transparent && isDark(board.background.color));
  const pad = opts.pad ?? 40;
  const box = opts.box || unionBox(items) || { x: 0, y: 0, w: 800, h: 500 };
  const bx = box.x - pad, by = box.y - pad, bw = box.w + pad * 2, bh = box.h + pad * 2;
  let scale;
  if (opts.fit) scale = Math.min(opts.fit.w / bw, opts.fit.h / bh);
  else scale = Math.min(opts.scale ?? 2, 8000 / Math.max(bw, bh));
  const W = opts.fit ? opts.fit.w : Math.ceil(bw * scale), H = opts.fit ? opts.fit.h : Math.ceil(bh * scale);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const offX = (W - bw * scale) / 2 - bx * scale, offY = (H - bh * scale) / 2 - by * scale;
  if (!opts.transparent) drawBackground(ctx, board.background, { x: offX, y: offY, zoom: scale }, W, H);
  const prevDark = darkBg;
  darkBg = !opts.transparent && isDark(board.background.color);
  ctx.setTransform(scale, 0, 0, scale, offX, offY);
  for (const it of items) drawItem(ctx, it);
  darkBg = prevDark;
  return c;
}


// gira um item em torno de (cx, cy); formas fechadas viram polígono para girar de verdade
export function rotateItem(it, ang, cx, cy) {
  if (!ang) return it;
  const c = Math.cos(ang), s = Math.sin(ang);
  const rp = (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
  const n = { ...it };
  if (it.type === 'stroke') {
    const rot3 = a => { const o = new Array(a.length); for (let i = 0; i < a.length; i += 3) { const [x, y] = rp(a[i], a[i + 1]); o[i] = x; o[i + 1] = y; o[i + 2] = a[i + 2]; } return o; };
    n.pts = rot3(it.pts);
    if (it.orig) n.orig = rot3(it.orig);
    return n;
  }
  if (it.type === 'shape') {
    if (it.kind === 'line' || it.kind === 'arrow') { [n.x1, n.y1] = rp(it.x1, it.y1); [n.x2, n.y2] = rp(it.x2, it.y2); return n; }
    let poly = it.pts;
    if (it.kind !== 'polygon') {
      const x = Math.min(it.x1, it.x2), y = Math.min(it.y1, it.y2), w = Math.abs(it.x2 - it.x1), h = Math.abs(it.y2 - it.y1);
      if (it.kind === 'rect') poly = [x, y, x + w, y, x + w, y + h, x, y + h];
      else if (it.kind === 'triangle') poly = [x + w / 2, y, x + w, y + h, x, y + h];
      else { poly = []; for (let k = 0; k < 72; k++) { const t = k / 72 * 2 * Math.PI; poly.push(x + w / 2 + Math.cos(t) * w / 2, y + h / 2 + Math.sin(t) * h / 2); } }
    }
    const o = []; for (let i = 0; i < poly.length; i += 2) o.push(...rp(poly[i], poly[i + 1]));
    delete n.x1; delete n.y1; delete n.x2; delete n.y2;
    n.kind = 'polygon'; n.pts = o;
    return n;
  }
  const b = bbox({ ...it, rot: 0 }), [ncx, ncy] = rp(b.x + b.w / 2, b.y + b.h / 2);
  n.x = it.x + (ncx - (b.x + b.w / 2)); n.y = it.y + (ncy - (b.y + b.h / 2));
  n.rot = ((it.rot || 0) + ang) % (2 * Math.PI);
  if (it.ink) n.ink = it.ink.map(k => rotateItem(k, ang, cx, cy));
  return n;
}
