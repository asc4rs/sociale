import Link from "next/link";

const LIENS = [
  { href: "/aide", libelle: "Aide et FAQ" },
  { href: "/a-propos", libelle: "À propos de Sociale" },
  { href: "/conditions", libelle: "Conditions générales" },
  { href: "/confidentialite", libelle: "Politique de confidentialité" },
];

export default function AideParametres() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Aide et informations</h1>
      <ul className="flex flex-col gap-2">
        {LIENS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded-xl border border-border p-4 font-medium transition-colors hover:bg-surface"
            >
              {l.libelle}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}