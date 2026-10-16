// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Gera app/shapes-index.json: formas, folhas e modelos de função num JSON que o servidor Python lê sem interpretar JS.
// Rodar depois de mexer em app/js/shapes/, paper.js ou fnmodels.js:  node scripts/indice_formas.mjs
// O teste "Índice para agentes" (tests/testes.mjs) falha se o arquivo ficar desatualizado.
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mod = nome => import(pathToFileURL(path.join(raiz, 'app', 'js', nome)).href);

export async function montarIndice() {
  const { GROUPS } = await mod('shapelib.js');
  const { PAPERS } = await mod('paper.js');
  const { MODELOS } = await mod('fnmodels.js');
  const vistos = new Set(), formas = [];
  for (const g of GROUPS) for (const [secao, lista] of g.secoes) for (const [id, nome, w, h] of lista) {
    if (vistos.has(id)) continue;   // a mesma forma pode aparecer em mais de uma seção: vale a primeira
    vistos.add(id);
    formas.push({ id, nome, grupo: g.id, grupo_nome: g.nome, secao, w, h });
  }
  return {
    _sobre: 'Gerado por scripts/indice_formas.mjs; não editar à mão. Usado pelas rotas /api/agente/* do server.py.',
    formas,
    folhas: PAPERS.map(([id, nome]) => ({ id, nome })),
    modelos: MODELOS.map(m => ({ id: m.id, nome: m.nome, area: m.area, expr: m.expr, x: m.x,
      params: m.params.map(p => ({ n: p.n, v: p.v, min: p.min, max: p.max, desc: p.desc || '' })) })),
  };
}

export const textoIndice = indice => JSON.stringify(indice) + '\n';

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const indice = await montarIndice();
  writeFileSync(path.join(raiz, 'app', 'shapes-index.json'), textoIndice(indice), 'utf8');
  console.log(`app/shapes-index.json: ${indice.formas.length} formas, ${indice.folhas.length} folhas, ${indice.modelos.length} modelos`);
}
