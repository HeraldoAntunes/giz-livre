# Provas independentes do Giz Livre 1.16.1

Repetição das provas da 1.16.0 (`docs/PROVAS-1.16.0.md`, no ramo `provas-1.16.0`) contra a 1.16.1, que corrigiu os
defeitos A, B e C. Feita em 02/11/2026, no ramo `provas-1.16.1`, criado a partir da tag `v1.16.1` (commit
`09af9b388000fa0d3a540878f7a48fb8279d4659`). Os testes de `tests/provas/` vieram do ramo `provas-1.16.0` e foram
ajustados ao que a 1.16.1 mudou (ver "Mudanças nos testes"). O código do programa não foi alterado. Saídas completas:
`tests/provas/resultados-2026-11-02.txt`. Só dados fictícios, em pastas temporárias.

## Código testado

| Arquivo | SHA-256 |
|---|---|
| `server.py` | `ce55be508e35bf187a153b46f36421c514014f6dddec6db4a6665d980099a5cc` |
| `tests/test_server.py` | `646b6594ae89f376e2d5e521b5755f36627a1e25023698973c56539c562f03ca` |
| `tests/prova_gravacao.py` | `283ce23b5d744b428ae33667a925d7c81a8d271ed72a6225cf78418139935694` |

Ambiente: Ubuntu 24.04.5 LTS, x86_64 (contêiner na nuvem), Python 3.13.17 e 3.10.20. Não foi rodado no Windows.

## Resumo

| Prova | Resultado |
|---|---|
| `tests/prova_gravacao.py`, 3 vezes em cada Python | **passou** 6 de 6: 27 testes, 0 falhas, 0 erros, 0 pulados, 54 falhas de disco injetadas |
| `GravacaoComFalhaDeDiscoTests`, 3 vezes em cada Python | **passou** 6 de 6: 16 testes, OK |
| `tests/test_server.py` completo | **passou**: 138 testes, 5 pulados (só Windows) |
| Defeito A: `repro_revisao_zero.py` | **não reproduz mais** |
| `concorrencia_lixeira.py 90 --criar` (como a página da 1.16.1) | **passou** 90 de 90 rodadas |
| `concorrencia_lixeira.py 90` (PUT de criação sem `criar`, como na 1.16.0) | **passou** 90 de 90 rodadas |
| Defeito B: `miniatura.py` P1 e P2, com 3 s entre a miniatura e o quadro | **passou**: a PNG velha fica no disco, mas não aparece |
| Defeito B: P1 e P2, com menos de 2 s entre a miniatura e o quadro | **falhou**: a PNG velha aparece na galeria e em `/thumbs` (defeito B2, novo) |
| Defeito C: P3, P4 e P5 | **passou**: o apagar que falha vai para o log, e o id não fica preso |
| Caso novo P6: órfã e novo quadro no mesmo id | **falhou**: a órfã vira a prévia de outro quadro (defeito C2, novo) |

## Defeito A (quadro com `_rev` 0 sobrescrito): corrigido

```bash
python tests/provas/repro_revisao_zero.py
```

- **A e B do roteiro:** o quadro trazido por pacote agora fica com `_rev` 1. O `PUT` com `revision: 0` recebe 412,
  mesmo depois de excluir e restaurar o quadro.
- **D, caso novo:** um quadro com `_rev` 0 gravado por uma versão anterior. O arquivo foi escrito direto, como a
  1.16.0 o deixava. O `PUT` de criação que a página da 1.16.1 manda (`"criar": true`) recebe 412, e o quadro fica.
  O mesmo `PUT` sem `criar`, que é como a página salva a primeira edição do quadro aberto, continua aceito, como deve.

Concorrência, com restaurar, criar e importar pacote no mesmo id ao mesmo tempo:

```bash
python tests/provas/concorrencia_lixeira.py 90 --criar
```

```bash
python tests/provas/concorrencia_lixeira.py 90
```

As duas rodaram com 90 rodadas, e passaram 90 de 90 e 90 de 90. Os critérios são os da 1.16.0: os bytes da lixeira
batem com o restaurado, cada conteúdo aparece uma vez, o id tem um dono só e não sobra `.tmp`. Na 1.16.0 a segunda
forma falhava em 4 de 90 rodadas.

## Defeito B (PNG velha com JSON novo): corrigido, menos numa janela de 2 s

Critério pedido: a PNG velha pode ficar no disco, mas não pode aparecer na galeria (`GET /api/boards`, campo
`thumb`) nem em `/thumbs/<id>.png`.

```bash
python tests/provas/miniatura.py
```

A 1.16.1 só mostra a miniatura se ela não for mais velha que o `updated` do quadro, com folga de
`TOLERANCIA_MINIATURA = 2.0` s (`miniatura_vale`, pensado para a hora de 2 em 2 s do FAT32). Com 3 s entre a
miniatura velha e o quadro novo, P1 e P2 passam: a velha fica no disco, a galeria diz `thumb: false` e `/thumbs`
responde 404.

