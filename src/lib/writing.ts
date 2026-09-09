type WritingNote = {
  slug: string;
  title: string;
  category: string;
  project?: string;
  projectName?: string;
  summary: string;
  paragraphs: readonly string[];
};

export const WRITING: readonly WritingNote[] = [
  {
    slug: 'the-interface-is-the-handoff', title: 'The interface is the handoff.',
    category: 'Interfaces / operations', project: 'soapy', projectName: 'Soapy',
    summary: 'What an order needs to carry from the front desk to the delivery route.',
    paragraphs: [
      'Industrial engineering gives you a useful habit: follow the work. An order does not end when someone submits a form. It moves through people, places and decisions. The interface has to carry enough context for the next person to act.',
      'Soapy brings reception, order states, routes, notifications and delivery into the same service flow. Those are not independent features. They are different views of a single promise to the customer: the order will make it through the process.',
      'That changes what deserves space on a screen. The current state matters. So does what happens next. A tidy dashboard is only useful if the person looking at it can make the next decision without reconstructing the story from a chat.',
      'The same pattern appears in Mística: a student’s attendance and payment history belong to the same operating picture. Separating them might make the navigation look simpler, while making the actual work harder.',
      'My starting question is practical: what does the next person need to know? The answer is usually a better brief for an interface than a list of components.'
    ],
  },
  {
    slug: 'a-reply-is-not-an-outcome', title: 'A reply is not an outcome.',
    category: 'Agents / real actions',
    summary: 'Why scheduling needs real tools, explicit boundaries and a way back to a person.',
    paragraphs: [
      'A customer asking for an appointment does not need a convincing paragraph about availability. They need a time that actually exists and a booking that survives the conversation.',
      'A scheduling agent connected to a CRM has a useful split: the conversation can interpret the request, while the system owns the contacts, calendar and outgoing messages. The model does not get to invent the underlying state.',
      'The booking path validates the proposed slot on the server. The agent can qualify a lead, offer available times and request a reservation. When the request falls outside approved knowledge, it has a route to a human.',
      'This is still pilot work. A repository with working tools is evidence of an implementation, not proof that every customer conversation will succeed. Testing the unhappy paths is part of the product: unavailable slots, repeated messages, interruptions and a direct request for a person.',
      'The useful unit of progress is the completed action with a traceable result. Good conversation helps a person get there; it cannot substitute for it.'
    ],
  },
  {
    slug: 'build-on-the-shoulders', title: 'Build on the shoulders.',
    category: 'Open source / delivery', project: 'vocero-crm', projectName: 'Vocero · agency edition',
    summary: 'The difference between building a CRM and making one ready to hand over.',
    paragraphs: [
      'The agency edition of Vocero starts with someone else’s good work. Kevin Belier created the open-source CRM. My contribution is an adaptation for a different job: configuring, verifying and handing an installation to a client.',
      'That job exposes different questions. What is still missing before the agent can be enabled? Can we limit a pilot to test numbers? Can the agency provision an account without copying credentials manually? Does the calendar reflect commitments that already exist?',
      'The adaptation adds readiness checks, provisioning, pilot controls and calendar integration. These are delivery concerns. They belong close to the product because the person receiving the installation needs to see its state, too.',
      'Keeping that contribution explicit is both honest and useful. It gives the original project credit and tells a future maintainer which decisions belong to the agency layer.',
      'Building on open source is not a shortcut around understanding. It is a reason to understand the boundary carefully: preserve what works, change what the new job requires, and leave a path for the next upstream update.'
    ],
  },
] as const;
