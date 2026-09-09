import type { PortfolioProject, ProjectImage } from './projects';

export type ProjectDate = { value: string; precision: 'day' | 'year'; source: 'repository' | 'portfolio' | 'launch' };
export type ProjectStory = { problem: string; contribution: string; outcome: string };

// Repository beginnings verified with GitHub on 2026-09-06. These are NOT launch dates.
const REPOSITORY_DATES: Record<string, string> = {
  'nea-agent': '2026-08-08', 'vocero-crm': '2026-08-10',
  'ainetworking-canada': '2026-07-16', samer: '2026-07-17',
  'santorini': '2026-07-19', shopea: '2026-06-22', 'dream-drop': '2026-06-08',
  'waha-fisio-agent': '2026-06-22', 'parley-mundial': '2026-05-21',
  'pace-running': '2026-05-11', soapy: '2026-05-05', 'rei-fm': '2026-04-28',
  mistica: '2026-04-19', 'expense-inbox-agent': '2026-04-13',
  'viaja-ven': '2026-02-15', 'wasap-creativ': '2026-02-15', integra: '2026-02-02',
  'taller-samer': '2026-02-05', 'almacen-vc': '2026-01-19', pausa: '2026-01-04',
  avepane: '2025-12-01', artistheway: '2025-08-24', kawsay: '2025-06-26', vistacampo: '2025-06-17',
};

export const PROJECT_STORIES: Record<string, ProjectStory> = {
  'rei-fm': { problem: 'A building has one operation, but its information lives in separate tools.', contribution: 'Connected property records, resident workflows, payments and document review in one product.', outcome: 'A shared view of the property, from administration to the resident experience.' },
  shopea: { problem: 'The catalogue is on one side. The conversation where people buy is on the other.', contribution: 'Designed a storefront, checkout and payment flow around WhatsApp commerce.', outcome: 'A continuous path from finding a product to preparing an order.' },
  mistica: { problem: 'Classes, attendance and payments need to tell the same story about each student.', contribution: 'Built a mobile-first operating interface for a swimming school.', outcome: 'Staff can move between students, schedules and collections without losing context.' },
  samer: { problem: 'Buyers need visibility into construction progress without chasing someone for an update.', contribution: 'Built a construction sales site and a buyer portal with project progress, documents and payments.', outcome: 'The public promise and the buyer’s ongoing experience live in one system.' },
  soapy: { problem: 'Every handoff in a laundry service is another place an order can disappear.', contribution: 'Connected reception, order states, routes, notifications and delivery.', outcome: 'One traceable service flow, from the first receipt to the last handoff.' },
  'ainetworking-canada': { problem: 'A new community needs somewhere useful to go after registration.', contribution: 'Built the public site and member platform with hubs, applications, events and collaboration.', outcome: 'The launch includes a place to participate, not just a place to leave an email.' },
  'nea-agent': { problem: 'A helpful reply is not enough when the customer needs an actual appointment.', contribution: 'Built a WhatsApp scheduling agent with calendar tools, lead qualification and human handover.', outcome: 'A pilot that validates proposed slots before booking and escalates when it cannot safely continue.' },
  'vocero-crm': { problem: 'An agency needs to verify an installation before handing it to a client.', contribution: 'Adapted Kevin Belier’s Vocero CRM with readiness checks, provisioning, pilot controls and calendar integration.', outcome: 'A delivery workflow with visible readiness and an explicit path from test account to client handoff.' },
};

// Audited media wins even when the array is empty: a sync must not restore login captures.
export const CURATED_IMAGES: Record<string, ProjectImage[]> = {
  soapy: [
    { src: '/projects/soapy/dashboard.jpg', width: 1287, height: 909, alt: 'Soapy owner dashboard design with branch and revenue summaries', label: 'Owner dashboard concepts' },
    { src: '/projects/soapy/create-order.jpg', width: 1287, height: 909, alt: 'Soapy four-step order creation flow for laundry services', label: 'Creating a laundry order' },
    { src: '/projects/soapy/orders.jpg', width: 1287, height: 909, alt: 'Soapy orders list and order status timeline', label: 'Orders and their handoffs' },
    { src: '/projects/soapy/operations.jpg', width: 1287, height: 909, alt: 'Soapy expenses and inventory operating views', label: 'Expenses and inventory' },
    { src: '/projects/soapy/reports.jpg', width: 1287, height: 909, alt: 'Soapy business reports screen with revenue trends', label: 'A business report at a glance' },
  ],
  'vocero-crm': [
    { src: '/projects/vocero-crm/inbox.png', width: 1440, height: 900, alt: 'Upstream Vocero inbox reference interface', label: 'Upstream reference — shared inbox (Kevin Belier / Vocero)' },
    { src: '/projects/vocero-crm/pipeline.png', width: 1440, height: 900, alt: 'Upstream Vocero sales pipeline reference interface', label: 'Upstream reference — sales pipeline (Kevin Belier / Vocero)' },
    { src: '/projects/vocero-crm/lab.png', width: 1440, height: 900, alt: 'Upstream Vocero agent evaluation reference interface', label: 'Upstream reference — agent evaluation (Kevin Belier / Vocero)' },
  ],
  'rei-fm': [
    { src: '/projects/rei-fm/01-desktop.jpg', alt: 'REI public property platform landing page', label: 'The public product introduction' },
    { src: '/projects/rei-fm/02-desktop-scroll.jpg', alt: 'REI website describing the property management product', label: 'Explaining the property platform' },
    { src: '/projects/rei-fm/03-mobile.jpg', alt: 'REI public website on mobile', label: 'The mobile introduction' },
  ],
  integra: [
    { src: '/projects/integra/01-desktop.jpg', alt: 'Integra industrial services website', label: 'Industrial services, introduced' },
    { src: '/projects/integra/02-desktop-scroll.jpg', alt: 'Integra services overview', label: 'Services and capabilities' },
    { src: '/projects/integra/03-mobile.jpg', alt: 'Integra website on mobile', label: 'Mobile service discovery' },
  ],
  mistica: [
    { src: '/projects/mistica/dashboard.png', alt: 'Mística mobile dashboard with attendance and payment summaries', label: 'A daily operating picture' },
    { src: '/projects/mistica/home.png', alt: 'Mística home screen with upcoming classes', label: 'Today’s classes and activity' },
    { src: '/projects/mistica/cobros.png', alt: 'Mística collections screen', label: 'Payment follow-up in context' },
  ],
};

export function projectDate(project: PortfolioProject): ProjectDate {
  return project.chronology ?? (REPOSITORY_DATES[project.id]
    ? { value: REPOSITORY_DATES[project.id], precision: 'day', source: 'repository' }
    : { value: project.year, precision: 'year', source: 'portfolio' });
}
export function dateLabel(project: PortfolioProject): string {
  const date = projectDate(project);
  const label = date.precision === 'year' ? date.value : new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date.value));
  return `${label} · ${date.source === 'repository' ? 'repository began' : date.source === 'launch' ? 'launched' : 'project year'}`;
}
export function chronologicalProjects(projects: readonly PortfolioProject[]): PortfolioProject[] {
  // Year-only records follow dated records in that year; equal dates preserve editorial order.
  return [...projects].sort((a, b) => projectDate(b).value.localeCompare(projectDate(a).value));
}
export function projectStory(project: PortfolioProject): ProjectStory {
  return project.story ?? PROJECT_STORIES[project.id] ?? {
    problem: project.kind, contribution: project.description, outcome: project.result,
  };
}
