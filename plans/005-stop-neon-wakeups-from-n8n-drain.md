# Plan 005: Stop the n8n drain from waking Neon 48 times a day

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a6f67ff..HEAD -- n8n/meta-webhook-drain.workflow.json docs/meta-embedded-signup.md docs/meta-whatsapp-production-state.md src/app/api/meta/whatsapp/webhook/drain/route.ts`
> If any of these changed, compare the excerpts below with the live files; on a mismatch, STOP.

## Status

- **Priority**: P1 (money: Neon compute)
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `a6f67ff`, 2026-09-27

## Why this matters

allok.fun runs on Vercel with a Neon Postgres database that bills for compute
while awake. A previous incident (commit `56f901c`, 2026-08-31) found that a
daily cron hitting an empty queue "was the whole Neon bill" and removed it.
But a second caller still exists: the n8n workflow **`allok - Drain Meta
Webhook Queue`** (id `Yf3mR8qK2vL7sN5p`) on the VPS n8n. On 2026-09-27 it was
**active, with 48 successful executions in the previous 24 hours** (read-only
query of n8n's SQLite `execution_entity`). Each successful call runs an
`UPDATE … FOR UPDATE SKIP LOCKED` on Neon, so the database is woken ~48 times a
day for a queue that has had no WhatsApp traffic since 2026-08-11. With Neon's
default 5-minute auto-suspend that can be up to ~4 hours of compute per day
(assumption: default suspend setting).

The webhook route already processes each event inline with `after()`, so the
drain is only a safety net for a dead inbox.

## Current state

- `n8n/meta-webhook-drain.workflow.json` — the workflow as saved in the repo.
  Lines 1-4:
  ```json
  {
    "id": "Yf3mR8qK2vL7sN5p",
    "name": "allok - Drain Meta Webhook Queue",
    "active": true,
  ```
  Its schedule node is named `"Every Minute"` with `"minutesInterval": 1`
  (the live copy runs every 30 min; the repo copy is stale, but either way it
  must stop).
- `src/app/api/meta/whatsapp/webhook/drain/route.ts` — `GET` authorizes by
  `CRON_SECRET` bearer **or** header `x-servicioscreativos-secret` =
  `N8N_WEBHOOK_SECRET`, then `await processMetaWebhookQueue(25)`.
- `src/app/api/meta/whatsapp/webhook/route.ts:61` — `after(() => processMetaWebhookQueue(5));`
  (events are already processed inline).
- `docs/meta-embedded-signup.md` (around lines 85-93) says: "The durable retry
  worker is active as `allok - Drain Meta Webhook Queue` … It calls the
  protected drain endpoint every minute … The daily Vercel cron is only a
  Hobby-plan fallback." and around line 119: "Import … `n8n/meta-webhook-drain.workflow.json`
  only if the corresponding workflow needs to be recreated … import,
  publish/activate, and restart n8n".
- `docs/meta-whatsapp-production-state.md` (around lines 97-101) says the drain
  "remains active" with 10.080 successes over seven days.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| JSON valid | `node -e 'JSON.parse(require("fs").readFileSync("n8n/meta-webhook-drain.workflow.json","utf8"))'` | exit 0 |
| Tests | `pnpm test` | output contains `ℹ fail 0` |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:
- `n8n/meta-webhook-drain.workflow.json`
- `docs/meta-embedded-signup.md`
- `docs/meta-whatsapp-production-state.md`

**Out of scope**:
- `src/app/api/meta/whatsapp/webhook/drain/route.ts` — keep the endpoint; it is
  harmless when nobody calls it and is the manual recovery path.
- Any other n8n workflow (`Meta deauthorize`, `Meta data deletion`,
  `Meta Embedded Signup - Tech Provider`, etc.). They are called by Meta, not on
  a schedule.
- **The live n8n instance.** Deactivating the workflow in production is an
  operator step (Step 3) that needs Adrian's approval. Do not SSH to the VPS or
  call the n8n API yourself.

## Git workflow

- Branch: `claude/005-n8n-drain-off`
- Commit style (from `git log`): `fix(ops): …`, `docs(plans): …`. Example:
  `chore(n8n): park the Meta drain workflow, it kept Neon awake`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Mark the saved workflow inactive

In `n8n/meta-webhook-drain.workflow.json` change `"active": true` to
`"active": false`. Change nothing else.

**Verify**: `grep -n '"active"' n8n/meta-webhook-drain.workflow.json` → `4:  "active": false,`
and the JSON-valid command exits 0.

### Step 2: Make the docs say it is parked, and why

In `docs/meta-embedded-signup.md`, replace the paragraph that begins "The
durable retry worker is active as" and the sentence "It calls the protected
drain endpoint every minute…" with:

```md
The retry worker `allok - Drain Meta Webhook Queue` (`Yf3mR8qK2vL7sN5p`) is
**parked** (inactive) since 2026-09-27. Each call woke Neon for an empty queue
(48 wakes a day) and the webhook route already processes events inline with
`after()`. To drain by hand: `curl -H "x-servicioscreativos-secret: …" https://allok.fun/api/meta/whatsapp/webhook/drain`.
Do not re-activate it on a schedule without first making the endpoint skip
Neon when nothing is pending.
```

In the same file, in the sentence starting "Import `n8n/meta-embedded-signup.workflow.json`
or `n8n/meta-webhook-drain.workflow.json`", remove `or
\`n8n/meta-webhook-drain.workflow.json\`` so the runbook no longer tells anyone
to activate it.

In `docs/meta-whatsapp-production-state.md`, replace the bullet that says the
drain "remains active" with:
`- \`allok - Drain Meta Webhook Queue\` (\`Yf3mR8qK2vL7sN5p\`) was parked on 2026-09-27: it woke Neon ~48 times a day for an empty queue.`

**Verify**: `grep -n "Drain Meta Webhook Queue" docs/*.md` → every hit mentions
"parked"; `grep -n "every minute" docs/meta-embedded-signup.md` → no matches.

### Step 3: Operator step (Adrian approves; executor does NOT run it)

Write this into your final report so the operator can run it:

```sh
# On the VPS (root@100.84.255.90), deactivate the live workflow and confirm:
docker exec n8n n8n update:workflow --id=Yf3mR8qK2vL7sN5p --active=false
docker restart n8n
docker exec n8n n8n list:workflow --active=true | grep -c Yf3mR8qK2vL7sN5p   # expect 0
```

## Test plan

No code changes, so no new tests. `pnpm test` and `pnpm lint` must still pass.

## Done criteria

- [ ] `grep -c '"active": false' n8n/meta-webhook-drain.workflow.json` → `1`
- [ ] `grep -rn "every minute" docs/meta-embedded-signup.md` → no output
- [ ] `pnpm test` output contains `ℹ fail 0`; `pnpm lint` exits 0
- [ ] `git status --short` lists only the three in-scope files
- [ ] Final report contains the Step 3 operator commands
- [ ] `plans/README.md` row for 005 updated

## STOP conditions

- The JSON file's `id` is not `Yf3mR8qK2vL7sN5p`.
- The docs no longer mention the drain workflow (someone already rewrote them).
- You find a `vercel.json`/`vercel.ts` cron or another scheduler calling
  `/api/meta/whatsapp/webhook/drain` — report it, do not remove it.

## Maintenance notes

- If Meta WhatsApp traffic returns to allok's own inbox, re-enable the drain
  only after the endpoint checks something cheap first (for example a `pending`
  flag set by the webhook route) so an empty queue never touches Neon.
- After the operator step, Neon compute graphs should flatten within a day;
  that is the real verification.
