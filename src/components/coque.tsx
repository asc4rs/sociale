"use client";

import { usePathname } from "next/navigation";
import { BarreMobile, BottomNav, SidebarNav } from "@/components/navigation";
import { BarreRetour } from "@/components/barre-retour";
import { PAGES_SANS_MENU, commencePar } from "@/lib/pages";

export function Coque({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Connexion, inscription, mot de passe : aucun menu.
  if (commencePar(pathname, PAGES_SANS_MENU)) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <SidebarNav />
      <main className="flex-1 pt-14 pb-24 md:pt-0 md:pb-0">
        <BarreRetour />
        {children}
      </main>
      <BarreMobile />
      <BottomNav />
    </>
  );
}