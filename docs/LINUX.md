# Giz Livre no Linux

> **Situação: experimental, sem suporte.** O Giz Livre é feito e testado no Windows 11. No Linux ele foi validado uma
> vez, em 30/10/2026, num único ambiente (abaixo), sem tela física, sem mesa digitalizadora e sem uso em sala de aula.
> Pode funcionar na sua distribuição, mas nada aqui é promessa de suporte. Faça backup dos seus quadros.

## Como instalar e usar

O programa é um servidor local em Python (só a biblioteca padrão, nada de `pip install`) e a interface abre no
navegador. Precisa de:

- **Python 3.10 ou mais novo** (Debian/Ubuntu: `sudo apt install python3`; Fedora: `sudo dnf install python3`);
- **um navegador**. Com Chrome, Chromium, Edge ou Brave instalado, o Giz Livre abre numa janela própria (modo app). Sem
  nenhum deles, abre no navegador padrão (o Firefox, por exemplo), numa aba comum;
- opcional: **LibreOffice**, para abrir apresentações (.pptx, .odp).

### Pelo pacote tar.gz

O pacote é montado com `sh installer/linux/empacotar.sh` (gera `dist/giz-livre-<versão>-linux.tar.gz` e o `.sha256`).
Ainda **não é publicado** na página de versões.

```bash
tar xzf giz-livre-1.15.2-linux.tar.gz
```

```bash
cd giz-livre-1.15.2-linux
```

```bash
./giz-livre.sh
```

Opcional, para ter o Giz Livre no menu de aplicativos:

```bash
./criar-atalho.sh
```

### Pelo código-fonte

```bash
git clone https://github.com/HeraldoAntunes/giz-livre.git
```

```bash
cd giz-livre && ./giz-livre.sh
```

Opções do `giz-livre.sh` (repassadas ao `server.py`): `--porta 8765`, `--sem-janela` (só o servidor; abra
`http://127.0.0.1:8765/` à mão), `--dados PASTA`, `--sem-auto-encerrar`.

## O que é instalado e onde ficam os dados

- O pacote **não instala nada** fora da pasta descompactada. Não pede senha de administrador.
- `./criar-atalho.sh` cria só dois arquivos, dentro da sua pasta pessoal:
  - `~/.local/share/applications/giz-livre.desktop` (atalho que aponta para o `giz-livre.sh` da pasta);
  - `~/.local/share/icons/hicolor/scalable/apps/giz-livre.svg` (ícone).

  `./criar-atalho.sh --remover` apaga os dois. Se mover a pasta do programa, rode `./criar-atalho.sh` de novo.
- **Quadros:** `~/.local/share/giz-livre/quadros/` (ou `$XDG_DATA_HOME/giz-livre/quadros/`). Cada quadro é um
  arquivo `.json` com a miniatura `.png`; imagens ficam em `quadros/assets/`, e os excluídos em `quadros/lixeira/`.
- **Registro e ajustes:** `~/.local/share/giz-livre/giz-livre.log` e `~/.local/share/giz-livre/preferencias.json`.
- Ordem que o `giz-livre.sh` usa para escolher a pasta dos quadros: `--dados PASTA`; a variável `GIZ_LIVRE_DADOS`;
  `quadros/` ao lado do programa, **se já existir** (era o lugar até a 1.15.2, então quem já usava não perde nada);
  e, por fim, `~/.local/share/giz-livre/quadros/`.
- **Backup:** copie a pasta `~/.local/share/giz-livre` inteira, ou use **Levar quadros → Guardar todos** na galeria.
- **Desinstalar:** `./criar-atalho.sh --remover` (se criou o atalho) e apague a pasta do programa. Os quadros só somem
  se você apagar `~/.local/share/giz-livre`.

## O que foi testado

Ambiente (contêiner na nuvem, sem tela; o navegador rodou sem janela):

