# Estudo: notas do professor em duas telas, no Linux

Estudo para a 1.17 do Giz Livre, feito em 03/11/2026 no ramo `estudo-notas-linux`. O protótipo fica nesta pasta e é
separado do programa: não usa o código da 1.17 e não muda nada fora de `estudos/notas-duas-telas/`.

A pergunta: no Linux, com WebKitGTK e Tauri 2, dá para fazer o que a 1.17 faz no Windows? Ou seja, mandar a
apresentação para o projetor (a tela que não é a principal), em tela cheia, e abrir as notas numa segunda janela na
tela do professor. A página da 1.17 usa `screen.isExtended`, `window.open('/#/notas/<id>')` e `BroadcastChannel`; o
Rust, o `on_new_window` e a posição das janelas.

## Resposta curta

| O que a 1.17 usa | X11 (Xorg + Openbox) | Wayland (Weston) | Contorno recomendado |
|---|---|---|---|
| `screen.isExtended` | **não existe** | **não existe** | perguntar ao Rust quantas telas há (`available_monitors().len() > 1`) |
| `window.getScreenDetails` | não existe | não existe | o mesmo |
| `window.open` sem clique | **bloqueado** (devolve `null`, e o `on_new_window` nem é chamado) | **bloqueado** | chamar dentro do clique ou da tecla, ou o Rust criar a janela das notas |
| `window.open` dentro de um clique de verdade | funciona, e o `on_new_window` cria a janela | não testado (sem como gerar clique no Weston) | o mesmo |
| `window.open` com `javascript-can-open-windows-automatically` ligado pelo Rust | funciona | funciona | opção, se a página precisar abrir sem gesto |
| `BroadcastChannel` entre as janelas | **funciona** (com `window.open` ou com as duas janelas criadas pelo Rust) | **funciona** | nenhum; o evento `storage` também funciona, como reserva |
| Tauri lista os monitores | sim, com nome, posição, tamanho e escala; a principal vem certa | sim, mas **sem nomes e sem principal** (`primary_monitor()` = `None`) | no Wayland, tratar a primeira como a do professor e dar um botão "trocar as telas" |
| Tauri põe a janela numa posição | sim | **não**: o Wayland ignora; a posição lida volta sempre 0,0 | no Wayland, só a tela cheia num monitor escolhido (abaixo) |
| `set_fullscreen(true)` na tela certa | **sim**, depois de pôr a janela na tela certa | **não**: vai para a tela 1, a errada | no Wayland, `gtk_window_fullscreen_on_monitor` pelo GTK |
| Tela cheia pelo GTK (`fullscreen_on_monitor`) | não precisa | **funciona** (apresentação em tela cheia na tela 2) | usar no Wayland |
| `current_monitor()` / `outer_position()` | certos | errados (sempre a primeira tela, 0,0) | não decidir nada por eles no Wayland |
| Uma tela só | o Tauri informa 1 monitor | o Tauri informa 1 monitor | contar os monitores basta para mostrar o aviso |

Em resumo: no X11 o caminho da 1.17 funciona quase como está. A página precisa de outra forma de saber se há duas
telas, e o `window.open` precisa sair de um clique ou de uma tecla. No Wayland, a tela cheia da apresentação tem de
ir pelo GTK, no monitor escolhido. E o programa não tem como saber qual tela é a principal.

## Ambiente

- Contêiner na nuvem, sem placa de vídeo nem monitor de verdade.
- Ubuntu 24.04.5 LTS, x86_64, Rust 1.97.0.
- Tauri 2.12.5 (a mesma versão de `janela/Cargo.lock`), wry 0.57.1, tao 0.37.2, crates `gtk` 0.18.2 e `webkit2gtk`
  2.0.2.
- WebKitGTK 2.52.6 (`libwebkit2gtk-4.1-0` 2.52.6-0ubuntu0.24.04.1; o agente diz `AppleWebKit/605.1.15
  Version/60.5`) e GTK 3.24.41.
