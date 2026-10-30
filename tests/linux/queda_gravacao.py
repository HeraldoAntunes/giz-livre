# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Validação no Linux: queda brusca do servidor no meio de uma gravação (a versão Linux do tests/bateria/c2, sem
# navegador). Um quadro grande e fictício é gravado sem parar; no meio, o servidor leva SIGKILL, como num corte de
# energia. Depois de cada queda o arquivo do quadro tem de continuar legível e ter, no mínimo, a última gravação que o
# servidor confirmou. 20 rodadas, numa pasta temporária.
#   python3 tests/linux/queda_gravacao.py
import json, os, random, signal, socket, subprocess, sys, tempfile, threading, time, urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
RODADAS = 20
ID = "quedalinux1"


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def quadro(n):   # ~4 MB de traços fictícios; o texto diz qual gravação é
    tracos = [{"id": f"t{i}", "type": "stroke", "tool": "pen", "color": "#000000", "width": 3,
               "pts": [x for k in range(60) for x in (i + k, (i * 7 + k) % 900, 0.5)]} for i in range(1500)]
    return {"version": 2, "title": "Queda brusca (fictício)", "background": {"color": "#ffffff", "pattern": "none"},
            "items": [{"id": "n", "type": "text", "x": 0, "y": 0, "w": 300, "text": f"gravação {n}", "color": "#000", "size": 28},
                      *tracos]}


tmp = Path(tempfile.mkdtemp(prefix="giz-queda-"))
dados = tmp / "quadros"
amb = dict(os.environ, GIZ_SEM_DIARIO="1")
falhas = 0
for rodada in range(1, RODADAS + 1):
    porta = porta_livre()
    base = f"http://127.0.0.1:{porta}"
    p = subprocess.Popen([sys.executable, str(RAIZ / "server.py"), "--sem-janela", "--sem-auto-encerrar",
                          "--porta", str(porta), "--dados", str(dados)], env=amb,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    token = None
    for _ in range(100):
        try:
            token = json.load(urllib.request.urlopen(base + "/api/info", timeout=1))["token"]
            break
        except OSError:
            time.sleep(0.1)
    if not token:
        print(f"rodada {rodada}: o servidor não abriu"); falhas += 1; p.kill(); continue
    confirmada = {"n": None}
    parar = threading.Event()

    def gravar():
        n = rodada * 1000
        rev = None
        while not parar.is_set():
            n += 1
            try:
                if rev is None:
                    try:
                        rev = json.load(urllib.request.urlopen(f"{base}/api/boards/{ID}", timeout=5)).get("_rev", 0)
                    except OSError:
                        rev = 0
                corpo = json.dumps({"board": quadro(n), "revision": rev}).encode()
                req = urllib.request.Request(f"{base}/api/boards/{ID}", data=corpo, method="PUT",
                                             headers={"X-Lousa": token, "Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=10) as r:
                    rev = json.load(r).get("revision", rev)
                confirmada["n"] = n
            except Exception:
                return

    t = threading.Thread(target=gravar, daemon=True)
    t.start()
    time.sleep(random.uniform(0.6, 2.5))
    os.kill(p.pid, signal.SIGKILL)     # corte de energia: sem chance de terminar a gravação
    p.wait()
    parar.set(); t.join(5)
    arq = dados / f"{ID}.json"
    try:
        texto = json.loads(arq.read_text(encoding="utf-8"))["items"][0]["text"]
        gravada = int(texto.split()[-1])
        ok = confirmada["n"] is None or gravada >= confirmada["n"]
        detalhe = f"no disco: gravação {gravada}; última confirmada: {confirmada['n']}"
    except (OSError, ValueError, KeyError, IndexError) as e:
        ok, detalhe = False, f"arquivo ilegível: {type(e).__name__}: {e}"
    tmps = sorted(x.name for x in dados.glob("*.tmp"))
    print(f"rodada {rodada:2}: {'ok' if ok else 'FALHOU'}  {detalhe}; temporários sobrando: {len(tmps)}")
    falhas += not ok

print(f"\n{RODADAS - falhas} rodadas passaram, {falhas} falharam (pasta: {tmp})")
sys.exit(1 if falhas else 0)
