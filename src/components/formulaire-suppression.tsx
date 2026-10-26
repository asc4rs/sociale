"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supprimerMonCompte } from "@/app/actions/compte";

export function FormulaireSuppression() {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await supprimerMonCompte(texte);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.push("/connexion");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-red-600 p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Pour confirmer, écris SUPPRIMER en majuscules</span>
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground outline-none focus:border-accent"
        />
      </label>

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || texte !== "SUPPRIMER"}
        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Suppression..." : "Supprimer définitivement mon compte"}
      </button>
    </form>
  );
}