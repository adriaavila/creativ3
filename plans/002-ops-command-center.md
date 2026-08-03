# Plan 002: Turn `/ops` into the action-first command center

> **Executor instructions**: Execute only after Plan 001 is DONE. Follow every step and verification gate. Preserve all unrelated and pre-existing working-tree changes. If a STOP condition occurs, stop and report; do not improvise. Update this plan's status in `plans/README.md` when done unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
>
> ```bash
> git diff --stat e220e23..HEAD -- package.json src/app/ops src/app/api/ops/diagnose/route.ts src/components/ops src/lib/growth-db.ts src/lib/whatsapp-inbox-db.ts src/lib/whatsapp-connections-db.ts src/lib/meta/webhook-events-db.ts
> git status --short -- package.json src/app/ops src/app/api/ops/diagnose/route.ts src/components/ops src/lib/growth-db.ts src/lib/whatsapp-inbox-db.ts src/lib/whatsapp-connections-db.ts src/lib/meta/webhook-events-db.ts
> ```
>
> Plan 001 is expected to change messaging files and some Ops callers. Confirm its done criteria first. Preserve current workspace-aware channel lookup, onboarding-link generation, tenant summaries, delivery statuses, and retry-safe actions.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/001-retry-safe-ops-actions.md`
- **Category**: direction
- **Planned at**: commit `e220e23`, 2026-08-03; dirty working tree

## Why this matters

The current `/ops` says “Vista de hoy” but loads totals, a full duplicate outreach composer, onboarding tools, connection inventory, environment variables, and side-effecting diagnostics. Actionable work already exists as waiting conversations, due follow-ups, pending drafts, interested leads, failed runs, and unhealthy channels, but it is split across Inbox, CRM, and Growth. This plan makes `/ops` a compact deterministic queue, preserves those pages as canonical workspaces, and opens the exact record that needs attention.

## Current state

- `src/app/ops/page.tsx:62-84` runs seven unrelated reads in one `Promise.all`; one rejection leaves unrelated business values at zero/empty.
- `src/components/ops/OpsDashboardClient.tsx:115-605` is a dark legacy dashboard inside the newer light Ops shell.
- `src/components/ops/OpsDashboardClient.tsx:180` embeds `GrowthOutreachPanel`, duplicating CRM's outbound composer.
- The dirty worktree adds `OnboardingLinkGenerator` to the homepage. Preserve the feature by moving it to CRM Connections; do not delete it.
- `src/components/ops/GrowthOpsClient.tsx:79-93` already defines first-contact, due-follow-up, and proposal rules, but only over the newest loaded leads and in UTC.
- `src/components/ops/InboxClient.tsx:31-33` defines “waiting for reply” as the latest message being inbound.
- `src/components/ops/OpsNav.tsx:20-26` omits explicit Hoy and Growth links while Agents and Lab occupy primary navigation.
- `src/components/ops/ContactsClient.tsx:117-125` opens generic Inbox/CRM pages and loses record identity.
- `src/app/api/ops/diagnose/route.ts:78-88` creates an Eve session to test health; lines 128-137 post a synthetic event to n8n. A command-center health strip must be observational.

Current all-or-nothing data load:

```ts
// src/app/ops/page.tsx:62-83
try {
  const [leads, drafts, runs, connections, wahaConnections, researchedLeads, prompts] =
    await Promise.all([/* unrelated reads */]);
  // assign every result
} catch (error) {
  whatsappConnectionsError = "No se pudo cargar el inventario de WhatsApp.";
}
```

Current actionable rules to preserve, but move server-side and use Caracas time:

```ts
// src/components/ops/GrowthOpsClient.tsx:84-91
if (lead.status === "replied") enviarPropuesta.push(lead);
else if (lead.status === "approved" && !lead.lastContactedAt) contactarHoy.push(lead);
else if (lead.nextActionAt != null && lead.nextActionAt.slice(0, 10) <= today) followUp.push(lead);
else if (lead.status === "contacted" && isStale(lead.lastContactedAt)) followUp.push(lead);
```

Repo conventions to match:

- Server pages authorize with `authorizeOps()` and redirect before rendering private data.
- Next.js 16 `searchParams` is a Promise; see `src/app/ops/crm/page.tsx` and `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`.
- Use `<Link>` for record destinations; use `router.refresh()` only for the explicit Refresh action.
- Match the light CRM design in `CrmWorkspaceClient.tsx:165-253`: `#f7f8fa` background, white bordered surfaces, navy text, lime reserved for healthy/primary action.
- Use native `Intl.DateTimeFormat` with `timeZone: 'America/Caracas'`; no date library.
- Tests use Node's built-in test runner.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit tests | `pnpm test` | exit 0; both CRM and command-center tests pass |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0; no output |
| Scoped lint | `pnpm exec eslint src/app/ops src/app/api/ops/diagnose/route.ts src/components/ops src/lib/ops-command-center.ts src/lib/ops-command-center.test.ts src/lib/growth-db.ts src/lib/whatsapp-inbox-db.ts` | exit 0; no errors |
| Full build | `pnpm build` | exit 0 |

