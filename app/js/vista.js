// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Passo das setas que deslocam a lousa (sem nada selecionado, fora da apresentação). Era 15% da tela por toque em
// qualquer zoom: com a tecla segura, várias telas por segundo, e com o quadro ampliado o conteúdo saltava longe
// (retorno da aula de 03/11/2026, P64 c). Agora o passo é menor e diminui com o zoom (Shift continua o passo maior).
export const PASSO_SETA = 0.06, PASSO_SETA_SHIFT = 0.3;

/** Onde o Ctrl+V põe a imagem ou o texto (P61 C): o último ponto tocado no quadro (coordenadas do mundo), se ele
 *  ainda está na tela com folga para o que for colado; senão null (o editor cola no centro, como antes). */
export function pontoDeColar(toque, view, W, H, folga = 40) {
  if (!toque || !view) return null;
  const sx = toque.x * view.zoom + view.x, sy = toque.y * view.zoom + view.y;
  return sx >= 0 && sy >= 0 && sx <= W - folga && sy <= H - folga ? { x: toque.x, y: toque.y } : null;
}

/** Deslocamento em px de tela de um toque de seta, para uma tela W x H no zoom `zoom`. */
export function passoDaSeta(W, H, zoom, shift = false) {
  const base = (shift ? PASSO_SETA_SHIFT : PASSO_SETA) * Math.min(W, H);
  return zoom > 1 ? base / Math.sqrt(zoom) : base;
}
