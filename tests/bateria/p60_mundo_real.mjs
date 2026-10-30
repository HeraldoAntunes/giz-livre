// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Bateria C (mundo real) na janela própria (P60): o GizLivre.exe de uma pasta montada (portátil ou instalada), com
// quadros temporários e o perfil do WebView2 de rascunho (nunca o do professor). Só fecha os PIDs que ele abriu.
//   C1: aberto 30 min com um quadro na tela, vigiado a cada minuto: o programa e o servidor continuam vivos e a DLL do
//       Warsaw (wslbdhm64.dll) não entra em nenhum processo da janela;
//   C2: 5 quedas bruscas (janela e servidor mortos pelo PID no meio de gravações seguidas): ao reabrir, o quadro está
//       inteiro e legível;
//   C3+C5: um traço desenhado e a página congelada (como o Windows faz com janela minimizada em economia de energia),
//       janela minimizada por 15 min: o programa não se fecha; ao voltar, a página responde e o traço é salvo.
//   node tests/bateria/p60_mundo_real.mjs <pasta com GizLivre.exe> [minutos C1=30] [minutos C3=15]
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROG = process.argv[2], MIN_C1 = Number(process.argv[3] || 30), MIN_C3 = Number(process.argv[4] || 15);
const EXE = join(PROG, 'GizLivre.exe');
const tmp = mkdtempSync(join(tmpdir(), 'giz-p60c-')), DADOS = join(tmp, 'quadros'); mkdirSync(DADOS);
// nenhuma caixa na tela do professor: as mensagens do programa vão para este arquivo (GIZ_SEM_CAIXAS)
const CAIXAS = join(tmp, 'caixas.txt'); process.env.GIZ_SEM_CAIXAS = CAIXAS;
const PERFIL = join(tmp, 'perfil'), CON = join(DADOS, '.agente', 'conexao.json');
const PORTA = 8600 + Math.floor(Math.random() * 90), DEPURA = 9300 + Math.floor(Math.random() * 90);
const espera = ms => new Promise(r => setTimeout(r, ms));
const hora = () => new Date().toLocaleTimeString('pt-BR');
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };
const ps = cmd => execFileSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8' }).trim();
const vivo = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
async function ate(f, ms, passo = 300) { const fim = Date.now() + ms; while (Date.now() < fim) { const v = await f(); if (v) return v; await espera(passo); } return null; }
const conexao = () => { try { return JSON.parse(readFileSync(CON, 'utf8')); } catch { return null; } };
const abrir = () => spawn(EXE, ['--dados', DADOS, '--porta', String(PORTA)], { stdio: 'ignore', detached: true,
  env: { ...process.env, GIZ_JANELA_DADOS: PERFIL, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${DEPURA}` } });
const pagina = () => ate(async () => { try { return (await (await fetch(`http://127.0.0.1:${DEPURA}/json/list`)).json()).find(p => p.type === 'page' && p.url.startsWith('http://127.0.0.1:')); } catch { return null; } }, 40000);
const filhos = pid => ps(`$t = Get-CimInstance Win32_Process; $f = @(${pid}); do { $n = @($t | Where-Object { $f -contains $_.ParentProcessId -and $f -notcontains $_.ProcessId } | ForEach-Object ProcessId); $f += $n } while ($n.Count); $f -join ','`).split(',').filter(Boolean).map(Number);
const comWarsaw = pids => ps(`@(${pids.join(',')}) | ForEach-Object { Get-Process -Id $_ -Module -ErrorAction SilentlyContinue } | Where-Object ModuleName -like 'wslbdhm*' | Select-Object -First 1 -ExpandProperty FileName`);
const matar = pids => { for (const p of pids) try { process.kill(p, 'SIGKILL'); } catch {} };
const janelaDaLousa = (pid, cmd) => ps(`Add-Type -Namespace W -Name U -MemberDefinition '[DllImport("user32.dll")] public static extern bool ShowWindow(System.IntPtr h, int c); [DllImport("user32.dll")] public static extern bool PostMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l); public delegate bool Cb(System.IntPtr h, System.IntPtr p); [DllImport("user32.dll")] public static extern bool EnumWindows(Cb f, System.IntPtr p); [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr h, out uint p); [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(System.IntPtr h, System.Text.StringBuilder s, int n);'; [W.U]::EnumWindows({ param($h, $p) $x = 0; [void][W.U]::GetWindowThreadProcessId($h, [ref]$x); $c = New-Object System.Text.StringBuilder 64; [void][W.U]::GetClassName($h, $c, 64); if ($x -eq ${pid} -and $c.ToString() -eq 'Tauri Window') { ${cmd} }; $true }, 0) | Out-Null`);
const fechar = pid => janelaDaLousa(pid, '[void][W.U]::PostMessage($h, 0x10, 0, 0)');
const minimizar = pid => janelaDaLousa(pid, '[void][W.U]::ShowWindow($h, 6)');      // SW_MINIMIZE
const restaurar = pid => janelaDaLousa(pid, '[void][W.U]::ShowWindow($h, 9)');      // SW_RESTORE
async function cdpDe(pag) {
  const ws = new WebSocket(pag.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); pend.get(m.id)?.(m); };
  const cdp = (method, params = {}) => new Promise(r => { const id = ++n; pend.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const avaliar = async e => (await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
  return { ws, cdp, avaliar };
}
const api = (rota, op = {}) => fetch(`http://127.0.0.1:${conexao().porta}${rota}`, { ...op, headers: { 'X-Lousa': conexao().token, 'Content-Type': 'application/json', ...(op.headers || {}) } });
async function abrirQuadro(id) {
  const pag = await pagina(); const c = await cdpDe(pag);
  await ate(() => c.avaliar(`document.readyState === 'complete'`), 15000);
  for (let i = 0; i < 12; i++) { await c.avaliar(`[...document.querySelectorAll('button')].find(b => ['Começar','Pular'].includes(b.textContent.trim()) && b.offsetParent)?.click()`); await espera(250); }
  await c.avaliar(`location.hash = '#/b/${id}'`);
  await ate(() => c.avaliar(`!!document.getElementById('bMenu') && location.hash.includes('${id}')`), 20000);
  return c;
}
async function traco(c, y) {
  await c.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 400, y, button: 'left', buttons: 1, clickCount: 1 });
  for (const [x, yy] of [[460, y + 20], [520, y + 40], [600, y + 50]]) await c.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y: yy, button: 'left', buttons: 1 });
  await c.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 600, y: y + 50, button: 'left', buttons: 0, clickCount: 1 });
}
const itensNoDisco = id => { try { return JSON.parse(readFileSync(join(DADOS, `${id}.json`), 'utf8')).items.length; } catch { return -1; } };

