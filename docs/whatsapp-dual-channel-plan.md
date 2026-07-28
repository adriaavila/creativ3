# Plan de implementación: WhatsApp dual-canal, harness de agentes en VPS, y oferta de infraestructura

> Documento autocontenido para que otro modelo/agente (Codex u otro) implemente sin contexto previo de esta conversación. Incluye decisiones de producto, precios finales, esquema de datos, contratos de API, y pasos de verificación.

## 0. Resumen ejecutivo

Creativv es un estudio/SaaS que vende automatización de WhatsApp para negocios (LATAM). El repo (`/Users/ama/projects/saas/creativ3`, Next.js) ya tiene:

- **Meta Embedded Signup + Coexistence** funcionando (`src/lib/meta/server.ts`, `src/app/embedded-whatsapp/page.tsx`) — la parte más madura del código.
- **WAHA** (WhatsApp HTTP API, self-hosted, no-oficial) como *health check* únicamente (`src/lib/waha.ts`, 44 líneas, solo `GET /api/sessions`). No envía ni recibe nada todavía.
- **Un VPS ya desplegado y operado por el usuario** (`ops/agents/docker-compose.yml` corriendo Hermes + WAHA). El usuario está armando un **harness de agentes** sobre ese VPS (orquestación tipo Hermes) y quiere poder **ofrecer ese harness como infraestructura a terceros** (otras agencias/devs), además de usarlo internamente.
- **Ningún inbox real**: el webhook de Meta verifica firma y reenvía ciego a n8n. No hay tablas de conversaciones/mensajes.
- **Dos productos frontend desconectados**: home de estudio (`ProductHome`) sin precios, y `/whatsapp` (`WhatsAppRevenuePage.tsx`) con Stripe y precios reales, sin enlace entre ambas.

### Decisiones de producto tomadas en esta ronda

1. **Canal dual para clientes finales**: cada cliente elige (o se le asigna) **Cloud API (Meta, oficial)** o **WAHA (self-hosted, no-oficial)** para su número de WhatsApp. Ambos caminos conviven.
2. **El VPS ya está desplegado y lo maneja el usuario.** El harness de agentes (Hermes) se sigue armando ahí. Este plan no cubre provisión inicial del VPS (ya existe) — cubre: hardening, multi-instancia por tenant, y cutover de `GROWTH_AGENT_RUNTIME` a Hermes cuando esté listo.
3. **Se ofrece el harness como producto de infraestructura** a otras agencias/devs (tier nuevo, separado del producto de negocio final).
4. **Precios se definen en este documento** (tablas abajo), basados en los planes Stripe ya existentes más el tier nuevo de infraestructura.

---

## 1. Precios (definitivos para implementación)

### 1.1 Producto WhatsApp Revenue System (negocios finales)

Se mantienen los 4 planes ya codificados en `src/app/api/stripe/checkout/route.ts`, con el canal como variable de configuración (no de precio) excepto donde se anota:

| Plan (`key` en `PLANS`) | Setup | Mensual | Canal | Qué incluye |
|---|---|---|---|---|
| `whatsapp_starter` | $149 | $49/mo | **WAHA por defecto** (activación en horas, sin esperar Meta) | FAQ automatizado, seguimiento básico, mini base de leads |
| `whatsapp_growth` | $299 | $89/mo | **Cliente elige WAHA o Cloud API** | Calificación de leads, landing/cotizador, dashboard, scripts |
| `whatsapp_premium` | $699 | $179/mo | **Cloud API recomendado** (WAHA disponible como respaldo) | Funnel completo, dashboard avanzado, segmentación, Hermes Agent, coexistence |
| `whatsapp_founder` | $249 | $69/mo | **Cliente elige** | Founder LATAM, cupos limitados, Hermes Agent |

**Regla de negocio para el knob de canal:**
- Cloud API requiere que el número del cliente ya esté en un WhatsApp Business App activo (coexistence) o se registre desde cero vía Meta — más sólido, pero depende de aprobación/infraestructura de Meta y solo soporta templates para mensajes fuera de ventana de 24h.
- WAHA empareja por QR en minutos, sin dependencia de Meta, pero es **no oficial**: riesgo de baneo de número, sin templates estructurados, sin garantías de Meta. Debe quedar explícito en el ToS/checkout qué implica.
- **Sobreprecio de canal**: si el cliente en plan `starter` quiere Cloud API en vez de WAHA, +$30 setup (costo de onboarding manual/soporte). Se implementa como línea de producto adicional en Stripe, no como plan nuevo.

