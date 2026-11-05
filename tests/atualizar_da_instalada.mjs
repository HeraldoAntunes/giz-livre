// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Atualização de uma versão da janela própria já instalada (1.16 em diante) para a nova, como o Sobre faz: instala a
// antiga pelo próprio instalador dela, abre com um quadro, uma imagem e um marcador, roda o instalador novo com os
// MESMOS argumentos que o Sobre passa (server.py: /SILENT /CURRENTUSER /NORESTART /SUPPRESSMSGBOXES
// /FORCECLOSEAPPLICATIONS /reabrir=1 /LOG=...) e confere que ele fecha a aberta, instala, reabre a nova e mantém tudo.
// Tudo numa pasta e numa chave de registro de teste (GIZ_TESTE_INSTALACAO) e com quadros de teste (GIZ_TESTE_DADOS):
// o Giz Livre de verdade desta conta não é tocado. O clique no Sobre com o GitHub real só se testa depois de publicar.
//   node tests/atualizar_da_instalada.mjs <Instalar-GizLivre-<antiga>.zip> <Instalar-GizLivre-<nova>.zip>
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, basename } from 'node:path';
import { pastaTemporaria } from './temporario.mjs';

const [ZIP_ANTIGA, ZIP_NOVA] = process.argv.slice(2);
if (!ZIP_ANTIGA || !ZIP_NOVA) { console.log('uso: node tests/atualizar_da_instalada.mjs <zip antigo> <zip novo>'); process.exit(2); }
const versaoDe = z => basename(z).match(/Instalar-GizLivre-([\d.]+)\.zip$/)[1];
const V_ANTIGA = versaoDe(ZIP_ANTIGA), V_NOVA = versaoDe(ZIP_NOVA);
const tmp = pastaTemporaria('giz-atualizar-');
// nenhuma caixa na tela do professor: as mensagens do programa vão para este arquivo (GIZ_SEM_CAIXAS)
const CAIXAS = join(tmp, 'caixas.txt'); process.env.GIZ_SEM_CAIXAS = CAIXAS;
const PROG = join(tmp, 'Programs', 'Giz Livre'), DADOS = join(tmp, 'quadros'), LOG = join(tmp, 'atualizacao.log');
const CHAVE = 'HKCU\\Software\\GizLivreTeste\\Instalacao';
const PORTA = 8700 + Math.floor(Math.random() * 50), DEPURA = 9700 + Math.floor(Math.random() * 90);
const ENV = { ...process.env, GIZ_TESTE_INSTALACAO: tmp, GIZ_TESTE_DADOS: DADOS, GIZ_JANELA_DADOS: join(tmp, 'perfil-janela'),
  WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${DEPURA}` };
const espera = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };
const vivo = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
async function ate(f, ms) { const fim = Date.now() + ms; while (Date.now() < fim) { const v = await f(); if (v) return v; await espera(300); } return null; }
const ps = cmd => execFileSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8' }).trim();
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const reg = (...a) => spawnSync('reg', a, { encoding: 'utf8' });
const versaoNoRegistro = () => reg('query', CHAVE, '/v', 'DisplayVersion').stdout?.match(/REG_SZ\s+(\S+)/)?.[1];
const procsNaPasta = () => ps(`Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -like '${PROG.replace(/'/g, "''")}\\*' } | ForEach-Object { "$($_.ProcessId) $($_.Name)" }`).split(/\r?\n/).filter(Boolean);
const extrair = (zip, pasta) => {
  execFileSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${pasta}'`]);
  const achar = d => { for (const n of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, n.name); if (n.isFile() && n.name === 'GizLivre.exe') return p; if (n.isDirectory()) { const r = achar(p); if (r) return r; } } };
  return achar(pasta);
};
const conexao = () => { try { return JSON.parse(readFileSync(join(DADOS, '.agente', 'conexao.json'), 'utf8')); } catch { return null; } };

