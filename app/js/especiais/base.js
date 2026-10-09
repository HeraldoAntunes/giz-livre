// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Primitivas locais para os elementos didáticos. attrs contém somente atributos SVG escritos no código.
export const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const defaults = (attrs, values) => Object.entries(values).filter(([key])=>!new RegExp('(?:^|\\s)'+key+'\\s*=').test(attrs)).map(([key,value])=>key+'="'+value+'"').join(' ')+' '+attrs;
export const text = (x,y,value,size=26,attrs='') => '<text x="'+x+'" y="'+y+'" '+defaults(attrs,{'font-size':size,'font-family':'Segoe UI, Arial, sans-serif',fill:'#17261e',stroke:'none','text-anchor':'middle','dominant-baseline':'central'})+'>'+esc(value)+'</text>';
export const line = (x1,y1,x2,y2,attrs='') => '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" '+defaults(attrs,{stroke:'#52645a','stroke-width':2.5})+'/>';
export const rect = (x,y,w,h,attrs='') => '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" '+defaults(attrs,{fill:'none',stroke:'#52645a','stroke-width':2.5})+'/>';
export const path = (d,attrs='') => '<path d="'+d+'" '+defaults(attrs,{fill:'none',stroke:'#52645a','stroke-width':2.5,'stroke-linejoin':'round','stroke-linecap':'round'})+'/>';
export function page(title,subtitle,body,{w=1000,h=700,accent='#1F6E43',footer=''}={}){
 const header=rect(0,0,w,h,'fill="#ffffff" stroke="none"')+rect(0,0,w,10,'fill="'+accent+'" stroke="none"')+text(w/2,52,title,34,'font-weight="700" fill="'+accent+'"')+text(w/2,103,subtitle,26)+line(35,132,w-35,132,'stroke="#d4ded7"');
 return {svg:'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" fill="#17261e" stroke="none">'+header+body+(footer?line(35,h-65,w-35,h-65,'stroke="#d4ded7"')+text(w/2,h-43,footer,26):'')+'</svg>',w,h};
}
// colWidths: pesos relativos (ou larguras proporcionais), normalizados para width.
export function table(headers,rows,{x=35,y=150,width=930,rowH=58,font=26,colWidths,accent='#1F6E43'}={}){
 const weights=colWidths||headers.map(()=>1),sum=weights.reduce((a,b)=>a+b,0),widths=weights.map(n=>n/sum*width);let body=rect(x,y,width,rowH*(rows.length+1),'fill="#fff" stroke="#b9c8be"');body+=rect(x,y,width,rowH,'fill="'+accent+'" stroke="none"');let xx=x;
 for(let c=0;c<headers.length;c++){body+=text(xx+widths[c]/2,y+rowH/2,headers[c],font,'fill="#fff" font-weight="700"');if(c)body+=line(xx,y,xx,y+rowH*(rows.length+1),'stroke="#b9c8be"');xx+=widths[c];}
 rows.forEach((row,r)=>{const yy=y+rowH*(r+1);if(r%2===0)body+=rect(x,yy,width,rowH,'fill="#f1f6f2" stroke="none"');body+=line(x,yy,x+width,yy,'stroke="#b9c8be"');let left=x;row.forEach((value,c)=>{body+=text(left+widths[c]/2,yy+rowH/2,value,font);left+=widths[c];});});
 // Linhas verticais ficam acima das faixas de fundo.
 xx=x;for(let c=1;c<widths.length;c++){xx+=widths[c-1];body+=line(xx,y+rowH,xx,y+rowH*(rows.length+1),'stroke="#b9c8be"');}return body;
}

// Consulta: corpo a partir de y=64; notas e fonte são linhas discretas, sem moldura.
export function ref(titulo,corpo,{w=1040,h=600,fonte='',notas=[]}={}){
 const ns=[]; // notas só no código: na tela, só a linha de fonte (pedido do professor)
 let rodape='';
 ns.forEach((nota,i)=>{rodape+=text(24,h-40-(fonte?26:0)-(ns.length-1-i)*24,nota,18,'text-anchor="start" fill="#58635c"');});
 if(fonte)rodape+=text(24,h-40,fonte,18,'text-anchor="start" fill="#58635c"');
 const body=rect(0,0,w,h,'fill="#fff" stroke="none"')+text(24,40,titulo,24,'text-anchor="start" font-weight="700" fill="#1F6E43"')+corpo+rodape;
 return {svg:'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" fill="#17261e" stroke="none">'+body+'</svg>',w,h};
}

// Colunas: string ou {label,weight,align}; alinhamentos start/middle/end. Células aceitam \n.
export function refTable(titulo,colunas,linhas,{w=1040,font=22,rowH=38,headH=44,fonte='',notas=[]}={}){
 const cs=colunas.map(c=>typeof c==='string'?{label:c,weight:1,align:'start'}:{weight:1,align:'start',...c});
 const soma=cs.reduce((s,c)=>s+c.weight,0),larguras=cs.map(c=>c.weight/soma*(w-48));
 const ns=[],bottom=64+headH+linhas.length*rowH;
 const h=bottom+24+ns.length*24+(fonte?26:0)+24;
 let b=rect(24,64,w-48,headH,'fill="#e7eee9" stroke="none"');
 const cell=(valor,c,x,y,altura,bold=false)=>{const partes=String(valor).split('\n');return partes.map((p,i)=>text(x+(cs[c].align==='end'?larguras[c]-10:cs[c].align==='middle'?larguras[c]/2:10),y+altura/2+(i-(partes.length-1)/2)*(font+3),p,font,'text-anchor="'+cs[c].align+'"'+(bold?' font-weight="700"':''))).join('');};
 let x=24;cs.forEach((c,i)=>{b+=cell(c.label,i,x,64,headH,true);x+=larguras[i];});
 linhas.forEach((row,r)=>{const y=64+headH+r*rowH;if(r%2===0)b+=rect(24,y,w-48,rowH,'fill="#f5f7f5" stroke="none"');b+=line(24,y,w-24,y,'stroke="#d5ddd7" stroke-width="1"');let xx=24;row.forEach((v,c)=>{b+=cell(v,c,xx,y,rowH);xx+=larguras[c];});});
 b+=line(24,bottom,w-24,bottom,'stroke="#b9c8be" stroke-width="1"');
 return ref(titulo,b,{w,h,fonte,notas:ns});
}


