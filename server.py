# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
"""Giz Livre — servidor local (só biblioteca padrão).

Serve a interface em app/ e grava os quadros em quadros/ como arquivos JSON + miniatura PNG.
Também: converte PowerPoint em imagens (via o próprio PowerPoint, por COM) e monta PDFs a partir das páginas.
Uso:  python server.py [--porta 8765] [--sem-janela] [--dados PASTA] [--sem-auto-encerrar]
"""
import argparse
import base64
import hashlib
import json
import os
import re
import secrets
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

WINDOWS = sys.platform == "win32"
MAC = sys.platform == "darwin"
CONGELADO = getattr(sys, "frozen", False)          # rodando como GizLivre.exe (PyInstaller)
PACOTE = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
RAIZ = Path(sys.executable).resolve().parent if CONGELADO else Path(__file__).resolve().parent
APP = PACOTE / "app"


def pasta_documentos() -> Path:
    try:
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                            r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders") as k:
            return Path(os.path.expandvars(winreg.QueryValueEx(k, "Personal")[0]))
    except Exception:
        return Path.home() / "Documents"


def pasta_dados_padrao() -> Path:
    # código-fonte ou cópia portátil (arquivo portatil.txt ao lado do exe): quadros/ ao lado do programa
    if not CONGELADO or (RAIZ / "portatil.txt").exists():
        return RAIZ / "quadros"
    docs = pasta_documentos()
    nova, antiga = docs / "Giz Livre" / "quadros", docs / "Lousa Digital" / "quadros"
    if not nova.exists() and antiga.exists():   # o programa se chamava "Lousa Digital" antes da 1.0.0: leva os quadros junto
        try:
            nova.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(antiga), str(nova))
        except OSError:
            return antiga
    return nova   # instalado: em Documentos


DADOS = pasta_dados_padrao()
LIXEIRA = DADOS / "lixeira"
VERSAO = "1.2.2"
ID_OK = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
# arquivo da lixeira: <id>_<AAAAMMDD-HHMMSS>[-n] (o DELETE dá esse nome); barra e ponto nunca passam
LIXO_OK = re.compile(r"^([A-Za-z0-9_-]{1,64})_(\d{8}-\d{6})(?:-\d{1,4})?$")
ASSET_OK = re.compile(r"^[0-9a-f]{40}\.(png|jpg)$")
TIPOS = {"png": "image/png", "jpg": "image/jpeg"}
MB = 1024 * 1024
LIMITES = {"boards": 200 * MB, "thumbs": 5 * MB, "assets": 40 * MB, "pptx": 300 * MB, "pdf": 300 * MB, "ocr": 2 * MB,
           "outros": 64 * 1024}
TOKEN = secrets.token_hex(16)        # token da sessão: só a página servida por ESTE servidor o conhece
TRAVA_PPTX = threading.Semaphore(1)  # conversões pesadas: uma de cada vez
TRAVA_OCR = threading.Semaphore(2)
PORTA = 8765
ULTIMA_ATIVIDADE = time.time()
TRAVAS: dict[str, threading.Lock] = {}
TRAVA_GERAL = threading.Lock()


def trava(bid: str) -> threading.Lock:
    with TRAVA_GERAL:
        return TRAVAS.setdefault(bid, threading.Lock())


def gravar_atomico(caminho: Path, dados: bytes) -> None:
    fd, tmp = tempfile.mkstemp(dir=caminho.parent, prefix=caminho.name + ".", suffix=".tmp")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(dados)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, caminho)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


RESUMOS: dict[str, tuple] = {}     # id -> (mtime_ns, tamanho, resumo): a galeria não relê quadros que não mudaram


def nome_pasta(valor) -> str:
    """Nome de pasta da galeria (campo `folder` do quadro): texto curto, sem controles; vazio = sem pasta."""
    if not isinstance(valor, str):
        return ""
    return re.sub(r"\s+", " ", "".join(c for c in valor if c.isprintable())).strip()[:80]


def resumo_quadro(arq: Path) -> dict:
    st = arq.stat()
    chave = (st.st_mtime_ns, st.st_size)
    guardado = RESUMOS.get(arq.stem)
    if guardado and guardado[:2] == chave:
        return guardado[2]
    with open(arq, encoding="utf-8") as f:
        b = json.load(f)
    r = {"id": arq.stem, "title": b.get("title") or "Sem título",
         "updated": b.get("updated") or st.st_mtime * 1000,
         "mode": (b.get("layout") or {}).get("mode", "free")}
    pasta = nome_pasta(b.get("folder"))
    if pasta:
        r["folder"] = pasta
    with TRAVA_GERAL:
        RESUMOS[arq.stem] = (*chave, r)
    return r


