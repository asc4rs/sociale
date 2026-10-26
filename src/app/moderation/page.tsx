import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ModerationLigne } from "@/components/moderation-ligne";

type Signalement = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  post_id: string | null;
  profile_id: string | null;
  reporter: { username: string } | { username: string }[] | null;
};

export default function ModerationPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuModeration />
    </Suspense>
  );
}

async function ContenuModeration() {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: moi } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  // Une personne non modératrice ne voit pas cette page.
  if (!moi?.is_admin) notFound();

  const { data } = await supabase
    .from("reports")
    .select("id, reason, status, created_at, post_id, profile_id, reporter:profiles!reports_reporter_id_fkey(username)")
    .eq("status", "ouvert")
    .order("created_at", { ascending: false })
    .limit(100);

  const signalements = (data ?? []) as unknown as Signalement[];

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Signalements</h1>

      {signalements.length === 0 ? (
        <p className="mt-6 text-muted">Aucun signalement en attente.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {signalements.map((s) => {
            const auteur = Array.isArray(s.reporter) ? s.reporter[0] : s.reporter;
            return (
              <li key={s.id}>
                <ModerationLigne
                  id={s.id}
                  raison={s.reason}
                  signalePar={auteur?.username ?? "inconnu"}
                  postId={s.post_id}
                  profileId={s.profile_id}
                  date={new Date(s.created_at).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}