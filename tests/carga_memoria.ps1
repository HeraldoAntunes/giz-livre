# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Memória dos processos de um teste de carga: árvore do Edge, servidor e seus filhos, PowerPoint e LibreOffice.
# Sem -Intervalo mede uma vez e escreve uma linha JSON; com -Intervalo acrescenta uma linha a -Saida a cada intervalo.
param([int]$Edge = 0, [int]$Servidor = 0, [string]$Saida = '', [int]$Intervalo = 0)

function Arvore($todos, [int]$raiz) {
  $ids = @($raiz); $fila = @($raiz)
  while ($fila.Count) {
    $p = $fila[0]; $fila = @($fila | Select-Object -Skip 1)
    foreach ($f in $todos) { if ($f.ParentProcessId -eq $p -and $ids -notcontains $f.ProcessId) { $ids += $f.ProcessId; $fila += $f.ProcessId } }
  }
  return @($todos | Where-Object { $ids -contains $_.ProcessId })
}
function Soma($lista, $campo) { $s = ($lista | Measure-Object $campo -Sum).Sum; if ($s) { [int64]$s } else { 0 } }

function Medir {
  $todos = @(Get-CimInstance Win32_Process -Property ProcessId, ParentProcessId, Name, WorkingSetSize, PrivatePageCount)
  $edge = if ($Edge) { Arvore $todos $Edge } else { @() }
  $srv = if ($Servidor) { Arvore $todos $Servidor } else { @() }
  $ppt = @($todos | Where-Object { $_.Name -eq 'POWERPNT.EXE' })
  $lo = @($todos | Where-Object { $_.Name -like 'soffice*' })
  [pscustomobject]@{
    t = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    edgeN = $edge.Count; edgePriv = (Soma $edge 'PrivatePageCount'); edgeWS = (Soma $edge 'WorkingSetSize')
    srvPriv = (Soma $srv 'PrivatePageCount'); srvWS = (Soma $srv 'WorkingSetSize')
    pptPriv = (Soma $ppt 'PrivatePageCount'); loPriv = (Soma $lo 'PrivatePageCount')
  } | ConvertTo-Json -Compress
}

if ($Intervalo -gt 0) { while ($true) { Medir | Add-Content -Path $Saida -Encoding utf8; Start-Sleep -Milliseconds $Intervalo } }
else { Medir }