def listar_lixeira() -> list:
    """Quadros excluídos (mais recente primeiro): nome do arquivo, id, título, pasta, data da exclusão, miniatura."""
    lista = []
    for arq in LIXEIRA.glob("*.json"):
        m = LIXO_OK.match(arq.stem)
        if not m:
            continue
        try:
            with open(arq, encoding="utf-8") as f:
                b = json.load(f)
            quando = time.mktime(time.strptime(m.group(2), "%Y%m%d-%H%M%S")) * 1000
        except Exception:
            continue
        item = {"nome": arq.stem, "id": m.group(1), "title": str(b.get("title") or "Sem título")[:200],
                "deleted": int(quando), "thumb": (LIXEIRA / f"{arq.stem}.png").is_file()}
        pasta = nome_pasta(b.get("folder"))
        if pasta:
            item["folder"] = pasta
        lista.append(item)
    lista.sort(key=lambda x: (x["deleted"], x["nome"]), reverse=True)
    return lista


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(APP), **kw)

    def log_message(self, fmt, *args):  # silencioso
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy",
                         "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; "
                         "font-src 'self' data:; script-src 'self'; worker-src 'self' blob:; connect-src 'self' data: blob:; "
                         "object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        super().end_headers()

    # ---- utilidades ----
    def _host_ok(self) -> bool:
        # bloqueia DNS rebinding: só aceita os nomes locais da própria porta
        host = (self.headers.get("Host") or "").lower()
        ok = host in (f"127.0.0.1:{PORTA}", f"localhost:{PORTA}", f"[::1]:{PORTA}")
        if not ok:
            self.send_response(403)
            self.end_headers()
        return ok

    def _json(self, obj, status=200):
        corpo = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def _bytes(self, corpo: bytes, tipo: str, status=200):
        self.send_response(status)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def _escrita_ok(self) -> bool:
        # bloqueia CSRF: pedido que altera dados só vale vindo da própria página do Giz Livre, com o token da sessão
        sfs = self.headers.get("Sec-Fetch-Site")
        origem = self.headers.get("Origin")
        if (sfs and sfs not in ("same-origin", "none")) or \
                (origem and origem not in (f"http://127.0.0.1:{PORTA}", f"http://localhost:{PORTA}")):
            self._json({"erro": "pedido de outra origem recusado"}, 403)
            return False
        if not secrets.compare_digest(self.headers.get("X-Lousa", ""), TOKEN):
            self._json({"erro": "sessão expirada: recarregue a página do Giz Livre"}, 409)
            return False
        return True

    def _corpo(self, rota: str = "outros") -> bytes | None:
        try:
            n = int(self.headers.get("Content-Length", "-1"))
        except ValueError:
            n = -1
        if n < 0 or n > LIMITES.get(rota, LIMITES["outros"]):
            self._json({"erro": "tamanho do envio inválido"}, 413)
            return None
        return self.rfile.read(n)

    def _id(self, prefixo):
        bid = self.path[len(prefixo):].split("?")[0]
        if not ID_OK.match(bid):
            self._json({"erro": "id inválido"}, 400)
            return None
        return bid

    def _rota(self):
        global ULTIMA_ATIVIDADE
        ULTIMA_ATIVIDADE = time.time()
        return self.path.split("?")[0]

    # ---- rotas ----
    def do_GET(self):
        if not self._host_ok():
            return
        rota = self._rota()
        if rota == "/api/boards":
            lista = []
            vistos = set()
            for arq in DADOS.glob("*.json"):
                if not ID_OK.match(arq.stem):
                    continue
                try:
                    lista.append(resumo_quadro(arq))
                    vistos.add(arq.stem)
                except Exception:
                    continue
            with TRAVA_GERAL:   # esquece os quadros que saíram da pasta (lixeira)
                for k in [k for k in RESUMOS if k not in vistos]:
                    RESUMOS.pop(k, None)
            lista.sort(key=lambda x: x["updated"], reverse=True)
            return self._json(lista)
        if rota == "/api/info":
            return self._json({"versao": VERSAO, "dados": str(DADOS), "token": TOKEN, "sistema": sys.platform,
                               "pptx": "powerpoint" if tem_powerpoint() else ("libreoffice" if achar_libreoffice() else None),
                               "ocr": WINDOWS})
        if rota == "/api/ping":
            return self._json({"ok": True})
        if rota == "/api/lixeira":
            return self._json(listar_lixeira())
        if rota.startswith("/api/lixeira/"):   # miniatura de um quadro da lixeira
            nome = rota[len("/api/lixeira/"):]
            nome = nome[:-4] if nome.endswith(".png") else ""
            arq = LIXEIRA / f"{nome}.png"
            if not LIXO_OK.match(nome) or not arq.is_file():
                self.send_response(404)
                self.end_headers()
                return
            return self._bytes(arq.read_bytes(), "image/png")
        if rota.startswith("/api/boards/"):
            bid = self._id("/api/boards/")
            if bid is None:
                return
            arq = DADOS / f"{bid}.json"
            if not arq.exists():
                return self._json({"erro": "não encontrado"}, 404)
            return self._bytes(arq.read_bytes(), "application/json; charset=utf-8")
        if rota.startswith("/assets/"):
            nome = rota[len("/assets/"):]
            arq = DADOS / "assets" / nome
            if not ASSET_OK.match(nome) or not arq.exists():
                self.send_response(404)
                self.end_headers()
                return
            corpo = arq.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", TIPOS[nome.rsplit(".", 1)[1]])
            self.send_header("Content-Length", str(len(corpo)))
            self.send_header("Cache-Control", "max-age=31536000, immutable")
            SimpleHTTPRequestHandler.end_headers(self)
            self.wfile.write(corpo)
            return
        if rota.startswith("/thumbs/"):
            nome = rota[len("/thumbs/"):]
            bid = nome[:-4] if nome.endswith(".png") else ""
            arq = DADOS / f"{bid}.png"
            if not ID_OK.match(bid) or not arq.exists():
                self.send_response(404)
                self.end_headers()
                return
            return self._bytes(arq.read_bytes(), "image/png")
        return super().do_GET()

    def do_HEAD(self):
        if self._host_ok():
            super().do_HEAD()

    def do_PUT(self):
        if not self._host_ok() or not self._escrita_ok():
            return
        rota = self._rota()
        if rota.startswith("/api/thumbs/"):
            bid = self._id("/api/thumbs/")
            if bid is None:
                return
            corpo = self._corpo("thumbs")
            if corpo is None:
                return
            try:
                thumb = json.loads(corpo.decode("utf-8")).get("thumb") or ""
                if not thumb.startswith("data:image/png;base64,"):
                    raise ValueError("miniatura inválida")
                png = base64.b64decode(thumb.split(",", 1)[1], validate=True)
                if not (DADOS / f"{bid}.json").exists():
                    return self._json({"erro": "quadro não existe"}, 404)
                with trava(bid):
                    gravar_atomico(DADOS / f"{bid}.png", png)
            except Exception as e:
                return self._json({"erro": str(e)}, 400)
            return self._json({"ok": True})
        if rota.startswith("/api/folder/"):
            # muda só a pasta do quadro, sem mexer na data de edição nem reenviar o quadro inteiro
            bid = self._id("/api/folder/")
            if bid is None:
                return
            corpo = self._corpo()
            if corpo is None:
                return
            try:
                pacote = json.loads(corpo.decode("utf-8"))
                if not isinstance(pacote, dict):
                    raise ValueError("pedido inválido")
                pasta = nome_pasta(pacote.get("folder"))
            except Exception as e:
                return self._json({"erro": str(e)}, 400)
            arq = DADOS / f"{bid}.json"
            with trava(bid):
                if not arq.exists():
                    return self._json({"erro": "não encontrado"}, 404)
                try:
                    with open(arq, encoding="utf-8") as f:
                        board = json.load(f)
                    if pasta:
                        board["folder"] = pasta
                    else:
                        board.pop("folder", None)
                    board["_rev"] = board.get("_rev", 0) + 1
                    gravar_atomico(arq, json.dumps(board, ensure_ascii=False, allow_nan=False).encode("utf-8"))
                except Exception as e:
                    return self._json({"erro": str(e)}, 500)
            return self._json({"ok": True, "folder": pasta})
        if not rota.startswith("/api/boards/"):
            return self._json({"erro": "rota"}, 404)
        bid = self._id("/api/boards/")
        if bid is None:
            return
        corpo = self._corpo("boards")
        if corpo is None:
            return
        try:
            # valida TUDO antes de gravar qualquer coisa
            pacote = json.loads(corpo.decode("utf-8"),
                                parse_constant=lambda c: (_ for _ in ()).throw(ValueError("número inválido: " + c)))
            board = pacote["board"]
            if not isinstance(board, dict) or not isinstance(board.get("items"), list):
                raise ValueError("quadro inválido")
            revision = pacote.get("revision", board.get("_rev", 0))
            if type(revision) is not int or revision < 0:
                raise ValueError("revisão inválida")
            png = None
            thumb = pacote.get("thumb")
            if thumb:
                if not isinstance(thumb, str) or not thumb.startswith("data:image/png;base64,"):
                    raise ValueError("miniatura inválida")
                png = base64.b64decode(thumb.split(",", 1)[1], validate=True)
            board["title"] = str(pacote.get("title") or board.get("title") or "Sem título")[:200]
            pasta = nome_pasta(board.get("folder"))
            if pasta:
                board["folder"] = pasta
            else:
                board.pop("folder", None)
            board["updated"] = int(time.time() * 1000)
            json.dumps(board, ensure_ascii=False, allow_nan=False)  # valida antes de obter a trava
        except Exception as e:
            return self._json({"erro": str(e)}, 400)
        with trava(bid):
            arq = DADOS / f"{bid}.json"
            try:
                atual = json.loads(arq.read_text(encoding="utf-8")) if arq.exists() else {}
                if not isinstance(atual, dict):
                    raise ValueError("quadro existente inválido")
            except (OSError, ValueError) as e:
                registrar(e)
                return self._json({"erro": "não foi possível verificar a revisão do quadro existente"}, 500)
            if revision != atual.get("_rev", 0):
                return self._json({"erro": "quadro alterado em outra janela", "revision": atual.get("_rev", 0)}, 412)
            board["_rev"] = revision + 1
            dados = json.dumps(board, ensure_ascii=False, allow_nan=False).encode("utf-8")
            gravar_atomico(arq, dados)
            if png:
                gravar_atomico(DADOS / f"{bid}.png", png)
        return self._json({"ok": True, "updated": board["updated"], "revision": board["_rev"]})

    def do_POST(self):
        if not self._host_ok() or not self._escrita_ok():
            return
        rota = self._rota()
        if rota == "/api/ping":
            return self._json({"ok": True})
        if rota == "/api/sair":
            self._json({"ok": True})
            threading.Thread(target=self.server.shutdown, daemon=True).start()
            return
        if rota == "/api/assets":
            corpo = self._corpo("assets")
            if corpo is None:
                return
            try:
                return self._json({"url": guardar_asset(corpo)})
            except Exception as e:
                return self._json({"erro": str(e)}, 400)
        if rota == "/api/pptx":
            corpo = self._corpo("pptx")
            if corpo is None:
                return
            if not TRAVA_PPTX.acquire(blocking=False):
                return self._json({"erro": "já há uma conversão em andamento; aguarde"}, 429)
            try:
                return self._json(converter_pptx(corpo, self.headers.get("X-Nome-Arquivo", "")))
            except ValueError as e:
                return self._json({"erro": str(e)}, 400)
            except Exception as e:
                registrar(e)
                return self._json({"erro": "O PowerPoint não conseguiu converter o arquivo."}, 500)
            finally:
                TRAVA_PPTX.release()
        if rota == "/api/ocr":
            corpo = self._corpo("ocr")
            if corpo is None:
                return
            if not TRAVA_OCR.acquire(blocking=False):
                return self._json({"erro": "reconhecimento ocupado; tente de novo"}, 429)
            try:
                strokes = json.loads(corpo.decode("utf-8"))["strokes"]
                if (not isinstance(strokes, list) or not strokes or len(strokes) > 2000
                        or sum(len(t) for t in strokes if isinstance(t, list)) > 200_000):
                    raise ValueError("traços demais ou inválidos")
                return self._json({"palavras": reconhecer_escrita(strokes)})
            except ValueError as e:
                return self._json({"erro": str(e)}, 400)
            except Exception as e:
                registrar(e)
                return self._json({"erro": "Reconhecimento de escrita indisponível neste computador."}, 500)
            finally:
                TRAVA_OCR.release()
        if rota == "/api/lixeira/restaurar":
            return self._restaurar()
        if rota == "/api/pdf":
            corpo = self._corpo("pdf")
            if corpo is None:
                return
            try:
                pacote = json.loads(corpo.decode("utf-8"))
                if not isinstance(pacote.get("pages"), list) or not 0 < len(pacote["pages"]) <= 500:
                    raise ValueError("páginas inválidas")
                return self._bytes(montar_pdf(pacote["pages"]), "application/pdf")
            except Exception as e:
                return self._json({"erro": str(e)}, 400)
        return self._json({"erro": "rota"}, 404)

    def do_DELETE(self):
        if not self._host_ok() or not self._escrita_ok():
            return
        self._rota()
        if not self.path.startswith("/api/boards/"):
            return self._json({"erro": "rota"}, 404)
        bid = self._id("/api/boards/")
        if bid is None:
            return
        carimbo = time.strftime("%Y%m%d-%H%M%S")
        with trava(bid):
            nome = f"{bid}_{carimbo}"
            n = 1   # dois envios do mesmo quadro no mesmo segundo (excluir, desfazer, excluir): não sobrescreve
            while (LIXEIRA / f"{nome}.json").exists() or (LIXEIRA / f"{nome}.png").exists():
                n += 1
                nome = f"{bid}_{carimbo}-{n}"
            movido = False
            for ext in (".json", ".png"):
                arq = DADOS / f"{bid}{ext}"
                if arq.exists():
                    shutil.move(str(arq), str(LIXEIRA / f"{nome}{ext}"))
                    movido = movido or ext == ".json"
        return self._json({"ok": True, "lixeira": nome if movido else None})

    def _restaurar(self):
        """Devolve um quadro da lixeira para a galeria. Se o id já estiver em uso, ganha um id novo."""
        corpo = self._corpo()
        if corpo is None:
            return
        try:
            pacote = json.loads(corpo.decode("utf-8"))
            nome = pacote.get("nome") if isinstance(pacote, dict) else None
            m = LIXO_OK.match(nome) if isinstance(nome, str) else None
            if not m:
                raise ValueError("nome inválido")
        except Exception as e:
            return self._json({"erro": str(e)}, 400)
        origem = LIXEIRA / f"{nome}.json"
        if origem.resolve().parent != LIXEIRA.resolve() or not origem.is_file():
            return self._json({"erro": "não está na lixeira"}, 404)
        bid = novo = m.group(1)
        with TRAVA_GERAL:   # escolhe o id e reserva a trava antes de mover
            while (DADOS / f"{novo}.json").exists() or (DADOS / f"{novo}.png").exists():
                novo = f"{bid[:55]}-{secrets.token_hex(4)}"
        with trava(novo):
            if (DADOS / f"{novo}.json").exists():
                return self._json({"erro": "conflito; tente de novo"}, 409)
            shutil.move(str(origem), str(DADOS / f"{novo}.json"))
            mini = LIXEIRA / f"{nome}.png"
            if mini.is_file():
                shutil.move(str(mini), str(DADOS / f"{novo}.png"))
        return self._json({"ok": True, "id": novo, "renomeado": novo != bid})


