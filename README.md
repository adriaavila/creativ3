# allok.fun

El sitio de allok: la cara comercial de los productos, la agencia, y el
portafolio de Adrián Ávila Molina. Next.js 16 (App Router), React 19,
Tailwind 4, Neon Postgres y Stripe.

## Correrlo

```bash
pnpm install
pnpm dev
```

En `http://localhost:3000`. Las variables de entorno están documentadas en
`.env.example`.

## La estructura del sitio

```
/               allok — la casa. Tres puertas y el portafolio como prueba.
├── /rei        producto: CRM de WhatsApp para inmobiliarias, por mensualidad.
├── /vocero     a medida: agente de WhatsApp sobre los sistemas del cliente.
├── /agencia    web, automatización y producto a medida, por entregable.
└── /portfolio  la prueba
    ├── /work       índice de sistemas con capturas reales
    ├── /lab        experimentos
    └── /writing    notas
```

**Agencia y portafolio no son lo mismo**: la agencia es lo que se contrata, el
portafolio es la prueba de que funciona. El pie del sitio los lista en columnas
separadas a propósito.

Además: `/ops` (panel interno), `/conectar-whatsapp` y `/embedded-whatsapp` (el
alta de WhatsApp con Meta), `/pago/*` (checkout de Stripe) y las páginas legales
que Meta exige. Ninguna de ellas va al sitemap.

## Diseño

Hay **dos sistemas visuales**, a propósito: `.allok` para las páginas
comerciales y `.rig` para el portafolio. Los dos viven en
`src/app/globals.css` bajo su clase raíz, y comparten el degradado del cielo.

**Antes de tocar una página, lee [`docs/design/README.md`](docs/design/README.md)** —
tokens, tipografía, movimiento, las marcas y el gesto que estructura las
páginas comerciales.

## Dónde está cada cosa

| | |
|---|---|
| Páginas comerciales | `src/app/{page,rei,vocero,agencia}/page.tsx` |
| Cabecera, pie y marcas | `src/components/allok/` |
| Chrome del portafolio | `src/components/rig/` |
| Planes y costos de REI | `src/lib/rei-pricing.ts` (+ su test) |
| Proyectos del portafolio | `src/lib/projects.ts`, sincronizado con `pnpm sync:projects` |
| Alta de WhatsApp con Meta | `src/app/api/meta/`, `src/lib/handover/` |
| Panel interno | `src/app/ops/`, `src/app/api/ops/` |

## Comprobaciones

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

Más los `check:*` de `package.json` cuando tocas facturación, el proveedor de
Meta o la firma de webhooks.

## Documentación

- [`docs/design/README.md`](docs/design/README.md) — el sistema de diseño y la estructura del sitio
- [`docs/allok-whatsapp/`](docs/allok-whatsapp/) — alta de clientes de WhatsApp
- [`docs/meta-embedded-signup.md`](docs/meta-embedded-signup.md) — el Embedded Signup de Meta
- [`docs/meta-whatsapp-production-state.md`](docs/meta-whatsapp-production-state.md) — qué está vivo hoy en producción
- [`docs/self-hosting-coolify.md`](docs/self-hosting-coolify.md) — despliegue propio
