import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Coque } from "@/components/coque";
import { EnregistrerServiceWorker } from "@/components/enregistrer-sw";

export const metadata: Metadata = {
  title: {
    default: "Sociale",
    template: "%s · Sociale",
  },
  description: "Sociale, un réseau social simple, rapide et responsive.",
  appleWebApp: {
    capable: true,
    title: "Sociale",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen md:flex">
        <EnregistrerServiceWorker />
        <Suspense fallback={<main className="flex-1">{children}</main>}>
          <Coque>{children}</Coque>
        </Suspense>
      </body>
    </html>
  );
}