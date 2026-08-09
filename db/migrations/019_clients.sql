-- El registro de clientes de allok.
--
-- Hasta ahora "qué clientes tengo" se respondía leyendo whatsapp_connections,
-- que sólo conoce números conectados: un cliente al que ya le mandaste el
-- enlace y todavía no lo abre no existía en ningún lado, y un cliente que
-- opera en otra app (REI CRM) no se distinguía de uno que atendemos nosotros
-- desde la bandeja de Ops.
--
-- El slug es la misma clave que viaja en el enlace de onboarding y termina en
-- whatsapp_connections.client, así que el registro y los números se cruzan sin
-- una tabla puente.
--
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS clients (
  slug            text PRIMARY KEY,
  name            text NOT NULL,
  -- Dónde trabaja el cliente. 'allok' = la bandeja de Ops de esta app.
  -- 'rei_crm' = residente/REI; el número se le entrega y sus webhooks se
  -- redirigen allá, así que su conversación NO aparece en esta bandeja.
  destination     text NOT NULL DEFAULT 'allok',
  -- Identificador del cliente en la app destino: organization_id (uuid) en REI.
  -- Null mientras el destino sea allok.
  destination_ref text,
  -- invited  → enlace generado, todavía sin número conectado
  -- connected→ número conectado en Meta, pendiente de entregar
  -- live     → operando (entregado, si el destino es otra app)
  -- paused / churned → fuera de servicio
  status          text NOT NULL DEFAULT 'invited',
  contact         text,
  notes           text,
  -- Última entrega exitosa a la app destino. Null = nunca se entregó.
  handed_over_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_destination_check;
ALTER TABLE clients
  ADD CONSTRAINT clients_destination_check CHECK (destination IN ('allok', 'rei_crm'));

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;
ALTER TABLE clients
  ADD CONSTRAINT clients_status_check
  CHECK (status IN ('invited', 'connected', 'live', 'paused', 'churned'));

CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status, updated_at DESC);

-- Los números ya conectados quedan registrados como clientes existentes: sin
-- esto la página nueva arrancaría vacía aunque el negocio ya esté andando.
INSERT INTO clients (slug, name, status, created_at, updated_at)
SELECT DISTINCT ON (client)
  client,
  COALESCE(verified_name, display_phone_number, client),
  CASE WHEN status = 'deauthorized' THEN 'churned' ELSE 'connected' END,
  connected_at,
  now()
FROM whatsapp_connections
WHERE client IS NOT NULL AND client <> ''
ORDER BY client, connected_at DESC
ON CONFLICT (slug) DO NOTHING;
