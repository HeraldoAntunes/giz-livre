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
import math
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
import unicodedata
import urllib.parse
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
VERSAO = "1.5.0"
# nomes reservados do Windows (CON, NUL, COM1...) não viram nome de arquivo
ID_OK = re.compile(r"^(?!(?:con|prn|aux|nul|com[0-9]|lpt[0-9])$)[A-Za-z0-9_-]{1,64}$", re.IGNORECASE)
# arquivo da lixeira: <id>_<AAAAMMDD-HHMMSS>[-n] (o DELETE dá esse nome); barra e ponto nunca passam
LIXO_OK = re.compile(r"^([A-Za-z0-9_-]{1,64})_(\d{8}-\d{6})(?:-\d{1,4})?$")
ASSET_OK = re.compile(r"^[0-9a-f]{40}\.(png|jpg)$")
TIPOS = {"png": "image/png", "jpg": "image/jpeg"}
MB = 1024 * 1024
LIMITES = {"boards": 200 * MB, "thumbs": 5 * MB, "assets": 40 * MB, "pptx": 300 * MB, "pdf": 300 * MB, "ocr": 2 * MB,
           "agente": 1 * MB, "outros": 64 * 1024}
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


def numero(v) -> float:
    """Número finito vindo de um JSON; qualquer outra coisa vira 0."""
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else 0


def resumo_quadro(arq: Path) -> dict:
    st = arq.stat()
    chave = (st.st_mtime_ns, st.st_size)
    guardado = RESUMOS.get(arq.stem)
    if guardado and guardado[:2] == chave:
        return guardado[2]
    with open(arq, encoding="utf-8") as f:
        b = json.load(f)
    r = {"id": arq.stem, "title": b.get("title") or "Sem título",
         "updated": numero(b.get("updated")) or st.st_mtime * 1000,
         "mode": (b.get("layout") or {}).get("mode", "free")}
    pasta = nome_pasta(b.get("folder"))
    if pasta:
        r["folder"] = pasta
    if b.get("criado_por") == "agente":   # a galeria pode mostrar que o quadro veio de um agente de IA
        r["criado_por"] = "agente"
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


