// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Barras móveis: soltas por padrão (1.2.2), cada uma arrasta pela alça ⠿ e os botões continuam funcionando.
// O cadeado trava tudo no lugar (barras e painéis flutuantes) e a escolha fica guardada.
// A posição fica guardada por barra como fração do espaço livre da janela (acompanha mudança de tamanho/projetor).
import { ICON } from './icons.js';
import { toast } from './ui.js';

const KEY = 'lousa.bars', KEY_TRAVA = 'lousa.barsTravadas';
// barras que podem mudar de lugar (a da seleção acompanha o que está selecionado, fica fora)
const BARS = { title: '.bar.top-left', ink: '#inkbar', menu: '.bar.top-right', create: '#createbar', zoom: '.bar.zoom', pages: '#pagebar', teach: '#teachbar', draw: '#drawbar', rasc: '#rascbar', cena: '#cenabar' };
// barras que podem ser recolhidas uma a uma (ficam só a alça e o botão de abrir)
const RECOLHE = ['ink', 'create', 'zoom', 'pages', 'teach', 'draw', 'rasc'], KEY_MIN = 'lousa.barsMin';
let pos = load(), unlocked = true;

function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(pos)); } catch {} }
const el = k => document.querySelector(BARS[k]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// posição de fábrica da barra de desfazer/menu: no canto de cima à direita; se não couber ao lado da barra das canetas
// (projetor de 1024×768: as duas se sobrepunham e escondiam 6 botões, entre eles as Ferramentas do professor), desce
// para baixo do botão de voltar, à esquerda, e as barras de criar e de desenho descem junto (bateria de 29/10/2026)
let topoCriar = 64;
// a barra das canetas, centrada, não pode encostar na de ferramentas da direita: em tela estreita fica mais justa
function apertaCanetas() {
  const i = el('ink'), t = el('teach');
  if (!i) return;
  i.classList.remove('apertada');
  if (pos.ink) return;
  const larguraFerr = (t && t.offsetWidth) || 110;
  if ((innerWidth - i.offsetWidth) / 2 < 12 + larguraFerr + 8) i.classList.add('apertada');
}
// a barra de ferramentas da direita (centrada na altura) é alta: em tela baixa encostava na de zoom e escondia o próprio
// botão de recolher; sobe o que precisar, sem passar das barras de cima
function encaixaFerramentas() {
  const t = el('teach'), z = el('zoom');
  if (!t || pos.teach) return;
  t.style.top = t.style.transform = t.style.maxHeight = '';
  if (t.hidden || !z || z.hidden) return;
  const rt = t.getBoundingClientRect(), rz = z.getBoundingClientRect();
  if (!rt.height || rt.bottom <= rz.top - 8 || rt.right <= rz.left || rt.left >= rz.right) return;
  let minimo = 8;
  for (const k of ['ink', 'menu']) {
    const r = el(k)?.getBoundingClientRect();
    if (r && r.width && r.right > rt.left && r.left < rt.right) minimo = Math.max(minimo, r.bottom + 8);
  }
  const topo = Math.max(minimo, rz.top - 8 - rt.height);
  t.style.transform = 'none'; t.style.top = Math.round(topo) + 'px';
  // nem no alto ela cabe (projetor de 1280×720): a barra de zoom vai para a esquerda dela, se não bater na das páginas
  if (topo + rt.height <= rz.top - 8 || pos.zoom) return;
  const dir = innerWidth - rt.left + 8, pg = el('pages')?.getBoundingClientRect();
  if (pg && pg.width && rt.left - 8 - rz.width < pg.right + 8) {   // sem lugar para o zoom: a barra encurta e rola
    t.style.maxHeight = Math.max(120, Math.round(rz.top - 8 - topo)) + 'px';
    return;
  }
  z.style.right = Math.round(dir) + 'px';
}
function encaixaMenu() {
  const m = el('menu'), i = el('ink');
  topoCriar = 64;
  if (!m || !i || pos.menu || pos.ink) return m?.classList.remove('desceu');
  m.classList.remove('desceu');
  const rm = m.getBoundingClientRect(), ri = i.getBoundingClientRect();
  if (i.hidden || !ri.width || ri.right + 8 <= rm.left) return;
  m.classList.add('desceu');
  topoCriar = Math.round(m.getBoundingClientRect().bottom + 8);
}
// posição de fábrica da barra de desenho: logo abaixo da barra de criar (ou ao lado, se não couber)
function empilhaDesenho() {
  const d = el('draw'), c = el('create');
  if (!d || !c) return;
  const aperta = (ap, duas) => { c.classList.toggle('apertada', ap); d.classList.toggle('apertada', ap); d.classList.toggle('duas-col', !!duas); };
  if (d.hidden || pos.draw) return aperta(false);
  if (!pos.create) { c.style.top = topoCriar + 'px'; c.style.transform = 'none'; }
  d.style.transform = 'none';
  // 1.4.0: com o botão Captura as duas barras deixaram de caber empilhadas em telas de ~1000 px; antes de pôr a de
  // desenho ao lado (em cima do quadro), tenta com os botões mais baixos e, no notebook, com a
  // barra de desenho em duas colunas
  for (const [ap, duas] of [[false, false], [true, false], [true, true]]) {
    aperta(ap, duas);
    const r = c.getBoundingClientRect();
    if (r.bottom + 8 + d.offsetHeight <= innerHeight - 8) { d.style.left = r.left + 'px'; d.style.top = r.bottom + 8 + 'px'; return; }
  }
  aperta(false);
  const r = c.getBoundingClientRect();
  d.style.left = r.right + 8 + 'px'; d.style.top = r.top + 'px';
}
function place(k) {
  const b = el(k), p = pos[k];
  if (!b) return;
  if (!p) {
    b.classList.remove('moved'); b.style.left = b.style.top = b.style.right = b.style.bottom = b.style.transform = '';
    if (k === 'ink') apertaCanetas();
    if (k === 'menu') encaixaMenu();
    if (k === 'teach') encaixaFerramentas();
    if (k === 'create' || k === 'draw') empilhaDesenho();
    return;
  }
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

function recolhivel(k) {
  const b = el(k);
  if (!b || b.querySelector(':scope > .bar-min')) return;
  let min = [];
  try { min = JSON.parse(localStorage.getItem(KEY_MIN) || '[]'); } catch {}
  const btn = Object.assign(document.createElement('button'), { className: 'ib bar-min' });
  const set = on => {
    b.classList.toggle('recolhida', on);
    btn.innerHTML = on ? ICON.expand || '+' : ICON.collapse;
    btn.title = on ? 'Abrir esta barra' : 'Recolher esta barra';
  };
  btn.onclick = e => {
    e.stopPropagation();
    const on = !b.classList.contains('recolhida');
    set(on);
    let m = []; try { m = JSON.parse(localStorage.getItem(KEY_MIN) || '[]'); } catch {}
    m = on ? [...new Set([...m, k])] : m.filter(x => x !== k);
    try { localStorage.setItem(KEY_MIN, JSON.stringify(m)); } catch {}
    placeAll();
  };
  b.appendChild(btn);
  set(min.includes(k));
}
// a barra do professor é refeita por inteiro; o editor chama isto depois de montar
export function recolhivelDeNovo(k) { recolhivel(k); }

export function initBars() {
  for (const k in BARS) { const b = el(k); if (b) drag(k, b); }
  for (const k of RECOLHE) recolhivel(k);
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
