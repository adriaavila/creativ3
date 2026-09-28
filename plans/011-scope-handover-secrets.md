# Plan 011: The machine secrets can only retry the handover they started, and cannot repoint built-in destinations

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a6f67ff..HEAD -- src/app/api/meta/tenant-handover/retry/route.ts src/app/api/internal/handover-destinations/route.ts src/lib/handover/destinations.ts src/lib/handover-destinations.test.ts`
> On any change, compare with the excerpts; on a mismatch, STOP.

## Status

- **Priority**: P2 (security)
- **Effort**: S
- **Risk**: MED (a too-strict check could block a legitimate retry from Vocero)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a6f67ff`, 2026-09-27

## Why this matters

allok.fun holds encrypted Meta WhatsApp business tokens for every connected
client (agency clients, REI, Vocero tenants) and can "hand over" a number:
push its token to a destination app's `provisionUrl` and point Meta's webhook
at that destination. Two machine-to-machine endpoints are protected only by a
shared bearer secret:

1. `POST /api/meta/tenant-handover/retry` (secret `ALLOK_SAAS_LINK_SECRET`,
   also held by the separate Vocero app, which calls it from
   `vocero-crm/src/app/api/saas/whatsapp/retry-connection/route.ts`). The
   caller chooses **both** `workspace` and `destination`. Nothing checks that
   this workspace was ever handed over to that destination. Whoever holds the
   secret can move **any** managed number's webhook and token to **any**
   registered destination.
2. `POST /api/internal/handover-destinations` (secret
   `ALLOK_DESTINATION_SYNC_SECRET`, used by the VPS script
   `vps/harness/scripts/alta-vocero.sh`). It upserts any slug, including the
   built-in ones (`allok`, `vocero`, `rei_crm`), and a DB row wins over the
   built-in env config. Overwriting `vocero` repoints **every future public
   signup** (it defaults to `vocero`) to an arbitrary host.

The script only ever registers `vocero-<client-slug>` destinations
(`DESTINATION_SLUG="vocero-$SLUG"` in `alta-vocero.sh:163`), and a legitimate
retry always targets the destination the first attempt recorded. So both
restrictions cost the real callers nothing.

## Current state

- `src/app/api/meta/tenant-handover/retry/route.ts` — after bearer auth and input parsing:
  ```ts
  const connection = await getLatestWhatsAppConnectionForClient(workspace);
  if (!connection) {
    return NextResponse.json({ error: "Ese espacio no tiene ningún número conectado en Allok.", step: "config" }, { status: 404 });
  }
  // El token descifrado sólo existe dentro de esta petición, …
  const provider = await getWhatsAppProviderConnection(connection.phoneNumberId, workspace);
  …
  const result = await handoverSaaSTenant({ workspace, …, destination, externalRef });
  ```
  `destination` is `undefined` when the body omits it; `handoverSaaSTenant` then uses `"vocero"` (`src/lib/handover/tenant.ts`: `destinationSlug: input.destination ?? "vocero"`).
- `connection.crmProvider` (type `string | null`, mapped in `src/lib/whatsapp-connections-db.ts` from `token_metadata #>> '{crm_handover,provider}'`) is the destination slug recorded by **every** handover attempt: `src/lib/handover/execute.ts` `handoverConnectionToDestination` first calls `recordWhatsAppCrmHandoverState({ …, provider: input.destinationSlug, state: "provision_pending" … })`, also when the attempt later fails.
- `src/app/api/internal/handover-destinations/route.ts`:
  ```ts
  const parsed = parseDestinationInput(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    return NextResponse.json({ destination: await upsertDestination(parsed.input) });
  } catch { … 503 … }
  ```
- `src/lib/handover/destinations.ts`: `export const DESTINATION_ALLOK = "allok";`; `builtInDestination(slug)` recognizes `DESTINATION_ALLOK`, `"vocero"`, `"rei_crm"`; `upsertDestination` does `ON CONFLICT (slug) DO UPDATE` of every field.
- `src/app/api/ops/destinations/route.ts` also calls `upsertDestination` behind the ops login: **leave it alone** (Adrian may edit built-ins from `/ops`).
- Test pattern: `src/lib/handover-destinations.test.ts` (imports pure functions from `@/lib/handover/destinations`, `node:test`, `assert/strict`, Spanish test names).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tests | `pnpm test` | contains `ℹ fail 0` |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**: `src/lib/handover/destinations.ts` (two pure helpers), `src/app/api/meta/tenant-handover/retry/route.ts`, `src/app/api/internal/handover-destinations/route.ts`, `src/lib/handover-destinations.test.ts`.

