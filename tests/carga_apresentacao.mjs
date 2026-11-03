// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Apresentação longa indo e voltando (retorno da aula de 03/11/2026, P64 a/b): deck SINTÉTICO de N slides (PNG
// 1920x1080 como os do PowerPoint, cada um com um quadrado de cor única no centro), modo apresentação e T trocas
// indo e voltando. Cada troca conta o tempo até o pixel do centro da tela ter a cor do slide certo (slide que não
// aparece em 15 s conta como "sumiu"); a memória da página e do Edge é medida a cada 25 trocas.
// Edge sem janela (protocolo de depuração), servidor com dados temporários; nada do professor é tocado.
//   node tests/carga_apresentacao.mjs [--slides 200] [--trocas 300] [--kb 900] [--manter]
//   Metas (P64): troca < 300 ms (p95), nenhum slide sumido, memória estável (o fim não passa de 1,5x a de 50 trocas).
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codigo, entrarNoNavegador } from './acesso.mjs';
import { pastaTemporaria, pastaDeEvidencia } from './temporario.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opc = (n, p) => { const i = args.indexOf(n); return i >= 0 ? Number(args[i + 1]) : p; };
const N = opc('--slides', 200), TROCAS = opc('--trocas', 300), KB = opc('--kb', 900);
// a aula de verdade: escrita à mão nos slides (o quadro de 03/11 tinha 4,8 MB de JSON), tempo parado em cada slide
// (a gravação sai 1,5 s depois da troca e a miniatura 4 s depois dela) e um PC de sala mais lento
const TRACOS = opc('--tracos', 0), PONTOS = opc('--pontos', 80), PAUSA = opc('--pausa', 0), LENTO = opc('--lento', 1);
if (args.includes('--manter')) process.env.GIZ_MANTER = '1';
const LARG = 1920, ALT = 1080, LIMITE_MS = 15000;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));
const MBf = b => +(b / 1048576).toFixed(1);
const log = (...a) => console.log(new Date().toTimeString().slice(0, 8), ...a);
const portaLivre = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });

const tmp = pastaTemporaria('giz-apres-'), DADOS = join(tmp, 'dados'), SAIDA = pastaDeEvidencia('carga_apresentacao');
mkdirSync(DADOS);
const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
let servidor, edge, ws, n = 0;
const pend = new Map();
const cdp = (method, params = {}, ms = 120000) => { const id = ++n; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { pend.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
    setTimeout(() => { if (pend.delete(id)) rej(new Error('sem resposta: ' + method)); }, ms); }); };
const avaliar = async e => { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result?.value; };
const tecla = async (key, code, vk) => { await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk }); };
const cor = i => [(i * 37 + 20) % 256, (i * 91 + 60) % 256, (i * 53 + 100) % 256];
function memoriaEdge() {
  const r = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(RAIZ, 'tests', 'carga_memoria.ps1'),
    '-Edge', String(edge.pid), '-Servidor', String(servidor.pid)], { encoding: 'utf8' });
  try { const m = JSON.parse(r.stdout.trim()); return { edgeMB: MBf(m.edgePriv), edgeProc: m.edgeN }; } catch { return {}; }
}
async function heap() { const m = (await cdp('Performance.getMetrics')).metrics; return MBf(m.find(x => x.name === 'JSHeapUsedSize').value); }

// --exe <pasta com GizLivre.exe>: a janela de verdade (WebView2, com a placa de vídeo), perfil de rascunho, quadros
// temporários e porta própria; ABRE JANELA NA TELA: só na VM ou com o SIM do professor. Sem --exe, Edge sem janela.
const iExe = args.indexOf('--exe'), PROG = iExe >= 0 ? args[iExe + 1] : null;
const R = { inicio: new Date().toISOString(), slides: N, trocas: TROCAS, kbPorSlide: KB, tela: PROG ? 'janela do programa' : `${LARG}x${ALT}`,
  janela: PROG ? 'GizLivre.exe (WebView2)' : 'sem janela (headless)' };
