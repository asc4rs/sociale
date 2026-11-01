"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean };

export async function creerStory(
  contenu: string,
  mediaUrl: string | null,
  amisProches: boolean,
): Promise<Resultat> {
  const texte = contenu.trim();
  if (texte.length > 280) return { error: "280 caractères maximum." };
  if (!texte && !mediaUrl) return { error: "Ajoute un texte ou une photo." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.from("stories").insert({
    author_id: user.id,
    content: texte || null,
    media_url: mediaUrl,
    close_friends: amisProches,
  });

  if (error) return { error: "Publication impossible. Réessaie." };

  revalidatePath("/");
  return { ok: true };
}

export async function supprimerStory(id: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("stories")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) return { error: "Suppression impossible." };

  revalidatePath("/");
  return { ok: true };
}

// Enregistre qu'on a vu la story (une seule fois par personne).
export async function enregistrerVueStory(id: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.from("story_views").upsert(
    { story_id: id, user_id: user.id },
    { onConflict: "story_id,user_id", ignoreDuplicates: true },
  );

  if (error) return { error: "Vue non enregistrée." };
  return { ok: true };
}

// Ajoute ou retire une personne de ma liste d'amis proches.
export async function basculerAmiProche(amiId: string, actif: boolean): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  if (actif) {
    const { error } = await supabase.from("close_friends").upsert(
      { owner_id: user.id, friend_id: amiId },
      { onConflict: "owner_id,friend_id", ignoreDuplicates: true },
    );
    if (error) return { error: "Modification impossible." };
  } else {
    const { error } = await supabase
      .from("close_friends")
      .delete()
      .eq("owner_id", user.id)
      .eq("friend_id", amiId);
    if (error) return { error: "Modification impossible." };
  }

  return { ok: true };
}