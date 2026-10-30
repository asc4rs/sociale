import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { FormulaireCitation } from "@/components/formulaire-citation";

type Auteur = { username: string; display_name: string; avatar_url: string | null };

export default function CiterPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuCiter params={params} />
    </Suspense>
  );
}

async function ContenuCiter({ params }: { params: Promise<{ id: string }> }) {
  await connection();

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data } = await supabase
    .from("posts")
    .select("id, content, profiles!posts_author_id_fkey(username, display_name, avatar_url)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const auteur = (Array.isArray(data.profiles) ? data.profiles[0] : data.profiles) as Auteur | null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-6 md:p-8">
      <Link href="/" className="text-sm text-muted hover:underline">
        ← Accueil
      </Link>

      <h1 className="text-2xl font-bold">Citer une publication</h1>

      <div className="rounded-xl border border-border p-4">
        <p className="flex items-center gap-2 text-sm">
          <Avatar url={auteur?.avatar_url} nom={auteur?.display_name ?? "?"} />
          <span className="font-semibold">{auteur?.display_name ?? "Compte inconnu"}</span>
          <span className="text-muted">@{auteur?.username ?? "inconnu"}</span>
        </p>
        <p className="mt-2 whitespace-pre-wrap break-words">{data.content}</p>
      </div>

      <FormulaireCitation citeId={id} />
    </div>
  );
}