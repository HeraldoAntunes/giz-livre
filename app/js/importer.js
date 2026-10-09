// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Importação de PowerPoint (.pptx, via PowerPoint do Windows no servidor) e PDF (pdf.js) como páginas com o slide travado no fundo.
import { newId, wfetch } from './api.js';
import { makeLayout, pageRect } from './pages.js';

// grava uma imagem (Blob/dataURL) como arquivo no servidor e devolve a URL /assets/...
export async function uploadAsset(data) {
  const blob = typeof data === 'string' ? await (await fetch(data)).blob() : data;
  const r = await wfetch('/api/assets', { method: 'POST', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob });
  const j = await r.json();
  if (!r.ok) throw new Error(j.erro || 'Falha ao guardar imagem');
  return j.url;
}

export const isPptx = f => /\.(pptx?|ppsx?)$/i.test(f.name);
export const isPdf = f => /\.pdf$/i.test(f.name) || f.type === 'application/pdf';

// devolve { size: {w,h}, srcs: [url, ...] }
export async function slidesFromPptx(file, onProgress = () => {}) {
  onProgress('Abrindo o PowerPoint para converter os slides…');
  const r = await wfetch('/api/pptx', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-Nome-Arquivo': encodeURIComponent(file.name) }, body: file });
  const j = await r.json();
  if (!r.ok) throw new Error(j.erro || 'Falha ao converter o PowerPoint');
  if (j.pdf) {
    // sem PowerPoint (Linux, Mac ou Windows sem Office): o LibreOffice converteu para PDF, que o pdf.js lê
    onProgress('Lendo os slides convertidos pelo LibreOffice…');
    const bytes = Uint8Array.from(atob(j.pdf), c => c.charCodeAt(0));
    return slidesFromPdf(new File([bytes], file.name.replace(/\.[^.]+$/, '') + '.pdf', { type: 'application/pdf' }), onProgress);
  }
  const w = 1280, h = Math.round(1280 * j.height / j.width);
  return { size: { w, h }, srcs: j.slides, sizes: j.slides.map(() => ({ w, h })) };
}

let pdfjs = null;
async function loadPdfJs() {
  if (!pdfjs) {
    pdfjs = await import('../vendor/pdfjs/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
  }
  return pdfjs;
}

export async function slidesFromPdf(file, onProgress = () => {}) {
  const lib = await loadPdfJs();
  const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  const first = (await doc.getPage(1)).getViewport({ scale: 1 });
  // tamanho da página em px de mundo (pt → px)
  const size = { w: Math.round(first.width * 96 / 72), h: Math.round(first.height * 96 / 72) };
  const srcs = [], sizes = [];
  for (let i = 1; i <= doc.numPages; i++) {
    onProgress(`Lendo página ${i} de ${doc.numPages}…`);
    const page = await doc.getPage(i);
    const vp1 = page.getViewport({ scale: 1 });
    sizes.push({ w: vp1.width * 96 / 72, h: vp1.height * 96 / 72 });
    const scale = Math.min(3, 1800 / Math.max(vp1.width, vp1.height));
    const vp = page.getViewport({ scale });
    const c = document.createElement('canvas');
    c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    // intent 'print': não depende de requestAnimationFrame (funciona com a janela minimizada)
    await page.render({ canvasContext: ctx, viewport: vp, intent: 'print' }).promise;
    const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.9));
    srcs.push(await uploadAsset(blob));
  }
  return { size, srcs, sizes };
}

export async function slidesFromFile(file, onProgress) {
  if (isPptx(file)) return slidesFromPptx(file, onProgress);
  if (isPdf(file)) return slidesFromPdf(file, onProgress);
  throw new Error('Formato não suportado: ' + file.name);
}

// itens de imagem travados, um por página, a partir da página `start`
// encaixa cada slide na página sem distorcer (proporção mantida, centralizado)
export function slideItems(layout, srcs, start = 0, sizes = []) {
  return srcs.map((src, k) => {
    const r = pageRect(layout, start + k), s = sizes[k];
    let w = r.w, h = r.h;
    if (s && s.w > 0 && s.h > 0) { const f = Math.min(r.w / s.w, r.h / s.h); w = s.w * f; h = s.h * f; }
    return { id: newId(), type: 'image', locked: true, x: r.x + (r.w - w) / 2, y: r.y + (r.h - h) / 2, w, h, src };
  });
}

// quadro novo a partir de um arquivo de slides/PDF
export async function boardFromSlides(file, onProgress) {
  const { size, srcs, sizes } = await slidesFromFile(file, onProgress);
  if (!srcs.length) throw new Error('Nenhuma página encontrada em ' + file.name);
  const layout = makeLayout('custom', srcs.length, size);
  return {
    version: 2,
    title: file.name.replace(/\.[^.]+$/, ''),
    background: { color: '#ffffff', pattern: 'none' },
    layout,
    view: null,
    items: slideItems(layout, srcs, 0, sizes),
  };
}
