; Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
; Instalador do Giz Livre (Inno Setup 6). Compilado por installer\build.ps1.
#define AppVer "1.2.1"
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
; AppUserModelID igual ao que o server.py põe na janela: o pino da barra de tarefas fica com o Giz Livre, não com o Edge
Name: "{autoprograms}\Giz Livre"; Filename: "{app}\GizLivre.exe"; Comment: "Lousa livre e offline para aulas"; AppUserModelID: "GizLivre"
Name: "{autoprograms}\Giz Livre - pasta dos quadros"; Filename: "{userdocs}\Giz Livre\quadros"
Name: "{autoprograms}\Desinstalar o Giz Livre"; Filename: "{uninstallexe}"; Comment: "Remove o programa; os quadros ficam guardados"
Name: "{autodesktop}\Giz Livre"; Filename: "{app}\GizLivre.exe"; Tasks: desktopicon; AppUserModelID: "GizLivre"

[Dirs]
Name: "{userdocs}\Giz Livre\quadros"; Flags: uninsneveruninstall

[Run]
Filename: "{app}\GizLivre.exe"; Description: "Abrir o Giz Livre agora"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{sys}\taskkill.exe"; Parameters: "/IM GizLivre.exe /F"; Flags: runhidden; RunOnceId: "FecharLousa"

[Messages]
; a tradução padrão do Inno usa "pra"; aqui fica a forma "para"
ptbr.SetupAppRunningError=O instalador detectou que o %1 está atualmente em execução.%n%nPor favor feche todas as instâncias dele agora, então clique em OK para continuar ou em Cancelar para sair.
ptbr.UninstallAppRunningError=O Desinstalador detectou que o %1 está atualmente em execução.%n%nPor favor feche todas as instâncias dele agora, então clique em OK para continuar ou em Cancelar para sair.
ptbr.PrivilegesRequiredOverrideText1=O %1 pode ser instalado para todos os usuários (requer privilégios administrativos) ou só para você.
ptbr.PrivilegesRequiredOverrideText2=O %1 pode ser instalado só para você ou para todos os usuários (requer privilégios administrativos).
ptbr.PrivilegesRequiredOverrideAllUsers=Instalar para &todos os usuários
ptbr.PrivilegesRequiredOverrideAllUsersRecommended=Instalar para &todos os usuários (recomendado)
ptbr.PrivilegesRequiredOverrideCurrentUser=Instalar só &para mim
ptbr.PrivilegesRequiredOverrideCurrentUserRecommended=Instalar só &para mim (recomendado)
ptbr.ExitSetupMessage=A Instalação não está completa. Se você sair agora o programa não será instalado.%n%nVocê pode executar o instalador novamente outra hora para completar a instalação.%n%nSair do instalador?
ptbr.ButtonYesToAll=Sim para &Todos
ptbr.ButtonNoToAll=Nã&o para Todos
ptbr.SelectLanguageLabel=Selecione o idioma para usar durante a instalação:
ptbr.ClickNext=Clique em Avançar para continuar ou em Cancelar para sair do instalador.
ptbr.PasswordLabel3=Por favor forneça a senha, então clique em Avançar para continuar. As senhas são caso-sensitivo.
ptbr.InfoBeforeClickLabel=Quando você estiver pronto para continuar com o instalador, clique em Avançar.
ptbr.InfoAfterClickLabel=Quando você estiver pronto para continuar com o instalador, clique em Avançar.
ptbr.SelectDirBrowseLabel=Para continuar clique em Avançar. Se você gostaria de selecionar uma pasta diferente, clique em Procurar.
ptbr.DiskSpaceWarning=O instalador requer pelo menos %1 KB de espaço livre para instalar mas o drive selecionado só tem %2 KB disponíveis.%n%nVocê quer continuar de qualquer maneira?
ptbr.SelectComponentsLabel2=Selecione os componentes que você quer instalar; desmarque os componentes que você não quer instalar. Clique em Avançar quando você estiver pronto para continuar.
ptbr.SelectStartMenuFolderBrowseLabel=Para continuar clique em Avançar. Se você gostaria de selecionar uma pasta diferente, clique em Procurar.
ptbr.WizardReady=Pronto para Instalar
ptbr.ReadyLabel1=O instalador está agora pronto para começar a instalar o [name] no seu computador.
ptbr.ReadyLabel2a=Clique em Instalar para continuar com a instalação ou clique em Voltar se você quer revisar ou mudar quaisquer configurações.
ptbr.ReadyLabel2b=Clique em Instalar para continuar com a instalação.
ptbr.WizardPreparing=Preparando para Instalar
ptbr.PreparingDesc=O instalador está se preparando para instalar o [name] no seu computador.
ptbr.PreviousInstallNotCompleted=A instalação/remoção de um programa anterior não foi completada. Você precisará reiniciar o computador para completar essa instalação.%n%nApós reiniciar seu computador execute o instalador novamente para completar a instalação do [name].
ptbr.CannotContinue=O instalador não pode continuar. Por favor clique em Cancelar para sair.
ptbr.ClickFinish=Clique em Concluir para sair do Instalador.
ptbr.FinishedRestartLabel=Para completar a instalação do [name], o instalador deve reiniciar seu computador. Você gostaria de reiniciar agora?
ptbr.FinishedRestartMessage=Para completar a instalação do [name], o instalador deve reiniciar seu computador.%n%nVocê gostaria de reiniciar agora?
ptbr.UninstalledAndNeedsRestart=Para completar a desinstalação do %1, seu computador deve ser reiniciado.%n%nVocê gostaria de reiniciar agora?
ptbr.WelcomeLabel2=Este assistente vai instalar a [name/ver] no seu computador.%n%nÉ um programa livre e gratuito (licença MIT), que funciona sem internet. Seus quadros ficam em Documentos\Giz Livre\quadros e são mantidos se você desinstalar.
