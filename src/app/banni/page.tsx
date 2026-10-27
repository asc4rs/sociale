import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BoutonDeconnexion } from "@/components/bouton-deconnexion";

export default function BanniPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuBanni />
    </Suspense>
  );
}

async function ContenuBanni() {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: moi } = await supabase
    .from("profiles")
    .select("is_banned, ban_reason")
    .eq("id", user.id)
    .maybeSingle();

  if (!moi?.is_banned) redirect("/");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Compte suspendu</h1>
      <p className="text-muted">
        Ton compte a été suspendu par l&apos;équipe de modération. Tu ne peux plus publier, commenter ni interagir.
      </p>
      <div className="rounded-xl border border-border p-4 text-sm">
        <p className="font-semibold">Motif</p>
        <p className="mt-1 whitespace-pre-wrap">{moi.ban_reason ?? "Non précisé"}</p>
      </div>
      <div>
        <BoutonDeconnexion />
      </div>
    </div>
  );
}