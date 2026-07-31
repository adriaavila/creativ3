# Playbook — Encontrar leads

**Cuándo:** lunes (bloque 60–90 min) + corridas diarias automáticas del growth agent. **Meta:** base siempre con ≥20 leads score≥6 sin contactar.

## Pasos

1. **Elegir foco** de la semana (Orchestrator/humano): vertical + zona (p. ej. "clínicas estéticas, Caracas este"). Alinear con el contenido de la semana.
2. **Revisar el panel `/ops/growth`**: importar a `outreach/lead-database.csv` los leads del agente desplegado que pasen la rúbrica (con su evidencia URL).
3. **Completar manualmente** hasta 10 nuevos con WF-01 (Google Maps, IG local, directorios):
   - Verificar señales ICP (`context/ideal-customer-profile.md`).
   - Registrar dolor OBSERVADO con URL de evidencia — nunca imaginado.
   - Score con la rúbrica de `outreach/lead-qualification.md`.
4. **Deduplicar** (empresa+ciudad, contra CSV y panel).
5. **Priorizar**: ordenar `pendiente` por score; los top 15 pasan a la cola del Outreach Agent.
6. **Registrar fuentes agotadas** en `memory/learnings.md` ("el directorio X no rinde") para no repetir.

## Reglas
- Calidad > volumen: 5 leads con dolor documentado valen más que 20 genéricos.
- Solo datos comerciales públicos. Sin evidencia URL, el lead no entra.
- Si en 30 min una fuente no da 3 candidatos, cambiar de fuente.

## Fuentes por vertical (actualizar con lo que rinda)

| Vertical | Fuentes |
|---|---|
| Clínicas estéticas | Google Maps, IG hashtags locales, directorios médicos públicos |
| Academias | Google Maps, IG, grupos públicos de la actividad |
| Inmobiliarias | Portales (para identificar agencias), IG, colegios de corredores |
| Ecommerce | IG shopping local, Tiendanube/Shopify stores públicas del país |
