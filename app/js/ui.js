// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Utilidades de interface: ícones, aviso, diálogos e popover
import { ICON } from './icons.js';

export function fillIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    if (!el.firstChild) el.innerHTML = ICON[el.dataset.icon] || '';
  });
}

let toastTimer;
export function toast(msg, ms = 2600, act = null) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  if (act) {
    const b = document.createElement('button');
    b.className = 'toast-btn'; b.textContent = act.label;
    b.onclick = () => { t.hidden = true; act.fn(); };
    t.appendChild(b);
  }
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), ms);
}

function dialog(html, onOpen) {
  return new Promise(resolve => {
    const d = document.createElement('dialog');
    d.innerHTML = html;
    document.body.appendChild(d);
    const close = v => { d.close(); d.remove(); resolve(v); };
    d.addEventListener('cancel', e => { e.preventDefault(); close(null); });
    onOpen?.(d, close);
    d.showModal();
  });
}

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function askText(title, value = '') {
  return dialog(`<h3>${esc(title)}</h3><input type="text" value="${esc(value)}">
    <div class="acts"><button class="btn" data-a="0">Cancelar</button><button class="btn primary" data-a="1">OK</button></div>`,
    (d, close) => {
      const inp = d.querySelector('input');
      setTimeout(() => { inp.focus(); inp.select(); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') close(inp.value.trim()); });
      d.querySelector('[data-a="0"]').onclick = () => close(null);
      d.querySelector('[data-a="1"]').onclick = () => close(inp.value.trim());
    });
}

export function confirmBox(title, msg, okLabel = 'OK', danger = false) {
  return dialog(`<h3>${esc(title)}</h3><div>${esc(msg)}</div>
    <div class="acts"><button class="btn" data-a="0">Cancelar</button>
    <button class="btn primary" data-a="1" ${danger ? 'style="background:#c50f1f;border-color:#c50f1f"' : ''}>${esc(okLabel)}</button></div>`,
    (d, close) => {
      d.querySelector('[data-a="0"]').onclick = () => close(false);
      d.querySelector('[data-a="1"]').onclick = () => close(true);
    });
}

// várias opções (botões empilhados); devolve o valor escolhido ou null (Cancelar/Esc)
export function choiceBox(title, msg, options) {
  return dialog(`<h3>${esc(title)}</h3><div>${esc(msg)}</div>
    <div class="choices">${options.map(([v, label, danger], i) => `<button class="btn${danger ? ' danger' : i === 0 ? ' primary' : ''}" data-v="${i}">${esc(label)}</button>`).join('')}</div>
    <div class="acts"><button class="btn" data-a="0">Cancelar</button></div>`,
    (d, close) => {
      d.querySelector('[data-a="0"]').onclick = () => close(null);
      d.querySelectorAll('[data-v]').forEach(b => b.onclick = () => close(options[+b.dataset.v][0]));
    });
}

export function aboutBox(version) {
  return infoBox('Sobre o Giz Livre', `
    <p style="margin:0 0 8px"><b>Giz Livre ${version}</b>: lousa livre e offline para dar aula com mesa digitalizadora.</p>
    <p style="margin:0 0 8px">© 2026 Heraldo Antunes. Software livre sob a <b>licença MIT</b>: uso, cópia, modificação e
    distribuição gratuitos, mantendo o aviso de licença.</p>
    <p style="margin:0 0 8px;font-size:12px;color:#616161">Fornecido "no estado em que se encontra", <b>sem garantia de qualquer
    tipo</b>. Os autores não se responsabilizam por perda de dados, danos ou mau uso. Faça backup da pasta <i>quadros</i>.
    Projeto independente, sem vínculo com Microsoft, Wacom ou outras marcas citadas.</p>
    <p style="margin:0 0 8px;font-size:12px;color:#616161"><b>Desinstalar:</b> Menu Iniciar → "Desinstalar o Giz Livre", ou
    Configurações do Windows → Aplicativos → Giz Livre. Os quadros (Documentos\\Giz Livre\\quadros) são mantidos.</p>
    <p style="margin:0;font-size:12px;color:#616161">Usa pdf.js (Apache 2.0, com OpenJPEG, BSD), KaTeX (MIT) com as fontes KaTeX (SIL OFL 1.1) e Fluent UI System
    Icons (MIT); textos completos na pasta <i>licencas</i>.
    Funciona sem internet; nada é enviado para fora do computador.</p>`);
}

export function infoBox(title, html) {
  return dialog(`<h3>${esc(title)}</h3>${html}<div class="acts"><button class="btn primary">Fechar</button></div>`,
    (d, close) => { d.querySelector('.acts button').onclick = () => close(true); });
}

// popover único reaproveitado; ancorado a um elemento
const popEl = () => document.getElementById('pop');
let popOwner = null;
export function showPop(anchor, html, setup, where = 'below') {
  const p = popEl();
  if (!p.hidden && popOwner === anchor) { hidePop(); return null; }
  p.innerHTML = html;
  p.className = 'pop';
  p.hidden = false;
  popOwner = anchor;
  fillIcons(p);
  setup?.(p);
  const r = anchor.getBoundingClientRect(), pr = p.getBoundingClientRect();
  let x, y;
  if (where === 'right') { x = r.right + 8; y = r.top + r.height / 2 - pr.height / 2; }
  else if (where === 'above') { x = r.left + r.width / 2 - pr.width / 2; y = r.top - pr.height - 8; }
  else { x = r.left + r.width / 2 - pr.width / 2; y = r.bottom + 8; }
  x = Math.max(8, Math.min(innerWidth - pr.width - 8, x));
  y = Math.max(8, Math.min(innerHeight - pr.height - 8, y));
  p.style.left = x + 'px';
  p.style.top = y + 'px';
  return p;
}
export function hidePop() { const p = popEl(); if (p) p.hidden = true; popOwner = null; }
export const popOpen = () => !popEl().hidden;

document.addEventListener('pointerdown', e => {
  const p = popEl();
  if (!p || p.hidden) return;
  if (p.contains(e.target) || (popOwner && popOwner.contains(e.target))) return;
  hidePop();
}, true);
