/* sw.js — written by build.js. Keeps the whole game on the device so it plays with no internet. */
const KEEP = 'chomp-chums-611403a526';
const FILES = ["./","index.html","manifest.webmanifest","icons/icon-180.png","icons/icon-192.png","icons/icon-512.png","art/appliances.webp","art/bg_builder.webp","art/bg_feed.webp","art/bg_home.webp","art/bg_kitchen.webp","art/breakfast_sweets.webp","art/burger_layers.webp","art/dessert_parts.webp","art/dinner_a.webp","art/dinner_b.webp","art/drinks_sea.webp","art/fruit_a.webp","art/fruit_b_veg_a.webp","art/munchies.webp","art/pizza_toppings.webp","art/sweets_b.webp","art/ui_icons.webp","art/veg_b.webp"];
self.addEventListener('install', e => { e.waitUntil(caches.open(KEEP).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('chomp-chums-') && k !== KEEP).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(KEEP).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
