"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EtatAbonnement = "aucun" | "en_attente" | "abonne";

// Retourne l'état de ma relation avec un autre compte.
export async function getEtatAbonnement(cibleId: string): Promise<EtatAbonnement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "aucun";

  const { data } = await supabase
    .from("follows")
    .select("status")
    .eq("follower_id", user.id)
    .eq("following_id", cibleId)
    .maybeSingle();

  if (!data) return "aucun";
  return data.status === "accepted" ? "abonne" : "en_attente";
}

// Suit un compte. Si le compte est privé, la demande reste en attente.
export async function suivre(cibleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };
  if (user.id === cibleId) return { error: "Tu ne peux pas te suivre toi-même." };

  const { data: cible } = await supabase
    .from("profiles")
    .select("is_private, username")
    .eq("id", cibleId)
    .maybeSingle();

  if (!cible) return { error: "Ce compte n'existe pas." };

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: cibleId,
    status: cible.is_private ? "pending" : "accepted",
  });

  if (error) return { error: "Impossible de suivre ce compte." };

  revalidatePath(`/u/${cible.username}`);
  return { ok: true };
}

// Se désabonne, ou annule une demande en attente.
export async function seDesabonner(cibleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", cibleId);

  if (error) return { error: "Impossible de te désabonner." };

  const { data: cible } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", cibleId)
    .maybeSingle();

  if (cible) revalidatePath(`/u/${cible.username}`);
  return { ok: true };
}