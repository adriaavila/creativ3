# Plan 007: A lead who asked the price gets the price and the payment link

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a6f67ff..HEAD -- src/lib/sales-queue.ts src/lib/ops-capture.test.ts`
> If either changed, compare the "Current state" excerpts with the live code; on a mismatch, STOP.

## Status

- **Priority**: P1 (straight at the bottleneck: "nobody is asked to pay")
- **Effort**: S
- **Risk**: LOW (changes a draft Adrian reads before sending)
- **Depends on**: none (plan 008 later swaps the bare link for a tracked one)
- **Category**: direction (sales)
- **Planned at**: commit `a6f67ff`, 2026-09-27

## Why this matters

`/ops` Hoy (allok.fun) is the sales queue. Leads arrive from the WhatsApp
agent in Vocero once they pass its filter; one of the filter signals is
**`askedPrice`** (the lead asked what it costs or how to pay). Since
2026-09-26 the agent is told **not** to give prices in chat, so a lead who asks
leaves the chat without one. Then Hoy proposes a follow-up that ignores the
question and offers a demo call again ("¿Te muestro en 15 minutos…?"). The
warmest leads get an extra step before anyone asks them to pay. The pay-ask
text already exists (`payAsk()`), but only the `after_call` stage uses it.

## Current state

- `src/lib/sales-queue.ts` — `messageFor(stage, lead)` builds every proposed
  WhatsApp message. The `followup` branch today (around lines 202-212):
  ```ts
  case "followup": {
    if ((state?.step ?? 0) >= 1) {
      const opener = state?.name && hello(state.name) !== "Hola" ? `${state.name.trim()}, ¿lo` : "¿Lo";
      return `${opener} vemos esta semana? Si ahora no es buen momento, dime y te escribo más adelante.`;
    }
    const about = state?.rubro
      ? `Vi lo que le contaste a nuestro agente sobre tu ${state.rubro.trim()}${state.dolor ? `: ${state.dolor.trim().replace(/[.\s]+$/, "")}` : ""}.`
      : "Quedó pendiente mostrarte cómo quedaría el agente en tu negocio.";
    return `${hi}, soy Adrian de allok. ${about} ¿Te muestro en 15 minutos cómo quedaría?`;
  }
  ```
- Same file, the existing helpers to reuse:
  ```ts
  const esencial = PLANS.find((plan) => plan.key === "esencial")!;
  function hello(name: string | null | undefined): string { … }   // "Hola Nurbelys" or "Hola"
  const payAsk = () =>
    `Como lo hablamos: la ${SETUP_SERVICE.name.toLowerCase()} son US$${SETUP_SERVICE.price} una vez y el plan ${esencial.name} US$${esencial.price} al mes. Se paga aquí: ${SETUP_SERVICE.paymentUrl} Cuando pagues, agendamos la instalación.`;
  ```
  `SETUP_SERVICE` (in `src/lib/plans.ts`) has `name: "Puesta en marcha"`, `price: 499`, `paymentUrl: "https://buy.stripe.com/…"`; `esencial.price` is 49.
- `AgentState` (in `src/lib/ops-capture.ts`) has `askedPrice: boolean`, `step: number`, `name`, `rubro`, `dolor`.
- Tests: `src/lib/ops-capture.test.ts`, test "los mensajes salen de lo que sabe el agente, sin huecos ni rayas largas" (around line 141). Helper `captured(over, agent)` builds a `GrowthLead` with `agentState`. Example assertion style:
  ```ts
  assert.match(messageFor("after_call", lead), /US\$499 una vez y el plan Esencial US\$49 al mes\. Se paga aquí: https:\/\/buy\.stripe\.com\//);
  ```
- Copy rules for this repo (owner's rules): neutral Spanish, "tú", no em dashes (— or –), no emojis, no hype. The existing test loop asserts no dashes, emojis or `undefined|null|{`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tests | `pnpm test` | contains `ℹ fail 0` |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**: `src/lib/sales-queue.ts`, `src/lib/ops-capture.test.ts`.

**Out of scope**:
- `src/lib/ops-capture.ts` (`followupFor`, the filter): the stage and dates stay the same; only the text changes.
- `src/components/ops/HoyClient.tsx`: the card already shows whatever `messageFor` returns.
- The follow-up **step ≥ 1** text: unchanged.
- The Vocero agent's own no-prices rule: not in this repo.

## Git workflow

- Branch: `claude/007-price-asked-followup`
- Commit: `feat(ops): a lead who asked the price gets the price and the link`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the price-first branch

In `messageFor`, `case "followup"`, after the `step >= 1` early return and
before `const about = …`, add:

```ts
// Preguntó el precio y el agente no lo da en el chat: el primer seguimiento lo responde y pide el pago.
if (state?.askedPrice) {
  const where = state.rubro ? ` en tu ${state.rubro.trim()}` : "";
  return `${hi}, soy Adrian de allok. Le preguntaste a nuestro agente por el precio: la ${SETUP_SERVICE.name.toLowerCase()} son US$${SETUP_SERVICE.price} una vez y el plan ${esencial.name} US$${esencial.price} al mes. Se paga aquí: ${SETUP_SERVICE.paymentUrl} Si prefieres verlo antes${where}, te lo muestro en 15 minutos.`;
}
```

This copy is a **draft**: say so in the PR description and quote it, so Adrian
approves the wording (it goes out under his name).

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Test it

In `src/lib/ops-capture.test.ts`, inside the test "los mensajes salen de lo que
sabe el agente…", after the `follow1` assertions add:

```ts
const priced = messageFor("followup", captured({}, { askedPrice: true }));
assert.match(priced, /^Hola Nurbelys, soy Adrian de allok\. Le preguntaste a nuestro agente por el precio: la puesta en marcha son US\$499 una vez y el plan Esencial US\$49 al mes\. Se paga aquí: https:\/\/buy\.stripe\.com\//);
assert.match(priced, /verlo antes en tu bufete/);
assert.doesNotMatch(messageFor("followup", captured({}, { askedPrice: true, rubro: null })), /en tu/);
assert.match(messageFor("followup", captured({}, { askedPrice: true, step: 1 })), /^Nurbelys, ¿lo vemos esta semana\?/, "el segundo seguimiento no repite el precio");
```

Also add a price-asked lead to the dash/emoji/gap loop: after the existing
`for (const stage of stages)` loop add

```ts
const pricedText = messageFor("followup", captured({}, { askedPrice: true }));
assert.doesNotMatch(pricedText, /[—–]|\p{Extended_Pictographic}|undefined|null|\{/u);
```

**Verify**: `pnpm test` → `ℹ fail 0`, and the test count is unchanged (73) because assertions were added inside existing tests.

## Test plan

Covered in Step 2: price-first text with and without rubro, step 1 unchanged,
copy hygiene. Pattern: the existing assertions in the same test.

## Done criteria

- [ ] `grep -n "Le preguntaste a nuestro agente por el precio" src/lib/sales-queue.ts` → 1 match
- [ ] `pnpm test` → `ℹ fail 0`
- [ ] `pnpm exec tsc --noEmit` and `pnpm lint` → exit 0
- [ ] `git status --short` → only the two in-scope files
- [ ] PR description quotes the new message as a draft for Adrian's approval
- [ ] `plans/README.md` row for 007 updated

## STOP conditions

- `messageFor`'s `followup` branch no longer matches the excerpt.
- `AgentState` has no `askedPrice` field.
- Adding the branch makes any existing assertion fail (someone depends on the old text for price-asked leads).

## Maintenance notes

- Plan 008 replaces `SETUP_SERVICE.paymentUrl` in `messageFor` with a per-lead
  tracked link; it must update this new branch too (search for `paymentUrl` in
  `sales-queue.ts`).
- If Adrian decides the agent may quote prices in chat again, this branch still
  holds: it only adds the link and a clear ask.
