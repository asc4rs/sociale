import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = [
  { href: "/parametres/compte", titre: "Votre compte", texte: "Informations, mot de passe, suppression du compte." },
  { href: "/statistiques", titre: "Statistiques", texte: "Vues, j'aime, abonnés et tes publications les plus vues." },
  { href: "/parametres/exporter", titre: "Exporter mes données", texte: "Télécharger une copie de tes données." },
  { href: "/parametres/notifications", titre: "Notifications", texte: "Choisir les notifications que tu reçois." },
  { href: "/parametres/confidentialite", titre: "Confidentialité", texte: "Compte privé ou public." },
  { href: "/parametres/bloques", titre: "Comptes bloqués", texte: "Retrouver et débloquer des comptes." },
  { href: "/parametres/affichage", titre: "Affichage, accessibilité et langue", texte: "Thème et apparence." },
  { href: "/parametres/aide", titre: "Aide et informations", texte: "FAQ, à propos, conditions, confidentialité." },
];

export default function ParametresPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <ContenuParametres />
    </Suspense>
  );
}

async function ContenuParametres() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Paramètres</h1>

      <ul className="mt-6 flex flex-col gap-2">
        {CATEGORIES.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="block rounded-xl border border-border p-4 transition-colors hover:bg-surface"
            >
              <span className="block font-semibold">{c.titre}</span>
              <span className="block text-sm text-muted">{c.texte}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}