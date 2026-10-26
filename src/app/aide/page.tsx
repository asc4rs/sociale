import Link from "next/link";

const QUESTIONS = [
  {
    q: "Comment créer un compte ?",
    r: "Clique sur « Créer un compte », remplis le formulaire, puis confirme ton adresse e-mail en cliquant sur le lien reçu.",
  },
  {
    q: "Je ne reçois pas l'e-mail de confirmation.",
    r: "Vérifie tes courriers indésirables. Patiente quelques minutes, puis recommence l'inscription avec la même adresse si nécessaire.",
  },
  {
    q: "Comment rendre mon compte privé ?",
    r: "Va dans Paramètres et coche « Compte privé ». Les personnes qui te suivent déjà gardent leur accès.",
  },
  {
    q: "Comment suivre un compte privé ?",
    r: "Clique sur « Suivre ». Ta demande reste en attente jusqu'à ce que le propriétaire l'accepte.",
  },
  {
    q: "Comment bloquer ou signaler quelqu'un ?",
    r: "Sur son profil, utilise les boutons « Bloquer » et « Signaler ce compte ». Pour une publication, utilise « Signaler ».",
  },
  {
    q: "Comment supprimer mon compte ?",
    r: "Va dans « Supprimer mon compte ». La suppression est définitive et n'annule pas les informations déjà partagées.",
  },
  {
    q: "Où sont mes données personnelles ?",
    r: "Consulte la politique de confidentialité pour savoir quelles données sont collectées et pourquoi.",
  },
];

export default function AidePage() {
  return (
    <div className="mx-auto max-w-xl p-6 md:p-8">
      <h1 className="text-3xl font-bold">Aide et FAQ</h1>

      <div className="mt-6 flex flex-col gap-3">
        {QUESTIONS.map((item) => (
          <details key={item.q} className="rounded-xl border border-border p-4">
            <summary className="cursor-pointer font-semibold">{item.q}</summary>
            <p className="mt-3 text-sm text-muted">{item.r}</p>
          </details>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-2 text-sm">
        <Link href="/conditions" className="underline">Conditions générales</Link>
        <Link href="/confidentialite" className="underline">Politique de confidentialité</Link>
        <Link href="/a-propos" className="underline">À propos de Sociale</Link>
      </div>
    </div>
  );
}