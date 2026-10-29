// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Teste de ponta a ponta do botão "Baixar e instalar" do Sobre (sem dependências).  Rodar:  node tests/e2e_atualizacao.mjs
// Por quê: na 1.14.2 e 1.14.3 o botão mostrava "quadroAqui is not defined" e não instalava; os testes de unidade não
// clicavam nele. Este sobe um servidor do Giz Livre numa porta livre com dados temporários, abre um quadro no Microsoft
// Edge (sem janela), abre o Sobre pelo menu "…" como o professor e clica em Procurar versão nova e Baixar e instalar.
// O GitHub não é consultado: as duas respostas do servidor (verificar e instalar) são trocadas pelo protocolo de
// depuração, que também guarda o pedido de instalação para conferir que ele leva o quadro aberto. Nada é instalado.
// Rodar antes de toda versão publicada.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
// GIZ_NAVEGADOR=<caminho>: outro navegador Chromium (ex.: o Chrome, num PC em que o Edge está caindo)
const EDGE = [process.env.GIZ_NAVEGADOR, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(c => c && existsSync(c));
const espera = ms => new Promise(r => setTimeout(r, ms));

let ok = 0, falhas = 0;
function conferir(nome, cond, detalhe = '') {
  if (cond) { ok++; console.log(`  ✓ ${nome}`); }
  else { falhas++; console.log(`  ✗ ${nome}${detalhe ? ': ' + detalhe : ''}`); }
  return cond;
}
function portaLivre() {
  return new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
}

const pastaTmp = mkdtempSync(join(tmpdir(), 'giz-e2e-atu-'));
const DADOS = join(pastaTmp, 'dados');
mkdirSync(DADOS);
const PORTA = await portaLivre();
const BASE = `http://127.0.0.1:${PORTA}`;
let servidor, edge, ws, nCdp = 0, token;
const pendentes = new Map(), errosConsole = [], pedidosInstalar = [];

function cdp(method, params = {}) {
  const id = ++nCdp;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pendentes.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
    setTimeout(() => { if (pendentes.delete(id)) rej(new Error('CDP sem resposta: ' + method)); }, 30000);
  });
}
const avaliar = async expr => (await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;
async function esperarAte(expr, ms = 15000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) { const v = await avaliar(expr); if (v) return v; await espera(200); }
  return null;
}
const resposta = obj => Buffer.from(JSON.stringify(obj)).toString('base64');

try {
  console.log('Atualização pelo Sobre, de ponta a ponta');
  if (!EDGE) throw new Error('Microsoft Edge não encontrado');
  servidor = spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' });
  for (let t = 0; t < 100 && !token; t++) {
    try { token = (await (await fetch(BASE + '/api/info')).json()).token; } catch { await espera(100); }
  }
  if (!conferir('o servidor temporário abriu', !!token)) throw new Error('sem servidor');
  const VERSAO = (await (await fetch(BASE + '/api/info')).json()).versao;
  const ID = 'e2eatualiza1';
  const criado = await fetch(BASE + '/api/boards/' + ID, { method: 'PUT', headers: { 'X-Lousa': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: { title: 'Teste da atualização', items: [] }, revision: 0 }) });
  conferir('quadro de teste criado', criado.ok, String(criado.status));

  const portaCdp = await portaLivre();
  edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${portaCdp}`, `--user-data-dir=${join(pastaTmp, 'perfil-edge')}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore' });
  let alvo;
  for (let t = 0; t < 100 && !alvo; t++) {
    try { alvo = (await (await fetch(`http://127.0.0.1:${portaCdp}/json/list`)).json()).find(x => x.type === 'page'); }
    catch { await espera(150); }
  }
  if (!alvo) throw new Error('o Edge não abriu a porta de depuração');
  ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id) { pendentes.get(m.id)?.(m); pendentes.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') errosConsole.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errosConsole.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' '));
    if (m.method === 'Fetch.requestPaused') {
      const { requestId, request } = m.params;
      const corpo = verificar => cdp('Fetch.fulfillRequest', { requestId, responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: resposta(verificar) });
      if (request.url.endsWith('/api/atualizacao/verificar'))
        corpo({ nova: true, atual: VERSAO, ultima: '99.0.0', pode_instalar: true,
          notas: 'Correção.\n- **Item de teste:** primeira linha\n  continuação\n- outro item', pagina: 'https://github.com/HeraldoAntunes/giz-livre/releases/latest' });
      else if (request.url.endsWith('/api/atualizacao/instalar')) { pedidosInstalar.push(request.postData || ''); corpo({ versao: '99.0.0' }); }
      else cdp('Fetch.continueRequest', { requestId });
    }
  };
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Fetch.enable', { patterns: [{ urlPattern: '*/api/atualizacao/*' }] });
  // fechar a janela depois de mandar instalar encerraria o teste: o window.close vira um aviso guardado
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'window.close = () => { window.__fechou = true; };' });
  await cdp('Page.navigate', { url: `${BASE}/#/b/${ID}` });
  conferir('o quadro abriu no Edge', !!await esperarAte(`!!document.getElementById('bMenu') && location.hash === '#/b/${ID}'`));
  await espera(800);
  await avaliar(`[...document.querySelectorAll('button')].find(b => b.dataset.a === 'ok' && b.textContent.trim() === 'Começar')?.click()`);

  // como o professor: menu "…" → Sobre → Procurar versão nova → Baixar e instalar
  await avaliar(`document.getElementById('bMenu').click()`);
  conferir('o menu "…" tem Sobre o Giz Livre', !!await esperarAte(`!!document.querySelector('[data-a="about"]')`));
  await avaliar(`document.querySelector('[data-a="about"]').click()`);
  conferir('o Sobre abriu', !!await esperarAte(`!!document.querySelector('dialog[open] [data-atu]')`));
  await avaliar(`document.querySelector('dialog[open] [data-atu]').click()`);
  conferir('aparece a versão nova com o botão Baixar e instalar', !!await esperarAte(`!!document.querySelector('dialog[open] [data-inst]')`));
  const notas = await avaliar(`document.querySelector('dialog[open] .sb-notas')?.innerHTML || ''`);
  conferir('as notas aparecem formatadas, sem ** nem "- "', /<li><b>Item de teste:<\/b> primeira linha continuação<\/li>/.test(notas) && !notas.includes('**'), notas);
  await avaliar(`document.querySelector('dialog[open] [data-inst]').click()`);
  const fim = await esperarAte(`(() => { const s = document.querySelector('dialog[open] .sb-atu'); return s && (s.querySelector('.sb-ok, .sb-erro') ? s.innerText : ''); })()`);
  conferir('Baixar e instalar chega a "Instalando a versão", sem mensagem de erro', /Instalando a versão 99\.0\.0/.test(fim || '') && !/not defined|erro/i.test(fim || ''), fim);
  conferir('o pedido de instalação saiu uma vez, levando o quadro aberto', pedidosInstalar.length === 1 && JSON.parse(pedidosInstalar[0] || '{}').quadro === ID,
    JSON.stringify(pedidosInstalar));
  conferir('o programa tentou fechar a janela antiga', !!await esperarAte('window.__fechou === true', 5000));
  conferir('console sem erros', errosConsole.length === 0, errosConsole.join(' | '));
} catch (e) {
  falhas++; console.log('  ✗ o teste parou: ' + e.message);
} finally {
  try { ws?.close(); } catch {}
  edge?.kill(); servidor?.kill();
  await espera(800);
  try { rmSync(pastaTmp, { recursive: true, force: true }); } catch {}
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
