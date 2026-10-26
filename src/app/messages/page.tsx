import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NouveauMessage } from "@/components/nouveau-message";

type Auteur = { username: string; display_name: string };

type Conversation = { id: string; is_group: boolean; name: string | null; created_at: string };

type Ligne = { conversation_id: string; conversations: Conversation | Conversation[] | null };

type Membre = {
  conversation_id: string;
  user_id: string;
  profiles: Auteur | Auteur[] | null;
};

function unObjet<T>(valeur: T | T[] | null | undefined): T | null {
  if (!valeur) return null;
  return Array.isArray(valeur) ? (valeur[0] ?? null) : valeur;
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuMessages />
    </Suspense>
  );
}

async function ContenuMessages() {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: lignesData } = await supabase
    .from("conversation_members")
    .select("conversation_id, conversations(id, is_group, name, created_at)")
    .eq("user_id", user.id);

  const lignes = (lignesData ?? []) as unknown as Ligne[];
  const ids = lignes.map((l) => l.conversation_id);

  let membres: Membre[] = [];
  if (ids.length > 0) {
    const { data: membresData } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id, profiles(username, display_name)")
      .in("conversation_id", ids);
    membres = (membresData ?? []) as unknown as Membre[];
  }

  const conversations = lignes
    .map((l) => {
      const conv = unObjet(l.conversations);
      if (!conv) return null;

      const autres = membres
        .filter((m) => m.conversation_id === conv.id && m.user_id !== user.id)
        .map((m) => unObjet(m.profiles)?.display_name ?? "Inconnu");

      const titre = conv.is_group
        ? (conv.name ?? (autres.join(", ") || "Groupe"))
        : (autres[0] ?? "Conversation");

      return { id: conv.id, titre, groupe: conv.is_group, creee: conv.created_at };
    })
    .filter((c): c is { id: string; titre: string; groupe: boolean; creee: string } => c !== null)
    .sort((a, b) => b.creee.localeCompare(a.creee));

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Messages</h1>

      <div className="mt-6">
        <NouveauMessage />
      </div>

      <ul className="mt-8 flex flex-col gap-3">
        {conversations.length === 0 && (
          <p className="text-muted">Aucune conversation pour le moment.</p>
        )}

        {conversations.map((c) => (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className="block rounded-xl border border-border p-4 hover:bg-surface"
            >
              <span className="font-semibold">{c.titre}</span>
              {c.groupe && <span className="ml-2 text-xs text-muted">Groupe</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}