## Suggested executor toolkit

- Read these bundled Next.js 16 docs before editing: `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`, and `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`.
- Use `frontend-design` only to match and simplify the existing CRM visual system; do not redesign public pages.
- Use Playwright CLI for the final manual browser smoke check if available. Do not create a full E2E harness in this plan.

## Scope

**In scope** (the only source files to modify):

- `package.json`
- `src/lib/ops-command-center.ts` (create)
- `src/lib/ops-command-center.test.ts` (create)
- `src/lib/growth-db.ts` only for exact-record lookup if not kept in the new module
- `src/lib/whatsapp-inbox-db.ts` only for exact-record/status helpers if not kept in the new module
- `src/app/ops/page.tsx`
- `src/app/ops/inbox/page.tsx`
- `src/app/ops/crm/page.tsx`
- `src/app/ops/growth/page.tsx`
- `src/components/ops/OpsDashboardClient.tsx`
- `src/components/ops/OpsNav.tsx`
- `src/components/ops/InboxClient.tsx`
- `src/components/ops/CrmWorkspaceClient.tsx`
- `src/components/ops/GrowthOpsClient.tsx`
- `src/components/ops/ContactsClient.tsx`
- `src/components/ops/GrowthOutreachPanel.tsx` (delete after caller removal)
- `src/components/ops/OnboardingLinkGenerator.tsx` only if a prop/API adjustment is required to move it unchanged
- `src/app/api/ops/diagnose/route.ts`
- `plans/README.md` (status only)

**Out of scope**:

- New database tables or migrations for the action queue.
- Inline reply/send/approve actions on `/ops`; rows link to canonical workspaces.
- AI ranking, AI chat, a command palette, configurable widgets, drag/drop, assignment, or snoozing.
- Pagination overhaul for Inbox, CRM, and Contacts; exact selected records must load, but broader pagination is a follow-up.
- Public-site styling, billing, marketing, portfolio data, agent runtime behavior, or tenant policy.
- Changes to Plan 001's idempotency contract.

## Git workflow

- Branch: `codex/002-ops-command-center`
- Start only from a revision containing completed Plan 001.
- Use conventional commits, e.g. `feat(ops): add command-center action queue` and `refactor(ops): simplify command-center navigation`.
- Do not push or open a PR unless asked. Never reset the dirty worktree.

## Target product contract

`/ops` must render, in this order:

1. Header: `Hoy`, Caracas business date, explicit Refresh, and existing realtime status.
2. Four compact counts: waiting replies, due follow-ups, pending approvals, system incidents. A failed source displays `—`/`No disponible`, never zero.
3. Ordered `Necesita atención` queue. Every item states why it is present, age/due time, and one exact-record link.
4. `Pulso comercial`: existing next-step share, citas this month, and weighted pipeline where data exists.
5. Compact observational system-health strip. No environment-variable inventory, manual checklist, full connection table, or synthetic diagnostic trigger on the homepage.

Priority is deterministic:

1. Critical delivery/channel/system incident.
2. Oldest inbound conversation waiting for a human reply.
3. Most overdue scheduled follow-up, then stale contacted lead.
4. Oldest pending draft approval.
5. Interested lead needing a proposal.

## Steps

### Step 1: Add a read-only command-center projection

Create `src/lib/ops-command-center.ts` with a small public contract:

```ts
type OpsActionKind = "reply" | "follow_up" | "approval" | "proposal" | "incident";
type OpsSeverity = "critical" | "high" | "normal";
type OpsAction = {
  id: string;
  kind: OpsActionKind;
  severity: OpsSeverity;
  title: string;
  reason: string;
  occurredAt: string | null;
  href: string;
  cta: string;
};
```

The module may add compact `counts`, `pulse`, `health`, and `sourceErrors` types, but do not create a generic task framework.

Implement targeted SQL queries for actionable conditions. Do not call `getGrowthLeads(50)` or `listConversations(100)` and filter the capped newest records in JavaScript. Use `Promise.allSettled` so one failed source is marked unavailable while successful sources remain visible.

Rules:

