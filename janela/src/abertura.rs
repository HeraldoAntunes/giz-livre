// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
//! P-ABERTURA B (22/11/2026): tela de abertura nativa, como a do Office. Aparece no clique do atalho, antes de subir o
//! servidor Python e antes de o WebView2 existir (no filme da 1.19.0, de 0,5 a 1 s sem nada na tela), com o ícone, o
//! nome, a versão, o que está acontecendo e uma barra de progresso. Some quando a galeria pinta (ver main.rs,
//! on_page_load). Janela Win32 pura, numa thread própria, sem WebView e sem crate nova: a API do Windows direto, como
//! em instalacao.rs (o perfil do exe no VirusTotal muda o mínimo).
use std::ffi::c_void;
use std::sync::atomic::{AtomicIsize, AtomicU32, Ordering};
use std::sync::Mutex;

use crate::instalacao::largo;

static JANELA: AtomicIsize = AtomicIsize::new(0);
static PASSO: AtomicU32 = AtomicU32::new(0);
static ESTADO: Mutex<String> = Mutex::new(String::new());
static ESCALA: AtomicU32 = AtomicU32::new(96);

const CLASSE: &str = "GizLivreAbertura";
const LARGURA: i32 = 440;
const ALTURA: i32 = 230;
// cores (0x00BBGGRR): fundo branco, borda e trilho cinza, a barra na cor de destaque do Giz (#0f6cbd)
const BRANCO: u32 = 0x00FF_FFFF;
const BORDA: u32 = 0x00D0_D0D0;
const TRILHO: u32 = 0x00E6_E6E6;
const DESTAQUE: u32 = 0x00BD_6C0F;
const TEXTO: u32 = 0x0024_2424;
const CINZA: u32 = 0x0061_6161;

const WM_DESTROY: u32 = 0x0002;
const WM_PAINT: u32 = 0x000F;
const WM_CLOSE: u32 = 0x0010;
const WM_ERASEBKGND: u32 = 0x0014;
const WM_TIMER: u32 = 0x0113;
const WM_APP_ESTADO: u32 = 0x8001;

#[repr(C)]
struct ClasseJanela { tam: u32, estilo: u32, proc_: unsafe extern "system" fn(isize, u32, usize, isize) -> isize,
    extra_classe: i32, extra_janela: i32, instancia: isize, icone: isize, cursor: isize, fundo: isize,
    menu: *const u16, nome: *const u16, icone_pequeno: isize }
#[repr(C)]
struct Mensagem { hwnd: isize, msg: u32, w: usize, l: isize, tempo: u32, x: i32, y: i32, privado: u32 }
#[repr(C)]
#[derive(Clone, Copy, Default)]
struct Retangulo { esq: i32, topo: i32, dir: i32, baixo: i32 }
#[repr(C)]
struct Pintura { hdc: isize, apagar: i32, rc: Retangulo, restaurar: i32, incremento: i32, reservado: [u8; 32] }
#[repr(C)]
struct InfoMonitor { tam: u32, monitor: Retangulo, trabalho: Retangulo, flags: u32 }
#[repr(C)]
struct Ponto { x: i32, y: i32 }

