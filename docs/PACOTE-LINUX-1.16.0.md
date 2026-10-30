# Pacote Linux do Giz Livre 1.16.0

Pacotes `.deb` e `.tar.gz` da versão **1.16.0** publicada (tag `v1.16.0`, commit `8e6badd`), montados e testados em
30/10/2026, no ramo `pacote-linux-1.16.0`. Esse ramo saiu da tag e traz os commits do ramo `pacote-linux`, que estava
sobre a candidata rc.2. O ramo `pacote-linux` ficou como estava, com a versão da rc.2. Nada do programa foi alterado. Nenhum pacote foi publicado, e não foi
criada tag nem release.

Como são os pacotes, por que `.deb` e `.tar.gz` (e não AppImage), onde ficam os arquivos e o roteiro de 10 passos
para um Ubuntu com área de trabalho: veja `docs/PACOTE-LINUX.md`. Aquele relatório foi feito com a rc.2. Os pacotes
da 1.16.0 são montados do mesmo jeito.

## Resultado

**Tudo passou.** 273 conferências, nenhuma falha.

| Teste | Ubuntu 22.04.5 | Ubuntu 24.04.5 | Debian 12.15 |
|---|---|---|---|
| Sem tela, `.deb`: instalar, atalho válido, abrir, criar e salvar, fechar, abrir de novo e reabrir o quadro, desinstalar, quadros intactos | passou | passou | passou (com `dpkg`, veja abaixo) |
| Sem tela, `.tar.gz` (só a conta, sem `sudo`): os mesmos passos | passou | passou | passou |
| Com tela virtual (Xvfb), `.deb`, abrindo pelo navegador padrão | passou | passou | não testado (precisa do `apt`) |
| `dpkg -i` num Debian 12 sem Python recusa o pacote e diz que falta `python3 (>= 3.10)` | | | passou |

Python que rodou o programa: 3.10.12 (Ubuntu 22.04, a versão mínima), 3.12.3 (Ubuntu 24.04) e 3.11.2 (Debian 12).
Saída completa: `tests/linux/pacote/resultados-1.16.0-2026-10-30.txt`.

## SHA-256 dos pacotes testados

Montados no ramo `pacote-linux-1.16.0`, commit `5b847ca` (o mesmo SHA-256 sai de qualquer commit posterior que não mexa no
que entra no pacote):

```
fba3c0731d14f48bc05f31b6729b096e0992139a9be67f8018ca63f4f1912a50  giz-livre_1.16.0_all.deb
13d044f3f1d7c23217fd2a1cc7df5422e79568828b0f19602f67c9264eefced1  giz-livre-1.16.0-linux-usuario.tar.gz
```

O `.deb` tem 1,5 MB (cerca de 6 MB instalado) e o `.tar.gz` tem 1,8 MB. Montei duas vezes e os bytes saíram iguais.

## Comandos

Da raiz do repositório, no ramo `pacote-linux-1.16.0`:

```bash
sh scripts/linux/montar-pacotes.sh
```

```bash
sh tests/linux/pacote/testar-pacotes.sh
```

```bash
sh tests/linux/pacote/testar-xvfb.sh
```

O primeiro monta os pacotes em `dist/linux/` com a versão do `server.py` (1.16.0) e grava os SHA-256. O segundo faz o
teste sem tela nos três sistemas. O terceiro faz o teste com tela virtual nos dois Ubuntu. Precisam de Docker, Node
com Playwright e o Chromium do Playwright (`/opt/pw-browsers`, ou `PW_BROWSERS=pasta`). Para o terceiro, também do
`convert` (ImageMagick), que transforma as capturas em PNG.

## O que cada teste faz

### Sem tela (`testar-pacotes.sh`)

Em cada contêiner, primeiro o `.deb` e depois o `.tar.gz`, na conta comum `prof`:

1. instalar (`apt install ./giz-livre_1.16.0_all.deb` num sistema sem Python; `./instalar.sh` sem `sudo`);
2. `desktop-file-validate` no atalho instalado (nenhum erro ou aviso) e conferir o ícone PNG 128x128;
3. rodar o comando da linha `Exec=` do atalho, como o menu faz. O launcher sobe o `server.py`, que acha o `chromium`
   no `PATH` e abre `--app=http://127.0.0.1:8765/?k=<chave>`. Esse `chromium` é o Chromium 153 do Playwright, sem
   janela;
4. pela interface (`tests/linux/pacote/quadro.mjs`): a galeria abre, a chave sai do endereço, cria um quadro, desenha
   um traço, escreve um texto, espera "Salvo" e fecha a janela. O servidor se encerra sozinho;
5. abrir o arquivo do quadro no disco (permissão `600`, dono `prof`) e conferir o traço e o texto;
6. **abrir de novo pelo atalho**, achar o quadro na galeria, clicar nele e conferir o traço e o texto; fechar;
7. desinstalar (`apt remove` e `apt purge`, ou `desinstalar.sh`) e conferir que não sobrou nenhum arquivo do
   programa e que os quadros continuam em `~/.local/share/giz-livre/quadros`. No `.tar.gz`, a pasta pessoal volta a
   ser como era antes de instalar, menos a pasta dos quadros. O quadro do `.deb` continua lá quando o `.tar.gz` é
   instalado.

