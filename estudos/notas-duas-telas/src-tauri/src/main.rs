// Estudo: notas do professor em duas telas (protótipo separado do Giz Livre; não é o código da 1.17).
// Duas janelas: a "apresentacao" vai para a tela que não é a principal, em tela cheia; as "notas" ficam na principal.
// Tudo o que a página e o Rust medem sai em linhas "RELATO <origem> <json>" na saída padrão, e o programa sai sozinho
// depois de NOTAS_TEMPO segundos (padrão 8). Modos (variável NOTAS_MODO):
//   rust   - o Rust cria as duas janelas (como se não houvesse window.open)
//   open   - o Rust cria só a apresentação; a página abre as notas com window.open('/#/notas/q1') e o on_new_window
//            cria a janela (como a 1.17 faz)
//   sozinha - só a apresentação, sem posicionar: o que a página vê de screen.* numa janela comum
// NOTAS_TELA_CHEIA=0 desliga a tela cheia da apresentação (só posição e tamanho).
// NOTAS_CHEIA_GTK=1 põe em tela cheia pelo GTK, no monitor escolhido (gtk_window_fullscreen_on_monitor), em vez do
// set_fullscreen(true) do Tauri, que usa o monitor em que a janela já está.
// NOTAS_POPUP_AUTOMATICO=1 liga no WebKitGTK o javascript-can-open-windows-automatically (window.open sem clique).
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Duration;
use tauri::{Manager, Monitor, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

static ABERTAS: AtomicUsize = AtomicUsize::new(0);

fn relato(origem: &str, dados: serde_json::Value) {
    println!("RELATO {origem} {dados}");
}

fn monitor_json(m: &Monitor) -> serde_json::Value {
    serde_json::json!({ "nome": m.name(), "x": m.position().x, "y": m.position().y,
        "largura": m.size().width, "altura": m.size().height, "escala": m.scale_factor() })
}

#[tauri::command]
fn relatar(janela: String, dados: serde_json::Value) {
    relato(&format!("pagina:{janela}"), dados);
}

/// A tela "das notas" é a principal; a da apresentação, a primeira que não é a principal (ou a única, se só houver uma).
fn telas(app: &tauri::AppHandle) -> (Option<Monitor>, Option<Monitor>) {
    let todas = app.available_monitors().unwrap_or_default();
    let principal = app.primary_monitor().ok().flatten().or_else(|| todas.first().cloned());
    let outra = todas.iter().find(|m| Some(m.position()) != principal.as_ref().map(|p| p.position())).cloned();
    (principal, outra)
}

fn por_na_tela(w: &WebviewWindow, m: &Monitor, cheia: bool) {
    let p = m.position();
    let s = m.size();
    let _ = w.set_fullscreen(false);
    let _ = w.set_position(PhysicalPosition::new(p.x + 40, p.y + 40));
    let _ = w.set_size(PhysicalSize::new(s.width.saturating_sub(80).max(200), s.height.saturating_sub(80).max(200)));
    if cheia {
        if std::env::var("NOTAS_CHEIA_GTK").as_deref() == Ok("1") {
            // depois de a janela aparecer: antes do primeiro desenho, o pedido não chega ao compositor com o monitor
            let (w2, m2) = (w.clone(), m.clone());
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(800));
                let w3 = w2.clone();
                let _ = w2.run_on_main_thread(move || cheia_gtk(&w3, &m2));
            });
        } else {
            let _ = w.set_fullscreen(true);
        }
    }
}

/// Tela cheia no monitor dado, pelo GTK: acha o GdkMonitor com a mesma posição e chama fullscreen_on_monitor.
#[cfg(target_os = "linux")]
fn cheia_gtk(w: &WebviewWindow, m: &Monitor) {
    use gtk::prelude::*;
    let Ok(janela) = w.gtk_window() else { return };
    let Some(tela) = gtk::prelude::WidgetExt::screen(&janela) else { return };
    let disp = tela.display();
    let alvo = (m.position().x as f64 / m.scale_factor(), m.position().y as f64 / m.scale_factor());
    let indice = (0..disp.n_monitors()).find(|&i| disp.monitor(i).map(|g| {
        let r = g.geometry();
        (r.x() as f64, r.y() as f64) == alvo
    }).unwrap_or(false));
    relato("rust", serde_json::json!({ "cheia_gtk": { "monitor_gdk": indice, "monitores_gdk": disp.n_monitors() } }));
    if let Some(i) = indice {
        janela.fullscreen_on_monitor(&tela, i);
    }
}
#[cfg(not(target_os = "linux"))]
fn cheia_gtk(w: &WebviewWindow, _m: &Monitor) {
    let _ = w.set_fullscreen(true);
}

