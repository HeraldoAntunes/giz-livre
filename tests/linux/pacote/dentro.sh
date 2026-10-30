#!/bin/sh
# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Parte do teste dos pacotes Linux que roda DENTRO do contêiner (Ubuntu ou Debian), chamada pelo testar-pacotes.sh.
# Cada passo é um subcomando:  sh /teste/dentro.sh <passo> [deb|usuario] [argumento]
# Espera: os pacotes em /pacotes (só leitura) e o Chromium do Playwright em /opt/pw-browsers (só leitura).
# A conta de teste é "prof", sem senha e sem sudo.
set -eu
PASSO=$1
MODO=${2:-}
ARG=${3:-}
PROF=/home/prof
DADOS=$PROF/.local/share/giz-livre
como_prof() { su prof -s /bin/sh -c "cd $PROF && $1"; }
falha() { echo "  ✗ $1"; exit 1; }
ok() { echo "  ✓ $1"; }

desktop_do_modo() {
  if [ "$MODO" = deb ]; then echo /usr/share/applications/giz-livre.desktop
  else echo "$PROF/.local/share/applications/giz-livre.desktop"; fi
}
icone_do_modo() {
  if [ "$MODO" = deb ]; then echo /usr/share/icons/hicolor/128x128/apps/giz-livre.png
  else echo "$PROF/.local/share/icons/hicolor/128x128/apps/giz-livre.png"; fi
}

case "$PASSO" in
preparar)
  . /etc/os-release
  echo "  sistema: $PRETTY_NAME"
  export DEBIAN_FRONTEND=noninteractive
  rm -f /etc/giz-teste-sem-apt
  if apt-get update -qq >/tmp/apt-update.log 2>&1 && ! grep -q '^[WE]:' /tmp/apt-update.log; then
    # desktop-file-utils: desktop-file-validate. O resto: bibliotecas que o Chromium sem janela usa.
    # Python NÃO é instalado aqui: no modo deb ele tem de vir pela dependência do pacote.
    # no Ubuntu 24.04 várias bibliotecas ganharam o sufixo t64 (libasound2 -> libasound2t64): usa o nome que existir
    PACOTES=""
    for p in desktop-file-utils ca-certificates procps libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
             libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
             libdbus-1-3 libglib2.0-0 fonts-liberation; do
      if apt-cache show "${p}t64" >/dev/null 2>&1; then PACOTES="$PACOTES ${p}t64"; else PACOTES="$PACOTES $p"; fi
    done
    # shellcheck disable=SC2086
    apt-get install -y -qq --no-install-recommends $PACOTES >/tmp/apt-preparar.log 2>&1 ||
      { tail -5 /tmp/apt-preparar.log; falha "não consegui instalar as bibliotecas do teste"; }
    if command -v python3 >/dev/null 2>&1; then echo "  aviso: python3 já estava instalado"; else ok "sem python3 antes de instalar o pacote"; fi
  else
    # sem acesso ao repositório da distribuição (a rede do ambiente bloqueia): o teste continua, com três diferenças,
    # todas anotadas na saída: o python3 tem de vir na imagem, o .deb entra pelo dpkg (que confere a dependência) e o
    # desktop-file-validate e o Chromium rodam fora do contêiner (o launcher e o servidor continuam aqui dentro)
    sed -n 's/^[WE]: \(Failed to fetch [^ ]*\).*/    \1/p' /tmp/apt-update.log | head -1
    echo "  aviso: sem acesso ao repositório da distribuição; modo sem apt"
    touch /etc/giz-teste-sem-apt
    command -v python3 >/dev/null 2>&1 || falha "o modo sem apt precisa de uma imagem que já traga o python3"
    echo "  python3 que já vem na imagem: pacote $(dpkg -S "$(readlink -f "$(command -v python3)")" 2>/dev/null | cut -d: -f1), $(python3 --version)"
  fi
  id prof >/dev/null 2>&1 || useradd -m -s /bin/bash prof
  CHROME=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome | head -1)
  [ -x "$CHROME" ] || falha "não achei o Chromium do Playwright em /opt/pw-browsers"
  if [ -f /etc/giz-teste-sem-apt ]; then
    # o "chromium" que o server.py acha no PATH só anota a chamada; quem abre o endereço é o Chromium de fora
    printf '%s\n' '#!/bin/sh' 'echo "$(date +%T) chromium $*" >> /tmp/chromium-chamadas.log' > /usr/local/bin/chromium
    chmod 755 /usr/local/bin/chromium
    echo "  navegador de teste: o Chromium de fora do contêiner abre o endereço que o server.py passar ao chromium"
    exit 0
  fi
  # o "chromium" que o server.py acha no PATH: o Chromium de verdade, mas sem janela e com porta de depuração
  cat > /usr/local/bin/chromium <<FIM
