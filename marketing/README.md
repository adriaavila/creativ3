# marketing/ — Sistema de marketing agentic de creativv

Centro de operaciones de adquisición de clientes. Todo lo que un agente (o un humano) necesita para investigar, crear contenido, prospectar, publicar, medir y mejorar vive aquí. El objetivo del sistema no son likes: son **conversaciones comerciales, diagnósticos vendidos, pilotos y clientes**.

## Qué hay ya construido en este repo (no duplicar)

| Activo | Dónde | Estado |
|---|---|---|
| Growth agent ejecutable (investiga leads, redacta, CRM) | `apps/growth-agent/` | Desplegado en Vercel, corre schedules diarios/semanales |
| Panel humano de revisión y pipeline | `src/app/ops/growth` + `src/lib/growth-db.ts` | Funcional (Neon/Postgres) |
| Landing + páginas por vertical | `/`, `/clinicas`, `/inmobiliarias`, `/ecommerce`, `/academias` | Publicadas |
| SEO programático ciudad × vertical | `/paginas-web/[ciudad]/[vertical]` | Publicado |
| Cotizador con precios visibles | `/cotizar` | Publicado |
| Checkout Stripe + WhatsApp CTA | `src/app/api/stripe/checkout`, `src/lib/contact.ts` | Funcional |
| Planes GTM y scripts previos | `.docs/mkt/` | Fuente histórica; esta carpeta los supersede |

Esta carpeta es la **capa de estrategia, contenido y memoria** que orquesta esos activos. El código del agente sigue en `apps/growth-agent`; sus reglas de negocio deben mantenerse consistentes con `context/` y `strategy/` de aquí.

## Mapa

- `context/` — qué vendemos, a quién, contra quién, con qué posicionamiento. **Leer primero.**
- `strategy/` — go-to-market, canales, contenido, funnel y plan de 90 días.
- `agents/` — definición de cada agente: misión, entradas, salidas, límites, criterio de done.
- `content/` — ideas, calendario de 4 semanas, borradores → aprobados → publicados, assets reutilizables.
- `outreach/` — base de leads, calificación, secuencias, conversaciones y seguimientos.
- `analytics/` — definición de métricas, scorecard semanal, performance por canal/contenido, experimentos.
- `browser-use/` — flujos automatizables con navegador, plataformas soportadas, reglas de seguridad, log de ejecución.
- `playbooks/` — procedimientos paso a paso para tareas recurrentes.
- `memory/` — aprendizajes, decisiones, experimentos fallidos, próximas acciones.
- `backlog.md` — backlog priorizado Now / Next / Later / Needs approval.

## Ciclo operativo semanal

```
Lunes      → find-leads.md (investigación + calificación)
Mar–Jue    → contact-leads.md + publish-content.md (outreach y contenido aprobado)
Viernes    → analyze-results.md (scorecard) + weekly-growth-cycle.md (retro + plan)
Continuo   → memory/ se actualiza con cada aprendizaje y decisión
```

Detalle en `playbooks/weekly-growth-cycle.md`.

## Reglas del sistema (no negociables)

1. Ninguna métrica de vanidad: todo se conecta a conversaciones → demos/diagnósticos → clientes.
2. Nada se publica ni se envía sin aprobación humana explícita (estado `aprobado` en el archivo o en el panel `/ops/growth`).
3. No se inventan testimonios, clientes, cifras ni funcionalidades. Toda afirmación pública debe ser verificable.
4. Hechos, hipótesis e inferencias se etiquetan como tales en cualquier documento de investigación.
5. Toda acción ejecutada deja registro: contenido en `content/published/`, mensajes en `outreach/conversations.md`, automatizaciones en `browser-use/execution-log.md`, decisiones en `memory/decisions.md`.
6. Browser Use opera solo bajo `browser-use/safety-rules.md`.

## Estado actual (2026-07-07)

- Sistema documental completo: contexto, estrategia, agentes, playbooks, plantillas.
- Calendario de contenido de 4 semanas creado con 3 borradores listos para revisión humana.
- Base de leads con estructura y filas semilla (sin datos personales; se llena con investigación real).
- Pendiente de aprobación humana: ver `backlog.md` sección "Needs approval".
