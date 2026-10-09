// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Galeria de quadros + navegação (#/ = galeria, #/p/<pasta> = pasta da galeria, #/b/<id> = quadro)
import { listBoards, loadBoard, saveBoard, deleteBoard, setBoardFolder, listTrash, restoreTrash, newId, emptyBoard, autoTitle, download, safeName, readImageFile, initSession, wfetch, sessionLost } from './api.js';
import { initEditor, openBoard, closeBoard, tabletCfg, saveTabletCfg } from './editor.js';
import { openTabletSettings } from './tablet.js';
import { renderToCanvas } from './render.js';
import { boardThumb, makeLayout, SIZES } from './pages.js';
import { boardFromSlides, uploadAsset, isPptx, isPdf } from './importer.js';
import { embedAssets } from './editor.js';
import { ICON } from './icons.js';
import { fillIcons, toast, askText, confirmBox, showPop, hidePop, aboutBox } from './ui.js';
import { VERSION } from './version.js';

const $ = id => document.getElementById(id);
let boards = [];
let curFolder = '';   // pasta aberta na galeria ('' = raiz). Pastas são só o campo `folder` de cada quadro
let view = 'grid';    // 'grid' (quadros e pastas) ou 'trash' (lixeira)
let trash = [];       // itens da lixeira (GET /api/lixeira)
// pastas criadas pelo botão "Nova pasta" que ainda não têm quadro (a pasta só existe pelo `folder` dos quadros)
const extraFolders = new Set();

const folderHash = f => f ? '#/p/' + encodeURIComponent(f) : '#/';
const byName = (a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });
const ICON_FOLDER = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 7.5A2.5 2.5 0 015.5 5h3.4l2.2 2.2h7.4A2.5 2.5 0 0121 9.7v6.8a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5z"/><path d="M3 10h18"/></svg>';
// pastas existentes: [{name, n, updated}], em ordem alfabética
function folderList() {
  const m = new Map();
  for (const b of boards) {
    if (!b.folder) continue;
    const f = m.get(b.folder) || { name: b.folder, n: 0, updated: 0 };
    f.n++; f.updated = Math.max(f.updated, b.updated);
    m.set(b.folder, f);
  }
  for (const name of extraFolders) if (!m.has(name)) m.set(name, { name, n: 0, updated: 0 });
  return [...m.values()].sort((a, b) => byName(a.name, b.name));
}
// mesmo critério do servidor (nome_pasta): sem caracteres de controle, espaços simples, até 80 caracteres
const cleanFolder = s => String(s || '').replace(/[\u0000-\u001f\u007f]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);

