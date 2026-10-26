"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getEtatAbonnement,
  seDesabonner,
  suivre,
  type EtatAbonnement,
} from "@/app/actions/abonnements";

export function BoutonSuivre({ cibleId }: { cibleId: string }) {
  const [etat, setEtat] = useState<EtatAbonnement>("aucun");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getEtatAbonnement(cibleId).then(setEtat);
  }, [cibleId]);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      if (etat === "aucun") {
        const result = await suivre(cibleId);
        if (result.error) {
          setMessage(result.error);
          return;
        }
        const nouvelEtat = await getEtatAbonnement(cibleId);
        setEtat(nouvelEtat);
        return;
      }

      const result = await seDesabonner(cibleId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setEtat("aucun");
    });
  }

  const libelle =
    etat === "aucun"
      ? "Suivre"
      : etat === "en_attente"
        ? "Demande envoyée"
        : "Se désabonner";

  return (
    <div className="mt-6 flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity disabled:opacity-50"
      >
        {pending ? "..." : libelle}
      </button>
      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}