def listar_quadros() -> list:
    """Resumos dos quadros da galeria, o editado mais recente primeiro."""
    lista = []
    vistos = set()
    for arq in DADOS.glob("*.json"):
        if not ID_OK.match(arq.stem):
            continue
        try:
            # a miniatura muda sem o quadro mudar (e um quadro feito por agente só ganha a dele ao ser aberto):
            # confere a cada listagem, fora do resumo guardado, para a galeria não pedir imagem que não existe
            lista.append({**resumo_quadro(arq), "thumb": (DADOS / f"{arq.stem}.png").is_file()})
            vistos.add(arq.stem)
        except Exception:
            continue
    with TRAVA_GERAL:   # esquece os quadros que saíram da pasta (lixeira)
        for k in [k for k in RESUMOS if k not in vistos]:
            RESUMOS.pop(k, None)
    lista.sort(key=lambda x: x["updated"], reverse=True)
    return lista


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(APP), **kw)

    def log_message(self, fmt, *args):  # silencioso
        pass

    def list_directory(self, path):   # pastas de app/ não são listadas
        self.send_error(404)
        return None

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Content-Security-Policy",
                         "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; "
                         "font-src 'self' data:; script-src 'self'; worker-src 'self' blob:; connect-src 'self' data: blob:; "
                         "object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
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

    def _canal_ok(self, rota: str) -> bool:
        # o token de agente não vale nas rotas da página: pedido com X-Agente fora de /api/agente/ é recusado
        if "X-Agente" in self.headers and not rota.startswith("/api/agente/"):
            self._json({"erro": "o token de agente só vale nas rotas /api/agente/"}, 403)
            return False
        return True

    def _agente(self, metodo: str, rota: str):
        """Rotas /api/agente/*: só com o interruptor ligado e o token de agente, nunca vindas de um navegador."""
        if self.headers.get("Origin") or self.headers.get("Sec-Fetch-Site") or self.headers.get("Sec-Fetch-Mode"):
            return self._json({"erro": "o canal dos agentes não aceita pedidos de páginas da web"}, 403)
        if "X-Lousa" in self.headers:
            return self._json({"erro": "o token da página não vale no canal dos agentes"}, 403)
        cfg = agente_config()
        if not cfg:
            return self._json({"erro": "Agentes de IA desligados no Giz Livre. Para usar, o professor liga "
                                       "\"Permitir agentes de IA\" no menu do Giz Livre."}, 403)
        if not secrets.compare_digest(self.headers.get("X-Agente", ""), cfg["token"]):
            return self._json({"erro": "token de agente inválido (o interruptor foi desligado e ligado de novo?)"}, 401)
        partes = rota[len("/api/agente/"):].split("/")
        consulta = urllib.parse.parse_qs(self.path.partition("?")[2])

        def q(nome, padrao=""):
            return (consulta.get(nome) or [padrao])[0]

        def limite(padrao, maximo):
            v = q("limite", str(padrao))
            return int(num_agente({"limite": int(v) if v.isdigit() else -1}, "limite", 1, maximo))

        def precisa(nivel):
            if cfg["nivel"] < nivel:
                raise RecusaAgente(f"O nível escolhido no Giz Livre ({cfg['nivel']}, {NIVEIS[cfg['nivel']]}) não "
                                   f"permite isto; é preciso o nível {nivel} ({NIVEIS[nivel]}).", 403)

        def id_ok(bid):
            if not ID_OK.match(bid):
                raise RecusaAgente("id de quadro inválido")
            return bid

        try:
            if metodo == "GET":
                precisa(1)
                if partes == ["estado"]:
                    registrar_agente("estado")
                    return self._json({"versao": VERSAO, "nivel": cfg["nivel"], "nivel_nome": NIVEIS[cfg["nivel"]],
                                       "niveis": NIVEIS, "quadros_abertos": sorted(quadros_abertos()),
                                       "formatos": ["infinito", *FORMATOS], "controle_ao_vivo": False})
                if partes == ["quadros"]:
                    n = limite(50, 200)
                    pasta, busca = nome_pasta(q("pasta")), q("busca").lower()
                    abertos = quadros_abertos()
                    lista = [{"quadro": b["id"], "titulo": b["title"], "pasta": b.get("folder", ""),
                              "modo": b["mode"], "editado": b["updated"], "aberto": b["id"] in abertos,
                              "criado_por": b.get("criado_por")}
                             for b in listar_quadros()
                             if (not pasta or b.get("folder") == pasta) and busca in b["title"].lower()]
                    registrar_agente("listar_quadros")
                    return self._json({"quadros": lista[:n], "total": len(lista)})
                if len(partes) == 2 and partes[0] == "quadros":
                    bid = id_ok(partes[1])
                    detalhe = q("detalhe", "resumo")
                    if detalhe not in ("resumo", "completo"):
                        raise RecusaAgente("detalhe: resumo ou completo")
                    r = quadro_para_agente(bid, ler_quadro_disco(bid), detalhe)
                    registrar_agente("ler_quadro", bid)
                    return self._json(r)
                if partes == ["formas"]:
                    n = limite(30, 100)
                    registrar_agente("listar_formas")
                    return self._json({"formas": buscar_formas(q("busca")[:100], q("grupo")[:60], n),
                                       "grupos": sorted({f["grupo"] for f in indice()["formas"]})})
                if partes == ["modelos"]:
                    area = q("area")
                    registrar_agente("listar_modelos")
                    return self._json({"modelos": [m for m in indice()["modelos"] if not area or m["area"] == area],
                                       "areas": sorted({m["area"] for m in indice()["modelos"]})})
                raise RecusaAgente("rota", 404)
            corpo = self._corpo("agente")
            if corpo is None:
                return
            try:
                spec = json.loads(corpo.decode("utf-8") or "{}",
                                  parse_constant=lambda c: (_ for _ in ()).throw(ValueError(c)))
            except ValueError:
                raise RecusaAgente("JSON inválido")
            if not isinstance(spec, dict):
                raise RecusaAgente("esperado um objeto JSON")
            precisa(2)
            if partes == ["quadros"]:
                r = criar_quadro_agente(spec)
                registrar_agente("criar_quadro", r["quadro"])
                return self._json(r)
            if len(partes) == 3 and partes[0] == "quadros" and partes[2] in ("itens", "paginas"):
                bid = id_ok(partes[1])
                if partes[2] == "paginas":
                    r = alterar_quadro(bid, cfg, lambda b: adicionar_paginas(b, spec))
                    registrar_agente("adicionar_pagina", bid)
                else:
                    pedidos = spec.get("itens")
                    if not isinstance(pedidos, list) or not 1 <= len(pedidos) <= 50 or \
                            not all(isinstance(p, dict) for p in pedidos):
                        raise RecusaAgente("itens: lista com 1 a 50 pedidos")

                    def acrescentar(board):
                        criados, avisos = [], []
                        for n, p in enumerate(pedidos, 1):   # um de cada vez: cada item entra abaixo do anterior
                            try:
                                it, aviso = item_do_agente(board, p)
                            except RecusaAgente as e:   # tudo ou nada: nada foi gravado; diz qual item falhou
                                if len(pedidos) == 1:
                                    raise
                                raise RecusaAgente(f"item {n} ({str(p.get('tipo'))[:12]}): {e}; nenhum item foi gravado",
                                                   e.status)
                            board["items"] = [*board["items"], it]
                            criados.append(it["id"])
                            if aviso and aviso not in avisos:
                                avisos.append(aviso)
                        r = {"itens_criados": criados}
                        if avisos:
                            r["aviso"] = "; ".join(avisos)
                        if any(i.get("type") == "pendente" and i["id"] in criados for i in board["items"]
                               if isinstance(i, dict)):
                            r["observacao"] = ("fórmulas e gráficos aparecem quando o professor abrir o quadro "
                                               "no Giz Livre, que os desenha")
                        return r
                    r = alterar_quadro(bid, cfg, acrescentar)
                    registrar_agente("itens:" + ",".join(sorted({str(p.get("tipo"))[:12] for p in pedidos})), bid)
                r["quadro"] = bid
                return self._json(r)
            raise RecusaAgente("rota", 404)
        except RecusaAgente as e:
            return self._json({"erro": str(e)}, e.status)
        except (OSError, ValueError) as e:
            registrar(e)
            return self._json({"erro": "falha ao gravar o quadro; nada foi alterado"}, 500)

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
        if not self._canal_ok(rota):
            return
        if rota.startswith("/api/agente/"):
            return self._agente("GET", rota)
        if rota == "/api/agentes":   # painel do interruptor na página (o token de agente nunca vai para a página)
            if not self._escrita_ok():
                return
            cfg = agente_config()
            return self._json({"ligado": bool(cfg), "nivel": cfg["nivel"] if cfg else NIVEL_PADRAO,
                               "niveis": NIVEIS, "registro": ultimas_linhas_registro()})
        if rota == "/api/boards":
            return self._json(listar_quadros())
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
        if not self._host_ok() or not self._canal_ok(self.path.split("?")[0]):
            return
        if self.path.startswith("/api/agente/"):
            return self._json({"erro": "rota"}, 404)
        if not self._escrita_ok():
            return
        rota = self._rota()
        if rota == "/api/agentes":
            corpo = self._corpo()
            if corpo is None:
                return
            try:
                pacote = json.loads(corpo.decode("utf-8"))
                nivel = pacote.get("nivel", NIVEL_PADRAO) if isinstance(pacote, dict) else None
                if not isinstance(pacote.get("ligado"), bool) or type(nivel) is not int or nivel not in NIVEIS:
                    raise ValueError("pedido inválido")
            except Exception as e:
                return self._json({"erro": str(e)}, 400)
            if pacote["ligado"]:
                agente_ligar(nivel)
            else:
                agente_desligar()
            cfg = agente_config()
            return self._json({"ligado": bool(cfg), "nivel": cfg["nivel"] if cfg else nivel})
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
        if not self._host_ok() or not self._canal_ok(self.path.split("?")[0]):
            return
        if self.path.startswith("/api/agente/"):
            return self._agente("POST", self._rota())
        if not self._escrita_ok():
            return
        rota = self._rota()
        if rota == "/api/ping":
            # {janela, quadro}: o quadro aberto em cada janela, para o agente não gravar num quadro que está na tela
            corpo = self._corpo()
            if corpo is None:
                return
            try:
                pacote = json.loads(corpo.decode("utf-8")) if corpo.strip() else {}
            except ValueError:
                pacote = {}
            if isinstance(pacote, dict) and isinstance(pacote.get("janela"), str) and JANELA_OK.match(pacote["janela"]):
                marcar_aberto(pacote["janela"], pacote.get("quadro"))
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
        if not self._host_ok() or not self._canal_ok(self.path.split("?")[0]):
            return
        if self.path.startswith("/api/agente/"):   # o agente não exclui quadro nem move para a lixeira
            return self._json({"erro": "o agente não exclui quadros"}, 405)
        if not self._escrita_ok():
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


