"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { marquerToutesLues } from "@/app/actions/notifications";
import { viderNotifications } from "@/app/actions/vider-notifications";

const bouton =
  "rounded-xl border border-border px-3 py-1 text-sm font-semibold hover:bg-surface disabled:opacity-50";

export function BoutonToutLire() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toutLire() {
    startTransition(async () => {
      await marquerToutesLues();
      window.dispatchEvent(new Event("notifications-lues"));
      router.refresh();
    });
  }

  function vider() {
    if (!window.confirm("Supprimer toutes tes notifications ? Cette action est définitive.")) {
      return;
    }
    startTransition(async () => {
      const result = await viderNotifications();
      if (result.error) return;
      window.dispatchEvent(new Event("notifications-lues"));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={toutLire} disabled={pending} className={bouton}>
        Tout marquer comme lu
      </button>
      <button
        type="button"
        onClick={vider}
        disabled={pending}
        className="rounded-xl border border-red-600 px-3 py-1 text-sm font-semibold text-red-600 hover:bg-surface disabled:opacity-50"
      >
        Vider
      </button>
    </div>
  );
}