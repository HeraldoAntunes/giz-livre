// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Roteiro de prints espalhados (P61 B, nível 1): as imagens do quadro viram paradas, na ordem de leitura (de cima para
// baixo, da esquerda para a direita), sem configurar. Os botões ◀ ▶ Parada levam a vista até a anterior ou a seguinte,
// enquadrada com folga para escrever em volta. Marcar e reordenar paradas fica para o nível 2.

/** As paradas: imagens (também as escondidas até a aula), em ordem de leitura. A linha começa na imagem mais alta que
 *  ainda não tem linha; entra nela a que se sobrepõe a essa pela metade da altura, e a linha vai da esquerda para a
 *  direita. Comparar só com a primeira da linha dá a mesma ordem qualquer que seja a ordem dos itens no quadro
 *  ("Trazer para a frente" não muda o roteiro; provas da 1.17.0, D5). */
export function paradas(items) {
  const im = items.filter(i => i.type === 'image' && !i.locked && i.camada !== 'rascunho')
    .sort((a, b) => a.y - b.y || a.x - b.x || String(a.id).localeCompare(String(b.id)));
  const linhas = [];
  for (const i of im) {
    const l = linhas[linhas.length - 1];
    if (l && Math.abs(i.y - l[0].y) < Math.min(i.h, l[0].h) / 2) l.push(i); else linhas.push([i]);
  }
  return linhas.flatMap(l => l.sort((a, b) => a.x - b.x || String(a.id).localeCompare(String(b.id))));
}

/** Vista (zoom, x, y) que enquadra a caixa `b` numa tela W x H, com folga (fração da tela) em volta. */
export function vistaDaCaixa(b, W, H, folga = 0.15, zoomMax = 4) {
  const z = Math.max(0.1, Math.min(zoomMax, (W * (1 - 2 * folga)) / b.w, (H * (1 - 2 * folga)) / b.h));
  return { zoom: z, x: W / 2 - (b.x + b.w / 2) * z, y: H / 2 - (b.y + b.h / 2) * z };
}
