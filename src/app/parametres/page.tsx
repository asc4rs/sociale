import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FormulaireParametres } from "@/components/formulaire-parametres";
import { SectionCompte } from "@/components/section-compte";

export default function ParametresPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuParametres />
    </Suspense>
  );
}

async function ContenuParametres() {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: moi } = await supabase
    .from("profiles")
    .select("is_private, is_admin, notif_follow, notif_like, notif_comment, notif_repost, notif_message")
    .eq("id", user.id)
    .single();

  const { data: blocages } = await supabase
    .from("blocks")
    .select("blocked_id, profiles!blocks_blocked_id_fkey(username, display_name)")
    .eq("blocker_id", user.id);

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Paramètres</h1>

      <FormulaireParametres
        estPrive={moi?.is_private ?? false}
        preferences={{
          notif_follow: moi?.notif_follow ?? true,
          notif_like: moi?.notif_like ?? true,
          notif_comment: moi?.notif_comment ?? true,
          notif_repost: moi?.notif_repost ?? true,
          notif_message: moi?.notif_message ?? true,
        }}
        bloques={(blocages ?? []).map((b) => {
          const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
          return {
            id: b.blocked_id,
            username: p?.username ?? "inconnu",
            display_name: p?.display_name ?? "Compte inconnu",
          };
        })}
      />

      <SectionCompte estAdmin={moi?.is_admin ?? false} />
    </div>
  );
}