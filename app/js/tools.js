// Ferramentas de professor que vivem fora do canvas: cronômetro, fórmulas (KaTeX) e reconhecimento de escrita.
import { ICON } from './icons.js';
import { wfetch } from './api.js';

// ---------------- cronômetro / timer ----------------
let timer = null;
export function toggleTimer() {
  if (timer) { timer.el.remove(); clearInterval(timer.iv); timer = null; return; }
  const el = document.createElement('div');
  el.className = 'timerbox';
  el.innerHTML = `<div class="tm-head"><span>Cronômetro</span><button class="ib" data-a="x" title="Fechar">${ICON.close}</button></div>
    <div class="tm-time">05:00</div>
    <div class="tm-row">${[1, 3, 5, 10, 15].map(m => `<button class="btn" data-m="${m}">${m} min</button>`).join('')}</div>
    <div class="tm-row"><button class="btn primary" data-a="go">Iniciar</button><button class="btn" data-a="up">Contar ↑</button><button class="btn" data-a="zero">Zerar</button></div>`;
  document.body.appendChild(el);
  timer = { el, total: 300, left: 300, run: false, up: false, iv: 0 };
  const T = timer, show = () => {
    const s = Math.max(0, Math.round(T.up ? T.left : T.left)), m = Math.floor(s / 60);
    el.querySelector('.tm-time').textContent = `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    el.classList.toggle('end', !T.up && T.left <= 0);
    el.querySelector('[data-a="go"]').textContent = T.run ? 'Pausar' : 'Iniciar';
  };
  const tick = () => {
    if (!T.run) return;
    T.left += T.up ? 1 : -1;
    if (!T.up && T.left <= 0) { T.left = 0; T.run = false; beep(); }
    show();
  };
  T.iv = setInterval(tick, 1000);
  el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { T.up = false; T.total = T.left = +b.dataset.m * 60; T.run = false; show(); });
  el.querySelector('[data-a="go"]').onclick = () => { if (!T.up && T.left <= 0) T.left = T.total; T.run = !T.run; show(); };
  el.querySelector('[data-a="up"]').onclick = () => { T.up = true; T.left = 0; T.run = true; show(); };
  el.querySelector('[data-a="zero"]').onclick = () => { T.run = false; T.left = T.up ? 0 : T.total; show(); };
  el.querySelector('[data-a="x"]').onclick = toggleTimer;
  // arrastar pelo cabeçalho
  const head = el.querySelector('.tm-head');
  head.onpointerdown = e => {
    if (e.target.closest('button')) return;
    const r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    head.setPointerCapture(e.pointerId);
    head.onpointermove = ev => { el.style.left = ev.clientX - dx + 'px'; el.style.top = ev.clientY - dy + 'px'; el.style.right = 'auto'; };
    head.onpointerup = () => { head.onpointermove = null; };
  };
  show();
}
function beep() {
  try {
    const a = new AudioContext();
    [0, 0.35, 0.7].forEach(t => {
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(a.destination);
      g.gain.setValueAtTime(0.25, a.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + t + 0.3);
      o.start(a.currentTime + t); o.stop(a.currentTime + t + 0.3);
    });
  } catch {}
}

// ---------------- fórmulas LaTeX (KaTeX → imagem PNG nítida) ----------------
let katexReady = null, cssEmbedded = null;
function loadKatex() {
  if (!katexReady) katexReady = new Promise((res, rej) => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'vendor/katex/katex.min.css'; document.head.appendChild(l);
    const s = document.createElement('script'); s.src = 'vendor/katex/katex.min.js'; s.onload = () => res(window.katex); s.onerror = rej;
    document.head.appendChild(s);
  });
  return katexReady;
}
// CSS do KaTeX com as fontes embutidas (necessário para desenhar a fórmula numa imagem)
async function embeddedCss() {
  if (cssEmbedded) return cssEmbedded;
  let css = await (await fetch('vendor/katex/katex.min.css')).text();
  const urls = [...new Set(css.match(/fonts\/[A-Za-z0-9_-]+\.woff2/g) || [])];
  for (const u of urls) {
    const b = await (await fetch('vendor/katex/' + u)).blob();
    const d = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
    css = css.split(u).join(d);
  }
  css = css.replace(/url\(fonts\/[^)]+\.(woff|ttf)\)\s*format\("[a-z]+"\),?/g, '');
  return (cssEmbedded = css);
}

// devolve { blob (PNG), w, h } em px de tela no tamanho de fonte `size`
export async function formulaImage(latex, color = '#000000', size = 40) {
  const katex = await loadKatex();
  const html = katex.renderToString(latex, { displayMode: true, throwOnError: true, output: 'html' });
  const box = document.createElement('div');
  box.style.cssText = `position:fixed;left:-10000px;top:0;font-size:${size}px;color:${color};padding:6px 10px;display:inline-block`;
  box.innerHTML = html;
  document.body.appendChild(box);
  await document.fonts.ready;
  const r = box.getBoundingClientRect();
  const w = Math.ceil(r.width), h = Math.ceil(r.height);
  box.remove();
  const css = await embeddedCss();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${size}px;color:${color};padding:6px 10px;display:inline-block"><style>${css} .katex-display{margin:0}</style>${html}</div></foreignObject></svg>`;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const k = 3, c = document.createElement('canvas');
  c.width = w * k; c.height = h * k;
  const g = c.getContext('2d'); g.scale(k, k); g.drawImage(img, 0, 0);
  const blob = await new Promise(res => c.toBlob(res, 'image/png'));
  return { blob, w, h };
}

export async function validateLatex(latex) {
  const katex = await loadKatex();
  try { katex.renderToString(latex, { throwOnError: true }); return null; } catch (e) { return e.message.replace(/^KaTeX parse error: /, ''); }
}
export async function previewLatex(el, latex) {
  const katex = await loadKatex();
  try { katex.render(latex || '\\;', el, { displayMode: true, throwOnError: false }); } catch {}
}

// ---------------- escrita à mão → texto (reconhecedor do Windows, offline) ----------------
export async function recognizeInk(strokes) {
  // strokes: [[x,y,x,y,...], ...] em px de tela (o reconhecedor espera a escala de quem escreveu)
  const r = await wfetch('/api/ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ strokes }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.erro || 'Falha no reconhecimento');
  return j.palavras || [];
}
