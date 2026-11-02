# Pacote Linux do Giz Livre 1.16.1

Pacotes `.deb` e `.tar.gz` da versão **1.16.1** publicada (tag `v1.16.1`, commit `09af9b3`), montados e testados em
02/11/2026, no ramo `pacote-linux-1.16.1`. Esse ramo saiu da tag `v1.16.1` e traz os 4 commits do pacote do ramo
`pacote-linux-1.16.0`, reaplicados sem conflito. Nada do programa foi alterado. Nenhum pacote foi publicado, e não foi
criada tag nem release.

Como são os pacotes e o roteiro de 10 passos para um Ubuntu com área de trabalho: `docs/PACOTE-LINUX.md`. A bateria
é a mesma da 1.16.0 (`docs/PACOTE-LINUX-1.16.0.md`), sem nenhuma mudança nos scripts de montagem nem nos de teste.

## Resultado

**Tudo passou.** 273 conferências, nenhuma falha, como na 1.16.0.

| Teste | Ubuntu 22.04.5 | Ubuntu 24.04.5 | Debian 12.15 |
|---|---|---|---|
| Sem tela, `.deb`: instalar, atalho válido, abrir, criar e salvar, fechar, abrir de novo e reabrir o quadro, desinstalar, quadros intactos | passou | passou | passou (com `dpkg`, veja as ressalvas) |
| Sem tela, `.tar.gz` (só a conta, sem `sudo`): os mesmos passos | passou | passou | passou |
| Com tela virtual (Xvfb), `.deb`, abrindo pelo navegador padrão (`xdg-open`) | passou | passou | não testado (precisa do `apt`) |
| `dpkg -i` num Debian 12 sem Python recusa o pacote e diz que falta `python3 (>= 3.10)` | | | passou |

Python que rodou o programa: 3.10.12 (Ubuntu 22.04, a versão mínima), 3.12.3 (Ubuntu 24.04) e 3.11.2 (Debian 12). A
galeria mostra "versão 1.16.1". Saída completa: `tests/linux/pacote/resultados-1.16.1-2026-11-02.txt`.

## SHA-256 dos pacotes testados

Montados no ramo `pacote-linux-1.16.1`, commit `a7c2e9d` (o mesmo SHA-256 sai de qualquer commit posterior que não
mexa no que entra no pacote). Montei duas vezes e os bytes saíram iguais.

```
5eb9c267416f09c692ff50f602bb367fd03ab4440d85f1246f55a4243a7dff5b  giz-livre_1.16.1_all.deb
f46604b5acd6c9449addd329d4c20082918741c9621152ebeab35ed352721058  giz-livre-1.16.1-linux-usuario.tar.gz
```

O `.deb` tem 1,5 MB (cerca de 6 MB instalado) e o `.tar.gz` tem 1,8 MB.

## Comandos

Da raiz do repositório, no ramo `pacote-linux-1.16.1`:

```bash
sh scripts/linux/montar-pacotes.sh
```

```bash
sh tests/linux/pacote/testar-pacotes.sh
```

```bash
sh tests/linux/pacote/testar-xvfb.sh
```

O primeiro monta os pacotes em `dist/linux/` com a versão do `server.py` (1.16.1) e grava os SHA-256. O segundo faz
o teste sem tela nos três sistemas. O terceiro faz o teste com tela virtual nos dois Ubuntu. O que cada um confere,
passo a passo, está em `docs/PACOTE-LINUX-1.16.0.md`, em "O que cada teste faz".

Capturas da tela virtual: `tests/linux/pacote/capturas/1.16.1/`. Em `xvfb-ubuntu-*-tela.png`, o Giz Livre 1.16.1
está aberto pelo navegador padrão, com o quadro salvo na galeria. Em `xvfb-ubuntu-*-reaberto.png`, o quadro foi
reaberto com o traço e o texto. As capturas da 1.16.0 continuam em `tests/linux/pacote/capturas/`.

## Ressalvas

As mesmas da 1.16.0:

- **Debian 12 sem `apt`.** A rede deste ambiente bloqueia o `deb.debian.org`. O Debian 12 foi testado com a imagem
  `buildpack-deps:bookworm` (Debian 12 oficial, já com o `python3` do Debian). O `.deb` entrou com `dpkg -i`, e o
  `desktop-file-validate` e o Chromium rodaram fora do contêiner. Ficaram sem teste no Debian o `apt install ./`
  puxando o Python e a tela virtual.
- **Firefox não testado.** Com tela, o navegador padrão foi um Chromium. O Firefox em snap do Ubuntu só dá para ver
  num computador de verdade.
- **Miniatura em branco na galeria.** A página grava a miniatura 4 s depois da última mudança, e o teste fecha a
  janela antes disso. Por isso a mudança da 1.16.1 na miniatura ("miniatura do conteúdo atual") **não** foi
  exercitada por este teste. O quadro em si estava salvo e reabriu inteiro.
- Os quadradinhos no lugar de alguns símbolos das barras vêm da única fonte do contêiner. O aviso do "Chrome for
  Testing" e o balão de tradução são do navegador de teste.

Ainda falta testar com tela de verdade: veja `docs/PACOTE-LINUX.md`. Os comandos do roteiro servem para a 1.16.1
trocando `1.16.0~rc2` por `1.16.1` (e `1.16.0-rc2` por `1.16.1` no nome do `.tar.gz`).
