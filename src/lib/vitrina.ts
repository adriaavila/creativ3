import { CASOS } from "./casos";
import { PORTFOLIO_PROJECTS, type PortfolioProject } from "./projects";

/**
 * Las piezas que enseñan la portada y /trabajo: el trabajo real, con su
 * estado. Las cuatro que la portada cuenta como historia viven en
 * `historias.ts`.
 *
 * Cada frase de aquí sale de lo que ya dicen `projects.ts` y `casos.ts`,
 * traducido y apretado. Regla de la casa: un dato inventado es un error, así
 * que no hay métricas ni testimonios. Los números de la portada se cuentan
 * de los datos, nunca se escriben a mano.
 */

export type Disciplina = "web" | "producto" | "agentes";

export type Pieza = {
  id: string;
  name: string;
  /** Qué es, en dos o tres palabras. */
  tipo: string;
  /** La frase que cuenta lo que cambió. */
  linea: string;
  /** Un párrafo para la ficha. */
  historia: string;
  disciplinas: Disciplina[];
  year: string;
  status: PortfolioProject["status"];
  stack: string[];
  liveUrl?: string;
  /** El caso largo en /casos, cuando existe. */
  casoHref?: string;
  images: { src: string; alt: string; label: string; mobile: boolean; ratio: number }[];
};

