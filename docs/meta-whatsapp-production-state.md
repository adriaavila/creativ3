# Meta WhatsApp production state

Snapshot: **2026-08-08 (America/Caracas)**. This file contains no credentials.

## Verdict

Allok WhatsApp Coexistence is implemented and suitable for a supervised pilot;
fresh-onboarding E2E acceptance still requires the number owner. Existing
production traffic is healthy. The public onboarding blocker was fixed,
Facebook Login v4 opens correctly, Meta callbacks and webhooks are on Allok,
Neon persistence is healthy, and n8n recovery is healthy.

One acceptance step remains owner-dependent: complete a fresh v4 onboarding (or
eligible re-onboarding) through WABA/number selection so the new one-shot
contact/history imports can be observed from Meta. Existing production evidence
already proves inbound messages, mobile-app echoes, Cloud API sending and queue
processing.

## Meta configuration verified

- Published app: `servicioscreativos` (`4459170630986606`).
- Business portfolio shown by Facebook Login: **SAMER**, verified Tech Provider.
- Coexistence Embedded Signup v4 config: `1529564728405358`.
- Plain Cloud API config: `2209746449804987`.
- Old Coexistence v2 config: `1242395401244814`; obsolete and no longer used by
  Vercel/local runtime. Meta retires v2 on 2026-10-15.
- Graph API: `v25.0`.
- Required permissions: `whatsapp_business_management` and
  `whatsapp_business_messaging`.
- Deauthorization callback: `https://allok.fun/api/meta/deauthorize`.
- Data-deletion callback: `https://allok.fun/api/meta/data-deletion`.
- WhatsApp callback: `https://allok.fun/api/meta/whatsapp/webhook`.
- Subscribed fields: `account_update`, `history`, `messages`,
  `smb_app_state_sync`, `smb_message_echoes`.

The live popup reached `facebook.com/v25.0/dialog/oauth`, used config v4 and
displayed the expected Embedded Signup introduction. It currently presents the
partner name **SAMER** to customers. Keep it if that is the intended legal name;
otherwise branding must be changed in Meta Business/App settings, not in Allok.

Official references: [Coexistence onboarding](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users) and [Embedded Signup v4](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/version-4).

## Application behavior deployed

- Production deployment: `dpl_4fQoVDyY5v42xMpKeWCZUFSo1v6y`, `Ready` and
  aliased to `https://allok.fun` on 2026-08-08.
- Ops creates a signed seven-day invitation. A customer opens
  `/embedded-whatsapp?client=<workspace>&invite=<signed>` without Ops login.
- A missing/expired invite renders a safe customer message; the config API
  rejects it with `403`.
- The 15-minute signup `state` is separately signed and bound to workspace and
  `META_COEXISTENCE`/`META_CLOUD_API` mode.
- Code exchange, token validation and Graph calls occur server-side. Tokens are
  encrypted before Neon storage and are never forwarded to n8n.
- Allok persists the token, IDs and encrypted Cloud API PIN before any WABA
  subscription or phone registration, so an interrupted final status update is
  recoverable without inventing a new PIN.
- Coexistence never calls `/{PHONE_ID}/register` or `/deregister`.
- After WABA subscription, Allok verifies `is_on_biz_app`/`platform_type` and
  makes each allowed `/{PHONE_ID}/smb_app_data` request once: contacts and
  history. Outcomes are stored in connection metadata.
- `history` normalizes exact thread/message direction and historical status;
  existing unique `wa_message_id` enforces idempotency.
- `smb_app_state_sync` upserts/removes the contact display name without creating
  a fake message.
- A customer-declined history import (`2593109`) is recorded as a valid no-op,
  not a poisoned queue item.
- Lifecycle callbacks update/delete Neon first. n8n notification is best effort,
  so an n8n outage cannot make Meta's deauthorization/data-deletion callback fail.

## Production evidence

At the snapshot:

- Meta queue: 1.816 `processed`, 0 `pending`, 0 `failed`.
- Connections: one `META_COEXISTENCE` and one `META_CLOUD_API`, both subscribed.
- Coexistence messages only: 587 inbound/API, 674 outbound/phone and 1
  outbound/API. Cloud API pure separately had 3 inbound/API and 2 outbound/AI.
  Recent real inbound and app-echo traffic was present on 2026-08-08.
