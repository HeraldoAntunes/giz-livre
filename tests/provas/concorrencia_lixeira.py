# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Prova independente (GL-RC3-S01, id_publicavel): restaurar da lixeira e publicar quadros ao mesmo tempo, contra um
# server.py de verdade (processo separado, HTTP, dados fictícios numa pasta temporária). Em cada rodada, todos os
# escritores miram o MESMO id ("alvoN") e partem juntos de uma barreira:
#   - K restaurações de K quadros diferentes da lixeira, todos excluídos com esse id;
#   - 2 restaurações repetidas da mesma entrada da lixeira (só uma pode valer);
#   - M criações pela página (PUT revisão 0 no id);
#   - P importações de pacote ("Levar quadros") com um quadro desse id, cada uma com conteúdo próprio;
#   - criações em ids novos, como carga.
# Confere depois: nenhum quadro sobrescrito nem sumido. Cada restauração que respondeu ok tem o arquivo com os MESMOS
# BYTES da lixeira; cada entrada não restaurada continua na lixeira com os mesmos bytes; cada criação que respondeu
# 200 está no disco com os itens enviados; cada pacote está no disco (trazido ou cópia) com os itens enviados; o id só
# tem um dono; nenhum .tmp sobra. Os clientes são threads de vários processos (multiprocessing).
#   python tests/provas/concorrencia_lixeira.py [rodadas] [--sem-pacote]   (padrão: 30 rodadas, com pacote)
import hashlib, io, json, multiprocessing as mp, os, socket, subprocess, sys, tempfile, time, urllib.error, urllib.request, zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
K, M, P, CARGA = 4, 3, 2, 4


def pedir(base, token, metodo, rota, corpo=None, tipo="application/json"):
    dados = corpo if isinstance(corpo, (bytes, type(None))) else json.dumps(corpo).encode()
    req = urllib.request.Request(base + rota, data=dados, method=metodo, headers={"X-Lousa": token, "Content-Type": tipo})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except ValueError:
            return e.code, {}


def quadro(marca):
    return {"version": 2, "title": f"Fictício {marca}", "background": {"color": "#ffffff", "pattern": "none"},
            "items": [{"id": "m", "type": "text", "x": 0, "y": 0, "w": 300, "text": marca, "color": "#000000", "size": 28}]}


def pacote(bid, marca):
    z = io.BytesIO()
    with zipfile.ZipFile(z, "w") as f:
        f.writestr("manifesto.json", json.dumps({"formato": 1, "programa": "Giz Livre"}))
        f.writestr(f"quadros/{bid}.json", json.dumps(quadro(marca)))
    return z.getvalue()


def cliente(args):
    """Roda num processo filho: espera a hora marcada e dispara as suas tarefas em threads, todas juntas."""
    base, token, tarefas, hora = args

    def fazer(t):
        tipo, x = t
        while time.time() < hora:   # largada comum a todos os processos
            pass
        if tipo == "restaurar":
            return t, pedir(base, token, "POST", "/api/lixeira/restaurar", {"nome": x})
        if tipo == "criar":
            bid, marca = x
            return t, pedir(base, token, "PUT", f"/api/boards/{bid}", {"board": quadro(marca), "revision": 0})
        bid, marca = x
        return t, pedir(base, token, "POST", "/api/pacote", pacote(bid, marca), "application/zip")

    with ThreadPoolExecutor(len(tarefas)) as ex:
        return list(ex.map(fazer, tarefas))


