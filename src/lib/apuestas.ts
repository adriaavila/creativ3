/**
 * Las tres apuestas de la semana del 24 al 28 de noviembre de 2026: una
 * página de prueba por cliente posible, fuera del menú y de Google. Cada
 * botón abre el WhatsApp de Adrián con una frase que dice de qué página
 * viene, así el interés se cuenta en su teléfono aunque no haya analítica.
 * La que junte más mensajes (y conversaciones) se vuelve la frase de la home.
 *
 * Regla: todo lo que dice «la prueba» existe hoy en allok. Sin cifras que no
 * tengamos.
 */

export type Paso = { n: string; titulo: string; texto: string };

export type Apuesta = {
  slug: string;
  /** Lo que se ve en la pestaña y al compartir el enlace. */
  titulo: string;
  descripcion: string;
  /** Para quién, en la etiqueta de arriba. */
  para: string;
  /** La promesa, en dos líneas. */
  promesa: [string, string];
  bajada: string;
  /** Lo que se lleva, en frases cortas. */
  teLlevas: string[];
  prueba: { titulo: string; texto: string[]; enlace?: { href: string; texto: string } };
  pasos: Paso[];
  /** El texto del botón y la primera frase del mensaje, abierta para que el dueño complete lo suyo. */
  boton: string;
  mensaje: string;
};

const PASOS_PROYECTO: Paso[] = [
  {
    n: "01",
    titulo: "Me cuentas.",
    texto: "Por WhatsApp o en una llamada corta: qué hacen, cómo trabajan y dónde se va el día. Si no veo nada que valga la pena construir, te lo digo.",
  },
  {
    n: "02",
    titulo: "Te propongo por dónde empezar.",
    texto: "Primero va lo que más tiempo devuelve. Te llega por escrito qué construyo y cuánto cuesta, antes de empezar.",
  },
  {
    n: "03",
    titulo: "Lo construyo y lo usas mientras crece.",
    texto: "Lo diseño yo y la IA me ayuda a construirlo. Nada llega a tus clientes sin tu ok.",
  },
  {
    n: "04",
    titulo: "Si quieres, lo opero.",
    texto: "Después de entregarlo me quedo cuidándolo y mejorándolo cada mes.",
  },
];

