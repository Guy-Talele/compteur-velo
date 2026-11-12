// Compteur vélo : garde l'appli en mémoire pour qu'elle démarre même sans réseau.
// Changez le numéro de version à chaque mise à jour des fichiers.
const CACHE = 'compteur-velo-v1';
const FILES = [
  './', 'index.html', 'manifest.json',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
  'barlow-400.woff2', 'barlow-500.woff2', 'barlow-600.woff2',
  'barlow-condensed-600.woff2', 'barlow-condensed-700.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Page : réponse immédiate depuis la mémoire, mise à jour en arrière-plan pour le prochain lancement
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./'));
        const update = fetch(req).then((res) => {
          if (res && res.ok) cache.put('./', res.clone());
          return res;
        }).catch(() => null);
        if (cached) { event.waitUntil(update); return cached; }
        return (await update) || Response.error();
      })
    );
    return;
  }

  // Autres fichiers : mémoire d'abord, réseau sinon
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
