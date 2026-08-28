# ============================================================
# allok.fun — Next.js standalone on Node 24.
# Secrets are runtime-only; the build needs just the public vars.
# ============================================================

FROM node:24-slim AS deps
WORKDIR /app
RUN corepack enable
# The workspace manifests must be present for pnpm to resolve the filter,
# even though apps/* are not installed here.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/realtime/package.json apps/realtime/package.json
COPY apps/growth-agent/package.json apps/growth-agent/package.json
# Only the root package: apps/growth-agent stays on Vercel and its `eve`
# dependency tree has no business in this image.
RUN pnpm install --frozen-lockfile --filter allok

FROM node:24-slim AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Inlined into the client bundle at build time, so they cannot wait for runtime.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_REALTIME_URL
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ENV NEXT_TELEMETRY_DISABLED=1
# Measured peak is ~1.1 GiB; this caps the heap well under the VPS headroom
# so a build can never push a neighbouring container into the OOM killer.
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN pnpm build

# Next traces the `sharp` symlink but not its @img/* platform binaries, so the
# standalone output cannot load it and the optimiser silently serves originals.
# Resolved in its own stage: installing into /app makes npm re-resolve the whole
# app tree and fail on peer conflicts.
FROM node:24-slim AS sharp
WORKDIR /sharp
RUN npm init -y > /dev/null && npm install --no-save sharp@0.35.3

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd -r allok && useradd -r -g allok allok

COPY --from=builder --chown=allok:allok /app/.next/standalone ./
COPY --from=builder --chown=allok:allok /app/.next/static ./.next/static
COPY --from=builder --chown=allok:allok /app/public ./public
# Read as plain text at runtime by eve-agent-catalog.ts to render /ops/agents.
# Not traced: Next would try to resolve the `eve` import inside them.
COPY --from=builder --chown=allok:allok /app/apps/growth-agent/agent ./apps/growth-agent/agent
COPY --from=builder --chown=allok:allok /app/apps/growth-agent/evals ./apps/growth-agent/evals

# The whole tree, not just sharp/ and @img/: sharp needs detect-libc, color and
# semver beside it. NODE_PATH is not enough — Next resolves sharp from its own
# module context, so it has to sit in the app's node_modules. The extra entries
# are tiny leaf utilities.
# Both copies must go: Next resolves sharp through the traced .pnpm/ path,
# and that one has no @img/* binaries, so it silently serves originals.
RUN rm -rf node_modules/sharp node_modules/.pnpm/sharp@*
COPY --from=sharp --chown=allok:allok /sharp/node_modules/. ./node_modules/

USER allok
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
