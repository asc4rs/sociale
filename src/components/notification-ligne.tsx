"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { marquerNotificationLue } from "@/app/actions/notification-lue";

type Props = {
  id: string;
  href: string;
  estLue: boolean;
  className: string;
  children: React.ReactNode;
};

// Un clic marque cette notification comme lue, puis ouvre la page.
export function NotificationLigne({ id, href, estLue, className, children }: Props) {
  const router = useRouter();

  async function ouvrir(e: React.MouseEvent<HTMLAnchorElement>) {
    if (estLue) return; // Déjà lue : navigation normale.
    e.preventDefault();
    await marquerNotificationLue(id);
    window.dispatchEvent(new Event("notifications-lues"));
    router.push(href);
  }

  return (
    <Link href={href} onClick={ouvrir} className={className}>
      {children}
    </Link>
  );
}