- Três sessões de duas telas de 1920x1080, lado a lado (tela 1 em +0+0, tela 2 em +1920+0):
  - **X11:** Xorg 21.1.12 com o driver `dummy` (0.4.0), tela virtual de 3840x1080, dividida em dois monitores pelo
    `xrandr --setmonitor`. A tela 1 é a principal. Rodou sem gerenciador de janelas e com o Openbox 3.6.1.
  - **Wayland:** Weston 13.0.0 com o backend X11 e duas saídas (`--output-count=2`), rodando dentro de um Xvfb.
  - **Xwayland:** Xwayland 23.2.6, dentro desse mesmo Weston.
- O Xvfb sozinho não serve: ele não aceita monitores do RandR (`xrandr --setmonitor` não tem efeito), então a página
  e o Tauri veem uma tela só.
- O que cada tela mostrou de fato foi conferido por foto: `weston-screenshooter` no Weston e `xwd` no X11. A medida é
  a fração de pixels brancos de cada tela; a página do estudo tem fundo branco, então cerca de 98% quer dizer uma
  janela em tela cheia ali. Algumas fotos, reduzidas, estão em `medidas/`.

## O protótipo

- `src-tauri/src/main.rs`: lista os monitores e cria as janelas.
  - A "apresentacao" vai para a tela que não é a principal, em tela cheia.
  - As "notas" ficam na principal.
  - Mede o que o Rust vê de cada janela duas vezes e sai sozinho.
- `dist/index.html`: uma página só (`#/apresentacao` ou `#/notas/<id>`).
  - Mede `screen.*`, `isExtended`, `getScreenDetails`, `window.open` (sem gesto e no clique de um botão),
    `BroadcastChannel` e o evento `storage`.
  - A apresentação "troca de slide" a cada 300 ms, e as notas respondem pelo mesmo canal.
  - Tudo volta ao Rust por `invoke('relatar')`.
- Modos, pela variável `NOTAS_MODO`:
  - `open`: só a apresentação; a página abre as notas com `window.open` e o `on_new_window` cria a janela, como na
    1.17.
  - `rust`: o Rust cria as duas janelas.
  - `sozinha`: uma janela comum, sem posição.
- Chaves de contorno:
  - `NOTAS_CHEIA_GTK=1`: tela cheia pelo GTK, no monitor escolhido, depois de a janela aparecer.
  - `NOTAS_POPUP_AUTOMATICO=1`: liga no WebKitGTK o `javascript-can-open-windows-automatically`.
  - `NOTAS_TELA_CHEIA=0`: desliga a tela cheia.
- `medir.sh` roda todos os casos numa sessão e fotografa as telas. `resumir.py` resume as saídas. O resultado de cada
  caso está em `medidas/` (`RESUMO.txt` junta tudo).

## O que funciona e o que não funciona, caso a caso

### 1. `screen.isExtended` (e `getScreenDetails`)

**Não existem no WebKitGTK**, em nenhuma sessão: `'isExtended' in screen` é falso, e `window.getScreenDetails` não
existe. São da API de Window Management, que só o Chromium tem. O `screen.width` é o da tela em que a janela está
(1920), não o da área toda. No X11, o `window.screenX` dá a posição certa (1960 na tela 2); no Wayland, dá um número
sem sentido (26, ou 0 em tela cheia).

**Contorno:** a página pergunta ao Rust. Um comando como `telas()` devolve `available_monitors()`, e a decisão fica
assim:

```js
const extendida = ('isExtended' in screen) ? screen.isExtended : (await invoke('telas')).length > 1;
```

Com uma tela só, o Tauri devolve 1 monitor (conferido no X11, com a tela 2 removida), e a página mostra o aviso. No
navegador comum, fora da janela do programa, sem `isExtended` e sem `invoke`, a página deve tratar como uma tela só.

### 2. `window.open` e o `on_new_window`

- **Sem gesto, o WebKitGTK bloqueia.** O `window.open` chamado 700 ms depois de a página abrir devolveu `null` nas
  três sessões, e o `on_new_window` nem foi chamado. É a configuração padrão do WebKitGTK
  (`javascript-can-open-windows-automatically` desligado).
