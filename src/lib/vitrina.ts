import { CASOS } from "./casos";
import { PORTFOLIO_PROJECTS, type PortfolioProject } from "./projects";

/**
 * La portada es una vitrina: enseña el trabajo y no vende nada.
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
  cover: string;
  images: { src: string; alt: string; label: string; mobile: boolean; ratio: number }[];
  /** Un color de la propia pieza, para teñir su lámina. */
  tint: string;
};

const ES: Record<string, { tipo: string; linea: string; historia: string; tint: string }> = {
  "rei-fm": {
    tipo: "Plataforma inmobiliaria",
    linea: "Tu edificio, administrado.",
    historia:
      "Marketplace, CRM, administración de edificios, portal de residentes y documentos leídos con IA bajo supervisión. Junta en un solo lugar lo que una operación inmobiliaria suele tener repartido en cinco herramientas.",
    tint: "#1f4d3a",
  },
  vistacampo: {
    tipo: "Sitio institucional",
    linea: "Un tema delicado, contado con confianza.",
    historia:
      "Sitio multiidioma para un centro de tratamiento de adicciones: tratamiento, equipo, instalaciones y blog. Las familias llegan con miedo; la información tenía que dar calma, no ansiedad. El equipo publica sin esperar a un programador.",
    tint: "#2f4a2a",
  },
  samer: {
    tipo: "Constructora",
    linea: "Los compradores ven su edificio crecer sin llamar a nadie.",
    historia:
      "Sitio de una constructora con catálogo de proyectos y avance de obra por desarrollo. Convierte los dos años de silencio entre la firma y la entrega en una razón para volver.",
    tint: "#7a2a1c",
  },
  kawsay: {
    tipo: "Café de especialidad",
    linea: "Vender el origen, no solo el grano.",
    historia:
      "Tienda de café boliviano con catálogo, colecciones, checkout y la historia del origen metida en el camino de compra, no escondida en el pie de página.",
    tint: "#3a2a1e",
  },
  "parley-mundial": {
    tipo: "Juego social",
    linea: "La quiniela de la oficina, convertida en producto.",
    historia:
      "Juego de pronósticos del Mundial: perfil, ligas privadas, tabla y una identidad propia. Un ritual informal que ahora tiene registro, avatares y algo que vale la pena compartir.",
    tint: "#1d3a12",
  },
  integra: {
    tipo: "Consultora",
    linea: "Una consultora que se explica sola antes de la primera reunión.",
    historia:
      "Sitio y motor de contenido para una consultora de transformación digital en hotelería y retail. Blog y recursos que el equipo publica solo: el criterio de la firma trabaja antes de la llamada.",
    tint: "#2b2b30",
  },
  "viaja-ven": {
    tipo: "Turismo gastronómico",
    linea: "Inspirar y decidir en la misma pantalla.",
    historia:
      "Plataforma para recorrer la Colonia Tovar: experiencias, rutas temáticas e itinerarios. Veinte pestañas y una nota de voz convertidas en un solo objeto que se manda por WhatsApp.",
    tint: "#24384f",
  },
  "dream-drop": {
    tipo: "Tienda por lanzamientos",
    linea: "Una tienda construida alrededor de la ventana, no del catálogo.",
    historia:
      "Ecommerce de lanzamientos limitados. La urgencia la comunica el diseño: sin contadores falsos ni presión fabricada.",
    tint: "#8a3b3b",
  },
  artistheway: {
    tipo: "Tienda de arte",
    linea: "Arte digital que se siente coleccionable.",
    historia:
      "Tienda para una marca de arte: catálogo visual, narrativa editorial y un checkout listo para cobrar. Que la marca se lea como algo para coleccionar y no como algo genérico.",
    tint: "#3c4a2e",
  },
  "ainetworking-canada": {
    tipo: "Comunidad de IA",
    linea: "Lanzaron con la plataforma adentro, no con una lista de espera.",
    historia:
      "Sitio público y plataforma de miembros para una organización de IA en Canadá: hubs, postulaciones, eventos, nueve canales y un tablero de colaboración. Quien se registra encuentra con quién hablar el mismo día.",
    tint: "#1b3a7a",
  },
  avepane: {
    tipo: "Organización social",
    linea: "Cincuenta años de trabajo social, en una sola página.",
    historia:
      "Sitio de una organización venezolana de inclusión y formación para personas con discapacidad intelectual. Ordena programas, impacto y formas de sumarse sin perder la calidez humana.",
    tint: "#9a4a12",
  },
  soapy: {
    tipo: "Operación de lavandería",
    linea: "Cada pedido trazado de la recepción a la entrega.",
    historia:
      "Recepción en cuatro pasos, estados con historial, rutas, avisos por WhatsApp y un tablero del dueño por sucursal. Un solo flujo de servicio que se puede seguir de punta a punta.",
    tint: "#167a7a",
  },
  mistica: {
    tipo: "Escuela de natación",
    linea: "Alumnos, asistencia y cobros contando la misma historia.",
    historia:
      "Sistema móvil para instructores y administración: horarios, asistencia por clase, cobros con vencimientos y un tablero con la cobranza pendiente en una pantalla.",
    tint: "#0f5fa8",
  },
  "almacen-vc": {
    tipo: "Inventario",
    linea: "El stock crítico se ve antes de que se acabe.",
    historia:
      "Almacén por área para Vistacampo: entradas, salidas, stock al día y avisos para comprar a tiempo. Cada movimiento queda registrado.",
    tint: "#1f6b4a",
  },
  "taller-samer": {
    tipo: "Taller mecánico",
    linea: "Cada reparación trazable, del ingreso a la entrega.",
    historia: "Órdenes de trabajo, clientes, repuestos, estados y horas por equipo. El taller deja de depender del papel y la memoria.",
    tint: "#2a2a2a",
  },
  "pace-running": {
    tipo: "App para entrenadores",
    linea: "Atletas, planes y métricas en una sola superficie.",
    historia: "Para entrenadores de running: seguimiento por atleta, planes fáciles de revisar y menos chat disperso entre cuatro apps.",
    tint: "#0f1720",
  },
  pausa: {
    tipo: "Acompañante de recuperación",
    linea: "En una crisis, dos toques le ganan a un tablero.",
    historia: "App privada y móvil para la recuperación: chequeos diarios, curva de progreso, ejercicios de anclaje y contactos de apoyo. La fricción es el producto.",
    tint: "#4a3f7a",
  },
  "frontai-landing": {
    tipo: "Agente de voz",
    linea: "Conversaciones que se vuelven acciones.",
    historia: "Un agente de voz con IA que contesta, entiende, califica y archiva cada llamada, y la conecta con el siguiente paso de la venta.",
    tint: "#2d5bd8",
  },
};

