"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-accent";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const adresse = email.trim();
    if (adresse.length === 0) {
      setMessage("Saisis ton adresse e-mail.");
      return;
    }

    setEnvoi(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(adresse, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reinitialiser-mot-de-passe`,
      });

      if (error) {
        setMessage(`Envoi impossible : ${error.message}`);
      } else {
        setEnvoye(true);
      }
    } catch (e) {
      setMessage(`Erreur inattendue : ${e instanceof Error ? e.message : "inconnue"}`);
    } finally {
      setEnvoi(false);
    }
  }

  if (envoye) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
        <h1 className="text-3xl font-bold">Vérifie ta boîte mail</h1>
        <p className="mt-3 text-muted">
          Si un compte existe pour cette adresse, un lien de réinitialisation vient d&apos;être envoyé.
        </p>
        <Link href="/connexion" className="mt-6 text-sm underline">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
      <p className="mt-2 text-muted">Indique ton adresse e-mail, nous t&apos;enverrons un lien.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Adresse e-mail</span>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        {message && (
          <p role="alert" className="text-sm text-red-600">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={envoi}
          className="rounded-xl bg-accent px-4 py-3 font-semibold text-accent-foreground disabled:opacity-50"
        >
          {envoi ? "Envoi en cours..." : "Envoyer le lien"}
        </button>
      </form>

      <Link href="/connexion" className="mt-6 text-center text-sm underline">
        Retour à la connexion
      </Link>
    </div>
  );
}