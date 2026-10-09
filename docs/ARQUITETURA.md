# Arquitetura do Giz Livre

Guia para quem quer entender ou modificar o código. O programa tem duas partes:

```
┌────────────────────────── janela do Edge/Chrome (modo app) ──────────────────────────┐
│  app/index.html + app/style.css + app/js/*.js   (JavaScript puro, módulos ES, canvas)  │
└───────────────▲──────────────────────────────────────────────────────────────────────┘
                │  HTTP em 127.0.0.1 (pedidos de escrita levam o token X-Lousa)
┌───────────────┴──────────────────────────────────────────────────────────────────────┐
│  server.py  (Python, só biblioteca padrão)                                             │
│  quadros/<id>.json + <id>.png (miniatura) + assets/<sha1>.png|jpg (imagens e slides)   │
│  PowerPoint (COM) ou LibreOffice → slides;  Windows Ink → escrita→texto;  PDF          │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

## Servidor (`server.py`)
| Rota | O que faz |
|---|---|
| `GET /api/info` | versão, pasta de dados, recursos do sistema (`pptx`, `ocr`) e o **token da sessão** |
| `GET /api/boards`, `GET/PUT/DELETE /api/boards/<id>` | listar (com `folder`; resumo em cache por data/tamanho), ler, gravar (atômico) e excluir (vai para a lixeira) |
| `PUT /api/folder/<id>` | muda só a pasta do quadro (`{folder}`), sem mexer na data de edição |
| `GET /api/lixeira`, `GET /api/lixeira/<nome>.png`, `POST /api/lixeira/restaurar` | lista os quadros excluídos e restaura um deles (id em uso → restaura com id novo; nomes validados contra path traversal) |
| `PUT /api/thumbs/<id>`, `GET /thumbs/<id>.png` | miniatura da galeria |
| `POST /api/assets`, `GET /assets/<sha1>.png` | imagens guardadas à parte (o quadro fica leve) |
| `POST /api/pptx` | PowerPoint → imagens (PowerPoint) ou → PDF (LibreOffice) |
| `POST /api/pdf` | monta um PDF a partir das páginas em JPEG |
| `POST /api/ocr` | escrita à mão → texto (reconhecedor do Windows, via PowerShell/WinRT) |
| `POST /api/ping`, `POST /api/sair` | mantém o servidor vivo / encerra (troca de cópia) |

**Segurança:**
- escuta só em `127.0.0.1` e valida o `Host`;
- pedidos de escrita exigem o token e recusam `Origin`/`Sec-Fetch-Site` de outro site;
- envia CSP restritiva;
- tem limites de tamanho por rota.

Detalhes em [SECURITY.md](../SECURITY.md).

## Interface (`app/js/`)
| Módulo | Responsabilidade |
|---|---|
| `main.js` | galeria com pastas e lixeira, rotas (`#/`, `#/p/<pasta>`, `#/lixeira`, `#/b/<id>`), importação, sessão |
| `editor.js` | o quadro: ferramentas, entrada da caneta, seleção, histórico, salvamento, páginas, ferramentas de professor. O índice das seções está no topo do arquivo |
| `render.js` | desenho de cada tipo de item, contorno do traço (largura variável), caixas, toque, girar, tinta→forma |
| `paper.js` | 58 tipos de folha em 13 grupos por área (`PAPER_GROUPS`, `PAPER_DISC`, `PAPER_PREVIEW`; desenhados só na área visível) |
| `pages.js` | caderno/slides: geometria das páginas, mesa com folhas, PDF e impressão |
| `stabilizer.js` | estabilizador do traço (One Euro, fio puxado, filtro de pressão, suavização) |
| `beautify.js` | embelezar escrita (linha de base, inclinação, altura, espaçamento) |
| `plot.js` | interpretador de expressões (sem `eval`, com parâmetros declarados), curva, eixos desenhados (`axesStrokes`), escala própria (`fitFrame`) e animação de parâmetro |
| `fnmodels.js` | catálogo de funções-modelo por área (expressão, parâmetros com faixa, eixos com unidade, nota) |
| `importer.js` | PowerPoint/PDF → páginas com o slide travado no fundo |
| `tools.js` | cronômetro, fórmulas (KaTeX), chamada do reconhecimento de escrita |
| `library.js` | tabela periódica e vidrarias em SVG |
| `shapelib.js`, `shapes/*.js` | biblioteca de formas técnicas: um arquivo por disciplina (`{id, nome, secoes}`), formato e convenções em `shapes/base.js`; entra no quadro como imagem SVG na cor da caneta |
| `bars.js` | barras móveis: cadeado, arrastar e posição guardada (`localStorage` `lousa.bars`) |
| `tablet.js` | painel "Caneta e escrita" (mesa, estabilizador, teste e gravação de amostras) |
| `ui.js`, `icons.js`, `fluent-icons.js`, `api.js`, `version.js` | utilidades, ícones, comunicação, versão |

## Modelo de dados (arquivo do quadro)
```json
{ "version": 2, "title": "Aula 1", "folder": "Tratamento de Água",
  "background": { "color": "#ffffff", "pattern": "grid", "size": "m", "strength": "normal", "origin": {"x":0,"y":0} },
  "layout": { "mode": "pages", "kind": "a4", "w": 794, "h": 1123, "gap": 48, "count": 3 },
  "view": { "x": 0, "y": 0, "zoom": 1 },
  "items": [ … ] }
```
- **`layout` ausente:** quadro livre. As páginas são faixas do mesmo mundo, empilhadas na vertical.
- **Itens:**
  - `stroke` (`pts` = `[x, y, pressão, …]`, `pr`, `taper`, `style`, `orig`);
  - `shape`;
  - `text` (`font`, `ink`);
  - `note`;
  - `image` (`src`, `locked` para slides, `latex` para fórmulas);
  - `rot` opcional em texto, nota e imagem;
  - `grp` opcional: itens com o mesmo `grp` são selecionados e movidos juntos (Agrupar);
  - `eixo: true` nos eixos desenhados pelo Plotar função; `plot` (a expressão) nas curvas.

