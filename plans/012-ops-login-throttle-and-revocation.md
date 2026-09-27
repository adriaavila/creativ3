# Plan 012: The /ops login limits guesses, and changing the password logs everyone out

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a6f67ff..HEAD -- src/lib/ops-session.ts src/lib/ops-auth.ts src/proxy.ts src/app/api/ops/login/route.ts src/app/ops-login/page.tsx db/migrations/`
> A new migration numbered 022 already existing means someone else took the number: use the next free one. Any other drift: compare with the excerpts; on a mismatch, STOP.

## Status

- **Priority**: P2 (security)
- **Effort**: M
- **Risk**: LOW-MED (a bug here can lock Adrian out of /ops; every step keeps the fail-open path explicit)
- **Depends on**: 006 recommended (CI)
- **Category**: security
- **Planned at**: commit `a6f67ff`, 2026-09-27
- **Needs Adrian**: applying migration 022 (DB migrations are his call).

## Why this matters

`/ops` is protected by one shared password. A logged-in session can reveal
clients' plaintext Meta business tokens
(`POST /api/ops/whatsapp-connections/[id]/token`). Today:

- `POST /api/ops/login` has **no attempt limit or delay**: the password can be
  guessed online without bound.
- Sessions are stateless HMAC tokens valid 12 h, signed only with
  `OPS_SESSION_SECRET`. **Changing `OPS_ACCESS_PASSWORD` does not invalidate
  sessions already issued**, so a leaked cookie survives a password change.
- Nothing enforces a minimum length for `OPS_SESSION_SECRET`.

Cookie flags are already right (HttpOnly, SameSite=strict, Secure in
production) and comparisons are timing-safe; keep them.

## Current state

- `src/lib/ops-session.ts` — `createOpsSessionToken(userId, secret, ttl)` and
  `verifyOpsSessionToken(token, secret)`; token = `base64url(JSON{userId,exp}).HMAC-SHA256(payload, secret)`.
- `src/lib/ops-auth.ts`:
  ```ts
  export function isOpsAuthConfigured() {
    return Boolean(process.env.OPS_ACCESS_PASSWORD && process.env.OPS_SESSION_SECRET);
  }
  export async function authorizeOps(): Promise<OpsAuthorization> {
    const secret = process.env.OPS_SESSION_SECRET;
    const token = (await cookies()).get(OPS_COOKIE_NAME)?.value;
    const session = secret ? verifyOpsSessionToken(token, secret) : null;
    …
  }
  export function issueOpsSessionToken(userId = "allok-ops-owner") {
    const secret = process.env.OPS_SESSION_SECRET;
    if (!secret) throw new Error("OPS_SESSION_SECRET is not configured.");
    return createOpsSessionToken(userId, secret);
  }
  ```
- `src/proxy.ts` (Next 16's middleware; runs on Node) verifies independently:
  ```ts
  const secret = process.env.OPS_SESSION_SECRET;
  const token = request.cookies.get(OPS_COOKIE_NAME)?.value;
  const authenticated = Boolean(secret && verifyOpsSessionToken(token, secret));
  ```
- `src/app/api/ops/login/route.ts` — reads `password` and `next` from form data; if the password does not match (`timingSafeEqual` helper `matches`), redirects 303 to `/ops-login?error=1&next=…`; on success sets the cookie with `issueOpsSessionToken()`.
- `src/app/ops-login/page.tsx` — shows «La contraseña no es correcta.» when `params.error === "1"` (Spanish UI, dark card; follow the same markup for a second message).
- DB access pattern for a small module (copy it): `src/lib/stripe-purchases-db.ts` starts with
  ```ts
  import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
  let sqlClient: NeonQueryFunction<false, false> | null = null;
  function getSql() { … if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL); return sqlClient; }
  ```
- Migrations: `db/migrations/NNN_name.sql`, latest is `021_leads_agent_state.sql` (`ALTER TABLE … ADD COLUMN IF NOT EXISTS …` with a comment header in English). Applied by hand with `node --env-file=.env.local scripts/run-migration.mjs db/migrations/<file>.sql` — **only Adrian applies migrations**.
- Tests: `src/lib/*.test.ts`, `node:test` + `assert/strict`. There is no test of `ops-session.ts` yet.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tests | `pnpm test` | contains `ℹ fail 0` |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope**:
- `src/lib/ops-session.ts`, `src/lib/ops-auth.ts`, `src/proxy.ts`
- `src/app/api/ops/login/route.ts`, `src/app/ops-login/page.tsx`
- `src/lib/ops-login-throttle.ts` (create), `src/lib/ops-session.test.ts` (create)
- `db/migrations/022_ops_login_failures.sql` (create; do **not** apply it)

**Out of scope**: logout revocation (sessions stay stateless; the 12 h TTL is the bound), multi-user accounts, CAPTCHA, the token-reveal endpoint, any env var change.

## Git workflow

- Branch: `claude/012-ops-login-hardening`
- Commits: `fix(ops): sessions die when the password changes`, `fix(ops): limit login attempts`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Derive the session key from secret + password

In `src/lib/ops-session.ts` add:
```ts
/**
 * La llave que firma las sesiones sale del secreto y de la contraseña: cambiar
 * `OPS_ACCESS_PASSWORD` invalida todas las sesiones abiertas sin guardar nada.
 */
