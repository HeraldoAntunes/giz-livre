# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Bateria, C1: com o Giz Livre instalado aberto (com janela), vigia por N minutos se o programa e a janela continuam,
# e se a DLL do Warsaw (wslbdhm64.dll) entrou no processo do programa. Só lê; não fecha nada.
#   powershell -File tests\bateria\c1_vigiar.ps1 -Minutos 30
param([int]$Minutos = 30, [int]$Porta = 8765)
$fim = (Get-Date).AddMinutes($Minutos); $quedas = 0; $semJanela = 0; $voltas = 0
while ((Get-Date) -lt $fim) {
    $voltas++
    # só olha os processos: um pedido ao programa contaria como sinal de vida e esconderia o vigia
    $vivo = [bool](Get-Process GizLivre -ErrorAction SilentlyContinue)
    $janelas = Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" |
        Where-Object { $_.CommandLine -match "--app=http://127\.0\.0\.1:$Porta" } |
        ForEach-Object { "$($_.Name)#$($_.ProcessId)" + $(if ($_.CommandLine -match 'user-data-dir') { '(perfil próprio)' } else { '' }) }
    $prog = Get-Process GizLivre -ErrorAction SilentlyContinue
    $warsaw = $prog | ForEach-Object { try { $_.Modules | Where-Object ModuleName -match 'wslbdhm' } catch {} }
    if (-not $vivo) { $quedas++ }
    if (-not $janelas) { $semJanela++ }
    "{0:HH:mm:ss} programa={1} janela={2} warsaw_no_programa={3}" -f (Get-Date), $(if ($vivo) { 'vivo' } else { 'CAIU' }),
        $(if ($janelas) { $janelas -join ',' } else { 'NENHUMA' }), $(if ($warsaw) { 'SIM' } else { 'não' })
    Start-Sleep 60
}
"RESUMO: $voltas verificações; programa fora do ar em $quedas; sem janela em $semJanela"
