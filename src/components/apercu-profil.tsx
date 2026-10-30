"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { seDesabonner, suivre } from "@/app/actions/abonnements";
import { Avatar } from "@/components/avatar";

type Etat = "aucun" | "attente" | "suivi";

type Infos = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_private: boolean;
  abonnes: number;
  abonnements: number;
  etat: Etat;
  estMoi: boolean;
  connecte: boolean;
  amis: { display_name: string; avatar_url: string | null }[];
  amisTotal: number;
};

type Props = {
  auteurId: string;
  children: React.ReactNode;
};

// Joint une liste de noms en français : « A, B et C ».
function joindre(noms: string[]) {
  if (noms.length <= 1) return noms.join("");
  return `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`;
}

// Carte d'aperçu au survol du nom ou de la photo de l'auteur, sur le modèle de X.
export function ApercuProfil({ auteurId, children }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [infos, setInfos] = useState<Infos | null>(null);
  const [charge, setCharge] = useState(false);
  const [pending, startTransition] = useTransition();

  async function charger() {
    if (charge) return;
    setCharge(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profil } = await supabase
      .from("profiles")
      .select("id, username, display_name, bio, avatar_url, is_private")
      .eq("id", auteurId)
      .maybeSingle();
    if (!profil) return;

    const [resAbonnes, resAbonnements] = await Promise.all([
      supabase
        .from("follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("following_id", auteurId)
        .eq("status", "accepted"),
      supabase
        .from("follows")
        .select("following_id", { count: "exact", head: true })
        .eq("follower_id", auteurId)
        .eq("status", "accepted"),
    ]);

    let etat: Etat = "aucun";
    let amis: Infos["amis"] = [];
    let amisTotal = 0;

    if (user && user.id !== auteurId) {
      const { data: lien } = await supabase
        .from("follows")
        .select("status")
        .eq("follower_id", user.id)
        .eq("following_id", auteurId)
        .maybeSingle();
      if (lien?.status === "accepted") etat = "suivi";
      else if (lien?.status === "pending") etat = "attente";

      // Comptes que je suis et qui suivent cette personne : « suivi par… ».
      const { data: mesSuivis } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .eq("status", "accepted");
      const { data: sesAbonnes } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", auteurId)
        .eq("status", "accepted");

      const moiSuit = new Set((mesSuivis ?? []).map((f) => f.following_id));
      const communs = (sesAbonnes ?? [])
        .map((f) => f.follower_id)
        .filter((id) => moiSuit.has(id) && id !== user.id);

      amisTotal = communs.length;
      if (communs.length > 0) {
        const { data: noms } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .in("id", communs.slice(0, 3));
        amis = noms ?? [];
      }
    }

    setInfos({
      id: profil.id,
      username: profil.username,
      display_name: profil.display_name,
      bio: profil.bio,
      avatar_url: profil.avatar_url,
      is_private: profil.is_private,
      abonnes: resAbonnes.count ?? 0,
      abonnements: resAbonnements.count ?? 0,
      etat,
      estMoi: user?.id === auteurId,
      connecte: !!user,
      amis,
      amisTotal,
    });
  }

  function ouvrir() {
    setOuvert(true);
    charger();
  }

  function basculer() {
    if (!infos) return;
    const actuel = infos.etat;
    startTransition(async () => {
      const result =
        actuel === "aucun" ? await suivre(infos.id) : await seDesabonner(infos.id);
      if (result?.error) return;
      setInfos({
        ...infos,
        etat: actuel === "aucun" ? (infos.is_private ? "attente" : "suivi") : "aucun",
      });
    });
  }

  const libelleBouton =
    infos?.etat === "suivi" ? "Abonné" : infos?.etat === "attente" ? "Demande envoyée" : "Suivre";

  return (
    <div
      className="relative inline-block"
      onMouseEnter={ouvrir}
      onMouseLeave={() => setOuvert(false)}
      onFocus={ouvrir}
      onBlur={() => setOuvert(false)}
    >
      {children}

      {ouvert && (
        <div
          role="tooltip"
          className="absolute left-0 top-full z-40 mt-2 w-80 rounded-2xl border border-border bg-background p-4 text-left shadow-2xl"
        >
          {!infos ? (
            <p className="text-sm text-muted">Chargement...</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <Avatar url={infos.avatar_url} nom={infos.display_name} taille="lg" />

                {infos.connecte && !infos.estMoi && (
                  <button
                    type="button"
                    onClick={basculer}
                    disabled={pending || infos.etat === "attente"}
                    className={`rounded-full px-4 py-1.5 text-sm font-bold disabled:opacity-60 ${
                      infos.etat === "aucun"
                        ? "bg-white text-black hover:bg-neutral-200"
                        : "border border-border hover:bg-surface"
                    }`}
                  >
                    {pending ? "..." : libelleBouton}
                  </button>
                )}
              </div>

              <p className="mt-3 text-base font-bold">{infos.display_name}</p>
              <p className="text-sm text-muted">@{infos.username}</p>

              {infos.bio && (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm">{infos.bio}</p>
              )}

              <div className="mt-3 flex gap-4 text-sm">
                <p>
                  <span className="font-bold">{infos.abonnements}</span>{" "}
                  <span className="text-muted">abonnements</span>
                </p>
                <p>
                  <span className="font-bold">{infos.abonnes}</span>{" "}
                  <span className="text-muted">abonnés</span>
                </p>
              </div>

              {infos.amisTotal > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex">
                    {infos.amis.map((a, i) => (
                      <span key={i} className={i > 0 ? "-ml-2" : ""}>
                        <Avatar url={a.avatar_url} nom={a.display_name} />
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted">
                    Suivi par {joindre(infos.amis.map((a) => a.display_name))}
                    {infos.amisTotal > infos.amis.length &&
                      ` et ${infos.amisTotal - infos.amis.length} autres personnes`}
                    {infos.amisTotal > infos.amis.length ? " que vous suivez" : " que vous suivez"}
                  </p>
                </div>
              )}

              <Link
                href={`/u/${infos.username}`}
                className="mt-4 block rounded-full border border-border py-2 text-center text-sm font-semibold hover:bg-surface"
              >
                Voir le profil
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}