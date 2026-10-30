// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Instalação própria (P60) de ponta a ponta, com os arquivos montados por scripts/montar_janela.py (dist/janela).
// Tudo numa pasta temporária e numa chave de registro de teste (GIZ_TESTE_INSTALACAO): a instalação de verdade desta
// conta não é tocada. Confere: instala por cima de uma instalação antiga do Inno + PyInstaller, o programa instalado
// abre, atualizar com ele aberto fecha e troca tudo, desinstalar tira tudo menos o que o usuário pôs lá, e o portátil
// abre com os quadros e os dados da janela ao lado dele.
//   node tests/instalacao_propria.mjs [pasta dist/janela]
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.argv[2] || join(RAIZ, 'dist', 'janela');
// o instalador: o exe com o pacote dentro (dist/janela) ou, com GIZ_INSTALADOR, o GizLivre.exe de uma pasta de
// instalação já extraída (rodada 3: o exe sem nada dentro copia a própria pasta)
const INST = readdirSync(DIST).find(n => /^Instalar-GizLivre-[\d.]+\.(exe|zip)$/.test(n));
const INSTALADOR = process.env.GIZ_INSTALADOR || join(DIST, INST);
const PORT = readdirSync(DIST).find(n => /-portatil\.zip$/.test(n));
const VERSAO = INST.match(/Instalar-GizLivre-([\d.]+)\./)[1];
const tmp = mkdtempSync(join(tmpdir(), 'giz-inst-'));
// nenhuma caixa na tela do professor: as mensagens do programa vão para este arquivo (GIZ_SEM_CAIXAS)
const CAIXAS = join(tmp, 'caixas.txt'); process.env.GIZ_SEM_CAIXAS = CAIXAS;
const PROG = join(tmp, 'Programs', 'Giz Livre'), EXE = join(PROG, 'GizLivre.exe');
const CHAVE = 'HKCU\\Software\\GizLivreTeste\\Instalacao';
// perfil do WebView2 de rascunho: nunca o do professor (o portátil usa o dele, ao lado do programa)
const ENV = { ...process.env, GIZ_TESTE_INSTALACAO: tmp, GIZ_JANELA_DADOS: join(tmp, 'perfil-janela') };
const { GIZ_JANELA_DADOS: _semPerfil, ...ENV_PORTATIL } = ENV;
const espera = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };
const vivo = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
async function ate(f, ms) { const fim = Date.now() + ms; while (Date.now() < fim) { const v = await f(); if (v) return v; await espera(250); } return null; }
const versaoNoRegistro = () => { try { return execFileSync('reg', ['query', CHAVE, '/v', 'DisplayVersion'], { encoding: 'utf8' }).match(/REG_SZ\s+(\S+)/)?.[1]; } catch { return null; } };
const instalar = (...extra) => spawnSync(INSTALADOR, ['--instalar', ...extra], { env: ENV, timeout: 120000 }).status;

