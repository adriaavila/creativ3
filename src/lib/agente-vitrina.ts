/**
 * El agente en la portada: las conversaciones del muro, las preguntas del
 * dueño y la conversación que se escribe sola al bajar.
 *
 * Todo es un EJEMPLO y la página lo dice al lado: nombres, precios y cifras
 * son de un negocio inventado. Lo que no es inventado es lo que el agente
 * hace, y cada frase se apoya en algo que vocero-crm ya hace hoy:
 * - las respuestas a «Pregúntale a allok» copian la forma de `chipAnswer`
 *   (`server/agencia/centro-ask.ts`): hoy, riesgo y semana;
 * - los avisos copian `textoAviso` y `textoResumenDia` (`lib/avisos.ts`);
 * - las notas de voz, `server/agencia/oir-y-ver.ts`; «Enséñaselo a tu
 *   agente», `components/agencia/ensenar-dialog.tsx`.
 * Si allá cambia, cambia aquí. No hay recordatorios automáticos de citas: el
 * agente no los promete.
 */

export type Tono = "live" | "amber" | "blue" | "muted";

/** Lo que el dueño puede preguntar y el muro sabe iluminar. */
export type Foco = "hoy" | "enfria" | "semana" | "traspaso";

export type Burbuja =
  | { de: "cliente" | "agente"; texto: string; hora?: string }
  | { de: "voz"; dura: string; transcripcion: string }
  | { de: "foto"; descripcion: string }
  | { de: "escribiendo" };

export type Chat = {
  nombre: string;
  /** El rubro, para que el muro se lea como muchos negocios distintos. */
  rubro: string;
  etiqueta: { texto: string; tono: Tono };
  focos: Foco[];
  burbujas: Burbuja[];
};

