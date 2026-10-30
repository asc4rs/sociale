"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerPublication } from "@/app/actions/publications";

type Type = "texte" | "sondage" | "question";

const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "👍", "👏",
  "🔥", "🎉", "❤️", "😢", "😡", "🙏", "✨", "💯",
];

const TYPES: { valeur: Type; libelle: string }[] = [
  { valeur: "texte", libelle: "Publication" },
  { valeur: "sondage", libelle: "Sondage" },
  { valeur: "question", libelle: "Question" },
];

const champ =
  "w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-accent";

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
    (type === "sondage" && optionsValides < 2);

  const restant = 280 - contenu.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2" role="radiogroup" aria-label="Type de publication">
        {TYPES.map((t) => (
          <button
            key={t.valeur}
            type="button"
            role="radio"
            aria-checked={type === t.valeur}
            onClick={() => setType(t.valeur)}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
              type === t.valeur
                ? "bg-accent text-accent-foreground"
                : "border border-border hover:bg-surface"
            }`}
          >
            {t.libelle}
          </button>
        ))}
      </div>

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

      <div className="relative self-start">
        <button
          type="button"
          aria-label="Ajouter un émoji"
          aria-expanded={emojisOuverts}
          onClick={() => setEmojisOuverts(!emojisOuverts)}
          className="rounded-xl border border-border px-3 py-1.5 text-base hover:bg-surface"
        >
          😀
        </button>

        {emojisOuverts && (
          <div className="absolute left-0 top-full z-40 mt-2 grid w-64 grid-cols-8 gap-1 rounded-xl border border-border bg-background p-2 shadow-lg">
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
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={programmer}
          onChange={(e) => setProgrammer(e.target.checked)}
          className="h-4 w-4"
        />
        Programmer la publication
      </label>

      {programmer && (
        <input
          type="datetime-local"
          value={dateProg}
          onChange={(e) => setDateProg(e.target.value)}
          className={champ}
        />
      )}

      <div className="flex items-center justify-between">
        <span className={`text-sm ${restant < 20 ? "text-red-600" : "text-muted"}`}>
          {restant}
        </span>
        <button
          type="submit"
          disabled={desactive || (programmer && !dateProg)}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          {pending ? "Envoi..." : programmer ? "Programmer" : "Publier"}
        </button>
      </div>

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </form>
  );
}