# Histórico de versões

## 1.1.0 (09/10/2026)
Pedidos do professor depois do primeiro uso real (09/10/2026).
- **Borracha com tamanho:** P, M, G, GG ou controle deslizante (de 3 a 120 px), no menu da borracha.
- **Ponteiro da caneta também no mouse** (ponta, mira, ponto ou bolinha) no lugar da cruz; dá para desligar no menu
  da caneta.
- **Caneta: botão "Restaurar padrão"** (cor, espessura, estilo e ponteiro de fábrica).
- **Limpar a lousa pergunta o quê:** só o que foi escrito (o PDF/slides ficam) ou tudo, inclusive PDF/slides e
  páginas extras. Dá para desfazer.
- **Excluir várias páginas de uma vez:** no painel "Ver todas as páginas", marque as miniaturas e toque em "Excluir";
  cada miniatura também tem a sua lixeira.
- **Cor de fundo com PDF:** a mesa em volta das folhas segue a cor escolhida, e sobre as páginas do PDF a tinta preta
  continua preta mesmo com fundo escuro.
- **Apresentação:** cor e espessura da caneta, liga/desliga de "tinta vira forma" (desligado = desenho livre; era ele
  que transformava traços em reta) e lupa de escrita na mini-bandeja.
- **Ferramentas do professor:** ícone novo (esquadro e lápis) e opção de mostrar todas abertas numa barra própria,
  móvel como as outras.
- **Cronômetro com tempo digitado** (7, 7,5 ou 7:30) e **relógio** com a hora do computador.
- **Transferidor com trava:** a caneta perto do arco ou da base corre presa à borda, como na régua.
- **Plotar função:**
  - os eixos agora são desenhados como itens (com números), que dá para apagar ou mover, em vez de trocar a folha
    para plano cartesiano;
  - curva, eixos e rótulo entram agrupados;
  - **modelos prontos por área** (Elétrica, Saneamento e Ambiental, Química, Estatística, Hidráulica e Hidrologia,
    Matemática, Embarcados e sinais), com controles deslizantes para os parâmetros;
  - **animação de um parâmetro** (vai e volta), com pausa, velocidade e "Fixar esta curva".
- **Agrupar e desagrupar** (Ctrl+G / Ctrl+Shift+G, ou pela barra da seleção): clicar num item seleciona o grupo todo.
- **Pastas na galeria** para juntar os quadros de uma disciplina: mover pelo menu ⋯ do quadro, renomear e desfazer a
  pasta (nunca apaga quadros); a pesquisa procura em todas.
- **+682 formas** (de 702 para 1.384), pelo menos 40 a mais em cada disciplina, todas desenhadas para o Giz Livre;
  a aba "Operações unitárias" virou "Química e processos" (as formas antigas mantêm o id).
- **Ícone na barra de tarefas:** a janela passa a se identificar como Giz Livre, e o pino da barra de tarefas abre o
  Giz Livre em vez do Edge.

## 1.0.3 (08/10/2026)
- A versão aparece ao lado do título, na galeria.
- Atalho "Desinstalar o Giz Livre" no Menu Iniciar. A janela Sobre explica como desinstalar e lembra que os quadros
  ficam guardados.

## 1.0.2 (08/10/2026)
- **Biblioteca de formas técnicas** (Formas → abas por disciplina, com seções e busca sem acento): **702 formas**
  desenhadas para o Giz Livre (licença MIT; ver "Autoria das formas e ícones" no README).
  - Fluxograma.
  - Setas e conectores.
  - Operações unitárias.
  - Hidráulica.
  - Saneamento (ETA e ETE).
  - Laboratório.
  - Elétrica.
  - Eletrônica.
  - Sistemas embarcados.
  - Energias renováveis.
  - Estatística e gráficos.
  - Ícones gerais.
- **Formas:** entram na cor escolhida no próprio menu ou na cor da caneta, são recoloridas pela barra de seleção, e a
  borracha apaga a forma ao passar sobre o desenho dela (não leva junto a forma de fundo ao apagar um traço por cima).
- **Limpar a lousa:** botão de lixeira na barra superior e item no menu. Os slides importados ficam, e dá para desfazer.
- **Miniatura da galeria:** mostra o que estava na tela ao sair do quadro, em vez de encolher tudo para caber um
  rabisco perdido longe.
- **Novas formas de desenhar:** linha tracejada, seta dupla e seta tracejada.
- **Ponteiro da caneta no próprio menu da caneta.** Opção de mantê-lo visível enquanto escreve, ligada por padrão.
- O instalador diz "para" em vez de "pra".
- **Barras móveis:** o cadeado no canto superior direito destrava as barras. Arraste cada uma para onde quiser e trave
  de novo. A posição fica guardada, e "Voltar ao padrão" desfaz tudo.
- **Borracha mais rápida:** redesenha só a região apagada, não a tela inteira (cerca de 80 vezes menos desenho por
  quadro num quadro cheio).
- **Ponteiro da caneta com opções** (Caneta e escrita → Ponteiro na tela): ponta de caneta (novo padrão), mira, ponto
  ou a bolinha antiga.
- **Embelezar ao escrever** volta a vir desligado. Continua disponível no botão da barra e em "Embelezar escrita" na
  seleção.
- Correção: cores recentes, modo da borracha e outras escolhas se perdiam ao reabrir o programa.

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
