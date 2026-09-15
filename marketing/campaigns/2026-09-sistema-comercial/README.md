# Allok — sistema comercial de suscripción y servicios

Preparado el **15 de septiembre de 2026**. Ciclo inicial: **16 de septiembre–15 de octubre**. Estado: propuesta operativa y copy listo para revisión; no se publicaron piezas, enviaron mensajes, activaron anuncios ni modificaron aplicaciones o infraestructura.

## Leer y ejecutar

| Documento | Contenido |
|---|---|
| [Contenido](contenido.md) | Perfil, calendario de 30 días, 12 piezas completas, 4 posts de LinkedIn y stories |
| [Referidos, aliados y ventas](referidos-aliados-ventas.md) | Programa, guiones, calificación, demos, seguimiento, propuesta y continuidad |
| [Anuncios](anuncios.md) | Campaña inicial, presupuesto, 8 anuncios, destino y reglas de decisión |
| [Copy web](copy-web.md) | Home, REI, Vocero, agencia, precios, FAQ y microcopy |
| [Medición y lanzamiento](medicion-lanzamiento.md) | Registro, indicadores, criterios para abrir cada ruta y backlog técnico |

Este paquete reemplaza **para esta campaña** los mensajes de agosto de `marketing/strategy/` y los precios de implementación genéricos de `Vocero-allok/02_estrategia/`. No cambia contratos ni precios de clientes existentes. Las menciones históricas de piloto de USD 899, diagnóstico de USD 150 y soporte de USD 80–150 no se mezclan con la nueva suscripción.

## 1. Diagnóstico: qué hay realmente

Se contrastaron archivos locales, cuatro páginas públicas mediante navegador, inventario de Coolify, configuración del contenedor y consultas agregadas de solo lectura a la base de Vocero. No se inspeccionaron conversaciones privadas ni se enviaron mensajes de prueba.

| Hecho observado | Consecuencia comercial |
|---|---|
| La portada pública presenta Allok como estudio y deriva a REI, Vocero y agencia. La home local, con cambios sin confirmar, presenta el CRM Allok. | Hay dos versiones. El copy nuevo toma como dirección la home local; hasta desplegarla, los enlaces de campaña usan páginas que sí existen y evitan prometer un recorrido de compra nuevo. |
| `/rei` publica Starter USD 29, Growth USD 59 y Pro USD 99/mes. Sus botones abren WhatsApp. | Son precios publicados, no evidencia de suscripciones vendidas ni de autoservicio operativo. |
| `docs/cobros.md`, actualizado hoy, registra ausencia de precios recurrentes en su auditoría de Stripe. El webhook local persiste compras, pero no completa el alta del CRM. | Activar los precios por sí solo no resuelve la entrega. No iniciar campañas de pago directo. No se repitió una consulta a la cuenta Stripe en esta revisión. |
| El código de facturación del CRM reconoce `basic` y `pro`; su pantalla ofrece USD 29 y USD 99. | Falta unificar Starter/Growth/Pro entre web, cobro y permisos. Growth no debe cobrarse como si ya tuviera correspondencia en el CRM. |
| Coolify muestra Vocero y la instancia dedicada de Mística saludables. Vocero responde internamente `200`, `ok:true`, versión 1.3.0, commit `b3cc862`. | Hay producto desplegado e infraestructura de entrega dedicada. Un healthcheck no acredita resultados comerciales. |
| En la instancia `crm.allok.fun`, `ALLOK_SAAS_MODE` y las variables de Stripe SaaS no están configuradas. `whatsapp.allok.fun` no resolvió desde el VPS. | La ruta SaaS compartida descrita en el runbook todavía no está disponible en la infraestructura revisada. |
| El número publicado en la web coincide con la conexión Meta del CRM. Hay mensajes entrantes y salientes recientes, con estados de entrega y lectura. | Hay actividad real, pero esos registros pueden incluir pruebas; no equivalen a clientes, ventas ni una validación realizada hoy. |
| Agente habilitado, lista permitida habilitada con una identidad, instrucciones y reglas de escalado presentes, cero entradas en `kb_entry`. | La invitación pública “pruébalo ahora” no está respaldada para cualquier visitante. Revisar la ruta de atención humana y la información comercial antes de dirigir tráfico. Cero entradas en KB no significa cero instrucciones. |
| Los dos últimos resultados de laboratorio registrados son antiguos: 33 y 50, del 14 de agosto. No hay prueba real aprobada registrada en el perfil consultado. | No usar “agente validado” como prueba comercial. Repetir evaluación con oferta y configuración vigentes; los resultados antiguos tampoco prueban el rendimiento actual. |
| `AGENDA=on`, una configuración de calendario y cero reservas registradas; `ATRIBUCION` sin configurar. | Agenda implementada/configurada, sin reserva real demostrada en esta revisión. No anunciar atribución/CAPI como activa en esta instancia. |
| La pantalla de acceso todavía dice “creativv”. | Alinear el nombre antes de compartir acceso en una demo. |
| El sitio usa “respuesta en 4 s”, “Más elegido”, ejemplos de stock/reserva y una calculadora de costos Meta. | Presentar ejemplos como ejemplos, quitar popularidad no acreditada y no prometer latencia fija. La calculadora usa tarifas comentadas como octubre de 2026: no presentarlas como costo vigente en septiembre. |

