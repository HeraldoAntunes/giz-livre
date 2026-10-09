// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Editor do quadro: ferramentas, entrada (caneta/toque/mouse), seleção, régua, histórico e salvamento
//
// Índice (procure pelos marcadores "// ===== <seção> ====="):
//   inicialização · desenho (camadas estática e de sobreposição) · régua · barra de ferramentas ·
//   histórico e salvamento (autosave, token, gravação de emergência) · vista (zoom/pan) ·
//   entrada do ponteiro (caneta/toque/mouse: onDown/onMove/onUp) · embelezar escrita · seleção ·
//   texto e notas · imagens e colar · teclado · menu / exportação · páginas (caderno A4 / slides) ·
//   ferramentas de professor (transferidor, compasso, cortina, holofote, lupa, fórmula, biblioteca, escrita→texto) ·
//   plotar função
//
// Estado principal: S = { id, board, items, view }. Os itens são imutáveis: toda edição cria objeto novo e passa
// por commit(items, layout?), que alimenta o desfazer. `action` guarda o gesto em andamento (draw, erase, lasso…).
// window.__lousa expõe S/pending/action só para testes automatizados.
import * as R from './render.js';
import { saveBoard, saveThumb, newId, download, safeName, readImageFile, tokenHeader, serverInfo } from './api.js';
import { ICON, penIcon } from './icons.js';
import { fillIcons, toast, showPop, hidePop, confirmBox, choiceBox, infoBox, aboutBox, esc } from './ui.js';
import { VERSION } from './version.js';
import { DEFAULT_TABLET, openTabletSettings } from './tablet.js';
import { createStabilizer, smoothPts, resampleN } from './stabilizer.js';
import { beautify, canBeautify, restoreOriginal, box as ptsBox } from './beautify.js';
import * as PAPER from './paper.js';
const { PAPERS, ANCHORED, SIZE: PAPER_SIZE, CELL } = PAPER;
import { compile as compileFn, plotStrokes, fitFrame, faixaY, axesStrokes, animatedCurve, drawPolylines, fmtNum } from './plot.js';
import { AREAS as FN_AREAS, modelo as fnModelo, valoresPadrao } from './fnmodels.js';
import * as PG from './pages.js';
import { slidesFromFile, slideItems, uploadAsset } from './importer.js';
import { toggleTimer, timerOpen, toggleClock, clockOpen, closeFloating, formulaImage, validateLatex, previewLatex, recognizeInk } from './tools.js';
import { LIBRARY, svgDataUrl } from './library.js';
import { initBars, placeAll as placeBars, lockBars, resetBars, resetBar } from './bars.js';
import { GROUPS as SHAPE_GROUPS, ALL_SHAPES, shapeSvg, shapeById } from './shapelib.js';
import { gruposVisiveis, areasVisiveis, escolherDisciplinas, abasOcultas } from './disciplinas.js';

const PALETTE = ['#000000', '#7a7574', '#ffffff', '#e81224', '#f7630c', '#ffb900', '#fff100', '#8cbd18',
  '#16c60c', '#0b6a0b', '#00b7c3', '#0078d4', '#1b3a8c', '#886ce4', '#e3008c', '#8e562e'];
const HL_PALETTE = ['#fff100', '#ffb900', '#8cbd18', '#16c60c', '#00b7c3', '#4cc2ff', '#ff8cd9', '#f7630c'];
const NOTE_COLORS = ['#fff7a8', '#ffd3a6', '#ffc8dd', '#d9c9ff', '#c4e3ff', '#c9f2c7'];
const BG_COLORS = ['#ffffff', '#f5f5f5', '#fdf6e3', '#e9f3ec', '#20402f', '#2d2d30', '#14213d', '#000000'];
const PEN_WIDTHS = [1.5, 3, 5, 8, 12];
// nomes das cores (dica e leitor de tela)
const COR_NOME = {
  '#000000': 'Preto', '#7a7574': 'Cinza', '#ffffff': 'Branco', '#e81224': 'Vermelho', '#f7630c': 'Laranja', '#ffb900': 'Âmbar',
  '#fff100': 'Amarelo', '#8cbd18': 'Verde-limão', '#16c60c': 'Verde', '#0b6a0b': 'Verde-escuro', '#00b7c3': 'Turquesa',
  '#0078d4': 'Azul', '#1b3a8c': 'Azul-marinho', '#886ce4': 'Roxo', '#e3008c': 'Magenta', '#8e562e': 'Marrom',
  '#4cc2ff': 'Azul-claro', '#ff8cd9': 'Rosa', '#f5f5f5': 'Cinza-claro', '#fdf6e3': 'Creme', '#e9f3ec': 'Verde-claro',
  '#20402f': 'Lousa verde', '#2d2d30': 'Grafite', '#14213d': 'Azul-noite', '#fff7a8': 'Amarelo', '#ffd3a6': 'Pêssego',
  '#ffc8dd': 'Rosa', '#d9c9ff': 'Lilás', '#c4e3ff': 'Azul-claro', '#c9f2c7': 'Verde-claro',
};
const corNome = c => COR_NOME[String(c).toLowerCase()] || c;
const HL_WIDTHS = [12, 20, 30, 44];
const DEFAULT_TOOLS = {
  pen0: { color: '#000000', width: 3, arrow: false },
  pen1: { color: '#e81224', width: 3, arrow: false },
  pen2: { color: '#0078d4', width: 3, arrow: false },
  pen3: { color: '#16c60c', width: 3, arrow: false },
  highlighter: { color: '#fff100', width: 20 },
};
const RULER_LEN = 1000, RULER_TH = 96; // px de tela

let cfg = loadCfg();
let S = null;            // {id, board, items, view}
let tool = cfg.tool || 'pen0';
let undoStack = [], redoStack = [];
let sel = new Set();
let action = null;
let ruler = null;        // {x, y, angle} — centro em coordenadas de mundo, ângulo em graus
let laser = [];          // [{x,y,t}]
let editing = null;      // {id, isNew}
let clipboard = null;
let shapeKind = 'rect';
let penSeen = false, spaceDown = false;
const pointers = new Map();
let cv, ctx, ov, octx, W = 0, H = 0, dpr = 1;
let raf = 0, needStatic = false, needOverlay = false;
let saveTimer = 0, saving = false, savePending = false;
let dirtyVer = 0, savedVer = 0, retryTimer = 0, thumbTimer = 0;
const failedSnaps = new Map(); // última edição não confirmada de CADA quadro
let onBack = () => {};
let hover = null;        // posição do ponteiro (tela) para o cursor da borracha
let pendingBeauty = [], beautyTimer = 0, beautyAnim = null; // embelezar escrita

function loadCfg() {
  try {
    const c = JSON.parse(localStorage.getItem('lousa.cfg') || '{}');
    const tablet = { ...DEFAULT_TABLET, ...(c.tablet || {}) };
    // 1.0.2: embelezar automático volta a desligado uma vez (o professor liga se quiser; o botão da seleção continua)
    if ((c.migr || 0) < 2) tablet.beautify = false;
    return { ...c, tools: { ...structuredClone(DEFAULT_TOOLS), ...(c.tools || {}) }, tool: c.tool, inkShape: !!c.inkShape,
      shapeFill: !!c.shapeFill, tablet, migr: 2 };
  } catch { return { tools: structuredClone(DEFAULT_TOOLS), inkShape: false, tablet: { ...DEFAULT_TABLET } }; }
}
function saveCfg() {
  try { localStorage.setItem('lousa.cfg', JSON.stringify({ ...cfg, tool })); } catch {}
}

const $ = id => document.getElementById(id);
const toWorld = (sx, sy) => ({ x: (sx - S.view.x) / S.view.zoom, y: (sy - S.view.y) / S.view.zoom });
const toScreen = (wx, wy) => ({ x: wx * S.view.zoom + S.view.x, y: wy * S.view.zoom + S.view.y });
const byId = id => S.items.find(i => i.id === id);
const isPen = t => t.startsWith('pen');

// ================= inicialização =================
export function initEditor() {
  cv = $('cv'); ctx = cv.getContext('2d');
  ov = $('ov'); octx = ov.getContext('2d', { desynchronized: true }); // baixa latência para o traço ao vivo
  R.setImageLoadHandler(() => requestRender());
  addEventListener('resize', resize);

  ov.addEventListener('pointerdown', onDown);
  ov.addEventListener('pointermove', onMove);
  ov.addEventListener('pointerup', onUp);
  ov.addEventListener('pointercancel', onUp);
  ov.addEventListener('pointerleave', () => { hover = null; requestRender(false); });
  ov.addEventListener('wheel', onWheel, { passive: false });
  ov.addEventListener('contextmenu', e => e.preventDefault());
  ov.addEventListener('dblclick', onDblClick);

  document.querySelectorAll('#inkbar [data-tool]').forEach(b => b.addEventListener('click', () => toolClick(b)));
  $('tRuler').onclick = toggleRuler;
  $('tInkShape').onclick = () => { cfg.inkShape = !cfg.inkShape; saveCfg(); syncToolbar(); toast(cfg.inkShape ? 'Tinta vira forma: ligado' : 'Tinta vira forma: desligado (desenho livre)'); };
  $('tBeautify').onclick = () => beautyPop($('tBeautify'));
  $('tPaper').onclick = () => bgPop($('tPaper'));
  $('tTools').onclick = () => toolsPop($('tTools'));
  initStrip();
  initPagesUI();
  document.querySelectorAll('#createbar [data-create]').forEach(b => b.addEventListener('click', () => createClick(b)));
  document.querySelectorAll('#selbar [data-sel]').forEach(b => b.addEventListener('click', () => selAction(b.dataset.sel, b)));

  $('bBack').onclick = async () => { await flush(); onBack(); };
  $('bUndo').onclick = undo;
  $('bRedo').onclick = redo;
  $('bClear').onclick = clearBoard;
  $('bFull').onclick = toggleFullscreen;
  $('bShowBars').onclick = () => setClean(false);
  $('bMenu').onclick = () => openMenu($('bMenu'));
  $('bTitle').addEventListener('change', () => { S.board.title = $('bTitle').value.trim() || 'Sem título'; $('bTitle').title = S.board.title; scheduleSave(); });
  $('bTitle').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); e.stopPropagation(); });
  $('zIn').onclick = () => zoomAt(W / 2, H / 2, S.view.zoom * 1.25);
  $('zOut').onclick = () => zoomAt(W / 2, H / 2, S.view.zoom / 1.25);
  $('zLabel').onclick = () => zoomAt(W / 2, H / 2, 1);
  $('zFit').onclick = fitView;
  $('zLens').onclick = () => toggleZoomLens();
  $('imgFile').addEventListener('change', async e => { await insertFiles([...e.target.files]); e.target.value = ''; });

  const te = $('textEdit');
  te.addEventListener('blur', commitText);
  te.addEventListener('input', sizeTextEditor);
  te.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Escape') te.blur();
  });

  document.addEventListener('lousa:cfg', () => { if (S) syncToolbar(); });
  document.addEventListener('lousa:layoutPadrao', () => { if (S) layoutPadrao(); });
  addEventListener('keydown', onKey);
  addEventListener('keyup', e => { if (e.code === 'Space') { spaceDown = false; setCursor(); } });
  // janela perdeu o foco com Espaço segurado (ExpressKey/Alt+Tab): solta o "mover quadro"
  function resetInput() { spaceDown = false; pointers.clear(); if (S) setCursor(); }
  addEventListener('paste', onPaste);
  ov.addEventListener('dragover', e => e.preventDefault());
  ov.addEventListener('drop', async e => {
    e.preventDefault();
    const todos = [...e.dataTransfer.files];
    const doc = todos.find(f => /\.(pdf|pptx?|ppsx)$/i.test(f.name));   // PDF/PowerPoint arrastado vira páginas
    if (doc) return importSlidesIntoBoard(doc);
    const files = todos.filter(f => f.type.startsWith('image/'));
    if (files.length) await insertFiles(files, toWorld(e.clientX, e.clientY));
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { flush(); resetInput(); } });
  addEventListener('pagehide', emergencySave);
  addEventListener('beforeunload', e => { if (hasUnsavedChanges()) { e.preventDefault(); e.returnValue = ''; } });
  addEventListener('blur', resetInput);
  ov.addEventListener('lostpointercapture', e => { if (pointers.has(e.pointerId)) onUp(e); });
  fillIcons($('board'));
  initBars();
}

export function openBoard(id, board, back) {
  onBack = back;
  const pending = failedSnaps.get(id);
  if (pending) board = pending.board;
  board.background = { color: '#ffffff', pattern: 'none', ...(board.background || {}) };
  let view = board.view && isFinite(board.view.zoom) && board.view.zoom > 0 ? { ...board.view } : null;
  if (view) view.zoom = Math.max(0.1, Math.min(8, view.zoom));
  // limpeza: textos vazios deixados por versões antigas
  const items = (Array.isArray(board.items) ? board.items : []).filter(i => !(i.type === 'text' && !String(i.text || '').trim()));
  S = { id, board, items, view };
  dirtyVer = pending?.ver || 0; savedVer = pending ? -1 : 0;
  if (pending) pending.state = S;
  undoStack = []; redoStack = []; sel = new Set(); action = null; ruler = null; laser = []; editing = null;
  stopPlotAnim();
  $('bTitle').value = board.title === 'Sem título' ? '' : board.title;
  $('bTitle').title = board.title;
  $('bStatus').textContent = pending ? (pending.conflict ? 'Conflito de edição — exporte como .lousa' : 'Alterações ainda não salvas') : '';
  $('bStatus').classList.toggle('err', !!pending);
  resize();
  if (!S.view) { S.view = { x: 0, y: 0, zoom: 1 }; if (PG.isPages(S.board)) goToPage(0); else fitView(); } else updateZoomLabel();
  setPresent(false);
  updatePageBar();
  syncToolbar();
  updateUndo();
  buildTeachBar();
  placeBars();
  requestRender();
}

// gancho de depuração (testes automatizados)
window.__lousa = { get S() { return S; }, get pending() { return pendingBeauty; }, get action() { return action; }, get sel() { return sel; } };

export function isOpen() { return !!S && !$('board').hidden; }

// ================= desenho =================
function resize() {
  if (!cv) return;
  dpr = devicePixelRatio || 1;
  W = innerWidth; H = innerHeight;
  for (const c of [cv, ov]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  requestRender();
}

export function requestRender(stat = true) {
  if (stat) needStatic = true;
  needOverlay = true;
  if (!raf) raf = requestAnimationFrame(frame);
}
// redesenha só um retângulo do mundo (borracha): com muitos traços, refazer a tela inteira a cada quadro travava
let dirtyRect = null;
function requestDirty(b) {
  if (!dirtyRect) { dirtyRect = { ...b }; }
  else {
    const d = dirtyRect, x = Math.min(d.x, b.x), y = Math.min(d.y, b.y);
    dirtyRect = { x, y, w: Math.max(d.x + d.w, b.x + b.w) - x, h: Math.max(d.y + d.h, b.y + b.h) - y };
  }
  if (!raf) raf = requestAnimationFrame(frame);
}

function frame() {
  raf = 0;
  if (!S) return;
  const part = !needStatic && dirtyRect;
  if (needStatic) drawStatic();
  else if (part) drawStatic(dirtyRect);
  dirtyRect = null;
  if (needOverlay) drawOverlay();
  if (strip && (needStatic || needOverlay || part)) drawStrip();
  needStatic = needOverlay = false;
  if (laser.length) requestRender(false);
  if (beautyAnim) requestRender();
}

function previewItem(it) {
  if (action?.type === 'transform' && sel.has(it.id)) {
    const a = action;
    return R.transformItem(it, a.dx, a.dy, a.s, a.ox, a.oy);
  }
  if (action?.type === 'rotate' && sel.has(it.id)) return R.rotateItem(it, action.ang, action.cx, action.cy);
  return it;
}

const endsAt = (pc, pts) => pc[pc.length - 3] === pts[pts.length - 3] && pc[pc.length - 2] === pts[pts.length - 2];
const pieceCache = new WeakMap(); // pedaço da borracha parcial → item estável (o contorno fica em cache no render)
function drawStatic(clip) {
  const v = S.view;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (clip) {
    const a = toScreen(clip.x, clip.y);
    const x0 = Math.floor(a.x) - 2, y0 = Math.floor(a.y) - 2;
    ctx.beginPath();
    ctx.rect(x0, y0, Math.ceil(clip.w * v.zoom) + 5, Math.ceil(clip.h * v.zoom) + 5);
    ctx.clip();
  }
  if (PG.isPages(S.board)) PG.drawPages(ctx, S.board, v, W, H);
  else R.drawBackground(ctx, S.board.background, v, W, H);
  const darkBg = R.isDark(S.board.background.color);
  R.setDarkBackground(darkBg);
  // fundo escuro com PDF: sobre a página do PDF (branca) a tinta preta não vira branca
  const L = S.board.layout, slides = darkBg && PG.isPages(S.board) ? PG.slidePages(L, S.items) : null;
  ctx.setTransform(dpr * v.zoom, 0, 0, dpr * v.zoom, dpr * v.x, dpr * v.y);
  const vis = clip ? { x: clip.x - 3 / v.zoom, y: clip.y - 3 / v.zoom, w: clip.w + 6 / v.zoom, h: clip.h + 6 / v.zoom }
    : { x: -v.x / v.zoom, y: -v.y / v.zoom, w: W / v.zoom, h: H / v.zoom };
  const erased = action?.type === 'erase' ? action.erased : null;
  let ta = 1;
  if (beautyAnim) { ta = (performance.now() - beautyAnim.t0) / 160; if (ta >= 1) { beautyAnim = null; ta = 1; } }
  const ease = 1 - (1 - ta) ** 3;
  for (const raw of S.items) {
    if (erased?.has(raw.id)) continue;
    let it = previewItem(raw);
    if (!R.boxesTouch(R.bbox(it), vis)) continue;
    if (slides?.size) R.setDarkBackground(!slides.has(PG.pageOf(L, it)));
    if (editing?.id === it.id) {
      if (it.type === 'text') continue;
      it = { ...it, text: '' };
    }
    const parts = action?.type === 'erase' ? action.parts?.get(it.id) : null;
    if (parts) {
      for (const pc of parts) {
        let pi = pieceCache.get(pc);
        if (!pi) { pi = { ...it, pts: pc, arrow: it.arrow && endsAt(pc, it.pts) }; pieceCache.set(pc, pi); }
        R.drawStroke(ctx, pi, true);
      }
      continue;
    }
    const from = beautyAnim?.from.get(it.id);
    if (from && it.pts.length === from.length) {
      const q = new Array(from.length);
      for (let i = 0; i < q.length; i++) q[i] = from[i] + (it.pts[i] - from[i]) * ease;
      R.drawStroke(ctx, { ...it, pts: q });
    }
    else R.drawItem(ctx, it);
  }
  R.setDarkBackground(darkBg);
  ctx.restore();
}

// ponteiro da caneta (coordenadas de tela). Contorno duplo (claro + escuro) para aparecer em qualquer fundo.
// ponta: caneta inclinada com a ponta exatamente no ponto da escrita · mira: cruz fina · ponto: só a tinta · anel: bolinha antiga
function drawPenCursor(x, y, c, kind) {
  const r = Math.max(2, c.width / 2);
  const outline = (w = 1.5) => {
    octx.lineWidth = w + 2; octx.strokeStyle = 'rgba(255,255,255,.9)'; octx.stroke();
    octx.lineWidth = w; octx.strokeStyle = 'rgba(0,0,0,.65)'; octx.stroke();
  };
  octx.save();
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  octx.lineJoin = 'round'; octx.lineCap = 'round';
  if (kind === 'ponta') {
    octx.translate(x, y); octx.rotate(Math.PI / 4);   // corpo para cima e à direita, como a caneta na mão
    octx.beginPath(); octx.moveTo(0, 0); octx.lineTo(-4.5, -11); octx.lineTo(4.5, -11); octx.closePath();
    octx.fillStyle = c.color; octx.fill(); outline(1.2);
    octx.beginPath(); octx.roundRect(-4.5, -32, 9, 21, 2);
    octx.fillStyle = '#ffffff'; octx.fill(); outline(1.2);
    octx.beginPath(); octx.rect(-4.5, -16, 9, 4); octx.fillStyle = c.color; octx.fill();
  } else if (kind === 'mira') {
    const g = Math.max(3, r + 2), L = g + 7;
    octx.beginPath();
    octx.moveTo(x - L, y); octx.lineTo(x - g, y); octx.moveTo(x + g, y); octx.lineTo(x + L, y);
    octx.moveTo(x, y - L); octx.lineTo(x, y - g); octx.moveTo(x, y + g); octx.lineTo(x, y + L);
    outline(1.2);
    octx.beginPath(); octx.arc(x, y, 1.6, 0, Math.PI * 2); octx.fillStyle = c.color; octx.fill();
  } else {
    if (kind === 'anel') { octx.beginPath(); octx.arc(x, y, r + 6, 0, Math.PI * 2); outline(1.5); }
    octx.beginPath(); octx.arc(x, y, r, 0, Math.PI * 2);
    octx.fillStyle = c.color; octx.fill();
    octx.lineWidth = 1; octx.strokeStyle = R.isDark(c.color) ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.4)'; octx.stroke();
  }
  octx.restore();
}

function drawOverlay() {
  const v = S.view;
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  octx.clearRect(0, 0, W, H);
  octx.setTransform(dpr * v.zoom, 0, 0, dpr * v.zoom, dpr * v.x, dpr * v.y);
  if (ruler) drawRuler();
  drawInstruments();
  drawPlotAnim();
  if (action?.type === 'draw') {
    const s = action.stroke;
    R.drawStroke(octx, action.pred?.length ? { ...s, pts: s.pts.concat(action.pred) } : s);
  }
  if (action?.type === 'shape' && action.item) R.drawItem(octx, action.item);
  if (action?.type === 'lasso' && action.poly.length > 2) {
    octx.save();
    octx.setLineDash([6 / v.zoom, 5 / v.zoom]);
    octx.lineWidth = 1.5 / v.zoom;
    octx.strokeStyle = '#0f6cbd';
    octx.fillStyle = 'rgba(15,108,189,0.06)';
    octx.beginPath();
    const p = action.poly;
    octx.moveTo(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) octx.lineTo(p[i], p[i + 1]);
    octx.closePath(); octx.fill(); octx.stroke();
    octx.restore();
  }
  // rastro do laser
  if (laser.length) {
    const now = performance.now();
    laser = laser.filter(p => now - p.t < 900);
    octx.save();
    octx.lineCap = octx.lineJoin = 'round';
    for (let i = 1; i < laser.length; i++) {
      const a = laser[i - 1], b = laser[i];
      if (b.t - a.t > 200 || b.brk) continue;
      const age = Math.min(1, (now - b.t) / 900);
      octx.strokeStyle = `rgba(232,18,36,${(1 - age) * 0.9})`;
      octx.lineWidth = (6 * (1 - age) + 2) / v.zoom;
      octx.beginPath(); octx.moveTo(a.x, a.y); octx.lineTo(b.x, b.y); octx.stroke();
    }
    const last = laser[laser.length - 1];
    if (last && now - last.t < 120) {
      octx.shadowColor = '#ff2d2d'; octx.shadowBlur = 16;
      octx.fillStyle = '#ff3b3b';
      octx.beginPath(); octx.arc(last.x, last.y, 7 / v.zoom, 0, Math.PI * 2); octx.fill();
    }
    octx.restore();
  }
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (action?.type === 'marquee') {
    const a = toScreen(action.x0, action.y0), b = toScreen(action.x1, action.y1);
    octx.save();
    octx.setLineDash([5, 4]); octx.strokeStyle = '#0f6cbd'; octx.fillStyle = 'rgba(15,108,189,0.06)';
    octx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); octx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    octx.restore();
  }
  drawSelection();
  if (hover?.pen && ov.className === 'c-none' && (!action || action.type === 'draw' && cfg.tablet.cursorDraw !== false)) {
    // ponteiro da caneta pairando (a mesa digitalizadora não mostra cursor próprio; na Intuos o professor olha a tela)
    drawPenCursor(hover.x, hover.y, cfg.tools[tool] || cfg.tools.pen0, cfg.tablet.cursor || 'ponta');
  }
  drawShades();
  drawZoomLens();
  if ((tool === 'eraser' || action?.type === 'erase') && hover && !spaceDown) {
    octx.save();
    octx.strokeStyle = '#605e5c'; octx.fillStyle = 'rgba(255,255,255,0.6)'; octx.lineWidth = 1.5;
    octx.beginPath(); octx.arc(hover.x, hover.y, eraserR(), 0, Math.PI * 2); octx.fill(); octx.stroke();
    octx.restore();
  }
}

