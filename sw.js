/* sw.js — offline shell (century test A: compose, seal, and print need no
   network after first load). CACHE_VERSION is part of the versioning triple. */
'use strict';

var CACHE_VERSION = 'tessera-v0.6.0';

var CORE = [
  './',
  'index.html',
  'app.html',
  'print.css',
  'landing/landing.css',
  'landing/landing.js',
  'landing/opening.js',
  'landing/reminders.js',
  'version.json',
  'js/version.js',
  'js/state.js',
  'js/manifest.js',
  'js/zip.js',
  'js/crypt.js',
  'js/token.js',
  'js/token-legacy.js',
  'js/export.js',
  'js/ics.js',
  'js/open.js',
  'js/print.js',
  'data/occasions.js',
  'fonts/YoungSerif-Regular.ttf',
  'fonts/CourierPrime-Regular.ttf',
  'fonts/CourierPrime-Bold.ttf',
  'fonts/CourierPrime-Italic.ttf'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function (c) { return c.addAll(CORE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function (c) { c.put(e.request, copy); });
        return res;
      });
    })
  );
});
