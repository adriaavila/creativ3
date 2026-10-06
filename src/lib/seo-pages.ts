/**
 * Las páginas de búsqueda de allok: comparaciones con otros CRM de WhatsApp
 * (`/alternativa-a/*`) y una página por tipo de negocio (`/whatsapp-para/*`).
 *
 * Todo el texto vive aquí, tipado, para que la prueba (`seo-pages.test.ts`)
 * pueda exigir lo mínimo a cada página: título y descripción que caben en un
 * resultado de búsqueda, tres preguntas como mínimo y un botón.
 *
 * Reglas del contenido:
 *
 * - **Nada inventado.** Ni clientes, ni testimonios, ni cifras de resultados.
 *   Lo de allok sale de `plans.ts` y de la portada; lo de la competencia, sólo
 *   de la fuente citada al lado de cada dato. Si un dato no se puede sostener
 *   con precisión, no va.
 * - **Los precios de allok no se escriben a mano**: salen de `PLANS` y de
 *   `SETUP_SERVICE`, para que no se queden viejos cuando cambien.
 * - **No se promete un tiempo de respuesta fijo.**
 * - **La prueba gratis no se menciona** mientras la web no la ofrezca
 *   (Adrian, 2026-10-05: `trialDays` fuera de Completo). Si vuelve, la nota
 *   bajo el botón aparece sola por `trialNote`.
 * - Los ejemplos de conversación van rotulados como ejemplo en la página.
 */

import type { Metadata } from "next";
import { PLANS, SETUP_SERVICE, planCta, trialNote } from "@/lib/plans";

/** La fecha que se muestra junto a los precios de terceros. */
export const COMPETITOR_PRICES_CHECKED = "Precios consultados en octubre de 2026";

const COMPLETO = PLANS.find((p) => p.appPlan === "pro")!;
const PRICE = `US$${COMPLETO.price}`;
const SETUP = `US$${SETUP_SERVICE.price}`;

export type Faq = { q: string; a: string };

/** A dónde manda el botón principal: el registro (o WhatsApp sin autoservicio) o REI. */
export type CtaKind = "signup" | "rei";

type PageBase = {
  slug: string;
  /** Sin el « | allok» que agrega la plantilla del layout. */
  title: string;
  description: string;
  h1: string;
  kicker: string;
  lede: string;
  faqs: Faq[];
  cta: CtaKind;
};

export type ComparisonRow = { label: string; allok: string; them: string };

export type ComparisonPage = PageBase & {
  kind: "comparison";
  competitor: string;
  rows: ComparisonRow[];
  /** De dónde salen los datos del otro lado de la tabla. */
  source: { label: string; url: string };
  /** Cuándo conviene el otro. Justo, sin letra chica. */
  pickThem: string[];
};

export type ChatLine = { from: "cliente" | "allok"; text: string };

export type VerticalPage = PageBase & {
  kind: "vertical";
  sector: string;
  questions: string[];
  /** Una conversación de ejemplo. No es de ningún cliente. */
  example: ChatLine[];
  does: { title: string; body: string }[];
};

export type SeoPage = ComparisonPage | VerticalPage;

/** Lo que trae allok, igual en las tres comparaciones. */
export const ALLOK_INCLUDES: string[] = [
  "Un agente de IA que contesta, califica y agenda citas en tu WhatsApp",
  "Una bandeja con toda la conversación y la ficha de cada cliente",
  "Tus ventas en etapas, de la consulta al cliente",
  "Tu número de siempre: sigues usando la app de WhatsApp Business",
  "Tú decides cuándo se activa el agente, y se apaga igual de fácil",
  `${PRICE} al mes, precio fijo. Mensual: cancelas cuando quieras`,
];

const SHARED_PRICE_FAQ: Faq = {
  q: "¿Quién me cobra los mensajes de WhatsApp?",
  a: `Meta, directo a tu empresa y a su tarifa. La cuenta de WhatsApp queda a tu nombre; allok cobra el software (${PRICE} al mes) y nunca le suma nada a los mensajes.`,
};

const SHARED_SETUP_FAQ: Faq = {
  q: "¿Lo puedo dejar andando sin hacerlo yo?",
  a: `Sí. La puesta en marcha cuesta desde ${SETUP}, una sola vez: cargamos tu agente con tus precios y servicios, armamos tus etapas de venta y conectamos WhatsApp con Meta de punta a punta.`,
};

