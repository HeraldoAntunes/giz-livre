// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// T2 (ordem da gestão, 19/11/2026): a versão PUBLICADA, instalada de verdade numa conta de testes, com a janela de
// verdade. Instala com o instalador do zip; abre o instalado; cria um quadro sintético de 20 slides; põe Números com
// dois estilos; apresenta os 20 slides; passa pelo seletor de páginas do início ao fim; fecha pelo X (WM_CLOSE),
// reabre e confere o quadro; desinstala e confere que só os quadros ficaram. Capturas da tela inteira, sem dado pessoal.
// ABRE JANELA E INSTALA NA CONTA: só no notebook de testes, com o SIM do professor e reserva.
//   node notebook_t2_versao_publicada.mjs <pasta do zip de instalação extraído (com GizLivre.exe)> <pasta da rodada>
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [INST, RODADA] = process.argv.slice(2);
const SAIDA = join(RODADA, 'saida'); mkdirSync(SAIDA, { recursive: true });
const LOCAL = process.env.LOCALAPPDATA, PROG = join(LOCAL, 'Programs', 'Giz Livre'), EXE = join(PROG, 'GizLivre.exe');
const DOCS = join(process.env.USERPROFILE, 'Documents', 'Giz Livre');
const CHAVE = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{6F1B6C2E-4D7A-4E2B-9B8D-3A5C1E7F0A21}_is1';
const DEPURA = 9541;
const espera = ms => new Promise(r => setTimeout(r, ms));
const R = { inicio: new Date().toISOString(), conferencias: [] };
const conferir = (n, c, d = '') => { R.conferencias.push({ n, ok: !!c, d: c ? '' : String(d).slice(0, 300) }); console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); };
async function ate(f, ms) { const fim = Date.now() + ms; while (Date.now() < fim) { try { const v = await f(); if (v) return v; } catch {} await espera(250); } return null; }
const ps = cmd => execFileSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8', timeout: 60000 }).trim();
function foto(nome) {
  const arq = join(SAIDA, nome + '.png').replace(/'/g, "''");
  try { ps(`Add-Type -AssemblyName System.Windows.Forms,System.Drawing; $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $i = New-Object System.Drawing.Bitmap $b.Width, $b.Height; $g = [System.Drawing.Graphics]::FromImage($i); $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size); $i.Save('${arq}')`); } catch (e) { R['foto_' + nome] = e.message; }
}
const chaveExiste = () => { try { execFileSync('reg', ['query', CHAVE], { stdio: 'ignore' }); return true; } catch { return false; } };
function conectar(url) {
  const ws = new WebSocket(url); let n = 0; const pend = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++n; pend.set(id, m => m.error ? rej(new Error(m.error.message)) : res(m.result)); ws.send(JSON.stringify({ id, method, params })); setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error('sem resposta: ' + method))), 60000); });
  return new Promise((res, rej) => { ws.onopen = () => res({ ws, cdp, avaliar: async e => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; } }); ws.onerror = rej; });
}
function abrir() {
  return spawn(EXE, [], { stdio: 'ignore', detached: true, env: { ...process.env, GIZ_SEM_CAIXAS: join(SAIDA, 'caixas.txt'), WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${DEPURA}` } });
}
async function pagina() {
  const a = await ate(async () => (await (await fetch(`http://127.0.0.1:${DEPURA}/json/list`)).json()).find(t => t.type === 'page' && t.url.startsWith('http://127.0.0.1:') && !t.url.includes('?k=') && !t.url.includes('espera')), 60000);
  if (!a) throw new Error('a janela não abriu a lousa');
  const c = await conectar(a.webSocketDebuggerUrl);
  await ate(() => c.avaliar(`document.readyState === 'complete' && !!document.getElementById('gGrid')`), 30000);
  return c;
}
const tecla = (c, key, code, vk, modifiers = 0) => c.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, modifiers }).then(() => c.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, modifiers }));
const tocar = async (c, x, y) => { await c.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await c.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }); await espera(300); };
function fecharPeloX(pid) {
  // WM_CLOSE na janela do programa (o X): a página grava e o programa sai sozinho
  ps(`Add-Type -Namespace W -Name U -MemberDefinition '[DllImport("user32.dll")] public static extern bool PostMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l);'; $p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue; if ($p) { [W.U]::PostMessage($p.MainWindowHandle, 0x10, [System.IntPtr]::Zero, [System.IntPtr]::Zero) | Out-Null }`);
}
const vivo = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
const naTela = (c, x, y) => c.avaliar(`(() => { const v = window.__lousa.S.view; return [${x} * v.zoom + v.x, ${y} * v.zoom + v.y]; })()`);
const contar = c => c.avaliar(`({ carimbos: window.__lousa.S.items.filter(i => i.carimbo).map(i => i.carimbo.forma + (i.carimbo.preenchido ? '+' : '-')).join(','), paginas: window.__lousa.S.board.layout.count, imagens: window.__lousa.S.items.filter(i => i.type === 'image' && !i.carimbo).length })`);