# ---------------- agentes de IA (servidor MCP em mcp/giz_livre_mcp.py) ----------------
# Canal separado do da página: rotas /api/agente/*, token próprio (X-Agente) guardado em <dados>/.agente/token, que
# só existe com o interruptor ligado. Outra conta do Windows não lê a pasta de dados, então não usa este canal.
# O agente só acrescenta conteúdo: nenhuma rota daqui exclui quadro nem move para a lixeira.
# o nível 4 (controle ao vivo do quadro aberto) volta quando existir; um 4 gravado antes vale como o 3
NIVEIS = {1: "Só ler", 2: "Criar quadros novos", 3: "Editar quadros fechados"}
NIVEL_PADRAO = 2
VALIDADE_ABERTO = 90                 # s: a página manda /api/ping a cada 30 s com o quadro aberto
ABERTOS: dict[str, tuple] = {}       # janela -> (id do quadro aberto ou None, instante do último ping)
JANELA_OK = re.compile(r"^[A-Za-z0-9_-]{1,40}$")
COR_OK = re.compile(r"^#[0-9a-fA-F]{6}$")
TRAVA_AGENTE = threading.Lock()
FONTES = ["Segoe UI", "Arial", "Calibri", "Cambria", "Georgia", "Times New Roman", "Verdana", "Consolas", "Segoe Script",
          "Segoe Print", "Ink Free", "Lucida Handwriting", "Comic Sans MS"]          # as do editor (menu Fonte)
CORES_NOTA = ["#fff7a8", "#ffd3a6", "#ffc8dd", "#d9c9ff", "#c4e3ff", "#c9f2c7"]          # NOTE_COLORS do editor
ALINHAMENTOS = {"esquerda": None, "centro": "center", "direita": "right", "justificado": "justify"}
FORMATOS = {"a4": (794, 1123), "a4l": (1123, 794), "a3l": (1587, 1123), "s169": (1280, 720), "s43": (1024, 768)}
GEOMETRIAS = ("line", "arrow", "rect", "ellipse", "triangle")
MARGEM = 48                          # margem da página para o "fluxo de caderno"
MAX_PAGINAS = 500                    # o mesmo limite da importação de .lousa
# imagem de reserva da forma da biblioteca: o editor desenha pelo `lib` e troca esta reserva ao abrir o quadro
SRC_RESERVA = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E"
_INDICE: dict = {}


class RecusaAgente(Exception):
    """Pedido do agente recusado com uma mensagem para ele (e o status HTTP)."""
    def __init__(self, msg: str, status: int = 400):
        super().__init__(msg)
        self.status = status


def indice() -> dict:
    """app/shapes-index.json (formas, folhas, modelos de função), gerado por scripts/indice_formas.mjs."""
    if not _INDICE:
        with open(APP / "shapes-index.json", encoding="utf-8") as f:
            dados = json.load(f)
        dados["por_id"] = {x["id"]: x for x in dados["formas"]}
        dados["modelo_por_id"] = {m["id"]: m for m in dados["modelos"]}
        dados["folha_ids"] = {x["id"] for x in dados["folhas"]}
        _INDICE.update(dados)
    return _INDICE


def pasta_agente() -> Path:
    return DADOS / ".agente"


def agente_config() -> dict | None:
    """{'nivel', 'token'} com o interruptor ligado; None desligado. Lido do disco a cada pedido: desligar vale na hora."""
    p = pasta_agente()
    try:
        nivel = int((p / "ligado").read_text(encoding="utf-8").strip())
        token = (p / "token").read_text(encoding="utf-8").strip()
    except (OSError, ValueError):
        return None
    nivel = 3 if nivel == 4 else nivel
    if nivel not in NIVEIS or not re.fullmatch(r"[0-9a-f]{64}", token):
        return None
    return {"nivel": nivel, "token": token}


def agente_ligar(nivel: int) -> None:
    with TRAVA_AGENTE:
        p = pasta_agente()
        p.mkdir(exist_ok=True)
        if not agente_config():   # token novo só ao ligar; mudar o nível mantém o token
            gravar_atomico(p / "token", secrets.token_hex(32).encode("ascii"))
        gravar_atomico(p / "ligado", str(nivel).encode("ascii"))
    registrar_agente("interruptor", f"ligado, nível {nivel}")


