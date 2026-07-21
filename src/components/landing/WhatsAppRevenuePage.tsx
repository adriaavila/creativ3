"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Gauge,
  Handshake,
  LayoutDashboard,
  MessageCircle,
  MousePointer2,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";
import { whatsappUrl } from "@/lib/contact";
import CreativvLogo from "./CreativvLogo";

const AUDIT_MESSAGE =
  "Hola, quiero una auditoria gratis para convertir mas mensajes de WhatsApp en clientes.";

const DEMO_MESSAGE =
  "Hola, quiero ver una demo del Sistema WhatsApp Revenue en 7 dias.";

const FOUNDER_MESSAGE =
  "Hola, quiero reservar un cupo founder LATAM del Growth System por $249 setup + $69/mes.";

const NAV_LINKS = [
  { href: "#sistema", label: "Sistema" },
  { href: "#demo", label: "Demo" },
  { href: "#precios", label: "Precios" },
  { href: "#auditoria", label: "Auditoria" },
];

const PAINS = [
  {
    icon: Clock3,
    title: "Respondes tarde",
    copy: "El cliente pregunta precio, se enfria y nunca vuelve.",
  },
  {
    icon: RefreshCw,
    title: "No hay seguimiento",
    copy: "Muchos dicen \"te aviso\" y nadie los recupera.",
  },
  {
    icon: ClipboardList,
    title: "Todo esta desordenado",
    copy: "Los leads quedan mezclados con chats normales.",
  },
  {
    icon: BarChart3,
    title: "No sabes que canal vende mas",
    copy: "Instagram, referidos, campanas... pero sin datos claros.",
  },
];

const SYSTEM_STEPS = [
  "Entra un mensaje",
  "El sistema responde rapido",
  "Califica la necesidad",
  "Envia informacion clara",
  "Hace seguimiento",
  "Agenda, cotiza o deriva",
  "Todo queda organizado",
];

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Asistente de WhatsApp",
    copy: "Responde preguntas frecuentes, servicios, precios, horarios y ubicacion.",
  },
  {
    icon: UserCheck,
    title: "Calificacion de leads",
    copy: "Detecta necesidad, presupuesto, urgencia y nivel de interes antes del cierre.",
  },
  {
    icon: RefreshCw,
    title: "Seguimiento automatico",
    copy: "Recupera conversaciones despues de 2h, 24h, 3 dias y 7 dias.",
  },
  {
    icon: MousePointer2,
    title: "Mini landing o cotizador",
    copy: "Una pagina simple para enviar trafico desde Instagram, TikTok o anuncios.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard de leads",
    copy: "Organiza contactos por estado: nuevo, interesado, agendado, perdido o cliente.",
  },
  {
    icon: Handshake,
    title: "Scripts de venta",
    copy: "Mensajes listos para tomar el control humano y cerrar mejor.",
  },
  {
    icon: Gauge,
    title: "Optimizacion semanal",
    copy: "Revisamos preguntas repetidas, caidas del flujo y mejoras de conversion.",
  },
];

const DEMOS = {
  clinic: {
    label: "Clinica",
    title: "Limpieza facial",
    source: "Instagram Ads",
    status: "Cita sugerida",
    messages: [
      ["client", "Hola, cuanto cuesta una limpieza facial?"],
      [
        "system",
        "Hola. Tenemos varias opciones segun tu tipo de piel y objetivo. Para recomendarte mejor: buscas limpieza basica, profunda o tratamiento para acne/manchas?",
      ],
      ["client", "Quiero algo para manchas. Esta semana si se puede."],
      [
        "system",
        "Perfecto. Te recomiendo evaluacion inicial + limpieza profunda. Tenemos horarios jueves 4:30 pm o viernes 10:00 am. Quieres que te reserve uno?",
      ],
    ],
    details: ["Interes: manchas", "Urgencia: esta semana", "Siguiente accion: agendar"],
  },
  realEstate: {
    label: "Inmobiliaria",
    title: "Apartamento en alquiler",
    source: "Facebook Marketplace",
    status: "Lead calificado",
    messages: [
      ["client", "Buenas, sigue disponible el apartamento de Los Palos Grandes?"],
      [
        "system",
        "Si, sigue disponible. Para ayudarte rapido: buscas alquiler o compra, cuantas habitaciones necesitas y cual es tu presupuesto mensual?",
      ],
      ["client", "Alquiler, 2 habitaciones, hasta $900. Puedo verlo manana."],
      [
        "system",
        "Cumple con el rango. Te puedo mostrar disponibilidad manana a las 11:00 am o 3:00 pm. Tambien te envio requisitos antes de coordinar la visita.",
      ],
    ],
    details: ["Presupuesto: $900", "Operacion: alquiler", "Siguiente accion: visita"],
  },
} as const;

