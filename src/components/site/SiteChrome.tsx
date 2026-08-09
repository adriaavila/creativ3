"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import QualificationDialogProvider from "./QualificationDialogProvider";
import SiteNav from "./SiteNav";

// `src/lib/i18n` is `server-only` (it's meant to be read in server
// components), so this client component reads the message JSON directly
// instead of going through `getMessages`/`isLocale`.
const MESSAGES = { es, en };

// Routes with their own chrome (app shell, auth screens, embedded flows) —
// the marketing nav and qualification dialog stay out of their way.
const CHROME_FREE_PREFIXES = [
  "/ops",
  "/ops-login",
  "/demo",
  "/sign-in",
  "/embedded-whatsapp",
  "/conectar-whatsapp",
  "/pago",
  // Mística is a self-contained case-study microsite with its own brand,
  // palette, and nav — the global chrome would double up on top of it.
  "/projects/mistica",
];

function isChromeFree(pathname: string) {
  return CHROME_FREE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function localeFromPath(pathname: string): Locale {
  return pathname.split("/")[1] === "en" ? "en" : "es";
}

/**
 * Wraps every page. Provides the qualification dialog (so any CTA anywhere
 * on the marketing site can open it) and renders the sticky nav — except on
 * routes that bring their own chrome (the app shell, auth screens, embedded
 * flows), where it's a pass-through.
 */
export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";

  if (isChromeFree(pathname)) return <>{children}</>;

  const locale = localeFromPath(pathname);
  const messages = MESSAGES[locale];

  return (
    <QualificationDialogProvider locale={locale} qualify={messages.qualify}>
      <SiteNav locale={locale} messages={messages} />
      {children}
    </QualificationDialogProvider>
  );
}
