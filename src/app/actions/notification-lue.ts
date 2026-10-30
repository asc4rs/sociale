"use server";

import { createClient } from "@/lib/supabase/server";

// Marque une seule notification comme lue (celle sur laquelle on clique).
export async function marquerNotificationLue(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("recipient_id", user.id);

  if (error) return { error: "Action impossible." };
  return { ok: true };
}