// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Notas do professor (P64 i): uma nota por página, como as notas do orador do PowerPoint. A nota é um item invisível
// do tipo 'notaprof' no topo da página: acompanha a página ao inserir, duplicar e excluir (essas operações movem os
// itens pela posição) e fica fora do desenho, do PDF, da impressão e da miniatura (render.js não desenha o tipo).
// Na apresentação com duas telas, a janela das notas (#/notas/<quadro>) recebe a página atual por BroadcastChannel.
import * as PG from './pages.js';

export const TIPO = 'notaprof';
export const MAX_TEXTO = 20000;
export const ehNota = it => it?.type === TIPO;
export const CANAL = 'giz-livre-notas';
export const AVISO_UMA_TELA = 'Para ver as notas sem os alunos verem, use Win + P e escolha Estender';
// marca no título da lousa ao sair da apresentação: a janela própria fecha as notas e traz a lousa de volta (main.rs)
export const MARCA_FIM = 'giz-livre:fim-apresentacao';

const daPagina = (items, L, i) => items.filter(it => ehNota(it) && PG.pageOf(L, it) === i);

/** O texto da nota da página i (vazio se não tem). Duas notas na mesma página (vindas de fora) aparecem juntas. */
export function textoDaPagina(items, L, i) {
  return daPagina(items, L, i).map(n => (typeof n.texto === 'string' ? n.texto : '')).filter(Boolean).join('\n\n');
}

/** Os itens com a nota da página i trocada por `texto` (vazio apaga a nota). `novoId` dá o id de uma nota nova. */
export function comNota(items, L, i, texto, novoId) {
  texto = String(texto ?? '').slice(0, MAX_TEXTO);
  const atuais = daPagina(items, L, i);
  const resto = items.filter(it => !atuais.includes(it));
  if (!texto.trim()) return resto;
  const r = PG.pageRect(L, i);
  return [...resto, { id: atuais[0]?.id || novoId(), type: TIPO, x: r.x, y: r.y + 1, w: 1, h: 1, texto }];
}

/** Páginas com nota (índices a partir de 0), para o painel marcar quais já têm. */
export function paginasComNota(items, L) {
  return [...new Set(items.filter(ehNota).map(it => PG.pageOf(L, it)))].sort((a, b) => a - b);
}

/** O que a janela das notas mostra: a página atual e a nota dela, e a nota da próxima, para se preparar. */
export function mensagemDaPagina(quadro, items, L, i) {
  return { quadro, pagina: i + 1, total: L.count, texto: textoDaPagina(items, L, i),
    proxima: i + 1 < L.count ? textoDaPagina(items, L, i + 1) : null };
}

/** Abrir a janela das notas ao apresentar? Só com a tela estendida (com uma tela, os alunos veriam as notas). */
export function abrirNotasAoApresentar(temNotas, telaEstendida) {
  if (!temNotas) return 'nada';
  return telaEstendida ? 'janela' : 'aviso';
}
