"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-accent";

type Message = { type: "ok" | "error"; text: string } | null;

export default function ModifierProfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/connexion");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, bio, is_private")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        setMessage({ type: "error", text: "Impossible de charger ton profil." });
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setDisplayName(data.display_name);
      setBio(data.bio ?? "");
      setIsPrivate(data.is_private);
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const cleanName = displayName.trim();
    const cleanBio = bio.trim();

    if (cleanName.length < 1 || cleanName.length > 50) {
      setMessage({ type: "error", text: "Le nom doit contenir entre 1 et 50 caractères." });
      return;
    }
    if (cleanBio.length > 160) {
      setMessage({ type: "error", text: "La bio ne doit pas dépasser 160 caractères." });
      return;
    }
    if (!userId) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: cleanName,
        bio: cleanBio,
        is_private: isPrivate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: "Enregistrement impossible. Réessaie." });
      return;
    }

    setMessage({ type: "ok", text: "Profil enregistré." });
  }

  if (loading) {
    return <p className="p-8 text-muted">Chargement...</p>;
  }

  return (
    <div className="mx-auto max-w-md p-6 md:p-8">
      <h1 className="text-3xl font-bold">Modifier mon profil</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Nom d&apos;affichage</span>
          <input
            className={inputClass}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Bio</span>
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
          />
          <span className="text-right text-xs text-muted">{bio.length}/160</span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-border p-4">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="block font-medium">Compte privé</span>
            <span className="block text-sm text-muted">
              Les personnes qui veulent te suivre devront envoyer une demande.
            </span>
          </span>
        </label>

        {message && (
          <p
            role="alert"
            className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-accent px-4 py-3 font-semibold text-accent-foreground transition-opacity disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}