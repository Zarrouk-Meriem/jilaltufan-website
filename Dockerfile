# Production image — standalone Next output. Build with DOCKER_BUILD=1 so next.config emits it.
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable && corepack prepare pnpm@10.34.5 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DOCKER_BUILD=1 NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_SITE_URL must be present at build time (it is inlined into the client bundle).
ARG NEXT_PUBLIC_SITE_URL=https://jilaltufan.org
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# OG fonts and migrations are read from disk at runtime
COPY --from=builder --chown=nextjs:nodejs /app/src/app/\(frontend\)/api/og/fonts ./src/app/(frontend)/api/og/fonts
COPY --from=builder --chown=nextjs:nodejs /app/src/migrations ./src/migrations
RUN mkdir -p media && chown nextjs:nodejs media
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
