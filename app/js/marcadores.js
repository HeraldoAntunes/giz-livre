// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Marcadores (P65): um ponto do quadro guardado com nome e grupo, como a fita de um livro. O ponto é o centro e a
// largura vistos, em coordenadas do quadro: abre com o mesmo enquadramento no notebook e no projetor.
export const CORES_GRUPO = ['#c50f1f', '#0f6cbd', '#107c10', '#ca5010', '#8764b8', '#038387', '#e3008c', '#605e5c'];
export const VOO_MS = 450;

/** O ponto marcado a partir da vista de agora (tela W x H). */
export function pontoDaVista(view, W, H) {
  return { cx: (W / 2 - view.x) / view.zoom, cy: (H / 2 - view.y) / view.zoom, w: W / view.zoom };
}

/** A vista que volta ao ponto marcado numa tela W x H (outra tela: o mesmo enquadramento, na mesma largura). */
export function vistaDoMarcador(m, W, H, zoomMax = 8) {
  const z = Math.max(0.05, Math.min(zoomMax, W / m.w));
  return { zoom: z, x: W / 2 - m.cx * z, y: H / 2 - m.cy * z };
}

/** Altura de cada fitinha na borda (0 a 1): proporcional à posição do ponto entre o mais alto e o mais baixo do quadro. */
export function alturaDasFitas(marcadores, caixa) {
  const y0 = Math.min(caixa?.y ?? Infinity, ...marcadores.map(m => m.cy)), y1 = Math.max(caixa ? caixa.y + caixa.h : -Infinity, ...marcadores.map(m => m.cy));
  return marcadores.map(m => (y1 > y0 ? (m.cy - y0) / (y1 - y0) : 0.5));
}

/** Os marcadores de um grupo, na ordem; `semGrupo` junta os sem grupo e os de grupo que não existe mais. */
export function doGrupo(marcadores, grupoId, grupos) {
  const existe = new Set(grupos.map(g => g.id));
  return marcadores.filter(m => grupoId ? m.grupo === grupoId : !m.grupo || !existe.has(m.grupo))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || (a.criado ?? 0) - (b.criado ?? 0));
}

/** Arrastar `arrastado` para antes de `alvo` (ou para o fim do grupo, sem alvo): as alterações para o servidor. */
export function soltar(marcadores, arrastado, grupoDestino, alvo, grupos) {
  const lista = doGrupo(marcadores, grupoDestino, grupos).filter(m => m.id !== arrastado.id);
  const i = alvo ? lista.findIndex(m => m.id === alvo.id) : -1;
  lista.splice(i < 0 ? lista.length : i, 0, arrastado);
  const g = grupos.find(x => x.id === grupoDestino);
  return lista.map((m, k) => ({ quadro: m.quadro, id: m.id, ordem: k + 1,
    ...(m.id === arrastado.id ? (g ? { grupo: g.id, grupoNome: g.nome, cor: g.cor } : { grupo: '', grupoNome: '', cor: '' }) : {}) }));
}

/** Nome sugerido ao marcar: a página no caderno ou nos slides; senão, o próximo número. */
export function nomeSugerido(pagina, quantos) {
  return pagina ? `Página ${pagina}` : `Marcador ${quantos + 1}`;
}

/** Inserir ou excluir páginas desloca o conteúdo; o marcador vai junto (provas da 1.17.0, D1). novoY(y) dá a altura
 * nova do ponto, ou null se a página dele saiu. Devolve só os que mudaram: antes (como estavam) e depois (sem os que
 * saíram). O número da página acompanha, e o nome também, se ainda for o sugerido ("Página 3"). */
export function seguirPaginas(marcadores, novoY, passo) {
  const antes = [], depois = [];
  for (const m of marcadores || []) {
    const y = novoY(m.cy);
    if (y === m.cy) continue;
    antes.push(m);
    if (y == null) continue;
    const n = { ...m, cy: y };
    if (m.pagina) {
      n.pagina = Math.floor(y / passo) + 1;
      if (m.nome === `Página ${m.pagina}`) n.nome = `Página ${n.pagina}`;
    }
    depois.push(n);
  }
  return { antes, depois };
}

/** O pedido para /api/marcadores que leva os marcadores `de` (como estão no arquivo) a ficarem como `para`. */
export function pedidoDeMudanca(quadro, de, para) {
  const ja = new Map(de.map(m => [m.id, m])), fica = new Set(para.map(m => m.id));
  const novos = [], alterar = [];
  for (const m of para) {
    if (!ja.has(m.id)) { novos.push({ quadro, marcador: m }); continue; }
    const o = ja.get(m.id), dif = {};
    for (const k of ['cx', 'cy', 'w', 'pagina', 'nome']) if (m[k] !== o[k] && m[k] !== undefined) dif[k] = m[k];
    if (Object.keys(dif).length) alterar.push({ quadro, id: m.id, ...dif });
  }
  const apagar = de.filter(m => !fica.has(m.id)).map(m => ({ quadro, id: m.id }));
  return { ...(novos.length ? { novos } : {}), ...(alterar.length ? { alterar } : {}), ...(apagar.length ? { apagar } : {}) };
}

// .lousa (Ordem 21): a miniatura mora na pasta de imagens deste PC; no arquivo ela vai embutida e, ao importar, volta
// a ser imagem da pasta do outro PC. Se uma não der, o marcador segue sem a miniatura (o ponto é o que importa)
const sem = ({ mini, ...m }) => m;
const MINI_LOCAL = /^\/assets\/[0-9a-f]{40}\.(png|jpg)$/, MINI_EMBUTIDA = /^data:image\/(png|jpeg)[;,]/;

/** Os marcadores com a miniatura embutida (ler: endereço /assets/... para data URL). */
export async function embutirMinis(marcadores, ler) {
  return Promise.all((marcadores || []).map(async m => {
    if (typeof m?.mini !== 'string' || !MINI_LOCAL.test(m.mini)) return m?.mini === undefined ? m : sem(m);
    try { return { ...m, mini: await ler(m.mini) }; } catch { return sem(m); }
  }));
}

/** Os marcadores de um .lousa com a miniatura enviada à pasta de imagens (subir: data URL para /assets/...). */
export async function subirMinis(marcadores, subir) {
  return Promise.all((marcadores || []).map(async m => {
    if (typeof m?.mini !== 'string') return m;
    if (!MINI_EMBUTIDA.test(m.mini)) return sem(m);
    try { const url = await subir(m.mini); return typeof url === 'string' && MINI_LOCAL.test(url) ? { ...m, mini: url } : sem(m); }
    catch { return sem(m); }
  }));
}
