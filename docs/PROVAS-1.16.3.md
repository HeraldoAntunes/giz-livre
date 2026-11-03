# Provas independentes do Giz Livre 1.16.3

Tentativas de quebrar a gravação na apresentação da 1.16.3, mais a repetição das provas anteriores. Feita em
03/11/2026, no ramo `provas-1.16.3`, criado a partir da tag `v1.16.3` (commit
`58939db3b0d1f60259072d87bd1a0ff2d9d6b7de`). Os testes de `tests/provas/` vieram do ramo `provas-1.16.2`. O código do
programa não foi alterado. Saídas completas: `tests/provas/resultados-2026-11-03-v1.16.3.txt`. Só dados fictícios,
em pastas temporárias.

O que a 1.16.3 mudou (só na página; o `server.py` mudou só o número da versão):

- **Vista pendente (`app/js/editor.js`):** trocar de slide não grava mais o quadro. A vista fica pendente e vai com
  a próxima gravação. Sozinha, ela vai 10 s depois de parar fora da apresentação, ao fechar o quadro (`flush`) ou na
  gravação de emergência ao fechar a janela.
- **Nova tentativa de imagem (`app/js/render.js`):** a imagem que falha é pedida de novo depois de 0,5 s, 2 s, 8 s e
  daí de 30 em 30 s, sempre que volta a ser desenhada.

## Código testado

| Arquivo | SHA-256 |
|---|---|
| `server.py` | `4d32151ef67de8f9064c33b7d279194bbb46c64b40a4b4215029c2acd8f3df30` |
| `app/js/editor.js` | `42cfd19e98af2f14b2f92f091d1cc722b246d8412fb8802f5a73f5977df47c70` |
| `app/js/render.js` | `533aa468452a536404a126685bee1dc0f1b3fdeeab97366c4c67a6d7010fea4d` |
| `tests/test_server.py` | `3dcecbfa992f6dd4bfba819d2a026bd53184b37edb09ac17ebc1fe2878689a9f` |
| `tests/prova_gravacao.py` | `283ce23b5d744b428ae33667a925d7c81a8d271ed72a6225cf78418139935694` |

Ambiente: Ubuntu 24.04.5 LTS, x86_64 (contêiner na nuvem). Python 3.13.17 e 3.10.20, Node 22.22.0 e Chromium
153.0.8010.12 sem janela (Playwright 1.63.0). Não foi rodado no Windows, nem no Edge, nem na janela do programa
(WebView2).

## Resumo

| Prova | 1.16.3 |
|---|---|
| T1: traço feito na apresentação chega ao disco | **passou**: 0,5 s parado; 0,6 s trocando de slide sem parar |
| T2: o programa cai na apresentação com a vista pendente | **passou**: o traço fica, e só a posição se perde |
| T3: duas janelas, A com a vista pendente e B escrevendo | **passou**: sem sobrescrita; A recebe um conflito só pela vista (ver D1) |
| T4: nova tentativa de imagem | **passou**: 5 pedidos em 45 s, sem laço, e o slide volta sozinho; com o servidor reaberto, não volta (ver D2) |
| `tests/prova_gravacao.py`, 3 vezes em cada Python | **passou** 6 de 6: 38 testes |
| `GravacaoComFalhaDeDiscoTests`, 3 vezes em cada Python | **passou** 6 de 6: 27 testes, 2 falhas esperadas (B3, marcado no projeto para a 1.17) |
| `tests/test_server.py` completo e `node tests/testes.mjs` | **passou**: 151 testes (6 pulados, 2 falhas esperadas) e 128 testes |
| A: `repro_revisao_zero.py` | **não reproduz** |
| `concorrencia_lixeira.py 90 --criar` e `concorrencia_lixeira.py 90` | **passou** 90 de 90 e 90 de 90 |
| `miniatura.py` P1 a P6 | **passou** 10 de 10 |
| `marca_miniatura.py` | 14 de 16, igual à 1.16.2: M2 com 1 s (limite previsto) e M5 (B3, ainda aberto) |

## Teste novo: `tests/provas/apresentacao.mjs`

```bash
PYTHON=.venv/bin/python node tests/provas/apresentacao.mjs
```

O deck é sintético: 12 slides PNG, cada um com uma cor no centro da tela, para conferir pelo pixel que o slide certo
apareceu. A troca é pelas setas, como o professor faz. O traço é feito com o mouse, com a caneta da barra da
apresentação. Com `--raiz <pasta>` o mesmo teste roda contra outra versão; para comparar, rodei também contra uma
cópia da tag `v1.16.2`.

### T1. Traço feito na apresentação ainda é gravado a tempo

- Parado no slide: o traço chegou ao disco em **0,5 s**.
- Trocando de slide a cada 150 ms logo depois de riscar: chegou em **0,6 s**.
- Foram só 2 gravações do quadro para 2 traços e cerca de 7 trocas de slide. A troca não grava, e o traço não espera
  a vista.
- Na 1.16.2 os tempos são iguais.

### T2. O programa cai na apresentação com a vista pendente

O servidor e o processo do navegador levam SIGKILL juntos. Não há `pagehide`, então não há gravação de emergência.

