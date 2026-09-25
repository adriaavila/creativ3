# Plan 004: Turn `/ops` into the place where sales happen

## Status

- **Priority**: P0 (the north-star bottleneck)
- **Effort**: M (phase 1 is about a day of agent work)
- **Planned**: 2026-09-23, on `main` after #14
- **Depends on**: nothing for phase 1; Stripe live for the Vocero pay step

## Why

The bottleneck in `~/allok/context/ACTIVE.md` is that **nobody is being asked
to pay**: the sales log has been empty since 08-26, and the goal needs at least
5 conversations a week, each ending in a concrete ask. Ops has the parts (a
pipeline, approve-and-send drafts), but none of it reflects what's actually
going on. What the database shows (read-only query, 2026-09-23, the
`DATABASE_URL` in `.env.local`):

| Fact | Value |
|---|---|
| `leads` | 13 (9 `researched`, 4 `drafted`), **all from 2026-06-22** |
| `outreach_drafts` | 5 `pending`, from June, never sent |
| `growth_outreach_messages` | **0 ever sent** |
| `growth_runs` | 4, last one 2026-06-22 (the agent has been stopped for 3 months) |

The June leads are academies and clinics in Caracas (Emporio Dance, CMOL
Odontológico, Clínica Nueva Caracas…). None of them is Vocero's audience
today, and none has been contacted.

`/ops` today opens on `/ops/growth`, whose main tab is research, marketing
(Postiz) and runs. That's the workbench of an agent that isn't working.
Adrian's real day (phone in hand, talking to people he already knows) has
nowhere to live.

## The idea

One screen, `/ops`, that answers **who do I talk to today, and what do I ask
them for**, and that records what happened with one tap. If it's not in Ops,
it didn't happen: that screen replaces the markdown log, which never gets
filled in.

## Phase 1 — the loop (build now)

1. **`/ops` = Hoy.** Stop redirecting to Growth. At the top, the week against
   the target: `Conversaciones 0/5 · Pagos pedidos 0 · Pagos 0`. Below, the queue.
2. **Add a lead in 10 seconds.** Name, WhatsApp, where it came from (aliado,
   referido, reunión, growth), what it's for (Vocero, REI, agencia). Goes into
   `leads` with `next_action_at = today`. Enough for Mística, the 09-18 ally
   and the Vocero meetings to exist.
3. **The queue.** Leads with `next_action_at <= today`, in this order: asked to
   pay without an answer → interested with no ask yet → first contact. Each
   card shows name, last touch and next step, plus two actions:
   - **Escribir por WhatsApp**: `wa.me/<business_phone>?text=` with the message
     for its stage, prices taken from a single price sheet. Adrian sends it
     from his phone. Nothing automated goes out, so there's no WhatsApp
     policy risk.
   - **Qué pasó**: `Hablamos` · `Pedí el pago` · `Pagó` · `No por ahora
     (motivo)`. One tap writes the status, `last_contacted_at`, and the next
     step with a default date (+2 days; `Pagó` closes it as `won`).
4. **Empty state with a way out**: "Nadie para hoy. Agrega a alguien con quien
   hablaste" plus the form.
5. **Nav**: Hoy · Pipeline · Conexiones on top; Growth, Eve Agents and
   Observabilidad under "Más". Nothing gets deleted.

Done = Adrian logs a real conversation from his phone at 375 px in under
15 seconds, and the week counter goes up.

## Phase 2 — ask for payment from the card

- `Pedí el pago` offers the link that exists **today** and needs no
  self-serve signup (the ACTIVE.md rule: no signup links for strangers until
  the end-to-end test passes): `allok.fun/pago/<slug>` for agency work and
  "puesta en marcha". The amount comes from the price sheet, not typed by hand.
- Vocero SaaS: the same button once the Stripe live account for `allok LLC`
  is charging. Until then the card says so instead of generating a sandbox link.
- `Pagó` asks for the amount and the currency: that becomes the MRR row in
  `SCOREBOARD.md`, not a guess on Friday.

## Phase 3 — fill the queue

- Rescore the 13 June leads for the current offer and put the ones worth it
  into the queue with today's date. Mark the rest `lost` with a reason, not
  delete them.
- The 3 backlog items in `wiki/sales/log-conversaciones.md` go into the queue
  once Adrian names them.
- Only after that, and only if the loop converts: bring back the growth
  agent's schedule (dead since 06-22) so it adds leads to the same queue, still
  with a human approving every send.

## Not now

AI ranking, new charts, redesigning Growth/Marketing, automated sending,
lead scoring. The queue is deterministic and auditable (same reason Plan 002
rejected AI ranking).

## The one decision (Adrian)

To count **conversations** and not leads, and to know when payment was asked
and when it was paid, you need a small log: an additive `sales_touches` table
(`lead_id, kind, note, amount, currency, at`). It's a DB migration, so it's
yours to approve. Without it, phase 1 works off the `leads` columns
(`last_contacted_at`, `next_action`), but the counter measures leads touched
per week, and a second conversation with the same person doesn't count.

### Known limits of phase 1 (until `sales_touches`)

- "Pago pedido" is a prefix on `next_action`. Editing the next step or
  status from Growth or Pipeline erases it, and Pipeline shows those leads as
  "Cita" (`meeting_booked`).
- "Pagos" only counts wins logged from Hoy: marking a lead won elsewhere
  doesn't touch `last_contacted_at`.
- Growth's "Hoy" tab still uses the UTC day and its own rules. Two lists with
  the same name: retire that tab once this one proves itself.

## Verification

- Node tests for the queue order and the "Qué pasó" transitions (next date,
  final status).
- A real browser at 375 px and 1440 px: empty queue, one lead, 20 leads, a lead
  with no phone (the WhatsApp button turns into "Agregar número"), a failed save
  (the tap isn't lost, a retry is offered).
- A `designer` pass before merging.
