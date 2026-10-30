#!/bin/sh
# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Monta o pacote para Linux: dist/giz-livre-<versão>-linux.tar.gz e o .sha256 ao lado. Só junta arquivos do
# repositório (não compila nada e não publica nada). Rodar da raiz do repositório:  sh installer/linux/empacotar.sh
set -eu
RAIZ=$(cd "$(dirname "$0")/../.." && pwd)
cd "$RAIZ"
VERSAO=$(sed -n 's/^VERSAO = "\([0-9.]*\)"$/\1/p' server.py)
[ -n "$VERSAO" ] || { echo "não achei VERSAO no server.py" >&2; exit 1; }
NOME=giz-livre-$VERSAO-linux
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
DEST=$TMP/$NOME
mkdir -p "$DEST/docs" dist

# só o que o programa usa; nada de quadros/, testes ou arquivos do Windows
cp server.py giz-livre.sh LICENSE THIRD-PARTY-NOTICES.md CHANGELOG.md "$DEST/"
cp -R app mcp "$DEST/"
cp installer/linux/criar-atalho.sh installer/linux/LEIA-ME-LINUX.txt "$DEST/"
cp docs/LINUX.md docs/GUIA-DE-USO.md "$DEST/docs/"
find "$DEST" -name '__pycache__' -prune -exec rm -rf {} +
chmod 755 "$DEST/giz-livre.sh" "$DEST/criar-atalho.sh"

# arquivo reprodutível: mesma ordem, mesmo dono e mesma data em todo arquivo
DATA=$(git log -1 --format=%ct 2>/dev/null || date +%s)
tar --sort=name --owner=0 --group=0 --numeric-owner --mtime="@$DATA" -C "$TMP" -cf - "$NOME" | gzip -n -9 > "dist/$NOME.tar.gz"
(cd dist && sha256sum "$NOME.tar.gz" > "$NOME.tar.gz.sha256")
echo "dist/$NOME.tar.gz"
cat "dist/$NOME.tar.gz.sha256"
