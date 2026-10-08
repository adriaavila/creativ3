import { leadsFromCsv } from "@/lib/demo-profile-build";
import { matchDemoSlug, outreachLeadsFromCsv, type ImportSkip } from "@/lib/outreach";
import { enqueueDemoJobs, ensureOutreachTables, getSuppressedEmails, listDemoRefs, upsertContacts } from "@/lib/outreach-db";

/**
 * Subir un CSV de leads: lo mismo desde `/ops/outreach` que desde
 * `pnpm outreach import`. Guarda los contactos escribibles (mismos filtros de
 * correo) y pone en cola la demo de CADA fila con web, tenga o no un correo
 * escribible: la demo sirve igual para escribirle por otro lado.
 */

export class OutreachImportError extends Error {}

export type OutreachImportResult = {
  contacts: number;
  inserted: number;
  existing: number;
  skipped: ImportSkip[];
  missingColumns: string[];
  demos: { queued: number; ready: number; existing: number };
};

export async function importOutreachCsv(raw: string, opts: { allowFreemail?: boolean; source: string }): Promise<OutreachImportResult> {
  await ensureOutreachTables();
  const suppressed = await getSuppressedEmails();
  const { leads, skipped, columns } = outreachLeadsFromCsv(raw, { allowFreemail: opts.allowFreemail, suppressed });
  const missingColumns = Object.entries(columns)
    .filter(([, i]) => i === null)
    .map(([k]) => k);
  if (missingColumns.includes("name") || missingColumns.includes("email")) {
    throw new OutreachImportError(`El CSV no trae columna de nombre o de correo (faltan: ${missingColumns.join(", ")}).`);
  }
  const demos = await listDemoRefs();
  const contacts = leads.map((l) => ({ ...l, demoSlug: matchDemoSlug(l, demos) }));
  const { inserted, existing } = await upsertContacts(contacts, opts.source);
  const demoJobs = await enqueueDemoJobs(
    leadsFromCsv(raw).leads.map((l) => ({
      website: l.website,
      businessName: l.name,
      sector: l.sector,
      city: l.city,
      country: l.country,
      existingSlug: matchDemoSlug({ businessName: l.name, website: l.website }, demos),
    })),
  );
  return { contacts: contacts.length, inserted, existing, skipped, missingColumns, demos: demoJobs };
}
