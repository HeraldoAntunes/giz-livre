#!/bin/sh
# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Opcional: põe o Giz Livre no menu de aplicativos do usuário (Linux), sem senha de administrador.
# Cria só dois arquivos, e nada fora da pasta pessoal:
#   ~/.local/share/applications/giz-livre.desktop            (atalho no menu, aponta para o giz-livre.sh desta pasta)
#   ~/.local/share/icons/hicolor/scalable/apps/giz-livre.svg (ícone)
# Para tirar o atalho:  ./criar-atalho.sh --remover   (os quadros não são apagados)

AQUI=$(cd "$(dirname "$0")" && pwd) || exit 1
BASE=${XDG_DATA_HOME:-$HOME/.local/share}
DESKTOP=$BASE/applications/giz-livre.desktop
ICONE=$BASE/icons/hicolor/scalable/apps/giz-livre.svg

if [ "$1" = "--remover" ]; then
  rm -f "$DESKTOP" "$ICONE"
  echo "Atalho removido. Os quadros continuam onde estavam."
  exit 0
fi

if [ ! -x "$AQUI/giz-livre.sh" ]; then
  echo "Não achei o giz-livre.sh executável em $AQUI" >&2
  exit 1
fi
mkdir -p "$BASE/applications" "$BASE/icons/hicolor/scalable/apps" || exit 1
cp "$AQUI/app/icon.svg" "$ICONE" || exit 1
# o caminho vai entre aspas no Exec (pode ter espaço); aspas e barras invertidas no caminho não são aceitas
case "$AQUI" in *'"'*|*'\'*|*'`'*|*'$'*) echo "Mova a pasta para um caminho sem aspas, crase, \$ ou barra invertida." >&2; exit 1 ;; esac
cat > "$DESKTOP" <<EOF
[Desktop Entry]
Type=Application
Name=Giz Livre
Comment=Lousa digital livre e offline
Exec="$AQUI/giz-livre.sh"
Path=$AQUI
Icon=giz-livre
Terminal=false
Categories=Education;Graphics;
EOF
chmod 644 "$DESKTOP"
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$BASE/applications" >/dev/null 2>&1
echo "Atalho criado: $DESKTOP"
echo "Se mover esta pasta, rode ./criar-atalho.sh de novo."
