import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GererListe } from "@/components/gerer-liste";
import { ListePublications, type Publication } from "@/components/liste-publications";

const SELECT_POST =
  "id, content, created_at, author_id, kind, views_count, profiles!posts_author_id_fkey(username, display_name, avatar_url), likes(user_id), reposts(user_id), comments(id, content, created_at, author_id, profiles!comments_author_id_fkey(username, display_name)), poll_options(id, libelle, position, poll_votes(user_id))";

type Proprio = { username: string; display_name: string };

type LigneListe = {
  id: string;
  name: string;
  is_public: boolean;
  owner_id: string;
  profiles: Proprio | Proprio[] | null;
};

function unObjet<T>(valeur: T | T[] | null | undefined): T | null {
  if (!valeur) return null;
  return Array.isArray(valeur) ? (valeur[0] ?? null) : valeur;
}

export default function ListePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuListe params={params} />
    </Suspense>
  );
}

async function ContenuListe({ params }: { params: Promise<{ id: string }> }) {
  await connection();

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: listeData } = await supabase
    .from("lists")
    .select("id, name, is_public, owner_id, profiles!lists_owner_id_fkey(username, display_name)")
    .eq("id", id)
    .maybeSingle();

  if (!listeData) notFound();

  const liste = listeData as unknown as LigneListe;
  const proprio = unObjet(liste.profiles);
  const estProprio = liste.owner_id === user.id;

  const { data: membresData } = await supabase
    .from("list_members")
    .select("user_id")
    .eq("list_id", id);

  const membresIds = (membresData ?? []).map((m) => m.user_id);

  let publications: Publication[] = [];
  if (membresIds.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select(SELECT_POST)
      .in("author_id", membresIds)
      .lte("publish_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(50);
    publications = (data ?? []) as unknown as Publication[];
  }

  const { data: fav } = await supabase
    .from("bookmarks")
    .select("post_id")
    .eq("user_id", user.id);
  const favoris = (fav ?? []).map((f) => f.post_id);

  let suivis: { id: string; nom: string; avatar: string | null }[] = [];
  if (estProprio) {
    const { data: liens } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .eq("status", "accepted")
      .limit(300);

    const ids = (liens ?? []).map((l) => l.following_id);
    if (ids.length > 0) {
      const { data: profils } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids)
        .order("display_name", { ascending: true });
      suivis = (profils ?? []).map((p) => ({
        id: p.id,
        nom: p.display_name,
        avatar: p.avatar_url,
      }));
    }
  }

  const nombre = membresIds.length;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold">{liste.name}</h1>
        <p className="mt-1 text-sm text-muted">
          Par @{proprio?.username ?? "inconnu"} · {liste.is_public ? "Publique" : "Privée"} · {nombre}{" "}
          {nombre > 1 ? "membres" : "membre"}
        </p>
      </div>

      {estProprio && (
        <GererListe
          listeId={id}
          publique={liste.is_public}
          membresIds={membresIds}
          suivis={suivis}
        />
      )}

      {nombre === 0 ? (
        <p className="text-muted">
          Cette liste est vide.{estProprio ? " Ajoute des comptes ci-dessus." : ""}
        </p>
      ) : publications.length === 0 ? (
        <p className="text-muted">Aucune publication pour le moment.</p>
      ) : (
        <ListePublications
          publications={publications}
          userId={user.id}
          favoris={favoris}
        />
      )}
    </div>
  );
}