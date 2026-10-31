// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Prova da janela própria (P60, docs/P60-PLANO-JANELA-PROPRIA.md): abre o GizLivre.exe (Tauri) de uma pasta montada
// (GizLivre.exe, python\, servidor\server.py + app\) com quadros temporários e confere, pelo protocolo de depuração do
// WebView2 (porta só deste teste):
//   - abre a galeria com o acesso desta conta, sem console e sem o Edge;
//   - um traço feito logo antes de fechar a janela fica salvo; fechar a janela fecha o servidor;
//   - abrir o atalho de novo abre outra janela no mesmo programa, sem um segundo servidor;
//   - matar o GizLivre.exe (Gerenciador de Tarefas) não deixa o servidor órfão;
//   - o módulo do banco (Warsaw, wslbdhm64.dll), que derrubava o Edge, não está em nenhum processo da janela;
//   - abre e fecha N vezes seguidas sem cair (o Edge caía a partir da segunda abertura);
//   - nenhum processo do programa (janela, WebView2, servidor) abre conexão TCP para fora do computador em 30 s, com o
//     perfil do WebView2 já usado (o Local State apagado na abertura: _Ferramentas/programas-livres/WEBVIEW2-REDE.md);
//   - os dados da página (localStorage) sobrevivem a fechar e abrir.
//   node tests/janela_propria.mjs <pasta do programa montado> [vezes=20]
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROG = process.argv[2], VEZES = Number(process.argv[3] || 20);
if (!PROG || !existsSync(join(PROG, 'GizLivre.exe'))) { console.log('uso: node tests/janela_propria.mjs <pasta com GizLivre.exe>'); process.exit(2); }
const EXE = join(PROG, 'GizLivre.exe');
const tmp = mkdtempSync(join(tmpdir(), 'giz-p60-')), DADOS = join(tmp, 'quadros'); mkdirSync(DADOS);
// nenhuma caixa na tela do professor: as mensagens do programa vão para este arquivo (GIZ_SEM_CAIXAS)
const CAIXAS = join(tmp, 'caixas.txt'); process.env.GIZ_SEM_CAIXAS = CAIXAS;
const CON = join(DADOS, '.agente', 'conexao.json');
// perfil do WebView2 só dos testes (nunca o do professor, %LOCALAPPDATA%\Giz Livre\janela); fica entre uma rodada e outra,
// para a medição de rede ver o caso do perfil já usado
const PERFIL = join(tmpdir(), 'giz-p60-perfil-teste');
const PORTA = 8800 + Math.floor(Math.random() * 90), DEPURA = 9400 + Math.floor(Math.random() * 90);
const espera = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };
const ps = cmd => execFileSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8' }).trim();
const vivo = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
async function ate(f, ms, passo = 200) { const fim = Date.now() + ms; while (Date.now() < fim) { const v = await f(); if (v) return v; await espera(passo); } return null; }
const conexao = () => { try { return JSON.parse(readFileSync(CON, 'utf8')); } catch { return null; } };
const paginas = async () => { try { return (await (await fetch(`http://127.0.0.1:${DEPURA}/json/list`)).json()).filter(x => x.type === 'page'); } catch { return []; } };
const api = (rota, op = {}) => fetch(`http://127.0.0.1:${conexao().porta}${rota}`, { ...op, headers: { 'X-Lousa': conexao().token, 'Content-Type': 'application/json', ...(op.headers || {}) } });

