# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Prova (GL-RC6-L01): miniatura velha ou solta. Não corrige nada; só mostra, pelos bytes, o que fica no disco.
#   P1. Queda entre gravar o quadro e gravar a miniatura no MESMO PUT (/api/boards com "thumb"): o server.py roda num
#       processo que morre (os._exit) no instante em que gravar_miniatura começaria, como num corte de energia ali.
#       Reaberto o server.py normal, o quadro é o novo e a miniatura é a velha.
#   P2. O caminho da página: o quadro é salvo sem miniatura e ela vai depois, num PUT /api/thumbs/ (segundos depois).
#       O servidor leva SIGKILL entre os dois: quadro novo, miniatura velha.
#   P3. Falha de disco ao gravar a miniatura E falha do unlink que a apagaria (gravar_miniatura): fica a velha.
#   P4. Excluir com falha ao mover a miniatura E falha do unlink (mover_miniatura): PNG órfã na galeria, ocupando o id.
#   P5. A limpeza da abertura (limpar_miniaturas_soltas) com falha do unlink: a órfã continua.
# P1 e P2 usam o server.py de verdade em outro processo; P3 a P5 carregam o server.py como módulo e injetam o erro
# com unittest.mock (os.replace/Path.unlink/gravar_atomico), sem mudar o arquivo. Dados fictícios em pasta temporária.
#   python tests/provas/miniatura.py
import base64, contextlib, importlib.util, json, os, signal, socket, subprocess, sys, tempfile, textwrap, time, urllib.error, urllib.request
from pathlib import Path
from unittest import mock

RAIZ = Path(__file__).resolve().parents[2]
VELHA = b"\x89PNG\r\n\x1a\n" + b"MINIATURA-VELHA"
NOVA = b"\x89PNG\r\n\x1a\n" + b"MINIATURA-NOVA"
resultado = []


def nota(nome, cond, detalhe):
    resultado.append((nome, cond))
    print(f"  {'SIM' if cond else 'NÃO'}  {nome}\n       {detalhe}")


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


