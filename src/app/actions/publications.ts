"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean };
type Type = "texte" | "sondage" | "question";

// Crée une publication : texte, sondage ou question, immédiate ou programmée.
export async function creerPublication(entree: {
  contenu: string;
  type?: Type;
  options?: string[];
  programmeePour?: string | null;
}): Promise<Resultat> {
  const texte = entree.contenu.trim();
  if (texte.length < 1 || texte.length > 280) {
    return { error: "Une publication doit contenir entre 1 et 280 caractères." };
  }

  const type: Type = entree.type ?? "texte";

  let publishAt = new Date();
  if (entree.programmeePour) {
    const date = new Date(entree.programmeePour);
    if (Number.isNaN(date.getTime())) return { error: "Date de programmation invalide." };
    if (date.getTime() < Date.now() + 60_000) {
      return { error: "La date doit être au moins une minute dans le futur." };
    }
    publishAt = date;
  }

  let options: string[] = [];
  if (type === "sondage") {
    options = (entree.options ?? []).map((o) => o.trim()).filter((o) => o.length > 0);
    if (options.length < 2 || options.length > 4) {
      return { error: "Un sondage doit avoir entre 2 et 4 options." };
    }
    if (options.some((o) => o.length > 80)) {
      return { error: "Chaque option doit faire 80 caractères maximum." };
    }
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) {
      return { error: "Les options doivent être différentes." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content: texte,
      kind: type,
      publish_at: publishAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !post) return { error: "Publication impossible. Réessaie." };

  if (type === "sondage") {
    const lignes = options.map((libelle, position) => ({
      post_id: post.id,
      libelle,
      position,
    }));
    const { error: errOptions } = await supabase.from("poll_options").insert(lignes);
    if (errOptions) {
      // On annule la publication pour ne pas laisser un sondage vide.
      await supabase.from("posts").delete().eq("id", post.id);
      return { error: "Sondage impossible. Réessaie." };
    }
  }

  revalidatePath("/");
  return { ok: true };
}

// Vote pour une option d'un sondage (un seul vote par personne et par sondage).
export async function voterSondage(postId: string, optionId: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("poll_votes")
    .insert({ post_id: postId, option_id: optionId, user_id: user.id });

  if (error) return { error: "Vote impossible (tu as peut-être déjà voté)." };

  revalidatePath("/");
  return { ok: true };
}

export async function supprimerPublication(postId: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) return { error: "Suppression impossible." };

  revalidatePath("/");
  return { ok: true };
}

export async function getPublications(authorId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    .select("id, content, created_at, author_id")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}