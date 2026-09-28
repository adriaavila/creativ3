# Plan 010: Growth invites never rewind a lead, dates are Caracas, and the setup price has one source

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a6f67ff..HEAD -- src/lib/growth-db.ts "src/app/api/ops/growth/drafts/[id]/invited/route.ts" src/components/ops/GrowthOpsClient.tsx src/app/api/stripe/checkout/route.ts src/lib/plans.test.ts`
> If plan 008 landed, `growth-db.ts` gained `markLeadPaid` (expected). Anything else changed: compare with the excerpts; on a mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug + tech-debt
- **Planned at**: commit `a6f67ff`, 2026-09-27

## Why this matters

`/ops/growth` lists businesses the research agent found. «Invitar por
WhatsApp» opens WhatsApp on Adrian's phone with a draft, then POSTs to
`/api/ops/growth/drafts/[id]/invited`, which logs the send and schedules the
next follow-up. Three defects:

1. **Re-opening rewinds the lead.** The card offers «Abrir otra vez» (it calls
   the same endpoint). `logInvite` always rewrites the lead's `next_action`,
   `next_action_at` and `last_contacted_at`, even when the send was already
   logged. Re-opening the first invite after follow-up 1 went out resets the
   lead to "Seguimiento 1 de la invitación". Worse, if that business has since
   come in through the WhatsApp agent (it now has `agent_state` and lives in
   Hoy), its Hoy next step (e.g. «Pedir el pago») is overwritten.
2. **The 10-per-day cold-message cap can be bypassed.** The route skips the cap
   when `draft.status === "approved"`, but a draft can be "approved" through the
   old «Aprobar» button without ever being sent.
3. **Growth's "due today" uses the UTC date.** From 8 p.m. Caracas time (UTC−4)
   it shows tomorrow's follow-ups as due.
4. **The US$499 setup price lives in three places**: `plans.ts`
   (`SETUP_SERVICE.price: 499`, shown on the site and in messages), the Stripe
   Payment Link, and `checkout/route.ts` (`unit_amount: 49_900`, hardcoded). A
   price change in `plans.ts` would still charge the old amount on
   `/pago/puesta-en-marcha`.

## Current state

- `src/lib/growth-db.ts` `logInvite(input)` (around lines 530-562):
  ```ts
  export async function logInvite(input: { draftId; leadId; kind: "dm" | "followup_1" | "followup_2"; recipient; content; sentBy; today }) {
    const sql = getSql();
    if (!sql) throw new Error("DATABASE_URL is not configured");
    const next = INVITE_NEXT[input.kind];
    const nextActionAt = next.days === null ? null : addDays(input.today, next.days);
    await sql.transaction([
      sql`
        INSERT INTO growth_outreach_messages (lead_id, channel, recipient, content, status, sent_by, sent_at, client_action_id)
        VALUES (${input.leadId}, 'whatsapp', ${input.recipient}, ${input.content}, 'sent', ${input.sentBy}, now(), ${input.draftId})
        ON CONFLICT (client_action_id) WHERE client_action_id IS NOT NULL DO NOTHING
      `,
      sql`
        UPDATE outreach_drafts SET content = ${input.content}, status = 'approved', reviewed_by = ${input.sentBy},
          reviewed_at = now(), updated_at = now()
        WHERE id = ${input.draftId}
      `,
      sql`
        UPDATE leads
        SET status = CASE WHEN status IN ('new', 'researched', 'drafted', 'approved') THEN 'contacted' ELSE status END,
            last_contacted_at = now(), next_action = ${next.action}, next_action_at = ${nextActionAt}::date, updated_at = now()
        WHERE id = ${input.leadId}
      `,
    ]);
    return { nextAction: next.action, nextActionAt };
  }
  ```
  `countInvitesToday()` counts `growth_outreach_messages` rows with a Caracas `created_at` of today.
- `src/app/api/ops/growth/drafts/[id]/invited/route.ts`:
  ```ts
  // Un reintento del mismo borrador no cuenta contra el tope (lo resuelve la llave única).
  if (draft.status !== "approved" && (await countInvitesToday()) >= DAILY_INVITE_CAP) {
    return Response.json({ error: `Ya van ${DAILY_INVITE_CAP} mensajes en frío hoy. Sigue mañana para cuidar el número.` }, { status: 429 });
  }
  const next = await logInvite({ … today: localDate(new Date()) });
  return Response.json({ ok: true, ...next });
  ```
- `src/components/ops/GrowthOpsClient.tsx`:
  - line ~105, inside the `buckets` `useMemo`: `const today = new Date().toISOString().slice(0, 10);`
  - `invite(draft)` (~line 129): on success `if (draft.status !== "approved") setInvitesToday((n) => n + 1);` then shows a notice with `payload.nextActionAt`.
- `src/lib/sales-queue.ts` exports `localDate(at)` (Caracas `YYYY-MM-DD`), and is already imported by client components (`HoyClient.tsx`), so it is client-safe.
- `src/app/api/stripe/checkout/route.ts` (~lines 12-18):
  ```ts
  // ponytail: ad-hoc prices inline; move to Stripe dashboard prices if they need editing without a deploy
  const AD_HOC = {
    "project-deposit": { currency: "usd", unit_amount: 20_000, name: "Depósito de proyecto allok" },
    "puesta-en-marcha": { currency: "usd", unit_amount: 49_900, name: "Puesta en marcha allok" },
    …
  } as const;
  ```
- `src/lib/plans.ts`: `export const SETUP_SERVICE = { name: "Puesta en marcha", price: 499, … } as const;`
- `src/lib/plans.test.ts` exists (8 tests, `node:test` + `assert/strict`); use its style.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tests | `pnpm test` | contains `ℹ fail 0` |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope**: `src/lib/growth-db.ts` (`logInvite` + one new helper), `src/app/api/ops/growth/drafts/[id]/invited/route.ts`, `src/components/ops/GrowthOpsClient.tsx` (the `today` line and `invite()`), `src/app/api/stripe/checkout/route.ts` (the one `puesta-en-marcha` line), `src/lib/plans.test.ts`.

**Out of scope**: `upsertCapturedLead`, `countInvitesToday`, the Stripe Payment Link amount (dashboard), any other `AD_HOC` price, `apps/growth-agent/**`.

## Git workflow

- Branch: `claude/010-growth-invite-fixes`
- Commits: `fix(growth): re-opening an invite never rewinds the lead`, `fix(growth): due dates in Caracas`, `fix(pago): setup price from plans.ts`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Update the lead only when the send is new, and never a Hoy lead

Rewrite the third statement of the transaction so it runs in the **same SQL
statement** as the insert (a CTE), and only updates when the insert added a
row and the lead has no `agent_state`:

```ts
const rows = await sql.transaction([
  sql`
    UPDATE outreach_drafts SET content = ${input.content}, status = 'approved', reviewed_by = ${input.sentBy},
      reviewed_at = now(), updated_at = now()
    WHERE id = ${input.draftId}
  `,
  sql`
    WITH logged AS (
      INSERT INTO growth_outreach_messages (lead_id, channel, recipient, content, status, sent_by, sent_at, client_action_id)
      VALUES (${input.leadId}, 'whatsapp', ${input.recipient}, ${input.content}, 'sent', ${input.sentBy}, now(), ${input.draftId})
      ON CONFLICT (client_action_id) WHERE client_action_id IS NOT NULL DO NOTHING
      RETURNING lead_id
    )
    UPDATE leads
    SET status = CASE WHEN status IN ('new', 'researched', 'drafted', 'approved') THEN 'contacted' ELSE status END,
        last_contacted_at = now(), next_action = ${next.action}, next_action_at = ${nextActionAt}::date, updated_at = now()
    WHERE id = ${input.leadId}
      AND EXISTS (SELECT 1 FROM logged)
      -- Si ya entró por el agente, su próximo paso lo decide Hoy, no la invitación.
      AND ((to_jsonb(leads) -> 'agent_state') IS NULL OR (to_jsonb(leads) -> 'agent_state') = 'null'::jsonb)
    RETURNING id
  `,
]);
const logged = rows[1].length > 0;
return { logged, nextAction: next.action, nextActionAt };
```

Keep the parentheses around the `agent_state` condition exactly as written
(without them `OR` would bypass the other conditions).
`to_jsonb(leads) -> 'agent_state'` is used elsewhere in this file, so it works
even where migration 021 is missing.

Note: when the send was new but the lead is a Hoy lead, `logged` is `false`
although the message row was written. That is acceptable for the notice text
("Anotado."), see Step 2.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Cap by "already logged", and tell the client the truth

1. In `src/lib/growth-db.ts` add:
   ```ts
   /** ¿Ya se anotó este borrador? Un «Abrir otra vez» no cuenta contra el tope. */
   export async function inviteAlreadyLogged(draftId: string): Promise<boolean> {
     const sql = getSql();
     if (!sql) return false;
     const rows = await sql`SELECT 1 FROM growth_outreach_messages WHERE client_action_id = ${draftId} LIMIT 1`;
     return rows.length > 0;
   }
   ```
2. In the route, replace `draft.status !== "approved" && …` with
   `const repeat = await inviteAlreadyLogged(draft.id);` and
   `if (!repeat && (await countInvitesToday()) >= DAILY_INVITE_CAP) { …429… }`.
3. After `logInvite`, return
   `Response.json({ ok: true, repeat, ...next })`.
4. In `GrowthOpsClient.tsx` `invite()`: replace `if (draft.status !== "approved") setInvitesToday((n) => n + 1);`
   with `if (!payload.repeat) setInvitesToday((n) => n + 1);`, and when
   `payload.repeat` is true show the notice `"Ya estaba anotado. No cambió el seguimiento."`
   instead of the dated one.

**Verify**: `pnpm exec tsc --noEmit && pnpm lint` → exit 0.

### Step 3: Caracas date in Growth

In `GrowthOpsClient.tsx`, replace
`const today = new Date().toISOString().slice(0, 10);` with
`const today = localDate(new Date());` and import `localDate` from
`@/lib/sales-queue` (merge with an existing import from that module if there is one).

**Verify**: `grep -n "toISOString().slice(0, 10)" src/components/ops/GrowthOpsClient.tsx` → no match; `pnpm exec tsc --noEmit` → exit 0.

### Step 4: One source for the setup price

In `src/app/api/stripe/checkout/route.ts`, import `SETUP_SERVICE` from
`@/lib/plans` and change the `puesta-en-marcha` line to:
```ts
"puesta-en-marcha": { currency: "usd", unit_amount: SETUP_SERVICE.price * 100, name: "Puesta en marcha allok" },
```
The object stays `as const`-compatible (if TypeScript complains about the
literal type, drop `as const` only for that entry by typing `AD_HOC` as
`Record<string, { currency: string; unit_amount: number; name: string }>`;
check that `checkout/route.ts` still compiles where it indexes `AD_HOC`).

In `src/lib/plans.test.ts` add:
```ts
test("la puesta en marcha cobra lo que dice la página", () => {
  assert.equal(SETUP_SERVICE.price, 499, "si cambia el precio, cambia también el Payment Link en Stripe");
});
```
(import `SETUP_SERVICE` if the file does not already.) The assertion exists to
force whoever changes the price to read the message about the dashboard link.

**Verify**: `pnpm test` → `ℹ fail 0`; `pnpm build` → exit 0.

## Test plan

- `plans.test.ts`: the price guard (Step 4).
- `logInvite` / the route have no DB test harness in this repo. Manual check
  for the operator after deploy: in `/ops/growth`, invite a draft, then tap
  «Abrir otra vez» → notice says "Ya estaba anotado", the invites-today counter
  does not move, and the lead's follow-up date is unchanged.

## Done criteria

- [ ] `grep -n "EXISTS (SELECT 1 FROM logged)" src/lib/growth-db.ts` → 1 match
- [ ] `grep -n 'draft.status !== "approved"' "src/app/api/ops/growth/drafts/[id]/invited/route.ts"` → no match
- [ ] `grep -n "49_900" src/app/api/stripe/checkout/route.ts` → no match
- [ ] `pnpm test` → `ℹ fail 0`; `pnpm exec tsc --noEmit && pnpm lint && pnpm build` → exit 0
- [ ] `git status --short` → only in-scope files
- [ ] `plans/README.md` row for 010 updated

## STOP conditions

- `sql.transaction` in `@neondatabase/serverless` 1.1.0 does not return per-statement row arrays (check the type of its result); if not, report instead of guessing.
- `growth_outreach_messages` has no unique index on `client_action_id` (the `ON CONFLICT` target) — check `db/migrations/017_ops_outbound_idempotency.sql`.
- The checkout route no longer has the `AD_HOC` map.

## Maintenance notes

- If the research agent ever writes leads that already have `agent_state`, they are Hoy's; this plan makes Growth leave them alone on purpose.
- The Stripe Payment Link amount is still set in the dashboard; the `plans.test` guard is the reminder.