/// window.open sem gesto do usuário: o WebKitGTK bloqueia por padrão; esta opção libera, só nesta janela.
#[cfg(target_os = "linux")]
fn liberar_popup(w: &WebviewWindow) {
    let _ = w.with_webview(|wv| {
        use webkit2gtk::{SettingsExt, WebViewExt};
        if let Some(s) = wv.inner().settings() {
            s.set_javascript_can_open_windows_automatically(true);
        }
    });
}
#[cfg(not(target_os = "linux"))]
fn liberar_popup(_w: &WebviewWindow) {}

fn medir(w: &WebviewWindow) -> serde_json::Value {
    serde_json::json!({
        "posicao": w.outer_position().ok().map(|p| (p.x, p.y)),
        "tamanho": w.outer_size().ok().map(|s| (s.width, s.height)),
        "tela_atual": w.current_monitor().ok().flatten().map(|m| monitor_json(&m)),
        "tela_cheia": w.is_fullscreen().ok(),
        "visivel": w.is_visible().ok(),
    })
}

fn main() {
    let modo = std::env::var("NOTAS_MODO").unwrap_or_else(|_| "open".into());
    let cheia = std::env::var("NOTAS_TELA_CHEIA").map(|v| v != "0").unwrap_or(true);
    let tempo: u64 = std::env::var("NOTAS_TEMPO").ok().and_then(|v| v.parse().ok()).unwrap_or(8);
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![relatar])
        .setup(move |app| {
            let handle = app.handle().clone();
            let todas = handle.available_monitors().unwrap_or_default();
            relato("rust", serde_json::json!({
                "modo": modo, "tela_cheia_pedida": cheia,
                "monitores": todas.iter().map(monitor_json).collect::<Vec<_>>(),
                "principal": handle.primary_monitor().ok().flatten().map(|m| monitor_json(&m)),
                "XDG_SESSION_TYPE": std::env::var("XDG_SESSION_TYPE").ok(),
                "WAYLAND_DISPLAY": std::env::var("WAYLAND_DISPLAY").ok(), "DISPLAY": std::env::var("DISPLAY").ok(),
            }));
            let (principal, outra) = telas(&handle);

            let h = handle.clone();
            let mut apres = WebviewWindowBuilder::new(app, "apresentacao", WebviewUrl::App("index.html#/apresentacao".into()))
                .title("Apresentação (projetor)")
                .inner_size(800.0, 450.0);
            if modo == "open" {
                let (principal_n, _) = (principal.clone(), ());
                apres = apres.on_new_window(move |url, features| {
                    let n = ABERTAS.fetch_add(1, Ordering::SeqCst);
                    relato("rust", serde_json::json!({ "on_new_window": url.as_str(), "n": n }));
                    if n > 0 {   // uma janela de notas só
                        return tauri::webview::NewWindowResponse::Deny;
                    }
                    let janela = WebviewWindowBuilder::new(&h, "notas", WebviewUrl::External("about:blank".parse().unwrap()))
                        .window_features(features)
                        .title("Notas do professor")
                        .inner_size(700.0, 450.0)
                        .build();
                    match janela {
                        Ok(w) => {
                            if let Some(m) = &principal_n {
                                por_na_tela(&w, m, false);
                            }
                            tauri::webview::NewWindowResponse::Create { window: w }
                        }
                        Err(e) => {
                            relato("rust", serde_json::json!({ "erro_on_new_window": e.to_string() }));
                            tauri::webview::NewWindowResponse::Deny
                        }
                    }
                });
            }
            let apres = apres.build()?;
            if std::env::var("NOTAS_POPUP_AUTOMATICO").as_deref() == Ok("1") {
                liberar_popup(&apres);
            }
            if modo != "sozinha" {
                if let Some(m) = outra.as_ref().or(principal.as_ref()) {
                    por_na_tela(&apres, m, cheia);
                }
            }
            if modo == "rust" {
                let notas = WebviewWindowBuilder::new(app, "notas", WebviewUrl::App("index.html#/notas/q1".into()))
                    .title("Notas do professor")
                    .inner_size(700.0, 450.0)
                    .build()?;
                if let Some(m) = &principal {
                    por_na_tela(&notas, m, false);
                }
            }
            // mede o que o Rust vê de cada janela, de novo depois que o gerenciador de janelas agiu, e sai
            let h = handle.clone();
            std::thread::spawn(move || {
                for (k, espera) in [(1, tempo / 2), (2, tempo - tempo / 2)] {
                    std::thread::sleep(Duration::from_secs(espera.max(1)));
                    for (rotulo, w) in h.webview_windows() {
                        relato(&format!("rust:{rotulo}"), serde_json::json!({ "medida": k, "janela": medir(&w) }));
                    }
                }
                h.exit(0);
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao rodar o estudo");
}
