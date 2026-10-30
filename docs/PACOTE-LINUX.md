# Pacote Linux do Giz Livre

> **Versão 1.16.0:** os pacotes da versão publicada e o resultado dos testes estão em `docs/PACOTE-LINUX-1.16.0.md`.
> Este relatório é o da candidata rc.2 e continua valendo para como os pacotes são feitos.

Pacote de instalação do Giz Livre para Ubuntu e Debian, montado em 30/10/2026 a partir da candidata
**1.16.0-rc.2** (ramo `candidata-1.16.0-rc.2`, commit `0105f8f`). Nada do programa foi alterado: este ramo
(`pacote-linux`) só acrescenta o script de montagem, os testes e este relatório. Nenhum pacote foi publicado.

**Resumo:** há dois pacotes, um `.deb` (para todas as contas, com `sudo`) e um `.tar.gz` com instalador só para a
conta do usuário (sem `sudo`). Os dois passaram, sem tela, em Ubuntu 22.04, Ubuntu 24.04 e Debian 12: instalar,
achar o atalho válido com ícone, abrir pelo comando do atalho, criar e salvar um quadro no Chromium, fechar,
desinstalar sem sobra e com os quadros intactos. **Ainda falta testar com tela de verdade** (veja "O que falta
testar" e o roteiro de 10 passos no fim).

## Qual pacote e por quê

| Pacote | Para quem | Onde instala |
|---|---|---|
| `giz-livre_<versão>_all.deb` | todas as contas do computador; precisa de `sudo` | programa em `/opt/giz-livre`, launcher em `/usr/bin/giz-livre`, atalho em `/usr/share/applications`, ícone em `/usr/share/icons/hicolor/128x128/apps` |
| `giz-livre-<versão>-linux-usuario.tar.gz` | só a conta de quem instala; sem `sudo` (laboratório da escola, computador sem senha de administrador) | programa em `~/.local/lib/giz-livre`, launcher em `~/.local/bin/giz-livre`, atalho em `~/.local/share/applications`, ícone em `~/.local/share/icons/hicolor/128x128/apps` |

Os dois usam o mesmo launcher e o mesmo atalho, e guardam tudo do professor no mesmo lugar:

- quadros: `${XDG_DATA_HOME:-~/.local/share}/giz-livre/quadros`
- registro (`giz-livre.log`) e ajustes (`preferencias.json`): `${XDG_DATA_HOME:-~/.local/share}/giz-livre`
- arquivo de conexão (porta e código da conta): `.../giz-livre/quadros/.agente/conexao.json`

Por isso dá para trocar um pelo outro sem perder nada (o teste faz isso: instala o `.deb`, cria um quadro, remove,
instala o `.tar.gz` e encontra o quadro). Como o launcher sempre passa `--dados`, o defeito 3 da validação da rc.2
(pasta `~/AppData/Local` criada no Linux) não acontece com o pacote.

**Por que não AppImage.** O Giz Livre não tem nada para compilar: é um `server.py` que só usa a biblioteca padrão do
Python e uma pasta de páginas. Um AppImage serve para levar junto o que o sistema não tem, e aqui o pedido é usar o
Python do sistema. Além disso, o AppImage não põe o programa no menu sozinho (precisa de outra ferramenta ou de um
passo a mais), precisa de FUSE (que o Ubuntu 22.04 e o 24.04 não trazem instalado como o AppImage espera), e a
ferramenta de montagem teria de ser baixada de fora. O `.deb` é o formato nativo do Ubuntu e do Debian: o `apt`
confere a dependência do Python, o atalho e o ícone entram no menu, e `apt remove` tira tudo. O `.tar.gz` cobre quem
não tem `sudo`, que é o caso que o AppImage resolveria.

## Dependências

- **Python 3.10 ou mais novo, o do sistema.** No `.deb`: `Depends: python3 (>= 3.10)`. O Ubuntu 22.04 traz o 3.10, o
  24.04 traz o 3.12 e o Debian 12 traz o 3.11. Num sistema sem `python3`, o `apt` instala junto; o `dpkg -i` sozinho
  recusa configurar o pacote e diz o que falta (testado). O `.tar.gz` confere a versão antes de instalar.
- **Um navegador.** `Recommends: xdg-utils`; `Suggests: chromium | chromium-browser | google-chrome-stable | firefox
  | firefox-esr`. Nenhum navegador é instalado à força.
- Mais nada: o programa não usa nenhum módulo de fora da biblioteca padrão.

### Qual navegador abre

O pacote não muda o `server.py`, então vale o que ele já faz no Linux: se houver Google Chrome, Chromium, Edge ou
Brave no `PATH`, ele abre o Giz Livre numa janela própria desse navegador (modo app, sem barra de endereço). Só
quando não há nenhum deles é que abre no **navegador padrão** (pelo módulo `webbrowser` do Python, que usa o
`xdg-open` numa área de trabalho). Num Ubuntu de fábrica, que só tem o Firefox, abre no Firefox, numa aba comum.

## Como montar

Da raiz do repositório, num Linux com `dpkg-deb` (Ubuntu ou Debian já têm):

```bash
sh scripts/linux/montar-pacotes.sh --versao 1.16.0~rc2
```

Os pacotes saem em `dist/linux/` (pasta fora do Git), com um `<pacote>.sha256` ao lado de cada um e o `SHA256SUMS`
dos dois. Sem `--versao`, usa a `VERSAO` do `server.py` (hoje `1.16.0`). O `~rc2` faz o `apt` entender a candidata
como anterior à 1.16.0 final. `--mantenedor "Nome <email>"` troca o campo `Maintainer` do `.deb` (hoje
`Heraldo Antunes (Giz Livre)`, sem e-mail; vale pôr um e-mail antes de entregar o pacote a outras pessoas).

A montagem é reprodutível: todos os arquivos levam a data do último commit que mexeu em algo que entra no pacote.
Montar de novo no mesmo commit dá os mesmos bytes (conferido montando duas vezes). Os pacotes testados, montados no
commit `dfe2d2d` deste ramo:

```
077b20ff932ddc9c0237c845ee312922a0b8c6c06eac94b438e5e50b539b6574  giz-livre_1.16.0~rc2_all.deb
ed42a96885afc5b00ccc0f0ea06b2707ed85e0738f5816392490bac41471b48f  giz-livre-1.16.0-rc2-linux-usuario.tar.gz
```

O `.deb` tem 1,5 MB (cerca de 6 MB instalado). O que entra: `server.py`, `app/`, `mcp/`, `LICENSE`,
`THIRD-PARTY-NOTICES.md`, `CHANGELOG.md` e `docs/GUIA-DE-USO.md`. Não entram testes, scripts nem nada do Windows.

Os arquivos de `scripts/linux/`:

| Arquivo | O que é |
|---|---|
| `montar-pacotes.sh` | monta os dois pacotes e grava os SHA-256 |
| `giz-livre.in` | o launcher (o `@PROGRAMA@` vira a pasta do programa) |
| `giz-livre.desktop.in` | o atalho do menu (o `@EXEC@` vira o comando) |
| `deb/postrm` | depois de remover o `.deb`: avisa que os quadros não foram apagados |
| `instalar.sh`, `desinstalar.sh` | instalação e desinstalação só para a conta (vão dentro do `.tar.gz`) |

## Como instalar e desinstalar

### `.deb` (todas as contas)

```bash
sudo apt install ./giz-livre_1.16.0~rc2_all.deb
```

Use `./` antes do nome: assim o `apt` instala o Python junto, se faltar. Depois, procure **Giz Livre** no menu de
aplicativos. No terminal, `giz-livre` também abre.

```bash
sudo apt remove giz-livre
```

A remoção mostra: "Giz Livre removido. Os quadros NÃO foram apagados: continuam em ~/.local/share/giz-livre (ou em
$XDG_DATA_HOME/giz-livre) na pasta pessoal de cada conta. Para apagá-los, apague essa pasta." O `apt purge` também
não apaga os quadros: o pacote nunca mexe na pasta pessoal.