### 1.2 Tier nuevo: Creativv Agent Harness (infraestructura para agencias/devs)

Vende el VPS + harness (WAHA multi-sesión + Hermes) como infraestructura administrada a terceros que quieren correr su propio flujo de agentes/WhatsApp sin montar servidores.

| Plan | Setup | Mensual | Incluye |
|---|---|---|---|
| **Harness Solo** | $199 | $79/mo | 1 instancia WAHA aislada (su propio contenedor + volumen), 1 número, acceso a panel de sesión, backups diarios |
| **Harness Team** | $399 | $149/mo | Hasta 3 instancias WAHA, perfil Hermes dedicado (agente propio con su SOUL.md), acceso API, soporte prioritario |
| **Harness Whitelabel** | $899 + rev-share 10% | $299/mo | Stack completo dedicado (Hermes+WAHA+Caddy) en subdominio propio del cliente, ellos revenden a sus clientes finales |

**Nota de arquitectura para este tier (importante, ver §4.4):** no construir un backend multi-tenant compartido desde el día uno. Cada tenant de este tier = **su propio stack docker-compose** (proyecto compose separado, prefijo de nombre único, puertos distintos) en el mismo VPS. Es más simple, más aislado, y evita reescribir el schema de `growth_runs`/`leads`/etc. para multi-tenencia real. Migrar a un modelo multi-tenant en DB solo si la demanda lo justifica (3+ clientes de este tier).

### 1.3 Resumen de SKUs para Stripe

Añadir a `PLANS` en `src/app/api/stripe/checkout/route.ts`:

```ts
harness_solo: {
  name: "Agent Harness Solo",
  currency: "usd",
  setupAmount: 19900,
  recurringAmount: 7900,
  description: "Instancia WAHA aislada + panel de sesión + backups diarios.",
},
harness_team: {
  name: "Agent Harness Team",
  currency: "usd",
  setupAmount: 39900,
  recurringAmount: 14900,
  description: "Hasta 3 instancias WAHA + agente Hermes dedicado + soporte prioritario.",
},
harness_whitelabel: {
  name: "Agent Harness Whitelabel",
  currency: "usd",
  setupAmount: 89900,
  recurringAmount: 29900,
  description: "Stack Hermes+WAHA dedicado en subdominio propio, reventa habilitada.",
},
```

`harness_whitelabel` lleva revenue-share 10% fuera de Stripe (facturación manual o Stripe Billing metered aparte) — no modelar el 10% dentro del checkout inicial.

---

## 2. Estado actual del código (referencia para el implementador)

No releer todo el repo — estos son los archivos que importan:

- `src/lib/meta/server.ts` — cliente Graph API: `graphRequest`, `exchangeCodeForBusinessToken`, `subscribeWabaToApp`, `sendPreparedTextMessage`, `registerPhoneNumber` (dead export, no llamar — rompe coexistence), `verifyMetaSignedRequest`.
- `src/lib/whatsapp-connections-db.ts` — Neon store para conexiones Cloud API. `business_token` en texto plano (pendiente cifrar). `ensureSchema()` corre DDL en request path (duplicado con `db/migrations/004`).
- `src/lib/waha.ts` — 44 líneas, solo `isWahaConfigured()` + `getWahaSnapshot()` (GET `/api/sessions`). Nada de envío/recepción todavía.
- `src/app/api/meta/whatsapp/webhook/route.ts` — verifica GET (hub.challenge) y POST (HMAC sha256), reenvía payload crudo a n8n. No parsea `change.field`, no persiste nada.
- `src/app/api/meta/embedded-signup/{exchange,test-message,deregister}/route.ts` — `test-message` y `deregister` **no llaman `authorizeOps()`** (hueco de seguridad, corregir en Fase 0).
- `src/lib/ops-auth.ts` — password compartido; cookie de sesión = valor literal de `OPS_SESSION_SECRET` (sin rotación/revocación).
- `src/lib/growth-agent-runtime.ts` — `dispatchGrowthAgent()` decide entre Eve (Vercel, activo hoy) y Hermes (VPS) vía `GROWTH_AGENT_RUNTIME`.
- `ops/agents/docker-compose.yml` — Hermes + WAHA, `:latest` tags (fijar a digest pendiente), sin reverse proxy con TLS.
- `ops/agents/README.md` — plan de despliegue en 4 fases ya escrito, fase 1 (provisión) ya ejecutada por el usuario.
- `db/migrations/001..005` — `growth_runs`, `leads`, `outreach_drafts`, `public_agent_events`, `growth_campaigns`, `content_items`, `whatsapp_connections`, `growth_outreach_messages`. **No existe** tabla de conversaciones/mensajes de WhatsApp.
- `src/app/api/stripe/checkout/route.ts` — `PLANS` con 6 SKUs actuales, sin webhook de confirmación (`api/stripe/webhook` no existe).
- `src/components/ops/GrowthOpsClient.tsx` — patrón de referencia para UI de ops (tabs + fetch + paneles), reusar para el inbox nuevo.
- `src/app/page.tsx` → `src/components/product-home/*` — home de estudio, sin precios.
- `src/components/landing/WhatsAppRevenuePage.tsx` (1110 líneas) — copy de producto y precios ya escritos, fuente para migrar a home.

---

## 3. Esquema de datos nuevo

### 3.1 Migración `006_whatsapp_channels_inbox.sql`

Diseño: **un discriminador de canal**, no una tabla separada por canal. Evita reescribir todo el flujo de conversaciones si mañana se agrega un tercer canal.

```sql
-- 006_whatsapp_channels_inbox.sql

CREATE TABLE IF NOT EXISTS waha_connections (
  id text PRIMARY KEY,                 -- session name en WAHA, ej "cliente-acme"
  client text,                          -- mismo patrón que whatsapp_connections.client
  waha_base_url text NOT NULL,          -- permite VPS distintos por tenant (harness whitelabel)
  status text NOT NULL DEFAULT 'pending', -- pending|scan_qr|connected|disconnected
  phone_display text,
  connected_at timestamptz,
  last_synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wa_conversations (
  id bigserial PRIMARY KEY,
  channel_kind text NOT NULL CHECK (channel_kind IN ('cloud_api', 'waha')),
  channel_key text NOT NULL,           -- phone_number_id (cloud_api) o waha_connections.id (waha)
  contact_wa_id text NOT NULL,         -- número del contacto, formato E.164 sin '+'
  contact_name text,
  status text NOT NULL DEFAULT 'open', -- open|snoozed|closed
  assigned_mode text NOT NULL DEFAULT 'human', -- human|ai
  last_message_at timestamptz,
  last_inbound_at timestamptz,         -- clave para la ventana de 24h (solo aplica a cloud_api)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_kind, channel_key, contact_wa_id)
);

CREATE INDEX IF NOT EXISTS wa_conversations_last_message_idx
  ON wa_conversations(last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS wa_messages (
  id bigserial PRIMARY KEY,
  conversation_id bigint NOT NULL REFERENCES wa_conversations(id) ON DELETE CASCADE,
  wa_message_id text,                  -- id nativo del proveedor; NULL permitido para msgs generadas internamente
  direction text NOT NULL CHECK (direction IN ('in', 'out')),
  source text NOT NULL DEFAULT 'api',  -- api|phone|ai  ('phone' = smb_message_echoes, coexistence)
  msg_type text NOT NULL DEFAULT 'text',
  body text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text,                          -- sent|delivered|read|failed (solo out)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wa_messages_wa_message_id_idx
  ON wa_messages(wa_message_id) WHERE wa_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS wa_messages_conversation_idx
  ON wa_messages(conversation_id, created_at DESC);
```

No usar `waba_id`/`phone_number_id` como PK compuesta de `wa_conversations` (como hace `whatsapp_connections`) porque WAHA no tiene esos conceptos — de ahí el discriminador `channel_kind` + `channel_key` genérico.

### 3.2 Cifrado de tokens (Fase 0, bloqueante — ya estaba en el plan anterior)

