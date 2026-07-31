# Workflows de Browser Use

Cada workflow: precondiciones, pasos, verificación, y qué hacer ante error. Solo se ejecutan workflows documentados aquí, sobre plataformas `autorizada` en `supported-platforms.md`.

## WF-01 — Investigación de leads (solo lectura, autorizado)

**Precondición:** vertical+zona asignada por Orchestrator.
1. Buscar en Google Maps: `[categoría] [ciudad]` → listar 15–20 candidatos con web/IG.
2. Por candidato: abrir web pública → evaluar (¿explica oferta? ¿CTA visible? ¿WhatsApp?) y perfil IG público → actividad, preguntas sin responder en comentarios.
3. Registrar en `outreach/lead-database.csv` solo los que pasan ICP, con `fuente_url` y `evidencia_url`.
4. **Verificación:** cada fila con URLs que cargan; score con rúbrica.
**Error:** página caída → anotar y seguir; contenido tras login → omitir candidato.

## WF-02 — Investigación de competidores (solo lectura, autorizado)

1. Abrir home + pricing del competidor asignado.
2. Capturar: promesa principal (texto literal), oferta de entrada, precios visibles, CTA.
3. Registrar en `context/competitors.md` con URL y fecha.
4. **Verificación:** cita textual, no paráfrasis inventada.

## WF-03 — Verificación del sitio propio (autorizado)

1. Cargar `/`, `/cotizar`, `/clinicas`, `/academias`, `/inmobiliarias`, `/ecommerce`, `/automatizar`.
2. Probar cada CTA de WhatsApp (que el wa.me abra con el mensaje correcto) y formularios.
3. Registrar roturas en `execution-log.md` y escalar.
**Cadencia:** lunes, antes del ciclo semanal.

## WF-04 — Publicación de contenido aprobado (BLOQUEADO hasta autorizar plataforma — D-002)

**Precondición dura:** pieza en `content/approved/` + plataforma `autorizada` + fecha del calendario.
1. Verificar no-duplicado en `content/published/`.
2. Cargar composer de la plataforma; pegar copy adaptado; adjuntar creatividades.
3. **Checkpoint humano si el workflow lo exige (recomendado las primeras 5 corridas):** mostrar preview y esperar OK.
4. Publicar. Abrir la URL resultante y verificar visibilidad y formato.
5. Mover archivo a `published/` con URL+fecha+evidencia; log en `execution-log.md`.
**Error:** CAPTCHA/aviso → detener, escalar, NO reintentar.

## WF-05 — Recolección de analytics (BLOQUEADO hasta autorizar — D-002)

1. Abrir stats nativas (IG insights / LinkedIn analytics / Vercel Analytics).
2. Copiar métricas de la semana a `analytics/channel-performance.csv` y `content-performance.csv`.
3. Log con fecha y capturas.
**Alternativa vigente mientras tanto:** el fundador exporta/copia los números el viernes (15 min) y el Analytics Agent los procesa.

## WF-06 — Verificación de publicación y comentarios (BLOQUEADO hasta autorizar)

1. Abrir cada URL de `published/` de la semana; confirmar visible.
2. Listar comentarios/preguntas nuevos SIN responder (responder es humano).
3. Reportar en la cola del Outreach Agent los que parezcan leads.