# ---------------- imagens guardadas à parte (slides, PDFs, fotos) ----------------
def guardar_asset(dados: bytes) -> str:
    if dados[:8] == bytes.fromhex("89504e470d0a1a0a"):
        ext = "png"
    elif dados[:3] == bytes.fromhex("ffd8ff"):
        ext = "jpg"
    else:
        raise ValueError("só PNG ou JPEG")
    nome = hashlib.sha1(dados).hexdigest() + "." + ext
    pasta = DADOS / "assets"
    pasta.mkdir(exist_ok=True)
    arq = pasta / nome
    if not arq.exists():
        gravar_atomico(arq, dados)
    return "/assets/" + nome


def coletar_assets_orfaos(dias: int = 7) -> None:
    """Apaga imagens de quadros/assets que nenhum quadro (nem a lixeira) usa há mais de `dias` dias."""
    pasta = DADOS / "assets"
    if not pasta.exists():
        return
    try:
        usados = set()
        for arq in list(DADOS.glob("*.json")) + list(LIXEIRA.glob("*.json")):
            try:
                usados.update(re.findall(r"[0-9a-f]{40}\.(?:png|jpg)", arq.read_text(encoding="utf-8", errors="ignore")))
            except OSError:
                pass
        limite = time.time() - dias * 86400
        for a in pasta.iterdir():
            if ASSET_OK.match(a.name) and a.name not in usados and a.stat().st_mtime < limite:
                a.unlink()
    except Exception as e:
        registrar(e)