let codigoSaida = 1;
try {
  let token = '';
  const pc = await portaLivre();
  if (PROG) {
    process.env.GIZ_SEM_CAIXAS = join(tmp, 'caixas.txt');   // nenhuma caixa de mensagem na tela
    servidor = edge = spawn(join(PROG, 'GizLivre.exe'), ['--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore', detached: true,
      env: { ...process.env, GIZ_JANELA_DADOS: join(tmp, 'perfil-janela'), WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${pc}` } });
  } else {
    servidor = spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--sem-auto-encerrar', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' });
  }
  for (let t = 0; t < 300 && !token; t++) { try { token = await codigo(BASE, DADOS); } catch { await espera(100); } }
  if (!token) throw new Error('o servidor temporário não abriu');
  if (!PROG) edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${pc}`, `--user-data-dir=${join(tmp, 'perfil-edge')}`, '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', `--window-size=${LARG},${ALT}`, 'about:blank'], { stdio: 'ignore' });
  let alvo; for (let t = 0; t < 300 && !alvo; t++) { try { alvo = (await (await fetch(`http://127.0.0.1:${pc}/json/list`)).json())
    .find(x => x.type === 'page' && (!PROG || x.url.startsWith(BASE))); } catch {} if (!alvo) await espera(150); }
  if (!alvo) throw new Error('a página não apareceu no protocolo de depuração');
  ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { const f = pend.get(m.id); if (typeof f === 'function') f(m); pend.delete(m.id); } };
  await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Performance.enable');
  await entrarNoNavegador(cdp, BASE, token);
  if (!PROG) await cdp('Emulation.setDeviceMetricsOverride', { width: LARG, height: ALT, deviceScaleFactor: 1, mobile: false });
  // o registro de recursos guarda 250 entradas por padrão: as imagens do deck o enchiam e a contagem de gravações dava 0
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'performance.setResourceTimingBufferSize(1e6)' });
  await cdp('Page.navigate', { url: BASE + '/' });
  for (let t = 0; t < 100; t++) { if (await avaliar('document.readyState === "complete"').catch(() => false)) break; await espera(100); }

  // 1) deck sintético: as imagens nascem num canvas da página e vão para /api/assets
  log(`gerando ${N} slides de ~${KB} KB`);
  const srcs = await avaliar(`(async () => {
    const out = [], lado = Math.round(Math.sqrt(${KB} * 1024 / 3.4) * 0.63);
    for (let i = 0; i < ${N}; i++) {
      const c = document.createElement('canvas'); c.width = ${LARG}; c.height = ${ALT};
      const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, ${LARG}, ${ALT}); gr.addColorStop(0, 'hsl(' + (i * 7 % 360) + ',40%,92%)'); gr.addColorStop(1, '#fff');
      g.fillStyle = gr; g.fillRect(0, 0, ${LARG}, ${ALT});
      g.fillStyle = '#123'; g.font = 'bold 72px Segoe UI'; g.fillText('Slide ' + (i + 1) + ': equilíbrio químico', 80, 140);
      g.font = '40px Segoe UI'; for (let k = 0; k < 8; k++) g.fillText('• tópico ' + (k + 1) + ' do slide ' + (i + 1), 120, 260 + k * 70);
      const ruido = g.createImageData(lado, lado);   // "foto": pixels sorteados, o que dá o tamanho do PNG
      for (let p = 0; p < ruido.data.length; p++) ruido.data[p] = (p & 3) === 3 ? 255 : (Math.random() * 256) | 0;
      g.putImageData(ruido, ${LARG} - lado - 60, ${ALT} - lado - 60);
      g.fillStyle = 'rgb(' + [(i * 37 + 20) % 256, (i * 91 + 60) % 256, (i * 53 + 100) % 256].join(',') + ')';   // = cor(i)
      g.fillRect(${LARG / 2 - 120}, ${ALT / 2 - 120}, 240, 240);   // a marca do slide, lida no centro da tela
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      let r;   // o envio às vezes falha de passagem ("Failed to fetch") com o servidor ocupado: tenta de novo
      for (let t = 0; t < 3 && !r; t++) { try { r = await fetch('/api/assets', { method: 'POST', headers: { 'X-Lousa': ${JSON.stringify(token)}, 'Content-Type': 'image/png' }, body: blob }); } catch { await new Promise(s => setTimeout(s, 500)); } }
      if (!r) throw new Error('não deu para enviar o slide ' + (i + 1));
      out.push({ src: (await r.json()).url, kb: Math.round(blob.size / 1024) });
    }
    return out; })()`);
  R.kbMedio = Math.round(srcs.reduce((s, x) => s + x.kb, 0) / srcs.length);
  log(`  PNG médio ${R.kbMedio} KB`);
  const L = { mode: 'pages', kind: 's169', w: 1280, h: 720, gap: 48, count: N };
  const itens = srcs.map((s, k) => ({ id: 's' + k.toString(36), type: 'image', locked: true, x: 0, y: k * (L.h + L.gap), w: L.w, h: L.h, src: s.src }));
  // traços nas bordas do slide, longe do quadrado do centro (que é a marca lida na tela)
  for (let k = 0; k < N; k++) for (let t = 0; t < TRACOS; t++) {
    const y0 = k * (L.h + L.gap) + 30 + (t % 12) * 55, x0 = t % 2 ? 60 : 900, pts = [];
    for (let p = 0; p < PONTOS; p++) pts.push(+(x0 + p * 3.2).toFixed(1), +(y0 + Math.sin(p / 6 + t) * 14).toFixed(1), 0.5);
    itens.push({ id: `t${k.toString(36)}_${t}`, type: 'stroke', pts, width: 3, color: '#c00000' });
  }
  R.itens = itens.length;
  const board = { version: 2, title: `Apresentação ${N} slides`, background: { color: '#ffffff', pattern: 'none' }, layout: L, view: null, items: itens };
  const g = await fetch(`${BASE}/api/boards/apres`, { method: 'PUT', headers: { 'X-Lousa': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ board, revision: 0, criar: true }) });
  if (!g.ok) throw new Error('gravar quadro: ' + g.status + ' ' + await g.text());
  R.quadroKB = Math.round(JSON.stringify(board).length / 1024);
  log(`  quadro com ${itens.length} itens, ${R.quadroKB} KB`);
  if (LENTO > 1) await cdp('Emulation.setCPUThrottlingRate', { rate: LENTO });

  // 2) abrir e apresentar (F5)
  await cdp('Page.navigate', { url: `${BASE}/#/b/apres` });
  for (let t = 0; t < 300; t++) { if (await avaliar('window.__lousa?.S?.id === "apres"').catch(() => false)) break; await espera(100); }
  await espera(1500);
  // perfil novo: a escolha das áreas e o tour da primeira abertura podem cobrir o editor
  await avaliar(`document.querySelectorAll('dialog[open]').forEach(d => d.close())`);
  await avaliar(`document.getElementById('bPresent').click()`); await espera(1500);
  R.apresentacao = await avaliar(`document.getElementById('board').classList.contains('present')`);
  if (!R.apresentacao) throw new Error('o modo apresentação não ligou');
  const pagina = () => avaliar('(() => { const S = window.__lousa.S, L = S.board.layout; return Math.round((((document.getElementById("cv").clientHeight / 2) - S.view.y) / S.view.zoom) / (L.h + L.gap) - 0.5); })()');
  const pixel = () => avaliar(`(() => { const c = document.getElementById('cv'); return [...c.getContext('2d').getImageData(c.width / 2 | 0, c.height / 2 | 0, 1, 1).data].slice(0, 3); })()`);
  const bate = (p, i) => p && cor(i).every((v, k) => Math.abs(v - p[k]) <= 6);

  // 3) trocas: ida até 3/4, volta até 1/4, ida até o fim, volta... até somar TROCAS
  const plano = [];
  let atual = 0, dir = 1, alvos = [Math.floor(N * 0.75), Math.floor(N * 0.25), N - 1, Math.floor(N * 0.4)], ai = 0;
  while (plano.length < TROCAS) {
    const meta = alvos[ai % alvos.length];
    dir = meta > atual ? 1 : -1;
    while (atual !== meta && plano.length < TROCAS) { atual += dir; plano.push(atual); }
    ai++;
  }
  const tempos = [], sumidos = [], memoria = [];
  // gravações do quadro (pedidos a /api/boards/apres) só por trocar de slide: deveriam ser zero
  const gravacoes = () => avaliar(`performance.getEntriesByType('resource').filter(e => e.name.endsWith('/api/boards/apres')).length`);
  await espera(2000);
  const gravacoes0 = await gravacoes();
  // --falhas: o primeiro pedido da imagem de 1 slide a cada 7 falha (servidor reaberto, arquivo do OneDrive vindo da
  // nuvem); o slide tem de aparecer sozinho, sem fechar e abrir o quadro
  R.falhasInjetadas = 0;
  if (args.includes('--falhas')) {
    const alvos = new Set(srcs.filter((_, k) => k % 7 === 3).map(s => s.src.split('/').pop())), ja = new Set();
    const anterior = ws.onmessage;
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Fetch.requestPaused') {
        const nome = m.params.request.url.split('/').pop();
        if (alvos.has(nome) && !ja.has(nome)) { ja.add(nome); R.falhasInjetadas++; cdp('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'ConnectionReset' }).catch(() => {}); }
        else cdp('Fetch.continueRequest', { requestId: m.params.requestId }).catch(() => {});
        return;
      }
      anterior(ev);
    };
    await cdp('Fetch.enable', { patterns: [{ urlPattern: '*/assets/*' }] });
  }
  const PERFIL = args.includes('--perfil');   // perfil de CPU das trocas: as 15 funções que mais gastam
  if (PERFIL) { await cdp('Profiler.enable'); await cdp('Profiler.setSamplingInterval', { interval: 500 }); await cdp('Profiler.start'); }
  memoria.push({ troca: 0, heapMB: await heap(), ...memoriaEdge() });
  for (let k = 0; k < plano.length; k++) {
    const i = plano[k], frente = k === 0 ? i > 0 : i > plano[k - 1];
    const t0 = Date.now();
    if (frente) await tecla('ArrowRight', 'ArrowRight', 39); else await tecla('ArrowLeft', 'ArrowLeft', 37);
    let ok = false;
    while (Date.now() - t0 < LIMITE_MS) { if (bate(await pixel(), i)) { ok = true; break; } await espera(15); }
    const ms = Date.now() - t0;
    if (PAUSA) await espera(PAUSA);
    // a primeira vez num slide com falha injetada espera a nova tentativa: conta à parte, não no p95
    const comFalha = R.falhasInjetadas && i % 7 === 3 && !plano.slice(0, k).includes(i);
    if (ok && comFalha) (R.trocasComFalhaMs ||= []).push(ms);
    else if (ok) tempos.push(ms); else sumidos.push({ troca: k + 1, slide: i + 1, paginaNaTela: (await pagina()) + 1, pixel: await pixel() });
    if ((k + 1) % 25 === 0) { memoria.push({ troca: k + 1, heapMB: await heap(), ...memoriaEdge() }); log(`  ${k + 1} trocas; última ${ms} ms; sumidos ${sumidos.length}`, memoria.at(-1)); }
  }
  if (PERFIL) {
    const { profile } = await cdp('Profiler.stop');
    const dt = new Map(); profile.samples.forEach((id, k) => dt.set(id, (dt.get(id) || 0) + (profile.timeDeltas[k] || 0)));
    const porFuncao = new Map();
    for (const no of profile.nodes) { const f = no.callFrame, chave = `${f.functionName || '(anônima)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}`;
      porFuncao.set(chave, (porFuncao.get(chave) || 0) + (dt.get(no.id) || 0)); }
    R.perfil = [...porFuncao].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([f, us]) => `${Math.round(us / 1000)} ms  ${f}`);
    log('perfil (tempo próprio):\n  ' + R.perfil.join('\n  '));
  }
  const s = [...tempos].sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  R.troca = { n: tempos.length, mediaMs: Math.round(tempos.reduce((a, b) => a + b, 0) / Math.max(1, tempos.length)), p50: q(.5), p95: q(.95), max: s.at(-1) };
  R.sumidos = sumidos; R.memoria = memoria;
  R.gravacoesSoPorTrocar = (await gravacoes()) - gravacoes0;
  const m50 = memoria.find(m => m.troca === 50) || memoria[1], fim = memoria.at(-1);
  R.metas = { trocaP95Abaixo300ms: R.troca.p95 < 300, nenhumSumido: sumidos.length === 0,
    memoriaEstavel: !m50 || !!(m50.edgeMB && fim.edgeMB <= m50.edgeMB * 1.5), semGravarSoPorTrocar: R.gravacoesSoPorTrocar === 0 };
  log('troca', R.troca, 'sumidos', sumidos.length, 'falhas injetadas', R.falhasInjetadas, 'metas', R.metas);
  codigoSaida = Object.values(R.metas).every(Boolean) ? 0 : 1;
} catch (e) { R.erro = e.message; log('ERRO', e.message, e.cause?.message || '', e.stack?.split('\n')[1] || ''); }
finally {
  try { await fetch(BASE + '/api/sair', { method: 'POST' }); } catch {}
  // a janela: a árvore do GizLivre.exe deste teste (WebView2 e servidor), só pelo PID dele
  if (PROG && edge?.pid) { await espera(1500); spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); }
  else { try { edge?.kill(); } catch {} try { servidor?.kill(); } catch {} }
  if (PROG && existsSync(process.env.GIZ_SEM_CAIXAS)) R.caixas = readFileSync(process.env.GIZ_SEM_CAIXAS, 'utf8').trim();
  writeFileSync(join(SAIDA, 'resultado.json'), JSON.stringify(R, null, 2));
  log('resultado em', join(SAIDA, 'resultado.json'));
}
process.exit(codigoSaida);
