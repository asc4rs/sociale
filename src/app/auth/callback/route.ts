import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const suite = searchParams.get("next") ?? "/";

  // Sécurité : on accepte seulement un chemin interne du site.
  const destination =
    suite.startsWith("/") && !suite.startsWith("//") ? suite : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/mot-de-passe-oublie?erreur=lien-invalide`);
}