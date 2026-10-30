# Provas independentes do Giz Livre 1.16.0

Validação pedida depois da auditoria externa, que não pôde rodar duas provas. Feita em 30/10/2026, no ramo
`provas-1.16.0`, criado a partir da tag `v1.16.0` (commit `8e6badd77d96ecdeae7fbceb0136f9d8f1f2a2b8`). O código do
programa não foi alterado. Os testes novos ficam em `tests/provas/`, e as saídas completas em
`tests/provas/resultados-2026-10-30.txt`. Só dados fictícios, em pastas temporárias.

## Código testado

| Arquivo | SHA-256 |
|---|---|
| `server.py` | `c346fbd8a28ee7330fd47f073571959fb4ea1ffe8bd13b037d6e3c99537e9634` |
| `tests/test_server.py` | `7b6cd3b85e751c5dae989d4bb263ee3cb347239a20cbe12cac3de5b5c20bc687` |
| `tests/prova_gravacao.py` | `283ce23b5d744b428ae33667a925d7c81a8d271ed72a6225cf78418139935694` |

Ambiente: Ubuntu 24.04.5 LTS, x86_64 (contêiner na nuvem). Python 3.13.17 (a versão da CI) e 3.10.20 (a mínima do
README). Não foi rodado no Windows.

## Resumo

| Prova | Resultado |
|---|---|
| 1. `tests/prova_gravacao.py`, 3 vezes em cada Python | **passou** 6 de 6: 20 testes, 0 falhas, 0 erros, 0 pulados, 54 falhas de disco injetadas |
| 1. `GravacaoComFalhaDeDiscoTests`, 3 vezes em cada Python | **passou** 6 de 6: 9 testes, OK |
| 2. Restaurar e criar ao mesmo tempo no mesmo id (sem pacote) | **passou** 50 de 50 rodadas |
| 2. Restaurar, criar e importar pacote ao mesmo tempo no mesmo id | **falhou** em 1 ou 2 de cada 30 rodadas (4 de 90 no total): um quadro importado foi sobrescrito (defeito A) |
| 3. PNG velha com JSON novo depois de interrupção entre as duas gravações | **sim, acontece** (defeito B) |
| 3. Falha do unlink da limpeza deixa PNG velha ou órfã | **sim, acontece** (defeito C) |

## 1. Prova de gravação e falha de disco

Comandos:

```bash
python tests/prova_gravacao.py relatorio.txt
```

```bash
python -m unittest tests.test_server.GravacaoComFalhaDeDiscoTests -v
```

Cada um rodou 3 vezes com Python 3.13.17 e 3 vezes com 3.10.20. Todas as 12 execuções passaram. A prova roda as
classes `RestauracaoConcorrenteTests`, `RestauracaoPublicacaoTests`, `IdPublicavelTests` e
`GravacaoComFalhaDeDiscoTests` e imprime os SHA-256 da tabela acima.

## 2. Restaurar e publicar ao mesmo tempo (GL-RC3-S01, `id_publicavel`)

Teste novo: `tests/provas/concorrencia_lixeira.py`. Ele não reaproveita os testes do projeto. Roda o `server.py` como
processo separado e fala com ele por HTTP. Os clientes são threads espalhadas em 3 processos, que partem juntas na
mesma hora marcada.

Em cada rodada, todos miram o **mesmo id** (`alvoN`):

- 4 restaurações de 4 quadros diferentes da lixeira, todos excluídos com esse id (criados e excluídos pela API, como
  a página faz);
- 1 restauração repetida de uma dessas entradas (só uma das duas pode valer);
- 3 criações pela página (`PUT /api/boards/alvoN` com `revision: 0`);
- 2 importações de pacote (`POST /api/pacote`) com um quadro `alvoN` de conteúdo próprio;
- 4 criações em ids novos, como carga.

O que é conferido depois de cada rodada:

- cada restauração que respondeu ok tem o arquivo com **os mesmos bytes** da lixeira;
- cada entrada não restaurada continua na lixeira com os mesmos bytes;
- cada criação com 200 está no disco com os itens enviados, e as outras recebem 412;
- cada pacote está no disco, como trazido ou como cópia;
- cada conteúdo aparece exatamente uma vez, e o id tem um dono só;
- não sobra nenhum `.tmp`.

Comandos:

```bash
python tests/provas/concorrencia_lixeira.py 50 --sem-pacote
```

```bash
python tests/provas/concorrencia_lixeira.py 30
```

Resultados:

- **Só restaurar e criar:** 50 de 50 rodadas sem perda nem sobrescrita. As restaurações renomeadas ganharam id novo,
  a restauração repetida valeu uma vez só, e as criações perdedoras receberam 412.
- **Com pacote:** 28 de 30, 29 de 30 e 29 de 30 rodadas, nas três execuções (duas com Python 3.13 e uma com 3.10).
  Em todas as falhas, o quadro de um pacote que respondeu `trazidos: 1` não está em lugar nenhum, e o dono do id é
  uma criação da página. As restaurações nunca perderam nada.

### Defeito A: quadro com `_rev` 0 é sobrescrito por um PUT de criação

Os quadros trazidos por pacote são gravados com `"_rev": 0` (`trazer_pacote` faz `board["_rev"] = 0`). O
`PUT /api/boards/<id>` trata `revision: 0` como "criar", mas só confere se `revision == atual.get("_rev", 0)`. Para um
arquivo que já existe com `_rev` 0, a conta fecha, e o PUT grava por cima: sem 412 e sem mandar o anterior para a
lixeira. O mesmo vale para um quadro desses que foi excluído e restaurado, porque a lixeira devolve o arquivo como
estava, ainda com `_rev` 0.

