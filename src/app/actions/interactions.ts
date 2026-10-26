"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean };

export async function basculerRepublication(postId: string, dejaRepost: boolean): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  if (dejaRepost) {
    const { error } = await supabase
      .from("reposts")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) return { error: "Action impossible." };
  } else {
    const { error } = await supabase
      .from("reposts")
      .insert({ post_id: postId, user_id: user.id });
    if (error) return { error: "Action impossible." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function basculerFavori(postId: string, dejaFavori: boolean): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  if (dejaFavori) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) return { error: "Action impossible." };
  } else {
    const { error } = await supabase
      .from("bookmarks")
      .insert({ post_id: postId, user_id: user.id });
    if (error) return { error: "Action impossible." };
  }

  revalidatePath("/");
  revalidatePath("/favoris");
  return { ok: true };
}

// Épingle une publication sur mon profil, ou la désépingle.
export async function basculerEpingle(postId: string, dejaEpingle: boolean): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("profiles")
    .update({ pinned_post_id: dejaEpingle ? null : postId })
    .eq("id", user.id);

  if (error) return { error: "Action impossible." };

  revalidatePath("/");
  return { ok: true };
}