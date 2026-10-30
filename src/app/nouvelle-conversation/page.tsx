import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export default function NouvelleConversationPage({
  searchParams,
}: {
  searchParams: Promise<{ cible?: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Chargement...</p>}>
      <OuvrirConversation searchParams={searchParams} />
    </Suspense>
  );
}

async function OuvrirConversation({
  searchParams,
}: {
  searchParams: Promise<{ cible?: string }>;
}): Promise<null> {
  await connection();

  const { cible } = await searchParams;
  if (!cible) redirect("/messages");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ouvrir_conversation", { cible });

  if (error || !data) redirect("/messages");
  redirect(`/messages/${data}`);

  // Jamais atteint : la redirection interrompt la fonction. Sert uniquement au typage.
  return null;
}