"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { signaler } from "@/app/actions/moderation";

type Props = {
  postId?: string;
  profileId?: string;
  libelle: string;
  icone?: boolean;
};

export function BoutonSignaler({ postId, profileId, libelle, icone = false }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [raison, setRaison] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSend() {
    setMessage(null);
    startTransition(async () => {
      const result = await signaler({ postId, profileId }, raison);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setEnvoye(true);
      setOuvert(false);
      setRaison("");
    });
  }

  if (envoye) {
    return <span className="text-sm text-muted">Signalé</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      {icone ? (
        <button
          type="button"
          onClick={() => setOuvert(!ouvert)}
          aria-label={libelle}
          title={libelle}
          className="flex items-center rounded-xl border border-border px-2.5 py-1 text-sm hover:bg-surface"
        >
          <Flag size={16} aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOuvert(!ouvert)}
          className="rounded-xl border border-border px-3 py-1 text-sm font-semibold hover:bg-surface"
        >
          {libelle}
        </button>
      )}

      {ouvert && (
        <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
          <textarea
            value={raison}
            onChange={(e) => setRaison(e.target.value)}
            maxLength={500}
            placeholder="Pourquoi signales-tu ceci ?"
            className="min-h-16 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSend}
              disabled={pending || raison.trim().length === 0}
              className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground disabled:opacity-50"
            >
              {pending ? "Envoi..." : "Envoyer le signalement"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}