export const COMPARISONS: ComparisonPage[] = [
  {
    kind: "comparison",
    slug: "kommo",
    competitor: "Kommo",
    title: "Alternativa a Kommo para WhatsApp",
    description: `allok frente a Kommo: un agente de IA que contesta y agenda en tu WhatsApp, por ${PRICE} al mes fijos, sin cobro por usuario ni pagos por seis meses.`,
    h1: "Alternativa a Kommo para WhatsApp",
    kicker: "Comparación · allok y Kommo",
    lede: "Kommo es un CRM que se cobra por usuario. allok es un agente de IA y una bandeja para WhatsApp, con un solo precio para todo el equipo. Aquí está la diferencia en números.",
    // Fuente: https://www.kommo.com/blog/kommo-pricing/ (consultada en octubre de 2026):
    // desde US$25 por usuario al mes, facturado en periodos mínimos de 6 meses, 14 días de prueba.
    source: { label: "kommo.com", url: "https://www.kommo.com/blog/kommo-pricing/" },
    rows: [
      { label: "Precio publicado", allok: `${PRICE} al mes, fijo`, them: "Desde US$25 por usuario al mes" },
      { label: "Con 3 personas", allok: `${PRICE} al mes`, them: "Desde US$75 al mes" },
      { label: "Con 5 personas", allok: `${PRICE} al mes`, them: "Desde US$125 al mes" },
      { label: "Cómo se paga", allok: "Mes a mes. Cancelas cuando quieras", them: "Por periodos de 6 meses como mínimo" },
    ],
    pickThem: [
      "Tienes una o dos personas vendiendo: a US$25 por usuario, Kommo sale más barato que allok, siempre que te sirva pagar seis meses por adelantado.",
      "Quieres probar antes de pagar: Kommo da 14 días de prueba.",
      "Ya trabajas en Kommo y tu equipo lo usa a diario. Cambiar a mitad de un periodo pagado rara vez compensa.",
      "Necesitas más que WhatsApp. allok se dedica a WhatsApp y no pretende ser un CRM para todo.",
    ],
    faqs: [
      {
        q: "¿Cuánto cuesta allok frente a Kommo?",
        a: `allok cuesta ${PRICE} al mes, sin importar cuántas personas usen la bandeja. Kommo publica precios desde US$25 por usuario al mes, cobrados en periodos de seis meses como mínimo. Con cuatro personas o más, allok sale igual o más barato.`,
      },
      {
        q: "¿Tengo que pagar seis meses por adelantado en allok?",
        a: "No. allok se paga mes a mes y cancelas cuando quieras.",
      },
      {
        q: "¿Pierdo mi número o la app de WhatsApp Business?",
        a: "No. Conectas tu número de siempre a través de Meta y sigues usando la app de WhatsApp Business en tu teléfono.",
      },
      SHARED_PRICE_FAQ,
      SHARED_SETUP_FAQ,
    ],
    cta: "signup",
  },
  {
    kind: "comparison",
    slug: "leadsales",
    competitor: "Leadsales",
    title: "Alternativa a Leadsales para WhatsApp",
    description: `allok frente a Leadsales: agente de IA, bandeja y etapas de venta para tu WhatsApp por ${PRICE} al mes, con la conexión oficial de Meta incluida.`,
    h1: "Alternativa a Leadsales para WhatsApp",
    kicker: "Comparación · allok y Leadsales",
    lede: `Leadsales separa su plan de entrada del plan con la API de WhatsApp. En allok la conexión oficial con Meta viene en el mismo precio: ${PRICE} al mes, con un agente de IA que contesta y agenda.`,
    // Fuente: https://www.eligetucrm.com/blog/leadsales-precios-2026 (consultada en octubre de 2026):
    // cerca de US$84 al mes con 3 usuarios, plan con API de WhatsApp cerca de US$133, prueba pagada de US$7 por 14 días.
    source: { label: "eligetucrm.com", url: "https://www.eligetucrm.com/blog/leadsales-precios-2026" },
    rows: [
      { label: "Plan de entrada", allok: `${PRICE} al mes`, them: "Cerca de US$84 al mes, con 3 usuarios" },
      { label: "Con la API oficial de WhatsApp", allok: `Incluida en los ${PRICE}`, them: "Cerca de US$133 al mes" },
    ],
    pickThem: [
      `No necesitas la API oficial de WhatsApp y te alcanza su plan de entrada: cerca de US$84 al mes es menos que ${PRICE}.`,
      "Quieres probar 14 días antes de comprometerte: Leadsales ofrece una prueba por US$7.",
      "Tu equipo ya trabaja en Leadsales y está contento. Mudarse tiene un costo aunque el software sea más barato.",
    ],
    faqs: [
      {
        q: "¿La API oficial de WhatsApp tiene costo aparte en allok?",
        a: `No. Conectas tu número a través de Meta y eso viene en los ${PRICE} al mes. Lo único aparte son los mensajes, que te cobra Meta a su tarifa.`,
      },
      {
        q: "¿allok trae agente de IA?",
        a: "Sí. Contesta con lo que de verdad vendes, pregunta lo necesario para calificar y agenda la cita. Tú decides cuándo se activa y entras cuando quieras.",
      },
      {
        q: "¿Puedo seguir usando mi número?",
        a: "Sí. Es tu número de siempre, y sigues usando la app de WhatsApp Business en tu teléfono.",
      },
      SHARED_PRICE_FAQ,
      SHARED_SETUP_FAQ,
    ],
    cta: "signup",
  },
  {
    kind: "comparison",
    slug: "wati",
    competitor: "Wati",
    title: "Alternativa a Wati para WhatsApp",
    description: `allok frente a Wati: el agente de IA viene incluido en ${PRICE} al mes y Meta te cobra los mensajes a su tarifa, sin recargo sobre cada conversación.`,
    h1: "Alternativa a Wati para WhatsApp",
    kicker: "Comparación · allok y Wati",
    lede: "Con Wati, el agente de IA es un complemento aparte y los mensajes llevan un recargo sobre la tarifa de Meta. En allok el agente viene incluido y los mensajes te los cobra Meta directo.",
    // Fuente: https://costbench.com/software/live-chat/wati/ (consultada en octubre de 2026):
    // US$69 al mes pagando mes a mes, agente de IA como complemento de cerca de US$100 al mes,
    // cerca de 20% de recargo sobre la tarifa de mensajes de Meta, 7 días de prueba.
    source: { label: "costbench.com", url: "https://costbench.com/software/live-chat/wati/" },
    rows: [
      { label: "Mensualidad", allok: `${PRICE} al mes`, them: "US$69 al mes, pagando mes a mes" },
      { label: "Agente de IA", allok: "Incluido", them: "Complemento de cerca de US$100 al mes" },
      { label: "Con agente de IA", allok: `${PRICE} al mes`, them: "Cerca de US$169 al mes" },
      { label: "Mensajes de WhatsApp", allok: "Tarifa de Meta, sin recargo", them: "Cerca de 20% sobre la tarifa de Meta" },
    ],
    pickThem: [
      `No quieres un agente de IA, sólo una bandeja: US$69 al mes es menos que ${PRICE}.`,
      "Quieres probar antes de pagar: Wati da 7 días de prueba.",
      "Ya tienes tus flujos armados en Wati y te funcionan. Rehacerlos lleva tiempo.",
    ],
    faqs: [
      {
        q: "¿allok cobra recargo sobre los mensajes de WhatsApp?",
        a: "No. La cuenta de WhatsApp queda a nombre de tu empresa y Meta te factura los mensajes directo, a su tarifa. allok cobra sólo el software.",
      },
      {
        q: "¿El agente de IA cuesta aparte?",
        a: `No. El agente que contesta, califica y agenda viene en los ${PRICE} al mes.`,
      },
      {
        q: "¿Tengo que cambiar de número?",
        a: "No. Conectas tu número de siempre a través de Meta y sigues usando la app de WhatsApp Business.",
      },
      SHARED_SETUP_FAQ,
    ],
    cta: "signup",
  },
];