let prog;
try {
  console.log(`Bateria C da janela própria: ${EXE} (perfil de rascunho ${PERFIL})`);
  // ---------- C1 ----------
  console.log(`C1: ${MIN_C1} min aberto com o Warsaw (${hora()})`);
  prog = abrir();
  await ate(conexao, 40000);
  await api('/api/boards/c1', { method: 'PUT', body: JSON.stringify({ board: { title: 'C1', items: [] }, revision: 0 }) });
  let c = await abrirQuadro('c1');
  const srv = conexao().pid;
  let quedas = 0, warsaw = '', voltas = 0;
  for (const fim = Date.now() + MIN_C1 * 60000; Date.now() < fim; await espera(60000)) {
    voltas++;
    if (!vivo(prog.pid) || !vivo(srv)) { quedas++; break; }
    warsaw = warsaw || comWarsaw(filhos(prog.pid));
    if (voltas % 5 === 0) await traco(c, 150 + (voltas % 20) * 10);   // uso: um traço a cada 5 min
  }
  conferir(`C1: o programa e o servidor ficaram ${MIN_C1} min abertos sem cair`, quedas === 0, `caiu na volta ${voltas}`);
  conferir('C1: a DLL do Warsaw não entrou em nenhum processo da janela', !warsaw, warsaw);
  await espera(2000);
  conferir('C1: os traços feitos durante o uso foram salvos', itensNoDisco('c1') >= Math.floor(voltas / 5), `itens ${itensNoDisco('c1')}`);
  c.ws.close(); fechar(prog.pid); await ate(() => !vivo(prog.pid) && !vivo(srv), 15000);

  // ---------- C2 ----------
  console.log(`C2: 5 quedas bruscas no meio de gravações (${hora()})`);
  const grande = Array.from({ length: 3000 }, (_, k) => ({ id: `s${k}`, type: 'stroke', color: '#123', width: 3,
    pts: Array.from({ length: 60 }, (_, i) => [i * 5, k * 3 + (i % 4), 0.5]).flat() }));
  let ruins = 0;
  for (let r = 1; r <= 5; r++) {
    prog = abrir();
    await ate(conexao, 40000);
    const s2 = conexao().pid;
    let rev = (await (await api('/api/boards/c2').catch(() => null))?.json?.().catch(() => null))?._rev || 0;
    let parar = false;
    const gravando = (async () => { while (!parar) { try { const x = await api('/api/boards/c2', { method: 'PUT', body: JSON.stringify({ board: { title: 'C2', items: grande.slice(0, 1500 + (rev % 1500)) }, revision: rev }) }); const j = await x.json(); rev = j.revision ?? j._rev ?? rev + 1; } catch { break; } } })();
    await espera(1500 + Math.random() * 1500);
    matar([prog.pid, s2, ...filhos(prog.pid)]);   // só os processos deste teste, pelo PID
    parar = true; await gravando;
    await ate(() => !vivo(prog.pid) && !vivo(s2), 10000);
    let legivel = false;
    try { const b = JSON.parse(readFileSync(join(DADOS, 'c2.json'), 'utf8')); legivel = Array.isArray(b.items) && b.items.length >= 1500; } catch {}
    if (!legivel) ruins++;
    console.log(`    rodada ${r}: quadro ${legivel ? 'inteiro' : 'DANIFICADO'}; temporários na pasta: ${readdirSync(DADOS).filter(n => n.endsWith('.tmp')).length}`);
  }
  conferir('C2: nas 5 quedas o quadro ficou inteiro e legível', ruins === 0, `${ruins} danificados`);
  prog = abrir(); await ate(conexao, 40000);
  const lista = await (await api('/api/boards')).json();
  conferir('C2: reabre depois das quedas e o quadro aparece na galeria', lista.some(b => b.id === 'c2'));
  fechar(prog.pid); await ate(() => !vivo(prog.pid), 15000);

  // ---------- C3 + C5 ----------
  console.log(`C3+C5: traço não salvo, página congelada e janela minimizada por ${MIN_C3} min (${hora()})`);
  await espera(2000);
  prog = abrir(); await ate(conexao, 40000);
  await api('/api/boards/c3', { method: 'PUT', body: JSON.stringify({ board: { title: 'C3', items: [] }, revision: 0 }) });
  c = await abrirQuadro('c3');
  const s3 = conexao().pid;
  await traco(c, 300);
  await c.cdp('Page.enable');
  await c.cdp('Page.setWebLifecycleState', { state: 'frozen' });   // nenhum timer roda: o traço fica por salvar
  minimizar(prog.pid);
  const antes = itensNoDisco('c3');
  await espera(MIN_C3 * 60000);
  conferir(`C3: depois de ${MIN_C3} min minimizado e congelado, o programa e o servidor continuam abertos`, vivo(prog.pid) && vivo(s3));
  restaurar(prog.pid);
  await c.cdp('Page.setWebLifecycleState', { state: 'active' });
  conferir('C5: a janela volta e a página responde', (await c.avaliar(`1 + 1`)) === 2);
  conferir('C3: o traço que estava por salvar foi salvo ao voltar', !!await ate(() => itensNoDisco('c3') >= 1, 20000), `antes ${antes}, agora ${itensNoDisco('c3')}`);
  c.ws.close(); fechar(prog.pid); await ate(() => !vivo(prog.pid) && !vivo(s3), 15000);
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally { if (prog && vivo(prog.pid)) matar([prog.pid, ...filhos(prog.pid)]); }
{ const c = existsSync(CAIXAS) ? readFileSync(CAIXAS, 'utf8').trim() : ''; conferir('nenhuma mensagem de erro do programa (caixa)', !c, c.slice(0, 300)); }
console.log(`\n${ok} conferências passaram, ${falhas} falharam (${hora()})`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
