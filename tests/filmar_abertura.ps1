# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Filma a abertura da janela do Giz Livre (P-ABERTURA, 22/11/2026): uma foto a cada ~125 ms do conteúdo da janela do Giz
# (PrintWindow: nada do que está atrás dela), em 5 situações: primeira abertura (perfil novo), fria duas vezes, atalho de novo com o programa aberto
# e depois de uma queda. Roda numa cópia de teste (portátil publicado + exe e páginas desta pasta), com dados, perfil e
# porta próprios e quadros sintéticos, por tarefa agendada interativa. Fecha só o que abriu, pelo PID.
# ABRE JANELA: só com o SIM do professor (no PC dele) ou no notebook de testes.
#
#   powershell -File tests\filmar_abertura.ps1 -Exe janela\target\release\GizLivre.exe -Rotulo depois-a1
#     -Portatil  zip do portátil que dá o Python embutido (padrão: build\rel119\GizLivre-1.19.0-portatil.zip)
#     -Servidor  pasta com server.py e app\ (padrão: esta pasta; 'publicado' usa os do portátil)
#     -Manter    guarda as fotos brutas
# Saída: build\evidencia\abertura-<rótulo>\ (relatorio.txt, linha-do-tempo-<cena>.png, quadros escolhidos).
param([string]$Exe, [string]$Rotulo = 'teste', [string]$Portatil = '', [string]$Servidor = '', [int]$Porta = 47911,
      [switch]$Manter, [string]$Dentro = '')
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot

