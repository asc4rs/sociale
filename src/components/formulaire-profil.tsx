"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const champ =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

type Props = {
  displayName: string;
  bio: string | null;
};

export function FormulaireProfil({ displayName, bio }: Props) {
  const router = useRouter();
  const [nom, setNom] = useState(displayName);
  const [texte, setTexte] = useState(bio ?? "");
  const [message, setMessage] = useState<{ type: "ok" | "erreur"; texte: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const nomPropre = nom.trim();
    if (nomPropre.length < 1 || nomPropre.length > 50) {
      setMessage({ type: "erreur", texte: "Le nom doit faire entre 1 et 50 caractères." });
      return;
    }
    if (texte.length > 160) {
      setMessage({ type: "erreur", texte: "La bio ne peut pas dépasser 160 caractères." });
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: nomPropre, bio: texte.trim() || null })
        .eq("id", user.id);

      if (error) {
        setMessage({ type: "erreur", texte: "Enregistrement impossible." });
        return;
      }
      setMessage({ type: "ok", texte: "Profil enregistré." });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Nom affiché
        <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={50} className={champ} />
      </label>

      <label className="flex flex-col gap-1 text-sm font-semibold">
        Bio
        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          maxLength={160}
          className={`${champ} min-h-20 resize-y`}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>

      {message && (
        <p role="status" className={`text-sm ${message.type === "ok" ? "" : "text-red-600"}`}>
          {message.texte}
        </p>
      )}
    </form>
  );
}