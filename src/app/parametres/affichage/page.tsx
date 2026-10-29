import Link from "next/link";
import { SelecteurTheme } from "@/components/selecteur-theme";

export default function AffichageParametres() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Affichage, accessibilité et langue</h1>

      <section>
        <h2 className="text-lg font-semibold">Thème</h2>
        <div className="mt-3">
          <SelecteurTheme />
        </div>
        <Link href="/affichage" className="mt-3 inline-block text-sm underline">
          Plus d&apos;options d&apos;affichage
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Langue</h2>
        <p className="mt-2 text-sm text-muted">Sociale est disponible en français.</p>
      </section>
    </div>
  );
}