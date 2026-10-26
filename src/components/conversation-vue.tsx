"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  envoyerMessage,
  marquerConversationLue,
  supprimerMessage,
} from "@/app/actions/messages";

export type MessageAffiche = {
  id: string;
  contenu: string;
  date: string;
  auteurNom: string;
  auteurPseudo: string;
  estMien: boolean;
  supprime: boolean;
};

type Props = {
  conversationId: string;
  messages: MessageAffiche[];
};

export function ConversationVue({ conversationId, messages }: Props) {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Dès l'ouverture, la conversation est marquée comme lue.
  useEffect(() => {
    marquerConversationLue(conversationId);
  }, [conversationId]);

  function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await envoyerMessage(conversationId, texte);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setTexte("");
      router.refresh();
    });
  }

  function handleDelete(messageId: string) {
    setMessage(null);

    startTransition(async () => {
      const result = await supprimerMessage(messageId, conversationId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {messages.length === 0 && (
          <li className="text-sm text-muted">Aucun message pour le moment.</li>
        )}

        {messages.map((m) => (
          <li
            key={m.id}
            className={`rounded-xl border border-border p-3 ${m.estMien ? "ml-10" : "mr-10"}`}
          >
            <div className="flex items-baseline justify-between gap-2 text-xs text-muted">
              <span className="font-semibold text-foreground">{m.auteurNom}</span>
              <span>{m.date}</span>
            </div>

            <p className={`mt-1 whitespace-pre-wrap text-sm ${m.supprime ? "italic text-muted" : ""}`}>
              {m.supprime ? "Message supprimé." : m.contenu}
            </p>

            {m.estMien && !m.supprime && (
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                disabled={pending}
                className="mt-1 text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Supprimer
              </button>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSend} className="flex flex-col gap-2">
        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          maxLength={1000}
          placeholder="Écrire un message"
          className="min-h-16 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || texte.trim().length === 0}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            {pending ? "Envoi..." : "Envoyer"}
          </button>
        </div>

        {message && (
          <p role="alert" className="text-sm text-red-600">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}