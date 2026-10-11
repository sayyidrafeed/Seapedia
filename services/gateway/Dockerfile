# Build context: repository root (bun workspace). Example:
#   docker build -f services/gateway/Dockerfile -t seapedia-gateway .
FROM oven/bun:1.4.2-alpine AS base
WORKDIR /repo

# ── Dependencies: only this service's production dependency graph ──────────
FROM base AS deps
COPY package.json bun.lock ./
# Every workspace manifest is needed for the frozen lockfile to resolve.
COPY apps/web/package.json apps/web/
COPY packages/platform/package.json packages/platform/
COPY infra/seed/package.json infra/seed/
COPY services/gateway/package.json services/gateway/
COPY services/identity/package.json services/identity/
COPY services/catalog/package.json services/catalog/
COPY services/commerce/package.json services/commerce/
COPY services/search/package.json services/search/
RUN bun install --frozen-lockfile --production --filter @seapedia/gateway

# ── Release ─────────────────────────────────────────────────────────────────
FROM base AS release
ENV NODE_ENV=production PORT=3001
COPY --from=deps /repo /repo
COPY tsconfig.base.json ./
COPY packages/platform packages/platform
COPY services/gateway services/gateway
WORKDIR /repo/services/gateway
USER bun
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:$PORT/healthz" >/dev/null || exit 1
CMD ["bun", "run", "start"]