**Out of scope**: `src/app/api/ops/destinations/route.ts`, `execute.ts`, the exchange route, `vocero-crm` and the VPS script, secret rotation (operator decision).

## Git workflow

- Branch: `claude/011-scope-handover-secrets`
- Commit: `fix(handover): machine secrets only retry their own handover and cannot repoint built-ins`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Two pure helpers

In `src/lib/handover/destinations.ts` add:

```ts
/** Destinos que arma el entorno. Sólo se editan desde /ops, nunca con el secreto de sincronización. */
export const BUILT_IN_DESTINATIONS = [DESTINATION_ALLOK, "vocero", "rei_crm"] as const;

export function isBuiltInDestination(slug: string): boolean {
  return (BUILT_IN_DESTINATIONS as readonly string[]).includes(slug);
}

/**
 * Un reintento sólo repite la entrega que ya empezó: mismo destino que quedó
 * anotado en la conexión. Sin entrega anotada no hay nada que reintentar.
 */
export function retryDestinationAllowed(recorded: string | null | undefined, requested: string | undefined): boolean {
  return Boolean(recorded) && recorded === (requested ?? "vocero");
}
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Enforce them

1. Retry route: right after the `if (!connection) { … 404 }` block add
   ```ts
   if (!retryDestinationAllowed(connection.crmProvider, destination)) {
     return NextResponse.json(
       { error: "Ese número no tiene una entrega pendiente hacia ese destino.", step: "config" },
       { status: 403 },
     );
   }
   ```
   (import `retryDestinationAllowed` from `@/lib/handover/destinations`, which this file already imports `parseExternalRef` from).
2. Sync route: after the `"error" in parsed` check add
   ```ts
   if (isBuiltInDestination(parsed.input.slug)) {
     return NextResponse.json({ error: "Ese destino se edita desde /ops." }, { status: 409 });
   }
   ```

**Verify**: `pnpm exec tsc --noEmit && pnpm lint` → exit 0.

### Step 3: Tests

In `src/lib/handover-destinations.test.ts` add:
```ts
test("el secreto de sincronización no toca los destinos propios", () => {
  assert.equal(isBuiltInDestination("vocero"), true);
  assert.equal(isBuiltInDestination("allok"), true);
  assert.equal(isBuiltInDestination("rei_crm"), true);
  assert.equal(isBuiltInDestination("vocero-acme"), false);
});

test("un reintento sólo repite la entrega que ya empezó", () => {
  assert.equal(retryDestinationAllowed("vocero", undefined), true, "sin destino es vocero");
  assert.equal(retryDestinationAllowed("vocero-acme", "vocero-acme"), true);
  assert.equal(retryDestinationAllowed("vocero", "vocero-otro"), false, "no se cambia de destino");
  assert.equal(retryDestinationAllowed(null, "vocero"), false, "sin entrega anotada no hay reintento");
  assert.equal(retryDestinationAllowed("rei_crm", undefined), false);
});
```

**Verify**: `pnpm test` → `ℹ fail 0`, two more tests.

## Test plan

Step 3 covers both rules. After deploy, the operator confirms with Vocero's
"Reintentar conexión" on a real stuck tenant (if any) that it still returns ok.

## Done criteria

- [ ] `grep -n "retryDestinationAllowed" src/app/api/meta/tenant-handover/retry/route.ts` → ≥ 1
- [ ] `grep -n "isBuiltInDestination" src/app/api/internal/handover-destinations/route.ts` → ≥ 1
- [ ] `pnpm test` → `ℹ fail 0`; `pnpm exec tsc --noEmit && pnpm lint` → exit 0
- [ ] `git status --short` → only in-scope files
- [ ] `plans/README.md` row for 011 updated

## STOP conditions

- `WhatsAppConnectionView` has no `crmProvider` field.
- `execute.ts` no longer records the provider before the first attempt (then a failed first handover would leave nothing to compare and legit retries would 403).
- `alta-vocero.sh` (in `~/projects/vps/harness/scripts/`) registers a slug that is one of the built-ins.

## Maintenance notes

- If a Vocero tenant must legitimately move to a different destination, do it from `/ops` (ops login), not via the retry secret.
- Rotating `ALLOK_SAAS_LINK_SECRET` / `ALLOK_DESTINATION_SYNC_SECRET` is still worth doing if either ever left its two hosts; that is an operator decision, not part of this plan.
