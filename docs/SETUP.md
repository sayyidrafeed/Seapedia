# Seapedia setup

Two ways to run Seapedia locally:

- **Development**: Postgres and Elasticsearch in Docker, the apps on the host with hot reload.
- **Production-like**: every service built from its production image, with the memory limits
  planned for the server. Use this before deploying.

Deployment to the server is in [DEPLOYMENT.md](./DEPLOYMENT.md). The architecture is in
[architecture/overview.md](./architecture/overview.md).

## Prerequisites

- [Bun](https://bun.sh) 1.4.2 (the version in `.github/workflows/ci.yml` and the Dockerfiles)
- Docker with Compose v2, and at least 3 GB of memory for Docker (Elasticsearch uses about 0.9 GB)

## Development

```bash
bun install
docker compose up -d                 # Postgres (identity, catalog, commerce databases) + Elasticsearch
for d in services/* infra/seed apps/web; do cp -n "$d/.env.example" "$d/.env"; done
bun run dev                          # all services and the web app, with hot reload
```

`bun run dev` starts each service's `bun --hot src/index.ts` and the Vite dev server:

| App | URL |
| --- | --- |
| Web | http://localhost:5173 |
| Gateway (public API, `/docs`) | http://localhost:3001 |
| identity, catalog, commerce, search | ports 4001 to 4004 (internal, require the token) |

Databases start empty. Each service applies its migrations with `bun run start`; in development,
run them once, then seed:

```bash
for s in identity catalog commerce; do (cd services/$s && bun run db:migrate); done
bun run seed      # wipes the three databases, inserts demo data, rebuilds the search index
```

Demo accounts are listed in [SEED-DATA.md](./SEED-DATA.md); every password is `password123`.

To work without Elasticsearch, leave `SEARCH_SERVICE_URL` empty in `services/catalog/.env`.
Product search then uses the database.

## Production-like stack

```bash
cp .env.prod.example .env.prod.local     # fill in the secrets (openssl rand -hex 32)
docker compose -f docker-compose.prod.yml --env-file .env.prod.local up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.prod.local --profile tools run --rm seed
bun run smoke                            # end-to-end checks through the gateway
bun run smoke -- --resilience            # also stops Elasticsearch and catalog to test fallbacks
```

The web app is on `WEB_PORT` (default 8080) and the gateway on 3001. `docker stats` shows memory
use per container; the measured numbers are in [DEPLOYMENT.md](./DEPLOYMENT.md#memory-budget).

## Environment variables

Each service validates its environment at startup (`src/env.ts`) and has a `.env.example`.

| Variable | Used by | Meaning |
| --- | --- | --- |
| `INTERNAL_API_TOKEN` | all services | shared secret for service-to-service calls (16+ chars) |
| `DATABASE_URL` | identity, catalog, commerce | the service's own database |
| `JWT_SECRET` | identity | signs session cookies |
| `IDENTITY_SERVICE_URL`, `CATALOG_SERVICE_URL`, `COMMERCE_SERVICE_URL` | gateway and peers | internal base URLs |
| `SEARCH_SERVICE_URL`, `SEARCH_TIMEOUT_MS` | catalog | optional search service (default timeout 500 ms) |
| `ELASTICSEARCH_URL`, `ELASTICSEARCH_USERNAME`, `ELASTICSEARCH_PASSWORD` | search | Elasticsearch connection |
| `OUTBOX_POLL_INTERVAL_MS` | catalog, commerce, search | how often consumers pull events (default 2000) |
| `FRONTEND_URL` | gateway | comma-separated origins allowed by CORS |
| `PUBLIC_API_URL` | gateway | URL advertised in the OpenAPI document |
| `SESSION_CACHE_TTL_MS` | gateway | session introspection cache (default 5000) |
| `R2_*` | identity, catalog | Cloudflare R2 for image uploads (optional locally) |
| `VITE_API_URL`, `VITE_APP_URL` | web (build time) | gateway URL and the app's own URL |

## Commands

| Command | What it does |
| --- | --- |
| `bun run check` | type-check every workspace |
| `bun run fl` | format and lint every workspace |
| `bun run test` | unit tests of the services and `packages/platform` |
| `bun run seed` | wipe and seed the three databases |
| `bun run smoke` | end-to-end checks against a running stack |
| `cd services/<svc> && bun run db:generate` | create a migration for that service |
| `cd apps/web && bun run openapi:generate` | regenerate the web SDK from the gateway (must be running) |