def agente_desligar() -> None:
    with TRAVA_AGENTE:
        for nome in ("token", "ligado"):   # o token sai primeiro: desligado, ele deixa de valer na hora
            try:
                (pasta_agente() / nome).unlink()
            except FileNotFoundError:
                pass
    registrar_agente("interruptor", "desligado")


def registrar_agente(acao: str, quadro: str = "") -> None:
    """Uma linha por ação em <dados>/.agente/registro.log: data, ação e quadro (nunca o conteúdo)."""
    try:
        p = pasta_agente()
        p.mkdir(exist_ok=True)
        log = p / "registro.log"
        if log.exists() and log.stat().st_size > 1024 * 1024:
            os.replace(log, p / "registro.log.1")
        with TRAVA_AGENTE, open(log, "a", encoding="utf-8") as f:
            f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')}\t{acao}\t{quadro}\n")
    except OSError as e:
        registrar(e)


def ultimas_linhas_registro(n: int = 30) -> list:
    try:
        linhas = (pasta_agente() / "registro.log").read_text(encoding="utf-8").splitlines()
    except OSError:
        return []
    return linhas[-n:][::-1]


def marcar_aberto(janela: str, quadro) -> None:
    agora = time.time()
    with TRAVA_GERAL:
        ABERTOS[janela] = (quadro if isinstance(quadro, str) and ID_OK.match(quadro) else None, agora)
        for k in [k for k, (_, t) in ABERTOS.items() if agora - t > VALIDADE_ABERTO]:
            ABERTOS.pop(k, None)


def quadros_abertos() -> set:
    agora = time.time()
    with TRAVA_GERAL:
        return {q for q, t in ABERTOS.values() if q and agora - t <= VALIDADE_ABERTO}


def texto_limpo(valor, maximo: int, campo: str, linhas: bool = True) -> str:
    """Texto do agente: sem caracteres de controle (salvo quebra de linha, se `linhas`), com limite de tamanho."""
    if not isinstance(valor, str):
        raise RecusaAgente(f"{campo}: esperado um texto")
    if len(valor) > maximo:
        raise RecusaAgente(f"{campo}: no máximo {maximo} caracteres (veio {len(valor)})")
    valor = valor.replace("\r\n", "\n").replace("\t", "    ")
    return "".join(c for c in valor if c.isprintable() or (linhas and c == "\n"))


def num_agente(spec: dict, campo: str, minimo: float, maximo: float, padrao=None):
    v = spec.get(campo)
    if v is None:
        if padrao is None:
            raise RecusaAgente(f"{campo}: obrigatório")
        return padrao
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v):
        raise RecusaAgente(f"{campo}: esperado um número")
    if not minimo <= v <= maximo:
        raise RecusaAgente(f"{campo}: entre {minimo:g} e {maximo:g} (veio {v:g})")
    return float(v)


def cor_agente(spec: dict, campo: str = "cor", padrao: str = "#000000") -> str:
    v = spec.get(campo)
    if v is None:
        return padrao
    if not isinstance(v, str) or not COR_OK.match(v):
        raise RecusaAgente(f"{campo}: use o formato #rrggbb (ex.: #e81224)")
    return v.lower()


def clarear(cor: str) -> str:
    """Preenchimento das formas geométricas: a mesma conta do editor (lighten)."""
    return "#" + "".join(f"{round(int(cor[i:i + 2], 16) * 0.25 + 255 * 0.75):02x}" for i in (1, 3, 5))


def altura_texto(texto: str, tamanho: float, largura: float) -> float:
    """Estimativa sem medir a fonte (o editor mede de verdade ao desenhar): ~0,52 do tamanho por caractere."""
    por_linha = max(1, int(largura / (tamanho * 0.52)))
    linhas = sum(max(1, math.ceil(len(p) / por_linha)) for p in texto.split("\n"))
    return linhas * tamanho * 1.3


def caixa(it: dict) -> tuple:
    """(x, y, w, h) aproximado de um item, para achar o fim do conteúdo da página e deslocar páginas."""
    t = it.get("type")
    if t == "stroke":
        p = it.get("pts") or []
        xs, ys = [numero(v) for v in p[0::3]], [numero(v) for v in p[1::3]]
        if not xs:
            return (0, 0, 0, 0)
        return (min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys))
    if t == "shape":
        if it.get("kind") == "polygon":
            p = it.get("pts") or []
            xs, ys = [numero(v) for v in p[0::2]] or [0], [numero(v) for v in p[1::2]] or [0]
        else:
            xs = [numero(it.get("x1")), numero(it.get("x2"))]
            ys = [numero(it.get("y1")), numero(it.get("y2"))]
        return (min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys))
    x, y, w = numero(it.get("x")), numero(it.get("y")), numero(it.get("w"))
    if t == "text":
        tam = numero(it.get("size")) or 28
        return (x, y, w, altura_texto(str(it.get("text") or ""), tam, max(w, tam)))
    return (x, y, w, numero(it.get("h")))


def deslocar_y(it: dict, dy: float) -> dict:
    """Cópia do item descida `dy` (os itens são imutáveis também aqui)."""
    n = dict(it)
    if it.get("type") == "stroke":
        n["pts"] = [v + dy if i % 3 == 1 else v for i, v in enumerate(it.get("pts") or [])]
    elif it.get("type") == "shape" and it.get("kind") == "polygon":
        n["pts"] = [v + dy if i % 2 == 1 else v for i, v in enumerate(it.get("pts") or [])]
    elif it.get("type") == "shape":
        n["y1"], n["y2"] = numero(it.get("y1")) + dy, numero(it.get("y2")) + dy
    else:
        n["y"] = numero(it.get("y")) + dy
    return n


