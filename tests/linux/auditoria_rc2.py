# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Validação no Linux da 1.16.0-rc.2: os cenários da auditoria externa de 30/10/2026 que dão para rodar fora do Windows,
# repetidos de fora para dentro, contra um server.py de verdade (pedidos HTTP, como a página faz), numa pasta
# temporária e só com dados fictícios. Não substitui os testes de tests/test_server.py: confere o mesmo pelo lado de
# quem usa.
#   python3 tests/linux/auditoria_rc2.py
# Cenários: A) backup com imagem corrompida; B) trazido_de inválido; C) PDF com dimensão NaN ou infinita; D) ZIP com
# nomes duplicados; E) corpo HTTP menor que o Content-Length; F) código (token) não ASCII; G) restaurações simultâneas.
import base64, hashlib, http.client, io, json, os, signal, socket, struct, subprocess, sys, tempfile, threading, time
import urllib.request, warnings, zipfile, zlib
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
ok = falhas = 0


def conferir(nome, cond, detalhe=""):
    global ok, falhas
    print(f"  {'✓' if cond else '✗'} {nome}{'' if cond or not detalhe else ': ' + str(detalhe)}")
    if cond:
        ok += 1
    else:
        falhas += 1
    return cond


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class Servidor:
    def __init__(self, dados: Path):
        self.dados, self.porta = dados, porta_livre()
        self.base = f"http://127.0.0.1:{self.porta}"
        self.proc = subprocess.Popen([sys.executable, str(RAIZ / "server.py"), "--sem-janela", "--sem-auto-encerrar",
                                      "--porta", str(self.porta), "--dados", str(dados)],
                                     env=dict(os.environ, GIZ_SEM_DIARIO="1"),
                                     stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        self.token = None
        for _ in range(150):   # o código vem do arquivo de conexão, como o Giz na Tela e o MCP leem
            try:
                c = json.loads((dados / ".agente" / "conexao.json").read_text(encoding="utf-8"))
                if c.get("pid") == self.proc.pid:
                    self.token = c["token"]
                    break
            except (OSError, ValueError):
                pass
            time.sleep(0.1)
        if not self.token:
            raise RuntimeError("o servidor não abriu")

    def pedir(self, rota, metodo="GET", corpo=None, cab=None, cru=False):
        h = {"X-Lousa": self.token}
        if corpo is not None and not isinstance(corpo, bytes):
            corpo = json.dumps(corpo).encode("utf-8")
            h["Content-Type"] = "application/json"
        h.update(cab or {})
        req = urllib.request.Request(self.base + rota, data=corpo, method=metodo, headers=h)
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                dados = r.read()
                return r.status, (dados if cru else json.loads(dados or b"null"))
        except urllib.error.HTTPError as e:
            dados = e.read()
            try:
                return e.code, json.loads(dados)
            except ValueError:
                return e.code, dados

    def vivo(self):
        return self.proc.poll() is None and self.pedir("/api/ping")[0] == 200

    def fechar(self):
        self.proc.kill()
        self.proc.wait()
        erro = self.proc.stderr.read().decode("utf-8", "replace")
        self.proc.stderr.close()
        return erro


def png(cor=(200, 30, 30)):
    """PNG 4x4 de verdade, feito com a biblioteca padrão."""
    def bloco(tipo, dados):
        return struct.pack(">I", len(dados)) + tipo + dados + struct.pack(">I", zlib.crc32(tipo + dados) & 0xFFFFFFFF)
    linhas = b"".join(b"\x00" + bytes(cor) * 4 for _ in range(4))
    return (b"\x89PNG\r\n\x1a\n" + bloco(b"IHDR", struct.pack(">IIBBBBB", 4, 4, 8, 2, 0, 0, 0))
            + bloco(b"IDAT", zlib.compress(linhas)) + bloco(b"IEND", b""))


def quadro(titulo, itens=None, **extra):
    return {"version": 2, "title": titulo, "background": {"color": "#ffffff", "pattern": "none"},
            "items": itens if itens is not None else
            [{"id": "t1", "type": "text", "x": 10, "y": 20, "w": 300, "text": titulo, "color": "#000000", "size": 28}],
            **extra}


def zip_de(arquivos):
    """arquivos: lista de (nome, bytes); nomes repetidos ficam repetidos."""
    buf = io.BytesIO()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")   # o zipfile avisa de nome duplicado, que aqui é de propósito
        with zipfile.ZipFile(buf, "w") as z:
            for nome, dados in arquivos:
                z.writestr(nome, dados)
    return buf.getvalue()


MANIFESTO = json.dumps({"formato": 1, "programa": "Giz Livre", "versao": "1.16.0", "quadros": []}).encode()


def sem_tmp(pasta: Path):
    return [p.name for p in pasta.rglob("*.tmp")]


tmp = Path(tempfile.mkdtemp(prefix="giz-auditoria-"))
srv = Servidor(tmp / "quadros")
D = srv.dados
print(f"Giz Livre: {srv.pedir('/api/info')[1].get('versao')}, Python {sys.version.split()[0]}, pasta {tmp}")

# ---------------- A. backup com imagem corrompida ----------------
print("\nA. Importar backup com imagem corrompida")
outro = Servidor(tmp / "outro-pc")
s, r = outro.pedir("/api/assets", "POST", png(), {"Content-Type": "application/octet-stream"})
src = r.get("url") if s == 200 else None
nome_img = src.rsplit("/", 1)[1] if src else ""
outro.pedir("/api/boards/comimagem", "PUT", {"revision": 0, "board": quadro("Fictício: célula com imagem", [
    {"id": "t1", "type": "text", "x": 10, "y": 20, "w": 300, "text": "Célula (fictício)", "color": "#000000", "size": 28},
    {"id": "i1", "type": "image", "x": 10, "y": 80, "w": 64, "h": 64, "src": src}])})
s, zip_bom = outro.pedir("/api/pacote", cru=True)
outro.fechar()
conferir("pacote com 1 quadro e 1 imagem montado pelo próprio programa", s == 200 and zip_bom[:2] == b"PK", s)
with zipfile.ZipFile(io.BytesIO(zip_bom)) as z:
    original = [(i.filename, z.read(i)) for i in z.infolist()]
# A1: os bytes da imagem trocados (não confere com o nome, que é o SHA-1 do conteúdo)
estragado = [(n, b"\x89PNG\r\n\x1a\nLIXO-NAO-E-IMAGEM" if n == "assets/" + nome_img else d) for n, d in original]
s, r = srv.pedir("/api/pacote", "POST", zip_de(estragado), {"Content-Type": "application/zip"})
motivos = [f.get("motivo", "") for f in (r.get("falhas", []) if isinstance(r, dict) else [])]
conferir("A1 imagem corrompida: o pedido responde 200 com o resumo", s == 200, f"{s} {r}")
conferir("A1 a imagem é apontada como danificada", any("imagem danificada" in m for m in motivos), motivos)
conferir("A1 o aviso diz qual quadro ficou sem imagem", any(f.get("titulo", "").startswith("Fictício: célula")
                                                           and "falta" in f.get("motivo", "") for f in r.get("falhas", [])), r)
conferir("A1 o quadro veio mesmo assim", (D / "comimagem.json").is_file())
conferir("A1 a imagem estragada não foi gravada", not (D / "assets" / nome_img).exists())
# A2: conteúdo que confere com o nome, mas não é PNG nem JPEG
lixo = b"isto nao e uma imagem, so texto ficticio"
nome_lixo = hashlib.sha1(lixo).hexdigest() + ".png"
q = quadro("Fictício: imagem que não é imagem", [{"id": "i1", "type": "image", "x": 0, "y": 0, "w": 9, "h": 9,
                                                  "src": "/assets/" + nome_lixo}])
s, r = srv.pedir("/api/pacote", "POST", zip_de([("manifesto.json", MANIFESTO), ("assets/" + nome_lixo, lixo),
                                                ("quadros/naoimagem.json", json.dumps(q).encode())]))
conferir("A2 arquivo que não é imagem: recusado como danificado, o quadro vem",
         s == 200 and any("imagem danificada" in f.get("motivo", "") for f in r.get("falhas", []))
         and (D / "naoimagem.json").is_file() and not (D / "assets" / nome_lixo).exists(), f"{s} {r}")
# A3: o pacote bom, depois do estragado, repara a imagem que faltava
s, r = srv.pedir("/api/pacote", "POST", zip_de(original))
conferir("A3 trazer o pacote bom depois traz a imagem que faltava",
         s == 200 and (D / "assets" / nome_img).is_file()
         and hashlib.sha1((D / "assets" / nome_img).read_bytes()).hexdigest() == nome_img[:40], f"{s} {r}")
conferir("A servidor no ar e sem temporários", srv.vivo() and not sem_tmp(D), sem_tmp(D))

# ---------------- B. trazido_de inválido ----------------
print("\nB. trazido_de inválido")
invalidos = {"texto": "outro-pc", "numero": 123, "lista": [1, 2], "nulo": None, "idnum": {"id": 5, "impressao": "x"},
             "semimpressao": {"id": "abc"}, "aninhado": {"id": {"x": 1}, "impressao": ["y"]}}
arquivos = [("manifesto.json", MANIFESTO)]
for k, v in invalidos.items():
    arquivos.append((f"quadros/trz{k}.json", json.dumps(quadro(f"Fictício: trazido_de {k}", trazido_de=v)).encode()))
s, r = srv.pedir("/api/pacote", "POST", zip_de(arquivos))
conferir("B1 pacote com trazido_de inválido: responde 200", s == 200, f"{s} {r}")
vieram = [k for k in invalidos if (D / f"trz{k}.json").is_file()]
conferir(f"B1 os {len(invalidos)} quadros vieram", len(vieram) == len(invalidos), vieram)
sobrou = [k for k in vieram if "trazido_de" in json.loads((D / f"trz{k}.json").read_text(encoding="utf-8"))]
conferir("B1 o trazido_de inválido saiu dos quadros gravados", not sobrou, sobrou)
# B2: quadro já na pasta (de versão antiga) com trazido_de inválido não atrapalha trazer outro pacote
(D / "antigoruim.json").write_text(json.dumps(quadro("Fictício: antigo", trazido_de="lixo")), encoding="utf-8")
(D / "antigoruim2.json").write_text(json.dumps(quadro("Fictício: antigo 2", trazido_de={"id": [], "impressao": {}})),
                                    encoding="utf-8")
s, r = srv.pedir("/api/pacote", "POST", zip_de([("manifesto.json", MANIFESTO), (
    "quadros/novoapos.json", json.dumps(quadro("Fictício: novo")).encode())]))
conferir("B2 com quadros antigos de trazido_de inválido na pasta, trazer outro pacote funciona",
         s == 200 and r.get("trazidos") == 1, f"{s} {r}")
s, lista = srv.pedir("/api/boards")
conferir("B2 a galeria lista os quadros antigos", s == 200 and {"antigoruim", "antigoruim2"} <= {q["id"] for q in lista})
# B3: trazer o mesmo pacote de novo não duplica (o trazido_de válido continua servindo para isso)
s, r = srv.pedir("/api/pacote", "POST", zip_de(arquivos))
conferir("B3 trazer de novo o mesmo pacote não cria cópias", s == 200 and r.get("copias") == 0, r)
conferir("B servidor no ar", srv.vivo())

# ---------------- C. PDF com dimensão NaN ou infinita ----------------
print("\nC. PDF com dimensão NaN ou infinita")
JPG = "data:image/jpeg;base64," + base64.b64encode(b"\xff\xd8\xff\xe0ficticio\xff\xd9").decode()


def pdf(w="595", h="842", pw="100", ph="141", jpeg=json.dumps(JPG)):
    corpo = f'{{"pages": [{{"w": {w}, "h": {h}, "pw": {pw}, "ph": {ph}, "jpeg": {jpeg}}}]}}'.encode()
    return srv.pedir("/api/pdf", "POST", corpo, {"Content-Type": "application/json"}, cru=True)


s, r = pdf()
conferir("C0 página válida: devolve um PDF", s == 200 and r[:5] == b"%PDF-", s)
casos = {"w NaN": dict(w="NaN"), "h Infinity": dict(h="Infinity"), "w -Infinity": dict(w="-Infinity"),
         "h 1e999 (vira infinito)": dict(h="1e999"), "pw NaN": dict(pw="NaN"), "ph Infinity": dict(ph="Infinity"),
         "w como texto \"NaN\"": dict(w='"NaN"'), "h como texto \"inf\"": dict(h='"inf"'), "w zero": dict(w="0"),
         "h negativo": dict(h="-5"), "w true": dict(w="true"), "pw fracionário": dict(pw="10.5"),
         "w acima de 100000": dict(w="100001"), "w nulo": dict(w="null"), "jpeg sem vírgula": dict(jpeg='"abc"'),
         "jpeg número": dict(jpeg="5")}
ruins = []
for nome, k in casos.items():
    s, r = pdf(**k)
    if s != 400:
        ruins.append(f"{nome}: {s}")
conferir(f"C1 os {len(casos)} casos inválidos são recusados com 400", not ruins, ruins)
conferir("C servidor no ar", srv.vivo())

# ---------------- D. ZIP com nomes duplicados ----------------
print("\nD. ZIP com nomes duplicados")
antes = sorted(p.name for p in D.glob("*.json"))
for nome, arqs in {
    "quadro duplicado": [("manifesto.json", MANIFESTO), ("quadros/dup1.json", json.dumps(quadro("Fictício: A")).encode()),
                         ("quadros/dup1.json", json.dumps(quadro("Fictício: B")).encode())],
    "manifesto duplicado": [("manifesto.json", MANIFESTO), ("manifesto.json", MANIFESTO),
                            ("quadros/dup2.json", json.dumps(quadro("Fictício: C")).encode())],
    "imagem duplicada": [("manifesto.json", MANIFESTO), ("assets/" + nome_img, png()), ("assets/" + nome_img, b"x"),
                         ("quadros/dup3.json", json.dumps(quadro("Fictício: D")).encode())],
}.items():
    s, r = srv.pedir("/api/pacote", "POST", zip_de(arqs))
    conferir(f"D {nome}: recusado com 400 e mensagem clara", s == 400 and "duplicad" in str(r.get("erro", "")), f"{s} {r}")
conferir("D nada foi gravado", sorted(p.name for p in D.glob("*.json")) == antes)
conferir("D servidor no ar", srv.vivo())

# ---------------- E. corpo HTTP menor que o Content-Length ----------------
print("\nE. Corpo HTTP menor que o Content-Length")


def envio_curto(metodo, rota, corpo, a_mais=8, fechar_escrita=True, espera=5):
    """Manda o cabeçalho com Content-Length maior que o corpo. Devolve (status ou None, segundos)."""
    s = socket.create_connection(("127.0.0.1", srv.porta), timeout=espera)
    cab = (f"{metodo} {rota} HTTP/1.1\r\nHost: 127.0.0.1:{srv.porta}\r\nX-Lousa: {srv.token}\r\n"
           f"Content-Type: application/json\r\nContent-Length: {len(corpo) + a_mais}\r\n\r\n").encode()
    t0 = time.time()
    s.sendall(cab + corpo)
    if fechar_escrita:
        s.shutdown(socket.SHUT_WR)
    try:
        resp = s.recv(4096).decode("latin-1")
        st = int(resp.split()[1]) if resp.startswith("HTTP/") else None
    except (socket.timeout, IndexError, ValueError):
        st = None
    s.close()
    return st, time.time() - t0


put = json.dumps({"board": quadro("Fictício: interrompido"), "revision": 0}).encode()
st, _ = envio_curto("PUT", "/api/boards/curto1", put)
conferir("E1 PUT de quadro com JSON completo mas corpo curto: 400 e nada gravado",
         st == 400 and not (D / "curto1.json").exists(), st)
st, _ = envio_curto("POST", "/api/pacote", zip_de([("manifesto.json", MANIFESTO),
                                                  ("quadros/curto2.json", json.dumps(quadro("Fictício")).encode())]), 100)
conferir("E2 pacote (backup) com corpo curto: 400 e nada gravado", st == 400 and not (D / "curto2.json").exists(), st)
st, _ = envio_curto("POST", "/api/assets", png(), 50)
conferir("E3 imagem com corpo curto: 400", st == 400, st)
st, _ = envio_curto("POST", "/api/pdf", b'{"pages": []}', 20)
conferir("E4 PDF com corpo curto: 400", st == 400, st)
# E5: o cliente manda menos e NÃO fecha a conexão (trava ou cai no meio): o servidor espera o resto
st, dt = envio_curto("PUT", "/api/boards/curto3", put, fechar_escrita=False, espera=3)
conferir("E5 cliente que para de mandar sem fechar: o resto do servidor continua respondendo", srv.vivo())
print(f"    (E5: resposta ao cliente parado em {dt:.1f} s: {st if st else 'nenhuma; a conexão fica esperando'})")
conferir("E nada gravado e sem temporários", not (D / "curto3.json").exists() and not sem_tmp(D), sem_tmp(D))

# ---------------- F. código (token) não ASCII ----------------
print("\nF. Código (token) não ASCII")


def cru(metodo, rota, cabecalhos: bytes, corpo=b""):
    s = socket.create_connection(("127.0.0.1", srv.porta), timeout=5)
    s.sendall(f"{metodo} {rota} HTTP/1.1\r\nHost: 127.0.0.1:{srv.porta}\r\n".encode() + cabecalhos
              + f"Content-Length: {len(corpo)}\r\nConnection: close\r\n\r\n".encode() + corpo)
    resp = b""
    try:
        while True:
            pedaco = s.recv(4096)
            if not pedaco:
                break
            resp += pedaco
    except socket.timeout:
        pass
    s.close()
    txt = resp.decode("latin-1")
    return int(txt.split()[1]) if txt.startswith("HTTP/") else None


corpo_put = json.dumps({"board": quadro("Fictício: negado"), "revision": 0}).encode()
tokens = {"é (latin-1)": "é".encode("latin-1"), "é (UTF-8)": "é".encode("utf-8"), "ÿ": b"\xff",
          "código certo + é": srv.token.encode() + "é".encode("utf-8"), "emoji": "😀".encode("utf-8")}
res = {}
for nome, t in tokens.items():
    res[nome] = (cru("PUT", "/api/boards/negado", b"X-Lousa: " + t + b"\r\nContent-Type: application/json\r\n", corpo_put),
                 cru("GET", "/api/boards", b"X-Lousa: " + t + b"\r\n"),
                 cru("GET", "/api/info", b"X-Lousa: " + t + b"\r\n"),
                 cru("GET", "/api/boards", b"Cookie: giz" + str(srv.porta).encode() + b"=" + t + b"\r\n"),
                 cru("GET", "/api/agente/quadros", b"X-Agente: " + t + b"\r\n"))
print("    (status por código: PUT quadro, GET quadros, GET info, GET quadros com cookie, GET agente)")
for nome, r in res.items():
    print(f"    {nome}: {r}")
todas = [x for r in res.values() for x in r]
conferir("F nenhuma resposta 500 nem conexão cortada sem resposta", all(x is not None and x < 500 for x in todas), res)
conferir("F escrita com código não ASCII recusada (409)", all(r[0] == 409 for r in res.values()), [r[0] for r in res.values()])
conferir("F leitura com código não ASCII recusada (401)", all(r[1] == 401 and r[3] == 401 for r in res.values()))
conferir("F /api/info com código não ASCII só diz a versão (200 sem código)", all(r[2] == 200 for r in res.values()))
conferir("F nada gravado e servidor no ar", not (D / "negado.json").exists() and srv.vivo())

# ---------------- G. restaurações simultâneas ----------------
print("\nG. Restaurações simultâneas")


def para_lixeira(bid, titulo):
    srv.pedir(f"/api/boards/{bid}", "PUT", {"revision": 0, "board": quadro(titulo)})
    s, r = srv.pedir(f"/api/boards/{bid}", "DELETE")
    return r.get("lixeira")


def em_paralelo(pedidos):
    resultados = [None] * len(pedidos)
    barreira = threading.Barrier(len(pedidos))

    def um(i, nome):
        barreira.wait()
        resultados[i] = srv.pedir("/api/lixeira/restaurar", "POST", {"nome": nome})
    th = [threading.Thread(target=um, args=(i, n)) for i, n in enumerate(pedidos)]
    for t in th:
        t.start()
    for t in th:
        t.join(30)
    return resultados


# G1: a mesma entrada da lixeira restaurada por 12 pedidos ao mesmo tempo (vários cliques, duas janelas)
nome = para_lixeira("rest1", "Fictício: restaurar uma vez")
r = em_paralelo([nome] * 12)
oks = [x for x in r if x and x[0] == 200]
conferir("G1 12 pedidos simultâneos da mesma entrada: todos respondem", all(x is not None for x in r), r)
print(f"    (G1 status: {sorted(x[0] for x in r if x)})")
conferir("G1 exatamente 1 restaura; os outros recebem erro recuperável (404 ou 409)",
         len(oks) == 1 and all(x[0] in (404, 409) for x in r if x[0] != 200), [x[0] for x in r])
copias = [p for p in D.glob("rest1*.json")]
conferir("G1 o quadro volta uma vez só, sem cópia", len(copias) == 1, [p.name for p in copias])
# G2 (além do cenário da auditoria): várias entradas da lixeira do MESMO quadro (excluído, refeito, excluído...)
# restauradas ao mesmo tempo, em 20 rodadas (a corrida não acontece sempre). Nada se perde: quem recebe 409 fica na
# lixeira. Mas a página trata 409 como "sessão perdida" (wfetch em app/js/api.js) e mostra a faixa de recarregar
RODADAS_G2 = 20
rodadas_com_409, perdidas, status_g2 = 0, [], []
for rodada in range(RODADAS_G2):
    bid = f"rest2r{rodada}"
    nomes = [para_lixeira(bid, f"Fictício: versão {i}") for i in range(6)]
    r = em_paralelo(nomes)
    st = [x and x[0] for x in r]
    status_g2.append(st)
    rodadas_com_409 += any(x != 200 for x in st)
    # nenhuma versão some: ou voltou para a galeria, ou continua na lixeira
    voltaram = sorted(json.loads((D / f"{x[1]['id']}.json").read_text(encoding="utf-8"))["title"]
                      for x in r if x and x[0] == 200)
    ficaram = sorted(json.loads((D / "lixeira" / f"{n}.json").read_text(encoding="utf-8"))["title"]
                     for n in nomes if (D / "lixeira" / f"{n}.json").is_file())
    if sorted(voltaram + ficaram) != sorted(f"Fictício: versão {i}" for i in range(6)):
        perdidas.append((bid, voltaram, ficaram))
recusas = sorted({str(x) for st in status_g2 for x in st if x != 200})
print(f"    (G2: {rodadas_com_409} de {RODADAS_G2} rodadas com alguma recusa; status recusados: {recusas or 'nenhum'})")
conferir("G2 nenhuma versão se perdeu (voltou para a galeria ou ficou na lixeira)", not perdidas, perdidas[:2])
conferir("G2 restaurar versões diferentes do mesmo quadro ao mesmo tempo: todas voltam (sem 409)",
         rodadas_com_409 == 0, f"{rodadas_com_409} de {RODADAS_G2} rodadas com 409 \"conflito; tente de novo\"")
conferir("G servidor no ar e sem temporários", srv.vivo() and not sem_tmp(D), sem_tmp(D))

erro = srv.fechar()
# o socketserver imprime um Traceback por pedido que deu exceção, entre linhas de traços. O do E5 é esperado: o cliente
# parado desiste e fecha, e a resposta 400 do servidor bate num cano quebrado
blocos = [b for b in erro.split("-" * 40) if "Traceback" in b]
esperados = [b for b in blocos if b.rstrip().splitlines()[-1].startswith(("BrokenPipeError", "ConnectionResetError"))]
print(f"    (Tracebacks na saída de erro: {len(blocos)}, dos quais {len(esperados)} de conexão fechada pelo cliente do E5)")
outros = [b for b in blocos if b not in esperados]
conferir("nenhum outro Traceback na saída de erro do servidor", not outros, "".join(outros)[-800:])
print(f"\n{ok} conferências passaram, {falhas} falharam (pasta: {tmp})")
sys.exit(1 if falhas else 0)
