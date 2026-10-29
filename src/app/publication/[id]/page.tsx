import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PublicationCarte } from "@/components/publication-carte";
import type { CommentaireAffiche } from "@/components/section-commentaires";
import type { OptionSondage } from "@/components/sondage";

type Auteur = { username: string; display_name: string };

type CommentaireBrut = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles: Auteur | Auteur[] | null;
};

type OptionBrute = {
  id: string;
  libelle: string;
  position: number;
  poll_votes: { user_id: string }[] | null;
};

type PublicationBrute = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  kind: "texte" | "sondage" | "question";
  publish_at: string;
  views_count: number;
  profiles: Auteur | Auteur[] | null;
  likes: { user_id: string }[] | null;
  reposts: { user_id: string }[] | null;
  comments: CommentaireBrut[] | null;
  poll_options: OptionBrute[] | null;
};

function unObjet<T>(valeur: T | T[] | null | undefined): T | null {
  if (!valeur) return null;
  return Array.isArray(valeur) ? (valeur[0] ?? null) : valeur;
}

function formaterDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function PublicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ commentaire?: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuPublication params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ContenuPublication({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ commentaire?: string }>;
}) {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const { id } = await params;
  const { commentaire } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("posts")
    .select(
      "id, content, created_at, author_id, kind, publish_at, views_count, profiles!posts_author_id_fkey(username, display_name), likes(user_id), reposts(user_id), comments(id, content, created_at, author_id, profiles!comments_author_id_fkey(username, display_name)), poll_options(id, libelle, position, poll_votes(user_id))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const p = data as unknown as PublicationBrute;
  const auteur = unObjet(p.profiles);
  const likes = p.likes ?? [];
  const reposts = p.reposts ?? [];

  const commentaires: CommentaireAffiche[] = [...(p.comments ?? [])]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((c) => {
      const auteurCommentaire = unObjet(c.profiles);
      return {
        id: c.id,
        contenu: c.content,
        date: formaterDate(c.created_at),
        auteurNom: auteurCommentaire?.display_name ?? "Compte inconnu",
        auteurPseudo: auteurCommentaire?.username ?? "inconnu",
        estMien: user?.id === c.author_id,
      };
    });

  const options: OptionSondage[] = [...(p.poll_options ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((o) => {
      const votes = o.poll_votes ?? [];
      return {
        id: o.id,
        libelle: o.libelle,
        votes: votes.length,
        choisie: !!user && votes.some((v) => v.user_id === user.id),
      };
    });

  // Seul l'auteur voit qu'une publication est encore programmée.
  const estMienne = user?.id === p.author_id;
  const programmeePour =
    estMienne && new Date(p.publish_at) > new Date() ? formaterDate(p.publish_at) : null;

  let favori = false;
  let epingle = false;
  if (user) {
    const { data: fav } = await supabase
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", user.id)
      .eq("post_id", id)
      .maybeSingle();
    favori = !!fav;

    const { data: moi } = await supabase
      .from("profiles")
      .select("pinned_post_id")
      .eq("id", user.id)
      .maybeSingle();
    epingle = moi?.pinned_post_id === id;
  }

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <Link href="/" className="text-sm text-muted hover:underline">
        ← Accueil
      </Link>

      <div className="mt-4">
        <PublicationCarte
          id={p.id}
          contenu={p.content}
          date={formaterDate(p.created_at)}
          auteurId={p.author_id}
          auteurNom={auteur?.display_name ?? "Compte inconnu"}
          auteurPseudo={auteur?.username ?? "inconnu"}
          estMienne={estMienne}
          connecte={!!user}
          nombreLikes={likes.length}
          dejaLike={likes.some((l) => l.user_id === user?.id)}
          commentaires={commentaires}
          nombreReposts={reposts.length}
          dejaRepost={reposts.some((r) => r.user_id === user?.id)}
          dejaFavori={favori}
          estEpinglee={epingle}
          vues={p.views_count}
          kind={p.kind}
          options={options}
          programmeePour={programmeePour}
          commentaireCible={commentaire ?? null}
        />
      </div>
    </div>
  );
}