### `.tar.gz` (só a sua conta, sem senha)

```bash
tar xzf giz-livre-1.16.0-rc2-linux-usuario.tar.gz
```

```bash
cd giz-livre-1.16.0-rc2-linux-usuario && ./instalar.sh
```

Rodar `./instalar.sh` de novo atualiza o programa sem mexer nos quadros. Para desinstalar:

```bash
sh ~/.local/lib/giz-livre/desinstalar.sh
```

Ele apaga o programa, o launcher, o atalho e o ícone (e as pastas que ficaram vazias), diz que os quadros não foram
apagados e onde estão. Se o Giz Livre ainda estiver aberto, ele não desinstala e pede para fechar antes.

## O que foi testado

Sem tela, em contêineres Docker, em 30/10/2026. Para cada sistema, primeiro o `.deb` e depois o `.tar.gz`, na conta
comum `prof` (sem `sudo`). A saída completa está em `tests/linux/pacote/resultados-2026-10-30.txt`.

| Conferência | Ubuntu 22.04.5 | Ubuntu 24.04.5 | Debian 12.15 |
|---|---|---|---|
| Python usado pelo programa | 3.10.12 (o mínimo) | 3.12.3 | 3.11.2 |
| `.deb`: instalar | passa (`apt install ./`, o Python veio pela dependência) | passa (idem) | passa (`dpkg -i`, veja abaixo) |
| `.deb`: `desktop-file-validate` no atalho | sem erro nem aviso | sem erro nem aviso | sem erro nem aviso |
| `.deb`: ícone PNG 128x128 no lugar | passa | passa | passa |
| `.deb`: abrir pelo comando do atalho, criar e salvar um quadro | passa | passa | passa |
| `.deb`: fechar a janela encerra o servidor | passa | passa | passa |
| `.deb`: remover e purgar: nada com "giz-livre" fora da pasta pessoal; quadros intactos; aviso aparece | passa | passa | passa |
| `.tar.gz`: instalar sem `sudo`, nada fora da pasta pessoal | passa | passa | passa |
| `.tar.gz`: `desktop-file-validate`, ícone, abrir, quadro salvo | passa | passa | passa |
| `.tar.gz`: desinstalar: a pasta pessoal volta a ser como antes, menos `~/.local/share/giz-livre`; quadros intactos (o do `.deb` e o novo) | passa | passa | passa |

