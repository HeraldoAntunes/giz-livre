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