def tem_paginas(board: dict) -> bool:
    return isinstance(board.get("layout"), dict) and board["layout"].get("mode") == "pages"


def retangulo_pagina(L: dict, i: int) -> tuple:
    return (0.0, i * (numero(L.get("h")) + numero(L.get("gap"))), numero(L.get("w")), numero(L.get("h")))


def pagina_de(L: dict, it: dict) -> int:
    x, y, w, h = caixa(it)
    passo = numero(L.get("h")) + numero(L.get("gap"))
    n = max(1, int(numero(L.get("count")) or 1))
    return max(0, min(n - 1, math.floor((y + h / 2 + numero(L.get("gap")) / 2) / passo))) if passo > 0 else 0


def posicionar(board: dict, spec: dict, w: float, h: float) -> tuple:
    """Onde o item entra: (x, y, aviso). `pagina` (1, 2...) torna x e y relativos à página; sem x/y, o item entra
    abaixo do último item da página (ou do quadro infinito), na margem esquerda."""
    paginas = tem_paginas(board)
    L = board.get("layout") or {}
    n = max(1, int(numero(L.get("count")) or 1)) if paginas else 0
    pg = spec.get("pagina")
    if pg is not None:
        if not paginas:
            raise RecusaAgente("pagina: este quadro é infinito (não tem páginas); use só x e y")
        if isinstance(pg, bool) or not isinstance(pg, int) or not 1 <= pg <= n:
            raise RecusaAgente(f"pagina: página inexistente (o quadro tem {n})")
    tem_x, tem_y = spec.get("x") is not None, spec.get("y") is not None
    x = num_agente(spec, "x", -1e6, 1e6, 0.0)
    y = num_agente(spec, "y", -1e6, 1e6, 0.0)
    itens = [i for i in board.get("items", []) if isinstance(i, dict)]
    if paginas:
        if pg is None and not (tem_x and tem_y):   # fluxo: última página que tem conteúdo
            com = [pagina_de(L, i) for i in itens]
            pg = (max(com) if com else 0) + 1
        if pg is not None:
            rx, ry, rw, rh = retangulo_pagina(L, pg - 1)
            if not (tem_x and tem_y):
                nesta = [caixa(i) for i in itens if pagina_de(L, i) == pg - 1]
                fim = max((c[1] + c[3] for c in nesta), default=ry + MARGEM - 16)
                y = (y if tem_y else fim + 16 - ry)
                x = x if tem_x else MARGEM
            aviso = None
            if y + h > rh - MARGEM and not tem_y and y > MARGEM and h <= rh - 2 * MARGEM:
                # no fluxo de caderno, o item que não cabe vai para o alto da página seguinte (criada se faltar)
                if pg >= n and n >= MAX_PAGINAS:
                    return rx + x, ry + y, f"o item passou do fim da página e o quadro já tem {MAX_PAGINAS} páginas"
                if pg >= n:
                    board["layout"] = {**L, "count": n + 1}
                aviso = f"não cabia na página {pg}; foi para o alto da página {pg + 1}" + \
                        (" (criada agora)" if pg >= n else "")
                rx, ry, rw, rh = retangulo_pagina(L, pg)
                y = MARGEM
            elif ry + y + h > ry + rh:
                aviso = "o item passou do fim da página; use adicionar_pagina e a página seguinte"
            return rx + x, ry + y, aviso
        return x, y, None
    if not (tem_x and tem_y):
        caixas = [caixa(i) for i in itens]
        fim = max((c[1] + c[3] for c in caixas), default=MARGEM - 16)
        x = x if tem_x else min((c[0] for c in caixas), default=MARGEM)
        y = y if tem_y else fim + 16
    return x, y, None


def largura_util(board: dict) -> float:
    L = board.get("layout") or {}
    return max(100.0, numero(L.get("w")) - 2 * MARGEM) if tem_paginas(board) else 800.0


NOTA_LARG = (120.0, 600.0)          # px: faixa de largura da nota do agente
NOTA_PROP = (0.75, 2.0)             # altura / largura: nota larga e baixa deixa a letra minúscula
NOTA_LETRA_MIN = 16                 # px: menor letra aceitável na nota (o editor ajusta a letra ao tamanho da nota)


def letra_nota(texto: str, w: float, h: float) -> int:
    """Estimativa do tamanho de letra que o editor escolhe (noteFontSizeRaw em render.js), sem medir a fonte."""
    pad, tam = w * 0.08, round(w / 7)
    while tam > 8:
        por_linha = max(1, int((w - 2 * pad) / (tam * 0.55)))
        linhas = sum(max(1, math.ceil(len(p) / por_linha)) for p in texto.split("\n"))
        if linhas * tam * 1.25 <= h - 2 * pad:
            break
        tam -= 1
    return tam


def medida_nota(texto: str, w: float, h: float) -> tuple:
    """Largura e altura da nota dentro de uma proporção que dá letra legível; cresce se o texto não couber.
    Devolve (w, h, aviso ou None)."""
    w0, h0 = w, h
    w = min(max(w, NOTA_LARG[0]), NOTA_LARG[1])
    h = min(max(h, w * NOTA_PROP[0]), w * NOTA_PROP[1])
    while letra_nota(texto, w, h) < NOTA_LETRA_MIN and (h < w * NOTA_PROP[1] or w < NOTA_LARG[1]):
        if h < w * NOTA_PROP[1]:
            h = min(h * 1.15, w * NOTA_PROP[1])
        else:
            w = min(w * 1.15, NOTA_LARG[1])
    w, h = round(w), round(h)
    if (w, h) == (round(w0), round(h0)):
        return w, h, None
    return w, h, (f"nota ajustada para {w}x{h} px (largura de {NOTA_LARG[0]:g} a {NOTA_LARG[1]:g}, altura de "
                  f"{NOTA_PROP[0]:g} a {NOTA_PROP[1]:g} vezes a largura) para a letra ficar legível; texto longo cabe "
                  f"melhor em escrever_texto")


