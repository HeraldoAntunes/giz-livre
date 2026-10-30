// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Teste de ponta a ponta dos agentes de IA (sem dependências).  Rodar:  node tests/e2e_agente.mjs [--manter] [--visivel]
// Sobe um servidor do Giz Livre numa porta livre com dados temporários (nunca a 8765 do programa instalado nem a
// 8799 do navegador de teste), liga o interruptor como a página faz, conversa com o servidor MCP por stdio como um
// cliente de verdade e abre os quadros no Microsoft Edge (sem janela) pelo protocolo de depuração, para conferir que
// fórmulas, gráficos e formas aparecem, que o console fica limpo e que as travas (desligado, níveis, quadro aberto)
// funcionam. Capturas de tela e o relatório ficam na pasta indicada no fim; --manter guarda também os dados.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigo, entrarNoNavegador } from './acesso.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANTER = process.argv.includes('--manter');
const VISIVEL = process.argv.includes('--visivel');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));

// ---------------- relatório ----------------
let ok = 0, falhas = 0;
const linhas = [];
function conferir(nome, cond, detalhe = '') {
  if (cond) { ok++; linhas.push(`  ✓ ${nome}`); console.log(`  ✓ ${nome}`); }
  else { falhas++; const l = `  ✗ ${nome}${detalhe ? ': ' + detalhe : ''}`; linhas.push(l); console.log(l); }
  return cond;
}
function etapa(t) { linhas.push('', t); console.log('\n' + t); }

function portaLivre() {
  return new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
}

// ---------------- servidor do Giz Livre ----------------
const pastaTmp = mkdtempSync(join(tmpdir(), 'giz-e2e-'));
const DADOS = join(pastaTmp, 'dados');
const SAIDA = join(pastaTmp, 'saida');
mkdirSync(DADOS); mkdirSync(SAIDA);
const PORTA = await portaLivre();
const BASE = `http://127.0.0.1:${PORTA}`;
let servidor, mcp, edge, tokenPagina;

async function pagina(rota, metodo = 'GET', corpo) {
  const r = await fetch(BASE + rota, { method: metodo, headers: { 'X-Lousa': tokenPagina, 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo) });
  let dados; try { dados = await r.json(); } catch { dados = null; }
  return { status: r.status, dados };
}
const lerArquivo = id => JSON.parse(readFileSync(join(DADOS, id + '.json'), 'utf8'));
const tokenAgenteExiste = () => existsSync(join(DADOS, '.agente', 'token'));

// ---------------- cliente MCP por stdio ----------------
let nMsg = 0, bufMcp = '';
const pendentesMcp = new Map();
function iniciarMcp() {
  mcp = spawn('python', [join(RAIZ, 'mcp', 'giz_livre_mcp.py'), '--dados', DADOS, '--porta', String(PORTA)],
    { stdio: ['pipe', 'pipe', 'pipe'] });
  mcp.stdout.setEncoding('utf8');
  mcp.stdout.on('data', d => {
    bufMcp += d;
    let i;
    while ((i = bufMcp.indexOf('\n')) >= 0) {
      const l = bufMcp.slice(0, i); bufMcp = bufMcp.slice(i + 1);
      if (!l.trim()) continue;
      const m = JSON.parse(l);
      pendentesMcp.get(m.id)?.(m); pendentesMcp.delete(m.id);
    }
  });
}
function rpc(method, params, notificacao = false) {
  const msg = { jsonrpc: '2.0', method, ...(notificacao ? {} : { id: ++nMsg }), ...(params ? { params } : {}) };
  mcp.stdin.write(JSON.stringify(msg) + '\n');
  if (notificacao) return Promise.resolve(null);
  return new Promise((res, rej) => {
    pendentesMcp.set(msg.id, res);
    setTimeout(() => { if (pendentesMcp.delete(msg.id)) rej(new Error('MCP sem resposta: ' + method)); }, 30000);
  });
}
// devolve {erro, dados}: erro é o texto da recusa (isError) ou null
async function ferramenta(name, args = {}) {
  const r = await rpc('tools/call', { name, arguments: args });
  if (r.error) return { erro: r.error.message, dados: null };
  const txt = r.result.content[0].text;
  return r.result.isError ? { erro: txt, dados: null } : { erro: null, dados: JSON.parse(txt) };
}

