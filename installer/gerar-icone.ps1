# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Gera installer\lousa.ico (16–256 px) desenhando o ícone do Giz Livre (lousa verde com moldura de madeira, traço e
# bastão de giz brancos; o mesmo desenho de app\icon.svg, escolhido pelo professor em 23/10/2026).
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
  $cor = { param($r, $gg, $b) New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($r, $gg, $b)) }
  $giz = [System.Drawing.Color]::FromArgb(246,242,231); $gizSombra = [System.Drawing.Color]::FromArgb(207,198,176)
  $g.FillPath((& $cor 138 90 43), (RR (3*$k) (8*$k) (58*$k) (44*$k) (6*$k)))      # moldura de madeira
  $g.FillPath((& $cor 46 94 72), (RR (7*$k) (12*$k) (50*$k) (34*$k) (3*$k)))      # lousa verde
  $g.FillPath((& $cor 109 69 32), (RR (9*$k) (47*$k) (46*$k) (5*$k) (1.5*$k)))    # porta-giz
  $pen = New-Object System.Drawing.Pen $giz, ([Math]::Max(1.5, 3.6*$k))
  $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
  # traço a giz: M11 41 c6-13 10-16 14-11 s5 4 9-4 (as duas curvas do app\icon.svg)
  $g.DrawBezier($pen, 11*$k, 41*$k, 17*$k, 28*$k, 21*$k, 25*$k, 25*$k, 30*$k)
  $g.DrawBezier($pen, 25*$k, 30*$k, 29*$k, 35*$k, 30*$k, 34*$k, 34*$k, 26*$k)
  # bastão de giz com a ponta gasta no fim do traço, subindo para a direita (girado -48 graus em torno do centro)
  $g.TranslateTransform(41.4*$k, 17.8*$k); $g.RotateTransform(-48)
  $corpo = RR (-11*$k) (-3.25*$k) (22*$k) (6.5*$k) (2.7*$k)
  $g.FillPath((New-Object System.Drawing.SolidBrush $giz), $corpo)
  $g.DrawPath((New-Object System.Drawing.Pen $gizSombra, ([Math]::Max(0.6, 1*$k))), $corpo)
  $g.FillPath((New-Object System.Drawing.SolidBrush $gizSombra), (RR (-11*$k) (-3.25*$k) (5.85*$k) (6.5*$k) (2.7*$k)))
  $g.ResetTransform()
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
