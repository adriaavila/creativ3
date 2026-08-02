FROM node:24-alpine AS build

WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/realtime/package.json apps/realtime/package.json
COPY src/lib/realtime-protocol.ts src/lib/realtime-protocol.ts
RUN pnpm install --frozen-lockfile
COPY apps/realtime apps/realtime
RUN pnpm --filter @allok/realtime build
RUN pnpm --filter @allok/realtime deploy --prod /prod
COPY --from=build /app/dist/apps/realtime/src/server.js /prod/dist/apps/realtime/src/server.js

FROM node:24-alpine

WORKDIR /app
COPY --from=build /prod ./
COPY --from=build /app/dist/apps/realtime/src/server.js ./dist/apps/realtime/src/server.js

ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/apps/realtime/src/server.js"]
