#!/bin/sh
# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Atualização do pacote Linux com quadros do professor: instala o pacote antigo (dist/linux-<antiga>/), cria um quadro
# no programa antigo, atualiza para o novo (dist/linux/) por cima e confere que o quadro continua no disco, byte a
# byte, e que o programa novo o mostra na galeria e o abre. Depois desinstala e confere que os quadros ficaram.
# Faz isso com o .deb (apt install por cima; dpkg -i se não houver apt) e com o .tar.gz (instalar.sh por cima).
#
# Rodar da raiz do repositório:  sh tests/linux/pacote/testar-atualizacao.sh [imagem ...]
#   ANTIGO=pasta  pacotes da versão de antes (padrão: dist/linux-1.16.3)
# (padrão: mirror.gcr.io/library/ubuntu:24.04 e mirror.gcr.io/library/buildpack-deps:bookworm, o Debian 12)
set -u
RAIZ=$(cd "$(dirname "$0")/../../.." && pwd)
cd "$RAIZ"
ANTIGO=${ANTIGO:-dist/linux-1.16.3}
[ $# -gt 0 ] || set -- mirror.gcr.io/library/ubuntu:24.04 mirror.gcr.io/library/buildpack-deps:bookworm
for d in "$ANTIGO" dist/linux; do
  ls "$d"/giz-livre_*_all.deb "$d"/giz-livre-*-linux-usuario.tar.gz >/dev/null || { echo "faltam pacotes em $d" >&2; exit 1; }
done
NOME=giz-livre-teste-atualizacao
trap 'docker rm -f "$NOME" >/dev/null 2>&1' EXIT
RESUMO=""
TOTAL=0
ok() { echo "  ✓ $1"; }
nao() { echo "  ✗ $1"; falhas=$((falhas + 1)); }
root() { docker exec "$NOME" sh -c "$1"; }
prof() { docker exec -u prof -w /home/prof -e HOME=/home/prof "$NOME" sh -c "$1"; }
api() { prof "python3 -I /teste/quadro_api.py $1"; }
QDIR=/home/prof/.local/share/giz-livre/quadros

abrir() {   # abrir <comando do launcher>: sobe o programa na conta prof, sem janela, e espera o arquivo de conexão
  docker exec -d -u prof -w /home/prof -e HOME=/home/prof "$NOME" sh -c "exec $1 --sem-janela --sem-auto-encerrar > /tmp/giz.log 2>&1"
  for _ in $(seq 1 100); do root "test -f $QDIR/.agente/conexao.json" && return 0; sleep 0.2; done
  root 'cat /tmp/giz.log'; return 1
}
fechar() {
  api sair >/dev/null
  for _ in $(seq 1 50); do root "test -f $QDIR/.agente/conexao.json" || return 0; sleep 0.2; done
  return 1
}
impressoes() { root "cd $QDIR && sha256sum *.json"; }

for IMG in "$@"; do
  for MODO in deb usuario; do
    echo
    echo "================ $IMG, $MODO: $(basename "$ANTIGO" | sed 's/linux-//') -> nova ================"
    falhas=0
    docker rm -f "$NOME" >/dev/null 2>&1
    docker run -d --name "$NOME" --network host -v "$RAIZ/$ANTIGO:/antigo:ro" -v "$RAIZ/dist/linux:/novo:ro" \
      -v "$RAIZ/tests/linux/pacote:/teste:ro" "$IMG" sleep infinity >/dev/null
    if [ -f /root/.ccr/ca-bundle.crt ]; then
      docker cp /root/.ccr/ca-bundle.crt "$NOME":/ca-proxy.crt
      root 'echo "Acquire::https::CAInfo \"/ca-proxy.crt\";" > /etc/apt/apt.conf.d/99ca-proxy'
    fi
    echo "  sistema: $(root '. /etc/os-release; echo $PRETTY_NAME')"
    APT=0
    root 'apt-get update -qq >/tmp/apt.log 2>&1 && ! grep -q "^[WE]:" /tmp/apt.log' && APT=1
    root 'id prof >/dev/null 2>&1 || useradd -m prof'
    # o .tar.gz usa o python3 do sistema e não instala nada: no modo por conta, ele tem de estar lá antes
    if [ "$MODO" = usuario ] && [ "$APT" = 1 ]; then
      root 'command -v python3 >/dev/null || DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends python3 >/dev/null 2>&1'
    fi

    instalar() {   # instalar antigo|novo
      if [ "$MODO" = deb ]; then
        root "cp /$1/giz-livre_*_all.deb /tmp/$1.deb && chmod 644 /tmp/$1.deb"
        if [ "$APT" = 1 ]; then
          root "DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends /tmp/$1.deb >/tmp/inst.log 2>&1" ||
            { root 'tail -5 /tmp/inst.log'; return 1; }
        else
          root "dpkg -i /tmp/$1.deb >/tmp/inst.log 2>&1" || { root 'tail -5 /tmp/inst.log'; return 1; }
        fi
        echo "    $(root "dpkg-query -W -f='\${Package} \${Version} (\${Status})' giz-livre")"
      else
        prof "rm -rf pac && mkdir pac && tar xzf /$1/giz-livre-*-linux-usuario.tar.gz -C pac && cd pac/giz-livre-* && ./instalar.sh >/tmp/inst.log 2>&1" ||
          { root 'tail -5 /tmp/inst.log'; return 1; }
        prof 'rm -rf pac'
        echo "    $(prof "sed -n 's/^VERSAO = \"\(.*\)\"$/programa \1 em ~\/.local\/lib\/giz-livre/p' .local/lib/giz-livre/server.py")"
      fi
    }
    if [ "$MODO" = deb ]; then LAUNCHER=giz-livre; else LAUNCHER=/home/prof/.local/bin/giz-livre; fi
    [ "$APT" = 1 ] || echo "  (sem acesso ao repositório da distribuição: o .deb entra por dpkg -i, com o python3 da imagem)"

    echo "-- instalar a versão antiga"
    instalar antigo && ok "versão antiga instalada" || nao "não instalou a versão antiga"
    echo "-- criar um quadro na versão antiga"
    if abrir "$LAUNCHER"; then
      V=$(api info); echo "    programa no ar: $V"
      api "criar atualizacao1 'Feito na $V'" | sed 's/^/    /' && ok "quadro criado na $V" || nao "não criou o quadro"
      fechar && ok "programa antigo encerrado" || nao "o programa antigo não se encerrou"
    else
      nao "a versão antiga não abriu"; V=?
    fi
    ANTES=$(impressoes)
    echo "$ANTES" | sed 's/^/    antes:  /'

    echo "-- atualizar para a versão nova, por cima"
    instalar novo && ok "versão nova instalada por cima" || nao "não instalou a versão nova"
    DEPOIS=$(impressoes)
    echo "$DEPOIS" | sed 's/^/    depois: /'
    [ -n "$ANTES" ] && [ "$ANTES" = "$DEPOIS" ] && ok "os arquivos dos quadros estão iguais, byte a byte (SHA-256)" ||
      nao "os arquivos dos quadros mudaram na atualização"
    if abrir "$LAUNCHER"; then
      N=$(api info); echo "    programa no ar: $N"
      [ "$N" != "$V" ] && ok "agora roda a $N" || nao "continua na $V"
      api "conferir atualizacao1 'Feito na $V'" | sed 's/^/    /' && ok "o quadro da $V aparece na galeria da $N e abre com o traço e o texto" ||
        nao "o quadro da $V não abriu na $N"
      fechar || nao "o programa novo não se encerrou"
    else
      nao "a versão nova não abriu"
    fi

    echo "-- desinstalar"
    if [ "$MODO" = deb ]; then
      if [ "$APT" = 1 ]; then root 'DEBIAN_FRONTEND=noninteractive apt-get purge -y -qq giz-livre 2>&1 | grep -i quadros' | sed 's/^/    /'
      else root 'dpkg -P giz-livre 2>&1 | grep -i quadros' | sed 's/^/    /'; fi
      root 'dpkg -s giz-livre >/dev/null 2>&1' && nao "o pacote continua instalado" || ok "pacote removido"
    else
      prof 'sh .local/lib/giz-livre/desinstalar.sh' | grep -i quadros | sed 's/^/    /'
      prof 'test -e .local/lib/giz-livre' && nao "o programa ficou" || ok "programa removido"
    fi
    [ -n "$ANTES" ] && [ "$(impressoes)" = "$ANTES" ] && ok "os quadros continuam em ~/.local/share/giz-livre/quadros, iguais" ||
      nao "os quadros mudaram ou sumiram na desinstalação"
    docker rm -f "$NOME" >/dev/null 2>&1
    if [ "$falhas" = 0 ]; then RESUMO="$RESUMO
  PASSOU  $IMG, $MODO"; else RESUMO="$RESUMO
  FALHOU  $IMG, $MODO ($falhas)"; fi
    TOTAL=$((TOTAL + falhas))
  done
done
echo
echo "================ resumo (atualização) ================"
echo "de:   $(tr '\n' ' ' < "$ANTIGO/SHA256SUMS")"
echo "para: $(tr '\n' ' ' < dist/linux/SHA256SUMS)"
echo "resultado:$RESUMO"
[ "$TOTAL" = 0 ]
