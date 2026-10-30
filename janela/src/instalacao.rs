// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Instalação sem instalador (P60): o Instalar-GizLivre-<versão>.exe é o próprio GizLivre.exe com o pacote do
// programa dentro (Python embutido oficial e o servidor, scripts/montar_janela.py). Aberto sozinho (da pasta Downloads),
// pergunta se instala; então tira a versão aberta, copia tudo para %LOCALAPPDATA%\Programs\Giz Livre (a mesma pasta do
// Inno Setup até a 1.16), cria os atalhos com o AppUserModelID da janela e se registra em Aplicativos instalados, na
// mesma chave do Inno, para tomar o lugar daquela instalação. Não pede administrador e não toca fora da conta.
// Os VirusTotal de 29/10/2026 deram alertas para o Inno (4), o NSIS (2) e o exe do PyInstaller (2); o zip, 0.
// Linha de comando:
//   --instalar (ou /S, /SILENT, /VERYSILENT, as opções que o Sobre das versões 1.x passa ao instalador): em silêncio;
//   --reabrir (ou /reabrir=1): abre o programa instalado no fim; /LOG=<arquivo>: anota os passos ali;
//   --desinstalar [--silencioso]: chamado por Aplicativos instalados; os quadros ficam.
// Modelo: src-tauri/src/instalacao.rs do Bancada Livre (Simulador portas).
use std::ffi::c_void;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

pub const VERSAO: &str = env!("CARGO_PKG_VERSION");
/// Chave de desinstalação do Inno Setup (AppId do lousa.iss), dentro de HKCU: a instalação própria toma o lugar dela.
pub const CHAVE: &str = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\{6F1B6C2E-4D7A-4E2B-9B8D-3A5C1E7F0A21}_is1";
const EXE: &str = "GizLivre.exe";
const ATALHO: &str = "Giz Livre.lnk";
const ATALHO_DESINSTALAR: &str = "Desinstalar o Giz Livre.lnk";   // criado pelo Inno Setup
/// O pacote do programa (zip), posto aqui pelo build.rs; vazio num build de desenvolvimento.
static PACOTE: &[u8] = include_bytes!(env!("GIZ_PACOTE_ARQ"));
/// O que o pacote põe na pasta do programa (tudo é apagado e posto de novo a cada instalação)
const DO_PACOTE: [&str; 10] = ["python", "servidor", "licencas", "LICENSE", "THIRD-PARTY-NOTICES.md", "THIRD-PARTY-NOTICES-JANELA.md", "README.md",
    "GUIA-DE-USO.md", "LICENCA-traducao-pt-BR.md", "icones"];
// restos da instalação do Inno Setup e do PyInstaller (até a 1.16); só estes nomes são apagados
const RESTOS: [&str; 4] = ["unins000.exe", "unins000.dat", "unins000.msg", "_internal"];

/// Onde a instalação fica. Os testes usam pastas e chave próprias.
pub struct Destino {
    pub programa: PathBuf,
    pub menu: PathBuf,
    pub area: PathBuf,
    pub chave: String,
}

impl Destino {
    pub fn da_conta() -> Option<Destino> {
        // teste de ponta a ponta (tests/instalacao_propria.mjs): tudo numa pasta à parte, com chave à parte, sem tocar
        // na instalação de verdade desta conta
        if let Some(base) = std::env::var_os("GIZ_TESTE_INSTALACAO").map(PathBuf::from) {
            return Some(Destino { programa: base.join("Programs").join("Giz Livre"), menu: base.join("Menu"),
                area: base.join("Area"), chave: r"Software\GizLivreTeste\Instalacao".to_string() });
        }
        let local = std::env::var_os("LOCALAPPDATA").map(PathBuf::from)?;
        Some(Destino {
            programa: local.join("Programs").join("Giz Livre"),
            menu: pasta_conhecida(&FOLDERID_PROGRAMS)?,
            area: pasta_conhecida(&FOLDERID_DESKTOP)?,
            chave: CHAVE.to_string(),
        })
    }
    pub fn exe(&self) -> PathBuf { self.programa.join(EXE) }
}

/// O programa montado está ao lado deste exe (instalado ou portátil)? Senão, este exe é o instalador.
pub fn programa_ao_lado() -> bool {
    let Some(pasta) = std::env::current_exe().ok().and_then(|e| e.parent().map(Path::to_path_buf)) else { return false };
    pasta.join("python").join("pythonw.exe").exists() && pasta.join("servidor").join("server.py").exists()
}

pub fn tem_pacote() -> bool { PACOTE.len() > 100 }

/// Pasta de instalação (rodada 3 do VirusTotal, 29/10/2026): o exe vai sem nada dentro, numa pasta com python\,
/// servidor\ e o arquivo-marca instalar.txt; aberto dali, pergunta se instala e copia a própria pasta. Sem a marca
/// (portátil, pasta de teste, a instalada), só abre o programa.
pub const MARCA_INSTALAR: &str = "instalar.txt";
pub fn pasta_para_instalar() -> bool {
    let (Ok(exe), Some(destino)) = (std::env::current_exe(), Destino::da_conta()) else { return false };
    programa_ao_lado() && exe.parent().is_some_and(|p| p.join(MARCA_INSTALAR).exists()) && !mesmo_arquivo(&exe, &destino.exe())
}

fn copiar_arvore(de: &Path, para: &Path) -> io::Result<u64> {
    if de.is_dir() {
        fs::create_dir_all(para)?;
        let mut total = 0;
        for item in fs::read_dir(de)? {
            let item = item?;
            total += copiar_arvore(&item.path(), &para.join(item.file_name()))?;
        }
        Ok(total)
    } else {
        fs::copy(de, para)
    }
}

pub struct Registro(Option<fs::File>);
impl Registro {
    fn abrir() -> Registro {
        let arq = std::env::args().find_map(|a| a.strip_prefix("/LOG=").map(PathBuf::from));
        Registro(arq.and_then(|a| fs::OpenOptions::new().create(true).append(true).open(a).ok()))
    }
    fn anotar(&mut self, msg: &str) {
        if let Some(f) = &mut self.0 { let _ = writeln!(f, "{msg}"); }
    }
}

/// Opções da linha de comando de instalar e desinstalar. Devolve o código de saída se fez o trabalho.
pub fn comandos() -> Option<i32> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let tem = |a: &str| args.iter().any(|x| x.eq_ignore_ascii_case(a));
    let silencioso = tem("--instalar") || tem("/S") || tem("/SILENT") || tem("/VERYSILENT");
    let reabrir = tem("--reabrir") || tem("/reabrir=1");
    if tem("--desinstalar") {
        let (Ok(atual), Some(destino)) = (std::env::current_exe(), Destino::da_conta()) else { return Some(1) };
        return Some(if desinstalar(&destino, &atual, tem("--silencioso")).is_ok() { 0 } else { 1 });
    }
    if !silencioso { return None; }
    let mut log = Registro::abrir();
    log.anotar(&format!("Giz Livre {VERSAO}: instalação em silêncio"));
    let (Ok(atual), Some(destino)) = (std::env::current_exe(), Destino::da_conta()) else { return Some(1) };
    match instalar(&destino, &atual, PACOTE, &mut log) {
        Ok(()) => {
            log.anotar("instalado");
            if let Some(v) = versao_para_todos() { log.anotar(&format!("aviso: há também a {v} instalada para todos os usuários")); }
            if reabrir {
                let mut cmd = std::process::Command::new(destino.exe());
                cmd.arg("--depois-de-atualizar").current_dir(&destino.programa);
                // teste da atualização (tests/atualizar_da_1_15.mjs): reabre com os quadros de teste, nunca os reais
                if let Some(d) = std::env::var_os("GIZ_TESTE_DADOS") { cmd.arg("--dados").arg(d); }
                let ok = cmd.spawn().is_ok();
                log.anotar(&format!("programa aberto de novo: {ok}"));
            }
            Some(0)
        }
        Err(e) => { log.anotar(&format!("ERRO: {e}")); Some(1) }
    }
}

pub enum Seguir { Abrir(PathBuf), Sair }