export const APUESTAS: Apuesta[] = [
  {
    slug: "negocios-con-citas",
    titulo: "Tu WhatsApp contesta y agenda · allok",
    descripcion: "Un agente que contesta tu WhatsApp y agenda citas aunque estés cerrado. Lo monto con tus precios y horarios.",
    para: "Para clínicas, estética y academias",
    promesa: ["Tu WhatsApp contesta y agenda", "aunque estés cerrado."],
    bajada:
      "Los mensajes de la noche y del domingo son citas que se van con otro. Un agente contesta con tus precios y tus horarios, agenda, y te avisa cuando un cliente te necesita a ti.",
    teLlevas: [
      "Contesta al momento, de día y de noche.",
      "Agenda en tu calendario y no pisa tus citas.",
      "Oye notas de voz y ve fotos antes de contestar.",
      "Te pasa la conversación cuando hace falta una persona.",
      "Cada noche, un resumen de lo que pasó en el día.",
    ],
    prueba: {
      titulo: "Pruébalo con tu negocio.",
      texto: [
        "El agente ya existe y ya contesta. Escribe el nombre de tu negocio y tu web, y en un minuto tienes una demo que habla como tú, con lo que encontró en tu página.",
      ],
      enlace: { href: "/agente-whatsapp#tu-demo", texto: "Armar mi demo" },
    },
    pasos: [
      { n: "01", titulo: "Me cuentas tu negocio.", texto: "Servicios, precios, horarios y lo que más te preguntan. O me pasas tu web y tus chats y yo lo saco de ahí." },
      { n: "02", titulo: "Lo monto en una semana.", texto: "Con tu tono, tus reglas y tu calendario." },
      { n: "03", titulo: "Lo pruebas tú primero.", texto: "Le escribes como si fueras cliente. Nada sale a tus clientes sin tu ok." },
      { n: "04", titulo: "Lo enciendes.", texto: "Y me quedo mirándolo contigo las primeras semanas." },
    ],
    boton: "Escríbeme por WhatsApp",
    mensaje: "Hola, Adrián. Vengo de allok.fun/para/negocios-con-citas. Mi negocio es: ",
  },
  {
    slug: "empresas",
    titulo: "Te quito un proceso manual · allok",
    descripcion: "Automatizaciones e IA a medida: te quito un proceso manual en dos semanas. Primero lo hice en mi propia empresa.",
    para: "Para empresas que operan en Excel y WhatsApp",
    promesa: ["Te quito un proceso manual", "en dos semanas."],
    bajada:
      "Cotizaciones, pedidos, reportes, seguimiento: alguien de tu equipo pasa horas copiando datos de un lado a otro. Elegimos uno, lo automatizo con IA, y queda funcionando.",
    teLlevas: [
      "Un proceso que hoy es manual, funcionando solo.",
      "Conectado a lo que ya usan: Excel, WhatsApp, correo, su sistema.",
      "Precio cerrado y por escrito antes de empezar.",
      "Lo ves avanzar cada semana, no al final.",
    ],
    prueba: {
      titulo: "Primero lo hice en mi empresa.",
      texto: [
        "allok se vende con sistemas que construí para allok. Un motor de agentes investiga negocios por ciudad y rubro, y otro agente revisa cada fila antes de guardarla.",
        "Antes de escribirle a alguien, el sistema prueba su demo y un juez califica las respuestas. El correo está hecho para salir 20 al día y apagarse solo si rebota.",
        "Y el agente de WhatsApp que atiende a los clientes de allok también es mío.",
      ],
    },
    pasos: PASOS_PROYECTO,
    boton: "Cuéntame tu proceso",
    mensaje: "Hola, Adrián. Vengo de allok.fun/para/empresas. El proceso que más tiempo nos quita es: ",
  },
  {
    slug: "agencias",
    titulo: "Vende agentes de IA con tu marca · allok",
    descripcion: "Para agencias: vende agentes de IA con tu marca a tus clientes. Yo los construyo y los mantengo.",
    para: "Para agencias de marketing y software",
    promesa: ["Vende agentes de IA con tu marca.", "Yo los construyo."],
    bajada:
      "Tus clientes te piden «un agente» y no tienes quién lo construya. Tú vendes y te quedas con la relación; yo lo construyo, lo entrego a nombre de tu agencia y lo mantengo.",
    teLlevas: [
      "Agentes de WhatsApp listos para tus clientes, a nombre de tu agencia.",
      "Cada cliente con su propio sistema, ya montado.",
      "Automatizaciones a medida cuando el cliente pide más.",
      "Un ingeniero de IA sin contratarlo.",
    ],
    prueba: {
      titulo: "El sistema ya existe.",
      texto: [
        "El CRM y el agente de WhatsApp de allok están hechos para entregarse ya montados a cada negocio: el agente conoce el negocio, agenda, avisa al dueño y le muestra lo que le trajo.",
        "Tú pones la marca y el cliente. Yo pongo el sistema y lo cuido.",
      ],
    },
    pasos: [
      { n: "01", titulo: "Hablamos 20 minutos.", texto: "Qué te piden tus clientes y qué ya vendes." },
      { n: "02", titulo: "Elegimos tu primer cliente.", texto: "Te paso por escrito qué entregamos, en cuánto tiempo y cuánto cuesta." },
      { n: "03", titulo: "Lo construyo a nombre de tu agencia.", texto: "Tu cliente habla contigo. Nada sale sin tu ok." },
      { n: "04", titulo: "Lo mantengo cada mes.", texto: "Tú cobras la mensualidad a tu cliente." },
    ],
    boton: "Hablemos de tu primer cliente",
    mensaje: "Hola, Adrián. Vengo de allok.fun/para/agencias. Mi agencia es: ",
  },
];

export function apuesta(slug: string): Apuesta | undefined {
  return APUESTAS.find((a) => a.slug === slug);
}
