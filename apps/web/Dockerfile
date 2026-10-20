# Build context: repository root (bun workspace).
#   docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com -t seapedia-web .
FROM oven/bun:1.4.2-alpine AS deps
WORKDIR /repo
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY packages/platform/package.json packages/platform/
COPY infra/seed/package.json infra/seed/
COPY services/identity/package.json services/identity/
COPY services/catalog/package.json services/catalog/
COPY services/commerce/package.json services/commerce/
COPY services/search/package.json services/search/
RUN bun install --frozen-lockfile --filter @seapedia/web

# ── Local development: Vite dev server with HMR (used by docker-compose.yml) ─
FROM deps AS dev
COPY apps/web apps/web
WORKDIR /repo/apps/web
EXPOSE 5173
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]

# ── Production build: VITE_* values are baked into the bundle ────────────────
FROM deps AS build
ARG VITE_API_URL
ARG VITE_APP_URL
ENV VITE_API_URL=$VITE_API_URL VITE_APP_URL=$VITE_APP_URL
COPY apps/web apps/web
WORKDIR /repo/apps/web
RUN bun run build

# ── Release: static files behind nginx ───────────────────────────────────────
FROM nginx:1.30.5-alpine AS release
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
