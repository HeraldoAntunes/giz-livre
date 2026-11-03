# Pacote Linux do Giz Livre 1.16.3 em várias distribuições

Conferência dos pacotes Linux do Giz Livre **1.16.3** (tag `v1.16.3`, commit `58939db`), feita em 03/11/2026 no ramo
`pacote-linux-distros`, que sai do `pacote-linux-1.16.3`. Nada do programa foi alterado. Foram duas rodadas, no mesmo
dia:

1. **Conferência**, com os pacotes da 1.16.3 como estavam. Ela achou 7 defeitos, descritos a partir de "O que já
   estava provado".
2. **Correções** dos defeitos no empacotamento (`scripts/linux/`), seguidas de novos testes. Estão logo abaixo, em
   "Correções: antes e depois".

Pacotes da primeira rodada (os mesmos da 1.16.3):

```
53d7f24e6410331c930b09124ab10c0aaa26d251cd58e79a564039b41878fdac  giz-livre_1.16.3_all.deb
ba4257cd5b8bc223a5fd6dde6c613ecb5359fb8035357c9fd5b4d0faff3cd128  giz-livre-1.16.3-linux-usuario.tar.gz
```

**Resumo:** o pacote funciona nas quatro distribuições em que dá para rodar. No Fedora, como não há `.rpm`, funciona
o `.tar.gz`, onde houver Python. A conferência dos arquivos achou **7 defeitos, todos pequenos e nenhum que impeça o
uso**: 3 erros do `lintian` (um deles vem da escolha de instalar em `/opt`), ícone num tamanho só, aviso de Python
que só fala do `apt`, LibreOffice não sugerido e 2 avisos do `lintian` sem efeito prático. Nenhum quadro se perdeu em
nenhuma desinstalação.

## Correções: antes e depois

Pedidas pela gestão depois da primeira rodada. Só mudou o empacotamento (`scripts/linux/`) e o teste do Fedora; o
programa é o mesmo.

| Defeito | Antes | Depois |
|---|---|---|
| 1. Arquivos em `/opt` | 197 erros `dir-or-file-in-opt` | `/opt` mantido. Os 197 agora aparecem como `O:` (cobertos pelo override `/usr/share/lintian/overrides/giz-livre`), com o motivo escrito no arquivo: programa autocontido, fora da distribuição, no lugar que o FHS reserva para isso |
| 2. `Maintainer` sem e-mail | `Heraldo Antunes (Giz Livre)`: 1 erro `malformed-contact` | `Heraldo Antunes <PREENCHER-EMAIL-DO-MANTENEDOR>`. **Falta a escolha do professor.** O e-mail não foi inventado nem completado. Até lá o `lintian` continua dando 1 `malformed-contact` e, por causa do changelog novo, 35 `bogus-mail-host-in-debian-changelog` (o mesmo marcador em cada uma das 35 entradas). Os dois somem quando o e-mail for preenchido |
| 3. Sem changelog no pacote | 1 erro `no-changelog` | `/usr/share/doc/giz-livre/changelog.gz`, gerado do `CHANGELOG.md` no formato do Debian por `scripts/linux/changelog_debian.py` (35 versões, da 1.0.0 à 1.16.3). O `lintian` não acusa mais nem a falta nem erro de formato |
| 4. Ícone num tamanho só | só `128x128` | `48x48`, `64x64`, `128x128` e `256x256` (PNG) e `scalable` (o `app/icon.svg`), no `.deb` e no `.tar.gz`. O de 128 continua sendo o `docs/img/icone.png`; os outros foram desenhados a partir do `app/icon.svg`, que é o mesmo desenho, e estão em `scripts/linux/icones/` |
| 5. Aviso de Python só com `apt` | "No Ubuntu ou Debian: sudo apt install python3" | O `instalar.sh`, o launcher e o `LEIA-ME.txt` dão o comando de cada uma: `sudo apt install python3` (Ubuntu e Debian), `sudo dnf install python3` (Fedora), `sudo zypper install python3` (openSUSE) e `sudo pacman -S python` (Arch) |
| 6. LibreOffice não sugerido | fora do `Suggests` | `Suggests: ..., libreoffice-impress`, e a descrição do pacote, o `LEIA-ME.txt` e o fim do `instalar.sh` (quando não acha o LibreOffice) dizem que ele serve para trazer arquivos do PowerPoint |
| 7. Dois avisos sem efeito | `maintainer-script-empty [postrm]` e `no-manual-page` | Só registrados, como pedido. Continuam iguais (motivos no defeito 7, abaixo) |

