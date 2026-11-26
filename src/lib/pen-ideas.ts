import type { GlyphId } from "./pen-linea";

/**
 * El cuaderno de /pen: ideas cortas de Adrián, cada una con su enlace y su
 * imagen al compartir. Tienen la misma gramática que la página: una creencia
 * común que la línea tacha, y lo que él piensa, que la línea subraya.
 *
 * Para sumar una idea basta agregarla aquí: la página, la imagen al compartir
 * y los botones salen solos. La más nueva va primero.
 *
 * Regla: cada idea se apoya en algo que se puede ver en este sitio. Nada de
 * cifras ni de anécdotas que no estén en sus proyectos.
 */
export type Idea = {
  /** La dirección: /pen/ideas/<slug>. No se cambia una vez compartida. */
  slug: string;
  /** Lo que se suele creer: lo que la línea tacha. Corto. */
  belief: string;
  /** La idea, en una línea: lo que la línea subraya, y lo que se lee al compartir. */
  title: string;
  /** Dos o tres párrafos cortos, en primera persona. */
  body: string[];
  /** De qué proyecto sale, con su enlace dentro del sitio. */
  from?: { text: string; href: string };
  glyph: GlyphId;
};

export const IDEAS: Idea[] = [
  {
    slug: "start-with-the-sentence",
    belief: "Start with the list of features.",
    title: "I start with the sentence the owner is tired of saying.",
    body: [
      "“Every buyer asks me the same things on WhatsApp.” “I spend the month chasing neighbors for their fee.” Nobody says “I need a platform”. They say the thing that wears them out.",
      "So that sentence goes at the top of the page before anything gets built. If I can’t cross it out at the end, I built the wrong thing, however good it looks.",
    ],
    from: { text: "It’s how every project on this page begins", href: "/pen#work" },
    glyph: "bubble",
  },
  {
    slug: "the-ai-proposes",
    belief: "Let the AI handle it.",
    title: "The AI proposes. A person says ok.",
    body: [
      "In REI, the model reads the photo or the PDF of each bill and proposes the entry. Reading bills is the slow, boring part, and a machine is good at it.",
      "But nothing goes into the month’s close without the manager’s ok. The decision is the part worth protecting, so it stays with the person who answers for it.",
    ],
    from: { text: "From REI, building management", href: "/casos/rei" },
    glyph: "document",
  },
  {
    slug: "survive-a-bad-afternoon",
    belief: "It works, as long as the wifi does.",
    title: "Software should survive a bad afternoon.",
    body: [
      "A shop doesn’t close because the internet dropped. People are still in line, some paying in dollars and some in bolívares.",
      "So Cuadra keeps selling when the connection goes, and catches up on its own when it comes back. I’d rather design for the afternoon when everything goes wrong than for the demo where nothing does.",
    ],
    from: { text: "From Cuadra, a point of sale for Venezuelan shops", href: "/pen#work" },
    glyph: "bolt",
  },
  {
    slug: "numbers-i-can-prove",
    belief: "Sales went up 300%.",
    title: "A number I can’t prove is a number I don’t write.",
    body: [
      "You won’t find big percentages on this site. I’d rather not put a figure on someone else’s business that I can’t back up.",
      "What you’ll find instead are screenshots of things that are running, and links so you can open them yourself. That’s the proof I can stand behind.",
    ],
    from: { text: "Open the work and check", href: "/pen#work" },
    glyph: "bars",
  },
];

export function findIdea(slug: string): Idea | undefined {
  return IDEAS.find((idea) => idea.slug === slug);
}

/** «01», «02»…: la más vieja es la 01, así el número de una idea no cambia cuando llega otra. */
export function ideaNumber(idea: Idea): string {
  const i = IDEAS.indexOf(idea);
  return String(IDEAS.length - i).padStart(2, "0");
}

export const SITE = "https://allok.fun";

export function ideaPath(idea: Idea): string {
  return `/pen/ideas/${idea.slug}`;
}

export type ShareLink = { id: "whatsapp" | "x" | "linkedin"; label: string; href: string };

/** Los enlaces para compartir: son `<a>` simples, funcionan sin JavaScript. */
export function shareLinks(path: string, text: string): ShareLink[] {
  const url = `${SITE}${path}`;
  const q = encodeURIComponent;
  return [
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${q(`${text} ${url}`)}` },
    { id: "x", label: "X", href: `https://x.com/intent/post?text=${q(text)}&url=${q(url)}` },
    { id: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${q(url)}` },
  ];
}

/** Lo que le llega a Adrián cuando alguien contesta una idea. */
export function ideaReply(idea: Idea): string {
  return `Hi Adrián, I read “${idea.title}” on allok.fun. Here’s what I think: `;
}
