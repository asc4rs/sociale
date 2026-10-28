"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Masque une publication pour moi (« masquer » ou « ce contenu ne m'intéresse pas »).
export async function masquerPublication(postId: string, raison: "masque" | "pas_interesse") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("post_masques")
    .upsert({ user_id: user.id, post_id: postId, raison });

  if (error) return { error: "Action impossible." };

  revalidatePath("/");
  return { ok: true };
}