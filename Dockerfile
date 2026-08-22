# Imagen de producción de allok para Coolify.
#
# Se construye FUERA del VPS (GitHub Actions) y Coolify hace pull: la caja tiene
# 2 vCPU compartidos con n8n y los gateways WAHA, y un build de Next les compite
# el CPU a sesiones de WhatsApp que están vivas.

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

# --- dependencias -----------------------------------------------------------
FROM base AS deps
WORKDIR /app
# Es un workspace: sin pnpm-workspace.yaml, pnpm no ve los `overrides` que sí
# están en el lockfile y --frozen-lockfile aborta por desajuste.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/growth-agent/package.json ./apps/growth-agent/
RUN pnpm install --frozen-lockfile

# --- build ------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Las NEXT_PUBLIC_* se hornean en el bundle durante `next build`, así que tienen
# que existir ACÁ y no en runtime. Las demás variables (Meta, Stripe, base de
# datos) se leen en cada request y viven sólo en Coolify.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# --- runtime ----------------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# `standalone` no copia estos dos por diseño: asume un CDN delante. Acá no hay
# CDN propio, así que los sirve el mismo server.js.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# El webhook de Meta encola el evento y lo procesa en after(), después de haber
# respondido. Next termina esos callbacks al recibir SIGTERM, así que Coolify
# necesita un drenado de 10-30s o un redeploy corta el procesamiento a la mitad.
STOPSIGNAL SIGTERM

CMD ["node", "server.js"]
