"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Pastille rouge : nombre de conversations avec un message non lu.
export function CompteurMessages() {
  const pathname = usePathname();
  const [nombre, setNombre] = useState(0);

  const charger = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: lignes } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);

    const ids = (lignes ?? []).map((l) => l.conversation_id);
    if (ids.length === 0) {
      setNombre(0);
      return;
    }

    // Les messages supprimés ne comptent pas.
    const { data: messages } = await supabase
      .from("messages")
      .select("conversation_id, created_at, author_id")
      .in("conversation_id", ids)
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .limit(2000);

    // Le premier message de chaque conversation est le plus récent.
    const dernier = new Map<string, { created_at: string; author_id: string }>();
    for (const m of messages ?? []) {
      if (!dernier.has(m.conversation_id)) dernier.set(m.conversation_id, m);
    }

    let total = 0;
    for (const l of lignes ?? []) {
      const d = dernier.get(l.conversation_id);
      if (!d || d.author_id === user.id) continue;
      if (new Date(d.created_at).getTime() > new Date(l.last_read_at).getTime()) total++;
    }
    setNombre(total);
  }, []);

  // Recalcul à chaque changement de page.
  useEffect(() => {
    charger();
  }, [pathname, charger]);

  // Recalcul toutes les 10 secondes, au retour sur l'onglet, et après lecture.
  useEffect(() => {
    const minuteur = setInterval(charger, 10000);
    window.addEventListener("messages-lus", charger);
    window.addEventListener("focus", charger);
    return () => {
      clearInterval(minuteur);
      window.removeEventListener("messages-lus", charger);
      window.removeEventListener("focus", charger);
    };
  }, [charger]);

  if (nombre === 0) return null;

  const libelle = nombre > 99 ? "99+" : String(nombre);

  return (
    <span
      aria-label={`${nombre} conversations non lues`}
      className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
    >
      {libelle}
    </span>
  );
}