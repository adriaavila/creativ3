"use client";

import type { ReactNode } from "react";
import { track } from "@vercel/analytics";

export default function TrackedWhatsappLink({
  href,
  location,
  offer,
  className,
  children,
}: {
  href: string;
  location: string;
  offer: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track("whatsapp_opened", { location, offer })}
    >
      {children}
    </a>
  );
}
