import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pages accessibles sans être connecté.
const PUBLIC_PATHS = [
  "/connexion",
  "/inscription",
  "/auth/callback",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/aide",
  "/a-propos",
  "/conditions",
  "/confidentialite",
];

function redirigerVers(request: NextRequest, chemin: string) {
  const url = request.nextUrl.clone();
  url.pathname = chemin;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!user) {
    if (isPublic) return response;
    return redirigerVers(request, "/connexion");
  }

  const { data: moi } = await supabase
    .from("profiles")
    .select("is_banned, username")
    .eq("id", user.id)
    .maybeSingle();

  const banni = !!moi?.is_banned;

  if (banni && pathname !== "/banni") return redirigerVers(request, "/banni");
  if (!banni && pathname === "/banni") return redirigerVers(request, "/");

  // /profil envoie vers mon profil public.
  if (!banni && pathname === "/profil" && moi?.username) {
    return redirigerVers(request, `/u/${moi.username}`);
  }

  return response;
}