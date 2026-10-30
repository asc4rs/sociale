"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";

type Auteur = { username: string; display_name: string; avatar_url: string | null };

type Citee = {
  id: string;
  content: string;
  profiles: Auteur | Auteur[] | null;
};

// Affiche la publication citée, si la publication courante en cite une.
export function CitationApercu({ postId }: { postId: string }) {
  const [citee, setCitee] = useState<Citee | null>(null);

  useEffect(() => {
    let annule = false;

    async function charger() {
      const supabase = createClient();
      const { data: moi } = await supabase
        .from("posts")
        .select("quoted_post_id")
        .eq("id", postId)
        .maybeSingle();

      if (!moi?.quoted_post_id) return;

      const { data } = await supabase
        .from("posts")
        .select("id, content, profiles!posts_author_id_fkey(username, display_name, avatar_url)")
        .eq("id", moi.quoted_post_id)
        .maybeSingle();

      if (!annule && data) setCitee(data as unknown as Citee);
    }

    charger();
    return () => {
      annule = true;
    };
  }, [postId]);

  if (!citee) return null;

  const auteur = Array.isArray(citee.profiles) ? citee.profiles[0] : citee.profiles;

  return (
    <Link
      href={`/publication/${citee.id}`}
      className="mt-3 block rounded-xl border border-border p-3 hover:bg-surface"
    >
      <span className="flex items-center gap-2 text-sm">
        <Avatar url={auteur?.avatar_url} nom={auteur?.display_name ?? "?"} />
        <span className="font-semibold">{auteur?.display_name ?? "Compte inconnu"}</span>
        <span className="text-muted">@{auteur?.username ?? "inconnu"}</span>
      </span>
      <span className="mt-2 block whitespace-pre-wrap break-words text-sm">{citee.content}</span>
    </Link>
  );
}