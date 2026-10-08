; Instalador do Giz Livre (Inno Setup 6). Gerado por installer\build.ps1.
#define AppVer "1.0.1"
#define Dist "..\build\dist\GizLivre"

[Setup]
AppId={{6F1B6C2E-4D7A-4E2B-9B8D-3A5C1E7F0A21}
AppName=Giz Livre
AppVersion={#AppVer}
AppVerName=Giz Livre {#AppVer}
AppPublisher=Heraldo Antunes (projeto livre)
AppCopyright=Copyright (c) 2026 Heraldo Antunes - Licença MIT
VersionInfoVersion={#AppVer}.0
VersionInfoDescription=Instalador do Giz Livre
; instalação só para o usuário: não pede administrador
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
DefaultDirName={autopf}\Giz Livre
DefaultGroupName=Giz Livre
DisableProgramGroupPage=yes
LicenseFile=licenca-instalador.txt
SetupIconFile=lousa.ico
UninstallDisplayIcon={app}\GizLivre.exe
UninstallDisplayName=Giz Livre {#AppVer}
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
Compression=lzma2/max
SolidCompression=yes
CloseApplications=yes
OutputDir=..\dist
OutputBaseFilename=Instalar-GizLivre-{#AppVer}

[Languages]
Name: "ptbr"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na Área de Trabalho"; GroupDescription: "Atalhos:"

[Files]
Source: "{#Dist}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\THIRD-PARTY-NOTICES.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\docs\GUIA-DE-USO.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\Giz Livre"; Filename: "{app}\GizLivre.exe"; Comment: "Lousa livre e offline para aulas"
Name: "{autoprograms}\Giz Livre - pasta dos quadros"; Filename: "{userdocs}\Giz Livre\quadros"
Name: "{autodesktop}\Giz Livre"; Filename: "{app}\GizLivre.exe"; Tasks: desktopicon

[Dirs]
Name: "{userdocs}\Giz Livre\quadros"; Flags: uninsneveruninstall

[Run]
Filename: "{app}\GizLivre.exe"; Description: "Abrir o Giz Livre agora"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{sys}\taskkill.exe"; Parameters: "/IM GizLivre.exe /F"; Flags: runhidden; RunOnceId: "FecharLousa"

[Messages]
ptbr.WelcomeLabel2=Este assistente vai instalar a [name/ver] no seu computador.%n%nÉ um programa livre e gratuito (licença MIT), que funciona sem internet. Seus quadros ficam em Documentos\Giz Livre\quadros e são mantidos se você desinstalar.
