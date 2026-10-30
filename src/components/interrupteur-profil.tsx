"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  champ: string;
  libelle: string;
  description?: string;
  valeur: boolean;
};

// Interrupteur qui enregistre directement une option de ton profil.
export function InterrupteurProfil({ champ, libelle, description, valeur }: Props) {
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
      }
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
        className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 disabled:opacity-50 ${
          etat ? "justify-end bg-white" : "justify-start bg-neutral-700"
        }`}
      >
        <span aria-hidden="true" className="h-5 w-5 rounded-full bg-neutral-900" />
      </button>
    </div>
  );
}