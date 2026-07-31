# Playbook — Analizar resultados

**Cuándo:** viernes, 45–60 min. Produce el scorecard y las decisiones de la semana.

## Pasos

1. **Recolectar** (20 min):
   - Vercel Analytics: visitas, páginas top, referrers (export/copia manual mientras WF-05 esté bloqueado).
   - IG/LinkedIn: alcance, impresiones, visitas a perfil, interacciones por pieza publicada.
   - `outreach/`: contar mensajes ✓, respuestas, conversaciones desde `conversations.md`.
   - Panel `/ops/growth`: leads nuevos, outcomes registrados.
   - Ingresos: Stripe + confirmación manual.
2. **Registrar** (15 min):
   - Nueva entrada en `analytics/weekly-scorecard.md` (plantilla completa, celdas vacías con nota si falta dato).
   - Fila por canal en `channel-performance.csv`.
   - Piezas que cumplen 7 días → `content-performance.csv` con `cumplio: sí/no` vs métrica esperada.
3. **Comparar contra hipótesis del funnel** (`strategy/acquisition-funnel.md`): marcar toda tasa real < 50% de la hipótesis como ALERTA.
4. **Extraer** (10 min): canal ganador, contenido ganador, estado del experimento activo, principal aprendizaje → `memory/learnings.md`.
5. **Entregar** al ciclo de optimización (`weekly-growth-cycle.md` paso 2).

## Reglas
- No estimar datos faltantes; vacío + nota.
- Tasas siempre con n visible ("3/25", no "12%").
- La pregunta final de todo análisis: **¿qué produjo conversaciones y qué no?**
