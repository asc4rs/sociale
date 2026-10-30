"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  champ: "avatar_url" | "banner_url";
  libelle: string;
};

const TAILLE_MAX = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function TeleverserImage({ champ, libelle }: Props) {
  const router = useRouter();
  const entree = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choisir(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;

    if (!TYPES.includes(fichier.type)) {
      setMessage("Format non accepté (JPG, PNG, WebP ou GIF).");
      return;
    }
    if (fichier.size > TAILLE_MAX) {
      setMessage("Image trop lourde (2 Mo maximum).");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const extension = fichier.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const chemin = `${user.id}/${champ}-${Date.now()}.${extension}`;

      const { error: erreurEnvoi } = await supabase.storage
        .from("medias")
        .upload(chemin, fichier, { contentType: fichier.type });
      if (erreurEnvoi) {
        setMessage("Envoi impossible. Réessaie.");
        return;
      }

      const { data: url } = supabase.storage.from("medias").getPublicUrl(chemin);
      const { error } = await supabase
        .from("profiles")
        .update({ [champ]: url.publicUrl })
        .eq("id", user.id);

      if (error) {
        setMessage("Enregistrement impossible.");
        return;
      }
      router.refresh();
    });
  }

  function supprimer() {
    setMessage(null);
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ [champ]: null })
        .eq("id", user.id);

      if (error) {
        setMessage("Suppression impossible.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={entree}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={choisir}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => entree.current?.click()}
        disabled={pending}
        className="rounded-xl border border-border px-3 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50"
      >
        {pending ? "Envoi..." : libelle}
      </button>
      <button
        type="button"
        onClick={supprimer}
        disabled={pending}
        className="rounded-xl px-3 py-1.5 text-sm text-red-600 hover:bg-surface disabled:opacity-50"
      >
        Supprimer
      </button>
      {message && (
        <p role="alert" className="w-full text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}