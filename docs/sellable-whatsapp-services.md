# Making Coexistence (Meta Tech Provider) + WAHA automation sellable

Lane: **CASH**. Goal is not more product — it is being able to demo both channels
on a call, without praying, and take money the same week.

Audited 2026-07-29 against live prod (`allok.fun`, Neon `neondb`,
`waha.allok.fun`, Meta app `4459170630986606`).

---

## 0. Reality check — the code is built, prod is unplugged

Built and good (do not rebuild anything here):

| Piece | File | State |
|---|---|---|
| Coexistence onboarding | `src/lib/meta/server.ts`, `src/app/embedded-whatsapp/page.tsx` | complete |
| Meta webhook (5 field types, dedup, echoes) | `src/app/api/meta/whatsapp/webhook/route.ts` | complete |
| WAHA send + session + QR | `src/lib/waha-send.ts`, `src/app/api/waha/pair/route.ts` | complete |
| WAHA webhook (message, ack, HMAC) | `src/app/api/waha/webhook/route.ts` | complete |
| Dual-channel router + 24h window rule | `src/lib/whatsapp-send.ts` | complete |
| Inbox + AI suggest | `src/app/ops/inbox/page.tsx`, `src/lib/whatsapp-ai.ts` | complete |
| Token encryption AES-256-GCM | `src/lib/crypto/token-cipher.ts` | complete |
| Checkout with channel knob + Stripe webhook | `src/app/api/stripe/{checkout,webhook}/route.ts` | complete |

Broken in production **right now** (measured, not guessed):

1. **Migrations 006/007/008 never applied.** Live DB has only
   `growth_runs, leads, outreach_drafts, public_agent_events,
   growth_outreach_messages, whatsapp_connections`. Missing
   `wa_conversations`, `wa_messages`, `waha_connections`, `stripe_purchases`,
   plus 003's `growth_campaigns`/`content_items`. → **any inbound message
   crashes the webhook. The inbox cannot work.**
2. **Vercel prod is missing 8 env vars** (`vercel env ls production`):
   `WAHA_URL`, `WAHA_API_KEY`, `WAHA_SESSION`, `WAHA_WEBHOOK_HMAC_KEY`,
   `TOKEN_ENCRYPTION_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `GROWTH_AGENT_USERNAME`/`PASSWORD`. Consequences:
   - no `TOKEN_ENCRYPTION_KEY` → `encryptToken()` throws → **coexistence
     onboarding fails in prod today**;
   - no `WAHA_*` → `isWahaConfigured()` false → **WAHA channel dead in prod**;
   - no `STRIPE_SECRET_KEY` → **checkout cannot take money**.
3. **WAHA VPS has zero sessions.** `GET waha.allok.fun/api/sessions` → `200 []`.
   Nothing paired, so there is no number to demo with.
4. **`whatsapp_connections` has 0 rows.** No coexistence number has ever been
   connected in prod. Every claim about it is currently untested in the wild.
5. **Zero automated tests** in the repo. Playwright is a devDependency with no
   specs and no `test` script.

What is healthy: `allok.fun` 200, Meta webhook GET verify echoes the challenge
(200), WAHA TLS + API key work (200), Neon reachable (`SELECT 1` ok), privacy
and ToS URLs live.

**Unverified and it matters:** Meta App Review status for
`whatsapp_business_management` + `whatsapp_business_messaging` cannot be read
from the Graph API. Check the dashboard before promising Cloud API onboarding
to a stranger. If it is not approved → sell WAHA now, Cloud API as an upgrade.

---

## Phase 0 — Unplug prod (~2h, today, before anything else)

Nothing else in this doc is worth doing first. This is the money path.

```bash
cd /Users/ama/projects/saas/allok
set -a && . ./.env.local && set +a
for f in 003_campaign_content 006_whatsapp_channels_inbox 007_stripe_purchases 008_conversation_outcomes; do
  node scripts/run-migration.mjs "db/migrations/$f.sql"
done
```

Then push the missing prod env vars (all already correct in `.env.local`
except the Stripe pair, which needs live keys from the Stripe dashboard):

```bash
for k in WAHA_URL WAHA_API_KEY WAHA_SESSION WAHA_WEBHOOK_HMAC_KEY TOKEN_ENCRYPTION_KEY GROWTH_AGENT_USERNAME GROWTH_AGENT_PASSWORD; do
  grep -E "^$k=" .env.local | cut -d= -f2- | tr -d '"' | npx vercel env add "$k" production
done
```

`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are not in `.env.local` — add
them by hand, and point the Stripe webhook endpoint at
`https://allok.fun/api/stripe/webhook`.

Also set `WAHA_WEBHOOK_URL` on the VPS side to
`https://allok.fun/api/waha/webhook` with the same HMAC key, or inbound WAHA
messages never arrive.

Redeploy. **Gate to leave Phase 0:** one real coexistence number connected
(`whatsapp_connections` has 1 row) and one WAHA session paired
(`/api/sessions` non-empty). Until both are true there is nothing to sell.

---

## Phase 1 — Tests (~1 day)

Smallest set that fails if the money path breaks. No framework, no new deps —
`node:test` + the `tsx` already installed.

```json
"test": "node --import tsx --test src/**/*.test.ts",
"smoke": "node scripts/smoke.mjs"
```

Two small extractions first, so the important logic is testable without a DB:

- `persistChange()` in the Meta webhook → split into pure
  `src/lib/meta/webhook-parse.ts` (`parseChange(change) → ops[]`) + a thin
  applier that runs the ops. ~40 lines moved, no behaviour change.
