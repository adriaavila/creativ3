import imageDimensions from "@/data/project-image-dimensions.json";
import { CURATED_IMAGES, type ProjectDate, type ProjectStory } from "./project-editorial";
import syncData from "@/data/projects-sync.json";

export type ProjectCategory = "web" | "webapp" | "automation";

export type ProjectImage = {
  src: string;
  alt: string;
  label: string;
  width?: number;
  height?: number;
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
  chronology?: ProjectDate;
  story?: ProjectStory;
  attribution?: { name: string; url: string };
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
    label: "All",
    description: "The most recent work, synced from GitHub.",
  },
  {
    id: "web",
    label: "Web",
    description: "Landings, stores and public sites with a clear narrative.",
  },
  {
    id: "webapp",
    label: "Web app",
    description: "Dashboards, SaaS and operating systems for real businesses.",
  },
  {
    id: "automation",
    label: "Automation",
    description: "Agents, workflows and software that removes manual work.",
  },
];

const RAW_PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: "nea-agent", name: "Nea", kind: "From a WhatsApp conversation to a real appointment.",
    categories: ["automation"], description: "An open-source scheduling agent with qualification, calendar tools and human handover, connected to Vocero CRM.",
    result: "A supervised pilot with server-validated booking and explicit escalation.",
    businessGoal: "both", businessOutcome: "Connects customer conversations to the scheduling workflow.",
    agentRole: "Qualification and appointment scheduling", status: "prototype",
    stack: ["Python", "FastAPI", "Postgres", "WhatsApp"], year: "2026",
    sourceUrl: "https://github.com/adriaavila/nea-agent", githubPushedAt: "2026-09-06T10:28:02Z", githubUpdatedLabel: "6 Sep 2026", images: [],
  },
  {
    id: "vocero-crm", name: "Vocero · agency edition", kind: "An installation you can confidently hand over.",
    categories: ["webapp", "automation"], description: "An agency adaptation of Vocero CRM: readiness checks, account provisioning, pilot controls, calendar integration and a delivery workflow.",
    result: "A visible path from an unconfigured installation to a client-ready pilot.",
    businessGoal: "reduce_costs", businessOutcome: "Makes deployment readiness and handover explicit.",
    agentRole: "CRM integration and supervised agent delivery", status: "prototype",
    stack: ["Next.js", "TypeScript", "Postgres", "Docker"], year: "2026",
    sourceUrl: "https://github.com/adriaavila/vocero-crm", githubPushedAt: "2026-09-06T10:27:45Z", githubUpdatedLabel: "6 Sep 2026", images: [],
    attribution: { name: "Vocero CRM by Kevin Belier", url: "https://github.com/kevinrivm/vocero-crm" },
  },

  {
    id: "shopea",
    name: "Shopea",
    kind: "A simpler way to sell over WhatsApp.",
    categories: ["webapp", "web"],
    description:
      "Catalogue, checkout and multi-currency payments inside one experience built around how people actually buy.",
    result:
      "Shopea connects finding a product with the conversation where the sale actually happens.",
    businessGoal: "increase_revenue",
    businessOutcome: "Shopea connects finding a product with the conversation where the sale actually happens.",
    agentRole: "Catalogue and order-prep assistant",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Convex", "Clerk"],
    year: "2026",
    liveUrl: "https://shopea.vercel.app",
    githubPushedAt: "2026-05-16T00:00:00Z",
    githubUpdatedLabel: "16 may 2026",
    images: [
      {
        src: "/projects/shopea/01-desktop.jpg",
        alt: "Shopea landing on desktop",
        label: "Landing",
      },
      {
        src: "/projects/shopea/02-desktop-scroll.jpg",
        alt: "Shopea: how it works, payments and pricing",
        label: "How it works",
      },
      {
        src: "/projects/shopea/03-mobile.jpg",
        alt: "Shopea on mobile",
        label: "Mobile",
      },
    ],
  },
  {
    id: "rei-fm",
    name: "REI",
    kind: "New infrastructure for the property market.",
    categories: ["webapp"],
    description:
      "Marketplace, CRM, property administration, resident portal and supervised AI document processing.",
    result:
      "REI joins the parts of a property operation that normally live in separate tools.",
    businessGoal: "reduce_costs",
    businessOutcome: "REI joins the parts of a property operation that normally live in separate tools.",
    agentRole: "Operational follow-up copilot",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Postgres", "Stripe"],
    year: "2026",
    liveUrl: "https://reiprop.tech",
    githubPushedAt: "2026-05-25T13:39:30Z",
    githubUpdatedLabel: "25 may 2026",
    images: [
      {
        src: "/projects/rei-fm/01-desktop.jpg",
        alt: "REI dashboard on desktop",
        label: "Dashboard",
      },
      {
        src: "/projects/rei-fm/02-desktop-scroll.jpg",
        alt: "REI property operation, extended view",
        label: "Operation",
      },
      {
        src: "/projects/rei-fm/03-mobile.jpg",
        alt: "REI on mobile",
        label: "Mobile",
      },
    ],
  },
  {
    id: "frontai-landing",
    name: "Frontia",
    kind: "Conversations that turn into actions.",
    categories: ["web", "automation"],
    description:
      "An AI voice agent that answers, understands, qualifies and files every interaction.",
    result:
      "Frontia connects a phone call to the next step in the sales process.",
    businessGoal: "both",
    businessOutcome: "Frontia connects a phone call to the next step in the sales process.",
    agentRole: "Front-desk agent",
    status: "demo",
    stack: ["Next.js", "AI UX", "Vercel", "Motion"],
    year: "2026",
    liveUrl: "https://frontai-landing.vercel.app",
    githubPushedAt: "2026-05-25T01:32:12Z",
    githubUpdatedLabel: "25 may 2026",
    images: [
      {
        src: "/projects/frontai-landing/01-desktop.jpg",
        alt: "Frontia hero with the AI agent interface",
        label: "Hero",
      },
      {
        src: "/projects/frontai-landing/02-desktop-scroll.jpg",
        alt: "Problem and solution section on Frontia",
        label: "Story",
      },
      {
        src: "/projects/frontai-landing/03-mobile.jpg",
        alt: "Frontia on mobile",
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
      "World-Cup prediction game: build a profile, run private leagues, compete on picks, with an identity of its own.",
    result:
      "Turns an informal office pool into a social product with onboarding, avatars, a table and something worth sharing.",
    businessGoal: "increase_revenue",
    businessOutcome: "Turns a casual ritual into a shareable product with sign-up and a reason to come back.",
    agentRole: "Moderation and in-game support",
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
        alt: "Parlai Mundial sign-up screen",
        label: "Sign-up",
      },
      {
        src: "/projects/parley-mundial/02-desktop-scroll.jpg",
        alt: "Parlai Mundial, scrolled",
        label: "Flow",
      },
      {
        src: "/projects/parley-mundial/03-mobile.jpg",
        alt: "Parlai Mundial on mobile",
        label: "Mobile",
      },
    ],
  },
  {
    id: "artistheway",
    name: "Artistheway",
    kind: "Brand ecommerce",
    categories: ["web"],
    description:
      "Online store for an art brand: visual catalogue, editorial narrative and a checkout ready to take money.",
    result:
      "Orders discovery and purchase so the brand reads as collectable rather than generic.",
    businessGoal: "increase_revenue",
    businessOutcome: "Lifts discovery and purchase with an editorial experience that matches the brand.",
    agentRole: "Catalogue curator",
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
        alt: "Artistheway home on desktop",
        label: "Home",
      },
      {
        src: "/projects/artistheway/02-desktop-scroll.jpg",
        alt: "Artistheway catalogue, scrolled",
        label: "Catalogue",
      },
      {
        src: "/projects/artistheway/03-mobile.jpg",
        alt: "Artistheway on mobile",
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
      "App for running coaches: athletes, plans, sessions and weekly metrics on one surface.",
    result:
      "Gives the coach a measurable operation: per-athlete tracking, less scattered chat, plans that are easy to review.",
    businessGoal: "reduce_costs",
    businessOutcome: "Concentrates plans and tracking so coach and athletes stop coordinating across four apps.",
    agentRole: "Weekly check-in assistant",
    status: "improving",
    stack: ["Next.js", "Supabase", "TypeScript", "Analytics"],
    year: "2026",
    liveUrl: "https://pace-running-three.vercel.app",
    githubPushedAt: "2026-05-19T18:49:02Z",
    githubUpdatedLabel: "19 may 2026",
    images: [
      {
        src: "/projects/pace-running/01-desktop.jpg",
        alt: "Pace Running on desktop",
        label: "Dashboard",
      },
      {
        src: "/projects/pace-running/02-desktop-scroll.jpg",
        alt: "Pace Running, extended view",
        label: "Plans",
      },
      {
        src: "/projects/pace-running/03-mobile.jpg",
        alt: "Pace Running on mobile",
        label: "Mobile",
      },
    ],
  },
  {
    id: "soapy",
    name: "Soapy",
    kind: "Every order connected end to end.",
    categories: ["webapp", "automation"],
    description:
      "Intake, statuses, routes, notifications and delivery inside one operational experience.",
    result:
      "Soapy connects every part of the service so nothing gets lost on the way.",
    businessGoal: "reduce_costs",
    businessOutcome: "Soapy connects every part of the service so nothing gets lost on the way.",
    agentRole: "Status and notification operator",
    status: "launched",
    stack: ["Next.js", "Supabase", "WhatsApp", "Operations"],
    year: "2026",
    liveUrl: "https://soapy-sooty.vercel.app",
    githubPushedAt: "2026-05-11T17:17:16Z",
    githubUpdatedLabel: "11 may 2026",
    images: [
      {
        src: "/projects/soapy/01-desktop.jpg",
        alt: "Soapy dashboard for laundries",
        label: "Orders",
      },
      {
        src: "/projects/soapy/02-desktop-scroll.jpg",
        alt: "Soapy operations, extended view",
        label: "Route",
      },
      {
        src: "/projects/soapy/03-mobile.jpg",
        alt: "Soapy on mobile",
        label: "Mobile",
      },
    ],
  },
  {
    id: "mistica",
    name: "Mística",
    kind: "The operation behind a wellness experience.",
    categories: ["webapp"],
    description:
      "Students, schedules, attendance, products and payments inside one system built for a swimming school.",
    result:
      "Mística connects each student's experience to the operation that makes it possible.",
    businessGoal: "reduce_costs",
    businessOutcome: "Mística connects each student's experience to the operation that makes it possible.",
    agentRole: "Billing and operations assistant",
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
        alt: "Mística metrics dashboard",
        label: "Dashboard",
      },
      {
        src: "/projects/mistica/home.png",
        alt: "Mística home for instructors",
        label: "Home",
      },
      {
        src: "/projects/mistica/cobros.png",
        alt: "Mística billing module",
        label: "Billing",
      },
    ],
  },
  {
    id: "taller-samer",
    name: "Taller Samer",
    kind: "Workshop OS",
    categories: ["webapp", "automation"],
    description:
      "Software for a mechanic's workshop: work orders, customers, parts, statuses and service tracking.",
    result:
      "Makes every repair traceable from intake to handover, with less dependence on paper and memory.",
    businessGoal: "reduce_costs",
    businessOutcome: "Traceability across orders, parts and statuses, so the shop stops running on paper and memory.",
    agentRole: "Work-order tracking",
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
        alt: "Taller Samer dashboard",
        label: "Orders",
      },
      {
        src: "/projects/taller-samer/02-desktop-scroll.jpg",
        alt: "Taller Samer, extended view",
        label: "Tracking",
      },
      {
        src: "/projects/taller-samer/03-mobile.jpg",
        alt: "Taller Samer on mobile",
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
      "Warehouse control for Vistacampo: goods in, goods out, stock on hand and restocking calls.",
    result:
      "Cuts invisible inventory: every movement is recorded and the team sees critical stock before it runs out.",
    businessGoal: "reduce_costs",
    businessOutcome: "Records movements and flags low stock, so purchasing happens before the shelf is empty.",
    agentRole: "Critical-stock monitor",
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
        alt: "Almacén VC on desktop",
        label: "Panel",
      },
      {
        src: "/projects/almacen-vc/02-desktop-scroll.jpg",
        alt: "Almacén VC, extended view",
        label: "Movements",
      },
      {
        src: "/projects/almacen-vc/03-mobile.jpg",
        alt: "Almacén VC on mobile",
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
      "Agent for WhatsApp SaaS conversations: replies, qualifies, files context and sets up the next commercial step.",
    result:
      "Cuts manual reply load and turns inbound chats into structured opportunities.",
    businessGoal: "both",
    businessOutcome: "Sorts conversations and drafts next steps without hiding when a human has to step in.",
    agentRole: "Qualification and follow-up agent",
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
    kind: "A consultancy that explains itself before the first meeting.",
    categories: ["web"],
    description:
      "Corporate site and content engine for a digital-transformation consultancy in hospitality and retail.",
    result:
      "Integra turns a consultancy's judgement into published material that works before the call.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "Blog and resources on dynamic routes: the team publishes without waiting on a developer.",
    agentRole: "No agent: content architecture and SEO",
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
        alt: "Integra home on desktop",
        label: "Home",
      },
      {
        src: "/projects/integra/02-desktop-scroll.webp",
        alt: "Integra services and resources",
        label: "Services",
      },
      {
        src: "/projects/integra/03-mobile.webp",
        alt: "Integra on mobile",
        label: "Mobile",
      },
    ],
  },
  {
    id: "vistacampo",
    name: "Vistacampo",
    kind: "Design that also has to communicate safety.",
    categories: ["web"],
    description:
      "Multilingual institutional site for an addiction rehabilitation centre: content, team, facilities and blog in one coherent structure.",
    result:
      "Vistacampo turns a delicate subject into an experience where information builds trust instead of anxiety.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "Multilingual architecture and MDX: the team publishes without waiting on a developer.",
    agentRole: "No agent: content architecture, i18n and SEO",
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
    kind: "Fifty years of social work, readable on one page.",
    categories: ["web"],
    description:
      "Institutional site for a Venezuelan organisation working on inclusion and training for people with intellectual disabilities.",
    result:
      "AVEPANE orders programmes, impact and ways to take part without losing its human warmth.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "Introduces the organisation to families, partners and would-be volunteers with a single piece.",
    agentRole: "No agent: institutional narrative and content structure",
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
    kind: "Buyers watch their building go up without phoning anyone.",
    categories: ["web"],
    description:
      "Institutional site for a construction and property company, with a project catalogue and build progress per development.",
    result:
      "SAMER turns the two silent years between signing and handover into a reason to come back to the site.",
    businessGoal: "reduce_costs",
    businessOutcome:
      "The build-progress page absorbs the \"how's mine going?\" calls that used to eat the sales team's day.",
    agentRole: "No agent: build transparency as a product feature",
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
    kind: "Inspire and help decide in the same interface.",
    categories: ["web", "webapp"],
    description:
      "Food-tourism platform for Colonia Tovar: explore experiences, build themed routes, share the itinerary.",
    result:
      "Viaja Ven collapses twenty browser tabs and a voice note into one shareable object.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "The itinerary is the unit people send over WhatsApp: distribution lives inside the product.",
    agentRole: "No agent: discovery and guided planning",
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
    kind: "Selling origin, not just beans.",
    categories: ["web"],
    description:
      "Specialty-coffee ecommerce with catalogue, collections, checkout, and the origin story inside the buying path.",
    result:
      "Kawsay puts origin and impact on the conversion path, not on a page buried in the footer.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "Holds a specialty price against a product that costs a quarter as much and photographs identically.",
    agentRole: "No agent: brand content on the buying path",
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
    kind: "A store built around the window, not the catalogue.",
    categories: ["web"],
    description:
      "Limited-window drop ecommerce, with an interface designed to convey scarcity without turning anxious.",
    result:
      "Dream Drop points the same ecommerce stack at a different commercial logic: the drop instead of standing stock.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "Urgency is communicated by design — no fake counters, no manufactured pressure.",
    agentRole: "No agent: art direction and release rhythm",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Radix UI", "Framer Motion"],
    year: "2026",
    liveUrl: "https://dream-drop-ruddy.vercel.app",
    githubPushedAt: "2026-06-09T00:00:00Z",
    githubUpdatedLabel: "9 jun 2026",
    images: [],
  },
  {
    id: "ainetworking-canada",
    name: "AiNetworking Canada",
    kind: "Shipped as a platform, not as a waiting list.",
    categories: ["web", "webapp"],
    description:
      "Public site and member platform for a Canadian AI organisation: hubs, applications, events and an authenticated area.",
    result:
      "AiNetworking Canada launched with the product inside it: nine channels, a collaboration board, and onboarding with explicit consent.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "A member who signs up finds someone to talk to the same day, instead of a welcome email.",
    agentRole: "No agent: hub matcher and participation paths",
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
    kind: "In a crisis, two taps beat a dashboard.",
    categories: ["webapp"],
    description:
      "Private mobile-first recovery companion: daily check-ins, a recovery curve, grounding exercises and support contacts.",
    result:
      "Pausa treats friction as the product, not as an interface detail.",
    businessGoal: "reduce_costs",
    businessOutcome:
      "A PWA with notifications and per-user private data, built for sustained daily use.",
    agentRole: "AI-assisted daily insights",
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
    kind: "AI content that never invents a single figure.",
    categories: ["automation"],
    description:
      "Internal content and sales engine for a residential development: knowledge, strategy, batches, production, analytics and learnings, all connected.",
    result:
      "Santorini Engine publishes every week with a truth rule built into it.",
    businessGoal: "increase_revenue",
    businessOutcome:
      "Price, handover date and financing are flagged for verification rather than filled in: in housing, an invented number is not a copy mistake.",
    agentRole: "Marketing agent with human approval",
    status: "launched",
    stack: ["Next.js", "TypeScript", "Markdown", "Zod"],
    year: "2026",
    githubPushedAt: "2026-07-19T00:00:00Z",
    githubUpdatedLabel: "19 jul 2026",
    images: [],
  },
  {
    id: "waha-fisio-agent",
    name: "Booking Agent",
    kind: "An agent that closes the transaction, not one that replies nicely.",
    categories: ["automation"],
    description:
      "WhatsApp agent for a physiotherapy clinic: talks in Spanish, checks real availability in Cal.com, books the slot and sends reminders.",
    result:
      "The agent books appointments without anyone at the clinic touching a phone.",
    businessGoal: "both",
    businessOutcome:
      "It answers at 11:00 instead of 19:00 — by which time the patient has booked somewhere else.",
    agentRole: "Booking agent with real tools",
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
    kind: "A photo of the receipt goes in; a structured expense comes out.",
    categories: ["automation"],
    description:
      "Microservice that turns text, a voice note, a photo or a PDF into a structured expense. Built to hang off n8n.",
    result:
      "Expense Inbox deletes the end-of-month afternoon spent transcribing crumpled paper.",
    businessGoal: "reduce_costs",
    businessOutcome:
      "API contract, auth, data schema and a health check — what separates an agent from something you can depend on.",
    agentRole: "Expense capture and structuring agent",
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
    kind: "The problem isn't traffic. It's that nobody chases the ones who didn't close.",
    categories: ["automation"],
    description:
      "Agent that answers calls, qualifies leads, keeps a sales pipeline and follows up on its own.",
    result:
      "Frontia CRM attacks the expensive part of the funnel: the paid lead that evaporates after first contact.",
    businessGoal: "both",
    businessOutcome:
      "Automatic follow-up on leads already paid for — money the business has spent and not collected.",
    agentRole: "Receptionist and commercial follow-up",
    status: "prototype",
    stack: ["React", "TypeScript", "TanStack Start", "Supabase"],
    year: "2026",
    githubPushedAt: "2026-08-01T00:00:00Z",
    githubUpdatedLabel: "1 ago 2026",
    images: [],
  },
];

