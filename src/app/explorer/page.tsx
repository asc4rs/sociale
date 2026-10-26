import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Suggestion = { id: string; username: string; display_name: string };

type Auteur = { username: string; display_name: string };

type PostExplore = {
  id: string;
  content: string;
  created_at: string;
  profiles: Auteur | Auteur[] | null;
};

export default function ExplorerPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuExplorer />
    </Suspense>
  );
}

async function ContenuExplorer() {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Comptes à ne pas suggérer : moi-même et ceux que je suis déjà.
  const exclus = new Set<string>();
  if (user) {
    exclus.add(user.id);
    const { data: suivis } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    (suivis ?? []).forEach((s) => exclus.add(s.following_id));
  }

  const { data: profilsData } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("is_private", false)
    .limit(30);

  const suggestions = ((profilsData ?? []) as Suggestion[])
    .filter((p) => !exclus.has(p.id))
    .slice(0, 10);

  // Publications récentes des comptes publics uniquement.
  const { data: postsData } = await supabase
    .from("posts")
    .select(
      "id, content, created_at, profiles!posts_author_id_fkey!inner(username, display_name, is_private)",
    )
    .eq("profiles.is_private", false)
    .order("created_at", { ascending: false })
    .limit(30);

  const posts = (postsData ?? []) as unknown as PostExplore[];

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Explorer</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Comptes à découvrir</h2>
        {suggestions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aucune suggestion pour le moment.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {suggestions.map((s) => (
              <li key={s.id}>
                <Link href={`/u/${s.username}`} className="hover:underline">
                  <span className="font-semibold">{s.display_name}</span>{" "}
                  <span className="text-sm text-muted">@{s.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Publications récentes</h2>
        {posts.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aucune publication pour le moment.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-4">
            {posts.map((p) => {
              const auteur = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
              return (
                <li key={p.id} className="rounded-xl border border-border p-4">
                  <Link
                    href={`/u/${auteur?.username ?? ""}`}
                    className="font-semibold hover:underline"
                  >
                    {auteur?.display_name ?? "Compte inconnu"}
                  </Link>
                  <p className="mt-2 whitespace-pre-wrap">{p.content}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}