// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Educação Física (escola, licenciatura e bacharelado): quadras em planta, táticas, bonecos, materiais, treino e avaliação. Prefixo 'edf-'.
import { head } from './base.js';

// Desenhos próprios do Giz Livre: medidas oficiais das quadras em proporção didática, bonecos de palito próprios,
// sem logotipos de federações, marcas nem pictogramas oficiais.

const r1 = v => +(+v).toFixed(1);
const fino = (d, w = 1.6, extra = '') => `<path d="${d}" stroke-width="${w}"${extra}/>`;
const dot = (x, y, r = 3) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="#C" stroke="none"/>`;
const Tx = (x, y, s, size = 14, anc = 'middle', extra = '') => `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" font-family="Segoe UI, Arial, sans-serif" font-weight="600" text-anchor="${anc}" dominant-baseline="central" fill="#C" stroke="none"${extra}>${s}</text>`;
const TRACO = ' stroke-dasharray="7 5"';
// seta reta de (x1,y1) a (x2,y2) com ponta cheia
const seta = (x1, y1, x2, y2, extra = '', L = 11) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  return `<path d="M${r1(x1)},${r1(y1)} L${r1(x2 - L * 0.8 * Math.cos(a))},${r1(y2 - L * 0.8 * Math.sin(a))}"${extra}/>` + head(r1(x2), r1(y2), r1(a * 180 / Math.PI), L);
};
const seta2 = (x1, y1, x2, y2, extra = '', L = 10) => seta(x1, y1, x2, y2, extra, L) + head(r1(x1), r1(y1), r1(Math.atan2(y1 - y2, x1 - x2) * 180 / Math.PI), L);
const chao = (x1, x2, y) => fino(`M${x1},${y} H${x2}`, 1.8);
const espelho = (W, s) => `<g transform="matrix(-1 0 0 1 ${r1(W)} 0)">${s}</g>`;

// boneco de palito: cabeça c, ombro n, quadril q, cotovelo/mão esquerdos e direitos, joelho/pé esquerdos e direitos
const P = p => `${p[0]},${p[1]}`;
const bon = (c, n, q, ce, me, cd, md, je, pe, jd, pd, r = 9, w = 5) =>
  `<circle cx="${c[0]}" cy="${c[1]}" r="${r}" fill="#C" stroke="none"/>`
  + `<path d="M${P(me)} L${P(ce)} L${P(n)} L${P(cd)} L${P(md)} M${P(n)} L${P(q)} M${P(pe)} L${P(je)} L${P(q)} L${P(jd)} L${P(pd)}" stroke-width="${w}"/>`;

// estrela de n pontas
const estrela = (cx, cy, R, r, n) => 'M' + Array.from({ length: 2 * n }, (_, i) => {
  const a = (i * 180 / n - 90) * Math.PI / 180, q = i % 2 ? r : R;
  return `${r1(cx + q * Math.cos(a))} ${r1(cy + q * Math.sin(a))}`;
}).join(' L') + ' Z';

// ===== Quadras e campos (medidas oficiais em metros × escala s) =====
const volei = (x0, y0, s, rede = true) => {
  const W = 18 * s, H = 9 * s, cx = x0 + W / 2;
  let d = `<rect x="${x0}" y="${y0}" width="${r1(W)}" height="${r1(H)}"/>`
    + fino(`M${r1(cx - 3 * s)},${y0} V${r1(y0 + H)} M${r1(cx + 3 * s)},${y0} V${r1(y0 + H)}`, 1.8);
  if (rede) d += `<path d="M${r1(cx)},${y0 - 8} V${r1(y0 + H + 8)}" stroke-width="4"/>` + dot(cx, y0 - 8, 3.5) + dot(cx, y0 + H + 8, 3.5);
  else d += fino(`M${r1(cx)},${y0} V${r1(y0 + H)}`, 1.8);
  return d;
};
// metade esquerda da quadra de basquete (garrafão, lance livre, 3 pontos, tabela e aro)
const bqMeia = (x0, y0, s) => {
  const H = 15 * s, cy = y0 + H / 2, k = 5.8 * s, kw = 4.9 * s / 2, rc = r1(1.8 * s), bx = x0 + 1.575 * s,
    R = r1(6.75 * s), off = H / 2 - 0.9 * s, dx = Math.sqrt(R * R - off * off);
  return `<path d="M${x0},${r1(cy - kw)} H${r1(x0 + k)} V${r1(cy + kw)} H${x0}"/>`
    + `<path d="M${r1(x0 + k)},${r1(cy - rc)} A${rc},${rc} 0 0 1 ${r1(x0 + k)},${r1(cy + rc)}"/>`
    + `<path d="M${r1(x0 + k)},${r1(cy - rc)} A${rc},${rc} 0 0 0 ${r1(x0 + k)},${r1(cy + rc)}" stroke-width="1.4" stroke-dasharray="4 4"/>`
    + `<path d="M${x0},${r1(cy - off)} H${r1(bx + dx)} A${R},${R} 0 0 1 ${r1(bx + dx)},${r1(cy + off)} H${x0}"/>`
    + fino(`M${r1(x0 + 1.2 * s)},${r1(cy - 0.9 * s)} V${r1(cy + 0.9 * s)}`, 3)
    + `<circle cx="${r1(bx)}" cy="${r1(cy)}" r="${r1(Math.max(3, 0.25 * s))}" stroke-width="1.8"/>`;
};
const basquete = (x0, y0, s) => {
  const W = 28 * s, H = 15 * s, cx = x0 + W / 2, cy = y0 + H / 2;
  return `<rect x="${x0}" y="${y0}" width="${r1(W)}" height="${r1(H)}"/>` + `<path d="M${r1(cx)},${y0} V${r1(y0 + H)}"/>`
    + `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(1.8 * s)}"/>` + bqMeia(x0, y0, s) + espelho(2 * x0 + W, bqMeia(x0, y0, s));
};
// metade esquerda de quadra de futsal (área de meta de 6 m) ou de handebol (área de 6 m, linha de 9 m, 7 m e 4 m)
const fsMeia = (x0, y0, s, hand = false) => {
  const H = 20 * s, cy = y0 + H / 2, g = 1.5 * s, R = r1(6 * s);
  let d = `<path d="M${x0},${r1(cy - g - R)} A${R},${R} 0 0 1 ${r1(x0 + R)},${r1(cy - g)} V${r1(cy + g)} A${R},${R} 0 0 1 ${x0},${r1(cy + g + R)}"/>`
    + `<rect x="${r1(x0 - s)}" y="${r1(cy - g)}" width="${r1(s)}" height="${r1(2 * g)}" stroke-width="2"/>`;
  if (!hand) return d + dot(x0 + 6 * s, cy) + dot(x0 + 10 * s, cy);
  const R9 = r1(9 * s), dx = Math.sqrt(R9 * R9 - (cy - g - y0) ** 2);
  return d + `<path d="M${r1(x0 + dx)},${y0} A${R9},${R9} 0 0 1 ${r1(x0 + R9)},${r1(cy - g)} V${r1(cy + g)} A${R9},${R9} 0 0 1 ${r1(x0 + dx)},${r1(y0 + H)}" stroke-width="1.8" stroke-dasharray="6 5"/>`
    + fino(`M${r1(x0 + 7 * s)},${r1(cy - 0.5 * s)} V${r1(cy + 0.5 * s)}`, 2.5) + fino(`M${r1(x0 + 4 * s)},${r1(cy - 0.4 * s)} V${r1(cy + 0.4 * s)}`, 2);
};
const futsal = (x0, y0, s, hand = false) => {
  const W = 40 * s, H = 20 * s, cx = x0 + W / 2, cy = y0 + H / 2;
  return `<rect x="${x0}" y="${y0}" width="${r1(W)}" height="${r1(H)}"/>` + `<path d="M${r1(cx)},${y0} V${r1(y0 + H)}"/>`
    + (hand ? '' : `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(3 * s)}"/>` + dot(cx, cy))
    + fsMeia(x0, y0, s, hand) + espelho(2 * x0 + W, fsMeia(x0, y0, s, hand));
};
const fbMeia = (x0, y0, s) => {
  const H = 68 * s, cy = y0 + H / 2, c = r1(Math.max(4, s)), R = r1(9.15 * s);
  return `<path d="M${x0},${r1(cy - 20.16 * s)} H${r1(x0 + 16.5 * s)} V${r1(cy + 20.16 * s)} H${x0}"/>`
    + `<path d="M${x0},${r1(cy - 9.16 * s)} H${r1(x0 + 5.5 * s)} V${r1(cy + 9.16 * s)} H${x0}"/>` + dot(x0 + 11 * s, cy, 2.5)
    + `<path d="M${r1(x0 + 16.5 * s)},${r1(cy - 7.31 * s)} A${R},${R} 0 0 1 ${r1(x0 + 16.5 * s)},${r1(cy + 7.31 * s)}"/>`
    + `<rect x="${r1(x0 - 2 * s)}" y="${r1(cy - 3.66 * s)}" width="${r1(2 * s)}" height="${r1(7.32 * s)}" stroke-width="2"/>`
    + fino(`M${r1(x0 + c)},${y0} A${c},${c} 0 0 1 ${x0},${r1(y0 + c)} M${x0},${r1(y0 + H - c)} A${c},${c} 0 0 1 ${r1(x0 + c)},${r1(y0 + H)}`, 1.6);
};
const futebol = (x0, y0, s) => {
  const W = 105 * s, H = 68 * s, cx = x0 + W / 2, cy = y0 + H / 2;
  return `<rect x="${x0}" y="${y0}" width="${r1(W)}" height="${r1(H)}"/>` + `<path d="M${r1(cx)},${y0} V${r1(y0 + H)}"/>`
    + `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(9.15 * s)}"/>` + dot(cx, cy, 2.5) + fbMeia(x0, y0, s) + espelho(2 * x0 + W, fbMeia(x0, y0, s));
};
const tenis = (x0, y0, s) => {
  const W = 23.77 * s, H = 10.97 * s, cx = x0 + W / 2, cy = y0 + H / 2, sl = 1.37 * s, sv = 6.4 * s, p = 0.914 * s;
  return `<rect x="${x0}" y="${y0}" width="${r1(W)}" height="${r1(H)}"/>`
    + `<path d="M${x0},${r1(y0 + sl)} H${r1(x0 + W)} M${x0},${r1(y0 + H - sl)} H${r1(x0 + W)}"/>`
    + `<path d="M${r1(cx - sv)},${r1(y0 + sl)} V${r1(y0 + H - sl)} M${r1(cx + sv)},${r1(y0 + sl)} V${r1(y0 + H - sl)} M${r1(cx - sv)},${r1(cy)} H${r1(cx + sv)}"/>`
    + fino(`M${x0},${r1(cy)} h5 M${r1(x0 + W)},${r1(cy)} h-5`, 2.5)
    + `<path d="M${r1(cx)},${r1(y0 - p)} V${r1(y0 + H + p)}" stroke-width="4"/>` + dot(cx, y0 - p, 3.5) + dot(cx, y0 + H + p, 3.5);
};
const badminton = (x0, y0, s) => {
  const W = 13.4 * s, H = 6.1 * s, cx = x0 + W / 2, cy = y0 + H / 2, sl = 0.46 * s, ss = 1.98 * s, ls = 0.76 * s;
  return `<rect x="${x0}" y="${y0}" width="${r1(W)}" height="${r1(H)}"/>`
    + `<path d="M${x0},${r1(y0 + sl)} H${r1(x0 + W)} M${x0},${r1(y0 + H - sl)} H${r1(x0 + W)}"/>`
    + `<path d="M${r1(cx - ss)},${y0} V${r1(y0 + H)} M${r1(cx + ss)},${y0} V${r1(y0 + H)} M${r1(x0 + ls)},${y0} V${r1(y0 + H)} M${r1(x0 + W - ls)},${y0} V${r1(y0 + H)}"/>`
    + `<path d="M${x0},${r1(cy)} H${r1(cx - ss)} M${r1(cx + ss)},${r1(cy)} H${r1(x0 + W)}"/>`
    + `<path d="M${r1(cx)},${y0 - 6} V${r1(y0 + H + 6)}" stroke-width="4"/>` + dot(cx, y0 - 6, 3.5) + dot(cx, y0 + H + 6, 3.5);
};
const pista = () => {
  const cx = 124, cy = 74, L = 101, R = 44, faixa = 5.2;
  let d = '';
  for (let i = 0; i <= 6; i++) {
    const r = R + i * faixa;
    d += `<rect x="${r1(cx - L / 2 - r)}" y="${r1(cy - r)}" width="${r1(L + 2 * r)}" height="${r1(2 * r)}" rx="${r1(r)}"${i && i < 6 ? ' stroke-width="1.3"' : ''}/>`;
  }
  return d + fino(`M${r1(cx + L / 2)},${cy + R} V${r1(cy + R + 6 * faixa)}`, 3.5)
    + fino(`M${r1(cx - L / 2)},${cy - R} V${r1(cy + R)} M${r1(cx + L / 2)},${cy - R} V${r1(cy + R)}`, 1.2, ' stroke-dasharray="3 4"')
    + Tx(cx, cy, '400 m', 18);
};
const piscina = () => {
  const x0 = 26, y0 = 8, W = 200, H = 108, n = 6, h = H / n;
  let d = `<rect x="${x0}" y="${y0}" width="${W}" height="${H}"/>`;
  for (let i = 1; i < n; i++) d += fino(`M${x0},${r1(y0 + i * h)} H${x0 + W}`, 1.6, ' stroke-dasharray="2 4"');
  for (let i = 0; i < n; i++) {
    const y = r1(y0 + (i + 0.5) * h);
    d += fino(`M${x0 + 28},${y} H${x0 + W - 16} M${x0 + 28},${r1(y - 4)} v8 M${x0 + W - 16},${r1(y - 4)} v8`, 1.4)
      + `<rect x="${x0 - 12}" y="${r1(y - 5)}" width="10" height="10" rx="1.5" stroke-width="1.8"/>` + Tx(x0 + 13, y, String(i + 1), 14);
  }
  return d;
};

