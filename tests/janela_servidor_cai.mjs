// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// O servidor cai com a janela aberta (o pythonw.exe morre) e um traço é feito sem ele: a janela sobe outro servidor na
// mesma porta e entrega o cookie novo; a página pega o código novo sozinha e grava o traço, sem faixa de "Recarregar".
// Antes, o traço só existia na página, e recarregar ou fechar o descartava (validação no Linux, 30/10/2026).
// Perfil do WebView2 de rascunho e quadros temporários; só mexe nos PIDs que abriu.
//   node tests/janela_servidor_cai.mjs <pasta com GizLivre.exe>
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROG = process.argv[2];
if (!PROG || !existsSync(join(PROG, 'GizLivre.exe'))) { console.log('uso: node tests/janela_servidor_cai.mjs <pasta com GizLivre.exe>'); process.exit(2); }
const EXE = join(PROG, 'GizLivre.exe');
const tmp = mkdtempSync(join(tmpdir(), 'giz-cai-')), DADOS = join(tmp, 'quadros'); mkdirSync(DADOS);
// nenhuma caixa na tela do professor: as mensagens do programa vão para este arquivo (GIZ_SEM_CAIXAS)
const CAIXAS = join(tmp, 'caixas.txt'); process.env.GIZ_SEM_CAIXAS = CAIXAS;
const CON = join(DADOS, '.agente', 'conexao.json'), PERFIL = join(tmp, 'perfil');
const PORTA = 8700 + Math.floor(Math.random() * 90), DEPURA = 9500 + Math.floor(Math.random() * 90);
const espera = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };
const vivo = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
async function ate(f, ms, passo = 200) { const fim = Date.now() + ms; while (Date.now() < fim) { const v = await f(); if (v) return v; await espera(passo); } return null; }
const conexao = () => { try { return JSON.parse(readFileSync(CON, 'utf8')); } catch { return null; } };
const paginas = async () => { try { return (await (await fetch(`http://127.0.0.1:${DEPURA}/json/list`)).json()).filter(x => x.type === 'page'); } catch { return []; } };
const api = (rota, op = {}) => fetch(`http://127.0.0.1:${conexao().porta}${rota}`, { ...op, headers: { 'X-Lousa': conexao().token, 'Content-Type': 'application/json', ...(op.headers || {}) } });
const matar = pid => { try { execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' }); } catch {} };
const itens = () => { try { return JSON.parse(readFileSync(join(DADOS, 'cai.json'), 'utf8')).items?.length ?? 0; } catch { return -1; } };

let prog;
try {
  console.log(`Servidor cai com a janela aberta: ${EXE}`);
  prog = spawn(EXE, ['--dados', DADOS, '--porta', String(PORTA)], { stdio: 'ignore', detached: true,
    env: { ...process.env, GIZ_JANELA_DADOS: PERFIL, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${DEPURA}` } });
  const c1 = await ate(conexao, 40000);
  if (!conferir('o programa abriu', !!c1)) throw new Error('sem servidor');
  await api('/api/boards/cai', { method: 'PUT', body: JSON.stringify({ board: { title: 'Cai', items: [] }, revision: 0 }) });
  const pag = await ate(async () => (await paginas()).find(p => p.url.startsWith(`http://127.0.0.1:${c1.porta}/`) && !p.url.includes('?k=')), 30000);
  const ws = new WebSocket(pag.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); { const f = pend.get(m.id); if (typeof f === 'function') f(m); } };
  const cdp = (method, params = {}) => new Promise(r => { const id = ++n; pend.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const avaliar = async e => (await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
  for (let i = 0; i < 12; i++) { await avaliar(`[...document.querySelectorAll('button')].find(b => ['Começar','Pular'].includes(b.textContent.trim()) && b.offsetParent)?.click()`); await espera(300); }
  await avaliar(`location.hash = '#/b/cai'`);
  conferir('o quadro abre', !!await ate(() => avaliar(`!!document.getElementById('bMenu') && location.hash.includes('cai')`), 20000));
  await espera(800);

  // 1) o servidor cai (só o pythonw.exe, como uma queda dele) e um traço é feito sem ele
  matar(c1.pid);
  conferir('o servidor caiu', !!await ate(() => !vivo(c1.pid), 5000));
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 500, y: 400, button: 'left', buttons: 1, clickCount: 1 });
  for (const [x, y] of [[540, 420], [600, 450], [660, 470], [720, 500]]) await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 720, y: 500, button: 'left', buttons: 0, clickCount: 1 });

  // 2) a janela sobe outro servidor na mesma porta, e o traço chega ao arquivo sem recarregar
  const c2 = await ate(() => { const c = conexao(); return c && c.pid !== c1.pid && vivo(c.pid) ? c : null; }, 20000);
  conferir('a janela abriu outro servidor na mesma porta', !!c2 && c2.porta === c1.porta, JSON.stringify(c2));
  conferir('o traço feito sem servidor foi salvo quando ele voltou', !!await ate(() => itens() === 1, 20000), `itens: ${itens()}`);
  conferir('nenhuma faixa de "Recarregar" ficou na tela', await avaliar(`document.getElementById('banner')?.hidden !== false`));
  conferir('a página continua a mesma (não recarregou)', await avaliar(`!!document.getElementById('bMenu') && location.hash.includes('cai')`));
  ws.close();
} catch (e) {
  conferir('o teste rodou até o fim', false, e.message);
} finally {
  if (prog) matar(prog.pid);
  const c = conexao(); if (c && vivo(c.pid)) matar(c.pid);
  if (existsSync(CAIXAS)) conferir('nenhuma mensagem de erro do programa (caixa)', false, readFileSync(CAIXAS, 'utf8').slice(0, 300));
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
await espera(1500);
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
