// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Queda e reabertura da janela própria (P60): mata o GizLivre.exe à força (como uma queda) e reabre logo em seguida,
// N vezes. Depois de uma queda, o processo principal do WebView2 ficava órfão segurando o perfil e a reabertura
// falhava (0x80070578 ou 0xc0000409; achado do Bancada e do Giz na Tela em 29/10/2026). Tem de abrir em todas, sem
// caixa de mensagem, e sem WebView2 órfão sobrando no perfil no fim. Perfil de rascunho; só mexe no que abriu.
//   node tests/janela_queda_e_reabrir.mjs <pasta com GizLivre.exe> [vezes=10]
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROG = process.argv[2], VEZES = Number(process.argv[3] || 10), EXE = join(PROG, 'GizLivre.exe');
const tmp = mkdtempSync(join(tmpdir(), 'giz-queda-')), DADOS = join(tmp, 'quadros'); mkdirSync(DADOS);
// nenhuma caixa na tela do professor: as mensagens do programa vão para este arquivo (GIZ_SEM_CAIXAS)
const CAIXAS = join(tmp, 'caixas.txt'); process.env.GIZ_SEM_CAIXAS = CAIXAS;
const PERFIL = join(tmp, 'perfil'), CON = join(DADOS, '.agente', 'conexao.json');
const espera = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };
const vivo = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
async function ate(f, ms, passo = 200) { const fim = Date.now() + ms; while (Date.now() < fim) { const v = await f(); if (v) return v; await espera(passo); } return null; }
const ps = cmd => execFileSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8' }).trim();
const conexao = () => { try { return JSON.parse(readFileSync(CON, 'utf8')); } catch { return null; } };
const abrir = () => spawn(EXE, ['--dados', DADOS, '--porta', '8420'], { stdio: 'ignore', detached: true, env: { ...process.env, GIZ_JANELA_DADOS: PERFIL } });
const API = `Add-Type -Namespace W -Name U -MemberDefinition '[DllImport("user32.dll")] public static extern bool PostMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l); public delegate bool Cb(System.IntPtr h, System.IntPtr p); [DllImport("user32.dll")] public static extern bool EnumWindows(Cb f, System.IntPtr p); [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr h, out uint p); [DllImport("user32.dll")] public static extern bool IsWindowVisible(System.IntPtr h); [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(System.IntPtr h, System.Text.StringBuilder s, int n);';`;
const janelaVisivel = pid => ps(`${API} $n = 0; [W.U]::EnumWindows({ param($h, $p) $x = 0; [void][W.U]::GetWindowThreadProcessId($h, [ref]$x); $c = New-Object System.Text.StringBuilder 64; [void][W.U]::GetClassName($h, $c, 64); if ($x -eq ${pid} -and $c.ToString() -eq 'Tauri Window' -and [W.U]::IsWindowVisible($h)) { $script:n++ }; $true }, 0) | Out-Null; $n`) !== '0';
const fechar = pid => ps(`${API} [W.U]::EnumWindows({ param($h, $p) $x = 0; [void][W.U]::GetWindowThreadProcessId($h, [ref]$x); $c = New-Object System.Text.StringBuilder 64; [void][W.U]::GetClassName($h, $c, 64); if ($x -eq ${pid} -and $c.ToString() -eq 'Tauri Window') { [void][W.U]::PostMessage($h, 0x10, 0, 0) }; $true }, 0) | Out-Null`);
// processos principais do WebView2 com o perfil deste teste
const webviewDoPerfil = () => ps(`Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'" | Where-Object { $_.CommandLine -notmatch '--type=' -and $_.CommandLine -like '*${join(PERFIL, 'EBWebView').replace(/'/g, "''")}*' } | ForEach-Object ProcessId`).split(/\s+/).filter(Boolean).map(Number);

let prog, abriu = 0;
try {
  console.log(`Queda e reabertura, ${VEZES} vezes: ${EXE}`);
  prog = abrir();
  for (let i = 1; i <= VEZES; i++) {
    const anterior = conexao()?.pid;
    const pronto = await ate(() => { const c = conexao(); return c && c.pid !== anterior && vivo(prog.pid) && janelaVisivel(prog.pid); }, 40000);
    if (pronto) abriu++;
    const orfaosAntes = webviewDoPerfil().length;
    console.log(`    abertura ${i}: ${pronto ? 'abriu' : 'NÃO ABRIU'}; WebView2 do perfil vivos: ${orfaosAntes}`);
    try { process.kill(prog.pid, 'SIGKILL'); } catch {}           // a queda: o exe morre à força
    await ate(() => !vivo(prog.pid), 5000);
    prog = abrir();                                                  // e o professor abre de novo, logo em seguida
  }
  const fim = await ate(() => vivo(prog.pid) && janelaVisivel(prog.pid), 40000);
  if (fim) abriu++;
  conferir(`abriu em todas as ${VEZES + 1} aberturas depois de quedas`, abriu === VEZES + 1, `${abriu} de ${VEZES + 1}`);
  fechar(prog.pid);
  conferir('fecha normalmente no fim', !!await ate(() => !vivo(prog.pid), 15000));
  await espera(3000);
  conferir('nenhum WebView2 órfão sobrando no perfil', webviewDoPerfil().length === 0, webviewDoPerfil().join(','));
  const log = join(process.env.LOCALAPPDATA, 'Giz Livre', 'janela.log');
  const encerrados = existsSync(log) ? readFileSync(log, 'utf8').split(/\r?\n/).filter(l => l.includes('WebView2 órfão')).length : 0;
  console.log(`    registros "WebView2 órfão ... encerrado" no janela.log (todas as rodadas até hoje): ${encerrados}`);
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally { if (prog && vivo(prog.pid)) try { process.kill(prog.pid); } catch {} }
{ const c = existsSync(CAIXAS) ? readFileSync(CAIXAS, 'utf8').trim() : ''; conferir('nenhuma mensagem de erro do programa (caixa)', !c, c.slice(0, 300)); }
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
