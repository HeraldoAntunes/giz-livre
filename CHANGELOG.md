# Histórico de versões

## 1.15.1 (28/10/2026)
O Giz Livre não some mais quando o navegador cai.
- **Navegador caindo:** se o navegador que mostra o Giz Livre cair (aconteceu em 28/10/2026 com o Edge, por causa de um
  módulo de segurança de banco), o programa reabre a janela sozinho: primeiro num perfil do navegador só dele e, se
  cair de novo, em outro navegador instalado (Chrome). Um aviso na tela diz o que aconteceu.
- **Nada se perde com a janela muda:** o programa não se encerra sozinho enquanto o último sinal da janela era de um
  quadro aberto ou de uma edição ainda não salva (antes, encerrava depois de 3 minutos sem sinal).
- **Ajustes guardados no programa:** canetas, barras, pastas e áreas das formas ganham uma cópia em
  `preferencias.json`; uma janela num navegador ou perfil novo recebe tudo de volta.
- **Registro de abertura e encerramento** em `Documentos\Giz Livre\giz-livre.log`, com o motivo de cada encerramento.

## 1.15.0 (28/10/2026)
Atalho e opções para limpar o quadro, renomear sem conflito e um teste novo da atualização.
- **Atalho para limpar o quadro:** a tecla **Del** sem nada selecionado abre "Limpar o quadro", sempre com a pergunta
  antes (e o Ctrl+Z desfaz).
- **Limpar só a página da tela:** nos quadros com várias páginas, "Limpar o quadro" oferece apagar só o que foi escrito
  na página que está na tela; as outras páginas ficam como estão.
- **Renomear ou mover um quadro aberto em outra janela:** antes, a janela com o quadro aberto passava a avisar
  "conflito" e parava de salvar. Agora ela continua salvando normalmente e passa a mostrar o nome novo.
- Teste novo, de ponta a ponta, do botão **Baixar e instalar** do Sobre, rodado antes de cada versão (é o que teria
  pegado o defeito da 1.14.2).

## 1.14.4 (28/10/2026)
Correção.
- **Atualização pelo Sobre:** na 1.14.2 e na 1.14.3, o botão **Baixar e instalar** mostrava "quadroAqui is not defined" e
  não instalava nada. Quem está nessas duas versões precisa baixar o instalador da 1.14.4 na página de downloads e rodar
  à mão, uma vez; os quadros ficam como estão. Da 1.14.4 em diante, o botão volta a funcionar.
- **Notas da versão no Sobre:** aparecem formatadas, com lista e negrito, em vez das marcas de texto cru.

## 1.14.3 (28/10/2026)
Texto.
- **Privacidade, no Sobre e no README:** agora diz por inteiro o que acontece na atualização pelo programa: em
  **Baixar e instalar**, ele baixa o instalador do GitHub e confere se o arquivo é o original antes de abrir. O README
  também explica que o programa só atende o próprio computador e que os agentes de IA usam um código de acesso que o
  Giz Livre cria e guarda.

## 1.14.2 (28/10/2026)
Correções.
- **Imagens dos quadros protegidas:** a limpeza automática de imagens sem uso podia apagar imagens de um quadro que não
  conseguiu ler naquele momento (por exemplo, um quadro guardado só na nuvem do OneDrive, com o computador sem internet).
  Agora, se algum quadro não se lê, nada é apagado.
- **Atualização pelo programa mais segura:** ela não começa se o quadro aberto não conseguiu ser salvo, nem se há um
  quadro aberto em outra janela do Giz Livre (o aviso pede para voltar à galeria nela).
- **Renomear pela galeria:** quando não dá para renomear, aparece um aviso em vez de nada acontecer.
- **Teclado e leitor de tela:** Enter no botão "…" de um cartão abre o menu (antes abria o quadro); cartões e janelas de
  diálogo passam a ter nome para o leitor de tela.
