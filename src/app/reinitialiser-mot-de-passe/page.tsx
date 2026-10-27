"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-accent";

export default function ReinitialiserPage() {
  const router = useRouter();
  const [pret, setPret] = useState<boolean | null>(null);
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Le lien du mail ouvre une session temporaire : on vérifie qu'elle existe.
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setPret(!!user));
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (nouveau.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (nouveau !== confirmation) {
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: nouveau });

      if (error) {
        setMessage("Impossible de changer le mot de passe. Refais la demande depuis le lien reçu.");
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  if (pret === null) {
    return <p className="p-8 text-muted">Chargement...</p>;
  }

  if (!pret) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
        <h1 className="text-3xl font-bold">Lien expiré</h1>
        <p className="mt-3 text-muted">Ce lien n&apos;est plus valide. Refais une demande de réinitialisation.</p>
        <Link href="/mot-de-passe-oublie" className="mt-6 text-sm underline">
          Refaire la demande
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <h1 className="text-3xl font-bold">Nouveau mot de passe</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Nouveau mot de passe</span>
          <input
            className={inputClass}
            type="password"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Confirme le mot de passe</span>
          <input
            className={inputClass}
            type="password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        {message && (
          <p role="alert" className="text-sm text-red-600">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent px-4 py-3 font-semibold text-accent-foreground disabled:opacity-50"
        >
          {pending ? "Enregistrement..." : "Changer le mot de passe"}
        </button>
      </form>
    </div>
  );
}