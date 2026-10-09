// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// "Plotar função": interpretador de expressões matemáticas (sem eval) e geração da curva no plano cartesiano.
// Aceita: números (vírgula ou ponto decimal), x, + − * / ^, parênteses, multiplicação implícita (2x, 3(x+1), x sen x),
// funções sen/sin, cos, tg/tan, asen/asin, acos, atg/atan, raiz/sqrt, abs, ln, log (base 10), exp, piso/floor,
// teto/ceil, sinal/sign e constantes pi e e.
// Parâmetros nomeados (A, k, C0, mu, sigma, ω...) só são reconhecidos quando declarados:
//   compile('A*sen(w*x)', { params: ['A', 'w'] })  →  f(x, { A: 2, w: 3 })  ou  f(x, [2, 3])
//   compile(expr, { params: [{ n: 'k', v: 0.2 }] }) →  f(x) usa o valor padrão v quando o valor não vem.

const FUNCS = {
  sen: Math.sin, sin: Math.sin, cos: Math.cos, tg: Math.tan, tan: Math.tan,
  asen: Math.asin, asin: Math.asin, acos: Math.acos, atg: Math.atan, atan: Math.atan, arctg: Math.atan,
  raiz: Math.sqrt, sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10, exp: Math.exp,
  piso: Math.floor, floor: Math.floor, teto: Math.ceil, ceil: Math.ceil, sinal: Math.sign, sign: Math.sign,
};
const CONSTS = { pi: Math.PI, 'π': Math.PI, e: Math.E };
const BASE_NAMES = [...Object.keys(FUNCS), ...Object.keys(CONSTS), 'x'];
const LETRA = /[A-Za-zπα-ωΑ-Ω_]/;
const NOME_PARAM = /^[A-Za-zα-ωΑ-Ω_][A-Za-z0-9α-ωΑ-Ω_]*$/;

// normaliza a lista de parâmetros: aceita ['A','k'] ou [{n:'A', v:1}, ...]
function normParams(list) {
  const nomes = [], padroes = [];
  for (const p of list || []) {
    const n = typeof p === 'string' ? p : p?.n;
    if (typeof n !== 'string' || !NOME_PARAM.test(n)) throw new Error(`Nome de parâmetro inválido: "${n}". Use letras (e números depois), como A, k, C0, mu.`);
    if (n.toLowerCase() === 'x') throw new Error('"x" é a variável do gráfico; não pode ser parâmetro.');
    if (nomes.includes(n)) throw new Error(`Parâmetro repetido: "${n}"`);
    nomes.push(n);
    padroes.push(typeof p === 'object' && isFinite(p.v) ? +p.v : NaN);
  }
  return { nomes, padroes };
}

