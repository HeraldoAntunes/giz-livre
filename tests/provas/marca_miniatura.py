# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Tentativas de quebrar a regra da 1.16.2: a miniatura leva no pedaço tEXt "giz-conteudo" o SHA-256 do conteúdo do
# quadro e só aparece (galeria e /thumbs) se bater com o conteúdo de agora. Não corrige nada. O server.py roda como
# processo separado, por HTTP; dados fictícios em pasta temporária; as PNGs são de verdade (1x1) e levam um rótulo
# próprio (tEXt "rotulo") para saber qual imagem o servidor entregou.
#   M1. Marca forjada pelo cliente, com a impressão de um conteúdo FUTURO, em vários lugares da PNG: depois do
#       quadro mudar para esse conteúdo, a imagem velha não pode aparecer.
#   M2. PNG sem o pedaço (de antes da 1.16.2, deixada no disco): regra antiga da hora, com 2 s de folga.
#   M3. Renomear, mudar de pasta, salvar só o nome ou só a vista: a miniatura não pode sumir.
#   M4. Pacote de outro PC com o mesmo conteúdo: a miniatura tem de valer no PC que traz.
#   M5. Miniatura que chega depois de um salvamento mais novo (a página desenha a prévia de um instante e manda;
#       nesse meio-tempo outro salvamento chega): o servidor marca a imagem velha com o conteúdo novo.
#   python tests/provas/marca_miniatura.py
import base64, hashlib, importlib.util, io, json, os, re, socket, subprocess, sys, tempfile, time, urllib.error, urllib.request, zipfile, zlib
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("server_marca", RAIZ / "server.py")
S = importlib.util.module_from_spec(spec); spec.loader.exec_module(S)   # só para impressao_conteudo e as regex
resultado = []


def nota(nome, ok, detalhe):
    resultado.append((nome, ok))
    print(f"  {'PASSOU' if ok else 'FALHOU'}  {nome}\n         {detalhe}")


def pedaco(tipo, dados):
    return len(dados).to_bytes(4, "big") + tipo + dados + zlib.crc32(tipo + dados).to_bytes(4, "big")


def png(rotulo, extra_antes_do_fim=b"", depois_do_fim=b""):
    ihdr = pedaco(b"IHDR", (1).to_bytes(4, "big") * 2 + bytes([8, 2, 0, 0, 0]))
    idat = pedaco(b"IDAT", zlib.compress(b"\x00\xff\x00\x00"))
    return (b"\x89PNG\r\n\x1a\n" + ihdr + pedaco(b"tEXt", b"rotulo\x00" + rotulo.encode()) + idat + extra_antes_do_fim
            + pedaco(b"IEND", b"") + depois_do_fim)


def marca_forjada(impressao, bruta=False):
    dados = b"giz-conteudo\x00" + impressao.encode()
    return (b"tEXt" + dados) if bruta else pedaco(b"tEXt", dados)


def quadro(texto, **mais):
    return {"title": texto, "items": [{"id": "t", "type": "text", "x": 0, "y": 0, "w": 200, "text": texto}], **mais}


