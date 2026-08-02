"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AllokLogo from "@/components/brand/AllokLogo";
import { MessageCircle } from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/" || /^\/(es|en)(\/|$)/.test(pathname ?? "")) return null;
  if (pathname?.startsWith("/ops/")) return null;
  if (pathname && HIDE_ON.some((p) => p !== "/" && pathname === p)) return null;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-[60] transition-all duration-300 ${
        scrolled
          ? "bg-[#08090a]/85 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-10 h-16 sm:h-[72px]">
        <Link
          href="/"
          aria-label="allok"
          className="flex items-center text-white"
        >
          <AllokLogo variant="lockup-bare" theme="dark" className="h-7 sm:h-8 w-auto text-white" />
        </Link>

        <div className="hidden lg:flex items-center gap-1 bg-white/[0.05] backdrop-blur-md rounded-full pl-6 pr-1 py-1 shadow-sm border border-white/10">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm px-3 py-2 font-medium text-white/70 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={DIRECT_WHATSAPP_CTA}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-2 bg-[#0a0a0a] hover:bg-[#26272b] border border-[#c5f04a]/30 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-[#0a0a0a]/20"
          >
            <MessageCircle className="w-4 h-4 text-[#c5f04a]" />
            Hablemos
          </a>
        </div>

        <div className="lg:hidden flex items-center gap-3">
          <a
            href={DIRECT_WHATSAPP_CTA}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#0a0a0a] hover:bg-[#26272b] border border-[#c5f04a]/30 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#c5f04a]" />
            WhatsApp
          </a>
          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <span aria-hidden="true" className="text-lg leading-none">{open ? "×" : "≡"}</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden bg-[#08090a]/95 backdrop-blur-xl border-t border-white/10">
          <div className="px-6 py-6 flex flex-col gap-2 text-sm text-white">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2 font-medium text-white/80 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={DIRECT_WHATSAPP_CTA}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="self-start mt-2 inline-flex items-center gap-2 bg-[#0a0a0a] hover:bg-[#26272b] border border-[#c5f04a]/30 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#c5f04a]" />
              Hablemos por WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
