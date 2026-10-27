"use client";

import { useEffect } from "react";

// Enregistre le service worker, uniquement en production (sur Vercel).
export function EnregistrerServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}