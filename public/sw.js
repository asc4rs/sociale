// Version du cache : changer ce numéro efface l'ancien cache au prochain chargement.
const VERSION = "sociale-v2";
const PAGE_HORS_LIGNE = "/hors-ligne";
const FICHIERS_FIXES = [PAGE_HORS_LIGNE, "/pwa-192", "/pwa-512"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      // Un fichier manquant ne bloque pas l'installation.
      Promise.all(FICHIERS_FIXES.map((url) => cache.add(url).catch(() => {}))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const requete = event.request;
  if (requete.method !== "GET") return;

  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;

  // Ouverture d'une page : toujours le réseau. Hors ligne, on affiche la page « Hors connexion ».
  if (requete.mode === "navigate") {
    event.respondWith(fetch(requete).catch(() => caches.match(PAGE_HORS_LIGNE)));
    return;
  }

  // Fichiers de l'application (code et icônes) : cache d'abord, car leur nom change à chaque version.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa-")) {
    event.respondWith(
      caches.match(requete).then((trouve) => {
        if (trouve) return trouve;
        return fetch(requete).then((reponse) => {
          if (reponse.ok) {
            const copie = reponse.clone();
            caches.open(VERSION).then((cache) => cache.put(requete, copie));
          }
          return reponse;
        });
      }),
    );
  }
});