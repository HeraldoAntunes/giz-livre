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
| **Python** (Python Software Foundation) | 3.13 | servidor local; vai embutido no executável | PSF License Agreement | `licencas/python-LICENSE.txt` |
| **libffi** | junto com o Python 3.13 | `ctypes` (janelas de aviso do Windows) | MIT | incluída em `licencas/python-LICENSE.txt` |
| **Microsoft Visual C++ Runtime** (`VCRUNTIME140.dll`) | junto com o Python 3.13 | requisito do Python no Windows | redistribuível da Microsoft | termos da Microsoft para redistribuíveis do Visual Studio |
| **PyInstaller** (bootloader e *runtime hooks*) | 6.22.3 | gera o `GizLivre.exe` | bootloader: GPL 2.0 com exceção, que permite distribuir o executável gerado sob qualquer licença; *runtime hooks* embutidos: Apache License 2.0 | https://github.com/pyinstaller/pyinstaller (arquivo COPYING.txt) |
| **Inno Setup** (Jordan Russell e Martijn Laan) | 6.7.3 | gera o instalador | Licença do Inno Setup (uso gratuito, inclusive comercial) | https://jrsoftware.org/files/is/license.txt |

**Formas e ícones da biblioteca:** não são de terceiros. As 3.379 formas de `app/js/shapes/` e os desenhos de
`app/js/library.js` foram desenhados para o Giz Livre e estão sob a licença MIT do projeto (ver a seção "Autoria das
formas e ícones" do README).

O executável é gerado **sem** os módulos de bzip2, lzma e decimal do Python, porque o programa não os usa. Assim,
bzip2, xz e libmpdec não fazem parte do pacote. Desde a 1.10.0, o **OpenSSL 3** (libssl e libcrypto, junto com o
Python) vai no pacote: a atualização pelo programa baixa a versão nova do GitHub por HTTPS. Licença Apache 2.0, em
`licencas/openssl-LICENSE.txt`.

**Recursos do Windows usados, sem redistribuição:** Microsoft PowerPoint (opcional, via automação COM, para converter
`.pptx`), o reconhecedor de manuscrito do Windows (Windows Ink) e o navegador Microsoft Edge ou Google Chrome. Eles precisam
estar instalados no computador e seguem as licenças dos seus fabricantes.

As marcas citadas pertencem aos seus donos; o Giz Livre é um projeto independente, sem vínculo com elas.
