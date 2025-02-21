// service-worker.js
const CACHE_NAME = 'phaser-runner-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './service-worker.js',
  './manifest.json',
  './icon.png', // Replace with your app icon(s)
  'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js',
  // Also add any externally loaded images used in the game
  'https://i.imgur.com/INxP3EJ.png',
  'https://i.imgur.com/i6p72Rf.png',
  'https://i.imgur.com/I1qBc1y.png',
  'https://i.imgur.com/sJE2fEd.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => response);
    })
  );
});