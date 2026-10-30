"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Supprime toutes mes notifications.
export async function viderNotifications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("recipient_id", user.id);

  if (error) return { error: "Suppression impossible." };

  revalidatePath("/notifications");
  return { ok: true };
}