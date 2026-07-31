# Meta WhatsApp production state

Snapshot: 2026-07-31 (America/Caracas)

This is the operational source of truth for the allok Meta WhatsApp integration. It records what was verified, what is deployed, and what still requires a real business owner action. It contains no credentials.

## Current verdict

The application and infrastructure are hardened for a supervised Coexistence pilot. The final real-message acceptance test is not complete because the verified SAMER portfolio has no phone number attached, while the existing production WhatsApp Business App number belongs to a separate, unverified portfolio. Meta's Embedded Signup is currently stopped at the business owner's legal acceptance and asset-selection step.

Do not describe the integration as fully production-accepted until the checklist under **Real acceptance test** passes with an eligible number.

## Verified Meta configuration

- Meta app: `servicioscreativos` (`4459170630986606`), published.
- Business: SAMER, verified and registered as a Tech Provider.
- Advanced access verified in the dashboard for `whatsapp_business_management` and `whatsapp_business_messaging`.
- Facebook Login for Business configuration: `1242395401244814`, Coexistence Embedded Signup variation.
- Production domain: `allok.fun`.
- OAuth redirects include `https://allok.fun/embedded-whatsapp` and `https://allok.fun/`.
- JavaScript SDK domain includes `allok.fun`; client OAuth, web OAuth, HTTPS enforcement, strict redirect mode, JavaScript login, and embedded-browser OAuth are enabled.
- Deauthorization callback: `https://allok.fun/api/meta/deauthorize`.
- Data deletion callback: `https://allok.fun/api/meta/data-deletion`.
- WhatsApp webhook callback: `https://allok.fun/api/meta/whatsapp/webhook`, Graph API `v25.0`.
- Subscribed fields visible in Meta: `account_update`, `history`, `messages`, `smb_app_state_sync`, and `smb_message_echoes`.
- Opening the live onboarding launches the correct Coexistence flow and requests the expected WhatsApp permissions.

The dashboard also shows that SAMER's WABA has no phone number. The existing high-quality WhatsApp Business App number is in another portfolio. Moving/selecting that asset and accepting Meta's displayed terms is a business-owner action, not an application defect.

## Deployed application behavior

### Onboarding and tenancy

- `/embedded-whatsapp` and all exchange/config/disconnect endpoints require a signed allok Ops session.
- Workspace identifiers are allowlisted and are bound server-side; client-supplied user/team/account ownership is discarded.
- The authorization code is exchanged only on the server.
- The connected business, WABA, phone number, profile, status, encrypted token, and `META_COEXISTENCE` mode are stored in Neon.
- A reconnect action is available. Disconnect uses the stored encrypted credential and only unsubscribes the app for Coexistence; it does not deregister the number from the WhatsApp Business app.
- The UI reads the real stored connection state instead of assuming success.

Current ceiling: this is secure operator-assisted, multi-workspace onboarding. It is not customer self-service identity isolation; all workspaces are administered behind the shared Ops access gate. Add customer identity/organization membership before exposing onboarding directly to unrelated customers.

### Provider boundary

`WhatsAppProvider` and `MetaCloudWhatsAppProvider` isolate Graph operations from the inbox and sales workflow. The provider implements connection status, text/media sending, read receipts, normalization, and mode-aware disconnect. Stored connections explicitly use `META_CLOUD_API` or `META_COEXISTENCE`.

### Webhook safety

- Verification challenge and raw-body `X-Hub-Signature-256` HMAC verification are enforced.
- Payloads over 2 MB are rejected.
- A signed payload is inserted into `meta_whatsapp_webhook_events` before HTTP acknowledgement.
- SHA-256 event keys and the existing unique message ID index provide delivery and message deduplication.
- Processing is asynchronous after acknowledgement, with row locking, stuck-job recovery, ten attempts, exponential backoff, and structured logs that contain IDs/counts rather than message contents or tokens.
- A protected drain endpoint is called every minute by n8n; the Vercel Hobby-compatible daily cron is a fallback.
- Ops diagnostics shows pending, processed, and failed event counts.
- `messages`, message statuses, `account_update`, and `smb_message_echoes` normalize to internal events and update the shared inbox.
- Unknown, malformed, `history`, and `smb_app_state_sync` shapes remain durable and visible as failed events. They are deliberately not guessed. Capture real dashboard fixtures before enabling history/contact-state parsing.

