// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
import { T, head } from './base.js';

// ====================== Mais formas ======================
const fino = ' stroke-width="1.6"';
const TL = (x, y, s, size) => T(x, y, s, size).replace('text-anchor="middle"', 'text-anchor="start"'); // texto alinhado à esquerda
const caixa = (x, y, w, h, s, size = 12) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>` + (s ? T(x + w / 2, y + h / 2, s, size) : '');
const losango = (cx, cy, hw, hh, s, size = 12) => `<path d="M${cx} ${cy - hh} L${cx + hw} ${cy} L${cx} ${cy + hh} L${cx - hw} ${cy} Z"/>` + (s ? T(cx, cy, s, size) : '');
const seta = (d, x, y, ang) => `<path d="${d}"/>` + head(x, y, ang, 10); // linha de fluxo terminando em ponta
const no = (x, y) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#C"/>`;

// ---------- Estruturas de algoritmo prontas ----------
const estSe = seta('M100 4 V12', 100, 22, 90) + losango(100, 50, 44, 28, 'cond.') +
  seta('M100 78 V92', 100, 102, 90) + caixa(56, 102, 88, 38, 'ação') +
  `<path d="M100 140 V176 M144 50 H180 V176 H108"/>` + head(104, 176, 180, 10) + no(100, 176) + seta('M100 176 V202', 100, 214, 90) +
  T(116, 88, 'Sim', 11) + T(162, 40, 'Não', 11);
const estSeSenao = seta('M110 4 V12', 110, 22, 90) + losango(110, 50, 44, 28, 'cond.') +
  seta('M66 50 H40 V88', 40, 98, 90) + seta('M154 50 H180 V88', 180, 98, 90) + caixa(4, 98, 72, 36, 'ação 1', 11) + caixa(144, 98, 72, 36, 'ação 2', 11) +
  `<path d="M40 134 V164 H180 V134"/>` + no(110, 164) + seta('M110 164 V194', 110, 206, 90) + T(52, 40, 'Sim', 11) + T(168, 40, 'Não', 11);
const estEnquanto = seta('M100 4 V20', 100, 30, 90) + losango(100, 58, 44, 28, 'cond.') +
  seta('M100 86 V104', 100, 114, 90) + caixa(56, 114, 88, 36, 'ação') +
  seta('M100 150 V166 H24 V58 H46', 56, 58, 0) + seta('M144 58 H180 V196', 180, 208, 90) + T(116, 98, 'Sim', 11) + T(162, 48, 'Não', 11);
const estRepita = seta('M100 4 V18', 100, 28, 90) + caixa(56, 28, 88, 36, 'ação') + seta('M100 64 V82', 100, 92, 90) + losango(100, 120, 44, 28, 'cond.') +
  seta('M56 120 H24 V46 H46', 56, 46, 0) + seta('M100 148 V176', 100, 188, 90) + T(38, 108, 'Não', 11) + T(116, 166, 'Sim', 11);
const estPara = seta('M100 4 V16', 100, 26, 90) + `<path d="M50 26 H150 L170 52 L150 78 H50 L30 52 Z"/>` + T(100, 52, 'i = 1 … n', 12) +
  seta('M100 78 V96', 100, 106, 90) + caixa(56, 106, 88, 36, 'ação') + seta('M100 142 V160 H12 V52 H20', 30, 52, 0) +
  seta('M170 52 H186 V186', 186, 198, 90) + T(186, 40, 'fim', 10);
const estEscolha = seta('M120 4 V10', 120, 20, 90) + losango(120, 48, 44, 28, 'x') + `<path d="M120 76 V92 M40 92 H200"/>` +
  [40, 120, 200].map(x => seta(`M${x} 92 V104`, x, 114, 90)).join('') +
  caixa(8, 114, 64, 32, 'caso 1', 11) + caixa(88, 114, 64, 32, 'caso 2', 11) + caixa(168, 114, 64, 32, 'senão', 11) +
  `<path d="M40 146 V166 M120 146 V166 M200 146 V166 M40 166 H200"/>` + no(120, 166) + seta('M120 166 V184', 120, 196, 90);