#!/bin/sh
echo "\$(date +%T) chromium \$*" >> /tmp/chromium-chamadas.log
exec "$CHROME" --headless=new --no-sandbox --disable-gpu --remote-debugging-port=9333 \\
  --user-data-dir=/tmp/perfil-chromium-\$(id -u) "\$@" >> /tmp/chromium.log 2>&1
FIM
  chmod 755 /usr/local/bin/chromium
  echo "  navegador de teste: $("$CHROME" --version 2>/dev/null)"
  ;;

instalar)
  if [ "$MODO" = deb ]; then
    DEB=$(ls /pacotes/giz-livre_*_all.deb | head -1)
    cp "$DEB" /tmp/ && chmod 644 "/tmp/$(basename "$DEB")"
    if [ -f /etc/giz-teste-sem-apt ]; then
      echo "  dpkg -i $(basename "$DEB") (modo sem apt)"
      dpkg -i "/tmp/$(basename "$DEB")" 2>&1 | sed 's/^/    /'
    else
      echo "  apt-get install ./$(basename "$DEB")"
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "/tmp/$(basename "$DEB")" 2>&1 |
        grep -E "^(Setting up|Configurando|Preparing|Unpacking) " | sed 's/^/    /'
    fi
    dpkg -s giz-livre | grep -E "^(Status|Version|Depends):" | sed 's/^/    /'
    command -v python3 >/dev/null || falha "python3 não veio com o pacote"
    if [ -f /etc/giz-teste-sem-apt ]; then ok "o dpkg aceitou a dependência com o python3 da imagem: $(python3 --version)"
    else ok "python3 veio pela dependência: $(python3 --version)"; fi
    [ -x /usr/bin/giz-livre ] && ok "launcher em /usr/bin/giz-livre" || falha "falta /usr/bin/giz-livre"
    [ -f /opt/giz-livre/server.py ] && ok "programa em /opt/giz-livre" || falha "falta /opt/giz-livre/server.py"
  else
    TAR=$(ls /pacotes/giz-livre-*-linux-usuario.tar.gz | head -1)
    cp "$TAR" "$PROF/" && chown prof: "$PROF/$(basename "$TAR")"
    como_prof "tar xzf $(basename "$TAR") && rm $(basename "$TAR")"
    PASTA=$(basename "$TAR" .tar.gz)
    echo "  ./instalar.sh (conta prof, sem sudo)"
    como_prof "cd $PASTA && ./instalar.sh" | sed 's/^/    /'
    rm -rf "${PROF:?}/$PASTA"
    [ -x "$PROF/.local/bin/giz-livre" ] && ok "launcher em ~/.local/bin/giz-livre" || falha "falta o launcher"
    [ -f "$PROF/.local/lib/giz-livre/server.py" ] && ok "programa em ~/.local/lib/giz-livre" || falha "falta o programa"
    [ -z "$(find / -xdev -path /proc -prune -o -path /home -prune -o -path /tmp -prune -o -path /pacotes -prune -o \
         -path /teste -prune -o -name '*giz-livre*' -newer /etc/hostname -print 2>/dev/null)" ] &&
      ok "nada gravado fora da pasta pessoal" || echo "  aviso: há arquivos giz-livre fora da pasta pessoal"
  fi
  ;;

