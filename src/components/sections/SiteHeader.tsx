"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import CreativvLogo from "@/components/landing/CreativvLogo";

const NAV = [
  { label: "Servicios", href: "/#servicios" },
  { label: "Proyectos", href: "/#proyectos" },
  { label: "Contacto", href: "/#contacto" },
];

const HIDE_ON = ["/projects/mistica", "/"];

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

  if (pathname === "/") return null;
  if (pathname && HIDE_ON.some((p) => p !== "/" && pathname.startsWith(p))) return null;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-[60] transition-all duration-300 ${
        scrolled
          ? "bg-[#f5f3ec]/85 backdrop-blur-xl border-b border-[#1f2a1d]/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-10 h-16 sm:h-[72px]">
        <Link
          href="/"
          aria-label="creativv"
          className="flex items-center text-[#1f2a1d]"
        >
          <CreativvLogo variant="lockup-bare" className="h-7 sm:h-8 w-auto" />
        </Link>

        <div className="hidden lg:flex items-center gap-1 bg-white/70 backdrop-blur-md rounded-full pl-6 pr-1 py-1 shadow-sm border border-white/60">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm px-3 py-2 font-medium text-[#4b5b47] hover:text-[#1f2a1d] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#contacto"
            className="ml-2 bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            Cotizar proyecto
          </Link>
        </div>

        <div className="lg:hidden flex items-center gap-3">
          <Link
            href="/#contacto"
            className="hidden sm:inline-flex bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-xs font-medium px-4 py-2 rounded-full transition-colors"
          >
            Cotizar
          </Link>
          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/70 backdrop-blur-md border border-white/60 text-[#1f2a1d] hover:bg-white/90 transition-colors"
          >
            <span aria-hidden="true" className="text-lg leading-none">{open ? "×" : "≡"}</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-[#1f2a1d]/10">
          <div className="px-6 py-6 flex flex-col gap-2 text-sm text-[#1f2a1d]">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2 font-medium hover:text-[#336443] transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/#contacto"
              onClick={() => setOpen(false)}
              className="self-start mt-2 bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              Cotizar proyecto
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
