# Plan 006: CI checks every push, and Next.js is out of the critical advisories

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a6f67ff..HEAD -- package.json pnpm-workspace.yaml pnpm-lock.yaml next.config.ts .github/workflows/`
> If `package.json` already pins `next` ≥ 16.3.3 or a `ci.yml` exists, compare with this plan and STOP on a conflict.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (minor-version framework bump, verified by build)
- **Depends on**: none
- **Category**: security + dx
- **Planned at**: commit `a6f67ff`, 2026-09-27

## Why this matters

1. `pnpm audit --prod` (2026-09-27) reports **2 critical advisories on
   `next@16.2.12`**, both fixed in `>=16.3.3`: "Unauthenticated Remote Code
   Execution in Image Optimization API when AVIF files are used" and "RCE on
   windows-hosted servers". Plus a high on `sharp <0.35.4` (reached through
   `next`), and `pnpm-workspace.yaml` **pins `sharp` to 0.35.3** via
   `overrides`, so bumping `next` alone does not fix it.
   Production is on Vercel (image optimization runs on Vercel's side, less
   exposed), but `next.config.ts` keeps `output: "standalone"` for a Docker/VPS
   deployment, where the app's own server runs `/_next/image`. The allowed
   remote image host is the wildcard `*.convex.cloud`, i.e. anyone's Convex
   deployment.
2. **No CI runs tests, lint or typecheck.** `.github/workflows/` contains only
   `sync-projects.yml` (manual screenshot sync). The 73 unit tests (all pass,
   ~0.7 s) and eslint (clean) never run on their own, so every later plan can
   regress silently. Only `next build` on Vercel catches type errors.

## Current state

- `package.json`: `"next": "16.2.12"` (dependencies), `"eslint-config-next": "16.2.12"` (devDependencies), `"@types/node": "^20"`. Scripts:
  ```json
  "lint": "eslint",
  "test": "node --import tsx --test \"src/lib/**/*.test.ts\"",
  ```
  There is **no** `typecheck` script.
- `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - apps/*

  overrides:
    "@babel/core": 7.29.6
    postcss: 8.5.18
    sharp: 0.35.3
  ```
- `apps/growth-agent/package.json` has its own `"typecheck": "tsc --noEmit"`; package name `@allok/growth-agent`.
- `next.config.ts` → `images.remotePatterns: [{ protocol: "https", hostname: "*.convex.cloud", pathname: "/api/storage/**" }]`.
- Exemplar workflow to match (style, action versions): `.github/workflows/sync-projects.yml` uses `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4` with `node-version: 22` and `cache: pnpm`, then `pnpm install --frozen-lockfile`.
- `AGENTS.md` at the repo root: "This is NOT the Next.js you know … Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install` | exit 0 |
| Tests | `pnpm test` | contains `ℹ fail 0` |
| Typecheck | `pnpm typecheck` (added in Step 1) | exit 0 |
| Agent typecheck | `pnpm --filter @allok/growth-agent typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm build` | exit 0, prints the route table |
| Audit | `pnpm audit --prod` | no `critical` lines |

## Scope

**In scope**: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.github/workflows/ci.yml` (create).

**Out of scope**:
- `next.config.ts` `remotePatterns`: narrowing the Convex host needs the real
  deployment hostname, which only Adrian knows. Report it as a follow-up.
- `output: "standalone"` and the Dockerfile: separate decision.
- Any other dependency bump (`ai`, `stripe`, React…). Only `next`,
  `eslint-config-next` and the `sharp` override move.

## Git workflow

- Branch: `claude/006-ci-and-next-upgrade`
- Two commits: `ci: run tests, lint and typecheck on every push` and
  `fix(deps): next 16.3.6, sharp 0.35.5 (critical advisories)`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a `typecheck` script

In `package.json` `scripts`, add after `"lint": "eslint",`:
```json
"typecheck": "tsc --noEmit",
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Add the CI workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm --filter @allok/growth-agent typecheck
```

Node 24 matches `apps/growth-agent` `engines` and the Dockerfile (`node:24-alpine`).

**Verify**: `node -e 'require("fs").readFileSync(".github/workflows/ci.yml","utf8")'` exits 0, and
locally `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @allok/growth-agent typecheck` → all exit 0.
Commit.

### Step 3: Read the upgrade notes

Read `node_modules/next/dist/docs/index.md` and search the docs folder for
anything about 16.3 (`grep -rl "16.3" node_modules/next/dist/docs | head`).
Note any breaking change that touches `proxy.ts`, `next/image`, route handlers
or `after()`.

**Verify**: none (reading). If a breaking change applies to a file in `src/`, STOP and report it.

### Step 4: Bump Next.js and sharp

- `package.json`: `"next": "16.3.6"` and `"eslint-config-next": "16.3.6"`.
- `pnpm-workspace.yaml`: `sharp: 0.35.5` (keep it in `overrides`; it is pinned on purpose).
- Run `pnpm install`.

**Verify**:
- `pnpm ls next --depth 0` → `next 16.3.6`
- `pnpm why sharp | grep -c "0.35.5"` → ≥ 1, and `pnpm why sharp | grep -c "0.35.3"` → 0
- `pnpm audit --prod | grep -ci critical` → `0`

### Step 5: Full verification

Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

**Verify**: all exit 0; `pnpm build` prints the route table including `ƒ /ops`,
`ƒ /api/leads/capture` and `ƒ /api/stripe/webhook`. Commit.

## Test plan

No new unit tests; the value of this plan is that the existing 73 run in CI.
Smoke check after build (operator or executor with a browser): `pnpm start` then
open `/`, `/work` (uses `next/image`), and `/ops-login` — each renders with no
console errors.

## Done criteria

- [ ] `.github/workflows/ci.yml` exists with the 4 check steps
- [ ] `grep '"typecheck"' package.json` → one match
- [ ] `pnpm ls next --depth 0` shows `16.3.6`
- [ ] `pnpm audit --prod` shows no critical
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → exit 0
- [ ] `git status --short` shows only in-scope files
- [ ] `plans/README.md` row for 006 updated

## STOP conditions

- `pnpm install` changes packages other than next, eslint-config-next, sharp
  and their transitive deps in ways that fail the build.
- `pnpm build` fails after the bump and the error is in `src/` (framework API
  change): report the error text, do not refactor app code.
- `pnpm --filter @allok/growth-agent typecheck` fails **before** your change
  (baseline broken): drop that line from `ci.yml`, keep going, and report it.

## Maintenance notes

- Follow-up for Adrian: narrow `images.remotePatterns` from `*.convex.cloud`
  to the one Convex deployment hostname actually used by `/work` screenshots.
- Once CI exists, enable "Require status checks" on `main` in GitHub settings
  (operator step).
- When the Vercel build image moves Node versions, keep `node-version` in
  `ci.yml` in step.
