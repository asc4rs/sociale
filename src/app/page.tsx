import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Composer } from "@/components/composer";
import { PublicationCarte } from "@/components/publication-carte";

type Publication = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles:
    | { username: string; display_name: string }
    | { username: string; display_name: string }[]
    | null;
  likes: { user_id: string }[] | null;
};

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

  // La base ne renvoie que les publications et likes autorisés par les règles de sécurité.
  const { data } = await supabase
    .from("posts")
    .select(
      "id, content, created_at, author_id, profiles!posts_author_id_fkey(username, display_name), likes(user_id)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const publications = (data ?? []) as unknown as Publication[];

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Pour toi</h1>

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
          const date = new Date(p.created_at).toLocaleString("fr-FR", {
            dateStyle: "short",
            timeStyle: "short",
          });

          return (
            <li key={p.id}>
              <PublicationCarte
                id={p.id}
                contenu={p.content}
                date={date}
                auteurNom={auteur?.display_name ?? "Compte inconnu"}
                auteurPseudo={auteur?.username ?? "inconnu"}
                estMienne={user?.id === p.author_id}
                nombreLikes={likes.length}
                dejaLike={likes.some((l) => l.user_id === user?.id)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}