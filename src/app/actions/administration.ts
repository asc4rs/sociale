"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultat = { error?: string; ok?: boolean };

async function appeler(fonction: string, args: Record<string, unknown>): Promise<Resultat> {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fonction, args);
  if (error) return { error: error.message };
  revalidatePath("/administration");
  revalidatePath("/");
  return { ok: true };
}

export async function avertir(cible: string, raison: string) {
  return appeler("admin_avertir", { cible, raison });
}

export async function bannir(cible: string, raison: string) {
  return appeler("admin_bannir", { cible, raison, banni: true });
}

export async function debannir(cible: string) {
  return appeler("admin_bannir", { cible, raison: "", banni: false });
}

export async function supprimerPublicationAdmin(pid: string, raison: string) {
  return appeler("admin_supprimer_publication", { pid, raison });
}