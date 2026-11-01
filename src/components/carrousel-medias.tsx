"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Affiche les images d'une publication, en carrousel si elle en a plusieurs.
export function CarrouselMedias({ postId }: { postId: string }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let annule = false;

    async function charger() {
      const { data } = await createClient()
        .from("post_media")
        .select("url, position")
        .eq("post_id", postId)
        .order("position", { ascending: true });

      if (!annule && data) setUrls(data.map((d) => d.url));
    }

    charger();
    return () => {
      annule = true;
    };
  }, [postId]);

  if (urls.length === 0) return null;

  const precedent = () => setIndex((i) => (i - 1 + urls.length) % urls.length);
  const suivant = () => setIndex((i) => (i + 1) % urls.length);

  return (
    <div className="relative mt-3 overflow-hidden rounded-2xl border border-border bg-surface">
      <img
        src={urls[index]}
        alt={`Image ${index + 1} sur ${urls.length}`}
        className="max-h-[32rem] w-full object-cover"
      />

      {urls.length > 1 && (
        <>
          <button
            type="button"
            onClick={precedent}
            aria-label="Image précédente"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={suivant}
            aria-label="Image suivante"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>

          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
            {index + 1}/{urls.length}
          </span>

          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {urls.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}