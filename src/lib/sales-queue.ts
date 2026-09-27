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
import { type CaptureStage, callHour, displayStage } from "./ops-capture";
import { PLANS, SETUP_SERVICE } from "./plans";

export const SALES_TZ = "America/Caracas";

/**
 * «Pedí el pago» se guarda como prefijo de `next_action`, porque el `CHECK` de
 * `leads.status` no tiene un estado para eso.
 * ponytail: marcador en texto; el día que haga falta contar cada toque (dos
 * conversaciones con la misma persona), va una tabla `sales_touches`.
 */
export const ASKED_PREFIX = "Pago pedido";

/** `asked`/`interested`/`first` son de leads cargados a mano; el resto llega desde Vocero ya filtrado. */
export type Stage = "asked" | "interested" | "first" | CaptureStage;
export type Outcome = "talked" | "asked" | "paid" | "not_now" | "no_show";

/** «No vino» a la llamada: se reprograma al día siguiente con el mensaje de reprogramar. */
export const NO_SHOW_ACTION = "Reprogramar la llamada";
export type Offer = "vocero" | "rei" | "agencia";

/** Primero lo que se enfría en horas (un pase del agente, alguien que contestó), después lo que espera días. */
const STAGE_RANK: Record<Stage, number> = {
  handoff: 0,
  replied: 1,
  after_call: 2,
  no_show: 2,
  call: 3,
  asked: 4,
  followup: 5,
  interested: 6,
  close: 7,
  first: 8,
};
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

export function stageOf(
  lead: Pick<GrowthLead, "status" | "nextAction"> & Partial<Pick<GrowthLead, "agentState" | "lastContactedAt">>,
  now = new Date(),
): Stage | null {
  if (CLOSED.includes(lead.status)) return null;
  if (lead.nextAction?.startsWith(ASKED_PREFIX)) return "asked";
  if (lead.nextAction === NO_SHOW_ACTION) return "no_show";
  const captured = displayStage(lead.agentState, lead.lastContactedAt ?? null, now);
  if (captured) return captured;
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
    case "no_show":
      return { status: "meeting_booked", nextAction: NO_SHOW_ACTION, nextActionAt: addDays(today, 1) };
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

/** El saludo con nombre sólo si parece de persona: un nombre largo suele ser el del negocio. */
function hello(name: string | null | undefined): string {
  const clean = name?.trim();
  return clean && clean.length <= 24 && !/^sin nombre/i.test(clean) ? `Hola ${clean}` : "Hola";
}

const payAsk = () =>
  `Como lo hablamos: la ${SETUP_SERVICE.name.toLowerCase()} son US$${SETUP_SERVICE.price} una vez y el plan ${esencial.name} US$${esencial.price} al mes. Se paga aquí: ${SETUP_SERVICE.paymentUrl} Cuando pagues, agendamos la instalación.`;

/**
 * El borrador que abre WhatsApp. Adrian lo lee, lo ajusta si quiere y lo manda
 * desde su teléfono. Los leads que llegan desde Vocero se escriben con lo que el
 * agente ya sabe (rubro, dolor, la llamada); si falta un dato, la frase lo
 * omite en vez de dejar un hueco. Vacío = no hay nada que proponer (leer el
 * chat o cerrar el lead).
 * Sólo Vocero lleva precio: es el único con hoja de precios (`plans.ts`).
 */
export function messageFor(
  stage: Stage,
  lead: Pick<GrowthLead, "businessName" | "offerAngle"> & Partial<Pick<GrowthLead, "agentState">>,
): string {
  const state = lead.agentState;
  const hi = hello(state ? state.name : null);
  switch (stage) {
    case "handoff":
      return `${hi}, soy Adrian de allok. El agente me pasó tu mensaje y sigo yo. ¿Lo vemos en una llamada de 15 minutos hoy, o prefieres por aquí?`;
    case "replied":
    case "close":
      return "";
    case "call": {
      const booking = state?.booking;
      const when = booking ? ` a las ${callHour(booking.at)}` : "";
      const link = booking?.meetLink ? ` El enlace es ${booking.meetLink}` : "";
      return `${hi}, te confirmo la llamada de hoy${when}.${link} ¿Seguimos?`;
    }
    case "after_call":
      return payAsk();
    case "no_show":
      return `${hi}, hoy no pudimos conectarnos. ¿La movemos a otro día?`;
    case "followup": {
      if ((state?.step ?? 0) >= 1) {
        const opener = state?.name && hello(state.name) !== "Hola" ? `${state.name.trim()}, ¿lo` : "¿Lo";
        return `${opener} vemos esta semana? Si ahora no es buen momento, dime y te escribo más adelante.`;
      }
      const about = state?.rubro
        ? `Vi lo que le contaste a nuestro agente sobre tu ${state.rubro.trim()}${state.dolor ? `: ${state.dolor.trim().replace(/[.\s]+$/, "")}` : ""}.`
        : "Quedó pendiente mostrarte cómo quedaría el agente en tu negocio.";
      return `${hi}, soy Adrian de allok. ${about} ¿Te muestro en 15 minutos cómo quedaría?`;
    }
    case "asked":
      return lead.offerAngle === "vocero"
        ? `¿Pudiste ver lo del pago? Si lo confirmas hoy, esta semana lo dejamos andando. Te dejo el link: ${SETUP_SERVICE.paymentUrl}`
        : "¿Pudiste ver lo del pago? Si lo confirmas hoy, esta semana lo dejamos andando.";
    case "first": {
      const offer = lead.offerAngle;
      if (offer === "rei") {
        return "Hola, soy Adrian de allok. Armamos un CRM de WhatsApp para inmobiliarias: cada interesado queda anotado con su inmueble y su próximo paso. ¿Te lo muestro en 15 minutos?";
      }
      if (offer === "agencia") {
        return "Hola, soy Adrian de allok. Hacemos webs y automatizaciones para negocios que venden por WhatsApp. ¿Te cuento en 15 minutos qué haría con el tuyo?";
      }
      return `Hola, soy Adrian de allok. Armamos un agente que contesta el WhatsApp de ${lead.businessName} a cualquier hora y deja cada cliente anotado. ¿Te muestro en 15 minutos cómo quedaría con tu negocio?`;
    }
    case "interested": {
      const offer = lead.offerAngle;
      if (offer === "agencia") {
        return "¿Arrancamos esta semana? Te paso la propuesta con el precio cerrado y el link de pago.";
      }
      if (offer === "rei") {
        return "¿Arrancamos esta semana? Te paso el plan y el link de pago.";
      }
      return `Para dejarlo andando: el plan ${esencial.name} es US$${esencial.price} al mes y la ${SETUP_SERVICE.name.toLowerCase()} US$${SETUP_SERVICE.price}, que la hacemos nosotros. ¿Arrancamos esta semana? Aquí puedes pagar la ${SETUP_SERVICE.name.toLowerCase()}: ${SETUP_SERVICE.paymentUrl}`;
    }
  }
}

export function waLink(phone: string | null | undefined, text: string): string | null {
  const digits = waDigits(phone);
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}
