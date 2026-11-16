// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// V1 do pacote 1.18: o conector de agentes importa um PDF e vê a página. Ponta a ponta, sem janela: servidor com dados
// temporários, o conector MCP de verdade (stdio) e o Edge headless no papel do professor que abre o quadro.
// Só arquivos sintéticos (o PDF é gerado aqui). O caminho do PowerPoint fica no test_server.py, com o conversor
// simulado: este teste não abre o PowerPoint do computador.
//   node tests/e2e_agente_importar.mjs [--raiz <pasta de outra versão>]
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigo, entrarNoNavegador } from './acesso.mjs';
import { pastaTemporaria } from './temporario.mjs';

const args = process.argv.slice(2), iR = args.indexOf('--raiz');
const RAIZ = iR >= 0 ? resolve(args[iR + 1]) : join(dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };

// PDF de n páginas (A4 deitado), cada uma com um retângulo de cor própria e o número da página
function pdfSintetico(n) {
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', null, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const kids = [];
  for (let k = 0; k < n; k++) {
    const cor = [(k * 0.3) % 1, 0.4, 1 - (k * 0.25) % 1].map(v => v.toFixed(2)).join(' ');
    const conteudo = `q ${cor} rg 60 60 720 470 re f Q BT /F1 48 Tf 100 300 Td (Pagina ${k + 1}) Tj ET`;
    objs.push(`<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`);
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${objs.length} 0 R >>`);
    kids.push(`${objs.length} 0 R`);
  }
  objs[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${n} >>`;
  let out = '%PDF-1.4\n';
  const pos = [];
  objs.forEach((o, i) => { pos.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + pos.map(p => String(p).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

const tmp = pastaTemporaria('giz-agimp-'), DADOS = join(tmp, 'dados'), ARQS = join(tmp, 'arquivos');
mkdirSync(DADOS, { recursive: true }); mkdirSync(ARQS);
const procs = [];
try {
  const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
  procs.push(spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' }));
  let token = ''; for (let t = 0; t < 150 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(100); } }
  const pagina = async (rota, metodo = 'GET', corpo) => (await fetch(BASE + rota, { method: metodo, headers: { 'X-Lousa': token, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined })).json();
  await pagina('/api/agentes', 'PUT', { ligado: true, nivel: 2 });

  // conector MCP por stdio
  const mcp = spawn('python', [join(RAIZ, 'mcp', 'giz_livre_mcp.py'), '--dados', DADOS, '--porta', String(PORTA)], { stdio: ['pipe', 'pipe', 'pipe'] });
  procs.push(mcp);
  let buf = '', nMsg = 0; const pend = new Map();
  mcp.stdout.setEncoding('utf8');
  mcp.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); if (l.trim()) { const m = JSON.parse(l); pend.get(m.id)?.(m); pend.delete(m.id); } } });
  const rpc = (method, params) => { const id = ++nMsg; mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    return new Promise((res, rej) => { pend.set(id, res); setTimeout(() => pend.delete(id) && rej(new Error('MCP sem resposta')), 120000); }); };
  const ferramenta = async (name, a) => { const r = (await rpc('tools/call', { name, arguments: a })).result;
    return r.isError ? { erro: r.content[0].text } : { dados: r.structuredContent, conteudo: r.content }; };
  await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'teste', version: '1' } });
  const nomes = (await rpc('tools/list', {})).result.tools.map(t => t.name);
  conferir('o conector lista importar_arquivo e ver_pagina', nomes.includes('importar_arquivo') && nomes.includes('ver_pagina'));

  console.log('Importar um PDF');
  const pdf = join(ARQS, 'lista sintética.pdf');
  writeFileSync(pdf, pdfSintetico(3));
  const imp = await ferramenta('importar_arquivo', { caminho: pdf, titulo: 'PDF sintético', paginas: '1,3' });
  conferir('importa o PDF num quadro novo (páginas 1 e 3)', imp.dados?.tipo === 'pdf' && imp.dados.paginas_importadas === 2, JSON.stringify(imp));
  const bid = imp.dados?.quadro;
  const disco = () => JSON.parse(readFileSync(join(DADOS, bid + '.json'), 'utf8'));
  conferir('o quadro guarda o PDF como pendente', disco().items.length === 1 && disco().items[0].gera === 'pdf');
  conferir('o PDF fica guardado no programa', readdirSync(join(DADOS, 'agente-pdf')).length === 1);
  const antes = await ferramenta('ver_pagina', { quadro: bid, pagina: 1 });
  conferir('ver_pagina antes de abrir avisa que falta desenhar', !!antes.dados?.aviso && !antes.conteudo?.some(c => c.type === 'image'), JSON.stringify(antes.dados));

  // recusas no conector (nada do conteúdo de outros arquivos aparece no erro)
  writeFileSync(join(ARQS, 'segredo.txt'), 'senha123');
  writeFileSync(join(ARQS, 'falso.pdf'), 'senha123 não é PDF');
  const r1 = await ferramenta('importar_arquivo', { caminho: join(ARQS, 'segredo.txt') });
  const r2 = await ferramenta('importar_arquivo', { caminho: join(ARQS, 'falso.pdf') });
  const r3 = await ferramenta('importar_arquivo', { caminho: '\\\\servidor\\aulas\\aula.pdf' });
  const r4 = await ferramenta('importar_arquivo', { caminho: 'aula.pdf' });
  conferir('recusa .txt, PDF falso, pasta de rede e caminho incompleto', [r1, r2, r3, r4].every(r => r.erro), JSON.stringify([r1, r2, r3, r4]));
  conferir('e o erro não mostra o conteúdo do arquivo', ![r1, r2].some(r => r.erro.includes('senha123')));

  console.log('O professor abre o quadro');
  const porta = await portaLivre();
  procs.push(spawn(EDGE, ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${join(tmp, 'perfil')}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1600,900', 'about:blank'], { stdio: 'ignore' }));
  let alvo; for (let t = 0; t < 100 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); } }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pc = new Map(), erros = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pc.has(m.id)) { pc.get(m.id)(m); pc.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
  const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params })); return new Promise(res => pc.set(id, m => res(m.result))); };
  const avaliar = async e => (await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }))?.result?.value;
  const ate = async (e, ms = 20000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await avaliar(e).catch(() => false)) return true; await espera(150); } return false; };
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await entrarNoNavegador(cdp, BASE, token);
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('lousa.abas', '{"ocultas":[],"escolhido":true}'); localStorage.setItem('lousa.ajuda', '{"tourVisto":true}'); } catch {}` });
  // fechar antes de terminar: o pendente continua no quadro
  await cdp('Page.navigate', { url: `${BASE}/#/b/${bid}` });
  await ate(`window.__lousa?.S?.id === ${JSON.stringify(bid)}`, 20000);
  await avaliar(`location.hash = '#/'`); await espera(2500);
  conferir('fechar o quadro antes de terminar: nada se perde (o PDF continua pendente)', disco().items.some(i => i.gera === 'pdf'));
  await cdp('Page.navigate', { url: `${BASE}/#/b/${bid}` });
  await ate(`window.__lousa?.S?.id === ${JSON.stringify(bid)}`, 20000);
  const viuAviso = await ate(`!!document.querySelector('.pdf-agente-aviso') || window.__lousa.S.board.layout.count === 2`, 8000);
  conferir('ao abrir, aparece o aviso de que o PDF está sendo desenhado (ou já terminou)', viuAviso);
  conferir('as 2 páginas pedidas entram no quadro', await ate(`window.__lousa.S.board.layout.count === 2 && window.__lousa.S.items.filter(i => i.type === 'image').length === 2 && !window.__lousa.S.items.some(i => i.type === 'pendente')`, 30000),
    JSON.stringify(await avaliar(`({ n: window.__lousa.S.board.layout.count, tipos: window.__lousa.S.items.map(i => i.type) })`)));
  conferir('o tamanho da página vem do PDF (A4 deitado)', await avaliar(`(() => { const L = window.__lousa.S.board.layout; return L.kind === 'custom' && Math.abs(L.w / L.h - 842 / 595) < 0.01; })()`));
  const gravou = async () => { for (let t = 0; t < 60; t++) { try { const b = disco(); if (b.items.filter(i => i.type === 'image').length === 2 && !b.items.some(i => i.type === 'pendente')) return true; } catch {} await espera(250); } return false; };
  conferir('e ficam gravadas no disco', await gravou());
  conferir('o PDF guardado sai depois de desenhado', await (async () => { for (let t = 0; t < 40; t++) { if (!readdirSync(join(DADOS, 'agente-pdf')).length) return true; await espera(250); } return false; })());
  conferir('Ctrl+Z desfaz a importação numa entrada só', await avaliar(`(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })); await new Promise(r => setTimeout(r, 400)); const ok = window.__lousa.S.items.some(i => i.type === 'pendente'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true })); await new Promise(r => setTimeout(r, 400)); return ok && window.__lousa.S.items.filter(i => i.type === 'image').length === 2; })()`));

  console.log('O agente vê a página');
  await espera(3500);   // o aviso periódico conta o quadro como aberto
  const ab = await ferramenta('importar_arquivo', { caminho: pdf, quadro: bid });
  conferir('quadro aberto na tela não recebe páginas', !!ab.erro && ab.erro.includes('aberto'), JSON.stringify(ab));
  const v = await ferramenta('ver_pagina', { quadro: bid, pagina: 2 });
  conferir('ver_pagina devolve a imagem da página e o resumo', v.conteudo?.some(c => c.type === 'image' && c.mimeType === 'image/jpeg' && c.data.length > 1000) && v.dados?.pagina === 2 && !v.dados.imagem, JSON.stringify(v.dados));
  await pagina('/api/agentes', 'PUT', { ligado: true, nivel: 1 });
  const n1 = await ferramenta('importar_arquivo', { caminho: pdf });
  conferir('no nível 1 (só ler), importar é recusado', !!n1.erro);
  conferir('nenhum erro na página', !erros.length, erros.join(' | '));
} catch (e) {
  falhas++; console.log('  ✗ parou:', e.message);
} finally {
  for (const p of procs) { try { p.kill(); } catch {} }
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
