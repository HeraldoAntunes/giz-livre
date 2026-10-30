// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Comunicação com o servidor local (server.py)
// Todo pedido que altera dados leva o token da sessão (X-Lousa): bloqueia sites de fora (CSRF) e janelas antigas.
let TOKEN = '', INFO = {};
export async function initSession() {
  const r = await fetch('/api/info');
  const j = await r.json();
  // sem o cookie de acesso (página aberta à mão no navegador, ou por outra conta do Windows), o /api/info não traz o
  // código e nenhum quadro é lido: quem chama mostra "abra pelo atalho"
  if (!j.token) throw new Error('sem acesso');
  TOKEN = j.token || '';
  INFO = j;
  if (j.ocr_conferido === false) conferirOcr(5);
  return j;
}
// o servidor confere o reconhecedor de escrita em segundo plano logo ao abrir; a página pergunta de novo até saber
function conferirOcr(n) {
  setTimeout(async () => {
    try {
      const j = await (await fetch('/api/info')).json();
      Object.assign(INFO, { ocr: j.ocr, ocr_idioma: j.ocr_idioma, ocr_conferido: j.ocr_conferido });
      if (j.ocr_conferido === false && n > 1) conferirOcr(n - 1);
    } catch {}
  }, 1500);
}
// recursos que dependem do sistema: { pptx: 'powerpoint' | 'libreoffice' | null, ocr: bool, ocr_idioma: 'pt-BR' | outro | null, sistema }
export const serverInfo = () => INFO;
// 409: o código mudou, porque o servidor foi aberto de novo (queda, reabertura pelo atalho). A página pede o código
// novo, como ao abrir, e repete o pedido uma vez: o que estava por gravar grava sozinho. Antes, só mostrava
// "Recarregue", e recarregar descartava o que não tinha sido salvo (validação no Linux, 30/10/2026).
// Vários pedidos podem levar 409 ao mesmo tempo (duas gravações em andamento): cada um lembra o código que usou; se
// outro já trouxe o novo, repete direto; se não, todos esperam a mesma renovação (auditoria da rc.2, GL-R01).
export async function wfetch(url, opts = {}) {
  const pedir = t => fetch(url, { ...opts, headers: { ...(opts.headers || {}), 'X-Lousa': t } });
  const usado = TOKEN;
  let r = await pedir(usado);
  if (await deSessao(r) && (TOKEN !== usado || await renovarSessao(usado))) r = await pedir(TOKEN);
  // sem "Recarregar": recarregar descartaria o que ainda não foi salvo (validação no Linux da rc.2)
  if (await deSessao(r)) sessionLost('O Giz Livre foi aberto de novo e esta página perdeu o acesso. Abra o Giz Livre pelo atalho: o que não foi salvo continua nesta página.', false);
  return r;
}
// só o 409 de sessão (código trocado) leva a renovar; outro 409 é conflito do próprio pedido e vai para quem chamou
async function deSessao(r) {
  if (r.status !== 409) return false;
  try { return (await r.clone().json()).sessao === true; } catch { return false; }
}
let renovando = null;
function renovarSessao(antigo) {
  renovando ||= (async () => {
    try {
      const j = await (await fetch('/api/info')).json();
      if (!j.token || j.token === antigo) return false;
      TOKEN = j.token;
      Object.assign(INFO, j);
      const b = document.getElementById('banner');
      if (b) b.hidden = true;   // o aviso de programa fechado já não vale
      return true;
    } catch { return false; } finally { renovando = null; }
  })();
  return renovando;
}
export function tokenHeader() { return { 'X-Lousa': TOKEN }; }
// a página já recebeu o token? (antes disso, um pedido de escrita volta 409 e pareceria "sessão perdida")
export const temSessao = () => !!TOKEN;
export function sessionLost(msg, recarregar = true) {
  let b = document.getElementById('banner');
  if (!b) { b = document.createElement('div'); b.id = 'banner'; document.body.appendChild(b); }
  b.innerHTML = '';
  const t = document.createElement('span'); t.textContent = msg;
  b.append(t);
  if (recarregar) {
    const btn = document.createElement('button'); btn.textContent = 'Recarregar'; btn.onclick = () => location.reload();
    b.append(btn);
  }
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

// criar: quadro novo da galeria (id recém-sorteado); o servidor recusa se já houver um quadro com esse id, em vez de
// gravar por cima de um trazido por pacote ou restaurado, que também ficam na revisão 0
export async function saveBoard(id, board, thumb, criar = false) {
  const r = await wfetch('/api/boards/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: board.title, board, thumb, revision: board._rev || 0, ...(criar ? { criar: true } : {}) }),
  });
  if (!r.ok) {
    const e = new Error(r.status === 412
      ? (criar ? 'Já existe um quadro com o mesmo código. Tente de novo.'
        : 'Este quadro mudou em outra janela. Exporte sua edição como .lousa antes de recarregar.')
      : 'Falha ao salvar');
    e.conflict = r.status === 412;
    throw e;
  }
  const result = await r.json();
  board._rev = result.revision;
  // renomeado ou movido pela galeria enquanto estava aberto: o servidor manteve o nome e a pasta novos
  if (result.meta) { board._meta = result.meta; board.title = result.title; if (result.folder) board.folder = result.folder; else delete board.folder; }
  return result;
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

// renomeia sem reenviar o quadro e sem mudar a revisão (um quadro aberto em outra janela não entra em conflito)
export async function renameBoard(id, title) {
  const r = await wfetch('/api/folder/' + id, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.erro || 'erro ao salvar');
  return j.title;
}

// move para a lixeira; devolve o nome do item na lixeira (para o "Desfazer") ou null
export async function deleteBoard(id) {
  const r = await wfetch('/api/boards/' + id, { method: 'DELETE' });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).erro || 'Falha ao excluir');
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