- Reply: open conversation with non-null `last_inbound_at` and `last_message_at = last_inbound_at`.
- First contact: approved lead with no `last_contacted_at`.
- Follow-up: `next_action_at` on/before the Caracas business date; otherwise contacted for at least three days without a later terminal status.
- Approval: pending outreach draft.
- Proposal: lead status `replied`.
- Incident: failed recent growth run, failed webhook count, or disconnected/deauthorized active channel when the existing data exposes it reliably.
- Weighted pipeline: sum `potential_value * close_probability / 100` only for nonterminal leads with both values; return unavailable/null honestly when absent.

Use a bounded queue (for example, top 30 after deterministic sorting) and separate full counts. Return exact URLs through exported helper functions so they can be unit tested.

**Verify**:

```bash
rg -n 'Promise\.allSettled|America/Caracas|OpsActionKind|reply|follow_up|approval|proposal|incident' src/lib/ops-command-center.ts
```

Expected: independent sources, Caracas date handling, and all five action kinds.

### Step 2: Add exact-record routing

Use Server Component `searchParams` promises, per the bundled Next.js 16 docs.

- Inbox: `/ops/inbox?conversation=<positive integer>`. Validate the ID, fetch it directly with `getConversationById()`, prepend it if it is outside the normal list, and pass `initialSelectedId`. Do not silently select a different conversation when a valid requested record exists.
- CRM: `/ops/crm?lead=<uuid>`. Validate the UUID, fetch it with `getGrowthLeadById()`, prepend if absent, and pass `initialLeadId`.
- Growth: `/ops/growth?tab=drafts&draft=<uuid>`. Load the exact draft if it is outside the normal list, initialize the drafts tab, add a stable DOM ID to its card, and scroll/focus it after mount without motion when reduced motion is requested.
- Contacts: replace generic destinations with the exact Inbox or CRM URL.

Key/remount each client by its initial selection in the Server page, or synchronize the prop explicitly; do not rely on a `useState(initialValue)` that ignores later search-param navigation.

Keep invalid query values harmless: ignore them and render the normal page, never interpolate them into SQL without parameterization.

**Verify**:

```bash
rg -n 'conversation\?|initialSelectedId|lead\?|initialLeadId|draft\?|initialDraft' src/app/ops src/components/ops src/lib/ops-command-center.ts
```

Expected: every queue destination has a validated initial-selection path.

### Step 3: Make diagnostics observational

Change `/api/ops/diagnose` so invoking it cannot create an Eve session or post an n8n event.

- Keep the read-only database `SELECT 1`.
- Keep Hermes `GET /v1/capabilities` when Hermes is selected.
- For Eve, report configuration and `unknown` health unless the repo contains a documented GET/HEAD health endpoint. Do not call `/eve/v1/session`.
- For n8n, report configured/unknown unless a dedicated read-only health URL is configured. Do not post a synthetic event.
- Keep the HTTPS callback reachability GET and durable webhook statistics.
- Update the response/UI type to distinguish `healthy`, `unhealthy`, and `unknown`; unknown is not green.
- Never return secret values.

The old synthetic diagnostics script under `scripts/` remains out of scope and available for deliberate manual testing.

**Verify**:

```bash
rg -n 'eve/v1/session|meta_embedded_signup_diagnostic|method: "POST"' src/app/api/ops/diagnose/route.ts
```

Expected: no matches.

### Step 4: Replace the homepage without losing current features

Update `src/app/ops/page.tsx` to authorize first, call `getOpsCommandCenter()`, and pass only the compact projection to `OpsDashboardClient`. Remove direct loading of 100 full leads and the full prompt registry.

Rewrite `OpsDashboardClient` in the light CRM visual system and implement the Target product contract. Use links for queue actions; do not embed editors. The Refresh button may call `router.refresh()` and must expose a loading state. Continue using the shared realtime provider's status display.

Preserve the dirty-worktree `OnboardingLinkGenerator` by moving it into CRM's Connections panel. Pass `cloudApiOnboardingAvailable` from `src/app/ops/crm/page.tsx` to `CrmWorkspaceClient`; do not leave the generator on the command-center homepage.

After the dashboard no longer imports it and CRM contains the canonical composer, delete `GrowthOutreachPanel.tsx`. Confirm no imports remain.

**Verify**:

```bash
rg -n 'GrowthOutreachPanel|getGrowthPromptRegistry|getGrowthLeads\(100\)|Variables de Entorno|Verificación Manual' src/app/ops/page.tsx src/components/ops/OpsDashboardClient.tsx
rg -n 'OnboardingLinkGenerator' src/components/ops/CrmWorkspaceClient.tsx
```

Expected: the first command prints no matches; the second prints the relocated generator.

### Step 5: Reorganize navigation around frequency

Update `OpsNav` with two visible groups:

- Primary: Hoy (`/ops`), Bandeja, Pipeline, Growth.
- Secondary/System: Contactos, Conexiones, Agentes, Laboratorio, Portafolio.