/// Este exe foi aberto sozinho (sem o programa ao lado): é o instalador. Pergunta e instala, ou abre a cópia já
/// instalada (mesma versão ou mais nova).
pub fn ao_abrir() -> Seguir {
    let Ok(atual) = std::env::current_exe() else { return Seguir::Sair };
    let Some(destino) = Destino::da_conta() else { return Seguir::Sair };
    limpar_sobras(&lugares_de_sobra(&destino));
    let completa = destino.programa.join("python").join("pythonw.exe").exists();
    let instalada = ler_texto(HKCU, &destino.chave, "DisplayVersion").filter(|_| destino.exe().exists());
    if !tem_pacote() && !pasta_para_instalar() {
        avisar("Este GizLivre.exe é de desenvolvimento e não traz o programa dentro.");
        return Seguir::Sair;
    }
    let pergunta = match instalada.as_deref() {
        Some(v) if !mais_nova(VERSAO, v) && completa => return Seguir::Abrir(destino.exe()),
        Some(v) => format!("Atualizar o Giz Livre da versão {v} para a {VERSAO}?\n\nOs quadros e os ajustes continuam \
            guardados. Se o Giz Livre estiver aberto, ele fecha e abre de novo já atualizado."),
        None => format!("Instalar o Giz Livre {VERSAO} neste computador?\n\nInstala só para a sua conta (não pede \
            administrador), cria os atalhos no menu Iniciar e na Área de Trabalho e abre a lousa."),
    };
    if perguntar(&pergunta, 0x1 | 0x20) != 1 { return Seguir::Sair; }   // OK/Cancelar, pergunta
    let mut log = Registro(None);
    match instalar(&destino, &atual, PACOTE, &mut log) {
        Ok(()) => {
            if let Some(aviso) = aviso_para_todos(versao_para_todos()) { avisar(&aviso); }
            Seguir::Abrir(destino.exe())
        }
        Err(e) => {
            avisar(&format!("Não foi possível instalar o Giz Livre.\n\n{e}"));
            Seguir::Sair
        }
    }
}

/// "1.16.1" é mais nova que "1.16.0". Versão que não se entende conta como antiga (vale atualizar por cima).
pub fn mais_nova(esta: &str, outra: &str) -> bool {
    let partes = |v: &str| -> Option<Vec<u32>> { v.trim().split('.').map(|p| p.parse().ok()).collect() };
    match (partes(esta), partes(outra)) {
        (Some(a), Some(b)) => a > b,
        (Some(_), None) => true,
        _ => false,
    }
}

fn mesmo_arquivo(a: &Path, b: &Path) -> bool {
    match (fs::canonicalize(a), fs::canonicalize(b)) {
        (Ok(x), Ok(y)) => x.to_string_lossy().eq_ignore_ascii_case(&y.to_string_lossy()),
        _ => false,
    }
}

fn apagar(p: &Path) -> io::Result<()> {
    if p.is_dir() { fs::remove_dir_all(p) } else if p.exists() { fs::remove_file(p) } else { Ok(()) }
}

/// Abre o zip do pacote dentro de `pasta`.
pub fn extrair(pacote: &[u8], pasta: &Path) -> io::Result<u64> {
    let mut z = zip::ZipArchive::new(io::Cursor::new(pacote)).map_err(io::Error::other)?;
    let mut total = 0;
    for i in 0..z.len() {
        let mut f = z.by_index(i).map_err(io::Error::other)?;
        // enclosed_name recusa caminhos que saem da pasta (../, absolutos)
        let Some(rel) = f.enclosed_name() else { return Err(io::Error::other("pacote com caminho inválido")) };
        let alvo = pasta.join(rel);
        if f.is_dir() {
            fs::create_dir_all(&alvo)?;
            continue;
        }
        if let Some(p) = alvo.parent() { fs::create_dir_all(p)?; }
        let mut saida = fs::File::create(&alvo)?;
        total += io::copy(&mut f, &mut saida)?;
    }
    Ok(total)
}

// A instalação é uma troca: o pacote novo inteiro (Python, servidor, textos e o exe) é montado e conferido numa pasta
// de preparo ao lado; só então a versão aberta fecha, o pacote anterior vai para uma reserva e o novo entra no lugar.
// Qualquer falha devolve a reserva. Antes, o Python e o servidor antigos eram apagados antes de copiar o novo, e uma
// falha no meio deixava o exe sem o resto do programa (auditoria de 30/10/2026, GL-N01).
const PREPARO: &str = ".instalacao-nova";
const RESERVA: &str = ".instalacao-anterior";

/// Uma troca anterior parou no meio (queda de energia, processo morto): o que estiver na reserva e faltar na pasta
/// volta ao lugar, antes de qualquer outra coisa.
fn recuperar_troca_parada(programa: &Path) -> io::Result<()> {
    let reserva = programa.join(RESERVA);
    if !reserva.is_dir() { return Ok(()); }
    for nome in DO_PACOTE {
        let (guardado, lugar) = (reserva.join(nome), programa.join(nome));
        if guardado.exists() && !lugar.exists() { fs::rename(&guardado, &lugar)?; }
    }
    apagar(&reserva)
}

/// Monta o pacote novo em `preparo` e confere que ele tem o essencial para abrir.
fn preparar(preparo: &Path, origem: &Path, pacote: &[u8], log: &mut Registro) -> io::Result<()> {
    apagar(preparo)?;
    fs::create_dir_all(preparo)?;
    // dentro do exe (zip) ou, na pasta de instalação, ao lado dele
    if pacote.len() > 100 {
        let n = extrair(pacote, preparo)?;
        log.anotar(&format!("pacote extraído: {n} bytes"));
    } else {
        let de = origem.parent().ok_or_else(|| io::Error::other("sem a pasta do instalador"))?;
        let mut n = 0;
        for nome in DO_PACOTE {
            if de.join(nome).exists() { n += copiar_arvore(&de.join(nome), &preparo.join(nome))?; }
        }
        log.anotar(&format!("pasta copiada: {n} bytes"));
    }
    if !preparo.join("python").join("pythonw.exe").is_file() || !preparo.join("servidor").join("server.py").is_file() {
        return Err(io::Error::other("o pacote do Giz Livre está incompleto (falta a pasta python ou servidor): extraia \
            o zip inteiro e tente de novo"));
    }
    Ok(())
}

/// Põe o pacote preparado no lugar, guardando o anterior em RESERVA. Se algo falhar, devolve o anterior e tira o
/// que já tinha entrado.
fn trocar_pacote(programa: &Path, preparo: &Path) -> io::Result<()> {
    let reserva = programa.join(RESERVA);
    apagar(&reserva)?;
    fs::create_dir_all(&reserva)?;
    let mut guardados = vec![];
    let mut colocados = vec![];
    let r = (|| -> io::Result<()> {
        for nome in DO_PACOTE {
            if programa.join(nome).exists() {
                fs::rename(programa.join(nome), reserva.join(nome))?;
                guardados.push(nome);
            }
        }
        for nome in DO_PACOTE {
            if preparo.join(nome).exists() {
                fs::rename(preparo.join(nome), programa.join(nome))?;
                colocados.push(nome);
            }
        }
        Ok(())
    })();
    if let Err(e) = r {
        desfazer_troca(programa, preparo, &colocados, &guardados);
        let _ = fs::remove_dir(&reserva);   // só sai vazia (o que não voltou fica para recuperar_troca_parada)
        return Err(e);
    }
    Ok(())
}

fn desfazer_troca(programa: &Path, preparo: &Path, colocados: &[&str], guardados: &[&str]) {
    for nome in colocados { let _ = fs::rename(programa.join(nome), preparo.join(nome)); }
    let reserva = programa.join(RESERVA);
    for nome in guardados { let _ = fs::rename(reserva.join(nome), programa.join(nome)); }
}

