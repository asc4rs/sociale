"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Infos = { username: string; display_name: string; bio: string | null };

type Props = {
  auteurId: string;
  children: React.ReactNode;
};

// Affiche un aperçu du profil quand on survole le nom ou la photo de l'auteur.
export function ApercuProfil({ auteurId, children }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [infos, setInfos] = useState<Infos | null>(null);
  const [charge, setCharge] = useState(false);

  async function charger() {
    if (charge) return;
    setCharge(true);
    const { data } = await createClient()
      .from("profiles")
      .select("username, display_name, bio")
      .eq("id", auteurId)
      .maybeSingle();
    setInfos(data ?? null);
  }

  function ouvrir() {
    setOuvert(true);
    charger();
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={ouvrir}
      onMouseLeave={() => setOuvert(false)}
      onFocus={ouvrir}
      onBlur={() => setOuvert(false)}
    >
      {children}

      {ouvert && (
        <div
          role="tooltip"
          className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-border bg-background p-4 text-left shadow-lg"
        >
          {infos ? (
            <>
              <p className="font-bold">{infos.display_name}</p>
              <p className="text-sm text-muted">@{infos.username}</p>
              {infos.bio && <p className="mt-2 text-sm">{infos.bio}</p>}
              <Link href={`/u/${infos.username}`} className="mt-3 inline-block text-sm underline">
                Voir le profil
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted">Chargement...</p>
          )}
        </div>
      )}
    </div>
  );
}
