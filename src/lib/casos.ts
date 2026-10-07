import { PORTFOLIO_PROJECTS, type PortfolioProject } from "./projects";

/**
 * Los casos que enseña la portada y `/casos`: el portafolio contado para quien
 * compra, en español y por lo que cambió en el negocio, no por la tecnología.
 *
 * Regla de la casa (docs/design/README.md): un dato inventado es un error. Por
 * eso aquí no hay porcentajes ni testimonios: cada frase sale de lo que el
 * sistema hace y de lo que ya dice `projects.ts`. Cuando un cliente nos dé sus
 * números y su permiso, van en `numbers`, con la fuente al lado.
 */

export type SolutionId = "ventas" | "operacion" | "plataformas" | "web";

export type Solution = {
  id: SolutionId;
  n: string;
  name: string;
  promise: string;
  body: string;
  includes: string[];
};

export const SOLUTIONS: Solution[] = [
  {
    id: "ventas",
    n: "01",
    name: "Ventas y atención con IA",
    promise: "Ningún cliente se queda sin respuesta.",
    body: "Agentes que contestan en WhatsApp con tu información real, califican, agendan y le pasan al equipo solo lo que necesita a una persona.",
    includes: ["Agente de WhatsApp sobre tus sistemas", "CRM con etapas y seguimiento", "Atribución de anuncios a ventas", "Traspaso a humano con contexto"],
  },
  {
    id: "operacion",
    n: "02",
    name: "Operación a medida",
    promise: "La operación deja de depender del papel y la memoria.",
    body: "El sistema interno que tu negocio necesita y ninguna herramienta genérica resuelve: órdenes, inventario, cobros, rutas y reportes en un solo lugar.",
    includes: ["Órdenes y estados de punta a punta", "Inventario con alertas de stock", "Cobros y cuentas por cobrar", "Tablero del dueño en el celular"],
  },
  {
    id: "plataformas",
    n: "03",
    name: "Plataformas para tus clientes",
    promise: "Tus clientes se atienden solos, y vuelven.",
    body: "Portales, membresías y marketplaces donde el cliente consulta, paga y participa sin escribirle a nadie para preguntar cómo va lo suyo.",
    includes: ["Portal de clientes con acceso propio", "Pagos en línea", "Comunidades y membresías", "Avance y documentos en tiempo real"],
  },
  {
    id: "web",
    n: "04",
    name: "Web y marca que venden",
    promise: "Tu web trabaja antes de la primera llamada.",
    body: "Sitios y tiendas que explican lo que haces mejor que una reunión, se publican sin depender de un programador y llevan a la acción que te importa.",
    includes: ["Narrativa y diseño a medida", "Tienda y checkout", "SEO técnico y multiidioma", "Contenido que tu equipo publica solo"],
  },
];

export type CaseImage = { src: string; alt: string; label: string; kind: "desktop" | "mobile" | "board" };

export type Caso = {
  slug: string;
  client: string;
  sector: string;
  solutions: SolutionId[];
  /** El titular: lo que cambió en el negocio. */
  headline: string;
  problem: string;
  built: string[];
  outcome: string;
  /** Proyectos del portafolio que forman el caso (un cliente puede tener varios sistemas). */
  projectIds: string[];
  cover: CaseImage;
  gallery: CaseImage[];
};

