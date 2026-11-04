# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
"""Gera o changelog do pacote .deb (usr/share/doc/giz-livre/changelog, formato do Debian) a partir do CHANGELOG.md.

Cada seção "## <versão> (<dd/mm/aaaa>)" vira uma entrada (às 12:00; versões do mesmo dia, um minuto a mais cada);
os itens "- " viram "  * ", o texto é quebrado em 78 colunas e o negrito do Markdown sai. Uma seção sem data (versão não publicada) leva a data da seção seguinte que tiver.
Se a versão do pacote não for a primeira do CHANGELOG.md (uma candidata, por exemplo), entra antes uma entrada curta
para ela. Só a biblioteca padrão.

Uso:  python3 -I scripts/linux/changelog_debian.py CHANGELOG.md <versão do pacote> "<Nome <email>>" > changelog
"""
import re
import sys
import textwrap
from datetime import datetime, timezone

DIAS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MESES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def data_rfc(d: datetime, minuto: int = 0) -> str:
    # formato que o Debian pede, em inglês e sem depender da localidade da máquina que monta. O CHANGELOG.md só tem o
    # dia: a hora é fixa (12:00) e cada versão a mais publicada no mesmo dia ganha um minuto, porque o Debian quer
    # cada entrada mais nova que a anterior (a 1.16.3 e a 1.17.0 saíram as duas em 03/11/2026)
    return f"{DIAS[d.weekday()]}, {d.day:02d} {MESES[d.month - 1]} {d.year} 12:{minuto:02d}:00 +0000"


def secoes(texto: str):
    atual = None
    for linha in texto.splitlines():
        m = re.match(r"^## ([0-9][0-9A-Za-z.+~-]*)(.*)$", linha)
        if m:
            if atual:
                yield atual
            d = re.search(r"\((\d{2})/(\d{2})/(\d{4})\)", m.group(2))
            data = datetime(int(d.group(3)), int(d.group(2)), int(d.group(1)), tzinfo=timezone.utc) if d else None
            nota = re.sub(r"^\s*(\([^)]*\))?\s*:?\s*", "", m.group(2)).strip()
            atual = {"versao": m.group(1), "data": data, "linhas": [nota] if nota else []}
        elif atual is not None:
            atual["linhas"].append(linha)
    if atual:
        yield atual


def itens(linhas):
    """Junta as linhas da seção em parágrafos: cada "- " começa um item; o resto é texto solto."""
    out, cur = [], None
    for l in linhas:
        l = l.rstrip()
        if not l.strip():
            cur = None
            continue
        l = re.sub(r"\*\*(.+?)\*\*", r"\1", l).replace("`", "")
        if l.lstrip().startswith("- "):
            cur = [l.lstrip()[2:].strip()]
            out.append(cur)
        elif cur is not None and l.startswith(" "):
            cur.append(l.strip())
        else:
            cur = [l.strip()]
            out.append(cur)
    return [" ".join(p) for p in out]


def main() -> int:
    md, versao, mantenedor = sys.argv[1], sys.argv[2], sys.argv[3]
    lista = list(secoes(open(md, encoding="utf-8").read()))
    for k, s in enumerate(lista):
        if s["data"] is None:
            s["data"] = next((x["data"] for x in lista[k + 1:] if x["data"]), datetime(2026, 1, 1, tzinfo=timezone.utc))
    if not lista or lista[0]["versao"] != versao:
        lista.insert(0, {"versao": versao, "data": lista[0]["data"] if lista else datetime.now(timezone.utc),
                         "linhas": [f"- Pacote de teste da versão {versao}, ainda fora do CHANGELOG.md."]})
    # minuto de cada entrada: 0 para a mais velha de cada dia, 1 para a seguinte do mesmo dia, e assim por diante
    minutos, vistos = {}, {}
    for k in range(len(lista) - 1, -1, -1):
        dia = lista[k]["data"].date()
        minutos[k] = vistos.get(dia, -1) + 1
        vistos[dia] = minutos[k]
    saida = []
    for k, s in enumerate(lista):
        saida.append(f"giz-livre ({s['versao']}) unstable; urgency=medium")
        saida.append("")
        corpo = itens(s["linhas"]) or ["Sem notas."]
        for p in corpo:
            saida.extend(textwrap.wrap(p, 78, initial_indent="  * ", subsequent_indent="    ",
                                       break_long_words=False, break_on_hyphens=False))
        saida.append("")
        saida.append(f" -- {mantenedor}  {data_rfc(s['data'], min(minutos[k], 59))}")
        saida.append("")
    sys.stdout.write("\n".join(saida))
    return 0


if __name__ == "__main__":
    sys.exit(main())