- **Fórmulas:** ao editar uma fórmula com "&", ela volta exatamente como foi escrita.
- **Sobre:** diz onde ficam os quadros também na versão portátil.
- Agentes de IA: pedido com campo de tipo errado recebe uma recusa clara, em vez de a conexão cair.

## 1.14.1 (27/10/2026)
Correção.
- **Atualização pelo programa:** depois de instalar a versão nova, a janela antiga continuava aberta ao lado da nova.
  Agora ela se fecha sozinha assim que a nova aparece. Vale também para quem atualiza a partir da 1.13.0 ou da 1.14.0.

## 1.14.0 (27/10/2026)
Esquadro, calculadora, encaixe na grade e formas da galeria direto no quadro.
- **Formas da galeria vão direto para um quadro:** tocar numa forma da vitrine ou do catálogo da galeria abre um menu
  com "Pôr num quadro novo", os 5 quadros mais recentes e um atalho para as outras formas da mesma disciplina. O quadro
  abre com a forma no meio da tela, já selecionada para mover ou mudar de tamanho.
- **Esquadro** de 45° e de 30°/60°, nas ferramentas do professor: arrasta pelo corpo, gira pela bolinha da ponta e a
  caneta corre presa aos lados, como na régua. Um toque no ângulo escrito nele troca o modelo.
- **Calculadora** nas ferramentas do professor: em graus ou radianos, com sen, cos, tg, raiz, ln, log, π e Ans; o
  resultado pode ir para o quadro.
- **Encaixe na grade:** com o botão de grade da barra da seleção ligado, o que você move ou aumenta cai na linha mais
  próxima da folha (nas folhas sem malha, numa grade invisível). O giro pode parar de 15° em 15° ou de 45° em 45°,
  sem teclado.
- **Segurar para virar forma:** em "Tinta vira forma", a opção *Ao segurar a caneta parada no fim* só troca o traço
  pela forma perfeita quando a caneta fica parada meio segundo antes de levantar; o resto continua desenho livre.
- **Imagem da seleção:** baixar em PNG só o que está selecionado (com ou sem fundo) ou copiar para colar em outro
  programa.
- **Bandeira do Brasil** ao lado do nome do programa, no Sobre e na página do projeto.
- Correção: ao fechar o cronômetro ou o relógio pelo X, o botão da barra do professor continuava aceso.

## 1.13.0 (27/10/2026)
Galeria que se atualiza sozinha e registro no INPI.
- **Galeria sempre em dia:** quando outro programa cria ou muda um quadro (um agente de IA ou o Giz na Tela, ao
  mandar a tela para o Giz), ele aparece na galeria aberta em poucos segundos, sem precisar recarregar. Menus e
  janelas abertos não são interrompidos.
- **Registro no INPI:** o programa está registrado no INPI sob o nº BR 51 2026 009384-8; o Sobre e o texto do
  instalador agora dizem isso.
- **Ícone novo em tudo:** a aba do navegador e os atalhos do Windows passam a mostrar o ícone da lousa verde logo
  depois da instalação (antes alguns lugares ainda mostravam o ícone antigo).
- **Escrita à mão → texto:** a fonte escolhida passa a ser conferida numa lista fixa antes de entrar na janela.
- Ferramenta usada só para montar o instalador atualizada por segurança.

## 1.12.1 (26/10/2026)
Correção.
- **Atualização pelo programa:** ao clicar em Baixar e instalar, o programa mostrava "Instalando", fechava e nada
  mudava. O instalador começava com o Giz Livre ainda aberto, não conseguia fechá-lo e desistia sem avisar. Agora ele
  fecha o programa antigo e termina a instalação. A correção vale também para quem está na 1.11.0 ou na 1.12.0, porque
  fica no instalador novo.

