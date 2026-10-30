import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";

type Props = {
  // Le profil affiché : on suggère les comptes qu'il suit.
  userId: string;
  // Le visiteur connecté, exclu des suggestions.
  exclureId?: string | null;
};

// Comptes suivis par les abonnements de ce profil, que le visiteur ne suit pas encore.
export async function SuggestionsAbonnements({ userId, exclureId = null }: Props) {
  const supabase = await createClient();

  const { data: mesSuivis } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId)
    .eq("status", "accepted");
  const suivis = (mesSuivis ?? []).map((f) => f.following_id);
  if (suivis.length === 0) return null;

  const { data: liens } = await supabase
    .from("follows")
    .select("following_id")
    .in("follower_id", suivis)
    .eq("status", "accepted")
    .limit(500);

  const exclus = new Set([userId, ...suivis, ...(exclureId ? [exclureId] : [])]);
  const compte = new Map<string, number>();
  for (const l of liens ?? []) {
    if (exclus.has(l.following_id)) continue;
    compte.set(l.following_id, (compte.get(l.following_id) ?? 0) + 1);
  }

  const top = [...compte.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  if (top.length === 0) return null;

  const { data: profils } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", top.map(([id]) => id));

  const parId = new Map((profils ?? []).map((p) => [p.id, p]));

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Suggestions</h2>
      <p className="mt-1 text-sm text-muted">Suivis par les comptes que suit ce profil.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {top.map(([id, nombre]) => {
          const p = parId.get(id);
          if (!p) return null;
          return (
            <li key={id}>
              <Link
                href={`/u/${p.username}`}
                className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface"
              >
                <Avatar url={p.avatar_url} nom={p.display_name} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{p.display_name}</span>
                  <span className="block text-sm text-muted">
                    @{p.username} · suivi par {nombre} de ces abonnements
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}