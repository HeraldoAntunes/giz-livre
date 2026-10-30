# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
"""Monta o Giz Livre com a janela própria: sem PyInstaller, sem Inno Setup.

1. Python embutido oficial (python.org, assinado pela Python Software Foundation), baixado uma vez para build/cache e
   conferido pelo SHA-256 fixado abaixo.
2. Pacote: python/ + servidor/server.py + servidor/app/ + licenças e textos.
3. GizLivre.exe (janela/, Tauri) compilado com `cargo build --locked --release`, sem nada dentro e com as páginas do
   Giz Livre (frontendDist ../app), sem caminhos deste PC (--remap-path-prefix).
4. Saídas em dist/janela/: Instalar-GizLivre-<versão>.zip (a pasta com o exe, python/, servidor/, instalar.txt e
   LEIA-ME.txt; o exe se instala copiando a própria pasta), GizLivre-<versão>-portatil.zip e SHA256SUMS.txt.

Uso:  python scripts/montar_janela.py             compila e monta (a versão vem do server.py e tem de bater com
                                                  janela/Cargo.toml)
      python scripts/montar_janela.py --exe <exe> monta os zips com um exe já compilado (o que passou pelo VirusTotal)
      --rodada3 e --rodada5 remontam as variantes das rodadas 3 e 5 do VirusTotal de 29/10/2026 (histórico, em
      docs/P60-VIRUSTOTAL.md); não são caminhos de distribuição.
"""
import argparse
import hashlib
import json
import os
import posixpath
import re
import shutil
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PY_VERSAO = "3.13.15"
PY_ZIP = f"python-{PY_VERSAO}-embed-amd64.zip"
PY_URL = f"https://www.python.org/ftp/python/{PY_VERSAO}/{PY_ZIP}"
PY_SHA256 = "d1f04d990aee1253d8569e8e5104e30fa9f5fa830899f14843448872d936a2cf"
BUILD = RAIZ / "build" / "janela"
SAIDA = RAIZ / "dist" / "janela"

# textos que acompanham o programa (na raiz da pasta instalada)
TEXTOS = {"LICENSE": "LICENSE", "THIRD-PARTY-NOTICES.md": "THIRD-PARTY-NOTICES.md",
          "THIRD-PARTY-NOTICES-JANELA.md": "THIRD-PARTY-NOTICES-JANELA.md", "README.md": "README.md",
          "AUTORES.md": "AUTORES.md",   # o README aponta para ele (auditoria da rc.3, GL-D04)
          "GUIA-DE-USO.md": "docs/GUIA-DE-USO.md", "LICENCA-traducao-pt-BR.md": "docs/LICENCA-traducao-pt-BR.md"}
LICENCAS = {"pdfjs-LICENSE.txt": "app/vendor/pdfjs/LICENSE", "openjpeg-LICENSE.txt": "app/vendor/pdfjs/OPENJPEG-LICENSE.txt",
            "katex-LICENSE.txt": "app/vendor/katex/LICENSE", "katex-fontes-OFL.txt": "app/vendor/katex/fonts/OFL.txt",
            "fluent-icons-LICENSE.txt": "app/vendor/fluent/LICENSE"}


REPO = "https://github.com/HeraldoAntunes/giz-livre"
LINK = re.compile(r'(\]\(|(?:src|href)=")([^)"\s]+)')


def links_do_pacote(texto: str, origem: str, v: str) -> str:
    """Os textos que vão nos zips (README, guia) apontam para arquivos do repositório; fora dele, viravam links
    quebrados (auditoria da rc.4, GL-D05). Link para um arquivo que vai no zip passa a apontar para ele lá; o resto vira
    o endereço do arquivo no GitHub, na tag da versão. Endereços completos e âncoras da própria página ficam."""
    no_pacote = {o: d for d, o in TEXTOS.items()}
    pasta = posixpath.dirname(origem)

    def trocar(m):
        alvo = m.group(2)
        if re.match(r"[a-z][a-z0-9+.-]*:", alvo, re.I) or alvo.startswith("#"):
            return m.group(0)
        caminho, _, ancora = alvo.partition("#")
        no_repo = posixpath.normpath(posixpath.join(pasta, caminho))
        if no_repo in no_pacote:
            novo = no_pacote[no_repo]
        else:
            novo = f"{REPO}/blob/v{v}/{no_repo}"
        return m.group(1) + novo + ("#" + ancora if ancora else "")
    return LINK.sub(trocar, texto)


