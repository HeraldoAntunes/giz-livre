// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Atualização da 1.15.2 publicada (PyInstaller + Inno) para a janela própria (P60), como o Sobre da 1.15.2 faz: com
// ela aberta, roda o instalador novo com os MESMOS argumentos que o Sobre passa (server.py da 1.15.2, linha 2448:
// /SILENT /CURRENTUSER /NORESTART /SUPPRESSMSGBOXES /FORCECLOSEAPPLICATIONS /reabrir=1 /LOG=...) e confere que ele
// fecha a versão aberta, instala, reabre a versão nova e mantém os quadros e as imagens.
// Tudo numa pasta e numa chave de registro de teste (GIZ_TESTE_INSTALACAO) e com quadros de teste (GIZ_TESTE_DADOS):
// o Giz Livre de verdade desta conta não é tocado. O clique no Sobre com o download do GitHub só se testa depois de
// publicar (A2 da bateria); isto é a parte que dá para provar antes.
//   node tests/atualizar_da_1_15.mjs <GizLivre-1.15.2-portatil.zip> [Instalar-GizLivre-<nova>.exe]
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ZIP_ANTIGA = process.argv[2] || join(RAIZ, 'build', 'cache', 'v1.15.2', 'GizLivre-1.15.2-portatil.zip');
const DIST = join(RAIZ, 'dist', 'janela');
const NOVA = process.argv[3] || join(DIST, readdirSync(DIST).find(n => /^Instalar-GizLivre-[\d.]+\.exe$/.test(n)));
// o GizLivre.exe de uma pasta de instalação extraída não traz a versão no nome: vem de GIZ_VERSAO_NOVA
const VERSAO_NOVA = process.env.GIZ_VERSAO_NOVA || NOVA.match(/Instalar-GizLivre-([\d.]+)\.exe$/)[1];
const tmp = mkdtempSync(join(tmpdir(), 'giz-a2-'));
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

