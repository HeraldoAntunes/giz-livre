# Pacote Linux do Giz Livre 1.17.0

Pacotes `.deb` e `.tar.gz` da versão **1.17.0** publicada (tag `v1.17.0`, commit `e5db9ea`, o mesmo da `main`),
montados e testados em 04/11/2026, no ramo `pacote-linux-1.17.0`. Esse ramo parte do `pacote-linux-distros` (o
empacotamento corrigido da 1.16.3) e traz o código da `v1.17.0` por merge. A 1.17.0 descende da 1.16.3 e não mexe em
nada do empacotamento, então o merge entrou sem conflito. Nada do programa foi alterado: fora de `scripts/linux/`,
`tests/linux/` e `docs/PACOTE-LINUX*.md`, o ramo é igual à `v1.17.0` (`git diff v1.17.0 HEAD` não mostra nenhum outro
arquivo). Nenhum pacote foi publicado, e não foi criada tag nem release.

**Resumo:** tudo passou. O conteúdo do programa nos pacotes é idêntico ao da tag. Instalar, abrir, conferir o
servidor e desinstalar passou no Ubuntu 24.04, no Debian 12 e no Fedora 40. O `lintian` deu 0 erros, depois de uma
correção no changelog. Os quadros feitos na 1.16.3 continuam lá, iguais byte a byte, depois de atualizar para a
1.17.0, e abrem nela.

## SHA-256 dos pacotes finais

Montei duas vezes e os bytes saíram iguais. Mesmo `Maintainer`, ícones, changelog e override do `pacote-linux-distros`.

```
e6a99a9c8c481126ae63d9df73af5871444e8aca9395740134b09e58062ade7f  giz-livre_1.17.0_all.deb
c5ba18bec14c403b709cf46a37d374e91b8e4bf0318593cb7994fffd9e5bb16d  giz-livre-1.17.0-linux-usuario.tar.gz
```

O `.deb` tem 1,55 MB (cerca de 6,1 MB instalado) e o `.tar.gz` tem 1,92 MB.

| Campo do `.deb` | Valor |
|---|---|
| `Version` | `1.17.0` |
| `Maintainer` | `Heraldo Antunes <73407236+HeraldoAntunes@users.noreply.github.com>` |
| `Depends` | `python3 (>= 3.10)` |
| `Suggests` | `chromium \| chromium-browser \| google-chrome-stable \| firefox \| firefox-esr, libreoffice-impress` |
| Ícones | `hicolor` 48, 64, 128 e 256 (PNG) e `scalable` (SVG) |
| Changelog | `/usr/share/doc/giz-livre/changelog.gz`, gerado do `CHANGELOG.md` (36 versões, da 1.0.0 à 1.17.0) |
| Override do `lintian` | `/usr/share/lintian/overrides/giz-livre` (`/opt` de propósito) |

## Resultado

| Passo | Ubuntu 24.04.5 | Debian 12.15 | Fedora 40 |
|---|---|---|---|
| `app/`, `server.py` e o resto do programa iguais aos da `v1.17.0` | passou (vale para os dois pacotes, em qualquer sistema) | | |
| Instalar o `.deb` | passou (`apt install ./`, o Python veio pela dependência) | passou (`dpkg -i`, veja as ressalvas) | não se aplica (sem `.rpm`) |
| Instalar o `.tar.gz` (sem `sudo`) | passou | passou | passou |
| `desktop-file-validate` no atalho | passou | passou | passou |
| Ícones nos tamanhos certos | passou | passou | passou (48, 64, 128, 256 e SVG) |
| Abrir sem janela; servidor respondendo com 1.17.0 | passou | passou | passou (`/api/info`) |
| Criar e salvar um quadro pela interface | passou | passou | passou |
| Reabrir o quadro | passou | passou | não testado (o teste do Fedora só cria e salva) |
| Desinstalar sem sobra, com os quadros intactos | passou | passou | passou |
| Atualizar da 1.16.3 para a 1.17.0, `.deb` | passou | passou | não se aplica |
| Atualizar da 1.16.3 para a 1.17.0, `.tar.gz` | passou | passou | não testado |
| `dpkg -i` num Debian 12 sem Python recusa o pacote | | passou | |
| `lintian` no `.deb` | 0 erros, 2 avisos (vale para todos) | | |

Saídas: `tests/linux/pacote/resultados-1.17.0-2026-11-04.txt` (Ubuntu, Debian e Fedora),
`tests/linux/pacote/resultados-atualizacao-1.16.3-1.17.0-2026-11-04.txt` (atualização) e
`tests/linux/pacote/lintian-1.17.0-2026-11-04.txt` (`lintian`).

## O programa dentro dos pacotes é o da v1.17.0

O teste extraiu o `.deb` (`dpkg-deb -x`) e o `.tar.gz` e comparou, com `diff -r`, o `/opt/giz-livre` e o `programa/`
com uma cópia da tag (`git archive v1.17.0 server.py app mcp LICENSE THIRD-PARTY-NOTICES.md CHANGELOG.md
docs/GUIA-DE-USO.md`). Os 191 arquivos são idênticos nos dois pacotes, e não há nenhum a mais nem a menos. O `app/` e o
`server.py` juntos dão o resumo
`907071090b7670839015638765fcbaaae49d8387ee087b25800f9bb8348f4c63` (SHA-256 da lista de SHA-256 de cada arquivo, em
ordem). Para repetir:

