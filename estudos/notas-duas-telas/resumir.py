# Resume as linhas "RELATO <origem> <json>" que o protótipo imprime (uma execução por arquivo).
#   python3 resumir.py saida.txt [mais.txt ...]
import json
import sys


def tela(m):
    return f"{m['largura']}x{m['altura']}+{m['x']}+{m['y']}" if m else "-"


for arq in sys.argv[1:]:
    relatos = []
    for linha in open(arq, encoding="utf-8", errors="replace"):
        if linha.startswith("RELATO "):
            _, origem, dados = linha.rstrip("\n").split(" ", 2)
            relatos.append((origem, json.loads(dados)))
    if not relatos:
        continue
    print(f"== {arq.rsplit('/', 1)[-1]}")
    paginas = {}
    for origem, d in relatos:
        if origem == "rust" and "monitores" in d:
            print(f"  sessão: {d.get('XDG_SESSION_TYPE')} DISPLAY={d.get('DISPLAY')} WAYLAND={d.get('WAYLAND_DISPLAY')} modo={d['modo']}"
                  f" tela cheia pedida={d['tela_cheia_pedida']}")
            print(f"  monitores (Tauri): {[tela(m) + ' ' + str(m['nome']) for m in d['monitores']]}; principal: {tela(d['principal'])}")
        elif origem == "rust" and "on_new_window" in d:
            print(f"  on_new_window chamado: {d['on_new_window']} (n={d['n']})")
        elif origem == "rust":
            print(f"  rust: {d}")
        elif origem.startswith("pagina:"):
            paginas[origem[7:]] = d   # fica o último relato de cada janela
        elif origem.startswith("rust:") and d.get("medida") == 2:
            j = d["janela"]
            print(f"  janela {origem[5:]}: posição {j['posicao']} tamanho {j['tamanho']} tela atual {tela(j['tela_atual'])}"
                  f" tela cheia {j['tela_cheia']}")
    for papel, d in paginas.items():
        s = d["screen"]
        print(f"  página {papel}: isExtended {'existe' if s['temIsExtended'] else 'NÃO existe'} ({s.get('isExtended')});"
              f" getScreenDetails {'existe' if s['temGetScreenDetails'] else 'não existe'}; screen {s['width']}x{s['height']};"
              f" screenX/Y {s['screenX']},{s['screenY']}; janela {s['innerWidth']}x{s['innerHeight']}")
        c = d["canal"]
        print(f"    BroadcastChannel {'existe' if c['temBroadcastChannel'] else 'não existe'}: recebidas {c['recebidos']}"
              f" (primeira: {c['primeiro']}); evento storage recebido {d['storage']['recebidos']} vez(es)")
        if "windowOpen" in d:
            print(f"    window.open: {d['windowOpen']}")
        if "opener" in d:
            print(f"    window.opener: {d['opener']}")
        if d.get("semInvoke"):
            print(f"    sem invoke: {d['semInvoke']}")
    if not paginas:
        print("  nenhuma página relatou")
