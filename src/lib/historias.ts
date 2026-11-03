import dimensiones from "@/data/project-image-dimensions.json";
import { PIEZAS, type Disciplina, type Pieza } from "./vitrina";

/**
 * «Que el trabajo hable»: cuatro piezas contadas desde el problema del dueño,
 * en el orden en que la portada las pone en escena, y el agente de allok
 * después. Las reglas de `vitrina.ts` valen aquí: cada frase dice lo que la
 * pieza hace de verdad, sin métricas ni testimonios.
 */

/** Lo que se puede hacer desde una historia: abrir la pieza viva, leer su caso o ver el resto de sus pantallas. */
export type Accion =
  | { tipo: "web"; texto: string; href: string }
  | { tipo: "caso"; texto: string; href: string }
  | { tipo: "ficha"; texto: string };

export type Captura = {
  src: string;
  alt: string;
  /** Ancho entre alto, de las medidas reales del archivo. */
  ratio: number;
  /** La de celular se enmarca en su proporción: recortada a 16/10 dejaría de verse como un celular. */
  celular: boolean;
};

export type Historia = {
  /** La pieza de `PIEZAS` que cuenta: de ahí salen su nombre, su estado y su ficha. */
  id: string;
  n: string;
  donde: string;
  origen: "Cliente" | "Producto propio";
  /** La situación del dueño, en segunda persona. */
  escena: string;
  cuerpo: string;
  capturas: Captura[];
  /** La web pública, en la barra de la ventana: solo cuando existe. */
  url?: string;
  nota?: string;
  /** La primera va sólida; la segunda, como enlace. */
  acciones: [Accion, Accion];
  /** Va en el campo azul, el gran movimiento de la página. */
  campo?: boolean;
};

const MEDIDAS = dimensiones as Record<string, { width: number; height: number }>;

/**
 * Ancho entre alto del archivo, medido: primero las medidas que traen las
 * capturas de `PIEZAS` (projects-sync), después el json de dimensiones. Sin
 * medida, `null`: la prueba lo exige, porque una captura de celular sin medir
 * se enmarcaría en 16/10 y quedaría recortada.
 */
export function ratioMedido(src: string): number | null {
  const enPieza = PIEZAS.flatMap((p) => p.images).find((i) => i.src === src);
  if (enPieza?.ratio) return enPieza.ratio;
  const m = MEDIDAS[src];
  return m ? m.width / m.height : null;
}

function captura(src: string, alt: string): Captura {
  const ratio = ratioMedido(src) ?? 16 / 10;
  return { src, alt, ratio, celular: ratio < 1 };
}

