# Growth Agent operations

- Deploy this directory as a separate Vercel project with Node 24.
- Required secrets: `DATABASE_URL`, `AI_GATEWAY_API_KEY` or Vercel OIDC, `GROWTH_AGENT_USERNAME`, and `GROWTH_AGENT_PASSWORD`.
- The public web app calls the Eve HTTP channel server-to-server. Never expose credentials to the browser.
- Weekday research runs at 13:00 UTC (09:00 Caracas). Weekly summary runs Friday at 21:00 UTC.
- The agent can research, score, persist, draft, and update state. It has no outreach-sending tool.
- Use `pnpm --filter @creativv/growth-agent build` before deployment and trigger `daily-research` from Eve's dev schedule endpoint during local verification.