- O traço feito na apresentação (já gravado) está no disco, e o quadro reaberto o mostra.
- O slide na tela era o 8; no disco ficou a vista do slide 3, a da última gravação, a do traço. Ao reabrir, o quadro
  volta no slide 3. **Só a posição se perde, nunca um traço gravado.**
- Na 1.16.2, a vista no disco era a do slide 8, porque cada troca gravava.
- Traço feito 300 ms antes da queda: perdido, nas duas versões. A gravação espera 500 ms sem mudança (no máximo 3 s
  desde a primeira mudança). Não muda com a 1.16.3.

### T3. Gravação concorrente com a vista pendente

As duas janelas, A e B, abrem o mesmo quadro na mesma revisão. A apresenta e troca de slide, e espera 3 s. B escreve
um traço.

- **A sai da apresentação (Esc).** O traço de B foi gravado e continua no disco: não há sobrescrita. Dez segundos
  depois, a vista de A vai sozinha, com a revisão velha, e recebe **412**. A mostra "Este quadro mudou em outra
  janela. Exporte sua edição como .lousa antes de recarregar.", e o traço que A faz depois não é gravado (fica na
  página, como em todo conflito).
- **A fecha a janela** com a vista pendente. A gravação de emergência vai com a revisão velha. O traço de B continua
  no disco, e só a vista de A se perde.
- **Na 1.16.2, com o mesmo roteiro, o conflito acontece ao contrário.** A grava a vista a cada troca e sobe a
  revisão. Quem recebe o 412 é B, e o traço de B fica fora do disco, só na página de B. A 1.16.3 protege melhor quem
  escreve.

#### D1 (comportamento novo, não é perda): conflito causado só pela vista

Na 1.16.3, a janela que só apresentou (não escreveu nada) recebe o aviso de conflito quando sai da apresentação, se
outra janela gravou o quadro nesse meio-tempo. A partir daí, o que ela escrever não é gravado até recarregar.

Passo a passo:

1. Abra o mesmo quadro em duas janelas, A e B.
2. Em A, apresente e troque de slide.
3. Em B, escreva algo e espere "Salvo".
4. Em A, saia da apresentação e espere 10 s. Aparece o aviso de conflito.

Nada se perde do disco. O risco é o professor escrever em A depois do aviso e achar que gravou. Na 1.16.2 o mesmo
conflito existia, só que caía em B.

### T4. Nova tentativa de imagem: laço ou pedidos demais?

O Playwright faz falhar o pedido da imagem (`connectionreset`).

- **Uma imagem falhando sempre**, no slide da tela: **5 pedidos em 45 s**, em 0; 0,6; 2,6; 10,7 e 40,7 s. É a
  sequência prometida de 0,5/2/8/30 s, mais os 50 ms do relógio.
- **Sem laço:** a página gastou **0,07 s de CPU em 45 s** esperando.
- **Volta sozinha:** quando o servidor volta a entregar a imagem, o slide aparece sem fechar o quadro, em 25,7 s (a
  espera já estava nos 30 s).
- **Todas as 12 imagens falhando:** só a do slide na tela é pedida de novo (4 pedidos em 45 s). As que não aparecem
  não são pedidas.
- **Na 1.16.2:** 1 pedido só, e o slide fica em branco até fechar o quadro. É o defeito que a 1.16.3 corrigiu.

#### D2 (limite): com o programa reaberto, a nova tentativa não ajuda

Se o servidor for reaberto enquanto a janela antiga continua aberta, o código da sessão muda. O cookie da janela
antiga deixa de valer, e toda nova tentativa recebe **401**.

Passo a passo:

1. Abra o quadro e apresente.
2. Mate o servidor e abra de novo.
3. Vá para um slide que ainda não tinha aparecido.

Resultado: o slide fica em branco. São 4 pedidos em 45 s, todos com 401, e depois um a cada 30 s, sem fim. A página
mostra a faixa para recarregar. O CHANGELOG cita "programa reaberto no meio da aula" como um caso que agora volta
sozinho. Nesse caso, só volta depois de recarregar; o slide que já estava na memória continua aparecendo. Na janela
do programa no Windows, reabrir o programa costuma abrir a janela de novo, e aí o problema não aparece; isso não foi
testado.

## Provas anteriores

Os mesmos comandos da 1.16.2. O resultado é igual ao da 1.16.2, o que era o esperado, porque o servidor não mudou.

O B3 (`marca_miniatura.py`, M5) continua aberto. O próprio projeto já o marcou como falha esperada em
`tests/test_server.py` (`test_miniatura_de_revisao_anterior_nao_vira_previa_da_seguinte`, para a 1.17). O mesmo vale
para a observação do campo `novo` (`test_marca_novo_da_criacao_nao_muda_a_impressao`).

## O que não foi feito

- Nenhuma correção no programa, nenhuma tag e nenhuma release. A `main` não foi alterada.
- Nada rodou no Windows, no Edge ou no WebView2. O deck tem 12 slides pequenos, não os 203 da aula. O tempo de troca
  num PC lento é o `tests/carga_apresentacao.mjs` do projeto que mede, e ele não roda no Linux (o caminho do Edge
  está fixo).
- A queda da T2 é SIGKILL no servidor e no navegador. Falta de energia de verdade pode perder também o que o disco
  ainda não gravou; isso é o que `prova_gravacao.py` cobre do lado do servidor.
