"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, HelpCircle, Image as ImageIcon, ListChecks, Smile, X } from "lucide-react";
import { creerPublication } from "@/app/actions/publications";
import { creerPublicationCarrousel } from "@/app/actions/carrousel";
import { enregistrerBrouillon } from "@/app/actions/brouillons";
import { createClient } from "@/lib/supabase/client";

type Type = "texte" | "sondage" | "question";
type Fichier = { file: File; apercu: string };

const MAX_IMAGES = 10;
const TAILLE_MAX_IMAGE = 10 * 1024 * 1024;
const TYPES_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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
  const entreeImages = useRef<HTMLInputElement>(null);
  const [contenu, setContenu] = useState("");
  const [type, setType] = useState<Type>("texte");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [emojisOuverts, setEmojisOuverts] = useState(false);
  const [programmer, setProgrammer] = useState(false);
  const [dateProg, setDateProg] = useState("");
  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function viderImages() {
    fichiers.forEach((f) => URL.revokeObjectURL(f.apercu));
    setFichiers([]);
  }

  function choisirImages(e: React.ChangeEvent<HTMLInputElement>) {
    const choix = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (choix.length === 0) return;
    setMessage(null);

    const valides: Fichier[] = [];
    for (const file of choix) {
      if (!TYPES_IMAGE.includes(file.type)) {
        setMessage("Format non accepté (JPG, PNG, WebP ou GIF).");
        continue;
      }
      if (file.size > TAILLE_MAX_IMAGE) {
        setMessage("Une image dépasse 10 Mo.");
        continue;
      }
      valides.push({ file, apercu: URL.createObjectURL(file) });
    }

    const place = Math.max(MAX_IMAGES - fichiers.length, 0);
    if (valides.length > place) {
      setMessage(`Maximum ${MAX_IMAGES} images par publication.`);
      valides.slice(place).forEach((f) => URL.revokeObjectURL(f.apercu));
    }
    setFichiers([...fichiers, ...valides.slice(0, place)]);
  }

  function retirerImage(index: number) {
    URL.revokeObjectURL(fichiers[index].apercu);
    setFichiers(fichiers.filter((_, i) => i !== index));
  }

  function basculerProgrammer() {
    const nouveau = !programmer;
    setProgrammer(nouveau);
    if (nouveau) viderImages();
  }

  function choisirType(choix: Type) {
    const nouveau = type === choix ? "texte" : choix;
    setType(nouveau);
    if (nouveau !== "texte") viderImages();
  }

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
    setInfo(null);

    const programmeePour = programmer && dateProg ? new Date(dateProg).toISOString() : null;

    startTransition(async () => {
      // Publication avec images : on envoie d'abord les fichiers, puis on crée la publication.
      if (fichiers.length > 0) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setMessage("Tu dois être connecté.");
          return;
        }

        const urls: string[] = [];
        for (let i = 0; i < fichiers.length; i++) {
          const file = fichiers[i].file;
          const nom = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const chemin = `${user.id}/posts/${Date.now()}-${i}-${nom}`;

          const { error } = await supabase.storage
            .from("medias")
            .upload(chemin, file, { contentType: file.type });
          if (error) {
            setMessage("Envoi d'une image impossible. Réessaie.");
            return;
          }
          urls.push(supabase.storage.from("medias").getPublicUrl(chemin).data.publicUrl);
        }

        const r = await creerPublicationCarrousel(contenu, urls);
        if (r.error) {
          setMessage(r.error);
          return;
        }

        viderImages();
        setContenu("");
        router.refresh();
        return;
      }

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

  function enregistrerBrouillonClic() {
    if (type === "sondage") return;
    const typeBrouillon = type === "question" ? "question" : "texte";
    setMessage(null);
    setInfo(null);

    startTransition(async () => {
      const result = await enregistrerBrouillon(contenu, typeBrouillon);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setContenu("");
      setType("texte");
      setInfo("Brouillon enregistré.");
      router.refresh();
    });
  }

  const optionsValides = options.filter((o) => o.trim().length > 0).length;
  const desactive =
    pending ||
    (contenu.trim().length === 0 && fichiers.length === 0) ||
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

      {fichiers.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {fichiers.map((f, i) => (
            <div key={f.apercu} className="relative">
              <img src={f.apercu} alt="" className="h-20 w-full rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => retirerImage(i)}
                aria-label="Retirer cette image"
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/90"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
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

      <input
        ref={entreeImages}
        type="file"
        accept={TYPES_IMAGE.join(",")}
        multiple
        onChange={choisirImages}
        className="hidden"
      />

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

          {type === "texte" && !programmer && (
            <button
              type="button"
              aria-label="Ajouter des images"
              title={`Images (${MAX_IMAGES} maximum)`}
              onClick={() => entreeImages.current?.click()}
              className={iconeBouton(fichiers.length > 0)}
            >
              <ImageIcon size={18} aria-hidden="true" />
            </button>
          )}

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
            onClick={basculerProgrammer}
            className={iconeBouton(programmer)}
          >
            <CalendarClock size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-sm ${restant < 20 ? "text-red-600" : "text-muted"}`}>
            {restant}
          </span>

          {type !== "sondage" && !programmer && fichiers.length === 0 && (
            <button
              type="button"
              onClick={enregistrerBrouillonClic}
              disabled={pending || contenu.trim().length === 0}
              className="rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-surface disabled:opacity-50"
            >
              Brouillon
            </button>
          )}

          <button
            type="submit"
            disabled={desactive}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            {pending ? "Envoi..." : programmer ? "Programmer" : "Publier"}
          </button>
        </div>
      </div>

      <Link href="/brouillons" className="self-end text-xs text-muted underline">
        Mes brouillons
      </Link>

      {info && <p className="text-sm text-muted">{info}</p>}

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </form>
  );
}