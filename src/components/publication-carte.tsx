"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Trash2 } from "lucide-react";
import { supprimerPublication } from "@/app/actions/publications";
import { BoutonLike } from "@/components/bouton-like";
import { BoutonsPublication } from "@/components/boutons-publication";
import { BoutonSignaler } from "@/components/bouton-signaler";
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
  nombreReposts: number;
  dejaRepost: boolean;
  dejaFavori: boolean;
  estEpinglee: boolean;
  commentaireCible?: string | null;
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
  nombreReposts,
  dejaRepost,
  dejaFavori,
  estEpinglee,
  commentaireCible = null,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [commentairesOuverts, setCommentairesOuverts] = useState(!!commentaireCible);

  function handleDelete() {
    startTransition(async () => {
      const result = await supprimerPublication(id);
      if (result.error) return;
      router.refresh();
    });
  }

  return (
    <article id={`publication-${id}`} className="rounded-xl border border-border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <Link href={`/u/${auteurPseudo}`} className="font-semibold hover:underline">
          {auteurNom}
        </Link>
        <span className="text-xs text-muted">
          {estEpinglee && "Épinglée · "}
          {date}
        </span>
      </div>
      <p className="text-sm text-muted">@{auteurPseudo}</p>

      <p className="mt-3 whitespace-pre-wrap">{contenu}</p>

      <div className="mt-3 flex flex-nowrap items-center gap-2">
        {connecte && (
          <BoutonLike postId={id} nombreInitial={nombreLikes} dejaLikeInitial={dejaLike} />
        )}

        <button
          type="button"
          onClick={() => setCommentairesOuverts(!commentairesOuverts)}
          aria-label={`Commentaires (${commentaires.length})`}
          title="Commentaires"
          className="flex shrink-0 items-center gap-1 rounded-xl border border-border px-2.5 py-1 text-sm transition-colors hover:bg-surface"
        >
          <MessageCircle size={16} aria-hidden="true" />
          <span className="font-semibold">{commentaires.length}</span>
        </button>

        <BoutonsPublication
          postId={id}
          nombreReposts={nombreReposts}
          dejaRepost={dejaRepost}
          dejaFavori={dejaFavori}
          estEpinglee={estEpinglee}
          estMienne={estMienne}
          connecte={connecte}
        />

        {!estMienne && connecte && (
          <BoutonSignaler postId={id} libelle="Signaler" icone />
        )}

        {estMienne && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            aria-label="Supprimer la publication"
            title="Supprimer"
            className="ml-auto shrink-0 rounded-xl p-1.5 text-red-600 hover:bg-surface disabled:opacity-50"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {commentairesOuverts && (
        <SectionCommentaires
          postId={id}
          commentaires={commentaires}
          connecte={connecte}
          cible={commentaireCible}
        />
      )}
    </article>
  );
}