`lintian` (2.117, `--info --pedantic --display-experimental --show-overrides`), antes e depois:

| Tipo e etiqueta | Antes | Depois |
|---|---|---|
| E: `dir-or-file-in-opt` | 197 | 0 (197 cobertos pelo override, `O:`) |
| E: `malformed-contact` | 1 | 1 (marcador do e-mail) |
| E: `no-changelog` | 1 | 0 |
| E: `bogus-mail-host-in-debian-changelog` | 0 | 35 (marcador do e-mail, no changelog novo) |
| W: `maintainer-script-empty` | 1 | 1 |
| W: `no-manual-page` | 1 | 1 |

Testes depois das correções:

| Passo | Ubuntu 24.04 (`.deb` e `.tar.gz`) | Fedora 40 (`.tar.gz`) | Fedora 45 (sem Python) |
|---|---|---|---|
| Instalar | passou | passou | recusou, como devia, agora com o comando de cada distribuição |
| `desktop-file-validate` no atalho | passou | passou | não se aplica |
| Ícones 48, 64, 128 e 256 (tamanho real confere com a pasta) e `scalable` | passou (no `.deb` instalado) | passou | não se aplica |
| `changelog.gz`, override e `Suggests` no `.deb` instalado | passou | não se aplica | não se aplica |
| Abrir pelo atalho, servidor respondendo | passou | passou (`/api/info`: 1.16.3) | não se aplica |
| Criar, salvar e reabrir um quadro | passou | criar e salvar: passou | não se aplica |
| Desinstalar sem sobra, com os quadros intactos | passou | passou | não se aplica |
| `dpkg -i` num Debian 12 sem Python recusa o pacote | passou | | |

Saídas: `tests/linux/pacote/lintian-1.16.3-corrigido-2026-11-03.txt`,
`tests/linux/pacote/resultados-ubuntu-24.04-corrigido-2026-11-03.txt` e
`tests/linux/pacote/resultados-fedora-corrigido-2026-11-03.txt`.

Pacotes corrigidos e testados (montei duas vezes e os bytes saíram iguais):

```
982ab042c3504956bf4a1ed17ae60ce71eca0d6fb1acd9f53c446567e4d42cb4  giz-livre_1.16.3_all.deb
a9d1c09d482a3656094020db8e243a5e9ec0e0a4c39b13ba98553df456c7c8d4  giz-livre-1.16.3-linux-usuario.tar.gz
```

O `.deb` passou de 1,50 MB para 1,53 MB (ícones e changelog), e o `.tar.gz` de 1,88 MB para 1,90 MB.

**Falta a escolha do professor:** o e-mail do campo `Maintainer`. Quando ele escolher, basta montar com
`sh scripts/linux/montar-pacotes.sh --mantenedor "Heraldo Antunes <email>"`, ou trocar o marcador no
`scripts/linux/montar-pacotes.sh`. Os 36 erros que sobraram no `lintian` somem com isso.

Outra mudança: montar os pacotes agora também precisa do `python3`, que gera o changelog. Ele já era necessário para
rodar o programa.

Não repeti no Ubuntu 22.04 e no Debian 12, porque as correções não mexem em nada que seja diferente entre eles e o
Ubuntu 24.04 (só arquivos a mais, textos e campos do pacote).

## O que já estava provado (não repeti)

No Ubuntu 22.04, no Ubuntu 24.04 e no Debian 12, a rodada da 1.16.3 (`docs/PACOTE-LINUX-1.16.3.md`, saída em
`tests/linux/pacote/resultados-1.16.3-2026-11-03.txt`) já fez, com estes mesmos pacotes (mesmo SHA-256):

