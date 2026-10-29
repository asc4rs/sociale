"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  champ: string;
  libelle: string;
  description?: string;
  valeur: boolean;
};

// Interrupteur qui enregistre directement une option de ton profil.
export function InterrupteurProfil({ champ, libelle, description, valeur }: Props) {
  const router = useRouter();
  const [etat, setEtat] = useState(valeur);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function basculer() {
    const nouveau = !etat;
    setEtat(nouveau);
    setErreur(null);

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ [champ]: nouveau })
        .eq("id", user.id);

      if (error) {
        setEtat(!nouveau);
        setErreur("Enregistrement impossible. Réessaie.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
      <div className="min-w-0">
        <p className="font-semibold">{libelle}</p>
        {description && <p className="text-sm text-muted">{description}</p>}
        {erreur && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {erreur}
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={etat}
        aria-label={libelle}
        disabled={pending}
        onClick={basculer}
        className={`relative h-6 w-11 shrink-0 rounded-full disabled:opacity-50 ${
          etat ? "bg-white" : "bg-neutral-700"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-neutral-900 transition-transform ${
            etat ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}