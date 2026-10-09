// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Catálogo de modelos de função para "Plotar função", por área do curso.
// Cada modelo: { id, nome, expr, params: [{ n, v, min, max, passo, desc }], x: [xmin, xmax], y?: [ymin, ymax],
//                eixoX, eixoY (rótulos com unidade), nota, anima? (parâmetro sugerido para animar) }
// A variável independente é sempre `x` na expressão; o rótulo do eixo diz o que ela é (t, d, C, T...).
// As expressões usam `*` explícito entre parâmetros para não depender da separação de palavras coladas.
// Compilar: compile(m.expr, { params: m.params }) (plot.js) — os valores `v` viram o padrão.

const P = (n, v, min, max, passo, desc) => ({ n, v, min, max, passo, desc });

export const AREAS = [
  {
    id: 'eletrica', nome: 'Elétrica',
    modelos: [
      { // v(t) = Vp·sen(ωt + φ), ω = 2πf
        id: 'senoide', nome: 'Tensão senoidal', expr: 'Vp*sen(2*pi*f*x/1000 + phi)',
        params: [P('Vp', 10, 0, 20, 0.5, 'tensão de pico (V)'), P('f', 60, 1, 120, 1, 'frequência (Hz)'), P('phi', 0, -3.14, 3.14, 0.05, 'fase φ (rad)')],
        x: [0, 50], y: [-12, 12], eixoX: 't (ms)', eixoY: 'v (V)', nota: 'v(t) = Vp·sen(ωt + φ), com ω = 2πf', anima: 'phi',
      },
      { // meia onda: v = Vp·sen(ωt) se sen > 0, senão 0  →  Vp·(sen + |sen|)/2
        id: 'meia-onda', nome: 'Retificador de meia onda', expr: 'Vp*(sen(2*pi*f*x/1000) + abs(sen(2*pi*f*x/1000)))/2',
        params: [P('Vp', 10, 0, 20, 0.5, 'tensão de pico (V)'), P('f', 60, 1, 120, 1, 'frequência (Hz)')],
        x: [0, 50], y: [-2, 12], eixoX: 't (ms)', eixoY: 'v (V)', nota: 'só o semiciclo positivo passa; Vmédio = Vp/π',
      },
      { // onda completa: v = Vp·|sen(ωt)|
        id: 'onda-completa', nome: 'Retificador de onda completa', expr: 'Vp*abs(sen(2*pi*f*x/1000))',
        params: [P('Vp', 10, 0, 20, 0.5, 'tensão de pico (V)'), P('f', 60, 1, 120, 1, 'frequência (Hz)')],
        x: [0, 50], y: [-2, 12], eixoX: 't (ms)', eixoY: 'v (V)', nota: 'v = Vp·|sen ωt|; Vmédio = 2Vp/π',
      },
      { // carga: vC(t) = V0·(1 − e^(−t/RC)); R em kΩ e C em µF → RC = R·C/1000 s
        id: 'rc-carga', nome: 'Carga do capacitor (RC)', expr: 'V0*(1 - exp(-1000*x/(R*C)))',
        params: [P('V0', 12, 1, 24, 0.5, 'tensão da fonte (V)'), P('R', 10, 1, 100, 1, 'resistência (kΩ)'), P('C', 100, 10, 1000, 10, 'capacitância (µF)')],
        x: [0, 5], y: [0, 14], eixoX: 't (s)', eixoY: 'vC (V)', nota: 'vC = V0(1 − e^(−t/τ)), τ = RC; 63 % em t = τ', anima: 'R',
      },
      { // descarga: vC(t) = V0·e^(−t/RC)
        id: 'rc-descarga', nome: 'Descarga do capacitor (RC)', expr: 'V0*exp(-1000*x/(R*C))',
        params: [P('V0', 12, 1, 24, 0.5, 'tensão inicial (V)'), P('R', 10, 1, 100, 1, 'resistência (kΩ)'), P('C', 100, 10, 1000, 10, 'capacitância (µF)')],
        x: [0, 5], y: [0, 14], eixoX: 't (s)', eixoY: 'vC (V)', nota: 'vC = V0·e^(−t/τ), τ = RC; 37 % em t = τ', anima: 'C',
      },
      { // i(t) = (V/R)·(1 − e^(−Rt/L))
        id: 'rl-corrente', nome: 'Corrente no circuito RL', expr: 'V/R*(1 - exp(-R*x/L))',
        params: [P('V', 12, 1, 24, 0.5, 'tensão da fonte (V)'), P('R', 10, 1, 100, 1, 'resistência (Ω)'), P('L', 0.5, 0.05, 2, 0.05, 'indutância (H)')],
        x: [0, 0.3], y: [0, 1.5], eixoX: 't (s)', eixoY: 'i (A)', nota: 'i = (V/R)(1 − e^(−t/τ)), τ = L/R', anima: 'L',
      },
      { // P = V²/R
        id: 'potencia-resistor', nome: 'Potência no resistor', expr: 'x^2/R',
        params: [P('R', 10, 1, 100, 1, 'resistência (Ω)')],
        x: [0, 24], y: [0, 60], eixoX: 'V (V)', eixoY: 'P (W)', nota: 'P = V²/R = R·I²', anima: 'R',
      },
      { // Xc = 1/(2πfC), C em µF
        id: 'reatancia-capacitiva', nome: 'Reatância capacitiva', expr: '1000000/(2*pi*x*C)',
        params: [P('C', 10, 1, 100, 1, 'capacitância (µF)')],
        x: [10, 1000], y: [0, 1700], eixoX: 'f (Hz)', eixoY: 'Xc (Ω)', nota: 'Xc = 1/(2πfC): cai com a frequência', anima: 'C',
      },
    ],
  },
  {
    id: 'saneamento', nome: 'Saneamento e Ambiental',
    modelos: [
      { // Lei de Chick: N = N0·e^(−k t)
        id: 'chick', nome: 'Desinfecção — lei de Chick', expr: 'N0*exp(-k*x)',
        params: [P('N0', 1000, 100, 10000, 100, 'organismos iniciais (NMP/100 mL)'), P('k', 0.2, 0.01, 1, 0.01, 'constante de inativação (1/min)')],
        x: [0, 30], y: [0, 1100], eixoX: 't (min)', eixoY: 'N (NMP/100 mL)', nota: 'ln(N/N0) = −k·t', anima: 'k',
      },
      { // Chick-Watson: ln(N/N0) = −k'·Cⁿ·t
        id: 'chick-watson', nome: 'Desinfecção — Chick-Watson', expr: 'N0*exp(-k*C^n*x)',
        params: [P('N0', 1000, 100, 10000, 100, 'organismos iniciais (NMP/100 mL)'), P('k', 0.1, 0.01, 1, 0.01, "letalidade k' (L/mg·min)"),
          P('C', 1, 0.1, 5, 0.1, 'concentração do desinfetante (mg/L)'), P('n', 1, 0.5, 2, 0.1, 'coeficiente de diluição')],
        x: [0, 30], y: [0, 1100], eixoX: 't (min)', eixoY: 'N (NMP/100 mL)', nota: "ln(N/N0) = −k'·Cⁿ·t; com n = 1 vale o conceito C·t", anima: 'C',
      },
      { // DBO exercida: y = L0·(1 − e^(−k t)), base e
        id: 'dbo', nome: 'DBO exercida', expr: 'L0*(1 - exp(-k*x))',
        params: [P('L0', 250, 50, 500, 10, 'DBO última (mg/L)'), P('k', 0.23, 0.05, 0.5, 0.01, 'constante de desoxigenação, base e (1/d)')],
        x: [0, 20], y: [0, 280], eixoX: 't (d)', eixoY: 'DBO (mg/L)', nota: 'y = L0(1 − e^(−kt)); DBO5 com k = 0,23/d ≈ 68 % de L0', anima: 'k',
      },
      { // Streeter-Phelps: D = k1·L0/(k2 − k1)·(e^(−k1 t) − e^(−k2 t)) + D0·e^(−k2 t)
        id: 'streeter-phelps-deficit', nome: 'Streeter-Phelps — déficit de OD',
        expr: 'k1*L0/(k2 - k1)*(exp(-k1*x) - exp(-k2*x)) + D0*exp(-k2*x)',
        params: [P('k1', 0.23, 0.05, 0.45, 0.01, 'desoxigenação (1/d)'), P('k2', 0.5, 0.5, 2, 0.01, 'reaeração (1/d), precisa ser ≠ k1'),
          P('L0', 20, 5, 50, 1, 'DBO última da mistura (mg/L)'), P('D0', 1, 0, 5, 0.1, 'déficit inicial (mg/L)')],
        x: [0, 15], y: [0, 8], eixoX: 't (d)', eixoY: 'D (mg/L)', nota: 'D = k1L0/(k2−k1)·(e^(−k1t) − e^(−k2t)) + D0e^(−k2t)', anima: 'k2',
      },
      { // OD = ODsat − D (curva "em colher" do oxigênio dissolvido)
        id: 'streeter-phelps-od', nome: 'Streeter-Phelps — oxigênio dissolvido',
        expr: 'ODs - (k1*L0/(k2 - k1)*(exp(-k1*x) - exp(-k2*x)) + D0*exp(-k2*x))',
        params: [P('ODs', 9.1, 6, 14, 0.1, 'OD de saturação (mg/L)'), P('k1', 0.23, 0.05, 0.45, 0.01, 'desoxigenação (1/d)'),
          P('k2', 0.5, 0.5, 2, 0.01, 'reaeração (1/d), precisa ser ≠ k1'), P('L0', 20, 5, 50, 1, 'DBO última da mistura (mg/L)'), P('D0', 1, 0, 5, 0.1, 'déficit inicial (mg/L)')],
        x: [0, 15], y: [0, 10], eixoX: 't (d)', eixoY: 'OD (mg/L)', nota: 'OD = ODsat − D; o ponto crítico é o mínimo da curva', anima: 'L0',
      },
      { // correção de temperatura: kT = k20·θ^(T − 20)
        id: 'correcao-temperatura', nome: 'Correção de k pela temperatura', expr: 'k20*th^(x - 20)',
        params: [P('k20', 0.23, 0.05, 0.5, 0.01, 'constante a 20 °C (1/d)'), P('th', 1.047, 1, 1.1, 0.001, 'coeficiente θ')],
        x: [0, 40], y: [0, 0.7], eixoX: 'T (°C)', eixoY: 'k (1/d)', nota: 'kT = k20·θ^(T−20); θ = 1,047 para DBO', anima: 'th',
      },
      { // Stokes: v = g·(ρp − ρw)·d²/(18μ); d em µm, v em mm/s
        id: 'stokes', nome: 'Sedimentação — lei de Stokes', expr: '9.81*(rp - rw)*x^2/(18*mu*1000000000)',
        params: [P('rp', 2650, 1050, 3000, 50, 'massa específica da partícula (kg/m³)'), P('rw', 1000, 990, 1000, 1, 'massa específica da água (kg/m³)'),
          P('mu', 0.001, 0.0005, 0.0018, 0.00005, 'viscosidade dinâmica (Pa·s)')],
        x: [0, 200], y: [0, 40], eixoX: 'd (µm)', eixoY: 'vs (mm/s)', nota: 'vs = g(ρp − ρw)d²/(18μ), válida para Re < 1', anima: 'rp',
      },
      { // Monod: μ = μmax·S/(Ks + S)
        id: 'monod', nome: 'Crescimento microbiano — Monod', expr: 'mumax*x/(Ks + x)',
        params: [P('mumax', 0.5, 0.1, 2, 0.05, 'taxa máxima de crescimento (1/h)'), P('Ks', 50, 5, 200, 5, 'constante de meia saturação (mg/L)')],
        x: [0, 500], y: [0, 0.6], eixoX: 'S (mg/L)', eixoY: 'μ (1/h)', nota: 'μ = μmax·S/(Ks + S); μ = μmax/2 quando S = Ks', anima: 'Ks',
      },
      { // projeção logística: P = K/(1 + ((K − P0)/P0)·e^(−r t))
        id: 'logistico', nome: 'Projeção populacional logística', expr: 'K/(1 + (K - P0)/P0*exp(-r*x))',
        params: [P('K', 100000, 20000, 500000, 5000, 'população de saturação (hab)'), P('P0', 10000, 1000, 50000, 1000, 'população inicial (hab)'),
          P('r', 0.08, 0.01, 0.3, 0.01, 'taxa de crescimento (1/ano)')],
        x: [0, 100], y: [0, 110000], eixoX: 't (anos)', eixoY: 'P (hab)', nota: 'P = K/(1 + ((K−P0)/P0)·e^(−rt)); inflexão em P = K/2', anima: 'r',
      },
    ],
  },
  {
    id: 'quimica', nome: 'Química',
    modelos: [
      { // 1ª ordem: C = C0·e^(−k t)
        id: 'ordem-1', nome: 'Cinética de 1ª ordem', expr: 'C0*exp(-k*x)',
        params: [P('C0', 100, 10, 200, 5, 'concentração inicial (mg/L)'), P('k', 0.1, 0.01, 1, 0.01, 'constante de velocidade (1/min)')],
        x: [0, 50], y: [0, 110], eixoX: 't (min)', eixoY: 'C (mg/L)', nota: 'ln(C/C0) = −kt; meia-vida = ln 2/k', anima: 'k',
      },
      { // 2ª ordem: 1/C = 1/C0 + k t  →  C = C0/(1 + k·C0·t)
        id: 'ordem-2', nome: 'Cinética de 2ª ordem', expr: 'C0/(1 + k*C0*x)',
        params: [P('C0', 100, 10, 200, 5, 'concentração inicial (mg/L)'), P('k', 0.001, 0.0001, 0.01, 0.0001, 'constante de velocidade (L/mg·min)')],
        x: [0, 50], y: [0, 110], eixoX: 't (min)', eixoY: 'C (mg/L)', nota: '1/C = 1/C0 + kt; meia-vida = 1/(k·C0)', anima: 'k',
      },
      { // ordem zero: C = C0 − k t
        id: 'ordem-0', nome: 'Cinética de ordem zero', expr: 'C0 - k*x',
        params: [P('C0', 100, 10, 200, 5, 'concentração inicial (mg/L)'), P('k', 2, 0.5, 10, 0.1, 'constante de velocidade (mg/L·min)')],
        x: [0, 50], y: [0, 110], eixoX: 't (min)', eixoY: 'C (mg/L)', nota: 'C = C0 − kt, válida até C = 0 (t = C0/k)', anima: 'k',
      },
      { // Arrhenius: k = A·e^(−Ea/RT)  →  k(T)/k(Tref) = e^(−(Ea/R)(1/T − 1/Tref))
        id: 'arrhenius', nome: 'Arrhenius (k relativo)', expr: 'exp(-Ea*1000/8.314*(1/x - 1/Tref))',
        params: [P('Ea', 50, 10, 120, 1, 'energia de ativação (kJ/mol)'), P('Tref', 293.15, 273.15, 323.15, 1, 'temperatura de referência (K)')],
        x: [273, 333], y: [0, 15], eixoX: 'T (K)', eixoY: 'k/kref', nota: 'k = A·e^(−Ea/RT), R = 8,314 J/(mol·K)', anima: 'Ea',
      },
      { // decaimento radioativo: N = N0·(1/2)^(t/t½)
        id: 'radioativo', nome: 'Decaimento radioativo', expr: 'N0*0.5^(x/T12)',
        params: [P('N0', 1000, 100, 10000, 100, 'núcleos (ou atividade) iniciais'), P('T12', 5730, 100, 20000, 10, 'meia-vida (anos); C-14 = 5730')],
        x: [0, 30000], y: [0, 1100], eixoX: 't (anos)', eixoY: 'N', nota: 'N = N0·(1/2)^(t/t½) = N0·e^(−λt), λ = ln 2/t½', anima: 'T12',
      },
      { // Michaelis-Menten: v = Vmax·S/(Km + S)
        id: 'michaelis-menten', nome: 'Michaelis-Menten', expr: 'Vmax*x/(Km + x)',
        params: [P('Vmax', 10, 1, 50, 1, 'velocidade máxima (µmol/min)'), P('Km', 2, 0.1, 10, 0.1, 'constante de Michaelis (mM)')],
        x: [0, 20], y: [0, 11], eixoX: '[S] (mM)', eixoY: 'v (µmol/min)', nota: 'v = Vmax·[S]/(Km + [S]); v = Vmax/2 em [S] = Km', anima: 'Km',
      },
      { // Henderson-Hasselbalch: pH = pKa + log([A−]/[HA]); x = fração α = [A−]/total
        id: 'henderson-hasselbalch', nome: 'Henderson-Hasselbalch', expr: 'pKa + log(x/(1 - x))',
        params: [P('pKa', 4.76, 2, 12, 0.01, 'pKa do ácido (acético = 4,76)')],
        x: [0.01, 0.99], y: [0, 14], eixoX: 'α = [A⁻]/Ctotal', eixoY: 'pH', nota: 'pH = pKa + log([A⁻]/[HA]); pH = pKa em α = 0,5', anima: 'pKa',
      },
      { // fração da base conjugada de ácido monoprótico: α1 = 1/(1 + 10^(pKa − pH))
        id: 'fracao-especies', nome: 'Fração de espécies × pH', expr: '1/(1 + 10^(pKa - x))',
        params: [P('pKa', 4.76, 2, 12, 0.01, 'pKa do ácido')],
        x: [0, 14], y: [-0.1, 1.1], eixoX: 'pH', eixoY: 'α(A⁻)', nota: 'α(A⁻) = Ka/(Ka + [H⁺]) = 1/(1 + 10^(pKa − pH))', anima: 'pKa',
      },
      { // Beer-Lambert: A = ε·b·C
        id: 'beer-lambert', nome: 'Lei de Beer-Lambert', expr: 'eps*b*x',
        params: [P('eps', 0.02, 0.001, 0.1, 0.001, 'absortividade (L/mg·cm)'), P('b', 1, 0.5, 5, 0.5, 'caminho óptico (cm)')],
        x: [0, 50], y: [0, 1.2], eixoX: 'C (mg/L)', eixoY: 'A', nota: 'A = ε·b·C; linear até A ≈ 1', anima: 'eps',
      },
    ],
  },
  {
    id: 'estatistica', nome: 'Estatística',
    modelos: [
      { // normal: f = 1/(σ√(2π))·e^(−(x − μ)²/(2σ²))
        id: 'normal', nome: 'Distribuição normal', expr: '1/(sigma*raiz(2*pi))*exp(-(x - mu)^2/(2*sigma^2))',
        params: [P('mu', 0, -5, 5, 0.1, 'média μ'), P('sigma', 1, 0.2, 3, 0.05, 'desvio-padrão σ')],
        x: [-5, 5], y: [0, 0.5], eixoX: 'x', eixoY: 'f(x)', nota: 'f = e^(−(x−μ)²/2σ²)/(σ√2π); 68 % entre μ ± σ', anima: 'sigma',
      },
      { // exponencial: f = λ·e^(−λx)
        id: 'exponencial', nome: 'Distribuição exponencial', expr: 'lambda*exp(-lambda*x)',
        params: [P('lambda', 1, 0.1, 3, 0.05, 'taxa λ (média = 1/λ)')],
        x: [0, 5], y: [0, 1.1], eixoX: 'x', eixoY: 'f(x)', nota: 'f = λe^(−λx), x ≥ 0', anima: 'lambda',
      },
      { // acumulada da exponencial: F = 1 − e^(−λx)
        id: 'exponencial-acumulada', nome: 'Exponencial acumulada', expr: '1 - exp(-lambda*x)',
        params: [P('lambda', 1, 0.1, 3, 0.05, 'taxa λ')],
        x: [0, 5], y: [0, 1.1], eixoX: 'x', eixoY: 'F(x)', nota: 'F = P(X ≤ x) = 1 − e^(−λx)', anima: 'lambda',
      },
      { // lognormal: f = 1/(xσ√(2π))·e^(−(ln x − μ)²/(2σ²))
        id: 'lognormal', nome: 'Distribuição lognormal', expr: '1/(x*sigma*raiz(2*pi))*exp(-(ln(x) - mu)^2/(2*sigma^2))',
        params: [P('mu', 0, -1, 2, 0.05, 'média de ln x'), P('sigma', 0.5, 0.1, 1.5, 0.05, 'desvio-padrão de ln x')],
        x: [0.01, 5], y: [0, 1], eixoX: 'x', eixoY: 'f(x)', nota: 'ln X é normal(μ, σ); moda = e^(μ − σ²)', anima: 'sigma',
      },
      { // Weibull: f = (k/λ)(x/λ)^(k−1)·e^(−(x/λ)^k)
        id: 'weibull', nome: 'Distribuição de Weibull', expr: 'k/lambda*(x/lambda)^(k - 1)*exp(-(x/lambda)^k)',
        params: [P('k', 1.5, 0.5, 5, 0.1, 'forma k'), P('lambda', 1, 0.2, 5, 0.1, 'escala λ')],
        x: [0.01, 4], y: [0, 1.2], eixoX: 'x', eixoY: 'f(x)', nota: 'k = 1 é a exponencial; k ≈ 2 descreve bem o vento', anima: 'k',
      },
      { // Gumbel (máximos): f = (1/β)·e^(−(z + e^(−z))), z = (x − μ)/β
        id: 'gumbel', nome: 'Gumbel (vazões máximas)', expr: '1/b*exp(-((x - mu)/b + exp(-(x - mu)/b)))',
        params: [P('mu', 100, 20, 200, 5, 'moda μ (m³/s)'), P('b', 30, 5, 80, 1, 'escala β (m³/s)')],
        x: [0, 300], y: [0, 0.014], eixoX: 'Q (m³/s)', eixoY: 'f(Q)', nota: 'f = (1/β)e^(−(z + e^(−z))), z = (Q − μ)/β', anima: 'b',
      },
    ],
  },
  {
    id: 'hidraulica', nome: 'Hidráulica e Hidrologia',
    modelos: [
      { // Horton: f = fc + (f0 − fc)·e^(−k t)
        id: 'horton', nome: 'Infiltração — Horton', expr: 'fc + (f0 - fc)*exp(-k*x)',
        params: [P('f0', 75, 20, 150, 1, 'capacidade inicial (mm/h)'), P('fc', 10, 1, 40, 1, 'capacidade final (mm/h)'), P('k', 4, 0.5, 10, 0.1, 'constante de decaimento (1/h)')],
        x: [0, 2], y: [0, 80], eixoX: 't (h)', eixoY: 'f (mm/h)', nota: 'f = fc + (f0 − fc)e^(−kt)', anima: 'k',
      },
      { // Manning: V = (1/n)·Rh^(2/3)·S^(1/2)
        id: 'manning', nome: 'Velocidade — Manning', expr: '1/n*x^(2/3)*raiz(S)',
        params: [P('n', 0.013, 0.01, 0.035, 0.001, 'rugosidade de Manning'), P('S', 0.001, 0.0001, 0.01, 0.0001, 'declividade (m/m)')],
        x: [0, 2], y: [0, 5], eixoX: 'Rh (m)', eixoY: 'V (m/s)', nota: 'V = (1/n)·Rh^(2/3)·S^(1/2), unidades SI', anima: 'n',
      },
      { // vertedor retangular sem contração (Francis): Q = 1,838·L·H^(3/2)
        id: 'vertedor-retangular', nome: 'Vertedor retangular (Francis)', expr: '1.838*L*x^(3/2)',
        params: [P('L', 1, 0.2, 5, 0.1, 'largura da soleira (m)')],
        x: [0, 0.5], y: [0, 0.8], eixoX: 'H (m)', eixoY: 'Q (m³/s)', nota: 'Q = 1,838·L·H^(3/2), sem contração lateral', anima: 'L',
      },
      { // vertedor triangular 90° (Thomson): Q = 1,4·H^(5/2)
        id: 'vertedor-triangular', nome: 'Vertedor triangular 90° (Thomson)', expr: 'Cq*x^(5/2)',
        params: [P('Cq', 1.4, 1.3, 1.5, 0.01, 'coeficiente (Thomson = 1,4)')],
        x: [0, 0.4], y: [0, 0.16], eixoX: 'H (m)', eixoY: 'Q (m³/s)', nota: 'Q = 1,4·H^(5/2) (SI)',
      },
      { // orifício (Torricelli): Q = Cd·A·√(2gh)
        id: 'orificio', nome: 'Vazão em orifício (Torricelli)', expr: 'Cd*A*raiz(2*9.81*x)',
        params: [P('Cd', 0.61, 0.5, 1, 0.01, 'coeficiente de descarga'), P('A', 0.01, 0.001, 0.05, 0.001, 'área do orifício (m²)')],
        x: [0, 5], y: [0, 0.07], eixoX: 'h (m)', eixoY: 'Q (m³/s)', nota: 'Q = Cd·A·√(2gh)', anima: 'Cd',
      },
      { // Darcy-Weisbach: hf = f·(L/D)·V²/(2g)
        id: 'darcy-weisbach', nome: 'Perda de carga — Darcy-Weisbach', expr: 'f*L/D*x^2/(2*9.81)',
        params: [P('f', 0.02, 0.008, 0.06, 0.001, 'fator de atrito'), P('L', 100, 10, 1000, 10, 'comprimento (m)'), P('D', 0.1, 0.025, 0.5, 0.005, 'diâmetro (m)')],
        x: [0, 3], y: [0, 10], eixoX: 'V (m/s)', eixoY: 'hf (m)', nota: 'hf = f(L/D)·V²/2g', anima: 'D',
      },
      { // Hazen-Williams: hf = 10,67·L·Q^1,852/(C^1,852·D^4,87)
        id: 'hazen-williams', nome: 'Perda de carga — Hazen-Williams', expr: '10.67*L*x^1.852/(C^1.852*D^4.87)',
        params: [P('C', 130, 80, 150, 5, 'coeficiente C'), P('D', 0.1, 0.05, 0.5, 0.005, 'diâmetro (m)'), P('L', 100, 10, 1000, 10, 'comprimento (m)')],
        x: [0, 0.03], y: [0, 16], eixoX: 'Q (m³/s)', eixoY: 'hf (m)', nota: 'hf = 10,67·L·Q^1,852/(C^1,852·D^4,87), SI', anima: 'C',
      },
      { // curva da bomba (aproximação parabólica): H = H0 − a·Q²
        id: 'curva-bomba', nome: 'Curva da bomba', expr: 'H0 - a*x^2',
        params: [P('H0', 40, 10, 80, 1, 'altura de shutoff (m)'), P('a', 5000, 500, 20000, 100, 'coeficiente (s²/m⁵)')],
        x: [0, 0.08], y: [0, 45], eixoX: 'Q (m³/s)', eixoY: 'H (m)', nota: 'H = H0 − a·Q²; o ponto de operação cruza a curva do sistema', anima: 'a',
      },
    ],
  },
  {
    id: 'matematica', nome: 'Matemática básica',
    modelos: [
      { id: 'reta', nome: 'Reta', expr: 'a*x + b',
        params: [P('a', 1, -5, 5, 0.1, 'coeficiente angular'), P('b', 0, -5, 5, 0.1, 'coeficiente linear')],
        x: [-5, 5], y: [-5, 5], eixoX: 'x', eixoY: 'y', nota: 'y = ax + b', anima: 'a' },
      { id: 'parabola', nome: 'Parábola', expr: 'a*x^2 + b*x + c',
        params: [P('a', 1, -3, 3, 0.1, 'abertura'), P('b', 0, -5, 5, 0.1, 'coeficiente b'), P('c', -4, -5, 5, 0.1, 'corte no eixo y')],
        x: [-5, 5], y: [-6, 6], eixoX: 'x', eixoY: 'y', nota: 'y = ax² + bx + c; vértice em x = −b/2a', anima: 'a' },
      { id: 'cubica', nome: 'Cúbica', expr: 'a*x^3 + b*x^2 + c*x + d',
        params: [P('a', 0.5, -2, 2, 0.1, 'coeficiente a'), P('b', 0, -3, 3, 0.1, 'coeficiente b'), P('c', -2, -5, 5, 0.1, 'coeficiente c'), P('d', 0, -5, 5, 0.1, 'coeficiente d')],
        x: [-4, 4], y: [-6, 6], eixoX: 'x', eixoY: 'y', nota: 'y = ax³ + bx² + cx + d', anima: 'c' },
      { id: 'exponencial-geral', nome: 'Exponencial', expr: 'a*b^x',
        params: [P('a', 1, 0.1, 5, 0.1, 'valor em x = 0'), P('b', 2, 0.1, 4, 0.05, 'base')],
        x: [-3, 3], y: [-1, 9], eixoX: 'x', eixoY: 'y', nota: 'y = a·bˣ; cresce se b > 1, decai se 0 < b < 1', anima: 'b' },
      { id: 'logaritmo', nome: 'Logaritmo', expr: 'a*ln(x) + b',
        params: [P('a', 1, -3, 3, 0.1, 'multiplicador'), P('b', 0, -3, 3, 0.1, 'deslocamento vertical')],
        x: [0.01, 8], y: [-5, 4], eixoX: 'x', eixoY: 'y', nota: 'y = a·ln x + b, só para x > 0', anima: 'a' },
      { id: 'senoide-geral', nome: 'Senoide (forma geral)', expr: 'A*sen(B*(x - C)) + D',
        params: [P('A', 1, -3, 3, 0.1, 'amplitude'), P('B', 1, 0.1, 5, 0.1, 'frequência angular (período 2π/B)'), P('C', 0, -3.14, 3.14, 0.05, 'deslocamento horizontal'), P('D', 0, -3, 3, 0.1, 'deslocamento vertical')],
        x: [-6.3, 6.3], y: [-4, 4], eixoX: 'x', eixoY: 'y', nota: 'y = A·sen(B(x − C)) + D', anima: 'C' },
      { id: 'hiperbole', nome: 'Hipérbole', expr: 'k/x',
        params: [P('k', 1, -5, 5, 0.1, 'constante')],
        x: [-5, 6], y: [-5, 5], eixoX: 'x', eixoY: 'y', nota: 'y = k/x: grandezas inversamente proporcionais', anima: 'k' },
      { id: 'modulo', nome: 'Módulo', expr: 'a*abs(x - h) + k',
        params: [P('a', 1, -3, 3, 0.1, 'inclinação dos ramos'), P('h', 0, -4, 4, 0.1, 'vértice em x'), P('k', 0, -4, 4, 0.1, 'vértice em y')],
        x: [-5, 5], y: [-5, 5], eixoX: 'x', eixoY: 'y', nota: 'y = a|x − h| + k', anima: 'h' },
    ],
  },
  {
    id: 'embarcados', nome: 'Embarcados e sinais',
    modelos: [
      { // quadrada ideal: A·sinal(sen(2πft))
        id: 'quadrada', nome: 'Onda quadrada', expr: 'A*sinal(sen(2*pi*f*x/1000))',
        params: [P('A', 5, 1, 12, 0.5, 'amplitude (V)'), P('f', 50, 1, 200, 1, 'frequência (Hz)')],
        x: [0, 50], y: [-7, 7], eixoX: 't (ms)', eixoY: 'v (V)', nota: 'v = A·sinal(sen 2πft)', anima: 'f',
      },
      { // série de Fourier da quadrada: (4A/π)·Σ sen(nωt)/n, n ímpar (4 termos)
        id: 'fourier-quadrada', nome: 'Quadrada por Fourier (4 harmônicos)',
        expr: '4*A/pi*(sen(2*pi*f*x/1000) + sen(6*pi*f*x/1000)/3 + sen(10*pi*f*x/1000)/5 + sen(14*pi*f*x/1000)/7)',
        params: [P('A', 5, 1, 12, 0.5, 'amplitude (V)'), P('f', 50, 1, 200, 1, 'frequência fundamental (Hz)')],
        x: [0, 50], y: [-8, 8], eixoX: 't (ms)', eixoY: 'v (V)', nota: 'v = (4A/π)·Σ sen(nωt)/n, n = 1, 3, 5, 7 (fenômeno de Gibbs)',
      },
      { // dente de serra: A·(ft − piso(ft))
        id: 'dente-serra', nome: 'Dente de serra', expr: 'A*(f*x/1000 - piso(f*x/1000))',
        params: [P('A', 5, 1, 12, 0.5, 'amplitude (V)'), P('f', 50, 1, 200, 1, 'frequência (Hz)')],
        x: [0, 50], y: [-1, 6], eixoX: 't (ms)', eixoY: 'v (V)', nota: 'v = A·(ft − ⌊ft⌋)', anima: 'f',
      },
      { // PWM: Vmédia = D·Vcc
        id: 'pwm', nome: 'Tensão média do PWM', expr: 'Vcc*x/100',
        params: [P('Vcc', 5, 3.3, 24, 0.1, 'tensão de alimentação (V)')],
        x: [0, 100], y: [0, 6], eixoX: 'D (%)', eixoY: 'Vmédia (V)', nota: 'Vmédia = D·Vcc', anima: 'Vcc',
      },
      { // quantização do ADC: Vq = (Vref/2ⁿ)·⌊Vin·2ⁿ/Vref⌋
        id: 'adc', nome: 'Quantização do ADC', expr: 'Vref/2^nb*piso(x*2^nb/Vref)',
        params: [P('Vref', 5, 1, 5, 0.1, 'tensão de referência (V)'), P('nb', 3, 1, 12, 1, 'resolução (bits)')],
        x: [0, 5], y: [-0.5, 5.5], eixoX: 'Vin (V)', eixoY: 'Vq (V)', nota: 'LSB = Vref/2ⁿ; erro de quantização ≤ 1 LSB', anima: 'nb',
      },
      { // NTC (equação Beta): R = R0·e^(B(1/T − 1/T0)), T em K
        id: 'ntc', nome: 'Termistor NTC (Beta)', expr: 'R0*exp(B*(1/(x + 273.15) - 1/(T0 + 273.15)))',
        params: [P('R0', 10, 1, 100, 1, 'resistência a T0 (kΩ)'), P('B', 3950, 3000, 4500, 10, 'constante Beta (K)'), P('T0', 25, 0, 50, 1, 'temperatura de referência (°C)')],
        x: [0, 100], y: [0, 40], eixoX: 'T (°C)', eixoY: 'R (kΩ)', nota: 'R = R0·e^(B(1/T − 1/T0)), temperaturas em kelvin', anima: 'B',
      },
      { // passa-baixas RC: |H| = 1/√(1 + (f/fc)²)
        id: 'passa-baixas', nome: 'Filtro passa-baixas RC (ganho)', expr: '1/raiz(1 + (x/fc)^2)',
        params: [P('fc', 1000, 10, 5000, 10, 'frequência de corte (Hz)')],
        x: [0, 10000], y: [0, 1.1], eixoX: 'f (Hz)', eixoY: '|H|', nota: '|H| = 1/√(1 + (f/fc)²); fc = 1/(2πRC), |H| = 0,707 em fc', anima: 'fc',
      },
      { // senoide amortecida: A·e^(−at)·sen(2πft)
        id: 'amortecida', nome: 'Oscilação amortecida', expr: 'A*exp(-a*x)*sen(2*pi*f*x)',
        params: [P('A', 5, 1, 10, 0.5, 'amplitude inicial'), P('a', 2, 0, 10, 0.1, 'amortecimento (1/s)'), P('f', 5, 1, 20, 0.5, 'frequência (Hz)')],
        x: [0, 2], y: [-6, 6], eixoX: 't (s)', eixoY: 'v', nota: 'v = A·e^(−at)·sen(2πft)', anima: 'a',
      },
    ],
  },
];

export const MODELOS = AREAS.flatMap(a => a.modelos.map(m => ({ ...m, area: a.id })));

export function modelo(id) { return MODELOS.find(m => m.id === id) || null; }

// { nome: valor padrão } de um modelo
export function valoresPadrao(m) { return Object.fromEntries(m.params.map(p => [p.n, p.v])); }
