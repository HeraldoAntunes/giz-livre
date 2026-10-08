# Giz Livre

**Lousa digital livre e offline para dar aula com mesa digitalizadora, caneta, toque ou mouse.**
Nasceu como substituta do Microsoft Whiteboard para Windows, descontinuado em outubro de 2026, e foi além: caderno A4,
slides do PowerPoint com escrita por cima, ferramentas de professor e embelezamento da escrita.

- **Versão:** 1.0.0 (ver [CHANGELOG.md](CHANGELOG.md))
- **Licença:** [MIT](LICENSE): uso, cópia, modificação e distribuição livres e gratuitos
- **Sistema:** Windows 10/11 (o navegador Edge ou Chrome é usado como janela do programa)

> **Aviso:** este é um projeto independente e voluntário, fornecido "no estado em que se encontra", **sem garantia de
> qualquer tipo**. Os autores não se responsabilizam por perda de dados, danos ou mau uso. Faça backup dos seus quadros
> (pasta `quadros`). O projeto não tem vínculo com a Microsoft, a Wacom nem outras empresas citadas.

---

## Recursos
- **Quadro livre infinito**, no estilo do Whiteboard:
  - 4 canetas com pressão, marca-texto, ponteiro laser, borracha (de traço inteiro ou parcial), laço, seleção (mover,
    redimensionar, girar), régua, formas e tinta→forma;
  - notas adesivas, texto, imagens;
  - desfazer/refazer e salvamento automático.
- **Mesa digitalizadora** (Wacom, XP-Pen, Huion, Gaomon, telas com caneta):
  - pressão via Windows Ink, botão lateral configurável e ponta-borracha;
  - **estabilizador modular** contra tremido;
  - painel de teste e diagnóstico.
- **Escrita mais bonita:**
  - embelezar automático (endireita a linha, corrige a inclinação, iguala altura e espaçamento);
  - estilos tinteiro, caligrafia e pincel;
  - **escrita à mão → texto** com fonte cursiva (reconhecedor do Windows, em português, offline).
- **13 tipos de folha:** quadriculada, milimetrada, pontilhada, pautada, caderno, caligrafia, isométrica, hexagonal,
  plano cartesiano, polar, pauta musical, Cornell.
- **Caderno A4** (e A3, 16:9): páginas prontas para **imprimir e exportar PDF**.
- **Slides:** abra um **PowerPoint** ou **PDF**; cada slide vira uma página para escrever por cima. **Modo apresentação**
  passa com as setas ou com o passador.
- **Ferramentas de professor:** lupa de escrita (escreve grande, cai pequeno), transferidor, compasso, cortina, holofote,
  cronômetro, **fórmulas LaTeX** e biblioteca (tabela periódica, vidrarias).
- **Privacidade:** tudo fica no seu computador. Sem internet, sem conta, sem telemetria.

## Instalação

### Opção 1: instalador (recomendado)
1. Baixe `Instalar-GizLivre-1.0.0.exe` na página de *Releases*.
2. Confira o SHA-256 (opcional, mas recomendado):
   ```bash
   certutil -hashfile Instalar-GizLivre-1.0.0.exe SHA256
   ```
   Compare com `SHA256SUMS.txt`.
3. Rode o instalador. Ele **não precisa de administrador** e cria atalhos na Área de Trabalho e no Menu Iniciar.
   Os quadros ficam em `Documentos\Giz Livre\quadros`.

O Windows pode avisar "editor desconhecido" (SmartScreen), porque o programa não tem assinatura digital paga. Clique em
*Mais informações → Executar assim mesmo*. Veja [SECURITY.md](SECURITY.md).

### Opção 2: a partir do código (precisa de Python 3.10+)
```bash
git clone <url-do-repositorio>
```
Depois dê dois cliques em `Giz Livre.bat`, ou rode:
```bash
python server.py
```
Não há dependências: só a biblioteca padrão do Python.

## Uso rápido
Veja o [Guia de uso](docs/GUIA-DE-USO.md). Os principais atalhos:

| Tecla | Ação | Tecla | Ação |
|---|---|---|---|
| `1`–`4` / `P` | canetas | `E` | borracha |
| `H` | marca-texto | `L` / `V` | laço / selecionar |
| `K` | laser | `R` | régua |
| `T` | texto | `[` `]` | espessura |
| `Ctrl+Z` / `Ctrl+Y` | desfazer / refazer | `Espaço` + arrastar | mover o quadro |
| `Ctrl+0` | ajustar à tela | `Tab` | modo aula (esconde as barras) |
| `PageUp`/`PageDown` | página anterior/próxima | `F11` | tela cheia |

### Mesa digitalizadora (Wacom)
Em *Propriedades da Mesa Wacom* → **Mapeamento**:
- marque **Usar Windows Ink**;
- na Intuos (mesa sem tela), mapeie para **um monitor só** e marque **Forçar proporções**.

Depois abra **Caneta e escrita** no Giz Livre e escreva na área de teste.

### Trazer quadros do Microsoft Whiteboard
Exporte cada quadro como imagem no Whiteboard. Na galeria do Giz Livre, use **Importar**: cada imagem vira um quadro.

## Tecnologias
- **Interface:** HTML, CSS e JavaScript puro (módulos ES), desenhada em `<canvas>`, sem build e sem frameworks.
- **Servidor local:** Python, só biblioteca padrão (`http.server`), em `127.0.0.1`.
- **Bibliotecas embutidas:** pdf.js (Mozilla), KaTeX, Fluent UI System Icons (Microsoft). Ver
  [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
- **Recursos do Windows:** Windows Ink (caneta e reconhecimento de escrita) e PowerPoint via COM (opcional, para `.pptx`).
- **Empacotamento:** PyInstaller (executável) e Inno Setup (instalador).

## Estrutura
```
server.py              servidor local (API dos quadros, PDF, PowerPoint, reconhecimento de escrita)
app/                   interface (index.html, style.css, js/, vendor/)
  js/editor.js         ferramentas, entrada da caneta, seleção, histórico, salvamento
  js/render.js         desenho dos itens, contorno do traço, geometria
  js/pages.js          caderno/slides, PDF e impressão
  js/stabilizer.js     estabilizador do traço       js/beautify.js   embelezar escrita
  js/paper.js          tipos de folha                js/tools.js      cronômetro, fórmulas, escrita→texto
  js/importer.js       PowerPoint/PDF                js/library.js    tabela periódica e vidrarias
installer/             receita do executável e do instalador
docs/                  guia de uso
```

## Contribuir
Sugestões e correções são bem-vindas por *issues* e *pull requests*. Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença
[MIT](LICENSE) © 2026 Heraldo Antunes. Software livre: pode usar, copiar, modificar e distribuir, inclusive em escolas e
instituições, sem custo, mantendo o aviso de licença.
