"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  avertir,
  bannir,
  debannir,
  supprimerPublicationAdmin,
} from "@/app/actions/administration";

type Utilisateur = {
  id: string;
  username: string;
  display_name: string;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  warnings_count: number;
};

type Publication = {
  id: string;
  content: string;
  auteur: string;
  date: string;
};

type Entree = {
  id: string;
  action: string;
  admin: string;
  cible: string;
  detail: string | null;
  date: string;
};

type Props = {
  utilisateurs: Utilisateur[];
  publications: Publication[];
  journal: Entree[];
};

const LIBELLES: Record<string, string> = {
  avertissement: "Avertissement",
  bannissement: "Bannissement",
  debannissement: "Débannissement",
  suppression_publication: "Publication supprimée",
};

const bouton =
  "rounded-xl border border-border px-3 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50";
const boutonDanger =
  "rounded-xl bg-red-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50";
const champ =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function PanneauAdmin({ utilisateurs, publications, journal }: Props) {
  const router = useRouter();
  const [raisons, setRaisons] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: "ok" | "erreur"; texte: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function raisonDe(cle: string) {
    return (raisons[cle] ?? "").trim();
  }

  function changerRaison(cle: string, valeur: string) {
    setRaisons((anciennes) => ({ ...anciennes, [cle]: valeur }));
  }

  function lancer(
    action: () => Promise<{ error?: string; ok?: boolean }>,
    succes: string,
    cle?: string,
  ) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setMessage({ type: "erreur", texte: result.error });
        return;
      }
      if (cle) changerRaison(cle, "");
      setMessage({ type: "ok", texte: succes });
      router.refresh();
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-10">
      {message && (
        <p
          role="status"
          className={`rounded-xl border p-3 text-sm ${
            message.type === "ok" ? "border-border" : "border-red-600 text-red-600"
          }`}
        >
          {message.texte}
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold">Utilisateurs ({utilisateurs.length})</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {utilisateurs.map((u) => (
            <li key={u.id} className="flex flex-col gap-2 rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p>
                  <span className="font-semibold">{u.display_name}</span>{" "}
                  <span className="text-sm text-muted">@{u.username}</span>
                </p>
                <span className="text-xs text-muted">{u.warnings_count} avertissement(s)</span>
              </div>

              {u.is_admin && <p className="text-xs font-semibold">Administrateur</p>}
              {u.is_banned && (
                <p className="text-sm text-red-600">Banni : {u.ban_reason ?? "sans motif"}</p>
              )}

              {!u.is_admin && (
                <>
                  <input
                    value={raisons[u.id] ?? ""}
                    onChange={(e) => changerRaison(u.id, e.target.value)}
                    maxLength={500}
                    placeholder="Motif (obligatoire pour avertir ou bannir)"
                    className={champ}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending || raisonDe(u.id).length === 0}
                      onClick={() =>
                        lancer(() => avertir(u.id, raisonDe(u.id)), "Avertissement envoyé.", u.id)
                      }
                      className={bouton}
                    >
                      Avertir
                    </button>

                    {u.is_banned ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => lancer(() => debannir(u.id), "Compte débanni.")}
                        className={bouton}
                      >
                        Débannir
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={pending || raisonDe(u.id).length === 0}
                        onClick={() =>
                          lancer(() => bannir(u.id, raisonDe(u.id)), "Compte banni.", u.id)
                        }
                        className={boutonDanger}
                      >
                        Bannir
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Publications récentes</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {publications.length === 0 && (
            <li className="text-sm text-muted">Aucune publication.</li>
          )}
          {publications.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 rounded-xl border border-border p-4">
              <p className="text-sm">
                <span className="font-semibold">@{p.auteur}</span>{" "}
                <span className="text-muted">{p.date}</span>
              </p>
              <p className="whitespace-pre-wrap text-sm">{p.content}</p>
              <input
                value={raisons[p.id] ?? ""}
                onChange={(e) => changerRaison(p.id, e.target.value)}
                maxLength={500}
                placeholder="Motif de suppression (obligatoire)"
                className={champ}
              />
              <div>
                <button
                  type="button"
                  disabled={pending || raisonDe(p.id).length === 0}
                  onClick={() =>
                    lancer(
                      () => supprimerPublicationAdmin(p.id, raisonDe(p.id)),
                      "Publication supprimée.",
                      p.id,
                    )
                  }
                  className={boutonDanger}
                >
                  Supprimer la publication
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Journal de modération</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {journal.length === 0 && (
            <li className="text-sm text-muted">Aucune action enregistrée.</li>
          )}
          {journal.map((e) => (
            <li key={e.id} className="rounded-xl border border-border p-3 text-sm">
              <p>
                <span className="font-semibold">{LIBELLES[e.action] ?? e.action}</span>{" "}
                <span className="text-muted">· {e.date}</span>
              </p>
              <p className="text-muted">
                Par @{e.admin} sur @{e.cible}
              </p>
              {e.detail && <p className="mt-1">Motif : {e.detail}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}