function Gravador {
  Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Text; using System.Drawing; using System.Drawing.Imaging; using System.IO;
using System.Diagnostics; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class FilmarGiz {
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern int GetSystemMetrics(int i);
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
  [DllImport("user32.dll")] static extern bool IsZoomed(IntPtr h);
  [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr p, EnumProc f, IntPtr l);
  // foto da tela na área da janela do Giz, só se ela está maximizada e na frente (cobre a tela: nada de outro programa)
  static bool Tela(IntPtr hw, RECT r, int w, int h, string arq, ImageCodecInfo enc, EncoderParameters par) {
    if (hw == IntPtr.Zero || !IsZoomed(hw) || GetForegroundWindow() != hw) return false;
    int x0 = Math.Max(0, r.L), y0 = Math.Max(0, r.T), x1 = Math.Min(w, r.R), y1 = Math.Min(h, r.B);
    using (var bmp = new Bitmap(x1 - x0, y1 - y0)) using (var g = Graphics.FromImage(bmp)) {
      g.CopyFromScreen(x0, y0, 0, 0, new Size(x1 - x0, y1 - y0)); bmp.Save(arq, enc, par); }
    return true;
  }
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  static Dictionary<uint, string> nomes = new Dictionary<uint, string>();
  static string Nome(uint pid) {
    string n; if (nomes.TryGetValue(pid, out n)) return n;
    try { n = Process.GetProcessById((int)pid).ProcessName; } catch { n = "?"; }
    nomes[pid] = n; return n;
  }
  public static void Rodar(string saida, int ms, int intervalo) {
    SetProcessDPIAware();
    int w = GetSystemMetrics(0), h = GetSystemMetrics(1);
    var enc = Array.Find(ImageCodecInfo.GetImageEncoders(), e => e.MimeType == "image/jpeg");
    var par = new EncoderParameters(1); par.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 70L);
    var csv = new StreamWriter(Path.Combine(saida, "janelas.csv"), false, new UTF8Encoding(false));
    csv.WriteLine("quadro;ms;frente;processo;pid;classe;titulo;x;y;larg;alt;minimizada");
    var rel = Stopwatch.StartNew(); int q = 0;
    File.WriteAllText(Path.Combine(saida, "inicio.txt"), DateTime.Now.ToString("o"));   // para contar do clique
    while (rel.ElapsedMilliseconds < ms) {
      long t0 = rel.ElapsedMilliseconds;
      IntPtr fg = GetForegroundWindow();
      IntPtr topo = IntPtr.Zero; RECT rt = new RECT(); IntPtr abre = IntPtr.Zero; RECT ra = new RECT();
      EnumWindows((hw, l) => {
        if (!IsWindowVisible(hw)) return true;
        uint pid; GetWindowThreadProcessId(hw, out pid);
        if (Nome(pid).ToLower() != "gizlivre") return true;
        var sb = new StringBuilder(512); GetWindowText(hw, sb, 512);
        var cl = new StringBuilder(256); GetClassName(hw, cl, 256);
        RECT r; GetWindowRect(hw, out r); bool min = IsIconic(hw);
        if (!min && r.R - r.L > 50 && r.B - r.T > 50 && topo == IntPtr.Zero && cl.ToString() == "Tauri Window") { topo = hw; rt = r; }   // a de cima (ordem z)
        if (cl.ToString() == "GizLivreAbertura" && r.R - r.L > 50) { abre = hw; ra = r; }   // a tela de abertura (P-ABERTURA B)
        csv.WriteLine(String.Join(";", new string[] { q.ToString(), t0.ToString(), (hw == fg ? "1" : "0"), "gizlivre", pid.ToString(), cl.ToString(),
          sb.ToString().Replace(";", ","), r.L.ToString(), r.T.ToString(), (r.R - r.L).ToString(), (r.B - r.T).ToString(), (min ? "1" : "0") }));
        return true; }, IntPtr.Zero);
      if (topo == IntPtr.Zero) csv.WriteLine(q + ";" + t0 + ";0;-;0;-;-;0;0;0;0;0");
      else {
        // duas fotos: a da própria janela (PrintWindow: nunca o que está atrás, mas sem o WebView quando a janela tem
        // cor de fundo nativa) e a da tela na área dela. Fica a da tela só se a barra de título nela é igual à da própria
        // janela: uma janela transparente (a "fantasma") mostraria o que está atrás, e aí fica só a do PrintWindow
        int ww = rt.R - rt.L, hh = rt.B - rt.T;
        using (var pw = new Bitmap(ww, hh)) {
          using (var g = Graphics.FromImage(pw)) { IntPtr dc = g.GetHdc(); try { PrintWindow(topo, dc, 2); } finally { g.ReleaseHdc(dc); } }
          int x0 = Math.Max(0, rt.L), y0 = Math.Max(0, rt.T), x1 = Math.Min(w, rt.R), y1 = Math.Min(h, rt.B);
          bool usouTela = false;
          if (x1 - x0 > 100 && y1 - y0 > 100) {
            using (var tl = new Bitmap(x1 - x0, y1 - y0)) {
              using (var g = Graphics.FromImage(tl)) { try { g.CopyFromScreen(x0, y0, 0, 0, new Size(x1 - x0, y1 - y0)); } catch { } }
              // barra de título: de 4 a 26 px abaixo do topo visível, em 200 pontos
              long soma = 0; int n = 0;
              for (int i = 0; i < 200; i++) {
                int xt = 10 + (int)((long)(x1 - x0 - 20) * i / 200), yt = 4 + (i % 5) * 5;
                if (yt >= y1 - y0) continue;
                Color a1 = tl.GetPixel(xt, yt), b1 = pw.GetPixel(xt + (x0 - rt.L), yt + (y0 - rt.T));
                soma += Math.Abs(a1.R - b1.R) + Math.Abs(a1.G - b1.G) + Math.Abs(a1.B - b1.B); n++;
              }
              if (n > 0 && soma / (3.0 * n) < 14) { tl.Save(Path.Combine(saida, String.Format("f{0:D5}_{1:D6}ms_t.jpg", q, t0)), enc, par); usouTela = true; }
            }
          }
          if (!usouTela) pw.Save(Path.Combine(saida, String.Format("f{0:D5}_{1:D6}ms_p.jpg", q, t0)), enc, par);
        }
      }
      if (abre != IntPtr.Zero) {
        // a tela de abertura é desenhada pelo próprio Giz (GDI): o PrintWindow dela é o que aparece na tela
        using (var ab = new Bitmap(ra.R - ra.L, ra.B - ra.T)) {
          using (var g = Graphics.FromImage(ab)) { IntPtr dc = g.GetHdc(); try { PrintWindow(abre, dc, 2); } finally { g.ReleaseHdc(dc); } }
          ab.Save(Path.Combine(saida, String.Format("f{0:D5}_{1:D6}ms_a_{2}_{3}.jpg", q, t0, ra.L - rt.L, ra.T - rt.T)), enc, par);
        }
      }
      csv.Flush(); q++;
      long resta = intervalo - (rel.ElapsedMilliseconds - t0);
      if (resta > 0) System.Threading.Thread.Sleep((int)resta);
    }
    // prova final: o que está na tela no fim do filme (a galeria carregou?)
    IntPtr fim = IntPtr.Zero; RECT rf = new RECT();
    EnumWindows((hw, l) => { if (fim != IntPtr.Zero || !IsWindowVisible(hw)) return true; uint pid; GetWindowThreadProcessId(hw, out pid);
      if (Nome(pid).ToLower() != "gizlivre") return true; RECT r; GetWindowRect(hw, out r); if (r.R - r.L > 50) { fim = hw; rf = r; } return true; }, IntPtr.Zero);
    try { Tela(fim, rf, w, h, Path.Combine(saida, "tela-final.jpg"), enc, par); } catch { }
    csv.Close();
    File.WriteAllText(Path.Combine(saida, "fim.txt"), q + ";" + rel.ElapsedMilliseconds + ";" + w + "x" + h);
  }
}
'@
}

