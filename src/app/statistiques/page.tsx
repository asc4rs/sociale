import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Publication = {
  id: string;
  content: string;
  views_count: number;
  likes: { user_id: string }[] | null;
  reposts: { user_id: string }[] | null;
};

export default function StatistiquesPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuStatistiques />
    </Suspense>
  );
}

function Carte({ libelle, valeur }: { libelle: string; valeur: number }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-2xl font-bold">{valeur}</p>
      <p className="text-sm text-muted">{libelle}</p>
    </div>
  );
}

async function ContenuStatistiques() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data } = await supabase
    .from("posts")
    .select("id, content, views_count, likes(user_id), reposts(user_id)")
    .eq("author_id", user.id)
    .lte("publish_at", new Date().toISOString());

  const publications = (data ?? []) as unknown as Publication[];

  const { count: abonnes } = await supabase
    .from("follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("following_id", user.id)
    .eq("status", "accepted");

  const { count: abonnements } = await supabase
    .from("follows")
    .select("following_id", { count: "exact", head: true })
    .eq("follower_id", user.id)
    .eq("status", "accepted");

  const totalVues = publications.reduce((s, p) => s + p.views_count, 0);
  const totalLikes = publications.reduce((s, p) => s + (p.likes?.length ?? 0), 0);
  const totalReposts = publications.reduce((s, p) => s + (p.reposts?.length ?? 0), 0);
  const moyenne = publications.length > 0 ? Math.round(totalVues / publications.length) : 0;

  const top = [...publications].sort((a, b) => b.views_count - a.views_count).slice(0, 5);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Statistiques</h1>

      <div className="grid grid-cols-2 gap-3">
        <Carte libelle="Publications" valeur={publications.length} />
        <Carte libelle="Vues au total" valeur={totalVues} />
        <Carte libelle="J'aime reçus" valeur={totalLikes} />
        <Carte libelle="Republications" valeur={totalReposts} />
        <Carte libelle="Abonnés" valeur={abonnes ?? 0} />
        <Carte libelle="Abonnements" valeur={abonnements ?? 0} />
        <Carte libelle="Vues moyennes par publication" valeur={moyenne} />
      </div>

      <section>
        <h2 className="text-lg font-semibold">Tes publications les plus vues</h2>
        {top.length === 0 ? (
          <p className="mt-3 text-muted">Aucune publication pour le moment.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {top.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/publication/${p.id}`}
                  className="block rounded-xl border border-border p-3 hover:bg-surface"
                >
                  <p className="line-clamp-2 break-words text-sm">{p.content}</p>
                  <p className="mt-1 text-xs text-muted">
                    {p.views_count} {p.views_count > 1 ? "vues" : "vue"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}