// caixa da seleção em coordenadas de tela
function selBox() {
  if (!sel.size) return null;
  const items = S.items.filter(i => sel.has(i.id)).map(previewItem);
  const b = R.unionBox(items);
  if (!b) return null;
  const a = toScreen(b.x, b.y);
  const pad = 8;
  return { x: a.x - pad, y: a.y - pad, w: b.w * S.view.zoom + pad * 2, h: b.h * S.view.zoom + pad * 2 };
}

function drawSelection() {
  const bar = $('selbar');
  const b = selBox();
  if (!b || editing) { bar.hidden = true; return; }
  octx.save();
  octx.strokeStyle = 'rgba(255,255,255,.9)'; octx.lineWidth = 3.5;
  octx.strokeRect(b.x, b.y, b.w, b.h);
  octx.strokeStyle = '#0f6cbd'; octx.lineWidth = 1.5; octx.setLineDash([6, 4]);
  octx.strokeRect(b.x, b.y, b.w, b.h);
  octx.setLineDash([]);
  octx.fillStyle = '#fff';
  octx.beginPath(); octx.arc(b.x + b.w, b.y + b.h, 11, 0, Math.PI * 2); octx.fill(); octx.stroke();
  // alça de girar
  octx.beginPath(); octx.moveTo(b.x + b.w / 2, b.y); octx.lineTo(b.x + b.w / 2, b.y - 22); octx.stroke();
  octx.beginPath(); octx.arc(b.x + b.w / 2, b.y - 30, 8, 0, Math.PI * 2); octx.fill(); octx.stroke();
  octx.fillStyle = '#0f6cbd'; octx.font = '12px "Segoe UI"'; octx.textAlign = 'center'; octx.textBaseline = 'middle';
  octx.fillText('⟳', b.x + b.w / 2, b.y - 30);
  if (action?.type === 'rotate') octx.fillText(`${Math.round(action.ang * 180 / Math.PI)}°`, b.x + b.w / 2, b.y - 52);
  octx.restore();
  if (action?.type === 'transform') { bar.hidden = true; return; }
  const single = sel.size === 1 ? byId([...sel][0]) : null;
  bar.querySelector('[data-sel="edit"]').hidden = !(single && (single.type === 'text' || single.type === 'note'));
  bar.querySelector('[data-sel="color"]').hidden = [...sel].every(id => { const it = byId(id); return it?.type === 'image' && !it.lib; });
  bar.querySelector('[data-sel="beautify"]').hidden = ![...sel].some(id => { const it = byId(id); return it && canBeautify(it); });
  bar.querySelector('[data-sel="original"]').hidden = ![...sel].some(id => byId(id)?.orig || byId(id)?.ink);
  bar.querySelector('[data-sel="ocr"]').hidden = serverInfo().ocr === false || ![...sel].some(id => byId(id)?.type === 'stroke' && byId(id)?.tool === 'pen');
  bar.querySelector('[data-sel="font"]').hidden = ![...sel].some(id => byId(id)?.type === 'text');
  const grps = new Set([...sel].map(id => byId(id)?.grp || ''));
  bar.querySelector('[data-sel="group"]').hidden = sel.size < 2 || (grps.size === 1 && !grps.has(''));
  bar.querySelector('[data-sel="ungroup"]').hidden = ![...grps].some(Boolean);
  bar.hidden = false;
  const bw = bar.offsetWidth, bh = bar.offsetHeight;
  let x = b.x + b.w / 2 - bw / 2, y = b.y - bh - 46;   // acima da alça de girar
  if (y < 70) y = b.y + b.h + 14;
  if (y + bh > H - 8) y = Math.max(70, b.y + 8);
  bar.style.left = Math.max(8, Math.min(W - bw - 8, x)) + 'px';
  bar.style.top = y + 'px';
}

// ================= régua =================
function rulerDims() { return { len: RULER_LEN / S.view.zoom, th: RULER_TH / S.view.zoom }; }
function rulerLocal(x, y) {
  const a = ruler.angle * Math.PI / 180, dx = x - ruler.x, dy = y - ruler.y;
  return { u: dx * Math.cos(a) + dy * Math.sin(a), v: -dx * Math.sin(a) + dy * Math.cos(a) };
}
function rulerWorld(u, v) {
  const a = ruler.angle * Math.PI / 180;
  return { x: ruler.x + u * Math.cos(a) - v * Math.sin(a), y: ruler.y + u * Math.sin(a) + v * Math.cos(a) };
}
function onRuler(x, y) {
  if (!ruler) return false;
  const { len, th } = rulerDims(), l = rulerLocal(x, y);
  return Math.abs(l.u) <= len / 2 && Math.abs(l.v) <= th / 2;
}
function toggleRuler() {
  if (ruler) ruler = null;
  else { const c = toWorld(W / 2, H / 2); ruler = { x: c.x, y: c.y, angle: 0 }; }
  syncToolbar();
  requestRender(false);
}
function drawRuler() {
  const z = S.view.zoom, { len, th } = rulerDims();
  octx.save();
  octx.translate(ruler.x, ruler.y);
  octx.rotate(ruler.angle * Math.PI / 180);
  octx.shadowColor = 'rgba(0,0,0,0.25)'; octx.shadowBlur = 12; octx.shadowOffsetY = 2;
  octx.fillStyle = 'rgba(250,250,250,0.88)';
  octx.beginPath(); octx.roundRect(-len / 2, -th / 2, len, th, 6 / z); octx.fill();
  octx.shadowColor = 'transparent';
  octx.strokeStyle = '#8a8886'; octx.lineWidth = 1 / z; octx.stroke();
  octx.strokeStyle = '#424242';
  octx.beginPath();
  const step = 10 / z;
  let k = 0;
  for (let u = -len / 2 + step; u < len / 2; u += step, k++) {
    const tl = ((k + 1) % 10 === 0 ? 22 : (k + 1) % 5 === 0 ? 14 : 8) / z;
    octx.moveTo(u, -th / 2); octx.lineTo(u, -th / 2 + tl);
    octx.moveTo(u, th / 2); octx.lineTo(u, th / 2 - tl);
  }
  octx.stroke();
  let ang = ((-ruler.angle % 360) + 360) % 360;
  if (ang > 180) ang -= 180;
  octx.fillStyle = '#242424';
  octx.font = `600 ${18 / z}px "Segoe UI", sans-serif`;
  octx.textAlign = 'center'; octx.textBaseline = 'middle';
  octx.fillText(`${Math.round(ang)}°`, 0, 0);
  octx.restore();
}

// ================= barra de ferramentas =================
function syncToolbar() {
  document.querySelectorAll('#inkbar [data-tool]').forEach(b => {
    const t = b.dataset.tool;
    b.classList.toggle('active', t === tool);
    if (b.classList.contains('pen')) {
      const c = cfg.tools[t];
      b.innerHTML = penIcon(t === 'highlighter' ? c.color : inkShown(c.color), t === 'highlighter' ? 'highlighter' : 'pen');
      b.title = t === 'highlighter' ? 'Marca-texto (H): toque de novo para cor e espessura' : `Caneta ${+t.slice(3) + 1} (tecla ${+t.slice(3) + 1}): toque de novo para cor e espessura`;
    }
  });
  $('tRuler').classList.toggle('on', !!ruler);
  $('tInkShape').classList.toggle('on', cfg.inkShape);
  $('tBeautify').classList.toggle('on', !!cfg.tablet.beautify);
  document.querySelectorAll('#createbar [data-create]').forEach(b =>
    b.classList.toggle('on', (b.dataset.create === 'text' && tool === 'text') || (b.dataset.create === 'shapes' && tool === 'shape')));
  setCursor();
  syncPresentBar();
  syncTeachBar();
}

function setTool(t) {
  if (t !== 'compass') compassSt = null;
  if (t !== tool && (isPen(t) || t === 'highlighter' || t === 'eraser' || t === 'laser')) clearSel();
  tool = t;
  saveCfg();
  syncToolbar();
  requestRender(false);
}

function setCursor(state) {
  if (!ov) return;
  let c = 'c-' + (state || ({ select: 'select', lasso: 'select', text: 'text', eraser: 'eraser' }[tool] || 'draw'));
  if (spaceDown && !state) c = 'c-pan';
  ov.className = c;
}

function toolClick(b) {
  const t = b.dataset.tool;
  if (t === tool && (isPen(t) || t === 'highlighter')) return penPop(b, t);
  if (t === tool && t === 'eraser') return eraserPop(b);
  hidePop();
  setTool(t);
}

// opções do ponteiro (desenho em editor.drawPenCursor); ícones pequenos para o menu da caneta
const CURSORS = [
  ['ponta', 'Ponta de caneta', '<svg viewBox="0 0 24 24" width="22" height="22"><g transform="rotate(45 6 18)" fill="#fff" stroke="#333" stroke-width="1.2" stroke-linejoin="round"><path d="M6 18l-2.5-6h5z" fill="#333"/><rect x="3.5" y="0" width="5" height="12" rx="1"/></g></svg>'],
  ['mira', 'Mira', '<svg viewBox="0 0 24 24" width="22" height="22" stroke="#333" stroke-width="1.5" stroke-linecap="round"><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><circle cx="12" cy="12" r="1.3" fill="#333"/></svg>'],
  ['ponto', 'Ponto', '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="3" fill="#333"/></svg>'],
  ['anel', 'Bolinha', '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="8" fill="none" stroke="#333" stroke-width="1.5"/><circle cx="12" cy="12" r="2.5" fill="#333"/></svg>'],
];

function penPop(anchor, t) {
  const c = cfg.tools[t], hl = t === 'highlighter';
  const pal = hl ? HL_PALETTE : PALETTE, widths = hl ? HL_WIDTHS : PEN_WIDTHS;
  const recent = (cfg.recent || []).filter(x => !pal.includes(x)).slice(0, 8);
  const styles = [['normal', 'Normal'], ['fountain', 'Tinteiro'], ['calligraphy', 'Caligrafia'], ['brush', 'Pincel']];
  const st = c.style || 'normal';
  showPop(anchor, `
    <canvas class="pen-prev" width="300" height="64"></canvas>
    <h4>Cor</h4><div class="swatches">${pal.map(x => `<button class="sw${x === c.color ? ' on' : ''}" data-c="${x}" style="background:${x}" title="${corNome(x)}" aria-label="${corNome(x)}"></button>`).join('')}</div>
    <div class="swatches" style="margin-top:6px">${recent.map(x => `<button class="sw${x === c.color ? ' on' : ''}" data-c="${x}" style="background:${x}" title="Usada há pouco: ${corNome(x)}" aria-label="${corNome(x)}"></button>`).join('')}
      <label class="sw custom" title="Outra cor…"><input type="color" id="pCustom" value="${c.color}">+</label></div>
    <h4>Espessura</h4><div class="widths">${widths.map(w => `<button class="wd${w === c.width ? ' on' : ''}" data-w="${w}" title="${w}"><i style="width:${Math.min(26, w * (hl ? .6 : 1.6) + 3)}px;height:${Math.min(26, w * (hl ? .6 : 1.6) + 3)}px;background:${c.color === '#ffffff' ? '#ccc' : c.color}"></i></button>`).join('')}</div>
    ${hl ? '' : `<h4>Estilo</h4><div class="seg">${styles.map(([k, n]) => `<button data-s="${k}" class="${k === st ? 'on' : ''}">${n}</button>`).join('')}</div>
      ${st === 'calligraphy' ? `<div class="row"><small>Ângulo da pena</small><input type="range" id="pNib" min="0" max="90" value="${c.nib ?? 45}"><small id="pNibV">${c.nib ?? 45}°</small></div>` : ''}
      <label class="row"><input type="checkbox" id="pArrow" ${c.arrow ? 'checked' : ''}> Ponta de seta no fim do traço</label>`}
    <h4>Ponteiro da caneta na tela</h4><div class="seg cursors">${CURSORS.map(([k, n, svg]) => `<button data-k="${k}" class="${k === (cfg.tablet.cursor || 'ponta') ? 'on' : ''}" title="${n}">${svg}<small>${n}</small></button>`).join('')}</div>
    <label class="row"><input type="checkbox" id="pCurDraw" ${cfg.tablet.cursorDraw !== false ? 'checked' : ''}> Manter o ponteiro visível enquanto escreve</label>
    <label class="row"><input type="checkbox" id="pCurMouse" ${cfg.tablet.mouseCursor !== false ? 'checked' : ''}> Usar este ponteiro também com o mouse</label>
    <div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn" id="pReset" title="Volta a cor, a espessura e o estilo de fábrica desta caneta, e o ponteiro da tela">Restaurar padrão</button></div>`,
    p => {
      const reopen = () => { saveCfg(); syncToolbar(); hidePop(); penPop(anchor, t); };
      const setColor = col => { c.color = col; cfg.recent = [col, ...(cfg.recent || []).filter(x => x !== col)].slice(0, 12); reopen(); };
      p.querySelectorAll('[data-c]').forEach(x => x.onclick = () => setColor(x.dataset.c));
      p.querySelector('#pCustom').onchange = e => setColor(e.target.value);
      p.querySelectorAll('[data-w]').forEach(x => x.onclick = () => { c.width = +x.dataset.w; saveCfg(); p.querySelectorAll('[data-w]').forEach(y => y.classList.toggle('on', y === x)); drawPrev(); });
      p.querySelectorAll('[data-s]').forEach(x => x.onclick = () => { c.style = x.dataset.s; reopen(); });
      const nibEl = p.querySelector('#pNib');
      if (nibEl) nibEl.oninput = () => { c.nib = +nibEl.value; p.querySelector('#pNibV').textContent = c.nib + '°'; saveCfg(); drawPrev(); };
      p.querySelectorAll('[data-k]').forEach(x => x.onclick = () => { cfg.tablet.cursor = x.dataset.k; saveCfg(); p.querySelectorAll('[data-k]').forEach(y => y.classList.toggle('on', y === x)); });
      p.querySelector('#pCurDraw').onchange = e => { cfg.tablet.cursorDraw = e.target.checked; saveCfg(); };
      p.querySelector('#pCurMouse').onchange = e => { cfg.tablet.mouseCursor = e.target.checked; saveCfg(); };
      p.querySelector('#pReset').onclick = () => {
        cfg.tools[t] = structuredClone(DEFAULT_TOOLS[t]); cfg.tablet.cursor = 'ponta'; cfg.tablet.cursorDraw = true;
        saveCfg(); syncToolbar(); hidePop(); penPop(anchor, t); toast('Caneta de volta ao padrão');
      };
      const ar = p.querySelector('#pArrow');
      if (ar) ar.onchange = () => { c.arrow = ar.checked; saveCfg(); drawPrev(); };
      // pré-visualização do traço com a cor, espessura e estilo escolhidos
      const cv = p.querySelector('.pen-prev'), g = cv.getContext('2d');
      function drawPrev() {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = R.isDark(S.board.background.color) ? S.board.background.color : '#ffffff';
        g.fillRect(0, 0, cv.width, cv.height);
        const pts = [];
        for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push(14 + u * 272, 34 - Math.sin(u * Math.PI * 2) * 16, hl ? 0.5 : 0.25 + 0.6 * Math.sin(u * Math.PI)); }
        const s = { type: 'stroke', tool: hl ? 'highlighter' : 'pen', color: c.color, width: c.width, pts, pr: !hl, taper: !hl, arrow: !hl && c.arrow };
        if (!hl && st !== 'normal') { s.style = st; s.nib = c.nib ?? 45; }
        R.withDarkBackground(R.isDark(S.board.background.color), () => R.drawStroke(g, s));
      }
      drawPrev();
    });
}

