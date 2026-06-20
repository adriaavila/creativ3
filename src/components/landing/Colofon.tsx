import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
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
  { label: "Servicios", href: "#servicios" },
  { label: "Proyectos", href: "#proyectos" },
  { label: "Planes", href: "#oferta" },
  { label: "Cotizar", href: "/cotizar" },
  { label: "WhatsApp IA", href: "/whatsapp" },
  { label: "Términos", href: "/terminos" },
  { label: "Privacidad", href: "/privacidad" },
];

export default function Colofon() {
  return (
    <footer
      id="contacto"
      className="relative w-full overflow-hidden bg-[#f5f3ec] text-[#1f2a1d] scroll-mt-24"
    >
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-20 md:px-10 md:pb-12 md:pt-28">
        <Reveal className="mb-16 flex flex-col items-start gap-8 md:mb-24">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#336443]">
            Siguiente paso
          </div>
          <h2 className="max-w-5xl text-5xl font-normal leading-[0.95] text-[#336443] sm:text-6xl md:text-7xl lg:text-[5.8rem]">
            Cuéntame qué quieres construir y empezamos.
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-[#4b5b47] md:text-lg">
            Una página para vender mejor, un producto que validar o un flujo que ordenar. Dime tu
            caso y te digo el camino más simple para empezar.
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
                    ? "bg-[#1f2a1d] text-white hover:bg-[#336443]"
                    : "border border-[#1f2a1d]/15 bg-white text-[#1f2a1d] hover:bg-[#eef0e7]"
                }`}
              >
                {link.label}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Consulta%20creativv`}
              className="inline-flex items-center gap-2 rounded-full border border-[#1f2a1d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#1f2a1d] transition-colors hover:bg-[#eef0e7]"
            >
              <Mail className="h-4 w-4" />
              {CONTACT_EMAIL}
            </a>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#dbe9c3] px-5 py-3 text-sm font-semibold text-[#1f2a1d] transition-colors hover:bg-white"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </Reveal>

        <div className="flex flex-col justify-between gap-10 border-t border-[#1f2a1d]/10 pt-10 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center text-[#1f2a1d]">
              <CreativvLogo variant="lockup-bare" className="h-9 w-auto" />
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-[#4b5b47]">
              Creativv es un estudio creativo que diseña landing pages, productos digitales y
              automatizaciones para que tu negocio se vea mejor y venda más.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group inline-flex items-center gap-1 text-[#4b5b47] transition-colors hover:text-[#1f2a1d]"
              >
                {link.label}
                <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-2 text-xs text-[#4b5b47]/70 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} creativv. Todos los derechos reservados.</span>
          <span>ServiciosCreativos.online</span>
        </div>
      </div>
    </footer>
  );
}