def main():
    global P
    nums = [a for a in sys.argv[1:] if a.isdigit()]
    rodadas = int(nums[0]) if nums else 30
    if "--sem-pacote" in sys.argv:   # só restaurar e criar: isola o contrato do id_publicavel
        P = 0
    tmp = Path(tempfile.mkdtemp(prefix="giz-prova-lixeira-"))
    dados = tmp / "quadros"
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0)); porta = s.getsockname()[1]
    base = f"http://127.0.0.1:{porta}"
    srv = subprocess.Popen([sys.executable, str(RAIZ / "server.py"), "--sem-janela", "--sem-auto-encerrar",
                            "--porta", str(porta), "--dados", str(dados)],
                           env=dict(os.environ, GIZ_SEM_DIARIO="1"), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    token = None
    for _ in range(100):
        try:
            token = json.loads((dados / ".agente" / "conexao.json").read_text(encoding="utf-8"))["token"]
            urllib.request.urlopen(base + "/api/info", timeout=1).read()
            break
        except (OSError, ValueError):
            token = None; time.sleep(.1)
    if not token:
        srv.kill(); print("o servidor não abriu"); return 1

    falhas, linhas = [], []
    ctx = mp.get_context("spawn")
    with ctx.Pool(3) as pool:
        for r in range(1, rodadas + 1):
            alvo = f"alvo{r}"
            # K quadros diferentes, todos com o id alvoN, vão para a lixeira (fluxo real: criar e excluir)
            lixo = {}
            for k in range(K):
                st, _ = pedir(base, token, "PUT", f"/api/boards/{alvo}", {"board": quadro(f"lixo-{r}-{k}"), "revision": 0})
                st2, j = pedir(base, token, "DELETE", f"/api/boards/{alvo}")
                if st != 200 or st2 != 200 or not j.get("lixeira"):
                    falhas.append(f"rodada {r}: preparo da lixeira falhou ({st}, {st2}, {j})"); continue
                lixo[j["lixeira"]] = (dados / "lixeira" / f"{j['lixeira']}.json").read_bytes()
            tarefas = [("restaurar", n) for n in lixo]
            repetida = next(iter(lixo))
            tarefas += [("restaurar", repetida)]                       # a mesma entrada duas vezes
            tarefas += [("criar", (alvo, f"criado-{r}-{m}")) for m in range(M)]
            tarefas += [("pacote", (alvo, f"pacote-{r}-{p}")) for p in range(P)]
            tarefas += [("criar", (f"novo{r}x{c}", f"carga-{r}-{c}")) for c in range(CARGA)]
            grupos = [tarefas[i::3] for i in range(3)]
            hora = time.time() + 1.0
            res = [x for g in pool.map(cliente, [(base, token, g, hora) for g in grupos]) for x in g]

            # ---- conferência pelos bytes ----
            no_disco = {p.stem: p.read_bytes() for p in dados.glob("*.json")}
            erros = []
            restaurados = {}
            for (tipo, x), (st, j) in res:
                if tipo == "restaurar":
                    if st == 200 and j.get("ok"):
                        if x in restaurados:
                            erros.append(f"{x} restaurado duas vezes ({restaurados[x]} e {j['id']})")
                        restaurados[x] = j["id"]
                        if no_disco.get(j["id"]) != lixo[x]:
                            erros.append(f"restaurado {x} -> {j['id']}: bytes diferentes da lixeira")
                elif tipo == "criar":
                    bid, marca = x
                    if st == 200:
                        b = json.loads(no_disco.get(bid, b"{}") or b"{}")
                        if not b or b.get("items") != quadro(marca)["items"]:
                            erros.append(f"criação {marca} em {bid} respondeu 200 mas o disco tem outro conteúdo")
                    elif not (bid == alvo and st == 412):   # 412: o id já tinha dono, a página avisaria o conflito
                        erros.append(f"criação {marca}: resposta {st} {j}")
                else:
                    bid, marca = x
                    if st != 200 or j.get("falhas") or j.get("trazidos", 0) + j.get("copias", 0) != 1:
                        erros.append(f"pacote {marca}: resposta {st} {j}")
            for n, b in lixo.items():
                if n not in restaurados and (dados / "lixeira" / f"{n}.json").read_bytes() != b:
                    erros.append(f"entrada {n} não restaurada e alterada/sumida na lixeira")
            # cada conteúdo publicado aparece exatamente uma vez
            marcas = {}
            for bid, b in no_disco.items():
                for it in json.loads(b).get("items", []):
                    marcas.setdefault(it.get("text"), []).append(bid)
            for (tipo, x), (st, j) in res:
                marca = None
                if tipo == "criar" and st == 200:
                    marca = x[1]
                elif tipo == "pacote" and st == 200:
                    marca = x[1]
                elif tipo == "restaurar" and st == 200:
                    marca = json.loads(lixo[x])["items"][0]["text"]
                if marca and len(marcas.get(marca, [])) != 1:
                    erros.append(f"{marca} aparece {len(marcas.get(marca, []))} vezes no disco")
            if len(restaurados) != len(lixo):
                erros.append(f"só {len(restaurados)} de {len(lixo)} entradas da lixeira voltaram")
            sobras = [p.name for p in dados.rglob("*.tmp")]
            if sobras:
                erros.append(f"temporários sobrando: {sobras}")
            donos = marcas_dono = [m for m, ids in marcas.items() if alvo in ids]
            if len(marcas_dono) != 1:
                erros.append(f"{alvo} tem {len(donos)} conteúdos")
            criados_alvo = sum(1 for (t, x), (st, _) in res if t == "criar" and x[0] == alvo and st == 200)
            linha = (f"rodada {r:2}: {'ok' if not erros else 'FALHOU'}  dono de {alvo}: {marcas_dono[0] if marcas_dono else '-'}; "
                     f"restaurados {len(restaurados)}/{len(lixo)} (renomeados {sum(1 for v in restaurados.values() if v != alvo)}); "
                     f"criações no alvo com 200: {criados_alvo}; quadros no disco: {len(no_disco)}")
            print(linha); linhas.append(linha)
            falhas += [f"rodada {r}: {e}" for e in erros]
            # limpa a galeria para a próxima rodada começar do zero (vai para a lixeira, que é conferida à parte)
            for bid in list(no_disco):
                pedir(base, token, "DELETE", f"/api/boards/{bid}")
    pedir(base, token, "POST", "/api/sair", {})
    try:
        srv.wait(10)
    except subprocess.TimeoutExpired:
        srv.kill()
    print()
    for f in falhas:
        print("  ✗", f)
    print(f"{rodadas - len({f.split(':')[0] for f in falhas})} de {rodadas} rodadas sem perda nem sobrescrita"
          f" (cada rodada: {K} restaurações + 1 repetida, {M} criações e {P} pacotes no mesmo id, {CARGA} criações de carga)")
    print("SHA-256 server.py:", hashlib.sha256((RAIZ / "server.py").read_bytes()).hexdigest())
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
