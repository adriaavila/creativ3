# Plan 001: Make outbound Ops actions retry-safe

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. Preserve all unrelated and pre-existing working-tree changes. If anything in the STOP conditions occurs, stop and report; do not improvise. When done, update this plan's row in `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
>
> ```bash
> git diff --stat e220e23..HEAD -- db/migrations src/lib/whatsapp-inbox-db.ts src/lib/whatsapp-send.ts src/lib/growth-db.ts src/app/api/ops/inbox src/app/api/ops/growth/outreach/route.ts src/components/ops/ConversationThread.tsx src/components/ops/TemplateComposer.tsx src/components/ops/CrmWorkspaceClient.tsx src/components/ops/GrowthOutreachPanel.tsx src/lib/crm-rules.test.ts
> git status --short -- db/migrations src/lib/whatsapp-inbox-db.ts src/lib/whatsapp-send.ts src/lib/growth-db.ts src/app/api/ops/inbox src/app/api/ops/growth/outreach/route.ts src/components/ops/ConversationThread.tsx src/components/ops/TemplateComposer.tsx src/components/ops/CrmWorkspaceClient.tsx src/components/ops/GrowthOutreachPanel.tsx src/lib/crm-rules.test.ts
> ```
>
> Changes already present in the working tree are expected. Compare the Current state excerpts with live code and preserve the workspace-scoping, tenant-summary, onboarding, and delivery-status changes. Never reset or discard them.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `e220e23`, 2026-08-03; dirty working tree

## Why this matters

Cloud API and WAHA delivery currently happen before the outbound message is persisted. If provider delivery succeeds and the database write or HTTP response fails, Ops reports a failure and a retry can send the customer the same message twice. CRM also reuses one lead-composer instance while switching leads, so state initialized for the previous recipient can survive under the newly selected lead. This plan makes one operator click one durable action and prevents blind redispatch after an ambiguous result.

## Current state

- `src/lib/whatsapp-send.ts` owns the shared provider send path for Inbox, CRM, Growth, templates, and AI replies.
- `src/lib/whatsapp-inbox-db.ts` owns `wa_messages`; the dirty worktree already adds conversation summaries and monotonic delivery status updates. Preserve both.
- `src/app/api/ops/inbox/[id]/reply/route.ts` sends human-approved Inbox replies.
- `src/app/api/ops/growth/outreach/route.ts` creates a pending growth attempt before calling `sendToConversation`, but it marks any later error as `failed` even when provider acceptance may already have happened. Preserve its current workspace-aware connection resolution.
- `src/components/ops/ConversationThread.tsx`, `TemplateComposer.tsx`, `CrmWorkspaceClient.tsx`, and `GrowthOutreachPanel.tsx` are the human send callers.
- `src/lib/waha-send.ts:161-175` already accepts an optional outbound `id`; reuse it as the WAHA provider-side action ID. Do not add a dependency.

Current provider-first ordering:

```ts
// src/lib/whatsapp-send.ts:48-80
const result = await sendTemplateMessage(/* ... */); // or provider.sendText()
waMessageId = extractMessageId(result);
return insertMessage({
  conversationId: conversation.id,
  waMessageId: waMessageId ?? null,
  direction: "out",
  status: "sent",
});
```

Current stale composer mount:

```tsx
// src/components/ops/CrmWorkspaceClient.tsx:230-244
{selectedConversation ? (
  <ConversationThread key={selectedConversation.id} /* ... */ />
) : (
  <LeadOutreachForm lead={selectedLead} /* no key */ />
)}
```

Current Inbox request has no stable action ID:

```ts
// src/components/ops/ConversationThread.tsx:236
body: JSON.stringify({ mode: "send", text: draftText.trim() })
```

Repo conventions to match:

- Zod validates JSON boundaries; see `growthOutreachSchema` in `src/app/api/ops/growth/outreach/route.ts`.
- Database access uses tagged Neon SQL in `src/lib/*-db.ts` and migrations are rerunnable with `IF NOT EXISTS` where possible.
- Audit attempts are created before external work; see `createGrowthOutreachAttempt()` in `src/lib/growth-db.ts`.
- Tests use `node:test` and `node:assert/strict` in `src/lib/crm-rules.test.ts`.
- Comments beginning `ponytail:` are reserved for a deliberate ceiling plus its upgrade path.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit tests | `pnpm test` | exit 0; all tests pass |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0; no output |
| Scoped lint | `pnpm exec eslint src/lib/whatsapp-inbox-db.ts src/lib/whatsapp-send.ts src/lib/growth-db.ts 'src/app/api/ops/inbox/[id]/reply/route.ts' src/app/api/ops/growth/outreach/route.ts src/components/ops/ConversationThread.tsx src/components/ops/TemplateComposer.tsx src/components/ops/CrmWorkspaceClient.tsx src/components/ops/GrowthOutreachPanel.tsx src/lib/crm-rules.test.ts` | exit 0; no errors |
| Full build | `pnpm build` | exit 0 |

