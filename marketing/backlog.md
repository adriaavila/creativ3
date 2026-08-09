# Backlog priorizado

Criterios de orden: impacto comercial > tiempo-hasta-aprendizaje > esfuerzo > riesgo > dependencias. Lo mantiene el Orchestrator; el humano puede reordenar siempre.

Leyenda esfuerzo: S (<1h) · M (1–4h) · L (>4h). Impacto: 🔥 directo a clientes · ➕ habilitador · 🧱 infraestructura.

## Now (campaña 2026-08-10 → 2026-08-21)

| # | Tarea | Impacto | Esfuerzo | Riesgo | Dependencia | Aprendizaje en |
|---|---|---|---|---|---|---|
| 1 | Validar 12 leads únicos de `/ops/growth` y aprobar los 4 borradores prioritarios | 🔥 | S | bajo | Evidencia del agente | inmediato |
| 2 | Preparar 12 diagnósticos gratuitos de 2 hallazgos | 🔥 | M | bajo | #1 | 1 semana |
| 3 | Enviar 12 mensajes humanos (6 martes + 6 jueves) con EXP-001 A/B | 🔥 | M | medio (reputación → mitigado por límites) | #1, #2 | 2 semanas |
| 4 | Grabar Loom demo 3 min para el follow-up | 🔥 | S | bajo | — | 1 semana |
| 5 | Publicar 3 piezas de contenido aprobadas por semana | 🔥 | M | bajo | Revisión humana | 2 semanas |
| 6 | Registrar respuestas, llamadas y próximos pasos en `conversations.md` | 🔥 | S | bajo | #3 | continuo |
| 7 | Configurar tracking de clics a wa.me en Vercel Analytics | ➕ | S | nulo | — | 2 semanas |

## Next (semanas 2–4)

| # | Tarea | Impacto | Esfuerzo | Dependencia |
|---|---|---|---|---|
| 8 | Hacer follow-up 1 y 2 a los no respondidos | 🔥 | M | 12 envíos iniciales |
| 9 | Hacer llamadas de 15 min y calificar el piloto IA desde USD 899 | 🔥 | M | Respuesta positiva |
| 10 | Enviar la primera propuesta de piloto con alcance y métrica | 🔥 | S | Lead calificado |
| 11 | Completar scorecard de las dos semanas y cerrar EXP-001 | ➕ | S | Registro de actividad |
| 12 | Unificar cola de follow-ups (CSV ↔ panel `/ops/growth`) | ➕ | M | — |

## Later (mes 2+)

| # | Tarea | Dependencia |
|---|---|---|
| 13 | Case study #1 con números reales (página + carrusel + post) | 1er piloto entregado + permiso cliente |
| 14 | Activar LinkedIn outbound MX/CO (20/sem) | Case study publicado |
| 15 | Newsletter #1 (Resend ya instalado) | ≥50 contactos + 4 semanas de aprendizajes |
| 16 | Guía SEO long-tail #1 desde preguntas reales de prospectos | 20+ conversaciones registradas |
| 17 | Programa de referidos operativo | **D-004** + 1er cliente satisfecho |
| 18 | Video corto / TikTok reciclando carruseles ganadores | 2+ carruseles con tracción medida |

## Needs approval (humano — ver detalle en `memory/decisions.md`)

| Decisión | Qué desbloquea | Urgencia |
|---|---|---|
| **D-002** Autorizar IG/LinkedIn/Postiz para publicación y stats | WF-04/05/06, menos trabajo manual | 🔴 esta semana |
| **D-003** 2 pilotos con descuento a cambio de caso con números | Motor de prueba social | 🟡 semanas 2–3 |
| **D-004** Referidos 10% primer proyecto | #17 | 🟢 mes 2 |
| **D-005** Presupuesto herramientas (USD 0–50/mes) | Scheduling/CRM tooling | 🟢 cuando duela |
| Cualquier campaña pagada | Paid Fase 2 | ⚪ no antes de caso publicado |

**D-105 activa:** diagnóstico gratuito breve → piloto IA desde USD 899 para los leads verificados de `/ops`.
