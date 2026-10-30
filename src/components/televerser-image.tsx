"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  champ: "avatar_url" | "banner_url";
  libelle: string;
};

const TAILLE_MAX = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Dimensions attendues selon le type d'image.
const REGLES = {
  avatar_url: {
    texte: "Photo de profil : carrée, 200 × 200 px minimum (par exemple 400 × 400 px).",
    verifier: (w: number, h: number) => w === h && w >= 200,
  },
  banner_url: {
    texte: "Bannière : format 3:1, 1000 × 333 px minimum (par exemple 1500 × 500 px).",
    verifier: (w: number, h: number) => w >= 1000 && Math.abs(w / h - 3) < 0.05,
  },
} as const;

// Lit la largeur et la hauteur réelles de l'image choisie.
function lireDimensions(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error("lecture"));
    img.src = url;
  });
}

export function TeleverserImage({ champ, libelle }: Props) {
  const router = useRouter();
  const entree = useRef<HTMLInputElement>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Libère la mémoire de l'aperçu quand il change ou disparaît.
  useEffect(() => {
    return () => {
      if (apercu) URL.revokeObjectURL(apercu);
    };
  }, [apercu]);

  async function choisir(e: React.ChangeEvent<HTMLInputElement>) {
    const choix = e.target.files?.[0];
    e.target.value = "";
    if (!choix) return;

    setMessage(null);

    if (!TYPES.includes(choix.type)) {
      setMessage("Format non accepté (JPG, PNG, WebP ou GIF).");
      return;
    }
    if (choix.size > TAILLE_MAX) {
      setMessage("Image trop lourde (2 Mo maximum).");
      return;
    }

    const url = URL.createObjectURL(choix);
    let dimensions;
    try {
      dimensions = await lireDimensions(url);
    } catch {
      URL.revokeObjectURL(url);
      setMessage("Impossible de lire cette image. Essaie un autre fichier.");
      return;
    }

    const regle = REGLES[champ];
    if (!regle.verifier(dimensions.w, dimensions.h)) {
      URL.revokeObjectURL(url);
      setMessage(
        `Dimensions incorrectes (${dimensions.w} × ${dimensions.h} px). ${regle.texte}`,
      );
      return;
    }

    // Image valide : on affiche l'aperçu, sans rien envoyer.
    setApercu(url);
    setFichier(choix);
  }

  function annuler() {
    setApercu(null);
    setFichier(null);
    setMessage(null);
  }

  function confirmer() {
    if (!fichier) return;
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
      annuler();
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

  const formeApercu =
    champ === "avatar_url" ? "h-24 w-24 rounded-full" : "h-24 w-72 rounded-xl";

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={entree}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={choisir}
        className="hidden"
      />

      {apercu ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold">Aperçu</p>
          <img
            src={apercu}
            alt="Aperçu de l'image choisie"
            className={`${formeApercu} object-cover border border-border`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmer}
              disabled={pending}
              className="rounded-xl bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground disabled:opacity-50"
            >
              {pending ? "Envoi..." : "Confirmer"}
            </button>
            <button
              type="button"
              onClick={annuler}
              disabled={pending}
              className="rounded-xl border border-border px-4 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => entree.current?.click()}
            disabled={pending}
            className="rounded-xl border border-border px-3 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-50"
          >
            {libelle}
          </button>
          <button
            type="button"
            onClick={supprimer}
            disabled={pending}
            className="rounded-xl px-3 py-1.5 text-sm text-red-600 hover:bg-surface disabled:opacity-50"
          >
            Supprimer
          </button>
          <p className="w-full text-xs text-muted">{REGLES[champ].texte}</p>
        </div>
      )}

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}