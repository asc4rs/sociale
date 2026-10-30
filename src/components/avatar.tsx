type Props = {
  url: string | null | undefined;
  nom: string;
  taille?: "sm" | "md" | "lg";
};

const CLASSES = {
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-24 w-24 text-3xl",
};

export function Avatar({ url, nom, taille = "sm" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface font-bold ${CLASSES[taille]}`}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        nom.charAt(0).toUpperCase()
      )}
    </span>
  );
}