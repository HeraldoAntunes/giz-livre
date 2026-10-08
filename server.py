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
VERSAO = "1.0.1"
ID_OK = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
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
            for arq in DADOS.glob("*.json"):
                if not ID_OK.match(arq.stem):
                    continue
                try:
                    with open(arq, encoding="utf-8") as f:
                        b = json.load(f)
                    lista.append({"id": arq.stem, "title": b.get("title") or "Sem título",
                                  "updated": b.get("updated") or arq.stat().st_mtime * 1000,
                                  "mode": (b.get("layout") or {}).get("mode", "free")})
                except Exception:
                    continue
            lista.sort(key=lambda x: x["updated"], reverse=True)
            return self._json(lista)
        if rota == "/api/info":
            return self._json({"versao": VERSAO, "dados": str(DADOS), "token": TOKEN, "sistema": sys.platform,
                               "pptx": "powerpoint" if tem_powerpoint() else ("libreoffice" if achar_libreoffice() else None),
                               "ocr": WINDOWS})
        if rota == "/api/ping":
            return self._json({"ok": True})
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
            png = None
            thumb = pacote.get("thumb")
            if thumb:
                if not isinstance(thumb, str) or not thumb.startswith("data:image/png;base64,"):
                    raise ValueError("miniatura inválida")
                png = base64.b64decode(thumb.split(",", 1)[1], validate=True)
            board["title"] = str(pacote.get("title") or board.get("title") or "Sem título")[:200]
            board["updated"] = int(time.time() * 1000)
            dados = json.dumps(board, ensure_ascii=False, allow_nan=False).encode("utf-8")
        except Exception as e:
            return self._json({"erro": str(e)}, 400)
        with trava(bid):
            gravar_atomico(DADOS / f"{bid}.json", dados)
            if png:
                gravar_atomico(DADOS / f"{bid}.png", png)
        return self._json({"ok": True, "updated": board["updated"]})

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
            for ext in (".json", ".png"):
                arq = DADOS / f"{bid}{ext}"
                if arq.exists():
                    shutil.move(str(arq), str(LIXEIRA / f"{bid}_{carimbo}{ext}"))
        return self._json({"ok": True})


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
    """Aceita só PowerPoint moderno (ZIP/OOXML) sem macros; devolve a extensão a usar."""
    import io
    import zipfile
    if conteudo[:4] == bytes.fromhex("d0cf11e0"):
        raise ValueError("Arquivo antigo (.ppt) ou protegido por senha. Salve como .pptx sem senha e importe de novo.")
    if conteudo[:4] != b"PK\x03\x04":
        raise ValueError("Isto não parece um arquivo do PowerPoint (.pptx).")
    try:
        with zipfile.ZipFile(io.BytesIO(conteudo)) as z:
            nomes = [n.lower() for n in z.namelist()]
            tipos = z.read("[Content_Types].xml").decode("utf-8", "replace").lower()
    except Exception:
        raise ValueError("O arquivo do PowerPoint está corrompido.")
    if any("vbaproject" in n for n in nomes) or "macroenabled" in tipos:
        raise ValueError("Apresentações com macros (.pptm) não são aceitas. Salve como .pptx.")
    return ".ppsx" if "slideshow.main" in tipos else ".pptx"


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
    try:   # Lousa de 07/10 (sem /api/info): /api/boards devolve uma lista
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
    if token:   # Lousa 1.0+: pede para sair educadamente
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
    # versão antiga (sem /api/sair): só mata se for mesmo umo Giz Livre e o professor concordar
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
        if not pedir_saida(PORTA, atual):           # outra cópia (ex.: C: × J:) ou versão antiga: troca
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
    if not args.sem_auto_encerrar and not args.sem_janela:
        threading.Thread(target=vigiar_inatividade, args=(srv, 20 * 60), daemon=True).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    sys.exit(main())
