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

const tempo = s => s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;

// mostra o andamento da conversão (o servidor conta os slides prontos) com um botão de cancelar
function acompanharConversao(onProgress) {
  let vivo = true;
  const cancelar = { label: 'Cancelar', fn: () => wfetch('/api/pptx/cancelar', { method: 'POST' }).catch(() => {}) };
  (async () => {
    while (vivo) {
      await new Promise(r => setTimeout(r, 1000));
      if (!vivo) break;
      try {
        const p = await (await fetch('/api/pptx/progresso')).json();
        if (!vivo || !p.ativa) continue;
        const de = p.total ? ` de ${p.total}` : '';
        onProgress(p.por === 'powerpoint' && p.feitos != null
          ? `Convertendo os slides: ${p.feitos}${de} (${tempo(p.segundos)})…`
          : `Convertendo pelo LibreOffice${p.total ? ` (${p.total} slides)` : ''}: ${tempo(p.segundos)}. Decks grandes levam alguns minutos; um PDF do deck abre mais rápido.`,
        cancelar);
      } catch { /* o andamento é só informativo */ }
    }
  })();
  return () => { vivo = false; };
}

// slides ocultos e com vídeo, em índices a partir de 0 da lista de imagens. No PDF do LibreOffice os ocultos podem não
// vir: se faltarem exatamente eles, os vídeos são recontados sem os ocultos; se a conta não fechar, não marca nada.
function marcasDosSlides(info, n) {
  const vazio = { ocultos: [], videos: [] };
  if (!info?.total) return vazio;
  const ocultos = new Set(info.ocultos || []);
  if (n === info.total) return { ocultos: [...ocultos].map(k => k - 1), videos: (info.videos || []).map(k => k - 1) };
  if (n !== info.total - ocultos.size) return vazio;
  const pos = new Map(); let j = 0;
  for (let k = 1; k <= info.total; k++) if (!ocultos.has(k)) pos.set(k, j++);
  return { ocultos: [], videos: (info.videos || []).filter(k => pos.has(k)).map(k => pos.get(k)) };
}

// devolve { size: {w,h}, srcs: [url, ...], sizes, ocultos: [i], videos: [i] }
export async function slidesFromPptx(file, onProgress = () => {}) {
  onProgress('Convertendo os slides da apresentação…');
  const parar = acompanharConversao(onProgress);
  let r, j;
  try {
    r = await wfetch('/api/pptx', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-Nome-Arquivo': encodeURIComponent(file.name) }, body: file });
    j = await r.json();
  } finally { parar(); }
  if (!r.ok) throw new Error(j.erro || 'Falha ao converter a apresentação');
  if (j.pdf) {
    // sem PowerPoint (Linux, Mac ou Windows sem Office): o LibreOffice converteu para PDF, que o pdf.js lê
    onProgress('Lendo os slides convertidos pelo LibreOffice…');
    const bytes = Uint8Array.from(atob(j.pdf), c => c.charCodeAt(0));
    const p = await slidesFromPdf(new File([bytes], file.name.replace(/\.[^.]+$/, '') + '.pdf', { type: 'application/pdf' }), onProgress);
    return { ...p, ...marcasDosSlides(j.info, p.srcs.length) };
  }
  const w = 1280, h = Math.round(1280 * j.height / j.width);
  return { size: { w, h }, srcs: j.slides, sizes: j.slides.map(() => ({ w, h })), ...marcasDosSlides(j.info, j.slides.length) };
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
// videos: índices (em srcs) dos slides que tinham vídeo; cada um ganha uma nota no canto, para não haver surpresa em aula
export function slideItems(layout, srcs, start = 0, sizes = [], videos = []) {
  const imgs = srcs.map((src, k) => {
    const r = pageRect(layout, start + k), s = sizes[k];
    let w = r.w, h = r.h;
    if (s && s.w > 0 && s.h > 0) { const f = Math.min(r.w / s.w, r.h / s.h); w = s.w * f; h = s.h * f; }
    return { id: newId(), type: 'image', locked: true, x: r.x + (r.w - w) / 2, y: r.y + (r.h - h) / 2, w, h, src };
  });
  const notas = videos.filter(k => k >= 0 && k < srcs.length).map(k => {
    const r = pageRect(layout, start + k), w = 230;
    return { id: newId(), type: 'note', x: r.x + r.w - w - 16, y: r.y + 16, w, h: 150, color: '#ffd3a6',
      text: '▶ Este slide tinha um vídeo. Aqui ele aparece como imagem parada; para tocar, use o PowerPoint ou a Captura.' };
  });
  return [...imgs, ...notas];
}

const escHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// grade de miniaturas para escolher as páginas/slides; devolve os índices escolhidos ou null.
// Slides ocultos vêm desmarcados (como na apresentação), com a marca "oculto"; slides com vídeo levam a marca "vídeo".
export function escolherPaginas(srcs, nome, { ocultos = [], videos = [] } = {}) {
  const oc = new Set(ocultos), vd = new Set(videos);
  if (srcs.length <= 1 && !oc.size) return Promise.resolve(srcs.map((_, i) => i));
  const avisos = [
    oc.size ? `${oc.size} ${oc.size === 1 ? 'slide oculto ficou desmarcado' : 'slides ocultos ficaram desmarcados'} (toque para incluir)` : '',
    vd.size ? `${vd.size} ${vd.size === 1 ? 'slide tinha vídeo' : 'slides tinham vídeo'}: entra${vd.size === 1 ? '' : 'm'} como imagem parada, com uma nota` : '',
  ].filter(Boolean).join('. ');
  return new Promise(res => {
    const d = document.createElement('dialog');
    d.className = 'pgpick';
    d.innerHTML = `<h3>Quais páginas inserir?</h3>
      <p class="pgp-sub">${escHtml(nome)}: ${srcs.length} páginas. Toque numa miniatura para marcar ou desmarcar.${avisos ? `<br><b>${escHtml(avisos)}.</b>` : ''}</p>
      <div class="pgp-acoes"><button class="btn" data-a="todas">Marcar todas</button><button class="btn" data-a="nenhuma">Desmarcar todas</button></div>
      <div class="pgp-grade">${srcs.map((s, i) => `<label class="pgp-item${oc.has(i) ? ' pgp-oculto' : ''}"><input type="checkbox" ${oc.has(i) ? '' : 'checked'} data-i="${i}"><img src="${s}" loading="lazy" alt="Página ${i + 1}"><span>${i + 1}${oc.has(i) ? ' · oculto' : ''}${vd.has(i) ? ' · ▶ vídeo' : ''}</span></label>`).join('')}</div>
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
  const idx = await escolherPaginas(r.srcs, file.name, r);
  if (!idx) return null;
  const vd = new Set(r.videos || []);
  return { size: r.size, srcs: idx.map(i => r.srcs[i]), sizes: idx.map(i => r.sizes[i]),
    videos: idx.map((i, k) => vd.has(i) ? k : -1).filter(k => k >= 0) };
}

// quadro novo a partir de um arquivo de slides/PDF
export async function boardFromSlides(file, onProgress) {
  const r = await paginasEscolhidas(file, onProgress);
  if (!r) throw new Error('Importação cancelada.');
  const { size, srcs, sizes, videos } = r;
  const layout = makeLayout('custom', srcs.length, size);
  return {
    version: 2,
    title: file.name.replace(/\.[^.]+$/, ''),
    background: { color: '#ffffff', pattern: 'none' },
    layout,
    view: null,
    items: slideItems(layout, srcs, 0, sizes, videos),
  };
}
