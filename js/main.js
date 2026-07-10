/* main.js — init, hash router, service worker. Versioning triple partner:
   version.json + LOCAL_VERSION here + CACHE_VERSION in sw.js (bump via /release). */
(function () {
  'use strict';

  var LOCAL_VERSION = '0.1.0';

  var SCREENS = ['home', 'write', 'letters', 'about'];

  function route() {
    var hash = (location.hash || '#home').replace('#', '');
    if (SCREENS.indexOf(hash) === -1) hash = 'home';
    SCREENS.forEach(function (s) {
      var eln = document.getElementById('screen-' + s);
      if (eln) eln.hidden = (s !== hash);
    });
    document.querySelectorAll('.nav-link').forEach(function (a) {
      a.classList.toggle('nav-on', a.getAttribute('href') === '#' + hash);
    });
    if (hash === 'write') TesseraCompose.start();
    if (hash === 'letters') TesseraRegistry.render();
    window.scrollTo(0, 0);
  }

  function init() {
    window.addEventListener('hashchange', route);
    route();

    var closeBtn = document.getElementById('print-close');
    if (closeBtn) closeBtn.addEventListener('click', TesseraPrint.hide);
    var printBtn = document.getElementById('print-go');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

    var v = document.getElementById('version-note');
    if (v) v.textContent = 'v' + LOCAL_VERSION;

    /* service worker: only over http(s) — file:// stays a first-class home */
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline shell is a convenience, not a promise */ });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
