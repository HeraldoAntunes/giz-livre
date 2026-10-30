#!/bin/sh
# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Teste do .deb com tela virtual (Xvfb), em contêiner Ubuntu: o launcher roda com DISPLAY, sem "chromium" no PATH, e
# o server.py abre o Giz Livre pelo navegador padrão (webbrowser -> xdg-open). O navegador padrão da conta é um
# Chromium COM janela, desenhado na tela virtual. Pela interface: criar e salvar um quadro; fechar; abrir de novo pelo
# atalho e reabrir o quadro; desinstalar e conferir que os quadros ficaram. Grava duas capturas da tela.
#
# Rodar da raiz do repositório:  sh tests/linux/pacote/testar-xvfb.sh [imagem ...]   (padrão: Ubuntu 22.04 e 24.04)
# Precisa do mesmo que o testar-pacotes.sh, e do convert (ImageMagick) aqui fora para as capturas. O contêiner tem
# de alcançar o repositório da distribuição (instala o Xvfb).
# CAPTURAS=pasta  onde gravar as capturas (padrão: tests/linux/pacote/capturas)
set -u
RAIZ=$(cd "$(dirname "$0")/../../.." && pwd)
cd "$RAIZ"
PW_BROWSERS=${PW_BROWSERS:-/opt/pw-browsers}
CAPTURAS=${CAPTURAS:-$RAIZ/tests/linux/pacote/capturas}
[ $# -gt 0 ] || set -- mirror.gcr.io/library/ubuntu:22.04 mirror.gcr.io/library/ubuntu:24.04
ls dist/linux/giz-livre_*_all.deb >/dev/null || { echo "Monte os pacotes antes: sh scripts/linux/montar-pacotes.sh" >&2; exit 1; }
mkdir -p "$CAPTURAS"
NOME=giz-livre-teste-xvfb
trap 'docker rm -f "$NOME" >/dev/null 2>&1' EXIT
RESUMO=""
TOTAL_FALHAS=0
passo() { echo "-- $1"; docker exec "$NOME" sh /teste/dentro.sh "$2" "${3:-}" "${4:-}"; }

for IMG in "$@"; do
  echo
  echo "================ $IMG, com tela virtual (Xvfb) ================"
  SIGLA=$(echo "$IMG" | sed 's#.*/##; s#[:.]#-#g')
  docker rm -f "$NOME" >/dev/null 2>&1
  docker run -d --name "$NOME" --network host --shm-size=1g \
    -v "$RAIZ/dist/linux:/pacotes:ro" -v "$RAIZ/tests/linux/pacote:/teste:ro" -v "$PW_BROWSERS:/opt/pw-browsers:ro" \
    "$IMG" sleep infinity >/dev/null || { RESUMO="$RESUMO
  FALHOU  $IMG (não subiu)"; TOTAL_FALHAS=$((TOTAL_FALHAS + 1)); continue; }
  if [ -f /root/.ccr/ca-bundle.crt ]; then
    docker cp /root/.ccr/ca-bundle.crt "$NOME":/ca-proxy.crt
    docker exec "$NOME" sh -c 'echo "Acquire::https::CAInfo \"/ca-proxy.crt\";" > /etc/apt/apt.conf.d/99ca-proxy'
  fi
  falhas=0
  if ! passo "preparar o contêiner" preparar || docker exec "$NOME" test -f /etc/giz-teste-sem-apt ||
     ! passo "preparar a tela virtual" preparar-xvfb; then
    RESUMO="$RESUMO
  FALHOU  $IMG (preparar; o Xvfb precisa do apt)"
    TOTAL_FALHAS=$((TOTAL_FALHAS + 1))
    continue
  fi
  passo "instalar o .deb" instalar deb || { RESUMO="$RESUMO
  FALHOU  $IMG (instalar)"; TOTAL_FALHAS=$((TOTAL_FALHAS + 1)); continue; }
  passo "conferir o atalho" validar deb || falhas=$((falhas + 1))
  passo "abrir pelo atalho, com tela" abrir deb || falhas=$((falhas + 1))
  echo "-- criar e salvar um quadro na janela do navegador padrão"
  SAIDA=$(CAPTURA="$CAPTURAS/xvfb-$SIGLA-pagina.png" node tests/linux/pacote/quadro.mjs 9333 "Xvfb em $IMG" 2>&1) ||
    falhas=$((falhas + 1))
  echo "$SAIDA" | grep -v '^QUADRO '
  ID=$(echo "$SAIDA" | sed -n 's/^QUADRO //p')
  passo "fechar" esperar-fim deb || falhas=$((falhas + 1))
  if [ -n "$ID" ]; then
    passo "conferir o quadro no disco" conferir-quadro deb "$ID" || falhas=$((falhas + 1))
    passo "abrir de novo pelo atalho" abrir deb || falhas=$((falhas + 1))
    sleep 4
    passo "capturar a tela virtual inteira" foto-tela deb &&
      docker cp "$NOME":/tmp/tela.xwd "$CAPTURAS/tela.xwd" >/dev/null &&
      convert "xwd:$CAPTURAS/tela.xwd" "$CAPTURAS/xvfb-$SIGLA-tela.png" && rm -f "$CAPTURAS/tela.xwd" &&
      echo "  captura: ${CAPTURAS#$RAIZ/}/xvfb-$SIGLA-tela.png"
    echo "-- reabrir o quadro"
    SAIDA=$(REABRIR=$ID CAPTURA="$CAPTURAS/xvfb-$SIGLA-reaberto.png" node tests/linux/pacote/quadro.mjs 9333 "Xvfb em $IMG" 2>&1) ||
      falhas=$((falhas + 1))
    echo "$SAIDA" | grep -v '^QUADRO '
    passo "fechar" esperar-fim deb || falhas=$((falhas + 1))
  else
    falhas=$((falhas + 1))
  fi
  passo "desinstalar" desinstalar deb || falhas=$((falhas + 1))
  passo "conferir que nada sobrou e que os quadros ficaram" conferir-limpo deb || falhas=$((falhas + 1))
  docker rm -f "$NOME" >/dev/null 2>&1
  if [ "$falhas" = 0 ]; then RESUMO="$RESUMO
  PASSOU  $IMG (Xvfb)"; else RESUMO="$RESUMO
  FALHOU  $IMG (Xvfb, $falhas passo(s))"; fi
  TOTAL_FALHAS=$((TOTAL_FALHAS + falhas))
done

echo
echo "================ resumo (Xvfb) ================"
echo "pacote testado:"
grep '_all.deb' dist/linux/SHA256SUMS | sed 's/^/  /'
echo "capturas em ${CAPTURAS#$RAIZ/}"
echo "resultado:$RESUMO"
[ "$TOTAL_FALHAS" = 0 ]