function tokenize(src, nomes) {
  const s = src.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/÷/g, '/')
    .replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, 'raiz');
  const low = s.toLowerCase();
  const t = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/[0-9.,]/.test(c)) {
      let j = i; while (j < s.length && /[0-9.,]/.test(s[j])) j++;
      const num = Number(s.slice(i, j).replace(',', '.'));
      if (!isFinite(num)) throw new Error(`Número inválido: "${s.slice(i, j)}"`);
      t.push({ k: 'num', v: num }); i = j;
    } else if (LETRA.test(c)) {
      // separa palavras coladas ("xsenx" -> x, sen, x ; "2pix" -> pi, x ; "Asen(wx)" com A e w declarados -> A, sen, w, x).
      // Primeiro vale o nome escrito com a mesma caixa (o mais longo); só depois a comparação sem caixa.
      // Em empate, o parâmetro declarado vence a constante (ex.: parâmetro "e").
      let exato = null, semCaixa = null;
      for (const n of nomes) if (s.startsWith(n, i) && (!exato || n.length > exato.n.length)) exato = { n, p: true };
      for (const n of BASE_NAMES) if (s.startsWith(n, i) && (!exato || n.length > exato.n.length)) exato = { n, p: false };
      for (const n of nomes) if (low.startsWith(n.toLowerCase(), i) && (!semCaixa || n.length > semCaixa.n.length)) semCaixa = { n, p: true };
      for (const n of BASE_NAMES) if (low.startsWith(n, i) && (!semCaixa || n.length > semCaixa.n.length)) semCaixa = { n, p: false };
      // parâmetro escrito com a caixa certa vence ("Asen" = A·sen); senão vale o nome mais longo ("eXp" = exp)
      const melhor = exato && (exato.p || !semCaixa || exato.n.length >= semCaixa.n.length) ? exato : semCaixa;
      if (!melhor) {
        let j = i; while (j < s.length && LETRA.test(s[j])) j++;
        const extra = nomes.length ? `, os parâmetros ${nomes.join(', ')}` : '';
        throw new Error(`Não entendi "${s.slice(i, j)}". Use x${extra}, números, + − * / ^ e funções como sen, cos, raiz, ln.`);
      }
      const f = melhor.n;
      if (melhor.p) t.push({ k: 'p', v: nomes.indexOf(f) });
      else t.push(FUNCS[f] ? { k: 'fn', v: f } : f === 'x' ? { k: 'x' } : { k: 'num', v: CONSTS[f] });
      i += f.length;
    } else if ('+-*/^()'.includes(c)) { t.push({ k: c }); i++; }
    else throw new Error(`Símbolo não reconhecido: "${c}"`);
  }
  // multiplicação implícita: 2x, 2(x), x(…), )(, )x, x sen, 2pi, 2A, A(x+1)
  const out = [];
  for (const tk of t) {
    const p = out[out.length - 1];
    const fimValor = p && (p.k === 'num' || p.k === 'x' || p.k === 'p' || p.k === ')');
    const inicioValor = tk.k === 'num' || tk.k === 'x' || tk.k === 'p' || tk.k === '(' || tk.k === 'fn';
    if (fimValor && inicioValor) out.push({ k: '*' });
    out.push(tk);
  }
  return out;
}

// gramática:  expr = termo (('+'|'-') termo)* ; termo = fator (('*'|'/') fator)* ;
//             fator = ('-'|'+') fator | pot ; pot = base ('^' fator)? ; base = num | x | param | fn base | '(' expr ')'
// Devolve f(x, valores?) — valores é objeto {nome: número} ou array na ordem de opts.params.
// f.params = nomes declarados; f.usados = nomes que aparecem de fato na expressão.
export function compile(src, opts = {}) {
  if (!src || !String(src).trim()) throw new Error('Digite uma função, por exemplo x^2 - 4');
  const { nomes, padroes } = normParams(opts.params);
  const t = tokenize(String(src), nomes);
  const usados = new Set();
  let i = 0;
  const peek = () => t[i], eat = k => { if (t[i]?.k !== k) throw new Error(k === ')' ? 'Falta fechar um parêntese' : 'Expressão incompleta'); return t[i++]; };
  const expr = () => { let a = termo(); while (peek()?.k === '+' || peek()?.k === '-') { const op = t[i++].k, b = termo(), l = a; a = op === '+' ? (x, v) => l(x, v) + b(x, v) : (x, v) => l(x, v) - b(x, v); } return a; };
  const termo = () => { let a = fator(); while (peek()?.k === '*' || peek()?.k === '/') { const op = t[i++].k, b = fator(), l = a; a = op === '*' ? (x, v) => l(x, v) * b(x, v) : (x, v) => l(x, v) / b(x, v); } return a; };
  const fator = () => { if (peek()?.k === '-') { i++; const f = fator(); return (x, v) => -f(x, v); } if (peek()?.k === '+') { i++; return fator(); } return pot(); };
  const pot = () => { const b = base(); if (peek()?.k === '^') { i++; const e = fator(); return (x, v) => Math.pow(b(x, v), e(x, v)); } return b; };
  const base = () => {
    const tk = t[i++];
    if (!tk) throw new Error('Expressão incompleta');
    if (tk.k === 'num') { const c = tk.v; return () => c; }
    if (tk.k === 'x') return x => x;
    if (tk.k === 'p') { const k = tk.v; usados.add(nomes[k]); return (x, v) => v[k]; }
    if (tk.k === 'fn') { const f = FUNCS[tk.v], a = pot(); return (x, v) => f(a(x, v)); }
    if (tk.k === '(') { const e = expr(); eat(')'); return e; }
    throw new Error(tk.k === ')' ? 'Parêntese fechando sem abrir' : `Sinal "${tk.k}" fora de lugar`);
  };
  const raizF = expr();
  if (i < t.length) throw new Error('Sobrou algo no fim da expressão');

  // conversão de valores -> array na ordem dos nomes (com cache pela referência, para animação barata)
  let ultimoObj = null, ultimoArr = padroes;
  const resolve = valores => {
    if (!valores) return padroes;
    if (Array.isArray(valores)) return valores;
    if (valores === ultimoObj) return ultimoArr;
    const arr = nomes.map((n, k) => (valores[n] !== undefined && valores[n] !== null && valores[n] !== '' ? +valores[n] : padroes[k]));
    ultimoObj = valores; ultimoArr = arr;
    return arr;
  };
  const f = (x, valores) => raizF(x, resolve(valores));
  f.params = nomes.slice();
  f.usados = [...usados];
  return f;
}

