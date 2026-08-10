"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, MessageCircle, X } from "lucide-react";
import { track } from "@vercel/analytics";
import AllokLogo from "@/components/brand/AllokLogo";
import { whatsappUrl } from "@/lib/contact";
import type { Locale, Messages } from "@/lib/i18n";
import { useQualificationDialog } from "./QualificationDialogProvider";

// `src/lib/i18n` is `server-only`; this client component builds locale
// paths inline instead of importing `localePath` at runtime.
const localePath = (locale: Locale) => `/${locale}`;

export default function SiteNav({ locale, messages }: { locale: Locale; messages: Messages }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const { open: openQualification } = useQualificationDialog();
  const nav = messages.home.nav;
  const home = localePath(locale);
  const otherLocale: Locale = locale === "es" ? "en" : "es";

  // Close the mobile menu on navigation without an effect: adjusting state
  // during render (React's documented pattern for "reset when a prop
  // changes") avoids the extra commit a useEffect would cost here.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const navHref = (anchor: string) =>
    pathname === home || pathname === "/" ? `#${anchor}` : `${home}#${anchor}`;
  const navItems = [
    { label: nav[0], href: navHref("producto") },
    { label: nav[1], href: navHref("como-funciona") },
    { label: nav[2], href: "/docs" },
    { label: nav[3], href: navHref("precios") },
    { label: nav[4], href: "/projects" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border border-[var(--line)] bg-[var(--surface-1)] px-3 py-2 shadow-[var(--shadow-2)] sm:px-4"
      >
        <Link href={home} aria-label="Allok" className="flex shrink-0 items-center text-[var(--text-primary)]">
          <AllokLogo variant="lockup-bare" theme="dark" className="h-7 w-auto sm:h-8" />
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={localePath(otherLocale)}
            className="hidden rounded-full px-2.5 py-1.5 font-mono text-xs font-medium uppercase text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] sm:inline-flex"
          >
            {otherLocale}
          </Link>
          <Link
            href="/ops-login"
            className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] sm:inline-flex"
          >
            {messages.common.enter}
          </Link>
          <button
            type="button"
            onClick={() => {
              track("whatsapp_cta", { location: "nav" });
              openQualification();
            }}
            className="hidden items-center gap-1.5 rounded-full bg-[var(--lima)] px-4 py-2 text-sm font-semibold text-[var(--lima-ink)] transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            {messages.common.demoCta}
          </button>
          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--line)] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)] lg:hidden"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="allok-enter mx-auto mt-2 max-w-6xl overflow-hidden rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface-1)] p-2 shadow-[var(--shadow-3)] lg:hidden"
        >
          <div className="flex flex-col gap-0.5 p-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-[var(--r-md)] px-4 py-3 text-base font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/ops-login"
              onClick={() => setOpen(false)}
              className="rounded-[var(--r-md)] px-4 py-3 text-base font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)]"
            >
              {messages.common.enter}
            </Link>
          </div>
          <div className="flex flex-col gap-2 border-t border-[var(--line)] p-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                track("whatsapp_cta", { location: "nav_mobile" });
                openQualification();
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--lima)] px-5 text-sm font-semibold text-[var(--lima-ink)]"
            >
              {messages.common.demoCta}
            </button>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_cta", { location: "nav_mobile_direct" })}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--text-primary)]"
            >
              <MessageCircle className="size-4" aria-hidden />
              {messages.common.whatsapp}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