export function opsSessionKey(secret: string, password: string): string {
  return createHmac("sha256", secret).update(`ops-session:${password}`).digest("base64url");
}
```
Then use the derived key everywhere a session is signed or verified:
- `ops-auth.ts` `authorizeOps`: `const key = secret && password ? opsSessionKey(secret, password) : null;` with `const password = process.env.OPS_ACCESS_PASSWORD;`, and verify with `key`.
- `ops-auth.ts` `issueOpsSessionToken`: sign with `opsSessionKey(secret, password)`; throw if either is missing.
- `proxy.ts`: same derivation before `verifyOpsSessionToken`.

Also make `isOpsAuthConfigured()` require `(process.env.OPS_SESSION_SECRET ?? "").length >= 32`.
**Before merging**, the operator must confirm the production `OPS_SESSION_SECRET` is ≥ 32 characters (Vercel dashboard shows length when revealed) — otherwise /ops would show the setup screen. Put this in the PR description.

Deploying this logs Adrian out once (existing cookies were signed with the old key). Say so in the PR.

**Verify**: `pnpm exec tsc --noEmit && pnpm lint` → exit 0; `grep -n "opsSessionKey" src/proxy.ts src/lib/ops-auth.ts` → matches in both.

### Step 2: Unit test the session rules

Create `src/lib/ops-session.test.ts`:
```ts
import assert from "node:assert/strict";
import test from "node:test";
import { createOpsSessionToken, opsSessionKey, verifyOpsSessionToken } from "@/lib/ops-session";

const SECRET = "s".repeat(40);

test("cambiar la contraseña cierra las sesiones abiertas", () => {
  const token = createOpsSessionToken("allok-ops-owner", opsSessionKey(SECRET, "vieja"));
  assert.ok(verifyOpsSessionToken(token, opsSessionKey(SECRET, "vieja")));
  assert.equal(verifyOpsSessionToken(token, opsSessionKey(SECRET, "nueva")), null);
});

test("una sesión vencida o manipulada no entra", () => {
  const key = opsSessionKey(SECRET, "clave");
  assert.equal(verifyOpsSessionToken(createOpsSessionToken("x", key, -1), key), null);
  const token = createOpsSessionToken("x", key);
  assert.equal(verifyOpsSessionToken(`${token}a`, key), null);
  assert.equal(verifyOpsSessionToken("sin-punto", key), null);
});
```

**Verify**: `pnpm test` → `ℹ fail 0`, two more tests.

### Step 3: Migration for failed attempts (write only)

Create `db/migrations/022_ops_login_failures.sql`:
```sql
-- Failed /ops logins, to throttle password guessing. Only a salted hash of the
-- IP is stored, never the IP or the attempted password. Rows older than a day
-- are deleted by the login route itself.
CREATE TABLE IF NOT EXISTS ops_login_failures (
  id bigserial PRIMARY KEY,
  ip_hash text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ops_login_failures_at_idx ON ops_login_failures (at);
CREATE INDEX IF NOT EXISTS ops_login_failures_ip_at_idx ON ops_login_failures (ip_hash, at);
```

**Verify**: `ls db/migrations | tail -1` → `022_ops_login_failures.sql`. Do NOT run it.

### Step 4: Throttle module (fails open until the migration exists)

Create `src/lib/ops-login-throttle.ts`:
```ts
import { createHmac } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/** 5 intentos fallidos por IP o 30 en total en 15 minutos: después, esperar. */
export const PER_IP_LIMIT = 5;
export const GLOBAL_LIMIT = 30;

export function loginBlocked(counts: { ip: number; all: number }): boolean {
  return counts.ip >= PER_IP_LIMIT || counts.all >= GLOBAL_LIMIT;
}

let sqlClient: NeonQueryFunction<false, false> | null = null;
function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export function ipHash(request: Request, secret: string): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHmac("sha256", secret).update(`ops-login:${ip}`).digest("base64url");
}

