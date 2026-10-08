/**
 * La secuencia de correos en frío: tres pasos (días 0, 3 y 8), en español de
 * «usted», cortos y en texto plano. Sin HTML, sin imágenes, sin píxel de
 * apertura; los únicos enlaces son a allok.fun. Puro: sin red ni base.
 */
import { sectorKind, slugify } from "@/lib/demo-agent";
import { VERTICALS } from "@/lib/seo-pages";
import { DEFAULT_REPLY_TO, SITE_URL, unsubscribeUrl } from "@/lib/outreach";

export type OutreachContactForEmail = {
  email: string;
  businessName: string;
  demoSlug: string | null;
  sector: string;
  /** `oferta_1_linea` del CSV; vacío si no hay. */
  offer?: string | null;
};

export type RenderedEmail = {
  subject: string;
  text: string;
  headers: Record<string, string>;
  /** A dónde lleva el correo (para revisar el dry-run de un vistazo). */
  link: string;
};

const SIGNATURE = "Adrián, allok";
const FOOTER_CONTACT = `allok · ${DEFAULT_REPLY_TO}`;

/** «CLÍNICA SONRISA, S.A. DE C.V.» → «Clínica Sonrisa»: sin la razón social y sin gritar. */
export function displayName(name: string): string {
  let n = name
    .replace(/\s+/g, " ")
    .replace(/[,.\s]+(s\.?\s?a\.?\s?p?\.?\s?i?\.?\s?(de\s+)?c\.?\s?v\.?|s\.?\s?a\.?\s?s\.?|s\.?\s?de\s+r\.?\s?l\.?(\s+de\s+c\.?\s?v\.?)?|s\.?\s?a\.?|ltda\.?|e\.?\s?u\.?)\s*$/i, "")
    .trim();
  const letters = n.replace(/[^\p{L}]/gu, "");
  if (letters.length > 3 && letters === letters.toUpperCase()) {
    const small = new Set(["de", "del", "la", "las", "los", "y", "e", "en", "el"]);
    n = n
      .toLowerCase()
      .split(" ")
      .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(" ");
  }
  return n || name.trim();
}

function utm(step: number): string {
  return `utm_source=cold_email&utm_medium=email&utm_campaign=q4_demo&utm_content=step${step}`;
}

const ACADEMIA = /(academ|escuela|curso|idioma|ingles|musica|danza|baile|instituto|colegio|tutor|clases|formacion|capacita|preuniversit|preicfes)/;
const SECTOR_RULES: [RegExp, string][] = [
  [/(dental|dentist|odonto|ortodon)/, "clinicas-dentales"],
  [/(estetic|spa|belleza|derma|cosmet|laser|facial)/, "clinicas-esteticas"],
  [/(taller|mecanic|automotr|servicio-tecnico|reparacion)/, "talleres"],
  [/(inmobiliari|bienes-raices|real-estate)/, "inmobiliarias"],
  [/(tienda|ecommerce|e-commerce|boutique)/, "tiendas-online"],
];

/**
 * La página `/whatsapp-para/<x>` que corresponde al sector, o `null`. Entiende
 * el formato del CSV de leads, `categoria (subtipo)`: en
 * «clinica_estetica_dermatologia_dental (estética)» manda el subtipo, y una
 * academia de belleza es una academia, no una clínica.
 */
export function sectorPageSlug(sector: string): string | null {
  const full = slugify(sector);
  const sub = slugify(/\(([^)]+)\)/.exec(sector)?.[1] ?? "");
  let hit: string | null = null;
  if (ACADEMIA.test(full)) hit = "academias";
  else hit = (sub && SECTOR_RULES.find(([re]) => re.test(sub))?.[1]) || SECTOR_RULES.find(([re]) => re.test(full))?.[1] || null;
  return hit && VERTICALS.some((v) => v.slug === hit) ? hit : null;
}

/**
 * El gancho del primer correo: la primera frase de lo que el negocio dice que
 * ofrece, si se lee bien entre comillas. «Musicala: escuela de música, danza…»
 * → «escuela de música, danza…». `null` si es muy corta o no se puede acortar
 * limpio: mejor sin gancho que con uno que suene a plantilla.
 */
export function offerHook(offer: string | null | undefined): string | null {
  let o = (offer ?? "").replace(/\s+/g, " ").trim();
  if (!o || /https?:|www\.|@/.test(o)) return null;
  const colon = o.indexOf(":");
  if (colon > 0 && colon < 60) o = o.slice(colon + 1).trim();
  o = o.split(";")[0].trim().replace(/[.,;:\s]+$/, "");
  const MAX = 100;
  if (o.length > MAX) {
    const cut = o.slice(0, MAX);
    const comma = cut.lastIndexOf(",");
    if (comma < 30) return null;
    o = cut.slice(0, comma).trim();
  }
  // Paréntesis sin cerrar tras el corte: se lee roto.
  if ((o.match(/\(/g)?.length ?? 0) !== (o.match(/\)/g)?.length ?? 0)) return null;
  if (o.length < 20) return null;
  // «Clases de baile…» → «clases de baile…»; «PreICFES…» o «Invisalign…» se quedan como vienen.
  return /^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+(?=[\s,]|$)/.test(o) && !/^(Invisalign|Botox|Sculptra)/.test(o) ? o.charAt(0).toLowerCase() + o.slice(1) : o;
}

