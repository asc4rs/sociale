// Pages sans aucun menu (ni barre du haut, ni barre du bas, ni menu de gauche).
export const PAGES_SANS_MENU = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/auth/",
  "/banni",
];

// Pages où la flèche de retour est utile (pages secondaires).
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