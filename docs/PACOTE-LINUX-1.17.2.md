# Pacote Linux do Giz Livre 1.17.2

Pacotes `.deb` e `.tar.gz` da versão **1.17.2** publicada (tag `v1.17.2`, commit `20a5277`), que substitui a 1.17.1.
Montados e testados em 04/11/2026, no ramo `pacote-linux-1.17.2`. O ramo parte da tag `v1.17.2` e traz o
empacotamento do ramo `pacote-linux-1.17.1` por merge, sem conflito. Nada do programa foi alterado: fora de
`scripts/linux/`, `tests/linux/` e `docs/PACOTE-LINUX*`, o ramo é igual à `v1.17.2`. O processo é o mesmo da 1.17.0 e
da 1.17.1 (`docs/PACOTE-LINUX-1.17.0.md`), sem nenhuma mudança nos scripts. Nenhum pacote foi publicado, e não foi
criada tag nem release.

**Resumo: tudo passou.** 192 conferências, nenhuma falha. `lintian` com 0 erros.

## SHA-256

Também em `docs/PACOTE-LINUX-1.17.2.SHA256SUMS`, no formato do `sha256sum -c`. Montei duas vezes e os bytes saíram
iguais.

```
3252109655a23a9f25a575e06d6a8d0563c2ed12b062d94455729435918bd9b7  giz-livre_1.17.2_all.deb
28feab17f374c5a87562c82d0ad5f1ef57b75f92b4d7d1e8f183ffe97bb77d37  giz-livre-1.17.2-linux-usuario.tar.gz
```

O `.deb` tem 1,56 MB e o `.tar.gz` tem 1,92 MB. `Maintainer`: `Heraldo Antunes
<73407236+HeraldoAntunes@users.noreply.github.com>`. Changelog com 38 versões, da 1.0.0 à 1.17.2. A 1.17.1 e a 1.17.2
saíram no mesmo dia (04/11/2026): no changelog, a 1.17.1 fica às 12:00 e a 1.17.2 às 12:01, como o Debian pede.

## Resultado

| Conferência | Resultado |
|---|---|
| Programa nos pacotes igual ao da `v1.17.2` (`diff -r` com `git archive v1.17.2`) | passou: 191 arquivos idênticos, no `.deb` e no `.tar.gz` |
| `lintian` (`--info --pedantic --display-experimental --show-overrides`) | 0 erros; 203 `dir-or-file-in-opt` cobertos pelo override; os mesmos 2 avisos de antes (`maintainer-script-empty`, `no-manual-page`) |
| Ubuntu 24.04: `.deb` e `.tar.gz` (instalar, atalho, abrir, servidor com 1.17.2, criar, salvar e reabrir um quadro, desinstalar) | passou |
| Debian 12: os mesmos passos (`.deb` com `dpkg -i`) | passou |
| Debian 12 sem Python: o `dpkg` recusa o pacote | passou |
| Fedora 40: `.tar.gz` (instalar, ícones, abrir, servidor com 1.17.2, criar e salvar, desinstalar) | passou |
| Atualizar da 1.17.1 para a 1.17.2 (Ubuntu 24.04 e Debian 12, `.deb` e `.tar.gz`): quadro igual byte a byte, na galeria e abrindo | passou nos 4 casos |

A atualização parte da 1.17.1, que é a versão substituída. Os pacotes 1.17.1 usados foram montados de novo do ramo
`pacote-linux-1.17.1` e saíram com o mesmo SHA-256 já publicado (`70ddcaf5…` e `53da9c70…`).

Saídas: `tests/linux/pacote/resultados-1.17.2-2026-11-04.txt` e `tests/linux/pacote/lintian-1.17.2-2026-11-04.txt`.

Ressalvas, as mesmas de antes: no Debian 12 o `.deb` entra por `dpkg -i`, porque a rede bloqueia o `deb.debian.org`;
no Fedora só há o `.tar.gz` e só o Fedora 40 traz o Python; o Firefox não foi testado; e falta o teste com tela de
verdade (`docs/PACOTE-LINUX.md`).

## Comandos

```bash
sh scripts/linux/montar-pacotes.sh
```

```bash
sh tests/linux/pacote/testar-pacotes.sh mirror.gcr.io/library/ubuntu:24.04 mirror.gcr.io/library/buildpack-deps:bookworm
```

```bash
sh tests/linux/pacote/testar-fedora.sh mirror.gcr.io/library/fedora:40
```

```bash
ANTIGO=dist/linux-1.17.1 sh tests/linux/pacote/testar-atualizacao.sh
```

```bash
lintian --info --pedantic --display-experimental --show-overrides dist/linux/giz-livre_1.17.2_all.deb
```

Para conferir os pacotes contra o `SHA256SUMS` do ramo:

```bash
cd dist/linux && sha256sum -c ../../docs/PACOTE-LINUX-1.17.2.SHA256SUMS
```
