// "Plotar função": interpretador de expressões matemáticas (sem eval) e geração da curva no plano cartesiano.
// Aceita: números (vírgula ou ponto decimal), x, + − * / ^, parênteses, multiplicação implícita (2x, 3(x+1), x sen x),
// funções sen/sin, cos, tg/tan, asen/asin, acos, atg/atan, raiz/sqrt, abs, ln, log (base 10), exp e constantes pi e e.

const FUNCS = {
  sen: Math.sin, sin: Math.sin, cos: Math.cos, tg: Math.tan, tan: Math.tan,
  asen: Math.asin, asin: Math.asin, acos: Math.acos, atg: Math.atan, atan: Math.atan, arctg: Math.atan,
  raiz: Math.sqrt, sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10, exp: Math.exp,
};
const CONSTS = { pi: Math.PI, 'π': Math.PI, e: Math.E };

function tokenize(src) {
  const s = src.toLowerCase().replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/÷/g, '/')
    .replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, 'raiz');
  const t = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/[0-9.,]/.test(c)) {
      let j = i; while (j < s.length && /[0-9.,]/.test(s[j])) j++;
      const num = Number(s.slice(i, j).replace(',', '.'));
      if (!isFinite(num)) throw new Error(`Número inválido: "${s.slice(i, j)}"`);
      t.push({ k: 'num', v: num }); i = j;
    } else if (/[a-zπ]/.test(c)) {
      let j = i; while (j < s.length && /[a-zπ]/.test(s[j])) j++;
      let w = s.slice(i, j);
      // separa palavras coladas: "xsenx" -> x, sen, x ; "2pix" -> pi, x
      while (w) {
        const f = Object.keys(FUNCS).concat(Object.keys(CONSTS), ['x']).sort((a, b) => b.length - a.length).find(n => w.startsWith(n));
        if (!f) throw new Error(`Não entendi "${w}". Use x, números, + − * / ^ e funções como sen, cos, raiz, ln.`);
        t.push(FUNCS[f] ? { k: 'fn', v: f } : f === 'x' ? { k: 'x' } : { k: 'num', v: CONSTS[f] });
        w = w.slice(f.length);
      }
      i = j;
    } else if ('+-*/^()'.includes(c)) { t.push({ k: c }); i++; }
    else throw new Error(`Símbolo não reconhecido: "${c}"`);
  }
  // multiplicação implícita: 2x, 2(x), x(…), )(, )x, x sen, 2pi
  const out = [];
  for (const tk of t) {
    const p = out[out.length - 1];
    const fimValor = p && (p.k === 'num' || p.k === 'x' || p.k === ')');
    const inicioValor = tk.k === 'num' || tk.k === 'x' || tk.k === '(' || tk.k === 'fn';
    if (fimValor && inicioValor) out.push({ k: '*' });
    out.push(tk);
  }
  return out;
}

// gramática:  expr = termo (('+'|'-') termo)* ; termo = fator (('*'|'/') fator)* ;
//             fator = ('-'|'+') fator | pot ; pot = base ('^' fator)? ; base = num | x | fn base | '(' expr ')'
export function compile(src) {
  if (!src || !src.trim()) throw new Error('Digite uma função, por exemplo x^2 - 4');
  const t = tokenize(src);
  let i = 0;
  const peek = () => t[i], eat = k => { if (t[i]?.k !== k) throw new Error(k === ')' ? 'Falta fechar um parêntese' : 'Expressão incompleta'); return t[i++]; };
  const expr = () => { let a = termo(); while (peek()?.k === '+' || peek()?.k === '-') { const op = t[i++].k, b = termo(), l = a; a = op === '+' ? x => l(x) + b(x) : x => l(x) - b(x); } return a; };
  const termo = () => { let a = fator(); while (peek()?.k === '*' || peek()?.k === '/') { const op = t[i++].k, b = fator(), l = a; a = op === '*' ? x => l(x) * b(x) : x => l(x) / b(x); } return a; };
  const fator = () => { if (peek()?.k === '-') { i++; const f = fator(); return x => -f(x); } if (peek()?.k === '+') { i++; return fator(); } return pot(); };
  const pot = () => { const b = base(); if (peek()?.k === '^') { i++; const e = fator(); return x => Math.pow(b(x), e(x)); } return b; };
  const base = () => {
    const tk = t[i++];
    if (!tk) throw new Error('Expressão incompleta');
    if (tk.k === 'num') { const v = tk.v; return () => v; }
    if (tk.k === 'x') return x => x;
    if (tk.k === 'fn') { const f = FUNCS[tk.v], a = pot(); return x => f(a(x)); }
    if (tk.k === '(') { const e = expr(); eat(')'); return e; }
    throw new Error(tk.k === ')' ? 'Parêntese fechando sem abrir' : `Sinal "${tk.k}" fora de lugar`);
  };
  const f = expr();
  if (i < t.length) throw new Error('Sobrou algo no fim da expressão');
  return f;
}

// gera traços (mundo) da curva y = f(x) no plano com origem (ox, oy) e `cell` px por unidade.
// Corta nas descontinuidades e fora da faixa visível de y.
export function plotStrokes(f, { ox, oy, cell, xmin, xmax, ymin, ymax, color, width, id }) {
  const n = Math.max(200, Math.min(4000, Math.round((xmax - xmin) * cell / 1.5)));
  const salto = (ymax - ymin) * 0.5;
  const strokes = [];
  let cur = [], prevY = null;
  const flush = () => { if (cur.length >= 6) strokes.push({ id: id(), type: 'stroke', tool: 'pen', color, width, pts: cur }); cur = []; };
  for (let k = 0; k <= n; k++) {
    const x = xmin + (xmax - xmin) * k / n;
    let y;
    try { y = f(x); } catch { y = NaN; }
    if (!isFinite(y) || y < ymin - (ymax - ymin) || y > ymax + (ymax - ymin) || (prevY !== null && Math.abs(y - prevY) > salto)) {
      flush(); prevY = isFinite(y) ? y : null;
      if (!isFinite(y) || y < ymin - (ymax - ymin) || y > ymax + (ymax - ymin)) continue;
    }
    // limita à faixa visível (com folga) para não criar coordenadas gigantes
    const yc = Math.max(ymin - 1, Math.min(ymax + 1, y));
    cur.push(ox + x * cell, oy - yc * cell, 0.5);
    prevY = y;
  }
  flush();
  return strokes;
}
