# Creativv agents: Hermes + Postiz + WAHA

## Target architecture

The Next.js app is the authenticated control plane and Neon is the source of
truth. Hermes Agent is the persistent orchestrator. Postiz publishes and
measures social networks. WAHA is a sidecar dedicated to approved WhatsApp
Status and Channel content.

Do not connect the same WhatsApp number to Hermes' built-in WhatsApp bridge and
WAHA at the same time. For production, use a dedicated business number and keep
Hermes operator approvals on its dashboard, Telegram, or another private
channel.

## Commercial strategy

Every campaign lasts 14 days and contains exactly one intent, vertical, and
offer:

| Intent | Offers |
| --- | --- |
| `increase_revenue` | Landing page, web design, ecommerce |
| `reduce_costs` | Automation, operations dashboard, custom app |

The first experiment is `reduce_costs × ecommerce × WhatsApp/operations
automation`. The north-star metric is qualified conversations per week.

## Content lifecycle

1. Hermes reads the active campaign and verified evidence.
2. The content agent writes one core idea and channel-specific variants.
3. Variants enter `content_items` as `in_review` with an idempotency key.
4. A human edits and approves them in Growth OS.
5. The dispatcher sends social variants to Postiz and approved WhatsApp variants
   to WAHA Status or Channels.
6. Provider IDs, URLs, acknowledgements, failures, and campaign UTMs are stored
   back in Neon.

Direct WhatsApp messages are not a content channel. They remain manual or
consent-based CRM actions. Approval must be checked server-side; an instruction
inside a prompt is not an authorization boundary.

## Deployment phases

### 0. Secure the control plane

- Require Clerk in `/ops`, `/ops/growth`, and every `/api/ops/*` handler.
- Keep provider credentials server-side and use separate secrets for humans,
  Hermes, Postiz, and WAHA.
- Add rate limits and idempotency for agent runs and publications.

### 1. Provision the agent host

- Use a small Linux VPS with Docker Compose, 2 CPU, 4 GB RAM, encrypted backups,
  and a private firewall.
- Copy this directory to the host, create a non-committed `.env`, and replace
  `latest` tags with tested image digests before production.
- Bind ports to loopback as in `docker-compose.yml`; expose only through a TLS
  reverse proxy or private network.
- Run `docker compose up -d`, then `docker compose logs -f`.

### 2. Configure Hermes

- Run the Hermes setup wizard once against the persistent `hermes_data` volume.
- Copy `hermes/SOUL.md` into the profile data directory before starting the
  production gateway, then verify it appears in the effective system context.
- Create one production profile for the content director. Do not run two gateway
  containers against the same data directory.
- Give Hermes only the tools needed to read campaigns, create content drafts,
  and invoke the approval-gated dispatcher. It must not receive raw database or
  unrestricted shell access in production.
- Keep the existing Eve schedules in shadow mode for one week and compare
  outputs. Then set `GROWTH_AGENT_RUNTIME=hermes`; the web control plane uses
  Hermes' authenticated `/v1/runs` API without changing the UI routes.

### 3. Configure WAHA

- Generate a plain API key for callers and store only its SHA-512 hash in
  `WAHA_API_KEY_HASH`; callers send the plain value as `X-Api-Key`.
- Pair a dedicated WhatsApp account and persist the session volume.
- Configure HMAC-signed webhooks for `session.status` and `message.ack`.
- Start with Status publishing. Enable WhatsApp Channels only after its owner ID
  and retry behavior are verified. Never start with bulk direct messages.

### 4. Cut over publishing

- Run a dry week that creates `content_items` but does not call providers.
- Enable Postiz publishing for approved items.
- Enable WAHA Status for a small internal audience, verify acknowledgements, and
  then enable the public business status/channel.
- Roll back by pausing the campaign and disabling the dispatcher; drafts and
  evidence remain intact in Neon.

## Required secrets

See the repository `.env.example`. On the agent host, the minimum set is
`DATABASE_URL`, model-provider credentials, `HERMES_API_KEY`, `WAHA_API_KEY`,
`WAHA_API_KEY_HASH`, `WAHA_WEBHOOK_HMAC_KEY`, `POSTIZ_API_KEY`, and the target
Postiz integration IDs.

## Release gates

- Root lint and production build pass.
- Growth agent typecheck and eval gates pass.
- Unauthorized requests to ops and publishing endpoints return 401/404.
- Replaying an approval or webhook does not publish twice.
- A WAHA outage leaves content in `approved`/`failed` and never loses the draft.
- Every published item has `campaign_id`, provider ID, timestamp, and UTM.