// ---------- BPMN ----------
const evento = (w, extra = '') => `<circle cx="30" cy="30" r="24" stroke-width="${w}"/>` + extra;
const duplo = '<circle cx="30" cy="30" r="24" stroke-width="2"/><circle cx="30" cy="30" r="19" stroke-width="1.6"/>';
const gateway = m => `<path d="M35 4 L66 35 L35 66 L4 35 Z"/>` + m;
const envelope = '<rect x="18" y="21" width="24" height="18" stroke-width="1.8"/><path d="M18 21 L30 31 L42 21" stroke-width="1.8"/>';

// ---------- UML ----------
const umlClasse = `<rect x="4" y="4" width="152" height="112"/><path d="M4 30 H156 M4 74 H156"/>` + T(80, 17, 'Classe', 14) +
  TL(12, 44, '− atributo: tipo', 11) + TL(12, 60, '− atributo: tipo', 11) + TL(12, 88, '+ método()', 11) + TL(12, 104, '+ método()', 11);

// ---------- Organização e ideias ----------
const organograma = caixa(80, 4, 80, 36) + `<path d="M120 40 V62 M36 62 H204 M36 62 V84 M120 62 V84 M204 62 V84"/>` +
  caixa(4, 84, 64, 36) + caixa(88, 84, 64, 36) + caixa(172, 84, 64, 36);
const organograma3 = caixa(95, 4, 60, 30) + `<path d="M125 34 V50 M64 50 H186 M64 50 V66 M186 50 V66"/>` + caixa(29, 66, 70, 30) + caixa(151, 66, 70, 30) +
  `<path d="M64 96 V112 M32 112 H96 M32 112 V128 M96 112 V128 M186 96 V112 M154 112 H218 M154 112 V128 M218 112 V128"/>` +
  [32, 96, 154, 218].map(x => caixa(x - 28, 128, 56, 30)).join('');
const mapaMental = (() => {
  const nos = [[36, 24], [204, 24], [30, 80], [210, 80], [36, 136], [204, 136]];
  return `<ellipse cx="120" cy="80" rx="42" ry="24" stroke-width="3"/>` + T(120, 80, 'Tema', 14) +
    nos.map(([x, y]) => { const lado = x < 120 ? 1 : -1, xi = 120 - lado * 34, xf = x + lado * 26, ym = (80 + y) / 2;
      return `<path d="M${xi} ${y === 80 ? 80 : 80 + (y < 80 ? -12 : 12)} C${(xi + xf) / 2} ${ym} ${(xi + xf) / 2} ${y} ${xf} ${y}" stroke-width="2"/>` + `<ellipse cx="${x}" cy="${y}" rx="26" ry="13" stroke-width="2"/>`; }).join('');
})();
const ishikawa = (() => {
  const xs = [44, 112, 180], cima = ['Método', 'Máquina', 'Medida'], baixo = ['Material', 'Mão de obra', 'Meio ambiente'];
  let d = 'M8 75 H204 ', sub = '';
  xs.forEach(x => { d += `M${x} 24 L${x + 30} 73 M${x} 126 L${x + 30} 77 `; sub += `M${x + 9} 39 H${x - 8} M${x + 18} 54 H${x + 1} M${x + 9} 111 H${x - 8} M${x + 18} 96 H${x + 1} `; });
  return `<path d="${d}"/>` + `<path d="${sub}"${fino}/>` + head(214, 75, 0, 12) + `<rect x="216" y="55" width="40" height="40" rx="3"/>` + T(236, 75, 'Efeito', 9) +
    xs.map((x, i) => T(x, 14, cima[i], 10) + T(x, 137, baixo[i], 9)).join('');
})();
const linhaTempo = (() => {
  const xs = [30, 78, 126, 174, 222]; let d = 'M8 44 H244 ', s = '';
  xs.forEach((x, i) => { const y = i % 2 ? 72 : 16; d += `M${x} 44 V${i % 2 ? 62 : 26} `; s += `<circle cx="${x}" cy="44" r="5" fill="#C"/>` + T(x, y, `t<tspan font-size="9" dy="4">${i + 1}</tspan>`, 13); });
  return `<path d="${d}"/>` + head(254, 44, 0, 11) + s;
})();
const gantt = (() => {
  const x0 = 64, dx = 21.5, y0 = 26, dy = 24; let g = '', s = '';
  for (let k = 1; k < 8; k++) g += `M${x0 + k * dx} 4 V122 `;
  for (let r = 1; r < 4; r++) g += `M4 ${y0 + r * dy} H236 `;
  for (let k = 0; k < 8; k++) s += T(x0 + k * dx + dx / 2, 15, String(k + 1), 10);
  [[0, 3], [2, 3], [4, 2], [5, 3]].forEach(([a, n], r) => { s += `<rect x="${x0 + a * dx + 2}" y="${y0 + r * dy + 6}" width="${n * dx - 4}" height="12" rx="2" fill="#C" fill-opacity=".35" stroke-width="1.8"/>` + T(34, y0 + r * dy + 12, 'Tarefa ' + (r + 1), 10); });
  return `<rect x="4" y="4" width="232" height="118"/><path d="M${x0} 4 V122 M4 ${y0} H236"/>` + `<path d="${g}" stroke-width="1"/>` + s;
})();
const pdca = (() => {
  const c = 70, R = 60;
  return `<circle cx="${c}" cy="${c}" r="${R}"/><path d="M${c} ${c - R} V${c + R} M${c - R} ${c} H${c + R}" stroke-width="2"/>` +
    head(c + 12, c - R, 0, 12) + head(c + R, c + 12, 90, 12) + head(c - 12, c + R, 180, 12) + head(c - R, c - 12, -90, 12) +
    T(c + 26, c - 26, 'P', 24) + T(c + 26, c + 26, 'D', 24) + T(c - 26, c + 26, 'C', 24) + T(c - 26, c - 26, 'A', 24);
})();
const swot = `<rect x="4" y="4" width="192" height="162"/><path d="M100 4 V166 M4 85 H196"/>` +
  T(52, 18, 'Forças', 11) + T(148, 18, 'Fraquezas', 11) + T(52, 99, 'Oportunidades', 11) + T(148, 99, 'Ameaças', 11);
