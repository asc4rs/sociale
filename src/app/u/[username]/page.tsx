import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ActionsProfil } from "@/components/actions-profil";
import { Avatar } from "@/components/avatar";
import { ListePublications, type Publication } from "@/components/liste-publications";
import { SuggestionsAbonnements } from "@/components/suggestions-abonnements";

const SELECT_POST =
  "id, content, created_at, author_id, kind, views_count, profiles!posts_author_id_fkey(username, display_name, avatar_url), likes(user_id), reposts(user_id), comments(id, content, created_at, author_id, profiles!comments_author_id_fkey(username, display_name)), poll_options(id, libelle, position, poll_votes(user_id))";

type Onglet = "publications" | "republications" | "likes";
type Filtre = "tout" | "recent" | "populaires";
type Etat = "aucun" | "attente" | "suivi";

type Profil = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  is_private: boolean;
  avatar_url: string | null;
  banner_url: string | null;
  pinned_post_id: string | null;
  created_at: string;
};

const ONGLETS: { valeur: Onglet; libelle: string }[] = [
  { valeur: "publications", libelle: "Publications" },
  { valeur: "republications", libelle: "Republications" },
  { valeur: "likes", libelle: "J'aime" },
];

const FILTRES: { valeur: Filtre; libelle: string }[] = [
  { valeur: "tout", libelle: "Tout" },
  { valeur: "recent", libelle: "Le plus récent" },
  { valeur: "populaires", libelle: "Populaires" },
];

const byDate = (a: Publication, b: Publication) => b.created_at.localeCompare(a.created_at);

// Applique le filtre choisi : tout, les 7 derniers jours, ou les plus vues.
function trier(liste: Publication[], filtre: Filtre) {
  if (filtre === "populaires") {
    return [...liste].sort((a, b) => b.views_count - a.views_count);
  }
  if (filtre === "recent") {
    const limite = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return liste
      .filter((p) => new Date(p.created_at).getTime() >= limite)
      .sort(byDate);
  }
  return [...liste].sort(byDate);
}

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

