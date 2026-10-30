"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Paperclip, Plus, Send, Smile, Trash2, Video, X } from "lucide-react";
import { envoyerDansConversation, supprimerMonMessage } from "@/app/actions/conversation";
import { createClient } from "@/lib/supabase/client";

export type MessageAffiche = {
  id: string;
  contenu: string;
  date: string;
  auteurNom: string;
  auteurPseudo: string;
  estMien: boolean;
  mediaUrl: string | null;
  mediaKind: "image" | "video" | "fichier" | null;
};

type Genre = "image" | "video" | "fichier";
type Piece = { file: File; genre: Genre; apercu: string | null };

type Props = {
  conversationId: string;
  moiId: string;
  messages: MessageAffiche[];
  statut?: string | null;
};

const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "👍", "👏",
  "🔥", "🎉", "❤️", "😢", "😡", "🙏", "✨", "💯",
];

const ACCEPT: Record<Genre, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  video: "video/mp4,video/webm",
  fichier: "application/pdf",
};

const LIMITES: Record<Genre, number> = {
  image: 10 * 1024 * 1024,
  video: 20 * 1024 * 1024,
  fichier: 20 * 1024 * 1024,
};

const LIBELLES: Record<Genre, string> = {
  image: "Photo",
  video: "Vidéo",
  fichier: "Fichier",
};

function genreDe(file: File): Genre | null {
  if (ACCEPT.image.split(",").includes(file.type)) return "image";
  if (ACCEPT.video.split(",").includes(file.type)) return "video";
  if (file.type === "application/pdf") return "fichier";
  return null;
}

function Media({ url, kind }: { url: string; kind: Genre }) {
  if (kind === "image") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img src={url} alt="Photo envoyée" className="max-h-72 w-full rounded-xl object-cover" />
      </a>
    );
  }
  if (kind === "video") {
    return <video src={url} controls className="max-h-72 w-full rounded-xl" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-xl border border-border p-2 text-sm underline"
    >
      <Paperclip size={16} aria-hidden="true" />
      Ouvrir le fichier
    </a>
  );
}

