// Teste das notas do professor com DUAS TELAS DE VERDADE (SIM do professor, 03/11/2026), na cópia de teste da rc.6:
// dados, perfil e programa em pasta de rascunho. Dirige a janela pela porta de depuração e mede onde cada janela fica.
//   node tests/janela_duas_telas.mjs <pasta> [--duplicar]   (<pasta>/prog/GizLivre/GizLivre.exe do zip portátil; dados e perfil
//   ficam em <pasta>/dados e <pasta>/perfil). Abre janela no PC: só com o SIM do professor e a segunda tela ligada.
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const T = process.argv[2], DUPLICAR = process.argv.includes('--duplicar');
const EXE = join(T, 'prog', 'GizLivre', 'GizLivre.exe'), DADOS = join(T, 'dados'), CON = join(DADOS, '.agente', 'conexao.json');
const PORTA = 8700 + Math.floor(Math.random() * 90), DEPURA = 9500 + Math.floor(Math.random() * 90);
const espera = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${d ? ': ' + d : ''}`); return c; };
const ps = cmd => execFileSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8' }).trim();
const vivo = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
async function ate(f, ms, passo = 200) { const fim = Date.now() + ms; while (Date.now() < fim) { const v = await f(); if (v) return v; await espera(passo); } return null; }
const conexao = () => { try { return JSON.parse(readFileSync(CON, 'utf8')); } catch { return null; } };
const paginas = async () => { try { return (await (await fetch(`http://127.0.0.1:${DEPURA}/json/list`)).json()).filter(x => x.type === 'page'); } catch { return []; } };
// janelas "Tauri Window" do programa: título e retângulo
const WIN = `Add-Type -Namespace W -Name U -MemberDefinition '[DllImport("user32.dll")] public static extern bool PostMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l); public delegate bool Cb(System.IntPtr h, System.IntPtr p); [DllImport("user32.dll")] public static extern bool EnumWindows(Cb f, System.IntPtr p); [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr h, out uint p); [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(System.IntPtr h, System.Text.StringBuilder s, int n); [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(System.IntPtr h, System.Text.StringBuilder s, int n); [DllImport("user32.dll")] public static extern bool IsWindowVisible(System.IntPtr h); [DllImport("user32.dll")] public static extern bool GetWindowRect(System.IntPtr h, out R r); public struct R { public int L; public int T; public int Rt; public int B; }';`;
const janelas = pid => JSON.parse(ps(`${WIN} $o = @(); [W.U]::EnumWindows({ param($h, $p) $x = 0; [void][W.U]::GetWindowThreadProcessId($h, [ref]$x); $c = New-Object System.Text.StringBuilder 64; [void][W.U]::GetClassName($h, $c, 64); if ($x -eq ${pid} -and $c.ToString() -eq 'Tauri Window' -and [W.U]::IsWindowVisible($h)) { $t = New-Object System.Text.StringBuilder 256; [void][W.U]::GetWindowText($h, $t, 256); $r = New-Object W.U+R; [void][W.U]::GetWindowRect($h, [ref]$r); $script:o += [pscustomobject]@{ titulo = $t.ToString(); x = $r.L; y = $r.T; w = $r.Rt - $r.L; h = $r.B - $r.T } }; $true }, 0) | Out-Null; ConvertTo-Json -Compress @($o)`) || '[]');
const fecharTudo = pid => ps(`${WIN} [W.U]::EnumWindows({ param($h, $p) $x = 0; [void][W.U]::GetWindowThreadProcessId($h, [ref]$x); $c = New-Object System.Text.StringBuilder 64; [void][W.U]::GetClassName($h, $c, 64); if ($x -eq ${pid} -and $c.ToString() -eq 'Tauri Window') { [void][W.U]::PostMessage($h, 0x10, 0, 0) }; $true }, 0) | Out-Null`);
const centroX = j => j.x + j.w / 2;
async function conectar(alvo) {
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); pend.get(m.id)?.(m); };
  const cdp = (method, params = {}) => new Promise(r => { const id = ++n; pend.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const avaliar = async e => (await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const ateP = async (e, ms = 15000) => ate(async () => { try { return await avaliar(e); } catch { return false; } }, ms);
  const clicarDeVerdade = async sel => { const c = await avaliar(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    for (const type of ['mousePressed', 'mouseReleased']) await cdp('Input.dispatchMouseEvent', { type, x: c.x, y: c.y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 }); };
  const tecla = async (key, code, vk) => { for (const type of ['rawKeyDown', 'keyUp']) await cdp('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk }); };
  return { ws, cdp, avaliar, ateP, clicarDeVerdade, tecla };
}

let prog;
try {
  if (ps('(Get-Process GizLivre -ErrorAction SilentlyContinue | Measure-Object).Count') !== '0') throw new Error('há um Giz Livre aberto: não sigo (a instância única mandaria o pedido para ele)');
  console.log(`Duas telas de verdade (${DUPLICAR ? 'Duplicar' : 'Estender'}): ${EXE}`);
  console.log('  telas: ' + ps(`Add-Type -AssemblyName System.Windows.Forms; ([System.Windows.Forms.Screen]::AllScreens | % { "$($_.DeviceName) principal=$($_.Primary) $($_.Bounds)" }) -join ' | '`));
  prog = spawn(EXE, ['--dados', DADOS, '--porta', String(PORTA)], { stdio: 'ignore', detached: true,
    env: { ...process.env, GIZ_JANELA_DADOS: join(T, 'perfil'), WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${DEPURA}` } });
  const c = await ate(conexao, 40000);
  const api = (rota, op = {}) => fetch(`http://127.0.0.1:${c.porta}${rota}`, { ...op, headers: { 'X-Lousa': c.token, 'Content-Type': 'application/json' } });
  const L = { mode: 'pages', kind: 's169', w: 1280, h: 720, gap: 48, count: 3 }, passo = L.h + L.gap;
  const nota = (i, texto) => ({ id: 'n' + i, type: 'notaprof', x: 0, y: i * passo + 1, w: 1, h: 1, texto });
  const items = [{ id: 't1', type: 'text', x: 80, y: 80, w: 600, text: 'Slide 1: Lei de Hess', color: '#000', size: 48 },
    { id: 't2', type: 'text', x: 80, y: passo + 80, w: 600, text: 'Slide 2: exemplo', color: '#000', size: 48 },
    { id: 't3', type: 'text', x: 80, y: 2 * passo + 80, w: 600, text: 'Slide 3: exercício', color: '#000', size: 48 },
    nota(0, 'Nota 1: perguntar o que é entalpia'), nota(1, 'Nota 2: fazer a conta no quadro')];
  conferir('quadro de teste criado (3 slides, notas nos dois primeiros)', (await api('/api/boards/duastelas', { method: 'PUT', body: JSON.stringify({ board: { version: 2, title: 'Teste duas telas', background: { color: '#ffffff', pattern: 'none' }, layout: L, items }, revision: 0, criar: true }) })).status === 200);
  const pag = await ate(async () => (await paginas()).find(p => p.url.startsWith(`http://127.0.0.1:${c.porta}/`) && !p.url.includes('?k=')), 40000);
  const Q = await conectar(pag);
  await Q.ateP(`document.readyState === 'complete'`);
  for (let i = 0; i < 12; i++) { await Q.avaliar(`[...document.querySelectorAll('button')].find(b => ['Começar','Pular'].includes(b.textContent.trim()) && b.offsetParent)?.click()`); await espera(250); }
  await Q.avaliar(`location.hash = '#/b/duastelas'`);
  conferir('o quadro abre', await Q.ateP(`window.__lousa?.S?.id === 'duastelas'`, 20000));
  await espera(1500);
  const antes = janelas(prog.pid);
  console.log('  antes de apresentar: ' + JSON.stringify(antes));
  conferir('a lousa começa na tela principal', antes.length === 1 && centroX(antes[0]) < 1920);
  await Q.clicarDeVerdade('#bPresent');
  if (DUPLICAR) {
    await espera(2500);
    conferir('Duplicar: o aviso do Win + P', await Q.avaliar(`document.getElementById('toast').textContent.includes('Win + P')`), await Q.avaliar(`document.getElementById('toast').textContent`));
    conferir('Duplicar: nenhuma janela das notas', !(await paginas()).some(p => p.url.includes('#/notas/')) && janelas(prog.pid).length === 1);
  } else {
    const np = await ate(async () => (await paginas()).find(p => p.url.includes('#/notas/')), 20000);
    conferir('a janela das notas abre', !!np);
    await espera(2500);
    const durante = janelas(prog.pid);
    console.log('  apresentando: ' + JSON.stringify(durante));
    const lousa = durante.find(j => !j.titulo.startsWith('Notas')), notas = durante.find(j => j.titulo.startsWith('Notas'));
    conferir('a apresentação vai para a tela do projetor (a segunda)', !!lousa && centroX(lousa) >= 1920, JSON.stringify(lousa));
    conferir('as notas ficam na tela do notebook (a principal)', !!notas && centroX(notas) < 1920, JSON.stringify(notas));
    const N = await conectar(np);
    conferir('as notas mostram a página 1 e a próxima', await N.ateP(`document.getElementById('njPagina').textContent === 'Página 1 de 3' && document.getElementById('njTexto').textContent === 'Nota 1: perguntar o que é entalpia' && document.getElementById('njProx').textContent === 'Nota 2: fazer a conta no quadro'`),
      await N.avaliar(`document.getElementById('notasJanela').innerText.replace(/\\s+/g, ' ')`));
    await N.clicarDeVerdade('#njProxima');
    conferir('o Próxima das notas passa o slide da apresentação', await Q.ateP(`document.getElementById('ppLabel').textContent === '2 / 3'`, 8000), await Q.avaliar(`document.getElementById('ppLabel').textContent`));
    conferir('e as notas acompanham', await N.ateP(`document.getElementById('njTexto').textContent === 'Nota 2: fazer a conta no quadro' && document.getElementById('njProx').textContent === 'Sem nota.'`));
    await N.clicarDeVerdade('#njAnterior');
    conferir('o Anterior das notas volta o slide', await Q.ateP(`document.getElementById('ppLabel').textContent === '1 / 3'`, 8000));
    await Q.tecla('PageDown', 'PageDown', 34);
    conferir('PageDown na apresentação também atualiza as notas', await N.ateP(`document.getElementById('njPagina').textContent === 'Página 2 de 3'`, 8000));
    N.ws.close();
    await Q.clicarDeVerdade('#ppExit');
    const fechou = await ate(async () => !(await paginas()).some(p => p.url.includes('#/notas/')), 10000);
    conferir('sair da apresentação fecha a janela das notas', !!fechou);
    await espera(1500);
    const depois = janelas(prog.pid);
    console.log('  depois de sair: ' + JSON.stringify(depois));
    conferir('a lousa volta para a tela do notebook (a principal)', depois.length === 1 && centroX(depois[0]) < 1920, JSON.stringify(depois));
    conferir('no tamanho de antes', depois.length === 1 && Math.abs(depois[0].w - antes[0].w) <= 2 && Math.abs(depois[0].h - antes[0].h) <= 2 && Math.abs(depois[0].x - antes[0].x) <= 2,
      `antes ${JSON.stringify(antes[0])} depois ${JSON.stringify(depois[0])}`);
    // F5 de verdade abre de novo e o Esc (pela página) sai e fecha
    await Q.avaliar('document.activeElement?.blur()');
    await Q.tecla('F5', 'F5', 116);
    conferir('F5 abre as notas de novo', !!await ate(async () => (await paginas()).some(p => p.url.includes('#/notas/')), 15000));
    await espera(1500);
    await Q.tecla('Escape', 'Escape', 27); await espera(800);
    if (await Q.avaliar(`document.getElementById('board').classList.contains('present')`))
      await Q.avaliar(`document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))`);
    conferir('Esc sai e fecha as notas', !!await ate(async () => !(await paginas()).some(p => p.url.includes('#/notas/')), 10000));
    await espera(1500);
    const fim = janelas(prog.pid);
    conferir('e a lousa volta para a tela do notebook', fim.length === 1 && centroX(fim[0]) < 1920, JSON.stringify(fim));
  }
  Q.ws.close();
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally {
  if (prog) {
    try { fecharTudo(prog.pid); } catch {}
    const saiu = await ate(() => !vivo(prog.pid), 20000);
    if (!saiu) try { process.kill(prog.pid); } catch {}
    conferir('fechar a janela fecha o programa (teste encerrado)', !!saiu);
    const sobra = ps(`@(Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like '${join(T, 'prog').replace(/'/g, "''")}*' }).Count`);
    conferir('nenhum processo da cópia de teste sobrando', sobra === '0', sobra);
  }
}
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