const funil = '<path d="M4 6 H176 L152 42 H28 Z M30 48 H150 L128 84 H52 Z M54 90 H126 L108 126 H72 Z M80 132 H100 V146 H80 Z"/>';
const piramide = '<path d="M100 4 L196 156 H4 Z M67.2 56 H132.8 M35.6 106 H164.4"/>';
const kanban = (() => {
  const cols = [[4, 'A fazer', 3], [82, 'Fazendo', 2], [160, 'Feito', 3]]; let s = '<rect x="4" y="4" width="232" height="142"/><path d="M82 4 V146 M160 4 V146 M4 28 H236"/>';
  cols.forEach(([x, nm, n]) => { s += T(x + 39, 16, nm, 11); for (let k = 0; k < n; k++) s += `<rect x="${x + 9}" y="${38 + k * 34}" width="60" height="24" rx="3" stroke-width="1.8"/>`; });
  return s;
})();
const etapas = (() => {
  let d = 'M4 8 H54 L70 30 L54 52 H4 Z ';
  for (let i = 1; i < 4; i++) { const x = 60 * i; d += `M${x} 8 H${x + 54} L${x + 70} 30 L${x + 54} 52 H${x} L${x + 16} 30 Z `; }
  return `<path d="${d}"/>` + [1, 2, 3, 4].map(i => T(i === 1 ? 34 : 60 * (i - 1) + 38, 30, String(i), 15)).join('');
})();

// ---------- Fluxograma de processo (ASME) ----------
const asmeLinha = '<circle cx="20" cy="22" r="16"/><path d="M48 16 H70 V8 L88 22 L70 36 V28 H48 Z"/><rect x="100" y="6" width="32" height="32"/>' +
  '<path d="M146 6 H160 A16 16 0 0 1 160 38 H146 Z M188 8 H222 L205 38 Z"/>';

