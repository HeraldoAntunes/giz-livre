// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
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
for (const [expr, x, esperado] of [['xsenx', Math.PI / 2, Math.PI / 2], ['2pix', 1, 2 * Math.PI], ['SEN(X)', Math.PI / 2, 1], ['eXp(0)', 0, 1], ['x2,5', 2, 5]]) {
  teste(`compatível: ${expr}`, () => perto(P.compile(expr)(x), esperado, 1e-9, expr));
}

console.log('Parâmetros (plot.js)');
teste('A·sen(w·x) com objeto e com array', () => {
  const f = P.compile('Asen(wx)', { params: ['A', 'w'] });
  perto(f(Math.PI / 4, { A: 3, w: 2 }), 3, 1e-9, 'objeto');
  perto(f(Math.PI / 4, [3, 2]), 3, 1e-9, 'array');
});
teste('nomes com dígito e longos: C0·e^(−k·x), mu, sigma', () => {
  perto(P.compile('C0*exp(-k*x)', { params: ['C0', 'k'] })(2, { C0: 10, k: 0.5 }), 10 * Math.exp(-1), 1e-9, 'C0');
  perto(P.compile('2C0', { params: ['C0'] })(0, { C0: 4 }), 8, 1e-9, '2C0');
  const n = P.compile('1/(sigma*raiz(2*pi))*exp(-(x - mu)^2/(2*sigma^2))', { params: ['mu', 'sigma'] });
  perto(n(0, { mu: 0, sigma: 1 }), 1 / Math.sqrt(2 * Math.PI), 1e-12, 'normal');
});
teste('padrões v vêm do catálogo; f(x) sem valores usa o padrão', () => {
  const f = P.compile('k*x', { params: [{ n: 'k', v: 3 }] });
  perto(f(2), 6, 1e-12, 'padrão'); perto(f(2, { k: 5 }), 10, 1e-12, 'trocado');
  igual(f.params.join(), 'k', 'params'); igual(f.usados.join(), 'k', 'usados');
});
teste('parâmetro não declarado continua erro; declarado não quebra sen/tg/exp', () => {
  let erro = null; try { P.compile('k*x'); } catch (e) { erro = e; }
  if (!erro) throw new Error('aceitou k sem declarar');
  perto(P.compile('tg(t)', { params: ['t'] })(0, { t: Math.PI / 4 }), 1, 1e-9, 'tg com t');
  perto(P.compile('exp(e)', { params: ['e'] })(0, { e: 0 }), 1, 1e-12, 'parâmetro e vence a constante');
  perto(P.compile('xsenx', { params: ['s', 'n'] })(Math.PI / 2, {}), Math.PI / 2, 1e-9, 'sen não vira s·e·n');
});
for (const ruim of [['x', ['x']], ['1a', ['1a']], ['k', ['k', 'k']]]) {
  teste(`recusa parâmetro inválido ${JSON.stringify(ruim[1])}`, () => { let erro = null; try { P.compile('x', { params: ruim[1] }); } catch (e) { erro = e; } if (!erro) throw new Error('aceitou'); });
}
teste('animação: valor vai e volta e a curva muda', () => {
  const an = { n: 'a', min: 1, max: 3, periodo: 2 };
  perto(P.animValue(an, 0), 1, 1e-12, 't=0'); perto(P.animValue(an, 1), 3, 1e-12, 'meio'); perto(P.animValue(an, 0.5), 2, 1e-12, 'quarto');
  const f = P.compile('a*x', { params: ['a'] }), fr = { ox: 0, oy: 0, cell: 10, xmin: 0, xmax: 1, ymin: -5, ymax: 5 };
  const q = P.animatedCurve(f, fr, { a: 1 }, an, 1);
  igual(q.valor, 3, 'valor'); const l = q.linhas[0]; perto(l[l.length - 1], -30, 1e-9, 'y do fim (mundo)');
});
teste('fitFrame encaixa a faixa no retângulo com escalas separadas', () => {
  const fr = P.fitFrame({ x: 0, y: 0, w: 1000, h: 500 }, [0, 20], [0, 250], 0);
  perto(fr.ox, 0, 1e-9, 'ox'); perto(fr.oy, 500, 1e-9, 'oy'); perto(fr.cellX, 50, 1e-9, 'cellX'); perto(fr.cellY, 2, 1e-9, 'cellY');
  let n = 0;
  const st = P.plotStrokes(P.compile('L0*(1-exp(-k*x))', { params: ['L0', 'k'] }), { ...fr, color: '#000', width: 2, id: () => ++n, valores: { L0: 250, k: 0.23 } });
  igual(st.length, 1, 'um traço');
  const p = st[0].pts; perto(p[p.length - 2], 500 - 250 * (1 - Math.exp(-4.6)) * 2, 1e-6, 'y final');
});

