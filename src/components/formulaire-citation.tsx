"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerCitation } from "@/app/actions/citation";

export function FormulaireCitation({ citeId }: { citeId: string }) {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await creerCitation(citeId, texte);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  const restant = 280 - texte.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        maxLength={280}
        placeholder="Ajoute ton commentaire à la publication citée"
        className="min-h-24 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-accent"
      />

      <div className="flex items-center justify-between">
        <span className={`text-sm ${restant < 20 ? "text-red-600" : "text-muted"}`}>{restant}</span>
        <button
          type="submit"
          disabled={pending || texte.trim().length === 0}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          {pending ? "Envoi..." : "Citer"}
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