Além disso: num Debian 12 sem Python (imagem `debian:12`), o `dpkg -i` desempacota mas não configura o pacote e diz
"giz-livre depends on python3 (>= 3.10); however: Package python3 is not installed".

Como cada passo foi feito:

1. **Instalar.** `.deb` com `apt-get install ./giz-livre_1.16.0~rc2_all.deb` num sistema sem `python3`; `.tar.gz`
   com `./instalar.sh` na conta `prof`.
2. **Atalho.** `desktop-file-validate` no `.desktop` instalado; conferir que o ícone está lá e é PNG.
3. **Abrir.** O teste lê a linha `Exec=` do atalho instalado e roda esse comando na conta `prof`, sem terminal, como
   o menu faria. O launcher sobe o `server.py`, que acha o `chromium` no `PATH` e o chama com
   `--app=http://127.0.0.1:8765/?k=<chave>`. Esse `chromium` é o Chromium 153 do Playwright, sem janela e com porta
   de depuração.
4. **Quadro.** `tests/linux/pacote/quadro.mjs` se liga a esse Chromium, confere que a galeria abriu e que a chave
   de uso único saiu do endereço, cria um quadro, desenha um traço, escreve um texto, espera "Salvo" e fecha a
   janela. O servidor se encerra sozinho uns segundos depois e apaga o arquivo de conexão. Depois o teste abre o
   arquivo do quadro no disco (permissão `600`, dono `prof`) e confere o traço e o texto.
