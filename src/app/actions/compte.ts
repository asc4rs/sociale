"use server";

import { createClient } from "@/lib/supabase/server";

export async function supprimerMonCompte(confirmation: string) {
  if (confirmation !== "SUPPRIMER") {
    return { error: "Écris SUPPRIMER en majuscules pour confirmer." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.rpc("supprimer_mon_compte");
  if (error) return { error: "Suppression impossible. Réessaie." };

  await supabase.auth.signOut();
  return { ok: true };
}