## 1.12.0 (26/10/2026)
Levar os quadros para outro computador, atualização acompanhada e ícone novo.
- **Levar quadros** (botão na galeria): guarda todos os quadros num único arquivo .zip, com miniaturas, pastas e
  imagens, para levar num pen drive ou guardar como cópia de segurança. No outro computador, o mesmo botão traz os
  quadros sem apagar nem sobrescrever nada: quadro igual é pulado, quadro que mudou entra como cópia "(trazido em
  dd/mm)" e trazer o mesmo arquivo de novo não repete nada. O botão também abre a pasta dos quadros e avisa quando
  ela está dentro do OneDrive, que pode trocar um quadro aberto por fora.
- **Atualização pelo programa acompanhada:** a página mostra o andamento da instalação e, se a versão nova não
  responder em 3 minutos, avisa e mostra o link para baixar pela página. Antes podia ficar em "Instalando" sem fim. O
  instalador anota o que fez em `Documentos\Giz Livre\atualizacao.log`.
- **Ícone novo:** lousa verde com moldura de madeira e giz branco. Outras opções de ícone vêm na pasta `icones` do
  programa, para quem quiser trocar o do atalho.
- **Sobre:** a cópia de segurança dos quadros agora aponta para o botão Levar quadros.

## 1.11.0 (22/10/2026)
Formas revisadas, botão para esconder as legendas das formas e avisos para quem usa mesa sem Windows Ink.
- **Botão Legendas:** com uma forma da biblioteca selecionada, um toque esconde os textos do desenho (rótulos e
  nomes das peças) e outro toque mostra de novo. Serve para exercícios de "complete o desenho". Funciona com várias
  formas selecionadas, com a troca de cor, com o Desfazer e ao exportar.
- **Peças de tubulação que se ligam:** válvulas, registros, medidores, bombas e conexões de Hidráulica, Química e
  Saneamento têm agora a entrada e a saída na altura do meio da peça. Postas lado a lado, ligam-se com um tubo reto.
  Nas bombas, a sucção fica no meio e o recalque continua no alto.
- **Letra maior nas formas miúdas:** placas e módulos de Sistemas embarcados e algumas vidrarias entram no quadro
  ampliados, para a menor letra ficar legível na sala.
- **Formas corrigidas:** a válvula esfera (Química) tinha o desenho da válvula globo; o rótulo de Vasco da Gama
  saía cortado no mapa das navegações; 14 formas tinham rótulos em cima de traços (ciclo trigonométrico, átomo de
  Bohr, isotermas, roteiro de projeto e outras); no mapa do Brasil, as siglas dos estados pequenos ficam fora deles,
  com uma linha até o estado; as lentes usam só "F" dos dois lados; a quadra tática para preencher veio sem a letra
  solta no meio.
- **Nomes das formas** sem travessão.
- **Escrita→texto:** o botão só aparece quando o Windows tem o reconhecimento de escrita instalado; se faltar o
  português, o programa diz o que instalar; se o reconhecedor for de outro idioma, avisa.
- **Painel Caneta:** mostra se o último traço veio de caneta, mouse ou dedo e se a pressão chegou. Depois de alguns
  traços de caneta sem pressão, sugere ligar "Usar Windows Ink" no driver da mesa. Sem Windows Ink o programa
  funciona, mas a mesa desenha como mouse, sem pressão.
- O instalador passa a ser gerado com o PyInstaller 6.22.3.

## 1.10.1 (22/10/2026)
Correções.
- **Galeria completa em computador lento:** a galeria pede dezenas de arquivos ao mesmo tempo, e o programa só deixava
  5 esperando; num PC lento, os que sobravam eram recusados e algumas formas especiais podiam faltar até recarregar a
  página. Agora a fila aceita 64.
- **Nomes de quadros e imagens conferidos com mais rigor:** o programa já recusava nomes com `..` ou barras; agora
  recusa também nomes terminados em quebra de linha. Veio da revisão automática de segurança (CodeQL) do GitHub, que
  não achou falha explorável.

