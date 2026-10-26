import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

type Auteur = { username: string; display_name: string };

type ResultatPost = {
  id: string;
  content: string;
  created_at: string;
  profiles: Auteur | Auteur[] | null;
};

type ResultatProfil = { id: string; username: string; display_name: string };

export default function RecherchePage(props: Props) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuRecherche searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ContenuRecherche({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const { q: brut } = await searchParams;

  // On retire les caractères qui pourraient casser la requête de recherche.
  const q = (brut ?? "").trim().replace(/[%,()*]/g, "").slice(0, 50);

  let profils: ResultatProfil[] = [];
  let posts: ResultatPost[] = [];

  if (q.length > 0) {
    const supabase = await createClient();

    const { data: profilsData } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(20);
    profils = (profilsData ?? []) as ResultatProfil[];

    // Recherche dans les publications : texte ou hashtag (#mot).
    const { data: postsData } = await supabase
      .from("posts")
      .select("id, content, created_at, profiles!posts_author_id_fkey(username, display_name)")
      .ilike("content", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(30);
    posts = (postsData ?? []) as unknown as ResultatPost[];
  }

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Recherche</h1>

      <form action="/recherche" method="get" className="mt-6 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Personnes, mots ou #hashtags"
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          Chercher
        </button>
      </form>

      {q.length > 0 && (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Comptes</h2>
            {profils.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Aucun compte trouvé.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {profils.map((p) => (
                  <li key={p.id}>
                    <Link href={`/u/${p.username}`} className="hover:underline">
                      <span className="font-semibold">{p.display_name}</span>{" "}
                      <span className="text-sm text-muted">@{p.username}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Publications</h2>
            {posts.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Aucune publication trouvée.</p>
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
        </>
      )}
    </div>
  );
}