function abrir() {
  return spawn(EXE, ['--dados', DADOS, '--porta', String(PORTA)], { stdio: 'ignore', detached: true,
    env: { ...process.env, GIZ_JANELA_DADOS: PERFIL, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${DEPURA}` } });
}
// fecha como o professor fecha (o X da janela): WM_CLOSE em cada janela da lousa (classe "Tauri Window"); as janelas
// internas do Tauri ficam de fora: fechar a que recebe os recados deixaria o programa surdo
const fecharJanelas = pid => ps(`Add-Type -Namespace W -Name U -MemberDefinition '[DllImport("user32.dll")] public static extern bool PostMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l); public delegate bool Cb(System.IntPtr h, System.IntPtr p); [DllImport("user32.dll")] public static extern bool EnumWindows(Cb f, System.IntPtr p); [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr h, out uint p); [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(System.IntPtr h, System.Text.StringBuilder s, int n);'; [W.U]::EnumWindows({ param($h, $p) $x = 0; [void][W.U]::GetWindowThreadProcessId($h, [ref]$x); $c = New-Object System.Text.StringBuilder 64; [void][W.U]::GetClassName($h, $c, 64); if ($x -eq ${pid} -and $c.ToString() -eq 'Tauri Window') { [void][W.U]::PostMessage($h, 0x10, 0, 0) }; $true }, 0) | Out-Null`);
// processos do WebView2 desta janela (filhos do GizLivre.exe)
const filhosWebview = pid => ps(`$t = Get-CimInstance Win32_Process; $f = @(${pid}); do { $n = @($t | Where-Object { $f -contains $_.ParentProcessId -and $f -notcontains $_.ProcessId } | ForEach-Object ProcessId); $f += $n } while ($n.Count); ($t | Where-Object { $f -contains $_.ProcessId -and $_.Name -eq 'msedgewebview2.exe' } | ForEach-Object ProcessId) -join ','`).split(',').filter(Boolean).map(Number);

const LOCAL_STATE = join(PERFIL, 'EBWebView', 'Local State');
// conexões TCP de qualquer processo do programa para fora do computador (loopback e escuta não contam)
function conexoesFora(pids) {
  const r = ps(`Get-NetTCPConnection -OwningProcess ${pids.join(',')} -ErrorAction SilentlyContinue | Where-Object { $_.RemoteAddress -notin '127.0.0.1','::1','0.0.0.0','::' -and $_.RemoteAddress -notlike '127.*' } | ForEach-Object { "$($_.OwningProcess) $($_.RemoteAddress):$($_.RemotePort) $($_.State)" }; exit 0`);   // sem nenhuma conexão o comando sai com erro
  return r ? r.split(/\r?\n/) : [];
}
async function avaliarEm(pag, expr) {
  const w = new WebSocket(pag.webSocketDebuggerUrl); await new Promise(r => w.onopen = r);
  const v = await new Promise(r => { w.onmessage = e => { const m = JSON.parse(e.data); if (m.id === 1) r(m.result?.result?.value); };
    w.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } })); });
  w.close(); return v;
}

let prog;
try {
  console.log(`Janela própria: ${EXE}`);
  // 1) abre (com o perfil do WebView2 de aberturas anteriores, quando houver: é o caso que conectava)
  const usado = () => existsSync(LOCAL_STATE) && readFileSync(LOCAL_STATE, 'utf8').includes('"info_cache"');
  if (!usado()) {   // perfil de rascunho novo: uma abertura antes, para medir o caso do perfil já conhecido
    prog = abrir();
    await ate(async () => (await paginas()).some(p => p.url.startsWith('http://127.0.0.1:')), 40000);
    await espera(3000);
    fecharJanelas(prog.pid);
    await ate(() => !vivo(prog.pid), 15000);
  }
  const perfilUsado = usado();
  prog = abrir();
  const c = await ate(conexao, 40000);
  conferir('o servidor subiu no Python embutido e gravou o arquivo de conexão', !!c, CON);
  const pag = await ate(async () => (await paginas()).find(p => p.url.startsWith(`http://127.0.0.1:${c.porta}/`) && !p.url.includes('?k=')), 30000);
  conferir('a janela mostra a página do programa (a chave de abertura já saiu do endereço)', !!pag && !pag.url.includes('?k='), pag?.url);
  const srvPid = c.pid;
  conferir('o servidor é o pythonw.exe embutido, sem console', /pythonw\.exe$/i.test(ps(`(Get-Process -Id ${srvPid}).Path`)));
  const pai = Number(ps(`(Get-CimInstance Win32_Process -Filter "ProcessId=${srvPid}").ParentProcessId`));
  conferir('o servidor é filho da janela', pai === prog.pid, `pai ${pai}, janela ${prog.pid}`);
  conferir('nenhum Edge foi aberto pelo programa', !ps(`Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.ParentProcessId -in ${prog.pid},${srvPid} } | Select-Object -First 1`));

  // 2) módulo do banco (Warsaw) nos processos da janela
  const wv = filhosWebview(prog.pid);
  const warsaw = wv.length ? ps(`@(${wv.join(',')}) | ForEach-Object { Get-Process -Id $_ -Module -ErrorAction SilentlyContinue } | Where-Object ModuleName -like 'wslbdhm*' | Select-Object -First 1 -ExpandProperty FileName`) : '';
  const temWarsaw = existsSync('C:/Program Files/Topaz OFD/Warsaw') || existsSync('C:/Program Files (x86)/Topaz OFD/Warsaw');
  console.log(`    ${wv.length} processos do WebView2; Warsaw instalado neste PC: ${temWarsaw ? 'sim' : 'não'}`);
  conferir('o módulo do Warsaw (wslbdhm64.dll) não está em nenhum processo da janela', !warsaw, warsaw);

  // 2b) rede: 30 s olhando as conexões de todos os processos do programa, pelo PID
  console.log(`    perfil do WebView2 já usado antes desta abertura (Local State com info_cache): ${perfilUsado ? 'sim' : 'não'}`);
  const vistas = new Set();
  for (const fim = Date.now() + 30000; Date.now() < fim; await espera(2000))
    for (const x of conexoesFora([prog.pid, srvPid, ...filhosWebview(prog.pid)])) vistas.add(x);
  conferir('nenhuma conexão para fora do computador em 30 s (janela, WebView2 e servidor)', vistas.size === 0, [...vistas].join('; '));

  // 3) traço logo antes de fechar: fica salvo; fechar a janela fecha o servidor
  await api('/api/boards/p60quadro', { method: 'PUT', body: JSON.stringify({ board: { title: 'P60', items: [] }, revision: 0 }) });
  const ws = new WebSocket(pag.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); { const f = pend.get(m.id); if (typeof f === 'function') f(m); } };
  const cdp = (method, params = {}) => new Promise(r => { const id = ++n; pend.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const avaliar = async e => (await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
  for (let i = 0; i < 12; i++) { await avaliar(`[...document.querySelectorAll('button')].find(b => ['Começar','Pular'].includes(b.textContent.trim()) && b.offsetParent)?.click()`); await espera(300); }
  await avaliar(`localStorage.setItem('p60_teste', '42')`);
  await avaliar(`location.hash = '#/b/p60quadro'`);
  conferir('o quadro abre', !!await ate(() => avaliar(`!!document.getElementById('bMenu') && location.hash.includes('p60quadro')`), 20000));
  await espera(800);
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 500, y: 400, button: 'left', buttons: 1, clickCount: 1 });
  for (const [x, y] of [[540, 420], [600, 450], [660, 470], [720, 500]]) await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 720, y: 500, button: 'left', buttons: 0, clickCount: 1 });
  const pendente = await avaliar(`document.title`);   // só para dar tempo do evento chegar, sem esperar o salvamento
  fecharJanelas(prog.pid);   // fecha na hora, com o traço ainda por gravar
  const saiu = await ate(() => !vivo(prog.pid) && !vivo(srvPid), 15000);
  conferir('fechar a janela fecha o programa e o servidor em até 15 s', !!saiu);
  const salvo = JSON.parse(readFileSync(join(DADOS, 'p60quadro.json'), 'utf8'));
  conferir('o traço feito logo antes de fechar ficou salvo', (salvo.items || []).length === 1, `itens: ${(salvo.items || []).length} (${pendente})`);
  conferir('o arquivo de conexão foi apagado ao sair', !existsSync(CON));

  // 4) segunda abertura: outra janela no mesmo programa, sem segundo servidor
  prog = abrir();
  const c2 = await ate(conexao, 40000);
  const pag2 = await ate(async () => (await paginas()).find(p => p.url.startsWith('http://127.0.0.1:') && !p.url.includes('?k=')), 30000);
  // a janela abre na página de espera e só depois vai para a lousa: lê quando a lousa já carregou
  conferir('os dados da página sobrevivem a fechar e abrir (localStorage)', !!await ate(async () => { try { return await avaliarEm(pag2, `document.readyState === 'complete' && localStorage.getItem('p60_teste')`) === '42'; } catch { return false; } }, 10000));
  const segundo = abrir();
  const duas = await ate(async () => (await paginas()).filter(p => p.url.startsWith('http://127.0.0.1:')).length >= 2, 20000);
  conferir('abrir de novo mostra uma segunda janela', !!duas);
  await espera(1500);
  conferir('a segunda abertura não ficou rodando (passou o pedido ao programa aberto)', !vivo(segundo.pid));
  conferir('continua um servidor só', conexao()?.pid === c2.pid && vivo(c2.pid));

  // 5) a janela morre de repente: o servidor sai sozinho
  process.kill(prog.pid);
  conferir('matar o GizLivre.exe não deixa o servidor órfão', !!await ate(() => !vivo(c2.pid), 15000));

  // 6) abrir e fechar várias vezes seguidas
  let quedas = 0, lentas = 0;
  for (let i = 1; i <= VEZES; i++) {
    const t0 = Date.now();
    prog = abrir();
    const pg = await ate(async () => (await paginas()).find(p => p.url.startsWith('http://127.0.0.1:') && p.title.includes('Giz Livre')), 40000);
    if (!pg) { quedas++; console.log(`    abertura ${i}: a página não apareceu`); try { process.kill(prog.pid); } catch {} await espera(2000); continue; }
    if (Date.now() - t0 > 15000) lentas++;
    await espera(1500);
    if (!vivo(prog.pid)) { quedas++; console.log(`    abertura ${i}: a janela caiu sozinha`); continue; }
    const s = conexao()?.pid;
    fecharJanelas(prog.pid);
    if (!await ate(() => !vivo(prog.pid) && !(s && vivo(s)), 15000)) { quedas++; console.log(`    abertura ${i}: não fechou`); try { process.kill(prog.pid); } catch {} }
  }
  conferir(`abriu e fechou ${VEZES} vezes seguidas sem cair`, quedas === 0, `${quedas} problemas`);
  conferir('cada abertura em até 15 s', lentas === 0, `${lentas} lentas`);
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally { try { if (prog && vivo(prog.pid)) process.kill(prog.pid); } catch {} }
{ const c = existsSync(CAIXAS) ? readFileSync(CAIXAS, 'utf8').trim() : ''; conferir('nenhuma mensagem de erro do programa (caixa)', !c, c.slice(0, 300)); }
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
