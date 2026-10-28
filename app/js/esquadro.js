// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Esquadro (45° ou 30°/60°): triângulo retângulo que se arrasta e gira sobre o quadro; a caneta perto de um lado
// corre presa a ele, como na régua. Só contas: o editor desenha e trata os toques.
// Medidas em px de tela (o esquadro tem o mesmo tamanho na tela em qualquer zoom); `z` é o zoom do quadro.

export const CATETO = 300;   // cateto maior, px de tela
export const TIPOS = { '45': 45, '3060': 30 };   // ângulo agudo junto ao cateto maior

// vértices no mundo: A = canto reto (x, y); B = ponta do cateto maior; C = ponta do cateto menor
export function vertices(e, z = 1) {
  const L = CATETO / z, h = L * Math.tan((TIPOS[e.tipo] || 45) * Math.PI / 180);
  const a = (e.angle || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const w = (u, v) => ({ x: e.x + u * c - v * s, y: e.y + u * s + v * c });
  return [w(0, 0), w(L, 0), w(0, -h)];
}

const lados = V => [[V[0], V[1]], [V[1], V[2]], [V[2], V[0]]];

// lado mais perto do ponto (até `perto` px de tela, por dentro ou por fora); devolve {i, off}: a reta corre por fora
// do lado, afastada metade da espessura do traço
export function ladoPerto(e, x, y, z = 1, largura = 0, perto = 36) {
  let melhor = null;
  for (const [i, [p, q]] of lados(vertices(e, z)).entries()) {
    const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy), t = ((x - p.x) * dx + (y - p.y) * dy) / (L * L);
    if (t < -0.02 || t > 1.02) continue;
    const d = ((x - p.x) * dy - (y - p.y) * dx) / L;   // distância com sinal (positivo = dentro do triângulo)
    if (Math.abs(d) * z > perto || (melhor && Math.abs(d) >= Math.abs(melhor.d))) continue;
    melhor = { i, d, off: -(largura / 2 + 1 / z) };   // sempre do lado de fora, onde o traço aparece
  }
  return melhor && { i: melhor.i, off: melhor.off };
}

// ponto preso ao lado escolhido, sem passar das pontas
export function prender(e, lado, x, y, z = 1) {
  const [p, q] = lados(vertices(e, z))[lado.i];
  const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy);
  const t = Math.max(0, Math.min(1, ((x - p.x) * dx + (y - p.y) * dy) / (L * L)));
  return { x: p.x + dx * t + dy / L * lado.off, y: p.y + dy * t - dx / L * lado.off };
}

// ponto dentro do triângulo?
export function dentro(e, x, y, z = 1) {
  return lados(vertices(e, z)).every(([p, q]) => (x - p.x) * (q.y - p.y) - (y - p.y) * (q.x - p.x) >= 0);
}
