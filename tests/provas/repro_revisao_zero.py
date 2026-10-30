# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Reprodução determinística (sem concorrência) do defeito achado pelo tests/provas/concorrencia_lixeira.py: um quadro
# que está no disco com "_rev": 0 é sobrescrito por um PUT de criação (revisão 0) no mesmo id, sem 412 e sem ir para a
# lixeira. Os quadros trazidos por pacote ("Levar quadros") são gravados com _rev 0; um desses, excluído e restaurado,
# volta com _rev 0. Dados fictícios numa pasta temporária; o server.py roda como processo separado.
#   python tests/provas/repro_revisao_zero.py
import io, json, os, socket, subprocess, sys, tempfile, time, urllib.error, urllib.request, zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]


def main():
    tmp = Path(tempfile.mkdtemp(prefix="giz-repro-rev0-"))
    dados = tmp / "quadros"
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0)); porta = s.getsockname()[1]
    base = f"http://127.0.0.1:{porta}"
    srv = subprocess.Popen([sys.executable, str(RAIZ / "server.py"), "--sem-janela", "--sem-auto-encerrar",
                            "--porta", str(porta), "--dados", str(dados)],
                           env=dict(os.environ, GIZ_SEM_DIARIO="1"), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(100):
            try:
                token = json.loads((dados / ".agente" / "conexao.json").read_text(encoding="utf-8"))["token"]
                urllib.request.urlopen(base + "/api/info", timeout=1).read()
                break
            except (OSError, ValueError):
                time.sleep(.1)

        def pedir(metodo, rota, corpo=None, tipo="application/json"):
            dadoss = corpo if isinstance(corpo, (bytes, type(None))) else json.dumps(corpo).encode()
            req = urllib.request.Request(base + rota, data=dadoss, method=metodo, headers={"X-Lousa": token, "Content-Type": tipo})
            try:
                with urllib.request.urlopen(req, timeout=10) as r:
                    return r.status, json.loads(r.read() or b"{}")
            except urllib.error.HTTPError as e:
                return e.code, json.loads(e.read() or b"{}")

        def quadro(texto):
            return {"title": texto, "items": [{"id": "t", "type": "text", "x": 0, "y": 0, "w": 300, "text": texto}]}

        def texto_no_disco(bid):
            return json.loads((dados / f"{bid}.json").read_text(encoding="utf-8"))["items"][0]["text"]

        falhou = 0
        # caso A: quadro trazido por pacote
        z = io.BytesIO()
        with zipfile.ZipFile(z, "w") as f:
            f.writestr("manifesto.json", json.dumps({"formato": 1}))
            f.writestr("quadros/trazido1.json", json.dumps(quadro("aula importada (não pode sumir)")))
        print("A1. POST /api/pacote com o quadro trazido1:", pedir("POST", "/api/pacote", z.getvalue(), "application/zip"))
        print('    no disco: "_rev" =', json.loads((dados / "trazido1.json").read_text())["_rev"],
              '| texto =', texto_no_disco("trazido1"))
        print("A2. PUT /api/boards/trazido1 com revision 0 e outro conteúdo:",
              pedir("PUT", "/api/boards/trazido1", {"board": quadro("outro quadro"), "revision": 0}))
        print("    no disco: texto =", texto_no_disco("trazido1"), "| na lixeira:", sorted(p.name for p in (dados / "lixeira").glob("*.json")))
        if texto_no_disco("trazido1") != "aula importada (não pode sumir)":
            print("    => DEFEITO: o quadro importado foi sobrescrito e não está em lugar nenhum"); falhou += 1

        # caso B: o mesmo, depois de excluir e restaurar (a lixeira devolve o arquivo com _rev 0)
        z = io.BytesIO()
        with zipfile.ZipFile(z, "w") as f:
            f.writestr("manifesto.json", json.dumps({"formato": 1}))
            f.writestr("quadros/trazido2.json", json.dumps(quadro("aula restaurada (não pode sumir)")))
        pedir("POST", "/api/pacote", z.getvalue(), "application/zip")
        st, j = pedir("DELETE", "/api/boards/trazido2")
        print("B1. trazido2 importado e excluído:", st, j)
        print("B2. restaurado:", pedir("POST", "/api/lixeira/restaurar", {"nome": j["lixeira"]}))
        print("B3. PUT revision 0 no mesmo id:", pedir("PUT", "/api/boards/trazido2", {"board": quadro("outro quadro"), "revision": 0}))
        print("    no disco: texto =", texto_no_disco("trazido2"))
        if texto_no_disco("trazido2") != "aula restaurada (não pode sumir)":
            print("    => DEFEITO: o quadro restaurado foi sobrescrito"); falhou += 1

        # controle: quadro criado pela página (_rev 1) recusa o mesmo PUT com 412
        pedir("PUT", "/api/boards/criado1", {"board": quadro("criado pela página"), "revision": 0})
        print("C.  controle, quadro com _rev 1 e PUT revision 0:",
              pedir("PUT", "/api/boards/criado1", {"board": quadro("outro quadro"), "revision": 0})[0], "(412 esperado)")
        print("\nRESULTADO:", "defeito reproduzido" if falhou else "não reproduzido")
        return 1 if falhou else 0
    finally:
        srv.kill()


if __name__ == "__main__":
    sys.exit(main())
