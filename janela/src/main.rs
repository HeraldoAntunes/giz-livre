// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE). Janela própria do programa (P60, Tauri 2 + WebView2)
// Até a 1.15, a lousa abria numa janela do Edge do dia a dia; em 28/10/2026 o Edge do professor passou a cair a cada
// abertura (o módulo de segurança do banco se injeta nele) e a lousa sumia junto. Agora o GizLivre.exe é esta janela:
// ele roda o server.py no Python embutido oficial (python.org, pasta python\), espera o servidor responder e mostra a
// página. Fechar a última janela fecha o servidor; se esta janela morrer de qualquer jeito, o servidor sai sozinho
// (--pai). Abrir o atalho de novo abre outra janela no mesmo programa, sem um segundo servidor.
// Aberto sozinho (Instalar-GizLivre-<versão>.exe), sem o programa ao lado, ele se instala (src/instalacao.rs).
// Docs: docs/P60-PLANO-JANELA-PROPRIA.md
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod instalacao;

use serde_json::Value;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager, RunEvent, WebviewUrl, WebviewWindowBuilder, WindowEvent};

pub const APP_ID: &str = "GizLivre";   // o mesmo AppUserModelID dos atalhos: fixar na barra guarda o Giz Livre

struct Servidor {
    porta: u16,
    token: Mutex<String>,
    filho: Mutex<Option<Child>>,
}

static JANELAS: AtomicU32 = AtomicU32::new(0);
// já mostrou um aviso ao professor (para não mostrar dois sobre a mesma falha)
static AVISADO: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

use instalacao::{avisar, largo};

#[link(name = "shell32")]
extern "system" {
    fn SetCurrentProcessExplicitAppUserModelID(id: *const u16) -> i32;
    fn ShellExecuteW(hwnd: isize, op: *const u16, arq: *const u16, params: *const u16, pasta: *const u16, mostrar: i32) -> isize;
}
// links de fora (GitHub, guia, página de downloads) abrem no navegador do sistema, nunca dentro da lousa
fn abrir_fora(url: &str) {
    if url.starts_with("https://") || url.starts_with("mailto:") {
        unsafe { ShellExecuteW(0, largo("open").as_ptr(), largo(url).as_ptr(), std::ptr::null(), std::ptr::null(), 1); }
    }
}

fn pasta_do_programa() -> PathBuf {
    std::env::current_exe().ok().and_then(|e| e.parent().map(Path::to_path_buf)).unwrap_or_else(|| PathBuf::from("."))
}

fn opcao(nome: &str) -> Option<String> {
    let a: Vec<String> = std::env::args().collect();
    a.iter().position(|x| x == nome).and_then(|i| a.get(i + 1).cloned())
}

fn local_appdata() -> PathBuf {
    std::env::var_os("LOCALAPPDATA").map(PathBuf::from).unwrap_or_else(|| PathBuf::from("."))
}

// dados do WebView2 (armazenamento da página, cache): na pasta da conta, ou ao lado do programa na cópia portátil
fn pasta_da_janela() -> PathBuf {
    // testes: perfil de rascunho, nunca o do professor (regra da gestão, 29/10/2026)
    if let Some(p) = std::env::var_os("GIZ_JANELA_DADOS") { return PathBuf::from(p); }
    let raiz = pasta_do_programa();
    if raiz.join("portatil.txt").exists() { raiz.join("janela-dados") } else { local_appdata().join("Giz Livre").join("janela") }
}

// O WebView2 se conecta a servidores da Microsoft ao abrir um perfil que ele já conhece: o gatilho é a entrada
// profile.info_cache.Default no arquivo EBWebView\Local State (bisseção de 29/10/2026 em
// _Ferramentas/programas-livres/WEBVIEW2-REDE.md). Apagar só esse arquivo antes de criar a janela impede a conexão; os
// dados da página (localStorage, IndexedDB, na pasta Default) ficam. O WebView2 recria o arquivo sozinho.
// Só este arquivo, só na pasta de dados do próprio programa; se não existir, nada acontece.
fn esquecer_registro_do_perfil() {
    let arq = pasta_da_janela().join("EBWebView").join("Local State");
    match std::fs::remove_file(&arq) {
        Ok(()) => diario("Local State do WebView2 apagado (sem conexão com a Microsoft ao abrir)"),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
        Err(e) => diario(&format!("não consegui apagar o Local State do WebView2: {e}")),
    }
}

