-- Operator-facing automation controls for each official Meta number.
-- Safe to re-run. Existing numbers remain in approval mode.

ALTER TABLE tenant_bot_config
  ADD COLUMN IF NOT EXISTS operating_mode text NOT NULL DEFAULT 'approval',
  ADD COLUMN IF NOT EXISTS model_tier text NOT NULL DEFAULT 'balanced';

ALTER TABLE tenant_bot_config
  DROP CONSTRAINT IF EXISTS tenant_bot_config_operating_mode_check,
  DROP CONSTRAINT IF EXISTS tenant_bot_config_model_tier_check;

ALTER TABLE tenant_bot_config
  ADD CONSTRAINT tenant_bot_config_operating_mode_check
    CHECK (operating_mode IN ('off', 'approval', 'automatic')),
  ADD CONSTRAINT tenant_bot_config_model_tier_check
    CHECK (model_tier IN ('fast', 'balanced'));
