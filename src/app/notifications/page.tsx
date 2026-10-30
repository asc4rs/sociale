import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  AtSign,
  Bell,
  Bookmark,
  Heart,
  Mail,
  MessageCircle,
  Repeat2,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { BoutonToutLire } from "@/components/bouton-tout-lire";
import { NotificationLigne } from "@/components/notification-ligne";

type Acteur = { username: string; display_name: string; avatar_url: string | null };

type Notification = {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  post_id: string | null;
  comment_id: string | null;
  detail: string | null;
  actor: Acteur | Acteur[] | null;
};

type Props = {
  searchParams: Promise<{ onglet?: string }>;
};

const ICONES: Record<string, LucideIcon> = {
  like: Heart,
  repost: Repeat2,
  favorite: Bookmark,
  follow: UserPlus,
  follow_request: UserCheck,
  comment: MessageCircle,
  mention: AtSign,
  message: Mail,
  warning: Bell,
};

const TEXTES: Record<string, string> = {
  follow: "a commencé à te suivre",
  follow_request: "t'a envoyé une demande d'abonnement",
  like: "a aimé ta publication",
  comment: "a commenté ta publication",
  repost: "a republié ta publication",
  favorite: "a ajouté ta publication à ses favoris",
  mention: "t'a mentionné",
  message: "t'a envoyé un message",
  warning: "t'a envoyé un avertissement de modération",
};

function lienPour(n: Notification, pseudo: string) {
  if (n.type === "follow") return `/u/${pseudo}`;
  if (n.type === "follow_request") return "/demandes";
  if (n.type === "message") return "/messages";
  if (n.type === "warning") return "/notifications";
  if (n.post_id) {
    const base = `/publication/${n.post_id}`;
    return n.comment_id ? `${base}?commentaire=${n.comment_id}` : base;
  }
  return "/";
}

export default function NotificationsPage(props: Props) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuNotifications searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ContenuNotifications({ searchParams }: Props) {
  await connection();

  const { onglet } = await searchParams;
  const seulesMentions = onglet === "mentions";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const base = supabase
    .from("notifications")
    .select(
      "id, type, read, created_at, post_id, comment_id, detail, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url)",
    )
    .eq("recipient_id", user.id);

  const { data } = await (seulesMentions ? base.eq("type", "mention") : base)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (data ?? []) as unknown as Notification[];

  const classeOnglet = (actif: boolean) =>
    `rounded-xl px-4 py-2 text-sm font-semibold ${
      actif ? "bg-accent text-accent-foreground" : "border border-border hover:bg-surface"
    }`;

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <BoutonToutLire />
      </div>

      <nav aria-label="Catégories" className="mt-6 flex gap-2">
        <Link href="/notifications" className={classeOnglet(!seulesMentions)}>
          Toutes
        </Link>
        <Link href="/notifications?onglet=mentions" className={classeOnglet(seulesMentions)}>
          Mentions
        </Link>
      </nav>

      {notifications.length === 0 ? (
        <p className="mt-6 text-muted">Aucune notification pour le moment.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {notifications.map((n) => {
            const acteur = Array.isArray(n.actor) ? n.actor[0] : n.actor;
            const pseudo = acteur?.username ?? "";
            const nom = acteur?.display_name ?? "Quelqu'un";
            const Icone = ICONES[n.type] ?? Bell;
            const date = new Date(n.created_at).toLocaleString("fr-FR", {
              dateStyle: "short",
              timeStyle: "short",
            });

            return (
              <li key={n.id}>
                <NotificationLigne
                  id={n.id}
                  href={lienPour(n, pseudo)}
                  estLue={n.read}
                  className={`flex gap-3 rounded-xl border border-border p-4 hover:bg-surface ${
                    n.read ? "" : "font-semibold"
                  }`}
                >
                  <Avatar url={acteur?.avatar_url} nom={nom} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm">
                      <Icone size={16} aria-hidden="true" className="shrink-0 text-muted" />
                      <span>
                        <span className="font-semibold">{nom}</span>{" "}
                        {TEXTES[n.type] ?? "t'a envoyé une notification"}
                      </span>
                    </p>
                    {n.detail && <p className="mt-2 whitespace-pre-wrap text-sm">{n.detail}</p>}
                    <p className="mt-1 text-xs text-muted">{date}</p>
                  </div>
                </NotificationLigne>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}