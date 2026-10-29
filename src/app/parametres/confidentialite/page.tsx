import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { InterrupteurProfil } from "@/components/interrupteur-profil";

export default function ConfidentialiteParametres() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuConfidentialite />
    </Suspense>
  );
}

async function ContenuConfidentialite() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: moi } = await supabase
    .from("profiles")
    .select("is_private")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Confidentialité</h1>

      <InterrupteurProfil
        champ="is_private"
        libelle="Compte privé"
        description="Seules les personnes que tu acceptes peuvent voir tes publications. Les demandes d'abonnement apparaissent dans Demandes."
        valeur={!!moi?.is_private}
      />
    </div>
  );
}