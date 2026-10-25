type LogoProps = {
  className?: string;
};

export function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-lg font-black text-accent-foreground"
      >
        S
      </span>
      <span className="text-xl font-bold tracking-tight">Sociale</span>
    </div>
  );
}