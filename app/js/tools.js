// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Ferramentas de professor que vivem fora do canvas: cronômetro, fórmulas (KaTeX) e reconhecimento de escrita.
import { ICON } from './icons.js';
import { wfetch } from './api.js';

// limites do KaTeX: uma fórmula malformada gravada num arquivo não trava a janela
const KATEX_LIM = { maxExpand: 1000, maxSize: 50 };

// ---------------- cronômetro / timer ----------------
let timer = null;
export const timerOpen = () => !!timer;
// "7", "7,5" (minutos), "7:30", "1:05:00" → segundos
export function parseTempo(s) {
  s = String(s).trim().replace(',', '.');
  if (!s) return null;
  if (s.includes(':')) {
    const p = s.split(':').map(Number);
    if (p.some(n => !isFinite(n) || n < 0)) return null;
    return Math.round(p.reduce((a, n) => a * 60 + n, 0));
  }
  const m = Number(s);
  return isFinite(m) && m > 0 ? Math.round(m * 60) : null;
}
// dígitos de mostrador (sete segmentos) em SVG: "parece relógio de verdade"
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };
const SEGP = {   // segmentos num dígito 30×52 (polígonos chanfrados)
  a: '5,2 25,2 21,6 9,6', b: '26,3 26,24 23,26 22,7', c: '26,28 26,49 22,45 23,28', d: '5,50 25,50 21,46 9,46',
  e: '4,28 4,49 8,45 7,28', f: '4,3 4,24 7,26 8,7', g: '6,26 9,23.5 21,23.5 24,26 21,28.5 9,28.5',
};
export function seg7(txt) {
  let x = 0, svg = '';
  for (const ch of String(txt)) {
    if (ch === ':') { svg += `<circle cx="${x + 5}" cy="17" r="2.6"/><circle cx="${x + 5}" cy="35" r="2.6"/>`; x += 10; continue; }
    const on = SEG[ch] || '';
    for (const s of 'abcdefg') svg += `<polygon points="${SEGP[s].split(' ').map(q => { const [a, b] = q.split(','); return `${+a + x},${b}`; }).join(' ')}" class="${on.includes(s) ? 'on' : 'off'}"/>`;
    x += 32;
  }
  return `<svg class="seg7" viewBox="0 0 ${x} 52" role="img" aria-label="${txt}">${svg}</svg>`;
}
const relogioTexto = s => {   // segundos → "05:00" ou "1:05:00"
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, p = n => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s % 60)}` : `${p(m)}:${p(s % 60)}`;
};
// caixa reduzida: depois de iniciar, cronômetro ou relógio vira um mostrador pequeno; tocar nele volta ao completo
function reduzivel(el) {
  const b = el.querySelector('[data-a="mini"]');
  const set = on => { el.classList.toggle('mini', on); b.title = on ? 'Mostrar o painel completo' : 'Reduzir: só o mostrador, pequeno e discreto'; };
  b.onclick = e => { e.stopPropagation(); set(!el.classList.contains('mini')); };
  const tm = el.querySelector('.tm-time');
  let arrastou = false;
  tm.addEventListener('click', e => {
    if (!el.classList.contains('mini')) return;
    e.stopImmediatePropagation();
    if (arrastou) { arrastou = false; return; }   // foi arrasto, não toque
    set(false);
  }, true);
  // reduzido, o cabeçalho some: o próprio mostrador vira alça
  tm.addEventListener('pointerdown', e => {
    if (!el.classList.contains('mini') || document.body.classList.contains('barras-travadas')) return;
    const r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top, x0 = e.clientX, y0 = e.clientY;
    arrastou = false;
    try { tm.setPointerCapture(e.pointerId); } catch {}
    tm.onpointermove = ev => {
      if (!arrastou && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
      arrastou = true;
      const x = Math.max(0, Math.min(innerWidth - el.offsetWidth, ev.clientX - dx)), y = Math.max(0, Math.min(innerHeight - el.offsetHeight, ev.clientY - dy));
      el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto';
    };
    tm.onpointerup = () => {
      tm.onpointermove = tm.onpointerup = null;
      if (arrastou) { const bb = el.getBoundingClientRect(); try { localStorage.setItem(el.dataset.pos, JSON.stringify({ x: bb.left, y: bb.top })); } catch {} }
    };
  });
  aplicaModelo(el);
  return set;
}

// cor dos dígitos e modelos de mostrador, os mesmos para cronômetro e relógio (lembrados)
export const MODELOS = [
  ['classico', 'Clássico', { on: '#1f1f1f', fundo: 'transparent', apagado: .06 }],
  ['digital', 'Digital verde', { on: '#39ff14', fundo: '#0b1a0b', apagado: .1 }],
  ['placar', 'Placar vermelho', { on: '#ff3b30', fundo: '#111', apagado: .12 }],
  ['ambar', 'Âmbar', { on: '#ffb000', fundo: '#1a1206', apagado: .1 }],
  ['azul', 'Azul', { on: '#0f6cbd', fundo: 'transparent', apagado: .07 }],
  ['discreto', 'Discreto', { on: '#8a8886', fundo: 'transparent', apagado: .04, alto: 48 }],
  ['projetor', 'Grande (projetor)', { on: '#000', fundo: 'transparent', apagado: .07, alto: 96 }],
];
const lerMostrador = () => { try { return JSON.parse(localStorage.getItem('lousa.mostrador') || '{}'); } catch { return {}; } };
function aplicaModelo(el) {
  const c = lerMostrador(), m = (MODELOS.find(x => x[0] === c.modelo) || MODELOS[0]);
  const v = m[2], on = c.cor || v.on;
  el.dataset.modelo = m[0];
  el.style.setProperty('--seg-on', on);
  el.style.setProperty('--seg-off', v.apagado);
  el.style.setProperty('--tm-bg', v.fundo);
  el.style.setProperty('--seg-h', (v.alto || 64) + 'px');
  el.classList.toggle('cor-propria', !!c.cor || m[0] !== 'classico');
}
const aplicaTodos = () => document.querySelectorAll('.timerbox:not(.spotbox):not(.animbox)').forEach(aplicaModelo);
function modelosPop(el) {
  const velho = el.querySelector('.tm-modelos');
  if (velho) { velho.remove(); return; }
  const c = lerMostrador(), box = document.createElement('div');
  box.className = 'tm-modelos';
  box.innerHTML = `<div class="tm-mod-lista">${MODELOS.map(([k, n, v]) => `<button class="tm-mod${(c.modelo || 'classico') === k && !c.cor ? ' on' : ''}" data-m="${k}" title="${n}"><span style="background:${v.fundo === 'transparent' ? '#fff' : v.fundo};color:${v.on}">12:30</span><small>${n}</small></button>`).join('')}</div>
    <label class="tm-cor">Cor dos dígitos: <input type="color" value="${c.cor || '#1f1f1f'}"> <button class="btn" data-a="sem">Cor do modelo</button></label>`;
  el.appendChild(box);
  const salva = x => { try { localStorage.setItem('lousa.mostrador', JSON.stringify(x)); } catch {} aplicaTodos(); };
  box.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { salva({ modelo: b.dataset.m }); box.remove(); modelosPop(el); });
  box.querySelector('input').oninput = e => salva({ ...lerMostrador(), cor: e.target.value });
  box.querySelector('[data-a="sem"]').onclick = () => { const x = lerMostrador(); delete x.cor; salva(x); box.remove(); modelosPop(el); };
}
export function toggleTimer() {
  if (timer) { timer.el.remove(); clearInterval(timer.iv); timer = null; fechou(); return; }
  const el = document.createElement('div');
  el.className = 'timerbox';
  el.innerHTML = `<div class="tm-head"><span>Cronômetro</span><span><button class="ib" data-a="cor" title="Cor e modelo do mostrador">${ICON.color}</button><button class="ib" data-a="mini" title="Reduzir: só o mostrador, pequeno e discreto">${ICON.collapse}</button><button class="ib" data-a="x" title="Fechar">${ICON.close}</button></span></div>
    <div class="tm-time"></div>
    <div class="tm-row">${[1, 3, 5, 10, 15].map(m => `<button class="btn" data-m="${m}">${m} min</button>`).join('')}</div>
    <div class="tm-row"><input class="tm-in" placeholder="Digite: 7 ou 7:30" title="Minutos (7 ou 7,5) ou minutos:segundos (7:30)"><button class="btn" data-a="set">Definir</button></div>
    <div class="tm-msg" hidden>Use minutos (7 ou 7,5) ou minutos:segundos (7:30).</div>
    <div class="tm-row"><button class="btn primary" data-a="go">Iniciar</button><button class="btn" data-a="up" title="Sem tempo definido: conta a partir de zero, sem limite, até pausar">Livre (sem limite)</button><button class="btn" data-a="zero">Zerar</button></div>
    <label class="tm-auto"><input type="checkbox" data-a="auto"> Reduzir sozinho ao iniciar</label>`;
  document.body.appendChild(el);
  timer = { el, total: 300, left: 300, run: false, up: false, iv: 0 };
  const T = timer, reduz = reduzivel(el), auto = el.querySelector('[data-a="auto"]');
  try { auto.checked = localStorage.getItem('lousa.timerAuto') === '1'; } catch {}
  auto.onchange = () => { try { localStorage.setItem('lousa.timerAuto', auto.checked ? '1' : '0'); } catch {} };
  const show = () => {
    el.querySelector('.tm-time').innerHTML = seg7(relogioTexto(Math.max(0, Math.round(T.left))));
    el.classList.toggle('end', !T.up && T.left <= 0);
    el.classList.toggle('livre', T.up);
    el.querySelector('[data-a="go"]').textContent = T.run ? 'Pausar' : 'Iniciar';
  };
  const comecou = () => { if (auto.checked) reduz(true); };
  const tick = () => {
    if (!T.run) return;
    T.left += T.up ? 1 : -1;
    if (!T.up && T.left <= 0) { T.left = 0; T.run = false; beep(); reduz(false); }
    show();
  };
  T.iv = setInterval(tick, 1000);
  el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { T.up = false; T.total = T.left = +b.dataset.m * 60; T.run = false; show(); });
  el.querySelector('[data-a="go"]').onclick = () => { if (!T.up && T.left <= 0) T.left = T.total; T.run = !T.run; show(); if (T.run) comecou(); };
  el.querySelector('[data-a="up"]').onclick = () => { T.up = true; T.left = 0; T.run = true; show(); comecou(); };
  el.querySelector('[data-a="zero"]').onclick = () => { T.run = false; T.left = T.up ? 0 : T.total; show(); };
  el.querySelector('[data-a="x"]').onclick = toggleTimer;
  const inp = el.querySelector('.tm-in');
  const setTempo = () => {
    const s = parseTempo(inp.value);
    const msg = el.querySelector('.tm-msg');
    if (!s) { inp.classList.add('err'); msg.hidden = false; return; }
    inp.classList.remove('err'); msg.hidden = true; inp.value = '';
    T.up = false; T.total = T.left = Math.min(s, 99 * 3600); T.run = false; show();
  };
  el.querySelector('[data-a="set"]').onclick = setTempo;
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') setTempo(); });
  el.querySelector('.tm-time').ondblclick = () => inp.focus();
  el.querySelector('[data-a="cor"]').onclick = () => modelosPop(el);
  draggable(el, 'lousa.timerPos');
  show();
}

// arrastar uma caixa flutuante pelo cabeçalho; a posição fica guardada (chave no localStorage)
export function draggable(el, key) {
  el.dataset.pos = key;
  const head = el.querySelector('.tm-head');
  const fit = (x, y) => [Math.max(0, Math.min(innerWidth - el.offsetWidth, x)), Math.max(0, Math.min(innerHeight - el.offsetHeight, y))];
  const place = (x, y) => { [x, y] = fit(x, y); el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto'; };
  try { const p = JSON.parse(localStorage.getItem(key) || 'null'); if (p) place(p.x, p.y); } catch {}
  if (!el.style.left) {
    // sem posição guardada: não cobre a barra do professor quando ela está aberta à direita
    const tb = document.getElementById('teachbar');
    if (tb && !tb.hidden && !el.classList.contains('clockbox')) { const r = tb.getBoundingClientRect(); place(r.left - el.offsetWidth - 12, Math.max(r.top, 64)); }   // abaixo das barras de cima
  }
  head.onpointerdown = e => {
    if (e.target.closest('button') || document.body.classList.contains('barras-travadas')) return;
    const r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    head.setPointerCapture(e.pointerId);
    head.onpointermove = ev => place(ev.clientX - dx, ev.clientY - dy);
    head.onpointerup = () => {
      head.onpointermove = null;
      const b = el.getBoundingClientRect();
      try { localStorage.setItem(key, JSON.stringify({ x: b.left, y: b.top })); } catch {}
    };
  };
}

// janela flutuante fechada (pelo X ou pelo botão): o editor apaga o botão aceso na barra
export const fechou = () => dispatchEvent(new CustomEvent('giz:flutuante-fechou'));

// fecha cronômetro e relógio (ao sair do quadro)
export function closeFloating() { if (timer) toggleTimer(); if (clock) toggleClock(); }

// ---------------- relógio (hora do sistema) ----------------
let clock = null;
export const clockOpen = () => !!clock;
export function toggleClock() {
  if (clock) { clock.el.remove(); clearInterval(clock.iv); clock = null; fechou(); return; }
  const el = document.createElement('div');
  el.className = 'timerbox clockbox';
  el.innerHTML = `<div class="tm-head"><span>Relógio e calendário</span><span><button class="ck-sec on" data-a="s" title="Mostrar ou esconder os segundos">segundos</button><button class="ck-sec" data-a="cal" title="Mostrar ou esconder o calendário do mês">calendário</button><button class="ib" data-a="cor" title="Cor e modelo do mostrador">${ICON.color}</button><button class="ib" data-a="mini" title="Reduzir: só o mostrador, pequeno e discreto">${ICON.collapse}</button><button class="ib" data-a="x" title="Fechar">${ICON.close}</button></span></div>
    <div class="tm-time"></div><div class="ck-date"></div><div class="ck-cal" hidden></div>`;
  document.body.appendChild(el);
  clock = { el, sec: true, iv: 0 };
  const C = clock, p = n => String(n).padStart(2, '0');
  const show = () => {
    const d = new Date();
    el.querySelector('.tm-time').innerHTML = seg7(`${p(d.getHours())}:${p(d.getMinutes())}${C.sec ? ':' + p(d.getSeconds()) : ''}`);
    const dt = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    el.querySelector('.ck-date').textContent = dt.charAt(0).toUpperCase() + dt.slice(1);   // "Sexta-feira, 9 de outubro"
  };
  C.iv = setInterval(show, 500);
  el.querySelector('[data-a="x"]').onclick = toggleClock;
  const sec = el.querySelector('[data-a="s"]');
  const alterna = () => { C.sec = !C.sec; sec.classList.toggle('on', C.sec); show(); };
  sec.onclick = alterna;
  reduzivel(el);
  el.querySelector('.tm-time').onclick = alterna;
  // calendário do mês (hoje marcado; ‹ › trocam o mês)
  const calBtn = el.querySelector('[data-a="cal"]'), cal = el.querySelector('.ck-cal');
  let mes = null;
  const desenha = () => {
    const hoje = new Date(), a = mes.getFullYear(), m = mes.getMonth();
    const ini = new Date(a, m, 1).getDay(), dias = new Date(a, m + 1, 0).getDate();
    const nome = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    let cel = '';
    for (let i = 0; i < ini; i++) cel += '<span></span>';
    for (let d = 1; d <= dias; d++) {
      const eHoje = d === hoje.getDate() && m === hoje.getMonth() && a === hoje.getFullYear();
      cel += `<span class="${eHoje ? 'hoje' : ''}${(ini + d - 1) % 7 === 0 ? ' dom' : ''}">${d}</span>`;
    }
    cal.innerHTML = `<div class="ck-mes"><button class="ib" data-m="-1" title="Mês anterior">‹</button><b>${nome.charAt(0).toUpperCase() + nome.slice(1)}</b><button class="ib" data-m="1" title="Próximo mês">›</button></div>
      <div class="ck-grade">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((x, i) => `<i${i === 0 ? ' class="dom"' : ''}>${x}</i>`).join('')}${cel}</div>
      <div class="tm-row"><button class="btn" data-a="pq" title="Inserir o calendário deste mês no quadro, como imagem que dá para mover e escrever por cima">Pôr no quadro</button></div>`;
    cal.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mes = new Date(a, m + +b.dataset.m, 1); desenha(); });
    cal.querySelector('[data-a="pq"]').onclick = async () => {
      const im = await calendarioImagem(a, m);
      window.dispatchEvent(new CustomEvent('giz:inserir-imagem', { detail: im }));
    };
  };
  calBtn.onclick = () => {
    cal.hidden = !cal.hidden; calBtn.classList.toggle('on', !cal.hidden);
    if (!cal.hidden) { const h = new Date(); mes = new Date(h.getFullYear(), h.getMonth(), 1); desenha(); }
  };
  el.querySelector('[data-a="cor"]').onclick = () => modelosPop(el);
  draggable(el, 'lousa.clockPos');
  show();
}
// calendário mensal como imagem (PNG), para inserir no quadro
export async function calendarioImagem(ano, mes, marcarHoje = true) {
  const W = 700, cab = 90, cw = 100, ch = 74, ini = new Date(ano, mes, 1).getDay(), dias = new Date(ano, mes + 1, 0).getDate();
  const linhas = Math.ceil((ini + dias) / 7), H = cab + 40 + linhas * ch + 10, hoje = new Date();
  const nome = new Date(ano, mes, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Segoe UI, Arial, sans-serif">
    <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="#fff" stroke="#c8c8c8" stroke-width="2"/>
    <text x="${W / 2}" y="58" text-anchor="middle" font-size="40" font-weight="700" fill="#1f1f1f">${nome.charAt(0).toUpperCase() + nome.slice(1)}</text>`;
  ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach((d, i) => { s += `<text x="${i * cw + cw / 2}" y="${cab + 26}" text-anchor="middle" font-size="22" font-weight="600" fill="${i === 0 ? '#c50f1f' : '#616161'}">${d}</text>`; });
  for (let d = 1; d <= dias; d++) {
    const k = ini + d - 1, cx = (k % 7) * cw, cy = cab + 40 + Math.floor(k / 7) * ch;
    const eHoje = marcarHoje && d === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
    s += `<rect x="${cx + 4}" y="${cy + 4}" width="${cw - 8}" height="${ch - 8}" rx="8" fill="${eHoje ? '#0f6cbd' : '#f5f5f5'}"/>`;
    s += `<text x="${cx + 14}" y="${cy + 34}" font-size="24" font-weight="${eHoje ? 700 : 500}" fill="${eHoje ? '#fff' : k % 7 === 0 ? '#c50f1f' : '#1f1f1f'}">${d}</text>`;
  }
  s += '</svg>';
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  await img.decode();
  const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2;
  const g = c.getContext('2d'); g.scale(2, 2); g.drawImage(img, 0, 0);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  return { blob, w: W, h: H };
}
function beep() {
  try {
    const a = new AudioContext();
    [0, 0.35, 0.7].forEach(t => {
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(a.destination);
      g.gain.setValueAtTime(0.25, a.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + t + 0.3);
      o.start(a.currentTime + t); o.stop(a.currentTime + t + 0.3);
    });
  } catch {}
}

