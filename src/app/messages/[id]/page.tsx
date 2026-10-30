import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ConversationVue, type MessageAffiche } from "@/components/conversation-vue";
import { EnteteConversation } from "@/components/entete-conversation";
import { MarquerConversationLue } from "@/components/marquer-conversation-lue";

type Profil = { username: string; display_name: string; avatar_url: string | null; created_at: string };

type Membre = {
  user_id: string;
  last_read_at: string;
  profiles: Profil | Profil[] | null;
};

type MessageBrut = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  media_url: string | null;
  media_kind: "image" | "video" | "fichier" | null;
  profiles: Profil | Profil[] | null;
};

function unObjet<T>(valeur: T | T[] | null | undefined): T | null {
  if (!valeur) return null;
  return Array.isArray(valeur) ? (valeur[0] ?? null) : valeur;
}

function formaterDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function moisAnnee(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuConversation params={params} />
    </Suspense>
  );
}

async function ContenuConversation({ params }: { params: Promise<{ id: string }> }) {
  await connection();

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: moi } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!moi) notFound();

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, is_group, name, ephemeral_hours")
    .eq("id", id)
    .maybeSingle();

  const { data: membresData } = await supabase
    .from("conversation_members")
    .select("user_id, last_read_at, profiles(username, display_name, avatar_url, created_at)")
    .eq("conversation_id", id);

  const membres = (membresData ?? []) as unknown as Membre[];
  const estGroupe = !!conv?.is_group;

  const profilsAutres = membres
    .filter((m) => m.user_id !== user.id)
    .flatMap((m) => {
      const p = unObjet(m.profiles);
      return p ? [{ id: m.user_id, profil: p, lecture: m.last_read_at }] : [];
    });

  const noms = profilsAutres.map((a) => a.profil.display_name);
  const titre = estGroupe
    ? (conv?.name ?? (noms.join(", ") || "Groupe"))
    : (noms[0] ?? "Conversation");

  const principal = !estGroupe ? profilsAutres[0] : undefined;
  let abonnes = 0;
  let abonnements = 0;
  if (principal) {
    const [resAbonnes, resAbonnements] = await Promise.all([
      supabase
        .from("follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("following_id", principal.id)
        .eq("status", "accepted"),
      supabase
        .from("follows")
        .select("following_id", { count: "exact", head: true })
        .eq("follower_id", principal.id)
        .eq("status", "accepted"),
    ]);
    abonnes = resAbonnes.count ?? 0;
    abonnements = resAbonnements.count ?? 0;
  }

  const cutoff = conv?.ephemeral_hours
    ? new Date(Date.now() - conv.ephemeral_hours * 3600 * 1000).toISOString()
    : "1970-01-01T00:00:00.000Z";

  const { data: messagesData } = await supabase
    .from("messages")
    .select(
      "id, content, created_at, author_id, media_url, media_kind, profiles!messages_author_id_fkey(username, display_name, avatar_url, created_at)",
    )
    .eq("conversation_id", id)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(200);

  const bruts = (messagesData ?? []) as unknown as MessageBrut[];

  const messages: MessageAffiche[] = bruts.map((m) => {
    const auteur = unObjet(m.profiles);
    return {
      id: m.id,
      contenu: m.content,
      date: formaterDate(m.created_at),
      auteurNom: auteur?.display_name ?? "Compte inconnu",
      auteurPseudo: auteur?.username ?? "inconnu",
      estMien: user.id === m.author_id,
      mediaUrl: m.media_url,
      mediaKind: m.media_kind,
    };
  });

  // Indicateur « Vu / Envoyé » : seulement pour les conversations à deux.
  let statut: string | null = null;
  const mesMessages = bruts.filter((m) => m.author_id === user.id);
  const dernierMoi = mesMessages.length > 0 ? mesMessages[mesMessages.length - 1] : null;

  if (!estGroupe && dernierMoi) {
    const derniereLecture = profilsAutres
      .map((a) => a.lecture)
      .reduce<string | null>((max, d) => (max === null || d > max ? d : max), null);

    if (derniereLecture && derniereLecture >= dernierMoi.created_at) {
      statut = `Vu · ${formaterDate(derniereLecture)}`;
    } else {
      statut = "Envoyé";
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-background md:left-64 md:top-0">
      <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
        <EnteteConversation
          conversationId={id}
          titre={titre}
          estGroupe={estGroupe}
          nombreMembres={membres.length}
          disparition={conv?.ephemeral_hours ?? null}
          autre={
            principal
              ? {
                  id: principal.id,
                  username: principal.profil.username,
                  nom: principal.profil.display_name,
                  avatarUrl: principal.profil.avatar_url,
                  rejointLe: moisAnnee(principal.profil.created_at),
                  abonnes,
                  abonnements,
                }
              : null
          }
        />

        <ConversationVue
          conversationId={id}
          moiId={user.id}
          messages={messages}
          statut={statut}
        />
      </div>

      <MarquerConversationLue conversationId={id} />
    </div>
  );
}