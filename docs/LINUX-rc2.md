# Giz Livre 1.16.0-rc.2 no Linux

Validação da candidata **1.16.0-rc.2** (ramo `candidata-1.16.0-rc.2`, commit `0105f8f`) no Linux, em 30/10/2026,
feita enquanto o auditor externo trabalha no Windows. A anterior, da 1.15.2, está no ramo `linux-validacao`
(`docs/LINUX.md`). Nada do programa foi alterado: este ramo só acrescenta este relatório e os testes de `tests/linux/`.
Todos os dados usados são fictícios e ficaram em pastas temporárias.

**Resumo:** a rc.2 passa em tudo o que roda no Linux, com três ressalvas. Os defeitos 1 e 2 da 1.15.2 estão
corrigidos (o 2, com um cuidado: veja abaixo). O defeito 3 continua igual. Os sete cenários da auditoria externa que dão
para repetir no Linux passam. Achei três defeitos novos, todos pequenos e sem perda de quadro salvo
(itens 1 a 3 de "O que falhou").

## Ambiente

Contêiner na nuvem, sem tela; os navegadores rodaram sem janela.

| Item | Versão |
|---|---|
| Distribuição | Ubuntu 24.04.5 LTS (Noble Numbat), x86_64, núcleo 6.18.44 |
| Python | 3.13.17 (padrão do sistema), 3.12.3, 3.11.17 e 3.10.20 (a mínima; instalada pelo `uv`) |
| Node | 22.22.0 |
| Navegador | Chromium 153.0.8010.12 (Chrome for Testing, o do Playwright), sem janela |
| Playwright | 1.63.0 |
| Firefox | não testado (veja "O que não foi testado") |
| Giz Livre | 1.16.0-rc.2, commit `0105f8f9f20bc3dcd4d06d50e67e66fe75b3a084` |

## O que passou

| Teste | Resultado |
|---|---|
| `python -m unittest tests/test_server.py`, em Python 3.13, 3.12, 3.11 e 3.10 | 109 testes: todos passaram, 5 pulados (3 só do Windows, 2 sem `scripts/exportar_publico.py`) |
| `node tests/testes.mjs` (testes da página) | 123 passaram, 0 falharam |
| `node --check` nos 91 arquivos de `app/js/` | sem erro |
| Agentes de IA: `node tests/linux/agente_no_chromium.mjs` (roda o `tests/e2e_agente.mjs` com Chromium no lugar do Edge) | 60 passaram, 0 falharam |
| `GIZ_NAVEGADOR=<chromium> node tests/e2e_atualizacao.mjs` | 11 passaram, 0 falharam |
| `node tests/linux/e2e_linux.mjs chromium`, servidor em Python 3.13 e em 3.10 | 28 passaram, 0 falharam, nas duas |
| `python3 tests/linux/queda_gravacao.py` (SIGKILL no meio da gravação, 20 vezes) | 20 de 20: arquivo sempre legível, com a última gravação confirmada, sem `.tmp` sobrando |
| `python3 tests/linux/auditoria_rc2.py` (cenários da auditoria) | 41 passaram, 1 falhou (o G2, que vai além da auditoria: defeito novo 1) |
| `tests/linux/giz-livre-linux.sh` (launcher da validação anterior) | abre o servidor, cria `~/.local/share/giz-livre/`, chama o Chromium com `--app=http://127.0.0.1:<porta>/?k=<chave>`; a janela troca a chave pelo acesso, a chave sai do endereço e a galeria abre. Abrir de novo com o programa no ar chama o navegador outra vez, com chave nova |

As saídas completas estão em `tests/linux/resultados-rc2-2026-10-30.txt`.

### Roteiro de ponta a ponta (`tests/linux/e2e_linux.mjs`)

É o roteiro da validação anterior, adaptado ao acesso novo da 1.16.0: nenhuma rota de dados responde sem o código
da conta. O teste lê o código no arquivo de conexão (`<dados>/.agente/conexao.json`) e abre cada janela com uma chave
de uso único (`?k=`), como o `server.py` faz no Linux. Tudo pela interface:

1. criar um quadro livre e desenhar dois traços;
2. escrever um texto; inserir a fórmula `v_m = \frac{\Delta s}{\Delta t}` pelo botão Fórmula; desenhar um retângulo e
   uma elipse;