## Suggested executor toolkit

- Read `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` before editing Route Handlers. This repo uses Next.js 16 request APIs.
- Use the existing `tdd` skill if available for the action-state classifier and request-schema regression tests.

## Scope

**In scope** (the only source files to modify):

- `db/migrations/017_ops_outbound_idempotency.sql` (create)
- `src/lib/whatsapp-inbox-db.ts`
- `src/lib/whatsapp-send.ts`
- `src/lib/growth-db.ts`
- `src/lib/waha-send.ts` only if its existing `options.id` cannot accept the action ID unchanged
- `src/app/api/ops/inbox/[id]/reply/route.ts`
- `src/app/api/ops/growth/outreach/route.ts`
- `src/components/ops/ConversationThread.tsx`
- `src/components/ops/TemplateComposer.tsx`
- `src/components/ops/CrmWorkspaceClient.tsx`
- `src/components/ops/GrowthOutreachPanel.tsx`
- `src/lib/crm-rules.test.ts`
- `plans/README.md` (status only)

**Out of scope**:

- Replacing the Ops homepage or navigation; Plan 002 owns that.
- A general job queue, event bus, or universal tasks table.
- Automatic resend of `unknown` deliveries.
- Provider reconciliation polling; webhook delivery-status updates remain the recovery path.
- Authentication, login throttling, tenant membership, or workspace-policy changes.
- Any edits to migrations 015 or 016 or removal of existing dirty-worktree changes.

## Git workflow

- Branch: `codex/001-retry-safe-ops-actions`
- Use conventional commits matching the repo, e.g. `fix(ops): make outbound actions retry-safe`.
- One commit after migration/data-layer work and one after caller/tests is acceptable; do not push or open a PR unless asked.
- Never use reset or checkout to clean the dirty worktree.

## Steps

### Step 1: Fix the stale CRM recipient immediately

In `CrmWorkspaceClient`, mount `LeadOutreachForm` with `key={selectedLead.id}` just as `ConversationThread` is keyed by conversation ID. Do not add an effect that partially resets fields; a keyed remount resets phone, source URL, message, confirmation, templates, notices, and channel state together.

**Verify**:

```bash
rg -n '<LeadOutreachForm key=\{selectedLead\.id\}' src/components/ops/CrmWorkspaceClient.tsx
```

Expected: exactly one match.

### Step 2: Add one durable client action ID

Create migration 017. Add nullable `client_action_id uuid` to both `wa_messages` and `growth_outreach_messages`, each with a partial unique index where the value is not null. Expand the growth attempt status constraint from `pending|sent|failed` to `pending|sent|failed|unknown`. Keep the migration rerunnable and do not edit earlier migrations.

The action ID is created once in the browser with the native `crypto.randomUUID()`; no UUID package. It must be reused for the same click/retry and reset only after confirmed success or when the operator edits the recipient/message/template enough to create a new action.

**Verify**:

```bash
rg -n 'client_action_id|unknown' db/migrations/017_ops_outbound_idempotency.sql
```

Expected: columns/indexes for both tables and the expanded status constraint are present.

### Step 3: Persist the outbound intent before provider delivery

In `whatsapp-inbox-db.ts`:

1. Add `clientActionId: string | null` to `WaMessage` and map `client_action_id`.
2. Add `beginOutboundMessage(input)` that inserts the outbound row with `status = 'pending'` and the action ID before any provider call. Use the unique action ID to return the existing row on conflict and return whether this invocation created it.
3. Add one function to finalize the row with provider message ID and `status = 'sent'`.
4. Add one function to mark a pending row `unknown` with a bounded, non-secret error summary in its payload.
5. Keep `insertMessage()` unchanged for inbound/provider-webhook paths.

In `whatsapp-send.ts`:

1. Require `actionId` in `SendToConversationInput` for `source: 'api'`; AI sends may generate a server-side UUID once at their caller if they also route here.
2. Validate the conversation, channel connection, message/template shape, and 24-hour window before beginning the outbound record.
3. Call `beginOutboundMessage()` before provider delivery.
4. If the action ID already exists, never call the provider again. Return a typed result describing the existing `pending|unknown|sent|delivered|read|failed` state.
5. Pass the action ID into WAHA's existing `options.id` field.
6. After provider acceptance, finalize the pending row with the provider ID.
7. If an exception occurs after the provider request starts, mark the row `unknown`, not `failed`. The operator must see “delivery unconfirmed; do not retry blindly.”

Use a small discriminated result, not exceptions, for duplicate/ambiguous action states. Do not invent a service class.

**Verify**:

