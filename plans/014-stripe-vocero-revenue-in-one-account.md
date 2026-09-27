# Plan 014: Vocero revenue (setup + monthly) is charged in one Stripe account, and every payment reaches allok.fun and Vocero

> **Executor instructions**: This is a mixed plan. Steps marked **[Adrian]**
> are decisions or live-money configuration and must not be done by an agent
> without Adrian's explicit go-ahead for that step. Steps marked **[code]** are
> normal PR work. Run every verification. On any STOP condition, stop and
> report.
>
> **Drift check (run first)**: `git diff --stat a6f67ff..HEAD -- src/lib/plans.ts "src/app/[locale]/pago/exito/page.tsx" src/components/billing/PaymentResult.tsx src/app/api/stripe/ src/lib/stripe-purchases-db.ts`
> Plan 008 (payment closes the lead) is expected to have landed first; if it has not, STOP: this plan builds on its webhook changes (multi-secret `STRIPE_WEBHOOK_SECRET`, `markLeadPaid`, `itemOf`).

## Status

- **Priority**: P0 (the north-star metric "negocios pagando / MRR" cannot move without it)
- **Effort**: M (half a day of code + ~30 min of Stripe dashboard/API config)
- **Risk**: MED (live payments; every live step is additive and reversible: new price, new link, new endpoint)
- **Depends on**: 008 merged
- **Category**: direction (money path)
- **Planned at**: commit `a6f67ff`, 2026-09-27

## Why this matters

Goal (ACTIVE.md): 10 businesses paying for Vocero by 2026-12-31, MRR ≥ US$500.
The site sells **Puesta en marcha US$499 once + plan Esencial US$49/month**
(`src/lib/plans.ts`). What Stripe actually has, read live on 2026-09-27
(read-only API):