## 1.10.0 (21/10/2026)
Ajuda dentro do programa, notas mais fáceis de usar, formas em destaque e atualização pelo próprio programa.
- **Ajuda** (botão **?** no canto de cima, tecla `F1` ou menu `…` → Ajuda): temas como escrever, apagar, slides,
  apresentação e ferramentas, cada um com uma figura feita dos próprios botões do programa, passos curtos e
  **Mostrar na tela**, que destaca o controle de verdade. Funciona sem internet.
- **Tour da primeira vez:** no primeiro quadro, seis balões mostram as barras principais. Dá para pular, rever pela
  ajuda ou desligar.
- **Notas:** a letra nasce num tamanho legível e fixo (antes era "o maior que cabe", que mudava enquanto se escrevia).
  **A−** e **A+** na barra da seleção mudam o tamanho de notas e caixas de texto; a nota cresce para baixo quando o
  texto não cabe e volta ao tamanho quando ele diminui. Ao redimensionar a nota, a letra acompanha. O jeito antigo
  continua como opção: menu Texto → **Ajustar à nota**.
- **Sobre:** o pedido de registro no INPI e como o programa foi feito.
- **Atualização pelo próprio programa:** no Sobre, **Procurar versão nova** responde ali mesmo ("versão mais recente" ou
  "versão X disponível", com as novidades). Na versão instalada, **Baixar e instalar** baixa o instalador da página de
  downloads, confere o SHA-256 publicado, instala por cima e abre o Giz Livre de novo; os quadros não são tocados. Só
  consulta a internet quando se clica.
