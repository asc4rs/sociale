"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { voterSondage } from "@/app/actions/publications";

export type OptionSondage = {
  id: string;
  libelle: string;
  votes: number;
  choisie: boolean;
};

type Props = {
  postId: string;
  options: OptionSondage[];
  connecte: boolean;
};

// Affiche un sondage. Tant qu'on n'a pas voté, les options sont cliquables.
// Après le vote, on voit les pourcentages.
export function Sondage({ postId, options, connecte }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const total = options.reduce((somme, o) => somme + o.votes, 0);
  const aVote = options.some((o) => o.choisie);
  const peutVoter = connecte && !aVote;

  function voter(optionId: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await voterSondage(postId, optionId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {options.map((o) => {
        const pourcent = total > 0 ? Math.round((o.votes * 100) / total) : 0;

        if (peutVoter) {
          return (
            <button
              key={o.id}
              type="button"
              disabled={pending}
              onClick={() => voter(o.id)}
              className="rounded-xl border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-surface disabled:opacity-50"
            >
              {o.libelle}
            </button>
          );
        }

        return (
          <div
            key={o.id}
            className={`relative overflow-hidden rounded-xl border px-3 py-2 text-sm ${
              o.choisie ? "border-accent" : "border-border"
            }`}
          >
            <div aria-hidden="true" className="absolute inset-y-0 left-0 bg-surface" style={{ width: `${pourcent}%` }} />
            <div className="relative flex justify-between gap-2">
              <span className={o.choisie ? "font-semibold" : ""}>{o.libelle}</span>
              <span className="text-muted">{pourcent}%</span>
            </div>
          </div>
        );
      })}

      <p className="text-xs text-muted">
        {total} vote{total > 1 ? "s" : ""}
      </p>

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}