// En el orden en que la portada las cuenta; el número sale de ese orden.
const CUATRO: Omit<Historia, "n">[] = [
  {
    id: "samer",
    donde: "Constructora en Tarija, Bolivia",
    origen: "Cliente",
    escena: "Cada interesado te pregunta lo mismo por WhatsApp: cuánto cuesta, cuánto mide el terreno, cuándo se entrega.",
    cuerpo:
      "En su web, cada casa se filtra por terreno, precio y fecha de entrega, y se recorre por dentro con las imágenes oficiales del proyecto. Quien quiere ir a verla pide la visita por WhatsApp, con el mensaje ya escrito.",
    capturas: [
      captura(
        "/projects/samer/01-desktop.jpg",
        "La web de SAMER: el condominio Santorini, en Tarija, con su próxima entrega y el botón para agendar una visita",
      ),
    ],
    url: "https://desamer.com",
    acciones: [
      { tipo: "web", texto: "Abrir desamer.com", href: "https://desamer.com" },
      { tipo: "caso", texto: "Leer el caso", href: "/casos/samer" },
    ],
  },
  {
    id: "rei-fm",
    donde: "Administración de edificios · Bolivia y Venezuela",
    origen: "Producto propio",
    escena: "Cada mes, perseguir a cada vecino por su cuota y cuadrar a mano las facturas del edificio.",
    cuerpo:
      "Lee la foto o el PDF de cada factura y propone el registro, pero nada entra al cierre del mes sin el ok del administrador. Cada vecino ve cuánto debe y cómo pagar desde un enlace, sin instalar nada.",
    capturas: [
      captura(
        "/projects/rei-fm/02-desktop-scroll.jpg",
        "La web de REI con el panel de un edificio: unidades, facturas por revisar y pagos por verificar",
      ),
    ],
    url: "https://reiprop.tech",
    nota: "En la captura, datos de ejemplo.",
    acciones: [
      { tipo: "web", texto: "Abrir reiprop.tech", href: "https://reiprop.tech" },
      { tipo: "caso", texto: "Leer el caso", href: "/casos/rei" },
    ],
  },
  {
    id: "cuadra",
    donde: "Punto de venta para comercios de Venezuela",
    origen: "Producto propio",
    escena: "Te pagan una parte en dólares y otra en bolívares, y justo cuando hay gente esperando se cae el internet.",
    cuerpo:
      "Cobra en las dos monedas en la misma venta, reparte el pago entre ocho métodos y guarda la tasa de cada cobro. Si se cae el internet, sigue vendiendo y se pone al día sola. Al cierre, compara el efectivo esperado con el contado.",
    capturas: [
      captura(
        "/projects/cuadra/02-desktop-scroll.jpg",
        "La caja de Cuadra: cada producto con su precio en dólares y en bolívares, y el carrito con el total en las dos monedas",
      ),
    ],
    url: "https://sicuadra.vercel.app",
    acciones: [
      { tipo: "web", texto: "Abrir Cuadra", href: "https://sicuadra.vercel.app" },
      { tipo: "ficha", texto: "Ver más pantallas" },
    ],
    campo: true,
  },
  {
    id: "mistica",
    donde: "Escuela de natación",
    origen: "Cliente",
    escena: "Las clases, la asistencia y los pagos viven en lugares distintos, y saber quién debe qué es una tarde de revisar listas.",
    cuerpo:
      "Los instructores marcan la asistencia por clase desde el celular, cada cobro tiene su vencimiento y la cobranza pendiente se ve en una sola pantalla.",
    // Solo estas dos: son las capturas con los nombres de los alumnos tapados.
    // La app real pide entrar, así que no lleva url.
    capturas: [
      captura(
        "/projects/mistica/cobros-sin-nombres.png",
        "Los cobros de Mística en el celular: cada inscripción y mensualidad con su vencimiento",
      ),
      captura(
        "/projects/mistica/alumnos-sin-nombres.png",
        "Los alumnos de Mística en el celular: la clase de cada uno y si está al día, pendiente o en mora",
      ),
    ],
    acciones: [
      { tipo: "caso", texto: "Leer el caso", href: "/casos/mistica" },
      { tipo: "ficha", texto: "Ver más pantallas" },
    ],
  },
];

export const HISTORIAS: Historia[] = CUATRO.map((h, i) => ({ ...h, n: String(i + 1).padStart(2, "0") }));

/** El agente de allok: el mismo ritmo, sin captura. En su escenario va la demo con la web del dueño. */
export const AGENTE = {
  kicker: "Agente de WhatsApp · Producto de allok",
  escena: "Te escriben a las once de la noche preguntando precios, y nadie contesta hasta mañana.",
  nombre: "Tu agente de WhatsApp",
  cuerpo:
    "Aprende tus precios y tu forma de contestar de tus propios chats, responde y agenda la cita. Cuando una conversación necesita a una persona, te avisa al celular. Y no le contesta a nadie hasta que tú lo enciendas.",
  prueba: "Pruébalo con tu web",
  enlace: { texto: "Conocer el agente", href: "/agente-whatsapp" },
} as const;

export type Fila = { n: string; grupo: Disciplina; pieza: Pieza };

const CONTADAS = new Set(HISTORIAS.map((h) => h.id));
const GRUPOS: Disciplina[] = ["web", "producto", "agentes"];

/** Dentro de cada grupo, primero lo que alguien ya usa y al final las demos: un grupo no abre con un prototipo. */
const RANGO: Record<Pieza["status"], number> = { launched: 0, improving: 1, demo: 2, prototype: 3 };

/**
 * Todo lo demás, agrupado por su primera disciplina y numerado de corrido
 * después de las historias (05, 06…): así la portada nombra cada pieza una
 * sola vez, y el número dice cuántas lleva.
 */
export const OTRAS: Fila[] = GRUPOS.flatMap((grupo) =>
  PIEZAS.filter((p) => !CONTADAS.has(p.id) && p.disciplinas[0] === grupo)
    .sort((a, b) => RANGO[a.status] - RANGO[b.status])
    .map((pieza) => ({ grupo, pieza })),
).map((fila, i) => ({ ...fila, n: String(HISTORIAS.length + 1 + i).padStart(2, "0") }));
