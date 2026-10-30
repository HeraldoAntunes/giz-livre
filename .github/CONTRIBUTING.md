# Como contribuir

Obrigado pelo interesse! O Giz Livre é software livre (MIT), feito para professores.

- **Relatar um problema:** abra uma *issue* com a versão, o Windows, a mesa digitalizadora (se houver), o passo a passo e,
  se possível, um print. Problemas de segurança vão pelo caminho descrito em [SECURITY.md](SECURITY.md).
- **Propor uma melhoria:** descreva a situação de aula que ela resolve.
- **Enviar código:**
  1. Sem dependências novas e sem frameworks: a lousa (`app/`) é JavaScript puro, sem build, e o servidor
     (`server.py`) usa só a biblioteca padrão do Python. A janela própria do Windows (`janela/`) é em Rust (Tauri 2,
     WebView2) e é a única parte com build: `cargo build --locked --release` em `janela/`; o pacote para distribuir sai
     de `python scripts/montar_janela.py`. Dependência nova do Rust só com motivo forte, e o `Cargo.lock` vai junto.
  2. Os itens do quadro são **imutáveis** (cada edição cria um objeto novo). O desfazer depende disso.
  3. Teste com `python server.py --sem-janela --porta 8799 --dados <pasta-temporária>`, para não mexer nos seus quadros.
  4. Antes do *pull request*, rode `node tests/testes.mjs` e `python -m unittest tests/test_server.py` (todos devem
     passar) e `node --check` nos arquivos JS alterados; mexeu em `janela/`, rode também `cargo test --locked` lá.
     Mudança de comportamento vem com teste que falha sem ela. Para entender o código, leia `docs/ARQUITETURA.md`.
  5. Textos da interface em português do Brasil, com acentuação correta.

Ao contribuir, você concorda em licenciar a sua contribuição sob a licença MIT do projeto e em seguir o
[Código de Conduta](CODE_OF_CONDUCT.md).

## Uso de IA generativa

Assistentes de programação de IA podem ser usados como ferramenta, inclusive pelo autor do projeto. A regra segue a
prática de projetos como o kernel do Linux:

- **A responsabilidade é de quem envia.** A pessoa revisa e entende todo o código, confere que nada foi copiado de
  fonte com licença incompatível com a MIT e responde pela contribuição. A IA não é autora nem coautora.
- **Declare o uso no commit**, com a linha final `Assisted-by: <ferramenta>:<modelo>`, por exemplo
  `Assisted-by: Claude:claude-opus-5-5`. Não use `Co-authored-by` para ferramentas: ele é reservado a pessoas.
- **Diga no *pull request*** o que a ferramenta fez e o que foi verificado (testes rodados, comportamento conferido).
  Relato de falha encontrado com ajuda de IA precisa de passo a passo que reproduza o problema.
