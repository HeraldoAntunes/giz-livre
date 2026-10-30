# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Bateria, C2: queda brusca. O GizLivre.exe (com janela, num perfil de navegador temporário só deste teste) grava um
# quadro grande sem parar; no meio, o navegador da janela e o programa são mortos pelo PID (taskkill /F), como num
# corte de energia. O quadro tem de continuar legível e sem arquivo temporário sobrando. 5 rodadas.
# Só mata processos cujo perfil é a pasta temporária deste teste: o Edge e o Chrome do usuário não são tocados.
#   python tests/bateria/c2_queda_brusca.py [caminho do GizLivre.exe]
import json, os, subprocess, sys, tempfile, threading, time, urllib.request
from pathlib import Path

EXE = sys.argv[1] if len(sys.argv) > 1 else str(Path(__file__).resolve().parents[2] / "build/dist/GizLivre/GizLivre.exe")
PORTA = 8840
tmp = Path(tempfile.mkdtemp(prefix="giz-c2-"))
dados, local = tmp / "quadros", tmp / "local"
dados.mkdir(); local.mkdir()
(tmp / "preferencias.json").write_text('{"lousa.teste": "1"}', encoding="utf-8")   # já tem cópia: abre no perfil próprio
amb = dict(os.environ, LOCALAPPDATA=str(local))


def navegadores_do_teste():
    saida = subprocess.run(["powershell", "-NoProfile", "-Command",
                            "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe' OR Name='chrome.exe'\" | "
                            "ForEach-Object { \"$($_.ProcessId)|$($_.CommandLine)\" }"], capture_output=True, text=True).stdout
    return [int(l.split("|", 1)[0]) for l in saida.splitlines() if "|" in l and str(local) in l.split("|", 1)[1]
            and "--type=" not in l]


falhas = 0
for rodada in range(1, 6):
    cmd = [sys.executable, EXE] if EXE.endswith(".py") else [EXE]   # .py: o código-fonte, para conferir uma correção
    p = subprocess.Popen([*cmd, "--porta", str(PORTA), "--dados", str(dados)], env=amb)
    info = None
    for _ in range(80):
        try:
            info = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{PORTA}/api/info", timeout=1).read()); break
        except Exception:
            time.sleep(0.25)
    time.sleep(3)
    navs = navegadores_do_teste()
    parar = threading.Event()

    def gravar():
        try:
            rev = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{PORTA}/api/boards/c2", timeout=2).read()).get("_rev", 0)
        except Exception:
            rev = 0
        itens = [{"type": "stroke", "id": f"s{i}", "color": "#000", "w": 3, "pts": list(range(600))} for i in range(400)]
        while not parar.is_set():
            corpo = json.dumps({"board": {"title": "C2", "items": itens, "_rev": rev}, "revision": rev}).encode()
            try:
                r = urllib.request.urlopen(urllib.request.Request(f"http://127.0.0.1:{PORTA}/api/boards/c2", data=corpo, method="PUT",
                                           headers={"X-Lousa": info["token"], "Content-Type": "application/json"}), timeout=5)
                rev = json.loads(r.read())["revision"]
            except Exception:
                return

    t = threading.Thread(target=gravar); t.start()
    time.sleep(1.2 + rodada * 0.4)
    for pid in navs:
        subprocess.run(["taskkill", "/PID", str(pid), "/F"], capture_output=True)
    subprocess.run(["taskkill", "/PID", str(p.pid), "/F"], capture_output=True)
    parar.set(); t.join()
    try:
        b = json.loads((dados / "c2.json").read_text(encoding="utf-8"))
        print(f"rodada {rodada}: navegador do teste {navs or 'não estava aberto'} e programa mortos; quadro legível "
              f"(revisão {b['_rev']}, {len(b['items'])} itens)")
    except Exception as e:
        falhas += 1
        print(f"rodada {rodada}: QUADRO ILEGÍVEL: {e}")
    time.sleep(1)
for pid in navegadores_do_teste():
    subprocess.run(["taskkill", "/PID", str(pid), "/F"], capture_output=True)
# a correção apaga as sobras na abertura seguinte (só as com mais de 2 min): abre mais uma vez, com o relógio dos
# temporários atrasado, e confere
for x in dados.glob("*.tmp"):
    os.utime(x, (time.time() - 600, time.time() - 600))
p = subprocess.Popen([*([sys.executable, EXE] if EXE.endswith(".py") else [EXE]), "--sem-janela", "--porta", str(PORTA),
                      "--dados", str(dados)], env=amb)
time.sleep(6)
subprocess.run(["taskkill", "/PID", str(p.pid), "/F"], capture_output=True)
sobras = [x.name for x in dados.iterdir() if x.is_file() and x.suffix not in (".json", ".png")]
print("arquivos temporários sobrando:", sobras or "nenhum")
print("RESULTADO:", "passou" if not falhas and not sobras else "FALHOU")
# a pasta temporária do teste sai no fim (GIZ_MANTER=1 para guardar)
if not os.environ.get("GIZ_MANTER"):
    import shutil
    time.sleep(1)
    shutil.rmtree(tmp, ignore_errors=True)
