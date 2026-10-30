#!/bin/sh
# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Abre o Giz Livre no Linux ou no macOS (servidor local + janela do Chrome/Chromium/Edge). Requer Python 3.10+.
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then PY=python3; else PY=python; fi
exec "$PY" server.py "$@"
