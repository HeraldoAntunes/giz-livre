# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
"""Regressões HTTP e proteção do exportador, somente com stdlib e dados temporários."""
import http.client
import importlib.util
import json
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
sys.dont_write_bytecode = True


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix="giz-api-")
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        cls.base = f"http://127.0.0.1:{port}"
        cls.proc = subprocess.Popen([sys.executable, str(ROOT / "server.py"), "--sem-janela",
                                     "--porta", str(port), "--dados", cls.temp.name],
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                cls.token = json.load(urllib.request.urlopen(cls.base + "/api/info", timeout=1))["token"]
                return
            except (OSError, ValueError):
                time.sleep(.1)
        cls.proc.terminate(); cls.proc.wait(); cls.temp.cleanup()
        raise RuntimeError("Servidor temporário não abriu")

    @classmethod
    def tearDownClass(cls):
        try:
            cls.request("/api/sair", "POST", {})
            cls.proc.wait(timeout=10)
        finally:
            if cls.proc.poll() is None:
                cls.proc.terminate(); cls.proc.wait()
            cls.temp.cleanup()

    @classmethod
    def request(cls, path, method="GET", data=None, headers=None):
        h = {"X-Lousa": cls.token, "Content-Type": "application/json"}
        if headers: h.update(headers)
        body = json.dumps(data).encode() if data is not None else None
        req = urllib.request.Request(cls.base + path, data=body, method=method, headers=h)
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            with e:
                raw = e.read()
                try: body = json.loads(raw)
                except ValueError: body = raw.decode("utf-8", errors="replace")
                return e.code, body

    def create(self, bid):
        code, data = self.request("/api/boards/" + bid, "PUT", {"board": {"title": "Original", "items": []}})
        self.assertEqual(code, 200)
        self.assertEqual(data["revision"], 1)
        return self.request("/api/boards/" + bid)[1]

    def test_stale_window_cannot_overwrite(self):
        first = self.create("conflict")
        stale = dict(first)
        first["title"] = "Primeira janela"
        self.assertEqual(self.request("/api/boards/conflict", "PUT", {"board": first})[0], 200)
        stale["title"] = "Segunda janela antiga"
        self.assertEqual(self.request("/api/boards/conflict", "PUT", {"board": stale})[0], 412)
        self.assertEqual(self.request("/api/boards/conflict")[1]["title"], "Primeira janela")

    def test_current_revision_can_save_again(self):
        board = self.create("current")
        board["title"] = "Nova edição"
        code, saved = self.request("/api/boards/current", "PUT", {"board": board})
        self.assertEqual((code, saved["revision"]), (200, 2))

    def test_folder_change_prevents_stale_save(self):
        stale = self.create("folder")
        self.assertEqual(self.request("/api/folder/folder", "PUT", {"folder": "Disciplina"})[0], 200)
        self.assertEqual(self.request("/api/boards/folder", "PUT", {"board": stale})[0], 412)
        self.assertEqual(self.request("/api/boards/folder")[1]["folder"], "Disciplina")

    def test_invalid_revision(self):
        for rev in [-1, True, "1", 1.5, None]:
            with self.subTest(rev=rev):
                self.assertEqual(self.request("/api/boards/bad", "PUT", {"board": {"items": []}, "revision": rev})[0], 400)

    def test_missing_revision_cannot_overwrite_new_format(self):
        self.create("legacy-write")
        self.assertEqual(self.request("/api/boards/legacy-write", "PUT", {"board": {"items": []}})[0], 412)

    def test_legacy_file_migrates_on_first_save(self):
        (Path(self.temp.name) / "legacy.json").write_text('{"items":[],"title":"Antigo"}', encoding="utf-8")
        b = self.request("/api/boards/legacy")[1]
        self.assertEqual(self.request("/api/boards/legacy", "PUT", {"board": b})[1]["revision"], 1)

    def test_delete_and_restore(self):
        self.create("trash")
        code, deleted = self.request("/api/boards/trash", "DELETE")
        self.assertEqual(code, 200)
        self.assertEqual(self.request("/api/boards/trash")[0], 404)
        self.assertEqual(self.request("/api/lixeira/restaurar", "POST", {"nome": deleted["lixeira"]})[0], 200)
        self.assertEqual(self.request("/api/boards/trash")[0], 200)

    def test_security_guards(self):
        self.assertEqual(self.request("/api/info", headers={"Host": "externo.invalid"})[0], 403)
        self.assertEqual(self.request("/api/boards/a", "PUT", {"board": {"items": []}}, {"X-Lousa": ""})[0], 409)
        self.assertEqual(self.request("/api/boards/a", "PUT", {"board": {"items": []}}, {"Origin": "https://externo.invalid"})[0], 403)
        self.assertEqual(self.request("/api/boards/..%2Fserver")[0], 400)
        self.assertEqual(self.request("/api/boards/nan", "PUT", {"board": {"items": [], "value": float("nan")}})[0], 400)

    def test_ids_nunca_saem_da_pasta_de_dados(self):
        # ataques de caminho em todas as rotas que montam nome de arquivo com o que vem do pedido
        dados = Path(self.temp.name)
        antes = {p.name for p in dados.iterdir()}
        maus = ["..%2Fserver", "../server", "..%5Cserver", "..\\server", "C:server", "C:%5Cfora", "%2E%2E", "..",
                "nul", "CON", "a/b", "%00x", "x%0A", "a.json"]
        for bid in maus:
            with self.subTest(rota="boards", bid=bid):
                self.assertEqual(self.request("/api/boards/" + bid)[0], 400)
                self.assertEqual(self.request("/api/boards/" + bid, "PUT", {"board": {"items": []}})[0], 400)
                self.assertEqual(self.request("/api/boards/" + bid, "DELETE")[0], 400)
                self.assertEqual(self.request("/api/thumbs/" + bid, "PUT", {"thumb": "data:image/png;base64,AA=="})[0], 400)
                self.assertEqual(self.request("/api/folder/" + bid, "PUT", {"folder": "x"})[0], 400)
        for rota in ["/thumbs/..%2Fserver.png", "/thumbs/nul.png", "/assets/../server.py", "/assets/..%2Fserver.py",
                     "/api/lixeira/..%2Fx_20260101-000000.png", "/../server.py", "/%2E%2E/server.py"]:
            with self.subTest(rota=rota):
                self.assertEqual(self.request(rota)[0], 404)
        # arquivos da página: a biblioteca padrão descarta o pedaço com ".." ou "\" e cai na própria pasta app/
        porta = int(self.base.rsplit(":", 1)[1])
        for rota in ["/..%5Cserver.py", "/js%5C..%5C..%5Cserver.py", "/C:%5Cwindows%5Cwin.ini", "/C:/windows/win.ini"]:
            with self.subTest(rota=rota):
                c = http.client.HTTPConnection("127.0.0.1", porta, timeout=10)
                c.request("GET", rota)
                r = c.getresponse()
                corpo = r.read()
                c.close()
                self.assertIn(r.status, (301, 404))   # 301 = "pasta app/, acrescente a barra"
                self.assertNotIn(b"SimpleHTTPRequestHandler", corpo)
        for nome in ["../x_20260101-000000", "..\\x_20260101-000000", "C:x_20260101-000000", "x_20260101-000000\n",
                     "x_20260101-000000/../../y", 7, None]:
            with self.subTest(restaurar=nome):
                self.assertEqual(self.request("/api/lixeira/restaurar", "POST", {"nome": nome})[0], 400)
        self.assertEqual({p.name for p in dados.iterdir()}, antes)   # nada gravado nem movido
        for fora in ["server.json", "server.png", "fora.json", "y.json"]:   # nem ao lado da pasta de dados
            self.assertFalse((dados.parent / fora).exists(), fora)

    def test_corrupt_existing_file_is_not_overwritten(self):
        path = Path(self.temp.name) / "corrupt.json"
        path.write_text("{incompleto", encoding="utf-8")
        self.assertEqual(self.request("/api/boards/corrupt", "PUT", {"board": {"items": []}})[0], 500)
        self.assertEqual(path.read_text(encoding="utf-8"), "{incompleto")

    def test_many_simultaneous_requests_are_all_answered(self):
        # a galeria carrega um arquivo por disciplina ao mesmo tempo: nenhum pedido pode ser recusado
        spec = importlib.util.spec_from_file_location("servidor_fila", ROOT / "server.py")
        srv = importlib.util.module_from_spec(spec); spec.loader.exec_module(srv)
        self.assertGreaterEqual(srv.Servidor.request_queue_size, 64)
        nomes = sorted(p.name for p in (ROOT / "app/js/especiais").glob("*.js"))
        self.assertGreaterEqual(len(nomes), 20)
        socks = []
        try:
            host, port = self.base.rsplit("/", 1)[1].split(":")
            for nome in nomes * 2:
                s = socket.create_connection((host, int(port)), timeout=10)
                s.sendall(f"GET /js/especiais/{nome} HTTP/1.1\r\nHost: {host}:{port}\r\nConnection: close\r\n\r\n".encode())
                socks.append(s)
            for s in socks:
                linha = s.makefile("rb").readline()
                self.assertIn(b" 200 ", linha)
        finally:
            for s in socks: s.close()


# canal dos agentes de IA (rotas /api/agente/*) e o servidor MCP por stdio, num servidor temporário próprio

    def test_pacote_pede_token_e_vai_e_volta(self):
        status, _ = self.request("/api/boards/levar1", "PUT", {"board": {"title": "Levar", "items": []}, "revision": 0})
        self.assertEqual(status, 200)
        req = urllib.request.Request(self.base + "/api/pacote")
        with self.assertRaises(urllib.error.HTTPError) as e:
            urllib.request.urlopen(req, timeout=10)
        self.assertEqual(e.exception.code, 409)
        req = urllib.request.Request(self.base + "/api/pacote", headers={"X-Lousa": self.token})
        with urllib.request.urlopen(req, timeout=30) as r:
            zipado = r.read()
            total = json.loads(r.headers["X-Pacote-Resumo"])["quadros"]
            self.assertGreaterEqual(total, 1)
        req = urllib.request.Request(self.base + "/api/pacote", data=zipado, method="POST",
                                     headers={"X-Lousa": self.token, "Content-Type": "application/zip"})
        with urllib.request.urlopen(req, timeout=30) as r:
            self.assertEqual(json.loads(r.read())["iguais"], total)   # tudo já existe: nada se repete
        status, info = self.request("/api/info")
        self.assertIn("onedrive", info)


class AgenteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix="giz-agente-")
        cls.dados = Path(cls.temp.name)
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            cls.port = sock.getsockname()[1]
        cls.base = f"http://127.0.0.1:{cls.port}"
        cls.proc = subprocess.Popen([sys.executable, str(ROOT / "server.py"), "--sem-janela",
                                     "--porta", str(cls.port), "--dados", cls.temp.name],
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                cls.token = json.load(urllib.request.urlopen(cls.base + "/api/info", timeout=1))["token"]
                return
            except (OSError, ValueError):
                time.sleep(.1)
        cls.proc.terminate(); cls.proc.wait(); cls.temp.cleanup()
        raise RuntimeError("Servidor temporário não abriu")

    @classmethod
    def tearDownClass(cls):
        try:
            cls.http("/api/sair", "POST", {}, {"X-Lousa": cls.token})
            cls.proc.wait(timeout=10)
        finally:
            if cls.proc.poll() is None:
                cls.proc.terminate(); cls.proc.wait()
            cls.temp.cleanup()

    @classmethod
    def http(cls, path, method="GET", data=None, headers=None):
        h = {"Content-Type": "application/json", **(headers or {})}
        body = json.dumps(data).encode() if data is not None else None
        req = urllib.request.Request(cls.base + path, data=body, method=method, headers=h)
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            with e:
                raw = e.read()
                try: return e.code, json.loads(raw)
                except ValueError: return e.code, raw.decode("utf-8", errors="replace")

    def pagina(self, path, method="GET", data=None, headers=None):
        return self.http(path, method, data, {"X-Lousa": self.token, **(headers or {})})

    def token_agente(self):
        return (self.dados / ".agente" / "token").read_text(encoding="utf-8").strip()

    def agente(self, path, method="GET", data=None, headers=None):
        return self.http("/api/agente/" + path, method, data, {"X-Agente": self.token_agente(), **(headers or {})})

    def ligar(self, nivel=None):
        corpo = {"ligado": True} if nivel is None else {"ligado": True, "nivel": nivel}
        code, r = self.pagina("/api/agentes", "PUT", corpo)
        self.assertEqual(code, 200, r)
        return r

    def desligar(self):
        self.assertEqual(self.pagina("/api/agentes", "PUT", {"ligado": False})[0], 200)

    def ping(self, quadro, janela="janelaTeste"):
        self.assertEqual(self.pagina("/api/ping", "POST", {"janela": janela, "quadro": quadro})[0], 200)

    def novo_quadro(self, **extra):
        code, r = self.agente("quadros", "POST", {"titulo": "Aula do agente", **extra})
        self.assertEqual(code, 200, r)
        return r["quadro"]

    def itens(self, bid, *pedidos):
        return self.agente(f"quadros/{bid}/itens", "POST", {"itens": list(pedidos)})

    def ler_arquivo(self, bid):
        return json.loads((self.dados / f"{bid}.json").read_text(encoding="utf-8"))

    def tearDown(self):
        self.ping(None)
        self.desligar()

    def test_desligado_recusa_tudo(self):
        self.desligar()
        self.assertFalse((self.dados / ".agente" / "token").exists())
        for metodo, rota in [("GET", "estado"), ("GET", "quadros"), ("POST", "quadros"), ("GET", "formas")]:
            with self.subTest(rota=rota):
                code, r = self.http("/api/agente/" + rota, metodo, {} if metodo == "POST" else None, {"X-Agente": "0" * 64})
                self.assertEqual(code, 403)
                self.assertIn("desligados", r["erro"])

    def test_ligar_usa_nivel_2_e_desligar_invalida_o_token(self):
        self.assertEqual(self.ligar()["nivel"], 2)
        antigo = self.token_agente()
        self.assertEqual(self.agente("estado")[1]["nivel"], 2)
        self.desligar()
        self.assertEqual(self.http("/api/agente/estado", headers={"X-Agente": antigo})[0], 403)
        self.ligar()
        self.assertNotEqual(self.token_agente(), antigo)
        self.assertEqual(self.http("/api/agente/estado", headers={"X-Agente": antigo})[0], 401)

    def test_tokens_separados_origem_e_host(self):
        self.ligar()
        self.assertEqual(self.http("/api/agente/estado", headers={"X-Agente": "f" * 64})[0], 401)
        self.assertEqual(self.http("/api/agente/estado")[0], 401)
        # o token da página não vale nas rotas do agente, nem o do agente nas da página
        self.assertEqual(self.agente("estado", headers={"X-Lousa": self.token})[0], 403)
        self.assertEqual(self.http("/api/agente/estado", headers={"X-Lousa": self.token})[0], 403)
        self.assertEqual(self.http("/api/boards", headers={"X-Agente": self.token_agente()})[0], 403)
        self.assertEqual(self.http("/api/boards/x", "PUT", {"board": {"items": []}}, {"X-Agente": self.token_agente()})[0], 403)
        self.assertEqual(self.http("/api/agentes", headers={"X-Agente": self.token_agente()})[0], 403)
        # o painel da página exige o token da página
        self.assertEqual(self.http("/api/agentes")[0], 409)
        self.assertEqual(self.http("/api/agentes", "PUT", {"ligado": True})[0], 409)
        # pedido de navegador (Origin / Sec-Fetch-Site) e Host estranho
        self.assertEqual(self.agente("estado", headers={"Origin": f"http://127.0.0.1:{self.port}"})[0], 403)
        self.assertEqual(self.agente("estado", headers={"Sec-Fetch-Site": "cross-site"})[0], 403)
        self.assertEqual(self.agente("estado", headers={"Host": "externo.invalid"})[0], 403)

    def test_niveis(self):
        self.ligar(1)
        self.assertEqual(self.agente("quadros")[0], 200)
        self.assertEqual(self.agente("formas?busca=bequer")[0], 200)
        self.assertEqual(self.agente("quadros", "POST", {"titulo": "x"})[0], 403)
        self.ligar(2)
        bid = self.novo_quadro()
        self.assertEqual(self.itens(bid, {"tipo": "texto", "texto": "Oi"})[0], 200)
        # quadro do professor: nível 2 recusa, nível 3 aceita
        self.assertEqual(self.pagina("/api/boards/prof", "PUT", {"board": {"title": "Professor", "items": []}})[0], 200)
        code, r = self.itens("prof", {"tipo": "texto", "texto": "Oi"})
        self.assertEqual(code, 403)
        self.assertIn("nível 3", r["erro"])
        self.ligar(3)
        self.assertEqual(self.itens("prof", {"tipo": "texto", "texto": "Oi"})[0], 200)
        self.assertEqual(self.pagina("/api/agentes", "PUT", {"ligado": True, "nivel": 4})[0], 400)   # nível 4 escondido
        (self.dados / ".agente" / "ligado").write_text("4", encoding="ascii")   # gravado por versão anterior
        self.assertEqual(self.agente("estado")[1]["nivel"], 3)

    def test_quadro_completo_e_fluxo_de_caderno(self):
        self.ligar()
        bid = self.novo_quadro(formato="a4", paginas=2, pasta="Química", fundo={"padrao": "lines"})
        b = self.ler_arquivo(bid)
        self.assertEqual((b["layout"]["count"], b["layout"]["w"], b["folder"], b["background"]["pattern"]), (2, 794, "Química", "lines"))
        self.assertEqual((b["criado_por"], b["_rev"]), ("agente", 1))
        code, r = self.itens(bid, {"tipo": "texto", "texto": "Equilíbrio químico", "tamanho": 44, "negrito": True},
                             {"tipo": "texto", "texto": "Constante de equilíbrio\nem função das concentrações"},
                             {"tipo": "latex", "latex": "K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b}"},
                             {"tipo": "forma", "forma": "lb-bequer-anotado", "pagina": 2, "x": 100, "y": 100, "cor": "#0078d4"},
                             {"tipo": "geometria", "forma": "rect", "pagina": 2, "x": 50, "y": 300, "w": 200, "h": 100, "preenchimento": True},
                             {"tipo": "nota", "texto": "Lembrar do Le Chatelier", "pagina": 2},
                             {"tipo": "grafico", "funcao": "x^2 - 4", "pagina": 1, "x_min": -3, "x_max": 3})
        self.assertEqual(code, 200, r)
        self.assertEqual(len(r["itens_criados"]), 7)
        self.assertIn("observacao", r)
        b = self.ler_arquivo(bid)
        it = {i["id"]: i for i in b["items"]}
        t1, t2, fx, forma, ret, nota, graf = (it[i] for i in r["itens_criados"])
        self.assertEqual((t1["x"], t1["y"], t1["w"], t1.get("b")), (48, 48, 794 - 96, True))
        self.assertGreater(t2["y"], t1["y"] + 44)                       # o segundo texto entra abaixo do primeiro
        self.assertGreater(fx["y"], t2["y"] + 2 * 28)
        self.assertEqual((fx["type"], fx["gera"]), ("pendente", "latex"))
        passo = 1123 + 48
        self.assertEqual((forma["type"], forma["lib"], forma["tint"], forma["x"], forma["y"]), ("image", "lb-bequer-anotado", "#0078d4", 100, passo + 100))
        self.assertEqual((ret["x1"], ret["y1"], ret["x2"], ret["y2"], ret["fill"]), (50, passo + 300, 250, passo + 400, "#bfbfbf"))
        self.assertGreater(nota["y"], passo + 400)                      # abaixo do retângulo, na página 2
        self.assertEqual((graf["type"], graf["gera"], graf["funcao"], graf["faixa"]), ("pendente", "plot", "x^2 - 4", [-3, 3]))
        self.assertEqual(b["_rev"], 2)
        # leitura resumida: sem src nem pts, com a página de cada item
        code, q = self.agente(f"quadros/{bid}")
        self.assertEqual(code, 200)
        self.assertEqual(q["paginas"], 2)
        resumo = {i["id"]: i for i in q["itens"]}
        self.assertNotIn("src", resumo[forma["id"]])
        self.assertEqual((resumo[forma["id"]]["imagem"], resumo[forma["id"]]["pagina"]), ("reserva", 2))
        # a lista mostra o quadro e de onde veio
        lista = self.agente("quadros?pasta=Qu%C3%ADmica")[1]["quadros"]
        self.assertEqual([(x["quadro"], x["criado_por"]) for x in lista], [(bid, "agente")])

    def test_adicionar_pagina_no_meio_desloca_o_conteudo(self):
        self.ligar()
        bid = self.novo_quadro(formato="s169", paginas=2)
        _, r = self.itens(bid, {"tipo": "texto", "texto": "Página 2", "pagina": 2, "x": 10, "y": 10})
        code, p = self.agente(f"quadros/{bid}/paginas", "POST", {"quantidade": 2, "depois_de": 1})
        self.assertEqual(code, 200, p)
        self.assertEqual((p["paginas"], p["paginas_novas"]), (4, [2, 3]))
        b = self.ler_arquivo(bid)
        self.assertEqual(b["layout"]["count"], 4)
        self.assertEqual(b["items"][0]["y"], 3 * (720 + 48) + 10)       # foi para a página 4
        self.assertEqual(self.agente(f"quadros/{bid}/paginas", "POST", {"quantidade": 51})[0], 400)
        infinito = self.novo_quadro()
        self.assertEqual(self.agente(f"quadros/{infinito}/paginas", "POST", {})[0], 400)

    def test_item_que_nao_cabe_vai_para_a_pagina_seguinte(self):
        self.ligar()
        bid = self.novo_quadro(formato="a4", paginas=1)
        code, r = self.itens(bid, *[{"tipo": "texto", "texto": f"Linha {n}", "tamanho": 60} for n in range(1, 31)])
        self.assertEqual(code, 200, r)
        self.assertIn("criada agora", r.get("aviso", ""))
        b = self.ler_arquivo(bid)
        L = b["layout"]
        self.assertGreater(L["count"], 1)                       # páginas novas no fim, sem pedir
        passo = L["h"] + L["gap"]
        for it in b["items"]:                                   # nenhum item atravessa o fim da página
            pg = int(it["y"] // passo)
            self.assertLessEqual(it["y"] + it.get("h", 0) - pg * passo, L["h"], it["text"])
        # posição explícita (x e y) não é mexida: só avisa
        code, r = self.itens(bid, {"tipo": "texto", "texto": "fim", "pagina": 1, "x": 48, "y": L["h"] - 10})
        self.assertIn("passou do fim", r.get("aviso", ""))

    def test_quadro_aberto_recusa_gravacao(self):
        self.ligar()
        bid = self.novo_quadro()
        self.ping(bid)
        self.assertEqual(self.agente("estado")[1]["quadros_abertos"], [bid])
        code, r = self.itens(bid, {"tipo": "texto", "texto": "Oi"})
        self.assertEqual(code, 409)
        self.assertIn("aberto no Giz Livre", r["erro"])
        self.assertTrue(self.agente(f"quadros/{bid}")[1]["aberto"])      # ler continua livre
        self.ping(None)
        self.assertEqual(self.itens(bid, {"tipo": "texto", "texto": "Oi"})[0], 200)

    def test_revisao_vale_para_a_janela_antiga(self):
        self.ligar(3)
        self.assertEqual(self.pagina("/api/boards/rev", "PUT", {"board": {"title": "R", "items": []}})[0], 200)
        antigo = self.pagina("/api/boards/rev")[1]
        self.assertEqual(self.itens("rev", {"tipo": "texto", "texto": "do agente"})[0], 200)
        self.assertEqual(self.pagina("/api/boards/rev", "PUT", {"board": antigo})[0], 412)
        self.assertEqual(self.pagina("/api/boards/rev")[1]["items"][0]["text"], "do agente")

    def test_validacao(self):
        self.ligar()
        bid = self.novo_quadro(formato="a4")
        casos = [
            ({"tipo": "texto", "texto": "x", "cor": "vermelho"}, "cor"),
            ({"tipo": "texto", "texto": "x", "pagina": 3}, "página inexistente"),
            ({"tipo": "texto", "texto": "x" * 5001}, "5000"),
            ({"tipo": "texto", "texto": "x", "fonte": "Wingdings"}, "fonte"),
            ({"tipo": "texto", "texto": "x", "tamanho": 500}, "tamanho"),
            ({"tipo": "nota", "texto": "x", "cor": "#000000"}, "notas"),
            ({"tipo": "forma", "forma": "nao-existe"}, "listar_formas"),
            ({"tipo": "geometria", "forma": "hexagono", "x": 0, "y": 0, "w": 1, "h": 1}, "tipo"),
            ({"tipo": "geometria", "forma": "rect", "x": 0, "y": 0, "w": -5, "h": 10}, "w"),
            ({"tipo": "grafico", "funcao": "alert(1);"}, "funcao"),
            ({"tipo": "grafico", "modelo": "nao-existe"}, "modelo"),
            ({"tipo": "grafico", "funcao": "x", "x_min": 2, "x_max": 1}, "x_max"),
            ({"tipo": "latex", "latex": ""}, "latex"),
            ({"tipo": "script"}, "desconhecido"),
        ]
        for pedido, trecho in casos:
            with self.subTest(pedido=str(pedido)[:60]):
                code, r = self.itens(bid, pedido)
                self.assertEqual(code, 400, r)
                self.assertIn(trecho, r["erro"])
        # um pedido ruim no meio da lista: nada é gravado
        self.assertEqual(self.itens(bid, {"tipo": "texto", "texto": "ok"}, {"tipo": "texto", "texto": "x", "cor": "?"})[0], 400)
        self.assertEqual(self.ler_arquivo(bid)["items"], [])
        self.assertEqual(self.agente("quadros", "POST", {"titulo": "x", "formato": "a5"})[0], 400)
        self.assertEqual(self.agente("quadros", "POST", {"titulo": "x", "fundo": {"padrao": "../x"}})[0], 400)
        self.assertEqual(self.agente("quadros", "POST", {"titulo": "\u0000\u0007"})[0], 400)
        self.assertEqual(self.agente("quadros/..%2Fserver")[0], 400)
        self.assertEqual(self.agente("quadros/nao-existe")[0], 404)
        # controle de caracteres: some, mas a quebra de linha fica
        _, r = self.itens(bid, {"tipo": "texto", "texto": "a\u0000b\nc"})
        self.assertEqual(self.ler_arquivo(bid)["items"][0]["text"], "ab\nc")

    def test_nota_larga_e_baixa_e_corrigida(self):
        self.ligar()
        bid = self.novo_quadro(formato="a4")
        # o caso do teste real: notas de 1000x150 deixavam a letra com 8 px
        code, r = self.itens(bid, {"tipo": "nota", "texto": "Só entram gases e solutos", "largura": 1000, "altura": 150})
        self.assertEqual(code, 200, r)
        self.assertIn("ajustada", r["aviso"])
        nota = self.ler_arquivo(bid)["items"][0]
        self.assertLessEqual(nota["w"], 600)
        self.assertGreaterEqual(nota["h"], nota["w"] * 0.75)
        # texto longo numa nota pequena: a nota cresce até a letra ficar legível
        self.itens(bid, {"tipo": "nota", "texto": "palavra " * 60})
        grande = self.ler_arquivo(bid)["items"][1]
        self.assertGreater(grande["h"], 220)
        self.assertLessEqual(grande["h"], grande["w"] * 2)
        # nota normal fica como pedida, sem aviso
        code, r = self.itens(bid, {"tipo": "nota", "texto": "Oi", "largura": 240, "altura": 200})
        self.assertNotIn("ajustada", r.get("aviso", ""))
        n = self.ler_arquivo(bid)["items"][2]
        self.assertEqual((n["w"], n["h"]), (240, 200))

    def test_lote_numa_revisao_e_tudo_ou_nada(self):
        self.ligar()
        bid = self.novo_quadro(formato="a4", paginas=2)
        log = self.dados / ".agente" / "registro.log"
        linhas = len(log.read_text(encoding="utf-8").splitlines())
        code, r = self.itens(bid, {"tipo": "texto", "texto": "Título", "tamanho": 44},
                             {"tipo": "nota", "texto": "Lembrete"},
                             {"tipo": "forma", "forma": "lb-bequer-anotado"},
                             {"tipo": "geometria", "forma": "arrow", "x": 48, "y": 600, "w": 200, "h": 0},
                             {"tipo": "latex", "latex": "x^2"},
                             {"tipo": "grafico", "funcao": "x", "pagina": 2})
        self.assertEqual(code, 200, r)
        self.assertEqual((len(r["itens_criados"]), r["revisao"]), (6, 2))
        self.assertEqual(len(log.read_text(encoding="utf-8").splitlines()), linhas + 1)
        # um item ruim no meio: erro diz qual, nada é gravado, a revisão não muda
        code, r = self.itens(bid, {"tipo": "texto", "texto": "ok"}, {"tipo": "forma", "forma": "nao-existe"},
                             {"tipo": "texto", "texto": "ok"})
        self.assertEqual(code, 400)
        self.assertIn("item 2 (forma)", r["erro"])
        b = self.ler_arquivo(bid)
        self.assertEqual((len(b["items"]), b["_rev"]), (6, 2))
        # limite por chamada
        self.assertEqual(self.itens(bid, *[{"tipo": "texto", "texto": "x"}] * 51)[0], 400)

    def test_formas_e_modelos(self):
        self.ligar(1)
        code, r = self.agente("formas?busca=bequer&limite=5")
        self.assertEqual(code, 200)
        self.assertTrue(r["formas"] and len(r["formas"]) <= 5)
        self.assertTrue(all({"id", "nome", "grupo", "secao", "w", "h"} <= set(f) for f in r["formas"]))
        self.assertEqual(self.agente("formas?limite=500")[0], 400)
        modelos = self.agente("modelos")[1]["modelos"]
        self.assertTrue(modelos and all("params" in m for m in modelos))

    def test_agente_nunca_apaga(self):
        self.ligar(3)
        bid = self.novo_quadro()
        antes = sorted(p.name for p in self.dados.iterdir())
        for metodo in ("DELETE", "PUT"):
            with self.subTest(metodo=metodo):
                self.assertIn(self.agente(f"quadros/{bid}", metodo)[0], (404, 405))
        self.assertEqual(sorted(p.name for p in self.dados.iterdir()), antes)
        self.assertEqual(list((self.dados / "lixeira").iterdir()), [])
        log = (self.dados / ".agente" / "registro.log").read_text(encoding="utf-8")
        self.assertIn(f"criar_quadro\t{bid}", log)
        self.assertNotIn("Aula do agente", log)                          # o registro não guarda conteúdo

    def test_mcp_por_stdio(self):
        self.ligar()
        proc = subprocess.Popen([sys.executable, str(ROOT / "mcp" / "giz_livre_mcp.py"), "--dados", self.temp.name,
                                 "--porta", str(self.port)], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                stderr=subprocess.DEVNULL)
        n = 0

        def rpc(metodo, params=None, notificacao=False):
            nonlocal n
            n += 1
            msg = {"jsonrpc": "2.0", "method": metodo, **({} if notificacao else {"id": n}),
                   **({"params": params} if params is not None else {})}
            proc.stdin.write(json.dumps(msg).encode() + b"\n"); proc.stdin.flush()
            if notificacao:
                return None
            r = json.loads(proc.stdout.readline())
            self.assertEqual(r["id"], n)
            return r

        def chamar(nome, **args):
            r = rpc("tools/call", {"name": nome, "arguments": args})["result"]
            return r, (json.loads(r["content"][0]["text"]) if not r["isError"] else r["content"][0]["text"])

        try:
            init = rpc("initialize", {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "teste"}})
            self.assertEqual(init["result"]["serverInfo"]["name"], "giz-livre")
            self.assertEqual(init["result"]["protocolVersion"], "2025-06-18")
            rpc("notifications/initialized", notificacao=True)
            self.assertEqual(rpc("ping")["result"], {})
            nomes = {t["name"] for t in rpc("tools/list")["result"]["tools"]}
            self.assertTrue({"listar_quadros", "ler_quadro", "criar_quadro", "adicionar_pagina", "escrever_texto",
                             "escrever_nota", "desenhar_forma_geometrica", "listar_formas", "inserir_forma",
                             "inserir_latex", "desenhar_grafico"} <= nomes)
            r, q = chamar("criar_quadro", titulo="Equilíbrio químico", formato="a4", paginas=3)
            bid = q["quadro"]
            self.assertEqual(chamar("escrever_texto", quadro=bid, texto="Equilíbrio químico", tamanho=44)[0]["isError"], False)
            self.assertEqual(chamar("desenhar_forma_geometrica", quadro=bid, tipo="arrow", x=48, y=200, w=300, h=0)[0]["isError"], False)
            forma = chamar("listar_formas", busca="bequer", limite=1)[1]["formas"][0]["id"]
            self.assertFalse(chamar("inserir_forma", quadro=bid, forma=forma, pagina=2)[0]["isError"])
            self.assertFalse(chamar("inserir_latex", quadro=bid, latex="K_c = \\frac{[C]}{[A]}")[0]["isError"])
            self.assertFalse(chamar("desenhar_grafico", quadro=bid, funcao="2x + 1", pagina=3)[0]["isError"])
            self.assertFalse(chamar("adicionar_pagina", quadro=bid)[0]["isError"])
            antes = self.ler_arquivo(bid)["_rev"]
            r, lote = chamar("adicionar_itens", quadro=bid, itens=[
                {"tipo": "texto", "texto": "Página 4", "pagina": 4},
                {"tipo": "nota", "texto": "Lembrete", "largura": 1000, "altura": 150, "pagina": 4},
                {"tipo": "geometria", "forma": "rect", "pagina": 4, "x": 48, "y": 600, "w": 100, "h": 80}])
            self.assertFalse(r["isError"], lote)
            self.assertEqual((len(lote["itens_criados"]), lote["revisao"]), (3, antes + 1))
            self.assertIn("ajustada", lote["aviso"])
            r, erro = chamar("adicionar_itens", quadro=bid, itens=[{"tipo": "apagar"}])
            self.assertTrue(r["isError"])
            self.assertIn("item 1", erro)
            self.assertEqual(self.ler_arquivo(bid)["_rev"], antes + 1)
            r, erro = chamar("escrever_texto", quadro=bid, texto="x", cor="azul")
            self.assertTrue(r["isError"])
            self.assertIn("#rrggbb", erro)
            self.assertEqual(rpc("tools/call", {"name": "apagar_quadro", "arguments": {}})["error"]["code"], -32602)
            self.assertEqual(rpc("metodo/inexistente")["error"]["code"], -32601)
            b = self.ler_arquivo(bid)
            self.assertEqual(b["layout"]["count"], 4)
            self.assertEqual([i["type"] for i in b["items"]], ["text", "shape", "image", "pendente", "pendente",
                                                         "text", "note", "shape"])
            lido = chamar("ler_quadro", quadro=bid)[1]
            self.assertEqual(lido["n_itens"], 8)
            # desligado no meio da conversa: mensagem clara, sem travar o MCP
            self.desligar()
            r, erro = chamar("listar_quadros")
            self.assertTrue(r["isError"])
            self.assertIn("Permitir agentes de IA", erro)
        finally:
            proc.stdin.close()
            proc.wait(timeout=10)


# funções puras do servidor (sem abrir porta): validação de apresentações e de nomes
class GuardTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("servidor", ROOT / "server.py")
        cls.srv = importlib.util.module_from_spec(spec); spec.loader.exec_module(cls.srv)

    def test_presentation_bomb_is_refused(self):
        import io, zipfile
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("[Content_Types].xml", b" " * (3 * 1024 * 1024))   # 3 MB que comprimem para poucos KB
            z.writestr("ppt/presentation.xml", b"<p/>")
        with self.assertRaises(ValueError):
            self.srv.checar_pptx(buf.getvalue())

    def test_normal_presentation_and_odp_scripts(self):
        import io, zipfile
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as z:
            z.writestr("[Content_Types].xml", b"<Types>presentationml.presentation.main</Types>")
        self.assertEqual(self.srv.checar_pptx(buf.getvalue()), ".pptx")
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as z:
            z.writestr("mimetype", b"application/vnd.oasis.opendocument.presentation")
            z.writestr("Scripts/python/x.py", b"print(1)")
        with self.assertRaises(ValueError):
            self.srv.checar_pptx(buf.getvalue())

    def test_slides_ocultos_e_com_video(self):
        import io, zipfile
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as z:
            z.writestr("[Content_Types].xml", b"<Types/>")
            # ordem da apresentação diferente da numeração dos arquivos: vale a ordem do sldIdLst
            z.writestr("ppt/presentation.xml", '<p:presentation><p:sldIdLst><p:sldId id="256" r:id="rId3"/>'
                       '<p:sldId id="257" r:id="rId2"/><p:sldId id="258" r:id="rId4"/></p:sldIdLst></p:presentation>')
            z.writestr("ppt/_rels/presentation.xml.rels", '<Relationships>'
                       '<Relationship Id="rId2" Type="x/slide" Target="slides/slide1.xml"/>'
                       '<Relationship Target="/ppt/slides/slide2.xml" Type="x/slide" Id="rId3"/>'
                       '<Relationship Id="rId4" Type="x/slide" Target="slides/slide3.xml"/></Relationships>')
            z.writestr("ppt/slides/slide1.xml", '<p:sld show="0"><p:cSld/></p:sld>')
            z.writestr("ppt/slides/slide2.xml", '<p:sld><p:cSld/></p:sld>')
            z.writestr("ppt/slides/slide3.xml", '<p:sld><p:cSld/></p:sld>')
            z.writestr("ppt/slides/_rels/slide3.xml.rels", '<Relationships><Relationship Id="rId2" '
                       'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/video" '
                       'Target="../media/media1.mp4"/></Relationships>')
        dados = buf.getvalue()
        self.assertEqual(self.srv.info_slides(dados, ".pptx"), {"total": 3, "ocultos": [2], "videos": [3]})
        self.assertEqual(self.srv.info_slides(dados, ".odp"), {})          # formato sem essa leitura
        self.assertEqual(self.srv.info_slides(b"PK\x03\x04lixo", ".pptx"), {})   # arquivo estranho não quebra
        # tempo da conversão proporcional ao deck, entre 3 e 30 minutos
        self.assertEqual(self.srv.limite_conversao(b"", 0), 180)
        self.assertEqual(self.srv.limite_conversao(b"x" * (100 * 1024 * 1024), 230), 180 + 690 + 200)
        self.assertEqual(self.srv.limite_conversao(b"", 5000), 1800)

    def test_reserved_windows_names_are_not_ids(self):
        for nome in ["CON", "nul", "Com1", "LPT9", "aux"]:
            with self.subTest(nome=nome):
                self.assertIsNone(self.srv.ID_OK.match(nome))
        for nome in ["console", "com10x", "quadro-1", "a_b"]:
            with self.subTest(nome=nome):
                self.assertIsNotNone(self.srv.ID_OK.match(nome))

    def test_nomes_de_arquivo_nao_aceitam_quebra_de_linha_no_fim(self):
        # o "$" do Python aceita um "\n" no fim; o nome do quadro, da lixeira e da imagem vira nome de arquivo
        self.assertIsNone(self.srv.ID_OK.match("quadro\n"))
        self.assertIsNone(self.srv.ID_OK.match("nul\n"))
        self.assertIsNone(self.srv.LIXO_OK.match("x_20260101-000000\n"))
        self.assertIsNone(self.srv.ASSET_OK.match("0" * 40 + ".png\n"))
        self.assertIsNotNone(self.srv.LIXO_OK.match("x_20260101-000000-2"))
        self.assertIsNotNone(self.srv.ASSET_OK.match("0" * 40 + ".jpg"))

    def test_updated_must_be_a_number(self):
        self.assertEqual(self.srv.numero("1') onmouseover=x"), 0)
        self.assertEqual(self.srv.numero(True), 0)
        self.assertEqual(self.srv.numero(float("nan")), 0)
        self.assertEqual(self.srv.numero(1792154741000), 1792154741000)


# o exportador só existe no repositório de desenvolvimento; no público, o teste é pulado
class AtualizacaoTests(unittest.TestCase):
    """Atualização pelo próprio programa: sem rede nos testes (a resposta do GitHub é simulada)."""

    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("servidor_atu", ROOT / "server.py")
        cls.srv = importlib.util.module_from_spec(spec); spec.loader.exec_module(cls.srv)

    @unittest.skipUnless(sys.platform == "win32", "janelas do Windows")
    def test_depois_de_atualizar_fecha_so_as_janelas_antigas(self):
        import ctypes
        vistas = [[11, 12], [11, 12], [11, 12, 99]]   # a janela nova (99) aparece na terceira olhada
        janelas = lambda: vistas.pop(0) if len(vistas) > 1 else vistas[0]
        with patch.object(self.srv, "_com_aumid", return_value=(None, None, janelas)), \
                patch.object(ctypes.windll.user32, "PostMessageW") as post, patch.object(self.srv.time, "sleep"):
            self.srv.fechar_janelas_antigas([11, 12])
        self.assertEqual([c.args[:2] for c in post.call_args_list], [(11, 0x0010), (12, 0x0010)])

    @unittest.skipUnless(sys.platform == "win32", "janelas do Windows")
    def test_depois_de_atualizar_sem_janela_nova_nao_fecha_nada(self):
        import ctypes
        with patch.object(self.srv, "_com_aumid", return_value=(None, None, lambda: [11])), \
                patch.object(ctypes.windll.user32, "PostMessageW") as post:
            self.srv.fechar_janelas_antigas([11], espera_s=0.6)
        post.assert_not_called()

    def release(self, tag, com_anexos=True):
        base = "https://github.com/HeraldoAntunes/giz-livre/releases/download/" + tag
        anexos = [{"name": f"Instalar-GizLivre-{tag.lstrip('v')}.exe", "browser_download_url": f"{base}/Instalar-GizLivre-{tag.lstrip('v')}.exe"},
                  {"name": "SHA256SUMS.txt", "browser_download_url": f"{base}/SHA256SUMS.txt"}] if com_anexos else []
        return {"tag_name": tag, "body": "- novidade", "html_url": "https://github.com/HeraldoAntunes/giz-livre/releases/tag/" + tag,
                "assets": anexos}

    def test_compara_versoes_por_numero(self):
        v = self.srv.versao_tupla
        self.assertGreater(v("1.10.0"), v("1.9.0"))   # 10 > 9, não "1" < "9"
        self.assertEqual(v("v2.0.1"), (2, 0, 1))
        self.assertIsNone(v("1.9"))
        self.assertIsNone(v("../1.0.0"))

    def test_notas_sem_a_tabela_de_download(self):
        corpo = "## Qual arquivo baixar?\n\n| a | b |\n\n---\n\n## O que mudou\nCorreções.\n- item"
        self.assertEqual(self.srv.notas_da_release(corpo), "Correções.\n- item")
        self.assertEqual(self.srv.notas_da_release("Só o texto antigo"), "Só o texto antigo")
        self.assertEqual(self.srv.notas_da_release(None), "")

    def test_so_aceita_github_por_https(self):
        ok = self.srv.endereco_permitido
        self.assertTrue(ok("https://github.com/HeraldoAntunes/giz-livre/releases/download/v1.0.0/x.exe"))
        self.assertTrue(ok("https://objects.githubusercontent.com/abc"))
        self.assertFalse(ok("http://github.com/x"))
        self.assertFalse(ok("https://github.com.exemplo.com/x"))
        self.assertFalse(ok("https://usuario@github.com/x"))
        self.assertFalse(ok("https://github.com:8443/x"))
        self.assertFalse(ok(None))
        with self.assertRaises(ValueError):
            self.srv.baixar_https("https://exemplo.com/instalador.exe", 10)

    def test_versao_nova_mais_recente_e_mais_nova_aqui(self):
        s = self.srv
        with patch.object(s, "VERSAO", "1.10.0"), patch.object(s, "pode_instalar_sozinho", return_value=True):
            nova = s.info_atualizacao(self.release("v1.11.0"))
            self.assertTrue(nova["nova"]); self.assertTrue(nova["pode_instalar"]); self.assertEqual(nova["ultima"], "1.11.0")
            igual = s.info_atualizacao(self.release("v1.10.0"))
            self.assertFalse(igual["nova"]); self.assertFalse(igual["pode_instalar"]); self.assertFalse(igual["mais_nova_aqui"])
            antiga = s.info_atualizacao(self.release("v1.9.0"))
            self.assertFalse(antiga["nova"]); self.assertTrue(antiga["mais_nova_aqui"])
            sem = s.info_atualizacao(self.release("v1.11.0", com_anexos=False))
            self.assertTrue(sem["nova"]); self.assertFalse(sem["pode_instalar"])   # sem instalador e somas, só a página
            publico = s.resposta_publica(nova)
            self.assertFalse(any(k.startswith("_") for k in publico))
        with patch.object(s, "VERSAO", "1.10.0"), patch.object(s, "pode_instalar_sozinho", return_value=False):
            self.assertFalse(s.info_atualizacao(self.release("v1.11.0"))["pode_instalar"])   # portátil e código-fonte
        with self.assertRaises(ValueError):
            s.info_atualizacao({"tag_name": "ultima", "assets": []})

    def test_soma_esperada_vem_do_sha256sums(self):
        somas = "a" * 64 + "  GizLivre-1.11.0-portatil.zip\n" + "B" * 64 + "  Instalar-GizLivre-1.11.0.exe\n# comentário\n"
        self.assertEqual(self.srv.soma_esperada(somas, "Instalar-GizLivre-1.11.0.exe"), "b" * 64)
        with self.assertRaises(ValueError):
            self.srv.soma_esperada(somas, "Instalar-GizLivre-9.9.9.exe")

    def test_instalar_recusa_arquivo_que_nao_confere(self):
        s = self.srv
        rel = self.release("v1.11.0")

        def falso(url, limite, timeout=30, aceita=""):
            if url.endswith("SHA256SUMS.txt"):
                return ("0" * 64 + "  Instalar-GizLivre-1.11.0.exe\n").encode()
            return b"instalador adulterado"

        real = s.info_atualizacao
        with patch.object(s, "VERSAO", "1.10.0"), patch.object(s, "pode_instalar_sozinho", return_value=True), \
                patch.object(s, "info_atualizacao", side_effect=lambda: real(rel)), \
                patch.object(s, "baixar_https", side_effect=falso), patch.object(s.subprocess, "Popen") as roda:
            with self.assertRaises(ValueError) as erro:
                s.instalar_atualizacao()
            self.assertIn("não confere", str(erro.exception))
            roda.assert_not_called()

    def test_instalador_conferido_roda_com_registro(self):
        import hashlib
        s = self.srv
        rel = self.release("v1.11.0")
        exe = b"instalador de verdade"

        def falso(url, limite, timeout=30, aceita=""):
            if url.endswith("SHA256SUMS.txt"):
                return (hashlib.sha256(exe).hexdigest() + "  Instalar-GizLivre-1.11.0.exe\n").encode()
            return exe

        real = s.info_atualizacao
        with tempfile.TemporaryDirectory() as tmp, patch.object(s, "DADOS", Path(tmp) / "Giz Livre" / "quadros"), \
                patch.object(s, "VERSAO", "1.10.0"), patch.object(s, "pode_instalar_sozinho", return_value=True), \
                patch.object(s, "info_atualizacao", side_effect=lambda: real(rel)), \
                patch.object(s, "baixar_https", side_effect=falso), patch.object(s.subprocess, "Popen") as roda:
            r = s.instalar_atualizacao()
            args = roda.call_args[0][0]
            self.assertEqual(Path(args[0]).read_bytes(), exe)
            self.assertIn("/CURRENTUSER", args)
            self.assertIn("/FORCECLOSEAPPLICATIONS", args)   # o programa ainda está aberto quando o instalador começa
            iss = (ROOT / "installer" / "lousa.iss").read_text(encoding="utf-8-sig")
            self.assertIn("\nCloseApplications=force", iss)   # vale também para quem atualiza a partir da 1.11.0
            self.assertIn("/LOG=" + str(Path(tmp) / "Giz Livre" / "atualizacao.log"), args)   # rastro se não terminar
            self.assertEqual((r["versao"], r["log"]), ("1.11.0", str(Path(tmp) / "Giz Livre" / "atualizacao.log")))


class ReconhecedorEscritaTests(unittest.TestCase):
    """/api/info diz se a escrita→texto vai funcionar e em que idioma (detecção simulada, sem depender do Windows real)."""

    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("servidor_ocr", ROOT / "server.py")
        cls.srv = importlib.util.module_from_spec(spec); spec.loader.exec_module(cls.srv)

    def _info(self, windows, nomes=None, falha=None):
        s = self.srv
        lista = patch.object(s, "listar_reconhecedores", side_effect=falha) if falha else \
            patch.object(s, "listar_reconhecedores", return_value=nomes)
        with patch.object(s, "WINDOWS", windows), patch.dict(s.OCR_ESTADO, {"conferido": not windows, "nomes": None}), \
                lista as chamada, patch.object(s, "registrar"):
            s.detectar_reconhecedor()
            s.detectar_reconhecedor()   # uma vez por execução: a segunda não chama o PowerShell de novo
            if windows:
                self.assertEqual(chamada.call_count, 1)
            return s.info_ocr()

    def test_pt_br_instalado(self):
        self.assertEqual(self._info(True, ["Outro para Inglês (Estados Unidos)", "Reconhecedor de Manuscrito da Microsoft para Português (Brasil)"]),
                         {"ocr": True, "ocr_idioma": "pt-BR", "ocr_conferido": True})

    def test_so_outro_idioma(self):
        self.assertEqual(self._info(True, ["Microsoft English (US) Handwriting Recognizer"]),
                         {"ocr": True, "ocr_idioma": "English (US)", "ocr_conferido": True})
        self.assertEqual(self._info(True, ["Reconhecedor de Manuscrito da Microsoft para Português (Portugal)"])["ocr_idioma"],
                         "Português (Portugal)")

    def test_nenhum_reconhecedor_esconde_o_botao(self):
        self.assertEqual(self._info(True, []), {"ocr": False, "ocr_idioma": None, "ocr_conferido": True})

    def test_demora_demais_mantem_o_botao(self):
        info = self._info(True, falha=subprocess.TimeoutExpired("powershell", 30))
        self.assertEqual(info, {"ocr": True, "ocr_idioma": None, "ocr_conferido": True})

    def test_fora_do_windows(self):
        self.assertEqual(self._info(False), {"ocr": False, "ocr_idioma": None, "ocr_conferido": True})

    def test_enquanto_confere_nao_atrasa_e_mantem_o_botao(self):
        s = self.srv
        with patch.object(s, "WINDOWS", True), patch.dict(s.OCR_ESTADO, {"conferido": False, "nomes": None}), \
                patch.object(s.threading, "Thread") as fio:
            self.assertEqual(s.info_ocr(), {"ocr": True, "ocr_idioma": None, "ocr_conferido": False})
            fio.assert_called_once()   # a conferência vai para segundo plano

    def test_api_info_traz_os_campos(self):
        s = self.srv
        srv = s.Servidor(("127.0.0.1", 0), s.Handler)
        porta = srv.server_address[1]
        fio = __import__("threading").Thread(target=srv.serve_forever, daemon=True); fio.start()
        try:
            with patch.object(s, "PORTA", porta), patch.object(s, "WINDOWS", True), \
                    patch.dict(s.OCR_ESTADO, {"conferido": True, "nomes": ["Microsoft English (US) Handwriting Recognizer"]}):
                info = json.load(urllib.request.urlopen(f"http://127.0.0.1:{porta}/api/info", timeout=5))
            self.assertEqual((info["ocr"], info["ocr_idioma"], info["ocr_conferido"]), (True, "English (US)", True))
        finally:
            srv.shutdown(); srv.server_close()


class FecharJanelaTests(unittest.TestCase):
    """Fechar a última janela encerra o programa; recarregar ou outra janela aberta não encerram."""

    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("servidor_fechar", ROOT / "server.py")
        cls.srv = importlib.util.module_from_spec(spec); spec.loader.exec_module(cls.srv)

    def setUp(self):
        self.srv.ABERTOS.clear()
        self.parou = []
        self.falso = type("Srv", (), {"shutdown": lambda _s: self.parou.append(True)})()

    def test_ultima_janela_fechada_encerra(self):
        marco = time.time()
        self.srv.CONTATO_JANELA = marco - 5
        self.assertTrue(self.srv.encerrar_se_ninguem_voltou(self.falso, marco))
        time.sleep(0.2)
        self.assertEqual(self.parou, [True])

    def test_recarregar_a_pagina_nao_encerra(self):
        marco = time.time() - 3
        self.srv.marcar_contato()   # a página recarregada pediu /api/info depois do aviso de fechar
        self.assertFalse(self.srv.encerrar_se_ninguem_voltou(self.falso, marco))

    def _vigia(self, saltos, limite=60):
        # relógio falso: cada volta avança `saltos[i]` segundos; para quando encerra ou quando os saltos acabam
        s, tempos = self.srv, iter(saltos)
        agora = [1000.0]
        s.ULTIMA_ATIVIDADE = 1000.0

        class Fim(Exception):
            pass

        def dormir(_):
            try:
                agora[0] += next(tempos)
            except StopIteration:
                raise Fim

        try:
            s.vigiar_inatividade(self.falso, limite, passo=15, dormir=dormir, relogio=lambda: agora[0])
        except Fim:
            pass
        return bool(self.parou)

    def test_sem_sinal_da_pagina_encerra(self):
        self.assertTrue(self._vigia([15] * 6))   # 90 s sem sinal, limite de 60 s

    def test_suspensao_do_computador_nao_encerra_na_hora(self):
        self.assertFalse(self._vigia([15, 3600, 15, 15]))   # acordou depois de 1 h: a contagem recomeça

    def test_outra_janela_aberta_nao_encerra(self):
        marco = time.time()
        self.srv.CONTATO_JANELA = marco - 5
        self.srv.ABERTOS["outra"] = (None, time.time() - 20)
        self.assertFalse(self.srv.encerrar_se_ninguem_voltou(self.falso, marco))


@unittest.skipUnless((ROOT / "scripts/exportar_publico.py").exists(), "sem scripts/exportar_publico.py")
class ExportTests(unittest.TestCase):
    def test_only_safe_destinations_accepted(self):
        spec = importlib.util.spec_from_file_location("exportar", ROOT / "scripts/exportar_publico.py")
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory(prefix="giz-export-") as temp:
            parent = Path(temp).resolve(); source = parent / "dev"; source.mkdir()
            unknown = parent / "documentos"; unknown.mkdir()
            sentinel = unknown / "nao-apagar.txt"; sentinel.write_text("preservado", encoding="utf-8")
            marked = parent / "publico"; marked.mkdir()
            (marked / module.MARCADOR).write_text(module.MARCA, encoding="utf-8")
            with patch.object(module, "RAIZ", source):
                for target in [source, parent, source / "sub", source / "quadros", parent / "quadros", unknown]:
                    with self.subTest(target=target):
                        with self.assertRaises(ValueError): module.validar_destino(target)
                module.validar_destino(parent / "novo")
                module.validar_destino(marked)
                self.assertEqual(sentinel.read_text(encoding="utf-8"), "preservado")


class PacoteTests(unittest.TestCase):
    """Levar os quadros para outro computador: pacote .zip, sem apagar nem sobrescrever nada ao trazer."""
    PNG = bytes.fromhex("89504e470d0a1a0a") + b"imagem de teste"

    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("servidor_pacote", ROOT / "server.py")
        cls.srv = importlib.util.module_from_spec(spec); spec.loader.exec_module(cls.srv)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="giz-pacote-")
        self.usar(Path(self.temp.name) / "pc1")

    def tearDown(self):
        self.temp.cleanup()

    def usar(self, pasta):   # troca o "computador": a pasta de quadros do módulo
        pasta.mkdir(parents=True, exist_ok=True)
        self.srv.DADOS, self.srv.LIXEIRA = pasta, pasta / "lixeira"
        self.srv.RESUMOS.clear()

    def quadro(self, bid, titulo, itens=None, **extra):
        b = {"title": titulo, "items": itens if itens is not None else [{"id": "t1", "type": "text", "text": titulo}],
             "background": {"color": "#ffffff", "pattern": "none"}, "_rev": 3, "updated": 1000, **extra}
        (self.srv.DADOS / f"{bid}.json").write_text(json.dumps(b), encoding="utf-8")
        (self.srv.DADOS / f"{bid}.png").write_bytes(self.PNG)
        return b

    def pacote(self):
        import io
        f = io.BytesIO()
        resumo = self.srv.montar_pacote(f)
        f.seek(0)
        return f, resumo

    def titulos(self):
        return sorted(json.loads(p.read_text(encoding="utf-8"))["title"] for p in self.srv.DADOS.glob("*.json"))

    def test_ida_e_volta_leva_quadros_miniaturas_e_imagens(self):
        import hashlib, zipfile
        nome = hashlib.sha1(self.PNG).hexdigest() + ".png"
        (self.srv.DADOS / "assets").mkdir()
        (self.srv.DADOS / "assets" / nome).write_bytes(self.PNG)
        (self.srv.DADOS / "assets" / ("0" * 40 + ".png")).write_bytes(self.PNG)   # sem uso: não vai
        self.quadro("aula1", "Aula 1", [{"id": "i", "type": "image", "src": "/assets/" + nome, "x": 0, "y": 0, "w": 1, "h": 1}], folder="Hidráulica")
        self.quadro("aula2", "Aula 2")
        f, resumo = self.pacote()
        self.assertEqual((resumo["quadros"], resumo["imagens"], resumo["falhas"]), (2, 1, []))
        nomes = set(zipfile.ZipFile(f).namelist()); f.seek(0)
        self.assertEqual(nomes, {"manifesto.json", "quadros/aula1.json", "quadros/aula1.png", "quadros/aula2.json",
                                 "quadros/aula2.png", "assets/" + nome})
        self.usar(Path(self.temp.name) / "pc2")
        r = self.srv.trazer_pacote(f)
        self.assertEqual((r["trazidos"], r["iguais"], r["copias"], r["imagens"], r["falhas"]), (2, 0, 0, 1, []))
        b = json.loads((self.srv.DADOS / "aula1.json").read_text(encoding="utf-8"))
        self.assertEqual((b["title"], b["folder"], b["_rev"], b["updated"]), ("Aula 1", "Hidráulica", 0, 1000))
        self.assertEqual((self.srv.DADOS / "assets" / nome).read_bytes(), self.PNG)
        self.assertEqual((self.srv.DADOS / "aula1.png").read_bytes(), self.PNG)

    def test_trazer_de_novo_nao_repete_e_quadro_mexido_vira_copia(self):
        self.quadro("aula1", "Aula 1")
        self.quadro("aula2", "Aula 2")
        f, _ = self.pacote()
        # no outro PC: aula1 igual (só revisão, data e posição da tela diferentes), aula2 mexida
        self.usar(Path(self.temp.name) / "pc2")
        self.quadro("aula1", "Aula 1", _rev=9, updated=5000, view={"x": 5, "y": 5, "zoom": 2})
        self.quadro("aula2", "Aula 2", [{"id": "t1", "type": "text", "text": "mudou"}])
        r = self.srv.trazer_pacote(f)
        self.assertEqual((r["trazidos"], r["iguais"], r["copias"]), (0, 1, 1))
        self.assertEqual(json.loads((self.srv.DADOS / "aula2.json").read_text(encoding="utf-8"))["items"][0]["text"], "mudou")
        self.assertEqual(len(self.titulos()), 3)
        self.assertTrue(any(t.startswith("Aula 2 (trazido em ") for t in self.titulos()))
        f.seek(0)
        r = self.srv.trazer_pacote(f)   # a cópia de antes é reconhecida: trazer de novo não multiplica cópias
        self.assertEqual((r["iguais"], r["copias"]), (2, 0))
        self.assertEqual(len(self.titulos()), 3)

    def test_quadro_antigo_sem_id_nem_fundo_nao_multiplica_copias(self):
        # quadro feito fora da página: itens sem id e sem fundo; a limpeza ao trazer não pode virar "diferença"
        antigo = {"title": "Antigo", "items": [{"type": "text", "text": "a"}, {"type": "text", "text": "b"}]}
        (self.srv.DADOS / "velho1.json").write_text(json.dumps(antigo), encoding="utf-8")
        f, _ = self.pacote()
        self.usar(Path(self.temp.name) / "pc2")
        r = self.srv.trazer_pacote(f)
        self.assertEqual(r["trazidos"], 1)
        ids = [i["id"] for i in json.loads((self.srv.DADOS / "velho1.json").read_text(encoding="utf-8"))["items"]]
        self.assertEqual(len(set(ids)), 2)
        f.seek(0)
        r = self.srv.trazer_pacote(f)   # o mesmo pacote de novo
        self.assertEqual((r["iguais"], r["copias"]), (1, 0))
        g, _ = self.pacote()             # e a volta para o primeiro PC, onde o quadro ainda não tem id nem fundo
        self.usar(Path(self.temp.name) / "pc1")
        r = self.srv.trazer_pacote(g)
        self.assertEqual((r["iguais"], r["copias"]), (1, 0))
        self.assertEqual(self.titulos(), ["Antigo"])

    def test_titulo_repetido_ganha_marca_so_quando_ja_existe(self):
        self.quadro("x1", "Bombas")
        f, _ = self.pacote()
        self.usar(Path(self.temp.name) / "pc2")
        self.quadro("y1", "Bombas")
        r = self.srv.trazer_pacote(f)
        self.assertEqual(r["trazidos"], 1)
        self.assertEqual(self.titulos(), ["Bombas", "Bombas (trazido)"])

    def zip_feito(self, arquivos):
        import io, zipfile
        f = io.BytesIO()
        with zipfile.ZipFile(f, "w") as z:
            for nome, dados in arquivos.items():
                z.writestr(nome, dados)
        f.seek(0)
        return f

    def test_pacote_malicioso_nao_grava_fora_e_tira_imagem_externa(self):
        man = json.dumps({"formato": 1})
        ruim = {"title": "x", "items": [{"id": "a", "type": "image", "src": "https://exemplo.com/espiao.png"},
                                        {"id": "b", "type": "text", "text": "fica"}]}
        f = self.zip_feito({"manifesto.json": man, "../../fora.json": json.dumps(ruim), "quadros/../fora2.json": "{}",
                            "quadros/con.json": json.dumps(ruim), "quadros/bom.json": json.dumps(ruim),
                            "assets/" + "1" * 40 + ".png": self.PNG})   # sha1 não confere
        r = self.srv.trazer_pacote(f)
        self.assertEqual(r["trazidos"], 1)
        self.assertEqual([x["motivo"] for x in r["falhas"]], ["imagem danificada"])
        self.assertFalse((Path(self.temp.name) / "fora.json").exists())
        self.assertEqual(sorted(p.name for p in self.srv.DADOS.iterdir() if p.is_file()), ["bom.json"])
        itens = json.loads((self.srv.DADOS / "bom.json").read_text(encoding="utf-8"))["items"]
        self.assertEqual([i["id"] for i in itens], ["b"])

    def test_recusa_o_que_nao_e_pacote_ou_e_de_versao_nova(self):
        import io
        with self.assertRaisesRegex(ValueError, "não é um pacote"):
            self.srv.trazer_pacote(io.BytesIO(b"isto nao e zip"))
        with self.assertRaisesRegex(ValueError, "não é um pacote"):
            self.srv.trazer_pacote(self.zip_feito({"quadros/a.json": "{}"}))
        with self.assertRaisesRegex(ValueError, "versão mais nova"):
            self.srv.trazer_pacote(self.zip_feito({"manifesto.json": json.dumps({"formato": 99})}))

    def test_quadro_danificado_e_contado_e_o_resto_entra(self):
        f = self.zip_feito({"manifesto.json": json.dumps({"formato": 1}), "quadros/a.json": "{nao e json",
                            "quadros/b.json": json.dumps({"title": "B", "items": [], "layout": {"mode": "pages", "w": 1, "h": 1, "count": 1e9}}),
                            "quadros/c.json": json.dumps({"title": "C", "items": []})})
        r = self.srv.trazer_pacote(f)
        self.assertEqual((r["trazidos"], len(r["falhas"])), (1, 2))

    def test_zip_que_incha_e_recusado_sem_extrair(self):
        f = self.zip_feito({"manifesto.json": json.dumps({"formato": 1}), "quadros/a.json": "{}"})
        with patch.object(self.srv, "LIMITE_DESCOMPRIMIDO", 10):   # o que o zip declara passa do limite
            with self.assertRaisesRegex(ValueError, "grande demais"):
                self.srv.trazer_pacote(f)
        self.assertEqual(list(self.srv.DADOS.glob("*.json")), [])

    def test_onedrive(self):
        with patch.dict("os.environ", {"OneDrive": self.temp.name}):
            self.assertTrue(self.srv.em_onedrive(Path(self.temp.name) / "Documentos" / "Giz Livre" / "quadros"))
        with patch.dict("os.environ", {"OneDrive": "", "OneDriveCommercial": "", "OneDriveConsumer": ""}):
            self.assertFalse(self.srv.em_onedrive(Path(self.temp.name) / "quadros"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