export const CHATS: Chat[] = [
  {
    nombre: "Valeria R.",
    rubro: "Clínica dental",
    etiqueta: { texto: "Te necesita", tono: "amber" },
    focos: ["hoy"],
    burbujas: [
      { de: "cliente", texto: "¿Aceptan seguro dental?", hora: "18:02" },
      { de: "agente", texto: "Eso te lo confirma alguien del equipo. Ya les avisé y te escriben hoy.", hora: "18:02" },
    ],
  },
  {
    nombre: "Ana P.",
    rubro: "Estética",
    etiqueta: { texto: "Cita agendada", tono: "live" },
    focos: [],
    burbujas: [
      { de: "cliente", texto: "¿Tienen hora para láser el jueves?", hora: "23:41" },
      { de: "agente", texto: "Jueves 17:30 o 18:15. ¿Cuál te acomoda?", hora: "23:41" },
      { de: "cliente", texto: "17:30", hora: "23:42" },
      { de: "agente", texto: "Listo, jueves 17:30 a tu nombre.", hora: "23:42" },
    ],
  },
  {
    nombre: "Marco T.",
    rubro: "Taller",
    etiqueta: { texto: "Se enfría · 3 h", tono: "amber" },
    focos: ["enfria"],
    burbujas: [
      { de: "cliente", texto: "¿Cuánto sale el cambio de pastillas?", hora: "09:14" },
      { de: "agente", texto: "Las delanteras, $1,450 con mano de obra. ¿Te lo agendo esta semana?", hora: "09:14" },
    ],
  },
  {
    nombre: "Camila H.",
    rubro: "Gimnasio",
    etiqueta: { texto: "Nota de voz", tono: "blue" },
    focos: [],
    burbujas: [
      { de: "voz", dura: "0:14", transcripcion: "¿la mensualidad incluye spinning?" },
      { de: "agente", texto: "Sí, incluye spinning y funcional. Son $690 al mes.", hora: "07:03" },
    ],
  },
  {
    nombre: "Luis G.",
    rubro: "Clínica dental",
    etiqueta: { texto: "Pasada a tu equipo", tono: "amber" },
    focos: ["hoy", "traspaso"],
    burbujas: [
      { de: "cliente", texto: "¿Hacen financiamiento para ortodoncia?", hora: "18:40" },
      { de: "agente", texto: "Eso lo ve alguien del equipo. Te escriben hoy mismo.", hora: "18:40" },
    ],
  },
  {
    nombre: "Jorge V.",
    rubro: "Inmobiliaria",
    etiqueta: { texto: "Visita agendada", tono: "live" },
    focos: [],
    burbujas: [
      { de: "cliente", texto: "¿Sigue disponible el de 2 recámaras?", hora: "21:08" },
      { de: "agente", texto: "Sí: 78 m², piso 6. ¿Lo quieres ver el jueves a las 17:00?", hora: "21:08" },
      { de: "cliente", texto: "Va, el jueves", hora: "21:09" },
    ],
  },
  {
    nombre: "Sofía M.",
    rubro: "Academia",
    etiqueta: { texto: "Se enfría · 5 h", tono: "amber" },
    focos: ["enfria"],
    burbujas: [
      { de: "cliente", texto: "¿Cuándo empieza el curso de inglés?", hora: "13:20" },
      { de: "agente", texto: "El 8 de noviembre, sábados 9:00. Quedan 4 cupos. ¿Te aparto uno?", hora: "13:20" },
    ],
  },
  {
    nombre: "Gabriela N.",
    rubro: "Spa",
    etiqueta: { texto: "Escribiendo", tono: "live" },
    focos: [],
    burbujas: [{ de: "cliente", texto: "¿Masaje para dos el domingo?", hora: "22:57" }, { de: "escribiendo" }],
  },
  {
    nombre: "Diego R.",
    rubro: "Restaurante",
    etiqueta: { texto: "Reserva", tono: "live" },
    focos: [],
    burbujas: [
      { de: "cliente", texto: "Mesa para 6 el sábado a las 9", hora: "16:31" },
      { de: "agente", texto: "Te reservé en terraza: sábado 21:00, 6 personas.", hora: "16:31" },
    ],
  },
  {
    nombre: "Paula S.",
    rubro: "Estética",
    etiqueta: { texto: "Te necesita", tono: "amber" },
    focos: ["hoy"],
    burbujas: [
      { de: "cliente", texto: "Quiero hablar con alguien, por favor", hora: "17:55" },
      { de: "agente", texto: "Claro. Ya le avisé a Daniela, te escribe en unos minutos.", hora: "17:55" },
    ],
  },
  {
    nombre: "Andrés C.",
    rubro: "Taller",
    etiqueta: { texto: "Foto", tono: "blue" },
    focos: [],
    burbujas: [
      { de: "foto", descripcion: "Parachoques trasero golpeado" },
      { de: "agente", texto: "Por la foto es el parachoques. El precio exacto te lo da Jorge al verlo. ¿Lo traes mañana?", hora: "10:12" },
    ],
  },
  {
    nombre: "Tomás B.",
    rubro: "Hotel",
    etiqueta: { texto: "Se enfría · 2 h", tono: "amber" },
    focos: ["enfria"],
    burbujas: [
      { de: "cliente", texto: "¿Tienen doble del 12 al 14?", hora: "11:46" },
      { de: "agente", texto: "Sí, $1,850 la noche con desayuno. ¿Te la reservo?", hora: "11:46" },
    ],
  },
  {
    nombre: "Lucía F.",
    rubro: "Academia",
    etiqueta: { texto: "Inscrita", tono: "live" },
    focos: [],
    burbujas: [
      { de: "cliente", texto: "Ya hice la transferencia", hora: "19:22" },
      { de: "agente", texto: "¡Recibido! Quedas inscrita en el grupo de los sábados.", hora: "19:22" },
    ],
  },
  {
    nombre: "Esteban L.",
    rubro: "Inmobiliaria",
    etiqueta: { texto: "Te necesita", tono: "amber" },
    focos: ["hoy"],
    burbujas: [
      { de: "cliente", texto: "Quiero negociar el precio", hora: "12:05" },
      { de: "agente", texto: "Eso lo ve directamente Laura. Ya le avisé.", hora: "12:05" },
    ],
  },
  {
    nombre: "Mariana O.",
    rubro: "Consultorio",
    etiqueta: { texto: "Cita agendada", tono: "live" },
    focos: [],
    burbujas: [
      { de: "cliente", texto: "¿Hay hora con la doctora mañana?", hora: "20:14" },
      { de: "agente", texto: "Mañana a las 10:40. Te la dejé reservada.", hora: "20:14" },
    ],
  },
  {
    nombre: "Fernando A.",
    rubro: "Clínica dental",
    etiqueta: { texto: "Se enfría · 4 h", tono: "amber" },
    focos: ["enfria"],
    burbujas: [
      { de: "cliente", texto: "¿Cuánto cuesta el blanqueamiento?", hora: "08:51" },
      { de: "agente", texto: "$2,800 y dura una hora. ¿Lo quieres para esta semana?", hora: "08:51" },
    ],
  },
  {
    nombre: "Renata D.",
    rubro: "Tienda",
    etiqueta: { texto: "Venta", tono: "live" },
    focos: [],
    burbujas: [
      { de: "cliente", texto: "¿Tienen la talla M en negro?", hora: "15:37" },
      { de: "agente", texto: "Sí, queda una. ¿Te la aparto?", hora: "15:37" },
      { de: "cliente", texto: "Sí porfa", hora: "15:38" },
    ],
  },
  {
    nombre: "Iván P.",
    rubro: "Academia",
    etiqueta: { texto: "Respondido", tono: "muted" },
    focos: [],
    burbujas: [
      { de: "cliente", texto: "¿Las clases son presenciales?", hora: "06:58" },
      { de: "agente", texto: "Sí, y también hay un grupo en línea los martes.", hora: "06:58" },
    ],
  },
];

export type Pregunta = { foco: Foco; texto: string; respuesta: string };

/**
 * Las preguntas del dueño. Las tres primeras son las sugeridas de Inicio
 * (`ask-box.tsx`); la cuarta es texto libre, contestada con las decisiones
 * del agente. Los nombres son los del muro.
 */