- **Formas em destaque:** a galeria mostra uma vitrine com amostras das suas áreas (Ver todas abre o catálogo); o
  catálogo do quadro abre na **Vitrine**, com o melhor de cada disciplina, em vez do fluxograma; e a tecla **/** abre
  a busca rápida: digite o nome ("bomba", "béquer") e a forma entra no quadro.
- **Fechar a janela fecha o programa:** antes ele continuava rodando em segundo plano por até 20 minutos; agora se
  encerra segundos depois (no máximo 3 minutos se o aviso da janela não chegar), sem contar o tempo de suspensão do PC.
- O pacote passa a levar o OpenSSL (licença Apache 2.0), usado só pela procura de versão nova, por HTTPS.
- A tradução da licença para o português vai junto no instalador e na versão portátil.

## 1.9.0 (20/10/2026)
Modo apresentador mais completo, lupa ajustável, desfazer sem aviso e enquadramento de slides.
- **Apresentação:** botão próprio de espessura da caneta (ao lado da cor) e botão de formas (linha, seta, seta dupla,
  tracejadas, retângulo, elipse, triângulo), que fica ativo para desenhar várias seguidas.
- **Lupa** (normal e apresentação): − e + na barra escolhem quanto amplia, de 1,5x a 8x (antes só a roda do mouse
  mudava o tamanho); depois de ampliado, + amplia mais. O nível fica guardado. O zoom máximo passou de 8x para 16x.
- **Ctrl+Z** e **Backspace sem seleção** sem os avisos "Desfeito" e "Último item apagado" de fábrica; menu → Avisos de
  desfazer e apagar: desligados, curto (1 s) ou normal (com Refazer / Desfazer).
- **Enquadrar slide** (botão na barra de páginas ou tecla F): a página que está na tela volta centralizada, no maior
  tamanho que cabe entre as barras abertas; apertar de novo alterna para um nível um pouco menor (85%), com folga.

## 1.8.0 (19/10/2026)
Apresentações grandes, importação com andamento, slides ocultos e com vídeo.
- **Apresentações grandes:** o painel "Ver todas as páginas" abre na hora e só desenha as miniaturas que aparecem;
  depois de um traço, refaz só a página que mudou (num PC modesto, com 400 slides, abrir caiu de 14 s para 0,1 s).
  A miniatura da galeria não baixa mais as imagens de todos os slides.
- **Importação de PowerPoint:** mostra o andamento ("Convertendo os slides: 120 de 230") e tem botão Cancelar; o
  tempo máximo acompanha o tamanho do deck, em vez de 3 minutos fixos.
- **Slides ocultos** vêm desmarcados na grade de importação, com a marca "oculto" (um toque inclui).
- **Slides com vídeo** aparecem marcados na grade e entram com uma nota avisando que o vídeo virou imagem parada.

## 1.7.0 (18/10/2026)
Passador de slides.
- **Passador de slides:** o botão de iniciar (F5) começa a apresentação em vez de recarregar a página; o botão de tela
  preta (B ou ponto) escurece a tela, e qualquer tecla ou toque volta; no quadro infinito, avançar e voltar descem e sobem
  uma tela. A página em branco na apresentação passou para a tecla N.

## 1.6.0 (18/10/2026)
Carimbos de correção e atalhos.
- **Carimbos de correção:** novo grupo "Carimbos" no menu Formas (área Gerais), com 126 formas: certo, errado, meio
  certo, dúvida, atenção, estrela, coração, carinhas feliz e pensativa, mais, falta algo, boa ideia, confira, as
  palavras OK, Visto, Revisar, Parabéns, Refazer e Nota 10, e marcas de destaque (seta, círculo e sublinhado duplo).
  Cada um em três estilos precisos (traço, selo redondo, selo retangular) e três à mão (caneta, esboço, caneta com
  pressão); as marcas de destaque não têm selo. Todos mudam de cor como as outras formas.
- **Backspace:** com algo selecionado, apaga a seleção; sem seleção, apaga o último item desenhado (Ctrl+Z desfaz).
- Ao abrir o Giz Livre, não aparece mais, sem motivo, a faixa "O Giz Livre foi reaberto por outra janela".

## 1.5.0 (16/10/2026)
Agentes de IA preparando quadros (experimental).
- **Agentes de IA (experimental, desligado por padrão):** um assistente de IA compatível com MCP (Model Context
  Protocol) pode criar e montar quadros do Giz Livre: textos, notas, linhas, setas e figuras geométricas, formas da
  biblioteca, fórmulas em LaTeX e gráficos de funções ou dos modelos prontos, em quadro infinito ou com páginas. Fórmulas
  e gráficos aparecem quando o quadro é aberto; uma fórmula com erro vira texto vermelho com o código, sem perder nada.
- **Controle do professor:** botão "Agentes de IA" na galeria e no menu do quadro, com níveis (só ler; criar quadros
  novos, o padrão; editar quadros fechados). Desligar corta o acesso na hora. O agente não apaga nada, não grava num
  quadro aberto na tela e só conversa com o próprio computador; o registro anota o que ele fez, sem o conteúdo. Os
  quadros feitos por um agente aparecem com o selo "agente de IA" na galeria.
- No modo de páginas, o que o agente escreve em sequência e não cabe vai para o alto da página seguinte, criada se faltar.
- O servidor MCP (`mcp/giz_livre_mcp.py`) roda com o Python, a partir do código-fonte; o executável próprio vem numa
  próxima versão.
- A galeria não pede mais a miniatura de um quadro que ainda não tem uma.

## 1.4.2 (16/10/2026)
Revisão de segurança, de textos e de acabamento do código.
- **Segurança:** apresentações (.pptx/.odp) com conteúdo descompactado gigante são recusadas antes de abrir; quadros
  `.lousa` com número de páginas fora do normal ou dados malformados são recusados na importação; fórmulas têm limite
  de expansão; imagens e miniaturas só servem à própria página; formulários não enviam para fora; pastas internas não
  são listadas; nomes reservados do Windows não viram nome de arquivo; `.odp` com scripts é recusado.
- Uma imagem reaproveitada não é mais apagada pela limpeza automática logo depois de entrar no quadro.
- Textos: o Giz Livre é descrito pelo que faz, sem comparação com outros produtos; a compatibilidade diz com o que
  foi testado (Windows 11, Microsoft Edge, Wacom Intuos) e o que deve funcionar sem ter sido verificado.
- O pacote traz também as licenças do PyInstaller e do Inno Setup; a tela "Sobre" cita Python, PyInstaller e os mapas
  do Natural Earth.
- Código: comentários sem códigos internos de pedido e datas; cabeçalho de autoria e licença em todos os arquivos.

## 1.4.1 (16/10/2026)
Correções na apresentação e nas barras.
- **Apresentação:** com o quadro ampliado (lupa ou Ctrl), o slide seguinte abre com a mesma ampliação e no mesmo ponto
  da página; o Esc tira a ampliação e mostra o slide inteiro. Passar o slide no meio da animação da lupa não puxa mais
  a tela de volta para a página anterior. Ctrl+0 na apresentação enquadra o slide em tela cheia.
- **Notebook:** em telas baixas, a barra de desenho fica embaixo da barra de criar, em duas colunas, em vez de ao lado.
- O texto da licença no instalador mostra a versão certa (mostrava 1.2.2).

## 1.4.0 (15/10/2026)
Captura de janela ao vivo no quadro.
- **Captura** (experimental): botão **Captura** na barra da esquerda. O navegador pergunta
  qual janela, aba ou tela mostrar, e ela aparece **ao vivo** numa moldura no quadro (faixa azul para mover, canto para
  o tamanho; acompanha o zoom). Tudo se risca por cima, e a captura fica por cima das páginas de PDF. **Congelar**
  guarda a imagem do momento no lugar da moldura; **Trocar** escolhe outra janela; **Encerrar** desliga. O vídeo ao
  vivo não é gravado no arquivo do quadro, só a imagem congelada.
- Barras de criar e de desenho: em telas mais baixas (cerca de 1000 px) continuam empilhadas, com botões um pouco
  menores, em vez de a barra de desenho ir para cima do quadro.

## 1.3.0 (15/10/2026)
Melhorias depois do uso em sala de aula.
- **Cronômetro:** modo **Livre (sem limite)**, mostrador com dígitos de relógio (sete segmentos), botão **Reduzir**
  que deixa só um mostrador pequeno (tocar nele volta ao painel) e opção de reduzir sozinho ao iniciar.
- **Relógio e calendário** (novo nome), também reduzível; o calendário do mês vai para o quadro com **Pôr no quadro**.
- **Mover a lousa:** setas do teclado (Shift = passo maior) e a ferramenta **Mão** (tecla M), como o botão do meio do mouse.
- Ícone das ferramentas do professor agora é uma **caixa de ferramentas** (o "giz e apagador" não se reconhecia pequeno). A lupa do modo normal diz que é a mesma da apresentação.
- Menu da página diz **qual página** é a referência ("Duplicar a página 3", "a que está no centro da tela").
- **Folha e fundo:** em volta das páginas (PDF, caderno, slides), cinza para contraste ou **mesma cor do fundo**.
- **Ponteiro laser** com cor, tamanho, rastro (de nenhum a muito longo) e formato (ponto, anel, mira, seta).
- **Marca-texto** mais largo (64 e 90) e opção de **mostrar a área** que será marcada antes de pintar.
- **Texto e notas:** fonte, tamanho, **negrito**, *itálico* e alinhamento (esquerda, centro, direita, justificado).
  As fontes são as instaladas no computador; nada é embutido no programa.
- **Canetas extras:** até 8 canetas e 3 marca-textos na barra (botão **+**).
- **Estojos:** conjuntos de canetas salvos com nome, trocados num toque; o estojo **Lousa verde (giz)** e o novo
  quadro **Lousa verde (giz)** na galeria (fundo verde e canetas de giz). Quadro novo com canetas trocadas pergunta,
  discretamente, se mantém ou volta ao padrão.
- **Tinta vira forma** com opções: quais formas reconhecer, retas presas a 0°, 45° e 90°, círculo e quadrado perfeitos.
- **Barra de Desenho** própria (linha, tracejada, setas, retângulo, elipse, triângulo, preencher), aberta de fábrica.
- **Recolher barras:** cada barra tem o seu botão de recolher, e um botão recolhe todas de uma vez.
- **Menu de formas** repensado: áreas em árvore à esquerda (com cores), formas à direita, miniaturas em três
  tamanhos (P, M, G) e cartões com destaque.
- **Rascunho** (camadas, versão simples): botão na barra de cima; o que se escreve com o rascunho ligado (moldura
  laranja) pode ser ocultado e mostrado de uma vez, passado para o quadro ou apagado. Oculto, não é apagado, selecionado
  nem exportado. O painel completo de camadas fica para depois, se fizer falta.
- **Sobre o Giz Livre** reorganizado: autor, licença, privacidade, onde ficam os quadros, código e componentes.
- **Mapas precisos** em Formas → Geografia → Contornos (precisos): Brasil, Brasil por regiões, Brasil por estados (com
  as siglas), América do Sul, América do Norte e Central,
  África, Europa, Ásia, Oceania, Antártida (vista polar) e planisfério, feitos com dados do Natural Earth (domínio
  público). Os contornos simplificados continuam, com os mesmos ids.
- O **rascunho** ganhou barra própria (Escrever, Ocultar/Mostrar,
  Passar p/ quadro, Apagar, com a contagem); a barra de **Desenho** começa logo abaixo da barra de criar; **P, M e G**
  das formas valem também com o menu ampliado; a **cor de cada área** vai para as subáreas e os títulos das seções;
  a disciplina passa a se chamar **Laboratório de Química**.
- **Silhuetas detalhadas** (Nutrição → Ciclos de vida): adulto, gestante de perfil, criança, idoso com bengala, bebê
  enrolado, mamadeira e aleitamento; as antigas continuam.
- **Mapas da História** sobre contornos fiéis: grandes navegações (rotas de Colombo, Cabral e Vasco da Gama),
  Tratado de Tordesilhas (linha em 46°37′ O), bandeiras a partir de São Paulo e capitanias hereditárias (faixas
  aproximadas cortadas no litoral real); os esquemas antigos continuam.
- **Cronômetro e relógio reduzidos** se arrastam pelo próprio mostrador (um toque sem arrastar abre o painel).
- **Cor e modelo do mostrador:** clássico, digital verde, placar vermelho, âmbar, azul, discreto e grande (projetor),
  ou a cor que quiser; vale para cronômetro e relógio e fica lembrado.
- **Menu Folha e fundo** repensado: áreas com cores à esquerda, prévias maiores (P, M, G), busca por nome e ajustes
  (malha, intensidade, cores, em volta das páginas) agrupados embaixo.
- **Estilo Giz** para as canetas: traço granulado, com falhas, como giz na lousa; as canetas do estojo
  **Lousa verde (giz)** já vêm com ele.
- Cabeçalho da galeria cabe em janela não maximizada (botões só com ícone quando falta espaço; o nome fica na dica).
- **Mais estilos de caneta:** **Lápis** (traço fino com grão de grafite), **Marcador** (ponta chata, largura
  sem pressão, pontas retas, ângulo da ponta ajustável) e **Aquarela** (larga e translúcida, com o pigmento
  acumulado na borda). Os 8 estilos aparecem em grade de 4 por linha no menu da caneta.
- **Modo giz mais caprichado:** o traço de giz ganhou pó em volta e falhas finas; o fundo pode ter a textura
  **Lousa de giz** (manchas de apagador e pó, bem fracas), opcional no menu Folha e fundo (não vem ligada).
- **Mais 5 estojos:** Ardósia (giz na lousa cinza), Projetor (traço grosso), Cores seguras (daltonismo),
  Desenho técnico (traço fino) e Caderno (lápis, marcador e aquarela).
- **Estojo à vista:** botão **Estojo** na barra das canetas e menu em cartões, com prévia das canetas no
  fundo do estojo, marca "Em uso", escolha de trocar ou não o fundo e salvar as canetas atuais com ou sem o fundo.
- Relógio e cronômetro reduzidos: os botões ficam ao lado do mostrador, sem cobrir os dígitos.
- Lousa escura: os ícones da barra da seleção não somem mais.
- O estojo e o quadro **Quadro-negro** passam a se chamar **Lousa verde (giz)**.
- Trocar de estojo: estojos sem fundo próprio devolvem o quadro branco ao sair de uma lousa, e as canetas da barra
  mostram as cores certas logo após a troca.
- Barra do rascunho legível na lousa escura: o botão "Escrever" ligado não some mais.
- Rascunho: o botão "Apagar" virou **Limpar rascunho**, sem o vermelho fixo, e pede confirmação antes de apagar tudo
  (ele se confundia com a borracha).
- Estojo **Caderno** com a folha Caderno; ao trocar para um estojo sem folha, o quadro volta a ficar liso, a não ser
  que a folha tenha sido escolhida à mão. Prévias dos estojos com a folha e traços mais finos.
- Testes automáticos: 69 (mostrador, tempo digitado, tinta vira forma e os estilos Giz, Lápis, Marcador e Aquarela).

## 1.2.2 (09/10/2026)
- **Barra de ferramentas do professor** aberta à direita por padrão, com o nome embaixo de cada ícone (como a barra
  Texto/Nota/Formas); no menu, à direita, à esquerda ou só no menu. O botão de cima não fica mais marcado.
- **Barras soltas por padrão:** cada uma arrasta pela alça ⠿ e os botões continuam funcionando; o **cadeado** trava
  tudo (barras, relógio, cronômetro e painéis) e a escolha fica guardada.
- **Holofote ajustável:** tamanho, formato (círculo, quadrado ou faixa) e intensidade do escurecimento, lembrados.
- **Variar parâmetro de função (experimental):** a curva vem parada, anda só com "▶ Animar" ou Espaço (antes andava
  quando o mouse se mexia), Enter fixa a curva do momento e dá para escolher a cor de cada curva fixada.
- **Inserir PDF ou apresentação** (botão **PDF/Slides**): PowerPoint (.pptx, .ppt, .ppsx, .potx), LibreOffice (.odp,
  .otp) e Keynote (.key, pelo LibreOffice). Antes de inserir, uma grade de miniaturas deixa escolher as páginas.
- **Acabamento visual:** na lousa escura (verde, preta), as barras ficam em grafite e não ofuscam no projetor; nomes
  maiores (12 px) embaixo dos ícones; um só estado de "ativo" (azul) em todas as barras; ícones próprios para Cortina
  e Escrita→texto; alça ⠿ mais visível; fonte do Windows 11 (Segoe UI Variable).
- A lixeira (limpar o quadro) saiu de perto do desfazer: fica em **⋯ → Limpar o quadro…**, longe de toques acidentais.
- **Material de consulta** em Formas → área → Especiais (coloridos): tabelas e ábacos fixos, como num apêndice de
  livro. Hidráulica (Moody, rugosidade, Hazen-Williams, Manning, propriedades da água), OD de saturação, Química
  (potenciais-padrão, íons, Ka/pKa), Física (prefixos e unidades do SI, constantes CODATA 2022, conversões),
  Estatística (z, t, χ², F), Matemática (derivadas, integrais, identidades, ângulos notáveis, círculo trigonométrico),
  Eletrônica (código de cores, séries E), Biologia (código genético, aminoácidos) e Música (círculo de quintas).
- A **Biblioteca** saiu da barra: a tabela periódica foi para **Formas → Química → Especiais (coloridos)** e a busca
  acha; as vidrarias dela já existiam em Formas → Laboratório.
- A primeira tela pergunta **"Quais áreas te interessam?"** (não só para aula); o menu passa a dizer **Áreas…**.

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
Melhorias depois do primeiro uso em sala de aula.
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
- **Lupa de ampliação**, na apresentação e fora dela (botão na barra de zoom ou tecla Z):
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
  - quadro livre infinito;
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