### Defeito B2 (novo): PNG velha aparece quando o quadro foi salvo menos de 2 s depois dela

Quando o quadro novo é salvo menos de 2 s depois da miniatura velha, a velha passa na conferência e aparece.

Passo a passo (P2, com 1 s; P1 mostra o mesmo dentro de um único PUT):

1. Grave o quadro `q1` com a miniatura VELHA (`PUT /api/boards/q1` com `criar: true` e `thumb`).
2. Um segundo depois, salve outro conteúdo como a página faz: `PUT /api/boards/q1` com `revision: 1` e
   `thumb: null`. O teste recua a hora da PNG com `os.utime` para fixar o intervalo em 1 s.
3. Mate o servidor (SIGKILL) antes do `PUT /api/thumbs/q1`.
4. Reabra o servidor.

Resultado: o quadro é o novo, a galeria diz `thumb: true` e `/thumbs/q1.png` responde 200 com os bytes da VELHA.

Como acontece de verdade: a página manda a miniatura 4 s depois de um salvamento (`scheduleThumb` em
`app/js/editor.js`) e salva cada mudança em até 3 s. Se o professor continuar desenhando logo depois do envio da
miniatura, o próximo salvamento cai dentro dos 2 s. Se o programa cair antes da miniatura seguinte, a galeria mostra
a prévia sem os traços desses segundos.

Alcance: a diferença é de no máximo cerca de 2 s de desenho. O quadro em si está certo, e a prévia é refeita quando
o quadro é aberto e fechado.

## Defeito C (apagar que falha): corrigido nos três caminhos

Pelo `unittest.mock`, o `Path.unlink` da PNG falha (`PermissionError`) e, conforme o caso, também o `os.replace` ou
a gravação.

- **P3, `gravar_miniatura`.** A gravação e o apagar falham. O erro do apagar vai para o `registrar` (o
  `giz-livre.log`). A velha fica no disco, mas não aparece (`thumb: false`).
- **P4, excluir.** O `os.replace` e o apagar falham. Os dois erros vão para o log. A órfã fica no disco, mas
  `id_ocupado('q1')` é falso, e o `id_publicavel` escolhe `q1` de novo: o id não fica preso.
- **P5, limpeza da abertura.** O erro vai para o log. Na abertura seguinte, sem falha, a órfã sai.

### Defeito C2 (novo): a órfã vira a prévia de outro quadro publicado no mesmo id

Como a órfã não prende mais o id, um quadro diferente pode ser publicado nesse id enquanto ela ainda está lá. O
`id_publicavel` tenta apagá-la, mas, se o apagar falhar de novo (o mesmo antivírus ou indexador segurando o arquivo),
ela fica. Ela é mais nova que o `updated` do quadro que chegou, então passa no `miniatura_vale`.

Passo a passo (P6):

1. Deixe uma órfã `q1.png` na galeria, de um quadro `q1` excluído enquanto o mover e o apagar falhavam (a P4).
2. Tenha na lixeira outro quadro `q1`, mais antigo (`updated` de uma hora antes), sem `.png` na lixeira.
3. Restaure-o, com o apagar da PNG ainda falhando. O teste faz o que o `_restaurar` faz: `id_publicavel`, depois
   `os.replace` do JSON e depois `mover_miniatura`.

Resultado: o quadro volta como `q1`, o erro vai para o log, e a galeria mostra `thumb: true` com os bytes da
miniatura do outro quadro.

Também pode acontecer ao trazer por pacote um quadro desse id sem miniatura e com `updated` antigo.

Alcance: precisa de pelo menos dois apagar que falham seguidos no mesmo arquivo, e da publicação de um quadro antigo
no mesmo id. O quadro está certo; a prévia na galeria é de outro conteúdo até ele ser aberto e fechado. Na 1.16.0,
no mesmo cenário, o id ficava preso e o restaurado voltava com outro id.

## Mudanças nos testes (só em `tests/provas/`)

- `concorrencia_lixeira.py`: opção `--criar`, para as criações levarem `"criar": true` como a página da 1.16.1.
- `repro_revisao_zero.py`: caso D, um quadro antigo com `_rev` 0, com e sem `criar`.
- `miniatura.py`: os critérios da 1.16.1. Confere a galeria, `/thumbs` e o registro do erro (antes, só o disco).
  P1 e P2 rodam com 3 s e com 1 s entre a miniatura velha e o quadro novo, e entrou o caso P6.
- `resultados-2026-10-30.txt` é a saída da 1.16.0, guardada como estava.

## O que não foi feito

- Nenhuma correção no programa, nenhuma tag e nenhuma release. A `main` não foi alterada.
- Nada rodou no Windows. As falhas de disco são injetadas com `mock`, e os intervalos de B2 são fixados com
  `os.utime`, não medidos numa queda real com a página aberta.
