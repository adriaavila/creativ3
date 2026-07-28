import { ArrowUpRight, Mail, MessageCircle, Sparkles } from "lucide-react";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";
import CreativvLogo from "./CreativvLogo";
import Reveal from "./Reveal";

const CTA_LINKS = [
  {
    label: "Pedir landing page",
    href: whatsappUrl(
      "Hola, quiero pedir la landing page de USD 199 en 3 días con creativv. Mi negocio es:"
    ),
    primary: true,
  },
  {
    label: "Cotizar automatización",
    href: whatsappUrl(
      "Hola, quiero cotizar una automatización simple desde USD 499 con creativv. El flujo que quiero ordenar es:"
    ),
  },
  {
    label: "Cotizar web/producto",
    href: whatsappUrl(
      "Hola, quiero cotizar una web o producto desde USD 699 con creativv. Necesito construir:"
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
  { label: "Proyectos", href: "/#proyectos" },
  { label: "Servicios", href: "/#servicios" },
  { label: "Planes y Precios", href: "/#oferta" },
  { label: "WhatsApp IA", href: "/whatsapp" },
  { label: "Archivo completo", href: "/projects" },
  { label: "Cotizar", href: "/cotizar" },
  { label: "Términos", href: "/terminos" },
  { label: "Privacidad", href: "/privacidad" },
];

export default function Colofon() {
  return (
    <footer
      id="contacto"
      className="relative w-full overflow-hidden bg-[#101810] text-white scroll-mt-24"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#dbe9c3]/50 to-transparent" />
      
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-20 md:px-10 md:pb-16 md:pt-28">
        <Reveal className="mb-16 flex flex-col items-start gap-8 md:mb-20">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#dbe9c3]/30 bg-[#dbe9c3]/10 px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#dbe9c3]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#dbe9c3] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#dbe9c3]" />
            </span>
            Disponible para nuevos proyectos
          </div>

          <h2 className="max-w-5xl text-5xl font-normal leading-[0.95] text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Cuéntame qué quieres construir y empezamos.
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
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
                    ? "bg-[#dbe9c3] text-[#101810] hover:bg-white"
                    : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
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
              className="inline-flex items-center gap-2.5 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-white hover:scale-[1.02]"
            >
              <MessageCircle className="h-4 w-4 fill-black text-black" />
              WhatsApp Directo
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Consulta%20creativv`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10"
            >
              <Mail className="h-4 w-4 text-[#dbe9c3]" />
              {CONTACT_EMAIL}
            </a>
          </div>
        </Reveal>

        <div className="flex flex-col justify-between gap-10 border-t border-white/10 pt-10 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center text-white">
              <CreativvLogo variant="lockup-bare" theme="dark" className="h-9 w-auto text-white" />
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-white/55">
              Creativv es un estudio independiente que diseña landing pages, productos digitales,
              apps web y automatizaciones con IA para ayudar a negocios a crecer u operar con menos costo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm sm:grid-cols-4">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group inline-flex items-center gap-1 text-white/65 transition-colors hover:text-[#dbe9c3]"
              >
                {link.label}
                <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-white/5 pt-6 text-xs text-white/40 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} creativv. Todos los derechos reservados.</span>
          <div className="flex items-center gap-4">
            <span>ServiciosCreativos.online</span>
            <span className="h-1 w-1 rounded-full bg-[#dbe9c3]" />
            <span className="text-[#dbe9c3]/70">Diseño & Construcción de Producto</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

