"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import {
  basculerMembre,
  basculerVisibilite,
  supprimerListe,
} from "@/app/actions/listes";

type Personne = { id: string; nom: string; avatar: string | null };

type Props = {
  listeId: string;
  publique: boolean;
  membresIds: string[];
  suivis: Personne[];
};

export function GererListe({ listeId, publique, membresIds, suivis }: Props) {
  const router = useRouter();
  const [membres, setMembres] = useState<Set<string>>(new Set(membresIds));
  const [visible, setVisible] = useState(publique);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function basculer(id: string) {
    const actif = !membres.has(id);
    const precedent = membres;
    const nouveau = new Set(membres);
    if (actif) nouveau.add(id);
    else nouveau.delete(id);

    setMembres(nouveau);
    setErreur(null);

    startTransition(async () => {
      const r = await basculerMembre(listeId, id, actif);
      if (r.error) {
        setMembres(precedent);
        setErreur(r.error);
        return;
      }
      router.refresh();
    });
  }

  function changerVisibilite() {
    const nouveau = !visible;
    setVisible(nouveau);
    setErreur(null);

    startTransition(async () => {
      const r = await basculerVisibilite(listeId, nouveau);
      if (r.error) {
        setVisible(!nouveau);
        setErreur(r.error);
        return;
      }
      router.refresh();
    });
  }

  function supprimer() {
    if (!window.confirm("Supprimer cette liste ? Cette action est définitive.")) return;

    startTransition(async () => {
      const r = await supprimerListe(listeId);
      if (r.error) {
        setErreur(r.error);
        return;
      }
      router.push("/listes");
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={changerVisibilite}
          disabled={pending}
          className="rounded-xl border border-border px-3 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50"
        >
          {visible ? "Rendre privée" : "Rendre publique"}
        </button>

        <button
          type="button"
          onClick={supprimer}
          disabled={pending}
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-red-600 hover:bg-surface disabled:opacity-50"
        >
          <Trash2 size={16} aria-hidden="true" />
          Supprimer la liste
        </button>
      </div>

      <div>
        <p className="text-sm font-semibold">Membres (parmi les comptes que tu suis)</p>

        {suivis.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Tu ne suis encore personne.</p>
        ) : (
          <ul className="mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto">
            {suivis.map((s) => {
              const coche = membres.has(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => basculer(s.id)}
                    aria-pressed={coche}
                    disabled={pending}
                    className="flex w-full items-center justify-between gap-3 rounded-xl p-2 hover:bg-surface disabled:opacity-50"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar url={s.avatar} nom={s.nom} />
                      <span className="truncate text-sm">{s.nom}</span>
                    </span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        coche ? "border-accent bg-accent text-accent-foreground" : "border-border"
                      }`}
                    >
                      {coche && <Check size={14} aria-hidden="true" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {erreur && (
        <p role="alert" className="text-sm text-red-600">
          {erreur}
        </p>
      )}
    </section>
  );
}