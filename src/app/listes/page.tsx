import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreerListe } from "@/components/creer-liste";

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

export default function ListesPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuListes />
    </Suspense>
  );
}

async function ContenuListes() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: mesData } = await supabase
    .from("lists")
    .select("id, name, is_public, owner_id, profiles!lists_owner_id_fkey(username, display_name)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: autresData } = await supabase
    .from("lists")
    .select("id, name, is_public, owner_id, profiles!lists_owner_id_fkey(username, display_name)")
    .eq("is_public", true)
    .neq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const mes = (mesData ?? []) as unknown as LigneListe[];
  const autres = (autresData ?? []) as unknown as LigneListe[];

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Listes</h1>

      <CreerListe />

      <section>
        <h2 className="text-lg font-semibold">Mes listes</h2>
        {mes.length === 0 ? (
          <p className="mt-3 text-muted">Tu n&apos;as encore aucune liste.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {mes.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/listes/${l.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 hover:bg-surface"
                >
                  <span className="truncate font-semibold">{l.name}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {l.is_public ? "Publique" : "Privée"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {autres.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Listes publiques</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {autres.map((l) => {
              const proprio = unObjet(l.profiles);
              return (
                <li key={l.id}>
                  <Link
                    href={`/listes/${l.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 hover:bg-surface"
                  >
                    <span className="truncate font-semibold">{l.name}</span>
                    <span className="shrink-0 truncate text-xs text-muted">
                      @{proprio?.username ?? "inconnu"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}