async function abrirEConferir(exe, dados, nome) {
  const depura = 9500 + Math.floor(Math.random() * 90);
  const p = spawn(exe, ['--dados', dados, '--porta', String(8900 + Math.floor(Math.random() * 90))], { stdio: 'ignore', detached: true,
    env: { ...ENV, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${depura}` } });
  const pag = await ate(async () => { try { return (await (await fetch(`http://127.0.0.1:${depura}/json/list`)).json()).find(x => x.type === 'page' && x.url.startsWith('http://127.0.0.1:') && !x.url.includes('?k=')); } catch { return null; } }, 40000);
  conferir(`${nome}: abre a lousa`, !!pag);
  return p;
}

try {
  console.log(`Instalação própria: ${INST} (${VERSAO}), em ${tmp}`);
  // 1) uma "instalação do Inno + PyInstaller" antiga na mesma pasta
  mkdirSync(join(PROG, '_internal'), { recursive: true });
  writeFileSync(join(PROG, '_internal', 'python313.dll'), 'x');
  writeFileSync(join(PROG, 'unins000.exe'), 'x');
  writeFileSync(EXE, 'exe antigo');
  mkdirSync(join(tmp, 'Menu'), { recursive: true });
  writeFileSync(join(tmp, 'Menu', 'Desinstalar o Giz Livre.lnk'), 'x');

  // 2) instala em silêncio (como o Sobre das versões 1.x faz)
  conferir('instala em silêncio (saída 0)', instalar(`/LOG=${join(tmp, 'instalar.log')}`) === 0, readFileSync(join(tmp, 'instalar.log'), 'utf8'));
  conferir('o programa, o Python embutido e o servidor estão na pasta', existsSync(join(PROG, 'python', 'pythonw.exe'))
    && existsSync(join(PROG, 'servidor', 'server.py')) && existsSync(join(PROG, 'servidor', 'app', 'index.html'))
    && readFileSync(EXE).length > 1e6);
  conferir('os restos do Inno e do PyInstaller saíram', !existsSync(join(PROG, '_internal')) && !existsSync(join(PROG, 'unins000.exe')));
  conferir('atalhos no menu Iniciar e na Área de Trabalho', existsSync(join(tmp, 'Menu', 'Giz Livre.lnk')) && existsSync(join(tmp, 'Area', 'Giz Livre.lnk')));
  conferir('o atalho de desinstalar do Inno saiu', !existsSync(join(tmp, 'Menu', 'Desinstalar o Giz Livre.lnk')));
  conferir(`registrado em Aplicativos instalados (${VERSAO})`, versaoNoRegistro() === VERSAO);
  conferir('licenças junto', existsSync(join(PROG, 'licencas', 'python-LICENSE.txt')) && existsSync(join(PROG, 'LICENSE')));

  // 3) o programa instalado abre
  const dados = join(tmp, 'quadros'); mkdirSync(dados);
  const p1 = await abrirEConferir(EXE, dados, 'instalado');
  const srv1 = JSON.parse(readFileSync(join(dados, '.agente', 'conexao.json'), 'utf8')).pid;

  // 4) atualizar com ele aberto: fecha o programa (pelo X), troca tudo e termina
  writeFileSync(join(PROG, 'servidor', 'app', 'marca-da-versao-antiga.txt'), 'x');
  conferir('atualizar com o programa aberto (saída 0)', instalar() === 0);
  conferir('o programa aberto e o servidor dele foram fechados', !vivo(p1.pid) && !vivo(srv1));
  conferir('a pasta do servidor foi trocada inteira', !existsSync(join(PROG, 'servidor', 'app', 'marca-da-versao-antiga.txt')));
  const p2 = await abrirEConferir(EXE, dados, 'depois de atualizar');
  try { process.kill(p2.pid); } catch {}
  await ate(() => !vivo(p2.pid), 10000);
  await espera(1500);

  // 5) desinstalar: tudo sai, menos o que o usuário pôs na pasta
  writeFileSync(join(PROG, 'meu-quadro.lousa'), '{}');
  const d = spawnSync(EXE, ['--desinstalar', '--silencioso'], { env: ENV, timeout: 60000 }).status;
  conferir('desinstala em silêncio (saída 0)', d === 0);
  conferir('saíram o programa, o Python e o servidor', !existsSync(join(PROG, 'python')) && !existsSync(join(PROG, 'servidor')) && !existsSync(EXE));
  conferir('ficou só o arquivo do usuário', JSON.stringify(readdirSync(PROG)) === JSON.stringify(['meu-quadro.lousa']), JSON.stringify(readdirSync(PROG)));
  conferir('saíram os atalhos e o registro', !existsSync(join(tmp, 'Menu', 'Giz Livre.lnk')) && !existsSync(join(tmp, 'Area', 'Giz Livre.lnk')) && !versaoNoRegistro());

  // 6) portátil: abre da pasta, sem instalar nada
  const pz = join(tmp, 'pendrive');
  execFileSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${join(DIST, PORT)}' -DestinationPath '${pz}'`]);
  const pexe = join(pz, 'GizLivre', 'GizLivre.exe');
  const depura = 9600 + Math.floor(Math.random() * 90);
  const pp = spawn(pexe, ['--porta', String(8990)], { stdio: 'ignore', detached: true,
    env: { ...ENV_PORTATIL, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${depura}` } });
  const pag = await ate(async () => { try { return (await (await fetch(`http://127.0.0.1:${depura}/json/list`)).json()).find(x => x.type === 'page' && x.url.startsWith('http://127.0.0.1:')); } catch { return null; } }, 40000);
  conferir('portátil: abre a lousa', !!pag);
  conferir('portátil: quadros e dados da janela ao lado do programa', existsSync(join(pz, 'GizLivre', 'quadros')) && existsSync(join(pz, 'GizLivre', 'janela-dados')));
  conferir('portátil: nada foi instalado', !existsSync(EXE) && !versaoNoRegistro());
  try { process.kill(pp.pid); } catch {}
} catch (e) { falhas++; console.log('  ✗ parou: ' + e.message); }
{ const c = existsSync(CAIXAS) ? readFileSync(CAIXAS, 'utf8').trim() : ''; conferir('nenhuma mensagem de erro do programa (caixa)', !c, c.slice(0, 300)); }
console.log(`\n${ok} conferências passaram, ${falhas} falharam`);
// a pasta temporária do teste sai no fim, também com falha (GIZ_MANTER=1 para guardar)
if (!process.env.GIZ_MANTER) try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + tmp); }
process.exit(falhas ? 1 : 0);
