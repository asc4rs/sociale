import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

// /profil redirige vers ton propre profil public.
export default function MonProfilPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Redirection...</p>}>
      <RedirectionProfil />
    </Suspense>
  );
}

async function RedirectionProfil() {
  // Indique à Next.js que la page se calcule à chaque visite.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/");

  redirect(`/u/${profile.username}`);
}