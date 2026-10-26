"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  basculerEpingle,
  basculerFavori,
  basculerRepublication,
} from "@/app/actions/interactions";
import { BoutonSignaler } from "@/components/bouton-signaler";

type Resultat = { error?: string; ok?: boolean };

type Props = {
  postId: string;
  nombreReposts: number;
  dejaRepost: boolean;
  dejaFavori: boolean;
  estEpinglee: boolean;
  estMienne: boolean;
  connecte: boolean;
};

const boutonClasse =
  "rounded-xl border border-border px-3 py-1 text-sm font-semibold hover:bg-surface disabled:opacity-50";

export function BoutonsPublication({
  postId,
  nombreReposts,
  dejaRepost,
  dejaFavori,
  estEpinglee,
  estMienne,
  connecte,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!connecte) return null;

  function lancer(action: () => Promise<Resultat>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => lancer(() => basculerRepublication(postId, dejaRepost))}
        className={boutonClasse}
      >
        {dejaRepost ? "Annuler la republication" : "Republier"} ({nombreReposts})
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => lancer(() => basculerFavori(postId, dejaFavori))}
        className={boutonClasse}
      >
        {dejaFavori ? "Retirer des favoris" : "Enregistrer"}
      </button>

      {estMienne && (
        <button
          type="button"
          disabled={pending}
          onClick={() => lancer(() => basculerEpingle(postId, estEpinglee))}
          className={boutonClasse}
        >
          {estEpinglee ? "Désépingler" : "Épingler"}
        </button>
      )}

      {!estMienne && <BoutonSignaler postId={postId} libelle="Signaler" />}

      {message && (
        <span role="alert" className="text-sm text-red-600">
          {message}
        </span>
      )}
    </div>
  );
}