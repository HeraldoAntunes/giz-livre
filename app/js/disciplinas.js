// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Disciplinas (abas) da biblioteca de formas: todas vêm instaladas; o professor escolhe quais aparecem no menu.
// A escolha fica no navegador (localStorage 'lousa.abas'); a busca de formas procura em todas, inclusive nas ocultas.
import { GROUPS } from './shapelib.js';

const KEY = 'lousa.abas';
// grupos de áreas da tela de escolha (ids de shapes/*.js; id que não estiver aqui cai em "Outras")
const AREAS = [
  ['Gerais', ['fluxo', 'setas', 'icones']],
  ['Engenharias e cursos técnicos', ['quimica', 'hidra', 'saneamento', 'recursos-hidricos', 'topografia', 'lab', 'eletrica', 'eletronica', 'embarcados', 'mecanica', 'renov', 'computacao']],
  ['Ciências e matemática', ['matematica', 'estat', 'fisica', 'biologia']],
  ['Agrárias, alimentos e saúde', ['agronomia', 'alimentos', 'nutricao', 'edfisica']],
  ['Humanas, linguagens e artes', ['portugues', 'historia', 'geografia', 'filosofia', 'musica', 'empreendedorismo']],
];

function prefs() { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch { return {}; } }
export const abasOcultas = () => new Set(prefs().ocultas || []);
export const jaEscolheu = () => !!prefs().escolhido;
export const gruposVisiveis = () => { const o = abasOcultas(), v = GROUPS.filter(g => !o.has(g.id)); return v.length ? v : GROUPS; };
// áreas com as disciplinas visíveis, na ordem da tela de escolha: [[nomeDaÁrea, [grupos…]], …]
export const areasVisiveis = () => agruparPorArea(gruposVisiveis());
export function agruparPorArea(vis = GROUPS) {
  const porId = new Map(vis.map(g => [g.id, g])), usados = new Set(AREAS.flatMap(([, ids]) => ids));
  return [...AREAS.map(([n, ids]) => [n, ids.map(id => porId.get(id)).filter(Boolean)]),
    ['Outras', vis.filter(g => !usados.has(g.id))]].filter(([, gs]) => gs.length);
}
function salvar(ocultas) { try { localStorage.setItem(KEY, JSON.stringify({ ocultas: [...ocultas], escolhido: true })); } catch {} }

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const contar = g => g.secoes.reduce((a, [, l]) => a + l.length, 0);

// janela de escolha; primeira = tela "Quais áreas te interessam?" da primeira abertura. Devolve true se salvou.
export function escolherDisciplinas({ primeira = false } = {}) {
  return new Promise(resolve => {
    const ocultas = abasOcultas(), porId = new Map(GROUPS.map(g => [g.id, g]));
    const usados = new Set(AREAS.flatMap(([, ids]) => ids));
    const areas = [...AREAS.map(([n, ids]) => [n, ids.filter(id => porId.has(id))]),
      ['Outras', GROUPS.filter(g => !usados.has(g.id)).map(g => g.id)]].filter(([, ids]) => ids.length);
    const total = GROUPS.reduce((a, g) => a + contar(g), 0);
    const d = document.createElement('dialog');
    d.className = 'disc-dlg';
    d.innerHTML = `<h3>${primeira ? 'Quais áreas te interessam?' : 'Áreas das formas'}</h3>
      <p class="disc-txt">${primeira ? 'O Giz Livre traz' : 'Estão instaladas'} <b>${total.toLocaleString('pt-BR')} formas</b> em ${GROUPS.length} áreas, para aula, trabalho, estudo ou o que você precisar.
        Marque as que devem aparecer no menu Formas; as outras ficam guardadas e a busca continua achando tudo.
        Dá para mudar quando quiser em <b>⋯ → Áreas das formas</b>.</p>
      <div class="disc-areas">${areas.map(([n, ids]) => `<fieldset><legend><label><input type="checkbox" data-area> ${esc(n)}</label></legend>
        ${ids.map(id => { const g = porId.get(id); return `<label class="disc-item"><input type="checkbox" data-id="${id}" ${ocultas.has(id) ? '' : 'checked'}> ${esc(g.nome)} <small>${contar(g)}</small></label>`; }).join('')}</fieldset>`).join('')}</div>
      <div class="acts"><button class="btn" data-a="todas">Marcar todas</button><span style="flex:1"></span>
        ${primeira ? '' : '<button class="btn" data-a="x">Cancelar</button>'}<button class="btn primary" data-a="ok">${primeira ? 'Começar' : 'Salvar'}</button></div>`;
    document.body.appendChild(d);
    const caixas = [...d.querySelectorAll('[data-id]')];
    const syncArea = () => d.querySelectorAll('fieldset').forEach(f => {
      const cs = [...f.querySelectorAll('[data-id]')], a = f.querySelector('[data-area]');
      a.checked = cs.every(c => c.checked); a.indeterminate = !a.checked && cs.some(c => c.checked);
    });
    d.querySelectorAll('[data-area]').forEach(a => a.onchange = () => { a.closest('fieldset').querySelectorAll('[data-id]').forEach(c => c.checked = a.checked); });
    caixas.forEach(c => c.onchange = syncArea);
    syncArea();
    const fecha = v => { d.close(); d.remove(); resolve(v); };
    d.querySelector('[data-a="todas"]').onclick = () => { caixas.forEach(c => c.checked = true); syncArea(); };
    d.querySelector('[data-a="x"]')?.addEventListener('click', () => fecha(false));
    d.addEventListener('cancel', e => { e.preventDefault(); if (primeira) { salvar(ocultas); fecha(true); } else fecha(false); });
    d.querySelector('[data-a="ok"]').onclick = () => {
      const fora = caixas.filter(c => !c.checked).map(c => c.dataset.id);
      salvar(fora.length === caixas.length ? [] : fora);   // nenhuma marcada = todas
      fecha(true);
    };
    d.showModal();
  });
}
