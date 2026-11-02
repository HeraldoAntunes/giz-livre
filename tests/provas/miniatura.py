# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Prova (GL-RC6-L01): miniatura velha ou solta. Não corrige nada; mostra, pelos bytes e pelo que o servidor entrega,
# o que fica no disco e o que aparece. Critérios da 1.16.1: a PNG velha pode ficar no disco, mas não pode aparecer na
# galeria (GET /api/boards, campo "thumb") nem em /thumbs/<id>.png; um apagar que falha vai para o giz-livre.log e não
# prende o id.
#   P1. Queda entre gravar o quadro e gravar a miniatura no MESMO PUT (/api/boards com "thumb"): o server.py roda num
#       processo que morre (os._exit) no instante em que gravar_miniatura começaria. Reaberto o server.py normal.
#   P2. O caminho da página: o quadro é salvo sem miniatura e ela vai depois, num PUT /api/thumbs/ (4 s depois). O
#       servidor leva SIGKILL entre os dois.
#       P1 e P2 rodam duas vezes: com 3 s entre a miniatura velha e o quadro novo, e com menos de 2 s (a tolerância
#       TOLERANCIA_MINIATURA da 1.16.1, pensada para o FAT32).
#   P3. Falha de disco ao gravar a miniatura E falha do unlink que a apagaria (gravar_miniatura).
#   P4. Excluir com falha ao mover a miniatura E falha do unlink (mover_miniatura): PNG órfã na galeria.
#   P5. A limpeza da abertura (limpar_miniaturas_soltas) com falha do unlink.
#   P6. A órfã da P4 continua (o unlink segue falhando) e o id é publicado de novo com um quadro de "updated" mais
#       velho que ela (restaurar um quadro antigo cuja miniatura não está na lixeira, ou trazer um por pacote).
# P1 e P2 usam o server.py de verdade em outro processo; P3 a P6 carregam o server.py como módulo e injetam o erro
# com unittest.mock (os.replace/Path.unlink/gravar_atomico), sem mudar o arquivo. Dados fictícios em pasta temporária.
#   python tests/provas/miniatura.py
import base64, contextlib, importlib.util, json, os, signal, socket, subprocess, sys, tempfile, textwrap, time, urllib.error, urllib.request
from pathlib import Path
from unittest import mock

RAIZ = Path(__file__).resolve().parents[2]
VELHA = b"\x89PNG\r\n\x1a\n" + b"MINIATURA-VELHA"
NOVA = b"\x89PNG\r\n\x1a\n" + b"MINIATURA-NOVA"
resultado = []


def nota(nome, ok, detalhe):
    """ok = o critério da 1.16.1 foi cumprido."""
    resultado.append((nome, ok))
    print(f"  {'PASSOU' if ok else 'FALHOU'}  {nome}\n         {detalhe}")


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0)); return s.getsockname()[1]


