# Onboarding de clientes en allok

allok es el Tech Provider: es dueño de la app de Meta, así que **todo número de
WhatsApp oficial entra por su Embedded Signup**, aunque después el cliente no
trabaje en esta bandeja. Este documento es el orden de ese trabajo.

## Las dos cosas que no hay que confundir

| | Dónde vive | Qué guarda |
|---|---|---|
| **Alta** (conectar el número) | Siempre allok | `whatsapp_connections`: WABA, phone number id, token cifrado |
| **Operación** (atender el chat) | allok **o** REI CRM | La bandeja donde el cliente responde |

Un cliente que opera en REI **no** aparece en la bandeja de allok: sus webhooks
se redirigen a REI durante la entrega. Que la bandeja esté vacía es el
resultado esperado, no una falla.

## El registro: `/ops/clientes`

Una fila por cliente, con lo único que hace falta saber de cada uno:

- **Identificador** (`slug`): la misma clave que viaja en el enlace de
  onboarding y que queda en `whatsapp_connections.client`. Se elige una vez.
- **Dónde trabaja**: `Bandeja allok` o `REI CRM`. Si es REI, además su
  `organization_id` — sin ese uuid no hay a dónde entregar.
- **Estado**: `Enlace enviado` → `Número conectado` → `Operando`
  (`En pausa` / `Dado de baja` para los que salen).

Regla: **el cliente se crea acá antes de mandarle nada**. Un enlace generado a
mano deja un número conectado a un slug que no existe en el registro, y ese es
justo el estado que este registro vino a eliminar.

## Flujo, de punta a punta

1. **Registrar** al cliente en `/ops/clientes` → «Nuevo cliente». Elegí dónde
   va a trabajar ahí mismo; si es REI, pegá su `organization_id`.
2. **Enlace** → botón «Enlace» de esa fila. Copia el enlace de Embedded Signup
   firmado (vale 7 días) con el slug ya adentro. Se lo mandás al dueño del
   negocio; no necesita cuenta en Ops.
3. **El cliente conecta** su número desde ese enlace (Coexistence: el número
   sigue vivo en su WhatsApp Business App). allok guarda el token cifrado y
   suscribe el WABA. El estado pasa a `Número conectado`.
4. **Entregar**, sólo si trabaja en REI → botón «Entregar a REI». Hace dos
   cosas en este orden:
   1. manda las credenciales a `POST /api/whatsapp/provision` de REI, que las
      guarda cifradas en `meta_credentials` de esa organización;
   2. recién después redirige el webhook de ese WABA a REI
      (`override_callback_uri` en Meta).

   El orden importa: al revés, los mensajes llegarían a una app que todavía no
   conoce el número. Si el paso 2 falla, la respuesta lo dice y se puede
   reintentar — el botón es idempotente.
5. **Verificar** con un mensaje real al número: tiene que aparecer en la
   bandeja de REI, no en la de allok.

Un cliente que trabaja en la bandeja de allok se salta el paso 4: ya está
operando cuando conecta. Lo que sí le falta es su persona y sus datos de
negocio en `tenant_bot_config` (`/ops/connections/<phone_number_id>`), o va a
contestar con la copia por defecto.

## Configuración (una sola vez por entorno)

En allok:

```
REI_PROVISION_URL=https://app.reiprop.tech/api/whatsapp/provision
REI_PROVISION_SECRET=…        # 32+ caracteres
REI_WEBHOOK_VERIFY_TOKEN=…    # el que REI espera en el GET de Meta
```

En REI (`apps/portal`):

```
WHATSAPP_PROVISION_SECRET=…        # el mismo que REI_PROVISION_SECRET
WHATSAPP_WEBHOOK_VERIFY_TOKEN=…    # el mismo que REI_WEBHOOK_VERIFY_TOKEN
WHATSAPP_APP_SECRET=…              # el App Secret de la app de Meta de allok
ENCRYPTION_KEY=…                   # propio de REI; cifra el token de nuevo de su lado
```

`WHATSAPP_APP_SECRET` en REI es el de **allok**: la firma de los webhooks la
pone la app de Meta que hizo el alta, y REI valida con esa misma clave.

Migración: `db/migrations/019_clients.sql` en la base de allok. Registra
automáticamente como clientes los números que ya estaban conectados, así que la
página no arranca vacía.

## Qué mirar cuando algo no anda

| Síntoma | Dónde mirar |
|---|---|
| El botón «Entregar» está apagado | La fila dice el motivo: falta el `organization_id`, falta conectar el número, o el número está desautorizado |
| «Esa organización no existe en REI» | El `organization_id` del registro no es de REI o está mal copiado |
| Entregó credenciales pero falló el webhook | La respuesta trae `credentials_delivered: true`. Reintentar «Entregar» sólo repite el paso del webhook en la práctica: REI hace upsert |
| El cliente conectó pero no aparece en ninguna bandeja | `scripts/check-meta-coexistence-acceptance.ts <PHONE_NUMBER_ID>` |

## Límite conocido

La entrega es una acción manual del operador, no un paso automático del
Embedded Signup. Es a propósito: el alta es el momento frágil (el cliente está
mirando la pantalla) y la entrega necesita un dato que no viene de Meta. Si el
volumen crece, el paso natural es dejar que la ruta de exchange entregue sola
cuando el cliente ya está registrado con destino REI y `organization_id`.
