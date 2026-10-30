# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
"""Regressões HTTP e proteção do exportador, somente com stdlib e dados temporários."""
import http.client
import importlib.util
import json
import os
import shutil
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

os.environ["GIZ_SEM_DIARIO"] = "1"   # o diário (giz-livre.log) não vai para a pasta real de quadros
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
                cls.token = json.loads((Path(cls.temp.name) / ".agente" / "conexao.json").read_text(encoding="utf-8"))["token"]
                urllib.request.urlopen(cls.base + "/api/info", timeout=1).read()
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

    def test_mover_pela_galeria_nao_da_conflito_no_quadro_aberto(self):
        aberto = self.create("folder")   # o quadro aberto numa janela, antes de ser movido em outra
        self.assertEqual(self.request("/api/folder/folder", "PUT", {"folder": "Disciplina"})[0], 200)
        aberto["items"] = [{"type": "text", "id": "t1"}]
        code, r = self.request("/api/boards/folder", "PUT", {"board": aberto})
        self.assertEqual(code, 200)
        self.assertEqual((r["folder"], r["meta"]), ("Disciplina", 1))
        salvo = self.request("/api/boards/folder")[1]
        self.assertEqual((salvo["folder"], len(salvo["items"])), ("Disciplina", 1))

    def test_renomear_pela_galeria_nao_da_conflito_e_o_nome_fica(self):
        aberto = self.create("renomear")
        code, r = self.request("/api/folder/renomear", "PUT", {"title": "  Aula de MHS  "})
        self.assertEqual((code, r["title"]), (200, "Aula de MHS"))
        self.assertEqual(self.request("/api/boards/renomear")[1]["_rev"], aberto["_rev"])   # revisão não muda
        code, r = self.request("/api/boards/renomear", "PUT", {"board": aberto, "title": aberto.get("title")})
        self.assertEqual((code, r["title"]), (200, "Aula de MHS"))
        aberto["_rev"], aberto["_meta"], aberto["title"] = r["revision"], r["meta"], "Nome dado no quadro"
        code, r = self.request("/api/boards/renomear", "PUT", {"board": aberto, "title": aberto["title"]})
        self.assertEqual((code, r["title"]), (200, "Nome dado no quadro"))   # depois de sincronizar, vale o do quadro
        self.assertEqual(self.request("/api/folder/renomear", "PUT", {"title": "   "})[0], 400)

    def test_edicao_de_verdade_em_outra_janela_ainda_da_conflito(self):
        stale = self.create("edita")
        outra = dict(stale, items=[{"type": "text", "id": "x"}])
        self.assertEqual(self.request("/api/boards/edita", "PUT", {"board": outra})[0], 200)
        self.assertEqual(self.request("/api/folder/edita", "PUT", {"folder": "Disciplina"})[0], 200)
        self.assertEqual(self.request("/api/boards/edita", "PUT", {"board": stale})[0], 412)

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

    def test_pdf_recusa_dimensoes_invalidas_antes_de_montar(self):
        import base64
        jpeg = base64.b64encode(bytes.fromhex("ffd8ffe000104a46494600010100000100010000ffd9")).decode()
        pagina = {"w": 72, "h": 72, "pw": 1, "ph": 1, "jpeg": "data:image/jpeg;base64," + jpeg}
        def enviar(pg):
            conn = http.client.HTTPConnection("127.0.0.1", int(self.base.rsplit(":", 1)[1]), timeout=5)
            try:
                conn.request("POST", "/api/pdf", json.dumps({"pages": [pg]}),
                             {"X-Lousa": self.token, "Content-Type": "application/json"})
                resposta = conn.getresponse()
                return resposta.status, resposta.headers["Content-Type"], resposta.read()
            finally:
                conn.close()
        code, tipo, pdf = enviar(pagina)
        self.assertEqual(code, 200)
        self.assertEqual(tipo, "application/pdf")
        self.assertTrue(pdf.startswith(b"%PDF-1.4"))
        self.assertIn(b"/MediaBox [0 0 72.00 72.00]", pdf)
        for campo in ("w", "h", "pw", "ph"):
            for valor in ("NaN", "Infinity", "-Infinity", float("nan"), float("inf"), -1, 0, 100001, True, None):
                with self.subTest(campo=campo, valor=valor):
                    code, _, erro = enviar({**pagina, campo: valor})
                    self.assertEqual(code, 400, "dimensões inválidas não podem produzir PDF")
                    self.assertIn("dimens", json.loads(erro)["erro"])
        for campo in ("pw", "ph"):
            with self.subTest(campo=campo, valor=1.5):
                self.assertEqual(enviar({**pagina, campo: 1.5})[0], 400)

    def test_delete_and_restore(self):
        self.create("trash")
        code, deleted = self.request("/api/boards/trash", "DELETE")
        self.assertEqual(code, 200)
        self.assertEqual(self.request("/api/boards/trash")[0], 404)
        self.assertEqual(self.request("/api/lixeira/restaurar", "POST", {"nome": deleted["lixeira"]})[0], 200)
        self.assertEqual(self.request("/api/boards/trash")[0], 200)

    def test_envio_http_curto_nao_grava_mesmo_com_json_completo(self):
        self.create("controleEnvio")
        corpo = json.dumps({"board": {"title": "Envio interrompido", "items": []}, "revision": 0}).encode()
        porta = int(self.base.rsplit(":", 1)[1])
        conn = http.client.HTTPConnection("127.0.0.1", porta, timeout=5)
        try:
            conn.request("PUT", "/api/boards/interrompido", corpo,
                         {"X-Lousa": self.token, "Content-Length": str(len(corpo) + 8)})
            conn.sock.shutdown(socket.SHUT_WR)
            resposta = conn.getresponse()
            status, erro = resposta.status, resposta.read()
        finally:
            conn.close()
        self.assertIn(status, (400, 408, None), "envio incompleto deve ser recusado")
        self.assertFalse((Path(self.temp.name) / "interrompido.json").exists())
        self.assertEqual(status, 400)
        self.assertIn("interrompido", json.loads(erro)["erro"])
        self.assertEqual(self.request("/api/ping")[0], 200)

    def test_token_nao_ascii_devolve_erro_http_sem_gravar(self):
        self.create("controleToken")
        code, _ = self.request("/api/boards/negado", "PUT",
                               {"board": {"title": "Negado", "items": []}, "revision": 0},
                               {"X-Lousa": "errado"})
        self.assertEqual(code, 409)
        for token in ("é", "ÿ"):
            with self.subTest(token=token):
                code, _ = self.request("/api/boards/negado", "PUT",
                                       {"board": {"title": "Negado", "items": []}, "revision": 0},
                                       {"X-Lousa": token})
                self.assertIn(code, (400, 401, 403, 409))
                self.assertFalse((Path(self.temp.name) / "negado.json").exists())
                self.assertEqual(self.request("/api/ping")[0], 200)
        porta = int(self.base.rsplit(":", 1)[1])
        for headers in ({"X-Lousa": "é"}, {"X-Lousa": "", "Cookie": f'giz{porta}="é"'}):
            with self.subTest(headers=headers):
                self.assertEqual(self.request("/api/boards", headers=headers)[0], 401)

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

    # ---- acesso por conta do Windows (29/10/2026) ----
    def _cru(self, path, method="GET", data=None, headers=None):
        req = urllib.request.Request(self.base + path, method=method, headers=headers or {},
                                     data=json.dumps(data).encode() if data is not None else None)
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return r.status, r.read(), r.headers
        except urllib.error.HTTPError as e:
            with e:
                return e.code, e.read(), e.headers

    def test_sem_codigo_nenhum_quadro_sai(self):
        self.request("/api/boards/privado1", "PUT", {"board": {"title": "Diário de classe", "items": []}, "revision": 0})
        for rota in ["/api/boards", "/api/boards/privado1", "/api/prefs", "/api/lixeira", "/thumbs/privado1.png",
                     "/assets/" + "a" * 40 + ".png", "/api/pacote"]:
            with self.subTest(rota=rota):
                status, corpo, _ = self._cru(rota)
                self.assertEqual(status, 401)
                self.assertNotIn("Diário".encode(), corpo)

    def test_imagem_guardada_vem_com_os_cabecalhos_de_protecao(self):
        # auditoria de 29/10/2026: /assets/ saía sem os cabeçalhos das outras respostas (só o cache longo é diferente)
        png = bytes.fromhex("89504e470d0a1a0a") + os.urandom(64)
        req = urllib.request.Request(self.base + "/api/assets", data=png, method="POST",
                                     headers={"X-Lousa": self.token, "Content-Type": "image/png"})
        with urllib.request.urlopen(req, timeout=5) as r:
            url = json.loads(r.read())["url"]
        with urllib.request.urlopen(urllib.request.Request(self.base + url, headers={"X-Lousa": self.token}), timeout=5) as r:
            self.assertEqual(r.read(), png)
            h = r.headers
        self.assertEqual(h["X-Content-Type-Options"], "nosniff")
        self.assertEqual(h["X-Frame-Options"], "DENY")
        self.assertEqual(h["Cross-Origin-Resource-Policy"], "same-origin")
        self.assertIn("default-src 'self'", h["Content-Security-Policy"])
        self.assertEqual(h.get_all("Cache-Control"), ["max-age=31536000, immutable"])   # um só, o da imagem

    def test_info_publica_nao_entrega_codigo_nem_pasta(self):
        status, corpo, _ = self._cru("/api/info")
        info = json.loads(corpo)
        self.assertEqual((status, info["app"]), (200, "giz-livre"))
        self.assertNotIn("token", info); self.assertNotIn("dados", info)
        self.assertEqual(self.request("/api/info")[1]["token"], self.token)   # com o código: completo

    def test_chave_de_abertura_vira_cookie_e_vale_uma_vez(self):
        k = self.request("/api/chave", "POST", {})[1]["k"]
        status, corpo, cab = self._cru("/api/sessao", "POST", {"k": k}, {"Content-Type": "application/json"})
        self.assertEqual((status, json.loads(corpo)["token"]), (200, self.token))
        biscoito = cab["Set-Cookie"]
        self.assertIn("HttpOnly", biscoito); self.assertIn("SameSite=Strict", biscoito)
        par = biscoito.split(";")[0]
        self.assertEqual(self._cru("/api/boards", headers={"Cookie": par})[0], 200)   # imagens e listas com o cookie
        self.assertEqual(self._cru("/api/sessao", "POST", {"k": k}, {"Content-Type": "application/json"})[0], 401)
        self.assertEqual(self._cru("/api/sessao", "POST", {"k": "inventada"}, {"Content-Type": "application/json"})[0], 401)
        k2 = self.request("/api/chave", "POST", {})[1]["k"]
        self.assertEqual(self._cru("/api/sessao", "POST", {"k": k2}, {"Origin": "https://exemplo.com",
                                                                        "Content-Type": "application/json"})[0], 403)
        self.assertEqual(self._cru("/api/boards", headers={"Cookie": "giz1=" + self.token})[0], 401)   # cookie de outra porta
        self.assertEqual(self._cru("/api/chave", "POST", {})[0], 409)   # chave nova só com o código

    def test_arquivo_de_conexao_tem_porta_e_codigo(self):
        con = json.loads((Path(self.temp.name) / ".agente" / "conexao.json").read_text(encoding="utf-8"))
        self.assertEqual((con["porta"], con["token"]), (int(self.base.rsplit(":", 1)[1]), self.token))

    def test_pacote_pede_token_e_vai_e_volta(self):
        status, _ = self.request("/api/boards/levar1", "PUT", {"board": {"title": "Levar", "items": []}, "revision": 0})
        self.assertEqual(status, 200)
        req = urllib.request.Request(self.base + "/api/pacote")
        with self.assertRaises(urllib.error.HTTPError) as e:
            urllib.request.urlopen(req, timeout=10)
        self.assertEqual(e.exception.code, 401)   # sem o código desta conta, nada sai
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
                cls.token = json.loads((Path(cls.temp.name) / ".agente" / "conexao.json").read_text(encoding="utf-8"))["token"]
                urllib.request.urlopen(cls.base + "/api/info", timeout=1).read()
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

    def test_campo_com_tipo_errado_recusa_sem_derrubar_a_conexao(self):
        self.ligar(2)
        bid = self.novo_quadro()
        for pedido in ({"tipo": "texto", "texto": "Oi", "alinhamento": ["x"]}, {"tipo": "forma", "forma": ["x"]}):
            with self.subTest(pedido=pedido):
                code, r = self.itens(bid, pedido)
                self.assertEqual(code, 400, r)
        code, r = self.agente("quadros", "POST", {"titulo": "x", "formato": ["a4"]})
        self.assertEqual(code, 400, r)
        self.assertEqual(self.itens(bid, {"tipo": "texto", "texto": "Oi"})[0], 200)   # o servidor segue no ar

    def test_atualizar_recusa_com_quadro_aberto_em_outra_janela(self):
        self.ping("quadroDeOutraJanela", janela="outraJanela")
        try:
            code, r = self.pagina("/api/atualizacao/instalar", "POST", {"quadro": "quadroDaqui"})
            self.assertEqual(code, 409, r)
            self.assertIn("outra janela", r["erro"])
        finally:
            self.ping(None, janela="outraJanela")

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

    def test_token_de_agente_nao_ascii_e_recusado_sem_fechar_conexao(self):
        self.ligar()
        code, _ = self.agente("estado", headers={"X-Agente": "é"})
        self.assertEqual(code, 401)
        self.assertEqual(self.agente("estado")[0], 200)

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
        self.assertEqual(self.http("/api/agentes")[0], 401)
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

    def test_pptx_que_descompacta_demais_e_recusado(self):
        # auditoria de 29/10/2026: a conferência do .pptx não limitava a soma dos tamanhos descompactados (zip-bomba)
        import io, zipfile
        b = io.BytesIO()
        with zipfile.ZipFile(b, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("[Content_Types].xml", '<Types><Override ContentType="presentationml.presentation.main"/></Types>')
            with z.open("ppt/media/zeros.bin", "w") as f:
                bloco = bytes(1 << 20)
                for _ in range(150):                      # 150 MB de zeros: viram poucos KB comprimidos
                    f.write(bloco)
        with self.assertRaisesRegex(ValueError, "descompactad"):
            server_mod().checar_pptx(b.getvalue())
        b = io.BytesIO()                                   # uma apresentação comum continua passando
        with zipfile.ZipFile(b, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("[Content_Types].xml", '<Types><Override ContentType="presentationml.presentation.main"/></Types>')
            z.writestr("ppt/media/foto.png", os.urandom(2 << 20))
        self.assertEqual(server_mod().checar_pptx(b.getvalue()), ".pptx")

    def test_mcp_pedido_malformado_vira_erro_e_o_processo_segue(self):
        # auditoria de 29/10/2026: name:[] ou tipo:[] (lista onde se espera texto) encerravam o servidor MCP
        proc = subprocess.Popen([sys.executable, str(ROOT / "mcp" / "giz_livre_mcp.py"), "--dados", self.temp.name,
                                 "--porta", "1"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        try:
            pedidos = [{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": [], "arguments": {}}},
                       {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "adicionar_itens",
                        "arguments": {"quadro": "q", "itens": [{"tipo": []}]}}},
                       {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "escrever_texto",
                        "arguments": {"quadro": {"x": 1}}}},
                       {"jsonrpc": "2.0", "id": 4, "method": "initialize", "params": {"protocolVersion": []}},
                       {"jsonrpc": "2.0", "id": 5, "method": "ping"}]
            respostas = []
            for p in pedidos:
                proc.stdin.write(json.dumps(p).encode() + b"\n"); proc.stdin.flush()
                linha = proc.stdout.readline()
                self.assertTrue(linha, f"o processo caiu no pedido {p['id']}")
                respostas.append(json.loads(linha))
            self.assertIn("error", respostas[0])                           # ferramenta desconhecida
            self.assertTrue(respostas[1]["result"]["isError"])             # tipo inválido: erro que o agente lê
            self.assertTrue(respostas[2]["result"]["isError"])
            self.assertEqual(respostas[3]["result"]["serverInfo"]["name"], "giz-livre")
            self.assertEqual(respostas[4]["result"], {})                    # e o processo continua respondendo
        finally:
            proc.stdin.close(); proc.wait(timeout=10)

    def test_mcp_lote_vazio_vira_erro_de_pedido_invalido(self):
        # auditoria de 30/10/2026 (GL-X04): [] era ignorado em silêncio; o JSON-RPC pede o erro -32600
        proc = subprocess.Popen([sys.executable, str(ROOT / "mcp" / "giz_livre_mcp.py"), "--dados", self.temp.name,
                                 "--porta", "1"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        try:
            proc.stdin.write(b"[]\n" + json.dumps({"jsonrpc": "2.0", "id": 9, "method": "ping"}).encode() + b"\n")
            proc.stdin.flush()
            vazio, ping = json.loads(proc.stdout.readline()), json.loads(proc.stdout.readline())
            self.assertEqual((vazio["id"], vazio["error"]["code"]), (None, -32600))
            self.assertEqual((ping["id"], ping["result"]), (9, {}))   # e o processo continua respondendo
        finally:
            proc.stdin.close(); proc.wait(timeout=10)

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

    def test_coleta_de_imagens_nao_apaga_nada_se_um_quadro_nao_se_le(self):
        with tempfile.TemporaryDirectory() as tmp:
            dados = Path(tmp); (dados / "assets").mkdir(); (dados / "lixeira").mkdir()
            img = dados / "assets" / ("a" * 40 + ".png"); img.write_bytes(b"x")
            velho = time.time() - 30 * 86400
            import os; os.utime(img, (velho, velho))
            (dados / "aula.json").write_text('{"items": [{"src": "/assets/' + "a" * 40 + '.png"}]}', encoding="utf-8")
            ler = Path.read_text
            def falha(caminho, *a, **k):
                if caminho.name == "aula.json":
                    raise OSError("arquivo só na nuvem")
                return ler(caminho, *a, **k)
            with patch.object(self.srv, "DADOS", dados), patch.object(self.srv, "LIXEIRA", dados / "lixeira"),                     patch.object(Path, "read_text", falha):
                self.srv.coletar_assets_orfaos()
            self.assertTrue(img.exists(), "a imagem do quadro que não se leu foi apagada")
            (dados / "aula.json").write_text("{}", encoding="utf-8")   # agora ninguém usa a imagem: ela sai
            with patch.object(self.srv, "DADOS", dados), patch.object(self.srv, "LIXEIRA", dados / "lixeira"):
                self.srv.coletar_assets_orfaos()
            self.assertFalse(img.exists())

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


    def test_janela_propria_atualiza_pelo_zip_de_instalacao(self):
        # P60 (29/10/2026): a versão com janela própria é distribuída no zip de instalação (o exe com o programa dentro
        # levava alerta no VirusTotal); o Sobre baixa o zip, confere o SHA-256, extrai e roda o GizLivre.exe de dentro
        import hashlib, io, zipfile
        s = self.srv
        b = io.BytesIO()
        with zipfile.ZipFile(b, "w") as z:
            z.writestr("GizLivre-1.17.0/GizLivre.exe", b"exe da janela")
            z.writestr("GizLivre-1.17.0/instalar.txt", "marca")
            z.writestr("GizLivre-1.17.0/python/pythonw.exe", b"py")
        pacote = b.getvalue()
        base = "https://github.com/HeraldoAntunes/giz-livre/releases/download/v1.17.0/"
        rel = {"tag_name": "v1.17.0", "body": "", "html_url": "https://github.com/HeraldoAntunes/giz-livre/releases/tag/v1.17.0",
               "assets": [{"name": n, "browser_download_url": base + n} for n in ("Instalar-GizLivre-1.17.0.zip", "SHA256SUMS.txt")]}

        def falso(url, limite, timeout=30, aceita=""):
            if url.endswith("SHA256SUMS.txt"):
                return (hashlib.sha256(pacote).hexdigest() + "  Instalar-GizLivre-1.17.0.zip\n").encode()
            return pacote

        real = s.info_atualizacao
        with tempfile.TemporaryDirectory() as tmp, patch.object(s, "DADOS", Path(tmp) / "Giz Livre" / "quadros"), \
                patch.object(s, "VERSAO", "1.16.0"), patch.object(s, "JANELA_PROPRIA", True), \
                patch.object(s, "pode_instalar_sozinho", return_value=True), \
                patch.object(s, "info_atualizacao", side_effect=lambda: real(rel)), \
                patch.object(s, "baixar_https", side_effect=falso), patch.object(s.subprocess, "Popen") as roda:
            self.assertTrue(real(rel)["pode_instalar"])
            s.instalar_atualizacao()
            args = roda.call_args[0][0]
            self.assertEqual(Path(args[0]).name, "GizLivre.exe")
            self.assertEqual(Path(args[0]).read_bytes(), b"exe da janela")          # o exe extraído do zip conferido
            self.assertTrue((Path(args[0]).parent / "python" / "pythonw.exe").exists())   # com a pasta inteira
            self.assertIn("/SILENT", args); self.assertIn("/reabrir=1", args)

    def test_zip_de_instalacao_com_caminho_para_fora_e_recusado(self):
        import io, zipfile
        b = io.BytesIO()
        with zipfile.ZipFile(b, "w") as z:
            z.writestr("../fora.exe", b"x")
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                self.srv.extrair_instalador(b.getvalue(), Path(tmp) / "x")
            self.assertFalse((Path(tmp) / "fora.exe").exists())


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
                info = json.load(urllib.request.urlopen(urllib.request.Request(
                    f"http://127.0.0.1:{porta}/api/info", headers={"X-Lousa": s.TOKEN}), timeout=5))
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
        self.srv.PERFIL_PROPRIO, self.srv.NAVEGADOR_PERFIL, self.srv.TRABALHO_NA_TELA = False, None, False
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

    def test_temporarios_de_queda_brusca_sao_apagados_na_abertura(self):
        with tempfile.TemporaryDirectory() as d:
            q = Path(d) / "quadros"; q.mkdir()
            velho, novo, outro = q / "a.json.x1y2.tmp", q / "b.json.z9.tmp", q / "meu.tmp"
            for f in (velho, novo, outro):
                f.write_text("x")
            os.utime(velho, (time.time() - 600, time.time() - 600))
            os.utime(outro, (time.time() - 600, time.time() - 600))
            self.assertEqual(self.srv.limpar_temporarios(q), 1)
            self.assertEqual((velho.exists(), novo.exists(), outro.exists()), (False, True, True))   # gravação recente e arquivo alheio ficam

    def test_temporarios_na_pasta_de_cima_so_os_do_giz(self):
        # auditoria de 29/10/2026: com --dados, a pasta de cima pode ser de outro programa (Documentos, Área de
        # Trabalho); lá só o temporário do preferencias.json é do Giz Livre
        with tempfile.TemporaryDirectory() as d:
            q = Path(d) / "quadros"; q.mkdir()
            alheio, nosso = Path(d) / "relatorio.json.k3j2.tmp", Path(d) / "preferencias.json.a1b2.tmp"
            for f in (alheio, nosso):
                f.write_text("x")
                os.utime(f, (time.time() - 600, time.time() - 600))
            self.srv.limpar_temporarios(q)
            self.assertTrue(alheio.exists())                       # arquivo de outro programa fica
            self.assertFalse(nosso.exists())

    def test_encerramento_fica_anotado_no_diario(self):
        with tempfile.TemporaryDirectory() as d:
            antes, self.srv.DADOS = self.srv.DADOS, Path(d) / "quadros"
            os.environ.pop("GIZ_SEM_DIARIO")
            try:
                self.assertTrue(self._vigia([15] * 6))
                for i in range(self.srv.DIARIO_MAX + 5):
                    self.srv.diario(f"linha {i}")
                self.srv.diario("fim")
                linhas = (Path(d) / "giz-livre.log").read_text(encoding="utf-8").splitlines()
            finally:
                os.environ["GIZ_SEM_DIARIO"] = "1"; self.srv.DADOS = antes
            self.assertEqual(len(linhas), self.srv.DIARIO_MAX)        # guarda só as mais recentes
            self.assertTrue(linhas[-1].endswith("  fim"))
        with tempfile.TemporaryDirectory() as d:
            self.srv.DADOS, antes = Path(d) / "q", self.srv.DADOS
            os.environ.pop("GIZ_SEM_DIARIO")
            try:
                self._vigia([15] * 6)
                txt = (Path(d) / "giz-livre.log").read_text(encoding="utf-8")
            finally:
                os.environ["GIZ_SEM_DIARIO"] = "1"; self.srv.DADOS = antes
            self.assertIn("sem sinal de nenhuma janela", txt)

    def _vigia_reabrindo(self, falhas, voltas=14):
        # relógio falso com passo de 15 s; `falhas`: hora do relatório de falha do navegador (0 = sem falha)
        s, agora, abertos = self.srv, [1000.0], []
        s.ULTIMA_ATIVIDADE = s.CONTATO_JANELA = 1000.0
        s.NAVEGADOR, s.NAVEGADOR_PERFIL, s.PERFIL_PROPRIO = "edge", None, False

        def abrir(url, evitar=(), proprio=None):
            abertos.append((evitar, proprio)); s.NAVEGADOR_PERFIL = "perfil-proprio"
            s.CONTATO_JANELA = agora[0]          # a janela nova manda sinal

        reab = s.Reabridor("http://x", falha=lambda nav: falhas, abrir=abrir)
        tempos = iter([15] * voltas)

        class Fim(Exception):
            pass

        def dormir(_):
            try:
                agora[0] += next(tempos)
            except StopIteration:
                raise Fim
        try:
            s.vigiar_inatividade(self.falso, 180, passo=15, dormir=dormir, relogio=lambda: agora[0], reabrir=reab)
        except Fim:
            pass
        return abertos

    # o Edge e o perfil próprio dele só existem no Windows (no Linux, falhava; validação de 30/10/2026)
    @unittest.skipUnless(sys.platform == "win32", "Edge do Windows")
    def test_edge_caiu_reabre_no_edge_com_perfil_proprio(self):
        # plataforma explícita (auditoria de 29/10/2026, GL-T1): no Linux o ramo era outro e o teste falhava sem defeito
        with patch.object(self.srv, "WINDOWS", True):
            abertos = self._vigia_reabrindo(falhas=1010.0)   # relatório de falha 10 s depois do último sinal
        self.assertEqual(abertos, [((), True)])
        self.assertTrue(self.srv.PERFIL_PROPRIO)          # as próximas janelas também usam o perfil próprio
        self.assertFalse(self.parou)                      # o programa continua

    def test_caiu_ate_no_perfil_proprio_vai_para_outro_navegador(self):
        s, abertos = self.srv, []
        s.NAVEGADOR, s.NAVEGADOR_PERFIL = "edge", "perfil-proprio"
        r = s.Reabridor("http://x", falha=lambda nav: 1010.0, abrir=lambda u, evitar=(), proprio=None: abertos.append((evitar, proprio)))
        self.assertTrue(r(1000.0, 1120.0))
        self.assertEqual(abertos, [(("edge",), True)])

    def test_fechar_a_janela_sem_falha_encerra_como_antes(self):
        abertos = self._vigia_reabrindo(falhas=0.0)
        self.assertEqual(abertos, [])
        self.assertTrue(self.parou)

    def test_falha_antiga_do_navegador_nao_reabre(self):
        abertos = self._vigia_reabrindo(falhas=500.0)    # relatório de antes de a janela ficar muda
        self.assertEqual((abertos, bool(self.parou)), ([], True))

    def test_reabre_no_maximo_algumas_vezes(self):
        s, abertos = self.srv, []
        s.NAVEGADOR, s.NAVEGADOR_PERFIL = "edge", None
        hora = [100.0]
        r = s.Reabridor("http://x", max_vezes=2, falha=lambda nav: hora[0], abrir=lambda u, evitar=(), proprio=None: abertos.append(1))
        for _ in range(4):
            hora[0] += 50
            r(hora[0] - 10, hora[0])
        self.assertEqual(len(abertos), 2)

    def test_ajustes_da_pagina_guardados_no_programa(self):
        s = self.srv
        with tempfile.TemporaryDirectory() as d:
            antes, s.DADOS = s.DADOS, Path(d) / "quadros"
            try:
                self.assertEqual(s.ler_prefs(), {})
                self.assertTrue(s.guardar_prefs({"lousa.cfg": '{"tool":"pen"}', "outra.coisa": "x", "lousa.n": 3}))
                self.assertEqual(s.ler_prefs(), {"lousa.cfg": '{"tool":"pen"}'})   # só 'lousa.*' com texto
                self.assertFalse(s.guardar_prefs({"lousa.cfg": '{"tool":"pen"}'}))  # igual: não regrava
                self.assertFalse(s.guardar_prefs({"lousa.x": "a" * (s.PREFS_MAX + 1)}))   # grande demais
                self.assertFalse(s.guardar_prefs("lixo"))
                s.PERFIL_PROPRIO = False
                with patch.object(s, "WINDOWS", True):
                    chamadas = []
                    with patch.object(s.subprocess, "Popen", side_effect=lambda a, **k: chamadas.append(a)), \
                         patch.object(s.os.path, "exists", return_value=True):
                        s.abrir_janela("http://127.0.0.1:1/")
                    self.assertTrue(any(a.startswith("--user-data-dir=") for a in chamadas[0]))   # já há cópia: perfil próprio
            finally:
                s.DADOS = antes; s.NAVEGADOR_PERFIL = None

    def test_com_quadro_aberto_o_vigia_nao_encerra(self):
        self.srv.marcar_aberto("j1", "quadro1")            # último sinal: quadro aberto
        self.assertFalse(self._vigia([15] * 20))          # 300 s mudo, limite de 60 s: continua
        self.srv.marcar_aberto("j1", None, pendente=True)  # galeria, mas com edição não salva
        self.assertFalse(self._vigia([15] * 20))
        self.srv.marcar_aberto("j1", None)                 # só a galeria, tudo salvo: encerra como antes
        self.assertTrue(self._vigia([15] * 20))

    def test_suspensao_do_computador_nao_encerra_na_hora(self):
        self.assertFalse(self._vigia([15, 3600, 15, 15]))   # acordou depois de 1 h: a contagem recomeça

    def test_outra_janela_aberta_nao_encerra(self):
        marco = time.time()
        self.srv.CONTATO_JANELA = marco - 5
        self.srv.ABERTOS["outra"] = (None, time.time() - 20)
        self.assertFalse(self.srv.encerrar_se_ninguem_voltou(self.falso, marco))


@unittest.skipUnless((ROOT / "scripts/exportar_publico.py").exists(), "sem scripts/exportar_publico.py")
class ExportTests(unittest.TestCase):
    @unittest.skipUnless(shutil.which("git") and (ROOT / ".git").exists(), "precisa do Git e desta pasta como repositório")
    def test_giz_livre_sh_sai_executavel_na_copia_publica(self):
        # auditoria de 29/10/2026: na cópia pública o giz-livre.sh saía 100644 (a cópia no Windows perde o modo)
        spec = importlib.util.spec_from_file_location("exportar_x", ROOT / "scripts/exportar_publico.py")
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        self.assertIn("giz-livre.sh", module.executaveis())
        with tempfile.TemporaryDirectory(prefix="giz-export-x-") as d:
            subprocess.run(["git", "init", "-q", d], check=True)
            shutil.copy2(ROOT / "giz-livre.sh", Path(d) / "giz-livre.sh")
            self.assertEqual(module.marcar_executaveis(Path(d), ["giz-livre.sh"]), ["giz-livre.sh"])
            modo = subprocess.run(["git", "-C", d, "ls-files", "-s", "giz-livre.sh"], capture_output=True, text=True).stdout
            self.assertTrue(modo.startswith("100755 "), modo)

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
        # itens como o programa grava (com posição): desde a auditoria de 29/10/2026, item sem geometria não entra
        b = {"title": titulo, "items": itens if itens is not None else [{"id": "t1", "type": "text", "text": titulo,
                                                                          "x": 10, "y": 10, "w": 300}],
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
        # revisão 1, como um quadro criado aqui: na 0, um PUT de criação no mesmo id gravava por cima
        self.assertEqual((b["title"], b["folder"], b["_rev"], b["updated"]), ("Aula 1", "Hidráulica", 1, 1000))
        self.assertEqual((self.srv.DADOS / "assets" / nome).read_bytes(), self.PNG)
        self.assertEqual((self.srv.DADOS / "aula1.png").read_bytes(), self.PNG)

    def pacote_com_imagem(self):
        import hashlib
        nome = hashlib.sha1(self.PNG).hexdigest() + ".png"
        (self.srv.DADOS / "assets").mkdir(exist_ok=True)
        (self.srv.DADOS / "assets" / nome).write_bytes(self.PNG)
        self.quadro("aulaImagem", "Aula com imagem",
                    [{"id": "i", "type": "image", "x": 0, "y": 0, "w": 1, "h": 1, "src": "/assets/" + nome}])
        f, resumo = self.pacote()
        self.assertEqual(resumo["falhas"], [])
        self.usar(Path(self.temp.name) / "pc2")
        primeiro = self.srv.trazer_pacote(f)
        self.assertEqual((primeiro["imagens"], primeiro["falhas"]), (1, []))
        arq = self.srv.DADOS / "assets" / nome
        self.assertEqual(arq.read_bytes(), self.PNG)
        return f, arq

    def test_reimportar_repara_imagem_existente_corrompida(self):
        f, arq = self.pacote_com_imagem()
        arq.write_bytes(b"IMAGEM LOCAL CORROMPIDA")
        f.seek(0)
        r = self.srv.trazer_pacote(f)
        self.assertTrue(arq.read_bytes() == self.PNG or r["falhas"],
                        "a imagem deve ser reparada ou a falha precisa aparecer")
        self.assertEqual(arq.read_bytes(), self.PNG)
        self.assertEqual((r["iguais"], r["falhas"]), (1, []))

    def test_reparo_de_imagem_que_falha_avisa_e_preserva_o_arquivo(self):
        f, arq = self.pacote_com_imagem()
        antigo = b"IMAGEM LOCAL CORROMPIDA"
        arq.write_bytes(antigo)
        f.seek(0)
        with patch.object(self.srv.os, "replace", side_effect=OSError("falha simulada de disco")):
            r = self.srv.trazer_pacote(f)
        self.assertTrue(r["falhas"], "reparo que falhou nao pode anunciar integridade")
        self.assertIn("imagem", r["falhas"][0]["motivo"])
        self.assertEqual(arq.read_bytes(), antigo)
        self.assertEqual(list(arq.parent.glob("*.tmp")), [])

    def test_imagem_faltando_aparece_nas_falhas_ao_levar_e_ao_trazer(self):
        # auditoria de 29/10/2026: o quadro apontava para uma imagem que não estava na pasta, e o resumo dizia sucesso
        import io, zipfile
        falta = "f" * 40 + ".png"
        self.quadro("aula1", "Aula 1", [{"id": "i", "type": "image", "src": "/assets/" + falta, "x": 0, "y": 0, "w": 1, "h": 1}])
        self.quadro("aula2", "Aula 2")
        f, resumo = self.pacote()
        self.assertEqual((resumo["quadros"], resumo["imagens"]), (2, 0))          # os quadros vão assim mesmo
        self.assertEqual([x["id"] for x in resumo["falhas"]], ["aula1"])        # e a falta é avisada, com o quadro
        self.assertIn("imagem", resumo["falhas"][0]["motivo"])
        self.usar(Path(self.temp.name) / "pc2")
        r = self.srv.trazer_pacote(f)
        self.assertEqual(r["trazidos"], 2)                                        # nada do que é válido se perde
        self.assertEqual([x["id"] for x in r["falhas"]], ["aula1"])
        self.assertIn("imagem", r["falhas"][0]["motivo"])

    def test_item_com_geometria_invalida_fica_de_fora_ao_trazer(self):
        # auditoria de 29/10/2026: um traço com pts=null entrava e derrubava o desenho do quadro
        bom = {"id": "s1", "type": "stroke", "pts": [1, 2, 0.5, 4, 5, 0.5], "width": 3}
        self.quadro("aula1", "Aula 1", [bom, {"id": "s2", "type": "stroke", "pts": None, "width": 3},
                                         {"id": "r1", "type": "shape", "kind": "rect", "x1": 0, "y1": "x", "x2": 1, "y2": 1, "width": 2}])
        f, _ = self.pacote()
        self.usar(Path(self.temp.name) / "pc2")
        r = self.srv.trazer_pacote(f)
        b = json.loads((self.srv.DADOS / "aula1.json").read_text(encoding="utf-8"))
        self.assertEqual([i["id"] for i in b["items"]], ["s1"])     # o quadro vem com o que é válido
        self.assertEqual(r["trazidos"], 1)
        self.assertIn("2 item(ns)", r["falhas"][0]["motivo"])      # e o que ficou de fora é avisado

    def test_metadado_de_origem_invalido_nao_contamina_importacoes(self):
        import io, zipfile
        def pacote(bid, **extra):
            f = io.BytesIO()
            with zipfile.ZipFile(f, "w") as z:
                z.writestr("manifesto.json", '{"formato":1}')
                z.writestr(f"quadros/{bid}.json", json.dumps({"title": bid, "items": [], **extra}))
            f.seek(0)
            return f
        controle = self.srv.trazer_pacote(pacote("controle", trazido_de={"id": "anterior", "impressao": "abc"}))
        self.assertEqual(controle["trazidos"], 1)
        for n, origem in enumerate(({"id": [], "impressao": []}, {"id": 7, "impressao": 9}, [], 42)):
            with self.subTest(origem=origem):
                # o quadro vem sem o metadado inválido (a aula não se perde por causa dele)
                primeiro = self.srv.trazer_pacote(pacote(f"hostil{n}", trazido_de=origem))
                self.assertEqual(primeiro["trazidos"], 1)
                gravado = json.loads((self.srv.DADOS / f"hostil{n}.json").read_text(encoding="utf-8"))
                self.assertNotIn("trazido_de", gravado)
                segundo = self.srv.trazer_pacote(pacote(f"proximo{n}"))
                self.assertEqual(segundo["trazidos"], 1)
                self.assertTrue((self.srv.DADOS / f"proximo{n}.json").exists())

    def test_origens_antigas_contaminadas_nao_derrubam_novo_pacote(self):
        self.quadro("novo", "Importação legítima")
        f, _ = self.pacote()
        self.usar(Path(self.temp.name) / "pc2")
        for n, origem in enumerate(({"id": [], "impressao": []}, {"id": 3, "impressao": []}, [], 7)):
            self.quadro(f"antigo{n}", "Quadro antigo", trazido_de=origem)
        antes = {p: p.read_bytes() for p in self.srv.DADOS.glob("antigo*.json")}
        r = self.srv.trazer_pacote(f)
        self.assertEqual(r["trazidos"], 1)
        self.assertTrue((self.srv.DADOS / "novo.json").exists())
        self.assertEqual({p: p.read_bytes() for p in antes}, antes)

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
        antigo = {"title": "Antigo", "items": [{"type": "text", "text": "a", "x": 0, "y": 0, "w": 50},
                                               {"type": "text", "text": "b", "x": 0, "y": 60, "w": 50}]}
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
        ruim = {"title": "x", "items": [{"id": "a", "type": "image", "src": "https://exemplo.com/espiao.png", "x": 0, "y": 0, "w": 9, "h": 9},
                                        {"id": "b", "type": "text", "text": "fica", "x": 0, "y": 0, "w": 90}]}
        f = self.zip_feito({"manifesto.json": man, "../../fora.json": json.dumps(ruim), "quadros/../fora2.json": "{}",
                            "quadros/con.json": json.dumps(ruim), "quadros/bom.json": json.dumps(ruim),
                            "assets/" + "1" * 40 + ".png": self.PNG})   # sha1 não confere
        r = self.srv.trazer_pacote(f)
        self.assertEqual(r["trazidos"], 1)
        # desde a auditoria de 29/10/2026, a imagem externa tirada do quadro também é avisada (antes, saía calada)
        self.assertEqual([x["motivo"][:28] for x in r["falhas"]], ["imagem danificada", "1 item(ns) danificado(s) ou "])
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

    def test_zip_com_nomes_duplicados_e_recusado_antes_de_gravar(self):
        import io, warnings, zipfile
        self.quadro("controle", "Controle preservado")
        antes = {p.name: p.read_bytes() for p in self.srv.DADOS.iterdir()}
        quadro = json.dumps({"title": "Novo", "items": []})
        for duplicado in ("manifesto.json", "quadros/ambiguo.json", "assets/" + "a" * 40 + ".png"):
            with self.subTest(duplicado=duplicado):
                f = io.BytesIO()
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", UserWarning)
                    with zipfile.ZipFile(f, "w") as z:
                        z.writestr("manifesto.json", '{"formato":1}')
                        z.writestr("quadros/novo.json", quadro)
                        if duplicado != "manifesto.json":
                            z.writestr(duplicado, quadro)
                        z.writestr(duplicado, quadro)
                f.seek(0)
                with self.assertRaisesRegex(ValueError, "duplicad"):
                    self.srv.trazer_pacote(f)
                self.assertEqual({p.name: p.read_bytes() for p in self.srv.DADOS.iterdir()}, antes)

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



class DuasContasTests(unittest.TestCase):
    """Duas contas do Windows no mesmo PC (troca rápida de usuário): cada uma com seus dados e seu arquivo de conexão.
    A segunda não derruba a primeira e usa a próxima porta; uma não lê os quadros da outra."""

    def test_segunda_conta_usa_outra_porta_sem_derrubar_a_primeira(self):
        with tempfile.TemporaryDirectory() as a, tempfile.TemporaryDirectory() as b:
            with socket.socket() as sock:
                sock.bind(("127.0.0.1", 0)); porta = sock.getsockname()[1]
            procs = []
            try:
                def subir(pasta):
                    p = subprocess.Popen([sys.executable, str(ROOT / "server.py"), "--sem-janela", "--porta", str(porta),
                                          "--dados", pasta], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    procs.append(p)
                    arq = Path(pasta) / ".agente" / "conexao.json"
                    for _ in range(100):
                        if arq.exists():
                            return json.loads(arq.read_text(encoding="utf-8"))
                        time.sleep(.1)
                    raise RuntimeError("não abriu")
                ca = subir(a)
                urllib.request.urlopen(urllib.request.Request(f"http://127.0.0.1:{porta}/api/boards/daconta1", method="PUT",
                    data=json.dumps({"board": {"title": "Só da conta A", "items": []}, "revision": 0}).encode(),
                    headers={"X-Lousa": ca["token"], "Content-Type": "application/json"}), timeout=5).read()
                cb = subir(b)
                self.assertEqual(ca["porta"], porta)
                self.assertNotEqual(cb["porta"], porta)            # a segunda conta foi para a próxima porta
                self.assertIsNone(procs[0].poll())                  # e a primeira continua aberta
                # abrir de novo na mesma conta e pasta: não sobe outro servidor (só pediria outra janela ao que está aberto)
                c = subprocess.run([sys.executable, str(ROOT / "server.py"), "--sem-janela", "--porta", str(porta),
                                    "--dados", a], capture_output=True, timeout=30)
                self.assertEqual(c.returncode, 0)
                self.assertEqual(json.loads((Path(a) / ".agente" / "conexao.json").read_text(encoding="utf-8"))["pid"], procs[0].pid)
                for token in (cb["token"], ""):                     # a conta B não lê os quadros da conta A
                    req = urllib.request.Request(f"http://127.0.0.1:{porta}/api/boards", headers={"X-Lousa": token})
                    with self.assertRaises(urllib.error.HTTPError) as e:
                        urllib.request.urlopen(req, timeout=5)
                    self.assertEqual(e.exception.code, 401)
            finally:
                for p in procs:
                    p.terminate(); p.wait()


def server_mod():
    """O server.py como módulo, para testar funções soltas (carregado uma vez)."""
    global _SERVER_MOD
    if _SERVER_MOD is None:
        spec = importlib.util.spec_from_file_location("servidor_solto", ROOT / "server.py")
        _SERVER_MOD = importlib.util.module_from_spec(spec); spec.loader.exec_module(_SERVER_MOD)
    return _SERVER_MOD


_SERVER_MOD = None


class AuditorTests(unittest.TestCase):
    """Testes independentes do auditor externo (29/10/2026) que ainda não estavam na suíte, adaptados ao código atual."""

    def test_gravacao_atomica_que_falha_preserva_o_arquivo_anterior(self):
        s = server_mod()
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "quadro.json"; p.write_bytes(b"ANTIGO")
            with patch.object(s.os, "replace", side_effect=OSError("falha de disco simulada")):
                with self.assertRaises(OSError):
                    s.gravar_atomico(p, b"NOVO")
            self.assertEqual(p.read_bytes(), b"ANTIGO")
            self.assertEqual(list(Path(d).glob("*.tmp")), [])

    def test_pptx_com_tamanho_declarado_de_3_gb_e_recusado(self):
        # só os metadados do zip são adulterados (o conteúdo é minúsculo): a guarda vale antes de descompactar
        import io, struct, zipfile
        b = io.BytesIO()
        with zipfile.ZipFile(b, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("[Content_Types].xml", "<Types>presentationml.presentation.main</Types>")
            z.writestr("ppt/media/image1.png", b"x")
        raw = bytearray(b.getvalue()); ini = 0
        while (p := raw.find(b"PK\x01\x02", ini)) >= 0:
            n = struct.unpack_from("<H", raw, p + 28)[0]
            if bytes(raw[p + 46:p + 46 + n]) == b"ppt/media/image1.png":
                struct.pack_into("<I", raw, p + 24, 3_000_000_000)
            ini = p + 46 + n
        with self.assertRaises(ValueError):
            server_mod().checar_pptx(bytes(raw))


class JanelaPropriaTests(unittest.TestCase):
    """Janela própria (P60): o GizLivre.exe (Tauri) roda o server.py como processo filho, com --pai."""

    def test_servidor_sai_quando_a_janela_morre(self):
        with tempfile.TemporaryDirectory() as d:
            pai = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"])
            srv = subprocess.Popen([sys.executable, str(ROOT / "server.py"), "--sem-janela", "--porta", "0", "--dados", d,
                                    "--pai", str(pai.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                   env={**os.environ, "GIZ_SEM_DIARIO": "1"})
            try:
                arq = Path(d) / ".agente" / "conexao.json"
                for _ in range(100):
                    if arq.exists():
                        break
                    time.sleep(.1)
                self.assertTrue(arq.exists())
                self.assertIsNone(srv.poll())                       # com a janela viva, o servidor fica
                pai.kill(); pai.wait()                              # a janela morre de repente (Gerenciador de Tarefas)
                self.assertEqual(srv.wait(timeout=15), 0)           # o servidor sai sozinho, sem ficar órfão
                self.assertFalse(arq.exists())                      # e apaga o arquivo de conexão
            finally:
                for p in (pai, srv):
                    if p.poll() is None:
                        p.kill(); p.wait()

    def test_quadro_corrompido_nao_derruba_a_galeria(self):
        # auditoria de 29/10/2026 (rodada 2): um arquivo corrompido não pode derrubar os quadros bons
        s = server_mod()
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / "bom.json").write_text(json.dumps({"title": "Bom", "items": [], "updated": 1}), encoding="utf-8")
            (Path(d) / "ruim.json").write_text('{"title": "Ru', encoding="utf-8")
            with patch.object(s, "DADOS", Path(d)):
                s.RESUMOS.clear()
                self.assertEqual([q["id"] for q in s.listar_quadros()], ["bom"])

    def test_aviso_quando_ha_versao_antiga_para_todos_os_usuarios(self):
        # auditoria de 29/10/2026: o Inno permitia instalar para todos; a janela própria só instala na conta
        s = server_mod()
        self.assertIn("1.15.2", s.aviso_instalacao_para_todos(lambda: "1.15.2"))
        self.assertIn("administrador", s.aviso_instalacao_para_todos(lambda: "1.15.2"))

        def nada():
            raise FileNotFoundError
        self.assertEqual(s.aviso_instalacao_para_todos(nada), "")

    def test_gravacao_que_ja_chegou_termina_mesmo_com_a_janela_saindo(self):
        # auditoria de 29/10/2026 (rodada 2): ao fechar, esperar a gravação que já saiu. A janela sai logo depois de a
        # página mandar o quadro; o servidor (que sai junto com a janela) tem de terminar a gravação que já recebeu
        with tempfile.TemporaryDirectory() as d:
            pai = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"])
            with socket.socket() as sock:
                sock.bind(("127.0.0.1", 0)); porta = sock.getsockname()[1]
            srv = subprocess.Popen([sys.executable, str(ROOT / "server.py"), "--sem-janela", "--porta", str(porta),
                                    "--dados", d, "--pai", str(pai.pid)], stdout=subprocess.DEVNULL,
                                   stderr=subprocess.DEVNULL, env={**os.environ, "GIZ_SEM_DIARIO": "1"})
            try:
                arq = Path(d) / ".agente" / "conexao.json"
                for _ in range(100):
                    if arq.exists():
                        break
                    time.sleep(.1)
                token = json.loads(arq.read_text(encoding="utf-8"))["token"]
                corpo = json.dumps({"board": {"title": "Última", "items": []}, "revision": 0}).encode()
                c = socket.create_connection(("127.0.0.1", porta))
                c.sendall((f"PUT /api/boards/ultima HTTP/1.1\r\nHost: 127.0.0.1:{porta}\r\nX-Lousa: {token}\r\n"
                           f"Content-Type: application/json\r\nContent-Length: {len(corpo)}\r\n\r\n").encode())
                time.sleep(.3)
                pai.kill(); pai.wait()                  # a janela sai com a gravação a caminho
                time.sleep(1)
                c.sendall(corpo)                        # o resto da gravação chega depois
                c.settimeout(10)
                resposta = c.recv(200)
                c.close()
                self.assertIn(b" 200 ", resposta.split(b"\r\n")[0])
                self.assertEqual(srv.wait(timeout=20), 0)
                self.assertEqual(json.loads((Path(d) / "ultima.json").read_text(encoding="utf-8"))["title"], "Última")
            finally:
                for p in (pai, srv):
                    if p.poll() is None:
                        p.kill(); p.wait()

    def test_pasta_do_programa_e_dados_na_janela_propria(self):
        with tempfile.TemporaryDirectory() as raiz:
            codigo = ("import server, json; print(json.dumps([server.JANELA_PROPRIA, server.INSTALADO, str(server.RAIZ), "
                      "str(server.pasta_dados_padrao()), server.pode_instalar_sozinho()]))")
            env = {**os.environ, "GIZ_LIVRE_JANELA": "1", "GIZ_LIVRE_PASTA": raiz, "GIZ_SEM_DIARIO": "1"}
            r = json.loads(subprocess.run([sys.executable, "-c", codigo], cwd=ROOT, env=env, capture_output=True,
                                          text=True, timeout=30).stdout)
            self.assertEqual(r[:3], [True, True, str(Path(raiz).resolve())])
            self.assertNotEqual(Path(r[3]), Path(raiz).resolve() / "quadros")   # instalado: quadros em Documentos
            self.assertEqual(r[4], sys.platform == "win32")        # instalada: atualiza pelo Sobre
            (Path(raiz) / "portatil.txt").write_text("x", encoding="utf-8")
            r = json.loads(subprocess.run([sys.executable, "-c", codigo], cwd=ROOT, env=env, capture_output=True,
                                          text=True, timeout=30).stdout)
            self.assertEqual(Path(r[3]), Path(raiz).resolve() / "quadros")      # portátil: quadros ao lado do programa
            self.assertFalse(r[4])                                  # e não se atualiza sozinha (página de downloads)


class RestauracaoConcorrenteTests(unittest.TestCase):
    def test_duas_restauracoes_da_mesma_origem_respondem_sem_perder_dados(self):
        import threading
        from concurrent.futures import ThreadPoolExecutor
        spec = importlib.util.spec_from_file_location("servidor_restauracao", ROOT / "server.py")
        s = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(s)
        with tempfile.TemporaryDirectory(prefix="giz-restauracao-") as pasta:
            s.DADOS = Path(pasta)
            s.LIXEIRA = s.DADOS / "lixeira"
            s.LIXEIRA.mkdir()
            original = b'{"title":"Original preservado","items":[]}'
            (s.DADOS / "aula.json").write_bytes(original)
            nome = "aula_20261029-120001"
            origem = s.LIXEIRA / (nome + ".json")
            restaurado = b'{"title":"Restaurar uma unica copia","items":[]}'
            origem.write_bytes(restaurado)
            srv = s.Servidor(("127.0.0.1", 0), s.Handler)
            s.PORTA = srv.server_address[1]
            thread = threading.Thread(target=srv.serve_forever, kwargs={"poll_interval": .02}, daemon=True)
            thread.start()
            def restaurar():
                conn = http.client.HTTPConnection("127.0.0.1", s.PORTA, timeout=5)
                try:
                    conn.request("POST", "/api/lixeira/restaurar", json.dumps({"nome": nome}),
                                 {"X-Lousa": s.TOKEN, "Content-Type": "application/json"})
                    r = conn.getresponse()
                    return r.status, json.loads(r.read())
                except (http.client.RemoteDisconnected, ConnectionResetError):
                    return None, None
                finally:
                    conn.close()
            mover = s.os.replace
            tentativas = []
            def mover_devagar(src, dst, *args, **kwargs):
                if Path(src) == origem:
                    tentativas.append(dst)
                    time.sleep(.12)
                return mover(src, dst, *args, **kwargs)
            try:
                with patch.object(s.os, "replace", side_effect=mover_devagar):
                    with ThreadPoolExecutor(max_workers=2) as pool:
                        respostas = list(pool.map(lambda _: restaurar(), range(2)))
                self.assertGreaterEqual(len(tentativas), 1)
                self.assertEqual((s.DADOS / "aula.json").read_bytes(), original)
                self.assertEqual(len([p for p in s.DADOS.glob("*.json") if p.read_bytes() == restaurado]), 1)
                statuses = [r[0] for r in respostas]
                self.assertEqual(statuses.count(200), 1)
                self.assertTrue(all(code in (200, 404, 409) for code in statuses), respostas)
            finally:
                srv.shutdown()
                srv.server_close()
                thread.join(timeout=5)
                self.assertFalse(thread.is_alive())

    def test_duas_versoes_do_mesmo_quadro_restauradas_juntas_ganham_ids_diferentes(self):
        # validação no Linux da rc.2: as duas escolhiam o mesmo id e a segunda voltava 409 (que a página tomava por
        # sessão perdida)
        import threading
        from concurrent.futures import ThreadPoolExecutor
        spec = importlib.util.spec_from_file_location("servidor_restauracao2", ROOT / "server.py")
        s = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(s)
        with tempfile.TemporaryDirectory(prefix="giz-restauracao-") as pasta:
            s.DADOS = Path(pasta)
            s.LIXEIRA = s.DADOS / "lixeira"
            s.LIXEIRA.mkdir()
            nomes = ["aula_20261029-120001", "aula_20261029-120002"]
            for n, nome in enumerate(nomes):
                (s.LIXEIRA / (nome + ".json")).write_text(json.dumps({"title": f"Versão {n}", "items": []}))
            srv = s.Servidor(("127.0.0.1", 0), s.Handler)
            s.PORTA = srv.server_address[1]
            thread = threading.Thread(target=srv.serve_forever, kwargs={"poll_interval": .02}, daemon=True)
            thread.start()
            def restaurar(nome):
                conn = http.client.HTTPConnection("127.0.0.1", s.PORTA, timeout=5)
                try:
                    conn.request("POST", "/api/lixeira/restaurar", json.dumps({"nome": nome}),
                                 {"X-Lousa": s.TOKEN, "Content-Type": "application/json"})
                    r = conn.getresponse()
                    return r.status, json.loads(r.read())
                finally:
                    conn.close()
            mover = s.os.replace
            def mover_devagar(src, dst, *args, **kwargs):
                time.sleep(.12)
                return mover(src, dst, *args, **kwargs)
            try:
                with patch.object(s.os, "replace", side_effect=mover_devagar):
                    with ThreadPoolExecutor(max_workers=2) as pool:
                        respostas = list(pool.map(restaurar, nomes))
                self.assertEqual([r[0] for r in respostas], [200, 200], respostas)
                ids = {r[1]["id"] for r in respostas}
                self.assertEqual(len(ids), 2)
                self.assertEqual(sorted(json.loads((s.DADOS / f"{i}.json").read_text())["title"] for i in ids),
                                 ["Versão 0", "Versão 1"])
                self.assertEqual(s.ID_RESERVADOS, set())
            finally:
                srv.shutdown()
                srv.server_close()
                thread.join(timeout=5)

    def test_409_de_sessao_diz_que_e_de_sessao(self):
        spec = importlib.util.spec_from_file_location("servidor_sessao", ROOT / "server.py")
        s = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(s)
        import threading
        with tempfile.TemporaryDirectory(prefix="giz-sessao-") as pasta:
            s.DADOS = Path(pasta)
            srv = s.Servidor(("127.0.0.1", 0), s.Handler)
            s.PORTA = srv.server_address[1]
            thread = threading.Thread(target=srv.serve_forever, kwargs={"poll_interval": .02}, daemon=True)
            thread.start()
            try:
                conn = http.client.HTTPConnection("127.0.0.1", s.PORTA, timeout=5)
                conn.request("PUT", "/api/boards/q1", json.dumps({"board": {"title": "q", "items": []}, "revision": 0}),
                             {"X-Lousa": "codigo-velho", "Content-Type": "application/json"})
                r = conn.getresponse()
                self.assertEqual((r.status, json.loads(r.read()).get("sessao")), (409, True))
                conn.close()
            finally:
                srv.shutdown()
                srv.server_close()
                thread.join(timeout=5)

    def test_quadro_que_nao_sai_da_lixeira_devolve_a_miniatura_e_a_nova_tentativa_traz_os_dois(self):
        # auditoria da rc.3: com o quadro movido e a miniatura falhando, ela ficava na lixeira e a nova tentativa
        # dava 404; agora a miniatura vai antes e volta se o quadro não sair
        import threading
        spec = importlib.util.spec_from_file_location("servidor_miniatura", ROOT / "server.py")
        s = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(s)
        with tempfile.TemporaryDirectory(prefix="giz-miniatura-") as pasta:
            s.DADOS = Path(pasta)
            s.LIXEIRA = s.DADOS / "lixeira"
            s.LIXEIRA.mkdir()
            nome = "aula_20261030-120000"
            (s.LIXEIRA / f"{nome}.json").write_text('{"title":"Aula","items":[]}')
            (s.LIXEIRA / f"{nome}.png").write_bytes(b"miniatura")
            srv = s.Servidor(("127.0.0.1", 0), s.Handler)
            s.PORTA = srv.server_address[1]
            thread = threading.Thread(target=srv.serve_forever, kwargs={"poll_interval": .02}, daemon=True)
            thread.start()
            def restaurar():
                conn = http.client.HTTPConnection("127.0.0.1", s.PORTA, timeout=5)
                try:
                    conn.request("POST", "/api/lixeira/restaurar", json.dumps({"nome": nome}),
                                 {"X-Lousa": s.TOKEN, "Content-Type": "application/json"})
                    r = conn.getresponse()
                    return r.status, json.loads(r.read())
                finally:
                    conn.close()
            mover = s.os.replace
            def quadro_preso(src, dst, *args, **kwargs):
                if str(src).endswith(".json"):
                    raise OSError("arquivo em uso")
                return mover(src, dst, *args, **kwargs)
            try:
                with patch.object(s.os, "replace", side_effect=quadro_preso), patch.object(s, "registrar"):
                    status, corpo = restaurar()
                self.assertEqual(status, 500)
                self.assertIn("continua na lixeira", corpo["erro"])
                self.assertEqual((s.LIXEIRA / f"{nome}.png").read_bytes(), b"miniatura")
                self.assertFalse((s.DADOS / "aula.png").exists())
                status, corpo = restaurar()
                self.assertEqual((status, corpo["id"]), (200, "aula"))
                self.assertEqual((s.DADOS / "aula.png").read_bytes(), b"miniatura")
                self.assertTrue((s.DADOS / "aula.json").exists())
                self.assertFalse(any(s.LIXEIRA.iterdir()))
            finally:
                srv.shutdown()
                srv.server_close()
                thread.join(timeout=5)

    def test_fora_do_windows_a_pasta_da_conta_segue_o_xdg(self):
        spec = importlib.util.spec_from_file_location("servidor_xdg", ROOT / "server.py")
        s = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(s)
        from pathlib import PurePosixPath   # no Windows não se cria PosixPath: o caminho é só comparado
        with patch.object(s.os, "name", "posix"), patch.object(s, "Path", PurePosixPath),                 patch.dict(s.os.environ, {"XDG_DATA_HOME": "/dados/xdg"}):
            self.assertEqual(s.pasta_da_conta(), PurePosixPath("/dados/xdg/giz-livre"))
            s.DADOS_ESCOLHIDOS = False
            self.assertEqual(s.arquivo_conexao(), PurePosixPath("/dados/xdg/giz-livre/conexao.json"))


class RestauracaoPublicacaoTests(unittest.TestCase):
    """HTTP real, dados isolados e pausa antes da trava do destino, sem modificar o servidor."""

    def setUp(self):
        import threading
        self.temp = tempfile.TemporaryDirectory(prefix="giz-restauracao-publicacao-")
        self.addCleanup(self.temp.cleanup)
        spec = importlib.util.spec_from_file_location("servidor_publicacao_concorrente", ROOT / "server.py")
        self.s = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.s)
        self.s.DADOS = Path(self.temp.name)
        self.s.LIXEIRA = self.s.DADOS / "lixeira"
        self.s.LIXEIRA.mkdir()
        (self.s.DADOS / "assets").mkdir()
        self.bid = "same"
        self.nome = self.bid + "_20261030-120001"
        self.original = {"title": "Conteúdo da lixeira",
                         "items": [{"id": "texto-antigo", "type": "text", "text": "Não perder a origem",
                                    "x": 10, "y": 10, "w": 200}],
                         "background": {"color": "#ffffff", "pattern": "none"}}
        self.origem = self.s.LIXEIRA / (self.nome + ".json")
        self.bytes_origem = json.dumps(self.original, ensure_ascii=False).encode("utf-8")
        self.origem.write_bytes(self.bytes_origem)
        self.mini_origem = self.s.LIXEIRA / (self.nome + ".png")
        self.png_origem = bytes.fromhex("89504e470d0a1a0a") + b"miniatura da lixeira"
        self.mini_origem.write_bytes(self.png_origem)
        self.pausar = False
        self.escolheu = threading.Event()
        self.liberar = threading.Event()
        self.segunda_iniciou = threading.Event()
        self.contexto = threading.local()
        contador = threading.Lock()
        self.iniciadas = 0
        teste = self

        class HandlerTeste(self.s.Handler):
            def _restaurar(handler):
                with contador:
                    teste.iniciadas += 1
                    if teste.iniciadas == 2:
                        teste.segunda_iniciou.set()
                teste.contexto.restaurando = True
                teste.contexto.pausou = False
                try:
                    return super()._restaurar()
                finally:
                    teste.contexto.restaurando = False

        trava_original = self.s.trava

        def trava_com_pausa(bid):
            if (self.pausar and bid == self.bid and getattr(self.contexto, "restaurando", False)
                    and not self.contexto.pausou):
                self.contexto.pausou = True
                self.id_escolhido = bid
                self.escolheu.set()
                if not self.liberar.wait(timeout=10):
                    raise TimeoutError("o teste não liberou a restauração antes da trava do destino")
            return trava_original(bid)

        interceptacao = patch.object(self.s, "trava", side_effect=trava_com_pausa)
        interceptacao.start()
        self.addCleanup(interceptacao.stop)
        self.http = self.s.Servidor(("127.0.0.1", 0), HandlerTeste)
        self.s.PORTA = self.http.server_address[1]
        self.thread = threading.Thread(target=self.http.serve_forever, kwargs={"poll_interval": .02}, daemon=True)
        self.addCleanup(self.encerrar)
        self.thread.start()

    def encerrar(self):
        self.liberar.set()
        self.http.shutdown()
        self.http.server_close()
        self.thread.join(timeout=5)
        self.assertFalse(self.thread.is_alive(), "servidor temporário não terminou")

    def pedido(self, rota, metodo="POST", dados=None, tipo="application/json"):
        corpo = dados if isinstance(dados, bytes) else json.dumps(dados).encode("utf-8") if dados is not None else None
        conn = http.client.HTTPConnection("127.0.0.1", self.s.PORTA, timeout=15)
        try:
            conn.request(metodo, rota, corpo, {"X-Lousa": self.s.TOKEN, "Content-Type": tipo})
            resposta = conn.getresponse()
            return resposta.status, json.loads(resposta.read())
        finally:
            conn.close()

    def restaurar(self):
        return self.pedido("/api/lixeira/restaurar", dados={"nome": self.nome})

    def conferir_restaurado(self, resposta):
        status, corpo = resposta
        self.assertEqual(status, 200, resposta)
        bid = corpo.get("id")
        self.assertTrue(isinstance(bid, str) and self.s.ID_OK.fullmatch(bid), resposta)
        self.assertEqual(json.loads((self.s.DADOS / (bid + ".json")).read_text(encoding="utf-8")), self.original)
        self.assertEqual((self.s.DADOS / (bid + ".png")).read_bytes(), self.png_origem)
        self.assertFalse(self.origem.exists())
        self.assertFalse(self.mini_origem.exists())
        self.assertEqual(self.s.ID_RESERVADOS, set())
        return bid

    def disputar_publicacao(self, operacao):
        import base64
        import io
        import zipfile
        from concurrent.futures import ThreadPoolExecutor
        publicado = {"title": "Conteúdo recém-publicado por " + operacao,
                     "items": [{"id": "texto-novo", "type": "text", "text": "Não sobrescrever este quadro",
                                "x": 20, "y": 20, "w": 250}],
                     "background": {"color": "#abcdef", "pattern": "none"}}
        png_publicado = bytes.fromhex("89504e470d0a1a0a") + b"miniatura recem-publicada"
        self.pausar = True
        with ThreadPoolExecutor(max_workers=1) as pool:
            futuro = pool.submit(self.restaurar)
            try:
                self.assertTrue(self.escolheu.wait(timeout=10), "a restauração não chegou à barreira")
                self.assertEqual(self.id_escolhido, self.bid)
                self.assertFalse((self.s.DADOS / (self.bid + ".json")).exists())
                self.assertEqual(self.origem.read_bytes(), self.bytes_origem)
                if operacao == "criacao":
                    publicacao = self.pedido("/api/boards/" + self.bid, "PUT", {
                        "board": publicado, "revision": 0,
                        "thumb": "data:image/png;base64," + base64.b64encode(png_publicado).decode("ascii")})
                    self.assertEqual(publicacao[0], 200, publicacao)
                    self.assertEqual(publicacao[1]["revision"], 1)
                else:
                    pacote = io.BytesIO()
                    with zipfile.ZipFile(pacote, "w", zipfile.ZIP_DEFLATED) as z:
                        z.writestr("manifesto.json", json.dumps({"formato": self.s.FORMATO_PACOTE}))
                        z.writestr("quadros/" + self.bid + ".json", json.dumps(publicado))
                        z.writestr("quadros/" + self.bid + ".png", png_publicado)
                    publicacao = self.pedido("/api/pacote", dados=pacote.getvalue(), tipo="application/zip")
                    self.assertEqual(publicacao[0], 200, publicacao)
                    self.assertEqual((publicacao[1]["trazidos"], publicacao[1]["copias"], publicacao[1]["falhas"]),
                                     (1, 0, []))
                destino = self.s.DADOS / (self.bid + ".json")
                bytes_publicados = destino.read_bytes()
                self.assertEqual(json.loads(bytes_publicados)["items"], publicado["items"])
                self.assertEqual((self.s.DADOS / (self.bid + ".png")).read_bytes(), png_publicado)
            finally:
                self.liberar.set()
            resposta = futuro.result(timeout=20)

        self.assertEqual(destino.read_bytes(), bytes_publicados,
                         "a restauração sobrescreveu o quadro publicado enquanto aguardava a trava; "
                         f"publicacao={publicacao[0]}, restauracao={resposta[0]}, "
                         f"origem_na_lixeira={self.origem.exists()}")
        self.assertEqual((self.s.DADOS / (self.bid + ".png")).read_bytes(), png_publicado,
                         "a miniatura recém-publicada deve ficar intacta")
        if resposta[0] == 200:
            self.assertNotEqual(resposta[1].get("id"), self.bid, "sucesso precisa usar outro id")
            self.conferir_restaurado(resposta)
        else:
            self.assertIn(resposta[0], (409, 412, 423), resposta)
            self.assertTrue(resposta[1].get("erro"), "conflito deve explicar o motivo")
            self.assertEqual(self.origem.read_bytes(), self.bytes_origem,
                             "conflito não pode consumir nem alterar a origem na lixeira")
            self.assertEqual(self.mini_origem.read_bytes(), self.png_origem)
            self.assertEqual(self.s.ID_RESERVADOS, set())
            # O conflito é recuperável: uma nova tentativa conserva os dois conteúdos.
            self.assertNotEqual(self.conferir_restaurado(self.restaurar()), self.bid)
        self.assertEqual(destino.read_bytes(), bytes_publicados)
        self.assertEqual((self.s.DADOS / (self.bid + ".png")).read_bytes(), png_publicado)
        self.assertEqual(len(list(self.s.DADOS.glob("*.json"))), 2)

    def test_restauracao_nao_sobrescreve_criacao_publicada_durante_a_pausa(self):
        self.disputar_publicacao("criacao")

    def test_restauracao_nao_sobrescreve_pacote_publicado_durante_a_pausa(self):
        self.disputar_publicacao("pacote")

    def test_controle_restauracao_sem_concorrencia_preserva_quadro_e_miniatura(self):
        self.assertEqual(self.conferir_restaurado(self.restaurar()), self.bid)
        self.assertEqual(len(list(self.s.DADOS.glob("*.json"))), 1)

    def test_controle_duas_restauracoes_da_mesma_origem_tem_um_sucesso_e_uma_recusa(self):
        from concurrent.futures import ThreadPoolExecutor
        self.pausar = True
        with ThreadPoolExecutor(max_workers=2) as pool:
            primeira = pool.submit(self.restaurar)
            try:
                self.assertTrue(self.escolheu.wait(timeout=10), "primeiro pedido não chegou à barreira")
                segunda = pool.submit(self.restaurar)
                self.assertTrue(self.segunda_iniciou.wait(timeout=10), "segundo pedido não começou")
            finally:
                self.liberar.set()
            respostas = [primeira.result(timeout=20), segunda.result(timeout=20)]
        statuses = [r[0] for r in respostas]
        self.assertEqual(statuses.count(200), 1, respostas)
        self.assertTrue(all(code in (200, 404, 409, 412, 423) for code in statuses), respostas)
        self.conferir_restaurado(next(r for r in respostas if r[0] == 200))
        self.assertTrue(next(r for r in respostas if r[0] != 200)[1].get("erro"))
        self.assertEqual(len(list(self.s.DADOS.glob("*.json"))), 1)


class IdPublicavelTests(unittest.TestCase):
    """Contrato único de quem publica um quadro com id novo (auditoria da rc.4: o agente de IA e a cópia na
    importação escolhiam o id sem conferir de novo sob a trava)."""

    def setUp(self):
        spec = importlib.util.spec_from_file_location("servidor_id", ROOT / "server.py")
        self.s = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.s)
        self.temp = tempfile.TemporaryDirectory(prefix="giz-id-")
        self.s.DADOS = Path(self.temp.name)
        self.s.LIXEIRA = self.s.DADOS / "lixeira"

    def tearDown(self):
        self.temp.cleanup()

    def test_id_publicado_por_outro_no_meio_passa_ao_candidato_seguinte(self):
        import threading
        s = self.s
        escolheu, liberar, resultado = threading.Event(), threading.Event(), {}
        original = s.trava

        def trava_com_pausa(bid):
            # pausa só o publicador, entre reservar "x" e pegar a trava dele
            if bid == "x" and threading.current_thread().name == "publicador":
                escolheu.set()
                liberar.wait(5)
            return original(bid)

        def publicar():
            with s.id_publicavel(iter(["x", "y", "z"])) as bid:
                (s.DADOS / f"{bid}.json").write_text("do publicador")
                resultado["id"] = bid

        with patch.object(s, "trava", side_effect=trava_com_pausa):
            t = threading.Thread(target=publicar, name="publicador")
            t.start()
            self.assertTrue(escolheu.wait(5))
            with original("x"):   # outro escritor (criação na revisão 0, importação) publica "x" no meio
                (s.DADOS / "x.json").write_text("do outro")
            liberar.set()
            t.join(5)
        self.assertEqual(resultado.get("id"), "y")
        self.assertEqual((s.DADOS / "x.json").read_text(), "do outro")
        self.assertEqual((s.DADOS / "y.json").read_text(), "do publicador")
        self.assertEqual(s.ID_RESERVADOS, set())

    def test_agente_e_copia_na_importacao_passam_pelo_contrato(self):
        import io, zipfile
        s = self.s
        chamadas = []
        real = s.id_publicavel

        def espia(candidatos):
            chamadas.append(1)
            return real(candidatos)

        with patch.object(s, "id_publicavel", side_effect=espia):
            r = s.criar_quadro_agente({"titulo": "Do agente"})
            self.assertTrue((s.DADOS / f"{r['quadro']}.json").exists())
            self.assertEqual(len(chamadas), 1)
            # um quadro com o mesmo id e conteúdo diferente: a importação traz como cópia
            (s.DADOS / "aula.json").write_text(json.dumps({"title": "Aula daqui", "items": []}), encoding="utf-8")
            f = io.BytesIO()
            with zipfile.ZipFile(f, "w") as z:
                z.writestr("manifesto.json", '{"formato":1}')
                z.writestr("quadros/aula.json", json.dumps({"title": "Aula de lá", "items": []}))
            f.seek(0)
            self.assertEqual(s.trazer_pacote(f)["copias"], 1)
            self.assertEqual(len(chamadas), 2)
        self.assertEqual(json.loads((s.DADOS / "aula.json").read_text(encoding="utf-8"))["title"], "Aula daqui")


@unittest.skipUnless((ROOT / "scripts/montar_janela.py").exists(), "sem scripts/montar_janela.py")
class MontagemTests(unittest.TestCase):
    def test_compilar_passa_as_features_ao_cargo(self):
        # auditoria da rc.2 (GL-D02): o --features tinha ido parar dentro de um comentário e sumia do comando
        sys.path.insert(0, str(ROOT / "scripts"))
        import montar_janela
        from unittest import mock
        with mock.patch.object(montar_janela.subprocess, "run") as run, mock.patch.object(montar_janela.shutil, "copy2"):
            montar_janela.compilar(None, ["so-janela", "sem-filho"], "teste")
            montar_janela.compilar(None, [], "teste")
        com, sem = run.call_args_list[0].args[0], run.call_args_list[1].args[0]
        self.assertEqual(com[-2:], ["--features", "so-janela,sem-filho"])
        self.assertIn("--locked", com)
        self.assertNotIn("--features", sem)

    def test_textos_dos_zips_nao_tem_link_local_quebrado(self):
        # auditoria da rc.4 (GL-D05): o README dos zips apontava para 15 arquivos que só existem no repositório
        import re
        sys.path.insert(0, str(ROOT / "scripts"))
        import montar_janela
        no_zip = set(montar_janela.TEXTOS)
        for destino, origem in montar_janela.TEXTOS.items():
            if not origem.endswith(".md"):
                continue
            texto = montar_janela.links_do_pacote((ROOT / origem).read_text(encoding="utf-8"), origem, "9.9.9")
            for _, alvo in montar_janela.LINK.findall(texto):
                if re.match(r"[a-z][a-z0-9+.-]*:", alvo, re.I) or alvo.startswith("#"):
                    continue
                with self.subTest(texto=destino, link=alvo):
                    self.assertIn(alvo.partition("#")[0], no_zip)
        readme = montar_janela.links_do_pacote("[a](docs/img/capa.png) [b](LICENSE)", "README.md", "9.9.9")
        self.assertEqual(readme, "[a](https://github.com/HeraldoAntunes/giz-livre/blob/v9.9.9/docs/img/capa.png) [b](LICENSE)")


class FalhaDeDisco:
    """Faz falhar a n-ésima operação de disco do servidor (criar o temporário, fsync, trocar ou mover arquivo) e, com
    `seguintes`, todas as depois dela, como um disco que enche ou some no meio. Apagar arquivo continua funcionando."""

    def __init__(self, n, seguintes):
        self.n, self.seguintes, self.chamadas, self.falhas = n, seguintes, 0, 0

    def _talvez(self, real):
        def f(*a, **kw):
            self.chamadas += 1
            if self.chamadas == self.n or (self.seguintes and self.chamadas > self.n):
                self.falhas += 1
                raise OSError(28, "disco cheio (simulado)")
            return real(*a, **kw)
        return f

    def __enter__(self):
        self._p = [patch.object(os, "replace", self._talvez(os.replace)), patch.object(os, "rename", self._talvez(os.rename)),
                   patch.object(os, "fsync", self._talvez(os.fsync)),
                   patch.object(tempfile, "mkstemp", self._talvez(tempfile.mkstemp))]
        for p in self._p:
            p.start()
        return self

    def __exit__(self, *exc):
        for p in reversed(self._p):
            p.stop()


def sha(caminho: Path):
    import hashlib
    return hashlib.sha256(caminho.read_bytes()).hexdigest() if caminho.is_file() else None


class GravacaoComFalhaDeDiscoTests(unittest.TestCase):
    """Quadro e miniatura com falha em cada operação de disco (auditoria da rc.5). Contrato conferido pelos bytes:
    o quadro fica inteiro com o conteúdo de antes ou com o novo, nunca pela metade; a resposta diz a verdade (200 só
    se o novo ficou, senão 500, nunca a conexão cortada nem um falso conflito); a miniatura é a do próprio quadro ou
    nenhuma (a página faz outra ao fechar o quadro), nunca solta na galeria ou na lixeira; nenhum temporário fica; e,
    com o disco de volta, a nova tentativa chega ao estado completo."""
    J0, P0 = b'{"title":"Antes","items":[],"_rev":0}', b"\x89PNG\r\n\x1a\nminiatura-antes"
    P1 = b"\x89PNG\r\n\x1a\nminiatura-nova"
    casos_com_falha = 0   # contado para o relatório de tests/prova_gravacao.py

    @classmethod
    def setUpClass(cls):
        import threading
        spec = importlib.util.spec_from_file_location("servidor_falha_disco", ROOT / "server.py")
        cls.s = s = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(s)
        s.registrar = s.diario = lambda *a, **kw: None
        cls.pasta = tempfile.TemporaryDirectory(prefix="giz-falha-disco-")
        s.DADOS = Path(cls.pasta.name)
        cls.srv = s.Servidor(("127.0.0.1", 0), s.Handler)
        s.PORTA = cls.srv.server_address[1]
        cls.thread = threading.Thread(target=cls.srv.serve_forever, kwargs={"poll_interval": .02}, daemon=True)
        cls.thread.start()
        cls.n = 0

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.srv.server_close()
        cls.thread.join(timeout=5)
        cls.pasta.cleanup()

    def novo_lugar(self):
        type(self).n += 1
        d = Path(self.pasta.name) / f"caso{self.n}"
        (d / "lixeira").mkdir(parents=True)
        self.s.DADOS, self.s.LIXEIRA = d, d / "lixeira"
        return d

    def pedir(self, metodo, rota, corpo):
        conn = http.client.HTTPConnection("127.0.0.1", self.s.PORTA, timeout=10)
        try:
            conn.request(metodo, rota, json.dumps(corpo) if corpo is not None else None,
                         {"X-Lousa": self.s.TOKEN, "Content-Type": "application/json"})
            r = conn.getresponse()
            return r.status, json.loads(r.read() or b"{}")
        except (http.client.RemoteDisconnected, ConnectionResetError):
            return "conexão cortada", {}
        finally:
            conn.close()

    def sem_temporarios(self, d):
        self.assertEqual([p.name for p in d.rglob("*.tmp")], [])

    def casos(self, rodar):
        """Roda `rodar(falha)` com a 1ª, 2ª... operação falhando, nos dois modos, até sobrar uma rodada sem falha."""
        vistos = 0
        for seguintes in (False, True):
            for n in range(1, 40):
                with self.subTest(falha=n, seguintes=seguintes):
                    d = self.novo_lugar()
                    falha = FalhaDeDisco(n, seguintes)
                    rodar(d, falha)
                    self.sem_temporarios(d)
                    self.assertEqual(self.s.ID_RESERVADOS, set())
                if not falha.falhas:
                    break
                vistos += 1
                GravacaoComFalhaDeDiscoTests.casos_com_falha += 1
        self.assertGreater(vistos, 2)   # o cenário passou mesmo por várias operações de disco

    def test_salvar_quadro_com_miniatura(self):
        dados = lambda: {"board": {"title": "Depois", "items": [{"id": "a", "type": "text", "x": 1, "y": 2, "text": "x"}]},
                         "revision": 0, "thumb": "data:image/png;base64," + __import__("base64").b64encode(self.P1).decode()}

        def rodar(d, falha):
            (d / "q.json").write_bytes(self.J0)
            (d / "q.png").write_bytes(self.P0)
            with falha:
                status, corpo = self.pedir("PUT", "/api/boards/q", dados())
            atual = json.loads((d / "q.json").read_bytes())
            if status == 200:
                self.assertEqual((atual["_rev"], atual["items"][0]["text"]), (1, "x"))
                self.assertIn(sha(d / "q.png"), (sha_p1, None))
                pacote = dados()
                pacote["revision"] = 1
            else:
                self.assertEqual(status, 500, corpo)
                self.assertEqual((d / "q.json").read_bytes(), self.J0)
                self.assertEqual((d / "q.png").read_bytes(), self.P0)
                pacote = dados()
            self.assertEqual(self.pedir("PUT", "/api/boards/q", pacote)[0], 200)   # disco de volta
            self.assertEqual(json.loads((d / "q.json").read_bytes())["items"][0]["text"], "x")
            self.assertEqual(sha(d / "q.png"), sha_p1)
        sha_p1 = __import__("hashlib").sha256(self.P1).hexdigest()
        self.casos(rodar)

    def test_salvar_so_a_miniatura(self):
        corpo = {"thumb": "data:image/png;base64," + __import__("base64").b64encode(self.P1).decode()}

        def rodar(d, falha):
            (d / "q.json").write_bytes(self.J0)
            (d / "q.png").write_bytes(self.P0)
            with falha:
                status, _ = self.pedir("PUT", "/api/thumbs/q", corpo)
            esperado = self.P1 if status == 200 else self.P0
            if status != 200:
                self.assertEqual(status, 500)
            self.assertEqual((d / "q.png").read_bytes(), esperado)
            self.assertEqual((d / "q.json").read_bytes(), self.J0)
            self.assertEqual(self.pedir("PUT", "/api/thumbs/q", corpo)[0], 200)
            self.assertEqual((d / "q.png").read_bytes(), self.P1)
        self.casos(rodar)

    def test_excluir_quadro_com_miniatura(self):
        def rodar(d, falha):
            (d / "q.json").write_bytes(self.J0)
            (d / "q.png").write_bytes(self.P0)
            with falha:
                status, corpo = self.pedir("DELETE", "/api/boards/q", None)
            if status == 200:
                nome = corpo["lixeira"]
                self.assertEqual((d / "lixeira" / f"{nome}.json").read_bytes(), self.J0)
                self.assertIn(sha(d / "lixeira" / f"{nome}.png"), (__import__("hashlib").sha256(self.P0).hexdigest(), None))
                self.assertFalse((d / "q.png").exists())   # nada solto na galeria ocupando o id
            else:
                self.assertEqual(status, 500, corpo)
                self.assertEqual(((d / "q.json").read_bytes(), (d / "q.png").read_bytes()), (self.J0, self.P0))
                self.assertEqual(list((d / "lixeira").iterdir()), [])
                status, corpo = self.pedir("DELETE", "/api/boards/q", None)
                self.assertEqual(status, 200)
                self.assertEqual((d / "lixeira" / f"{corpo['lixeira']}.png").read_bytes(), self.P0)
            self.assertEqual(sorted(p.name for p in d.iterdir()), ["lixeira"])
            soltas = [p for p in (d / "lixeira").glob("*.png") if not p.with_suffix(".json").is_file()]
            self.assertEqual(soltas, [])
        self.casos(rodar)

    def test_restaurar_quadro_com_miniatura(self):
        nome = "q_20261030-120000"

        def rodar(d, falha, ocupado=False):
            (d / "lixeira" / f"{nome}.json").write_bytes(self.J0)
            (d / "lixeira" / f"{nome}.png").write_bytes(self.P0)
            if ocupado:
                (d / "q.json").write_bytes(b'{"title":"Outro","items":[]}')
            with falha:
                status, corpo = self.pedir("POST", "/api/lixeira/restaurar", {"nome": nome})
            if status != 200:
                self.assertEqual(status, 500, corpo)
                self.assertEqual(((d / "lixeira" / f"{nome}.json").read_bytes(),
                                  (d / "lixeira" / f"{nome}.png").read_bytes()), (self.J0, self.P0))
                status, corpo = self.pedir("POST", "/api/lixeira/restaurar", {"nome": nome})
                self.assertEqual(status, 200)
                self.assertEqual((d / f"{corpo['id']}.png").read_bytes(), self.P0)
            novo = corpo["id"]
            self.assertEqual((d / f"{novo}.json").read_bytes(), self.J0)
            self.assertIn((d / f"{novo}.png").read_bytes() if (d / f"{novo}.png").exists() else None, (self.P0, None))
            self.assertEqual(list((d / "lixeira").iterdir()), [])
            if ocupado:
                self.assertNotEqual(novo, "q")
                self.assertEqual((d / "q.json").read_bytes(), b'{"title":"Outro","items":[]}')
                self.assertFalse((d / "q.png").exists())
            soltas = [p for p in d.glob("*.png") if not p.with_suffix(".json").is_file()]
            self.assertEqual(soltas, [])
        self.casos(rodar)
        self.casos(lambda d, falha: rodar(d, falha, ocupado=True))

    def test_restaurar_nunca_deixa_o_quadro_nos_dois_lugares(self):
        # mover entre pastas com shutil.move, se a troca falha, vira copiar e apagar: com o apagar falhando, o quadro
        # ficava na galeria e na lixeira, e a nova tentativa fazia outra cópia
        nome = "q_20261030-120000"
        d = self.novo_lugar()
        (d / "lixeira" / f"{nome}.json").write_bytes(self.J0)
        with FalhaDeDisco(1, False), patch.object(os, "unlink", side_effect=OSError(13, "em uso (simulado)")), \
                patch.object(os, "remove", side_effect=OSError(13, "em uso (simulado)")):
            status, _ = self.pedir("POST", "/api/lixeira/restaurar", {"nome": nome})
        self.assertEqual(status, 500)
        self.assertEqual(list(d.glob("*.json")), [])
        self.assertEqual(self.pedir("POST", "/api/lixeira/restaurar", {"nome": nome})[0], 200)
        self.assertEqual([p.read_bytes() for p in d.glob("*.json")], [self.J0])

    def test_morte_entre_mover_o_quadro_e_a_miniatura_nao_deixa_miniatura_solta(self):
        # sem diário do par: o programa morto entre os dois movimentos (excluir e restaurar) deixa só a miniatura para
        # trás; ao abrir, ela sai, e o id volta a ficar livre
        d = self.novo_lugar()
        lix = d / "lixeira"
        for p, b in ((d / "solta.png", self.P0), (d / "q.json", self.J0), (d / "q.png", self.P0),
                     (lix / "r_20261030-120000.png", self.P0), (lix / "s_20261030-120000.json", self.J0),
                     (lix / "s_20261030-120000.png", self.P1), (d / "reservada.png", self.P1)):
            p.write_bytes(b)
        self.s.ID_RESERVADOS.add("reservada")   # uma publicação em andamento com esse id
        try:
            self.assertEqual(self.s.limpar_miniaturas_soltas(), 2)
        finally:
            self.s.ID_RESERVADOS.discard("reservada")
        self.assertEqual(sorted(p.name for p in d.glob("*.png")), ["q.png", "reservada.png"])
        self.assertEqual([p.name for p in lix.glob("*.png")], ["s_20261030-120000.png"])
        self.assertEqual(((d / "q.png").read_bytes(), (lix / "s_20261030-120000.png").read_bytes()), (self.P0, self.P1))
        with self.s.id_publicavel(iter(["solta", "outro"])) as novo:
            self.assertEqual(novo, "solta")

    def test_miniatura_que_chega_depois_de_excluir_nao_fica_solta(self):
        # a existência do quadro era conferida antes da trava: um excluir no meio deixava a miniatura na galeria
        d = self.novo_lugar()
        (d / "q.json").write_bytes(self.J0)
        real = self.s.trava

        def excluir_antes(bid):
            if bid == "q" and (d / "q.json").exists():
                os.replace(d / "q.json", d / "lixeira" / "q_20261030-120000.json")
            return real(bid)
        corpo = {"thumb": "data:image/png;base64," + __import__("base64").b64encode(self.P1).decode()}
        with patch.object(self.s, "trava", side_effect=excluir_antes):
            status, _ = self.pedir("PUT", "/api/thumbs/q", corpo)
        self.assertEqual(status, 404)
        self.assertEqual(list(d.glob("*.png")), [])

    def test_trazer_quadro_sem_miniatura_nao_herda_uma_avulsa(self):
        import io
        import zipfile
        d = self.novo_lugar()
        (d / "q.png").write_bytes(self.P0)   # avulsa, de outro conteúdo
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as z:
            z.writestr("manifesto.json", json.dumps({"formato": 1}))
            z.writestr("quadros/q.json", json.dumps({"title": "Do outro PC", "items": []}))
        buf.seek(0)
        self.assertEqual(self.s.trazer_pacote(buf)["trazidos"], 1)
        self.assertTrue((d / "q.json").exists())
        self.assertFalse((d / "q.png").exists())

    # provas independentes da 1.16.0 (ramo provas-1.16.0), defeito A: o quadro trazido por pacote fica com _rev 0, e um
    # PUT de criação com revision 0 no mesmo id o sobrescrevia sem 412 e sem lixeira
    def trazer(self, d, bid="q", titulo="Do outro PC"):
        import io
        import zipfile
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as z:
            z.writestr("manifesto.json", json.dumps({"formato": 1}))
            z.writestr(f"quadros/{bid}.json", json.dumps({"title": titulo, "items": []}))
        buf.seek(0)
        self.assertEqual(self.s.trazer_pacote(buf)["trazidos"], 1)
        return (d / f"{bid}.json").read_bytes()

    def test_criar_por_cima_de_quadro_trazido_da_412(self):
        d = self.novo_lugar()
        antes = self.trazer(d)
        status, _ = self.pedir("PUT", "/api/boards/q", {"board": {"title": "Novo", "items": []}, "revision": 0,
                                                        "criar": True})
        self.assertEqual(status, 412)
        self.assertEqual((d / "q.json").read_bytes(), antes)
        # excluído e restaurado, continua protegido
        nome = self.pedir("DELETE", "/api/boards/q", None)[1]["lixeira"]
        self.assertEqual(self.pedir("POST", "/api/lixeira/restaurar", {"nome": nome})[1]["id"], "q")
        status, _ = self.pedir("PUT", "/api/boards/q", {"board": {"title": "Novo", "items": []}, "revision": 0,
                                                        "criar": True})
        self.assertEqual(status, 412)
        self.assertEqual((d / "q.json").read_bytes(), antes)

    def test_criar_sem_o_pedido_explicito_tambem_nao_sobrescreve_quadro_trazido(self):
        # o repro da nuvem (tests/provas/repro_revisao_zero.py): PUT com revision 0 e sem "criar"
        d = self.novo_lugar()
        antes = self.trazer(d)
        self.assertEqual(self.pedir("PUT", "/api/boards/q", {"board": {"title": "Outro", "items": []}, "revision": 0})[0],
                         412)
        self.assertEqual((d / "q.json").read_bytes(), antes)

    def test_abrir_quadro_trazido_e_salvar_continua_valendo(self):
        d = self.novo_lugar()
        self.trazer(d)
        rev = json.loads((d / "q.json").read_bytes())["_rev"]   # a página salva com a revisão que leu
        status, corpo = self.pedir("PUT", "/api/boards/q", {"board": {"title": "Editado", "items": []}, "revision": rev})
        self.assertEqual((status, corpo.get("revision")), (200, rev + 1))
        self.assertEqual(json.loads((d / "q.json").read_bytes())["title"], "Editado")
        # trazido por uma versão anterior (revisão 0): abrir e salvar a primeira edição segue valendo
        (d / "velho.json").write_text(json.dumps({"title": "Velho", "items": [], "_rev": 0}))
        self.assertEqual(self.pedir("PUT", "/api/boards/velho", {"board": {"title": "V2", "items": []}, "revision": 0})[0],
                         200)
        status, _ = self.pedir("PUT", "/api/boards/novo1", {"board": {"title": "N", "items": []}, "revision": 0,
                                                            "criar": True})
        self.assertEqual(status, 200)   # criar num id livre segue valendo

    # defeito B: a página grava o quadro e só uns segundos depois a miniatura; uma queda no meio deixava a miniatura
    # velha na galeria, com o quadro novo
    def envelhecer(self, png: Path, segundos: float):
        t = time.time() - segundos
        os.utime(png, (t, t))

    def test_miniatura_mais_velha_que_o_quadro_nao_aparece(self):
        d = self.novo_lugar()
        self.assertEqual(self.pedir("PUT", "/api/boards/q", {"board": {"title": "Q", "items": []}, "revision": 0})[0], 200)
        (d / "q.png").write_bytes(self.P0)
        self.envelhecer(d / "q.png", 30)   # a miniatura de antes; o quadro acabou de mudar e o servidor caiu
        self.assertFalse(next(b for b in self.s.listar_quadros() if b["id"] == "q")["thumb"])
        self.assertEqual(self.pedir("GET", "/thumbs/q.png", None)[0], 404)
        corpo = {"thumb": "data:image/png;base64," + __import__("base64").b64encode(self.P1).decode()}
        self.assertEqual(self.pedir("PUT", "/api/thumbs/q", corpo)[0], 200)   # a página fez outra ao fechar
        self.assertTrue(next(b for b in self.s.listar_quadros() if b["id"] == "q")["thumb"])

    def test_miniatura_de_pendrive_com_hora_arredondada_vale(self):
        # FAT32 guarda a hora do arquivo de 2 em 2 s: a miniatura gravada logo depois pode parecer um pouco mais velha
        d = self.novo_lugar()
        self.assertEqual(self.pedir("PUT", "/api/boards/q", {"board": {"title": "Q", "items": []}, "revision": 0})[0], 200)
        (d / "q.png").write_bytes(self.P0)
        self.envelhecer(d / "q.png", 1.5)
        self.assertTrue(next(b for b in self.s.listar_quadros() if b["id"] == "q")["thumb"])

    # defeito C: o erro do apagar era engolido sem registro, e uma miniatura que não saía prendia o id
    def test_apagar_que_falha_vai_para_o_registro(self):
        d = self.novo_lugar()
        (d / "q.json").write_bytes(self.J0)
        (d / "q.png").write_bytes(self.P0)
        (d / "solta.png").write_bytes(self.P0)
        erro = OSError(13, "em uso (simulado)")
        with patch.object(self.s, "registrar") as reg, patch.object(Path, "unlink", side_effect=erro), \
                FalhaDeDisco(1, True):
            self.assertFalse(self.s.gravar_miniatura("q", self.P1))
            self.assertEqual(self.s.limpar_miniaturas_soltas(), 0)
        registrados = [c.args[0] for c in reg.call_args_list]
        self.assertGreaterEqual(sum(e is erro for e in registrados), 2, registrados)

    def test_miniatura_que_nao_saiu_nao_prende_o_id(self):
        # excluir com a troca e o apagar da miniatura falhando deixava q.png na galeria, e restaurar voltava com outro id
        d = self.novo_lugar()
        (d / "lixeira" / "q_20261030-120000.json").write_bytes(self.J0)
        (d / "q.png").write_bytes(self.P0)   # a que ficou para trás
        status, corpo = self.pedir("POST", "/api/lixeira/restaurar", {"nome": "q_20261030-120000"})
        self.assertEqual((status, corpo["id"], corpo["renomeado"]), (200, "q", False))
        self.assertEqual((d / "q.json").read_bytes(), self.J0)
        self.assertFalse((d / "q.png").exists())   # a avulsa não vira a prévia do quadro restaurado

    def test_trazer_pacote_com_miniatura(self):
        import io
        import zipfile

        def pacote():
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w") as z:
                z.writestr("manifesto.json", json.dumps({"formato": 1}))
                z.writestr("quadros/q.json", json.dumps({"title": "Do outro PC", "items": []}))
                z.writestr("quadros/q.png", self.P1)
            buf.seek(0)
            return buf

        def rodar(d, falha, ocupado=False):
            if ocupado:
                (d / "q.json").write_bytes(self.J0)
            with falha:
                r = self.s.trazer_pacote(pacote())
            vieram = [p for p in d.glob("*.json") if json.loads(p.read_bytes())["title"].startswith("Do outro PC")]
            self.assertEqual(len(vieram), r["trazidos"] + r["copias"])
            self.assertEqual(len(vieram) == 0, bool(r["falhas"]), r)   # o resumo diz a verdade
            for p in vieram:
                self.assertIn(sha(p.with_suffix(".png")), (sha_p1, None))
            if ocupado:
                self.assertEqual((d / "q.json").read_bytes(), self.J0)
            r = self.s.trazer_pacote(pacote())   # disco de volta: chega ao quadro, sem cópia a mais
            self.assertEqual(r["falhas"], [])
            vieram = [p for p in d.glob("*.json") if json.loads(p.read_bytes())["title"].startswith("Do outro PC")]
            self.assertEqual(len(vieram), 1)
            soltas = [p for p in d.glob("*.png") if not p.with_suffix(".json").is_file()]
            self.assertEqual(soltas, [])
        sha_p1 = __import__("hashlib").sha256(self.P1).hexdigest()
        self.casos(rodar)
        self.casos(lambda d, falha: rodar(d, falha, ocupado=True))


if __name__ == "__main__":
    unittest.main(verbosity=2)
