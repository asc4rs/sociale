"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean };

export async function creerCitation(citeId: string, contenu: string): Promise<Resultat> {
  const texte = contenu.trim();
  if (texte.length < 1 || texte.length > 280) {
    return { error: "Ta citation doit contenir entre 1 et 280 caractères." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    content: texte,
    kind: "texte",
    quoted_post_id: citeId,
  });

  if (error) return { error: "Publication impossible. Réessaie." };

  revalidatePath("/");
  return { ok: true };
}