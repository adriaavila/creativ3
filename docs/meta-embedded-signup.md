# Meta WhatsApp Embedded Signup

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
N8N_WEBHOOK_URL=https://YOUR_N8N_HOST/webhook/meta/embedded-signup
N8N_WEBHOOK_SECRET=
N8N_WHATSAPP_EVENTS_WEBHOOK_URL=
APP_URL=https://YOUR_DOMAIN
DATABASE_URL=
```

`META_APP_SECRET`, connected-account business tokens, webhook secrets, and database URLs must stay server-side.

## Meta Dashboard Checks

- App ID matches `META_APP_ID`.
- App Secret is present only in server runtime env.
- Facebook Login for Business configuration ID matches `META_CONFIG_ID`.
- Graph API version matches `META_GRAPH_VERSION`; the implementation currently defaults to `v25.0` if unset.
- Facebook Login for Business settings include the production domain in Allowed domains and Valid OAuth redirect URIs.
- Client OAuth login, Web OAuth login, Enforce HTTPS, Embedded Browser OAuth Login, and strict redirect URI mode are enabled.
- Required permissions are approved for advanced access: `business_management`, `whatsapp_business_management`, `whatsapp_business_messaging`.
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
https://n8n.servicioscreativos.online/webhook/meta/embedded-signup
```

The app backend calls this workflow after the Meta code exchange and WABA subscription. The active workflow validates `code`, `waba_id`, and `phone_number_id`, stores the connected account in n8n workflow static data, and returns clean JSON. It also accepts `meta_embedded_signup_diagnostic` payloads without storing test data.

Import `n8n/meta-embedded-signup.workflow.json` only if the workflow needs to be recreated.

Recommended DB table if you later move storage from n8n static data to Postgres:

```sql
create table if not exists connected_whatsapp_accounts (
  waba_id text not null,
  phone_number_id text not null,
  business_id text,
  business_token text not null,
  token_metadata jsonb not null default '{}'::jsonb,
  owner jsonb not null default '{}'::jsonb,
  status text not null default 'connected',
  connected_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (waba_id, phone_number_id)
);
```