console.log('Eixos desenhados (plot.js)');
teste('eixos: duas setas e marcas, no formato de traço', () => {
  let n = 0;
  const fr = { ox: 500, oy: 300, cell: 40, xmin: -5, xmax: 5, ymin: -3, ymax: 3 };
  const it = P.axesStrokes(fr, { color: '#000000', width: 2, id: () => 'e' + ++n, passoX: 1, passoY: 1 });
  const setas = it.filter(i => i.arrow);
  igual(setas.length, 2, 'setas');
  igual(it.length, 2 + 10 + 6, 'eixos + marcas (sem a origem)');
  for (const s of it) {
    igual(s.type, 'stroke', 'tipo'); igual(s.tool, 'pen', 'ferramenta'); igual(s.pts.length % 3, 0, 'pts em trios');
    if (s.pts.some(v => !isFinite(v))) throw new Error('coordenada inválida');
    R.drawItem(ctxFalso(), s);
  }
  perto(setas[0].pts[1], 300, 1e-9, 'eixo x passa pela origem');
  igual(new Set(it.map(i => i.id)).size, it.length, 'ids únicos');
});
teste('eixos com números e nomes; origem fora do quadro fica na borda', () => {
  let n = 0;
  const fr = P.fitFrame({ x: 0, y: 0, w: 800, h: 400 }, [273, 333], [1, 15]);
  const it = P.axesStrokes(fr, { width: 2, id: () => ++n, rotulos: true, eixoX: 'T (K)', eixoY: 'k/kref' });
  const textos = it.filter(i => i.type === 'text');
  if (textos.length < 4) throw new Error('poucos rótulos');
  if (!textos.some(t => t.text === 'T (K)')) throw new Error('sem nome do eixo x');
  const ex = it.find(i => i.arrow);
  perto(ex.pts[1], fr.oy - 1 * fr.cellY, 1e-9, 'eixo x na borda inferior (y = 1)');
  igual(P.fmtNum(2.5), '2,5', 'vírgula'); igual(P.fmtNum(0.1 + 0.2), '0,3', 'sem ruído');
});

