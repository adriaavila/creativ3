"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AllokLogo from "@/components/brand/AllokLogo";
import { Menu, MessageCircle, X } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";

const NAV = [
  { label: "Servicios", href: "/#soluciones" },
  { label: "Trabajos", href: "/projects" },
  { label: "WhatsApp IA", href: "/whatsapp" },
  { label: "Planes", href: "/#precios" },
];

// App dashboards and internal flows hide marketing header
const HIDE_ON = [
  "/",
  "/ops",
  "/ops-login",
  "/whatsapp",
  "/sign-in",
  "/conectar-whatsapp",
  "/pago",
  "/embedded-whatsapp",
];

const DIRECT_WHATSAPP_CTA = whatsappUrl(
  "Hola allok, quiero cotizar un proyecto. Mi negocio es:"
);

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/" || /^\/(es|en)(\/|$)/.test(pathname ?? "")) return null;
  if (pathname?.startsWith("/ops/")) return null;
  if (pathname && HIDE_ON.some((p) => p !== "/" && pathname === p)) return null;

  return (
    <header className="studio-header fixed top-0 inset-x-0 z-[60]">
      <nav className="studio-nav mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6 md:px-10">
        <Link href="/" aria-label="allok" className="flex shrink-0 items-center text-black">
          <AllokLogo variant="lockup-bare" className="h-7 sm:h-8 w-auto" />
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-neutral-600 transition-colors duration-200 hover:bg-[var(--studio-surface)] hover:text-black"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={DIRECT_WHATSAPP_CTA}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-800"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Hablemos
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <a
            href={DIRECT_WHATSAPP_CTA}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 sm:inline-flex"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            WhatsApp
          </a>
          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-black transition-colors hover:bg-[var(--studio-surface)]"
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl px-4 lg:hidden">
          <div className="flex flex-col gap-1 rounded-3xl border border-neutral-200 bg-white/95 p-4 text-sm shadow-[var(--studio-shadow)] backdrop-blur-xl">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3.5 py-2.5 font-medium text-neutral-700 transition-colors hover:bg-[var(--studio-surface)] hover:text-black"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={DIRECT_WHATSAPP_CTA}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center gap-2 self-start rounded-full bg-black px-5 py-2.5 font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Hablemos por WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
