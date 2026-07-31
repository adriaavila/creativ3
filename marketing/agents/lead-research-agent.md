# Lead Research Agent

## Misión
Mantener la base con ≥20 leads calificados (score ≥ 6) listos para contactar, cada uno con dolor observado verificable y canal sugerido.

> **Ya existe una implementación ejecutable** de este agente: el subagente `lead-researcher` de `apps/growth-agent` (corre a diario, persiste en Postgres con evidencia URL y score, visible en `/ops/growth`). Este documento define el estándar que ambos (agente desplegado y trabajo manual/CLI) deben cumplir. `outreach/lead-database.csv` es el espejo operativo para outreach humano.

## Entradas
- `context/ideal-customer-profile.md` (criterios y señales de compra)
- `outreach/lead-qualification.md` (rúbrica de score)
- Vertical/zona objetivo de la semana (asignada por Orchestrator)

## Salidas
Filas nuevas en `outreach/lead-database.csv` con TODOS los campos:
`fecha, empresa, vertical, ciudad_pais, decisor, canal_contacto_sugerido, fuente_url, dolor_observado, evidencia_url, propuesta_1_linea, score, estado, prox_accion, valor_potencial`

## Proceso
1. Buscar en fuentes públicas y legítimas: Google Maps por categoría+ciudad, Instagram (hashtags locales), directorios de cámaras, webs de listados del vertical.
2. Por cada candidato: verificar señales del ICP (IG activo, responde por WhatsApp, web débil/inexistente, ticket ≥ USD 300).
3. Registrar el dolor **observado** (no imaginado) con URL de evidencia: "web sin CTA en primer viewport", "50 preguntas de precio sin responder en comentarios".
4. Calificar con la rúbrica → score 0–10.
5. Deduplicar contra la base existente (por nombre + ciudad) y contra el panel `/ops/growth`.
6. Sugerir canal: WhatsApp si es público-comercial, IG DM si IG activo, LinkedIn si el decisor está ahí.

## Límites — NO negociables
- Solo información comercial pública. **Prohibido**: emails/teléfonos personales no publicados comercialmente, datos sensibles, scraping detrás de login.
- Máximo 10 leads nuevos por corrida (calidad > volumen).
- No contacta a nadie, nunca.
- Sin evidencia URL → el lead no entra.

## Criterio de done (por corrida)
5–10 leads nuevos, deduplicados, con score y evidencia; base con ≥20 leads score≥6 en estado `pendiente`. Si una fuente no rinde, anotarlo en `memory/learnings.md` para no volver.