// ===== Táticas =====
const xis = (x, y, r = 7, w = 3) => fino(`M${r1(x - r)},${r1(y - r)} L${r1(x + r)},${r1(y + r)} M${r1(x + r)},${r1(y - r)} L${r1(x - r)},${r1(y + r)}`, w);
const jog = (x, y, r = 6.5, cheio = false) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" stroke-width="2.4"${cheio ? ' fill="#C"' : ''}/>`;
const formacao = (linhas, rotulo) => {
  const s = 2.1, x0 = 10, y0 = 8;
  let d = futebol(x0, y0, s) + jog(x0 + 4 * s, y0 + 34 * s, 6.5, true);
  linhas.forEach(([x, ys]) => ys.forEach(y => { d += jog(x0 + x * s, y0 + y * s); }));
  return d + Tx(120, 170, rotulo, 18);
};
const ondas = (x1, x2, y, a = 6, p = 12) => { let d = `M${x1},${y}`; for (let x = x1; x + p <= x2; x += p) d += ` q${p / 2},${-2 * a} ${p},0`; return d; };

const rodizio = () => {
  const x0 = 14, y0 = 26, s = 18, S = 9 * s, cols = [1.5, 4.5, 7.5].map(m => x0 + m * s), fr = y0 + 1.5 * s, fd = y0 + 6 * s;
  const pos = { 4: [cols[0], fr], 3: [cols[1], fr], 2: [cols[2], fr], 5: [cols[0], fd], 6: [cols[1], fd], 1: [cols[2], fd] };
  let d = `<rect x="${x0}" y="${y0}" width="${S}" height="${S}"/>` + fino(`M${x0},${y0 + 3 * s} H${x0 + S}`, 1.8)
    + `<path d="M${x0 - 8},${y0} H${x0 + S + 8}" stroke-width="4.5"/>` + Tx(x0 + S / 2, 11, 'rede', 14);
  for (const [k, [x, y]] of Object.entries(pos)) d += `<circle cx="${x}" cy="${y}" r="14" stroke-width="2.2"/>` + Tx(x, y, k, 18);
  const ordem = [2, 1, 6, 5, 4, 3, 2];
  for (let i = 0; i < 6; i++) {
    const [ax, ay] = pos[ordem[i]], [bx, by] = pos[ordem[i + 1]], L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L;
    d += seta(ax + 17 * ux, ay + 17 * uy, bx - 17 * ux, by - 17 * uy, ' stroke-width="2"', 9);
  }
  return d;
};

