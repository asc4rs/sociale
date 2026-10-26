import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// /profil redirige vers ton propre profil public.
export default async function MonProfilPage() {
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