```bash
git archive v1.17.0 server.py app mcp LICENSE THIRD-PARTY-NOTICES.md CHANGELOG.md docs/GUIA-DE-USO.md | tar x -C /tmp/tag
```

```bash
dpkg-deb -x dist/linux/giz-livre_1.17.0_all.deb /tmp/deb && diff -r /tmp/tag /tmp/deb/opt/giz-livre && echo idêntico
```

## Atualização da 1.16.3 para a 1.17.0

`tests/linux/pacote/testar-atualizacao.sh` (novo) instala o pacote 1.16.3 final do `pacote-linux-distros`
(`15f7cb23…` o `.deb` e `dffcd575…` o `.tar.gz`; montados de novo daquele ramo, com o mesmo SHA-256 já publicado) e
abre o programa na conta comum `prof`. Pelo código da conta, como a página faz, grava um quadro com um traço e o texto
"Feito na 1.16.3". Depois fecha o programa, guarda o SHA-256 de cada arquivo de quadro e instala a 1.17.0 por cima
(`apt install ./` ou `dpkg -i` no `.deb`; `./instalar.sh` no `.tar.gz`).

| Conferência, depois de atualizar | Ubuntu 24.04, `.deb` | Ubuntu 24.04, `.tar.gz` | Debian 12, `.deb` | Debian 12, `.tar.gz` |
|---|---|---|---|---|
| A versão instalada é a 1.17.0, e o programa no ar responde 1.17.0 | passou | passou | passou | passou |
| Os arquivos dos quadros estão iguais, byte a byte (SHA-256) | passou | passou | passou | passou |
| O quadro da 1.16.3 aparece na galeria da 1.17.0 e abre com o traço e o texto | passou | passou | passou | passou |
| Desinstalar (no `.deb`, `purge`) deixa os quadros, iguais | passou | passou | passou | passou |

Na atualização do `.deb`, o aviso "Os quadros NÃO foram apagados" não aparece: o `postrm` só fala na remoção, e não na
troca de versão, como deve ser.

## `lintian`

A primeira montagem da 1.17.0 deu **1 erro novo**: `latest-changelog-entry-without-new-date`. A 1.16.3 e a 1.17.0
foram publicadas no mesmo dia (03/11/2026), e o conversor do changelog punha meio-dia em todas as entradas. O Debian
quer cada entrada mais nova que a anterior. Corrigi o `scripts/linux/changelog_debian.py`: cada versão a mais no
mesmo dia ganha um minuto (a 1.16.3 fica às 12:00, a 1.17.0 às 12:01), de forma fixa, então montar de novo dá os
mesmos bytes. Depois disso:

| Tipo e etiqueta | 1.16.3 (`pacote-linux-distros`) | 1.17.0, 1ª montagem | 1.17.0, final |
|---|---|---|---|
| E: `latest-changelog-entry-without-new-date` | 0 | 1 | 0 |
| O: `dir-or-file-in-opt` (coberto pelo override) | 197 | 203 | 203 |
| W: `maintainer-script-empty` | 1 | 1 | 1 |
| W: `no-manual-page` | 1 | 1 | 1 |
| **Erros** | **0** | **1** | **0** (saída 0) |

Os 203 `O:` são os 197 de antes mais os arquivos novos do `app/` da 1.17.0; o override (`opt/giz-livre/*`) já os
cobre. Os 2 avisos são os mesmos de antes, que a gestão pediu só para registrar.

## Ressalvas

As mesmas de antes:

- **Debian 12 sem `apt`.** A rede deste ambiente bloqueia o `deb.debian.org`. O Debian 12 foi testado com a imagem
  `buildpack-deps:bookworm` (Debian 12 oficial, já com o `python3` do Debian). O `.deb` entrou com `dpkg -i`, e o
  `desktop-file-validate` e o Chromium rodaram fora do contêiner. Ficou sem teste o `apt install ./` puxando o Python
  no Debian.
- **Fedora só com o `.tar.gz` e só o Fedora 40.** Não há `.rpm`, e a rede bloqueia o `dnf`. Só a imagem do Fedora 40
  traz o Python.
- **Firefox não testado.** Os testes abrem a página no Chromium.
- Tudo o que pede tela de verdade, listado em `docs/PACOTE-LINUX.md`.

## Comandos

Da raiz do repositório, no ramo `pacote-linux-1.17.0`:

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
lintian --info --pedantic --display-experimental --show-overrides dist/linux/giz-livre_1.17.0_all.deb
```

Para a atualização, primeiro os pacotes 1.16.3, montados do ramo `pacote-linux-distros` numa cópia de trabalho à
parte e copiados para `dist/linux-1.16.3/`:

```bash
git worktree add /tmp/giz-1.16.3 pacote-linux-distros
```

```bash
(cd /tmp/giz-1.16.3 && sh scripts/linux/montar-pacotes.sh) && mkdir -p dist/linux-1.16.3 && cp /tmp/giz-1.16.3/dist/linux/* dist/linux-1.16.3/
```

```bash
sh tests/linux/pacote/testar-atualizacao.sh
```
