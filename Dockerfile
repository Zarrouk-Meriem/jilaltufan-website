# Production image: the standalone Next output (DOCKER_BUILD=1 makes next.config emit it).
#
# Stages
#   deps     pnpm install with the Next patch applied and the flag stylesheet built
#   tools    deps + source, no build — runs migrations and the seed (`docker compose run tools …`)
#   builder  `pnpm build`; needs a migrated database because pages prerender from Payload
#   runner   node + server.js + static assets, unprivileged, ~100 MB of app files
#
# Build it through docker-compose.prod.yml (it wires the database secret and host networking):
#   BUILD_DATABASE_URL=postgresql://… docker compose --env-file .env.prod -f docker-compose.prod.yml build
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable && corepack prepare pnpm@10.34.5 --activate
ENV NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--no-deprecation

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
COPY patches ./patches
# postinstall builds public/flags/flag-icons.css from country-flag-icons
COPY scripts/sync-flags.mjs ./scripts/sync-flags.mjs
RUN pnpm install --frozen-lockfile

FROM deps AS tools
COPY . .
ENV NODE_ENV=production
# `payload:tsx` runs Payload's CLI under tsx's sync hooks; the bare CLI can exit 0 halfway (CLAUDE.md)
CMD ["pnpm", "payload:tsx", "migrate"]

FROM deps AS builder
COPY . .
ENV DOCKER_BUILD=1
# Inlined into the client bundle, so it has to be right at build time.
ARG NEXT_PUBLIC_SITE_URL=https://jilaltufan.org
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# Prerendering initialises Payload: it needs a reachable, migrated database (passed as a
# BuildKit secret so the URL is never stored in a layer) and any secret string. The
# placeholder below exists only in this stage; the runtime secret comes from the env file.
RUN --mount=type=secret,id=database_url \
    DATABASE_URL="$(cat /run/secrets/database_url)" \
    PAYLOAD_SECRET=build-time-placeholder-not-a-secret pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# The OG image route reads its fonts from disk at request time.
COPY --from=builder --chown=nextjs:nodejs "/app/src/app/(frontend)/api/og/fonts" "./src/app/(frontend)/api/og/fonts"
# Upload directories used when S3_* is not set (mounted as volumes by compose).
RUN mkdir -p media application-files && chown nextjs:nodejs media application-files
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/ar || exit 1
CMD ["node", "server.js"]
