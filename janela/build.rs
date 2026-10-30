// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE). Janela própria: preparo do Tauri (ícone e permissões)
// Preparo padrão do Tauri, sem manifesto de comandos próprio: na rodada 4 do VirusTotal (29/10/2026), o manifesto
// próprio (app_manifest) pesava no alerta do APEX e deixava o exe 1,1 MB maior.
// GIZ_PACOTE: o zip do programa (Python embutido e servidor) que vai dentro do exe para ele se instalar sozinho; quem
// monta é scripts/montar_janela.py. Sem ele (build de desenvolvimento e o exe da pasta de instalação), vai vazio.
fn main() {
    println!("cargo:rerun-if-env-changed=GIZ_PACOTE");
    let pacote = match std::env::var("GIZ_PACOTE") {
        Ok(p) if !p.is_empty() => { println!("cargo:rerun-if-changed={p}"); p }
        _ => {
            let p = std::path::Path::new(&std::env::var("OUT_DIR").unwrap()).join("pacote-vazio.zip");
            std::fs::write(&p, b"").unwrap();
            p.display().to_string()
        }
    };
    println!("cargo:rustc-env=GIZ_PACOTE_ARQ={pacote}");
    tauri_build::build()
}