const AUDIENCES = [
  "Clinicas y consultorios",
  "Estudios de belleza",
  "Academias y cursos",
  "Inmobiliarias",
  "Restaurantes con reservas",
  "Fotografos y eventos",
  "Talleres y servicios tecnicos",
  "Agencias y freelancers con muchos leads",
];

const DELIVERABLES = [
  "Auditoria de tu flujo actual de WhatsApp",
  "Diseno del flujo de conversacion",
  "Respuestas frecuentes y objeciones",
  "Automatizacion de seguimiento",
  "Mini landing o cotizador",
  "Dashboard simple de leads",
  "Scripts para cerrar ventas",
  "Revision y optimizacion inicial",
];

const HERMES_SERVICES = [
  "Asesoria sobre oportunidades y objeciones detectadas en tus chats",
  "Envios asistidos para seguimiento, recordatorios y recuperacion de leads",
  "Resumenes ejecutivos de conversaciones de WhatsApp para decidir rapido",
];

const PRICING = [
  {
    id: "whatsapp_starter",
    name: "Starter Sprint",
    price: "$149 setup + $49/mes",
    bestFor: "Negocios pequenos que quieren responder mejor y recuperar leads basicos.",
    cta: "Empezar con Starter",
    features: [
      "Flujo de preguntas frecuentes",
      "Mensajes de seguimiento",
      "Mini base de datos de leads",
      "1 revision inicial",
      "Soporte por WhatsApp",
    ],
  },
  {
    id: "whatsapp_growth",
    name: "Growth System",
    price: "$299 setup + $89/mes",
    bestFor: "Negocios que quieren calificar leads, agendar mejor y tener mas control.",
    cta: "Quiero el Growth System",
    recommended: true,
    features: [
      "Todo lo de Starter",
      "Flujo de calificacion avanzado",
      "Mini landing/cotizador",
      "Dashboard de leads",
      "Scripts de cierre",
      "Optimizacion semanal inicial",
    ],
  },
  {
    id: "whatsapp_premium",
    name: "Premium Revenue System",
    price: "$699 setup + $179/mes",
    bestFor: "Negocios con mas volumen, anuncios o equipo comercial.",
    cta: "Aplicar a Premium",
    features: [
      "Todo lo de Growth",
      "Funnel completo desde Instagram/anuncios",
      "Hermes Agent para orquestacion, borradores y resumenes",
      "Dashboard mas avanzado",
      "Segmentacion de leads",
      "Reporte semanal",
      "Optimizacion continua",
    ],
  },
];

const PROCESS = [
  ["Dia 1", "Auditoria", "Revisamos como entran tus leads, que preguntan y donde se pierden."],
  ["Dia 2", "Diseno del flujo", "Creamos la conversacion ideal para responder, calificar y avanzar."],
  ["Dia 3-4", "Implementacion", "Montamos mensajes, seguimiento, dashboard y landing."],
  ["Dia 5", "Pruebas", "Probamos preguntas reales, objeciones y escenarios comunes."],
  ["Dia 6-7", "Lanzamiento", "Activamos el sistema y revisamos los primeros resultados."],
];

const CAPABILITIES = [
  "Apps SaaS",
  "Plataformas para negocios",
  "Automatizacion con IA",
  "Landing pages de conversion",
  "Dashboards internos",
  "Sistemas para operaciones",
];

