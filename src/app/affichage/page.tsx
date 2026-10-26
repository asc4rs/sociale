import Link from "next/link";
import { SelecteurTheme } from "@/components/selecteur-theme";

export default function AffichagePage() {
  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Affichage</h1>
      <p className="mt-2 text-muted">
        Choisis l&apos;apparence de Sociale. Ce choix est gardé sur cet appareil.
      </p>

      <div className="mt-8">
        <SelecteurTheme />
      </div>

      <p className="mt-8 text-sm text-muted">
        Langue : français. D&apos;autres langues seront ajoutées plus tard.
      </p>
      <p className="mt-4 text-sm">
        <Link href="/aide" className="underline">Aide et FAQ</Link>
      </p>
    </div>
  );
}