/** Las preguntas que se repiten en todos los sectores. */
const ACTIVATE_FAQ: Faq = {
  q: "¿El agente empieza a contestar solo apenas lo conecto?",
  a: "No. Primero le cuentas tu negocio y lo pruebas escribiéndole tú. Se activa cuando tú lo decides, y se apaga igual de fácil.",
};

const HANDOFF_FAQ: Faq = {
  q: "¿Qué pasa con lo que el agente no sabe?",
  a: "Contesta con lo que tú le cargaste. Lo que necesita a una persona queda marcado en la bandeja para que entres tú.",
};

export const VERTICALS: VerticalPage[] = [
  {
    kind: "vertical",
    slug: "clinicas-esteticas",
    sector: "Clínicas estéticas",
    title: "WhatsApp para clínicas estéticas con agente de IA",
    description: `Un agente de IA en el WhatsApp de tu clínica estética: contesta precios y duración de cada tratamiento y agenda la hora. ${PRICE} al mes.`,
    h1: "WhatsApp para clínicas estéticas",
    kicker: "allok para clínicas estéticas",
    lede: "¿Cuánto sale, cuánto dura y cuándo hay hora? allok contesta eso en tu WhatsApp con tus precios reales, pregunta lo necesario y agenda la cita.",
    questions: [
      "¿Cuánto sale el tratamiento?",
      "¿Cuánto dura cada sesión y cuántas necesito?",
      "¿Cuándo hay hora esta semana?",
      "¿Dónde están y tienen estacionamiento?",
      "¿Tengo que ir con alguna preparación?",
    ],
    example: [
      { from: "cliente", text: "Hola, ¿cuánto sale la limpieza facial?" },
      { from: "allok", text: "Hola. La limpieza facial profunda cuesta $45 y dura una hora. ¿Es tu primera vez con nosotros?" },
      { from: "cliente", text: "Sí. ¿Tienen hora el jueves en la tarde?" },
      { from: "allok", text: "El jueves quedan las 16:00 y las 17:30. ¿Cuál te reservo?" },
      { from: "cliente", text: "Las 17:30" },
      { from: "allok", text: "Listo, jueves a las 17:30. Te llega la confirmación por aquí. Ven sin maquillaje, si puedes." },
    ],
    does: [
      { title: "Contesta con tus precios", body: "Le cargas tus tratamientos, precios y duraciones. Responde con eso, no con lo que se imagina." },
      { title: "Agenda la hora", body: "Ofrece los horarios libres y deja la cita confirmada en la agenda." },
      { title: "Te pasa lo delicado", body: "Lo que pide criterio de un profesional queda marcado para que entres tú." },
      { title: "Todo en una bandeja", body: "Cada conversación, con la ficha de la clienta y su historial, para todo tu equipo." },
    ],
    faqs: [
      {
        q: "¿El agente da recomendaciones de tratamiento?",
        a: "Contesta con la información que tú le cargas: precios, duración, preparación. Lo que pide una evaluación profesional te lo pasa a ti.",
      },
      ACTIVATE_FAQ,
      HANDOFF_FAQ,
      SHARED_PRICE_FAQ,
    ],
    cta: "signup",
  },
  {
    kind: "vertical",
    slug: "clinicas-dentales",
    sector: "Clínicas dentales",
    title: "WhatsApp para clínicas dentales con agente de IA",
    description: `Un agente de IA en el WhatsApp de tu clínica dental: contesta qué atienden y cuánto sale la consulta, y agenda la hora. ${PRICE} al mes, precio fijo.`,
    h1: "WhatsApp para clínicas dentales",
    kicker: "allok para clínicas dentales",
    lede: "¿Atienden esto, cuánto sale la consulta y cuándo hay hora? allok responde en tu WhatsApp con la información de tu clínica y deja la cita agendada.",
    questions: [
      "¿Cuánto sale la consulta de evaluación?",
      "¿Hacen limpiezas, blanqueamiento u ortodoncia?",
      "¿Cuándo hay hora con la doctora?",
      "¿Qué formas de pago aceptan?",
      "¿Dónde quedan y en qué horario atienden?",
    ],
    example: [
      { from: "cliente", text: "Buenas, ¿hacen limpieza dental?" },
      { from: "allok", text: "Hola. Sí, la limpieza con evaluación cuesta $40. ¿Quieres que te busque una hora?" },
      { from: "cliente", text: "Sí, ¿el lunes en la mañana?" },
      { from: "allok", text: "El lunes hay a las 9:00 y a las 11:30. ¿Te sirve alguna?" },
      { from: "cliente", text: "A las 9" },
      { from: "allok", text: "Agendado: lunes a las 9:00. Si te duele algo antes, cuéntame y le aviso a la clínica." },
    ],
    does: [
      { title: "Contesta lo de siempre", body: "Servicios, precios de consulta, horarios, formas de pago y cómo llegar, con lo que tú le cargas." },
      { title: "Agenda la hora", body: "Ofrece los horarios libres y confirma la cita sin que nadie tenga que estar en el teléfono." },
      { title: "Lo clínico, a una persona", body: "Le indicas que un dolor o una urgencia los vea alguien de tu equipo, y quedan marcados en la bandeja." },
      { title: "Todo en una bandeja", body: "Cada paciente con su conversación y su ficha, a la vista de todo el equipo." },
    ],
    faqs: [
      {
        q: "¿El agente da diagnósticos?",
        a: "No es su trabajo. Le cargas lo administrativo (servicios, precios, horarios) y le indicas que cualquier consulta clínica la pase a una persona: queda marcada en la bandeja para que entre alguien de tu equipo.",
      },
      ACTIVATE_FAQ,
      HANDOFF_FAQ,
      SHARED_PRICE_FAQ,
    ],
    cta: "signup",
  },
  {
    kind: "vertical",
    slug: "academias",
    sector: "Academias y cursos",
    title: "WhatsApp para academias y cursos con agente de IA",
    description: `Un agente de IA en el WhatsApp de tu academia: contesta si queda cupo, cuándo empieza el curso y cuánto cuesta, y anota a quien quiere entrar. ${PRICE} al mes.`,
    h1: "WhatsApp para academias y cursos",
    kicker: "allok para academias y cursos",
    lede: "¿Queda cupo, cuándo empieza y cómo reservo? allok contesta en tu WhatsApp con tus cursos reales y deja a cada interesado anotado en sus etapas.",
    questions: [
      "¿Queda cupo en el curso?",
      "¿Cuándo empieza y qué días son las clases?",
      "¿Cuánto cuesta y se puede pagar en cuotas?",
      "¿Es presencial u online?",
      "¿Necesito saber algo antes de empezar?",
    ],
    example: [
      { from: "cliente", text: "Hola, ¿queda cupo para el curso de inglés de los sábados?" },
      { from: "allok", text: "Hola. Sí, quedan cupos en el grupo de los sábados de 10:00 a 12:00. Empieza el 7 de noviembre. ¿Ya tienes algo de inglés o empiezas de cero?" },
      { from: "cliente", text: "Sé lo básico. ¿Cuánto sale?" },
      { from: "allok", text: "Son $60 al mes. Para el nivel, te propongo una prueba corta antes de empezar. ¿Te agendo una el jueves?" },
    ],
    does: [
      { title: "Contesta con tus cursos", body: "Fechas, horarios, modalidad y precio de cada curso, con lo que tú le cargas." },
      { title: "Pregunta lo que importa", body: "Nivel, horario que le sirve, cómo quiere pagar. Llegas a la conversación sabiendo con quién hablas." },
      { title: "Agenda", body: "Pruebas de nivel, clases de muestra o una llamada contigo." },
      { title: "Cada interesado, en su etapa", body: "De la consulta a la inscripción, sin perder a nadie entre mensajes." },
    ],
    faqs: [
      {
        q: "¿El agente puede inscribir alumnos?",
        a: "Contesta, pregunta lo necesario y agenda. Cada interesado queda en sus etapas de venta para que cierres tú la inscripción.",
      },
      ACTIVATE_FAQ,
      HANDOFF_FAQ,
      SHARED_PRICE_FAQ,
    ],
    cta: "signup",
  },
  {
    kind: "vertical",
    slug: "talleres",
    sector: "Talleres y servicio técnico",
    title: "WhatsApp para talleres con agente de IA",
    description: `Un agente de IA en el WhatsApp de tu taller: contesta qué reparan, cuánto sale el diagnóstico y agenda la revisión. ${PRICE} al mes, precio fijo.`,
    h1: "WhatsApp para talleres y servicio técnico",
    kicker: "allok para talleres",
    lede: "¿Lo reparan, cuánto tarda y cuánto cuesta? allok contesta en tu WhatsApp con tus servicios y precios, pregunta lo que necesitas saber del equipo y agenda la revisión.",
    questions: [
      "¿Reparan esta marca o este modelo?",
      "¿Cuánto cuesta el diagnóstico?",
      "¿Cuánto tarda la reparación?",
      "¿Tienen el repuesto?",
      "¿Hasta qué hora atienden?",
    ],
    example: [
      { from: "cliente", text: "Hola, mi lavadora no centrifuga. ¿La reparan?" },
      { from: "allok", text: "Hola. Sí, reparamos lavadoras. ¿Qué marca y modelo es? Si tienes una foto de la etiqueta, me sirve." },
      { from: "cliente", text: "Es una Samsung de 15 kilos" },
      { from: "allok", text: "Gracias. La visita de diagnóstico cuesta $20 y se descuenta si haces la reparación. ¿Te sirve el martes en la mañana?" },
    ],
    does: [
      { title: "Contesta con tus servicios", body: "Qué reparas, qué marcas trabajas, cuánto sale el diagnóstico y tu horario." },
      { title: "Pide los datos del equipo", body: "Marca, modelo, qué falla. Llegas a la revisión sabiendo qué esperar." },
      { title: "Agenda la revisión", body: "En el taller o a domicilio, en los horarios que tú le das." },
      { title: "Te pasa los presupuestos", body: "Lo que necesita tu revisión para dar un precio queda marcado para ti." },
    ],
    faqs: [
      {
        q: "¿El agente da presupuestos de reparación?",
        a: "Da los precios que tú le cargas, como el del diagnóstico. Un presupuesto que depende de revisar el equipo queda marcado para que lo des tú.",
      },
      ACTIVATE_FAQ,
      HANDOFF_FAQ,
      SHARED_PRICE_FAQ,
    ],
    cta: "signup",
  },
  {
    kind: "vertical",
    slug: "inmobiliarias",
    sector: "Inmobiliarias",
    title: "WhatsApp para inmobiliarias con agente de IA",
    description: "REI es allok para inmobiliarias: un agente de IA que contesta por cada propiedad, califica al interesado y agenda la visita en tu WhatsApp.",
    h1: "WhatsApp para inmobiliarias",
    kicker: "allok para inmobiliarias",
    lede: "¿Sigue disponible, cuánto sale y cuándo la puedo ver? Para corredoras, allok tiene su propia edición: REI, el mismo producto con el vocabulario de una inmobiliaria.",
    questions: [
      "¿Sigue disponible la propiedad?",
      "¿Cuánto es el mantenimiento y qué incluye?",
      "¿Aceptan mascotas?",
      "¿Cuándo la puedo ver?",
      "¿Trabajan con crédito hipotecario?",
    ],
    example: [
      { from: "cliente", text: "Hola, vi el departamento de 2 dormitorios en el anuncio. ¿Sigue disponible?" },
      { from: "allok", text: "Hola. Sí, sigue disponible. Es de 2 dormitorios y 2 baños, con estacionamiento. ¿Lo buscas para comprar o alquilar?" },
      { from: "cliente", text: "Comprar, con crédito" },
      { from: "allok", text: "Perfecto. ¿Tienes el crédito preaprobado? Mientras, te puedo agendar una visita: el asesor tiene el sábado a las 11:00." },
    ],
    does: [
      { title: "Contesta por cada propiedad", body: "Con la ficha real de la propiedad: precio, superficie, gastos, condiciones." },
      { title: "Califica", body: "Presupuesto, zona, plazo y crédito. Sabes a quién llamar hoy." },
      { title: "Agenda la visita", body: "Con los horarios del asesor a cargo de esa propiedad." },
      { title: "Etapas de una corredora", body: "De la consulta a la visita, la propuesta y el cierre." },
    ],
    faqs: [
      {
        q: "¿Qué es REI?",
        a: "Es allok con el vocabulario y las etapas de una inmobiliaria: captaciones, visitas, propuestas y cierres. Mismo producto, mismos planes.",
      },
      ACTIVATE_FAQ,
      HANDOFF_FAQ,
      SHARED_PRICE_FAQ,
    ],
    cta: "rei",
  },
  {
    kind: "vertical",
    slug: "tiendas-online",
    sector: "Tiendas online",
    title: "WhatsApp para tiendas online con agente de IA",
    description: `Un agente de IA en el WhatsApp de tu tienda online: contesta tallas, stock, envíos y formas de pago con tu información. ${PRICE} al mes, precio fijo.`,
    h1: "WhatsApp para tiendas online",
    kicker: "allok para tiendas online",
    lede: "¿Tienen esta talla y cuánto es el envío? allok contesta en tu WhatsApp con la información de tu tienda y te deja a cada comprador anotado.",
    questions: [
      "¿Tienen esta talla o este color?",
      "¿Cuánto es el envío y cuánto tarda?",
      "¿Qué formas de pago aceptan?",
      "¿Puedo cambiarlo si no me queda?",
      "¿Tienen tienda física?",
    ],
    example: [
      { from: "cliente", text: "Hola, ¿tienen las zapatillas blancas en talla 38?" },
      { from: "allok", text: "Hola. Las blancas en 38, sí. Cuestan $55. ¿Te las envío o pasas a retirarlas?" },
      { from: "cliente", text: "Envío. ¿Cuánto es?" },
      { from: "allok", text: "El envío a domicilio cuesta $6 y llega en 3 a 5 días hábiles. Si no te quedan, el cambio de talla es gratis. ¿Te paso el enlace de pago?" },
    ],
    does: [
      { title: "Contesta con tu información", body: "Tallas, colores, precios, envíos, cambios y formas de pago, con lo que tú le cargas." },
      { title: "Pregunta para cerrar", body: "Ciudad, talla, cómo quiere pagar. La conversación avanza hacia la compra." },
      { title: "Te pasa lo que no sabe", body: "Un reclamo o un pedido especial queda marcado para que entres tú." },
      { title: "Cada comprador en su etapa", body: "De la consulta al pago, a la vista de todo tu equipo." },
    ],
    faqs: [
      {
        q: "¿El agente sabe el stock en tiempo real?",
        a: "Contesta con la información que tú le cargas. Si tu stock cambia todo el día y necesitas que lo lea de tu sistema, eso es allok a tu medida.",
      },
      ACTIVATE_FAQ,
      HANDOFF_FAQ,
      SHARED_PRICE_FAQ,
    ],
    cta: "signup",
  },
];

