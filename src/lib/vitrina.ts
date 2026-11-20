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

const TEXTO: Record<string, { tipo: string; linea: string; historia: string }> = {
  "rei-fm": {
    tipo: "Building management",
    linea: "Your building, managed.",
    historia:
      "Fees per unit, expenses with receipts and the monthly close with its reports, for buildings and condominiums in Bolivia and Venezuela. Rei reads the photo or PDF of each bill and proposes the entry; nothing goes into the close without the manager’s approval. Every resident sees their balance and how to pay from their own link, without installing anything.",
  },
  cuadra: {
    tipo: "Two-currency point of sale",
    linea: "Two currencies in one sale, and the close without spreadsheets.",
    historia:
      "A point of sale for Venezuelan businesses: charge in dollars or bolívares in the same sale, split payment across eight methods and keep the rate of every charge. If the internet drops, the sale stays on the device and syncs on its own. The close compares expected cash with what was counted, and the accountant gets read-only access to export the period’s books.",
  },
  vistacampo: {
    tipo: "Institutional site",
    linea: "A delicate subject, told with trust.",
    historia:
      "A multilingual site for an addiction treatment center: treatment, team, facilities and blog. Families arrive afraid; the information had to bring calm, not anxiety. The team publishes without waiting for a developer.",
  },
  samer: {
    tipo: "Construction company",
    linea: "Buyers compare lot, price and delivery before asking for a visit.",
    historia:
      "The sales site of a construction company in Tarija: the Santorini condominium, the Verona apartments and building on your own lot. Every house filters by lot, price and delivery date, and you can walk through it in seven stops with the project’s official images. To book a visit, WhatsApp opens with the message ready.",
  },
  kawsay: {
    tipo: "Specialty coffee",
    linea: "Selling the origin, not just the bean.",
    historia:
      "A Bolivian coffee store with catalogue, collections, checkout and the origin story woven into the buying path, not hidden in the footer.",
  },
  "parley-mundial": {
    tipo: "Social game",
    linea: "The office World Cup pool, now in an app.",
    historia:
      "A World Cup predictions game: profile, private leagues, leaderboard and its own identity. An informal ritual that now has a record, avatars and something worth sharing.",
  },
  integra: {
    tipo: "Consultancy",
    linea: "It explains itself before the first meeting.",
    historia:
      "Site and content engine for a digital transformation consultancy in hospitality and retail. A blog and resources the team publishes on its own: the firm’s judgment works before the call.",
  },
  "viaja-ven": {
    tipo: "Food tourism",
    linea: "Inspire and decide on the same screen.",
    historia:
      "A platform to explore Colonia Tovar: experiences, themed routes and itineraries. Twenty browser tabs and a voice note turned into a single thing you send on WhatsApp.",
  },
  "dream-drop": {
    tipo: "Drop-based store",
    linea: "It sells by limited time, not a fixed catalogue.",
    historia:
      "Ecommerce for limited drops. The design carries the urgency: no fake countdowns, no manufactured pressure.",
  },
  artistheway: {
    tipo: "Art store",
    linea: "Digital art presented as a collector’s piece.",
    historia:
      "A store for an art brand: visual catalogue, editorial storytelling and a checkout ready to charge. So the brand reads as something to collect, not something generic.",
  },
  "ainetworking-canada": {
    tipo: "AI community",
    linea: "From not knowing where to start to a six-month plan.",
    historia:
      "A bilingual site and member platform for a nonprofit AI community in Canada. Three paths (understand, lead, build) end in a personal six-month plan, and a navigator recommends where to start without asking for an account. Plus a calendar of AI events across the country, webinar bookings and consulting sessions.",
  },
  avepane: {
    tipo: "Social organization",
    linea: "Fifty years of social work, on a single page.",
    historia:
      "The site of a Venezuelan organization for the inclusion and training of people with intellectual disabilities. It lays out programs, impact and ways to join without losing the human warmth.",
  },
  soapy: {
    tipo: "Laundry operation",
    linea: "Every order, tracked from drop-off to delivery.",
    historia:
      "A four-step drop-off, statuses with history, routes, WhatsApp notices and an owner dashboard per branch. One service flow you can follow end to end.",
  },
  mistica: {
    tipo: "Swim school",
    linea: "Students, attendance and payments telling the same story.",
    historia:
      "A phone system for instructors and admin: schedules, attendance per class, payments with due dates and a dashboard with pending collections on one screen.",
  },
  "almacen-vc": {
    tipo: "Inventory",
    linea: "Critical stock shows before it runs out.",
    historia:
      "Stock by area for Vistacampo: goods in, goods out, stock up to date and alerts to buy in time. Every movement is on record.",
  },
  "taller-samer": {
    tipo: "Machine shop",
    linea: "Work orders, parts and hours per machine, without paper.",
    historia: "Work orders, clients, parts, statuses and hours per machine. The shop stops depending on paper and memory.",
  },
  "pace-running": {
    tipo: "App for coaches",
    linea: "Athletes, plans and metrics in one place.",
    historia: "For running coaches: tracking per athlete, plans that are easy to review and less chat scattered across four apps.",
  },
  pausa: {
    tipo: "Recovery companion",
    linea: "In a crisis, help is two taps away.",
    historia: "A private recovery app, built for the phone: daily check-ins, a progress curve, grounding exercises and support contacts.",
  },
  "frontai-landing": {
    tipo: "Site for a voice agent",
    linea: "It answers the phone and moves the call to the next step of the sale.",
    historia: "An AI voice agent that answers, understands, qualifies and files every call, and connects it to the next step of the sale.",
  },
};

const DISCIPLINA: Record<string, Disciplina[]> = {
  web: ["web"],
  webapp: ["producto"],
  automation: ["agentes"],
};

const casoPorProyecto = new Map(CASOS.flatMap((c) => c.projectIds.map((id) => [id, `/casos/${c.slug}`] as const)));

function aPieza(p: PortfolioProject): Pieza | null {
  const es = TEXTO[p.id];
  if (!es || p.images.length === 0) return null;
  const name = p.name.replace(" · agency edition", "");
  const images = p.images.map((img) => {
    // Las etiquetas de projects.ts ya vienen en inglés, como lo principal del sitio.
    const label = img.label;
    return {
      src: img.src,
      alt: `${name}: ${label}`,
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
  launched: "In use",
  improving: "Evolving",
  demo: "Demo",
  prototype: "Prototype",
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
  { id: "todo", label: "All" },
  { id: "web", label: "Websites & stores" },
  { id: "producto", label: "Systems & apps" },
  { id: "agentes", label: "Agents & automation" },
];
