# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Bateria num "PC limpo" (máquina nova do GitHub Actions; ver .github/workflows/pc-limpo.yml). NÃO rodar no PC de uso:
# instala, abre, atualiza e DESINSTALA o Giz Livre do usuário atual.
#   powershell -File tests\bateria\pc_limpo.ps1 -Versao 1.15.2 -Anterior 1.15.1 -Saida <pasta de artefatos>
# Passos: instala a versão ANTERIOR em silêncio → cria um quadro → abre com janela e vigia 5 min (programa, janela,
# conexões de rede, captura de tela) → atualiza pelo Sobre para a versão testada, com o GitHub real → confere a lista do
# Windows → desinstala → confere que o quadro ficou. Sai com código 1 se algo falhar; o relatório fica em <Saida>.
param([Parameter(Mandatory)][string]$Versao, [Parameter(Mandatory)][string]$Anterior, [string]$Saida = "$PWD\pc-limpo",
      [string]$Repo = 'HeraldoAntunes/giz-livre', [int]$Minutos = 5)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $Saida | Out-Null
$rel = Join-Path $Saida 'relatorio.md'
$falhas = 0
function Linha($ok, $txt) { $m = $(if ($ok) { '✓' } else { '✗' }) + " $txt"; Add-Content $rel $m -Encoding utf8; Write-Host $m; if (-not $ok) { $script:falhas++ } }
function Lista() { (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\{6F1B6C2E-4D7A-4E2B-9B8D-3A5C1E7F0A21}_is1' -ErrorAction SilentlyContinue).DisplayVersion }
function Info() { try { Invoke-RestMethod http://127.0.0.1:8765/api/info -TimeoutSec 3 } catch { $null } }
function Captura($nome) {
  try {
    Add-Type -AssemblyName System.Windows.Forms, System.Drawing
    $t = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $b = New-Object System.Drawing.Bitmap $t.Width, $t.Height
    $g = [System.Drawing.Graphics]::FromImage($b); $g.CopyFromScreen($t.Location, [System.Drawing.Point]::Empty, $t.Size)
    $b.Save((Join-Path $Saida "$nome.png")); $g.Dispose(); $b.Dispose()
  } catch { Write-Host "sem captura de tela ($nome): $($_.Exception.Message)" }   # máquina sem área de trabalho
}
Set-Content $rel "# PC limpo: Giz Livre $Anterior → $Versao ($([Environment]::OSVersion.VersionString), $(Get-Date -Format 'yyyy-MM-dd HH:mm'))`n" -Encoding utf8
$exe = "$env:LOCALAPPDATA\Programs\Giz Livre\GizLivre.exe"
$dados = "$([Environment]::GetFolderPath('MyDocuments'))\Giz Livre\quadros"

# 1. instalar a anterior, em silêncio e sem administrador (o instalador é por usuário)
$tmp = Join-Path $env:RUNNER_TEMP 'giz-instaladores'; New-Item -ItemType Directory -Force $tmp | Out-Null
gh release download "v$Anterior" --repo $Repo -p "Instalar-GizLivre-$Anterior.exe" -D $tmp --clobber
$p = Start-Process "$tmp\Instalar-GizLivre-$Anterior.exe" -ArgumentList '/SILENT', '/CURRENTUSER', '/NORESTART', '/SUPPRESSMSGBOXES', "/LOG=$Saida\instalar-$Anterior.log" -PassThru -Wait
Linha ($p.ExitCode -eq 0 -and (Test-Path $exe)) "instalador $Anterior em silêncio (saída $($p.ExitCode))"
Linha ((Lista) -eq $Anterior) "lista do Windows mostra $(Lista)"

# 2. abrir com janela; criar um quadro; vigiar
$g = Start-Process $exe -PassThru; $info = $null
for ($i = 0; $i -lt 60 -and -not $info; $i++) { Start-Sleep 1; $info = Info }
Linha ([bool]$info) "programa abre e responde (versão $($info.versao))"
$q = @{ board = @{ title = 'Quadro do PC limpo'; items = @(@{ type = 'text'; id = 't1'; x = 100; y = 100; text = 'teste' }) }; revision = 0 } | ConvertTo-Json -Depth 6
Invoke-RestMethod -Method Put -Uri http://127.0.0.1:8765/api/boards/pclimpo1 -Headers @{ 'X-Lousa' = $info.token } -ContentType 'application/json' -Body $q | Out-Null
Linha (Test-Path "$dados\pclimpo1.json") "quadro gravado em $dados"
Start-Sleep 15; Captura 'janela-aberta'
$fim = (Get-Date).AddMinutes($Minutos); $semJanela = 0; $caiu = 0; $externas = @()
while ((Get-Date) -lt $fim) {
    $prog = Get-Process GizLivre -ErrorAction SilentlyContinue
    if (-not $prog) { $caiu++ }
    $jan = Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" | Where-Object { $_.CommandLine -match '--app=http://127\.0\.0\.1:8765' }
    if (-not $jan) { $semJanela++ }
    # conexões do programa: só pode haver a porta local (127.0.0.1); nada para fora sem o professor pedir
    if ($prog) { $externas += Get-NetTCPConnection -OwningProcess ($prog.Id) -ErrorAction SilentlyContinue |
        Where-Object { $_.RemoteAddress -notin '127.0.0.1', '0.0.0.0', '::', '::1' } | ForEach-Object { "$($_.RemoteAddress):$($_.RemotePort)" } }
    Start-Sleep 20
}
Linha ($caiu -eq 0) "programa vivo os $Minutos min"
Linha ($semJanela -eq 0) "janela viva os $Minutos min (verificações sem janela: $semJanela)"
Linha (-not $externas) "nenhuma conexão de rede para fora com o programa parado (achadas: $(($externas | Sort-Object -Unique) -join ', '))"
Captura 'depois-de-5-min'

# 3. atualizar pelo Sobre, com o GitHub real (mesmo teste A2 da bateria)
Push-Location (Split-Path $PSScriptRoot -Parent | Split-Path -Parent)
node tests/bateria/a2_atualizar_de_verdade.mjs 8765 $Versao 2>&1 | Tee-Object -FilePath "$Saida\a2.txt" | Write-Host
$a2 = $LASTEXITCODE; Pop-Location
Linha ($a2 -eq 0) "Baixar e instalar pelo Sobre: $Anterior → $Versao (detalhes em a2.txt)"
Start-Sleep 10
Linha ((Lista) -eq $Versao) "lista do Windows depois da atualização: $(Lista)"
Linha ((Info).versao -eq $Versao) "programa reaberto na $Versao"
Captura 'depois-de-atualizar'
Copy-Item "$([Environment]::GetFolderPath('MyDocuments'))\Giz Livre\*.log" $Saida -ErrorAction SilentlyContinue

# 4. desinstalar e conferir que o quadro ficou
Get-Process GizLivre -ErrorAction SilentlyContinue | Stop-Process -Force
Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" | Where-Object { $_.CommandLine -match 'Giz Livre.navegador-' -and $_.CommandLine -notmatch '--type=' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Start-Sleep 3
$u = Start-Process "$env:LOCALAPPDATA\Programs\Giz Livre\unins000.exe" -ArgumentList '/SILENT', '/NORESTART', '/SUPPRESSMSGBOXES' -PassThru -Wait
Start-Sleep 3
Linha ($u.ExitCode -eq 0 -and -not (Test-Path $exe) -and -not (Lista)) "desinstalado (programa e linha da lista removidos)"
Linha (Test-Path "$dados\pclimpo1.json") "o quadro continua depois de desinstalar"

Add-Content $rel "`n$(if ($falhas) { "**$falhas falha(s)**" } else { '**Tudo passou**' })" -Encoding utf8
exit [int]($falhas -gt 0)
