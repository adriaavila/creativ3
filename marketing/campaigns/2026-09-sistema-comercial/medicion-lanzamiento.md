# Medición, lanzamiento y siguientes decisiones

## 1. Una fuente de verdad comercial

Usar el panel `/ops/growth` existente para oportunidades si cubre los campos; completar manualmente en la hoja/CSV actual lo que falte. No construir otro CRM para lanzar esta campaña.

Campos mínimos: empresa/contacto, fecha, origen inicial, pieza/anuncio, referente si existe, ruta CRM/REI/Vocero/agencia, necesidad, estado, responsable, próxima acción/fecha, valor propuesto, cobrado, fecha de activación/aceptación y motivo de pérdida. No almacenar datos privados en enlaces UTM.

**Etapas:** nueva → conversación → calificada → demo/diagnóstico agendado → realizado → oferta → ganado/perdido. Separar luego activación SaaS y entrega de proyecto. “Ganado” requiere contratación y cobro confirmado según la oferta, no intención verbal.

Un contacto puede comprar un proyecto y después suscripción; registrar ingresos separados sin duplicar la persona como dos nuevos clientes adquiridos en la misma medición.

## 2. Convención de origen

Campaña: `allok_202609`. Valores:

| Canal | source | medium | content |
|---|---|---|---|
| Instagram | instagram | organic_social | c01…c12 o bio |
| LinkedIn | linkedin | organic_social | l01…l04 |
| Meta Ads | meta | paid_social | ad01…ad08 |
| Referido | referral | referral | código interno sin datos personales |
| Aliado | partner | referral | código interno del aliado |

Ejemplo: `https://allok.fun/rei?utm_source=instagram&utm_medium=organic_social&utm_campaign=allok_202609&utm_content=c05`.

La web no demuestra hoy persistencia de UTMs hasta cobro. Guardar el origen cuando empieza la conversación; preguntar “¿Cómo llegaste a Allok?” si se perdió. Registrar el origen inicial y el canal que ayudó al cierre en campos distintos. Un código escrito en WhatsApp es apoyo, no atribución infalible.

## 3. Indicadores y denominadores

| Indicador | Cálculo / criterio |
|---|---|
| Conversaciones calificadas | Problema reconocido + responsable/decisor + siguiente paso aceptado |
| Tasa de calificación | Calificadas ÷ conversaciones iniciadas, misma cohorte/canal |
| Asistencia | Demos realizadas ÷ demos cuya fecha ya pasó |
| Conversión a oferta | Ofertas enviadas ÷ demos realizadas |
| Cierre | Contratos con cobro confirmado ÷ ofertas con plazo de decisión vencido o resueltas; informar pendientes aparte |
| Costo por calificada | Gasto de canal ÷ calificadas atribuibles |
| CAC | Medios + comisiones + herramientas de captación + costo de tiempo comercial, dividido entre clientes nuevos pagos |
| Activación SaaS | Cuenta y canal conectados + configuración aprobada + primer recorrido útil verificado |
| Tiempo de activación | Desde pago/contratación hasta primera activación; indicar bloqueos por accesos |
| MRR | Valor mensual de suscripciones activas de pago; excluye proyectos, anticipos y solicitudes |
| Cancelación de clientes | Suscriptores cancelados del periodo ÷ suscriptores activos al inicio; no informar porcentaje sin base |
| Entrega de servicio | Trabajo aceptado conforme al alcance, con saldo y continuidad registrados por separado |
| Margen de proyecto | Honorarios menos horas de entrega valoradas, costos variables y comisiones |

Si el denominador es cero, escribir “sin base”; no 0% ni infinito. No calcular LTV confiable con una cohorte nueva ni inferir ROI del número de mensajes.

## 4. Revisión semanal — viernes

Completar la scorecard existente en `marketing/analytics/weekly-scorecard.md`, añadiendo ruta de oferta y activación/aceptación. Esta revisión no cargó datos ni reescribió métricas históricas.

| Canal | Actividad | Conversaciones | Calificadas | Demos realizadas | Ofertas | Clientes pagos | Cobrado | Gasto |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Contenido | — | — | — | — | — | — | — | — |
| Referidos | — | — | — | — | — | — | — | — |
| Aliados | — | — | — | — | — | — | — | — |
| Anuncios | — | — | — | — | — | — | — | — |

Debajo: MRR nuevo, activaciones, proyectos aceptados, horas de soporte y motivos de pérdida. Usar cifras reales, no rellenar con los objetivos del plan.

**Decidir una mejora por semana:**

- Visitas sin conversación: revisar CTA y claridad de la oferta.
- Conversaciones sin encaje: revisar segmento y promesa.
- Demos sin oferta: revisar calificación y capacidades.
- Ofertas sin cierre: revisar motivo real: confianza, precio, prioridad, alcance o decisión.
- Pago sin activación: resolver entrega antes de captar más compras.
- Activación sin uso: revisar el primer trabajo útil y acompañamiento.

## 5. Condiciones para lanzar cada ruta

### A. Contenido y demo coordinada

- [ ] Un visitante fuera de la lista de prueba puede iniciar conversación y una persona recibe/responde.
- [ ] Hay responsable y bloques de atención definidos.
- [ ] Demo grabada o supervisada de conversación, ficha y pase a humano, con datos ficticios.
- [ ] El texto no promete prueba inmediata ni alta automática.
- [ ] El origen y próximo paso quedan registrados.

Puede lanzarse esta ruta sin desplegar todo el SaaS. Si el número no llega al responsable, corregir el canal de contacto antes de publicar CTA hacia él.

### B. Demo pública automatizada