/** El orden en que entran a escena las piezas grandes. */
export const DESTACADAS = ["rei-fm", "vistacampo", "samer", "kawsay", "parley-mundial", "integra", "viaja-ven", "dream-drop"];

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
};

const casoPorProyecto = new Map(CASOS.flatMap((c) => c.projectIds.map((id) => [id, `/casos/${c.slug}`] as const)));

function aPieza(p: PortfolioProject): Pieza | null {
  const es = ES[p.id];
  if (!es || p.images.length === 0) return null;
  const images = p.images.map((img) => ({
    src: img.src,
    alt: img.alt,
    label: ETIQUETA[img.label] ?? img.label,
    mobile: /mobile|home\.png|cobros|dashboard\.png|alumnos|mas\.png/.test(img.src),
    ratio: img.width && img.height ? img.width / img.height : 0,
  }));
  return {
    id: p.id,
    name: p.name.replace(" · agency edition", ""),
    tipo: es.tipo,
    linea: es.linea,
    historia: es.historia,
    disciplinas: [...new Set(p.categories.flatMap((c) => DISCIPLINA[c] ?? []))],
    year: p.year,
    status: p.status,
    stack: p.stack.filter((s) => s !== "Case study"),
    liveUrl: p.liveUrl,
    casoHref: casoPorProyecto.get(p.id),
    cover: images.find((i) => !i.mobile)?.src ?? images[0]!.src,
    images,
    tint: es.tint,
  };
}

export const PIEZAS: Pieza[] = PORTFOLIO_PROJECTS.map(aPieza).filter((p): p is Pieza => p !== null);

export const PIEZAS_DESTACADAS: Pieza[] = DESTACADAS.map((id) => PIEZAS.find((p) => p.id === id)).filter(
  (p): p is Pieza => Boolean(p),
);

/** Las que se ven mejor en el muro: capturas de escritorio, sin pantallas de login. */
export const MURO: string[] = PIEZAS.flatMap((p) => p.images.filter((i) => !i.mobile).map((i) => i.src)).filter(
  (src) => !/almacen-vc\/01|soapy\/(create-order)|mistica\/01/.test(src),
);

export const CUENTAS = {
  piezas: PIEZAS.length,
  enVivo: PIEZAS.filter((p) => p.liveUrl).length,
  lanzadas: PIEZAS.filter((p) => p.status === "launched").length,
  tecnologias: new Set(PIEZAS.flatMap((p) => p.stack)).size,
  capturas: PIEZAS.reduce((n, p) => n + p.images.length, 0),
};

export const DISCIPLINAS: { id: Disciplina | "todo"; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "web", label: "Webs y tiendas" },
  { id: "producto", label: "Producto y sistemas" },
  { id: "agentes", label: "Agentes e IA" },
];
