# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Gera o executável (PyInstaller) e o instalador (Inno Setup) do Giz Livre, verifica no Microsoft Defender
# e escreve dist\SHA256SUMS.txt.  Uso:  powershell -ExecutionPolicy Bypass -File installer\build.ps1
$ErrorActionPreference = 'Stop'
$raiz = Split-Path $PSScriptRoot -Parent
Set-Location $raiz
$versao = '1.2.1'

# 1) ambiente de build dedicado, recriado do zero, com dependências fixadas por hash
$py313 = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python313\python.exe'
Remove-Item -Recurse -Force .venv-build -ErrorAction SilentlyContinue
uv venv .venv-build --python $py313 | Out-Host
uv pip install --python .venv-build\Scripts\python.exe --require-hashes -r installer\requirements-build.txt | Out-Host
$pyver = & .venv-build\Scripts\python.exe -c "import sys; print(sys.version.split()[0])"

# 2) executável em pasta (onedir: menos alarmes falsos que onefile), sem UPX, sem console,
#    sem módulos que o programa não usa (SSL, compressões e decimal: menos código embutido e menos licenças de terceiros)
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
$excluir = 'ssl', '_ssl', '_hashlib', '_bz2', 'bz2', '_lzma', 'lzma', '_decimal', 'decimal', 'tkinter', 'unittest', 'pydoc'
$pyiArgs = @('--noconfirm', '--clean', '--onedir', '--windowed', '--noupx', '--name', 'GizLivre',
  '--icon', "$raiz\installer\lousa.ico", '--version-file', "$raiz\installer\versao.txt",
  '--add-data', "$raiz\app;app", '--distpath', 'build\dist', '--workpath', 'build\work', '--specpath', 'build')
foreach ($m in $excluir) { $pyiArgs += @('--exclude-module', $m) }
& .venv-build\Scripts\pyinstaller.exe @pyiArgs server.py | Out-Host
$dist = 'build\dist\GizLivre'
if (-not (Test-Path "$dist\GizLivre.exe")) { throw 'PyInstaller não gerou o executável' }

# licenças que acompanham o pacote
New-Item -ItemType Directory -Force "$dist\licencas" | Out-Null
Copy-Item LICENSE, THIRD-PARTY-NOTICES.md $dist
Copy-Item (Join-Path (Split-Path $py313) 'LICENSE.txt') "$dist\licencas\python-LICENSE.txt"
Copy-Item app\vendor\pdfjs\LICENSE "$dist\licencas\pdfjs-LICENSE.txt"
Copy-Item app\vendor\pdfjs\OPENJPEG-LICENSE.txt "$dist\licencas\openjpeg-LICENSE.txt"
Copy-Item app\vendor\katex\LICENSE "$dist\licencas\katex-LICENSE.txt"
Copy-Item app\vendor\katex\fonts\OFL.txt "$dist\licencas\katex-fontes-OFL.txt"
Copy-Item app\vendor\fluent\LICENSE "$dist\licencas\fluent-icons-LICENSE.txt"

# 3) instalador
$iscc = @("$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe", "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iscc) { throw 'Inno Setup 6 não encontrado' }
New-Item -ItemType Directory -Force dist | Out-Null
Remove-Item dist\* -Force -ErrorAction SilentlyContinue
& $iscc /Qp installer\lousa.iss | Out-Host
$inst = "dist\Instalar-GizLivre-$versao.exe"
if (-not (Test-Path $inst)) { throw 'Inno Setup não gerou o instalador' }

# 4) versão portátil (com portatil.txt os quadros ficam na pasta quadros ao lado do programa)
Set-Content "$dist\portatil.txt" 'Com este arquivo presente, os quadros ficam na pasta quadros ao lado do GizLivre.exe.' -Encoding UTF8
$zip = "dist\GizLivre-$versao-portatil.zip"
Compress-Archive -Path "$dist\*" -DestinationPath $zip
Remove-Item "$dist\portatil.txt"

# 5) verificação no Microsoft Defender (0 = nada encontrado; 2 = ameaça)
$mp = "$env:ProgramFiles\Windows Defender\MpCmdRun.exe"
foreach ($alvo in @((Resolve-Path $inst).Path, (Resolve-Path $zip).Path, (Resolve-Path $dist).Path)) {
  $r = & $mp -Scan -ScanType 3 -File $alvo -DisableRemediation 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { throw "Defender acusou algo (código $LASTEXITCODE) em $alvo`n$r" }
  "Defender OK: $alvo"
}

# 6) hashes para conferência + versões das ferramentas usadas
$linhas = Get-ChildItem dist -File | Where-Object Name -ne 'SHA256SUMS.txt' | ForEach-Object {
  "{0}  {1}" -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(), $_.Name
}
$linhas += "# Giz Livre $versao - Python $pyver - PyInstaller 6.11.1 - Inno Setup 6.7.3 - gerado em $(Get-Date -Format 'yyyy-MM-dd')"
$linhas | Set-Content dist\SHA256SUMS.txt -Encoding ASCII
Get-Content dist\SHA256SUMS.txt
