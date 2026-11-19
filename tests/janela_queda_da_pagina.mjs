// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// D9 (b), com a janela de verdade: o processo da página do WebView2 é derrubado pelo PID (como o STATUS_ACCESS_VIOLATION
// de 19/11/2026). A janela tem de recarregar a página sozinha, com o aviso de "?caiu=1" e o quadro igual ao do disco.
// Uma segunda queda em menos de 1 minuto não recarrega: fica a página de erro do WebView2, com o botão Recarregar.
// ABRE JANELA NA TELA: só no notebook de testes ou na VM, ou com o SIM do professor. Dados, perfil e porta próprios,
// numa pasta de rodada; só um quadro sintético. Fecha o programa deste teste pelo PID no fim.
//   node janela_queda_da_pagina.mjs <pasta com GizLivre.exe> <pasta da rodada>
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [PROG, RODADA] = process.argv.slice(2);
const DADOS = join(RODADA, 'dados'), SAIDA = join(RODADA, 'saida'), PERFIL = join(RODADA, 'perfil');
for (const d of [DADOS, SAIDA, PERFIL]) mkdirSync(d, { recursive: true });
const PORTA = 8931, DEPURA = 9531, BASE = `http://127.0.0.1:${PORTA}`;
const espera = ms => new Promise(r => setTimeout(r, ms));
const R = { inicio: new Date().toISOString(), conferencias: [] };
const conferir = (n, c, d = '') => { R.conferencias.push({ n, ok: !!c, d: c ? '' : String(d).slice(0, 300) }); console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); };
const gravar = () => writeFileSync(join(SAIDA, 'resultado.json'), JSON.stringify(R, null, 1));
const LOG = join(process.env.LOCALAPPDATA || '', 'Giz Livre', 'janela.log');
const logAntes = existsSync(LOG) ? readFileSync(LOG, 'utf8').length : 0;
const logNovo = () => existsSync(LOG) ? readFileSync(LOG, 'utf8').slice(logAntes) : '';
async function ate(f, ms) { const fim = Date.now() + ms; while (Date.now() < fim) { try { const v = await f(); if (v) return v; } catch {} await espera(250); } return null; }

