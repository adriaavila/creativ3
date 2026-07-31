# Definición de métricas

Jerarquía: las métricas de negocio mandan; las de funnel explican; las de canal solo son contexto. Nada se celebra si no mueve la capa superior.

## Capa 1 — Negocio (KPI reales)

| Métrica | Definición exacta | Fuente | Meta 90d |
|---|---|---|---|
| Clientes | Pagó anticipo o total de cualquier oferta | Confirmación humana + Stripe | 5 |
| Ingresos | USD cobrados (no facturados) en el periodo | Stripe + registro manual | 4.000 |
| Pilotos activos | Proyectos 14d con anticipo pagado | Scorecard | 3 acumulados |
| Diagnósticos vendidos | USD 150 cobrados | Stripe/manual | 8 |

## Capa 2 — Funnel (indicadores adelantados)

| Métrica | Definición | Fuente |
|---|---|---|
| Mensajes enviados | Outbound toque 1 realmente enviados por humano | `sequences.md` cola marcada ✓ |
| Respuestas | Cualquier respuesta humana del prospecto | `conversations.md` |
| Conversaciones comerciales | Intercambio donde el prospecto habla de SU negocio/dolor (no solo "gracias") | `conversations.md` clasificación `interesado/objecion` |
| Leads calificados | Filas nuevas con score ≥ 6 | `lead-database.csv` + `/ops/growth` |
| Tasa respuesta | respuestas / mensajes toque 1 (ventana 7 días) | Calculada |
| Tasa conversación→diagnóstico | diagnósticos / conversaciones | Calculada |

## Capa 3 — Canal y contenido (contexto)

| Métrica | Definición | Fuente |
|---|---|---|
| Visitas web | Visitantes únicos/sem | Vercel Analytics |
| Visitas a `/cotizar` + verticales | Páginas de intención | Vercel Analytics |
| Clics a WhatsApp | Eventos salientes a wa.me (configurar tracking — tarea backlog) | Vercel Analytics |
| Alcance/impresiones | Nativo de cada plataforma | IG/LinkedIn stats |
| Visitas a perfil | Nativo | IG/LinkedIn stats |
| Guardados/compartidos | Nativo (proxy de utilidad) | IG stats |
| DMs entrantes | Mensajes iniciados por prospectos | Conteo manual |
| Coste | USD gastados en herramientas/ads del periodo | Registro manual |

## Reglas de medición

- Ventana semanal: lunes–domingo; scorecard el viernes con datos a la fecha, ajuste lunes si hace falta.
- Atribución: preguntar SIEMPRE "¿cómo nos encontraste?" en la primera conversación; registrar `origen` en conversations. Sin dato → `desconocido` (no adivinar).
- Un dato faltante se deja vacío con nota; no se estima.
- Tasas con n < 20 se reportan con el n visible ("2/12"), nunca solo el porcentaje.
