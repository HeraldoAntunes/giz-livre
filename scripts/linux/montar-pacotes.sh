#!/bin/sh
# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Monta os pacotes Linux do Giz Livre em dist/linux/ e grava o SHA-256 de cada um. Não compila nem publica nada.
#
#   giz-livre_<versão>_all.deb               para todas as contas: programa em /opt/giz-livre, launcher em
#                                             /usr/bin/giz-livre, atalho e ícone em /usr/share (precisa de sudo)
#   giz-livre-<versão>-linux-usuario.tar.gz  só para uma conta, sem sudo: extrair e rodar ./instalar.sh
#   SHA256SUMS e um <pacote>.sha256 ao lado de cada pacote
#
# Os dois usam o Python 3 do sistema (3.10 ou mais novo) e gravam os quadros em ${XDG_DATA_HOME:-~/.local/share}/giz-livre.
#
# Uso, da raiz do repositório:  sh scripts/linux/montar-pacotes.sh [--versao 1.16.0~rc2] [--mantenedor "Nome <email>"]
# Sem --versao, usa a VERSAO do server.py. No .deb, "~rc2" faz a candidata vir antes da versão final.
# Precisa de: dpkg-deb, tar, gzip, sha256sum, git (só para a data dos arquivos).
set -eu
LINUX=$(cd "$(dirname "$0")" && pwd)
RAIZ=$(cd "$LINUX/../.." && pwd)
cd "$RAIZ"

VERSAO=
MANTENEDOR="Heraldo Antunes (Giz Livre)"
while [ $# -gt 0 ]; do
  case "$1" in
    --versao) VERSAO=$2; shift 2 ;;
    --versao=*) VERSAO=${1#*=}; shift ;;
    --mantenedor) MANTENEDOR=$2; shift 2 ;;
    --mantenedor=*) MANTENEDOR=${1#*=}; shift ;;
    *) echo "opção desconhecida: $1" >&2; exit 2 ;;
  esac
done
[ -n "$VERSAO" ] || VERSAO=$(sed -n 's/^VERSAO = "\([0-9.]*\)"$/\1/p' server.py)
[ -n "$VERSAO" ] || { echo "não achei VERSAO no server.py" >&2; exit 1; }
case "$VERSAO" in
  [0-9]*) ;;
  *) echo "versão inválida: $VERSAO (precisa começar com número)" >&2; exit 1 ;;
esac
case "$VERSAO" in *[!0-9A-Za-z.+~-]*) echo "versão inválida: $VERSAO" >&2; exit 1 ;; esac
NOME_ARQ=$(printf '%s' "$VERSAO" | tr '~' '-')   # "~" no nome do arquivo .tar.gz atrapalha no terminal

for f in server.py app mcp LICENSE THIRD-PARTY-NOTICES.md CHANGELOG.md docs/GUIA-DE-USO.md docs/img/icone.png; do
  [ -e "$f" ] || { echo "falta $f no repositório" >&2; exit 1; }
done
command -v dpkg-deb >/dev/null || { echo "falta o dpkg-deb (sudo apt install dpkg)" >&2; exit 1; }

# data fixa em todos os arquivos: a do último commit que mexeu em algo que entra no pacote. Assim, montar de novo
# (mesmo depois de commits só de testes ou de documentos) dá os mesmos bytes e o mesmo SHA-256.
ENTRADAS="server.py app mcp LICENSE THIRD-PARTY-NOTICES.md CHANGELOG.md docs/GUIA-DE-USO.md docs/img/icone.png scripts/linux"
# shellcheck disable=SC2086
SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH:-$(git log -1 --format=%ct -- $ENTRADAS 2>/dev/null)}
[ -n "$SOURCE_DATE_EPOCH" ] || SOURCE_DATE_EPOCH=$(date +%s)
if [ -n "$(git status --porcelain -- $ENTRADAS 2>/dev/null)" ]; then
  echo "aviso: há mudanças sem commit em arquivos do pacote; o SHA-256 não vai bater com o de um commit" >&2
fi
export SOURCE_DATE_EPOCH
umask 022
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
SAIDA=$RAIZ/dist/linux
mkdir -p "$SAIDA"

# só o que o programa usa: nada de quadros/, testes, scripts ou arquivos do Windows
copiar_programa() {
  mkdir -p "$1/docs"
  cp server.py LICENSE THIRD-PARTY-NOTICES.md CHANGELOG.md "$1/"
  cp -R app mcp "$1/"
  cp docs/GUIA-DE-USO.md "$1/docs/"
  find "$1" \( -name '__pycache__' -o -name '*.pyc' \) -prune -exec rm -rf {} +
  find "$1" -type d -exec chmod 755 {} +
  find "$1" -type f -exec chmod 644 {} +
}

datar() { find "$1" -exec touch -h -d "@$SOURCE_DATE_EPOCH" {} +; }

# ---------------- .deb ----------------
DEB=$TMP/deb
copiar_programa "$DEB/opt/giz-livre"
mkdir -p "$DEB/usr/bin" "$DEB/usr/share/applications" "$DEB/usr/share/icons/hicolor/128x128/apps" \
         "$DEB/usr/share/doc/giz-livre" "$DEB/DEBIAN"
