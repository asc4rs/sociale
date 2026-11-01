"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publierBrouillon, supprimerBrouillon } from "@/app/actions/brouillons";

export function BoutonsBrouillon({ id }: { id: string }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function publier() {
    setErreur(null);
    startTransition(async () => {
      const r = await publierBrouillon(id);
      if (r.error) {
        setErreur(r.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  function supprimer() {
    if (!window.confirm("Supprimer ce brouillon ?")) return;
    setErreur(null);
    startTransition(async () => {
      const r = await supprimerBrouillon(id);
      if (r.error) {
        setErreur(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={publier}
          disabled={pending}
          className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          Publier
        </button>
        <button
          type="button"
          onClick={supprimer}
          disabled={pending}
          className="rounded-xl border border-red-600 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-surface disabled:opacity-50"
        >
          Supprimer
        </button>
      </div>
      {erreur && (
        <p role="alert" className="text-sm text-red-600">
          {erreur}
        </p>
      )}
    </div>
  );
}
