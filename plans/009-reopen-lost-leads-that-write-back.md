# Plan 009: A lead marked «No por ahora» comes back to Hoy when it writes again

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a6f67ff..HEAD -- src/lib/ops-capture.ts src/lib/ops-capture.test.ts`
> If either changed, compare with the excerpts below; on a mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED (changes a state rule that a test pins; the test is updated on purpose)
- **Depends on**: none (independent of 008; if 008 landed, `won` stays terminal as it expects)
- **Category**: bug
- **Planned at**: commit `a6f67ff`, 2026-09-27

## Why this matters

When Adrian taps «No por ahora», the lead becomes `status = 'lost'`. The VPS
routine re-sends every Vocero conversation that changed, and
`followupFor()` returns the lead unchanged whenever the previous status is
`won` or `lost`. So a prospect who said "not now" and writes back weeks later
("ya estoy listo, ¿cómo pago?") never reappears in Hoy. Those are exactly the
warm leads the goal (10 paying businesses by 2026-12-31) depends on. `won`
must stay terminal; `lost` should reopen when the lead writes **after**
Adrian closed it.

## Current state

- `src/lib/ops-capture.ts` — `followupFor(row, prev, now)` decides stage,
  status, next action and date for a captured Vocero conversation. Relevant
  lines (around 96-126):
  ```ts
  export function followupFor(row: CapturedRow, prev: Previous | null, now = new Date()): FollowupPatch {
    const today = localDate(now);
    const prevContact = prev?.lastContactedAt ?? null;
    const touched = Boolean(row.lastManualAt && time(row.lastManualAt) > time(prevContact));
    const lastContactedAt = touched ? row.lastManualAt : prevContact;
    // Si el lead escribió después del último toque, la secuencia de seguimientos vuelve a empezar.
    const repliedSincePrev = Boolean(prevContact && time(row.lastInboundAt) > time(prevContact));
    const step = (repliedSincePrev ? 0 : (prev?.step ?? 0)) + (touched ? 1 : 0);
    const asked = Boolean(prev?.nextAction?.startsWith(ASKED_PREFIX));
    // Con pago pedido, un pase o una respuesta no borran la marca: la semana la sigue contando.
    const mark = (label: string) => (asked ? `${ASKED_PREFIX} · ${label.toLowerCase()}` : label);
    const keep = { lastContactedAt, step };

    if (prev && (prev.status === "won" || prev.status === "lost")) {
      return { stage: "closed", status: prev.status, nextAction: prev.nextAction, nextActionAt: prev.nextActionAt, ...keep };
    }
    // Respondió después de que Adrian le escribió (el bot queda en pausa tras una respuesta manual).
    if (lastContactedAt && time(row.lastInboundAt) > time(lastContactedAt) && time(row.lastAiAt) < time(row.lastInboundAt)) {
      return { stage: "replied", status: asked ? "meeting_booked" : "replied", nextAction: mark("Te respondió"), nextActionAt: today, ...keep };
    }
    if (handedOff(row) && time(row.handoffAt) > time(lastContactedAt)) {
      return { stage: "handoff", status: asked ? "meeting_booked" : "replied", nextAction: mark("Te pasó el agente"), nextActionAt: today, ...keep };
    }
    // Próximos pasos que escribió Adrian con «Qué pasó» («Hablamos», «No vino»): la captura no los pisa.
    if (prev && !touched && (prev.nextAction === "Pedir el pago" || prev.nextAction === NO_SHOW_ACTION)) {
      return { stage: "asked", … };
    }
    if (asked) { … }
    if (booked(row)) { … }
    // followup step 0 / 1 / close
  ```
  `time(iso)` is `Date.parse` or 0. `lastContactedAt` for a lost lead is when
  Adrian tapped «No por ahora» (`logLeadOutcome` sets `last_contacted_at = now()`).
- `src/lib/growth-db.ts` `upsertCapturedLead` writes `patch.status`,
  `patch.nextAction`, `patch.nextActionAt` straight to `leads`, and stores
  `agent_state.stage = patch.stage` unless the stage is `asked`/`closed`.
- `src/lib/sales-queue.ts` `stageOf()`: `won`/`lost` → `null` (not in the
  queue); a lead with `status = 'replied'` and `agentState.stage = 'replied'`
  shows as «Te respondió» with an empty proposed message and «Abrir el chat»
  (Adrian reads the chat). That is the right card for a lead who came back.
- Test that pins today's behavior, `src/lib/ops-capture.test.ts` (around lines 89-94):
  ```ts
  test("lo que decide Adrian manda: un lead cerrado o con pago pedido no se reescribe", () => {
    const lost = followupFor(row({ calificado: true }), { status: "lost", nextAction: "No por ahora: caro", nextActionAt: null, lastContactedAt: "2026-09-25T12:00:00Z", step: 1 }, NOW);
    assert.deepEqual([lost.status, lost.nextAction], ["lost", "No por ahora: caro"]);
  ```
  Note: `row()`'s default `lastInboundAt` is `2026-09-26T15:00:00Z`, **after**
  that `lastContactedAt`, so under the new rule this fixture would reopen. The
  fixture must be changed so the lead did **not** write after closing.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tests | `pnpm test` | contains `ℹ fail 0` |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**: `src/lib/ops-capture.ts`, `src/lib/ops-capture.test.ts`.

**Out of scope**: `growth-db.ts`, `sales-queue.ts`, `HoyClient.tsx`, the VPS
routine (`~/allok/routines/ops-capture.*`), `won` handling.

## Git workflow

- Branch: `claude/009-reopen-lost-leads`
- Commit: `fix(ops): a lost lead that writes back returns to Hoy`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Reopen on a new inbound after closing

In `followupFor`, replace the `won`/`lost` early return with:

```ts
/** Escribió después de que Adrian lo cerró con «No por ahora»: vuelve a Hoy. */
const wroteBack = prev?.status === "lost" && time(row.lastInboundAt) > time(prevContact);
if (prev && (prev.status === "won" || (prev.status === "lost" && !wroteBack))) {
  return { stage: "closed", status: prev.status, nextAction: prev.nextAction, nextActionAt: prev.nextActionAt, ...keep };
}
if (wroteBack) {
  return { stage: "replied", status: asked ? "meeting_booked" : "replied", nextAction: mark(REOPENED_ACTION), nextActionAt: today, lastContactedAt, step: 0 };
}
```

and add at module level, next to `LEAD_HANDOFFS`:
```ts
/** Un lead cerrado que volvió a escribir. */
const REOPENED_ACTION = "Volvió a escribir";
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Keep it in Hoy until Adrian acts

Without this, the next capture run (15 min later) sees `status = 'replied'`
and, if the bot already answered, falls through to «Seguimiento 1» dated
tomorrow, so the card would vanish before Adrian sees it. After the `handoff`
branch and **before** the "Próximos pasos que escribió Adrian" branch, add:

```ts
// Volvió a escribir: se queda para hoy hasta que Adrian le conteste o marque «Qué pasó».
if (prev && !touched && prev.nextAction === REOPENED_ACTION) {
  return { stage: "replied", status: "replied", nextAction: REOPENED_ACTION, nextActionAt: prev.nextActionAt, ...keep };
}
```

(With a previous pay ask, the next action is `Pago pedido · volvió a escribir`,
which the existing `asked` branch already keeps as-is.)

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 3: Tests

In `src/lib/ops-capture.test.ts`, test "lo que decide Adrian manda…":
- change the `lost` fixture's `lastContactedAt` to `"2026-09-26T16:00:00Z"` (after the default inbound at 15:00) so it still asserts "stays closed";
- add a `won` case: same call with `status: "won"`, `nextAction: null`, `lastContactedAt: "2026-09-25T12:00:00Z"` → `assert.equal(won.status, "won")` (a new inbound never reopens a won lead).

Add a new test:
```ts
test("un lead cerrado que vuelve a escribir vuelve a Hoy y se queda hasta que Adrian actúe", () => {
  const closed = { status: "lost", nextAction: "No por ahora: caro", nextActionAt: null, lastContactedAt: "2026-09-20T12:00:00Z", step: 2 };
  const back = followupFor(row({ calificado: true, lastInboundAt: "2026-09-26T18:00:00Z", lastAiAt: "2026-09-26T18:01:00Z" }), closed, NOW);
  assert.deepEqual([back.stage, back.status, back.nextAction, back.nextActionAt, back.step], ["replied", "replied", "Volvió a escribir", "2026-09-26", 0]);

  const next = followupFor(
    row({ calificado: true, lastInboundAt: "2026-09-26T18:00:00Z", lastAiAt: "2026-09-26T18:01:00Z" }),
    { status: back.status, nextAction: back.nextAction, nextActionAt: back.nextActionAt, lastContactedAt: back.lastContactedAt, step: back.step },
    NOW,
  );
  assert.deepEqual([next.nextAction, next.nextActionAt], ["Volvió a escribir", "2026-09-26"], "la siguiente corrida no lo manda a mañana");

  const askedBack = followupFor(row({ lastInboundAt: "2026-09-26T18:00:00Z" }), { ...closed, nextAction: "Pago pedido · No por ahora: caro" }, NOW);
  assert.equal(askedBack.nextAction, "Pago pedido · volvió a escribir");
});
```

**Verify**: `pnpm test` → `ℹ fail 0`, one more test than before.

## Test plan

Step 3: lost stays closed without new activity; won never reopens; lost reopens
on a new inbound; the reopened card survives the next run; the pay-ask marker
is kept.

## Done criteria

- [ ] `grep -n "Volvió a escribir" src/lib/ops-capture.ts` → 1 match (the constant)
- [ ] `pnpm test` → `ℹ fail 0`
- [ ] `pnpm exec tsc --noEmit && pnpm lint` → exit 0
- [ ] `git status --short` → only the two in-scope files
- [ ] `plans/README.md` row for 009 updated

## STOP conditions

- The early `won`/`lost` return no longer matches the excerpt.
- Any test other than the one fixture you were told to change starts failing.
- You find that `logLeadOutcome` no longer sets `last_contacted_at` (then `prevContact` would not mark the close time and the rule is wrong).

## Maintenance notes

- A lost lead that writes only to be removed from a list will also reopen once; Adrian closes it again with «No por ahora». That cost is intended.
- If a "snooze until date" is ever added, it should use the same `REOPENED_ACTION` stickiness pattern.
