-- La prospección en frío abre Chile, Uruguay, Venezuela, Paraguay y Bolivia.
-- El mismo DDL vive en src/lib/outreach-db.ts (`ensureOutreachTables`), que
-- corre la primera vez que algo toca las tablas: aplicar esta migración a mano
-- no es obligatorio.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'outreach_contact_country_check' AND pg_get_constraintdef(oid) LIKE '%BO%'
  ) THEN
    ALTER TABLE outreach_contact DROP CONSTRAINT IF EXISTS outreach_contact_country_check;
    ALTER TABLE outreach_contact ADD CONSTRAINT outreach_contact_country_check CHECK (country IN
      ('MX', 'CO', 'CL', 'UY', 'VE', 'PY', 'BO'));
  END IF;
END $$;