function eraserPop(anchor) {
  const m = cfg.eraserMode || 'stroke', r = eraserR();
  showPop(anchor, `<h4>Borracha</h4><div class="seg"><button data-m="stroke" class="${m === 'stroke' ? 'on' : ''}">Traço inteiro</button><button data-m="partial" class="${m === 'partial' ? 'on' : ''}">Só onde passar</button></div>
    <h4>Tamanho</h4><div class="seg">${ERASER_SIZES.map(([n, v]) => `<button data-z="${v}" class="${v === r ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="row"><input type="range" id="eSize" min="3" max="120" value="${r}" style="flex:1"><canvas id="eDot" width="64" height="64" style="width:32px;height:32px"></canvas></div>
    <div class="menu" style="padding:8px 0 0"><button data-a="all" class="danger">${ICON.trash} Limpar o quadro…</button></div>`, p => {
    p.querySelectorAll('[data-m]').forEach(x => x.onclick = () => { cfg.eraserMode = x.dataset.m; saveCfg(); p.querySelectorAll('[data-m]').forEach(y => y.classList.toggle('on', y === x)); });
    const sl = p.querySelector('#eSize'), dot = p.querySelector('#eDot').getContext('2d');
    const show = () => {
      const v = eraserR();
      dot.clearRect(0, 0, 64, 64); dot.beginPath(); dot.arc(32, 32, Math.min(30, v / 2 + 1), 0, Math.PI * 2);
      dot.fillStyle = '#e1dfdd'; dot.fill(); dot.strokeStyle = '#605e5c'; dot.lineWidth = 2; dot.stroke();
      p.querySelectorAll('[data-z]').forEach(y => y.classList.toggle('on', +y.dataset.z === v));
    };
    const set = v => { cfg.eraserSize = +v; saveCfg(); sl.value = v; show(); };
    sl.oninput = () => set(sl.value);
    p.querySelectorAll('[data-z]').forEach(x => x.onclick = () => set(x.dataset.z));
    show();
    p.querySelector('[data-a="all"]').onclick = () => { hidePop(); clearBoard(); };
  });
}

function createClick(b) {
  const k = b.dataset.create;
  hidePop();
  if (k === 'text') { setTool(tool === 'text' ? 'pen0' : 'text'); toast('Toque no quadro para escrever'); }
  else if (k === 'note') notePop(b);
  else if (k === 'shapes') shapesPop(b);
  else if (k === 'image') $('imgFile').click();
  else if (k === 'pdf') $('slideFile').click();
}

function notePop(anchor) {
  showPop(anchor, `<h4>Nota adesiva</h4><div class="swatches" style="grid-template-columns:repeat(6,26px)">${NOTE_COLORS.map(c => `<button class="sw sq" data-c="${c}" style="background:${c}"></button>`).join('')}</div>`,
    p => p.querySelectorAll('[data-c]').forEach(x => x.onclick = () => { hidePop(); addNote(x.dataset.c); }), 'right');
}

// formas desenhadas arrastando; as variantes de linha/seta viram kind + {both, dash}
const DRAW_KINDS = [['line', 'Linha'], ['lined', 'Linha tracejada'], ['arrow', 'Seta'], ['arrow2', 'Seta dupla'], ['arrowd', 'Seta tracejada'],
  ['rect', 'Retângulo'], ['ellipse', 'Elipse'], ['triangle', 'Triângulo']];
const SHAPE_COLORS = ['#000000', '#e81224', '#0078d4', '#16c60c', '#f7630c', '#886ce4', '#7a7574', '#ffffff'];
const KIND_OF = { lined: { kind: 'line', dash: true }, arrow2: { kind: 'arrow', both: true }, arrowd: { kind: 'arrow', dash: true } };
const isLineKind = k => ['line', 'arrow'].includes(KIND_OF[k]?.kind || k);

// disciplina de cada forma (para a busca mostrar de onde vem)
const RECENTES = '__recentes';
const SHAPE_GROUP_OF = new Map(SHAPE_GROUPS.flatMap(g => g.secoes.flatMap(([, list]) => list.map(f => [f[0], g.nome]))));

function shapesPop(anchor) {
  const grupos = gruposVisiveis();   // as disciplinas que o professor escolheu mostrar
  const tab = grupos.some(g => g.id === cfg.shapeTab) ? cfg.shapeTab : grupos[0].id;
  const groupHtml = id => {
    const g = SHAPE_GROUPS.find(x => x.id === id);
    const mais = (g.destaques || []).map(shapeById).filter(Boolean);   // "Mais usadas" no topo da aba
    return (mais.length ? `<div class="shp-sec shp-mais">⚑ Mais usadas</div>${mais.map(f => cell(f)).join('')}` : '')
      + g.secoes.map(([n, list]) => `<div class="shp-sec">${esc(n)}</div>${list.map(f => cell(f)).join('')}`).join('');
  };
  const cell = ([id, n], g) => `<button class="libitem shp" data-lib="${id}" title="${esc(n)}${g ? ' (' + esc(g) + ')' : ''}"><img src="${svgDataUrl(shapeSvg(id, '#323130').svg)}" alt=""><span>${esc(n)}${g ? `<small>${esc(g)}</small>` : ''}</span></button>`;
  showPop(anchor, `<button class="btn shp-amplia" id="sBig" title="${cfg.shapesBig ? 'Voltar ao tamanho normal' : 'Ver mais formas de uma vez'}">${cfg.shapesBig ? '⤡ Reduzir' : '⤢ Ampliar'}</button><h4>Desenhar — arraste no quadro</h4><div class="shapes">${DRAW_KINDS.map(([k, n]) => `<button class="ib lbl${k === shapeKind && tool === 'shape' ? ' on' : ''}" data-k="${k}" title="${n}">${ICON[k]}<small>${n}</small></button>`).join('')}</div>
    <label class="row"><input type="checkbox" id="sFill" ${cfg.shapeFill ? 'checked' : ''}> Preenchida (cor clara)</label>
    <h4>Biblioteca de formas</h4>
    <div class="row shp-cor"><span>Cor:</span><button class="sw-txt${cfg.shapeColor ? '' : ' on'}" data-sc="" title="Usar a cor da caneta atual">da caneta</button>${SHAPE_COLORS.map(c => `<button class="sw${cfg.shapeColor === c ? ' on' : ''}" data-sc="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>
    <input class="shp-busca" id="sFind" placeholder="Procurar forma (ex.: válvula, bomba, resistor)…">
    <div class="shp-abas"><div class="shp-niveis">
        <div class="seg shp-areas" id="sAreas"></div>
        <div class="seg shp-tabs" id="sTabs"></div></div>
      <button class="btn shp-disc" id="sDisc" title="Escolher quais disciplinas aparecem aqui (todas continuam na busca)">Disciplinas…</button></div>
    <div class="libgrid shp-grid" id="sGrid"></div>`,
    p => {
      p.classList.toggle('shp-big', !!cfg.shapesBig);
      p.querySelector('#sBig').onclick = () => { cfg.shapesBig = !cfg.shapesBig; saveCfg(); hidePop(); shapesPop(anchor); };
      p.querySelector('#sDisc').onclick = async () => { hidePop(); if (await escolherDisciplinas()) shapesPop(anchor); };
      p.querySelectorAll('[data-k]').forEach(x => x.onclick = () => { shapeKind = x.dataset.k; hidePop(); setTool('shape'); });
      p.querySelector('#sFill').onchange = e => { cfg.shapeFill = e.target.checked; saveCfg(); };
      p.querySelectorAll('[data-sc]').forEach(x => x.onclick = () => {
        cfg.shapeColor = x.dataset.sc || null; saveCfg();
        p.querySelectorAll('[data-sc]').forEach(y => y.classList.toggle('on', y === x));
      });
      const grid = p.querySelector('#sGrid');
      const bind = () => grid.querySelectorAll('[data-lib]').forEach(b => b.onclick = () => { hidePop(); insertLibShape(b.dataset.lib); });
      // dois níveis: áreas (só com mais de 8 disciplinas visíveis) e, embaixo, as disciplinas da área; "↺ Recentes" primeiro
      const areas = areasVisiveis(), usaAreas = grupos.length > 8;
      const areaDe = id => areas.find(([, gs]) => gs.some(g => g.id === id))?.[0];
      const recentes = () => (cfg.recentShapes || []).map(shapeById).filter(Boolean);
      const sTabs = p.querySelector('#sTabs'), sAreas = p.querySelector('#sAreas');
      sAreas.hidden = !usaAreas;
      const mostra = id => {   // id de disciplina ou RECENTES
        p.querySelector('#sFind').value = '';
        if (id === RECENTES) {
          const r = recentes();
          grid.innerHTML = r.length ? `<div class="shp-sec">Usadas por último</div>` + r.map(f => cell(f, SHAPE_GROUP_OF.get(f[0]))).join('')
            : '<p class="muted">As formas que você inserir aparecem aqui, para achar de novo rápido.</p>';
        } else grid.innerHTML = groupHtml(id);
        grid.scrollTop = 0; bind();
        p.querySelectorAll('[data-tab], [data-area]').forEach(b => b.classList.toggle('on',
          b.dataset.tab === id || (id === RECENTES ? b.dataset.area === RECENTES : b.dataset.area === areaDe(id) && usaAreas)));
      };
      const abreTab = id => { cfg.shapeTab = id; if (id !== RECENTES) { cfg.shapeTabPorArea = { ...(cfg.shapeTabPorArea || {}), [areaDe(id)]: id }; } saveCfg(); mostra(id); };
      const desenhaTabs = area => {
        const lista = usaAreas ? (areas.find(([n]) => n === area)?.[1] || []) : grupos;
        sTabs.hidden = usaAreas && area === RECENTES;
        sTabs.innerHTML = (usaAreas ? '' : `<button data-tab="${RECENTES}" title="Formas usadas por último">↺ Recentes</button>`)
          + lista.map(g => `<button data-tab="${g.id}">${esc(g.nome)}</button>`).join('');
        sTabs.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => abreTab(b.dataset.tab));
      };
      if (usaAreas) {
        sAreas.innerHTML = `<button data-area="${RECENTES}" title="Formas usadas por último">↺ Recentes</button>`
          + areas.map(([n]) => `<button data-area="${esc(n)}">${esc(n)}</button>`).join('');
        sAreas.querySelectorAll('[data-area]').forEach(b => b.onclick = () => {
          const a = b.dataset.area;
          if (a === RECENTES) { desenhaTabs(a); abreTab(RECENTES); return; }
          desenhaTabs(a);
          const lista = areas.find(([n]) => n === a)[1], lembrada = cfg.shapeTabPorArea?.[a];
          abreTab(lista.some(g => g.id === lembrada) ? lembrada : lista[0].id);
        });
      }
      const inicial = cfg.shapeTab === RECENTES ? RECENTES : tab;
      desenhaTabs(inicial === RECENTES ? RECENTES : areaDe(inicial));
      mostra(inicial);
      const plain = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const find = p.querySelector('#sFind');
      find.oninput = () => {
        const q = plain(find.value.trim());
        if (!q) return mostra(cfg.shapeTab === RECENTES ? RECENTES : (grupos.some(g => g.id === cfg.shapeTab) ? cfg.shapeTab : tab));
        p.querySelectorAll('[data-tab]').forEach(y => y.classList.remove('on'));
        const hits = ALL_SHAPES.filter(s => plain(s[1]).includes(q));
        grid.innerHTML = hits.length ? `<div class="shp-sec">${hits.length} forma${hits.length > 1 ? 's' : ''}</div>` + hits.map(f => cell(f, SHAPE_GROUP_OF.get(f[0]))).join('')
          : '<p class="muted">Nenhuma forma com esse nome.</p>'; bind();
      };
      find.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') hidePop(); });
      bind();
    }, 'right');
}

// forma da biblioteca: entra no centro da tela, no tamanho natural, na cor da caneta, já selecionada
function recolorLib(it, color) {
  const m = shapeSvg(it.lib, color);
  return m ? { ...it, tint: color, src: svgDataUrl(m.svg) } : it;
}

// apaga tudo de uma vez: só o que foi escrito (PDF/slides ficam) ou tudo mesmo; dá para desfazer
async function clearBoard() {
  const pages = PG.isPages(S.board) && S.board.layout.count > 1;
  if (!S.items.length && !pages) return toast('O quadro já está limpo');
  const locked = S.items.filter(i => i.locked);
  let modo = 'escrita';
  if (locked.length || pages) {
    const ops = [];
    if (locked.length < S.items.length) ops.push(['escrita', locked.length ? 'Só o que foi escrito (o PDF/slides ficam)' : 'Só o que foi escrito (as páginas ficam)']);
    ops.push(['tudo', 'Tudo, inclusive PDF/slides e páginas extras', true]);
    modo = await choiceBox('Limpar o quadro', 'O que apagar? Dá para desfazer com Ctrl+Z.', ops);
    if (!modo) return;
  } else if (!await confirmBox('Limpar o quadro', 'Apagar tudo o que está neste quadro? Dá para desfazer com Ctrl+Z.', 'Limpar', true)) return;
  clearSel();
  if (modo === 'tudo' && PG.isPages(S.board)) { commit([], { ...S.board.layout, count: 1 }); goToPage(0, present); refreshPanel(); updatePageBar(); }
  else commit(modo === 'tudo' ? [] : locked);
  toast('Quadro limpo. Ctrl+Z desfaz.');
}

function insertLibShape(id) {
  cfg.recentShapes = [id, ...(cfg.recentShapes || []).filter(x => x !== id)].slice(0, 24); saveCfg();   // "↺ Recentes"
  const tint = cfg.shapeColor || textColor();
  const m = shapeSvg(id, tint);
  if (!m) return;
  const z = S.view.zoom, c = toWorld(W / 2, H / 2), w = m.w / z, h = m.h / z;
  const it = { id: newId(), type: 'image', src: svgDataUrl(m.svg), x: c.x - w / 2, y: c.y - h / 2, w, h, lib: id, tint };
  commit([...S.items, it]);
  sel = new Set([it.id]);
  setTool('select');
}

// cor como aparece na tela (preto vira branco em fundo escuro)
function inkShown(c) { return c === '#000000' && S && R.isDark(S.board.background.color) ? '#ffffff' : c; }
function textColor() {
  const c = currentInk().color;
  return c === '#ffffff' && S && !R.isDark(S.board.background.color) ? '#000000' : c;
}

function currentInk() {
  const t = isPen(tool) ? tool : (cfg.lastPen || 'pen0');
  return cfg.tools[t] || cfg.tools.pen0;
}

// ================= histórico e salvamento =================
function commit(items, layout) {
  undoStack.push(histEntry());
  if (undoStack.length > 400) undoStack.shift();
  redoStack = [];
  S.items = items;
  if (layout !== undefined) S.board.layout = layout;
  changed();
}
const histEntry = () => ({ items: S.items, layout: S.board.layout, bg: S.board.background });
function restore(entry) {
  S.items = entry.items; S.board.layout = entry.layout;
  if (entry.bg && entry.bg !== S.board.background) { S.board.background = entry.bg; syncToolbar(); }
}
function changed() {
  for (const id of [...sel]) if (!byId(id)) sel.delete(id);
  updatePageBar();
  refreshPanel();
  updateUndo();
  requestRender();
  scheduleSave();
}
function undo() {
  if (!undoStack.length) return;
  pendingBeauty = []; clearTimeout(beautyTimer);
  redoStack.push(histEntry());
  restore(undoStack.pop());
  changed();
  toast('Desfeito', 2600, { label: 'Refazer', fn: redo });
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(histEntry());
  restore(redoStack.pop());
  changed();
}
function updateUndo() {
  $('bUndo').disabled = !undoStack.length;
  $('bRedo').disabled = !redoStack.length;
}

function scheduleSave() {
  if (!S) return;
  dirtyVer++;
  $('bStatus').textContent = 'Editando…';
  $('bStatus').classList.remove('err');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 500);
}

const snapshot = () => ({ id: S.id, state: S, ver: dirtyVer, board: { ...S.board, items: S.items, view: { ...S.view } } });

// miniatura separada do salvamento (não atrasa a gravação dos traços)
function scheduleThumb(id) {
  if (thumbTimer) return;
  thumbTimer = setTimeout(async () => { thumbTimer = 0; if (S?.id === id) await saveThumbNow(); }, 4000);
}
async function saveThumbNow() {
  if (!S) return;
  const id = S.id, board = { ...S.board, items: S.items };
  const v = S.view, tela = { x: -v.x / v.zoom, y: -v.y / v.zoom, w: W / v.zoom, h: H / v.zoom };
  // enquadra o que está desenhado na parte visível (um rabisco perdido longe não encolhe a prévia)
  let box = null;
  for (const i of S.items) {
    const b = R.bbox(i);
    if (!R.boxesTouch(b, tela)) continue;
    const x0 = Math.max(b.x, tela.x), y0 = Math.max(b.y, tela.y), x1 = Math.min(b.x + b.w, tela.x + tela.w), y1 = Math.min(b.y + b.h, tela.y + tela.h);
    box = box ? { x0: Math.min(box.x0, x0), y0: Math.min(box.y0, y0), x1: Math.max(box.x1, x1), y1: Math.max(box.y1, y1) } : { x0, y0, x1, y1 };
  }
  if (box) {
    const pad = 30 / v.zoom, w = Math.max(box.x1 - box.x0 + 2 * pad, tela.w / 4), h = Math.max(box.y1 - box.y0 + 2 * pad, tela.h / 4);
    box = { x: (box.x0 + box.x1) / 2 - w / 2, y: (box.y0 + box.y1) / 2 - h / 2, w, h };
  }
  try { const c = await PG.boardThumb(board, 480, 270, box); await saveThumb(id, c.toDataURL('image/png')); } catch {}
}

async function retryFailed() {
  clearTimeout(retryTimer);
  retryTimer = 0;
  if (saving) { retryTimer = setTimeout(retryFailed, 4000); return; }
  for (const [id, f] of [...failedSnaps]) {
    if (f.conflict) continue; // conflito exige decisão; nunca sobrescrever automaticamente
    const snap = S === f.state && dirtyVer > f.ver ? snapshot() : f;
    failedSnaps.set(id, snap);
    await writeSnapshot(snap);
  }
  if (savePending) { savePending = false; await doSave(); }
  clearTimeout(retryTimer);
  if ([...failedSnaps.values()].some(f => !f.conflict)) retryTimer = setTimeout(retryFailed, 4000);
}

async function writeSnapshot(snap) {
  saving = true;
  const st = $('bStatus');
  if (S === snap.state) st.textContent = 'Salvando…';
  try {
    await saveBoard(snap.id, snap.board, null);
    snap.state.board._rev = snap.board._rev;
    if (failedSnaps.get(snap.id) === snap) failedSnaps.delete(snap.id);
    if (S === snap.state) {
      savedVer = snap.ver;
      if (savedVer === dirtyVer) { st.textContent = 'Salvo'; st.classList.remove('err'); }
    }
    syncSaveError();
    scheduleThumb(snap.id);
  } catch (e) {
    snap.conflict = !!e.conflict;
    if (S === snap.state) { st.textContent = e.conflict ? e.message : 'Erro ao salvar — tentando de novo'; st.classList.add('err'); }
    if (e.conflict) toast(e.message, 12000);
    syncSaveError(); // aparece também na apresentação e no modo aula
    clearTimeout(retryTimer);
    if ([...failedSnaps.values()].some(f => !f.conflict)) retryTimer = setTimeout(retryFailed, 4000);
  } finally {
    saving = false;
  }
}

function syncSaveError() {
  const box = $('saveErr');
  box.hidden = failedSnaps.size === 0;
  box.textContent = [...failedSnaps.values()].some(f => f.conflict)
    ? 'Há conflito de edição. Abra o quadro e exporte sua edição como .lousa antes de recarregar.'
    : 'Não foi possível salvar: tentando de novo…';
}

async function doSave() {
  clearTimeout(saveTimer); saveTimer = 0;
  if (!S) return;
  if (saving) { savePending = true; return; }
  const previous = failedSnaps.get(S.id);
  const snap = snapshot();
  // Preserva a condição de conflito, mesmo se o professor continuar escrevendo.
  snap.conflict = previous?.conflict;
  failedSnaps.set(snap.id, snap);
  if (!snap.conflict) await writeSnapshot(snap);
  if (savePending) { savePending = false; await doSave(); }
}

export async function flush() {
  if (editing) commitText();
  if (saveTimer || savePending) await doSave();
  while (saving) await new Promise(r => setTimeout(r, 50));
  if (failedSnaps.size) await retryFailed();
  return failedSnaps.size === 0;
}

// fecha o quadro: grava, atualiza a miniatura e desliga todos os timers (nada mais regrava este quadro)
export async function closeBoard() {
  if (!S) return true;
  lockBars();
  stopPlotAnim();
  closeFloating();
  const ok = await flush();
  clearTimeout(thumbTimer); thumbTimer = 0;
  if (ok) await saveThumbNow();
  clearTimeout(saveTimer); saveTimer = 0;
  clearTimeout(viewChanged.t); clearTimeout(beautyTimer);
  pendingBeauty = []; beautyAnim = null; action = null; editing = null; sel = new Set();
  hidePop();
  S = null;
  return ok;
}

// gravação de emergência ao fechar a janela
const hasUnsavedChanges = () => failedSnaps.size > 0 || !!(S && (dirtyVer !== savedVer || saveTimer || saving));
function emergencySave() {
  const pending = new Map(failedSnaps);
  if (S && (dirtyVer !== savedVer || saveTimer || saving)) pending.set(S.id, { ...snapshot(), conflict: failedSnaps.get(S.id)?.conflict });
  for (const snap of pending.values()) {
    if (saving || snap.conflict) continue;
    const body = JSON.stringify({ title: snap.board.title, board: snap.board, revision: snap.board._rev || 0 });
    try { fetch('/api/boards/' + snap.id, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...tokenHeader() }, body, keepalive: new TextEncoder().encode(body).length < 60000 }).catch(() => {}); } catch {}
  }
  return pending.size > 0;
}

// ================= vista (zoom/pan) =================
function zoomAt(sx, sy, z) {
  z = Math.max(0.1, Math.min(8, z));
  const w = toWorld(sx, sy);
  S.view.zoom = z;
  S.view.x = sx - w.x * z;
  S.view.y = sy - w.y * z;
  viewChanged();
}
function viewChanged() {
  updateZoomLabel();
  updatePageBar();
  if (editing) positionTextEditor();
  requestRender();
  clearTimeout(viewChanged.t);
  const vid = S.id;
  viewChanged.t = setTimeout(() => { if (S?.id === vid) scheduleSave(); }, 1500);
}
function updateZoomLabel() { $('zLabel').textContent = Math.round(S.view.zoom * 100) + '%'; }

function fitView() {
  if (PG.isPages(S.board)) return goToPage(curPage());
  const b = R.unionBox(S.items);
  if (!b) { S.view = { x: 0, y: 0, zoom: 1 }; viewChanged(); return; }
  const mx = 90, my = 90;
  const z = Math.max(0.1, Math.min(2, (W - mx * 2) / b.w, (H - my * 2) / b.h));
  S.view = { zoom: z, x: W / 2 - (b.x + b.w / 2) * z, y: H / 2 - (b.y + b.h / 2) * z };
  viewChanged();
}

function onWheel(e) {
  e.preventDefault();
  if (zoomLens?.modo === 'escolher') { zoomLens.w = Math.max(120, Math.min(W * 0.9, zoomLens.w * (e.deltaY > 0 ? 1.1 : 0.9))); requestRender(false); return; }
  if (action?.type === 'draw') return;
  const w = toWorld(e.clientX, e.clientY);
  if (protractor && onProtractor(w.x, w.y) && !e.ctrlKey) {
    protractor.angle += Math.sign(e.deltaY) * (e.shiftKey ? 15 : 1);
    if (e.shiftKey) protractor.angle = Math.round(protractor.angle / 15) * 15;
    requestRender(false);
    return;
  }
  if (ruler && onRuler(w.x, w.y) && !e.ctrlKey) {
    const stepA = e.shiftKey ? 15 : 1;
    ruler.angle += Math.sign(e.deltaY) * stepA;
    if (e.shiftKey) ruler.angle = Math.round(ruler.angle / 15) * 15;
    requestRender(false);
    return;
  }
  if (e.ctrlKey) {
    const f = Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0025));
    zoomAt(e.clientX, e.clientY, S.view.zoom * f);
  } else {
    const k = e.deltaMode ? 40 : 1;
    S.view.x -= (e.shiftKey ? e.deltaY : e.deltaX) * k;
    S.view.y -= (e.shiftKey ? 0 : e.deltaY) * k;
    viewChanged();
  }
}

// ================= entrada do ponteiro =================
function pt(e) {
  const w = toWorld(e.clientX, e.clientY);
  let p = 0.5;
  if (e.pointerType === 'pen' && e.pressure > 0) p = Math.min(1, Math.pow(e.pressure, cfg.tablet.gamma));
  return { x: w.x, y: w.y, p, sx: e.clientX, sy: e.clientY };
}

function touchIds() { return [...pointers].filter(([, v]) => v.type === 'touch').map(([k]) => k); }

function startGesture() {
  const ids = touchIds().slice(0, 2);
  const [a, b] = ids.map(i => pointers.get(i));
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const wm = toWorld(mid.x, mid.y);
  action = {
    type: 'gesture', ids,
    d0: Math.hypot(b.x - a.x, b.y - a.y) || 1,
    a0: Math.atan2(b.y - a.y, b.x - a.x),
    z0: S.view.zoom, wm,
    ruler: ruler && onRuler(wm.x, wm.y) ? { ...ruler } : null,
    m0: mid,
  };
}

function onDown(e) {
  if (!S) return;
  if (zoomLens?.modo === 'escolher' && e.button === 0) { hover = { x: e.clientX, y: e.clientY }; ampliarAqui(); return; }
  if (editing) { $('textEdit').blur(); }
  clearTimeout(beautyTimer);
  hidePop();
  try { ov.setPointerCapture(e.pointerId); } catch {}
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
  if (e.pointerType === 'pen') penSeen = true;

  // dois dedos: zoom/pan (ou girar a régua)
  if (e.pointerType === 'touch' && touchIds().length === 2) {
    if (action?.type === 'draw' && pointers.get(action.id)?.type === 'pen') { pointers.delete(e.pointerId); return; }  // palma: ignora
    if (action?.type === 'draw' || action?.type === 'shape' || action?.type === 'lasso') action = null;
    if (action?.type === 'erase') action = null;
    startGesture();
    requestRender();
    return;
  }
  if (action) return;
  if (e.pointerType === 'touch' && pointers.size > 1) return;

  const P = pt(e);
  hover = { x: e.clientX, y: e.clientY, pen: penCursorFor(e) };

  // botão lateral da caneta (Windows Ink: botão 2 / buttons & 2) e ponta-borracha (botão 5 / buttons & 32)
  const eraserBtn = e.pointerType === 'pen' && (e.button === 5 || (e.buttons & 32));
  const barrel = e.pointerType === 'pen' && !eraserBtn && (e.button === 2 || (e.buttons & 2));
  const tt = cfg.tablet.touch;
  const touchPans = e.pointerType === 'touch' && (tt === 'pan' || (tt === 'auto' && penSeen));
  const pan = e.button === 1 || (e.button === 2 && !barrel) || spaceDown || touchPans || (barrel && cfg.tablet.barrel === 'pan');
  if (pan) {
    action = { type: 'pan', sx: e.clientX, sy: e.clientY, vx: S.view.x, vy: S.view.y, id: e.pointerId };
    setCursor('panning');
    return;
  }
  if (e.button !== 0 && e.pointerType === 'mouse') return;

  // régua: arrastar pelo corpo
  if (instrumentDown(e, P)) return;
  if (ruler && onRuler(P.x, P.y) && tool !== 'laser') {
    action = { type: 'ruler', id: e.pointerId, px: P.x, py: P.y, rx: ruler.x, ry: ruler.y };
    return;
  }

  // seleção existente: alça ou mover
  const sb = selBox();
  if (sb) {
    const hx = sb.x + sb.w, hy = sb.y + sb.h;
    if (Math.hypot(e.clientX - (sb.x + sb.w / 2), e.clientY - (sb.y - 30)) < 14) {
      const b = R.unionBox(S.items.filter(i => sel.has(i.id))), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      action = { type: 'rotate', id: e.pointerId, cx, cy, a0: Math.atan2(P.y - cy, P.x - cx), ang: 0 };
      return;
    }
    const hitHandle = Math.hypot(e.clientX - hx, e.clientY - hy) < 22;
    const inside = e.clientX >= sb.x && e.clientX <= hx && e.clientY >= sb.y && e.clientY <= hy;
    if (hitHandle || (inside && (tool === 'select' || tool === 'lasso'))) {
      const b = R.unionBox(S.items.filter(i => sel.has(i.id)));
      action = {
        type: 'transform', id: e.pointerId, mode: hitHandle ? 'scale' : 'move',
        x0: P.x, y0: P.y, dx: 0, dy: 0, s: 1, ox: b.x, oy: b.y, bw: b.w, bh: b.h, moved: false,
      };
      setCursor(hitHandle ? 'resize' : 'move');
      return;
    }
    if (tool !== 'select' && tool !== 'lasso') clearSel();
  }

  // botão de borracha da caneta
  let t = eraserBtn ? 'eraser' : tool;
  if (barrel && ['eraser', 'lasso', 'select', 'laser'].includes(cfg.tablet.barrel)) t = cfg.tablet.barrel;

  if (isPen(t) || t === 'highlighter') {
    const c = cfg.tools[t];
    if (isPen(t)) cfg.lastPen = t;
    const stroke = {
      id: newId(), type: 'stroke', tool: t === 'highlighter' ? 'highlighter' : 'pen',
      color: c.color, width: c.width / S.view.zoom, pr: t !== 'highlighter' && e.pointerType === 'pen' && cfg.tablet.pressure,
      pts: [P.x, P.y, P.p],
    };
    if (c.arrow && isPen(t)) stroke.arrow = true;
    if (isPen(t) && c.style && c.style !== 'normal') { stroke.style = c.style; stroke.pr = true; if (c.style === 'calligraphy') stroke.nib = c.nib ?? 45; }
    if (stroke.pr && cfg.tablet.taper) stroke.taper = true;
    if (cfg.tablet.beautify && isPen(t)) beautifyIfMovedOn(P.x, P.y);
    const stab = createStabilizer(cfg.tablet);
    const f0 = stab.push(e.clientX, e.clientY, P.p, e.timeStamp);
    if (f0) { const w0 = toWorld(f0.x, f0.y); stroke.pts = [w0.x, w0.y, f0.p]; }
    action = { type: 'draw', id: e.pointerId, stroke, snap: null, stab };
    if (ruler) {
      const { len, th } = rulerDims(), l = rulerLocal(P.x, P.y);
      const near = 48 / S.view.zoom;
      if (Math.abs(l.u) <= len / 2 + near && Math.abs(l.v) > th / 2 && Math.abs(l.v) < th / 2 + near) {
        action.snap = Math.sign(l.v) * (th / 2 + stroke.width / 2 + 1 / S.view.zoom);
        const q = rulerWorld(l.u, action.snap);
        stroke.pts = [q.x, q.y, P.p];
        stroke.pr = false;
      }
    }
    // transferidor: a caneta perto do arco ou da base corre presa à borda, como na régua
    const pe = action.snap == null && protEdge(P.x, P.y, stroke.width);
    if (pe) {
      action.snap = 'prot'; action.psnap = pe;
      const q = protSnap(pe, P.x, P.y);
      stroke.pts = [q.x, q.y, P.p];
      stroke.pr = false;
    }
  } else if (t === 'laser') {
    action = { type: 'laser', id: e.pointerId };
    laser.push({ x: P.x, y: P.y, t: performance.now(), brk: true });
  } else if (t === 'eraser') {
    action = { type: 'erase', id: e.pointerId, erased: new Set(), lx: P.x, ly: P.y };
    eraseAt(P.x, P.y);
  } else if (t === 'lasso') {
    action = { type: 'lasso', id: e.pointerId, poly: [P.x, P.y], sx: e.clientX, sy: e.clientY, shift: e.shiftKey };
  } else if (t === 'select') {
    const hit = topHit(P.x, P.y);
    if (hit) {
      const wasSel = sel.has(hit.id) && sel.size === 1;
      if (e.shiftKey) { const g = withGroups(new Set([hit.id])), on = !sel.has(hit.id); g.forEach(id => on ? sel.add(id) : sel.delete(id)); requestRender(false); return; }
      if (!sel.has(hit.id)) sel = withGroups(new Set([hit.id]));
      const b = R.unionBox(S.items.filter(i => sel.has(i.id)));
      action = { type: 'transform', id: e.pointerId, mode: 'move', x0: P.x, y0: P.y, dx: 0, dy: 0, s: 1, ox: b.x, oy: b.y, bw: b.w, bh: b.h, moved: false, editOnClick: wasSel && (hit.type === 'text' || hit.type === 'note') ? hit.id : null };
      setCursor('move');
    } else {
      if (!e.shiftKey) clearSel();
      action = { type: 'marquee', id: e.pointerId, x0: P.x, y0: P.y, x1: P.x, y1: P.y };
    }
    requestRender(false);
  } else if (t === 'text') {
    addText(P.x, P.y);
  } else if (t === 'compass') {
    compassDown(e, P);
  } else if (t === 'shape') {
    action = { type: 'shape', id: e.pointerId, x0: P.x, y0: P.y, item: null };
  }
  requestRender(false);
}

