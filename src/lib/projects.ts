import syncData from "@/data/projects-sync.json";

export type ProjectCategory = "web" | "webapp" | "automation";

export type ProjectImage = {
  src: string;
  alt: string;
  label: string;
};

export type PortfolioProject = {
  id: string;
  name: string;
  kind: string;
  categories: ProjectCategory[];
  description: string;
  result: string;
  businessGoal: "increase_revenue" | "reduce_costs" | "both";
  businessOutcome: string;
  agentRole: string;
  status: "launched" | "demo" | "prototype" | "improving";
  stack: string[];
  year: string;
  liveUrl?: string;
  caseStudyUrl?: string;
  sourceUrl?: string;
  githubPushedAt: string;
  githubUpdatedLabel: string;
  images: ProjectImage[];
};

// Regenerado por `pnpm sync:projects` (scripts/sync-projects.ts). No editar a mano.
const SYNC = syncData as {
  syncedAt: string;
  projects: Record<
    string,
    { githubPushedAt?: string; githubUpdatedLabel?: string; images?: ProjectImage[] }
  >;
};

export const PROJECTS_LAST_SYNCED_AT = SYNC.syncedAt;

export const PROJECT_CATEGORIES: {
  id: "all" | ProjectCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "all",
    label: "Todos",
    description: "Los últimos trabajos sincronizados desde GitHub.",
  },
  {
    id: "web",
    label: "Web",
    description: "Landings, ecommerce y sitios públicos con narrativa clara.",
  },
  {
    id: "webapp",
    label: "Web app",
    description: "Dashboards, SaaS y sistemas operativos para negocios reales.",
  },
  {
    id: "automation",
    label: "Automatización",
    description: "Agentes, workflows y software que reduce trabajo manual.",
  },
];

