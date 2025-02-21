const CACHE_NAME = 'phaser-runner-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './service-worker.js',
  './manifest.json',
  './icon.png',
  'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js',
  'https://i.imgur.com/LPhWM85.png',
  'https://i.imgur.com/XNCKB6a.png',
  'https://i.imgur.com/RqZ7M3a.png',
  'https://i.imgur.com/PknkWvS.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
  )));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => r)));
});