"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DebloquerCompte({ bloqueId }: { bloqueId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function debloquer() {
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", bloqueId);

      if (!error) router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={debloquer}
      disabled={pending}
      className="rounded-xl border border-border px-3 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50"
    >
      Débloquer
    </button>
  );
}