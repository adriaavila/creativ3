"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import AllokLogo from "@/components/brand/AllokLogo";

const NAV = [
  { href: "#trabajo", label: "Trabajo" },
  { href: "#por-dentro", label: "Por dentro" },
  { href: "#indice", label: "Índice" },
  { href: "#estudio", label: "Estudio" },
];

/** Una cápsula de vidrio que flota sobre todo y se esconde al bajar rápido. */
export default function Cabecera() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > 600 && y > prev + 4 && !open);
    if (y < prev - 4) setHidden(false);
  });

  return (
    <motion.header
      className="fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-5"
      animate={{ y: hidden ? -110 : 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex w-full max-w-[880px] flex-col rounded-[22px] border border-white/10 bg-[rgba(14,15,18,.62)] text-[var(--cream)] shadow-[0_20px_50px_-20px_rgba(0,0,0,.6)] backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center justify-between gap-4 py-2 pl-5 pr-2">
          <Link href="/" aria-label="allok, inicio" className="inline-flex min-h-11 items-center">
            <AllokLogo variant="wordmark" on="ink" state="activo" size={17} live />
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-1 text-sm md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="rounded-full px-3.5 py-2.5 text-[var(--cream-60)] transition-colors hover:bg-white/5 hover:text-[var(--cream)]">
                {n.label}
              </a>
            ))}
          </nav>
          <a
            href="#contacto"
            className="hidden min-h-10 items-center rounded-full bg-[var(--cream)] px-4 text-sm font-semibold text-[var(--ink)] transition-transform hover:-translate-y-px md:inline-flex"
          >
            Contacto
          </a>
          <button
            type="button"
            className="v-mono min-h-11 rounded-full px-4 text-[11px] md:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Cerrar" : "Menú"}
          </button>
        </div>
        {open ? (
          <nav id="menu-movil" aria-label="Principal" className="flex flex-col px-3 pb-3 md:hidden">
            {[...NAV, { href: "#contacto", label: "Contacto" }].map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-t border-white/10 px-2 py-4 text-2xl font-semibold tracking-[-0.03em]">
                {n.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </motion.header>
  );
}
