"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, HelpCircle, ListChecks, Smile } from "lucide-react";
import { creerPublication } from "@/app/actions/publications";

type Type = "texte" | "sondage" | "question";

const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "👍", "👏",
  "🔥", "🎉", "❤️", "😢", "😡", "🙏", "✨", "💯",
];

const champ =
  "w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-accent";

const iconeBouton = (actif: boolean) =>
  `flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-surface ${
    actif ? "bg-surface text-foreground" : "text-muted"
  }`;

export function Composer() {
  const router = useRouter();
  const zone = useRef<HTMLTextAreaElement>(null);
  const [contenu, setContenu] = useState("");
  const [type, setType] = useState<Type>("texte");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [emojisOuverts, setEmojisOuverts] = useState(false);
  const [programmer, setProgrammer] = useState(false);
  const [dateProg, setDateProg] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Insère l'émoji à l'endroit où se trouve le curseur.
  function ajouterEmoji(emoji: string) {
    const el = zone.current;
    const debut = el?.selectionStart ?? contenu.length;
    const fin = el?.selectionEnd ?? contenu.length;
    setContenu(contenu.slice(0, debut) + emoji + contenu.slice(fin));
    setEmojisOuverts(false);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = debut + emoji.length;
      el?.setSelectionRange(pos, pos);
    });
  }

  // Un clic sur l'icône active la change, un second clic revient à la publication normale.
  function choisirType(choix: Type) {
    setType(type === choix ? "texte" : choix);
  }

  function changerOption(index: number, valeur: string) {
    setOptions(options.map((o, i) => (i === index ? valeur : o)));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const programmeePour = programmer && dateProg ? new Date(dateProg).toISOString() : null;

    startTransition(async () => {
      const result = await creerPublication({
        contenu,
        type,
        options: type === "sondage" ? options : [],
        programmeePour,
      });

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setContenu("");
      setType("texte");
      setOptions(["", ""]);
      setProgrammer(false);
      setDateProg("");
      router.refresh();
    });
  }

  const optionsValides = options.filter((o) => o.trim().length > 0).length;
  const desactive =
    pending ||
    contenu.trim().length === 0 ||
    (type === "sondage" && optionsValides < 2) ||
    (programmer && !dateProg);

  const restant = 280 - contenu.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        ref={zone}
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        maxLength={280}
        placeholder={type === "question" ? "Pose ta question…" : "Quoi de neuf ?"}
        className="min-h-24 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-accent"
      />

      {type === "question" && (
        <p className="text-xs text-muted">Les réponses se font dans les commentaires.</p>
      )}

      {type === "sondage" && (
        <div className="flex flex-col gap-2">
          {options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={o}
                onChange={(e) => changerOption(i, e.target.value)}
                maxLength={80}
                placeholder={`Option ${i + 1}`}
                className={champ}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  aria-label={`Retirer l'option ${i + 1}`}
                  onClick={() => setOptions(options.filter((_, j) => j !== i))}
                  className="shrink-0 rounded-xl border border-border px-3 text-sm hover:bg-surface"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {options.length < 4 && (
            <button
              type="button"
              onClick={() => setOptions([...options, ""])}
              className="self-start rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-surface"
            >
              + Ajouter une option
            </button>
          )}
        </div>
      )}

      {emojisOuverts && (
        <div className="grid grid-cols-8 gap-1 rounded-xl border border-border bg-background p-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              aria-label={`Ajouter ${e}`}
              onClick={() => ajouterEmoji(e)}
              className="rounded-lg py-0.5 text-lg hover:bg-surface"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {programmer && (
        <input
          type="datetime-local"
          value={dateProg}
          onChange={(e) => setDateProg(e.target.value)}
          aria-label="Date de publication"
          className={champ}
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Sondage"
            title="Sondage"
            aria-pressed={type === "sondage"}
            onClick={() => choisirType("sondage")}
            className={iconeBouton(type === "sondage")}
          >
            <ListChecks size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Question"
            title="Question"
            aria-pressed={type === "question"}
            onClick={() => choisirType("question")}
            className={iconeBouton(type === "question")}
          >
            <HelpCircle size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Émojis"
            title="Émojis"
            aria-expanded={emojisOuverts}
            onClick={() => setEmojisOuverts(!emojisOuverts)}
            className={iconeBouton(emojisOuverts)}
          >
            <Smile size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Programmer"
            title="Programmer"
            aria-pressed={programmer}
            onClick={() => setProgrammer(!programmer)}
            className={iconeBouton(programmer)}
          >
            <CalendarClock size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-sm ${restant < 20 ? "text-red-600" : "text-muted"}`}>
            {restant}
          </span>
          <button
            type="submit"
            disabled={desactive}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            {pending ? "Envoi..." : programmer ? "Programmer" : "Publier"}
          </button>
        </div>
      </div>

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </form>
  );
}