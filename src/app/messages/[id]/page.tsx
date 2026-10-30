import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ConversationVue, type MessageAffiche } from "@/components/conversation-vue";

type Auteur = { username: string; display_name: string };

type Membre = {
  user_id: string;
  last_read_at: string;
  profiles: Auteur | Auteur[] | null;
};

type MessageBrut = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  deleted: boolean;
  profiles: Auteur | Auteur[] | null;
};

function unObjet<T>(valeur: T | T[] | null | undefined): T | null {
  if (!valeur) return null;
  return Array.isArray(valeur) ? (valeur[0] ?? null) : valeur;
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuConversation params={params} />
    </Suspense>
  );
}

async function ContenuConversation({ params }: { params: Promise<{ id: string }> }) {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  // Seuls les membres peuvent ouvrir la conversation.
  const { data: moi } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!moi) notFound();

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, is_group, name")
    .eq("id", id)
    .maybeSingle();

  const { data: membresData } = await supabase
    .from("conversation_members")
    .select("user_id, last_read_at, profiles(username, display_name)")
    .eq("conversation_id", id);

  const membres = (membresData ?? []) as unknown as Membre[];
  const autres = membres
    .filter((m) => m.user_id !== user.id)
    .map((m) => unObjet(m.profiles)?.display_name ?? "Inconnu");

  const titre = conv?.is_group
    ? (conv.name ?? (autres.join(", ") || "Groupe"))
    : (autres[0] ?? "Conversation");

  const { data: messagesData } = await supabase
    .from("messages")
    .select("id, content, created_at, author_id, deleted, profiles!messages_author_id_fkey(username, display_name)")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(200);

  const bruts = (messagesData ?? []) as unknown as MessageBrut[];

  const messages: MessageAffiche[] = bruts.map((m) => {
    const auteur = unObjet(m.profiles);
    return {
      id: m.id,
      contenu: m.deleted ? "" : m.content,
      date: new Date(m.created_at).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
      auteurNom: auteur?.display_name ?? "Compte inconnu",
      auteurPseudo: auteur?.username ?? "inconnu",
      estMien: user.id === m.author_id,
      supprime: m.deleted,
    };
  });

  // Indicateur de lecture : seulement pour les conversations à deux.
  const mesMessages = bruts.filter((m) => m.author_id === user.id && !m.deleted);
  const dernierMoi = mesMessages.length > 0 ? mesMessages[mesMessages.length - 1] : null;

  const dernieresLectures = membres
    .filter((m) => m.user_id !== user.id)
    .map((m) => m.last_read_at)
    .filter((d): d is string => !!d);

  const derniereLecture = dernieresLectures.reduce<string | null>(
    (max, d) => (max === null || d > max ? d : max),
    null,
  );

  let statut: string | null = null;
  if (!conv?.is_group && dernierMoi) {
    if (derniereLecture && derniereLecture >= dernierMoi.created_at) {
      const heure = new Date(derniereLecture).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      });
      statut = `Vu · ${heure}`;
    } else {
      statut = "Envoyé";
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <Link href="/messages" className="text-sm text-muted hover:underline">
        ← Messages
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{titre}</h1>

      <div className="mt-6">
        <ConversationVue conversationId={id} messages={messages} />
      </div>

      {statut && (
        <p className="mt-3 text-right text-xs text-muted" aria-live="polite">
          {statut}
        </p>
      )}
    </div>
  );
}