export const SEO_PAGES: SeoPage[] = [...COMPARISONS, ...VERTICALS];

/** La ruta pública de una página. */
export function seoPath(page: SeoPage): string {
  return page.kind === "comparison" ? `/alternativa-a/${page.slug}` : `/whatsapp-para/${page.slug}`;
}

/** El título como sale en la pestaña y en Google: con la firma de la casa. */
export function fullTitle(page: SeoPage): string {
  return `${page.title} | allok`;
}

/**
 * El botón principal. El registro sale de `planCta` (con autoservicio apagado
 * es la conversación de WhatsApp, igual que en la portada); inmobiliarias va a
 * REI, que es donde se vende a corredoras.
 */
export function seoCta(page: SeoPage): { href: string; label: string; note: string | null } {
  if (page.cta === "rei") {
    return { href: "/rei", label: "Ver REI para inmobiliarias", note: null };
  }
  const cta = planCta(COMPLETO);
  return { ...cta, note: trialNote(COMPLETO) };
}

/** La línea de precio que va junto al botón, derivada de los planes. */
export function priceLine(): string {
  return `${PRICE} al mes, precio fijo. Meta te cobra los mensajes a su tarifa. Puesta en marcha opcional desde ${SETUP}, una vez.`;
}

/** Título, descripción, canónica y OG de una página. */
export function seoMetadata(page: SeoPage): Metadata {
  const url = seoPath(page);
  const title = fullTitle(page);
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    // La imagen de la casa (`src/app/opengraph-image.tsx`): un `openGraph` propio
    // reemplaza el del layout entero, imagen incluida, así que se repite aquí.
    openGraph: {
      title,
      description: page.description,
      url,
      type: "website",
      locale: "es",
      siteName: "allok",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "allok" }],
    },
    twitter: { card: "summary_large_image", title, description: page.description, images: ["/opengraph-image"] },
  };
}