const fmt = ms => {
  const d = new Date(ms), p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
// pesquisa sem acento e sem caixa ("agua" acha "Água"), como a busca de formas
const plain = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function showGallery(folder = '') {
  hidePop();
  curFolder = folder;
  view = 'grid';
  $('board').hidden = true;
  $('gallery').hidden = false;
  document.title = 'Giz Livre';
  try { boards = await listBoards(); }
  catch { boards = []; toast('Servidor local não respondeu. Abra pelo atalho "Giz Livre".', 6000); }
  renderGrid();
}

const boardCard = (b, showFolder) => `
      <div class="card" data-id="${b.id}">
        <div class="thumb" style="background-image:url('/thumbs/${b.id}.png?t=${b.updated}')"></div>
        <div class="meta"><div class="t">${esc(b.title)}</div><div class="d">${showFolder && b.folder ? `<span class="g-inf">${esc(b.folder)}</span> · ` : ''}Editado: ${fmt(b.updated)}</div></div>
        <button class="dots" title="Mais opções" aria-label="Mais opções">${ICON.more}</button>
      </div>`;

function openFolder(name) { $('gSearch').value = ''; location.hash = folderHash(name); }

// "← Todos os quadros": volta à lista principal e limpa a pesquisa
const backNav = (where, note = '') => `<nav class="g-path" aria-label="Caminho">
      <a href="#/" class="btn g-back">${ICON.back}<span>Todos os quadros</span></a>${where ? `<span class="g-path-sep">›</span><b>${esc(where)}</b>` : ''}
      ${note ? `<span class="g-path-note">${note}</span>` : ''}</nav>`;
function bindBack() {
  const a = $('gGrid').querySelector('.g-back');
  if (a) a.onclick = e => {
    e.preventDefault();
    $('gSearch').value = '';
    if (location.hash === '#/' || location.hash === '') showGallery(''); else location.hash = '#/';
  };
}

function renderGrid() {
  const q = plain($('gSearch').value.trim());
  const order = $('gSort').value;
  const folders = folderList();
  // com pesquisa: procura em todas as pastas (no título e no nome da pasta); sem pesquisa: só o nível aberto
  const list = boards.filter(b => q ? plain(b.title).includes(q) || plain(b.folder).includes(q) : (b.folder || '') === curFolder)
    .sort((a, b) => order === 'name' ? byName(a.title, b.title) : b.updated - a.updated);
  const showFolders = q ? folders.filter(f => plain(f.name).includes(q)) : curFolder ? [] : folders;
  const path = curFolder || q ? backNav(curFolder, q ? 'pesquisa em todas as pastas' : '') : '';
  const fcards = showFolders.length ? `<div class="g-folders">${showFolders.map(f => `
      <div class="fcard" data-folder="${esc(f.name)}" tabindex="0" title="Abrir a pasta">
        <span class="ficon">${ICON_FOLDER}</span>
        <span class="fmeta"><span class="t">${esc(f.name)}</span><span class="d">${f.n} quadro${f.n === 1 ? '' : 's'}</span></span>
        <button class="dots" title="Opções da pasta" aria-label="Opções da pasta">${ICON.more}</button>
      </div>`).join('')}</div>` : '';
  const fora = curFolder ? boards.filter(b => (b.folder || '') !== curFolder).length : 0;
  const empty = list.length ? '' : q ? (showFolders.length ? '' : '<div class="g-empty">Nenhum quadro com esse nome.</div>')
    : curFolder ? `<div class="g-empty">Pasta vazia. Mova quadros para cá pelo ⋯ do quadro (Mover para pasta…)${fora ? ' ou escolha agora:' : '.'}
        ${fora ? `<div><button class="btn primary" id="gPick">${ICON_FOLDER} Escolher quadros…</button></div>` : ''}</div>` : '';
  $('gGrid').innerHTML = `${path}${fcards}
    ${fcards && !q ? '<div class="g-sec">Quadros sem pasta</div>' : ''}
    <div class="card new" id="gNew"><div class="plus">${ICON.plus}</div>${curFolder ? 'Criar quadro nesta pasta' : 'Criar novo quadro'}</div>
    ${list.map(b => boardCard(b, !!q)).join('')}
    ${empty}`;
  $('gNew').onclick = createBoard;
  bindBack();
  if ($('gPick')) $('gPick').onclick = () => pickBoards(curFolder);
  $('gGrid').querySelectorAll('.fcard').forEach(c => {
    const name = c.dataset.folder;
    c.onclick = e => { if (!e.target.closest('.dots')) openFolder(name); };
    c.onkeydown = e => { if (e.key === 'Enter' && e.target === c) openFolder(name); };
    c.querySelector('.dots').onclick = e => { e.stopPropagation(); folderMenu(e.currentTarget, name); };
  });
  $('gGrid').querySelectorAll('.card[data-id]').forEach(c => {
    c.onclick = e => { if (!e.target.closest('.dots')) location.hash = '#/b/' + c.dataset.id; };
    c.querySelector('.dots').onclick = e => { e.stopPropagation(); cardMenu(e.currentTarget, c.dataset.id); };
    c.querySelector('.t').title = 'Toque duas vezes para renomear';
    c.querySelector('.t').ondblclick = async e => {
      e.stopPropagation();
      const b = boards.find(x => x.id === c.dataset.id), t = await askText('Renomear quadro', b.title);
      if (!t) return;
      const data = await loadBoard(b.id); data.title = t; await saveBoard(b.id, data, null); refresh();
    };
    c.tabIndex = 0;
    c.onkeydown = e => { if (e.key === 'Enter') location.hash = '#/b/' + c.dataset.id; };
  });
}
const refresh = () => view === 'trash' ? showTrash() : showGallery(curFolder);

// "Nova pasta": pede o nome e abre a pasta (vazia até receber quadros)
async function newFolder() {
  const t = cleanFolder(await askText('Nova pasta (ex.: nome da disciplina)', ''));
  if (!t) return;
  if (!folderList().some(f => f.name === t)) extraFolders.add(t);
  openFolder(t);
}

// escolher vários quadros de uma vez para mover para a pasta
function pickBoards(folder) {
  const cand = boards.filter(b => (b.folder || '') !== folder).sort((a, b) => b.updated - a.updated);
  const d = document.createElement('dialog');
  d.className = 'g-pick';
  d.innerHTML = `<h3>Mover quadros para "${esc(folder)}"</h3>
    <div class="g-pick-list">${cand.map(b => `<label><input type="checkbox" value="${b.id}">
      <span class="t">${esc(b.title)}</span><small>${b.folder ? esc(b.folder) + ' · ' : ''}${fmt(b.updated)}</small></label>`).join('')}</div>
    <div class="acts"><button class="btn" data-a="0">Cancelar</button><button class="btn primary" data-a="1" disabled>Mover</button></div>`;
  document.body.appendChild(d);
  const ok = d.querySelector('[data-a="1"]');
  const marcados = () => [...d.querySelectorAll('input:checked')].map(x => x.value);
  const close = () => { d.close(); d.remove(); };
  d.addEventListener('change', () => { const n = marcados().length; ok.disabled = !n; ok.textContent = n ? `Mover ${n}` : 'Mover'; });
  d.addEventListener('cancel', e => { e.preventDefault(); close(); });
  d.querySelector('[data-a="0"]').onclick = close;
  ok.onclick = async () => {
    const ids = marcados();
    close();
    await moveBoards(ids, folder);
    toast(`${ids.length} quadro(s) movido(s) para "${folder}"`);
    refresh();
  };
  d.showModal();
}

// menu da pasta: abrir, renomear, remover (os quadros voltam para a raiz; nenhum quadro é apagado)
function folderMenu(anchor, name) {
  const ids = boards.filter(b => b.folder === name).map(b => b.id);
  showPop(anchor, `<div class="menu">
    <button data-a="open">${ICON_FOLDER} Abrir</button>
    <button data-a="rename">${ICON.edit} Renomear pasta</button>
    <hr><button data-a="undo">${ICON.close} Remover a pasta (os quadros ficam)</button></div>`, p => {
    const on = (a, fn) => p.querySelector(`[data-a="${a}"]`).onclick = async () => {
      hidePop();
      try { await fn(); } catch (e) { toast(e.message); refresh(); }
    };
    on('open', () => openFolder(name));
    on('rename', async () => {
      const t = cleanFolder(await askText('Renomear pasta', name));
      if (!t || t === name) return;
      if (folderList().some(f => f.name === t) &&
        !await confirmBox('Juntar as pastas?', `Já existe a pasta "${t}". Os quadros de "${name}" vão para ela.`, 'Juntar')) return;
      if (extraFolders.delete(name)) extraFolders.add(t);
      await moveBoards(ids, t);
      if (curFolder === name) location.hash = folderHash(t); else refresh();
    });
    on('undo', async () => {
      if (ids.length && !await confirmBox('Remover a pasta?', `Os ${ids.length} quadro(s) de "${name}" voltam para a lista principal. Nenhum quadro é apagado.`, 'Remover a pasta')) return;
      extraFolders.delete(name);
      await moveBoards(ids, '');
      if (curFolder === name) location.hash = '#/'; else refresh();
    });
  }, 'below');
}

async function moveBoards(ids, folder) {
  let falhas = 0;
  for (const id of ids) { try { await setBoardFolder(id, folder); } catch { falhas++; } }
  if (falhas) toast(`${falhas} quadro(s) não puderam ser movidos.`, 5000);
}

// "Mover para pasta…": uma pasta existente, uma nova ou sem pasta
function moveMenu(anchor, id) {
  const b = boards.find(x => x.id === id), atual = b?.folder || '';
  const outras = folderList().filter(f => f.name !== atual);
  showPop(anchor, `<h4>Mover para a pasta</h4><div class="menu g-move">
    ${outras.map(f => `<button data-f="${esc(f.name)}">${ICON_FOLDER}<span>${esc(f.name)}</span></button>`).join('')}
    ${outras.length ? '<hr>' : ''}
    <button data-a="new">${ICON.plus} Nova pasta…</button>
    ${atual ? `<button data-a="none">${ICON.back} Sem pasta (lista principal)</button>` : ''}</div>`, p => {
    const go = async folder => {
      hidePop();
      try {
        await setBoardFolder(id, folder);
        toast(folder ? `Movido para a pasta "${folder}"` : 'Movido para a lista principal');
      } catch (e) { toast(e.message); }
      refresh();
    };
    p.querySelectorAll('[data-f]').forEach(x => x.onclick = () => go(x.dataset.f));
    p.querySelector('[data-a="new"]').onclick = async () => {
      hidePop();
      const t = cleanFolder(await askText('Nova pasta (ex.: nome da disciplina)', ''));
      if (t) go(t);
    };
    const none = p.querySelector('[data-a="none"]');
    if (none) none.onclick = () => go('');
  }, 'above');
}

// escolha do tipo de quadro (como o "Novo" do Whiteboard/OneNote)
function createBoard() {
  const kinds = [
    ['free', ICON.grid, 'Quadro livre', 'tela infinita, como no Whiteboard'],
    ['a4', ICON.paper, 'Caderno A4', 'folhas A4 em pé, prontas para imprimir/PDF'],
    ['a4l', ICON.paper, 'Caderno A4 deitado', 'folhas A4 em paisagem'],
    ['s169', ICON.slides, 'Slides 16:9 em branco', 'páginas no formato de apresentação'],
    ['import', ICON.import, 'Abrir PowerPoint ou PDF…', 'cada slide/página vira uma folha para escrever por cima'],
  ];
  showPop($('gNew'), `<h4>Novo quadro</h4><div class="menu newkind">${kinds.map(([k, ic, n, d]) =>
    `<button data-k="${k}">${ic}<span><b>${n}</b><small>${d}</small></span></button>`).join('')}</div>`, p => {
    p.querySelectorAll('[data-k]').forEach(x => x.onclick = async () => {
      hidePop();
      const k = x.dataset.k;
      if (k === 'import') return $('gSlideFile').click();
      try {
        const id = newId();
        const board = emptyBoard(autoTitle(k === 'free' ? 'Quadro' : k.startsWith('s') ? 'Slides' : 'Caderno'), k === 'free' ? null : makeLayout(k, 1));
        if (curFolder) board.folder = curFolder;   // criado dentro da pasta aberta
        await saveBoard(id, board, null);
        location.hash = '#/b/' + id;
      } catch (e) { toast('Não foi possível criar o quadro: o servidor local não respondeu.', 5000); }
    });
  }, 'right');
}

async function createFromSlides(file) {
  try {
    toast('Importando ' + file.name + '…', 120000);
    const board = await boardFromSlides(file, m => toast(m, 120000));
    if (curFolder) board.folder = curFolder;
    const id = newId();
    const c = await boardThumb(board);
    await saveBoard(id, board, c.toDataURL('image/png'));
    toast(`${board.layout.count} página(s) importada(s)`);
    location.hash = '#/b/' + id;
  } catch (e) { toast(e.message, 8000); }
}

function cardMenu(anchor, id) {
  const b = boards.find(x => x.id === id);
  showPop(anchor, `<div class="menu">
    <button data-a="open">${ICON.expand} Abrir</button>
    <button data-a="rename">${ICON.edit} Renomear</button>
    <button data-a="dup">${ICON.duplicate} Duplicar</button>
    <button data-a="move">${ICON_FOLDER} Mover para pasta…</button>
    <button data-a="png">${ICON.image} Exportar imagem (PNG)</button>
    <button data-a="lousa">${ICON.download} Exportar arquivo .lousa</button>
    <hr><button data-a="del" class="danger">${ICON.trash} Excluir</button></div>`, p => {
    const on = (a, fn) => p.querySelector(`[data-a="${a}"]`).onclick = async () => { hidePop(); try { await fn(); } catch (e) { toast(e.message); } };
    on('open', () => { location.hash = '#/b/' + id; });
    on('move', () => moveMenu(anchor, id));
    on('rename', async () => {
      const t = await askText('Renomear quadro', b.title);
      if (!t) return;
      const data = await loadBoard(id);
      data.title = t;
      await saveBoard(id, data, null);
      refresh();
    });
    on('dup', async () => {
      const data = await loadBoard(id);
      data.title = (data.title || 'Sem título') + ' (cópia)';
      const nid = newId();
      const c = await boardThumb(data);
      await saveBoard(nid, data, c.toDataURL('image/png'));
      refresh();
    });
    on('png', async () => {
      const data = await loadBoard(id);
      if (!data.items?.length) return toast('O quadro está vazio');
      const c = await renderToCanvas(data, { scale: 2 });
      c.toBlob(bl => download(bl, safeName(data.title) + '.png'), 'image/png');
    });
    on('lousa', async () => {
      const data = await loadBoard(id);
      data.items = await embedAssets(data.items);
      download(new Blob([JSON.stringify(data)], { type: 'application/json' }), safeName(data.title) + '.lousa');
    });
    on('del', async () => {
      if (!await confirmBox('Excluir quadro?', `"${b.title}" vai para a Lixeira da galeria; dá para restaurar depois.`, 'Excluir', true)) return;
      const nome = await deleteBoard(id);
      await refresh();
      if (nome) toast('Quadro excluído', 8000, { label: 'Desfazer', fn: () => restore(nome) });
    });
  }, 'above');
}

// ---- lixeira: quadros excluídos (quadros/lixeira), com "Restaurar"; nada é apagado de vez pela interface ----
async function restore(nome) {
  try {
    const r = await restoreTrash(nome);
    await refresh();
    toast(r.renomeado ? 'Quadro restaurado (já havia um quadro com o mesmo código: entrou como quadro separado)' : 'Quadro restaurado', 5000,
      { label: 'Abrir', fn: () => { location.hash = '#/b/' + r.id; } });
  } catch (e) { toast(e.message, 5000); refresh(); }
}

async function showTrash() {
  hidePop();
  view = 'trash';
  curFolder = '';
  $('board').hidden = true;
  $('gallery').hidden = false;
  document.title = 'Lixeira — Giz Livre';
  try { trash = await listTrash(); } catch (e) { trash = []; toast(e.message, 5000); }
  renderTrash();
}

function renderTrash() {
  const q = plain($('gSearch').value.trim());
  const list = trash.filter(t => !q || plain(t.title).includes(q) || plain(t.folder).includes(q));
  $('gGrid').innerHTML = `${backNav('Lixeira', q ? 'pesquisa na lixeira' : '')}
    <div class="g-note">Os quadros excluídos ficam guardados aqui. Toque em "Restaurar" para devolver um quadro à galeria (e à pasta em que estava).</div>
    ${list.map(t => `
      <div class="card trash" data-nome="${esc(t.nome)}">
        <div class="thumb"${t.thumb ? ` style="background-image:url('/api/lixeira/${esc(t.nome)}.png')"` : ''}></div>
        <div class="meta"><div class="t" title="${esc(t.title)}">${esc(t.title)}</div>
          <div class="d">${t.folder ? `<span class="g-inf">${esc(t.folder)}</span> · ` : ''}Excluído: ${fmt(t.deleted)}</div></div>
        <div class="g-acts"><button class="btn g-restore">${ICON.restore} Restaurar</button></div>
      </div>`).join('')}
    ${list.length ? '' : `<div class="g-empty">${q ? 'Nenhum quadro excluído com esse nome.' : 'A lixeira está vazia.'}</div>`}`;
  bindBack();
  $('gGrid').querySelectorAll('.card.trash').forEach(c => {
    c.querySelector('.g-restore').onclick = () => restore(c.dataset.nome);
  });
}

// Importa imagens exportadas do Microsoft Whiteboard (um quadro por imagem) ou arquivos .lousa
async function importFiles(files) {
  let n = 0;
  for (const f of files) {
    try {
      let board;
      if (/\.(lousa|json)$/i.test(f.name)) {
        board = JSON.parse(await f.text());
        if (!board || !Array.isArray(board.items)) throw new Error('Arquivo .lousa inválido: ' + f.name);
        board.title = String(board.title || f.name.replace(/\.[^.]+$/, '')).slice(0, 200);
        // só imagens embutidas ou do próprio programa: nada de endereços externos (privacidade)
        const okSrc = s => typeof s === 'string' && (/^data:image\/(png|jpeg|gif|webp|svg\+xml)[;,]/.test(s) || /^\/assets\/[0-9a-f]{40}\.(png|jpg)$/.test(s));
        board.items = board.items.filter(i => i && typeof i === 'object' && (i.type !== 'image' || okSrc(i.src))).map(i => ({ ...i, id: i.id || newId() }));
      } else if (isPptx(f) || isPdf(f)) {
        board = await boardFromSlides(f, m => toast(m, 120000));
      } else {
        const im = await readImageFile(f, 3200);
        board = emptyBoard(f.name.replace(/\.[^.]+$/, ''));
        let src = im.src;
        try { src = await uploadAsset(im.src); } catch {}
        board.items = [{ id: newId(), type: 'image', x: 0, y: 0, w: im.w, h: im.h, src }];
        board.view = null;
      }
      board.title = board.title || f.name.replace(/\.[^.]+$/, '');
      if (curFolder) board.folder = curFolder; else delete board.folder;   // entra na pasta aberta
      const c = await boardThumb(board);
      await saveBoard(newId(), board, c.toDataURL('image/png'));
      n++;
    } catch (e) { toast(e.message, 5000); }
  }
  if (n) toast(`${n} quadro(s) importado(s)`);
  refresh();
}

let routeSeq = 0;
async function route() {
  const seq = ++routeSeq;
  const m = location.hash.match(/^#\/b\/([A-Za-z0-9_-]+)/);
  const ok = await closeBoard();
  if (seq !== routeSeq) return;   // outra navegação começou enquanto fechava
  if (!ok) toast('Atenção: as últimas mudanças ainda não foram salvas. Vou continuar tentando.', 6000);
  if (!m && location.hash === '#/lixeira') return showTrash();
  if (!m) {
    const mp = location.hash.match(/^#\/p\/(.+)$/);
    let folder = '';
    if (mp) { try { folder = cleanFolder(decodeURIComponent(mp[1])); } catch { folder = ''; } }
    return showGallery(folder);
  }
  try {
    const data = await loadBoard(m[1]);
    if (seq !== routeSeq) return;
    $('gallery').hidden = true;
    $('board').hidden = false;
    document.title = (data.title || 'Sem título') + ' — Giz Livre';
    openBoard(m[1], data, () => { location.hash = folderHash(cleanFolder(data.folder)); });
  } catch (e) {
    toast(e.message);
    location.hash = '#/';
  }
}

fillIcons();
initEditor();
$('gSearch').addEventListener('input', () => view === 'trash' ? renderTrash() : renderGrid());
$('gSort').addEventListener('change', () => view === 'trash' ? renderTrash() : renderGrid());
$('gImport').onclick = () => $('gImportFile').click();
$('gNewFolder').onclick = newFolder;
$('gTrash').onclick = () => { $('gSearch').value = ''; if (location.hash === '#/lixeira') showTrash(); else location.hash = '#/lixeira'; };
$('gAbout').onclick = () => aboutBox(VERSION);
$('gVer').textContent = 'versão ' + VERSION;
$('gSlideFile').addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; if (f) await createFromSlides(f); });
$('gTablet').onclick = () => openTabletSettings(tabletCfg(), saveTabletCfg);
$('gImportFile').addEventListener('change', async e => { const f = [...e.target.files]; e.target.value = ''; if (f.length) await importFiles(f); });
$('gallery').addEventListener('dragover', e => e.preventDefault());
$('gallery').addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files.length) importFiles([...e.dataTransfer.files]); });
// mantém o servidor vivo enquanto houver janela aberta; se ele tiver sido fechado, avisa em vez de "salvar" no vazio
async function ping() {
  try { const r = await wfetch('/api/ping', { method: 'POST' }); if (!r.ok && r.status !== 409) throw 0; }
  catch { sessionLost('O programa Giz Livre foi fechado. Abra-o de novo pelo atalho e depois recarregue esta página; o que não foi salvo continua aqui.'); }
}
setInterval(ping, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) ping(); });
addEventListener('hashchange', route);
initSession().then(route, () => { route(); sessionLost('Não consegui falar com o programa Giz Livre. Abra-o pelo atalho.'); });
