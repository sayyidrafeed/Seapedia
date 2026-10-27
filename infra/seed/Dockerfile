# One-off ops image: wipes and seeds the service databases.
#   docker build -f infra/seed/Dockerfile -t seapedia-seed .
FROM oven/bun:1.4.4-alpine AS deps
WORKDIR /repo
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY packages/platform/package.json packages/platform/
COPY packages/contracts/package.json packages/contracts/
COPY infra/seed/package.json infra/seed/
COPY services/identity/package.json services/identity/
COPY services/catalog/package.json services/catalog/
COPY services/commerce/package.json services/commerce/
COPY services/search/package.json services/search/
RUN bun install --frozen-lockfile --production --filter @seapedia/seed --filter @seapedia/identity \
  --filter @seapedia/commerce

FROM oven/bun:1.4.4-alpine
WORKDIR /repo
COPY --from=deps /repo /repo
COPY tsconfig.base.json ./
COPY packages/platform packages/platform
# The seed writes each service's tables, so it needs their schema definitions (only those).
COPY services/identity/src/db/schema services/identity/src/db/schema
COPY services/commerce/src/db/schema services/commerce/src/db/schema
COPY infra/seed infra/seed
WORKDIR /repo/infra/seed
USER bun
CMD ["bun", "run", "seed"]
