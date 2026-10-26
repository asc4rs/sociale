"use client";

import { useState, useTransition } from "react";
import { basculerLike } from "@/app/actions/likes";

type Props = {
  postId: string;
  nombreInitial: number;
  dejaLikeInitial: boolean;
};

export function BoutonLike({ postId, nombreInitial, dejaLikeInitial }: Props) {
  const [nombre, setNombre] = useState(nombreInitial);
  const [dejaLike, setDejaLike] = useState(dejaLikeInitial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setMessage(null);
    const ancienNombre = nombre;
    const ancienEtat = dejaLike;

    // Mise à jour immédiate : le bouton réagit avant la réponse de la base.
    setDejaLike(!ancienEtat);
    setNombre(ancienEtat ? ancienNombre - 1 : ancienNombre + 1);

    startTransition(async () => {
      const result = await basculerLike(postId, ancienEtat);
      if (result.error) {
        // En cas d'échec, on revient à l'état précédent.
        setDejaLike(ancienEtat);
        setNombre(ancienNombre);
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={dejaLike}
        aria-label={dejaLike ? "Retirer le like" : "Aimer cette publication"}
        className={`rounded-xl border border-border px-3 py-1 text-sm font-semibold transition-colors disabled:opacity-50 ${
          dejaLike ? "bg-accent text-accent-foreground" : "hover:bg-surface"
        }`}
      >
        ♥ {nombre}
      </button>
      {message && (
        <span role="alert" className="text-sm text-red-600">
          {message}
        </span>
      )}
    </div>
  );
}