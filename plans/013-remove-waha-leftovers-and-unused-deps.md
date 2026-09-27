# Plan 013: Remove the dead WAHA code (and its broken button) and six unused dependencies

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a6f67ff..HEAD -- src/components/ops/CrmWorkspaceClient.tsx src/lib/whatsapp-inbox-db.ts src/app/api/ops/diagnose/route.ts package.json`
> If plan 006 landed, `package.json` changed (next version, `typecheck` script): expected. Anything else: compare with the excerpts; on a mismatch, STOP.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (removed code has zero importers; the compiler proves it)
- **Depends on**: 006 (CI + `pnpm typecheck` must exist first, so the deletion is checked)
- **Category**: tech-debt + deps
- **Planned at**: commit `a6f67ff`, 2026-09-27

## Why this matters

WAHA (an unofficial WhatsApp gateway) was retired: its API routes
(`src/app/api/ops/waha/`) were deleted in commit `21e1fe3`. What is left:

- **A broken button in `/ops/crm` ("Pipeline" in the ops nav).** The
  «Canal no oficial · WAHA» panel still has «Crear sesión WAHA», which POSTs to
  `/api/ops/waha/sessions` (404) and then polls a dead URL every 3 s.
- **~22 unused exports in `src/lib/whatsapp-inbox-db.ts`** (770 lines): the
  whole WAHA block and several conversation helpers nothing imports.
- **An empty import** `import { } from "@/lib/whatsapp-inbox-db";` in the diagnose route.
- **Six dependencies with zero imports** in `src/` and `scripts/`:
  `@hookform/resolvers`, `react-hook-form`, `@vercel/speed-insights`, `ws`,
  `@types/ws`, `ai` (the root app never imports `ai`; `apps/growth-agent` has
  its own pinned copy).

## Current state

- `src/components/ops/CrmWorkspaceClient.tsx`, component `ConnectionsPanel` (starts ~line 232):
  ```tsx
  function ConnectionsPanel({ initialChannels, onChannelsChange }: { … }) {
    const [channels, setChannels] = useState(initialChannels);
    const [session, setSession] = useState("allok-main");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [qr, setQr] = useState<{ mimetype: string; data: string } | null>(null);
    const [pairingSession, setPairingSession] = useState<string | null>(null);

    useEffect(() => {
      if (!pairingSession) return;
      … fetch(`/api/ops/waha/sessions/${encodeURIComponent(pairingSession)}`) … setInterval(…, 3000) …
    }, [onChannelsChange, pairingSession]);

    async function createWahaSession() { … fetch("/api/ops/waha/sessions", { method: "POST", … }) … }

    function updateChannel(next: CrmChannel) { … }   // KEEP
  ```
  and near the end of its JSX (~line 347) a `<details className="rounded-xl border border-[var(--warn-line)] bg-[var(--warn-soft)]">` whose summary reads `Canal no oficial · WAHA` and which contains the session input, the «Crear sesión WAHA» `TapButton`, the QR `<Image …>` and the `{error && …}` alert. That `<details>` element is the whole WAHA UI.
  Imports at the top include `Image from "next/image"`, `Loader2`, `ShieldAlert`, `Plus` (lucide). `Loader2` and `Plus` are used elsewhere in the file (lines ~340, ~659, ~673, ~733); `Image` and `ShieldAlert` may become unused.
- `src/lib/whatsapp-inbox-db.ts` exports. **Zero importers** outside the file (checked with `grep -rlw <name> src apps scripts`):
  `AssignedMode`, `ConversationOutcome`, `ConversationStatus`, `MessageDirection`, `MessageSource`, `NextStepSummary`, `WahaConnectionRecord`, `WahaWebhookEventRecord`, `listConversations`, `setConversationAssignedMode`, `setConversationStatus`, `setConversationLeadId`, `setConversationOutcome`, `outcomeShare`, `getNextStepSummary`, `listMessages`, `getRecentMessagesForAi`, `upsertWahaConnection`, `updateWahaConnectionStatus`, `getWahaConnection`, `recordWahaWebhookEvent`, `claimWahaWebhookEvents`, `markWahaWebhookEventProcessed`, `markWahaWebhookEventFailed`, `getWahaWebhookEventStats`, `noteWahaConnectionActivity`, `listWahaConnections`, `WA_STATUS_LADDER`, `statusOutranks`.
  **Keep** (used elsewhere or internally): `ChannelKind`, `WaConversation`, `WaMessage`, `upsertConversation`, `syncMetaContact`, `getConversationById`, `insertMessage`, `beginOutboundMessage`, `finalizeOutboundMessage`, `markOutboundMessageUnknown`, `updateMessageStatusByWaId`, and `WA_STATUS_LADDER` / `statusOutranks` (used **inside** the file by `updateMessageStatusByWaId`: keep them, you may drop only their `export` keyword).
  Some zero-importer **types** (`MessageDirection`, `MessageSource`, `ConversationStatus`, `AssignedMode`) may be used by kept types like `WaConversation`: keep any type the compiler needs.
- `src/app/api/ops/diagnose/route.ts:6` — `import { } from "@/lib/whatsapp-inbox-db";`
- `package.json` dependencies: `"@hookform/resolvers"`, `"@vercel/speed-insights"`, `"ai"`, `"react-hook-form"`, `"ws"`; devDependencies: `"@types/ws"`. `src/app/layout.tsx` renders only `<Analytics />` from `@vercel/analytics`, not Speed Insights.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm typecheck` (from plan 006; else `pnpm exec tsc --noEmit`) | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | contains `ℹ fail 0` |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope**: `src/components/ops/CrmWorkspaceClient.tsx` (WAHA state, effect, function and `<details>` only), `src/lib/whatsapp-inbox-db.ts`, `src/app/api/ops/diagnose/route.ts` (the empty import line), `package.json`, `pnpm-lock.yaml`.

**Out of scope**:
- Database tables `waha_*`, `wa_conversations`, `wa_messages` and migrations 011/012: never drop tables here.
- `src/lib/meta/**`, Embedded Signup, `whatsapp-connections-db.ts`: still used by the paid activation path.
- The `"waha"` value of `ChannelKind` and any `channel: "waha"` rendering in `crm-channels.ts`: existing rows may carry it.
- `apps/growth-agent` dependencies.

## Git workflow

- Branch: `claude/013-remove-waha-leftovers`
- Commits: `chore(ops): drop the dead WAHA panel from Pipeline`, `chore(db): drop unused inbox helpers`, `chore(deps): remove six unused packages`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Remove the WAHA panel

In `ConnectionsPanel`: delete the `session`, `creating`, `error`, `qr`, `pairingSession` state, the `useEffect` that polls `/api/ops/waha/sessions/…`, the `createWahaSession` function, and the whole `<details …>Canal no oficial · WAHA…</details>` element. Keep `channels`, `updateChannel` and everything else. Remove imports that become unused (likely `Image`, `ShieldAlert`; check `useEffect` is still used elsewhere before removing it).

**Verify**: `grep -n "waha/sessions\|Crear sesión WAHA\|createWahaSession" src/components/ops/CrmWorkspaceClient.tsx` → no match; `pnpm typecheck && pnpm lint` → exit 0.

### Step 2: Remove unused inbox helpers

Delete from `src/lib/whatsapp-inbox-db.ts` every function and type in the zero-importer list above, except the ones the "Keep" note protects. Then delete any private helper, row-mapper or constant that only the deleted code used (the compiler and eslint `no-unused-vars` will point to them). Delete the empty import line in `src/app/api/ops/diagnose/route.ts`.

**Verify**: `pnpm typecheck && pnpm lint && pnpm test` → all exit 0; `wc -l src/lib/whatsapp-inbox-db.ts` → well under 770 (expect roughly 350-450).

### Step 3: Remove unused dependencies

Run `pnpm remove @hookform/resolvers react-hook-form @vercel/speed-insights ws @types/ws ai` at the repo root (not in `apps/growth-agent`).

**Verify**: `pnpm --filter @allok/growth-agent typecheck` → exit 0 (its own `ai` is untouched); `pnpm typecheck && pnpm lint && pnpm test && pnpm build` → all exit 0.

## Test plan

No new tests: this plan only deletes unreachable code. The gates are the
compiler, lint, the existing 73+ tests and the build. Manual smoke (operator):
open `/ops/crm` → the connections panel renders with no «Canal no oficial ·
WAHA» section and no failing network calls in the browser console.

## Done criteria

- [ ] `grep -rn "waha/sessions" src` → no match
- [ ] `grep -n "getWahaConnection\|listConversations\|getNextStepSummary" src/lib/whatsapp-inbox-db.ts` → no match
- [ ] `grep -n '"react-hook-form"\|"@hookform/resolvers"\|"@vercel/speed-insights"\|"ws"\|"@types/ws"\|"ai"' package.json` → no match
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` → exit 0
- [ ] `git status --short` → only in-scope files
- [ ] `plans/README.md` row for 013 updated

## STOP conditions

- Any symbol in the zero-importer list turns out to be imported somewhere (grep again before deleting; a new import may have appeared).
- `pnpm build` fails with a module-not-found for one of the removed packages (something imports it dynamically): restore that package and report.
- Adrian decides he wants Speed Insights: then add `<SpeedInsights />` to the layout instead of removing the package (report, don't decide).

## Maintenance notes

- The `waha_*` tables stay in Neon. Dropping them is a separate, human-approved migration once nobody needs the history.
- If WhatsApp ever returns to allok's own inbox, restore from git history rather than re-deriving.
