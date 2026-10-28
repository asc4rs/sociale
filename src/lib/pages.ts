// Pages sans aucun menu (connexion, inscription, mot de passe).
export const PAGES_SANS_MENU = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/auth/",
  "/banni",
];

// Pages légales : affichées seules aux visiteurs non connectés.
export const PAGES_LEGALES = [
  "/aide",
  "/a-propos",
  "/conditions",
  "/confidentialite",
];

// Pages où la flèche de retour est utile sur mobile.
export const PAGES_AVEC_RETOUR = [
  "/u/",
  "/publication/",
  "/messages/",
  "/profil/modifier",
  "/affichage",
  "/aide",
  "/a-propos",
  "/conditions",
  "/confidentialite",
  "/supprimer-compte",
  "/moderation",
  "/administration",
];

export function commencePar(pathname: string, prefixes: string[]) {
  return prefixes.some((prefixe) => pathname === prefixe || pathname.startsWith(prefixe));
}