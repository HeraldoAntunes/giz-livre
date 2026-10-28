// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Calculadora flutuante: conta rápida sem sair do quadro. Usa o mesmo interpretador das funções (plot.js), então
// aceita sen, cos, tg, raiz, ln, log, pi, potência e vírgula decimal. Em graus, as funções de ângulo trabalham em graus.
import { compile, fmtNum } from './plot.js';
import { draggable, fechou } from './tools.js';
import { ICON } from './icons.js';

const TRIG = ['sen', 'sin', 'cos', 'tg', 'tan'], INV = ['asen', 'asin', 'acos', 'atg', 'atan', 'arctg'];
const ANS = /(?<![a-z])ans(?![a-z])/gi;

// em graus: sen(30) vira sen((30)*pi/180) e asen(0,5) vira (asen(0,5)*180/pi); o resto fica igual
export function emGraus(src) {
  let out = '', i = 0;
  while (i < src.length) {
    const m = /^(arctg|asen|asin|acos|atg|atan|sen|sin|cos|tg|tan)\s*\(/.exec(src.slice(i));
    if (!m || (i > 0 && /[A-Za-z]/.test(src[i - 1]))) { out += src[i++]; continue; }
    let d = 0, j = i + m[0].length - 1;
    for (; j < src.length; j++) { if (src[j] === '(') d++; else if (src[j] === ')' && --d === 0) break; }
    const dentro = emGraus(src.slice(i + m[0].length, j)), nome = m[1];
    out += INV.includes(nome) ? `(${nome}(${dentro})*180/pi)` : TRIG.includes(nome) ? `${nome}((${dentro})*pi/180)` : `${nome}(${dentro})`;
    i = j + 1;
  }
  return out;
}

// conta → número; erro com mensagem em português. `ans` = resultado anterior (entra como valor, não como texto)
export function calcular(src, graus = true, ans = null) {
  const s = String(src).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(ANS, 'ans').trim();
  if (!s) throw new Error('Digite uma conta');
  if (/(^|[^a-z])x(?![a-z])/i.test(s)) throw new Error('Na calculadora não há x; use a ferramenta Função');
  if (ans == null && s.match(ANS)) throw new Error('Ainda não há resultado para usar em Ans');
  let f;
  try { f = compile(graus ? emGraus(s) : s, { params: [{ n: 'ans', v: ans ?? 0 }] }); }
  catch (e) { throw new Error(e.message.replace(/ Use x.*$/, ' Use números, + − × ÷ ^, parênteses e funções como sen, cos, raiz, ln.')); }
  const v = f(0);
  if (!Number.isFinite(v)) throw new Error('Conta sem resultado (divisão por zero ou fora do domínio)');
  return Math.abs(v) < 1e-12 ? 0 : +v.toPrecision(12);
}

const TECLAS = [
  ['sen(', 'cos(', 'tg(', 'ln(', 'log('],
  ['√(', '^', '(', ')', '÷'],
  ['7', '8', '9', '×', 'C'],
  ['4', '5', '6', '−', '⌫'],
  ['1', '2', '3', '+', 'π'],
  ['0', ',', 'ans', '=', ''],
];

let calc = null;
export const calcOpen = () => !!calc;
export function closeCalc() { if (calc) { calc.el.remove(); calc = null; fechou(); } }

// noQuadro(texto): põe "conta = resultado" no quadro
export function toggleCalc(noQuadro) {
  if (calc) return closeCalc();
  const graus = localStorage.getItem('lousa.calcGraus') !== '0';
  const el = document.createElement('div');
  el.className = 'timerbox calcbox';
  el.innerHTML = `<div class="tm-head"><span>Calculadora</span><span>
      <button class="ck-sec${graus ? ' on' : ''}" data-a="g" title="Ângulos de sen, cos e tg: em graus ou em radianos">${graus ? 'graus' : 'radianos'}</button>
      <button class="ib" data-a="x" title="Fechar a calculadora">${ICON.close}</button></span></div>
    <input class="cc-in" spellcheck="false" autocomplete="off" placeholder="Ex.: 2,5 × sen(30)" aria-label="Conta">
    <div class="cc-res" aria-live="polite">&nbsp;</div>
    <div class="cc-teclas">${TECLAS.flat().map(t => t ? `<button class="btn${t === '=' ? ' primary' : ''}" data-t="${t}">${t === 'ans' ? 'Ans' : t.length > 1 ? t.replace('(', '') : t}</button>` : '<span></span>').join('')}</div>
    <div class="tm-row"><button class="btn" data-a="q" title="Escreve a conta e o resultado no quadro, como texto">Pôr no quadro</button></div>`;
  document.body.appendChild(el);
  calc = { el, graus, ans: null, ultima: null };
  const C = calc, inp = el.querySelector('.cc-in'), res = el.querySelector('.cc-res');
  const mostra = (final = false) => {
    if (!final) C.ultima = null;   // a conta mudou: o resultado guardado não vale mais
    if (!inp.value.trim()) { res.innerHTML = '&nbsp;'; res.classList.remove('erro'); return; }
    try {
      const v = calcular(inp.value, C.graus, C.ans);
      res.textContent = '= ' + fmtNum(v); res.classList.remove('erro');
      // no quadro, Ans aparece com o número que valia nesta conta
      if (final) { C.ultima = { conta: inp.value, texto: inp.value.replace(ANS, () => fmtNum(C.ans)), v }; C.ans = v; }
    } catch (e) { res.textContent = final ? e.message : ' '; res.classList.toggle('erro', final); }
  };
  const tecla = t => {
    if (t === 'C') inp.value = '';
    else if (t === '⌫') inp.value = inp.value.slice(0, -1);
    else if (t === '=') return mostra(true);
    else inp.value += t;
    mostra();
  };
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tecla(b.dataset.t); inp.focus(); });
  inp.addEventListener('input', () => mostra());
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); mostra(true); } });
  el.addEventListener('keydown', e => e.stopPropagation());   // nenhuma tecla daqui vira atalho do quadro (caneta, tela preta)
  el.querySelector('[data-a="x"]').onclick = closeCalc;
  const gb = el.querySelector('[data-a="g"]');
  gb.onclick = () => {
    C.graus = !C.graus; gb.classList.toggle('on', C.graus); gb.textContent = C.graus ? 'graus' : 'radianos';
    try { localStorage.setItem('lousa.calcGraus', C.graus ? '1' : '0'); } catch {}
    mostra(); inp.focus();
  };
  el.querySelector('[data-a="q"]').onclick = () => {
    if (!C.ultima) mostra(true);   // já calculada (Enter ou =): não refaz, senão o Ans já seria o novo resultado
    if (C.ultima) noQuadro?.(`${C.ultima.texto.trim()} = ${fmtNum(C.ultima.v)}`);
    inp.focus();
  };
  draggable(el, 'lousa.calcPos');
  inp.focus();
}
