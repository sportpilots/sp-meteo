// SP Meteo — Service Worker
// CACHE_VERSION: v1.4.1

const CACHE_VERSION = 'sp-meteo-v1.4.1';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json'
];

// Instalación: guarda los archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

// Activación: elimina cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: red primero; si falla, caché (solo para archivos de la app, no para el endpoint de datos)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // El endpoint de datos meteorológicos nunca se cachea
  if (url.hostname === 'sportpilots.ddns.net') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardamos una copia fresca en caché
        const clone = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