pub fn instalar(destino: &Destino, origem: &Path, pacote: &[u8], log: &mut Registro) -> io::Result<()> {
    let atualizacao = ler_texto(HKCU, &destino.chave, "DisplayVersion").is_some();
    fs::create_dir_all(&destino.programa)?;
    recuperar_troca_parada(&destino.programa)?;
    // 1) o pacote novo inteiro, preparado e conferido antes de mexer na instalação
    let preparo = destino.programa.join(PREPARO);
    let exe = destino.exe();
    let trocar_o_exe = !mesmo_arquivo(origem, &exe);
    let novo_exe = preparo.join(EXE);
    let r = preparar(&preparo, origem, pacote, log)
        .and_then(|()| if trocar_o_exe { fs::copy(origem, &novo_exe).map(|_| ()) } else { Ok(()) });
    if let Err(e) = r {
        let _ = apagar(&preparo);
        return Err(e);
    }
    // 2) a versão aberta (janela própria, ou o GizLivre.exe do PyInstaller com o Edge) sai antes da troca; se uma
    //    janela da lousa ficar aberta, nada é mexido
    match fechar_programa(&destino.programa, origem) {
        Ok(n) => log.anotar(&format!("programas fechados: {n}")),
        Err(e) => { let _ = apagar(&preparo); return Err(e); }
    }
    // 3) a troca: o pacote anterior vai para a reserva e o novo entra; depois, o exe (que tem a sua própria reserva)
    trocar_pacote(&destino.programa, &preparo).inspect_err(|_| { let _ = apagar(&preparo); })?;
    if trocar_o_exe {
        if let Err(e) = trocar_exe(&novo_exe, &exe, &lugares_de_sobra(destino)) {
            let colocados: Vec<&str> = DO_PACOTE.iter().copied().filter(|n| destino.programa.join(n).exists()).collect();
            let guardados: Vec<&str> = DO_PACOTE.iter().copied().filter(|n| destino.programa.join(RESERVA).join(n).exists()).collect();
            // o pacote novo volta para o preparo (sai junto com ele) e o anterior volta ao lugar
            desfazer_troca(&destino.programa, &preparo, &colocados, &guardados);
            let _ = apagar(&preparo);
            // só sai vazia: se algo não voltou, a reserva fica para recuperar_troca_parada na próxima vez
            let _ = fs::remove_dir(destino.programa.join(RESERVA));
            return Err(e);
        }
    }
    // 4) deu certo: a reserva, o preparo e os restos do Inno Setup e do PyInstaller saem (o que estiver preso vai
    //    para a pasta temporária e sai depois)
    let lugares = lugares_de_sobra(destino);
    for p in [destino.programa.join(RESERVA), preparo.clone()].into_iter().chain(RESTOS.iter().map(|n| destino.programa.join(n))) {
        if apagar(&p).is_err() {
            let nome = p.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            log.anotar(&format!("{nome} preso; movendo para a pasta temporária"));
            let _ = mover_para_sobra(&p, &nome, &lugares);
        }
    }
    // 5) atalhos: o do menu Iniciar sempre; o da Área de Trabalho na instalação nova, ou na atualização se já existia.
    //    O "Giz Livre - pasta dos quadros" do Inno fica como está.
    let _ = fs::remove_file(destino.menu.join(ATALHO_DESINSTALAR));
    let area = destino.area.join(ATALHO);
    let com_area = !atualizacao || area.exists();
    {
        let _com = Com::iniciar();
        criar_atalho(&destino.menu.join(ATALHO), &exe, &destino.programa)?;
        if com_area { criar_atalho(&area, &exe, &destino.programa)?; }
    }
    registrar(destino, &exe)?;
    unsafe { SHChangeNotify(0x0800_0000, 0, std::ptr::null(), std::ptr::null()) };   // SHCNE_ASSOCCHANGED: refaz ícones
    Ok(())
}

/// Troca o programa pelo novo sem deixar a pasta sem GizLivre.exe: o antigo vai para o lado (GizLivre.exe.antigo), o
/// novo entra e, se o novo não entrar, o antigo volta ao lugar. Antes, o antigo saía primeiro e uma falha no último
/// passo deixava a instalação sem programa.
fn trocar_exe(novo: &Path, exe: &Path, lugares: &[PathBuf]) -> io::Result<()> {
    let antigo = exe.with_file_name(format!("{EXE}.antigo"));
    if antigo.exists() {
        if !exe.exists() {
            // uma troca anterior parou no meio: a reserva é a única cópia e volta ao lugar antes de tudo
            if let Err(e) = fs::rename(&antigo, exe) {
                let _ = fs::remove_file(novo);
                return Err(e);
            }
        } else if fs::remove_file(&antigo).is_err() {
            mover_para_sobra(&antigo, EXE, lugares)?;   // sobra de uma troca que deu certo, ainda aberta
        }
    }
    let tinha = exe.exists();
    if tinha {
        if let Err(e) = fs::rename(exe, &antigo) {
            let _ = fs::remove_file(novo);
            return Err(e);                           // nada mudou: o antigo continua no lugar
        }
    }
    if let Err(e) = fs::rename(novo, exe) {
        if tinha { let _ = fs::rename(&antigo, exe); }
        let _ = fs::remove_file(novo);
        return Err(e);
    }
    if tinha && fs::remove_file(&antigo).is_err() {
        let _ = mover_para_sobra(&antigo, EXE, lugares);   // aberto: sai quando der, como as outras sobras
    }
    Ok(())
}

pub fn desinstalar(destino: &Destino, atual: &Path, silencioso: bool) -> io::Result<()> {
    if !silencioso && perguntar("Remover o Giz Livre deste computador?\n\nOs quadros ficam guardados na pasta \
        Documentos\\Giz Livre.", 0x4 | 0x20) != 6 {
        return Ok(());
    }
    // o programa sai primeiro (auditoria de 29/10/2026, rodada 2): antes, registro e atalhos saíam e, se o exe não
    // pudesse ser movido, a desinstalação ficava pela metade. Se ele não sair, nada é mexido.
    if let Err(e) = fechar_programa(&destino.programa, atual) {
        if !silencioso { avisar(&e.to_string()); }
        return Err(e);
    }
    let lugares = lugares_de_sobra(destino);
    let exe = destino.exe();
    if exe.exists() {
        if mesmo_arquivo(atual, &exe) || fs::remove_file(&exe).is_err() {
            // o programa em uso não pode ser apagado, mas pode ser movido
            mover_para_sobra(&exe, EXE, &lugares)?;
        }
    }
    for p in [destino.menu.join(ATALHO), destino.menu.join(ATALHO_DESINSTALAR), destino.area.join(ATALHO)] {
        let _ = fs::remove_file(p);
    }
    apagar_chave(HKCU, &destino.chave);
    for nome in RESTOS.iter().chain(DO_PACOTE.iter()).chain([PREPARO, RESERVA].iter()) {
        let p = destino.programa.join(nome);
        if apagar(&p).is_err() { let _ = mover_para_sobra(&p, nome, &lugares); }
    }
    for resto in [format!("{EXE}.novo"), format!("{EXE}.antigo")] {
        let p = destino.programa.join(resto);
        if p.exists() && fs::remove_file(&p).is_err() { let _ = mover_para_sobra(&p, EXE, &lugares); }
    }
    // só some se ficou vazia: nada que o usuário tenha posto lá é apagado
    let _ = fs::remove_dir(&destino.programa);
    unsafe { SHChangeNotify(0x0800_0000, 0, std::ptr::null(), std::ptr::null()) };
    if !silencioso {
        perguntar("O Giz Livre foi removido. Os quadros continuam guardados na pasta Documentos\\Giz Livre.", 0x40);
    }
    Ok(())
}

// ---- fechar a versão aberta ----
// Só processos desta conta cujo executável está na pasta do programa (GizLivre.exe e o pythonw.exe do servidor); o
// Edge e o Chrome do professor nunca são tocados. A janela própria recebe antes o pedido de fechar (como o X), para
// a página terminar de gravar; o que sobrar em 15 s é encerrado.
fn processos_na_pasta(pasta: &Path, menos: u32) -> Vec<(u32, PathBuf)> {
    let Ok(pasta) = fs::canonicalize(pasta) else { return vec![] };
    let pasta = pasta.to_string_lossy().to_lowercase();
    let mut lista = vec![];
    unsafe {
        let foto = CreateToolhelp32Snapshot(0x2, 0);   // TH32CS_SNAPPROCESS
        if foto == -1 { return lista; }
        let mut p: Processo = std::mem::zeroed();
        p.tam = std::mem::size_of::<Processo>() as u32;
        let mut ok = Process32FirstW(foto, &mut p);
        while ok != 0 {
            if p.pid != menos && p.pid != 0 {
                let h = OpenProcess(0x1000, 0, p.pid);   // PROCESS_QUERY_LIMITED_INFORMATION
                if h != 0 {
                    let mut buf = [0u16; 1024];
                    let mut tam = buf.len() as u32;
                    if QueryFullProcessImageNameW(h, 0, buf.as_mut_ptr(), &mut tam) != 0 {
                        let caminho = PathBuf::from(String::from_utf16_lossy(&buf[..tam as usize]));
                        let c = fs::canonicalize(&caminho).unwrap_or(caminho.clone()).to_string_lossy().to_lowercase();
                        if c.starts_with(&format!("{pasta}\\")) { lista.push((p.pid, caminho)); }
                    }
                    CloseHandle(h);
                }
            }
            ok = Process32NextW(foto, &mut p);
        }
        CloseHandle(foto);
    }
    lista
}

