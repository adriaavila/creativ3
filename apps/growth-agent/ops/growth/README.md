# Growth Agent operations

- Deploy this directory as a separate Vercel project with Node 24.
- Required secrets: `DATABASE_URL`, `AI_GATEWAY_API_KEY` or Vercel OIDC, `GROWTH_AGENT_USERNAME`, and `GROWTH_AGENT_PASSWORD`.
- The public web app calls the Eve HTTP channel server-to-server. Never expose credentials to the browser.
- Weekday research runs at 13:00 UTC (09:00 Caracas). Weekly summary runs Friday at 21:00 UTC.
- The agent can research, score, persist, draft, and update state. It has no outreach-sending tool.
- Use `pnpm --filter @creativv/growth-agent build` before deployment and trigger `daily-research` from Eve's dev schedule endpoint during local verification.
- Model runs through **Vercel AI Gateway** (`gateway("anthropic/claude-sonnet-4-6")` in each `agent.ts`; override per env with `GROWTH_MODEL`). Requires `AI_GATEWAY_API_KEY`.

## Evaluating the agents

- `pnpm --filter @creativv/growth-agent eval` runs the suite in `evals/`. The judge model for `t.judge.*` LLM-as-judge checks is configured in `evals/evals.config.ts` (override with `GROWTH_JUDGE_MODEL`); it only scores, never changes the agent under test.
- Current checks: `limits`, `no-outreach`, `evidence-has-url`, `draft-voice` (judge), `lead-score-sanity` (judge), `no-pii` (judge). Gate failures fail the run; tune judge strictness with `.soft()`/`.gate()`/`.atLeast()` per assertion.
- To trust a change: break a copywriter rule in `subagents/copywriter/instructions.md` and confirm `draft-voice` fails, then revert.

## Observability (OTel)

- Eve emits OpenTelemetry traces for every model call, tool invocation, and subagent delegation. Point `OTEL_EXPORTER_OTLP_ENDPOINT` at any OTLP collector (or the Vercel observability tab in deploy) to inspect a run step-by-step: which tool was called with what input, token usage, and where a run stalled. This is the first place to look when a daily run produces weak leads.