function onMove(e) {
  if (!S) return;
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
  if (action?.type === 'rotate' && e.pointerId === action.id) {
    const P = pt(e);
    let ang = Math.atan2(P.y - action.cy, P.x - action.cx) - action.a0;
    if (e.shiftKey) ang = Math.round(ang / (Math.PI / 12)) * Math.PI / 12;
    action.ang = ang;
    requestRender();
    return;
  }
  if (action && instrumentMove(e)) return;
  if (spot || zoomLens) requestRender(false);
  if (e.pointerType !== 'touch') {
    hover = { x: e.clientX, y: e.clientY, pen: penCursorFor(e) };
    if ((tool === 'eraser' || hover.pen) && !action) requestRender(false);
  }
  if (!action) { hoverCursor(e); return; }

  if (action.type === 'gesture') {
    const [a, b] = action.ids.map(i => pointers.get(i));
    if (!a || !b) return;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const d = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
    if (action.ruler) {
      ruler.angle = action.ruler.angle + (ang - action.a0) * 180 / Math.PI;
      const wm = toWorld(mid.x, mid.y), w0 = toWorld(action.m0.x, action.m0.y);
      ruler.x = action.ruler.x + wm.x - w0.x; ruler.y = action.ruler.y + wm.y - w0.y;
      requestRender(false);
    } else {
      const z = Math.max(0.1, Math.min(8, action.z0 * d / action.d0));
      S.view.zoom = z;
      S.view.x = mid.x - action.wm.x * z;
      S.view.y = mid.y - action.wm.y * z;
      viewChanged();
    }
    return;
  }
  if (e.pointerId !== action.id) return;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  const list = evs.length ? evs : [e];

  switch (action.type) {
    case 'pan':
      S.view.x = action.vx + e.clientX - action.sx;
      S.view.y = action.vy + e.clientY - action.sy;
      viewChanged();
      break;
    case 'ruler': {
      const P = pt(e);
      ruler.x = action.rx + P.x - action.px; ruler.y = action.ry + P.y - action.py;
      // mantém a régua presa ao ponteiro mesmo com o mundo fixo
      action.px = P.x; action.py = P.y; action.rx = ruler.x; action.ry = ruler.y;
      requestRender(false);
      break;
    }
    case 'draw': {
      const s = action.stroke, minD = 0.6 / S.view.zoom;
      for (const ce of list) {
        const P = pt(ce);
        const f = action.stab.push(P.sx, P.sy, P.p, ce.timeStamp);
        if (!f) continue;
        let { x, y } = toWorld(f.x, f.y);
        if (action.psnap) { const q = protSnap(action.psnap, x, y); x = q.x; y = q.y; }
        else if (action.snap != null) { const l = rulerLocal(x, y); const q = rulerWorld(l.u, action.snap); x = q.x; y = q.y; }
        const n = s.pts.length;
        if (Math.hypot(x - s.pts[n - 3], y - s.pts[n - 2]) < minD) continue;
        let pp = f.p;
        if (s.style === 'fountain') {
          // tinteiro: mais rápido = mais fino (velocidade em px de tela por ms)
          const v = action.lastT ? Math.hypot(f.x - action.lastF.x, f.y - action.lastF.y) / Math.max(1, ce.timeStamp - action.lastT) : 0;
          action.vel = (action.vel ?? v) * 0.7 + v * 0.3;
          pp = Math.max(0.12, Math.min(1, f.p * (1.35 - Math.min(1, action.vel * 0.55))));
        }
        action.lastT = ce.timeStamp; action.lastF = f;
        s.pts.push(x, y, pp);
      }
      action.pred = null;
      // previsão só sem estabilizador (prever o ponto cru contra a tinta filtrada causaria saltos)
      if (action.snap == null && !cfg.tablet.stab && !cfg.tablet.lazy && e.pointerType !== 'mouse' && e.getPredictedEvents) {
        const last = s.pts[s.pts.length - 1];
        action.pred = e.getPredictedEvents().slice(0, 2).flatMap(pe => { const q = pt(pe); return [q.x, q.y, last]; });
      }
      requestRender(false);
      break;
    }
    case 'laser':
      for (const ce of list) { const P = pt(ce); laser.push({ x: P.x, y: P.y, t: performance.now() }); }
      requestRender(false);
      break;
    case 'erase':
      for (const ce of list) {
        const P = pt(ce);
        const d = Math.hypot(P.x - action.lx, P.y - action.ly), stepD = Math.max(6, eraserR() / 2) / S.view.zoom;
        const n = Math.max(1, Math.ceil(d / stepD));
        for (let i = 1; i <= n; i++) eraseAt(action.lx + (P.x - action.lx) * i / n, action.ly + (P.y - action.ly) * i / n);
        action.lx = P.x; action.ly = P.y;
      }
      requestRender(false); // o círculo da borracha acompanha a caneta (a região apagada vai por requestDirty)
      break;
    case 'lasso': {
      const P = pt(e);
      const q = action.poly, n = q.length;
      if (Math.hypot(P.x - q[n - 2], P.y - q[n - 1]) * S.view.zoom >= 3) q.push(P.x, P.y);
      requestRender(false);
      break;
    }
    case 'marquee': {
      const P = pt(e);
      action.x1 = P.x; action.y1 = P.y;
      requestRender(false);
      break;
    }
    case 'shape': {
      const P = pt(e);
      let x2 = P.x, y2 = P.y;
      const { x0, y0 } = action;
      if (e.shiftKey) {
        if (isLineKind(shapeKind)) {
          const a = Math.round(Math.atan2(y2 - y0, x2 - x0) / (Math.PI / 12)) * Math.PI / 12, r = Math.hypot(x2 - x0, y2 - y0);
          x2 = x0 + r * Math.cos(a); y2 = y0 + r * Math.sin(a);
        } else {
          const m = Math.max(Math.abs(x2 - x0), Math.abs(y2 - y0));
          x2 = x0 + Math.sign(x2 - x0 || 1) * m; y2 = y0 + Math.sign(y2 - y0 || 1) * m;
        }
      }
      const ink = currentInk();
      action.item = {
        id: newId(), type: 'shape', kind: shapeKind, x1: x0, y1: y0, x2, y2, color: ink.color, width: Math.max(2, ink.width) / S.view.zoom,
        fill: cfg.shapeFill && !isLineKind(shapeKind) ? lighten(ink.color) : null, ...KIND_OF[shapeKind],
      };
      requestRender(false);
      break;
    }
    case 'transform': {
      const P = pt(e);
      if (action.mode === 'move') { action.dx = P.x - action.x0; action.dy = P.y - action.y0; }
      else {
        const bw = Math.max(action.bw, 1e-6), bh = Math.max(action.bh, 1e-6);
        const s = ((P.x - action.ox) * bw + (P.y - action.oy) * bh) / (bw * bw + bh * bh);
        action.s = Math.max(0.05, s || 1);
      }
      if (Math.hypot(action.dx, action.dy) * S.view.zoom > 3 || action.s !== 1) action.moved = true;
      requestRender();
      break;
    }
  }
}

function hoverCursor(e) {
  if (spaceDown) return;
  if (zoomLens?.modo === 'escolher') return setCursor('none');
  const sb = selBox();
  if (sb) {
    if (Math.hypot(e.clientX - sb.x - sb.w, e.clientY - sb.y - sb.h) < 22) return setCursor('resize');
    if ((tool === 'select' || tool === 'lasso') && e.clientX >= sb.x && e.clientX <= sb.x + sb.w && e.clientY >= sb.y && e.clientY <= sb.y + sb.h) return setCursor('move');
  }
  if (ruler) { const w = toWorld(e.clientX, e.clientY); if (onRuler(w.x, w.y)) return setCursor('move'); }
  setCursor(penCursorFor(e) && (isPen(tool) || tool === 'highlighter') ? 'none' : undefined);
}
// ponteiro desenhado (ponta, mira…) no lugar da cruz: sempre na caneta; no mouse, se a opção estiver ligada
function penCursorFor(e) { return e.pointerType === 'pen' || (e.pointerType === 'mouse' && cfg.tablet.mouseCursor !== false); }

function onUp(e) {
  pointers.delete(e.pointerId);
  if (!S || !action) return;
  if (action.type === 'gesture') {
    if (!action.ids.includes(e.pointerId)) return;
    action = null;
    requestRender();
    return;
  }
  if (e.pointerId !== action.id) return;
  const a = action;
  action = null;
  switch (a.type) {
    case 'pan': setCursor(); break;
    case 'rotate': if (a.ang) commit(S.items.map(i => sel.has(i.id) ? R.rotateItem(i, a.ang, a.cx, a.cy) : i)); else requestRender(); break;
    case 'compassR': case 'compassArc': case 'protractor': case 'curtain': case 'stripbox': instrumentUp(a); break;
    case 'draw': {
      let s = a.stroke;
      if (a.snap == null) {
        const fin = a.stab.end();
        if (fin) {
          const w = toWorld(fin.x, fin.y), n = s.pts.length;
          if (Math.hypot(w.x - s.pts[n - 3], w.y - s.pts[n - 2]) > 0.3 / S.view.zoom) s.pts.push(w.x, w.y, s.pts[n - 1]);
        }
        if (cfg.tablet.smoothUp && s.pts.length >= 12) s = { ...s, pts: smoothPts(s.pts, 1.6 / S.view.zoom, 2) };
      }
      if (cfg.inkShape && s.tool === 'pen' && a.snap == null && !s.arrow) {
        const shp = R.recognizeShape(s);
        if (shp) s = shp;
      }
      commit([...S.items, s]);
      if (cfg.tablet.beautify && a.snap == null && canBeautify(s)) pendingBeauty.push(s.id);
      break;
    }
    case 'erase':
      if (a.erased.size || a.parts?.size) {
        commit(S.items.flatMap(i => {
          if (a.erased.has(i.id)) return [];
          const parts = a.parts?.get(i.id);
          if (!parts) return [i];
          return parts.map((pc, k) => { const n = { ...i, id: k ? newId() : i.id, pts: pc, arrow: i.arrow && endsAt(pc, i.pts) }; delete n.orig; return n; });
        }));
      } else requestRender();
      break;
    case 'lasso': {
      const p = a.poly;
      const small = Math.hypot(e.clientX - a.sx, e.clientY - a.sy) < 6 && p.length < 12;
      if (small) {
        const hit = topHit(p[0], p[1]);
        sel = hit ? withGroups(new Set([hit.id])) : new Set();
      } else {
        if (!a.shift) sel = new Set();
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); }
        const pb = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
        for (const it of S.items) if (!it.locked && R.boxesTouch(R.bbox(it), pb) && R.inLasso(it, p)) sel.add(it.id);
        sel = withGroups(sel);
      }
      requestRender(false);
      break;
    }
    case 'marquee': {
      const box = { x: Math.min(a.x0, a.x1), y: Math.min(a.y0, a.y1), w: Math.abs(a.x1 - a.x0), h: Math.abs(a.y1 - a.y0) };
      if (box.w * S.view.zoom > 4 || box.h * S.view.zoom > 4)
        for (const it of S.items) {
          const b = R.bbox(it);
          if (!it.locked && b.x >= box.x && b.y >= box.y && b.x + b.w <= box.x + box.w && b.y + b.h <= box.y + box.h) sel.add(it.id);
        }
      sel = withGroups(sel);
      requestRender(false);
      break;
    }
    case 'shape':
      if (a.item && Math.hypot(a.item.x2 - a.item.x1, a.item.y2 - a.item.y1) * S.view.zoom > 4) {
        commit([...S.items, a.item]);
        sel = new Set([a.item.id]);
        setTool('select');
      } else requestRender(false);
      break;
    case 'transform':
      if (a.moved) {
        commit(S.items.map(i => sel.has(i.id) ? R.transformItem(i, a.dx, a.dy, a.s, a.ox, a.oy) : i));
      } else {
        if (a.editOnClick) startEdit(a.editOnClick);
        requestRender();
      }
      hoverCursor(e);
      break;
    default:
      requestRender(false);
  }
  if (pendingBeauty.length) { clearTimeout(beautyTimer); beautyTimer = setTimeout(runAutoBeauty, cfg.tablet.beautifyDelay || 700); }
}

// ================= embelezar escrita =================
function beautyPop(anchor) {
  const t = cfg.tablet, cur = t.beautify ? t.beautifyLevel : 'off';
  const opts = [['off', 'Desligado', 'escreve como está'], ['suave', 'Suave', 'endireita só um pouco'],
    ['moderado', 'Moderado', 'endireita e alinha as palavras'], ['forte', 'Forte', 'endireita, alinha e suaviza bastante']];
  showPop(anchor, `<h4>Embelezar ao escrever</h4><div class="menu beauty">${opts.map(([k, n, d]) =>
    `<button data-b="${k}" class="${k === cur ? 'on' : ''}"><b>${n}</b><small>${d}</small></button>`).join('')}</div>
    <h4>Aplicar depois de uma pausa de</h4><div class="seg">${[[400, '0,4 s'], [700, '0,7 s'], [1200, '1,2 s']].map(([v, n]) =>
      `<button data-d="${v}" class="${(t.beautifyDelay || 700) === v ? 'on' : ''}">${n}</button>`).join('')}</div>
    <small class="tb-note" style="display:block;margin-top:8px">Ao começar a próxima palavra, a anterior é ajustada na hora.<br>Para o que já está escrito: selecione com o laço e use ✦.</small>`, p => {
    p.querySelectorAll('[data-d]').forEach(x => x.onclick = () => {
      t.beautifyDelay = +x.dataset.d; saveCfg();
      p.querySelectorAll('[data-d]').forEach(y => y.classList.toggle('on', y === x));
    });
    p.querySelectorAll('[data-b]').forEach(x => x.onclick = () => {
      const k = x.dataset.b;
      t.beautify = k !== 'off';
      if (t.beautify) t.beautifyLevel = k;
      saveCfg(); syncToolbar(); hidePop();
      toast(t.beautify ? `Embelezar ao escrever: ${x.querySelector('b').textContent}` : 'Embelezar ao escrever: desligado');
    });
  });
}

// keep = true: o que não pôde ser embelezado ainda (pouco contexto) continua na fila para a próxima vez
function runAutoBeauty(keep = false) {
  if (!S || action || editing) { if (pendingBeauty.length) beautyTimer = setTimeout(runAutoBeauty, 600); return; }
  const ids = new Set(pendingBeauty);
  pendingBeauty = [];
  const items = S.items.filter(i => ids.has(i.id));
  if (!items.length) return;
  const done = applyBeauty(items, true, beautyContext(items));
  if (keep) pendingBeauty = items.filter(i => !done.has(i.id)).map(i => i.id);
}

function applyBeauty(items, animate, context = []) {
  const m = beautify(items, S.view.zoom, cfg.tablet.beautifyLevel || 'moderado', context);
  if (!m.size) return m;
  const before = new Map(items.map(i => [i.id, i]));
  commit(S.items.map(i => m.get(i.id) || i));
  if (animate) {
    // cada traço "desliza" do desenho original para o embelezado
    const from = new Map();
    for (const [id, n] of m) from.set(id, resampleN(before.get(id).pts, n.pts.length / 3));
    beautyAnim = { t0: performance.now(), from };
    requestRender();
  }
  return m;
}

// traços já embelezados perto dos novos: servem de referência e não se movem
function beautyContext(items) {
  const bs = items.map(i => ptsBox(i.pts));
  const x0 = Math.min(...bs.map(b => b.x0)), x1 = Math.max(...bs.map(b => b.x1));
  const y0 = Math.min(...bs.map(b => b.y0)), y1 = Math.max(...bs.map(b => b.y1));
  const h = Math.max(...bs.map(b => b.h)) || 1;
  const ids = new Set(items.map(i => i.id));
  return S.items.filter(i => i.orig && !ids.has(i.id) && canBeautify(i) && (() => {
    const b = ptsBox(i.pts);
    return b.x1 > x0 - 40 * h && b.x0 < x1 + 40 * h && b.y1 > y0 - h && b.y0 < y1 + h;
  })());
}

// começou a escrever longe da palavra pendente (próxima palavra ou outra linha): embeleza já, sem esperar a pausa
function beautifyIfMovedOn(wx, wy) {
  if (!pendingBeauty.length) return;
  const items = S.items.filter(i => pendingBeauty.includes(i.id));
  if (!items.length) { pendingBeauty = []; return; }
  const bs = items.map(i => ptsBox(i.pts));
  const x1 = Math.max(...bs.map(b => b.x1)), y0 = Math.min(...bs.map(b => b.y0)), y1 = Math.max(...bs.map(b => b.y1));
  const h = Math.max(4 / S.view.zoom, ...bs.map(b => b.h));
  // espaço maior que uma altura de letra = palavra nova (entre letras de forma o espaço é menor)
  if (wx > x1 + 1.0 * h || wy > y1 + 0.8 * h || wy < y0 - 1.5 * h) runAutoBeauty(true);
}

