FROM oven/bun:1-alpine AS base
WORKDIR /app

# ── Stage 1: production dependencies only ──────────────────────────
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# ── Stage 2: final image ───────────────────────────────────────────
FROM base AS release
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY package.json ./
COPY src ./src
COPY drizzle ./drizzle

EXPOSE 3001
CMD ["bun", "run", "start"]