validar)
  D=$(desktop_do_modo)
  [ -f "$D" ] || falha "falta $D"
  if ! command -v desktop-file-validate >/dev/null 2>&1; then
    cp "$D" /tmp/validar.desktop && chmod 644 /tmp/validar.desktop
    echo "  aviso: sem desktop-file-validate aqui; o testar-pacotes.sh valida uma cópia fora do contêiner"
  elif desktop-file-validate "$D"; then ok "desktop-file-validate $D: sem erro nem aviso"
  else falha "desktop-file-validate apontou problema em $D"; fi
  grep -E "^(Name|Exec|Icon|Categories)=" "$D" | sed 's/^/    /'
  I=$(icone_do_modo)
  [ -f "$I" ] || falha "falta o ícone $I"
  ok "ícone em $I ($(python3 -c "import struct,sys;d=open(sys.argv[1],'rb').read(24);print('PNG %dx%d'%struct.unpack('>II',d[16:24]) if d[:8]==b'\x89PNG\r\n\x1a\n' else 'não é PNG')" "$I"))"
  ;;

abrir)
  # abre como o menu abriria: o comando da linha Exec do atalho, na conta prof, sem terminal
  D=$(desktop_do_modo)
  EXEC=$(sed -n 's/^Exec=//p' "$D" | sed 's/^"\(.*\)"$/\1/')
  rm -f /tmp/chromium-chamadas.log /tmp/chromium.log
  echo "  Exec do atalho: $EXEC"
  su prof -s /bin/sh -c "cd $PROF && exec setsid $EXEC > /tmp/giz-launcher.log 2>&1 < /dev/null" &
  CON=$DADOS/quadros/.agente/conexao.json
  for _ in $(seq 1 100); do [ -f "$CON" ] && break; sleep 0.2; done
  [ -f "$CON" ] || { cat /tmp/giz-launcher.log; falha "o servidor não subiu (sem $CON)"; }
  PID=$(sed -n 's/.*"pid": *\([0-9]*\).*/\1/p' "$CON")
  ok "servidor no ar: $(sed 's/"token": *"[^"]*"/"token": "…"/' "$CON")"
  echo "    processo: $(ps -o user=,args= -p "$PID")"
  for _ in $(seq 1 50); do [ -s /tmp/chromium-chamadas.log ] && break; sleep 0.2; done
  [ -s /tmp/chromium-chamadas.log ] && ok "o server.py chamou o Chromium: $(sed 's/k=[^ ]*/k=…/' /tmp/chromium-chamadas.log | cut -d' ' -f2-)" ||
    falha "o navegador não foi chamado"
  ;;

esperar-fim)
  # depois que a página fecha, o servidor se encerra sozinho (ESPERA_FECHAR = 10 s no server.py)
  for _ in $(seq 1 60); do pgrep -u prof -f "server.py --dados" >/dev/null || break; sleep 1; done
  if pgrep -u prof -f "server.py --dados" >/dev/null; then
    echo "  aviso: o servidor não se encerrou sozinho em 60 s; encerrando"
    pkill -u prof -f "server.py --dados" || true
    sleep 2
    pkill -9 -u prof -f "server.py --dados" || true
    rm -f "$DADOS/quadros/.agente/conexao.json"
    sleep 1
  else
    ok "a janela fechou e o servidor se encerrou sozinho"
  fi
  [ -f "$DADOS/quadros/.agente/conexao.json" ] && echo "  aviso: conexao.json ficou" || ok "arquivo de conexão apagado na saída"
  pkill -u prof chrome 2>/dev/null || true
  sleep 1
  ;;

conferir-quadro)
  ARQ=$DADOS/quadros/$ARG.json
  [ -f "$ARQ" ] || falha "o quadro $ARG não está em $DADOS/quadros"
  ok "quadro salvo no disco: ${ARQ#$PROF/} ($(stat -c '%s bytes, permissão %a, dono %U' "$ARQ"))"
  python3 - "$ARQ" "$MODO" <<'EOF'
