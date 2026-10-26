"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bloquer, debloquer } from "@/app/actions/moderation";
import { BoutonSignaler } from "@/components/bouton-signaler";

type Props = {
  cibleId: string;
  estBloque: boolean;
};

export function BoutonBloquer({ cibleId, estBloque }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = estBloque ? await debloquer(cibleId) : await bloquer(cibleId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-surface disabled:opacity-50"
        >
          {pending ? "..." : estBloque ? "Débloquer" : "Bloquer"}
        </button>

        <BoutonSignaler profileId={cibleId} libelle="Signaler ce compte" />
      </div>

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}