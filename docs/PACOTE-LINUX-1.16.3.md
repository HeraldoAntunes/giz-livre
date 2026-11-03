# Pacote Linux do Giz Livre 1.16.3

Pacotes `.deb` e `.tar.gz` da versão **1.16.3** publicada (tag `v1.16.3`, commit `58939db`), montados e testados em
03/11/2026, no ramo `pacote-linux-1.16.3`. Esse ramo saiu da tag `v1.16.3` e traz os 4 commits do pacote (os do ramo
`pacote-linux-1.16.0`), reaplicados sem conflito. Também traz um roteiro novo, que roda no Linux a carga do modo
apresentação. Nada do programa foi alterado. Nenhum pacote foi publicado, e não foi criada tag nem release.

Como são os pacotes e o roteiro de 10 passos para um Ubuntu com área de trabalho: `docs/PACOTE-LINUX.md`. O que cada
teste confere, passo a passo: `docs/PACOTE-LINUX-1.16.0.md`, em "O que cada teste faz".

## Resultado

**Tudo passou.** Pacotes: 273 conferências, nenhuma falha, como na 1.16.0 e na 1.16.1. Modo apresentação: as quatro
metas do `tests/carga_apresentacao.mjs` foram cumpridas.

| Teste | Ubuntu 22.04.5 | Ubuntu 24.04.5 | Debian 12.15 |
|---|---|---|---|
| Sem tela, `.deb`: instalar, atalho válido, abrir, criar e salvar, fechar, abrir de novo e reabrir o quadro, desinstalar, quadros intactos | passou | passou | passou (com `dpkg`, veja as ressalvas) |
| Sem tela, `.tar.gz` (só a conta, sem `sudo`): os mesmos passos | passou | passou | passou |
| Com tela virtual (Xvfb), `.deb`, abrindo pelo navegador padrão (`xdg-open`) | passou | passou | não testado (precisa do `apt`) |
| `dpkg -i` num Debian 12 sem Python recusa o pacote e diz que falta `python3 (>= 3.10)` | | | passou |

Python que rodou o programa: 3.10.12 (Ubuntu 22.04, a versão mínima), 3.12.3 (Ubuntu 24.04) e 3.11.2 (Debian 12). A
galeria mostra "versão 1.16.3". Saída completa: `tests/linux/pacote/resultados-1.16.3-2026-11-03.txt`. Capturas da
tela virtual: `tests/linux/pacote/capturas/1.16.3/`.

## SHA-256 dos pacotes testados

Montados no ramo `pacote-linux-1.16.3` (o mesmo SHA-256 sai de qualquer commit do ramo que não mexa no que entra no
pacote). Montei duas vezes e os bytes saíram iguais.

```
53d7f24e6410331c930b09124ab10c0aaa26d251cd58e79a564039b41878fdac  giz-livre_1.16.3_all.deb
ba4257cd5b8bc223a5fd6dde6c613ecb5359fb8035357c9fd5b4d0faff3cd128  giz-livre-1.16.3-linux-usuario.tar.gz
```

O `.deb` tem 1,5 MB (cerca de 6 MB instalado) e o `.tar.gz` tem 1,8 MB.

## Carga do modo apresentação

O `tests/carga_apresentacao.mjs` da 1.16.3 monta um deck sintético de slides PNG 1920x1080, entra no modo
apresentação e troca de slide indo e voltando. Em cada troca, mede o tempo até o pixel do centro da tela ter a cor
do slide certo. O slide que não aparece em 15 s conta como "sumido". A memória é medida a cada 25 trocas. O original
foi feito para o Edge no Windows. No Linux, ele roda pelo `tests/linux/carga_apresentacao_linux.mjs`, que não mexe
no original: uma cópia temporária troca só o Edge pelo Chromium 153 sem janela (o do Playwright), `python` por
`python3` (3.13) e a medida de memória do PowerShell pela do `/proc`. Rodou no código da tag `v1.16.3`, num
contêiner de 4 CPUs e 16 GB, sem placa de vídeo.

Deck de **203 slides**, **300 trocas** (PNG médio de 1.921 KB por slide):

| Medida | Resultado | Meta |
|---|---|---|
| Tempo da troca, p95 | **120 ms** | abaixo de 300 ms: cumprida |
| Tempo da troca, máximo | **273 ms** | |
| Tempo da troca, média e p50 | 57 ms e 62 ms | |
| Slides sumidos | **0** de 300 | nenhum: cumprida |
| Memória da página (heap do JavaScript) | entre 12,5 MB e 13,2 MB do começo ao fim | |
| Memória privada do Chromium (todos os processos) | 557 MB antes da 1ª troca, 918 MB na 50ª, 995 MB na 300ª, pico de 1.046 MB | o fim não passar de 1,5x a da 50ª: 1,08x, cumprida |
| Gravações do quadro só por trocar de slide | 0 | nenhuma: cumprida |