Reprodução determinística, sem concorrência: `python tests/provas/repro_revisao_zero.py`.

1. `POST /api/pacote` com um zip que tem `manifesto.json` (`{"formato": 1}`) e `quadros/trazido1.json`. A resposta
   é `{"trazidos": 1, ...}`, e o arquivo no disco tem `"_rev": 0`.
2. `PUT /api/boards/trazido1` com `{"board": {...outro conteúdo...}, "revision": 0}`. A resposta é **200** com
   `revision: 1`.
3. O `trazido1.json` agora tem o outro conteúdo, e a lixeira está vazia: o quadro importado sumiu.
4. Mesma coisa depois de excluir e restaurar o importado: o PUT com `revision: 0` responde 200 e sobrescreve.
5. Controle: num quadro criado pela página (`_rev` 1), o mesmo PUT recebe **412**, como deve.

Alcance: na página, um PUT com revisão 0 num id que já existe só acontece se o `newId()` sortear um id igual ao de um
quadro importado. Isso é muito improvável, porque o id leva data em base 36 e 5 caracteres sorteados. Por outro lado,
abrir o quadro importado e salvar a primeira edição também usa revisão 0, e precisa continuar funcionando. Por isso
o servidor sozinho não distingue os dois casos. O contrato "nenhum quadro pode ser sobrescrito" falha na API, e não
foi visto acontecer pela interface.

## 3. Miniatura (GL-RC6-L01)

Teste novo: `tests/provas/miniatura.py`. P1 e P2 usam o `server.py` de verdade, em outro processo. P3 a P5 carregam o
`server.py` como módulo e injetam o erro com `unittest.mock`, sem mudar o arquivo. Todas as conferências são pelos
bytes da PNG (`MINIATURA-VELHA` ou `MINIATURA-NOVA`).

```bash
python tests/provas/miniatura.py
```

### Defeito B: PNG velha com JSON novo depois de uma interrupção

**P1, no mesmo pedido.** O `PUT /api/boards/<id>` com `thumb` grava primeiro o JSON (`gravar_atomico`) e depois a
miniatura (`gravar_miniatura`). As duas gravações são atômicas cada uma, mas o par não é.

1. Grave o quadro `q1` com o texto "antes" e a miniatura VELHA.
2. Rode o mesmo `server.py` num processo que morre (`os._exit`) no instante em que `gravar_miniatura` começaria. Isso
   simula um corte de energia nesse ponto.
3. `PUT /api/boards/q1` com o texto "depois", `revision: 1` e a miniatura NOVA. A conexão cai sem resposta.
4. Reabra o `server.py` normal.

Resultado: o quadro tem o texto "depois", e a miniatura é a VELHA. A limpeza da abertura (`limpar_miniaturas_soltas`)
não mexe nela, porque o JSON existe.

**P2, pelo caminho da página.** A página salva o quadro com `thumb: null` e manda a miniatura depois, num
`PUT /api/thumbs/<id>` separado (cerca de 4 s depois, ou ao fechar o quadro). Se o servidor levar SIGKILL entre os
dois pedidos, também fica o JSON novo com a PNG velha. Esse intervalo existe em todo salvamento, não só em falha. A
miniatura velha fica na galeria até a página abrir e fechar o quadro de novo.

### Defeito C: falha do unlink da limpeza deixa PNG velha ou órfã

- **P3, `gravar_miniatura`.** A gravação da nova falha (`OSError`, disco cheio injetado), e o `unlink` da velha
  também falha (`PermissionError` injetado). Fica a VELHA com o JSON novo, e o PUT responde 200. O erro do `unlink` é
  engolido por `contextlib.suppress(OSError)`. Controle: com o `unlink` funcionando, a velha sai.
- **P4, excluir (`mover_miniatura`).** O JSON vai para a lixeira, o `os.replace` da PNG falha e o `unlink` também.
  A `q1.png` fica **órfã na galeria**, sem `q1.json`. Como `id_ocupado()` olha também a `.png`, o id fica preso: o
  `id_publicavel` desvia para outro id, e restaurar `q1` da lixeira volta com um id novo, não com `q1`.
- **P5, limpeza da abertura.** Com o `unlink` falhando, `limpar_miniaturas_soltas()` devolve 0, e a órfã continua.
  O erro é engolido (`except OSError: pass`) sem registro no `giz-livre.log`. Controle: na abertura seguinte, com o
  `unlink` funcionando, ela sai.

Alcance: P3 a P5 precisam de duas falhas de disco seguidas, no mesmo arquivo. No Windows, isso pode ser um antivírus
ou indexador segurando a PNG. P1 e P2 precisam só de uma queda no momento certo, e P2 tem um intervalo de segundos em
cada salvamento. Em todos os casos o quadro (o JSON) fica certo: o que fica errado é só a prévia na galeria, ou um id
preso.

## O que não foi feito

- Nenhuma correção no programa, nenhuma tag e nenhuma release. A `main` não foi alterada.
- Nada rodou no Windows, nem com disco de rede ou OneDrive.
- As falhas de disco de P3 a P5 são injetadas com `mock`, não são falhas reais do sistema de arquivos. Rodando como
  root no Linux, permissões não servem para provocar a falha.
