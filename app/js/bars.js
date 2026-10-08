// Barras móveis: o cadeado destrava, o professor arrasta cada barra para onde quiser e trava de novo.
// A posição fica guardada por barra como fração do espaço livre da janela (acompanha mudança de tamanho/projetor).
import { ICON } from './icons.js';
import { toast } from './ui.js';

const KEY = 'lousa.bars';
// barras que podem mudar de lugar (a da seleção acompanha o que está selecionado, fica fora)
const BARS = { title: '.bar.top-left', ink: '#inkbar', menu: '.bar.top-right', create: '#createbar', zoom: '.bar.zoom', pages: '#pagebar' };
let pos = load(), unlocked = false, hint = null;

function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(pos)); } catch {} }
const el = k => document.querySelector(BARS[k]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function place(k) {
  const b = el(k), p = pos[k];
  if (!b) return;
  if (!p) { b.classList.remove('moved'); b.style.left = b.style.top = b.style.right = b.style.bottom = b.style.transform = ''; return; }
  b.classList.add('moved');
  b.style.right = b.style.bottom = 'auto'; b.style.transform = 'none';
  const w = b.offsetWidth, h = b.offsetHeight;
  b.style.left = Math.round(clamp(p.x, 0, 1) * Math.max(0, innerWidth - w)) + 'px';
  b.style.top = Math.round(clamp(p.y, 0, 1) * Math.max(0, innerHeight - h)) + 'px';
}
export function placeAll() { for (const k in BARS) place(k); }

function setLock(open) {
  unlocked = open;
  document.getElementById('board').classList.toggle('bars-free', open);
  const btn = document.getElementById('bLock');
  btn.innerHTML = open ? ICON.unlock : ICON.lock;
  btn.classList.toggle('on', open);
  btn.title = open ? 'Travar as barras no lugar' : 'Destravar as barras para mudar de lugar';
  if (open && !hint) {
    hint = document.createElement('div');
    hint.className = 'bars-hint';
    hint.innerHTML = 'Arraste as barras para onde quiser. <button class="toast-btn" data-r>Voltar ao padrão</button><button class="toast-btn" data-l>Travar</button>';
    hint.querySelector('[data-r]').onclick = () => { pos = {}; save(); placeAll(); toast('Barras de volta ao lugar padrão'); };
    hint.querySelector('[data-l]').onclick = () => setLock(false);
    document.getElementById('board').appendChild(hint);
  } else if (!open && hint) { hint.remove(); hint = null; }
}
export const barsUnlocked = () => unlocked;
export function lockBars() { if (unlocked) setLock(false); }
export function resetBars() { pos = {}; save(); placeAll(); }

function drag(k, b) {
  b.addEventListener('pointerdown', e => {
    if (!unlocked || e.target.closest('#bLock') || e.button > 0) return;
    e.preventDefault(); e.stopPropagation();
    const r = b.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    b.setPointerCapture(e.pointerId);
    b.classList.add('dragging');
    const move = ev => {
      const w = b.offsetWidth, h = b.offsetHeight;
      const x = clamp(ev.clientX - dx, 0, innerWidth - w), y = clamp(ev.clientY - dy, 0, innerHeight - h);
      pos[k] = { x: innerWidth > w ? x / (innerWidth - w) : 0, y: innerHeight > h ? y / (innerHeight - h) : 0 };
      place(k);
    };
    const up = () => { b.classList.remove('dragging'); b.removeEventListener('pointermove', move); b.removeEventListener('pointerup', up); b.removeEventListener('pointercancel', up); save(); };
    b.addEventListener('pointermove', move); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  }, true);
  // com as barras destravadas, os botões não disparam (o toque é para arrastar)
  b.addEventListener('click', e => { if (unlocked && !e.target.closest('#bLock')) { e.preventDefault(); e.stopPropagation(); } }, true);
}

export function initBars() {
  for (const k in BARS) { const b = el(k); if (b) drag(k, b); }
  document.getElementById('bLock').onclick = () => setLock(!unlocked);
  setLock(false);
  addEventListener('resize', placeAll);
  // barras que aparecem/somem (páginas) ou mudam de largura precisam ser recolocadas
  const ro = new ResizeObserver(placeAll);
  for (const k in BARS) { const b = el(k); if (b) ro.observe(b); }
  placeAll();
}
