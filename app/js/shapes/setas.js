import { head } from './base.js';

// Setas de bloco e setas/conectores. Desenho próprio do Giz Livre.
export default {
  id: 'setas', nome: 'Setas e conectores',
  secoes: [
    ['Setas de bloco', [
      ['st-bloco', 'Seta larga', 130, 70, '<path d="M4 22 H80 V4 L126 35 L80 66 V48 H4 Z"/>'],
      ['st-bloco2', 'Seta larga dupla', 140, 70, '<path d="M4 35 L46 4 V22 H94 V4 L136 35 L94 66 V48 H46 V66 Z"/>'],
      ['st-cima', 'Seta para cima', 70, 120, '<path d="M22 116 V44 H4 L35 4 L66 44 H48 V116 Z"/>'],
      ['st-curvalarga', 'Seta curva larga', 140, 110, '<path d="M4 106 A92 92 0 0 1 96 14 V4 L136 28 L96 52 V42 A64 64 0 0 0 32 106 Z"/>'],
      ['st-U', 'Seta em U', 120, 110, '<path d="M4 106 V50 A46 46 0 0 1 96 50 V74 H112 L84 106 L56 74 H72 V50 A22 22 0 0 0 28 50 V106 Z"/>'],
      ['st-chevron', 'Divisa (chevron)', 110, 70, '<path d="M4 4 H76 L106 35 L76 66 H4 L34 35 Z"/>'],
      ['st-entalhada', 'Seta entalhada', 130, 70, '<path d="M4 22 H80 V4 L126 35 L80 66 V48 H4 L16 35 Z"/>'],
      ['st-pentagono', 'Etapa (pentágono)', 130, 70, '<path d="M4 4 H96 L126 35 L96 66 H4 Z"/>'],
    ]],
    ['Setas e conectores', [
      ['st-simples', 'Seta simples', 120, 30, `<path d="M6 15 H102"/>${head(116, 15, 0, 16)}`],
      ['st-dupla', 'Seta dupla (↔)', 140, 30, `<path d="M20 15 H120"/>${head(4, 15, 180, 16)}${head(136, 15, 0, 16)}`],
      ['st-implica', 'Seta dupla (⇒)', 120, 40, '<path d="M6 13 H100 M6 27 H100 M90 4 L114 20 L90 36"/>'],
      ['st-tracejada', 'Seta tracejada', 120, 30, `<path d="M6 15 H102" stroke-dasharray="8 6"/>${head(116, 15, 0, 16)}`],
      ['st-curva', 'Seta curva', 120, 90, `<path d="M8 82 Q20 14 104 22"/>${head(118, 23, 3, 16)}`],
      ['st-retorno', 'Seta de retorno', 110, 90, `<path d="M100 20 H40 A30 30 0 0 0 40 80 H88"/>${head(104, 80, 0, 16)}`],
      ['st-ciclo', 'Ciclo', 100, 100, `<path d="M86 38 A38 38 0 1 0 79 75"/>${head(86, 62, -72, 16)}`],
      ['st-L', 'Seta em L', 110, 90, `<path d="M8 8 V74 H90"/>${head(104, 74, 0, 16)}`],
      ['st-cotovelo', 'Cotovelo duplo', 120, 90, `<path d="M6 16 H56 V74 H98"/>${head(114, 74, 0, 16)}`],
      ['st-divide', 'Divide (1 → 2)', 120, 100, `<path d="M8 50 H50 L92 16 M50 50 L92 84"/>${head(104, 8, -40, 16)}${head(104, 92, 40, 16)}`],
      ['st-junta', 'Junta (2 → 1)', 120, 100, `<path d="M8 12 L50 50 L8 88 M50 50 H96"/>${head(110, 50, 0, 16)}`],
      ['st-equilibrio', 'Equilíbrio (⇌)', 120, 50, '<path d="M8 18 H112 L98 8 M112 32 H8 L22 42"/>'],
      ['st-reacao', 'Reação (→)', 120, 30, `<path d="M8 15 H100"/>${head(114, 15, 0, 16)}`],
      ['st-resson', 'Ressonância (↔)', 90, 30, `<path d="M18 15 H72"/>${head(4, 15, 180, 14)}${head(86, 15, 0, 14)}`],
      ['st-chave', 'Chave', 40, 120, '<path d="M30 4 Q14 4 16 22 V48 Q16 60 4 60 Q16 60 16 72 V98 Q14 116 30 116"/>'],
      ['st-colchete', 'Colchete', 30, 120, '<path d="M24 4 H6 V116 H24"/>'],
      ['st-cota', 'Cota (dimensão)', 160, 40, `<path d="M4 4 V36 M156 4 V36 M20 20 H140" stroke-width="1.8"/>${head(6, 20, 180, 14)}${head(154, 20, 0, 14)}`],
    ]],
  ],
};
