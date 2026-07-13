"use client";

import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import type { LandingIntent } from "@/lib/landing-intent";
import CreativvLogo from "./CreativvLogo";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";

const REVENUE_CONTACT = whatsappUrl(
  "Hola, quiero cotizar una experiencia digital para aumentar ingresos. Mi negocio es:"
);

const FOOTER_CONTENT = {
  efficiency: {
    eyebrow: "Empezar · reducir costos",
    title: "Trae el proceso.",
    accent: "Diseñamos el sistema.",
    body: "Antes de hablar de precio, ponemos número a lo que el proceso cuesta hoy. Si la solución no recupera capacidad de forma clara, te lo decimos antes de cobrar.",
    primaryLabel: "Calcular ahorro",
    primaryHref: "/cotizar",
    secondaryLabel: "Contar mi proceso",
    secondaryHref: whatsappUrl(
      "Hola, quiero reducir el costo operativo de mi negocio. El proceso que quiero revisar es:"
    ),
    description:
      "Estudio independiente de automatización, software y agentes: menos horas en tareas repetitivas, menos costo de operar.",
    starts: [
      ["Automatización", "Desde USD 499", "5–10 días", "Un flujo completo, visible y supervisable", "/automatizar"],
      ["Dashboard operativo", "Desde USD 499", "5–10 días", "Reportes y decisiones en una sola superficie", "/cotizar"],
      ["App a medida", "Desde USD 699", "10–21 días", "Tu operación convertida en producto", "/cotizar"],
    ],
  },
  revenue: {
    eyebrow: "Empezar · aumentar ingresos",
    title: "Trae la ambición.",
    accent: "Diseñamos la conversión.",
    body: "Alineamos oferta, experiencia y dirección visual para que tu próximo visitante entienda el valor, confíe más rápido y sepa exactamente cómo comprar.",
    primaryLabel: "Cotizar mi proyecto",
    primaryHref: REVENUE_CONTACT,
    secondaryLabel: "Ver proyectos",
    secondaryHref: "#trabajo",
    description:
      "Estudio independiente de estrategia, UX/UI y software para marcas que quieren verse a la altura de lo que venden.",
    starts: [
      ["Landing page", "Desde USD 199", "3–5 días", "Una oferta clara lista para captar demanda", REVENUE_CONTACT],
      ["Diseño web", "Desde USD 699", "10–21 días", "Marca, narrativa y recorrido comercial", REVENUE_CONTACT],
      ["Ecommerce", "Alcance a medida", "14–28 días", "Catálogo, checkout y pago sin fricción", "/ecommerce"],
    ],
  },
} as const;

type OutcomeFooterProps = {
  intent?: LandingIntent;
};

export default function OutcomeFooter({ intent = "efficiency" }: OutcomeFooterProps) {
  const isRevenue = intent === "revenue";
  const content = FOOTER_CONTENT[intent];
  const primaryIsExternal = content.primaryHref.startsWith("http");
  const secondaryIsExternal = content.secondaryHref.startsWith("http");

  return (
    <footer
      id="empezar"
      className={`px-5 pb-10 pt-24 text-white transition-colors duration-700 sm:px-8 lg:px-12 lg:pt-32 ${
        isRevenue ? "bg-[#2a1712]" : "bg-[#172016]"
      }`}
    >
      <div key={intent} className="landing-intent-enter mx-auto max-w-[1440px]">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div
              className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
                isRevenue ? "text-[#f3a78d]" : "text-[#b8d397]"
              }`}
            >
              {content.eyebrow}
            </div>
            <h2 className="mt-5 max-w-5xl font-display text-[clamp(3.4rem,8vw,8.4rem)] leading-[0.84] tracking-[-0.05em]">
              {content.title}
              <span className={`block italic ${isRevenue ? "text-[#f0a38a]" : "text-[#cfe3b1]"}`}>
                {content.accent}
              </span>
            </h2>
          </div>
          <div className="max-w-xl lg:justify-self-end">
            <p className="text-base leading-7 text-white/58 sm:text-lg">{content.body}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={content.primaryHref}
                target={primaryIsExternal ? "_blank" : undefined}
                rel={primaryIsExternal ? "noopener noreferrer" : undefined}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors ${
                  isRevenue
                    ? "bg-[#f0a38a] text-[#2a1712] hover:bg-white"
                    : "bg-[#dbe9c3] text-[#172016] hover:bg-white"
                }`}
              >
                {content.primaryLabel} <ArrowRight className="size-4" />
              </a>
              <a
                href={content.secondaryHref}
                target={secondaryIsExternal ? "_blank" : undefined}
                rel={secondaryIsExternal ? "noopener noreferrer" : undefined}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold transition-colors hover:bg-white/8"
              >
                {content.secondaryLabel}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {content.starts.map(([name, price, time, payoff, href]) => {
            const isExternal = href.startsWith("http");

            return (
              <a
                key={name}
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className={`group p-5 transition-colors sm:p-6 ${
                  isRevenue ? "bg-[#2a1712] hover:bg-[#3b2119]" : "bg-[#172016] hover:bg-[#203023]"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.17em] text-white/38">
                  {time}
                  <ArrowRight className="size-3.5 -rotate-45 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <div className="mt-4 font-display text-2xl">{name}</div>
                <div className={`mt-2 text-sm ${isRevenue ? "text-[#f0a38a]" : "text-[#cfe3b1]"}`}>{price}</div>
                <div className="mt-2 text-xs leading-5 text-white/45">{payoff}</div>
              </a>
            );
          })}
        </div>

        <div className="mt-20 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <CreativvLogo variant="lockup-bare" className="h-9 w-auto text-white" />
            <p className="mt-4 max-w-md text-sm leading-6 text-white/45">{content.description}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/65 hover:text-white"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 text-white/65 hover:text-white">
              <Mail className="size-4" /> Email
            </a>
            <Link href="/privacidad" className="text-white/45 hover:text-white">
              Privacidad
            </Link>
          </div>
        </div>
        <div className="mt-10 flex flex-col justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.13em] text-white/28 sm:flex-row">
          <span>© {new Date().getFullYear()} Creativv</span>
          <span>ServiciosCreativos.online</span>
        </div>
      </div>
    </footer>
  );
}