// forma da biblioteca: a borracha só apaga ao passar SOBRE o desenho dela (não em qualquer ponto do retângulo),
// para não levar junto a forma de fundo quando se apaga um traço escrito por cima. Foto e slide ficam protegidos.
const libMasks = new Map(); // lib → {w, h, a: alfa por pixel no tamanho natural}
function libMask(it) {
  if (libMasks.has(it.lib)) return libMasks.get(it.lib);
  const img = R.loadedImage(it);
  if (!img) return null;
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data, a = new Uint8Array(c.width * c.height);
  for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
  const m = { w: c.width, h: c.height, a };
  libMasks.set(it.lib, m);
  return m;
}
function hitLib(it, x, y, tol) {
  if (it.type !== 'image' || !it.lib || it.locked) return false;
  if (it.rot) { // desfaz o giro do ponto em torno do centro
    const cx = it.x + it.w / 2, cy = it.y + it.h / 2, c = Math.cos(-it.rot), s = Math.sin(-it.rot);
    [x, y] = [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
  }
  if (x < it.x - tol || x > it.x + it.w + tol || y < it.y - tol || y > it.y + it.h + tol) return false;
  const m = libMask(it);
  if (!m) return true; // imagem ainda carregando: vale o retângulo
  const kx = m.w / it.w, ky = m.h / it.h, r = Math.max(1, Math.round(tol * kx * 0.6));
  const u0 = Math.round((x - it.x) * kx), v0 = Math.round((y - it.y) * ky);
  for (let v = v0 - r; v <= v0 + r; v += Math.max(1, r >> 1))
    for (let u = u0 - r; u <= u0 + r; u += Math.max(1, r >> 1))
      if (u >= 0 && v >= 0 && u < m.w && v < m.h && m.a[v * m.w + u] > 40) return true;
  return false;
}

// raio da borracha em px de tela (ajustável no menu da borracha)
const ERASER_SIZES = [['P', 6], ['M', 12], ['G', 28], ['GG', 60]];
function eraserR() { return Math.max(3, Math.min(120, +cfg.eraserSize || 12)); }

function eraseAt(x, y) {
  const tol = eraserR() / S.view.zoom;
  if (cfg.eraserMode === 'partial') {
    // corta só os pontos dentro do círculo da borracha; o resto vira pedaços
    action.parts = action.parts || new Map();
    for (const it of S.items) {
      if (it.type !== 'stroke' || action.erased.has(it.id)) continue;
      if (action.parts.has(it.id)) {
        const b = R.bbox(it);
        if (x < b.x - tol || x > b.x + b.w + tol || y < b.y - tol || y > b.y + b.h + tol) continue;
      } else if (!R.hitItem(it, x, y, tol, true)) continue;
      const pieces = action.parts.get(it.id) || [it.pts];
      const r2 = (tol + it.width / 2) ** 2, out = [];
      let changed = false;
      for (const pc of pieces) {
        let run = [];
        for (let i = 0; i < pc.length; i += 3) {
          if ((pc[i] - x) ** 2 + (pc[i + 1] - y) ** 2 <= r2) { changed = true; if (run.length >= 6) out.push(run); run = []; }
          else run.push(pc[i], pc[i + 1], pc[i + 2]);
        }
        if (run.length >= 6) out.push(run);
      }
      if (changed) { action.parts.set(it.id, out); requestDirty(R.bbox(it)); } // o afinamento das pontas muda o pedaço inteiro
    }
    for (const it of S.items) if ((it.type === 'shape' && R.hitItem(it, x, y, tol, true) || hitLib(it, x, y, tol)) && !action.erased.has(it.id)) { action.erased.add(it.id); requestDirty(R.bbox(it)); }
    return;
  }
  for (const it of S.items) {
    if (action.erased.has(it.id)) continue;
    if ((it.type === 'stroke' || it.type === 'shape') && R.hitItem(it, x, y, tol, true) || hitLib(it, x, y, tol)) { action.erased.add(it.id); requestDirty(R.bbox(it)); }
  }
}

function topHit(x, y) {
  const tol = 6 / S.view.zoom;
  for (let i = S.items.length - 1; i >= 0; i--) if (!S.items[i].locked && R.hitItem(S.items[i], x, y, tol)) return S.items[i];
  return null;
}

function onDblClick(e) {
  if (!(tool === 'select' || tool === 'lasso' || tool === 'text')) return;
  const w = toWorld(e.clientX, e.clientY);
  const hit = topHit(w.x, w.y);
  if (hit && (hit.type === 'text' || hit.type === 'note')) startEdit(hit.id);
  else if (hit?.latex) formulaDialog(hit);
}

// ================= seleção =================
function clearSel() { if (sel.size) { sel = new Set(); requestRender(false); } }

function selAction(k, btn) {
  const ids = sel;
  if (k === 'delete') { commit(S.items.filter(i => !ids.has(i.id))); sel = new Set(); }
  else if (k === 'duplicate') duplicateSel();
  else if (k === 'group') groupSel();
  else if (k === 'ungroup') ungroupSel();
  else if (k === 'copy') { copySel(); toast('Copiado'); }
  else if (k === 'front') commit([...S.items.filter(i => !ids.has(i.id)), ...S.items.filter(i => ids.has(i.id))]);
  else if (k === 'back') commit([...S.items.filter(i => ids.has(i.id)), ...S.items.filter(i => !ids.has(i.id))]);
  else if (k === 'edit') { const it = byId([...sel][0]); if (it?.latex) formulaDialog(it); else startEdit(it.id); }
  else if (k === 'ocr') inkToText([...ids]);
  else if (k === 'font') fontPop(btn);
  else if (k === 'beautify') { if (!applyBeauty(S.items.filter(i => ids.has(i.id)), true).size) toast('Nada para embelezar: selecione linhas escritas à mão'); }
  else if (k === 'original') commit(S.items.flatMap(i => !ids.has(i.id) ? [i] : i.ink ? i.ink : [restoreOriginal(i)]));
  else if (k === 'color') {
    const notes = [...ids].every(id => byId(id)?.type === 'note');
    const pal = notes ? NOTE_COLORS : PALETTE;
    showPop(btn, `<div class="swatches" style="grid-template-columns:repeat(${notes ? 6 : 8},26px)">${pal.map(c => `<button class="sw" data-c="${c}" style="background:${c}" title="${corNome(c)}" aria-label="${corNome(c)}"></button>`).join('')}</div>`, p => {
      p.querySelectorAll('[data-c]').forEach(x => x.onclick = () => {
        const c = x.dataset.c;
        commit(S.items.map(i => {
          if (!ids.has(i.id)) return i;
          if (i.type === 'image') return i.lib ? recolorLib(i, c) : i;
          if (i.type === 'note') return notes ? { ...i, color: c } : i;
          const n = { ...i, color: c };
          if (i.type === 'shape' && i.fill) n.fill = lighten(c);
          return n;
        }));
        hidePop();
      });
    }, 'above');
  }
}

// grupos: itens com o mesmo `grp` são selecionados, movidos e girados juntos
function withGroups(set) {
  const g = new Set();
  for (const id of set) { const it = byId(id); if (it?.grp) g.add(it.grp); }
  if (!g.size) return set;
  const out = new Set(set);
  for (const it of S.items) if (it.grp && g.has(it.grp)) out.add(it.id);
  return out;
}
function groupSel() {
  if (sel.size < 2) return toast('Selecione dois ou mais elementos para agrupar');
  const grp = newId();
  commit(S.items.map(i => sel.has(i.id) ? { ...i, grp } : i));
  toast('Agrupado. Ctrl+Shift+G desagrupa.');
}
function ungroupSel() {
  if (![...sel].some(id => byId(id)?.grp)) return toast('A seleção não tem grupo');
  commit(S.items.map(i => sel.has(i.id) && i.grp ? (({ grp, ...r }) => r)(i) : i));
  toast('Desagrupado');
}
// cópias ganham grupos novos (a cópia não fica presa ao grupo original)
function regroup(items) {
  const m = new Map();
  return items.map(i => i.grp ? { ...i, grp: m.get(i.grp) || (m.set(i.grp, newId()), m.get(i.grp)) } : i);
}

function copySel() {
  clipboard = S.items.filter(i => sel.has(i.id)).map(i => structuredClone(i));
}
function freshIds(it) {
  const n = { ...it, id: newId() };
  if (it.ink) n.ink = it.ink.map(k => ({ ...k, id: newId() }));
  return n;
}
function pasteItems(items, offset = 24) {
  const d = offset / S.view.zoom;
  const fresh = regroup(items.map(i => freshIds(R.transformItem(i, d, d))));
  commit([...S.items, ...fresh]);
  sel = new Set(fresh.map(i => i.id));
  if (tool !== 'lasso') setTool('select');
  requestRender();
}
function duplicateSel() {
  if (!sel.size) return;
  pasteItems(S.items.filter(i => sel.has(i.id)));
}

// ================= texto e notas =================
function addText(x, y) {
  const it = { id: newId(), type: 'text', x, y: y - 14 / S.view.zoom, w: 40 / S.view.zoom, text: '', color: textColor(), size: 28 / S.view.zoom };
  S.items = [...S.items, it];
  startEdit(it.id, true);
}

function addNote(color) {
  const z = S.view.zoom, c = toWorld(W / 2, H / 2), sz = 220 / z;
  const off = (S.items.filter(i => i.type === 'note').length % 6) * 18 / z;
  const it = { id: newId(), type: 'note', x: c.x - sz / 2 + off, y: c.y - sz / 2 + off, w: sz, h: sz, text: '', color };
  commit([...S.items, it]);
  sel = new Set([it.id]);
  startEdit(it.id);
}

function startEdit(id, isNew = false) {
  if (editing && editing.id !== id) commitText();
  const it = byId(id);
  if (!it) return;
  editing = { id, isNew, before: it.text };
  const te = $('textEdit');
  te.value = it.text;
  te.className = it.type === 'note' ? 'note' : '';
  te.hidden = false;
  positionTextEditor();
  requestRender();
  setTimeout(() => { te.focus(); te.setSelectionRange(te.value.length, te.value.length); });
}

function positionTextEditor() {
  const it = byId(editing.id);
  if (!it) return;
  const te = $('textEdit'), z = S.view.zoom, a = toScreen(it.x, it.y);
  if (it.type === 'note') {
    const pad = it.w * 0.08 * z;
    te.style.left = a.x + pad + 'px'; te.style.top = a.y + pad + 'px';
    te.style.width = it.w * z - pad * 2 + 'px'; te.style.height = it.h * z - pad * 2 + 'px';
    te.style.fontSize = R.noteFontSize({ ...it, text: te.value || 'x' }) * z + 'px';
    te.style.color = '#252423';
  } else {
    te.style.left = a.x - 2 + 'px'; te.style.top = a.y - 2 + 'px';
    te.style.fontSize = it.size * z + 'px';
    te.style.fontFamily = R.fontOf(it);
    te.style.color = te.style.caretColor = inkShown(it.color);
    sizeTextEditor();
  }
}

function sizeTextEditor() {
  const it = editing && byId(editing.id);
  if (!it) return;
  const te = $('textEdit'), z = S.view.zoom;
  if (it.type === 'note') { te.style.fontSize = R.noteFontSize({ ...it, text: te.value || 'x' }) * z + 'px'; return; }
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = `${it.size * z}px "Segoe UI", system-ui, sans-serif`;
  const lines = te.value.split('\n');
  const w = Math.max(40, ...lines.map(l => meas.measureText(l).width)) + 24;
  te.style.width = Math.min(w, W - parseFloat(te.style.left) - 10) + 'px';
  te.style.height = 'auto';
  te.style.height = te.scrollHeight + 'px';
}

function commitText() {
  if (!editing) return;
  const { id, isNew, before } = editing;
  editing = null;
  const te = $('textEdit');
  te.hidden = true;
  const it = byId(id);
  if (!it) return requestRender();
  const text = te.value.replace(/\s+$/, '');
  if (it.type === 'text') {
    const others = S.items.filter(i => i.id !== id);
    if (!text.trim()) {
      if (isNew) { S.items = others; requestRender(); }
      else { commit(others); }
      return;
    }
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = `${it.size}px ${R.fontOf(it)}`;
    const w = Math.max(...text.split('\n').map(l => meas.measureText(l).width)) + 2;
    const n = { ...it, text, w };
    const base = isNew ? others : S.items;
    if (isNew) { S.items = others; commit([...others, n]); }
    else if (text !== before) commit(base.map(i => i.id === id ? n : i));
    else requestRender();
  } else {
    if (text !== before) commit(S.items.map(i => i.id === id ? { ...it, text } : i));
    else requestRender();
  }
}

// ================= imagens e colar =================
async function insertFiles(files, at) {
  const target = S;
  if (!target) return;
  let pos = at || toWorld(W / 2, H / 2);
  const added = [];
  for (const f of files) {
    try {
      const im = await readImageFile(f);
      if (S !== target) return toast('Importação cancelada: o quadro foi fechado.', 6000);
      const z = S.view.zoom;
      const k = Math.min(1 / z, (W * 0.6) / z / im.w, (H * 0.6) / z / im.h);
      const w = im.w * k, h = im.h * k;
      let src = im.src;
      try { src = await uploadAsset(im.src); } catch {}
      if (S !== target) return toast('Importação cancelada: o quadro foi fechado.', 6000);
      added.push({ id: newId(), type: 'image', x: pos.x - w / 2, y: pos.y - h / 2, w, h, src });
      pos = { x: pos.x + 30 / z, y: pos.y + 30 / z };
    } catch (e) { toast(e.message); }
  }
  if (!added.length) return;
  commit([...S.items, ...added]);
  sel = new Set(added.map(i => i.id));
  setTool('select');
}

async function onPaste(e) {
  if (!isOpen() || editing || e.target.tagName === 'INPUT') return;
  const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
  if (files.length) { e.preventDefault(); return insertFiles(files); }
  const txt = e.clipboardData?.getData('text/plain');
  if (clipboard?.length && !txt) { e.preventDefault(); return pasteItems(clipboard); }
  if (txt) {
    e.preventDefault();
    const c = toWorld(W / 2, H / 2), z = S.view.zoom;
    const it = { id: newId(), type: 'text', x: c.x, y: c.y, w: 10, text: txt, color: textColor(), size: 24 / z };
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = `${it.size}px "Segoe UI", sans-serif`;
    it.w = Math.max(...txt.split('\n').map(l => meas.measureText(l).width)) + 2;
    commit([...S.items, it]);
    sel = new Set([it.id]);
    setTool('select');
  }
}

// ================= teclado =================
function onKey(e) {
  if (!isOpen()) return;
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || document.querySelector('dialog[open]')) return;
  const k = e.key.toLowerCase(), ctrl = e.ctrlKey || e.metaKey;
  if (e.code === 'Space') { if (!spaceDown) { spaceDown = true; setCursor(); } e.preventDefault(); return; }
  if (ctrl && k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  else if (ctrl && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  else if (ctrl && k === 'c') { if (sel.size) { copySel(); navigator.clipboard?.writeText?.('').catch(() => {}); } }
  else if (ctrl && k === 'x') { if (sel.size) { copySel(); commit(S.items.filter(i => !sel.has(i.id))); sel = new Set(); } }
  else if (ctrl && k === 'd') { e.preventDefault(); duplicateSel(); }
  else if (ctrl && k === 'g') { e.preventDefault(); if (e.shiftKey) ungroupSel(); else groupSel(); }
  else if (ctrl && k === 'a') { e.preventDefault(); sel = new Set(S.items.filter(i => !i.locked).map(i => i.id)); setTool('select'); }
  else if (ctrl && k === '0') { e.preventDefault(); fitView(); }
  else if (ctrl && (k === '=' || k === '+')) { e.preventDefault(); zoomAt(W / 2, H / 2, S.view.zoom * 1.25); }
  else if (ctrl && k === '-') { e.preventDefault(); zoomAt(W / 2, H / 2, S.view.zoom / 1.25); }
  else if (ctrl && k === 's') { e.preventDefault(); doSave(); }
  else if (ctrl) return;
  else if (e.key === 'Delete' || e.key === 'Backspace') { if (sel.size) { commit(S.items.filter(i => !sel.has(i.id))); sel = new Set(); } }
  else if (e.key === 'Escape') { if (zoomLens) { if (zoomLens.modo === 'ampliado') sairZoomLens(); else toggleZoomLens(); } else if (present) setPresent(false); else { clearSel(); hidePop(); } }
  else if (e.key === 'Tab') { e.preventDefault(); setClean(!document.getElementById('board').classList.contains('clean')); }
  else if (PG.isPages(S.board) && ['PageDown', 'ArrowRight', 'ArrowDown'].includes(e.key) && (present || e.key === 'PageDown') && !sel.size) { e.preventDefault(); goToPage(curPage() + 1, present); }
  else if (PG.isPages(S.board) && ['PageUp', 'ArrowLeft', 'ArrowUp'].includes(e.key) && (present || e.key === 'PageUp') && !sel.size) { e.preventDefault(); goToPage(curPage() - 1, present); }
  else if (present && k === 'b') addBlankAfter();
  else if (e.key === 'Enter' && sel.size === 1) { const it = byId([...sel][0]); if (it && (it.type === 'text' || it.type === 'note')) { e.preventDefault(); startEdit(it.id); } }
  else if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
  else if (k === 'p') setTool(isPen(tool) ? tool : (cfg.lastPen || 'pen0'));
  else if (k >= '1' && k <= '4') setTool('pen' + (+k - 1));
  else if (k === 'h') setTool('highlighter');
  else if (k === 'e') setTool('eraser');
  else if (k === 'l') setTool('lasso');
  else if (k === 'v') setTool('select');
  else if (k === 't') setTool('text');
  else if (k === 'r') toggleRuler();
  else if (k === 'k') setTool('laser');
  else if (k === 'z') toggleZoomLens();
  else if (e.key === '[' || e.key === ']') stepWidth(e.key === ']' ? 1 : -1);
}

// ================= menu / exportação =================
// barras, barra do professor, painel da lupa, cronômetro e relógio de volta às posições de fábrica
function layoutPadrao() {
  resetBars();
  cfg.teachSide = 'dir'; cfg.teachNames = false; saveCfg();
  for (const k of ['lousa.stripPos', 'lousa.timerPos', 'lousa.clockPos']) try { localStorage.removeItem(k); } catch {}
  const st = $('strip'); st.style.top = ''; st.style.bottom = '';
  for (const el of document.querySelectorAll('.timerbox')) { el.style.left = el.style.top = el.style.right = el.style.bottom = ''; }
  buildTeachBar(); placeBars();
  toast('Layout padrão: barras e painéis de volta ao lugar de fábrica');
}

function openMenu(anchor) {
  showPop(anchor, `<div class="menu">
      <button data-a="bg">${ICON.paper} Folha e fundo</button>
      ${PG.isPages(S.board) ? `<button data-a="pages">${ICON.gallery} Páginas…</button>` : `<button data-a="toA4">${ICON.slides} Transformar em caderno A4</button>`}
      <button data-a="slides">${ICON.slides} Inserir PowerPoint ou PDF…</button>
      <button data-a="present">${ICON.present} Apresentar (tela cheia)</button>
      <hr>
      <button data-a="pdf">${ICON.pdf} Exportar PDF</button>
      <button data-a="print">${ICON.print} Imprimir</button>
      <button data-a="png">${ICON.image} Exportar imagem (PNG)</button>
      <hr>
      <button data-a="pngT">${ICON.image} Exportar imagem sem fundo</button>
      <button data-a="lousa">${ICON.download} Exportar arquivo .lousa</button>
      <hr>
      <button data-a="tablet">${ICON.pen} Caneta e escrita</button>
      <button data-a="bars">${ICON.restore} Voltar ao layout padrão (barras e painéis)</button>
      <button data-a="disc">${ICON.shapes} Disciplinas das formas…</button>
      <button data-a="keys">${ICON.keyboard} Atalhos de teclado</button>
      <button data-a="about">${ICON.ok} Sobre o Giz Livre</button>
      <hr>
      <button data-a="clear" class="danger">${ICON.trash} Limpar o quadro…</button>
    </div>`, p => {
    p.querySelector('[data-a="bg"]').onclick = () => { hidePop(); bgPop(anchor); };
    p.querySelector('[data-a="png"]').onclick = () => { hidePop(); exportPng(); };
    p.querySelector('[data-a="pdf"]').onclick = () => { hidePop(); exportPdfFile(); };
    p.querySelector('[data-a="print"]').onclick = () => { hidePop(); printNow(); };
    p.querySelector('[data-a="slides"]').onclick = () => { hidePop(); $('slideFile').click(); };
    p.querySelector('[data-a="present"]').onclick = () => { hidePop(); setPresent(true); };
    p.querySelector('[data-a="pages"]')?.addEventListener('click', () => { hidePop(); togglePagesPanel(true); });
    p.querySelector('[data-a="toA4"]')?.addEventListener('click', () => { hidePop(); convertToA4(); });
    p.querySelector('[data-a="clear"]').onclick = () => { hidePop(); clearBoard(); };
    p.querySelector('[data-a="pngT"]').onclick = () => { hidePop(); exportPng(true); };
    p.querySelector('[data-a="lousa"]').onclick = () => { hidePop(); exportLousa(); };
    p.querySelector('[data-a="keys"]').onclick = () => { hidePop(); showKeys(); };
    p.querySelector('[data-a="disc"]').onclick = () => { hidePop(); escolherDisciplinas(); };
    p.querySelector('[data-a="about"]').onclick = () => { hidePop(); aboutBox(VERSION); };
    p.querySelector('[data-a="tablet"]').onclick = () => { hidePop(); openTabletSettings(cfg.tablet, saveCfg); };
    p.querySelector('[data-a="bars"]').onclick = () => { hidePop(); layoutPadrao(); };
  });
}

function bgPop(anchor) {
  const bg = S.board.background;
  const sizes = [['s', 'P'], ['m', 'M'], ['l', 'G']], strengths = [['soft', 'Suave'], ['normal', 'Normal'], ['strong', 'Forte']];
  const LINE_COLORS = ['', '#0078d4', '#e81224', '#16c60c', '#7a7574', '#ffffff'];
  const pat = bg.pattern || 'none';
  // folhas em abas por área; folhas ligadas a disciplinas ocultas não aparecem (a atual sempre aparece)
  const nomeDe = new Map(PAPERS), ocultas = abasOcultas(), disc = PAPER.PAPER_DISC || {};
  const visivel = k => k === pat || !disc[k] || disc[k].some(d => !ocultas.has(d));
  const grupos = (PAPER.PAPER_GROUPS || [['Folhas', PAPERS.map(([k]) => k)]])
    .map(([n, ks]) => [n, ks.filter(k => nomeDe.has(k) && visivel(k))]).filter(([, ks]) => ks.length);
  const abaAtual = grupos.find(([, ks]) => ks.includes(pat))?.[0];
  const aba = grupos.some(([n]) => n === cfg.paperTab) ? cfg.paperTab : abaAtual || grupos[0][0];
  const cartoes = n => (grupos.find(([g]) => g === n)?.[1] || []).map(k => `<button class="paper${k === pat ? ' on' : ''}" data-p="${k}"><canvas width="96" height="58"></canvas><span>${esc(nomeDe.get(k))}</span></button>`).join('');
  showPop(anchor, `
    <h4>Folha</h4>
    ${grupos.length > 1 ? `<div class="seg paper-tabs">${grupos.map(([n]) => `<button data-pt="${esc(n)}" class="${n === aba ? 'on' : ''}">${esc(n)}</button>`).join('')}</div>` : ''}
    <div class="papers" id="bgPapers">${cartoes(aba)}</div>
    <div class="bg-row">
      <div><h4>Tamanho da malha</h4><div class="seg">${sizes.map(([k, n]) => `<button class="${(bg.size || 'm') === k ? 'on' : ''}" data-s="${k}">${n}</button>`).join('')}</div></div>
      <div><h4>Intensidade</h4><div class="seg">${strengths.map(([k, n]) => `<button class="${(bg.strength || 'normal') === k ? 'on' : ''}" data-st="${k}">${n}</button>`).join('')}</div></div>
    </div>
    <h4>Cor das linhas</h4><div class="swatches">${LINE_COLORS.map(c => c ? `<button class="sw${bg.lineColor === c ? ' on' : ''}" data-lc="${c}" style="background:${c}"></button>` : `<button class="sw auto${!bg.lineColor ? ' on' : ''}" data-lc="" title="Automática">A</button>`).join('')}</div>
    <h4>Cor do fundo</h4><div class="swatches">${BG_COLORS.map(c => `<button class="sw sq${c === bg.color ? ' on' : ''}" data-c="${c}" style="background:${c}" title="${corNome(c)}" aria-label="${corNome(c)}"></button>`).join('')}</div>
    ${ANCHORED.has(pat) ? '<button class="btn" id="bgOrigin" style="margin-top:12px">Trazer a folha para o centro da tela</button>' : ''}`, p => {
    const previa = () => p.querySelectorAll('.paper').forEach(b => {
      const k = b.dataset.p, zoom = PAPER.PAPER_PREVIEW?.[k] ?? (k === 'cornell' ? 0.034 : k === 'polar' ? 0.35 : 0.5);
      R.drawBackground(b.querySelector('canvas').getContext('2d'), { ...S.board.background, pattern: k, origin: { x: 0, y: 0 } }, { x: 48, y: 29, zoom }, 96, 58);
    });
    previa();
    const center = () => { const c = toWorld(W / 2, H / 2); return { x: Math.round(c.x), y: Math.round(c.y) }; };
    const set = patch => {
      undoStack.push(histEntry()); redoStack = [];   // trocar folha/cor também se desfaz com Ctrl+Z
      S.board.background = { ...S.board.background, ...patch };
      updateUndo(); requestRender(); scheduleSave(); syncToolbar();
      hidePop(); bgPop(anchor);
    };
    const ligaFolhas = () => p.querySelectorAll('[data-p]').forEach(x => x.onclick = () => set(ANCHORED.has(x.dataset.p) ? { pattern: x.dataset.p, origin: center() } : { pattern: x.dataset.p }));
    ligaFolhas();
    p.querySelectorAll('[data-pt]').forEach(x => x.onclick = () => {
      cfg.paperTab = x.dataset.pt; saveCfg();
      p.querySelectorAll('[data-pt]').forEach(y => y.classList.toggle('on', y === x));
      p.querySelector('#bgPapers').innerHTML = cartoes(x.dataset.pt); previa(); ligaFolhas();
    });
    p.querySelectorAll('[data-s]').forEach(x => x.onclick = () => set({ size: x.dataset.s }));
    p.querySelectorAll('[data-st]').forEach(x => x.onclick = () => set({ strength: x.dataset.st }));
    p.querySelectorAll('[data-lc]').forEach(x => x.onclick = () => set({ lineColor: x.dataset.lc || null }));
    p.querySelectorAll('[data-c]').forEach(x => x.onclick = () => set({ color: x.dataset.c }));
    p.querySelector('#bgOrigin')?.addEventListener('click', () => set({ origin: center() }));
  });
}

async function exportPng(transparent = false) {
  if (!S.items.length) return toast('O quadro está vazio');
  const title = S.board.title;
  toast('Gerando imagem…');
  const c = await R.renderToCanvas({ ...S.board, items: S.items }, { scale: 2, transparent });
  c.toBlob(b => download(b, safeName(title) + '.png'), 'image/png');
}
async function exportLousa() {
  const data = { ...S.board, items: S.items, view: { ...S.view } };
  delete data._rev; // revisão pertence ao arquivo de origem, não à cópia portátil
  try {
    data.items = await embedAssets(data.items);
    download(new Blob([JSON.stringify(data)], { type: 'application/json' }), safeName(data.title) + '.lousa');
  } catch (e) { toast(e.message, 8000); }
}
export async function embedAssets(items) {
  const cache = new Map();
  return Promise.all(items.map(async it => {
    if (it.type !== 'image' || typeof it.src !== 'string' || !it.src.startsWith('/assets/')) return it;
    if (!cache.has(it.src)) cache.set(it.src, fetch(it.src).then(r => {
      if (!r.ok || !r.headers.get('Content-Type')?.startsWith('image/')) throw new Error('Exportação interrompida: imagem ausente ou inválida (' + it.src + ').');
      return r.blob();
    }).then(b => new Promise((res, reject) => {
      const fr = new FileReader(); fr.onload = () => res(fr.result);
      fr.onerror = () => reject(new Error('Não foi possível ler uma imagem para exportar.'));
      fr.readAsDataURL(b);
    })));
    return { ...it, src: await cache.get(it.src) };
  }));
}

function showKeys() {
  const grupos = [
    ['Ferramentas', [['1 a 4', 'Canetas 1 a 4 (P volta à última)'], ['H', 'Marca-texto'], ['K', 'Ponteiro laser'], ['E', 'Borracha'],
      ['L', 'Laço'], ['V', 'Selecionar'], ['T', 'Texto'], ['R', 'Régua (gire com a roda do mouse; Shift = 15°)'],
      ['[  /  ]', 'Caneta mais fina / mais grossa'], ['Botão lateral da caneta', 'Borracha (muda em Caneta e escrita)']]],
    ['Seleção e edição', [['Ctrl + Z / Ctrl + Y', 'Desfazer / refazer (Ctrl + Shift + Z também refaz)'],
      ['Ctrl + C / X / V / D', 'Copiar / recortar / colar / duplicar'], ['Ctrl + A', 'Selecionar tudo'],
      ['Ctrl + G / Ctrl + Shift + G', 'Agrupar / desagrupar'], ['Del ou Backspace', 'Excluir a seleção'],
      ['Enter', 'Editar o texto ou a nota selecionada'], ['Esc', 'Tirar a seleção, fechar menus, sair da apresentação']]],
    ['Páginas e apresentação', [['PageDown / PageUp', 'Próxima / página anterior'], ['→ ← (na apresentação)', 'Passar as páginas'],
      ['B (na apresentação)', 'Página em branco depois desta'], ['Tab', 'Modo aula: esconde / mostra as barras']]],
    ['Vista e arquivo', [['Espaço + arrastar', 'Mover o quadro'], ['Botão do meio ou direito do mouse', 'Mover o quadro'],
      ['Ctrl + roda', 'Zoom'], ['Ctrl + = / Ctrl + −', 'Aumentar / diminuir o zoom'], ['Ctrl + 0', 'Ajustar à tela'], ['Z', 'Lupa: escolher uma área e ampliar (Z ou Esc volta)'],
      ['Ctrl + S', 'Salvar agora'], ['F11', 'Tela cheia']]],
  ];
  infoBox('Atalhos de teclado', grupos.map(([g, rows]) => `<h4 class="keys-g">${g}</h4><div class="keys">${rows.map(([a, b]) => `<kbd>${a}</kbd><span>${b}</span>`).join('')}</div>`).join(''));
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
}

function lighten(hex) {
  const c = hex.replace('#', '');
  const m = i => Math.round(parseInt(c.slice(i, i + 2), 16) * 0.25 + 255 * 0.75).toString(16).padStart(2, '0');
  return '#' + m(0) + m(2) + m(4);
}

function stepWidth(dir) {
  const t = isPen(tool) || tool === 'highlighter' ? tool : (cfg.lastPen || 'pen0');
  const list = t === 'highlighter' ? HL_WIDTHS : PEN_WIDTHS, c = cfg.tools[t];
  let i = list.findIndex(w => w >= c.width);
  if (i < 0) i = list.length - 1;
  c.width = list[Math.max(0, Math.min(list.length - 1, i + dir))];
  saveCfg();
  toast('Espessura: ' + c.width);
  requestRender(false);
}

export function tabletCfg() { return cfg.tablet; }
export function saveTabletCfg() { saveCfg(); }


// ================= páginas (caderno A4 / slides) =================
let present = false;
function curPage() {
  if (!S || !PG.isPages(S.board)) return 0;
  return PG.pageIndexAt(S.board.layout, toWorld(W / 2, H / 2).y);
}

// enquadra a página i (fill: ocupa a tela toda, para apresentar)
function goToPage(i, fill = false) {
  if (!S || !PG.isPages(S.board)) return;
  if (zoomLens) { zoomLens = null; syncPresentBar(); }   // mudar de página desfaz a lupa
  const L = S.board.layout;
  i = Math.max(0, Math.min(L.count - 1, i));
  const r = PG.pageRect(L, i), m = fill ? 0 : 28, top = fill ? 0 : 64, bottom = fill ? 0 : 70;
  const z = Math.max(0.1, Math.min(4, Math.min((W - m * 2) / r.w, (H - top - bottom) / r.h)));
  S.view = { zoom: z, x: W / 2 - (r.x + r.w / 2) * z, y: top + (H - top - bottom) / 2 - (r.y + r.h / 2) * z };
  viewChanged();
}

function updatePageBar() {
  const bar = $('pagebar');
  if (!bar) return;
  const on = !!S && PG.isPages(S.board);
  bar.hidden = !on;
  if (!on) return;
  const n = S.board.layout.count, c = curPage() + 1;
  $('pgLabel').textContent = `Página ${c} de ${n}`;
  $('ppLabel').textContent = `${c} / ${n}`;
  if (!$('pagesPanel').hidden) markPanel();
}

function itemsShift(items, fromY, dy) {
  return items.map(it => { const b = R.bbox(it); return b.y + b.h / 2 > fromY ? R.transformItem(it, 0, dy) : it; });
}

function insertPageAfter(i, extra = []) {
  const L = S.board.layout, step = L.h + L.gap, cut = PG.pageRect(L, i).y + L.h + L.gap / 2;
  const items = itemsShift(S.items, cut, step);
  commit([...items, ...extra.map(it => R.transformItem(it, 0, 0))], { ...L, count: L.count + 1 });
  goToPage(i + 1, present);
  refreshPanel();
}
function addBlankAfter() { insertPageAfter(curPage()); toast('Página em branco inserida'); }

function duplicatePage(i) {
  const L = S.board.layout, step = L.h + L.gap;
  const copies = regroup(S.items.filter(it => PG.pageOf(L, it) === i).map(it => freshIds(R.transformItem(it, 0, step))));
  insertPageAfter(i, copies);
}

async function deletePage(i) { return deletePages([i]); }

// exclui várias páginas de uma vez (ex.: 2 páginas de um PDF de 20); um único passo no desfazer
async function deletePages(list) {
  const L = S.board.layout;
  const idx = [...new Set(list)].filter(i => i >= 0 && i < L.count).sort((a, b) => b - a);
  if (!idx.length) return;
  if (idx.length >= L.count) return toast('O caderno precisa de pelo menos uma página');
  const nomes = idx.length === 1 ? `a página ${idx[0] + 1}` : `${idx.length} páginas (${[...idx].reverse().map(i => i + 1).join(', ')})`;
  const temAlgo = S.items.some(it => idx.includes(PG.pageOf(L, it)));
  if (temAlgo && !await confirmBox(`Excluir ${nomes}?`, 'O que estiver nelas (inclusive o PDF/slide) será apagado. Dá para desfazer com Ctrl+Z.', 'Excluir', true)) return;
  const step = L.h + L.gap;
  let items = S.items;
  for (const i of idx) {   // da última para a primeira: os índices das que faltam não mudam
    const cut = PG.pageRect(L, i).y + L.h + L.gap / 2;
    items = itemsShift(items.filter(it => PG.pageOf(L, it) !== i), cut, -step);
  }
  clearSel();
  commit(items, { ...L, count: L.count - idx.length });
  goToPage(Math.min(idx[idx.length - 1], L.count - idx.length - 1), present);
  panelSel.clear();
  refreshPanel(true);
  toast(idx.length === 1 ? 'Página excluída' : `${idx.length} páginas excluídas`);
}

function addPageEnd() { insertPageAfter(S.board.layout.count - 1); }

async function convertToA4() {
  const kinds = Object.entries(PG.SIZES).filter(([k]) => k.startsWith('a'));
  showPop($('bMenu'), `<h4>Transformar em caderno</h4><div class="menu">${kinds.map(([k, s]) => `<button data-k="${k}">${s.label}</button>`).join('')}</div>
    <small class="tb-note">O conteúdo atual vai para o início da primeira página; dá para desfazer.</small>`, p => {
    p.querySelectorAll('[data-k]').forEach(x => x.onclick = () => {
      hidePop();
      const lay = PG.makeLayout(x.dataset.k, 1);
      const b = R.unionBox(S.items);
      let items = S.items;
      if (b) {
        items = S.items.map(it => R.transformItem(it, 40 - b.x, 40 - b.y));
        lay.count = Math.max(1, Math.ceil((b.h + 80) / (lay.h + lay.gap)));
      }
      commit(items, lay);
      goToPage(0);
    });
  });
}

async function importSlidesIntoBoard(file) {
  try {
    toast('Importando ' + file.name + '…', 60000);
    const alvo = S;
    const { size, srcs, sizes } = await slidesFromFile(file, m => toast(m, 60000));
    if (S !== alvo) return toast('Importação cancelada: o quadro foi fechado durante a conversão.', 6000);
    let L = S.board.layout, items = S.items, start;
    if (!PG.isPages(S.board)) {
      L = PG.makeLayout('custom', srcs.length, size);
      // o conteúdo livre que já existia vai para depois dos slides
      const b = R.unionBox(items);
      if (b) { const y0 = srcs.length * (L.h + L.gap); items = items.map(it => R.transformItem(it, 40 - b.x, y0 + 40 - b.y)); L.count += Math.ceil((b.h + 80) / (L.h + L.gap)); }
      start = 0;
    } else {
      start = curPage() + 1;
      const cut = PG.pageRect(L, start - 1).y + L.h + L.gap / 2;
      items = itemsShift(items, cut, srcs.length * (L.h + L.gap));
      L = { ...L, count: L.count + srcs.length };
    }
    commit([...items, ...slideItems(L, srcs, start, sizes)], L);
    goToPage(start);
    toast(`${srcs.length} página(s) importada(s)`);
    refreshPanel();
  } catch (e) { toast(e.message, 7000); }
}

async function exportPdfFile() {
  const title = S.board.title;
  try {
    toast('Gerando PDF…', 30000);
    const blob = await PG.exportPdf({ ...S.board, items: S.items });
    download(blob, safeName(title) + '.pdf');
    toast('PDF pronto');
  } catch (e) { toast(e.message, 6000); }
}
async function printNow() {
  toast('Preparando impressão…');
  await PG.printBoard({ ...S.board, items: S.items });
}

// painel lateral com as miniaturas das páginas
function togglePagesPanel(show) {
  const p = $('pagesPanel');
  p.hidden = !show;
  if (show) refreshPanel(true);
}
let panelTimer = 0;
const panelSel = new Set();   // páginas marcadas no painel para excluir de uma vez
function syncPanelSel() {
  const b = $('ppDel');
  if (b) { b.hidden = !panelSel.size; b.textContent = `Excluir ${panelSel.size} página${panelSel.size > 1 ? 's' : ''}`; }
}
function refreshPanel(now = false) {
  const p = $('pagesPanel');
  if (!p || p.hidden || !S || !PG.isPages(S.board)) return;
  clearTimeout(panelTimer);
  panelTimer = setTimeout(async () => {
    const L = S.board.layout, list = $('ppList');
    list.innerHTML = '';
    for (const i of [...panelSel]) if (i >= L.count) panelSel.delete(i);
    for (let i = 0; i < L.count; i++) {
      const b = document.createElement('div');
      b.className = 'pthumb'; b.dataset.i = i; b.tabIndex = 0;
      const c = await PG.renderPage({ ...S.board, items: S.items }, i, 150 / L.w);
      c.className = 'pcanvas';
      const ck = Object.assign(document.createElement('input'), { type: 'checkbox', className: 'pp-ck', title: 'Marcar para excluir', checked: panelSel.has(i) });
      ck.onclick = e => { e.stopPropagation(); ck.checked ? panelSel.add(i) : panelSel.delete(i); b.classList.toggle('marked', ck.checked); syncPanelSel(); };
      const del = Object.assign(document.createElement('button'), { className: 'ib pp-del', title: 'Excluir esta página', innerHTML: ICON.trash });
      del.onclick = e => { e.stopPropagation(); deletePages([i]); };
      b.classList.toggle('marked', panelSel.has(i));
      b.append(c, Object.assign(document.createElement('span'), { textContent: i + 1 }), ck, del);
      b.onclick = () => goToPage(i);
      b.onkeydown = e => { if (e.key === 'Enter') goToPage(i); if (e.key === 'Delete') deletePages([i]); };
      list.appendChild(b);
    }
    syncPanelSel();
    markPanel();
  }, now ? 0 : 600);
}
function markPanel() {
  const c = curPage();
  document.querySelectorAll('#ppList .pthumb').forEach(b => b.classList.toggle('on', +b.dataset.i === c));
}

function pageMenu(anchor) {
  const i = curPage();
  showPop(anchor, `<div class="menu">
      <button data-a="ins">${ICON.plus} Nova página depois desta</button>
      <button data-a="dup">${ICON.copy} Duplicar esta página</button>
      <button data-a="del" class="danger">${ICON.trash} Excluir esta página</button>
      <hr>
      <button data-a="all">${ICON.gallery} Ver todas as páginas</button>
      <button data-a="slides">${ICON.slides} Inserir PowerPoint ou PDF aqui</button>
      <button data-a="present">${ICON.present} Apresentar</button>
    </div>`, p => {
    p.querySelector('[data-a="ins"]').onclick = () => { hidePop(); insertPageAfter(i); };
    p.querySelector('[data-a="dup"]').onclick = () => { hidePop(); duplicatePage(i); };
    p.querySelector('[data-a="del"]').onclick = () => { hidePop(); deletePage(i); };
    p.querySelector('[data-a="all"]').onclick = () => { hidePop(); togglePagesPanel(true); };
    p.querySelector('[data-a="slides"]').onclick = () => { hidePop(); $('slideFile').click(); };
    p.querySelector('[data-a="present"]').onclick = () => { hidePop(); setPresent(true); };
  }, 'above');
}

// modo apresentação: tela cheia, só a mini-bandeja; setas/PageDown passam a página
function setPresent(on) {
  present = !!on;
  zoomLens = null;
  if (present) lockBars();
  const b = $('board');
  b.classList.toggle('present', present);
  $('presentbar').hidden = !present;
  if (present) {
    togglePagesPanel(false);
    document.documentElement.requestFullscreen?.().catch(() => {});
    setTimeout(() => { resize(); if (PG.isPages(S.board)) goToPage(curPage(), true); syncPresentBar(); }, 250);
  } else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (!present) setTimeout(() => { if (S) { resize(); if (PG.isPages(S.board)) goToPage(curPage()); } }, 250);
}
// lupa de apresentação (como no PowerPoint): um retângulo segue o ponteiro; o toque amplia aquela área
let zoomLens = null;   // { modo: 'escolher' | 'ampliado', w: largura do retângulo em px de tela, antes: vista anterior }
function lensRect() {
  const w = zoomLens.w, h = w * H / W, c = hover || { x: W / 2, y: H / 2 };
  return { x: c.x - w / 2, y: c.y - h / 2, w, h };
}
function toggleZoomLens() {
  if (zoomLens?.modo === 'ampliado') return sairZoomLens();
  if (zoomLens) { zoomLens = null; setCursor(); syncPresentBar(); requestRender(false); return; }
  zoomLens = { modo: 'escolher', w: Math.round(W / 3) };
  setCursor('none');
  toast('Toque onde quer ampliar · roda do mouse muda o tamanho · Esc cancela', 3500);
  syncPresentBar(); requestRender(false);
}
function animarVista(alvo, ms = 280) {
  const de = { ...S.view }, t0 = performance.now();
  const passo = t => {
    const u = Math.min(1, (t - t0) / ms), k = 1 - (1 - u) ** 3;
    S.view = { zoom: de.zoom + (alvo.zoom - de.zoom) * k, x: de.x + (alvo.x - de.x) * k, y: de.y + (alvo.y - de.y) * k };
    viewChanged();
    if (u < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}
function ampliarAqui() {
  const r = lensRect(), f = W / r.w;   // a área escolhida passa a ocupar a tela inteira
  const a = toWorld(r.x, r.y), z = Math.min(8, S.view.zoom * f);
  zoomLens = { modo: 'ampliado', antes: { ...S.view } };
  setCursor();
  animarVista({ zoom: z, x: -a.x * z, y: -a.y * z });
  syncPresentBar();
}
function sairZoomLens() {
  const antes = zoomLens?.antes;
  zoomLens = null;
  if (antes) animarVista(antes);
  syncPresentBar(); requestRender(false);
}
function drawZoomLens() {
  if (zoomLens?.modo !== 'escolher' || !hover) return;
  const r = lensRect(), g = octx;
  g.save();
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.beginPath(); g.rect(0, 0, W, H); g.rect(r.x, r.y, r.w, r.h); g.fill('evenodd');
  g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(r.x, r.y, r.w, r.h);
  g.strokeStyle = '#0f6cbd'; g.lineWidth = 1.5; g.strokeRect(r.x, r.y, r.w, r.h);
  g.restore();
}

// cor e espessura da caneta atual sem sair da apresentação
function presentColorPop(anchor) {
  const t = isPen(tool) ? tool : (cfg.lastPen || 'pen0'), c = cfg.tools[t];
  showPop(anchor, `<div class="swatches">${PALETTE.map(x => `<button class="sw${x === c.color ? ' on' : ''}" data-c="${x}" style="background:${x}" title="${corNome(x)}" aria-label="${corNome(x)}"></button>`).join('')}</div>
    <div class="widths" style="margin-top:8px">${PEN_WIDTHS.map(w => `<button class="wd${w === c.width ? ' on' : ''}" data-w="${w}"><i style="width:${w * 1.6 + 3}px;height:${w * 1.6 + 3}px;background:${c.color === '#ffffff' ? '#ccc' : c.color}"></i></button>`).join('')}</div>`, p => {
    p.querySelectorAll('[data-c]').forEach(x => x.onclick = () => { c.color = x.dataset.c; saveCfg(); setTool(t); syncPresentBar(); hidePop(); });
    p.querySelectorAll('[data-w]').forEach(x => x.onclick = () => { c.width = +x.dataset.w; saveCfg(); setTool(t); syncPresentBar(); p.querySelectorAll('[data-w]').forEach(y => y.classList.toggle('on', y === x)); });
  }, 'above');
}

// modo aula: Tab esconde/mostra as barras (qualquer quadro)
function setClean(on) {
  $('board').classList.toggle('clean', on);
  if (on) toast('Modo aula: toque em "Mostrar barras" (canto de baixo) ou aperte Tab', 4500);
}
function syncPresentBar() {
  document.querySelectorAll('#presentbar [data-pt]').forEach(x => {
    x.classList.toggle('active', x.dataset.pt === tool);
    const dot = x.querySelector('i');
    if (dot && cfg.tools[x.dataset.pt]) dot.style.background = inkShown(cfg.tools[x.dataset.pt].color);
  });
  const c = $('ppColor')?.querySelector('i');
  if (c) c.style.setProperty('--c', inkShown(currentInk().color));
  $('ppInkShape')?.classList.toggle('on', !!cfg.inkShape);
  $('ppStrip')?.classList.toggle('on', !!zoomLens);
  $('zLens')?.classList.toggle('on', !!zoomLens);
  const isP = S && PG.isPages(S.board);
  document.querySelectorAll('#presentbar .pg-only').forEach(x => x.hidden = !isP);
}

function initPagesUI() {
  $('pgPrev').onclick = () => goToPage(curPage() - 1);
  $('pgNext').onclick = () => goToPage(curPage() + 1);
  $('pgAdd').onclick = () => addPageEnd();
  $('pgMore').onclick = () => pageMenu($('pgMore'));
  $('pgAll').onclick = () => togglePagesPanel($('pagesPanel').hidden);
  $('ppClose').onclick = () => togglePagesPanel(false);
  $('ppAdd').onclick = () => addPageEnd();
  $('ppDel').onclick = () => deletePages([...panelSel]);
  $('bPresent').onclick = () => setPresent(true);
  $('slideFile').addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; if (f) await importSlidesIntoBoard(f); });
  $('ppPrev').onclick = () => goToPage(curPage() - 1, true);
  $('ppNext').onclick = () => goToPage(curPage() + 1, true);
  $('ppBlank').onclick = () => addBlankAfter();
  $('ppExit').onclick = () => setPresent(false);
  $('ppUndo').onclick = undo;
  $('ppColor').onclick = () => presentColorPop($('ppColor'));
  $('ppInkShape').onclick = () => { cfg.inkShape = !cfg.inkShape; saveCfg(); syncToolbar(); toast(cfg.inkShape ? 'Tinta vira forma: ligado (traço quase reto vira reta)' : 'Tinta vira forma: desligado (desenho livre)'); };
  $('ppStrip').onclick = () => toggleZoomLens();
  document.querySelectorAll('#presentbar [data-pt]').forEach(x => x.onclick = () => { setTool(x.dataset.pt); syncPresentBar(); });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && present) setPresent(false); else resize(); });
}