5. **Desinstalar.** `apt-get remove` e `apt-get purge`, ou `desinstalar.sh`. Depois: procurar qualquer arquivo com
   "giz-livre" no nome fora de `/home` (`.deb`), ou comparar a lista de arquivos da pasta pessoal com a de antes de
   instalar (`.tar.gz`), e contar os quadros.

### Diferença no Debian 12: rede fechada

A rede deste ambiente bloqueia o `deb.debian.org` (só o repositório do Ubuntu passa). Sem `apt`, o Debian 12 foi
testado assim, e a saída do teste diz isso em cada passo:

- imagem `buildpack-deps:bookworm`, que é a imagem oficial do Debian 12 com mais pacotes, entre eles o `python3`
  3.11.2 do próprio Debian;
- o `.deb` entrou por `dpkg -i` e saiu por `dpkg -r` e `dpkg -P` (o `dpkg` conferiu a dependência do Python);
- o `desktop-file-validate` (0.27) rodou fora do contêiner, na cópia exata do atalho instalado;
- o Chromium rodou fora do contêiner: o `chromium` que o `server.py` achou lá dentro só anotou o endereço, e o
  Chromium de fora abriu esse endereço. O launcher, o servidor e os quadros ficaram dentro do contêiner, na conta
  `prof`.

Ficou sem teste no Debian 12: o `apt install ./` puxando o Python e o Chromium rodando dentro do próprio Debian. Com
o `deb.debian.org` liberado na rede do ambiente, o mesmo script testa a imagem `debian:12` do jeito completo:
`sh tests/linux/pacote/testar-pacotes.sh mirror.gcr.io/library/debian:12`.

## O que falta testar com tela de verdade

Nada disto foi visto aqui. É o que separa "funciona no Linux" de "foi testado sem tela":

- **O atalho aparece no menu de aplicativos** (GNOME no Ubuntu, Cinnamon no Mint, KDE, XFCE) com o nome e o ícone
  certos. O `desktop-file-validate` só garante que o arquivo está correto. O ícone é um PNG de 128x128: em telas de
  alta densidade, ou no painel em tamanho grande, pode ficar borrado.
- **Qual navegador abre de fato:** Firefox em snap (o padrão do Ubuntu), Chromium em snap, Google Chrome instalado
  pelo `.deb` do Google. Em especial: o `chromium-browser` do Ubuntu é um snap, e o snap pode não conseguir abrir
  `127.0.0.1` ou gravar o perfil como o `server.py` espera.
- **Abrir pelo menu sem terminal** e ver o que acontece quando dá erro (sem Python, porta ocupada). O launcher tenta
  mostrar o aviso com `notify-send` ou `zenity`, mas isso não foi visto na tela.
- Clicar no atalho com o Giz Livre já aberto (deve abrir outra janela no mesmo programa).
- Fechar a janela e conferir que o programa se encerra sozinho (em até 3 minutos, ou uns segundos depois de fechar).
- Wayland e X11, tela sensível ao toque, mesa digitalizadora, pressão da caneta.
- Instalar pela **Central de Aplicativos** do Ubuntu (clique duplo no `.deb`) em vez do terminal.
- O **Sobre > Baixar e instalar** do programa. No Windows ele atualiza sozinho; com o `.deb` em `/opt`, o programa
  não consegue gravar na própria pasta, e o que ele faz no Linux não foi testado.
- Outras distribuições (Linux Mint, Fedora, openSUSE), computadores ARM e o macOS.

## Roteiro de teste num Ubuntu com área de trabalho (10 passos)

Para uma pessoa num Ubuntu 22.04 ou 24.04 de verdade, com o arquivo `giz-livre_1.16.0~rc2_all.deb` (e o `.sha256`
dele) na pasta Downloads. Anote o que vir em cada passo, com uma foto da tela se algo sair diferente.