console.log('Catálogo de modelos (fnmodels.js)');
const FM = await mod('fnmodels.js');
teste('áreas com pelo menos 5 modelos e ids únicos', () => {
  for (const a of FM.AREAS) if (a.modelos.length < 5) throw new Error(`${a.nome}: só ${a.modelos.length}`);
  igual(new Set(FM.MODELOS.map(m => m.id)).size, FM.MODELOS.length, 'ids repetidos');
});
teste('todo modelo compila e dá número finito no meio do intervalo', () => {
  for (const m of FM.MODELOS) {
    let f;
    try { f = P.compile(m.expr, { params: m.params }); } catch (e) { throw new Error(`${m.id}: ${e.message}`); }
    const xm = (m.x[0] + m.x[1]) / 2, y = f(xm);
    if (!isFinite(y)) throw new Error(`${m.id}: y(${xm}) = ${y}`);
    for (const p of m.params) {
      if (!(p.min <= p.v && p.v <= p.max && p.passo > 0)) throw new Error(`${m.id}.${p.n}: padrão fora da faixa`);
      if (!f.usados.includes(p.n)) throw new Error(`${m.id}.${p.n}: parâmetro não usado na expressão`);
    }
    if (!(m.x[1] > m.x[0]) || (m.y && !(m.y[1] > m.y[0]))) throw new Error(`${m.id}: faixa inválida`);
    if (!m.eixoX || !m.eixoY || !m.nota) throw new Error(`${m.id}: falta rótulo ou nota`);
    if (m.anima && !m.params.some(p => p.n === m.anima)) throw new Error(`${m.id}: anima aponta para parâmetro inexistente`);
  }
});
teste('valores conferidos: DBO5, Streeter-Phelps, Stokes, Arrhenius, Manning, NTC', () => {
  const v = (id, x, val) => { const m = FM.modelo(id); return P.compile(m.expr, { params: m.params })(x, val); };
  perto(v('dbo', 5), 250 * (1 - Math.exp(-1.15)), 1e-9, 'DBO5');
  perto(v('streeter-phelps-deficit', 0), 1, 1e-12, 'D(0) = D0');
  perto(v('stokes', 100), 9.81 * 1650 * 1e-8 / 0.018 * 1000, 1e-9, 'Stokes 100 µm (mm/s)');
  perto(v('arrhenius', 293.15), 1, 1e-12, 'k/kref em Tref');
  perto(v('manning', 1), 1 / 0.013 * Math.sqrt(0.001), 1e-9, 'Manning Rh = 1');
  perto(v('ntc', 25), 10, 1e-9, 'NTC em T0');
  perto(v('adc', 2.6), 2.5, 1e-12, 'ADC 3 bits');
  perto(v('meia-onda', 12.5), 0, 1e-9, 'meia onda no semiciclo negativo');
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

teste('grupos únicos e destaques pertencem à própria disciplina', () => {
  igual(new Set(SL.GROUPS.map(g => g.id)).size, SL.GROUPS.length, 'grupos repetidos');
  for (const g of SL.GROUPS) {
    const locais = new Set(g.secoes.flatMap(([, list]) => list.map(f => f[0])));
    const destaques = g.destaques || [];
    igual(new Set(destaques).size, destaques.length, `${g.id}: destaques repetidos`);
    for (const id of destaques) if (!locais.has(id)) throw new Error(`${g.id}: destaque ${id} ausente da disciplina`);
  }
});

teste('formas são vetores locais sem conteúdo ativo ou referências externas', () => {
  for (const [id, nome, w, h, body] of SL.ALL_SHAPES) {
    if (!nome.trim() || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) throw new Error(`${id}: descrição/tamanho inválido`);
    const semReferenciasLocais = body.replace(/url\(#[\w-]+\)/g, '').replace(/\b(?:xlink:)?href\s*=\s*["']#[\w-]+["']/g, '');
    if (/<(?:script|foreignObject|image|iframe)\b|\bon\w+\s*=|\b(?:xlink:)?href\s*=|url\s*\(/i.test(semReferenciasLocais)) throw new Error(`${id}: conteúdo não vetorial/local`);
  }
});
teste('cada forma vira SVG bem formado na cor pedida', () => {
  for (const [id] of SL.ALL_SHAPES) {
    const m = SL.shapeSvg(id, '#e81224');
    if (!(m.w > 0 && m.h > 0)) throw new Error(`${id}: tamanho inválido`);
    if (m.svg.includes('#C')) throw new Error(`${id}: cor não aplicada`);
    if (/NaN|undefined/.test(m.svg)) throw new Error(`${id}: número inválido no desenho`);
    const abre = (m.svg.match(/<(g|text|svg)\b/g) || []).length, fecha = (m.svg.match(/<\/(g|text|svg)>/g) || []).length;
    igual(abre, fecha, `${id}: tags desbalanceadas`);
    if (/<(?![a-zA-Z\/!?])/.test(m.svg) || /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(m.svg)) throw new Error(`${id}: < ou & sem escape no texto (o navegador não abre)`);
  }
});

// ------------------------------------------------------------------
console.log('Folhas (paper.js)');
const PA = await mod('paper.js');
teste('as 13 folhas antigas mantêm a chave e a ordem', () => {
  igual(PA.PAPERS.slice(0, 13).map(p => p[0]).join(), 'none,grid,mm,dots,lines,notebook,calligraphy,iso,hex,cartesian,polar,music,cornell', 'chaves antigas');
});
teste('grupos cobrem todas as folhas uma vez; disciplinas e miniaturas válidas', () => {
  const chaves = PA.PAPERS.map(p => p[0]), nos = PA.PAPER_GROUPS.flatMap(g => g[1]);
  igual(new Set(chaves).size, chaves.length, 'chaves repetidas');
  igual(nos.length, chaves.length, 'folhas nos grupos');
  for (const k of chaves) if (!nos.includes(k)) throw new Error(`${k} fora dos grupos`);
  const DISC = new Set('fluxo setas icones quimica hidra saneamento lab eletrica eletronica embarcados mecanica renov computacao matematica estat fisica biologia agronomia alimentos nutricao edfisica portugues historia geografia filosofia musica empreendedorismo'.split(' '));
  for (const [k, ds] of Object.entries(PA.PAPER_DISC)) {
    if (!chaves.includes(k)) throw new Error(`PAPER_DISC: ${k} não existe`);
    for (const d of ds) if (!DISC.has(d)) throw new Error(`PAPER_DISC: disciplina ${d}`);
  }
  for (const k of PA.PAPER_GROUPS.slice(1).flatMap(g => g[1])) if (!PA.PAPER_DISC[k]) throw new Error(`${k} sem disciplina`);
  for (const [k, z] of Object.entries(PA.PAPER_PREVIEW)) if (!chaves.includes(k) || !(z > 0 && z <= 1)) throw new Error(`PAPER_PREVIEW: ${k}`);
});
teste('toda folha desenha sem erro e com poucas primitivas, no quadro e na página', () => {
  let n = 0, nan = '';
  const PRIM = new Set(['moveTo', 'lineTo', 'arc', 'fillText', 'fillRect', 'bezierCurveTo', 'rect']);
  const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (...a) => { if (PRIM.has(k)) { n++; if (a.some(v => typeof v === 'number' && !Number.isFinite(v))) nan = k; } }, set: (t, k, v) => ((t[k] = v), true) });
  for (const [k] of PA.PAPERS.slice(13)) for (const zoom of [0.1, 1, 4]) for (const pageBox of [undefined, { x: 0, y: 0, w: 794, h: 1123 }]) {
    n = 0; nan = '';
    PA.drawBackground(ctx, { pattern: k, color: '#ffffff', size: 'm', origin: { x: 0, y: 0 }, pageBox }, { x: 800, y: 450, zoom }, 1600, 900);
    if (nan) throw new Error(`${k} (zoom ${zoom}): número inválido em ${nan}`);
    if (n > 20000) throw new Error(`${k} (zoom ${zoom}): ${n} primitivas`);
  }
});

teste('recorte da curva não cria um patamar artificial no teto', () => {
  const f = P.compile('1/(s*sqrt(2*pi))*exp(-x^2/(2*s^2))', { params: ['s'] });
  const fr = { ox: 0, oy: 0, cell: 100, xmin: -5, xmax: 5, ymin: 0, ymax: .5 };
  const lines = P.curvePolylines(f, fr, { s: .5 });
  if (lines.length !== 2) throw new Error('o pico fora da janela deve separar as duas partes visíveis');
  for (const l of lines) for (let i = 3; i < l.length; i += 2) {
    if (Math.abs(l[i] + 50) < 1e-8 && Math.abs(l[i - 2] + 50) < 1e-8 && l[i - 1] !== l[i - 3]) throw new Error('segmento horizontal artificial no teto');
  }
});
teste('recorte encontra a interseção da reta com a borda do gráfico', () => {
  const lines = P.curvePolylines(x => x, { ox: 0, oy: 0, cell: 100, xmin: -2, xmax: 2, ymin: -.5, ymax: .5 });
  igual(lines.length, 1, 'polilinhas');
  perto(lines[0][0], -50, 1e-8, 'entrada');
  perto(lines[0].at(-2), 50, 1e-8, 'saída');
});

console.log(`\n${ok} testes passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
