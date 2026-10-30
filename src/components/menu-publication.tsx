"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Link2, MoreHorizontal, Quote } from "lucide-react";
import { seDesabonner } from "@/app/actions/abonnements";
import { bloquer, signaler } from "@/app/actions/moderation";
import { masquerPublication } from "@/app/actions/masquage";

type Resultat = { error?: string; ok?: boolean };

type Props = {
  postId: string;
  auteurId: string;
  connecte: boolean;
  estMienne: boolean;
};

const classeOption = "rounded-lg px-3 py-2 text-left text-sm hover:bg-surface";

export function MenuPublication({ postId, auteurId, connecte, estMienne }: Props) {
  const router = useRouter();
  const racine = useRef<HTMLDivElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const [signalement, setSignalement] = useState(false);
  const [raison, setRaison] = useState("");
  const [copie, setCopie] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Ferme le menu quand on clique ailleurs.
  useEffect(() => {
    function fermerSiDehors(e: MouseEvent) {
      if (racine.current && !racine.current.contains(e.target as Node)) {
        setOuvert(false);
        setSignalement(false);
      }
    }
    document.addEventListener("mousedown", fermerSiDehors);
    return () => document.removeEventListener("mousedown", fermerSiDehors);
  }, []);

  function lancer(action: () => Promise<Resultat>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setOuvert(false);
      router.refresh();
    });
  }

  function envoyerSignalement() {
    setMessage(null);
    startTransition(async () => {
      const result = await signaler({ postId }, raison);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setSignalement(false);
      setRaison("");
      setOuvert(false);
    });
  }

  function copierLien() {
    navigator.clipboard
      .writeText(`${window.location.origin}/publication/${postId}`)
      .then(() => {
        setCopie(true);
        setTimeout(() => {
          setCopie(false);
          setOuvert(false);
        }, 1200);
      });
  }

  return (
    <div ref={racine} className="relative">
      <button
        type="button"
        aria-label="Plus d'options"
        aria-expanded={ouvert}
        onClick={() => setOuvert(!ouvert)}
        className="rounded-xl p-1.5 hover:bg-surface"
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>

      {ouvert && (
        <div className="absolute right-0 top-full z-40 mt-2 flex w-72 flex-col gap-1 rounded-xl border border-border bg-background p-2 shadow-lg">
          {!signalement ? (
            <>
              {connecte && (
                <Link href={`/citer/${postId}`} className={`${classeOption} flex items-center gap-2`}>
                  <Quote size={16} aria-hidden="true" />
                  Citer
                </Link>
              )}

              <button type="button" onClick={copierLien} className={`${classeOption} flex items-center gap-2`}>
                {copie ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
                {copie ? "Lien copié" : "Copier le lien"}
              </button>

              {connecte && !estMienne && (
                <>
                  <button type="button" onClick={() => setSignalement(true)} className={classeOption}>
                    Signaler
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => lancer(() => masquerPublication(postId, "pas_interesse"))}
                    className={classeOption}
                  >
                    Ce contenu ne m&apos;intéresse pas
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => lancer(() => seDesabonner(auteurId))}
                    className={classeOption}
                  >
                    Se désabonner de ce compte
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => lancer(() => masquerPublication(postId, "masque"))}
                    className={classeOption}
                  >
                    Masquer
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => lancer(() => bloquer(auteurId))}
                    className={`${classeOption} text-red-600`}
                  >
                    Bloquer
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2 p-1">
              <textarea
                value={raison}
                onChange={(e) => setRaison(e.target.value)}
                maxLength={500}
                placeholder="Pourquoi signales-tu ceci ?"
                className="min-h-16 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSignalement(false)}
                  className="rounded-xl border border-border px-3 py-1.5 text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={envoyerSignalement}
                  disabled={pending || raison.trim().length === 0}
                  className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground disabled:opacity-50"
                >
                  Envoyer
                </button>
              </div>
            </div>
          )}

          {message && <p className="px-2 text-sm text-red-600">{message}</p>}
        </div>
      )}
    </div>
  );
}