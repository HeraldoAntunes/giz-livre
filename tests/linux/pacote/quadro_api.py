# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
"""Ajudante do testar-atualizacao.sh, roda dentro do contêiner (só a biblioteca padrão; python3 -I).

Fala com o Giz Livre aberto pela conta, pelo código do arquivo de conexão (como o Giz na Tela e o MCP fazem):
  info                     versão do programa no ar
  criar <id> <texto>       grava um quadro com um traço e um texto pela API (como a página grava)
  conferir <id> <texto>    o quadro aparece na lista da galeria e abre com o traço e o texto
  sair                     pede para o programa se encerrar
Saída 0 se deu certo.
"""
import json
import sys
import urllib.request
from pathlib import Path

CON = Path.home() / ".local/share/giz-livre/quadros/.agente/conexao.json"


def pedido(rota, metodo="GET", corpo=None):
    c = json.loads(CON.read_text(encoding="utf-8"))
    dados = json.dumps(corpo).encode("utf-8") if corpo is not None else None
    req = urllib.request.Request(f"http://127.0.0.1:{c['porta']}{rota}", data=dados, method=metodo,
                                 headers={"X-Lousa": c["token"], "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode("utf-8") or "{}")


def main():
    acao = sys.argv[1]
    if acao == "info":
        print(pedido("/api/info")["versao"])
    elif acao == "criar":
        bid, texto = sys.argv[2], sys.argv[3]
        board = {"version": 2, "title": "Quadro da " + texto, "background": {"color": "#ffffff", "pattern": "none"},
                 "view": None, "items": [
                     {"id": "t1", "type": "stroke", "pts": [100, 100, 0.5, 200, 160, 0.5, 300, 100, 0.5], "width": 3,
                      "color": "#000000"},
                     {"id": "x1", "type": "text", "x": 120, "y": 240, "text": texto, "size": 32, "color": "#000000"}]}
        r = pedido(f"/api/boards/{bid}", "PUT", {"board": board, "revision": 0, "criar": True})
        print("gravado:", json.dumps(r, ensure_ascii=False))
    elif acao == "conferir":
        bid, texto = sys.argv[2], sys.argv[3]
        lista = pedido("/api/boards")
        ids = [q.get("id") for q in (lista if isinstance(lista, list) else lista.get("quadros", lista.get("boards", [])))]
        if bid not in ids:
            print("o quadro não está na lista da galeria:", ids)
            return 1
        b = pedido(f"/api/boards/{bid}")
        b = b.get("board", b)
        itens = b.get("items", [])
        tr = sum(1 for i in itens if i.get("type") == "stroke")
        tx = [i.get("text") for i in itens if i.get("type") == "text"]
        print(f"na galeria e abre: título {b.get('title')!r}, {tr} traço(s), textos {tx}")
        return 0 if tr and texto in tx else 1
    elif acao == "sair":
        try:
            pedido("/api/sair", "POST", {})
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