- instalar o `.deb` e o `.tar.gz`;
- `desktop-file-validate` no atalho instalado;
- abrir pelo comando do atalho, com o servidor no ar e a página aberta no Chromium, sem janela e com Xvfb;
- criar, salvar e reabrir um quadro;
- desinstalar e conferir que nada sobrou e que os quadros ficaram.

Aqui entram só as coisas novas: o Fedora, o `lintian`, os tamanhos de ícone, as permissões e as dependências.

## Tabela: distribuição x passo

| Passo | Ubuntu 22.04 | Ubuntu 24.04 | Debian 12 | Fedora 40 | Fedora 45 (a mais nova) |
|---|---|---|---|---|---|
| Instalar o `.deb` | passou¹ | passou¹ | passou¹ (`dpkg -i`) | não se aplica (sem `.rpm`) | não se aplica (sem `.rpm`) |
| Instalar o `.tar.gz` (sem `sudo`) | passou¹ | passou¹ | passou¹ | **passou** | recusou, como devia: a imagem não tem Python (defeito 5) |
| `desktop-file-validate` no atalho | passou¹ | passou¹ | passou¹ | **passou** | não se aplica |
| Ícone instalado (PNG 128x128) | passou¹ | passou¹ | passou¹ | **passou** | não se aplica |
| Abrir pelo atalho; servidor respondendo | passou¹ (e com Xvfb) | passou¹ (e com Xvfb) | passou¹ | **passou** (`/api/info` respondeu 1.16.3) | não se aplica |
| Criar e salvar um quadro | passou¹ | passou¹ | passou¹ | **passou** | não se aplica |
| Desinstalar sem sobra | passou¹ | passou¹ | passou¹ | **passou** | não se aplica |
| Quadros ficam em `~/.local/share/giz-livre` | passou¹ | passou¹ | passou¹ | **passou** | não se aplica |
| `lintian` no `.deb` (vale para todas) | 3 erros e 2 avisos (defeitos 1 a 3 e 7) | | | | |
| Tamanhos de ícone | só 128x128 (defeito 4) | | | | |
| Permissões | passou | | | | |
| Dependências declaradas | passou, com uma ressalva (defeito 6) | | | | |

¹ Provado na rodada da 1.16.3, com os mesmos pacotes. Não foi repetido aqui.

Saídas desta rodada: `tests/linux/pacote/resultados-fedora-2026-11-03.txt` (Fedora) e
`tests/linux/pacote/lintian-1.16.3-2026-11-03.txt` (`lintian`).

## Fedora

A rede deste ambiente bloqueia os espelhos do Fedora (`mirrors.fedoraproject.org`), então o `dnf` não instala nada.
O teste usou só o que vem nas imagens oficiais:

- **Fedora 40:** a imagem traz o Python 3.12.8. O `.tar.gz` funcionou inteiro, na conta comum `prof`:
  1. `./instalar.sh`;
  2. `desktop-file-validate` (rodou fora do contêiner, na cópia exata do atalho, porque o Fedora mínimo não tem a
     ferramenta);
  3. ícone PNG 128x128;
  4. abrir pelo comando do atalho;
  5. `/api/info` respondendo `{"versao": "1.16.3", "app": "giz-livre"}`;
  6. o `server.py` chamando o navegador com a chave de uso único;
  7. criar e salvar um quadro, pelo Chromium daqui de fora;
  8. fechar e ver o servidor se encerrar sozinho;
  9. quadro no disco com permissão `600`;
  10. desinstalar: a pasta pessoal voltou a ser como antes, e o quadro ficou.
- **Fedora 41, 42 e 45:** as imagens mínimas não trazem Python. O `instalar.sh` recusou, com saída 1, sem instalar
  nada, e disse que precisa do Python 3.10. Num Fedora Workstation de verdade o Python vem instalado. Isso não foi
  testado aqui.

O `.deb` não serve no Fedora, e não há `.rpm`. Para o Fedora, hoje, o caminho é o `.tar.gz`.

Para repetir: `sh tests/linux/pacote/testar-fedora.sh` (padrão: `fedora:40` e `fedora:latest`, do espelho
`mirror.gcr.io`). As imagens não têm `su`, `pgrep` nem `ps`, então o teste usa `docker exec -u prof` e o `/proc`.

## Arquivos do pacote

### Permissões: passou

