// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// Roda antes de tudo, de propósito síncrono (os módulos leem o localStorage logo ao carregar):
// 1. troca a chave de abertura (?k=, de uso único, posta pelo programa no endereço da janela) pelo cookie de acesso
//    desta conta; sem ele, nenhum quadro é lido (desde 29/10/2026, por causa de PCs com várias contas do Windows);
// 2. devolve ao localStorage os ajustes guardados no programa (canetas, barras, pastas, áreas das formas) que faltarem
//    aqui, quando a janela abre num navegador ou perfil novo (ver PERFIL_PROPRIO no server.py).
(() => {
  try {
    const k = new URLSearchParams(location.search).get('k');
    if (k) {
      const x = new XMLHttpRequest();
      x.open('POST', '/api/sessao', false);
      x.setRequestHeader('Content-Type', 'application/json');
      x.send(JSON.stringify({ k }));
      history.replaceState(null, '', location.pathname + location.hash);   // a chave já foi usada: sai do endereço
    }
  } catch { /* sem cookie: a página avisa para abrir pelo atalho */ }
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