Tenant resolution uses the Meta `phone_number_id` as the Cloud API channel key and resolves it through the encrypted `whatsapp_connections` inventory. No webhook calls an LLM or forwards raw message payloads/tokens to n8n.

### Human supervision

- New conversations default to `assigned_mode='human'`.
- The inbox's AI action only creates a suggestion; sending requires an operator action.
- Three autonomous/duplicate n8n paths were unpublished: `WCEv8bH3K2mQpR7x`, `GPivmpnxybZTGKUs`, and `anmJandpqVJXUyzb`.
- Public probes of their former webhook paths return `404`, with no new executions.
- The Embedded Signup, Meta lifecycle, and verification workflows remain active.

## Infrastructure state

- allok is deployed by the GitHub/Vercel integration; it is not a Coolify workload.
- Neon migration `010_meta_whatsapp_webhook_events.sql` is applied. At the time of this snapshot there are zero customer connections and zero retained test events/messages.
- Production has the required Meta, database, token-encryption, n8n, WAHA HMAC, and cron variables. Values were not printed or copied into this repository.
- The production WAHA HMAC was synchronized with the live VPS session configuration. Live check: valid signature `200`; tampered and missing signatures `401`.
- n8n and both WAHA containers are healthy. WAHA session directories are `0700`; files are `0600`.
- n8n's pre-change database and workflow exports are stored under `/data/n8n/backups/` with mode `0600`; the primary snapshot timestamp is `20260731T140452Z`.

Known infrastructure debt:

- VPS public TCP ports `6001` and `6002` still bypass the reverse proxy, and SSH `22` is public. Close the WAHA origin ports in the provider firewall after confirming the desired emergency-access policy. Do not enable UFW blindly on this Docker/Coolify host.
- Coolify named volumes are not included in the current `/data` restic backup scope.
- n8n runs as one `latest` container without a worker/queue topology. This is adequate for the current empty/pilot load, not for high-volume multi-tenant delivery.

## Verification evidence

Run from the repository root:

```bash
pnpm check:meta-provider
pnpm check:webhook-signature
WEBHOOK_DB_CHECK=1 pnpm check:meta-webhook-db
pnpm exec tsc --noEmit --incremental false
pnpm lint
pnpm build
node --env-file=.env.local scripts/waha-webhook-check.mjs https://allok.fun
```

The 2026-07-31 gate passed provider Graph/normalization checks, signature tamper cases, a real Neon durable-enqueue/dedup/process/cleanup round trip, TypeScript, full ESLint, and the optimized Next `16.2.12` build. The production database was rechecked after cleanup and contained zero connections, events, conversations, and messages.

Unused CLI/UI dependencies were removed, `next` and `eslint-config-next` were updated to `16.2.12`, and patched `sharp`, `postcss`, and Babel resolutions are locked. `pnpm why` confirms the patched resolved graph; the npm audit service may still attribute advisories to Next's declared ranges.

## Real acceptance test

This requires the business owner and an eligible WhatsApp Business App number:

1. Sign in to allok Ops and open `/embedded-whatsapp?workspace=<workspace>`.
2. Continue through Meta's displayed SAMER authorization and accept its terms.
3. Select or move an eligible WhatsApp Business App number into the verified portfolio and complete Coexistence onboarding.
4. Confirm WABA/phone identifiers and encrypted connection state appear in allok Ops for the intended workspace.
5. Send one inbound WhatsApp message; confirm one conversation and one message appear for that phone/workspace.
6. Send an operator-approved reply from the platform within the 24-hour window; confirm receipt and delivery/read status.
7. Reply from the WhatsApp Business mobile app; confirm one `smb_message_echoes` outbound message appears with source `phone`.
8. Request an AI suggestion, take over manually, and confirm no autonomous n8n/agent reply is emitted.
9. Disconnect from allok; confirm the mobile WhatsApp Business app remains registered and usable.
10. Reconnect and repeat one inbound/outbound cycle.

Until those ten checks pass, message-history sync, contact-state sync, phone-change behavior, and mobile interruption recovery are unverified and must not be promised to customers.

## n8n rollback

The three unpublished workflows can be restored from the `20260731T140452Z` exports or republished with their recorded version IDs. Only do this after replacing their autonomous logic with tenant lookup, deduplication, human-takeover checks, and no plaintext token storage. Restart only n8n after republishing, then retest execution counts and public webhook registration.
