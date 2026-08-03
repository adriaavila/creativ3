-- Two gaps that both block onboarding a client who is not allok.
--
-- 1. Auto-reply copy lived in src/lib/auto-reply.ts as allok's own sentences, so
--    any other connected number would greet its customers as allok. The rule keys
--    (saludo / servicios / precio / cita) stay in code; the sentences move here.
--    No row, or no sentence for a matched key, now means "do not answer" rather
--    than "answer with someone else's copy".
--
-- 2. A number onboarded through the plain Cloud API variation (no WhatsApp
--    Business App) is PENDING until POST /{phone_number_id}/register succeeds.
--    That call needs a 6-digit PIN that must be reused on every later re-register,
--    so it is stored encrypted with the same cipher as business_token.
--
-- Safe to re-run.

ALTER TABLE tenant_bot_config
  ADD COLUMN IF NOT EXISTS auto_replies jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE whatsapp_connections
  ADD COLUMN IF NOT EXISTS registration_pin text,
  ADD COLUMN IF NOT EXISTS registered_at timestamptz;
