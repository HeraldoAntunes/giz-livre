#!/bin/sh
# Roda o protótipo nos casos do estudo, numa sessão gráfica já aberta (ver RELATORIO.md, "Como repetir"), e guarda a
# saída de cada caso em <pasta>/<sessão>-<caso>.txt.
#   sh medir.sh <sessão: wayland | xwayland | x11> <pasta de saída>
# wayland: precisa de WAYLAND_DISPLAY; xwayland e x11: precisam de DISPLAY (e xdotool, para o clique).
# Fotos do que a tela mostrou de fato, 6 s depois de abrir; a página do estudo tem fundo branco, então a fração de
# pixels brancos de uma tela perto de 100% quer dizer uma janela em tela cheia nela:
#   WESTON_FOTO=1   no Weston aberto com --debug (weston-screenshooter junta todas as saídas numa imagem);
#   X11_FOTO=1      numa sessão X11 (xwd da raiz).
#   TELAS="1920x1080+0+0 1920x1080+1920+0"   geometria de cada tela na imagem (padrão: essa).
set -u
SESSAO=$1
SAIDA=$2
AQUI=$(cd "$(dirname "$0")" && pwd)
BIN=$AQUI/src-tauri/target/release/notas-duas-telas
mkdir -p "$SAIDA"
WL_FOTO=${WAYLAND_DISPLAY:-}   # o weston-screenshooter é cliente Wayland, mesmo quando o caso roda pelo Xwayland
case "$SESSAO" in
  wayland) export GDK_BACKEND=wayland XDG_SESSION_TYPE=wayland; unset DISPLAY ;;
  *) export GDK_BACKEND=x11 XDG_SESSION_TYPE=x11; unset WAYLAND_DISPLAY ;;
esac

fotos() {   # fotos <nome>: grava <nome>.telas.txt com a fração branca de cada tela
  sleep 6
  : > "$SAIDA/$SESSAO-$1.telas.txt"
  img="$SAIDA/$SESSAO-$1.png"
  if [ "${WESTON_FOTO:-}" = 1 ]; then
    d=$(mktemp -d); (cd "$d" && WAYLAND_DISPLAY=$WL_FOTO weston-screenshooter > /dev/null 2>&1); mv "$d"/*.png "$img" 2>/dev/null; rm -rf "$d"
  elif [ "${X11_FOTO:-}" = 1 ]; then
    xwd -silent -root | convert xwd:- "$img"
  fi
  [ -f "$img" ] || return 0
  n=1
  for geo in ${TELAS:-1920x1080+0+0 1920x1080+1920+0}; do
    echo "tela $n ($geo): branco=$(convert "$img" -crop "$geo" +repage -fuzz 5% -fill black +opaque white -format '%[fx:mean]' info:)" >> "$SAIDA/$SESSAO-$1.telas.txt"
    n=$((n + 1))
  done
}

caso() {   # caso <nome> <variáveis...>: roda com as variáveis dadas
  nome=$1; shift
  echo "== $SESSAO / $nome"
  fotos "$nome" &
  env "$@" NOTAS_TEMPO=8 timeout 40 "$BIN" > "$SAIDA/$SESSAO-$nome.txt" 2>&1
  wait
  sed 's/^/   /' "$SAIDA/$SESSAO-$nome.telas.txt"
}

caso sozinha NOTAS_MODO=sozinha
caso open-sem-gesto NOTAS_MODO=open
caso open-popup-liberado NOTAS_MODO=open NOTAS_POPUP_AUTOMATICO=1
caso rust NOTAS_MODO=rust
caso rust-cheia-gtk NOTAS_MODO=rust NOTAS_CHEIA_GTK=1
caso rust-sem-tela-cheia NOTAS_MODO=rust NOTAS_TELA_CHEIA=0
if [ "$SESSAO" != wayland ] && command -v xdotool >/dev/null; then
  # um clique de verdade (XTEST) no meio da janela da apresentação, 2 s depois de abrir
  echo "== $SESSAO / open-clique"
  fotos open-clique &
  ( sleep 3; w=$(xdotool search --name 'Apresentação' | head -1)
    if [ -n "$w" ]; then eval "$(xdotool getwindowgeometry --shell "$w")"
      xdotool mousemove $((X + WIDTH / 2)) $((Y + HEIGHT / 2)) click 1; echo "clicado em $((X + WIDTH / 2)),$((Y + HEIGHT / 2)) (janela $w)" >&2
    else echo "janela da apresentação não achada pelo xdotool" >&2; fi ) 2> "$SAIDA/$SESSAO-open-clique.xdotool.txt" &
  env NOTAS_MODO=open NOTAS_TEMPO=10 timeout 40 "$BIN" > "$SAIDA/$SESSAO-open-clique.txt" 2>&1
  wait
  sed 's/^/   /' "$SAIDA/$SESSAO-open-clique.telas.txt"
fi
python3 "$AQUI/resumir.py" "$SAIDA/$SESSAO"-*.txt
