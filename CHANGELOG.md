# Histórico de versões

## 1.2.1 (09/10/2026)
Inclui tudo da 1.2.0 (abaixo), que não chegou a ser publicada.
- Biblioteca ampliada para **3.379 formas em 29 disciplinas**: 326 novas e 194 antigas corrigidas, preservando os IDs e o padrão SVG recolorível.
- Novas disciplinas Recursos Hídricos e Topografia. Ampliação de recalque, tratamento de água/esgoto, dosagem e mistura, coagulantes e cloração, elétrica, eletrônica, embarcados e energias renováveis.
- Curadoria técnica de fórmulas, curvas estatísticas, perfis hidráulicos, rótulos e margens; modelos preenchíveis nas demais disciplinas. Revisão visual registrada de 927 formas.
- Catálogo completo validado como XML/imagem; todas as 520 formas novas ou corrigidas verificadas por inserção, cor e desfazer/refazer no navegador.
- Salvamento mantém uma pendência por quadro e protege o fechamento quando há alterações não confirmadas.
- Revisão do arquivo impede que uma janela sobrescreva silenciosamente a edição de outra; conflitos pedem exportação da edição antes de recarregar. Arquivos antigos migram ao salvar.
- Importações de imagens, PDF/PowerPoint, fórmulas e reconhecimento de escrita conferem a abertura de origem; exportações mantêm título e conteúdo capturados no início.
- Curvas são recortadas geometricamente, sem patamares artificiais; modelos ajustam a faixa vertical aos parâmetros e ao envelope amostrado da animação.
- Exportar `.lousa` recusa imagens ausentes/inválidas. Cópias e importações começam revisão própria.
- Catálogo mantém sua vista ao ordenar; busca informa quantos resultados exibe e oferece carregar mais. Pastas vazias persistem no perfil local por pasta de dados.
- Ícones de **⚑ Mais usadas** e **↺ Recentes** no lugar da estrela.
- Novos testes automáticos de interface e do servidor.

## 1.2.0 (não publicada; incluída na 1.2.1)
Biblioteca para todas as áreas, a partir dos cursos do IFCE Limoeiro do Norte e das disciplinas básicas.
- **3.053 formas em 27 disciplinas** (eram 1.384 em 12). Novas abas: Biologia, Física, Matemática e Geometria,
  Geografia, História, Filosofia e Sociologia, Língua Portuguesa, Música, Empreendedorismo e Gestão, Ciência da
  Computação (com desenvolvimento web), Agronomia, Tecnologia de Alimentos (com panificação), Nutrição, Educação Física
  e Mecânica e Mecatrônica. Todas desenhadas para o Giz Livre (licença MIT).
- **"⚑ Mais usadas"** no topo de cada disciplina e **"↺ Recentes"** (as últimas 24 formas inseridas).
- **Menu Formas em dois níveis:** áreas e, embaixo, as disciplinas da área; com poucas disciplinas, uma linha só.
- **"O que você ensina?":** na primeira abertura, o professor escolhe as disciplinas que aparecem no menu (todas ficam
  instaladas e a busca encontra todas); dá para mudar em ⋯ → Disciplinas das formas.
- **Catálogo "Formas" na galeria:** todas as disciplinas em cartões, a página de cada uma e a busca.
- **58 folhas** (eram 13), em abas por área: diagrama de Moody, granulometria, semilog e log-log, probabilidade normal,
  Gumbel, Weibull, carta de Smith, osciloscópio, Bode, diagrama fasorial, desenho técnico, ternário, eixos 3D, círculo
  trigonométrico, folha de código, teste de mesa, quadro de Punnett, campo de microscópio, folha de redação, HQ,
  storyboard, tablatura, pauta de piano, linha do tempo, latitude/longitude, Canvas, Kanban, calendário, planner,
  croqui de área e outras.

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
- **Lixeira na galeria:** quadro excluído pode ser restaurado (e logo após excluir aparece "Desfazer"); botão
  **Nova pasta**; a pesquisa ignora acentos.
- **Lupa de ampliação** (como a do PowerPoint), na apresentação e fora dela (botão na barra de zoom ou tecla Z):
  escolha a área e ela enche a tela; Esc volta.
- **Lupa de escrita móvel:** a caixa no quadro arrasta inteira ou vai para onde você tocar; o painel sobe e desce.
- **Relógio com calendário do mês.**
- **Animação de funções:** dá para escolher o valor do parâmetro à mão (controle ou digitado) e fixar exatamente
  esse valor.
- **Barra do professor** à esquerda ou à direita, com ou sem os nomes; **Voltar ao layout padrão** no menu ⋯.
- **PDF:** botão na coluna da esquerda e arrastar o PDF/PowerPoint para o quadro.
- **Menu de formas** com botão Ampliar e busca que mostra a disciplina de cada forma.
- **Revisão de interface:** alça de girar livre da barra da seleção, modo aula com botão "Mostrar barras", aviso
  visível se não conseguir salvar, dicas com os atalhos reais, alvos maiores para a caneta, troca de folha no desfazer.
- **Licenças:** as fontes do KaTeX (SIL Open Font License 1.1) e o OpenJPEG (BSD), que vem dentro do pdf.js, agora
  têm o aviso e o texto da licença no programa, no instalador e no repositório.
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
