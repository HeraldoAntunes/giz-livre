// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Esconder até a aula e revelar na hora, um de cada vez (P61 A). O item escondido leva o campo opcional `revelar`
// (número de ordem); ele some do quadro, da seleção, da borracha, da exportação e da miniatura, e continua salvo.
// Uma versão antiga do programa ignora o campo e mostra o item: nada se perde, só aparece antes.

/** Quantos itens estão esperando para ser revelados. */
export const quantosEscondidos = items => items.filter(i => i.revelar != null).length;

/** Esconde os itens de `ids`, na ordem em que estão no quadro, depois dos que já estavam escondidos. */
export function esconder(items, ids) {
  let n = Math.max(0, ...items.map(i => i.revelar ?? 0));
  return items.map(i => ids.has(i.id) && i.revelar == null ? { ...i, revelar: ++n } : i);
}

/** O próximo a revelar (o de menor número) e os itens com ele já à vista; null se não há nenhum escondido. */
export function revelarProximo(items) {
  let alvo = null;
  for (const i of items) if (i.revelar != null && (!alvo || i.revelar < alvo.revelar)) alvo = i;
  if (!alvo) return null;
  return { id: alvo.id, items: items.map(i => { if (i !== alvo) return i; const { revelar, ...r } = i; return r; }) };
}

/** Revela um item escolhido (chegar a ele no roteiro de paradas). */
export function revelarItem(items, id) {
  return items.map(i => { if (i.id !== id || i.revelar == null) return i; const { revelar, ...r } = i; return r; });
}
