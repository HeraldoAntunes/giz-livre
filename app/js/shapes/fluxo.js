import { T, head } from './base.js';

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
  ],
};
