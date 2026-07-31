# Contexto de producto — creativv

> Fuente: análisis completo del repo (2026-07-07). Etiquetas: **[HECHO]** verificable en el repo/sitio, **[HIPÓTESIS]** requiere validación de mercado, **[INFERENCIA]** deducido del código o los docs.

## Qué es

**[HECHO]** creativv (servicioscreativos.online) es un estudio de diseño + código + IA que construye sistemas comerciales digitales para PYMEs de LATAM: landing pages, webs/productos, automatizaciones y agentes IA sobre WhatsApp. Marca operativa: "creativv"; dominio: servicioscreativos.online; contacto: contacto@servicioscreativos.online, WhatsApp +58 422 002 3684 (`src/lib/contact.ts`).

**[INFERENCIA]** Operación de una sola persona (fundador), con base en Caracas, Venezuela (el growth agent limita su mercado inicial a Caracas/Venezuela en `apps/growth-agent/agent/instructions.md`).

## Problema que resuelve

**[HECHO — copy del sitio]** Negocios que ya tienen demanda (Instagram activo, ads, WhatsApp lleno) pero la pierden por: web floja o inexistente que no justifica el precio, WhatsApp saturado de preguntas repetidas sin filtro ni seguimiento, y operación manual que enfría leads. creativv convierte web + WhatsApp + agenda en un sistema que filtra, califica y da seguimiento.

## Oferta y precios publicados

**[HECHO — visibles en `/cotizar` y `OfertaSection.tsx`]**

| Oferta | Precio | Plazo |
|---|---|---|
| Landing Page | USD 199 | 3 días |
| Automatización | Desde USD 499 | 5–10 días |
| Web / Producto | Desde USD 699 | 10–21 días |

**[HECHO — en docs internos, no en el sitio]** (`.docs/mkt/gtm-arranque-2026-05-25.md`):

| Oferta | Precio | Plazo |
|---|---|---|
| Diagnóstico express (auditoría + 10 quick wins + roadmap; acreditable a proyecto) | USD 150 | 48h |
| Piloto IA (intake WhatsApp, cotizador, FAQ+escalamiento, dashboard) | Desde USD 900 | 14 días |
| Sprint web/producto | Desde USD 1.500 | 10–21 días |

⚠️ **Contradicción detectada:** el sitio publica 199/499/699 y los scripts de outreach usan 150/900/1.500. Ver `memory/decisions.md` → decisión pendiente D-001. Hasta resolverla, el outreach usa los precios del sitio + diagnóstico USD 150 como entrada de bajo riesgo.

## Buyer personas

**[HIPÓTESIS — de `.docs/mkt/` + verticales del sitio, sin clientes que las validen aún]**

1. **Dueño/a de clínica estética o wellness** — ticket medio/alto, Instagram activo, recepción ahogada en WhatsApp. Compra confianza y orden en la agenda.
2. **Broker/dueño de inmobiliaria** — leads sin presupuesto/zona/fecha, dependencia de portales. Compra calificación automática y captación propia.
3. **Dueño/a de ecommerce o marca local** (Shopify/Tiendanube/IG) — preguntas repetidas de stock/envíos/pagos, carritos fríos. Compra conversión y recuperación.
4. **Dueño/a de academia, coach o servicio recurrente** — horarios/precios/cupos respondidos mil veces, seguimiento inexistente entre interés y pago. Compra intake + reserva + recordatorio.

Perfil común: decisor visible, responde leads por WhatsApp, ticket medio ≥ USD 300, factura suficiente para pagar USD 150–900 sin comité.

## ICP prioritario

**[DECISIÓN OPERATIVA]** Fase actual: **clínicas estéticas y academias/servicios recurrentes en Caracas/Venezuela** (mercado que el growth agent ya investiga), expandiendo a México/Colombia por LinkedIn cuando haya 2+ casos documentados. Detalle completo en `ideal-customer-profile.md`.

