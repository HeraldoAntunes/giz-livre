# Provas independentes do Giz Livre 1.16.2

Repetição de todas as provas da 1.16.1 contra a 1.16.2, mais tentativas de quebrar a regra nova da miniatura. Feita
em 02/11/2026, no ramo `provas-1.16.2`, criado a partir da tag `v1.16.2` (commit
`fb4e35fe2ea23e0c95d2d49252114e1068946f76`). Os testes de `tests/provas/` vieram do ramo `provas-1.16.1`. O código do
programa não foi alterado. Saídas completas: `tests/provas/resultados-2026-11-02-v1.16.2.txt`. Só dados fictícios,
em pastas temporárias.

A regra nova: o servidor grava na miniatura um pedaço tEXt `giz-conteudo` com o SHA-256 do conteúdo do quadro
(`impressao_conteudo`, sem título, pasta, `_meta`, `_rev`, `updated` e vista). A galeria e o `/thumbs` só mostram a
miniatura se a marca bater com o conteúdo de agora. A miniatura sem marca segue a regra da hora da 1.16.1. Uma
avulsa sem marca que não sai faz o id desviar.

## Código testado

| Arquivo | SHA-256 |
|---|---|
| `server.py` | `fc6c8d04f48438ad4e91ffdf19a8a60c0185e0c721448c10f6827be344addfc3` |
| `tests/test_server.py` | `94b5a4ea4e2fed6193bf5eff8f9611092bc097cb8c2131992f71bd1fa55b4ed8` |
| `tests/prova_gravacao.py` | `283ce23b5d744b428ae33667a925d7c81a8d271ed72a6225cf78418139935694` |

Ambiente: Ubuntu 24.04.5 LTS, x86_64 (contêiner na nuvem), Python 3.13.17 e 3.10.20. Não foi rodado no Windows.

## Resumo

| Prova | Resultado |
|---|---|
| `tests/prova_gravacao.py`, 3 vezes em cada Python | **passou** 6 de 6: 36 testes, 0 falhas, 0 erros, 0 pulados |
| `GravacaoComFalhaDeDiscoTests`, 3 vezes em cada Python | **passou** 6 de 6: 25 testes, OK |
| `tests/test_server.py` completo | **passou**: 149 testes, 6 pulados (só Windows) |
| A: `repro_revisao_zero.py` | **não reproduz** |
| `concorrencia_lixeira.py 90 --criar` e `concorrencia_lixeira.py 90` | **passou** 90 de 90 e 90 de 90 |
| B: `miniatura.py` P1 e P2, com 3 s e com 1 s | **passou** 4 de 4 (B2 corrigido) |
| C: `miniatura.py` P3, P4 e P5 | **passou** |
| C2: P6 pelo HTTP, olhando o id devolvido (órfã sem marca, órfã com marca e pacote) | **passou** 3 de 3 |
| Regra nova: `marca_miniatura.py` | 14 passaram, **2 falharam** (M2 com 1 s e M5, abaixo) |

## A, B, C e concorrência

Os mesmos comandos da 1.16.1:

```bash
python tests/provas/repro_revisao_zero.py
```

```bash
python tests/provas/concorrencia_lixeira.py 90 --criar
```

```bash
python tests/provas/concorrencia_lixeira.py 90
```

```bash
python tests/provas/miniatura.py
```

- **B e B2:** com 3 s e com 1 s entre a miniatura velha e o quadro novo, a velha fica no disco, mas a galeria diz
  `thumb: false` e o `/thumbs` responde 404. A velha agora tem a marca do conteúdo anterior.
- **P6, ajustada:** passa pelo `POST /api/lixeira/restaurar` e pelo `POST /api/pacote` de verdade, num servidor no
  próprio processo, para o `unlink` falhar dentro do pedido. A prova olha o id devolvido.
  - Órfã sem marca: o restaurar devolveu `q1-<sorteado>`, em vez de `q1`, e não há miniatura à mostra.
  - Órfã com a marca de outro conteúdo: o restaurar devolveu `q1`, e a órfã não aparece (`thumb: false`, 404).
  - Pacote: o quadro veio como cópia (`copias: 1`), em outro id, e nenhum quadro mostra a órfã.

## Tentativas de quebrar a regra nova

```bash
python tests/provas/marca_miniatura.py
```

Usa o `server.py` de verdade, por HTTP. As PNGs são de verdade (1x1), com um rótulo próprio para saber qual imagem o
servidor entregou.

