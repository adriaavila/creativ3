-- Commercial outcome per conversation — the unit results-based pricing is billed
-- on. Deliberately separate from wa_conversations.status (migration 006), which
-- tracks inbox hygiene (open/snoozed/closed), not whether the chat produced
-- anything.
--
-- NULL means "not marked yet", and at month close it counts as no result: the
-- default sits against us on purpose, so a client is never billed for a cita we
-- merely assumed happened.
--
-- Safe to re-run.

ALTER TABLE wa_conversations
  ADD COLUMN IF NOT EXISTS outcome text
    CHECK (outcome IN ('cita', 'cotizacion', 'descarte')),
  ADD COLUMN IF NOT EXISTS outcome_at timestamptz;

CREATE INDEX IF NOT EXISTS wa_conversations_outcome_idx
  ON wa_conversations(outcome_at DESC) WHERE outcome IS NOT NULL;