3. esperar "Salvo", conferir o arquivo no disco, fechar a janela, abrir outra e reabrir o quadro (6 itens; a imagem da
   fórmula volta do servidor com o código e **não** sai sem ele: 401);
4. exportar PDF pelo menu;
5. importar um backup fictício pelo **Levar quadros > Trazer** (o zip é feito pelo próprio programa, numa segunda
   pasta) e baixar o **Guardar todos**;
6. matar o servidor com SIGKILL no instante em que o navegador manda gravar um traço; conferir que o arquivo continua
   inteiro; subir o servidor de novo na mesma porta e pasta; e, como o professor faria, abrir o Giz Livre de novo.

### Os três defeitos achados na 1.15.2

1. **Corrigido.** `test_edge_caiu_reabre_no_edge_com_perfil_proprio` agora aparece como pulado fora do Windows
   (`skipped 'Edge do Windows'`), nas quatro versões do Python.
2. **Corrigido, com uma ressalva no Linux** (defeito novo 2). Quando o servidor volta e o professor abre o Giz Livre de
   novo, a página antiga pega o código novo sozinha e grava o traço feito durante a queda: a faixa some, o quadro
   mostra "Salvo" e o traço está no disco, sem recarregar. No Windows quem entrega o cookie novo é a janela própria
   (Tauri), que sobe o servidor de novo sozinha. No Linux não há essa janela: o cookie novo chega quando o professor
   abre o Giz Livre de novo e o navegador abre outra janela no mesmo perfil. Até lá, a página mostra a faixa e continua
   tentando gravar a cada 4 s, sem perder nada, desde que ninguém recarregue a página.
3. **Continua.** O `tests/formas_visual.mjs` aponta os mesmos 10 rótulos fora da caixa da 1.15.2: `nut-colheres`
   (5,1 px), `nut-get` (2,5), `edf-eixos` (1,4), `por-sub-substantivas` (5), `por-estrutura-verbo` (5,8),
   `por-dialogo` (22,4), `por-paragrafo` (2,6), `por-narrador` (4,8), `geo-zonas-termicas` (4,3) e `geo-rio-planta`
   (1,2). A causa provável é a mesma: a página pede "Segoe UI", que não existe no Linux, e aqui entra a Inter, mais
   larga (`fc-match "Segoe UI"` responde Inter).

### Cenários da auditoria externa (`tests/linux/auditoria_rc2.py`)

O script sobe um `server.py` de verdade numa pasta temporária e faz os pedidos pela rede, como a página faz. Os testes
de `tests/test_server.py` da rc.2 já cobrem estes casos por dentro; aqui eles foram repetidos por fora.

| Cenário | Resultado |
|---|---|
| A. Backup com imagem corrompida | **Passa.** Bytes trocados ou arquivo que não é PNG nem JPEG: a imagem é recusada como "imagem danificada", não é gravada, o quadro vem e o aviso diz qual quadro ficou sem imagem. Trazer depois o pacote bom traz a imagem que faltava |
| B. `trazido_de` inválido | **Passa.** Sete formas inválidas (texto, número, lista, nulo, id numérico, sem impressão, aninhado): os quadros vêm e o campo sai. Quadros antigos na pasta com `trazido_de` inválido não atrapalham trazer outro pacote nem a galeria. Trazer o mesmo pacote de novo não cria cópias |
| C. PDF com dimensão NaN ou infinita | **Passa.** 16 casos (NaN, Infinity, -Infinity, 1e999, "NaN" e "inf" como texto, zero, negativo, true, nulo, pixels fracionários, acima de 100000, imagem sem vírgula ou número) recebem 400; a página válida gera o PDF |
| D. ZIP com nomes duplicados | **Passa.** Quadro, manifesto ou imagem repetidos: 400 com "nomes de arquivo duplicados; nada foi trazido", e nada é gravado |
| E. Corpo HTTP menor que o Content-Length | **Passa.** Quadro, pacote, imagem e PDF com envio interrompido: 400 e nada gravado. Um cliente que para de mandar sem fechar a conexão deixa só aquela conexão esperando; o resto do servidor continua respondendo (observação 3) |
| F. Código (token) não ASCII | **Passa.** `é` em latin-1 e em UTF-8, `ÿ`, emoji e o código certo seguido de `é`, no `X-Lousa`, no cookie e no `X-Agente`: escrita 409, leitura 401, agente 403, `/api/info` só com a versão. Nenhum 500, nenhuma conexão cortada, nada gravado |
| G. Restaurações simultâneas | **Passa** o cenário da auditoria: 12 pedidos ao mesmo tempo para a mesma entrada da lixeira dão exatamente um 200 e onze 404; o quadro volta uma vez só. **Falha** um caso a mais (G2): defeito novo 1 |

