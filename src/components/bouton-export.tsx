"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function BoutonExport() {
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function exporter() {
    setPending(true);
    setErreur(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("connexion");

      const id = user.id;

      const [profil, posts, commentaires, likes, reposts, favoris, suivis, abonnes, blocages, messages] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
          supabase.from("posts").select("*").eq("author_id", id),
          supabase.from("comments").select("*").eq("author_id", id),
          supabase.from("likes").select("*").eq("user_id", id),
          supabase.from("reposts").select("*").eq("user_id", id),
          supabase.from("bookmarks").select("*").eq("user_id", id),
          supabase.from("follows").select("*").eq("follower_id", id),
          supabase.from("follows").select("*").eq("following_id", id),
          supabase.from("blocks").select("*").eq("blocker_id", id),
          supabase.from("messages").select("*").eq("author_id", id),
        ]);

      const resultats = [profil, posts, commentaires, likes, reposts, favoris, suivis, abonnes, blocages, messages];
      if (resultats.some((r) => r.error)) throw new Error("export");

      const contenu = {
        exporte_le: new Date().toISOString(),
        compte: { id, email: user.email, cree_le: user.created_at },
        profil: profil.data,
        publications: posts.data,
        commentaires: commentaires.data,
        likes: likes.data,
        republications: reposts.data,
        favoris: favoris.data,
        abonnements: suivis.data,
        abonnes: abonnes.data,
        blocages: blocages.data,
        messages_envoyes: messages.data,
      };

      const blob = new Blob([JSON.stringify(contenu, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = "sociale-mes-donnees.json";
      lien.click();
      URL.revokeObjectURL(url);
    } catch {
      setErreur("Export impossible. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={exporter}
        disabled={pending}
        className="self-start rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Préparation..." : "Télécharger mes données"}
      </button>
      {erreur && (
        <p role="alert" className="text-sm text-red-600">
          {erreur}
        </p>
      )}
    </div>
  );
}