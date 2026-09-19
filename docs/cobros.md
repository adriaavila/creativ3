# Cobros: la suscripción del CRM y los proyectos de agencia

Actualizado 2026-09-19.

allok cobra de dos formas, **en dos cuentas de Stripe distintas**, y no se
tocan.

| | Suscripción del CRM | Pago único de agencia |
|---|---|---|
| Qué | Esencial · Completo | proyectos, entregables, depósitos |
| Cuánto | US$49 · US$99 al mes | importe cerrado por entregable |
| Quién lo dispara | el cliente, solo | tú, mandando un enlace |
| Modo de Stripe | `subscription` | `payment` |
| Dónde vive el código | `vocero-crm/src/server/saas/billing.ts` | este repo, `/api/stripe/*` |
| Dónde se contrata | `whatsapp.allok.fun/register?plan=…` | `allok.fun`, enlace directo |
| Se administra en | el portal de facturación de Stripe | no hace falta: se paga una vez |

**Por qué separadas, y no una sola cuenta.** Dos razones, y las dos importan:

1. **La suscripción tiene que crear el negocio antes de cobrar.** El checkout
   del CRM vive dentro de la app, que es donde existe la organización. Cobrarlo
   desde el sitio de marketing dejaba al cliente pagando sin que nadie le
   creara la cuenta — el agujero que este documento describía.
2. **Son dos negocios con dos contabilidades.** Ingreso recurrente de producto
   por un lado; proyectos por el otro. Mezclarlos en una cuenta convierte
   cualquier pregunta sobre MRR en un ejercicio de filtrado.

`assertNotCrmPlan` en `src/lib/billing/catalog.ts` hace cumplir la separación:
una clave con pinta de plan del CRM que llegue al checkout de agencia responde
409 con la URL de registro, en vez de cobrar en la cuenta equivocada.

**Lo que allok nunca cobra son los mensajes.** La cuenta de WhatsApp queda a
nombre del cliente y Meta le factura el consumo directo. No es una decisión
comercial sino estructural: centralizar el pago de los mensajes está reservado
a los Solution Partners de Meta, y allok es Tech Provider. Ver
[`src/lib/plans.ts`](../src/lib/plans.ts).

### El tercer bloque de la web no es una suscripción de autoservicio

**A tu medida, desde US$499 al mes**, corre en el servidor del propio cliente.
No tiene checkout: el botón abre WhatsApp. El precio es un piso, no una tarifa
— por eso la página escribe «desde». **Puesta en marcha, US$499 una vez**, se
suma a cualquier plan y también se conversa.

---


## Estado real hoy

Verificado contra la API de Stripe el 2026-09-15:

- **`allok agency`** (`acct_1SDQGcR787DBvVp2`) — en real: dos productos,
  `AI services` (US$80) y `Artistheway-basic` (US$50). **Los dos son
  `one_time`.** En prueba: vacío.
- **`allok LLC`** (`acct_1UDsQAQssTDjutCk`) — sin productos, ni en real ni en
  prueba.

**No existe ni un solo precio recurrente en ninguna de las dos cuentas.**

De ahí se siguen dos cosas que conviene tener claras:

1. Los `STRIPE_PRICE_DESK_*` del catálogo no apuntan a nada. `/desk` no podía
   cobrarle a nadie: `getBillingItem` lanza y el checkout devuelve 500. Nunca
   fue un riesgo de cobrar de más — era un botón roto.
2. La suscripción del CRM es terreno virgen. Falta crear el producto y los
   tres precios; el código que los usa ya está.

---

## Lo que ya estaba hecho

Más de lo que parecía. `POST /api/stripe/checkout` ya elige el `mode` según el
`kind` del catálogo, así que **suscripción y pago único comparten el mismo
endpoint**. El webhook ya atiende `customer.subscription.created/updated/
deleted` y los persiste en `stripe_subscriptions`. El portal de facturación ya
existe en `POST /api/stripe/portal`.

No hubo que construir infraestructura nueva. Lo que se hizo en esta vuelta:

- Tres entradas nuevas en el catálogo (`allok-starter`, `allok-growth`,
  `allok-pro`), `kind: "subscription"`, un precio mensual cada una y sin
  implementación — el alta del CRM es automática, cobrar setup por algo que no
  toca una persona no se sostiene.
- `RETIRED_KEYS` para Desk. Sigue renovando y su dueño sigue entrando al
  portal, pero un checkout nuevo contra esos precios devuelve **410**.
- `getBillingItem` ahora dice **qué variable falta** en vez de un genérico
  "is not configured".
- `isConfigured()`, que la página consulta antes de pintar el botón: si el plan
  no tiene ids, el botón abre WhatsApp en vez de un checkout roto.

---

## Encender la suscripción

Cuatro pasos. El primero mueve dinero de verdad, así que es tuyo.

### 1. Crear producto y precios

