#!/bin/sh
# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Desinstala o Giz Livre instalado só para esta conta (pelo instalar.sh). Apaga o programa, o launcher, o atalho e o
# ícone. NÃO apaga os quadros, o registro nem os ajustes, que ficam em ~/.local/share/giz-livre.
# Uso:  sh ~/.local/lib/giz-livre/desinstalar.sh
set -u
case "${XDG_DATA_HOME:-}" in
  /*) BASE=$XDG_DATA_HOME ;;
  *) BASE=$HOME/.local/share ;;
esac
PROGRAMA=$HOME/.local/lib/giz-livre
DADOS=${GIZ_LIVRE_DADOS:-$BASE/giz-livre/quadros}

# o Giz Livre ainda aberto ficaria sem os arquivos da página: pede para fechar antes
PID=$(sed -n 's/.*"pid": *\([0-9][0-9]*\).*/\1/p' "$DADOS/.agente/conexao.json" 2>/dev/null)
if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
  echo "O Giz Livre está aberto. Feche a janela dele, espere uns minutos (ele se encerra sozinho) e rode de novo." >&2
  exit 1
fi

rm -f "$HOME/.local/bin/giz-livre" "$BASE/applications/giz-livre.desktop" \
      "$BASE/icons/hicolor/128x128/apps/giz-livre.png"
rm -rf "$PROGRAMA"
# pastas que o instalar.sh pode ter criado: só saem se ficaram vazias
for p in "$BASE/icons/hicolor/128x128/apps" "$BASE/icons/hicolor/128x128" "$BASE/icons/hicolor" "$BASE/icons" \
         "$BASE/applications" "$HOME/.local/lib" "$HOME/.local/bin"; do
  rmdir "$p" 2>/dev/null
done
echo "Giz Livre desinstalado desta conta."
echo "Os quadros NÃO foram apagados: continuam em $BASE/giz-livre"
echo "Para apagá-los também, apague essa pasta."
exit 0
