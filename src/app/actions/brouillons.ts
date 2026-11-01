"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { creerPublication } from "@/app/actions/publications";

type Resultat = { error?: string; ok?: boolean };
type Type = "texte" | "question";

export async function enregistrerBrouillon(contenu: string, type: Type): Promise<Resultat> {
  const texte = contenu.trim();
  if (texte.length < 1 || texte.length > 280) {
    return { error: "Un brouillon doit contenir entre 1 et 280 caractères." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("drafts")
    .insert({ author_id: user.id, content: texte, kind: type });

  if (error) return { error: "Enregistrement impossible." };

  revalidatePath("/brouillons");
  return { ok: true };
}

export async function supprimerBrouillon(id: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("drafts")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) return { error: "Suppression impossible." };

  revalidatePath("/brouillons");
  return { ok: true };
}

export async function publierBrouillon(id: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { data: brouillon } = await supabase
    .from("drafts")
    .select("id, content, kind")
    .eq("id", id)
    .eq("author_id", user.id)
    .maybeSingle();

  if (!brouillon) return { error: "Brouillon introuvable." };

  const type: Type = brouillon.kind === "question" ? "question" : "texte";
  const r = await creerPublication({ contenu: brouillon.content, type });
  if (r.error) return { error: r.error };

  await supabase.from("drafts").delete().eq("id", id).eq("author_id", user.id);

  revalidatePath("/brouillons");
  return { ok: true };
}