// ===== Materiais =====
const bolaFutebol = () => {
  const c = 46, R = 40, pent = [], d = [];
  for (let k = 0; k < 5; k++) {
    const a = (-90 + 72 * k) * Math.PI / 180;
    pent.push(`${r1(c + 13 * Math.cos(a))},${r1(c + 13 * Math.sin(a))}`);
    const ex = c + 27 * Math.cos(a), ey = c + 27 * Math.sin(a);
    d.push(`M${r1(c + 13 * Math.cos(a))},${r1(c + 13 * Math.sin(a))} L${r1(ex)},${r1(ey)}`);
    for (const b of [-24, 24]) { const a2 = a + b * Math.PI / 180; d.push(`M${r1(ex)},${r1(ey)} L${r1(c + R * Math.cos(a2))},${r1(c + R * Math.sin(a2))}`); }
  }
  return `<circle cx="${c}" cy="${c}" r="${R}"/><path d="M${pent.join(' L')} Z" fill="#C"/>` + fino(d.join(' '), 1.8);
};
const bolaVolei = () => {
  const c = 46, pt = g => { const a = g * Math.PI / 180; return `${r1(c + 40 * Math.cos(a))},${r1(c + 40 * Math.sin(a))}`; };
  let d = '<circle cx="46" cy="46" r="40"/>';
  for (let k = 0; k < 3; k++) d += `<g transform="rotate(${120 * k} 46 46)">` + fino(`M46,46 C58,38 70,32 ${pt(-28)} M53,58 C66,50 76,50 ${pt(8)}`, 1.9) + '</g>';
  return d;
};
// cordas da raquete dentro da elipse (cx, cy, rx, ry)
const cordas = (cx, cy, rx, ry, p) => {
  let d = '';
  for (let x = cx - rx + p; x < cx + rx; x += p) { const h = ry * Math.sqrt(1 - ((x - cx) / rx) ** 2); d += `M${r1(x)},${r1(cy - h)} V${r1(cy + h)} `; }
  for (let y = cy - ry + p; y < cy + ry; y += p) { const h = rx * Math.sqrt(1 - ((y - cy) / ry) ** 2); d += `M${r1(cx - h)},${r1(y)} H${r1(cx + h)} `; }
  return fino(d, 1);
};
const folha = (bx, by, tx, ty, w = 7) => {
  const mx = (bx + tx) / 2, my = (by + ty) / 2, L = Math.hypot(tx - bx, ty - by), nx = -(ty - by) / L * w, ny = (tx - bx) / L * w;
  return `<path d="M${bx},${by} Q${r1(mx + nx)},${r1(my + ny)} ${tx},${ty} Q${r1(mx - nx)},${r1(my - ny)} ${bx},${by} Z" stroke-width="1.8"/>` + fino(`M${bx},${by} L${tx},${ty}`, 1);
};
const cronometro = () => {
  let d = '<circle cx="50" cy="68" r="40"/><rect x="43" y="8" width="14" height="9" rx="2"/><path d="M50,17 V28"/>'
    + '<path d="M80,30 L87,23 M84,26 L92,34" stroke-width="3"/>';
  for (let k = 0; k < 12; k++) {
    const a = k * 30 * Math.PI / 180, r2 = k % 3 ? 33 : 29;
    d += fino(`M${r1(50 + 36 * Math.sin(a))},${r1(68 - 36 * Math.cos(a))} L${r1(50 + r2 * Math.sin(a))},${r1(68 - r2 * Math.cos(a))}`, k % 3 ? 1.4 : 2.4);
  }
  return d + '<path d="M50,68 L66,44" stroke-width="3"/>' + dot(50, 68, 4);
};

// ===== Corpo humano (silhueta própria, frente; quadro 100 × 200) =====
const metade = [[56, 31], [58, 37], [72, 42], [79, 49], [82, 64], [84, 90], [87, 114], [89, 127], [86, 134], [81, 127], [79, 115], [76, 92], [72, 64],
  [69, 84], [71, 100], [70, 124], [66, 152], [66, 168], [62, 186], [67, 195], [53, 195], [54, 186], [54, 166], [54, 150], [53, 124], [50, 112]];
