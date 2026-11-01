"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { createClient } from "@/lib/supabase/client";
import { transfererMessage } from "@/app/actions/transfert";

type Profil = { display_name: string; avatar_url: string | null };
type Conversation = { id: string; is_group: boolean; name: string | null };

type Cible = { id: string; titre: string; photo: string | null; groupe: boolean };

type Props = {
  messageId: string;
  conversationActuelleId: string;
  onFermer: () => void;
};

function unObjet<T>(valeur: T | T[] | null | undefined): T | null {
  if (!valeur) return null;
  return Array.isArray(valeur) ? (valeur[0] ?? null) : valeur;
}

export function FenetreTransfert({ messageId, conversationActuelleId, onFermer }: Props) {
  const [cibles, setCibles] = useState<Cible[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Charge mes autres conversations.
  useEffect(() => {
    let annule = false;

    async function charger() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: lignes } = await supabase
        .from("conversation_members")
        .select("conversation_id, conversations(id, is_group, name)")
        .eq("user_id", user.id);

      const convs = (lignes ?? [])
        .map((l) => unObjet(l.conversations as unknown as Conversation | Conversation[] | null))
        .filter((c): c is Conversation => !!c && c.id !== conversationActuelleId);

      const ids = convs.map((c) => c.id);
      let membres: { conversation_id: string; user_id: string; profiles: Profil | Profil[] | null }[] = [];

      if (ids.length > 0) {
        const { data } = await supabase
          .from("conversation_members")
          .select("conversation_id, user_id, profiles(display_name, avatar_url)")
          .in("conversation_id", ids);
        membres = (data ?? []) as unknown as typeof membres;
      }

      const resultat: Cible[] = convs.map((c) => {
        const autres = membres.filter((m) => m.conversation_id === c.id && m.user_id !== user.id);
        const profilAutre = unObjet(autres[0]?.profiles);
        const noms = autres.map((m) => unObjet(m.profiles)?.display_name ?? "Inconnu");
        return {
          id: c.id,
          titre: c.is_group ? (c.name ?? (noms.join(", ") || "Groupe")) : (noms[0] ?? "Conversation"),
          photo: c.is_group ? null : (profilAutre?.avatar_url ?? null),
          groupe: c.is_group,
        };
      });

      resultat.sort((a, b) => a.titre.localeCompare(b.titre));
      if (!annule) setCibles(resultat);
    }

    charger();
    return () => {
      annule = true;
    };
  }, [conversationActuelleId]);

  // Ferme avec la touche Échap.
  useEffect(() => {
    function touche(e: KeyboardEvent) {
      if (e.key === "Escape") onFermer();
    }
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [onFermer]);

  function transferer(cible: Cible) {
    setErreur(null);
    startTransition(async () => {
      const r = await transfererMessage(messageId, cible.id);
      if (r.error) {
        setErreur(r.error);
        return;
      }
      setFait(cible.titre);
      setTimeout(onFermer, 900);
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Transférer le message"
      onClick={onFermer}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-border bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-lg font-bold">Transférer à</p>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="rounded-full p-2 hover:bg-surface"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto pb-4">
          {cibles === null && <p className="px-5 py-6 text-sm text-muted">Chargement...</p>}

          {cibles !== null && cibles.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted">Tu n&apos;as pas d&apos;autre conversation.</p>
          )}

          {cibles?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => transferer(c)}
              disabled={pending || fait !== null}
              className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface disabled:opacity-50"
            >
              <Avatar url={c.photo} nom={c.titre} taille="md" />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{c.titre}</span>
                {c.groupe && <span className="block text-xs text-muted">Groupe</span>}
              </span>
            </button>
          ))}
        </div>

        {fait && (
          <p role="status" className="border-t border-border px-5 py-3 text-sm">
            Message transféré à {fait}.
          </p>
        )}

        {erreur && (
          <p role="alert" className="border-t border-border px-5 py-3 text-sm text-red-600">
            {erreur}
          </p>
        )}
      </div>
    </div>
  );
}