"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerListe } from "@/app/actions/listes";

export function CreerListe() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [publique, setPublique] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    startTransition(async () => {
      const r = await creerListe(nom, publique);
      if (r.error) {
        setErreur(r.error);
        return;
      }
      setNom("");
      setPublique(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        maxLength={50}
        placeholder="Nom de la liste"
        className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-accent"
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={publique}
          onChange={(e) => setPublique(e.target.checked)}
          className="h-4 w-4"
        />
        Liste publique (visible par tout le monde)
      </label>

      <button
        type="submit"
        disabled={pending || nom.trim().length === 0}
        className="self-end rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Création..." : "Créer la liste"}
      </button>

      {erreur && (
        <p role="alert" className="text-sm text-red-600">
          {erreur}
        </p>
      )}
    </form>
  );
}