// onde o server.py grava porta e código desta conta (arquivo_conexao no server.py)
fn arquivo_conexao(dados: &Option<String>) -> PathBuf {
    match dados {
        Some(d) => PathBuf::from(d).join(".agente").join("conexao.json"),
        None => local_appdata().join("Giz Livre").join("conexao.json"),
    }
}

// Sem cliente HTTP: a janela grava o cookie de acesso desta conta (o código do conexao.json) antes de abrir a página,
// e o servidor sai sozinho quando a janela sai (--pai). Na rodada 4 do VirusTotal (29/10/2026), o cliente HTTP por
// soquete para 127.0.0.1 pesava no alerta do Trapmine.
fn cookie_de_acesso(srv: &Servidor) -> tauri::webview::Cookie<'static> {
    tauri::webview::Cookie::build((format!("giz{}", srv.porta), srv.token.lock().unwrap().clone()))
        .domain("127.0.0.1").path("/").http_only(true)
        .same_site(tauri::webview::cookie::SameSite::Strict).build()
}

#[cfg(feature = "sem-filho")]
fn subir_servidor(_porta: Option<u16>) -> Result<Servidor, String> {
    Ok(Servidor { porta: 0, token: Mutex::new(String::new()), filho: Mutex::new(None) })
}

// sobe o server.py no Python embutido e espera ele gravar o arquivo de conexão com o PID dele. `porta`: a de um
// servidor que caiu, para as janelas abertas continuarem no mesmo endereço (ver vigiar_servidor)
#[cfg(not(feature = "sem-filho"))]
fn subir_servidor(porta: Option<u16>) -> Result<Servidor, String> {
    let raiz = pasta_do_programa();
    let python = std::env::var_os("GIZ_PYTHON").map(PathBuf::from).unwrap_or_else(|| raiz.join("python").join("pythonw.exe"));
    let script = std::env::var_os("GIZ_SERVIDOR").map(PathBuf::from).unwrap_or_else(|| raiz.join("servidor").join("server.py"));
    if !python.exists() || !script.exists() {
        return Err(format!("Faltam arquivos do programa ({} ou {}). Instale o Giz Livre de novo.",
            python.display(), script.display()));
    }
    let dados = opcao("--dados");
    let mut cmd = Command::new(&python);
    cmd.arg(&script).arg("--sem-janela").arg("--pai").arg(std::process::id().to_string());
    if let Some(d) = &dados { cmd.arg("--dados").arg(d); }
    if let Some(p) = porta.map(|p| p.to_string()).or_else(|| opcao("--porta")) { cmd.arg("--porta").arg(p); }
    if porta.is_none() && std::env::args().any(|a| a == "--depois-de-atualizar") { cmd.arg("--depois-de-atualizar"); }
    cmd.env("GIZ_LIVRE_JANELA", "1").env("GIZ_LIVRE_PASTA", &raiz).env_remove("PYTHONPATH").env_remove("PYTHONHOME");
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000);   // CREATE_NO_WINDOW
    }
    let mut filho = cmd.spawn().map_err(|e| format!("O Giz Livre não conseguiu iniciar o servidor: {e}"))?;
    let pid = filho.id();
    let arq = arquivo_conexao(&dados);
    let inicio = Instant::now();
    while inicio.elapsed() < Duration::from_secs(40) {
        if let Ok(Some(st)) = filho.try_wait() {
            return Err(format!("O servidor do Giz Livre fechou ao abrir ({st}). Veja o registro giz-livre.log ao lado \
                da pasta dos quadros."));
        }
        if let Ok(t) = std::fs::read_to_string(&arq) {
            if let Ok(c) = serde_json::from_str::<Value>(&t) {
                if c["pid"].as_u64() == Some(pid as u64) {
                    if let (Some(porta), Some(token)) = (c["porta"].as_u64(), c["token"].as_str()) {
                        return Ok(Servidor { porta: porta as u16, token: Mutex::new(token.to_string()), filho: Mutex::new(Some(filho)) });
                    }
                }
            }
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    let _ = filho.kill();
    Err("O servidor do Giz Livre demorou demais para abrir. Tente de novo.".into())
}

// O servidor caiu com a janela aberta (o processo do Python morreu): sobe outro na mesma porta e entrega o cookie
// novo às janelas abertas; a página pega o código novo sozinha (api.js) e grava o que estava pendente. Antes, nada o
// subia de novo e fechar a janela descartava o pendente (validação no Linux, 30/10/2026). No máximo 3 vezes em 5 min;
// ao fechar o programa, encerrar_servidor tira o filho e a vigia termina.
fn vigiar_servidor(app: AppHandle) {
    let mut quedas: Vec<Instant> = vec![];
    loop {
        std::thread::sleep(Duration::from_secs(1));
        let srv = app.state::<Servidor>();
        let caiu = match srv.filho.lock().unwrap().as_mut() {
            None => return,
            Some(f) => matches!(f.try_wait(), Ok(Some(_))),
        };
        if !caiu { continue; }
        quedas.retain(|t| t.elapsed() < Duration::from_secs(300));
        if quedas.len() >= 3 {
            diario("o servidor caiu de novo; não vou subir outro");
            *srv.filho.lock().unwrap() = None;
            return;
        }
        quedas.push(Instant::now());
        match subir_servidor(Some(srv.porta)) {
            Ok(novo) => {
                *srv.token.lock().unwrap() = novo.token.lock().unwrap().clone();
                *srv.filho.lock().unwrap() = novo.filho.lock().unwrap().take();
                for j in app.webview_windows().values() { let _ = j.set_cookie(cookie_de_acesso(&srv)); }
                diario(&format!("o servidor caiu e foi aberto de novo na porta {}", srv.porta));
            }
            Err(e) => diario(&format!("o servidor caiu e não abriu de novo: {e}")),
        }
    }
}

// Abrir uma janela da lousa. Na bateria de 29/10/2026, um fechamento que chegou 200 ms depois de a janela aparecer,
// enquanto o WebView2 ainda era criado, destruiu a janela no meio da criação: caixa de erro técnico em inglês e o
// programa aberto sem janela. Agora, se a criação falhar, tenta de novo; se falhar de novo, avisa em português e, sem
// outra janela, sai limpo. A janela nasce visível: escondida (.visible(false)), o WebView2 recusava a criação com
// 0x80070578 em todas as aberturas (achado também no Bancada e no Giz na Tela, 29/10/2026).
fn nova_janela(app: &AppHandle) {
    for tentativa in 1..=2 {
        match criar_janela(app) {
            Ok(()) => return,
            Err(e) => {
                diario(&format!("janela: erro ao criar (tentativa {tentativa}): {e}"));
                std::thread::sleep(Duration::from_millis(600));
            }
        }
    }
    avisar("O Giz Livre não conseguiu abrir a janela.\n\nFeche este aviso e abra o Giz Livre de novo pelo atalho. Se acontecer outra vez, reinicie o computador. Os quadros não foram afetados.");
    if app.webview_windows().is_empty() {
        diario("sem nenhuma janela: encerrando");
        app.exit(1);
    }
}

/// Endereços que a janela abre dentro dela: o servidor do programa (127.0.0.1 na porta dele) e as páginas guardadas
/// no próprio exe, que o Tauri serve em http://tauri.localhost no Windows (em build de desenvolvimento, tauri://).
/// Sem o tauri.localhost aqui, a janela recusava a própria página de espera e não chegava a ser criada.
fn navegacao_nossa(u: &tauri::Url, porta: u16) -> bool {
    let http = u.scheme() == "http" || u.scheme() == "https";
    (http && u.host_str() == Some("127.0.0.1") && u.port() == Some(porta))
        || (http && u.host_str() == Some("tauri.localhost"))
        || ["tauri", "about", "blob", "data"].contains(&u.scheme())
}

fn criar_janela(app: &AppHandle) -> tauri::Result<()> {
    let srv = app.state::<Servidor>();
    let url: tauri::Url = format!("http://127.0.0.1:{}/", srv.porta).parse().unwrap();
    let n = JANELAS.fetch_add(1, Ordering::SeqCst) + 1;
    let porta = srv.porta;
    // começa na página de espera do próprio exe; o cookie de acesso entra antes de ir para o servidor
    let r = WebviewWindowBuilder::new(app, format!("lousa{n}"), WebviewUrl::App("espera.html".into()))
        .title("Giz Livre")
        .inner_size(1280.0, 800.0)
        .min_inner_size(640.0, 480.0)
        .maximized(true)
        .data_directory(pasta_da_janela())
        // o título acompanha o da página ("Aula 3 — Giz Livre"), como na janela do Edge
        // a marca MARCA_FECHAR no título é o aviso da página de que terminou de gravar (ver abaixo)
        .on_document_title_changed(|w, t| {
            match t.as_str() {
                MARCA_FECHAR => liberar_e_fechar(&w),
                MARCA_RECEBIDO => { FECHANDO.lock().unwrap().insert(w.label().to_string(), Fechando::Gravando); }
                MARCA_PERGUNTA => { FECHANDO.lock().unwrap().insert(w.label().to_string(), Fechando::Perguntando); }
                MARCA_FICA => { FECHANDO.lock().unwrap().remove(w.label()); diario(&format!("janela {}: fica aberta (não salvou)", w.label())); }
                _ => { let _ = w.set_title(&t); }
            }
        })
        // link com target="_blank" (página de downloads, GitHub): navegador do sistema
        .on_new_window(|u, _| {
            abrir_fora(u.as_str());
            tauri::webview::NewWindowResponse::Deny
        })
        .on_navigation(move |u| {
            // só a página do próprio programa; o resto vai para o navegador do sistema
            if !navegacao_nossa(u, porta) {
                abrir_fora(u.as_str());
                return false;
            }
            true
        })
        .build();
    let j = r?;
    j.set_cookie(cookie_de_acesso(&srv))?;
    j.navigate(url)?;
    let _ = j.set_focus();
    diario(&format!("janela lousa{n}: aberta"));
    Ok(())
}

// Fechar a janela: a página termina de gravar (window.gizAntesDeFechar, em app/js/main.js) e avisa trocando o próprio
// título por MARCA_FECHAR; só então a janela fecha de verdade. Sem aviso em 5 s (página travada), fecha mesmo assim.
// O aviso pelo título dispensa a ponte de comandos da página para o programa: com ela, o exe precisava de um manifesto
// de permissões próprio, que pesava no VirusTotal (rodada 4, 29/10/2026).
const MARCA_FECHAR: &str = "giz-livre:pode-fechar";
// a página recebeu o pedido e está gravando: daí em diante, a janela espera (até ESPERA_GRAVANDO), sem cortar
const MARCA_RECEBIDO: &str = "giz-livre:gravando";
// a gravação falhou e o professor preferiu não fechar: a janela fica aberta
const MARCA_FICA: &str = "giz-livre:fica";
// a gravação falhou e a página está perguntando se fecha mesmo assim: a resposta é do professor, sem prazo (antes,
// passados os 2 min de ESPERA_GRAVANDO, a janela fechava com a pergunta na tela; auditoria de 30/10/2026)
const MARCA_PERGUNTA: &str = "giz-livre:perguntando";
const ESPERA_GRAVANDO: Duration = Duration::from_secs(120);
#[derive(Clone, Copy, PartialEq)]
enum Fechando { Pedido, Gravando, Perguntando }
static FECHANDO: Mutex<std::collections::BTreeMap<String, Fechando>> = Mutex::new(std::collections::BTreeMap::new());

/// O que fazer com uma janela cujo fechamento foi pedido há `passou`: esperar mais ou fechar assim mesmo.
/// Sem resposta da página em 5 s (avaliação do JavaScript falhou ou não voltou), fecha; gravando, espera até 2 min;
/// perguntando ao professor se fecha sem salvar, espera a resposta dele.
fn fechar_assim_mesmo(estado: Option<Fechando>, passou: Duration) -> Option<bool> {
    match estado {
        None => None,                                                   // fechou ou ficou aberta: nada a fazer
        Some(Fechando::Pedido) => Some(passou >= Duration::from_secs(5)),
        Some(Fechando::Gravando) => Some(passou >= ESPERA_GRAVANDO),
        Some(Fechando::Perguntando) => Some(false),
    }
}
static LIBERADAS: Mutex<Vec<String>> = Mutex::new(Vec::new());

fn liberar_e_fechar(janela: &tauri::WebviewWindow) {
    FECHANDO.lock().unwrap().remove(janela.label());
    LIBERADAS.lock().unwrap().push(janela.label().to_string());
    let r = janela.close();
    diario(&format!("janela {} fechando ({r:?})", janela.label()));
}

// registro da janela, ao lado do giz-livre.log do servidor (só as últimas linhas importam)
fn diario(msg: &str) {
    let arq = local_appdata().join("Giz Livre").join("janela.log");
    let _ = std::fs::create_dir_all(arq.parent().unwrap());
    if std::fs::metadata(&arq).map(|m| m.len() > 200_000).unwrap_or(false) { let _ = std::fs::remove_file(&arq); }
    let t = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
    let _ = std::fs::OpenOptions::new().create(true).append(true).open(&arq)
        .and_then(|mut f| writeln!(f, "{t} pid {} {msg}", std::process::id()));
}

fn encerrar_servidor(app: &AppHandle) {
    let srv = app.state::<Servidor>();
    let filho = srv.filho.lock().unwrap().take();
    if let Some(mut f) = filho {
        // o servidor vigia este processo (--pai) e sai sozinho, gravando o que faltar, quando ele terminar; esta
        // espera curta só cobre o caso de ele já ter começado a sair
        let inicio = Instant::now();
        while inicio.elapsed() < Duration::from_millis(300) {
            if let Ok(Some(_)) = f.try_wait() { return; }
            std::thread::sleep(Duration::from_millis(50));
        }
    }
}

// variante de controle "minimo" (rodada 4 do VirusTotal): a mesma configuração de build, só uma janela com a página
// de espera, nada mais
#[cfg(feature = "minimo")]
fn main() {
    let _ = tauri::Builder::default()
        .setup(|app| {
            WebviewWindowBuilder::new(app, "minimo", WebviewUrl::App("espera.html".into())).title("Giz Livre").build()?;
            Ok(())
        })
        .run(tauri::generate_context!());
}

#[cfg(not(feature = "minimo"))]
fn main() {
    unsafe { SetCurrentProcessExplicitAppUserModelID(largo(APP_ID).as_ptr()); }
    // --instalar, /SILENT (atualização pelo Sobre), --desinstalar. A feature so-janela monta o exe sem esta parte,
    // só para comparar no VirusTotal (rodada 3, 29/10/2026)
    #[cfg(not(feature = "so-janela"))]
    {
        if let Some(codigo) = instalacao::comandos() {
            std::process::exit(codigo);
        }
        // sem o programa ao lado (ou na pasta de instalação), este exe é o instalador: instala e abre a instalada
        if (!instalacao::programa_ao_lado() || instalacao::pasta_para_instalar()) && std::env::var_os("GIZ_PYTHON").is_none() {
            if let instalacao::Seguir::Abrir(exe) = instalacao::ao_abrir() {
                let pasta = exe.parent().map(Path::to_path_buf).unwrap_or_default();
                if let Err(e) = Command::new(&exe).current_dir(pasta).spawn() {
                    diario(&format!("instalado, mas não abriu sozinho: {e}"));
                    avisar("O Giz Livre foi instalado, mas não abriu sozinho. Abra pelo atalho Giz Livre no menu Iniciar.");
                }
            }
            return;
        }
    }
    if !instalacao::tem_webview2() {
        instalacao::avisar_sem_webview2();
        return;
    }
    let app = tauri::Builder::default();
    // abrir o atalho com o programa aberto: outra janela neste mesmo programa
    // (fora da thread principal: criar a janela dentro do aviso do plugin não abria nada)
    #[cfg(not(feature = "sem-instancia-unica"))]
    let app = app.plugin(tauri_plugin_single_instance::init(|app, _args, _pasta| {
            diario("o atalho foi aberto de novo: outra janela");
            let h = app.clone();
            std::thread::spawn(move || nova_janela(&h));
        }));
    let app = app
        .setup(|app| {
            #[cfg(not(feature = "sem-local-state"))]
            {
                // WebView2 órfão de uma queda anterior segurando o perfil: sem isto, a reabertura falhava
                let orfaos = instalacao::encerrar_webview_orfao(&pasta_da_janela().join("EBWebView"));
                if !orfaos.is_empty() { diario(&format!("WebView2 órfão de uma queda anterior encerrado: {orfaos:?}")); }
            }
            esquecer_registro_do_perfil();
            // os motivos de subir_servidor são nossos, em português e dizem o que fazer: aparecem como estão
            let srv = subir_servidor(None).map_err(|e| { avisar(&e); AVISADO.store(true, Ordering::SeqCst); e })?;
            app.manage(srv);
            let h = app.handle().clone();
            std::thread::spawn(move || vigiar_servidor(h));
            nova_janela(app.handle());
            Ok(())
        })
        .on_window_event(|w, ev| {
            if let WindowEvent::CloseRequested { api, .. } = ev {
                let rot = w.label().to_string();
                let mut lib = LIBERADAS.lock().unwrap();
                if let Some(i) = lib.iter().position(|l| *l == rot) {
                    lib.remove(i);   // a página já gravou: fecha de verdade
                    return;
                }
                drop(lib);
                api.prevent_close();
                // cliques repetidos no X enquanto a página grava: um pedido só
                // (sem regravar o estado: um segundo clique não pode trocar "gravando" por "pedido" e voltar aos 5 s)
                {
                    let mut f = FECHANDO.lock().unwrap();
                    if f.contains_key(&rot) { return; }
                    f.insert(rot.clone(), Fechando::Pedido);
                }
                diario(&format!("janela {rot}: pedido de fechar, gravando o quadro"));
                // auditoria de 29/10/2026 (rodada 2): a página avisa na hora que recebeu o pedido, espera a gravação
                // que já saiu e, se ela falhar, pergunta antes de fechar (o que não foi salvo se perderia). Só `true`
                // conta como gravado: vazio, null ou qualquer outra resposta também pergunta
                let _ = w.app_handle().get_webview_window(&rot).map(|j| j.eval(&format!(
                    "(async () => {{ const t = document.title; document.title = '{MARCA_RECEBIDO}'; window.gizFechando = true; let ok = true; try {{ const f = window.gizAntesDeFechar; if (typeof f === 'function') ok = (await f()) === true; }} catch {{ ok = false; }} if (!ok) document.title = '{MARCA_PERGUNTA}'; if (!ok && !confirm('O Giz Livre não conseguiu salvar este quadro. Fechar mesmo assim? O que não foi salvo se perde.')) {{ window.gizFechando = false; document.title = '{MARCA_FICA}'; setTimeout(() => {{ document.title = t; }}, 300); return; }} document.title = '{MARCA_FECHAR}'; }})()")));
                let h = w.app_handle().clone();
                std::thread::spawn(move || {
                    let inicio = Instant::now();
                    loop {
                        std::thread::sleep(Duration::from_millis(250));
                        let estado = FECHANDO.lock().unwrap().get(&rot).copied();
                        match fechar_assim_mesmo(estado, inicio.elapsed()) {
                            None => return,
                            Some(false) => continue,
                            Some(true) => {
                                if let Some(j) = h.get_webview_window(&rot) {
                                    diario(&format!("janela {rot}: a página não terminou ({}), fechando assim mesmo",
                                        if estado == Some(Fechando::Gravando) { "gravando há 2 min" } else { "sem resposta em 5 s" }));
                                    liberar_e_fechar(&j);
                                }
                                return;
                            }
                        }
                    }
                });
            }
        })
        .build(tauri::generate_context!());
    let app = match app {
        Ok(a) => a,
        // detalhe técnico só no registro; para o professor, o que fazer, em português
        Err(e) => {
            diario(&format!("não abriu: {e}"));
            if !AVISADO.load(Ordering::SeqCst) {
                avisar("O Giz Livre não conseguiu abrir.\n\nFeche este aviso e abra o Giz Livre de novo pelo atalho. Se \
                    acontecer outra vez, reinicie o computador. Os quadros não foram afetados.");
            }
            return;
        }
    };
    app.run(|h, ev| match ev {
        // a última janela fechou: fecha o servidor e sai
        RunEvent::ExitRequested { .. } | RunEvent::Exit => {
            diario("última janela fechada: encerrando");
            // o WebView2 grava o armazenamento da página (localStorage) ao fechar: sem esperar, sair rápido demais
            // perdia o que mudou na última hora (prova de 29/10/2026)
            let inicio = Instant::now();
            while instalacao::filhos_vivos(std::process::id()) > 0 && inicio.elapsed() < Duration::from_secs(3) {
                std::thread::sleep(Duration::from_millis(100));
            }
            encerrar_servidor(h)
        }
        _ => {}
    });
}

#[cfg(test)]
mod testes {
    use super::*;

    // auditoria de 29/10/2026 (rodada 2): o fechamento esperava 5 s fixos, mesmo com uma gravação a caminho
    #[test]
    fn fechar_espera_a_gravacao_e_tem_alternativa_sem_resposta() {
        let s = Duration::from_secs;
        assert_eq!(fechar_assim_mesmo(Some(Fechando::Pedido), s(4)), Some(false));
        assert_eq!(fechar_assim_mesmo(Some(Fechando::Pedido), s(5)), Some(true));     // JavaScript não respondeu
        assert_eq!(fechar_assim_mesmo(Some(Fechando::Gravando), s(30)), Some(false)); // gravando: espera
        assert_eq!(fechar_assim_mesmo(Some(Fechando::Gravando), s(120)), Some(true)); // travou gravando: fecha
        assert_eq!(fechar_assim_mesmo(Some(Fechando::Perguntando), s(600)), Some(false)); // a resposta é do professor
        assert_eq!(fechar_assim_mesmo(None, s(200)), None);                           // fechou ou ficou aberta
    }

    // em build de produção, as páginas do exe vêm de http://tauri.localhost: recusá-las impedia a janela de nascer
    #[test]
    fn a_janela_abre_as_proprias_paginas_e_manda_o_resto_para_fora() {
        let u = |s: &str| s.parse::<tauri::Url>().unwrap();
        assert!(navegacao_nossa(&u("http://tauri.localhost/espera.html"), 8765));
        assert!(navegacao_nossa(&u("tauri://localhost/espera.html"), 8765));
        assert!(navegacao_nossa(&u("http://127.0.0.1:8765/#/quadro/x"), 8765));
        assert!(!navegacao_nossa(&u("http://127.0.0.1:9999/"), 8765));     // outra porta: não é o nosso servidor
        assert!(!navegacao_nossa(&u("https://github.com/HeraldoAntunes/giz-livre"), 8765));
        assert!(!navegacao_nossa(&u("http://tauri.localhost.exemplo.com/"), 8765));
    }
}
