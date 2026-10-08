// Testes automáticos do Giz Livre (sem dependências).  Rodar:  node tests/testes.mjs
// Cobrem as partes "puras" do programa: desenho dos traços, interpretador de funções, estabilizador,
// embelezar escrita e tabela periódica. O navegador é simulado com o mínimo necessário.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// --- ambiente mínimo de navegador ---
const medir = { measureText: t => ({ width: String(t).length * 8 }), set font(v) {} };
globalThis.document = { createElement: () => ({ getContext: () => medir }) };
globalThis.Path2D = class { moveTo() {} lineTo() {} quadraticCurveTo() {} arc() {} closePath() {} };   // sem beginPath, como o real
const ctxFalso = () => new Proxy({}, {
  get: (t, k) => (k in t ? t[k] : (typeof k === 'string' ? () => {} : undefined)),
  set: (t, k, v) => ((t[k] = v), true),
});

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'app', 'js');
const mod = nome => import(pathToFileURL(path.join(raiz, nome)).href);

let ok = 0, falhas = 0;
function teste(nome, fn) {
  try { fn(); ok++; console.log('  ✓', nome); }
  catch (e) { falhas++; console.log('  ✗', nome, '\n     ', e.message); }
}
const igual = (a, b, msg) => { if (a !== b) throw new Error(`${msg}: esperado ${b}, veio ${a}`); };
const perto = (a, b, tol, msg) => { if (Math.abs(a - b) > tol) throw new Error(`${msg}: esperado ${b} ± ${tol}, veio ${a}`); };

// ------------------------------------------------------------------
console.log('Desenho dos traços (render.js)');
const R = await mod('render.js');
const pts = [0, 0, .5, 10, 5, .6, 20, 0, .7, 30, 5, .5];
for (const [nome, it] of Object.entries({
  'mouse (sem pressão)': { tool: 'pen', width: 3 },
  'marca-texto': { tool: 'highlighter', width: 20 },
  'caneta com pressão': { tool: 'pen', width: 3, pr: true, taper: true },
  'caligrafia': { tool: 'pen', width: 3, pr: true, style: 'calligraphy', nib: 45 },
  'pincel': { tool: 'pen', width: 3, pr: true, style: 'brush' },
  'com seta': { tool: 'pen', width: 3, arrow: true },
})) {
  teste(`desenha ${nome} com e sem cache`, () => {
    const s = { type: 'stroke', color: '#000000', pts, ...it };
    R.drawItem(ctxFalso(), s);                 // usa cache de Path2D
    R.drawStroke(ctxFalso(), { ...s }, false); // sem cache
  });
}
teste('ponto único não quebra', () => R.drawItem(ctxFalso(), { type: 'stroke', tool: 'pen', color: '#000', width: 3, pts: [5, 5, .5] }));
teste('girar 90° leva (10,0) para (0,10) em torno da origem', () => {
  const g = R.rotateItem({ type: 'stroke', tool: 'pen', color: '#000', width: 2, pts: [10, 0, .5] }, Math.PI / 2, 0, 0);
  perto(g.pts[0], 0, 1e-9, 'x'); perto(g.pts[1], 10, 1e-9, 'y');
});
teste('mover texto convertido leva junto a escrita original', () => {
  const t = { type: 'text', x: 0, y: 0, w: 50, size: 20, text: 'oi', ink: [{ type: 'stroke', tool: 'pen', color: '#000', width: 2, pts: [0, 0, .5] }] };
  const m = R.transformItem(t, 100, 50);
  igual(m.ink[0].pts[0], 100, 'x da escrita'); igual(m.ink[0].pts[1], 50, 'y da escrita');
});

// ------------------------------------------------------------------
console.log('Plotar função (plot.js)');
const P = await mod('plot.js');
for (const [expr, x, esperado] of [
  ['x^2 - 4', 3, 5], ['2x+1', 2, 5], ['2sen(x)', Math.PI / 2, 2], ['raiz(x)', 9, 3], ['1/x', .5, 2], ['x(x-1)', 3, 6],
  ['0,5x', 4, 2], ['3(x+1)^2', 1, 12], ['x²−4', 3, 5], ['-2^2', 0, -4], ['e^x', 0, 1], ['abs(-3)', 0, 3],
]) teste(`${expr} em x=${x.toFixed?.(2) ?? x} = ${esperado}`, () => perto(P.compile(expr)(x), esperado, 1e-9, expr));
for (const ruim of ['x^', '(x+1', 'foo(x)', 'x+)', '']) {
  teste(`recusa "${ruim}" com mensagem`, () => { let erro = null; try { P.compile(ruim); } catch (e) { erro = e; } if (!erro) throw new Error('aceitou'); });
}
teste('tan(x) é cortada nas descontinuidades', () => {
  let n = 0;
  const st = P.plotStrokes(P.compile('tan(x)'), { ox: 0, oy: 0, cell: 40, xmin: -5, xmax: 5, ymin: -5, ymax: 5, color: '#00f', width: 3, id: () => ++n });
  igual(st.length, 5, 'pedaços');
});

