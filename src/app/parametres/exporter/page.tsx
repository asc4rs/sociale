import { BoutonExport } from "@/components/bouton-export";

export default function ExporterPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Exporter mes données</h1>
      <p className="text-sm text-muted">
        Télécharge un fichier JSON contenant ton profil, tes publications, tes commentaires, tes likes,
        tes republications, tes favoris, tes abonnements, tes abonnés, tes blocages et les messages que
        tu as envoyés.
      </p>
      <BoutonExport />
    </div>
  );
}