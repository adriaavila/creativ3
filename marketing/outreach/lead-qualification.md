# Calificación de leads

## Rúbrica de score (0–10)

| Señal | Puntos |
|---|---|
| Coincide con vertical prioritario (clínica/academia; secundario: inmo/ecom) | +2 |
| Demanda visible: IG activo (<2 sem) o corre ads | +2 |
| Dolor observable con evidencia URL (web débil, preguntas sin responder, sin seguimiento aparente) | +2 |
| Decisor identificable y alcanzable | +1 |
| Ticket medio aparente ≥ USD 300 | +1 |
| Señal de compra activa (pregunta precios, contrató staff, lanzó ads con landing genérica) | +2 |

**Umbral de contacto: score ≥ 6.** Entre 4–5: `nutrir` (seguir, interactuar con su contenido). < 4: descartar registrándolo (para no re-investigar).

## Descalificadores automáticos (score = 0, estado `descartado`)

- Sin oferta clara o sin decisor visible.
- Sin presencia digital ni demanda actual.
- Pide "manejo de redes"/ads como necesidad principal.
- Corporativo con comité de compras (ciclo demasiado largo para Fase 1).
- Competidor directo o agencia.

## Estados del lead (columna `estado`)

`pendiente → contactado → respondio → conversacion → diagnostico → piloto → cliente`
Laterales: `nutrir`, `descartado`, `no_contactar` (permanente, por rechazo), `perdido` (con razón en `conversations.md`).

## Reglas de datos

- Solo información comercial pública. Nada sensible ni personal no publicado comercialmente.
- Cada lead: fuente URL + evidencia URL obligatorias.
- Deduplicar por empresa+ciudad antes de insertar (incluye revisar el panel `/ops/growth`).
- Las 2 filas `plantilla_no_contactar` del CSV son ejemplos de formato; se eliminan al entrar los primeros leads reales.

## Revisión humana

El humano valida el score antes del primer contacto (ajuste ±2 permitido con razón). El agente propone; el humano decide a quién se escribe.
