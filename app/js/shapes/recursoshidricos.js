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

const aBasin = () => aPath('M212 218 Q58 193 24 120 L52 42 Q150 4 264 44 L312 122 Q274 200 212 218Z')+aPath('M82 58 L130 100 L168 132 L212 181 L212 218 M252 61 L214 104 L168 132 M47 130 L118 130 L168 132')+aArrow(212,190,212,218);
export default {
 id:'recursos-hidricos', nome:'Recursos hídricos',
 destaques:['rh-bacia-divisor','rh-balanco-bacia','rh-oferta-demanda','rh-instrumentos','rh-permanencia','rh-estacao-monitoramento','rh-renaturalizacao'],
 secoes:[
 ['Bacia e balanço hídrico',[
 aForm('rh-bacia-divisor','Bacia hidrográfica: divisor, afluentes e exutório',350,260,aBasin()+aText(171,14,'Divisor de águas')+aText(310,211,'Exutório')+aLine(282,218,215,218)+aText(175,238,'Rede convergente para uma saída')),
 aForm('rh-sub-bacias','Sub-bacias: unidades de planejamento',350,260,aBasin()+aPath('M25.435897435897434 116 Q105 76 168 132 Q231 91 305.2307692307692 111 M168 132 Q177 79 170 24.089389159997605','stroke-dasharray="6 4" stroke-width="1.6"')+aText(111,71,'A')+aText(270,83,'B')+aText(134,178,'C')+aText(175,239,'Limites internos: divisores locais')),
 aForm('rh-balanco-bacia','Balanço de bacia: entradas, saídas e estoque',380,250,aBox(105,78,170,90,['Bacia','armazenamento S'])+aArrow(190,30,190,78)+aArrow(190,78,243,35)+aArrow(8,121,105,121)+aArrow(275,121,372,121)+aText(158,26,'P')+aText(271,30,'ET')+aText(48,99,'Qin')+aText(325,99,'Qout')+aText(190,207,'ΔS = P − ET + Qin − Qout')+aText(190,233,'Volumes na mesma área e período')),
 aForm('rh-balanco-reservatorio','Reservatório: balanço operacional',430,240,aTank(130,70,170,100,45)+aArrow(8,115,130,115)+aArrow(300,115,422,115)+aArrow(205,18,205,70)+aArrow(250,70,286,25)+aArrow(300,154,422,154)+aText(60,93,'afluência')+aText(356,94,'retirada')+aText(359,181,'vertimento')+aText(172,27,'P')+aText(317,27,'E')+aText(215,218,'ΔS = entradas − saídas')),
 aForm('rh-infiltracao-recarga','Solo e aquífero: infiltração e recarga',350,250,aPath('M8 70 Q110 44 342 70 M8 160 Q175 143 342 160 M8 221 H342')+aArrow(84,22,84,63)+aArrow(127,86,127,133)+aArrow(209,166,209,209)+aArrow(253,191,321,191)+aText(212,30,'precipitação')+aText(233,110,'zona não saturada')+aText(94,188,'aquífero')+aText(170,238,'Recarga ≠ toda a infiltração')),
 aForm('rh-conectividade-rio-aquifero','Rio e aquífero: ganho e perda de água',430,240,aPath('M8 62 H66 L91 111 H151 L176 62 H204 M226 62 H284 L309 111 H369 L394 62 H422')+aLine(8,91,204,91,true)+aLine(226,149,422,149,true)+aArrow(45,133,86,111)+aArrow(184,133,155,111)+aArrow(310,112,283,145)+aArrow(367,112,395,145)+aText(107,30,'Rio efluente')+aText(323,30,'Rio influente')+aText(215,207,'Troca depende do gradiente hidráulico')),
 ]],
 ['Oferta, demanda e operação',[
 aForm('rh-oferta-demanda','Oferta e demanda: usos múltiplos',480,250,aBox(8,92,125,72,['Oferta','disponível'])+aPath('M133 128 H173 M173 52 V204 M173 52 H220 M173 128 H220 M173 204 H220')+aBox(220,24,245,56,'Abastecimento humano')+aBox(220,100,245,56,'Irrigação / indústria')+aBox(220,176,245,56,'Ambiente e outros usos')),
 aForm('rh-demanda-consuntiva','Retirada, consumo e retorno',480,210,aBox(8,56,120,70,'Manancial')+aBox(200,56,130,70,'Usuário')+aArrow(128,91,200,91)+aPath('M265 126 V166 H70 V126')+head(70,126,-90,8)+aArrow(330,91,472,91)+aText(167,68,'retirada')+aText(397,67,'consumo')+aText(171,187,'retorno: qualidade e localização')),
 aForm('rh-permanencia','Curva de permanência de vazões',360,230,aAxes(360,230,'P excedência (%)','Q (m³/s)')+aPath('M54 48 C90 96 175 133 328 161')+aLine(290,155,290,188,true)+aText(144,158,'Q₉₀ / Q₉₅')+aText(173,25,'Série e período explícitos')),
 aForm('rh-curva-cota-volume','Reservatório: curva cota-volume',360,230,aAxes(360,230,'Volume (hm³)','Cota (m)')+aPath('M55 169 Q114 91 326 45')+aText(188,25,'Geometria do reservatório')),
 aForm('rh-zonas-operacao','Reservatório: zonas de operação',350,250,aBox(75,36,200,165,'')+aLine(75,76,275,76,true)+aLine(75,130,275,130,true)+aLine(75,172,275,172,true)+aText(175,56,'Espera para cheias')+aText(175,103,'Volume útil')+aText(175,151,'Reserva operacional')+aText(175,188,'Volume morto')+aText(175,229,'Limites específicos de cada sistema')),
 aForm('rh-curva-regra','Curva-guia sazonal: modelo preenchível',370,235,aAxes(370,235,'Mês','Volume (%)')+aPath('M56 91 L110 91 L164 63 L218 85 L272 132 L340 132','stroke-dasharray="7 4"')+aText(194,26,'Curva-guia ilustrativa')+aText(196,174,'Metas: ____ · restrições: ____')),
 aForm('rh-alocacao-negociada','Alocação de água: decisão e acompanhamento',648,150,aChain([['Disponibilidade','e restrições'],['Usuários','e negociação'],['Regras','de alocação'],['Monitoramento','e revisão']],'Processo participativo com informação verificável')),
 aForm('rh-seca-resposta','Escassez: gatilhos e ações graduais',484,150,aChain([['Indicadores','e gatilhos'],['Medidas','de contingência'],['Avaliação','e revisão']],'Prioridades e restrições definidas pelo órgão competente')),
 ]],
 ['Instrumentos e gestão participativa',[
 aForm('rh-instrumentos','Gestão: instrumentos articulados',540,245,aBox(189,91,162,62,['Gestão','da bacia'])+aBox(8,18,150,54,'Plano')+aBox(382,18,150,54,'Enquadramento')+aBox(8,173,150,54,'Outorga')+aBox(382,173,150,54,'Cobrança')+aBox(187,181,166,54,'Informações')+aLine(158,45,189,100)+aLine(382,45,351,100)+aLine(158,199,189,144)+aLine(382,199,351,144)+aLine(270,153,270,181)),
 aForm('rh-enquadramento','Enquadramento: meta, situação e ações',484,150,aChain([['Qualidade','atual'],['Meta de qualidade','para os usos'],['Programa','de ações']],'Meta de enquadramento não equivale à qualidade já atingida')),
 aForm('rh-outorga-fluxo','Uso da água: análise para outorga',648,150,aChain([['Caracterizar','o uso'],['Disponibilidade','e interferências'],['Análise','competente'],['Condições','e monitoramento']],'Esquema de trabalho; verificar domínio e procedimento aplicável')),
 aForm('rh-comite-participacao','Comitê de bacia: representação tripartite',430,230,aBox(145,87,140,60,['Comitê','de bacia'])+aBox(8,18,130,54,['Poder','público'])+aBox(292,18,130,54,'Usuários')+aBox(139,173,152,45,'Sociedade civil')+aLine(138,45,165,87)+aLine(292,45,265,87)+aLine(215,147,215,173)),
 aForm('rh-plano-acoes','Plano de bacia: matriz preenchível',430,220,aBox(8,28,414,168,'')+aPath('M8 70 H422 M8 112 H422 M8 154 H422 M146 28 V196 M284 28 V196','stroke-width="1.6"')+aText(77,49,'Problema')+aText(215,49,'Ação / meta')+aText(353,49,'Responsável')+aText(77,92,'____')+aText(215,92,'____')+aText(353,92,'____')),
 ]],
 ['Monitoramento de quantidade e qualidade',[
 aForm('rh-estacao-monitoramento','Estação: nível, chuva e qualidade',430,245,aPath('M8 148 Q110 121 170 148 T422 148 M8 202 H422')+aBox(26,25,105,58,['Chuva','P (mm)'])+aBox(162,25,105,58,['Nível','h (m)'])+aBox(298,25,105,58,['Qualidade','amostras'])+aPath('M78 83 V128 M214 83 V178 M351 83 V170','stroke-dasharray="5 4"')+aText(215,225,'Coordenadas, datum, período e QA dos dados')),
 aForm('rh-curva-chave','Curva-chave: nível e vazão',360,230,aAxes(360,230,'h (m)','Q (m³/s)')+aPath('M55 168 Q228 158 326 45')+[ [92,164],[162,145],[224,116],[279,78] ].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="4" fill="#C"/>').join('')+aText(184,68,'Calibrar com medições · faixa válida')),
 aForm('rh-secao-vazao','Medição: seção dividida em verticais',360,250,aPath('M8 55 H40 L76 173 H286 L322 55 H352')+aLine(40,74,322,74,true)+[91,147,203,259].map(x=>aLine(x,74,x,173,true)+aText(x,202,'vᵢ')).join('')+aText(180,29,'Q ≈ Σ(vᵢ · Aᵢ)')+aText(180,224,'Velocidade média por subseção')),
 aForm('rh-rede-amostragem','Rede de amostragem: montante e jusante',350,230,aPath('M38 28 L91 83 L145 116 L213 160 L302 206 M259 32 L193 88 L145 116')+[ [75,65,'M'],[221,69,'A'],[240,173,'J'] ].map(([x,y,t])=>'<circle cx="'+x+'" cy="'+y+'" r="10"/>'+aText(x+27,y,t)).join('')+aText(145,207,'M: montante · J: jusante')),
 aForm('rh-serie-dados','Dados hidrológicos: coleta e consistência',484,150,aChain([['Coleta','e metadados'],['Consistência','e lacunas'],['Série validada','e incerteza']],'Registrar correções; não transformar lacuna em zero')),
 ]],
 ['Drenagem e recuperação ambiental',[
 aForm('rh-drenagem-sustentavel','Drenagem: controlar fonte e pico',648,150,aChain([['Reduzir','impermeabilização'],['Reter / infiltrar','onde viável'],['Amortecer','o hidrograma'],['Lançar','com controle']],'Avaliar solo, contaminação, lençol e risco de inundação')),
 aForm('rh-renaturalizacao','Rio: corredor ripário e planície inundável',400,230,aPath('M8 83 H80 L125 137 H275 L320 83 H392 M8 183 H392')+aLine(87,92,313,92,true)+aPath('M32 82 V46 M17 57 L32 40 L47 57 M357 82 V46 M342 57 L357 40 L372 57')+aText(76,24,'Vegetação ripária')+aText(255,61,'Planície inundável')+aText(200,161,'Canal')+aText(200,211,'Recuperar espaço, conectividade e habitat')),
 aForm('rh-poluicao-difusa','Bacia: fontes pontuais e difusas',450,265,aBasin()+aArrow(42,91,111,111)+aArrow(265,92,217,118)+aArrow(173,42,173,103)+aText(91,14,'fontes difusas')+aBox(338,143,104,42,'pontual')+aArrow(338,164,201,164)+aText(175,238,'Carga e transporte dependem da chuva')),
 aForm('rh-erosao-sedimento','Erosão e sedimentos: percurso na bacia',484,150,aChain([['Desagregação','no solo'],['Transporte','pelo escoamento'],['Deposição','rio / reservatório']],'Cobertura, manejo e estruturas reduzem a conectividade')),
 aForm('rh-seguranca-hidrica','Segurança hídrica: risco e resiliência',484,150,aChain([['Perigo','seca / cheia'],['Exposição','e vulnerabilidade'],['Prevenção','e resposta']],'Diversificar fontes, proteger mananciais e planejar contingências')),
 aForm('rh-balanco-preenchivel','Balanço de água: quadro preenchível',420,215,aBox(8,26,404,160,'')+aPath('M8 66 H412 M8 106 H412 M8 146 H412 M270 26 V186','stroke-width="1.6"')+aText(139,46,'Componente / período')+aText(340,46,'Volume (m³)')+aText(139,86,'Entradas')+aText(139,126,'Saídas')+aText(139,166,'ΔS = entradas − saídas')+aText(340,86,'____')+aText(340,126,'____')+aText(340,166,'____')),
 ]],
 ]
};
