# Meta WhatsApp Embedded Signup

> Production status and the current acceptance blocker are tracked in
> [`docs/meta-whatsapp-production-state.md`](./meta-whatsapp-production-state.md).

This app uses Meta Embedded Signup for a Tech Provider onboarding flow.

## Runtime Env

Configure these in Vercel/Coolify and in local `.env.local` when testing. Do not commit `.env`.

```txt
META_APP_ID=
META_APP_SECRET=
META_CONFIG_ID=1529564728405358
META_CONFIG_ID_CLOUD_API=2209746449804987
META_GRAPH_VERSION=v25.0
META_WEBHOOK_VERIFY_TOKEN=
META_WEBHOOK_CALLBACK_URL=https://YOUR_DOMAIN/api/meta/whatsapp/webhook
DATABASE_URL=
TOKEN_ENCRYPTION_KEY=
CRON_SECRET=
N8N_WEBHOOK_URL=https://n8n.frontia.app/webhook/meta/embedded-signup
N8N_WEBHOOK_SECRET=
APP_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_META_APP_ID=
NEXT_PUBLIC_META_CONFIG_ID=1529564728405358
NEXT_PUBLIC_META_GRAPH_VERSION=v25.0
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
REALTIME_INGEST_URL=https://realtime.allok.fun/internal/events
REALTIME_INGEST_SECRET=
REALTIME_TOKEN_SECRET=
NEXT_PUBLIC_REALTIME_URL=wss://realtime.allok.fun
```

`DATABASE_URL` stores the durable connected-number inventory, webhook queue, and auto-reply queue shown in `/ops`. Connected-account tokens are encrypted in Postgres and are never forwarded to n8n. `META_APP_SECRET`, connected-account business tokens, webhook secrets, and database URLs must stay server-side.

## Meta Dashboard Checks

- App ID matches `META_APP_ID`.
- App Secret is present only in server runtime env.
- Facebook Login for Business configuration ID matches `META_CONFIG_ID`.
- Coexistence uses a v4 configuration. Do not restore the obsolete v2 config
  `1242395401244814`.
- Graph API version matches `META_GRAPH_VERSION`; the implementation currently defaults to `v25.0` if unset.
- Facebook Login for Business settings include the production domain in Allowed domains and Valid OAuth redirect URIs.
- Client OAuth login, Web OAuth login, Enforce HTTPS, Embedded Browser OAuth Login, and strict redirect URI mode are enabled.
- The Embedded Signup configuration grants `whatsapp_business_management` and `whatsapp_business_messaging`. Do not request `business_management` in `FB.login`; Meta does not expose it in a WhatsApp Embedded Signup configuration.
- App Review and access verification are approved for every permission required by the published Tech Provider app.
- The Meta app is published; unpublished apps do not receive production webhook deliveries.
- WhatsApp webhook callback URL is public HTTPS: `/api/meta/whatsapp/webhook`.
- Webhook verify token matches `META_WEBHOOK_VERIFY_TOKEN`.
- WhatsApp webhook fields include `account_update`, `history`, `messages`,
  `smb_app_state_sync`, and `smb_message_echoes`.

The current dashboard callbacks are:

```txt
Deauthorize:  https://allok.fun/api/meta/deauthorize
Data delete:  https://allok.fun/api/meta/data-deletion
WhatsApp:     https://allok.fun/api/meta/whatsapp/webhook
```

The Facebook Login popup currently presents **SAMER** as the partner/business
name. That label comes from Meta Business settings, not from the Allok page.

## Local Diagnostics

```bash
npm run meta:diagnostics
npm run meta:diagnostics -- --test-n8n
```

The command prints missing env var names, checks whether the configured webhook URL is reachable, and optionally sends a safe diagnostic payload to n8n. It never prints env values.

## n8n Workflow

The live n8n workflow `Meta Embedded Signup - Tech Provider` remains active only
for lifecycle/diagnostic notification.

Workflow ID:

```txt
EA6f6q8SZkewllyJ
```

The durable retry worker is active as `allok - Drain Meta Webhook Queue`:

```txt
Yf3mR8qK2vL7sN5p
```

It calls the protected drain endpoint every minute with `N8N_WEBHOOK_SECRET`. The daily Vercel cron is only a Hobby-plan fallback.

Expected webhook path:

```txt
https://n8n.frontia.app/webhook/meta/embedded-signup
```

The app no longer forwards signup authorization codes or business tokens to n8n. Neon is the only connection source of truth. The legacy signup workflow remains only for lifecycle/diagnostic compatibility and must not store credentials.

The protected drain also claims `auto_reply_jobs`. The worker only responds when the conversation is in IA mode, matches a safe predefined rule, and the inbound message is still the latest event. Outside the Cloud API 24-hour window it sends only when `WHATSAPP_AUTO_REPLY_TEMPLATE_NAME` points to an approved template; otherwise it records a skipped job for review.

The obsolete direct Meta deauthorization and data-deletion workflows are
unpublished. Meta calls the Allok callbacks above; Allok updates Neon first and
forwards only a best-effort lifecycle notification to this workflow.

The VPS n8n container must define the same `N8N_WEBHOOK_SECRET` used by Vercel. The workflow reads it through `$env.N8N_WEBHOOK_SECRET`.

WhatsApp events are durably stored and normalized inside allok. The former direct n8n message-event workflow is intentionally unpublished because it could bypass human takeover and duplicate replies. Its old endpoint was:

```txt
https://n8n.frontia.app/webhook/meta/whatsapp-events
```

Do not republish that workflow without tenant lookup, idempotency, and explicit human-supervision gates.

Import `n8n/meta-embedded-signup.workflow.json` or `n8n/meta-webhook-drain.workflow.json` only if the corresponding workflow needs to be recreated. A regular single-main n8n deployment cannot honor `--activeState=fromJson`; import, publish/activate, and restart n8n instead.

## Connected numbers in Ops

After a successful onboarding, the exchange route reads the number's visible profile from Meta and upserts it into `whatsapp_connections`. For Coexistence it also verifies `is_on_biz_app=true`/`platform_type=CLOUD_API` and requests `smb_app_state_sync` plus `history` once. Open `/ops` and use **Números conectados** to see the display number, verified name, subscription/sync status, connection mode, quality rating, WABA ID, and connection time.

Ops must generate the customer URL. The public route is not a bearer-less
`?client=` link anymore:

```txt
https://allok.fun/embedded-whatsapp?client=<workspace>&invite=<signed-7-day-invite>
```

The invite authorizes only opening onboarding for that workspace/mode. The
short-lived signed signup `state` still protects the actual code exchange.

Provision a database by applying the checked-in migrations in order. The current production schema includes `004_whatsapp_connections.sql`, `006_whatsapp_channels_inbox.sql`, `008_conversation_outcomes.sql`, `010_meta_whatsapp_webhook_events.sql`, `011_waha_connection_lifecycle.sql`, `012_waha_webhook_queue.sql`, `013_crm_conversation_links.sql`, and `014_contact_phone_and_auto_replies.sql`. Runtime code does not create or alter schema.
