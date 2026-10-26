"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supprimerPublication } from "@/app/actions/publications";
import { BoutonLike } from "@/components/bouton-like";

type Props = {
  id: string;
  contenu: string;
  date: string;
  auteurNom: string;
  auteurPseudo: string;
  estMienne: boolean;
  nombreLikes: number;
  dejaLike: boolean;
};

export function PublicationCarte({
  id,
  contenu,
  date,
  auteurNom,
  auteurPseudo,
  estMienne,
  nombreLikes,
  dejaLike,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

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
        <BoutonLike postId={id} nombreInitial={nombreLikes} dejaLikeInitial={dejaLike} />

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
    </article>
  );
}