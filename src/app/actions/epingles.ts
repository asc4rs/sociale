"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean };

const MAXIMUM = 3;

export async function basculerEpinglePublication(postId: string, actif: boolean): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  if (!actif) {
    const { error } = await supabase
      .from("pinned_posts")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
    if (error) return { error: "Désépinglage impossible." };
    revalidatePath("/");
    return { ok: true };
  }

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post || post.author_id !== user.id) {
    return { error: "Tu ne peux épingler que tes publications." };
  }

  const { data: deja } = await supabase
    .from("pinned_posts")
    .select("post_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();
  if (deja) return { ok: true };

  const { count } = await supabase
    .from("pinned_posts")
    .select("post_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= MAXIMUM) {
    return { error: `Tu peux épingler ${MAXIMUM} publications maximum. Désépingle-en une d'abord.` };
  }

  const { error } = await supabase.from("pinned_posts").insert({
    user_id: user.id,
    post_id: postId,
    position: count ?? 0,
  });
  if (error) return { error: "Épinglage impossible." };

  revalidatePath("/");
  return { ok: true };
}