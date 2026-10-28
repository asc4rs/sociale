import Link from "next/link";

type LogoProps = {
  className?: string;
};

// Le logo ramène à l'accueil et recharge la page.
export function Logo({ className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      reloadDocument
      aria-label="Sociale, retour à l'accueil"
      className={`flex items-center gap-2 rounded-xl ${className}`}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-lg font-black text-accent-foreground"
      >
        S
      </span>
      <span className="text-xl font-bold tracking-tight">Sociale</span>
    </Link>
  );
}