# Guia de uso do Giz Livre

## 1. Abrir
- **Instalado:** atalho **Giz Livre** na Área de Trabalho ou no Menu Iniciar.
- **Versão portátil (zip):** descompacte e dê dois cliques em `GizLivre.exe`. Os quadros ficam na pasta `quadros`, ao lado do
  programa, e dá para levar tudo num pendrive.
- **Pelo código-fonte:** dois cliques em `Giz Livre.bat` (precisa de Python 3.10+).

O programa abre numa janela própria do Edge ou do Chrome e funciona sem internet. Na versão instalada, os quadros ficam em
`Documentos\Giz Livre\quadros`. Para fazer backup, copie essa pasta.

## 2. Primeira vez com mesa digitalizadora (5 minutos)
1. Conecte a mesa (Wacom, XP-Pen, Huion, Gaomon ou tela com caneta).
2. No programa do driver da mesa:
   - ative o **Windows Ink**, sem o qual não há pressão nem botões da caneta. Na Wacom: *Propriedades da Mesa Wacom →
     Mapeamento → Usar Windows Ink*;
   - em mesas **sem tela** (como a Intuos), mapeie para **um monitor só** e marque **Forçar proporções**. Isso diminui
     muito o tremido;
   - no botão lateral da caneta, deixe *Clique direito*: no Giz Livre ele vira borracha.
3. No Giz Livre, abra **Caneta e escrita** e escreva na área de teste. Deve aparecer "✓ Caneta reconhecida com pressão".
4. Ajuste o **Filtro de posição** (Leve, Médio ou Forte) até o traço ficar firme.

## 3. Criar um quadro
**Criar novo quadro** oferece:
- **Quadro livre:** tela infinita, como no Microsoft Whiteboard.
- **Caderno A4** (em pé ou deitado): páginas prontas para imprimir ou salvar em PDF.
- **Slides 16:9** em branco.
- **Abrir PowerPoint ou PDF:** cada slide ou página vira uma folha travada no fundo, para escrever por cima. O PowerPoint
  precisa estar instalado para abrir `.pptx`; PDF funciona sempre.

## 4. Na aula
| Quero… | Como |
|---|---|
| Escrever | canetas no topo (teclas `1`–`4`); toque de novo na caneta para cor, espessura, estilo (tinteiro, caligrafia, pincel), ponteiro da tela e **Restaurar padrão** |
| Marcar | marca-texto (`H`) · ponteiro laser (`K`) |
| Apagar | botão lateral da caneta ou `E`; toque de novo na borracha para o **tamanho** (P, M, G, GG) e para "traço inteiro" ou "só onde passar" |
| Selecionar, mover, girar | laço (`L`) ou seleção (`V`); alça redonda de cima = girar; canto de baixo = tamanho |
| Agrupar | selecione vários e `Ctrl+G` (ou o botão na barra da seleção); `Ctrl+Shift+G` desagrupa |
| Mover o quadro / zoom | `Espaço` + arrastar, ou dois dedos · `Ctrl` + roda · `Ctrl+0` ajusta à tela |
| Trocar a folha | botão **Folha** na bandeja: quadriculada, milimetrada, pautada, caderno, caligrafia, isométrica, hexagonal, plano cartesiano, polar, pauta musical, Cornell… |
| Lousa verde | botão Folha → cor "Lousa verde" (a tinta preta aparece branca; sobre página de PDF continua preta). Trocar a folha também se desfaz com `Ctrl+Z` |
| Letra mais bonita | botão ✦: Suave / Moderado / Forte; ajusta cada palavra assim que você passa para a próxima |
| Escrita → texto | laço na escrita → botão "Converter escrita em texto"; escolha uma fonte cursiva |
| Ferramentas | botão **Ferramentas** (esquadro e lápis): lupa de escrita, transferidor (a caneta corre presa ao arco e à base), compasso, cortina, holofote, cronômetro (dá para digitar o tempo: 7, 7,5 ou 7:30), relógio, fórmula LaTeX, tabela periódica, vidrarias. Marque "Mostrar todas abertas numa barra" para tê-las sempre à vista |
| Gráfico de função | **Ferramentas → Plotar função**: digite `x^2 - 4`, `2sen(x)`, `1/x`… ou escolha um **modelo por área** (Chick, DBO, Streeter-Phelps, senoide, RC, normal…) e ajuste os parâmetros. A curva sai com os eixos desenhados (dá para apagar ou mover). Escolha um parâmetro em "Animar" para vê-lo variar; "Fixar esta curva" grava o instante |
| Texto, nota, forma, imagem | coluna à esquerda (ou cole uma imagem com `Ctrl+V`) |
| Formas técnicas | **Formas → área → disciplina**; use a busca, **⚑ Mais usadas** e **↺ Recentes**. Em Engenharias estão Hidráulica, Saneamento, Recursos Hídricos e Topografia, além de Elétrica, Eletrônica e Embarcados |
| Páginas | barra embaixo: anterior/próxima (`PageUp`/`PageDown`), nova página, duplicar, excluir, ver todas. Em "ver todas", marque várias miniaturas e toque em **Excluir** (ex.: tirar 2 páginas de um PDF) |
| Apresentar | botão **Apresentar**: setas ou passador mudam de slide; `B` = página em branco; `Esc` sai. Na mini-bandeja: cor e espessura, "tinta vira forma" (desligado = desenho livre) e lupa |
| Esconder as barras | `Tab` (modo aula); para voltar, `Tab` de novo ou o botão **Mostrar barras** no canto de baixo |
| Limpar o quadro | lixeira da barra de cima ou menu `…`: pergunta se apaga só o que foi escrito ou tudo, inclusive PDF |
| PDF, imprimir, imagem | menu `…` → Exportar PDF / Imprimir / Exportar imagem |
| Desfazer / refazer | `Ctrl+Z` / `Ctrl+Y` (o aviso de desfazer também tem **Refazer**) |
| Salvar | automático |

Para escolher quais disciplinas aparecem, use **Disciplinas…** no menu Formas. A busca encontra também as ocultas.
Na galeria, **Formas** abre o catálogo. Selecione uma forma na lousa para mover, girar e redimensionar; use a opção de
cor da seleção para recolorir. Modelos com campos vazios podem receber Texto ou escrita a caneta. A legenda interna
faz parte da imagem SVG.

## 5. Trazer quadros de outros programas
- **Microsoft Whiteboard:** exporte cada quadro como imagem e use **Importar** na galeria.
- **Outro computador com o Giz Livre:** menu `…` → *Exportar arquivo .lousa*; no outro computador, **Importar**.

## 6. Problemas comuns
| Sintoma | Solução |
|---|---|
| A caneta não tem pressão / "chegou como mouse" | ative o Windows Ink no driver da mesa e reabra o Giz Livre |
| O traço treme | mapeie a mesa para um monitor só + Forçar proporções; suba o Filtro de posição |
| "Editor desconhecido" ao instalar | o programa não tem assinatura paga; confira o SHA-256 e use *Mais informações → Executar assim mesmo* |
| Aviso "o programa foi fechado" | abra de novo pelo atalho e recarregue a janela; o que não foi salvo continua na tela |
| PowerPoint não abre | salve como `.pptx` sem senha e sem macros, ou exporte como PDF no PowerPoint e importe o PDF |
