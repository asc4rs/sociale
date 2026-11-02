"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Tag, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ajouterTagPhoto, supprimerTagPhoto } from "@/app/actions/tags-photo";

type TagPhoto = { id: string; user_id: string; username: string; x: number; y: number };
type Media = { id: string; url: string; tags: TagPhoto[] };
type Suivi = { id: string; username: string; display_name: string };

type LigneTag = {
  id: string;
  user_id: string;
  x: number | string;
  y: number | string;
  profiles: { username: string } | { username: string }[] | null;
};

type LigneMedia = {
  id: string;
  url: string;
  position: number;
  post_media_tags: LigneTag[] | null;
};

function unObjet<T>(valeur: T | T[] | null | undefined): T | null {
  if (!valeur) return null;
  return Array.isArray(valeur) ? (valeur[0] ?? null) : valeur;
}

// Affiche les images d'une publication en carrousel, avec les personnes taguées.
export function CarrouselMedias({ postId, estMienne }: { postId: string; estMienne: boolean }) {
  const [medias, setMedias] = useState<Media[]>([]);
  const [index, setIndex] = useState(0);
  const [version, setVersion] = useState(0);
  const [modeTag, setModeTag] = useState(false);
  const [cible, setCible] = useState<{ mediaId: string; x: number; y: number } | null>(null);
  const [suivis, setSuivis] = useState<Suivi[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const cadre = useRef<HTMLDivElement>(null);

  // Charge les images et leurs tags.
  useEffect(() => {
    let annule = false;

    async function charger() {
      const { data } = await createClient()
        .from("post_media")
        .select("id, url, position, post_media_tags(id, user_id, x, y, profiles(username))")
        .eq("post_id", postId)
        .order("position", { ascending: true });

      if (annule || !data) return;

      const lignes = data as unknown as LigneMedia[];
      setMedias(
        lignes.map((m) => ({
          id: m.id,
          url: m.url,
          tags: (m.post_media_tags ?? []).map((t) => ({
            id: t.id,
            user_id: t.user_id,
            username: unObjet(t.profiles)?.username ?? "inconnu",
            x: Number(t.x),
            y: Number(t.y),
          })),
        })),
      );
    }

    charger();
    return () => {
      annule = true;
    };
  }, [postId, version]);

  // Charge les personnes que je suis, uniquement quand je commence à taguer.
  useEffect(() => {
    if (!modeTag || suivis !== null) return;
    let annule = false;

    async function charger() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: liens } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .eq("status", "accepted")
        .limit(300);

      const ids = (liens ?? []).map((l) => l.following_id);
      let profils: Suivi[] = [];
      if (ids.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", ids)
          .order("display_name", { ascending: true });
        profils = data ?? [];
      }

      if (!annule) setSuivis(profils);
    }

    charger();
    return () => {
      annule = true;
    };
  }, [modeTag, suivis]);

  if (medias.length === 0) return null;

  const media = medias[index];
  const precedent = () => setIndex((i) => (i - 1 + medias.length) % medias.length);
  const suivant = () => setIndex((i) => (i + 1) % medias.length);

  // Clic sur l'image en mode tag : on note la position, puis on choisit la personne.
  function placerTag(e: React.MouseEvent<HTMLDivElement>) {
    if (!modeTag || !cadre.current) return;
    const rect = cadre.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setErreur(null);
    setCible({ mediaId: media.id, x, y });
  }

  function taguer(userId: string) {
    if (!cible) return;
    setErreur(null);
    startTransition(async () => {
      const r = await ajouterTagPhoto(cible.mediaId, userId, cible.x, cible.y);
      if (r.error) {
        setErreur(r.error);
        return;
      }
      setCible(null);
      setModeTag(false);
      setVersion((v) => v + 1);
    });
  }

  function retirer(tagId: string) {
    setErreur(null);
    startTransition(async () => {
      const r = await supprimerTagPhoto(tagId);
      if (r.error) {
        setErreur(r.error);
        return;
      }
      setVersion((v) => v + 1);
    });
  }

  return (
    <div className="mt-3">
      <div
        ref={cadre}
        onClick={placerTag}
        className={`relative overflow-hidden rounded-2xl border border-border bg-surface ${
          modeTag ? "cursor-crosshair" : ""
        }`}
      >
        <img
          src={media.url}
          alt={`Image ${index + 1} sur ${medias.length}`}
          className="max-h-[32rem] w-full object-cover"
          draggable={false}
        />

        {media.tags.map((t) => (
          <span
            key={t.id}
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-xs font-semibold text-white"
          >
            <Link
              href={`/u/${t.username}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              @{t.username}
            </Link>
            {estMienne && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  retirer(t.id);
                }}
                disabled={pending}
                aria-label={`Retirer le tag de ${t.username}`}
                className="rounded-full p-0.5 hover:bg-white/20"
              >
                <X size={10} aria-hidden="true" />
              </button>
            )}
          </span>
        ))}

        {medias.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                precedent();
              }}
              aria-label="Image précédente"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                suivant();
              }}
              aria-label="Image suivante"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>

            <span className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
              {index + 1}/{medias.length}
            </span>

            <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {medias.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {estMienne && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setModeTag(!modeTag);
              setCible(null);
              setErreur(null);
            }}
            aria-pressed={modeTag}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold ${
              modeTag ? "border-accent bg-accent text-accent-foreground" : "border-border hover:bg-surface"
            }`}
          >
            <Tag size={14} aria-hidden="true" />
            {modeTag ? "Clique sur la photo" : "Taguer une personne"}
          </button>
          {modeTag && (
            <span className="text-xs text-muted">
              Clique à l&apos;endroit où la personne apparaît.
            </span>
          )}
        </div>
      )}

      {cible && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choisir la personne à taguer"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setCible(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[70vh] w-full max-w-sm flex-col rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <p className="font-bold">Qui est-ce ?</p>
              <button
                type="button"
                onClick={() => setCible(null)}
                aria-label="Fermer"
                className="rounded-full p-2 hover:bg-surface"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto pb-4">
              {suivis === null && <p className="px-5 py-4 text-sm text-muted">Chargement...</p>}
              {suivis !== null && suivis.length === 0 && (
                <p className="px-5 py-4 text-sm text-muted">Tu ne suis personne pour le moment.</p>
              )}
              {suivis?.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => taguer(s.id)}
                  disabled={pending}
                  className="flex w-full flex-col px-5 py-2.5 text-left hover:bg-surface disabled:opacity-50"
                >
                  <span className="font-semibold">{s.display_name}</span>
                  <span className="text-xs text-muted">@{s.username}</span>
                </button>
              ))}
            </div>

            {erreur && (
              <p role="alert" className="border-t border-border px-5 py-3 text-sm text-red-600">
                {erreur}
              </p>
            )}
          </div>
        </div>
      )}

      {erreur && !cible && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {erreur}
        </p>
      )}
    </div>
  );
}