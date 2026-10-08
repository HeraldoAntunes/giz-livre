# Histórico de versões

## 1.0.1 (08/10/2026)
- **Correções importantes:**
  - traços de **marca-texto** e de **mouse** quebravam o desenho do quadro (falha da 1.0.0);
  - textos e notas apareciam deslocados no modo caderno/slides.
- **Novo:** **Plotar função** (Ferramentas → Plotar função). Você digita `x^2 - 4`, `2sen(x)`, `1/x`… e o gráfico é
  desenhado no plano cartesiano, na escala da grade, cortando as descontinuidades.
- **Novo: Linux e macOS (experimental).**
  - script `giz-livre.sh`;
  - janela no Chrome/Chromium/Edge;
  - PowerPoint convertido pelo **LibreOffice**, que também serve no Windows sem Office.
- O botão "Converter em texto" só aparece onde existe o reconhecedor de escrita (Windows).
- **Página do projeto:** capturas de tela, botão de download, requisitos por sistema, perguntas frequentes e modelos de
  *issue*.
- **Para desenvolvedores:**
  - suíte de testes (`node tests/testes.mjs`, 31 testes);
  - guia de arquitetura (`docs/ARQUITETURA.md`).

## 1.0.0 (08/10/2026): primeira versão pública
- **Quadro:**
  - quadro livre infinito no estilo do Microsoft Whiteboard;
  - canetas com pressão, marca-texto, laser, borracha (de traço inteiro ou parcial), laço, régua e formas;
  - notas, texto, imagens, desfazer/refazer e salvamento automático.
- **Mesa digitalizadora:**
  - Windows Ink;
  - botão lateral configurável e ponta-borracha;
  - estabilizador em camadas (filtro de posição, fio puxado, pressão, afinar pontas, suavizar);
  - painel de teste com gravação de amostras.
- **Escrita:**
  - embelezar escrita automático e incremental (Suave / Moderado / Forte);
  - estilos de caneta (tinteiro, caligrafia, pincel);
  - escrita à mão → texto (reconhecedor do Windows, pt-BR, offline).
- **Folhas:** 13 tipos (quadriculada, milimetrada, pautada, caderno, caligrafia, isométrica, hexagonal, plano cartesiano,
  polar, pauta musical, Cornell…), com tamanho, intensidade e cores; em fundo escuro, a tinta preta aparece branca.
- **Caderno A4 e slides:**
  - páginas A4/A3/16:9;
  - exportar PDF e imprimir;
  - importar PowerPoint e PDF com o slide travado no fundo;
  - modo apresentação e modo aula (Tab).
- **Ferramentas de professor:** lupa de escrita, transferidor, compasso, cortina, holofote, cronômetro, fórmulas LaTeX
  (KaTeX) e biblioteca (tabela periódica e vidrarias).
- **Segurança:**
  - servidor só local com validação de `Host` e de entrada;
  - gravação atômica e lixeira;
  - gravação de emergência ao fechar.
- **Instalador para Windows**, com atalhos e quadros guardados em *Documentos*.
