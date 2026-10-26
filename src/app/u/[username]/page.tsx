import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export default function ProfilPublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement du profil...</p>}>
      <ContenuProfil params={params} />
    </Suspense>
  );
}

async function ContenuProfil({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, created_at, is_private")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) notFound();

  const estMonProfil = user?.id === profile.id;

  const inscrit = new Date(profile.created_at).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface text-3xl font-bold">
        {profile.display_name.charAt(0).toUpperCase()}
      </div>

      <h1 className="mt-4 text-2xl font-bold">{profile.display_name}</h1>
      <p className="text-muted">@{profile.username}</p>

      {profile.bio && <p className="mt-4">{profile.bio}</p>}

      <p className="mt-4 text-sm text-muted">Inscrit en {inscrit}</p>

      {estMonProfil && (
        <Link
          href="/profil/modifier"
          className="mt-6 inline-block rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"
        >
          Modifier mon profil
        </Link>
      )}

      {profile.is_private && !estMonProfil && (
        <p className="mt-6 rounded-xl border border-border p-4 text-sm">
          Ce compte est privé. Envoie une demande d&apos;abonnement pour voir ses publications.
        </p>
      )}
    </div>
  );
}