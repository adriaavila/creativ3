import postgres from "postgres";

/**
 * Drop-in replacement for the `neon()` HTTP driver, so every existing call site
 * keeps its tagged-template shape while talking plain Postgres over TCP.
 *
 * ponytail: one shared pool for all callers. Each db module memoises its own
 * `sqlClient`, which was free over HTTP but would open a pool per module here.
 */
let client: postgres.Sql | undefined;

// The two params are unused here but keep the `NeonQueryFunction<false, false>`
// annotations in the db modules compiling untouched.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type NeonQueryFunction<_A extends boolean, _B extends boolean> = postgres.Sql;

export function neon(url: string) {
  client ??= postgres(url, {
    max: 8,
    // Required while this points at Neon's pooler (PgBouncer in transaction
    // mode); harmless against a plain Postgres server.
    prepare: false,
    // `neon()` sent undefined params as NULL; postgres.js throws instead.
    transform: { undefined: null },
    types: {
      // postgres.js hands json/jsonb back as raw text, but `neon()` parsed it.
      // Callers cast it straight to an object (whatsapp-inbox-db.ts:130,
      // meta/webhook-processor.ts:25), so without this every webhook payload
      // silently becomes a string and normalisation returns undefined.
      json: {
        to: 114,
        from: [114, 3802],
        serialize: (value: unknown) =>
          typeof value === "string" ? value : JSON.stringify(value),
        parse: (value: string) => JSON.parse(value),
      },
    },
  });
  return client;
}