- `.deb`: os 213 itens são de `root:root`. Os 188 arquivos são `644`, os 24 diretórios são `755`, e só o
  `/usr/bin/giz-livre` é `755`. Nada é setuid nem gravável por todos. O único script de controle é o `postrm`.
- `.tar.gz`: dono `0:0`. Arquivos `644` e diretórios `755`; só `instalar.sh`, `desinstalar.sh` e o modelo do
  launcher são `755`.
- Instalado: os quadros ficam com permissão `600` e dono do professor (conferido no Fedora 40 e, antes, nos outros
  três).

Como conferir: `dpkg-deb -c dist/linux/giz-livre_1.16.3_all.deb` e `tar tvzf dist/linux/giz-livre-1.16.3-linux-usuario.tar.gz`.

### Dependências declaradas: passou, com uma ressalva

- `Depends: python3 (>= 3.10)`. Os imports do `server.py` (28 módulos) e do `mcp/giz_livre_mcp.py` (7) são todos da
  biblioteca padrão (conferido com `ast` contra `sys.stdlib_module_names`). Um sistema só com o `python3` do
  `apt` rodou tudo (rodada da 1.16.3), e sem `python3` o `dpkg` recusa o pacote.
- `Recommends: xdg-utils` (o `xdg-open`, para abrir o navegador padrão e a pasta dos quadros).
- `Suggests: chromium | chromium-browser | google-chrome-stable | firefox | firefox-esr`.
- Ressalva: veja o defeito 6 (LibreOffice).

### Ícones: só 128x128

Há um ícone só: `/usr/share/icons/hicolor/128x128/apps/giz-livre.png`, PNG 128x128 RGBA de 8 bits (o
`docs/img/icone.png`). Ele está no lugar certo e com o tamanho certo para a pasta. Faltam os outros tamanhos
(defeito 4).

### `lintian`

`lintian` 2.117 (Ubuntu 24.04), `--info --pedantic --display-experimental`:

| Tipo | Etiqueta | Vezes |
|---|---|---|
| E | `dir-or-file-in-opt` | 197 |
| E | `malformed-contact` | 1 |
| E | `no-changelog` | 1 |
| W | `maintainer-script-empty` | 1 |
| W | `no-manual-page` | 1 |

## Defeitos, e como reproduzir

Esta seção é da primeira rodada. O que foi feito com cada defeito está em "Correções: antes e depois", acima. Os
comandos abaixo reproduzem os defeitos nos pacotes de antes (commit `a2e200a` deste ramo); nos de agora, servem para
ver a correção. Rode da raiz do repositório, depois de montar os pacotes:

```bash
sh scripts/linux/montar-pacotes.sh
```

### 1. `lintian`: arquivos em `/opt` (E: `dir-or-file-in-opt`, 197 vezes)

```bash
lintian dist/linux/giz-livre_1.16.3_all.deb | grep -c dir-or-file-in-opt
```

Dá 197. Vem da escolha feita na primeira tarefa ("ou em `/opt` com o launcher em `/usr/bin`"). O `/opt` é o lugar
certo para programa de fora da distribuição, mas um pacote que entra no repositório do Debian não pode usá-lo. Só
importa se o Giz Livre um dia for para o Debian ou o Ubuntu oficiais. Nesse caso, a correção seria mover o programa
para `/usr/share/giz-livre` e trocar `@PROGRAMA@` no `montar-pacotes.sh`.

### 2. `lintian`: `Maintainer` sem e-mail (E: `malformed-contact`)

```bash
dpkg-deb -f dist/linux/giz-livre_1.16.3_all.deb Maintainer
```

Dá `Heraldo Antunes (Giz Livre)`, sem `<email>`. Já estava anotado. Correção: montar com
`--mantenedor "Nome <email>"`, ou trocar o padrão no `montar-pacotes.sh`.

### 3. `lintian`: falta o changelog do pacote (E: `no-changelog`)

```bash
dpkg-deb -c dist/linux/giz-livre_1.16.3_all.deb | grep usr/share/doc/giz-livre/
```