| Item | Versão |
|---|---|
| Distribuição | Ubuntu 24.04.5 LTS (Noble Numbat), x86_64, núcleo 6.18 |
| Python | 3.13.17 (a versão da CI) e 3.10.20 (a mínima do README), em venv |
| Node | 22.22.0 |
| Navegador | Chromium 153.0.8010.12 (Chrome for Testing, o do Playwright), sem janela |
| Playwright | 1.63.0 |
| Giz Livre | 1.15.2 (ramo `main` em 30/10/2026) |

| Teste | Resultado |
|---|---|
| `python -m unittest tests/test_server.py` (e pelo pytest) | 74 passaram, 3 pulados (só Windows ou arquivo ausente), **1 falhou** (defeito 1) |
| `node tests/testes.mjs` (testes da página) | 112 passaram, 0 falharam |
| `node --check` em todos os `app/js/**/*.js` | sem erro |
| `node tests/e2e_atualizacao.mjs` com `GIZ_NAVEGADOR` = Chromium | 11 passaram, 0 falharam |
| `node tests/formas_visual.mjs` com `GIZ_BROWSER` = Chromium | 3527 formas e 41 especiais desenhadas; **10 com texto fora da caixa** (defeito 3) |
| `node tests/linux/e2e_linux.mjs chromium` (roteiro abaixo) | 23 passaram, **2 falharam** (defeito 2), com Python 3.13 e com 3.10 |
| `python3 tests/linux/queda_gravacao.py` (SIGKILL no meio da gravação, 20 vezes) | 20 de 20: arquivo sempre legível, com a última gravação confirmada, sem `.tmp` sobrando |
| `giz-livre.sh` com e sem `--sem-janela` | abre o servidor, cria `~/.local/share/giz-livre/`, abre o Chromium com `--app=` |
| `installer/linux/empacotar.sh` e `criar-atalho.sh` | pacote montado, descompactado e aberto; atalho criado e removido |

Roteiro do `tests/linux/e2e_linux.mjs`, todo pela interface e só com dados fictícios: criar um quadro livre e desenhar
dois traços; escrever um texto; inserir a fórmula `v_m = \frac{\Delta s}{\Delta t}` pelo botão Fórmula; desenhar um
retângulo e uma elipse; esperar "Salvo", conferir o arquivo no disco, voltar à galeria, fechar a janela, abrir outra e
reabrir o quadro (6 itens, imagem da fórmula servida de novo); exportar PDF pelo menu; importar um backup fictício pelo
**Levar quadros → Trazer** (o zip é feito pelo próprio programa, numa segunda pasta); **Guardar todos**; e, por fim,
matar o servidor com SIGKILL no instante em que o navegador manda gravar, reabrir o servidor e reabrir o quadro.

Para repetir:

```bash
python3 -m venv .venv
```

```bash
.venv/bin/python -m unittest tests/test_server.py -v
```

```bash
node tests/testes.mjs
```

```bash
PYTHON=.venv/bin/python node tests/linux/e2e_linux.mjs chromium
```

```bash
.venv/bin/python tests/linux/queda_gravacao.py
```

O `e2e_linux.mjs` usa o Playwright (`npm i -D playwright` ou instalado globalmente). Com
`node tests/linux/e2e_linux.mjs firefox` ele usa o Firefox do Playwright, ou um Firefox comum indicado em
`GIZ_FIREFOX=/caminho/firefox` (pelo WebDriver BiDi).

## Defeitos achados (não corrigidos)

### 1. Um teste do servidor só passa no Windows

`FecharJanelaTests.test_edge_caiu_reabre_no_edge_com_perfil_proprio` falha no Linux:
`AssertionError: Lists differ: [(('edge',), True)] != [((), True)]`.

Passo a passo: no Linux, `python3 -m unittest tests/test_server.py -v`.