```bash
rg -n 'beginOutboundMessage|clientActionId|status: "unknown"|actionId' src/lib/whatsapp-inbox-db.ts src/lib/whatsapp-send.ts
```

Expected: intent-before-send helpers and typed action-state handling are present.

### Step 4: Reuse the action ID in growth attempts

Update `createGrowthOutreachAttempt()` and `completeGrowthOutreachAttempt()` to store the action ID and allow `unknown`. In the Growth route:

- Require `actionId: z.string().uuid()` in `growthOutreachSchema`.
- Create/upsert the growth attempt by action ID before dispatch.
- Pass the same ID to `sendToConversation()`.
- Map an ambiguous delivery result to HTTP 202 and attempt status `unknown`; never report it as a normal failure.
- Do not update the lead to `contacted` unless delivery is confirmed `sent` or stronger.
- Preserve the current `workspace` request field and `resolveOpsWorkspace()` behavior exactly.

**Verify**:

```bash
rg -n 'actionId|unknown|workspace' src/app/api/ops/growth/outreach/route.ts src/lib/growth-db.ts
```

Expected: all three concepts remain present.

### Step 5: Update every human caller

Update `ConversationThread`, `TemplateComposer`, `LeadOutreachForm` in CRM, and `GrowthOutreachPanel`:

- Create an action ID once when a send becomes eligible.
- Include it in the request body.
- Keep it across a network error or HTTP 202/unknown response.
- Disable blind resend while the state is pending/unknown and show a clear notice.
- Reset it after confirmed success or after the operator materially edits the outgoing action.
- Keep existing explicit confirmation, Meta template validation, free-text-window handling, and workspace scoping.

Do not add inline send behavior to the command center; this only secures existing send surfaces.

**Verify**:

```bash
rg -n 'actionId|randomUUID|delivery.*unconfirmed|entrega.*confirm' src/components/ops/ConversationThread.tsx src/components/ops/TemplateComposer.tsx src/components/ops/CrmWorkspaceClient.tsx src/components/ops/GrowthOutreachPanel.tsx
```

Expected: each caller sends and retains a stable action ID and presents an ambiguous state.

### Step 6: Add the smallest regression checks

Extend `crm-rules.test.ts` with:

- Growth outreach rejects a missing or malformed action ID and accepts a UUID.
- A pure action-state helper says only a newly inserted action may dispatch.
- Existing `pending`, `unknown`, or confirmed actions never dispatch again.
- `unknown` is not presented as a confirmed failure.

Do not create a database test harness in this plan.

**Verify**: `pnpm test` → exit 0 and at least four new action-id assertions pass.

### Step 7: Run all gates

Run the scoped lint, typecheck, tests, and build from Commands you will need. Inspect `git diff --check` and confirm no unrelated files were changed.

**Verify**:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only in-scope files plus pre-existing user changes are listed.

## Test plan

- Extend `src/lib/crm-rules.test.ts`; follow its existing `node:test` structure.
- Cover request validation and the pure “may this action dispatch?” decision.
- Preserve all existing WhatsApp normalization, template, tenant, and delivery-ladder tests.
- Verification: `pnpm test` passes, followed by `pnpm exec tsc --noEmit` and the scoped ESLint command.

## Done criteria

- [ ] `LeadOutreachForm` is keyed by `selectedLead.id`.
- [ ] Migration 017 adds unique action IDs to both outbound audit tables and supports `unknown` attempts.
- [ ] Every human send request carries a UUID action ID.
- [ ] The outbound row exists before provider delivery begins.
- [ ] Replaying the same action ID cannot call a provider twice.
- [ ] Ambiguous provider outcomes are `unknown`, never a normal retryable failure.
- [ ] Workspace-aware connection scoping remains intact.
- [ ] `pnpm test`, `pnpm exec tsc --noEmit`, scoped lint, and `pnpm build` exit 0.
- [ ] `git diff --check` reports no errors.
- [ ] No out-of-scope files were modified by this plan.
- [ ] `plans/README.md` marks Plan 001 DONE.

## STOP conditions

Stop and report if:

- Migration 017 already exists or either table already has an incompatible idempotency column/constraint.
- Current workspace-scoping code, conversation summary fields, or delivery-ladder code differs materially from the excerpts and cannot be preserved cleanly.
- The provider wrapper performs hidden automatic retries that cannot reuse the same action ID.
- Supporting action IDs requires changing public customer-facing APIs or adding a dependency.
- A verification command fails twice after one reasonable correction.

## Maintenance notes

- Reviewers should trace one action ID from browser request to growth attempt, `wa_messages`, provider request, and final response.
- `unknown` intentionally requires human/provider reconciliation. Add polling only when its operational frequency justifies it.
- Plan 002 deletes the dashboard's duplicate `GrowthOutreachPanel`; keep it safe until that deletion lands.