// Fluxograma (convenções ISO 5807) e blocos para diagramas. Desenho próprio do Giz Livre.
export default {
  id: 'fluxo', nome: 'Fluxograma',
  secoes: [
    ['Fluxograma básico', [
      ['fx-terminal', 'Início / fim', 120, 64, '<rect x="4" y="4" width="112" height="56" rx="28"/>'],
      ['fx-processo', 'Processo', 120, 70, '<rect x="4" y="4" width="112" height="62" rx="3"/>'],
      ['fx-decisao', 'Decisão', 120, 84, '<path d="M60 4 L116 42 L60 80 L4 42 Z"/>'],
      ['fx-dados', 'Entrada / saída', 130, 70, '<path d="M28 4 H126 L102 66 H4 Z"/>'],
      ['fx-documento', 'Documento', 120, 76, '<path d="M4 4 H116 V58 Q88 40 60 58 T4 58 Z"/>'],
      ['fx-multidoc', 'Vários documentos', 130, 86, '<path d="M24 4 H126 V54 M14 14 H116 V64 M4 24 H106 V70 Q80 54 55 70 T4 70 Z"/>'],
      ['fx-conector', 'Conector', 48, 48, '<circle cx="24" cy="24" r="20"/>'],
      ['fx-foradepag', 'Conector de página', 60, 66, '<path d="M4 4 H56 V40 L30 62 L4 40 Z"/>'],
      ['fx-subprocesso', 'Subprocesso', 120, 70, '<rect x="4" y="4" width="112" height="62" rx="3"/><path d="M18 4 V66 M102 4 V66"/>'],
      ['fx-preparacao', 'Preparação', 130, 70, '<path d="M28 4 H102 L126 35 L102 66 H28 L4 35 Z"/>'],
      ['fx-manual', 'Operação manual', 130, 70, '<path d="M4 4 H126 L106 66 H24 Z"/>'],
      ['fx-entmanual', 'Entrada manual', 120, 70, '<path d="M4 24 L116 4 V66 H4 Z"/>'],
      ['fx-atraso', 'Espera / atraso', 120, 70, '<path d="M4 4 H84 A31 31 0 0 1 84 66 H4 Z"/>'],
      ['fx-banco', 'Banco de dados', 90, 100, '<path d="M4 18 A41 14 0 0 1 86 18 V82 A41 14 0 0 1 4 82 Z M4 18 A41 14 0 0 0 86 18"/>'],
      ['fx-armazenado', 'Dados armazenados', 130, 70, '<path d="M24 4 H126 A20 31 0 0 0 126 66 H24 A20 31 0 0 1 24 4 Z"/>'],
      ['fx-exibicao', 'Exibição', 130, 70, '<path d="M4 35 L30 4 H98 A26 31 0 0 1 98 66 H30 Z"/>'],
      ['fx-ordenar', 'Ordenar', 80, 90, '<path d="M40 4 L76 45 L40 86 L4 45 Z M4 45 H76"/>'],
      ['fx-mesclar', 'Mesclar', 100, 80, '<path d="M4 4 H96 L50 76 Z"/>'],
      ['fx-nota', 'Anotação', 110, 70, '<path d="M30 4 H4 V66 H30"/><path d="M30 35 H70" stroke-dasharray="6 5"/>'],
    ]],
    ['Diagramas', [
      ['fx-caixatitulo', 'Caixa com título', 150, 100, '<rect x="4" y="4" width="142" height="92" rx="3"/><path d="M4 30 H146"/>' + T(75, 17, 'Título', 15)],
      ['fx-raia', 'Raia (swimlane)', 260, 90, '<rect x="4" y="4" width="252" height="82"/><path d="M34 4 V86"/><g transform="rotate(-90 19 45)">' + T(19, 45, 'Raia', 14) + '</g>'],
      ['fx-raias2', 'Duas raias', 260, 150, '<rect x="4" y="4" width="252" height="142"/><path d="M34 4 V146 M4 75 H256"/><g transform="rotate(-90 19 40)">' + T(19, 40, 'Raia 1', 13) + '</g><g transform="rotate(-90 19 110)">' + T(19, 110, 'Raia 2', 13) + '</g>'],
      ['fx-ator', 'Ator', 60, 110, '<circle cx="30" cy="16" r="12"/><path d="M30 28 V68 M8 44 H52 M30 68 L12 104 M30 68 L48 104"/>'],
      ['fx-sistema', 'Sistema (entrada/saída)', 190, 80, '<rect x="44" y="8" width="102" height="64" rx="3"/><path d="M4 40 H32 M146 40 H174"/>' + head(44, 40, 0, 12) + head(186, 40, 0, 12) + T(95, 40, 'Sistema', 16)],
      ['fx-funcao', 'Função de transferência G(s)', 180, 70, '<rect x="44" y="10" width="92" height="50" rx="2"/><path d="M4 35 H32 M136 35 H164"/>' + head(44, 35, 0, 12) + head(176, 35, 0, 12) + T(90, 35, 'G(s)', 20)],
      ['fx-ganho', 'Ganho K', 130, 70, '<path d="M44 8 L88 35 L44 62 Z M4 35 H32 M88 35 H114"/>' + head(44, 35, 0, 12) + head(126, 35, 0, 12) + T(58, 35, 'K', 17)],
      ['fx-somador', 'Somador (Σ)', 110, 110, '<circle cx="55" cy="55" r="22"/><path d="M4 55 H21 M55 106 V89 M77 55 H94"/>' + head(33, 55, 0, 12) + head(55, 77, -90, 12) + head(106, 55, 0, 12) + T(55, 55, 'Σ', 20) + T(22, 40, '+', 16) + T(70, 94, '−', 16)],
      ['fx-ramificacao', 'Ponto de ramificação', 110, 80, '<path d="M4 26 H94 M50 26 V62"/><circle cx="50" cy="26" r="4.5" fill="#C"/>' + head(106, 26, 0, 12) + head(50, 76, 90, 12)],
    ]],
    ['ISO 5807 (complementos)', [
      ['fx-arm-interno', 'Armazenamento interno', 120, 70, '<rect x="4" y="4" width="112" height="62" rx="2"/><path d="M20 4 V66 M4 20 H116" stroke-width="1.8"/>'],
      ['fx-cartao', 'Cartão', 120, 70, '<path d="M24 4 H116 V66 H4 V24 Z"/>'],
      ['fx-fita-perf', 'Fita perfurada', 120, 70, '<path d="M4 14 Q32 -4 60 14 T116 14 V56 Q88 74 60 56 T4 56 Z"/>'],
      ['fx-disco', 'Armazenamento de acesso direto', 120, 70, '<path d="M20 4 H100 A16 31 0 0 1 100 66 H20 A16 31 0 0 1 20 4 Z M100 4 A16 31 0 0 0 100 66"/>'],
      ['fx-fita-mag', 'Fita magnética (acesso sequencial)', 80, 76, '<circle cx="36" cy="36" r="32"/><path d="M36 68 H76"/>'],
      ['fx-laco-ini', 'Início de laço', 120, 70, '<path d="M20 4 H100 L116 20 V66 H4 V20 Z"/>'],
      ['fx-laco-fim', 'Fim de laço', 120, 70, '<path d="M4 4 H116 V50 L100 66 H20 L4 50 Z"/>'],
      ['fx-paralelo', 'Modo paralelo', 160, 64, '<path d="M4 22 H156 M4 30 H156 M80 4 V22 M30 30 V46 M80 30 V46 M130 30 V46"/>' + head(30, 58, 90, 10) + head(80, 58, 90, 10) + head(130, 58, 90, 10)],
      ['fx-comunicacao', 'Linha de comunicação', 140, 68, '<path d="M4 34 H50 L66 12 V56 L82 34 H122"/>' + head(134, 34, 0, 12)],
      ['fx-extrair', 'Extrair', 100, 80, '<path d="M50 4 L96 76 H4 Z"/>'],
      ['fx-ou', 'Ou (OR)', 60, 60, '<circle cx="30" cy="30" r="24"/><path d="M30 6 V54 M6 30 H54"/>'],
      ['fx-soma', 'Junção somadora', 60, 60, '<circle cx="30" cy="30" r="24"/><path d="M13 13 L47 47 M47 13 L13 47"/>'],
      ['fx-decisao-sn', 'Decisão com Sim / Não', 210, 138, seta('M90 4 V12', 90, 22, 90) + losango(90, 62, 58, 40, '?', 20) + seta('M90 102 V122', 90, 134, 90) + seta('M148 62 H192', 204, 62, 0) + T(110, 116, 'Sim', 12) + T(174, 50, 'Não', 12)],
      ['fx-conector-par', 'Conectores de ligação (A → A)', 170, 50, seta('M4 25 H26', 36, 25, 0) + '<circle cx="56" cy="25" r="19"/><circle cx="114" cy="25" r="19"/><path d="M133 25 H154"/>' + head(166, 25, 0, 10) + T(56, 25, 'A', 16) + T(114, 25, 'A', 16)],
    ]],
    ['Estruturas de algoritmo', [
      ['fx-est-se', 'Se (sem senão)', 200, 218, estSe],
      ['fx-est-sesenao', 'Se / senão', 220, 210, estSeSenao],
      ['fx-est-enquanto', 'Enquanto (teste no início)', 200, 212, estEnquanto],
      ['fx-est-repita', 'Repita… até (teste no fim)', 160, 192, estRepita],
      ['fx-est-para', 'Para (i = 1 … n)', 200, 202, estPara],
      ['fx-est-escolha', 'Escolha / caso', 240, 200, estEscolha],
    ]],
    ['BPMN básico', [
      ['fx-bpmn-inicio', 'Evento de início', 60, 60, evento(2)],
      ['fx-bpmn-fim', 'Evento de fim', 60, 60, evento(5)],
      ['fx-bpmn-intermed', 'Evento intermediário', 60, 60, duplo],
      ['fx-bpmn-tempo', 'Evento de tempo', 60, 60, duplo + '<circle cx="30" cy="30" r="12" stroke-width="1.6"/><path d="M30 30 V21 M30 30 L36 34" stroke-width="1.8"/>'],
      ['fx-bpmn-mensagem', 'Evento de mensagem', 60, 60, evento(2, envelope)],
      ['fx-bpmn-erro', 'Evento de erro (fim)', 60, 60, evento(5, '<path d="M19 41 L25 21 L33 33 L41 19 L36 39 L29 28 Z" stroke-width="1.8"/>')],
      ['fx-bpmn-tarefa', 'Tarefa', 120, 70, '<rect x="4" y="4" width="112" height="62" rx="12"/>'],
      ['fx-bpmn-subproc', 'Subprocesso recolhido', 120, 70, '<rect x="4" y="4" width="112" height="62" rx="12"/><rect x="52" y="46" width="16" height="16" stroke-width="1.8"/><path d="M60 49 V59 M55 54 H65" stroke-width="1.8"/>'],
      ['fx-bpmn-gw-x', 'Gateway exclusivo (XOR)', 70, 70, gateway('<path d="M25 25 L45 45 M45 25 L25 45" stroke-width="4"/>')],
      ['fx-bpmn-gw-par', 'Gateway paralelo (AND)', 70, 70, gateway('<path d="M35 20 V50 M20 35 H50" stroke-width="4"/>')],
      ['fx-bpmn-gw-inc', 'Gateway inclusivo (OR)', 70, 70, gateway('<circle cx="35" cy="35" r="13" stroke-width="3"/>')],
      ['fx-bpmn-dados', 'Objeto de dados', 60, 76, '<path d="M4 4 H40 L56 20 V72 H4 Z M40 4 V20 H56"/>'],
      ['fx-bpmn-msg', 'Fluxo de mensagem', 160, 30, '<circle cx="10" cy="15" r="5"/><path d="M15 15 H142" stroke-dasharray="6 5"/><path d="M142 9 L155 15 L142 21 Z"/>'],
    ]],
    ['UML (atividade e estado)', [
      ['fx-uml-inicial', 'Nó inicial', 40, 40, '<circle cx="20" cy="20" r="14" fill="#C"/>'],
      ['fx-uml-final', 'Nó final', 44, 44, '<circle cx="22" cy="22" r="17"/><circle cx="22" cy="22" r="10" fill="#C" stroke="none"/>'],
      ['fx-uml-fim-fluxo', 'Fim de fluxo', 44, 44, '<circle cx="22" cy="22" r="17"/><path d="M10 10 L34 34 M34 10 L10 34" stroke-width="2"/>'],
      ['fx-uml-estado', 'Estado (com atividades)', 140, 90, '<rect x="4" y="4" width="132" height="82" rx="16"/><path d="M4 30 H136"/>' + T(70, 17, 'Estado', 13) + T(70, 48, 'entry / ação', 11) + T(70, 68, 'do / atividade', 11)],
      ['fx-uml-barra', 'Bifurcação / junção', 160, 74, '<rect x="10" y="22" width="140" height="8" fill="#C"/><path d="M80 4 V22 M40 30 V52 M80 30 V52 M120 30 V52"/>' + head(40, 64, 90, 10) + head(80, 64, 90, 10) + head(120, 64, 90, 10)],
      ['fx-uml-decisao', 'Decisão com guardas', 160, 96, seta('M80 4 V10', 80, 20, 90) + losango(80, 40, 20, 20) + seta('M60 40 H24 V72', 24, 84, 90) + seta('M100 40 H136 V72', 136, 84, 90) + T(40, 30, '[sim]', 11) + T(120, 30, '[não]', 11)],
      ['fx-uml-transicao', 'Transição (evento [guarda] / ação)', 200, 40, '<path d="M4 30 H194 M182 24 L194 30 L182 36"/>' + T(100, 15, 'evento [guarda] / ação', 11)],
      ['fx-uml-classe', 'Classe (UML)', 160, 120, umlClasse],
      ['fx-uml-caso-uso', 'Caso de uso', 140, 64, '<ellipse cx="70" cy="32" rx="64" ry="28"/>' + T(70, 32, 'Caso de uso', 13)],
      ['fx-uml-nota', 'Nota (UML)', 128, 70, '<path d="M4 4 H104 L124 24 V66 H4 Z M104 4 V24 H124"/>'],
      ['fx-uml-envio', 'Envio de sinal', 130, 70, '<path d="M4 4 H100 L126 35 L100 66 H4 Z"/>' + T(56, 35, 'enviar', 13)],
      ['fx-uml-recepcao', 'Recepção de sinal', 130, 70, '<path d="M4 4 H126 V66 H4 L30 35 Z"/>' + T(74, 35, 'receber', 13)],
      ['fx-uml-historico', 'Estado histórico (H)', 44, 44, '<circle cx="22" cy="22" r="17"/>' + T(22, 23, 'H', 18)],
    ]],
    ['Organização e ideias', [
      ['fx-organograma', 'Organograma (1 + 3)', 240, 124, organograma],
      ['fx-organograma3', 'Organograma (3 níveis)', 250, 162, organograma3],
      ['fx-mapa-mental', 'Mapa mental', 240, 160, mapaMental],
      ['fx-ishikawa', 'Ishikawa (espinha de peixe, 6M)', 260, 148, ishikawa],
      ['fx-linha-tempo', 'Linha do tempo', 260, 88, linhaTempo],
      ['fx-gantt', 'Cronograma (Gantt)', 240, 126, gantt],
      ['fx-pdca', 'Ciclo PDCA', 140, 140, pdca],
      ['fx-swot', 'Matriz SWOT (FOFA)', 200, 170, swot],
      ['fx-funil', 'Funil', 180, 150, funil],
      ['fx-piramide', 'Pirâmide em níveis', 200, 160, piramide],
      ['fx-kanban', 'Quadro kanban', 240, 150, kanban],
      ['fx-etapas', 'Processo em etapas (4)', 256, 60, etapas],
    ]],
    ['Fluxograma de processo (ASME)', [
      ['fx-asme-operacao', 'Operação', 52, 52, '<circle cx="26" cy="26" r="22"/>'],
      ['fx-asme-inspecao', 'Inspeção', 52, 52, '<rect x="4" y="4" width="44" height="44"/>'],
      ['fx-asme-espera', 'Espera', 52, 52, '<path d="M4 4 H26 A22 22 0 0 1 26 48 H4 Z"/>'],
      ['fx-asme-armazenagem', 'Armazenagem', 56, 52, '<path d="M4 6 H52 L28 48 Z"/>'],
      ['fx-asme-combinada', 'Operação com inspeção', 56, 56, '<rect x="4" y="4" width="48" height="48"/><circle cx="28" cy="28" r="20"/>'],
      ['fx-asme-linha', 'Símbolos ASME (linha da folha)', 228, 44, asmeLinha],
    ]],
  ],
};
