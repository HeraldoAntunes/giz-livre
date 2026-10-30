# Guia de uso do Giz Livre

## 1. Abrir

- **Instalar:** extraia todo o `Instalar-GizLivre-<versão>.zip` e abra o `GizLivre.exe` da pasta. Confirme a
  instalação na sua conta, sem administrador. Mantenha `python`, `servidor` e `instalar.txt` junto do executável.
- **Instalado:** atalho **Giz Livre** na Área de Trabalho ou no Menu Iniciar.
- **Versão portátil (zip):** descompacte e dê dois cliques em `GizLivre.exe`. Os quadros ficam na pasta `quadros`, ao lado do
  programa, e dá para levar tudo num pendrive.
- **Pelo código-fonte:** dois cliques em `Giz Livre.bat` (precisa de Python 3.10+).

**Ajuda dentro do programa:** botão **?** no canto de cima do quadro, ou a tecla `F1`. Cada tema tem uma figura, os
passos e o botão **Mostrar na tela**. No primeiro quadro, um tour de seis balões mostra as barras principais (dá para
pular, rever pela ajuda ou desligar).

A partir da 1.16.0, o programa abre em janela própria Tauri/WebView2, sem depender do Edge ou do Chrome instalado.
O Python oficial embutido vem no pacote. Se faltar WebView2, siga a orientação do programa para instalar o componente
oficial da Microsoft. É possível trabalhar sem internet, mas o WebView2 pode abrir conexão própria com a Microsoft;
a consulta de atualização e o download do zip usam o GitHub quando você pede. Na versão instalada, os quadros ficam em
`Documentos\Giz Livre\quadros`. Para fazer backup ou levar para outro computador, use **Levar quadros** na galeria
(veja a seção 5).

## 2. Primeira vez com mesa digitalizadora (5 minutos)
1. Conecte a mesa digitalizadora ou a tela com caneta (testado com Wacom Intuos).
2. No programa do driver da mesa:
   - ative o **Windows Ink**, sem o qual não há pressão nem botões da caneta. Na Wacom: *Propriedades da Mesa Wacom →
     Mapeamento → Usar Windows Ink*;
   - em mesas **sem tela** (como a Intuos), mapeie para **um monitor só** e marque **Forçar proporções**. Isso diminui
     muito o tremido;
   - no botão lateral da caneta, deixe *Clique direito*: no Giz Livre ele vira borracha.
3. No Giz Livre, abra **Caneta e escrita** e escreva na área de teste. Deve aparecer "✓ Caneta reconhecida com pressão".
4. Ajuste o **Filtro de posição** (Leve, Médio ou Forte) até o traço ficar firme.

**Sem Windows Ink.** O Giz Livre funciona: a mesa chega como mouse e desenha com espessura fixa. Continuam iguais as
ferramentas, o estabilizador, o embelezar escrita, a escrita→texto, a régua, o transferidor e as formas. Perdem-se a
pressão, o afinamento do início e do fim do traço, a ponta-borracha e o botão lateral como ação própria (vira clique
direito e move o quadro); em tela com caneta e toque, o dedo continua desenhando. Contornos: o estilo **Tinteiro** varia a
espessura pela velocidade, e "Dedo: Sempre move o quadro" no painel Caneta evita traço da palma. O painel **Caneta e
escrita** mostra se o último traço no quadro trouxe pressão e, se a caneta vier sem pressão, lembra de ligar *Usar
Windows Ink* no driver.

## 3. Criar um quadro
**Criar novo quadro** oferece:
- **Quadro livre:** tela infinita, sem bordas.
- **Caderno A4** (em pé ou deitado): páginas prontas para imprimir ou salvar em PDF.
- **Slides 16:9** em branco.
- **Abrir PowerPoint ou PDF:** cada slide ou página vira uma folha travada no fundo, para escrever por cima. Para abrir
  `.pptx`, o computador precisa do PowerPoint ou do LibreOffice (gratuito; com ele, efeitos e algumas fontes podem
  mudar); PDF funciona sempre.

