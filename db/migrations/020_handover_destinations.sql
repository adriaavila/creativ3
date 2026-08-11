-- Dónde trabajan los números que allok conecta.
--
-- Antes había un solo destino posible escrito en variables de entorno (REI
-- CRM), así que cada cliente nuevo con su propia app era una rama en el código
-- o un valor pegado a mano. Un destino es un dato del negocio, no del deploy:
-- una fila por app que recibe webhooks, y cualquier número se entrega a
-- cualquiera de ellas sin tocar nada.
--
-- El verify token y el secreto de provisión se guardan cifrados con la misma
-- clave que los business tokens (TOKEN_ENCRYPTION_KEY). Se leen sólo dentro de
-- la petición que los usa.
--
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS handover_destinations (
  -- Identificador estable que se guarda en la conexión entregada.
  slug              text PRIMARY KEY,
  label             text NOT NULL,
  -- URL del webhook de esa app. Meta la valida con un GET antes de aceptarla.
  webhook_url       text NOT NULL,
  -- Cifrado. Es el verify token de la app destino, no el de allok.
  verify_token      text NOT NULL,
  -- Opcional: si la app expone un endpoint de provisión, allok le empuja las
  -- credenciales antes de mover el webhook. Sin esto, el token se entrega a
  -- mano desde Ops.
  provision_url     text,
  provision_secret  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE handover_destinations
  ADD COLUMN IF NOT EXISTS provision_url text,
  ADD COLUMN IF NOT EXISTS provision_secret text;
