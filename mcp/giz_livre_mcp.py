# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
"""Servidor MCP do Giz Livre (stdio, só biblioteca padrão).

Deixa um agente de IA compatível com MCP criar e preencher quadros no Giz Livre já instalado e aberto. Não abre o
programa nem mexe nos arquivos de quadros: tudo passa pela API local do Giz Livre (rotas /api/agente/*), que valida,
trava e versiona os quadros. Só funciona com "Permitir agentes de IA" ligado no Giz Livre.

Uso:  python mcp/giz_livre_mcp.py [--dados PASTA_DOS_QUADROS] [--porta 8765]
Protocolo: JSON-RPC 2.0, uma mensagem por linha (initialize, tools/list, tools/call, ping).
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

VERSAO = "1.11.0"
PROTOCOLOS = ["2025-06-18", "2025-03-26", "2024-11-05"]
CONGELADO = getattr(sys, "frozen", False)
RAIZ = Path(sys.executable).resolve().parent if CONGELADO else Path(__file__).resolve().parent.parent

INSTRUCOES = (
    "Ferramentas para preparar aulas no Giz Livre (lousa digital offline). O agente cria quadros novos e acrescenta "
    "textos, notas, formas, fórmulas LaTeX e gráficos; não exclui nada. Posições em px (96 por polegada): com "
    "`pagina` (1, 2...), x e y contam a partir do canto da página; sem x/y, o item entra abaixo do último item da "
    "página. Para vários itens no mesmo quadro, prefira adicionar_itens (uma chamada, uma gravação, tudo ou nada) "
    "em vez de uma chamada por item. Notas são para lembretes curtos (de 120 a 600 px de largura, altura de 0,75 a 2 "
    "vezes a largura); texto longo vai em escrever_texto. Quadros abertos na tela não aceitam gravação: peça ao "
    "professor para voltar à galeria. Fórmulas e gráficos aparecem quando o professor abrir o quadro.")

# ---------------- onde estão os quadros e o token de agente ----------------


def pasta_documentos() -> Path:
    try:
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                            r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders") as k:
            return Path(os.path.expandvars(winreg.QueryValueEx(k, "Personal")[0]))
    except Exception:
        return Path.home() / "Documents"


def pastas_candidatas(dados: str | None) -> list:
    """A pasta dada (--dados ou GIZ_LIVRE_DADOS) ou, sem ela, as mesmas que o Giz Livre usa: a cópia portátil ou o
    código-fonte (quadros/ ao lado do programa) e a instalação (Documentos/Giz Livre/quadros)."""
    if dados or os.environ.get("GIZ_LIVRE_DADOS"):
        return [Path(dados or os.environ["GIZ_LIVRE_DADOS"]).resolve()]
    lista = []
    if not CONGELADO or (RAIZ / "portatil.txt").exists():
        lista.append(RAIZ / "quadros")
    lista += [pasta_documentos() / "Giz Livre" / "quadros", pasta_documentos() / "Lousa Digital" / "quadros"]
    return lista


class Falha(Exception):
    """Erro com mensagem pronta para o agente."""


class Cliente:
    def __init__(self, dados: str | None, porta: int):
        self.pastas = pastas_candidatas(dados)
        self.porta = porta

    def token(self) -> str:
        # lido a cada chamada: o professor pode desligar e religar o interruptor (o token muda)
        for p in self.pastas:
            try:
                t = (p / ".agente" / "token").read_text(encoding="utf-8").strip()
            except OSError:
                continue
            if t:
                return t
        raise Falha("Agentes de IA desligados no Giz Livre. Peça ao professor para abrir o Giz Livre e ligar "
                    "\"Permitir agentes de IA\" (menu do quadro ou botão Agentes de IA na galeria).")

    def pedir(self, metodo: str, rota: str, corpo: dict | None = None, consulta: dict | None = None) -> dict:
        url = f"http://127.0.0.1:{self.porta}/api/agente/{rota}"
        if consulta:
            q = {k: v for k, v in consulta.items() if v is not None and v != ""}
            if q:
                url += "?" + urllib.parse.urlencode(q)
        dados = json.dumps(corpo, ensure_ascii=False).encode("utf-8") if corpo is not None else None
        req = urllib.request.Request(url, data=dados, method=metodo, headers={
            "Host": f"127.0.0.1:{self.porta}", "X-Agente": self.token(), "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            with e:
                try:
                    erro = json.loads(e.read().decode("utf-8")).get("erro")
                except Exception:
                    erro = None
            raise Falha(erro or f"o Giz Livre recusou o pedido (HTTP {e.code})")
        except (urllib.error.URLError, OSError):
            raise Falha("O Giz Livre não está aberto. Peça ao professor para abrir o Giz Livre e ligar "
                        "\"Permitir agentes de IA\".")


# ---------------- ferramentas ----------------
COR = {"type": "string", "pattern": "^#[0-9a-fA-F]{6}$", "description": "cor #rrggbb"}
QUADRO = {"type": "string", "description": "id do quadro (de criar_quadro ou listar_quadros)"}
POSICAO = {
    "pagina": {"type": "integer", "minimum": 1, "description": "página (1, 2...); x e y passam a contar do canto dela"},
    "x": {"type": "number", "description": "px a partir da esquerda (vazio: margem esquerda)"},
    "y": {"type": "number", "description": "px a partir do topo (vazio: abaixo do último item da página)"},
}


def ferramenta(nome, descricao, props, obrig=(), leitura=False):
    return {"name": nome, "description": descricao,
            "inputSchema": {"type": "object", "properties": props, "required": list(obrig), "additionalProperties": False},
            "annotations": {"readOnlyHint": leitura, "destructiveHint": False, "idempotentHint": leitura,
                            "openWorldHint": False}}


FERRAMENTAS = [
    ferramenta("estado_giz_livre", "Versão do Giz Livre, nível de permissão escolhido pelo professor e quadros abertos "
               "agora na tela (que não aceitam gravação).", {}, leitura=True),
    ferramenta("listar_quadros", "Lista os quadros da galeria (o editado mais recente primeiro).", {
        "pasta": {"type": "string", "description": "só os quadros desta pasta da galeria"},
        "busca": {"type": "string", "description": "parte do título"},
        "limite": {"type": "integer", "minimum": 1, "maximum": 200}}, leitura=True),
    ferramenta("ler_quadro", "Lê um quadro: páginas, fundo e itens. `resumo` troca pontos e imagens por contagens.", {
        "quadro": QUADRO, "detalhe": {"type": "string", "enum": ["resumo", "completo"]}}, ["quadro"], leitura=True),
    ferramenta("criar_quadro", "Cria um quadro novo na galeria. Formatos: infinito, a4 (retrato), a4l (paisagem), "
               "a3l, s169 (slide 16:9), s43 (slide 4:3).", {
        "titulo": {"type": "string", "minLength": 1, "maxLength": 200},
        "pasta": {"type": "string", "description": "pasta da galeria (ex.: a disciplina)"},
        "formato": {"type": "string", "enum": ["infinito", "a4", "a4l", "a3l", "s169", "s43"]},
        "paginas": {"type": "integer", "minimum": 1, "maximum": 200},
        "fundo": {"type": "object", "properties": {"cor": COR, "padrao": {"type": "string", "description":
                  "folha: none, grid, mm, dots, lines, notebook, cartesian, iso, music..."}}, "additionalProperties": False}},
        ["titulo"]),
    ferramenta("adicionar_pagina", "Acrescenta páginas a um quadro com páginas (no fim ou depois de uma página; "
               "o conteúdo das páginas seguintes desce junto).", {
        "quadro": QUADRO, "quantidade": {"type": "integer", "minimum": 1, "maximum": 50},
        "depois_de": {"type": "integer", "minimum": 0, "description": "0 = antes da primeira; vazio = no fim"}},
        ["quadro"]),
    ferramenta("escrever_texto", "Escreve um texto (quebra de linha com \\n).", {
        "quadro": QUADRO, "texto": {"type": "string", "maxLength": 5000}, **POSICAO,
        "tamanho": {"type": "number", "minimum": 8, "maximum": 200, "description": "px (padrão 28; título ~44)"},
        "cor": COR, "largura": {"type": "number", "description": "largura da caixa em px (padrão: largura útil da página)"},
        "fonte": {"type": "string", "enum": ["Segoe UI", "Arial", "Calibri", "Cambria", "Georgia", "Times New Roman",
                                             "Verdana", "Consolas", "Segoe Script", "Segoe Print", "Ink Free",
                                             "Lucida Handwriting", "Comic Sans MS"]},
        "alinhamento": {"type": "string", "enum": ["esquerda", "centro", "direita", "justificado"]},
        "negrito": {"type": "boolean"}, "italico": {"type": "boolean"}}, ["quadro", "texto"]),
    ferramenta("escrever_nota", "Cola uma nota adesiva com texto.", {
        "quadro": QUADRO, "texto": {"type": "string", "maxLength": 2000}, **POSICAO,
        "cor": {"type": "string", "enum": ["#fff7a8", "#ffd3a6", "#ffc8dd", "#d9c9ff", "#c4e3ff", "#c9f2c7"]},
        "largura": {"type": "number", "minimum": 120, "maximum": 600, "description": "px (padrão 220)"},
        "altura": {"type": "number", "description": "px, de 0,75 a 2 vezes a largura (padrão: igual à largura)"}},
        ["quadro", "texto"]),
    ferramenta("desenhar_forma_geometrica", "Desenha linha, seta, retângulo, elipse ou triângulo no retângulo x, y, w, h "
               "(linha e seta vão de (x, y) até (x+w, y+h)).", {
        "quadro": QUADRO, "tipo": {"type": "string", "enum": ["line", "arrow", "rect", "ellipse", "triangle"]},
        **POSICAO, "w": {"type": "number"}, "h": {"type": "number"}, "cor": COR,
        "espessura": {"type": "number", "minimum": 0.5, "maximum": 40},
        "preenchimento": {"type": ["boolean", "string"], "description": "true (tom claro da cor) ou #rrggbb"},
        "tracejado": {"type": "boolean"}, "seta_dupla": {"type": "boolean"}}, ["quadro", "tipo", "x", "y", "w", "h"]),
    ferramenta("adicionar_itens", "Acrescenta vários itens ao mesmo quadro numa chamada só (até 50), gravados numa "
               "só revisão: ou todos entram, ou nenhum (o erro diz qual item falhou). Cada item tem `tipo` e os "
               "mesmos campos da ferramenta de um item: texto (escrever_texto), nota (escrever_nota), forma "
               "(inserir_forma; `forma` = id da biblioteca), geometria (desenhar_forma_geometrica; aqui `forma` = "
               "line, arrow, rect, ellipse ou triangle), latex (inserir_latex), grafico (desenhar_grafico). Sem x/y, "
               "cada item entra abaixo do anterior.", {
        "quadro": QUADRO,
        "itens": {"type": "array", "minItems": 1, "maxItems": 50, "items": {"type": "object", "properties": {
            "tipo": {"type": "string", "enum": ["texto", "nota", "forma", "geometria", "latex", "grafico"]}},
            "required": ["tipo"]}}}, ["quadro", "itens"]),
    ferramenta("listar_formas", "Procura na biblioteca de formas do Giz Livre (vidrarias, circuitos, fluxogramas, "
               "mapas...). Devolve id, nome, grupo, seção e tamanho natural.", {
        "busca": {"type": "string", "description": "palavras do nome, sem precisar de acento"},
        "grupo": {"type": "string", "description": "id do grupo (ex.: quimica, lab, eletrica)"},
        "limite": {"type": "integer", "minimum": 1, "maximum": 100}}, leitura=True),
    ferramenta("inserir_forma", "Insere uma forma da biblioteca (id de listar_formas).", {
        "quadro": QUADRO, "forma": {"type": "string"}, **POSICAO,
        "escala": {"type": "number", "minimum": 0.1, "maximum": 10}, "cor": COR}, ["quadro", "forma"]),
    ferramenta("inserir_latex", "Insere uma fórmula LaTeX (KaTeX; \\ce{} não é aceito). Aparece quando o professor "
               "abrir o quadro; fórmula inválida vira texto vermelho com o código.", {
        "quadro": QUADRO, "latex": {"type": "string", "maxLength": 2000}, **POSICAO,
        "tamanho": {"type": "number", "minimum": 8, "maximum": 200, "description": "px (padrão 40)"}, "cor": COR},
        ["quadro", "latex"]),
    ferramenta("listar_modelos", "Modelos de função prontos para desenhar_grafico (por área), com parâmetros.", {
        "area": {"type": "string"}}, leitura=True),
    ferramenta("desenhar_grafico", "Plota y = f(x) com eixos numerados, no retângulo x, y, w, h. Use `funcao` "
               "(x, + - * / ^, sen, cos, tg, raiz, abs, ln, log, exp, pi, e; vírgula decimal vale) ou `modelo` "
               "com `parametros`. Aparece quando o professor abrir o quadro.", {
        "quadro": QUADRO, "funcao": {"type": "string", "maxLength": 200},
        "modelo": {"type": "string"}, "parametros": {"type": "object", "additionalProperties": {"type": "number"}},
        "x_min": {"type": "number"}, "x_max": {"type": "number"}, "y_min": {"type": "number"}, "y_max": {"type": "number"},
        "eixos": {"type": "boolean"}, "rotulo": {"type": "boolean", "description": "escrever \"y = ...\" ao lado"},
        **POSICAO, "w": {"type": "number"}, "h": {"type": "number"}, "cor": COR}, ["quadro"]),
]
NOMES = {f["name"] for f in FERRAMENTAS}
TIPO_ITEM = {"escrever_texto": "texto", "escrever_nota": "nota", "desenhar_forma_geometrica": "geometria",
             "inserir_forma": "forma", "inserir_latex": "latex", "desenhar_grafico": "grafico"}


def executar(cli: Cliente, nome: str, a: dict) -> dict:
    if nome == "estado_giz_livre":
        return cli.pedir("GET", "estado")
    if nome == "listar_quadros":
        return cli.pedir("GET", "quadros", consulta={k: a.get(k) for k in ("pasta", "busca", "limite")})
    if nome == "listar_formas":
        return cli.pedir("GET", "formas", consulta={k: a.get(k) for k in ("busca", "grupo", "limite")})
    if nome == "listar_modelos":
        return cli.pedir("GET", "modelos", consulta={"area": a.get("area")})
    if nome == "criar_quadro":
        return cli.pedir("POST", "quadros", a)
    q = a.get("quadro")
    if not isinstance(q, str) or not q:
        raise Falha("quadro: obrigatório (id de criar_quadro ou listar_quadros)")
    q = urllib.parse.quote(q, safe="")
    if nome == "ler_quadro":
        return cli.pedir("GET", f"quadros/{q}", consulta={"detalhe": a.get("detalhe")})
    if nome == "adicionar_itens":
        itens = a.get("itens")
        if not isinstance(itens, list) or not 1 <= len(itens) <= 50 or not all(isinstance(i, dict) for i in itens):
            raise Falha("itens: lista com 1 a 50 itens, cada um com `tipo`")
        tipos = set(TIPO_ITEM.values())
        for n, i in enumerate(itens, 1):
            if i.get("tipo") not in tipos:
                raise Falha(f"item {n}: tipo deve ser um destes: {', '.join(sorted(tipos))}")
        return cli.pedir("POST", f"quadros/{q}/itens", {"itens": itens})
    if nome == "adicionar_pagina":
        return cli.pedir("POST", f"quadros/{q}/paginas", {k: v for k, v in a.items() if k != "quadro"})
    spec = {k: v for k, v in a.items() if k != "quadro"}
    if nome == "desenhar_forma_geometrica":
        spec["forma"] = spec.pop("tipo", None)   # no servidor, `tipo` é o tipo do item
    spec["tipo"] = TIPO_ITEM[nome]
    return cli.pedir("POST", f"quadros/{q}/itens", {"itens": [spec]})


# ---------------- JSON-RPC por stdio ----------------
def responder(saida, msg: dict) -> None:
    saida.write(json.dumps(msg, ensure_ascii=False).encode("utf-8") + b"\n")
    saida.flush()


def tratar(cli: Cliente, msg) -> dict | None:
    if not isinstance(msg, dict) or msg.get("jsonrpc") != "2.0" or not isinstance(msg.get("method"), str):
        return {"jsonrpc": "2.0", "id": msg.get("id") if isinstance(msg, dict) else None,
                "error": {"code": -32600, "message": "pedido JSON-RPC inválido"}}
    metodo, mid, params = msg["method"], msg.get("id"), msg.get("params") or {}
    if "id" not in msg:   # notificação (ex.: notifications/initialized): sem resposta
        return None
    ok = lambda r: {"jsonrpc": "2.0", "id": mid, "result": r}
    if metodo == "initialize":
        pedido = params.get("protocolVersion") if isinstance(params, dict) else None
        return ok({"protocolVersion": pedido if pedido in PROTOCOLOS else PROTOCOLOS[0],
                   "capabilities": {"tools": {"listChanged": False}},
                   "serverInfo": {"name": "giz-livre", "title": "Giz Livre", "version": VERSAO},
                   "instructions": INSTRUCOES})
    if metodo == "ping":
        return ok({})
    if metodo == "tools/list":
        return ok({"tools": FERRAMENTAS})
    if metodo == "tools/call":
        nome = params.get("name") if isinstance(params, dict) else None
        args = (params.get("arguments") or {}) if isinstance(params, dict) else {}
        if nome not in NOMES or not isinstance(args, dict):
            return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32602, "message": f"ferramenta desconhecida: {nome}"}}
        try:
            r = executar(cli, nome, args)
            return ok({"content": [{"type": "text", "text": json.dumps(r, ensure_ascii=False)}],
                       "structuredContent": r, "isError": False})
        except Falha as e:
            return ok({"content": [{"type": "text", "text": str(e)}], "isError": True})
    return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"método não suportado: {metodo}"}}


def main():
    ap = argparse.ArgumentParser(description="Servidor MCP do Giz Livre (stdio)")
    ap.add_argument("--dados", help="pasta dos quadros do Giz Livre (padrão: a mesma do programa)")
    ap.add_argument("--porta", type=int, default=int(os.environ.get("GIZ_LIVRE_PORTA") or 8765))
    args = ap.parse_args()
    cli = Cliente(args.dados, args.porta)
    entrada, saida = sys.stdin.buffer, sys.stdout.buffer
    for linha in entrada:
        if not linha.strip():
            continue
        try:
            msg = json.loads(linha.decode("utf-8"))
        except ValueError:
            responder(saida, {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "JSON inválido"}})
            continue
        lote = msg if isinstance(msg, list) else [msg]
        respostas = [r for r in (tratar(cli, m) for m in lote) if r is not None]
        if respostas:
            responder(saida, respostas if isinstance(msg, list) else respostas[0])


if __name__ == "__main__":
    main()
