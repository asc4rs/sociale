"use client";

import { useEffect, useState } from "react";

type Choix = "systeme" | "clair" | "sombre";

const CLE = "sociale-theme";

const OPTIONS: { valeur: Choix; libelle: string }[] = [
  { valeur: "systeme", libelle: "Système" },
  { valeur: "clair", libelle: "Clair" },
  { valeur: "sombre", libelle: "Sombre" },
];

function appliquer(choix: Choix) {
  if (choix === "systeme") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", choix);
  }
}

export function SelecteurTheme() {
  const [choix, setChoix] = useState<Choix>("systeme");

  useEffect(() => {
    const sauve = (localStorage.getItem(CLE) as Choix | null) ?? "systeme";
    setChoix(sauve);
    appliquer(sauve);
  }, []);

  function changer(nouveau: Choix) {
    localStorage.setItem(CLE, nouveau);
    setChoix(nouveau);
    appliquer(nouveau);
  }

  return (
    <div role="radiogroup" aria-label="Thème" className="flex gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.valeur}
          type="button"
          role="radio"
          aria-checked={choix === o.valeur}
          onClick={() => changer(o.valeur)}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
            choix === o.valeur
              ? "bg-accent text-accent-foreground"
              : "border-border hover:bg-surface"
          }`}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}