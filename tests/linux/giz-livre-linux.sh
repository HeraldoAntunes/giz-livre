#!/bin/sh
# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Abre o Giz Livre no Linux ou no macOS: servidor local (Python 3.10+, só a biblioteca padrão) e janela do
# Chrome/Chromium/Edge/Brave em modo app; sem nenhum deles, abre no navegador padrão. Não instala nada.
#
# Cópia do giz-livre.sh do ramo linux-validacao (validação da 1.15.2), guardada aqui em tests/linux para validar a
# 1.16.0-rc.2 sem mexer no giz-livre.sh do programa. A única diferença: a pasta do programa é a raiz do repositório,
# dois níveis acima deste arquivo.
#
# Onde ficam os quadros (nesta ordem):
#   1. a pasta dada com --dados PASTA (repassada ao server.py como está);
#   2. a pasta da variável GIZ_LIVRE_DADOS;
#   3. quadros/ ao lado deste arquivo, se já existir (era o lugar antes deste launcher; nada muda para quem já usa);
#   4. ${XDG_DATA_HOME:-~/.local/share}/giz-livre/quadros
# O registro (giz-livre.log) e os ajustes (preferencias.json) ficam na pasta acima da dos quadros.
#
# Uso: tests/linux/giz-livre-linux.sh [--porta 8765] [--sem-janela] [--dados PASTA] [--sem-auto-encerrar]

AQUI=$(cd "$(dirname "$0")/../.." && pwd) || exit 1

# Python 3.10 ou mais novo: tenta primeiro os nomes com versão, depois python3 e python
PY=
for nome in python3.14 python3.13 python3.12 python3.11 python3.10 python3 python; do
  if command -v "$nome" >/dev/null 2>&1 &&
     "$nome" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' >/dev/null 2>&1; then
    PY=$nome
    break
  fi
done
if [ -z "$PY" ]; then
  echo "Giz Livre: precisa do Python 3.10 ou mais novo." >&2
  echo "  Debian/Ubuntu: sudo apt install python3    Fedora: sudo dnf install python3" >&2
  exit 1
fi

TEM_DADOS=0
for a in "$@"; do
  case "$a" in --dados|--dados=*) TEM_DADOS=1 ;; esac
done

cd "$AQUI" || exit 1
if [ "$TEM_DADOS" = 1 ]; then
  exec "$PY" server.py "$@"
fi
if [ -n "$GIZ_LIVRE_DADOS" ]; then
  DADOS=$GIZ_LIVRE_DADOS
elif [ -d "$AQUI/quadros" ]; then
  DADOS=$AQUI/quadros
else
  DADOS=${XDG_DATA_HOME:-$HOME/.local/share}/giz-livre/quadros
fi
mkdir -p "$DADOS" || { echo "Giz Livre: não consegui criar a pasta $DADOS" >&2; exit 1; }
exec "$PY" server.py --dados "$DADOS" "$@"