Só aparece o `copyright`. O Debian espera um `/usr/share/doc/giz-livre/changelog.gz`. O `CHANGELOG.md` do programa
vai em `/opt/giz-livre`, mas não nesse lugar nem nesse formato. Correção: o `montar-pacotes.sh` gerar um
`changelog.gz` curto (versão, data e um link para o `CHANGELOG.md`).

### 4. Ícone num tamanho só (128x128)

```bash
dpkg-deb -c dist/linux/giz-livre_1.16.3_all.deb | grep hicolor/.*png
```

Só aparece o `128x128`. A especificação de temas de ícones do freedesktop.org pede, no mínimo, um ícone de 48x48
no tema `hicolor`. Sem os outros tamanhos, o menu e o painel reduzem ou ampliam o de 128. Em telas de alta densidade,
ou nas listas pequenas, ele pode sair borrado. Isso só se vê com tela de verdade, e não foi visto aqui. Correção:
pôr também 48, 64 e 256, e o `app/icon.svg` em `hicolor/scalable/apps/`. Hoje só há PNG de 128 em `docs/img/`, então
os outros teriam de ser feitos a partir do SVG.

### 5. Sem Python, o aviso só fala do `apt`

```bash
docker run --rm -u 1000 -e HOME=/tmp -w /tmp -v "$PWD/dist/linux:/p:ro" mirror.gcr.io/library/fedora:latest sh -c \
  'tar xzf /p/giz-livre-*-linux-usuario.tar.gz && cd giz-livre-* && ./instalar.sh; echo "saída: $?"'
```

A saída é "saída: 1" e "O Giz Livre precisa do Python 3.10 ou mais novo. No Ubuntu ou Debian: sudo apt install python3". Para
quem usa Fedora (e openSUSE, Arch), falta o comando certo. O launcher (`scripts/linux/giz-livre.in`) tem a mesma
frase. Correção: acrescentar "Fedora: sudo dnf install python3", como já faz o `tests/linux/giz-livre-linux.sh`.

### 6. LibreOffice não sugerido

```bash
dpkg-deb -f dist/linux/giz-livre_1.16.3_all.deb Suggests
```

No Linux, o programa usa o LibreOffice (`soffice`), se ele existir, para trazer arquivos do PowerPoint
(`achar_libreoffice` no `server.py`). O pacote não diz isso. Sem o LibreOffice, o resto funciona. Correção:
acrescentar `libreoffice-impress` ao `Suggests`.

### 7. `lintian`: dois avisos sem efeito prático

```bash
lintian dist/linux/giz-livre_1.16.3_all.deb | grep ^W:
```

- `maintainer-script-empty [postrm]`: o `lintian` acha que o `postrm` está vazio, porque ele só tem um `case` com
  `echo`. Mas é esse `echo` que mostra, na remoção, que os quadros não foram apagados, e a mensagem apareceu de
  verdade no `apt remove` (rodada da 1.16.3). Fica como está.
- `no-manual-page [usr/bin/giz-livre]`: não há página de manual. Correção, se quiser: um `giz-livre.1` curto com as
  opções `--porta`, `--sem-janela`, `--dados` e `--sem-auto-encerrar`.

## O que não foi testado

- **Fedora com `dnf` e Fedora Workstation.** A rede bloqueia os espelhos do Fedora. Sem eles não dá para instalar o
  Python nas imagens 41 a 45, nem testar num Fedora com área de trabalho.
- **`.rpm` e `rpmlint`.** Não há `.rpm`. O equivalente do `lintian` para o Fedora só faz sentido se um `.rpm` for
  montado.
- **Debian 12 com `apt`.** Continua como antes: o `deb.debian.org` está bloqueado, e o `.deb` entrou por `dpkg -i`.
- Tudo o que pede tela de verdade, listado em `docs/PACOTE-LINUX.md`.

## Para repetir

```bash
sh scripts/linux/montar-pacotes.sh
```

```bash
sh tests/linux/pacote/testar-fedora.sh
```

```bash
lintian --info --pedantic --display-experimental dist/linux/giz-livre_1.16.3_all.deb
```

O teste do Ubuntu e do Debian, já feito na rodada da 1.16.3, continua em `sh tests/linux/pacote/testar-pacotes.sh` e
`sh tests/linux/pacote/testar-xvfb.sh`.
