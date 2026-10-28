"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PAGES_AVEC_RETOUR, commencePar } from "@/lib/pages";

// Flèche de retour, uniquement sur les pages secondaires.
export function BarreRetour() {
  const pathname = usePathname();
  const router = useRouter();

  if (!commencePar(pathname, PAGES_AVEC_RETOUR)) return null;

  function retour() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 pt-6 md:px-8 md:pt-8">
      <button
        type="button"
        onClick={retour}
        aria-label="Retour"
        title="Retour"
        className="rounded-xl p-2 text-muted hover:bg-surface hover:text-foreground"
      >
        <ArrowLeft size={22} aria-hidden="true" />
      </button>
    </div>
  );
}