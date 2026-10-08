// Galeria de quadros + navegação (#/ = galeria, #/b/<id> = quadro)
import { listBoards, loadBoard, saveBoard, deleteBoard, newId, emptyBoard, autoTitle, download, safeName, readImageFile, initSession, wfetch, sessionLost } from './api.js';
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

const fmt = ms => {
  const d = new Date(ms), p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function showGallery() {
  hidePop();
  $('board').hidden = true;
  $('gallery').hidden = false;
  document.title = 'Giz Livre';
  try { boards = await listBoards(); }
  catch { boards = []; toast('Servidor local não respondeu. Abra pelo atalho "Giz Livre".', 6000); }
  renderGrid();
}

function renderGrid() {
  const q = $('gSearch').value.trim().toLowerCase();
  const order = $('gSort').value;
  const list = boards.filter(b => !q || b.title.toLowerCase().includes(q))
    .sort((a, b) => order === 'name' ? a.title.localeCompare(b.title, 'pt-BR', { numeric: true }) : b.updated - a.updated);
  $('gGrid').innerHTML = `
    <div class="card new" id="gNew"><div class="plus">${ICON.plus}</div>Criar novo quadro</div>
    ${list.map(b => `
      <div class="card" data-id="${b.id}">
        <div class="thumb" style="background-image:url('/thumbs/${b.id}.png?t=${b.updated}')"></div>
        <div class="meta"><div class="t">${esc(b.title)}</div><div class="d">Editado: ${fmt(b.updated)}</div></div>
        <button class="dots" title="Mais opções">${ICON.more}</button>
      </div>`).join('')}
    ${!list.length && q ? '<div class="g-empty">Nenhum quadro com esse nome.</div>' : ''}`;
  $('gNew').onclick = createBoard;
  $('gGrid').querySelectorAll('.card[data-id]').forEach(c => {
    c.onclick = e => { if (!e.target.closest('.dots')) location.hash = '#/b/' + c.dataset.id; };
    c.querySelector('.dots').onclick = e => { e.stopPropagation(); cardMenu(e.currentTarget, c.dataset.id); };
    c.querySelector('.t').title = 'Duplo clique para renomear';
    c.querySelector('.t').ondblclick = async e => {
      e.stopPropagation();
      const b = boards.find(x => x.id === c.dataset.id), t = await askText('Renomear quadro', b.title);
      if (!t) return;
      const data = await loadBoard(b.id); data.title = t; await saveBoard(b.id, data, null); showGallery();
    };
    c.tabIndex = 0;
    c.onkeydown = e => { if (e.key === 'Enter') location.hash = '#/b/' + c.dataset.id; };
  });
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
        await saveBoard(id, emptyBoard(autoTitle(k === 'free' ? 'Quadro' : k.startsWith('s') ? 'Slides' : 'Caderno'), k === 'free' ? null : makeLayout(k, 1)), null);
        location.hash = '#/b/' + id;
      } catch (e) { toast('Não foi possível criar o quadro: o servidor local não respondeu.', 5000); }
    });
  }, 'right');
}

async function createFromSlides(file) {
  try {
    toast('Importando ' + file.name + '…', 120000);
    const board = await boardFromSlides(file, m => toast(m, 120000));
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
    <button data-a="open">Abrir</button>
    <button data-a="rename">${ICON.edit} Renomear</button>
    <button data-a="dup">${ICON.duplicate} Duplicar</button>
    <button data-a="png">${ICON.image} Exportar imagem (PNG)</button>
    <button data-a="lousa">${ICON.import} Exportar arquivo .lousa</button>
    <hr><button data-a="del" class="danger">${ICON.trash} Excluir</button></div>`, p => {
    const on = (a, fn) => p.querySelector(`[data-a="${a}"]`).onclick = async () => { hidePop(); try { await fn(); } catch (e) { toast(e.message); } };
    on('open', () => { location.hash = '#/b/' + id; });
    on('rename', async () => {
      const t = await askText('Renomear quadro', b.title);
      if (!t) return;
      const data = await loadBoard(id);
      data.title = t;
      await saveBoard(id, data, null);
      showGallery();
    });
    on('dup', async () => {
      const data = await loadBoard(id);
      data.title = (data.title || 'Sem título') + ' (cópia)';
      const nid = newId();
      const c = await boardThumb(data);
      await saveBoard(nid, data, c.toDataURL('image/png'));
      showGallery();
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
      if (!await confirmBox('Excluir quadro?', `"${b.title}" vai para a pasta quadros\\lixeira (dá para recuperar copiando de volta).`, 'Excluir', true)) return;
      await deleteBoard(id);
      showGallery();
    });
  }, 'above');
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
      const c = await boardThumb(board);
      await saveBoard(newId(), board, c.toDataURL('image/png'));
      n++;
    } catch (e) { toast(e.message, 5000); }
  }
  if (n) toast(`${n} quadro(s) importado(s)`);
  showGallery();
}

let routeSeq = 0;
async function route() {
  const seq = ++routeSeq;
  const m = location.hash.match(/^#\/b\/([A-Za-z0-9_-]+)/);
  const ok = await closeBoard();
  if (seq !== routeSeq) return;   // outra navegação começou enquanto fechava
  if (!ok) toast('Atenção: as últimas mudanças ainda não foram salvas. Vou continuar tentando.', 6000);
  if (!m) return showGallery();
  try {
    const data = await loadBoard(m[1]);
    if (seq !== routeSeq) return;
    $('gallery').hidden = true;
    $('board').hidden = false;
    document.title = (data.title || 'Sem título') + ' — Giz Livre';
    openBoard(m[1], data, () => { location.hash = '#/'; });
  } catch (e) {
    toast(e.message);
    location.hash = '#/';
  }
}

fillIcons();
initEditor();
$('gSearch').addEventListener('input', renderGrid);
$('gSort').addEventListener('change', renderGrid);
$('gImport').onclick = () => $('gImportFile').click();
$('gAbout').onclick = () => aboutBox(VERSION);
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
