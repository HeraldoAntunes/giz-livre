<!-- Giz Livre · © 2026 Heraldo Antunes · SPDX-License-Identifier: MIT -->
# Segurança e privacidade

## Como o Giz Livre protege o computador e os dados
- **Funciona offline.** Os quadros são gravados no computador. O Giz Livre não tem telemetria, contas ou anúncios.
- **Janela WebView2.** O componente da Microsoft pode abrir conexão própria com a Microsoft. O programa reduz alguns
  gatilhos dessas conexões, mas isso não garante ausência de tráfego.
- **Atualização só quando você pede.** Procurar versão nova consulta o GitHub por HTTPS. Só endereços do GitHub são
  aceitos, inclusive nos redirecionamentos. Se você pedir para baixar e instalar, o programa baixa o zip e confere
  o SHA-256 publicado antes de instalar. Os quadros não são enviados nessas consultas.
- **Arquivos recebidos.** Ao importar um `.lousa`, imagens com endereços externos são descartadas. Assim, a importação
  não busca essas imagens em servidores de fora.
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
- **PowerPoint com cautela (no Windows, pelo PowerPoint; em qualquer sistema, pelo LibreOffice sem macros e com perfil
  temporário próprio):**
  - aceita `.pptx`, `.ppsx` e `.potx`, o `.ppt`/`.pps` antigo (aberto com as macros desligadas), `.odp`/`.otp` e o
    Keynote `.key` (só pelo LibreOffice); recusa `.pptm` e qualquer apresentação com macros; arquivo protegido por senha
    não converte e a página avisa; um zip que descompactaria demais (mais de 1,5 GB ou 50 vezes o tamanho, acima de
    100 MB) é recusado antes da conversão;
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
  - Cada anexo da release vem com uma assinatura do Sigstore (`<arquivo>.sigstore.json`), feita pelo workflow
    `assinar-release.yml` deste repositório. Ela confirma que o arquivo é o mesmo publicado na release. Para conferir
    (com o [cosign](https://docs.sigstore.dev/cosign/system_config/installation/)):
    `cosign verify-blob --bundle <arquivo>.sigstore.json --certificate-identity-regexp "^https://github.com/HeraldoAntunes/giz-livre/.github/workflows/assinar-release.yml@" --certificate-oidc-issuer https://token.actions.githubusercontent.com <arquivo>`
  - Desde a 1.16.0, o programa é uma janela própria (Tauri 2 com o WebView2 do Windows) que roda o servidor no Python
    embutido oficial do python.org (sem PyInstaller e sem Inno Setup). O exe é montado sem compressão e cada versão passa,
    antes de publicar, pelo Microsoft Defender no PC do mantenedor e pelo VirusTotal (zero alertas nos arquivos
    publicados). O CI do GitHub não roda o Defender.

## Aviso sobre antivírus
Programas gerados com PyInstaller e sem assinatura digital paga podem receber alertas falsos de alguns antivírus ou do
SmartScreen ("editor desconhecido"). Antes de instalar, compare o SHA-256 do arquivo baixado com o publicado. Se preferir,
rode o Giz Livre direto do código-fonte (`python server.py`), sem executável nenhum.

## Versões com suporte
Só a versão mais recente recebe correções de segurança. A versão instalada pode ser conferida em **Sobre**, e a nova é
oferecida em **Sobre → Procurar versão nova**.

## Como relatar uma vulnerabilidade
Não abra uma *issue* pública com os detalhes da falha. Use o aviso privado do GitHub:
<https://github.com/HeraldoAntunes/giz-livre/security/advisories/new>
(no repositório, **Security → Report a vulnerability**). Informe a versão, o passo a passo para reproduzir e o impacto.

O que esperar:
- confirmação de recebimento em até 7 dias;
- avaliação e plano de correção em até 30 dias;
- a correção sai numa versão nova, com a falha descrita no CHANGELOG e no aviso de segurança publicado depois da
  correção (divulgação coordenada). Quem relatou recebe crédito, se quiser.

Correções de segurança têm prioridade sobre qualquer outro trabalho no projeto.