sed 's|@PROGRAMA@|/opt/giz-livre|' "$LINUX/giz-livre.in" > "$DEB/usr/bin/giz-livre"
sed 's|@EXEC@|giz-livre|' "$LINUX/giz-livre.desktop.in" > "$DEB/usr/share/applications/giz-livre.desktop"
cp docs/img/icone.png "$DEB/usr/share/icons/hicolor/128x128/apps/giz-livre.png"
{
  echo "Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/"
  echo "Upstream-Name: Giz Livre"
  echo "Source: https://github.com/HeraldoAntunes/giz-livre"
  echo
  echo "Files: *"
  echo "Copyright: 2026 Heraldo Antunes"
  echo "License: MIT"
  echo " Texto completo em /opt/giz-livre/LICENSE. Componentes de terceiros (KaTeX, pdf.js, ícones Fluent):"
  echo " /opt/giz-livre/THIRD-PARTY-NOTICES.md e as licenças em /opt/giz-livre/app/vendor/."
} > "$DEB/usr/share/doc/giz-livre/copyright"
find "$DEB/usr" -type d -exec chmod 755 {} +
find "$DEB/usr" -type f -exec chmod 644 {} +
chmod 755 "$DEB/usr/bin/giz-livre"
cp "$LINUX/deb/postrm" "$DEB/DEBIAN/postrm"
chmod 755 "$DEB/DEBIAN/postrm"
TAMANHO=$(du -sk --apparent-size --exclude=DEBIAN "$DEB" | cut -f1)
cat > "$DEB/DEBIAN/control" <<EOF
Package: giz-livre
Version: $VERSAO
Architecture: all
Maintainer: $MANTENEDOR
Installed-Size: $TAMANHO
Depends: python3 (>= 3.10)
Recommends: xdg-utils
Suggests: chromium | chromium-browser | google-chrome-stable | firefox | firefox-esr
Section: education
Priority: optional
Homepage: https://github.com/HeraldoAntunes/giz-livre
Description: lousa digital livre e offline para aulas
 O Giz Livre é uma lousa digital livre e gratuita para professores: quadros,
 caneta, formas, fórmulas, slides anotados e exportação em PDF. Funciona sem
 internet: um servidor local em Python abre a lousa no navegador.
 .
 Os quadros de cada conta ficam em ~/.local/share/giz-livre e não são
 apagados quando o pacote é removido.
EOF
(cd "$DEB" && find opt usr -type f | LC_ALL=C sort | xargs md5sum > DEBIAN/md5sums)
chmod 644 "$DEB/DEBIAN/control" "$DEB/DEBIAN/md5sums"
datar "$DEB"
ARQ_DEB=giz-livre_${VERSAO}_all.deb
dpkg-deb --root-owner-group -Zxz --build "$DEB" "$SAIDA/$ARQ_DEB" >/dev/null

# ---------------- .tar.gz para uma conta ----------------
NOME_TAR=giz-livre-$NOME_ARQ-linux-usuario
T=$TMP/$NOME_TAR
copiar_programa "$T/programa"
mkdir -p "$T/pacote"
cp "$LINUX/giz-livre.in" "$LINUX/giz-livre.desktop.in" "$T/pacote/"
cp docs/img/icone.png "$T/pacote/giz-livre.png"
cp "$LINUX/instalar.sh" "$LINUX/desinstalar.sh" "$T/"
cat > "$T/LEIA-ME.txt" <<EOF
Giz Livre $VERSAO para Linux, instalação só para a sua conta (sem senha de administrador)

Precisa do Python 3.10 ou mais novo (no Ubuntu 22.04 ou mais novo e no Debian 12 ele já vem instalado).

Instalar: abra um terminal nesta pasta e rode
    ./instalar.sh
Depois, procure "Giz Livre" no menu de aplicativos. Ele abre no navegador.

Os quadros ficam em ~/.local/share/giz-livre/quadros.

Desinstalar:
    sh ~/.local/lib/giz-livre/desinstalar.sh
Os quadros NÃO são apagados.

Para instalar para todas as contas do computador, use o pacote giz-livre_${VERSAO}_all.deb.
EOF
chmod 644 "$T/LEIA-ME.txt" "$T/pacote/"*
chmod 755 "$T/instalar.sh" "$T/desinstalar.sh" "$T/pacote/giz-livre.in" "$T" "$T/pacote"
datar "$T"
ARQ_TAR=$NOME_TAR.tar.gz
tar --sort=name --owner=0 --group=0 --numeric-owner --mtime="@$SOURCE_DATE_EPOCH" -C "$TMP" -cf - "$NOME_TAR" |
  gzip -n -9 > "$SAIDA/$ARQ_TAR"

# ---------------- SHA-256 ----------------
cd "$SAIDA"
for a in "$ARQ_DEB" "$ARQ_TAR"; do sha256sum "$a" > "$a.sha256"; done
sha256sum "$ARQ_DEB" "$ARQ_TAR" > SHA256SUMS
echo "Pacotes em dist/linux/:"
cat SHA256SUMS