**Conclusión:** vender ahora conversaciones de diagnóstico, demos coordinadas y proyectos con alcance; preparar suscripción como ruta de expansión. La automatización de compra necesita verificarse antes de convertirla en promesa pública.

### Fuentes locales principales

- Web: [README](../../../README.md), [planes](../../../src/lib/plans.ts), [cobros](../../../docs/cobros.md), [checkout](../../../src/app/api/stripe/checkout/route.ts), [webhook](../../../src/app/api/stripe/webhook/route.ts).
- VPS: `/Users/ama/projects/work-tools/ssh-c001/docs/operations/projects.md`, `clients.md` y `docs/runbooks/alta-cliente-whatsapp.md`.
- CRM relacionado, localizado desde ese inventario: `/Users/ama/projects/saas/vocero-crm/src/server/saas/billing.ts`, `src/server/readiness.ts`, `src/server/ai/actions.ts`, `src/server/agenda/flag.ts` y `src/server/attribution/flag.ts`. Su checkout local está más adelantado que el commit desplegado; código local no equivale a función publicada.
- Web pública revisada: [home](https://allok.fun), [REI](https://allok.fun/rei), [Vocero](https://allok.fun/vocero), [agencia](https://allok.fun/agencia).

## 2. Posicionamiento y arquitectura de oferta

**Mensaje de marca:** “Del primer mensaje al siguiente paso.”

**Explicación:** “Allok organiza cómo tu negocio recibe consultas, responde y continúa la venta. Puedes empezar con un CRM por suscripción o encargar una solución conectada a tu operación.”

| Oferta | Trabajo que compra el cliente | Ruta | Precio y alcance |
|---|---|---|---|
| Allok CRM | Atención y seguimiento estandarizados en WhatsApp | `/` | Mantener como objetivo los precios publicados 29/59/99; disponibilidad asistida hasta completar el lanzamiento. No inventar prueba gratuita. |
| REI | El mismo CRM aplicado a consultas inmobiliarias | `/rei` | Mismos planes; no crear otra suscripción ni cobrar una “licencia REI” adicional. |
| Vocero | Integrar WhatsApp con reglas y sistemas particulares | `/vocero` | Cotización por alcance. Separar implementación, operación recurrente, terceros y ampliaciones. |
| Agencia | Landing, automatización o una primera versión de software | `/agencia` | Referencias existentes: landing 199; automatización desde 499; web/producto desde 699. El último importe es entrada para una versión acotada, no cualquier SaaS completo. |

**Regla para recomendar:** necesidades estándar → CRM; caso inmobiliario estándar → REI; consulta/escritura en sistemas específicos → Vocero; web o proceso fuera de WhatsApp → agencia. No obligar a quien necesita una landing a comprar un CRM.

La implementación de un proyecto termina con aceptación. La suscripción continúa mientras se presta acceso y servicio. Una instancia dedicada puede tener costos recurrentes aunque el desarrollo se pague una vez: describirlos antes de cobrar.

## 3. A quién vender primero

**Hipótesis de campaña:** Venezuela, empezando por Caracas y relaciones existentes. No es una conclusión de demanda ni de rentabilidad. Primero un mercado; los prospectos entrantes de otros países se atienden sin abrir campañas separadas.

1. **Principal: academias y negocios de servicios con citas/cotizaciones.** Dueño o responsable comercial; reciben preguntas repetidas y existe alguien para continuar la venta. La implementación de Mística aporta experiencia de entrega, sin atribuirle resultados ni utilizar marca/datos privados sin permiso.
2. **Secundario: inmobiliarias con varios asesores.** Ya existe `/rei` y material específico. Validar en conversaciones; no repartir el pequeño presupuesto pagado entre ambos segmentos al inicio.
3. **Comprador de servicio:** reconoce un proceso manual concreto, tiene un decisor y acceso a los sistemas que desea conectar. La complejidad, no el número de empleados, determina la propuesta.

Priorizar demanda existente, próxima acción clara y capacidad de atender oportunidades. No priorizar negocios que esperan que el CRM les consiga demanda por sí solo. Volumen orientativo de calificación: 30 o más consultas semanales, o menor volumen con alto valor por oportunidad; es una hipótesis, no requisito universal.

## 4. Dos recorridos de conversión

```text
Contenido / referidos / aliados / anuncios
               ↓
Página específica o conversación identificada
               ↓
Problema + volumen + sistema actual + siguiente paso
       ┌───────┴────────┐
    Estándar          A medida
       ↓                 ↓
Demo breve         Diagnóstico 15 min
       ↓                 ↓
Plan/alta          Alcance y propuesta
asistida hoy             ↓
       ↓             Anticipo
Primera tarea             ↓
útil verificada     Entrega aceptada
       ↓                 ↓
Uso / renovación    Operación / mejora
       └───────┬─────────┘
            Referido
```

Cuando se complete el circuito SaaS, sustituir demo obligatoria por “Ver planes → crear cuenta → pagar → conectar → activar”. Mantener ayuda opcional. Nunca automatizar solo el cobro y dejar manual/invisible la entrega.

### Oferta de entrada única

**“Revisamos cómo entra una consulta y te mostramos el siguiente paso.”** Diagnóstico gratuito de 15 minutos: un proceso, dos observaciones y recomendación de producto o proyecto. No incluye desarrollo ni auditoría completa. Para SaaS, una demo de 10 minutos basta cuando el caso ya está claro.

## 5. Papel de cada canal

| Canal | Para qué se usa | Cadencia inicial | Conversión buscada |
|---|---|---|---|
| Instagram | Reconocimiento del problema + demostración | 3 piezas/semana; stories derivadas | DM con palabra de la pieza o visita específica |
| LinkedIn del fundador | Confianza técnica/comercial y aliados | 1 post/semana | Diagnóstico o conversación de alianza |
| Referidos | Presentaciones consentidas | 3 solicitudes/semana a contactos pertinentes | Introducción con contexto |
| Aliados | Agencias, gestores de anuncios y desarrolladores con clientes | 3 cuentas nuevas/semana, selección manual | Demo conjunta con un caso real |
| Anuncios Meta | Probar una promesa de atención para servicios | Una campaña, después de verificar destino | Conversación calificada, no clic aislado |

No abrir cuentas independientes para REI y Vocero en este ciclo. Una marca, series identificadas por problema y producto. No operar TikTok, newsletter ni nuevos canales de pago todavía; reutilizar videos en estados propios sin producción extra.

## 6. Calendario comercial de 30 días

| Tramo | Acciones | Entregables y criterio de avance |
|---|---|---|
| 16–18 sep | Revisar ruta humana del número, preparar demo coordinada, cerrar alcance ofertable, registrar línea base | Demo grabada con datos ficticios y dos CTA funcionando; primeras piezas C01–C02 preparadas |
| 19–25 sep | Perfil/bio y piezas iniciales; pedir 3 introducciones; seleccionar 3 aliados; primeras demos | Cada conversación tiene ruta, responsable y próxima fecha; ninguna oferta contradice disponibilidad |
| 26 sep–2 oct | Continuar contenido, 3 referidos y 3 aliados; propuestas; iniciar prueba pagada solo si pasa checklist | Una propuesta real evaluable, registro de objeciones; anuncios con límite de gasto |
| 3–9 oct | Entregas, seguimiento, revisión de interés por segmento | Primera aceptación o activación si hubo venta; sin convertirla en caso de éxito sin medición |
| 10–15 oct | Completar prueba, medir costos/tiempo; pedir referido tras valor recibido | Elegir un segmento y un mensaje para siguiente ciclo; decidir apertura SaaS con pruebas, no con fecha arbitraria |

**Capacidad asumida:** fundador con 10 horas semanales para marketing y venta; entrega técnica presupuestada aparte. Distribución: contenido 3 h, demos/seguimientos 4 h, referidos/aliados 2 h, revisión 1 h. Si la entrega ocupa ese tiempo, reducir nuevas conversaciones antes de acumular compromisos.

**Objetivos de aprendizaje, no previsión:** 12 piezas, 4 posts LinkedIn, 12 solicitudes de introducción y 12 aliados investigados/contactados pertinentemente. Buscar 12 conversaciones calificadas, 6 demos/diagnósticos realizados, 3 propuestas y 1–2 contratos. Para SaaS, medir activaciones pagadas solo después de habilitarlo; no contar interesados como MRR.

## 7. Límites comerciales que deben quedar claros

- “24/7” describe el horario de automatización configurado; no promete soporte humano continuo ni disponibilidad garantizada.
- “Con tu número de siempre” depende de elegibilidad y configuración de coexistencia. Revisarlo antes de ofrecerlo.
- No anunciar 4 segundos, ventas garantizadas, popularidad de un plan, reservas o integración universal sin evidencia.
- La actividad del CRM y la instancia de Mística demuestran operación técnica, no incremento de ventas.
- Las tarifas Meta dependen de categoría, mercado y fecha. No usar la calculadora actual como argumento de ahorro hasta corregirla y verificar la tarifa aplicable.
- Esta revisión desarrolla el plan y los textos; los bloqueos técnicos quedan definidos en [medición y lanzamiento](medicion-lanzamiento.md), sin cambios sobre producción.