let prog = null;
try {
  // 1) instalar para a conta (o instalador sozinho, como o Sobre faz)
  conferir('antes: nada instalado nesta conta', !existsSync(PROG) && !chaveExiste());
  const st = execFileSync(join(INST, 'GizLivre.exe'), ['--instalar'], { timeout: 180000, env: { ...process.env, GIZ_SEM_CAIXAS: join(SAIDA, 'caixas.txt') } });
  conferir('instalou para a conta (programa, Python embutido e registro)', existsSync(EXE) && existsSync(join(PROG, 'python')) && chaveExiste());
  R.versaoRegistro = (() => { try { return execFileSync('reg', ['query', CHAVE, '/v', 'DisplayVersion'], { encoding: 'utf8' }).match(/REG_SZ\s+(\S+)/)?.[1]; } catch { return null; } })();
  conferir('Aplicativos instalados diz 1.19.0', R.versaoRegistro === '1.19.0', R.versaoRegistro);

  // 2) abrir o instalado e criar o quadro sintético de 20 slides (imagens geradas na página)
  prog = abrir();
  let c = await pagina();
  await c.avaliar(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Começar')?.click(); try { localStorage.setItem('lousa.ajuda', '{"tourVisto":true}'); } catch {}`);
  const token = JSON.parse(readFileSync(join(LOCAL, 'Giz Livre', 'conexao.json'), 'utf8')).token;
  const criado = await c.avaliar(`(async () => {
    const srcs = [];
    for (let i = 0; i < 20; i++) {
      const cv = document.createElement('canvas'); cv.width = 1280; cv.height = 720; const g = cv.getContext('2d');
      g.fillStyle = 'hsl(' + (i * 18) + ',55%,82%)'; g.fillRect(0, 0, 1280, 720);
      g.fillStyle = '#123'; g.font = 'bold 72px Segoe UI'; g.fillText('Slide sintético ' + (i + 1), 80, 160);
      const b = await new Promise(r => cv.toBlob(r, 'image/png'));
      srcs.push((await (await fetch('/api/assets', { method: 'POST', headers: { 'X-Lousa': ${JSON.stringify(token)}, 'Content-Type': 'image/png' }, body: b })).json()).url);
    }
    const L = { mode: 'pages', kind: 's169', w: 1280, h: 720, gap: 48, count: 20 };
    const board = { version: 2, title: 'T2 quadro sintético', background: { color: '#ffffff', pattern: 'none' }, view: null, layout: L,
      items: srcs.map((src, k) => ({ id: 's' + k, type: 'image', locked: true, x: 0, y: k * 768, w: 1280, h: 720, src })) };
    const r = await fetch('/api/boards/t2', { method: 'PUT', headers: { 'X-Lousa': ${JSON.stringify(token)}, 'Content-Type': 'application/json' }, body: JSON.stringify({ board, revision: 0, criar: true }) });
    return r.ok; })()`);
  conferir('quadro sintético de 20 slides criado', criado);
  await c.avaliar(`location.hash = '#/b/t2'`);
  conferir('o quadro abriu na janela', await ate(() => c.avaliar(`window.__lousa?.S?.id === 't2'`), 30000));
  await espera(1500);

  // 3) Números com dois estilos
  await tecla(c, 'u', 'KeyU', 85); await espera(300);
  for (const [x, y] of [[200, 200], [400, 200], [600, 200]]) { const [sx, sy] = await naTela(c, x, y); await tocar(c, sx, sy); }
  // numa instalação nova a barra fixa do professor está fechada: abre pelo menu Ferramentas → À direita, como o professor faria
  if (!(await c.avaliar(`!!document.querySelector('#teachbar:not([hidden]) [data-k="numero"]')`))) {
    await c.avaliar(`document.getElementById('tTools').click()`); await espera(400);
    await c.avaliar(`document.querySelector('#pop [data-lado="dir"]').click()`); await espera(600);
  }
  // tocar em Números até o estilo aparecer (se a ferramenta ficou desligada ao abrir a barra, o 1º toque a liga)
  for (let k = 0; k < 2 && !(await c.avaliar(`!!document.querySelector('#pop:not([hidden]) [data-forma]')`)); k++) {
    await c.avaliar(`document.querySelector('#teachbar [data-k="numero"]').click()`); await espera(500);
  }
  await c.avaliar(`document.querySelector('#pop [data-forma="quadrado"]').click()`); await espera(300);
  await c.avaliar(`document.querySelector('#pop [data-cheio="0"]').click()`); await espera(300);
  await tecla(c, 'Escape', 'Escape', 27); await espera(300);
  for (const [x, y] of [[300, 450], [500, 450]]) { const [sx, sy] = await naTela(c, x, y); await tocar(c, sx, sy); }
  let q = await contar(c);
  conferir('Números com dois estilos: 3 círculos cheios e 2 quadrados só contorno', q.carimbos === 'circulo+,circulo+,circulo+,quadrado-,quadrado-', q.carimbos);
  await espera(800); foto('1-numeros');

  // 4) apresentar os 20 slides
  await c.avaliar(`document.getElementById('bPresent').click()`); await espera(1200);
  await tecla(c, 'Home', 'Home', 36); await espera(400);
  const t0 = Date.now();
  for (let k = 1; k < 20; k++) { await tecla(c, 'PageDown', 'PageDown', 34); await espera(250); }
  R.apresentacaoS = (Date.now() - t0) / 1000;
  const fim = await c.avaliar(`document.getElementById('ppLabel').textContent`);
  conferir('apresentou os 20 slides até o último', fim.startsWith('20 /'), fim);
  foto('2-apresentacao');
  await tecla(c, 'Escape', 'Escape', 27); await espera(800);
  if (await c.avaliar(`document.getElementById('board').classList.contains('present')`)) { await tecla(c, 'Escape', 'Escape', 27); await espera(800); }

  // 5) o seletor de páginas do início ao fim
  await c.avaliar(`document.getElementById('pgAll').click()`); await espera(800);
  await c.avaliar(`document.getElementById('ppList').scrollTop = 1e9`); await espera(1500);
  await c.avaliar(`document.getElementById('ppList').scrollTop = 0`);
  const t1 = Date.now();
  const desenhadas = () => c.avaliar(`[...document.querySelectorAll('#ppList .pthumb')].slice(0, 6).map(b => b.firstChild).filter(cv => { try { const d = cv.getContext('2d').getImageData(cv.width / 2 | 0, cv.height / 2 | 0, 1, 1).data; return !(d[0] > 235 && d[1] > 235 && d[2] > 235); } catch { return false; } }).length`);
  const ok6 = await ate(async () => (await desenhadas()) >= 6, 20000);
  R.seletorMs = ok6 ? Date.now() - t1 : null;
  conferir(`seletor: as miniaturas do início aparecem ao voltar ao topo (${R.seletorMs} ms)`, !!ok6);
  foto('3-seletor');
  await c.avaliar(`document.getElementById('ppClose').click()`); await espera(500);

  // 6) fechar pelo X, reabrir e conferir
  const pid = prog.pid;
  c.ws.close();
  fecharPeloX(pid);
  conferir('fechou pelo X (o programa saiu)', await ate(() => !vivo(pid), 30000));
  const disco = JSON.parse(readFileSync(join(DOCS, 'quadros', 't2.json'), 'utf8'));
  conferir('o quadro gravado tem os 5 números e os 20 slides', disco.items.filter(i => i.carimbo).length === 5 && disco.layout.count === 20);
  prog = abrir();
  c = await pagina();
  await c.avaliar(`location.hash = '#/b/t2'`);
  await ate(() => c.avaliar(`window.__lousa?.S?.id === 't2'`), 30000); await espera(1500);
  q = await contar(c);
  conferir('reaberto: o mesmo quadro (5 números, 20 slides)', q.carimbos.split(',').length === 5 && q.paginas === 20 && q.imagens === 20, JSON.stringify(q));
  foto('4-reaberto');
  c.ws.close();
  fecharPeloX(prog.pid);
  await ate(() => !vivo(prog.pid), 30000);
  prog = null;

  // 7) desinstalar
  const d = execFileSync(EXE, ['--desinstalar', '--silencioso'], { timeout: 120000, env: { ...process.env, GIZ_SEM_CAIXAS: join(SAIDA, 'caixas.txt') } });
  await espera(3000);
  conferir('desinstalou: programa e registro saíram', !existsSync(PROG) && !chaveExiste());
  const atalhos = ps(`$m = [Environment]::GetFolderPath('Programs'); $a = [Environment]::GetFolderPath('Desktop'); @(Get-ChildItem $m, $a -Filter '*Giz Livre*' -ErrorAction SilentlyContinue).Count`);
  conferir('os atalhos saíram', atalhos === '0', atalhos);
  conferir('os quadros ficaram (Documentos\\Giz Livre\\quadros)', existsSync(join(DOCS, 'quadros', 't2.json')));
  conferir('nenhuma caixa de mensagem do programa', !existsSync(join(SAIDA, 'caixas.txt')) || !readFileSync(join(SAIDA, 'caixas.txt'), 'utf8').trim());
} catch (e) {
  conferir('o teste rodou até o fim', false, e.stack);
} finally {
  if (prog?.pid) { try { execFileSync('taskkill', ['/PID', String(prog.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {} }
  R.fim = new Date().toISOString();
  writeFileSync(join(SAIDA, 'resultado.json'), JSON.stringify(R, null, 1));
  writeFileSync(join(SAIDA, 'pronto.txt'), 'ok');
}
