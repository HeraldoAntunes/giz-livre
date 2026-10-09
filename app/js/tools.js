// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Ferramentas de professor que vivem fora do canvas: cronômetro, fórmulas (KaTeX) e reconhecimento de escrita.
import { ICON } from './icons.js';
import { wfetch } from './api.js';

// ---------------- cronômetro / timer ----------------
let timer = null;
export const timerOpen = () => !!timer;
// "7", "7,5" (minutos), "7:30", "1:05:00" → segundos
export function parseTempo(s) {
  s = String(s).trim().replace(',', '.');
  if (!s) return null;
  if (s.includes(':')) {
    const p = s.split(':').map(Number);
    if (p.some(n => !isFinite(n) || n < 0)) return null;
    return Math.round(p.reduce((a, n) => a * 60 + n, 0));
  }
  const m = Number(s);
  return isFinite(m) && m > 0 ? Math.round(m * 60) : null;
}
export function toggleTimer() {
  if (timer) { timer.el.remove(); clearInterval(timer.iv); timer = null; return; }
  const el = document.createElement('div');
  el.className = 'timerbox';
  el.innerHTML = `<div class="tm-head"><span>Cronômetro</span><button class="ib" data-a="x" title="Fechar">${ICON.close}</button></div>
    <div class="tm-time">05:00</div>
    <div class="tm-row">${[1, 3, 5, 10, 15].map(m => `<button class="btn" data-m="${m}">${m} min</button>`).join('')}</div>
    <div class="tm-row"><input class="tm-in" placeholder="Digite: 7 ou 7:30" title="Minutos (7 ou 7,5) ou minutos:segundos (7:30)"><button class="btn" data-a="set">Definir</button></div>
    <div class="tm-msg" hidden>Use minutos (7 ou 7,5) ou minutos:segundos (7:30).</div>
    <div class="tm-row"><button class="btn primary" data-a="go">Iniciar</button><button class="btn" data-a="up" title="Cronômetro comum: conta o tempo a partir de zero">Contar para cima</button><button class="btn" data-a="zero">Zerar</button></div>`;
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
  const inp = el.querySelector('.tm-in');
  const setTempo = () => {
    const s = parseTempo(inp.value);
    const msg = el.querySelector('.tm-msg');
    if (!s) { inp.classList.add('err'); msg.hidden = false; return; }
    inp.classList.remove('err'); msg.hidden = true; inp.value = '';
    T.up = false; T.total = T.left = Math.min(s, 99 * 3600); T.run = false; show();
  };
  el.querySelector('[data-a="set"]').onclick = setTempo;
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') setTempo(); });
  el.querySelector('.tm-time').ondblclick = () => inp.focus();
  draggable(el, 'lousa.timerPos');
  show();
}

// arrastar uma caixa flutuante pelo cabeçalho; a posição fica guardada (chave no localStorage)
function draggable(el, key) {
  const head = el.querySelector('.tm-head');
  const fit = (x, y) => [Math.max(0, Math.min(innerWidth - el.offsetWidth, x)), Math.max(0, Math.min(innerHeight - el.offsetHeight, y))];
  const place = (x, y) => { [x, y] = fit(x, y); el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto'; };
  try { const p = JSON.parse(localStorage.getItem(key) || 'null'); if (p) place(p.x, p.y); } catch {}
  if (!el.style.left) {
    // sem posição guardada: não cobre a barra do professor quando ela está aberta à direita
    const tb = document.getElementById('teachbar');
    if (tb && !tb.hidden && !el.classList.contains('clockbox')) { const r = tb.getBoundingClientRect(); place(r.left - el.offsetWidth - 12, r.top); }
  }
  head.onpointerdown = e => {
    if (e.target.closest('button')) return;
    const r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    head.setPointerCapture(e.pointerId);
    head.onpointermove = ev => place(ev.clientX - dx, ev.clientY - dy);
    head.onpointerup = () => {
      head.onpointermove = null;
      const b = el.getBoundingClientRect();
      try { localStorage.setItem(key, JSON.stringify({ x: b.left, y: b.top })); } catch {}
    };
  };
}

// fecha cronômetro e relógio (ao sair do quadro)
export function closeFloating() { if (timer) toggleTimer(); if (clock) toggleClock(); }

// ---------------- relógio (hora do sistema) ----------------
let clock = null;
export const clockOpen = () => !!clock;
export function toggleClock() {
  if (clock) { clock.el.remove(); clearInterval(clock.iv); clock = null; return; }
  const el = document.createElement('div');
  el.className = 'timerbox clockbox';
  el.innerHTML = `<div class="tm-head"><span>Relógio</span><span><button class="ck-sec on" data-a="s" title="Mostrar ou esconder os segundos">segundos</button><button class="ck-sec" data-a="cal" title="Mostrar ou esconder o calendário do mês">calendário</button><button class="ib" data-a="x" title="Fechar">${ICON.close}</button></span></div>
    <div class="tm-time"></div><div class="ck-date"></div><div class="ck-cal" hidden></div>`;
  document.body.appendChild(el);
  clock = { el, sec: true, iv: 0 };
  const C = clock, p = n => String(n).padStart(2, '0');
  const show = () => {
    const d = new Date();
    el.querySelector('.tm-time').textContent = `${p(d.getHours())}:${p(d.getMinutes())}${C.sec ? ':' + p(d.getSeconds()) : ''}`;
    const dt = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    el.querySelector('.ck-date').textContent = dt.charAt(0).toUpperCase() + dt.slice(1);   // "Sexta-feira, 9 de outubro"
  };
  C.iv = setInterval(show, 500);
  el.querySelector('[data-a="x"]').onclick = toggleClock;
  const sec = el.querySelector('[data-a="s"]');
  const alterna = () => { C.sec = !C.sec; sec.classList.toggle('on', C.sec); show(); };
  sec.onclick = alterna;
  el.querySelector('.tm-time').onclick = alterna;
  // calendário do mês (hoje marcado; ‹ › trocam o mês)
  const calBtn = el.querySelector('[data-a="cal"]'), cal = el.querySelector('.ck-cal');
  let mes = null;
  const desenha = () => {
    const hoje = new Date(), a = mes.getFullYear(), m = mes.getMonth();
    const ini = new Date(a, m, 1).getDay(), dias = new Date(a, m + 1, 0).getDate();
    const nome = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    let cel = '';
    for (let i = 0; i < ini; i++) cel += '<span></span>';
    for (let d = 1; d <= dias; d++) {
      const eHoje = d === hoje.getDate() && m === hoje.getMonth() && a === hoje.getFullYear();
      cel += `<span class="${eHoje ? 'hoje' : ''}${(ini + d - 1) % 7 === 0 ? ' dom' : ''}">${d}</span>`;
    }
    cal.innerHTML = `<div class="ck-mes"><button class="ib" data-m="-1" title="Mês anterior">‹</button><b>${nome.charAt(0).toUpperCase() + nome.slice(1)}</b><button class="ib" data-m="1" title="Próximo mês">›</button></div>
      <div class="ck-grade">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((x, i) => `<i${i === 0 ? ' class="dom"' : ''}>${x}</i>`).join('')}${cel}</div>`;
    cal.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mes = new Date(a, m + +b.dataset.m, 1); desenha(); });
  };
  calBtn.onclick = () => {
    cal.hidden = !cal.hidden; calBtn.classList.toggle('on', !cal.hidden);
    if (!cal.hidden) { const h = new Date(); mes = new Date(h.getFullYear(), h.getMonth(), 1); desenha(); }
  };
  draggable(el, 'lousa.clockPos');
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
