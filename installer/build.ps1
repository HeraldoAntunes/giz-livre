# Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
# Gera o executável (PyInstaller) e o instalador (Inno Setup) do Giz Livre, verifica no Microsoft Defender
# e escreve dist\SHA256SUMS.txt.  Uso:  powershell -ExecutionPolicy Bypass -File installer\build.ps1
# No GitHub Actions (workflow montar-release.yml): build.ps1 -CI usa o Python do setup-python e o pip em vez do uv,
# e pula o Defender (fica para a conferência do instalador baixado da release, no PC do professor).
param([switch]$CI)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path $PSScriptRoot -Parent
Set-Location $raiz
$versao = '1.14.2'

# 1) ambiente de build dedicado, recriado do zero, com dependências fixadas por hash
$py313 = if ($CI) { (Get-Command python).Source } else { Join-Path $env:LOCALAPPDATA 'Programs\Python\Python313\python.exe' }
Remove-Item -Recurse -Force .venv-build -ErrorAction SilentlyContinue
if ($CI) {
  & $py313 -m venv .venv-build | Out-Host
  & .venv-build\Scripts\python.exe -m pip install --disable-pip-version-check --no-deps --require-hashes -r installer\requirements-build.txt | Out-Host
  if ($LASTEXITCODE) { throw 'pip não instalou as ferramentas de build' }
} else {
  uv venv .venv-build --python $py313 | Out-Host
  uv pip install --python .venv-build\Scripts\python.exe --require-hashes -r installer\requirements-build.txt | Out-Host
}
if ((& .venv-build\Scripts\python.exe -c "import sys; print(sys.version_info[:2] == (3, 13))") -ne 'True') { throw 'o build precisa do Python 3.13' }
$pyver = & .venv-build\Scripts\python.exe -c "import sys; print(sys.version.split()[0])"

# 2) executável em pasta (onedir: menos alarmes falsos que onefile), sem UPX, sem console,
#    sem módulos que o programa não usa (compressões e decimal: menos código embutido e menos licenças de terceiros).
#    O ssl (OpenSSL) entra desde a 1.10.0: a atualização pelo programa baixa a versão nova do GitHub por HTTPS.
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
$excluir = '_bz2', 'bz2', '_lzma', 'lzma', '_decimal', 'decimal', 'tkinter', 'unittest', 'pydoc'
$pyiArgs = @('--noconfirm', '--clean', '--onedir', '--windowed', '--noupx', '--name', 'GizLivre',
  '--icon', "$raiz\installer\lousa.ico", '--version-file', "$raiz\installer\versao.txt",
  '--add-data', "$raiz\app;app", '--distpath', 'build\dist', '--workpath', 'build\work', '--specpath', 'build')
foreach ($m in $excluir) { $pyiArgs += @('--exclude-module', $m) }
& .venv-build\Scripts\pyinstaller.exe @pyiArgs server.py | Out-Host
$dist = 'build\dist\GizLivre'
if (-not (Test-Path "$dist\GizLivre.exe")) { throw 'PyInstaller não gerou o executável' }
# a atualização pelo programa precisa de HTTPS: sem o módulo ssl no pacote, a procura de versão nova falha
if (-not (Get-ChildItem "$dist\_internal" -Filter '_ssl*.pyd' -ErrorAction SilentlyContinue)) { throw 'o pacote ficou sem o módulo ssl (HTTPS)' }

# licenças que acompanham o pacote
New-Item -ItemType Directory -Force "$dist\licencas" | Out-Null
Copy-Item LICENSE, THIRD-PARTY-NOTICES.md $dist
Copy-Item docs\LICENCA-traducao-pt-BR.md $dist   # tradução informativa da licença (o LICENSE fica só com o texto MIT oficial)
Copy-Item (Join-Path (Split-Path $py313) 'LICENSE.txt') "$dist\licencas\python-LICENSE.txt"
Copy-Item app\vendor\pdfjs\LICENSE "$dist\licencas\pdfjs-LICENSE.txt"
# OpenSSL 3 (libssl e libcrypto, junto com o módulo ssl do Python): Apache License 2.0, o mesmo texto do pdf.js
Set-Content "$dist\licencas\openssl-LICENSE.txt" -Encoding UTF8 -Value (("OpenSSL 3 (libssl e libcrypto), usado pela atualização do Giz Livre (HTTPS).",
  "Copyright (c) 1998-2025 The OpenSSL Project Authors. Copyright (c) 1995-1998 Eric A. Young, Tim J. Hudson.",
  "Licenciado sob a Apache License 2.0, reproduzida abaixo. https://www.openssl.org/source/license.html", '') + (Get-Content app\vendor\pdfjs\LICENSE))
Copy-Item app\vendor\pdfjs\OPENJPEG-LICENSE.txt "$dist\licencas\openjpeg-LICENSE.txt"
Copy-Item app\vendor\katex\LICENSE "$dist\licencas\katex-LICENSE.txt"
Copy-Item app\vendor\katex\fonts\OFL.txt "$dist\licencas\katex-fontes-OFL.txt"
Copy-Item app\vendor\fluent\LICENSE "$dist\licencas\fluent-icons-LICENSE.txt"
Copy-Item (Get-ChildItem .venv-build\Lib\site-packages\pyinstaller-*.dist-info -Recurse -Filter COPYING.txt | Select-Object -First 1).FullName "$dist\licencas\pyinstaller-COPYING.txt"

# outros ícones, para quem quiser trocar o do atalho (Propriedades → Alterar ícone); os desenhos-fonte ficam em
# installer\icones\svg e não vão no pacote
New-Item -ItemType Directory -Force "$dist\icones" | Out-Null
Copy-Item installer\icones\*.ico, installer\icones\LEIA-ME.txt "$dist\icones"

# 3) instalador
$iscc = @("$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe", "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iscc) { throw 'Inno Setup 6 não encontrado' }
Copy-Item (Join-Path (Split-Path $iscc) 'license.txt') "$dist\licencas\innosetup-license.txt"
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

# 5) verificação no Microsoft Defender (0 = nada encontrado; 2 = ameaça); no CI o Defender dos servidores do GitHub não
#    é confiável, então ela fica para quando o professor baixa e confere o instalador da release
$mp = "$env:ProgramFiles\Windows Defender\MpCmdRun.exe"
foreach ($alvo in $(if ($CI) { @() } else { @((Resolve-Path $inst).Path, (Resolve-Path $zip).Path, (Resolve-Path $dist).Path) })) {
  $r = & $mp -Scan -ScanType 3 -File $alvo -DisableRemediation 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { throw "Defender acusou algo (código $LASTEXITCODE) em $alvo`n$r" }
  "Defender OK: $alvo"
}

# 6) hashes para conferência + versões das ferramentas usadas
$linhas = Get-ChildItem dist -File | Where-Object Name -ne 'SHA256SUMS.txt' | ForEach-Object {
  "{0}  {1}" -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(), $_.Name
}
$onde = if ($CI) { "GitHub Actions, commit $env:GITHUB_SHA" } else { 'PC do mantenedor' }
$linhas += "# Giz Livre $versao - Python $pyver - PyInstaller 6.22.3 - Inno Setup 6.7.3 - gerado em $(Get-Date -Format 'yyyy-MM-dd') ($onde)"
$linhas | Set-Content dist\SHA256SUMS.txt -Encoding ASCII
Get-Content dist\SHA256SUMS.txt
