// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Teste visual da biblioteca de formas (sem dependências).  Rodar:  node tests/formas_visual.mjs [--calibrar]
// Desenha de verdade, no Microsoft Edge sem janela (protocolo de depuração), todas as formas e todos os especiais, e
// confere o que o teste estático não enxerga: (a) desenho ou texto saindo da caixa da forma, (b) rótulo em cima de
// traço e (c) SVG que o navegador não abre. Sobe o servidor numa porta livre com dados temporários (nunca a 8765 do
// programa instalado). --calibrar lista todos os rótulos com alguma tinta por baixo, para rever o limite abaixo.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shapeById } from '../app/js/shapelib.js';
import { codigo, entrarNoNavegador } from './acesso.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CALIBRAR = process.argv.includes('--calibrar');
const EDGE = [process.env.GIZ_BROWSER, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find(existsSync);
const espera = ms => new Promise(r => setTimeout(r, ms));

// ---------------- limites e exceções (calibrados em 22/10/2026, depois das correções da auditoria) ----------------
// (b) Texto sobre traço: a forma é desenhada sem os textos, em preto e com 2 px por unidade, e conta-se a tinta dentro
// da caixa de cada texto (encolhida 1 px dos lados e 22% em cima e embaixo, porque a caixa do Segoe UI tem folga de
// linha). Calibração (--calibrar): fora as exceções abaixo, a maior tinta sob um rótulo ficou em 10,8% ("P" da
// mat-parabola, traço da curva encostando na letra), e quase tudo acima de 3% é traço que encosta na beira da letra
// (seta que chega no rótulo, cota, eixo ao lado do número). Os erros corrigidos na auditoria estavam acima: "F" da lente
// divergente 72%, "P" do ciclo e do globo 25%, roadmap 29% e 23%, ciclo trigonométrico 23%, Bohr 19%, quadra tática 16%,
// ferramenta de corte 17% e 18%, isotermas 17%, jornada 18%, onda 14%. O limite de 12% pega todos esses menos o "H⁺"
// da célula a combustível (11%) e deixa 1,2 ponto de folga sobre a forma boa mais alta.
const LIMITE_TINTA = 0.12;
// convenções em que o texto fica sobre o traço de propósito (a forma inteira fica fora desta conferência)
const TEXTO_SOBRE_TRACO_OK = {
  'lb-nfpa': 'o W riscado é a convenção "não usar água" do diamante NFPA 704',
  'mat-sarrus': 'as diagonais da regra de Sarrus passam pelas letras de propósito',
  'ali-gluten': 'a bolha de CO₂ aparece presa na rede, atravessada por um fio de glúten',
  'por-classif-silabas': 'as reticências encostam na última caixa para dizer que a fila continua',
};
// defeitos já conhecidos e ainda não corrigidos: só esses rótulos ficam liberados, e o teste avisa a cada execução
// (vazia desde 22/10/2026: o mapa dos estados ganhou siglas fora com linha de chamada e o "+" do rn-bms foi afastado)
const PENDENTES = {};
// (a) Desenho fora da caixa: estes mapas cortam o contorno do mundo com clipPath de propósito, e a caixa medida pelo
// navegador ignora o corte. Vale só para o desenho; os textos deles continuam conferidos.
const DESENHO_FORA_OK = {
  'his-tordesilhas-mapa': 'contorno do mundo recortado por clipPath',
  'his-navegacoes-mapa': 'contorno do mundo recortado por clipPath',
};
// folga em unidades do viewBox: 2 nas formas (meia espessura do traço de 2,5 px, que a caixa não conta), 1 nos especiais
const FOLGA_DESENHO = { forma: 2, esp: 1 }, FOLGA_TEXTO = 1;

function portaLivre() {
  return new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
}

// roda dentro da página: devolve só as formas com algum achado (e, na calibração, a tinta de cada rótulo)
async function inspecionar({ limiteMin }) {
  const L = await import('/js/shapelib.js'), E = await import('/js/especiais.js');
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:0;top:0;background:#fff';
  document.body.appendChild(host);
  const cv = document.createElement('canvas'), c = cv.getContext('2d', { willReadFrequently: true }), S = 2;
  const abrir = async svg => { const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode(); return img; };
  const itens = [...L.ALL_SHAPES.map(s => ({ id: s[0], k: 'forma', faz: () => L.shapeSvg(s[0], '#000') })),
    ...E.ESPECIAIS.map(e => ({ id: e.id, k: 'esp', faz: () => e.make() }))];
  const res = [];
  for (const it of itens) {
    const o = { id: it.id, k: it.k };
    let s;
    try { s = it.faz(); } catch (e) { o.erro = 'não monta: ' + e.message; res.push(o); continue; }
    const doc = new DOMParser().parseFromString(s.svg, 'image/svg+xml');
    if (doc.querySelector('parsererror')) { o.erro = 'XML inválido: ' + doc.querySelector('parsererror').textContent.slice(0, 100); res.push(o); continue; }
    try { await abrir(s.svg); } catch { o.erro = 'o navegador não decodifica o SVG como imagem'; res.push(o); continue; }
    host.innerHTML = s.svg;
    const svg = host.firstElementChild, R0 = svg.getBoundingClientRect();
    const vb = (svg.getAttribute('viewBox') || `0 0 ${s.w} ${s.h}`).split(/[ ,]+/).map(Number);
    const kx = R0.width / vb[2], ky = R0.height / vb[3];
    const rel = r => ({ x: (r.left - R0.left) / kx + vb[0], y: (r.top - R0.top) / ky + vb[1], x2: (r.right - R0.left) / kx + vb[0], y2: (r.bottom - R0.top) / ky + vb[1] });
    const fora = q => [vb[0] - q.x, vb[1] - q.y, q.x2 - (vb[0] + vb[2]), q.y2 - (vb[1] + vb[3])];
    let pior = 0;
    for (const el of svg.querySelectorAll('path,line,rect,circle,ellipse,polyline,polygon,use')) {
      if (el.closest('defs,clipPath,mask,marker,pattern,symbol')) continue;
      const r = el.getBoundingClientRect(); if (!r.width && !r.height) continue;
      pior = Math.max(pior, ...fora(rel(r)));
    }
    if (pior > 0) o.desenhoFora = Math.round(pior * 10) / 10;
    const textos = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('defs,clipPath,mask,marker,pattern,symbol'))
      .map(t => ({ s: t.textContent.trim(), r: t.getBoundingClientRect() }));
    const tsai = textos.filter(t => Math.max(...fora(rel(t.r))) > 0).map(t => `${t.s} (${Math.round(Math.max(...fora(rel(t.r))) * 10) / 10})`);
    if (tsai.length) o.textoFora = tsai;
    // (b) só nas formas: os especiais têm fundo e faixas coloridas atrás do texto, e a contagem de tinta não se aplica
    if (it.k === 'forma' && textos.length) {
      const img = await abrir(L.shapeSvg(it.id, '#000', { semTexto: true }).svg);
      cv.width = Math.ceil(s.w * S); cv.height = Math.ceil(s.h * S);
      c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height); c.drawImage(img, 0, 0, cv.width, cv.height);
      const D = c.getImageData(0, 0, cv.width, cv.height).data, tinta = [];
      for (const t of textos) {
        const x = t.r.left - R0.left, y = t.r.top - R0.top, w = t.r.width, h = t.r.height;
        const x0 = Math.max(0, Math.floor((x + 1) * S)), x1 = Math.min(cv.width, Math.ceil((x + w - 1) * S));
        const y0 = Math.max(0, Math.floor((y + h * 0.22) * S)), y1 = Math.min(cv.height, Math.ceil((y + h * 0.78) * S));
        let n = 0, a = 0;
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { a++; if (D[(yy * cv.width + xx) * 4] < 120) n++; }
        if (a && n / a > limiteMin) tinta.push([t.s, Math.round(n / a * 1000) / 1000]);
      }
      if (tinta.length) o.tinta = tinta;
    }
    if (o.desenhoFora || o.textoFora || o.tinta) res.push(o);
  }
  host.remove();
  return { total: itens.length, formas: L.ALL_SHAPES.length, especiais: E.ESPECIAIS.length, res };
}

