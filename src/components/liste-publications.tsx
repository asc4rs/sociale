import { PublicationCarte } from "@/components/publication-carte";
import type { CommentaireAffiche } from "@/components/section-commentaires";
import type { OptionSondage } from "@/components/sondage";

type Auteur = { username: string; display_name: string; avatar_url: string | null };

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

export type Publication = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  kind: "texte" | "sondage" | "question";
  views_count: number;
  profiles: Auteur | Auteur[] | null;
  likes: { user_id: string }[] | null;
  reposts: { user_id: string }[] | null;
  comments: CommentaireBrut[] | null;
  poll_options: OptionBrute[] | null;
};

type Props = {
  publications: Publication[];
  userId: string | null;
  favoris: string[];
  epingleId?: string | null;
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

export function ListePublications({ publications, userId, favoris, epingleId = null }: Props) {
  return (
    <ul className="mt-4 flex flex-col gap-4">
      {publications.map((p) => {
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
              estMien: userId === c.author_id,
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
              choisie: !!userId && votes.some((v) => v.user_id === userId),
            };
          });

        return (
          <li key={p.id}>
            <PublicationCarte
              id={p.id}
              contenu={p.content}
              date={formaterDate(p.created_at)}
              auteurId={p.author_id}
              auteurNom={auteur?.display_name ?? "Compte inconnu"}
              auteurPseudo={auteur?.username ?? "inconnu"}
              avatarUrl={auteur?.avatar_url ?? null}
              estMienne={userId === p.author_id}
              connecte={!!userId}
              nombreLikes={likes.length}
              dejaLike={likes.some((l) => l.user_id === userId)}
              commentaires={commentaires}
              nombreReposts={reposts.length}
              dejaRepost={reposts.some((r) => r.user_id === userId)}
              dejaFavori={favoris.includes(p.id)}
              estEpinglee={epingleId === p.id}
              vues={p.views_count}
              kind={p.kind}
              options={options}
            />
          </li>
        );
      })}
    </ul>
  );
}
