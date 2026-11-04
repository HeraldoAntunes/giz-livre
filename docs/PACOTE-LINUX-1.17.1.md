# Pacote Linux do Giz Livre 1.17.1

Pacotes `.deb` e `.tar.gz` da versão **1.17.1** publicada (tag `v1.17.1`, commit `45b2993`), montados e testados em
04/11/2026, no ramo `pacote-linux-1.17.1`. O ramo parte da tag `v1.17.1` e traz o empacotamento do ramo
`pacote-linux-1.17.0` por merge, sem conflito. Nada do programa foi alterado: fora de `scripts/linux/`,
`tests/linux/` e `docs/PACOTE-LINUX*`, o ramo é igual à `v1.17.1`. O processo é o mesmo da 1.17.0
(`docs/PACOTE-LINUX-1.17.0.md`), sem nenhuma mudança nos scripts. Nenhum pacote foi publicado, e não foi criada tag
nem release.

**Resumo: tudo passou.** 192 conferências, nenhuma falha. `lintian` com 0 erros.

## SHA-256

Também em `docs/PACOTE-LINUX-1.17.1.SHA256SUMS`, no formato do `sha256sum -c`. Montei duas vezes e os bytes saíram
iguais.

```
70ddcaf5b00c7ebf3ca4e875609094f995932c8d2ff4177c5f51e16b4460ecaf  giz-livre_1.17.1_all.deb
53da9c70e41259d051fe8b632a0b567bd0a935e5384e0901af69cbd1cb9cce12  giz-livre-1.17.1-linux-usuario.tar.gz
```

O `.deb` tem 1,56 MB e o `.tar.gz` tem 1,92 MB. `Maintainer`: `Heraldo Antunes
<73407236+HeraldoAntunes@users.noreply.github.com>`. Changelog com 37 versões, da 1.0.0 à 1.17.1.

## Resultado

| Conferência | Resultado |
|---|---|
| Programa nos pacotes igual ao da `v1.17.1` (`diff -r` com `git archive v1.17.1`) | passou: 191 arquivos idênticos, no `.deb` e no `.tar.gz` |
| `lintian` (`--info --pedantic --display-experimental --show-overrides`) | 0 erros; 203 `dir-or-file-in-opt` cobertos pelo override; os mesmos 2 avisos de antes (`maintainer-script-empty`, `no-manual-page`) |
| Ubuntu 24.04: `.deb` e `.tar.gz` (instalar, atalho, abrir, servidor com 1.17.1, criar, salvar e reabrir um quadro, desinstalar) | passou |
| Debian 12: os mesmos passos (`.deb` com `dpkg -i`) | passou |
| Debian 12 sem Python: o `dpkg` recusa o pacote | passou |
| Fedora 40: `.tar.gz` (instalar, ícones, abrir, servidor com 1.17.1, criar e salvar, desinstalar) | passou |
| Atualizar da 1.17.0 para a 1.17.1 (Ubuntu 24.04 e Debian 12, `.deb` e `.tar.gz`): quadro igual byte a byte, na galeria e abrindo | passou nos 4 casos |

Os pacotes 1.17.0 usados na atualização foram montados de novo do ramo `pacote-linux-1.17.0` e saíram com o mesmo
SHA-256 já publicado (`e6a99a9c…` e `c5ba18be…`).

Saídas: `tests/linux/pacote/resultados-1.17.1-2026-11-04.txt` e `tests/linux/pacote/lintian-1.17.1-2026-11-04.txt`.

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
ANTIGO=dist/linux-1.17.0 sh tests/linux/pacote/testar-atualizacao.sh
```

```bash
lintian --info --pedantic --display-experimental --show-overrides dist/linux/giz-livre_1.17.1_all.deb
```

Para conferir os pacotes contra o `SHA256SUMS` do ramo:

```bash
cd dist/linux && sha256sum -c ../../docs/PACOTE-LINUX-1.17.1.SHA256SUMS
```
