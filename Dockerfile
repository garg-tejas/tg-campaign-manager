# Use Node.js LTS version
FROM node:24.22.1-alpine3.24 AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies based on package manager
RUN \
    if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm i --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
    npm ci; \
    else \
    npm install; \
    fi

# Rebuild the source code only when needed
FROM base AS builder
# Install build tools for native modules
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Rebuild better-sqlite3 for the target platform
RUN \
    if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm rebuild better-sqlite3; \
    else \
    npm rebuild better-sqlite3; \
    fi

# Build the application
RUN \
    mkdir -p /tmp/campaign-build && \
    if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && \
    CAMPAIGN_DATABASE_PATH=/tmp/campaign-build/check.db REDIS_HOST=127.0.0.1 REDIS_PORT=1 TELEGRAM_BOT_TOKEN= pnpm run build; \
    else \
    CAMPAIGN_DATABASE_PATH=/tmp/campaign-build/check.db REDIS_HOST=127.0.0.1 REDIS_PORT=1 TELEGRAM_BOT_TOKEN= npm run build; \
    fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from standalone build
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy better-sqlite3 native bindings (required for serverExternalPackages)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Create data directory for SQLite
RUN mkdir -p /app/data/media && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
