// Utilidades para desenhar as formas da biblioteca (ver shapelib.js para o formato).
// Convenções: cada forma é [id, nome, largura, altura, corpo SVG]. O corpo herda fill="none", stroke="#C",
// stroke-width 2.5, cantos e pontas arredondados. "#C" vira a cor da tinta; use fill="#C" para partes cheias.
// Desenhos próprios do Giz Livre, seguindo só as convenções das normas (ISA 5.1, ISO 10628, IEC 60617, ABNT);
// nada copiado de outras bibliotecas.
export const T = (x, y, s, size = 22) => `<text x="${x}" y="${y}" font-size="${size}" font-family="Segoe UI, Arial, sans-serif" font-weight="600" text-anchor="middle" dominant-baseline="central" fill="#C" stroke="none">${s}</text>`;
export const head = (x, y, ang, L = 12) => { // ponta de seta cheia em (x,y) apontando para `ang` (graus)
  const a = ang * Math.PI / 180, p = (d, s) => `${(x - L * Math.cos(a) + s * L * 0.5 * Math.sin(a)).toFixed(1)},${(y - L * Math.sin(a) - s * L * 0.5 * Math.cos(a)).toFixed(1)}`;
  return `<path d="M${x},${y} L${p(0, 1)} L${p(0, -1)} Z" fill="#C"/>`;
};
export const bow = (cx, cy, r = 16) => `<path d="M${cx - 2 * r},${cy - r} L${cx + 2 * r},${cy + r} V${cy - r} L${cx - 2 * r},${cy + r} Z"/>`; // válvula (gravata)
export const pipe = (cx, cy, r = 16) => `<path d="M${cx - 2 * r - 14},${cy} H${cx - 2 * r} M${cx + 2 * r},${cy} H${cx + 2 * r + 14}"/>`;

