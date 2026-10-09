// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
import { T, head } from './base.js';

// Esquemas didáticos autorais; não são projetos dimensionados nem símbolos certificados.
const aPath = (d, extra = '') => '<path d="' + d + '" ' + extra + '/>';
const aText = (x, y, s, size = 14) => T(x, y, s, size);
const aLine = (x, y, xx, yy, dash = false) => aPath('M'+x+' '+y+' L'+xx+' '+yy, dash ? 'stroke-width="1.6" stroke-dasharray="6 4"' : '');
const aArrow = (x, y, xx, yy) => aLine(x,y,xx,yy) + head(xx,yy,Math.atan2(yy-y,xx-x)*180/Math.PI,8);
const aBox = (x,y,w,h,labels) => '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="3"/>' + (Array.isArray(labels)?labels:(labels?[labels]:[])).map((s,i,all)=>aText(x+w/2,y+h/2+(i-(all.length-1)/2)*20,s)).join('');
const aTank = (x,y,w,h,level) => aPath('M'+x+' '+y+' V'+(y+h)+' H'+(x+w)+' V'+y) + aLine(x,y+level,x+w,y+level,true);
const aPump = (x,y,r=16) => '<circle cx="'+x+'" cy="'+y+'" r="'+r+'"/>' + aPath('M'+(x-6)+' '+(y-8)+' L'+(x+9)+' '+y+' L'+(x-6)+' '+(y+8)+'Z','fill="#C"');
const aChain = (labels, note = '') => labels.map((s,i)=>aBox(8+i*164,36,140,62,s)+(i<labels.length-1?aArrow(148+i*164,67,172+i*164,67):'')).join('') + (note?aText((labels.length*164-8)/2,126,note):'');
const aAxes = (w=340,h=220,x='Q (m³/s)',y='H (m)') => aArrow(48,h-42,w-14,h-42)+aArrow(48,h-42,48,34)+aText(w-65,h-16,x)+aText(53,16,y);
const aForm = (id,n,w,h,body) => [id,n,w,h,body];