const ES: Record<string, { tipo: string; linea: string; historia: string }> = {
  "rei-fm": {
    tipo: "Administración de edificios",
    linea: "Tu edificio, administrado.",
    historia:
      "Cobranza por unidad, gastos con respaldo y el cierre del mes con sus informes, para edificios y condominios de Bolivia y Venezuela. Rei lee la foto o el PDF de cada factura y propone el registro; nada entra al cierre sin que el administrador lo apruebe. Cada residente ve su saldo y cómo pagar desde un enlace propio, sin instalar nada.",
  },
  cuadra: {
    tipo: "Punto de venta bimoneda",
    linea: "Dos monedas en una venta y el cierre sin hojas de cálculo.",
    historia:
      "Punto de venta para negocios venezolanos: cobra en dólares o bolívares en la misma venta, divide el pago entre ocho métodos y guarda la tasa de cada cobro. Si se va el internet, la venta queda en el equipo y se sincroniza sola. El cierre compara el efectivo esperado con el contado, y el contador entra con acceso de consulta para exportar los libros del período.",
  },
  vistacampo: {
    tipo: "Sitio institucional",
    linea: "Un tema delicado, contado con confianza.",
    historia:
      "Sitio multiidioma para un centro de tratamiento de adicciones: tratamiento, equipo, instalaciones y blog. Las familias llegan con miedo; la información tenía que dar calma, no ansiedad. El equipo publica sin esperar a un programador.",
  },
  samer: {
    tipo: "Constructora",
    linea: "El comprador compara terreno, precio y entrega antes de pedir la visita.",
    historia:
      "Sitio de venta de una constructora de Tarija: el condominio Santorini, los departamentos de Verona y construcción en terreno propio. Cada casa se filtra por terreno, precio y fecha de entrega, y se recorre por dentro en siete paradas con las imágenes oficiales del proyecto. Para pedir la visita, WhatsApp se abre con el mensaje listo.",
  },
  kawsay: {
    tipo: "Café de especialidad",
    linea: "Vender el origen, no solo el grano.",
    historia:
      "Tienda de café boliviano con catálogo, colecciones, checkout y la historia del origen metida en el camino de compra, no escondida en el pie de página.",
  },
  "parley-mundial": {
    tipo: "Juego social",
    linea: "La quiniela de la oficina, ahora en una app.",
    historia:
      "Juego de pronósticos del Mundial: perfil, ligas privadas, tabla y una identidad propia. Un ritual informal que ahora tiene registro, avatares y algo que vale la pena compartir.",
  },
  integra: {
    tipo: "Consultora",
    linea: "Se explica sola antes de la primera reunión.",
    historia:
      "Sitio y motor de contenido para una consultora de transformación digital en hotelería y retail. Blog y recursos que el equipo publica solo: el criterio de la firma trabaja antes de la llamada.",
  },
  "viaja-ven": {
    tipo: "Turismo gastronómico",
    linea: "Inspirar y decidir en la misma pantalla.",
    historia:
      "Plataforma para recorrer la Colonia Tovar: experiencias, rutas temáticas e itinerarios. Veinte pestañas y una nota de voz convertidas en un solo objeto que se manda por WhatsApp.",
  },
  "dream-drop": {
    tipo: "Tienda por lanzamientos",
    linea: "Vende por tiempo limitado, no con un catálogo fijo.",
    historia:
      "Ecommerce de lanzamientos limitados. La urgencia la comunica el diseño: sin contadores falsos ni presión fabricada.",
  },
  artistheway: {
    tipo: "Tienda de arte",
    linea: "Arte digital presentado como pieza de colección.",
    historia:
      "Tienda para una marca de arte: catálogo visual, narrativa editorial y un checkout listo para cobrar. Que la marca se lea como algo para coleccionar y no como algo genérico.",
  },
  "ainetworking-canada": {
    tipo: "Comunidad de IA",
    linea: "De no saber por dónde empezar a un plan de seis meses.",
    historia:
      "Sitio bilingüe y plataforma de miembros para una comunidad sin fines de lucro de IA en Canadá. Tres rutas (entender, liderar, construir) terminan en un plan propio de seis meses, y un navegador recomienda por dónde empezar sin pedir cuenta. Suma un calendario de eventos de IA de todo el país, reservas para webinars y sesiones de consulta.",
  },
  avepane: {
    tipo: "Organización social",
    linea: "Cincuenta años de trabajo social, en una sola página.",
    historia:
      "Sitio de una organización venezolana de inclusión y formación para personas con discapacidad intelectual. Ordena programas, impacto y formas de sumarse sin perder la calidez humana.",
  },
  soapy: {
    tipo: "Operación de lavandería",
    linea: "Cada pedido, seguido de la recepción a la entrega.",
    historia:
      "Recepción en cuatro pasos, estados con historial, rutas, avisos por WhatsApp y un tablero del dueño por sucursal. Un solo flujo de servicio que se puede seguir de punta a punta.",
  },
  mistica: {
    tipo: "Escuela de natación",
    linea: "Alumnos, asistencia y cobros contando la misma historia.",
    historia:
      "Sistema en el celular para instructores y administración: horarios, asistencia por clase, cobros con vencimientos y un tablero con la cobranza pendiente en una pantalla.",
  },
  "almacen-vc": {
    tipo: "Inventario",
    linea: "El stock crítico se ve antes de que se acabe.",
    historia:
      "Almacén por área para Vistacampo: entradas, salidas, stock al día y avisos para comprar a tiempo. Cada movimiento queda registrado.",
  },
  "taller-samer": {
    tipo: "Taller mecánico",
    linea: "Órdenes, repuestos y horas por equipo, sin depender del papel.",
    historia: "Órdenes de trabajo, clientes, repuestos, estados y horas por equipo. El taller deja de depender del papel y la memoria.",
  },
  "pace-running": {
    tipo: "App para entrenadores",
    linea: "Atletas, planes y métricas en un solo lugar.",
    historia: "Para entrenadores de running: seguimiento por atleta, planes fáciles de revisar y menos chat disperso entre cuatro apps.",
  },
  pausa: {
    tipo: "Acompañante de recuperación",
    linea: "En una crisis, la ayuda está a dos toques.",
    historia: "App privada de recuperación, pensada para el celular: chequeos diarios, curva de progreso, ejercicios de anclaje y contactos de apoyo.",
  },
  "frontai-landing": {
    tipo: "Web de un agente de voz",
    linea: "Contesta el teléfono y lleva la llamada al siguiente paso de la venta.",
    historia: "Un agente de voz con IA que contesta, entiende, califica y archiva cada llamada, y la conecta con el siguiente paso de la venta.",
  },
};

const DISCIPLINA: Record<string, Disciplina[]> = {
  web: ["web"],
  webapp: ["producto"],
  automation: ["agentes"],
};