# ---------- dentro da tarefa agendada: as 5 aberturas ----------
if ($Dentro) {
  # o gravador roda num processo à parte (-Rotulo gravar:<ms>)
  if ($Rotulo -like 'gravar:*') { Gravador; [FilmarGiz]::Rodar($Dentro, [int]($Rotulo.Split(':')[1]), 120); return }
  $P = $Dentro
  $log = Join-Path $P 'cenarios.log'
  function Nota($m) { Add-Content -Path $log -Value ((Get-Date -Format 'HH:mm:ss.fff') + ' ' + $m) -Encoding UTF8 }
  $exeT = Join-Path $P 'copia\GizLivre\GizLivre.exe'
  $dados = Join-Path $P 'dados'
  $env:GIZ_JANELA_DADOS = Join-Path $P 'perfil'
  $env:GIZ_SEM_CAIXAS = Join-Path $P 'caixas.txt'
  New-Item -ItemType Directory -Force $dados | Out-Null
  function Nossos { @(Get-Process -Name GizLivre -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path.StartsWith($P, 'OrdinalIgnoreCase') }) }
  function Alheios { @(Get-Process -Name GizLivre -ErrorAction SilentlyContinue | Where-Object { -not ($_.Path -and $_.Path.StartsWith($P, 'OrdinalIgnoreCase')) }) }
  function EsperarFechar([int]$s) { $f = (Get-Date).AddSeconds($s); while ((Nossos).Count -and (Get-Date) -lt $f) { Start-Sleep -Milliseconds 300 }; (Nossos).Count -eq 0 }
  Add-Type -TypeDefinition @'
using System; using System.Text; using System.Runtime.InteropServices;
public static class FecharGiz {
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  // WM_CLOSE em cada janela da lousa (o X de cada uma; a página grava e fecha). Só as "Tauri Window": o WM_CLOSE na
  // janela interna do Tao ("Tao Thread Event Target", também visível) quebra o laço de eventos e nada mais fecha
  public static void Todas(int alvo) { EnumWindows((h, l) => { uint pid; GetWindowThreadProcessId(h, out pid);
    var c = new StringBuilder(64); GetClassName(h, c, 64);
    if (pid == (uint)alvo && IsWindowVisible(h) && c.ToString() == "Tauri Window") PostMessage(h, 0x10, IntPtr.Zero, IntPtr.Zero); return true; }, IntPtr.Zero); }
}
'@
  function FecharDireito {
    for ($i = 0; $i -lt 3 -and (Nossos).Count; $i++) {
      foreach ($p in Nossos) { [FecharGiz]::Todas($p.Id) }
      [void](EsperarFechar 10)
    }
    if ((Nossos).Count) { Nota 'não fechou pelo X: Stop-Process pelo PID'; Nossos | Stop-Process -Force; [void](EsperarFechar 10) }
    Start-Sleep -Seconds 2
  }
  function Abrir { Start-Process -FilePath $exeT -ArgumentList '--dados', "`"$dados`"", '--porta', $Porta }
  function Filmar([string]$nome, [int]$ms) {
    $dir = Join-Path $P "cenas\$nome"; New-Item -ItemType Directory -Force $dir | Out-Null
    $g = Start-Process powershell -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"",
      '-Rotulo', "gravar:$ms", '-Dentro', "`"$dir`"") -WindowStyle Hidden -PassThru
    # espera o gravador começar (ele cria janelas.csv)
    $f = (Get-Date).AddSeconds(20); while (-not (Test-Path (Join-Path $dir 'janelas.csv')) -and (Get-Date) -lt $f) { Start-Sleep -Milliseconds 100 }
    Start-Sleep -Milliseconds 400
    Nota "$nome : abre (como o clique no atalho)"
    Add-Content (Join-Path $dir 'clique.txt') ([DateTime]::Now.ToString('o'))
    Abrir
    $g.WaitForExit(); Nota "$nome : filme terminou"
  }
  try {
    if ((Alheios).Count) { Nota "PARADO: há um Giz Livre aberto fora do teste (PID $((Alheios).Id -join ',')); nada foi feito"; return }
    Filmar 'c0-primeira' 16000
    try {
      $c = Get-Content (Join-Path $dados '.agente\conexao.json') -Raw | ConvertFrom-Json; $base = "http://127.0.0.1:$($c.porta)"
      foreach ($i in 1..12) {
        $itens = @(@{ id = "t$i"; type = 'text'; x = 80; y = 80; w = 900; text = "Aula $i - exemplo de quadro"; color = '#1f2937'; size = 48 },
                   @{ id = "u$i"; type = 'text'; x = 80; y = 220; w = 900; text = "Conteúdo de exemplo $i"; color = '#0078d4'; size = 32 })
        $corpo = @{ board = @{ version = 2; title = "Aula $i - exemplo"; background = @{ color = '#ffffff'; pattern = 'grid' }; view = $null; items = $itens }; revision = 0; criar = $true } | ConvertTo-Json -Depth 8
        Invoke-RestMethod -Method Put -Uri "$base/api/boards/aula$i" -Headers @{ 'X-Lousa' = $c.token } -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($corpo)) | Out-Null
      }
      Nota '12 quadros de exemplo criados'
    } catch { Nota "quadros de exemplo: $_" }
    FecharDireito
    Filmar 'c1-fria' 12000
    FecharDireito
    Filmar 'c1b-fria-de-novo' 12000
    Start-Sleep -Seconds 2
    Filmar 'c2-ja-aberto' 8000
    FecharDireito
    Abrir; Start-Sleep -Seconds 8
    Nota "queda: derrubando o GizLivre do teste pelo PID $((Nossos).Id -join ',')"
    Nossos | Stop-Process -Force
    Start-Sleep -Seconds 3
    Filmar 'c3-depois-da-queda' 12000
    FecharDireito
  } catch { Nota "erro: $_" }
  finally {
    $sobras = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -and $_.CommandLine.Contains("$P\copia") })
    foreach ($s in $sobras) { Nota "sobra encerrada: $($s.Name) $($s.ProcessId)"; Stop-Process -Id $s.ProcessId -Force -ErrorAction SilentlyContinue }
    Nota "fim; GizLivre do teste abertos: $((Nossos).Count)"
    Set-Content -Path (Join-Path $P 'pronto.txt') -Value 'ok'
  }
  return
}

