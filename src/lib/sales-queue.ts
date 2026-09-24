/**
 * La cola de ventas de `/ops`: a quién le hablo hoy y qué le pido.
 *
 * Todo es determinista y sale de columnas que `leads` ya tiene
 * (`status`, `next_action`, `next_action_at`, `last_contacted_at`): nada de
 * ranking por IA, y nada que migrar para arrancar.
 *
 * El día y la semana son los de Caracas, no UTC: a las 9 p.m. en Caracas UTC
 * ya es mañana, y la cola adelantaría un día los seguimientos.
 */
import type { GrowthLead, LeadStatus } from "./growth-types";
import { PLANS, SETUP_SERVICE } from "./plans";

export const SALES_TZ = "America/Caracas";

/**
 * «Pedí el pago» se guarda como prefijo de `next_action`, porque el `CHECK` de
 * `leads.status` no tiene un estado para eso.
 * ponytail: marcador en texto; el día que haga falta contar cada toque (dos
 * conversaciones con la misma persona), va una tabla `sales_touches`.
 */
export const ASKED_PREFIX = "Pago pedido";

export type Stage = "asked" | "interested" | "first";
export type Outcome = "talked" | "asked" | "paid" | "not_now";
export type Offer = "vocero" | "rei" | "agencia";

const STAGE_RANK: Record<Stage, number> = { asked: 0, interested: 1, first: 2 };
const CLOSED: LeadStatus[] = ["won", "lost"];

/** `YYYY-MM-DD` del instante en la zona dada. */
export function localDate(at: Date | string, tz = SALES_TZ): string {
  // Por partes y no con `format()`: el orden de una locale lo puede cambiar el navegador.
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(typeof at === "string" ? new Date(at) : at);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** El lunes de la semana de `ymd`. */
export function weekStart(ymd: string): string {
  const day = new Date(`${ymd}T12:00:00Z`).getUTCDay(); // 0 = domingo
  return addDays(ymd, -((day + 6) % 7));
}

export function stageOf(lead: Pick<GrowthLead, "status" | "nextAction">): Stage | null {
  if (CLOSED.includes(lead.status)) return null;
  if (lead.nextAction?.startsWith(ASKED_PREFIX)) return "asked";
  if (lead.status === "replied" || lead.status === "meeting_booked") return "interested";
  return "first";
}

/** Lo que toca hoy: abiertos con fecha vencida, primero a quien ya se le pidió el pago. */
export function salesQueue(leads: GrowthLead[], today: string): GrowthLead[] {
  return leads
    .filter((lead) => stageOf(lead) && lead.nextActionAt && lead.nextActionAt.slice(0, 10) <= today)
    .sort(
      (a, b) =>
        STAGE_RANK[stageOf(a)!] - STAGE_RANK[stageOf(b)!] ||
        a.nextActionAt!.localeCompare(b.nextActionAt!) ||
        a.createdAt.localeCompare(b.createdAt),
    );
}

/** Abiertos con fecha futura: no son de hoy, pero existen. */
export function upcomingCount(leads: GrowthLead[], today: string): number {
  return leads.filter((lead) => stageOf(lead) && lead.nextActionAt && lead.nextActionAt.slice(0, 10) > today).length;
}

/**
 * La semana contra la meta de 5 conversaciones.
 * ponytail: cuenta leads tocados esta semana, no conversaciones; hablar dos
 * veces con la misma persona suma una. Límite conocido hasta `sales_touches`.
 */
export function weekStats(leads: GrowthLead[], today: string) {
  const from = weekStart(today);
  const touched = leads.filter((lead) => lead.lastContactedAt && localDate(lead.lastContactedAt) >= from);
  return {
    conversations: touched.length,
    asked: touched.filter((lead) => lead.nextAction?.startsWith(ASKED_PREFIX) || lead.status === "won").length,
    paid: touched.filter((lead) => lead.status === "won").length,
  };
}

/**
 * Lo que escribe cada botón de «Qué pasó». Siempre toca `last_contacted_at`.
 * Un pago pedido no se des-pide: si ya se pidió, «Hablamos» lo deja en «pago
 * pedido» y «No por ahora» conserva la marca, para que la semana no lo reste.
 */
export function outcomePatch(
  outcome: Outcome,
  today: string,
  reason?: string,
  wasAsked = false,
): { status: LeadStatus; nextAction: string | null; nextActionAt: string | null } {
  const asked = { status: "meeting_booked" as const, nextAction: `${ASKED_PREFIX}: confirmar`, nextActionAt: addDays(today, 2) };
  switch (outcome) {
    case "talked":
      return wasAsked ? asked : { status: "replied", nextAction: "Pedir el pago", nextActionAt: addDays(today, 2) };
    case "asked":
      return asked;
    case "paid":
      return { status: "won", nextAction: null, nextActionAt: null };
    case "not_now": {
      const why = `No por ahora: ${reason?.trim() || "sin motivo"}`;
      return { status: "lost", nextAction: wasAsked ? `${ASKED_PREFIX} · ${why}` : why, nextActionAt: null };
    }
  }
}

/**
 * Un teléfono como lo pide `wa.me`: sólo dígitos, con código de país. Un número
 * venezolano local (`0412…`) se lleva a `58412…`. `null` si no alcanza para
 * ser un número.
 */
export function waDigits(phone: string | null | undefined): string | null {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = `58${digits.slice(1)}`;
  return digits.length >= 10 ? digits : null;
}

const esencial = PLANS.find((plan) => plan.key === "esencial")!;

/**
 * El borrador que abre WhatsApp. Adrian lo lee y lo manda desde su teléfono.
 * Sólo Vocero lleva precio: es el único con hoja de precios (`plans.ts`). REI
 * y agencia piden el pago sin cifra hasta tener la suya.
 */
export function messageFor(stage: Stage, lead: Pick<GrowthLead, "businessName" | "offerAngle">): string {
  if (stage === "asked") {
    return "¿Pudiste ver lo del pago? Si lo confirmas hoy, esta semana lo dejamos andando.";
  }
  const offer = lead.offerAngle;
  if (stage === "first") {
    if (offer === "rei") {
      return "Hola, soy Adrian de allok. Armamos un CRM de WhatsApp para inmobiliarias: cada interesado queda anotado con su inmueble y su próximo paso. ¿Te lo muestro en 15 minutos?";
    }
    if (offer === "agencia") {
      return "Hola, soy Adrian de allok. Hacemos webs y automatizaciones para negocios que venden por WhatsApp. ¿Te cuento en 15 minutos qué haría con el tuyo?";
    }
    return `Hola, soy Adrian de allok. Armamos un agente que contesta el WhatsApp de ${lead.businessName} a cualquier hora y deja cada cliente anotado. ¿Te muestro en 15 minutos cómo quedaría con tu negocio?`;
  }
  if (offer === "agencia") {
    return "¿Arrancamos esta semana? Te paso la propuesta con el precio cerrado y el link de pago.";
  }
  if (offer === "rei") {
    return "¿Arrancamos esta semana? Te paso el plan y el link de pago.";
  }
  return `Para dejarlo andando: el plan ${esencial.name} es US$${esencial.price} al mes y la ${SETUP_SERVICE.name.toLowerCase()} US$${SETUP_SERVICE.price}, que la hacemos nosotros. ¿Arrancamos esta semana? Te paso el link de pago.`;
}

export function waLink(phone: string | null | undefined, text: string): string | null {
  const digits = waDigits(phone);
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}
