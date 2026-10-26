"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Ajoute mon like, ou le retire s'il existe déjà.
export async function basculerLike(postId: string, dejaLike: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  if (dejaLike) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (error) return { error: "Impossible de retirer le like." };
  } else {
    const { error } = await supabase
      .from("likes")
      .insert({ post_id: postId, user_id: user.id });

    if (error) return { error: "Impossible d'aimer cette publication." };
  }

  revalidatePath("/");
  return { ok: true };
}