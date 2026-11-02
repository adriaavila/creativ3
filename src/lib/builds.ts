// The builds: one entry each, and everything on the home reads from here —
// the showcases, the log, the next ship date and the closer's countdown.
// Nothing is typed twice, so a moved date moves everywhere.
//
// Rules from the design system (allok, sections "The site" and "Build"):
// dates and counts are facts; what isn't live data says so (every demo
// capture carries the demo label); the build that best answers the hero
// is `featured` and gets the page's one blue field.

export type BuildStatus = "live" | "building" | "archived";

export type Build = {
  slug: string;
  name: string;
  /** The one line under the name in its showcase. */
  line: string;
  /** For the log: the problem, in the words of whoever has it. */
  problem: string;
  /** For the log: what the build does about it. */
  does: string;
  /** Ship date, YYYY-MM-DD. A past date on a live build is when it shipped. */
  date: string;
  status: BuildStatus;
  featured?: boolean;
  /** Which scripted demo plays in its capture. */
  demo: "vocero" | "dilo" | "banter";
  /** What the capture's window bar says. */
  windowTitle: string;
  /** The build's own verb, e.g. "Try dilo". Only when there is something to try. */
  tryIt?: { label: string; url: string };
  code?: string;
};

export const BUILDS: Build[] = [
  {
    slug: "vocero",
    name: "vocero",
    line: "Your WhatsApp answers at 11 pm, in your customer's language, and books the slot.",
    problem: "The same question forty times a day",
    does: "your WhatsApp answers it, and books.",
    date: "2026-11-15",
    status: "building",
    featured: true,
    demo: "vocero",
    windowTitle: "WhatsApp · your business",
    code: "https://github.com/adriaavila/vocero-crm",
  },
  {
    slug: "dilo",
    name: "dilo",
    line: "Name what you feel. Say it out loud.",
    problem: "It's hard to say what you feel",
    does: "name it and say it out loud.",
    date: "2026-11-01",
    status: "live",
    demo: "dilo",
    windowTitle: "allok.fun/dilo",
  },
  {
    slug: "banter",
    name: "banter",
    line: "Practice English out loud, without the fear.",
    problem: "Speaking English feels embarrassing",
    does: "short conversations, out loud, no nitpicking.",
    date: "2026-11-29",
    status: "building",
    demo: "banter",
    windowTitle: "allok.fun/banter",
  },
];

/** One build every two weeks. */
export const CADENCE_DAYS = 14;

/** Where "Say hi" goes. */
export const SAY_HI = "mailto:hi@allok.fun";
export const GITHUB = "https://github.com/adriaavila";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-01" → "01 Nov 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

export function addDays(iso: string, days: number): string {
  const t = Date.parse(`${iso}T12:00:00Z`) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Today in Caracas, where the dates are kept, as YYYY-MM-DD. */
export function today(now = new Date()): string {
  return new Date(now.getTime() - 4 * 3_600_000).toISOString().slice(0, 10);
}

/** A live build shipped in the last two weeks. */
export function isNew(b: Build, now = today()): boolean {
  return b.status === "live" && b.date <= now && addDays(b.date, CADENCE_DAYS) > now;
}

/** The showcases: the featured build first, then what you can use today
 * (newest first), then what is still in the workshop. */
export function showcaseOrder(builds: Build[] = BUILDS): Build[] {
  const rank = (b: Build) => (b.featured ? 0 : b.status === "live" ? 1 : 2);
  return [...builds].sort((a, b) => rank(a) - rank(b) || b.date.localeCompare(a.date));
}

/** The log: newest first. */
export function logOrder(builds: Build[] = BUILDS): Build[] {
  return [...builds].sort((a, b) => b.date.localeCompare(a.date));
}

/** The next ship date: the earliest build still to ship, from today on. */
export function nextShip(builds: Build[] = BUILDS, now = today()): string | null {
  const ahead = builds.filter((b) => b.status === "building" && b.date >= now).map((b) => b.date).sort();
  return ahead[0] ?? null;
}

/** The reserved slot at the top of the log: one cadence after the last date on it. */
export function reservedSlot(builds: Build[] = BUILDS): string {
  const last = builds.map((b) => b.date).sort().at(-1) ?? today();
  return addDays(last, CADENCE_DAYS);
}
