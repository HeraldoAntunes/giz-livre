// Modo páginas (caderno A4, slides): geometria, desenho da "mesa" com folhas, exportação PDF e impressão.
// As páginas são faixas do mesmo mundo infinito, empilhadas na vertical: os itens e as ferramentas não mudam.
import * as R from './render.js';
import { wfetch } from './api.js';

// tamanhos em px de mundo (96 px por polegada → A4 = 210×297 mm = 794×1123)
export const SIZES = {
  a4: { w: 794, h: 1123, label: 'A4 retrato', pt: [595.28, 841.89] },
  a4l: { w: 1123, h: 794, label: 'A4 paisagem', pt: [841.89, 595.28] },
  a3l: { w: 1587, h: 1123, label: 'A3 paisagem', pt: [1190.55, 841.89] },
  s169: { w: 1280, h: 720, label: 'Slide 16:9', pt: [960, 540] },
  s43: { w: 1024, h: 768, label: 'Slide 4:3', pt: [768, 576] },
};
export const GAP = 48;

export const isPages = b => b?.layout?.mode === 'pages';

export function makeLayout(kind = 'a4', count = 1, custom = null) {
  const s = custom || SIZES[kind] || SIZES.a4;
  return { mode: 'pages', kind: custom ? 'custom' : kind, w: s.w, h: s.h, gap: GAP, count: Math.max(1, count) };
}

export const pageRect = (L, i) => ({ x: 0, y: i * (L.h + L.gap), w: L.w, h: L.h });
export const pageIndexAt = (L, y) => Math.max(0, Math.min(L.count - 1, Math.floor((y + L.gap / 2) / (L.h + L.gap))));
export const pageOf = (L, it) => { const b = R.bbox(it); return pageIndexAt(L, b.y + b.h / 2); };

// pontos PDF da página (A4 exato; outros: 0,75 pt por px)
export function pagePoints(L) {
  const s = SIZES[L.kind];
  return s && s.w === L.w && s.h === L.h ? s.pt : [L.w * 0.75, L.h * 0.75];
}

// a folha (pautada, quadriculada…) fica presa à página
function paperFor(bg, r) {
  const anchored = { cartesian: 1, polar: 1, cornell: 1 };
  let origin;
  if (anchored[bg.pattern]) origin = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  else if (bg.pattern === 'notebook') origin = { x: r.x + 90, y: r.y + 64 };
  else origin = { x: r.x, y: r.y + 64 };
  return { ...bg, origin, pageBox: r };
}

// desenha a mesa cinza com as folhas visíveis (coordenadas de tela, w×h em px CSS)
export function drawPages(ctx, board, view, w, h) {
  const L = board.layout, bg = board.background, z = view.zoom;
  const dark = R.isDark(bg.color);
  ctx.fillStyle = dark ? '#121212' : '#e4e4e4';
  ctx.fillRect(0, 0, w, h);
  const wy0 = -view.y / z, wy1 = (h - view.y) / z;
  const i0 = Math.max(0, Math.floor(wy0 / (L.h + L.gap))), i1 = Math.min(L.count - 1, Math.floor(wy1 / (L.h + L.gap)));
  for (let i = i0; i <= i1; i++) {
    const r = pageRect(L, i);
    const sx = r.x * z + view.x, sy = r.y * z + view.y, sw = r.w * z, sh = r.h * z;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
    ctx.fillStyle = bg.color; ctx.fillRect(sx, sy, sw, sh);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
    R.drawBackground(ctx, paperFor(bg, r), view, w, h);
    ctx.restore();
    if (z > 0.12) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.4)';
      ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(String(i + 1), sx + sw / 2, sy + sh + 6);
    }
  }
}

// renderiza a página i num canvas (escala = px de saída por px de mundo)
export async function renderPage(board, i, scale = 2) {
  const L = board.layout, r = pageRect(L, i);
  await R.imagesReady(board.items);
  const c = document.createElement('canvas');
  c.width = Math.round(r.w * scale); c.height = Math.round(r.h * scale);
  const ctx = c.getContext('2d');
  const view = { x: -r.x * scale, y: -r.y * scale, zoom: scale };
  R.drawBackground(ctx, paperFor(board.background, r), view, c.width, c.height);
  R.withDarkBackground(R.isDark(board.background.color), () => {
    ctx.setTransform(scale, 0, 0, scale, view.x, view.y);
    for (const it of board.items) if (R.boxesTouch(R.bbox(it), r)) R.drawItem(ctx, it);
  });
  return c;
}

// miniatura da galeria: 1ª página no modo páginas; conteúdo inteiro no modo livre
export async function boardThumb(board, w = 480, h = 270) {
  if (!isPages(board)) return R.renderToCanvas(board, { fit: { w, h }, pad: 30 });
  const pg = await renderPage(board, 0, 1);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = R.isDark(board.background.color) ? '#121212' : '#e4e4e4';
  g.fillRect(0, 0, w, h);
  const k = Math.min((w - 16) / pg.width, (h - 16) / pg.height);
  g.drawImage(pg, (w - pg.width * k) / 2, (h - pg.height * k) / 2, pg.width * k, pg.height * k);
  return c;
}

// imagens das páginas (JPEG) para o PDF ou a impressão
async function pageImages(board, scale, type = 'image/jpeg') {
  const out = [];
  if (isPages(board)) {
    const [pw, ph] = pagePoints(board.layout);
    for (let i = 0; i < board.layout.count; i++) {
      const c = await renderPage(board, i, scale);
      out.push({ w: pw, h: ph, pw: c.width, ph: c.height, src: c.toDataURL(type, 0.92) });
    }
  } else {
    const c = await R.renderToCanvas(board, { scale });
    out.push({ w: c.width / scale * 0.75, h: c.height / scale * 0.75, pw: c.width, ph: c.height, src: c.toDataURL(type, 0.92) });
  }
  return out;
}

export async function exportPdf(board) {
  const pages = (await pageImages(board, 2)).map(p => ({ w: p.w, h: p.h, pw: p.pw, ph: p.ph, jpeg: p.src }));
  const r = await wfetch('/api/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pages }) });
  if (!r.ok) throw new Error('Não foi possível gerar o PDF');
  return r.blob();
}

export async function printBoard(board) {
  const pages = await pageImages(board, 2, 'image/png');
  const area = document.createElement('div');
  area.id = 'printArea';
  const st = document.createElement('style');
  const [w, h] = [pages[0].w, pages[0].h];
  st.textContent = `@page { size: ${w}pt ${h}pt; margin: 0 } @media print { body > *:not(#printArea) { display: none !important }
    #printArea img { display: block; width: ${w}pt; height: ${h}pt; page-break-after: always } }
    @media screen { #printArea { display: none } }`;
  area.append(st, ...pages.map(p => { const im = new Image(); im.src = p.src; return im; }));
  document.body.appendChild(area);
  await Promise.all([...area.querySelectorAll('img')].map(im => im.decode().catch(() => {})));
  const done = () => { area.remove(); removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  window.print();
  setTimeout(done, 60000);
}
