#!/bin/sh
# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Testa o .tar.gz (instalação só para a conta) em contêineres Fedora. Não há .rpm: o .deb não serve no Fedora.
# Sem rede para o dnf (o ambiente bloqueia os espelhos do Fedora), o teste usa só o que vem na imagem:
#   - imagem com python3 (Fedora 40): instalar.sh na conta prof; desktop-file-validate (aqui fora, na cópia exata do
#     atalho); ícone; abrir pelo comando do atalho; o servidor responde no /api/info; o Chromium daqui de fora abre o
#     endereço que o server.py passou e cria e salva um quadro; fechar; desinstalar; conferir que nada sobrou na pasta
#     pessoal e que os quadros ficaram;
#   - imagem sem python3 (Fedora 41 em diante, na imagem mínima): o instalar.sh tem de recusar e dizer o que falta.
# A imagem do Fedora não tem su, pgrep nem ps: os passos rodam com docker exec -u prof e /proc.
#
# Rodar da raiz do repositório:  sh tests/linux/pacote/testar-fedora.sh [imagem ...]
# (padrão: mirror.gcr.io/library/fedora:40 e mirror.gcr.io/library/fedora:latest)
# Precisa de: docker, node com Playwright, Chromium do Playwright em /opt/pw-browsers, desktop-file-validate aqui fora.
set -u
RAIZ=$(cd "$(dirname "$0")/../../.." && pwd)
cd "$RAIZ"
PW_BROWSERS=${PW_BROWSERS:-/opt/pw-browsers}
CHROME=$(ls -d "$PW_BROWSERS"/chromium-*/chrome-linux*/chrome | head -1)
[ $# -gt 0 ] || set -- mirror.gcr.io/library/fedora:40 mirror.gcr.io/library/fedora:latest
TAR=$(ls dist/linux/giz-livre-*-linux-usuario.tar.gz 2>/dev/null | head -1)
[ -n "$TAR" ] || { echo "Monte os pacotes antes: sh scripts/linux/montar-pacotes.sh" >&2; exit 1; }
PASTA=$(basename "$TAR" .tar.gz)
NOME=giz-livre-teste-fedora
TMP=$(mktemp -d)
NAV=
trap '[ -n "$NAV" ] && kill "$NAV" 2>/dev/null; rm -rf "$TMP"; docker rm -f "$NOME" >/dev/null 2>&1' EXIT
RESUMO=""
TOTAL=0
DADOS=/home/prof/.local/share/giz-livre
CON=$DADOS/quadros/.agente/conexao.json
ok() { echo "  ✓ $1"; }
nao() { echo "  ✗ $1"; falhas=$((falhas + 1)); }
root() { docker exec "$NOME" sh -c "$1"; }
prof() { docker exec -u prof -w /home/prof -e HOME=/home/prof "$NOME" sh -c "$1"; }
# vivo: o processo existe e não é zumbi (no contêiner ninguém recolhe o processo que saiu, e ele fica no /proc como Z)
vivo() { root "[ -d /proc/$1 ] && ! grep -q '^State:.*Z' /proc/$1/status"; }

for IMG in "$@"; do
  echo
  echo "================ $IMG, .tar.gz ================"
  falhas=0
  docker rm -f "$NOME" >/dev/null 2>&1
  docker run -d --name "$NOME" --network host "$IMG" sleep infinity >/dev/null || { RESUMO="$RESUMO
  FALHOU  $IMG (não subiu)"; TOTAL=$((TOTAL + 1)); continue; }
  echo "  sistema: $(root 'cat /etc/fedora-release')"
  root 'useradd -m prof'
  docker cp "$TAR" "$NOME":/home/prof/ >/dev/null
  root "chown prof: /home/prof/$(basename "$TAR")"
  prof "tar xzf $(basename "$TAR") && rm $(basename "$TAR")"
  prof 'find /home/prof -mindepth 1 -not -path "/home/prof/'"$PASTA"'*" | sort' > "$TMP/antes.txt"

  if ! root 'command -v python3 >/dev/null'; then
    echo "-- instalar sem python3 na imagem"
    SAIDA=$(prof "cd $PASTA && ./instalar.sh" 2>&1); COD=$?
    echo "$SAIDA" | sed 's/^/    /'
    if [ "$COD" != 0 ] && echo "$SAIDA" | grep -q "Python 3.10 ou mais novo"; then
      ok "o instalar.sh recusou (saída $COD) e disse que falta o Python 3.10 ou mais novo"
    else
      nao "o instalar.sh não recusou como devia (saída $COD)"
    fi
    [ -z "$(prof 'ls -A .local 2>/dev/null')" ] && ok "nada foi instalado" || nao "sobrou algo em ~/.local"
  else
    echo "-- instalar (./instalar.sh na conta prof, sem sudo)"
    echo "  python3 da imagem: $(root 'python3 --version')"
    prof "cd $PASTA && ./instalar.sh" | sed 's/^/    /'
    prof "rm -rf $PASTA"
    prof 'test -x .local/bin/giz-livre && test -f .local/lib/giz-livre/server.py' && ok "launcher e programa instalados" ||
      nao "faltou o launcher ou o programa"

    echo "-- conferir o atalho e o ícone"
    docker cp "$NOME":/home/prof/.local/share/applications/giz-livre.desktop "$TMP/giz-livre.desktop" >/dev/null &&
      desktop-file-validate "$TMP/giz-livre.desktop" && ok "desktop-file-validate (aqui fora, na cópia exata): sem erro nem aviso" ||
      nao "atalho ausente ou com problema"
    grep -E "^(Exec|Icon)=" "$TMP/giz-livre.desktop" | sed 's/^/    /'
    root "python3 -c \"import struct;d=open('/home/prof/.local/share/icons/hicolor/128x128/apps/giz-livre.png','rb').read(24);print('    ícone: PNG %dx%d' % struct.unpack('>II', d[16:24]))\"" ||
      nao "falta o ícone"

    echo "-- abrir pelo comando do atalho"
    # o "chromium" que o server.py acha no PATH só anota o endereço; quem abre é o Chromium daqui de fora
    root "printf '%s\n' '#!/bin/sh' 'echo \"\$*\" >> /tmp/chromium-chamadas.log' > /usr/local/bin/chromium && chmod 755 /usr/local/bin/chromium"
    EXEC=$(sed -n 's/^Exec=//p' "$TMP/giz-livre.desktop" | sed 's/^"\(.*\)"$/\1/')
    docker exec -d -u prof -w /home/prof -e HOME=/home/prof "$NOME" sh -c "exec setsid $EXEC > /tmp/giz-launcher.log 2>&1 < /dev/null"
    for _ in $(seq 1 100); do root "test -f $CON" && break; sleep 0.2; done
    if ! root "test -f $CON"; then
      root 'cat /tmp/giz-launcher.log'; nao "o servidor não subiu"
    else
      PID=$(root "sed -n 's/.*\"pid\": *\([0-9]*\).*/\1/p' $CON")
      PORTA=$(root "sed -n 's/.*\"porta\": *\([0-9]*\).*/\1/p' $CON")
      echo "    processo: $(root "tr '\0' ' ' < /proc/$PID/cmdline")"
      INFO=$(curl -s -m 5 "http://127.0.0.1:$PORTA/api/info")
      echo "$INFO" | grep -q '"versao"' && ok "o servidor responde no /api/info: $INFO" || nao "o servidor não respondeu: $INFO"
      for _ in $(seq 1 50); do root 'test -s /tmp/chromium-chamadas.log' && break; sleep 0.2; done
      URL=$(root "sed -n 's/.*--app=\([^ ]*\).*/\1/p' /tmp/chromium-chamadas.log | tail -1")
      [ -n "$URL" ] && ok "o server.py chamou o chromium com --app=http://127.0.0.1:$PORTA/?k=…" || nao "o navegador não foi chamado"

      echo "-- criar e salvar um quadro (Chromium sem janela daqui de fora)"
      "$CHROME" --headless=new --no-sandbox --disable-gpu --remote-debugging-port=9333 --user-data-dir="$TMP/perfil" \
        --app="$URL" >/dev/null 2>&1 &
      NAV=$!
      SAIDA=$(node tests/linux/pacote/quadro.mjs 9333 "Fedora em $IMG" 2>&1) || falhas=$((falhas + 1))
      echo "$SAIDA" | grep -v '^QUADRO '
      ID=$(echo "$SAIDA" | sed -n 's/^QUADRO //p')
      kill "$NAV" 2>/dev/null; wait "$NAV" 2>/dev/null; NAV=

      echo "-- fechar"
      for _ in $(seq 1 60); do vivo "$PID" || break; sleep 1; done
      if vivo "$PID"; then nao "o servidor não se encerrou sozinho em 60 s"; root "kill $PID"; sleep 2
      else ok "a janela fechou e o servidor se encerrou sozinho"; fi
      root "test -f $CON" && nao "o arquivo de conexão ficou" || ok "arquivo de conexão apagado na saída"
      if [ -n "$ID" ]; then
        root "python3 -c \"import json;d=json.load(open('$DADOS/quadros/$ID.json'));i=d['items'];print('    no disco: %d traço(s), textos %s' % (sum(x.get('type')=='stroke' for x in i), [x.get('text') for x in i if x.get('type')=='text']))\"" &&
          ok "quadro salvo no disco: ~/.local/share/giz-livre/quadros/$ID.json ($(root "stat -c '%a %U' $DADOS/quadros/$ID.json"))" ||
          nao "o quadro não está no disco"
      fi
    fi

    echo "-- desinstalar (sh ~/.local/lib/giz-livre/desinstalar.sh)"
    prof 'sh .local/lib/giz-livre/desinstalar.sh' | sed 's/^/    /'
    prof 'find /home/prof -mindepth 1 | sort' > "$TMP/depois.txt"
    # ~/.local e ~/.local/share ficam porque são as pastas acima da dos quadros, que fica de propósito
    SOBRA=$(comm -13 "$TMP/antes.txt" "$TMP/depois.txt" | grep -v "^$DADOS" |
            grep -vxE '/home/prof/\.local|/home/prof/\.local/share' || true)
    [ -z "$SOBRA" ] && ok "fora de ~/.local/share/giz-livre, a pasta pessoal voltou a ser como era antes de instalar" ||
      nao "sobrou: $SOBRA"
    N=$(prof "ls $DADOS/quadros/*.json 2>/dev/null | wc -l")
    [ "$N" -gt 0 ] && ok "os quadros ficaram: $N em ~/.local/share/giz-livre/quadros" || nao "os quadros sumiram"
  fi
  docker rm -f "$NOME" >/dev/null 2>&1
  if [ "$falhas" = 0 ]; then RESUMO="$RESUMO
  PASSOU  $IMG"; else RESUMO="$RESUMO
  FALHOU  $IMG ($falhas)"; fi
  TOTAL=$((TOTAL + falhas))
done
echo
echo "================ resumo (Fedora) ================"
echo "pacote testado: $(grep linux-usuario dist/linux/SHA256SUMS)"
echo "resultado:$RESUMO"
[ "$TOTAL" = 0 ]