## Propuesta de valor

Tu negocio ya genera interés; nosotros hacemos que ese interés se convierta. Web + WhatsApp + automatización funcionando en días (no meses), con precios a la vista y una entrada de bajo riesgo (diagnóstico USD 150 en 48h, acreditable).

## Diferenciadores

1. **Precios publicados y plazos cortos** (199/3 días) — la mayoría de agencias cotiza a ciegas. **[HECHO]**
2. **Entrada de bajo riesgo**: diagnóstico USD 150 acreditable — filtra curiosos y abre conversación pagada. **[HECHO en oferta]**
3. **Sistema, no piezas sueltas**: landing + WhatsApp + calificación + seguimiento como un solo flujo. **[HECHO — es lo que venden las páginas verticales]**
4. **LATAM-native**: WhatsApp Business API (Meta embedded signup ya implementado en el repo), español, contexto local. **[HECHO — `src/app/api/meta/`]**
5. **El estudio usa sus propios agentes**: growth agent real investigando y operando el pipeline — demo viviente del producto. **[HECHO — `apps/growth-agent`]**

## Objeciones previsibles y respuesta

| Objeción | Respuesta honesta |
|---|---|
| "¿Tienen casos/clientes?" | Aún no hay case studies publicados. Ofrecer piloto a precio reducido a cambio de testimonio con números. **No inventar.** |
| "¿USD 199 una landing? ¿Qué tan buena puede ser?" | Mostrar el propio sitio y `/projects` como prueba de calidad de diseño. |
| "Ya tengo quien me maneja redes" | No competimos con redes: arreglamos conversión y operación (web, WhatsApp, seguimiento). |
| "La IA responde mal / me da miedo con pacientes" | Piloto con escalamiento humano siempre; el bot filtra y agenda, no diagnostica. |
| "¿Y si te vas / dejás de operar?" | Sin lock-in: el sistema queda documentado y en cuentas del cliente. |
| "Pago en Venezuela / divisas" | Stripe + acordar método local. (Validar operativamente — **[HIPÓTESIS]**). |

## Activos disponibles hoy

- Sitio completo con 4 landings verticales, cotizador, checkout Stripe, SEO programático ciudad×vertical. **[HECHO]**
- Galería de proyectos (`/projects`, `/proyecto`, caso "Mística"). **[HECHO]**
- Growth agent desplegado: investiga leads con evidencia URL, score, borradores de propuesta y contenido, CRM con follow-ups. **[HECHO]**
- WhatsApp Business embedded signup + webhook (infraestructura para pilotos de clientes). **[HECHO]**
- Scripts de outreach y plantilla de diagnóstico (`.docs/mkt/`). **[HECHO]**
- Analytics: Vercel Analytics + Speed Insights instalados. **[HECHO]**

## Limitaciones actuales — qué NO prometer

- **Cero case studies con números reales publicados.** No prometer ROI concreto ("3x en 90 días" del plan viejo NO es usable sin evidencia).
- **Sin testimonios.** No publicar prueba social inventada.
- No hay newsletter operativa ni blog con artículos (solo infraestructura). No prometer "contenido semanal" hasta sostenerlo.
- El growth agent **no envía mensajes** por diseño; todo outreach es humano. No prometer "outbound automatizado".
- Sin presupuesto de ads validado; paid es fase 2.

## Oportunidades de venta inmediata

1. **Diagnóstico express USD 150/48h** a negocios locales con dolor visible (web débil + IG activo) — ciclo de venta de días.
2. **Landing USD 199/3 días** como producto de entrada autoservible vía `/cotizar` + WhatsApp.
3. **Piloto IA WhatsApp 14 días** a clínicas/academias que ya respondieron — usar la infraestructura Meta ya construida.
4. **Convertir el propio growth agent en contenido**: "construí un agente que me investiga leads cada mañana" es la demo más creíble disponible hoy.
