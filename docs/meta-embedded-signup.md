# Meta WhatsApp Embedded Signup

> Production status and the current acceptance blocker are tracked in
> [`docs/meta-whatsapp-production-state.md`](./meta-whatsapp-production-state.md).

This app uses Meta Embedded Signup for a Tech Provider onboarding flow.

## Runtime Env

Configure these in Vercel/Coolify and in local `.env.local` when testing. Do not commit `.env`.

```txt
META_APP_ID=
META_APP_SECRET=
META_CONFIG_ID=
META_GRAPH_VERSION=v25.0
META_WEBHOOK_VERIFY_TOKEN=
META_WEBHOOK_CALLBACK_URL=https://YOUR_DOMAIN/api/meta/whatsapp/webhook
DATABASE_URL=
TOKEN_ENCRYPTION_KEY=
CRON_SECRET=
N8N_WEBHOOK_URL=https://YOUR_N8N_HOST/webhook/meta/embedded-signup
N8N_WEBHOOK_SECRET=
APP_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_META_APP_ID=
NEXT_PUBLIC_META_CONFIG_ID=
NEXT_PUBLIC_META_GRAPH_VERSION=v25.0
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
```

`DATABASE_URL` stores the durable connected-number inventory and webhook queue shown in `/ops`. Connected-account tokens are encrypted in Postgres and are never forwarded to n8n. `META_APP_SECRET`, connected-account business tokens, webhook secrets, and database URLs must stay server-side.

## Meta Dashboard Checks

- App ID matches `META_APP_ID`.
- App Secret is present only in server runtime env.
- Facebook Login for Business configuration ID matches `META_CONFIG_ID`.
- Graph API version matches `META_GRAPH_VERSION`; the implementation currently defaults to `v25.0` if unset.
- Facebook Login for Business settings include the production domain in Allowed domains and Valid OAuth redirect URIs.
- Client OAuth login, Web OAuth login, Enforce HTTPS, Embedded Browser OAuth Login, and strict redirect URI mode are enabled.
- The Embedded Signup configuration grants `whatsapp_business_management` and `whatsapp_business_messaging`. Do not request `business_management` in `FB.login`; Meta does not expose it in a WhatsApp Embedded Signup configuration.
- App Review and access verification are approved for every permission required by the published Tech Provider app.
- The Meta app is published; unpublished apps do not receive production webhook deliveries.
- WhatsApp webhook callback URL is public HTTPS: `/api/meta/whatsapp/webhook`.
- Webhook verify token matches `META_WEBHOOK_VERIFY_TOKEN`.
- WhatsApp webhook fields include at least `messages` plus any account/template fields needed by operations.

## Local Diagnostics

```bash
npm run meta:diagnostics
npm run meta:diagnostics -- --test-n8n
```

The command prints missing env var names, checks whether the configured webhook URL is reachable, and optionally sends a safe diagnostic payload to n8n. It never prints env values.

## n8n Workflow

The live n8n workflow is active as `Meta Embedded Signup - Tech Provider`.

Workflow ID:

```txt
EA6f6q8SZkewllyJ
```

Expected webhook path:

```txt
https://n8n.allok.fun/webhook/meta/embedded-signup
```

The app no longer forwards signup authorization codes or business tokens to n8n. Neon is the only connection source of truth. The legacy signup workflow remains only for lifecycle/diagnostic compatibility and must not store credentials.

The VPS n8n container must define the same `N8N_WEBHOOK_SECRET` used by Vercel. The workflow reads it through `$env.N8N_WEBHOOK_SECRET`.

WhatsApp events are durably stored and normalized inside allok. The former direct n8n message-event workflow is intentionally unpublished because it could bypass human takeover and duplicate replies. Its old endpoint was:

```txt
https://n8n.allok.fun/webhook/meta/whatsapp-events
```

Do not republish that workflow without tenant lookup, idempotency, and explicit human-supervision gates.

Import `n8n/meta-embedded-signup.workflow.json` only if the workflow needs to be recreated.

## Connected numbers in Ops

After a successful onboarding, the exchange route reads the number's visible profile from Meta and upserts it into `whatsapp_connections`. Open `/ops` and use **Números conectados** to see the display number, verified name, subscription status, connection mode, quality rating, WABA ID, and connection time.

Provision a database by applying the checked-in migrations in order. The current production schema includes `004_whatsapp_connections.sql`, `006_whatsapp_channels_inbox.sql`, `008_conversation_outcomes.sql`, and `010_meta_whatsapp_webhook_events.sql`. Runtime code does not create or alter schema.
