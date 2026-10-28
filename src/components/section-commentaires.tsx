"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ajouterCommentaire, supprimerCommentaire } from "@/app/actions/commentaires";

export type CommentaireAffiche = {
  id: string;
  contenu: string;
  date: string;
  auteurNom: string;
  auteurPseudo: string;
  estMien: boolean;
};

type Props = {
  postId: string;
  commentaires: CommentaireAffiche[];
  connecte: boolean;
  cible?: string | null;
};

export function SectionCommentaires({ postId, commentaires, connecte, cible = null }: Props) {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Si on arrive depuis une notification, on fait défiler jusqu'au commentaire visé.
  useEffect(() => {
    if (!cible) return;
    const element = document.getElementById(`commentaire-${cible}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [cible]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await ajouterCommentaire(postId, texte);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setTexte("");
      router.refresh();
    });
  }

  function handleDelete(commentId: string) {
    setMessage(null);

    startTransition(async () => {
      const result = await supprimerCommentaire(commentId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      {connecte && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            maxLength={280}
            placeholder="Ajouter un commentaire"
            className="min-h-16 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending || texte.trim().length === 0}
              className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground disabled:opacity-50"
            >
              {pending ? "Envoi..." : "Répondre"}
            </button>
          </div>
        </form>
      )}

      {message && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {message}
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {commentaires.length === 0 && (
          <li className="text-sm text-muted">Aucun commentaire pour le moment.</li>
        )}

        {commentaires.map((c) => (
          <li
            key={c.id}
            id={`commentaire-${c.id}`}
            className={`rounded-xl border border-border p-3 text-sm ${
              cible === c.id ? "ring-2 ring-accent" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <Link href={`/u/${c.auteurPseudo}`} className="font-semibold hover:underline">
                    {c.auteurNom}
                  </Link>
                  <span className="text-xs text-muted">@{c.auteurPseudo}</span>
                </div>
                <span className="text-xs text-muted">{c.date}</span>
              </div>

              {c.estMien && (
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={pending}
                  aria-label="Supprimer le commentaire"
                  title="Supprimer"
                  className="shrink-0 rounded-lg p-1 text-red-600 hover:bg-surface disabled:opacity-50"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              )}
            </div>

            <p className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{c.contenu}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}