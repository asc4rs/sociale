"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

const champ =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function ChangerMotDePasse() {
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "erreur"; texte: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (nouveau.length < 8) {
      setMessage({ type: "erreur", texte: "Le mot de passe doit faire 8 caractères minimum." });
      return;
    }
    if (nouveau !== confirmation) {
      setMessage({ type: "erreur", texte: "Les deux mots de passe ne correspondent pas." });
      return;
    }

    startTransition(async () => {
      const { error } = await createClient().auth.updateUser({ password: nouveau });
      if (error) {
        setMessage({ type: "erreur", texte: "Changement impossible. Réessaie." });
        return;
      }
      setNouveau("");
      setConfirmation("");
      setMessage({ type: "ok", texte: "Mot de passe modifié." });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="password"
        value={nouveau}
        onChange={(e) => setNouveau(e.target.value)}
        placeholder="Nouveau mot de passe"
        autoComplete="new-password"
        className={champ}
      />
      <input
        type="password"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        placeholder="Confirme le mot de passe"
        autoComplete="new-password"
        className={champ}
      />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Changer le mot de passe"}
      </button>
      {message && (
        <p role="status" className={`text-sm ${message.type === "ok" ? "" : "text-red-600"}`}>
          {message.texte}
        </p>
      )}
    </form>
  );
}