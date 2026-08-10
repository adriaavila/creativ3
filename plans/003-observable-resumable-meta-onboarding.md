# Plan 003: Make Meta onboarding observable and resumable

> **Executor instructions**: Follow the steps in order. Preserve all unrelated and pre-existing dirty-worktree changes. Keep the token exchange, encryption, Meta subscription, registration, and Coexistence sync inside Allok. If a STOP condition occurs, stop and report instead of improvising. When done, update this plan's row in `plans/README.md`.
>
> **Drift check (run first)**:
>
> ```bash
> git diff --stat 7564ea8..HEAD -- db/migrations src/app/api/meta/embedded-signup src/app/api/ops/whatsapp-connections src/components/whatsapp/EmbeddedSignupClient.tsx src/app/ops/clientes/page.tsx src/components/ops/ClientsClient.tsx src/lib/meta src/lib/whatsapp-connections-db.ts
> git status --short -- db/migrations src/app/api/meta/embedded-signup src/app/api/ops/whatsapp-connections src/components/whatsapp/EmbeddedSignupClient.tsx src/app/ops/clientes/page.tsx src/components/ops/ClientsClient.tsx src/lib/meta src/lib/whatsapp-connections-db.ts
> ```
>
> Expected dirty files include `src/app/ops/clientes/page.tsx`, `src/components/ops/ClientsClient.tsx`, and `src/lib/whatsapp-connections-db.ts`. They contain the new connection inventory and `businessTokenStored`; preserve them.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: none
- **Category**: reliability
- **Planned at**: commit `7564ea8`, 2026-08-10; dirty working tree

## Why this matters

Allok already has the stronger credential path: signed onboarding state, immediate server-side code exchange, token validation, AES-256-GCM persistence, WABA subscription, Cloud API registration, and one-shot Coexistence sync. The missing pieces are operational:

1. Events before a successful exchange are not persisted, so Ops cannot distinguish abandonment, missing code, missing IDs, or exchange failure.
2. If the code is exchanged and credentials are stored but a later Meta activation call fails, there is no explicit safe resume action. Retrying the one-use code is unreliable.

The community n8n templates inspired the event visibility, but their `Wait 10 seconds + client` correlation, per-client n8n credentials, and duplicate event rows are not the target architecture.

## Current state

- `EmbeddedSignupClient` receives `WA_EMBEDDED_SIGNUP`, but returns early for events without WABA and phone IDs. `CANCEL`, `current_step`, `error_code`, and `error_message` are not durably recorded.
- The exchange route binds ownership to a signed state containing `workspace`, mode, expiry, and nonce.
- The exchange route stores encrypted credentials before calling Meta, then subscribes the WABA and branches into Cloud API registration or Coexistence sync.
- `whatsapp_connections` is the canonical connection table and uses `(waba_id, phone_number_id)` as its identity.
- `/ops/clientes` now reads `whatsapp_connections` directly and exposes only whether `business_token` is stored, never the token value.
- There is no activation-resume endpoint. A `pending_subscription` credential row can be recovered manually in code, but not from Ops.
- A fresh owner-assisted Coexistence v4 onboarding remains the final production acceptance step.

## Product contract

After this plan:

- Every signed onboarding session has one attempt row keyed by its nonce.
- Ops can see the last safe event, current Meta step, timestamps, and failure summary for incomplete attempts.
- No attempt row contains the authorization code, business token, app secret, registration PIN, or request headers.
- A successful exchange still writes one canonical `whatsapp_connections` row.
- A stored connection in a safely retryable activation state exposes **Reintentar activación** in Ops.
- Resuming never re-exchanges a code and never blindly repeats a claimed one-shot Coexistence import.
- n8n is optional downstream notification/alerting only; it does not own credentials or correlation.

## Data model

Create `db/migrations/020_meta_onboarding_attempts.sql` with a rerunnable table:

```text
meta_onboarding_attempts
  nonce uuid primary key
  client text not null
  connection_mode text not null
  session_id text null
  last_event text null
  current_step text null
  waba_id text null
  phone_number_id text null
  code_received_at timestamptz null
  exchange_status text not null
  last_error text null
  started_at timestamptz not null
  updated_at timestamptz not null
  completed_at timestamptz null
```

Allowed `exchange_status` values:

```text
started | code_received | exchanging | credentials_stored | activating | completed | failed | cancelled
```