const MERGED_PROJECTS: PortfolioProject[] = RAW_PORTFOLIO_PROJECTS.map(
  (project) => {
    const sync = SYNC.projects[project.id];
    if (!sync) return { ...project, images: CURATED_IMAGES[project.id] ?? project.images };
    return {
      ...project,
      githubPushedAt: sync.githubPushedAt ?? project.githubPushedAt,
      githubUpdatedLabel: sync.githubUpdatedLabel ?? project.githubUpdatedLabel,
      // ponytail: las capturas escritas a mano ganan; el sync solo rellena las vacias
      images: CURATED_IMAGES[project.id] ?? (project.images.length > 0 ? project.images : (sync.images ?? [])),
    };
  },
);

export const ALL_PORTFOLIO_PROJECTS: PortfolioProject[] = MERGED_PROJECTS.map(project => ({
  ...project,
  images: project.images.map(image => ({ ...(imageDimensions as Record<string, { width: number; height: number }>)[image.src], ...image })),
}));

// Kept in the raw catalogue for operational history and sync safety; these are no longer public portfolio work.
export const HIDDEN_PROJECT_IDS = new Set(["nea-agent", "expense-inbox-agent", "santorini", "shopea", "waha-fisio-agent"]);
export const PORTFOLIO_PROJECTS: PortfolioProject[] = ALL_PORTFOLIO_PROJECTS.filter(project => !HIDDEN_PROJECT_IDS.has(project.id));

const FEATURED_IDS = ["rei-fm", "mistica", "frontai-landing", "soapy"] as const;

export const FEATURED_PORTFOLIO_PROJECTS = FEATURED_IDS.map((id) =>
  PORTFOLIO_PROJECTS.find((project) => project.id === id),
).filter((project): project is PortfolioProject => Boolean(project));
