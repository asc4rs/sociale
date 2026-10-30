"use server";

import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean };
type Media = { url: string; genre: "image" | "video" | "fichier" };

export async function envoyerDansConversation(
  conversationId: string,
  texte: string,
  media: Media | null,
): Promise<Resultat> {
  const t = texte.trim();
  if (t.length > 1000) return { error: "Message trop long (1000 caractères maximum)." };
  if (t.length === 0 && !media) return { error: "Écris un message ou joins un fichier." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("envoyer_dans_conversation", {
    conv: conversationId,
    texte: t,
    media: media?.url ?? null,
    genre: media?.genre ?? null,
  });

  if (error) return { error: "Envoi impossible." };
  return { ok: true };
}

export async function supprimerMonMessage(id: string): Promise<Resultat> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("supprimer_mon_message", { msg: id });
  if (error) return { error: "Suppression impossible." };
  return { ok: true };
}

export async function supprimerMesMessages(conversationId: string): Promise<Resultat> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("supprimer_mes_messages", { conv: conversationId });
  if (error) return { error: "Suppression impossible." };
  return { ok: true };
}

export async function definirDisparition(
  conversationId: string,
  heures: number | null,
): Promise<Resultat> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("definir_disparition", {
    conv: conversationId,
    heures,
  });
  if (error) return { error: "Modification impossible." };
  return { ok: true };
}