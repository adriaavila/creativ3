# Playbook — Publicar contenido

**Cuándo:** días de calendario (mar/jue/vie). **Duración:** 15–20 min por pieza.

## Flujo completo (con responsables)

```
Investigación → Idea → Brief → Borrador → Revisión → APROBACIÓN HUMANA → Publicación → Verificación → Medición → Aprendizaje → Reutilización
   (agente)   (agente) (Strategist) (Creator)  (humano)      (humano)        (Publisher/humano)  (Publisher)  (Analytics)  (Optimization) (Strategist)
```

## Pasos

1. **Revisar** el borrador del día en `content/drafts/` contra el checklist de abajo.
2. **Aprobar**: ajustar copy si hace falta, cambiar `estado: aprobado`, mover a `content/approved/`. (Si no pasa: comentar dentro del archivo y devolver a estado `borrador`.)
3. **Preparar creatividades** si es carrusel/imagen (plantilla de marca; dimensiones: IG 1080×1350, LinkedIn documento A4/cuadrado).
4. **Publicar**:
   - Vía manual (vigente): copiar/pegar en la plataforma en el horario del calendario.
   - Vía Postiz/Browser Use (cuando D-002 lo autorice): WF-04.
5. **Verificar**: abrir la URL publicada; formato correcto, link del CTA funciona.
6. **Registrar**: mover archivo a `content/published/` con `url_publicada, fecha_hora, plataforma, evidencia`.
7. **+7 días**: Analytics registra performance en `content-performance.csv` y compara con `métrica esperada`.

## Checklist de aprobación (humano)

- [ ] ¿Cada afirmación es verificable? (cero testimonios/números inventados)
- [ ] ¿Hook sostiene solo en la primera línea/slide?
- [ ] ¿UN solo CTA, coherente con la oferta publicada y sus precios?
- [ ] ¿Tono según `context/positioning.md`?
- [ ] ¿Consistente con el outreach de la semana (mismo vertical/dolor)?
- [ ] ¿No duplica algo ya publicado?

## Reglas
- Nada sale sin pasar por `approved/`. Sin excepciones "porque es cortito".
- Si la pieza necesita un dato que no llegó (p. ej. patrón semanal del agente), se sustituye por otra del banco — no se inventa el dato.
- Responder comentarios/DMs del post: humano, mismo día.
