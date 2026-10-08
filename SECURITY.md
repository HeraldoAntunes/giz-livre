# Segurança e privacidade

## Como o Giz Livre protege o computador e os dados
- **Funciona offline.** Não tem telemetria, contas ou anúncios, e o programa não envia nada para a internet. Ao importar um
  arquivo `.lousa`, imagens apontando para endereços externos são descartadas, para que um arquivo recebido não "avise" um
  servidor de fora.
- **Servidor só local.** O programa escuta apenas em `127.0.0.1`, inacessível pela rede, e:
  - recusa `Host` diferente de `127.0.0.1`/`localhost` na porta dele, o que bloqueia *DNS rebinding*;
  - **bloqueia pedidos de outros sites (CSRF):** todo pedido que altera dados precisa do token secreto da sessão (cabeçalho
    `X-Lousa`), gerado a cada abertura e conhecido só pela página do próprio Giz Livre. Pedidos com `Origin` ou
    `Sec-Fetch-Site` de outro site são recusados;
  - envia `Content-Security-Policy` restritiva (só código do próprio programa, sem `eval`), `X-Frame-Options: DENY` e
    `nosniff`.
- **Limites contra abuso.** O tamanho do envio é limitado por tipo de pedido (de 64 KB a 300 MB). As conversões pesadas
  (PowerPoint, reconhecimento de escrita) têm limite de execuções simultâneas e de tempo. Imagens que nenhum quadro usa há
  mais de 7 dias são apagadas sozinhas.
- **Validação de entrada.** Identificadores sem `..` nem caminhos e JSON validado (rejeita `NaN`/`Infinity`) antes de
  gravar. O título é sempre texto.
- **PowerPoint com cautela:**
  - só aceita `.pptx`/`.ppsx` (ZIP), recusa apresentações com macros e arquivos antigos ou protegidos por senha;
  - abre com macros desligadas à força (`AutomationSecurity = ForceDisable`), em modo somente leitura, sem janela, com o
    arquivo marcado como vindo da internet;
  - fecha o PowerPoint se ele travar e tiver sido aberto pelo Giz Livre.
- **PDF:** lido pelo pdf.js 4.10.38 (posterior à correção do CVE-2024-4367), com `isEvalSupported: false`.
- **Gravação segura.** Cada quadro é gravado em arquivo temporário e depois trocado de forma atômica, com uma trava por quadro.
  "Excluir" só move o quadro para `quadros/lixeira/`.
- **Troca de cópia segura.** Se outro Giz Livre estiver aberto, ele é fechado pelo próprio canal autenticado. Um programa
  desconhecido na mesma porta **nunca** é encerrado: aparece um aviso.
- **Executável conferível.**
  - Cada versão vem com `SHA256SUMS.txt`.
  - O executável é gerado sem compactadores (UPX), a partir de dependências de build fixadas por hash, e é verificado no
    Microsoft Defender antes da publicação.

## Aviso sobre antivírus
Programas gerados com PyInstaller e sem assinatura digital paga podem receber alertas falsos de alguns antivírus ou do
SmartScreen ("editor desconhecido"). Antes de instalar, compare o SHA-256 do arquivo baixado com o publicado. Se preferir,
rode o Giz Livre direto do código-fonte (`python server.py`), sem executável nenhum.

## Como relatar uma vulnerabilidade
Abra um aviso privado em **Security → Report a vulnerability** no repositório do GitHub, ou uma *issue* sem detalhes que
permitam explorar a falha. Informe a versão, o passo a passo e o impacto. Correções de segurança têm prioridade.
