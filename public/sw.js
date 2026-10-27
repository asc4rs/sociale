const CACHE = "sociale-v1";
const HORS_LIGNE = "/hors-ligne";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([HORS_LIGNE, "/pwa-192", "/pwa-512"]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation (ouverture d'une page) : réseau d'abord, sinon page hors connexion.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(HORS_LIGNE)),
    );
    return;
  }

  // Fichiers statiques : cache d'abord.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa-")) {
    event.respondWith(
      caches.match(event.request).then((reponse) => {
        if (reponse) return reponse;
        return fetch(event.request).then((nouvelle) => {
          const copie = nouvelle.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copie));
          return nouvelle;
        });
      }),
    );
  }
});