let antiga;
try {
  console.log(`Atualização ${V_ANTIGA} instalada → ${V_NOVA} (argumentos do Sobre), em ${tmp}`);
  // 1) a antiga instalada pelo próprio instalador dela
  const instAntiga = extrair(ZIP_ANTIGA, join(tmp, 'zip-antiga')), instNova = extrair(ZIP_NOVA, join(tmp, 'zip-nova'));
  const s1 = spawnSync(instAntiga, ['--instalar', `/LOG=${join(tmp, 'instalar-antiga.log')}`], { env: ENV, timeout: 120000 }).status;
  conferir(`${V_ANTIGA} instalada na pasta de teste`, s1 === 0 && existsSync(join(PROG, 'GizLivre.exe')) && versaoNoRegistro() === V_ANTIGA, String(s1));

  // 2) a antiga aberta, com um quadro, uma imagem e um marcador
  mkdirSync(DADOS, { recursive: true });
  antiga = spawn(join(PROG, 'GizLivre.exe'), ['--dados', DADOS, '--porta', String(PORTA)], { stdio: 'ignore', detached: true, env: ENV });
  const con1 = await ate(conexao, 40000);
  conferir(`a ${V_ANTIGA} abriu`, con1?.versao === V_ANTIGA && con1?.porta === PORTA, JSON.stringify(con1));
  const h = { 'X-Lousa': con1.token };
  const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('imagem da aula')]);
  const img = (await (await fetch(`http://127.0.0.1:${PORTA}/api/assets`, { method: 'POST', headers: { ...h, 'Content-Type': 'image/png' }, body: png })).json()).url;
  const quadro = { title: 'Aula antes da atualização', items: [
    { id: 't1', type: 'text', text: 'Equilíbrio químico', x: 40, y: 40, w: 400, size: 32, color: '#000' },
    { id: 's1', type: 'stroke', pts: [10, 10, 0.5, 60, 80, 0.5, 120, 90, 0.5], width: 3, color: '#c00' },
    { id: 'i1', type: 'image', src: img, x: 0, y: 200, w: 100, h: 100 }] };
  const r = await fetch(`http://127.0.0.1:${PORTA}/api/boards/aula`, { method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: quadro, revision: 0, criar: true }) });
  const rm = await fetch(`http://127.0.0.1:${PORTA}/api/marcadores`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({ novos: [{ quadro: 'aula', marcador: { id: 'mk1', nome: 'Exemplo 1', cx: 300, cy: 200, w: 800, criado: 1793880000000, ordem: 1 } }] }) });
  conferir(`quadro com imagem e marcador gravados na ${V_ANTIGA}`, r.ok && rm.ok);
  const antes = { quadro: hash(join(DADOS, 'aula.json')), imagem: hash(join(DADOS, img.replace(/^\//, ''))) };

  // 3) o instalador novo com os argumentos do Sobre
  const t0 = Date.now();
  const inst = spawnSync(instNova, ['/SILENT', '/CURRENTUSER', '/NORESTART', '/SUPPRESSMSGBOXES', '/FORCECLOSEAPPLICATIONS',
    '/reabrir=1', `/LOG=${LOG}`], { env: ENV, timeout: 180000, stdio: 'ignore' });   // o programa reaberto não herda a saída
  console.log(`    instalador terminou em ${((Date.now() - t0) / 1000).toFixed(1)} s; registro:\n      ` +
    (existsSync(LOG) ? readFileSync(LOG, 'utf8').trim().split(/\r?\n/).join('\n      ') : '(sem registro)'));
  conferir('o instalador terminou sem erro (saída 0)', inst.status === 0, String(inst.status));
  conferir(`a ${V_ANTIGA} aberta foi fechada`, await ate(() => !vivo(antiga.pid), 15000));
  conferir('a versão nova está na pasta (janela, Python embutido, servidor)', existsSync(join(PROG, 'python', 'pythonw.exe'))
    && existsSync(join(PROG, 'servidor', 'server.py')) && hash(join(PROG, 'GizLivre.exe')) === hash(instNova));
  conferir(`Aplicativos instalados mostra a ${V_NOVA}`, versaoNoRegistro() === V_NOVA, versaoNoRegistro());

  // 4) reabriu sozinha, na versão nova, com o mesmo quadro e o marcador
  const con = await ate(() => { const c = conexao(); return c?.versao === V_NOVA ? c : null; }, 40000);
  conferir(`reabriu sozinha na versão nova (${V_NOVA})`, !!con, JSON.stringify(conexao()));
  conferir('a janela nova é o GizLivre.exe instalado', procsNaPasta().some(l => / GizLivre\.exe$/.test(l)), procsNaPasta().join('; '));
  const pag = await ate(async () => { try { return (await (await fetch(`http://127.0.0.1:${DEPURA}/json/list`)).json()).find(x => x.type === 'page' && x.url.startsWith('http://127.0.0.1:') && !x.url.includes('?k=')); } catch { return null; } }, 40000);
  conferir('a lousa aparece na janela nova', !!pag);
  conferir('o arquivo do quadro e a imagem continuam idênticos', hash(join(DADOS, 'aula.json')) === antes.quadro
    && hash(join(DADOS, img.replace(/^\//, ''))) === antes.imagem);
  const b = await (await fetch(`http://127.0.0.1:${con.porta}/api/boards/aula`, { headers: { 'X-Lousa': con.token } })).json();
  conferir('a versão nova lê o quadro inteiro (texto, traço e imagem)', b.items?.length === 3);
  const ms = await (await fetch(`http://127.0.0.1:${con.porta}/api/marcadores`, { headers: { 'X-Lousa': con.token } })).json();
  conferir('o marcador continua', ms.marcadores?.some(m => m.quadro === 'aula' && m.id === 'mk1'));

  // --completo (notebook com Windows 10, 05/11/2026): o marcador vai para um grupo; fecha, abre de novo e confere;
  // desinstala e confere que os quadros ficaram
  if (process.argv.includes('--completo')) {
    const h2 = { 'X-Lousa': con.token, 'Content-Type': 'application/json' }, base2 = `http://127.0.0.1:${con.porta}`;
    const rg = await fetch(`${base2}/api/marcadores`, { method: 'POST', headers: h2, body: JSON.stringify({
      grupos: [{ id: 'gW10', nome: 'Aula de teste', cor: '#0f6cbd', ordem: 1 }],
      alterar: [{ quadro: 'aula', id: 'mk1', grupo: 'gW10', grupoNome: 'Aula de teste', cor: '#0f6cbd', ordem: 1 }] }) });
    conferir('o marcador foi para o grupo "Aula de teste"', rg.ok && (await rg.json()).marcadores?.some(m => m.id === 'mk1' && m.grupo === 'gW10'));
    // fechar pelo X, como o professor: WM_CLOSE na janela do Tauri (o /api/sair só desliga o servidor)
    const fecharJanela = () => { for (const l of procsNaPasta().filter(x => / GizLivre\.exe$/.test(x))) { const pid = l.split(' ')[0];
      ps(`Add-Type -Namespace W -Name U -MemberDefinition '[DllImport("user32.dll")] public static extern bool PostMessage(System.IntPtr h, uint m, System.IntPtr w, System.IntPtr l); public delegate bool Cb(System.IntPtr h, System.IntPtr p); [DllImport("user32.dll")] public static extern bool EnumWindows(Cb f, System.IntPtr p); [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(System.IntPtr h, out uint p); [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(System.IntPtr h, System.Text.StringBuilder s, int n);'; $cb = [W.U+Cb]{ param($h, $p) $x = 0; [void][W.U]::GetWindowThreadProcessId($h, [ref]$x); $c = New-Object System.Text.StringBuilder 64; [void][W.U]::GetClassName($h, $c, 64); if ($x -eq ${pid} -and $c.ToString() -eq 'Tauri Window') { [void][W.U]::PostMessage($h, 0x10, 0, 0) }; $true }; [W.U]::EnumWindows($cb, 0) | Out-Null`); } };
    fecharJanela();
    conferir('fechou pelo X (nenhum processo da pasta do programa)', await ate(() => !procsNaPasta().length, 20000), procsNaPasta().join('; '));
    const PORTA2 = PORTA + 1;
    spawn(join(PROG, 'GizLivre.exe'), ['--dados', DADOS, '--porta', String(PORTA2)], { stdio: 'ignore', detached: true, env: ENV }).unref();
    const con2 = await ate(() => { const c = conexao(); return c?.porta === PORTA2 && c?.versao === V_NOVA ? c : null; }, 40000);
    conferir('abriu de novo', !!con2, JSON.stringify(conexao()));
    if (con2) {
      const b2 = await (await fetch(`http://127.0.0.1:${PORTA2}/api/boards/aula`, { headers: { 'X-Lousa': con2.token } })).json();
      conferir('depois de reabrir, o quadro continua inteiro (o traço também)', b2.items?.some(i => i.id === 's1' && i.type === 'stroke') && b2.items.length === 3);
      const ms2 = await (await fetch(`http://127.0.0.1:${PORTA2}/api/marcadores`, { headers: { 'X-Lousa': con2.token } })).json();
      conferir('depois de reabrir, o marcador continua no grupo', ms2.marcadores?.some(m => m.id === 'mk1' && m.grupo === 'gW10'));
      fecharJanela();
      await ate(() => !procsNaPasta().length, 20000);
    }
    const des = spawnSync(join(PROG, 'GizLivre.exe'), ['--desinstalar', '--silencioso'], { env: ENV, timeout: 60000 }).status;
    await espera(1500);
    conferir('desinstalou (saída 0, sem a chave e sem o programa)', des === 0 && !versaoNoRegistro() && !existsSync(join(PROG, 'GizLivre.exe')), `${des} ${versaoNoRegistro()}`);
    conferir('os quadros ficaram (o arquivo do quadro e a imagem)', existsSync(join(DADOS, 'aula.json')) && existsSync(join(DADOS, img.replace(/^\//, ''))));
  }
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally {
  // fecha o que abriu da pasta de teste e desinstala (tira a chave de teste)
  for (const l of procsNaPasta()) { try { process.kill(Number(l.split(' ')[0])); } catch {} }
  if (antiga && vivo(antiga.pid)) try { process.kill(antiga.pid); } catch {}
  await espera(1500);
  if (existsSync(join(PROG, 'GizLivre.exe'))) spawnSync(join(PROG, 'GizLivre.exe'), ['--desinstalar', '--silencioso'], { env: ENV, timeout: 60000 });
  reg('delete', 'HKCU\\Software\\GizLivreTeste', '/f');
}
{ const c = existsSync(CAIXAS) ? readFileSync(CAIXAS, 'utf8').trim() : ''; conferir('nenhuma mensagem de erro do programa (caixa)', !c, c.slice(0, 300)); }
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