Use bounded text at the application boundary and indexes on `(exchange_status, updated_at DESC)` and `(client, updated_at DESC)`. Do not add the code or any credential column.

## Scope

**In scope**:

- `db/migrations/020_meta_onboarding_attempts.sql` (create)
- `src/lib/meta/onboarding-attempts-db.ts` (create)
- `src/lib/meta/onboarding-attempts.ts` or one existing pure module for validation/state decisions
- `src/app/api/meta/embedded-signup/event/route.ts` (create)
- `src/app/api/meta/embedded-signup/exchange/route.ts`
- `src/components/whatsapp/EmbeddedSignupClient.tsx`
- `src/lib/meta/server.ts` only for the minimum shared activation logic
- `src/lib/whatsapp-connections-db.ts`
- `src/app/api/ops/whatsapp-connections/[phoneNumberId]/resume/route.ts` (create)
- `src/app/ops/clientes/page.tsx`
- `src/components/ops/ClientsClient.tsx`
- One focused `src/lib/*onboarding*.test.ts` file
- `docs/meta-whatsapp-production-state.md`
- `plans/README.md` (status only)

**Out of scope**:

- Importing either community n8n workflow.
- Storing tokens as n8n credentials or forwarding tokens/codes to n8n.
- Replacing `whatsapp_connections` with an event table.
- A general queue, event bus, workflow engine, or automatic retry daemon.
- Blind retries of `history` or `smb_app_state_sync` after an ambiguous result.
- CRM provisioning, webhook override delivery, Inbox behavior, or Growth changes.
- Editing migrations 001–019.

## Steps

### Step 1: Add the attempt ledger

Create migration 020 and a narrow Neon data module. Provide only these operations:

- Start/upsert an attempt from verified signup state.
- Record a sanitized Embedded Signup event.
- Mark code received without storing the code.
- Advance the exchange/activation status.
- Mark a bounded failure or cancellation.
- List recent incomplete attempts for Ops.

Every write must receive `client`, mode, and nonce from verified server state, not from an untrusted body. Repeated events for one nonce update one row. Preserve the first `started_at`.

**Complete when**: the migration has no credential/code columns, is rerunnable, and the data module can express every allowed transition without exposing raw SQL to route handlers.

### Step 2: Persist sanitized SDK events

Add `POST /api/meta/embedded-signup/event`. Validate JSON, require the existing state cookie, compare the submitted state, and verify its signature/expiry exactly as the exchange route does. Accept only:

- `type = WA_EMBEDDED_SIGNUP`
- bounded `event`, `current_step`, `session_id`, `error_code`, and `error_message`
- numeric-looking bounded WABA, phone, and business IDs when present
- `code_received: boolean`, never a code string

Update `EmbeddedSignupClient` to post every relevant event, including cancellation and intermediate steps. On login callback, record only `code_received: true` before starting exchange. Copy `current_step`, error fields, timestamp, and session ID into the sanitized session passed to exchange.

Telemetry failure must not send secrets and must not turn a valid Meta authorization into a false success. Keep it observable in the browser/server logs with one tagged, secret-free message.

**Complete when**: an event without WABA/phone IDs still creates or updates one attempt row and neither browser requests nor server logs contain the code.

### Step 3: Track exchange state at real boundaries

Instrument the existing exchange route with the verified signup nonce:

1. `exchanging` immediately before the code exchange.
2. `credentials_stored` after the first successful encrypted upsert.
3. `activating` before WABA subscription/registration/sync.
4. `completed` only after the final status is persisted.
5. `failed` with a bounded, secret-free summary on every terminal error path.

Do not move the critical path into n8n. Preserve the current order: store recovery credentials before Meta mutations.

Correct the status derivation so a subscription response without `success: true` remains `pending_subscription`; it must not be presented as operational `connected`.

**Complete when**: each response path has a corresponding attempt state and `completed` implies the canonical connection row exists with its final activation status.

### Step 4: Add safe activation recovery

Add an authenticated Ops-only resume route keyed by `phoneNumberId`. Resolve the stored connection server-side and decrypt credentials only inside the provider call.

Recovery rules:

- WABA subscription may be retried idempotently using the stored token.
- Cloud API registration may be retried only with the stored original PIN; preserve the existing already-registered success handling.
- Coexistence imports may run only when the nonce has no claim marker. If metadata is `requesting`, `finished`, or otherwise ambiguous, return `action_required` without sending another one-shot request.
- A missing token or required PIN is a hard, explicit failure; never fall back to a new credential or PIN.
- Persist each resulting connection/attempt status before responding.