## O que falhou

### 1. Restaurar ao mesmo tempo duas versões do mesmo quadro às vezes dá 409, e a página mostra "Recarregue"

Nada se perde: quem recebe 409 continua na lixeira e pode ser restaurado de novo. O problema é a mensagem.

Passo a passo:

1. Crie o quadro `rest2`, exclua; crie de novo com o mesmo id e exclua; repita até ter 6 entradas na lixeira
   (`rest2_<data>`, `rest2_<data>-2`...).
2. Mande os 6 `POST /api/lixeira/restaurar` ao mesmo tempo (`python3 tests/linux/auditoria_rc2.py`, cenário G2, que
   faz isso 20 vezes).
3. Em cerca de 3 de cada 20 rodadas, um ou dois pedidos voltam `409 {"erro": "conflito; tente de novo"}`.
4. Na página, `restoreTrash` usa `wfetch`, que trata todo 409 como sessão perdida: mostra a faixa "O Giz Livre foi
   reaberto por outra janela ou cópia. Recarregue esta página para continuar salvando." (conferido no Chromium,
   simulando a resposta 409).

Causa provável: em `_restaurar` (server.py), o id novo é escolhido dentro de `TRAVA_GERAL` só olhando se o arquivo
existe; dois pedidos escolhem o mesmo id antes de qualquer um mover o arquivo, e o segundo cai no
`return 409`. O comentário diz "reserva a trava antes de mover", mas a trava do id só é pega depois de soltar a
`TRAVA_GERAL`. É raro na sala de aula (exige restaurar duas versões do mesmo quadro no mesmo instante), mas o 409
colide com o código de sessão perdida da página.

### 2. Servidor de volta sem janela nova: a faixa manda recarregar, e recarregar perde o traço

Ressalva da correção do defeito 2, só fora da janela própria do Windows (Linux e macOS).

Passo a passo (`RECARREGAR=1 node tests/linux/e2e_linux.mjs chromium`, que falha 3 conferências de propósito):

1. Abra um quadro, desenhe e espere "Salvo".
2. Mate o servidor (`kill -9`) e desenhe mais um traço: a página avisa que não salvou e tenta de novo.
3. Suba o servidor de novo sem abrir janela (`--sem-janela`, ou qualquer outro jeito que não abra o Giz Livre pelo
   atalho no mesmo navegador).
4. A página recebe 409, pede o código novo pelo `/api/info`, mas o cookie é o do servidor que morreu: não recebe o
   código e mostra "O Giz Livre foi reaberto por outra janela ou cópia. Recarregue esta página para continuar
   salvando."
