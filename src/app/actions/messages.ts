"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean; id?: string };

// Ouvre une conversation avec un ou plusieurs pseudos.
// Pour une personne seule, réutilise la conversation privée existante.
export async function trouverOuCreerConversation(
  pseudos: string[],
  nomGroupe: string,
): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const pseudosNets = [
    ...new Set(
      pseudos.map((p) => p.trim().toLowerCase().replace(/^@/, "")).filter((p) => p.length > 0),
    ),
  ];
  if (pseudosNets.length === 0) return { error: "Indique au moins un pseudo." };

  const { data: cibles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("username", pseudosNets);

  const trouves = cibles ?? [];
  if (trouves.length !== pseudosNets.length) {
    return { error: "Un ou plusieurs pseudos sont introuvables." };
  }

  const idsCibles = trouves.map((c) => c.id).filter((uid) => uid !== user.id);
  if (idsCibles.length === 0) return { error: "Tu ne peux pas t'écrire à toi-même." };

  const estGroupe = idsCibles.length > 1;

  if (!estGroupe) {
    const { data: mesLignes } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    const mesIds = (mesLignes ?? []).map((l) => l.conversation_id);

    if (mesIds.length > 0) {
      const { data: communes } = await supabase
        .from("conversation_members")
        .select("conversation_id, conversations(is_group)")
        .eq("user_id", idsCibles[0])
        .in("conversation_id", mesIds);

      const privee = (communes ?? []).find((c) => {
        const conv = c.conversations as unknown as
          | { is_group: boolean }
          | { is_group: boolean }[]
          | null;
        const groupe = Array.isArray(conv) ? conv[0]?.is_group : conv?.is_group;
        return groupe === false;
      });

      if (privee) return { ok: true, id: privee.conversation_id };
    }
  }

  const id = crypto.randomUUID();

  const { error: errConv } = await supabase.from("conversations").insert({
    id,
    is_group: estGroupe,
    name: estGroupe ? nomGroupe.trim() || null : null,
    created_by: user.id,
  });
  if (errConv) return { error: "Création impossible." };

  const { error: errMembres } = await supabase
    .from("conversation_members")
    .insert([user.id, ...idsCibles].map((uid) => ({ conversation_id: id, user_id: uid })));
  if (errMembres) return { error: "Impossible d'ajouter les membres." };

  revalidatePath("/messages");
  return { ok: true, id };
}

// Envoie un message dans une conversation dont je suis membre.
export async function envoyerMessage(conversationId: string, contenu: string): Promise<Resultat> {
  const texte = contenu.trim();
  if (texte.length < 1 || texte.length > 1000) {
    return { error: "Un message doit contenir entre 1 et 1000 caractères." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    author_id: user.id,
    content: texte,
  });

  if (error) return { error: "Envoi impossible." };

  revalidatePath(`/messages/${conversationId}`);
  return { ok: true };
}

// Supprime mon message : il reste visible sous la forme « Message supprimé ».
export async function supprimerMessage(messageId: string, conversationId: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("messages")
    .update({ deleted: true })
    .eq("id", messageId)
    .eq("author_id", user.id);

  if (error) return { error: "Suppression impossible." };

  revalidatePath(`/messages/${conversationId}`);
  return { ok: true };
}

// Marque la conversation comme lue pour moi.
export async function marquerConversationLue(conversationId: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) return { error: "Action impossible." };
  return { ok: true };
}