1. **Confira o arquivo.** Abra o Terminal (Ctrl+Alt+T), entre em `cd ~/Downloads` e rode
   `sha256sum -c giz-livre_1.16.0~rc2_all.deb.sha256`. Tem de aparecer `OK`.
2. **Instale.** Rode `sudo apt install ./giz-livre_1.16.0~rc2_all.deb` e digite a sua senha. Anote se aparece algum
   erro ou aviso.
3. **Procure no menu.** Aperte a tecla Super (a do Windows), digite `giz`. Tem de aparecer **Giz Livre** com o
   ícone da lousa. Anote se o ícone aparece borrado ou genérico.
4. **Abra pelo menu.** Clique em Giz Livre. Anote qual navegador abriu (Firefox, Chrome, Chromium) e se foi numa
   janela própria ou numa aba. A galeria de quadros tem de aparecer, sem pedir para "abrir pelo atalho".
5. **Crie um quadro.** Clique em **Criar novo quadro > Quadro livre**, desenhe com o mouse (ou com a caneta, se tiver),
   escreva um texto. Espere aparecer **Salvo** no alto.
6. **Feche e abra de novo.** Feche a janela do Giz Livre. Espere 30 segundos e abra pelo menu outra vez. O quadro do
   passo 5 tem de estar na galeria, com o desenho e o texto.
7. **Abra duas vezes.** Com o Giz Livre aberto, clique de novo em Giz Livre no menu. Anote o que acontece (o
   esperado é outra janela do mesmo programa, sem erro).
8. **Veja onde os quadros ficaram.** No gerenciador de arquivos, aperte Ctrl+H (mostra pastas ocultas) e abra a
   pasta pessoal, `.local`, `share`, `giz-livre`, `quadros`. Tem de haver um arquivo `.json` para o quadro.
9. **Desinstale.** Feche o Giz Livre, espere uns segundos e rode `sudo apt remove giz-livre`. Tem de aparecer a
   frase "Os quadros NÃO foram apagados". Confira que o Giz Livre sumiu do menu.
10. **Confira que os quadros ficaram.** Abra de novo a pasta do passo 8: o arquivo do quadro tem de continuar lá.
    Para terminar, reinstale (passo 2) e confira que o quadro do passo 5 aparece na galeria.

Se der tempo, repita os passos 2 a 10 com o `.tar.gz` (instalação só para a sua conta): `tar xzf` no arquivo,
`./instalar.sh` dentro da pasta, e `sh ~/.local/lib/giz-livre/desinstalar.sh` no passo 9.

## Para repetir os testes

Num Linux com Docker, Node e o Playwright (o teste usa o Chromium do Playwright em `/opt/pw-browsers`, ou
`PW_BROWSERS=pasta`):

```bash
sh scripts/linux/montar-pacotes.sh --versao 1.16.0~rc2
```

```bash
sh tests/linux/pacote/testar-pacotes.sh
```

Sem argumentos, testa Ubuntu 22.04, Ubuntu 24.04 e Debian 12 (`buildpack-deps:bookworm`), e confere a recusa do
`dpkg` sem Python numa imagem `debian:12`. Para escolher as imagens, passe-as como argumentos. As imagens vêm do
espelho `mirror.gcr.io`, porque o Docker Hub limitou os downloads. Os arquivos de `tests/linux/pacote/`:

| Arquivo | O que faz |
|---|---|
| `testar-pacotes.sh` | sobe cada contêiner, chama os passos e junta o resultado |
| `dentro.sh` | os passos que rodam dentro do contêiner (preparar, instalar, validar, abrir, desinstalar, conferir) |
| `quadro.mjs` | liga no Chromium que o launcher abriu e cria e salva o quadro pela interface |
| `resultados-2026-10-30.txt` | a saída completa da rodada deste relatório |

O resto de `tests/linux/` e o `docs/LINUX-rc2.md` vieram do ramo `linux-validacao-rc2` (validação da rc.2 no Linux),
sem mudança.
