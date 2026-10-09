// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
import { T, head } from './base.js';

// Utilidades locais (desenho próprio): f arredonda; pt dá um ponto no círculo (ângulo em graus, horário na tela).
const f = n => +n.toFixed(1);
const pt = (cx, cy, r, a) => [f(cx + r * Math.cos(a * Math.PI / 180)), f(cy + r * Math.sin(a * Math.PI / 180))];
// seta reta de (x0,y0) até a ponta (x1,y1); w = espessura opcional
const seta = (x0, y0, x1, y1, L = 14, w = '') => {
  const a = Math.atan2(y1 - y0, x1 - x0);
  return `<path${w ? ` stroke-width="${w}"` : ''} d="M${x0},${y0} L${f(x1 - 0.75 * L * Math.cos(a))},${f(y1 - 0.75 * L * Math.sin(a))}"/>` + head(x1, y1, f(a * 180 / Math.PI), L);
};
// arco de a0 até a1 (graus) com ponta em a1 (a1 > a0 = horário); ambas = ponta nas duas extremidades
const arco = (cx, cy, r, a0, a1, L = 14, ambas = false) => {
  const d = a1 > a0 ? 1 : -1, c = (0.75 * L / r) * 180 / Math.PI * d;
  const b0 = ambas ? a0 + c : a0, b1 = a1 - c;
  const [x0, y0] = pt(cx, cy, r, b0), [x1, y1] = pt(cx, cy, r, b1);
  const ponta = (aT, aE) => { const [xt, yt] = pt(cx, cy, r, aT), [xe, ye] = pt(cx, cy, r, aE); return head(xt, yt, f(Math.atan2(yt - ye, xt - xe) * 180 / Math.PI), L); };
  return `<path d="M${x0},${y0} A${r},${r} 0 ${Math.abs(b1 - b0) > 180 ? 1 : 0},${d > 0 ? 1 : 0} ${x1},${y1}"/>` + ponta(a1, b1) + (ambas ? ponta(a0, b0) : '');
};
// ciclo de n etapas: n arcos com ponta, separados por vãos de `vao` graus
const ciclo = (cx, cy, r, n, vao, L = 15) => { let s = ''; for (let i = 0; i < n; i++) { const a = -90 + 360 * i / n; s += arco(cx, cy, r, a + vao, a + 360 / n - vao, L); } return `<g stroke-width="3">${s}</g>`; };
// contorno serrilhado (explosão): n pontas, raios alternados, achatado por sx/sy; troca = {índice: [x, y]} (bico do balão)
const serra = (cx, cy, R, r, n, sx = 1, sy = 1, troca = {}) => 'M' + Array.from({ length: 2 * n }, (_, i) => {
  if (troca[i]) return troca[i].join(',');
  const a = (-90 + 180 * i / n) * Math.PI / 180, q = i % 2 ? r : R * (i % 4 ? 0.88 : 1);
  return `${f(cx + q * sx * Math.cos(a))},${f(cy + q * sy * Math.sin(a))}`;
}).join(' L') + ' Z';
const espiral = (() => {
  const p = []; for (let t = 0; t <= 4.8 * Math.PI; t += 0.15) { const r = 4 + 42 * t / (4.8 * Math.PI); p.push([f(55 + r * Math.cos(t)), f(55 + r * Math.sin(t))]); }
  const [xt, yt] = p[p.length - 1], [xa, ya] = p[p.length - 3];
  return `<path d="M${p.slice(0, -2).map(q => q.join(',')).join(' L')}"/>` + head(xt, yt, f(Math.atan2(yt - ya, xt - xa) * 180 / Math.PI), 14);
})();
const cLarga = (r, a) => pt(56, 58, r, a).join(',');