- **Dentro de um clique de verdade, funciona.** Com um clique pelo `xdotool` (X11 com e sem Openbox, e Xwayland), o
  `window.open` devolveu a janela, o `on_new_window` foi chamado com `tauri://localhost/#/notas/q1`, e a janela das
  notas abriu com `window.opener` e com o `invoke` do Tauri. No Weston não deu para gerar um clique; mas é a mesma
  regra do mesmo WebKit.
- **Com a opção ligada pelo Rust**, funciona sem gesto nas três sessões:

  ```rust
  w.with_webview(|wv| { if let Some(s) = wv.inner().settings() { s.set_javascript_can_open_windows_automatically(true) } })
  ```

**Contorno recomendado:**

1. Chamar o `window.open` no próprio tratador do clique ou da tecla (F5, botão Apresentar), sem `await` nem
   `setTimeout` antes, porque esperar perde o gesto.
2. Se as notas tiverem de abrir sem gesto (por exemplo, ao reabrir um quadro que já estava em apresentação), há duas
   saídas:
   - o Rust cria a janela das notas direto, como no modo `rust` (o `BroadcastChannel` funciona do mesmo jeito);
   - ou se liga a opção acima só na janela principal.

   A janela criada pelo Rust é a mais previsível.

### 3. `BroadcastChannel` entre as janelas

**Funciona em todos os casos.** A janela aberta pelo `window.open` (relacionada à de origem) recebeu 16 ou 17
mensagens em cerca de 5 s, e o eco voltou. A primeira mensagem chegou de 100 a 300 ms depois de as notas abrirem.
Com as duas janelas criadas pelo Rust, que não são relacionadas, também funciona, porque o Tauri usa o mesmo contexto
do WebKit para a mesma origem (`tauri://localhost`).

O evento `storage` (do `localStorage`) também chega na outra janela, e serve de reserva. Não é preciso contorno.

### 4. Tauri: listar os monitores, posicionar e tela cheia

**X11 com gerenciador de janelas (Openbox): funciona.**

- `available_monitors()` dá os dois, com nome (`TELA-1`, `TELA-2`), posição e tamanho.
- `primary_monitor()` dá a TELA-1. A ordem da lista não é a da principal primeiro; usar o `primary_monitor()`.
- `set_position` na tela 2 e depois `set_fullscreen(true)` dão a apresentação em tela cheia na tela 2: posição
  1920,0 e tamanho 1920x1080. A foto da tela 2 tem 98% de branco.
- As notas ficaram em 40,40 na tela 1.
- O `current_monitor()` e o `outer_position()` batem com a tela.

**X11 sem gerenciador de janelas:** a posição funciona, mas a tela cheia não. O Tauri diz `is_fullscreen = true`, e a
janela continua com 1840x1000, porque no X11 quem faz a tela cheia é o gerenciador de janelas. Todo desktop tem um,
então isso só importa em teste.

**Wayland (Weston):**

- `available_monitors()` dá os dois, com posição e tamanho certos, mas com o nome `none` e **sem principal**
  (`primary_monitor()` devolve `None`). O Wayland não tem tela principal.
- `set_position` é ignorado. `outer_position()` volta sempre 0,0, e `current_monitor()` diz sempre a primeira tela,
  mesmo para a janela que está na segunda. Não dá para usar nenhum dos três.
- `set_fullscreen(true)` pôs a apresentação em tela cheia **na tela 1**, a errada; a tela 2 ficou vazia. No modo
  `open`, as notas abriram atrás dela, na mesma tela.
- **Tela cheia pelo GTK no monitor escolhido funciona.** O `gtk_window_fullscreen_on_monitor(screen, índice)`, com
  o índice do `GdkMonitor` de mesma posição, chamado depois de a janela aparecer (800 ms), deu a foto da tela 2 com
  98% de branco: a apresentação em tela cheia na tela certa, e as notas na tela 1. O Tauri continua dizendo
  `is_fullscreen = false`, porque não sabe da tela cheia feita por fora dele. Chamado antes de a janela aparecer, o
  pedido não teve efeito.

**Xwayland (dentro do Weston):** a posição pedida é ignorada (o gerenciador do Weston escolhe), e a tela cheia vai
para a tela 1, inclusive pelo GTK. É provável que seja do gerenciador de janelas do Weston, que é simples, e não do
Xwayland em geral; no GNOME e no KDE não foi testado.

