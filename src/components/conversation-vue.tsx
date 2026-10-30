"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Image as ImageIcon,
  Info,
  MoreHorizontal,
  Paperclip,
  Plus,
  Send,
  Smile,
  Trash2,
  Video,
  X,
} from "lucide-react";
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
type Reaction = { message_id: string; user_id: string; emoji: string };
type ReactionsMap = Record<string, Record<string, { count: number; moi: boolean }>>;

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

const REACTIONS_RAPIDES = ["❤️", "😂", "😮", "😢", "😡", "👍"];

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

const ELEMENT_MENU =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-surface";

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
        <img src={url} alt="Photo envoyée" className="max-h-80 w-full rounded-2xl object-cover" />
      </a>
    );
  }
  if (kind === "video") {
    return <video src={url} controls className="max-h-80 w-full rounded-2xl" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm underline"
    >
      <Paperclip size={18} aria-hidden="true" />
      Ouvrir le fichier
    </a>
  );
}

export function ConversationVue({ conversationId, moiId, messages, statut = null }: Props) {
  const router = useRouter();
  const entree = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLTextAreaElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  const dernierClic = useRef<{ id: string; t: number } | null>(null);

  const [texte, setTexte] = useState("");
  const [piece, setPiece] = useState<Piece | null>(null);
  const [plusOuvert, setPlusOuvert] = useState(false);
  const [emojisOuverts, setEmojisOuverts] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reactions, setReactions] = useState<ReactionsMap>({});
  const [versionReactions, setVersionReactions] = useState(0);
  const [menu, setMenu] = useState<string | null>(null);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const idsKey = messages.map((m) => m.id).join(",");

  // Charge les réactions, puis les actualise toutes les 15 secondes.
  useEffect(() => {
    let annule = false;

    async function charger() {
      const ids = idsKey ? idsKey.split(",") : [];
      if (ids.length === 0) {
        setReactions({});
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("message_reactions")
        .select("message_id, user_id, emoji")
        .in("message_id", ids);

      if (annule) return;

      const map: ReactionsMap = {};
      for (const r of (data ?? []) as Reaction[]) {
        if (!map[r.message_id]) map[r.message_id] = {};
        if (!map[r.message_id][r.emoji]) map[r.message_id][r.emoji] = { count: 0, moi: false };
        map[r.message_id][r.emoji].count += 1;
        if (r.user_id === moiId) map[r.message_id][r.emoji].moi = true;
      }
      setReactions(map);
    }

    charger();
    const minuteur = setInterval(charger, 15000);
    return () => {
      annule = true;
      clearInterval(minuteur);
    };
  }, [idsKey, moiId, versionReactions]);

  // Descend au dernier message à chaque nouvel envoi ou réception.
  useEffect(() => {
    const el = liste.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Ferme le menu quand on clique en dehors du message concerné.
  useEffect(() => {
    if (!menu) return;
    function fermer(e: MouseEvent) {
      const cible = (e.target as HTMLElement).closest("[data-message-id]");
      if (cible?.getAttribute("data-message-id") !== menu) {
        setMenu(null);
        setInfoId(null);
      }
    }
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, [menu]);

  useEffect(() => {
    return () => {
      if (piece?.apercu) URL.revokeObjectURL(piece.apercu);
    };
  }, [piece]);

  // Double appui sur une bulle (mobile) : ouvre le menu du message.
  function gererClic(id: string) {
    const maintenant = Date.now();
    const precedent = dernierClic.current;
    if (precedent && precedent.id === id && maintenant - precedent.t < 350) {
      dernierClic.current = null;
      setInfoId(null);
      setMenu(id);
      return;
    }
    dernierClic.current = { id, t: maintenant };
  }

  function basculerMenu(id: string) {
    setInfoId(null);
    setMenu(menu === id ? null : id);
  }

  function basculerReaction(messageId: string, emoji: string) {
    setMenu(null);
    setErreur(null);
    const dejaMoi = !!reactions[messageId]?.[emoji]?.moi;
    const supabase = createClient();

    startTransition(async () => {
      const { error } = dejaMoi
        ? await supabase
            .from("message_reactions")
            .delete()
            .eq("message_id", messageId)
            .eq("user_id", moiId)
            .eq("emoji", emoji)
        : await supabase
            .from("message_reactions")
            .insert({ message_id: messageId, user_id: moiId, emoji });

      if (error) {
        setErreur("Réaction impossible. Réessaie.");
        return;
      }
      setVersionReactions((v) => v + 1);
    });
  }

  function copier(texteCopie: string) {
    navigator.clipboard.writeText(texteCopie);
    setMenu(null);
  }

  function supprimer(id: string) {
    setMenu(null);
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Liste des messages : seule partie qui défile */}
      <div ref={liste} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6">
        <ul className="flex flex-col gap-4">
          {messages.length === 0 && (
            <li className="py-10 text-center text-base text-muted">Aucun message pour le moment.</li>
          )}

          {messages.map((m) => {
            const chips = Object.entries(reactions[m.id] ?? {});
            const ouvert = menu === m.id;

            const boutonOptions = (
              <button
                type="button"
                onClick={() => basculerMenu(m.id)}
                aria-label="Options du message"
                aria-expanded={ouvert}
                className="hidden shrink-0 rounded-full p-1.5 text-muted hover:bg-surface focus:opacity-100 md:flex md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
              >
                <MoreHorizontal size={18} aria-hidden="true" />
              </button>
            );

            return (
              <li key={m.id} className="flex flex-col">
                <div
                  data-message-id={m.id}
                  className={`group relative flex items-center gap-2 ${
                    m.estMien ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.estMien && boutonOptions}

                  <div
                    onClick={() => gererClic(m.id)}
                    className={`max-w-[75%] cursor-default touch-manipulation select-text rounded-3xl px-4 py-3 shadow-sm md:max-w-[60%] ${
                      m.estMien
                        ? "rounded-br-md bg-accent text-accent-foreground"
                        : "rounded-bl-md border border-border bg-surface"
                    }`}
                  >
                    {!m.estMien && <p className="mb-1 text-sm font-semibold">{m.auteurNom}</p>}

                    {m.mediaUrl && m.mediaKind && (
                      <div className="mb-2">
                        <Media url={m.mediaUrl} kind={m.mediaKind} />
                      </div>
                    )}

                    {m.contenu && (
                      <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
                        {m.contenu}
                      </p>
                    )}

                    <p className={`mt-1 text-right text-xs ${m.estMien ? "opacity-70" : "text-muted"}`}>
                      {m.date}
                    </p>
                  </div>

                  {!m.estMien && boutonOptions}

                  {ouvert && (
                    <div
                      className={`absolute bottom-full z-30 mb-2 w-64 rounded-2xl border border-border bg-background p-2 shadow-2xl ${
                        m.estMien ? "right-0" : "left-0"
                      }`}
                    >
                      <div className="flex justify-between gap-1 px-1 py-1">
                        {REACTIONS_RAPIDES.map((e) => (
                          <button
                            key={e}
                            type="button"
                            aria-label={`Réagir avec ${e}`}
                            onClick={() => basculerReaction(m.id, e)}
                            disabled={pending}
                            className="rounded-full p-1.5 text-xl hover:bg-surface disabled:opacity-50"
                          >
                            {e}
                          </button>
                        ))}
                      </div>

                      <div className="my-1 border-t border-border" />

                      {m.contenu && (
                        <button type="button" onClick={() => copier(m.contenu)} className={ELEMENT_MENU}>
                          <Copy size={18} aria-hidden="true" />
                          Copier le texte
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setInfoId(infoId === m.id ? null : m.id)}
                        className={ELEMENT_MENU}
                      >
                        <Info size={18} aria-hidden="true" />
                        Info
                      </button>
                      {infoId === m.id && (
                        <p className="px-3 pb-2 text-xs text-muted">Envoyé le {m.date}</p>
                      )}

                      {m.estMien && (
                        <button
                          type="button"
                          onClick={() => supprimer(m.id)}
                          disabled={pending}
                          className={`${ELEMENT_MENU} text-red-600 disabled:opacity-50`}
                        >
                          <Trash2 size={18} aria-hidden="true" />
                          Supprimer
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {chips.length > 0 && (
                  <div className={`mt-1 flex flex-wrap gap-1 ${m.estMien ? "justify-end" : "justify-start"}`}>
                    {chips.map(([emoji, info]) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => basculerReaction(m.id, emoji)}
                        disabled={pending}
                        title={info.moi ? "Retirer ma réaction" : "Réagir"}
                        className={`flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-sm disabled:opacity-50 ${
                          info.moi ? "border-accent font-semibold" : "border-border"
                        }`}
                      >
                        <span>{emoji}</span>
                        {info.count > 1 && <span className="text-xs font-semibold">{info.count}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {statut && (
          <p className="mt-4 text-right text-sm text-muted" aria-live="polite">
            {statut}
          </p>
        )}
      </div>

      {/* Barre de saisie : toujours visible, en bas */}
      <div className="shrink-0 border-t border-border bg-background px-5 pb-24 pt-4 md:pb-4">
        <input ref={entree} type="file" onChange={choisirFichier} className="hidden" />

        <div className="flex flex-col gap-3">
          {piece && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3 text-sm">
              <div className="flex min-w-0 items-center gap-3">
                {piece.apercu && piece.genre === "image" && (
                  <img src={piece.apercu} alt="Aperçu" className="h-14 w-14 rounded-xl object-cover" />
                )}
                {piece.apercu && piece.genre === "video" && (
                  <video src={piece.apercu} className="h-14 w-20 rounded-xl object-cover" muted />
                )}
                {piece.genre === "fichier" && <Paperclip size={18} aria-hidden="true" />}
                <span className="truncate">{piece.file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPiece(null)}
                aria-label="Retirer le fichier"
                className="rounded-full p-1.5 hover:bg-surface"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          )}

          {plusOuvert && (
            <div className="flex flex-wrap gap-2">
              {(["image", "video", "fichier"] as Genre[]).map((g) => {
                const Icone = g === "image" ? ImageIcon : g === "video" ? Video : Paperclip;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => ouvrirChoix(g)}
                    className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"
                  >
                    <Icone size={18} aria-hidden="true" />
                    {LIBELLES[g]}
                  </button>
                );
              })}
            </div>
          )}

          {emojisOuverts && (
            <div className="grid grid-cols-8 gap-1 rounded-2xl border border-border p-3">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-label={`Ajouter ${e}`}
                  onClick={() => insererEmoji(e)}
                  className="rounded-xl py-1 text-2xl hover:bg-surface"
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
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full hover:bg-surface"
            >
              <Plus size={22} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setEmojisOuverts(!emojisOuverts)}
              aria-label="Émojis"
              aria-expanded={emojisOuverts}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full hover:bg-surface"
            >
              <Smile size={22} aria-hidden="true" />
            </button>

            <textarea
              ref={zone}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              maxLength={1000}
              placeholder="Écrire un message"
              rows={1}
              className="min-h-12 flex-1 resize-none rounded-3xl border border-border bg-background px-5 py-3 text-base text-foreground outline-none focus:border-accent"
            />

            <button
              type="button"
              onClick={envoyer}
              disabled={pending || (!texte.trim() && !piece)}
              aria-label="Envoyer"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground disabled:opacity-40"
            >
              <Send size={20} aria-hidden="true" />
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