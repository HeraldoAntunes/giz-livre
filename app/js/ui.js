// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Utilidades de interface: ícones, aviso, diálogos e popover
import { ICON } from './icons.js';
import { wfetch } from './api.js';

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

export function dialog(html, onOpen) {
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

// "Sobre": cartão organizado só com o que é útil
const RELEASES = 'https://github.com/HeraldoAntunes/giz-livre/releases/latest';
// antesDeAtualizar: grava o quadro aberto antes de o instalador fechar o programa
export function aboutBox(version, antesDeAtualizar = null) {
  const lin = (rot, txt) => `<div class="sb-l"><dt>${rot}</dt><dd>${txt}</dd></div>`;
  const promessa = infoBox('Sobre o Giz Livre', `<div class="sobre">
    <div class="sb-cab"><img src="icon.svg" alt="" width="56" height="56"><div><b>Giz Livre <img class="sb-br" src="bandeira-brasil.svg" alt="Brasil" title="Feito no Brasil" width="20" height="14"></b><span>versão ${esc(version)}</span>
      <small>Lousa digital livre e offline, para dar aula com mesa digitalizadora.</small></div></div>
    <dl>
      ${lin('Autor', '© 2026 Heraldo Antunes')}
      ${lin('Licença', 'Software livre, licença MIT: uso, cópia, modificação e distribuição gratuitos, mantendo o aviso de licença.')}
      ${lin('Privacidade', 'Funciona sem internet. Nada sai do computador: não há conta, anúncio nem coleta de dados. A internet só é usada quando você clica em Procurar versão nova, e esse pedido ao GitHub não leva seus quadros nem dados pessoais.')}
      ${lin('Seus quadros', 'Ficam em <i>Documentos\\Giz Livre\\quadros</i>. Para cópia de segurança ou para levar a outro computador, use <b>Levar quadros</b>, na galeria.')}
      ${lin('Código', 'github.com/HeraldoAntunes/giz-livre')}
      ${lin('Atualizações', `Esta é a versão ${esc(version)}. <button class="btn" data-atu>Procurar versão nova</button>
        <div class="sb-atu" aria-live="polite"></div><small class="sb-nota">Só consulta o GitHub quando você clica.</small>`)}
      ${lin('Registro', 'Programa de computador registrado no INPI sob o nº BR 51 2026 009384-8.')}
      ${lin('Como foi feito', 'Com apoio de assistentes de programação de inteligência artificial, usados como ferramenta: a concepção, as decisões, a revisão e os testes são do autor.')}
      ${lin('Componentes', 'pdf.js (Apache 2.0, com OpenJPEG, BSD), KaTeX (MIT) com as fontes KaTeX (SIL OFL 1.1) e ícones Fluent UI (MIT); contornos de mapas do Natural Earth (domínio público); programa empacotado com Python (PSF) e PyInstaller (GPL com exceção e Apache 2.0); OpenSSL (Apache 2.0) para a atualização. Textos completos na pasta <i>licencas</i>. As fontes de texto usadas são as instaladas no computador.')}
      ${lin('Desinstalar', 'Menu Iniciar → "Desinstalar o Giz Livre". Os quadros são mantidos.')}
    </dl>
    <p class="sb-aviso">Fornecido "no estado em que se encontra", sem garantia de qualquer tipo. As marcas citadas pertencem aos seus donos; o Giz Livre é um projeto independente, sem vínculo com elas.</p>
  </div>`);
  const d = [...document.querySelectorAll('dialog[open]')].pop();
  if (d) ligarAtualizacao(d, antesDeAtualizar);
  return promessa;
}

// "Procurar versão nova": o próprio programa responde (mais recente, mais nova que a publicada ou versão disponível)
// e, na versão instalada, baixa, confere e instala quando o professor pede
function ligarAtualizacao(d, antes) {
  const bt = d.querySelector('[data-atu]'), saida = d.querySelector('.sb-atu');
  if (!bt || !saida) return;
  const pagina = url => `<a href="${esc(url || RELEASES)}" target="_blank" rel="noopener noreferrer">Abrir a página de downloads</a>`;
  const pede = async rota => {
    const r = await wfetch(rota, { method: 'POST' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erro || 'Não deu para concluir agora.');
    return j;
  };
  // depois de mandar instalar: o Edge nem sempre deixa a página fechar a janela, então ela fica esperando a versão nova
  // responder; se não vier em 3 minutos, diz que não terminou e como seguir (antes ficava em "Instalando" para sempre)
  const acompanhar = async (versao, log) => {
    const fim = Date.now() + 180000;
    while (Date.now() < fim) {
      await new Promise(ok => setTimeout(ok, 4000));
      try {
        const i = await (await fetch('/api/info', { cache: 'no-store' })).json();
        if (i.versao === versao) {
          saida.innerHTML = `<b class="sb-ok">✓ Versão ${esc(versao)} instalada.</b> O Giz Livre abriu numa janela nova; esta se fecha sozinha (se não fechar, pode fechar).`;
          return;
        }
      } catch { /* programa fechado durante a instalação: espera */ }
    }
    saida.innerHTML = `<span class="sb-erro">A instalação não terminou em 3 minutos.</span> Feche esta janela, baixe o instalador
      pela página e rode à mão; os quadros ficam como estão. ${pagina()}${log ? `<br><small>O registro da tentativa ficou em ${esc(log)}.</small>` : ''}`;
  };
  bt.onclick = async () => {
    bt.hidden = true;
    saida.innerHTML = '<span class="sb-espera">Procurando no GitHub…</span>';
    let j;
    try { j = await pede('/api/atualizacao/verificar'); } catch (e) {
      saida.innerHTML = `<span class="sb-erro">${esc(e.message)}</span> ${pagina()}`; bt.hidden = false; bt.textContent = 'Tentar de novo'; return;
    }
    if (!j.nova) {
      saida.innerHTML = j.mais_nova_aqui
        ? `<b class="sb-ok">Esta versão (${esc(j.atual)}) é mais nova que a publicada (${esc(j.ultima)}).</b>`
        : `<b class="sb-ok">✓ Você está na versão mais recente (${esc(j.atual)}).</b>`;
      return;
    }
    saida.innerHTML = `<b>Versão ${esc(j.ultima)} disponível</b> (você tem a ${esc(j.atual)}).
      ${j.notas ? `<div class="sb-notas">${esc(j.notas)}</div>` : ''}
      <div class="sb-acoes">${j.pode_instalar ? '<button class="btn primary" data-inst>Baixar e instalar</button>' : ''} ${pagina(j.pagina)}</div>
      ${j.pode_instalar ? '' : '<small>Na versão portátil, baixe o zip novo e troque a pasta; os quadros ficam na pasta quadros.</small>'}`;
    const bi = saida.querySelector('[data-inst]');
    if (!bi) return;
    bi.onclick = async () => {
      bi.disabled = true;
      saida.querySelector('.sb-acoes').insertAdjacentHTML('afterend', '<p class="sb-espera">Salvando o quadro, baixando e conferindo o arquivo… pode levar um minuto.</p>');
      try {
        await antes?.();
        const r = await pede('/api/atualizacao/instalar');
        saida.innerHTML = `<b class="sb-ok">Instalando a versão ${esc(r.versao)}.</b> O Giz Livre vai fechar e abrir de novo sozinho; os quadros ficam como estão.`;
        setTimeout(() => window.close(), 2500);
        acompanhar(r.versao, r.log);
      } catch (e) {
        saida.querySelector('.sb-espera')?.remove();
        bi.disabled = false;
        saida.insertAdjacentHTML('beforeend', `<p class="sb-erro">${esc(e.message)}</p>`);
      }
    };
  };
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
