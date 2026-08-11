# Onboarding de clientes en allok

allok es el Tech Provider: es dueño de la app de Meta, así que **todo número de
WhatsApp oficial entra por su Embedded Signup**, aunque después el cliente no
trabaje en esta bandeja. Este documento es el orden de ese trabajo.

## Piloto interno con WAHA

WAHA sirve para validar el CRM con números propios antes de activar Meta. No es
el canal de producción ni una herramienta de envíos masivos.

1. En el entorno de allok, activa el cerrojo de salida y autoriza únicamente el
   WhatsApp que hará la prueba:

   ```env
   WHATSAPP_OUTBOUND_MODE=pilot
   WHATSAPP_PILOT_ALLOWED_WA_IDS=58412XXXXXXX
   ```

2. En `/ops/crm?view=connections`, abre la sesión WAHA conectada y configura su
   persona, datos verificados, reglas y modo de operación.
3. Vincula una segunda sesión WAHA como teléfono probador y ejecuta una sola
   prueba de ida y vuelta:

   ```bash
   WAHA_CRM_TESTER_SESSION=allok-tester \
   WAHA_CRM_TEST_TARGET=58422XXXXXXX \
   WAHA_CRM_TEST_CONFIRM=send-live-test \
   pnpm check:waha-crm-flow
   ```

El comando falla si falta la confirmación, si la sesión probadora no está
conectada o si el CRM no responde en 90 segundos. Al terminar el piloto, elimina
la sesión probadora y no cambies a `production` hasta tener consentimiento y
opt-out operativos.

La bandeja agrupa Meta y WAHA por cliente + teléfono, conserva el selector de
canal y considera pendiente solo un inbound humano de los últimos 7 días. Cierra
las conversaciones resueltas; un nuevo inbound las reabre automáticamente.

El primer contacto desde Growth requiere dos confirmaciones: revisión del
mensaje y consentimiento/base legítima documentada. El backend impide repetir
outreach al mismo número durante 24 horas.

## Las dos cosas que no hay que confundir

| | Dónde vive | Qué guarda |
|---|---|---|
| **Alta** (conectar el número) | Siempre allok | `whatsapp_connections`: WABA, phone number id, token cifrado |
| **Operación** (atender el chat) | allok **o** la app del cliente | La bandeja donde el cliente responde |

Un cliente que opera en otra app **no** aparece en la bandeja de allok: sus
webhooks se redirigen a esa app durante la entrega. Que la bandeja esté vacía
es el resultado esperado, no una falla.

## Destinos: dónde puede trabajar un número

Un destino es una fila de `handover_destinations`, no una rama en el código ni
una variable de entorno: dar de alta una app nueva es guardar su webhook y su
verify token desde Ops («Nuevo destino»), y ya se le puede entregar cualquier
número.

| Campo | Para qué |
|---|---|
| `slug`, `label` | Identifican el destino en la conexión entregada |
| `webhook_url` | A dónde Meta manda los eventos de esa WABA (HTTPS) |
| `verify_token` | El de **esa** app; Meta lo usa en el GET de verificación. Cifrado |
| `provision_url`, `provision_secret` | Opcionales. Si la app expone provisión, allok le empuja el token antes de mover el webhook. Cifrado |

Sin `provision_url`, el token se entrega a mano: «Mostrar token para
entregarlo» en la misma fila (`POST /api/ops/whatsapp-connections/<id>/token`,
que valida el token contra Meta antes de mostrarlo y lo registra en el log).

REI CRM es un destino más. Mientras no exista su fila, se arma desde las
variables `REI_*` de siempre; guardándolo una vez desde Ops esas variables se
pueden borrar.

## Inventario y entrega: `/ops/crm?view=connections`

Una fila por número onboardeado, leída directamente de `whatsapp_connections`:

- **Cliente**: la clave que viajó en el enlace de onboarding.
- **Credenciales**: `business_id`, `waba_id`, `phone_number_id` y presencia del
  token cifrado; el token nunca se muestra.
- **Destino**: a qué app se entregó, su referencia externa, callback confirmado
  y fecha de entrega.

