"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supprimerPublication } from "@/app/actions/publications";
import { BoutonLike } from "@/components/bouton-like";
import {
  SectionCommentaires,
  type CommentaireAffiche,
} from "@/components/section-commentaires";

type Props = {
  id: string;
  contenu: string;
  date: string;
  auteurNom: string;
  auteurPseudo: string;
  estMienne: boolean;
  connecte: boolean;
  nombreLikes: number;
  dejaLike: boolean;
  commentaires: CommentaireAffiche[];
};

export function PublicationCarte({
  id,
  contenu,
  date,
  auteurNom,
  auteurPseudo,
  estMienne,
  connecte,
  nombreLikes,
  dejaLike,
  commentaires,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [commentairesOuverts, setCommentairesOuverts] = useState(false);

  function handleDelete() {
    setMessage(null);

    startTransition(async () => {
      const result = await supprimerPublication(id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <article className="rounded-xl border border-border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <Link href={`/u/${auteurPseudo}`} className="font-semibold hover:underline">
          {auteurNom}
        </Link>
        <span className="text-xs text-muted">{date}</span>
      </div>
      <p className="text-sm text-muted">@{auteurPseudo}</p>

      <p className="mt-3 whitespace-pre-wrap">{contenu}</p>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BoutonLike postId={id} nombreInitial={nombreLikes} dejaLikeInitial={dejaLike} />

          <button
            type="button"
            onClick={() => setCommentairesOuverts(!commentairesOuverts)}
            className="rounded-xl border border-border px-3 py-1 text-sm font-semibold hover:bg-surface"
          >
            Commentaires ({commentaires.length})
          </button>
        </div>

        {estMienne && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            {pending ? "Suppression..." : "Supprimer"}
          </button>
        )}
      </div>

      {message && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {message}
        </p>
      )}

      {commentairesOuverts && (
        <SectionCommentaires postId={id} commentaires={commentaires} connecte={connecte} />
      )}
    </article>
  );
}