#[link(name = "user32")]
extern "system" {
    fn RegisterClassExW(c: *const ClasseJanela) -> u16;
    fn CreateWindowExW(ex: u32, classe: *const u16, titulo: *const u16, estilo: u32, x: i32, y: i32, l: i32, a: i32,
        pai: isize, menu: isize, inst: isize, p: *const c_void) -> isize;
    fn DefWindowProcW(h: isize, m: u32, w: usize, l: isize) -> isize;
    fn GetMessageW(m: *mut Mensagem, h: isize, min: u32, max: u32) -> i32;
    fn TranslateMessage(m: *const Mensagem) -> i32;
    fn DispatchMessageW(m: *const Mensagem) -> isize;
    fn PostMessageW(h: isize, m: u32, w: usize, l: isize) -> i32;
    fn DestroyWindow(h: isize) -> i32;
    fn PostQuitMessage(c: i32);
    fn ShowWindow(h: isize, c: i32) -> i32;
    fn UpdateWindow(h: isize) -> i32;
    fn BeginPaint(h: isize, p: *mut Pintura) -> isize;
    fn EndPaint(h: isize, p: *const Pintura) -> i32;
    fn FillRect(hdc: isize, r: *const Retangulo, pincel: isize) -> i32;
    fn DrawTextW(hdc: isize, t: *const u16, n: i32, r: *mut Retangulo, f: u32) -> i32;
    fn SetTimer(h: isize, id: usize, ms: u32, f: *const c_void) -> usize;
    fn KillTimer(h: isize, id: usize) -> i32;
    fn InvalidateRect(h: isize, r: *const Retangulo, apagar: i32) -> i32;
    fn LoadImageW(inst: isize, nome: *const u16, tipo: u32, l: i32, a: i32, f: u32) -> isize;
    fn DrawIconEx(hdc: isize, x: i32, y: i32, icone: isize, l: i32, a: i32, passo: u32, pincel: isize, f: u32) -> i32;
    fn DestroyIcon(i: isize) -> i32;
    fn FindWindowW(classe: *const u16, titulo: *const u16) -> isize;
    fn GetDpiForSystem() -> u32;
    fn MonitorFromPoint(p: Ponto, f: u32) -> isize;
    fn GetMonitorInfoW(m: isize, i: *mut InfoMonitor) -> i32;
    fn GetClientRect(h: isize, r: *mut Retangulo) -> i32;
    fn LoadCursorW(inst: isize, nome: *const u16) -> isize;
}
#[link(name = "gdi32")]
extern "system" {
    fn CreateSolidBrush(cor: u32) -> isize;
    fn DeleteObject(o: isize) -> i32;
    fn SelectObject(hdc: isize, o: isize) -> isize;
    fn SetBkMode(hdc: isize, m: i32) -> i32;
    fn SetTextColor(hdc: isize, c: u32) -> u32;
    fn CreateFontW(a: i32, l: i32, esc: i32, ori: i32, peso: i32, it: u32, sub: u32, ris: u32, cs: u32, prec: u32,
        clip: u32, qual: u32, fam: u32, nome: *const u16) -> isize;
    fn CreateCompatibleDC(hdc: isize) -> isize;
    fn CreateCompatibleBitmap(hdc: isize, l: i32, a: i32) -> isize;
    fn BitBlt(d: isize, x: i32, y: i32, l: i32, a: i32, o: isize, ox: i32, oy: i32, op: u32) -> i32;
    fn DeleteDC(hdc: isize) -> i32;
}
#[link(name = "kernel32")]
extern "system" {
    fn GetModuleHandleW(nome: *const u16) -> isize;
}

fn px(v: i32) -> i32 { v * ESCALA.load(Ordering::Relaxed) as i32 / 96 }

/// Mostra a tela de abertura numa thread própria, centrada na tela que tem `ponto` (o centro do lugar onde a lousa vai
/// nascer) ou na principal. Não mostra nada se o Giz Livre já está aberto (o atalho de novo só abre outra janela nele).
pub fn mostrar(ponto: Option<(i32, i32)>) {
    // a janela invisível do plugin de instância única (identifier + "-sic") existe: outro Giz Livre está aberto
    if unsafe { FindWindowW(largo("br.gizlivre.janela-sic").as_ptr(), std::ptr::null()) } != 0 { return; }
    *ESTADO.lock().unwrap() = "Abrindo…".into();
    std::thread::spawn(move || unsafe { laco(ponto) });
}

/// O texto embaixo do nome ("Iniciando…", "Abrindo a galeria…").
pub fn estado(texto: &str) {
    *ESTADO.lock().unwrap() = texto.into();
    let h = JANELA.load(Ordering::SeqCst);
    if h != 0 { unsafe { PostMessageW(h, WM_APP_ESTADO, 0, 0); } }
}

