import Link from "next/link";

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Politique de confidentialité</h1>

      <p className="mt-4 rounded-xl border border-border p-3 text-xs text-muted">
        Ce texte est un modèle. Il doit être complété et validé par un professionnel du droit (RGPD) avant
        toute mise en ligne publique.
      </p>

      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed">
        <h2 className="font-semibold">Données collectées</h2>
        <p>Adresse e-mail, nom d&apos;utilisateur, nom d&apos;affichage, biographie, contenus publiés (publications, commentaires, messages), interactions (likes, abonnements, blocages).</p>

        <h2 className="font-semibold">Finalités</h2>
        <p>Fournir le service, sécuriser les comptes, envoyer les notifications que tu as activées et modérer les contenus signalés.</p>

        <h2 className="font-semibold">Durée de conservation</h2>
        <p>Les données sont conservées tant que ton compte existe. Elles sont supprimées lorsque tu supprimes ton compte, sous réserve des obligations légales de conservation.</p>

        <h2 className="font-semibold">Tes droits</h2>
        <p>Tu peux demander l&apos;accès, la rectification ou l&apos;effacement de tes données, et t&apos;opposer à certains traitements. Tu peux aussi supprimer ton compte directement depuis l&apos;application.</p>

        <h2 className="font-semibold">Contact</h2>
        <p>Pour exercer tes droits : <span className="font-semibold">[adresse à définir]</span>.</p>
      </div>

      <p className="mt-8 text-sm">
        <Link href="/conditions" className="underline">Voir les conditions générales</Link>
      </p>
    </div>
  );
}