// ---------- quadro (frame) ----------
// frame = { ox, oy, cell | cellX + cellY, xmin, xmax, ymin, ymax }
//   (ox, oy): origem em coordenadas do mundo; cellX/cellY: px do mundo por unidade em cada eixo (cell vale para os dois).
const cx = fr => fr.cellX ?? fr.cell, cy = fr => fr.cellY ?? fr.cell;

// quadro que encaixa a faixa x:[x0,x1] × y:[y0,y1] dentro do retângulo do mundo rect = {x, y, w, h}
// (escalas independentes nos dois eixos; margem em fração do retângulo).
export function fitFrame(rect, [x0, x1], [y0, y1], margem = 0.08) {
  const mx = rect.w * margem, my = rect.h * margem;
  const cellX = (rect.w - 2 * mx) / (x1 - x0), cellY = (rect.h - 2 * my) / (y1 - y0);
  return {
    ox: rect.x + mx - x0 * cellX, oy: rect.y + rect.h - my + y0 * cellY,
    cellX, cellY, xmin: x0, xmax: x1, ymin: y0, ymax: y1,
  };
}

// faixa de y sugerida amostrando a função em [x0, x1] (com folga de 10%); ignora valores não finitos.
export function faixaY(f, [x0, x1], valores, n = 200) {
  let lo = Infinity, hi = -Infinity;
  for (let k = 0; k <= n; k++) {
    let y; try { y = f(x0 + (x1 - x0) * k / n, valores); } catch { y = NaN; }
    if (isFinite(y)) { if (y < lo) lo = y; if (y > hi) hi = y; }
  }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < 1e-12) { const d = Math.abs(lo) * 0.1 || 1; return [lo - d, hi + d]; }
  const d = (hi - lo) * 0.1;
  return [lo - d, hi + d];
}