import json, sys
d = json.load(open(sys.argv[1], encoding="utf-8"))
itens = d.get("items") or [i for p in d.get("pages", []) for i in p.get("items", [])]
txt = [i.get("text") for i in itens if i.get("type") == "text"]
tr = sum(1 for i in itens if i.get("type") == "stroke")
print(f"    conteúdo: {tr} traço(s), texto(s): {txt}")
sys.exit(0 if tr and txt else 1)
EOF
  ok "o quadro no disco tem o traço e o texto"
  ;;

foto)
  # lista de arquivos da pasta pessoal da conta prof (para comparar antes e depois)
  find "$PROF" -mindepth 1 | sort > "/tmp/foto-$ARG.txt"
  ;;

desinstalar)
  if [ "$MODO" = deb ] && [ -f /etc/giz-teste-sem-apt ]; then
    echo "  dpkg -r giz-livre (saída completa, modo sem apt):"
    dpkg -r giz-livre 2>&1 | sed 's/^/    /'
    echo "  dpkg -P giz-livre:"
    dpkg -P giz-livre 2>&1 | sed 's/^/    /'
  elif [ "$MODO" = deb ]; then
    echo "  apt-get remove giz-livre (saída completa):"
    DEBIAN_FRONTEND=noninteractive apt-get remove -y giz-livre 2>&1 | grep -v '^(Reading database' | sed 's/^/    /'
    echo "  apt-get purge giz-livre:"
    DEBIAN_FRONTEND=noninteractive apt-get purge -y giz-livre 2>&1 | grep -iE "giz|quadros|Purging|Removendo" | sed 's/^/    /'
  else
    echo "  sh ~/.local/lib/giz-livre/desinstalar.sh (conta prof):"
    como_prof "sh .local/lib/giz-livre/desinstalar.sh" | sed 's/^/    /'
  fi
  ;;

conferir-limpo)
  if [ "$MODO" = deb ]; then
    dpkg -s giz-livre >/dev/null 2>&1 && falha "o pacote continua instalado"
    ok "o pacote saiu (dpkg -s não acha giz-livre)"
    SOBRA=$(find / -xdev \( -path /proc -o -path /sys -o -path /home -o -path /tmp -o -path /pacotes -o -path /teste \) -prune \
            -o -iname '*giz*livre*' -print 2>/dev/null)
    [ -z "$SOBRA" ] && ok "nenhum arquivo giz-livre sobrou fora da pasta pessoal (nem /opt/giz-livre, /usr/bin, atalho, ícone)" ||
      falha "sobrou: $SOBRA"
  else
    find "$PROF" -mindepth 1 | sort > /tmp/foto-depois.txt
    SOBRA=$(comm -13 /tmp/foto-antes.txt /tmp/foto-depois.txt | grep -v "^$DADOS" || true)
    [ -z "$SOBRA" ] && ok "fora de ~/.local/share/giz-livre, a pasta pessoal voltou a ser como era antes de instalar" ||
      falha "sobrou na pasta pessoal: $SOBRA"
    for f in .local/bin/giz-livre .local/lib/giz-livre .local/share/applications/giz-livre.desktop \
             .local/share/icons/hicolor/128x128/apps/giz-livre.png; do
      [ -e "$PROF/$f" ] && falha "sobrou ~/$f"
    done
    ok "launcher, programa, atalho e ícone apagados"
  fi
  N=$(find "$DADOS/quadros" -maxdepth 1 -name '*.json' | wc -l)
  [ "$N" -gt 0 ] && ok "os quadros ficaram: $N em ~/.local/share/giz-livre/quadros: $(cd "$DADOS/quadros" && ls -- *.json | tr '\n' ' ')" ||
    falha "os quadros sumiram"
  ;;

*) echo "passo desconhecido: $PASSO" >&2; exit 2 ;;
esac