/// Quanto a atualização espera a janela da lousa fechar: um pouco mais que o prazo que a própria janela se dá com uma
/// gravação em andamento (2 min, ESPERA_GRAVANDO em main.rs). Antes eram 15 s, e a atualização podia cortar uma
/// gravação lenta ou fechar uma janela que o professor tinha mandado ficar aberta (auditoria de 30/10/2026, GL-N02).
const ESPERA_JANELA: Duration = Duration::from_secs(130);
const FICOU_ABERTO: &str = "O Giz Livre continua aberto, talvez com um quadro que não foi salvo. Salve ou feche a \
    lousa e tente de novo. Nada foi mudado.";

/// Fecha a versão aberta antes de mexer na pasta. Cada janela da lousa recebe o pedido de fechar (como o X) e decide:
/// grava e fecha; fecha sozinha se a página travou (5 s) ou se a gravação passou de 2 min; ou fica aberta, se a
/// gravação falhou e o professor escolheu não fechar. Uma janela da lousa nunca é encerrada à força: se alguma
/// continuar aberta, devolve erro e quem chamou não mexe em nada. Só o que não tem janela da lousa (o servidor, ou a
/// 1.x do PyInstaller, que mostrava a lousa no Edge) é encerrado depois do prazo.
fn fechar_programa(pasta: &Path, este: &Path) -> io::Result<usize> {
    let eu = std::process::id();
    let lista: Vec<_> = processos_na_pasta(pasta, eu).into_iter().filter(|(_, c)| !mesmo_arquivo(c, este)).collect();
    if lista.is_empty() { return Ok(0); }
    let janelas: usize = lista.iter().map(|(pid, _)| janelas_da_lousa(*pid, true)).sum();
    // sem janela da lousa, não há a quem pedir: não espera
    let prazo = if janelas > 0 { ESPERA_JANELA } else { Duration::from_secs(2) };
    let inicio = Instant::now();
    while inicio.elapsed() < prazo {
        if processos_na_pasta(pasta, eu).iter().all(|(_, c)| mesmo_arquivo(c, este)) { return Ok(lista.len()); }
        std::thread::sleep(Duration::from_millis(200));
    }
    let restam: Vec<_> = processos_na_pasta(pasta, eu).into_iter().filter(|(_, c)| !mesmo_arquivo(c, este)).collect();
    if restam.iter().any(|(pid, _)| janelas_da_lousa(*pid, false) > 0) {
        return Err(io::Error::other(FICOU_ABERTO));
    }
    for (pid, _) in restam {
        unsafe {
            let h = OpenProcess(0x0001 | 0x00100000, 0, pid);   // PROCESS_TERMINATE | SYNCHRONIZE
            if h != 0 { TerminateProcess(h, 1); WaitForSingleObject(h, 5000); CloseHandle(h); }
        }
    }
    Ok(lista.len())
}

/// Linha de comando de um processo desta conta (NtQueryInformationProcess, classe 60), sem abrir PowerShell.
fn linha_de_comando(pid: u32) -> Option<String> {
    unsafe {
        let h = OpenProcess(0x1000, 0, pid);   // PROCESS_QUERY_LIMITED_INFORMATION
        if h == 0 { return None; }
        let mut buf = vec![0u8; 64 * 1024];
        let mut tam = 0u32;
        let r = NtQueryInformationProcess(h, 60, buf.as_mut_ptr(), buf.len() as u32, &mut tam);
        CloseHandle(h);
        if r != 0 { return None; }
        // UNICODE_STRING { Length: u16, MaximumLength: u16, (alinhamento), Buffer: *u16 } seguido do texto
        let compr = u16::from_ne_bytes([buf[0], buf[1]]) as usize / 2;
        let ptr = usize::from_ne_bytes(buf[8..16].try_into().ok()?) as *const u16;
        if ptr.is_null() || compr == 0 { return None; }
        Some(String::from_utf16_lossy(std::slice::from_raw_parts(ptr, compr)))
    }
}

/// O --user-data-dir de uma linha de comando do WebView2 (com ou sem aspas).
pub fn pasta_de_dados_do_webview(cmd: &str) -> Option<String> {
    let i = cmd.find("--user-data-dir=")? + "--user-data-dir=".len();
    let resto = &cmd[i..];
    Some(if let Some(r) = resto.strip_prefix('"') { r.split('"').next()?.to_string() }
         else { resto.split(' ').next()?.to_string() })
}

/// Depois de uma queda do Giz Livre, o processo principal do WebView2 fica órfão até o logoff, segurando o perfil, e a
/// reabertura falha (0x80070578 ou 0xc0000409; achado do Bancada e do Giz na Tela em 29/10/2026). Encerra só os
/// msedgewebview2.exe principais (sem --type) com o --user-data-dir exatamente igual ao `perfil` e o pai já morto.
/// Devolve os PIDs encerrados.
pub fn encerrar_webview_orfao(perfil: &Path) -> Vec<u32> {
    let alvo = perfil.display().to_string().trim_end_matches('\\').to_lowercase();
    let mut vivos = std::collections::HashSet::new();
    let mut candidatos = vec![];
    unsafe {
        let foto = CreateToolhelp32Snapshot(0x2, 0);
        if foto == -1 { return vec![]; }
        let mut p: Processo = std::mem::zeroed();
        p.tam = std::mem::size_of::<Processo>() as u32;
        let mut ok = Process32FirstW(foto, &mut p);
        while ok != 0 {
            vivos.insert(p.pid);
            if String::from_utf16_lossy(&p.exe).trim_end_matches('\0').eq_ignore_ascii_case("msedgewebview2.exe") {
                candidatos.push((p.pid, p.pai));
            }
            ok = Process32NextW(foto, &mut p);
        }
        CloseHandle(foto);
    }
    let mut encerrados = vec![];
    for (pid, pai) in candidatos {
        if vivos.contains(&pai) { continue; }                       // o dono ainda está vivo: não é órfão
        let Some(cmd) = linha_de_comando(pid) else { continue };
        if cmd.contains("--type=") { continue; }                    // só o processo principal
        let Some(dados) = pasta_de_dados_do_webview(&cmd) else { continue };
        if dados.trim_end_matches('\\').to_lowercase() != alvo { continue; }   // só o perfil da nossa janela
        unsafe {
            let h = OpenProcess(0x0001 | 0x00100000, 0, pid);           // PROCESS_TERMINATE | SYNCHRONIZE
            if h == 0 { continue; }
            // só conta como encerrado o que de fato saiu (TerminateProcess aceito e o processo terminado em 3 s)
            let saiu = TerminateProcess(h, 1) != 0 && WaitForSingleObject(h, 3000) == 0;   // WAIT_OBJECT_0
            CloseHandle(h);
            if saiu { encerrados.push(pid); }
        }
    }
    encerrados
}

/// Quantos processos filhos de `pid` ainda estão vivos (os do WebView2 desta janela, ao fechar).
pub fn filhos_vivos(pid: u32) -> usize {
    let mut n = 0;
    unsafe {
        let foto = CreateToolhelp32Snapshot(0x2, 0);
        if foto == -1 { return 0; }
        let mut p: Processo = std::mem::zeroed();
        p.tam = std::mem::size_of::<Processo>() as u32;
        let mut ok = Process32FirstW(foto, &mut p);
        while ok != 0 {
            if p.pai == pid && String::from_utf16_lossy(&p.exe).trim_end_matches('\0').eq_ignore_ascii_case("msedgewebview2.exe") { n += 1; }
            ok = Process32NextW(foto, &mut p);
        }
        CloseHandle(foto);
    }
    n
}

/// Janelas da lousa ("Tauri Window") do processo. Com `fechar`, manda a cada uma o WM_CLOSE, como o X da janela.
fn janelas_da_lousa(pid: u32, fechar: bool) -> usize {
    struct Busca { pid: u32, achadas: usize, fechar: bool }
    unsafe extern "system" fn cada(h: isize, p: isize) -> i32 {
        let busca = &mut *(p as *mut Busca);
        let mut dono = 0u32;
        GetWindowThreadProcessId(h, &mut dono);
        if dono == busca.pid {
            let mut c = [0u16; 64];
            let n = GetClassNameW(h, c.as_mut_ptr(), 64);
            if String::from_utf16_lossy(&c[..n.max(0) as usize]) == "Tauri Window" {
                if busca.fechar { PostMessageW(h, 0x0010, 0, 0); }
                busca.achadas += 1;
            }
        }
        1
    }
    let mut busca = Busca { pid, achadas: 0, fechar };
    unsafe { EnumWindows(cada, &mut busca as *mut Busca as isize); }
    busca.achadas
}

