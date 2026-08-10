import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import AllokLogo from "@/components/brand/AllokLogo";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";
import type { Locale, Messages } from "@/lib/i18n";

export default function SiteFooter({ locale, messages }: { locale: Locale; messages: Messages }) {
  const { common, home } = messages;
  const legalBase = `/${locale}`;

  const links = [
    { label: home.nav[0], href: `${legalBase}#producto` },
    { label: home.nav[1], href: `${legalBase}#como-funciona` },
    { label: home.nav[2], href: "/docs" },
    { label: home.nav[3], href: `${legalBase}#precios` },
    { label: home.nav[4], href: "/projects" },
    { label: common.terms, href: `${legalBase}/terminos` },
    { label: common.privacy, href: `${legalBase}/privacidad` },
  ];

  return (
    <footer className="border-t border-[var(--line)] py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div>
            <AllokLogo variant="lockup-bare" theme="dark" className="h-8 w-auto" />
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-[var(--text-tertiary)]">
              {home.footer}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
            >
              <MessageCircle className="size-3.5" aria-hidden />
              WhatsApp
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
            >
              <Mail className="size-3.5" aria-hidden />
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 border-t border-[var(--line)] pt-6 text-xs text-[var(--text-tertiary)] sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Allok. Todos los derechos reservados.</span>
          <span className="inline-flex items-center gap-2">
            <span className="size-1 rounded-full bg-[var(--lima)]" aria-hidden />
            Sistema comercial para negocios que venden por conversación
          </span>
        </div>
      </div>
    </footer>
  );
}