// ---------------- Edge pelo protocolo de depuração ----------------
let ws, nCdp = 0;
const pendentesCdp = new Map(), errosConsole = [];
async function iniciarEdge() {
  const portaCdp = await portaLivre();
  edge = spawn(EDGE, [...(VISIVEL ? [] : ['--headless=new']), `--remote-debugging-port=${portaCdp}`,
    `--user-data-dir=${join(pastaTmp, 'perfil-edge')}`, '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore' });
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
    if (m.id) { pendentesCdp.get(m.id)?.(m); pendentesCdp.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') errosConsole.push('exceção: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
      errosConsole.push('console.error: ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || ''))
      errosConsole.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
  };
  await cdp('Runtime.enable'); await cdp('Log.enable'); await cdp('Page.enable');
  await entrarNoNavegador(cdp, BASE, tokenPagina);
}
function cdp(method, params = {}) {
  const id = ++nCdp;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pendentesCdp.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
    setTimeout(() => { if (pendentesCdp.delete(id)) rej(new Error('CDP sem resposta: ' + method)); }, 30000);
  });
}
async function avaliar(expr) {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  return r.result?.value;
}
async function irPara(hash) {
  await avaliar(`location.hash = ${JSON.stringify(hash)}`);
}
async function capturar(nome) {
  // perfil novo do Edge: a escolha das áreas da primeira abertura cobre o quadro; aceita o padrão antes da foto
  await avaliar(`[...document.querySelectorAll('button')].find(b => b.dataset.a === 'ok' && b.textContent.trim() === 'Começar')?.click()`);
  await espera(600);
  const r = await cdp('Page.captureScreenshot', { format: 'png' });
  const arq = join(SAIDA, nome + '.png');
  writeFileSync(arq, Buffer.from(r.data, 'base64'));
  return arq;
}
// espera o arquivo do quadro ficar sem itens pendentes (o editor troca e salva ao abrir)
async function esperarHidratar(id, ms = 60000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) {
    const b = lerArquivo(id);
    if (!b.items.some(i => i.type === 'pendente')) return b;
    await espera(500);
  }
  return lerArquivo(id);
}