```bash
pnpm stripe:setup            # simulacro, no crea nada
pnpm stripe:setup --apply    # crea
```

Idempotente por `lookup_key`: correrlo dos veces reutiliza lo que ya está. Usa
la `STRIPE_SECRET_KEY` que tengas cargada — **revisa si es la de prueba o la
real antes de `--apply`**. Imprime los ids listos para pegar.

Hazlo primero en prueba, cierra el circuito con `4242 4242 4242 4242`, y
recién entonces en real.

### 2. Cargar las variables

En Vercel, y en `.env.local` para desarrollo:

```
STRIPE_PRODUCT_ALLOK=prod_…
STRIPE_PRICE_ALLOK_STARTER_MONTHLY=price_…
STRIPE_PRICE_ALLOK_GROWTH_MONTHLY=price_…
STRIPE_PRICE_ALLOK_PRO_MONTHLY=price_…
```

En cuanto estén, los botones de `/` y `/rei` dejan de mandar a WhatsApp y
abren el checkout. No hay que tocar código ni desplegar otra vez: `isConfigured`
lo lee en cada render.

### 3. El webhook

Endpoint → `https://allok.fun/api/stripe/webhook`, con estos eventos:

```
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_failed          ← falta atenderlo (ver abajo)
```

El secreto va en `STRIPE_WEBHOOK_SECRET`. Sin él la ruta devuelve 503 y ninguna
compra se guarda.

### 4. El portal de facturación

Actívalo en el dashboard (Settings → Billing → Customer portal) y permite
cancelar y cambiar de plan. `POST /api/stripe/portal` ya lo abre.

---

## Lo que falta, y qué se rompe si no se hace

| Hueco | Qué pasa hoy | Cuándo duele |
|---|---|---|
| **El alta no se dispara con el pago.** `checkout.session.completed` guarda la compra pero nadie crea la cuenta ni manda el enlace de Meta. | El cliente paga y no recibe nada. | En cuanto cobres la primera suscripción. **Es el hueco grave.** |
| **`invoice.payment_failed` no se atiende.** | Una tarjeta que rebota deja la suscripción en `past_due` y el cliente sigue usando el producto. | Al tercer o cuarto cliente. |
| **Nada revoca el acceso al cancelar.** El webhook guarda `deleted`, pero ningún camino lee ese estado para apagar el agente. | Cancelan y siguen atendidos. | Con el primer cliente que se va. |
| **Los planes no se hacen cumplir.** "1 número", "2 a 3 números" es copy sin control. | Un Starter conecta cinco números. | Cuando alguien note que puede. |
| **`/conectar-whatsapp` está escrita para pago único.** Dice "el enlace que recibiste tras el pago". | Confunde a un suscriptor. | Junto con el primer punto. |

El orden correcto es: el punto 1, después `invoice.payment_failed`, después la
revocación. Los demás aguantan.

---

## La agencia no cambia

Los pagos de proyecto siguen igual y no tienen por qué moverse:

- Los importes ad-hoc (`project-deposit`, `nodria`, `project-continuation`)
  viven en línea dentro de `src/app/api/stripe/checkout/route.ts` y se crean
  con `price_data` sobre la marcha. Está bien para importes que cambian por
  cliente.
- Las páginas de cobro son `/pago`, `/pago/ainetworking`, `/pago/nodria`.
- El webhook manda el comprobante por Resend **antes** de persistir, a
  propósito: la base puede estar caída y el cliente igual recibe su recibo.

Los precios que muestra `/agencia` (US$199 / 499 / 699) **no** están en Stripe:
esos se cotizan y se cobran con un link. Si alguna vez quieres que se compren
solos, van al catálogo como `one_time` con su producto y su precio, igual que
`allok-launch`.

---

## Dónde está cada cosa

| | |
|---|---|
| Catálogo | [`src/lib/billing/catalog.ts`](../src/lib/billing/catalog.ts) |
| Planes y precios de pantalla | [`src/lib/plans.ts`](../src/lib/plans.ts) |
| Checkout (los dos modos) | [`src/app/api/stripe/checkout/route.ts`](../src/app/api/stripe/checkout/route.ts) |
| Webhook | [`src/app/api/stripe/webhook/route.ts`](../src/app/api/stripe/webhook/route.ts) |
| Portal | [`src/app/api/stripe/portal/route.ts`](../src/app/api/stripe/portal/route.ts) |
| Persistencia | [`src/lib/stripe-purchases-db.ts`](../src/lib/stripe-purchases-db.ts) |
| Botón de plan | [`src/components/allok/PlanCheckout.tsx`](../src/components/allok/PlanCheckout.tsx) |
| Alta de producto y precios | [`scripts/stripe-setup.ts`](../scripts/stripe-setup.ts) |

**El precio se escribe en dos sitios**: `src/lib/plans.ts` (lo que ve el
comprador) y Stripe (lo que se cobra). `pnpm stripe:setup` avisa con un ⚠ si se
separan.
