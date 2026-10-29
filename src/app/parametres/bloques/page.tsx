import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DebloquerCompte } from "@/components/debloquer-compte";

type Bloque = {
  blocked_id: string;
  profiles: { username: string; display_name: string } | { username: string; display_name: string }[] | null;
};

export default async function BloquesParametres() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data } = await supabase
    .from("blocks")
    .select("blocked_id, profiles!blocks_blocked_id_fkey(username, display_name)")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  const bloques = (data ?? []) as unknown as Bloque[];

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Comptes bloqués</h1>

      {bloques.length === 0 ? (
        <p className="text-muted">Tu n&apos;as bloqué aucun compte.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bloques.map((b) => {
            const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
            return (
              <li
                key={b.blocked_id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{p?.display_name ?? "Compte inconnu"}</p>
                  <p className="text-sm text-muted">@{p?.username ?? "inconnu"}</p>
                </div>
                <DebloquerCompte bloqueId={b.blocked_id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}