export const CASOS: Caso[] = [
  {
    slug: "vistacampo",
    client: "Vistacampo",
    sector: "Centro de tratamiento de adicciones",
    solutions: ["web", "operacion"],
    headline: "Un tema delicado contado con confianza, y una operación interna que ya no pierde inventario.",
    problem:
      "Las familias llegan con miedo y muchas preguntas. Y puertas adentro, cocina, limpieza y mantenimiento movían insumos sin que nadie viera el stock hasta que faltaba algo.",
    built: [
      "Sitio institucional multiidioma con tratamiento, equipo, instalaciones y blog",
      "Contenido que el equipo publica sin esperar a un programador",
      "Sistema de almacén por área: entradas, salidas y stock al día",
      "Avisos de stock crítico antes de que se acabe",
    ],
    outcome:
      "Dos sistemas para el mismo cliente: afuera, una web donde la información genera confianza en vez de ansiedad; adentro, cada movimiento queda registrado y compras se hace a tiempo.",
    projectIds: ["vistacampo", "almacen-vc"],
    cover: { src: "/projects/vistacampo/01-desktop.jpg", alt: "Portada del sitio de Vistacampo", label: "El sitio", kind: "desktop" },
    gallery: [
      { src: "/projects/vistacampo/02-desktop-scroll.jpg", alt: "Mensaje del fundador en el sitio de Vistacampo", label: "La historia del centro", kind: "desktop" },
      { src: "/projects/almacen-vc/01-desktop.jpg", alt: "Acceso por área al sistema de almacén de Vistacampo", label: "Almacén por área", kind: "desktop" },
      { src: "/projects/vistacampo/03-mobile.jpg", alt: "Sitio de Vistacampo en el celular", label: "En el celular", kind: "mobile" },
    ],
  },
  {
    slug: "soapy",
    client: "Soapy",
    sector: "Lavandería con varias sucursales",
    solutions: ["operacion", "ventas"],
    headline: "Cada pedido trazado de la recepción a la entrega, sin que se pierda en el camino.",
    problem: "En una lavandería cada traspaso es un lugar donde un pedido puede perderse: recepción, lavado, ruta y entrega vivían en cuadernos y chats.",
    built: [
      "Recepción de pedidos en cuatro pasos",
      "Estados del pedido con historial y saldo pendiente",
      "Avisos al cliente por WhatsApp",
      "Tablero del dueño por sucursal, con gastos, inventario y reportes",
    ],
    outcome: "Un solo flujo de servicio que se puede seguir de punta a punta, y un dueño que ve sus sucursales desde el celular.",
    projectIds: ["soapy"],
    cover: { src: "/projects/soapy/dashboard.jpg", alt: "Tablero del dueño de Soapy con ingresos por sucursal", label: "Tablero del dueño", kind: "board" },
    gallery: [
      { src: "/projects/soapy/orders.jpg", alt: "Lista de pedidos de Soapy con su línea de tiempo", label: "Pedidos y sus traspasos", kind: "board" },
      { src: "/projects/soapy/create-order.jpg", alt: "Creación de un pedido de lavandería en Soapy", label: "Recepción en cuatro pasos", kind: "board" },
      { src: "/projects/soapy/reports.jpg", alt: "Reportes del negocio en Soapy", label: "Reportes", kind: "board" },
    ],
  },
  {
    slug: "mistica",
    client: "Mística",
    sector: "Escuela de natación",
    solutions: ["operacion"],
    headline: "Alumnos, asistencia y cobros contando la misma historia.",
    problem: "Clases, asistencia y pagos estaban en lugares distintos, y saber quién debía qué era una tarde de revisar listas.",
    built: [
      "Sistema móvil para instructores y administración",
      "Asistencia por clase y horario",
      "Cobros con vencimientos y recordatorios",
      "Tablero con alumnos activos, cobranza e ingresos",
    ],
    outcome: "El equipo pasa de alumnos a horarios y cobros sin perder el contexto, y la cobranza pendiente se ve en una pantalla.",
    projectIds: ["mistica"],
    cover: { src: "/projects/mistica/dashboard.png", alt: "Tablero de Mística con alumnos, cobranza e ingresos", label: "Tablero", kind: "mobile" },
    gallery: [
      { src: "/projects/mistica/cobros.png", alt: "Módulo de cobros de Mística", label: "Cobros", kind: "mobile" },
      { src: "/projects/mistica/home.png", alt: "Inicio de Mística con las clases del día", label: "Las clases de hoy", kind: "mobile" },
    ],
  },
  {
    slug: "samer",
    client: "SAMER",
    sector: "Constructora",
    solutions: ["web", "plataformas", "operacion"],
    headline: "Los compradores ven su edificio crecer sin llamar a nadie.",
    problem: "Entre la firma y la entrega pasan años, y el equipo de ventas se iba el día contestando «¿cómo va lo mío?».",
    built: [
      "Sitio institucional con catálogo de proyectos y preventa",
      "Avance de obra por desarrollo",
      "Registro de horas y estado de la maquinaria del taller",
    ],
    outcome: "La página de avance absorbe las llamadas de seguimiento, y el taller sabe en qué estado está cada equipo.",
    projectIds: ["samer", "taller-samer"],
    cover: { src: "/projects/samer/01-desktop.jpg", alt: "Portada del sitio de SAMER", label: "El sitio", kind: "desktop" },
    gallery: [
      { src: "/projects/samer/02-desktop-scroll.jpg", alt: "Quiénes somos en el sitio de SAMER", label: "La constructora", kind: "desktop" },
      { src: "/projects/taller-samer/01-desktop.jpg", alt: "Registro de horas del taller de SAMER", label: "El taller", kind: "desktop" },
      { src: "/projects/samer/03-mobile.jpg", alt: "Sitio de SAMER en el celular", label: "En el celular", kind: "mobile" },
    ],
  },
  {
    slug: "rei",
    client: "REI",
    sector: "Administración de edificios",
    solutions: ["plataformas", "ventas", "operacion"],
    headline: "Todo el edificio en un solo lugar: cobranzas, gastos, residentes y documentos.",
    problem: "Un edificio es una sola operación, pero su información vivía en cinco herramientas que no se hablaban.",
    built: [
      "Administración de propiedades y cobranzas",
      "Portal de residentes",
      "CRM y marketplace inmobiliario",
      "Lectura de documentos con IA, supervisada por una persona",
    ],
    outcome: "Una vista compartida de la propiedad, de la administración a la experiencia del residente.",
    projectIds: ["rei-fm"],
    cover: { src: "/projects/rei-fm/01-desktop.jpg", alt: "Portada de REI", label: "El producto", kind: "desktop" },
    gallery: [
      { src: "/projects/rei-fm/02-desktop-scroll.jpg", alt: "El panel de REI con el edificio en contexto", label: "El edificio en contexto", kind: "desktop" },
      { src: "/projects/rei-fm/03-mobile.jpg", alt: "REI en el celular", label: "En el celular", kind: "mobile" },
    ],
  },
  {
    slug: "ainetworking-canada",
    client: "AiNetworking Canada",
    sector: "Comunidad de IA en Canadá",
    solutions: ["plataformas", "web"],
    headline: "Lanzaron con la plataforma adentro, no con una lista de espera.",
    problem: "Una comunidad nueva necesita un lugar útil al que ir después de registrarse, no un correo de bienvenida.",
    built: [
      "Sitio público y plataforma de miembros",
      "Nueve canales temáticos y tablero de colaboración",
      "Postulaciones, eventos y área privada",
      "Registro con consentimiento explícito",
    ],
    outcome: "Quien se registra encuentra con quién hablar el mismo día.",
    projectIds: ["ainetworking-canada"],
    cover: { src: "/projects/ainetworking-canada/01-desktop.jpg", alt: "Portada de AiNetworking Canada", label: "El sitio", kind: "desktop" },
    gallery: [
      { src: "/projects/ainetworking-canada/02-desktop-scroll.jpg", alt: "Cómo participar en AiNetworking Canada", label: "Cómo participar", kind: "desktop" },
      { src: "/projects/ainetworking-canada/03-mobile.jpg", alt: "AiNetworking Canada en el celular", label: "En el celular", kind: "mobile" },
    ],
  },
  {
    slug: "integra",
    client: "Integra",
    sector: "Consultora de transformación digital",
    solutions: ["web"],
    headline: "Una consultora que se explica sola antes de la primera reunión.",
    problem: "El criterio de la consultora estaba en la cabeza de sus socios; el prospecto llegaba a la reunión sin saber qué compraba.",
    built: ["Sitio corporativo con servicios y diagnóstico", "Blog y recursos que el equipo publica solo", "SEO técnico y velocidad real"],
    outcome: "El material publicado trabaja antes de la llamada, y el equipo publica sin esperar a un programador.",
    projectIds: ["integra"],
    cover: { src: "/projects/integra/01-desktop.jpg", alt: "Portada del sitio de Integra", label: "El sitio", kind: "desktop" },
    gallery: [
      { src: "/projects/integra/02-desktop-scroll.jpg", alt: "El diagnóstico en el sitio de Integra", label: "El diagnóstico", kind: "desktop" },
      { src: "/projects/integra/03-mobile.jpg", alt: "Integra en el celular", label: "En el celular", kind: "mobile" },
    ],
  },
  {
    slug: "shopea",
    client: "Shopea",
    sector: "Comercio por WhatsApp",
    solutions: ["ventas", "web"],
    headline: "Del catálogo a la conversación donde de verdad se vende.",
    problem: "El catálogo estaba por un lado y la conversación donde la gente compra, por otro.",
    built: ["Tienda con catálogo y checkout", "Pagos en varias monedas", "Pedido armado listo para cerrar por WhatsApp"],
    outcome: "Un camino continuo de encontrar el producto a preparar el pedido.",
    projectIds: ["shopea"],
    cover: { src: "/projects/shopea/01-desktop.jpg", alt: "Portada de Shopea", label: "La tienda", kind: "desktop" },
    gallery: [
      { src: "/projects/shopea/02-desktop-scroll.jpg", alt: "Cómo funciona Shopea: pagos y precios", label: "Cómo funciona", kind: "desktop" },
      { src: "/projects/shopea/03-mobile.jpg", alt: "Shopea en el celular", label: "En el celular", kind: "mobile" },
    ],
  },
];

/** Los que abren la portada, en este orden. */
export const FEATURED_CASOS = ["vistacampo", "soapy", "samer", "mistica"] as const;

export function casoBySlug(slug: string): Caso | undefined {
  return CASOS.find((c) => c.slug === slug);
}

export function casoProjects(caso: Caso): PortfolioProject[] {
  return caso.projectIds
    .map((id) => PORTFOLIO_PROJECTS.find((p) => p.id === id))
    .filter((p): p is PortfolioProject => Boolean(p));
}

/** Los enlaces en vivo del caso, solo de proyectos publicados. */
export function casoLiveLinks(caso: Caso): { name: string; url: string }[] {
  return casoProjects(caso)
    .filter((p) => p.liveUrl && p.status !== "prototype")
    .map((p) => ({ name: p.name, url: p.liveUrl as string }));
}

export function casosFor(solution: SolutionId): Caso[] {
  return CASOS.filter((c) => c.solutions.includes(solution));
}

/** Cuántos sistemas hay en producción: sale del portafolio, nunca de una constante. */
export const LIVE_SYSTEMS = PORTFOLIO_PROJECTS.filter((p) => p.status === "launched").length;
