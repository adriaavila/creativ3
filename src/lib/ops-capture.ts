/**
 * Leads que llegan solos a `/ops` desde Vocero (org `principal`, WhatsApp …3684).
 *
 * El agente de allok es el filtro: arriba del embudo conversa él. A la cola de
 * Hoy sólo sube quien ya pasó el filtro (calificado, llamada, pase a Adrian o
 * pregunta por precio/pago). La rutina del VPS `ops-capture.sh` aplica el mismo
 * filtro en SQL para que un chat sin señal nunca salga del VPS; aquí se vuelve a
 * mirar, porque este endpoint es la frontera de confianza.
 *
 * Todo es determinista y puro: la cola se puede auditar y probar sin base.
 */
import { ASKED_PREFIX, SALES_TZ, addDays, localDate } from "./sales-queue";

/** Lo que manda la rutina por cada conversación que cambió (validado en `ops-capture-server.ts`). */
export type CapturedRow = {
  conversationId: string;
  phone: string;
  name: string | null;
  crmUrl: string;
  source: "anuncio" | "web" | "invitacion" | "whatsapp";
  adHeadline: string | null;
  firstMessage: string | null;
  rubro: string | null;
  dolor: string | null;
  calificado: boolean | null;
  resultado: string | null;
  askedPrice: boolean;
  handoffAt: string | null;
  handoffReason: string | null;
  booking: { at: string; status: "agendada" | "realizada" | "no_show" | "cancelada"; meetLink: string | null } | null;
  lastInboundAt: string | null;
  lastAiAt: string | null;
  lastManualAt: string | null;
};

export type CaptureStage =
  | "handoff" // el agente se la pasó a Adrian
  | "replied" // le contestó a Adrian: la pelota está de su lado
  | "call" // llamada agendada
  | "after_call" // la hora de la llamada ya pasó
  | "no_show" // no llegó a la llamada
  | "followup" // calificado sin llamada: seguimiento 1 o 2
  | "close"; // se acabó la secuencia: proponer cerrarlo

/** Lo que `/ops` guarda en `leads.agent_state`: la fila capturada + lo que decidió la cola. */
export type AgentState = Omit<CapturedRow, "phone"> & {
  stage: CaptureStage;
  /** Seguimientos que Adrian ya mandó en esta secuencia (0, 1 o 2). */
  step: number;
  /** Cuándo se calculó `stage`. Un «Qué pasó» posterior manda sobre él. */
  computedAt: string;
};

/** Pases a Adrian que son del lead. `manual_reply`, `hostilidad`, `error` y `ventana` no. */
const LEAD_HANDOFFS = new Set(["cliente", "modelo"]);

const time = (iso: string | null | undefined) => (iso ? Date.parse(iso) : 0);

export function handedOff(row: Pick<CapturedRow, "handoffAt" | "handoffReason">): boolean {
  return Boolean(row.handoffAt && row.handoffReason && LEAD_HANDOFFS.has(row.handoffReason));
}

function booked(row: Pick<CapturedRow, "booking">): boolean {
  return Boolean(row.booking && row.booking.status !== "cancelada");
}

/** ¿Pasó el filtro del agente? Arriba del embudo (nuevo, conversando, no encaja) se queda con él. */
export function passesFilter(row: CapturedRow): boolean {
  if (booked(row) || handedOff(row)) return true;
  if (row.resultado === "dio_diy") return false; // el agente lo despidió: no encaja
  return row.calificado === true || row.askedPrice || row.resultado === "agendo" || row.resultado === "handoff";
}

type Previous = {
  status: string;
  nextAction: string | null;
  nextActionAt: string | null;
  lastContactedAt: string | null;
  step: number;
};

export type FollowupPatch = {
  stage: CaptureStage | "asked" | "closed";
  status: "replied" | "meeting_booked" | "won" | "lost";
  nextAction: string | null;
  nextActionAt: string | null;
  lastContactedAt: string | null;
  step: number;
};

/**
 * Qué toca con este lead y cuándo. Una respuesta manual en Vocero (Adrian
 * escribió desde la app) cuenta sola como toque: avanza la secuencia sin que
 * él marque nada. «Qué pasó» sigue mandando en lo que decide él (pagó, no por
 * ahora, pago pedido).
 */
