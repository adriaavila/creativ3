/**
 * El registro de clientes de allok: quién es cliente, en qué app trabaja y en
 * qué punto del alta está.
 *
 * allok es el Tech Provider — es dueño de la app de Meta, así que todo número
 * de WhatsApp oficial entra por su Embedded Signup. Pero no todo cliente
 * trabaja acá: algunos operan en REI CRM (residente), y su bandeja no es ésta.
 * Ese dato vive en `destination` y decide qué pasa después de conectar.
 *
 * Sólo funciones puras: la tabla está en clients-db.ts.
 */

export const CLIENT_DESTINATIONS = ["allok", "rei_crm"] as const;
export type ClientDestination = (typeof CLIENT_DESTINATIONS)[number];

export const CLIENT_STATUSES = ["invited", "connected", "live", "paused", "churned"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_DESTINATION_LABELS: Record<ClientDestination, string> = {
  allok: "Bandeja allok",
  rei_crm: "REI CRM",
};

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  invited: "Enlace enviado",
  connected: "Número conectado",
  live: "Operando",
  paused: "En pausa",
  churned: "Dado de baja",
};

export type Client = {
  slug: string;
  name: string;
  destination: ClientDestination;
  destinationRef: string | null;
  status: ClientStatus;
  contact: string | null;
  notes: string | null;
  handedOverAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Un cliente con lo que se sabe de sus números, que es lo que mira el operador. */
export type ClientRow = Client & {
  numbers: number;
  connectedNumbers: number;
  displayPhoneNumber: string | null;
  phoneNumberId: string | null;
  wabaId: string | null;
  connectionStatus: string | null;
  webhookOverrideUri: string | null;
  lastConnectedAt: string | null;
};

const SLUG = /^[a-z0-9][a-z0-9._-]{0,79}$/;
const REI_ORG_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isClientDestination(value: unknown): value is ClientDestination {
  return typeof value === "string" && (CLIENT_DESTINATIONS as readonly string[]).includes(value);
}

export function isClientStatus(value: unknown): value is ClientStatus {
  return typeof value === "string" && (CLIENT_STATUSES as readonly string[]).includes(value);
}

export type ClientInput = {
  slug: string;
  name: string;
  destination: ClientDestination;
  destinationRef: string | null;
  status: ClientStatus;
  contact: string | null;
  notes: string | null;
};

function optionalText(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/**
 * Valida lo que manda el formulario de Ops. El destino y su referencia van
 * juntos a propósito: un cliente marcado como REI sin organization_id no se
 * puede entregar, y descubrirlo recién al apretar "Entregar" desperdicia el
 * momento en que el cliente está mirando.
 */
export function parseClientInput(body: unknown): { input: ClientInput } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Cuerpo inválido." };
  }
  const raw = body as Record<string, unknown>;

  const slug = typeof raw.slug === "string" ? raw.slug.trim().toLowerCase() : "";
  if (!SLUG.test(slug)) return { error: "El identificador debe ser a-z, 0-9, punto, guion o guion bajo." };

  const name = optionalText(raw.name, 120);
  if (!name) return { error: "El nombre del cliente es obligatorio." };

  const destination = isClientDestination(raw.destination) ? raw.destination : "allok";
  const destinationRef = optionalText(raw.destination_ref, 80);
  if (destination === "rei_crm" && !destinationRef) {
    return { error: "Un cliente de REI CRM necesita su organization_id." };
  }
  if (destination === "rei_crm" && !REI_ORG_ID.test(destinationRef!)) {
    return { error: "El organization_id de REI no es un uuid válido." };
  }
  if (destination === "allok" && destinationRef) {
    return { error: "Un cliente que trabaja en la bandeja de allok no lleva referencia externa." };
  }

  const status = isClientStatus(raw.status) ? raw.status : "invited";

  return {
    input: {
      slug,
      name,
      destination,
      destinationRef,
      status,
      contact: optionalText(raw.contact, 160),
      notes: optionalText(raw.notes, 1000),
    },
  };
}

export type HandoverBlocker =
  | "not_rei"
  | "missing_org"
  | "no_connection"
  | "connection_inactive";

/**
 * Por qué NO se puede entregar este cliente todavía, o null si se puede.
 * Separado de la ruta para que la tabla muestre el motivo antes de intentarlo.
 */
export function handoverBlocker(row: {
  destination: ClientDestination;
  destinationRef: string | null;
  phoneNumberId: string | null;
  connectionStatus: string | null;
}): HandoverBlocker | null {
  if (row.destination !== "rei_crm") return "not_rei";
  if (!row.destinationRef) return "missing_org";
  if (!row.phoneNumberId) return "no_connection";
  if (row.connectionStatus === "deauthorized") return "connection_inactive";
  return null;
}

export const HANDOVER_BLOCKER_LABELS: Record<HandoverBlocker, string> = {
  not_rei: "Este cliente trabaja en la bandeja de allok.",
  missing_org: "Falta el organization_id de REI.",
  no_connection: "Todavía no conectó ningún número.",
  connection_inactive: "El número está desautorizado; hay que reconectarlo.",
};
