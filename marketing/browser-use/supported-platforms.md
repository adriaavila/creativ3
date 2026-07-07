# Plataformas soportadas

Estado de autorización por plataforma. **Ninguna automatización corre sobre una plataforma en estado `no_autorizada`.** El dueño (fundador) cambia el estado aquí, con fecha.

| Plataforma | Uso previsto | Estado | Autorizada por / fecha | Límites conocidos | Notas |
|---|---|---|---|---|---|
| Web pública (sitios de negocios, directorios, Google Maps) | Investigación de leads y competidores (solo lectura) | **autorizada** | Implícita — datos públicos, solo lectura | Respetar robots/ritmo | Sin login; registrar fuentes |
| servicioscreativos.online | Verificar enlaces, formularios, páginas publicadas | **autorizada** | Sitio propio | — | Solo lectura/verificación |
| Vercel Analytics | Recolección semanal de métricas | pendiente_autorizacion | — | Requiere sesión del dueño | Alternativa: export manual del dueño |
| Instagram (cuenta creativv) | Cargar borradores/publicar aprobados; leer stats y comentarios | **no_autorizada** (pendiente decisión D-002) | — | Automatización agresiva → bloqueo; usar con extrema moderación | Considerar Postiz (ya integrado en growth agent) como vía oficial |
| LinkedIn (perfil fundador) | Publicar aprobados; leer stats | **no_autorizada** (pendiente D-002) | — | Muy sensible a automatización; preferir publicación manual o Postiz | |
| X | Publicar aprobados | **no_autorizada** | — | — | Canal en pausa en Fase 1 |
| Postiz (si configurado) | Encolar borradores programados para revisión | pendiente_verificacion | — | — | El subagente `content` del growth agent ya encola aquí; verificar credenciales activas |
| WhatsApp | — | **prohibida para automatización de envío** | — | Riesgo de ban + confianza | Envío siempre humano |

## Procedimiento para autorizar una plataforma

1. El fundador escribe aquí: estado `autorizada`, fecha, alcance ("solo publicar", "solo leer stats").
2. Se documenta el workflow en `workflows.md`.
3. Primera corrida en modo seguro (dry-run) con el fundador disponible.
4. Registro en `execution-log.md`.
