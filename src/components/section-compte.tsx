"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { SelecteurTheme } from "@/components/selecteur-theme";

type Props = {
  estAdmin: boolean;
};

const lienClasse =
  "block rounded-xl border border-border p-4 font-medium transition-colors hover:bg-surface";

export function SectionCompte({ estAdmin }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDeconnexion() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/connexion");
      router.refresh();
    });
  }

  return (
    <div className="mt-10 flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-semibold">Affichage</h2>
        <div className="mt-3">
          <SelecteurTheme />
        </div>
        <Link href="/affichage" className="mt-3 inline-block text-sm underline">
          Plus d&apos;options d&apos;affichage
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Aide et informations</h2>
        <ul className="mt-3 flex flex-col gap-2">
          <li>
            <Link href="/aide" className={lienClasse}>Aide et FAQ</Link>
          </li>
          <li>
            <Link href="/a-propos" className={lienClasse}>À propos de Sociale</Link>
          </li>
          <li>
            <Link href="/conditions" className={lienClasse}>Conditions générales</Link>
          </li>
          <li>
            <Link href="/confidentialite" className={lienClasse}>Politique de confidentialité</Link>
          </li>
        </ul>
      </section>

      {estAdmin && (
        <section>
          <h2 className="text-lg font-semibold">Administration</h2>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/administration" className={lienClasse}>
              Gérer les utilisateurs et publications
            </Link>
            <Link href="/moderation" className={lienClasse}>
              Voir les signalements
            </Link>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold">Compte</h2>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleDeconnexion}
            disabled={pending}
            className={`${lienClasse} text-left disabled:opacity-50`}
          >
            {pending ? "Déconnexion..." : "Se déconnecter"}
          </button>
          <Link
            href="/supprimer-compte"
            className="block rounded-xl border border-red-600 p-4 font-medium text-red-600 transition-colors hover:bg-surface"
          >
            Supprimer mon compte
          </Link>
        </div>
      </section>
    </div>
  );
}