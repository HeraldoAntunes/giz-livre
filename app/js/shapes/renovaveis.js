import { T, head } from './base.js';

// Energias renováveis: solar, eólica/hídrica, biomassa/biogás, armazenamento e rede. Desenho próprio do Giz Livre.
export default {
  id: 'renov', nome: 'Energias renováveis',
  secoes: [
    ['Solar', [
      ['rn-fv', 'Painel fotovoltaico', 140, 110, '<path d="M20 14 H124 L112 76 H8 Z"/><path d="M46 14 L38 76 M72 14 L66 76 M98 14 L94 76 M14 45 H118" stroke-width="1.6"/><path d="M60 76 V104 M40 104 H80"/>'],
      ['rn-fvsimb', 'Gerador FV (símbolo)', 110, 90, '<rect x="25" y="20" width="60" height="50"/><path d="M25 70 L85 20 M4 45 H25 M85 45 H106"/><path d="M58 4 L48 14 M76 6 L66 16" stroke-width="1.6"/>' + head(48, 14, 135, 8) + head(66, 16, 135, 8)],
      ['rn-string', 'String FV (série)', 220, 90, '<rect x="24" y="30" width="40" height="40"/><rect x="90" y="30" width="40" height="40"/><rect x="156" y="30" width="40" height="40"/><path d="M24 70 L64 30 M90 70 L130 30 M156 70 L196 30" stroke-width="1.6"/><path d="M4 50 H24 M64 50 H90 M130 50 H156 M196 50 H216"/>' + T(12, 34, '+', 16) + T(208, 34, '−', 16) + '<path d="M104 6 L96 16 M120 8 L112 18" stroke-width="1.6"/>' + head(96, 16, 130, 7) + head(112, 18, 130, 7)],
      ['rn-coletor', 'Coletor solar térmico', 150, 100, '<rect x="20" y="8" width="110" height="80" rx="3"/><path d="M4 76 H32 V22 H50 V76 H68 V22 H86 V76 H104 V22 H118 V76 H146" stroke-width="2"/>'],
      ['rn-inversor', 'Inversor (CC/CA)', 100, 100, '<rect x="10" y="10" width="80" height="80"/><path d="M10 90 L90 10"/><path d="M20 30 H44 M20 38 H28 M36 38 H44" stroke-width="1.8"/><path d="M56 70 Q63 58 70 70 T84 70" stroke-width="1.8"/>'],
      ['rn-controlador', 'Controlador de carga', 110, 90, '<rect x="20" y="12" width="70" height="66" rx="4"/><path d="M4 45 H20 M90 45 H106"/>' + T(55, 30, 'MPPT', 13) + '<rect x="41" y="50" width="26" height="15" stroke-width="1.6"/><path d="M67 54 H71 V61 H67" stroke-width="1.6"/>'],
      ['rn-sol', 'Sol', 100, 100, '<circle cx="50" cy="50" r="20"/><path d="M50 8 V20 M50 80 V92 M8 50 H20 M80 50 H92 M20 20 L29 29 M71 71 L80 80 M80 20 L71 29 M29 71 L20 80"/>'],
    ]],
    ['Eólica e hídrica', [
      ['rn-eolico', 'Aerogerador', 110, 190, '<path d="M50 70 L46 186 H64 L60 70"/><circle cx="55" cy="56" r="7"/><path d="M55 49 Q50 22 56 4 Q64 26 58 49 M61 60 Q86 72 104 86 Q80 84 58 64 M49 60 Q28 76 8 82 Q24 64 50 54" fill="none"/>'],
      ['rn-hidro', 'Turbina hidráulica', 120, 100, '<circle cx="60" cy="50" r="30"/><path d="M60 20 Q76 40 60 50 Q44 60 60 80 M30 50 Q50 34 60 50 Q70 66 90 50"/><path d="M4 50 H30"/>'],
      ['rn-barragem', 'PCH / barragem', 220, 130, '<path d="M4 120 H216 M70 120 V14 H90 L120 120"/><path d="M4 30 H68" stroke-dasharray="7 5" stroke-width="1.8"/><path d="M12 42 Q18 38 24 42 T36 42 M40 58 Q46 54 52 58 T64 58" stroke-width="1.4"/><path d="M70 92 L150 100 M70 102 L150 110" stroke-width="1.8"/><rect x="150" y="84" width="44" height="36"/><circle cx="172" cy="104" r="9" stroke-width="1.8"/><path d="M194 112 H216" stroke-dasharray="6 4" stroke-width="1.8"/>'],
      ['rn-gerador', 'Gerador (G~)', 90, 70, '<circle cx="45" cy="35" r="22"/><path d="M4 35 H23 M67 35 H86"/>' + T(45, 29, 'G', 17) + '<path d="M37 45 Q41 39 45 45 T53 45" stroke-width="1.6"/>'],
    ]],
    ['Biomassa e biogás', [
      ['rn-biodigestor', 'Biodigestor (gasômetro)', 200, 140, '<path d="M50 50 V126 H150 V50 M50 50 A50 36 0 0 1 150 50"/><path d="M4 50 H50 M150 50 H196" stroke-width="1.6"/><path d="M54 68 H146" stroke-dasharray="7 5" stroke-width="1.6"/><path d="M100 14 V6 H196 M4 38 H28 L58 104 M142 104 L170 38 H196" stroke-width="2"/>' + T(176, 20, 'biogás', 13)],
      ['rn-flare', 'Queimador (flare)', 80, 150, '<path d="M34 146 V62 M46 146 V62 M30 62 H50 M22 146 H58 M4 130 H34"/><path d="M40 56 Q24 42 34 22 Q38 34 44 28 Q42 14 50 4 Q62 28 52 46 Q50 54 40 56 Z"/>'],
      ['rn-motogerador', 'Motogerador', 200, 90, '<rect x="20" y="16" width="90" height="58" rx="4"/><path d="M4 45 H20 M110 45 H130 M174 45 H196"/><circle cx="152" cy="45" r="22"/>' + T(65, 45, 'Motor', 15) + T(152, 45, 'G', 17)],
      ['rn-caldeira', 'Caldeira a biomassa', 140, 150, '<rect x="20" y="40" width="100" height="98" rx="6"/><path d="M86 40 V6 H104 V40 M40 40 V20 H4 M120 100 H136"/><path d="M28 64 H112" stroke-dasharray="7 5" stroke-width="1.6"/><path d="M36 126 Q42 108 50 118 Q56 98 66 116 Q72 102 80 118 Q88 106 100 126 M30 128 H110" stroke-width="1.8"/>'],
    ]],
    ['Armazenamento e rede', [
      ['rn-bateria', 'Banco de baterias', 120, 80, '<rect x="10" y="16" width="100" height="58" rx="4"/><path d="M30 16 V8 H42 V16 M78 16 V8 H90 V16"/>' + T(36, 45, '+', 22) + T(84, 45, '−', 22)],
      ['rn-medidor', 'Medidor bidirecional', 110, 70, '<rect x="25" y="10" width="60" height="50" rx="4"/>' + T(55, 30, 'kWh', 16) + '<path d="M4 35 H25 M85 35 H106 M44 48 H66" stroke-width="1.6"/>' + head(70, 48, 0, 7) + head(40, 48, 180, 7)],
      ['rn-rede', 'Rede elétrica (torre)', 100, 130, '<path d="M50 6 L26 126 M50 6 L74 126 M20 30 H80 M30 60 H70 M24 100 H76 M36 60 L64 100 M64 60 L36 100" stroke-width="2"/>'],
      ['rn-poste', 'Poste de distribuição', 80, 160, '<path d="M40 156 V8 M8 22 H72 M18 64 H62 M24 156 H56"/><circle cx="12" cy="17" r="3" fill="#C"/><circle cx="40" cy="8" r="3" fill="#C"/><circle cx="68" cy="17" r="3" fill="#C"/><circle cx="22" cy="60" r="2.5" fill="#C"/><circle cx="58" cy="60" r="2.5" fill="#C"/>'],
      ['rn-trafoposte', 'Transformador de poste', 130, 170, '<path d="M40 166 V8 M8 20 H72 M24 166 H56 M40 70 H52 M40 106 H52 M62 60 V50 M86 60 V50"/><circle cx="12" cy="15" r="3" fill="#C"/><circle cx="68" cy="15" r="3" fill="#C"/><rect x="52" y="60" width="44" height="56" rx="6"/><circle cx="69" cy="88" r="9" stroke-width="1.6"/><circle cx="80" cy="88" r="9" stroke-width="1.6"/>'],
      ['rn-carregador', 'Carregador de VE', 120, 150, '<rect x="20" y="8" width="56" height="134" rx="8"/><path d="M10 142 H86 M76 92 Q104 92 104 120"/><rect x="30" y="20" width="36" height="22" rx="2" stroke-width="1.6"/><path d="M52 52 L40 76 H50 L44 96 L60 68 H50 L58 52 Z" fill="#C" stroke-width="1.4"/><rect x="96" y="120" width="16" height="16" rx="3"/><path d="M100 136 V144 M108 136 V144" stroke-width="2"/>'],
      ['rn-h2', 'Eletrolisador (H₂)', 140, 120, '<rect x="20" y="24" width="100" height="90" rx="4"/><path d="M50 34 V100 M90 34 V100" stroke-width="3.5"/><path d="M70 30 V108" stroke-dasharray="6 4" stroke-width="1.4"/><path d="M24 44 H116" stroke-dasharray="4 4" stroke-width="1.2"/><path d="M50 24 V8 M90 24 V8 M4 90 H20"/><circle cx="58" cy="70" r="3" stroke-width="1.4"/><circle cx="60" cy="56" r="2.5" stroke-width="1.4"/><circle cx="82" cy="66" r="3" stroke-width="1.4"/>' + T(34, 10, 'H₂', 13) + T(108, 10, 'O₂', 13)],
    ]],
  ],
};