const FAQS = [
  [
    "Esto reemplaza a mi equipo?",
    "No. Ayuda a responder mas rapido, ordenar leads y avisar cuando una persona necesita atencion humana.",
  ],
  [
    "Necesito tener conocimientos tecnicos?",
    "No. Instalamos el sistema y te entregamos una operacion simple para usar y revisar.",
  ],
  [
    "Funciona si vendo por Instagram?",
    "Si. La idea es conectar tu trafico de Instagram, TikTok, anuncios o referidos hacia un flujo mas claro de WhatsApp.",
  ],
  [
    "Puedo usarlo si recibo pocos mensajes?",
    "Si, pero funciona mejor si recibes leads todas las semanas y cada cliente tiene valor suficiente.",
  ],
  ["Cuanto tarda?", "El primer sistema funcional puede quedar listo en 7 dias."],
  [
    "Que pasa despues del primer mes?",
    "Se mantiene el sistema, se ajustan respuestas, se revisan conversaciones y se optimiza para convertir mejor.",
  ],
  ["Puedo cancelar?", "Si. El setup es unico y el mantenimiento mensual se puede cancelar segun las condiciones acordadas."],
];

async function startCheckout(plan: string) {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(data.error || "No se pudo iniciar el pago.");
  }
  window.location.assign(data.url);
}

function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#173322] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(23,51,34,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#285238] ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

function SecondaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#173322]/15 bg-white px-5 py-3 text-sm font-semibold text-[#173322] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#173322]/30 hover:bg-[#f6f1e4] ${className}`}
    >
      {children}
    </a>
  );
}

function HeroMockup() {
  const pipeline = ["Nuevo lead", "Calificado", "Seguimiento", "Cita agendada", "Cliente"];

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="absolute -left-4 top-10 hidden h-36 w-36 rounded-full border border-[#173322]/10 md:block" />
      <div className="relative overflow-hidden rounded-[28px] border border-[#173322]/12 bg-[#fffdf7] p-3 shadow-[0_28px_90px_rgba(23,51,34,0.16)]">
        <div className="rounded-[22px] bg-[#173322] p-4 text-white">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b7d989] text-[#173322]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">WhatsApp Revenue</div>
                <div className="text-xs text-white/55">Sistema activo</div>
              </div>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              7 dias
            </div>
          </div>

          <div className="space-y-3 rounded-2xl bg-[#f6f1e4] p-4 text-[#173322]">
            <div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm shadow-sm">
              Hola, tienen cupo para una consulta esta semana?
            </div>
            <div className="ml-auto max-w-[86%] rounded-2xl rounded-br-sm bg-[#dff5c1] px-4 py-3 text-sm shadow-sm">
              Si. Para ayudarte rapido: que servicio buscas y que dia te funciona mejor?
            </div>
            <div className="max-w-[74%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm shadow-sm">
              Primera vez. Quiero precio y horarios.
            </div>
            <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-[#dff5c1] px-4 py-3 text-sm shadow-sm">
              Te envio opciones y dejo tu lead marcado para seguimiento si no reservas hoy.
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2 rounded-[22px] bg-white p-4">
          {pipeline.map((item, index) => (
            <div key={item} className="flex items-center gap-3">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  index < 4 ? "bg-[#173322] text-white" : "bg-[#c57b39] text-white"
                }`}
              >
                {index + 1}
              </div>
              <div className="h-2 flex-1 rounded-full bg-[#edf0e5]">
                <div
                  className={`h-full rounded-full ${index < 4 ? "bg-[#7fae61]" : "bg-[#c57b39]"}`}
                  style={{ width: `${44 + index * 13}%` }}
                />
              </div>
              <span className="w-28 text-xs font-semibold text-[#173322]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroBackground() {
  const signalBars = [
    ["top-[18%]", "right-[10%]", "w-36"],
    ["top-[30%]", "right-[3%]", "w-28"],
    ["top-[58%]", "right-[12%]", "w-40"],
    ["top-[72%]", "right-[5%]", "w-24"],
  ];

  const messageGhosts = [
    ["top-[16%]", "right-[31%]", "w-32", "rotate-[2deg]"],
    ["top-[55%]", "right-[4%]", "w-36", "rotate-[1deg]"],
    ["bottom-[18%]", "right-[28%]", "w-44", "rotate-[-1deg]"],
  ];

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(116deg,#fffaf0_0%,#f6f1e4_42%,#e8f0dc_100%)]" />
      <div
        className="absolute inset-y-0 right-0 hidden w-[57%] md:block"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(23,51,34,0.07) 1px, transparent 1px), linear-gradient(0deg, rgba(23,51,34,0.055) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(90deg, transparent 0%, black 24%, black 78%, transparent 100%)",
        }}
      />
      <div className="absolute inset-y-0 right-0 hidden w-[52%] bg-[linear-gradient(110deg,transparent_0%,rgba(183,217,137,0.2)_42%,rgba(23,51,34,0.09)_100%)] md:block" />
      <div className="absolute left-0 top-0 h-full w-1/2 bg-[linear-gradient(90deg,rgba(255,253,247,0.62)_0%,transparent_100%)]" />

      {signalBars.map(([top, right, width]) => (
        <div
          key={`${top}-${right}`}
          className={`absolute ${top} ${right} hidden ${width} rounded-full border border-[#173322]/10 bg-white/44 px-3 py-2 shadow-sm backdrop-blur-sm md:block`}
        >
          <div className="h-1.5 rounded-full bg-[#173322]/18" />
        </div>
      ))}

      {messageGhosts.map(([topOrBottom, side, width, rotate]) => (
        <div
          key={`${topOrBottom}-${side}`}
          className={`absolute ${topOrBottom} ${side} hidden ${width} ${rotate} rounded-2xl border border-white/70 bg-white/38 p-3 shadow-[0_18px_60px_rgba(23,51,34,0.07)] backdrop-blur-sm lg:block`}
        >
          <div className="h-1.5 w-2/3 rounded-full bg-[#173322]/13" />
          <div className="mt-2 h-1.5 w-full rounded-full bg-[#7fae61]/18" />
        </div>
      ))}

      <div className="absolute bottom-0 left-0 right-0 h-px bg-[#173322]/10" />
    </div>
  );
}

