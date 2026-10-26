"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Bell,
  Bookmark,
  Compass,
  Home,
  LogOut,
  Mail,
  Search,
  Settings,
  Shield,
  User,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "./logo";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  mobile: boolean;
  admin?: boolean;
};

// mobile : affiché aussi dans la barre du bas sur téléphone.
// admin : affiché uniquement pour les comptes modérateurs.
const items: NavItem[] = [
  { href: "/", label: "Pour toi", icon: Home, mobile: true },
  { href: "/explorer", label: "Explorer", icon: Compass, mobile: false },
  { href: "/recherche", label: "Recherche", icon: Search, mobile: true },
  { href: "/notifications", label: "Notifications", icon: Bell, mobile: true },
  { href: "/messages", label: "Messages", icon: Mail, mobile: true },
  { href: "/demandes", label: "Demandes", icon: UserPlus, mobile: false },
  { href: "/favoris", label: "Favoris", icon: Bookmark, mobile: false },
  { href: "/profil", label: "Profil", icon: User, mobile: true },
  { href: "/parametres", label: "Paramètres", icon: Settings, mobile: true },
  { href: "/moderation", label: "Modération", icon: Shield, mobile: false, admin: true },
];

function useEstAdmin() {
  const [estAdmin, setEstAdmin] = useState(false);

  useEffect(() => {
    async function charger() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      setEstAdmin(!!data?.is_admin);
    }
    charger();
  }, []);

  return estAdmin;
}

type NavLinkProps = {
  item: NavItem;
  variant: "side" | "bottom";
};

function NavLink({ item, variant }: NavLinkProps) {
  const pathname = usePathname();
  const active =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  const layout =
    variant === "side"
      ? "flex items-center gap-3 rounded-xl px-3 py-2.5 text-base"
      : "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px]";

  const state = active
    ? "font-bold text-foreground"
    : "text-muted hover:text-foreground";

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`${layout} ${state} transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <Icon size={22} aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function BoutonDeconnexion() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/connexion");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base text-muted transition-colors hover:text-foreground disabled:opacity-50"
    >
      <LogOut size={22} aria-hidden="true" />
      <span>{pending ? "Déconnexion..." : "Se déconnecter"}</span>
    </button>
  );
}

export function SidebarNav() {
  const estAdmin = useEstAdmin();
  const visibles = items.filter((item) => !item.admin || estAdmin);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border p-4 md:flex">
      <div className="px-3 py-4">
        <Logo />
      </div>

      <nav aria-label="Navigation principale" className="mt-4 flex flex-col gap-1">
        {visibles.map((item) => (
          <NavLink key={item.href} item={item} variant="side" />
        ))}
      </nav>

      <div className="mt-auto">
        <BoutonDeconnexion />
      </div>
    </aside>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {items
        .filter((item) => item.mobile)
        .map((item) => (
          <NavLink key={item.href} item={item} variant="bottom" />
        ))}
    </nav>
  );
}