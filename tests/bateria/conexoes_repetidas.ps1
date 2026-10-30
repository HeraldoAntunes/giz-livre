# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Conexões da janela própria com o rigor de _Ferramentas/programas-livres/WEBVIEW2-REDE.md: várias aberturas, cada uma
# com janela longa, num perfil do WebView2 de rascunho já usado uma vez antes (nunca o perfil do professor) e quadros
# temporários. A cada leitura (0,7 s), o processo principal do WebView2 do perfil tem de ser filho do GizLivre.exe
# medido; se não for, a rodada é marcada como contaminada. Mede a janela, o WebView2 do perfil e o servidor (pythonw).
# Só encerra os processos que abriu. Uso: tests\bateria\conexoes_repetidas.ps1 -Pasta <pasta com GizLivre.exe>
#   [-Repeticoes 5] [-Minutos 10]
param([Parameter(Mandatory)] [string]$Pasta, [int]$Repeticoes = 5, [int]$Minutos = 10)
$exe = Join-Path $Pasta 'GizLivre.exe'
$tmp = Join-Path $env:TEMP ("giz-conexoes-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
$dados = Join-Path $tmp 'quadros'; $perfil = Join-Path $tmp 'perfil'
New-Item -ItemType Directory -Force $dados | Out-Null
$env:GIZ_JANELA_DADOS = $perfil; $env:GIZ_SEM_CAIXAS = Join-Path $tmp 'caixas.txt'
function DoPerfil { @(Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'" | Where-Object { $_.CommandLine -like "*$perfil*" }) }
function Filhos($id) { @(Get-CimInstance Win32_Process -Filter "ParentProcessId=$id") }
function Encerrar($id) {
  $ids = @($id) + @(Filhos $id | ForEach-Object { [int]$_.ProcessId }) + @(DoPerfil | ForEach-Object { [int]$_.ProcessId })
  foreach ($i in $ids) { Stop-Process -Id $i -Force -ErrorAction SilentlyContinue }
}
$abrir = { Start-Process $exe -ArgumentList '--dados', "`"$dados`"", '--porta', '8455' -PassThru }

# uma abertura curta antes: o perfil fica "usado" e o exe deixa de ser recém-copiado
$p = & $abrir; Start-Sleep 15; Encerrar $p.Id; Start-Sleep 5
$falhas = 0
for ($k = 1; $k -le $Repeticoes; $k++) {
  for ($t = 0; $t -lt 30 -and (DoPerfil).Count; $t++) { Start-Sleep 1 }
  if ((DoPerfil).Count) { "rodada ${k}: PULADA, outro WebView2 usa o perfil"; $falhas++; continue }
  $p = & $abrir
  $t0 = Get-Date; $fim = $t0.AddMinutes($Minutos)
  $primeira = $null; $enderecos = @{}; $contaminada = $false
  while ((Get-Date) -lt $fim) {
    Start-Sleep -Milliseconds 700
    $motor = DoPerfil
    $principal = @($motor | Where-Object { $_.CommandLine -notmatch '--type=' })
    if ($principal | Where-Object { $_.ParentProcessId -ne $p.Id }) { $contaminada = $true }
    $ids = @($p.Id) + @(Filhos $p.Id | ForEach-Object { [int]$_.ProcessId }) + @($motor | ForEach-Object { [int]$_.ProcessId })
    $fora = @(Get-NetTCPConnection -OwningProcess $ids -ErrorAction SilentlyContinue | Where-Object {
      $_.State -eq 'Established' -and $_.RemoteAddress -notmatch '^(127\.|::1$|0\.0\.0\.0$|::$)' })
    foreach ($c in $fora) {
      $enderecos["$($c.RemoteAddress):$($c.RemotePort)"] = 1
      if (-not $primeira) { $primeira = [int]((Get-Date) - $t0).TotalSeconds }
    }
  }
  Encerrar $p.Id; Start-Sleep 5
  $txt = if ($enderecos.Count) { $falhas++; "CONECTOU aos $primeira s: $($enderecos.Keys -join ', ')" } else { 'nenhuma conexão para fora' }
  "rodada ${k} ($Minutos min): $txt$(if ($contaminada) { ' (CONTAMINADA: WebView2 de outro pai no perfil)' })"
}
$caixas = Join-Path $tmp 'caixas.txt'
if (Test-Path $caixas) { "caixas do programa: $(Get-Content $caixas -Raw)"; $falhas++ }
if (-not $env:GIZ_MANTER) { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }
"$($Repeticoes - $falhas) de $Repeticoes rodadas sem conexão para fora"
exit $(if ($falhas) { 1 } else { 0 })
