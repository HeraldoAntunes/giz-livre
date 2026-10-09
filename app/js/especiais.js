// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Material de consulta com fundo próprio. Direção em docs/BRIEF-MATERIAL-DE-CONSULTA.md.
// SVG determinístico e local; dados/fontes documentados em cada elemento.
// O ID da tabela periódica anterior é preservado para busca e compatibilidade.
// Os ids nunca mudam: a busca e os Recentes usam o id.
import { periodicTableSVG } from './library.js';
import { CONSULTA as hidra } from './especiais/hidra.js';
import { CONSULTA as saneamento } from './especiais/saneamento.js';
import { CONSULTA as quimica } from './especiais/quimica.js';
import { CONSULTA as fisica } from './especiais/fisica.js';
import { CONSULTA as estat } from './especiais/estat.js';
import { CONSULTA as matematica } from './especiais/matematica.js';
import { CONSULTA as eletronica } from './especiais/eletronica.js';
import { CONSULTA as biologia } from './especiais/biologia.js';
import { CONSULTA as musica } from './especiais/musica.js';

// CONSULTA contém só as referências refeitas/novas. Os demais IDs antigos continuam ocultos e preservados.
// Só constantes e dados fixos de consulta; legislação e norma ficam fora (decisão do professor, 09/10/2026).
export const ESPECIAIS = [
  { id: 'esp-tabela-periodica', nome: 'Tabela periódica (colorida)', grupo: 'quimica', make: periodicTableSVG },
  ...hidra, ...saneamento, ...quimica, ...fisica, ...estat, ...matematica, ...eletronica, ...biologia, ...musica,
];