def pedir(porta, token, metodo, rota, corpo):
    req = urllib.request.Request(f"http://127.0.0.1:{porta}{rota}", data=json.dumps(corpo).encode(), method=metodo,
                                 headers={"X-Lousa": token, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except OSError as e:          # conexão cortada: o servidor morreu no meio do pedido
        return f"conexão cortada ({type(e).__name__})"


def quadro(texto):
    return {"title": texto, "items": [{"id": "t", "type": "text", "x": 0, "y": 0, "w": 200, "text": texto}]}


def thumb(png):
    return "data:image/png;base64," + base64.b64encode(png).decode()


def servidor_normal(dados, porta):
    return [sys.executable, str(RAIZ / "server.py"), "--sem-janela", "--sem-auto-encerrar", "--porta", str(porta), "--dados", str(dados)]


def preparar(dados, porta):
    """Quadro q1 com texto 'antes' e a miniatura VELHA, gravados pelo servidor normal."""
    p, token = subir(dados, porta, servidor_normal(dados, porta))
    pedir(porta, token, "PUT", "/api/boards/q1", {"board": quadro("antes"), "revision": 0, "thumb": thumb(VELHA)})
    p.kill(); p.wait()


def estado(dados):
    texto = json.loads((dados / "q1.json").read_text(encoding="utf-8"))["items"][0]["text"]
    png = (dados / "q1.png").read_bytes() if (dados / "q1.png").exists() else None
    return texto, ("VELHA" if png == VELHA else "NOVA" if png == NOVA else "nenhuma" if png is None else "outra")


def p1(tmp):
    print("\nP1. Queda entre o quadro e a miniatura no mesmo PUT")
    dados = tmp / "p1"; porta = porta_livre()
    preparar(dados, porta)
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
    st = pedir(porta, token, "PUT", "/api/boards/q1", {"board": quadro("depois"), "revision": 1, "thumb": thumb(NOVA)})
    p.wait(10)
    p, token = subir(dados, porta, servidor_normal(dados, porta))   # reabre normal (roda a limpeza da abertura)
    time.sleep(1)
    texto, mini = estado(dados)
    p.kill(); p.wait()
    nota("JSON novo com PNG velha depois de queda entre as duas gravações", texto == "depois" and mini == "VELHA",
         f"resposta do PUT: {st}; reaberto: quadro '{texto}', miniatura {mini}; a limpeza da abertura não mexe nela (o JSON existe)")


def p2(tmp):
    print("\nP2. Caminho da página: quadro salvo, servidor morre antes do PUT /api/thumbs")
    dados = tmp / "p2"; porta = porta_livre()
    preparar(dados, porta)
    p, token = subir(dados, porta, servidor_normal(dados, porta))
    st = pedir(porta, token, "PUT", "/api/boards/q1", {"board": quadro("depois"), "revision": 1, "thumb": None})
    p.send_signal(signal.SIGKILL); p.wait()
    p, token = subir(dados, porta, servidor_normal(dados, porta))
    time.sleep(1)
    texto, mini = estado(dados)
    p.kill(); p.wait()
    nota("JSON novo com PNG velha quando a queda vem antes do PUT da miniatura", texto == "depois" and mini == "VELHA",
         f"PUT do quadro: {st}; reaberto: quadro '{texto}', miniatura {mini}. Some quando a página abrir e fechar o quadro de novo")


def modulo(dados):
    spec = importlib.util.spec_from_file_location("server_prova_miniatura", RAIZ / "server.py")
    s = importlib.util.module_from_spec(spec); spec.loader.exec_module(s)
    s.registrar = s.diario = lambda *a, **k: None
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


def p3(tmp):
    print("\nP3. gravar_miniatura: falha ao gravar a nova e falha do unlink da velha")
    dados = tmp / "p3"; s = modulo(dados)
    (dados / "q1.json").write_text(json.dumps(quadro("depois")), encoding="utf-8")
    (dados / "q1.png").write_bytes(VELHA)
    real = s.gravar_atomico
    def grava(caminho, dadosb):
        if caminho.suffix == ".png":
            raise OSError(28, "disco cheio (injetado)")
        return real(caminho, dadosb)
    with mock.patch.object(s, "gravar_atomico", grava), unlink_falha():
        ok = s.gravar_miniatura("q1", NOVA)
    texto, mini = estado(dados)
    nota("PNG velha fica com o JSON novo se o unlink da limpeza falhar", not ok and mini == "VELHA",
         f"gravar_miniatura devolveu {ok}; quadro '{texto}', miniatura {mini}; o PUT responde 200 mesmo assim")
    with mock.patch.object(s, "gravar_atomico", grava):
        s.gravar_miniatura("q1", NOVA)
    nota("(controle) com o unlink funcionando, a velha sai", estado(dados)[1] == "nenhuma", f"miniatura {estado(dados)[1]}")


def p4(tmp):
    print("\nP4. Excluir: mover a miniatura falha e o unlink também (mover_miniatura)")
    dados = tmp / "p4"; s = modulo(dados)
    (dados / "q1.json").write_text(json.dumps(quadro("antes")), encoding="utf-8")
    (dados / "q1.png").write_bytes(VELHA)
    # o DELETE faz: os.replace do JSON para a lixeira e depois mover_miniatura(png); aqui o os.replace do .png falha
    os.replace(dados / "q1.json", s.LIXEIRA / "q1_20261030-120000.json")
    real = os.replace
    def troca(a, b, *x, **k):
        if str(a).endswith(".png"):
            raise PermissionError(13, "arquivo em uso (injetado)", str(a))
        return real(a, b, *x, **k)
    with mock.patch.object(s.os, "replace", troca), unlink_falha():
        s.mover_miniatura(dados / "q1.png", s.LIXEIRA / "q1_20261030-120000.png")
    orfa = (dados / "q1.png").exists() and not (dados / "q1.json").exists()
    nota("PNG órfã na galeria depois de excluir", orfa,
         f"galeria: q1.json {'existe' if (dados / 'q1.json').exists() else 'não existe'}, q1.png {'existe' if (dados / 'q1.png').exists() else 'não existe'}; "
         f"id_ocupado('q1') = {s.id_ocupado('q1')} (o id fica preso: restaurar q1 ganha um id novo)")
    nomes = iter(["q1", "q1-livre"])
    with s.id_publicavel(nomes) as novo:
        pass
    nota("o id ocupado pela órfã desvia a publicação para outro id", novo == "q1-livre", f"id_publicavel escolheu '{novo}'")


def p5(tmp):
    print("\nP5. Limpeza da abertura (limpar_miniaturas_soltas) com falha do unlink")
    dados = tmp / "p4"; s = modulo(dados)   # continua da P4: a órfã está lá
    with unlink_falha():
        n = s.limpar_miniaturas_soltas()
    nota("a órfã continua depois da limpeza com unlink falhando", n == 0 and (dados / "q1.png").exists(),
         f"limpar_miniaturas_soltas devolveu {n}; q1.png {'continua' if (dados / 'q1.png').exists() else 'saiu'} (o erro é engolido, sem registro)")
    n = s.limpar_miniaturas_soltas()
    nota("(controle) na abertura seguinte, com o unlink funcionando, ela sai", n == 1 and not (dados / "q1.png").exists(), f"devolveu {n}")


def main():
    tmp = Path(tempfile.mkdtemp(prefix="giz-prova-miniatura-"))
    for passo in (p1, p2, p3, p4, p5):
        passo(tmp)
    print("\nResumo (SIM = o comportamento descrito acontece):")
    for nome, cond in resultado:
        print(f"  {'SIM' if cond else 'NÃO'}  {nome}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
