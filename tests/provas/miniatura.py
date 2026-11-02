# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Prova (GL-RC6-L01): miniatura velha ou solta. Não corrige nada; mostra, pelos bytes e pelo que o servidor entrega,
# o que fica no disco e o que aparece. Critérios (desde a 1.16.1): a PNG velha pode ficar no disco, mas não pode aparecer na
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
#       velho que ela: restaurar um quadro antigo cuja miniatura não está na lixeira (órfã sem marca e com a marca de
#       outro conteúdo) e trazer um por pacote. Passa pelo HTTP de verdade e olha o id DEVOLVIDO.
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
    """Pelo conteúdo: a partir da 1.16.2 o servidor acrescenta a marca (tEXt) à PNG, então os bytes não são iguais."""
    if png is None:
        return "nenhuma"
    return "VELHA" if b"MINIATURA-VELHA" in png else "NOVA" if b"MINIATURA-NOVA" in png else "outra"


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


def servidor_no_processo(s):
    """O server.py do módulo servindo HTTP numa thread, para a falha injetada com mock valer dentro dos pedidos."""
    import threading
    srv = s.Servidor(("127.0.0.1", 0), s.Handler)
    s.PORTA = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, kwargs={"poll_interval": .02}, daemon=True).start()

    def pedir_mod(metodo, rota, corpo=None, tipo="application/json"):
        dadosb = corpo if isinstance(corpo, (bytes, type(None))) else json.dumps(corpo).encode()
        req = urllib.request.Request(f"http://127.0.0.1:{s.PORTA}{rota}", data=dadosb, method=metodo,
                                     headers={"X-Lousa": s.TOKEN, "Content-Type": tipo})
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()
    return srv, pedir_mod


def galeria_de(pedir_mod, bid):
    st, corpo = pedir_mod("GET", "/api/boards")
    thumb_galeria = next((q.get("thumb") for q in json.loads(corpo) if q["id"] == bid), None)
    st, corpo = pedir_mod("GET", f"/thumbs/{bid}.png")
    return thumb_galeria, st, (b"MINIATURA-VELHA" in corpo if st == 200 else False)


def p6(tmp, marcada):
    """A órfã continua (o apagar segue falhando) e um quadro antigo da lixeira, sem .png lá, é restaurado pelo
    POST /api/lixeira/restaurar de verdade. Confere o id DEVOLVIDO e o que a galeria e o /thumbs mostram para ele."""
    dados = tmp / f"p6-{'marcada' if marcada else 'sem-marca'}"; s = modulo(dados)
    excluido = quadro("conteúdo excluído")
    orfa = s.marcar_miniatura(VELHA, s.impressao_conteudo(excluido)) if marcada else VELHA
    (dados / "q1.png").write_bytes(orfa)
    antigo = quadro("quadro antigo, outro conteúdo")
    antigo["updated"] = int((time.time() - 3600) * 1000)
    (s.LIXEIRA / "q1_20261029-090000.json").write_text(json.dumps(antigo), encoding="utf-8")
    srv, pedir_mod = servidor_no_processo(s)
    try:
        with unlink_falha():
            st, corpo = pedir_mod("POST", "/api/lixeira/restaurar", {"nome": "q1_20261029-090000"})
            novo = json.loads(corpo).get("id")
            galeria, st_t, velha = galeria_de(pedir_mod, novo)
    finally:
        srv.shutdown(); srv.server_close()
    ok = st == 200 and galeria is False and not velha
    nota(f"P6 ({'órfã com marca' if marcada else 'órfã sem marca'}): restaurar no id da órfã; ela não vira a prévia",
         ok, f"restaurar -> {st}, id devolvido '{novo}'; galeria thumb={galeria}; /thumbs/{novo}.png -> {st_t}"
             f"{' com os bytes da órfã' if velha else ''}; registrado: {len(s.registros)} erro(s)")


def p6_pacote(tmp):
    """O mesmo com um pacote que traz um quadro q1 sem miniatura, com a órfã sem marca que não sai."""
    import io, zipfile
    dados = tmp / "p6-pacote"; s = modulo(dados)
    (dados / "q1.png").write_bytes(VELHA)
    z = io.BytesIO()
    with zipfile.ZipFile(z, "w") as f:
        f.writestr("manifesto.json", json.dumps({"formato": 1}))
        f.writestr("quadros/q1.json", json.dumps(quadro("trazido por pacote")))
    srv, pedir_mod = servidor_no_processo(s)
    try:
        with unlink_falha():
            st, corpo = pedir_mod("POST", "/api/pacote", z.getvalue(), "application/zip")
            resumo = json.loads(corpo)
            st_l, lista = pedir_mod("GET", "/api/boards")
            ids = [q["id"] for q in json.loads(lista)]
            mostrados = [(bid,) + galeria_de(pedir_mod, bid) for bid in ids]
    finally:
        srv.shutdown(); srv.server_close()
    com_orfa = [m for m in mostrados if m[1] is True or m[3]]
    nota("P6 (pacote): quadro trazido no id da órfã sem marca; ela não vira a prévia", st == 200 and not com_orfa,
         f"resumo: {resumo}; quadros: {ids}; com a órfã à mostra: {com_orfa or 'nenhum'}")


def main():
    tmp = Path(tempfile.mkdtemp(prefix="giz-prova-miniatura-"))
    print("Defeito B (queda entre o quadro e a miniatura)")
    for intervalo in (3, 1):
        p1(tmp, intervalo)
        p2(tmp, intervalo)
    print("\nDefeito C (apagar que falha)")
    for passo in (p3, p4, p5):
        passo(tmp)
    p6(tmp, marcada=False)
    p6(tmp, marcada=True)
    p6_pacote(tmp)
    print("\nResumo:")
    for nome, ok in resultado:
        print(f"  {'PASSOU' if ok else 'FALHOU'}  {nome}")
    falhas = sum(not ok for _, ok in resultado)
    print(f"\n{len(resultado) - falhas} passaram, {falhas} falharam")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
