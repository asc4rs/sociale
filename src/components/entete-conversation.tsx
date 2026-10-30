"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, MoreHorizontal, Trash2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { bloquer } from "@/app/actions/moderation";
import { definirDisparition, supprimerMesMessages } from "@/app/actions/conversation";

type Autre = {
  id: string;
  username: string;
  nom: string;
  avatarUrl: string | null;
  rejointLe: string;
  abonnes: number;
  abonnements: number;
};

type Props = {
  conversationId: string;
  titre: string;
  estGroupe: boolean;
  nombreMembres: number;
  disparition: number | null;
  autre: Autre | null;
};

const OPTIONS_DISPARITION: { valeur: number | null; libelle: string }[] = [
  { valeur: null, libelle: "Désactivée" },
  { valeur: 6, libelle: "6 heures" },
  { valeur: 24, libelle: "24 heures" },
  { valeur: 168, libelle: "7 jours" },
];

export function EnteteConversation({
  conversationId,
  titre,
  estGroupe,
  nombreMembres,
  disparition,
  autre,
}: Props) {
  const router = useRouter();
  const racine = useRef<HTMLDivElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const [duree, setDuree] = useState<number | null>(disparition);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function fermerSiDehors(e: MouseEvent) {
      if (racine.current && !racine.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener("mousedown", fermerSiDehors);
    return () => document.removeEventListener("mousedown", fermerSiDehors);
  }, []);

  function changerDuree(valeur: number | null) {
    setMessage(null);
    setDuree(valeur);
    startTransition(async () => {
      const r = await definirDisparition(conversationId, valeur);
      if (r.error) {
        setMessage(r.error);
        setDuree(disparition);
        return;
      }
      router.refresh();
    });
  }

  function viderMesMessages() {
    if (!window.confirm("Supprimer tous tes messages de cette conversation ? Cette action est définitive.")) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const r = await supprimerMesMessages(conversationId);
      if (r.error) {
        setMessage(r.error);
        return;
      }
      setOuvert(false);
      router.refresh();
    });
  }

  function bloquerCompte() {
    if (!autre) return;
    if (!window.confirm(`Bloquer ${autre.nom} ?`)) return;
    startTransition(async () => {
      const r = await bloquer(autre.id);
      if (r.error) {
        setMessage(r.error);
        return;
      }
      router.push("/messages");
    });
  }

  return (
    <header className="flex items-start justify-between gap-3 rounded-xl border border-border p-4">
      <div className="flex min-w-0 items-start gap-3">
        <Link href="/messages" aria-label="Retour aux messages" className="rounded-xl p-2 hover:bg-surface md:hidden">
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>

        <Avatar url={autre?.avatarUrl ?? null} nom={autre?.nom ?? titre} taille="lg" />

        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{autre?.nom ?? titre}</p>

          {autre && <p className="text-sm text-muted">@{autre.username}</p>}

          {autre && (
            <p className="mt-1 text-xs text-muted">Rejoint Sociale en {autre.rejointLe}</p>
          )}

          {autre && (
            <p className="mt-1 text-xs text-muted">
              <span className="font-semibold text-foreground">{autre.abonnes}</span> abonnés ·{" "}
              <span className="font-semibold text-foreground">{autre.abonnements}</span> abonnements
            </p>
          )}

          {estGroupe && (
            <p className="mt-1 text-xs text-muted">Groupe · {nombreMembres} membres</p>
          )}

          {autre && (
            <Link href={`/u/${autre.username}`} className="mt-2 inline-block text-sm underline">
              Voir le profil
            </Link>
          )}
        </div>
      </div>

      <div ref={racine} className="relative shrink-0">
        <button
          type="button"
          aria-label="Options de la conversation"
          aria-expanded={ouvert}
          onClick={() => setOuvert(!ouvert)}
          className="rounded-xl p-2 hover:bg-surface"
        >
          <MoreHorizontal size={20} aria-hidden="true" />
        </button>

        {ouvert && (
          <div className="absolute right-0 top-full z-40 mt-2 flex w-72 flex-col gap-1 rounded-xl border border-border bg-background p-2 shadow-lg">
            <p className="px-2 pt-1 text-xs font-semibold text-muted">Disparition des messages</p>
            <div className="flex flex-col">
              {OPTIONS_DISPARITION.map((o) => (
                <button
                  key={o.libelle}
                  type="button"
                  disabled={pending}
                  onClick={() => changerDuree(o.valeur)}
                  aria-pressed={duree === o.valeur}
                  className={`rounded-lg px-3 py-2 text-left text-sm hover:bg-surface ${
                    duree === o.valeur ? "font-bold" : ""
                  }`}
                >
                  {duree === o.valeur ? "✓ " : ""}
                  {o.libelle}
                </button>
              ))}
            </div>
            <p className="px-2 pb-1 text-xs text-muted">
              Les messages plus anciens que ce délai ne sont plus affichés.
            </p>

            <div className="my-1 border-t border-border" />

            <button
              type="button"
              disabled={pending}
              onClick={viderMesMessages}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-surface"
            >
              <Trash2 size={16} aria-hidden="true" />
              Supprimer tous mes messages
            </button>

            {autre && (
              <button
                type="button"
                disabled={pending}
                onClick={bloquerCompte}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-surface"
              >
                <Ban size={16} aria-hidden="true" />
                Bloquer {autre.nom}
              </button>
            )}

            {message && <p className="px-2 text-sm text-red-600">{message}</p>}
          </div>
        )}
      </div>
    </header>
  );
}