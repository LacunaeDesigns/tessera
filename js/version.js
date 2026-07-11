/* version.js — versioning triple partner: version.json + LOCAL_VERSION here
   + CACHE_VERSION in sw.js. The three move together, only via /release.
   (The offline-shell service-worker registration lives in landing/landing.js's
   init, guarded to http(s) so file:// stays a first-class home.) */
(function () {
  'use strict';
  var LOCAL_VERSION = '0.3.3';
  function fill() {
    var v = document.getElementById('version-note');
    if (v) v.textContent = 'v' + LOCAL_VERSION;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill);
  else fill();
})();
