export type ApplicationItem = {
  id: string;
  title: string;
  description: string;
  outcome: string;
  image: string;
  imageAlt: string;
  project: string;
};

export const APPLICATIONS: ApplicationItem[] = [
  {
    id: "sistemas-internos",
    title: "Sistemas internos",
    description:
      "Centraliza operaciones, tareas, documentos, inventario, proyectos, equipos y reportes.",
    outcome: "Menos información dispersa y una operación que todos pueden seguir.",
    image: "/projects/taller-samer/01-desktop.jpg",
    imageAlt: "Sistema interno de Taller Samer para registrar equipos y horas de trabajo",
    project: "Taller Samer · sistema operativo",
  },
  {
    id: "crm-ventas",
    title: "CRM y sistemas de ventas",
    description:
      "Organiza oportunidades, automatiza seguimientos y visualiza todo tu proceso comercial.",
    outcome: "Cada conversación llega al siguiente paso con contexto y responsable.",
    image: "/projects/frontai-landing/01-desktop.jpg",
    imageAlt: "Interfaz de Frontia para conversaciones, leads y seguimientos",
    project: "Frontia · atención y seguimiento",
  },
  {
    id: "portales-clientes",
    title: "Portales para clientes",
    description:
      "Permite consultar información, documentar solicitudes, realizar pagos y seguir el avance de un servicio.",
    outcome: "Más autonomía para el cliente y menos consultas repetitivas para tu equipo.",
    image: "/projects/rei-fm/02-desktop-scroll.jpg",
    imageAlt: "Portal de operaciones y cobranzas de la aplicación rei",
    project: "rei · portal de administración",
  },
  {
    id: "reservas",
    title: "Plataformas de reservas",
    description:
      "Gestiona horarios, disponibilidad, pagos, recordatorios y atención al cliente.",
    outcome: "Una agenda disponible todo el día sin coordinación manual constante.",
    image: "/projects/mistica/home.png",
    imageAlt: "Inicio de Mística para administrar clases, profesores y horarios",
    project: "Mística · gestión de clases",
  },
  {
    id: "propiedades",
    title: "Aplicaciones para propiedades",
    description:
      "Administra inmuebles, interesados, contratos, documentos, pagos y procesos comerciales.",
    outcome: "Cartera, vencimientos y cobranzas visibles en el mismo lugar.",
    image: "/projects/rei-fm/02-desktop-scroll.jpg",
    imageAlt: "Dashboard de propiedades, unidades, pagos y cobranzas de rei",
    project: "rei · operaciones inmobiliarias",
  },
  {
    id: "membresias",
    title: "Membresías y suscripciones",
    description:
      "Vende servicios, contenido, herramientas o acceso recurrente mediante pagos online.",
    outcome: "Acceso, recurrencia y servicio conectados en una sola experiencia.",
    image: "/projects/pace-running/01-desktop.jpg",
    imageAlt: "Aplicación Pace Running para administrar atletas, planes y seguimiento",
    project: "Pace Running · coaching SaaS",
  },
  {
    id: "dashboards",
    title: "Dashboards de gestión",
    description:
      "Convierte la información dispersa de tu empresa en métricas claras y útiles.",
    outcome: "Decisiones con contexto sin armar reportes manualmente.",
    image: "/projects/mistica/dashboard.png",
    imageAlt: "Dashboard de métricas, alumnos y cobranzas de Mística",
    project: "Mística · dashboard operativo",
  },
  {
    id: "automatizacion-ia",
    title: "Automatización e inteligencia artificial",
    description:
      "Reduce tareas repetitivas, resume información, clasifica solicitudes y ayuda a tu equipo a trabajar más rápido.",
    outcome: "Automatización visible, supervisable y conectada a un problema concreto.",
    image: "/projects/frontai-landing/01-desktop.jpg",
    imageAlt: "Panel de Frontia para automatizar atención, clasificación y seguimiento",
    project: "Frontia · agente de atención",
  },
];

export const FAQS = [
  {
    question: "¿Qué tipo de proyectos pueden construir?",
    answer:
      "Websites, landing pages, aplicaciones web, paneles, prototipos, sistemas de atención, automatizaciones, integraciones con WhatsApp y herramientas internas.",
  },
  {
    question: "¿Cuánto tarda un proyecto?",
    answer:
      "Una experiencia sencilla puede estar lista en aproximadamente una semana. Los prototipos y sistemas con más funciones se organizan en fases de varias semanas.",
  },
  {
    question: "¿Necesito tener todo definido?",
    answer:
      "No. Podemos comenzar con el problema, el proceso actual y el resultado que quieres conseguir.",
  },
  {
    question: "¿Trabajan con presupuestos pequeños?",
    answer:
      "Sí. Cuando el proyecto lo permite, proponemos una versión esencial que pueda validarse antes de invertir en nuevas funciones.",
  },
  {
    question: "¿Utilizan inteligencia artificial?",
    answer:
      "Sí, cuando aporta valor real. La usamos para atención inicial, clasificación, generación asistida, extracción de información y automatización de tareas específicas.",
  },
  {
    question: "¿Qué pasa después del lanzamiento?",
    answer:
      "Podemos continuar con mantenimiento, nuevas funciones, automatizaciones, analítica y mejoras basadas en resultados reales.",
  },
] as const;