`whatsapp_connections.business_token` sigue en texto plano. Antes de construir el inbox:
- Añadir `TOKEN_ENCRYPTION_KEY` (32 bytes, base64) a `.env.example`.
- `src/lib/crypto/token-cipher.ts` — `encryptToken(plain): string` / `decryptToken(cipher): string` con AES-256-GCM (`node:crypto`, sin librería nueva).
- Envolver en `upsertWhatsAppConnection` (cifrar antes de guardar) y en el punto de envío (descifrar solo al usar).
- Migración de datos: script one-off que re-cifra filas existentes (si hay conexiones ya en producción).

---

## 4. Implementación

### Fase 0 — Seguridad bloqueante (medio día)

1. Añadir `authorizeOps()` a `src/app/api/meta/embedded-signup/test-message/route.ts` y `.../deregister/route.ts`.
2. `middleware.ts` en la raíz protegiendo `/ops/:path*` y `/api/ops/:path*` (defensa en profundidad; las rutas individuales mantienen su propio check).
3. `src/lib/ops-auth.ts`: cookie deja de ser el secreto literal. Firmar `HMAC(OPS_SESSION_SECRET, userId + exp)`, verificar con `timingSafeEqual`.
4. Cifrado de `business_token` (ver §3.2).
5. Borrar `ensureSchema()` de `whatsapp-connections-db.ts` (duplica migración 004).
6. Borrar `registerPhoneNumber()` de `src/lib/meta/server.ts` (dead export, riesgo si se cablea sin contexto).

**Verificación:** `curl -X POST /api/meta/embedded-signup/deregister` sin cookie → 401. Fila cifrada visible vía `psql`; el flujo de envío sigue funcionando tras el cambio (round-trip de descifrado).

### Fase 1 — Canal Cloud API: inbox real (3 días)

1. Aplicar migración `006_whatsapp_channels_inbox.sql`.
2. Reescribir `src/app/api/meta/whatsapp/webhook/route.ts`: antes de reenviar a n8n, parsear `entry[].changes[]`:

   | `field` | Acción |
   |---|---|
   | `messages` → `value.messages[]` | Insertar `direction='in'`, `source='api'`; upsert `wa_conversations` (channel_kind='cloud_api', channel_key=phone_number_id), tocar `last_inbound_at` y `last_message_at` |
   | `messages` → `value.statuses[]` | Update `wa_messages.status` por `wa_message_id` |
   | `smb_message_echoes` | Insertar `direction='out'`, `source='phone'` — mensajes que el dueño mandó desde su celular (coexistence) |
   | `smb_app_state_sync` | Upsert `contact_name` en la conversación |
   | `history` | Insertar en lote, dedup por `wa_message_id` (constraint único ya lo garantiza — usar `ON CONFLICT DO NOTHING`) |

   Responder 200 rápido; el reenvío a n8n es fire-and-forget no bloqueante.

3. `src/lib/meta/send-template.ts` — `sendTemplateMessage(phoneNumberId, token, {name, lang, components})` sobre `graphRequest` existente. Hoy no hay soporte de templates (`grep template src/lib` = 0).
4. `src/lib/whatsapp-send.ts` — `sendToConversation(conversationId, {text?, template?})`:
   - Lee conversación → resuelve `channel_kind`.
   - `cloud_api`: descifra token, revisa `last_inbound_at` (< 24h → texto libre vía `sendPreparedTextMessage`; ≥ 24h → exige `template`).
   - `waha`: delega a `src/lib/waha-send.ts` (Fase 2).
   - Inserta el mensaje saliente en `wa_messages` con `source='api'` o `'ai'`.

### Fase 2 — Canal WAHA: paridad de envío/recepción (2 días)

WAHA hoy solo se usa para health-check. Para ofrecerlo como canal real a clientes:

1. `src/lib/waha-send.ts`:
   - `sendWahaText(sessionId, chatId, text)` → `POST {WAHA_URL}/api/sendText` (WAHA REST, header `X-Api-Key`).
   - `startWahaSession(sessionId)` → `POST {WAHA_URL}/api/sessions` (crea sesión nueva por cliente).
   - `getWahaQr(sessionId)` → `GET {WAHA_URL}/api/{session}/auth/qr` (imagen QR para emparejar).
