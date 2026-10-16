// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Agentes de IA: painel do interruptor (níveis, registro) e chegada do conteúdo que o agente deixou "pendente".
// Fórmula e gráfico dependem do navegador (KaTeX, compilador de funções): o servidor grava um item `pendente` e o
// editor o troca pelo item real quando o quadro abre, sem passo de Desfazer.
import { compile, fitFrame, faixaY, plotStrokes, axesStrokes } from './plot.js';
import { modelo as fnModelo, valoresPadrao } from './fnmodels.js';
import * as R from './render.js';

// a mesma reserva do server.py (SRC_RESERVA): forma da biblioteca gravada pelo agente, ainda sem o desenho
export const SRC_RESERVA = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E';
const COR_ERRO = '#e81224';

export const temPendentes = items => items.some(i => i?.type === 'pendente' || (i?.lib && i.src === SRC_RESERVA));

// item que não pôde ser gerado: vira texto vermelho com o código, no mesmo lugar, para nada se perder
const textoErro = (it, texto) => ({ id: it.id, type: 'text', x: it.x, y: it.y, w: Math.max(it.w || 0, 240), text: texto,
  color: COR_ERRO, size: 18, font: 'Consolas' });

function grafico(it, { newId, escuro, medir }) {
  const m = it.modelo ? fnModelo(it.modelo) : null;
  if (it.modelo && !m) throw new Error('modelo inexistente: ' + it.modelo);
  const expr = m ? m.expr : String(it.funcao || '');
  const f = compile(expr, m ? { params: m.params } : {});
  const vals = m ? { ...valoresPadrao(m), ...(it.parametros || {}) } : {};
  const [x0, x1] = it.faixa;
  const yr = it.faixa_y ? [...it.faixa_y] : faixaY(f, [x0, x1], vals);
  if (!it.faixa_y && m?.y) { yr[0] = Math.min(yr[0], m.y[0]); yr[1] = Math.max(yr[1], m.y[1]); }
  const fr = fitFrame({ x: it.x, y: it.y, w: it.w, h: it.h }, [x0, x1], yr);
  const curva = plotStrokes(f, { ...fr, color: it.color, width: 3, id: newId, valores: vals }).map(s => ({ ...s, plot: expr }));
  if (!curva.length) throw new Error('a função não tem pontos visíveis nesse intervalo');
  const novos = [...curva];
  if (it.eixos !== false) {
    novos.unshift(...axesStrokes(fr, { color: escuro ? '#ffffff' : '#000000', width: 1.6, id: newId, rotulos: true, size: 13,
      font: 'Segoe UI', medir, eixoX: m?.eixoX, eixoY: m?.eixoY }));
  }
  if (it.rotulo) {   // "y = …" perto do fim da curva, como na janela Plotar
    const ult = curva[curva.length - 1].pts, lx = ult[ult.length - 3], ly = ult[ult.length - 2], size = 26;
    const text = 'y = ' + expr.replace(/\*/g, '·').replace(/-/g, '−').replace(/\^2(?![\d.,])/g, '²').replace(/\^3(?![\d.,])/g, '³');
    novos.push({ id: newId(), type: 'text', x: lx + 8, y: ly - size * 1.4, text, color: it.color, size, font: 'Segoe Script',
      w: (medir ? medir(text, size, 'Segoe Script') : text.length * size * 0.6) + 4 });
  }
  const grp = newId();
  return novos.map(i => ({ ...i, grp }));
}

// Gera os itens reais. deps: { validar(latex) → mensagem|null, formula(latex, cor, 40) → {src, w, h},
// formaSrc(lib, tint) → src|null, newId, escuro, medir(texto, size), layout (páginas do quadro) }. Devolve { trocas: Map(id → [itens]), chegaram, erros }.
export async function hidratarPendentes(items, deps) {
  const trocas = new Map();
  let chegaram = 0, erros = 0;
  for (const it of items) {
    if (it?.lib && it.src === SRC_RESERVA) {
      const src = deps.formaSrc?.(it.lib, it.tint);
      if (src) trocas.set(it.id, [{ ...it, src }]);
      continue;
    }
    if (it?.type !== 'pendente') continue;
    chegaram++;
    try {
      if (it.gera === 'latex') {
        const ruim = await deps.validar(it.latex);
        if (ruim) { erros++; trocas.set(it.id, [{ ...textoErro(it, it.latex), agente_erro: ruim }]); continue; }
        const im = await deps.formula(it.latex, it.color || '#000000', 40);
        const k = (it.size || 40) / 40;
        trocas.set(it.id, [{ id: it.id, type: 'image', latex: it.latex, color: it.color || '#000000', src: im.src,
          x: it.x, y: it.y, w: im.w * k, h: im.h * k, ph: im.h }]);
      } else if (it.gera === 'plot') {
        trocas.set(it.id, grafico(it, deps));
      } else {
        throw new Error('conteúdo desconhecido');
      }
    } catch (e) {
      erros++;
      const cod = it.gera === 'plot' ? `Gráfico não gerado (${e.message}): y = ${it.funcao || it.modelo}` : String(it.latex || '');
      trocas.set(it.id, [{ ...textoErro(it, cod), agente_erro: e.message }]);
    }
  }
  descerOQueVemDepois(items, trocas, deps.layout);
  return { trocas, chegaram, erros };
}

