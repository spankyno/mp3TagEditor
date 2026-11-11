// Aplica el tema guardado (o el del sistema) antes del primer pintado, para evitar el parpadeo claro/oscuro.
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var dark = saved === 'dark' || saved === 'light'
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