2. `src/app/api/waha/webhook/route.ts` — nueva ruta (payload de WAHA distinto al de Meta): verificar HMAC con `WAHA_WEBHOOK_HMAC_KEY`, manejar eventos `message` (inbound) y `message.ack` (status), insertar en las mismas `wa_conversations`/`wa_messages` con `channel_kind='waha'`.
3. `src/app/api/ops/waha/sessions/route.ts` (POST) — crea una fila en `waha_connections` + llama `startWahaSession`. Devuelve QR para mostrar en UI.
4. UI de emparejamiento: `/ops/inbox` (Fase 3) incluye un botón "Conectar WAHA" que muestra el QR (polling de `status` cada 3s hasta `connected`).
5. Actualizar `src/lib/waha.ts` para soportar múltiples sesiones (`getWahaSnapshot(sessionId?)` en vez de una sola sesión implícita).

**Nota legal/ToS:** el flujo WAHA empareja el WhatsApp personal/de negocio del cliente vía QR — dejar copy explícito en el onboarding de que es un canal no-oficial (riesgo de baneo, sin templates estructurados de Meta).

### Fase 3 — Auto-respuesta IA + `/ops/inbox` (2 días)

1. `src/app/api/ops/inbox/[id]/reply/route.ts` — POST recibe texto o pide sugerencia IA.
2. `replyWithAI()` — arma contexto con los últimos ~20 mensajes de `wa_messages`, llama AI SDK vía Vercel AI Gateway (`"anthropic/claude-sonnet-4-6"`, mismo patrón del growth-agent — no añadir `@ai-sdk/anthropic`).
3. `assigned_mode` por conversación (`human`/`ai`). Arrancar con **todas en `human`** — la IA sugiere, el operador aprieta enviar. Automatizar por conversación cuando el piloto lo pida.
4. `src/app/ops/inbox/page.tsx` + `src/components/ops/InboxClient.tsx` — lista de conversaciones (ambos canales, con badge de canal), hilo, composer. Reusar patrón de `GrowthOpsClient.tsx`. Polling cada 5s (`setInterval`), sin websockets todavía.
5. Marcar visualmente: `source='phone'` (coexistence), ventana de 24h para cloud_api, canal (Cloud API vs WAHA), origen IA vs humano.

### Fase 4 — VPS: hardening + multi-instancia para el tier de infraestructura (1–2 días)

El VPS ya está desplegado y operado por el usuario — esta fase es incremental, no de provisión desde cero.

1. **Fijar digests** de `nousresearch/hermes-agent` y `devlikeapro/waha` en `ops/agents/docker-compose.yml` (pendiente desde el README original).
2. **Reverse proxy TLS** (Caddy) delante de WAHA para exponerlo de forma segura fuera de `127.0.0.1` — necesario para que Vercel y los webhooks lleguen. Un `Caddyfile` con `waha.creativv.dev { reverse_proxy waha:3000 }` basta.
3. **Backups** del volumen `waha_sessions` (perder la sesión = re-parear por QR con el cliente). Cron diario a almacenamiento externo (S3/Backblaze).
4. **Cutover de Hermes**: seguir el fase-2/3 ya documentado en `ops/agents/README.md` (`GROWTH_AGENT_RUNTIME=hermes` tras una semana en shadow mode comparando con Eve). No urgente para este plan — el growth-agent en Vercel (Eve) sigue siendo el runtime activo mientras se valida Hermes.
5. **Multi-instancia para tier "Harness"**: cada cliente de infraestructura = su propio proyecto docker-compose (`docker compose -p cliente-acme -f docker-compose.tenant.yml up -d`), con su propio volumen de sesión WAHA y (en el tier Team/Whitelabel) su propio perfil Hermes con `SOUL.md` propio. **No** construir aislamiento multi-tenant a nivel de fila en Postgres para este tier todavía — el aislamiento es a nivel de contenedor/proceso, más simple y más seguro para un mercado de 1-3 clientes iniciales. Documentar el runbook de "nuevo tenant" como script (`ops/agents/new-tenant.sh`) que clona la plantilla compose, genera puertos únicos, y registra la instancia.