- `verifySignature()` is duplicated in both webhook routes → one
  `src/lib/webhook-signature.ts`.

Then four unit files:

| File | Locks down |
|---|---|
| `src/lib/meta/webhook-parse.test.ts` | `messages`→(in, api), `smb_message_echoes`→(out, phone), `history` batch, `statuses`→status update, `smb_app_state_sync`→contact name, same `wa_message_id` twice → one op |
| `src/lib/webhook-signature.test.ts` | valid sig passes, tampered body fails, missing header fails, wrong-length header does not throw |
| `src/lib/whatsapp-send.test.ts` | export `requiresTemplate(lastInboundAt, now)`; <24h free text ok, ≥24h without template throws `OutsideFreeTextWindowError`, `lastInboundAt=null` → template required |
| `src/lib/crypto/token-cipher.test.ts` | round-trip, wrong key fails loudly, non-32-byte key rejected |

Plus `scripts/smoke.mjs` — read-only, run before every demo call, extends the
existing `meta:diagnostics` pattern. Checks: required env present (names only,
never values), the 4 new tables exist, `GET /api/sessions` returns ≥1 connected
session, Meta webhook GET verify echoes, Graph app reachable. Prints a single
GO / NO-GO line.

Deliberately skipped: route-level and Playwright E2E tests. Add the first
Playwright spec only when a demo breaks in a way `smoke.mjs` did not catch.

---

## Phase 2 — Demos (~1 day)

Two demos, because there are two products with different buyers.

**Demo A — Coexistence (the differentiator, 6 min).** This is the thing
competitors cannot do: the owner keeps using WhatsApp on their phone.

1. Show the prospect's problem: messages lost, nobody answers after hours.
2. `/embedded-whatsapp` → connect a number live (use a second real number, not
   a screenshot). Point out: the phone keeps working, no QR, no number moved.
3. Send a message from a third phone → it lands in `/ops/inbox` in seconds.
4. Reply from `/ops/inbox` → arrives on the third phone.
5. **The money moment:** reply from the owner's phone → it appears in the same
   thread, tagged as phone/`smb_message_echoes`. Say the line out loud: "your
   team sees everything, whoever answered."
6. AI suggests a reply, human presses send. Explain `assigned_mode` starts on
   human — you control the automation, it does not run loose.

**Demo B — WAHA (the fast yes, 3 min).** For prospects who will not wait on Meta.

1. `/api/waha/pair` → QR on screen.
2. Prospect scans with their own phone. Connected in <90s.
3. Message in → auto-reply out, live.
4. State the tradeoff before they ask (see objections below). Do not hide it.

**Recordings.** One 3-min screen recording per channel, made once, hosted on
`allok.fun`. Purpose: the fallback when a live demo is risky (bad wifi, Meta
slow, prospect on mobile), and the REACH artifact for the week. Link them from
the pricing section — a working recording sells while asleep.

**Pre-call ritual:** `npm run smoke` → must print GO. If NO-GO, run the
recording instead of the live demo. That single rule is most of "with
confidence."

---

## Phase 3 — Sales package (~1 day)

Pricing already exists in `src/app/api/stripe/checkout/route.ts`
($390/$79, $690/$129, $1490/$290, plus a Cloud API channel line item). Do not
re-price. What is missing is everything around it.

**Channel decision table** — use live on the call, one screen:

| | WAHA | Cloud API (coexistence) |
|---|---|---|
| Live in | hours | days (Meta approval) |
| Official | no | yes |
| Owner keeps using their phone | yes | yes |
| Ban risk | real, disclose it | none |
| Outside 24h window | free text works | template required |
| Best for | "I need this now" | "this is my main line" |

**Written scope, one page.** What you deliver, what the client provides (number,
FB Business Manager, first 10 FAQs), timeline from payment to live, what is
explicitly not included. Scope creep = new quote, per root `CLAUDE.md`.

**WAHA risk disclosure** — required, not optional. Explicit copy at checkout
and in the ToS: unofficial channel, number can be banned by Meta, no
structured templates, no Meta guarantees. Selling this without disclosure is
the fastest route to a refund and a bad reference.

**Objection sheet** (write the answers before hearing the questions): ban risk
· how long Meta approval takes · who owns the number (they do, always) · what
happens if they cancel · why not just hire a person · does the AI answer
without supervision (no, `assigned_mode` starts human).

**Delivery runbook.** Payment → live, step by step, so quoting a date is not a
guess. Coexistence path and WAHA path differ; write both.

---

## Order and timebox

| When | What | Done means |
|---|---|---|
| Today, 2h | Phase 0 | 1 coexistence number + 1 WAHA session live in prod |
| Day 1 | Phase 1 | `npm test` green, `npm run smoke` prints GO |
| Day 2 | Phase 2 | both demos run twice back-to-back without a fix; 2 recordings up |
| Day 3 | Phase 3 | scope page, decision table, objection sheet, disclosure copy shipped |
| Day 4+ | Sell | 3 prospect convos/week into `SCOREBOARD.md` |

Three days of work, then it is a distribution problem, not a build problem.

## What this plan deliberately does not do

- No new features. Everything in Phase 0 is config; Phases 1–3 are proof and paper.
- No multi-tenant refactor, no Hermes cutover, no harness tier. Those are in
  `whatsapp-dual-channel-plan.md` §1.2/§4.4 and sell nothing this month.
- No route-level or E2E test suite until a real demo failure justifies one.
- No landing rebuild. Sell with what exists (root `CLAUDE.md`, CASH rules).
