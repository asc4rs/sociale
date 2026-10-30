"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, MessageCircle, Trash2 } from "lucide-react";
import { supprimerPublication } from "@/app/actions/publications";
import { ApercuProfil } from "@/components/apercu-profil";
import { Avatar } from "@/components/avatar";
import { BoutonLike } from "@/components/bouton-like";
import { BoutonsPublication } from "@/components/boutons-publication";
import { EnregistrerVue } from "@/components/enregistrer-vue";
import { MenuPublication } from "@/components/menu-publication";
import {
  SectionCommentaires,
  type CommentaireAffiche,
} from "@/components/section-commentaires";
import { Sondage, type OptionSondage } from "@/components/sondage";

type Props = {
  id: string;
  contenu: string;
  date: string;
  auteurId: string;
  auteurNom: string;
  auteurPseudo: string;
  avatarUrl?: string | null;
  estMienne: boolean;
  connecte: boolean;
  nombreLikes: number;
  dejaLike: boolean;
  commentaires: CommentaireAffiche[];
  nombreReposts: number;
  dejaRepost: boolean;
  dejaFavori: boolean;
  estEpinglee: boolean;
  vues: number;
  kind?: "texte" | "sondage" | "question";
  options?: OptionSondage[];
  programmeePour?: string | null;
  commentaireCible?: string | null;
};

export function PublicationCarte({
  id,
  contenu,
  date,
  auteurId,
  auteurNom,
  auteurPseudo,
  avatarUrl = null,
  estMienne,
  connecte,
  nombreLikes,
  dejaLike,
  commentaires,
  nombreReposts,
  dejaRepost,
  dejaFavori,
  estEpinglee,
  vues,
  kind = "texte",
  options = [],
  programmeePour = null,
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
      <div className="flex items-start justify-between gap-2">
        <ApercuProfil auteurId={auteurId}>
          <Link href={`/u/${auteurPseudo}`} className="flex items-center gap-2">
            <Avatar url={avatarUrl} nom={auteurNom} />
            <span>
              <span className="block font-semibold hover:underline">{auteurNom}</span>
              <span className="block text-sm text-muted">@{auteurPseudo}</span>
            </span>
          </Link>
        </ApercuProfil>

        {connecte && !estMienne && <MenuPublication postId={id} auteurId={auteurId} />}
      </div>

      {kind === "question" && (
        <p className="mt-3 text-xs font-semibold text-muted">Question</p>
      )}

      {programmeePour && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted">
          <Clock size={14} aria-hidden="true" />
          Programmée pour le {programmeePour}
        </p>
      )}

      <p className="mt-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{contenu}</p>

      {kind === "sondage" && options.length > 0 && (
        <Sondage postId={id} options={options} connecte={connecte} />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
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

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>
          {estEpinglee && "Épinglée · "}
          {date}
        </span>
        <span>
          {vues} {vues > 1 ? "vues" : "vue"}
        </span>
      </div>

      <EnregistrerVue postId={id} auteurId={auteurId} />

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