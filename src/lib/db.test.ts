import assert from "node:assert/strict";
import { test } from "node:test";
import { neon } from "./db";

// Needs a throwaway Postgres, so it stays opt-in and `pnpm test` skips it:
//   docker run -d --name allok-pg-test -e POSTGRES_USER=allok \
//     -e POSTGRES_PASSWORD=testonly -e POSTGRES_DB=allok -p 55432:5432 postgres:16-alpine
//   TEST_DATABASE_URL=postgresql://allok:testonly@127.0.0.1:55432/allok pnpm test
const url = process.env.TEST_DATABASE_URL;

test("the postgres shim keeps the behaviour the Neon HTTP driver had", { skip: !url }, async () => {
  const sql = neon(url!);

  // The whole reason the shim exists: 17 modules each memoise their own client.
  assert.equal(neon("postgres://ignored"), sql, "every caller must share one pool");

  // jsonb read back as an object, not text. Callers cast it straight to a
  // record, so a string here fails silently instead of throwing.
  const [row] = await sql`SELECT ${JSON.stringify({ entry: [{ id: "waba-1" }] })}::jsonb AS payload`;
  assert.deepEqual(row.payload, { entry: [{ id: "waba-1" }] });
  assert.equal(row.payload.entry[0].id, "waba-1");

  const [nulled] = await sql`SELECT ${null}::jsonb AS payload`;
  assert.equal(nulled.payload, null);

  // `neon()` sent undefined as NULL; bare postgres.js throws. postgres.js also
  // rejects undefined at the type level, hence the cast — app code passes
  // `?? null`, so this guards the transform, not a call site.
  const missing = undefined as unknown as null;
  const [undef] = await sql`SELECT ${missing}::text IS NULL AS is_null`;
  assert.equal(undef.is_null, true);

  // Numeric shapes the callers depend on: ::int is a number, bare count is int8 text.
  const [counts] = await sql`SELECT count(*)::int AS n, count(*) AS big FROM pg_class`;
  assert.equal(typeof counts.n, "number");
  assert.equal(typeof counts.big, "string");

  await sql.end();
});