The named Hoy item must carry `aria-current` on `/ops`; the logo is no longer the only home affordance. Keep logout and operator profile. Preserve 44px touch targets and existing focus-visible styles. Do not add a theme toggle.

**Verify**:

```bash
rg -n 'Hoy|Bandeja|Pipeline|Growth|Contactos|Conexiones|Agentes|Laboratorio|Portafolio' src/components/ops/OpsNav.tsx
```

Expected: every destination is represented once in the appropriate group.

### Step 6: Add focused queue and URL tests

Create `src/lib/ops-command-center.test.ts` using `node:test` and fixed timestamps. Keep SQL out of the pure test surface by exporting a pure classifier/sorter plus URL helpers from `ops-command-center.ts`.

Cover:

- Critical incidents sort before waiting replies.
- Waiting replies sort oldest first.
- Scheduled follow-up uses `America/Caracas` at the UTC day boundary.
- Pending approval and proposal map to exact draft/lead URLs.
- Missing source data yields unavailable, not zero.
- Queue is bounded but counts remain full.
- Exact Inbox/CRM/Growth URL builders encode IDs and expected query keys.

Change the root test script to `node --import tsx --test src/lib/*.test.ts` so both existing and new tests run. Do not pull `apps/realtime` tests into this command.

**Verify**:

```bash
pnpm test
```

Expected: all existing CRM tests and all new command-center tests pass.

### Step 7: Verify build and browser behavior

Run unit tests, typecheck, scoped lint, and the full build. Then start the app and perform one authenticated, read-only browser smoke check:

1. `/ops` renders the four counts, attention queue, business pulse, and health strip.
2. A waiting-reply item opens its exact Inbox conversation.
3. A follow-up/proposal item opens its exact CRM lead.
4. A pending approval opens the exact Growth draft.
5. Connections still exposes the onboarding-link generator.
6. Mobile navigation exposes both primary and System groups.
7. No message is sent, draft approved, run started, or synthetic diagnostic posted during this smoke check.

Capture screenshots only under `output/playwright/` if useful; do not commit them unless requested.

**Verify**:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only in-scope files plus preserved pre-existing changes are listed.

## Test plan

- New file: `src/lib/ops-command-center.test.ts`.
- Pattern: `src/lib/crm-rules.test.ts` with Node built-ins, fixed clocks, and no fixtures/framework.
- Test the deterministic classifier/sorter and URL builders, not React implementation details.
- Run one manual authenticated browser smoke check because the repo has no seeded test database for stable Playwright CI.
- Verification: `pnpm test`, `pnpm exec tsc --noEmit`, scoped ESLint, and `pnpm build` all exit 0.

## Done criteria

- [ ] `/ops` contains only the action-first command center contract described above.
- [ ] Queue rules use targeted server queries, not capped newest-N client filtering.
- [ ] One failed source displays unavailable without erasing successful data.
- [ ] Every queue/contact action opens the exact record.
- [ ] Diagnostics perform no agent-session creation or synthetic n8n POST.
- [ ] OnboardingLinkGenerator is preserved under CRM Connections.
- [ ] `GrowthOutreachPanel.tsx` and its imports are deleted.
- [ ] Navigation explicitly exposes Hoy and Growth and groups low-frequency system tools.
- [ ] No queue/tasks table, dependency, AI ranking, command bar, widgets, assignment, or snoozing was added.
- [ ] `pnpm test`, typecheck, scoped lint, and build exit 0.
- [ ] Manual browser smoke check completes without mutations.
- [ ] No out-of-scope files were modified by this plan.
- [ ] `plans/README.md` marks Plan 002 DONE.

## STOP conditions

Stop and report if:

- Plan 001 is not DONE or its retry-safe request contract is absent.
- The dirty-worktree onboarding generator, workspace-scoping, summary, or delivery-status changes cannot be preserved while moving the homepage.
- Actionable records cannot be queried directly without a schema migration; this plan explicitly forbids a new tasks table/migration.
- Exact-record loading would require bypassing `authorizeOps()` or interpolating unvalidated IDs.
- A real passive Eve/n8n health endpoint is required but not documented in the repo; render unknown instead of inventing one.
- A verification command fails twice after one reasonable correction.

## Maintenance notes

- Queue priority is intentionally deterministic. Review changes to its order as product-policy changes, not styling tweaks.
- Reviewers should confirm capped list defaults cannot hide a queue item because each selected record is fetched directly.
- Add cursor pagination later if Contacts/Inbox lists exceed their current caps; do not turn that into a prerequisite for this command center.
- Add persisted assignment/snoozing only when multiple operators need ownership semantics.
- Add Playwright CI only with a seeded database and isolated provider mocks; never let CI send real WhatsApp messages.

