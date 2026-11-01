"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean };

// Copie un message dans une autre conversation, en mon nom.
export async function transfererMessage(messageId: string, conversationCibleId: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { data: msg } = await supabase
    .from("messages")
    .select("content, media_url, media_kind, deleted")
    .eq("id", messageId)
    .maybeSingle();

  if (!msg || msg.deleted) return { error: "Message introuvable." };

  const { error } = await supabase.rpc("envoyer_dans_conversation", {
    conv: conversationCibleId,
    texte: msg.content ?? "",
    media: msg.media_url,
    genre: msg.media_kind,
  });

  if (error) return { error: "Transfert impossible." };

  revalidatePath("/messages");
  return { ok: true };
}