La referencia externa (en REI, su `organization_id`) se pide al entregar porque
no viene de Meta, y sólo la exigen los destinos con provisión. La relación queda
guardada en la misma conexión; no depende de la tabla opcional `clients`.

## Flujo, de punta a punta

1. **Enlace** → genera el Embedded Signup firmado con el `client` correcto. Se
   lo mandás al dueño del negocio; no necesita cuenta en Ops.
2. **El cliente conecta** su número desde ese enlace (Coexistence: el número
   sigue vivo en su WhatsApp Business App). allok guarda el token cifrado y
   suscribe el WABA. La fila aparece automáticamente en Conexiones.
3. **Entregar**, si trabaja en otra app → abre «Entregar este número a una
   app», elige el destino y confirma. El servidor valida primero que el token
   siga funcionando y después hace, en este orden:
   1. si el destino tiene provisión, le manda las credenciales por HTTPS;
   2. redirige el webhook de ese WABA a su URL (`override_callback_uri` en Meta),
      con el verify token de esa app;
   3. hace `GET /{waba_id}/subscribed_apps` y sólo marca la entrega cuando Meta
      devuelve el callback esperado.

   El orden importa: al revés, los mensajes llegarían a una app que todavía no
   conoce el número. Si el paso 2 falla, la respuesta lo dice y se puede
   reintentar — el botón es idempotente.
4. **Verificar** con un mensaje real al número: tiene que aparecer en la
   bandeja de esa app, no en la de allok.

Un cliente que trabaja en la bandeja de allok se salta el paso 4: ya está
operando cuando conecta. Lo que sí le falta es su persona y sus datos de
negocio en `tenant_bot_config` (`/ops/connections/<phone_number_id>`), o va a
contestar con la copia por defecto.

## Configuración

La tabla de destinos vive en la migración `020_handover_destinations.sql`:

```
node scripts/run-migration.mjs db/migrations/020_handover_destinations.sql
```

Lo que cada app destino necesita de su lado (ejemplo con REI, `apps/portal`):

```
WHATSAPP_PROVISION_SECRET=…        # el mismo que REI_PROVISION_SECRET
WHATSAPP_WEBHOOK_VERIFY_TOKEN=…    # el mismo que REI_WEBHOOK_VERIFY_TOKEN
WHATSAPP_APP_SECRET=…              # el App Secret de la app de Meta de allok
ENCRYPTION_KEY=…                   # propio de REI; cifra el token de nuevo de su lado
```

`WHATSAPP_APP_SECRET` en la app destino es el de **allok**: la firma de los
webhooks la pone la app de Meta que hizo el alta, y la app destino valida con
esa misma clave. Vale para cualquier destino, no sólo REI.

La entrega reutiliza `webhook_override_*` en la conexión y conserva el destino
y su referencia dentro de `token_metadata.crm_handover`.

## Qué mirar cuando algo no anda

| Síntoma | Dónde mirar |
|---|---|
| El botón «Entregar» está apagado | Falta elegir destino, falta la referencia externa que ese destino exige, o el número no tiene token guardado |
| Meta no confirma el callback | La app destino no respondió el `hub.challenge` con el verify token guardado en su destino. Nada se movió |
| «Esa organización no existe» | La referencia externa del cliente no es de esa app o está mal copiada |
| Entregó credenciales pero falló el webhook | La respuesta trae `credentials_delivered: true`. Reintentar «Entregar» repite sólo el paso del webhook en la práctica |
| El cliente conectó pero no aparece en ninguna bandeja | `scripts/check-meta-coexistence-acceptance.ts <PHONE_NUMBER_ID>` |

## Límite conocido

La entrega es una acción manual del operador, no un paso automático del
Embedded Signup. Es a propósito: el alta es el momento frágil (el cliente está
mirando la pantalla) y la entrega necesita un dato que no viene de Meta. Si el
volumen crece, el paso natural es dejar que la ruta de exchange entregue sola
cuando el cliente ya está registrado con un destino y su referencia.