/**
 * ponytail: si la tabla no existe (migración 022 sin aplicar) o la base falla,
 * el login sigue abierto: no dejar a Adrian fuera pesa más que frenar intentos.
 */
export async function recentFailures(hash: string): Promise<{ ip: number; all: number }> {
  const sql = getSql();
  if (!sql) return { ip: 0, all: 0 };
  try {
    const [row] = await sql`
      SELECT count(*) FILTER (WHERE ip_hash = ${hash})::int AS ip, count(*)::int AS all_count
      FROM ops_login_failures WHERE at > now() - interval '15 minutes'
    `;
    return { ip: Number(row?.ip ?? 0), all: Number(row?.all_count ?? 0) };
  } catch {
    return { ip: 0, all: 0 };
  }
}

export async function recordFailure(hash: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql.transaction([
      sql`INSERT INTO ops_login_failures (ip_hash) VALUES (${hash})`,
      sql`DELETE FROM ops_login_failures WHERE at < now() - interval '1 day'`,
    ]);
  } catch {
    // Sin tabla todavía: no se anota.
  }
}
```

Add to `src/lib/ops-session.test.ts`:
```ts
import { loginBlocked } from "@/lib/ops-login-throttle";
test("el login se frena a los 5 fallos por IP o 30 en total", () => {
  assert.equal(loginBlocked({ ip: 4, all: 4 }), false);
  assert.equal(loginBlocked({ ip: 5, all: 5 }), true);
  assert.equal(loginBlocked({ ip: 0, all: 30 }), true);
});
```

**Verify**: `pnpm test` → `ℹ fail 0`; `pnpm exec tsc --noEmit` → exit 0.

### Step 5: Use it in the login route and show the wait message

In `src/app/api/ops/login/route.ts`, after the `!configuredPassword || !sessionSecret` 503 check:
```ts
const hash = ipHash(request, sessionSecret);
if (loginBlocked(await recentFailures(hash))) {
  const waitUrl = new URL("/ops-login", request.url);
  waitUrl.searchParams.set("error", "wait");
  waitUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(waitUrl, 303);
}
```
and in the wrong-password branch, before the redirect: `await recordFailure(hash);`.

In `src/app/ops-login/page.tsx`, next to the `error === "1"` block, add the same markup for `params.error === "wait"` with the text
«Demasiados intentos. Espera 15 minutos y vuelve a probar.»

**Verify**: `pnpm exec tsc --noEmit && pnpm lint && pnpm build` → exit 0.

## Test plan

- Unit: key derivation revokes on password change; tampered/expired tokens rejected; `loginBlocked` thresholds.
- Manual (operator, after Adrian applies migration 022 and deploys): 5 wrong passwords from one browser → the 6th attempt shows «Demasiados intentos»; the right password after 15 min works; changing `OPS_ACCESS_PASSWORD` in Vercel and redeploying logs out an open session.

## Done criteria

- [ ] `src/lib/ops-session.test.ts` exists; `pnpm test` → `ℹ fail 0`
- [ ] `grep -rn "verifyOpsSessionToken(token, secret)" src` → no match (every verify uses the derived key)
- [ ] `db/migrations/022_ops_login_failures.sql` exists and was not applied
- [ ] `pnpm exec tsc --noEmit && pnpm lint && pnpm build` → exit 0
- [ ] PR description lists: apply migration 022 (Adrian), confirm secret ≥ 32 chars, one forced re-login
- [ ] `git status --short` → only in-scope files
- [ ] `plans/README.md` row for 012 updated

## STOP conditions

- `proxy.ts` no longer verifies the session itself (then the key must change in whatever replaced it — report).
- `sql.transaction` is unavailable on the Neon client version in `package.json`.
- Any other route or script signs ops sessions (search `createOpsSessionToken`) and is not listed here.

## Maintenance notes

- Adding real user accounts later replaces the shared password; keep `opsSessionKey` idea (key rotates with the credential).
- If Vercel ever stops sending `x-forwarded-for`, every request hashes to "unknown" and the per-IP limit behaves like the global one; still safe, just stricter.