const RAW_PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: "shopea",
    name: "Shopea",
    kind: "Una forma más simple de vender por WhatsApp.",
    categories: ["webapp", "web"],
    description:
      "Catálogo, checkout y pagos en distintas monedas dentro de una experiencia construida alrededor de cómo realmente compran las personas.",
    result:
      "Shopea conecta el descubrimiento de un producto con la conversación donde ocurre la venta.",
    businessGoal: "increase_revenue",
    businessOutcome: "Shopea conecta el descubrimiento de un producto con la conversación donde ocurre la venta.",
    agentRole: "Asistente de catálogo y preparación de pedidos",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Convex", "Clerk"],
    year: "2026",
    liveUrl: "https://shopea.vercel.app",
    githubPushedAt: "2026-05-16T00:00:00Z",
    githubUpdatedLabel: "16 may 2026",
    images: [
      {
        src: "/projects/shopea/01-desktop.jpg",
        alt: "Landing de Shopea en desktop",
        label: "Landing",
      },
      {
        src: "/projects/shopea/02-desktop-scroll.jpg",
        alt: "Shopea: como funciona, pagos y precios",
        label: "Cómo funciona",
      },
      {
        src: "/projects/shopea/03-mobile.jpg",
        alt: "Shopea en movil",
        label: "Mobile",
      },
    ],
  },
  {
    id: "rei-fm",
    name: "REI",
    kind: "Una nueva infraestructura para el mercado inmobiliario.",
    categories: ["webapp"],
    description:
      "Marketplace, CRM, administración de propiedades, portal de residentes y procesamiento de documentos con IA supervisada.",
    result:
      "REI conecta las distintas partes de una operación inmobiliaria que normalmente viven separadas.",
    businessGoal: "reduce_costs",
    businessOutcome: "REI conecta las distintas partes de una operación inmobiliaria que normalmente viven separadas.",
    agentRole: "Copiloto de seguimiento operativo",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Postgres", "Stripe"],
    year: "2026",
    liveUrl: "https://reiprop.tech",
    githubPushedAt: "2026-05-25T13:39:30Z",
    githubUpdatedLabel: "25 may 2026",
    images: [
      {
        src: "/projects/rei-fm/01-desktop.jpg",
        alt: "Vista desktop del dashboard de rei",
        label: "Dashboard",
      },
      {
        src: "/projects/rei-fm/02-desktop-scroll.jpg",
        alt: "Vista extendida de la operacion inmobiliaria en rei",
        label: "Operacion",
      },
      {
        src: "/projects/rei-fm/03-mobile.jpg",
        alt: "Vista movil de rei",
        label: "Mobile",
      },
    ],
  },
  {
    id: "frontai-landing",
    name: "Frontia",
    kind: "Conversaciones que se convierten en acciones.",
    categories: ["web", "automation"],
    description:
      "Un agente de voz con IA que atiende, entiende, califica y organiza cada interacción.",
    result:
      "Frontia conecta una llamada con el siguiente paso del proceso comercial.",
    businessGoal: "both",
    businessOutcome: "Frontia conecta una llamada con el siguiente paso del proceso comercial.",
    agentRole: "Agente de front desk",
    status: "demo",
    stack: ["Next.js", "AI UX", "Vercel", "Motion"],
    year: "2026",
    liveUrl: "https://frontai-landing.vercel.app",
    githubPushedAt: "2026-05-25T01:32:12Z",
    githubUpdatedLabel: "25 may 2026",
    images: [
      {
        src: "/projects/frontai-landing/01-desktop.jpg",
        alt: "Hero de Frontia con interfaz de agente AI",
        label: "Hero",
      },
      {
        src: "/projects/frontai-landing/02-desktop-scroll.jpg",
        alt: "Seccion de problema y solucion en Frontia",
        label: "Story",
      },
      {
        src: "/projects/frontai-landing/03-mobile.jpg",
        alt: "Version movil de Frontia",
        label: "Mobile",
      },
    ],
  },
  {
    id: "parley-mundial",
    name: "Parlai Mundial",
    kind: "Social game",
    categories: ["webapp"],
    description:
      "Juego mundialero para crear perfil, armar ligas privadas y competir por predicciones con una identidad visual propia.",
    result:
      "Transforma una quiniela informal en un producto social con onboarding, avatares, tabla y experiencia compartible.",
    businessGoal: "increase_revenue",
    businessOutcome: "Convierte una dinámica informal en un producto compartible con registro y recurrencia.",
    agentRole: "Moderación y soporte de juego",
    status: "prototype",
    stack: ["Next.js", "React", "TypeScript", "Game UI"],
    year: "2026",
    liveUrl: "https://parlai-mundial.vercel.app",
    sourceUrl: "https://github.com/adriaavila/parley-mundial",
    githubPushedAt: "2026-05-25T00:41:59Z",
    githubUpdatedLabel: "25 may 2026",
    images: [
      {
        src: "/projects/parley-mundial/01-desktop.jpg",
        alt: "Pantalla de registro de Parlai Mundial",
        label: "Registro",
      },
      {
        src: "/projects/parley-mundial/02-desktop-scroll.jpg",
        alt: "Vista scrolleada de Parlai Mundial",
        label: "Flujo",
      },
      {
        src: "/projects/parley-mundial/03-mobile.jpg",
        alt: "Version movil de Parlai Mundial",
        label: "Mobile",
      },
    ],
  },
  {
    id: "artistheway",
    name: "Artistheway",
    kind: "Ecommerce de marca",
    categories: ["web"],
    description:
      "Tienda online para una marca de arte, con catalogo visual, narrativa editorial y checkout listo para compra.",
    result:
      "Ordena la experiencia de descubrimiento y compra para que la marca se sienta coleccionable, no generica.",
    businessGoal: "increase_revenue",
    businessOutcome: "Eleva descubrimiento y compra con una experiencia editorial coherente con la marca.",
    agentRole: "Curador de catálogo",
    status: "launched",
    stack: ["Next.js", "Stripe", "Tailwind", "Ecommerce"],
    year: "2026",
    liveUrl: "https://artistheway.vercel.app",
    sourceUrl: "https://github.com/adriaavila/artistheway",
    githubPushedAt: "2026-05-21T23:17:15Z",
    githubUpdatedLabel: "21 may 2026",
    images: [
      {
        src: "/projects/artistheway/01-desktop.jpg",
        alt: "Home de Artistheway en desktop",
        label: "Home",
      },
      {
        src: "/projects/artistheway/02-desktop-scroll.jpg",
        alt: "Catalogo scrolleado de Artistheway",
        label: "Catalogo",
      },
      {
        src: "/projects/artistheway/03-mobile.jpg",
        alt: "Version movil de Artistheway",
        label: "Mobile",
      },
    ],
  },
  {
    id: "pace-running",
    name: "Pace Running",
    kind: "Coaching SaaS",
    categories: ["webapp"],
    description:
      "App para coaches de running con atletas, planes, sesiones y metricas semanales en una misma superficie.",
    result:
      "Le da al coach una operacion medible: seguimiento por atleta, menos chat disperso y planes faciles de revisar.",
    businessGoal: "reduce_costs",
    businessOutcome: "Concentra planes y seguimiento para reducir coordinación dispersa entre coach y atletas.",
    agentRole: "Asistente de seguimiento semanal",
    status: "improving",
    stack: ["Next.js", "Supabase", "TypeScript", "Analytics"],
    year: "2026",
    liveUrl: "https://pace-running-three.vercel.app",
    githubPushedAt: "2026-05-19T18:49:02Z",
    githubUpdatedLabel: "19 may 2026",
    images: [
      {
        src: "/projects/pace-running/01-desktop.jpg",
        alt: "Vista desktop de Pace Running",
        label: "Dashboard",
      },
      {
        src: "/projects/pace-running/02-desktop-scroll.jpg",
        alt: "Vista extendida de Pace Running",
        label: "Planes",
      },
      {
        src: "/projects/pace-running/03-mobile.jpg",
        alt: "Version movil de Pace Running",
        label: "Mobile",
      },
    ],
  },
  {
    id: "soapy",
    name: "Soapy",
    kind: "Cada orden conectada de principio a fin.",
    categories: ["webapp", "automation"],
    description:
      "Recepción, estados, rutas, notificaciones y entregas dentro de una sola experiencia operativa.",
    result:
      "Soapy conecta cada parte del servicio para que nada se pierda en el camino.",
    businessGoal: "reduce_costs",
    businessOutcome: "Soapy conecta cada parte del servicio para que nada se pierda en el camino.",
    agentRole: "Operador de estados y notificaciones",
    status: "launched",
    stack: ["Next.js", "Supabase", "WhatsApp", "Operations"],
    year: "2026",
    liveUrl: "https://soapy-sooty.vercel.app",
    githubPushedAt: "2026-05-11T17:17:16Z",
    githubUpdatedLabel: "11 may 2026",
    images: [
      {
        src: "/projects/soapy/01-desktop.jpg",
        alt: "Dashboard de Soapy para lavanderias",
        label: "Ordenes",
      },
      {
        src: "/projects/soapy/02-desktop-scroll.jpg",
        alt: "Vista extendida de operaciones en Soapy",
        label: "Ruta",
      },
      {
        src: "/projects/soapy/03-mobile.jpg",
        alt: "Version movil de Soapy",
        label: "Mobile",
      },
    ],
  },
  {
    id: "mistica",
    name: "Mística",
    kind: "La operación detrás de una experiencia de bienestar.",
    categories: ["webapp"],
    description:
      "Alumnos, horarios, asistencia, productos y pagos dentro de un sistema creado para una escuela de natación.",
    result:
      "Mística conecta la experiencia de cada alumno con la operación que la hace posible.",
    businessGoal: "reduce_costs",
    businessOutcome: "Mística conecta la experiencia de cada alumno con la operación que la hace posible.",
    agentRole: "Asistente de cobranza y operación",
    status: "launched",
    stack: ["Next.js", "Supabase", "Stripe", "Case study"],
    year: "2026",
    liveUrl: "https://mistica-app-fawn.vercel.app",
    caseStudyUrl: "/projects/mistica",
    sourceUrl: "https://github.com/adriaavila/mistica-app",
    githubPushedAt: "2026-04-30T14:59:36Z",
    githubUpdatedLabel: "30 abr 2026",
    images: [
      {
        src: "/projects/mistica/dashboard.png",
        alt: "Dashboard de metricas de Mistica",
        label: "Dashboard",
      },
      {
        src: "/projects/mistica/home.png",
        alt: "Inicio de Mistica para profesores",
        label: "Inicio",
      },
      {
        src: "/projects/mistica/cobros.png",
        alt: "Modulo de cobros de Mistica",
        label: "Cobros",
      },
    ],
  },
  {
    id: "taller-samer",
    name: "Taller Samer",
    kind: "Workshop OS",
    categories: ["webapp", "automation"],
    description:
      "Software para taller mecanico: ordenes de trabajo, clientes, repuestos, estados y seguimiento de servicio.",
    result:
      "Hace trazable cada reparación, desde la recepción hasta la entrega, con menos dependencia de memoria y papel.",
    businessGoal: "reduce_costs",
    businessOutcome: "Da trazabilidad a órdenes, repuestos y estados para reducir dependencia de papel y memoria.",
    agentRole: "Seguimiento de órdenes de trabajo",
    status: "improving",
    stack: ["Next.js", "Postgres", "Supabase", "CRM"],
    year: "2026",
    liveUrl: "https://taller-samer.vercel.app",
    sourceUrl: "https://github.com/adriaavila/taller-samer",
    githubPushedAt: "2026-04-23T21:50:44Z",
    githubUpdatedLabel: "23 abr 2026",
    images: [
      {
        src: "/projects/taller-samer/01-desktop.jpg",
        alt: "Dashboard de Taller Samer",
        label: "Ordenes",
      },
      {
        src: "/projects/taller-samer/02-desktop-scroll.jpg",
        alt: "Vista extendida de Taller Samer",
        label: "Seguimiento",
      },
      {
        src: "/projects/taller-samer/03-mobile.jpg",
        alt: "Version movil de Taller Samer",
        label: "Mobile",
      },
    ],
  },
  {
    id: "almacen-vc",
    name: "Almacén VC",
    kind: "Inventory control",
    categories: ["webapp", "automation"],
    description:
      "Control de almacen para Vistacampo, pensado para entradas, salidas, existencias y decisiones de reposicion.",
    result:
      "Reduce el inventario invisible: cada movimiento queda registrado y el equipo ve stock critico antes de quedarse corto.",
    businessGoal: "reduce_costs",
    businessOutcome: "Registra movimientos y alertas de stock para evitar compras tardías e inventario invisible.",
    agentRole: "Monitor de inventario crítico",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Inventory", "Ops"],
    year: "2026",
    liveUrl: "https://almacen-vc.vercel.app",
    sourceUrl: "https://github.com/adriaavila/almacen-vc",
    githubPushedAt: "2026-03-12T13:37:05Z",
    githubUpdatedLabel: "12 mar 2026",
    images: [
      {
        src: "/projects/almacen-vc/01-desktop.jpg",
        alt: "Vista desktop de Almacen VC",
        label: "Panel",
      },
      {
        src: "/projects/almacen-vc/02-desktop-scroll.jpg",
        alt: "Vista extendida de Almacen VC",
        label: "Movimientos",
      },
      {
        src: "/projects/almacen-vc/03-mobile.jpg",
        alt: "Version movil de Almacen VC",
        label: "Mobile",
      },
    ],
  },
  {
    id: "wasap-creativ",
    name: "Wasap Creativ",
    kind: "WhatsApp agent",
    categories: ["automation"],
    description:
      "Agente para conversaciones de WhatsApp SaaS: responde, califica, ordena contexto y prepara el siguiente paso comercial.",
    result:
      "Baja la carga de atencion manual y convierte chats entrantes en oportunidades con estructura.",
    businessGoal: "both",
    businessOutcome: "Clasifica conversaciones y prepara próximos pasos sin ocultar cuándo debe intervenir una persona.",
    agentRole: "Agente de calificación y seguimiento",
    status: "prototype",
    stack: ["TypeScript", "WhatsApp", "Agents", "Automation"],
    year: "2026",
    sourceUrl: "https://github.com/adriaavila/wasap-creativ",
    githubPushedAt: "2026-03-12T14:00:43Z",
    githubUpdatedLabel: "12 mar 2026",
    images: [],
  },
  {
    id: "integra",
    name: "Integra",
    kind: "Consultoría que se explica antes de la primera reunión.",
    categories: ["web"],
    description:
      "Sitio corporativo y motor de contenido para una consultora de transformación digital en hospitalidad y retail.",
    result:
      "Integra convierte el criterio de una consultora en material publicado que trabaja antes de la llamada.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "Blog y recursos con rutas dinámicas: el equipo publica sin depender de desarrollo.",
    agentRole: "Sin agente: arquitectura de contenido y SEO",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    year: "2026",
    liveUrl: "https://intrega-landing.vercel.app",
    sourceUrl: "https://github.com/adriaavila/intrega-landing",
    githubPushedAt: "2026-03-12T00:00:00Z",
    githubUpdatedLabel: "12 mar 2026",
    images: [
      {
        src: "/projects/integra/01-desktop.webp",
        alt: "Home de Integra en desktop",
        label: "Home",
      },
      {
        src: "/projects/integra/02-desktop-scroll.webp",
        alt: "Servicios y recursos de Integra",
        label: "Servicios",
      },
      {
        src: "/projects/integra/03-mobile.webp",
        alt: "Integra en movil",
        label: "Mobile",
      },
    ],
  },
  {
    id: "vistacampo",
    name: "Vistacampo",
    kind: "Diseño que también comunica seguridad.",
    categories: ["web"],
    description:
      "Sitio institucional multilingüe para un centro de rehabilitación de adicciones: contenido, equipo, instalaciones y blog en una estructura coherente.",
    result:
      "Vistacampo convierte un tema delicado en una experiencia donde la información genera confianza en vez de ansiedad.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "Arquitectura multilingüe y MDX: el equipo publica contenido sin depender de desarrollo.",
    agentRole: "Sin agente: arquitectura de contenido, i18n y SEO",
    status: "launched",
    stack: ["Next.js", "TypeScript", "MDX", "i18n"],
    year: "2026",
    liveUrl: "https://vistacampo-redesign-4r.vercel.app",
    sourceUrl: "https://github.com/adriaavila/vistacampo-redesign-4r",
    githubPushedAt: "2026-04-03T00:00:00Z",
    githubUpdatedLabel: "3 abr 2026",
    images: [],
  },
  {
    id: "avepane",
    name: "AVEPANE",
    kind: "Cincuenta años de trabajo social, legibles en una página.",
    categories: ["web"],
    description:
      "Sitio institucional para una organización venezolana dedicada a inclusión y formación de personas con discapacidad intelectual.",
    result:
      "AVEPANE ordena programas, impacto y formas de participar sin perder cercanía humana.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "Presenta la organización ante familias, aliados y posibles colaboradores con una sola pieza.",
    agentRole: "Sin agente: narrativa institucional y estructura de contenido",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Radix UI"],
    year: "2026",
    liveUrl: "https://avepane.org",
    sourceUrl: "https://github.com/adr24/avepane",
    githubPushedAt: "2026-05-25T00:00:00Z",
    githubUpdatedLabel: "25 may 2026",
    images: [],
  },
  {
    id: "samer",
    name: "SAMER",
    kind: "El comprador ve avanzar su obra sin llamar a nadie.",
    categories: ["web"],
    description:
      "Sitio institucional de una constructora e inmobiliaria, con catálogo de proyectos y avance de obra por desarrollo.",
    result:
      "SAMER convierte los dos años de silencio entre la firma y la entrega en una razón para volver al sitio.",
    businessGoal: "reduce_costs",
    businessOutcome:
      "La página de avance de obra absorbe las llamadas de '¿cómo va lo mío?' que consumían al equipo comercial.",
    agentRole: "Sin agente: transparencia de obra como función de producto",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Base UI"],
    year: "2026",
    liveUrl: "https://samer-rouge.vercel.app",
    githubPushedAt: "2026-07-29T00:00:00Z",
    githubUpdatedLabel: "29 jul 2026",
    images: [],
  },
  {
    id: "viaja-ven",
    name: "Viaja Ven",
    kind: "Inspirar y ayudar a decidir en la misma interfaz.",
    categories: ["web", "webapp"],
    description:
      "Plataforma de turismo gastronómico en Colonia Tovar: explorar experiencias, armar rutas temáticas y compartir el itinerario.",
    result:
      "Viaja Ven junta veinte pestañas y una nota de voz en un solo objeto compartible.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "El itinerario es la unidad que se manda por WhatsApp: la distribución vive dentro del producto.",
    agentRole: "Sin agente: descubrimiento y planificación guiada",
    status: "launched",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    year: "2026",
    liveUrl: "https://viaja-ven.vercel.app",
    sourceUrl: "https://github.com/adriaavila/viaja-ven",
    githubPushedAt: "2026-03-12T00:00:00Z",
    githubUpdatedLabel: "12 mar 2026",
    images: [],
  },
  {
    id: "kawsay",
    name: "Kawsay",
    kind: "Vender origen, no solo grano.",
    categories: ["web"],
    description:
      "Ecommerce de café de especialidad con catálogo, colecciones, checkout y la narrativa de origen dentro del camino de compra.",
    result:
      "Kawsay pone orígenes e impacto en la ruta de conversión, no en una página enterrada en el footer.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "Sostiene el precio del café de especialidad frente a un producto que cuesta la cuarta parte y se ve igual en una foto.",
    agentRole: "Sin agente: contenido de marca en el camino de compra",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    year: "2025",
    liveUrl: "https://kawsay.vercel.app",
    githubPushedAt: "2025-08-25T00:00:00Z",
    githubUpdatedLabel: "25 ago 2025",
    images: [],
  },
  {
    id: "dream-drop",
    name: "Dream Drop",
    kind: "Una tienda construida alrededor de la ventana, no del catálogo.",
    categories: ["web"],
    description:
      "Ecommerce de lanzamientos por tiempo limitado, con la interfaz diseñada para comunicar escasez sin volverse ansiosa.",
    result:
      "Dream Drop aplica el mismo stack de ecommerce a una lógica comercial distinta: el drop en vez del stock permanente.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "La urgencia se comunica por diseño, sin contadores falsos ni presión artificial.",
    agentRole: "Sin agente: dirección visual y ritmo de lanzamiento",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Radix UI", "Framer Motion"],
    year: "2026",
    liveUrl: "https://v0-katachi-roan-sigma.vercel.app",
    githubPushedAt: "2026-06-09T00:00:00Z",
    githubUpdatedLabel: "9 jun 2026",
    images: [],
  },
  {
    id: "ainetworking-canada",
    name: "AiNetworking Canada",
    kind: "Salió a producción como plataforma, no como lista de espera.",
    categories: ["web", "webapp"],
    description:
      "Sitio público y plataforma de miembros para una organización canadiense de IA: hubs, aplicaciones, eventos y área autenticada.",
    result:
      "AiNetworking Canada lanzó con el producto adentro: nueve canales, tablero de colaboración y onboarding con consentimiento explícito.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "El miembro que se registra encuentra a alguien con quien hablar el mismo día, en vez de un correo de bienvenida.",
    agentRole: "Sin agente: matcher de hubs y rutas de participación",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Convex", "Better Auth"],
    year: "2026",
    liveUrl: "https://ainetworking-org.vercel.app",
    githubPushedAt: "2026-07-31T00:00:00Z",
    githubUpdatedLabel: "31 jul 2026",
    images: [],
  },
  {
    id: "pausa",
    name: "Pausa",
    kind: "En crisis, dos toques valen más que un dashboard.",
    categories: ["webapp"],
    description:
      "App privada mobile-first de acompañamiento en recuperación: check-ins diarios, curva de recuperación, grounding y contactos de apoyo.",
    result:
      "Pausa trata la fricción como el producto, no como un detalle de interfaz.",
    businessGoal: "reduce_costs",
    businessOutcome:
      "PWA con notificaciones y datos privados por usuario, pensada para uso diario sostenido.",
    agentRole: "Insights diarios asistidos por IA",
    status: "improving",
    stack: ["React", "Vite", "Supabase", "Tailwind CSS"],
    year: "2026",
    liveUrl: "https://pausa-beta.vercel.app",
    githubPushedAt: "2026-07-08T00:00:00Z",
    githubUpdatedLabel: "8 jul 2026",
    images: [],
  },
  {
    id: "santorini",
    name: "Santorini Engine",
    kind: "Contenido con IA sin inventar un solo dato.",
    categories: ["automation"],
    description:
      "Motor interno de contenido y ventas para un proyecto residencial: conocimiento, estrategia, batches, producción, analítica y aprendizajes conectados.",
    result:
      "Santorini Engine publica todas las semanas con una regla de verdad incorporada.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "Precio, entrega y financiamiento se marcan como pendientes de verificación en vez de rellenarse: en vivienda, una cifra inventada no es un error de copy.",
    agentRole: "Agente de marketing con aprobación humana",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Markdown", "Zod"],
    year: "2026",
    githubPushedAt: "2026-07-19T00:00:00Z",
    githubUpdatedLabel: "19 jul 2026",
    images: [],
  },
  {
    id: "waha-fisio-agent",
    name: "Agente de Citas",
    kind: "Un agente que cierra la transacción, no que responde bonito.",
    categories: ["automation"],
    description:
      "Agente de WhatsApp para fisioterapia: conversa en español, consulta disponibilidad real en Cal.com, reserva la cita y envía recordatorios.",
    result:
      "El agente agenda sin que nadie del consultorio toque el teléfono.",
    businessGoal: "both",
    businessOutcome:
      "Contesta a las 11:00 en vez de a las 19:00, que es cuando la persona ya reservó en otro lado.",
    agentRole: "Agente de agendamiento con herramientas reales",
    status: "demo",
    stack: ["Python", "FastAPI", "WAHA", "Cal.com"],
    year: "2026",
    sourceUrl: "https://github.com/adriaavila/waha-fisio-agent",
    githubPushedAt: "2026-06-27T00:00:00Z",
    githubUpdatedLabel: "27 jun 2026",
    images: [],
  },
  {
    id: "expense-inbox-agent",
    name: "Expense Inbox",
    kind: "La foto del recibo entra; el gasto sale estructurado.",
    categories: ["automation"],
    description:
      "Microservicio que convierte texto, nota de voz, foto o PDF en un gasto estructurado. Diseñado para colgarse de n8n.",
    result:
      "Expense Inbox elimina la tarde de fin de mes transcribiendo papeles arrugados.",
    businessGoal: "reduce_costs",
    businessOutcome:
      "Contrato de API, autenticación, esquema de datos y health check: lo que separa un agente de algo de lo que se puede depender.",
    agentRole: "Agente de captura y estructuración de gastos",
    status: "launched",
    stack: ["Python", "FastAPI", "OpenAI", "Postgres"],
    year: "2026",
    githubPushedAt: "2026-04-26T00:00:00Z",
    githubUpdatedLabel: "26 abr 2026",
    images: [],
  },
  {
    id: "frontdesk-ai",
    name: "Frontia CRM",
    kind: "No falta tráfico: falta quien recupere al que no cerró.",
    categories: ["automation"],
    description:
      "Agente que atiende llamadas, califica leads, mantiene un pipeline de ventas y hace seguimiento automático.",
    result:
      "Frontia CRM ataca la parte cara del embudo: el lead pagado que se pierde después del primer contacto.",
    businessGoal: "both",
    businessOutcome:
      "Seguimiento automático sobre leads ya pagados, que es el dinero que el negocio ya gastó y no cobró.",
    agentRole: "Recepcionista y seguimiento comercial",
    status: "prototype",
    stack: ["React", "TypeScript", "TanStack Start", "Supabase"],
    year: "2026",
    githubPushedAt: "2026-08-01T00:00:00Z",
    githubUpdatedLabel: "1 ago 2026",
    images: [],
  },
];

export const PORTFOLIO_PROJECTS: PortfolioProject[] = RAW_PORTFOLIO_PROJECTS.map(
  (project) => {
    const sync = SYNC.projects[project.id];
    if (!sync) return project;
    return {
      ...project,
      githubPushedAt: sync.githubPushedAt ?? project.githubPushedAt,
      githubUpdatedLabel: sync.githubUpdatedLabel ?? project.githubUpdatedLabel,
      // ponytail: las capturas escritas a mano ganan; el sync solo rellena las vacias
      images: project.images.length > 0 ? project.images : (sync.images ?? []),
    };
  },
);

const FEATURED_IDS = ["rei-fm", "mistica", "frontai-landing", "soapy"] as const;

export const FEATURED_PORTFOLIO_PROJECTS = FEATURED_IDS.map((id) =>
  PORTFOLIO_PROJECTS.find((project) => project.id === id),
).filter((project): project is PortfolioProject => Boolean(project));
