"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, SquarePen, Users, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { NouveauMessage } from "@/components/nouveau-message";

type Compte = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type Props = {
  comptes: Compte[];
};

// Icône en haut à droite de la page Messages : ouvre la liste de mes abonnements.
export function NouveauMessagePopup({ comptes }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [vue, setVue] = useState<"liste" | "groupe">("liste");
  const [recherche, setRecherche] = useState("");

  const t = recherche.trim().toLowerCase();
  const visibles = comptes.filter(
    (c) =>
      t === "" ||
      c.display_name.toLowerCase().includes(t) ||
      c.username.toLowerCase().includes(t),
  );

  function fermer() {
    setOuvert(false);
    setVue("liste");
    setRecherche("");
  }

  // Ferme la fenêtre avec la touche Échap.
  useEffect(() => {
    if (!ouvert) return;
    function touche(e: KeyboardEvent) {
      if (e.key === "Escape") fermer();
    }
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [ouvert]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label="Nouveau message"
        title="Nouveau message"
        className="shrink-0 rounded-full border border-border p-2.5 hover:bg-surface"
      >
        <SquarePen size={20} aria-hidden="true" />
      </button>

      {ouvert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Nouveau message"
          onClick={fermer}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 p-4 pt-16"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              {vue === "groupe" ? (
                <button
                  type="button"
                  onClick={() => setVue("liste")}
                  aria-label="Retour"
                  className="rounded-full p-2 hover:bg-surface"
                >
                  <ArrowLeft size={20} aria-hidden="true" />
                </button>
              ) : (
                <span className="text-lg font-bold">Nouveau message</span>
              )}
              {vue === "groupe" && <span className="text-lg font-bold">Créer un groupe</span>}
              <button
                type="button"
                onClick={fermer}
                aria-label="Fermer"
                className="rounded-full p-2 hover:bg-surface"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {vue === "liste" && (
              <>
                <div className="px-5 pb-3">
                  <div className="relative">
                    <Search
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      placeholder="Rechercher un nom ou un @pseudo"
                      className="w-full rounded-full border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setVue("groupe")}
                  className="flex items-center gap-3 px-5 py-3 text-left font-semibold text-accent hover:bg-surface"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
                    <Users size={18} aria-hidden="true" />
                  </span>
                  Créer un groupe
                </button>

                <ul className="flex-1 overflow-y-auto pb-3">
                  {comptes.length === 0 && (
                    <li className="px-5 py-6 text-sm text-muted">
                      Tu ne suis encore aucun compte.
                    </li>
                  )}
                  {comptes.length > 0 && visibles.length === 0 && (
                    <li className="px-5 py-6 text-sm text-muted">Aucun compte ne correspond.</li>
                  )}
                  {visibles.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/nouvelle-conversation?cible=${c.id}`}
                        onClick={fermer}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-surface"
                      >
                        <Avatar url={c.avatar_url} nom={c.display_name} taille="md" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{c.display_name}</span>
                          <span className="block truncate text-sm text-muted">@{c.username}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {vue === "groupe" && (
              <div className="overflow-y-auto px-5 pb-5">
                <NouveauMessage />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}