### Com tela virtual (`testar-xvfb.sh`)

Só o `.deb`, em Ubuntu 22.04 e 24.04, e mais perto de uma área de trabalho:

- uma tela virtual (Xvfb, 1400x900) e o launcher rodando com `DISPLAY`;
- **nenhum** Chrome, Chromium, Edge ou Brave no `PATH`. Assim o `server.py` usa o navegador padrão: o `webbrowser`
  do Python chama o `xdg-open`, que abre o navegador escolhido para links `http` na conta (`xdg-mime`). É o caminho
  de um Ubuntu que só tem o Firefox. O navegador padrão do teste é um Chromium **com janela**, desenhado na tela
  virtual. A saída mostra que quem o chamou foi o `/usr/bin/xdg-open`;
- os mesmos passos de criar, salvar, fechar, abrir de novo, reabrir, desinstalar e conferir os quadros.

Capturas, em `tests/linux/pacote/capturas/`:

- `xvfb-ubuntu-*-tela.png`: a tela virtual inteira, com o Giz Livre aberto numa aba do navegador padrão depois de
  abrir de novo pelo atalho; o quadro salvo aparece na galeria;
- `xvfb-ubuntu-*-reaberto.png`: o quadro reaberto, com o traço e o texto.

## Ressalvas

- **Debian 12 sem `apt`.** A rede deste ambiente bloqueia o `deb.debian.org`. O Debian 12 foi testado com a imagem
  `buildpack-deps:bookworm`, que é a imagem oficial do Debian 12 com mais pacotes e já traz o `python3` do próprio
  Debian. O `.deb` entrou com `dpkg -i`, que conferiu a dependência do Python. O `desktop-file-validate` e o Chromium
  rodaram fora do contêiner; o launcher, o servidor e os quadros ficaram dentro. Por isso, no Debian, ficaram sem
  teste o `apt install ./` puxando o Python e o teste com tela virtual. Com o `deb.debian.org` liberado na rede,
  rode `sh tests/linux/pacote/testar-pacotes.sh mirror.gcr.io/library/debian:12` e
  `sh tests/linux/pacote/testar-xvfb.sh mirror.gcr.io/library/debian:12`.
- **Navegador padrão do teste.** Com tela, o navegador padrão foi um Chromium. O Firefox, que é o padrão do Ubuntu,
  não foi testado (o do Playwright não baixa neste ambiente). Num Ubuntu de verdade ele vem como snap, e isso só dá
  para ver num computador de verdade.
- **Miniatura em branco na galeria** (captura `tela`). Não é defeito do pacote: a página grava a miniatura 4 s depois
  da última mudança, e o teste fecha a janela antes disso. O quadro em si estava salvo e reabriu inteiro.
- **Quadradinhos no lugar de alguns símbolos** (as alças de arrastar das barras, na captura `reaberto`). O contêiner
  só tem a fonte Liberation, que não tem esses símbolos. Num Ubuntu com área de trabalho há mais fontes. Vale olhar no
  roteiro de 10 passos.
- O aviso "Chrome for Testing ... is only for automated testing" e o balão de tradução nas capturas são do navegador
  de teste, não do Giz Livre.

## O que mudou no ramo para esta rodada

- Ramo novo, `pacote-linux-1.16.0`, feito sobre a tag `v1.16.0` com os commits do `pacote-linux` reaplicados
  (rebase). A 1.16.0 não descende da rc.2 (as duas saem da 1.15.2), então juntar a rc.2 com a 1.16.0 por merge traria
  para o ramo um commit que não faz parte da versão publicada. Os commits do pacote só acrescentam arquivos novos, e o
  rebase entrou sem conflito. O ramo `pacote-linux` não foi mexido no GitHub e continua com a versão da rc.2.
- `tests/linux/pacote/testar-pacotes.sh`: novo passo de abrir de novo e reabrir o quadro.
- `tests/linux/pacote/testar-xvfb.sh`: novo, o teste com tela virtual.
- `scripts/linux/` (o que monta o pacote) não mudou.

Uma melhora da 1.16.0 que interessa ao Linux: sem `--dados`, o `server.py` agora guarda o arquivo de conexão em
`${XDG_DATA_HOME:-~/.local/share}/giz-livre`, e não mais em `~/AppData/Local` (o defeito 3 da validação da rc.2). O
launcher do pacote sempre passa `--dados`, então nos pacotes isso já não acontecia.

Ainda falta testar com tela de verdade: veja "O que falta testar com tela de verdade" e o roteiro de 10 passos em
`docs/PACOTE-LINUX.md`. Os comandos do roteiro servem para a 1.16.0 trocando `1.16.0~rc2` por `1.16.0` (e
`1.16.0-rc2` por `1.16.0` no nome do `.tar.gz`).