// =====================================================================
try {
  etapa('1. Servidor e interruptor');
  servidor = spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--porta', String(PORTA), '--dados', DADOS],
    { stdio: 'ignore' });
  for (let t = 0; t < 100 && !tokenPagina; t++) {
    try { tokenPagina = await codigo(BASE, DADOS); } catch { await espera(100); }
  }
  if (!conferir('o servidor temporário abriu (porta ' + PORTA + ')', !!tokenPagina)) throw new Error('sem servidor');
  const ag0 = await pagina('/api/agentes');
  conferir('agentes vêm desligados por padrão', ag0.status === 200 && ag0.dados.ligado === false, JSON.stringify(ag0.dados));
  conferir('sem interruptor ligado não existe token de agente', !tokenAgenteExiste());

  etapa('2. MCP com os agentes desligados');
  iniciarMcp();
  const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'e2e', version: '1' } });
  await rpc('notifications/initialized', null, true);
  const VERSAO = readFileSync(join(RAIZ, 'app', 'js', 'version.js'), 'utf8').match(/VERSION = '([\d.]+)'/)[1];
  conferir('initialize responde com o nome e a versão do Giz Livre',
    init.result?.serverInfo?.name === 'giz-livre' && init.result.serverInfo.version === VERSAO, JSON.stringify(init.result?.serverInfo));
  const desl = await ferramenta('estado_giz_livre');
  conferir('desligado: a ferramenta recusa com instrução clara', desl.erro && /Permitir agentes de IA/.test(desl.erro), desl.erro);

  etapa('3. Ligar (nível 2) e conferir as ferramentas');
  const lig = await pagina('/api/agentes', 'PUT', { ligado: true });
  conferir('ligar pela página usa o nível 2', lig.status === 200 && lig.dados.nivel === 2, JSON.stringify(lig.dados));
  conferir('ligar cria o token de agente', tokenAgenteExiste());
  const lista = (await rpc('tools/list')).result.tools;
  conferir('tools/list traz as ferramentas esperadas', ['estado_giz_livre', 'listar_quadros', 'ler_quadro', 'criar_quadro',
    'adicionar_pagina', 'escrever_texto', 'escrever_nota', 'desenhar_forma_geometrica', 'adicionar_itens', 'listar_formas',
    'inserir_forma', 'inserir_latex', 'listar_modelos', 'desenhar_grafico'].every(n => lista.some(t => t.name === n)),
    lista.map(t => t.name).join(', '));
  conferir('toda ferramenta tem descrição e esquema de entrada',
    lista.every(t => t.description?.length > 10 && t.inputSchema?.type === 'object'));
  conferir('nenhuma ferramenta apaga nada', !lista.some(t => /apagar|excluir|remover|delete/i.test(t.name)));
  const est = await ferramenta('estado_giz_livre');
  conferir('estado: versão e nível', !est.erro && est.dados.versao === VERSAO && est.dados.nivel === 2, est.erro || JSON.stringify(est.dados));

  etapa('4. Aula de decantação montada pelo agente');
  const cq = await ferramenta('criar_quadro', { titulo: 'Decantação: teste de ponta a ponta', pasta: 'Teste do agente',
    formato: 'a4', paginas: 3 });
  conferir('criar_quadro (A4, 3 páginas)', !cq.erro, cq.erro);
  const AULA = cq.dados?.quadro;
  const passos = [
    ['escrever_texto', { quadro: AULA, texto: 'Decantação', tamanho: 44, negrito: true, alinhamento: 'centro' }],
    ['escrever_texto', { quadro: AULA, texto: 'Acentos e símbolos: ação, coração, µ, ρ, ≤, ∑, °C, m³/h, 😀' }],
    ['escrever_nota', { quadro: AULA, texto: 'Lembrar: tempo de detenção de 2 a 4 h', cor: '#c4e3ff' }],
    ['desenhar_forma_geometrica', { quadro: AULA, tipo: 'rect', x: 60, y: 520, w: 300, h: 120, cor: '#1f6feb', preenchimento: true }],
    ['desenhar_forma_geometrica', { quadro: AULA, tipo: 'arrow', x: 380, y: 580, w: 150, h: 0, cor: '#c0392b', espessura: 4 }],
    ['desenhar_forma_geometrica', { quadro: AULA, tipo: 'line', x: 60, y: 660, w: 470, h: 0, tracejado: true }],
    ['desenhar_forma_geometrica', { quadro: AULA, tipo: 'ellipse', x: 560, y: 520, w: 120, h: 120 }],
    ['desenhar_forma_geometrica', { quadro: AULA, tipo: 'triangle', x: 560, y: 660, w: 120, h: 90 }],
    ['inserir_latex', { quadro: AULA, latex: 'v_s = \\frac{g\\,(\\rho_p - \\rho_w)\\,d^2}{18\\,\\mu}', pagina: 2, tamanho: 48 }],
    ['inserir_latex', { quadro: AULA, latex: 'q_A = \\frac{Q}{A} \\quad [\\mathrm{m^3/m^2\\cdot d}]', pagina: 2 }],
    ['inserir_latex', { quadro: AULA, latex: '\\frac{1}{', pagina: 2 }],   // inválida de propósito: deve virar texto vermelho
    ['desenhar_grafico', { quadro: AULA, funcao: '0,5x^2', x_min: 0, x_max: 10, rotulo: true, pagina: 3 }],
  ];
  for (const [nome, args] of passos) {
    const r = await ferramenta(nome, args);
    conferir(`${nome}${args.latex ? ' ' + args.latex.slice(0, 18) : args.tipo ? ' ' + args.tipo : ''}`, !r.erro, r.erro);
  }
  const busca = await ferramenta('listar_formas', { busca: 'decantador', limite: 5 });
  const forma = busca.dados?.formas?.[0] || (await ferramenta('listar_formas', { busca: 'tanque', limite: 1 })).dados?.formas?.[0];
  conferir('listar_formas acha uma forma de tratamento de água', !!forma, busca.erro);
  if (forma) {
    const r = await ferramenta('inserir_forma', { quadro: AULA, forma: forma.id, pagina: 3, x: 60, y: 600 });
    conferir(`inserir_forma ${forma.id}`, !r.erro, r.erro);
  }
  const modelos = (await ferramenta('listar_modelos')).dados?.modelos || [];
  conferir('listar_modelos devolve os modelos', modelos.length > 0, String(modelos.length));
  const lote = await ferramenta('adicionar_itens', { quadro: AULA, itens: [
    { tipo: 'texto', texto: 'Resumo em lote', pagina: 3 },
    { tipo: 'latex', latex: 't_d = \\frac{V}{Q}', pagina: 3 },
    { tipo: 'grafico', modelo: modelos[0]?.id, pagina: 3 },
    { tipo: 'nota', texto: 'Item de lote', pagina: 3 }] });
  conferir('adicionar_itens grava 4 itens numa revisão', !lote.erro && lote.dados.itens_criados.length === 4, lote.erro);
  const tudoOuNada = await ferramenta('adicionar_itens', { quadro: AULA, itens: [{ tipo: 'texto', texto: 'ok' }, { tipo: 'latex' }] });
  const revAntes = lerArquivo(AULA)._rev;
  conferir('lote com item ruim é recusado inteiro', !!tudoOuNada.erro && lerArquivo(AULA)._rev === revAntes, tudoOuNada.erro);
  const lido = await ferramenta('ler_quadro', { quadro: AULA, detalhe: 'resumo' });
  conferir('ler_quadro devolve o quadro', !lido.erro && lido.dados.n_itens >= 17, lido.erro || String(lido.dados?.n_itens));

  etapa('5. Todos os modelos de gráfico e todas as formas da biblioteca');
  const cm = await ferramenta('criar_quadro', { titulo: 'Todos os modelos de gráfico', pasta: 'Teste do agente' });
  const MODELOS = cm.dados?.quadro;
  let recusasModelo = [];
  for (let i = 0; i < modelos.length; i += 50) {
    const r = await ferramenta('adicionar_itens', { quadro: MODELOS, itens: modelos.slice(i, i + 50).map(m => ({ tipo: 'grafico', modelo: m.id })) });
    if (r.erro) recusasModelo.push(r.erro);
  }
  conferir(`os ${modelos.length} modelos entram num quadro`, !recusasModelo.length, recusasModelo.join(' | '));
  const indice = JSON.parse(readFileSync(join(RAIZ, 'app', 'shapes-index.json'), 'utf8'));
  const grupos = [...new Set(indice.formas.map(f => f.grupo))];
  const quadrosGrupo = [], recusasForma = [];
  for (const g of grupos) {
    const ids = indice.formas.filter(f => f.grupo === g).map(f => f.id);
    const viaMcp = await ferramenta('listar_formas', { grupo: g, limite: 100 });
    if (viaMcp.erro || !viaMcp.dados.formas.every(f => ids.includes(f.id))) recusasForma.push(`${g}: listar_formas divergiu do índice`);
    const q = (await ferramenta('criar_quadro', { titulo: 'Formas: ' + g, pasta: 'Teste do agente' })).dados?.quadro;
    quadrosGrupo.push([g, q, ids.length]);
    for (let i = 0; i < ids.length; i += 50) {
      const r = await ferramenta('adicionar_itens', { quadro: q, itens: ids.slice(i, i + 50).map(id => ({ tipo: 'forma', forma: id })) });
      if (r.erro) recusasForma.push(`${g} (lote ${i / 50 + 1}): ${r.erro}`);
    }
  }
  conferir(`as ${indice.formas.length} formas de ${grupos.length} grupos entram pelo MCP`, !recusasForma.length,
    recusasForma.slice(0, 5).join(' | ') + (recusasForma.length > 5 ? ` (+${recusasForma.length - 5})` : ''));

  etapa('6. Níveis de permissão');
  const { status: stP } = await pagina('/api/boards/quadro-do-professor', 'PUT', { board: { title: 'Do professor', items: [] } });
  conferir('a página cria um quadro do professor', stP === 200);
  let r = await ferramenta('escrever_texto', { quadro: 'quadro-do-professor', texto: 'intruso' });
  conferir('nível 2 não mexe em quadro do professor', !!r.erro && /nível 3/.test(r.erro), r.erro);
  await pagina('/api/agentes', 'PUT', { ligado: true, nivel: 1 });
  r = await ferramenta('criar_quadro', { titulo: 'não pode' });
  conferir('nível 1 só lê: criar_quadro recusado', !!r.erro, r.erro);
  r = await ferramenta('listar_quadros');
  conferir('nível 1 ainda lista quadros', !r.erro, r.erro);
  await pagina('/api/agentes', 'PUT', { ligado: true, nivel: 3 });
  r = await ferramenta('escrever_texto', { quadro: 'quadro-do-professor', texto: 'Escrito pelo agente no nível 3' });
  conferir('nível 3 edita quadro fechado do professor', !r.erro, r.erro);

  etapa('7. Os quadros abertos no Edge');
  if (!EDGE) { conferir('Microsoft Edge encontrado', false, 'instale o Edge para a parte do navegador'); throw new Error('sem Edge'); }
  await iniciarEdge();
  await cdp('Page.navigate', { url: BASE + '/' });
  await espera(2500);
  // perfil novo: a galeria pergunta as áreas das formas na primeira abertura; aceita o padrão
  await avaliar(`[...document.querySelectorAll('button')].find(b => b.dataset.a === 'ok' && b.textContent.trim() === 'Começar')?.click()`);
  await espera(500);
  conferir('a galeria tem o botão "Agentes de IA"', await avaliar(`!!document.getElementById('gAgentes')`));
  conferir('a galeria mostra a pasta que o agente criou', await avaliar(`document.body.innerText.includes('Teste do agente')`));
  await irPara('#/p/' + encodeURIComponent('Teste do agente'));
  await espera(1500);
  conferir('dentro da pasta, o quadro do agente aparece com o selo "agente de IA"',
    await avaliar(`[...document.querySelectorAll('.card')].some(c => c.innerText.includes('Decantação: teste de ponta a ponta') && c.innerText.includes('agente de IA'))`));
  conferir('quadro sem miniatura não pede imagem inexistente',
    await avaliar(`[...document.querySelectorAll('.card .thumb')].every(t => !t.style.backgroundImage)`));
  conferir('nada de erro no console na galeria', !errosConsole.length, errosConsole.slice(0, 3).join(' | '));
  errosConsole.length = 0;
  const nPendentesAntes = { total: lerArquivo(AULA).items.length };
  await irPara('#/b/' + AULA);
  const aula = await esperarHidratar(AULA);
  await espera(1500);
  const tipos = aula.items.map(i => i.type);
  conferir('aula: nenhum item ficou pendente', !tipos.includes('pendente'), tipos.join(','));
  const formulas = aula.items.filter(i => i.latex);
  conferir('aula: as 3 fórmulas válidas viraram imagem', formulas.filter(i => i.type === 'image' && i.src).length >= 3,
    formulas.map(i => i.type).join(','));
  conferir('aula: a fórmula inválida virou texto vermelho com o código',
    aula.items.some(i => i.type === 'text' && i.agente_erro && i.text.includes('\\frac{1}{')));
  // cada gráfico vira eixos, curva e rótulos: o quadro ganha itens, e o único erro é a fórmula inválida
  conferir('aula: os 2 gráficos foram desenhados', aula.items.length > nPendentesAntes.total &&
    aula.items.filter(i => i.agente_erro).length === 1, `${nPendentesAntes.total} → ${aula.items.length} itens; erros: ` +
    aula.items.filter(i => i.agente_erro).map(i => i.text).join(' | '));
  conferir('aula: o texto com acentos e emoji chegou intacto', aula.items.some(i => i.text?.includes('coração, µ, ρ, ≤, ∑, °C, m³/h, 😀')));
  {  // fluxo de caderno: depois de montadas as fórmulas e os gráficos, nada atravessa o fim de uma página
    const L = aula.layout, passo = L.h + L.gap;
    const fora = aula.items.filter(i => typeof i.y === 'number' && typeof i.h === 'number')
      .filter(i => i.y + i.h - Math.floor(i.y / passo) * passo > L.h + 1);
    conferir(`aula: nenhum item passa do fim da página (${L.count} páginas)`, !fora.length,
      fora.map(i => `${i.type} em y=${Math.round(i.y)}`).join(', '));
  }
  console.log('    captura: ' + await capturar('1-aula-pagina1'));
  for (const [n, nome] of [[1, '2-aula-pagina2'], [2, '3-aula-pagina3']]) {   // rola o quadro com a roda do mouse
    await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 690, y: 450, deltaX: 0, deltaY: 790 });
    await espera(800);
    console.log('    captura: ' + await capturar(nome));
  }

  etapa('8. Trava do quadro aberto');
  await avaliar(`fetch('/api/info').then(r => r.json()).then(i => fetch('/api/ping', { method: 'POST', headers: { 'X-Lousa': i.token, 'Content-Type': 'application/json' }, body: JSON.stringify({ janela: 'e2e-extra', quadro: ${JSON.stringify(AULA)} }) }))`);
  r = await ferramenta('escrever_texto', { quadro: AULA, texto: 'não pode entrar' });
  conferir('com o quadro aberto o agente não grava', !!r.erro && /aberto/.test(r.erro), r.erro);
  const estAberto = await ferramenta('estado_giz_livre');
  conferir('estado mostra o quadro aberto', estAberto.dados?.quadros_abertos?.includes(AULA), JSON.stringify(estAberto.dados?.quadros_abertos));
  await irPara('#/');
  await espera(1500);
  conferir('abrir e fechar o quadro gera a miniatura dele', existsSync(join(DADOS, AULA + '.png')));
  await pagina('/api/ping', 'POST', { janela: 'e2e-extra', quadro: null });
  r = await ferramenta('escrever_texto', { quadro: AULA, texto: 'Depois de fechar' });
  conferir('fechado o quadro, o agente volta a gravar', !r.erro, r.erro);

  etapa('9. Desfazer não apaga o que o agente trouxe');
  await irPara('#/b/' + AULA);
  await espera(2500);
  const nAntes = lerArquivo(AULA).items.length;
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'z', code: 'KeyZ', modifiers: 2, windowsVirtualKeyCode: 90 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'z', code: 'KeyZ', modifiers: 2, windowsVirtualKeyCode: 90 });
  await espera(3000);
  await irPara('#/');
  await espera(2000);
  conferir('Ctrl+Z logo após abrir não some com os itens do agente', lerArquivo(AULA).items.length === nAntes,
    `${nAntes} → ${lerArquivo(AULA).items.length}`);

  etapa('10. Modelos de gráfico e formas renderizados');
  await irPara('#/b/' + MODELOS);
  const mod = await esperarHidratar(MODELOS);
  await espera(1500);
  conferir(`modelos: nenhum dos ${modelos.length} ficou pendente`, !mod.items.some(i => i.type === 'pendente'));
  const errosModelo = mod.items.filter(i => i.agente_erro);
  conferir('modelos: nenhum virou erro', !errosModelo.length, errosModelo.map(i => i.text).slice(0, 3).join(' | '));
  console.log('    captura: ' + await capturar('4-modelos'));
  const gruposComErro = [];
  for (const [g, q, n] of quadrosGrupo) {
    const antes = errosConsole.length;
    await irPara('#/b/' + q);
    const b = await esperarHidratar(q, 30000);
    await espera(700);
    if (b.items.length !== n || b.items.some(i => i.type === 'pendente' || i.agente_erro) || errosConsole.length > antes)
      gruposComErro.push(`${g} (${b.items.length}/${n} itens${errosConsole.length > antes ? ', erro no console' : ''})`);
    if (g === 'saneamento' || g === 'lab') console.log('    captura: ' + await capturar('5-formas-' + g));
  }
  await irPara('#/');
  await espera(1000);
  conferir(`as formas dos ${quadrosGrupo.length} grupos abrem sem erro`, !gruposComErro.length, gruposComErro.slice(0, 6).join(' | '));
  conferir('console do navegador limpo durante o teste', !errosConsole.length, errosConsole.slice(0, 5).join(' | '));

  etapa('11. Desligar no meio da conversa');
  await pagina('/api/agentes', 'PUT', { ligado: false });
  conferir('desligar apaga o token na hora', !tokenAgenteExiste());
  r = await ferramenta('listar_quadros');
  conferir('o MCP continua vivo e explica a recusa', !!r.erro && /Permitir agentes de IA/.test(r.erro), r.erro);
  const log = existsSync(join(DADOS, '.agente', 'registro.log')) ? readFileSync(join(DADOS, '.agente', 'registro.log'), 'utf8') : '';
  conferir('o registro anota as ações sem o conteúdo', log.includes('criar_quadro') && !log.includes('coração'));
} catch (e) {
  conferir('o teste rodou até o fim', false, e.stack || String(e));
} finally {
  try { ws?.close(); } catch {}
  try { edge?.kill(); } catch {}
  try { mcp?.stdin.end(); } catch {}
  try { if (tokenPagina) await pagina('/api/sair', 'POST', {}); } catch {}
  await espera(1000);
  try { servidor?.kill(); } catch {}
  writeFileSync(join(SAIDA, 'relatorio.txt'), [`Teste de ponta a ponta dos agentes, ${new Date().toLocaleString('pt-BR')}`,
    ...linhas, '', `${ok} passaram, ${falhas} falharam`].join('\n'), 'utf8');
  console.log(`\n${ok} passaram, ${falhas} falharam`);
  console.log('Capturas e relatório: ' + SAIDA + (MANTER ? '\nDados mantidos em: ' + DADOS : ''));
  await espera(500);
  // a pasta temporária inteira sai no fim, também com falha (--manter para guardar as capturas e os dados)
  if (!MANTER) { try { rmSync(pastaTmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + pastaTmp); } }
  process.exit(falhas ? 1 : 0);
}