## 4. Na aula
| Quero… | Como |
|---|---|
| Escrever | canetas no topo (teclas `1`–`4`); toque de novo na caneta para cor, espessura, estilo (tinteiro, caligrafia, pincel), ponteiro da tela e **Restaurar padrão** |
| Marcar | marca-texto (`H`) · ponteiro laser (`K`) |
| Apagar | botão lateral da caneta ou `E`; toque de novo na borracha para o **tamanho** (P, M, G, GG) e para "traço inteiro" ou "só onde passar" |
| Selecionar, mover, girar | laço (`L`) ou seleção (`V`); alça redonda de cima = girar; canto de baixo = tamanho |
| Encaixe | botão de grade na barra da seleção: **Na grade da folha** faz o canto do que você move ou aumenta cair na linha mais próxima da folha (nas folhas sem malha, como a lisa e a pautada, uma grade invisível de 20 em 20 px); **Girar** de 15° em 15° ou de 45° em 45°, sem precisar do teclado. Fica ligado até você desligar |
| Imagem da seleção | botão de baixar na barra da seleção: PNG só do que está selecionado, com ou sem o fundo, ou **Copiar a imagem** para colar com `Ctrl+V` em outro programa |
| Tinta vira forma | botão na barra de cima: reta, círculo, retângulo e polígono desenhados à mão viram forma perfeita. Em **Quando**: *Ao soltar a caneta* (todo traço que parecer forma) ou *Ao segurar a caneta parada no fim* (só vira forma o traço em que você deixa a caneta parada por meio segundo antes de levantar; o resto continua desenho livre) |
| Agrupar | selecione vários e `Ctrl+G` (ou o botão na barra da seleção); `Ctrl+Shift+G` desagrupa |
| Mover o quadro / zoom | `Espaço` + arrastar, ou dois dedos · `Ctrl` + roda · `Ctrl+0` ajusta à tela |
| Trocar a folha | botão **Folha** na bandeja: quadriculada, milimetrada, pautada, caderno, caligrafia, isométrica, hexagonal, plano cartesiano, polar, pauta musical, Cornell… |
| Lousa verde | botão Folha → cor "Lousa verde" (a tinta preta aparece branca; sobre página de PDF continua preta). Trocar a folha também se desfaz com `Ctrl+Z` |
| Letra mais bonita | botão ✦: Suave / Moderado / Forte; ajusta cada palavra assim que você passa para a próxima |
| Escrita → texto | laço na escrita → botão "Converter escrita em texto"; escolha uma fonte cursiva. Precisa do reconhecimento de escrita do Windows: para português, *Configurações → Hora e idioma → Idioma e região → Português (Brasil) → Opções de idioma → Manuscrito*. Sem nenhum reconhecedor o botão não aparece; com outro idioma, o texto sai nesse idioma (o painel Caneta e escrita avisa) |
| Ferramentas | botão **Ferramentas** (esquadro e lápis): lupa de escrita, transferidor (a caneta corre presa ao arco e à base), **esquadro** (45° ou 30°/60°: toque no ângulo escrito nele para trocar; arraste pelo corpo, gire pela bolinha da ponta; a caneta perto de um lado corre presa a ele, por fora), compasso, cortina, holofote, **calculadora** (em graus ou radianos; aceita sen, cos, tg, raiz, ln, log, π e vírgula; **Pôr no quadro** escreve a conta e o resultado), cronômetro (dá para digitar o tempo: 7, 7,5 ou 7:30), relógio, fórmula LaTeX e escrita→texto (a tabela periódica fica em Formas → Química → Especiais). Vêm numa **barra fixa à direita**, com o nome embaixo de cada ícone; no botão Ferramentas dá para pôr à esquerda ou deixar só no menu. O **holofote** abre um painel para ajustar tamanho, formato (círculo, quadrado, faixa) e quanto escurece o resto |
| Gráfico de função | **Ferramentas → Plotar função**: digite `x^2 - 4`, `2sen(x)`, `1/x`… ou escolha um **modelo por área** (Chick, DBO, Streeter-Phelps, senoide, RC, normal…) e ajuste os parâmetros. A curva sai com os eixos desenhados (dá para apagar ou mover). **Experimental:** escolha um parâmetro em "Variar"; a curva vem parada no valor do diálogo. Mude o valor (controle ou número), escolha a cor e toque em **Fixar esta curva** (ou **Enter**) para gravar; repita para comparar curvas. **Espaço** anima e pausa |
| Texto, nota, forma, imagem | coluna à esquerda (ou cole uma imagem com `Ctrl+V`) |
| Tamanho da letra | selecione o texto ou a nota e use **A−** e **A+** na barra que aparece em cima; a nota cresce para baixo quando o texto não cabe. Menu Texto → **Ajustar à nota** volta ao tamanho automático |
| Mostrar outro programa ao vivo (experimental) | **Captura** na coluna à esquerda: o navegador pergunta qual janela, aba ou tela mostrar (um site, um documento, uma pasta…). Ela entra numa moldura no quadro e continua se mexendo; risque por cima. Faixa azul = mover, canto = tamanho. **Congelar** guarda a imagem no quadro; **Encerrar** desliga. A faixa "está compartilhando" do navegador some em **Ocultar**. Não minimize o programa capturado |
| Formas técnicas | tecla **/** e o nome da forma (busca rápida), ou **Formas**: abre na **Vitrine** das suas áreas; depois **área → disciplina**; use a busca, **⚑ Mais usadas** e **↺ Recentes**. Em Engenharias estão Hidráulica, Saneamento, Recursos Hídricos e Topografia, além de Elétrica, Eletrônica e Embarcados |
| Páginas | barra embaixo: anterior/próxima (`PageUp`/`PageDown`), nova página, duplicar, excluir, ver todas. Em "ver todas", marque várias miniaturas e toque em **Excluir** (ex.: tirar 2 páginas de um PDF). **Enquadrar slide** (botão ao lado das setas, ou `F`): depois de mover e ampliar, a página que está na tela volta centralizada, no maior tamanho que cabe entre as barras abertas; apertar de novo alterna para um nível um pouco menor (85%), com folga em volta, e o nível fica guardado |
| Lupa | `Z` ou o botão de lupa (no modo normal e na apresentação): toque onde quer ampliar. Ao lado aparecem **− 3x +** para escolher quanto amplia (de 1,5x a 8x; também `+` e `−`, ou a roda do mouse); depois de ampliado, **+** amplia mais. O último nível fica guardado |
| Avisos de desfazer e apagar | o `Ctrl+Z` e o `Backspace` sem seleção não mostram mais "Desfeito" nem "Último item apagado". Para ligar: menu `…` → **Avisos de desfazer e apagar**: desligado (padrão), curto (1 s) ou normal (3 s, com Refazer) |
| Apresentar | botão **Apresentar**: setas ou passador mudam de slide; `B` = página em branco; `Esc` sai. Na mini-bandeja: cor, espessura (bolinha com anel tracejado; `[` e `]` também mudam), formas (linha, seta, retângulo, elipse, triângulo: a forma continua ativa para desenhar várias setas seguidas; toque numa caneta para voltar a escrever), "tinta vira forma" (desligado = desenho livre) e lupa |
| Esconder as barras | `Tab` (modo aula); para voltar, `Tab` de novo ou o botão **Mostrar barras** no canto de baixo |
| Limpar o quadro | tecla Del sem nada selecionado, lixeira da barra de cima ou menu `…`: pergunta se apaga só a página que está na tela (quadro com várias páginas), só o que foi escrito ou tudo, inclusive PDF |
| PDF, imprimir, imagem | menu `…` → Exportar PDF / Imprimir / Exportar imagem |
| Desfazer / refazer | `Ctrl+Z` / `Ctrl+Y` (o aviso de desfazer também tem **Refazer**) |
| Salvar | automático |

Para escolher quais áreas aparecem, use **Áreas…** no menu Formas. A busca encontra também as ocultas.
Na galeria, **Formas** abre o catálogo. Selecione uma forma na lousa para mover, girar e redimensionar; use a opção de
cor da seleção para recolorir. Modelos com campos vazios podem receber Texto ou escrita a caneta. A legenda interna
faz parte da imagem SVG.

**Apresentações grandes:** até 200 slides o Giz Livre rodou liso nos testes do mantenedor, inclusive com o processador 6 vezes mais lento
(simulado). Acima disso, num
computador modesto, o painel de páginas fica lento. Se o PowerPoint não estiver instalado e a conversão de um deck
grande falhar, salve o deck como PDF e importe o PDF. Vídeos dos slides entram como imagem parada.

## 5. Trazer quadros de outros programas
- **Microsoft Whiteboard:** exporte cada quadro como imagem e use **Importar** na galeria.
- **Outro computador com o Giz Livre (todos os quadros):** na galeria, **Levar quadros** → *Guardar todos num arquivo*
  e salve o `.zip` no pen drive. No outro computador, **Levar quadros** → *Trazer quadros de um arquivo*. Nada que já
  existe lá é apagado ou substituído: quadro igual é pulado e quadro que mudou entra como cópia "(trazido em dd/mm)".
  Imagens coladas e pastas vão junto; a lixeira e as preferências (estojo, barras) não vão.
  A importação confere o conteúdo das imagens existentes e tenta reparar as corrompidas com a cópia do pacote.
  Se não conseguir, informa a falha. Pacotes com nomes de arquivo duplicados são recusados antes de trazer conteúdo.
- **Um quadro só:** menu `…` → *Exportar arquivo .lousa*; no outro computador, **Importar**.

## 6. Agentes de IA (experimental)
Um assistente de IA compatível com MCP (por exemplo, o Claude Code ou o Claude Desktop) pode preparar quadros para você:
textos, notas, formas da biblioteca, fórmulas e gráficos.
1. Na galeria, clique em **Agentes de IA** e ligue. Escolha o nível: *só ler*, *criar quadros novos* (o padrão) ou
   *editar quadros fechados*. Desligar corta o acesso na hora.
2. Cadastre o servidor MCP no assistente, apontando para os quadros do Giz Livre instalado. No Claude Code:
   `claude mcp add giz-livre -- python "<pasta do código-fonte>\mcp\giz_livre_mcp.py" --dados "<Documentos>\Giz Livre\quadros"`
   (precisa do Python; o executável próprio vem numa próxima versão).
3. Peça, por exemplo: "monte um quadro A4 sobre decantação com a lei de Stokes, um decantador e um gráfico".
4. Abra o quadro na galeria (ele aparece com o selo *agente de IA*). As fórmulas e os gráficos são montados nessa hora.

O agente não apaga nada e não grava num quadro que está aberto na tela: feche o quadro (volte à galeria) para ele
continuar. Os quadros são gravados no seu computador. O cliente de IA tem suas próprias regras de acesso à rede;
a janela WebView2 também pode abrir conexão própria com a Microsoft.

## 7. Atualizar o Giz Livre
No **Sobre** (galeria ou menu `…` do quadro), **Procurar versão nova**. Se houver, **Baixar e instalar**: o programa baixa o
zip de instalação do GitHub, confere o SHA-256, extrai, instala por cima e abre de novo. Os quadros ficam como estão.
Quem está na 1.15 ou anterior instala a janela própria à mão uma vez: extraia o zip inteiro e abra o `GizLivre.exe`.
Depois, o Sobre da janela própria reconhece o zip. Na versão portátil, guarde a pasta `quadros`, extraia o pacote
novo inteiro e leve os quadros para a nova pasta; preserve os arquivos antigos até conferir a abertura.

## 8. Problemas comuns
| Sintoma | Solução |
|---|---|
| A caneta não tem pressão / "chegou como mouse" | ative o Windows Ink no driver da mesa e reabra o Giz Livre |
| O traço treme | mapeie a mesa para um monitor só + Forçar proporções; suba o Filtro de posição |
| "Editor desconhecido" ao instalar | o programa não tem assinatura paga; confira o SHA-256 e use *Mais informações → Executar assim mesmo* |
| Aviso "o programa foi fechado" | abra de novo pelo atalho e recarregue a janela; o que não foi salvo continua na tela |
| PowerPoint não abre | salve como `.pptx` sem senha e sem macros, ou exporte como PDF no PowerPoint e importe o PDF |