def subir(dados, porta, cmd):
    p = subprocess.Popen(cmd, env=dict(os.environ, GIZ_SEM_DIARIO="1"), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(100):
        try:
            token = json.loads((dados / ".agente" / "conexao.json").read_text(encoding="utf-8"))["token"]
            urllib.request.urlopen(f"http://127.0.0.1:{porta}/api/info", timeout=1).read()
            return p, token
        except (OSError, ValueError):
            time.sleep(.1)
    p.kill(); raise RuntimeError("servidor não abriu")


def pedir(porta, token, metodo, rota, corpo=None):
    req = urllib.request.Request(f"http://127.0.0.1:{porta}{rota}", data=None if corpo is None else json.dumps(corpo).encode(),
                                 method=metodo, headers={"X-Lousa": token, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except OSError as e:          # conexão cortada: o servidor morreu no meio do pedido
        return f"conexão cortada ({type(e).__name__})", b""


def quadro(texto):
    return {"title": texto, "items": [{"id": "t", "type": "text", "x": 0, "y": 0, "w": 200, "text": texto}]}


def thumb(png):
    return "data:image/png;base64," + base64.b64encode(png).decode()


def servidor_normal(dados, porta):
    return [sys.executable, str(RAIZ / "server.py"), "--sem-janela", "--sem-auto-encerrar", "--porta", str(porta), "--dados", str(dados)]


def nome_png(png):
    return "VELHA" if png == VELHA else "NOVA" if png == NOVA else "nenhuma" if png is None else "outra"


def estado(dados):
    texto = json.loads((dados / "q1.json").read_text(encoding="utf-8"))["items"][0]["text"]
    png = (dados / "q1.png").read_bytes() if (dados / "q1.png").exists() else None
    return texto, nome_png(png)


def visivel(porta, token):
    """O que a galeria e o /thumbs entregam para q1."""
    st, corpo = pedir(porta, token, "GET", "/api/boards")
    na_galeria = next((q.get("thumb") for q in json.loads(corpo) if q["id"] == "q1"), None) if st == 200 else f"erro {st}"
    st, corpo = pedir(porta, token, "GET", "/thumbs/q1.png")
    return na_galeria, (st, nome_png(corpo) if st == 200 else "-")


def preparar(dados, porta):
    """Quadro q1 com texto 'antes' e a miniatura VELHA, gravados pelo servidor normal, que fica no ar."""
    p, token = subir(dados, porta, servidor_normal(dados, porta))
    pedir(porta, token, "PUT", "/api/boards/q1", {"board": quadro("antes"), "revision": 0, "criar": True, "thumb": thumb(VELHA)})
    return p, token


def criterio_b(nome, dados, porta, extra):
    p, token = subir(dados, porta, servidor_normal(dados, porta))   # reabre normal (roda a limpeza da abertura)
    time.sleep(1)
    texto, mini = estado(dados)
    galeria, thumbs = visivel(porta, token)
    p.kill(); p.wait()
    ok = texto == "depois" and (mini != "VELHA" or (galeria is False and thumbs[0] == 404))
    nota(nome, ok, f"{extra}; reaberto: quadro '{texto}', no disco miniatura {mini}; galeria thumb={galeria}; "
                   f"/thumbs/q1.png -> {thumbs[0]} {thumbs[1]}")


def p1(tmp, intervalo):
    dados = tmp / f"p1-{intervalo}"; porta = porta_livre()
    p, _ = preparar(dados, porta)
    p.kill(); p.wait()
    # mesmo server.py, só que o processo morre quando gravar_miniatura ia começar (o quadro novo já foi trocado)
    queda = textwrap.dedent(f"""
        import importlib.util, os, sys
        sys.argv = {servidor_normal(dados, porta)[1:]!r}
        spec = importlib.util.spec_from_file_location("server", {str(RAIZ / 'server.py')!r})
        s = importlib.util.module_from_spec(spec); spec.loader.exec_module(s)
        s.gravar_miniatura = lambda *a, **k: os._exit(137)
        sys.exit(s.main())
    """)
    p, token = subir(dados, porta, [sys.executable, "-c", queda])
    os.utime(dados / "q1.png", (time.time() - intervalo,) * 2)   # a miniatura velha foi gravada `intervalo` s antes
    st, _ = pedir(porta, token, "PUT", "/api/boards/q1", {"board": quadro("depois"), "revision": 1, "thumb": thumb(NOVA)})
    p.wait(10)
    criterio_b(f"P1 ({intervalo} s): queda entre o quadro e a miniatura no mesmo PUT; a velha não aparece", dados, porta,
               f"resposta do PUT: {st}")


def p2(tmp, intervalo):
    dados = tmp / f"p2-{intervalo}"; porta = porta_livre()
    p, token = preparar(dados, porta)
    os.utime(dados / "q1.png", (time.time() - intervalo,) * 2)
    st, _ = pedir(porta, token, "PUT", "/api/boards/q1", {"board": quadro("depois"), "revision": 1, "thumb": None})
    p.send_signal(signal.SIGKILL); p.wait()
    criterio_b(f"P2 ({intervalo} s): queda antes do PUT /api/thumbs (caminho da página); a velha não aparece", dados, porta,
               f"PUT do quadro: {st}")


def modulo(dados):
    spec = importlib.util.spec_from_file_location("server_prova_miniatura", RAIZ / "server.py")
    s = importlib.util.module_from_spec(spec); spec.loader.exec_module(s)
    s.registros = []
    s.registrar = lambda e: s.registros.append(f"{type(e).__name__}: {e}")
    s.diario = lambda *a, **k: None
    s.DADOS, s.LIXEIRA = dados, dados / "lixeira"
    s.LIXEIRA.mkdir(parents=True, exist_ok=True)
    return s


@contextlib.contextmanager
def unlink_falha(sufixo=".png"):
    original = Path.unlink
    def falso(self, *a, **k):
        if self.name.endswith(sufixo):
            raise PermissionError(13, "unlink recusado (injetado)", str(self))
        return original(self, *a, **k)
    with mock.patch.object(Path, "unlink", falso):
        yield


def unlink_registrado(s):
    return any("unlink recusado" in r for r in s.registros)


def p3(tmp):
    dados = tmp / "p3"; s = modulo(dados)
    b = quadro("depois"); b["updated"] = int(time.time() * 1000)
    (dados / "q1.json").write_text(json.dumps(b), encoding="utf-8")
    (dados / "q1.png").write_bytes(VELHA)
    os.utime(dados / "q1.png", (time.time() - 60,) * 2)   # a velha é de um minuto antes
    real = s.gravar_atomico
    def grava(caminho, dadosb):
        if caminho.suffix == ".png":
            raise OSError(28, "disco cheio (injetado)")
        return real(caminho, dadosb)
    with mock.patch.object(s, "gravar_atomico", grava), unlink_falha():
        ok = s.gravar_miniatura("q1", NOVA)
    texto, mini = estado(dados)
    galeria = next(q["thumb"] for q in s.listar_quadros() if q["id"] == "q1")
    nota("P3: gravar e apagar a miniatura falham; o erro do apagar vai ao log e a velha não aparece",
         unlink_registrado(s) and (mini != "VELHA" or galeria is False),
         f"gravar_miniatura -> {ok}; no disco miniatura {mini}; galeria thumb={galeria}; registrado: {s.registros}")


def p4(tmp):
    dados = tmp / "p4"; s = modulo(dados)
    (dados / "q1.json").write_text(json.dumps(quadro("antes")), encoding="utf-8")
    (dados / "q1.png").write_bytes(VELHA)
    os.replace(dados / "q1.json", s.LIXEIRA / "q1_20261030-120000.json")   # o DELETE: o JSON vai primeiro
    real = os.replace
    def troca(a, b, *x, **k):
        if str(a).endswith(".png"):
            raise PermissionError(13, "arquivo em uso (injetado)", str(a))
        return real(a, b, *x, **k)
    with mock.patch.object(s.os, "replace", troca), unlink_falha():
        s.mover_miniatura(dados / "q1.png", s.LIXEIRA / "q1_20261030-120000.png")
    orfa = (dados / "q1.png").exists()
    with s.id_publicavel(iter(["q1", "q1-outro"])) as novo:
        pass
    nota("P4: excluir com mover e apagar falhando; o erro vai ao log e o id não fica preso",
         unlink_registrado(s) and not s.id_ocupado("q1") and novo == "q1",
         f"órfã q1.png no disco: {'sim' if orfa else 'não'}; id_ocupado('q1') = {s.id_ocupado('q1')}; "
         f"id_publicavel escolheu '{novo}'; registrado: {s.registros}")


def p5(tmp):
    dados = tmp / "p5"; s = modulo(dados)
    (dados / "q1.png").write_bytes(VELHA)   # órfã: sem q1.json
    with unlink_falha():
        n = s.limpar_miniaturas_soltas()
    ficou = (dados / "q1.png").exists()
    n2 = s.limpar_miniaturas_soltas()
    nota("P5: a limpeza da abertura com apagar falhando registra o erro; na abertura seguinte a órfã sai",
         unlink_registrado(s) and n2 == 1 and not (dados / "q1.png").exists(),
         f"com falha: devolveu {n}, órfã {'continua' if ficou else 'saiu'}; registrado: {s.registros}; depois, sem falha: devolveu {n2}")


def p6(tmp):
    dados = tmp / "p6"; s = modulo(dados)
    (dados / "q1.png").write_bytes(VELHA)        # órfã da P4: miniatura de um conteúdo excluído, gravada agora
    antigo = quadro("quadro antigo, outro conteúdo")
    antigo["updated"] = int((time.time() - 3600) * 1000)   # editado pela última vez uma hora antes
    (s.LIXEIRA / "q1_20261029-090000.json").write_text(json.dumps(antigo), encoding="utf-8")   # sem .png na lixeira
    # restaurar como o _restaurar faz, com o apagar da avulsa falhando de novo (o mesmo antivírus segurando)
    with unlink_falha():
        with s.id_publicavel(iter(["q1"])) as novo:
            os.replace(s.LIXEIRA / "q1_20261029-090000.json", dados / f"{novo}.json")
            s.mover_miniatura(s.LIXEIRA / "q1_20261029-090000.png", dados / f"{novo}.png")
    galeria = next(q["thumb"] for q in s.listar_quadros() if q["id"] == "q1")
    mini = nome_png((dados / "q1.png").read_bytes() if (dados / "q1.png").exists() else None)
    nota("P6: órfã de um quadro excluído não vira a prévia de outro quadro publicado no mesmo id",
         not (mini == "VELHA" and galeria is True),
         f"restaurado em '{novo}'; no disco miniatura {mini}; galeria thumb={galeria}; registrado: {s.registros}")


def main():
    tmp = Path(tempfile.mkdtemp(prefix="giz-prova-miniatura-"))
    print("Defeito B (queda entre o quadro e a miniatura)")
    for intervalo in (3, 1):
        p1(tmp, intervalo)
        p2(tmp, intervalo)
    print("\nDefeito C (apagar que falha)")
    for passo in (p3, p4, p5, p6):
        passo(tmp)
    print("\nResumo:")
    for nome, ok in resultado:
        print(f"  {'PASSOU' if ok else 'FALHOU'}  {nome}")
    falhas = sum(not ok for _, ok in resultado)
    print(f"\n{len(resultado) - falhas} passaram, {falhas} falharam")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