/// Fecha a tela de abertura (a galeria pintou, ou vai aparecer um aviso). Pode ser chamada de qualquer thread, e mais
/// de uma vez.
pub fn fechar() {
    let h = JANELA.swap(0, Ordering::SeqCst);
    if h != 0 { unsafe { PostMessageW(h, WM_CLOSE, 0, 0); } }
}

unsafe fn laco(ponto: Option<(i32, i32)>) {
    let inst = GetModuleHandleW(std::ptr::null());
    ESCALA.store(GetDpiForSystem().max(96), Ordering::Relaxed);
    let nome = largo(CLASSE);
    let c = ClasseJanela { tam: std::mem::size_of::<ClasseJanela>() as u32, estilo: 0x0002_0000 /* CS_DROPSHADOW */,
        proc_: processar, extra_classe: 0, extra_janela: 0, instancia: inst, icone: 0,
        cursor: LoadCursorW(0, 32514 as *const u16 /* IDC_APPSTARTING */), fundo: 0, menu: std::ptr::null(),
        nome: nome.as_ptr(), icone_pequeno: 0 };
    RegisterClassExW(&c);
    let (l, a) = (px(LARGURA), px(ALTURA));
    let (cx, cy) = ponto.unwrap_or((0, 0));
    // com o ponto: a tela mais perto dele (MONITOR_DEFAULTTONEAREST); sem: a principal (MONITOR_DEFAULTTOPRIMARY)
    let m = MonitorFromPoint(Ponto { x: cx, y: cy }, if ponto.is_some() { 2 } else { 1 });
    let mut info = InfoMonitor { tam: std::mem::size_of::<InfoMonitor>() as u32, monitor: Retangulo::default(), trabalho: Retangulo::default(), flags: 0 };
    let t = if GetMonitorInfoW(m, &mut info) != 0 { info.trabalho } else { Retangulo { esq: 0, topo: 0, dir: 1280, baixo: 800 } };
    let x = t.esq + (t.dir - t.esq - l) / 2;
    let y = t.topo + (t.baixo - t.topo - a) / 2;
    // WS_POPUP; WS_EX_TOPMOST (fica por cima da lousa enquanto ela carrega) e WS_EX_TOOLWINDOW (sem botão na barra)
    let h = CreateWindowExW(0x0000_0008 | 0x0000_0080, nome.as_ptr(), largo("Giz Livre").as_ptr(), 0x8000_0000,
        x, y, l, a, 0, 0, inst, std::ptr::null());
    if h == 0 { return; }
    JANELA.store(h, Ordering::SeqCst);
    ShowWindow(h, 5 /* SW_SHOW */);
    UpdateWindow(h);
    SetTimer(h, 1, 30, std::ptr::null());       // a barra anda
    SetTimer(h, 2, 30_000, std::ptr::null());   // segurança: nunca fica mais de 30 s
    let mut msg: Mensagem = std::mem::zeroed();
    while GetMessageW(&mut msg, 0, 0, 0) > 0 {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }
}

unsafe extern "system" fn processar(h: isize, m: u32, w: usize, l: isize) -> isize {
    match m {
        WM_ERASEBKGND => 1,
        WM_PAINT => { pintar(h); 0 }
        WM_TIMER => {
            if w == 2 { fechar(); return 0; }
            PASSO.fetch_add(1, Ordering::Relaxed);
            InvalidateRect(h, std::ptr::null(), 0);
            0
        }
        WM_APP_ESTADO => { InvalidateRect(h, std::ptr::null(), 0); 0 }
        WM_CLOSE => { KillTimer(h, 1); KillTimer(h, 2); DestroyWindow(h); 0 }
        WM_DESTROY => { PostQuitMessage(0); 0 }
        _ => DefWindowProcW(h, m, w, l),
    }
}

