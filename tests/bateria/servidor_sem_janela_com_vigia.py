# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Para a bateria de testes: sobe o server.py com o vigia de inatividade ligado (como na versão com janela), mas sem
# abrir janela nenhuma; quem abre a página é o teste, num navegador sem janela. Uso:
#   python tests/bateria/servidor_sem_janela_com_vigia.py --porta 8830 --dados <pasta>
import importlib.util
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("servidor_bateria", RAIZ / "server.py")
srv = importlib.util.module_from_spec(spec)
sys.argv = ["server.py", *sys.argv[1:]]
spec.loader.exec_module(srv)
srv.abrir_janela = lambda url, evitar=(), proprio=None: None
srv.marcar_janelas_na_barra = lambda parar: None
sys.exit(srv.main())