**Regra de ouro:** os itens são **imutáveis**. Toda edição cria um objeto novo e passa por `commit(items, layout)`, que
guarda o estado anterior no desfazer. Os caches (`WeakMap` de caixa e de `Path2D`) dependem disso.

### Salvamento e conflitos

O arquivo do quadro contém `_rev`, inteiro gerido pelo servidor. Arquivos antigos sem esse campo começam em zero.
`PUT /api/boards/<id>` envia a revisão esperada (`revision`); sob a trava do quadro o servidor compara, grava
atomicamente e incrementa a revisão. Responde com `revision`; divergências retornam **412**, sem sobrescrever.
O **409** continua reservado à sessão expirada. Mover de pasta também incrementa a revisão.

O editor mantém a última pendência de cada quadro em um `Map`, serializa tentativas e protege o fechamento enquanto
houver trabalho não confirmado, inclusive na galeria. Conflitos suspendem a repetição automática e orientam exportar
a edição como `.lousa` antes de recarregar. As pendências são em memória; não há garantia de recuperação após queda
do processo ou do sistema. Exportações/cópias portáteis retiram `_rev`, e importações começam uma revisão própria.

Importações assíncronas comparam a referência da abertura, não apenas o ID: fechar e reabrir o mesmo quadro também
cancela uma operação anterior. Exportações capturam conteúdo e título antes de esperar.

Pastas vazias ficam em `localStorage`, por pasta de dados do servidor e perfil do navegador; pastas com quadros
continuam representadas por `folder`. Perfis diferentes não compartilham os nomes de pastas vazias.

## Biblioteca de formas técnicas

Cada disciplina exporta `{ id, nome, destaques, secoes }` em `app/js/shapes/`. A tupla de cada forma é
`[id, nome, largura, altura, corpoSVG]`. O registro em `shapelib.js` e a área em `disciplinas.js` precisam acompanhar
uma disciplina nova. `destaques` contém somente IDs da própria disciplina. IDs antigos são permanentes: quadros
salvos usam `image.lib` para identificar a forma, além de guardar o SVG em `image.src`.

O corpo herda `fill="none"`, traço 2,5 e cantos arredondados. `#C` representa a cor escolhida, incluindo textos e
partes cheias; detalhes podem usar traço 1,4–1,8. Não usar imagens rasterizadas, scripts, recursos externos,
gradientes ou cores fixas. Os caminhos são autorais. Preferir texto legível a partir de 14 px, margens de pelo menos
4 px e um viewBox maior quando necessário, em vez de comprimir um esquema complexo. Ao ampliar geometria por
transformação, preservar o peso do traço; `vector-effect="non-scaling-stroke"` nas primitivas pode ser usado para isso.

A forma entra como imagem: pode ser movida, girada, redimensionada e recolorida. Campos vazios recebem Texto/caneta;
legendas internas continuam no SVG. Pontas alinhadas ajudam a montar esquemas, mas não são conexões automáticas.

O QA deve combinar XML/decodificação, IDs/destaques, cor, inserção/desfazer e inspeção visual com recorte real
(`img` ou `overflow:hidden`). Fonte pequena e `getBBox` são indicadores de triagem, não vereditos. Conferir também
sentidos de fluxo, zonas de curvas, nomes, unidades, balanços, pinagem e limites de exemplos em fontes primárias.
Sinalização estilizada e esquemas didáticos não devem ser apresentados como símbolos certificados ou projetos
dimensionados. Preservar o ID ao corrigir uma forma existente.

## Testes
```bash
node tests/testes.mjs
python tests/test_server.py
```
Os testes cobrem desenho dos traços, interpretador de funções, estabilizador, embelezar e tabela periódica. Para testar a
interface, rode o servidor numa pasta de dados descartável:
```bash
python server.py --sem-janela --porta 8799 --dados /tmp/giz-teste
```
O driver `scripts/teste-cdp/cdp.mjs` cria perfil e porta CDP próprios e devolve código diferente de zero diante de
`FALHA`, exceção ou erro de JavaScript. `GIZ_TEST_URL` troca a URL nas suítes `t_v110.mjs`, `t_disciplinas.mjs` e
`t_auditoria.mjs`; `GIZ_BROWSER` permite indicar outro executável Chromium. Usar sempre dados descartáveis.

O exportador público aceita pasta vazia ou espelho reconhecido por `.giz-livre-publico` (migra automaticamente o
espelho canônico anterior). Recusa origem, ancestrais, descendentes, pastas de dados e links/junções no destino.
`python scripts/exportar_publico.py --prever` apenas lista a sincronização prevista, sem copiar, apagar ou gerar hash.

## Empacotamento (Windows)
`installer/build.ps1`:
1. cria um ambiente limpo com as dependências de build fixadas por hash;
2. gera `GizLivre.exe` (PyInstaller, sem UPX), o instalador (Inno Setup) e o zip portátil;
3. verifica tudo no Microsoft Defender e escreve `SHA256SUMS.txt`.

**Versão:** ao mudar, atualize `app/js/version.js`, `server.py` (`VERSAO`), `installer/versao.txt`, `installer/lousa.iss`,
`installer/build.ps1`, `installer/licenca-instalador.txt`, `README.md` e `CHANGELOG.md`.
