import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { FormulaireProfil } from "@/components/formulaire-profil";
import { TeleverserImage } from "@/components/televerser-image";

export default function ModifierProfilPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuModifier />
    </Suspense>
  );
}

async function ContenuModifier() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: moi } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url, banner_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Modifier mon profil</h1>

      <section>
        <h2 className="text-lg font-semibold">Bannière</h2>
        <div className="mt-3 h-36 w-full overflow-hidden rounded-xl bg-surface">
          {moi?.banner_url && (
            <img src={moi.banner_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="mt-3">
          <TeleverserImage champ="banner_url" libelle="Changer la bannière" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Photo de profil</h2>
        <div className="mt-3 flex items-center gap-4">
          <Avatar url={moi?.avatar_url} nom={moi?.display_name ?? "?"} taille="lg" />
          <TeleverserImage champ="avatar_url" libelle="Changer la photo" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Informations</h2>
        <div className="mt-3">
          <FormulaireProfil displayName={moi?.display_name ?? ""} bio={moi?.bio ?? null} />
        </div>
      </section>
    </div>
  );
}