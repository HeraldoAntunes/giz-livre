// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Barras móveis: soltas por padrão (1.2.2), cada uma arrasta pela alça ⠿ e os botões continuam funcionando.
// O cadeado trava tudo no lugar (barras e painéis flutuantes) e a escolha fica guardada.
// A posição fica guardada por barra como fração do espaço livre da janela (acompanha mudança de tamanho/projetor).
import { ICON } from './icons.js';
import { toast } from './ui.js';

const KEY = 'lousa.bars', KEY_TRAVA = 'lousa.barsTravadas';
// barras que podem mudar de lugar (a da seleção acompanha o que está selecionado, fica fora)
const BARS = { title: '.bar.top-left', ink: '#inkbar', menu: '.bar.top-right', create: '#createbar', zoom: '.bar.zoom', pages: '#pagebar', teach: '#teachbar' };
let pos = load(), unlocked = true;

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
  try { localStorage.setItem(KEY_TRAVA, open ? '0' : '1'); } catch {}
  document.getElementById('board').classList.toggle('bars-free', open);
  document.body.classList.toggle('barras-travadas', !open);   // os painéis flutuantes (relógio, cronômetro…) também travam
  const btn = document.getElementById('bLock');
  btn.innerHTML = open ? ICON.unlock : ICON.lock;
  btn.classList.toggle('on', !open);
  btn.title = open ? 'Barras soltas (arraste pela alça ⠿). Toque para travar tudo no lugar' : 'Tudo travado. Toque para soltar as barras e os painéis';
}
export const barsUnlocked = () => unlocked;
export function resetBars() { pos = {}; save(); placeAll(); }
export function resetBar(k) { if (pos[k]) { delete pos[k]; save(); } place(k); }

function drag(k, b) {
  b.addEventListener('pointerdown', e => {
    // arrasta pela alça (o ::before da barra) ou pelo fundo da barra; os botões continuam clicáveis
    if (!unlocked || e.target !== b || e.button > 0) return;
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
}

export function initBars() {
  for (const k in BARS) { const b = el(k); if (b) drag(k, b); }
  document.getElementById('bLock').onclick = () => {
    setLock(!unlocked);
    toast(unlocked ? 'Barras soltas: arraste pela alça ⠿. Para voltar ao lugar de fábrica: ⋯ → Layout padrão' : 'Barras e painéis travados no lugar');
  };
  let travadas = false;
  try { travadas = localStorage.getItem(KEY_TRAVA) === '1'; } catch {}
  setLock(!travadas);
  addEventListener('resize', placeAll);
  // barras que aparecem/somem (páginas) ou mudam de largura precisam ser recolocadas
  const ro = new ResizeObserver(placeAll);
  for (const k in BARS) { const b = el(k); if (b) ro.observe(b); }
  placeAll();
}
