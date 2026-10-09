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
