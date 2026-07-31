# Embudo de adquisición

```
Contenido / Prospección → Visita → Interacción → Lead → Conversación → Diagnóstico/Demo → Piloto → Cliente → Referido
```

Para cada etapa: acción esperada, responsable, datos, métrica, criterio de avance, automatización posible y punto de aprobación humana.

## Etapas

### 1. Contenido / Prospección (top)
- **Acción esperada:** el ICP ve un post con su dolor, o recibe un DM personalizado.
- **Responsable:** Content Creator + Outreach Agent (preparan); humano publica/envía.
- **Datos:** pieza publicada (URL) o mensaje enviado (lead, canal, fecha).
- **Métrica:** piezas publicadas/sem; mensajes enviados/día.
- **Avance →:** clic al perfil/sitio o respuesta.
- **Automatización:** investigación y borradores (growth agent, ya operativo); publicación asistida (Browser Use, con aprobación).
- **Aprobación humana:** SIEMPRE antes de publicar o enviar.

### 2. Visita
- **Acción:** entra a servicioscreativos.online o al perfil IG/LinkedIn.
- **Responsable:** sitio + perfiles (assets pasivos).
- **Datos:** Vercel Analytics (páginas, referrers); visitas a perfil (stats nativas).
- **Métrica:** visitas/sem; % que llega a `/cotizar` o página vertical.
- **Avance →:** clic en CTA de WhatsApp o formulario.
- **Automatización:** recolección semanal de analytics (Browser Use / API).
- **Aprobación:** no requiere.

### 3. Interacción
- **Acción:** clic en wa.me, comentario, DM entrante, respuesta a outbound.
- **Responsable:** humano responde en <2h hábiles; Outreach Agent sugiere respuesta.
- **Datos:** registro en `outreach/conversations.md` (origen, canal, primer mensaje).
- **Métrica:** interacciones/sem; tasa de respuesta del outbound.
- **Avance →:** el prospecto revela dolor o pide info ⇒ es Lead.
- **Automatización:** clasificación de intención y borrador de respuesta.
- **Aprobación:** humano envía toda respuesta.

### 4. Lead
- **Acción:** prospecto con dolor identificado + capacidad aparente. Score en `outreach/lead-qualification.md`.
- **Responsable:** Lead Research Agent (score) + humano (valida).
- **Datos:** fila completa en `outreach/lead-database.csv` (fuente, dolor, score, canal).
- **Métrica:** leads calificados/sem (score ≥ 6).
- **Avance →:** acepta conversación de descubrimiento.
- **Automatización:** ya operativa (growth agent persiste leads con evidencia URL).
- **Aprobación:** no requiere (solo datos públicos).

### 5. Conversación
- **Acción:** intercambio real sobre su negocio (call o chat largo). Script: 2 preguntas de `playbooks/contact-leads.md`.
- **Responsable:** humano (fundador). El agente prepara contexto del lead.
- **Datos:** notas en `outreach/conversations.md`: dolor, presupuesto, urgencia, objeción.
- **Métrica:** conversaciones/sem; % conversación→oferta hecha.
- **Avance →:** acepta diagnóstico (USD 150) o pide propuesta.
- **Automatización:** propuesta borrador (modo proposal del growth agent, ya existe).
- **Aprobación:** toda propuesta la revisa y envía el humano.

### 6. Diagnóstico / Demo
- **Acción:** paga USD 150; recibe auditoría + 10 quick wins + roadmap en 48h (plantilla en `.docs/mkt/diagnostico-express-template.md`).
- **Responsable:** humano entrega; agente pre-llena investigación.
- **Datos:** fecha venta, fecha entrega, hallazgos, recomendación de sprint.
- **Métrica:** diagnósticos vendidos/mes; % diagnóstico→piloto.
- **Avance →:** acepta piloto/sprint en ≤14 días (los 150 se acreditan).
- **Automatización:** borrador de diagnóstico desde evidencia del lead.
- **Aprobación:** entrega final siempre humana.

### 7. Piloto
- **Acción:** proyecto 14 días (intake WhatsApp, landing, automatización). 50% anticipo.
- **Responsable:** humano construye (con sus herramientas de dev).
- **Datos:** alcance, fechas, anticipo, métrica de éxito acordada ANTES de empezar.
- **Métrica:** pilotos activos; % piloto→cliente recurrente.
- **Avance →:** en vivo + métrica de éxito cumplida + saldo pagado.
- **Aprobación:** contrato/alcance siempre humano.

### 8. Cliente
- **Acción:** paga saldo; se define continuidad (retainer/siguiente sprint).
- **Datos:** ingreso registrado en scorecard; números del caso (con permiso).
- **Métrica:** clientes/mes, ingreso/mes, LTV proyectado.
- **Avance →:** testimonio + case study + pedido de referido.
- **Aprobación:** publicación del caso requiere permiso escrito del cliente.

### 9. Referido
- **Acción:** cliente satisfecho presenta 1–2 contactos (incentivo: 10% del primer proyecto referido — **needs approval D-004**).
- **Métrica:** referidos/cliente; % referido→cliente.
- **Automatización:** recordatorio de pedir referido 30 días post-entrega (follow-up del agente).

## Tasas objetivo iniciales (hipótesis de `.docs/mkt/5-client-confidence-plan.md`)

```
outbound → respuesta        8%
respuesta → conversación   45%
conversación → diagnóstico 35%
diagnóstico → piloto       35%
```

Se recalibran cada viernes con datos reales en `analytics/weekly-scorecard.md`. Si tras 100 mensajes una tasa real está a <50% de la hipótesis, es bloqueo prioritario para el Optimization Agent.