export default function ProfilPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ onglet?: string; filtre?: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuProfil params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ContenuProfil({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ onglet?: string; filtre?: string }>;
}) {
  await connection();

  const { username } = await params;
  const { onglet: ongletBrut, filtre: filtreBrut } = await searchParams;

  const onglet: Onglet =
    ongletBrut === "republications" || ongletBrut === "likes" ? ongletBrut : "publications";
  const filtre: Filtre =
    filtreBrut === "recent" || filtreBrut === "populaires" ? filtreBrut : "tout";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profilData } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, is_private, avatar_url, banner_url, pinned_post_id, created_at")
    .eq("username", username)
    .maybeSingle();

  if (!profilData) notFound();

  const profil = profilData as Profil;
  const estMoi = user?.id === profil.id;

  let etat: Etat = "aucun";
  if (user && !estMoi) {
    const { data: lien } = await supabase
      .from("follows")
      .select("status")
      .eq("follower_id", user.id)
      .eq("following_id", profil.id)
      .maybeSingle();
    if (lien?.status === "accepted") etat = "suivi";
    else if (lien?.status === "pending") etat = "attente";
  }

  // Compteurs : abonnés et abonnements acceptés.
  const { count: nombreAbonnes } = await supabase
    .from("follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("following_id", profil.id)
    .eq("status", "accepted");

  const { count: nombreAbonnements } = await supabase
    .from("follows")
    .select("following_id", { count: "exact", head: true })
    .eq("follower_id", profil.id)
    .eq("status", "accepted");

  const peutVoir = estMoi || !profil.is_private || etat === "suivi";

  let publications: Publication[] = [];
  let favoris: string[] = [];

  if (peutVoir) {
    const maintenant = new Date().toISOString();
    let lignes: Publication[] = [];

    if (onglet === "publications") {
      const { data } = await supabase
        .from("posts")
        .select(SELECT_POST)
        .eq("author_id", profil.id)
        .lte("publish_at", maintenant)
        .order("created_at", { ascending: false })
        .limit(100);
      lignes = (data ?? []) as unknown as Publication[];
    } else {
      // Republications ou J'aime : on récupère les identifiants, puis les publications.
      const table = onglet === "likes" ? "likes" : "reposts";
      const { data: liens } = await supabase
        .from(table)
        .select("post_id")
        .eq("user_id", profil.id)
        .limit(100);
      const ids = (liens ?? []).map((l) => l.post_id as string);

      if (ids.length > 0) {
        const { data } = await supabase
          .from("posts")
          .select(SELECT_POST)
          .in("id", ids)
          .lte("publish_at", maintenant)
          .limit(100);
        lignes = (data ?? []) as unknown as Publication[];
      }
    }

    publications = trier(lignes, filtre);

    if (user) {
      const { data: fav } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", user.id);
      favoris = (fav ?? []).map((f) => f.post_id);
    }
  }

  const lien = (o: Onglet, f: Filtre) => `/u/${profil.username}?onglet=${o}&filtre=${f}`;

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <div className="h-36 w-full overflow-hidden rounded-xl bg-surface">
        {profil.banner_url && (
          <img src={profil.banner_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="-mt-10 flex items-end justify-between gap-3 px-4">
        <div className="rounded-full border-4 border-background">
          <Avatar url={profil.avatar_url} nom={profil.display_name} taille="lg" />
        </div>

        {estMoi ? (
          <Link
            href="/profil/modifier"
            className="rounded-xl border border-border px-4 py-1.5 text-sm font-semibold hover:bg-surface"
          >
            Modifier mon profil
          </Link>
        ) : (
          user && <ActionsProfil cibleId={profil.id} etatInitial={etat} />
        )}
      </div>

      <div className="mt-3">
        <h1 className="text-2xl font-bold">{profil.display_name}</h1>
        <p className="text-muted">@{profil.username}</p>
        {profil.bio && <p className="mt-3 whitespace-pre-wrap break-words">{profil.bio}</p>}
        <p className="mt-2 text-sm text-muted">Inscrit en {formaterDate(profil.created_at)}</p>

        <div className="mt-4 flex gap-6 text-sm">
          <p>
            <span className="font-bold">{nombreAbonnements ?? 0}</span>{" "}
            <span className="text-muted">abonnements</span>
          </p>
          <p>
            <span className="font-bold">{nombreAbonnes ?? 0}</span>{" "}
            <span className="text-muted">abonnés</span>
          </p>
        </div>
      </div>

      <nav aria-label="Contenus du profil" className="mt-8 flex gap-2 border-b border-border pb-3">
        {ONGLETS.map((o) => (
          <Link
            key={o.valeur}
            href={lien(o.valeur, filtre)}
            aria-current={onglet === o.valeur ? "page" : undefined}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
              onglet === o.valeur
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:bg-surface"
            }`}
          >
            {o.libelle}
          </Link>
        ))}
      </nav>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <Link
            key={f.valeur}
            href={lien(onglet, f.valeur)}
            className={`rounded-xl border px-3 py-1 text-xs font-semibold ${
              filtre === f.valeur ? "border-accent" : "border-border text-muted hover:bg-surface"
            }`}
          >
            {f.libelle}
          </Link>
        ))}
      </div>

      {!peutVoir ? (
        <p className="mt-6 text-muted">Ce compte est privé. Abonne-toi pour voir ses contenus.</p>
      ) : publications.length === 0 ? (
        <p className="mt-6 text-muted">
          {onglet === "publications" && "Aucune publication pour le moment."}
          {onglet === "republications" && "Aucune republication pour le moment."}
          {onglet === "likes" && "Aucune publication aimée pour le moment."}
        </p>
      ) : (
        <ListePublications
          publications={publications}
          userId={user?.id ?? null}
          favoris={favoris}
          epingleId={profil.pinned_post_id}
        />
      )}

      {estMoi && user && (
        <Suspense fallback={null}>
          <SuggestionsAbonnements userId={user.id} />
        </Suspense>
      )}
    </div>
  );
}