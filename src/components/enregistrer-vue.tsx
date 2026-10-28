"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  postId: string;
  auteurId: string;
};

// Compte une vue par personne et par publication. L'auteur ne se compte pas.
export function EnregistrerVue({ postId, auteurId }: Props) {
  useEffect(() => {
    async function enregistrer() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id === auteurId) return;

      // Si la vue existe déjà, la base la refuse : c'est voulu, on ignore.
      await supabase.from("post_views").insert({ post_id: postId, user_id: user.id });
    }
    enregistrer();
  }, [postId, auteurId]);

  return null;
}