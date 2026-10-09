// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Diagramas autorais. Fontes de fatos e conceitos indicadas acima de cada elemento.
import {page,text,line,rect,ref,refTable} from './base.js';
const ANTIGOS = [
 // Fonte(s) primária(s) consultada(s): https://online.berklee.edu/takenote/circle-of-fifths-the-key-to-unlocking-harmonic-understanding/
 {id:"esp-musica-escala-do",nome:"Música — escala diatônica de Dó maior",grupo:"musica",make:()=>page("Música — escala diatônica de Dó maior","Notas naturais e intervalos consecutivos da escala maior",
  [
   "<line x1=\"50\" y1=\"250\" x2=\"950\" y2=\"250\" stroke=\"#52645a\" stroke-width=\"2.5\" />",
   "<line x1=\"50\" y1=\"274\" x2=\"950\" y2=\"274\" stroke=\"#52645a\" stroke-width=\"2.5\" />",
   "<line x1=\"50\" y1=\"298\" x2=\"950\" y2=\"298\" stroke=\"#52645a\" stroke-width=\"2.5\" />",
   "<line x1=\"50\" y1=\"322\" x2=\"950\" y2=\"322\" stroke=\"#52645a\" stroke-width=\"2.5\" />",
   "<line x1=\"50\" y1=\"346\" x2=\"950\" y2=\"346\" stroke=\"#52645a\" stroke-width=\"2.5\" />",
   "<ellipse cx=\"90\" cy=\"370\" rx=\"17\" ry=\"12\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"107\" y1=\"370\" x2=\"107\" y2=\"303\" stroke-width=\"2.5\" stroke=\"#1F6E43\"/>",
   "<line x1=\"65\" y1=\"370\" x2=\"115\" y2=\"370\" stroke=\"#52645a\" stroke-width=\"2.5\" />",
   "<text x=\"90\" y=\"425\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Dó</text>",
   "<text x=\"90\" y=\"475\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >I</text>",
   "<ellipse cx=\"207\" cy=\"358\" rx=\"17\" ry=\"12\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"224\" y1=\"358\" x2=\"224\" y2=\"291\" stroke-width=\"2.5\" stroke=\"#1F6E43\"/>",
   "<text x=\"207\" y=\"425\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Ré</text>",
   "<text x=\"207\" y=\"475\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >II</text>",
   "<ellipse cx=\"324\" cy=\"346\" rx=\"17\" ry=\"12\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"341\" y1=\"346\" x2=\"341\" y2=\"279\" stroke-width=\"2.5\" stroke=\"#1F6E43\"/>",
   "<text x=\"324\" y=\"425\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Mi</text>",
   "<text x=\"324\" y=\"475\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >III</text>",
   "<ellipse cx=\"441\" cy=\"334\" rx=\"17\" ry=\"12\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"458\" y1=\"334\" x2=\"458\" y2=\"267\" stroke-width=\"2.5\" stroke=\"#1F6E43\"/>",
   "<text x=\"441\" y=\"425\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Fá</text>",
   "<text x=\"441\" y=\"475\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >IV</text>",
   "<ellipse cx=\"558\" cy=\"322\" rx=\"17\" ry=\"12\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"575\" y1=\"322\" x2=\"575\" y2=\"255\" stroke-width=\"2.5\" stroke=\"#1F6E43\"/>",
   "<text x=\"558\" y=\"425\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Sol</text>",
   "<text x=\"558\" y=\"475\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >V</text>",
   "<ellipse cx=\"675\" cy=\"310\" rx=\"17\" ry=\"12\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"692\" y1=\"310\" x2=\"692\" y2=\"243\" stroke-width=\"2.5\" stroke=\"#1F6E43\"/>",
   "<text x=\"675\" y=\"425\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Lá</text>",
   "<text x=\"675\" y=\"475\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >VI</text>",
   "<ellipse cx=\"792\" cy=\"298\" rx=\"17\" ry=\"12\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"809\" y1=\"298\" x2=\"809\" y2=\"231\" stroke-width=\"2.5\" stroke=\"#1F6E43\"/>",
   "<text x=\"792\" y=\"425\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Si</text>",
   "<text x=\"792\" y=\"475\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >VII</text>",
   "<ellipse cx=\"909\" cy=\"286\" rx=\"17\" ry=\"12\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"926\" y1=\"286\" x2=\"926\" y2=\"219\" stroke-width=\"2.5\" stroke=\"#1F6E43\"/>",
   "<text x=\"909\" y=\"425\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Dó</text>",
   "<text x=\"909\" y=\"475\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >VIII</text>",
   "<text x=\"500\" y=\"190\" font-size=\"28\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Clave de sol: sequência Dó4 → Dó5</text>",
   "<text x=\"148.5\" y=\"550\" font-size=\"32\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >T</text>",
   "<text x=\"265.5\" y=\"550\" font-size=\"32\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >T</text>",
   "<text x=\"382.5\" y=\"550\" font-size=\"32\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >S</text>",
   "<text x=\"499.5\" y=\"550\" font-size=\"32\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >T</text>",
   "<text x=\"616.5\" y=\"550\" font-size=\"32\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >T</text>",
   "<text x=\"733.5\" y=\"550\" font-size=\"32\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >T</text>",
   "<text x=\"850.5\" y=\"550\" font-size=\"32\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >S</text>",
   "<text x=\"500\" y=\"595\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >T = tom (2 semitons) • S = semitom</text>"
  ].join(''),{"h":700,"footer":"Mi–Fá e Si–Dó: semitom. Os demais passos: tom."})},
 // Fonte(s) primária(s) consultada(s): https://online.berklee.edu/takenote/circle-of-fifths-the-key-to-unlocking-harmonic-understanding/
 {id:"esp-musica-circulo-quintas",nome:"Música — círculo de quintas",grupo:"musica",make:()=>page("Música — círculo de quintas","Tonalidades maiores • leitura com equivalências enarmônicas",
  [
   "<circle cx=\"500\" cy=\"385\" r=\"170\" fill=\"#fff\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<circle cx=\"500\" cy=\"175\" r=\"40\" fill=\"#eef5f0\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"500\" y=\"175\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">C</text>",
   "<circle cx=\"605\" cy=\"203.13466520526788\" r=\"40\" fill=\"#eef5f0\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"605\" y=\"203.13466520526788\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">G</text>",
   "<circle cx=\"681.8653347947321\" cy=\"280\" r=\"40\" fill=\"#eef5f0\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"681.8653347947321\" y=\"280\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">D</text>",
   "<circle cx=\"710\" cy=\"385\" r=\"40\" fill=\"#eef5f0\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"710\" y=\"385\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">A</text>",
   "<circle cx=\"681.8653347947321\" cy=\"490\" r=\"40\" fill=\"#eef5f0\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"681.8653347947321\" y=\"490\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">E</text>",
   "<circle cx=\"605\" cy=\"566.8653347947321\" r=\"40\" fill=\"#eef5f0\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"605\" y=\"566.8653347947321\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">B</text>",
   "<circle cx=\"500\" cy=\"595\" r=\"40\" fill=\"#eef5f0\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"500\" y=\"595\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">F♯/G♭</text>",
   "<circle cx=\"395.00000000000006\" cy=\"566.8653347947321\" r=\"40\" fill=\"#eef5f0\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"395.00000000000006\" y=\"566.8653347947321\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">D♭</text>",
   "<circle cx=\"318.1346652052679\" cy=\"490.00000000000006\" r=\"40\" fill=\"#eef5f0\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"318.1346652052679\" y=\"490.00000000000006\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">A♭</text>",
   "<circle cx=\"290\" cy=\"385\" r=\"40\" fill=\"#eef5f0\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"290\" y=\"385\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">E♭</text>",
   "<circle cx=\"318.1346652052679\" cy=\"280\" r=\"40\" fill=\"#eef5f0\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"318.1346652052679\" y=\"280\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">B♭</text>",
   "<circle cx=\"394.9999999999999\" cy=\"203.1346652052679\" r=\"40\" fill=\"#eef5f0\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"394.9999999999999\" y=\"203.1346652052679\" font-size=\"30\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">F</text>",
   "<text x=\"500\" y=\"370\" font-size=\"28\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Quintas justas</text>",
   "<text x=\"500\" y=\"408\" font-size=\"28\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >no sentido horário</text>",
   "<text x=\"120\" y=\"310\" font-size=\"50\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >♭</text>",
   "<text x=\"880\" y=\"310\" font-size=\"50\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >♯</text>",
   "<text x=\"130\" y=\"380\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >F → C</text>",
   "<text x=\"130\" y=\"416\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >menos bemóis</text>",
   "<text x=\"870\" y=\"380\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >C → G</text>",
   "<text x=\"870\" y=\"416\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >mais sustenidos</text>"
  ].join(''),{"h":700,"footer":"C = Dó • F♯/G♭: mesma altura no temperamento igual, grafias diferentes."})},
 // Fonte(s) primária(s) consultada(s): https://openmusictheory.github.io/meter.html
 {id:"esp-musica-compassos-simples",nome:"Música — compassos simples",grupo:"musica",make:()=>page("Música — compassos simples","O numerador conta tempos; o denominador identifica a figura",
  [
   "<text x=\"90\" y=\"202\" font-size=\"40\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >2</text>",
   "<text x=\"90\" y=\"249\" font-size=\"40\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >4</text>",
   "<text x=\"300\" y=\"220\" font-size=\"28\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Binário simples</text>",
   "<ellipse cx=\"560\" cy=\"230\" rx=\"14\" ry=\"10\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"574\" y1=\"230\" x2=\"574\" y2=\"184\"  stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"560\" y=\"276\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >1</text>",
   "<ellipse cx=\"645\" cy=\"230\" rx=\"14\" ry=\"10\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"659\" y1=\"230\" x2=\"659\" y2=\"184\"  stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"645\" y=\"276\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >2</text>",
   "<line x1=\"910\" y1=\"180\" x2=\"910\" y2=\"270\" stroke=\"#52645a\" stroke-width=\"2.5\" />",
   "<text x=\"90\" y=\"344\" font-size=\"40\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >3</text>",
   "<text x=\"90\" y=\"391\" font-size=\"40\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >4</text>",
   "<text x=\"300\" y=\"362\" font-size=\"28\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Ternário simples</text>",
   "<ellipse cx=\"560\" cy=\"372\" rx=\"14\" ry=\"10\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"574\" y1=\"372\" x2=\"574\" y2=\"326\"  stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"560\" y=\"418\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >1</text>",
   "<ellipse cx=\"645\" cy=\"372\" rx=\"14\" ry=\"10\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"659\" y1=\"372\" x2=\"659\" y2=\"326\"  stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"645\" y=\"418\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >2</text>",
   "<ellipse cx=\"730\" cy=\"372\" rx=\"14\" ry=\"10\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"744\" y1=\"372\" x2=\"744\" y2=\"326\"  stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"730\" y=\"418\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >3</text>",
   "<line x1=\"910\" y1=\"322\" x2=\"910\" y2=\"412\" stroke=\"#52645a\" stroke-width=\"2.5\" />",
   "<text x=\"90\" y=\"486\" font-size=\"40\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >4</text>",
   "<text x=\"90\" y=\"533\" font-size=\"40\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >4</text>",
   "<text x=\"300\" y=\"504\" font-size=\"28\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Quaternário simples</text>",
   "<ellipse cx=\"560\" cy=\"514\" rx=\"14\" ry=\"10\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"574\" y1=\"514\" x2=\"574\" y2=\"468\"  stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"560\" y=\"560\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >1</text>",
   "<ellipse cx=\"645\" cy=\"514\" rx=\"14\" ry=\"10\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"659\" y1=\"514\" x2=\"659\" y2=\"468\"  stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"645\" y=\"560\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >2</text>",
   "<ellipse cx=\"730\" cy=\"514\" rx=\"14\" ry=\"10\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"744\" y1=\"514\" x2=\"744\" y2=\"468\"  stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"730\" y=\"560\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >3</text>",
   "<ellipse cx=\"815\" cy=\"514\" rx=\"14\" ry=\"10\" fill=\"#1F6E43\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"829\" y1=\"514\" x2=\"829\" y2=\"468\"  stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"815\" y=\"560\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >4</text>",
   "<line x1=\"910\" y1=\"464\" x2=\"910\" y2=\"554\" stroke=\"#52645a\" stroke-width=\"2.5\" />",
   "<text x=\"500\" y=\"610\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Nestes exemplos: 4 indica semínima; cada compasso tem 2, 3 ou 4 tempos.</text>"
  ].join(''),{"h":700,"footer":"A indicação de compasso não é uma divisão aritmética de números."})},
];

