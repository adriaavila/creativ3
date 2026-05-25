import type { LucideIcon } from "lucide-react";
import { Building2, Dumbbell, Home, ShoppingBag, Sparkles, Stethoscope } from "lucide-react";

export type VerticalSlug = "clinicas" | "inmobiliarias" | "ecommerce" | "academias";

export type Vertical = {
  slug: VerticalSlug;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
  pain: string[];
  outcomes: string[];
  pilot: string;
  proof: string;
  message: string;
};

export const VERTICALS: Record<VerticalSlug, Vertical> = {
  clinicas: {
    slug: "clinicas",
    icon: Stethoscope,
    eyebrow: "Clinicas esteticas, wellness y salud privada",
    title: "Que cada consulta llegue con intención, contexto y próximo paso.",
    subtitle:
      "creativv convierte tu web, agenda y WhatsApp en un sistema comercial que educa, filtra y prepara al paciente antes de que recepción intervenga.",
    pain: [
      "Instagram genera interes, pero WhatsApp absorbe preguntas repetidas todo el dia.",
      "Los leads preguntan precio, desaparecen y nadie sabe donde se rompio el proceso.",
      "La experiencia digital no transmite el nivel de confianza que exige un servicio de salud.",
    ],
    outcomes: [
      "Landing de clinica o tratamiento con promesa, prueba y CTA claros.",
      "WhatsApp que filtra interes, presupuesto, urgencia y disponibilidad.",
      "Vista simple de leads, citas, origen y seguimiento.",
    ],
    pilot: "Piloto recomendado: intake WhatsApp + agenda + reporte diario en 14 dias.",
    proof: "Para clinicas con ticket medio/alto, agenda activa o tratamientos que necesitan confianza antes de precio.",
    message:
      "Hola, tengo una clinica/servicio wellness. Quiero ver si creativv puede mejorar mis leads, agenda y WhatsApp.",
  },
  inmobiliarias: {
    slug: "inmobiliarias",
    icon: Home,
    eyebrow: "Inmobiliarias, brokers y property managers",
    title: "Deja de perseguir curiosos. Atiende prospectos con contexto.",
    subtitle:
      "Creamos paginas, fichas y automatizaciones que separan al curioso del comprador, arrendatario o propietario con intención real.",
    pain: [
      "Llegan mensajes sin presupuesto, zona, fecha ni intención clara.",
      "Los portales capturan la demanda; tu marca queda como intermediario invisible.",
      "El seguimiento manual enfria prospectos que ya mostraron interes.",
    ],
    outcomes: [
      "Landing para captar propietarios, compradores o arrendatarios.",
      "WhatsApp/formulario que clasifica zona, presupuesto y timing.",
      "Pipeline liviano con proximas acciones y leads calientes.",
    ],
    pilot: "Piloto recomendado: captacion + calificacion de leads inmobiliarios en 14 dias.",
    proof: "Para equipos con inventario activo, gestion de propiedades o necesidad de captar dueños.",
    message:
      "Hola, tengo una inmobiliaria/servicio real estate. Quiero calificar mejor leads y captar mas conversaciones serias.",
  },
  ecommerce: {
    slug: "ecommerce",
    icon: ShoppingBag,
    eyebrow: "Ecommerce, marcas locales y tiendas con catalogo",
    title: "Tu tienda no deberia depender de que alguien responda a tiempo.",
    subtitle:
      "Diseñamos tiendas, landings y asistentes que responden dudas, recomiendan productos y recuperan conversaciones antes de que se enfrien.",
    pain: [
      "Preguntas de stock, envios, tallas, pagos y recomendaciones consumen demasiado tiempo.",
      "La experiencia visual no justifica el precio ni transmite confianza suficiente.",
      "Carritos, DMs y WhatsApps quedan abiertos sin una siguiente accion.",
    ],
    outcomes: [
      "Tienda o landing que eleva percepcion y reduce duda.",
      "Asistente para preguntas frecuentes, stock, envios y recomendaciones.",
      "Recuperacion de conversaciones, carritos o leads tibios.",
    ],
    pilot: "Piloto recomendado: asistente de ventas + seguimiento WhatsApp/email en 14 dias.",
    proof: "Para marcas que ya venden por Instagram, Shopify, Tiendanube, WhatsApp o catalogo.",
    message:
      "Hola, tengo un ecommerce/marca. Quiero mejorar conversion, respuestas y seguimiento con creativv.",
  },
  academias: {
    slug: "academias",
    icon: Dumbbell,
    eyebrow: "Academias, clases, coaches y servicios recurrentes",
    title: "Convierte interesados en alumnos antes de que se enfrie la motivacion.",
    subtitle:
      "creativv arma paginas, reservas y automatizaciones que explican planes, responden dudas y llevan a la persona correcta hacia prueba, cupo o pago.",
    pain: [
      "Horarios, precios, cupos y condiciones se responden una y otra vez.",
      "La marca digital se ve mas pequena que la experiencia real.",
      "Entre primer mensaje, prueba y pago no hay seguimiento confiable.",
    ],
    outcomes: [
      "Landing con planes, horarios, prueba y propuesta clara.",
      "WhatsApp que califica, agenda y recuerda.",
      "Sistema simple de leads, pagos, reservas o cupos.",
    ],
    pilot: "Piloto recomendado: intake + reserva/prueba + seguimiento en 14 dias.",
    proof: "Para academias, coaches y programas con ingresos recurrentes o cupos limitados.",
    message:
      "Hola, tengo una academia/servicio recurrente. Quiero captar mas interesados y ordenar reservas con creativv.",
  },
};

export const VERTICAL_LIST = Object.values(VERTICALS);

export const GENERAL_ICONS = {
  building: Building2,
  sparkles: Sparkles,
};
