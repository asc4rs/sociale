// Règles de validation réutilisables, testées automatiquement.
export function pseudoValide(pseudo: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(pseudo);
}

export function motDePasseValide(mdp: string): boolean {
  return mdp.length >= 8;
}

export function texteValide(texte: string, max: number): boolean {
  const t = texte.trim();
  return t.length >= 1 && t.length <= max;
}