export function followupFor(row: CapturedRow, prev: Previous | null, now = new Date()): FollowupPatch {
  const today = localDate(now);
  const prevContact = prev?.lastContactedAt ?? null;
  const touched = Boolean(row.lastManualAt && time(row.lastManualAt) > time(prevContact));
  const lastContactedAt = touched ? row.lastManualAt : prevContact;
  const step = (prev?.step ?? 0) + (touched ? 1 : 0);
  const keep = { lastContactedAt, step };

  if (prev && (prev.status === "won" || prev.status === "lost")) {
    return { stage: "closed", status: prev.status, nextAction: prev.nextAction, nextActionAt: prev.nextActionAt, ...keep };
  }
  // Respondió después de que Adrian le escribió (el bot queda en pausa tras una respuesta manual).
  if (lastContactedAt && time(row.lastInboundAt) > time(lastContactedAt) && time(row.lastAiAt) < time(row.lastInboundAt)) {
    return { stage: "replied", status: "replied", nextAction: "Te respondió", nextActionAt: today, ...keep };
  }
  if (handedOff(row) && time(row.handoffAt) > time(lastContactedAt)) {
    return { stage: "handoff", status: "replied", nextAction: "Te pasó el agente", nextActionAt: today, ...keep };
  }
  if (prev?.nextAction?.startsWith(ASKED_PREFIX)) {
    const nextActionAt = touched ? addDays(localDate(row.lastManualAt!), 3) : prev.nextActionAt;
    return { stage: "asked", status: "meeting_booked", nextAction: prev.nextAction, nextActionAt, ...keep };
  }
  if (booked(row)) {
    const at = row.booking!.at;
    const talkedAfter = time(lastContactedAt) > time(at);
    if (row.booking!.status === "no_show" && !talkedAfter) {
      return { stage: "no_show", status: "meeting_booked", nextAction: "No vino a la llamada", nextActionAt: today, ...keep };
    }
    if (time(at) > now.getTime()) {
      return { stage: "call", status: "meeting_booked", nextAction: "Llamada agendada", nextActionAt: localDate(at), ...keep };
    }
    if (!talkedAfter) {
      return { stage: "after_call", status: "meeting_booked", nextAction: "Después de la llamada", nextActionAt: today, ...keep };
    }
  }
  // Calificado sin llamada: seguimiento 1 al día siguiente del último mensaje, 2 a los 3 días del toque, cierre a los 4 más.
  const anchor = step === 0 ? localDate(row.lastInboundAt ?? now) : localDate(lastContactedAt!);
  if (step === 0) return { stage: "followup", status: "replied", nextAction: "Seguimiento 1", nextActionAt: addDays(anchor, 1), ...keep };
  if (step === 1) return { stage: "followup", status: "replied", nextAction: "Seguimiento 2", nextActionAt: addDays(anchor, 3), ...keep };
  return { stage: "close", status: "replied", nextAction: "Cerrar: sin respuesta", nextActionAt: addDays(anchor, 4), ...keep };
}

/**
 * La etapa que ve Adrian en la tarjeta. Lo guardado al capturar vale mientras
 * nadie lo haya pisado con «Qué pasó»; y una llamada cuya hora ya pasó se ve
 * como «después de la llamada» aunque la rutina no haya vuelto a escribir.
 */
export function displayStage(
  state: AgentState | null | undefined,
  lastContactedAt: string | null,
  now = new Date(),
): CaptureStage | null {
  if (!state) return null;
  if (lastContactedAt && time(lastContactedAt) > time(state.computedAt)) return null;
  if (state.stage === "call" && state.booking && time(state.booking.at) <= now.getTime()) return "after_call";
  return state.stage;
}

/** «jue 15:00» en Caracas. */
export function callLabel(iso: string): string {
  return new Intl.DateTimeFormat("es-VE", {
    timeZone: SALES_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** «15:00» en Caracas. */
export function callHour(iso: string): string {
  return new Intl.DateTimeFormat("es-VE", { timeZone: SALES_TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(iso),
  );
}