function RevenueCalculator() {
  const [messages, setMessages] = useState(80);
  const [late, setLate] = useState(20);
  const [value, setValue] = useState(50);

  const result = useMemo(() => {
    const lostLeads = Math.max(0, Math.min(messages, late));
    return {
      lostLeads,
      lostRevenue: lostLeads * Math.max(0, value),
    };
  }, [late, messages, value]);

  return (
    <section className="bg-[#173322] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.85fr_1.15fr] md:px-10 md:py-20">
        <div>
          <h2 className="text-4xl font-normal leading-[1] tracking-tight md:text-5xl">
            Cuanto dinero se queda en chats sin cerrar?
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/68">
            Ajusta los numeros de tu negocio. La meta no es prometer magia: es ver si vale la pena recuperar conversaciones.
          </p>
        </div>

        <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-5 md:p-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["Mensajes al mes", messages, setMessages, 1, 500, 1],
              ["Respondes tarde", late, (val: number) => setLate(Math.min(val, messages)), 0, messages, 1],
              ["Valor por cliente", value, setValue, 10, 2000, 10],
            ].map(([label, current, setter, min, max, step]) => (
              <div key={label as string} className="grid gap-2">
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-[0.16em]">
                  <span className="text-white/45">{label as string}</span>
                  <span className="text-[#b7d989] font-mono text-sm font-bold">{current as number}</span>
                </div>
                <input
                  type="range"
                  min={min as number}
                  max={max as number}
                  step={step as number}
                  value={current as number}
                  onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#b7d989] hover:bg-white/20 transition-all"
                />
              </div>
            ))}
            <div className="md:col-span-3 mt-6 grid gap-4 rounded-2xl bg-[#f6f1e4] p-5 text-[#173322] md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="text-sm font-semibold text-[#5d6b59]">Estimacion simple</div>
                <p className="mt-1 text-base sm:text-lg font-semibold">
                  Si pierdes {result.lostLeads} leads al mes y cada cliente vale ${value}, estas dejando hasta{" "}
                  <span className="text-[#b45f19]">${result.lostRevenue.toLocaleString("en-US")}</span> sobre la mesa.
                </p>
              </div>
              <PrimaryButton href={whatsappUrl(AUDIT_MESSAGE)} className="shadow-none">
                Revisar mi caso
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  const [active, setActive] = useState<keyof typeof DEMOS>("clinic");
  const demo = DEMOS[active];

  return (
    <section id="demo" className="bg-[#f6f1e4] text-[#173322] scroll-mt-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[0.86fr_1.14fr] md:px-10 md:py-28">
        <div>
          <h2 className="text-4xl font-normal leading-[1] tracking-tight md:text-6xl">
            Demo honesta, con dos negocios comunes.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#51614d]">
            El objetivo no es reemplazar a tu equipo. El objetivo es que ningun cliente interesado se quede sin respuesta.
          </p>
          <div className="mt-8 inline-flex rounded-full border border-[#173322]/12 bg-white p-1">
            {Object.entries(DEMOS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key as keyof typeof DEMOS)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active === key ? "bg-[#173322] text-white" : "text-[#51614d] hover:text-[#173322]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="rounded-[28px] border border-[#173322]/12 bg-white p-4 shadow-[0_20px_60px_rgba(23,51,34,0.08)]">
            <div className="mb-4 flex items-center justify-between border-b border-[#173322]/8 pb-4">
              <div>
                <div className="text-sm font-semibold">{demo.title}</div>
                <div className="text-xs text-[#51614d]">Fuente: {demo.source}</div>
              </div>
              <div className="rounded-full bg-[#dff5c1] px-3 py-1 text-xs font-semibold text-[#285238]">
                {demo.status}
              </div>
            </div>
            <div className="space-y-3">
              {demo.messages.map(([role, text], index) => (
                <div
                  key={`${role}-${index}`}
                  className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    role === "client"
                      ? "rounded-bl-sm bg-[#f2f0e8] text-[#173322]"
                      : "ml-auto rounded-br-sm bg-[#dff5c1] text-[#173322]"
                  }`}
                >
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#173322]/12 bg-[#173322] p-5 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
              Panel lead
            </div>
            <div className="mt-5 space-y-3">
              {demo.details.map((item) => (
                <div key={item} className="rounded-xl bg-white/8 px-3 py-3 text-sm text-white/82">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-[#c57b39] px-3 py-3 text-sm font-semibold text-white">
              Vendedor recibe contexto listo para cerrar.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuditForm() {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[28px] border border-[#173322]/12 bg-white p-5 shadow-[0_20px_70px_rgba(23,51,34,0.1)] md:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Nombre", "text"],
          ["Negocio", "text"],
          ["Instagram o web", "text"],
          ["WhatsApp", "tel"],
          ["Que vendes?", "text"],
          ["Cuantos mensajes recibes por semana?", "number"],
        ].map(([label, type]) => (
          <label key={label} className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6a7564]">
              {label}
            </span>
            <input
              required
              type={type}
              className="h-12 rounded-xl border border-[#173322]/12 bg-[#fbfaf5] px-4 text-sm font-medium text-[#173322] outline-none transition focus:border-[#7fae61] focus:ring-2 focus:ring-[#7fae61]/25"
            />
          </label>
        ))}
      </div>

      {submitted ? (
        <div className="mt-5 rounded-2xl bg-[#dff5c1] p-4 text-sm font-medium leading-relaxed text-[#173322]">
          Gracias. Revisaremos tu negocio y te enviaremos una mini auditoria con oportunidades claras para convertir mas leads por WhatsApp.
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#173322] px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#285238]"
        >
          Enviar auditoria
          <Send className="h-4 w-4" />
        </button>
        <SecondaryButton href={whatsappUrl(AUDIT_MESSAGE)} className="flex-1">
          Hablar por WhatsApp
        </SecondaryButton>
      </div>
    </form>
  );
}

export default function WhatsAppRevenuePage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleCheckout(plan: string) {
    setLoadingPlan(plan);
    try {
      await startCheckout(plan);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo iniciar el pago.");
      setLoadingPlan(null);
    }
  }

  return (
    <main className="relative bg-[#f6f1e4] text-[#173322] selection:bg-[#b7d989]/45 selection:text-[#173322]">
      <header className="absolute inset-x-0 top-0 z-30">
        <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 md:px-10">
          <Link href="/" aria-label="creativv" className="text-[#173322]">
            <CreativvLogo variant="lockup-bare" className="h-8 w-auto" />
          </Link>

          <div className="hidden items-center gap-1 rounded-full border border-[#173322]/10 bg-white/78 py-1 pl-5 pr-1 shadow-sm backdrop-blur-md lg:flex">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-[#51614d] transition-colors hover:text-[#173322]"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#demo"
              className="ml-2 inline-flex items-center gap-2 rounded-full bg-[#edf0e5] px-4 py-2.5 text-sm font-semibold text-[#173322] transition-colors hover:bg-[#dff5c1]"
            >
              Ver demo
            </a>
            <a
              href="#auditoria"
              className="inline-flex items-center gap-2 rounded-full bg-[#173322] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#285238]"
            >
              Agendar auditoria
            </a>
          </div>

          <a
            href={whatsappUrl(AUDIT_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#173322] px-4 py-2.5 text-sm font-semibold text-white lg:hidden"
          >
            Auditoria
          </a>
        </nav>
      </header>

      <section className="relative overflow-hidden pt-24 md:pt-24">
        <HeroBackground />
        <div className="relative mx-auto grid gap-10 px-6 pb-14 md:min-h-[760px] md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-10 lg:max-w-6xl">
          <div>
            <h1 className="max-w-4xl text-[3.35rem] font-normal leading-[0.95] tracking-tight text-[#173322] sm:text-6xl md:text-7xl lg:text-[5rem]">
              Convierte tus mensajes de WhatsApp en clientes.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#44543f] md:text-xl">
              Instalamos un sistema de ventas con IA para responder, calificar, dar seguimiento y agendar clientes automaticamente en 7 dias.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#65715f] md:text-base">
              Ideal para clinicas, estudios, academias, inmobiliarias, restaurantes, negocios locales y servicios que venden por WhatsApp.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href={whatsappUrl(AUDIT_MESSAGE)}>
                Quiero una auditoria gratis
              </PrimaryButton>
              <SecondaryButton href={whatsappUrl(DEMO_MESSAGE)}>
                Ver demo por WhatsApp
              </SecondaryButton>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[#65715f]">
              <span>Sin apps complicadas</span>
              <span>Sin cambiar tu operacion</span>
              <span>Sin perder mas leads por responder tarde</span>
            </div>
          </div>

          <HeroMockup />
        </div>
      </section>

      <section className="bg-[#fffdf7] text-[#173322]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
          <div className="grid gap-8 md:grid-cols-[0.95fr_1.05fr] md:items-end">
            <h2 className="text-4xl font-normal leading-[1] tracking-tight md:text-5xl">
              Tu negocio probablemente ya tiene clientes interesados. El problema es que muchos se pierden en WhatsApp.
            </h2>
            <p className="text-base leading-relaxed text-[#51614d] md:text-lg">
              No siempre necesitas mas seguidores o mas anuncios. Primero necesitas convertir mejor los mensajes que ya recibes.
            </p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-4">
            {PAINS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-[#173322]/10 bg-[#f6f1e4] p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_55px_rgba(23,51,34,0.08)]"
                >
                  <Icon className="h-5 w-5 text-[#b45f19]" />
                  <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#51614d]">{item.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <RevenueCalculator />

      <section id="sistema" className="bg-[#f6f1e4] text-[#173322] scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-4xl font-normal leading-[1] tracking-tight md:text-6xl">
                Instalamos un sistema simple para vender mejor por WhatsApp.
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-[#51614d]">
                Creamos un flujo que responde preguntas frecuentes, entiende que necesita cada persona, califica el lead, hace seguimiento automatico y avisa cuando alguien esta listo para comprar o agendar.
              </p>
            </div>

            <div className="grid gap-3">
              {SYSTEM_STEPS.map((step, index) => (
                <div
                  key={step}
                  className="grid grid-cols-[44px_1fr_auto] items-center gap-4 rounded-2xl border border-[#173322]/10 bg-white px-4 py-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173322] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <span className="text-base font-semibold">{step}</span>
                  <ChevronRight className="h-4 w-4 text-[#7fae61]" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-3xl font-normal tracking-tight md:text-5xl">Que incluye el sistema</h2>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded-2xl border border-[#173322]/10 bg-white p-5">
                    <Icon className="h-5 w-5 text-[#285238]" />
                    <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#51614d]">{feature.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <DemoSection />

      <section className="bg-[#fffdf7] text-[#173322]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-28">
          <div>
            <h2 className="text-4xl font-normal leading-[1] tracking-tight md:text-5xl">
              Funciona especialmente bien para negocios que reciben mensajes todos los dias.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#51614d]">
              Si tus clientes preguntan por WhatsApp antes de comprar, este sistema puede ayudarte a vender mas sin depender de estar conectado todo el dia.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {AUDIENCES.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#173322]/10 bg-[#f6f1e4] px-4 py-4 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7fae61]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#173322] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-28">
          <div>
            <h2 className="text-4xl font-normal leading-[1] tracking-tight md:text-6xl">
              Sistema WhatsApp Revenue en 7 dias
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/68">
              En una semana dejamos instalado un sistema funcional para responder, calificar, dar seguimiento y organizar tus leads.
            </p>
            <PrimaryButton href={whatsappUrl(AUDIT_MESSAGE)} className="mt-8 bg-white !text-[#173322] shadow-none hover:bg-[#dff5c1]">
              Quiero mi auditoria gratis
            </PrimaryButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {DELIVERABLES.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-white/82">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#b7d989]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="precios" className="bg-[#f6f1e4] text-[#173322] scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h2 className="text-4xl font-normal leading-[1] tracking-tight md:text-6xl">
                Elige el nivel ideal para tu negocio.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#51614d]">
                Precios ajustados para negocios LATAM. Setup accesible para instalar, mensualidad simple para mantener y optimizar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCheckout("whatsapp_founder")}
              disabled={loadingPlan === "whatsapp_founder"}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#c57b39] px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#ad6729] disabled:cursor-wait disabled:opacity-70"
            >
              {loadingPlan === "whatsapp_founder" ? "Abriendo pago..." : "Pagar sprint"}
              <Zap className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PRICING.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex h-full flex-col rounded-[26px] border p-6 shadow-sm ${
                  plan.recommended
                    ? "border-[#173322] bg-white shadow-[0_24px_70px_rgba(23,51,34,0.12)]"
                    : "border-[#173322]/10 bg-white/78"
                }`}
              >
                {plan.recommended ? (
                  <div className="absolute right-5 top-5 rounded-full bg-[#dff5c1] px-3 py-1 text-xs font-bold text-[#285238]">
                    Mas recomendado
                  </div>
                ) : null}
                <h3 className="pr-28 text-2xl font-semibold">{plan.name}</h3>
                <div className="mt-4 text-3xl font-semibold tracking-tight text-[#173322]">
                  {plan.price}
                </div>
                <p className="mt-4 min-h-16 text-sm leading-relaxed text-[#51614d]">{plan.bestFor}</p>
                <div className="mt-6 grid flex-1 gap-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex gap-2 text-sm text-[#51614d]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7fae61]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className={`mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 ${
                    plan.recommended
                      ? "bg-[#173322] text-white hover:bg-[#285238]"
                      : "border border-[#173322]/15 bg-[#f6f1e4] text-[#173322] hover:bg-[#dff5c1]"
                  }`}
                >
                  {loadingPlan === plan.id ? "Abriendo pago..." : plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf7] text-[#173322]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-24">
          <div className="grid overflow-hidden rounded-[32px] border border-[#173322]/10 bg-[#173322] text-white md:grid-cols-[1fr_0.8fr]">
            <div className="p-7 md:p-10">
              <h2 className="text-4xl font-normal leading-[1] tracking-tight md:text-6xl">
                Oferta founder: primeros 5 negocios
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70">
                Estoy abriendo 5 cupos para instalar este sistema con precio especial y sumar Hermes Agent como capa de consultoria operativa.
              </p>
              <div className="mt-8 text-3xl font-semibold text-[#dff5c1] md:text-4xl">
                Growth System por $249 setup + $69/mes
              </div>
              <p className="mt-3 text-sm text-white/55">
                Incluye asesoria, contenido y envios aprobados, mas resumenes de chats de WhatsApp durante el lanzamiento.
              </p>
              <div className="mt-6 grid gap-2">
                {HERMES_SERVICES.map((service) => (
                  <div key={service} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/78">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#dff5c1]" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PrimaryButton href={whatsappUrl(FOUNDER_MESSAGE)} className="bg-white !text-[#173322] shadow-none hover:bg-[#dff5c1]">
                  Reservar cupo founder
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => handleCheckout("whatsapp_founder")}
                  disabled={loadingPlan === "whatsapp_founder"}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-wait disabled:opacity-70"
                >
                  {loadingPlan === "whatsapp_founder" ? "Abriendo pago..." : "Pagar sprint"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="border-t border-white/10 bg-white/[0.05] p-7 md:border-l md:border-t-0 md:p-10">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                Meta primeros 30 dias
              </div>
              <div className="mt-6 space-y-4">
                {[
                  ["5 clientes setup", "$1,245 cash"],
                  ["5 primeros meses", "$345 MRR"],
                  ["Total estimado", "$1,590 cobrado"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-sm text-white/68">{label}</span>
                    <span className="text-lg font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f1e4] text-[#173322]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr]">
            <div>
              <h2 className="text-4xl font-normal leading-[1] tracking-tight md:text-6xl">Como funciona</h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-[#51614d]">
                Un sprint cerrado, con decisiones rapidas y entregables visibles desde la primera semana.
              </p>
            </div>
            <div className="grid gap-3">
              {PROCESS.map(([day, title, copy]) => (
                <div key={day} className="grid gap-3 rounded-2xl border border-[#173322]/10 bg-white p-5 md:grid-cols-[92px_1fr]">
                  <div className="text-sm font-bold uppercase tracking-[0.14em] text-[#b45f19]">{day}</div>
                  <div>
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#51614d]">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf7] text-[#173322]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-end">
            <div>
              <h2 className="text-4xl font-normal leading-[1] tracking-tight md:text-6xl">
                No somos una agencia de teoria. Construimos productos reales.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[#51614d]">
                Servicios Creativos combina diseno de producto, software, automatizacion e inteligencia artificial para crear sistemas que se pueden usar en el mundo real.
              </p>
            </div>
            <div className="rounded-[26px] border border-[#173322]/10 bg-[#f6f1e4] p-6">
              <ShieldCheck className="h-6 w-6 text-[#7fae61]" />
              <p className="mt-4 text-lg font-semibold leading-snug">
                Estamos buscando los primeros casos publicos de este sistema. Por eso los primeros 5 negocios tendran precio founder.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {CAPABILITIES.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#173322]/10 bg-white px-4 py-4 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-[#b45f19]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f1e4] text-[#173322]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <h2 className="text-4xl font-normal leading-[1] tracking-tight md:text-6xl">Preguntas frecuentes</h2>
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {FAQS.map(([question, answer]) => (
              <details key={question} className="group rounded-2xl border border-[#173322]/10 bg-white p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {question}
                  <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-[#51614d]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="auditoria" className="bg-[#fffdf7] text-[#173322] scroll-mt-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-28">
          <div>
            <h2 className="text-5xl font-normal leading-[0.98] tracking-tight md:text-7xl">
              Deja de perder clientes en WhatsApp.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#51614d] md:text-lg">
              Te damos una auditoria gratis y te mostramos donde se estan perdiendo oportunidades en tu proceso actual.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href={whatsappUrl(AUDIT_MESSAGE)}>
                Quiero mi auditoria gratis
              </PrimaryButton>
              <SecondaryButton href={whatsappUrl(AUDIT_MESSAGE)}>
                Hablar por WhatsApp
              </SecondaryButton>
            </div>
          </div>
          <AuditForm />
        </div>
      </section>

      <footer className="bg-[#173322] pb-24 text-white md:pb-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-end md:justify-between md:px-10">
          <div>
            <CreativvLogo variant="lockup-bare" className="h-9 w-auto text-white" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/58">
              Sistema WhatsApp Revenue en 7 dias por Servicios Creativos.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/64">
            <a href="/terminos" className="hover:text-white">Terminos</a>
            <a href="/privacidad" className="hover:text-white">Privacidad</a>
            <a href="/embedded-whatsapp" className="hover:text-white">WhatsApp Business</a>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#173322]/10 bg-[#fffdf7]/95 p-3 shadow-[0_-18px_50px_rgba(23,51,34,0.1)] backdrop-blur md:hidden">
        <a
          href={whatsappUrl(AUDIT_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#173322] px-5 py-3 text-sm font-semibold text-white"
        >
          Auditoria gratis
          <CalendarCheck className="h-4 w-4" />
        </a>
      </div>
    </main>
  );
}
