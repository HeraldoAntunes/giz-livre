# Provas independentes do Giz Livre 1.17.0

Procura de defeitos nas novidades da 1.17.0. Feita em 04/11/2026, no ramo `provas-1.17.0`, criado a partir da tag
`v1.17.0` (commit `e5db9ea33a9f43ef04929d990aac6c897b1d6f6f`). O código do programa não foi alterado.

- **Como:** Chromium sem janela, pelo Playwright, e o `server.py` de verdade, como processo separado. Só quadros
  sintéticos, numa pasta temporária.
- **Teste novo:** `tests/provas/v117.mjs`. Cada conferência descreve o comportamento esperado, então FALHOU quer dizer
  defeito.
- **Saídas completas:** `tests/provas/resultados-2026-11-04-v1.17.0.txt`.

Não repeti o que já se sabe:

- título ou fundo perdido com o mesmo quadro em duas janelas;
- o 501º marcador descartado;
- a miniatura do marcador no `.lousa`;
- o esconder em quadro gigante;
- o `ultimoToque` global.

## Resumo

**6 defeitos**, nenhum de perda de dados:

| # | Defeito | Gravidade | Teste que falha |
|---|---|---|---|
| D1 | O marcador não acompanha a página quando se insere ou exclui uma página antes dele | **média** | `M1` (2 conferências) |
| D2 | Na apresentação, o R revela o próximo escondido de qualquer slide, mesmo fora da tela | **média** | `E2` |
| D3 | Com 50 ou mais marcadores no quadro, as fitinhas se cobrem, e sobram 9 px ou menos para tocar em cada uma | baixa | `M3` (2 conferências) |
| D4 | Renomear um grupo com cerca de 1.000 marcadores ou mais falha (pedido maior que 64 KB) | baixa | `M4` |
| D5 | A ordem das paradas depende da ordem dos itens no quadro ("Trazer para a frente" muda o roteiro) | baixa | `P1` (2 conferências) |
| D6 | Tecla N (Folha) na apresentação de um quadro sem páginas dá erro na página | baixa | `B1` |

As 9 conferências que falharam (6 defeitos) falharam igual em três execuções: duas com o servidor em Python 3.13.17
e uma com 3.10.20.

Para rodar:

```bash
PYTHON=.venv/bin/python node tests/provas/v117.mjs
```

Para rodar só um caso, por exemplo os de marcador e de revelar:

```bash
PYTHON=.venv/bin/python node tests/provas/v117.mjs --so M1,E2
```

Ambiente: Ubuntu 24.04.5 LTS, x86_64 (contêiner na nuvem). Python 3.13.17 e 3.10.20, Node 22.22.0 e Chromium
153.0.8010.12 (Playwright 1.63.0). Não foi testado no Windows, no Edge nem na janela do programa (WebView2/Tauri).
A parte das duas telas na janela própria (o Rust pondo a apresentação na outra tela) também não foi testada.

Os testes do projeto passam no Linux: `tests/test_server.py` com 159 testes (6 pulados) e `tests/testes.mjs` com 142.
Os de ponta a ponta novos (`e2e_notas.mjs`, `e2e_marcadores.mjs`, `e2e_barra_apresentacao.mjs` e
`e2e_concorrencia_sessao.mjs`) têm o caminho do Edge e do Chrome do Windows fixo e não rodam aqui.

## Defeitos

### D1 (média): o marcador não acompanha a página

O marcador guarda um ponto do quadro (`cx`, `cy`). Inserir, duplicar ou excluir uma página desloca os itens das
páginas seguintes (`itemsShift` em `insertPageAfter` e `deletePages`), mas não os marcadores. Eles também não podem
mudar pelo salvamento do editor: só por `/api/marcadores`.

Depois disso, o marcador leva a outro slide e continua com o nome e o número da página de antes ("Página 3", pág. 3).

Passo a passo:

1. Abra um quadro com 4 páginas e marque a página 3 (Ctrl+M, nome "Página 3").
2. Na página 1, use "…" → "Nova página depois da página 1".
3. Toque na fitinha ou no cartão do marcador "Página 3". Ele leva à página 3 de agora, que tem o conteúdo da antiga
   página 2.
