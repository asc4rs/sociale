"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { accepterDemande, refuserDemande } from "@/app/actions/abonnements";

type Props = {
  followerId: string;
  username: string;
  displayName: string;
};

export function DemandeLigne({ followerId, username, displayName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handle(action: (id: string) => Promise<{ error?: string; ok?: boolean }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action(followerId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
      <Link href={`/u/${username}`} className="font-semibold hover:underline">
        {displayName}
      </Link>
      <p className="text-sm text-muted">@{username}</p>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => handle(accepterDemande)}
          disabled={pending}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          Accepter
        </button>
        <button
          type="button"
          onClick={() => handle(refuserDemande)}
          disabled={pending}
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Refuser
        </button>
      </div>

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}