class Servidor:
    def __init__(self, nome):
        self.dados = Path(tempfile.mkdtemp(prefix=f"giz-marca-{nome}-")) / "quadros"
        with socket.socket() as s:
            s.bind(("127.0.0.1", 0)); self.porta = s.getsockname()[1]
        self.p = subprocess.Popen([sys.executable, str(RAIZ / "server.py"), "--sem-janela", "--sem-auto-encerrar",
                                   "--porta", str(self.porta), "--dados", str(self.dados)],
                                  env=dict(os.environ, GIZ_SEM_DIARIO="1"), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                self.token = json.loads((self.dados / ".agente" / "conexao.json").read_text(encoding="utf-8"))["token"]
                urllib.request.urlopen(f"http://127.0.0.1:{self.porta}/api/info", timeout=1).read()
                return
            except (OSError, ValueError):
                time.sleep(.1)
        raise RuntimeError("servidor não abriu")

    def pedir(self, metodo, rota, corpo=None, tipo="application/json"):
        dados = corpo if isinstance(corpo, (bytes, type(None))) else json.dumps(corpo).encode()
        req = urllib.request.Request(f"http://127.0.0.1:{self.porta}{rota}", data=dados, method=metodo,
                                     headers={"X-Lousa": self.token, "Content-Type": tipo})
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def salvar(self, bid, board, rev, thumb=None, criar=False):
        st, corpo = self.pedir("PUT", f"/api/boards/{bid}", {"board": board, "revision": rev, "thumb": thumb,
                                                              **({"criar": True} if criar else {})})
        return st, json.loads(corpo).get("revision")

    def miniatura(self, bid, b):
        return self.pedir("PUT", f"/api/thumbs/{bid}", {"thumb": "data:image/png;base64," + base64.b64encode(b).decode()})[0]

    def visto(self, bid):
        """(thumb na galeria, status do /thumbs, rótulo da imagem entregue)"""
        _, corpo = self.pedir("GET", "/api/boards")
        g = next((q.get("thumb") for q in json.loads(corpo) if q["id"] == bid), None)
        st, img = self.pedir("GET", f"/thumbs/{bid}.png")
        m = re.search(rb"rotulo\x00([A-Za-z0-9-]+)", img) if st == 200 else None
        return g, st, m.group(1).decode() if m else "-"

    def fim(self):
        self.p.kill(); self.p.wait()


def thumb_url(b):
    return "data:image/png;base64," + base64.b64encode(b).decode()


def m1(srv):
    print("\nM1. Marca forjada com a impressão de um conteúdo futuro")
    futuro = quadro("conteúdo futuro")
    imp = S.impressao_conteudo(futuro)
    lugares = {
        "pedaço tEXt antes do IEND": png("FORJADA", extra_antes_do_fim=marca_forjada(imp)),
        "depois do IEND": png("FORJADA", depois_do_fim=marca_forjada(imp)),
        "sem os 4 bytes de CRC depois (fim do arquivo)": png("FORJADA", depois_do_fim=marca_forjada(imp, bruta=True)),
        "duas forjadas": png("FORJADA", extra_antes_do_fim=marca_forjada(imp) + marca_forjada(imp)),
        "dentro do texto de outro tEXt": png("FORJADA", extra_antes_do_fim=pedaco(b"tEXt", b"x\x00" + marca_forjada(imp))),
        "no começo de um arquivo que não é PNG": marca_forjada(imp, bruta=True) + b"rotulo\x00FORJADA",
    }
    for n, (nome, b) in enumerate(lugares.items()):
        bid = f"m1q{n}"
        srv.salvar(bid, quadro("conteúdo de agora"), 0, criar=True)
        st = srv.miniatura(bid, b)                       # a imagem diz ser do conteúdo futuro
        antes = srv.visto(bid)
        srv.salvar(bid, futuro, 1)                       # o quadro passa a ter o conteúdo futuro, sem miniatura nova
        depois = srv.visto(bid)
        marcas = re.findall(rb"tEXtgiz-conteudo\x00([0-9a-f]{64})", (srv.dados / f"{bid}.png").read_bytes())
        ultima = marcas[-1].decode() if marcas else None
        nota(f"M1 ({nome}): a forjada não faz a imagem valer para o conteúdo futuro",
             depois[0] is False and depois[1] == 404,
             f"PUT /api/thumbs -> {st}; logo depois: galeria={antes[0]}, /thumbs {antes[1]} {antes[2]}; com o conteúdo futuro: "
             f"galeria={depois[0]}, /thumbs {depois[1]} {depois[2]}; marcas no arquivo: {len(marcas)}, a última "
             f"{'é a forjada' if ultima == imp else 'é a do servidor'}")


def m2(srv):
    print("\nM2. PNG sem o pedaço (de antes da 1.16.2), deixada no disco")
    for intervalo in (3, 1):
        bid = f"m2q{intervalo}"
        srv.salvar(bid, quadro("antes"), 0, criar=True)
        (srv.dados / f"{bid}.png").write_bytes(png("SEM-MARCA"))   # como a 1.16.1 gravava
        os.utime(srv.dados / f"{bid}.png", (time.time() - intervalo,) * 2)
        srv.salvar(bid, quadro("depois"), 1)
        g, st, rot = srv.visto(bid)
        nota(f"M2 ({intervalo} s): miniatura sem marca de um conteúdo anterior não aparece", g is False and st == 404,
             f"galeria={g}, /thumbs {st} {rot} (sem marca vale a regra da hora, com {S.TOLERANCIA_MINIATURA} s de folga)")


def m3(srv):
    print("\nM3. Renomear, mudar de pasta, salvar só o nome ou só a vista")
    bid = "m3q"
    _, rev = srv.salvar(bid, quadro("aula"), 0, thumb=thumb_url(png("PREVIA")), criar=True)
    casos = []
    casos.append(("renomear pela galeria (PUT /api/folder title)", lambda: srv.pedir("PUT", f"/api/folder/{bid}", {"title": "Aula renomeada"})))
    casos.append(("mudar de pasta (PUT /api/folder folder)", lambda: srv.pedir("PUT", f"/api/folder/{bid}", {"folder": "Física"})))
    estado = {"rev": rev}

    def salvar_titulo():
        b = json.loads((srv.dados / f"{bid}.json").read_text(encoding="utf-8"))
        b["title"] = "Título trocado no quadro"
        st, estado["rev"] = srv.salvar(bid, b, b["_rev"])
        return st, b""

    def salvar_vista():
        b = json.loads((srv.dados / f"{bid}.json").read_text(encoding="utf-8"))
        b["view"] = {"x": 120, "y": -40, "zoom": 1.5}
        st, estado["rev"] = srv.salvar(bid, b, b["_rev"])
        return st, b""
    casos.append(("salvar só o título (PUT /api/boards)", salvar_titulo))
    casos.append(("salvar só a vista (zoom e posição)", salvar_vista))
    for nome, fazer in casos:
        st = fazer()[0]
        g, st_t, rot = srv.visto(bid)
        nota(f"M3 ({nome}): a miniatura continua", g is True and st_t == 200 and rot == "PREVIA",
             f"pedido -> {st}; galeria={g}, /thumbs {st_t} {rot}")
    # o que a página faz ao abrir um quadro recém-criado: tira o campo "novo" e salva
    bid = "m3novo"
    srv.salvar(bid, quadro("quadro novo", novo=True), 0, thumb=thumb_url(png("PREVIA")), criar=True)
    b = json.loads((srv.dados / f"{bid}.json").read_text(encoding="utf-8")); del b["novo"]
    srv.salvar(bid, b, b["_rev"])
    g, st_t, rot = srv.visto(bid)
    print(f"  (observação) quadro criado com \"novo\": true e aberto: ao tirar o campo, a miniatura "
          f"{'continua' if g else 'some até a página mandar outra (4 s depois de salvar)'}: galeria={g}, /thumbs {st_t}")


def m4():
    print("\nM4. Pacote de outro PC com o mesmo conteúdo")
    a, b = Servidor("pc-a"), Servidor("pc-b")
    try:
        a.salvar("m4q", quadro("aula do outro PC"), 0, thumb=thumb_url(png("DO-OUTRO-PC")), criar=True)
        st, zipb = a.pedir("GET", "/api/pacote")
        _, r1 = b.pedir("POST", "/api/pacote", zipb, "application/zip")
        g, st_t, rot = b.visto("m4q")
        nota("M4 (trazido para um PC sem o quadro): a miniatura vale", g is True and st_t == 200 and rot == "DO-OUTRO-PC",
             f"resumo {json.loads(r1)}; galeria={g}, /thumbs {st_t} {rot}")
        _, r2 = b.pedir("POST", "/api/pacote", zipb, "application/zip")
        g, st_t, rot = b.visto("m4q")
        nota("M4 (trazido de novo, iguais): a miniatura continua", g is True and st_t == 200,
             f"resumo {json.loads(r2)}; galeria={g}, /thumbs {st_t} {rot}")
        c = Servidor("pc-c")
        try:
            c.salvar("m4q", quadro("outro conteúdo com o mesmo id"), 0, criar=True)
            _, r3 = c.pedir("POST", "/api/pacote", zipb, "application/zip")
            _, corpo = c.pedir("GET", "/api/boards")
            copia = next(q["id"] for q in json.loads(corpo) if q["id"] != "m4q")
            g, st_t, rot = c.visto(copia)
            nota("M4 (mesmo id com outro conteúdo, vira cópia): a miniatura da cópia vale",
                 g is True and st_t == 200 and rot == "DO-OUTRO-PC", f"resumo {json.loads(r3)}; cópia {copia}: galeria={g}, /thumbs {st_t} {rot}")
        finally:
            c.fim()
    finally:
        a.fim(); b.fim()


def m5(srv):
    print("\nM5. Miniatura de um conteúdo anterior que chega depois de um salvamento mais novo")
    bid = "m5q"
    _, rev = srv.salvar(bid, quadro("conteúdo 1"), 0, criar=True)
    imagem_do_1 = png("DO-CONTEUDO-1")              # a página desenhou a prévia com o conteúdo 1...
    srv.salvar(bid, quadro("conteúdo 2"), rev)      # ...e, enquanto desenhava, o salvamento do conteúdo 2 chegou
    st = srv.miniatura(bid, imagem_do_1)
    g, st_t, rot = srv.visto(bid)
    nota("M5: a imagem do conteúdo 1 não aparece como prévia do conteúdo 2", not (g is True and rot == "DO-CONTEUDO-1"),
         f"PUT /api/thumbs -> {st}; galeria={g}, /thumbs {st_t} {rot}. A página manda outra 4 s depois do salvamento do "
         "conteúdo 2; se o programa cair antes, esta fica")


def main():
    srv = Servidor("principal")
    try:
        m1(srv); m2(srv); m3(srv); m5(srv)
    finally:
        srv.fim()
    m4()
    print("\nResumo:")
    for nome, ok in resultado:
        print(f"  {'PASSOU' if ok else 'FALHOU'}  {nome}")
    falhas = sum(not ok for _, ok in resultado)
    print(f"\n{len(resultado) - falhas} passaram, {falhas} falharam")
    print("SHA-256 server.py:", hashlib.sha256((RAIZ / "server.py").read_bytes()).hexdigest())
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
