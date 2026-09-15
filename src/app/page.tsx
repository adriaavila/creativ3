import type { Metadata } from "next";
import Link from "next/link";
import { whatsappUrl } from "@/lib/contact";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";
import { AllokMark, ReiMark, VoceroMark } from "@/components/allok/Marks";
import { PORTFOLIO_PROJECTS } from "@/lib/projects";

const TITLE = "allok — software que atiende, vende y deja registro";
const DESCRIPTION =
  "allok construye software comercial: REI, el CRM de WhatsApp para inmobiliarias; Vocero, agentes de WhatsApp a medida; y la agencia que diseña y despliega el resto. Diseño, código y deploy por el mismo par de manos.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const HOME_MESSAGE =
  "Hola, vengo de allok.fun. Quiero contarte qué necesita mi negocio.";

const NAV = [
  { href: "/rei", label: "REI" },
  { href: "/vocero", label: "Vocero" },
  { href: "/agencia", label: "Agencia" },
  { href: "/portfolio", label: "Portafolio" },
];

/**
 * Las tres puertas de la casa. El orden no es casual: primero lo que se compra
 * solo, después lo que se cotiza, al final lo que se conversa.
 */
const DOORS = [
  {
    href: "/rei",
    Mark: ReiMark,
    name: "allok × rei",
    kind: "Producto",
    line: "El CRM de WhatsApp para inmobiliarias.",
    body: "Responde, califica y agenda visitas en el número de siempre de la corredora. Mensualidad fija; Meta le cobra los mensajes a tu empresa, al costo.",
    action: "Ver planes",
    featured: true,
  },
  {
    href: "/vocero",
    Mark: VoceroMark,
    name: "allok × vocero",
    kind: "A medida",
    line: "El agente de WhatsApp de tu operación, no de una plantilla.",
    body: "Cuando el negocio tiene reglas propias — inventario, turnos, cobros, un ERP que hay que consultar — Vocero se construye alrededor de ellas.",
    action: "Cómo funciona",
    featured: false,
  },
  {
    href: "/agencia",
    Mark: AllokMark,
    name: "allok agencia",
    kind: "Todo lo demás",
    line: "Tiendas, paneles, portales, automatizaciones.",
    body: "El software comercial que tu negocio necesita y nadie te quiere construir. Diseño, frontend, backend y despliegue por el mismo par de manos.",
    action: "Qué construimos",
    featured: false,
  },
] as const;

export default function Home() {
  // En producción = `launched`. Los prototipos y las demos del portafolio van
  // rotulados aparte y no entran en esta cifra.
  const live = PORTFOLIO_PROJECTS.filter((p) => p.status === "launched").length;

  return (
    <div className="allok">
      {/* ── El cielo: la portada es el degradado, la cabecera flota encima ── */}
      <div className="allok-sky pb-[190px]">
        <SiteHeader nav={NAV} cta={{ href: whatsappUrl(HOME_MESSAGE), label: "Hablemos" }} />

        <div className="mx-auto max-w-[1000px] px-5 pt-10 text-center sm:px-10 sm:pt-20">
          <p className="mono opacity-85">Diseño y software comercial · Latinoamérica</p>
          <h1 className="display mt-6 text-[clamp(42px,7vw,92px)]">
            Software que atiende
            <br />
            a tus clientes.
          </h1>
          <p className="mx-auto mt-6 max-w-[600px] text-[clamp(17px,1.4vw,20px)] leading-relaxed opacity-85 text-pretty">
            Un producto que ya está en producción, una versión a medida para
            quien no cabe en un plan, y una agencia para todo lo que no es
            WhatsApp. Diseño, código y despliegue por el mismo par de manos.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href={whatsappUrl(HOME_MESSAGE)} className="allok-btn allok-btn-solid">
              Contar qué necesito
            </a>
            <Link href="/portfolio" className="allok-btn allok-btn-outline">
              Ver el portafolio
            </Link>
          </div>
        </div>
      </div>

      {/* ── Las tres puertas rompen el borde del cielo ── */}
      <div className="relative z-[3] -mt-[150px] px-5 sm:px-10">
        <div className="mx-auto grid max-w-[1200px] gap-4 lg:grid-cols-3">
          {DOORS.map((door) => (
            <Link
              key={door.href}
              href={door.href}
              className={`group grid content-start rounded-[22px] border p-7 shadow-[0_30px_80px_-38px_rgba(0,0,0,.45)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(.23,1,.32,1)] active:scale-[.98] ${
                door.featured
                  ? "border-transparent bg-[#101112] text-[#f5f4f0]"
                  : "border-[rgba(16,17,18,.08)] bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <door.Mark size={38} />
                <span className={`mono ${door.featured ? "text-[var(--lit-dawn)]" : "text-[var(--dusk)]"}`}>
                  {door.kind}
                </span>
              </div>
              <h2 className="display-sm mt-6 text-[22px]">{door.name}</h2>
              <p className="mt-2 text-[16px] font-medium leading-snug text-pretty">{door.line}</p>
              <p
                className={`mt-3 text-[14.5px] leading-relaxed text-pretty ${
                  door.featured ? "opacity-65" : "text-[var(--ink-60)]"
                }`}
              >
                {door.body}
              </p>
              <span className="mono mt-6 inline-flex items-center gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
                {door.action} <span aria-hidden="true">↗</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── La prueba. Nada de esto es una maqueta ── */}
      <section className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <div className="grid gap-10 border-t border-[var(--line)] pt-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <p className="mono text-[var(--dusk)]">La prueba</p>
            <h2 className="display mt-4 text-[clamp(30px,4vw,50px)] text-balance">
              {live} sistemas en producción, con capturas reales.
            </h2>
          </div>
          <div>
            <p className="text-[16px] leading-relaxed text-[var(--ink-60)] text-pretty">
              El portafolio no lleva mockups: cada captura es el producto
              corriendo, y cada ficha dice qué hace, quién lo usa y qué lo
              sostiene. Algunos están vivos y cobrando; otros son prototipos
              que construí para responder una pregunta. Los dos van marcados.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/portfolio"
                className="allok-btn border border-[rgba(16,17,18,.22)] text-[var(--ink)]"
              >
                Portafolio
              </Link>
              <Link
                href="/lab"
                className="allok-btn border border-[rgba(16,17,18,.14)] text-[var(--ink-60)]"
              >
                Lab
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-20 sm:pt-28" />
      <SiteFooter />
    </div>
  );
}
