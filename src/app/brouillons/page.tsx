import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BoutonsBrouillon } from "@/components/boutons-brouillon";

export default function BrouillonsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuBrouillons />
    </Suspense>
  );
}

async function ContenuBrouillons() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data } = await supabase
    .from("drafts")
    .select("id, content, kind, updated_at")
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false });

  const brouillons = data ?? [];

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Mes brouillons</h1>

      {brouillons.length === 0 ? (
        <p className="text-muted">Aucun brouillon pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {brouillons.map((b) => (
            <li key={b.id} className="rounded-2xl border border-border p-4">
              <p className="text-xs text-muted">
                {b.kind === "question" ? "Question" : "Publication"} ·{" "}
                {new Date(b.updated_at).toLocaleString("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words">{b.content}</p>
              <div className="mt-3">
                <BoutonsBrouillon id={b.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}