- [ ] Preparar información comercial actual: planes/disponibilidad, diferencia CRM/Vocero/agencia y costos.
- [ ] Definir con intención el acceso del público: no quitar la lista restringida como un arreglo improvisado.
- [ ] Evaluación actual del laboratorio ≥80/100 y cero hallazgos críticos según la regla del producto.
- [ ] Prueba externa del número público: pregunta normal, dato desconocido, precio, petición de humano y fuera de horario.
- [ ] Si se muestra agenda, verificar el evento en destino y qué sucede sin disponibilidad.
- [ ] Confirmar que una cancelación/reintento no duplica reservas o acciones.

La revisión actual no ejecutó estas pruebas ni alteró el agente. Los resultados de agosto no sustituyen una evaluación nueva.

### C. Anuncios de conversaciones

- [ ] Cumplir A; usar B solo si el anuncio promete interacción automática inmediata.
- [ ] Destino y texto prellenado revisados desde móvil.
- [ ] Presupuesto disponible y límite efectivo definidos; USD 250 es escenario, no gasto ejecutado.
- [ ] Anuncios, landing y agente cuentan la misma oferta.
- [ ] Registrar manualmente al menos el origen y la calificación si no existe atribución automática.
- [ ] Comprobar una conversación de ensayo con el responsable antes de invertir.

### D. Suscripción de autoservicio

No basta con crear tres precios en Stripe.

1. **Catálogo unificado:** Starter/Growth/Pro de web, identificadores de Stripe, nombres internos y permisos. Resolver que el CRM solo reconoce Basic/Pro y que los números/usuarios publicados no coinciden. La dirección comercial mantiene 29/59/99; habilitar cada plan cuando su alcance exista.
2. **Un circuito de facturación:** reutilizar la implementación de organizaciones y facturación del CRM; definir qué endpoint recibe y aplica cada evento. Evitar una compra guardada solo en Allok sin acceso en Vocero. No crear dos suscripciones para el mismo cliente.
3. **Instancia y dominio SaaS:** configurar y publicar la ruta compartida documentada; verificar acceso público y aislamiento entre organizaciones.
4. **Compra → entrega:** cuenta, plan, recibo correcto, siguiente paso y recuperación si la persona cierra la ventana. Un recibo de anticipo de proyecto no debe enviarse como confirmación SaaS.
5. **Meta → CRM:** guardar credenciales en el destino antes de redirigir eventos; conexión/reintento y elegibilidad verificados según runbook.
6. **Ciclo de vida:** renovación, pago fallido, cambio de plan y cancelación ajustan permisos y automatización conforme a condiciones comunicadas.
7. **Primer valor:** un nuevo usuario completa el recorrido y entiende qué hacer sin intervención no anunciada del fundador.

**Pruebas mínimas antes de abrir:** compra en modo prueba; evento duplicado sin duplicar alta; webhook tardío; pago fallido; cancelación al final del periodo; límites de plan; separación de dos cuentas; conexión interrumpida y recuperada; primer mensaje y pase a humano. Ejecutar pruebas financieras primero en entorno de prueba. No cobrar una tarjeta real para demostrar el circuito sin una compra autorizada.

Estas son tareas de lanzamiento identificadas, no implementadas como parte del encargo comercial.

## 6. Correcciones de copy y orden de implementación

| Prioridad | Acción | Responsable sugerido | Done |
|---|---|---|---|
| P0 | Sustituir “pruébalo ahora” por demo coordinada | Fundador/web | CTA coherente con atención real |
| P0 | Confirmar la atención del número fuera de la lista | Operación | Recepción y respuesta humana verificadas |
| P0 | Unificar la explicación de oferta entre páginas, perfiles y demo | Comercial | Sin mezclar precios históricos de implementación con SaaS |
| P1 | Aplicar copy preparado en las cuatro páginas | Web | Enlaces revisados en móvil, ejemplos rotulados, condiciones visibles |
| P1 | Revisar calculadora Meta | Web/comercial | Tarifas oficiales con fecha/mercado/categoría o bloque informativo sin cifras |
| P1 | Preparar demo y repetir evaluación actual | Producto | Prueba útil con límites y humano |
| P1 | Alinear identidad “creativv” del acceso | Producto | Nombre consistente con la instancia ofrecida |
| P2 | Completar D: alta SaaS | Producto/facturación | Circuito completo y pruebas anteriores |
| P2 | Activar atribución si se necesita y verificarla | Producto/marketing | Evento recibido y deduplicado; no solo bandera activa |

Las rutas y componentes de la web ya existen; el trabajo editorial no requiere rediseñar la página ni añadir dependencias. Respetar los cambios locales que ya había al iniciar la revisión.

## 7. Plantilla de evidencia para un caso real

Empresa/permiso: [registro]. Periodo anterior y posterior: [fechas comparables]. Proceso intervenido: [uno]. Volumen de consultas: [n]. Tiempo de primera respuesta: [mediana y muestra]. Próximos pasos: [n/denominador]. Citas realizadas: [n]. Ventas registradas: [n, si existen]. Otros cambios simultáneos: [campaña, equipo, precio].

Publicar “observamos” y explicar límites; no atribuir toda mejora al producto si también cambió la captación o la oferta. Sin resultados medidos, publicar una demo o explicación de implementación, no un caso de éxito.

## 8. Resultado esperado al día 30

Un mensaje que haya generado conversaciones pertinentes, un segmento prioritario con evidencia, propuestas y cobros registrados, y una decisión fundada sobre la apertura SaaS. Si no hay ventas, conservar el aprendizaje y corregir el cuello de botella; producir otras 30 piezas sin revisar el recorrido no es la siguiente acción por defecto.