- **M1, marca forjada (passou 6 de 6).** O cliente manda pelo `PUT /api/thumbs` uma PNG com a marca de um conteúdo
  futuro. Depois o quadro passa a ter esse conteúdo. Em nenhum caso a imagem aparece.
  - Lugares testados: pedaço tEXt antes do IEND; depois do IEND; no fim do arquivo sem os 4 bytes de CRC; duas
    forjadas; dentro do texto de outro tEXt; no começo de um arquivo que não é PNG.
  - Em todos, a última marca do arquivo é a do servidor.
- **M3, renomear, mudar de pasta, salvar só o título e salvar só a vista (passou 4 de 4).** A miniatura continua
  aparecendo.
- **M4, pacote de outro PC com o mesmo conteúdo (passou 3 de 3).** A miniatura vale quando o quadro é trazido para
  um PC sem ele. Continua valendo ao trazer de novo (`iguais`). Também vale na cópia, quando o id já existia com
  outro conteúdo.
- **Observação, sem defeito.** Um quadro criado na galeria leva `"novo": true`, e a página tira esse campo ao abri-lo
  e salvar. Como `novo` não está em `FORA_DA_PREVIA`, a miniatura feita na criação deixa de valer até a página mandar
  outra, cerca de 4 s depois. Ela só some; nunca aparece errada.

### M2 com 1 s: miniatura sem marca segue a regra da hora (previsto)

Uma PNG sem o pedaço, como a 1.16.1 gravava, e um quadro salvo com outro conteúdo menos de 2 s depois dela: a
miniatura antiga aparece (`thumb: true`, `/thumbs` 200). Com 3 s, não aparece.

Passo a passo:

1. Crie o quadro.
2. Escreva no disco uma PNG sem a marca, com a hora de 1 s antes.
3. Salve outro conteúdo pelo `PUT /api/boards`.

Está escrito assim de propósito no `miniatura_vale`, para as miniaturas de antes da 1.16.2. Na prática, isso não
deve acontecer: a 1.16.2 marca toda miniatura que grava, e a atualização leva bem mais de 2 s. Uma PNG sem marca só
chega por cópia manual ou por uma lixeira com miniatura de versão antiga; no restaurar, a hora antiga do arquivo vem
junto. Fica registrado como limite, não como defeito.

### Defeito B3 (novo): miniatura de um conteúdo anterior marcada com o conteúdo novo

O servidor marca a PNG com o conteúdo que está gravado na hora em que ela chega, não com o conteúdo que ela desenha.
A página faz a prévia de um instante e só depois a manda (`saveThumbNow` em `app/js/editor.js`: copia o quadro,
espera o `PG.boardThumb` desenhar, depois chama `saveThumb`). Se um salvamento mais novo chegar ao servidor nesse
meio-tempo, a imagem velha ganha a marca do conteúdo novo e aparece como prévia dele.

Passo a passo (M5, pelo HTTP):

1. `PUT /api/boards/m5q` com `criar: true` e o conteúdo 1.
2. `PUT /api/boards/m5q` com o conteúdo 2 (a revisão devolvida no passo 1).
3. `PUT /api/thumbs/m5q` com uma imagem do conteúdo 1.

Resultado: a galeria diz `thumb: true`, e o `/thumbs/m5q.png` entrega a imagem do conteúdo 1.

Alcance: o salvamento do conteúdo 2 agenda outra miniatura 4 s depois, e ela corrige a prévia. A imagem errada só
fica se o programa cair nesses 4 s, ou se o quadro for fechado antes. Ao fechar, a página manda uma miniatura nova,
então o caso que sobra é a queda. A janela de tempo é a do desenho da prévia: milissegundos, um pouco mais em quadros
grandes com imagens. A diferença é o que mudou nesse instante. O quadro em si está certo.

Só a página sabe de qual conteúdo é a imagem. O servidor sozinho não tem como conferir isso. Não reproduzi com a
página aberta no navegador: o passo a passo acima força a ordem dos pedidos.

## Mudanças nos testes (só em `tests/provas/`)

- `miniatura.py`: reconhece a PNG pelo conteúdo, porque o servidor agora acrescenta a marca e os bytes mudam. A P6
  passou a usar o restaurar e o pacote pelo HTTP e a olhar o id devolvido, com órfã sem marca, órfã com marca e
  pacote.
- `marca_miniatura.py`: novo, com M1 a M5.
- Os arquivos `resultados-*` das versões anteriores ficam como estavam.

## O que não foi feito

- Nenhuma correção no programa, nenhuma tag e nenhuma release. A `main` não foi alterada.
- Nada rodou no Windows nem com a página aberta no navegador. As falhas de disco são injetadas com `mock`, e os
  intervalos de tempo são fixados com `os.utime` ou pela ordem dos pedidos.