// cópias antigas, movidas para a pasta temporária por uma atualização ou desinstalação com elas abertas
const PREFIXO_SOBRA: &str = "GizLivre-antigo-";

fn nome_de_sobra(lugar: &Path, nome: &str) -> PathBuf {
    let n = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0);
    lugar.join(format!("{PREFIXO_SOBRA}{}-{n}-{nome}", std::process::id()))
}

/// Onde pôr o que está preso: a pasta temporária e, se ela falhar (outro volume, sem permissão), a pasta de programas
/// da conta, que fica no mesmo volume da instalação (auditoria de 29/10/2026, rodada 2).
fn lugares_de_sobra(destino: &Destino) -> Vec<PathBuf> {
    let mut l = vec![std::env::temp_dir()];
    if let Some(p) = destino.programa.parent() { l.push(p.to_path_buf()); }
    l
}

/// Move `p` para um dos lugares de sobra. Arquivo em uso (erro 32) ou acesso negado (5): tenta de novo por ~10 s.
fn mover_para_sobra(p: &Path, nome: &str, lugares: &[PathBuf]) -> io::Result<()> {
    let inicio = Instant::now();
    loop {
        let mut ultimo = io::Error::other("nenhum lugar para pôr o arquivo");
        let mut preso = false;
        for lugar in lugares {
            match fs::rename(p, nome_de_sobra(lugar, nome)) {
                Ok(()) => return Ok(()),
                Err(e) => { preso |= matches!(e.raw_os_error(), Some(5) | Some(32)); ultimo = e; }
            }
        }
        if !preso || inicio.elapsed() > Duration::from_secs(10) { return Err(ultimo); }
        std::thread::sleep(Duration::from_millis(300));
    }
}

fn limpar_sobras(lugares: &[PathBuf]) {
    for lugar in lugares {
        let Ok(lista) = fs::read_dir(lugar) else { continue };
        for item in lista.flatten() {
            if item.file_name().to_string_lossy().starts_with(PREFIXO_SOBRA) {
                let _ = apagar(&item.path());      // o que ainda estiver aberto fica para a próxima
            }
        }
    }
}

fn tamanho_da_pasta(p: &Path) -> u64 {
    fs::read_dir(p).map(|l| l.flatten().map(|e| {
        let c = e.path();
        if c.is_dir() { tamanho_da_pasta(&c) } else { e.metadata().map(|m| m.len()).unwrap_or(0) }
    }).sum()).unwrap_or(0)
}

fn registrar(destino: &Destino, exe: &Path) -> io::Result<()> {
    apagar_chave(HKCU, &destino.chave);     // tira os valores do Inno Setup
    let exe_txt = exe.display().to_string();
    let textos = [
        ("DisplayName", format!("Giz Livre {VERSAO}")),
        ("DisplayVersion", VERSAO.to_string()),
        ("Publisher", "Heraldo Antunes (projeto livre)".to_string()),
        ("DisplayIcon", format!("{exe_txt},0")),
        ("InstallLocation", format!("{}\\", destino.programa.display())),
        ("UninstallString", format!("\"{exe_txt}\" --desinstalar")),
        ("QuietUninstallString", format!("\"{exe_txt}\" --desinstalar --silencioso")),
        ("URLInfoAbout", "https://github.com/HeraldoAntunes/giz-livre".to_string()),
    ];
    let numeros = [("NoModify", 1u32), ("NoRepair", 1), ("EstimatedSize", (tamanho_da_pasta(&destino.programa) / 1024) as u32)];
    let mut chave: isize = 0;
    let r = unsafe { RegCreateKeyExW(HKCU, largo(&destino.chave).as_ptr(), 0, std::ptr::null(), 0, 0x20006,
        std::ptr::null(), &mut chave, std::ptr::null_mut()) };
    if r != 0 { return Err(io::Error::from_raw_os_error(r)); }
    let mut erro = 0;
    for (nome, valor) in textos {
        let v = largo(&valor);
        erro |= unsafe { RegSetValueExW(chave, largo(nome).as_ptr(), 0, 1, v.as_ptr() as *const u8, (v.len() * 2) as u32) };
    }
    for (nome, valor) in numeros {
        erro |= unsafe { RegSetValueExW(chave, largo(nome).as_ptr(), 0, 4, &valor as *const u32 as *const u8, 4) };
    }
    unsafe { RegCloseKey(chave) };
    if erro != 0 { return Err(io::Error::other("não foi possível registrar em Aplicativos instalados")); }
    Ok(())
}

