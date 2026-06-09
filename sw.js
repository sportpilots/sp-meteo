// SP Meteo — Service Worker
// Este archivo permite que la app funcione offline (muestra el último dato guardado)
// y que sea instalable en el móvil como una app nativa.

const CACHE_VERSION = 'spmeteo-v1.2.0';
const STATIC_FILES  = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=B612+Mono:wght@400;700&family=B612:wght@400;700&display=swap'
];

// ── Instalación: guarda los archivos estáticos en caché ──────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

// ── Activación: elimina cachés antiguas ──────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Intercepta peticiones de red ─────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Las peticiones al endpoint de datos (VPS) van siempre a la red.
  // Si fallan, devolvemos un JSON de error para que la app lo maneje.
  if (url.hostname === 'sportpilots.ddns.net') {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response(
          JSON.stringify({ error: 'offline' }),
          { headers: { 'Content-Type': 'application/json' } }
        ))
    );
    return;
  }

  // Para el resto (archivos estáticos): primero caché, si no hay, red.
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
