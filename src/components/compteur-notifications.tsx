"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Pastille rouge affichant le nombre de notifications non lues.
export function CompteurNotifications() {
  const pathname = usePathname();
  const [nombre, setNombre] = useState(0);

  const charger = useCallback(async () => {
    const supabase = createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false);
    setNombre(count ?? 0);
  }, []);

  // Recalcul à chaque changement de page.
  useEffect(() => {
    charger();
  }, [pathname, charger]);

  // Recalcul automatique toutes les 30 secondes et après « Tout marquer comme lu ».
  useEffect(() => {
    const minuteur = setInterval(charger, 30000);
    window.addEventListener("notifications-lues", charger);
    return () => {
      clearInterval(minuteur);
      window.removeEventListener("notifications-lues", charger);
    };
  }, [charger]);

  if (nombre === 0) return null;

  const libelle = nombre > 99 ? "99+" : String(nombre);

  return (
    <span
      aria-label={`${nombre} notifications non lues`}
      className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
    >
      {libelle}
    </span>
  );
}