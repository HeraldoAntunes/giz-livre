// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Fechar a janela própria (P60) com a gravação lenta ou falhando (auditoria de 29/10/2026, rodada 2):
//   1) gravação que demora 8 s (disco lento): fechar pelo X espera a gravação e o traço fica salvo
//      (antes, a janela fechava aos 5 s e o traço se perdia);
//   2) gravação que falha: a página pergunta antes de fechar; "não" deixa a janela aberta; "sim" fecha;
//   3) cliques repetidos no X enquanto grava: um pedido só, e fecha uma vez.
// Perfil do WebView2 de rascunho e quadros temporários; só fecha o que abriu, pelo PID.
//   node tests/janela_fechar.mjs <pasta com GizLivre.exe>
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROG = process.argv[2], EXE = join(PROG, 'GizLivre.exe');
const tmp = mkdtempSync(join(tmpdir(), 'giz-fechar-')), DADOS = join(tmp, 'quadros'); mkdirSync(DADOS);
// nenhuma caixa na tela do professor: as mensagens do programa vão para este arquivo (GIZ_SEM_CAIXAS)
const CAIXAS = join(tmp, 'caixas.txt'); process.env.GIZ_SEM_CAIXAS = CAIXAS;
const CON = join(DADOS, '.agente', 'conexao.json');
const PORTA = 8500 + Math.floor(Math.random() * 90), DEPURA = 9200 + Math.floor(Math.random() * 90);
const espera = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };
const vivo = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
async function ate(f, ms) { const fim = Date.now() + ms; while (Date.now() < fim) { const v = await f(); if (v) return v; await espera(250); } return null; }
const ps = cmd => execFileSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8' }).trim();
const conexao = () => { try { return JSON.parse(readFileSync(CON, 'utf8')); } catch { return null; } };
const itens = id => { try { return JSON.parse(readFileSync(join(DADOS, `${id}.json`), 'utf8')).items.length; } catch { return -1; } };
const abrir = () => spawn(EXE, ['--dados', DADOS, '--porta', String(PORTA)], { stdio: 'ignore', detached: true,
  env: { ...process.env, GIZ_JANELA_DADOS: join(tmp, 'perfil'), WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${DEPURA}` } });
const fechar = pid => ps(`Add-Type -Namespace W -Name U -MemberDefinition '[DllImport("user32.dll")] public static extern bool PostMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l); public delegate bool Cb(System.IntPtr h, System.IntPtr p); [DllImport("user32.dll")] public static extern bool EnumWindows(Cb f, System.IntPtr p); [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr h, out uint p); [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(System.IntPtr h, System.Text.StringBuilder s, int n);'; [W.U]::EnumWindows({ param($h, $p) $x = 0; [void][W.U]::GetWindowThreadProcessId($h, [ref]$x); $c = New-Object System.Text.StringBuilder 64; [void][W.U]::GetClassName($h, $c, 64); if ($x -eq ${pid} -and $c.ToString() -eq 'Tauri Window') { [void][W.U]::PostMessage($h, 0x10, 0, 0) }; $true }, 0) | Out-Null`);

async function sessao(id) {
  const prog = abrir();
  await ate(conexao, 40000);
  const c = conexao();
  await fetch(`http://127.0.0.1:${c.porta}/api/boards/${id}`, { method: 'PUT', headers: { 'X-Lousa': c.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: { title: id, items: [] }, revision: 0 }) });
  const pag = await ate(async () => { try { return (await (await fetch(`http://127.0.0.1:${DEPURA}/json/list`)).json()).find(p => p.type === 'page' && p.url.startsWith('http://127.0.0.1:')); } catch { return null; } }, 40000);
  const ws = new WebSocket(pag.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pend = new Map(), dialogos = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.method === 'Page.javascriptDialogOpening') dialogos.push(m.params.message); { const f = pend.get(m.id); if (typeof f === 'function') f(m); } };
  const cdp = (method, params = {}) => new Promise(r => { const i = ++n; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const avaliar = async e => (await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
  await cdp('Page.enable');
  await ate(() => avaliar(`document.readyState === 'complete'`), 15000);
  for (let i = 0; i < 12; i++) { await avaliar(`[...document.querySelectorAll('button')].find(b => ['Começar','Pular'].includes(b.textContent.trim()) && b.offsetParent)?.click()`); await espera(250); }
  await avaliar(`location.hash = '#/b/${id}'`);
  await ate(() => avaliar(`!!document.getElementById('bMenu') && location.hash.includes('${id}')`), 20000);
  await espera(800);
  return { prog, srv: c.pid, ws, cdp, avaliar, dialogos };
}
async function traco(s) {
  await s.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 420, y: 380, button: 'left', buttons: 1, clickCount: 1 });
  for (const [x, y] of [[480, 400], [560, 430], [640, 450]]) await s.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
  await s.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 640, y: 450, button: 'left', buttons: 0, clickCount: 1 });
}

let s;
try {
  console.log(`Fechar com gravação lenta ou falhando: ${EXE}`);
  // 1) gravação lenta (8 s) e cliques repetidos no X
  s = await sessao('lenta');
  await s.avaliar(`(() => { const f = window.fetch; window.fetch = (u, o) => (o && o.method === 'PUT') ? new Promise(r => setTimeout(r, 8000)).then(() => f(u, o)) : f(u, o); })()`);
  await traco(s);
  fechar(s.prog.pid); await espera(600); fechar(s.prog.pid); await espera(600); fechar(s.prog.pid);
  await espera(6000);
  conferir('gravação de 8 s: a janela ainda espera aos 6 s', vivo(s.prog.pid));
  conferir('gravação de 8 s: fecha sozinha quando termina', !!await ate(() => !vivo(s.prog.pid) && !vivo(s.srv), 30000));
  conferir('gravação de 8 s: o traço ficou salvo', itens('lenta') === 1, `itens ${itens('lenta')}`);
  try { s.ws.close(); } catch {}
  await espera(1500);

  // 2) gravação que falha: pergunta; "não" deixa aberta; "sim" fecha
  s = await sessao('falha');
  await s.avaliar(`(() => { const f = window.fetch; window.fetch = (u, o) => (o && o.method === 'PUT') ? Promise.reject(new TypeError('falha simulada')) : f(u, o); })()`);
  await traco(s);
  await espera(1500);
  fechar(s.prog.pid);
  const pergunta = await ate(() => s.dialogos[0], 15000);
  conferir('gravação falhando: pergunta antes de fechar', /não conseguiu salvar/.test(pergunta || ''), pergunta);
  await s.cdp('Page.handleJavaScriptDialog', { accept: false });
  await espera(7000);
  conferir('respondendo "não": a janela continua aberta', vivo(s.prog.pid));
  fechar(s.prog.pid);
  await ate(() => s.dialogos[1], 15000);
  await s.cdp('Page.handleJavaScriptDialog', { accept: true });
  conferir('respondendo "sim": a janela fecha', !!await ate(() => !vivo(s.prog.pid), 15000));
  try { s.ws.close(); } catch {}
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally { if (s && vivo(s.prog.pid)) try { process.kill(s.prog.pid); } catch {} }
{ const c = existsSync(CAIXAS) ? readFileSync(CAIXAS, 'utf8').trim() : ''; conferir('nenhuma mensagem de erro do programa (caixa)', !c, c.slice(0, 300)); }
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
