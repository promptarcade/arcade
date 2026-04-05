var CACHE = 'utap-v1';

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE; })
          .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Cache-first for images and audio, network-first for HTML
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  if (url.match(/\.(jpg|jpeg|png|mp3)$/)) {
    // Images and audio: serve from cache, fetch and cache if missing
    e.respondWith(
      caches.open(CACHE).then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          if (cached) return cached;
          return fetch(e.request).then(function(response) {
            cache.put(e.request, response.clone());
            return response;
          });
        });
      })
    );
  } else {
    // HTML/JS: try network first, fall back to cache
    e.respondWith(
      fetch(e.request).then(function(response) {
        caches.open(CACHE).then(function(cache) {
          cache.put(e.request, response.clone());
        });
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
  }
});
