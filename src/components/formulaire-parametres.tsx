"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  debloquer,
  definirConfidentialite,
  enregistrerPreferences,
} from "@/app/actions/moderation";

type Preferences = {
  notif_follow: boolean;
  notif_like: boolean;
  notif_comment: boolean;
  notif_repost: boolean;
  notif_message: boolean;
};

type Bloque = { id: string; username: string; display_name: string };

type Props = {
  estPrive: boolean;
  preferences: Preferences;
  bloques: Bloque[];
};

const ETIQUETTES: Record<keyof Preferences, string> = {
  notif_follow: "Nouveaux abonnés et demandes",
  notif_like: "J'aime",
  notif_comment: "Commentaires",
  notif_repost: "Republications",
  notif_message: "Messages privés",
};

export function FormulaireParametres({ estPrive, preferences, bloques }: Props) {
  const router = useRouter();
  const [prive, setPrive] = useState(estPrive);
  const [prefs, setPrefs] = useState<Preferences>(preferences);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changerConfidentialite(valeur: boolean) {
    setMessage(null);
    setPrive(valeur);
    startTransition(async () => {
      const result = await definirConfidentialite(valeur);
      if (result.error) {
        setPrive(!valeur);
        setMessage(result.error);
        return;
      }
      setMessage("Confidentialité mise à jour.");
      router.refresh();
    });
  }

  function changerPreference(cle: keyof Preferences) {
    const nouvelles = { ...prefs, [cle]: !prefs[cle] };
    setPrefs(nouvelles);
    setMessage(null);
    startTransition(async () => {
      const result = await enregistrerPreferences(nouvelles);
      if (result.error) {
        setPrefs(prefs);
        setMessage(result.error);
        return;
      }
      setMessage("Préférences enregistrées.");
    });
  }

  function handleDebloquer(id: string) {
    startTransition(async () => {
      const result = await debloquer(id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-semibold">Confidentialité</h2>
        <label className="mt-3 flex items-start gap-3 rounded-xl border border-border p-4">
          <input
            type="checkbox"
            checked={prive}
            onChange={(e) => changerConfidentialite(e.target.checked)}
            disabled={pending}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="block font-medium">Compte privé</span>
            <span className="block text-sm text-muted">
              Les nouvelles personnes doivent envoyer une demande pour voir tes publications.
            </span>
          </span>
        </label>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Notifications</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {(Object.keys(ETIQUETTES) as (keyof Preferences)[]).map((cle) => (
            <li key={cle}>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                <span>{ETIQUETTES[cle]}</span>
                <input
                  type="checkbox"
                  checked={prefs[cle]}
                  onChange={() => changerPreference(cle)}
                  disabled={pending}
                  className="h-4 w-4"
                />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Comptes bloqués</h2>
        {bloques.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aucun compte bloqué.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {bloques.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <span>
                  <span className="font-semibold">{b.display_name}</span>{" "}
                  <span className="text-sm text-muted">@{b.username}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleDebloquer(b.id)}
                  disabled={pending}
                  className="rounded-xl border border-border px-3 py-1 text-sm font-semibold hover:bg-surface disabled:opacity-50"
                >
                  Débloquer
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {message && (
        <p role="alert" className="text-sm text-muted">
          {message}
        </p>
      )}
    </div>
  );
}