// ---------------- fórmulas LaTeX (KaTeX → imagem PNG nítida) ----------------
let katexReady = null, cssEmbedded = null;
function loadKatex() {
  if (!katexReady) katexReady = new Promise((res, rej) => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'vendor/katex/katex.min.css'; document.head.appendChild(l);
    const s = document.createElement('script'); s.src = 'vendor/katex/katex.min.js'; s.onload = () => res(window.katex); s.onerror = rej;
    document.head.appendChild(s);
  });
  return katexReady;
}
// CSS do KaTeX com as fontes embutidas (necessário para desenhar a fórmula numa imagem)
async function embeddedCss() {
  if (cssEmbedded) return cssEmbedded;
  let css = await (await fetch('vendor/katex/katex.min.css')).text();
  const urls = [...new Set(css.match(/fonts\/[A-Za-z0-9_-]+\.woff2/g) || [])];
  for (const u of urls) {
    const b = await (await fetch('vendor/katex/' + u)).blob();
    const d = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
    css = css.split(u).join(d);
  }
  css = css.replace(/url\(fonts\/[^)]+\.(woff|ttf)\)\s*format\("[a-z]+"\),?/g, '');
  return (cssEmbedded = css);
}

// devolve { blob (PNG), w, h } em px de tela no tamanho de fonte `size`
export async function formulaImage(latex, color = '#000000', size = 40) {
  const katex = await loadKatex();
  const html = katex.renderToString(String(latex), { ...KATEX_LIM, displayMode: true, throwOnError: true, output: 'html' });
  const box = document.createElement('div');
  box.style.cssText = `position:fixed;left:-10000px;top:0;font-size:${size}px;color:${color};padding:6px 10px;display:inline-block`;
  box.innerHTML = html;
  document.body.appendChild(box);
  await document.fonts.ready;
  const r = box.getBoundingClientRect();
  const w = Math.ceil(r.width), h = Math.ceil(r.height);
  box.remove();
  const css = await embeddedCss();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${size}px;color:${color};padding:6px 10px;display:inline-block"><style>${css} .katex-display{margin:0}</style>${html}</div></foreignObject></svg>`;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const k = 3, c = document.createElement('canvas');
  c.width = w * k; c.height = h * k;
  const g = c.getContext('2d'); g.scale(k, k); g.drawImage(img, 0, 0);
  const blob = await new Promise(res => c.toBlob(res, 'image/png'));
  return { blob, w, h };
}

export async function validateLatex(latex) {
  const katex = await loadKatex();
  try { katex.renderToString(String(latex), { ...KATEX_LIM, throwOnError: true }); return null; } catch (e) { return e.message.replace(/^KaTeX parse error: /, ''); }
}
export async function previewLatex(el, latex) {
  const katex = await loadKatex();
  try { katex.render(String(latex || '\\;'), el, { ...KATEX_LIM, displayMode: true, throwOnError: false }); } catch {}
}

// ---------------- escrita à mão → texto (reconhecedor do Windows, offline) ----------------
export async function recognizeInk(strokes) {
  // strokes: [[x,y,x,y,...], ...] em px de tela (o reconhecedor espera a escala de quem escreveu)
  const r = await wfetch('/api/ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ strokes }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.erro || 'Falha no reconhecimento');
  return j.palavras || [];
}
