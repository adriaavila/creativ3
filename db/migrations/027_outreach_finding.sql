-- El hallazgo de cómo le llegan las consultas a cada negocio (`hallazgo_1` del
-- CSV del motor de leads), para una línea del primer correo.
-- El mismo DDL vive en src/lib/outreach-db.ts (`ensureOutreachTables`), que
-- corre la primera vez que algo toca las tablas: aplicar esta migración a mano
-- no es obligatorio.
ALTER TABLE outreach_contact ADD COLUMN IF NOT EXISTS finding text NOT NULL DEFAULT '';