let prog = null;
const alvos = async () => (await (await fetch(`http://127.0.0.1:${DEPURA}/json/list`)).json());
function conectar(url) {
  const ws = new WebSocket(url); let n = 0; const pend = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++n; pend.set(id, m => m.error ? rej(new Error(m.error.message)) : res(m.result)); ws.send(JSON.stringify({ id, method, params })); setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error('sem resposta: ' + method))), 15000); });
  return new Promise((res, rej) => { ws.onopen = () => res({ ws, cdp, avaliar: async e => (await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.value }); ws.onerror = rej; });
}
// a tela inteira, pelo Windows (a tarefa roda na sessão da conta de testes): vale também com a página morta
function foto(_c, nome) {
  const arq = join(SAIDA, nome + '.png').replace(/'/g, "''");
  try { execFileSync('powershell', ['-NoProfile', '-Command', `Add-Type -AssemblyName System.Windows.Forms,System.Drawing; $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $i = New-Object System.Drawing.Bitmap $b.Width, $b.Height; $g = [System.Drawing.Graphics]::FromImage($i); $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size); $i.Save('${arq}')`], { stdio: 'ignore', timeout: 20000 }); }
  catch (e) { R['foto_' + nome] = e.message; }
}
async function renderers() {
  const v = await (await fetch(`http://127.0.0.1:${DEPURA}/json/version`)).json();
  const b = await conectar(v.webSocketDebuggerUrl);
  const info = await b.cdp('SystemInfo.getProcessInfo');
  b.ws.close();
  return info.processInfo.filter(p => p.type === 'renderer').map(p => p.id);
}
const matar = pid => { try { execFileSync('taskkill', ['/PID', String(pid), '/F'], { stdio: 'ignore' }); return true; } catch { return false; } };
const paginaDoQuadro = async () => (await alvos()).find(t => t.type === 'page' && t.url.startsWith(BASE));

try {
  prog = spawn(join(PROG, 'GizLivre.exe'), ['--dados', DADOS, '--porta', String(PORTA)], { stdio: 'ignore', detached: true,
    env: { ...process.env, GIZ_SEM_CAIXAS: join(SAIDA, 'caixas.txt'), GIZ_JANELA_DADOS: PERFIL, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${DEPURA}` } });
  const token = await ate(() => JSON.parse(readFileSync(join(DADOS, '.agente', 'conexao.json'), 'utf8')).token, 40000);
  conferir('o programa abriu (servidor com código)', !!token);
  const quadro = { version: 2, title: 'Quadro sintético da queda', background: { color: '#ffffff', pattern: 'none' }, view: null,
    layout: { mode: 'pages', kind: 's169', w: 1280, h: 720, gap: 48, count: 3 },
    items: [{ id: 't1', type: 'text', x: 120, y: 120, w: 900, text: 'Quadro sintético: teste da queda da página', size: 48, color: '#0f6cbd' },
      { id: 's1', type: 'stroke', pts: [200, 400, .5, 400, 450, .5, 600, 400, .5, 800, 470, .5], width: 6, color: '#c50f1f' }] };
  const r = await fetch(BASE + '/api/boards/qd9', { method: 'PUT', headers: { 'X-Lousa': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ board: quadro, revision: 0, criar: true }) });
  conferir('quadro sintético criado', r.ok, r.status);
  let alvo = await ate(paginaDoQuadro, 40000);
  let c = await conectar(alvo.webSocketDebuggerUrl);
  // perfil novo: a pergunta das áreas das formas e o passeio da primeira vez ficam por cima; aceita o padrão
  await ate(() => c.avaliar(`document.readyState === 'complete'`), 15000);
  await espera(1500);
  await c.avaliar(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Começar')?.click(); try { localStorage.setItem('lousa.ajuda', '{"tourVisto":true}'); } catch {}`);
  await espera(500);
  await c.avaliar(`location.hash = '#/b/qd9'`);
  const abriu = await ate(() => c.avaliar(`window.__lousa?.S?.id === 'qd9'`), 20000);
  conferir('o quadro abriu na janela', !!abriu);
  await espera(1500); await foto(c, '1-antes-da-queda');
  const disco = JSON.parse(readFileSync(join(DADOS, 'qd9.json'), 'utf8'));
  c.ws.close();

  // 1ª queda: o processo da página sai
  const r1 = await renderers();
  R.renderers1 = r1;
  conferir('achou o processo da página', r1.length >= 1, JSON.stringify(r1));
  r1.forEach(matar);
  const t1 = Date.now();
  const voltou = await ate(async () => { const a = await paginaDoQuadro(); if (!a) return null; const k = await conectar(a.webSocketDebuggerUrl);
    const ok = await k.avaliar(`window.__lousa?.S?.id === 'qd9' && document.getElementById('toast')?.textContent.includes('caiu e foi reaberta') ? 1 : 0`).catch(() => 0);
    if (ok) return k; k.ws.close(); return null; }, 30000);
  R.recargaMs = voltou ? Date.now() - t1 : null;
  conferir(`a página voltou sozinha, com o aviso (${R.recargaMs} ms)`, !!voltou);
  if (voltou) {
    await foto(voltou, '2-depois-da-1a-queda');
    const itens = await voltou.avaliar(`JSON.stringify(window.__lousa.S.items.map(i => i.id).sort())`);
    conferir('o quadro reaberto é o do disco', itens === JSON.stringify(disco.items.map(i => i.id).sort()), itens);
    conferir('a marca ?caiu=1 saiu do endereço', !(await voltou.avaliar('location.search')).includes('caiu'));
    voltou.ws.close();
  }
  conferir('janela.log: a queda e a recarga anotadas', /falhou \(tipo 1\)/.test(logNovo()) && /recarregada sozinha/.test(logNovo()), logNovo());

  // 2ª queda em menos de 1 minuto: não recarrega
  await espera(2000);
  const r2 = await renderers();
  r2.forEach(matar);
  await espera(8000);
  const a2 = await paginaDoQuadro().catch(() => null);
  let semRecarga = true;
  if (a2) { const k = await conectar(a2.webSocketDebuggerUrl).catch(() => null); if (k) { semRecarga = !(await k.avaliar(`!!window.__lousa?.S`).catch(() => false)); k.ws.close(); } }
  const todos = await alvos().catch(() => []);
  R.alvosDepois2 = todos.map(t => ({ type: t.type, url: t.url.slice(0, 60) }));
  const erro = todos.find(t => t.type === 'page');
  if (erro) { const k = await conectar(erro.webSocketDebuggerUrl).catch(() => null); if (k) { await foto(k, '3-depois-da-2a-queda'); k.ws.close(); } }
  conferir('na 2ª queda em menos de 1 minuto, nada de recarga automática', semRecarga);
  conferir('janela.log: "caiu de novo em menos de 1 minuto"', /caiu de novo em menos de 1 minuto/.test(logNovo()), logNovo());
  conferir('nenhuma caixa de mensagem do programa', !existsSync(join(SAIDA, 'caixas.txt')) || !readFileSync(join(SAIDA, 'caixas.txt'), 'utf8').trim());
} catch (e) {
  conferir('o teste rodou até o fim', false, e.stack);
} finally {
  R.janelaLog = logNovo().slice(-2000);
  if (prog?.pid) { try { execFileSync('taskkill', ['/PID', String(prog.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {} }
  R.fim = new Date().toISOString();
  gravar();
  writeFileSync(join(SAIDA, 'pronto.txt'), 'ok');
}
