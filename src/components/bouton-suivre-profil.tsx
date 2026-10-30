"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { seDesabonner, suivre } from "@/app/actions/abonnements";

type Etat = "aucun" | "attente" | "suivi";

type Props = {
  cibleId: string;
  etatInitial: Etat;
};

const libelles: Record<Etat, string> = {
  aucun: "Suivre",
  attente: "Demande envoyée",
  suivi: "Se désabonner",
};

export function BoutonSuivreProfil({ cibleId, etatInitial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function basculer() {
    startTransition(async () => {
      const result =
        etatInitial === "aucun" ? await suivre(cibleId) : await seDesabonner(cibleId);
      if (result?.error) return;
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={basculer}
      disabled={pending || etatInitial === "attente"}
      className={`rounded-xl px-4 py-1.5 text-sm font-semibold disabled:opacity-50 ${
        etatInitial === "aucun"
          ? "bg-accent text-accent-foreground"
          : "border border-border hover:bg-surface"
      }`}
    >
      {libelles[etatInitial]}
    </button>
  );
}