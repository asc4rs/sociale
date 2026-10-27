export default function HorsLignePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">Hors connexion</h1>
      <p className="text-muted">
        Tu n&apos;as pas de connexion internet pour le moment. Les publications seront disponibles dès que le réseau reviendra.
      </p>
    </div>
  );
}