const contorno = [...metade, ...metade.slice(0, -1).reverse().map(([x, y]) => [100 - x, y])];
const corpoPath = (() => {
  const p = contorno, n = p.length;
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < n; i++) {
    const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
    d += ` C${r1(b[0] + (c[0] - a[0]) / 6)},${r1(b[1] + (c[1] - a[1]) / 6)} ${r1(c[0] - (e[0] - b[0]) / 6)},${r1(c[1] - (e[1] - b[1]) / 6)} ${c[0]},${c[1]}`;
  }
  return d + ' Z';
})();
const corpo = (ox, oy, k = 1, extra = '') => `<g transform="translate(${ox} ${oy}) scale(${k})" stroke-width="${r1(2.5 / k)}"><circle cx="50" cy="18" r="13"/><path d="${corpoPath}"/>${extra}</g>`;
const musc = (d, k) => `<path d="${d}" stroke-width="${r1(1.6 / k)}"/>`;
const espelhoX = d => d.replace(/(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/g, (m, x, _a, y) => `${r1(100 - +x)},${y}`);
const par = (d, k) => musc(d, k) + musc(espelhoX(d), k);
const rotulo = (tx, ty, px, py, s, anc) => fino(`M${r1(anc === 'end' ? tx + 3 : anc === 'start' ? tx - 3 : tx)},${r1(anc === 'middle' ? ty + (py > ty ? 9 : -9) : ty)} L${r1(px)},${r1(py)}`, 1.1) + Tx(tx, ty, s, 14, anc);

const muscFrente = () => {
  const k = 0.9, ox = 87, oy = 8, X = x => ox + k * x, Y = y => oy + k * y;
  const m = par('M60,40 Q76,40 80,58', k) + par('M51,46 Q61,43 70,50 Q67,62 52,62', k) + par('M77,62 Q83,72 79,86 Q74,74 77,62', k)
    + musc('M43,66 H57 V104 H43 Z M50,66 V104 M43,78 H57 M43,90 H57', k) + par('M64,68 Q68,84 63,98', k)
    + par('M60,116 Q69,132 64,152 Q55,136 60,116', k);
  return corpo(ox, oy, k, m)
    + rotulo(80, 30, X(24), Y(46), 'deltoide', 'end') + rotulo(80, 70, X(22), Y(72), 'bíceps', 'end') + rotulo(80, 140, X(38), Y(134), 'quadríceps', 'end')
    + rotulo(184, 40, X(62), Y(54), 'peitoral', 'start') + rotulo(184, 86, X(56), Y(84), 'abdome', 'start') + rotulo(184, 120, X(65), Y(92), 'oblíquos', 'start');
};
const muscCostas = () => {
  const k = 0.9, ox = 87, oy = 8, X = x => ox + k * x, Y = y => oy + k * y;
  const m = musc('M50,32 L66,42 L50,76 L34,42 Z', k) + par('M60,40 Q76,40 80,58', k) + par('M77,58 Q83,70 80,86 Q74,72 77,58', k)
    + par('M53,62 Q64,58 70,64 Q68,84 54,98', k) + par('M51,100 Q66,96 68,110 Q64,120 51,116', k)
    + par('M60,124 Q68,138 62,154 Q55,138 60,124', k) + par('M60,158 Q67,168 60,180 Q55,168 60,158', k);
  return corpo(ox, oy, k, m)
    + rotulo(80, 28, X(24), Y(46), 'deltoide', 'end') + rotulo(80, 66, X(21), Y(72), 'tríceps', 'end') + rotulo(80, 112, X(41), Y(108), 'glúteos', 'end')
    + rotulo(80, 166, X(40), Y(168), 'panturrilha', 'end')
    + rotulo(184, 30, X(56), Y(44), 'trapézio', 'start') + rotulo(184, 74, X(64), Y(76), 'grande', 'start') + Tx(184, 90, 'dorsal', 14, 'start')
    + rotulo(184, 136, X(62), Y(140), 'isquiotibiais', 'start');
};

// alavancas: A = apoio (eixo), P = potência (força), R = resistência
const alavanca = (xa, xp, pCima, xr, nome) => {
  const pSeta = pCima ? seta(xp, 108, xp, 68, ' stroke-width="3"', 12) + Tx(xp + 14, 100, 'P', 18) : seta(xp, 16, xp, 56, ' stroke-width="3"', 12) + Tx(xp + 14, 22, 'P', 18);
  return '<path d="M12,62 H208" stroke-width="5"/>' + `<path d="M${xa},65 L${xa - 12},86 H${xa + 12} Z" fill="#C"/>` + chao(xa - 20, xa + 20, 89)
    + Tx(xa, 100, 'A', 18) + pSeta + `<rect x="${xr - 13}" y="34" width="26" height="24" rx="2" stroke-width="2.2"/>` + Tx(xr, 46, 'R', 16)
    + Tx(110, 124, nome, 14);
};

// ===== Jogos =====
const circuito = () => {
  const cx = 115, cy = 84, rx = 92, ry = 60, n = 6, pts = [];
  for (let k = 0; k < n; k++) { const a = (-90 + 360 * k / n) * Math.PI / 180; pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  let d = '';
  pts.forEach(([x, y], k) => {
    d += `<circle cx="${r1(x)}" cy="${r1(y)}" r="17" stroke-width="2.2"/>` + Tx(x, y, String(k + 1), 18);
    const [bx, by] = pts[(k + 1) % n], L = Math.hypot(bx - x, by - y), ux = (bx - x) / L, uy = (by - y) / L;
    d += seta(x + 21 * ux, y + 21 * uy, bx - 21 * ux, by - 21 * uy, ' stroke-width="2"', 9);
  });
  return d;
};
const roda = () => {
  const cx = 90, cy = 90, R = 60, n = 8, pts = [];
  for (let k = 0; k < n; k++) { const a = 2 * Math.PI * k / n; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a), a]); }
  let d = '';
  pts.forEach(([x, y, a], k) => {
    const tx = -Math.sin(a), ty = Math.cos(a);
    d += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="15" ry="6" transform="rotate(${r1(a * 180 / Math.PI + 90)} ${r1(x)} ${r1(y)})" stroke-width="2"/>` + dot(x, y, 7);
    const [bx, by, b] = pts[(k + 1) % n], ex = x + 15 * tx, ey = y + 15 * ty, fx = bx + 15 * Math.sin(b), fy = by - 15 * Math.cos(b);
    d += `<path d="M${r1(ex)},${r1(ey)} L${r1(fx)},${r1(fy)}" stroke-width="3.5"/>`;
  });
  return d;
};

const S_QUADRAS = [
  ['edf-volei', 'Quadra de vôlei', 244, 140, volei(14, 16, 12)],
  ['edf-basquete', 'Quadra de basquete', 244, 140, basquete(10, 10, 8)],
  ['edf-futsal', 'Quadra de futsal', 260, 146, futsal(12, 13, 6)],
  ['edf-handebol', 'Quadra de handebol', 260, 146, futsal(12, 13, 6, true)],
  ['edf-futebol', 'Campo de futebol', 244, 162, futebol(11, 9, 2.1)],
  ['edf-poliesportiva', 'Quadra poliesportiva', 262, 176, futsal(12, 10, 6)
    + `<g stroke-width="1.6" stroke-dasharray="7 4">${basquete(48, 25, 6)}</g>`
    + `<g stroke-width="1.8" stroke-dasharray="1.5 4">${volei(78, 43, 6, false)}</g>`
    + fino('M14,163 h22', 2.5) + Tx(40, 163, 'futsal', 14, 'start') + fino('M100,163 h22', 1.6, ' stroke-dasharray="7 4"') + Tx(126, 163, 'basquete', 14, 'start')
    + fino('M196,163 h22', 1.8, ' stroke-dasharray="1.5 4"') + Tx(222, 163, 'vôlei', 14, 'start')],
  ['edf-pista', 'Pista de atletismo (400 m)', 262, 161, "<g transform=\"translate(6.70 6.20)\">" + (pista()) + "</g>"],
  ['edf-piscina', 'Piscina com raias', 234, 124, piscina()],
  ['edf-tenis', 'Quadra de tênis', 228, 126, tenis(12, 16, 8.5)],
  ['edf-badminton', 'Quadra de badminton', 240, 124, badminton(13, 14, 16)],
  ['edf-meia-basquete', 'Meia quadra de basquete', 164, 172, `<rect x="10" y="10" width="140" height="150"/>` + bqMeia(10, 10, 10)
    + '<path d="M150,67 A18,18 0 0 0 150,103"/>'],
];

const S_TATICA = [
  ['edf-jog-x', 'Jogador (X)', 40, 40, xis(20, 20, 12, 4)],
  ['edf-jog-o', 'Jogador (O)', 40, 40, '<circle cx="20" cy="20" r="13" stroke-width="4"/>'],
  ['edf-bola-tat', 'Bola (tática)', 30, 30, '<circle cx="15" cy="15" r="9" fill="#C"/>'],
  ['edf-cone-tat', 'Cone (tática)', 36, 34, '<path d="M18,4 L32,30 H4 Z" fill="#C"/>'],
  ['edf-seta-passe', 'Passe (seta tracejada)', 150, 30, seta(6, 15, 144, 15, ' stroke-dasharray="8 6"', 13)],
  ['edf-seta-desloc', 'Deslocamento sem bola', 150, 30, seta(6, 15, 144, 15, '', 13)],
  ['edf-seta-drible', 'Condução / drible', 150, 30, fino(ondas(6, 126, 17) + ' L132,17', 2.5) + head(144, 17, 0, 13)],
  ['edf-seta-chute', 'Chute / arremesso', 150, 34, '<path d="M6,12 H126 M6,22 H126"/>' + head(146, 17, 0, 20)],
  ['edf-bloqueio', 'Bloqueio (corta-luz)', 150, 30, '<path d="M6,15 H132 M132,4 V26" stroke-width="3"/>'],
  ['edf-4-4-2', 'Formação 4-4-2', 244, 182, formacao([[20, [10, 26, 42, 58]], [42, [10, 26, 42, 58]], [62, [26, 42]]], '4-4-2')],
  ['edf-4-3-3', 'Formação 4-3-3', 244, 182, formacao([[20, [10, 26, 42, 58]], [42, [17, 34, 51]], [64, [12, 34, 56]]], '4-3-3')],
  ['edf-rodizio-volei', 'Rodízio do vôlei (posições)', 190, 194, rodizio()],
  ['edf-zona-2-3', 'Defesa por zona 2-3 (basquete)', 164, 172, `<rect x="10" y="10" width="140" height="150"/>` + bqMeia(10, 10, 10)
    + '<path d="M150,67 A18,18 0 0 0 150,103"/>' + xis(60, 32) + xis(50, 85) + xis(60, 138) + xis(104, 60) + xis(104, 110)],
];

const S_BONECOS = [
  ['edf-parado', 'Em pé (posição inicial)', 100, 130, bon([50, 16], [50, 32], [50, 72], [38, 52], [34, 74], [62, 52], [66, 74], [44, 98], [42, 124], [56, 98], [58, 124]) + chao(20, 80, 127)],
  ['edf-caminhar', 'Caminhar', 100, 130, bon([52, 16], [52, 32], [50, 72], [44, 52], [38, 70], [58, 52], [66, 68], [44, 98], [36, 123], [56, 98], [64, 123]) + chao(18, 82, 127)],
  ['edf-correr', 'Correr', 104, 124, bon([62, 17], [57, 32], [48, 68], [43, 45], [37, 58], [65, 50], [77, 41], [41, 93], [24, 106], [67, 79], [62, 101])
    + fino('M6,40 h14 M2,54 h14 M6,68 h14', 2)],
  ['edf-saltar', 'Saltar (salto vertical)', 100, 134, bon([50, 18], [50, 34], [50, 72], [38, 20], [32, 6], [62, 20], [68, 6], [42, 92], [36, 110], [58, 92], [64, 110])
    + chao(20, 80, 130) + fino('M20,124 l-4,-6 M80,124 l4,-6', 2)],
  ['edf-salto-distancia', 'Salto em distância', 132, 104, bon([40, 22], [45, 36], [58, 62], [62, 40], [78, 44], [60, 32], [77, 33], [78, 64], [96, 70], [76, 72], [94, 79])
    + fino('M4,98 Q20,30 36,22', 1.4, ' stroke-dasharray="4 4"') + '<path d="M84,98 H128" stroke-width="3"/>' + fino('M90,94 l4,-4 M104,94 l4,-4 M118,94 l4,-4', 1.4)],
  ['edf-arremessar', 'Arremessar à cesta', 130, 150, `<g transform="translate(0 12)">${bon([38, 30], [40, 46], [40, 84], [32, 34], [44, 16], [50, 36], [50, 18], [34, 106], [34, 130], [46, 106], [48, 130])}</g>`
    + '<circle cx="48" cy="18" r="8" stroke-width="2.2"/>' + fino('M54,10 Q82,-6 104,30', 1.4, ' stroke-dasharray="4 4"') + chao(14, 70, 146)
    + '<path d="M124,6 V44" stroke-width="3"/><ellipse cx="110" cy="34" rx="12" ry="3" stroke-width="2.2"/>' + fino('M100,35 L104,50 M110,37 V52 M120,35 L116,50', 1.2)],
  ['edf-lancar', 'Lançar (por cima)', 104, 128, bon([54, 18], [51, 34], [47, 70], [37, 26], [25, 14], [63, 40], [76, 36], [38, 96], [26, 122], [61, 96], [72, 122])
    + '<circle cx="20" cy="9" r="6" fill="#C" stroke="none"/>' + chao(14, 90, 125)],
  ['edf-chutar', 'Chutar', 112, 128, bon([44, 16], [44, 32], [46, 70], [30, 44], [20, 56], [58, 42], [70, 36], [42, 96], [42, 122], [66, 86], [84, 94])
    + '<circle cx="96" cy="98" r="9" stroke-width="2.2"/>' + fino('M91,93 l6,4 l4,-4', 1.4) + chao(20, 104, 125)],
  ['edf-nadar', 'Nadar (crawl)', 142, 72, "<g transform=\"translate(1.00 0.00)\">" + (bon([108, 42], [95, 44], [52, 46], [108, 52], [124, 54], [84, 24], [99, 20], [34, 43], [14, 39], [34, 50], [14, 54], 8)
    + fino('M4,40 q6,-6 12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0', 1.8)) + "</g>"],
  ['edf-alongar-quad', 'Alongamento de quadríceps', 100, 130, bon([50, 16], [50, 32], [50, 72], [42, 54], [36, 82], [64, 46], [78, 40], [50, 98], [50, 124], [55, 100], [37, 85])
    + chao(26, 74, 127)],
  ['edf-alongar-lateral', 'Alongamento lateral', 100, 130, bon([36, 22], [40, 36], [50, 72], [34, 54], [30, 72], [56, 20], [38, 6], [42, 98], [34, 124], [58, 98], [66, 124])
    + chao(20, 80, 127)],
  ['edf-agachar', 'Agachamento', 100, 130, bon([60, 37], [53, 52], [36, 90], [66, 58], [84, 58], [66, 62], [86, 62], [64, 100], [54, 124], [68, 102], [60, 124])
    + chao(20, 90, 127)],
  ['edf-flexao', 'Flexão de braço', 122, 104, bon([106, 60], [94, 66], [54, 82], [96, 82], [96, 98], [100, 82], [100, 98], [34, 89], [12, 96], [34, 91], [14, 97]) + chao(4, 118, 100)],
  ['edf-prancha', 'Prancha', 126, 104, bon([108, 73], [96, 78], [54, 87], [96, 96], [116, 96], [98, 96], [118, 97], [34, 92], [12, 96], [34, 93], [14, 97]) + chao(4, 122, 100)],
  ['edf-abdominal', 'Abdominal', 112, 106, bon([24, 58], [32, 72], [50, 94], [46, 70], [62, 66], [46, 74], [64, 72], [74, 70], [92, 98], [76, 72], [94, 98]) + chao(4, 108, 101)],
  ['edf-polichinelo', 'Polichinelo', 100, 132, bon([50, 18], [50, 34], [50, 72], [34, 22], [24, 8], [66, 22], [76, 8], [38, 98], [28, 124], [62, 98], [72, 124])
    + fino('M14,30 q-6,10 0,20 M86,30 q6,10 0,20', 1.6) + chao(16, 84, 127)],
  ['edf-pedalar', 'Pedalar', 128, 126, '<circle cx="28" cy="102" r="20" stroke-width="2.2"/><circle cx="100" cy="102" r="20" stroke-width="2.2"/>'
    + fino('M28,102 L52,64 L62,102 Z M52,64 H88 L62,102 M88,64 L100,102 M88,64 L86,54 L95,52 M46,60 H58', 2)
    + bon([84, 20], [74, 31], [52, 58], [84, 42], [91, 54], [86, 44], [94, 54], [72, 74], [70, 96], [60, 82], [54, 106])],
];

const S_MATERIAIS = [
  ['edf-bola-futebol', 'Bola de futebol', 92, 92, bolaFutebol()],
  ['edf-bola-volei', 'Bola de vôlei', 92, 92, bolaVolei()],
  ['edf-bola-basquete', 'Bola de basquete', 92, 92, '<circle cx="46" cy="46" r="40"/>' + fino('M46,6 V86 M6,46 H86 M18,17 Q36,46 18,75 M74,17 Q56,46 74,75', 2)],
  ['edf-bola-tenis', 'Bola de tênis', 80, 80, '<circle cx="40" cy="40" r="34"/>' + fino('M12,21 Q34,40 12,59 M68,21 Q46,40 68,59', 2)],
  ['edf-bola-medicinal', 'Medicine ball', 92, 92, '<circle cx="46" cy="46" r="40"/>' + fino('M12,25 Q46,38 80,25 M12,67 Q46,54 80,67', 2) + Tx(46, 46, '3 kg', 18)],
  ['edf-peteca', 'Peteca', 70, 112, folha(28, 80, 8, 16) + folha(32, 80, 26, 6) + folha(38, 80, 44, 6) + folha(42, 80, 62, 16)
    + '<path d="M22,80 H48 V92 Q48,106 35,106 Q22,106 22,92 Z"/>' + fino('M22,86 H48', 1.4)],
  ['edf-cone', 'Cone', 100, 110, '<path d="M44,10 H56 L76,96 H24 Z"/><path d="M37,40 H63 L66.2,54 H33.8 Z" fill="#C"/><rect x="12" y="96" width="76" height="9" rx="2"/>'],
  ['edf-bambole', 'Bambolê', 132, 72, '<ellipse cx="66" cy="36" rx="60" ry="28"/><ellipse cx="66" cy="36" rx="52" ry="21" stroke-width="2"/>'
    + fino(Array.from({ length: 12 }, (_, k) => { const a = k * 30 * Math.PI / 180; return `M${r1(66 + 52 * Math.cos(a))},${r1(36 + 21 * Math.sin(a))} L${r1(66 + 60 * Math.cos(a))},${r1(36 + 28 * Math.sin(a))}`; }).join(' '), 3)],
  ['edf-corda', 'Corda de pular', 120, 108, '<path d="M16,58 C12,-8 108,-8 104,58" stroke-width="2.2"/><rect x="10" y="58" width="12" height="40" rx="5"/><rect x="98" y="58" width="12" height="40" rx="5"/>'],
  ['edf-colchonete', 'Colchonete', 160, 66, '<path d="M8,44 L38,22 H152 L122,44 Z M8,44 H122 V58 H8 Z M122,44 L152,22 V36 L122,58"/>' + fino('M46,44 L76,22 M84,44 L114,22', 1.4)],
  ['edf-halter', 'Halter', 140, 60, '<path d="M34,30 H106" stroke-width="5"/><rect x="12" y="10" width="13" height="40" rx="3"/><rect x="25" y="16" width="9" height="28" rx="2"/>'
    + '<rect x="115" y="10" width="13" height="40" rx="3"/><rect x="106" y="16" width="9" height="28" rx="2"/>' + fino('M54,26 v8 M62,26 v8 M70,26 v8 M78,26 v8 M86,26 v8', 1.2)],
  ['edf-kettlebell', 'Kettlebell', 100, 108, '<path d="M38.5,102 H61.5 A34,34 0 1 0 38.5,102 Z"/><path d="M28,48 V30 Q28,8 50,8 Q72,8 72,30 V48"/><path d="M39,39 V32 Q39,20 50,20 Q61,20 61,32 V39" stroke-width="2"/>'],
  ['edf-barra', 'Barra com anilhas', 220, 80, '<path d="M8,40 H212" stroke-width="4"/><rect x="34" y="8" width="13" height="64" rx="3"/><rect x="47" y="15" width="10" height="50" rx="2"/><rect x="57" y="33" width="6" height="14" rx="1"/>'
    + '<rect x="173" y="8" width="13" height="64" rx="3"/><rect x="163" y="15" width="10" height="50" rx="2"/><rect x="157" y="33" width="6" height="14" rx="1"/>' + fino('M92,36 v8 M100,36 v8 M108,36 v8 M116,36 v8 M124,36 v8', 1.2)],
  ['edf-apito', 'Apito', 110, 78, '<path d="M44,24 H104 V40 H66.6 A24,24 0 1 1 44,24 Z"/>' + fino('M50,24 L56,32 H64 L60,24', 1.8) + dot(42, 50, 5)
    + '<circle cx="16" cy="22" r="8" stroke-width="2"/>' + fino('M22,27 L28,34', 2)],
  ['edf-cronometro', 'Cronômetro', 100, 114, cronometro()],
  ['edf-rede-volei', 'Rede de vôlei', 240, 120, '<path d="M14,8 V116 M226,8 V116" stroke-width="4.5"/><rect x="24" y="16" width="192" height="40"/><rect x="24" y="16" width="192" height="5" fill="#C"/>'
    + fino(Array.from({ length: 15 }, (_, i) => `M${36 + 12 * i},21 V56`).join(' ') + ' M24,31 H216 M24,41 H216 M24,51 H216', 1)
    + fino('M14,18 H24 M14,54 H24 M216,18 H226 M216,54 H226', 1.6) + fino('M40,4 V60 M200,4 V60', 2.5, ' stroke-dasharray="5 4"') + chao(4, 236, 117)],
  ['edf-trave', 'Trave de futebol', 220, 128, '<path d="M20,120 V20 H200 V120" stroke-width="5"/><path d="M34,108 V34 H186 V108 M20,20 L34,34 M200,20 L186,34 M20,120 L34,108 M200,120 L186,108" stroke-width="1.8"/>'
    + fino(Array.from({ length: 12 }, (_, i) => `M${46 + 12 * i},34 V108`).join(' ') + ' M34,46 H186 M34,58 H186 M34,70 H186 M34,82 H186 M34,94 H186', 1) + chao(4, 216, 121)],
  ['edf-cesta', 'Tabela e cesta', 124, 160, '<rect x="12" y="12" width="80" height="54" rx="2"/><rect x="38" y="34" width="28" height="22" stroke-width="1.8"/>'
    + '<path d="M92,40 H104 V156 M92,156 H116" stroke-width="4"/><ellipse cx="52" cy="66" rx="17" ry="4" stroke-width="3"/>'
    + fino('M35,66 L42,96 M44,68 L47,96 M52,70 V96 M60,68 L57,96 M69,66 L62,96 M37,76 L52,86 L67,76 M39,86 L52,94 L65,86', 1.2)],
  ['edf-raquete', 'Raquete', 80, 180, '<ellipse cx="40" cy="52" rx="32" ry="44"/><ellipse cx="40" cy="52" rx="27" ry="39" stroke-width="1.4"/>' + cordas(40, 52, 27, 39, 7)
    + '<path d="M19,86 Q36,104 36,118 M61,86 Q44,104 44,118"/><rect x="34" y="118" width="12" height="56" rx="4"/>' + fino('M34,132 H46 M34,146 H46 M34,160 H46', 1.2)],
  ['edf-step', 'Step', 152, 72, '<path d="M12,32 L34,16 H140 L118,32 Z M12,32 H118 V46 H12 Z M118,32 L140,16 V30 L118,46"/>'
    + '<path d="M18,46 V60 H38 V46 M92,46 V60 H112 V46" stroke-width="2"/>' + fino('M30,28 L48,20 M54,28 L72,20 M78,28 L96,20 M102,28 L120,20', 1.2)],
  ['edf-barreira', 'Barreira de atletismo', 130, 116, '<rect x="12" y="22" width="106" height="16" rx="2"/><path d="M28,22 H44 L38,38 H22 Z M68,22 H84 L78,38 H62 Z" fill="#C" stroke="none"/>'
    + '<path d="M20,38 V104 M110,38 V104" stroke-width="3"/><path d="M8,104 H40 M90,104 H122" stroke-width="4"/>' + chao(4, 126, 110)],
  ['edf-podio', 'Pódio', 200, 108, '<path d="M14,100 V50 H74 V26 H126 V66 H186 V100 Z M74,50 V100 M126,66 V100"/>' + Tx(44, 75, '2', 24) + Tx(100, 60, '1', 26) + Tx(156, 83, '3', 22) + chao(4, 196, 103)],
  ['edf-medalha', 'Medalha', 90, 128, '<path d="M18,4 H38 L52,58 H38 Z M72,4 H52 L38,58 H52 Z" stroke-width="2"/><circle cx="45" cy="88" r="32"/><circle cx="45" cy="88" r="24" stroke-width="1.6"/>'
    + `<path d="${estrela(45, 89, 15, 6.5, 5)}" fill="#C" stroke="none"/>`],
];

const S_TREINO = [
  ['edf-planos', 'Planos anatômicos', 222, 232, corpo(10, 14) + `<rect x="4" y="4" width="112" height="222" stroke-width="1.6"${TRACO}/>`
    + fino('M52,14 L68,4 V214 L52,224 Z', 1.8, ' stroke-dasharray="2 4"') + fino('M2,124 L22,104 H118 L98,124 Z', 2.2)
    + rotulo(128, 26, 68, 18, 'sagital', 'start') + rotulo(128, 114, 118, 106, 'transversal', 'start') + rotulo(128, 200, 116, 196, 'frontal', 'start')],
  ['edf-eixos', 'Eixos anatômicos', 232, 236, corpo(10, 18) + seta2(60, 6, 60, 230, ' stroke-width="2" stroke-dasharray="7 4"')
    + seta2(2, 112, 118, 112, ' stroke-width="2" stroke-dasharray="7 4"') + seta2(42, 134, 80, 92, ' stroke-width="2"')
    + rotulo(128, 22, 62, 14, 'longitudinal', 'start') + rotulo(128, 76, 114, 108, 'transversal', 'start') + rotulo(128, 140, 80, 96, 'anteroposterior', 'start')],
  ['edf-musc-frente', 'Músculos (frente)', 256, 194, muscFrente()],
  ['edf-musc-costas', 'Músculos (costas)', 272, 194, muscCostas()],
  ['edf-alavanca-interfixa', 'Alavanca interfixa', 220, 134, alavanca(110, 190, false, 30, 'interfixa: A entre P e R')],
  ['edf-alavanca-inter-resistente', 'Alavanca inter-resistente', 220, 134, alavanca(20, 190, true, 110, 'inter-resistente: R no meio')],
  ['edf-alavanca-interpotente', 'Alavanca interpotente', 220, 134, alavanca(20, 100, true, 190, 'interpotente: P no meio')],
  ['edf-zonas-fc', 'Zonas de frequência cardíaca', 262, 176, '<path d="M30,10 V150 H248"/>'
    + [0, 1, 2, 3, 4].map(i => { const x = 34 + 42 * i, h = 26 + 24 * i; return `<rect x="${x + 3}" y="${150 - h}" width="36" height="${h}" stroke-width="2"/>` + Tx(x + 21, 150 - h / 2, 'Z' + (i + 1), 16) + Tx(x, 164, String(50 + 10 * i), 14) + fino(`M${x},150 v4`, 1.4); }).join('') + Tx(244, 164, '100', 14) + fino('M244,150 v4', 1.4)
    + Tx(14, 80, '% FC máx', 14, 'middle', ' transform="rotate(-90 14 80)"')],
  ['edf-supercompensacao', 'Curva de supercompensação', 250, 164, '<path d="M20,10 V150 H244"/>' + fino('M20,80 H244', 1.4, ' stroke-dasharray="5 5"')
    + '<path d="M20,80 H48 C62,80 70,120 88,120 C106,120 128,50 150,50 C170,50 186,76 238,78"/>'
    + seta(48, 40, 48, 74, ' stroke-width="2"', 9) + Tx(48, 30, 'treino', 14) + Tx(88, 136, 'fadiga', 14) + Tx(152, 34, 'supercompensação', 14) + Tx(242, 94, 'nível inicial', 14, 'end')],
  ['edf-macrociclo', 'Periodização: volume e intensidade', 278, 190, '<path d="M20,10 V140 H270"/>' + fino('M124,14 V140 M210,14 V140', 1.4, ' stroke-dasharray="4 4"')
    + '<path d="M24,40 C60,24 96,36 136,84 S194,124 266,112"/>' + `<path d="M24,124 C80,114 120,66 160,36 S224,90 266,124"${TRACO}/>`
    + Tx(72, 154, 'preparatório', 14) + Tx(167, 154, 'competitivo', 14) + Tx(242, 154, 'transição', 14)
    + fino('M24,178 h26', 2.5) + Tx(56, 178, 'volume', 14, 'start') + `<path d="M130,178 h26"${TRACO}/>` + Tx(162, 178, 'intensidade', 14, 'start')],
  ['edf-ciclos', 'Macro, meso e microciclos', 250, 128, '<rect x="10" y="8" width="230" height="26" rx="3"/>' + Tx(125, 21, 'macrociclo', 15)
    + [0, 1, 2].map(i => `<rect x="${10 + 77 * i}" y="42" width="${i < 2 ? 74 : 76}" height="26" rx="3" stroke-width="2"/>` + Tx(47 + 77 * i, 55, 'mesociclo', 14)).join('')
    + Array.from({ length: 9 }, (_, i) => `<rect x="${r1(10 + 25.7 * i)}" y="76" width="23" height="20" rx="2" stroke-width="1.6"/>`).join('')
    + Tx(125, 114, 'microciclos (semanas)', 14)],
  ['edf-piramide-af', 'Pirâmide da atividade física', 260, 200, '<path d="M130,8 L250,192 H10 Z"/>' + fino('M84.4,70 H175.6 M57,112 H203 M31,152 H229', 2)
    + Tx(130, 56, 'telas', 14) + Tx(130, 91, '2–3×: força', 14) + Tx(130, 132, '3–5×: aeróbio', 14) + Tx(130, 172, 'todo dia: mover-se', 14)],
  ['edf-vo2-epoc', 'Consumo de O₂: déficit e EPOC', 250, 164, '<path d="M20,10 V140 H244"/>' + `<path d="M20,120 H60 V50 H170 V120 H244" stroke-width="1.6"${TRACO}/>`
    + '<path d="M20,120 H60 C70,80 80,52 110,50 H170 C180,100 200,118 244,120"/>'
    + rotulo(100, 18, 68, 70, 'déficit de O₂', 'middle') + Tx(150, 38, 'estado estável', 14) + rotulo(214, 80, 190, 104, 'EPOC', 'middle')
    + Tx(24, 10, 'VO₂', 14, 'start') + Tx(240, 154, 'tempo', 14, 'end')],
];

const S_AVALIACAO = [
  ['edf-adipometro', 'Adipômetro (dobra cutânea)', 162, 112, '<path d="M18,20 H96 Q110,20 110,34 V84" stroke-width="3.5"/><path d="M18,42 H76 Q90,42 90,56 V84" stroke-width="3.5"/>'
    + fino('M58,25 L66,28 L54,31 L66,34 L54,37 L60,39', 1.6) + '<circle cx="38" cy="20" r="14" stroke-width="2"/>' + fino('M38,20 L45,13 M28,20 h3 M38,10 v3 M48,20 h-3', 1.6)
    + '<path d="M6,102 H72 C84,102 84,72 100,72 C116,72 116,102 128,102 H156" stroke-width="2"/>'],
  ['edf-wells', 'Banco de Wells (sentar e alcançar)', 210, 128, '<rect x="130" y="70" width="56" height="52"/><rect x="110" y="62" width="94" height="8" stroke-width="1.8"/>'
    + fino(Array.from({ length: 11 }, (_, i) => `M${114 + 8 * i},62 v${i % 5 ? -4 : -7}`).join(' '), 1.2)
    + bon([85, 73], [74, 83], [40, 116], [98, 72], [120, 64], [96, 74], [118, 66], [84, 117], [126, 116], [84, 118], [126, 117]) + chao(6, 204, 122)],
  ['edf-salto-vertical', 'Teste de salto vertical', 172, 170, '<path d="M122,6 V164" stroke-width="4"/>'
    + fino(Array.from({ length: 13 }, (_, i) => `M122,${14 + 8 * i} h${i % 5 ? -5 : -10}`).join(' '), 1.3)
    + bon([84, 52], [90, 66], [90, 104], [80, 82], [76, 96], [102, 46], [114, 24], [84, 128], [80, 148], [96, 128], [98, 148])
    + fino('M114,24 H158 M122,60 H158', 1.4, ' stroke-dasharray="4 3"') + seta2(148, 28, 148, 56, ' stroke-width="1.8"', 8) + Tx(160, 42, 'h', 16) + chao(6, 122, 164)],
  ['edf-vaivem', 'Teste de vaivém (20 m)', 240, 108, '<path d="M20,24 V100 M220,24 V100" stroke-width="3"/>'
    + seta(100, 12, 24, 12, ' stroke-width="1.6"', 8) + seta(140, 12, 216, 12, ' stroke-width="1.6"', 8) + Tx(120, 12, '20 m', 14)
    + seta(32, 46, 208, 46, ' stroke-width="2.2"') + seta(208, 72, 32, 72, ' stroke-width="2.2"')
    + '<path d="M20,90 L28,104 H12 Z M220,90 L228,104 H212 Z" fill="#C"/>' + Tx(120, 92, 'bip', 14)],
  ['edf-cooper', 'Teste de Cooper (12 min)', 220, 140, '<rect x="10" y="10" width="200" height="120" rx="60"/><rect x="30" y="30" width="160" height="80" rx="40"/>'
    + fino('M50,20 H170 M50,120 H170 M20,70 A50,50 0 0 1 70,20 M150,20 A50,50 0 0 1 200,70', 1.2, ' stroke-dasharray="3 4"')
    + seta(130, 20, 90, 20, ' stroke-width="2.2"', 9) + Tx(110, 70, '12 min', 20)],
  ['edf-tabela', 'Tabela de registro', 256, 134, '<rect x="6" y="6" width="244" height="120"/>' + fino('M6,30 H250', 2.2)
    + fino('M6,54 H250 M6,78 H250 M6,102 H250 M90,6 V126 M145,6 V126 M200,6 V126', 1.4)
    + Tx(48, 18, 'Nome', 14) + Tx(117.5, 18, 'Teste 1', 14) + Tx(172.5, 18, 'Teste 2', 14) + Tx(225, 18, 'Média', 14)],
  ['edf-fita-metrica', 'Fita métrica', 200, 80, '<circle cx="40" cy="40" r="30"/><circle cx="40" cy="40" r="9" stroke-width="2"/>' + '<path d="M62,60 H192 V72 H62"/><path d="M192,56 V76" stroke-width="3"/>'
    + fino(Array.from({ length: 21 }, (_, i) => `M${68 + 6 * i},60 v${i % 5 ? 4 : 8}`).join(' '), 1.1)],
  ['edf-estadiometro', 'Estadiômetro (altura)', 124, 200, '<rect x="78" y="6" width="14" height="182"/><rect x="40" y="38" width="52" height="7" rx="1" fill="#C"/><rect x="20" y="188" width="90" height="7" rx="1"/>'
    + fino(Array.from({ length: 18 }, (_, i) => `M78,${54 + 7.5 * i} h${i % 4 ? 4 : 8}`).join(' '), 1.1)
    + bon([54, 55], [54, 72], [54, 120], [44, 96], [42, 120], [64, 96], [66, 120], [48, 152], [46, 186], [60, 152], [62, 186], 10, 4.5)],
  ['edf-imc', 'IMC (fórmula)', 244, 90, Tx(42, 45, 'IMC =', 20) + '<path d="M82,45 H236" stroke-width="2"/>' + Tx(159, 27, 'massa (kg)', 18) + Tx(159, 65, 'altura² (m²)', 18)],
  ['edf-goniometro', 'Goniômetro', 184, 112, '<path d="M20,100 A70,70 0 0 1 160,100 Z"/>'
    + fino(Array.from({ length: 13 }, (_, i) => { const a = Math.PI - i * Math.PI / 12, r2 = i % 3 ? 64 : 58; return `M${r1(90 + 70 * Math.cos(a))},${r1(100 - 70 * Math.sin(a))} L${r1(90 + r2 * Math.cos(a))},${r1(100 - r2 * Math.sin(a))}`; }).join(' '), 1.4)
    + '<path d="M90,100 H178" stroke-width="4"/><path d="M90,100 L144,36" stroke-width="4"/>' + dot(90, 100, 4)
    + fino('M112,100 A22,22 0 0 0 104.1,83.1', 1.6) + Tx(124, 86, 'θ', 16)],
];

const S_JOGOS = [
  ['edf-amarelinha', 'Amarelinha', 110, 222, '<path d="M25,36 A30,30 0 0 1 85,36 Z"/><rect x="25" y="36" width="60" height="30"/><path d="M55,36 V66"/>'
    + '<rect x="40" y="66" width="30" height="30"/><rect x="25" y="96" width="60" height="30"/><path d="M55,96 V126"/>'
    + '<rect x="40" y="126" width="30" height="30"/><rect x="40" y="156" width="30" height="30"/><rect x="40" y="186" width="30" height="30"/>'
    + Tx(55, 22, 'céu', 15) + Tx(40, 51, '7', 16) + Tx(70, 51, '8', 16) + Tx(55, 81, '6', 16) + Tx(40, 111, '4', 16) + Tx(70, 111, '5', 16)
    + Tx(55, 141, '3', 16) + Tx(55, 171, '2', 16) + Tx(55, 201, '1', 16)],
  ['edf-cabo-guerra', 'Cabo de guerra', 250, 110, '<path d="M6,58 H244" stroke-width="3"/><path d="M125,58 L119,74 H131 Z" fill="#C"/>' + fino('M125,80 V106', 2, ' stroke-dasharray="4 4"')
    + bon([23, 29], [28, 42], [40, 74], [42, 50], [54, 58], [46, 46], [66, 58], [44, 90], [46, 104], [54, 88], [66, 104])
    + espelho(250, bon([23, 29], [28, 42], [40, 74], [42, 50], [54, 58], [46, 46], [66, 58], [44, 90], [46, 104], [54, 88], [66, 104])) + chao(6, 244, 106)],
  ['edf-circuito', 'Circuito em estações', 230, 168, circuito()],
  ['edf-pique-bandeira', 'Pique-bandeira', 250, 130, '<rect x="8" y="8" width="234" height="114"/><path d="M125,8 V122"/>'
    + `<rect x="8" y="42" width="34" height="46" stroke-width="1.6"${TRACO}/><rect x="208" y="42" width="34" height="46" stroke-width="1.6"${TRACO}/>`
    + '<path d="M22,78 V50 M228,78 V50" stroke-width="2"/><path d="M22,50 L36,56 L22,62 Z M228,50 L214,56 L228,62 Z" fill="#C"/>'
    + xis(70, 40) + xis(92, 90) + jog(160, 40, 7) + jog(182, 90, 7)],
  ['edf-queimada', 'Queimada', 250, 130, '<rect x="8" y="8" width="234" height="114"/><path d="M125,8 V122"/>' + fino('M38,8 V122 M212,8 V122', 1.8, ' stroke-dasharray="6 4"')
    + Tx(23, 65, 'cemitério', 14, 'middle', ' transform="rotate(-90 23 65)"') + Tx(227, 65, 'cemitério', 14, 'middle', ' transform="rotate(90 227 65)"')
    + Tx(82, 65, 'time A', 15) + Tx(168, 65, 'time B', 15) + dot(125, 30, 6)],
  ['edf-corrida-saco', 'Corrida de saco', 100, 140, bon([50, 16], [50, 32], [50, 66], [36, 48], [32, 64], [64, 48], [68, 64], [46, 80], [44, 90], [54, 80], [56, 90])
    + '<path d="M30,64 Q50,58 70,64 L76,122 Q50,130 24,122 Z"/>' + fino('M34,68 l2,10 M50,64 v10 M66,68 l-2,10', 1.2) + fino('M30,134 h-12 M70,134 h12', 2) + chao(30, 70, 136)],
  ['edf-roda', 'Roda (ciranda)', 180, 180, roda()],
];

const S_AVENTURA = [
  ['edf-escalada', 'Escalada', 150, 190, '<path d="M40,6 V184" stroke-width="2"/>' + chao(6, 146, 184)
    + [[72, 34, 20], [114, 40, -30], [74, 140, 10], [116, 128, 40], [60, 88, 0], [130, 92, 20], [100, 166, -20], [56, 172, 30]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="4" transform="rotate(${a} ${x} ${y})" fill="#C" stroke="none"/>`).join('')
    + fino('M96,4 L93,100', 1.4) + bon([92, 50], [92, 64], [92, 104], [78, 52], [72, 38], [106, 52], [114, 44], [80, 124], [74, 138], [106, 116], [116, 126])],
  ['edf-skate', 'Skate', 140, 140, '<path d="M14,116 Q20,123 30,123 H110 Q120,123 126,116" stroke-width="3.5"/><circle cx="38" cy="131" r="5" stroke-width="2"/><circle cx="102" cy="131" r="5" stroke-width="2"/>'
    + bon([66, 31], [66, 46], [68, 80], [48, 54], [32, 62], [84, 52], [102, 46], [50, 96], [42, 118], [88, 96], [96, 118])],
  ['edf-slackline', 'Slackline', 240, 150, '<path d="M14,140 V30 M226,140 V30" stroke-width="5"/><path d="M14,90 Q120,106 226,90" stroke-width="2.5"/>'
    + bon([120, 18], [120, 32], [118, 66], [102, 30], [86, 22], [138, 30], [154, 22], [117, 84], [118, 100], [132, 80], [140, 92]) + chao(4, 236, 141)],
  ['edf-trilha', 'Trilha (caminhada)', 232, 156, '<path d="M66,112 L112,46 L138,78 L170,34 L226,112"/>' + fino('M100,62 L112,46 L122,58 M160,48 L170,34 L180,48', 1.4)
    + fino('M62,150 Q128,144 134,124 T156,104', 2, ' stroke-dasharray="5 5"') + chao(6, 226, 151)
    + '<rect x="24" y="78" width="12" height="24" rx="3" stroke-width="2.2"/>' + fino('M60,82 L56,150', 2)
    + bon([42, 64], [42, 78], [40, 112], [50, 94], [58, 102], [34, 94], [32, 108], [48, 130], [54, 148], [34, 130], [28, 148], 8, 4.5)],
  ['edf-luta', 'Luta (judô)', 200, 150, bon([62, 26], [66, 40], [64, 82], [84, 52], [98, 44], [84, 62], [100, 58], [54, 110], [48, 142], [74, 110], [80, 142])
    + espelho(200, bon([62, 26], [66, 40], [64, 82], [84, 52], [98, 44], [84, 62], [100, 58], [54, 110], [48, 142], [74, 110], [80, 142]))
    + fino('M56,80 H72 M128,80 H144', 3) + chao(20, 180, 145)],
  ['edf-capoeira', 'Capoeira (ginga)', 130, 142, bon([58, 26], [62, 40], [64, 78], [48, 56], [34, 68], [78, 48], [76, 26], [42, 104], [18, 134], [88, 100], [96, 134]) + chao(8, 122, 137)],
  ['edf-berimbau', 'Berimbau', 100, 240, '<path d="M60,8 Q20,120 60,232" stroke-width="4"/>' + fino('M60,8 V232', 1.2) + '<circle cx="36" cy="192" r="20"/>' + fino('M47,186 H60', 1.6)
    + '<ellipse cx="30" cy="192" rx="7" ry="10" stroke-width="1.6"/>' + fino('M76,112 L92,60', 2.5) + '<path d="M80,120 Q72,140 84,146 Q96,140 88,120 Z" stroke-width="2"/>' + fino('M84,120 V112', 2)],
  ['edf-tatame', 'Tatame (área de luta)', 190, 190, '<rect x="8" y="8" width="174" height="174"/><rect x="45.3" y="45.3" width="99.4" height="99.4" stroke-width="3"/>'
    + fino('M70,88 V102 M120,88 V102', 3) + fino('M45.3,45.3 L8,8 M144.7,45.3 L182,8 M45.3,144.7 L8,182 M144.7,144.7 L182,182', 1.1, ' stroke-dasharray="3 4"')],
  ['edf-alvo-arco', 'Tiro com arco (alvo)', 124, 124, [50, 40, 30, 20].map(r => `<circle cx="58" cy="66" r="${r}"${r < 50 ? ' stroke-width="2"' : ''}/>`).join('') + '<circle cx="58" cy="66" r="10" fill="#C"/>'
    + '<path d="M64,60 L112,12" stroke-width="2.5"/>' + fino('M104,12 L112,4 M112,20 L120,12 M98,18 L106,10 M106,26 L114,18', 2)],
];

