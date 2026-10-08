# Correo en frío desde hola.allok.fun

Cómo escribirle por primera vez a un negocio (clínicas y academias de MX y CO)
sin quemar el dominio. Código: `src/lib/outreach*.ts`, `/ops/outreach`,
`/api/cron/outreach`, `/api/outreach/baja`, `/api/outreach/resend-webhook`, y
el script `scripts/outreach.ts` para correrlo a mano. Tablas: migraciones
`db/migrations/024_outreach.sql` y `025_outreach_automation.sql` (se crean
solas la primera vez).

## 0. En producción (lo normal)

Todo corre desde Vercel; no hace falta la terminal.

1. Vercel → Settings → Environment Variables: `RESEND_API_KEY` (además de
   `DATABASE_URL`, `CRON_SECRET` y `OPS_*`, que ya están). Nada más es
   obligatorio: remitente `adrian@hola.allok.fun`, respuestas a
   `hi@allok.fun`, tope 20/día y el secreto de baja (derivado de
   `OPS_SESSION_SECRET`) tienen valor por defecto.
2. `/ops/outreach` → **Subir leads** (el CSV de siempre). Importa los
   contactos con los mismos filtros de `pnpm outreach import` y pone en cola
   la demo de cada fila con web.
3. El cron (`vercel.json`, de lunes a viernes a las 16:00 UTC; el plan Hobby solo permite una corrida diaria) arma hasta 15 demos por corrida, le pregunta
   a Resend por los rebotes de las últimas 72 h y, **solo con «Envíos activos»
   encendido**, envía hasta 20 correos en esa corrida (el tope de 24 h), L–V 9–17 hora
   local. El paso 1 a un negocio con web espera a su demo; tras dos fallos sale
   la variante sin demo (enlace a `/whatsapp-para/<sector>` o
   `/agente-whatsapp`, nunca a la portada).
4. Revisa las vistas previas («Ver correo») y enciende **Envíos activos**.
   Para frenar: apágalo ahí, o `OUTREACH_ENABLED=false` en Vercel (gana siempre).

El rebote por encima de 3 % (últimos 100 envíos) detiene el envío solo; la
página lo avisa.

**Regla fija: nunca se escribe en frío por la API de WhatsApp.** El primer
contacto es por correo, a una dirección que el negocio publica en su web. Por
WhatsApp solo se contesta a quien escribe primero (y eso lo hace el agente).

## 1. DNS (una vez)

El envío sale de `hola.allok.fun`, no de `allok.fun`: si la prospección sale
mal, se quema el subdominio, no los correos de pagos.

1. Resend → **Domains → Add domain** → `hola.allok.fun` (región por defecto).
2. Copia al DNS de `allok.fun` **exactamente** los registros que muestra esa
   página (cambian por cuenta, no los copies de aquí):
   - **SPF**: un `MX` y un `TXT` en `send.hola.allok.fun`
     (`v=spf1 include:amazonses.com ~all`).
   - **DKIM**: un `TXT` en `resend._domainkey.hola.allok.fun`.
3. **DMARC** (cubre a `allok.fun` y sus subdominios), para empezar solo observar:

   ```
   _dmarc.allok.fun  TXT  "v=DMARC1; p=none; rua=mailto:hi@allok.fun"
   ```

   Si ya existe un `_dmarc.allok.fun`, no agregues otro: edita ese.
4. Espera a que Resend diga **Verified** en los tres.
5. En ese dominio de Resend deja **apagado** el open tracking y el click
   tracking: los correos van en texto plano, sin píxel y sin enlaces reescritos.
6. Opcional (el cron ya consulta los rebotes sin él). Resend → **Webhooks → Add endpoint**:
   `https://allok.fun/api/outreach/resend-webhook`, eventos `email.bounced` y
   `email.complained`. Su *Signing secret* va en `RESEND_WEBHOOK_SECRET`.

Variables (todas documentadas en `.env.example`): obligatorias solo
`RESEND_API_KEY`, `DATABASE_URL` y `CRON_SECRET`. Opcionales, con valor por
defecto: `OUTREACH_FROM`, `OUTREACH_REPLY_TO`, `OUTREACH_DAILY_CAP`,
`OUTREACH_SECRET`, `RESEND_WEBHOOK_SECRET`; `OUTREACH_ENABLED=false` solo
fuerza el apagado.

## 2. Calentamiento

| Semana | Tope (`OUTREACH_DAILY_CAP`) | Para subir |
|---|---|---|
| 1 | 20 al día | — |
| 2 en adelante | 40 al día | rebote < 2 % y quejas < 0.1 % en `pnpm outreach status` |

El script se detiene solo si el rebote de los últimos 100 envíos pasa de 3 %.
Si pasa, no lo fuerces: limpia la lista.

## 3. Correr

```bash
# Importa: solo correos publicados en la web del negocio; webmail (gmail…)
# fuera salvo --allow-freemail; sin repetidos ni suprimidos. Liga la demo
# /demo/<slug> si ya existe (pnpm demo:build).
pnpm outreach import --csv /mnt/project-files/leads/2026-10-mx-co-clinicas-academias.csv --dry-run
pnpm outreach import --csv /mnt/project-files/leads/2026-10-mx-co-clinicas-academias.csv

# Revisa lo que saldría (no envía, no escribe, no pide el interruptor).
pnpm outreach send --limit 20 --dry-run
# Sin base: el CSV como si fuera la cola. --now simula la hora.
pnpm outreach send --dry-run --fixture leads.csv --now 2026-10-06T16:00:00Z

# Envía de verdad (con «Envíos activos» encendido en /ops/outreach).
pnpm outreach send --limit 20

pnpm outreach status
```

`send` solo envía de lunes a viernes, 9:00–17:00 en la hora del negocio
(MX: America/Mexico_City, CO: America/Bogota), respeta el tope de 24 h y
espacia los envíos unos segundos. Conviene correrlo una vez por mañana.

La secuencia son tres correos: día 0 (la demo, o la página
`/whatsapp-para/<sector>` si no hay demo), día 3 (un beneficio concreto) y
día 8 (cierre amable). Se detiene al responder, darse de baja, rebotar,
quejarse o registrarse.

## 4. Respuestas, bajas y rebotes

- **Respuestas**: el script no lee el buzón. Cuando alguien responde a
  hi@allok.fun, márcalo para que no reciba el siguiente paso:
  `pnpm outreach mark --email hola@clinica.mx --status replied`
  (o `--status signed_up` si se registró).
- **Bajas**: cada correo trae `List-Unsubscribe` (one-click) y un enlace
  visible. Las dos cosas los mandan a la lista de supresión para siempre. Si
  alguien pide la baja respondiendo, márcalo como `replied` y no le vuelvas a
  escribir.
- **Rebotes y quejas** llegan por el webhook, o el cron los encuentra al
  consultar Resend, y suprimen la dirección.
- **Excluir**: el botón de `/ops/outreach` suprime al contacto para siempre.

## 5. Interruptor

«Envíos activos» en `/ops/outreach` (tabla `outreach_setting`, apagado por
defecto) manda sobre el cron y sobre `pnpm outreach send`.
`OUTREACH_ENABLED=false` en el entorno lo fuerza apagado. La baja, las demos y
la revisión de rebotes siguen funcionando con el interruptor apagado.