// ================= ferramentas de professor =================
let protractor = null;   // {x, y, angle} transferidor (mundo)
let compassSt = null;    // {cx, cy, r} compasso aberto
let curtain = null;      // {y} cortina (tela)
let spot = null;         // {r} holofote
let strip = null;        // lupa de escrita: {x, y, w, h} caixa no mundo

const TEACH_ITEMS = () => [
    ['strip', ICON.lupa, 'Lupa de escrita', 'escreva grande numa faixa; a letra cai pequena no quadro'],
    ['protractor', ICON.half, 'Transferidor', 'arraste pelo corpo; gire com a roda do mouse'],
    ['compass', ICON.rotate, 'Compasso', '1º arraste: raio · 2º arraste: desenha o arco'],
    ['curtain', ICON.curtain, 'Cortina', 'esconde a parte de baixo; arraste a alça para revelar'],
    ['spot', ICON.spotlight, 'Holofote', 'escurece tudo menos o ponteiro'],
    ['timer', ICON.timer, 'Cronômetro', 'contagem regressiva com aviso sonoro; dá para digitar o tempo'],
    ['clock', ICON.clock, 'Relógio', 'hora do computador, flutuando sobre o quadro'],
    ['plot', ICON.fx, 'Plotar função', 'digite uma função ou escolha um modelo; a curva sai com os eixos'],
    ['formula', ICON.formula, 'Fórmula (LaTeX)', 'equações nítidas: \\frac{a}{b}, x^2, \\Delta H'],
    ['library', ICON.library, 'Biblioteca', 'tabela periódica e vidrarias de laboratório'],
    ['ocr', ICON.text, 'Converter escrita em texto', 'selecione a escrita com o laço antes'],
];
const teachOn = () => ({ strip: !!strip, protractor: !!protractor, compass: tool === 'compass', curtain: !!curtain, spot: !!spot, timer: timerOpen(), clock: clockOpen() });

