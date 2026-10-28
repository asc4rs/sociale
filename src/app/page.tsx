import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Composer } from "@/components/composer";
import { PublicationCarte } from "@/components/publication-carte";
import type { CommentaireAffiche } from "@/components/section-commentaires";

type Auteur = { username: string; display_name: string };

type CommentaireBrut = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles: Auteur | Auteur[] | null;
};

type Publication = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  views_count: number;
  profiles: Auteur | Auteur[] | null;
  likes: { user_id: string }[] | null;
  reposts: { user_id: string }[] | null;
  comments: CommentaireBrut[] | null;
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AccueilPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuAccueil />
    </Suspense>
  );
}

async function ContenuAccueil() {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("posts")
    .select(
      "id, content, created_at, author_id, views_count, profiles!posts_author_id_fkey(username, display_name), likes(user_id), reposts(user_id), comments(id, content, created_at, author_id, profiles!comments_author_id_fkey(username, display_name))",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  let publications = (data ?? []) as unknown as Publication[];

  let favoris: string[] = [];
  let epingleId: string | null = null;
  let masquees = new Set<string>();

  if (user) {
    const { data: fav } = await supabase
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", user.id);
    favoris = (fav ?? []).map((f) => f.post_id);

    const { data: moi } = await supabase
      .from("profiles")
      .select("pinned_post_id")
      .eq("id", user.id)
      .maybeSingle();
    epingleId = moi?.pinned_post_id ?? null;

    // Publications que j'ai masquées ou dont je ne veux pas voir le contenu.
    const { data: masques } = await supabase
      .from("post_masques")
      .select("post_id")
      .eq("user_id", user.id);
    masquees = new Set((masques ?? []).map((m) => m.post_id));
  }

  publications = publications.filter((p) => !masquees.has(p.id));

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Accueil</h1>

      <div className="mt-6">
        <Composer />
      </div>

      <ul className="mt-8 flex flex-col gap-4">
        {publications.length === 0 && (
          <p className="text-muted">Aucune publication pour le moment.</p>
        )}

        {publications.map((p) => {
          const auteur = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
          const likes = p.likes ?? [];
          const reposts = p.reposts ?? [];

          const commentaires: CommentaireAffiche[] = [...(p.comments ?? [])]
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .map((c) => {
              const auteurCommentaire = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
              return {
                id: c.id,
                contenu: c.content,
                date: formaterDate(c.created_at),
                auteurNom: auteurCommentaire?.display_name ?? "Compte inconnu",
                auteurPseudo: auteurCommentaire?.username ?? "inconnu",
                estMien: user?.id === c.author_id,
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
                estMienne={user?.id === p.author_id}
                connecte={!!user}
                nombreLikes={likes.length}
                dejaLike={likes.some((l) => l.user_id === user?.id)}
                commentaires={commentaires}
                nombreReposts={reposts.length}
                dejaRepost={reposts.some((r) => r.user_id === user?.id)}
                dejaFavori={favoris.includes(p.id)}
                estEpinglee={epingleId === p.id}
                vues={p.views_count}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}