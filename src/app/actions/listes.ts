"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean; id?: string };

export async function creerListe(nom: string, publique: boolean): Promise<Resultat> {
  const n = nom.trim();
  if (n.length < 1 || n.length > 50) {
    return { error: "Le nom doit faire entre 1 et 50 caractères." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { data, error } = await supabase
    .from("lists")
    .insert({ owner_id: user.id, name: n, is_public: publique })
    .select("id")
    .single();

  if (error || !data) return { error: "Création impossible." };

  revalidatePath("/listes");
  return { ok: true, id: data.id };
}

export async function supprimerListe(id: string): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("lists")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: "Suppression impossible." };

  revalidatePath("/listes");
  return { ok: true };
}

export async function basculerVisibilite(id: string, publique: boolean): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("lists")
    .update({ is_public: publique })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: "Modification impossible." };

  revalidatePath("/listes");
  return { ok: true };
}

export async function basculerMembre(
  listeId: string,
  membreId: string,
  actif: boolean,
): Promise<Resultat> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  if (actif) {
    const { error } = await supabase.from("list_members").upsert(
      { list_id: listeId, user_id: membreId },
      { onConflict: "list_id,user_id", ignoreDuplicates: true },
    );
    if (error) return { error: "Ajout impossible." };
  } else {
    const { error } = await supabase
      .from("list_members")
      .delete()
      .eq("list_id", listeId)
      .eq("user_id", membreId);
    if (error) return { error: "Retrait impossible." };
  }

  revalidatePath(`/listes/${listeId}`);
  return { ok: true };
}