// Setas de bloco e setas/conectores. Desenho próprio do Giz Livre.
export default {
  id: 'setas', nome: 'Setas e conectores',
  secoes: [
    ['Setas de bloco', [
      ['st-bloco', 'Seta larga', 130, 70, '<path d="M4 22 H80 V4 L126 35 L80 66 V48 H4 Z"/>'],
      ['st-bloco2', 'Seta larga dupla', 140, 70, '<path d="M4 35 L46 4 V22 H94 V4 L136 35 L94 66 V48 H46 V66 Z"/>'],
      ['st-cima', 'Seta para cima', 70, 120, '<path d="M22 116 V44 H4 L35 4 L66 44 H48 V116 Z"/>'],
      ['st-curvalarga', 'Seta curva larga', 140, 110, '<path d="M4 106 A92 92 0 0 1 96 14 V4 L136 28 L96 52 V42 A64 64 0 0 0 32 106 Z"/>'],
      ['st-U', 'Seta em U', 120, 110, '<path d="M4 106 V50 A46 46 0 0 1 96 50 V74 H112 L84 106 L56 74 H72 V50 A22 22 0 0 0 28 50 V106 Z"/>'],
      ['st-chevron', 'Divisa (chevron)', 110, 70, '<path d="M4 4 H76 L106 35 L76 66 H4 L34 35 Z"/>'],
      ['st-entalhada', 'Seta entalhada', 130, 70, '<path d="M4 22 H80 V4 L126 35 L80 66 V48 H4 L16 35 Z"/>'],
      ['st-pentagono', 'Etapa (pentágono)', 130, 70, '<path d="M4 4 H96 L126 35 L96 66 H4 Z"/>'],
      ['st-baixo', 'Seta para baixo', 70, 120, '<path d="M22 4 V76 H4 L35 116 L66 76 H48 V4 Z"/>'],
      ['st-esquerda', 'Seta larga para a esquerda', 130, 70, '<path d="M126 22 H50 V4 L4 35 L50 66 V48 H126 Z"/>'],
      ['st-vert-dupla', 'Seta larga vertical dupla', 70, 140, '<path d="M35 4 L66 46 H48 V94 H66 L35 136 L4 94 H22 V46 H4 Z"/>'],
      ['st-quatro', 'Seta em quatro sentidos', 130, 130, '<path d="M65 4 L87 30 H74 V56 H100 V43 L126 65 L100 87 V74 H74 V100 H87 L65 126 L43 100 H56 V74 H30 V87 L4 65 L30 43 V56 H56 V30 H43 Z"/>'],
      ['st-bloco-L', 'Seta larga em L', 120, 120, '<path d="M6 4 H32 V74 H82 V58 L114 87 L82 116 V100 H6 Z"/>'],
      ['st-bloco-T', 'Seta larga em T (divide)', 160, 100, '<path d="M68 96 V52 H40 V68 L6 40 L40 12 V28 H120 V12 L154 40 L120 68 V52 H92 V96 Z"/>'],
      ['st-listrada', 'Seta listrada', 150, 70, '<rect x="4" y="22" width="6" height="26"/><rect x="16" y="22" width="8" height="26"/><path d="M30 22 H96 V4 L146 35 L96 66 V48 H30 Z"/>'],
      ['st-circ-larga', 'Seta circular larga', 112, 112, `<path d="M${cLarga(44, 0)} A44,44 0 1,1 ${cLarga(44, 250)} L${cLarga(56, 250)} L${cLarga(36, 298)} L${cLarga(16, 250)} L${cLarga(28, 250)} A28,28 0 1,0 ${cLarga(28, 0)} Z"/>`],
    ]],
    ['Setas curvas e circulares', [
      ['st-arco', 'Seta em arco', 140, 72, arco(70, 66, 58, 180, 360, 16)],
      ['st-arco-duplo', 'Seta em arco dupla', 140, 72, arco(70, 66, 58, 180, 360, 16, true)],
      ['st-onda', 'Seta ondulada', 140, 40, `<path d="M6 20 Q14 6 22 20 T38 20 T54 20 T70 20 T86 20 T102 20 H118"/>${head(134, 20, 0, 18)}`],
      ['st-zigue', 'Seta em zigue-zague', 130, 52, `<path d="M6 42 L34 12 L62 42 L90 12 L113 37"/>${head(124, 48, 45, 16)}`],
      ['st-S', 'Seta em S (sigmoide)', 130, 100, `<path d="M8 86 C52 86 70 14 104 14"/>${head(120, 14, 0, 16)}`],
      ['st-espiral', 'Seta em espiral', 110, 110, espiral],
      ['st-renova', 'Duas setas em círculo (renovação)', 90, 90, `<g stroke-width="3">${arco(45, 45, 32, 200, 330, 15)}${arco(45, 45, 32, 20, 150, 15)}</g>`],
    ]],
    ['Ciclos e etapas', [
      ['st-ciclo3', 'Ciclo de 3 etapas', 150, 150, ciclo(75, 75, 58, 3, 18)],
      ['st-ciclo4', 'Ciclo de 4 etapas', 150, 150, ciclo(75, 75, 58, 4, 14)],
      ['st-ciclo5', 'Ciclo de 5 etapas', 160, 160, ciclo(80, 80, 62, 5, 11)],
      ['st-ciclo3-nos', 'Ciclo de 3 etapas (com círculos)', 170, 150, `<circle cx="85" cy="30" r="22"/><circle cx="135.2" cy="117" r="22"/><circle cx="34.8" cy="117" r="22"/>${arco(85, 88, 58, -63, 3, 13)}${arco(85, 88, 58, 57, 123, 13)}${arco(85, 88, 58, 177, 243, 13)}`],
      ['st-ciclo4-caixas', 'Ciclo de 4 etapas (com caixas)', 200, 150, '<rect x="72" y="6" width="56" height="30" rx="4"/><rect x="138" y="60" width="56" height="30" rx="4"/><rect x="72" y="114" width="56" height="30" rx="4"/><rect x="6" y="60" width="56" height="30" rx="4"/><path d="M128 21 H166 V48 M166 90 V129 H140 M72 129 H34 V102 M34 60 V21 H60"/>' + head(166, 59, 90, 13) + head(129, 129, 180, 13) + head(34, 91, -90, 13) + head(71, 21, 0, 13)],
      ['st-processo3', 'Processo em 3 etapas (divisas)', 230, 60, '<path d="M4 4 H64 L86 30 L64 56 H4 Z M76 4 H138 L160 30 L138 56 H76 L98 30 Z M150 4 H204 L226 30 L204 56 H150 L172 30 Z"/>'],
      ['st-etapas-linha', 'Etapas em linha (□ → □ → □)', 250, 50, '<rect x="4" y="8" width="50" height="34" rx="3"/><rect x="100" y="8" width="50" height="34" rx="3"/><rect x="196" y="8" width="50" height="34" rx="3"/>' + seta(56, 25, 98, 25, 12) + seta(152, 25, 194, 25, 12)],
      ['st-etapas-coluna', 'Etapas em coluna (↓)', 80, 200, '<rect x="5" y="4" width="70" height="34" rx="3"/><rect x="5" y="82" width="70" height="34" rx="3"/><rect x="5" y="160" width="70" height="34" rx="3"/>' + seta(40, 40, 40, 80, 12) + seta(40, 118, 40, 158, 12)],
      ['st-realim', 'Bloco com realimentação', 180, 110, '<rect x="60" y="14" width="60" height="40" rx="3"/><path d="M120 34 H160 M140 34 V92 H30 V50"/><circle cx="140" cy="34" r="3" fill="#C"/>' + seta(6, 34, 59, 34, 13) + head(174, 34, 0, 13) + head(30, 37, -90, 12)],
      ['st-escada', 'Escada de progresso', 150, 110, '<path d="M6 104 H46 V74 H86 V44 H126 V14 H144 V104 Z"/>' + seta(8, 62, 112, 5.5, 14)],
    ]],
    ['Divergentes e convergentes', [
      ['st-divide3', 'Divide (1 → 3)', 120, 110, '<path d="M8 55 H50"/>' + seta(50, 55, 104, 6, 14) + seta(50, 55, 112, 55, 14) + seta(50, 55, 104, 104, 14)],
      ['st-junta3', 'Junta (3 → 1)', 120, 110, '<path d="M8 8 L50 55 L8 102 M8 55 H50"/>' + seta(50, 55, 112, 55, 14)],
      ['st-radial4', 'Irradiação (4 setas)', 120, 120, '<circle cx="60" cy="60" r="12"/>' + [0, 90, 180, 270].map(a => seta(...pt(60, 60, 19, a), ...pt(60, 60, 55, a), 14)).join('')],
      ['st-radial8', 'Irradiação (8 setas)', 130, 130, '<circle cx="65" cy="65" r="11"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map(a => seta(...pt(65, 65, 17, a), ...pt(65, 65, 59, a), 13)).join('')],
      ['st-converge4', 'Convergência (4 setas)', 120, 120, '<circle cx="60" cy="60" r="9"/>' + [45, 135, 225, 315].map(a => seta(...pt(60, 60, 76, a), ...pt(60, 60, 15, a), 14)).join('')],
      ['st-ramifica', 'Ramificação em T', 140, 90, '<path d="M70 6 V40 M20 40 H120"/>' + seta(20, 40, 20, 84, 14) + seta(120, 40, 120, 84, 14)],
      ['st-ida-volta', 'Ida e volta (⇄)', 120, 50, seta(8, 16, 112, 16, 14) + seta(112, 34, 8, 34, 14)],
      ['st-encontro', 'Setas que se encontram (→ ←)', 140, 30, seta(6, 15, 64, 15, 14) + seta(134, 15, 76, 15, 14)],
      ['st-afastam', 'Setas que se afastam (← →)', 140, 30, seta(62, 15, 6, 15, 14) + seta(78, 15, 134, 15, 14)],
      ['st-cruzadas', 'Setas cruzadas (troca)', 120, 90, seta(8, 8, 112, 82, 14) + seta(8, 82, 112, 8, 14)],
    ]],
    ['Reações e equilíbrio', [
      ['st-eq-direita', 'Equilíbrio deslocado à direita', 130, 50, '<path d="M8 18 H122 L108 8 M90 32 H40 L54 42"/>'],
      ['st-eq-esquerda', 'Equilíbrio deslocado à esquerda', 130, 50, '<path d="M40 18 H90 L76 8 M122 32 H8 L22 42"/>'],
      ['st-calor', 'Reação com aquecimento (Δ)', 130, 60, seta(8, 42, 124, 42, 16) + T(64, 20, 'Δ', 24)],
      ['st-catalisador', 'Reação com catalisador', 130, 60, seta(8, 42, 124, 42, 16) + T(64, 20, 'cat.', 18)],
      ['st-luz', 'Reação com luz (hν)', 130, 60, seta(8, 42, 124, 42, 16) + T(64, 20, 'hν', 22)],
      ['st-condicoes', 'Seta com condições (acima e abaixo)', 140, 70, '<path stroke-width="1.6" stroke-dasharray="5 4" d="M26 14 H110 M26 58 H110"/>' + seta(8, 36, 134, 36, 16)],
      ['st-nao-ocorre', 'Não ocorre (seta cortada)', 120, 40, seta(8, 20, 114, 20, 16) + '<path stroke-width="3" d="M50 34 L66 6"/>'],
      ['st-gas', 'Desprendimento de gás (↑)', 30, 70, seta(15, 64, 15, 6, 16)],
      ['st-precipitado', 'Precipitado (↓)', 30, 70, seta(15, 6, 15, 64, 16)],
    ]],
    ['Chaves, colchetes e destaques', [
      ['st-chave-fecha', 'Chave (fecha)', 40, 120, '<path d="M10 4 Q26 4 24 22 V48 Q24 60 36 60 Q24 60 24 72 V98 Q26 116 10 116"/>'],
      ['st-colchete-fecha', 'Colchete (fecha)', 30, 120, '<path d="M6 4 H24 V116 H6"/>'],
      ['st-chave-baixo', 'Chave horizontal (abaixo)', 160, 40, '<path d="M4 6 Q4 18 20 18 H68 Q80 18 80 34 Q80 18 92 18 H140 Q156 18 156 6"/>'],
      ['st-chave-cima', 'Chave horizontal (acima)', 160, 40, '<path d="M4 34 Q4 22 20 22 H68 Q80 22 80 6 Q80 22 92 22 H140 Q156 22 156 34"/>'],
      ['st-colchete-baixo', 'Colchete horizontal', 160, 30, '<path d="M4 6 V24 H156 V6"/>'],
      ['st-parenteses', 'Parênteses grandes', 120, 120, '<path d="M24 6 Q4 60 24 114 M96 6 Q116 60 96 114"/>'],
      ['st-contorno', 'Contorno de destaque (oval)', 150, 80, '<path d="M30 16 C70 2 140 10 144 38 C148 64 100 76 64 74 C24 72 4 58 6 40 C8 24 30 12 62 9"/>'],
      ['st-sublinhado', 'Sublinhado ondulado', 150, 24, '<path d="M6 12 Q10.5 4 15 12 T24 12 T33 12 T42 12 T51 12 T60 12 T69 12 T78 12 T87 12 T96 12 T105 12 T114 12 T123 12 T132 12 T141 12"/>'],
      ['st-explosao', 'Explosão (destaque)', 120, 100, `<path d="${serra(60, 50, 46, 30, 12, 1.2, 1)}"/>`],
      ['st-indicadora', 'Seta indicadora (diagonal)', 80, 80, seta(72, 8, 10, 70, 22, 5)],
    ]],
    ['Balões e chamadas', [
      ['st-balao-oval', 'Balão oval de fala', 120, 90, '<path d="M36 61 C14 55 4 45 4 34 C4 17 30 4 60 4 C90 4 116 17 116 34 C116 51 90 64 60 64 C56 64 52 64 48 63 L28 86 Z"/>'],
      ['st-balao-grito', 'Balão de grito', 130, 100, `<path d="${serra(66, 44, 44, 32, 11, 1.32, 0.92, { 14: [24, 96] })}"/>`],
      ['st-balao-sussurro', 'Balão de sussurro (tracejado)', 100, 80, '<path stroke-dasharray="6 5" d="M16 6 H84 Q94 6 94 16 V46 Q94 56 84 56 H44 L24 74 L30 56 H16 Q6 56 6 46 V16 Q6 6 16 6 Z"/>'],
      ['st-balao-ret', 'Balão retangular com bico', 120, 80, '<path d="M4 4 H116 V56 H44 L26 76 L30 56 H4 Z"/>'],
      ['st-chamada', 'Chamada com linha (legenda)', 150, 70, '<rect x="60" y="6" width="86" height="40" rx="4"/><path stroke-width="1.8" d="M60 30 L14 62"/><circle cx="14" cy="62" r="4" fill="#C"/>'],
      ['st-chamada-seta', 'Chamada com seta', 150, 70, '<rect x="60" y="6" width="86" height="40" rx="4"/>' + seta(60, 32, 10, 64, 14, 2)],
    ]],
    ['Setas e conectores', [
      ['st-simples', 'Seta simples', 120, 30, `<path d="M6 15 H102"/>${head(116, 15, 0, 16)}`],
      ['st-dupla', 'Seta dupla (↔)', 140, 30, `<path d="M20 15 H120"/>${head(4, 15, 180, 16)}${head(136, 15, 0, 16)}`],
      ['st-implica', 'Seta dupla (⇒)', 120, 40, '<path d="M6 13 H100 M6 27 H100 M90 4 L114 20 L90 36"/>'],
      ['st-tracejada', 'Seta tracejada', 120, 30, `<path d="M6 15 H102" stroke-dasharray="8 6"/>${head(116, 15, 0, 16)}`],
      ['st-curva', 'Seta curva', 120, 90, `<path d="M8 82 Q20 14 104 22"/>${head(118, 23, 3, 16)}`],
      ['st-retorno', 'Seta de retorno', 110, 90, `<path d="M100 20 H40 A30 30 0 0 0 40 80 H88"/>${head(104, 80, 0, 16)}`],
      ['st-ciclo', 'Ciclo', 100, 100, `<path d="M86 38 A38 38 0 1 0 79 75"/>${head(86, 62, -72, 16)}`],
      ['st-L', 'Seta em L', 110, 90, `<path d="M8 8 V74 H90"/>${head(104, 74, 0, 16)}`],
      ['st-cotovelo', 'Cotovelo duplo', 120, 90, `<path d="M6 16 H56 V74 H98"/>${head(114, 74, 0, 16)}`],
      ['st-divide', 'Divide (1 → 2)', 120, 100, `<path d="M8 50 H50 L92 16 M50 50 L92 84"/>${head(104, 8, -40, 16)}${head(104, 92, 40, 16)}`],
      ['st-junta', 'Junta (2 → 1)', 120, 100, `<path d="M8 12 L50 50 L8 88 M50 50 H96"/>${head(110, 50, 0, 16)}`],
      ['st-equilibrio', 'Equilíbrio (⇌)', 120, 50, '<path d="M8 18 H112 L98 8 M112 32 H8 L22 42"/>'],
      ['st-reacao', 'Reação (→)', 120, 30, `<path d="M8 15 H100"/>${head(114, 15, 0, 16)}`],
      ['st-resson', 'Ressonância (↔)', 90, 30, `<path d="M18 15 H72"/>${head(4, 15, 180, 14)}${head(86, 15, 0, 14)}`],
      ['st-chave', 'Chave', 40, 120, '<path d="M30 4 Q14 4 16 22 V48 Q16 60 4 60 Q16 60 16 72 V98 Q14 116 30 116"/>'],
      ['st-colchete', 'Colchete', 30, 120, '<path d="M24 4 H6 V116 H24"/>'],
      ['st-cota', 'Cota (dimensão)', 160, 40, `<path d="M4 4 V36 M156 4 V36 M20 20 H140" stroke-width="1.8"/>${head(6, 20, 180, 14)}${head(154, 20, 0, 14)}`],
    ]],
  ],
};