| Account | What lives there | Problem |
|---|---|---|
| **allok LLC** `acct_1UDsQAQssTDjutCk` (live) | Price `allok_puesta_en_marcha` US$499 one-time; Payment Link `plink_1UJLej…` (`https://buy.stripe.com/14A3cx3JpcpobG55qdeEo00`, collects phone, `metadata.kind=puesta_en_marcha`, after-completion = Stripe's hosted page); recurring prices "Básico mensual" **US$29** and "Pro mensual" US$99 | **No webhook endpoints at all.** A setup payment never reaches allok.fun or Vocero. **No US$49 price.** The US$29 price contradicts the site. 0 checkout sessions and 0 subscriptions so far. |
| **allok agency** `acct_1SDQGcR787DBvVp2` | allok.fun's `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`; agency one-time items; `/api/stripe/checkout` `AD_HOC["puesta-en-marcha"]` (US$499) | The **same setup product can also be bought here** through `/pago/puesta-en-marcha`, so Vocero revenue would split across two accounts. |
| **allok LLC sandbox** `acct_1UDsQhJ9ye9C94el` | `vocero-crm` SaaS billing (test): checkout + webhook `https://whatsapp.allok.fun/api/saas/billing/webhook` | Live side of Vocero billing never configured (self-serve is "Not now"). |

Consequences today: the monthly US$49 has **no charge path at all** (the pay
ask names it, the link charges only the setup), so MRR stays US$0 whatever is
sold; a real payment triggers nothing; the buyer lands on Stripe's generic
page with no next step.

## Target design (recommended)

- **All Vocero revenue in allok LLC live.** Agency projects stay in the agency
  account (the separation in `docs/cobros.md` holds: two businesses, two books).
- **One Payment Link = setup + monthly.** A subscription-mode Payment Link with
  two line items: `allok_puesta_en_marcha` (US$499 one-time) + a new
  `allok_esencial_monthly` (US$49/month). Stripe allows one-time prices inside a
  subscription-mode link: the first invoice charges both, then US$49 monthly.
  Optional `subscription_data.trial_period_days` so the monthly starts after
  installation (decision D1).
- **Done-for-you, no self-serve.** Adrian sends the link from Hoy after the
  call (the message already exists). `?client_reference_id=<lead id>` (plan
  008) ties the payment to the lead.
- **Two webhook endpoints in allok LLC live**:
  1. `https://allok.fun/api/stripe/webhook` → lead won + «Instalar», receipt,
     alert, `stripe_purchases` / `stripe_subscriptions` rows (plan 008 code).
  2. `https://whatsapp.allok.fun/api/saas/billing/webhook` → Vocero org plan
     status. `vocero-crm` maps events to an org through
     `metadata.organizationId` on the subscription or the customer
     (`vocero-crm/src/app/api/saas/billing/webhook/route.ts:17-34`). With
     done-for-you, the org is created by Adrian after payment, so he sets
     `organizationId` on the Stripe **customer** then; the next
     `customer.subscription.updated` syncs the plan.
- **After payment the buyer lands on allok.fun**: `after_completion.redirect`
  → `https://allok.fun/es/pago/exito?session_id={CHECKOUT_SESSION_ID}`, and that
  page says what happens next ("te escribimos por WhatsApp para agendar la
  instalación") using the purchase row the webhook wrote, not a Stripe API call
  with the agency key (which cannot see LLC sessions).

## Decisions for Adrian (answer before the live steps)

- **D1. When does the US$49/month start?** (a) with the setup payment
  (simplest), (b) after a 30-day trial (the month of installation is free).
  Recommendation: **(b) 30 days**; it matches "Cuando pagues, agendamos la
  instalación" and avoids charging the monthly before the agent runs.
- **D2. The live US$29 "Básico mensual" price**: archive it (set inactive; it
  is never deleted and nothing uses it). Recommendation: archive.
- **D3. Completo US$99**: reuse the live "Pro mensual" US$99 price
  (add lookup key `allok_completo_monthly`). A second link for Completo is only
  needed when someone buys it.

## Current state (code)

- `src/lib/plans.ts:155-169` `SETUP_SERVICE.paymentUrl` = the current setup-only link.
- `src/app/[locale]/pago/exito/page.tsx` — `isProjectPayment(sessionId)` retrieves the session with `STRIPE_SECRET_KEY` (agency account) and checks `metadata.item`; for an LLC session it silently returns `false`.
- `src/components/billing/PaymentResult.tsx` — renders the success state; non-project payments get the CRM self-serve copy (links to `/conectar-whatsapp`). Its fallback also links to `/${locale}/desk`, which redirects to `/`.
- `src/app/api/stripe/checkout/route.ts` — `AD_HOC["puesta-en-marcha"]` creates a US$499 session **in the agency account**; `src/app/[locale]/pago/…` or `/pago/puesta-en-marcha` uses it.
- `src/lib/stripe-purchases-db.ts` — `getStripePurchaseBySessionId(id)` reads `stripe_purchases` (+ joined subscription status).
- After plan 008: webhook accepts several comma-separated secrets in `STRIPE_WEBHOOK_SECRET` (per the 007+008 branch), recognizes a Payment Link session as `puesta-en-marcha`, marks the lead won.

## Steps

### Step 1 [Adrian] Decide D1-D3

Record the answers in the PR description of Step 5.

### Step 2 [Adrian, live Stripe, reversible] Prices and the combined link in allok LLC

With the allok LLC **live** secret key (`~/CreativOS/_secrets/allok-saas-stripe.env`, variable `ALLOK_SAAS_STRIPE_SECRET_KEY_LIVE`; never print it):
1. Create product "Vocero Esencial" and price US$49.00/month, `lookup_key=allok_esencial_monthly`.
2. Add `lookup_key=allok_completo_monthly` to the existing US$99 price (D3).
3. Archive the US$29 price (D2): `active=false`.
4. Create the Payment Link: line items `[allok_puesta_en_marcha ×1, allok_esencial_monthly ×1]`, `phone_number_collection.enabled=true`, `metadata.kind=puesta_en_marcha`, `metadata.item=puesta-en-marcha`, `subscription_data.metadata.item=puesta-en-marcha`, `subscription_data.trial_period_days=30` if D1=(b), `after_completion={type:redirect, redirect:{url:"https://allok.fun/es/pago/exito?session_id={CHECKOUT_SESSION_ID}"}}`.
5. Deactivate the old setup-only link `plink_1UJLej…` **only after** Step 5 is deployed (the old link keeps working until then).

**Verify** (read-only): `GET /v1/payment_links/<new id>/line_items` shows both prices; `GET /v1/prices?lookup_keys[]=allok_esencial_monthly` returns one active US$4900 monthly price.

### Step 3 [Adrian, live Stripe + Vercel env] allok.fun webhook in allok LLC

1. Create endpoint `https://allok.fun/api/stripe/webhook` in allok LLC live with events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
2. Append its signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel (comma-separated, per plan 008) and redeploy.
3. Save the secret in `~/CreativOS/_secrets/allok-saas-stripe.env` as `ALLOK_LLC_ALLOKFUN_WEBHOOK_SECRET_LIVE`.

**Verify**: `stripe trigger`-equivalent is not available in live; use Stripe's "Send test webhook" for `checkout.session.completed` from the dashboard → allok.fun returns 2xx (the event is a fixture; it will not match a lead).

### Step 4 [Adrian, Coolify env] Vocero webhook in allok LLC live

1. Create endpoint `https://whatsapp.allok.fun/api/saas/billing/webhook` in allok LLC live with the `customer.subscription.*` and `invoice.*` events `vocero-crm` handles (read `vocero-crm/src/app/api/saas/billing/webhook/route.ts` for the list).
2. In Coolify (vocero-crm app) set the **live** values: `ALLOK_SAAS_STRIPE_SECRET_KEY`, `ALLOK_SAAS_STRIPE_WEBHOOK_SECRET`, `ALLOK_SAAS_STRIPE_BASIC_PRICE_ID` = the US$49 price id, `ALLOK_SAAS_STRIPE_PRO_PRICE_ID` = the US$99 price id. `SAAS_SELF_SERVE` stays off.
3. Runbook line for onboarding (add to `vocero-crm` admin docs): after creating the org for a paying customer, set `metadata.organizationId=<org id>` on their Stripe customer.

### Step 5 [code] allok.fun uses the combined link and shows the right next step

1. `src/lib/plans.ts`: `SETUP_SERVICE.paymentUrl` = the new link URL. Keep `payUrl(lead.id)` from plan 008 appending `client_reference_id`.
2. Copy that names the price (`payAsk()` and the price-asked follow-up in `sales-queue.ts`): if D1=(b), say "la puesta en marcha son US$499 hoy y el plan Esencial US$49 al mes desde el mes siguiente". Update the matching test regexes in `src/lib/ops-capture.test.ts`.
3. `src/app/[locale]/pago/exito/page.tsx`: replace the Stripe-API lookup with `getStripePurchaseBySessionId(sessionId)` (DB row written by the webhook) and pass `kind = purchase?.plan === "puesta-en-marcha" ? "setup" : …` to `PaymentResult`. When the row is not there yet (webhook race), show the setup copy anyway if the `session_id` starts with `cs_live_` and say "tu pago se está confirmando".
4. `PaymentResult.tsx`: a `setup` state with: "Pago recibido. Te escribimos por WhatsApp hoy para agendar la instalación (30 minutos)." plus the WhatsApp button (`wa.me/584220023684` with prefill "Hola, vengo de allok.fun. Ya pagué la puesta en marcha."). Remove the `/desk` fallback link (it redirects to `/`).
5. `/pago/puesta-en-marcha`: stop creating agency-account sessions for it. Make the page's button go to `SETUP_SERVICE.paymentUrl` (the LLC link) and remove `"puesta-en-marcha"` from `AD_HOC` in `checkout/route.ts` (and from any catalog test that lists it).
6. `docs/cobros.md`: rewrite the account table to the target design above (Vocero revenue = allok LLC live; agency = agency account) with today's date.

**Verify**: `pnpm test` → `ℹ fail 0`; `pnpm exec tsc --noEmit && pnpm lint && pnpm build` → exit 0; `grep -rn "14A3cx3JpcpobG55qdeEo00" src` → no match; `grep -n "puesta-en-marcha" src/app/api/stripe/checkout/route.ts` → no match.

### Step 6 [Adrian] One real end-to-end check

Stripe live cannot be tested with test cards. Options, pick one:
- (a) Adrian pays the new link himself with `?client_reference_id=<a test lead id>` created in Hoy, confirms: lead shows «Pagó: instalar», receipt says "puesta en marcha", alert email arrives, `stripe_subscriptions` has the row; then refunds in the dashboard and cancels the subscription.
- (b) Repeat Steps 2-3 in allok LLC **test mode** (needs that account's test key, not the sandbox key) and pay with `4242 4242 4242 4242`.

## Done criteria

- [ ] allok LLC live has exactly one active monthly price at US$49 (`allok_esencial_monthly`) and the US$29 price is inactive
- [ ] The combined Payment Link exists; `plans.ts` points to it; the old link is deactivated after deploy
- [ ] allok LLC live lists 2 webhook endpoints (allok.fun, whatsapp.allok.fun), both enabled
- [ ] `/pago/exito?session_id=<LLC session>` shows the setup next step
- [ ] `AD_HOC` has no `puesta-en-marcha`
- [ ] Step 6 check done and recorded in `~/allok/wiki/negocio/` (sales log)

## STOP conditions

- Plan 008 not merged (no multi-secret webhook, no `markLeadPaid`).
- Any live checkout session or subscription appears in allok LLC between planning and execution (someone paid through the old link): handle that customer first.
- `vocero-crm`'s webhook route no longer maps by `metadata.organizationId`.

## Maintenance notes

- When self-serve returns (`SAAS_SELF_SERVE=true`), `vocero-crm`'s own checkout creates subscriptions with `organizationId` metadata in the same account and prices, so nothing here has to move.
- Failed renewals (`invoice.payment_failed`) and revoking access on cancel are listed as gaps in `docs/cobros.md`; they matter from the third subscriber. `vocero-crm` owns access; allok.fun only records.