let antiga, nova;
try {
  console.log(`Atualização 1.15.2 → ${VERSAO_NOVA} (argumentos do Sobre da 1.15.2), em ${tmp}`);
  // 1) "instalação" da 1.15.2: o portátil publicado sem o portatil.txt, o desinstalador do Inno e a chave dele
  mkdirSync(PROG, { recursive: true });
  execFileSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${ZIP_ANTIGA}' -DestinationPath '${PROG}'`]);
  rmSync(join(PROG, 'portatil.txt'));
  writeFileSync(join(PROG, 'unins000.exe'), 'x');
  reg('add', CHAVE, '/v', 'DisplayVersion', '/d', '1.15.2', '/f');
  conferir('1.15.2 "instalada" na pasta de teste', existsSync(join(PROG, '_internal')) && versaoNoRegistro() === '1.15.2');

  // 2) a 1.15.2 aberta, com um quadro e uma imagem
  mkdirSync(DADOS);
  antiga = spawn(join(PROG, 'GizLivre.exe'), ['--sem-janela', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore', detached: true });
  const info = await ate(async () => { try { return await (await fetch(`http://127.0.0.1:${PORTA}/api/info`)).json(); } catch { return null; } }, 30000);
  conferir('a 1.15.2 abriu', info?.versao === '1.15.2', JSON.stringify(info));
  const h = { 'X-Lousa': info.token };
  const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('imagem da aula')]);
  const img = (await (await fetch(`http://127.0.0.1:${PORTA}/api/assets`, { method: 'POST', headers: { ...h, 'Content-Type': 'image/png' }, body: png })).json()).url;
  const quadro = { title: 'Aula antes da atualização', items: [
    { id: 't1', type: 'text', text: 'Equilíbrio químico', x: 40, y: 40, w: 400, size: 32, color: '#000' },
    { id: 's1', type: 'stroke', pts: [10, 10, 0.5, 60, 80, 0.5, 120, 90, 0.5], width: 3, color: '#c00' },
    { id: 'i1', type: 'image', src: img, x: 0, y: 200, w: 100, h: 100 }] };
  const r = await fetch(`http://127.0.0.1:${PORTA}/api/boards/aula15`, { method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: quadro, revision: 0 }) });
  conferir('quadro com imagem gravado na 1.15.2', r.ok);
  const antes = { quadro: hash(join(DADOS, 'aula15.json')), imagem: hash(join(DADOS, img.replace(/^\//, ''))) };

  // 3) o instalador novo com os argumentos do Sobre da 1.15.2
  const t0 = Date.now();
  const inst = spawnSync(NOVA, ['/SILENT', '/CURRENTUSER', '/NORESTART', '/SUPPRESSMSGBOXES', '/FORCECLOSEAPPLICATIONS',
    '/reabrir=1', `/LOG=${LOG}`], { env: ENV, timeout: 180000, stdio: 'ignore' });   // o programa reaberto não herda a saída
  console.log(`    instalador terminou em ${((Date.now() - t0) / 1000).toFixed(1)} s; registro:\n      ` +
    (existsSync(LOG) ? readFileSync(LOG, 'utf8').trim().split(/\r?\n/).join('\n      ') : '(sem registro)'));
  conferir('o instalador terminou sem erro (saída 0)', inst.status === 0, String(inst.status));
  conferir('a 1.15.2 aberta foi fechada', !vivo(antiga.pid));
  conferir('o PyInstaller e o desinstalador do Inno saíram', !existsSync(join(PROG, '_internal')) && !existsSync(join(PROG, 'unins000.exe')));
  conferir('a versão nova está na pasta (janela, Python embutido, servidor)', existsSync(join(PROG, 'python', 'pythonw.exe'))
    && existsSync(join(PROG, 'servidor', 'server.py')));
  conferir(`Aplicativos instalados mostra a ${VERSAO_NOVA}`, versaoNoRegistro() === VERSAO_NOVA, versaoNoRegistro());

  // 4) reabriu sozinha, na versão nova, com os mesmos quadros
  const con = await ate(() => { try { return JSON.parse(readFileSync(join(DADOS, '.agente', 'conexao.json'), 'utf8')); } catch { return null; } }, 40000);
  conferir(`reabriu sozinha na versão nova (${VERSAO_NOVA})`, con?.versao === VERSAO_NOVA, JSON.stringify(con));
  nova = procsNaPasta().find(l => / GizLivre\.exe$/.test(l));
  conferir('a janela nova é o GizLivre.exe instalado', !!nova, procsNaPasta().join('; '));
  const pag = await ate(async () => { try { return (await (await fetch(`http://127.0.0.1:${DEPURA}/json/list`)).json()).find(x => x.type === 'page' && x.url.startsWith('http://127.0.0.1:') && !x.url.includes('?k=')); } catch { return null; } }, 40000);
  conferir('a lousa aparece na janela nova', !!pag);
  const lista = await (await fetch(`http://127.0.0.1:${con.porta}/api/boards`, { headers: { 'X-Lousa': con.token } })).json();
  conferir('o quadro da 1.15.2 está na galeria da versão nova', lista.some(b => b.id === 'aula15' && b.title === quadro.title));
  conferir('o arquivo do quadro e a imagem continuam idênticos', hash(join(DADOS, 'aula15.json')) === antes.quadro
    && hash(join(DADOS, img.replace(/^\//, ''))) === antes.imagem);
  const b = await (await fetch(`http://127.0.0.1:${con.porta}/api/boards/aula15`, { headers: { 'X-Lousa': con.token } })).json();
  conferir('a versão nova lê o quadro inteiro (texto, traço e imagem)', b.items?.length === 3);
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
finally {
  // fecha a versão nova e desinstala da pasta de teste (tira a chave de teste)
  const pid = Number(nova?.split(' ')[0]);
  if (pid) { try { process.kill(pid); } catch {} await ate(() => !vivo(pid), 10000); }
  if (antiga && vivo(antiga.pid)) try { process.kill(antiga.pid); } catch {}
  if (existsSync(join(PROG, 'GizLivre.exe'))) spawnSync(join(PROG, 'GizLivre.exe'), ['--desinstalar', '--silencioso'], { env: ENV, timeout: 60000 });
  reg('delete', 'HKCU\\Software\\GizLivreTeste', '/f');
}
{ const c = existsSync(CAIXAS) ? readFileSync(CAIXAS, 'utf8').trim() : ''; conferir('nenhuma mensagem de erro do programa (caixa)', !c, c.slice(0, 300)); }
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
