-- Failed /ops logins, to throttle password guessing. Only a salted hash of the
-- IP is stored, never the IP or the attempted password. Rows older than a day
-- are deleted by the login route itself.
CREATE TABLE IF NOT EXISTS ops_login_failures (
  id bigserial PRIMARY KEY,
  ip_hash text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ops_login_failures_at_idx ON ops_login_failures (at);
CREATE INDEX IF NOT EXISTS ops_login_failures_ip_at_idx ON ops_login_failures (ip_hash, at);
