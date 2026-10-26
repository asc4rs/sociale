"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Publie un texte de 1 à 280 caractères au nom du compte connecté.
export async function creerPublication(contenu: string) {
  const texte = contenu.trim();

  if (texte.length < 1 || texte.length > 280) {
    return { error: "Une publication doit contenir entre 1 et 280 caractères." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    content: texte,
  });

  if (error) return { error: "Publication impossible. Réessaie." };

  revalidatePath("/");
  return { ok: true };
}

// Supprime une de mes publications. La règle de sécurité refuse toute autre suppression.
export async function supprimerPublication(postId: string) {
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

// Liste les publications d'un compte, les plus récentes en premier.
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