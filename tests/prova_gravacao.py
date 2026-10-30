# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
"""Prova de um comando para quem audita: roda só os testes de gravação concorrente (restaurar, publicar, id_publicavel)
e de quadro com miniatura sob falha de disco, e grava um relatório com o SHA-256 do código testado e o resultado de
cada teste. Uso: python tests/prova_gravacao.py [relatório.txt]  (só stdlib; Windows, Linux ou macOS)."""
import hashlib
import io
import platform
import sys
import time
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CLASSES = ["RestauracaoConcorrenteTests", "RestauracaoPublicacaoTests", "IdPublicavelTests",
           "GravacaoComFalhaDeDiscoTests"]


def main() -> int:
    sys.path.insert(0, str(RAIZ))
    import tests.test_server as ts
    suite = unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromTestCase(getattr(ts, c)) for c in CLASSES)
    saida = io.StringIO()
    r = unittest.TextTestRunner(stream=saida, verbosity=2).run(suite)
    linhas = [
        "Prova de gravação do Giz Livre",
        f"Data: {time.strftime('%Y-%m-%d %H:%M:%S %z')}",
        f"Python {platform.python_version()} em {platform.platform()}",
        *(f"SHA-256 {hashlib.sha256((RAIZ / p).read_bytes()).hexdigest()}  {p}"
          for p in ("server.py", "tests/test_server.py", "tests/prova_gravacao.py")),
        f"Testes: {r.testsRun}; falhas: {len(r.failures)}; erros: {len(r.errors)}; pulados: {len(r.skipped)}",
        f"Falhas de disco injetadas (uma operação ou daí em diante), cada uma conferida pelos bytes: "
        f"{ts.GravacaoComFalhaDeDiscoTests.casos_com_falha}",
        "Resultado: " + ("PASSOU" if r.wasSuccessful() and not r.skipped else "NÃO PASSOU"),
        "", saida.getvalue()]
    texto = "\n".join(linhas)
    print(texto)
    if len(sys.argv) > 1:
        Path(sys.argv[1]).write_text(texto, encoding="utf-8")
    return 0 if r.wasSuccessful() and not r.skipped else 1


if __name__ == "__main__":
    sys.exit(main())