**Contorno recomendado para o Rust:**

1. Saber se é Wayland: `gdk::Display::default().backend()`, ou a variável `WAYLAND_DISPLAY` com o GDK em Wayland.
2. Escolher a tela das notas e a do projetor:
   - no X11 (e no Windows), a principal é a das notas, e a outra é a do projetor;
   - no Wayland, não há principal: tomar a primeira da lista como a do professor e mostrar nas notas um botão
     "Trocar as telas", que refaz a tela cheia na outra.
3. Tela cheia:
   - no X11, `set_position` dentro da tela do projetor e depois `set_fullscreen(true)`;
   - no Wayland, `fullscreen_on_monitor` pelo GTK (`gtk_window()` da janela) no monitor escolhido, depois de a
     janela estar visível;
   - nos dois, conferir depois. No X11, com `current_monitor()`. No Wayland, não há como conferir pelo Tauri; o
     botão de trocar é o socorro.
4. Não usar `is_fullscreen()` para decidir nada no Wayland depois da tela cheia pelo GTK.

## O que não foi testado

- **GNOME (Mutter), KDE (KWin) e outros gerenciadores**, em X11 e em Wayland. É onde o professor de fato estaria.
  Eles tratam a posição e a tela cheia cada um do seu jeito. O Xwayland dentro do Weston não representa o Xwayland
  do GNOME ou do KDE.
- Clique de verdade no Wayland: o Weston não tem como receber um clique de fora.
- Monitor físico, projetor de verdade, escalas diferentes entre as telas (125%, 150%), telas de tamanhos diferentes
  e telas empilhadas em vez de lado a lado.
- Ligar ou desligar o projetor com o programa aberto (o evento de mudança de monitores).
- Placa de vídeo: o WebKitGTK rodou sem aceleração (avisos de EGL/Mesa na saída, sem efeito no estudo).
- O código da 1.17, que não está no GitHub; o protótipo só imita o caminho descrito.

## Como repetir

Pacotes (Ubuntu 24.04):

```bash
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libsoup-3.0-dev libjavascriptcoregtk-4.1-dev librsvg2-dev build-essential pkg-config x11-xserver-utils xdotool x11-utils x11-apps imagemagick weston xwayland openbox xvfb xserver-xorg-core xserver-xorg-video-dummy
```

Compilar (da pasta `estudos/notas-duas-telas`):

```bash
cd src-tauri && cargo build --release --features custom-protocol && cd ..
```

**X11 com duas telas** (Xorg com o driver `dummy`; o `xorg-dummy.conf` está nesta pasta):

```bash
Xorg :93 -config "$PWD/xorg-dummy.conf" -noreset -nolisten tcp -logfile /tmp/xorg-estudo.log &
```

```bash
export DISPLAY=:93; xrandr --setmonitor TELA-1 1920/508x1080/286+0+0 DUMMY0; xrandr --setmonitor TELA-2 1920/508x1080/286+1920+0 none; xrandr --listmonitors
```

```bash
X11_FOTO=1 sh medir.sh x11-sem-wm medidas
```

```bash
openbox & X11_FOTO=1 sh medir.sh x11-openbox medidas
```

**Wayland com duas telas** (Weston dentro de um Xvfb, com `--debug` para o `weston-screenshooter`):

```bash
Xvfb :92 -screen 0 3900x1200x24 &
```

```bash
export XDG_RUNTIME_DIR=$(mktemp -d); DISPLAY=:92 weston --backend=x11 --renderer=pixman --output-count=2 --width=1920 --height=1080 --xwayland --debug --socket=wl-estudo &
```

```bash
WAYLAND_DISPLAY=wl-estudo WESTON_FOTO=1 sh medir.sh wayland medidas
```

```bash
DISPLAY=:0 WAYLAND_DISPLAY=wl-estudo WESTON_FOTO=1 sh medir.sh xwayland medidas
```

O `DISPLAY=:0` é o do Xwayland que o Weston abre; o número aparece no `weston.log`.

Um caso só, à mão:

```bash
NOTAS_MODO=rust NOTAS_CHEIA_GTK=1 src-tauri/target/release/notas-duas-telas | grep RELATO
```
