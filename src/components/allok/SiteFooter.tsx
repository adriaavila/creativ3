import Link from "next/link";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";
import { Lockup } from "./Marks";

/**
 * El pie es el mapa del sitio, y separa las dos cosas que la gente confunde:
 * la **agencia** es lo que se contrata, el **portafolio** es la prueba de que
 * funciona. Una columna cada una, nunca mezcladas.
 */
const COLUMNS = [
  {
    title: "Productos",
    links: [
      { href: "/", label: "allok · planes y precios" },
      { href: "/rei", label: "REI · edición inmobiliaria" },
      { href: "/vocero", label: "allok a tu medida" },
    ],
  },
  {
    title: "Agencia",
    links: [
      { href: "/agencia", label: "Qué construimos" },
      { href: "/agencia#como-trabajamos", label: "Cómo trabajamos" },
      { href: "/agencia#precios", label: "Qué cuesta" },
    ],
  },
  {
    title: "Portafolio",
    links: [
      { href: "/portfolio", label: "Portafolio" },
      { href: "/work", label: "Work" },
      { href: "/lab", label: "Lab" },
      { href: "/writing", label: "Writing" },
    ],
  },
] as const;

export default function SiteFooter() {
  return (
    <footer className="bg-[var(--ink)] px-5 py-12 text-[#f5f4f0] sm:px-10 sm:py-16">
      <div className="mx-auto grid max-w-[1200px] gap-11 lg:grid-cols-[1.25fr_1.75fr]">
        <div>
          <Lockup size={34} />
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="allok-sky-text display mt-3 block py-2 text-[clamp(28px,3.4vw,44px)]"
          >
            {CONTACT_EMAIL}
          </a>
          <a
            href={whatsappUrl()}
            className="mono inline-flex min-h-11 items-center opacity-70 transition-opacity hover:opacity-100"
          >
            WhatsApp ↗
          </a>
        </div>

        <div className="mono grid grid-cols-2 gap-x-7 gap-y-9 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title} className="grid content-start opacity-70">
              <span className="mb-1 text-[var(--lit-dusk)] opacity-80">{col.title}</span>
              {col.links.map((link) => (
                <Link key={link.href} href={link.href} className="py-3.5 transition-opacity hover:opacity-100">
                  {link.label} ↗
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="allok-sky-rule mx-auto mt-10 max-w-[1200px]" />

      <div className="mono mx-auto mt-2 flex max-w-[1200px] flex-wrap items-center justify-between gap-x-3 gap-y-1 opacity-70">
        <span>© {new Date().getFullYear()} allok</span>
        <span className="flex flex-wrap gap-x-5">
          <a href="https://github.com/adriaavila" className="inline-flex min-h-11 items-center">GitHub ↗</a>
          <Link href="/es/privacidad" className="inline-flex min-h-11 items-center">Privacidad</Link>
          <Link href="/es/terminos" className="inline-flex min-h-11 items-center">Términos</Link>
          <Link href="/eliminacion-de-datos" className="inline-flex min-h-11 items-center">Eliminación de datos</Link>
        </span>
      </div>
    </footer>
  );
}
