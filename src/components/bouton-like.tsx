"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { basculerLike } from "@/app/actions/likes";

type Props = {
  postId: string;
  nombreInitial: number;
  dejaLikeInitial: boolean;
};

export function BoutonLike({ postId, nombreInitial, dejaLikeInitial }: Props) {
  const [nombre, setNombre] = useState(nombreInitial);
  const [dejaLike, setDejaLike] = useState(dejaLikeInitial);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const ancienNombre = nombre;
    const ancienEtat = dejaLike;

    setDejaLike(!ancienEtat);
    setNombre(ancienEtat ? ancienNombre - 1 : ancienNombre + 1);

    startTransition(async () => {
      const result = await basculerLike(postId, ancienEtat);
      if (result.error) {
        setDejaLike(ancienEtat);
        setNombre(ancienNombre);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={dejaLike}
      aria-label={dejaLike ? "Retirer le like" : "Aimer cette publication"}
      title={dejaLike ? "Retirer le like" : "J'aime"}
      className={`flex shrink-0 items-center gap-1 rounded-xl border border-border px-2.5 py-1 text-sm transition-colors disabled:opacity-50 ${
        dejaLike ? "bg-accent text-accent-foreground" : "hover:bg-surface"
      }`}
    >
      <Heart size={16} aria-hidden="true" fill={dejaLike ? "currentColor" : "none"} />
      <span className="font-semibold">{nombre}</span>
    </button>
  );
}