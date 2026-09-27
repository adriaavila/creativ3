-- What allok's agent learned about a lead in Vocero (org `principal`), copied by
-- the VPS routine `ops-capture.sh`. Vocero owns this data; /ops only reads it to
-- pick the follow-up and fill the proposed message. Additive and nullable: safe
-- to re-run, and every existing lead keeps meaning exactly the same.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS agent_state jsonb;
