import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { ActionsProfil } from "@/components/actions-profil";
import { PublicationCarte } from "@/components/publication-carte";
import type { CommentaireAffiche } from "@/components/section-commentaires";
import type { OptionSondage } from "@/components/sondage";

type Auteur = { username: string; display_name: string; avatar_url: string | null };

type Profil = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  is_private: boolean;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
};

type CommentaireBrut = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles: Auteur | Auteur[] | null;
};

type OptionBrute = {
  id: string;
  libelle: string;
  position: number;
  poll_votes: { user_id: string }[] | null;
};

type Publication = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  kind: "texte" | "sondage" | "question";
  views_count: number;
  profiles: Auteur | Auteur[] | null;
  likes: { user_id: string }[] | null;
  reposts: { user_id: string }[] | null;
  comments: CommentaireBrut[] | null;
  poll_options: OptionBrute[] | null;
};

type Etat = "aucun" | "attente" | "suivi";

function unObjet<T>(valeur: T | T[] | null | undefined): T | null {
  if (!valeur) return null;
  return Array.isArray(valeur) ? (valeur[0] ?? null) : valeur;
}

function formaterDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function ProfilPublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuProfil params={params} />
    </Suspense>
  );
}

async function ContenuProfil({ params }: { params: Promise<{ username: string }> }) {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const { username } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profilData } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, is_private, avatar_url, banner_url, created_at")
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

  const peutVoir = estMoi || !profil.is_private || etat === "suivi";

  let publications: Publication[] = [];
  let favoris: string[] = [];

  if (peutVoir) {
    const { data } = await supabase
      .from("posts")
      .select(
        "id, content, created_at, author_id, kind, views_count, profiles!posts_author_id_fkey(username, display_name, avatar_url), likes(user_id), reposts(user_id), comments(id, content, created_at, author_id, profiles!comments_author_id_fkey(username, display_name)), poll_options(id, libelle, position, poll_votes(user_id))",
      )
      .eq("author_id", profil.id)
      .lte("publish_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    publications = (data ?? []) as unknown as Publication[];

    if (user) {
      const { data: fav } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", user.id);
      favoris = (fav ?? []).map((f) => f.post_id);
    }
  }

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
          user && <BoutonSuivreProfil cibleId={profil.id} etatInitial={etat} />
        )}
      </div>

      <div className="mt-3">
        <h1 className="text-2xl font-bold">{profil.display_name}</h1>
        <p className="text-muted">@{profil.username}</p>
        {profil.bio && <p className="mt-3 whitespace-pre-wrap break-words">{profil.bio}</p>}
        <p className="mt-2 text-sm text-muted">
          Inscrit en{" "}
          {new Date(profil.created_at).toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Publications</h2>

      {!peutVoir ? (
        <p className="mt-3 text-muted">Ce compte est privé. Abonne-toi pour voir ses publications.</p>
      ) : publications.length === 0 ? (
        <p className="mt-3 text-muted">Aucune publication pour le moment.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {publications.map((p) => {
            const auteur = unObjet(p.profiles);
            const likes = p.likes ?? [];
            const reposts = p.reposts ?? [];

            const commentaires: CommentaireAffiche[] = [...(p.comments ?? [])]
              .sort((a, b) => a.created_at.localeCompare(b.created_at))
              .map((c) => {
                const auteurCommentaire = unObjet(c.profiles);
                return {
                  id: c.id,
                  contenu: c.content,
                  date: formaterDate(c.created_at),
                  auteurNom: auteurCommentaire?.display_name ?? "Compte inconnu",
                  auteurPseudo: auteurCommentaire?.username ?? "inconnu",
                  estMien: user?.id === c.author_id,
                };
              });

            const options: OptionSondage[] = [...(p.poll_options ?? [])]
              .sort((a, b) => a.position - b.position)
              .map((o) => {
                const votes = o.poll_votes ?? [];
                return {
                  id: o.id,
                  libelle: o.libelle,
                  votes: votes.length,
                  choisie: !!user && votes.some((v) => v.user_id === user.id),
                };
              });

            return (
              <li key={p.id}>
                <PublicationCarte
                  id={p.id}
                  contenu={p.content}
                  date={formaterDate(p.created_at)}
                  auteurId={p.author_id}
                  auteurNom={auteur?.display_name ?? "Compte inconnu"}
                  auteurPseudo={auteur?.username ?? "inconnu"}
                  avatarUrl={auteur?.avatar_url ?? null}
                  estMienne={user?.id === p.author_id}
                  connecte={!!user}
                  nombreLikes={likes.length}
                  dejaLike={likes.some((l) => l.user_id === user?.id)}
                  commentaires={commentaires}
                  nombreReposts={reposts.length}
                  dejaRepost={reposts.some((r) => r.user_id === user?.id)}
                  dejaFavori={favoris.includes(p.id)}
                  estEpinglee={false}
                  vues={p.views_count}
                  kind={p.kind}
                  options={options}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}