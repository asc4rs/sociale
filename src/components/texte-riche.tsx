import Link from "next/link";

type Props = {
  texte: string;
};

// Transforme les @pseudo en liens vers le profil et les #sujets en liens de recherche.
export function TexteRiche({ texte }: Props) {
  const morceaux = texte.split(/(@[A-Za-z0-9_]{3,20}|#[\p{L}0-9_]{2,40})/u);

  return (
    <>
      {morceaux.map((m, i) => {
        if (m.startsWith("@") && m.length >= 4) {
          return (
            <Link key={i} href={`/u/${m.slice(1)}`} className="text-accent underline hover:opacity-80">
              {m}
            </Link>
          );
        }
        if (m.startsWith("#") && m.length >= 3) {
          return (
            <Link
              key={i}
              href={`/recherche?q=${encodeURIComponent(m)}`}
              className="text-accent hover:underline"
            >
              {m}
            </Link>
          );
        }
        return <span key={i}>{m}</span>;
      })}
    </>
  );
}