# ---------------- PowerPoint → imagens (COM, sem dependências) ----------------
SCRIPT_PPTX = r"""
param([string]$arq, [string]$saida, [int]$largura)
$ErrorActionPreference = 'Stop'
$app = New-Object -ComObject PowerPoint.Application
$app.AutomationSecurity = 3   # msoAutomationSecurityForceDisable: nunca roda macros
$abertas = $app.Presentations.Count
try {
  $p = $app.Presentations.Open($arq, -1, 0, 0)   # somente leitura, sem janela
  $sw = $p.PageSetup.SlideWidth; $sh = $p.PageSetup.SlideHeight
  $altura = [int][Math]::Round($largura * $sh / $sw)
  $i = 0
  foreach ($s in $p.Slides) { $i++; $s.Export((Join-Path $saida ('s{0:D3}.png' -f $i)), 'PNG', $largura, $altura) }
  $p.Close()
  Write-Output ("{0};{1};{2}" -f $sw, $sh, $i)
} finally {
  if ($abertas -eq 0 -and $app.Presentations.Count -eq 0) { $app.Quit() }
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($app)
}
"""


def powerpoint_rodando() -> bool:
    if not WINDOWS:
        return False
    r = subprocess.run(["tasklist", "/FI", "IMAGENAME eq POWERPNT.EXE", "/NH"], capture_output=True, text=True,
                       creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    return "POWERPNT" in (r.stdout or "").upper()


def tem_powerpoint() -> bool:
    if not WINDOWS:
        return False
    try:
        import winreg
        winreg.OpenKey(winreg.HKEY_CLASSES_ROOT, r"PowerPoint.Application")
        return True
    except Exception:
        return False


def checar_pptx(conteudo: bytes) -> str:
    """Aceita PowerPoint (.pptx/.ppsx/.potx e o antigo .ppt/.pps), apresentação ODF (.odp/.otp) e Keynote (.key);
    recusa os formatos com macros. Devolve a extensão a usar na conversão."""
    import io
    import zipfile
    if conteudo[:4] == bytes.fromhex("d0cf11e0"):
        return ".ppt"   # PowerPoint 97-2003 (o conversor abre com as macros desligadas); com senha, a conversão avisa
    if conteudo[:4] != b"PK\x03\x04":
        raise ValueError("Isto não parece uma apresentação (.pptx, .ppt, .odp ou .key).")
    try:
        with zipfile.ZipFile(io.BytesIO(conteudo)) as z:
            nomes = [n.lower() for n in z.namelist()]
            # apresentação aberta (LibreOffice/OpenOffice): o PowerPoint e o LibreOffice abrem
            if "mimetype" in nomes and b"opendocument.presentation" in z.read("mimetype"):
                if any(n.startswith("basic/") for n in nomes):
                    raise ValueError("Apresentações com macros não são aceitas. Salve sem macros e importe de novo.")
                return ".odp"
            # Keynote (Mac): só o LibreOffice converte
            if any(n.startswith("index/") and n.endswith(".iwa") for n in nomes) or "index.zip" in nomes:
                return ".key"
            tipos = z.read("[Content_Types].xml").decode("utf-8", "replace").lower()
    except ValueError:
        raise
    except Exception:
        raise ValueError("O arquivo da apresentação está corrompido.")
    if any("vbaproject" in n for n in nomes) or "macroenabled" in tipos:
        raise ValueError("Apresentações com macros (.pptm) não são aceitas. Salve como .pptx.")
    if "slideshow.main" in tipos:
        return ".ppsx"
    return ".potx" if "template.main" in tipos else ".pptx"


def registrar(e: Exception) -> None:
    if sys.stderr:
        print(f"[Lousa] {type(e).__name__}: {e}", file=sys.stderr)


def achar_libreoffice() -> str | None:
    for nome in ("soffice", "libreoffice"):
        caminho = shutil.which(nome)
        if caminho:
            return caminho
    for c in (os.path.expandvars(r"%ProgramFiles%\LibreOffice\program\soffice.exe"),
              os.path.expandvars(r"%ProgramFiles(x86)%\LibreOffice\program\soffice.exe"),
              "/Applications/LibreOffice.app/Contents/MacOS/soffice"):
        if os.path.exists(c):
            return c
    return None


def converter_pptx_libreoffice(conteudo: bytes, ext: str) -> bytes:
    """PowerPoint -> PDF pelo LibreOffice (Linux, Mac ou Windows sem PowerPoint). A interface lê o PDF com o pdf.js."""
    soffice = achar_libreoffice()
    with tempfile.TemporaryDirectory(prefix="giz-pptx-", ignore_cleanup_errors=True) as tmp:
        arq = Path(tmp) / ("apresentacao" + ext)
        arq.write_bytes(conteudo)
        perfil = (Path(tmp) / "perfil").as_uri()   # perfil próprio: não conflita com um LibreOffice aberto
        try:
            r = subprocess.run([soffice, "--headless", "--norestore", "--nolockcheck", f"-env:UserInstallation={perfil}",
                                "--convert-to", "pdf", "--outdir", tmp, str(arq)],
                               capture_output=True, timeout=180, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        except subprocess.TimeoutExpired:
            raise ValueError("O LibreOffice demorou demais para converter. Salve como PDF e importe o PDF.")
        pdf = Path(tmp) / "apresentacao.pdf"
        if r.returncode != 0 or not pdf.exists():
            raise RuntimeError((r.stderr or r.stdout).decode("utf-8", "replace")[-300:])
        return pdf.read_bytes()


def converter_pptx(conteudo: bytes, nome: str = "", largura: int = 1920) -> dict:
    ext = checar_pptx(conteudo)
    if ext == ".key":
        if not achar_libreoffice():
            raise ValueError("Para abrir Keynote é preciso ter o LibreOffice (gratuito) instalado. "
                             "Outra saída: exporte do Keynote como PDF ou PowerPoint e importe esse arquivo.")
        return {"pdf": base64.b64encode(converter_pptx_libreoffice(conteudo, ext)).decode("ascii")}
    if not tem_powerpoint():
        if achar_libreoffice():
            return {"pdf": base64.b64encode(converter_pptx_libreoffice(conteudo, ext)).decode("ascii")}
        raise ValueError("Para abrir PowerPoint é preciso ter o PowerPoint ou o LibreOffice (gratuito) instalado. "
                         "Outra saída: salve os slides como PDF e importe o PDF.")
    with tempfile.TemporaryDirectory(prefix="lousa-pptx-", ignore_cleanup_errors=True) as tmp:
        arq = Path(tmp) / ("apresentacao" + ext)
        arq.write_bytes(conteudo)
        script = Path(tmp) / "exportar.ps1"
        script.write_text(SCRIPT_PPTX, encoding="utf-8-sig")
        saida = Path(tmp) / "slides"
        saida.mkdir()
        # o arquivo veio de fora: marca como "baixado da internet" para o Office tratá-lo com cautela
        try:
            with open(str(arq) + ":Zone.Identifier", "w") as z:
                z.write("[ZoneTransfer]\nZoneId=3\n")
        except OSError:
            pass
        antes = powerpoint_rodando()
        try:
            r = subprocess.run(["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(script),
                                str(arq), str(saida), str(largura)],
                               capture_output=True, text=True, timeout=180,
                               creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        except subprocess.TimeoutExpired:
            if not antes:   # só encerra o PowerPoint se fomos nós que o abrimos
                subprocess.run(["taskkill", "/IM", "POWERPNT.EXE", "/F"], capture_output=True,
                               creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
            raise ValueError("O PowerPoint demorou demais (o arquivo pode pedir senha ou reparo). Salve como PDF e importe o PDF.")
        if r.returncode != 0:
            raise RuntimeError((r.stderr or r.stdout).strip()[-400:])
        sw, sh, _ = r.stdout.strip().splitlines()[-1].split(";")
        slides = [guardar_asset(png.read_bytes()) for png in sorted(saida.glob("s*.png"))]
        return {"width": float(sw.replace(",", ".")), "height": float(sh.replace(",", ".")), "slides": slides}


# ---------------- escrita à mão → texto (reconhecedor do Windows, offline) ----------------
SCRIPT_OCR = r"""
param([string]$entrada)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.UI.Input.Inking.InkStrokeContainer, Windows.UI.Input.Inking, ContentType=WindowsRuntime]
[void][Windows.UI.Input.Inking.InkRecognizerContainer, Windows.UI.Input.Inking, ContentType=WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [Type]$tipo) { $t = $asTask.MakeGenericMethod($tipo).Invoke($null, @($op)); [void]$t.Wait(-1); $t.Result }
$dados = Get-Content -Raw -Encoding UTF8 $entrada | ConvertFrom-Json
$builder = New-Object Windows.UI.Input.Inking.InkStrokeBuilder
$cont = New-Object Windows.UI.Input.Inking.InkStrokeContainer
foreach ($tr in $dados.strokes) {
  $pts = New-Object 'System.Collections.Generic.List[Windows.UI.Input.Inking.InkPoint]'
  for ($i = 0; $i + 1 -lt $tr.Count; $i += 2) {
    $pts.Add((New-Object Windows.UI.Input.Inking.InkPoint((New-Object Windows.Foundation.Point([double]$tr[$i], [double]$tr[$i + 1])), 0.5)))
  }
  if ($pts.Count -gt 0) { $cont.AddStroke($builder.CreateStrokeFromInkPoints($pts, [System.Numerics.Matrix3x2]::Identity)) }
}
$rc = New-Object Windows.UI.Input.Inking.InkRecognizerContainer
$pt = $rc.GetRecognizers() | Where-Object { $_.Name -match 'Portugu' } | Select-Object -First 1
if ($pt) { $rc.SetDefaultRecognizer($pt) }
$res = Await ($rc.RecognizeAsync($cont, [Windows.UI.Input.Inking.InkRecognitionTarget]::All)) ([System.Collections.Generic.IReadOnlyList[Windows.UI.Input.Inking.InkRecognitionResult]])
$saida = @()
foreach ($r in $res) { $saida += ,@($r.GetTextCandidates()) }
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
ConvertTo-Json -Compress -Depth 4 @{ palavras = $saida }
"""


def reconhecer_escrita(strokes: list) -> list:
    if not WINDOWS:
        raise ValueError("A conversão de escrita em texto usa o reconhecedor do Windows e não existe neste sistema.")
    with tempfile.TemporaryDirectory(prefix="lousa-ocr-") as tmp:
        entrada = Path(tmp) / "tracos.json"
        entrada.write_text(json.dumps({"strokes": [[round(float(v), 1) for v in tr] for tr in strokes]}), encoding="utf-8")
        script = Path(tmp) / "ocr.ps1"
        script.write_text(SCRIPT_OCR, encoding="utf-8-sig")
        r = subprocess.run(["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(script), str(entrada)],
                           capture_output=True, timeout=60, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        saida = r.stdout.decode("utf-8", "replace").strip()
        if r.returncode != 0 or not saida:
            raise RuntimeError(r.stderr.decode("utf-8", "replace").strip()[-300:])
        palavras = json.loads(saida.splitlines()[-1]).get("palavras") or []
        # o ConvertTo-Json do PowerShell 5 achata listas de um item: normaliza para [[...], ...]
        return [p if isinstance(p, list) else [p] for p in palavras]


# ---------------- PDF a partir de imagens JPEG (uma por página) ----------------
def montar_pdf(paginas: list) -> bytes:
    """paginas: [{w, h (pontos), jpeg (dataURL), pw, ph (pixels)}]"""
    objs: list[bytes] = []

    def novo(conteudo: bytes) -> int:
        objs.append(conteudo)
        return len(objs)

    kids = []
    novo(b"")  # 1: catálogo (preenchido no fim)
    novo(b"")  # 2: árvore de páginas
    for i, pg in enumerate(paginas):
        jpg = base64.b64decode(pg["jpeg"].split(",", 1)[1])
        w, h, pw, ph = float(pg["w"]), float(pg["h"]), int(pg["pw"]), int(pg["ph"])
        img = novo(b"<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB "
                   b"/BitsPerComponent 8 /Filter /DCTDecode /Length %d >>\nstream\n" % (pw, ph, len(jpg)) + jpg + b"\nendstream")
        cmd = b"q %.2f 0 0 %.2f 0 0 cm /Im0 Do Q" % (w, h)
        cont = novo(b"<< /Length %d >>\nstream\n" % len(cmd) + cmd + b"\nendstream")
        kids.append(novo(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.2f %.2f] /Resources << /XObject << /Im0 %d 0 R >> >> "
                         b"/Contents %d 0 R >>" % (w, h, img, cont)))
    objs[0] = b"<< /Type /Catalog /Pages 2 0 R >>"
    objs[1] = b"<< /Type /Pages /Kids [" + b" ".join(b"%d 0 R" % k for k in kids) + b"] /Count %d >>" % len(kids)
    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    pos = []
    for n, o in enumerate(objs, 1):
        pos.append(len(out))
        out += b"%d 0 obj\n" % n + o + b"\nendobj\n"
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objs) + 1)
    for p in pos:
        out += b"%010d 00000 n \n" % p
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objs) + 1, xref)
    return bytes(out)


# ---------------- inicialização ----------------
def info_rodando(porta: int):
    try:
        with socket.create_connection(("127.0.0.1", porta), timeout=0.3):
            pass
    except OSError:
        return None
    try:
        import urllib.request
        req = urllib.request.Request(f"http://127.0.0.1:{porta}/api/info", headers={"Host": f"127.0.0.1:{porta}"})
        with urllib.request.urlopen(req, timeout=1) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception:
        pass
    try:   # versão anterior à 1.0 (sem /api/info): /api/boards devolve uma lista
        with urllib.request.urlopen(f"http://127.0.0.1:{porta}/api/boards", timeout=1) as r:
            if isinstance(json.loads(r.read().decode("utf-8")), list):
                return {"lousa_antiga": True}
    except Exception:
        pass
    return {"desconhecido": True}


def pedir_saida(porta: int, info: dict) -> bool:
    """Fecha outro Giz Livre que esteja na porta. Devolve True se a porta ficou livre."""
    import urllib.request
    token = info.get("token") if isinstance(info, dict) else None
    if token:   # versão 1.0 ou mais nova: pede para sair educadamente
        try:
            req = urllib.request.Request(f"http://127.0.0.1:{porta}/api/sair", data=b"{}", method="POST",
                                         headers={"X-Lousa": token, "Content-Type": "application/json"})
            urllib.request.urlopen(req, timeout=2).read()
        except Exception:
            pass
        for _ in range(30):
            if info_rodando(porta) is None:
                return True
            time.sleep(0.1)
    # versão antiga (sem /api/sair): só encerra o processo se for mesmo um Giz Livre e o professor concordar
    if not (info.get("lousa_antiga") or token):
        return False
    if not WINDOWS:
        return False
    if not confirmar(f"Há outra cópia do Giz Livre aberta (porta {porta}). Fechá-la para abrir esta?"):
        return False
    ps = (f"$c = Get-NetTCPConnection -LocalPort {porta} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; "
          "if ($c) { $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue; "
          "if ($p -and $p.ProcessName -match '^(python|pythonw|GizLivre|GizLivre)$') { Stop-Process -Id $p.Id -Force } }")
    subprocess.run(["powershell.exe", "-NoProfile", "-Command", ps], capture_output=True, timeout=20,
                   creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    for _ in range(30):
        if info_rodando(porta) is None:
            return True
        time.sleep(0.1)
    return False


def confirmar(msg: str) -> bool:
    try:
        import ctypes
        return ctypes.windll.user32.MessageBoxW(None, msg, "Giz Livre", 0x24) == 6   # Sim/Não
    except Exception:
        return False


def abrir_janela(url: str) -> None:
    """Abre o programa numa janela própria (modo app) do Edge/Chrome/Chromium; senão, no navegador padrão."""
    if WINDOWS:
        candidatos = [
            os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
            os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
            os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
            os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
        ]
    elif MAC:
        candidatos = [f"/Applications/{a}.app/Contents/MacOS/{a}" for a in
                      ("Google Chrome", "Microsoft Edge", "Chromium", "Brave Browser")]
    else:
        candidatos = [shutil.which(n) or "" for n in
                      ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge", "brave-browser")]
    for exe in candidatos:
        if exe and os.path.exists(exe):
            try:
                subprocess.Popen([exe, f"--app={url}", "--start-maximized"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return
            except OSError:
                continue
    webbrowser.open(url)


# ---- ícone na barra de tarefas (Windows) ----
# A interface roda numa janela do Edge/Chrome em modo app. Sem isto, ao fixar na barra de tarefas o Windows guarda o
# Edge (ícone e atalho). Aqui marcamos a janela com o AppUserModelID do Giz Livre (o mesmo dos atalhos do instalador)
# e com o comando/ícone para reabrir o programa. Tudo é opcional: se falhar, o programa segue normal.
APP_ID = "GizLivre"
_FMT_AUMID = "{9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3}"
_PID_RELAUNCH_CMD, _PID_RELAUNCH_ICON, _PID_RELAUNCH_NOME, _PID_ID = 2, 3, 4, 5


def _caminho_curto(caminho: str) -> str:
    try:
        import ctypes
        buf = ctypes.create_unicode_buffer(520)
        n = ctypes.windll.kernel32.GetShortPathNameW(caminho, buf, 520)
        return buf.value if 0 < n < 520 else caminho
    except Exception:
        return caminho


def comando_relancar() -> tuple[str, str]:
    """(linha de comando, ícone "caminho,0") para reabrir o Giz Livre a partir do pino da barra de tarefas.
    A janela guarda no máximo MAX_PATH caracteres: se passar, encurta os caminhos e, em último caso, larga as opções."""
    extra = [a for a in sys.argv[1:] if a != "--sem-auto-encerrar"]
    if CONGELADO:
        exe = str(Path(sys.executable).resolve())
        base, ico = [exe], exe
    else:
        py = Path(sys.executable).resolve()
        pyw = py.with_name("pythonw.exe")
        exe = str(pyw if pyw.exists() else py)
        icone = RAIZ / "installer" / "lousa.ico"
        base, ico = [exe, str(Path(__file__).resolve())], str(icone if icone.exists() else exe)
    curtos = [_caminho_curto(c) for c in base]
    for partes in ([*base, *extra], [*curtos, *extra], curtos):
        cmd = subprocess.list2cmdline(partes)
        if len(cmd) < 260:
            break
    if len(ico) + 2 >= 260:
        ico = _caminho_curto(ico)
    return cmd, f"{ico},0"


def _com_aumid():
    """Prepara as estruturas ctypes de IPropertyStore (só Windows). Devolve (definir, ler, listar_janelas)."""
    import ctypes
    from ctypes import wintypes

    class GUID(ctypes.Structure):
        _fields_ = [("d1", ctypes.c_ulong), ("d2", ctypes.c_ushort), ("d3", ctypes.c_ushort), ("d4", ctypes.c_ubyte * 8)]

    class PROPERTYKEY(ctypes.Structure):
        _fields_ = [("fmtid", GUID), ("pid", wintypes.DWORD)]

    class _Valor(ctypes.Union):
        _fields_ = [("ptr", ctypes.c_void_p), ("pad", ctypes.c_ulonglong * 2)]

    class PROPVARIANT(ctypes.Structure):
        _fields_ = [("vt", ctypes.c_ushort), ("r1", ctypes.c_ushort), ("r2", ctypes.c_ushort), ("r3", ctypes.c_ushort),
                    ("v", _Valor)]

    VT_EMPTY, VT_LPWSTR = 0, 31
    ole32, shell32, user32 = ctypes.windll.ole32, ctypes.windll.shell32, ctypes.windll.user32

    def guid(texto):
        g = GUID()
        if ole32.CLSIDFromString(ctypes.c_wchar_p(texto), ctypes.byref(g)) != 0:
            raise OSError("GUID inválido")
        return g

    iid_store = guid("{886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99}")
    fmt = guid(_FMT_AUMID)
    shell32.SHGetPropertyStoreForWindow.argtypes = [wintypes.HWND, ctypes.POINTER(GUID), ctypes.POINTER(ctypes.c_void_p)]
    shell32.SHGetPropertyStoreForWindow.restype = ctypes.c_long
    PROTO_REL = ctypes.WINFUNCTYPE(ctypes.c_ulong, ctypes.c_void_p)
    PROTO_GET = ctypes.WINFUNCTYPE(ctypes.c_long, ctypes.c_void_p, ctypes.POINTER(PROPERTYKEY), ctypes.POINTER(PROPVARIANT))
    PROTO_SET = PROTO_GET
    PROTO_COMMIT = ctypes.WINFUNCTYPE(ctypes.c_long, ctypes.c_void_p)
    ole32.PropVariantClear.argtypes = [ctypes.POINTER(PROPVARIANT)]

    def chave(pid):
        return PROPERTYKEY(fmt, pid)

    def com_store(hwnd, fn):
        store = ctypes.c_void_p()
        if shell32.SHGetPropertyStoreForWindow(hwnd, ctypes.byref(iid_store), ctypes.byref(store)) != 0 or not store:
            raise OSError("sem IPropertyStore")
        vt = ctypes.cast(store, ctypes.POINTER(ctypes.POINTER(ctypes.c_void_p)))[0]
        try:
            return fn(store, vt)
        finally:
            PROTO_REL(vt[2])(store)

    def ler(hwnd, pid=_PID_ID) -> str:
        def fn(store, vt):
            pv = PROPVARIANT()
            if PROTO_GET(vt[5])(store, ctypes.byref(chave(pid)), ctypes.byref(pv)) != 0:
                return ""
            try:
                return ctypes.wstring_at(pv.v.ptr) if pv.vt == VT_LPWSTR and pv.v.ptr else ""
            finally:
                ole32.PropVariantClear(ctypes.byref(pv))
        return com_store(hwnd, fn)

    def definir(hwnd, valores: dict) -> None:
        def fn(store, vt):
            definir_valor = PROTO_SET(vt[6])
            erros = []
            for pid, texto in valores.items():   # cada propriedade por si: uma recusada não impede as outras
                buf = ctypes.create_unicode_buffer(texto)
                pv = PROPVARIANT()
                pv.vt = VT_LPWSTR
                pv.v.ptr = ctypes.cast(buf, ctypes.c_void_p).value
                r = definir_valor(store, ctypes.byref(chave(pid)), ctypes.byref(pv))
                if r != 0:
                    erros.append(f"{pid}: {r & 0xFFFFFFFF:#010x}")
            PROTO_COMMIT(vt[7])(store)
            if erros:
                raise OSError("SetValue recusado (" + ", ".join(erros) + ")")
        com_store(hwnd, fn)

    WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    user32.EnumWindows.argtypes = [WNDENUMPROC, wintypes.LPARAM]

    def janelas_do_programa() -> list:
        """Janelas de nível superior do Edge/Chrome cujo título é o da página do Giz Livre (modo app: só o título)."""
        achadas = []

        def cada(hwnd, _):
            try:
                if not user32.IsWindowVisible(hwnd):
                    return True
                cls = ctypes.create_unicode_buffer(64)
                user32.GetClassNameW(hwnd, cls, 64)
                if cls.value != "Chrome_WidgetWin_1":
                    return True
                tit = ctypes.create_unicode_buffer(512)
                user32.GetWindowTextW(hwnd, tit, 512)
                t = tit.value
                if t == "Giz Livre" or t.endswith(" — Giz Livre"):
                    achadas.append(hwnd)
            except Exception:
                pass
            return True

        user32.EnumWindows(WNDENUMPROC(cada), 0)
        return achadas

    return definir, ler, janelas_do_programa


def marcar_janelas_na_barra(parar: threading.Event) -> None:
    """Vigia as janelas do Giz Livre e aplica o AUMID/ícone de relançamento (também reaplica se o Edge trocar)."""
    try:
        if not WINDOWS:
            return
        import ctypes
        ctypes.windll.ole32.CoInitialize(None)
        definir, ler, janelas = _com_aumid()
        cmd, ico = comando_relancar()
        # o ID vem primeiro: sem ele a janela recusa as propriedades de relançamento
        valores = {_PID_ID: APP_ID, _PID_RELAUNCH_CMD: cmd, _PID_RELAUNCH_ICON: ico, _PID_RELAUNCH_NOME: "Giz Livre"}
    except Exception as e:
        registrar(e)
        return
    inicio, falhas = time.time(), 0
    while not parar.is_set() and falhas < 20:
        for hwnd in janelas():
            try:
                if ler(hwnd) != APP_ID:
                    definir(hwnd, valores)
            except Exception as e:
                falhas += 1
                if falhas == 1:
                    registrar(e)
        # logo depois de abrir a janela, olha com frequência; depois, só de vez em quando (janelas novas, troca do Edge)
        parar.wait(0.5 if time.time() - inicio < 30 else 3)


def vigiar_inatividade(srv, limite_s: int) -> None:
    # a página manda /api/ping a cada 30 s; sem janela aberta por `limite_s`, o servidor se encerra sozinho
    while True:
        time.sleep(15)
        if time.time() - ULTIMA_ATIVIDADE > limite_s:
            srv.shutdown()
            return


def aviso(msg: str) -> None:
    # o executável não tem console: mostra uma janela de aviso
    if CONGELADO:
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(None, msg, "Giz Livre", 0x30)
            return
        except Exception:
            pass
    print(msg, file=sys.stderr)


def main():
    global DADOS, LIXEIRA, PORTA
    ap = argparse.ArgumentParser()
    ap.add_argument("--porta", type=int, default=8765)
    ap.add_argument("--sem-janela", action="store_true")
    ap.add_argument("--dados", help="pasta dos quadros (padrão: quadros/ ao lado do server.py)")
    ap.add_argument("--sem-auto-encerrar", action="store_true")
    args = ap.parse_args()
    if args.dados:
        DADOS = Path(args.dados).resolve()
        LIXEIRA = DADOS / "lixeira"
    DADOS.mkdir(parents=True, exist_ok=True)
    LIXEIRA.mkdir(exist_ok=True)
    PORTA = args.porta
    url = f"http://127.0.0.1:{PORTA}/"

    atual = info_rodando(PORTA)
    if atual is not None:
        if atual.get("dados") == str(DADOS):      # mesma cópia já no ar: só abre outra janela
            if not args.sem_janela:
                abrir_janela(url)
            return
        if not pedir_saida(PORTA, atual):           # outra cópia (ex.: instalada e portátil) ou versão antiga: troca
            aviso(f"A porta {PORTA} está ocupada por outro programa. Feche-o e abra o Giz Livre de novo.")
            return 1
        if info_rodando(PORTA) is not None:
            aviso(f"A porta {PORTA} está ocupada por outro programa. Feche-o e abra o Giz Livre de novo.")
            return 1

    srv = ThreadingHTTPServer(("127.0.0.1", PORTA), Handler)
    threading.Thread(target=coletar_assets_orfaos, daemon=True).start()
    if sys.stdout:
        print(f"Giz Livre {VERSAO} em {url}  (quadros em {DADOS})")
    if not args.sem_janela:
        threading.Timer(0.4, abrir_janela, args=(url,)).start()
        if WINDOWS:
            threading.Thread(target=marcar_janelas_na_barra, args=(threading.Event(),), daemon=True).start()
    if not args.sem_auto_encerrar and not args.sem_janela:
        threading.Thread(target=vigiar_inatividade, args=(srv, 20 * 60), daemon=True).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    sys.exit(main())