// >>> CONSULTA (gerado): material de consulta: só dados fixos, sem texto de aula. Ver docs/BRIEF-MATERIAL-DE-CONSULTA.md.
export const CONSULTA = [
// Fonte: https://online.berklee.edu/takenote/circle-of-fifths-the-key-to-unlocking-harmonic-understanding/
{id:"esp-musica-circulo-quintas",nome:"Círculo de quintas",grupo:"musica",make(){
 const W=1000,H=1090,cx=500,cy=520;
 const M=['C','G','D','A','E','B','F♯ / G♭','D♭','A♭','E♭','B♭','F'],m=['Am','Em','Bm','F♯m','C♯m','G♯m','D♯m / E♭m','B♭m','Fm','Cm','Gm','Dm'];
 const ac=['0','1♯','2♯','3♯','4♯','5♯','6♯ / 6♭','5♭','4♭','3♭','2♭','1♭'];
 let b='<circle cx="'+cx+'" cy="'+cy+'" r="360" fill="#f5f7f5" stroke="#1F6E43" stroke-width="2"/>'+'<circle cx="'+cx+'" cy="'+cy+'" r="250" fill="#fff" stroke="#1F6E43" stroke-width="2"/>'+'<circle cx="'+cx+'" cy="'+cy+'" r="150" fill="#f5f7f5" stroke="#1F6E43" stroke-width="2"/>';
 for(let i=0;i<12;i++){const a=(i*30-90-15)*Math.PI/180;b+=line((cx+150*Math.cos(a)).toFixed(1),(cy+150*Math.sin(a)).toFixed(1),(cx+360*Math.cos(a)).toFixed(1),(cy+360*Math.sin(a)).toFixed(1),'stroke="#b9c8be" stroke-width="1.5"');
  const t=(i*30-90)*Math.PI/180,p=r=>[(cx+r*Math.cos(t)).toFixed(1),(cy+r*Math.sin(t)).toFixed(1)];
  b+=text(...p(305),M[i],i===6?24:32,'font-weight="700" fill="#1F6E43"')+text(...p(200),m[i],i===6?19:24)+text(...p(400),ac[i],22,'fill="#58635c"');}
 b+=text(cx,cy-12,'maiores (anel externo)',19,'fill="#58635c"')+text(cx,cy+16,'relativas menores (interno)',19,'fill="#58635c"');
 b+=text(24,H-104,'C Dó · D Ré · E Mi · F Fá · G Sol · A Lá · B Si',19,'text-anchor="start"')+text(24,H-78,'Por fora: número de ♯ ou ♭ na armadura.',19,'text-anchor="start"');
 return ref('Círculo de quintas: tonalidades e armaduras',b,{w:W,h:H,fonte:'Fonte: Berklee Online, Circle of Fifths.'});
}},
];
// Os antigos com o mesmo id foram refeitos acima; os demais ficam ocultos.
export default [...ANTIGOS.filter(e=>!CONSULTA.some(c=>c.id===e.id)),...CONSULTA];
// <<< CONSULTA