// Ampliação 09/10/2026: desenhos autorais; espaços livres para anotar com Texto.
const AMPLIACAO_20261009 = [
  [
    "Modelos didáticos preenchíveis",
    [
      [
        "ef-avaliacao-registro",
        "Avaliação — registro didático",
        540,
        224,
        "<text x=\"270\" y=\"20\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Avaliação — registro didático</text><rect x=\"10\" y=\"42\" width=\"520\" height=\"178\" rx=\"3\"/><text x=\"75\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Teste</text><text x=\"205\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Unidade</text><path d=\"M140 42 V220\"/><text x=\"335\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Resultado</text><path d=\"M270 42 V220\"/><text x=\"465\" y=\"55\" font-size=\"15\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">Condição</text><path d=\"M400 42 V220\"/><path d=\"M10 68 H530\"/><path d=\"M10 106 H530\"/><path d=\"M10 144 H530\"/><path d=\"M10 182 H530\"/>"
      ],
      [
        "ef-tatica-vazia",
        "Quadra — plano tático preenchível",
        400,
        250,
        "<rect x=\"20\" y=\"20\" width=\"360\" height=\"210\" rx=\"3\"/><path d=\"M200 20 V230\"/><circle cx=\"200\" cy=\"125\" r=\"37\"/><path d=\"M20 75 H65 V175 H20 M380 75 H335 V175 H380\"/><text x=\"200\" y=\"125\" font-size=\"18\" font-family=\"Segoe UI, Arial, sans-serif\" font-weight=\"600\" text-anchor=\"middle\" dominant-baseline=\"central\" fill=\"#C\" stroke=\"none\">A</text>"
      ]
    ]
  ]
];

export default {
  id: 'edfisica', nome: 'Educação Física',
  destaques: ['edf-volei', 'edf-basquete', 'edf-futsal', 'edf-futebol', 'edf-poliesportiva', 'edf-jog-x', 'edf-jog-o', 'edf-seta-passe',
    'edf-correr', 'edf-bola-futebol', 'edf-cone', 'edf-apito', 'edf-cronometro', 'edf-planos', 'edf-alavanca-interfixa', 'edf-zonas-fc'],
  secoes: [
    ...AMPLIACAO_20261009,
    ['Quadras e campos', S_QUADRAS],
    ['Táticas', S_TATICA],
    ['Bonecos em movimento', S_BONECOS],
    ['Materiais', S_MATERIAIS],
    ['Corpo e treino', S_TREINO],
    ['Avaliação física', S_AVALIACAO],
    ['Jogos e recreação', S_JOGOS],
    ['Aventura e lutas', S_AVENTURA],
  ],
};