function toolsPop(anchor) {
  const on = teachOn();
  const lado = cfg.teachSide === 'esq' ? 'esq' : 'dir';
  showPop(anchor, `<div class="tb-fixar"><span>Deixar aberto na tela:</span><div class="seg">
      <button data-lado="esq" class="${cfg.teachBar && lado === 'esq' ? 'on' : ''}">À esquerda</button>
      <button data-lado="dir" class="${cfg.teachBar && lado === 'dir' ? 'on' : ''}">À direita</button></div>
      <label class="row"><input type="checkbox" id="tbNomes" ${cfg.teachNames ? 'checked' : ''}> com os nomes</label></div>
    <div class="menu newkind tools">${TEACH_ITEMS().map(([k, ic, n, d]) =>
    `<button data-k="${k}" class="${on[k] ? 'on' : ''}">${ic}<span><b>${n}</b><small>${d}</small></span></button>`).join('')}</div>
    <small class="tb-note">Aberta, a barra também pode ir para qualquer lugar: destrave o cadeado (barra de cima) e arraste.</small>`, p => {
    p.querySelectorAll('[data-k]').forEach(x => x.onclick = () => { hidePop(); toolAction(x.dataset.k); });
    p.querySelectorAll('[data-lado]').forEach(x => x.onclick = () => { hidePop(); setTeachBar(true, x.dataset.lado); });
    p.querySelector('#tbNomes').onchange = e => { cfg.teachNames = e.target.checked; saveCfg(); buildTeachBar(); placeBars(); };
  });
}

// barra do professor "explodida": todas as ferramentas à vista (opcional, móvel como as outras barras)
function setTeachBar(on, lado) {
  cfg.teachBar = !!on;
  if (lado) { cfg.teachSide = lado; resetBar('teach'); }   // escolher um lado desfaz a posição arrastada
  saveCfg();
  buildTeachBar();
  syncTeachBar();
  placeBars();
}
function buildTeachBar() {
  const b = $('teachbar');
  if (!b) return;
  b.hidden = !cfg.teachBar || !S;
  if (b.hidden) return;
  b.classList.toggle('esq', cfg.teachSide === 'esq');
  b.classList.toggle('nomes', !!cfg.teachNames);
  b.innerHTML = TEACH_ITEMS().map(([k, ic, n, d]) => `<button class="ib" data-k="${k}" title="${esc(n)}: ${esc(d)}">${ic}${cfg.teachNames ? `<span>${esc(n)}</span>` : ''}</button>`).join('')
    + `<span class="sep"></span><div class="tb-acoes"><button class="ib" data-lado title="Passar a barra para o outro lado">⇄</button>`
    + `<button class="ib" data-nomes title="${cfg.teachNames ? 'Esconder' : 'Mostrar'} os nomes">Aa</button>`
    + `<button class="ib" data-x title="Recolher a barra (volta ao menu)">${ICON.close}</button></div>`;
  b.querySelectorAll('[data-k]').forEach(x => x.onclick = () => toolAction(x.dataset.k, x));
  b.querySelector('[data-x]').onclick = () => setTeachBar(false);
  b.querySelector('[data-lado]').onclick = () => setTeachBar(true, cfg.teachSide === 'esq' ? 'dir' : 'esq');
  b.querySelector('[data-nomes]').onclick = () => { cfg.teachNames = !cfg.teachNames; saveCfg(); buildTeachBar(); placeBars(); };
  syncTeachBar();
}
function syncTeachBar() {
  const b = $('teachbar');
  $('tTools')?.classList.toggle('on', !!cfg.teachBar);
  if (!b || b.hidden) return;
  const on = teachOn();
  b.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', !!on[x.dataset.k]));
}

function toolAction(k, anchor) {
  const c = toWorld(W / 2, H / 2);
  if (k === 'protractor') protractor = protractor ? null : { x: c.x, y: c.y + 60 / S.view.zoom, angle: 0 };
  else if (k === 'compass') { if (tool === 'compass') setTool(cfg.lastPen || 'pen0'); else { setTool('compass'); toast('Compasso: arraste do centro até o raio; depois arraste em volta para desenhar o arco'); } }
  else if (k === 'curtain') curtain = curtain ? null : { y: H * 0.45 };
  else if (k === 'spot') spot = spot ? null : { r: 150 };
  else if (k === 'timer') toggleTimer();
  else if (k === 'formula') formulaDialog();
  else if (k === 'plot') plotDialog();
  else if (k === 'library') libraryPop(anchor || $('tTools'));
  else if (k === 'clock') toggleClock();
  else if (k === 'strip') toggleStrip();
  else if (k === 'ocr') { if (sel.size) inkToText([...sel]); else { setTool('lasso'); toast('Circule a escrita com o laço e toque em "Converter em texto"'); } }
  requestRender(false);
  syncTeachBar(); syncPresentBar();
}

// ---------- transferidor ----------
const PROT_R = 210;
function protLocal(x, y) {
  const a = protractor.angle * Math.PI / 180, dx = x - protractor.x, dy = y - protractor.y;
  return { u: dx * Math.cos(a) + dy * Math.sin(a), v: -dx * Math.sin(a) + dy * Math.cos(a) };
}
function protWorld(u, v) {
  const a = protractor.angle * Math.PI / 180;
  return { x: protractor.x + u * Math.cos(a) - v * Math.sin(a), y: protractor.y + u * Math.sin(a) + v * Math.cos(a) };
}
// borda do transferidor perto do ponto: {mode:'arc', r} ou {mode:'base', v}; null se longe
function protEdge(x, y, width = 0) {
  if (!protractor) return null;
  const z = S.view.zoom, R0 = PROT_R / z, base = 14 / z, near = 36 / z, half = width / 2 + 1 / z;
  const l = protLocal(x, y), d = Math.hypot(l.u, l.v);
  if (l.v <= 0 && Math.abs(d - R0) < near) return { mode: 'arc', r: d >= R0 ? R0 + half : R0 - half };
  if (Math.abs(l.u) <= R0 && l.v > base - near && l.v < base + near) return { mode: 'base', v: l.v >= base ? base + half : base - half };
  return null;
}
function protSnap(pe, x, y) {
  const l = protLocal(x, y);
  if (pe.mode === 'base') { const R0 = PROT_R / S.view.zoom; return protWorld(Math.max(-R0, Math.min(R0, l.u)), pe.v); }
  let a = Math.atan2(l.v, l.u);               // metade de cima (v ≤ 0): ângulo entre −π e 0
  if (a > 0) a = l.u >= 0 ? 0 : -Math.PI;
  return protWorld(Math.cos(a) * pe.r, Math.sin(a) * pe.r);
}
function onProtractor(x, y) {
  if (!protractor) return false;
  const R = PROT_R / S.view.zoom, l = protLocal(x, y);
  return Math.hypot(l.u, l.v) <= R && l.v <= 14 / S.view.zoom;
}
function drawProtractor() {
  const z = S.view.zoom, R = PROT_R / z, g = octx;
  g.save();
  g.translate(protractor.x, protractor.y);
  g.rotate(protractor.angle * Math.PI / 180);
  g.beginPath(); g.moveTo(-R, 0); g.arc(0, 0, R, Math.PI, 0); g.lineTo(R, 14 / z); g.lineTo(-R, 14 / z); g.closePath();
  g.fillStyle = 'rgba(250,250,250,.86)'; g.fill();
  g.strokeStyle = '#8a8886'; g.lineWidth = 1 / z; g.stroke();
  g.strokeStyle = '#323130';
  g.beginPath();
  for (let d = 0; d <= 180; d++) {
    const a = Math.PI + d * Math.PI / 180, len = (d % 10 === 0 ? 18 : d % 5 === 0 ? 12 : 7) / z;
    g.moveTo(Math.cos(a) * R, Math.sin(a) * R); g.lineTo(Math.cos(a) * (R - len), Math.sin(a) * (R - len));
  }
  g.stroke();
  g.fillStyle = '#242424'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let d = 0; d <= 180; d += 10) {
    const a = Math.PI + d * Math.PI / 180;
    g.font = `${11 / z}px "Segoe UI", sans-serif`;
    g.fillText(String(d), Math.cos(a) * (R - 30 / z), Math.sin(a) * (R - 30 / z));
    g.font = `${9 / z}px "Segoe UI", sans-serif`; g.fillStyle = '#8a8886';
    g.fillText(String(180 - d), Math.cos(a) * (R - 46 / z), Math.sin(a) * (R - 46 / z));
    g.fillStyle = '#242424';
  }
  g.strokeStyle = '#e81224'; g.lineWidth = 1.5 / z;
  g.beginPath(); g.moveTo(-10 / z, 0); g.lineTo(10 / z, 0); g.moveTo(0, -10 / z); g.lineTo(0, 6 / z); g.stroke();
  let ang = ((-protractor.angle % 360) + 360) % 360;
  g.font = `600 ${13 / z}px "Segoe UI", sans-serif`; g.fillStyle = '#0f6cbd';
  g.fillText(`${Math.round(ang)}°`, 0, -R * 0.42);
  g.restore();
}

// ---------- compasso ----------
function compassDown(e, P) {
  if (!compassSt) action = { type: 'compassR', id: e.pointerId, cx: P.x, cy: P.y, x: P.x, y: P.y };
  else {
    const a0 = Math.atan2(P.y - compassSt.cy, P.x - compassSt.cx);
    action = { type: 'compassArc', id: e.pointerId, last: a0, pts: [compassSt.cx + Math.cos(a0) * compassSt.r, compassSt.cy + Math.sin(a0) * compassSt.r, 0.5] };
  }
}
function drawCompass() {
  const z = S.view.zoom, g = octx;
  let cx, cy, r, px, py;
  if (action?.type === 'compassR') { cx = action.cx; cy = action.cy; px = action.x; py = action.y; r = Math.hypot(px - cx, py - cy); }
  else if (compassSt) { ({ cx, cy, r } = compassSt); const h = hover ? toWorld(hover.x, hover.y) : { x: cx + r, y: cy }; const a = Math.atan2(h.y - cy, h.x - cx); px = cx + Math.cos(a) * r; py = cy + Math.sin(a) * r; }
  else return;
  g.save();
  g.setLineDash([6 / z, 6 / z]); g.strokeStyle = 'rgba(15,108,189,.45)'; g.lineWidth = 1 / z;
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  g.setLineDash([]); g.strokeStyle = '#605e5c'; g.lineWidth = 2 / z;
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(px, py); g.stroke();
  g.fillStyle = '#e81224'; g.beginPath(); g.arc(cx, cy, 4 / z, 0, Math.PI * 2); g.fill();
  if (action?.type === 'compassArc' && action.pts.length > 3) R.drawStroke(g, { type: 'stroke', tool: 'pen', color: currentInk().color, width: currentInk().width / z, pts: action.pts });
  g.font = `${12 / z}px "Segoe UI"`; g.fillStyle = '#0f6cbd';
  g.fillText(`r = ${Math.round(r)} px`, (cx + px) / 2 + 6 / z, (cy + py) / 2 - 6 / z);
  g.restore();
}

// ---------- cortina e holofote (coordenadas de tela) ----------
function drawShades() {
  const g = octx;
  if (curtain) {
    g.save();
    g.fillStyle = '#3b3a39'; g.fillRect(0, curtain.y, W, H - curtain.y);
    g.fillStyle = '#f3f2f1'; g.beginPath(); g.roundRect(W / 2 - 46, curtain.y - 12, 92, 24, 12); g.fill();
    g.fillStyle = '#323130'; g.font = '600 12px "Segoe UI"'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('⇕ cortina', W / 2, curtain.y);
    g.restore();
  }
  if (spot && hover) {
    g.save();
    g.fillStyle = 'rgba(0,0,0,.78)';
    g.beginPath(); g.rect(0, 0, W, H); g.arc(hover.x, hover.y, spot.r, 0, Math.PI * 2, true); g.fill('evenodd');
    g.restore();
  }
}

function drawInstruments() {
  if (protractor) drawProtractor();
  if (tool === 'compass' || action?.type === 'compassR') drawCompass();
  if (strip) {
    const z = S.view.zoom;
    octx.save(); octx.strokeStyle = '#0f6cbd'; octx.lineWidth = 2 / z; octx.setLineDash([8 / z, 5 / z]);
    octx.strokeRect(strip.x, strip.y, strip.w, strip.h);
    octx.setLineDash([]); octx.fillStyle = 'rgba(15,108,189,.06)'; octx.fillRect(strip.x, strip.y, strip.w, strip.h);
    // alça "arraste para mover" em cima da caixa
    const tw = 150 / z, th = 24 / z;
    octx.fillStyle = '#0f6cbd'; octx.beginPath(); octx.roundRect(strip.x, strip.y - th - 4 / z, tw, th, 6 / z); octx.fill();
    octx.fillStyle = '#fff'; octx.font = `600 ${12 / z}px "Segoe UI", sans-serif`; octx.textBaseline = 'middle';
    octx.fillText('✥ arraste para mover', strip.x + 8 / z, strip.y - th / 2 - 4 / z);
    octx.restore();
  }
}

function instrumentDown(e, P) {
  if (curtain && Math.abs(e.clientY - curtain.y) < 18) { action = { type: 'curtain', id: e.pointerId }; return true; }
  const inking = isPen(tool) || tool === 'highlighter';
  if (protractor && onProtractor(P.x, P.y) && !(inking && (e.pointerType === 'pen' || protEdge(P.x, P.y)))) { action = { type: 'protractor', id: e.pointerId, px: P.x, py: P.y }; return true; }
  if (strip) {
    // "Levar a caixa": o próximo toque no quadro põe a caixa ali
    if (strip.levar) { strip.x = P.x - strip.w * 0.1; strip.y = P.y - strip.h * 0.6; strip.startX = strip.x; strip.levar = false; $('stMove').classList.remove('on'); requestRender(); action = { type: 'stripbox', id: e.pointerId, px: P.x, py: P.y }; return true; }
    // a caixa inteira (e a alça acima dela) arrasta: na lupa, a escrita é feita no painel, não no quadro
    const z = S.view.zoom, m = 16 / z, alca = 30 / z;
    if (P.x > strip.x - m && P.x < strip.x + strip.w + m && P.y > strip.y - alca && P.y < strip.y + strip.h + m) {
      action = { type: 'stripbox', id: e.pointerId, px: P.x, py: P.y }; return true;
    }
  }
  return false;
}
function instrumentMove(e) {
  if (e.pointerId !== action.id) return false;
  const P = pt(e);
  switch (action.type) {
    case 'curtain': curtain.y = Math.max(40, Math.min(H - 10, e.clientY)); break;
    case 'protractor': protractor.x += P.x - action.px; protractor.y += P.y - action.py; action.px = P.x; action.py = P.y; break;
    case 'stripbox': strip.x += P.x - action.px; strip.y += P.y - action.py; action.px = P.x; action.py = P.y; requestRender(); break;
    case 'compassR': action.x = P.x; action.y = P.y; break;
    case 'compassArc': {
      const a = Math.atan2(P.y - compassSt.cy, P.x - compassSt.cx);
      let d = a - action.last;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const n = Math.max(1, Math.ceil(Math.abs(d) * compassSt.r * S.view.zoom / 3));
      for (let i = 1; i <= n; i++) { const t = action.last + d * i / n; action.pts.push(compassSt.cx + Math.cos(t) * compassSt.r, compassSt.cy + Math.sin(t) * compassSt.r, 0.5); }
      action.last = a;
      break;
    }
    default: return false;
  }
  requestRender(false);
  return true;
}
function instrumentUp(a) {
  if (a.type === 'compassR') {
    const r = Math.hypot(a.x - a.cx, a.y - a.cy);
    compassSt = r * S.view.zoom > 6 ? { cx: a.cx, cy: a.cy, r } : null;
  } else if (a.type === 'compassArc' && a.pts.length > 6) {
    const ink = currentInk();
    commit([...S.items, { id: newId(), type: 'stroke', tool: 'pen', color: ink.color, width: ink.width / S.view.zoom, pts: a.pts }]);
  }
  requestRender();
}

// ---------- lupa de escrita ----------
const STRIP_MAG = 2.6;
function toggleStrip() {
  if (strip) { strip = null; $('strip').hidden = true; requestRender(); return; }
  $('strip').hidden = false;
  const cv = $('stripCv'), r = cv.getBoundingClientRect();
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const z = S.view.zoom, w = r.width / STRIP_MAG / z, h = r.height / STRIP_MAG / z;
  const c = toWorld(W * 0.3, H * 0.35);
  strip = { x: c.x, y: c.y, w, h, sw: r.width, sh: r.height };
  requestRender();
}
function stripToWorld(sx, sy) { const k = strip.sw / strip.w; return { x: strip.x + sx / k, y: strip.y + sy / k }; }
function drawStrip() {
  const cv = $('stripCv'), g = cv.getContext('2d'), k = strip.sw / strip.w;
  const view = { x: -strip.x * k, y: -strip.y * k, zoom: k };
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (PG.isPages(S.board)) PG.drawPages(g, S.board, view, strip.sw, strip.sh);
  else R.drawBackground(g, S.board.background, view, strip.sw, strip.sh);
  // linha-guia de base
  g.strokeStyle = 'rgba(15,108,189,.35)'; g.setLineDash([6, 6]);
  g.beginPath(); g.moveTo(0, strip.sh * 0.72); g.lineTo(strip.sw, strip.sh * 0.72); g.stroke(); g.setLineDash([]);
  g.setTransform(dpr * k, 0, 0, dpr * k, dpr * view.x, dpr * view.y);
  const box = { x: strip.x, y: strip.y, w: strip.w, h: strip.h };
  for (const it of S.items) if (R.boxesTouch(R.bbox(it), box)) R.drawItem(g, it);
  if (action?.type === 'draw') R.drawStroke(g, action.stroke);
}
function initStrip() {
  const cv = $('stripCv');
  // a faixa repassa a caneta ao editor como se ela estivesse escrevendo na caixa do quadro
  const fake = (e, list) => {
    const r = cv.getBoundingClientRect();
    const map = ev => { const w = stripToWorld(ev.clientX - r.left, ev.clientY - r.top), s = toScreen(w.x, w.y);
      return { clientX: s.x, clientY: s.y, pointerId: ev.pointerId, pointerType: ev.pointerType, pressure: ev.pressure, buttons: ev.buttons, button: ev.button, timeStamp: ev.timeStamp, shiftKey: ev.shiftKey }; };
    const m = map(e);
    m.getCoalescedEvents = () => (list || []).map(map);
    m.getPredictedEvents = () => [];
    return m;
  };
  cv.addEventListener('pointerdown', e => { if (!strip) return; try { cv.setPointerCapture(e.pointerId); } catch {} if (!isPen(tool) && tool !== 'highlighter' && tool !== 'eraser') setTool(cfg.lastPen || 'pen0'); onDown(fake(e)); });
  cv.addEventListener('pointermove', e => { if (!strip) return; onMove(fake(e, e.getCoalescedEvents?.())); });
  cv.addEventListener('pointerup', e => {
    if (!strip) return;
    onUp(fake(e));
    const r = cv.getBoundingClientRect();
    if (e.clientX - r.left > r.width * 0.82) { strip.x += strip.w * 0.6; requestRender(); }  // avança sozinha perto do fim
  });
  cv.addEventListener('pointercancel', e => strip && onUp(fake(e)));
  cv.addEventListener('contextmenu', e => e.preventDefault());
  $('stLeft').onclick = () => { strip.x -= strip.w * 0.6; requestRender(); };
  $('stRight').onclick = () => { strip.x += strip.w * 0.6; requestRender(); };
  $('stNewLine').onclick = () => { strip.y += strip.h * 1.05; strip.x = strip.startX ?? strip.x; requestRender(); };
  $('stHere').onclick = () => { strip.startX = strip.x; toast('Início da linha marcado aqui'); };
  $('stClose').onclick = () => toggleStrip();
  $('stMove').onclick = () => {
    strip.levar = !strip.levar; $('stMove').classList.toggle('on', strip.levar);
    if (strip.levar) toast('Toque no quadro onde quer escrever: a caixa vai para lá');
  };
  // o painel da lupa também muda de lugar: arraste pela alça ⠿ (a posição fica guardada)
  const painel = $('strip'), grip = $('stGrip');
  const pos = () => { try { return JSON.parse(localStorage.getItem('lousa.stripPos') || 'null'); } catch { return null; } };
  const aplica = p => { if (!p) return; painel.style.top = Math.max(0, Math.min(innerHeight - 120, p.y)) + 'px'; painel.style.bottom = 'auto'; };
  aplica(pos());
  grip.onpointerdown = e => {
    const r = painel.getBoundingClientRect(), dy = e.clientY - r.top;
    grip.setPointerCapture(e.pointerId);
    grip.onpointermove = ev => aplica({ y: ev.clientY - dy });
    grip.onpointerup = () => { grip.onpointermove = null; try { localStorage.setItem('lousa.stripPos', JSON.stringify({ y: painel.getBoundingClientRect().top })); } catch {} };
  };
  $('stTopo').onclick = () => { const emCima = painel.getBoundingClientRect().top < innerHeight / 2; const y = emCima ? innerHeight - painel.offsetHeight - 64 : 70; aplica({ y }); try { localStorage.setItem('lousa.stripPos', JSON.stringify({ y })); } catch {} };
}

// ---------- fórmula ----------
async function formulaDialog(edit = null) {
  const target = S;
  const d = document.createElement('dialog');
  d.className = 'formula';
  d.innerHTML = `<div class="dlg-head"><h3>${edit ? 'Editar fórmula' : 'Inserir fórmula'}</h3><button class="ib" data-a="x" title="Fechar" aria-label="Fechar">${ICON.close}</button></div>
    <textarea id="fxIn" rows="3" spellcheck="false" placeholder="ex.: K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b}">${edit?.latex ? edit.latex.replace(/</g, '&lt;') : ''}</textarea>
    <div class="fx-chips">${['\\frac{a}{b}', 'x^{2}', 'x_{i}', '\\sqrt{x}', '\\Delta H', '\\rightleftharpoons', '\\rightarrow', '\\pm', '\\cdot', '\\alpha', '\\beta', '\\pi', '\\sum_{i=1}^{n}', '\\int_{a}^{b}', '\\ce{}'].filter(x => x !== '\\ce{}').map(c => `<button class="btn" data-c="${c}">${c}</button>`).join('')}</div>
    <div class="fx-prev" id="fxPrev"></div><div class="fx-err" id="fxErr"></div>
    <div class="acts"><button class="btn" data-a="x">Cancelar</button><button class="btn primary" data-a="ok">${edit ? 'Atualizar' : 'Inserir'}</button></div>`;
  document.body.appendChild(d);
  const inp = d.querySelector('#fxIn'), prev = d.querySelector('#fxPrev'), err = d.querySelector('#fxErr');
  const upd = async () => { await previewLatex(prev, inp.value); err.textContent = inp.value ? (await validateLatex(inp.value)) || '' : ''; };
  inp.addEventListener('input', upd);
  inp.addEventListener('keydown', e => e.stopPropagation());
  d.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const p = inp.selectionStart; inp.setRangeText(b.dataset.c, p, inp.selectionEnd, 'end'); inp.focus(); upd(); });
  const close = () => { d.close(); d.remove(); };
  d.querySelectorAll('[data-a="x"]').forEach(b => b.onclick = close);
  d.querySelector('[data-a="ok"]').onclick = async () => {
    const latex = inp.value.trim();
    if (!latex) return close();
    const bad = await validateLatex(latex);
    if (S !== target || !d.open) return close();
    if (bad) { err.textContent = bad; return; }
    try {
      const color = edit?.color || textColor();
      const { blob, w, h } = await formulaImage(latex, color, 40);
      if (S !== target || !d.open) return close();
      const src = await uploadAsset(blob);
      if (S !== target || !d.open) return close();
      if (edit) {
        const k = edit.h / (edit.ph || h);
        const n = { ...edit, src, latex, w: w * k, h: h * k, ph: h };
        commit(S.items.map(i => i.id === edit.id ? n : i));
      } else {
        const c = toWorld(W / 2, H / 2), z = S.view.zoom;
        const it = { id: newId(), type: 'image', latex, color, src, x: c.x - w / 2 / z, y: c.y - h / 2 / z, w: w / z, h: h / z, ph: h };
        commit([...S.items, it]);
        sel = new Set([it.id]);
        setTool('select');
      }
      close();
    } catch (e) { err.textContent = 'Não foi possível gerar a imagem: ' + e.message; }
  };
  d.showModal();
  inp.focus();
  upd();
}

