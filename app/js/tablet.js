// Painel "Caneta e escrita": mesa digitalizadora, estabilizador em camadas, embelezar escrita
// e área de teste que diagnostica o driver (Windows Ink) e grava amostras brutas.
import { createStabilizer } from './stabilizer.js';
import { download } from './api.js';

export const DEFAULT_TABLET = {
  pressure: true,     // pressão muda a espessura
  gamma: 1,           // curva: <1 macia, >1 firme
  barrel: 'eraser',   // botão lateral: eraser | lasso | select | laser | pan | none
  touch: 'auto',      // dedo: auto | draw | pan
  cursor: 'ponta',    // ponteiro da caneta na tela: ponta | mira | ponto | anel
  cursorDraw: true,   // o ponteiro continua visível enquanto escreve
  // estabilizador (cada camada liga/desliga)
  stab: true, stabLevel: 'leve',
  lazy: false, lazyLen: 14,
  pfilter: true,
  taper: true,
  smoothUp: true,
  // escrita
  beautify: false, beautifyLevel: 'moderado', beautifyDelay: 700,
};

const BARREL = [['eraser', 'Borracha'], ['lasso', 'Laço'], ['select', 'Selecionar'], ['laser', 'Ponteiro laser'], ['pan', 'Mover o quadro'], ['none', 'Nada (ferramenta atual)']];
const CURSOR = [['ponta', 'Ponta de caneta'], ['mira', 'Mira (cruz fina)'], ['ponto', 'Ponto do tamanho da tinta'], ['anel', 'Bolinha com anel']];
const TOUCH = [['auto', 'Automático (depois da caneta, o dedo só move)'], ['draw', 'Sempre desenha'], ['pan', 'Sempre move o quadro']];
const chk = (id, on, label) => `<label class="tb-line"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}> ${label}</label>`;
const opts = (list, v) => list.map(([k, n]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${n}</option>`).join('');

export function openTabletSettings(cfg, save) {
  const d = document.createElement('dialog');
  d.className = 'tablet';
  d.innerHTML = `
    <div class="dlg-head"><h3>Caneta e escrita</h3><button class="ib" id="tbX" title="Fechar">✕</button></div>
    <div class="tb-cols">
      <div class="tb-set">
        <div class="tb-group"><b>Estabilizador (tira o tremido) — cada camada liga e desliga</b>
          <div class="tb-line">${chk('tbStab', cfg.stab, 'Filtro de posição')}
            <select id="tbLevel">${opts([['leve', 'Leve'], ['media', 'Médio'], ['forte', 'Forte']], cfg.stabLevel)}</select></div>
          <div class="tb-line">${chk('tbLazy', cfg.lazy, 'Fio puxado')}
            <input type="range" class="grow" id="tbLazyLen" min="4" max="40" step="1" value="${cfg.lazyLen}"><small id="tbLazyVal">${cfg.lazyLen} px</small></div>
          ${chk('tbPf', cfg.pfilter, 'Filtro de pressão (espessura não pulsa)')}
          ${chk('tbTaper', cfg.taper, 'Afinar início e fim do traço')}
          ${chk('tbSmooth', cfg.smoothUp, 'Suavizar o traço ao soltar a caneta')}
        </div>
        <div class="tb-group"><b>Escrita</b>
          ${chk('tbBeauty', cfg.beautify, 'Embelezar ao escrever (endireita a linha após uma pausa)')}
          <div class="tb-line"><span>Intensidade</span><select id="tbBLevel">${opts([['suave', 'Suave (só endireita um pouco)'], ['moderado', 'Moderado'], ['forte', 'Forte (endireita e suaviza bastante)']], cfg.beautifyLevel)}</select></div>
        </div>
        <div class="tb-group"><b>Caneta</b>
          ${chk('tbPress', cfg.pressure, 'A pressão muda a espessura')}
          <div class="tb-line"><small>Macia</small><input type="range" class="grow" id="tbGamma" min="0.4" max="2.2" step="0.1" value="${cfg.gamma}"><small>Firme</small></div>
          <div class="tb-line"><span>Botão lateral</span><select id="tbBarrel">${opts(BARREL, cfg.barrel)}</select></div>
          <div class="tb-line"><span>Dedo</span><select id="tbTouch">${opts(TOUCH, cfg.touch)}</select></div>
          <div class="tb-line"><span>Ponteiro na tela</span><select id="tbCursor">${opts(CURSOR, cfg.cursor)}</select></div>
        </div>
      </div>
      <div class="tb-test">
        <span>Teste aqui (usa as configurações ao lado)</span>
        <canvas id="tbPad" width="460" height="230"></canvas>
        <div class="tb-actions">
          <label class="tb-line"><input type="checkbox" id="tbRaw"> Mostrar o traço cru em vermelho (comparar)</label>
          <button class="btn" id="tbClear">Limpar</button>
          <button class="btn" id="tbRec" title="Grava 10 s de eventos brutos da caneta num arquivo, para ajustar os filtros">Gravar amostra</button>
        </div>
        <div class="tb-info" id="tbInfo">Aguardando a caneta…</div>
        <div class="tb-verdict" id="tbVerdict"></div>
      </div>
    </div>
    <details class="tb-help">
      <summary>Wacom Intuos: configuração recomendada</summary>
      <p>Abra <i>Propriedades da Mesa Wacom</i> (menu Iniciar → "Wacom"):</p>
      <ol>
        <li><b>Mapeamento</b> → marque <i>Usar Windows Ink</i> (sem isso não há pressão nem botões) → reabra o Giz Livre.</li>
        <li><b>Mapeamento</b> → em Tela, escolha <b>um monitor só</b> (o principal ou o do projetor) e marque <b>Forçar proporções</b>.
          A área da Intuos é pequena; mapeada para todos os monitores, 1 mm da mão vira dezenas de pixels e o tremido aumenta.</li>
        <li><b>Caneta</b> → botão de baixo em <i>Clique com o botão direito</i> (vira a ação "Botão lateral" daqui) e o de cima em
          <i>Rolagem/Movimento panorâmico</i> (move o quadro).</li>
        <li><b>ExpressKeys</b> (crie as configurações para o aplicativo <i>msedge.exe</i>, botão "+" em Aplicativo):
          sugestão para as 4 teclas da Intuos: <kbd>Ctrl+Z</kbd> desfazer · <kbd>E</kbd> borracha · <kbd>P</kbd> caneta ·
          <kbd>Espaço</kbd> (segurar) mover o quadro.</li>
      </ol>
      <p>Outros atalhos para as teclas: <kbd>Ctrl+Y</kbd> refazer · <kbd>1</kbd>–<kbd>4</kbd> trocar caneta · <kbd>L</kbd> laço ·
      <kbd>H</kbd> marca-texto · <kbd>K</kbd> laser · <kbd>R</kbd> régua · <kbd>[</kbd> <kbd>]</kbd> espessura · <kbd>Ctrl+0</kbd> ajustar à tela.
      XP-Pen/Huion/Gaomon: ative <i>Windows Ink</i> no programa da mesa.</p>
    </details>
    <div class="acts"><button class="btn primary" id="tbClose">Fechar</button></div>`;
  document.body.appendChild(d);
  const $ = s => d.querySelector(s);

  const upd = () => {
    Object.assign(cfg, {
      stab: $('#tbStab').checked, stabLevel: $('#tbLevel').value,
      lazy: $('#tbLazy').checked, lazyLen: +$('#tbLazyLen').value,
      pfilter: $('#tbPf').checked, taper: $('#tbTaper').checked, smoothUp: $('#tbSmooth').checked,
      beautify: $('#tbBeauty').checked, beautifyLevel: $('#tbBLevel').value,
      pressure: $('#tbPress').checked, gamma: +$('#tbGamma').value,
      barrel: $('#tbBarrel').value, touch: $('#tbTouch').value, cursor: $('#tbCursor').value,
    });
    $('#tbLazyVal').textContent = cfg.lazyLen + ' px';
    save();
  };
  d.querySelectorAll('.tb-set input, .tb-set select').forEach(el => { el.addEventListener('change', upd); el.addEventListener('input', upd); });
  let recTimer = 0;
  const close = () => { clearInterval(recTimer); d.close(); d.remove(); document.dispatchEvent(new Event('lousa:cfg')); };
  $('#tbClose').onclick = close;
  $('#tbX').onclick = close;
  d.addEventListener('cancel', () => document.dispatchEvent(new Event('lousa:cfg')));
  d.addEventListener('close', () => d.remove());

  // ---- área de teste ----
  const pad = $('#tbPad'), g = pad.getContext('2d');
  const dpr = devicePixelRatio || 1;
  pad.width = 460 * dpr; pad.height = 230 * dpr;
  g.scale(dpr, dpr);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const seen = { types: new Set(), pressures: new Set(), barrel: false, eraser: false };
  let stab = null, lastF = null, lastR = null, samples = [];
  let rec = null;
  $('#tbClear').onclick = () => g.clearRect(0, 0, 460, 230);

  $('#tbRec').onclick = () => {
    if (rec) return;
    rec = { started: new Date().toISOString(), userAgent: navigator.userAgent, events: [] };
    let left = 10;
    $('#tbRec').textContent = `Gravando… ${left}s`;
    const timer = recTimer = setInterval(() => {
      left--;
      $('#tbRec').textContent = `Gravando… ${left}s`;
      if (left <= 0) {
        clearInterval(timer);
        download(new Blob([JSON.stringify(rec)], { type: 'application/json' }), `amostra-caneta-${Date.now()}.json`);
        rec = null;
        $('#tbRec').textContent = 'Gravar amostra';
      }
    }, 1000);
  };

  const info = (e, rate) => {
    $('#tbInfo').innerHTML = `Tipo: <b>${e.pointerType}</b> · Pressão: <b>${e.pressure.toFixed(2)}</b> · Inclinação: <b>${e.tiltX}°/${e.tiltY}°</b>
      · Botões: <b>${e.buttons}</b> · Taxa: <b>${rate} Hz</b>`;
  };
  const verdict = () => {
    let html = '';
    if (seen.types.has('pen') && seen.pressures.size > 3) html = `<span class="ok">✓ Caneta reconhecida com pressão (Windows Ink ativo).</span>`;
    else if (seen.types.has('pen')) html = `<span class="warn">Caneta reconhecida, mas a pressão não varia. Aperte com mais e menos força; se continuar igual, ative o Windows Ink.</span>`;
    else if (seen.types.has('mouse')) html = `<span class="warn">Chegou como <b>mouse</b>. Se você está usando a caneta, o Windows Ink está desligado no driver da Wacom (veja abaixo).</span>`;
    else if (seen.types.has('touch')) html = `<span>Toque com o dedo reconhecido.</span>`;
    if (seen.barrel) html += `<br><span class="ok">✓ Botão lateral detectado.</span>`;
    if (seen.eraser) html += `<br><span class="ok">✓ Ponta-borracha detectada.</span>`;
    $('#tbVerdict').innerHTML = html;
  };
  const local = e => { const r = pad.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const pr = e => e.pointerType === 'pen' && e.pressure > 0 ? Math.min(1, Math.pow(e.pressure, cfg.gamma)) : 0.5;

  const feed = e => {
    const { x, y } = local(e);
    if (rec) rec.events.push([Math.round(e.timeStamp * 100) / 100, e.type[7] || 'm', +x.toFixed(2), +y.toFixed(2), +e.pressure.toFixed(4), e.tiltX, e.tiltY, e.buttons, e.pointerType[0]]);
    if (e.buttons & 32) { g.clearRect(x - 12, y - 12, 24, 24); return; }
    if ($('#tbRaw').checked) {
      g.strokeStyle = 'rgba(232,18,36,.45)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(lastR ? lastR.x : x, lastR ? lastR.y : y); g.lineTo(x, y); g.stroke();
    }
    lastR = { x, y };
    const f = stab.push(x, y, pr(e), e.timeStamp);
    if (!f) return;
    g.strokeStyle = e.pointerType === 'pen' && (e.buttons & 2) ? '#0078d4' : '#1b1b1b';
    g.lineWidth = cfg.pressure && e.pointerType === 'pen' ? 3.2 * (0.3 + 1.1 * f.p) : 3.2;
    g.beginPath(); g.moveTo(lastF ? lastF.x : f.x, lastF ? lastF.y : f.y); g.lineTo(f.x, f.y); g.stroke();
    lastF = f;
  };

  pad.addEventListener('pointerdown', e => {
    try { pad.setPointerCapture(e.pointerId); } catch {}
    stab = createStabilizer(cfg); lastF = lastR = null;
    seen.types.add(e.pointerType);
    if (e.pointerType === 'pen' && (e.button === 2 || e.buttons & 2)) seen.barrel = true;
    if (e.pointerType === 'pen' && (e.button === 5 || e.buttons & 32)) seen.eraser = true;
    feed(e);
    verdict();
  });
  pad.addEventListener('pointermove', e => {
    const now = performance.now();
    const evs = e.getCoalescedEvents?.() || [];
    for (let i = 0; i < Math.max(1, evs.length); i++) samples.push(now);
    samples = samples.filter(t => now - t < 1000);
    info(e, samples.length);
    if (!e.buttons || !stab) { if (rec) rec.events.push([Math.round(e.timeStamp * 100) / 100, 'h', 0, 0, 0, 0, 0, 0, e.pointerType[0]]); return; }
    seen.types.add(e.pointerType);
    if (e.pointerType === 'pen') {
      seen.pressures.add(Math.round(e.pressure * 50));
      if (e.buttons & 2) seen.barrel = true;
      if (e.buttons & 32) seen.eraser = true;
    }
    for (const ce of evs.length ? evs : [e]) feed(ce);
    verdict();
  });
  pad.addEventListener('pointercancel', () => { stab = null; });
  pad.addEventListener('pointerup', e => {
    if (stab) { const f = stab.end(); if (f && lastF) { g.beginPath(); g.moveTo(lastF.x, lastF.y); g.lineTo(f.x, f.y); g.stroke(); } }
    if (rec) rec.events.push([Math.round(e.timeStamp * 100) / 100, 'u', 0, 0, 0, 0, 0, 0, e.pointerType[0]]);
    stab = null;
  });
  pad.addEventListener('contextmenu', e => e.preventDefault());
  d.showModal();
}
