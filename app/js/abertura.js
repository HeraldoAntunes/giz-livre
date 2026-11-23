// Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
// P-ABERTURA C (22/11/2026): roda no <head>, antes de qualquer pintura. Se o endereço é o da galeria, ela aparece na
// hora com o esqueleto dos cartões (no index.html) enquanto os módulos carregam e os quadros chegam; antes, a página
// ficava lisa por cerca de meio segundo. O route() de main.js tira a marca quando assume.
(() => {
  const h = location.hash;
  if (h === '' || h === '#' || h === '#/' || h.startsWith('#/p/')) document.documentElement.classList.add('abrindo-galeria');
})();
