// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Fechar a janela própria (P60) durante a abertura, em momentos diferentes logo depois de ela aparecer, e abrir de novo
// logo depois de fechar. Achado na bateria de 29/10/2026: uma caixa de erro técnico em inglês ("failed to create
// webview ... O identificador da janela é inválido") apareceu quando o fechamento chegou antes de o WebView2 terminar
// de criar a página. Confere, em cada rodada: o programa sai sozinho em até 15 s, sem nenhuma caixa de mensagem,
// e a abertura seguinte funciona. Perfil de rascunho e quadros temporários; só fecha o que ele abriu.
//   node tests/janela_abrir_e_fechar_rapido.mjs <pasta com GizLivre.exe> [rodadas=12]
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROG = process.argv[2], RODADAS = Number(process.argv[3] || 12), EXE = join(PROG, 'GizLivre.exe');
const tmp = mkdtempSync(join(tmpdir(), 'giz-rapido-')), DADOS = join(tmp, 'quadros'); mkdirSync(DADOS);
// nenhuma caixa na tela do professor: as mensagens do programa vão para este arquivo (GIZ_SEM_CAIXAS)
const CAIXAS = join(tmp, 'caixas.txt'); process.env.GIZ_SEM_CAIXAS = CAIXAS;
const LOG = join(process.env.LOCALAPPDATA, 'Giz Livre', 'janela.log');
const espera = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };
const vivo = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
async function ate(f, ms, passo = 50) { const fim = Date.now() + ms; while (Date.now() < fim) { const v = await f(); if (v) return v; await espera(passo); } return null; }
const ps = cmd => execFileSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8' }).trim();
const API = `Add-Type -Namespace W -Name U -MemberDefinition '[DllImport("user32.dll")] public static extern bool PostMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l); public delegate bool Cb(System.IntPtr h, System.IntPtr p); [DllImport("user32.dll")] public static extern bool EnumWindows(Cb f, System.IntPtr p); [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr h, out uint p); [DllImport("user32.dll")] public static extern bool IsWindowVisible(System.IntPtr h); [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(System.IntPtr h, System.Text.StringBuilder s, int n);';`;
// janelas visíveis do processo por classe: "Tauri Window" (a lousa) e "#32770" (caixa de mensagem)
const janelas = pid => ps(`${API} $r = New-Object System.Collections.ArrayList; [W.U]::EnumWindows({ param($h, $p) $x = 0; [void][W.U]::GetWindowThreadProcessId($h, [ref]$x); if ($x -eq ${pid} -and [W.U]::IsWindowVisible($h)) { $c = New-Object System.Text.StringBuilder 64; [void][W.U]::GetClassName($h, $c, 64); [void]$r.Add($c.ToString()) }; $true }, 0) | Out-Null; $r -join ','`).split(',').filter(Boolean);
const postar = (pid, classe) => ps(`${API} [W.U]::EnumWindows({ param($h, $p) $x = 0; [void][W.U]::GetWindowThreadProcessId($h, [ref]$x); $c = New-Object System.Text.StringBuilder 64; [void][W.U]::GetClassName($h, $c, 64); if ($x -eq ${pid} -and $c.ToString() -eq '${classe}') { [void][W.U]::PostMessage($h, 0x10, 0, 0) }; $true }, 0) | Out-Null`);
const linhasDoLog = () => existsSync(LOG) ? readFileSync(LOG, 'utf8').split(/\r?\n/).length : 0;

const atrasos = [0, 50, 100, 200, 300, 500, 800, 1200, 0, 100, 300, 600];
let caixas = 0, presos = 0, errosNoLog = [];
try {
  console.log(`Fechar durante a abertura e reabrir logo: ${EXE}`);
  for (let r = 0; r < RODADAS; r++) {
    const atraso = atrasos[r % atrasos.length], linha0 = linhasDoLog();
    const p = spawn(EXE, ['--dados', DADOS, '--porta', String(8450 + r)], { stdio: 'ignore', detached: true,
      env: { ...process.env, GIZ_JANELA_DADOS: join(tmp, 'perfil') } });
    await ate(() => janelas(p.pid).includes('Tauri Window'), 30000, 30);   // a janela apareceu
    await espera(atraso);
    postar(p.pid, 'Tauri Window');                                         // fecha logo (o X)
    const saiu = await ate(() => !vivo(p.pid), 15000, 200);
    const restou = vivo(p.pid) ? janelas(p.pid) : [];
    if (restou.includes('#32770')) { caixas++; postar(p.pid, '#32770'); }  // caixa de erro: fecha só a nossa
    if (!saiu) { presos++; await ate(() => !vivo(p.pid), 10000, 200); if (vivo(p.pid)) try { process.kill(p.pid); } catch {} }
    const novas = existsSync(LOG) ? readFileSync(LOG, 'utf8').split(/\r?\n/).slice(linha0 - 1).filter(l => / erro /.test(l) && l.includes(`pid ${p.pid} `)) : [];
    errosNoLog.push(...novas);
    console.log(`    rodada ${r + 1}: fechada ${atraso} ms depois de aparecer; saiu ${saiu ? 'sozinha' : 'PRESA'}${restou.includes('#32770') ? ', COM CAIXA DE ERRO' : ''}${novas.length ? ', erro no registro' : ''}`);
    await espera(r % 2 ? 0 : 300);   // a próxima abre logo em seguida
  }
  conferir('nenhuma caixa de mensagem de erro ao fechar durante a abertura', caixas === 0, `${caixas} caixas`);
  conferir('o programa saiu sozinho em todas as rodadas', presos === 0, `${presos} presos`);
  conferir('nenhum erro de criação da janela no registro', errosNoLog.length === 0, errosNoLog.slice(0, 2).join(' | '));
  // depois disso tudo, a abertura normal funciona
  const p = spawn(EXE, ['--dados', DADOS, '--porta', '8440'], { stdio: 'ignore', detached: true, env: { ...process.env, GIZ_JANELA_DADOS: join(tmp, 'perfil') } });
  const con = await ate(() => { try { return JSON.parse(readFileSync(join(DADOS, '.agente', 'conexao.json'), 'utf8')); } catch { return null; } }, 30000, 200);
  conferir('a abertura normal seguinte funciona', !!con && vivo(p.pid));
  postar(p.pid, 'Tauri Window'); await ate(() => !vivo(p.pid), 15000, 200);
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
{ const c = existsSync(CAIXAS) ? readFileSync(CAIXAS, 'utf8').trim() : ''; conferir('nenhuma mensagem de erro do programa (caixa)', !c, c.slice(0, 300)); }
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