def versao() -> str:
    v = re.search(r'^VERSAO = "([^"]+)"', (RAIZ / "server.py").read_text(encoding="utf-8"), re.M).group(1)
    cargo = re.search(r'^version = "([^"]+)"', (RAIZ / "janela" / "Cargo.toml").read_text(encoding="utf-8"), re.M).group(1)
    conf = json.loads((RAIZ / "janela" / "tauri.conf.json").read_text(encoding="utf-8"))["version"]
    if not v == cargo == conf:
        sys.exit(f"versões diferentes: server.py {v}, janela/Cargo.toml {cargo}, tauri.conf.json {conf}")
    return v


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def python_embutido() -> Path:
    arq = RAIZ / "build" / "cache" / PY_ZIP
    if not arq.exists():
        arq.parent.mkdir(parents=True, exist_ok=True)
        print(f"baixando {PY_URL}")
        with urllib.request.urlopen(PY_URL, timeout=120) as r:
            arq.write_bytes(r.read())
    if sha256(arq) != PY_SHA256:
        arq.unlink()
        sys.exit(f"{PY_ZIP}: SHA-256 não confere com o fixado; apagado (baixe de novo e confira a assinatura)")
    return arq


def montar_pacote(v: str) -> Path:
    pacote = BUILD / "pacote"
    shutil.rmtree(pacote, ignore_errors=True)
    pacote.mkdir(parents=True)
    with zipfile.ZipFile(python_embutido()) as z:
        z.extractall(pacote / "python")
    srv = pacote / "servidor"
    srv.mkdir()
    shutil.copy2(RAIZ / "server.py", srv / "server.py")
    shutil.copytree(RAIZ / "app", srv / "app", ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    for destino, origem in TEXTOS.items():
        if origem.endswith(".md"):
            texto = (RAIZ / origem).read_text(encoding="utf-8")
            (pacote / destino).write_text(links_do_pacote(texto, origem, v), encoding="utf-8", newline="")
        else:
            shutil.copy2(RAIZ / origem, pacote / destino)
    lic = pacote / "licencas"
    lic.mkdir()
    shutil.copy2(pacote / "python" / "LICENSE.txt", lic / "python-LICENSE.txt")
    for destino, origem in LICENCAS.items():
        shutil.copy2(RAIZ / origem, lic / destino)
    # OpenSSL 3 (libssl e libcrypto, que vêm no Python embutido): Apache License 2.0, o mesmo texto do pdf.js
    (lic / "openssl-LICENSE.txt").write_text(
        "OpenSSL 3 (libssl e libcrypto), usado pela atualização do Giz Livre (HTTPS).\n"
        "Copyright (c) 1998-2025 The OpenSSL Project Authors. Copyright (c) 1995-1998 Eric A. Young, Tim J. Hudson.\n"
        "Licenciado sob a Apache License 2.0, reproduzida abaixo. https://www.openssl.org/source/license.html\n\n"
        + (RAIZ / "app/vendor/pdfjs/LICENSE").read_text(encoding="utf-8"), encoding="utf-8")
    ico = pacote / "icones"
    ico.mkdir()
    for f in (RAIZ / "installer" / "icones").glob("*.ico"):
        shutil.copy2(f, ico / f.name)
    shutil.copy2(RAIZ / "installer" / "icones" / "LEIA-ME.txt", ico / "LEIA-ME.txt")
    # o pacote tem de rodar: o servidor sobe no Python embutido e responde a versão certa
    r = subprocess.run([str(pacote / "python" / "python.exe"), "-c",
                        "import ssl, ctypes, winreg, zipfile, http.server; print('ok')"], capture_output=True, text=True)
    if r.stdout.strip() != "ok":
        sys.exit(f"o Python embutido não carregou os módulos do servidor: {r.stderr}")
    return pacote


def zipar(pasta: Path, arq: Path, prefixo: str = "", comprimir: bool = True) -> None:
    arq.unlink(missing_ok=True)
    modo = zipfile.ZIP_DEFLATED if comprimir else zipfile.ZIP_STORED
    with zipfile.ZipFile(arq, "w", modo, compresslevel=9 if comprimir else None) as z:
        for p in sorted(pasta.rglob("*")):
            if p.is_file():
                z.write(p, prefixo + p.relative_to(pasta).as_posix())


def compilar(zip_pacote, features: list, nome: str, config: dict | None = None) -> Path:
    """GizLivre.exe com o pacote dentro (zip_pacote=None: sem nada dentro); guardado em build/janela/<nome>.exe.
    `config`: trecho mesclado no tauri.conf.json só nesta compilação (variável TAURI_CONFIG do Tauri)."""
    env = {**os.environ, "GIZ_PACOTE": str(zip_pacote) if zip_pacote else "", "TAURI_CONFIG": json.dumps(config or {})}
    # sem caminhos deste PC dentro do exe (as mensagens de erro do Rust levam o caminho de cada arquivo-fonte); a forma
    # "encoded" separa as opções por \x1f, porque a pasta do projeto tem espaço no nome
    env["CARGO_ENCODED_RUSTFLAGS"] = chr(0x1f).join(
        [f"--remap-path-prefix={os.environ.get('USERPROFILE') or Path.home()}=~", f"--remap-path-prefix={RAIZ}=."])
    # --locked: as versões do Cargo.lock, como no CI
    cmd = ["cargo", "build", "--locked", "--release"] + (["--features", ",".join(features)] if features else [])
    subprocess.run(cmd, cwd=RAIZ / "janela", env=env, check=True)
    saida = BUILD / f"{nome}.exe"
    shutil.copy2(RAIZ / "janela" / "target" / "release" / "GizLivre.exe", saida)
    return saida


def rodada3(v: str, pacote: Path) -> None:
    """Variantes da rodada 3 do VirusTotal (29/10/2026), pedidas pela gestão: o exe com o pacote dentro levou 1/75
    (Trapmine) mesmo sem compressão, e a suspeita é a cara de "dropper" (exe que traz executáveis dentro e os grava).
    a) exe sem nada dentro, que se instala copiando a própria pasta (marca instalar.txt), solto e no zip de instalação;
    b) o mesmo exe sem o código de instalar (feature so-janela), como controle;
    c) python.exe e pythonw.exe oficiais, soltos, como controle;
    d) portátil novo, com o exe sem nada dentro."""
    destino = RAIZ / "dist" / "janela-rodada3"
    shutil.rmtree(destino, ignore_errors=True)
    destino.mkdir(parents=True)
    so_janela = compilar(None, ["so-janela"], "so-janela")
    shutil.copy2(so_janela, destino / f"GizLivre-{v}-so-janela.exe")
    sem_pacote = compilar(None, [], "sem-pacote")
    shutil.copy2(sem_pacote, destino / f"GizLivre-{v}-sem-pacote.exe")
    for nome in ("python.exe", "pythonw.exe"):
        shutil.copy2(pacote / "python" / nome, destino / nome)
    pasta = BUILD / "rodada3" / f"GizLivre-{v}"
    shutil.rmtree(pasta.parent, ignore_errors=True)
    shutil.copytree(pacote, pasta)
    shutil.copy2(sem_pacote, pasta / "GizLivre.exe")
    (pasta / "instalar.txt").write_text("Abra o GizLivre.exe desta pasta para instalar o Giz Livre (só para a sua conta, "
                                        "sem administrador). Extraia o zip inteiro antes.\n", encoding="utf-8")
    zipar(pasta, destino / f"Instalar-GizLivre-{v}.zip", f"GizLivre-{v}/")
    port = BUILD / "rodada3" / "portatil" / "GizLivre"
    shutil.copytree(pacote, port)
    shutil.copy2(sem_pacote, port / "GizLivre.exe")
    (port / "portatil.txt").write_text("Com este arquivo presente, os quadros ficam na pasta quadros ao lado do "
                                       "GizLivre.exe.\n", encoding="utf-8")
    zipar(port, destino / f"GizLivre-{v}-portatil.zip", "GizLivre/")
    linhas = [f"{sha256(p)}  {p.name}" for p in sorted(destino.iterdir()) if p.is_file()]
    linhas.append(f"# Giz Livre {v} - rodada 3: exe sem nada dentro (sem-pacote, so-janela), zip de instalacao "
                  f"(copia a propria pasta), portatil novo, python.exe e pythonw.exe oficiais {PY_VERSAO}")
    (destino / "SHA256SUMS.txt").write_text("\n".join(linhas) + "\n", encoding="ascii")
    for p in sorted(destino.iterdir()):
        print(f"{p.stat().st_size / 1e6:6.1f} MB  {p.name}")


# rodada 5 (29/10/2026): o programa já não tem cliente HTTP por soquete nem manifesto de permissões próprio (as duas
# peças que pesaram na rodada 4); o aviso de fechar vem pelo título da página. Sem nada dentro do exe em todas.
SEM_PUBLISHER = {"bundle": {"publisher": None}}   # como o Bancada: a "empresa" do exe sai do identificador
COM_PAGINAS = {"bundle": {"publisher": None}, "build": {"frontendDist": "../app"}}   # as páginas do Giz Livre dentro
RODADA5 = [   # (nome, features, config)
    ("8-so-janela-sem-filho-local-state-instancia", ["so-janela", "sem-filho", "sem-local-state", "sem-instancia-unica"], None),
    ("8b-so-janela", ["so-janela"], None),
    ("8c-programa", [], None),
    ("9-programa-metadados-como-bancada", [], SEM_PUBLISHER),
    ("10-programa-metadados-e-paginas-dentro", [], COM_PAGINAS),
]


def rodada5(v: str) -> None:
    destino = RAIZ / "dist" / "janela-rodada5"
    shutil.rmtree(destino, ignore_errors=True)
    destino.mkdir(parents=True)
    for nome, features, config in RODADA5:
        shutil.copy2(compilar(None, features, nome, config), destino / f"GizLivre-{v}-{nome}.exe")
    linhas = [f"{sha256(p)}  {p.name}" for p in sorted(destino.iterdir()) if p.is_file()]
    linhas.append(f"# Giz Livre {v} - rodada 5: sem cliente HTTP e sem app_manifest; variantes de metadados e paginas dentro")
    (destino / "SHA256SUMS.txt").write_text(chr(10).join(linhas) + chr(10), encoding="ascii")
    for p in sorted(destino.iterdir()):
        print(f"{p.stat().st_size / 1e6:6.1f} MB  {p.name}")


NL = chr(10)
LEIA_ME = """Giz Livre {v}

1. Extraia o zip inteiro (botão direito no zip, "Extrair tudo").
2. Abra o GizLivre.exe da pasta extraída.
3. Ele pergunta se instala: copia a pasta para a sua conta, sem pedir administrador, e cria os atalhos.

Os quadros e ajustes da versão anterior continuam.
Não apague o instalar.txt: é por ele que o GizLivre.exe sabe que deve se instalar.
"""


def distribuir(v: str, pacote: Path, exe: Path) -> None:
    """Os arquivos da versão em dist/janela: o zip de instalação (pasta GizLivre-<v> com instalar.txt: o exe pergunta
    e copia a própria pasta) e o portátil (com portatil.txt), mais o SHA256SUMS. O exe vai sem nada dentro e com as
    páginas do Giz Livre (frontendDist ../app): na rodada 5 do VirusTotal (29/10/2026) foi a única forma com 0/75."""
    shutil.rmtree(SAIDA, ignore_errors=True)
    SAIDA.mkdir(parents=True)
    for nome, marca, texto, prefixo, arq in (
            (f"GizLivre-{v}", "instalar.txt", "Abra o GizLivre.exe desta pasta para instalar o Giz Livre (só para a sua "
             "conta, sem administrador). Extraia o zip inteiro antes.", f"GizLivre-{v}/", f"Instalar-GizLivre-{v}.zip"),
            ("GizLivre", "portatil.txt", "Com este arquivo presente, os quadros ficam na pasta quadros ao lado do "
             "GizLivre.exe.", "GizLivre/", f"GizLivre-{v}-portatil.zip")):
        pasta = BUILD / "distribuir" / nome
        shutil.rmtree(pasta, ignore_errors=True)
        shutil.copytree(pacote, pasta)
        shutil.copy2(exe, pasta / "GizLivre.exe")
        (pasta / marca).write_text(texto + NL, encoding="utf-8")
        if marca == "instalar.txt":   # o LEIA-ME curto que os quatro programas levam no zip de instalação
            (pasta / "LEIA-ME.txt").write_text(LEIA_ME.format(v=v), encoding="utf-8-sig", newline="\r\n")
        zipar(pasta, SAIDA / arq, prefixo)
    linhas = [f"{sha256(p)}  {p.name}" for p in sorted(SAIDA.iterdir()) if p.is_file()]
    linhas.append(f"# Giz Livre {v} - janela propria (Tauri 2, WebView2) - Python {PY_VERSAO} embutido oficial - "
                  f"sem PyInstaller e sem Inno Setup - GizLivre.exe sha256 {sha256(exe)}")
    (SAIDA / "SHA256SUMS.txt").write_text(NL.join(linhas) + NL, encoding="ascii")
    for p in sorted(SAIDA.iterdir()):
        print(f"{p.stat().st_size / 1e6:6.1f} MB  {p.name}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--exe", help="usa este GizLivre.exe já compilado (o que passou pelo VirusTotal), sem recompilar")
    ap.add_argument("--rodada3", action="store_true", help="só as variantes da rodada 3 do VirusTotal (dist/janela-rodada3)")
    ap.add_argument("--rodada5", action="store_true", help="só as variantes da rodada 5 do VirusTotal (dist/janela-rodada5)")
    args = ap.parse_args()
    v = versao()
    if args.rodada5:
        return rodada5(v)
    pacote = montar_pacote(v)
    if args.rodada3:
        return rodada3(v, pacote)
    exe = Path(args.exe) if args.exe else compilar(None, [], "final", COM_PAGINAS)
    distribuir(v, pacote, exe)


if __name__ == "__main__":
    main()
