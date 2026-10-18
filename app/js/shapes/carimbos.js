// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
import { T } from './base.js';

// prefixo dos ids: 'cb-'
// Carimbos de correção e feedback: cada símbolo em seis estilos, três precisos (traço, selo redondo, selo retangular)
// e três à mão (caneta, esboço, caneta com pressão). Desenhos próprios do Giz Livre: os símbolos e as letras são
// caminhos feitos à mão aqui; o "à mão" sai desses mesmos caminhos com um tremido calculado. O tremido usa uma
// semente tirada do id, então o desenho é sempre o mesmo (um quadro salvo nunca muda de aparência).

const f = n => n.toFixed(1);
const semente = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const sorteio = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// --- caminhos: só M, L, Q, C e Z absolutos, para poder escalar e amostrar sem o navegador ---
const fichas = d => d.match(/[MLQCZ]|-?\d*\.?\d+/g);
// mesmo caminho com escala s e deslocamento (tx, ty)
const mover = (d, s, tx, ty) => { let par = 0; return fichas(d).map(t => /[A-Z]/.test(t) ? t : f(+t * s + (par++ % 2 ? ty : tx))).join(' ').replace(/ (?=[A-Z])/g, '').replace(/([A-Z]) /g, '$1'); };
// pontos ao longo do caminho, a cada ~passo px, um trecho por M; `fechado` quando termina em Z
function amostrar(d, passo = 2.5) {
  const tk = fichas(d), trechos = []; let i = 0, cur = null, p = [0, 0], ini = [0, 0];
  const num = () => +tk[i++], pto = () => [num(), num()];
  const curva = (ctrl, fn) => { const L = ctrl.reduce((a, q, k) => a + Math.hypot(q[0] - (k ? ctrl[k - 1][0] : p[0]), q[1] - (k ? ctrl[k - 1][1] : p[1])), 0), n = Math.max(1, Math.ceil(L / passo)); for (let k = 1; k <= n; k++) cur.pts.push(fn(k / n)); p = ctrl[ctrl.length - 1]; };
  while (i < tk.length) {
    const c = tk[i++];
    if (c === 'M') { p = ini = pto(); cur = { pts: [p], fechado: false }; trechos.push(cur); }
    else if (c === 'L') { const q = pto(), a = p; curva([q], t => [a[0] + (q[0] - a[0]) * t, a[1] + (q[1] - a[1]) * t]); }
    else if (c === 'Q') { const q1 = pto(), q2 = pto(), a = p; curva([q1, q2], t => { const u = 1 - t; return [u * u * a[0] + 2 * u * t * q1[0] + t * t * q2[0], u * u * a[1] + 2 * u * t * q1[1] + t * t * q2[1]]; }); }
    else if (c === 'C') { const q1 = pto(), q2 = pto(), q3 = pto(), a = p; curva([q1, q2, q3], t => { const u = 1 - t; return [0, 1].map(e => u * u * u * a[e] + 3 * u * u * t * q1[e] + 3 * u * t * t * q2[e] + t * t * t * q3[e]); }); }
    else if (c === 'Z') { const a = p; curva([ini], t => [a[0] + (ini[0] - a[0]) * t, a[1] + (ini[1] - a[1]) * t]); cur.fechado = true; }
  }
  return trechos;
}
const normal = (s, i) => { const a = s[Math.max(0, i - 1)], b = s[Math.min(s.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; };
// tremido de mão: ondulação lenta ao longo do traço, leve deslocamento, ponta que passa um pouco do fim
// e, no traço fechado, uma sobra que cruza o começo (ninguém fecha um círculo no ponto exato)
function tremer({ pts, fechado }, r, A, D) {
  let s = pts.slice();
  if (fechado) { const n = Math.max(3, Math.round(s.length * (0.06 + 0.06 * r()))); s = s.concat(s.slice(1, n).map(([x, y]) => [x + 2.5, y + 1.5])); }
  else if (s.length > 1) { const [a, b] = [s[s.length - 2], s[s.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, e = 0.5 + 2 * r(); s.push([b[0] + (b[0] - a[0]) / L * e, b[1] + (b[1] - a[1]) / L * e]); }
  const total = s.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - s[i - 1][0], p[1] - s[i - 1][1]) : 0), 0), esc = Math.max(1, total / 120);
  const l1 = (45 + 40 * r()) * esc, l2 = (22 + 12 * r()) * esc, f1 = 6.28 * r(), f2 = 6.28 * r(), dx = (r() - 0.5) * 2 * D, dy = (r() - 0.5) * 2 * D;
  let arco = 0;
  return s.map((p, i) => {
    if (i) arco += Math.hypot(p[0] - s[i - 1][0], p[1] - s[i - 1][1]);
    const o = A * (Math.sin(6.283 * arco / l1 + f1) + 0.3 * Math.sin(6.283 * arco / l2 + f2)), [nx, ny] = normal(s, i);
    return [p[0] + nx * o + dx, p[1] + ny * o + dy];
  });
}
const linha = s => 'M' + s.map(p => f(p[0]) + ',' + f(p[1])).join(' L');
// traço de caneta com pressão: contorno cheio que engrossa logo no começo e afina no fim
function pena(s, W) {
  const n = s.length - 1, E = [], Dr = [];
  s.forEach((p, i) => {
    const t = i / n, w = W / 2 * Math.max(0.22, Math.min(1, Math.sqrt(t / 0.08)) * Math.min(1, Math.pow((1 - t) / 0.35, 0.8))), [nx, ny] = normal(s, i);
    E.push([p[0] + nx * w, p[1] + ny * w]); Dr.push([p[0] - nx * w, p[1] - ny * w]);
  });
  return `<path fill="#C" stroke="none" d="${linha(E)} L${Dr.reverse().map(p => f(p[0]) + ',' + f(p[1])).join(' L')} Z"/>`;
}

// desenha as partes ({d, k, dm} = caminho com fator de espessura e versão à mão opcional; {ponto: [x, y, r]})
// no estilo pedido, com escala s e deslocamento (tx, ty); `amp` aumenta o tremido em desenhos grandes
function desenhar(partes, estilo, sw, seed, s = 1, tx = 0, ty = 0, amp = 1) {
  const r = sorteio(seed); let out = '';
  for (const p of partes) {
    if (p.ponto) {
      const [x, y, rp] = p.ponto, cx = x * s + tx, cy = y * s + ty, rr = rp * s;
      out += estilo === 'p' ? `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rr)}" fill="#C" stroke="none"/>`
        : `<ellipse cx="${f(cx + r() - 0.5)}" cy="${f(cy + r() - 0.5)}" rx="${f(rr * (0.95 + 0.25 * r()))}" ry="${f(rr * (0.8 + 0.2 * r()))}" transform="rotate(${f(r() * 180)} ${f(cx)} ${f(cy)})" fill="#C" stroke="none"/>`;
      continue;
    }
    const w = sw * (p.k || 1);
    if (estilo === 'p') { out += `<path stroke-width="${f(w)}" d="${mover(p.d, s, tx, ty)}"/>`; continue; }
    for (const tr of amostrar(mover(p.dm || p.d, s, tx, ty))) {
      if (estilo === 'caneta') out += `<path stroke-width="${f(w * 0.9)}" d="${linha(tremer(tr, r, 1.1 * amp, 1.2))}"/>`;
      else if (estilo === 'esboco') for (let k = 0; k < 2; k++) out += `<path stroke-width="${f(Math.max(2, w * 0.4))}" d="${linha(tremer(tr, r, 1.9 * amp, 1.8))}"/>`;
      else out += pena(tremer(tr, r, 1.1 * amp, 1.2), w * 1.15);
    }
  }
  return out;
}

// --- símbolos numa caixa de 80 x 80 ---
const CIRC = 'M40,6 C58.8,6 74,21.2 74,40 C74,58.8 58.8,74 40,74 C21.2,74 6,58.8 6,40 C6,21.2 21.2,6 40,6 Z';
const estrela = (() => { const p = Array.from({ length: 10 }, (_, i) => { const a = (-90 + 36 * i) * Math.PI / 180, R = i % 2 ? 14.5 : 35; return f(40 + R * Math.cos(a)) + ',' + f(43 + R * Math.sin(a)); }); return 'M' + p.join(' L') + ' Z'; })();
const SIMBOLOS = [
  // [chave, nome, palavra do selo retangular, partes]
  ['certo', 'Certo', 'CERTO', [{ d: 'M14,42 L31,60 L67,17' }]],
  ['errado', 'Errado', 'ERRADO', [{ d: 'M18,17 L62,63' }, { d: 'M62,16 L18,64' }]],
  ['meio', 'Meio certo', 'QUASE', [{ d: 'M14,42 L31,60 L67,17' }, { d: 'M26,22 L56,52', k: 0.6 }]],
  ['duvida', 'Dúvida', 'DÚVIDA', [{ d: 'M27,27 C27,10 53,10 53,26 C53,37 40,38 40,50' }, { ponto: [40, 64, 4.8] }]],
  ['atencao', 'Atenção', 'ATENÇÃO', [{ d: 'M40,12 L40,50' }, { ponto: [40, 64, 4.8] }]],
  ['estrela', 'Estrela', 'ÓTIMO', [{ d: estrela, k: 0.7 }]],
  ['coracao', 'Coração', 'ADOREI', [{ d: 'M40,68 C12,50 6,32 16,20 C26,9 37,15 40,25 C43,15 54,9 64,20 C74,32 68,50 40,68 Z', k: 0.75 }]],
  ['feliz', 'Carinha feliz', 'MUITO BEM', [{ d: CIRC, k: 0.6 }, { ponto: [29, 31, 4] }, { ponto: [51, 31, 4] }, { d: 'M24,47 C30,60 50,60 56,47', k: 0.7 }]],
  ['neutra', 'Carinha pensativa', 'PENSE MAIS', [{ d: CIRC, k: 0.6 }, { ponto: [29, 31, 4] }, { ponto: [51, 31, 4] }, { d: 'M27,53 L53,50', k: 0.7 }]],
  ['mais', 'Mais (acrescente)', 'ACRESCENTE', [{ d: 'M40,12 L40,68' }, { d: 'M12,40 L68,40' }]],
  ['falta', 'Falta algo (inserir aqui)', 'FALTA ALGO', [{ d: 'M14,64 L40,18 L66,64' }]],
  ['ideia', 'Boa ideia', 'BOA IDEIA', [{ d: 'M29,56 C16,48 13,31 22,20 C30,10 50,10 58,20 C67,31 64,48 51,56 L51,62 L29,62 Z', k: 0.65 }, { d: 'M31,69 L49,69', k: 0.65 }, { d: 'M35,75 L45,75', k: 0.65 }]],
  ['lupa', 'Confira (lupa)', 'CONFIRA', [{ d: 'M33,8 C46.8,8 58,19.2 58,33 C58,46.8 46.8,58 33,58 C19.2,58 8,46.8 8,33 C8,19.2 19.2,8 33,8 Z', k: 0.7 }, { d: 'M51,51 L72,72', k: 1.1 }]],
];

// --- letras de traço para os carimbos de palavra: altura das maiúsculas = 100 ---
const LETRAS = {
  O: [70, 'M35,0 C55,0 70,22 70,50 C70,78 55,100 35,100 C15,100 0,78 0,50 C0,22 15,0 35,0 Z'],
  K: [58, 'M0,0 L0,100 M58,0 L0,62 M20,42 L58,100'],
  R: [58, 'M0,100 L0,0 L32,0 C50,0 58,10 58,25 C58,40 50,50 32,50 L0,50 M28,50 L58,100'],
  E: [50, 'M50,0 L0,0 L0,100 L50,100 M0,50 L42,50'],
  É: [50, 'M50,0 L0,0 L0,100 L50,100 M0,50 L42,50 M18,-14 L34,-30'],
  V: [64, 'M0,0 L32,100 L64,0'],
  I: [0, 'M0,0 L0,100'],
  S: [56, 'M54,14 C46,3 38,0 28,0 C12,0 2,9 2,24 C2,40 16,45 28,50 C42,55 56,60 56,76 C56,92 44,100 28,100 C16,100 6,96 0,86'],
  A: [66, 'M0,100 L33,0 L66,100 M12,64 L54,64'],
  T: [60, 'M0,0 L60,0 M30,0 L30,100'],
  P: [54, 'M0,100 L0,0 L32,0 C48,0 54,12 54,26 C54,40 48,52 32,52 L0,52'],
  B: [56, 'M0,50 L0,0 L28,0 C44,0 52,10 52,24 C52,40 42,50 28,50 L32,50 C48,50 56,60 56,75 C56,90 48,100 32,100 L0,100 L0,50'],
  N: [60, 'M0,100 L0,0 L60,100 L60,0'],
  F: [48, 'M48,0 L0,0 L0,100 M0,50 L40,50'],
  Z: [58, 'M0,0 L58,0 L0,100 L58,100'],
  1: [30, 'M0,22 L30,0 L30,100'],
  0: [56, 'M28,0 C46,0 56,22 56,50 C56,78 46,100 28,100 C10,100 0,78 0,50 C0,22 10,0 28,0 Z'],
};
// partes da palavra com maiúsculas de altura h, começando em (0, 0); o acento sobe acima de y = 0
function palavra(txt, h) {
  const s = h / 100, partes = []; let x = 0;
  for (const ch of txt) { const [w, d] = LETRAS[ch]; partes.push({ d: mover(d, s, x, 0) }); x += (w + 26) * s; }
  return { partes, w: x - 26 * s, acento: /É/.test(txt) ? 0.3 * h : 0 };
}
const PALAVRAS = [
  ['ok', 'OK', 'OK'], ['visto', 'Visto', 'VISTO'], ['revisar', 'Revisar', 'REVISAR'],
  ['parabens', 'Parabéns', 'PARABÉNS'], ['refazer', 'Refazer', 'REFAZER'], ['dez', 'Nota 10', '10'],
];

// --- marcas de destaque (sem selo: servem para apontar e cercar) ---
const MARCAS = [
  ['seta', 'Seta de destaque', 150, 60, [{ d: 'M8,30 L138,30', dm: 'M8,36 C50,27 95,34 138,28' }, { d: 'M114,12 L140,30 L114,48', dm: 'M112,11 L139,28 L115,49' }]],
  ['circulo', 'Círculo de destaque', 180, 110, [{ d: 'M90,7 C136.4,7 174,28.5 174,55 C174,81.5 136.4,103 90,103 C43.6,103 6,81.5 6,55 C6,28.5 43.6,7 90,7 Z', dm: 'M40,16 C64,4 132,4 160,22 C182,38 176,80 140,96 C104,110 46,106 18,86 C0,70 6,36 40,16 Z' }]],
  ['sublinhado', 'Sublinhado duplo de destaque', 200, 34, [{ d: 'M8,11 L192,11' }, { d: 'M16,24 L184,24' }]],
];

const ESTILOS = [
  ['p1', 'traço', 'Precisos: traço'],
  ['p2', 'selo redondo', 'Precisos: selo redondo'],
  ['p3', 'selo retangular', 'Precisos: selo retangular'],
  ['m1', 'à mão, caneta', 'À mão: caneta'],
  ['m2', 'à mão, esboço', 'À mão: esboço'],
  ['m3', 'à mão, caneta com pressão', 'À mão: caneta com pressão'],
];
const MAO = { m1: 'caneta', m2: 'esboco', m3: 'pena' };
const ANEL = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke-width="3"/><ellipse cx="${cx}" cy="${cy}" rx="${rx - 5}" ry="${ry - 5}" stroke-width="1.4"/>`;
const MOLDURA = (w, h) => `<rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="10" stroke-width="3"/><rect x="8" y="8" width="${w - 16}" height="${h - 16}" rx="6" stroke-width="1.4"/>`;

function simbolo([chave, nome, rotulo, partes], [est, estNome]) {
  const id = `cb-${chave}-${est}`, sd = semente(id), F = [id, `${nome} (${estNome})`];
  if (est === 'p1') return [...F, 80, 80, desenhar(partes, 'p', 8, sd)];
  if (est === 'p2') return [...F, 80, 80, ANEL(40, 40, 36, 36) + desenhar(partes, 'p', 8.5, sd, 0.6, 16, 16)];
  if (est === 'p3') {
    const tam = Math.min(15, 84 / (rotulo.length * 0.72));
    return [...F, 100, 84, `<rect x="3" y="3" width="94" height="78" rx="10" stroke-width="3"/>` + desenhar(partes, 'p', 8.5, sd, 0.56, 27.6, 5) + T(50, 66, rotulo, f(tam))];
  }
  return [...F, 80, 80, desenhar(partes, MAO[est], 8, sd)];
}
function carimboPalavra([chave, nome, txt], [est, estNome]) {
  const id = `cb-${chave}-${est}`, sd = semente(id), F = [id, `${nome} (${estNome})`];
  if (est === 'p2') {
    const P = palavra(txt, 26), w = Math.round(Math.max(84, P.w + 48 + P.acento)), h = 84;
    return [...F, w, h, ANEL(w / 2, h / 2, w / 2 - 3, h / 2 - 3) + desenhar(P.partes, 'p', 4.5, sd, 1, (w - P.w) / 2, (h - 26 + P.acento) / 2)];
  }
  if (est === 'p3') {
    const P = palavra(txt, 30), w = Math.round(P.w + 44), h = Math.round(30 + 40 + P.acento);
    return [...F, w, h, MOLDURA(w, h) + desenhar(P.partes, 'p', 5, sd, 1, 22, 20 + P.acento)];
  }
  const P = palavra(txt, 40), w = Math.round(P.w + 24), h = Math.round(40 + 24 + P.acento);
  return [...F, w, h, desenhar(P.partes, est === 'p1' ? 'p' : MAO[est], 6.5, sd, 1, 12, 12 + P.acento)];
}
function marca([chave, nome, w, h, partes], [est, estNome]) {
  const id = `cb-${chave}-${est}`;
  return [id, `${nome} (${estNome})`, w, h, desenhar(partes, est === 'p1' ? 'p' : MAO[est], 5.5, semente(id), 1, 0, 0, Math.pow(Math.max(w, h) / 80, 0.25))];
}

export default {
  id: 'carimbos', nome: 'Carimbos',
  destaques: [
    'cb-certo-p1', 'cb-errado-p1', 'cb-meio-p1', 'cb-certo-m3', 'cb-errado-m3', 'cb-duvida-m1', 'cb-atencao-m1',
    'cb-ok-p2', 'cb-visto-p3', 'cb-revisar-p3', 'cb-parabens-m3', 'cb-estrela-m3', 'cb-circulo-m1', 'cb-seta-m1',
  ],
  secoes: ESTILOS.map(e => [e[2], [
    ...SIMBOLOS.map(s => simbolo(s, e)),
    ...PALAVRAS.map(p => carimboPalavra(p, e)),
    ...(e[0] === 'p2' || e[0] === 'p3' ? [] : MARCAS.map(m => marca(m, e))),
  ]]),
};