def novo_id_item() -> str:
    return "ag" + secrets.token_hex(5)


def item_do_agente(board: dict, spec: dict) -> tuple:
    """Monta e valida um item a partir do pedido do agente. Devolve (item, aviso)."""
    tipo = spec.get("tipo")
    if tipo == "texto":
        texto = texto_limpo(spec.get("texto"), 5000, "texto")
        if not texto.strip():
            raise RecusaAgente("texto: vazio")
        tam = num_agente(spec, "tamanho", 8, 200, 28.0)
        larg = num_agente(spec, "largura", 20, 20000, largura_util(board))
        x, y, aviso = posicionar(board, spec, larg, altura_texto(texto, tam, larg))
        it = {"id": novo_id_item(), "type": "text", "x": x, "y": y, "w": larg, "text": texto,
              "color": cor_agente(spec), "size": tam}
        fonte = spec.get("fonte")
        if fonte is not None:
            if fonte not in FONTES:
                raise RecusaAgente("fonte: escolha uma destas: " + ", ".join(FONTES))
            if fonte != "Segoe UI":
                it["font"] = fonte
        al = spec.get("alinhamento")
        if al is not None:
            if al not in ALINHAMENTOS:
                raise RecusaAgente("alinhamento: esquerda, centro, direita ou justificado")
            if ALINHAMENTOS[al]:
                it["al"] = ALINHAMENTOS[al]
        if spec.get("negrito") is True:
            it["b"] = True
        if spec.get("italico") is True:
            it["i"] = True
        return it, aviso
    if tipo == "nota":
        texto = texto_limpo(spec.get("texto"), 2000, "texto")
        cor = cor_agente(spec, padrao=CORES_NOTA[0])
        if cor not in CORES_NOTA:
            raise RecusaAgente("cor: as notas usam " + ", ".join(CORES_NOTA))
        w = num_agente(spec, "largura", 80, 1200, 220.0)
        h = num_agente(spec, "altura", 80, 1200, w)
        w, h, ajuste = medida_nota(texto, w, h)
        x, y, aviso = posicionar(board, spec, w, h)
        return {"id": novo_id_item(), "type": "note", "x": x, "y": y, "w": w, "h": h, "text": texto,
                "color": cor}, aviso or ajuste
    if tipo == "geometria":
        kind = spec.get("forma")
        if kind not in GEOMETRIAS:
            raise RecusaAgente("tipo: " + ", ".join(GEOMETRIAS))
        linha = kind in ("line", "arrow")
        lim = 20000
        w = num_agente(spec, "w", -lim if linha else 1, lim)
        h = num_agente(spec, "h", -lim if linha else 1, lim)
        if linha and w == 0 and h == 0:
            raise RecusaAgente("w e h: a linha precisa de comprimento")
        if spec.get("x") is None or spec.get("y") is None:
            raise RecusaAgente("x e y: obrigatórios para formas geométricas")
        x, y, aviso = posicionar(board, spec, abs(w), abs(h))
        cor = cor_agente(spec)
        it = {"id": novo_id_item(), "type": "shape", "kind": kind, "x1": x, "y1": y, "x2": x + w, "y2": y + h,
              "color": cor, "width": num_agente(spec, "espessura", 0.5, 40, 3.0)}
        preenche = spec.get("preenchimento")
        if preenche not in (None, False) and not linha:
            it["fill"] = clarear(cor) if preenche is True else cor_agente(spec, "preenchimento")
        if spec.get("tracejado") is True:
            it["dash"] = True
        if kind == "arrow" and spec.get("seta_dupla") is True:
            it["both"] = True
        return it, aviso
    if tipo == "forma":
        forma = indice()["por_id"].get(spec.get("forma"))
        if not forma:
            raise RecusaAgente("forma: id inexistente; procure com listar_formas")
        esc = num_agente(spec, "escala", 0.1, 10, 1.0)
        w, h = forma["w"] * esc, forma["h"] * esc
        x, y, aviso = posicionar(board, spec, w, h)
        return {"id": novo_id_item(), "type": "image", "src": SRC_RESERVA, "x": x, "y": y, "w": w, "h": h,
                "lib": forma["id"], "tint": cor_agente(spec)}, aviso
    if tipo == "latex":
        latex = texto_limpo(spec.get("latex"), 2000, "latex")
        if not latex.strip():
            raise RecusaAgente("latex: vazio")
        tam = num_agente(spec, "tamanho", 8, 200, 40.0)
        # estimativa (o editor mede a imagem real ao abrir e desce o que vem depois): fração e somatório são mais altos
        alto = any(c in latex for c in (r"\frac", r"\dfrac", r"\sum", r"\int", r"\begin", r"\sqrt"))
        w, h = min(len(latex) * tam * 0.45 + 20, 1200), tam * (2.8 if alto else 1.6)
        x, y, aviso = posicionar(board, spec, w, h)
        return {"id": novo_id_item(), "type": "pendente", "gera": "latex", "latex": latex, "x": x, "y": y,
                "w": w, "h": h, "size": tam, "color": cor_agente(spec)}, aviso
    if tipo == "grafico":
        return grafico_do_agente(board, spec)
    raise RecusaAgente("tipo de item desconhecido")