- A real Neon integration check persisted and removed inbound, historical
  inbound/outbound and contact-sync fixtures; it verified durable enqueue,
  webhook dedup, message idempotency and cleanup.
- Signed production deauthorization and data-deletion probes returned success;
  n8n executions `11043` and `11044` both completed successfully.
- Webhook handshake returned its challenge; a bad signature returned `401`.
- Authenticated drain returned zero pending/failed work.
- Public signed onboarding returned `200`, used app `4459170630986606`, config
  `1529564728405358`, Graph `v25.0`, and did not redirect to `/ops-login`.

## n8n/VPS state

- URL: `https://n8n.frontia.app`.
- Version/image: `docker.n8n.io/n8nio/n8n:2.29.10`, pinned on 2026-08-07.
- Container health after controlled recreation: running, zero restarts,
  `/healthz` OK.
- Before the change, a consistent SQLite snapshot passed `PRAGMA integrity_check`
  and was stored at
  `/data/dumps/n8n-pre-allok-coexistence-20260807.sqlite`.
- `allok - Drain Meta Webhook Queue` (`Yf3mR8qK2vL7sN5p`) remains active. It had
  10.080 successes and zero errors over seven days; execution `11035` succeeded
  after the version-pinned restart. Executions `12057`–`12059` also succeeded
  after the final Allok production deployment.
- `Meta Embedded Signup - Tech Provider` (`EA6f6q8SZkewllyJ`) remains active only
  for lifecycle/diagnostic notifications; it does not exchange or store tokens.
- Obsolete direct `Meta deauthorize` and `Meta data deletion` workflows were
  unpublished. Meta now calls the durable Allok routes.

## Verification commands

```bash
pnpm test
pnpm run check:meta-provider
pnpm exec tsc --noEmit
pnpm build
WEBHOOK_DB_CHECK=1 node --env-file=.env.local --import tsx scripts/check-meta-webhook-db.ts
node --env-file=.env.local scripts/meta-embedded-signup-diagnostics.mjs --test-n8n
node --env-file=.env.local --import tsx scripts/check-meta-coexistence-acceptance.ts <PHONE_NUMBER_ID>
```

The 2026-08-08 run passed 31/31 tests, provider Graph request checks, TypeScript,
the Next.js 16.2.12 production build and the live Neon round trip.

## Owner acceptance checklist

1. Generate a new signed Coexistence URL in Ops.
2. Complete Meta's WABA/number selection with an eligible WhatsApp Business App
   owner and explicitly choose whether to share contacts/history.
3. Confirm the connection status is `coexistence_sync_requested`, not
   `coexistence_sync_action_required`.
4. Confirm a real `smb_app_state_sync` contact and at least one `history` chunk
   are processed, or document that the owner declined history.
5. Send one inbound message and one Allok reply; verify delivery/read status.
6. Send one reply from the mobile app; verify exactly one outbound `phone` echo.
7. Disconnect from Allok and confirm the mobile app remains registered.
8. Reconnect and repeat one inbound/outbound cycle.

After steps 2–6, run the safe acceptance command above with the selected
`PHONE_NUMBER_ID`. It prints no token, PIN, nonce or message body. Save its JSON
next to the onboarding date and workspace. Required evidence is:

- connection mode `META_COEXISTENCE`, a completed sync state and no
  `coexistence_sync_action_required` status;
- processed `messages` and `smb_message_echoes` rows;
- processed `smb_app_state_sync` and `history` rows when the owner authorized
  them, or `history_declined > 0` when Meta reports code `2593109`;
- at least one inbound/API message, one outbound/API message and one
  outbound/phone echo for the full send/receive acceptance.

If a queue row reaches `failed`, do not blindly reset it or repeat
`/smb_app_data`. Inspect `last_error`, fix the processor/root cause, then have an
operator move only the identified webhook row back to `pending`. A one-shot
contact/history request that failed ambiguously requires Meta review or a new
eligible onboarding, not an automatic retry.

Until steps 2–8 are repeated with the owner's chosen number, advertise history
as “available when authorized and delivered by Meta,” not as a guaranteed full
backup.

## Security note

Never put App Secrets, verify tokens, n8n secrets, database URLs or access tokens
in notes, source control or client-side variables. Any credential previously
copied into a chat or note should be rotated in Meta/Vercel/n8n even if the chat
is private. IDs and callback URLs above are identifiers, not credentials.
