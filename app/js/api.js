// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Comunicação com o servidor local (server.py)
// Todo pedido que altera dados leva o token da sessão (X-Lousa): bloqueia sites de fora (CSRF) e janelas antigas.
let TOKEN = '', INFO = {};
export async function initSession() {
  const r = await fetch('/api/info');
  const j = await r.json();
  TOKEN = j.token || '';
  INFO = j;
  return j;
}
// recursos que dependem do sistema: { pptx: 'powerpoint' | 'libreoffice' | null, ocr: bool, sistema }
export const serverInfo = () => INFO;
export async function wfetch(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), 'X-Lousa': TOKEN } });
  if (r.status === 409) sessionLost('O Giz Livre foi reaberto por outra janela ou cópia. Recarregue esta página para continuar salvando.');
  return r;
}
export function tokenHeader() { return { 'X-Lousa': TOKEN }; }
export function sessionLost(msg) {
  let b = document.getElementById('banner');
  if (!b) { b = document.createElement('div'); b.id = 'banner'; document.body.appendChild(b); }
  b.innerHTML = '';
  const t = document.createElement('span'); t.textContent = msg;
  const btn = document.createElement('button'); btn.textContent = 'Recarregar'; btn.onclick = () => location.reload();
  b.append(t, btn);
  b.hidden = false;
}
export async function listBoards() {
  const r = await fetch('/api/boards');
  if (!r.ok) throw new Error('Falha ao listar quadros');
  return r.json();
}

export async function loadBoard(id) {
  const r = await fetch('/api/boards/' + id);
  if (!r.ok) throw new Error('Quadro não encontrado');
  return r.json();
}

export async function saveBoard(id, board, thumb) {
  const r = await wfetch('/api/boards/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: board.title, board, thumb }),
  });
  if (!r.ok) throw new Error('Falha ao salvar');
  return r.json();
}

export async function saveThumb(id, thumb) {
  const r = await wfetch('/api/thumbs/' + id, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ thumb }),
  });
  if (!r.ok) throw new Error('Falha ao salvar miniatura');
}

// muda só a pasta da galeria (campo `folder`; '' = sem pasta), sem mexer na data de edição
export async function setBoardFolder(id, folder) {
  const r = await wfetch('/api/folder/' + id, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: folder || '' }),
  });
  if (!r.ok) throw new Error('Falha ao mover o quadro');
  return (await r.json()).folder || '';
}

// move para a lixeira; devolve o nome do item na lixeira (para o "Desfazer") ou null
export async function deleteBoard(id) {
  const r = await wfetch('/api/boards/' + id, { method: 'DELETE' });
  if (!r.ok) throw new Error('Falha ao excluir');
  return (await r.json()).lixeira || null;
}

// lixeira: [{nome, id, title, folder?, deleted, thumb}], o excluído mais recente primeiro
export async function listTrash() {
  const r = await fetch('/api/lixeira');
  if (!r.ok) throw new Error('Falha ao abrir a lixeira');
  return r.json();
}

// devolve um quadro da lixeira para a galeria: {id, renomeado} (id novo se o antigo já estiver em uso)
export async function restoreTrash(nome) {
  const r = await wfetch('/api/lixeira/restaurar', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome }),
  });
  if (!r.ok) throw new Error('Não foi possível restaurar o quadro');
  return r.json();
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// título automático com data e hora (a galeria não fica cheia de "Sem título")
export function autoTitle(prefix = 'Aula') {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `${prefix} ${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}h${p(d.getMinutes())}`;
}

export function emptyBoard(title = autoTitle(), layout = null) {
  return {
    version: 2,
    title,
    ...(layout ? { layout } : {}),
    background: { color: '#ffffff', pattern: 'none' },
    view: { x: 0, y: 0, zoom: 1 },
    items: [],
  };
}

export function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

export function safeName(s) {
  return (s || 'quadro').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'quadro';
}

// Lê um arquivo de imagem e devolve {src, w, h}, reduzindo para no máximo `max` px
export function readImageFile(file, max = 2400) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida: ' + file.name));
      img.onload = () => {
        let w = img.naturalWidth || 800, h = img.naturalHeight || 600;
        const isSvg = file.type === 'image/svg+xml';
        const k = Math.min(1, max / Math.max(w, h));
        if (k < 1 || isSvg) {
          w = Math.round(w * k); h = Math.round(h * k);
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          const jpg = file.type === 'image/jpeg';
          resolve({ src: c.toDataURL(jpg ? 'image/jpeg' : 'image/png', 0.9), w, h });
        } else {
          resolve({ src: fr.result, w, h });
        }
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
