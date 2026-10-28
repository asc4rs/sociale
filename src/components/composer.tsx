"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerPublication } from "@/app/actions/publications";

const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "👍", "👏",
  "🔥", "🎉", "❤️", "😢", "😡", "🙏", "✨", "💯",
];

export function Composer() {
  const router = useRouter();
  const zone = useRef<HTMLTextAreaElement>(null);
  const [contenu, setContenu] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Insère l'émoji à l'endroit où se trouve le curseur.
  function ajouterEmoji(emoji: string) {
    const el = zone.current;
    const debut = el?.selectionStart ?? contenu.length;
    const fin = el?.selectionEnd ?? contenu.length;
    setContenu(contenu.slice(0, debut) + emoji + contenu.slice(fin));
    requestAnimationFrame(() => {
      el?.focus();
      const pos = debut + emoji.length;
      el?.setSelectionRange(pos, pos);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await creerPublication(contenu);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setContenu("");
      router.refresh();
    });
  }

  const restant = 280 - contenu.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        ref={zone}
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        maxLength={280}
        placeholder="Quoi de neuf ?"
        className="min-h-24 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-accent"
      />

      <div className="flex flex-wrap gap-1">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            aria-label={`Ajouter ${e}`}
            onClick={() => ajouterEmoji(e)}
            className="rounded-lg px-1.5 py-0.5 text-lg hover:bg-surface"
          >
            {e}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-sm ${restant < 20 ? "text-red-600" : "text-muted"}`}>
          {restant}
        </span>
        <button
          type="submit"
          disabled={pending || contenu.trim().length === 0}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          {pending ? "Envoi..." : "Publier"}
        </button>
      </div>

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </form>
  );
}