Extract one small shared activation helper only if exchange and resume would otherwise duplicate the Cloud API/Coexistence safety branch. Do not create a service class.

**Complete when**: replaying resume cannot exchange a code, rotate a PIN, or repeat a claimed Coexistence import.

### Step 5: Expose incomplete attempts and recovery in Ops

Extend `/ops/clientes` without exposing secrets:

- Add an **Onboardings incompletos** count and compact list.
- Show client, last safe step/event, age, and failure summary.
- Show **Reintentar activación** only for statuses the server declares safely resumable.
- Keep `client`, `waba_id`, `phone_number_id`, and token availability on completed connection cards.
- Refresh data after a successful resume and display the returned final state.

Do not recreate CRM status, destination, or handover editing on this page.

**Complete when**: an operator can distinguish abandonment from an activation failure and can resume only the latter.

### Step 6: Add focused regression checks

Use Node's built-in test runner. Cover pure boundaries rather than building a database fixture framework:

- Sanitization rejects code/token/secret fields and bounds text.
- One nonce is the correlation identity; `client` alone is insufficient.
- Status transitions cannot move a completed attempt backward.
- Subscription false maps to `pending_subscription`.
- Resume permits subscription and stored-PIN registration.
- Resume refuses a claimed/ambiguous Coexistence import.
- A token/credential value is never part of the public connection or attempt view.

**Complete when**: the new tests fail against the old behavior and pass with the implementation.

### Step 7: Verify locally and with one real onboarding

Run:

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm exec eslint src/app/api/meta/embedded-signup src/app/api/ops/whatsapp-connections src/components/whatsapp/EmbeddedSignupClient.tsx src/app/ops/clientes/page.tsx src/components/ops/ClientsClient.tsx src/lib/meta src/lib/whatsapp-connections-db.ts
pnpm check:meta-provider
pnpm build
git diff --check
```

Then complete one supervised fresh Coexistence v4 onboarding with the number owner. Verify:

1. One attempt row progresses through code received, credentials stored, activating, and completed.
2. One canonical connection row has `client`, WABA ID, phone ID, and an encrypted token.
3. WABA subscription succeeds and one-shot sync metadata is finished.
4. `/ops/clientes` shows the connection without exposing the token.
5. One inbound message and one allowed outbound test traverse the expected webhook/provider path.

If owner access is unavailable, code verification may finish but the plan remains **BLOCKED: fresh owner-assisted acceptance pending**, not DONE.

## Done criteria

- [ ] Migration 020 exists, is rerunnable, and stores no code or credential.
- [ ] Every onboarding session is correlated by verified nonce.
- [ ] Intermediate, cancelled, failed, and completed attempts are visible in Ops.
- [ ] The exchange route remains the only code-to-token owner.
- [ ] Tokens and PINs remain encrypted and server-only.
- [ ] Subscription failure remains non-operational and safely resumable.
- [ ] Cloud API resume reuses the original stored PIN.
- [ ] Claimed or ambiguous Coexistence imports are never blindly repeated.
- [ ] All automated gates pass.
- [ ] One fresh owner-assisted E2E onboarding passes.
- [ ] `plans/README.md` marks Plan 003 DONE.

## STOP conditions

Stop and report if:

- Migration 020 already exists or an equivalent attempt table landed with a conflicting contract.
- The live Meta event shape differs materially from the current parser during the supervised test.
- The state cookie is unavailable to the new event route and fixing it would weaken cookie or signature validation.
- A pending connection lacks the original token or Cloud API PIN required for recovery.
- Recovery would require repeating a Coexistence one-shot call whose prior outcome is ambiguous.
- Relevant dirty-worktree inventory/security changes cannot be preserved cleanly.
- Any verification command fails twice after one reasonable correction.

## Maintenance notes

- `meta_onboarding_attempts` is an operational ledger; `whatsapp_connections` remains the credential source of truth.
- Keep failure text bounded and scrubbed. Reviewers should search attempt writes and responses for `code`, `access_token`, `business_token`, `client_secret`, and request headers.
- Add n8n alerts only after the attempt ledger proves a recurring condition worth paging on. If added later, send attempt IDs and statuses only.
