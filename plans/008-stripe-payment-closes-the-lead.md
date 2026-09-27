# Plan 008: A Stripe payment closes the lead, starts onboarding, and sends the right receipt

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a6f67ff..HEAD -- src/app/api/stripe/webhook/route.ts src/lib/project-payment-email.ts src/lib/sales-queue.ts src/lib/growth-db.ts src/components/ops/HoyClient.tsx "src/app/api/ops/growth/leads/[id]/outcome/route.ts" scripts/check-project-payment-email.ts src/lib/sales-queue.test.ts`
> If plan 007 landed, `sales-queue.ts` changed in `messageFor` only; that is expected. Any other change: compare with the excerpts; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW-MED (touches the Stripe webhook; every change is additive or reorders best-effort work)
- **Depends on**: 006 recommended first (CI), 007 optional (touches the same `messageFor`)
- **Category**: bug + direction (money path)
- **Planned at**: commit `a6f67ff`, 2026-09-27

## Why this matters

The north star is 10 paying businesses by 2026-12-31. Today a payment is
invisible to the sales queue and gives the customer the wrong receipt:

1. **The receipt can block the record.** The Stripe webhook sends the receipt
   email **before** writing the purchase, and a Resend rejection throws, so the
   webhook returns 500 on every retry and the purchase row is never written
   (even with the database healthy).
2. **Nothing links a payment to its lead.** Hoy's proposed messages send the
   bare Payment Link; the webhook never touches `leads`. A lead only becomes
   "won" if Adrian remembers to tap «Pagó», and then it disappears from Hoy
   although the message promised "Cuando pagues, agendamos la instalación".
3. **The US$499 setup receipt reads as an agency deposit**: "Depósito de
   inicio de proyecto … la primera sesión de dirección", because the Payment
   Link session carries no `metadata.item` and there is no label for it.
4. **Nobody is alerted** when someone pays.

After this plan: a paid Payment Link session marks the matching lead `won`
with next step **«Instalar»** (it stays in Hoy at the top until Adrian taps
«Instalado»), stores the amount, sends a "puesta en marcha" receipt, and emails
Adrian an alert when `OPS_ALERT_EMAIL` is set.

## Current state

- `src/app/api/stripe/webhook/route.ts` — the handler. Key parts:
  ```ts
  const PROJECT_LABELS: Record<string, string> = { juanete: "Juanete", …, "desk-scale": "Desk Scale" };

  async function sendProjectPaymentEmail(session: Stripe.Checkout.Session) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const to = session.customer_details?.email;
    if (!apiKey || !from || !to) return;
    const item = session.metadata?.item ?? session.metadata?.plan ?? "";
    …
      kind: item === "project-continuation" ? "continuation" : "deposit",
    …
    const { error } = await new Resend(apiKey).emails.send(
      { from, to, subject: email.subject, html: email.html, text: email.text },
      { idempotencyKey: `project-payment/${session.id}` },
    );
    if (error) throw new Error("Project payment email was rejected.");
  }
  ```
  and in `POST`, inside `try`:
  ```ts
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    // El comprobante va ANTES de persistir: …
    if (session.payment_status === "paid") {
      await sendProjectPaymentEmail(session);
    }
    await recordStripePurchase({
      stripeSessionId: session.id,
      plan: session.metadata?.item ?? session.metadata?.plan ?? "unknown",
      …
  ```
  The outer `catch` logs `console.error("Could not persist Stripe event", event.id, error)` and returns 500 (so Stripe retries).
- `src/lib/project-payment-email.ts` — `projectPaymentEmail({ name, amount, currency, project, kind = "deposit" })` with `kind?: "deposit" | "continuation"`; builds `subject`, `text`, `html`. The non-continuation copy says "Depósito de inicio" and "preparar la primera sesión de dirección".
- `scripts/check-project-payment-email.ts` — assert-based self-check run with `pnpm check:billing` (script: `tsx scripts/check-billing-catalog.ts && tsx scripts/check-project-payment-email.ts`).
- `src/lib/plans.ts:155-169` — `SETUP_SERVICE = { name: "Puesta en marcha", price: 499, …, paymentUrl: "https://buy.stripe.com/14A3cx3JpcpobG55qdeEo00" }`. It is the **only** `buy.stripe.com` link in `src/` (checked with `grep -rn "buy.stripe.com" src`). The comment says it asks for the buyer's phone.
- `src/lib/sales-queue.ts`:
  - `export type Stage = "asked" | "interested" | "first" | CaptureStage;`
  - `export type Outcome = "talked" | "asked" | "paid" | "not_now" | "no_show";`
  - `const STAGE_RANK: Record<Stage, number> = { handoff: 0, replied: 1, after_call: 2, no_show: 2, call: 3, asked: 4, followup: 5, interested: 6, close: 7, first: 8 };`
  - `const CLOSED: LeadStatus[] = ["won", "lost"];`
  - `stageOf(lead, now)` starts with `if (CLOSED.includes(lead.status)) return null;`
  - `outcomePatch(...)`: `case "paid": return { status: "won", nextAction: null, nextActionAt: null };`
  - `messageFor(stage, lead)` — signature `lead: Pick<GrowthLead, "businessName" | "offerAngle"> & Partial<Pick<GrowthLead, "agentState">>`; uses `SETUP_SERVICE.paymentUrl` in `payAsk()`, in `case "asked"` and in `case "interested"` (and in the price-asked branch if plan 007 landed).
  - `localDate(at)` returns the Caracas `YYYY-MM-DD`.
- `src/lib/growth-db.ts` — Neon tagged-template SQL, `getSql()` returns `null` without `DATABASE_URL`. Exemplar for a phone-tail match (inside `upsertCapturedLead`):
  ```ts
  WHERE id = ${id} OR right(regexp_replace(coalesce(business_phone, ''), '\\D', '', 'g'), 10) = ${tail}
  ```
  (note the doubled backslash inside the template). `leads` columns used here: `id uuid`, `business_name`, `business_phone`, `status` (CHECK includes `'won'`), `next_action`, `next_action_at date`, `last_contacted_at`, `potential_value integer`, `updated_at`.
- `src/app/api/ops/growth/leads/[id]/outcome/route.ts` — `outcome: z.enum(["talked", "asked", "paid", "not_now", "no_show"])`.
- `src/components/ops/HoyClient.tsx`:
  - `STAGE_UI: Record<Stage, { label; className }>` (e.g. `handoff: { label: "Te pasó el agente", className: "bg-[var(--st-atencion-soft)] text-[var(--st-atencion-ink)]" }`).
  - `OUTCOMES` array of `{ id: Outcome; label; done }` (`{ id: "paid", label: "Pagó", done: "Pagó" }` …).
  - In `LeadCard`: `const outcomes = OUTCOMES.filter((o) => o.id !== "no_show" || stage === "after_call" || stage === "call");`
  - Status tokens available in `src/app/globals.css`: `--st-activo-soft` / `--st-activo-ink` (green, used for success), `--st-atencion-*`, `--st-atendiendo-*`, `--st-pausado-*`.
- Tests: `src/lib/sales-queue.test.ts` (pattern: `lead({...})` helper, `node:test` + `assert/strict`), `src/lib/ops-capture.test.ts` (`captured()` helper, message hygiene loop over `stages`).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tests | `pnpm test` | contains `ℹ fail 0` |
| Email check | `pnpm check:billing` | prints `Project payment email OK.` |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope**:
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/project-payment-email.ts`, `scripts/check-project-payment-email.ts`
- `src/lib/sales-queue.ts`, `src/lib/sales-queue.test.ts`, `src/lib/ops-capture.test.ts`
- `src/lib/growth-db.ts` (add one function)
- `src/app/api/ops/growth/leads/[id]/outcome/route.ts`
- `src/components/ops/HoyClient.tsx`

**Out of scope**:
- `src/app/api/stripe/checkout/route.ts` and `/pago/**` pages.
- Subscription events (`customer.subscription.*`) and `checkout.session.async_payment_*` (not used by the setup link; follow-up).
- Stripe dashboard settings and Vercel env vars: operator steps, listed at the end.
- `src/lib/ops-capture.ts`: its `closed` branch already keeps a `won` lead's `nextAction`, so «Instalar» survives the capture routine. Do not edit it.
- No DB migration: every column used already exists.

## Git workflow

- Branch: `claude/008-payment-closes-lead`
- Commits per step group, style `fix(stripe): …` / `feat(ops): …`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Persist first, email best-effort

In `webhook/route.ts`, inside `if (event.type === "checkout.session.completed")`:
1. Move `await recordStripePurchase({...})` **above** the email.
2. Replace the email call with a best-effort call that cannot fail the webhook:
   ```ts
   if (session.payment_status === "paid") {
     // El recibo no bloquea el registro: si Resend lo rechaza, el pago ya quedó guardado.
     await sendProjectPaymentEmail(session).catch((error) =>
       console.error("Payment receipt not sent", session.id, error instanceof Error ? error.message : error),
     );
   }
   ```
3. Update the Spanish comment above to say the record goes first and the
   receipt is best-effort (Resend dedupes by `session.id`).

**Verify**: `pnpm exec tsc --noEmit` → exit 0. `grep -n "recordStripePurchase\|sendProjectPaymentEmail(session)" src/app/api/stripe/webhook/route.ts` shows `recordStripePurchase` on an earlier line than the `sendProjectPaymentEmail(session)` call.

### Step 2: Recognize the setup Payment Link and give it its own receipt

1. In `webhook/route.ts` add a helper used by both the record and the email:
   ```ts
   // ponytail: el único Payment Link que se usa para vender es el de la puesta en marcha (plans.ts);
   // si aparece otro, ponerle `metadata.item` en Stripe en vez de adivinar aquí.
   const itemOf = (session: Stripe.Checkout.Session) =>
     session.metadata?.item ?? session.metadata?.plan ?? (session.payment_link ? "puesta-en-marcha" : "");
   ```
   Use `itemOf(session)` in `sendProjectPaymentEmail` (replacing the `item` line) and in `recordStripePurchase` as `plan: itemOf(session) || "unknown"`.
2. Add `"puesta-en-marcha": "Puesta en marcha"` to `PROJECT_LABELS`.
3. In `sendProjectPaymentEmail`, set `kind`:
   `kind: item === "project-continuation" ? "continuation" : item === "puesta-en-marcha" ? "setup" : "deposit",`
4. In `src/lib/project-payment-email.ts`, extend `kind?: "deposit" | "continuation" | "setup"` and give `setup` its own copy (draft, Adrian approves in the PR):
   - subject: `Recibimos el pago de tu puesta en marcha`
   - headline: `Tu agente ya está en camino.`
   - body sentence (text and html): `Recibimos tu pago de ${total} por la puesta en marcha. Te escribimos por WhatsApp para agendar la instalación.`
   - line item: `Puesta en marcha`
   Keep the existing `deposit` and `continuation` output byte-for-byte identical.
5. In `scripts/check-project-payment-email.ts`, before the final `console.log`, add:
   ```ts
   const setup = projectPaymentEmail({ name: "Ana", amount: 49_900, currency: "usd", project: "Puesta en marcha", kind: "setup" });
   assert.match(setup.subject, /puesta en marcha/i);
   assert.match(setup.html, /\$499\.00/);
   assert.doesNotMatch(setup.html, /Depósito de inicio|sesión de dirección/);
   ```

**Verify**: `pnpm check:billing` → ends with `Project payment email OK.`; `pnpm exec tsc --noEmit` → exit 0.

### Step 3: Onboarding stage in the sales queue

In `src/lib/sales-queue.ts`:
1. Add near `NO_SHOW_ACTION`:
   ```ts
   /** Pagó: el lead queda en Hoy hasta que Adrian marca «Instalado». */
   export const ONBOARD_ACTION = "Instalar";
   ```
2. `Stage` gains `"onboard"`; `Outcome` gains `"installed"`; `STAGE_RANK` gets `onboard: 0` (a paying customer goes first).
3. In `stageOf`, as the **first** line: `if (lead.status === "won" && lead.nextAction === ONBOARD_ACTION) return "onboard";`
4. In `outcomePatch`:
   - `case "paid": return { status: "won", nextAction: ONBOARD_ACTION, nextActionAt: today };`
   - `case "installed": return { status: "won", nextAction: null, nextActionAt: null };`
5. In `messageFor`, add:
   ```ts
   case "onboard":
     return `${hi}, recibí tu pago, gracias. Para dejar el agente andando conectamos tu WhatsApp con Meta en una llamada de 30 minutos. ¿Qué día te queda bien?`;
   ```
   (draft copy for Adrian's approval).
6. Tracked payment link. Change the `messageFor` signature's `Pick` to include `"id"`, add
   ```ts
   /** El link de pago con el id del lead: el webhook de Stripe lo usa para cerrar ese lead. */
   const payUrl = (leadId: string) => `${SETUP_SERVICE.paymentUrl}?client_reference_id=${encodeURIComponent(leadId)}`;
   ```
   and replace **every** `SETUP_SERVICE.paymentUrl` inside `messageFor` / `payAsk` with `payUrl(lead.id)` (make `payAsk` take `leadId`). Check with `grep -n "paymentUrl" src/lib/sales-queue.ts` → only the `payUrl` definition remains.

**Verify**: `pnpm exec tsc --noEmit` → it will now fail in `HoyClient.tsx` (missing `STAGE_UI.onboard`) and possibly in the outcome route. That is expected; fix in Step 4.

### Step 4: Hoy UI and the outcome route

1. `src/app/api/ops/growth/leads/[id]/outcome/route.ts`: add `"installed"` to the `z.enum`.
2. `src/components/ops/HoyClient.tsx`:
   - `STAGE_UI.onboard = { label: "Pagó: instalar", className: "bg-[var(--st-activo-soft)] text-[var(--st-activo-ink)]" }`
   - `OUTCOMES` add `{ id: "installed", label: "Instalado", done: "Instalado" }`
   - Replace the `outcomes` filter with:
     ```ts
     const outcomes = stage === "onboard"
       ? OUTCOMES.filter((o) => o.id === "installed")
       : OUTCOMES.filter((o) => o.id !== "installed" && (o.id !== "no_show" || stage === "after_call" || stage === "call"));
     ```
   - If the outcome button grid switches columns by button count (search `sm:grid-cols-5`), make sure a single button renders full width (no empty grid cells).

**Verify**: `pnpm exec tsc --noEmit && pnpm lint` → exit 0.

### Step 5: The webhook closes the lead

1. In `src/lib/growth-db.ts` add (import `ONBOARD_ACTION` and `localDate` from `./sales-queue` if not already imported):
   ```ts
   /**
    * Stripe cobró: el lead del `client_reference_id` (o, si no vino, el del mismo
    * teléfono) pasa a ganado con «Instalar» para hoy. Idempotente: un lead ya
    * ganado no se toca, así que los reintentos de Stripe no mueven nada.
    */
   export async function markLeadPaid(input: { leadId: string | null; phone: string | null; amountUsd: number | null }) {
     const sql = getSql();
     if (!sql) return null;
     const leadId = input.leadId && /^[0-9a-f-]{36}$/i.test(input.leadId) ? input.leadId : "";
     const tail = (input.phone ?? "").replace(/\D/g, "").slice(-10);
     if (!leadId && tail.length < 10) return null;
     const rows = await sql`
       UPDATE leads
       SET status = 'won', next_action = ${ONBOARD_ACTION}, next_action_at = ${localDate(new Date())}::date,
           last_contacted_at = now(), potential_value = coalesce(${input.amountUsd}, potential_value), updated_at = now()
       WHERE id = (
         SELECT id FROM leads
         WHERE id::text = ${leadId}
            OR (${tail} <> '' AND right(regexp_replace(coalesce(business_phone, ''), '\\D', '', 'g'), 10) = ${tail})
         ORDER BY (id::text = ${leadId}) DESC, created_at DESC
         LIMIT 1
       ) AND status <> 'won'
       RETURNING id, business_name
     `;
     return rows[0] ? { id: String(rows[0].id), businessName: String(rows[0].business_name) } : null;
   }
   ```
   `client_reference_id` wins over the phone because of the `ORDER BY`.
2. In `webhook/route.ts`, after `recordStripePurchase` and only when `session.payment_status === "paid"`:
   ```ts
   const lead = await markLeadPaid({
     leadId: session.client_reference_id ?? null,
     phone: session.customer_details?.phone ?? null,
     amountUsd: session.currency === "usd" && session.amount_total != null ? Math.round(session.amount_total / 100) : null,
   });
   ```
   A DB error here propagates to the existing `catch` → 500 → Stripe retries; that is correct because `markLeadPaid` is idempotent.
3. Alert (best-effort, only if `OPS_ALERT_EMAIL`, `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set):
   ```ts
   async function alertPaid(session: Stripe.Checkout.Session, businessName: string | null) {
     const apiKey = process.env.RESEND_API_KEY;
     const from = process.env.RESEND_FROM_EMAIL;
     const to = process.env.OPS_ALERT_EMAIL;
     if (!apiKey || !from || !to) return;
     const total = session.amount_total != null ? `${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase() ?? ""}` : "";
     const who = businessName ?? session.customer_details?.name ?? "Alguien";
     await new Resend(apiKey).emails.send(
       { from, to, subject: `Pagó: ${who} · ${total}`.trim(), text: `${who} pagó ${total}. En /ops Hoy queda como «Instalar».` },
       { idempotencyKey: `lead-paid/${session.id}` },
     );
   }
   ```
   Call it wrapped like the receipt: `await alertPaid(session, lead?.businessName ?? null).catch((e) => console.error("Paid alert not sent", session.id, e instanceof Error ? e.message : e));`
   Never log the phone, email or name.

**Verify**: `pnpm exec tsc --noEmit && pnpm lint` → exit 0.

### Step 6: Tests

In `src/lib/sales-queue.test.ts` (use its `lead()` helper) add one test:
```ts
test("pagó: queda en Hoy como «Instalar» hasta que se marca instalado", () => {
  const today = "2026-09-27";
  const paid = outcomePatch("paid", today);
  assert.deepEqual(paid, { status: "won", nextAction: ONBOARD_ACTION, nextActionAt: today });
  const onboarding = lead({ status: "won", nextAction: ONBOARD_ACTION, nextActionAt: today });
  assert.equal(stageOf(onboarding), "onboard");
  assert.equal(salesQueue([lead({ id: "a", nextActionAt: today }), onboarding], today)[0], onboarding, "el que pagó va primero");
  assert.deepEqual(outcomePatch("installed", today), { status: "won", nextAction: null, nextActionAt: null });
  assert.equal(stageOf(lead({ status: "won", nextAction: null })), null);
});
```
(import `ONBOARD_ACTION`; adjust the `lead()` call if its helper needs other fields.)

In `src/lib/ops-capture.test.ts`, in the message test:
- add `"onboard"` to the `stages` array of the hygiene loop;
- change the `after_call` assertion's URL part to also check the tracked link:
  `assert.match(messageFor("after_call", lead), /buy\.stripe\.com\/\S+\?client_reference_id=x /);`
  (the `captured()` helper's id is `"x"`).

**Verify**: `pnpm test` → `ℹ fail 0`, test count = previous + 1.

### Step 7: Full check

`pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm check:billing && pnpm build` → all exit 0.

## Test plan

- Unit (Step 6): paid → onboard stage, ordering, installed ends it, tracked link, copy hygiene for the new message.
- Email self-check (Step 2): setup receipt copy.
- Not unit-tested (no DB test harness in this repo): `markLeadPaid` SQL and the webhook wiring. They get the operator's Stripe test-mode check below.

## Operator steps (Adrian; the executor lists them in the report, does not do them)

1. Vercel env: `OPS_ALERT_EMAIL=<Adrian's inbox>` (env var change, needs approval).
2. Stripe **test mode**: open the setup Payment Link with `?client_reference_id=<a real lead uuid>` and pay with a test card; confirm in Neon that the lead is `won` / `Instalar` and the receipt says "puesta en marcha". Confirm the link's account is the same one whose webhook secret is in Vercel (`STRIPE_WEBHOOK_SECRET`); if the Payment Link lives in a different Stripe account, none of this fires.

## Done criteria

- [ ] `grep -n "paymentUrl" src/lib/sales-queue.ts` → only inside `payUrl`
- [ ] `grep -n "puesta-en-marcha" src/app/api/stripe/webhook/route.ts` → ≥ 2 matches
- [ ] In `webhook/route.ts`, `recordStripePurchase(` appears before `sendProjectPaymentEmail(session)`
- [ ] `pnpm test` → `ℹ fail 0` (one new test); `pnpm check:billing` → OK
- [ ] `pnpm lint && pnpm exec tsc --noEmit && pnpm build` → exit 0
- [ ] `git status --short` → only in-scope files
- [ ] PR description quotes the two new customer-facing texts (receipt, onboarding message) as drafts
- [ ] `plans/README.md` row for 008 updated

## STOP conditions

- `grep -rn "buy.stripe.com" src` finds more than one Payment Link (the `itemOf` shortcut would mislabel).
- The webhook no longer handles `checkout.session.completed` as in the excerpt.
- `leads.status` CHECK does not allow `'won'`, or `potential_value` does not exist.
- A test asserting the old `paid → nextAction: null` behavior exists elsewhere and fails.

## Maintenance notes

- The Hoy "Pagos" week counter (`weekStats`) counts `status === "won"`; with the webhook it now reflects real payments, not only taps.
- `ops-capture.ts` `followupFor` keeps a won lead's `nextAction`, so the VPS capture routine will not erase «Instalar». If that branch changes, re-check.
- Follow-ups deliberately left out: `checkout.session.async_payment_succeeded` (delayed methods), and a Telegram alert instead of email (the VPS routine could watch `leads` for new `won` rows).
