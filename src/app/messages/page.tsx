import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { NouveauMessagePopup } from "@/components/nouveau-message-popup";

type Profil = { username: string; display_name: string; avatar_url: string | null };
type Conversation = { id: string; is_group: boolean; name: string | null; created_at: string };
type Ligne = {
  conversation_id: string;
  last_read_at: string;
  conversations: Conversation | Conversation[] | null;
};
type Membre = { conversation_id: string; user_id: string; profiles: Profil | Profil[] | null };
type MessageRecent = { conversation_id: string; created_at: string; author_id: string };
type Suggestion = { id: string; username: string; display_name: string; avatar_url: string | null };
type Compte = { id: string; username: string; display_name: string; avatar_url: string | null };

type Props = {
  searchParams: Promise<{ filtre?: string; q?: string }>;
};

function unObjet<T>(valeur: T | T[] | null | undefined): T | null {
  if (!valeur) return null;
  return Array.isArray(valeur) ? (valeur[0] ?? null) : valeur;
}

export default function MessagesPage(props: Props) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuMessages searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ContenuMessages({ searchParams }: Props) {
  await connection();

  const { filtre: filtreBrut, q: qBrut } = await searchParams;
  const filtre =
    filtreBrut === "non-lus" || filtreBrut === "groupes" ? filtreBrut : "tout";
  const q = (qBrut ?? "").trim().slice(0, 50);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: lignesData } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at, conversations(id, is_group, name, created_at)")
    .eq("user_id", user.id);

  const lignes = (lignesData ?? []) as unknown as Ligne[];
  const ids = lignes.map((l) => l.conversation_id);

  let membres: Membre[] = [];
  let recents: MessageRecent[] = [];

  if (ids.length > 0) {
    const [resMembres, resMessages] = await Promise.all([
      supabase
        .from("conversation_members")
        .select("conversation_id, user_id, profiles(username, display_name, avatar_url)")
        .in("conversation_id", ids),
      supabase
        .from("messages")
        .select("conversation_id, created_at, author_id")
        .in("conversation_id", ids)
        .eq("deleted", false)
        .order("created_at", { ascending: false })
        .limit(2000),
    ]);
    membres = (resMembres.data ?? []) as unknown as Membre[];
    recents = (resMessages.data ?? []) as MessageRecent[];
  }

  const dernier = new Map<string, MessageRecent>();
  for (const msg of recents) {
    if (!dernier.has(msg.conversation_id)) dernier.set(msg.conversation_id, msg);
  }

  const groupes = new Set(
    lignes
      .filter((l) => unObjet(l.conversations)?.is_group)
      .map((l) => l.conversation_id),
  );

  const toutes = lignes
    .map((l) => {
      const conv = unObjet(l.conversations);
      if (!conv) return null;

      const autres = membres
        .filter((m) => m.conversation_id === conv.id && m.user_id !== user.id)
        .map((m) => unObjet(m.profiles)?.display_name ?? "Inconnu");

      const titre = conv.is_group
        ? (conv.name ?? (autres.join(", ") || "Groupe"))
        : (autres[0] ?? "Conversation");

      const last = dernier.get(conv.id);
      const nonLu =
        !!last &&
        last.author_id !== user.id &&
        new Date(last.created_at) > new Date(l.last_read_at);

      return {
        id: conv.id,
        titre,
        groupe: conv.is_group,
        nonLu,
        activite: last?.created_at ?? conv.created_at,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => b.activite.localeCompare(a.activite));

  const nbNonLus = toutes.filter((c) => c.nonLu).length;

  const visibles = toutes.filter(
    (c) =>
      (filtre !== "non-lus" || c.nonLu) &&
      (filtre !== "groupes" || c.groupe) &&
      (q === "" || c.titre.toLowerCase().includes(q.toLowerCase())),
  );

  // Comptes que je suis : liste de la fenêtre « Nouveau message ».
  const { data: suivisData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)
    .eq("status", "accepted")
    .limit(300);

  const idsSuivis = (suivisData ?? []).map((f) => f.following_id);

  let comptes: Compte[] = [];
  if (idsSuivis.length > 0) {
    const { data: profilsSuivis } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", idsSuivis)
      .order("display_name", { ascending: true });
    comptes = (profilsSuivis ?? []) as Compte[];
  }

  // Suggestions : comptes que je suis, avec qui je n'ai pas encore de conversation privée.
  const dejaEcrit = new Set(
    membres
      .filter((m) => m.user_id !== user.id && !groupes.has(m.conversation_id))
      .map((m) => m.user_id),
  );

  const aSuggerer = idsSuivis
    .filter((id) => id !== user.id && !dejaEcrit.has(id))
    .slice(0, 10);

  let suggestions: Suggestion[] = [];
  if (aSuggerer.length > 0) {
    const { data: profilsData } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", aSuggerer);
    suggestions = (profilsData ?? []) as Suggestion[];
  }

  const suffixeQ = q ? `&q=${encodeURIComponent(q)}` : "";
  const classeOnglet = (actif: boolean) =>
    `rounded-xl px-3 py-1.5 text-sm font-semibold ${
      actif ? "bg-accent text-accent-foreground" : "border border-border hover:bg-surface"
    }`;

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Messages</h1>
        <NouveauMessagePopup comptes={comptes} />
      </div>

      {suggestions.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-muted">Suggestions</h2>
          <p className="mt-1 text-xs text-muted">
            Comptes que tu suis avec qui tu n&apos;as pas encore de conversation.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {suggestions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar url={s.avatar_url} nom={s.display_name} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{s.display_name}</span>
                    <span className="block truncate text-xs text-muted">@{s.username}</span>
                  </span>
                </span>
                <Link
                  href={`/nouvelle-conversation?cible=${s.id}`}
                  className="shrink-0 rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground"
                >
                  Écrire
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action="/messages" method="get" className="mt-8 flex gap-2">
        <input type="hidden" name="filtre" value={filtre} />
        <div className="relative w-full">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher une conversation"
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
      </form>

      <nav aria-label="Filtres" className="mt-4 flex flex-wrap gap-2">
        <Link href={`/messages?filtre=tout${suffixeQ}`} className={classeOnglet(filtre === "tout")}>
          Tout
        </Link>
        <Link href={`/messages?filtre=non-lus${suffixeQ}`} className={classeOnglet(filtre === "non-lus")}>
          Non lus{nbNonLus > 0 ? ` (${nbNonLus})` : ""}
        </Link>
        <Link href={`/messages?filtre=groupes${suffixeQ}`} className={classeOnglet(filtre === "groupes")}>
          Groupes
        </Link>
      </nav>

      <ul className="mt-6 flex flex-col gap-3">
        {visibles.length === 0 && (
          <li className="text-muted">Aucune conversation ne correspond.</li>
        )}

        {visibles.map((c) => (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 hover:bg-surface"
            >
              <span className={`min-w-0 truncate ${c.nonLu ? "font-bold" : ""}`}>
                {c.titre}
                {c.groupe && <span className="ml-2 text-xs text-muted">Groupe</span>}
              </span>
              {c.nonLu && (
                <span aria-label="Non lu" className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-600" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}