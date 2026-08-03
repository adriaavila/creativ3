-- Per-tenant bot behavior and conversation memory.
--
-- Until now every connected number shared one hardcoded persona in
-- src/lib/whatsapp-ai.ts, so a client's customers got allok's own copy. This
-- table is the per-client knob: one row per phone_number_id, no new workflow
-- and no new deploy to onboard a client.
--
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS tenant_bot_config (
  phone_number_id text PRIMARY KEY,
  -- Overrides the built-in persona. Null keeps the default in whatsapp-ai.ts.
  system_prompt   text,
  -- Hours, pricing, address, policies. Appended to the system prompt verbatim,
  -- so the model answers with this business's facts instead of inventing them.
  business_facts  text,
  -- What to say when escalating to a person for this client.
  handoff_note    text,
  enabled         boolean NOT NULL DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Rolling summary so a long conversation keeps its early context without
-- resending every message to the model on each turn.
ALTER TABLE wa_conversations
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS summary_upto_message_id bigint;

-- Where Meta delivers this connection's events. Null = this app's main webhook.
-- Set only when a client's events are pointed elsewhere with
-- override_callback_uri, so the dashboard can say so instead of showing an
-- inbox that will never fill.
ALTER TABLE whatsapp_connections
  ADD COLUMN IF NOT EXISTS webhook_override_uri text,
  ADD COLUMN IF NOT EXISTS webhook_override_scope text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_connections_override_scope_check'
  ) THEN
    ALTER TABLE whatsapp_connections
      ADD CONSTRAINT whatsapp_connections_override_scope_check
      CHECK (webhook_override_scope IS NULL OR webhook_override_scope IN ('waba', 'phone_number'));
  END IF;
END $$;
