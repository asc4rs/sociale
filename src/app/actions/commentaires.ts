"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Ajoute un commentaire au nom du compte connecté.
export async function ajouterCommentaire(postId: string, contenu: string) {
  const texte = contenu.trim();

  if (texte.length < 1 || texte.length > 280) {
    return { error: "Un commentaire doit contenir entre 1 et 280 caractères." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content: texte,
  });

  if (error) return { error: "Commentaire impossible. Réessaie." };

  revalidatePath("/");
  return { ok: true };
}

// Supprime un de mes commentaires.
export async function supprimerCommentaire(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) return { error: "Suppression impossible." };

  revalidatePath("/");
  return { ok: true };
}