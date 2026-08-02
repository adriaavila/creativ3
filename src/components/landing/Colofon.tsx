import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";
import AllokLogo from "@/components/brand/AllokLogo";
import Reveal from "./Reveal";

const CTA_LINKS = [
  {
    label: "Pedir landing page",
    href: whatsappUrl(
      "Hola, quiero pedir la landing page de USD 199 en 3 días con allok. Mi negocio es:"
    ),
    primary: true,
  },
  {
    label: "Cotizar automatización",
    href: whatsappUrl(
      "Hola, quiero cotizar una automatización simple desde USD 499 con allok. El flujo que quiero ordenar es:"
    ),
  },
  {
    label: "Cotizar web/producto",
    href: whatsappUrl(
      "Hola, quiero cotizar una web o producto desde USD 699 con allok. Necesito construir:"
    ),
  },
  {
    label: "Escribir por WhatsApp",
    href: whatsappUrl(
      "Hola, quiero mejorar mi presencia digital para captar más leads. Mi caso es:"
    ),
  },
];

const FOOTER_LINKS = [
  { label: "Servicios", href: "/#soluciones" },
  { label: "Trabajos", href: "/projects" },
  { label: "Planes y Precios", href: "/#precios" },
  { label: "WhatsApp IA", href: "/whatsapp" },
  { label: "Cotizar", href: "/cotizar" },
  { label: "Términos", href: "/terminos" },
  { label: "Privacidad", href: "/privacidad" },
];

export default function Colofon() {
  return (
    <footer
      id="contacto"
      className="studio relative w-full overflow-hidden bg-white text-black scroll-mt-24"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c5f04a]/60 to-transparent" />

      <div className="mx-auto max-w-6xl px-6 pb-12 pt-20 md:px-10 md:pb-16 md:pt-28">
        <Reveal className="mb-16 flex flex-col items-start gap-8 md:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/70 px-3.5 py-1.5 text-[12px] font-semibold backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c5f04a] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c5f04a]" />
            </span>
            Disponible para nuevos proyectos
          </div>

          <h2 className="max-w-5xl text-5xl font-normal leading-[0.95] text-black sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Cuéntame qué quieres construir y empezamos.
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-neutral-600 md:text-lg">
            Una landing page para vender mejor, un producto que validar o un flujo con WhatsApp que automatizar.
            Conversamos tu caso directo y te doy el camino más simple.
          </p>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CTA_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                  link.primary
                    ? "bg-black text-white hover:bg-neutral-800"
                    : "border border-black/15 bg-white text-black hover:bg-[var(--studio-surface)]"
                }`}
              >
                {link.label}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:brightness-95"
            >
              <MessageCircle className="h-4 w-4 fill-black text-black" />
              WhatsApp Directo
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Consulta%20allok`}
              className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-[var(--studio-surface)]"
            >
              <Mail className="h-4 w-4" aria-hidden />
              {CONTACT_EMAIL}
            </a>
          </div>
        </Reveal>

        <div className="flex flex-col justify-between gap-10 border-t border-black/10 pt-10 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center text-black">
              <AllokLogo variant="lockup-bare" className="h-9 w-auto" />
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-neutral-500">
              allok es un estudio independiente que diseña landing pages, productos digitales,
              apps web y automatizaciones con IA para ayudar a negocios a crecer u operar con menos costo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm sm:grid-cols-4">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group inline-flex items-center gap-1 text-neutral-600 transition-colors hover:text-black"
              >
                {link.label}
                <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-black/5 pt-6 text-xs text-neutral-400 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} allok. Todos los derechos reservados.</span>
          <div className="flex items-center gap-4">
            <span>ServiciosCreativos.online</span>
            <span className="h-1 w-1 rounded-full bg-[#c5f04a]" />
            <span className="text-neutral-500">Diseño & Construcción de Producto</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
