"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Bookmark,
  Compass,
  Home,
  Mail,
  Menu,
  Search,
  Settings,
  User,
  UserPlus,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CompteurNotifications } from "@/components/compteur-notifications";
import { CompteurMessages } from "@/components/compteur-messages";
import { Logo } from "./logo";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  compteur?: "notifications" | "messages";
  prive?: boolean;
};

// Menu complet, sur ordinateur.
const TOUS: NavItem[] = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/explorer", label: "Explorer", icon: Compass },
  { href: "/recherche", label: "Recherche", icon: Search },
  { href: "/notifications", label: "Notifications", icon: Bell, compteur: "notifications" },
  { href: "/messages", label: "Messages", icon: Mail, compteur: "messages" },
  { href: "/demandes", label: "Demandes", icon: UserPlus, prive: true },
  { href: "/favoris", label: "Favoris", icon: Bookmark },
  { href: "/profil", label: "Profil", icon: User },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

// Barre du bas, sur téléphone.
const BAS: NavItem[] = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/notifications", label: "Notifications", icon: Bell, compteur: "notifications" },
  { href: "/messages", label: "Messages", icon: Mail, compteur: "messages" },
  { href: "/profil", label: "Profil", icon: User },
];

// Menu à trois barres, sur téléphone.
const MENU: NavItem[] = [
  { href: "/explorer", label: "Explorer", icon: Compass },
  { href: "/demandes", label: "Demandes", icon: UserPlus, prive: true },
  { href: "/favoris", label: "Favoris", icon: Bookmark },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

function useEstPrive() {
  const pathname = usePathname();
  const [prive, setPrive] = useState(false);

  useEffect(() => {
    async function charger() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("is_private")
        .eq("id", user.id)
        .maybeSingle();

      setPrive(!!data?.is_private);
    }
    charger();
  }, [pathname]);

  return prive;
}

function filtrer(liste: NavItem[], prive: boolean) {
  return liste.filter((item) => !item.prive || prive);
}

type Variante = "side" | "bottom" | "menu";

function NavLink({ item, variante }: { item: NavItem; variante: Variante }) {
  const pathname = usePathname();
  const actif =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icone = item.icon;

  const disposition = {
    side: "flex items-center gap-3 rounded-xl px-3 py-2.5 text-base",
    bottom: "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px]",
    menu: "flex items-center gap-3 rounded-xl px-3 py-3 text-base hover:bg-surface",
  }[variante];

  const etat = actif ? "font-bold text-foreground" : "text-muted hover:text-foreground";

  return (
    <Link
      href={item.href}
      aria-current={actif ? "page" : undefined}
      className={`${disposition} ${etat} transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <span className="relative flex">
        <Icone size={22} aria-hidden="true" />
        {item.compteur === "notifications" && <CompteurNotifications />}
        {item.compteur === "messages" && <CompteurMessages />}
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function SidebarNav() {
  const prive = useEstPrive();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border p-4 md:flex">
      <div className="px-3 py-4">
        <Logo />
      </div>
      <nav aria-label="Navigation principale" className="mt-4 flex flex-col gap-1">
        {filtrer(TOUS, prive).map((item) => (
          <NavLink key={item.href} item={item} variante="side" />
        ))}
      </nav>
    </aside>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {BAS.map((item) => (
        <NavLink key={item.href} item={item} variante="bottom" />
      ))}
    </nav>
  );
}

export function BarreMobile() {
  const pathname = usePathname();
  const prive = useEstPrive();
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    setOuvert(false);
  }, [pathname]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-3 md:hidden">
        <button
          type="button"
          onClick={() => setOuvert(true)}
          aria-label="Ouvrir le menu"
          className="rounded-xl p-2 hover:bg-surface"
        >
          <Menu size={22} aria-hidden="true" />
        </button>

        <Link href="/" className="font-bold">
          Sociale
        </Link>

        <Link href="/recherche" aria-label="Rechercher" className="rounded-xl p-2 hover:bg-surface">
          <Search size={22} aria-hidden="true" />
        </Link>
      </header>

      {ouvert && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            onClick={() => setOuvert(false)}
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-black/50"
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col gap-1 overflow-y-auto border-r border-border bg-background p-4">
            <div className="flex items-center justify-between pb-4">
              <Logo />
              <button
                type="button"
                onClick={() => setOuvert(false)}
                aria-label="Fermer le menu"
                className="rounded-xl p-2 hover:bg-surface"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Menu" className="flex flex-col gap-1">
              {filtrer(MENU, prive).map((item) => (
                <NavLink key={item.href} item={item} variante="menu" />
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}