const aTripod = (x,y) => aPath('M'+x+' '+y+' L'+(x-24)+' '+(y+49)+' M'+x+' '+y+' L'+(x+24)+' '+(y+49)+' M'+x+' '+y+' V'+(y+49));
const aPoint = (x,y,t) => '<circle cx="'+x+'" cy="'+y+'" r="4" fill="#C"/>'+aText(x+18,y-14,t);
const aTerrain = () => aPath('M12 164 L70 139 L128 150 L186 105 L244 126 L302 91 L360 117');
export default {
 id:'topografia', nome:'Topografia',
 destaques:['tp-nivelamento','tp-poligonal-fechada','tp-curvas-nivel','tp-perfil-longitudinal','tp-gnss-base-rover','tp-altitudes','tp-corte-aterro'],
 secoes:[
 ['Instrumentos e referências',[
 aForm('tp-nivel-optico','Nível óptico genérico com tripé',200,200,aBox(60,28,80,30,'')+aPath('M48 36 H60 M140 36 H152 M100 58 V90')+aTripod(100,90)+aText(100,169,'Eixo de visada horizontal')),
 aForm('tp-estacao-total','Estação total genérica com prisma',330,220,aBox(45,35,58,68,'ET')+'<circle cx="74" cy="52" r="10"/>'+aTripod(74,103)+aPath('M268 68 V164 M252 52 L268 36 L284 52 L268 68Z')+aLine(103,52,250,52,true)+aText(268,20,'Prisma')+aText(171,191,'Ângulos e distância inclinada')),
 aForm('tp-gnss-receptor','Receptor GNSS genérico em bastão',230,230,'<ellipse cx="115" cy="44" rx="38" ry="10"/>'+aPath('M77 44 V57 Q115 77 153 57 V44 M115 67 V184')+aText(115,22,'Antena GNSS')+aText(115,207,'Altura da antena: medir')),
 aForm('tp-gnss-base-rover','GNSS relativo: base e rover',370,230,aBox(30,76,100,50,'Base')+aBox(240,76,100,50,'Rover')+aTripod(80,126)+aPath('M290 126 V175')+aArrow(142,91,228,91)+aPath('M60 34 L70 24 H96 L106 34 L96 44 H70Z M266 34 L276 24 H302 L312 34 L302 44 H276Z')+aLine(80,44,80,76,true)+aLine(290,44,290,76,true)+aText(185,61,'Observações comuns')+aText(185,206,'Vetor relativo · solução e qualidade')),
 aForm('tp-rn','Referência de nível: marco e identificação',260,190,aPath('M8 130 H252 M100 130 V72 H160 V130 M112 72 V50 H148 V72')+aPoint(130,50,'RN')+aText(130,156,'Altitude = ____ m')+aText(130,178,'Datum / referência: ____')),
 aForm('tp-altitudes','GNSS: altitude elipsoidal e altitude física',420,280,aPath('M8 81 Q150 36 412 81 M8 145 Q185 107 412 145 M8 197 Q185 160 412 197')+aPoint(205,58,'P')+aLine(205,61,205,180)+head(205,180,90,7)+aText(271,100,'h: elipsoidal')+aText(78,90,'H')+aText(68,112,'ortométrica')+aLine(125,64,125,130)+aLine(316,134,316,182)+aText(347,157,'N')+aText(90,146,'geoide')+aText(91,197,'elipsoide')+aText(210,227,'h = H + N · convenção ortométrica')+aText(210,257,'SGB: verificar altitude normal e modelo adotado')),
 ]],
 ['Nivelamento geométrico',[
 aForm('tp-nivelamento','Nivelamento: ré e vante',390,230,aPath('M18 161 H125 L250 190 H372 M62 57 V161 M328 57 V190')+aTripod(195,119)+aBox(171,99,48,20,'')+aLine(62,109,328,109,true)+aText(62,34,'Ré r')+aText(328,34,'Vante v')+aText(195,24,'Visada horizontal')+aText(195,210,'ΔH = r − v · Hᵦ = Hₐ + ΔH')),
 aForm('tp-nivel-altura-instrumento','Nivelamento: altura do instrumento',390,220,aPath('M8 169 H382 M70 63 V169 M320 63 V169')+aLine(70,104,320,104,true)+aBox(171,94,48,20,'')+aTripod(195,114)+aText(195,26,'AI = Hₐ + r')+aText(195,59,'Hᵦ = AI − v')+aText(70,192,'A')+aText(320,192,'B')),
 aForm('tp-nivel-composto','Nivelamento composto: ponto de mudança',450,230,aPath('M8 159 H142 L295 183 H442 M42 72 V159 M222 72 V171 M402 72 V183')+aLine(42,102,222,102,true)+aLine(222,126,402,126,true)+aBox(109,92,36,20,'')+aTripod(127,112)+aBox(307,116,36,20,'')+aTripod(325,136)+aText(42,51,'A')+aText(222,51,'PM')+aText(402,51,'B')+aText(225,211,'ΔH total = Σré − Σvante')),
 aForm('tp-nivel-ida-volta','Nivelamento: ida, volta e fechamento',390,210,aPoint(35,100,'RN A')+aPoint(352,100,'RN B')+aArrow(50,71,336,71)+aArrow(336,131,50,131)+aText(195,48,'Ida')+aText(195,154,'Volta')+aText(195,187,'Comparar com o desnível conhecido')),
 aForm('tp-caderneta-nivel','Caderneta de nivelamento preenchível',480,250,aBox(8,28,464,196,'')+aPath('M8 72 H472 M8 122 H472 M8 172 H472 M85 28 V224 M162 28 V224 M239 28 V224 M316 28 V224 M393 28 V224','stroke-width="1.6"')+['Ponto','Ré (m)','AI (m)','Vante (m)','H (m)','Obs.'].map((s,i)=>aText(46+i*77,49,s)).join('')),
 aForm('tp-fechamento-altimetrico','Fechamento altimétrico: modelo de cálculo',440,195,aText(220,28,'fₕ = Σré − Σvante − (Hfinal − Hinicial)',18)+aText(220,72,'fₕ = ____ m · tolerância = ____ m')+aText(220,112,'Distribuir correção por critério justificado')+aText(220,154,'Não aplicar tolerância sem classe / procedimento')),
 ]],
 ['Planimetria, ângulos e poligonais',[
 aForm('tp-poligonal-fechada','Poligonal fechada com vértices',340,250,aPath('M64 56 L269 65 L294 178 L131 208 L43 141Z')+aPoint(64,56,'A')+aPoint(269,65,'B')+aPoint(294,178,'C')+aPoint(131,208,'D')+aPoint(43,141,'E')+aText(170,123,'Fechamento planimétrico')),
 aForm('tp-poligonal-apoiada','Poligonal aberta apoiada em referências',390,220,aPath('M32 160 L117 73 L220 137 L347 61')+'<circle cx="32" cy="160" r="4"/>'+aText(32,184,'A')+aPoint(117,73,'1')+'<circle cx="220" cy="137" r="4"/>'+aText(220,158,'2')+aPoint(347,61,'B')+aText(195,195,'A e B: referências conhecidas')),
 aForm('tp-irradiacao','Levantamento por irradiação',340,240,'<circle cx="130" cy="148" r="4" fill="#C"/>'+aText(100,180,'Estação')+[[42,50,'1'],[203,42,'2'],[288,107,'3'],[262,194,'4']].map(([x,y,t])=>aLine(130,148,x,y,true)+aPoint(x,y,t)).join('')+aText(135,218,'Ângulo + distância para cada ponto')),
 aForm('tp-azimute','Azimute: sentido horário a partir do norte',300,240,aArrow(98,185,98,28)+aArrow(98,185,256,101)+aPath('M98 75 A110 110 0 0 1 194 133','stroke-width="1.6"')+head(194,133,61,7)+aText(98,16,'N')+aText(163,78,'Az')+aText(160,216,'0° a 360° · sentido horário')),
 aForm('tp-distancia-horizontal','Distância inclinada e horizontal',340,230,aPath('M40 171 H300 V60Z')+aPath('M281 171 V152 H300','stroke-width="1.6"')+aPath('M91 171 A51 51 0 0 0 87 151','stroke-width="1.6"')+aText(171,94,'Di')+aText(171,192,'Dh')+aText(317,120,'ΔH')+aText(106,151,'α')+aText(170,216,'Dh = Di cos α · ΔH = Di sen α')),
 aForm('tp-coordenadas-incrementos','Coordenadas: incrementos a partir do azimute',390,240,aArrow(58,178,58,33)+aArrow(58,178,288,178)+aArrow(58,178,268,72)+aLine(268,72,268,178,true)+aLine(58,72,268,72,true)+aText(44,17,'N')+aText(311,178,'E')+aText(303,113,'ΔN')+aText(166,194,'ΔE')+aText(195,220,'ΔE = D sen Az · ΔN = D cos Az')),
 ]],
 ['Relevo, perfis e terraplenagem',[
 aForm('tp-curvas-nivel','Curvas de nível: elevação isolada',330,240,'<ellipse cx="165" cy="124" rx="146" ry="94"/><ellipse cx="165" cy="124" rx="108" ry="66"/><ellipse cx="165" cy="124" rx="66" ry="38"/>'+aText(165,123,'120')+aText(165,72,'110')+aText(165,16,'100')+aText(165,225,'Equidistância vertical: 10 m')),
 aForm('tp-curvas-vale','Curvas de nível: vale e direção de drenagem',350,240,[ [82,48],[128,94],[174,140] ].map(([y,top])=>aPath('M20 '+y+' L110 '+(y+30)+' L175 '+top+' L240 '+(y+30)+' L330 '+y)).join('')+aArrow(175,35,175,197)+aText(175,217,'Os Vs apontam para montante')),
 aForm('tp-perfil-longitudinal','Perfil longitudinal: terreno e greide',390,240,aAxes(390,240,'Distância (m)','Cota (m)')+aPath('M50 144 L100 124 L150 137 L200 90 L250 112 L300 77 L360 103')+aPath('M50 147 L360 111','stroke-dasharray="7 4" stroke-width="1.6"')+aText(264,54,'terreno')+aText(285,147,'greide')),
 aForm('tp-secao-transversal','Seção transversal: terreno e eixo',380,230,aPath('M12 130 L80 114 L145 119 L190 98 L240 111 L303 106 L368 126')+aLine(190,29,190,185,true)+aPath('M100 149 H280 L313 182 M100 149 L67 182')+aText(190,20,'Eixo')+aText(190,212,'Estaca: ____ · cotas / offsets: ____')),
 aForm('tp-corte-aterro','Terraplenagem: corte e aterro',420,230,aPath('M8 144 L70 81 L148 92 L225 160 L303 172 L412 111 M8 126 H412')+aPath('M56 126 L74 100 M80 126 L98 100 M110 126 L126 104 M242 141 L250 126 M267 155 L284 126 M299 160 L318 126','stroke-width="1.6"')+aText(115,55,'Corte')+aText(280,197,'Aterro')+aText(334,101,'Greide')+aText(210,216,'Áreas entre terreno e superfície de projeto')),
 aForm('tp-volume-secoes','Volume entre seções: áreas médias',420,200,aPath('M32 70 L72 124 H154 L185 70Z M246 43 L281 105 H376 L409 43Z')+aLine(32,70,246,43,true)+aLine(72,124,281,105,true)+aText(104,151,'A₁ (m²)')+aText(329,131,'A₂ (m²)')+aText(210,178,'V ≈ (A₁ + A₂) · L / 2 · m³')),
 ]],
 ['Aplicações em água e saneamento',[
 aForm('tp-declividade-tubo','Declividade de tubulação: cotas e comprimento',420,215,aPath('M26 68 L385 129 M26 91 L385 152')+aLine(26,92,26,177,true)+aLine(385,153,385,177,true)+aArrow(35,177,376,177)+head(35,177,180,8)+aText(83,38,'Cota A')+aText(336,101,'Cota B')+aText(210,161,'L horizontal')+aText(210,200,'i = (ZA − ZB) / L · m/m')),
 aForm('tp-locacao-pv','Locação de PV: eixo e amarrações',350,230,aPath('M20 180 H330 M20 35 H330 M175 35 V180','stroke-dasharray="6 4"')+'<circle cx="175" cy="108" r="20"/>'+'<circle cx="42" cy="48" r="4"/>'+aText(60,16,'R1')+aPoint(310,159,'R2')+aLine(42,48,175,108,true)+aLine(310,159,175,108,true)+aText(175,212,'Coordenadas + cotas + referências')),
 aForm('tp-divisor-bacia','Divisor de bacia: cristas e exutório',350,265,aPath('M39 66 L119 27 L270 48 L323 129 L253 218 L103 201 L24 128Z','stroke-dasharray="7 4"')+aPath('M89 70 L146 111 L198 166 L252 208 M264 86 L198 166 M67 155 L163 139')+aArrow(219,185,249,206)+aText(165,239,'Traçar pelo relevo · verificar exutório')),
 aForm('tp-talude','Talude: relação horizontal e vertical',350,220,aPath('M35 53 H130 L297 162 H330 M130 53 V162 H297')+aText(89,108,'V')+aText(215,184,'H')+aText(175,28,'Talude: H:V')+aText(175,207,'Declarar convenção · não inverter razão')),
 aForm('tp-datum-metadados','Levantamento: metadados obrigatórios',430,240,aBox(8,25,414,193,'')+aText(215,48,'Sistema de referência / datum: ____')+aText(215,82,'Projeção e fuso: ____ · unidades: ____')+aText(215,116,'Referência vertical / modelo: ____')+aText(215,150,'Método / data / precisão: ____')+aText(215,184,'Marcos e controle de qualidade: ____')),
 aForm('tp-malha-cotas','Malha de levantamento planialtimétrico',350,250,[50,110,170,230,290].map(x=>aLine(x,42,x,198,true)).join('')+[42,94,146,198].map(y=>aLine(50,y,290,y,true)).join('')+[ [50,42],[170,42],[290,42],[110,94],[230,94],[50,146],[170,146],[290,146],[110,198],[230,198] ].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="3" fill="#C"/>').join('')+aText(170,226,'Pontos: E, N e cota · densidade por relevo')),
 ]],
 ]
};
