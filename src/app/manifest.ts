import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sociale",
    short_name: "Sociale",
    description: "Sociale, un réseau social simple, rapide et responsive.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "fr",
    icons: [
      { src: "/pwa-192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512", sizes: "512x512", type: "image/png" },
    ],
  };
}