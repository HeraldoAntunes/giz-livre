// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Ajuda dentro do programa: central de ajuda por temas (com figura feita dos próprios botões e "mostrar na tela") e
// tour da primeira vez, com balões que apontam cada barra. Tudo offline; a escolha de rever ou desligar o tour fica
// guardada em lousa.ajuda.
import { ICON } from './icons.js';
import { esc } from './ui.js';

const CHAVE = 'lousa.ajuda';
function estado() { try { return JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch { return {}; } }
function guarda(m) { try { localStorage.setItem(CHAVE, JSON.stringify({ ...estado(), ...m })); } catch {} }

// figura: botões do próprio programa (ícones reais), com o que importa em destaque
const ic = n => ICON[n] || '';
const caneta = cor => `<span class="aj-pen" style="background:${cor}"></span>`;

export const TEMAS = [
  { id: 'escrever', titulo: 'Escrever e marcar', icone: 'pen', alvo: '#inkbar .pen[data-tool="pen0"]',
    figura: [caneta('#252423'), caneta('#e81224'), caneta('#0063b1'), caneta('#107c10'), ['hlPen'], ['laser']], destaque: 0,
    passos: ['Toque numa caneta para escrever (teclas 1 a 4).', 'Toque de novo na mesma caneta para trocar a cor, a espessura e o estilo.',
      'Marca-texto (H) e ponteiro laser (K) destacam sem sujar o quadro; o laser some sozinho.'] },
  { id: 'apagar', titulo: 'Apagar e desfazer', icone: 'eraser', alvo: '#inkbar [data-tool="eraser"]',
    figura: [['eraser'], ['undo'], ['redo']], destaque: 0,
    passos: ['Borracha (E) ou o botão lateral da caneta.', 'Toque de novo na borracha para o tamanho e para apagar o traço inteiro ou só onde passar.',
      'Backspace sem nada selecionado apaga o último item desenhado.', 'Ctrl+Z desfaz e Ctrl+Y refaz, quantas vezes precisar.'] },
  { id: 'selecionar', titulo: 'Selecionar, mover e girar', icone: 'lasso', alvo: '#inkbar [data-tool="lasso"]',
    figura: [['lasso'], ['select'], ['group'], ['duplicate']], destaque: 0,
    passos: ['Laço (L): contorne o que quer pegar. Seleção (V): toque ou arraste um retângulo.', 'Arraste para mover. A alça redonda de cima gira; o canto de baixo muda o tamanho.',
      'Com várias coisas selecionadas, Ctrl+G agrupa e Ctrl+Shift+G desagrupa.', 'A barra que aparece em cima da seleção tem cor, duplicar, copiar e excluir.'] },
  { id: 'criar', titulo: 'Texto, notas e formas', icone: 'shapes', alvo: '#createbar',
    figura: [['text', 'Texto'], ['note', 'Nota'], ['shapes', 'Formas'], ['image', 'Imagem']], destaque: 1,
    passos: ['Use a coluna da esquerda. Texto (T): toque no quadro e digite.', 'Nota: a letra nasce em tamanho legível; A− e A+, na barra da seleção, mudam o tamanho e a nota cresce junto.',
      'Formas: o catálogo abre na Vitrine das suas áreas; escolha a disciplina ou use a busca. Mais rápido: aperte / e digite o nome da forma.', 'Legendas: com uma forma que tem rótulos selecionada, o botão Legendas da barra da seleção esconde os textos do desenho, para o exercício de completar; toque de novo para mostrar.', 'Imagem: pelo botão ou colando com Ctrl+V.'] },
  { id: 'slides', titulo: 'Slides de PowerPoint e PDF', icone: 'library', alvo: '#createbar [data-create="pdf"]',
    figura: [['library', 'PDF/Slides'], ['enquadrar', 'Enquadrar']], destaque: 0,
    passos: ['Botão PDF/Slides na coluna da esquerda, ou arraste o arquivo para o quadro.', 'Escolha as páginas; cada slide vira uma página para escrever por cima.',
      'Enquadrar slide (F) devolve a página ao melhor tamanho na tela; F de novo deixa um pouco menor, com folga.', 'Até 200 slides roda liso em qualquer computador.'] },
  { id: 'apresentar', titulo: 'Apresentar a aula', icone: 'play', alvo: '#bPresent',
    figura: [['play', 'Apresentar'], ['lupa', 'Lupa']], destaque: 0,
    passos: ['Botão Apresentar ou F5: tela cheia, só com a mini-bandeja.', 'Setas ou um passador de slides mudam de página. B ou ponto deixam a tela preta.',
      'N cria uma página em branco depois da atual. Z liga a lupa; − e + mudam quanto ela amplia.', 'Esc sai da apresentação.'] },
  { id: 'paginas', titulo: 'Páginas, zoom e mover', icone: 'zoomIn', alvo: '.bar.zoom',
    figura: [['zoomOut'], ['zoomIn'], ['fit'], ['lupa']], destaque: 2,
    passos: ['PageDown e PageUp passam as páginas; a barra de baixo cria, duplica, exclui e mostra todas.', 'Ctrl + roda do mouse muda o zoom; Ctrl+0 ajusta à tela.',
      'Espaço + arrastar, a ferramenta Mão (M) ou o botão do meio do mouse movem o quadro.'] },
  { id: 'folha', titulo: 'Folha e fundo', icone: 'paper', alvo: '#tPaper',
    figura: [['paper', 'Folha']], destaque: 0,
    passos: ['Botão Folha: quadriculada, milimetrada, pautada, plano cartesiano e dezenas de folhas técnicas.', 'Lousa verde: a tinta preta aparece branca, como giz.',
      'Trocar a folha também se desfaz com Ctrl+Z.'] },
  { id: 'ferramentas', titulo: 'Ferramentas do professor', icone: 'tools', alvo: '#tTools',
    figura: [['tools', 'Ferramentas'], ['fx', 'Função'], ['clock', 'Cronômetro']], destaque: 0,
    passos: ['Botão Ferramentas: lupa de escrita, transferidor, compasso, cortina, holofote, cronômetro e relógio.', 'Plotar função: digite x^2 - 4 e o gráfico aparece no plano cartesiano.',
      'Fórmula: escreva em LaTeX e ela entra pronta no quadro.'] },
  { id: 'salvar', titulo: 'Salvar, exportar e backup', icone: 'print', alvo: '#bMenu',
    figura: [['more', 'Menu'], ['print', 'Imprimir']], destaque: 0,
    passos: ['O quadro se salva sozinho enquanto você escreve.', 'Menu … do quadro: exportar PDF, imprimir, exportar imagem ou o arquivo .lousa.',
      'Backup ou outro computador: botão Levar quadros, na galeria, guarda todos num arquivo .zip e traz de volta sem apagar nada.'] },
  { id: 'caneta', titulo: 'Mesa digitalizadora', icone: 'pen', alvo: '#bMenu',
    figura: [['pen', 'Caneta e escrita']], destaque: 0,
    passos: ['Ligue o Windows Ink no programa da mesa (no driver da Wacom, por exemplo).', 'Menu … → Caneta e escrita: teste da pressão, botão lateral e estabilizador contra tremido.',
      'Sem o Windows Ink a mesa desenha como mouse, sem pressão; o painel Caneta e escrita mostra se o último traço trouxe pressão.',
      'Os atalhos podem ir para as teclas da mesa (ExpressKeys), no driver dela.'] },
];

function figura(t) {
  return `<div class="aj-fig">${t.figura.map((f, i) => {
    const corpo = typeof f === 'string' ? f : `${ic(f[0])}${f[1] ? `<small>${esc(f[1])}</small>` : ''}`;
    return `<span class="aj-bt${i === t.destaque ? ' on' : ''}">${corpo}</span>`;
  }).join('')}</div>`;
}

// destaca de verdade um controle da tela por alguns segundos (anel pulsando em volta dele)
export function mostrarNaTela(seletor) {
  const el = document.querySelector(seletor);
  if (!el || !el.getClientRects().length) return false;
  const r = el.getBoundingClientRect(), anel = document.createElement('div');
  anel.className = 'aj-anel';
  Object.assign(anel.style, { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' });
  document.body.appendChild(anel);
  setTimeout(() => anel.remove(), 3200);
  return true;
}

let painel = null;
export function ajudaAberta() { return !!painel; }
export function fecharAjuda() { painel?.remove(); painel = null; }

// central de ajuda: painel à direita, sem bloquear o quadro (dá para ler e experimentar ao mesmo tempo)
export function abrirAjuda({ tema = null, atalhos = null, tour = null } = {}) {
  fecharAjuda();
  painel = document.createElement('div');
  painel.className = 'aj-painel';
  painel.setAttribute('role', 'dialog');
  painel.setAttribute('aria-label', 'Ajuda do Giz Livre');
  const lista = () => `<div class="aj-cab"><b>Ajuda</b><button class="ib" data-x title="Fechar (Esc)">${ic('close')}</button></div>
    <div class="aj-temas">${TEMAS.map(t => `<button data-t="${t.id}">${ic(t.icone)}<span>${esc(t.titulo)}</span></button>`).join('')}
      <button data-k>${ic('keyboard')}<span>Atalhos de teclado</span></button></div>
    <div class="aj-pe"><button class="btn" data-tour>Rever o tour</button>
      <label><input type="checkbox" data-auto ${estado().tourDesligado ? '' : 'checked'}> Mostrar o tour no primeiro quadro</label></div>`;
  const umTema = t => `<div class="aj-cab"><button class="ib" data-v title="Voltar aos temas">${ic('back')}</button><b>${esc(t.titulo)}</b>
      <button class="ib" data-x title="Fechar (Esc)">${ic('close')}</button></div>
    ${figura(t)}<ol class="aj-passos">${t.passos.map(p => `<li>${esc(p)}</li>`).join('')}</ol>
    <div class="aj-pe"><button class="btn" data-m>Mostrar na tela</button></div>`;
  const pinta = id => {
    const t = TEMAS.find(x => x.id === id);
    painel.innerHTML = t ? umTema(t) : lista();
    painel.querySelectorAll('[data-x]').forEach(b => b.onclick = fecharAjuda);
    painel.querySelector('[data-v]')?.addEventListener('click', () => pinta(null));
    painel.querySelectorAll('[data-t]').forEach(b => b.onclick = () => pinta(b.dataset.t));
    painel.querySelector('[data-k]')?.addEventListener('click', () => atalhos?.());
    painel.querySelector('[data-tour]')?.addEventListener('click', () => { fecharAjuda(); tour?.(); });
    painel.querySelector('[data-auto]')?.addEventListener('change', e => guarda({ tourDesligado: !e.target.checked }));
    painel.querySelector('[data-m]')?.addEventListener('click', () => {
      if (!mostrarNaTela(t.alvo)) painel.querySelector('[data-m]').textContent = 'Não aparece agora (barra recolhida?)';
    });
  };
  pinta(tema);
  document.body.appendChild(painel);
  return painel;
}

// ---------------- tour da primeira vez ----------------
export const PASSOS_TOUR = [
  ['#inkbar', 'Canetas', 'Toque numa caneta para escrever. Toque de novo para cor, espessura e estilo. Teclas 1 a 4.'],
  ['#inkbar [data-tool="eraser"]', 'Apagar e selecionar', 'Borracha, laço e seleção ficam aqui. Ctrl+Z desfaz qualquer coisa.'],
  ['#createbar', 'Criar', 'Texto, nota, desenho, formas técnicas, imagem e slides de PowerPoint ou PDF.'],
  ['#pagebar, .bar.zoom', 'Páginas e zoom', 'Passe as páginas, mude o zoom ou use a lupa. Ctrl+0 ajusta à tela.'],
  ['#bPresent', 'Apresentar', 'Tela cheia para a aula. F5 também começa, e um passador de slides funciona.'],
  ['#bHelp', 'Ajuda', 'Sempre que precisar, toque aqui ou aperte F1. Dá para rever este tour por lá.'],
];
let tourAtivo = null;
export function tourEmAndamento() { return !!tourAtivo; }
export function encerrarTour() {
  if (!tourAtivo) return;
  tourAtivo.balao.remove(); tourAtivo.anel.remove();
  tourAtivo = null;
  guarda({ tourVisto: true });
}
function visivel(seletor) {
  for (const s of seletor.split(',')) {
    const el = document.querySelector(s.trim());
    if (el && el.getClientRects().length && !el.closest('[hidden]')) return el;
  }
  return null;
}
export function iniciarTour() {
  encerrarTour();
  fecharAjuda();
  const passos = PASSOS_TOUR.filter(([s]) => visivel(s));
  if (!passos.length) return;
  const balao = document.createElement('div'), anel = document.createElement('div');
  balao.className = 'aj-balao'; anel.className = 'aj-anel fixo';
  balao.setAttribute('role', 'dialog');
  document.body.append(anel, balao);
  tourAtivo = { balao, anel, i: 0 };
  const vai = i => {
    tourAtivo.i = i;
    const [sel, tit, txt] = passos[i], el = visivel(sel);
    if (!el) return i + 1 < passos.length ? vai(i + 1) : encerrarTour();
    const r = el.getBoundingClientRect();
    Object.assign(anel.style, { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' });
    balao.innerHTML = `<b>${i + 1} de ${passos.length} · ${esc(tit)}</b><p>${esc(txt)}</p>
      <div class="aj-bts"><button class="btn" data-p>Pular</button>${i ? '<button class="btn" data-a>Voltar</button>' : ''}
      <button class="btn primary" data-n>${i + 1 < passos.length ? 'Próximo' : 'Concluir'}</button></div>`;
    // o balão fica do lado onde houver mais espaço: abaixo, acima, à direita ou à esquerda do controle
    const bw = 300, bh = balao.offsetHeight || 130, W = innerWidth, H = innerHeight, m = 12;
    let x, y;
    if (r.bottom + bh + m < H) { y = r.bottom + m; x = r.left + r.width / 2 - bw / 2; }
    else if (r.top - bh - m > 0) { y = r.top - bh - m; x = r.left + r.width / 2 - bw / 2; }
    else if (r.right + bw + m < W) { x = r.right + m; y = r.top + r.height / 2 - bh / 2; }
    else { x = r.left - bw - m; y = r.top + r.height / 2 - bh / 2; }
    Object.assign(balao.style, { left: Math.max(m, Math.min(W - bw - m, x)) + 'px', top: Math.max(m, Math.min(H - bh - m, y)) + 'px', width: bw + 'px' });
    balao.querySelector('[data-p]').onclick = encerrarTour;
    balao.querySelector('[data-a]')?.addEventListener('click', () => vai(i - 1));
    balao.querySelector('[data-n]').onclick = () => (i + 1 < passos.length ? vai(i + 1) : encerrarTour());
    balao.querySelector('[data-n]').focus();
  };
  vai(0);
}
// na primeira vez que um quadro abre (e se o tour não foi desligado), mostra o tour uma vez só
export function tourDaPrimeiraVez() {
  const e = estado();
  if (e.tourVisto || e.tourDesligado) return;
  setTimeout(() => { if (!tourAtivo && !document.querySelector('dialog[open]')) iniciarTour(); }, 900);
}
