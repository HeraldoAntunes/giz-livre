// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// F1 (pedido do professor, 19/11/2026: "botar os marcadores que nem o Giz na Tela, 1, 2, 3, 4, bem legalzinho... com
// estilos, podendo ser maiorzinho, menor, cores, preenchido ou não preenchido"). Carimbo numerado: cada toque da
// ferramenta Números põe o próximo número (ou letra) da página.
//
// O carimbo é gravado como um item de imagem (SVG desenhado aqui) que leva junto os dados dele em `carimbo`. Assim
// ele já se move, apaga, desfaz, copia, sai no PDF e na miniatura como qualquer imagem, e um quadro com carimbos aberto
// numa versão anterior (1.18.0) mostra os números certos (só não deixa mudar o estilo). Mudar o estilo refaz o SVG.

export const TAMANHOS = { P: 32, M: 46, G: 66, GG: 92 };   // lado do carimbo, em px do quadro
export const FORMAS = [['circulo', 'Círculo'], ['quadrado', 'Quadrado'], ['losango', 'Losango'], ['nenhum', 'Sem fundo']];
export const PADRAO = { tam: 'M', forma: 'circulo', preenchido: true, letras: false };

export const ehCarimbo = it => it?.type === 'image' && !!it.carimbo && Number.isInteger(it.carimbo.n) && it.carimbo.n >= 1;

/** 1 → "1"; com letras: 1 → "A", 26 → "Z", 27 → "AA". */
export function rotulo(n, letras = false) {
  if (!letras) return String(n);
  let s = '';
  for (let k = n; k > 0; k = Math.floor((k - 1) / 26)) s = String.fromCharCode(65 + (k - 1) % 26) + s;
  return s;
}

function claro(cor) {
  const n = parseInt(String(cor).slice(1), 16);
  if (!Number.isFinite(n)) return false;
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 170;
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Estilo completo e limpo (o que vem do arquivo pode estar incompleto ou estranho). */
export function estilo(c = {}) {
  return {
    n: Math.max(1, Math.min(99999, Math.round(Number(c.n) || 1))),
    letras: !!c.letras,
    forma: FORMAS.some(([k]) => k === c.forma) ? c.forma : PADRAO.forma,
    preenchido: c.preenchido !== false,
    tam: c.tam in TAMANHOS ? c.tam : PADRAO.tam,
    cor: /^#[0-9a-fA-F]{6}$/.test(c.cor || '') ? c.cor.toLowerCase() : '#c50f1f',
  };
}

/** O SVG do carimbo, do tamanho do carimbo (lado = TAMANHOS[tam]). */
export function svgCarimbo(c0) {
  const c = estilo(c0), L = TAMANHOS[c.tam], t = rotulo(c.n, c.letras), cor = c.cor;
  const contraste = claro(cor) ? '#111111' : '#ffffff';
  const borda = Math.max(2, L * 0.07), m = borda / 2;
  const cheio = c.preenchido && c.forma !== 'nenhum';
  let fundo = '';
  const tinta = cheio ? `fill="${cor}" stroke="${claro(cor) ? '#333333' : '#ffffff'}" stroke-width="${(borda * 0.6).toFixed(1)}"`
    : `fill="none" stroke="${cor}" stroke-width="${borda.toFixed(1)}"`;
  if (c.forma === 'circulo') fundo = `<circle cx="${L / 2}" cy="${L / 2}" r="${(L / 2 - m).toFixed(1)}" ${tinta}/>`;
  else if (c.forma === 'quadrado') fundo = `<rect x="${m}" y="${m}" width="${(L - borda).toFixed(1)}" height="${(L - borda).toFixed(1)}" rx="${(L * 0.14).toFixed(1)}" ${tinta}/>`;
  else if (c.forma === 'losango') fundo = `<polygon points="${L / 2},${m} ${L - m},${L / 2} ${L / 2},${L - m} ${m},${L / 2}" ${tinta}/>`;
  const dentro = c.forma === 'losango' ? 0.62 : c.forma === 'nenhum' ? 1 : 0.8;   // o texto cabe dentro da forma
  const fs = Math.min(L * 0.62, (L * dentro) / Math.max(1, t.length * 0.62));
  const corTexto = cheio ? contraste : cor;
  // sem fundo: um contorno leve na cor oposta deixa o número legível sobre qualquer coisa
  const halo = c.forma === 'nenhum' ? ` stroke="${claro(cor) ? '#333333' : '#ffffff'}" stroke-width="${(fs * 0.12).toFixed(1)}" paint-order="stroke"` : '';
  const texto = `<text x="${L / 2}" y="${(L / 2 + fs * 0.35).toFixed(1)}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="${fs.toFixed(1)}" fill="${corTexto}"${halo}>${esc(t)}</text>`;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${L}" viewBox="0 0 ${L} ${L}">${fundo}${texto}</svg>`, w: L, h: L };
}
export const srcCarimbo = c => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgCarimbo(c).svg);

/** Item de imagem com o carimbo, centrado em (cx, cy). */
export function itemCarimbo(c0, cx, cy, id) {
  const c = estilo(c0), { w, h } = svgCarimbo(c);
  return { id, type: 'image', x: cx - w / 2, y: cy - h / 2, w, h, src: srcCarimbo(c), carimbo: c };
}

/** O mesmo carimbo com outro estilo, no mesmo centro (o tamanho muda em volta do centro). */
export function reestilizar(it, mudanca) {
  const c = estilo({ ...it.carimbo, ...mudanca }), { w, h } = svgCarimbo(c);
  // o tamanho atual pode ter sido ajustado à mão pela seleção: mantém a proporção dele em relação ao padrão
  const antes = TAMANHOS[estilo(it.carimbo).tam], k = antes ? it.w / antes : 1;
  const nw = 'tam' in mudanca ? w : w * k, nh = 'tam' in mudanca ? h : h * k;
  return { ...it, x: it.x + it.w / 2 - nw / 2, y: it.y + it.h / 2 - nh / 2, w: nw, h: nh, src: srcCarimbo(c), carimbo: c };
}

/**
 * O próximo número da página: o maior já posto nela (do mesmo tipo, números ou letras) mais um. `pagina(it)` diz a
 * página de cada item (ou null no quadro infinito, onde vale o quadro inteiro).
 */
export function proximo(items, letras, naPagina) {
  let m = 0;
  for (const it of items) if (ehCarimbo(it) && !!it.carimbo.letras === !!letras && naPagina(it)) m = Math.max(m, it.carimbo.n);
  return m + 1;
}
