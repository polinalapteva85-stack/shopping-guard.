// Сначала сеть, память — только когда интернета нет.
// Так обновления сайта доходят сразу, а не застревают в старой копии.
const CACHE = 'guard-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/', '/index.html', '/manifest.json']))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Запросы на проверку товара не трогаем — они всегда идут в сеть
  if (req.method !== 'GET' || new URL(req.url).pathname.startsWith('/api/')) return;

  e.respondWith(
    fetch(req)
      .then((response) => {
        if (response.ok && new URL(req.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return response;
      })
      .catch(() => caches.match(req))
  );
});
