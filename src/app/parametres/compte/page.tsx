import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ChangerMotDePasse } from "@/components/changer-mot-de-passe";

export default function CompteParametres() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuCompte />
    </Suspense>
  );
}

async function ContenuCompte() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: moi } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Votre compte</h1>

      <section>
        <h2 className="text-lg font-semibold">Informations du compte</h2>
        <div className="mt-3 rounded-xl border border-border p-4 text-sm">
          <p>
            <span className="font-semibold">{moi?.display_name}</span>{" "}
            <span className="text-muted">@{moi?.username}</span>
          </p>
          <p className="mt-1 text-muted">{user.email}</p>
        </div>
        <Link href="/profil/modifier" className="mt-3 inline-block text-sm underline">
          Modifier mon profil
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Changer de mot de passe</h2>
        <div className="mt-3">
          <ChangerMotDePasse />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Supprimer le compte</h2>
        <Link
          href="/supprimer-compte"
          className="mt-3 block rounded-xl border border-red-600 p-4 font-medium text-red-600 hover:bg-surface"
        >
          Supprimer mon compte
        </Link>
      </section>
    </div>
  );
}