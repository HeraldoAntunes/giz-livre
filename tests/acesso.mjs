// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Acesso dos testes ao servidor (desde 29/10/2026, nenhuma rota de dados responde sem o código da conta):
// o código vem do arquivo de conexão (<dados>\.agente\conexao.json com --dados; senão %LOCALAPPDATA%\Giz Livre),
// como o Giz na Tela e o MCP fazem. Versões antigas (até a 1.15) ainda entregavam o código no /api/info.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const espera = ms => new Promise(r => setTimeout(r, ms));

export async function codigo(base, dados = null, ms = 15000) {
  const arq = dados ? join(dados, '.agente', 'conexao.json')
    : join(process.env.LOCALAPPDATA || '', 'Giz Livre', 'conexao.json');
  const fim = Date.now() + ms;
  while (Date.now() < fim) {
    try {
      const c = JSON.parse(readFileSync(arq, 'utf8'));
      if (c.token && base.endsWith(':' + c.porta)) return c.token;
    } catch {}
    try { const i = await (await fetch(base + '/api/info')).json(); if (i.token) return i.token; } catch {}
    await espera(150);
  }
  return '';
}

// entrega o código ao navegador do teste como o cookie que a janela de verdade ganha ao abrir (ver /api/sessao)
export async function entrarNoNavegador(cdp, base, token) {
  const porta = base.split(':').pop();
  await cdp('Network.enable');
  await cdp('Network.setCookie', { name: 'giz' + porta, value: token, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Strict' });
}