export const PREGUNTAS: Pregunta[] = [
  {
    foco: "hoy",
    texto: "¿Qué hago hoy?",
    respuesta:
      "4 conversaciones te necesitan. Empieza por Paula: pidió hablar con una persona y le quedan 2 h de ventana. Después, Valeria y Luis.",
  },
  {
    foco: "enfria",
    texto: "¿Quién se me está enfriando?",
    respuesta:
      "4 clientes pierden su ventana de 24 h en menos de 6 h: Tomás (2 h), Marco (3 h), Fernando (4 h) y Sofía (5 h). Después, solo con plantilla.",
  },
  {
    foco: "semana",
    texto: "¿Cómo va la semana?",
    respuesta: "En los últimos 7 días: 48 conversaciones y 19 clientes nuevos. Tu agente respondió 112 veces; tú, 9.",
  },
  {
    foco: "traspaso",
    texto: "¿Por qué Luis pasó a una persona?",
    respuesta:
      "Luis preguntó por financiamiento para ortodoncia y eso no está en lo que le enseñaste. Se lo pasó a tu equipo a las 18:40.",
  },
];

/** Lo que se contesta a una pregunta que el ejemplo no sabe: la verdad. */
export const RESPUESTA_LIBRE =
  "En tu cuenta, eso lo contesto con los datos de tu negocio. En este ejemplo prueba con «¿Qué hago hoy?» o «¿Cómo va la semana?».";

/** Texto libre → la pregunta del ejemplo que más se le parece, o ninguna. */
export function focoDe(texto: string): Foco | null {
  const t = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (/(enfri|ventana|riesgo|perd|frio|olvid)/.test(t)) return "enfria";
  if (/(por ?que|paso a|luis|persona|traspas)/.test(t)) return "traspaso";
  if (/(semana|como (va|vamos|nos|me)|cuant|numeros|resumen)/.test(t)) return "semana";
  if (/(hoy|necesit|primero|hago|espera|contest|pendiente|urgente)/.test(t)) return "hoy";
  return null;
}

/** El momento de la conversación que se escribe sola al bajar. */
export type Momento = { titulo: string; cuerpo: string; burbujas: Burbuja[]; cita?: string };

export const MOMENTOS: Momento[] = [
  {
    titulo: "Con tus precios y tu tono.",
    cuerpo: "Aprende de dos o tres chats tuyos lo que cobras, lo que siempre te preguntan y cómo lo contestas tú.",
    burbujas: [
      { de: "cliente", texto: "hola!! cuánto sale el blanqueamiento?", hora: "23:12" },
      { de: "agente", texto: "¡Hola! El blanqueamiento sale $2,800 y dura una hora. ¿Lo quieres para esta semana?", hora: "23:12" },
    ],
  },
  {
    titulo: "Oye las notas de voz.",
    cuerpo: "Transcribe los audios y mira las fotos antes de contestar. Nada se queda sin leer.",
    burbujas: [
      { de: "voz", dura: "0:09", transcripcion: "sí, pero el sábado temprano porque entre semana trabajo" },
      { de: "agente", texto: "El sábado tengo 9:00 y 10:30. ¿Cuál te acomoda?", hora: "23:13" },
    ],
  },
  {
    titulo: "Agenda la cita.",
    cuerpo: "Ofrece tus horarios libres, deja la cita puesta en tu agenda y te avisa al celular.",
    burbujas: [
      { de: "cliente", texto: "9 perfecto", hora: "23:13" },
      { de: "agente", texto: "Listo, sábado 9:00 a tu nombre, Valeria. Te esperamos.", hora: "23:13" },
    ],
    cita: "Cita agendada · sábado 9:00",
  },
  {
    titulo: "Lo que no sabe, te lo pasa.",
    cuerpo: "No inventa. Le dice al cliente que lo ve tu equipo, y a ti te llega el aviso.",
    burbujas: [
      { de: "cliente", texto: "ah y aceptan seguro dental?", hora: "23:14" },
      { de: "agente", texto: "Eso te lo confirma alguien del equipo. Ya les avisé y te escriben mañana temprano.", hora: "23:14" },
    ],
  },
];

/** El aviso que cierra la conversación: el texto de `textoAviso` cuando el agente no supo. */
export const AVISO_TRASPASO = {
  titulo: "Valeria necesita una respuesta tuya",
  cuerpo: "El agente no supo contestar: «ah y aceptan seguro dental?»",
};

/** El resumen de las 19:00, con la forma de `textoResumenDia`. */
export const RESUMEN_19 = {
  titulo: "Tu agente te trajo unos $4,000 hoy",
  cuerpo: "Agendó 4 citas ($3,200), cerraste 2 ventas ($800), te escribieron 23 clientes. Nadie te espera.",
};

/** Lo que el dueño le pregunta en Inicio, en orden. */
export const CONVERSACION_DUENO: { pregunta: string; respuesta: string }[] = [
  { pregunta: "¿Qué hago hoy?", respuesta: PREGUNTAS[0]!.respuesta },
  { pregunta: "¿Por qué Luis pasó a una persona?", respuesta: PREGUNTAS[3]!.respuesta },
  { pregunta: "¿Cómo va la semana?", respuesta: PREGUNTAS[2]!.respuesta },
];