// amostra y = f(x, valores) e devolve polilinhas no mundo: [[x0, y0, x1, y1, ...], ...].
// Corta nas descontinuidades e fora da faixa visível de y. Base de plotStrokes e da animação.
export function curvePolylines(f, frame, valores) {
  const { ox, oy, xmin, xmax, ymin, ymax } = frame, sx = cx(frame), sy = cy(frame);
  const n = Math.max(200, Math.min(4000, Math.round((xmax - xmin) * sx / 1.5)));
  const salto = (ymax - ymin) * 0.5, folga = ymax - ymin;
  const linhas = [];
  let cur = [], prevY = null;
  const flush = () => { if (cur.length >= 4) linhas.push(cur); cur = []; };
  for (let k = 0; k <= n; k++) {
    const x = xmin + (xmax - xmin) * k / n;
    let y;
    try { y = f(x, valores); } catch { y = NaN; }
    const fora = !isFinite(y) || y < ymin - folga || y > ymax + folga;
    if (fora || (prevY !== null && Math.abs(y - prevY) > salto)) {
      flush(); prevY = isFinite(y) ? y : null;
      if (fora) continue;
    }
    // limita à faixa visível (com folga) para não criar coordenadas gigantes
    const yc = Math.max(ymin - folga * 0.02, Math.min(ymax + folga * 0.02, y));
    cur.push(ox + x * sx, oy - yc * sy);
    prevY = y;
  }
  flush();
  return linhas;
}

// gera traços (itens 'stroke' do mundo) da curva y = f(x) no plano com origem (ox, oy).
// Aceita cell (mesma escala) ou cellX/cellY; `valores` são os parâmetros (opcional).
export function plotStrokes(f, { color, width, id, valores, ...frame }) {
  return curvePolylines(f, frame, valores).map(l => {
    const pts = [];
    for (let i = 0; i < l.length; i += 2) pts.push(l[i], l[i + 1], 0.5);
    return { id: id(), type: 'stroke', tool: 'pen', color, width, pts };
  });
}

// ---------- animação (camada de sobreposição, sem criar itens) ----------
// anim = { n: 'k', min, max, periodo: segundos de ida e volta (padrão 4), modo: 'vaivem' | 'ciclo' }
// devolve o valor do parâmetro animado no instante tSeg (segundos).
export function animValue(anim, tSeg) {
  const T = anim.periodo > 0 ? anim.periodo : 4;
  let u = ((tSeg / T) % 1 + 1) % 1;
  if (anim.modo !== 'ciclo') u = u < 0.5 ? u * 2 : 2 - u * 2;   // vai e volta
  return anim.min + (anim.max - anim.min) * u;
}

// pontos da curva num quadro de animação: valores (objeto) com o parâmetro animado trocado pelo valor do instante.
// Chame a cada requestAnimationFrame e desenhe `linhas` com drawPolylines no contexto já na transformação do mundo.
export function animatedCurve(f, frame, valores, anim, tSeg) {
  const valor = animValue(anim, tSeg);
  const v = { ...(valores || {}), [anim.n]: valor };
  return { valor, valores: v, linhas: curvePolylines(f, frame, v) };
}

// desenha polilinhas (mundo) num contexto 2D já transformado; width em unidades do mundo.
export function drawPolylines(ctx, linhas, { color = '#0078d4', width = 3, dash = null } = {}) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  for (const l of linhas) { ctx.moveTo(l[0], l[1]); for (let i = 2; i < l.length; i += 2) ctx.lineTo(l[i], l[i + 1]); }
  ctx.stroke();
  ctx.restore();
}