Variante com falhas (`--falhas`, para o "slide que volta sozinho" da 1.16.3): o primeiro pedido da imagem de 1 slide
a cada 7 falha de propósito. Foram 22 falhas injetadas. Os 22 slides apareceram sozinhos, entre 615 ms e 737 ms
(contados à parte, porque esperam a nova tentativa). Nas outras 278 trocas: p95 de 124 ms, máximo de 219 ms. Nenhum
slide sumiu. A memória foi de 909 MB na 50ª troca a 986 MB na 300ª (1,08x). As quatro metas foram cumpridas.

Saídas: `tests/linux/carga-apresentacao-1.16.3-2026-11-03.txt` (as duas rodadas) e os JSON
`tests/linux/carga-apresentacao-1.16.3-2026-11-03.json` e `tests/linux/carga-apresentacao-1.16.3-falhas-2026-11-03.json`.

Cuidados ao ler esses números:

- A memória do Chromium no Linux não é a mesma medida do Edge no Windows. Aqui é a soma de `Private_Clean` e
  `Private_Dirty` do `/proc/<pid>/smaps_rollup` de todos os processos do navegador, que é o mais perto da "memória
  privada" do Windows. Compare o crescimento (1,08x), não o valor em MB.
- Sem janela e sem placa de vídeo, o Chromium desenha tudo no processador. Num computador de sala, com tela de
  verdade, os tempos podem ser outros, para mais ou para menos.
- O PNG médio saiu com 1.921 KB, e não com os 900 KB que o roteiro pede (`--kb 900`). O tamanho vem do "ruído" que o
  roteiro desenha para imitar uma foto, e o PNG do Chromium daqui comprime menos. Os slides ficaram mais pesados que
  o pedido, não mais leves.
- A carga rodou no código da tag, direto pelo `server.py`, e não pelo pacote instalado. O pacote leva exatamente os
  mesmos `server.py` e `app/`.

## Comandos

Da raiz do repositório, no ramo `pacote-linux-1.16.3`:

```bash
sh scripts/linux/montar-pacotes.sh
```

```bash
sh tests/linux/pacote/testar-pacotes.sh
```

```bash
CAPTURAS=$PWD/tests/linux/pacote/capturas/1.16.3 sh tests/linux/pacote/testar-xvfb.sh
```

```bash
node tests/linux/carga_apresentacao_linux.mjs --slides 203 --trocas 300
```

```bash
node tests/linux/carga_apresentacao_linux.mjs --slides 203 --trocas 300 --falhas
```

O primeiro monta os pacotes em `dist/linux/` com a versão do `server.py` (1.16.3) e grava os SHA-256. O segundo faz
o teste sem tela nos três sistemas. O terceiro faz o teste com tela virtual nos dois Ubuntu. Os dois últimos rodam a
carga do modo apresentação; cada um grava o resultado em `build/evidencia/carga_apresentacao/resultado.json`.

## Ressalvas

As mesmas da 1.16.0 e da 1.16.1:

- **Debian 12 sem `apt`.** A rede deste ambiente bloqueia o `deb.debian.org`. O Debian 12 foi testado com a imagem
  `buildpack-deps:bookworm` (Debian 12 oficial, já com o `python3` do Debian). O `.deb` entrou com `dpkg -i`, e o
  `desktop-file-validate` e o Chromium rodaram fora do contêiner. Ficaram sem teste no Debian o `apt install ./`
  puxando o Python e a tela virtual.
- **Firefox não testado.** Com tela, o navegador padrão foi um Chromium. A carga do modo apresentação também só rodou
  no Chromium.
- **Miniatura em branco na galeria** nas capturas. A página grava a miniatura 4 s depois da última mudança, e o teste
  fecha a janela antes disso. O quadro em si estava salvo e reabriu inteiro.
- Os quadradinhos no lugar de alguns símbolos das barras vêm da única fonte do contêiner. O aviso do "Chrome for
  Testing" e o balão de tradução são do navegador de teste.

Ainda falta testar com tela de verdade: veja `docs/PACOTE-LINUX.md`. Os comandos do roteiro servem para a 1.16.3
trocando `1.16.0~rc2` por `1.16.3` (e `1.16.0-rc2` por `1.16.3` no nome do `.tar.gz`).
