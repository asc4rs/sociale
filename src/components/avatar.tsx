type Props = {
  url: string | null | undefined;
  nom: string;
  taille?: "sm" | "lg";
};

export function Avatar({ url, nom, taille = "sm" }: Props) {
  const classe = taille === "lg" ? "h-24 w-24 text-3xl" : "h-8 w-8 text-sm";

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface font-bold ${classe}`}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        nom.charAt(0).toUpperCase()
      )}
    </span>
  );
}