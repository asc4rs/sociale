"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean };

// Bloque un compte : ses publications disparaissent de mon fil et il ne peut plus interagir avec moi.
export async function bloquer(cibleId: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };
  if (user.id === cibleId) return { error: "Tu ne peux pas te bloquer toi-même." };

  // Retire les abonnements dans les deux sens.
  await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", cibleId);
  await supabase.from("follows").delete().eq("follower_id", cibleId).eq("following_id", user.id);

  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: user.id, blocked_id: cibleId });

  if (error) return { error: "Blocage impossible." };

  revalidatePath("/");
  return { ok: true };
}

// Débloque un compte.
export async function debloquer(cibleId: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", cibleId);

  if (error) return { error: "Déblocage impossible." };

  revalidatePath("/");
  return { ok: true };
}

// Signale une publication, un commentaire ou un profil.
export async function signaler(
  cible: { postId?: string; commentId?: string; profileId?: string },
  raison: string,
): Promise<Resultat> {
  const texte = raison.trim();
  if (texte.length < 1 || texte.length > 500) {
    return { error: "La raison doit contenir entre 1 et 500 caractères." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    post_id: cible.postId ?? null,
    comment_id: cible.commentId ?? null,
    profile_id: cible.profileId ?? null,
    reason: texte,
  });

  if (error) return { error: "Signalement impossible." };
  return { ok: true };
}

// Modération : supprimer une publication signalée.
export async function supprimerPublicationModere(postId: string): Promise<Resultat> {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { error: "Suppression impossible." };
  revalidatePath("/");
  return { ok: true };
}

// Modération : marquer un signalement comme traité ou rejeté.
export async function traiterSignalement(
  reportId: string,
  statut: "traite" | "rejete",
): Promise<Resultat> {
  const supabase = await createClient();
  const { error } = await supabase.from("reports").update({ status: statut }).eq("id", reportId);
  if (error) return { error: "Action impossible." };
  revalidatePath("/moderation");
  return { ok: true };
}

// Enregistre mes préférences de notifications.
export async function enregistrerPreferences(prefs: {
  notif_follow: boolean;
  notif_like: boolean;
  notif_comment: boolean;
  notif_repost: boolean;
  notif_message: boolean;
}): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.from("profiles").update(prefs).eq("id", user.id);
  if (error) return { error: "Enregistrement impossible." };

  revalidatePath("/parametres");
  return { ok: true };
}

// Passe le compte en privé ou en public.
export async function definirConfidentialite(estPrive: boolean): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("profiles")
    .update({ is_private: estPrive, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: "Enregistrement impossible." };

  revalidatePath("/parametres");
  return { ok: true };
}