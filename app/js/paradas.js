// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Roteiro de prints espalhados (P61 B, nível 1): as imagens do quadro viram paradas, na ordem de leitura (de cima para
// baixo, da esquerda para a direita), sem configurar. Os botões ◀ ▶ Parada levam a vista até a anterior ou a seguinte,
// enquadrada com folga para escrever em volta. Marcar e reordenar paradas fica para o nível 2.

/** As paradas: imagens (também as escondidas até a aula), em ordem de leitura. Duas imagens cujas alturas se
 *  sobrepõem pela metade contam como da mesma linha e vão da esquerda para a direita. */
export function paradas(items) {
  const im = items.filter(i => i.type === 'image' && !i.locked && i.camada !== 'rascunho');
  return im.sort((a, b) => {
    const mesmaLinha = Math.abs(a.y - b.y) < Math.min(a.h, b.h) / 2;
    return mesmaLinha ? a.x - b.x : a.y - b.y;
  });
}

/** Vista (zoom, x, y) que enquadra a caixa `b` numa tela W x H, com folga (fração da tela) em volta. */
export function vistaDaCaixa(b, W, H, folga = 0.15, zoomMax = 4) {
  const z = Math.max(0.1, Math.min(zoomMax, (W * (1 - 2 * folga)) / b.w, (H * (1 - 2 * folga)) / b.h));
  return { zoom: z, x: W / 2 - (b.x + b.w / 2) * z, y: H / 2 - (b.y + b.h / 2) * z };
}