/**
 * El enlace del correo: la demo del negocio, la página de su sector o la del
 * agente de WhatsApp. Nunca la portada: desde 2026-10 `/` vende proyectos de
 * estudio, no el agente de US$99.
 */
export function outreachLink(contact: Pick<OutreachContactForEmail, "demoSlug" | "sector">, step: number): string {
  if (contact.demoSlug) return `${SITE_URL}/demo/${contact.demoSlug}?${utm(step)}`;
  const page = sectorPageSlug(contact.sector);
  return page ? `${SITE_URL}/whatsapp-para/${page}?${utm(step)}` : `${SITE_URL}/agente-whatsapp?${utm(step)}`;
}

/** A quién atiende el negocio: pacientes, alumnos o clientes. */
function audience(sector: string): string {
  const kind = sectorKind(sector);
  return kind === "clinica" ? "pacientes" : kind === "academia" ? "alumnos" : "clientes";
}

function booking(sector: string): string {
  const kind = sectorKind(sector);
  return kind === "academia" ? "aparta el lugar a quien quiere inscribirse" : "agenda la cita";
}

function step1(c: OutreachContactForEmail, link: string): { subject: string; body: string } {
  const name = displayName(c.businessName);
  const hook = offerHook(c.offer);
  if (c.demoSlug) {
    return {
      subject: `Le enseñé a un agente a contestar como ${name}`,
      body: [
        `Hola, equipo de ${name}:`,
        hook
          ? `Vi en su web lo que ofrecen («${hook}») y, solo con lo que publican ahí, armé un agente de WhatsApp que contesta como ustedes. Puede probarlo aquí, sin registrarse:`
          : `Tomé lo que ${name} publica en su web (servicios, horarios, dónde están) y armé con eso un agente de WhatsApp que contesta como ustedes. Puede probarlo aquí, sin registrarse:`,
        link,
        `Pregúntele lo que suelen preguntar sus ${audience(c.sector)}. Si algo lo contesta mal, me sirve saberlo.`,
        `Si le gustaría tenerlo en el WhatsApp de ${name}, basta con responder este correo.`,
      ].join("\n\n"),
    };
  }
  return {
    subject: `Las preguntas que llegan al WhatsApp de ${name}`,
    body: [
      `Hola, equipo de ${name}:`,
      `${hook ? `Vi en su web lo que ofrecen («${hook}»). ` : ""}Casi todo lo que llega al WhatsApp de un negocio como el suyo son las mismas preguntas: cuánto cuesta, qué horarios tienen, si hay lugar esta semana.`,
      `Hago allok, un agente que contesta eso en su WhatsApp con sus precios y horarios reales, y ${booking(c.sector)}. Aquí se ve cómo funciona:`,
      link,
      `Si quiere, le armo uno con la información de ${name} para que lo pruebe antes de decidir nada. Basta con responder este correo.`,
    ].join("\n\n"),
  };
}

function step2(c: OutreachContactForEmail, link: string): { subject: string; body: string } {
  const name = displayName(c.businessName);
  return {
    subject: `${name}: los mensajes que llegan de noche`,
    body: [
      `Hola de nuevo:`,
      `Una cosa concreta: muchos mensajes llegan de noche o en fin de semana, cuando nadie puede contestar, y quien no recibe respuesta suele preguntar en otro lado.`,
      `El agente contesta en ese momento con los datos de ${name} y ${sectorKind(c.sector) === "academia" ? "deja apartado el lugar" : "deja la cita agendada"}; ustedes lo ven al abrir. ${c.demoSlug ? "La demo sigue aquí:" : "Así funciona:"}`,
      link,
    ].join("\n\n"),
  };
}

function step3(c: OutreachContactForEmail, link: string): { subject: string; body: string } {
  const name = displayName(c.businessName);
  return {
    subject: `Último correo sobre el WhatsApp de ${name}`,
    body: [
      `Hola:`,
      `No quiero llenarle la bandeja, así que este es mi último correo sobre el tema.`,
      `Si más adelante quieren que el WhatsApp de ${name} conteste solo, aquí lo encuentran:`,
      link,
      `Y si no es para ustedes, no hace falta responder. Gracias por leerme.`,
    ].join("\n\n"),
  };
}

/**
 * El correo del paso `step` (1–3) para ese contacto. `secret` firma el enlace
 * de baja (`OUTREACH_SECRET`); `replyTo` es `OUTREACH_REPLY_TO`.
 */
export function renderOutreachEmail(
  contact: OutreachContactForEmail,
  step: number,
  opts: { secret: string; replyTo?: string },
): RenderedEmail {
  const link = outreachLink(contact, step);
  const parts = step === 1 ? step1(contact, link) : step === 2 ? step2(contact, link) : step === 3 ? step3(contact, link) : null;
  if (!parts) throw new Error(`Paso fuera de la secuencia: ${step}`);
  const unsub = unsubscribeUrl(contact.email, opts.secret);
  const replyTo = opts.replyTo || DEFAULT_REPLY_TO;
  const text = [
    parts.body,
    SIGNATURE,
    `--\nSi prefiere no recibir más correos míos, puede darse de baja aquí: ${unsub}\n${FOOTER_CONTACT}`,
  ].join("\n\n");
  return {
    subject: parts.subject,
    text: `${text}\n`,
    link,
    headers: {
      "List-Unsubscribe": `<${unsub}>, <mailto:${replyTo}?subject=baja>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
