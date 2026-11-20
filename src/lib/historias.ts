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
  /** El nombre de la pieza en `PIEZAS`, el mismo que va en la frase de WhatsApp. */
  nombre: string;
  /** La línea de la portada: lo que cambió para el dueño, en ocho palabras o menos. */
  linea: string;
  /** «Cliente» si es el trabajo de un negocio; «Mío» si es producto propio. Sale de `origen`. */
  tag: "Client" | "Mine";
  /** El dibujo de línea que acompaña al nombre en la portada. */
  glifo: "casa" | "unidades" | "recibo" | "carriles";
  /** En la portada, bajo la captura, cuando lo que se ve no es de un cliente real. */
  notaCorta?: string;
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
const CUATRO: Omit<Historia, "n" | "nombre" | "tag">[] = [
  {
    id: "samer",
    linea: "What buyers ask, answered on the site.",
    glifo: "casa",
    donde: "Construction company in Tarija, Bolivia",
    origen: "Cliente",
    escena: "Every buyer asks you the same things on WhatsApp: how much, how big is the lot, when is it delivered.",
    cuerpo:
      "On their site, every house filters by lot, price and delivery date, and you can walk through it with the project's official images. Whoever wants to see it books the visit on WhatsApp, with the message already written.",
    capturas: [
      captura(
        "/projects/samer/01-desktop.jpg",
        "The SAMER site: the Santorini condominium in Tarija, with its next delivery and the button to book a visit",
      ),
    ],
    url: "https://desamer.com",
    acciones: [
      { tipo: "web", texto: "Open desamer.com", href: "https://desamer.com" },
      { tipo: "caso", texto: "Read the case study", href: "/casos/samer" },
    ],
  },
  {
    id: "rei-fm",
    linea: "Every neighbor's fee, without chasing them.",
    glifo: "unidades",
    notaCorta: "Sample data",
    donde: "Building management · Bolivia and Venezuela",
    origen: "Producto propio",
    escena: "Every month, chasing each neighbor for their fee and reconciling the building's bills by hand.",
    cuerpo:
      "It reads the photo or PDF of each bill and proposes the entry, but nothing goes into the month's close without the manager's ok. Each neighbor sees what they owe and how to pay from a link, without installing anything.",
    capturas: [
      captura(
        "/projects/rei-fm/02-desktop-scroll.jpg",
        "The REI site with a building's dashboard: units, bills to review and payments to verify",
      ),
    ],
    url: "https://reiprop.tech",
    nota: "Sample data in the screenshot.",
    acciones: [
      { tipo: "web", texto: "Open reiprop.tech", href: "https://reiprop.tech" },
      { tipo: "caso", texto: "Read the case study", href: "/casos/rei" },
    ],
  },
  {
    id: "cuadra",
    linea: "Dollars and bolívares, even when the internet drops.",
    glifo: "recibo",
    donde: "Point of sale for Venezuelan shops",
    origen: "Producto propio",
    escena: "They pay you part in dollars and part in bolívares, and right when people are waiting, the internet drops.",
    cuerpo:
      "It charges in both currencies in the same sale, splits payment across eight methods and keeps the rate of every charge. If the internet drops, it keeps selling and catches up on its own. At closing, it compares expected cash with what was counted.",
    capturas: [
      captura(
        "/projects/cuadra/02-desktop-scroll.jpg",
        "The Cuadra register: each product priced in dollars and bolívares, and the cart with the total in both currencies",
      ),
    ],
    url: "https://sicuadra.vercel.app",
    acciones: [
      { tipo: "web", texto: "Open Cuadra", href: "https://sicuadra.vercel.app" },
      { tipo: "ficha", texto: "See more screens" },
    ],
    campo: true,
  },
  {
    id: "mistica",
    linea: "A swim school: who came, who owes.",
    glifo: "carriles",
    donde: "Swim school",
    origen: "Cliente",
    escena: "Classes, attendance and payments live in different places, and knowing who owes what takes an afternoon of checking lists.",
    cuerpo:
      "Instructors take attendance per class from their phone, every charge has its due date, and pending collections show on a single screen.",
    // Solo estas dos: son las capturas con los nombres de los alumnos tapados.
    // La app real pide entrar, así que no lleva url.
    capturas: [
      captura(
        "/projects/mistica/cobros-sin-nombres.png",
        "Mística payments on the phone: every enrollment and monthly fee with its due date",
      ),
      captura(
        "/projects/mistica/alumnos-sin-nombres.png",
        "Mística students on the phone: each one's class and whether they're paid up, pending or overdue",
      ),
    ],
    acciones: [
      { tipo: "caso", texto: "Read the case study", href: "/casos/mistica" },
      { tipo: "ficha", texto: "See more screens" },
    ],
  },
];

export const HISTORIAS: Historia[] = CUATRO.map((h, i) => ({
  ...h,
  n: String(i + 1).padStart(2, "0"),
  nombre: PIEZAS.find((p) => p.id === h.id)?.name ?? h.id,
  tag: h.origen === "Cliente" ? "Client" : "Mine",
}));

/** El agente de allok: el mismo ritmo, sin captura. En su escenario va la demo con la web del dueño. */
export const AGENTE = {
  kicker: "WhatsApp agent · An allok product",
  escena: "They message you at eleven at night asking for prices, and nobody answers until morning.",
  nombre: "Your WhatsApp agent",
  cuerpo:
    "It learns your prices and the way you answer from your own chats, replies and books the appointment. When a conversation needs a person, it alerts your phone. And it answers no one until you switch it on.",
  prueba: "Try it with your website",
  enlace: { texto: "Meet the agent", href: "/agente-whatsapp" },
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