export function ConversationVue({ conversationId, moiId, messages, statut = null }: Props) {
  const router = useRouter();
  const entree = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLTextAreaElement>(null);
  const liste = useRef<HTMLDivElement>(null);

  const [texte, setTexte] = useState("");
  const [piece, setPiece] = useState<Piece | null>(null);
  const [plusOuvert, setPlusOuvert] = useState(false);
  const [emojisOuverts, setEmojisOuverts] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Descend automatiquement au dernier message, sans faire défiler la page entière.
  useEffect(() => {
    const el = liste.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Libère l'aperçu quand il change ou disparaît.
  useEffect(() => {
    return () => {
      if (piece?.apercu) URL.revokeObjectURL(piece.apercu);
    };
  }, [piece]);

  function ouvrirChoix(genre: Genre) {
    if (!entree.current) return;
    entree.current.accept = ACCEPT[genre];
    entree.current.click();
    setPlusOuvert(false);
  }

  function choisirFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setErreur(null);
    const genre = genreDe(file);
    if (!genre) {
      setErreur("Format non accepté.");
      return;
    }
    if (file.size > LIMITES[genre]) {
      setErreur(`${LIBELLES[genre]} trop lourd (${LIMITES[genre] / 1024 / 1024} Mo maximum).`);
      return;
    }

    setPiece({
      file,
      genre,
      apercu: genre === "fichier" ? null : URL.createObjectURL(file),
    });
  }

  function insererEmoji(emoji: string) {
    const el = zone.current;
    const debut = el?.selectionStart ?? texte.length;
    const fin = el?.selectionEnd ?? texte.length;
    setTexte(texte.slice(0, debut) + emoji + texte.slice(fin));
    setEmojisOuverts(false);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = debut + emoji.length;
      el?.setSelectionRange(pos, pos);
    });
  }

  function envoyer() {
    const t = texte.trim();
    if (!t && !piece) return;
    setErreur(null);

    startTransition(async () => {
      let media: { url: string; genre: Genre } | null = null;

      if (piece) {
        const supabase = createClient();
        const nomPropre = piece.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const chemin = `${moiId}/messages/${Date.now()}-${nomPropre}`;

        const { error } = await supabase.storage
          .from("medias")
          .upload(chemin, piece.file, { contentType: piece.file.type });

        if (error) {
          setErreur("Envoi du fichier impossible. Réessaie.");
          return;
        }

        const { data } = supabase.storage.from("medias").getPublicUrl(chemin);
        media = { url: data.publicUrl, genre: piece.genre };
      }

      const r = await envoyerDansConversation(conversationId, t, media);
      if (r.error) {
        setErreur(r.error);
        return;
      }

      setTexte("");
      setPiece(null);
      router.refresh();
    });
  }

  function supprimer(id: string) {
    if (!window.confirm("Supprimer ce message ?")) return;
    startTransition(async () => {
      const r = await supprimerMonMessage(id);
      if (r.error) {
        setErreur(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Liste des messages : seule partie qui défile */}
      <div ref={liste} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
        <ul className="flex flex-col gap-3">
          {messages.length === 0 && (
            <li className="text-center text-sm text-muted">Aucun message pour le moment.</li>
          )}

          {messages.map((m) => (
            <li key={m.id} className={`flex ${m.estMien ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl border border-border px-3 py-2 ${
                  m.estMien ? "bg-surface" : ""
                }`}
              >
                {!m.estMien && <p className="text-xs font-semibold">{m.auteurNom}</p>}

                {m.mediaUrl && m.mediaKind && (
                  <div className="mt-1">
                    <Media url={m.mediaUrl} kind={m.mediaKind} />
                  </div>
                )}

                {m.contenu && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">{m.contenu}</p>
                )}

                <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-muted">
                  <span>{m.date}</span>
                  {m.estMien && (
                    <button
                      type="button"
                      onClick={() => supprimer(m.id)}
                      disabled={pending}
                      aria-label="Supprimer ce message"
                      title="Supprimer"
                      className="rounded p-0.5 text-red-600 hover:bg-surface disabled:opacity-50"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {statut && (
          <p className="mt-3 text-right text-xs text-muted" aria-live="polite">
            {statut}
          </p>
        )}
      </div>

      {/* Barre de saisie : toujours visible, en bas */}
      <div className="shrink-0 border-t border-border bg-background px-4 pb-20 pt-3 md:pb-3">
        <input ref={entree} type="file" onChange={choisirFichier} className="hidden" />

        <div className="flex flex-col gap-2">
          {piece && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border p-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                {piece.apercu && piece.genre === "image" && (
                  <img src={piece.apercu} alt="Aperçu" className="h-12 w-12 rounded-lg object-cover" />
                )}
                {piece.apercu && piece.genre === "video" && (
                  <video src={piece.apercu} className="h-12 w-16 rounded-lg object-cover" muted />
                )}
                {piece.genre === "fichier" && <Paperclip size={16} aria-hidden="true" />}
                <span className="truncate">{piece.file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPiece(null)}
                aria-label="Retirer le fichier"
                className="rounded-lg p-1 hover:bg-surface"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          {plusOuvert && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => ouvrirChoix("image")}
                className="flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-surface"
              >
                <ImageIcon size={16} aria-hidden="true" /> Photo
              </button>
              <button
                type="button"
                onClick={() => ouvrirChoix("video")}
                className="flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-surface"
              >
                <Video size={16} aria-hidden="true" /> Vidéo
              </button>
              <button
                type="button"
                onClick={() => ouvrirChoix("fichier")}
                className="flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-surface"
              >
                <Paperclip size={16} aria-hidden="true" /> Fichier
              </button>
            </div>
          )}

          {emojisOuverts && (
            <div className="grid grid-cols-8 gap-1 rounded-xl border border-border p-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-label={`Ajouter ${e}`}
                  onClick={() => insererEmoji(e)}
                  className="rounded-lg py-0.5 text-lg hover:bg-surface"
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setPlusOuvert(!plusOuvert)}
              aria-label="Joindre un fichier"
              aria-expanded={plusOuvert}
              className="rounded-xl border border-border p-2 hover:bg-surface"
            >
              <Plus size={18} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setEmojisOuverts(!emojisOuverts)}
              aria-label="Émojis"
              aria-expanded={emojisOuverts}
              className="rounded-xl border border-border p-2 hover:bg-surface"
            >
              <Smile size={18} aria-hidden="true" />
            </button>

            <textarea
              ref={zone}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              maxLength={1000}
              placeholder="Écrire un message"
              rows={1}
              className="min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />

            <button
              type="button"
              onClick={envoyer}
              disabled={pending || (!texte.trim() && !piece)}
              aria-label="Envoyer"
              className="rounded-xl bg-accent p-2.5 text-accent-foreground disabled:opacity-50"
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </div>

          {erreur && (
            <p role="alert" className="text-sm text-red-600">
              {erreur}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}