import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PanneauAdmin } from "@/components/panneau-admin";

type Auteur = { username: string };

function unObjet<T>(valeur: T | T[] | null | undefined): T | null {
  if (!valeur) return null;
  return Array.isArray(valeur) ? (valeur[0] ?? null) : valeur;
}

function formater(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdministrationPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuAdministration />
    </Suspense>
  );
}

async function ContenuAdministration() {
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

  // Une personne non administratrice ne voit pas cette page.
  if (!moi?.is_admin) notFound();

  const { data: utilisateursData } = await supabase
    .from("profiles")
    .select("id, username, display_name, is_admin, is_banned, ban_reason, warnings_count")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: postsData } = await supabase
    .from("posts")
    .select("id, content, created_at, profiles!posts_author_id_fkey(username)")
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: journalData } = await supabase
    .from("moderation_log")
    .select(
      "id, action, detail, created_at, admin:profiles!moderation_log_admin_id_fkey(username), cible:profiles!moderation_log_cible_user_id_fkey(username)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const utilisateurs = (utilisateursData ?? []).map((u) => ({
    id: u.id,
    username: u.username,
    display_name: u.display_name,
    is_admin: u.is_admin,
    is_banned: u.is_banned,
    ban_reason: u.ban_reason,
    warnings_count: u.warnings_count,
  }));

  const publications = (
    (postsData ?? []) as unknown as {
      id: string;
      content: string;
      created_at: string;
      profiles: Auteur | Auteur[] | null;
    }[]
  ).map((p) => ({
    id: p.id,
    content: p.content,
    auteur: unObjet(p.profiles)?.username ?? "inconnu",
    date: formater(p.created_at),
  }));

  const journal = (
    (journalData ?? []) as unknown as {
      id: string;
      action: string;
      detail: string | null;
      created_at: string;
      admin: Auteur | Auteur[] | null;
      cible: Auteur | Auteur[] | null;
    }[]
  ).map((e) => ({
    id: e.id,
    action: e.action,
    detail: e.detail,
    admin: unObjet(e.admin)?.username ?? "inconnu",
    cible: unObjet(e.cible)?.username ?? "—",
    date: formater(e.created_at),
  }));

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Administration</h1>
      <PanneauAdmin utilisateurs={utilisateurs} publications={publications} journal={journal} />
    </div>
  );
}