// ---------------- servidor, Edge e protocolo de depuração ----------------
const inicio = Date.now();
const pastaTmp = mkdtempSync(join(tmpdir(), 'giz-formas-'));
const DADOS = join(pastaTmp, 'dados'); mkdirSync(DADOS);
const PORTA = await portaLivre(), BASE = `http://127.0.0.1:${PORTA}`;
let servidor, edge, ws, nCdp = 0, falhas = [], avisos = [], resultado;
const pendentes = new Map();
function cdp(method, params = {}, limite = 30000) {
  const id = ++nCdp;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pendentes.set(id, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result));
    setTimeout(() => { if (pendentes.delete(id)) rej(new Error('CDP sem resposta: ' + method)); }, limite);
  });
}
try {
  if (!EDGE) throw new Error('Microsoft Edge não encontrado (defina GIZ_BROWSER com o caminho do navegador)');
  servidor = spawn('python', [join(RAIZ, 'server.py'), '--sem-janela', '--porta', String(PORTA), '--dados', DADOS], { stdio: 'ignore' });
  let no = false;
  for (let t = 0; t < 100 && !no; t++) { try { no = (await fetch(BASE + '/api/info')).ok; } catch { await espera(100); } }
  if (!no) throw new Error('o servidor temporário não abriu na porta ' + PORTA);
  const portaCdp = await portaLivre();
  edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${portaCdp}`, `--user-data-dir=${join(pastaTmp, 'perfil-edge')}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore' });
  let alvo;
  for (let t = 0; t < 100 && !alvo; t++) {
    try { alvo = (await (await fetch(`http://127.0.0.1:${portaCdp}/json/list`)).json()).find(x => x.type === 'page'); }
    catch { await espera(150); }
  }
  if (!alvo) throw new Error('o Edge não abriu a porta de depuração');
  ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { { const f = pendentes.get(m.id); if (typeof f === 'function') f(m); } pendentes.delete(m.id); } };
  await cdp('Page.enable');
  await entrarNoNavegador(cdp, BASE, await codigo(BASE, DADOS));
  // página leve da mesma origem (o índice JSON): os módulos da biblioteca carregam sem abrir o programa inteiro
  await cdp('Page.navigate', { url: BASE + '/shapes-index.json' });
  for (let t = 0; t < 50; t++) {
    const r = await cdp('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
    if (r.result.value === 'complete') break; await espera(100);
  }
  const r = await cdp('Runtime.evaluate', {
    expression: `(${inspecionar.toString()})(${JSON.stringify({ limiteMin: CALIBRAR ? 0.005 : 0.03 })})`,
    awaitPromise: true, returnByValue: true }, 600000);
  if (r.exceptionDetails) throw new Error('erro na página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  resultado = r.result.value;

  // ---------------- julgamento ----------------
  for (const o of resultado.res) {
    if (o.erro) falhas.push(`${o.id}: ${o.erro}`);
    if (o.desenhoFora > FOLGA_DESENHO[o.k] && !DESENHO_FORA_OK[o.id]) falhas.push(`${o.id}: desenho sai ${o.desenhoFora} da caixa`);
    const tf = (o.textoFora || []).filter(t => +t.match(/\(([\d.]+)\)$/)[1] > FOLGA_TEXTO);
    if (tf.length) falhas.push(`${o.id}: texto fora da caixa: ${tf.join(', ')}`);
    const sob = (o.tinta || []).filter(([, f]) => f > LIMITE_TINTA);
    const pend = PENDENTES[o.id], novos = sob.filter(([t]) => !pend?.textos.includes(t));
    if (pend && sob.length > novos.length) avisos.push(`${o.id}: ${pend.motivo}`);
    if (novos.length && !TEXTO_SOBRE_TRACO_OK[o.id]) falhas.push(`${o.id}: texto sobre traço: ${novos.map(([t, f]) => `"${t}" ${Math.round(f * 100)}%`).join(', ')}`);
  }
  // exceção para forma que não existe mais (id trocado por engano) deve sair da lista
  for (const id of [...Object.keys(TEXTO_SOBRE_TRACO_OK), ...Object.keys(DESENHO_FORA_OK), ...Object.keys(PENDENTES)])
    if (!shapeById(id)) falhas.push(`exceção para forma inexistente: ${id}`);
  if (CALIBRAR) {
    const todos = resultado.res.flatMap(o => (o.tinta || []).map(([t, f]) => [f, o.id, t])).sort((a, b) => b[0] - a[0]);
    console.log('Tinta sob os rótulos (maiores primeiro):');
    for (const [f, id, t] of todos.slice(0, 60)) console.log(`  ${(f * 100).toFixed(1).padStart(5)}%  ${id}  "${t}"${TEXTO_SOBRE_TRACO_OK[id] ? '  (exceção)' : ''}`);
    const faixas = [0.03, 0.05, 0.08, 0.1, 0.12, 0.15, 0.2].map(l => `>${l * 100}%: ${new Set(todos.filter(x => x[0] > l).map(x => x[1])).size}`);
    console.log('Formas com algum rótulo acima de: ' + faixas.join(' · '));
  }
} catch (e) {
  falhas.push('o teste não rodou até o fim: ' + (e.stack || e.message));
} finally {
  try { await cdp('Browser.close', {}, 3000); } catch {}
  try { ws?.close(); } catch {}
  try { edge?.kill(); } catch {}
  try { servidor?.kill(); } catch {}
}

const seg = ((Date.now() - inicio) / 1000).toFixed(0);
if (resultado) console.log(`Formas desenhadas no Edge: ${resultado.formas} formas e ${resultado.especiais} especiais (${seg} s)`);
if (avisos.length) { console.log(`Defeitos conhecidos, ainda liberados (${avisos.length}):`); for (const a of avisos) console.log('  ! ' + a); }
if (falhas.length) {
  console.log(`\n${falhas.length} problema(s):`);
  for (const f of falhas) console.log('  ✗ ' + f);
} else {
  console.log('  ✓ nenhum SVG quebrado, nada fora da caixa, nenhum rótulo sobre traço acima de ' + LIMITE_TINTA * 100 + '%');
}
await espera(500);
try { rmSync(pastaTmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch { console.log('pasta temporária não apagada: ' + pastaTmp); }
process.exit(falhas.length ? 1 : 0);
