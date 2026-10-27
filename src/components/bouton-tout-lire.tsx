"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { marquerToutesLues } from "@/app/actions/notifications";

export function BoutonToutLire() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await marquerToutesLues();
      window.dispatchEvent(new Event("notifications-lues"));
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-xl border border-border px-3 py-1 text-sm font-semibold hover:bg-surface disabled:opacity-50"
    >
      Tout marquer comme lu
    </button>
  );
}