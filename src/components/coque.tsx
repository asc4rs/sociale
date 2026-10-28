"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarreMobile, BottomNav, SidebarNav } from "@/components/navigation";
import { BarreRetour } from "@/components/barre-retour";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { PAGES_LEGALES, PAGES_SANS_MENU, commencePar } from "@/lib/pages";

// Logo en haut à gauche : clic = recharge la page d'accueil.
function LogoHaut() {
  return (
    <div className="fixed left-0 top-0 z-30 px-4 py-3 md:hidden">
      <Logo />
    </div>
  );
}

export function Coque({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [connecte, setConnecte] = useState<boolean | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setConnecte(!!user));
  }, []);

  // Connexion, inscription, mot de passe : logo seul.
  if (commencePar(pathname, PAGES_SANS_MENU)) {
    return (
      <>
        <div className="fixed left-0 top-0 z-30 p-4">
          <Logo />
        </div>
        <main className="min-w-0 flex-1 pt-16">{children}</main>
      </>
    );
  }

  // Pages légales : logo seul pour les visiteurs non connectés.
  if (commencePar(pathname, PAGES_LEGALES) && connecte !== true) {
    return (
      <>
        <div className="fixed left-0 top-0 z-30 p-4">
          <Logo />
        </div>
        <main className="min-w-0 flex-1 pt-16">{children}</main>
      </>
    );
  }

  return (
    <>
      <SidebarNav />
      <LogoHaut />
      <main className="min-w-0 flex-1 pt-14 pb-24 md:pt-0 md:pb-0">
        <BarreRetour />
        {children}
      </main>
      <BarreMobile />
      <BottomNav />
    </>
  );
}