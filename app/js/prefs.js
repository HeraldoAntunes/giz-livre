// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Antes de tudo: devolve ao localStorage os ajustes guardados no programa (canetas, barras, pastas, áreas das formas)
// que faltarem aqui. Acontece quando a janela abre num navegador ou perfil novo (ver PERFIL_PROPRIO no server.py).
// Script comum e síncrono de propósito: os módulos leem o localStorage logo ao carregar.
(() => {
  try {
    const x = new XMLHttpRequest();
    x.open('GET', '/api/prefs', false);
    x.send();
    if (x.status !== 200) return;
    const p = JSON.parse(x.responseText || '{}');
    for (const [k, v] of Object.entries(p))
      if (k.startsWith('lousa.') && typeof v === 'string' && localStorage.getItem(k) === null) localStorage.setItem(k, v);
  } catch { /* sem cópia: segue com o que houver */ }
})();
