const CACHE = 'kulup-v11';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'config.js', 'icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', e => {
e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Ağ öncelikli: her istekte sunucuya "değişti mi?" diye sorulur (no-cache), tarayıcının 10 dakikalık önbelleğine takılmaz.
// Çevrimdışıyken son kaydedilen kopya kullanılır.
self.addEventListener('fetch', e => {
const url = new URL(e.request.url);
if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
const req = e.request.mode === 'navigate' ? new Request(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }) : new Request(e.request, { cache: 'no-cache' });
e.respondWith(fetch(req).then(res => {
if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
return res;
}).catch(() => caches.match(e.request)));
});
