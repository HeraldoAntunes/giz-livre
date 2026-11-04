# Pacote Linux do Giz Livre 1.17.2

Pacotes `.deb` e `.tar.gz` da versão **1.17.2** publicada (tag `v1.17.2`, commit `20a5277`), montados e testados em
04/11/2026 no ramo `pacote-linux-1.17.2`. O ramo parte da tag `v1.17.2` e traz o empacotamento do ramo
`pacote-linux-1.17.1` por merge, sem conflito. Nada do programa foi alterado: fora de `scripts/linux/`, `tests/linux/`
e `docs/PACOTE-LINUX*`, o ramo é igual à `v1.17.2`. Os scripts são os mesmos da 1.17.1.

Desta vez a montagem e os testes foram feitos **no Ubuntu 26.04 do WSL** do computador do professor, com o Python
3.14.4, e não na nuvem, que estava sem crédito. Por isso não houve os testes em contêiner (Debian 12, Fedora 40,
Ubuntu 22.04 e 24.04) nem o teste de atualização da versão anterior. Nenhum pacote foi publicado.

**Resumo: tudo passou.** `lintian` com 0 erros.

## SHA-256

Também em `docs/PACOTE-LINUX-1.17.2.SHA256SUMS`, no formato do `sha256sum -c`. Montei duas vezes e os bytes saíram
iguais.

```
ec04ba59c7575a1bae8e8018e812aacfff7a9b0e14f34c41172a9e72579f9bde  giz-livre_1.17.2_all.deb
6ff906c70dee1528c5f3423d2f3b9fb95fcc0d1c5f19ddd989ea5476e039df93  giz-livre-1.17.2-linux-usuario.tar.gz
```

O `.deb` tem 1,56 MB e o `.tar.gz` tem 1,92 MB. `Maintainer`: `Heraldo Antunes
<73407236+HeraldoAntunes@users.noreply.github.com>`. `Depends: python3 (>= 3.10)`. Changelog com 38 versões, da
1.0.0 à 1.17.2.

## Resultado (Ubuntu 26.04 no WSL)

| Conferência | Resultado |
|---|---|
| Programa nos pacotes igual ao da `v1.17.2` (`cmp` com `git archive v1.17.2`) | passou: 191 arquivos idênticos, no `.deb` e no `.tar.gz` |
| Nenhum caminho pessoal nos pacotes (pasta do usuário, `AppData`, pasta dos projetos) | passou: nada encontrado |
| `lintian` (`--info --pedantic --display-experimental --show-overrides`) | 0 erros; 203 `dir-or-file-in-opt` cobertos pelo override; os mesmos 2 avisos de antes (`maintainer-script-empty`, `no-manual-page`) |
| `.deb`: `dpkg -i`, atalho em `/usr/share/applications`, `giz-livre` no caminho | passou |
| `.deb`: servidor aberto pelo `giz-livre`, responde em 127.0.0.1 com a versão 1.17.2 | passou |
| `test_server.py` contra o programa instalado em `/opt/giz-livre` (só leitura, conta comum) | passou em 3 rodadas seguidas (162 testes, 4 pulados por serem só do Windows) |
| `.deb`: `dpkg -P` sem sobras (`/opt`, `/usr/bin`, `/usr/share`, `/etc`, `/var/lib/dpkg/info`, antes e depois) | passou |
| `.tar.gz`: `instalar.sh` sem `sudo`, servidor com a 1.17.2, `desinstalar.sh` | passou |

Observações dos testes:
- O `test_server.py` lê `installer/lousa.iss`, que é do instalador do Windows e não vai no pacote Linux. Para rodar
  contra o instalado, a pasta `installer/` da fonte foi ligada ao lado do programa.
- Em 2 de 5 rodadas da classe `GravacaoComFalhaDeDiscoTests` contra o instalado, o teste
  `test_miniatura_de_um_segundo_antes_nao_aparece_depois_da_queda` falhou e passou em seguida. Passou nas 3 rodadas
  inteiras, em 12 rodadas sozinho e em 12 rodadas contra a fonte. Parece choque entre testes: a lembrança das
  miniaturas é por id do quadro, e dois testes seguidos usam o mesmo id em pastas diferentes. Se os dois arquivos
  ficam com a mesma hora e o mesmo tamanho (no WSL a hora dos arquivos anda em passos), vale a lembrança do outro
  teste. Fica registrado para a equipe olhar; não é do pacote.
- Depois do `desinstalar.sh` sobram só a pasta `~/.local/share` (padrão do Linux, vazia) e o registro do servidor de
  teste, que fica ao lado da pasta de dados passada com `--dados`.

Saídas: `tests/linux/pacote/resultados-1.17.2-2026-11-04.txt` e `tests/linux/pacote/lintian-1.17.2-2026-11-04.txt`.

Ressalvas: não houve teste com tela de verdade, mesa digitalizadora e projetor; nem em Debian, Fedora ou Ubuntu
22.04/24.04 nesta versão (a 1.17.1 passou neles, com os mesmos scripts); o Firefox não foi testado.

## Comandos

```bash
sh scripts/linux/montar-pacotes.sh
```

```bash
lintian --info --pedantic --display-experimental --show-overrides dist/linux/giz-livre_1.17.2_all.deb
```

Para conferir os pacotes contra o `SHA256SUMS` do ramo:

```bash
cd dist/linux && sha256sum -c ../../docs/PACOTE-LINUX-1.17.2.SHA256SUMS
```
