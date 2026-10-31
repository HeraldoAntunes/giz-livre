# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
"""Fuzzing das entradas que vêm de fora do PC: o quadro de um pacote trazido de outra pessoa e o id que chega na URL.
Propriedades: o quadro do pacote ou vira um quadro válido ou é recusado com erro de dado (nunca outra exceção), e
todo id aceito pelo servidor dá um arquivo dentro da pasta de quadros.
Uso: python tests/fuzz_entradas.py [n]  (sem dependências: sorteia n entradas; padrão 20000)
     com o atheris instalado (pip install atheris), roda o fuzzer guiado por cobertura do atheris."""
import importlib.util
import json
import os
import random
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
os.environ["GIZ_SEM_DIARIO"] = "1"
spec = importlib.util.spec_from_file_location("servidor_fuzz", RAIZ / "server.py")
S = importlib.util.module_from_spec(spec)
spec.loader.exec_module(S)
S.DADOS = Path(tempfile.mkdtemp(prefix="giz-fuzz-"))
BASE = os.path.realpath(S.DADOS)


def um_caso(dados: bytes) -> None:
    # 1) quadro de um pacote
    try:
        board = S.quadro_do_pacote(dados, "q")
    except (ValueError, UnicodeDecodeError, RecursionError):
        pass
    else:
        assert isinstance(board, dict) and isinstance(board.get("items"), list)
        assert all(S.item_valido(i) for i in board["items"])
        json.dumps(board, ensure_ascii=False, allow_nan=False)   # o que entra sempre se grava de volta
    # 2) id da URL
    bid = dados.decode("utf-8", "replace")
    if S.ID_OK.match(bid):
        for ext in (".json", ".png"):
            alvo = os.path.realpath(os.path.join(BASE, bid + ext))
            assert os.path.dirname(alvo) == BASE, (bid, alvo)


PEDACOS = [b'{"items":[', b']}', b'{"type":"stroke","pts":[1,2,3,4],"w":2}', b'{"type":"text","x":1,"y":2,"text":"a"}',
           b'{"type":"image","src":"https://x/y.png"}', b'"trazido_de":{"id":1}', b'NaN', b'1e999', b'..', b'/', b'\\',
           b'con', b'nul.json', b'\x00', b'\xff\xfe', b',', b'null', b'"', b'[' * 50, b'{"a":' * 30]


LETRAS = "abcXYZ019_-./\\:~ é"


def sortear(r: random.Random) -> bytes:
    if r.random() < 0.3:   # com cara de id, para a propriedade do caminho
        return "".join(r.choice(LETRAS) for _ in range(r.randint(1, 70))).encode("utf-8")
    if r.random() < 0.3:
        return bytes(r.getrandbits(8) for _ in range(r.randint(0, 80)))
    return b"".join(r.choice(PEDACOS) for _ in range(r.randint(1, 12)))


def main() -> int:
    try:
        import atheris
    except ImportError:
        atheris = None
    if atheris:
        atheris.Setup(sys.argv, um_caso)
        atheris.Fuzz()
        return 0
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 20000
    r = random.Random(1600)
    for _ in range(n):
        um_caso(sortear(r))
    print(f"{n} entradas sorteadas, nenhuma propriedade quebrada")
    return 0


if __name__ == "__main__":
    sys.exit(main())
