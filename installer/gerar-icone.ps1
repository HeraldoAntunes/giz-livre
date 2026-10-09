# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Gera installer\lousa.ico (16–256 px) desenhando o ícone do Giz Livre (quadro azul, folha branca, traço vermelho).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$saida = Join-Path $PSScriptRoot 'lousa.ico'
$pngs = @()
foreach ($n in 16, 24, 32, 48, 64, 128, 256) {
  $bmp = New-Object System.Drawing.Bitmap $n, $n
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.Clear([System.Drawing.Color]::Transparent)
  $k = $n / 64.0
  function RR($x, $y, $w, $h, $r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddArc($x, $y, 2*$r, 2*$r, 180, 90); $p.AddArc($x+$w-2*$r, $y, 2*$r, 2*$r, 270, 90)
    $p.AddArc($x+$w-2*$r, $y+$h-2*$r, 2*$r, 2*$r, 0, 90); $p.AddArc($x, $y+$h-2*$r, 2*$r, 2*$r, 90, 90); $p.CloseFigure(); $p
  }
  $azul = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15,108,189))
  $g.FillPath($azul, (RR (4*$k) (8*$k) (56*$k) (44*$k) (8*$k)))
  $g.FillPath([System.Drawing.Brushes]::White, (RR (9*$k) (13*$k) (46*$k) (34*$k) (4*$k)))
  $g.FillRectangle($azul, 26*$k, 52*$k, 12*$k, 6*$k)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(232,18,36)), ([Math]::Max(1.5, 4*$k))
  $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
  $g.DrawBezier($pen, 15*$k, 38*$k, 22*$k, 20*$k, 32*$k, 46*$k, 49*$k, 22*$k)
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $pngs += ,@($n, $ms.ToArray())
  $g.Dispose(); $bmp.Dispose()
}
# monta o .ico (entradas PNG)
$fs = [System.IO.File]::Create($saida)
$bw = New-Object System.IO.BinaryWriter $fs
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$pngs.Count)
$off = 6 + 16 * $pngs.Count
foreach ($e in $pngs) {
  $n = $e[0]; $d = $e[1]
  $bw.Write([byte]($(if ($n -ge 256) {0} else {$n}))); $bw.Write([byte]($(if ($n -ge 256) {0} else {$n})))
  $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([UInt16]1); $bw.Write([UInt16]32)
  $bw.Write([UInt32]$d.Length); $bw.Write([UInt32]$off); $off += $d.Length
}
foreach ($e in $pngs) { $bw.Write([byte[]]$e[1]) }
$bw.Close()
"ícone gerado: $saida ($((Get-Item $saida).Length) bytes)"