// ---- instalação antiga "para todos os usuários" ----
// O instalador do Inno deixava escolher instalar para todos (Arquivos de Programas, pede administrador). A instalação
// própria é só da conta e não pede administrador, então não consegue tirar aquela: avisa, para não ficarem duas
// versões com atalhos diferentes (auditoria de 29/10/2026). Tirar a antiga: Aplicativos instalados, como administrador.
pub fn versao_para_todos() -> Option<String> {
    const HKLM: isize = 0x80000002u32 as i32 as isize;
    let sub = CHAVE.strip_prefix(r"Software\").unwrap_or(CHAVE);
    ler_texto(HKLM, &format!(r"SOFTWARE\{sub}"), "DisplayVersion")
}

pub fn aviso_para_todos(versao: Option<String>) -> Option<String> {
    versao.map(|v| format!("Este computador também tem o Giz Livre {v} instalado para todos os usuários (na pasta \
        Arquivos de Programas). Ele continua lá, e o atalho dele abre a versão antiga.\n\nPara tirá-lo, abra \
        Aplicativos instalados do Windows com uma conta de administrador e desinstale o \"Giz Livre {v}\". Os quadros \
        não são apagados."))
}

// ---- WebView2 ----
// A janela usa o WebView2 da Microsoft (vem no Windows 11 e nos Windows 10 atualizados), que é separado do Edge do dia
// a dia: o programa não depende de navegador nenhum. Sem ele, avisa e leva à página de download da Microsoft.
pub fn tem_webview2() -> bool {
    const CHAVE_WV: &str = r"Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";
    const HKLM: isize = 0x80000002u32 as i32 as isize;
    let ler = |raiz: isize, sub: String, flags: u32| -> bool {
        let (sub, valor) = (largo(&sub), largo("pv"));
        let mut buf = [0u16; 64];
        let mut tam = (buf.len() * 2) as u32;
        let r = unsafe { RegGetValueW(raiz, sub.as_ptr(), valor.as_ptr(), flags, std::ptr::null_mut(), buf.as_mut_ptr(), &mut tam) };
        if r != 0 { return false; }
        let v = String::from_utf16_lossy(&buf[..(tam as usize / 2).min(buf.len()).saturating_sub(1)]);
        !v.is_empty() && v != "0.0.0.0"
    };
    ler(HKLM, format!(r"SOFTWARE\{CHAVE_WV}"), 0x2 | 0x20000) || ler(HKLM, format!(r"SOFTWARE\{CHAVE_WV}"), 0x2)
        || ler(HKCU, format!(r"Software\{CHAVE_WV}"), 0x2)
}

pub fn avisar_sem_webview2() {
    let texto = "O Giz Livre precisa do WebView2 da Microsoft, que mostra a lousa na janela do programa. Ele vem no \
        Windows 11 e nos Windows 10 atualizados, mas não foi encontrado neste computador.\n\nPara resolver: instale o \
        \"WebView2 Runtime\" do site da Microsoft (gratuito).\n\nAbrir a página de download agora?";
    if perguntar(texto, 0x4 | 0x30) == 6 {
        let url = largo("https://developer.microsoft.com/microsoft-edge/webview2/");
        unsafe { ShellExecuteW(0, largo("open").as_ptr(), url.as_ptr(), std::ptr::null(), std::ptr::null(), 1) };
    }
}

// ---- Windows ----
pub const HKCU: isize = 0x80000001u32 as i32 as isize;

pub fn largo(t: &str) -> Vec<u16> { t.encode_utf16().chain([0]).collect() }

#[link(name = "advapi32")]
extern "system" {
    fn RegCreateKeyExW(chave: isize, sub: *const u16, reservado: u32, classe: *const u16, opcoes: u32, acesso: u32,
        seguranca: *const u8, saida: *mut isize, disposicao: *mut u32) -> i32;
    fn RegSetValueExW(chave: isize, nome: *const u16, reservado: u32, tipo: u32, dados: *const u8, tam: u32) -> i32;
    fn RegDeleteTreeW(chave: isize, sub: *const u16) -> i32;
    fn RegCloseKey(chave: isize) -> i32;
    fn RegGetValueW(chave: isize, sub: *const u16, valor: *const u16, flags: u32, tipo: *mut u32, dados: *mut u16,
        tam: *mut u32) -> i32;
}
#[link(name = "shell32")]
extern "system" {
    fn SHGetKnownFolderPath(id: *const Guid, flags: u32, token: isize, saida: *mut *mut u16) -> i32;
    fn SHChangeNotify(evento: i32, flags: u32, a: *const c_void, b: *const c_void);
    fn ShellExecuteW(hwnd: isize, op: *const u16, arq: *const u16, params: *const u16, pasta: *const u16, mostrar: i32) -> isize;
}
#[link(name = "ole32")]
extern "system" {
    fn CoInitializeEx(reservado: *const c_void, modo: u32) -> i32;
    fn CoUninitialize();
    fn CoCreateInstance(clsid: *const Guid, externo: *const c_void, contexto: u32, iid: *const Guid,
        saida: *mut *mut c_void) -> i32;
    fn CoTaskMemFree(p: *const c_void);
}
#[link(name = "user32")]
extern "system" {
    fn MessageBoxW(hwnd: isize, texto: *const u16, titulo: *const u16, tipo: u32) -> i32;
    fn EnumWindows(f: unsafe extern "system" fn(isize, isize) -> i32, p: isize) -> i32;
    fn GetWindowThreadProcessId(h: isize, pid: *mut u32) -> u32;
    fn GetClassNameW(h: isize, nome: *mut u16, tam: i32) -> i32;
    fn PostMessageW(h: isize, msg: u32, w: usize, l: isize) -> i32;
}
#[link(name = "ntdll")]
extern "system" {
    fn NtQueryInformationProcess(h: isize, classe: u32, saida: *mut u8, tam: u32, devolvido: *mut u32) -> i32;
}
#[link(name = "kernel32")]
extern "system" {
    fn CreateToolhelp32Snapshot(flags: u32, pid: u32) -> isize;
    fn Process32FirstW(foto: isize, p: *mut Processo) -> i32;
    fn Process32NextW(foto: isize, p: *mut Processo) -> i32;
    fn OpenProcess(acesso: u32, herdar: i32, pid: u32) -> isize;
    fn QueryFullProcessImageNameW(h: isize, flags: u32, nome: *mut u16, tam: *mut u32) -> i32;
    fn TerminateProcess(h: isize, codigo: u32) -> i32;
    fn WaitForSingleObject(h: isize, ms: u32) -> u32;
    fn CloseHandle(h: isize) -> i32;
}

#[repr(C)]
struct Processo { tam: u32, uso: u32, pid: u32, heap: usize, modulo: u32, threads: u32, pai: u32, prioridade: i32,
    flags: u32, exe: [u16; 260] }

pub fn perguntar(texto: &str, tipo: u32) -> i32 {
    // testes (GIZ_SEM_CAIXAS=<arquivo>): a mensagem vai para o arquivo em vez de abrir uma caixa na tela do professor;
    // as perguntas valem como "Cancelar"/"Não" (nada é feito sem alguém responder)
    if let Some(arq) = std::env::var_os("GIZ_SEM_CAIXAS") {
        let _ = fs::OpenOptions::new().create(true).append(true).open(arq)
            .and_then(|mut f| writeln!(f, "caixa: {}", texto.replace('\n', " ")));
        return if tipo & 0xF == 0 { 1 } else { 2 };   // MB_OK: IDOK; as outras: IDCANCEL
    }
    unsafe { MessageBoxW(0, largo(texto).as_ptr(), largo("Giz Livre").as_ptr(), tipo) }
}
pub fn avisar(texto: &str) { perguntar(texto, 0x30); }

#[repr(C)]
struct Guid(u32, u16, u16, [u8; 8]);
#[repr(C)]
struct ChaveDePropriedade { fmtid: Guid, pid: u32 }
#[repr(C)]
struct Propvariant { vt: u16, r: [u16; 3], texto: *const u16, resto: usize }

const FOLDERID_PROGRAMS: Guid = Guid(0xA77F5D77, 0x2E2B, 0x44C3, [0xA6, 0xA2, 0xAB, 0xA6, 0x01, 0x05, 0x4A, 0x51]);
const FOLDERID_DESKTOP: Guid = Guid(0xB4BFCC3A, 0xDB2C, 0x424C, [0xB0, 0x29, 0x7F, 0xE9, 0x9A, 0x87, 0xC6, 0x41]);
const CLSID_SHELLLINK: Guid = Guid(0x00021401, 0, 0, [0xC0, 0, 0, 0, 0, 0, 0, 0x46]);
const IID_ISHELLLINKW: Guid = Guid(0x000214F9, 0, 0, [0xC0, 0, 0, 0, 0, 0, 0, 0x46]);
const IID_IPERSISTFILE: Guid = Guid(0x0000010B, 0, 0, [0xC0, 0, 0, 0, 0, 0, 0, 0x46]);
const IID_IPROPERTYSTORE: Guid = Guid(0x886D8EEB, 0x8CF2, 0x4446, [0x8D, 0x02, 0xCD, 0xBA, 0x1D, 0xBD, 0xCF, 0x99]);
const PKEY_APPUSERMODEL: Guid = Guid(0x9F4C2855, 0x9F79, 0x4B39, [0xA8, 0xD0, 0xE1, 0xD4, 0x2D, 0xE1, 0xD5, 0xF3]);

fn pasta_conhecida(id: &Guid) -> Option<PathBuf> {
    let mut p: *mut u16 = std::ptr::null_mut();
    if unsafe { SHGetKnownFolderPath(id, 0, 0, &mut p) } != 0 || p.is_null() { return None; }
    let texto = unsafe {
        let tam = (0..).take_while(|&i| *p.add(i) != 0).count();
        let t = String::from_utf16_lossy(std::slice::from_raw_parts(p, tam));
        CoTaskMemFree(p as *const c_void);
        t
    };
    Some(PathBuf::from(texto))
}

pub fn ler_texto(raiz: isize, sub: &str, valor: &str) -> Option<String> {
    let (sub, valor) = (largo(sub), largo(valor));
    let mut buf = [0u16; 260];
    let mut tam = (buf.len() * 2) as u32;
    let r = unsafe { RegGetValueW(raiz, sub.as_ptr(), valor.as_ptr(), 0x2, std::ptr::null_mut(), buf.as_mut_ptr(), &mut tam) };
    if r != 0 { return None; }
    Some(String::from_utf16_lossy(&buf[..(tam as usize / 2).min(buf.len()).saturating_sub(1)]))
}

fn apagar_chave(raiz: isize, sub: &str) {
    unsafe { RegDeleteTreeW(raiz, largo(sub).as_ptr()) };
}

/// COM aberto só enquanto os atalhos são criados.
struct Com(bool);
impl Com {
    fn iniciar() -> Com { Com(unsafe { CoInitializeEx(std::ptr::null(), 0x2) } >= 0) }   // apartamento único
}
impl Drop for Com {
    fn drop(&mut self) { if self.0 { unsafe { CoUninitialize() } } }
}

type Objeto = *mut *const usize;

/// Método `i` da tabela do objeto COM.
unsafe fn metodo<T: Copy>(obj: Objeto, i: usize) -> T { std::mem::transmute_copy(&*(*obj).add(i)) }

unsafe fn soltar(obj: Objeto) {
    let f: unsafe extern "system" fn(Objeto) -> u32 = metodo(obj, 2);
    f(obj);
}

/// Atalho para o programa com o AppUserModelID dele: fixado na barra de tarefas, fica o Giz Livre com o ícone dele.
fn criar_atalho(lnk: &Path, exe: &Path, pasta: &Path) -> io::Result<()> {
    let falha = |o: &str| io::Error::other(format!("não foi possível criar o atalho {} ({o})", lnk.display()));
    if let Some(p) = lnk.parent() { fs::create_dir_all(p)?; }
    unsafe {
        let mut link: *mut c_void = std::ptr::null_mut();
        if CoCreateInstance(&CLSID_SHELLLINK, std::ptr::null(), 1, &IID_ISHELLLINKW, &mut link) < 0 || link.is_null() {
            return Err(falha("ShellLink"));
        }
        let link = link as Objeto;
        type Texto = unsafe extern "system" fn(Objeto, *const u16) -> i32;
        type Icone = unsafe extern "system" fn(Objeto, *const u16, i32) -> i32;
        type Pedir = unsafe extern "system" fn(Objeto, *const Guid, *mut *mut c_void) -> i32;
        let (exe_t, pasta_t) = (largo(&exe.display().to_string()), largo(&pasta.display().to_string()));
        let desc = largo("Lousa livre e offline para aulas");
        let mut ok = metodo::<Texto>(link, 20)(link, exe_t.as_ptr()) >= 0               // SetPath
            && metodo::<Texto>(link, 9)(link, pasta_t.as_ptr()) >= 0                     // SetWorkingDirectory
            && metodo::<Texto>(link, 7)(link, desc.as_ptr()) >= 0                        // SetDescription
            && metodo::<Icone>(link, 17)(link, exe_t.as_ptr(), 0) >= 0;                  // SetIconLocation
        let pedir: Pedir = metodo(link, 0);                                              // QueryInterface
        let mut loja: *mut c_void = std::ptr::null_mut();
        if ok && pedir(link, &IID_IPROPERTYSTORE, &mut loja) >= 0 && !loja.is_null() {
            let loja = loja as Objeto;
            let id = largo(crate::APP_ID);
            let chave = ChaveDePropriedade { fmtid: PKEY_APPUSERMODEL, pid: 5 };          // PKEY_AppUserModel_ID
            let v = Propvariant { vt: 31, r: [0; 3], texto: id.as_ptr(), resto: 0 };     // VT_LPWSTR
            let definir: unsafe extern "system" fn(Objeto, *const ChaveDePropriedade, *const Propvariant) -> i32 =
                metodo(loja, 6);
            let gravar: unsafe extern "system" fn(Objeto) -> i32 = metodo(loja, 7);
            ok = definir(loja, &chave, &v) >= 0 && gravar(loja) >= 0;
            soltar(loja);
        } else {
            ok = false;
        }
        let mut arquivo: *mut c_void = std::ptr::null_mut();
        if ok && pedir(link, &IID_IPERSISTFILE, &mut arquivo) >= 0 && !arquivo.is_null() {
            let arquivo = arquivo as Objeto;
            let salvar: unsafe extern "system" fn(Objeto, *const u16, i32) -> i32 = metodo(arquivo, 6);
            ok = salvar(arquivo, largo(&lnk.display().to_string()).as_ptr(), 1) >= 0;
            soltar(arquivo);
        } else {
            ok = false;
        }
        soltar(link);
        if ok { Ok(()) } else { Err(falha("gravação")) }
    }
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn avisa_da_instalacao_para_todos_so_quando_existe() {
        assert!(aviso_para_todos(None).is_none());
        let a = aviso_para_todos(Some("1.15.2".into())).unwrap();
        assert!(a.contains("1.15.2") && a.contains("administrador") && a.contains("quadros"));
        // a chave procurada na parte do computador é a do Inno (HKLM\SOFTWARE\...\Uninstall\{...}_is1)
        assert!(CHAVE.starts_with(r"Software\Microsoft\Windows\CurrentVersion\Uninstall\{6F1B6C2E"));
        assert_eq!(versao_para_todos(), None);   // neste PC o Giz Livre nunca foi instalado para todos
    }

    // auditoria de 29/10/2026 (rodada 2): mover o exe em uso para a pasta temporária pode falhar (TEMP em outro volume,
    // arquivo preso); isso acontecia DEPOIS de tirar registro e atalhos, e a desinstalação ficava pela metade
    #[test]
    fn desinstalar_nao_deixa_pela_metade_se_o_exe_nao_sai() {
        let d = destino_de_teste("metade");
        fs::create_dir_all(&d.programa).unwrap();
        fs::write(d.exe(), b"programa").unwrap();
        fs::create_dir_all(&d.menu).unwrap();
        fs::write(d.menu.join(ATALHO), b"x").unwrap();
        registrar(&d, &d.exe()).unwrap();
        // a temporária num lugar onde nada pode ser posto (simula outro volume sem permissão): o exe não sai
        let antes = std::env::var_os("TMP");
        std::env::set_var("TMP", d.programa.join("nao-existe").join("de-jeito-nenhum"));
        let r = desinstalar(&d, &d.exe(), true);
        match antes { Some(v) => std::env::set_var("TMP", v), None => std::env::remove_var("TMP") }
        if r.is_err() {
            // não deu para tirar o programa: então nada pode ter sido mexido
            assert!(ler_texto(HKCU, &d.chave, "DisplayVersion").is_some(), "o registro saiu e o programa ficou");
            assert!(d.menu.join(ATALHO).exists(), "o atalho saiu e o programa ficou");
        } else {
            assert!(!d.exe().exists() && ler_texto(HKCU, &d.chave, "DisplayVersion").is_none());
        }
        apagar_chave(HKCU, &d.chave);
        let _ = fs::remove_dir_all(d.programa.parent().unwrap().parent().unwrap());
    }

    #[test]
    fn le_a_pasta_de_dados_do_webview_com_e_sem_aspas() {
        let c = r#""C:\Program Files (x86)\Microsoft\EdgeWebView\Application\1\msedgewebview2.exe" --embedded-browser-webview=1 --user-data-dir="C:\Users\x\AppData\Local\Giz Livre\janela\EBWebView" --noerrdialogs"#;
        assert_eq!(pasta_de_dados_do_webview(c).as_deref(), Some(r"C:\Users\x\AppData\Local\Giz Livre\janela\EBWebView"));
        assert_eq!(pasta_de_dados_do_webview(r"w.exe --user-data-dir=C:\p\EBWebView --x").as_deref(), Some(r"C:\p\EBWebView"));
        assert_eq!(pasta_de_dados_do_webview("w.exe --type=renderer"), None);
    }

    #[test]
    fn compara_versoes() {
        assert!(mais_nova("1.16.1", "1.16.0"));
        assert!(mais_nova("1.16.0", "1.15.2"));
        assert!(mais_nova("2.0.0", "1.99.9"));
        assert!(!mais_nova("1.16.0", "1.16.0"));
        assert!(!mais_nova("1.15.2", "1.16.0"));
        assert!(mais_nova("1.16.0", "versão estranha"));
    }

    fn destino_de_teste(nome: &str) -> Destino {
        let base = std::env::temp_dir().join(format!("gizlivre-teste-instalacao-{nome}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&base);
        Destino {
            programa: base.join("Programs").join("Giz Livre"),
            menu: base.join("Menu"),
            area: base.join("Area"),
            chave: format!(r"Software\GizLivreTeste\{nome}-{}", std::process::id()),
        }
    }

    fn pacote_de_teste(conteudo: &[u8]) -> Vec<u8> {
        let mut z = zip::ZipWriter::new(io::Cursor::new(Vec::new()));
        let op = zip::write::SimpleFileOptions::default();
        z.start_file("python/pythonw.exe", op).unwrap();
        z.write_all(conteudo).unwrap();
        z.start_file("servidor/server.py", op).unwrap();
        z.write_all(b"print()").unwrap();
        z.start_file("LICENSE", op).unwrap();
        z.write_all(b"MIT").unwrap();
        z.finish().unwrap().into_inner()
    }

    #[test]
    fn extrai_o_pacote_e_recusa_caminho_para_fora() {
        let d = destino_de_teste("extrair");
        assert!(extrair(&pacote_de_teste(b"py"), &d.programa).unwrap() > 0);
        assert_eq!(fs::read(d.programa.join("python").join("pythonw.exe")).unwrap(), b"py");
        let mut z = zip::ZipWriter::new(io::Cursor::new(Vec::new()));
        z.start_file("../fora.txt", zip::write::SimpleFileOptions::default()).unwrap();
        z.write_all(b"x").unwrap();
        let ruim = z.finish().unwrap().into_inner();
        assert!(extrair(&ruim, &d.programa).is_err());
        assert!(!d.programa.parent().unwrap().join("fora.txt").exists());
        let _ = fs::remove_dir_all(d.programa.parent().unwrap().parent().unwrap());
    }

    // o que a instalação faz com as pastas, por cima de uma instalação do Inno + PyInstaller (sem o pacote embutido,
    // que só existe no build montado: aqui vai um pacote de teste)
    #[test]
    fn instala_por_cima_do_inno_e_desinstala() {
        let d = destino_de_teste("ciclo");
        let base = d.programa.parent().unwrap().parent().unwrap().to_path_buf();
        fs::create_dir_all(d.programa.join("_internal")).unwrap();
        fs::write(d.programa.join("_internal").join("python313.dll"), b"x").unwrap();
        fs::write(d.programa.join("unins000.exe"), b"x").unwrap();
        fs::create_dir_all(&d.menu).unwrap();
        fs::write(d.menu.join(ATALHO_DESINSTALAR), b"x").unwrap();
        let origem = base.join("baixado").join(EXE);
        fs::create_dir_all(origem.parent().unwrap()).unwrap();
        fs::write(&origem, b"programa novo").unwrap();
        let mut log = Registro(None);
        let pacote = pacote_de_teste(b"py");
        instalar(&d, &origem, &pacote, &mut log).unwrap();
        assert_eq!(fs::read(d.exe()).unwrap(), b"programa novo");
        assert!(!d.programa.join("_internal").exists() && !d.programa.join("unins000.exe").exists());
        assert!(d.menu.join(ATALHO).exists() && d.area.join(ATALHO).exists());
        assert!(!d.menu.join(ATALHO_DESINSTALAR).exists());
        assert_eq!(ler_texto(HKCU, &d.chave, "DisplayVersion").as_deref(), Some(VERSAO));
        assert!(ler_texto(HKCU, &d.chave, "UninstallString").unwrap().ends_with("--desinstalar"));

        // atualização: quem tirou o atalho da Área de Trabalho não o ganha de volta
        fs::remove_file(d.area.join(ATALHO)).unwrap();
        fs::write(&origem, b"programa mais novo").unwrap();
        instalar(&d, &origem, &pacote, &mut log).unwrap();
        assert_eq!(fs::read(d.exe()).unwrap(), b"programa mais novo");
        assert!(!d.area.join(ATALHO).exists());

        assert!(d.programa.join("python").join("pythonw.exe").exists());
        // um arquivo do usuário na pasta impede que ela suma, e só ele fica
        fs::write(d.programa.join("meu-quadro.lousa"), b"{}").unwrap();
        desinstalar(&d, &origem, true).unwrap();
        assert!(ler_texto(HKCU, &d.chave, "DisplayVersion").is_none());
        assert!(!d.menu.join(ATALHO).exists());
        let sobrou: Vec<_> = fs::read_dir(&d.programa).unwrap().flatten().map(|e| e.file_name()).collect();
        assert_eq!(sobrou, vec![std::ffi::OsString::from("meu-quadro.lousa")]);
        apagar_chave(HKCU, r"Software\GizLivreTeste");
        let _ = fs::remove_dir_all(base);
    }

    // auditoria de 30/10/2026 (GL-N01): uma instalação que falha não pode deixar o exe sem o Python e o servidor
    // anteriores. Cada caso parte de uma versão instalada e confere que ela continua inteira.
    fn instalada_antes(nome: &str) -> (Destino, PathBuf) {
        let d = destino_de_teste(nome);
        let base = d.programa.parent().unwrap().parent().unwrap().to_path_buf();
        for (rel, txt) in [("python/pythonw.exe", "py antigo"), ("servidor/server.py", "srv antigo"), ("LICENSE", "MIT")] {
            let p = d.programa.join(rel);
            fs::create_dir_all(p.parent().unwrap()).unwrap();
            fs::write(p, txt).unwrap();
        }
        fs::write(d.exe(), b"exe antigo").unwrap();
        (d, base)
    }
    fn continua_a_antiga(d: &Destino) {
        assert_eq!(fs::read_to_string(d.programa.join("python/pythonw.exe")).unwrap(), "py antigo");
        assert_eq!(fs::read_to_string(d.programa.join("servidor/server.py")).unwrap(), "srv antigo");
        assert_eq!(fs::read(d.exe()).unwrap(), b"exe antigo");
        assert!(!d.programa.join(PREPARO).exists() && !d.programa.join(RESERVA).exists());
    }
    // pasta de instalação extraída do zip (o exe sem nada dentro, com python\ e servidor\ ao lado)
    fn pasta_do_zip(base: &Path, com_python: bool) -> PathBuf {
        let de = base.join("Instalar-GizLivre");
        if com_python {
            fs::create_dir_all(de.join("python")).unwrap();
            fs::write(de.join("python/pythonw.exe"), "py novo").unwrap();
        }
        fs::create_dir_all(de.join("servidor")).unwrap();
        fs::write(de.join("servidor/server.py"), "srv novo").unwrap();
        fs::write(de.join(EXE), b"exe novo").unwrap();
        de.join(EXE)
    }
    fn trava(p: &Path) -> fs::File {   // arquivo aberto sem dividir com ninguém: não se lê, não se move
        use std::os::windows::fs::OpenOptionsExt;
        fs::OpenOptions::new().read(true).share_mode(0).open(p).unwrap()
    }

    #[test]
    fn instalacao_com_origem_incompleta_nao_mexe_na_anterior() {
        let (d, base) = instalada_antes("incompleta");
        let origem = pasta_do_zip(&base, false);
        let erro = instalar(&d, &origem, &[], &mut Registro(None)).unwrap_err();
        assert!(erro.to_string().contains("incompleto"), "{erro}");
        continua_a_antiga(&d);
        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn instalacao_com_falha_de_copia_nao_mexe_na_anterior() {
        let (d, base) = instalada_antes("copia");
        let origem = pasta_do_zip(&base, true);
        let _t = trava(&origem.parent().unwrap().join("servidor/server.py"));
        assert!(instalar(&d, &origem, &[], &mut Registro(None)).is_err());
        continua_a_antiga(&d);
        drop(_t);
        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn troca_que_falha_no_meio_devolve_a_anterior() {
        let (d, base) = instalada_antes("meio");
        let origem = pasta_do_zip(&base, true);
        // o python já foi para a reserva quando o servidor não sai do lugar: o python tem de voltar
        let t = trava(&d.programa.join("servidor/server.py"));
        assert!(instalar(&d, &origem, &[], &mut Registro(None)).is_err());
        drop(t);
        continua_a_antiga(&d);
        // e, solto o arquivo, a mesma instalação vai até o fim
        instalar(&d, &origem, &[], &mut Registro(None)).unwrap();
        assert_eq!(fs::read_to_string(d.programa.join("python/pythonw.exe")).unwrap(), "py novo");
        assert_eq!(fs::read_to_string(d.programa.join("servidor/server.py")).unwrap(), "srv novo");
        assert_eq!(fs::read(d.exe()).unwrap(), b"exe novo");
        assert!(!d.programa.join(PREPARO).exists() && !d.programa.join(RESERVA).exists());
        apagar_chave(HKCU, r"Software\GizLivreTeste");
        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn troca_parada_por_queda_e_recuperada_antes_de_tudo() {
        let (d, base) = instalada_antes("parada");
        // queda no meio de uma troca anterior: python e servidor estavam na reserva
        fs::create_dir_all(d.programa.join(RESERVA)).unwrap();
        for n in ["python", "servidor"] { fs::rename(d.programa.join(n), d.programa.join(RESERVA).join(n)).unwrap(); }
        let origem = pasta_do_zip(&base, false);   // e a nova tentativa falha logo no preparo
        assert!(instalar(&d, &origem, &[], &mut Registro(None)).is_err());
        continua_a_antiga(&d);
        let _ = fs::remove_dir_all(base);
    }

    // o novo não entra no lugar (aqui, porque sumiu antes da troca): o antigo volta e a pasta nunca fica sem programa
    #[test]
    fn troca_do_exe_que_falha_devolve_o_antigo() {
        let d = destino_de_teste("troca");
        fs::create_dir_all(&d.programa).unwrap();
        let exe = d.exe();
        fs::write(&exe, b"programa antigo").unwrap();
        let novo = d.programa.join(format!("{EXE}.novo"));
        assert!(trocar_exe(&novo, &exe, &[d.programa.clone()]).is_err());
        assert_eq!(fs::read(&exe).unwrap(), b"programa antigo");
        assert!(!d.programa.join(format!("{EXE}.antigo")).exists());
        // e a troca que dá certo, com a sobra de uma troca anterior no caminho
        fs::write(d.programa.join(format!("{EXE}.antigo")), b"sobra").unwrap();
        fs::write(&novo, b"programa novo").unwrap();
        trocar_exe(&novo, &exe, &[d.programa.clone()]).unwrap();
        assert_eq!(fs::read(&exe).unwrap(), b"programa novo");
        assert!(!novo.exists() && !d.programa.join(format!("{EXE}.antigo")).exists());

        // troca anterior parada no meio (só a reserva existe) e falhas repetidas: sempre sobra uma cópia válida
        fs::rename(&exe, d.programa.join(format!("{EXE}.antigo"))).unwrap();
        for _ in 0..3 {
            assert!(trocar_exe(&novo, &exe, &[d.programa.clone()]).is_err());   // o novo não existe
            assert_eq!(fs::read(&exe).unwrap(), b"programa novo");
        }
        let _ = fs::remove_dir_all(d.programa.parent().unwrap().parent().unwrap());
    }
}
