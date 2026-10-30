"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { bloquer } from "@/app/actions/moderation";
import { BoutonSuivreProfil } from "@/components/bouton-suivre-profil";

type Etat = "aucun" | "attente" | "suivi";

type Props = {
  cibleId: string;
  etatInitial: Etat;
};

// Bouton Suivre, plus un menu ⋮ avec Bloquer.
export function ActionsProfil({ cibleId, etatInitial }: Props) {
  const router = useRouter();
  const racine = useRef<HTMLDivElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Ferme le menu quand on clique ailleurs.
  useEffect(() => {
    function fermerSiDehors(e: MouseEvent) {
      if (racine.current && !racine.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener("mousedown", fermerSiDehors);
    return () => document.removeEventListener("mousedown", fermerSiDehors);
  }, []);

  function handleBloquer() {
    setMessage(null);
    startTransition(async () => {
      const result = await bloquer(cibleId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setOuvert(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <BoutonSuivreProfil cibleId={cibleId} etatInitial={etatInitial} />

      <div ref={racine} className="relative">
        <button
          type="button"
          aria-label="Plus d'options"
          aria-expanded={ouvert}
          onClick={() => setOuvert(!ouvert)}
          className="rounded-xl border border-border p-1.5 hover:bg-surface"
        >
          <MoreHorizontal size={18} aria-hidden="true" />
        </button>

        {ouvert && (
          <div className="absolute right-0 top-full z-40 mt-2 flex w-44 flex-col gap-1 rounded-xl border border-border bg-background p-2 shadow-lg">
            <button
              type="button"
              disabled={pending}
              onClick={handleBloquer}
              className="rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-surface disabled:opacity-50"
            >
              Bloquer
            </button>
            {message && <p className="px-2 text-sm text-red-600">{message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}