5. Clique em **Recarregar** e confirme a saída: a página volta sem acesso ("Não consegui falar com o programa Giz
   Livre. Abra-o pelo atalho.") e o traço do passo 2 se perdeu. Abrir o Giz Livre de novo depois disso não traz o
   traço de volta, e a página recarregada não se recupera sozinha.

Se, no passo 5, o professor abrir o Giz Livre de novo em vez de recarregar, tudo é gravado (é o caso que passa no
roteiro). Sugestão de texto, não aplicada: no 409 sem código novo, dizer "Abra o Giz Livre de novo pelo atalho: o que
não foi salvo continua nesta página e é salvo sozinho quando ele voltar", como a faixa de programa fechado já diz
(`app/js/main.js`), em vez de "Recarregue".

### 3. Sem `--dados`, o arquivo de conexão vai para `~/AppData/Local` no Linux

Passo a passo: no Linux, `./giz-livre.sh --sem-janela` (o da rc.2, que não passa `--dados`).

O servidor grava `~/AppData/Local/Giz Livre/conexao.json`: `arquivo_conexao()` usa `LOCALAPPDATA` ou, sem ela,
`~/AppData/Local`, que é um caminho do Windows. Funciona (o Giz na Tela e o MCP leem do mesmo lugar), mas cria uma
pasta estranha na pasta pessoal. O esperado no Linux seria algo como `~/.local/state/giz-livre/` ou
`${XDG_DATA_HOME:-~/.local/share}/giz-livre/`. Com o launcher da validação anterior, que sempre passa `--dados`, o
arquivo fica em `~/.local/share/giz-livre/quadros/.agente/conexao.json`.

## Observações

- O `giz-livre.sh` da rc.2 ainda é o simples (grava os quadros em `quadros/` ao lado do programa). O launcher com
  `~/.local/share` e o empacotamento tar.gz estão só no ramo `linux-validacao`. Para não mexer no programa, este ramo
  traz uma cópia do launcher em `tests/linux/giz-livre-linux.sh`, que só muda a pasta do programa para a raiz do
  repositório.
- `tests/e2e_agente.mjs` procura o Edge num caminho fixo do Windows. O `tests/linux/agente_no_chromium.mjs` roda uma
  cópia temporária com o Chromium no lugar, sem mudar o original. Nessa cópia o laço que espera a porta de depuração
  também espera quando a lista de abas ainda vem vazia: o Chromium daqui leva uns 5 s para abrir e o laço original
  esgotava as 100 tentativas de uma vez ("o Edge não abriu a porta de depuração"). Isso é do teste, não do programa.
- O `tests/linux/queda_gravacao.py` e o roteiro de ponta a ponta tiveram de ler o código no arquivo de conexão, porque
  o `/api/info` da 1.16.0 não o entrega mais sem acesso. É a mudança esperada da auditoria de 29/10/2026.
- No cenário E, o cliente parado que desiste e fecha a conexão faz o `socketserver` imprimir um `BrokenPipeError` na
  saída de erro do servidor. Não tem efeito, e o script não conta isso como falha. O servidor não tem tempo limite de
  leitura: uma conexão parada fica esperando para sempre. Só alguém do próprio computador consegue fazer isso.
- Os arquivos dos quadros continuam com permissão `600`.

## O que não foi testado

- **Firefox.** O Firefox do Playwright não baixa neste ambiente (rede fechada para `cdn.playwright.dev` e
  `playwright.download.prss.microsoft.com`). Achei um Firefox 159 no conda-forge, mas rodar um navegador baixado de
  outra origem foi recusado pela permissão do ambiente, como na rodada anterior. Ele foi apagado sem ser executado.
  O roteiro aceita Firefox (`node tests/linux/e2e_linux.mjs firefox`, ou `GIZ_FIREFOX=/caminho/firefox`), mas não foi
  executado.
- A janela própria (Tauri/WebView2), a instalação em troca com reserva, o instalador, o Sobre que atualiza sozinho e
  o servidor que volta sozinho pela janela: tudo isso é só do Windows.
- Outras distribuições (Debian, Fedora, Mint, openSUSE, Arch), ARM, Chromium em snap ou Flatpak, e macOS.
- Navegador com janela de verdade, Wayland ou X11, tela sensível ao toque, mesa digitalizadora e pressão da caneta.
- O encerramento automático depois de 3 min sem janela.
- PowerPoint pelo LibreOffice, reconhecimento de escrita (só Windows), imprimir, Captura e inserir PDF.
- Duas contas no mesmo computador (a parte de privacidade entre contas foi pensada para o Windows; no Linux só foi
  conferido que nada sai sem o código).

## Para repetir

```bash
git fetch origin linux-validacao-rc2 && git checkout linux-validacao-rc2
```

```bash
python3 -m unittest tests/test_server.py -v
```

```bash
node tests/testes.mjs
```

```bash
node tests/linux/agente_no_chromium.mjs
```

```bash
node tests/linux/e2e_linux.mjs chromium
```

```bash
RECARREGAR=1 node tests/linux/e2e_linux.mjs chromium
```

```bash
python3 tests/linux/queda_gravacao.py
```

```bash
python3 tests/linux/auditoria_rc2.py
```

O `e2e_linux.mjs` usa o Playwright (local ou global; `PLAYWRIGHT=pasta` se estiver em outro lugar) e
`PYTHON=caminho` para escolher o Python do servidor. Rodando como root, o Chromium precisa de `--no-sandbox`: o roteiro
e o `agente_no_chromium.mjs` já acrescentam; para o `formas_visual.mjs` e o `e2e_atualizacao.mjs`, aponte
`GIZ_BROWSER` e `GIZ_NAVEGADOR` para um script que chame o Chromium com essa opção.
