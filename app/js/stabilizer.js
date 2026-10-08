// Estabilização do traço em camadas independentes (cada uma liga/desliga no painel Caneta e escrita)
//   1. filtro One Euro de posição (passa-baixa adaptativo: suaviza devagar, quase nada rápido)
//   2. fio puxado (lazy brush): a tinta segue a caneta presa a um fio de N px
//   3. filtro de pressão por constante de tempo + zona morta no início
// Tudo em px de TELA, para o efeito não mudar com o zoom.

export const LEVELS = {
  leve: { min: 2.6, beta: 0.022 },
  media: { min: 1.3, beta: 0.013 },
  forte: { min: 0.6, beta: 0.007 },
};

export function createStabilizer(t) {
  const lv = LEVELS[t.stabLevel] || LEVELS.leve;
  let e = null, dv = 0, te = 0;          // One Euro
  let tip = null;                        // fio puxado
  let pf = null, tp = 0, t0 = null;      // pressão
  const raw = [];                        // últimos pontos crus (para o fim do traço)

  return {
    // devolve {x, y, p} filtrado, ou null quando o fio puxado ainda não se moveu
    push(x, y, p, time) {
      if (t0 === null) { t0 = time; tp = time; }
      raw.push(x, y);
      if (raw.length > 6) raw.splice(0, 2);

      if (t.pfilter) {
        if (pf === null) pf = Math.max(p, 0.3);
        else if (!(time - t0 < 8 && p < 0.15)) {
          const dt = Math.max(0.5, time - tp);
          pf += (1 - Math.exp(-dt / 28)) * (p - pf);
        }
        tp = time;
        p = pf;
      }

      if (t.stab) {
        if (!e) { e = { x, y }; te = time; }
        else {
          const dt = Math.max(1, time - te) / 1000;
          te = time;
          const a = fc => { const r = 2 * Math.PI * fc * dt; return r / (r + 1); };
          const v = Math.hypot(x - e.x, y - e.y) / dt;
          dv += a(1) * (v - dv);
          const al = a(lv.min + lv.beta * dv);
          e = { x: e.x + al * (x - e.x), y: e.y + al * (y - e.y) };
        }
        x = e.x; y = e.y;
      }

      if (t.lazy) {
        if (!tip) tip = { x, y };
        else {
          const d = Math.hypot(x - tip.x, y - tip.y), R = t.lazyLen;
          if (d <= R) return null;
          const k = (d - R) / d;
          tip = { x: tip.x + (x - tip.x) * k, y: tip.y + (y - tip.y) * k };
        }
        x = tip.x; y = tip.y;
      }
      return { x, y, p };
    },
    // ponto final para a tinta "alcançar" a caneta (média dos últimos pontos crus)
    end() {
      if (!(t.stab || t.lazy) || raw.length < 2) return null;
      let sx = 0, sy = 0;
      for (let i = 0; i < raw.length; i += 2) { sx += raw[i]; sy += raw[i + 1]; }
      return { x: sx / (raw.length / 2), y: sy / (raw.length / 2), p: pf ?? 0.5 };
    },
  };
}

// Reamostra [x,y,p,...] em espaçamento uniforme `sp` (unidades de mundo)
export function resample(pts, sp) {
  const n = pts.length / 3;
  if (n < 2) return pts.slice();
  const out = [pts[0], pts[1], pts[2]];
  let carry = 0;
  for (let i = 1; i < n; i++) {
    const ax = pts[i * 3 - 3], ay = pts[i * 3 - 2], ap = pts[i * 3 - 1];
    const bx = pts[i * 3], by = pts[i * 3 + 1], bp = pts[i * 3 + 2];
    const d = Math.hypot(bx - ax, by - ay);
    let s = sp - carry;
    while (s <= d) {
      const k = s / d;
      out.push(ax + (bx - ax) * k, ay + (by - ay) * k, ap + (bp - ap) * k);
      s += sp;
    }
    carry = d - (s - sp);
  }
  const lx = pts[n * 3 - 3], ly = pts[n * 3 - 2];
  const m = out.length;
  if (Math.hypot(lx - out[m - 3], ly - out[m - 2]) > sp * 0.25) out.push(lx, ly, pts[n * 3 - 1]);
  return out;
}

// Média ponderada (1,2,3,2,1) em x, y e p; extremos fixos; mantém a contagem de pontos
export function average(pts, passes = 2) {
  let a = pts;
  const n = a.length / 3;
  if (n < 5) return a.slice();
  for (let k = 0; k < passes; k++) {
    const b = a.slice();
    for (let i = 2; i < n - 2; i++)
      for (let c = 0; c < 3; c++)
        b[i * 3 + c] = (a[(i - 2) * 3 + c] + 2 * a[(i - 1) * 3 + c] + 3 * a[i * 3 + c] + 2 * a[(i + 1) * 3 + c] + a[(i + 2) * 3 + c]) / 9;
    // vizinhos dos extremos: média curta
    for (const i of [1, n - 2])
      for (let c = 0; c < 3; c++) b[i * 3 + c] = (a[(i - 1) * 3 + c] + 2 * a[i * 3 + c] + a[(i + 1) * 3 + c]) / 4;
    a = b;
  }
  return a;
}

// Suavização ao soltar a caneta: reamostra e aplica a média
export function smoothPts(pts, sp, passes = 2) {
  if (pts.length / 3 < 4) return pts;
  return average(resample(pts, sp), passes);
}

// Reamostra [x,y,p,...] para exatamente n pontos, pela fração do comprimento
export function resampleN(pts, n) {
  const m = pts.length / 3;
  if (m < 2 || n < 2) return pts.slice(0, n * 3);
  const L = [0];
  for (let i = 1; i < m; i++) L.push(L[i - 1] + Math.hypot(pts[i * 3] - pts[i * 3 - 3], pts[i * 3 + 1] - pts[i * 3 - 2]));
  const total = L[m - 1] || 1, out = new Array(n * 3);
  let j = 1;
  for (let k = 0; k < n; k++) {
    const t = total * k / (n - 1);
    while (j < m - 1 && L[j] < t) j++;
    const a = L[j - 1], b = L[j], f = b > a ? (t - a) / (b - a) : 0;
    for (let c = 0; c < 3; c++) out[k * 3 + c] = pts[(j - 1) * 3 + c] + (pts[j * 3 + c] - pts[(j - 1) * 3 + c]) * f;
  }
  return out;
}
