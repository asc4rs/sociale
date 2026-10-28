"use client";

import { useEffect } from "react";

// Le service worker est désactivé : on le retire des navigateurs
// et on vide son cache. Il n'est plus enregistré.
export function EnregistrerServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()));
    }
    if ("caches" in window) {
      caches.keys().then((cles) => cles.forEach((c) => caches.delete(c)));
    }
  }, []);

  return null;
}