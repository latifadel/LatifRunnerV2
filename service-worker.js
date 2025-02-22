// service-worker.js - for offline support
const CACHE_NAME = 'latif-runner-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './service-worker.js',
  './manifest.json',
  './icon.png',
  // The Phaser CDN library
  'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js',
  // Assets folder
  'assets/road_tile.png',
  'assets/car_spritesheet.png',
  'assets/obstacle_cone.png',
  'assets/obstacle_car1.png',
  'assets/obstacle_car2.png',
  'assets/spark.png',
  'assets/bgm.ogg',
  'assets/crash.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
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
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => cachedResponse);
    })
  );
});
