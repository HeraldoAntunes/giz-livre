# Componentes de terceiros

O Giz Livre é distribuído sob a licença MIT (ver `LICENSE`). Ele inclui ou usa os componentes abaixo, cada um com a
sua própria licença, todas compatíveis com uso e redistribuição livres. No programa instalado, os textos das licenças ficam
na pasta `licencas\`.

| Componente | Versão | Uso no Giz Livre | Licença | Texto da licença |
|---|---|---|---|---|
| **pdf.js** (Mozilla) | 4.10.38 | importar PDF como páginas | Apache License 2.0 | `app/vendor/pdfjs/LICENSE` |
| **KaTeX** (Khan Academy) e fontes KaTeX | 0.16.11 | fórmulas LaTeX | MIT | `app/vendor/katex/LICENSE` |
| **Fluent UI System Icons** (Microsoft) | 1.1.343 | ícones da interface | MIT | `app/vendor/fluent/LICENSE` |
| **Python** (Python Software Foundation) | 3.13 | servidor local; vai embutido no executável | PSF License Agreement | `licencas/python-LICENSE.txt` |
| **libffi** | junto com o Python 3.13 | `ctypes` (janelas de aviso do Windows) | MIT | incluída em `licencas/python-LICENSE.txt` |
| **Microsoft Visual C++ Runtime** (`VCRUNTIME140.dll`) | junto com o Python 3.13 | requisito do Python no Windows | redistribuível da Microsoft | termos da Microsoft para redistribuíveis do Visual Studio |
| **PyInstaller** (bootloader) | 6.11.1 | gera o `GizLivre.exe` | GPL 2.0 com exceção para o bootloader: permite distribuir o executável gerado sob qualquer licença | https://github.com/pyinstaller/pyinstaller |
| **Inno Setup** (Jordan Russell e Martijn Laan) | 6.7.3 | gera o instalador | Licença do Inno Setup (uso gratuito, inclusive comercial) | https://jrsoftware.org/files/is/license.txt |

O executável é gerado **sem** os módulos de SSL, bzip2, lzma e decimal do Python, porque o programa não os usa. Assim,
OpenSSL, bzip2, xz e libmpdec não fazem parte do pacote.

**Recursos do Windows usados, sem redistribuição:** Microsoft PowerPoint (opcional, via automação COM, para converter
`.pptx`), o reconhecedor de manuscrito do Windows (Windows Ink) e o navegador Microsoft Edge ou Google Chrome. Eles precisam
estar instalados no computador e seguem as licenças dos seus fabricantes.

As marcas citadas (Microsoft, Windows, PowerPoint, Whiteboard, OneNote, Wacom, Intuos etc.) pertencem aos seus donos. O
Giz Livre é um projeto independente, sem vínculo com essas empresas.
