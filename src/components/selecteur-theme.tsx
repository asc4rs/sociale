"use client";

import { useEffect, useState } from "react";

type Choix = "systeme" | "clair" | "sombre" | "noir";

const CLE = "sociale-theme";

const OPTIONS: { valeur: Choix; libelle: string; description: string }[] = [
  { valeur: "systeme", libelle: "Système", description: "Suit le réglage de l'appareil" },
  { valeur: "clair", libelle: "Clair", description: "Fond blanc" },
  { valeur: "sombre", libelle: "Sombre", description: "Fond gris très foncé" },
  { valeur: "noir", libelle: "Noir", description: "Fond noir absolu" },
];

// Applique le thème à la page : mode clair ou sombre, et fond noir absolu si demandé.
function appliquer(choix: Choix) {
  const racine = document.documentElement;
  const sombre =
    choix === "sombre" ||
    choix === "noir" ||
    (choix === "systeme" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  racine.dataset.theme = sombre ? "dark" : "light";

  if (choix === "noir") {
    racine.style.setProperty("--background", "#000000");
  } else {
    racine.style.removeProperty("--background");
  }
}

export function SelecteurTheme() {
  const [choix, setChoix] = useState<Choix>("systeme");

  // Au chargement : lit le choix enregistré, et suit le système si besoin.
  useEffect(() => {
    const enregistre = (localStorage.getItem(CLE) as Choix | null) ?? "systeme";
    setChoix(enregistre);
    appliquer(enregistre);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function auChangementSysteme() {
      if ((localStorage.getItem(CLE) ?? "systeme") === "systeme") appliquer("systeme");
    }
    media.addEventListener("change", auChangementSysteme);
    return () => media.removeEventListener("change", auChangementSysteme);
  }, []);

  function changer(valeur: Choix) {
    localStorage.setItem(CLE, valeur);
    setChoix(valeur);
    appliquer(valeur);
  }

  return (
    <div role="radiogroup" aria-label="Thème" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {OPTIONS.map((o) => {
        const actif = choix === o.valeur;
        return (
          <button
            key={o.valeur}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => changer(o.valeur)}
            className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
              actif ? "border-accent bg-surface" : "border-border hover:bg-surface"
            }`}
          >
            <span className="text-sm font-semibold">{o.libelle}</span>
            <span className="text-xs text-muted">{o.description}</span>
          </button>
        );
      })}
    </div>
  );
}