"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean };

export async function ajouterTagPhoto(
  mediaId: string,
  userId: string,
  x: number,
  y: number,
): Promise<Resultat> {
  if (x < 0 || x > 100 || y < 0 || y > 100) return { error: "Position invalide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.from("post_media_tags").upsert(
    {
      media_id: mediaId,
      user_id: userId,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    },
    { onConflict: "media_id,user_id" },
  );

  if (error) return { error: "Tag impossible. Réessaie." };

  revalidatePath("/");
  return { ok: true };
}

export async function supprimerTagPhoto(tagId: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.from("post_media_tags").delete().eq("id", tagId);
  if (error) return { error: "Suppression impossible." };

  revalidatePath("/");
  return { ok: true };
}