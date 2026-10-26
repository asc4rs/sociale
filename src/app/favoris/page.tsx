import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Auteur = { username: string; display_name: string };

type Ligne = {
  posts: {
    id: string;
    content: string;
    created_at: string;
    profiles: Auteur | Auteur[] | null;
  } | null;
};

export default function FavorisPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuFavoris />
    </Suspense>
  );
}

async function ContenuFavoris() {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data } = await supabase
    .from("bookmarks")
    .select(
      "created_at, posts(id, content, created_at, profiles!posts_author_id_fkey(username, display_name))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const lignes = (data ?? []) as unknown as Ligne[];

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Publications enregistrées</h1>

      {lignes.length === 0 ? (
        <p className="mt-6 text-muted">Aucune publication enregistrée.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {lignes.map((l) => {
            if (!l.posts) return null;
            const auteur = Array.isArray(l.posts.profiles)
              ? l.posts.profiles[0]
              : l.posts.profiles;

            return (
              <li key={l.posts.id} className="rounded-xl border border-border p-4">
                <Link
                  href={`/u/${auteur?.username ?? ""}`}
                  className="font-semibold hover:underline"
                >
                  {auteur?.display_name ?? "Compte inconnu"}
                </Link>
                <p className="mt-2 whitespace-pre-wrap">{l.posts.content}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}