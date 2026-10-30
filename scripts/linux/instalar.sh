#!/bin/sh
# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Instala o Giz Livre só para esta conta, sem senha de administrador. Rode de dentro da pasta extraída:  ./instalar.sh
# Grava só na pasta pessoal:
#   ~/.local/lib/giz-livre/                                   o programa (e o desinstalar.sh)
#   ~/.local/bin/giz-livre                                    o launcher
#   ~/.local/share/applications/giz-livre.desktop             o atalho no menu de aplicativos
#   ~/.local/share/icons/hicolor/128x128/apps/giz-livre.png   o ícone
# Os quadros ficam em ~/.local/share/giz-livre/quadros (com XDG_DATA_HOME, em $XDG_DATA_HOME/giz-livre/quadros).
# Rodar de novo atualiza o programa e não mexe nos quadros.
set -eu
AQUI=$(cd "$(dirname "$0")" && pwd)
case "${XDG_DATA_HOME:-}" in
  /*) BASE=$XDG_DATA_HOME ;;
  *) BASE=$HOME/.local/share ;;
esac
PROGRAMA=$HOME/.local/lib/giz-livre
LAUNCHER=$HOME/.local/bin/giz-livre
DESKTOP=$BASE/applications/giz-livre.desktop
ICONE=$BASE/icons/hicolor/128x128/apps/giz-livre.png

if [ "$(id -u)" = 0 ]; then
  echo "Rode sem sudo: esta instalação é só para a sua conta. Para todas as contas, use o pacote .deb." >&2
  exit 1
fi
ok=0
for nome in python3.14 python3.13 python3.12 python3.11 python3.10 python3; do
  if command -v "$nome" >/dev/null 2>&1 &&
     "$nome" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' >/dev/null 2>&1; then
    ok=1
    break
  fi
done
if [ "$ok" = 0 ]; then
  echo "O Giz Livre precisa do Python 3.10 ou mais novo. No Ubuntu ou Debian: sudo apt install python3" >&2
  exit 1
fi
# o caminho vai no Exec do atalho e no launcher: sem aspas, crase, $ ou barra invertida
case "$HOME" in *'"'*|*'\'*|*'`'*|*'$'*|*'%'*)
  echo "A pasta pessoal tem aspas, crase, \$, % ou barra invertida no nome; use o pacote .deb." >&2
  exit 1 ;;
esac

# programa: troca a cópia antiga inteira (os quadros não ficam aqui)
rm -rf "$PROGRAMA"
mkdir -p "$PROGRAMA" "$(dirname "$LAUNCHER")" "$(dirname "$DESKTOP")" "$(dirname "$ICONE")"
cp -R "$AQUI/programa/." "$PROGRAMA/"
cp "$AQUI/desinstalar.sh" "$PROGRAMA/desinstalar.sh"
chmod 755 "$PROGRAMA/desinstalar.sh"

ESC=$(printf '%s' "$PROGRAMA" | sed 's/[&|]/\\&/g')
sed "s|@PROGRAMA@|$ESC|" "$AQUI/pacote/giz-livre.in" > "$LAUNCHER"
chmod 755 "$LAUNCHER"
ESC=$(printf '%s' "$LAUNCHER" | sed 's/[&|]/\\&/g')
case "$LAUNCHER" in
  *' '*) sed "s|@EXEC@|\"$ESC\"|" "$AQUI/pacote/giz-livre.desktop.in" > "$DESKTOP" ;;
  *) sed "s|@EXEC@|$ESC|" "$AQUI/pacote/giz-livre.desktop.in" > "$DESKTOP" ;;
esac
chmod 644 "$DESKTOP"
cp "$AQUI/pacote/giz-livre.png" "$ICONE"
chmod 644 "$ICONE"

command -v gtk-update-icon-cache >/dev/null 2>&1 && [ -f "$BASE/icons/hicolor/index.theme" ] &&
  gtk-update-icon-cache -q "$BASE/icons/hicolor" >/dev/null 2>&1 || true

echo "Giz Livre instalado para esta conta."
echo "  Abra pelo menu de aplicativos (procure \"Giz Livre\") ou rode: $LAUNCHER"
echo "  Os quadros ficam em $BASE/giz-livre/quadros"
echo "  Para desinstalar: sh $PROGRAMA/desinstalar.sh (os quadros não são apagados)"
