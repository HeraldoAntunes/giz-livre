// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Ícones: Fluent UI System Icons oficiais (vendor) quando existem; desenhados à mão para o resto
import { FLUENT } from './fluent-icons.js';
const s = (body, vb = '0 0 24 24') =>
  `<svg viewBox="${vb}" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICON = {
  back: s('<path d="M15 5l-7 7 7 7"/>'),
  undo: s('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>'),
  redo: s('<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>'),
  more: s('<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>'),
  eraser: s('<path d="M7 20h12"/><path d="M4.5 14.5l9-9a2 2 0 012.8 0l3.2 3.2a2 2 0 010 2.8L12 19H8.5z"/><path d="M9 10l6 6"/>'),
  lasso: s('<path d="M12 4c5 0 9 2.5 9 6s-4 6-9 6c-1.4 0-2.7-.2-3.8-.5"/><path d="M12 4C7 4 3 6.5 3 10c0 1.6.8 3 2.2 4.1"/><circle cx="6.5" cy="17" r="2"/><path d="M6.5 19c0 1.5-1 2.5-2.5 2.5"/>'),
  select: s('<path d="M6 3l12 9-5.5 1L9.5 19z"/>'),
  ruler: s('<rect x="2.5" y="8" width="19" height="8" rx="1.5" transform="rotate(-30 12 12)"/><path d="M7.3 12.5l1 1.7M10 11l1.5 2.6M12.6 9.5l1 1.7M15.2 8l1.5 2.6"/>'),
  shapeInk: s('<path d="M3 17c2-6 4-9 6-9s2 6 4 6 3-3 4-5"/><rect x="14" y="13" width="7" height="7" rx="1"/>'),
  laser: s('<circle cx="17" cy="7" r="3" fill="#e81224" stroke="#e81224"/><path d="M3 21c3-1 6-4 8-7s3-4 5-5" stroke="#e81224" opacity=".5"/>'),
  text: s('<path d="M5 6V4h14v2"/><path d="M12 4v16"/><path d="M9 20h6"/>'),
  note: s('<path d="M5 4h14v10l-6 6H5z"/><path d="M13 20v-6h6"/>'),
  shapes: s('<circle cx="8" cy="8" r="4.5"/><rect x="11" y="11" width="9" height="9" rx="1"/>'),
  image: s('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
  zoomIn: s('<path d="M12 5v14M5 12h14"/>'),
  zoomOut: s('<path d="M5 12h14"/>'),
  fit: s('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  copy: s('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>'),
  duplicate: s('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M14 11v6M11 14h6"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>'),
  trash: s('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  front: s('<rect x="9" y="9" width="11" height="11" rx="1.5" fill="currentColor" fill-opacity=".25"/><path d="M15 9V5a1 1 0 00-1-1H5a1 1 0 00-1 1v9a1 1 0 001 1h4"/>'),
  back2: s('<rect x="4" y="4" width="11" height="11" rx="1.5" fill="currentColor" fill-opacity=".25"/><path d="M9 15v4a1 1 0 001 1h9a1 1 0 001-1v-9a1 1 0 00-1-1h-4"/>'),
  edit: s('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>'),
  color: s('<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>'),
  fullscreen: s('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>', '0 0 24 24'),
  import: s('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v3h16v-3"/>'),
  sparkle: s('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>'),
  restore: s('<path d="M4 12a8 8 0 108-8 8.2 8.2 0 00-5.7 2.3L4 8.5"/><path d="M4 4v4.5h4.5"/>'),
  pen: s('<path d="M4 20l1.5-5L16 4.5a2.1 2.1 0 013 3L8.5 18z"/><path d="M14 6.5l3 3"/>'),
  paper: s('<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
  search: s('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),
  line: s('<path d="M5 19L19 5"/>'),
  arrow: s('<path d="M5 19L19 5M11 5h8v8"/>'),
  rect: s('<rect x="4" y="6" width="16" height="12" rx="1"/>'),
  ellipse: s('<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>'),
  triangle: s('<path d="M12 4l9 16H3z"/>'),
  lined: s('<path d="M5 19L19 5" stroke-dasharray="3 3"/>'),
  arrow2: s('<path d="M5 19L19 5M11 5h8v8M13 19H5v-8"/>'),
  arrowd: s('<path d="M5 19L19 5" stroke-dasharray="3 3"/><path d="M11 5h8v8"/>'),
  lock: s('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  unlock: s('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.8"/>'),
  // ferramentas do professor: esquadro e lápis cruzados (substitui o livro)
  tools: s('<path d="M3.5 20.5V6.5l14 14z"/><path d="M7 17v-3.5l3.5 3.5z"/><path d="M14.5 3.5l6 6-9 9-3 .5.5-3z"/><path d="M13 5l6 6"/>'),
  clock: s('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>'),
  group: s('<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 2.5"/><rect x="6.5" y="6.5" width="6" height="6" rx="1"/><circle cx="15" cy="15" r="3"/>'),
  ungroup: s('<rect x="3" y="3" width="9" height="9" rx="1.5"/><circle cx="16.5" cy="16.5" r="4"/><path d="M14 4h6v6M10 20H4v-6" stroke-dasharray="2 2"/>'),
  folder: s('<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>'),
  expand: s('<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/><path d="M9 12h6"/>'),
  play: s('<path d="M7 5l12 7-12 7z"/>'),
  fontAa: s('<path d="M3 19l5-13 5 13M4.8 14.5h6.4"/><path d="M20 19v-5.5a2.5 2.5 0 00-5 0M20 16.5c-2.8-.4-5 .3-5 1.7 0 1.6 3.5 1.6 5-.7"/>'),
  inkText: s('<path d="M3 9c1.5-3 3-3 3.5-1s1 3 2.5 1 2-3 3-1"/><path d="M13 13l3 3-3 3" stroke-width="1.4"/><path d="M15 9h6M18 9v9"/>'),
  lupa: s('<circle cx="10" cy="9" r="5.5"/><path d="M14 13l4 4"/><path d="M3 21h18" stroke-dasharray="2 2"/>'),
  fx: s('<path d="M4 3v17h17"/><path d="M6 17c3-9 5-10 7-6s4 3 7-5"/>'),
  keyboard: s('<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h1M9 10h1M12 10h1M15 10h1M18 10h0M7 14h10"/>'),
  hlPen: s('<path d="M9 15l-4 4h5l2-2"/><path d="M9 15l7.5-7.5a2.1 2.1 0 013 3L12 18z"/><path d="M4 21h16" stroke-width="3" opacity=".45"/>'),
  pause: s('<path d="M8 5v14M16 5v14"/>'),
};

// substitui pelos ícones oficiais da Microsoft (mesmo estilo do Whiteboard)
const MAP = {
  back: 'arrow_left', undo: 'arrow_undo', redo: 'arrow_redo', more: 'more_horizontal', eraser: 'eraser',
  lasso: 'lasso', select: 'cursor', ruler: 'ruler', text: 'text_t', note: 'note', shapes: 'shapes', image: 'image',
  zoomIn: 'zoom_in', zoomOut: 'zoom_out', fit: 'zoom_fit', copy: 'copy', trash: 'delete', edit: 'edit', color: 'color',
  fullscreen: 'full_screen_maximize', plus: 'add', import: 'arrow_import', search: 'search', sparkle: 'sparkle',
  pen: 'pen', paper: 'document_one_page', slides: 'slide_multiple', slideAdd: 'slide_add', pdf: 'document_pdf',
  print: 'print', download: 'arrow_download', timer: 'timer', chevL: 'chevron_left', chevR: 'chevron_right',
  close: 'dismiss', rotate: 'arrow_rotate_clockwise', curtain: 'eye_off', spotlight: 'lightbulb', formula: 'math_formula',
  library: 'book_open', grid: 'grid', present: 'presenter', gallery: 'content_view_gallery', strip: 'dock_row',
  settings: 'settings', ok: 'checkmark_circle', warn: 'warning', table: 'table', half: 'circle_half_fill',
};
for (const [k, f] of Object.entries(MAP)) if (FLUENT[f]) ICON[k] = FLUENT[f];
// 1.2.2: ícones próprios onde o Fluent repetia ou não dizia o que é
ICON.ocr = s('<path d="M2.5 15.5c1.2-3.4 2.6-4.2 3.3-2.4.6 1.6 1.5 2.7 2.6.4.8-1.6 1.5-1.9 2.1-.3"/><path d="M11.5 18.5h2.5m-1 -1.2 1 1.2-1 1.2"/><path d="M15 6.5h7M18.5 6.5v12"/>');   // escrita → texto
ICON.cortina = s('<path d="M3 4h18"/><path d="M5 4v10h14V4"/><path d="M5 7.5h14M5 11h14"/><path d="M12 14v4"/><circle cx="12" cy="19.6" r="1.4"/>');   // persiana

// caneta desenhada com a cor da tinta (como a bandeja do Whiteboard)
let penUid = 0;
const isLight = c => { const h = c.replace('#', ''); return (0.299 * parseInt(h.slice(0, 2), 16) + 0.587 * parseInt(h.slice(2, 4), 16) + 0.114 * parseInt(h.slice(4, 6), 16)) > 200; };
export function penIcon(color, kind = 'pen') {
  const id = 'pg' + (++penUid);
  const edge = isLight(color) ? ' stroke="#8a8886" stroke-width=".6"' : '';
  const body = `<linearGradient id="${id}" x1="0" x2="1">
      <stop offset="0" stop-color="#d9d9d9"/><stop offset=".35" stop-color="#ffffff"/><stop offset=".7" stop-color="#f2f2f2"/><stop offset="1" stop-color="#c8c8c8"/>
    </linearGradient>
    <linearGradient id="${id}c" x1="0" x2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".4" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".25"/>
    </linearGradient>`;
  if (kind === 'highlighter') {
    // marca-texto: corpo largo, ponta chanfrada translúcida
    return `<svg viewBox="0 0 30 60" width="30" height="60"><defs>${body}</defs>
      <path d="M10.5 9.5 L18.5 4.5 L20 10 Z" fill="${color}" opacity=".9"${edge}/>
      <path d="M9 10 H21 L23.5 20 H6.5 Z" fill="url(#${id})" stroke="#a19f9d" stroke-width=".7"/>
      <rect x="5.5" y="20" width="19" height="44" rx="3.5" fill="url(#${id})" stroke="#a19f9d" stroke-width=".7"/>
      <rect x="5.5" y="24" width="19" height="11" fill="${color}" opacity=".75"/>
      <rect x="5.5" y="24" width="19" height="11" fill="url(#${id}c)"/>
    </svg>`;
  }
  // caneta: ponta cônica colorida, cone claro, anel de cor no corpo
  return `<svg viewBox="0 0 30 60" width="30" height="60"><defs>${body}</defs>
    <path d="M13.2 6.5 L15 1.5 L16.8 6.5 Z" fill="${color}"${edge}/>
    <path d="M12.6 6.5 H17.4 L22 19 H8 Z" fill="url(#${id})" stroke="#a19f9d" stroke-width=".7"/>
    <rect x="8" y="19" width="14" height="45" rx="3" fill="url(#${id})" stroke="#a19f9d" stroke-width=".7"/>
    <rect x="8" y="22.5" width="14" height="7.5" fill="${color}"${edge}/>
    <rect x="8" y="22.5" width="14" height="7.5" fill="url(#${id}c)"/>
    <path d="M10.4 33 V60" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
  </svg>`;
}
