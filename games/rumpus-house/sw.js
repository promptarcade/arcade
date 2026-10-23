/* sw.js — written by build.js. Keeps the whole game on the device so it plays with no internet. */
const KEEP = 'rumpus-house-7a547e135c';
const FILES = ["./","index.html","manifest.webmanifest","icons/icon-180.png","icons/icon-192.png","icons/icon-512.png","art/bg_bath.webp","art/bg_bedroom.webp","art/bg_dining.webp","art/bg_garden.webp","art/bg_hall.webp","art/bg_kids.webp","art/bg_kitchen.webp","art/bg_living.webp","art/bg_play.webp","art/page0.webp","art/page1.webp","art/page2.webp","art/page3.webp","art/page4.webp","art/page5.webp"];
self.addEventListener('install', e => { e.waitUntil(caches.open(KEEP).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('rumpus-house-') && k !== KEEP).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(KEEP).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
