import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDemandesRecues } from "@/app/actions/abonnements";
import { DemandeLigne } from "@/components/demande-ligne";

type Demande = {
  follower_id: string;
  profiles: { username: string; display_name: string } | null;
};

export default function DemandesPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuDemandes />
    </Suspense>
  );
}

async function ContenuDemandes() {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const demandes = (await getDemandesRecues()) as unknown as Demande[];

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Demandes d&apos;abonnement</h1>

      {demandes.length === 0 ? (
        <p className="mt-6 text-muted">Aucune demande en attente.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {demandes.map(
            (d) =>
              d.profiles && (
                <li key={d.follower_id}>
                  <DemandeLigne
                    followerId={d.follower_id}
                    username={d.profiles.username}
                    displayName={d.profiles.display_name}
                  />
                </li>
              ),
          )}
        </ul>
      )}
    </div>
  );
}