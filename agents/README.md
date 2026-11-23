# allok agents on Managed Agents

Claude runs the agent loop and a sandbox per session on Anthropic's side. Only
the prompts live here; `scripts/agents.ts` creates the agents and runs them, and
`scripts/content-batch.ts` drafts content through the Batch API.

| File | What |
|---|---|
| `lead-engine/lead.md` | Lead engine (Claude Opus 5.5): plans city × vertical cells, delegates, verifies, writes the CSV |
| `lead-engine/reader.md` | Web researcher (Claude Sonnet 5.5): researches one cell, cheap reading |
| `lead-engine/rubric.md` | What "done" means for a lead list; a separate grader checks it before the session ends |
| `ops-audit/auditor.md`, `ops-audit/rubric.md` | Outside-in audit of allok.fun and hola.allok.fun |
| `ids.json` | Agent and environment IDs, written by `pnpm agents setup` |

Edit a `.md`, then run `pnpm agents setup --allow-unrestricted-network` again:
it updates the same agents (new version), it does not create new ones.

## Spending the $100 of credits (Nov 18-19)

Needs `ANTHROPIC_API_KEY` in `.env.local`, from the Console organization that
holds the credits. Every session has a hard cap (`--budget`, in USD at list
price); at the cap it pauses with its work intact.

| When | Command | Cap | Output |
|---|---|---|---|
| Day 1 | `pnpm agents setup --allow-unrestricted-network` | free | `agents/ids.json` |
| Day 1 | `pnpm agents leads --segment mx-co --count 10 --budget 6` | $6 | Test run: prints $/importable lead. Open 3 rows and check them by hand |
| Day 1 | `pnpm content:batch submit` then, ~1 h later, `pnpm content:batch collect` | ~$2 | 30 drafts (10 weekdays × 3 variants) in `marketing/content/drafts/` |
| Day 1 | `pnpm agents leads --segment sur --count 40 --budget 20` | $20 | Chile, Uruguay, Venezuela, Paraguay |
| Day 1 | `pnpm agents leads --segment bo --count 35 --budget 18` | $18 | Bolivia |
| Day 2 | `pnpm agents audit --budget 8` | $8 | `ops/audits/<date>/audit.md` |
| Day 2 | `pnpm agents leads --segment mx-co --count 35 --budget 18` | $18 | Mexico and Colombia |
| Day 2 PM | `pnpm agents cost`, then one more `leads` run with what's left | rest | Credits don't carry over |

Size `--count` from the test run: count ≈ budget ÷ cost per importable lead.
Runs skip every domain already in `marketing/leads/` automatically; add
`--exclude <csv>` with an export of `/ops/outreach` contacts to skip those too.

If the terminal drops, `pnpm agents fetch <session_id>` picks the session back
up. If a session pauses at its cap, `pnpm agents raise <session_id> --budget <USD>`.

## From CSV to emails

1. Leads land in `marketing/leads/<date>-<segment>-<session>/` (ignored by git).
   `importable.csv` keeps only the rows `/ops/outreach` accepts, using the same
   filter as the import.
2. Upload `importable.csv` in `/ops/outreach` → «Subir leads». The cron builds
   each demo and, with «Envíos activos» on, sends up to 20 emails a day.
3. Chile, Uruguay, Venezuela, Paraguay and Bolivia need this branch deployed
   first (migration 026; `ensureOutreachTables` applies it by itself).

Nothing in these scripts sends email, WhatsApp messages or posts.
