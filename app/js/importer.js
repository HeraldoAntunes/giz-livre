// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Importação de apresentações (.pptx/.odp, via PowerPoint do Windows ou LibreOffice no servidor) e PDF (pdf.js) como
// páginas com o slide travado no fundo. Antes de inserir, o professor escolhe as páginas numa grade de miniaturas.
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

export const isPptx = f => /\.(pptx?|ppsx?|pps|potx|odp|otp|key)$/i.test(f.name);
export const isPdf = f => /\.pdf$/i.test(f.name) || f.type === 'application/pdf';

// devolve { size: {w,h}, srcs: [url, ...] }
export async function slidesFromPptx(file, onProgress = () => {}) {
  onProgress('Convertendo os slides da apresentação…');
  const r = await wfetch('/api/pptx', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-Nome-Arquivo': encodeURIComponent(file.name) }, body: file });
  const j = await r.json();
  if (!r.ok) throw new Error(j.erro || 'Falha ao converter a apresentação');
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

const escHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// grade de miniaturas para escolher as páginas/slides (todas marcadas); devolve os índices escolhidos ou null
export function escolherPaginas(srcs, nome) {
  if (srcs.length <= 1) return Promise.resolve(srcs.map((_, i) => i));
  return new Promise(res => {
    const d = document.createElement('dialog');
    d.className = 'pgpick';
    d.innerHTML = `<h3>Quais páginas inserir?</h3>
      <p class="pgp-sub">${escHtml(nome)}: ${srcs.length} páginas. Toque numa miniatura para marcar ou desmarcar.</p>
      <div class="pgp-acoes"><button class="btn" data-a="todas">Marcar todas</button><button class="btn" data-a="nenhuma">Desmarcar todas</button></div>
      <div class="pgp-grade">${srcs.map((s, i) => `<label class="pgp-item"><input type="checkbox" checked data-i="${i}"><img src="${s}" loading="lazy" alt="Página ${i + 1}"><span>${i + 1}</span></label>`).join('')}</div>
      <div class="acts"><button class="btn" data-a="x">Cancelar</button><button class="btn primary" data-a="ok"></button></div>`;
    document.body.appendChild(d);
    const cks = [...d.querySelectorAll('[data-i]')], ok = d.querySelector('[data-a="ok"]');
    const conta = () => {
      const n = cks.filter(c => c.checked).length;
      ok.textContent = n === srcs.length ? `Inserir todas (${n})` : `Inserir ${n} ${n === 1 ? 'página' : 'páginas'}`;
      ok.disabled = !n;
    };
    cks.forEach(c => c.onchange = conta); conta();
    d.querySelector('[data-a="todas"]').onclick = () => { cks.forEach(c => c.checked = true); conta(); };
    d.querySelector('[data-a="nenhuma"]').onclick = () => { cks.forEach(c => c.checked = false); conta(); };
    const fim = v => { d.close(); d.remove(); res(v); };
    d.querySelector('[data-a="x"]').onclick = () => fim(null);
    d.addEventListener('cancel', e => { e.preventDefault(); fim(null); });
    d.addEventListener('keydown', e => e.stopPropagation());
    ok.onclick = () => fim(cks.filter(c => c.checked).map(c => +c.dataset.i));
    d.showModal();
  });
}

// lê o arquivo e deixa o professor escolher as páginas; null = cancelou
export async function paginasEscolhidas(file, onProgress) {
  const r = await slidesFromFile(file, onProgress);
  if (!r.srcs.length) throw new Error('Nenhuma página encontrada em ' + file.name);
  const idx = await escolherPaginas(r.srcs, file.name);
  if (!idx) return null;
  return { size: r.size, srcs: idx.map(i => r.srcs[i]), sizes: idx.map(i => r.sizes[i]) };
}

// quadro novo a partir de um arquivo de slides/PDF
export async function boardFromSlides(file, onProgress) {
  const r = await paginasEscolhidas(file, onProgress);
  if (!r) throw new Error('Importação cancelada.');
  const { size, srcs, sizes } = r;
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
