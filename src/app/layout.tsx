import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { BottomNav, SidebarNav } from "@/components/navigation";

export const metadata: Metadata = {
  title: {
    default: "Sociale",
    template: "%s · Sociale",
  },
  description: "Sociale, un réseau social simple, rapide et responsive.",
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
        <Suspense fallback={null}>
          <SidebarNav />
        </Suspense>
        <main className="flex-1 pb-24 md:pb-0">{children}</main>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}