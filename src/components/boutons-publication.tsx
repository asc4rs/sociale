"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Pin, PinOff, Repeat2 } from "lucide-react";
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
  "flex items-center gap-1 rounded-xl border border-border px-2.5 py-1 text-sm transition-colors hover:bg-surface disabled:opacity-50";
const boutonActif = "bg-accent text-accent-foreground hover:bg-accent";

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
        aria-label={dejaRepost ? "Annuler la republication" : "Republier"}
        title={dejaRepost ? "Annuler la republication" : "Republier"}
        className={`${boutonClasse} ${dejaRepost ? boutonActif : ""}`}
      >
        <Repeat2 size={16} aria-hidden="true" />
        <span className="font-semibold">{nombreReposts}</span>
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => lancer(() => basculerFavori(postId, dejaFavori))}
        aria-label={dejaFavori ? "Retirer des favoris" : "Enregistrer"}
        title={dejaFavori ? "Retirer des favoris" : "Enregistrer"}
        className={`${boutonClasse} ${dejaFavori ? boutonActif : ""}`}
      >
        <Bookmark size={16} aria-hidden="true" fill={dejaFavori ? "currentColor" : "none"} />
      </button>

      {estMienne && (
        <button
          type="button"
          disabled={pending}
          onClick={() => lancer(() => basculerEpingle(postId, estEpinglee))}
          aria-label={estEpinglee ? "Désépingler" : "Épingler"}
          title={estEpinglee ? "Désépingler" : "Épingler"}
          className={`${boutonClasse} ${estEpinglee ? boutonActif : ""}`}
        >
          {estEpinglee ? <PinOff size={16} aria-hidden="true" /> : <Pin size={16} aria-hidden="true" />}
        </button>
      )}

      {!estMienne && <BoutonSignaler postId={postId} libelle="Signaler" icone />}

      {message && (
        <span role="alert" className="text-sm text-red-600">
          {message}
        </span>
      )}
    </div>
  );
}