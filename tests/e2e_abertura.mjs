// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// P-ABERTURA (22/11/2026): o que a página faz para a abertura parecer de programa profissional. Edge sem janela,
// servidor com dados temporários.
//  E: a escolha das áreas das formas é uma faixa no alto da galeria (não uma janela por cima), numa abertura só
//  C: a galeria aparece na hora, com o esqueleto dos cartões, antes de os quadros chegarem
//   node tests/e2e_abertura.mjs [--raiz <pasta de outra versão>]
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigo, entrarNoNavegador } from './acesso.mjs';
import { pastaTemporaria } from './temporario.mjs';

const args = process.argv.slice(2), iR = args.indexOf('--raiz');
const RAIZ = iR >= 0 ? resolve(args[iR + 1]) : join(dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
let ok = 0, falhas = 0;
const conferir = (n, c, d = '') => { c ? ok++ : falhas++; console.log(`  ${c ? '✓' : '✗'} ${n}${!c && d ? ': ' + d : ''}`); return c; };

const tmp = pastaTemporaria('giz-abertura-'), DADOS = join(tmp, 'dados');
mkdirSync(DADOS, { recursive: true });
const procs = [];
try {
  const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
  procs.push(spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' }));
  let token = ''; for (let t = 0; t < 150 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(100); } }
  const api = (metodo, rota, corpo) => fetch(BASE + rota, { method: metodo, headers: { 'X-Lousa': token, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  for (let i = 1; i <= 3; i++)
    await api('PUT', `/api/boards/aula${i}`, { board: { version: 2, title: `Aula ${i}`, background: { color: '#ffffff', pattern: 'none' }, view: null, items: [] }, revision: 0, criar: true });

  const porta = await portaLivre();
  procs.push(spawn(EDGE, ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${join(tmp, 'perfil')}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1600,900', 'about:blank'], { stdio: 'ignore' }));
  let alvo; for (let t = 0; t < 100 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json()).find(x => x.type === 'page'); } catch { await espera(150); } }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const pend = new Map(), erros = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
  const cdp = (method, params = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => pend.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result))); };
  const avaliar = async e => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result?.value; };
  const ate = async (e, ms = 15000) => { const fim = Date.now() + ms; while (Date.now() < fim) { if (await avaliar(e).catch(() => false)) return true; await espera(100); } return false; };
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Emulation.setFocusEmulationEnabled', { enabled: true }); await cdp('Page.bringToFront');
  await entrarNoNavegador(cdp, BASE, token);
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('lousa.ajuda', '{"tourVisto":true}'); } catch {}` });
  let aberturas = 0;   // endereço diferente a cada abertura: só trocar o # não recarrega a página
  const galeria = async () => { await avaliar(`window.gizFechando = true`).catch(() => {});
    await cdp('Page.navigate', { url: `${BASE}/?n=${++aberturas}` }); await ate(`document.querySelectorAll('#gGrid .card[data-id]').length >= 3`); await espera(500); };

  console.log('E: escolha das áreas na primeira abertura');
  await galeria();
  conferir('a faixa "Escolha as áreas das formas" aparece no alto da galeria', await avaliar(`!!document.querySelector('#gGrid .g-areas')`));
  conferir('nenhuma janela por cima da galeria', !(await avaliar(`!!document.querySelector('dialog[open]')`)));
  await espera(600);
  conferir('nem depois de um instante (a antiga vinha em 300 ms)', !(await avaliar(`!!document.querySelector('dialog[open]')`)));
  conferir('a escolha atual (todas) já fica valendo', await avaliar(`JSON.parse(localStorage.getItem('lousa.abas') || '{}').escolhido === true`));
  await avaliar(`document.querySelector('[data-areas="escolher"]').click()`); await espera(300);
  conferir('"Escolher áreas" abre a janela das áreas', await avaliar(`!!document.querySelector('dialog.disc-dlg[open]')`));
  await avaliar(`document.querySelector('dialog.disc-dlg [data-a="x"]').click()`); await espera(300);
  conferir('a faixa some depois de usada', !(await avaliar(`!!document.querySelector('#gGrid .g-areas')`)));
  await galeria();
  conferir('na abertura seguinte não volta (uma vez só)', !(await avaliar(`!!document.querySelector('#gGrid .g-areas')`)));
  // instalação nova de novo: sem a escolha no navegador nem na cópia do programa (preferencias.json, ao lado dos dados)
  await avaliar(`localStorage.removeItem('lousa.abas')`);
  const arqPrefs = join(tmp, 'preferencias.json');
  if (existsSync(arqPrefs)) { const pr = JSON.parse(readFileSync(arqPrefs, 'utf8')); delete pr['lousa.abas']; writeFileSync(arqPrefs, JSON.stringify(pr)); }
  await galeria();
  await avaliar(`document.querySelector('[data-areas="fechar"]').click()`); await espera(200);
  conferir('"Agora não" fecha a faixa sem abrir nada', !(await avaliar(`!!document.querySelector('#gGrid .g-areas') || !!document.querySelector('dialog[open]')`)));

  console.log('C: galeria com esqueleto antes dos módulos');
  // com o main.js bloqueado, a página fica como nos primeiros instantes da abertura
  await cdp('Network.setBlockedURLs', { urls: ['*js/main.js*'] });
  await avaliar(`window.gizFechando = true`).catch(() => {});
  await cdp('Page.navigate', { url: `${BASE}/?n=${++aberturas}` }); await espera(1200);
  conferir('a galeria aparece antes dos módulos', await avaliar(`getComputedStyle(document.getElementById('gallery')).display !== 'none'`));
  conferir('com o esqueleto: a faixa da vitrine e 12 cartões', await avaliar(`document.querySelectorAll('#gGrid .esq-vitrine').length === 1 && document.querySelectorAll('#gGrid .esq-cartao').length === 12`));
  conferir('o cabeçalho de verdade já está lá', await avaliar(`document.querySelector('.g-head h1')?.offsetHeight > 0 && document.getElementById('gSearch')?.offsetWidth > 0`));
  await cdp('Page.navigate', { url: `${BASE}/?n=${++aberturas}#/b/aula1` }); await espera(1000);
  conferir('abrindo um quadro direto (recarga depois de uma queda), a galeria não aparece', await avaliar(`getComputedStyle(document.getElementById('gallery')).display === 'none'`));
  await cdp('Network.setBlockedURLs', { urls: [] });
  await galeria();
  conferir('com os quadros, o esqueleto sai', await avaliar(`!document.querySelector('#gGrid .esq-cartao') && !document.documentElement.classList.contains('abrindo-galeria') && !document.getElementById('gGrid').hasAttribute('aria-busy')`));
  await avaliar(`window.gizFechando = true`); await cdp('Page.navigate', { url: `${BASE}/?n=${++aberturas}#/b/aula1` });
  await ate(`window.__lousa?.S?.id === 'aula1'`, 20000); await espera(400);
  conferir('abrindo o quadro, a galeria some (a marca não a segura aberta)', await avaliar(`getComputedStyle(document.getElementById('gallery')).display === 'none'`));
  location_hash_volta: {
    await avaliar(`location.hash = '#/'`); await ate(`!document.getElementById('gallery').hidden`, 10000); await espera(300);
    conferir('de volta à galeria, sem esqueleto', await avaliar(`document.querySelectorAll('#gGrid .card[data-id]').length >= 3 && !document.querySelector('#gGrid .esq-cartao')`));
  }

  conferir('nenhum erro na página', !erros.length, erros.join(' | '));
  ws.close();
} finally {
  for (const p of procs) try { p.kill(); } catch {}
}
console.log(`\n${ok} ok, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
