#!/bin/sh
# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Testa os pacotes Linux (dist/linux/, montados por scripts/linux/montar-pacotes.sh) em contêineres sem tela:
# Ubuntu 22.04, Ubuntu 24.04 e Debian 12. Em cada um, primeiro o .deb e depois o .tar.gz para uma conta:
#   instalar; desktop-file-validate no atalho; abrir pelo comando do atalho (launcher -> server.py -> Chromium sem
#   janela); criar e salvar um quadro pela interface; fechar; desinstalar; conferir que nada sobrou e que os quadros ficaram.
# No fim, confere que o dpkg recusa o .deb num Debian 12 sem python3.
#
# Se o contêiner não alcança o repositório da distribuição, o dentro.sh entra no "modo sem apt": o python3 tem de vir
# na imagem, o .deb entra pelo dpkg -i, e o desktop-file-validate e o Chromium rodam aqui fora (o launcher e o
# servidor continuam dentro do contêiner, na conta prof). A saída diz quando isso acontece.
#
# Rodar da raiz do repositório:  sh tests/linux/pacote/testar-pacotes.sh [imagem ...]
# Precisa de: docker (rede do host), node com Playwright, Chromium do Playwright em /opt/pw-browsers
# (ou PW_BROWSERS=pasta); no modo sem apt, desktop-file-validate aqui fora. As imagens padrão vêm do espelho mirror.gcr.io (o Docker Hub limita os downloads).
set -u
RAIZ=$(cd "$(dirname "$0")/../../.." && pwd)
cd "$RAIZ"
PW_BROWSERS=${PW_BROWSERS:-/opt/pw-browsers}
# Debian 12: buildpack-deps:bookworm é a imagem oficial do Debian 12 com mais pacotes, entre eles o python3 do Debian.
# Serve para quando o contêiner não alcança o deb.debian.org (o modo sem apt do dentro.sh); com rede, debian:12 também serve.
[ $# -gt 0 ] || set -- mirror.gcr.io/library/ubuntu:22.04 mirror.gcr.io/library/ubuntu:24.04 \
  mirror.gcr.io/library/buildpack-deps:bookworm
SEM_PYTHON=${SEM_PYTHON:-mirror.gcr.io/library/debian:12}   # imagem sem python3, para ver o dpkg recusar o pacote
ls dist/linux/giz-livre_*_all.deb dist/linux/giz-livre-*-linux-usuario.tar.gz >/dev/null || {
  echo "Monte os pacotes antes: sh scripts/linux/montar-pacotes.sh" >&2; exit 1; }
NOME=giz-livre-teste-pacote
CHROME=$(ls -d "$PW_BROWSERS"/chromium-*/chrome-linux*/chrome | head -1)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"; docker rm -f "$NOME" >/dev/null 2>&1' EXIT
RESUMO=""
TOTAL_FALHAS=0

passo() {   # passo <descrição> <comando dentro.sh...>
  echo "-- $1"
  docker exec "$NOME" sh /teste/dentro.sh "$2" "${3:-}" "${4:-}"
}

for IMG in "$@"; do
  echo
  echo "================ $IMG ================"
  docker rm -f "$NOME" >/dev/null 2>&1
  docker run -d --name "$NOME" --network host \
    -e https_proxy="${HTTPS_PROXY:-${https_proxy:-}}" -e http_proxy="${HTTP_PROXY:-${http_proxy:-}}" \
    -v "$RAIZ/dist/linux:/pacotes:ro" -v "$RAIZ/tests/linux/pacote:/teste:ro" -v "$PW_BROWSERS:/opt/pw-browsers:ro" \
    "$IMG" sleep infinity >/dev/null || { echo "não consegui subir $IMG"; TOTAL_FALHAS=$((TOTAL_FALHAS + 1)); continue; }
  # a rede deste ambiente passa por um proxy com certificado próprio: o apt do contêiner precisa confiar nele
  if [ -f /root/.ccr/ca-bundle.crt ]; then
    docker cp /root/.ccr/ca-bundle.crt "$NOME":/ca-proxy.crt
    docker exec "$NOME" sh -c 'echo "Acquire::https::CAInfo \"/ca-proxy.crt\";" > /etc/apt/apt.conf.d/99ca-proxy'
  fi
  # o proxy de saída deste ambiente só aceita https: no Debian, troca os endereços http do apt por https
  PROXY=${HTTPS_PROXY:-${https_proxy:-}}
  if [ -n "$PROXY" ]; then
    docker exec "$NOME" sh -c "echo 'Acquire::https::Proxy \"$PROXY\";' > /etc/apt/apt.conf.d/98proxy"
    docker exec "$NOME" sh -c 'f=/etc/apt/sources.list.d/debian.sources; [ -f $f ] && sed -i "s#http://deb.debian.org#https://deb.debian.org#g" $f; true'
  fi
  falhas=0
  if ! passo "preparar o contêiner" preparar; then
    docker rm -f "$NOME" >/dev/null 2>&1
    RESUMO="$RESUMO
  FALHOU  $IMG (preparar o contêiner)"
    TOTAL_FALHAS=$((TOTAL_FALHAS + 1))
    continue
  fi
  for MODO in deb usuario; do
    echo
    echo "---- $IMG, pacote: $MODO ----"
    [ "$MODO" = usuario ] && docker exec "$NOME" sh /teste/dentro.sh foto "" antes
    passo "instalar" instalar "$MODO" || { falhas=$((falhas + 1)); continue; }
    passo "conferir o atalho" validar "$MODO" || falhas=$((falhas + 1))
    if docker exec "$NOME" test -f /tmp/validar.desktop; then
      # modo sem apt: o desktop-file-validate roda aqui fora, na cópia exata do atalho instalado
      docker cp "$NOME":/tmp/validar.desktop "$TMP/giz-livre.desktop" >/dev/null
      docker exec "$NOME" rm -f /tmp/validar.desktop
      if desktop-file-validate "$TMP/giz-livre.desktop"; then
        echo "  ✓ desktop-file-validate (fora do contêiner, $(desktop-file-validate --version 2>/dev/null || echo host)): sem erro nem aviso"
      else
        echo "  ✗ desktop-file-validate apontou problema"; falhas=$((falhas + 1))
      fi
    fi
    passo "abrir pelo atalho" abrir "$MODO" || { falhas=$((falhas + 1)); continue; }
    NAV_FORA=
    if docker exec "$NOME" test -f /etc/giz-teste-sem-apt; then
      # modo sem apt: o Chromium daqui de fora abre o endereço (com a chave de uso único) que o server.py passou
      URL=$(docker exec "$NOME" sed -n 's/.*--app=\([^ ]*\).*/\1/p' /tmp/chromium-chamadas.log | tail -1)
      "$CHROME" --headless=new --no-sandbox --disable-gpu --remote-debugging-port=9333 \
        --user-data-dir="$TMP/perfil-$MODO" --app="$URL" --start-maximized >/dev/null 2>&1 &
      NAV_FORA=$!
      echo "  (Chromium de fora do contêiner abrindo o endereço que o server.py passou)"
    fi
    echo "-- criar e salvar um quadro no Chromium sem janela"
    SAIDA=$(node tests/linux/pacote/quadro.mjs 9333 "Pacote $MODO em $IMG" 2>&1) || falhas=$((falhas + 1))
    echo "$SAIDA" | grep -v '^QUADRO '
    ID=$(echo "$SAIDA" | sed -n 's/^QUADRO //p')
    [ -n "$NAV_FORA" ] && { kill "$NAV_FORA" 2>/dev/null; wait "$NAV_FORA" 2>/dev/null; }
    passo "fechar" esperar-fim "$MODO" || falhas=$((falhas + 1))
    [ -n "$ID" ] && { passo "conferir o quadro no disco" conferir-quadro "$MODO" "$ID" || falhas=$((falhas + 1)); }
    passo "desinstalar" desinstalar "$MODO" || falhas=$((falhas + 1))
    passo "conferir que nada sobrou e que os quadros ficaram" conferir-limpo "$MODO" || falhas=$((falhas + 1))
  done
  docker rm -f "$NOME" >/dev/null 2>&1
  if [ "$falhas" = 0 ]; then RESUMO="$RESUMO
  PASSOU  $IMG"; else RESUMO="$RESUMO
  FALHOU  $IMG ($falhas passo(s))"; fi
  TOTAL_FALHAS=$((TOTAL_FALHAS + falhas))
done

echo
echo "================ dependência: $SEM_PYTHON, sem python3 ================"
SAIDA=$(docker run --rm -v "$RAIZ/dist/linux:/pacotes:ro" "$SEM_PYTHON" sh -c \
  'command -v python3 && exit 3; dpkg -i /pacotes/giz-livre_*_all.deb; echo "dpkg saiu com $?"' 2>&1)
echo "$SAIDA" | sed 's/^/    /'
if echo "$SAIDA" | grep -q "depends on python3 (>= 3.10)" && echo "$SAIDA" | grep -q "dpkg saiu com 1"; then
  echo "  ✓ sem python3, o dpkg não configura o pacote e diz que falta python3 (>= 3.10)"
  RESUMO="$RESUMO
  PASSOU  $SEM_PYTHON (dependência python3 conferida pelo dpkg)"
else
  echo "  ✗ o dpkg não recusou o pacote sem python3"
  RESUMO="$RESUMO
  FALHOU  $SEM_PYTHON (dependência python3)"
  TOTAL_FALHAS=$((TOTAL_FALHAS + 1))
fi

echo
echo "================ resumo ================"
echo "pacotes testados:"
sed 's/^/  /' dist/linux/SHA256SUMS
echo "resultado:$RESUMO"
[ "$TOTAL_FALHAS" = 0 ]
