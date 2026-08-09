import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import {
  type Client,
  type ClientDestination,
  type ClientInput,
  type ClientRow,
  type ClientStatus,
  isClientDestination,
  isClientStatus,
} from "@/lib/clients";

/**
 * Lecturas y escrituras del registro de clientes (db/migrations/019_clients.sql).
 *
 * El cruce con whatsapp_connections es por `client`, el mismo slug que viaja en
 * el enlace de onboarding: no hay tabla puente ni id sintético que mantener.
 */

let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to read the client registry.");
  }
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

function text(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function timestamp(value: unknown): string | null {
  return value ? new Date(String(value)).toISOString() : null;
}

function mapClient(row: Record<string, unknown>): Client {
  const destination = isClientDestination(row.destination)
    ? (row.destination as ClientDestination)
    : "allok";
  const status = isClientStatus(row.status) ? (row.status as ClientStatus) : "invited";
  return {
    slug: String(row.slug),
    name: String(row.name),
    destination,
    destinationRef: text(row.destination_ref),
    status,
    contact: text(row.contact),
    notes: text(row.notes),
    handedOverAt: timestamp(row.handed_over_at),
    createdAt: timestamp(row.created_at) ?? new Date().toISOString(),
    updatedAt: timestamp(row.updated_at) ?? new Date().toISOString(),
  };
}

/**
 * El listado que ve el operador: un cliente por fila, con el número más
 * reciente que haya conectado. Un cliente con varios números es raro hoy, así
 * que la fila resume (cuántos, cuántos vivos) y muestra el último.
 * ponytail: si un cliente empieza a tener 3+ números, esto pide una vista hija.
 */
export async function listClients(): Promise<ClientRow[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      client.slug, client.name, client.destination, client.destination_ref, client.status,
      client.contact, client.notes, client.handed_over_at, client.created_at, client.updated_at,
      COALESCE(numbers.total, 0)::int AS numbers,
      COALESCE(numbers.connected, 0)::int AS connected_numbers,
      numbers.display_phone_number, numbers.phone_number_id, numbers.waba_id,
      numbers.connection_status, numbers.webhook_override_uri, numbers.last_connected_at
    FROM clients AS client
    LEFT JOIN LATERAL (
      SELECT
        count(*)::int AS total,
        count(*) FILTER (WHERE connection.status <> 'deauthorized')::int AS connected,
        max(connection.connected_at) AS last_connected_at,
        (array_agg(connection.display_phone_number ORDER BY connection.connected_at DESC))[1] AS display_phone_number,
        (array_agg(connection.phone_number_id ORDER BY connection.connected_at DESC))[1] AS phone_number_id,
        (array_agg(connection.waba_id ORDER BY connection.connected_at DESC))[1] AS waba_id,
        (array_agg(connection.status ORDER BY connection.connected_at DESC))[1] AS connection_status,
        (array_agg(connection.webhook_override_uri ORDER BY connection.connected_at DESC))[1] AS webhook_override_uri
      FROM whatsapp_connections AS connection
      WHERE connection.client = client.slug
    ) AS numbers ON true
    ORDER BY client.updated_at DESC
  `;

  return rows.map((row) => ({
    ...mapClient(row),
    numbers: Number(row.numbers ?? 0),
    connectedNumbers: Number(row.connected_numbers ?? 0),
    displayPhoneNumber: text(row.display_phone_number),
    phoneNumberId: text(row.phone_number_id),
    wabaId: text(row.waba_id),
    connectionStatus: text(row.connection_status),
    webhookOverrideUri: text(row.webhook_override_uri),
    lastConnectedAt: timestamp(row.last_connected_at),
  }));
}

export async function getClient(slug: string): Promise<Client | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM clients WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? mapClient(rows[0]) : null;
}

export async function upsertClient(input: ClientInput): Promise<Client> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO clients (slug, name, destination, destination_ref, status, contact, notes, updated_at)
    VALUES (
      ${input.slug}, ${input.name}, ${input.destination}, ${input.destinationRef},
      ${input.status}, ${input.contact}, ${input.notes}, now()
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      destination = EXCLUDED.destination,
      destination_ref = EXCLUDED.destination_ref,
      status = EXCLUDED.status,
      contact = EXCLUDED.contact,
      notes = EXCLUDED.notes,
      updated_at = now()
    RETURNING *
  `;
  return mapClient(rows[0]);
}

/**
 * Cierra una entrega: el cliente queda operando y la conexión recuerda a dónde
 * apuntan sus webhooks, que es lo que explica una bandeja de allok vacía para
 * ese número.
 */
export async function recordHandover(input: {
  slug: string;
  wabaId: string;
  phoneNumberId: string;
  webhookUri: string;
}): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE clients
    SET status = 'live', handed_over_at = now(), updated_at = now()
    WHERE slug = ${input.slug}
  `;
  await sql`
    UPDATE whatsapp_connections
    SET webhook_override_uri = ${input.webhookUri},
        webhook_override_scope = 'waba',
        updated_at = now()
    WHERE waba_id = ${input.wabaId} AND phone_number_id = ${input.phoneNumberId}
  `;
}

export function isClientRegistryConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