4. Com o marcador na página 2: exclua a página 2. O marcador "Página 2" passa a levar ao conteúdo da antiga página 3.

O mesmo vale para inserir PDF ou slides no meio do quadro e para "Limpar → Tudo", que deixa o marcador apontando
para uma página que não existe mais.

Teste que falha: `M1`.

- "depois de inserir uma página antes dele, o marcador continua no conteúdo da página 3" deu: aponta para "Conteúdo
  da página 2".
- "excluir a página do marcador não deixa o marcador apontando para outra página" deu: aponta para "Conteúdo da página
  3".

Por que é média: o caso comum é marcar slides e depois inserir uma folha em branco na aula (o botão Folha e a tecla N
fazem exatamente isso). Daí em diante, todos os marcadores das páginas seguintes levam a um slide antes do certo.

### D2 (média): R revela um escondido de outro slide

O `revelarProximo` revela o de menor número de ordem no quadro inteiro, ou seja, o primeiro que foi escondido. Não
olha se ele está na tela. Na apresentação de um deck, o R pode revelar a resposta de um slide que os alunos ainda não
viram, sem nada mudar na tela. A resposta do slide de agora continua escondida, e quando a turma chega ao outro slide
a resposta já está lá.

Passo a passo:

1. Num quadro de 3 slides, esconda primeiro a resposta do slide 3 e depois a do slide 1 (selecionar → olho riscado).
2. Apresente e, no slide 1, aperte R.
3. Nada aparece no slide 1. A resposta do slide 3 foi revelada, fora da tela.

Teste que falha: `E2`. "no slide 1, R revela a resposta que está na tela" deu: resposta do slide 1 ainda escondida,
resposta do slide 3 REVELADA (fora da tela).

O contorno de hoje é esconder na ordem da aula. O botão Revelar e o Ctrl+Z ajudam, mas o professor não vê que revelou
o item errado.

### D3 (baixa): fitinhas coladas com muitos marcadores

Todas as fitinhas ficam na mesma borda, a uma altura proporcional à posição do ponto no quadro (`alturaDasFitas`, de
6% a 88% da altura da tela). Cada uma tem 46 px de altura, e a que vem depois fica por cima. Medido numa tela de
1280x800:

| Deck, um marcador por página | Distância entre fitinhas | Área à vista da menor |
|---|---|---|
| 20 páginas | 27 px | 25 px (tocável) |
| 50 páginas | 11 px | **9 px** |
| 100 páginas | 5 px | **4 px** |
| 50 páginas com 10 marcadores cada | as 10 da mesma página na mesma altura | só a de cima pode ser tocada |

Com a caneta ou o dedo, nesses casos não dá para acertar a fitinha certa. Sobram a lista da mini-bandeja e a galeria.

Passo a passo: faça um deck de 50 slides com um marcador em cada um e tente tocar na fitinha do slide 25.

Teste que falha: `M3`. "deck de 50 páginas... toda fitinha tem uma área de toque de pelo menos 24 px" deu 1 de 50; o
de 100 páginas também deu 1 de 100.

### D4 (baixa): renomear um grupo grande falha

O `/api/marcadores` aceita pedidos de até 64 KB (`LIMITES["outros"]`). Alguns pedidos da galeria crescem com o número
de marcadores do grupo:

- renomear ou mudar a cor do grupo manda um `alterar` para cada marcador do grupo;
- arrastar um cartão manda a ordem nova de todos os marcadores do grupo (`MK.soltar`).

Com 1.200 marcadores num grupo (3 quadros com 400 cada):

- **renomear:** o pedido teve 71.755 bytes e recebeu **413**. A galeria mostra "tamanho do envio inválido", e o grupo
  fica com o nome antigo nos marcadores. O nome do próprio grupo vai no mesmo pedido e também não muda.
- **arrastar:** o pedido teve 52.634 bytes e passou. Pela conta, a cerca de 1.500 marcadores no grupo, arrastar
  também falha.

Passo a passo:

