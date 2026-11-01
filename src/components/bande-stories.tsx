"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Image as ImageIcon, Plus, Trash2, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { createClient } from "@/lib/supabase/client";
import {
  basculerAmiProche,
  creerStory,
  enregistrerVueStory,
  supprimerStory,
} from "@/app/actions/stories";

type Auteur = { username: string; display_name: string; avatar_url: string | null };

type StoryBrute = {
  id: string;
  content: string | null;
  media_url: string | null;
  close_friends: boolean;
  created_at: string;
  author_id: string;
  profiles: Auteur | Auteur[] | null;
};

type Story = {
  id: string;
  contenu: string | null;
  media: string | null;
  amisProches: boolean;
  date: string;
  vues: number;
};

type Groupe = {
  auteurId: string;
  username: string;
  nom: string;
  avatar: string | null;
  stories: Story[];
  nonVue: boolean;
};

const DUREE = 5000;
const TYPES_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TAILLE_MAX = 10 * 1024 * 1024;

function unObjet<T>(valeur: T | T[] | null | undefined): T | null {
  if (!valeur) return null;
  return Array.isArray(valeur) ? (valeur[0] ?? null) : valeur;
}

function heure(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function BandeStories({ userId }: { userId: string | null }) {
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [moi, setMoi] = useState<{ nom: string; avatar: string | null }>({ nom: "?", avatar: null });
  const [ouvertId, setOuvertId] = useState<string | null>(null);
  const [creation, setCreation] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let annule = false;

    async function charger() {
      const supabase = createClient();

      const [resStories, resProfil] = await Promise.all([
        supabase
          .from("stories")
          .select(
            "id, content, media_url, close_friends, created_at, author_id, profiles!stories_author_id_fkey(username, display_name, avatar_url)",
          )
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", userId)
          .maybeSingle(),
      ]);

      const brutes = (resStories.data ?? []) as unknown as StoryBrute[];
      const ids = brutes.map((s) => s.id);

      let vues: { story_id: string; user_id: string }[] = [];
      if (ids.length > 0) {
        const { data } = await supabase
          .from("story_views")
          .select("story_id, user_id")
          .in("story_id", ids);
        vues = (data ?? []) as { story_id: string; user_id: string }[];
      }

      if (annule) return;

      const compteur = new Map<string, number>();
      const dejaVue = new Set<string>();
      for (const v of vues) {
        compteur.set(v.story_id, (compteur.get(v.story_id) ?? 0) + 1);
        if (v.user_id === userId) dejaVue.add(v.story_id);
      }

      const parAuteur = new Map<string, Groupe>();
      for (const s of brutes) {
        const profil = unObjet(s.profiles);
        let g = parAuteur.get(s.author_id);
        if (!g) {
          g = {
            auteurId: s.author_id,
            username: profil?.username ?? "inconnu",
            nom: profil?.display_name ?? "Compte inconnu",
            avatar: profil?.avatar_url ?? null,
            stories: [],
            nonVue: false,
          };
          parAuteur.set(s.author_id, g);
        }
        g.stories.push({
          id: s.id,
          contenu: s.content,
          media: s.media_url,
          amisProches: s.close_friends,
          date: s.created_at,
          vues: compteur.get(s.id) ?? 0,
        });
        if (s.author_id !== userId && !dejaVue.has(s.id)) g.nonVue = true;
      }

      setGroupes([...parAuteur.values()]);
      if (resProfil.data) {
        setMoi({ nom: resProfil.data.display_name, avatar: resProfil.data.avatar_url });
      }
    }

    charger();
    return () => {
      annule = true;
    };
  }, [userId, version]);

  if (!userId) return null;

  const mesStories = groupes.find((g) => g.auteurId === userId);
  const autres = groupes
    .filter((g) => g.auteurId !== userId)
    .sort((a, b) => Number(b.nonVue) - Number(a.nonVue));
  const groupeOuvert = groupes.find((g) => g.auteurId === ouvertId) ?? null;

  return (
    <>
      <section aria-label="Stories" className="flex gap-4 overflow-x-auto pb-2">
        <div className="flex w-16 shrink-0 flex-col items-center gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => (mesStories ? setOuvertId(userId) : setCreation(true))}
              aria-label={mesStories ? "Voir ta story" : "Créer une story"}
              className="block"
            >
              <span
                className={`block rounded-full p-0.5 ${
                  mesStories ? "bg-border" : "border border-dashed border-border"
                }`}
              >
                <span className="block rounded-full bg-background p-0.5">
                  <Avatar url={moi.avatar} nom={moi.nom} taille="md" />
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCreation(true)}
              aria-label="Ajouter une story"
              className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground"
            >
              <Plus size={12} aria-hidden="true" />
            </button>
          </div>
          <span className="w-16 truncate text-center text-xs text-muted">Ta story</span>
        </div>

        {autres.map((g) => (
          <div key={g.auteurId} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setOuvertId(g.auteurId)}
              aria-label={`Story de ${g.nom}`}
              className="block"
            >
              <span
                className={`block rounded-full p-0.5 ${
                  g.nonVue ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" : "bg-border"
                }`}
              >
                <span className="block rounded-full bg-background p-0.5">
                  <Avatar url={g.avatar} nom={g.nom} taille="md" />
                </span>
              </span>
            </button>
            <span className="w-16 truncate text-center text-xs">{g.nom}</span>
          </div>
        ))}
      </section>

      {groupeOuvert && (
        <Visionneuse
          groupe={groupeOuvert}
          moiId={userId}
          onFermer={() => setOuvertId(null)}
          onChange={() => setVersion((v) => v + 1)}
        />
      )}

      {creation && (
        <CreerStory
          userId={userId}
          onFermer={() => setCreation(false)}
          onCree={() => {
            setCreation(false);
            setVersion((v) => v + 1);
          }}
        />
      )}
    </>
  );
}

