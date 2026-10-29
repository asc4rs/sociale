import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { InterrupteurProfil } from "@/components/interrupteur-profil";

export default function NotificationsParametres() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuNotifications />
    </Suspense>
  );
}

async function ContenuNotifications() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: moi } = await supabase
    .from("profiles")
    .select("notif_follow, notif_like, notif_comment, notif_repost, notif_message")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Notifications</h1>

      <section>
        <h2 className="text-lg font-semibold">Préférences</h2>
        <p className="mt-1 text-sm text-muted">Choisis ce que tu veux recevoir.</p>
        <div className="mt-3 flex flex-col gap-2">
          <InterrupteurProfil champ="notif_follow" libelle="Nouveaux abonnés" valeur={!!moi?.notif_follow} />
          <InterrupteurProfil champ="notif_like" libelle="J'aime" valeur={!!moi?.notif_like} />
          <InterrupteurProfil champ="notif_comment" libelle="Commentaires" valeur={!!moi?.notif_comment} />
          <InterrupteurProfil champ="notif_repost" libelle="Republications" valeur={!!moi?.notif_repost} />
          <InterrupteurProfil champ="notif_message" libelle="Messages" valeur={!!moi?.notif_message} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Filtres</h2>
        <p className="mt-2 text-sm text-muted">
          Dans la page Notifications, les catégories Toutes et Mentions te permettent de filtrer l&apos;affichage.
        </p>
      </section>
    </div>
  );
}