**Verificación:** `curl https://waha.creativv.dev/api/sessions` con API key desde fuera del VPS → 200. Reinicio del host → sesiones sobreviven (volumen persistente). Crear un tenant nuevo con el script → stack aislado arriba en <5 min.

### Fase 5 — Frontend: un solo funnel + venta del harness (2–3 días)

1. **Home = producto** (`/` pasa a ser el WhatsApp Revenue System, usando el shell de `ProductHome`/`CinematicStage` con contenido migrado de `WhatsAppRevenuePage.tsx`). Incluir selector de canal (WAHA/Cloud API) en el flujo de compra donde el plan lo permite.
2. **Cerrar compra → activación**: `/pago/exito` enlaza a `/embedded-whatsapp` (Cloud API) o a un nuevo `/conectar-whatsapp` con QR (WAHA), según el plan/canal comprado.
3. **`/api/stripe/webhook`** (`checkout.session.completed`) — registra la venta server-side, guarda `plan`, `channel`, enlaza con `whatsapp_connections`/`waha_connections` por `client`.
4. **Página `/agencias` o sección nueva** para el tier Harness — pitch de infraestructura para devs/agencias, con los 3 SKUs de §1.2 y checkout propio (reusa `api/stripe/checkout` añadiendo los 3 planes nuevos).
5. Limpieza de credibilidad (acentos en `WhatsAppRevenuePage.tsx`, dominios `*.vercel.app` en `src/lib/projects.ts`, FOUC de tema, componentes muertos en `src/components/landing/`) — ver detalle en el plan previo de esta conversación si hace falta, no repetido aquí por espacio.

---

## 5. Verificación end-to-end (criterio de aceptación)

**Cloud API (coexistence):**
1. Conectar número real vía `/embedded-whatsapp`.
2. Mensaje entrante desde otro teléfono → aparece en `/ops/inbox` en segundos.
3. Responder desde `/ops/inbox` → llega al teléfono del contacto.
4. Responder desde la app del dueño en su celular → aparece en el hilo vía `smb_message_echoes` (`source='phone'`).
5. Reenviar el mismo payload de webhook dos veces → un solo registro (`wa_message_id` UNIQUE).
6. `last_inbound_at` > 24h + intento de texto libre → rechazado; con `template` → aceptado.

**WAHA:**
1. Crear sesión nueva vía `/ops/inbox` → QR se muestra.
2. Escanear con el WhatsApp del cliente → estado pasa a `connected`.
3. Mensaje entrante → aparece en `/ops/inbox` con badge de canal WAHA.
4. Responder desde el inbox → llega al contacto.
5. Reiniciar el contenedor WAHA → sesión persiste (volumen).

**Infraestructura (tier Harness):**
1. Ejecutar `new-tenant.sh cliente-demo` → stack aislado corriendo, puertos únicos, sin colisión con el stack principal.
2. `curl` al endpoint de salud del tenant nuevo → 200, aislado del resto.

**Frontend/pagos:**
1. Compra de prueba (Stripe test) en plan `whatsapp_growth` eligiendo canal WAHA → `/pago/exito` enlaza a `/conectar-whatsapp` → QR aparece → tras escanear, `waha_connections` registra al cliente.
2. Compra de prueba en `harness_solo` → checkout distinto, sin flujo de QR de cliente final (es infraestructura para el comprador, no para sus clientes).
3. `npm run build` limpio.

---

## 6. Notas para el implementador

- Seguir los patrones ya existentes: Neon `sql` tagged templates (no ORM), Zod para validar payloads de rutas ops (ver `growth/outreach` como referencia), AI SDK vía Vercel AI Gateway con strings de modelo (no paquetes de proveedor específico).
- No introducir librerías nuevas para cifrado (usar `node:crypto`), para colas/eventos (no hay necesidad de un broker todavía), ni para estado de UI (seguir `useState`/`fetch` como en `GrowthOpsClient.tsx`).
- Cada fase es desplegable independientemente; Fase 0 es prerequisito de todas las demás por seguridad.
- El tier de infraestructura (Harness) es un producto distinto al WhatsApp Revenue System — no compartir tablas de negocio (`leads`, `growth_runs`) entre ambos; el tier Harness solo necesita registro de tenant + facturación.
