import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BoutonToutLire } from "@/components/bouton-tout-lire";

type Acteur = { username: string; display_name: string };

type Notification = {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  actor: Acteur | Acteur[] | null;
};

const TEXTES: Record<string, string> = {
  follow: "a commencé à te suivre",
  follow_request: "t'a envoyé une demande d'abonnement",
  like: "a aimé ta publication",
  comment: "a commenté ta publication",
  repost: "a republié ta publication",
  mention: "t'a mentionné",
  message: "t'a envoyé un message",
};

function lienPour(type: string, pseudo: string) {
  if (type === "follow") return `/u/${pseudo}`;
  if (type === "follow_request") return "/demandes";
  if (type === "message") return "/messages";
  return "/";
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuNotifications />
    </Suspense>
  );
}

async function ContenuNotifications() {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data } = await supabase
    .from("notifications")
    .select("id, type, read, created_at, actor:profiles!notifications_actor_id_fkey(username, display_name)")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (data ?? []) as unknown as Notification[];

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <BoutonToutLire />
      </div>

      {notifications.length === 0 ? (
        <p className="mt-6 text-muted">Aucune notification pour le moment.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {notifications.map((n) => {
            const acteur = Array.isArray(n.actor) ? n.actor[0] : n.actor;
            const pseudo = acteur?.username ?? "";
            const date = new Date(n.created_at).toLocaleString("fr-FR", {
              dateStyle: "short",
              timeStyle: "short",
            });

            return (
              <li key={n.id}>
                <Link
                  href={lienPour(n.type, pseudo)}
                  className={`block rounded-xl border border-border p-4 hover:bg-surface ${
                    n.read ? "" : "font-semibold"
                  }`}
                >
                  <p className="text-sm">
                    <span className="font-semibold">{acteur?.display_name ?? "Quelqu'un"}</span>{" "}
                    {TEXTES[n.type] ?? "t'a envoyé une notification"}
                  </p>
                  <p className="mt-1 text-xs text-muted">{date}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}