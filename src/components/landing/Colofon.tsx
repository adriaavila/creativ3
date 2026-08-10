import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";
import AllokLogo from "@/components/brand/AllokLogo";
import Reveal from "./Reveal";

const CTA_LINKS = [
  {
    label: "Diseñar mi sistema comercial",
    href: whatsappUrl(
      "Hola, quiero diseñar mi sistema comercial con Allok. Mi negocio es:"
    ),
    primary: true,
  },
  {
    label: "Ver una demo personalizada",
    href: whatsappUrl(
      "Hola, quiero ver cómo funcionaría Allok en mi negocio. Recibimos consultas por:"
    ),
  },
  {
    label: "Hablar por WhatsApp",
    href: whatsappUrl(),
  },
];

const FOOTER_LINKS = [
  { label: "Producto", href: "/es#producto" },
  { label: "Docs", href: "/docs" },
  { label: "Precios", href: "/es#precios" },
  { label: "Agencia", href: "/projects" },
  { label: "Cotizar", href: "/cotizar" },
  { label: "Términos", href: "/es/terminos" },
  { label: "Privacidad", href: "/es/privacidad" },
];

export default function Colofon() {
  return (
    <footer id="contacto" className="relative w-full overflow-hidden border-t border-[var(--line)] scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-20 md:px-10 md:pb-16 md:pt-28">
        <Reveal className="mb-16 flex flex-col items-start gap-8 md:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--lima)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--lima)]" />
            </span>
            Disponible para nuevos proyectos
          </div>

          <h2 className="max-w-5xl text-5xl font-medium leading-[0.95] text-[var(--text-primary)] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Cuéntanos cómo recibe clientes tu negocio.
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] md:text-lg">
            Consultas, seguimiento y ventas por WhatsApp, hoy desordenadas. Conversamos tu caso y te mostramos cómo
            funcionaría Allok en tu operación.
          </p>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CTA_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                  link.primary
                    ? "bg-[var(--lima)] text-[var(--lima-ink)]"
                    : "border border-[var(--line)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {link.label}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            ))}
          </div>

          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Consulta%20Allok`}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <Mail className="h-4 w-4" aria-hidden />
            {CONTACT_EMAIL}
          </a>
        </Reveal>

        <div className="flex flex-col justify-between gap-10 border-t border-[var(--line)] pt-10 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center">
              <AllokLogo variant="lockup-bare" theme="dark" className="h-9 w-auto" />
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-[var(--text-tertiary)]">
              Allok instala un sistema comercial que organiza consultas, seguimientos y oportunidades para negocios
              que venden por WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm sm:grid-cols-4">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group inline-flex items-center gap-1 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {link.label}
                <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-[var(--line)] pt-6 text-xs text-[var(--text-tertiary)] md:flex-row md:items-center">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--text-primary)]"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            Escríbenos por WhatsApp
          </a>
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} Allok</span>
            <span className="h-1 w-1 rounded-full bg-[var(--lima)]" aria-hidden />
            <span>Sistema comercial para WhatsApp</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