// ---------- eixos cartesianos como traços apagáveis ----------
// passo "redondo" (1, 2, 2,5, 5 × 10^n) que dê pelo menos `minPx` px do mundo entre marcas
export function passoBonito(cell, minPx = 40) {
  const bruto = minPx / cell, p = Math.pow(10, Math.floor(Math.log10(bruto)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= bruto * 0.999) return m * p;
  return 10 * p;
}

// número em pt-BR (vírgula decimal, sem ruído de ponto flutuante)
export function fmtNum(v) {
  if (Math.abs(v) < 1e-12) return '0';
  const s = String(+v.toPrecision(10));
  return s.replace('.', ',').replace('-', '−');
}

// Eixos x e y (com setinha na ponta positiva) e marcas de escala, como itens 'stroke' — e, se pedido, números e nomes
// dos eixos como itens 'text'. Os eixos passam pela origem quando ela está no quadro; senão, ficam na borda.
// opts: { color, width, id, passoX?, passoY?, marca? (meio comprimento da marca, mundo), rotulos? (true = números),
//         size? (fonte dos números, mundo), font?, eixoX?, eixoY? (nomes, ex.: 't (min)'), medir?(texto, size) → largura }
// Todos os itens levam `eixo: true` para o editor poder agrupá-los/reconhecê-los.
export function axesStrokes(frame, opts) {
  const { ox, oy, xmin, xmax, ymin, ymax } = frame, sx = cx(frame), sy = cy(frame);
  const { color = '#000000', width = 2, id, rotulos = false, font, eixoX, eixoY } = opts;
  const marca = opts.marca ?? width * 3;
  const size = opts.size ?? Math.max(12, width * 7);
  const medir = opts.medir || ((t, s) => String(t).length * s * 0.6);
  const passoX = opts.passoX ?? passoBonito(sx), passoY = opts.passoY ?? passoBonito(sy);
  const X = x => ox + x * sx, Y = y => oy - y * sy;
  const y0 = Math.min(ymax, Math.max(ymin, 0)), x0 = Math.min(xmax, Math.max(xmin, 0));
  const ponta = 0.04;   // folga além da faixa para a seta
  const itens = [];
  const traço = (pts, extra = {}) => itens.push({ id: id(), type: 'stroke', tool: 'pen', color, width, pts, eixo: true, ...extra });
  const linha = (ax, ay, bx, by, partes = 8) => {
    const pts = [];
    for (let k = 0; k <= partes; k++) pts.push(ax + (bx - ax) * k / partes, ay + (by - ay) * k / partes, 0.5);
    return pts;
  };
  const texto = (text, x, y, alinhar = 'centro') => {
    const w = medir(text, size) + 4;
    const left = alinhar === 'centro' ? x - w / 2 : alinhar === 'direita' ? x - w : x;
    const it = { id: id(), type: 'text', x: left, y, text, color, size, w, eixo: true };
    if (font) it.font = font;
    itens.push(it);
  };
  const dx = (xmax - xmin) * ponta, dy = (ymax - ymin) * ponta;
  // eixo x e eixo y (setas na ponta positiva)
  traço(linha(X(xmin), Y(y0), X(xmax + dx), Y(y0)), { arrow: true });
  traço(linha(X(x0), Y(ymin), X(x0), Y(ymax + dy)), { arrow: true });
  // marcas de escala
  const eps = 1e-9;
  for (let k = Math.ceil(xmin / passoX - eps); k * passoX <= xmax + eps; k++) {
    const v = k * passoX;
    if (Math.abs(v - x0) < passoX * 1e-6) continue;
    traço(linha(X(v), Y(y0) - marca, X(v), Y(y0) + marca, 1));
    if (rotulos) texto(fmtNum(v), X(v), Y(y0) + marca + size * 0.2);
  }
  for (let k = Math.ceil(ymin / passoY - eps); k * passoY <= ymax + eps; k++) {
    const v = k * passoY;
    if (Math.abs(v - y0) < passoY * 1e-6) continue;
    traço(linha(X(x0) - marca, Y(v), X(x0) + marca, Y(v), 1));
    if (rotulos) texto(fmtNum(v), X(x0) - marca - size * 0.3, Y(v) - size * 0.7, 'direita');
  }
  if (rotulos && x0 === 0 && y0 === 0) texto('0', X(0) - marca - size * 0.3, Y(0) + marca, 'direita');
  if (eixoX) texto(eixoX, X(xmax + dx), Y(y0) + marca + size * 1.5, 'direita');
  if (eixoY) texto(eixoY, X(x0) + marca + size * 0.4, Y(ymax + dy) - size * 0.6, 'esquerda');
  return itens;
}
