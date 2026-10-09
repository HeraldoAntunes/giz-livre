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
| `paper.js` | os 13 tipos de folha (desenhados só na área visível) |
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

## Testes
```bash
node tests/testes.mjs
```
Os testes cobrem desenho dos traços, interpretador de funções, estabilizador, embelezar e tabela periódica. Para testar a
interface, rode o servidor numa pasta de dados descartável:
```bash
python server.py --sem-janela --porta 8799 --dados /tmp/giz-teste
```

## Empacotamento (Windows)
`installer/build.ps1`:
1. cria um ambiente limpo com as dependências de build fixadas por hash;
2. gera `GizLivre.exe` (PyInstaller, sem UPX), o instalador (Inno Setup) e o zip portátil;
3. verifica tudo no Microsoft Defender e escreve `SHA256SUMS.txt`.

**Versão:** ao mudar, atualize `app/js/version.js`, `server.py` (`VERSAO`), `installer/versao.txt`, `installer/lousa.iss`,
`installer/build.ps1`, `installer/licenca-instalador.txt`, `README.md` e `CHANGELOG.md`.
