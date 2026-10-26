import Link from "next/link";

export default function ConditionsPage() {
  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Conditions générales d&apos;utilisation</h1>

      <p className="mt-4 rounded-xl border border-border p-3 text-xs text-muted">
        Ce texte est un modèle adapté au fonctionnement de Sociale. Il doit être relu par un professionnel
        du droit avant toute mise en ligne publique.
      </p>

      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed">
        <h2 className="font-semibold">1. Objet</h2>
        <p>Les présentes conditions encadrent l&apos;utilisation du service Sociale.</p>

        <h2 className="font-semibold">2. Compte</h2>
        <p>Tu es responsable de la confidentialité de ton mot de passe et de l&apos;activité de ton compte. Une seule personne physique doit utiliser un compte.</p>

        <h2 className="font-semibold">3. Contenus</h2>
        <p>Tu restes responsable des textes, images et vidéos que tu publies. Il est interdit de publier des contenus illégaux, haineux, harcelants, menaçants ou portant atteinte à la vie privée d&apos;autrui.</p>

        <h2 className="font-semibold">4. Modération</h2>
        <p>Les contenus signalés peuvent être examinés et supprimés. Les comptes qui ne respectent pas ces conditions peuvent être restreints ou supprimés.</p>

        <h2 className="font-semibold">5. Suppression</h2>
        <p>Tu peux supprimer ton compte à tout moment depuis la page « Supprimer mon compte ». Cette action est définitive.</p>

        <h2 className="font-semibold">6. Responsabilité</h2>
        <p>Sociale est fourni en l&apos;état pendant sa phase de développement. Le service peut être interrompu ou modifié.</p>

        <h2 className="font-semibold">7. Contact</h2>
        <p>Adresse de contact : <span className="font-semibold">[à définir]</span>.</p>
      </div>

      <p className="mt-8 text-sm">
        <Link href="/confidentialite" className="underline">Voir la politique de confidentialité</Link>
      </p>
    </div>
  );
}