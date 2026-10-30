import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Composer } from "@/components/composer";
import { ListePublications, type Publication } from "@/components/liste-publications";

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

  // Seules les publications dont la date est passée apparaissent dans le fil.
  const { data } = await supabase
    .from("posts")
    .select(
      "id, content, created_at, author_id, kind, views_count, profiles!posts_author_id_fkey(username, display_name, avatar_url), likes(user_id), reposts(user_id), comments(id, content, created_at, author_id, profiles!comments_author_id_fkey(username, display_name)), poll_options(id, libelle, position, poll_votes(user_id))",
    )
    .lte("publish_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  let publications = (data ?? []) as unknown as Publication[];

  let favoris: string[] = [];
  let epingleId: string | null = null;
  let masquees = new Set<string>();
  let programmees: { id: string; content: string; publish_at: string }[] = [];

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

    const { data: masques } = await supabase
      .from("post_masques")
      .select("post_id")
      .eq("user_id", user.id);
    masquees = new Set((masques ?? []).map((m) => m.post_id));

    // Mes publications programmées (pas encore visibles par les autres).
    const { data: prog } = await supabase
      .from("posts")
      .select("id, content, publish_at")
      .eq("author_id", user.id)
      .gt("publish_at", new Date().toISOString())
      .order("publish_at", { ascending: true })
      .limit(20);
    programmees = prog ?? [];
  }

  publications = publications.filter((p) => !masquees.has(p.id));

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Accueil</h1>

      <div className="mt-6">
        <Composer />
      </div>

      {programmees.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-muted">
            Programmées ({programmees.length})
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {programmees.map((p) => (
              <li key={p.id} className="rounded-xl border border-dashed border-border p-3 text-sm">
                <p className="text-xs text-muted">{formaterDate(p.publish_at)}</p>
                <p className="mt-1 line-clamp-2 break-words">{p.content}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8">
        {publications.length === 0 ? (
          <p className="text-muted">Aucune publication pour le moment.</p>
        ) : (
          <ListePublications
            publications={publications}
            userId={user?.id ?? null}
            favoris={favoris}
            epingleId={epingleId}
          />
        )}
      </div>
    </div>
  );
}