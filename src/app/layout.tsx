import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import {
  BarreMobile,
  BottomNav,
  SidebarNav,
} from "@/components/navigation";
import { BarreRetour } from "@/components/barre-retour";
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
        <Suspense fallback={null}>
          <SidebarNav />
        </Suspense>
        <main className="flex-1 pt-14 pb-24 md:pt-0 md:pb-0">
          <Suspense fallback={null}>
            <BarreRetour />
          </Suspense>
          {children}
        </main>
        <Suspense fallback={null}>
          <BarreMobile />
        </Suspense>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}