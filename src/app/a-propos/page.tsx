import Link from "next/link";

export default function AProposPage() {
  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">À propos de Sociale</h1>

      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed">
        <p>
          Sociale est un réseau social simple et respectueux : publier, échanger, suivre les personnes
          qui t&apos;intéressent et garder le contrôle de ta vie privée.
        </p>
        <p>
          Le service est actuellement en phase de développement. Certaines fonctionnalités peuvent
          évoluer ou être corrigées.
        </p>
        <p>
          Pour toute question, contacte-nous à l&apos;adresse : <span className="font-semibold">[adresse de contact à définir]</span>.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-2 text-sm">
        <Link href="/conditions" className="underline">Conditions générales</Link>
        <Link href="/confidentialite" className="underline">Politique de confidentialité</Link>
      </div>
    </div>
  );
}