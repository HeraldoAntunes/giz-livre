# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
"""Regressões HTTP e proteção do exportador, somente com stdlib e dados temporários."""
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

    def test_corrupt_existing_file_is_not_overwritten(self):
        path = Path(self.temp.name) / "corrupt.json"
        path.write_text("{incompleto", encoding="utf-8")
        self.assertEqual(self.request("/api/boards/corrupt", "PUT", {"board": {"items": []}})[0], 500)
        self.assertEqual(path.read_text(encoding="utf-8"), "{incompleto")


# canal dos agentes de IA (rotas /api/agente/*) e o servidor MCP por stdio, num servidor temporário próprio
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

    def test_reserved_windows_names_are_not_ids(self):
        for nome in ["CON", "nul", "Com1", "LPT9", "aux"]:
            with self.subTest(nome=nome):
                self.assertIsNone(self.srv.ID_OK.match(nome))
        for nome in ["console", "com10x", "quadro-1", "a_b"]:
            with self.subTest(nome=nome):
                self.assertIsNotNone(self.srv.ID_OK.match(nome))

    def test_updated_must_be_a_number(self):
        self.assertEqual(self.srv.numero("1') onmouseover=x"), 0)
        self.assertEqual(self.srv.numero(True), 0)
        self.assertEqual(self.srv.numero(float("nan")), 0)
        self.assertEqual(self.srv.numero(1792154741000), 1792154741000)


# o exportador só existe no repositório de desenvolvimento; no público, o teste é pulado
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


if __name__ == "__main__":
    unittest.main(verbosity=2)
