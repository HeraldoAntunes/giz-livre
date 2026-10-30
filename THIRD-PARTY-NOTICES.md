# Componentes de terceiros

O Giz Livre é distribuído sob a licença MIT (ver `LICENSE`). Ele inclui ou usa os componentes abaixo, cada um com a
sua própria licença, todas compatíveis com uso e redistribuição livres. No programa instalado, os textos das licenças ficam
na pasta `licencas\`.

| Componente | Versão | Uso no Giz Livre | Licença | Texto da licença |
|---|---|---|---|---|
| **pdf.js** (Mozilla) | 4.10.38 | importar PDF como páginas | Apache License 2.0 | `app/vendor/pdfjs/LICENSE` |
| **OpenJPEG** (Université catholique de Louvain e outros), dentro do `pdf.worker.min.mjs` | junto com o pdf.js 4.10.38 | imagens JPEG 2000 dentro de PDFs | BSD de 2 cláusulas | `app/vendor/pdfjs/OPENJPEG-LICENSE.txt` |
| **KaTeX** (Khan Academy) | 0.16.11 | fórmulas LaTeX | MIT | `app/vendor/katex/LICENSE` |
| **Fontes do KaTeX** (Design Science / MathJax e Khan Academy) | 0.16.11 | letras das fórmulas | SIL Open Font License 1.1 | `app/vendor/katex/fonts/OFL.txt` |
| **Fluent UI System Icons** (Microsoft) | 1.1.343 | ícones da interface | MIT | `app/vendor/fluent/LICENSE` |
| **Natural Earth** (dados geográficos 1:50m) | baixado em 15/10/2026 | contornos precisos do Brasil (com regiões e estados), continentes e planisfério (`app/js/shapes/geo-contornos.js`, simplificados) | domínio público | https://www.naturalearthdata.com/about/terms-of-use/ |
| **Bandeira do Brasil** (Wikimedia Commons, `File:Flag_of_Brazil.svg`) | versão de 09/08/2024 | ao lado do nome no Sobre e no README (`app/bandeira-brasil.svg`, sem alteração) | domínio público (símbolo nacional; uso conforme a Lei 5.700/1971) | https://commons.wikimedia.org/wiki/File:Flag_of_Brazil.svg |
| **Python** (Python Software Foundation), pacote embutido oficial do python.org | 3.13.15 | servidor local, na pasta `python\` (sem alterações) | PSF License Agreement | `licencas/python-LICENSE.txt` |
| Componentes que vêm com o Python oficial: **OpenSSL 3**, **libffi**, **bzip2**, **xz (lzma)**, **libmpdec**, **SQLite**, **expat** e **zlib** | junto com o Python 3.13.15 | HTTPS da atualização (OpenSSL), `ctypes` (libffi) e módulos padrão | Apache 2.0 (OpenSSL), MIT, BSD, domínio público e outras, cada uma no texto do Python | `licencas/python-LICENSE.txt` e `licencas/openssl-LICENSE.txt` |
| **Microsoft Visual C++ Runtime** (`vcruntime140.dll`) | junto com o Python 3.13.15 | requisito do Python no Windows | redistribuível da Microsoft | termos da Microsoft para redistribuíveis do Visual Studio |
| **Tauri 2** e as bibliotecas Rust da janela (`GizLivre.exe`) | ver o arquivo ao lado | janela própria do programa | MIT, Apache 2.0 e outras (cinco em MPL 2.0, com o código-fonte em crates.io) | `THIRD-PARTY-NOTICES-JANELA.md` (lista e textos completos) |

**Formas e ícones da biblioteca:** não são de terceiros. As 3.527 formas de `app/js/shapes/` e os desenhos de
`app/js/library.js` foram desenhados para o Giz Livre e estão sob a licença MIT do projeto (ver a seção "Autoria das
formas e ícones" do README).

Desde a 1.16.0, o programa não usa mais o PyInstaller nem o Inno Setup: a janela é o `GizLivre.exe` (Tauri 2) e o
servidor roda no pacote embutido oficial do Python, que vai inteiro e sem alterações na pasta `python\`.

**Recursos do Windows usados, sem redistribuição:** Microsoft PowerPoint (opcional, via automação COM, para converter
`.pptx`), o LibreOffice (opcional, para converter apresentações sem o PowerPoint), o reconhecedor de manuscrito do Windows
(Windows Ink) e o **WebView2** do Windows, que mostra a janela do programa (vem no Windows 11 e nos Windows 10
atualizados). Eles precisam estar instalados no computador e seguem as licenças dos seus fabricantes. Na cópia do
código-fonte (sem a janela própria), a interface abre no Microsoft Edge ou no Google Chrome.

As marcas citadas pertencem aos seus donos; o Giz Livre é um projeto independente, sem vínculo com elas.
