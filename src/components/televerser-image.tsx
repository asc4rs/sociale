"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  champ: "avatar_url" | "banner_url";
  libelle: string;
};

const TAILLE_MAX = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Règles affichées avec le bouton ⓘ.
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
  const [infoOuverte, setInfoOuverte] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Libère la mémoire de l'aperçu quand il disparaît.
  useEffect(() => {
    return () => {
      if (apercu) URL.revokeObjectURL(apercu);
    };
  }, [apercu]);

  // Ferme l'aperçu avec la touche Échap.
  useEffect(() => {
    if (!apercu) return;
    function touche(e: KeyboardEvent) {
      if (e.key === "Escape") annuler();
    }
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
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

    setApercu(url);
    setFichier(choix);
  }

  function annuler() {
    setApercu(null);
    setFichier(null);
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
        annuler();
        return;
      }

      const { data: url } = supabase.storage.from("medias").getPublicUrl(chemin);
      const { error } = await supabase
        .from("profiles")
        .update({ [champ]: url.publicUrl })
        .eq("id", user.id);

      if (error) {
        setMessage("Enregistrement impossible.");
        annuler();
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
    champ === "avatar_url"
      ? "h-64 w-64 rounded-full sm:h-80 sm:w-80"
      : "h-auto w-full max-w-2xl rounded-xl aspect-[3/1]";

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={entree}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={choisir}
        className="hidden"
      />

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

        <button
          type="button"
          onClick={() => setInfoOuverte(!infoOuverte)}
          aria-label="Dimensions requises"
          aria-expanded={infoOuverte}
          className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-foreground"
        >
          <Info size={16} aria-hidden="true" />
        </button>
      </div>

      {infoOuverte && (
        <p className="rounded-xl border border-border p-3 text-xs text-muted">
          {REGLES[champ].texte}
        </p>
      )}

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}

      {apercu && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de l'image"
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-8 bg-black/90 p-6"
        >
          <p className="text-lg font-semibold text-white">Aperçu</p>

          <img
            src={apercu}
            alt="Aperçu de l'image choisie"
            className={`${formeApercu} object-cover`}
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={confirmer}
              disabled={pending}
              className="rounded-xl bg-white px-6 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {pending ? "Envoi..." : "Confirmer"}
            </button>
            <button
              type="button"
              onClick={annuler}
              disabled={pending}
              className="rounded-xl border border-white/40 px-6 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}