# ---------- fora: monta a cópia de teste, roda a tarefa, faz o relatório ----------
if (-not $Exe) { throw 'falta -Exe' }
$Exe = (Resolve-Path $Exe).Path
if (-not $Portatil) { $Portatil = Join-Path $raiz 'build\rel119\GizLivre-1.19.0-portatil.zip' }
if (-not $Servidor) { $Servidor = $raiz }
$P = Join-Path $env:TEMP ("giz-abertura-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Force $P | Out-Null
Expand-Archive -Path $Portatil -DestinationPath (Join-Path $P 'copia')
$copia = Join-Path $P 'copia\GizLivre'
Copy-Item $Exe (Join-Path $copia 'GizLivre.exe') -Force
if ($Servidor -ne 'publicado') {   # 'publicado': o servidor e as páginas que vieram no portátil
  Copy-Item (Join-Path $Servidor 'server.py') (Join-Path $copia 'servidor\server.py') -Force
  Remove-Item -Recurse -Force (Join-Path $copia 'servidor\app')
  Copy-Item -Recurse (Join-Path $Servidor 'app') (Join-Path $copia 'servidor\app')
}
$cmd = Join-Path $P 'rodar.cmd'
Set-Content -Path $cmd -Encoding Ascii -Value "@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Porta $Porta -Dentro `"$P`""
$tarefa = 'GizFilmarAbertura'
& schtasks /create /tn $tarefa /tr $cmd /sc once /st 23:59 /it /f | Out-Null
& schtasks /run /tn $tarefa | Out-Null
$f = (Get-Date).AddMinutes(6)
while (-not (Test-Path (Join-Path $P 'pronto.txt')) -and (Get-Date) -lt $f) { Start-Sleep -Seconds 2 }
& schtasks /delete /tn $tarefa /f | Out-Null
$saida = Join-Path $raiz "build\evidencia\abertura-$Rotulo"
if (Test-Path $saida) { Get-ChildItem $saida | Remove-Item -Recurse -Force }   # o conteúdo: a pasta pode estar aberta em outro programa
New-Item -ItemType Directory -Force $saida | Out-Null
Copy-Item (Join-Path $P 'cenarios.log') $saida -ErrorAction SilentlyContinue
& python (Join-Path $PSScriptRoot 'filmar_abertura_relatorio.py') (Join-Path $P 'cenas') $saida
if ($Manter) { Copy-Item -Recurse (Join-Path $P 'cenas') (Join-Path $saida 'brutas') }
Remove-Item -Recurse -Force $P -ErrorAction SilentlyContinue
if (Test-Path $P) { Start-Sleep -Seconds 3; Remove-Item -Recurse -Force $P -ErrorAction SilentlyContinue }
Write-Output "relatório: $saida\relatorio.txt"
