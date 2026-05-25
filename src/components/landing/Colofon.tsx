import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";
import CreativvLogo from "./CreativvLogo";

const CONTACT_WHATSAPP_URL = whatsappUrl(
  "Hola, quiero hablar con creativv. Estoy buscando mejorar mi web, producto o automatizacion con IA. Mi negocio es:"
);

export default function Colofon() {
  return (
    <footer
      id="contacto"
      className="relative w-full bg-[#f5f3ec] text-[#1f2a1d] scroll-mt-24 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-24 md:pt-32 pb-12">
        {/* Big CTA */}
        <div className="flex flex-col items-start gap-8 mb-20 md:mb-28">
          <div className="text-xs font-medium tracking-widest uppercase text-[#85AB8B]">
            Siguiente paso
          </div>
          <h2
            className="text-[#336443] font-normal leading-[0.95] text-5xl sm:text-6xl md:text-7xl lg:text-[6.5rem] max-w-5xl"
          >
            Si hay potencial, lo vemos en una conversacion.
          </h2>
          <p className="text-[#4b5b47] text-base md:text-lg max-w-xl leading-relaxed">
            Envia tu web, tu oferta y el cuello de botella que mas te cuesta. Te respondemos con una ruta concreta:
            que arreglar, que automatizar, cuanto tarda y que no deberias construir todavia.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-2">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Diagnostico%20creativv`}
              className="inline-flex items-center gap-2 bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <Mail className="w-4 h-4" />
              {CONTACT_EMAIL}
            </a>
            <a
              href={CONTACT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-white/80 text-[#1f2a1d] border border-[#1f2a1d]/15 text-sm font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>

        {/* Meta + links */}
        <div className="border-t border-[#1f2a1d]/10 pt-10 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div>
            <div className="flex items-center mb-4 text-[#1f2a1d]">
              <CreativvLogo variant="lockup-bare" className="h-9 w-auto" />
            </div>
            <p className="text-xs text-[#4b5b47] max-w-xs leading-relaxed">
              Estudio de diseño, código e IA para negocios que quieren verse mas caros,
              responder mas rapido y operar con menos ruido.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
            {[
              { label: "Oferta", href: "#oferta" },
              { label: "Clinicas", href: "/clinicas" },
              { label: "Inmobiliarias", href: "/inmobiliarias" },
              { label: "Ecommerce", href: "/ecommerce" },
              { label: "Academias", href: "/academias" },
              { label: "Servicios", href: "#servicios" },
              { label: "Proyectos", href: "#proyectos" },
              { label: "Cotizar", href: "/cotizar" },
              { label: "Términos", href: "/terminos" },
              { label: "Privacidad", href: "/privacidad" },
              { label: "Eliminación de datos", href: "/eliminacion-de-datos" },
              { label: "WhatsApp Business", href: "/embedded-whatsapp" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group inline-flex items-center gap-1 text-[#4b5b47] hover:text-[#1f2a1d] transition-colors"
              >
                {l.label}
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs text-[#4b5b47]/70">
          <span>© {new Date().getFullYear()} creativv. Todos los derechos reservados.</span>
          <span>10.4806° N · 66.9036° W</span>
        </div>
      </div>
    </footer>
  );
}
