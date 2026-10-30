"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Check, Link2, Pin, PinOff, Quote, Repeat2 } from "lucide-react";
import {
  basculerEpingle,
  basculerFavori,
  basculerRepublication,
} from "@/app/actions/interactions";

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
  "flex shrink-0 items-center gap-1 rounded-xl border border-border px-2.5 py-1 text-sm transition-colors hover:bg-surface disabled:opacity-50";
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
  const [copie, setCopie] = useState(false);

  function lancer(action: () => Promise<Resultat>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) return;
      router.refresh();
    });
  }

  function copierLien() {
    navigator.clipboard
      .writeText(`${window.location.origin}/publication/${postId}`)
      .then(() => {
        setCopie(true);
        setTimeout(() => setCopie(false), 2000);
      });
  }

  return (
    <>
      {connecte && (
        <>
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

          <Link
            href={`/citer/${postId}`}
            aria-label="Citer cette publication"
            title="Citer"
            className={boutonClasse}
          >
            <Quote size={16} aria-hidden="true" />
          </Link>
        </>
      )}

      <button
        type="button"
        onClick={copierLien}
        aria-label="Copier le lien de la publication"
        title={copie ? "Lien copié" : "Partager"}
        className={boutonClasse}
      >
        {copie ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
      </button>
    </>
  );
}