// ------------------------------------------------------------------
console.log('Estabilizador (stabilizer.js)');
const ST = await mod('stabilizer.js');
teste('filtro de posição reduz o tremido de uma reta', () => {
  const est = ST.createStabilizer({ stab: true, stabLevel: 'leve', lazy: false, pfilter: true });
  let aleat = 1; const rnd = () => ((aleat = (aleat * 16807) % 2147483647) / 2147483647 - .5);
  const ys = [];
  for (let i = 0; i < 300; i++) { const f = est.push(i * 2, 100 + rnd() * 3, .5, i * 8); if (f) ys.push(f.y); }
  const media = ys.reduce((a, b) => a + b) / ys.length;
  const rms = Math.sqrt(ys.slice(20).reduce((a, y) => a + (y - media) ** 2, 0) / (ys.length - 20));
  if (!(rms < 0.6)) throw new Error(`tremido residual alto: ${rms.toFixed(2)} px`);
});
teste('reamostragem mantém as pontas', () => {
  const r = ST.resample([0, 0, .5, 10, 0, .5], 1);
  igual(r[0], 0, 'início'); igual(r[r.length - 3], 10, 'fim');
});

// ------------------------------------------------------------------
console.log('Embelezar escrita (beautify.js)');
const B = await mod('beautify.js');
teste('endireita uma linha escrita inclinada 8°', () => {
  const ang = 8 * Math.PI / 180, traços = [];
  for (let k = 0; k < 10; k++) {
    const p = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20, x = 100 + k * 26 + 6 * Math.sin(t * Math.PI * 2) + t * 10, y = -30 * Math.sin(t * Math.PI);
      p.push(100 + (x - 100) * Math.cos(ang) - y * Math.sin(ang), 400 + (x - 100) * Math.sin(ang) + y * Math.cos(ang), .5);
    }
    traços.push({ id: 's' + k, type: 'stroke', tool: 'pen', color: '#000', width: 3, pts: p });
  }
  const base = l => { const xs = [], ys = []; for (const s of l) { let m = -1e9, ix = 0; for (let i = 0; i < s.pts.length; i += 3) if (s.pts[i + 1] > m) { m = s.pts[i + 1]; ix = s.pts[i]; } xs.push(ix); ys.push(m); }
    const n = xs.length, ax = xs.reduce((a, b) => a + b) / n, ay = ys.reduce((a, b) => a + b) / n; let nu = 0, de = 0;
    for (let i = 0; i < n; i++) { nu += (xs[i] - ax) * (ys[i] - ay); de += (xs[i] - ax) ** 2; } return Math.atan(nu / de) * 180 / Math.PI; };
  const depois = base([...B.beautify(traços, 1, 'forte').values()]);
  if (Math.abs(depois) > 1.5) throw new Error(`linha ainda inclinada ${depois.toFixed(1)}°`);
});

// ------------------------------------------------------------------
console.log('Biblioteca (library.js)');
const LB = await mod('library.js');
teste('tabela periódica tem 118 elementos e cabe inteira', () => {
  const t = LB.periodicTableSVG();
  const elementos = (t.svg.match(/<g transform=/g) || []).length - 2;   // menos os 2 marcadores dos blocos f
  igual(elementos, 118, 'elementos');
  if (t.h < 800) throw new Error(`altura ${t.h} corta a linha dos actinídeos`);
});

// ------------------------------------------------------------------
console.log('Formas técnicas (shapelib.js)');
const SL = await mod('shapelib.js');
teste('ids únicos e todos os grupos com formas', () => {
  const ids = SL.ALL_SHAPES.map(s => s[0]);
  igual(new Set(ids).size, ids.length, 'ids repetidos');
  for (const g of SL.GROUPS) for (const [sec, list] of g.secoes) if (!list.length) throw new Error(`seção ${g.id}/${sec} vazia`);
});
teste('cada forma vira SVG bem formado na cor pedida', () => {
  for (const [id] of SL.ALL_SHAPES) {
    const m = SL.shapeSvg(id, '#e81224');
    if (!(m.w > 0 && m.h > 0)) throw new Error(`${id}: tamanho inválido`);
    if (m.svg.includes('#C')) throw new Error(`${id}: cor não aplicada`);
    if (/NaN|undefined/.test(m.svg)) throw new Error(`${id}: número inválido no desenho`);
    const abre = (m.svg.match(/<(g|text|svg)\b/g) || []).length, fecha = (m.svg.match(/<\/(g|text|svg)>/g) || []).length;
    igual(abre, fecha, `${id}: tags desbalanceadas`);
  }
});

console.log(`\n${ok} testes passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