unsafe fn retangulo(hdc: isize, r: Retangulo, cor: u32) {
    let p = CreateSolidBrush(cor);
    FillRect(hdc, &r, p);
    DeleteObject(p);
}

unsafe fn texto(hdc: isize, t: &str, r: Retangulo, tam: i32, peso: i32, cor: u32) {
    let f = CreateFontW(-px(tam), 0, 0, 0, peso, 0, 0, 0, 1, 0, 0, 5 /* CLEARTYPE */, 0, largo("Segoe UI").as_ptr());
    let antiga = SelectObject(hdc, f);
    SetTextColor(hdc, cor);
    let mut r = r;
    let w = largo(t);
    DrawTextW(hdc, w.as_ptr(), (w.len() - 1) as i32, &mut r, 0x0000_0020 | 0x0000_0004 | 0x0000_8000 /* SINGLELINE VCENTER END_ELLIPSIS */);
    SelectObject(hdc, antiga);
    DeleteObject(f);
}

unsafe fn pintar(h: isize) {
    let mut ps: Pintura = std::mem::zeroed();
    let tela = BeginPaint(h, &mut ps);
    let mut rc = Retangulo::default();
    GetClientRect(h, &mut rc);
    let (l, a) = (rc.dir, rc.baixo);
    // desenha numa imagem e copia de uma vez (sem piscar)
    let dc = CreateCompatibleDC(tela);
    let bmp = CreateCompatibleBitmap(tela, l, a);
    let antiga = SelectObject(dc, bmp);
    retangulo(dc, rc, BORDA);
    retangulo(dc, Retangulo { esq: 1, topo: 1, dir: l - 1, baixo: a - 1 }, BRANCO);
    SetBkMode(dc, 1 /* TRANSPARENT */);
    // o ícone do programa (recurso 32512 que o Tauri põe no exe), o nome e a versão
    let lado = px(64);
    let icone = LoadImageW(GetModuleHandleW(std::ptr::null()), 32512 as *const u16, 1 /* IMAGE_ICON */, lado, lado, 0);
    let (mx, my) = (px(32), px(48));
    if icone != 0 { DrawIconEx(dc, mx, my, icone, lado, lado, 0, 0, 3 /* DI_NORMAL */); DestroyIcon(icone); }
    let tx = mx + lado + px(20);
    texto(dc, "Giz Livre", Retangulo { esq: tx, topo: my - px(4), dir: l - px(24), baixo: my + px(38) }, 28, 600, TEXTO);
    texto(dc, &format!("versão {}", env!("CARGO_PKG_VERSION")), Retangulo { esq: tx, topo: my + px(38), dir: l - px(24), baixo: my + px(62) },
        13, 400, CINZA);
    let estado = ESTADO.lock().map(|e| e.clone()).unwrap_or_default();
    let base = a - px(44);
    texto(dc, &estado, Retangulo { esq: mx, topo: base - px(26), dir: l - mx, baixo: base - px(4) }, 12, 400, CINZA);
    // barra de progresso sem fim conhecido: um trecho na cor de destaque passa pelo trilho
    let (bx, bl, ba) = (mx, l - 2 * mx, px(4));
    retangulo(dc, Retangulo { esq: bx, topo: base, dir: bx + bl, baixo: base + ba }, TRILHO);
    let trecho = bl / 3;
    let pos = (PASSO.load(Ordering::Relaxed) as i32 * px(6)) % (bl + trecho) - trecho;
    let (e, d) = ((bx + pos).max(bx), (bx + pos + trecho).min(bx + bl));
    if d > e { retangulo(dc, Retangulo { esq: e, topo: base, dir: d, baixo: base + ba }, DESTAQUE); }
    BitBlt(tela, 0, 0, l, a, dc, 0, 0, 0x00CC_0020 /* SRCCOPY */);
    SelectObject(dc, antiga);
    DeleteObject(bmp);
    DeleteDC(dc);
    EndPaint(h, &ps);
}
