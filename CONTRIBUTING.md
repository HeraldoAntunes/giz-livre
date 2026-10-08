# Como contribuir

Obrigado pelo interesse! O Giz Livre é software livre (MIT), feito para professores.

- **Relatar um problema:** abra uma *issue* com a versão, o Windows, a mesa digitalizadora (se houver), o passo a passo e,
  se possível, um print. Problemas de segurança vão pelo caminho descrito em [SECURITY.md](SECURITY.md).
- **Propor uma melhoria:** descreva a situação de aula que ela resolve.
- **Enviar código:**
  1. Sem dependências novas, sem build e sem frameworks: JavaScript puro no navegador e Python só com biblioteca padrão.
  2. Os itens do quadro são **imutáveis** (cada edição cria um objeto novo). O desfazer depende disso.
  3. Teste com `python server.py --sem-janela --porta 8799 --dados <pasta-temporária>`, para não mexer nos seus quadros.
  4. Antes do *pull request*, rode `node --check` nos arquivos JS alterados.
  5. Textos da interface em português do Brasil, com acentuação correta.

Ao contribuir, você concorda em licenciar a sua contribuição sob a licença MIT do projeto.