const ETIQUETA: Record<string, string> = {
  "The public product introduction": "La presentación del producto",
  "Explaining the property platform": "La plataforma, explicada",
  "The mobile introduction": "En el celular",
  Hero: "La portada",
  Story: "La historia",
  Mobile: "En el celular",
  "Sign-up": "Registro",
  Flow: "El recorrido",
  Home: "Inicio",
  Catalogue: "Catálogo",
  Dashboard: "Tablero",
  Plans: "Planes",
  "Owner dashboard concepts": "Tablero del dueño",
  "Creating a laundry order": "Recepción de un pedido",
  "Orders and their handoffs": "Pedidos y sus traspasos",
  "Expenses and inventory": "Gastos e inventario",
  "A business report at a glance": "El negocio de un vistazo",
  "A daily operating picture": "El día en una pantalla",
  "Today’s classes and activity": "Las clases de hoy",
  "Payment follow-up in context": "Cobros con contexto",
  Orders: "Órdenes",
  Tracking: "Seguimiento",
  Panel: "Panel",
  Movements: "Movimientos",
  "Industrial services, introduced": "Los servicios, presentados",
  "Services and capabilities": "Servicios y capacidades",
  "Mobile service discovery": "En el celular",
  Desktop: "En la pantalla grande",
  Scroll: "Más abajo",
  "Point of sale": "Punto de venta",
};

const casoPorProyecto = new Map(CASOS.flatMap((c) => c.projectIds.map((id) => [id, `/casos/${c.slug}`] as const)));

// La descripción de cada captura, en español: la de casos.ts cuando es el mismo archivo; si no, el
// nombre de la pieza y la etiqueta de la captura. La de projects.ts está en inglés y las páginas, no.
const ALT_ES = new Map(CASOS.flatMap((c) => [c.cover, ...c.gallery]).map((img) => [img.src, img.alt] as const));

function aPieza(p: PortfolioProject): Pieza | null {
  const es = ES[p.id];
  if (!es || p.images.length === 0) return null;
  const name = p.name.replace(" · agency edition", "");
  const images = p.images.map((img) => {
    const label = ETIQUETA[img.label] ?? img.label;
    return {
      src: img.src,
      alt: ALT_ES.get(img.src) ?? `${name}: ${label}`,
      label,
      mobile: /mobile|home\.png|cobros|dashboard\.png|alumnos|mas\.png/.test(img.src),
      ratio: img.width && img.height ? img.width / img.height : 0,
    };
  });
  return {
    id: p.id,
    name,
    tipo: es.tipo,
    linea: es.linea,
    historia: es.historia,
    disciplinas: [...new Set(p.categories.flatMap((c) => DISCIPLINA[c] ?? []))],
    year: p.year,
    status: p.status,
    stack: p.stack.filter((s) => s !== "Case study"),
    liveUrl: p.liveUrl,
    casoHref: casoPorProyecto.get(p.id),
    images,
  };
}

export const PIEZAS: Pieza[] = PORTFOLIO_PROJECTS.map(aPieza).filter((p): p is Pieza => p !== null);

/**
 * El estado de cada pieza, con las mismas palabras en la portada, /trabajo y
 * la ficha. Nunca «En vivo» ni «Privado»: que una web abra no dice si alguien
 * la usa, y lo que el dueño quiere saber es eso.
 */
export const ESTADO: Record<Pieza["status"], string> = {
  launched: "En uso",
  improving: "En evolución",
  demo: "Demo",
  prototype: "Prototipo",
};

/** La forma del estado (`.status`): punto lleno en uso, anillo mientras crece, raya si es demo o prototipo. */
export function claseEstado(status: Pieza["status"]): string {
  if (status === "launched") return "status live";
  if (status === "improving") return "status building";
  return "status archived";
}

/** Las dos cuentas que las páginas dicen: cuántas piezas hay y cuántas ya están en uso. */
export const CUENTAS = {
  piezas: PIEZAS.length,
  lanzadas: PIEZAS.filter((p) => p.status === "launched").length,
};

export const DISCIPLINAS: { id: Disciplina | "todo"; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "web", label: "Webs y tiendas" },
  { id: "producto", label: "Sistemas y aplicaciones" },
  { id: "agentes", label: "Agentes y automatización" },
];