1. Tenha um grupo com uns 1.100 marcadores ou mais, em quadros diferentes.
2. Na aba Marcadores, renomeie o grupo.

Teste que falha: `M4`.

É raro: precisa de muitos marcadores num grupo só. Mas o erro aparece só como um aviso técnico.

### D5 (baixa): a ordem das paradas não é a mesma sempre

A função que ordena as paradas (`paradas.js`) não é transitiva. Ela trata duas imagens como da mesma linha quando
as alturas se sobrepõem pela metade, e ordena pela altura quando não se sobrepõem. Com três prints em escada, ela
diz que A vem antes de B (mesma linha), B antes de C (mesma linha) e C antes de A (C está mais acima). O resultado
depende da ordem dos itens no quadro.

Isso muda com "Trazer para a frente" e "Enviar para trás", que só mexem na ordem de desenho.

Passo a passo:

1. Ponha três prints em escada: A em (0, 80), B em (500, 40) e C em (1000, 0), cada um com 300x100.
2. ▶ Parada três vezes: A → B → C.
3. Selecione A, toque em "Trazer para a frente", feche e abra o quadro.
4. ▶ Parada três vezes: B → C → A.

Teste que falha: `P1`.

- A função sozinha dá as ordens ABC, CAB e BCA conforme a ordem de entrada.
- Na tela, "Trazer para a frente" mudou o roteiro de A → B → C para B → C → A.

### D6 (baixa): N num quadro sem páginas

Na apresentação, a tecla N chama `addBlankAfter` sem conferir se o quadro tem páginas. Num quadro livre, o
`S.board.layout` não existe, e a página dá `TypeError: Cannot read properties of undefined (reading 'count')`. Não
acontece nada na tela, nem um aviso.

O botão Folha não aparece no quadro livre; só a tecla tem esse caminho.

Passo a passo: abra um quadro livre, apresente e aperte N. O erro aparece no console.

Teste que falha: `B1`.

## O que passou

- **Notas do professor (N1 a N3):**
  - escritas pelo painel, cada uma fica no disco na sua página;
  - inserir, duplicar e excluir página levam a nota junto;
  - Ctrl+A não seleciona as notas;
  - a miniatura e a página do PDF saem iguais, byte a byte, com e sem as notas;
  - com uma tela, não abre janela e mostra o aviso do Win + P;
  - com duas telas (pelo gancho `__gizTelasTeste` do próprio programa), a janela das notas abre com a nota da página
    atual, a seta nela passa o slide e a nota acompanha, e ao sair da apresentação a janela fecha.
- **Marcadores na galeria (M2):**
  - a busca sem acento ("otica") e pelo título do quadro funciona;
  - renomear grava;
  - apagar e Desfazer trazem o marcador de volta igual (nome, grupo, ordem, ponto e página);
  - arrastar para outro grupo e para mudar a ordem funciona;
  - com 500 marcadores, a aba abre em cerca de 0,5 s.
- **Colar onde a caneta tocou (C1):** a imagem colada fica com o canto no ponto tocado, e o texto também vai para o
  ponto.
- **Esconder até a aula (E1):**
  - o item escondido não é pego pelo Ctrl+A nem pelo toque;
  - fica salvo e marcado;
  - o R na apresentação revela.
- **Barra da apresentação (B2):** a bolinha escolhe a cor e a espessura juntas, e o traço sai com as duas.
- **Setas (B3):** por toque, 48 px de tela com zoom 1, 24 px com zoom 4, e com Shift 240 px e 120 px.
- **Marca-texto (H1):** com Shift segurado, o traço sai reto (2 pontos). Shift apertado no meio do traço também deixa
  reto.

## O que não foi testado

- A janela do programa (Tauri/WebView2), o Windows e o Edge. As duas telas de verdade, com o Rust levando a
  apresentação para o projetor e a lousa voltando ao fim.
- Mesa digitalizadora e toque de verdade. O tamanho dos alvos da D3 foi medido em pixels, não com o dedo.
- O Desfazer de vários apagamentos seguidos na galeria (cada aviso tem o seu Desfazer, e só o último fica na tela).
