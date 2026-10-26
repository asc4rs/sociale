import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FormulaireSuppression } from "@/components/formulaire-suppression";

export default function SupprimerComptePage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuSuppression />
    </Suspense>
  );
}

async function ContenuSuppression() {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Supprimer mon compte</h1>

      <div className="mt-6 flex flex-col gap-3 text-sm">
        <p>La suppression est définitive et ne peut pas être annulée. Elle entraîne :</p>
        <ul className="ml-5 list-disc text-muted">
          <li>la suppression de ton profil et de ton nom d&apos;utilisateur ;</li>
          <li>la suppression de tes publications, commentaires et likes ;</li>
          <li>la suppression de tes messages envoyés, qui laissent un vide dans les conversations ;</li>
          <li>la fin de tous tes abonnements et de tes blocages ;</li>
          <li>la déconnexion de toutes tes sessions.</li>
        </ul>
      </div>

      <div className="mt-8">
        <FormulaireSuppression />
      </div>
    </div>
  );
}