Causa provável: `Reabridor.__call__` (server.py) só tenta "o mesmo navegador com perfil próprio" quando
`WINDOWS` é verdadeiro; fora do Windows vai direto para "outro navegador". O teste espera o comportamento do Windows e
não tem `skipUnless`, como os outros testes só do Windows. O programa em si não é afetado no Linux: lá `ultima_falha`
não acha relatório de falha do navegador, e o reabridor nunca dispara.

### 2. Traço feito enquanto o servidor estava fora do ar se perde depois que ele volta

O quadro **não** se perde: tudo o que já tinha "Salvo" continua inteiro no disco. Perde-se só o que foi feito depois da
última gravação confirmada.

Passo a passo:

1. Abra um quadro e desenhe algo; espere "Salvo".
2. Encerre o servidor à força (`kill -9 <pid do server.py>`, como numa queda) e desenhe mais um traço. A página mostra
   "Erro ao salvar — tentando de novo".
3. Abra o Giz Livre de novo (`./giz-livre.sh`).
4. A página antiga recebe 409 (o token da sessão mudou) e mostra a faixa "O Giz Livre foi reaberto por outra janela ou
   cópia. Recarregue esta página para continuar salvando." com o botão **Recarregar**.
5. Clique em **Recarregar**: o navegador pergunta se quer sair da página (há alterações não salvas). Confirmando,
   o quadro reabre **sem o traço do passo 2**. Não há outro caminho na tela para salvar esse traço.

Esperado: depois que o servidor volta, a página pega o token novo (como faz ao abrir) e grava o que estava pendente.
Provavelmente acontece igual no Windows (o código é o mesmo), mas lá não foi testado nesta rodada.

### 3. Rótulos de 10 formas passam da caixa com as fontes do Linux

O `tests/formas_visual.mjs` aponta texto fora da caixa em: `nut-colheres`, `nut-get`, `edf-eixos`,
`por-sub-substantivas`, `por-estrutura-verbo`, `por-dialogo` (22 px), `por-paragrafo`, `por-narrador`,
`geo-zonas-termicas` e `geo-rio-planta` (entre 1 e 6 px nas outras).

Passo a passo: no Linux, `GIZ_BROWSER=/caminho/do/chromium node tests/formas_visual.mjs` (rodando como root, o
Chromium precisa de `--no-sandbox`: aponte `GIZ_BROWSER` para um script que o acrescente).

Causa provável: a interface pede "Segoe UI", que não existe no Linux; a fonte que entra no lugar (aqui, Inter) é mais
larga. Não foi conferido se o corte aparece a olho nu.

## Observações

- `tests/e2e_agente.mjs` não roda no Linux: o caminho do Microsoft Edge está fixo no teste (só Windows).
- `tests/formas_visual.mjs` e `tests/e2e_atualizacao.mjs` rodam com Chromium pelas variáveis `GIZ_BROWSER` e
  `GIZ_NAVEGADOR`.
- Os arquivos dos quadros são criados com permissão `600` (só o dono lê), por causa do `tempfile.mkstemp`.

## O que não foi testado

- **Firefox.** O Firefox do Playwright não pôde ser baixado neste ambiente (rede bloqueada para o servidor de
  downloads do Playwright), e rodar um Firefox de outra origem não foi permitido. O roteiro já aceita Firefox
  (`node tests/linux/e2e_linux.mjs firefox`), mas não foi executado.
- Outras distribuições (Debian, Fedora, Linux Mint, openSUSE, Arch), outras arquiteturas (ARM) e o Chromium em snap
  ou Flatpak.
- Navegador com janela de verdade, Wayland ou X11, tela sensível ao toque, **mesa digitalizadora** e pressão da caneta.
- Fechar a janela e o programa se encerrar sozinho (o encerramento automático depois de 3 min sem janela).
- Abrir PowerPoint pelo LibreOffice, reconhecimento de escrita (OCR, só Windows), agentes de IA (MCP) e o
  botão de atualizar (baixa um instalador do Windows).
- Imprimir, captura de tela (Captura) e inserir PDF.
- macOS (o `giz-livre.sh` também serve para ele, mas não foi testado).
