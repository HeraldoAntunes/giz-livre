import { T, head } from './base.js';

// Símbolos de elétrica desenhados do zero, seguindo as convenções da IEC 60617 e da ABNT NBR 5444.
// Semicondutores (diodo, LED, transistor) ficam em eletronica.js.

const W = '<path d="M4 35 H29 M81 35 H106"/>'; // fios dos símbolos circulares 110×70
const circ = (dentro) => '<circle cx="55" cy="35" r="26"/>' + W + dentro;
const med = (id, nome, s, size = 22) => [id, nome, 110, 70, circ(T(55, 35, s, size))];
const maq = (id, nome, s, marca) => [id, nome, 110, 70, circ(T(55, 29, s, 20) + marca)];
const CA = '<path d="M45 47 Q50 41 55 47 T65 47" stroke-width="1.8"/>';
const CC = '<path d="M45 45 H65" stroke-width="1.8"/><path d="M45 50 H65" stroke-width="1.8" stroke-dasharray="3 3"/>';
const parede = '<path d="M6 62 H74" stroke-width="4"/>';
const tri = '<path d="M18 58 L62 58 L40 20 Z"/>';

export default {
  id: 'eletrica', nome: 'Elétrica',
  secoes: [
    ['Componentes passivos', [
      ['el-resistor', 'Resistor', 140, 40, '<path d="M4 20 H36 M104 20 H136"/><rect x="36" y="8" width="68" height="24"/>'],
      ['el-resistorA', 'Resistor (zigue-zague)', 140, 40, '<path d="M4 20 H34 L40 6 L52 34 L64 6 L76 34 L88 6 L100 34 L106 20 H136"/>'],
      ['el-resvar', 'Resistor variável', 140, 60, '<path d="M4 30 H36 M104 30 H136"/><rect x="36" y="18" width="68" height="24"/><path d="M38 54 L94 12" stroke-width="1.8"/>' + head(100, 8, -36, 10)],
      ['el-pot', 'Potenciômetro', 140, 60, '<path d="M4 22 H36 M104 22 H136"/><rect x="36" y="10" width="68" height="24"/><path d="M70 56 V44"/>' + head(70, 35, -90, 10)],
      ['el-capacitor', 'Capacitor', 120, 60, '<path d="M4 30 H52 M68 30 H116"/><path d="M52 8 V52 M68 8 V52" stroke-width="3.5"/>'],
      ['el-eletrolitico', 'Capacitor polarizado', 120, 60, '<path d="M4 30 H52 M70 30 H116"/><path d="M52 8 V52" stroke-width="3.5"/><path d="M76 8 Q64 30 76 52" stroke-width="3.5"/>' + T(38, 12, '+', 18)],
      ['el-capvar', 'Capacitor variável', 120, 70, '<path d="M4 35 H52 M68 35 H116"/><path d="M52 14 V56 M68 14 V56" stroke-width="3.5"/><path d="M36 62 L79 14" stroke-width="1.8"/>' + head(84, 8, -50, 10)],
      ['el-indutor', 'Indutor', 140, 40, '<path d="M4 28 H26 A11 11 0 0 1 48 28 A11 11 0 0 1 70 28 A11 11 0 0 1 92 28 A11 11 0 0 1 114 28 H136"/>'],
      ['el-indnucleo', 'Indutor com núcleo', 140, 50, '<path d="M4 38 H26 A11 11 0 0 1 48 38 A11 11 0 0 1 70 38 A11 11 0 0 1 92 38 A11 11 0 0 1 114 38 H136"/><path d="M26 10 H114 M26 16 H114" stroke-width="1.8"/>'],
      ['el-fio', 'Fio', 120, 20, '<path d="M4 10 H116"/>'],
      ['el-no', 'Nó / junção', 30, 30, '<circle cx="15" cy="15" r="6" fill="#C"/>'],
      ['el-cruz', 'Cruzamento sem conexão', 80, 80, '<path d="M4 40 H30 A10 10 0 0 1 50 40 H76 M40 4 V76"/>'],
    ]],
    ['Fontes e aterramento', [
      ['el-bateria', 'Bateria / fonte CC', 140, 70, '<path d="M4 35 H36 M104 35 H136"/><path d="M36 10 V60 M92 10 V60"/><path d="M48 22 V48 M104 22 V48" stroke-width="5"/><path d="M54 35 H86" stroke-width="1.6" stroke-dasharray="3 4"/>' + T(24, 12, '+', 18)],
      ['el-pilha', 'Pilha (uma célula)', 110, 70, '<path d="M4 35 H46 M64 35 H106"/><path d="M46 8 V62"/><path d="M64 22 V48" stroke-width="5"/>' + T(34, 12, '+', 18)],
      ['el-ca', 'Fonte CA', 110, 70, '<circle cx="55" cy="35" r="26"/><path d="M4 35 H29 M81 35 H106 M41 35 Q48 20 55 35 T69 35"/>'],
      ['el-fontei', 'Fonte de corrente', 110, 70, circ('<path d="M40 35 H62"/>' + head(72, 35, 0, 11))],
      ['el-fontev', 'Fonte de tensão controlada', 110, 70, '<path d="M55 8 L82 35 L55 62 L28 35 Z M4 35 H28 M82 35 H106"/>' + T(43, 35, '+', 20) + T(67, 35, '−', 22)],
      ['el-fonteic', 'Fonte de corrente controlada', 110, 70, '<path d="M55 8 L82 35 L55 62 L28 35 Z M4 35 H28 M82 35 H106"/><path d="M40 35 H60"/>' + head(70, 35, 0, 10)],
      ['el-terra', 'Terra', 60, 70, '<path d="M30 4 V36 M8 36 H52 M16 48 H44 M24 60 H36"/>'],
      ['el-massa', 'Massa / chassi', 60, 56, '<path d="M30 4 V30 M8 30 H52"/><path d="M16 30 L8 44 M30 30 L22 44 M44 30 L36 44" stroke-width="2"/>'],
      ['el-pe', 'Terra de proteção (PE)', 70, 84, '<circle cx="35" cy="50" r="28"/><path d="M35 4 V42 M19 42 H51 M25 52 H45 M31 62 H39"/>'],
    ]],
    ['Medição', [
      med('el-amperimetro', 'Amperímetro', 'A'),
      med('el-voltimetro', 'Voltímetro', 'V'),
      med('el-ohmimetro', 'Ohmímetro', 'Ω'),
      med('el-wattimetro', 'Wattímetro', 'W'),
      med('el-frequencimetro', 'Frequencímetro', 'Hz', 18),
      ['el-galvanometro', 'Galvanômetro', 110, 70, circ('<path d="M44 48 L62 26" stroke-width="2"/>' + head(67, 20, -50, 10) + '<path d="M38 26 Q55 14 72 26" stroke-width="1.4"/>')],
      ['el-osciloscopio', 'Osciloscópio', 120, 80, '<rect x="16" y="8" width="88" height="64" rx="6"/><rect x="26" y="16" width="68" height="40" stroke-width="1.6"/><path d="M30 36 Q38 20 46 36 T62 36 T78 36 T94 36" stroke-width="1.8"/><circle cx="44" cy="64" r="3"/><circle cx="76" cy="64" r="3"/><path d="M4 40 H16 M104 40 H116"/>'],
      ['el-kwh', 'Medidor de energia (kWh)', 120, 70, '<rect x="30" y="10" width="60" height="50"/><path d="M4 35 H30 M90 35 H116"/>' + T(60, 35, 'kWh', 17)],
    ]],
    ['Comando e proteção', [
      ['el-chave', 'Interruptor', 120, 50, '<path d="M4 38 H34 M86 38 H116 M38 36 L82 10"/><circle cx="36" cy="38" r="3" fill="#C"/><circle cx="84" cy="38" r="3" fill="#C"/>'],
      ['el-botNA', 'Botoeira NA', 120, 70, '<path d="M4 58 H36 V50 M116 58 H84 V50 M30 42 H90 M48 8 V18 H72 V8"/><path d="M60 42 V18" stroke-width="1.8" stroke-dasharray="4 3"/>'],
      ['el-botNF', 'Botoeira NF', 120, 70, '<path d="M4 42 H36 V54 M116 42 H84 V54 M30 54 H90 M48 8 V18 H72 V8"/><path d="M60 54 V18" stroke-width="1.8" stroke-dasharray="4 3"/>'],
      ['el-contNA', 'Contato NA', 120, 50, '<path d="M4 36 H40 L82 14 M84 36 H116"/>'],
      ['el-contNF', 'Contato NF', 120, 50, '<path d="M4 36 H40 L92 12 M80 36 V18 M80 36 H116"/>'],
      ['el-rele', 'Relé (bobina)', 80, 90, '<rect x="14" y="28" width="52" height="34"/><path d="M40 4 V28 M40 62 V86"/>'],
      ['el-contator', 'Contator (contato principal)', 120, 50, '<path d="M4 36 H40 L80 12 M84 36 H116 M84 36 A7 7 0 0 1 84 22"/>'],
      ['el-fusivel', 'Fusível', 130, 40, '<rect x="34" y="10" width="62" height="20"/><path d="M4 20 H126"/>'],
      ['el-disjuntor', 'Disjuntor monopolar', 120, 50, '<path d="M4 36 H36 L78 12 M84 36 H116"/><path d="M79 31 L89 41 M89 31 L79 41" stroke-width="2"/>'],
      ['el-dr', 'DR (diferencial residual)', 140, 80, '<path d="M4 44 H40 L84 18 M88 44 H136"/><path d="M83 39 L93 49 M93 39 L83 49" stroke-width="2"/><ellipse cx="22" cy="44" rx="5" ry="12" stroke-width="2"/><path d="M22 56 V70 H62 V33" stroke-width="1.6" stroke-dasharray="4 3"/>' + T(110, 66, 'IΔn', 14)],
      ['el-dps', 'DPS (surto)', 70, 110, '<path d="M35 4 V24 M35 70 V84 M17 84 H53 M23 94 H47 M29 104 H41"/><rect x="20" y="24" width="30" height="46"/><path d="M41 30 L31 47 H40 L33 60" stroke-width="1.8"/>' + head(30, 66, 118, 8)],
      ['el-seccionadora', 'Seccionadora', 120, 50, '<path d="M4 36 H40 L82 12 M84 36 H116 M84 28 V44"/>'],
    ]],
    ['Máquinas e transformadores', [
      maq('el-motor', 'Motor CA', 'M', CA),
      maq('el-motorcc', 'Motor CC', 'M', CC),
      maq('el-gerador', 'Gerador CC', 'G', CC),
      maq('el-alternador', 'Alternador', 'G', CA),
      ['el-trafo', 'Transformador monofásico', 120, 100, '<path d="M30 8 V20 A10 10 0 0 1 30 40 A10 10 0 0 1 30 60 A10 10 0 0 1 30 80 V92 M90 8 V20 A10 10 0 0 0 90 40 A10 10 0 0 0 90 60 A10 10 0 0 0 90 80 V92"/><path d="M56 14 V86 M64 14 V86" stroke-width="1.8"/>'],
      ['el-trafoiec', 'Transformador (círculos)', 130, 70, '<circle cx="50" cy="35" r="24"/><circle cx="80" cy="35" r="24"/><path d="M4 35 H26 M104 35 H126"/>'],
      ['el-trafo3', 'Transformador trifásico (Y-Δ)', 140, 80, '<circle cx="56" cy="40" r="26"/><circle cx="84" cy="40" r="26"/><path d="M4 40 H30 M110 40 H136"/><path d="M10 46 L16 34 M15 46 L21 34 M20 46 L26 34 M114 46 L120 34 M119 46 L125 34 M124 46 L130 34" stroke-width="1.6"/><path d="M44 42 V52 M44 42 L36 34 M44 42 L52 34 M96 31 L104 47 H88 Z" stroke-width="1.8"/>'],
      ['el-autotrafo', 'Autotransformador', 100, 110, '<path d="M40 4 V18 A9 9 0 0 1 40 36 A9 9 0 0 1 40 54 A9 9 0 0 1 40 72 A9 9 0 0 1 40 90 V106 M96 54 H58"/>' + head(50, 54, 180, 10)],
    ]],
    ['Instalações prediais (NBR 5444)', [
      ['el-luzteto', 'Ponto de luz no teto', 80, 80, '<circle cx="40" cy="40" r="28"/><path d="M12 40 H68" stroke-width="1.6"/>' + T(40, 28, 'a', 15) + T(40, 53, '100', 13)],
      ['el-arandela', 'Arandela', 80, 80, '<path d="M8 72 H72" stroke-width="4"/><path d="M40 72 V54"/><circle cx="40" cy="34" r="20"/>'],
      ['el-intsimples', 'Interruptor simples', 70, 60, '<circle cx="28" cy="34" r="17"/>' + T(28, 34, 'S', 17) + T(56, 14, 'a', 14)],
      ['el-intparalelo', 'Interruptor paralelo (three-way)', 70, 60, '<circle cx="28" cy="34" r="19"/>' + T(28, 34, 'S3w', 12) + T(58, 14, 'a', 14)],
      ['el-tombaixa', 'Tomada baixa', 80, 70, parede + tri],
      ['el-tommedia', 'Tomada média', 80, 70, parede + tri + '<path d="M18 58 L62 58 L51 39 L29 39 Z" fill="#C"/>'],
      ['el-tomalta', 'Tomada alta', 80, 70, parede + '<path d="M18 58 L62 58 L40 20 Z" fill="#C"/>'],
      ['el-tomada', 'Tomada (genérica)', 90, 70, '<path d="M10 62 H80 M45 62 V40 M20 40 A25 25 0 0 1 70 40 Z"/>'],
      ['el-quadro', 'Quadro de distribuição', 100, 60, '<rect x="8" y="10" width="84" height="40"/><path d="M8 50 L92 10 V50 Z" fill="#C"/>'],
      ['el-eletroduto', 'Eletroduto (teto/parede)', 140, 60, '<path d="M4 26 H136"/><path d="M44 16 V36 M70 16 V36 M96 16 V36 H102" stroke-width="2"/><circle cx="70" cy="13" r="3" fill="#C" stroke="none"/>' + T(44, 50, 'N', 12) + T(70, 50, 'F', 12) + T(96, 50, 'R', 12)],
      ['el-eletroduto-piso', 'Eletroduto no piso', 140, 30, '<path d="M4 15 H136" stroke-dasharray="10 6"/>'],
      ['el-campainha', 'Campainha', 80, 56, '<path d="M16 24 A24 24 0 0 0 64 24 Z M30 4 V24 M50 4 V24"/>'],
      ['el-lampada', 'Lâmpada', 110, 70, '<circle cx="55" cy="35" r="24"/><path d="M38 18 L72 52 M72 18 L38 52 M4 35 H31 M79 35 H106"/>'],
      ['el-chuveiro', 'Chuveiro elétrico', 80, 90, '<path d="M40 4 V20 M22 20 H58 L66 34 H14 Z"/><path d="M20 44 L16 62 M32 44 L30 64 M48 44 L50 64 M60 44 L64 62" stroke-width="1.6" stroke-dasharray="3 4"/>'],
    ]],
  ],
};
