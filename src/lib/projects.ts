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

export const PROJECTS_LAST_SYNCED_AT = "2026-05-25";

export const PROJECT_CATEGORIES: {
  id: "all" | ProjectCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "all",
    label: "Todos",
    description: "Los últimos proyectos sincronizados desde GitHub.",
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

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: "shopea",
    name: "Shopea",
    kind: "Ecommerce por WhatsApp",
    categories: ["webapp", "web"],
    description:
      "Catálogo, checkout y cobro en un solo link. El cliente elige pagar en divisa o bolívares y el pedido cae al WhatsApp con el total correcto.",
    result:
      "Convierte un perfil de Instagram o un grupo de WhatsApp en una tienda real, sin fricción ni Marketplace.",
    businessGoal: "increase_revenue",
    businessOutcome: "Ordena catálogo, cobro y pedido para convertir conversaciones en compras completas.",
    agentRole: "Asistente de catálogo y preparación de pedidos",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Convex", "Clerk"],
    year: "2026",
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
    name: "rei",
    kind: "Real estate operations",
    categories: ["webapp"],
    description:
      "Plataforma para administrar propiedades, contratos, propietarios e ingresos sin depender de hojas sueltas.",
    result:
      "Centraliza la operación inmobiliaria: cartera, vencimientos y cobros quedan visibles para decidir más rápido.",
    businessGoal: "reduce_costs",
    businessOutcome: "Reúne propiedades, contratos y cobros para reducir seguimiento manual y decisiones tardías.",
    agentRole: "Copiloto de seguimiento operativo",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Postgres", "Stripe"],
    year: "2026",
    liveUrl: "https://rei-fm.vercel.app",
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
    kind: "AI front desk",
    categories: ["web", "automation"],
    description:
      "Agente de front desk con IA que atiende llamadas, califica leads, agenda citas y registra el seguimiento de cada conversacion.",
    result:
      "Convierte una promesa tecnica en una oferta vendible con demo visual, prueba operacional y CTA directo a llamada.",
    businessGoal: "both",
    businessOutcome: "Explica un agente complejo con una demostración que conecta atención, agenda y seguimiento.",
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
    kind: "Laundry operations",
    categories: ["webapp", "automation"],
    description:
      "Sistema para lavanderias con ordenes, rutas, estados y notificaciones para mantener cada entrega bajo control.",
    result:
      "Convierte el mostrador, el taller y el reparto en un flujo visible donde cada prenda tiene estado y responsable.",
    businessGoal: "reduce_costs",
    businessOutcome: "Hace visible cada orden, ruta y responsable para evitar retrabajo y entregas sin contexto.",
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
    kind: "Wellness SaaS",
    categories: ["webapp"],
    description:
      "Sistema para una escuela de natacion: alumnos, horarios, asistencia, productos y cobros en bolivares y divisa.",
    result:
      "Reemplaza cuadernos y grupos de WhatsApp por una operación clara para profesores, administración y cobranza.",
    businessGoal: "reduce_costs",
    businessOutcome: "Unifica alumnos, horarios, asistencia y cobros para reducir administración manual.",
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
];

const FEATURED_IDS = ["rei-fm", "mistica", "frontai-landing", "soapy"] as const;

export const FEATURED_PORTFOLIO_PROJECTS = FEATURED_IDS.map((id) =>
  PORTFOLIO_PROJECTS.find((project) => project.id === id),
).filter((project): project is PortfolioProject => Boolean(project));
