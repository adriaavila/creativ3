import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Proyectos · Servicios Creativos",
  description: "Casos de estudio de software a medida y productos hechos en LATAM.",
};

const PROJECTS = [
  {
    slug: "mistica",
    n: "I",
    name: "Mística",
    kicker: "Escuela de natación",
    desc: "Operación de una escuela de natación: alumnos, asistencia y cobros en bolívares y divisa, en una sola app.",
    href: "/projects/mistica",
    live: "https://mistica-app-fawn.vercel.app/",
    year: "2026",
    stack: ["Next.js", "Supabase", "Tailwind"],
  },
  {
    slug: "shopea",
    n: "II",
    name: "Shopea",
    kicker: "Catálogo + checkout en un link",
    desc: "Vender en línea como por WhatsApp, pero en serio. Precios duales Bs / divisa, pedidos al WhatsApp, sin comisión.",
    href: "/shopea",
    live: null,
    year: "2026",
    stack: ["Next.js", "Edge"],
  },
];

export default function ProjectsIndex() {
  return (
    <main className="relative z-10 min-h-screen px-6 sm:px-12 pt-32 sm:pt-40 pb-32 max-w-6xl mx-auto">
      <div className="flex justify-between items-start text-xs sm:text-sm font-mono tracking-wide opacity-80 mb-20 text-papiro-soft">
        <Link href="/" className="hover:text-papiro transition-colors">
          ← Volver a inicio
        </Link>
        <span>VOL. I · PROYECTOS</span>
      </div>

      <h1
        className="font-display leading-[0.92] tracking-tight mb-4"
        style={{ fontSize: "clamp(48px, 8vw, 140px)" }}
      >
        Lo que hemos
        <br />
        <span className="italic text-cobalto">construido.</span>
      </h1>
      <p className="text-papiro-soft font-mono text-sm sm:text-base max-w-xl mb-20">
        Cada proyecto es una escuela, una bodega, un consultorio. Software con
        nombre y apellido, no plantilla genérica.
      </p>

      <ul className="border-t border-papiro/15">
        {PROJECTS.map((p) => (
          <li key={p.slug} className="border-b border-papiro/15 group">
            <Link
              href={p.href}
              className="grid grid-cols-12 gap-4 sm:gap-6 py-8 sm:py-12 items-baseline hover-target"
            >
              <span className="col-span-1 font-editorial text-2xl sm:text-4xl text-papiro-soft/70">
                {p.n}
              </span>
              <div className="col-span-7 sm:col-span-7">
                <h2 className="font-display text-3xl sm:text-6xl tracking-tight transition-transform duration-500 group-hover:translate-x-2">
                  {p.name}
                </h2>
                <p className="font-mono text-papiro-soft text-sm mt-2 max-w-xl">
                  {p.desc}
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {p.stack.map((s) => (
                    <span
                      key={s}
                      className="text-[11px] font-mono tracking-wide px-2 py-0.5 border border-papiro/20 rounded-full text-papiro-soft/80"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <span className="hidden sm:block col-span-2 font-mono text-sm text-papiro-soft/70">
                {p.kicker}
              </span>
              <span className="col-span-4 sm:col-span-2 text-right font-mono text-sm text-cobalto group-hover:text-papiro transition-colors">
                Ver caso ↗
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-24 font-mono text-sm text-papiro-soft/70">
        ¿Tu proyecto va aquí?{" "}
        <Link
          href="/#contacto"
          className="text-cobalto hover:text-papiro transition-colors"
        >
          Cotiza con nosotros →
        </Link>
      </div>
    </main>
  );
}
