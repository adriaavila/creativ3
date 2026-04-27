"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { label: "Servicios", href: "/#servicios" },
  { label: "Método", href: "/#metodo" },
  { label: "Proyectos", href: "/projects" },
];

const HIDE_ON = ["/projects/mistica", "/shopea"];

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

  if (pathname && HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-[60] transition-all duration-500 ${
        scrolled
          ? "bg-noche/70 backdrop-blur-md border-b border-papiro/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-12 h-16 sm:h-[72px]">
        <Link
          href="/"
          className="font-display text-xl sm:text-2xl tracking-tight text-papiro hover-target shrink-0"
        >
          Servicios<span className="text-cobalto italic">Creativos</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-mono text-sm text-papiro-soft">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-papiro transition-colors hover-target"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Link
          href="/#contacto"
          className="hidden sm:inline-block border border-papiro/30 px-5 py-2 rounded-full text-sm font-mono hover:bg-papiro hover:text-noche transition-colors duration-500 hover-target"
        >
          Contacto
        </Link>

        <button
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 border border-papiro/30 rounded-full text-papiro hover-target"
        >
          <span className="sr-only">Menú</span>
          <span aria-hidden="true" className="text-lg leading-none">
            {open ? "×" : "≡"}
          </span>
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-noche/95 backdrop-blur-md border-t border-papiro/10">
          <div className="px-6 py-6 flex flex-col gap-4 font-mono text-sm text-papiro-soft">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="hover:text-papiro transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/#contacto"
              onClick={() => setOpen(false)}
              className="self-start border border-papiro/30 px-5 py-2 rounded-full hover:bg-papiro hover:text-noche transition-colors"
            >
              Contacto
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