def grafico_do_agente(board: dict, spec: dict) -> tuple:
    """Gráfico pendente: o editor compila a função com o mesmo compilador seguro da janela Plotar ao abrir o quadro."""
    funcao, modelo = spec.get("funcao"), spec.get("modelo")
    if (funcao is None) == (modelo is None):
        raise RecusaAgente("informe funcao (ex.: x^2 - 4) ou modelo (veja listar_modelos), não os dois")
    it = {"id": novo_id_item(), "type": "pendente", "gera": "plot"}
    faixa_padrao = (-5.0, 5.0)
    if funcao is not None:
        funcao = texto_limpo(funcao, 200, "funcao", linhas=False).strip()
        if not funcao or not re.fullmatch(r"[0-9A-Za-zÀ-ÿπ .,+\-*/^()]+", funcao):
            raise RecusaAgente("funcao: use x, números, + - * / ^, parênteses e sen, cos, tg, raiz, abs, ln, log, exp, pi, e")
        it["funcao"] = funcao
    else:
        m = indice()["modelo_por_id"].get(modelo)
        if not m:
            raise RecusaAgente("modelo: id inexistente; veja listar_modelos")
        it["modelo"] = m["id"]
        faixa_padrao = (float(m["x"][0]), float(m["x"][1]))
        params = spec.get("parametros") or {}
        if not isinstance(params, dict):
            raise RecusaAgente("parametros: esperado um objeto {nome: valor}")
        decl = {p["n"]: p for p in m["params"]}
        valores = {}
        for nome, v in params.items():
            if nome not in decl:
                raise RecusaAgente(f"parametros: {nome} não existe no modelo (tem: {', '.join(decl)})")
            p = decl[nome]
            valores[nome] = num_agente(params, nome, min(p["min"], p["v"]), max(p["max"], p["v"]))
        if valores:
            it["parametros"] = valores
    x0 = num_agente(spec, "x_min", -1e9, 1e9, faixa_padrao[0])
    x1 = num_agente(spec, "x_max", -1e9, 1e9, faixa_padrao[1])
    if not x1 > x0:
        raise RecusaAgente("x_max precisa ser maior que x_min")
    it["faixa"] = [x0, x1]
    if spec.get("y_min") is not None or spec.get("y_max") is not None:
        y0, y1 = num_agente(spec, "y_min", -1e9, 1e9), num_agente(spec, "y_max", -1e9, 1e9)
        if not y1 > y0:
            raise RecusaAgente("y_max precisa ser maior que y_min")
        it["faixa_y"] = [y0, y1]
    w = num_agente(spec, "w", 80, 5000, min(largura_util(board), 640.0))
    h = num_agente(spec, "h", 60, 5000, round(w * 0.62))
    x, y, aviso = posicionar(board, spec, w, h)
    it.update({"x": x, "y": y, "w": w, "h": h, "color": cor_agente(spec, padrao="#0078d4"),
               "eixos": spec.get("eixos") is not False, "rotulo": spec.get("rotulo") is not False and funcao is not None})
    return it, aviso


def resumo_item(it: dict, L: dict | None) -> dict:
    """Item sem os campos pesados (pontos do traço, imagem embutida): o agente recebe o que importa."""
    r = {k: v for k, v in it.items() if k not in ("pts", "src", "ink")}
    if isinstance(it.get("pts"), list):
        r["n_pontos"] = len(it["pts"]) // (3 if it.get("type") == "stroke" else 2)
    src = it.get("src")
    if isinstance(src, str):
        r["imagem"] = "reserva" if src == SRC_RESERVA else "arquivo" if src.startswith("/assets/") else "embutida"
    if L:
        r["pagina"] = pagina_de(L, it) + 1
    return r


def quadro_para_agente(bid: str, board: dict, detalhe: str) -> dict:
    L = board.get("layout") if tem_paginas(board) else None
    itens = [i for i in board.get("items", []) if isinstance(i, dict)]
    r = {"quadro": bid, "titulo": board.get("title") or "Sem título", "pasta": nome_pasta(board.get("folder")),
         "formato": (L or {}).get("kind", "infinito") if L else "infinito",
         "paginas": int(numero(L.get("count"))) if L else None,
         "largura_pagina": numero(L.get("w")) if L else None, "altura_pagina": numero(L.get("h")) if L else None,
         "fundo": {"cor": (board.get("background") or {}).get("color", "#ffffff"),
                   "padrao": (board.get("background") or {}).get("pattern", "none")},
         "revisao": board.get("_rev", 0), "criado_por": board.get("criado_por"),
         "aberto": bid in quadros_abertos(), "n_itens": len(itens)}
    if detalhe == "completo":
        r["itens"] = itens
    else:
        r["itens"] = [resumo_item(i, L) for i in itens[:2000]]
        if len(itens) > 2000:
            r["itens_cortados"] = True
    return r


def ler_quadro_disco(bid: str) -> dict:
    arq = DADOS / f"{bid}.json"
    if not arq.exists():
        raise RecusaAgente("quadro não encontrado", 404)
    try:
        board = json.loads(arq.read_text(encoding="utf-8"))
        if not isinstance(board, dict) or not isinstance(board.get("items", []), list):
            raise ValueError
    except ValueError:
        raise RecusaAgente("o arquivo deste quadro está danificado; abra-o no Giz Livre", 500)
    board.setdefault("items", [])
    return board


def alterar_quadro(bid: str, cfg: dict, mudar) -> dict:
    """Lê, confere permissão e quadro aberto, aplica `mudar(board)` e grava com a mesma revisão do PUT da página."""
    if bid in quadros_abertos():
        raise RecusaAgente("Este quadro está aberto no Giz Livre. Feche-o (volte à galeria) ou use o controle ao "
                           "vivo, quando existir. Criar quadros novos e ler continuam liberados.", 409)
    with trava(bid):
        board = ler_quadro_disco(bid)
        if cfg["nivel"] < 3 and board.get("criado_por") != "agente":
            raise RecusaAgente("No nível 2 (Criar quadros novos) o agente só mexe nos quadros que ele criou. Para "
                               "editar outros quadros fechados, o professor escolhe o nível 3 no Giz Livre.", 403)
        resultado = mudar(board)
        board["updated"] = int(time.time() * 1000)
        board["_rev"] = board.get("_rev", 0) + 1
        gravar_atomico(DADOS / f"{bid}.json", json.dumps(board, ensure_ascii=False, allow_nan=False).encode("utf-8"))
    resultado["revisao"] = board["_rev"]
    return resultado


