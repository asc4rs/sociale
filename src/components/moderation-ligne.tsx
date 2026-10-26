"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  supprimerPublicationModere,
  traiterSignalement,
} from "@/app/actions/moderation";

type Props = {
  id: string;
  raison: string;
  signalePar: string;
  postId: string | null;
  profileId: string | null;
  date: string;
};

export function ModerationLigne({ id, raison, signalePar, postId, date }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function lancer(action: () => Promise<{ error?: string; ok?: boolean }>) {
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
    <article className="rounded-xl border border-border p-4">
      <p className="text-xs text-muted">
        Signalé par @{signalePar} · {date}
      </p>
      <p className="mt-2 text-sm">{raison}</p>
      {postId && <p className="mt-1 text-xs text-muted">Publication signalée</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {postId && (
          <button
            type="button"
            disabled={pending}
            onClick={() => lancer(() => supprimerPublicationModere(postId))}
            className="rounded-xl bg-red-600 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
          >
            Supprimer la publication
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => lancer(() => traiterSignalement(id, "traite"))}
          className="rounded-xl border border-border px-3 py-1 text-sm font-semibold hover:bg-surface disabled:opacity-50"
        >
          Marquer traité
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => lancer(() => traiterSignalement(id, "rejete"))}
          className="rounded-xl border border-border px-3 py-1 text-sm font-semibold hover:bg-surface disabled:opacity-50"
        >
          Rejeter
        </button>
      </div>

      {message && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {message}
        </p>
      )}
    </article>
  );
}