// ---------- biblioteca ----------
function libraryPop(anchor) {
  showPop(anchor, `<h4>Biblioteca</h4><div class="libgrid">${LIBRARY.map(l => `<button class="libitem" data-id="${l.id}"><img src="${svgDataUrl(l.make().svg)}" alt=""><span>${l.name}</span></button>`).join('')}</div>`, p => {
    p.querySelectorAll('[data-id]').forEach(b => b.onclick = () => {
      hidePop();
      const l = LIBRARY.find(x => x.id === b.dataset.id), { svg, w, h } = l.make();
      const z = S.view.zoom, k = Math.min(1, (W * 0.7) / w, (H * 0.7) / h) / z, c = toWorld(W / 2, H / 2);
      const it = { id: newId(), type: 'image', src: svgDataUrl(svg), x: c.x - w * k / 2, y: c.y - h * k / 2, w: w * k, h: h * k };
      commit([...S.items, it]);
      sel = new Set([it.id]);
      setTool('select');
    });
  });
}

// ---------- escrita → texto ----------
async function inkToText(ids) {
  const target = S;
  if (serverInfo().ocr === false) return toast('A conversão de escrita em texto usa o reconhecedor do Windows e não está disponível neste sistema.', 6000);
  const strokes = S.items.filter(i => ids.includes(i.id) && i.type === 'stroke' && i.tool === 'pen');
  if (!strokes.length) return toast('Selecione a escrita (traços de caneta) com o laço');
  const z = S.view.zoom;
  toast('Reconhecendo a escrita…', 20000);
  let palavras;
  try { palavras = await recognizeInk(strokes.map(s => { const o = []; for (let i = 0; i < s.pts.length; i += 3) o.push(s.pts[i] * z, s.pts[i + 1] * z); return o; })); }
  catch (e) { return toast(e.message, 6000); }
  if (S !== target) return toast('Reconhecimento cancelado: o quadro foi fechado.', 6000);
  if (!palavras.length) return toast('Não reconheci texto nessa seleção');
  const box = R.unionBox(strokes);
  const hs = strokes.map(s => R.bbox(s).h).sort((a, b) => a - b);
  const size = Math.max(10 / z, hs[Math.floor(hs.length / 2)] * 1.1);
  const font = cfg.ocrFont || 'Segoe Script';
  const d = document.createElement('dialog');
  d.innerHTML = `<div class="dlg-head"><h3>Texto reconhecido</h3></div>
    <input type="text" id="ocrIn" value="${esc(palavras.map(c => c[0]).join(' '))}" style="font: 22px '${font}', 'Segoe UI'">
    <div class="ocr-words">${palavras.map((c, i) => `<div>${c.slice(0, 5).map(w => `<button class="btn" data-i="${i}" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>`).join('')}</div>
    <div class="row"><span>Fonte</span><select id="ocrFont">${['Segoe Script', 'Segoe Print', 'Ink Free', 'Lucida Handwriting', 'Segoe UI', 'Times New Roman'].map(f => `<option ${f === font ? 'selected' : ''} style="font-family:'${f}'">${f}</option>`).join('')}</select></div>
    <div class="acts"><button class="btn" data-a="x">Cancelar</button><button class="btn primary" data-a="ok">Substituir a escrita</button></div>`;
  document.body.appendChild(d);
  const inp = d.querySelector('#ocrIn'), cur = palavras.map(c => c[0]);
  inp.addEventListener('keydown', e => e.stopPropagation());
  d.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { cur[+b.dataset.i] = b.dataset.w; inp.value = cur.join(' '); });
  d.querySelector('#ocrFont').onchange = e => { inp.style.fontFamily = `'${e.target.value}', 'Segoe UI'`; };
  d.querySelector('[data-a="x"]').onclick = () => { d.close(); d.remove(); };
  d.querySelector('[data-a="ok"]').onclick = () => {
    const text = inp.value.trim(), f = d.querySelector('#ocrFont').value;
    d.close(); d.remove();
    if (S !== target) return;
    if (!text) return;
    cfg.ocrFont = f; saveCfg();
    const meas = document.createElement('canvas').getContext('2d');
    const it = { id: newId(), type: 'text', x: box.x, y: box.y, text, color: strokes[0].color, size, font: f, ink: strokes };
    meas.font = `${size}px ${R.fontOf(it)}`;
    it.w = meas.measureText(text).width + 2;
    const rm = new Set(strokes.map(s => s.id));
    commit([...S.items.filter(i => !rm.has(i.id)), it]);
    sel = new Set([it.id]);
    setTool('select');
  };
  toast('Pronto: confira o texto', 1500);
  d.showModal();
  inp.focus();
}


function fontPop(anchor) {
  const fonts = ['Segoe UI', 'Segoe Script', 'Segoe Print', 'Ink Free', 'Lucida Handwriting', 'Comic Sans MS', 'Times New Roman', 'Consolas'];
  showPop(anchor, `<h4>Fonte</h4><div class="menu">${fonts.map(f => `<button data-f="${f}" style="font-family:'${f}'">${f}</button>`).join('')}</div>`, p => {
    p.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
      hidePop();
      const meas = document.createElement('canvas').getContext('2d');
      commit(S.items.map(i => {
        if (!sel.has(i.id) || i.type !== 'text') return i;
        const n = { ...i, font: b.dataset.f === 'Segoe UI' ? undefined : b.dataset.f };
        meas.font = `${n.size}px ${R.fontOf(n)}`;
        n.w = Math.max(...n.text.split('\n').map(l => meas.measureText(l).width)) + 2;
        return n;
      }));
    });
  }, 'above');
}


// ================= plotar função =================
// sistema de coordenadas do plano cartesiano da folha: origem, px por unidade e faixa visível (em unidades)
function cartesianFrame() {
  const bg = S.board.background, cell = CELL * (PAPER_SIZE[bg.size] || 1);
  let o, area;
  if (PG.isPages(S.board)) {
    const r = PG.pageRect(S.board.layout, curPage());
    o = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    area = r;
  } else {
    o = bg.origin || { x: 0, y: 0 };
    const a = toWorld(0, 0), b = toWorld(W, H);
    area = { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
  }
  return {
    ox: o.x, oy: o.y, cell,
    xmin: (area.x - o.x) / cell, xmax: (area.x + area.w - o.x) / cell,
    ymin: (o.y - (area.y + area.h)) / cell, ymax: (o.y - area.y) / cell,
  };
}

// retângulo do mundo onde entra um gráfico com escala própria: a página atual ou o miolo da tela (longe das barras)
function plotArea() {
  if (PG.isPages(S.board)) return PG.pageRect(S.board.layout, curPage());
  const a = toWorld(W * 0.14, H * 0.16), b = toWorld(W * 0.86, H * 0.84);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}

// animação de um parâmetro: a curva corre na camada de cima (nada é gravado até "Fixar")
let plotAnim = null;   // { f, frame, valores, anim, t0, tPausa, color, width, grp, el }
function drawPlotAnim() {
  if (!plotAnim) return;
  const A = plotAnim, t = ((A.tPausa ?? performance.now()) - A.t0) / 1000;
  // valor escolhido à mão (controle ou caixa) congela a curva nesse valor
  const anim = A.manual != null ? { ...A.anim, min: A.manual, max: A.manual } : A.anim;
  const r = animatedCurve(A.f, A.frame, A.valores, anim, t);
  A.atual = r;
  if (A.manual == null) { A.sl.value = r.valor; if (document.activeElement !== A.num) A.num.value = fmtNum(+r.valor.toFixed(4)).replace('−', '-'); }
  drawPolylines(octx, r.linhas, { color: inkShown(A.color), width: A.width });
  const lb = A.el.querySelector('.an-v');
  const txt = `${A.anim.n} = ${fmtNum(+r.valor.toFixed(3))}`;
  if (lb.textContent !== txt) lb.textContent = txt;
  if (A.tPausa == null && A.manual == null) requestRender(false);
}
function stopPlotAnim() {
  if (!plotAnim) return;
  plotAnim.el.remove(); plotAnim = null;
  requestRender(false);
}
function startPlotAnim(f, frame, valores, p, color, width, grp) {
  stopPlotAnim();
  const el = document.createElement('div');
  el.className = 'timerbox animbox';
  el.innerHTML = `<div class="tm-head"><span>Animação</span><button class="ib" data-a="x" title="Parar e fechar">${ICON.close}</button></div>
    <div class="an-v"></div>
    <div class="tm-row an-man"><input type="range" data-a="sl" min="${p.min}" max="${p.max}" step="${p.passo || 'any'}" title="Arraste para escolher o valor (a animação para)">
      <input type="text" inputmode="decimal" data-a="num" title="Digite o valor exato (vírgula ou ponto)"></div>
    <div class="tm-row"><button class="btn" data-a="pp">Pausar</button><button class="btn primary" data-a="fix" title="Grava a curva deste instante no quadro">Fixar esta curva</button></div>
    <div class="tm-row"><small>Velocidade</small><input type="range" data-a="vel" min="1" max="12" value="4" title="Segundos por ida e volta"></div>`;
  document.body.appendChild(el);
  plotAnim = { f, frame, valores, anim: { n: p.n, min: p.min, max: p.max, periodo: 4, modo: 'vaivem' }, t0: performance.now(), tPausa: null, color, width, grp, el };
  const A = plotAnim, pp = el.querySelector('[data-a="pp"]');
  A.sl = el.querySelector('[data-a="sl"]'); A.num = el.querySelector('[data-a="num"]'); A.manual = null;
  el.querySelector('[data-a="x"]').onclick = stopPlotAnim;
  const pausa = () => { if (A.tPausa == null) A.tPausa = performance.now(); pp.textContent = 'Continuar'; };
  pp.onclick = () => {
    if (A.tPausa == null && A.manual == null) pausa();
    else { A.t0 += performance.now() - (A.tPausa ?? performance.now()); A.tPausa = null; A.manual = null; pp.textContent = 'Pausar'; }
    requestRender(false);
  };
  // escolher o valor à mão: para a animação e mostra a curva exatamente nesse valor
  const escolhe = v => { if (!isFinite(v)) return; A.manual = v; pausa(); requestRender(false); };
  A.sl.oninput = () => { escolhe(+A.sl.value); A.num.value = fmtNum(+(+A.sl.value).toFixed(4)).replace('−', '-'); };
  A.num.addEventListener('keydown', e => e.stopPropagation());
  A.num.oninput = () => { const v = parseFloat(String(A.num.value).replace(',', '.')); if (isFinite(v)) { escolhe(v); A.sl.value = v; } };
  el.querySelector('[data-a="vel"]').oninput = e => {
    // mantém a fase ao mudar o período
    const now = A.tPausa ?? performance.now(), frac = (now - A.t0) / (A.anim.periodo * 1000);
    A.anim = { ...A.anim, periodo: 16 - +e.target.value };
    A.t0 = now - frac * A.anim.periodo * 1000;
  };
  el.querySelector('[data-a="fix"]').onclick = () => {
    const v = A.atual?.valores || A.valores;
    const novos = plotStrokes(A.f, { ...A.frame, color: A.color, width: A.width, id: newId, valores: v })
      .map(s => ({ ...s, plot: `${A.anim.n} = ${fmtNum(+v[A.anim.n].toFixed(3))}`, ...(A.grp ? { grp: A.grp } : {}) }));
    if (novos.length) { commit([...S.items, ...novos]); toast('Curva fixada no quadro'); }
  };
  requestRender(false);
}

function plotDialog() {
  const bg = S.board.background, isCart = bg.pattern === 'cartesian';
  const d = document.createElement('dialog');
  d.className = 'formula plotdlg';
  const ultimo = cfg.lastPlot || 'x^2 - 4';
  let model = null, vals = {};
  d.innerHTML = `<div class="dlg-head"><h3>Plotar função</h3><button class="ib" data-a="x" title="Fechar" aria-label="Fechar">${ICON.close}</button></div>
    <div class="seg pl-tabs"><button data-tab="livre">Função livre</button><button data-tab="modelos">Modelos por área</button></div>
    <div class="pl-models" hidden>
      <div class="seg pl-areas">${FN_AREAS.map(a => `<button data-area="${a.id}">${esc(a.nome)}</button>`).join('')}</div>
      <div class="fx-chips pl-list"></div>
    </div>
    <label class="tb-line" style="font-size:18px">y = <input id="plIn" type="text" spellcheck="false" style="flex:1;font:18px Consolas,monospace;padding:6px 8px;border:1px solid #d1d1d1;border-radius:6px" value="${esc(ultimo)}"></label>
    <small class="pl-nota tb-note" hidden></small>
    <div class="fx-chips pl-free">${['x^2 - 4', '2x + 1', '2sen(x)', 'cos(x)', 'raiz(x)', '1/x', 'abs(x)', 'ln(x)', 'e^x', '-x^2 + 3x'].map(c => `<button class="btn" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="pl-params"></div>
    <div class="tb-line"><span>x de</span><input id="plA" type="number" step="any" style="width:80px"><span>até</span><input id="plB" type="number" step="any" style="width:80px"><small class="pl-xhint">(vazio = toda a área visível)</small></div>
    <label class="tb-line"><input type="checkbox" id="plAxes" ${isCart ? '' : 'checked'}> Desenhar os eixos com números (dá para apagar ou mover)</label>
    <label class="tb-line"><input type="checkbox" id="plLabel" checked> Escrever "y = …" ao lado do gráfico</label>
    <div class="tb-line pl-anim" hidden><span>Animar</span><select id="plAnimP"></select><small>o parâmetro vai do mínimo ao máximo e volta</small></div>
    <div class="fx-err" id="plErr"></div>
    <small class="tb-note pl-help">Use x, números (vírgula ou ponto), + − * / ^, parênteses e sen, cos, tg, raiz, abs, ln, log, exp, pi, e. Ex.: <b>0,5x^3 − 2x</b></small>
    <div class="acts"><button class="btn" data-a="x">Cancelar</button><button class="btn primary" data-a="ok">Plotar</button></div>`;
  document.body.appendChild(d);
  const $d = s => d.querySelector(s);
  const inp = $d('#plIn'), err = $d('#plErr');
  const opts = () => model ? { params: model.params } : {};
  const check = () => { try { compileFn(inp.value, opts()); err.textContent = ''; return true; } catch (e) { err.textContent = e.message; return false; } };
  inp.addEventListener('input', check);
  d.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && e.target.tagName === 'INPUT') $d('[data-a="ok"]').click(); });
  d.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { inp.value = b.dataset.c; check(); inp.focus(); });

  // parâmetros do modelo: um controle deslizante por parâmetro
  const paramsUI = () => {
    const box = $d('.pl-params');
    if (!model) { box.innerHTML = ''; return; }
    box.innerHTML = model.params.map(p => `<div class="pl-p" title="${esc(p.desc || '')}"><b>${esc(p.n)}</b>
      <input type="range" data-p="${esc(p.n)}" min="${p.min}" max="${p.max}" step="${p.passo || 'any'}" value="${vals[p.n]}">
      <input type="number" data-pn="${esc(p.n)}" step="${p.passo || 'any'}" value="${vals[p.n]}"><small>${esc(p.desc || '')}</small></div>`).join('');
    box.querySelectorAll('[data-p]').forEach(r => r.oninput = () => { vals[r.dataset.p] = +r.value; box.querySelector(`[data-pn="${r.dataset.p}"]`).value = r.value; });
    box.querySelectorAll('[data-pn]').forEach(r => r.oninput = () => { if (r.value !== '' && isFinite(+r.value)) { vals[r.dataset.pn] = +r.value; box.querySelector(`[data-p="${r.dataset.pn}"]`).value = r.value; } });
    const sel = $d('#plAnimP');
    sel.innerHTML = `<option value="">— não animar —</option>` + model.params.map(p => `<option value="${esc(p.n)}"${p.n === model.anima ? ' selected' : ''}>${esc(p.n)}${p.desc ? ' (' + esc(p.desc) + ')' : ''}</option>`).join('');
  };
  const pickModel = m => {
    model = m; vals = valoresPadrao(m);
    inp.value = m.expr;
    $d('.pl-nota').hidden = false;
    $d('.pl-nota').innerHTML = `<b>${esc(m.nome)}</b>: ${esc(m.nota || '')}. Eixo x: ${esc(m.eixoX || 'x')} · eixo y: ${esc(m.eixoY || 'y')}`;
    $d('#plA').value = m.x[0]; $d('#plB').value = m.x[1];
    $d('#plAxes').checked = true;
    d.querySelectorAll('.pl-list [data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === m.id));
    paramsUI(); check();
  };
  const showArea = id => {
    const a = FN_AREAS.find(x => x.id === id) || FN_AREAS[0];
    cfg.plotArea = a.id; saveCfg();
    d.querySelectorAll('[data-area]').forEach(b => b.classList.toggle('on', b.dataset.area === a.id));
    $d('.pl-list').innerHTML = a.modelos.map(m => `<button class="btn" data-m="${esc(m.id)}" title="${esc(m.nota || '')}">${esc(m.nome)}</button>`).join('');
    d.querySelectorAll('.pl-list [data-m]').forEach(b => b.onclick = () => pickModel(fnModelo(b.dataset.m)));
  };
  const setTab = t => {
    d.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    const mod = t === 'modelos';
    $d('.pl-models').hidden = !mod; $d('.pl-free').hidden = mod; $d('.pl-help').hidden = mod; $d('.pl-anim').hidden = !mod;
    $d('.pl-xhint').hidden = mod;
    if (mod) { showArea(cfg.plotArea); if (!model) pickModel(FN_AREAS.find(a => a.id === cfg.plotArea)?.modelos[0] || FN_AREAS[0].modelos[0]); }
    else { model = null; vals = {}; paramsUI(); $d('.pl-nota').hidden = true; inp.value = cfg.lastPlot || ultimo; $d('#plA').value = $d('#plB').value = ''; check(); }
  };
  d.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  d.querySelectorAll('[data-area]').forEach(b => b.onclick = () => showArea(b.dataset.area));
  const close = () => { d.close(); d.remove(); };
  d.querySelectorAll('[data-a="x"]').forEach(b => b.onclick = close);

  $d('[data-a="ok"]').onclick = () => {
    if (!check()) return;
    const expr = inp.value.trim(), f = compileFn(expr, opts());
    const a = parseFloat($d('#plA').value), b = parseFloat($d('#plB').value);
    const axes = $d('#plAxes').checked, z = S.view.zoom;
    let fr;
    if (model) {
      const x0 = isFinite(a) ? a : model.x[0], x1 = isFinite(b) ? b : model.x[1];
      if (!(x1 > x0)) { err.textContent = 'O fim do intervalo precisa ser maior que o início.'; return; }
      // A faixa inclui os parâmetros atuais e o envelope amostrado da animação.
      const yr = faixaY(f, [x0, x1], vals);
      if (model.y) { yr[0] = Math.min(yr[0], model.y[0]); yr[1] = Math.max(yr[1], model.y[1]); }
      const p = model.params.find(p => p.n === $d('#plAnimP').value);
      if (p) for (let k = 0; k <= 20; k++) {
        const r = faixaY(f, [x0, x1], { ...vals, [p.n]: p.min + (p.max - p.min) * k / 20 });
        yr[0] = Math.min(yr[0], r[0]); yr[1] = Math.max(yr[1], r[1]);
      }
      fr = fitFrame(plotArea(), [x0, x1], yr);
    } else if (isCart && !axes) {
      fr = cartesianFrame();   // escala e origem vêm da folha plano cartesiano
    } else {
      const r = plotArea(), cell = CELL * (PAPER_SIZE[bg.size] || 1) * 2;
      const ox = r.x + r.w / 2, oy = r.y + r.h / 2;
      fr = { ox, oy, cell, xmin: (r.x - ox) / cell, xmax: (r.x + r.w - ox) / cell, ymin: (oy - r.y - r.h) / cell, ymax: (oy - r.y) / cell };
    }
    const xmin = isFinite(a) ? a : fr.xmin, xmax = isFinite(b) ? b : fr.xmax;
    if (!(xmax > xmin)) { err.textContent = 'O fim do intervalo precisa ser maior que o início.'; return; }
    const ink = currentInk(), color = inkShown(ink.color) === '#ffffff' && !R.isDark(bg.color) ? '#000000' : ink.color;
    const width = Math.max(2.5, ink.width) / z;
    const animP = model && $d('#plAnimP').value ? model.params.find(p => p.n === $d('#plAnimP').value) : null;
    const curva = animP ? [] : plotStrokes(f, { ...fr, xmin, xmax, color, width, id: newId, valores: vals }).map(s => ({ ...s, plot: expr }));
    if (!animP && !curva.length) { err.textContent = 'A função não tem pontos visíveis nesse intervalo.'; return; }
    const novos = [...curva];
    if (axes) {
      const meas = document.createElement('canvas').getContext('2d');
      const medir = (t, s) => { meas.font = `${s}px "Segoe UI"`; return meas.measureText(t).width; };
      novos.unshift(...axesStrokes(fr, { color: R.isDark(bg.color) ? '#ffffff' : '#000000', width: 1.6 / z, id: newId, rotulos: true, size: 13 / z, font: 'Segoe UI', medir,
        eixoX: model?.eixoX, eixoY: model?.eixoY }));
    }
    if ($d('#plLabel').checked && curva.length) {
      // rótulo perto do ponto final da curva
      const ult = curva[curva.length - 1].pts, lx = ult[ult.length - 3], ly = ult[ult.length - 2];
      const size = 26 / z, meas = document.createElement('canvas').getContext('2d');
      const text = 'y = ' + expr.replace(/\*/g, '·').replace(/-/g, '−').replace(/\^2(?![\d.,])/g, '²').replace(/\^3(?![\d.,])/g, '³');
      meas.font = `${size}px "Segoe Script"`;
      novos.push({ id: newId(), type: 'text', x: lx + 8 / z, y: ly - size * 1.4, text, color, size, font: 'Segoe Script', w: meas.measureText(text).width + 4 });
    }
    // curva, eixos e rótulo entram agrupados (movem juntos; Desagrupar separa; a borracha apaga cada parte)
    const grp = novos.length > 1 ? newId() : null;
    const itens = grp ? novos.map(i => ({ ...i, grp })) : novos;
    if (!model) { cfg.lastPlot = expr; saveCfg(); }
    if (itens.length) {
      commit([...S.items, ...itens]);
      sel = new Set(itens.map(i => i.id));
      setTool('select');
      scheduleSave();
    }
    close();
    if (animP) startPlotAnim(f, { ...fr, xmin, xmax }, vals, animP, color, width, grp);
  };
  d.showModal();
  setTab(cfg.plotTab === 'modelos' ? 'modelos' : 'livre');
  d.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { cfg.plotTab = b.dataset.tab; saveCfg(); }));
  inp.focus(); inp.select();
  check();
}
