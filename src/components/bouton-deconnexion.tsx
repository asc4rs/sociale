"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function BoutonDeconnexion() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/connexion");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-surface disabled:opacity-50"
    >
      {pending ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}