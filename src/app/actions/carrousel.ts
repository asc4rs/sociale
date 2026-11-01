"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean };

// Crée une publication avec ses images (les fichiers sont déjà envoyés dans le stockage).
export async function creerPublicationCarrousel(contenu: string, urls: string[]): Promise<Resultat> {
  const texte = contenu.trim();
  if (texte.length > 280) return { error: "Maximum 280 caractères." };
  if (texte.length === 0 && urls.length === 0) {
    return { error: "Écris un texte ou ajoute une image." };
  }
  if (urls.length > 10) return { error: "Maximum 10 images par publication." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { data: post, error } = await supabase
    .from("posts")
    .insert({ author_id: user.id, content: texte, kind: "texte" })
    .select("id")
    .single();

  if (error || !post) return { error: "Publication impossible. Réessaie." };

  if (urls.length > 0) {
    const lignes = urls.map((url, position) => ({
      post_id: post.id,
      url,
      kind: "image",
      position,
    }));
    const { error: errMedias } = await supabase.from("post_media").insert(lignes);
    if (errMedias) {
      // On annule la publication pour ne pas laisser un carrousel vide.
      await supabase.from("posts").delete().eq("id", post.id);
      return { error: "Envoi des images impossible." };
    }
  }

  revalidatePath("/");
  return { ok: true };
}