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
// Liste les demandes en attente reçues par le compte connecté.
export async function getDemandesRecues() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("follows")
    .select("follower_id, created_at, profiles!follows_follower_id_fkey(username, display_name)")
    .eq("following_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return data ?? [];
}

// Accepte une demande : le statut passe de "pending" à "accepted".
export async function accepterDemande(followerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("follows")
    .update({ status: "accepted" })
    .eq("follower_id", followerId)
    .eq("following_id", user.id);

  if (error) return { error: "Impossible d'accepter cette demande." };

  revalidatePath("/demandes");
  return { ok: true };
}

// Refuse une demande : la ligne est supprimée.
export async function refuserDemande(followerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", user.id);

  if (error) return { error: "Impossible de refuser cette demande." };

  revalidatePath("/demandes");
  return { ok: true };
}