// O servidor estima a altura da fórmula sem medir. Se a imagem real saiu mais alta, os itens do agente que vêm depois,
// na mesma página, descem a diferença (o "fluxo de caderno" continua certo). Itens do professor nunca se movem.
function descerOQueVemDepois(items, trocas, layout) {
  const L = layout?.mode === 'pages' ? layout : null;
  const pagina = y => L ? Math.floor((y + L.gap / 2) / (L.h + L.gap)) : 0;
  const atual = new Map(items.filter(Boolean).map(i => [i.id, trocas.get(i.id) || [i]]));
  const doAgente = id => String(id).startsWith('ag');
  const cresceram = items.filter(p => p?.type === 'pendente' && doAgente(p.id) && trocas.get(p.id)?.length === 1)
    .map(p => ({ p, d: trocas.get(p.id)[0].h - p.h })).filter(c => c.d > 0.5).sort((a, b) => a.p.y - b.p.y);
  for (const { p, d } of cresceram) {
    const limite = p.y + p.h - 0.5, pg = pagina(p.y);
    for (const [id, lista] of atual) {
      if (id === p.id || !doAgente(id)) continue;
      const topo = Math.min(...lista.map(i => R.bbox(i).y));
      if (topo >= limite && pagina(topo) === pg) atual.set(id, lista.map(i => R.transformItem(i, 0, d)));
    }
  }
  for (const i of items) if (i && atual.get(i.id)?.[0] !== (trocas.get(i.id) || [i])[0]) trocas.set(i.id, atual.get(i.id));
}

// troca os pendentes pelos itens reais numa lista (o mesmo array volta se nada mudou: histórico intacto)
export function aplicarTrocas(items, trocas) {
  if (!items.some(i => trocas.has(i?.id))) return items;
  return items.flatMap(i => trocas.get(i?.id) || [i]);
}

// ---------------- painel "Permitir agentes de IA" ----------------
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DESCR = {
  1: 'lista e lê os quadros e a biblioteca de formas; não grava nada',
  2: 'cria quadros novos e só mexe nos quadros que ele mesmo criou',
  3: 'também acrescenta conteúdo em quadros seus que estejam fechados (nunca apaga)',
};

// wfetch: o mesmo do api.js (leva o token da página). O token de agente nunca passa pela página.
export async function painelAgentes(wfetch, toast) {
  const ler = async () => { const r = await wfetch('/api/agentes'); if (!r.ok) throw new Error('O servidor não respondeu'); return r.json(); };
  let st;
  try { st = await ler(); } catch (e) { return toast(e.message, 5000); }
  const d = document.createElement('dialog');
  d.className = 'agentes';
  d.style.width = 'min(620px, 94vw)';
  const desenha = () => {
    d.innerHTML = `<h3>Agentes de IA <small style="font-weight:400;color:#666">(experimental)</small></h3>
      <label class="tb-line"><input type="checkbox" data-a="ligado" ${st.ligado ? 'checked' : ''}> <b>Permitir agentes de IA</b></label>
      <p class="tb-note">Deixa um agente de IA (um cliente compatível com MCP) preparar quadros neste computador
        pelo servidor <code>mcp/giz_livre_mcp.py</code>. Desligado, nenhum agente acessa o Giz Livre. O agente nunca exclui quadros
        e não grava num quadro aberto na tela.</p>
      <div class="ag-niveis" ${st.ligado ? '' : 'style="opacity:.5"'}>${[1, 2, 3].map(n => `<label class="tb-line">
        <input type="radio" name="agNivel" value="${n}" ${st.nivel === n ? 'checked' : ''} ${st.ligado ? '' : 'disabled'}>
        <span><b>${n}. ${esc(st.niveis[n])}</b>: ${DESCR[n]}</span></label>`).join('')}</div>
      <h4 style="margin:14px 0 4px">O que o agente fez</h4>
      <div class="tb-note" style="max-height:140px;overflow:auto;font-family:Consolas,monospace;white-space:pre">${
        st.registro.length ? st.registro.map(l => esc(l.replace(/\t/g, '  '))).join('\n') : 'Nada registrado ainda.'}</div>
      <div class="acts"><button class="btn primary" data-a="x">Fechar</button></div>`;
    const grava = async (ligado, nivel) => {
      try {
        const r = await wfetch('/api/agentes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ligado, nivel }) });
        if (!r.ok) throw new Error();
        st = await ler();
      } catch { st = { ...st }; }
      desenha();
    };
    d.querySelector('[data-a="ligado"]').onchange = e => grava(e.target.checked, st.nivel || 2);
    d.querySelectorAll('[name="agNivel"]').forEach(r => r.onchange = () => grava(true, +r.value));
    d.querySelector('[data-a="x"]').onclick = () => { d.close(); d.remove(); };
  };
  desenha();
  d.addEventListener('cancel', () => d.remove());
  document.body.appendChild(d);
  d.showModal();
}
