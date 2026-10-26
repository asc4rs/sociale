"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { trouverOuCreerConversation } from "@/app/actions/messages";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-accent";

export function NouveauMessage() {
  const router = useRouter();
  const [pseudos, setPseudos] = useState("");
  const [nomGroupe, setNomGroupe] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const liste = pseudos
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    startTransition(async () => {
      const result = await trouverOuCreerConversation(liste, nomGroupe);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      if (result.id) router.push(`/messages/${result.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Pseudo(s), séparés par des virgules</span>
        <input
          className={inputClass}
          value={pseudos}
          onChange={(e) => setPseudos(e.target.value)}
          placeholder="ex : testeur"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Nom du groupe (si plusieurs pseudos)</span>
        <input
          className={inputClass}
          value={nomGroupe}
          onChange={(e) => setNomGroupe(e.target.value)}
          maxLength={50}
          placeholder="Optionnel"
        />
      </label>

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || pseudos.trim().length === 0}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          {pending ? "Ouverture..." : "Ouvrir la conversation"}
        </button>
      </div>
    </form>
  );
}