function Visionneuse({
  groupe,
  moiId,
  onFermer,
  onChange,
}: {
  groupe: Groupe;
  moiId: string;
  onFermer: () => void;
  onChange: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const story = groupe.stories[index];
  const estMoi = groupe.auteurId === moiId;

  // Marque la story comme vue (sauf mes propres stories).
  useEffect(() => {
    if (!story || estMoi) return;
    enregistrerVueStory(story.id);
  }, [story?.id, estMoi]);

  function suivant() {
    if (index < groupe.stories.length - 1) setIndex(index + 1);
    else onFermer();
  }

  function precedent() {
    if (index > 0) setIndex(index - 1);
  }

  // Passe automatiquement à la story suivante.
  useEffect(() => {
    const t = setTimeout(suivant, DUREE);
    return () => clearTimeout(t);
  }, [index]);

  // Touches : Échap ferme, flèches changent de story.
  useEffect(() => {
    function touche(e: KeyboardEvent) {
      if (e.key === "Escape") onFermer();
      if (e.key === "ArrowRight") suivant();
      if (e.key === "ArrowLeft") precedent();
    }
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  });

  function supprimer() {
    startTransition(async () => {
      await supprimerStory(story.id);
      onFermer();
      onChange();
    });
  }

  if (!story) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Story de ${groupe.nom}`}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
    >
      <style>{`@keyframes barreStory { from { width: 0% } to { width: 100% } }`}</style>

      <div className="relative flex h-[85vh] max-h-[800px] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-neutral-900">
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
          {groupe.stories.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={{
                  width: i < index ? "100%" : i === index ? undefined : "0%",
                  animation: i === index ? `barreStory ${DUREE}ms linear forwards` : undefined,
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-3 top-8 z-20 flex items-center justify-between gap-2 text-white">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar url={groupe.avatar} nom={groupe.nom} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{groupe.nom}</p>
              <p className="text-xs opacity-70">
                {heure(story.date)}
                {story.amisProches && " · Amis proches"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {estMoi && (
              <button
                type="button"
                onClick={supprimer}
                disabled={pending}
                aria-label="Supprimer la story"
                className="rounded-full p-2 hover:bg-white/10 disabled:opacity-50"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onFermer}
              aria-label="Fermer"
              className="rounded-full p-2 hover:bg-white/10"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-black">
          {story.media ? (
            <img src={story.media} alt="" className="max-h-full w-full object-contain" />
          ) : (
            <p className="whitespace-pre-wrap break-words p-8 text-center text-2xl font-semibold text-white">
              {story.contenu}
            </p>
          )}
        </div>

        {story.media && story.contenu && (
          <p className="absolute inset-x-0 bottom-12 z-10 bg-black/50 px-4 py-2 text-center text-white">
            {story.contenu}
          </p>
        )}

        {/* Zones de clic : gauche = précédente, droite = suivante */}
        <button
          type="button"
          onClick={precedent}
          aria-label="Story précédente"
          className="absolute inset-y-0 left-0 z-10 w-1/3"
        />
        <button
          type="button"
          onClick={suivant}
          aria-label="Story suivante"
          className="absolute inset-y-0 right-0 z-10 w-2/3"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4 text-sm text-white">
          {estMoi && (
            <span className="rounded-full bg-black/60 px-3 py-1">
              {story.vues} {story.vues > 1 ? "vues" : "vue"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CreerStory({
  userId,
  onFermer,
  onCree,
}: {
  userId: string;
  onFermer: () => void;
  onCree: () => void;
}) {
  const entree = useRef<HTMLInputElement>(null);
  const [texte, setTexte] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [amisProches, setAmisProches] = useState(false);
  const [suivis, setSuivis] = useState<{ id: string; nom: string; avatar: string | null }[]>([]);
  const [choisis, setChoisis] = useState<Set<string>>(new Set());
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Libère l'aperçu quand il change ou disparaît.
  useEffect(() => {
    return () => {
      if (apercu) URL.revokeObjectURL(apercu);
    };
  }, [apercu]);

  // Charge mes abonnements et ma liste d'amis proches.
  useEffect(() => {
    let annule = false;

    async function charger() {
      const supabase = createClient();

      const { data: liens } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId)
        .eq("status", "accepted")
        .limit(300);

      const ids = (liens ?? []).map((l) => l.following_id);
      let profils: { id: string; display_name: string; avatar_url: string | null }[] = [];
      if (ids.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", ids)
          .order("display_name", { ascending: true });
        profils = data ?? [];
      }

      const { data: proches } = await supabase
        .from("close_friends")
        .select("friend_id")
        .eq("owner_id", userId);

      if (annule) return;
      setSuivis(profils.map((p) => ({ id: p.id, nom: p.display_name, avatar: p.avatar_url })));
      setChoisis(new Set((proches ?? []).map((p) => p.friend_id)));
    }

    charger();
    return () => {
      annule = true;
    };
  }, [userId]);

  function choisirImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    if (!TYPES_IMAGE.includes(f.type)) {
      setErreur("Format non accepté (JPG, PNG, WebP ou GIF).");
      return;
    }
    if (f.size > TAILLE_MAX) {
      setErreur("Image trop lourde (10 Mo maximum).");
      return;
    }

    setErreur(null);
    setFichier(f);
    setApercu(URL.createObjectURL(f));
  }

  function retirerImage() {
    setFichier(null);
    setApercu(null);
  }

  function basculerAmi(id: string) {
    const actif = !choisis.has(id);
    const nouveau = new Set(choisis);
    if (actif) nouveau.add(id);
    else nouveau.delete(id);
    setChoisis(nouveau);
    basculerAmiProche(id, actif);
  }

  function publier() {
    setErreur(null);
    startTransition(async () => {
      let url: string | null = null;

      if (fichier) {
        const supabase = createClient();
        const nom = fichier.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const chemin = `${userId}/stories/${Date.now()}-${nom}`;

        const { error } = await supabase.storage
          .from("medias")
          .upload(chemin, fichier, { contentType: fichier.type });
        if (error) {
          setErreur("Envoi de l'image impossible. Réessaie.");
          return;
        }
        url = supabase.storage.from("medias").getPublicUrl(chemin).data.publicUrl;
      }

      const r = await creerStory(texte, url, amisProches);
      if (r.error) {
        setErreur(r.error);
        return;
      }
      onCree();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Créer une story"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-background p-5">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">Nouvelle story</p>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="rounded-full p-2 hover:bg-surface"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {apercu ? (
          <div className="relative">
            <img src={apercu} alt="Aperçu" className="max-h-72 w-full rounded-xl object-contain" />
            <button
              type="button"
              onClick={retirerImage}
              aria-label="Retirer la photo"
              className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => entree.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted hover:bg-surface"
          >
            <ImageIcon size={18} aria-hidden="true" />
            Ajouter une photo
          </button>
        )}

        <input
          ref={entree}
          type="file"
          accept={TYPES_IMAGE.join(",")}
          onChange={choisirImage}
          className="hidden"
        />

        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          maxLength={280}
          placeholder="Ajoute un texte (facultatif)"
          className="min-h-20 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
        />

        <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
          <span>
            <span className="block font-semibold">Amis proches uniquement</span>
            <span className="block text-xs text-muted">
              Seules les personnes de ta liste verront cette story.
            </span>
          </span>
          <input
            type="checkbox"
            checked={amisProches}
            onChange={(e) => setAmisProches(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        {amisProches && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Ma liste d&apos;amis proches</p>
            {suivis.length === 0 && (
              <p className="text-sm text-muted">Tu ne suis encore personne.</p>
            )}
            <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {suivis.map((s) => {
                const coche = choisis.has(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => basculerAmi(s.id)}
                      aria-pressed={coche}
                      className="flex w-full items-center justify-between gap-3 rounded-xl p-2 hover:bg-surface"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar url={s.avatar} nom={s.nom} />
                        <span className="truncate text-sm">{s.nom}</span>
                      </span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          coche ? "border-accent bg-accent text-accent-foreground" : "border-border"
                        }`}
                      >
                        {coche && <Check size={14} aria-hidden="true" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {erreur && (
          <p role="alert" className="text-sm text-red-600">
            {erreur}
          </p>
        )}

        <button
          type="button"
          onClick={publier}
          disabled={pending || (!texte.trim() && !fichier)}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          {pending ? "Publication..." : "Publier la story"}
        </button>
      </div>
    </div>
  );
}