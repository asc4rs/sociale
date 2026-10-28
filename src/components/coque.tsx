"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarreMobile, BottomNav, SidebarNav } from "@/components/navigation";
import { BarreRetour } from "@/components/barre-retour";
import { createClient } from "@/lib/supabase/client";
import { PAGES_LEGALES, PAGES_SANS_MENU, commencePar } from "@/lib/pages";

export function Coque({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [connecte, setConnecte] = useState<boolean | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setConnecte(!!user));
  }, []);

  // Connexion, inscription, mot de passe : aucun menu.
  if (commencePar(pathname, PAGES_SANS_MENU)) {
    return <main className="min-w-0 flex-1">{children}</main>;
  }

  // Pages légales : seules, pour les visiteurs non connectés.
  if (commencePar(pathname, PAGES_LEGALES) && connecte !== true) {
    return <main className="min-w-0 flex-1">{children}</main>;
  }

  return (
    <>
      <SidebarNav />
      <main className="min-w-0 flex-1 pt-14 pb-24 md:pt-0 md:pb-0">
        <BarreRetour />
        {children}
      </main>
      <BarreMobile />
      <BottomNav />
    </>
  );
}