def criar_quadro_agente(spec: dict) -> dict:
    titulo = re.sub(r"\s+", " ", texto_limpo(spec.get("titulo"), 200, "titulo", linhas=False)).strip()
    if not titulo:
        raise RecusaAgente("titulo: obrigatório")
    formato = spec.get("formato")
    if formato is None:
        formato = "a4" if spec.get("paginas") is not None else "infinito"
    board = {"version": 2, "title": titulo, "criado_por": "agente", "items": []}
    if formato != "infinito":
        if formato not in FORMATOS:
            raise RecusaAgente("formato: infinito, " + ", ".join(FORMATOS))
        w, h = FORMATOS[formato]
        n = int(num_agente(spec, "paginas", 1, 200, 1))
        board["layout"] = {"mode": "pages", "kind": formato, "w": w, "h": h, "gap": 48, "count": n}
    elif spec.get("paginas") is not None:
        raise RecusaAgente("paginas: só em quadro com páginas (formato a4, a4l, a3l, s169 ou s43)")
    fundo = spec.get("fundo") or {}
    if not isinstance(fundo, dict):
        raise RecusaAgente("fundo: esperado {cor, padrao}")
    padrao = fundo.get("padrao", "none")
    if padrao not in indice()["folha_ids"]:
        raise RecusaAgente("fundo.padrao: folha inexistente; algumas: none, grid, lines, notebook, cartesian, dots")
    board["background"] = {"color": cor_agente(fundo, padrao="#ffffff"), "pattern": padrao}
    pasta = nome_pasta(spec.get("pasta"))
    if pasta:
        board["folder"] = pasta
    board["updated"] = int(time.time() * 1000)
    board["_rev"] = 1
    with TRAVA_GERAL:
        while True:
            bid = "ag" + format(int(time.time() * 1000), "x") + secrets.token_hex(3)
            if not (DADOS / f"{bid}.json").exists():
                break
    with trava(bid):
        gravar_atomico(DADOS / f"{bid}.json", json.dumps(board, ensure_ascii=False, allow_nan=False).encode("utf-8"))
    return {"quadro": bid, "titulo": titulo, "paginas": board.get("layout", {}).get("count"), "revisao": 1,
            "itens_criados": []}


def adicionar_paginas(board: dict, spec: dict) -> dict:
    if not tem_paginas(board):
        raise RecusaAgente("adicionar_pagina: só em quadro com páginas")
    L = dict(board["layout"])
    n = max(1, int(numero(L.get("count")) or 1))
    q = int(num_agente(spec, "quantidade", 1, 50, 1))
    if n + q > MAX_PAGINAS:
        raise RecusaAgente(f"quantidade: o quadro pode ter no máximo {MAX_PAGINAS} páginas")
    depois = int(num_agente(spec, "depois_de", 0, n, n))   # 0 = antes da primeira
    passo = numero(L.get("h")) + numero(L.get("gap"))
    corte = depois * passo - numero(L.get("gap")) / 2   # mesma conta do editor (insertPageAfter)
    itens = []
    for it in board["items"]:
        if isinstance(it, dict):
            x, y, w, h = caixa(it)
            it = deslocar_y(it, passo * q) if y + h / 2 > corte else it
        itens.append(it)
    L["count"] = n + q
    board["items"], board["layout"] = itens, L
    return {"quadro": None, "paginas": n + q, "paginas_novas": list(range(depois + 1, depois + q + 1)), "itens_criados": []}


def buscar_formas(busca: str, grupo: str, limite: int) -> list:
    def sem(s):   # sem acento e sem caixa ("agua" acha "Água"), como a busca do catálogo
        return "".join(c for c in unicodedata.normalize("NFD", str(s).lower()) if unicodedata.category(c) != "Mn")

    termos = sem(busca).split()
    achadas = []
    for f in indice()["formas"]:
        if grupo and grupo not in (f["grupo"], f["grupo_nome"]):
            continue
        alvo = sem(f"{f['id']} {f['nome']} {f['secao']} {f['grupo_nome']}")
        if all(t in alvo for t in termos):
            achadas.append({k: f[k] for k in ("id", "nome", "grupo", "secao", "w", "h")})
            if len(achadas) >= limite:
                break
    return achadas


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
    if arq.exists():
        try:
            os.utime(arq)
        except OSError:
            pass
    else:
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

            def ler(nome: str) -> bytes:
                if z.getinfo(nome).file_size > 2 * 1024 * 1024:
                    raise ValueError("O arquivo da apresentação está corrompido.")
                return z.read(nome)

            # apresentação aberta (LibreOffice/OpenOffice): o PowerPoint e o LibreOffice abrem
            if "mimetype" in nomes and b"opendocument.presentation" in ler("mimetype"):
                if any(n.startswith(("basic/", "scripts/")) for n in nomes):
                    raise ValueError("Apresentações com macros não são aceitas. Salve sem macros e importe de novo.")
                return ".odp"
            # Keynote (Mac): só o LibreOffice converte
            if any(n.startswith("index/") and n.endswith(".iwa") for n in nomes) or "index.zip" in nomes:
                return ".key"
            tipos = ler("[Content_Types].xml").decode("utf-8", "replace").lower()
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
