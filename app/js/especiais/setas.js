// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Diagramas autorais. Fontes de fatos e conceitos indicadas acima de cada elemento.
import {page} from './base.js';
export default [
 // Fonte(s) primária(s) consultada(s): https://asq.org/quality-resources/flowchart ; https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
 {id:"esp-setas-semantica",nome:"Setas — construir uma legenda de relações",grupo:"setas",make:()=>page("Setas — construir uma legenda de relações","O significado de uma seta depende da convenção anunciada",
  [
   "<rect x=\"70\" y=\"180\" width=\"270\" height=\"80\" stroke-width=\"2.5\" rx=\"15\" fill=\"#eef5f0\" stroke=\"#1F6E43\"/>",
   "<text x=\"205\" y=\"220\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Ação A</text>",
   "<line x1=\"345\" y1=\"220\" x2=\"655\" y2=\"220\"  stroke=\"#1F6E43\" stroke-width=\"3\" />",
   "<path d=\"M643.4690660038693,226.00312928203928 L655,220 L643.4690660038693,213.99687071796072\" fill=\"none\" stroke-linejoin=\"round\" stroke-linecap=\"round\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<rect x=\"660\" y=\"180\" width=\"270\" height=\"80\" stroke-width=\"2.5\" rx=\"15\" fill=\"#eef5f0\" stroke=\"#1F6E43\"/>",
   "<text x=\"795\" y=\"220\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Ação B</text>",
   "<text x=\"500\" y=\"300\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Fluxo: próxima etapa</text>",
   "<text x=\"190\" y=\"430\" font-size=\"36\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >A</text>",
   "<text x=\"815\" y=\"430\" font-size=\"36\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >B</text>",
   "<line x1=\"240\" y1=\"430\" x2=\"760\" y2=\"430\"  stroke=\"#1F6E43\" stroke-width=\"3\" />",
   "<path d=\"M748.4690660038693,436.00312928203925 L760,430 L748.4690660038693,423.99687071796075\" fill=\"none\" stroke-linejoin=\"round\" stroke-linecap=\"round\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"760\" y1=\"430\" x2=\"240\" y2=\"430\"  stroke=\"#1F6E43\" stroke-width=\"3\" />",
   "<path d=\"M251.5309339961307,423.99687071796075 L240,430 L251.5309339961307,436.00312928203925\" fill=\"none\" stroke-linejoin=\"round\" stroke-linecap=\"round\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"500\" y=\"480\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Relação recíproca: A ↔ B</text>",
   "<line x1=\"100\" y1=\"570\" x2=\"350\" y2=\"570\" stroke=\"#52645a\" stroke-width=\"2.5\" stroke-dasharray=\"8 7\"/>",
   "<line x1=\"350\" y1=\"570\" x2=\"650\" y2=\"570\"  stroke=\"#1F6E43\" stroke-width=\"3\" stroke-dasharray=\"8 7\"/>",
   "<path d=\"M638.4690660038693,576.0031292820393 L650,570 L638.4690660038693,563.9968707179607\" fill=\"none\" stroke-linejoin=\"round\" stroke-linecap=\"round\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"810\" y=\"570\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Hipótese</text>"
  ].join(''),{"h":700,"footer":"Rótulo e padrão de linha complementam a cor; declare a legenda."})},
 // Fonte(s) primária(s) consultada(s): https://openstax.org/books/university-physics-volume-1/pages/2-2-coordinate-systems-and-components-of-a-vector
 {id:"esp-setas-vetor-componentes",nome:"Setas — vetor e componentes",grupo:"setas",make:()=>page("Setas — vetor e componentes","Direção, sentido e módulo são propriedades diferentes",
  [
   "<line x1=\"110\" y1=\"535\" x2=\"880\" y2=\"535\"  stroke=\"#1F6E43\" stroke-width=\"3\" />",
   "<path d=\"M868.4690660038693,541.0031292820393 L880,535 L868.4690660038693,528.9968707179607\" fill=\"none\" stroke-linejoin=\"round\" stroke-linecap=\"round\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"110\" y1=\"535\" x2=\"110\" y2=\"190\"  stroke=\"#1F6E43\" stroke-width=\"3\" />",
   "<path d=\"M116.00312928203928,201.5309339961307 L110,190 L103.99687071796072,201.5309339961307\" fill=\"none\" stroke-linejoin=\"round\" stroke-linecap=\"round\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<text x=\"910\" y=\"535\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >x</text>",
   "<text x=\"110\" y=\"165\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >y</text>",
   "<line x1=\"110\" y1=\"535\" x2=\"690\" y2=\"245\"  stroke=\"#1F6E43\" stroke-width=\"3\" />",
   "<path d=\"M682.3711001267072,255.52615251282603 L690,245 L677.0017380657636,244.78742839093857\" fill=\"none\" stroke-linejoin=\"round\" stroke-linecap=\"round\" stroke=\"#1F6E43\" stroke-width=\"3\"/>",
   "<line x1=\"690\" y1=\"245\" x2=\"690\" y2=\"535\" stroke=\"#52645a\" stroke-width=\"2.5\" stroke-dasharray=\"8 7\"/>",
   "<line x1=\"110\" y1=\"245\" x2=\"690\" y2=\"245\" stroke=\"#52645a\" stroke-width=\"2.5\" stroke-dasharray=\"8 7\"/>",
   "<text x=\"470\" y=\"315\" font-size=\"40\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"700\">v</text>",
   "<text x=\"400\" y=\"585\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >vₓ</text>",
   "<text x=\"70\" y=\"385\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >vᵧ</text>",
   "<path d=\"M210,535 A100,100 0 0 0 199,490\" fill=\"none\" stroke-width=\"2.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\" stroke=\"#1F6E43\"/>",
   "<text x=\"240\" y=\"505\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >θ</text>",
   "<rect x=\"720\" y=\"190\" width=\"230\" height=\"130\" stroke-width=\"2.5\" rx=\"15\" fill=\"#eef5f0\" stroke=\"#1F6E43\"/>",
   "<text x=\"835\" y=\"219\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Sentido: ponta</text>",
   "<text x=\"835\" y=\"255\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >Módulo:</text>",
   "<text x=\"835\" y=\"291\" font-size=\"26\" font-family=\"Segoe UI, Arial, sans-serif\" fill=\"#17261e\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\" >comprimento</text>"
  ].join(''),{"h":700,"footer":"Em eixos ortogonais: vₓ = |v| cos θ; vᵧ = |v| sen θ."})},
];
